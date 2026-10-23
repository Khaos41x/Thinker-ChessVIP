const childProcess = require("child_process");
const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");

const root = path.resolve(__dirname, "..");
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const geometryExpression = `(() => {
  const selectors = {
    workspace:"#oi-wrapper", assistant:"#krypbot-container", core:".kb-core-module",
    visuals:".kb-visuals-module", engine:".kb-engine-module", autoPlay:".kb-auto-play-module",
    scout:"#oi-zone2", coreTitle:".kb-core-module .kb-console-caption",
    engineTitle:".kb-engine-module .kb-console-caption", scoutTitle:"#oi-zone2 .tc-scout-title",
    duration:"#kb-session-duration", minWins:"#kb-session-min-rate", maxWins:"#kb-session-max-rate",
    start:"#kb-session-start", finish:"#kb-session-stop", export:"#kb-session-export",
    status:".kb-session-status-item:nth-child(1)", stats:".kb-session-status-item:nth-child(3)", minDelay:"#minDelayInput",
    maxDelay:"#maxDelayInput", strength:"#kb-elo-slider", theme:"#kb-color-picker"
  };
  const values = {};
  for (const [name, selector] of Object.entries(selectors)) {
    const node = document.querySelector(selector);
    if (!node) { values[name] = null; continue; }
    const rect = node.getBoundingClientRect();
    values[name] = { x:Math.round(rect.x * 100) / 100, y:Math.round(rect.y * 100) / 100, width:Math.round(rect.width * 100) / 100, height:Math.round(rect.height * 100) / 100, right:Math.round(rect.right * 100) / 100, bottom:Math.round(rect.bottom * 100) / 100 };
  }
  const wrapper = document.getElementById("oi-wrapper");
  values.viewport = { width:innerWidth, height:innerHeight, scrollWidth:document.documentElement.scrollWidth, injectionWidth:wrapper?.getBoundingClientRect().width || 0, layoutMode:wrapper?.dataset.layoutMode || "" };
  return values;
})()`;

const polishMetricsExpression = `(() => {
  const round = (value) => Math.round(value * 100) / 100;
  const rgba = (value) => {
    const parts = (value.match(/[\\d.]+/g) || []).map(Number);
    return { r:parts[0] || 0, g:parts[1] || 0, b:parts[2] || 0, a:parts.length > 3 ? parts[3] : 1 };
  };
  const composite = (front, back) => ({ r:front.r * front.a + back.r * (1-front.a), g:front.g * front.a + back.g * (1-front.a), b:front.b * front.a + back.b * (1-front.a), a:1 });
  const luminance = ({r,g,b}) => .2126 * [r,g,b].map((v) => { const s=v/255; return s <= .03928 ? s/12.92 : Math.pow((s+.055)/1.055,2.4); })[0]
    + .7152 * [r,g,b].map((v) => { const s=v/255; return s <= .03928 ? s/12.92 : Math.pow((s+.055)/1.055,2.4); })[1]
    + .0722 * [r,g,b].map((v) => { const s=v/255; return s <= .03928 ? s/12.92 : Math.pow((s+.055)/1.055,2.4); })[2];
  const opaqueBackground = (node) => {
    if (!node) return {r:255,g:255,b:255,a:1};
    const own=rgba(getComputedStyle(node).backgroundColor);
    const behind=node.parentElement ? opaqueBackground(node.parentElement) : {r:255,g:255,b:255,a:1};
    return composite(own, behind);
  };
  const nodeRect = (node) => {
    if (!node) return null;
    const box = node.getBoundingClientRect();
    return { x:round(box.x), y:round(box.y), width:round(box.width), height:round(box.height), right:round(box.right), bottom:round(box.bottom) };
  };
  const rect = (selector) => {
    const node = document.querySelector(selector);
    return nodeRect(node);
  };
  const font = (selector) => {
    const node = document.querySelector(selector);
    if (!node) return null;
    const style = getComputedStyle(node);
    const background=opaqueBackground(node);
    const foreground=composite(rgba(style.color), background);
    const a=luminance(foreground); const b=luminance(background);
    return { fontSize:style.fontSize, lineHeight:style.lineHeight, color:style.color, backgroundColor:style.backgroundColor, contrast:round((Math.max(a,b)+.05)/(Math.min(a,b)+.05)) };
  };
  const buttonStates = (selector) => {
    const node=document.querySelector(selector);
    const disabled=node.hasAttribute("disabled"); const aria=node.getAttribute("aria-disabled");
    node.removeAttribute("disabled"); node.setAttribute("aria-disabled", "false"); const enabled=font(selector);
    node.setAttribute("disabled", ""); node.setAttribute("aria-disabled", "true"); const unavailable=font(selector);
    node.toggleAttribute("disabled", disabled);
    if (aria === null) node.removeAttribute("aria-disabled"); else node.setAttribute("aria-disabled", aria);
    return { enabled, disabled:unavailable };
  };
  const contentEdges = (selector) => {
    const node=document.querySelector(selector); const box=node.getBoundingClientRect(); const style=getComputedStyle(node);
    return { left:round(box.left + Number.parseFloat(style.borderLeftWidth) + Number.parseFloat(style.paddingLeft)), right:round(box.right - Number.parseFloat(style.borderRightWidth) - Number.parseFloat(style.paddingRight)) };
  };
  const status = Array.from(document.querySelectorAll(".kb-session-status-item")).map((item) => ({
    label:item.querySelector("span")?.textContent || "",
    labelRect:nodeRect(item.querySelector("span")),
    value:item.querySelector("strong")?.textContent || "",
    valueRect:nodeRect(item.querySelector("strong")),
  }));
  const sliderNode = document.querySelector("#kb-elo-slider");
  const sliderStyle = sliderNode ? getComputedStyle(sliderNode) : null;
  const sliderRect = sliderNode?.getBoundingClientRect() || null;
  const sliderPaddingLeft = Number.parseFloat(sliderStyle?.paddingLeft || "0");
  const sliderPaddingRight = Number.parseFloat(sliderStyle?.paddingRight || "0");
  const swatchNode = document.querySelector("#kb-color-picker");
  const swatchStyle = swatchNode ? getComputedStyle(swatchNode) : null;
  const statusNode = document.querySelector("#oi-zone2 .tc-scout-status");
  const dotNode = document.querySelector("#oi-zone2 .tc-scout-status-dot");
  const dotStyle = dotNode ? getComputedStyle(dotNode) : getComputedStyle(statusNode, "::before");
  const hint = rect("#kb-run-delay-hint");
  const smart = document.querySelector(".kb-engine-module #sp-on")?.closest(".kb-section") || null;
  const smartStyle = smart ? getComputedStyle(smart) : null;
  const autoPlayContent=contentEdges(".kb-auto-play-module");
  const engineContent=contentEdges(".kb-engine-module");
  return {
    content:{ autoPlayLeft:autoPlayContent.left, autoPlayRight:autoPlayContent.right, engineLeft:engineContent.left, engineRight:engineContent.right },
    status,
    slider:{
      rect:sliderRect ? { x:round(sliderRect.x), y:round(sliderRect.y), width:round(sliderRect.width), height:round(sliderRect.height), right:round(sliderRect.right) } : null,
      paddingLeft:sliderPaddingLeft,
      paddingRight:sliderPaddingRight,
      trackLeft:sliderRect ? round(sliderRect.left + sliderPaddingLeft) : null,
      trackRight:sliderRect ? round(sliderRect.right - sliderPaddingRight) : null,
      minLabel:rect(".kb-strength-limits span:first-child"),
      maxLabel:rect(".kb-strength-limits span:last-child"),
    },
    swatch:{ rect:rect("#kb-color-picker"), borderWidth:swatchStyle?.borderWidth || "", borderColor:swatchStyle?.borderColor || "", inputBorderColor:getComputedStyle(document.querySelector(".kb-delay-input")).borderColor, padding:swatchStyle?.padding || "" },
    scout:{ dotWidth:dotStyle.width, dotHeight:dotStyle.height, dotColor:dotStyle.backgroundColor, text:document.querySelector("#oi-zone2 .tc-scout-status")?.textContent?.trim() || "", detail:document.querySelector("#oi-zone2 .tc-scout-empty-detail")?.textContent?.trim() || "" },
    divider:{ hintBottom:hint?.bottom || null, smartTop:smart ? round(smart.getBoundingClientRect().top) : null, borderTopWidth:smartStyle?.borderTopWidth || "", borderTopColor:smartStyle?.borderTopColor || "", backgroundImage:smartStyle?.backgroundImage || "", tokenColor:getComputedStyle(document.querySelector(".kb-strength-card")).borderTopColor, engineHeight:round(document.querySelector(".kb-engine-module").getBoundingClientRect().height) },
    typography:{
      start:font("#kb-session-start"), finish:font("#kb-session-stop"), export:font("#kb-session-export"),
      random:font("label[for='dm-rand']"), immediate:font("label[for='dm-max']"), current:font(".kb-strength-current"),
      suffix:font(".kb-delay-unit"), minLabel:font(".kb-strength-limits span:first-child"), maxLabel:font(".kb-strength-limits span:last-child"),
    },
    buttonStates:{ start:buttonStates("#kb-session-start"), finish:buttonStates("#kb-session-stop"), export:buttonStates("#kb-session-export") },
  };
})()`;

const roundThreeMetricsExpression = `(() => {
  const round = (value) => Math.round(value * 100) / 100;
  const box = (node) => {
    if (!node) return null;
    const value=node.getBoundingClientRect();
    return { x:round(value.x), y:round(value.y), width:round(value.width), height:round(value.height), right:round(value.right), bottom:round(value.bottom) };
  };
  const style = (node, pseudo) => {
    if (!node) return null;
    const value=getComputedStyle(node, pseudo);
    return { fontSize:value.fontSize, fontWeight:value.fontWeight, color:value.color, lineHeight:value.lineHeight, fontVariantNumeric:value.fontVariantNumeric, backgroundColor:value.backgroundColor, display:value.display, alignItems:value.alignItems };
  };
  const rgb = (value) => (value.match(/[\\d.]+/g) || []).slice(0,3).map(Number);
  const luminance = (values) => { const channels=values.map((value) => { const part=value/255; return part <= .03928 ? part/12.92 : Math.pow((part+.055)/1.055,2.4); }); return .2126*channels[0]+.7152*channels[1]+.0722*channels[2]; };
  const contrast = (foreground, background) => { const a=luminance(rgb(foreground)); const b=luminance(rgb(background)); return round((Math.max(a,b)+.05)/(Math.min(a,b)+.05)); };
  const status=document.querySelector("#oi-zone2[data-state='waiting'] .tc-scout-status");
  const dot=status?.querySelector(".tc-scout-status-dot") || null;
  const pseudo=style(status, "::before");
  const panel=document.getElementById("oi-zone2");
  const panelBackground=getComputedStyle(panel).backgroundColor;
  const dotColor=dot ? getComputedStyle(dot).backgroundColor : pseudo?.backgroundColor || "";
  const current=document.querySelector(".kb-strength-current");
  const currentValue=document.getElementById("kb-elo-val");
  const timing=document.getElementById("autoDelayDisplay");
  const suffix=document.querySelector(".kb-delay-unit");
  const rightItems=Array.from(document.querySelectorAll(".kb-session-status-item-right"));
  return {
    scout:{ statusRect:box(status), textRect:box(status?.querySelector(".tc-scout-status-text")), dotRect:box(dot), dotSource:dot ? "element" : "pseudo", dotWidth:dot ? box(dot).width : Number.parseFloat(pseudo?.width || "0"), dotHeight:dot ? box(dot).height : Number.parseFloat(pseudo?.height || "0"), dotColor, panelBackground, contrast:contrast(dotColor,panelBackground), statusStyle:style(status) },
    headings:{ current:style(current), currentValue:style(currentValue), timing:style(timing), suffix:style(suffix) },
    statusRight:rightItems.map((item) => ({ label:item.querySelector("span")?.textContent || "", labelRect:box(item.querySelector("span")), value:item.querySelector("strong")?.textContent || "", valueRect:box(item.querySelector("strong")) })),
  };
})()`;

const toggleAlignmentMetricsExpression = `(async () => {
  const definitions = [
    ["Bot", "st-on", "st-off"],
    ["Auto Moves", "am-on", "am-off"],
    ["Auto Queue", "aq-on", "aq-off"],
    ["Auto Rating", "aa-on", "aa-off"],
    ["Evaluation Bar", "eb-on", "eb-off"],
    ["Smart Pacing", "sp-on", "sp-off"],
  ];
  const round = (value) => Math.round(value * 100) / 100;
  const settle = (group) => {
    void group.offsetWidth;
    for (const animation of group.getAnimations({ subtree:true })) {
      try { animation.finish(); } catch (_error) {}
    }
  };
  const rect = (value) => ({ top:round(value.top), bottom:round(value.bottom), left:round(value.left), right:round(value.right), width:round(value.width), height:round(value.height) });
  const transformOffset = (transform) => {
    if (!transform || transform === "none") return { x:0, y:0 };
    const values=(transform.match(/[-0-9.]+/g) || []).map(Number);
    return transform.startsWith("matrix3d") ? { x:values[12] || 0, y:values[13] || 0 } : { x:values[4] || 0, y:values[5] || 0 };
  };
  const read = (group, state) => {
    const trackBox=group.getBoundingClientRect();
    const trackStyle=getComputedStyle(group);
    const border={ top:Number.parseFloat(trackStyle.borderTopWidth), bottom:Number.parseFloat(trackStyle.borderBottomWidth), left:Number.parseFloat(trackStyle.borderLeftWidth), right:Number.parseFloat(trackStyle.borderRightWidth) };
    const thumb=group.querySelector(".kb-toggle-thumb");
    let thumbBox;
    let source;
    if (thumb) {
      thumbBox=thumb.getBoundingClientRect();
      source="element:getBoundingClientRect";
    } else {
      const style=getComputedStyle(group, "::after");
      const offset=transformOffset(style.transform);
      const top=trackBox.top + Number.parseFloat(style.top) + offset.y;
      const left=trackBox.left + Number.parseFloat(style.left) + offset.x;
      const width=Number.parseFloat(style.width);
      const height=Number.parseFloat(style.height);
      thumbBox={ top, bottom:top+height, left, right:left+width, width, height };
      source="pseudo:computed-style-derived";
    }
    const inner={ top:trackBox.top+border.top, bottom:trackBox.bottom-border.bottom, left:trackBox.left+border.left, right:trackBox.right-border.right };
    const row=group.closest(".kb-section")?.getBoundingClientRect();
    const rowStyle=group.closest(".kb-section") ? getComputedStyle(group.closest(".kb-section")) : null;
    const thumbStyle=thumb ? getComputedStyle(thumb) : getComputedStyle(group, "::after");
    return {
      state,
      source,
      track:rect(trackBox),
      thumb:rect(thumbBox),
      border,
      innerSpace:{ above:round(thumbBox.top-inner.top), below:round(inner.bottom-thumbBox.bottom), left:round(thumbBox.left-inner.left), right:round(inner.right-thumbBox.right) },
      verticalDifference:round(Math.abs((thumbBox.top-inner.top)-(inner.bottom-thumbBox.bottom))),
      rowHeight:round(row?.height || 0),
      row:row ? rect(row) : null,
      rowBorder:{ top:Number.parseFloat(rowStyle?.borderTopWidth || "0"), bottom:Number.parseFloat(rowStyle?.borderBottomWidth || "0") },
      trackRight:round(trackBox.right),
      styles:{ display:trackStyle.display, alignItems:trackStyle.alignItems, boxSizing:trackStyle.boxSizing, transform:thumbStyle.transform, top:thumbStyle.top, margin:thumbStyle.margin },
      integerGeometry:[trackBox.top,trackBox.bottom,trackBox.right,trackBox.width,trackBox.height,thumbBox.top,thumbBox.bottom,thumbBox.left,thumbBox.right,thumbBox.width,thumbBox.height,row?.height || 0].every(Number.isInteger),
    };
  };
  const output={};
  for (const [name,onId,offId] of definitions) {
    const on=document.getElementById(onId); const off=document.getElementById(offId); const group=on?.closest(".kb-radio-group");
    if (!on || !off || !group) { output[name]={ missing:true }; continue; }
    const original=on.checked ? "on" : "off";
    off.checked=true; settle(group); const offMetrics=read(group,"off");
    on.checked=true; settle(group); const onMetrics=read(group,"on");
    (original === "on" ? on : off).checked=true; settle(group);
    output[name]={ off:offMetrics, on:onMetrics };
  }
  return output;
})()`;

const segmentedFooterMetricsExpression = `(() => {
  const round = (value) => Math.round(value * 100) / 100;
  const box = (node) => {
    const value=node.getBoundingClientRect();
    return { top:round(value.top), bottom:round(value.bottom), left:round(value.left), right:round(value.right), width:round(value.width), height:round(value.height) };
  };
  const rgb = (value) => (value.match(/[0-9.]+/g) || []).slice(0,3).map(Number);
  const luminance = (values) => { const channels=values.map((value) => { const part=value/255; return part <= .03928 ? part/12.92 : Math.pow((part+.055)/1.055,2.4); }); return .2126*channels[0]+.7152*channels[1]+.0722*channels[2]; };
  const contrast = (foreground, background) => { const a=luminance(rgb(foreground)); const b=luminance(rgb(background)); return round((Math.max(a,b)+.05)/(Math.min(a,b)+.05)); };
  const group=document.querySelector(".kb-timing-mode");
  const random=document.querySelector("label[for='dm-rand']");
  const immediate=document.querySelector("label[for='dm-max']");
  const randomInput=document.getElementById("dm-rand");
  const immediateInput=document.getElementById("dm-max");
  const card=group.closest(".kb-run-delay-card");
  const previousFocus=document.activeElement;
  const original=randomInput.checked ? "random" : "immediate";
  const originalInactive=card.dataset.inactive;
  const settle = () => { void group.offsetWidth; for (const animation of group.getAnimations({ subtree:true })) { try { animation.finish(); } catch (_error) {} } };
  const readOption = (node) => { const style=getComputedStyle(node); return { rect:box(node), backgroundColor:style.backgroundColor, color:style.color, fontSize:style.fontSize, lineHeight:style.lineHeight, display:style.display, alignItems:style.alignItems, justifyContent:style.justifyContent, borderRadius:style.borderRadius, contrast:contrast(style.color,style.backgroundColor) }; };
  const readState = (state) => {
    const style=getComputedStyle(group); const rect=box(group);
    const border={ top:Number.parseFloat(style.borderTopWidth), bottom:Number.parseFloat(style.borderBottomWidth), left:Number.parseFloat(style.borderLeftWidth), right:Number.parseFloat(style.borderRightWidth) };
    const inner={ top:round(rect.top+border.top), bottom:round(rect.bottom-border.bottom), left:round(rect.left+border.left), right:round(rect.right-border.right) };
    const randomOption=readOption(random); const immediateOption=readOption(immediate);
    return { state, container:rect, inner, border, padding:style.padding, gap:style.gap, overflow:style.overflow, borderRadius:style.borderRadius, backgroundColor:style.backgroundColor, random:randomOption, immediate:immediateOption,
      coverage:{ top:round(Math.min(randomOption.rect.top,immediateOption.rect.top)-inner.top), bottom:round(inner.bottom-Math.max(randomOption.rect.bottom,immediateOption.rect.bottom)), left:round(randomOption.rect.left-inner.left), right:round(inner.right-immediateOption.rect.right), between:round(immediateOption.rect.left-randomOption.rect.right) },
      integerGeometry:[rect.top,rect.bottom,rect.left,rect.right,rect.width,rect.height,randomOption.rect.top,randomOption.rect.bottom,randomOption.rect.left,randomOption.rect.right,randomOption.rect.width,randomOption.rect.height,immediateOption.rect.top,immediateOption.rect.bottom,immediateOption.rect.left,immediateOption.rect.right,immediateOption.rect.width,immediateOption.rect.height].every(Number.isInteger) };
  };
  card.dataset.inactive="true";
  randomInput.checked=true; settle(); const randomState=readState("random");
  immediateInput.checked=true; settle(); const immediateState=readState("immediate");
  card.dataset.inactive="false";
  randomInput.checked=true; settle(); const activeRandomState=readState("active-random");
  immediateInput.checked=true; settle(); const activeImmediateState=readState("active-immediate");
  const beforeFocus=box(group); const borderColorBeforeFocus=getComputedStyle(group).borderTopColor; randomInput.focus(); const afterFocus=box(group); const computedFocusStyle=getComputedStyle(group); const focusStyle={ borderColorBefore:borderColorBeforeFocus, borderColorAfter:computedFocusStyle.borderTopColor, activeElement:document.activeElement?.id || "" };
  (original === "random" ? randomInput : immediateInput).checked=true; settle();
  card.dataset.inactive=originalInactive;
  if (previousFocus && previousFocus !== document.body && typeof previousFocus.focus === "function") previousFocus.focus();
  else randomInput.blur();
  const status=document.querySelector(".kb-session-status"); const panel=document.querySelector(".kb-auto-play-module");
  const statusRect=box(status); const panelRect=box(panel); const panelStyle=getComputedStyle(panel); const statusStyle=getComputedStyle(status);
  const panelContent={ left:round(panelRect.left+Number.parseFloat(panelStyle.borderLeftWidth)+Number.parseFloat(panelStyle.paddingLeft)), right:round(panelRect.right-Number.parseFloat(panelStyle.borderRightWidth)-Number.parseFloat(panelStyle.paddingRight)) };
  return { segmented:{ random:randomState, immediate:immediateState, activeRandom:activeRandomState, activeImmediate:activeImmediateState }, focus:{ before:beforeFocus, after:afterFocus, ...focusStyle }, footer:{ rect:statusRect, panelContent, borderTopWidth:statusStyle.borderTopWidth, borderTopColor:statusStyle.borderTopColor, borderRadius:statusStyle.borderRadius, overflow:statusStyle.overflow, panelHeight:panelRect.height, edgeDifference:{ left:round(statusRect.left-panelContent.left), right:round(panelContent.right-statusRect.right) } } };
})()`;

const hideFixtureDecorationsExpression = `(() => {
  for (const node of document.querySelectorAll(".chess-navigation, .ad-rail")) node.style.setProperty("display", "none", "important");
})()`;
const restoreFixtureDecorationsExpression = `(() => {
  for (const node of document.querySelectorAll(".chess-navigation, .ad-rail")) node.style.removeProperty("display");
})()`;

const layoutAuditExpression = `(() => {
  const q = (selector) => document.querySelector(selector);
  const rect = (selector) => q(selector)?.getBoundingClientRect() || null;
  const integerRect = (value) => value && [value.x,value.y,value.width,value.height,value.right,value.bottom].every(Number.isInteger);
  const wrapper = rect("#oi-wrapper");
  const core = rect(".kb-core-module");
  const visuals = rect(".kb-visuals-module");
  const engine = rect(".kb-engine-module");
  const autoPlay = rect(".kb-auto-play-module");
  const scout = rect("#oi-zone2");
  const layoutMode = q("#oi-wrapper")?.dataset.layoutMode || "";
  const desktop = (wrapper?.width || 0) >= 1034;
  const titleSelectors = [".kb-core-module .kb-console-caption", ".kb-visuals-module .kb-console-caption", ".kb-engine-module .kb-console-caption", ".kb-auto-play-module .kb-console-caption", "#oi-zone2 .tc-scout-title"];
  const titles = titleSelectors.map((selector) => {
    const node = q(selector); const box = node?.getBoundingClientRect(); const style = node ? getComputedStyle(node) : null;
    return node ? { y:box.y, height:box.height, fontSize:style.fontSize, lineHeight:style.lineHeight, fontWeight:style.fontWeight, color:style.color, letterSpacing:style.letterSpacing } : null;
  });
  const contentRight = (panel) => panel.right - 13;
  const visibleRows = Array.from(document.querySelectorAll(".kb-console-module .kb-section")).filter((node) => getComputedStyle(node).display !== "none" && node.getClientRects().length > 0).map((node) => node.getBoundingClientRect().height);
  const aligned = (values, target) => values.every((value) => Math.abs(value - target) < .01);
  const rightEdges = {
    core:Array.from(document.querySelectorAll(".kb-core-module .kb-radio-group")).map((node) => node.getBoundingClientRect().right),
    visuals:[rect(".kb-visuals-module .kb-radio-group")?.right,rect("#kb-color-picker")?.right].filter(Number.isFinite),
    engine:[rect(".kb-delay-input:last-of-type")?.right,rect("#kb-elo-slider")?.right,rect(".kb-engine-module .kb-radio-group:not(:has(input[name='delayMode']))")?.right].filter(Number.isFinite),
    autoPlay:[rect("#kb-session-max-rate")?.right,rect("#kb-session-export")?.right,rect(".kb-session-status")?.right].filter(Number.isFinite),
  };
  const waiting = q("#oi-zone2[data-state='waiting'] .tc-scout-status");
  const waitingInteractive = Boolean(waiting?.closest("button,a,[role='button']") || waiting?.onclick || waiting?.hasAttribute("tabindex"));
  const hint = q("#kb-run-delay-hint");
  const hintStyle = hint ? getComputedStyle(hint) : null;
  const rgb = (text) => (text.match(/[\\d.]+/g) || []).slice(0,3).map(Number);
  const luminance = (values) => { const channels=values.map((v) => { const s=v/255; return s <= .03928 ? s/12.92 : Math.pow((s+.055)/1.055,2.4); }); return .2126*channels[0]+.7152*channels[1]+.0722*channels[2]; };
  const contrast = hintStyle ? (() => { const a=luminance(rgb(hintStyle.color)); const b=luminance(rgb(hintStyle.backgroundColor === "rgba(0, 0, 0, 0)" ? getComputedStyle(hint.parentElement).backgroundColor : hintStyle.backgroundColor)); return (Math.max(a,b)+.05)/(Math.min(a,b)+.05); })() : 0;
  const layoutRects = [wrapper,core,visuals,engine,autoPlay,scout,rect("#kb-session-duration"),rect("#kb-session-min-rate"),rect("#kb-session-max-rate"),rect("#kb-session-start"),rect("#kb-session-stop"),rect("#kb-session-export"),rect("#minDelayInput"),rect("#maxDelayInput"),rect("#kb-elo-slider"),rect("#kb-color-picker")];
  const result = {
    viewport:innerWidth, injectionWidth:wrapper?.width || 0, layoutMode, desktop,
    margins:{ left:wrapper?.left || 0, right:innerWidth-(wrapper?.right || 0), topInset:(core?.top || 0)-(wrapper?.top || 0) },
    bottoms:{ visualsEngine:(visuals?.bottom || 0)-(engine?.bottom || 0), scoutAutoPlay:(scout?.bottom || 0)-(autoPlay?.bottom || 0) },
    gaps:desktop ? { horizontal:(engine?.left || 0)-(core?.right || 0), vertical:(autoPlay?.top || 0)-(engine?.bottom || 0), scout:(scout?.left || 0)-(engine?.right || 0) } : null,
    titles, rows:visibleRows, rightEdges, waitingInteractive,
    hint:{ fontSize:hintStyle?.fontSize || "", contrast },
    integerRects:layoutRects.every(integerRect), horizontalOverflow:q("#oi-wrapper").scrollWidth > q("#oi-wrapper").clientWidth,
  };
  result.ok = Math.abs(result.margins.left-result.margins.right) < .01 && result.margins.topInset === 12
    && layoutMode === (desktop ? "desktop" : "stacked") && !result.horizontalOverflow && result.integerRects
    && titles.every(Boolean) && titles.every((title) => title.height === titles[0].height && title.fontSize === titles[0].fontSize && title.lineHeight === titles[0].lineHeight && title.fontWeight === titles[0].fontWeight && title.color === titles[0].color)
    && visibleRows.every((height) => height === 36) && !waitingInteractive
    && Number.parseFloat(result.hint.fontSize) >= 11 && result.hint.contrast >= 4.5
    && aligned(rightEdges.core,contentRight(core)) && aligned(rightEdges.visuals,contentRight(visuals)) && aligned(rightEdges.engine,contentRight(engine)) && aligned(rightEdges.autoPlay,contentRight(autoPlay))
    && (!desktop || (result.bottoms.visualsEngine === 0 && result.bottoms.scoutAutoPlay === 0 && Object.values(result.gaps).every((gap) => gap === 12)));
  return result;
})()`;

const printGeometryTable = (label, geometry) => {
  console.log(`\n${label}`);
  console.table(Object.entries(geometry).filter(([name]) => name !== "viewport").map(([element, rect]) => ({ element, ...(rect || {}) })));
  console.log(`viewport: ${JSON.stringify(geometry.viewport)}`);
};

async function waitForJson(url, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
    } catch (error) {
      lastError = error;
    }
    await sleep(100);
  }
  throw lastError || new Error(`Timed out waiting for ${url}`);
}

function createCdpClient(webSocketUrl) {
  const socket = new WebSocket(webSocketUrl);
  const pending = new Map();
  const listeners = new Map();
  let nextId = 1;

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
      return;
    }
    for (const listener of listeners.get(message.method) || []) listener(message.params);
  });

  return {
    opened: new Promise((resolve, reject) => {
      socket.addEventListener("open", resolve, { once: true });
      socket.addEventListener("error", reject, { once: true });
    }),
    on(method, listener) {
      if (!listeners.has(method)) listeners.set(method, []);
      listeners.get(method).push(listener);
    },
    send(method, params = {}) {
      const id = nextId++;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        socket.send(JSON.stringify({ id, method, params }));
      });
    },
    close() {
      socket.close();
    },
  };
}

(async () => {
  assert(fs.existsSync(chromePath), "Chrome executable not found");
  const liveChess = process.env.CHESS_LIVE === "1" || process.argv.includes("--live");
  const captureVisual = process.argv.includes("--screenshot");
  const captureBaseline = process.argv.includes("--baseline-screenshot");
  const userscriptRef = process.env.THINKER_USERSCRIPT_REF || "";

  const server = http.createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
    if (pathname === "/script.js" && userscriptRef) {
      const source = childProcess.execFileSync("git", ["show", `${userscriptRef}:script.js`], { cwd: root, encoding: "utf8" });
      response.writeHead(200, { "Content-Type": "text/javascript; charset=utf-8" }).end(source);
      return;
    }
    const filePath = path.resolve(root, `.${pathname}`);
    if (!filePath.startsWith(root + path.sep) || !fs.existsSync(filePath)) {
      response.writeHead(404).end("not found");
      return;
    }
    const type = filePath.endsWith(".js") ? "text/javascript" : "text/html";
    response.writeHead(200, { "Content-Type": `${type}; charset=utf-8` });
    fs.createReadStream(filePath).pipe(response);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const fixturePort = server.address().port;
  const debugPort = 18000 + (process.pid % 1000);
  const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), "thinker-chrome-"));
  const chrome = childProcess.spawn(chromePath, [
    "--headless=new",
    "--disable-gpu",
    "--window-size=1433,900",
    "--no-first-run",
    "--no-default-browser-check",
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profileDir}`,
    "about:blank",
  ], { stdio: "ignore" });

  let client;
  try {
    const tabs = await waitForJson(`http://127.0.0.1:${debugPort}/json/list`);
    const page = tabs.find((tab) => tab.type === "page");
    assert(page?.webSocketDebuggerUrl, "Chrome page target not found");
    client = createCdpClient(page.webSocketDebuggerUrl);
    await client.opened;

    const exceptions = [];
    const consoleErrors = [];
    client.on("Runtime.exceptionThrown", ({ exceptionDetails }) => exceptions.push(exceptionDetails));
    client.on("Runtime.consoleAPICalled", ({ type, args }) => {
      if (type === "error") consoleErrors.push(args.map((item) => item.value || item.description).join(" "));
    });
    await client.send("Runtime.enable");
    await client.send("Page.enable");
    await client.send("Page.navigate", {
      url: liveChess
        ? "https://www.chess.com/play/online"
        : `http://127.0.0.1:${fixturePort}/tests/fixtures/userscript_bootstrap.html?delay=100`,
    });
    await sleep(liveChess ? 8000 : 3500);

    if (liveChess) {
      const userscript = fs.readFileSync(path.join(root, "script.js"), "utf8");
      await client.send("Runtime.evaluate", {
        expression: `window.GM_xmlhttpRequest = (options) => {
          if (options.url?.includes("/config/load")) {
            setTimeout(() => options.onload?.({ status: 200, responseText: "{}" }), 0);
          }
          return { abort() {} };
        };\n${userscript}\n//# sourceURL=thinker-userscript.js`,
      });
      await sleep(3500);
    }

    const result = await client.send("Runtime.evaluate", {
      expression: `(() => {
        const describe = (node) => {
          if (!node) return null;
          const rect = node.getBoundingClientRect();
          const style = getComputedStyle(node);
          return {
            rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
            display: style.display,
            visibility: style.visibility,
            opacity: style.opacity,
            zIndex: style.zIndex,
            position: style.position,
          };
        };
        const ancestors = [];
        for (let node = document.getElementById("krypbot-container"); node && ancestors.length < 7; node = node.parentElement) {
          const details = describe(node);
          ancestors.push({
            tag: node.tagName,
            id: node.id,
            className: typeof node.className === "string" ? node.className : "",
            transform: getComputedStyle(node).transform,
            overflow: getComputedStyle(node).overflow,
            ...details,
          });
        }
        const board = document.querySelector("wc-chess-board, chess-board, #board-single, .board, .chess-board, [class*='board-component']");
        const sidebar = document.querySelector(".play-controller-component:not(.stale-controller)");
        const gameplayBottom = Math.max(board?.getBoundingClientRect().bottom || 0, sidebar?.getBoundingClientRect().bottom || 0) + scrollY;
        const wrapperTop = (document.getElementById("oi-wrapper")?.getBoundingClientRect().top || 0) + scrollY;
        return ({
        readyState: document.readyState,
        menu: Boolean(document.getElementById("krypbot-container")),
        sessionPanel: Boolean(document.getElementById("kb-session-panel")),
        banner: Boolean(document.getElementById("thinker-chess-banner")),
        wrapper: Boolean(document.getElementById("oi-wrapper")),
        documentHeight: Math.max(document.body.scrollHeight, document.documentElement.scrollHeight),
        viewportHeight: window.innerHeight,
        menuDisplay: document.getElementById("krypbot-container")?.style.display || "",
        bannerDisplay: document.getElementById("thinker-chess-banner")?.style.display || "",
        menuLayout: describe(document.getElementById("krypbot-container")),
        menuChildren: Array.from(document.getElementById("krypbot-container")?.children || []).map((node) => ({ id: node.id, className: node.className, height: node.getBoundingClientRect().height, display: getComputedStyle(node).display })),
        bannerLayout: describe(document.getElementById("thinker-chess-banner")),
        ancestors,
        mountError: document.getElementById("kb-ghost-recovery")?.dataset.mountError || "",
        workspaceGap: wrapperTop - gameplayBottom,
        href: location.href,
      });
      })()`,
      returnByValue: true,
    });
    const state = result.result.value;
    if (!liveChess) {
      const defaults = await client.send('Runtime.evaluate', {expression:`(() => ({random:document.getElementById('dm-rand').checked,off:['st-on','am-on','aq-on','aa-on','eb-on','sp-on'].filter(id=>document.getElementById(id)?.checked),banner:document.getElementById('bn-on').checked,recentForm:document.getElementById('rf-on').checked}))()`,returnByValue:true});
      assert(defaults.result.value.random && defaults.result.value.off.length===0 && defaults.result.value.banner && defaults.result.value.recentForm, `Unsafe defaults: ${JSON.stringify(defaults.result.value)}`);
    }

    if (captureBaseline) {
      await client.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 778, deviceScaleFactor: 1, mobile: false });
      await client.send("Runtime.evaluate", { expression: "scrollTo(0, Math.max(0, document.getElementById('oi-wrapper').offsetTop - 40))" });
      await sleep(150);
      const geometry = await client.send("Runtime.evaluate", { expression: geometryExpression, returnByValue: true });
      const polishMetrics = await client.send("Runtime.evaluate", { expression: polishMetricsExpression, returnByValue: true });
      const roundThreeMetrics = await client.send("Runtime.evaluate", { expression: roundThreeMetricsExpression, returnByValue: true });
      const toggleMetrics = await client.send("Runtime.evaluate", { expression: toggleAlignmentMetricsExpression, awaitPromise:true, returnByValue:true });
      const segmentedFooterMetrics = await client.send("Runtime.evaluate", { expression: segmentedFooterMetricsExpression, returnByValue:true });
      printGeometryTable("ANTES", geometry.result.value);
      fs.writeFileSync(path.join(root, "tests", "artifacts", "thinker-console-geometry-before.json"), JSON.stringify(geometry.result.value, null, 2));
      fs.writeFileSync(path.join(root, "tests", "artifacts", "thinker-console-polish-before.json"), JSON.stringify(polishMetrics.result.value, null, 2));
      fs.writeFileSync(path.join(root, "tests", "artifacts", "thinker-console-polish-round3-before.json"), JSON.stringify(roundThreeMetrics.result.value, null, 2));
      fs.writeFileSync(path.join(root, "tests", "artifacts", "thinker-console-toggle-alignment-before.json"), JSON.stringify(toggleMetrics.result.value, null, 2));
      fs.writeFileSync(path.join(root, "tests", "artifacts", "thinker-console-segmented-footer-before.json"), JSON.stringify(segmentedFooterMetrics.result.value, null, 2));
      console.log(`Toggle alignment ANTES: ${JSON.stringify(toggleMetrics.result.value)}`);
      await client.send("Runtime.evaluate", { expression: hideFixtureDecorationsExpression });
      const screenshot = await client.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
      await client.send("Runtime.evaluate", { expression: restoreFixtureDecorationsExpression });
      const artifactPath = path.join(root, "tests", "artifacts", "thinker-console-reference-before.png");
      fs.writeFileSync(artifactPath, Buffer.from(screenshot.data, "base64"));
      console.log(`Baseline visual evidence: ${artifactPath}`);
      return;
    }

    if (captureVisual) {
      const layoutAudits = {};
      const roundThreeStackedAudits = {};
      await client.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 778, deviceScaleFactor: 1, mobile: false });
      await client.send("Runtime.evaluate", { expression: "scrollTo(0, Math.max(0, document.getElementById('oi-wrapper').offsetTop - 40))" });
      await sleep(150);
      const geometry = await client.send("Runtime.evaluate", { expression: geometryExpression, returnByValue: true });
      const polishMetrics = await client.send("Runtime.evaluate", { expression: polishMetricsExpression, returnByValue: true });
      const roundThreeMetrics = await client.send("Runtime.evaluate", { expression: roundThreeMetricsExpression, returnByValue: true });
      const toggleMetrics = await client.send("Runtime.evaluate", { expression: toggleAlignmentMetricsExpression, awaitPromise:true, returnByValue:true });
      const segmentedFooterMetrics = await client.send("Runtime.evaluate", { expression: segmentedFooterMetricsExpression, returnByValue:true });
      printGeometryTable("DEPOIS", geometry.result.value);
      fs.writeFileSync(path.join(root, "tests", "artifacts", "thinker-console-geometry-after.json"), JSON.stringify(geometry.result.value, null, 2));
      fs.writeFileSync(path.join(root, "tests", "artifacts", "thinker-console-polish-after.json"), JSON.stringify(polishMetrics.result.value, null, 2));
      fs.writeFileSync(path.join(root, "tests", "artifacts", "thinker-console-polish-round3-after.json"), JSON.stringify(roundThreeMetrics.result.value, null, 2));
      fs.writeFileSync(path.join(root, "tests", "artifacts", "thinker-console-toggle-alignment-after.json"), JSON.stringify(toggleMetrics.result.value, null, 2));
      fs.writeFileSync(path.join(root, "tests", "artifacts", "thinker-console-segmented-footer-after.json"), JSON.stringify(segmentedFooterMetrics.result.value, null, 2));
      console.log(`Toggle alignment DEPOIS: ${JSON.stringify(toggleMetrics.result.value)}`);
      for (const [name, states] of Object.entries(toggleMetrics.result.value)) {
        assert(!states.missing, `${name} toggle is missing`);
        for (const state of [states.off, states.on]) {
          assert(state.source === "element:getBoundingClientRect", `${name} ${state.state} thumb is not directly measurable: ${JSON.stringify(state)}`);
          assert(state.track.width === 40 && state.track.height === 24 && state.thumb.width === 18 && state.thumb.height === 18, `${name} ${state.state} external dimensions changed: ${JSON.stringify(state)}`);
          assert(state.border.top === 1 && state.border.bottom === 1 && state.innerSpace.above === state.innerSpace.below && state.verticalDifference === 0, `${name} ${state.state} thumb is not vertically centered: ${JSON.stringify(state)}`);
          assert(state.integerGeometry && state.rowHeight === 36, `${name} ${state.state} has fractional geometry or changed row height: ${JSON.stringify(state)}`);
        }
        assert(states.off.innerSpace.left === states.on.innerSpace.right && states.on.thumb.left-states.off.thumb.left === 18 && states.off.trackRight === states.on.trackRight && states.off.thumb.top === states.on.thumb.top && states.off.thumb.bottom === states.on.thumb.bottom, `${name} lateral padding, travel, or vertical axis changes by state: ${JSON.stringify(states)}`);
      }
      for (const state of Object.values(segmentedFooterMetrics.result.value.segmented)) {
        assert(state.container.height === 32 && state.padding === "0px" && state.gap === "0px" && state.overflow === "hidden", `Segmented container geometry regressed: ${JSON.stringify(state)}`);
        assert(state.random.rect.width === state.immediate.rect.width && state.random.rect.height === 30 && state.immediate.rect.height === 30 && state.integerGeometry, `Segmented options are unequal or fractional: ${JSON.stringify(state)}`);
        assert(state.coverage.top === 0 && state.coverage.bottom === 0 && state.coverage.left === 0 && state.coverage.right === 0 && [0,1].includes(state.coverage.between), `Segmented options do not cover the container interior: ${JSON.stringify(state)}`);
        assert(state.random.backgroundColor !== state.immediate.backgroundColor, `Segmented selected and unselected surfaces are indistinguishable: ${JSON.stringify(state)}`);
        for (const option of [state.random,state.immediate]) assert(option.display === "flex" && option.alignItems === "center" && option.justifyContent === "center" && Number.parseFloat(option.fontSize) === 11 && option.contrast >= 4.5, `Segmented option styling regressed: ${JSON.stringify(option)}`);
      }
      assert(segmentedFooterMetrics.result.value.focus.before.left === segmentedFooterMetrics.result.value.focus.after.left && segmentedFooterMetrics.result.value.focus.before.top === segmentedFooterMetrics.result.value.focus.after.top && segmentedFooterMetrics.result.value.focus.before.width === segmentedFooterMetrics.result.value.focus.after.width && segmentedFooterMetrics.result.value.focus.before.height === segmentedFooterMetrics.result.value.focus.after.height && segmentedFooterMetrics.result.value.focus.borderColorBefore !== segmentedFooterMetrics.result.value.focus.borderColorAfter && segmentedFooterMetrics.result.value.focus.activeElement === "dm-rand", `Segmented focus feedback changed geometry or is invisible: ${JSON.stringify(segmentedFooterMetrics.result.value.focus)}`);
      const footerMetrics=segmentedFooterMetrics.result.value.footer;
      assert(footerMetrics.borderTopWidth === "1px" && footerMetrics.borderTopColor === "rgb(50, 50, 47)" && footerMetrics.borderRadius === "0px" && footerMetrics.overflow === "visible" && footerMetrics.edgeDifference.left === 0 && footerMetrics.edgeDifference.right === 0 && footerMetrics.panelHeight === 220, `Auto Play status divider regressed: ${JSON.stringify(footerMetrics)}`);
      await client.send("Runtime.evaluate", { expression: hideFixtureDecorationsExpression });
      const screenshot = await client.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
      await client.send("Runtime.evaluate", { expression: restoreFixtureDecorationsExpression });
      const artifactPath = path.join(root, "tests", "artifacts", "thinker-console-reference-after.png");
      fs.writeFileSync(artifactPath, Buffer.from(screenshot.data, "base64"));
      console.log(`Default console evidence: ${artifactPath}`);
      const toggleCapture = async (state) => {
        const result=await client.send("Runtime.evaluate", { expression:`(async () => { const on=document.getElementById("st-on"); const off=document.getElementById("st-off"); const original=on.checked ? "on" : "off"; ${state === "on" ? "on" : "off"}.checked=true; await new Promise((resolve) => setTimeout(resolve,190)); const box=on.closest(".kb-radio-group").getBoundingClientRect(); return { original, clip:{ x:box.left+scrollX-12, y:box.top+scrollY-12, width:box.width+24, height:box.height+24 } }; })()`, awaitPromise:true, returnByValue:true });
        const shot=await client.send("Page.captureScreenshot", { format:"png", captureBeyondViewport:true, clip:{ ...result.result.value.clip, scale:3 } });
        fs.writeFileSync(path.join(root,"tests","artifacts",`thinker-toggle-${state}-300.png`),Buffer.from(shot.data,"base64"));
        await client.send("Runtime.evaluate", { expression:`(() => { document.getElementById(${JSON.stringify(result.result.value.original === "on" ? "st-on" : "st-off")}).checked=true; })()` });
      };
      await toggleCapture("off");
      await toggleCapture("on");
      const segmentedCapture = async (state) => {
        const result=await client.send("Runtime.evaluate", { expression:`(() => { document.activeElement?.blur?.(); const input=document.getElementById(${JSON.stringify(state === "random" ? "dm-rand" : "dm-max")}); input.checked=true; const group=input.closest(".kb-timing-mode"); void group.offsetWidth; for (const animation of group.getAnimations({subtree:true})) { try { animation.finish(); } catch (_error) {} } const box=group.getBoundingClientRect(); return { x:box.left+scrollX-8,y:box.top+scrollY-8,width:box.width+16,height:box.height+16 }; })()`, returnByValue:true });
        const shot=await client.send("Page.captureScreenshot", { format:"png", captureBeyondViewport:true, clip:{...result.result.value,scale:3} });
        fs.writeFileSync(path.join(root,"tests","artifacts",`thinker-segmented-${state}-300.png`),Buffer.from(shot.data,"base64"));
      };
      await segmentedCapture("random");
      await segmentedCapture("immediate");
      const dividerCapture=await client.send("Runtime.evaluate", { expression:`(() => { const node=document.querySelector(".kb-session-status"); const box=node.getBoundingClientRect(); return {x:box.left+scrollX-8,y:box.top+scrollY-8,width:box.width+16,height:25}; })()`, returnByValue:true });
      const dividerShot=await client.send("Page.captureScreenshot", { format:"png", captureBeyondViewport:true, clip:{...dividerCapture.result.value,scale:3} });
      fs.writeFileSync(path.join(root,"tests","artifacts","thinker-autoplay-divider-300.png"),Buffer.from(dividerShot.data,"base64"));
      for (const width of [1086, 1280, 1440, 1920]) {
        await client.send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: false });
        await client.send("Runtime.evaluate", { expression: "scrollTo(0, Math.max(0, document.getElementById('oi-wrapper').offsetTop - 40))" });
        await sleep(150);
        const auditResult = await client.send("Runtime.evaluate", { expression: layoutAuditExpression, returnByValue: true });
        const audit = auditResult.result.value;
        layoutAudits[String(width)] = audit;
        console.log(`Layout audit ${width}px: ${JSON.stringify(audit)}`);
        assert(audit.ok, `Layout invariant failed at ${width}px: ${JSON.stringify(audit)}`);
        await client.send("Runtime.evaluate", { expression: hideFixtureDecorationsExpression });
        const viewportShot = await client.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
        await client.send("Runtime.evaluate", { expression: restoreFixtureDecorationsExpression });
        fs.writeFileSync(path.join(root, "tests", "artifacts", `thinker-console-${width}-after.png`), Buffer.from(viewportShot.data, "base64"));
      }
      for (const width of [1033, 1034]) {
        await client.send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: false });
        await sleep(150);
        const auditResult = await client.send("Runtime.evaluate", { expression: layoutAuditExpression, returnByValue: true });
        const audit = auditResult.result.value;
        layoutAudits[String(width)] = audit;
        assert(audit.injectionWidth === width, `Injection width mismatch at ${width}px: ${JSON.stringify(audit)}`);
        assert(audit.layoutMode === (audit.injectionWidth >= 1034 ? "desktop" : "stacked"), `Container breakpoint failed at ${width}px: ${JSON.stringify(audit)}`);
      }
      for (const width of [1033, 800]) {
        await client.send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: false });
        await sleep(150);
        await client.send("Runtime.evaluate", { expression: hideFixtureDecorationsExpression });
        const stackedResult = await client.send("Runtime.evaluate", {
          expression: `(() => {
            const wrapper=document.getElementById("oi-wrapper"); const grid=document.querySelector(".kb-console-grid");
            const panels=[".kb-core-module",".kb-visuals-module",".kb-engine-module",".kb-auto-play-module","#oi-zone2"].map((selector) => document.querySelector(selector).getBoundingClientRect());
            const wrapperRect=wrapper.getBoundingClientRect(); const gridRect=grid.getBoundingClientRect();
            const controls=Array.from(grid.querySelectorAll("button,input:not([type=radio]),[role=switch],label[for='dm-rand'],label[for='dm-max']")).filter((node) => !node.hidden && !node.closest("[inert]") && getComputedStyle(node).display !== "none" && node.getClientRects().length);
            const timing=document.querySelector(".kb-timing-mode").getBoundingClientRect(); const options=Array.from(document.querySelectorAll(".kb-timing-mode label")).map((node) => node.getBoundingClientRect());
            return { mode:wrapper.dataset.layoutMode, width:wrapperRect.width, insetLeft:gridRect.left-wrapperRect.left, insetRight:wrapperRect.right-gridRect.right,
              gaps:panels.slice(1).map((panel,index) => panel.top-panels[index].bottom), horizontalOverflow:wrapper.scrollWidth>wrapper.clientWidth,
              allReachable:controls.every((node) => { const rect=node.getBoundingClientRect(); return rect.width>0 && rect.height>0 && rect.left>=0 && rect.right<=innerWidth; }),
              segmented:{ container:{left:timing.left,right:timing.right,width:timing.width}, widths:options.map((rect) => rect.width), integer:[timing.left,timing.right,timing.width,...options.flatMap((rect) => [rect.left,rect.right,rect.width])].every(Number.isInteger) },
              capture:{ x:wrapperRect.left+scrollX, y:wrapperRect.top+scrollY, width:wrapperRect.width, height:wrapperRect.height } };
          })()`, returnByValue:true,
        });
        const stacked=stackedResult.result.value;
        roundThreeStackedAudits[String(width)]=stacked;
        assert(stacked.mode === "stacked" && stacked.insetLeft === 12 && stacked.insetRight === 12 && stacked.gaps.every((gap) => gap === 12) && !stacked.horizontalOverflow && stacked.allReachable && stacked.segmented.integer && stacked.segmented.widths[0] === stacked.segmented.widths[1], `Stacked evidence failed at ${width}px: ${JSON.stringify(stacked)}`);
        const stackedShot=await client.send("Page.captureScreenshot", { format:"png", captureBeyondViewport:true, clip:{ ...stacked.capture, scale:1 } });
        await client.send("Runtime.evaluate", { expression: restoreFixtureDecorationsExpression });
        fs.writeFileSync(path.join(root,"tests","artifacts",`thinker-console-polish-round3-${width}-stacked.png`),Buffer.from(stackedShot.data,"base64"));
      }
      fs.writeFileSync(path.join(root,"tests","artifacts","thinker-console-polish-round3-stacked.json"),JSON.stringify(roundThreeStackedAudits,null,2));
      await client.send("Emulation.setDeviceMetricsOverride", { width:1440, height:900, deviceScaleFactor:1, mobile:false });
      await sleep(150);
      await client.send("Runtime.evaluate", { expression: hideFixtureDecorationsExpression });
      const captureRectsResult=await client.send("Runtime.evaluate", { expression:`(() => { const wrapper=document.getElementById("oi-wrapper").getBoundingClientRect(); const status=document.querySelector("#oi-zone2 .tc-scout-status").getBoundingClientRect(); return { wrapper:{x:wrapper.left+scrollX,y:wrapper.top+scrollY,width:wrapper.width,height:wrapper.height}, scout:{x:Math.max(0,status.left+scrollX-16),y:Math.max(0,status.top+scrollY-16),width:status.width+32,height:status.height+32} }; })()`, returnByValue:true });
      for (const [name,clip] of Object.entries(captureRectsResult.result.value)) {
        const shot=await client.send("Page.captureScreenshot", { format:"png", captureBeyondViewport:true, clip:{...clip,scale:1} });
        fs.writeFileSync(path.join(root,"tests","artifacts",name === "wrapper" ? "thinker-console-polish-round3-1440.png" : "thinker-console-scout-waiting-zoom.png"),Buffer.from(shot.data,"base64"));
      }
      await client.send("Runtime.evaluate", { expression: restoreFixtureDecorationsExpression });
      fs.writeFileSync(path.join(root, "tests", "artifacts", "thinker-console-layout-audits-after.json"), JSON.stringify(layoutAudits, null, 2));
      await client.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
      await sleep(150);
    }

    const disclosureSmokeResult = await client.send("Runtime.evaluate", {
      expression: `(() => {
        const state = (toggle, panel) => ({ expanded:toggle.getAttribute("aria-expanded"), hidden:panel.getAttribute("aria-hidden"), inert:panel.hasAttribute("inert"), open:panel.dataset.open });
        const menu = document.getElementById("krypbot-container");
        const sessionPanel = document.getElementById("kb-session-panel");
        const advancedToggle = document.getElementById("kb-advanced-settings-toggle");
        const advancedPanel = document.getElementById("advanced-settings-panel");
        const timingToggle = document.getElementById("kb-move-timing-toggle");
        const timingPanel = document.getElementById("kb-move-timing-panel");
        const timingCard = document.getElementById("auto-delay-section");
        const moreToggle = document.getElementById("kb-more-settings-toggle");
        const morePanel = document.getElementById("kb-more-settings-panel");
        const duration = document.getElementById("kb-session-duration");
        const minimum = document.getElementById("kb-session-min-rate");
        const maximum = document.getElementById("kb-session-max-rate");
        const delayMinimum = document.getElementById("minDelayInput");
        const delayMaximum = document.getElementById("maxDelayInput");
        const strength = document.getElementById("kb-elo-slider");
        const scout = document.getElementById("oi-zone2");
        if (![menu, sessionPanel, advancedToggle, advancedPanel, timingToggle, timingPanel, timingCard, moreToggle, morePanel, duration, minimum, maximum, delayMinimum, delayMaximum, strength, scout].every(Boolean)) return { ok:false, reason:"disclosure-missing" };
        const phaseBefore = window.krypbotSessionControlBridge?.status?.().phase || null;
        const sequenceBefore = sessionPanel.getAttribute("data-session-ui-sequence");
        const initial = { advanced:state(advancedToggle, advancedPanel), timing:state(timingToggle, timingPanel), more:state(moreToggle, morePanel) };
        delayMinimum.focus();
        const timingFocusAllowed = document.activeElement === delayMinimum;
        const selectedModeStyle = getComputedStyle(timingCard.querySelector('input[name="delayMode"]:checked + label'));
        delayMaximum.focus();
        delayMinimum.value = "0,25";
        delayMaximum.value = "0.500";
        delayMaximum.dispatchEvent(new KeyboardEvent("keydown", { key:"Enter", bubbles:true, cancelable:true }));
        const enterCommitted = delayMinimum.value === "0.25" && delayMaximum.value === "0.50";
        delayMinimum.value = "1,80";
        delayMaximum.value = "0.75";
        delayMaximum.dispatchEvent(new FocusEvent("blur", { bubbles:true }));
        const delayPersisted = localStorage.getItem("autoMinDelay") === "0.75" && localStorage.getItem("autoMaxDelay") === "1.8";
        delayMinimum.value = "1.2abc";
        delayMinimum.dispatchEvent(new FocusEvent("blur", { bubbles:true }));
        const invalidDelayRejected = delayMinimum.value === "0.75" && delayMaximum.value === "1.80"
          && localStorage.getItem("autoMinDelay") === "0.75" && localStorage.getItem("autoMaxDelay") === "1.8";
        duration.focus();
        const advancedFocusAllowed = document.activeElement === duration;
        duration.value = "240"; duration.dispatchEvent(new Event("input", { bubbles:true }));
        minimum.value = "74"; minimum.dispatchEvent(new Event("input", { bubbles:true }));
        maximum.value = "83"; maximum.dispatchEvent(new Event("input", { bubbles:true }));
        const secondarySwitch = document.getElementById("aq-off")?.closest("[role=switch]");
        secondarySwitch?.focus();
        const moreFocusAllowed = document.activeElement === secondarySwitch;
        const sequenceAfter = sessionPanel.getAttribute("data-session-ui-sequence");
        const style = getComputedStyle(menu);
        const scoutStyle = getComputedStyle(scout);
        const scoutEmpty = scout.querySelector(".tc-scout-empty");
        const visibleCopy = (menu.innerText + " " + scout.innerText).replace(/\\s+/g, " ").trim();
        const forbidden = ["Assistente", "Jogadas automáticas", "Ritmo de jogada", "Nível de força", "Mais ajustes", "Aguardando", "Concluído", "Iniciar", "Finalizar", "Configurar", "Taxa de vitória", "Tema", "Oponente"].filter((word) => visibleCopy.includes(word));
        const timingInputs = Array.from(timingPanel.querySelectorAll(".kb-num-input"));
        const timingShells = Array.from(timingPanel.querySelectorAll(".kb-delay-input"));
        const strengthRatio = (Number(strength.value) - Number(strength.min)) / (Number(strength.max) - Number(strength.min));
        return {
          ok: Object.values(initial).every((item) => item.expanded === "true" && item.hidden === "false" && !item.inert && item.open === "true")
            && timingFocusAllowed && advancedFocusAllowed && moreFocusAllowed && enterCommitted
            && duration.value === "240" && minimum.value === "74" && maximum.value === "83" && delayMinimum.value === "0.75" && delayMaximum.value === "1.80" && delayPersisted && invalidDelayRejected
            && !sessionPanel.contains(timingCard) && document.querySelector(".kb-engine-module")?.contains(timingCard) && document.querySelector(".kb-core-module")?.contains(document.getElementById("aq-on"))
            && timingInputs.every((node) => ["none", "textfield"].includes(getComputedStyle(node).appearance)) && timingShells.every((node) => getComputedStyle(node).borderRadius === "5px")
            && selectedModeStyle.backgroundColor !== "rgb(34, 197, 94)" && strength.min === "800" && strength.max === "3200" && strengthRatio >= 0 && strengthRatio <= 1
            && forbidden.length === 0 && phaseBefore === (window.krypbotSessionControlBridge?.status?.().phase || null),
          initial,
          focus:{ timingFocusAllowed, advancedFocusAllowed, moreFocusAllowed },
          retained:{ duration:duration.value, minimum:minimum.value, maximum:maximum.value, delayMinimum:delayMinimum.value, delayMaximum:delayMaximum.value, delayPersisted, enterCommitted, invalidDelayRejected },
          forbidden, visibleCopy,
          panel:{ background:style.backgroundColor, backgroundImage:style.backgroundImage, radius:style.borderRadius, font:style.fontFamily, width:style.width, height:menu.getBoundingClientRect().height, padding:style.padding },
          scout:{ background:scoutStyle.backgroundColor, backgroundImage:scoutStyle.backgroundImage, radius:scoutStyle.borderRadius, font:scoutStyle.fontFamily, width:scoutStyle.width, height:scout.getBoundingClientRect().height, menuHeight:menu.getBoundingClientRect().height, hasRadar:Boolean(scout.querySelector(".tc-scout-radar")), emptyDetail:Boolean(scout.querySelector(".tc-scout-empty-detail")) && getComputedStyle(scout.querySelector(".tc-scout-empty-detail")).display !== "none", emptyAlign:scoutEmpty ? getComputedStyle(scoutEmpty).alignItems : null, rawRate:menu.querySelector("#kb-session-raw")?.textContent || null, sessionState:sessionPanel.dataset.sessionState || null },
        };
      })()`,
      returnByValue: true,
    });
    const disclosureSmoke = disclosureSmokeResult.result.value;

    assert(disclosureSmoke.ok, `Advanced settings disclosure smoke failed: ${JSON.stringify(disclosureSmoke)}`);
    assert(disclosureSmoke.panel.background === "rgba(0, 0, 0, 0)" && disclosureSmoke.panel.backgroundImage === "none", `Session panel embedded surface regressed: ${JSON.stringify(disclosureSmoke.panel)}`);
    assert(disclosureSmoke.panel.radius === "0px" && disclosureSmoke.panel.width === "1010px", `Session panel geometry regressed: ${JSON.stringify(disclosureSmoke.panel)}`);
    assert(disclosureSmoke.panel.font.includes("Segoe UI") || disclosureSmoke.panel.font.includes("Arial"), `Session panel system font regressed: ${JSON.stringify(disclosureSmoke.panel)}`);
    assert(disclosureSmoke.panel.height >= 560 && disclosureSmoke.panel.height <= 620, `Idle workspace height is outside the 560–620px target: ${JSON.stringify(disclosureSmoke.panel)}`);

    const workspaceSmokeResult = await client.send("Runtime.evaluate", {
      expression: `(() => {
        const menu = document.getElementById("krypbot-container");
        const scout = document.getElementById("oi-zone2");
        const launcher = document.getElementById("kb-workspace-launcher");
        if (!menu || !scout || !launcher) return { ok:false, reason:"workspace-missing" };
        const assistantClose = document.getElementById("kb-minimize-toggle");
        const scoutClose = scout.querySelector(".tc-scout-close");
        return { ok:!assistantClose && !scoutClose && !menu.classList.contains("minimized") && getComputedStyle(scout).display === "flex", assistantClose:Boolean(assistantClose), scoutClose:Boolean(scoutClose), launcherText:launcher.textContent.trim() };
      })()`,
      returnByValue: true,
    });
    const workspaceSmoke = workspaceSmokeResult.result.value;
    assert(workspaceSmoke.ok, `Workspace dismiss-control smoke failed: ${JSON.stringify(workspaceSmoke)}`);
    assert(workspaceSmoke.launcherText.includes("Thinker Chess"), `Workspace launcher lost product identity: ${JSON.stringify(workspaceSmoke)}`);
    await sleep(300);

    if (liveChess) {
      console.log(JSON.stringify({ state, consoleErrors }, null, 2));
      assert(exceptions.length === 0, `Userscript exception: ${exceptions[0]?.text || "unknown"}`);
      assert(state.menu, "configuration menu was not mounted");
      assert(state.banner, "banner was not mounted");
      assert(state.wrapper, "scout panel wrapper was not mounted");
      assert(state.documentHeight > state.viewportHeight, "page cannot scroll to the configuration menu");
      assert(state.bannerLayout.display === "flex", "banner is still hidden on a desktop viewport");
      console.log("Live Chess.com userscript shell passed.");
      return;
    }

    const productionStartSmokeResult = await client.send("Runtime.evaluate", {
      expression: `(async () => {
        const bootstrap = window.krypbotSessionControlBootstrap;
        const button = document.getElementById("kb-session-start");
        if (!bootstrap || !button) return { ok: false, reason: "production-wiring-missing" };
        ${liveChess ? "" : `
        const api = window.ThinkerSessionControl;
        const repository = new api.IndexedDbRepository({ indexedDB: window.indexedDB, crypto: window.crypto });
        const clock = { now: () => Date.now() };
        const leader = new api.LeaderCoordinator({ repository, locks: navigator.locks, clock });
        const controller = new api.SessionControlController({ repository, leader, clock, ownerTabId: "dddddddddddddddddddddddddddddddd", idFactory: (() => { let value = 100; return () => (value++).toString(16).padStart(32, "0"); })(), rolloutStage: "ACTIVE_DDA" });
        const values = new Map();
        const storagePort = new api.GmStoragePort((key, fallback) => values.has(key) ? values.get(key) : fallback, (key, value) => values.set(key, value));
        const runtime = api.createSessionControlRuntime({ controller, repository, leader, storagePort, clock, rollout: { schemaVersion: 1, stage: "ACTIVE_DDA" }, observeStartContext: async () => ({ accountKey: "fixture-account", context: "chesscom-queue-sidebar-start-game-v1", pool: "chesscom-live-rapid-v1", intendedQueueScaleId: "chesscom-live-rapid-v1", calibrationReadiness: { schemaVersion: 1, active: false, executionMode: "compatibility", reasonCode: "DDA_MAPPING_UNAVAILABLE", opponentRatingScaleId: "chesscom-live-rapid-v1", targetScaleId: "unavailable-calibration-scale-v1", generatedAtEpochMs: Date.now(), expiresAtEpochMs: Date.now() + 60000 } }), setInterval: () => 1, clearInterval() {} });
        window.krypbotSessionControlBridge.install(controller, () => ({}), { rollout: runtime.rollout, start: runtime.start });
        window.krypbotSessionControlUI.update();
        `}
        const initiallyDisabled = button.hasAttribute("disabled");
        const disabledTitle = button.getAttribute("title");
        button.click();
        await new Promise((resolve) => setTimeout(resolve, 250));
        const disabledWarning = document.getElementById("kb-session-warning")?.textContent || "";
        const disabledToast = document.getElementById("kb-session-toast")?.textContent || "";
        const disabledPhase = window.krypbotSessionControlBridge.status().phase;
        ${liveChess ? "" : `
        for (let attempt = 0; attempt < 10 && button.hasAttribute("disabled"); attempt += 1) {
          window.krypbotSetMasterEnabled?.(true);
          window.krypbotSessionControlUI.update();
          await new Promise((resolve) => setTimeout(resolve, 25));
        }
        const enabledAfterMaster = !button.hasAttribute("disabled");
        button.click();
        await new Promise((resolve) => setTimeout(resolve, 250));
        `}
        const warning = document.getElementById("kb-session-warning")?.textContent || "";
        const toast = document.getElementById("kb-session-toast")?.textContent || "";
        const sessionStatus = window.krypbotSessionControlBridge.status();
        const bootstrapState = bootstrap.state();
        return {
          ok: initiallyDisabled && disabledTitle === null && disabledWarning === "" && disabledToast === "" && disabledPhase === "IDLE"${liveChess ? "" : ` && enabledAfterMaster && button.hasAttribute("disabled") && warning === "" && sessionStatus.phase === "QUEUEING" && sessionStatus.executionMode === "COMPATIBILITY" && sessionStatus.warningCode === "DDA_MAPPING_UNAVAILABLE" && toast === "Session started" && document.getElementById("aq-on")?.checked && document.getElementById("aq-on")?.disabled && document.getElementById("aq-off")?.disabled && !document.getElementById("kb-auto-queue-session-note")?.hidden`},
          initiallyDisabled,
          disabledTitle,
          disabledWarning,
          disabledToast,
          disabledPhase,
          warning,
          toast,
          rawWarningCode: sessionStatus.warningCode,
          queueOnChecked: document.getElementById("aq-on")?.checked,
          queueControlsDisabled: document.getElementById("aq-on")?.disabled && document.getElementById("aq-off")?.disabled,
          queueSessionNoteVisible: !document.getElementById("kb-auto-queue-session-note")?.hidden,
          ariaDisabled: button.getAttribute("aria-disabled"),
          bootstrapPhase: bootstrapState.phase,
          bootstrapReason: bootstrapState.reasonCode,
        };
      })()`,
      awaitPromise: true,
      returnByValue: true,
    });
    const productionStart = productionStartSmokeResult.result.value;

    const module14Smoke = await client.send("Runtime.evaluate", {
      expression: `(async () => { try {
        const api = globalThis.ThinkerSessionControl;
        if (!api) return { ok: false, reason: "namespace-missing" };
        const repository = new api.IndexedDbRepository({ indexedDB: globalThis.indexedDB, crypto: globalThis.crypto });
        const event = {
          schemaVersion: 1,
          eventId: "session:start",
          sessionId: "11111111111111111111111111111111",
          authorityEpoch: 1,
          expectedRevision: 0,
          sequence: 1,
          occurredAtEpochMs: Date.now(),
          type: "SESSION_STARTED",
          payload: { accountKey: "chrome-smoke", authorizationDecision: { schemaVersion: 1, allowed: true, reason: "OPAQUE_POLICY_MATCH" }, config: {
            schemaVersion: 1, durationMs: 60000, minWinRate: 0.25, maxWinRate: 0.75,
            boostOffsetElo: 200, correctionOffsetElo: -200, minCompletedGames: 2,
            perceptionElo: 1700, scaleId: "opaque-scale-v1",
            estimatorVersion: api.ESTIMATOR_VERSION, controllerVersion: api.CONTROLLER_VERSION,
            minimumAdmissionHeadroomMs: 5000, queueObservationTimeoutMs: 10000,
            maximumDrainMs: 60000, maximumConsecutiveSaturatedGames: 2,
          } },
          reducerVersion: api.REDUCER_VERSION,
        };
        const snapshot = api.reduce(null, event).nextState;
        const commit = await repository.commit(event, snapshot);
        const restored = await repository.loadSession(snapshot.sessionId);
        const duplicate = await repository.commit(event, snapshot);
        const locks = navigator.locks;
        const clock = { now: () => Date.now() };
        const smokeLeaseName = "thinker-session-control-smoke-" + Date.now();
        const first = new api.LeaderCoordinator({ repository, locks, clock, leaseName: smokeLeaseName });
        const second = new api.LeaderCoordinator({ repository, locks, clock, leaseName: smokeLeaseName });
        const [a, b] = await Promise.all([
          first.acquire({ authorityEpoch: 1, sessionId: snapshot.sessionId, ownerTabId: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" }),
          second.acquire({ authorityEpoch: 1, sessionId: snapshot.sessionId, ownerTabId: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" }),
        ]);
        const winner = a.status === "acquired"
          ? { leader: first, ownerTabId: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", lease: a.lease }
          : { leader: second, ownerTabId: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", lease: b.lease };
        const controller = new api.SessionControlController({ repository, leader: winner.leader, clock, ownerTabId: winner.ownerTabId, idFactory: () => "cccccccccccccccccccccccccccccccc" });
        controller.setSnapshot(restored);
        controller.setLease(winner.lease);
        const bridge = window.krypbotSessionControlBridge;
        bridge.install(controller, () => ({ queue: {
          calibrationReadiness: { active: true, opponentRatingScaleId: "opaque-scale-v1", expiresAtEpochMs: Date.now() + 30000 },
          intendedQueueScaleId: "opaque-scale-v1",
        } }));
        const failClosedBeforeValidation = !bridge.effectiveAutoQueue(true) && !bridge.effectiveAutoMove(true) && !bridge.isActive();
        bridge.setCalibrationValidated(true);
        const queueGate = bridge.queueGate(true);
        const legacySuspended = bridge.suspendsLegacyAutoAdjust();
        window.krypbotSessionControlUI.update();
        const status = bridge.status();
        const diagnosticText = JSON.stringify(bridge.exportDiagnostic());
        const ui = {
          phase: document.getElementById("kb-session-phase")?.textContent,
          observed: document.getElementById("kb-session-observed")?.textContent,
          advancedPresent: ["kb-session-rollout", "kb-session-role", "kb-session-drain", "kb-session-control", "kb-session-posterior", "kb-session-band", "kb-session-dda", "kb-session-target"].some((id) => document.getElementById(id)),
        };
        bridge.clear();
        repository.close();
        return { ok: commit.status === "committed" && restored.revision === 1 && duplicate.status === "duplicate" && a.status === "acquired" && b.status === "contended" && failClosedBeforeValidation && queueGate.allowed && legacySuspended && status.phase === "QUEUEING" && ui.phase === "Searching..." && ui.advancedPresent === false && !diagnosticText.includes("chrome-smoke") && !diagnosticText.includes("runtimeGameToken") && !diagnosticText.includes("lastFen"), commit: commit.status, recoveryRevision: restored.revision, duplicate: duplicate.status, leases: [a.status, b.status], failClosedBeforeValidation, queueGate, legacySuspended, status, ui };
        } catch (error) {
          return { ok: false, name: error.name, code: error.code, message: error.message, causeName: error.cause?.name, causeMessage: error.cause?.message, stack: error.stack };
        }
      })()`,
      awaitPromise: true,
      returnByValue: true,
    });
    const module14 = module14Smoke.result.value;
    const polishResult = await client.send("Runtime.evaluate", { expression: polishMetricsExpression, returnByValue: true });
    const polish = polishResult.result.value;
    const roundThreeResult = await client.send("Runtime.evaluate", { expression: roundThreeMetricsExpression, returnByValue: true });
    const roundThree = roundThreeResult.result.value;
    const toggleAlignmentResult = await client.send("Runtime.evaluate", { expression: toggleAlignmentMetricsExpression, awaitPromise:true, returnByValue:true });
    const toggleAlignment = toggleAlignmentResult.result.value;
    const segmentedFooterResult = await client.send("Runtime.evaluate", { expression: segmentedFooterMetricsExpression, returnByValue:true });
    const segmentedFooter = segmentedFooterResult.result.value;
    const segmentedHoverBefore = await client.send("Runtime.evaluate", { expression:`(() => { const node=document.querySelector("label[for='dm-max']"); const rect=node.getBoundingClientRect(); const style=getComputedStyle(node); return { rect:{left:rect.left,top:rect.top,width:rect.width,height:rect.height}, backgroundColor:style.backgroundColor, point:{x:rect.left+rect.width/2,y:rect.top+rect.height/2} }; })()`, returnByValue:true });
    await client.send("Input.dispatchMouseEvent", { type:"mouseMoved", x:segmentedHoverBefore.result.value.point.x, y:segmentedHoverBefore.result.value.point.y });
    const segmentedHoverAfter = await client.send("Runtime.evaluate", { expression:`(() => { const node=document.querySelector("label[for='dm-max']"); const rect=node.getBoundingClientRect(); return { rect:{left:rect.left,top:rect.top,width:rect.width,height:rect.height}, backgroundColor:getComputedStyle(node).backgroundColor }; })()`, returnByValue:true });
    await client.send("Input.dispatchMouseEvent", { type:"mouseMoved", x:0, y:0 });
    const [statusCell, timeCell, scoreCell, rateCell] = polish.status;
    const typeMetrics = Object.values(polish.typography);
    const buttonStateMetrics = Object.values(polish.buttonStates).flatMap((states) => [states.enabled, states.disabled]);
    const longStatusResult = await client.send("Runtime.evaluate", {
      expression: `(() => {
        const phase=document.getElementById("kb-session-phase"); const observed=document.getElementById("kb-session-observed");
        const oldPhase=phase.textContent; const oldObserved=observed.textContent;
        phase.textContent="Finishing session..."; observed.textContent="999 W | 999 D | 999 L";
        const status=document.querySelector(".kb-session-status").getBoundingClientRect();
        const nodes=[phase,observed,document.getElementById("kb-session-ttl"),document.getElementById("kb-session-raw")];
        const fits=nodes.every((node) => { const box=node.getBoundingClientRect(); return box.left >= status.left && box.right <= status.right && node.scrollWidth <= node.clientWidth; });
        phase.textContent=oldPhase; observed.textContent=oldObserved; return { fits };
      })()`,
      returnByValue:true,
    });

    assert(exceptions.length === 0, `Userscript exception: ${exceptions[0]?.text || "unknown"}`);
    assert(statusCell.labelRect.x === scoreCell.labelRect.x && statusCell.valueRect.x === scoreCell.valueRect.x, `Left status columns are not aligned: ${JSON.stringify(polish.status)}`);
    assert(timeCell.labelRect.x === rateCell.labelRect.x && timeCell.valueRect.right === polish.content.autoPlayRight && rateCell.valueRect.right === polish.content.autoPlayRight, `Right status columns are not aligned: ${JSON.stringify(polish.status)}`);
    assert(scoreCell.valueRect.right <= timeCell.labelRect.x && timeCell.valueRect.right <= polish.content.autoPlayRight, `Status values clip or overlap: ${JSON.stringify(polish.status)}`);
    assert(longStatusResult.result.value.fits, "Long Auto Play status values clip or overlap");
    assert(polish.slider.paddingLeft === 0 && polish.slider.paddingRight === 0 && polish.slider.trackLeft === polish.content.engineLeft && polish.slider.trackRight === polish.content.engineRight, `Strength track is inset from content edges: ${JSON.stringify(polish.slider)}`);
    assert(polish.slider.minLabel.x === polish.content.engineLeft && polish.slider.maxLabel.right === polish.content.engineRight, `Strength labels do not align with slider endpoints: ${JSON.stringify(polish.slider)}`);
    assert(polish.swatch.rect.width === 24 && polish.swatch.rect.height === 24 && polish.swatch.borderWidth === "1px" && polish.swatch.padding === "0px" && polish.swatch.borderColor === polish.swatch.inputBorderColor, `Theme swatch frame regressed: ${JSON.stringify(polish.swatch)}`);
    assert(Number.parseFloat(polish.scout.dotWidth) >= 6 && Number.parseFloat(polish.scout.dotWidth) <= 8 && polish.scout.dotWidth === polish.scout.dotHeight && polish.scout.text === "Waiting for opponent", `Scout waiting indicator regressed: ${JSON.stringify(polish.scout)}`);
    assert(polish.scout.detail === "Public data appears after an opponent is identified.", `Pre-existing Scout explanation was lost: ${JSON.stringify(polish.scout)}`);
    assert(((polish.divider.borderTopWidth === "1px" && polish.divider.borderTopColor === polish.divider.tokenColor) || (polish.divider.borderTopWidth === "0px" && polish.divider.backgroundImage.includes(polish.divider.tokenColor))) && polish.divider.engineHeight >= 360, `Move Timing / Smart Pacing divider is inconsistent or clips its content: ${JSON.stringify(polish.divider)}`);
    assert(typeMetrics.every((metric) => Number.parseFloat(metric.fontSize) >= 11 && metric.contrast >= 4.5), `Polish typography is undersized or low contrast: ${JSON.stringify(polish.typography)}`);
    assert(buttonStateMetrics.every((metric) => Number.parseFloat(metric.fontSize) >= 11 && metric.contrast >= 4.5), `Button state typography is undersized or low contrast: ${JSON.stringify(polish.buttonStates)}`);
    assert(polish.typography.start.fontSize === polish.typography.finish.fontSize && polish.typography.finish.fontSize === polish.typography.export.fontSize, `Action button type sizes diverge: ${JSON.stringify(polish.typography)}`);
    assert(polish.typography.random.fontSize === polish.typography.immediate.fontSize, `Segmented-control type sizes diverge: ${JSON.stringify(polish.typography)}`);
    assert(roundThree.scout.dotSource === "element" && roundThree.scout.dotRect?.width >= 6 && roundThree.scout.dotRect?.width <= 8 && roundThree.scout.dotRect.width === roundThree.scout.dotRect.height && roundThree.scout.contrast >= 3, `Scout waiting dot is missing or low contrast: ${JSON.stringify(roundThree.scout)}`);
    assert(["flex", "inline-flex"].includes(roundThree.scout.statusStyle.display) && roundThree.scout.statusStyle.alignItems === "center" && roundThree.scout.textRect, `Scout waiting text is not aligned with its dot: ${JSON.stringify(roundThree.scout)}`);
    assert([roundThree.headings.current, roundThree.headings.currentValue, roundThree.headings.timing].every((metric) => Number.parseFloat(metric.fontSize) >= 11 && metric.fontSize === roundThree.headings.current.fontSize && metric.fontWeight === roundThree.headings.current.fontWeight && metric.color === roundThree.headings.current.color && metric.fontVariantNumeric === "tabular-nums"), `Section summary typography diverged: ${JSON.stringify(roundThree.headings)}`);
    assert(Number.parseFloat(roundThree.headings.suffix.fontSize) >= 11, `Move Timing suffix is undersized: ${JSON.stringify(roundThree.headings.suffix)}`);
    assert(roundThree.statusRight.length === 2 && roundThree.statusRight[0].labelRect.x === roundThree.statusRight[1].labelRect.x && roundThree.statusRight[0].valueRect.x === roundThree.statusRight[1].valueRect.x && roundThree.statusRight[0].valueRect.right === roundThree.statusRight[1].valueRect.right && roundThree.statusRight[0].valueRect.right === polish.content.autoPlayRight, `Right status values do not share a content-edge column: ${JSON.stringify(roundThree.statusRight)}`);
    for (const [name, states] of Object.entries(toggleAlignment)) {
      assert(!states.missing, `${name} toggle is missing`);
      for (const state of [states.off, states.on]) {
        assert(state.source === "element:getBoundingClientRect" && state.track.width === 40 && state.track.height === 24 && state.thumb.width === 18 && state.thumb.height === 18, `${name} ${state.state} toggle dimensions or measurable thumb regressed: ${JSON.stringify(state)}`);
        assert(state.border.top === 1 && state.border.bottom === 1 && state.innerSpace.above === state.innerSpace.below && state.verticalDifference === 0 && state.integerGeometry && state.rowHeight === 36, `${name} ${state.state} toggle alignment regressed: ${JSON.stringify(state)}`);
      }
      assert(states.off.innerSpace.left === states.on.innerSpace.right && states.on.thumb.left-states.off.thumb.left === 18 && states.off.trackRight === states.on.trackRight && states.off.thumb.top === states.on.thumb.top && states.off.thumb.bottom === states.on.thumb.bottom, `${name} toggle state geometry regressed: ${JSON.stringify(states)}`);
    }
    for (const state of Object.values(segmentedFooter.segmented)) {
      assert(state.container.height === 32 && state.padding === "0px" && state.gap === "0px" && state.overflow === "hidden" && state.random.rect.width === state.immediate.rect.width && state.random.rect.height === 30 && state.immediate.rect.height === 30 && state.integerGeometry, `Segmented geometry regressed: ${JSON.stringify(state)}`);
      assert(state.coverage.top === 0 && state.coverage.bottom === 0 && state.coverage.left === 0 && state.coverage.right === 0 && [0,1].includes(state.coverage.between), `Segmented coverage regressed: ${JSON.stringify(state.coverage)}`);
      assert(state.random.backgroundColor !== state.immediate.backgroundColor, `Segmented state surfaces regressed: ${JSON.stringify(state)}`);
      for (const option of [state.random,state.immediate]) assert(option.display === "flex" && option.alignItems === "center" && option.justifyContent === "center" && Number.parseFloat(option.fontSize) === 11 && option.contrast >= 4.5, `Segmented option regressed: ${JSON.stringify(option)}`);
    }
    assert(JSON.stringify(segmentedFooter.focus.before) === JSON.stringify(segmentedFooter.focus.after) && segmentedFooter.focus.borderColorBefore !== segmentedFooter.focus.borderColorAfter && segmentedFooter.focus.activeElement === "dm-rand", `Segmented focus feedback changed geometry or is invisible: ${JSON.stringify(segmentedFooter.focus)}`);
    assert(JSON.stringify(segmentedHoverBefore.result.value.rect) === JSON.stringify(segmentedHoverAfter.result.value.rect) && segmentedHoverBefore.result.value.backgroundColor !== segmentedHoverAfter.result.value.backgroundColor, `Segmented hover feedback changed geometry or is invisible: ${JSON.stringify({ before:segmentedHoverBefore.result.value, after:segmentedHoverAfter.result.value })}`);
    assert(segmentedFooter.footer.borderTopWidth === "1px" && segmentedFooter.footer.borderTopColor === "rgb(50, 50, 47)" && segmentedFooter.footer.borderRadius === "0px" && segmentedFooter.footer.overflow === "visible" && segmentedFooter.footer.edgeDifference.left === 0 && segmentedFooter.footer.edgeDifference.right === 0 && segmentedFooter.footer.panelHeight === 220, `Auto Play divider regressed: ${JSON.stringify(segmentedFooter.footer)}`);
    assert(disclosureSmoke.scout?.background === "rgb(37, 37, 35)" && disclosureSmoke.scout.backgroundImage === "none" && disclosureSmoke.scout.radius === "8px", `Scout neutral styling regressed: ${JSON.stringify(disclosureSmoke.scout)}`);
    assert(disclosureSmoke.scout.font.includes("Segoe UI") || disclosureSmoke.scout.font.includes("Arial"), `Scout system font regressed: ${JSON.stringify(disclosureSmoke.scout)}`);
    assert(disclosureSmoke.scout.width === "296px" && disclosureSmoke.scout.height === disclosureSmoke.scout.menuHeight && !disclosureSmoke.scout.hasRadar && disclosureSmoke.scout.emptyDetail, `Scout waiting state did not fill the named grid: ${JSON.stringify(disclosureSmoke.scout)}`);
    assert(disclosureSmoke.scout.rawRate === "—" && disclosureSmoke.scout.sessionState === "never-started", `Idle presentation state regressed: ${JSON.stringify(disclosureSmoke.scout)}`);
    assert(productionStart.ok, `Production START wiring smoke failed: ${JSON.stringify(productionStart)}`);
    if (!liveChess) assert(productionStart.warning === "" && productionStart.rawWarningCode === "DDA_MAPPING_UNAVAILABLE", `Default compatibility START did not leave IDLE: ${JSON.stringify(productionStart)}`);
    assert(module14.ok, `Module 14 browser smoke failed: ${JSON.stringify(module14)}`);
    assert(state.menu, "configuration menu was not mounted");
    assert(state.sessionPanel, "session control panel was not mounted");
    assert(state.banner, "banner was not mounted");
    assert(state.wrapper, "scout panel wrapper was not mounted");
    assert(
      state.menuLayout.position !== "fixed" && state.menuLayout.position !== "absolute",
      `configuration menu escaped normal document flow: ${JSON.stringify(state.menuLayout)}`,
    );
    assert(
      state.menuLayout.rect.y >= state.viewportHeight,
      `configuration menu overlaps the initial viewport: ${JSON.stringify(state.menuLayout.rect)}`,
    );
    assert(state.workspaceGap >= 112, `Workspace gap is below 112px: ${state.workspaceGap}`);
    assert(
      state.documentHeight > state.viewportHeight,
      `page cannot scroll to the configuration menu: ${state.documentHeight}px document / ${state.viewportHeight}px viewport`,
    );
    assert(state.bannerLayout.display === "flex", "banner is still hidden on a desktop viewport");
    await client.send("Emulation.setDeviceMetricsOverride", { width: 1033, height: 900, deviceScaleFactor: 1, mobile: false });
    await sleep(100);
    const responsiveResult = await client.send("Runtime.evaluate", {
      expression: `(() => {
        const wrapper = document.getElementById("oi-wrapper");
        const menu = document.getElementById("krypbot-container");
        const scout = document.getElementById("oi-zone2");
        const style = getComputedStyle(wrapper);
        return {
          mode: wrapper.dataset.layoutMode,
          wrapperWidth: wrapper.getBoundingClientRect().width,
          menuWidth: menu.getBoundingClientRect().width,
          scoutWidth: scout?.getBoundingClientRect().width || 0,
          viewportWidth: innerWidth,
        };
      })()`,
      returnByValue: true,
    });
    const responsive = responsiveResult.result.value;
    assert(responsive.mode === "stacked", `Workspace did not stack below the injection-container breakpoint: ${JSON.stringify(responsive)}`);
    assert(responsive.wrapperWidth <= responsive.viewportWidth && responsive.menuWidth <= responsive.wrapperWidth && responsive.scoutWidth <= responsive.wrapperWidth, `Workspace overflowed the narrow viewport: ${JSON.stringify(responsive)}`);
    await client.send("Emulation.setDeviceMetricsOverride", { width: 1034, height: 900, deviceScaleFactor: 1, mobile: false });
    await sleep(100);
    const wideBoundaryResult = await client.send("Runtime.evaluate", {
      expression: `(() => {
        const wrapper = document.getElementById("oi-wrapper");
        return { mode:wrapper.dataset.layoutMode, width:wrapper.getBoundingClientRect().width, viewportWidth:innerWidth };
      })()`,
      returnByValue: true,
    });
    const wideBoundary = wideBoundaryResult.result.value;
    assert(wideBoundary.mode === "desktop" && wideBoundary.width === 1034, `Workspace breakpoint regressed at 1034px: ${JSON.stringify(wideBoundary)}`);
    for (const [width, height, scale] of [[320, 900, 1], [375, 900, 1], [640, 900, 1], [768, 900, 1], [800, 900, 1], [820, 900, 1], [900, 900, 1], [1024, 900, 1], [1033, 900, 1], [1034, 900, 1], [1086, 900, 1], [1280, 720, 1], [1440, 778, 1], [1440, 900, 1], [1440, 900, 1.25], [1920, 1080, 1.5]]) {
      const cssWidth = Math.round(width / scale);
      const cssHeight = Math.round(height / scale);
      await client.send("Emulation.setDeviceMetricsOverride", { width: cssWidth, height: cssHeight, deviceScaleFactor: scale, mobile: false });
      await sleep(80);
      const viewportResult = await client.send("Runtime.evaluate", {
        expression: `(() => {
          const wrapper = document.getElementById("oi-wrapper");
          const menu = document.getElementById("krypbot-container");
          const scout = document.getElementById("oi-zone2");
          const grid = menu.querySelector(".kb-console-grid");
          const panels = [".kb-core-module",".kb-visuals-module",".kb-engine-module",".kb-auto-play-module","#oi-zone2"].map((selector) => document.querySelector(selector).getBoundingClientRect());
          const controls = Array.from(menu.querySelectorAll("button, input:not([type=radio]), [role=switch], label[for='dm-rand'], label[for='dm-max']")).filter((node) => !node.hidden && !node.closest("[inert]") && getComputedStyle(node).display !== "none" && node.getClientRects().length > 0);
          const hiddenControls = controls.filter((node) => { const rect = node.getBoundingClientRect(); return rect.width <= 0 || rect.height <= 0 || rect.left < 0 || rect.right > innerWidth; }).map((node) => node.id || node.type);
          const wrapperRect = wrapper.getBoundingClientRect();
          return {
            width: innerWidth,
            wrapper: wrapperRect.width,
            wrapperLeft: wrapperRect.left,
            wrapperRight: wrapperRect.right,
            wrapperBottom: wrapperRect.bottom + scrollY,
            documentHeight: document.documentElement.scrollHeight,
            menu: menu.getBoundingClientRect().width,
            scout: scout.getBoundingClientRect().width,
            switchCount: controls.filter((node) => node.getAttribute("role") === "switch").length,
            allReachable: hiddenControls.length === 0,
            hiddenControls,
            insetLeft:grid.getBoundingClientRect().left-wrapperRect.left,
            insetRight:wrapperRect.right-grid.getBoundingClientRect().right,
            stackedGaps:panels.slice(1).map((panel,index) => panel.top-panels[index].bottom),
          };
        })()`,
        returnByValue: true,
      });
      const viewport = viewportResult.result.value;
      assert(viewport.wrapper <= viewport.width && viewport.wrapperLeft >= 0 && viewport.wrapperRight <= viewport.width && viewport.wrapperBottom <= viewport.documentHeight + 1 && viewport.menu <= viewport.width && viewport.scout <= viewport.width && viewport.switchCount > 0 && viewport.allReachable, `Workspace failed responsive ${width}×${height} @ ${Math.round(scale * 100)}%: ${JSON.stringify(viewport)}`);
      if (viewport.wrapper < 1034) assert(viewport.insetLeft === 12 && viewport.insetRight === 12 && viewport.stackedGaps.every((gap) => gap === 12), `Stacked spacing failed responsive ${width}×${height}: ${JSON.stringify(viewport)}`);
    }
    await client.send("Emulation.clearDeviceMetricsOverride");
    await sleep(100);
    const switchKeyboardResult = await client.send("Runtime.evaluate", {
      expression: `(() => {
        const group = document.getElementById("am-on")?.closest("[role=switch]");
        if (!group) return { ok:false };
        const before = group.getAttribute("aria-checked");
        group.focus();
        group.dispatchEvent(new KeyboardEvent("keydown", { key:"Enter", bubbles:true }));
        const after = group.getAttribute("aria-checked");
        group.dispatchEvent(new KeyboardEvent("keydown", { key:"Enter", bubbles:true }));
        return { ok:document.activeElement === group && before !== after && group.getAttribute("aria-checked") === before, before, after };
      })()`,
      returnByValue: true,
    });
    assert(switchKeyboardResult.result.value.ok, `Switch keyboard interaction regressed: ${JSON.stringify(switchKeyboardResult.result.value)}`);
    const timingKeyboardResult = await client.send("Runtime.evaluate", {
      expression: `(() => {
        const random = document.getElementById("dm-rand");
        const immediate = document.getElementById("dm-max");
        if (!random || !immediate) return { ok:false, reason:"timing-radios-missing" };
        random.focus();
        const randomReachable = document.activeElement === random && getComputedStyle(random).display !== "none";
        immediate.focus();
        return { ok:randomReachable && document.activeElement === immediate && getComputedStyle(immediate).display !== "none" };
      })()`,
      returnByValue: true,
    });
    assert(timingKeyboardResult.result.value.ok, `Move Timing radios are not keyboard reachable: ${JSON.stringify(timingKeyboardResult.result.value)}`);
    if (!liveChess) {
      await client.send("Emulation.setDeviceMetricsOverride", { width:1433, height:900, deviceScaleFactor:1, mobile:false });
      await sleep(150);
      const bannerToggle = await client.send("Runtime.evaluate", {
        expression: `(async () => {
          let group=document.getElementById("bn-on")?.closest('[role="switch"]');
          const banner=document.getElementById("thinker-chess-banner");
          const evaluation=document.getElementById("eb-on");
          if(!group || !banner) return {ok:false,reason:"missing-control"};
          const original=banner, evaluationBefore=evaluation.checked;
          const before=banner.getBoundingClientRect().toJSON();
          const inVisuals=Boolean(group.closest('.kb-visuals-module'));
          group.click();
          const immediateHidden=getComputedStyle(banner).display==='none';
          dispatchEvent(new Event('resize'));
          const originalPath=location.pathname;
          history.pushState({},'','/game/live/banner-preference-test');
          await new Promise(resolve=>setTimeout(resolve,650));
          banner.remove();
          await new Promise(resolve=>setTimeout(resolve,650));
          const reconciled=document.getElementById('thinker-chess-banner')===original && original.isConnected;
          history.pushState({},'',originalPath+'?banner-toggle=1');
          await new Promise(resolve=>setTimeout(resolve,650));
          group=document.getElementById('bn-on')?.closest('[role="switch"]');
          if(!group) return {ok:false,reason:'route-control-missing'};
          const stayedHidden=getComputedStyle(banner).display==='none' && localStorage.getItem('thinkerBanner')==='false' && group.getAttribute('aria-checked')==='false';
          group.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
          const after=banner.getBoundingClientRect().toJSON();
          const restored=getComputedStyle(banner).display==='flex' && group.getAttribute('aria-checked')==='true';
          const sameGeometry=['x','y','width','height'].every(key=>before[key]===after[key]);
          const noRemount=original===document.getElementById('thinker-chess-banner') && document.querySelectorAll('#thinker-chess-banner').length===1;
          group.dispatchEvent(new KeyboardEvent('keydown',{key:' ',bubbles:true}));
          return {ok:inVisuals && immediateHidden && stayedHidden && reconciled && restored && sameGeometry && noRemount && evaluationBefore===evaluation.checked && localStorage.getItem('thinkerBanner')==='false',inVisuals,immediateHidden,stayedHidden,reconciled,restored,sameGeometry,noRemount,before,after};
        })()`, awaitPromise:true, returnByValue:true,
      });
      assert(bannerToggle.result.value.ok, `Banner toggle interaction failed: ${JSON.stringify(bannerToggle.result.value)}`);
      await client.send("Page.navigate", {url:`http://127.0.0.1:${fixturePort}/tests/fixtures/userscript_bootstrap.html?delay=100`});
      await sleep(3500);
      const bannerReload = await client.send("Runtime.evaluate", {
        expression:`(() => {
          const group=document.getElementById('bn-on')?.closest('[role="switch"]');
          const banner=document.getElementById('thinker-chess-banner');
          if(!group || !banner) return {ok:false,reason:'reload-missing-control'};
          const persisted=document.getElementById('bn-off').checked && group.getAttribute('aria-checked')==='false' && getComputedStyle(banner).display==='none';
          group.click();
          return {ok:persisted && getComputedStyle(banner).display==='flex' && localStorage.getItem('thinkerBanner')==='true',persisted};
        })()`,returnByValue:true,
      });
      assert(bannerReload.result.value.ok, `Banner preference reload failed: ${JSON.stringify(bannerReload.result.value)}`);
      const bannerVisibility = await client.send('Runtime.evaluate', {
        expression:`(async () => {
          const board=document.querySelector('wc-chess-board'),banner=document.getElementById('thinker-chess-banner');
          const previous=board.style.opacity;
          board.style.opacity='0';await new Promise(r=>setTimeout(r,200));
          const hidden=getComputedStyle(banner).display==='none';
          board.style.opacity='1';await new Promise(r=>setTimeout(r,250));
          const restored=getComputedStyle(banner).display==='flex';
          const clone=document.createElement('chess-board');clone.hidden=true;
          board.parentElement.prepend(clone);await new Promise(r=>setTimeout(r,150));
          const ignoredClone=getComputedStyle(banner).display==='flex';clone.remove();board.style.opacity=previous;
          const generic=document.createElement('div');generic.className='board';generic.style.cssText='display:block;position:absolute;left:0;top:50px;width:640px;height:640px';
          board.replaceWith(generic);await new Promise(r=>setTimeout(r,150));
          generic.style.visibility='hidden';await new Promise(r=>setTimeout(r,200));
          const genericHidden=getComputedStyle(banner).display==='none';
          generic.style.visibility='visible';await new Promise(r=>setTimeout(r,200));
          const genericRestored=getComputedStyle(banner).display==='flex';
          const parent=generic.parentElement;parent.style.opacity='0';await new Promise(r=>setTimeout(r,200));
          const parentHidden=getComputedStyle(banner).display==='none';
          parent.style.opacity='1';await new Promise(r=>setTimeout(r,200));
          const parentRestored=getComputedStyle(banner).display==='flex';
          generic.replaceWith(board);parent.style.opacity='';await new Promise(r=>setTimeout(r,150));
          const diagnostic=window.thinkerChessDiagnostics();
          return {ok:hidden&&restored&&ignoredClone&&genericHidden&&genericRestored&&parentHidden&&parentRestored&&diagnostic.banner.enabled,hidden,restored,ignoredClone,genericHidden,genericRestored,parentHidden,parentRestored,reason:diagnostic.banner.reason};
        })()`,awaitPromise:true,returnByValue:true,
      });
      assert(bannerVisibility.result.value.ok,`Banner visibility-only transition failed: ${JSON.stringify(bannerVisibility.result.value)}`);
      console.log(JSON.stringify({bannerVisibility:bannerVisibility.result.value}));
      const engineRecovery = await client.send('Runtime.evaluate', {
        expression:`(async () => {
          const waitFor=async test=>{const until=performance.now()+4000;while(!test()&&performance.now()<until)await new Promise(r=>setTimeout(r,25));return test();};
          const originalGM=window.GM_xmlhttpRequest, originalPrompt=window.prompt;
          let requests=0,moves=0,currentFen='8/8/8/8/8/5k2/8/6K1 w - - 0 1';
          const board=document.querySelector('wc-chess-board');
          const originalGame=board.game;
          board.game={getFEN:()=>currentFen,getTurn:()=>currentFen.split(' ')[1],getPlayingAs:()=>'w',getLegalMoves:()=>[{from:'g1',to:'h1'}],move:()=>{moves++;currentFen='8/8/8/8/8/5k2/8/7K b - - 1 1';}};
          window.prompt=()=> 'fixture-capability';
          window.GM_xmlhttpRequest=options=>{
            if(options.url.endsWith('/getmove')){requests++;setTimeout(()=>requests===1?options.onerror({status:0}):options.onload({status:200,responseText:'["g1h1"]'}),20);return {abort(){}};}
            if(options.url.endsWith('/config/load')){options.onload({status:200,responseText:'{}'});return {abort(){}};}
            return originalGM(options);
          };
          const click=id=>document.getElementById(id).closest('[role="switch"]').click();
          try {
            click('st-on');
            const arrows=await waitFor(()=>document.querySelectorAll('.myarrow').length===1);
            const afterRecovery=requests;
            click('am-on');
            const moved=await waitFor(()=>moves===1);
            click('am-on');click('st-on');
            const recent=document.getElementById('rf-on').closest('[role="switch"]');
            const hud=document.createElement('span');hud.className='tc-hud-stats';document.body.appendChild(hud);
            recent.click();const formOff=!document.querySelector('.tc-hud-stats') && localStorage.getItem('recentForm')==='false';
            recent.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
            const formOn=document.getElementById('rf-on').checked && localStorage.getItem('recentForm')==='true';
            return {ok:arrows&&afterRecovery===2&&moved&&requests===2&&formOff&&formOn,arrows,afterRecovery,moved,moves,requests,formOff,formOn};
          } finally {window.GM_xmlhttpRequest=originalGM;window.prompt=originalPrompt;board.game=originalGame;}
        })()`,awaitPromise:true,returnByValue:true,
      });
      assert(engineRecovery.result.value.ok, `Bot/Auto Move recovery failed: ${JSON.stringify(engineRecovery.result.value)}`);
      const focusPoint=await client.send('Runtime.evaluate',{expression:`(() => {const group=document.getElementById('rf-on').closest('[role="switch"]');group.scrollIntoView({block:'center'});const r=group.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`,returnByValue:true});
      await client.send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...focusPoint.result.value});
      await client.send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...focusPoint.result.value});
      const focusStyle=await client.send('Runtime.evaluate',{expression:`(() => {const group=document.getElementById('rf-on').closest('[role="switch"]');return {outline:getComputedStyle(group).outlineWidth,style:getComputedStyle(group).outlineStyle,focusVisible:group.matches(':focus-visible')};})()`,returnByValue:true});
      assert(focusStyle.result.value.outline==='0px' || focusStyle.result.value.style==='none',`Pointer click left toggle outline: ${JSON.stringify(focusStyle.result.value)}`);
      await client.send('Runtime.evaluate',{expression:`if(!document.getElementById('rf-on').checked)document.getElementById('rf-on').closest('[role="switch"]').click();`});
      console.log(JSON.stringify({engineRecovery:engineRecovery.result.value,pointerFocus:focusStyle.result.value}));
      console.log(JSON.stringify({bannerToggle:bannerToggle.result.value,bannerReload:bannerReload.result.value}));
    }
    if (captureVisual) {
      await client.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 778, deviceScaleFactor: 1, mobile: false });
      await client.send("Runtime.evaluate", { expression: `(() => { const toast = document.getElementById("kb-session-toast"); if (toast) { toast.dataset.visible = "false"; toast.textContent = ""; } window.krypbotSessionControlUI?.update?.(); })()` });
      await client.send("Runtime.evaluate", { expression: "scrollTo(0, Math.max(0, document.getElementById('oi-wrapper').offsetTop - 40))" });
      await sleep(150);
      await client.send("Runtime.evaluate", { expression: hideFixtureDecorationsExpression });
      const screenshot = await client.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
      await client.send("Runtime.evaluate", { expression: restoreFixtureDecorationsExpression });
      const artifactPath = path.join(root, "tests", "artifacts", "thinker-panels-phase-08-1-after.png");
      fs.writeFileSync(artifactPath, Buffer.from(screenshot.data, "base64"));
      console.log(`Visual evidence: ${artifactPath}`);
    }
    console.log(JSON.stringify({ state, productionStart, module14, consoleErrors }, null, 2));
    console.log(liveChess ? "Live Chess.com userscript bootstrap passed." : "Chrome userscript bootstrap passed.");
  } finally {
    client?.close();
    chrome.kill();
    server.closeAllConnections?.();
    server.close();
  }
})().catch((error) => {
  process.stderr.write(`${error.stack || error}\n`);
  process.exitCode = 1;
});
