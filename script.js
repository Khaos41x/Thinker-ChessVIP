// ==UserScript==
// @name         TC172
// @namespace    http://tampermonkey.net/
// @version      2026-10-23.2
// @description  Chess Bot com Servidor Local
// @author       You
// @match        https://www.chess.com/*
// @match        https://chess.com/*
// @noframes
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @run-at       document-idle
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// @grant        unsafeWindow
// @connect      localhost
// @connect      127.0.0.1
// @connect      api.chess.com
// ==/UserScript==

try {
/* TC_VENDORED_JQUERY_START */
/*! jQuery v3.7.1 | (c) OpenJS Foundation and other contributors | jquery.org/license */
!function(e,t){"use strict";"object"==typeof module&&"object"==typeof module.exports?module.exports=e.document?t(e,!0):function(e){if(!e.document)throw new Error("jQuery requires a window with a document");return t(e)}:t(e)}("undefined"!=typeof window?window:this,function(ie,e){"use strict";var oe=[],r=Object.getPrototypeOf,ae=oe.slice,g=oe.flat?function(e){return oe.flat.call(e)}:function(e){return oe.concat.apply([],e)},s=oe.push,se=oe.indexOf,n={},i=n.toString,ue=n.hasOwnProperty,o=ue.toString,a=o.call(Object),le={},v=function(e){return"function"==typeof e&&"number"!=typeof e.nodeType&&"function"!=typeof e.item},y=function(e){return null!=e&&e===e.window},C=ie.document,u={type:!0,src:!0,nonce:!0,noModule:!0};function m(e,t,n){var r,i,o=(n=n||C).createElement("script");if(o.text=e,t)for(r in u)(i=t[r]||t.getAttribute&&t.getAttribute(r))&&o.setAttribute(r,i);n.head.appendChild(o).parentNode.removeChild(o)}function x(e){return null==e?e+"":"object"==typeof e||"function"==typeof e?n[i.call(e)]||"object":typeof e}var t="3.7.1",l=/HTML$/i,ce=function(e,t){return new ce.fn.init(e,t)};function c(e){var t=!!e&&"length"in e&&e.length,n=x(e);return!v(e)&&!y(e)&&("array"===n||0===t||"number"==typeof t&&0<t&&t-1 in e)}function fe(e,t){return e.nodeName&&e.nodeName.toLowerCase()===t.toLowerCase()}ce.fn=ce.prototype={jquery:t,constructor:ce,length:0,toArray:function(){return ae.call(this)},get:function(e){return null==e?ae.call(this):e<0?this[e+this.length]:this[e]},pushStack:function(e){var t=ce.merge(this.constructor(),e);return t.prevObject=this,t},each:function(e){return ce.each(this,e)},map:function(n){return this.pushStack(ce.map(this,function(e,t){return n.call(e,t,e)}))},slice:function(){return this.pushStack(ae.apply(this,arguments))},first:function(){return this.eq(0)},last:function(){return this.eq(-1)},even:function(){return this.pushStack(ce.grep(this,function(e,t){return(t+1)%2}))},odd:function(){return this.pushStack(ce.grep(this,function(e,t){return t%2}))},eq:function(e){var t=this.length,n=+e+(e<0?t:0);return this.pushStack(0<=n&&n<t?[this[n]]:[])},end:function(){return this.prevObject||this.constructor()},push:s,sort:oe.sort,splice:oe.splice},ce.extend=ce.fn.extend=function(){var e,t,n,r,i,o,a=arguments[0]||{},s=1,u=arguments.length,l=!1;for("boolean"==typeof a&&(l=a,a=arguments[s]||{},s++),"object"==typeof a||v(a)||(a={}),s===u&&(a=this,s--);s<u;s++)if(null!=(e=arguments[s]))for(t in e)r=e[t],"__proto__"!==t&&a!==r&&(l&&r&&(ce.isPlainObject(r)||(i=Array.isArray(r)))?(n=a[t],o=i&&!Array.isArray(n)?[]:i||ce.isPlainObject(n)?n:{},i=!1,a[t]=ce.extend(l,o,r)):void 0!==r&&(a[t]=r));return a},ce.extend({expando:"jQuery"+(t+Math.random()).replace(/\D/g,""),isReady:!0,error:function(e){throw new Error(e)},noop:function(){},isPlainObject:function(e){var t,n;return!(!e||"[object Object]"!==i.call(e))&&(!(t=r(e))||"function"==typeof(n=ue.call(t,"constructor")&&t.constructor)&&o.call(n)===a)},isEmptyObject:function(e){var t;for(t in e)return!1;return!0},globalEval:function(e,t,n){m(e,{nonce:t&&t.nonce},n)},each:function(e,t){var n,r=0;if(c(e)){for(n=e.length;r<n;r++)if(!1===t.call(e[r],r,e[r]))break}else for(r in e)if(!1===t.call(e[r],r,e[r]))break;return e},text:function(e){var t,n="",r=0,i=e.nodeType;if(!i)while(t=e[r++])n+=ce.text(t);return 1===i||11===i?e.textContent:9===i?e.documentElement.textContent:3===i||4===i?e.nodeValue:n},makeArray:function(e,t){var n=t||[];return null!=e&&(c(Object(e))?ce.merge(n,"string"==typeof e?[e]:e):s.call(n,e)),n},inArray:function(e,t,n){return null==t?-1:se.call(t,e,n)},isXMLDoc:function(e){var t=e&&e.namespaceURI,n=e&&(e.ownerDocument||e).documentElement;return!l.test(t||n&&n.nodeName||"HTML")},merge:function(e,t){for(var n=+t.length,r=0,i=e.length;r<n;r++)e[i++]=t[r];return e.length=i,e},grep:function(e,t,n){for(var r=[],i=0,o=e.length,a=!n;i<o;i++)!t(e[i],i)!==a&&r.push(e[i]);return r},map:function(e,t,n){var r,i,o=0,a=[];if(c(e))for(r=e.length;o<r;o++)null!=(i=t(e[o],o,n))&&a.push(i);else for(o in e)null!=(i=t(e[o],o,n))&&a.push(i);return g(a)},guid:1,support:le}),"function"==typeof Symbol&&(ce.fn[Symbol.iterator]=oe[Symbol.iterator]),ce.each("Boolean Number String Function Array Date RegExp Object Error Symbol".split(" "),function(e,t){n["[object "+t+"]"]=t.toLowerCase()});var pe=oe.pop,de=oe.sort,he=oe.splice,ge="[\\x20\\t\\r\\n\\f]",ve=new RegExp("^"+ge+"+|((?:^|[^\\\\])(?:\\\\.)*)"+ge+"+$","g");ce.contains=function(e,t){var n=t&&t.parentNode;return e===n||!(!n||1!==n.nodeType||!(e.contains?e.contains(n):e.compareDocumentPosition&&16&e.compareDocumentPosition(n)))};var f=/([\0-\x1f\x7f]|^-?\d)|^-$|[^\x80-\uFFFF\w-]/g;function p(e,t){return t?"\0"===e?"\ufffd":e.slice(0,-1)+"\\"+e.charCodeAt(e.length-1).toString(16)+" ":"\\"+e}ce.escapeSelector=function(e){return(e+"").replace(f,p)};var ye=C,me=s;!function(){var e,b,w,o,a,T,r,C,d,i,k=me,S=ce.expando,E=0,n=0,s=W(),c=W(),u=W(),h=W(),l=function(e,t){return e===t&&(a=!0),0},f="checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",t="(?:\\\\[\\da-fA-F]{1,6}"+ge+"?|\\\\[^\\r\\n\\f]|[\\w-]|[^\0-\\x7f])+",p="\\["+ge+"*("+t+")(?:"+ge+"*([*^$|!~]?=)"+ge+"*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|("+t+"))|)"+ge+"*\\]",g=":("+t+")(?:\\((('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|((?:\\\\.|[^\\\\()[\\]]|"+p+")*)|.*)\\)|)",v=new RegExp(ge+"+","g"),y=new RegExp("^"+ge+"*,"+ge+"*"),m=new RegExp("^"+ge+"*([>+~]|"+ge+")"+ge+"*"),x=new RegExp(ge+"|>"),j=new RegExp(g),A=new RegExp("^"+t+"$"),D={ID:new RegExp("^#("+t+")"),CLASS:new RegExp("^\\.("+t+")"),TAG:new RegExp("^("+t+"|[*])"),ATTR:new RegExp("^"+p),PSEUDO:new RegExp("^"+g),CHILD:new RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\("+ge+"*(even|odd|(([+-]|)(\\d*)n|)"+ge+"*(?:([+-]|)"+ge+"*(\\d+)|))"+ge+"*\\)|)","i"),bool:new RegExp("^(?:"+f+")$","i"),needsContext:new RegExp("^"+ge+"*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\("+ge+"*((?:-\\d)?\\d*)"+ge+"*\\)|)(?=[^-]|$)","i")},N=/^(?:input|select|textarea|button)$/i,q=/^h\d$/i,L=/^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,H=/[+~]/,O=new RegExp("\\\\[\\da-fA-F]{1,6}"+ge+"?|\\\\([^\\r\\n\\f])","g"),P=function(e,t){var n="0x"+e.slice(1)-65536;return t||(n<0?String.fromCharCode(n+65536):String.fromCharCode(n>>10|55296,1023&n|56320))},M=function(){V()},R=J(function(e){return!0===e.disabled&&fe(e,"fieldset")},{dir:"parentNode",next:"legend"});try{k.apply(oe=ae.call(ye.childNodes),ye.childNodes),oe[ye.childNodes.length].nodeType}catch(e){k={apply:function(e,t){me.apply(e,ae.call(t))},call:function(e){me.apply(e,ae.call(arguments,1))}}}function I(t,e,n,r){var i,o,a,s,u,l,c,f=e&&e.ownerDocument,p=e?e.nodeType:9;if(n=n||[],"string"!=typeof t||!t||1!==p&&9!==p&&11!==p)return n;if(!r&&(V(e),e=e||T,C)){if(11!==p&&(u=L.exec(t)))if(i=u[1]){if(9===p){if(!(a=e.getElementById(i)))return n;if(a.id===i)return k.call(n,a),n}else if(f&&(a=f.getElementById(i))&&I.contains(e,a)&&a.id===i)return k.call(n,a),n}else{if(u[2])return k.apply(n,e.getElementsByTagName(t)),n;if((i=u[3])&&e.getElementsByClassName)return k.apply(n,e.getElementsByClassName(i)),n}if(!(h[t+" "]||d&&d.test(t))){if(c=t,f=e,1===p&&(x.test(t)||m.test(t))){(f=H.test(t)&&U(e.parentNode)||e)==e&&le.scope||((s=e.getAttribute("id"))?s=ce.escapeSelector(s):e.setAttribute("id",s=S)),o=(l=Y(t)).length;while(o--)l[o]=(s?"#"+s:":scope")+" "+Q(l[o]);c=l.join(",")}try{return k.apply(n,f.querySelectorAll(c)),n}catch(e){h(t,!0)}finally{s===S&&e.removeAttribute("id")}}}return re(t.replace(ve,"$1"),e,n,r)}function W(){var r=[];return function e(t,n){return r.push(t+" ")>b.cacheLength&&delete e[r.shift()],e[t+" "]=n}}function F(e){return e[S]=!0,e}function $(e){var t=T.createElement("fieldset");try{return!!e(t)}catch(e){return!1}finally{t.parentNode&&t.parentNode.removeChild(t),t=null}}function B(t){return function(e){return fe(e,"input")&&e.type===t}}function _(t){return function(e){return(fe(e,"input")||fe(e,"button"))&&e.type===t}}function z(t){return function(e){return"form"in e?e.parentNode&&!1===e.disabled?"label"in e?"label"in e.parentNode?e.parentNode.disabled===t:e.disabled===t:e.isDisabled===t||e.isDisabled!==!t&&R(e)===t:e.disabled===t:"label"in e&&e.disabled===t}}function X(a){return F(function(o){return o=+o,F(function(e,t){var n,r=a([],e.length,o),i=r.length;while(i--)e[n=r[i]]&&(e[n]=!(t[n]=e[n]))})})}function U(e){return e&&"undefined"!=typeof e.getElementsByTagName&&e}function V(e){var t,n=e?e.ownerDocument||e:ye;return n!=T&&9===n.nodeType&&n.documentElement&&(r=(T=n).documentElement,C=!ce.isXMLDoc(T),i=r.matches||r.webkitMatchesSelector||r.msMatchesSelector,r.msMatchesSelector&&ye!=T&&(t=T.defaultView)&&t.top!==t&&t.addEventListener("unload",M),le.getById=$(function(e){return r.appendChild(e).id=ce.expando,!T.getElementsByName||!T.getElementsByName(ce.expando).length}),le.disconnectedMatch=$(function(e){return i.call(e,"*")}),le.scope=$(function(){return T.querySelectorAll(":scope")}),le.cssHas=$(function(){try{return T.querySelector(":has(*,:jqfake)"),!1}catch(e){return!0}}),le.getById?(b.filter.ID=function(e){var t=e.replace(O,P);return function(e){return e.getAttribute("id")===t}},b.find.ID=function(e,t){if("undefined"!=typeof t.getElementById&&C){var n=t.getElementById(e);return n?[n]:[]}}):(b.filter.ID=function(e){var n=e.replace(O,P);return function(e){var t="undefined"!=typeof e.getAttributeNode&&e.getAttributeNode("id");return t&&t.value===n}},b.find.ID=function(e,t){if("undefined"!=typeof t.getElementById&&C){var n,r,i,o=t.getElementById(e);if(o){if((n=o.getAttributeNode("id"))&&n.value===e)return[o];i=t.getElementsByName(e),r=0;while(o=i[r++])if((n=o.getAttributeNode("id"))&&n.value===e)return[o]}return[]}}),b.find.TAG=function(e,t){return"undefined"!=typeof t.getElementsByTagName?t.getElementsByTagName(e):t.querySelectorAll(e)},b.find.CLASS=function(e,t){if("undefined"!=typeof t.getElementsByClassName&&C)return t.getElementsByClassName(e)},d=[],$(function(e){var t;r.appendChild(e).innerHTML="<a id='"+S+"' href='' disabled='disabled'></a><select id='"+S+"-\r\\' disabled='disabled'><option selected=''></option></select>",e.querySelectorAll("[selected]").length||d.push("\\["+ge+"*(?:value|"+f+")"),e.querySelectorAll("[id~="+S+"-]").length||d.push("~="),e.querySelectorAll("a#"+S+"+*").length||d.push(".#.+[+~]"),e.querySelectorAll(":checked").length||d.push(":checked"),(t=T.createElement("input")).setAttribute("type","hidden"),e.appendChild(t).setAttribute("name","D"),r.appendChild(e).disabled=!0,2!==e.querySelectorAll(":disabled").length&&d.push(":enabled",":disabled"),(t=T.createElement("input")).setAttribute("name",""),e.appendChild(t),e.querySelectorAll("[name='']").length||d.push("\\["+ge+"*name"+ge+"*="+ge+"*(?:''|\"\")")}),le.cssHas||d.push(":has"),d=d.length&&new RegExp(d.join("|")),l=function(e,t){if(e===t)return a=!0,0;var n=!e.compareDocumentPosition-!t.compareDocumentPosition;return n||(1&(n=(e.ownerDocument||e)==(t.ownerDocument||t)?e.compareDocumentPosition(t):1)||!le.sortDetached&&t.compareDocumentPosition(e)===n?e===T||e.ownerDocument==ye&&I.contains(ye,e)?-1:t===T||t.ownerDocument==ye&&I.contains(ye,t)?1:o?se.call(o,e)-se.call(o,t):0:4&n?-1:1)}),T}for(e in I.matches=function(e,t){return I(e,null,null,t)},I.matchesSelector=function(e,t){if(V(e),C&&!h[t+" "]&&(!d||!d.test(t)))try{var n=i.call(e,t);if(n||le.disconnectedMatch||e.document&&11!==e.document.nodeType)return n}catch(e){h(t,!0)}return 0<I(t,T,null,[e]).length},I.contains=function(e,t){return(e.ownerDocument||e)!=T&&V(e),ce.contains(e,t)},I.attr=function(e,t){(e.ownerDocument||e)!=T&&V(e);var n=b.attrHandle[t.toLowerCase()],r=n&&ue.call(b.attrHandle,t.toLowerCase())?n(e,t,!C):void 0;return void 0!==r?r:e.getAttribute(t)},I.error=function(e){throw new Error("Syntax error, unrecognized expression: "+e)},ce.uniqueSort=function(e){var t,n=[],r=0,i=0;if(a=!le.sortStable,o=!le.sortStable&&ae.call(e,0),de.call(e,l),a){while(t=e[i++])t===e[i]&&(r=n.push(i));while(r--)he.call(e,n[r],1)}return o=null,e},ce.fn.uniqueSort=function(){return this.pushStack(ce.uniqueSort(ae.apply(this)))},(b=ce.expr={cacheLength:50,createPseudo:F,match:D,attrHandle:{},find:{},relative:{">":{dir:"parentNode",first:!0}," ":{dir:"parentNode"},"+":{dir:"previousSibling",first:!0},"~":{dir:"previousSibling"}},preFilter:{ATTR:function(e){return e[1]=e[1].replace(O,P),e[3]=(e[3]||e[4]||e[5]||"").replace(O,P),"~="===e[2]&&(e[3]=" "+e[3]+" "),e.slice(0,4)},CHILD:function(e){return e[1]=e[1].toLowerCase(),"nth"===e[1].slice(0,3)?(e[3]||I.error(e[0]),e[4]=+(e[4]?e[5]+(e[6]||1):2*("even"===e[3]||"odd"===e[3])),e[5]=+(e[7]+e[8]||"odd"===e[3])):e[3]&&I.error(e[0]),e},PSEUDO:function(e){var t,n=!e[6]&&e[2];return D.CHILD.test(e[0])?null:(e[3]?e[2]=e[4]||e[5]||"":n&&j.test(n)&&(t=Y(n,!0))&&(t=n.indexOf(")",n.length-t)-n.length)&&(e[0]=e[0].slice(0,t),e[2]=n.slice(0,t)),e.slice(0,3))}},filter:{TAG:function(e){var t=e.replace(O,P).toLowerCase();return"*"===e?function(){return!0}:function(e){return fe(e,t)}},CLASS:function(e){var t=s[e+" "];return t||(t=new RegExp("(^|"+ge+")"+e+"("+ge+"|$)"))&&s(e,function(e){return t.test("string"==typeof e.className&&e.className||"undefined"!=typeof e.getAttribute&&e.getAttribute("class")||"")})},ATTR:function(n,r,i){return function(e){var t=I.attr(e,n);return null==t?"!="===r:!r||(t+="","="===r?t===i:"!="===r?t!==i:"^="===r?i&&0===t.indexOf(i):"*="===r?i&&-1<t.indexOf(i):"$="===r?i&&t.slice(-i.length)===i:"~="===r?-1<(" "+t.replace(v," ")+" ").indexOf(i):"|="===r&&(t===i||t.slice(0,i.length+1)===i+"-"))}},CHILD:function(d,e,t,h,g){var v="nth"!==d.slice(0,3),y="last"!==d.slice(-4),m="of-type"===e;return 1===h&&0===g?function(e){return!!e.parentNode}:function(e,t,n){var r,i,o,a,s,u=v!==y?"nextSibling":"previousSibling",l=e.parentNode,c=m&&e.nodeName.toLowerCase(),f=!n&&!m,p=!1;if(l){if(v){while(u){o=e;while(o=o[u])if(m?fe(o,c):1===o.nodeType)return!1;s=u="only"===d&&!s&&"nextSibling"}return!0}if(s=[y?l.firstChild:l.lastChild],y&&f){p=(a=(r=(i=l[S]||(l[S]={}))[d]||[])[0]===E&&r[1])&&r[2],o=a&&l.childNodes[a];while(o=++a&&o&&o[u]||(p=a=0)||s.pop())if(1===o.nodeType&&++p&&o===e){i[d]=[E,a,p];break}}else if(f&&(p=a=(r=(i=e[S]||(e[S]={}))[d]||[])[0]===E&&r[1]),!1===p)while(o=++a&&o&&o[u]||(p=a=0)||s.pop())if((m?fe(o,c):1===o.nodeType)&&++p&&(f&&((i=o[S]||(o[S]={}))[d]=[E,p]),o===e))break;return(p-=g)===h||p%h==0&&0<=p/h}}},PSEUDO:function(e,o){var t,a=b.pseudos[e]||b.setFilters[e.toLowerCase()]||I.error("unsupported pseudo: "+e);return a[S]?a(o):1<a.length?(t=[e,e,"",o],b.setFilters.hasOwnProperty(e.toLowerCase())?F(function(e,t){var n,r=a(e,o),i=r.length;while(i--)e[n=se.call(e,r[i])]=!(t[n]=r[i])}):function(e){return a(e,0,t)}):a}},pseudos:{not:F(function(e){var r=[],i=[],s=ne(e.replace(ve,"$1"));return s[S]?F(function(e,t,n,r){var i,o=s(e,null,r,[]),a=e.length;while(a--)(i=o[a])&&(e[a]=!(t[a]=i))}):function(e,t,n){return r[0]=e,s(r,null,n,i),r[0]=null,!i.pop()}}),has:F(function(t){return function(e){return 0<I(t,e).length}}),contains:F(function(t){return t=t.replace(O,P),function(e){return-1<(e.textContent||ce.text(e)).indexOf(t)}}),lang:F(function(n){return A.test(n||"")||I.error("unsupported lang: "+n),n=n.replace(O,P).toLowerCase(),function(e){var t;do{if(t=C?e.lang:e.getAttribute("xml:lang")||e.getAttribute("lang"))return(t=t.toLowerCase())===n||0===t.indexOf(n+"-")}while((e=e.parentNode)&&1===e.nodeType);return!1}}),target:function(e){var t=ie.location&&ie.location.hash;return t&&t.slice(1)===e.id},root:function(e){return e===r},focus:function(e){return e===function(){try{return T.activeElement}catch(e){}}()&&T.hasFocus()&&!!(e.type||e.href||~e.tabIndex)},enabled:z(!1),disabled:z(!0),checked:function(e){return fe(e,"input")&&!!e.checked||fe(e,"option")&&!!e.selected},selected:function(e){return e.parentNode&&e.parentNode.selectedIndex,!0===e.selected},empty:function(e){for(e=e.firstChild;e;e=e.nextSibling)if(e.nodeType<6)return!1;return!0},parent:function(e){return!b.pseudos.empty(e)},header:function(e){return q.test(e.nodeName)},input:function(e){return N.test(e.nodeName)},button:function(e){return fe(e,"input")&&"button"===e.type||fe(e,"button")},text:function(e){var t;return fe(e,"input")&&"text"===e.type&&(null==(t=e.getAttribute("type"))||"text"===t.toLowerCase())},first:X(function(){return[0]}),last:X(function(e,t){return[t-1]}),eq:X(function(e,t,n){return[n<0?n+t:n]}),even:X(function(e,t){for(var n=0;n<t;n+=2)e.push(n);return e}),odd:X(function(e,t){for(var n=1;n<t;n+=2)e.push(n);return e}),lt:X(function(e,t,n){var r;for(r=n<0?n+t:t<n?t:n;0<=--r;)e.push(r);return e}),gt:X(function(e,t,n){for(var r=n<0?n+t:n;++r<t;)e.push(r);return e})}}).pseudos.nth=b.pseudos.eq,{radio:!0,checkbox:!0,file:!0,password:!0,image:!0})b.pseudos[e]=B(e);for(e in{submit:!0,reset:!0})b.pseudos[e]=_(e);function G(){}function Y(e,t){var n,r,i,o,a,s,u,l=c[e+" "];if(l)return t?0:l.slice(0);a=e,s=[],u=b.preFilter;while(a){for(o in n&&!(r=y.exec(a))||(r&&(a=a.slice(r[0].length)||a),s.push(i=[])),n=!1,(r=m.exec(a))&&(n=r.shift(),i.push({value:n,type:r[0].replace(ve," ")}),a=a.slice(n.length)),b.filter)!(r=D[o].exec(a))||u[o]&&!(r=u[o](r))||(n=r.shift(),i.push({value:n,type:o,matches:r}),a=a.slice(n.length));if(!n)break}return t?a.length:a?I.error(e):c(e,s).slice(0)}function Q(e){for(var t=0,n=e.length,r="";t<n;t++)r+=e[t].value;return r}function J(a,e,t){var s=e.dir,u=e.next,l=u||s,c=t&&"parentNode"===l,f=n++;return e.first?function(e,t,n){while(e=e[s])if(1===e.nodeType||c)return a(e,t,n);return!1}:function(e,t,n){var r,i,o=[E,f];if(n){while(e=e[s])if((1===e.nodeType||c)&&a(e,t,n))return!0}else while(e=e[s])if(1===e.nodeType||c)if(i=e[S]||(e[S]={}),u&&fe(e,u))e=e[s]||e;else{if((r=i[l])&&r[0]===E&&r[1]===f)return o[2]=r[2];if((i[l]=o)[2]=a(e,t,n))return!0}return!1}}function K(i){return 1<i.length?function(e,t,n){var r=i.length;while(r--)if(!i[r](e,t,n))return!1;return!0}:i[0]}function Z(e,t,n,r,i){for(var o,a=[],s=0,u=e.length,l=null!=t;s<u;s++)(o=e[s])&&(n&&!n(o,r,i)||(a.push(o),l&&t.push(s)));return a}function ee(d,h,g,v,y,e){return v&&!v[S]&&(v=ee(v)),y&&!y[S]&&(y=ee(y,e)),F(function(e,t,n,r){var i,o,a,s,u=[],l=[],c=t.length,f=e||function(e,t,n){for(var r=0,i=t.length;r<i;r++)I(e,t[r],n);return n}(h||"*",n.nodeType?[n]:n,[]),p=!d||!e&&h?f:Z(f,u,d,n,r);if(g?g(p,s=y||(e?d:c||v)?[]:t,n,r):s=p,v){i=Z(s,l),v(i,[],n,r),o=i.length;while(o--)(a=i[o])&&(s[l[o]]=!(p[l[o]]=a))}if(e){if(y||d){if(y){i=[],o=s.length;while(o--)(a=s[o])&&i.push(p[o]=a);y(null,s=[],i,r)}o=s.length;while(o--)(a=s[o])&&-1<(i=y?se.call(e,a):u[o])&&(e[i]=!(t[i]=a))}}else s=Z(s===t?s.splice(c,s.length):s),y?y(null,t,s,r):k.apply(t,s)})}function te(e){for(var i,t,n,r=e.length,o=b.relative[e[0].type],a=o||b.relative[" "],s=o?1:0,u=J(function(e){return e===i},a,!0),l=J(function(e){return-1<se.call(i,e)},a,!0),c=[function(e,t,n){var r=!o&&(n||t!=w)||((i=t).nodeType?u(e,t,n):l(e,t,n));return i=null,r}];s<r;s++)if(t=b.relative[e[s].type])c=[J(K(c),t)];else{if((t=b.filter[e[s].type].apply(null,e[s].matches))[S]){for(n=++s;n<r;n++)if(b.relative[e[n].type])break;return ee(1<s&&K(c),1<s&&Q(e.slice(0,s-1).concat({value:" "===e[s-2].type?"*":""})).replace(ve,"$1"),t,s<n&&te(e.slice(s,n)),n<r&&te(e=e.slice(n)),n<r&&Q(e))}c.push(t)}return K(c)}function ne(e,t){var n,v,y,m,x,r,i=[],o=[],a=u[e+" "];if(!a){t||(t=Y(e)),n=t.length;while(n--)(a=te(t[n]))[S]?i.push(a):o.push(a);(a=u(e,(v=o,m=0<(y=i).length,x=0<v.length,r=function(e,t,n,r,i){var o,a,s,u=0,l="0",c=e&&[],f=[],p=w,d=e||x&&b.find.TAG("*",i),h=E+=null==p?1:Math.random()||.1,g=d.length;for(i&&(w=t==T||t||i);l!==g&&null!=(o=d[l]);l++){if(x&&o){a=0,t||o.ownerDocument==T||(V(o),n=!C);while(s=v[a++])if(s(o,t||T,n)){k.call(r,o);break}i&&(E=h)}m&&((o=!s&&o)&&u--,e&&c.push(o))}if(u+=l,m&&l!==u){a=0;while(s=y[a++])s(c,f,t,n);if(e){if(0<u)while(l--)c[l]||f[l]||(f[l]=pe.call(r));f=Z(f)}k.apply(r,f),i&&!e&&0<f.length&&1<u+y.length&&ce.uniqueSort(r)}return i&&(E=h,w=p),c},m?F(r):r))).selector=e}return a}function re(e,t,n,r){var i,o,a,s,u,l="function"==typeof e&&e,c=!r&&Y(e=l.selector||e);if(n=n||[],1===c.length){if(2<(o=c[0]=c[0].slice(0)).length&&"ID"===(a=o[0]).type&&9===t.nodeType&&C&&b.relative[o[1].type]){if(!(t=(b.find.ID(a.matches[0].replace(O,P),t)||[])[0]))return n;l&&(t=t.parentNode),e=e.slice(o.shift().value.length)}i=D.needsContext.test(e)?0:o.length;while(i--){if(a=o[i],b.relative[s=a.type])break;if((u=b.find[s])&&(r=u(a.matches[0].replace(O,P),H.test(o[0].type)&&U(t.parentNode)||t))){if(o.splice(i,1),!(e=r.length&&Q(o)))return k.apply(n,r),n;break}}}return(l||ne(e,c))(r,t,!C,n,!t||H.test(e)&&U(t.parentNode)||t),n}G.prototype=b.filters=b.pseudos,b.setFilters=new G,le.sortStable=S.split("").sort(l).join("")===S,V(),le.sortDetached=$(function(e){return 1&e.compareDocumentPosition(T.createElement("fieldset"))}),ce.find=I,ce.expr[":"]=ce.expr.pseudos,ce.unique=ce.uniqueSort,I.compile=ne,I.select=re,I.setDocument=V,I.tokenize=Y,I.escape=ce.escapeSelector,I.getText=ce.text,I.isXML=ce.isXMLDoc,I.selectors=ce.expr,I.support=ce.support,I.uniqueSort=ce.uniqueSort}();var d=function(e,t,n){var r=[],i=void 0!==n;while((e=e[t])&&9!==e.nodeType)if(1===e.nodeType){if(i&&ce(e).is(n))break;r.push(e)}return r},h=function(e,t){for(var n=[];e;e=e.nextSibling)1===e.nodeType&&e!==t&&n.push(e);return n},b=ce.expr.match.needsContext,w=/^<([a-z][^\/\0>:\x20\t\r\n\f]*)[\x20\t\r\n\f]*\/?>(?:<\/\1>|)$/i;function T(e,n,r){return v(n)?ce.grep(e,function(e,t){return!!n.call(e,t,e)!==r}):n.nodeType?ce.grep(e,function(e){return e===n!==r}):"string"!=typeof n?ce.grep(e,function(e){return-1<se.call(n,e)!==r}):ce.filter(n,e,r)}ce.filter=function(e,t,n){var r=t[0];return n&&(e=":not("+e+")"),1===t.length&&1===r.nodeType?ce.find.matchesSelector(r,e)?[r]:[]:ce.find.matches(e,ce.grep(t,function(e){return 1===e.nodeType}))},ce.fn.extend({find:function(e){var t,n,r=this.length,i=this;if("string"!=typeof e)return this.pushStack(ce(e).filter(function(){for(t=0;t<r;t++)if(ce.contains(i[t],this))return!0}));for(n=this.pushStack([]),t=0;t<r;t++)ce.find(e,i[t],n);return 1<r?ce.uniqueSort(n):n},filter:function(e){return this.pushStack(T(this,e||[],!1))},not:function(e){return this.pushStack(T(this,e||[],!0))},is:function(e){return!!T(this,"string"==typeof e&&b.test(e)?ce(e):e||[],!1).length}});var k,S=/^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]+))$/;(ce.fn.init=function(e,t,n){var r,i;if(!e)return this;if(n=n||k,"string"==typeof e){if(!(r="<"===e[0]&&">"===e[e.length-1]&&3<=e.length?[null,e,null]:S.exec(e))||!r[1]&&t)return!t||t.jquery?(t||n).find(e):this.constructor(t).find(e);if(r[1]){if(t=t instanceof ce?t[0]:t,ce.merge(this,ce.parseHTML(r[1],t&&t.nodeType?t.ownerDocument||t:C,!0)),w.test(r[1])&&ce.isPlainObject(t))for(r in t)v(this[r])?this[r](t[r]):this.attr(r,t[r]);return this}return(i=C.getElementById(r[2]))&&(this[0]=i,this.length=1),this}return e.nodeType?(this[0]=e,this.length=1,this):v(e)?void 0!==n.ready?n.ready(e):e(ce):ce.makeArray(e,this)}).prototype=ce.fn,k=ce(C);var E=/^(?:parents|prev(?:Until|All))/,j={children:!0,contents:!0,next:!0,prev:!0};function A(e,t){while((e=e[t])&&1!==e.nodeType);return e}ce.fn.extend({has:function(e){var t=ce(e,this),n=t.length;return this.filter(function(){for(var e=0;e<n;e++)if(ce.contains(this,t[e]))return!0})},closest:function(e,t){var n,r=0,i=this.length,o=[],a="string"!=typeof e&&ce(e);if(!b.test(e))for(;r<i;r++)for(n=this[r];n&&n!==t;n=n.parentNode)if(n.nodeType<11&&(a?-1<a.index(n):1===n.nodeType&&ce.find.matchesSelector(n,e))){o.push(n);break}return this.pushStack(1<o.length?ce.uniqueSort(o):o)},index:function(e){return e?"string"==typeof e?se.call(ce(e),this[0]):se.call(this,e.jquery?e[0]:e):this[0]&&this[0].parentNode?this.first().prevAll().length:-1},add:function(e,t){return this.pushStack(ce.uniqueSort(ce.merge(this.get(),ce(e,t))))},addBack:function(e){return this.add(null==e?this.prevObject:this.prevObject.filter(e))}}),ce.each({parent:function(e){var t=e.parentNode;return t&&11!==t.nodeType?t:null},parents:function(e){return d(e,"parentNode")},parentsUntil:function(e,t,n){return d(e,"parentNode",n)},next:function(e){return A(e,"nextSibling")},prev:function(e){return A(e,"previousSibling")},nextAll:function(e){return d(e,"nextSibling")},prevAll:function(e){return d(e,"previousSibling")},nextUntil:function(e,t,n){return d(e,"nextSibling",n)},prevUntil:function(e,t,n){return d(e,"previousSibling",n)},siblings:function(e){return h((e.parentNode||{}).firstChild,e)},children:function(e){return h(e.firstChild)},contents:function(e){return null!=e.contentDocument&&r(e.contentDocument)?e.contentDocument:(fe(e,"template")&&(e=e.content||e),ce.merge([],e.childNodes))}},function(r,i){ce.fn[r]=function(e,t){var n=ce.map(this,i,e);return"Until"!==r.slice(-5)&&(t=e),t&&"string"==typeof t&&(n=ce.filter(t,n)),1<this.length&&(j[r]||ce.uniqueSort(n),E.test(r)&&n.reverse()),this.pushStack(n)}});var D=/[^\x20\t\r\n\f]+/g;function N(e){return e}function q(e){throw e}function L(e,t,n,r){var i;try{e&&v(i=e.promise)?i.call(e).done(t).fail(n):e&&v(i=e.then)?i.call(e,t,n):t.apply(void 0,[e].slice(r))}catch(e){n.apply(void 0,[e])}}ce.Callbacks=function(r){var e,n;r="string"==typeof r?(e=r,n={},ce.each(e.match(D)||[],function(e,t){n[t]=!0}),n):ce.extend({},r);var i,t,o,a,s=[],u=[],l=-1,c=function(){for(a=a||r.once,o=i=!0;u.length;l=-1){t=u.shift();while(++l<s.length)!1===s[l].apply(t[0],t[1])&&r.stopOnFalse&&(l=s.length,t=!1)}r.memory||(t=!1),i=!1,a&&(s=t?[]:"")},f={add:function(){return s&&(t&&!i&&(l=s.length-1,u.push(t)),function n(e){ce.each(e,function(e,t){v(t)?r.unique&&f.has(t)||s.push(t):t&&t.length&&"string"!==x(t)&&n(t)})}(arguments),t&&!i&&c()),this},remove:function(){return ce.each(arguments,function(e,t){var n;while(-1<(n=ce.inArray(t,s,n)))s.splice(n,1),n<=l&&l--}),this},has:function(e){return e?-1<ce.inArray(e,s):0<s.length},empty:function(){return s&&(s=[]),this},disable:function(){return a=u=[],s=t="",this},disabled:function(){return!s},lock:function(){return a=u=[],t||i||(s=t=""),this},locked:function(){return!!a},fireWith:function(e,t){return a||(t=[e,(t=t||[]).slice?t.slice():t],u.push(t),i||c()),this},fire:function(){return f.fireWith(this,arguments),this},fired:function(){return!!o}};return f},ce.extend({Deferred:function(e){var o=[["notify","progress",ce.Callbacks("memory"),ce.Callbacks("memory"),2],["resolve","done",ce.Callbacks("once memory"),ce.Callbacks("once memory"),0,"resolved"],["reject","fail",ce.Callbacks("once memory"),ce.Callbacks("once memory"),1,"rejected"]],i="pending",a={state:function(){return i},always:function(){return s.done(arguments).fail(arguments),this},"catch":function(e){return a.then(null,e)},pipe:function(){var i=arguments;return ce.Deferred(function(r){ce.each(o,function(e,t){var n=v(i[t[4]])&&i[t[4]];s[t[1]](function(){var e=n&&n.apply(this,arguments);e&&v(e.promise)?e.promise().progress(r.notify).done(r.resolve).fail(r.reject):r[t[0]+"With"](this,n?[e]:arguments)})}),i=null}).promise()},then:function(t,n,r){var u=0;function l(i,o,a,s){return function(){var n=this,r=arguments,e=function(){var e,t;if(!(i<u)){if((e=a.apply(n,r))===o.promise())throw new TypeError("Thenable self-resolution");t=e&&("object"==typeof e||"function"==typeof e)&&e.then,v(t)?s?t.call(e,l(u,o,N,s),l(u,o,q,s)):(u++,t.call(e,l(u,o,N,s),l(u,o,q,s),l(u,o,N,o.notifyWith))):(a!==N&&(n=void 0,r=[e]),(s||o.resolveWith)(n,r))}},t=s?e:function(){try{e()}catch(e){ce.Deferred.exceptionHook&&ce.Deferred.exceptionHook(e,t.error),u<=i+1&&(a!==q&&(n=void 0,r=[e]),o.rejectWith(n,r))}};i?t():(ce.Deferred.getErrorHook?t.error=ce.Deferred.getErrorHook():ce.Deferred.getStackHook&&(t.error=ce.Deferred.getStackHook()),ie.setTimeout(t))}}return ce.Deferred(function(e){o[0][3].add(l(0,e,v(r)?r:N,e.notifyWith)),o[1][3].add(l(0,e,v(t)?t:N)),o[2][3].add(l(0,e,v(n)?n:q))}).promise()},promise:function(e){return null!=e?ce.extend(e,a):a}},s={};return ce.each(o,function(e,t){var n=t[2],r=t[5];a[t[1]]=n.add,r&&n.add(function(){i=r},o[3-e][2].disable,o[3-e][3].disable,o[0][2].lock,o[0][3].lock),n.add(t[3].fire),s[t[0]]=function(){return s[t[0]+"With"](this===s?void 0:this,arguments),this},s[t[0]+"With"]=n.fireWith}),a.promise(s),e&&e.call(s,s),s},when:function(e){var n=arguments.length,t=n,r=Array(t),i=ae.call(arguments),o=ce.Deferred(),a=function(t){return function(e){r[t]=this,i[t]=1<arguments.length?ae.call(arguments):e,--n||o.resolveWith(r,i)}};if(n<=1&&(L(e,o.done(a(t)).resolve,o.reject,!n),"pending"===o.state()||v(i[t]&&i[t].then)))return o.then();while(t--)L(i[t],a(t),o.reject);return o.promise()}});var H=/^(Eval|Internal|Range|Reference|Syntax|Type|URI)Error$/;ce.Deferred.exceptionHook=function(){},ce.readyException=function(e){ie.setTimeout(function(){throw e})};var O=ce.Deferred();function P(){C.removeEventListener("DOMContentLoaded",P),ie.removeEventListener("load",P),ce.ready()}ce.fn.ready=function(e){return O.then(e)["catch"](function(e){ce.readyException(e)}),this},ce.extend({isReady:!1,readyWait:1,ready:function(e){(!0===e?--ce.readyWait:ce.isReady)||(ce.isReady=!0)!==e&&0<--ce.readyWait||O.resolveWith(C,[ce])}}),ce.ready.then=O.then,"complete"===C.readyState||"loading"!==C.readyState&&!C.documentElement.doScroll?ie.setTimeout(ce.ready):(C.addEventListener("DOMContentLoaded",P),ie.addEventListener("load",P));var M=function(e,t,n,r,i,o,a){var s=0,u=e.length,l=null==n;if("object"===x(n))for(s in i=!0,n)M(e,t,s,n[s],!0,o,a);else if(void 0!==r&&(i=!0,v(r)||(a=!0),l&&(a?(t.call(e,r),t=null):(l=t,t=function(e,t,n){return l.call(ce(e),n)})),t))for(;s<u;s++)t(e[s],n,a?r:r.call(e[s],s,t(e[s],n)));return i?e:l?t.call(e):u?t(e[0],n):o},R=/^-ms-/,I=/-([a-z])/g;function W(e,t){return t.toUpperCase()}function F(e){return e.replace(R,"ms-").replace(I,W)}var $=function(e){return 1===e.nodeType||9===e.nodeType||!+e.nodeType};function B(){this.expando=ce.expando+B.uid++}B.uid=1,B.prototype={cache:function(e){var t=e[this.expando];return t||(t={},$(e)&&(e.nodeType?e[this.expando]=t:Object.defineProperty(e,this.expando,{value:t,configurable:!0}))),t},set:function(e,t,n){var r,i=this.cache(e);if("string"==typeof t)i[F(t)]=n;else for(r in t)i[F(r)]=t[r];return i},get:function(e,t){return void 0===t?this.cache(e):e[this.expando]&&e[this.expando][F(t)]},access:function(e,t,n){return void 0===t||t&&"string"==typeof t&&void 0===n?this.get(e,t):(this.set(e,t,n),void 0!==n?n:t)},remove:function(e,t){var n,r=e[this.expando];if(void 0!==r){if(void 0!==t){n=(t=Array.isArray(t)?t.map(F):(t=F(t))in r?[t]:t.match(D)||[]).length;while(n--)delete r[t[n]]}(void 0===t||ce.isEmptyObject(r))&&(e.nodeType?e[this.expando]=void 0:delete e[this.expando])}},hasData:function(e){var t=e[this.expando];return void 0!==t&&!ce.isEmptyObject(t)}};var _=new B,z=new B,X=/^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,U=/[A-Z]/g;function V(e,t,n){var r,i;if(void 0===n&&1===e.nodeType)if(r="data-"+t.replace(U,"-$&").toLowerCase(),"string"==typeof(n=e.getAttribute(r))){try{n="true"===(i=n)||"false"!==i&&("null"===i?null:i===+i+""?+i:X.test(i)?JSON.parse(i):i)}catch(e){}z.set(e,t,n)}else n=void 0;return n}ce.extend({hasData:function(e){return z.hasData(e)||_.hasData(e)},data:function(e,t,n){return z.access(e,t,n)},removeData:function(e,t){z.remove(e,t)},_data:function(e,t,n){return _.access(e,t,n)},_removeData:function(e,t){_.remove(e,t)}}),ce.fn.extend({data:function(n,e){var t,r,i,o=this[0],a=o&&o.attributes;if(void 0===n){if(this.length&&(i=z.get(o),1===o.nodeType&&!_.get(o,"hasDataAttrs"))){t=a.length;while(t--)a[t]&&0===(r=a[t].name).indexOf("data-")&&(r=F(r.slice(5)),V(o,r,i[r]));_.set(o,"hasDataAttrs",!0)}return i}return"object"==typeof n?this.each(function(){z.set(this,n)}):M(this,function(e){var t;if(o&&void 0===e)return void 0!==(t=z.get(o,n))?t:void 0!==(t=V(o,n))?t:void 0;this.each(function(){z.set(this,n,e)})},null,e,1<arguments.length,null,!0)},removeData:function(e){return this.each(function(){z.remove(this,e)})}}),ce.extend({queue:function(e,t,n){var r;if(e)return t=(t||"fx")+"queue",r=_.get(e,t),n&&(!r||Array.isArray(n)?r=_.access(e,t,ce.makeArray(n)):r.push(n)),r||[]},dequeue:function(e,t){t=t||"fx";var n=ce.queue(e,t),r=n.length,i=n.shift(),o=ce._queueHooks(e,t);"inprogress"===i&&(i=n.shift(),r--),i&&("fx"===t&&n.unshift("inprogress"),delete o.stop,i.call(e,function(){ce.dequeue(e,t)},o)),!r&&o&&o.empty.fire()},_queueHooks:function(e,t){var n=t+"queueHooks";return _.get(e,n)||_.access(e,n,{empty:ce.Callbacks("once memory").add(function(){_.remove(e,[t+"queue",n])})})}}),ce.fn.extend({queue:function(t,n){var e=2;return"string"!=typeof t&&(n=t,t="fx",e--),arguments.length<e?ce.queue(this[0],t):void 0===n?this:this.each(function(){var e=ce.queue(this,t,n);ce._queueHooks(this,t),"fx"===t&&"inprogress"!==e[0]&&ce.dequeue(this,t)})},dequeue:function(e){return this.each(function(){ce.dequeue(this,e)})},clearQueue:function(e){return this.queue(e||"fx",[])},promise:function(e,t){var n,r=1,i=ce.Deferred(),o=this,a=this.length,s=function(){--r||i.resolveWith(o,[o])};"string"!=typeof e&&(t=e,e=void 0),e=e||"fx";while(a--)(n=_.get(o[a],e+"queueHooks"))&&n.empty&&(r++,n.empty.add(s));return s(),i.promise(t)}});var G=/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source,Y=new RegExp("^(?:([+-])=|)("+G+")([a-z%]*)$","i"),Q=["Top","Right","Bottom","Left"],J=C.documentElement,K=function(e){return ce.contains(e.ownerDocument,e)},Z={composed:!0};J.getRootNode&&(K=function(e){return ce.contains(e.ownerDocument,e)||e.getRootNode(Z)===e.ownerDocument});var ee=function(e,t){return"none"===(e=t||e).style.display||""===e.style.display&&K(e)&&"none"===ce.css(e,"display")};function te(e,t,n,r){var i,o,a=20,s=r?function(){return r.cur()}:function(){return ce.css(e,t,"")},u=s(),l=n&&n[3]||(ce.cssNumber[t]?"":"px"),c=e.nodeType&&(ce.cssNumber[t]||"px"!==l&&+u)&&Y.exec(ce.css(e,t));if(c&&c[3]!==l){u/=2,l=l||c[3],c=+u||1;while(a--)ce.style(e,t,c+l),(1-o)*(1-(o=s()/u||.5))<=0&&(a=0),c/=o;c*=2,ce.style(e,t,c+l),n=n||[]}return n&&(c=+c||+u||0,i=n[1]?c+(n[1]+1)*n[2]:+n[2],r&&(r.unit=l,r.start=c,r.end=i)),i}var ne={};function re(e,t){for(var n,r,i,o,a,s,u,l=[],c=0,f=e.length;c<f;c++)(r=e[c]).style&&(n=r.style.display,t?("none"===n&&(l[c]=_.get(r,"display")||null,l[c]||(r.style.display="")),""===r.style.display&&ee(r)&&(l[c]=(u=a=o=void 0,a=(i=r).ownerDocument,s=i.nodeName,(u=ne[s])||(o=a.body.appendChild(a.createElement(s)),u=ce.css(o,"display"),o.parentNode.removeChild(o),"none"===u&&(u="block"),ne[s]=u)))):"none"!==n&&(l[c]="none",_.set(r,"display",n)));for(c=0;c<f;c++)null!=l[c]&&(e[c].style.display=l[c]);return e}ce.fn.extend({show:function(){return re(this,!0)},hide:function(){return re(this)},toggle:function(e){return"boolean"==typeof e?e?this.show():this.hide():this.each(function(){ee(this)?ce(this).show():ce(this).hide()})}});var xe,be,we=/^(?:checkbox|radio)$/i,Te=/<([a-z][^\/\0>\x20\t\r\n\f]*)/i,Ce=/^$|^module$|\/(?:java|ecma)script/i;xe=C.createDocumentFragment().appendChild(C.createElement("div")),(be=C.createElement("input")).setAttribute("type","radio"),be.setAttribute("checked","checked"),be.setAttribute("name","t"),xe.appendChild(be),le.checkClone=xe.cloneNode(!0).cloneNode(!0).lastChild.checked,xe.innerHTML="<textarea>x</textarea>",le.noCloneChecked=!!xe.cloneNode(!0).lastChild.defaultValue,xe.innerHTML="<option></option>",le.option=!!xe.lastChild;var ke={thead:[1,"<table>","</table>"],col:[2,"<table><colgroup>","</colgroup></table>"],tr:[2,"<table><tbody>","</tbody></table>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],_default:[0,"",""]};function Se(e,t){var n;return n="undefined"!=typeof e.getElementsByTagName?e.getElementsByTagName(t||"*"):"undefined"!=typeof e.querySelectorAll?e.querySelectorAll(t||"*"):[],void 0===t||t&&fe(e,t)?ce.merge([e],n):n}function Ee(e,t){for(var n=0,r=e.length;n<r;n++)_.set(e[n],"globalEval",!t||_.get(t[n],"globalEval"))}ke.tbody=ke.tfoot=ke.colgroup=ke.caption=ke.thead,ke.th=ke.td,le.option||(ke.optgroup=ke.option=[1,"<select multiple='multiple'>","</select>"]);var je=/<|&#?\w+;/;function Ae(e,t,n,r,i){for(var o,a,s,u,l,c,f=t.createDocumentFragment(),p=[],d=0,h=e.length;d<h;d++)if((o=e[d])||0===o)if("object"===x(o))ce.merge(p,o.nodeType?[o]:o);else if(je.test(o)){a=a||f.appendChild(t.createElement("div")),s=(Te.exec(o)||["",""])[1].toLowerCase(),u=ke[s]||ke._default,a.innerHTML=u[1]+ce.htmlPrefilter(o)+u[2],c=u[0];while(c--)a=a.lastChild;ce.merge(p,a.childNodes),(a=f.firstChild).textContent=""}else p.push(t.createTextNode(o));f.textContent="",d=0;while(o=p[d++])if(r&&-1<ce.inArray(o,r))i&&i.push(o);else if(l=K(o),a=Se(f.appendChild(o),"script"),l&&Ee(a),n){c=0;while(o=a[c++])Ce.test(o.type||"")&&n.push(o)}return f}var De=/^([^.]*)(?:\.(.+)|)/;function Ne(){return!0}function qe(){return!1}function Le(e,t,n,r,i,o){var a,s;if("object"==typeof t){for(s in"string"!=typeof n&&(r=r||n,n=void 0),t)Le(e,s,n,r,t[s],o);return e}if(null==r&&null==i?(i=n,r=n=void 0):null==i&&("string"==typeof n?(i=r,r=void 0):(i=r,r=n,n=void 0)),!1===i)i=qe;else if(!i)return e;return 1===o&&(a=i,(i=function(e){return ce().off(e),a.apply(this,arguments)}).guid=a.guid||(a.guid=ce.guid++)),e.each(function(){ce.event.add(this,t,i,r,n)})}function He(e,r,t){t?(_.set(e,r,!1),ce.event.add(e,r,{namespace:!1,handler:function(e){var t,n=_.get(this,r);if(1&e.isTrigger&&this[r]){if(n)(ce.event.special[r]||{}).delegateType&&e.stopPropagation();else if(n=ae.call(arguments),_.set(this,r,n),this[r](),t=_.get(this,r),_.set(this,r,!1),n!==t)return e.stopImmediatePropagation(),e.preventDefault(),t}else n&&(_.set(this,r,ce.event.trigger(n[0],n.slice(1),this)),e.stopPropagation(),e.isImmediatePropagationStopped=Ne)}})):void 0===_.get(e,r)&&ce.event.add(e,r,Ne)}ce.event={global:{},add:function(t,e,n,r,i){var o,a,s,u,l,c,f,p,d,h,g,v=_.get(t);if($(t)){n.handler&&(n=(o=n).handler,i=o.selector),i&&ce.find.matchesSelector(J,i),n.guid||(n.guid=ce.guid++),(u=v.events)||(u=v.events=Object.create(null)),(a=v.handle)||(a=v.handle=function(e){return"undefined"!=typeof ce&&ce.event.triggered!==e.type?ce.event.dispatch.apply(t,arguments):void 0}),l=(e=(e||"").match(D)||[""]).length;while(l--)d=g=(s=De.exec(e[l])||[])[1],h=(s[2]||"").split(".").sort(),d&&(f=ce.event.special[d]||{},d=(i?f.delegateType:f.bindType)||d,f=ce.event.special[d]||{},c=ce.extend({type:d,origType:g,data:r,handler:n,guid:n.guid,selector:i,needsContext:i&&ce.expr.match.needsContext.test(i),namespace:h.join(".")},o),(p=u[d])||((p=u[d]=[]).delegateCount=0,f.setup&&!1!==f.setup.call(t,r,h,a)||t.addEventListener&&t.addEventListener(d,a)),f.add&&(f.add.call(t,c),c.handler.guid||(c.handler.guid=n.guid)),i?p.splice(p.delegateCount++,0,c):p.push(c),ce.event.global[d]=!0)}},remove:function(e,t,n,r,i){var o,a,s,u,l,c,f,p,d,h,g,v=_.hasData(e)&&_.get(e);if(v&&(u=v.events)){l=(t=(t||"").match(D)||[""]).length;while(l--)if(d=g=(s=De.exec(t[l])||[])[1],h=(s[2]||"").split(".").sort(),d){f=ce.event.special[d]||{},p=u[d=(r?f.delegateType:f.bindType)||d]||[],s=s[2]&&new RegExp("(^|\\.)"+h.join("\\.(?:.*\\.|)")+"(\\.|$)"),a=o=p.length;while(o--)c=p[o],!i&&g!==c.origType||n&&n.guid!==c.guid||s&&!s.test(c.namespace)||r&&r!==c.selector&&("**"!==r||!c.selector)||(p.splice(o,1),c.selector&&p.delegateCount--,f.remove&&f.remove.call(e,c));a&&!p.length&&(f.teardown&&!1!==f.teardown.call(e,h,v.handle)||ce.removeEvent(e,d,v.handle),delete u[d])}else for(d in u)ce.event.remove(e,d+t[l],n,r,!0);ce.isEmptyObject(u)&&_.remove(e,"handle events")}},dispatch:function(e){var t,n,r,i,o,a,s=new Array(arguments.length),u=ce.event.fix(e),l=(_.get(this,"events")||Object.create(null))[u.type]||[],c=ce.event.special[u.type]||{};for(s[0]=u,t=1;t<arguments.length;t++)s[t]=arguments[t];if(u.delegateTarget=this,!c.preDispatch||!1!==c.preDispatch.call(this,u)){a=ce.event.handlers.call(this,u,l),t=0;while((i=a[t++])&&!u.isPropagationStopped()){u.currentTarget=i.elem,n=0;while((o=i.handlers[n++])&&!u.isImmediatePropagationStopped())u.rnamespace&&!1!==o.namespace&&!u.rnamespace.test(o.namespace)||(u.handleObj=o,u.data=o.data,void 0!==(r=((ce.event.special[o.origType]||{}).handle||o.handler).apply(i.elem,s))&&!1===(u.result=r)&&(u.preventDefault(),u.stopPropagation()))}return c.postDispatch&&c.postDispatch.call(this,u),u.result}},handlers:function(e,t){var n,r,i,o,a,s=[],u=t.delegateCount,l=e.target;if(u&&l.nodeType&&!("click"===e.type&&1<=e.button))for(;l!==this;l=l.parentNode||this)if(1===l.nodeType&&("click"!==e.type||!0!==l.disabled)){for(o=[],a={},n=0;n<u;n++)void 0===a[i=(r=t[n]).selector+" "]&&(a[i]=r.needsContext?-1<ce(i,this).index(l):ce.find(i,this,null,[l]).length),a[i]&&o.push(r);o.length&&s.push({elem:l,handlers:o})}return l=this,u<t.length&&s.push({elem:l,handlers:t.slice(u)}),s},addProp:function(t,e){Object.defineProperty(ce.Event.prototype,t,{enumerable:!0,configurable:!0,get:v(e)?function(){if(this.originalEvent)return e(this.originalEvent)}:function(){if(this.originalEvent)return this.originalEvent[t]},set:function(e){Object.defineProperty(this,t,{enumerable:!0,configurable:!0,writable:!0,value:e})}})},fix:function(e){return e[ce.expando]?e:new ce.Event(e)},special:{load:{noBubble:!0},click:{setup:function(e){var t=this||e;return we.test(t.type)&&t.click&&fe(t,"input")&&He(t,"click",!0),!1},trigger:function(e){var t=this||e;return we.test(t.type)&&t.click&&fe(t,"input")&&He(t,"click"),!0},_default:function(e){var t=e.target;return we.test(t.type)&&t.click&&fe(t,"input")&&_.get(t,"click")||fe(t,"a")}},beforeunload:{postDispatch:function(e){void 0!==e.result&&e.originalEvent&&(e.originalEvent.returnValue=e.result)}}}},ce.removeEvent=function(e,t,n){e.removeEventListener&&e.removeEventListener(t,n)},ce.Event=function(e,t){if(!(this instanceof ce.Event))return new ce.Event(e,t);e&&e.type?(this.originalEvent=e,this.type=e.type,this.isDefaultPrevented=e.defaultPrevented||void 0===e.defaultPrevented&&!1===e.returnValue?Ne:qe,this.target=e.target&&3===e.target.nodeType?e.target.parentNode:e.target,this.currentTarget=e.currentTarget,this.relatedTarget=e.relatedTarget):this.type=e,t&&ce.extend(this,t),this.timeStamp=e&&e.timeStamp||Date.now(),this[ce.expando]=!0},ce.Event.prototype={constructor:ce.Event,isDefaultPrevented:qe,isPropagationStopped:qe,isImmediatePropagationStopped:qe,isSimulated:!1,preventDefault:function(){var e=this.originalEvent;this.isDefaultPrevented=Ne,e&&!this.isSimulated&&e.preventDefault()},stopPropagation:function(){var e=this.originalEvent;this.isPropagationStopped=Ne,e&&!this.isSimulated&&e.stopPropagation()},stopImmediatePropagation:function(){var e=this.originalEvent;this.isImmediatePropagationStopped=Ne,e&&!this.isSimulated&&e.stopImmediatePropagation(),this.stopPropagation()}},ce.each({altKey:!0,bubbles:!0,cancelable:!0,changedTouches:!0,ctrlKey:!0,detail:!0,eventPhase:!0,metaKey:!0,pageX:!0,pageY:!0,shiftKey:!0,view:!0,"char":!0,code:!0,charCode:!0,key:!0,keyCode:!0,button:!0,buttons:!0,clientX:!0,clientY:!0,offsetX:!0,offsetY:!0,pointerId:!0,pointerType:!0,screenX:!0,screenY:!0,targetTouches:!0,toElement:!0,touches:!0,which:!0},ce.event.addProp),ce.each({focus:"focusin",blur:"focusout"},function(r,i){function o(e){if(C.documentMode){var t=_.get(this,"handle"),n=ce.event.fix(e);n.type="focusin"===e.type?"focus":"blur",n.isSimulated=!0,t(e),n.target===n.currentTarget&&t(n)}else ce.event.simulate(i,e.target,ce.event.fix(e))}ce.event.special[r]={setup:function(){var e;if(He(this,r,!0),!C.documentMode)return!1;(e=_.get(this,i))||this.addEventListener(i,o),_.set(this,i,(e||0)+1)},trigger:function(){return He(this,r),!0},teardown:function(){var e;if(!C.documentMode)return!1;(e=_.get(this,i)-1)?_.set(this,i,e):(this.removeEventListener(i,o),_.remove(this,i))},_default:function(e){return _.get(e.target,r)},delegateType:i},ce.event.special[i]={setup:function(){var e=this.ownerDocument||this.document||this,t=C.documentMode?this:e,n=_.get(t,i);n||(C.documentMode?this.addEventListener(i,o):e.addEventListener(r,o,!0)),_.set(t,i,(n||0)+1)},teardown:function(){var e=this.ownerDocument||this.document||this,t=C.documentMode?this:e,n=_.get(t,i)-1;n?_.set(t,i,n):(C.documentMode?this.removeEventListener(i,o):e.removeEventListener(r,o,!0),_.remove(t,i))}}}),ce.each({mouseenter:"mouseover",mouseleave:"mouseout",pointerenter:"pointerover",pointerleave:"pointerout"},function(e,i){ce.event.special[e]={delegateType:i,bindType:i,handle:function(e){var t,n=e.relatedTarget,r=e.handleObj;return n&&(n===this||ce.contains(this,n))||(e.type=r.origType,t=r.handler.apply(this,arguments),e.type=i),t}}}),ce.fn.extend({on:function(e,t,n,r){return Le(this,e,t,n,r)},one:function(e,t,n,r){return Le(this,e,t,n,r,1)},off:function(e,t,n){var r,i;if(e&&e.preventDefault&&e.handleObj)return r=e.handleObj,ce(e.delegateTarget).off(r.namespace?r.origType+"."+r.namespace:r.origType,r.selector,r.handler),this;if("object"==typeof e){for(i in e)this.off(i,t,e[i]);return this}return!1!==t&&"function"!=typeof t||(n=t,t=void 0),!1===n&&(n=qe),this.each(function(){ce.event.remove(this,e,n,t)})}});var Oe=/<script|<style|<link/i,Pe=/checked\s*(?:[^=]|=\s*.checked.)/i,Me=/^\s*<!\[CDATA\[|\]\]>\s*$/g;function Re(e,t){return fe(e,"table")&&fe(11!==t.nodeType?t:t.firstChild,"tr")&&ce(e).children("tbody")[0]||e}function Ie(e){return e.type=(null!==e.getAttribute("type"))+"/"+e.type,e}function We(e){return"true/"===(e.type||"").slice(0,5)?e.type=e.type.slice(5):e.removeAttribute("type"),e}function Fe(e,t){var n,r,i,o,a,s;if(1===t.nodeType){if(_.hasData(e)&&(s=_.get(e).events))for(i in _.remove(t,"handle events"),s)for(n=0,r=s[i].length;n<r;n++)ce.event.add(t,i,s[i][n]);z.hasData(e)&&(o=z.access(e),a=ce.extend({},o),z.set(t,a))}}function $e(n,r,i,o){r=g(r);var e,t,a,s,u,l,c=0,f=n.length,p=f-1,d=r[0],h=v(d);if(h||1<f&&"string"==typeof d&&!le.checkClone&&Pe.test(d))return n.each(function(e){var t=n.eq(e);h&&(r[0]=d.call(this,e,t.html())),$e(t,r,i,o)});if(f&&(t=(e=Ae(r,n[0].ownerDocument,!1,n,o)).firstChild,1===e.childNodes.length&&(e=t),t||o)){for(s=(a=ce.map(Se(e,"script"),Ie)).length;c<f;c++)u=e,c!==p&&(u=ce.clone(u,!0,!0),s&&ce.merge(a,Se(u,"script"))),i.call(n[c],u,c);if(s)for(l=a[a.length-1].ownerDocument,ce.map(a,We),c=0;c<s;c++)u=a[c],Ce.test(u.type||"")&&!_.access(u,"globalEval")&&ce.contains(l,u)&&(u.src&&"module"!==(u.type||"").toLowerCase()?ce._evalUrl&&!u.noModule&&ce._evalUrl(u.src,{nonce:u.nonce||u.getAttribute("nonce")},l):m(u.textContent.replace(Me,""),u,l))}return n}function Be(e,t,n){for(var r,i=t?ce.filter(t,e):e,o=0;null!=(r=i[o]);o++)n||1!==r.nodeType||ce.cleanData(Se(r)),r.parentNode&&(n&&K(r)&&Ee(Se(r,"script")),r.parentNode.removeChild(r));return e}ce.extend({htmlPrefilter:function(e){return e},clone:function(e,t,n){var r,i,o,a,s,u,l,c=e.cloneNode(!0),f=K(e);if(!(le.noCloneChecked||1!==e.nodeType&&11!==e.nodeType||ce.isXMLDoc(e)))for(a=Se(c),r=0,i=(o=Se(e)).length;r<i;r++)s=o[r],u=a[r],void 0,"input"===(l=u.nodeName.toLowerCase())&&we.test(s.type)?u.checked=s.checked:"input"!==l&&"textarea"!==l||(u.defaultValue=s.defaultValue);if(t)if(n)for(o=o||Se(e),a=a||Se(c),r=0,i=o.length;r<i;r++)Fe(o[r],a[r]);else Fe(e,c);return 0<(a=Se(c,"script")).length&&Ee(a,!f&&Se(e,"script")),c},cleanData:function(e){for(var t,n,r,i=ce.event.special,o=0;void 0!==(n=e[o]);o++)if($(n)){if(t=n[_.expando]){if(t.events)for(r in t.events)i[r]?ce.event.remove(n,r):ce.removeEvent(n,r,t.handle);n[_.expando]=void 0}n[z.expando]&&(n[z.expando]=void 0)}}}),ce.fn.extend({detach:function(e){return Be(this,e,!0)},remove:function(e){return Be(this,e)},text:function(e){return M(this,function(e){return void 0===e?ce.text(this):this.empty().each(function(){1!==this.nodeType&&11!==this.nodeType&&9!==this.nodeType||(this.textContent=e)})},null,e,arguments.length)},append:function(){return $e(this,arguments,function(e){1!==this.nodeType&&11!==this.nodeType&&9!==this.nodeType||Re(this,e).appendChild(e)})},prepend:function(){return $e(this,arguments,function(e){if(1===this.nodeType||11===this.nodeType||9===this.nodeType){var t=Re(this,e);t.insertBefore(e,t.firstChild)}})},before:function(){return $e(this,arguments,function(e){this.parentNode&&this.parentNode.insertBefore(e,this)})},after:function(){return $e(this,arguments,function(e){this.parentNode&&this.parentNode.insertBefore(e,this.nextSibling)})},empty:function(){for(var e,t=0;null!=(e=this[t]);t++)1===e.nodeType&&(ce.cleanData(Se(e,!1)),e.textContent="");return this},clone:function(e,t){return e=null!=e&&e,t=null==t?e:t,this.map(function(){return ce.clone(this,e,t)})},html:function(e){return M(this,function(e){var t=this[0]||{},n=0,r=this.length;if(void 0===e&&1===t.nodeType)return t.innerHTML;if("string"==typeof e&&!Oe.test(e)&&!ke[(Te.exec(e)||["",""])[1].toLowerCase()]){e=ce.htmlPrefilter(e);try{for(;n<r;n++)1===(t=this[n]||{}).nodeType&&(ce.cleanData(Se(t,!1)),t.innerHTML=e);t=0}catch(e){}}t&&this.empty().append(e)},null,e,arguments.length)},replaceWith:function(){var n=[];return $e(this,arguments,function(e){var t=this.parentNode;ce.inArray(this,n)<0&&(ce.cleanData(Se(this)),t&&t.replaceChild(e,this))},n)}}),ce.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(e,a){ce.fn[e]=function(e){for(var t,n=[],r=ce(e),i=r.length-1,o=0;o<=i;o++)t=o===i?this:this.clone(!0),ce(r[o])[a](t),s.apply(n,t.get());return this.pushStack(n)}});var _e=new RegExp("^("+G+")(?!px)[a-z%]+$","i"),ze=/^--/,Xe=function(e){var t=e.ownerDocument.defaultView;return t&&t.opener||(t=ie),t.getComputedStyle(e)},Ue=function(e,t,n){var r,i,o={};for(i in t)o[i]=e.style[i],e.style[i]=t[i];for(i in r=n.call(e),t)e.style[i]=o[i];return r},Ve=new RegExp(Q.join("|"),"i");function Ge(e,t,n){var r,i,o,a,s=ze.test(t),u=e.style;return(n=n||Xe(e))&&(a=n.getPropertyValue(t)||n[t],s&&a&&(a=a.replace(ve,"$1")||void 0),""!==a||K(e)||(a=ce.style(e,t)),!le.pixelBoxStyles()&&_e.test(a)&&Ve.test(t)&&(r=u.width,i=u.minWidth,o=u.maxWidth,u.minWidth=u.maxWidth=u.width=a,a=n.width,u.width=r,u.minWidth=i,u.maxWidth=o)),void 0!==a?a+"":a}function Ye(e,t){return{get:function(){if(!e())return(this.get=t).apply(this,arguments);delete this.get}}}!function(){function e(){if(l){u.style.cssText="position:absolute;left:-11111px;width:60px;margin-top:1px;padding:0;border:0",l.style.cssText="position:relative;display:block;box-sizing:border-box;overflow:scroll;margin:auto;border:1px;padding:1px;width:60%;top:1%",J.appendChild(u).appendChild(l);var e=ie.getComputedStyle(l);n="1%"!==e.top,s=12===t(e.marginLeft),l.style.right="60%",o=36===t(e.right),r=36===t(e.width),l.style.position="absolute",i=12===t(l.offsetWidth/3),J.removeChild(u),l=null}}function t(e){return Math.round(parseFloat(e))}var n,r,i,o,a,s,u=C.createElement("div"),l=C.createElement("div");l.style&&(l.style.backgroundClip="content-box",l.cloneNode(!0).style.backgroundClip="",le.clearCloneStyle="content-box"===l.style.backgroundClip,ce.extend(le,{boxSizingReliable:function(){return e(),r},pixelBoxStyles:function(){return e(),o},pixelPosition:function(){return e(),n},reliableMarginLeft:function(){return e(),s},scrollboxSize:function(){return e(),i},reliableTrDimensions:function(){var e,t,n,r;return null==a&&(e=C.createElement("table"),t=C.createElement("tr"),n=C.createElement("div"),e.style.cssText="position:absolute;left:-11111px;border-collapse:separate",t.style.cssText="box-sizing:content-box;border:1px solid",t.style.height="1px",n.style.height="9px",n.style.display="block",J.appendChild(e).appendChild(t).appendChild(n),r=ie.getComputedStyle(t),a=parseInt(r.height,10)+parseInt(r.borderTopWidth,10)+parseInt(r.borderBottomWidth,10)===t.offsetHeight,J.removeChild(e)),a}}))}();var Qe=["Webkit","Moz","ms"],Je=C.createElement("div").style,Ke={};function Ze(e){var t=ce.cssProps[e]||Ke[e];return t||(e in Je?e:Ke[e]=function(e){var t=e[0].toUpperCase()+e.slice(1),n=Qe.length;while(n--)if((e=Qe[n]+t)in Je)return e}(e)||e)}var et=/^(none|table(?!-c[ea]).+)/,tt={position:"absolute",visibility:"hidden",display:"block"},nt={letterSpacing:"0",fontWeight:"400"};function rt(e,t,n){var r=Y.exec(t);return r?Math.max(0,r[2]-(n||0))+(r[3]||"px"):t}function it(e,t,n,r,i,o){var a="width"===t?1:0,s=0,u=0,l=0;if(n===(r?"border":"content"))return 0;for(;a<4;a+=2)"margin"===n&&(l+=ce.css(e,n+Q[a],!0,i)),r?("content"===n&&(u-=ce.css(e,"padding"+Q[a],!0,i)),"margin"!==n&&(u-=ce.css(e,"border"+Q[a]+"Width",!0,i))):(u+=ce.css(e,"padding"+Q[a],!0,i),"padding"!==n?u+=ce.css(e,"border"+Q[a]+"Width",!0,i):s+=ce.css(e,"border"+Q[a]+"Width",!0,i));return!r&&0<=o&&(u+=Math.max(0,Math.ceil(e["offset"+t[0].toUpperCase()+t.slice(1)]-o-u-s-.5))||0),u+l}function ot(e,t,n){var r=Xe(e),i=(!le.boxSizingReliable()||n)&&"border-box"===ce.css(e,"boxSizing",!1,r),o=i,a=Ge(e,t,r),s="offset"+t[0].toUpperCase()+t.slice(1);if(_e.test(a)){if(!n)return a;a="auto"}return(!le.boxSizingReliable()&&i||!le.reliableTrDimensions()&&fe(e,"tr")||"auto"===a||!parseFloat(a)&&"inline"===ce.css(e,"display",!1,r))&&e.getClientRects().length&&(i="border-box"===ce.css(e,"boxSizing",!1,r),(o=s in e)&&(a=e[s])),(a=parseFloat(a)||0)+it(e,t,n||(i?"border":"content"),o,r,a)+"px"}function at(e,t,n,r,i){return new at.prototype.init(e,t,n,r,i)}ce.extend({cssHooks:{opacity:{get:function(e,t){if(t){var n=Ge(e,"opacity");return""===n?"1":n}}}},cssNumber:{animationIterationCount:!0,aspectRatio:!0,borderImageSlice:!0,columnCount:!0,flexGrow:!0,flexShrink:!0,fontWeight:!0,gridArea:!0,gridColumn:!0,gridColumnEnd:!0,gridColumnStart:!0,gridRow:!0,gridRowEnd:!0,gridRowStart:!0,lineHeight:!0,opacity:!0,order:!0,orphans:!0,scale:!0,widows:!0,zIndex:!0,zoom:!0,fillOpacity:!0,floodOpacity:!0,stopOpacity:!0,strokeMiterlimit:!0,strokeOpacity:!0},cssProps:{},style:function(e,t,n,r){if(e&&3!==e.nodeType&&8!==e.nodeType&&e.style){var i,o,a,s=F(t),u=ze.test(t),l=e.style;if(u||(t=Ze(s)),a=ce.cssHooks[t]||ce.cssHooks[s],void 0===n)return a&&"get"in a&&void 0!==(i=a.get(e,!1,r))?i:l[t];"string"===(o=typeof n)&&(i=Y.exec(n))&&i[1]&&(n=te(e,t,i),o="number"),null!=n&&n==n&&("number"!==o||u||(n+=i&&i[3]||(ce.cssNumber[s]?"":"px")),le.clearCloneStyle||""!==n||0!==t.indexOf("background")||(l[t]="inherit"),a&&"set"in a&&void 0===(n=a.set(e,n,r))||(u?l.setProperty(t,n):l[t]=n))}},css:function(e,t,n,r){var i,o,a,s=F(t);return ze.test(t)||(t=Ze(s)),(a=ce.cssHooks[t]||ce.cssHooks[s])&&"get"in a&&(i=a.get(e,!0,n)),void 0===i&&(i=Ge(e,t,r)),"normal"===i&&t in nt&&(i=nt[t]),""===n||n?(o=parseFloat(i),!0===n||isFinite(o)?o||0:i):i}}),ce.each(["height","width"],function(e,u){ce.cssHooks[u]={get:function(e,t,n){if(t)return!et.test(ce.css(e,"display"))||e.getClientRects().length&&e.getBoundingClientRect().width?ot(e,u,n):Ue(e,tt,function(){return ot(e,u,n)})},set:function(e,t,n){var r,i=Xe(e),o=!le.scrollboxSize()&&"absolute"===i.position,a=(o||n)&&"border-box"===ce.css(e,"boxSizing",!1,i),s=n?it(e,u,n,a,i):0;return a&&o&&(s-=Math.ceil(e["offset"+u[0].toUpperCase()+u.slice(1)]-parseFloat(i[u])-it(e,u,"border",!1,i)-.5)),s&&(r=Y.exec(t))&&"px"!==(r[3]||"px")&&(e.style[u]=t,t=ce.css(e,u)),rt(0,t,s)}}}),ce.cssHooks.marginLeft=Ye(le.reliableMarginLeft,function(e,t){if(t)return(parseFloat(Ge(e,"marginLeft"))||e.getBoundingClientRect().left-Ue(e,{marginLeft:0},function(){return e.getBoundingClientRect().left}))+"px"}),ce.each({margin:"",padding:"",border:"Width"},function(i,o){ce.cssHooks[i+o]={expand:function(e){for(var t=0,n={},r="string"==typeof e?e.split(" "):[e];t<4;t++)n[i+Q[t]+o]=r[t]||r[t-2]||r[0];return n}},"margin"!==i&&(ce.cssHooks[i+o].set=rt)}),ce.fn.extend({css:function(e,t){return M(this,function(e,t,n){var r,i,o={},a=0;if(Array.isArray(t)){for(r=Xe(e),i=t.length;a<i;a++)o[t[a]]=ce.css(e,t[a],!1,r);return o}return void 0!==n?ce.style(e,t,n):ce.css(e,t)},e,t,1<arguments.length)}}),((ce.Tween=at).prototype={constructor:at,init:function(e,t,n,r,i,o){this.elem=e,this.prop=n,this.easing=i||ce.easing._default,this.options=t,this.start=this.now=this.cur(),this.end=r,this.unit=o||(ce.cssNumber[n]?"":"px")},cur:function(){var e=at.propHooks[this.prop];return e&&e.get?e.get(this):at.propHooks._default.get(this)},run:function(e){var t,n=at.propHooks[this.prop];return this.options.duration?this.pos=t=ce.easing[this.easing](e,this.options.duration*e,0,1,this.options.duration):this.pos=t=e,this.now=(this.end-this.start)*t+this.start,this.options.step&&this.options.step.call(this.elem,this.now,this),n&&n.set?n.set(this):at.propHooks._default.set(this),this}}).init.prototype=at.prototype,(at.propHooks={_default:{get:function(e){var t;return 1!==e.elem.nodeType||null!=e.elem[e.prop]&&null==e.elem.style[e.prop]?e.elem[e.prop]:(t=ce.css(e.elem,e.prop,""))&&"auto"!==t?t:0},set:function(e){ce.fx.step[e.prop]?ce.fx.step[e.prop](e):1!==e.elem.nodeType||!ce.cssHooks[e.prop]&&null==e.elem.style[Ze(e.prop)]?e.elem[e.prop]=e.now:ce.style(e.elem,e.prop,e.now+e.unit)}}}).scrollTop=at.propHooks.scrollLeft={set:function(e){e.elem.nodeType&&e.elem.parentNode&&(e.elem[e.prop]=e.now)}},ce.easing={linear:function(e){return e},swing:function(e){return.5-Math.cos(e*Math.PI)/2},_default:"swing"},ce.fx=at.prototype.init,ce.fx.step={};var st,ut,lt,ct,ft=/^(?:toggle|show|hide)$/,pt=/queueHooks$/;function dt(){ut&&(!1===C.hidden&&ie.requestAnimationFrame?ie.requestAnimationFrame(dt):ie.setTimeout(dt,ce.fx.interval),ce.fx.tick())}function ht(){return ie.setTimeout(function(){st=void 0}),st=Date.now()}function gt(e,t){var n,r=0,i={height:e};for(t=t?1:0;r<4;r+=2-t)i["margin"+(n=Q[r])]=i["padding"+n]=e;return t&&(i.opacity=i.width=e),i}function vt(e,t,n){for(var r,i=(yt.tweeners[t]||[]).concat(yt.tweeners["*"]),o=0,a=i.length;o<a;o++)if(r=i[o].call(n,t,e))return r}function yt(o,e,t){var n,a,r=0,i=yt.prefilters.length,s=ce.Deferred().always(function(){delete u.elem}),u=function(){if(a)return!1;for(var e=st||ht(),t=Math.max(0,l.startTime+l.duration-e),n=1-(t/l.duration||0),r=0,i=l.tweens.length;r<i;r++)l.tweens[r].run(n);return s.notifyWith(o,[l,n,t]),n<1&&i?t:(i||s.notifyWith(o,[l,1,0]),s.resolveWith(o,[l]),!1)},l=s.promise({elem:o,props:ce.extend({},e),opts:ce.extend(!0,{specialEasing:{},easing:ce.easing._default},t),originalProperties:e,originalOptions:t,startTime:st||ht(),duration:t.duration,tweens:[],createTween:function(e,t){var n=ce.Tween(o,l.opts,e,t,l.opts.specialEasing[e]||l.opts.easing);return l.tweens.push(n),n},stop:function(e){var t=0,n=e?l.tweens.length:0;if(a)return this;for(a=!0;t<n;t++)l.tweens[t].run(1);return e?(s.notifyWith(o,[l,1,0]),s.resolveWith(o,[l,e])):s.rejectWith(o,[l,e]),this}}),c=l.props;for(!function(e,t){var n,r,i,o,a;for(n in e)if(i=t[r=F(n)],o=e[n],Array.isArray(o)&&(i=o[1],o=e[n]=o[0]),n!==r&&(e[r]=o,delete e[n]),(a=ce.cssHooks[r])&&"expand"in a)for(n in o=a.expand(o),delete e[r],o)n in e||(e[n]=o[n],t[n]=i);else t[r]=i}(c,l.opts.specialEasing);r<i;r++)if(n=yt.prefilters[r].call(l,o,c,l.opts))return v(n.stop)&&(ce._queueHooks(l.elem,l.opts.queue).stop=n.stop.bind(n)),n;return ce.map(c,vt,l),v(l.opts.start)&&l.opts.start.call(o,l),l.progress(l.opts.progress).done(l.opts.done,l.opts.complete).fail(l.opts.fail).always(l.opts.always),ce.fx.timer(ce.extend(u,{elem:o,anim:l,queue:l.opts.queue})),l}ce.Animation=ce.extend(yt,{tweeners:{"*":[function(e,t){var n=this.createTween(e,t);return te(n.elem,e,Y.exec(t),n),n}]},tweener:function(e,t){v(e)?(t=e,e=["*"]):e=e.match(D);for(var n,r=0,i=e.length;r<i;r++)n=e[r],yt.tweeners[n]=yt.tweeners[n]||[],yt.tweeners[n].unshift(t)},prefilters:[function(e,t,n){var r,i,o,a,s,u,l,c,f="width"in t||"height"in t,p=this,d={},h=e.style,g=e.nodeType&&ee(e),v=_.get(e,"fxshow");for(r in n.queue||(null==(a=ce._queueHooks(e,"fx")).unqueued&&(a.unqueued=0,s=a.empty.fire,a.empty.fire=function(){a.unqueued||s()}),a.unqueued++,p.always(function(){p.always(function(){a.unqueued--,ce.queue(e,"fx").length||a.empty.fire()})})),t)if(i=t[r],ft.test(i)){if(delete t[r],o=o||"toggle"===i,i===(g?"hide":"show")){if("show"!==i||!v||void 0===v[r])continue;g=!0}d[r]=v&&v[r]||ce.style(e,r)}if((u=!ce.isEmptyObject(t))||!ce.isEmptyObject(d))for(r in f&&1===e.nodeType&&(n.overflow=[h.overflow,h.overflowX,h.overflowY],null==(l=v&&v.display)&&(l=_.get(e,"display")),"none"===(c=ce.css(e,"display"))&&(l?c=l:(re([e],!0),l=e.style.display||l,c=ce.css(e,"display"),re([e]))),("inline"===c||"inline-block"===c&&null!=l)&&"none"===ce.css(e,"float")&&(u||(p.done(function(){h.display=l}),null==l&&(c=h.display,l="none"===c?"":c)),h.display="inline-block")),n.overflow&&(h.overflow="hidden",p.always(function(){h.overflow=n.overflow[0],h.overflowX=n.overflow[1],h.overflowY=n.overflow[2]})),u=!1,d)u||(v?"hidden"in v&&(g=v.hidden):v=_.access(e,"fxshow",{display:l}),o&&(v.hidden=!g),g&&re([e],!0),p.done(function(){for(r in g||re([e]),_.remove(e,"fxshow"),d)ce.style(e,r,d[r])})),u=vt(g?v[r]:0,r,p),r in v||(v[r]=u.start,g&&(u.end=u.start,u.start=0))}],prefilter:function(e,t){t?yt.prefilters.unshift(e):yt.prefilters.push(e)}}),ce.speed=function(e,t,n){var r=e&&"object"==typeof e?ce.extend({},e):{complete:n||!n&&t||v(e)&&e,duration:e,easing:n&&t||t&&!v(t)&&t};return ce.fx.off?r.duration=0:"number"!=typeof r.duration&&(r.duration in ce.fx.speeds?r.duration=ce.fx.speeds[r.duration]:r.duration=ce.fx.speeds._default),null!=r.queue&&!0!==r.queue||(r.queue="fx"),r.old=r.complete,r.complete=function(){v(r.old)&&r.old.call(this),r.queue&&ce.dequeue(this,r.queue)},r},ce.fn.extend({fadeTo:function(e,t,n,r){return this.filter(ee).css("opacity",0).show().end().animate({opacity:t},e,n,r)},animate:function(t,e,n,r){var i=ce.isEmptyObject(t),o=ce.speed(e,n,r),a=function(){var e=yt(this,ce.extend({},t),o);(i||_.get(this,"finish"))&&e.stop(!0)};return a.finish=a,i||!1===o.queue?this.each(a):this.queue(o.queue,a)},stop:function(i,e,o){var a=function(e){var t=e.stop;delete e.stop,t(o)};return"string"!=typeof i&&(o=e,e=i,i=void 0),e&&this.queue(i||"fx",[]),this.each(function(){var e=!0,t=null!=i&&i+"queueHooks",n=ce.timers,r=_.get(this);if(t)r[t]&&r[t].stop&&a(r[t]);else for(t in r)r[t]&&r[t].stop&&pt.test(t)&&a(r[t]);for(t=n.length;t--;)n[t].elem!==this||null!=i&&n[t].queue!==i||(n[t].anim.stop(o),e=!1,n.splice(t,1));!e&&o||ce.dequeue(this,i)})},finish:function(a){return!1!==a&&(a=a||"fx"),this.each(function(){var e,t=_.get(this),n=t[a+"queue"],r=t[a+"queueHooks"],i=ce.timers,o=n?n.length:0;for(t.finish=!0,ce.queue(this,a,[]),r&&r.stop&&r.stop.call(this,!0),e=i.length;e--;)i[e].elem===this&&i[e].queue===a&&(i[e].anim.stop(!0),i.splice(e,1));for(e=0;e<o;e++)n[e]&&n[e].finish&&n[e].finish.call(this);delete t.finish})}}),ce.each(["toggle","show","hide"],function(e,r){var i=ce.fn[r];ce.fn[r]=function(e,t,n){return null==e||"boolean"==typeof e?i.apply(this,arguments):this.animate(gt(r,!0),e,t,n)}}),ce.each({slideDown:gt("show"),slideUp:gt("hide"),slideToggle:gt("toggle"),fadeIn:{opacity:"show"},fadeOut:{opacity:"hide"},fadeToggle:{opacity:"toggle"}},function(e,r){ce.fn[e]=function(e,t,n){return this.animate(r,e,t,n)}}),ce.timers=[],ce.fx.tick=function(){var e,t=0,n=ce.timers;for(st=Date.now();t<n.length;t++)(e=n[t])()||n[t]!==e||n.splice(t--,1);n.length||ce.fx.stop(),st=void 0},ce.fx.timer=function(e){ce.timers.push(e),ce.fx.start()},ce.fx.interval=13,ce.fx.start=function(){ut||(ut=!0,dt())},ce.fx.stop=function(){ut=null},ce.fx.speeds={slow:600,fast:200,_default:400},ce.fn.delay=function(r,e){return r=ce.fx&&ce.fx.speeds[r]||r,e=e||"fx",this.queue(e,function(e,t){var n=ie.setTimeout(e,r);t.stop=function(){ie.clearTimeout(n)}})},lt=C.createElement("input"),ct=C.createElement("select").appendChild(C.createElement("option")),lt.type="checkbox",le.checkOn=""!==lt.value,le.optSelected=ct.selected,(lt=C.createElement("input")).value="t",lt.type="radio",le.radioValue="t"===lt.value;var mt,xt=ce.expr.attrHandle;ce.fn.extend({attr:function(e,t){return M(this,ce.attr,e,t,1<arguments.length)},removeAttr:function(e){return this.each(function(){ce.removeAttr(this,e)})}}),ce.extend({attr:function(e,t,n){var r,i,o=e.nodeType;if(3!==o&&8!==o&&2!==o)return"undefined"==typeof e.getAttribute?ce.prop(e,t,n):(1===o&&ce.isXMLDoc(e)||(i=ce.attrHooks[t.toLowerCase()]||(ce.expr.match.bool.test(t)?mt:void 0)),void 0!==n?null===n?void ce.removeAttr(e,t):i&&"set"in i&&void 0!==(r=i.set(e,n,t))?r:(e.setAttribute(t,n+""),n):i&&"get"in i&&null!==(r=i.get(e,t))?r:null==(r=ce.find.attr(e,t))?void 0:r)},attrHooks:{type:{set:function(e,t){if(!le.radioValue&&"radio"===t&&fe(e,"input")){var n=e.value;return e.setAttribute("type",t),n&&(e.value=n),t}}}},removeAttr:function(e,t){var n,r=0,i=t&&t.match(D);if(i&&1===e.nodeType)while(n=i[r++])e.removeAttribute(n)}}),mt={set:function(e,t,n){return!1===t?ce.removeAttr(e,n):e.setAttribute(n,n),n}},ce.each(ce.expr.match.bool.source.match(/\w+/g),function(e,t){var a=xt[t]||ce.find.attr;xt[t]=function(e,t,n){var r,i,o=t.toLowerCase();return n||(i=xt[o],xt[o]=r,r=null!=a(e,t,n)?o:null,xt[o]=i),r}});var bt=/^(?:input|select|textarea|button)$/i,wt=/^(?:a|area)$/i;function Tt(e){return(e.match(D)||[]).join(" ")}function Ct(e){return e.getAttribute&&e.getAttribute("class")||""}function kt(e){return Array.isArray(e)?e:"string"==typeof e&&e.match(D)||[]}ce.fn.extend({prop:function(e,t){return M(this,ce.prop,e,t,1<arguments.length)},removeProp:function(e){return this.each(function(){delete this[ce.propFix[e]||e]})}}),ce.extend({prop:function(e,t,n){var r,i,o=e.nodeType;if(3!==o&&8!==o&&2!==o)return 1===o&&ce.isXMLDoc(e)||(t=ce.propFix[t]||t,i=ce.propHooks[t]),void 0!==n?i&&"set"in i&&void 0!==(r=i.set(e,n,t))?r:e[t]=n:i&&"get"in i&&null!==(r=i.get(e,t))?r:e[t]},propHooks:{tabIndex:{get:function(e){var t=ce.find.attr(e,"tabindex");return t?parseInt(t,10):bt.test(e.nodeName)||wt.test(e.nodeName)&&e.href?0:-1}}},propFix:{"for":"htmlFor","class":"className"}}),le.optSelected||(ce.propHooks.selected={get:function(e){var t=e.parentNode;return t&&t.parentNode&&t.parentNode.selectedIndex,null},set:function(e){var t=e.parentNode;t&&(t.selectedIndex,t.parentNode&&t.parentNode.selectedIndex)}}),ce.each(["tabIndex","readOnly","maxLength","cellSpacing","cellPadding","rowSpan","colSpan","useMap","frameBorder","contentEditable"],function(){ce.propFix[this.toLowerCase()]=this}),ce.fn.extend({addClass:function(t){var e,n,r,i,o,a;return v(t)?this.each(function(e){ce(this).addClass(t.call(this,e,Ct(this)))}):(e=kt(t)).length?this.each(function(){if(r=Ct(this),n=1===this.nodeType&&" "+Tt(r)+" "){for(o=0;o<e.length;o++)i=e[o],n.indexOf(" "+i+" ")<0&&(n+=i+" ");a=Tt(n),r!==a&&this.setAttribute("class",a)}}):this},removeClass:function(t){var e,n,r,i,o,a;return v(t)?this.each(function(e){ce(this).removeClass(t.call(this,e,Ct(this)))}):arguments.length?(e=kt(t)).length?this.each(function(){if(r=Ct(this),n=1===this.nodeType&&" "+Tt(r)+" "){for(o=0;o<e.length;o++){i=e[o];while(-1<n.indexOf(" "+i+" "))n=n.replace(" "+i+" "," ")}a=Tt(n),r!==a&&this.setAttribute("class",a)}}):this:this.attr("class","")},toggleClass:function(t,n){var e,r,i,o,a=typeof t,s="string"===a||Array.isArray(t);return v(t)?this.each(function(e){ce(this).toggleClass(t.call(this,e,Ct(this),n),n)}):"boolean"==typeof n&&s?n?this.addClass(t):this.removeClass(t):(e=kt(t),this.each(function(){if(s)for(o=ce(this),i=0;i<e.length;i++)r=e[i],o.hasClass(r)?o.removeClass(r):o.addClass(r);else void 0!==t&&"boolean"!==a||((r=Ct(this))&&_.set(this,"__className__",r),this.setAttribute&&this.setAttribute("class",r||!1===t?"":_.get(this,"__className__")||""))}))},hasClass:function(e){var t,n,r=0;t=" "+e+" ";while(n=this[r++])if(1===n.nodeType&&-1<(" "+Tt(Ct(n))+" ").indexOf(t))return!0;return!1}});var St=/\r/g;ce.fn.extend({val:function(n){var r,e,i,t=this[0];return arguments.length?(i=v(n),this.each(function(e){var t;1===this.nodeType&&(null==(t=i?n.call(this,e,ce(this).val()):n)?t="":"number"==typeof t?t+="":Array.isArray(t)&&(t=ce.map(t,function(e){return null==e?"":e+""})),(r=ce.valHooks[this.type]||ce.valHooks[this.nodeName.toLowerCase()])&&"set"in r&&void 0!==r.set(this,t,"value")||(this.value=t))})):t?(r=ce.valHooks[t.type]||ce.valHooks[t.nodeName.toLowerCase()])&&"get"in r&&void 0!==(e=r.get(t,"value"))?e:"string"==typeof(e=t.value)?e.replace(St,""):null==e?"":e:void 0}}),ce.extend({valHooks:{option:{get:function(e){var t=ce.find.attr(e,"value");return null!=t?t:Tt(ce.text(e))}},select:{get:function(e){var t,n,r,i=e.options,o=e.selectedIndex,a="select-one"===e.type,s=a?null:[],u=a?o+1:i.length;for(r=o<0?u:a?o:0;r<u;r++)if(((n=i[r]).selected||r===o)&&!n.disabled&&(!n.parentNode.disabled||!fe(n.parentNode,"optgroup"))){if(t=ce(n).val(),a)return t;s.push(t)}return s},set:function(e,t){var n,r,i=e.options,o=ce.makeArray(t),a=i.length;while(a--)((r=i[a]).selected=-1<ce.inArray(ce.valHooks.option.get(r),o))&&(n=!0);return n||(e.selectedIndex=-1),o}}}}),ce.each(["radio","checkbox"],function(){ce.valHooks[this]={set:function(e,t){if(Array.isArray(t))return e.checked=-1<ce.inArray(ce(e).val(),t)}},le.checkOn||(ce.valHooks[this].get=function(e){return null===e.getAttribute("value")?"on":e.value})});var Et=ie.location,jt={guid:Date.now()},At=/\?/;ce.parseXML=function(e){var t,n;if(!e||"string"!=typeof e)return null;try{t=(new ie.DOMParser).parseFromString(e,"text/xml")}catch(e){}return n=t&&t.getElementsByTagName("parsererror")[0],t&&!n||ce.error("Invalid XML: "+(n?ce.map(n.childNodes,function(e){return e.textContent}).join("\n"):e)),t};var Dt=/^(?:focusinfocus|focusoutblur)$/,Nt=function(e){e.stopPropagation()};ce.extend(ce.event,{trigger:function(e,t,n,r){var i,o,a,s,u,l,c,f,p=[n||C],d=ue.call(e,"type")?e.type:e,h=ue.call(e,"namespace")?e.namespace.split("."):[];if(o=f=a=n=n||C,3!==n.nodeType&&8!==n.nodeType&&!Dt.test(d+ce.event.triggered)&&(-1<d.indexOf(".")&&(d=(h=d.split(".")).shift(),h.sort()),u=d.indexOf(":")<0&&"on"+d,(e=e[ce.expando]?e:new ce.Event(d,"object"==typeof e&&e)).isTrigger=r?2:3,e.namespace=h.join("."),e.rnamespace=e.namespace?new RegExp("(^|\\.)"+h.join("\\.(?:.*\\.|)")+"(\\.|$)"):null,e.result=void 0,e.target||(e.target=n),t=null==t?[e]:ce.makeArray(t,[e]),c=ce.event.special[d]||{},r||!c.trigger||!1!==c.trigger.apply(n,t))){if(!r&&!c.noBubble&&!y(n)){for(s=c.delegateType||d,Dt.test(s+d)||(o=o.parentNode);o;o=o.parentNode)p.push(o),a=o;a===(n.ownerDocument||C)&&p.push(a.defaultView||a.parentWindow||ie)}i=0;while((o=p[i++])&&!e.isPropagationStopped())f=o,e.type=1<i?s:c.bindType||d,(l=(_.get(o,"events")||Object.create(null))[e.type]&&_.get(o,"handle"))&&l.apply(o,t),(l=u&&o[u])&&l.apply&&$(o)&&(e.result=l.apply(o,t),!1===e.result&&e.preventDefault());return e.type=d,r||e.isDefaultPrevented()||c._default&&!1!==c._default.apply(p.pop(),t)||!$(n)||u&&v(n[d])&&!y(n)&&((a=n[u])&&(n[u]=null),ce.event.triggered=d,e.isPropagationStopped()&&f.addEventListener(d,Nt),n[d](),e.isPropagationStopped()&&f.removeEventListener(d,Nt),ce.event.triggered=void 0,a&&(n[u]=a)),e.result}},simulate:function(e,t,n){var r=ce.extend(new ce.Event,n,{type:e,isSimulated:!0});ce.event.trigger(r,null,t)}}),ce.fn.extend({trigger:function(e,t){return this.each(function(){ce.event.trigger(e,t,this)})},triggerHandler:function(e,t){var n=this[0];if(n)return ce.event.trigger(e,t,n,!0)}});var qt=/\[\]$/,Lt=/\r?\n/g,Ht=/^(?:submit|button|image|reset|file)$/i,Ot=/^(?:input|select|textarea|keygen)/i;function Pt(n,e,r,i){var t;if(Array.isArray(e))ce.each(e,function(e,t){r||qt.test(n)?i(n,t):Pt(n+"["+("object"==typeof t&&null!=t?e:"")+"]",t,r,i)});else if(r||"object"!==x(e))i(n,e);else for(t in e)Pt(n+"["+t+"]",e[t],r,i)}ce.param=function(e,t){var n,r=[],i=function(e,t){var n=v(t)?t():t;r[r.length]=encodeURIComponent(e)+"="+encodeURIComponent(null==n?"":n)};if(null==e)return"";if(Array.isArray(e)||e.jquery&&!ce.isPlainObject(e))ce.each(e,function(){i(this.name,this.value)});else for(n in e)Pt(n,e[n],t,i);return r.join("&")},ce.fn.extend({serialize:function(){return ce.param(this.serializeArray())},serializeArray:function(){return this.map(function(){var e=ce.prop(this,"elements");return e?ce.makeArray(e):this}).filter(function(){var e=this.type;return this.name&&!ce(this).is(":disabled")&&Ot.test(this.nodeName)&&!Ht.test(e)&&(this.checked||!we.test(e))}).map(function(e,t){var n=ce(this).val();return null==n?null:Array.isArray(n)?ce.map(n,function(e){return{name:t.name,value:e.replace(Lt,"\r\n")}}):{name:t.name,value:n.replace(Lt,"\r\n")}}).get()}});var Mt=/%20/g,Rt=/#.*$/,It=/([?&])_=[^&]*/,Wt=/^(.*?):[ \t]*([^\r\n]*)$/gm,Ft=/^(?:GET|HEAD)$/,$t=/^\/\//,Bt={},_t={},zt="*/".concat("*"),Xt=C.createElement("a");function Ut(o){return function(e,t){"string"!=typeof e&&(t=e,e="*");var n,r=0,i=e.toLowerCase().match(D)||[];if(v(t))while(n=i[r++])"+"===n[0]?(n=n.slice(1)||"*",(o[n]=o[n]||[]).unshift(t)):(o[n]=o[n]||[]).push(t)}}function Vt(t,i,o,a){var s={},u=t===_t;function l(e){var r;return s[e]=!0,ce.each(t[e]||[],function(e,t){var n=t(i,o,a);return"string"!=typeof n||u||s[n]?u?!(r=n):void 0:(i.dataTypes.unshift(n),l(n),!1)}),r}return l(i.dataTypes[0])||!s["*"]&&l("*")}function Gt(e,t){var n,r,i=ce.ajaxSettings.flatOptions||{};for(n in t)void 0!==t[n]&&((i[n]?e:r||(r={}))[n]=t[n]);return r&&ce.extend(!0,e,r),e}Xt.href=Et.href,ce.extend({active:0,lastModified:{},etag:{},ajaxSettings:{url:Et.href,type:"GET",isLocal:/^(?:about|app|app-storage|.+-extension|file|res|widget):$/.test(Et.protocol),global:!0,processData:!0,async:!0,contentType:"application/x-www-form-urlencoded; charset=UTF-8",accepts:{"*":zt,text:"text/plain",html:"text/html",xml:"application/xml, text/xml",json:"application/json, text/javascript"},contents:{xml:/\bxml\b/,html:/\bhtml/,json:/\bjson\b/},responseFields:{xml:"responseXML",text:"responseText",json:"responseJSON"},converters:{"* text":String,"text html":!0,"text json":JSON.parse,"text xml":ce.parseXML},flatOptions:{url:!0,context:!0}},ajaxSetup:function(e,t){return t?Gt(Gt(e,ce.ajaxSettings),t):Gt(ce.ajaxSettings,e)},ajaxPrefilter:Ut(Bt),ajaxTransport:Ut(_t),ajax:function(e,t){"object"==typeof e&&(t=e,e=void 0),t=t||{};var c,f,p,n,d,r,h,g,i,o,v=ce.ajaxSetup({},t),y=v.context||v,m=v.context&&(y.nodeType||y.jquery)?ce(y):ce.event,x=ce.Deferred(),b=ce.Callbacks("once memory"),w=v.statusCode||{},a={},s={},u="canceled",T={readyState:0,getResponseHeader:function(e){var t;if(h){if(!n){n={};while(t=Wt.exec(p))n[t[1].toLowerCase()+" "]=(n[t[1].toLowerCase()+" "]||[]).concat(t[2])}t=n[e.toLowerCase()+" "]}return null==t?null:t.join(", ")},getAllResponseHeaders:function(){return h?p:null},setRequestHeader:function(e,t){return null==h&&(e=s[e.toLowerCase()]=s[e.toLowerCase()]||e,a[e]=t),this},overrideMimeType:function(e){return null==h&&(v.mimeType=e),this},statusCode:function(e){var t;if(e)if(h)T.always(e[T.status]);else for(t in e)w[t]=[w[t],e[t]];return this},abort:function(e){var t=e||u;return c&&c.abort(t),l(0,t),this}};if(x.promise(T),v.url=((e||v.url||Et.href)+"").replace($t,Et.protocol+"//"),v.type=t.method||t.type||v.method||v.type,v.dataTypes=(v.dataType||"*").toLowerCase().match(D)||[""],null==v.crossDomain){r=C.createElement("a");try{r.href=v.url,r.href=r.href,v.crossDomain=Xt.protocol+"//"+Xt.host!=r.protocol+"//"+r.host}catch(e){v.crossDomain=!0}}if(v.data&&v.processData&&"string"!=typeof v.data&&(v.data=ce.param(v.data,v.traditional)),Vt(Bt,v,t,T),h)return T;for(i in(g=ce.event&&v.global)&&0==ce.active++&&ce.event.trigger("ajaxStart"),v.type=v.type.toUpperCase(),v.hasContent=!Ft.test(v.type),f=v.url.replace(Rt,""),v.hasContent?v.data&&v.processData&&0===(v.contentType||"").indexOf("application/x-www-form-urlencoded")&&(v.data=v.data.replace(Mt,"+")):(o=v.url.slice(f.length),v.data&&(v.processData||"string"==typeof v.data)&&(f+=(At.test(f)?"&":"?")+v.data,delete v.data),!1===v.cache&&(f=f.replace(It,"$1"),o=(At.test(f)?"&":"?")+"_="+jt.guid+++o),v.url=f+o),v.ifModified&&(ce.lastModified[f]&&T.setRequestHeader("If-Modified-Since",ce.lastModified[f]),ce.etag[f]&&T.setRequestHeader("If-None-Match",ce.etag[f])),(v.data&&v.hasContent&&!1!==v.contentType||t.contentType)&&T.setRequestHeader("Content-Type",v.contentType),T.setRequestHeader("Accept",v.dataTypes[0]&&v.accepts[v.dataTypes[0]]?v.accepts[v.dataTypes[0]]+("*"!==v.dataTypes[0]?", "+zt+"; q=0.01":""):v.accepts["*"]),v.headers)T.setRequestHeader(i,v.headers[i]);if(v.beforeSend&&(!1===v.beforeSend.call(y,T,v)||h))return T.abort();if(u="abort",b.add(v.complete),T.done(v.success),T.fail(v.error),c=Vt(_t,v,t,T)){if(T.readyState=1,g&&m.trigger("ajaxSend",[T,v]),h)return T;v.async&&0<v.timeout&&(d=ie.setTimeout(function(){T.abort("timeout")},v.timeout));try{h=!1,c.send(a,l)}catch(e){if(h)throw e;l(-1,e)}}else l(-1,"No Transport");function l(e,t,n,r){var i,o,a,s,u,l=t;h||(h=!0,d&&ie.clearTimeout(d),c=void 0,p=r||"",T.readyState=0<e?4:0,i=200<=e&&e<300||304===e,n&&(s=function(e,t,n){var r,i,o,a,s=e.contents,u=e.dataTypes;while("*"===u[0])u.shift(),void 0===r&&(r=e.mimeType||t.getResponseHeader("Content-Type"));if(r)for(i in s)if(s[i]&&s[i].test(r)){u.unshift(i);break}if(u[0]in n)o=u[0];else{for(i in n){if(!u[0]||e.converters[i+" "+u[0]]){o=i;break}a||(a=i)}o=o||a}if(o)return o!==u[0]&&u.unshift(o),n[o]}(v,T,n)),!i&&-1<ce.inArray("script",v.dataTypes)&&ce.inArray("json",v.dataTypes)<0&&(v.converters["text script"]=function(){}),s=function(e,t,n,r){var i,o,a,s,u,l={},c=e.dataTypes.slice();if(c[1])for(a in e.converters)l[a.toLowerCase()]=e.converters[a];o=c.shift();while(o)if(e.responseFields[o]&&(n[e.responseFields[o]]=t),!u&&r&&e.dataFilter&&(t=e.dataFilter(t,e.dataType)),u=o,o=c.shift())if("*"===o)o=u;else if("*"!==u&&u!==o){if(!(a=l[u+" "+o]||l["* "+o]))for(i in l)if((s=i.split(" "))[1]===o&&(a=l[u+" "+s[0]]||l["* "+s[0]])){!0===a?a=l[i]:!0!==l[i]&&(o=s[0],c.unshift(s[1]));break}if(!0!==a)if(a&&e["throws"])t=a(t);else try{t=a(t)}catch(e){return{state:"parsererror",error:a?e:"No conversion from "+u+" to "+o}}}return{state:"success",data:t}}(v,s,T,i),i?(v.ifModified&&((u=T.getResponseHeader("Last-Modified"))&&(ce.lastModified[f]=u),(u=T.getResponseHeader("etag"))&&(ce.etag[f]=u)),204===e||"HEAD"===v.type?l="nocontent":304===e?l="notmodified":(l=s.state,o=s.data,i=!(a=s.error))):(a=l,!e&&l||(l="error",e<0&&(e=0))),T.status=e,T.statusText=(t||l)+"",i?x.resolveWith(y,[o,l,T]):x.rejectWith(y,[T,l,a]),T.statusCode(w),w=void 0,g&&m.trigger(i?"ajaxSuccess":"ajaxError",[T,v,i?o:a]),b.fireWith(y,[T,l]),g&&(m.trigger("ajaxComplete",[T,v]),--ce.active||ce.event.trigger("ajaxStop")))}return T},getJSON:function(e,t,n){return ce.get(e,t,n,"json")},getScript:function(e,t){return ce.get(e,void 0,t,"script")}}),ce.each(["get","post"],function(e,i){ce[i]=function(e,t,n,r){return v(t)&&(r=r||n,n=t,t=void 0),ce.ajax(ce.extend({url:e,type:i,dataType:r,data:t,success:n},ce.isPlainObject(e)&&e))}}),ce.ajaxPrefilter(function(e){var t;for(t in e.headers)"content-type"===t.toLowerCase()&&(e.contentType=e.headers[t]||"")}),ce._evalUrl=function(e,t,n){return ce.ajax({url:e,type:"GET",dataType:"script",cache:!0,async:!1,global:!1,converters:{"text script":function(){}},dataFilter:function(e){ce.globalEval(e,t,n)}})},ce.fn.extend({wrapAll:function(e){var t;return this[0]&&(v(e)&&(e=e.call(this[0])),t=ce(e,this[0].ownerDocument).eq(0).clone(!0),this[0].parentNode&&t.insertBefore(this[0]),t.map(function(){var e=this;while(e.firstElementChild)e=e.firstElementChild;return e}).append(this)),this},wrapInner:function(n){return v(n)?this.each(function(e){ce(this).wrapInner(n.call(this,e))}):this.each(function(){var e=ce(this),t=e.contents();t.length?t.wrapAll(n):e.append(n)})},wrap:function(t){var n=v(t);return this.each(function(e){ce(this).wrapAll(n?t.call(this,e):t)})},unwrap:function(e){return this.parent(e).not("body").each(function(){ce(this).replaceWith(this.childNodes)}),this}}),ce.expr.pseudos.hidden=function(e){return!ce.expr.pseudos.visible(e)},ce.expr.pseudos.visible=function(e){return!!(e.offsetWidth||e.offsetHeight||e.getClientRects().length)},ce.ajaxSettings.xhr=function(){try{return new ie.XMLHttpRequest}catch(e){}};var Yt={0:200,1223:204},Qt=ce.ajaxSettings.xhr();le.cors=!!Qt&&"withCredentials"in Qt,le.ajax=Qt=!!Qt,ce.ajaxTransport(function(i){var o,a;if(le.cors||Qt&&!i.crossDomain)return{send:function(e,t){var n,r=i.xhr();if(r.open(i.type,i.url,i.async,i.username,i.password),i.xhrFields)for(n in i.xhrFields)r[n]=i.xhrFields[n];for(n in i.mimeType&&r.overrideMimeType&&r.overrideMimeType(i.mimeType),i.crossDomain||e["X-Requested-With"]||(e["X-Requested-With"]="XMLHttpRequest"),e)r.setRequestHeader(n,e[n]);o=function(e){return function(){o&&(o=a=r.onload=r.onerror=r.onabort=r.ontimeout=r.onreadystatechange=null,"abort"===e?r.abort():"error"===e?"number"!=typeof r.status?t(0,"error"):t(r.status,r.statusText):t(Yt[r.status]||r.status,r.statusText,"text"!==(r.responseType||"text")||"string"!=typeof r.responseText?{binary:r.response}:{text:r.responseText},r.getAllResponseHeaders()))}},r.onload=o(),a=r.onerror=r.ontimeout=o("error"),void 0!==r.onabort?r.onabort=a:r.onreadystatechange=function(){4===r.readyState&&ie.setTimeout(function(){o&&a()})},o=o("abort");try{r.send(i.hasContent&&i.data||null)}catch(e){if(o)throw e}},abort:function(){o&&o()}}}),ce.ajaxPrefilter(function(e){e.crossDomain&&(e.contents.script=!1)}),ce.ajaxSetup({accepts:{script:"text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"},contents:{script:/\b(?:java|ecma)script\b/},converters:{"text script":function(e){return ce.globalEval(e),e}}}),ce.ajaxPrefilter("script",function(e){void 0===e.cache&&(e.cache=!1),e.crossDomain&&(e.type="GET")}),ce.ajaxTransport("script",function(n){var r,i;if(n.crossDomain||n.scriptAttrs)return{send:function(e,t){r=ce("<script>").attr(n.scriptAttrs||{}).prop({charset:n.scriptCharset,src:n.url}).on("load error",i=function(e){r.remove(),i=null,e&&t("error"===e.type?404:200,e.type)}),C.head.appendChild(r[0])},abort:function(){i&&i()}}});var Jt,Kt=[],Zt=/(=)\?(?=&|$)|\?\?/;ce.ajaxSetup({jsonp:"callback",jsonpCallback:function(){var e=Kt.pop()||ce.expando+"_"+jt.guid++;return this[e]=!0,e}}),ce.ajaxPrefilter("json jsonp",function(e,t,n){var r,i,o,a=!1!==e.jsonp&&(Zt.test(e.url)?"url":"string"==typeof e.data&&0===(e.contentType||"").indexOf("application/x-www-form-urlencoded")&&Zt.test(e.data)&&"data");if(a||"jsonp"===e.dataTypes[0])return r=e.jsonpCallback=v(e.jsonpCallback)?e.jsonpCallback():e.jsonpCallback,a?e[a]=e[a].replace(Zt,"$1"+r):!1!==e.jsonp&&(e.url+=(At.test(e.url)?"&":"?")+e.jsonp+"="+r),e.converters["script json"]=function(){return o||ce.error(r+" was not called"),o[0]},e.dataTypes[0]="json",i=ie[r],ie[r]=function(){o=arguments},n.always(function(){void 0===i?ce(ie).removeProp(r):ie[r]=i,e[r]&&(e.jsonpCallback=t.jsonpCallback,Kt.push(r)),o&&v(i)&&i(o[0]),o=i=void 0}),"script"}),le.createHTMLDocument=((Jt=C.implementation.createHTMLDocument("").body).innerHTML="<form></form><form></form>",2===Jt.childNodes.length),ce.parseHTML=function(e,t,n){return"string"!=typeof e?[]:("boolean"==typeof t&&(n=t,t=!1),t||(le.createHTMLDocument?((r=(t=C.implementation.createHTMLDocument("")).createElement("base")).href=C.location.href,t.head.appendChild(r)):t=C),o=!n&&[],(i=w.exec(e))?[t.createElement(i[1])]:(i=Ae([e],t,o),o&&o.length&&ce(o).remove(),ce.merge([],i.childNodes)));var r,i,o},ce.fn.load=function(e,t,n){var r,i,o,a=this,s=e.indexOf(" ");return-1<s&&(r=Tt(e.slice(s)),e=e.slice(0,s)),v(t)?(n=t,t=void 0):t&&"object"==typeof t&&(i="POST"),0<a.length&&ce.ajax({url:e,type:i||"GET",dataType:"html",data:t}).done(function(e){o=arguments,a.html(r?ce("<div>").append(ce.parseHTML(e)).find(r):e)}).always(n&&function(e,t){a.each(function(){n.apply(this,o||[e.responseText,t,e])})}),this},ce.expr.pseudos.animated=function(t){return ce.grep(ce.timers,function(e){return t===e.elem}).length},ce.offset={setOffset:function(e,t,n){var r,i,o,a,s,u,l=ce.css(e,"position"),c=ce(e),f={};"static"===l&&(e.style.position="relative"),s=c.offset(),o=ce.css(e,"top"),u=ce.css(e,"left"),("absolute"===l||"fixed"===l)&&-1<(o+u).indexOf("auto")?(a=(r=c.position()).top,i=r.left):(a=parseFloat(o)||0,i=parseFloat(u)||0),v(t)&&(t=t.call(e,n,ce.extend({},s))),null!=t.top&&(f.top=t.top-s.top+a),null!=t.left&&(f.left=t.left-s.left+i),"using"in t?t.using.call(e,f):c.css(f)}},ce.fn.extend({offset:function(t){if(arguments.length)return void 0===t?this:this.each(function(e){ce.offset.setOffset(this,t,e)});var e,n,r=this[0];return r?r.getClientRects().length?(e=r.getBoundingClientRect(),n=r.ownerDocument.defaultView,{top:e.top+n.pageYOffset,left:e.left+n.pageXOffset}):{top:0,left:0}:void 0},position:function(){if(this[0]){var e,t,n,r=this[0],i={top:0,left:0};if("fixed"===ce.css(r,"position"))t=r.getBoundingClientRect();else{t=this.offset(),n=r.ownerDocument,e=r.offsetParent||n.documentElement;while(e&&(e===n.body||e===n.documentElement)&&"static"===ce.css(e,"position"))e=e.parentNode;e&&e!==r&&1===e.nodeType&&((i=ce(e).offset()).top+=ce.css(e,"borderTopWidth",!0),i.left+=ce.css(e,"borderLeftWidth",!0))}return{top:t.top-i.top-ce.css(r,"marginTop",!0),left:t.left-i.left-ce.css(r,"marginLeft",!0)}}},offsetParent:function(){return this.map(function(){var e=this.offsetParent;while(e&&"static"===ce.css(e,"position"))e=e.offsetParent;return e||J})}}),ce.each({scrollLeft:"pageXOffset",scrollTop:"pageYOffset"},function(t,i){var o="pageYOffset"===i;ce.fn[t]=function(e){return M(this,function(e,t,n){var r;if(y(e)?r=e:9===e.nodeType&&(r=e.defaultView),void 0===n)return r?r[i]:e[t];r?r.scrollTo(o?r.pageXOffset:n,o?n:r.pageYOffset):e[t]=n},t,e,arguments.length)}}),ce.each(["top","left"],function(e,n){ce.cssHooks[n]=Ye(le.pixelPosition,function(e,t){if(t)return t=Ge(e,n),_e.test(t)?ce(e).position()[n]+"px":t})}),ce.each({Height:"height",Width:"width"},function(a,s){ce.each({padding:"inner"+a,content:s,"":"outer"+a},function(r,o){ce.fn[o]=function(e,t){var n=arguments.length&&(r||"boolean"!=typeof e),i=r||(!0===e||!0===t?"margin":"border");return M(this,function(e,t,n){var r;return y(e)?0===o.indexOf("outer")?e["inner"+a]:e.document.documentElement["client"+a]:9===e.nodeType?(r=e.documentElement,Math.max(e.body["scroll"+a],r["scroll"+a],e.body["offset"+a],r["offset"+a],r["client"+a])):void 0===n?ce.css(e,t,i):ce.style(e,t,n,i)},s,n?e:void 0,n)}})}),ce.each(["ajaxStart","ajaxStop","ajaxComplete","ajaxError","ajaxSuccess","ajaxSend"],function(e,t){ce.fn[t]=function(e){return this.on(t,e)}}),ce.fn.extend({bind:function(e,t,n){return this.on(e,null,t,n)},unbind:function(e,t){return this.off(e,null,t)},delegate:function(e,t,n,r){return this.on(t,e,n,r)},undelegate:function(e,t,n){return 1===arguments.length?this.off(e,"**"):this.off(t,e||"**",n)},hover:function(e,t){return this.on("mouseenter",e).on("mouseleave",t||e)}}),ce.each("blur focus focusin focusout resize scroll click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup contextmenu".split(" "),function(e,n){ce.fn[n]=function(e,t){return 0<arguments.length?this.on(n,null,e,t):this.trigger(n)}});var en=/^[\s\uFEFF\xA0]+|([^\s\uFEFF\xA0])[\s\uFEFF\xA0]+$/g;ce.proxy=function(e,t){var n,r,i;if("string"==typeof t&&(n=e[t],t=e,e=n),v(e))return r=ae.call(arguments,2),(i=function(){return e.apply(t||this,r.concat(ae.call(arguments)))}).guid=e.guid=e.guid||ce.guid++,i},ce.holdReady=function(e){e?ce.readyWait++:ce.ready(!0)},ce.isArray=Array.isArray,ce.parseJSON=JSON.parse,ce.nodeName=fe,ce.isFunction=v,ce.isWindow=y,ce.camelCase=F,ce.type=x,ce.now=Date.now,ce.isNumeric=function(e){var t=ce.type(e);return("number"===t||"string"===t)&&!isNaN(e-parseFloat(e))},ce.trim=function(e){return null==e?"":(e+"").replace(en,"$1")},"function"==typeof define&&define.amd&&define("jquery",[],function(){return ce});var tn=ie.jQuery,nn=ie.$;return ce.noConflict=function(e){return ie.$===ce&&(ie.$=nn),e&&ie.jQuery===ce&&(ie.jQuery=tn),ce},"undefined"==typeof e&&(ie.jQuery=ie.$=ce),ce});
/* TC_VENDORED_JQUERY_END */
} catch (_) {}

/* THINKER_EVAL_BAR_V2_GENERATED_START */
var ThinkerEvalBarV2Bundle=(()=>{var q=Object.defineProperty;var U=Object.getOwnPropertyDescriptor;var W=Object.getOwnPropertyNames;var K=Object.prototype.hasOwnProperty;var Q=(n,e)=>{for(var t in e)q(n,t,{get:e[t],enumerable:!0})},Y=(n,e,t,i)=>{if(e&&typeof e=="object"||typeof e=="function")for(let r of W(e))!K.call(n,r)&&r!==t&&q(n,r,{get:()=>e[r],enumerable:!(i=U(e,r))||i.enumerable});return n};var X=n=>Y(q({},"__esModule",{value:!0}),n);var Fe={};Q(Fe,{BoundedLruCache:()=>w,EVAL_BAR_MATERIAL_CHANGE_CP:()=>z,EVAL_BAR_NEUTRAL_BAND_CP:()=>M,EVAL_BAR_PRESENTATION_INTERVAL_MS:()=>P,EvalBarPresentationSelector:()=>T,UserscriptEvalBar:()=>A,createUserscriptEvalBar:()=>Ae,findChessComBoard:()=>V,isValidChessFen:()=>G,projectEvalBarPresentation:()=>S,readChessComFen:()=>ge,resolveChessComEvalAuthorization:()=>fe,resolveChessComEvalPresentation:()=>ve});var Me=Object.freeze({version:"thinker-fair-play-v1",authorizedContexts:["post-game","offline-analysis"],prohibitedContexts:["live-game","active-game-assistance"],statement:"Analysis output is authorized only after a game or in an offline analysis workspace."}),f=Object.freeze({evaluation:"lichess-winning-chances-0.00368208-v1",classification:"chesscom-published-ep-bands-thinker-heuristics-v1",accuracy:"lichess-accuracy-percent-power-mean-v1",evalBar:"thinker-latest-wins-tau-110-v1"}),xe=Object.freeze({evaluation:"Lichess lila winningChances.ts and scalachess WinPercent",classification:"Chess.com Classification V2 published Expected Points bands with Thinker-owned special heuristics",accuracy:"Lichess AccuracyPercent.scala volatility-weighted mean and harmonic power mean"});var L=1e3,Z=-.00368208,O=(n,e,t)=>Math.max(e,Math.min(t,n)),b=(n,e)=>{if(!Number.isFinite(n))throw new TypeError(`${e} must be finite`)};function I(n){let e=n.cp!==void 0&&n.cp!==null,t=n.mate!==void 0&&n.mate!==null;if(e===t)throw new TypeError("exactly one of cp or mate is required");if(t){if(b(n.mate,"mate"),!Number.isSafeInteger(n.mate))throw new RangeError("mate must be an integer");if(n.mate===0)throw new RangeError("mate must not be zero");return Object.freeze({kind:"mate",mate:n.mate})}return b(n.cp,"cp"),Object.freeze({kind:"cp",cp:n.cp})}function J(n){let e;if(n.kind==="mate"){if(b(n.mate,"mate"),n.mate===0)throw new RangeError("mate must not be zero");e=Math.sign(n.mate)*(21-Math.min(10,Math.abs(n.mate)))*100}else b(n.cp,"cp"),e=O(n.cp,-L,L);return O(2/(1+Math.exp(Z*e))-1,-1,1)}function D(n){let e=J(n),t=50+50*e,i=t/100;return Object.freeze({modelVersion:f.evaluation,score:n,whiteWinningChances:e,whiteWinPercent:t,whiteExpectedPoints:i,whiteVisualFraction:i})}var ee=110,te=.12,ne={now:()=>performance.now(),requestFrame:n=>requestAnimationFrame(n),cancelFrame:n=>cancelAnimationFrame(n)},g=n=>{if(!Number.isFinite(n))throw new TypeError("eval bar fraction must be finite");return Math.max(0,Math.min(1,n))},E=class{modelVersion=f.evalBar;elements;scheduler;reducedMotion;onFrameCommitted;activeSearchId=0;mailbox=null;frameHandle=null;lastTimestamp=null;current=.5;target=.5;pendingPresentation=null;constructor(e,t={}){this.elements=e,this.scheduler=t.scheduler??ne,this.reducedMotion=t.reducedMotion??globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches??!1,this.onFrameCommitted=t.onFrameCommitted,this.current=g(t.initialFraction??.5),this.target=this.current,this.commitTransform()}beginSearch(e,t=null){if(!Number.isSafeInteger(e)||e<0)throw new RangeError("searchId must be a non-negative safe integer");this.cancelScheduledFrame(),this.activeSearchId=e,this.mailbox=null,this.pendingPresentation=null,this.target=this.current,this.lastTimestamp=null,t&&this.publish(t)}publish(e){return e.searchId!==this.activeSearchId?!1:(g(e.fraction),this.mailbox=e,this.frameHandle===null&&(this.lastTimestamp=this.scheduler.now(),this.frameHandle=this.scheduler.requestFrame(t=>this.animate(t))),!0)}setOrientation(e){this.elements.root.dataset.orientation=e}reset(e=.5,t="\u2014"){this.cancelScheduledFrame(),this.mailbox=null,this.pendingPresentation=null,this.lastTimestamp=null,this.current=g(e),this.target=this.current,this.elements.label.textContent=t,this.elements.root.dataset.favoredColor="white",this.commitTransform()}destroy(){this.cancelScheduledFrame(),this.mailbox=null,this.pendingPresentation=null}snapshot(){return Object.freeze({activeSearchId:this.activeSearchId,current:this.current,target:this.target,hasPendingSample:this.mailbox!==null,hasScheduledFrame:this.frameHandle!==null})}animate(e){this.frameHandle=null;let t=this.mailbox;this.mailbox=null,t&&(this.target=g(t.fraction),this.canCommitPresentation(t.favoredColor)?this.commitPresentation(t):this.pendingPresentation=t);let i=this.lastTimestamp??e,r=Math.max(0,e-i);if(this.lastTimestamp=e,this.reducedMotion)this.current=this.target;else{let s=1-Math.exp(-r/ee);this.current+=(this.target-this.current)*s}if(this.pendingPresentation&&this.canCommitPresentation(this.pendingPresentation.favoredColor)&&this.commitPresentation(this.pendingPresentation),Math.abs(this.target-this.current)<=1e-4&&this.mailbox===null){this.current=this.target,this.commitTransform(),this.onFrameCommitted?.(this.snapshot()),this.lastTimestamp=null;return}this.commitTransform(),this.onFrameCommitted?.(this.snapshot()),this.frameHandle=this.scheduler.requestFrame(s=>this.animate(s))}commitTransform(){this.elements.fill.style.transform=`scaleY(${this.current})`}canCommitPresentation(e){let t=this.elements.root.dataset.favoredColor;return!t||t===e?!0:(e==="white"?this.current:1-this.current)>=te}commitPresentation(e){this.elements.label.textContent=e.label,this.elements.root.dataset.favoredColor=e.favoredColor,this.pendingPresentation=null}cancelScheduledFrame(){this.frameHandle!==null&&this.scheduler.cancelFrame(this.frameHandle),this.frameHandle=null}};var ie="thinker-eval-v2-rail",R="thinker-eval-v2-style",se=64,re=500,ae=5e3,oe=1500,le=4,P=250,z=100,M=20,C="thinker-eval-bar-route-change",y=new WeakMap,ue=/^\/analysis(?:\/|$)/,he=/^\/game\/(?:live\/|daily\/)?[^/]+\/review(?:\/|$)/,ce=/^\/(?:analysis|game|play|puzzles?|practice|lessons?)(?:\/|$)/,de=/(game review|an[aá]lise da partida|revis[aã]o da partida)/i,me=['[data-cy="game-over-modal"]','[data-test-element="game-over-modal"]','[data-cy="game-over-dialog"]',".game-over-modal",'[class*="game-over-modal"]','[class*="modal-game-over"]'].join(",");function pe(n){let e=n.split("/").filter(Boolean);return e[0]==="play"?e.length>=2:e[0]!=="game"?!1:e.length===2?!["live","daily"].includes(e[1]):e.length===3&&["live","daily"].includes(e[1])&&!!e[2]}function ve(n){return ce.test(String(n.pathname||"").toLowerCase())}function x(n){if(!n.isConnected||n.getAttribute("aria-hidden")==="true")return!1;let e=n.ownerDocument?.defaultView?.getComputedStyle?.(n);if(e&&(e.display==="none"||e.visibility==="hidden"||e.opacity==="0"))return!1;let t=n.getBoundingClientRect?.();if(!t||t.width<=0||t.height<=0)return!1;let i=n.ownerDocument?.defaultView;return!i||![t.top,t.right,t.bottom,t.left].every(Number.isFinite)?!0:t.bottom>0&&t.right>0&&t.top<i.innerHeight&&t.left<i.innerWidth}function fe(n,e){let t=String(n.pathname||"").toLowerCase();if(ue.test(t)||he.test(t))return"analysis";if(!pe(t))return null;let i=V(e),r=i,s=[r?.game,r?.gameManager?.game];if(!!!(i&&(i.getAttribute("data-game-over")==="true"||i.getAttribute("game-over")==="true"||s.some(l=>{if(!l||typeof l!="object")return!1;let h=l;try{if(typeof h.isGameOver=="function"&&h.isGameOver())return!0}catch{}return/(?:finished|complete|checkmate|resigned|timeout|draw|aborted)/i.test(String(h.status||""))}))))return null;if(Array.from(e.querySelectorAll(me)).some(x))return"post-game";let o=e.querySelectorAll('[data-cy*="review"], [data-test-element*="review"], [class*="game-review"], [class*="post-game"]');return Array.from(o).some(l=>x(l)&&de.test(l.textContent||""))?"post-game":null}var be=["wc-chess-board","chess-board","wc-board",'[data-cy="board"]','[data-test-element="board"]',"[data-board]",".chess-board",".board",'[class*="board-component"]'].join(",");function V(n){let e=Array.from(n.querySelectorAll(be)),t=null,i=-1/0;for(let r of e){if(!r?.isConnected)continue;let s=r.getBoundingClientRect?.();if(!s)continue;let a=Math.max(0,s.width)*Math.max(0,s.height),o=s.height>0?s.width/s.height:0,l=x(r)&&s.width>=200&&s.height>=200,h=o>=.8&&o<=1.25;if(!l||!h)continue;let c=(/^(WC-CHESS-BOARD|CHESS-BOARD|WC-BOARD)$/.test(r.tagName||"")?1e6:0)+Math.min(a,999999);c>i&&(t=r,i=c)}return t}function N(n){if(typeof n!="string")return null;let e=n.trim();return G(e)?e:null}function G(n){if(typeof n!="string")return!1;let e=n.trim().split(/\s+/);if(e.length!==6)return!1;let[t,i,r,s,a,o]=e,l=t.split("/");if(l.length!==8)return!1;let h=0,u=0,c=0,k=0,m=-1,p=-1;for(let[F,$]of l.entries()){let v=0;for(let d of $)if(/^[1-8]$/.test(d))v+=Number(d);else if(/^[prnbqkPRNBQK]$/.test(d)){if((F===0||F===7)&&/[pP]/.test(d))return!1;let _=F*8+v;v+=1,/[A-Z]/.test(d)?c+=1:k+=1,d==="K"&&(h+=1,m=_),d==="k"&&(u+=1,p=_)}else return!1;if(v!==8)return!1}let j=m>=0&&p>=0&&Math.abs(Math.floor(m/8)-Math.floor(p/8))<=1&&Math.abs(m%8-p%8)<=1;return h===1&&u===1&&c<=16&&k<=16&&!j&&/^[wb]$/.test(i)&&(r==="-"||/^(?:K?Q?k?q?)$/.test(r))&&(s==="-"||/^[a-h][36]$/.test(s))&&/^\d+$/.test(a)&&/^[1-9]\d*$/.test(o)}function ge(n){if(!n)return null;let e=[],t=n,i=s=>{if(!s||typeof s!="object")return;let a=s.getFEN;if(typeof a=="function")try{e.push(a.call(s))}catch{}e.push(s.fen)};i(t.game),i(t.gameManager?.game),e.push(t.fen,t.position);for(let s of["fen","data-fen","data-position"])e.push(n.getAttribute(s));let r=n.querySelector?.("[data-fen], [fen]");r&&e.push(r.getAttribute("data-fen"),r.getAttribute("fen"));for(let s of e){let a=N(s);if(a)return a;if(s&&typeof s=="object"){let o=N(s.fen);if(o)return o}}return null}var w=class{constructor(e){this.capacity=e;if(!Number.isSafeInteger(e)||e<1)throw new RangeError("cache capacity must be a positive safe integer")}capacity;values=new Map;get(e){let t=this.values.get(e);if(t!==void 0)return this.values.delete(e),this.values.set(e,t),t}set(e,t){for(this.values.delete(e),this.values.set(e,t);this.values.size>this.capacity;)this.values.delete(this.values.keys().next().value)}get size(){return this.values.size}};function H(n){let e=I({cp:n.cp,mate:n.mate});return Object.freeze({score:e,fraction:D(e).whiteVisualFraction})}function Ee(n){return n.kind==="cp"?n.cp:n.mate}function B(n,e="white"){let t=Ee(n);return t>0?"white":t<0?"black":e}function Re(n){return n.kind==="mate"?`#${Math.abs(n.mate)}`:(Math.abs(n.cp)/100).toFixed(1)}function S(n,e=null,t="white"){return Object.freeze({score:n.score,fraction:n.fraction,label:Re(n.score),favoredColor:B(n.score,t),depth:e!==null&&Number.isFinite(e)?e:null})}function ye(n,e){return n.kind==="mate"||e.kind==="mate"}function Se(n,e){return n.kind!=="cp"||e.kind!=="cp"?!0:Math.abs(e.cp-n.cp)>=z}function Ce(n,e){return n.kind!=="cp"||e.kind!=="cp"?B(n)!==B(e):Math.sign(n.cp)!==Math.sign(e.cp)&&Math.abs(n.cp)>M&&Math.abs(e.cp)>M}var T=class{selected=null;pending=null;highestDepth=-1/0;lastSelectedAt=-1/0;coalescedCount=0;selectedCount=0;reset(){this.selected=null,this.pending=null,this.highestDepth=-1/0,this.lastSelectedAt=-1/0,this.coalescedCount=0,this.selectedCount=0}beginRefresh(){this.pending=null}consider(e,t,i=!1){let r=e.depth;return!i&&r!==null&&r<this.highestDepth?Object.freeze({selected:null,rejectedDepth:!0,coalesced:!1}):(r!==null&&(this.highestDepth=Math.max(this.highestDepth,r)),i||!this.selected||ye(this.selected.score,e.score)||Se(this.selected.score,e.score)||Ce(this.selected.score,e.score)||t-this.lastSelectedAt>=P?Object.freeze({selected:this.commit(e,t),rejectedDepth:!1,coalesced:!1}):(this.pending=e,this.coalescedCount+=1,Object.freeze({selected:null,rejectedDepth:!1,coalesced:!0})))}flush(e){return this.pending?this.commit(this.pending,e):null}snapshot(){return Object.freeze({selected:this.selected,pending:this.pending,highestDepth:Number.isFinite(this.highestDepth)?this.highestDepth:null,lastSelectedAt:Number.isFinite(this.lastSelectedAt)?this.lastSelectedAt:null,coalescedCount:this.coalescedCount,selectedCount:this.selectedCount})}commit(e,t){return this.selected=e,this.pending=null,this.lastSelectedAt=t,this.selectedCount+=1,e}};function we(){return`.thinker-eval-v2-rail {
  --thinker-eval-v2-width: 20px;
  --thinker-eval-v2-gap: 10px;
  --thinker-eval-v2-dark: rgb(64, 61, 57);
  --thinker-eval-v2-light: rgb(255, 255, 255);
  --thinker-eval-v2-draw: rgb(119, 117, 116);
  --thinker-eval-v2-radius: 2px;
  --thinker-eval-v2-label-padding: 5px;
  box-sizing: border-box;
  border: 0;
  border-radius: var(--thinker-eval-v2-radius);
  position: relative;
  background: var(--thinker-eval-v2-dark);
  overflow: hidden;
  min-height: 200px;
  box-shadow: none;
  contain: layout paint;
  isolation: isolate;
  width: var(--thinker-eval-v2-width);
  align-self: stretch;
  flex: 0 0 var(--thinker-eval-v2-width);
  margin-right: var(--thinker-eval-v2-gap);
}

@media (min-width: 960px) {
  .thinker-eval-v2-rail {
    --thinker-eval-v2-width: 30px;
  }
}

.thinker-eval-v2-overlay {
  position: fixed;
  min-height: 0;
  margin: 0;
  flex: none;
  pointer-events: none;
  z-index: 30;
}

.thinker-eval-v2-fill {
  position: absolute;
  inset: 0;
  background: var(--thinker-eval-v2-light);
  transform: scaleY(.5);
  transform-origin: center bottom;
  will-change: transform;
  backface-visibility: hidden;
}

.thinker-eval-v2-rail[data-orientation="black"] .thinker-eval-v2-fill {
  transform-origin: center top;
}

.thinker-eval-v2-score {
  box-sizing: border-box;
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 2;
  padding: var(--thinker-eval-v2-label-padding) 0;
  color: var(--thinker-eval-v2-dark);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
  font-size: 10px;
  font-weight: 600;
  line-height: 14.3px;
  text-align: center;
  white-space: nowrap;
  mix-blend-mode: normal;
}

.thinker-eval-v2-rail[data-favored-color="white"] .thinker-eval-v2-score {
  color: var(--thinker-eval-v2-dark);
}

.thinker-eval-v2-rail[data-favored-color="black"] .thinker-eval-v2-score {
  color: var(--thinker-eval-v2-light);
}

.thinker-eval-v2-rail[data-state="error"] {
  box-shadow: inset 0 0 0 2px #b94a48;
}

.thinker-eval-v2-rail[data-orientation="white"][data-favored-color="black"] .thinker-eval-v2-score,
.thinker-eval-v2-rail[data-orientation="black"][data-favored-color="white"] .thinker-eval-v2-score {
  top: 0;
  bottom: auto;
}

.thinker-eval-v2-rail[data-orientation="white"][data-favored-color="white"] .thinker-eval-v2-score,
.thinker-eval-v2-rail[data-orientation="black"][data-favored-color="black"] .thinker-eval-v2-score {
  top: auto;
  bottom: 0;
}
`}function Te(n){let e=y.get(n);if(!e){let i=n.history,r=i.pushState,s=i.replaceState;i.pushState=function(...a){Reflect.apply(r,i,a),n.dispatchEvent(new Event(C))},i.replaceState=function(...a){Reflect.apply(s,i,a),n.dispatchEvent(new Event(C))},e={references:0,pushState:r,replaceState:s},y.set(n,e)}e.references+=1;let t=!1;return()=>{if(t)return;t=!0;let i=y.get(n);i&&(i.references-=1,!(i.references>0)&&(n.history.pushState=i.pushState,n.history.replaceState=i.replaceState,y.delete(n)))}}var A=class{constructor(e){this.options=e;this.cache=new w(e.cacheCapacity??se),this.now=e.now??(()=>Date.now())}options;cache;now;presentationSelector=new T;started=!1;enabled=!1;generation=0;requestSequence=0;activeRequestId=0;activeSequence=-1;currentFen="";currentCacheContext="";lastRequestAt=-1/0;requestStartedAt=null;lastRequestDurationMs=null;abortCount=0;lastAbortReason=null;request=null;controller=null;root=null;label=null;board=null;resizeObserver=null;observer=null;interval=null;reconcileQueued=!1;removeHistoryHook=null;connectionState="idle";lastEvaluation=null;lastError=null;geometry=null;boardGeometry=null;hasRenderedEvaluation=!1;renderedFen="";visualStale=!1;lastFenDetectedAt=null;lastRequestDispatchedAt=null;lastFirstEvaluationAt=null;lastDetectionToRequestMs=null;lastRequestToFirstEvaluationMs=null;firstEvaluationGeneration=-1;staleResultCount=0;mountCount=0;boardRetargetCount=0;pendingRenderedFen="";pendingRenderedGeneration=-1;lastEvaluationAcceptedAt=null;lastFirstRenderedFrameAt=null;lastEvaluationToFirstFrameMs=null;boardMissingTimer=null;routeReconcileTimer=null;routeReconcileFramesRemaining=0;presentationTimer=null;routeListener=()=>{this.queueReconcile(),this.scheduleRouteReconcileBurst()};geometryListener=()=>this.syncGeometry();start(e=!0){if(this.enabled=e,this.started){this.reconcile();return}this.started=!0,this.installStyle(),this.installObserver(),this.options.window.addEventListener("popstate",this.routeListener),this.options.window.addEventListener("hashchange",this.routeListener),this.options.window.addEventListener(C,this.routeListener),this.removeHistoryHook=Te(this.options.window),this.reconcile()}setEnabled(e){this.enabled!==e&&(this.enabled=e,this.reconcile())}reconcile(){if(this.reconcileQueued=!1,!this.enabled||!this.shouldDisplay()){this.deactivate();return}let e=this.options.getBoard();if(!e?.isConnected||!e.parentElement){this.handleBoardUnavailable();return}this.clearBoardMissingTimer(),this.ensureBoard(e),this.ensurePolling(),this.pollNow()}pollNow(){if(!this.enabled||!this.shouldDisplay()){this.deactivate();return}let e=this.options.getBoard();if(!e?.isConnected||!e.parentElement){this.handleBoardUnavailable();return}if(this.clearBoardMissingTimer(),this.ensureBoard(e),this.syncGeometry(),!this.options.authorize()){this.clearPosition("blocked","\u2014");return}let t=this.options.getFen();if(!t){this.clearPosition("waiting","\u2026");return}let i=this.readCacheContext();if(!i){this.abortRequest("cache-context-unavailable"),this.reportError(new Error("Evaluation cache context is unavailable"));return}let r=this.options.getOrientation();if(this.controller?.setOrientation(r),t!==this.currentFen||i!==this.currentCacheContext){let h=this.now();this.generation+=1,this.abortRequest("position-changed"),this.currentFen=t,this.currentCacheContext=i,this.lastRequestAt=-1/0,this.activeSequence=-1,this.lastFenDetectedAt=h,this.firstEvaluationGeneration=-1,this.pendingRenderedFen="",this.pendingRenderedGeneration=-1,this.resetPresentation();let u=this.cache.get(this.cacheKey(t,i)),c=u?this.presentationSelector.consider(S(u),h,!0).selected:null;this.visualStale=this.hasRenderedEvaluation,this.setVisualState(u?"connected":this.visualStale?"stale":"waiting",u||this.hasRenderedEvaluation?void 0:"\u2026"),this.controller?.beginSearch(this.generation,c?this.sample(c):null),u&&this.markEvaluationAccepted(t,!0)}if(this.request||this.now()-this.lastRequestAt<(this.options.refreshIntervalMs??ae))return;this.root?.dataset.state!=="fresh"&&this.setVisualState(this.hasRenderedEvaluation?"stale":"loading",this.hasRenderedEvaluation?void 0:"\u2026");let a=this.generation;this.clearPresentationTimer(),this.presentationSelector.beginRefresh();let o=++this.requestSequence;this.activeRequestId=o,this.activeSequence=-1,this.requestStartedAt=this.now(),this.lastRequestDispatchedAt=this.requestStartedAt,this.lastDetectionToRequestMs=this.lastFenDetectedAt===null?null:Math.max(0,this.requestStartedAt-this.lastFenDetectedAt);let l=!1;try{let h=this.options.requestEvaluation({fen:t,generation:a,requestId:o,cacheContext:i,onProgress:u=>{l||this.acceptProgress(t,a,o,i,u)},onResult:u=>{l||(l=!0,this.acceptResult(t,a,o,i,u))},onError:u=>{l||(l=!0,o===this.activeRequestId&&a===this.generation&&(this.request=null,this.finishRequestTiming(),this.lastRequestAt=this.now(),this.clearPresentationTimer(),this.reportError(u)))}})??null;!l&&o===this.activeRequestId&&(this.request=h,h||(this.finishRequestTiming(),this.lastRequestAt=this.now(),this.reportError(new Error("Evaluation transport is unavailable"))))}catch(h){o===this.activeRequestId&&(this.request=null,this.finishRequestTiming(),this.lastRequestAt=this.now(),this.reportError(h))}}destroy(){this.started&&(this.started=!1,this.enabled=!1,this.deactivate(),this.observer?.disconnect(),this.observer=null,this.options.window.removeEventListener("popstate",this.routeListener),this.options.window.removeEventListener("hashchange",this.routeListener),this.options.window.removeEventListener(C,this.routeListener),this.removeHistoryHook?.(),this.removeHistoryHook=null)}snapshot(){return Object.freeze({enabled:this.enabled,generation:this.generation,currentFen:this.currentFen,cacheSize:this.cache.size,mounted:!!this.root?.isConnected,polling:this.interval!==null,requestActive:this.request!==null,activeRequestId:this.activeRequestId,cacheContext:this.currentCacheContext,route:this.safeRead(()=>this.options.getRoute?.()??"",""),authorization:this.safeRead(()=>this.options.authorize(),null),boardFound:this.safeRead(()=>!!this.options.getBoard(),!1),fenAvailable:this.safeRead(()=>!!this.options.getFen(),!1),state:this.connectionState,geometry:this.geometry,lastEvaluation:this.lastEvaluation,lastError:this.lastError,activeSequence:this.activeSequence,requestStartedAt:this.requestStartedAt,requestElapsedMs:this.requestStartedAt===null?null:Math.max(0,this.now()-this.requestStartedAt),lastRequestDurationMs:this.lastRequestDurationMs,abortCount:this.abortCount,lastAbortReason:this.lastAbortReason,renderedFen:this.renderedFen,visualStale:this.visualStale,visualFraction:this.controller?.snapshot().current??null,targetFraction:this.controller?.snapshot().target??null,lastFenDetectedAt:this.lastFenDetectedAt,lastRequestDispatchedAt:this.lastRequestDispatchedAt,lastFirstEvaluationAt:this.lastFirstEvaluationAt,lastDetectionToRequestMs:this.lastDetectionToRequestMs,lastRequestToFirstEvaluationMs:this.lastRequestToFirstEvaluationMs,staleResultCount:this.staleResultCount,mountCount:this.mountCount,boardRetargetCount:this.boardRetargetCount,lastFirstRenderedFrameAt:this.lastFirstRenderedFrameAt,lastEvaluationToFirstFrameMs:this.lastEvaluationToFirstFrameMs,presentation:this.presentationSelector.snapshot()})}acceptResult(e,t,i,r,s){if(!this.acceptsRequest(e,t,i,r)){t===this.generation&&i===this.activeRequestId&&(this.request=null,this.finishRequestTiming(),this.lastRequestAt=this.now());return}let a=Number(s.sequence);if(this.activeSequence>=0&&!Number.isFinite(a)){this.request=null,this.finishRequestTiming(),this.lastRequestAt=this.now(),this.reportError(new Error("Evaluation terminal sequence is unavailable"));return}if(Number.isFinite(a)&&a<=this.activeSequence){this.request=null,this.finishRequestTiming(),this.lastRequestAt=this.now(),this.reportError(new Error("Evaluation terminal sequence is stale"));return}Number.isFinite(a)&&(this.activeSequence=a),this.request=null,this.finishRequestTiming(),this.lastRequestAt=this.now();let o;try{o=H(s)}catch(l){this.reportError(l);return}this.cache.set(this.cacheKey(e,r),o),this.lastEvaluation=Object.freeze({...s}),this.setVisualState("connected"),this.presentEvaluation(e,o,s,!0)}acceptProgress(e,t,i,r,s){if(!this.acceptsRequest(e,t,i,r))return;let a=Number(s.sequence);if(!Number.isFinite(a)||a<=this.activeSequence||(this.activeSequence=a,s.type==="started")||s.bound)return;let o;try{o=H(s)}catch(l){this.reportError(l);return}this.lastEvaluation=Object.freeze({...s}),this.setVisualState("connected"),this.presentEvaluation(e,o,s,!1)}presentEvaluation(e,t,i,r){let s=this.presentationSelector.snapshot().selected,a=S(t,Number.isFinite(i.depth)?Number(i.depth):null,s?.favoredColor??"white"),o=this.presentationSelector.consider(a,this.now(),r);o.selected?(this.clearPresentationTimer(),this.publishPresentation(e,o.selected)):o.coalesced&&this.schedulePresentationFlush(e,this.generation,this.currentCacheContext)}publishPresentation(e,t){this.markEvaluationAccepted(e,!1),this.controller?.publish(this.sample(t))}schedulePresentationFlush(e,t,i){if(this.presentationTimer!==null)return;let r=this.presentationSelector.snapshot().lastSelectedAt??this.now(),s=Math.max(0,P-(this.now()-r));this.presentationTimer=this.options.window.setTimeout(()=>{if(this.presentationTimer=null,!this.enabled||!this.shouldDisplay()||!this.safeRead(()=>!!this.options.authorize(),!1)||t!==this.generation||e!==this.currentFen||this.safeRead(()=>this.options.getFen(),null)!==e||i!==this.currentCacheContext||this.readCacheContext()!==i)return;let a=this.presentationSelector.flush(this.now());a&&this.publishPresentation(e,a)},s)}clearPresentationTimer(){this.presentationTimer!==null&&this.options.window.clearTimeout(this.presentationTimer),this.presentationTimer=null}resetPresentation(){this.clearPresentationTimer(),this.presentationSelector.reset()}sample(e){return Object.freeze({searchId:this.generation,fraction:e.fraction,label:e.label,favoredColor:e.favoredColor})}mount(e){this.unmount();let t=this.options.document.createElement("div");t.id=ie,t.className="thinker-eval-v2-rail thinker-eval-v2-overlay",t.dataset.orientation=this.options.getOrientation(),t.dataset.favoredColor="white",t.dataset.state="waiting",t.setAttribute("aria-label","Position evaluation");let i=this.options.document.createElement("div");i.className="thinker-eval-v2-fill";let r=this.options.document.createElement("span");if(r.className="thinker-eval-v2-score",r.textContent="\u2026",t.append(i,r),(this.options.document.body||this.options.document.documentElement).append(t),this.board=e,this.mountCount+=1,this.root=t,this.label=r,this.installGeometryTracking(e),this.syncGeometry(),this.controller=new E({root:t,fill:i,label:r},{reducedMotion:this.options.reducedMotion,onFrameCommitted:()=>this.commitPendingVisualFrame()}),this.controller.setOrientation(this.options.getOrientation()),this.currentFen){let a=this.cache.get(this.cacheKey(this.currentFen,this.currentCacheContext));t.dataset.state=a?"fresh":"waiting";let o=a?S(a):null;this.controller.beginSearch(this.generation,o?this.sample(o):null)}}ensureBoard(e){if(!this.controller||!this.root?.isConnected){this.mount(e);return}if(this.board!==e){if(!this.isEquivalentBoard(e)){this.mount(e);return}this.board=e,this.boardRetargetCount+=1,this.installGeometryTracking(e),this.syncGeometry()}}unmount(){this.controller?.destroy(),this.controller=null,this.root?.remove(),this.root=null,this.label=null,this.board=null,this.geometry=null,this.boardGeometry=null,this.removeGeometryTracking()}deactivate(){let e=!!(this.request||this.interval!==null||this.root||this.currentFen);this.clearBoardMissingTimer(),this.cancelRouteReconcileBurst(),this.abortRequest("deactivated"),this.stopPolling(),this.currentFen="",this.currentCacheContext="",this.lastRequestAt=-1/0,this.activeSequence=-1,this.connectionState="idle",this.lastEvaluation=null,this.lastError=null,this.hasRenderedEvaluation=!1,this.renderedFen="",this.visualStale=!1,this.pendingRenderedFen="",this.pendingRenderedGeneration=-1,this.resetPresentation(),e&&(this.generation+=1),this.unmount()}abortRequest(e){this.request&&(this.abortCount+=1,this.lastAbortReason=e,this.finishRequestTiming());try{this.request?.abort()}catch{}this.request=null}finishRequestTiming(){this.requestStartedAt!==null&&(this.lastRequestDurationMs=Math.max(0,this.now()-this.requestStartedAt)),this.requestStartedAt=null}shouldDisplay(){try{return this.options.shouldDisplay?this.options.shouldDisplay():!!this.options.authorize()}catch{return!1}}safeRead(e,t){try{return e()}catch{return t}}clearPosition(e,t){let i=!!(this.currentFen||this.request),r=this.controller?.snapshot(),s=this.hasRenderedEvaluation||this.label?.textContent!==t||r?.current!==.5||r?.target!==.5;if(this.abortRequest(e==="blocked"?"authorization-unavailable":"fen-unavailable"),this.currentFen="",this.currentCacheContext="",this.lastRequestAt=-1/0,this.activeSequence=-1,i&&(this.generation+=1),this.pendingRenderedFen="",this.pendingRenderedGeneration=-1,this.resetPresentation(),e==="blocked"){this.hasRenderedEvaluation=!1,this.renderedFen="",this.visualStale=!1,this.lastEvaluation=null,s&&this.controller?.reset(.5,t),this.setVisualState(e,t);return}this.visualStale=this.hasRenderedEvaluation,i&&this.controller?.beginSearch(this.generation),!this.hasRenderedEvaluation&&s&&this.controller?.reset(.5,t),this.setVisualState(e,this.hasRenderedEvaluation?void 0:t)}setVisualState(e,t,i){this.connectionState=e,this.lastError=i==null?null:i instanceof Error?i.message:String(i),this.root&&(this.root.dataset.state=e==="connected"?"fresh":e),t!==void 0&&this.label&&this.label.textContent!==t&&(this.label.textContent=t)}reportError(e){this.clearPresentationTimer();let t=this.hasRenderedEvaluation;this.setVisualState("error",t?void 0:"!",e)}ensurePolling(){this.interval===null&&(this.interval=this.options.window.setInterval(()=>this.pollNow(),this.options.pollIntervalMs??re))}stopPolling(){this.interval!==null&&this.options.window.clearInterval(this.interval),this.interval=null}installObserver(){if(this.observer||!this.options.document.body)return;let e=this.options.document.defaultView?.MutationObserver??globalThis.MutationObserver;if(!e)return;let t=new e(()=>this.queueReconcile());t.observe(this.options.document.body,{childList:!0,subtree:!0,attributes:!0,attributeFilter:["data-fen","fen","data-position"]}),this.observer=t}queueReconcile(){this.reconcileQueued||(this.reconcileQueued=!0,queueMicrotask(()=>this.reconcile()))}installStyle(){if(this.options.document.getElementById(R))return;let e=we();if(!e)return;if(this.options.addStyle){let i=this.options.addStyle(e);if(i?.nodeType===1)i.id=R;else{let r=this.options.document.createElement("meta");r.id=R,(this.options.document.head||this.options.document.documentElement).append(r)}return}let t=this.options.document.createElement("style");t.id=R,t.textContent=e,(this.options.document.head||this.options.document.documentElement).append(t)}installGeometryTracking(e){this.removeGeometryTracking();let t=this.options.document.defaultView?.ResizeObserver??globalThis.ResizeObserver;t&&(this.resizeObserver=new t(()=>this.syncGeometry()),this.resizeObserver.observe(e)),this.options.window.addEventListener("resize",this.geometryListener),this.options.window.addEventListener("scroll",this.geometryListener,!0)}removeGeometryTracking(){this.resizeObserver?.disconnect(),this.resizeObserver=null,this.options.window.removeEventListener("resize",this.geometryListener),this.options.window.removeEventListener("scroll",this.geometryListener,!0)}syncGeometry(){if(!this.root||!this.board?.isConnected)return;let e=this.board.getBoundingClientRect(),t=this.options.window.getComputedStyle(this.root),i=Number.parseFloat(t.getPropertyValue("--thinker-eval-v2-width")),r=Number.parseFloat(t.getPropertyValue("--thinker-eval-v2-gap")),s=Number.isFinite(i)&&i>0?i:this.options.window.innerWidth>=960?30:20,a=Number.isFinite(r)&&r>=0?r:10,o=e.left-s-a,l=e.right+a,h=this.options.window.innerWidth,u=o>=0?o:l+s<=h?l:Math.max(0,e.left);this.root.hidden=e.width<=0||e.height<=0;let c=u===o?"left":u===l?"right":"overlay";this.root.dataset.placement=c,this.root.style.left=`${u}px`,this.root.style.top=`${e.top}px`,this.root.style.height=`${e.height}px`,this.geometry=Object.freeze({left:u,top:e.top,width:s,height:e.height,placement:c}),this.boardGeometry=Object.freeze({left:e.left,top:e.top,width:e.width,height:e.height})}readCacheContext(){try{return String(this.options.getCacheContext()||"").trim()}catch{return""}}cacheKey(e,t){return`${this.options.cacheNamespace??"eval-bar-v2"}|${t}|white|${e}`}acceptsRequest(e,t,i,r){let s=this.enabled&&!!this.options.authorize()&&t===this.generation&&i===this.activeRequestId&&e===this.currentFen&&this.options.getFen()===e&&r===this.currentCacheContext&&this.readCacheContext()===r;return s||(this.staleResultCount+=1),s}markEvaluationAccepted(e,t){if(this.firstEvaluationGeneration!==this.generation){let i=this.now();this.firstEvaluationGeneration=this.generation,this.lastFirstEvaluationAt=i,this.lastRequestToFirstEvaluationMs=t||this.lastRequestDispatchedAt===null?null:Math.max(0,i-this.lastRequestDispatchedAt),this.lastEvaluationAcceptedAt=i}this.hasRenderedEvaluation=!0,this.pendingRenderedFen=e,this.pendingRenderedGeneration=this.generation}commitPendingVisualFrame(){if(!this.pendingRenderedFen||this.pendingRenderedGeneration!==this.generation)return;this.renderedFen=this.pendingRenderedFen,this.pendingRenderedFen="",this.pendingRenderedGeneration=-1,this.visualStale=!1;let e=this.now();this.lastFirstRenderedFrameAt=e,this.lastEvaluationToFirstFrameMs=this.lastEvaluationAcceptedAt===null?null:Math.max(0,e-this.lastEvaluationAcceptedAt)}isEquivalentBoard(e){if(this.board===e||this.board?.contains(e)||e.contains(this.board))return!0;if(!this.boardGeometry)return!1;let t=e.getBoundingClientRect();return Math.abs(t.left-this.boardGeometry.left)<=2&&Math.abs(t.top-this.boardGeometry.top)<=2&&Math.abs(t.width-this.boardGeometry.width)<=2&&Math.abs(t.height-this.boardGeometry.height)<=2}handleBoardUnavailable(){if(!this.controller||!this.root?.isConnected){this.deactivate();return}if(this.boardMissingTimer===null){let e=!!(this.currentFen||this.request);this.abortRequest("board-unavailable"),this.currentFen="",this.currentCacheContext="",this.lastRequestAt=-1/0,this.activeSequence=-1,e&&(this.generation+=1,this.controller.beginSearch(this.generation)),this.pendingRenderedFen="",this.pendingRenderedGeneration=-1,this.resetPresentation(),this.boardMissingTimer=this.options.window.setTimeout(()=>{this.boardMissingTimer=null;let t=this.safeRead(()=>this.options.getBoard(),null);!t?.isConnected||!t.parentElement?this.deactivate():this.queueReconcile()},this.options.boardMissingGraceMs??oe)}this.ensurePolling(),this.visualStale=this.hasRenderedEvaluation,this.setVisualState(this.hasRenderedEvaluation?"stale":"waiting",this.hasRenderedEvaluation?void 0:"\u2026")}clearBoardMissingTimer(){this.boardMissingTimer!==null&&this.options.window.clearTimeout(this.boardMissingTimer),this.boardMissingTimer=null}scheduleRouteReconcileBurst(){if(this.routeReconcileFramesRemaining=le,this.routeReconcileTimer!==null)return;let e=()=>{this.routeReconcileTimer=null,!(!this.started||this.routeReconcileFramesRemaining<=0)&&(this.routeReconcileFramesRemaining-=1,this.reconcile(),this.routeReconcileFramesRemaining>0&&(this.routeReconcileTimer=this.options.window.setTimeout(e,16)))};this.routeReconcileTimer=this.options.window.setTimeout(e,0)}cancelRouteReconcileBurst(){this.routeReconcileTimer!==null&&this.options.window.clearTimeout(this.routeReconcileTimer),this.routeReconcileTimer=null,this.routeReconcileFramesRemaining=0}};function Ae(n){return new A(n)}return X(Fe);})();
globalThis.ThinkerEvalBarV2 = ThinkerEvalBarV2Bundle;
/* THINKER_EVAL_BAR_V2_GENERATED_END */

(function () {
  "use strict";

  const DEBUG = false;
  function resolveThinkerJQuery() {
    const exported = typeof module !== "undefined" && module ? module.exports : null;
    const candidates = [exported, window.jQuery, window.$];
    for (const candidate of candidates) {
      if (typeof candidate === "function" && candidate.fn?.jquery) return candidate;
      if (candidate === exported && typeof candidate === "function") {
        try {
          const initialized = candidate(window);
          if (typeof initialized === "function" && initialized.fn?.jquery) return initialized;
        } catch (_) {}
      }
    }
    return null;
  }
  let $ = resolveThinkerJQuery();
  const SERVER_URL = "http://127.0.0.1:5050";
  const localStorage = (() => {
    const memory = new Map();
    let nativeStorage = null;
    try {
      nativeStorage = window.localStorage;
      nativeStorage.getItem("kb_default_off_v4");
    } catch (_) {
      nativeStorage = null;
    }
    return {
      getItem(key) {
        try {
          const value = nativeStorage && nativeStorage.getItem(key);
          return value === null || value === undefined ? (memory.get(key) ?? null) : value;
        } catch (_) {
          return memory.get(key) ?? null;
        }
      },
      setItem(key, value) {
        const text = String(value);
        memory.set(key, text);
        try {
          if (nativeStorage) nativeStorage.setItem(key, text);
        } catch (_) {}
      },
      removeItem(key) {
        memory.delete(key);
        try {
          if (nativeStorage) nativeStorage.removeItem(key);
        } catch (_) {}
      },
    };
  })();

  function sessionControlMessage(value, options) {
    const code = typeof value === "string" && value ? value : "STATUS_UNAVAILABLE";
    if (!/^[A-Z][A-Z0-9_]+$/.test(code)) return code;
    const api = globalThis.ThinkerSessionControl;
    if (options && options.success) {
      if (api && typeof api.successLabel === "function") return api.successLabel(code);
      if (code === "SESSION_STARTED") return "Session started";
      if (code === "DRAINING") return "Finishing session...";
      if (code === "SESSION_STOPPED") return "Session finished";
      if (code === "COMPLETED") return "Completed";
      return "Operation completed";
    }
    if (api && typeof api.warningLabel === "function") return api.warningLabel(code);
    if (code === "DDA_MAPPING_UNAVAILABLE" || code.includes("ARTIFACT")) return "⚠️ Check calibration artifact";
    if (code.startsWith("CALIBRATION_")) return "⚠️ Calibration unavailable";
    return "⚠️ Unable to update session";
  }

  let sessionToastTimer = null;
  function notifySessionControl(value, options) {
    const toast = document.getElementById("kb-session-toast");
    if (!toast) return;
    if (sessionToastTimer !== null) window.clearTimeout(sessionToastTimer);
    toast.textContent = sessionControlMessage(value, options);
    toast.dataset.visible = "true";
    toast.dataset.success = options && options.success ? "true" : "false";
    sessionToastTimer = window.setTimeout(() => {
      toast.dataset.visible = "false";
      sessionToastTimer = null;
    }, 3200);
  }

  const sessionControlBridge = (() => {
    let controller = null;
    let contextProvider = null;
    let startCoordinator = null;
    let bootstrapProvider = null;
    let rollout = { schemaVersion: 1, stage: "ACTIVE_DDA" };
    let rolloutLoaded = false;
    let warningCode = "SESSION_RUNTIME_UNAVAILABLE";
    let telemetry = null;
    let compatibilityAutoMove = false;
    let compatibilityAutoQueue = false;
    let negotiatedWarningCode = null;
    let activeDdaValidated = false;
    const context = () => {
      try {
        return typeof contextProvider === "function" ? contextProvider() || {} : {};
      } catch (_) {
        return {};
      }
    };
    return Object.freeze({
      install(nextController, nextContextProvider, options) {
        if (!nextController || typeof nextController.isActive !== "function") throw new TypeError("invalid session controller");
        controller = nextController;
        contextProvider = nextContextProvider;
        const settings = options || {};
        rollout = globalThis.ThinkerSessionControl.validateRollout(settings.rollout || { schemaVersion: 1, stage: "ACTIVE_DDA" });
        rolloutLoaded = true;
        telemetry = settings.telemetry || nextController.telemetry || new globalThis.ThinkerSessionControl.BoundedTelemetry();
        startCoordinator = typeof settings.start === "function" ? settings.start : null;
        activeDdaValidated = false;
        warningCode = null;
        if (nextController.isActive()) {
          compatibilityAutoMove = true;
          compatibilityAutoQueue = nextController.snapshot.phase === "QUEUEING";
          negotiatedWarningCode = nextController.snapshot.executionReasonCode || null;
          warningCode = negotiatedWarningCode;
        }
      },
      setBootstrap(provider) {
        if (typeof provider !== "function") throw new TypeError("bootstrap provider is required");
        bootstrapProvider = provider;
      },
      clear() {
        controller = null;
        contextProvider = null;
        startCoordinator = null;
        rollout = { schemaVersion: 1, stage: "ACTIVE_DDA" };
        rolloutLoaded = false;
        warningCode = "SESSION_RUNTIME_UNAVAILABLE";
        telemetry = null;
        activeDdaValidated = false;
      },
      configureRollout(value) {
        rollout = globalThis.ThinkerSessionControl.validateRollout(value);
        rolloutLoaded = true;
        warningCode = rollout.stage === "DISABLED" ? "ROLLOUT_DISABLED" : warningCode === "ROLLOUT_DISABLED" ? null : warningCode;
        return rollout;
      },
      ownsQueue() {
        return Boolean(activeDdaValidated && controller && controller.isActive() && controller.executionMode === "ACTIVE_DDA" && rollout.stage === "ACTIVE_DDA");
      },
      isRunning() {
        return Boolean(controller && controller.isActive());
      },
      isActive() {
        return Boolean(activeDdaValidated && controller && controller.isActive() && controller.executionMode === "ACTIVE_DDA" && rollout.stage === "ACTIVE_DDA");
      },
      setCalibrationValidated(value) {
        activeDdaValidated = value === true;
        if (!activeDdaValidated && controller && controller.executionMode === "ACTIVE_DDA" && warningCode !== "BOT_DISABLED") warningCode = "CALIBRATION_REVALIDATION_REQUIRED";
        if (activeDdaValidated && controller && controller.isActive() && controller.snapshot.phase === "QUEUEING") handleAutoQueue();
        return activeDdaValidated;
      },
      effectiveAutoMove(userPreference) {
        if (!isMasterEnabled()) return false;
        if (!controller || !controller.isActive()) return Boolean(userPreference);
        if (controller.executionMode === "ACTIVE_DDA" && !activeDdaValidated) return false;
        return Boolean((userPreference || compatibilityAutoMove) && ["IN_GAME", "DRAINING", "QUEUEING"].includes(controller.snapshot && controller.snapshot.phase));
      },
      effectiveAutoQueue(userPreference) {
        if (!isMasterEnabled()) return false;
        if (!controller || !controller.isActive()) return Boolean(userPreference);
        if (controller.executionMode === "ACTIVE_DDA" && !activeDdaValidated) return false;
        const notInGame = !/^\/game\/(?:live|daily)\//.test(globalThis.location && globalThis.location.pathname || "");
        return Boolean((userPreference || compatibilityAutoQueue) && notInGame && controller.snapshot && controller.snapshot.phase === "QUEUEING" && Date.now() + controller.snapshot.config.minimumAdmissionHeadroomMs < controller.snapshot.deadlineEpochMs);
      },
      suspendsLegacyAutoAdjust() {
        return Boolean(rollout.stage === "ACTIVE_DDA" && controller && controller.legacyAutoAdjustSuspended());
      },
      moveSelectionElo(fallbackElo) {
        return controller ? controller.moveSelectionElo(fallbackElo) : fallbackElo;
      },
      prepareMovePlan(fen) {
        return controller ? controller.observePosition(fen) : Promise.resolve(null);
      },
      acceptMovePlan(plan, movePlanContext) {
        return controller ? controller.acceptMovePlanResponse(plan, movePlanContext) : Promise.resolve({ allowed: true, reason: "LEGACY" });
      },
      pinCalibration(capability) {
        return controller ? controller.pinCalibration(capability) : Promise.resolve({ allowed: false, reason: "SESSION_INACTIVE" });
      },
      admitGame(observation) {
        if (!controller) return Promise.resolve({ allowed: false, reason: "SESSION_INACTIVE" });
        return controller.executionMode === "COMPATIBILITY" ? controller.observeCompatibilityGame(observation) : controller.observeGame(observation);
      },
      observeResult(observation) {
        if (!controller) return Promise.resolve({ allowed: false, reason: "SESSION_INACTIVE" });
        return controller.executionMode === "COMPATIBILITY" ? controller.observeCompatibilityResult(observation) : controller.observeResult(observation);
      },
      sessionSnapshot() {
        return controller ? controller.snapshot : null;
      },
      restoreSession() {
        if (!controller || !controller.isActive()) return false;
        compatibilityAutoMove = true;
        compatibilityAutoQueue = controller.snapshot.phase === "QUEUEING";
        negotiatedWarningCode = controller.snapshot.executionReasonCode || null;
        warningCode = negotiatedWarningCode;
        if (masterStatusKnown && !isMasterEnabled()) {
          this.masterStatusChanged(false).catch((error) => {
            const code = error && error.code ? error.code : "MASTER_STOP_FAILED";
            this.setWarning(code);
            notifySessionControl(code);
          });
          return true;
        }
        if (compatibilityAutoQueue) handleAutoQueue();
        return true;
      },
      queueGate(userAutoQueue) {
        if (!isMasterEnabled()) return { allowed: false, reason: "BOT_DISABLED" };
        return this.ownsQueue() ? controller.queueGate({ ...(context().queue || {}), userAutoQueue }) : { allowed: true, reason: "LEGACY" };
      },
      executeQueue(userAutoQueue, effect) {
        if (!isMasterEnabled()) return Promise.resolve({ allowed: false, reason: "BOT_DISABLED" });
        return controller.executeQueueEffect({ ...(context().queue || {}), userAutoQueue }, () => {
          if (!isMasterEnabled()) throw Object.assign(new Error("BOT_DISABLED"), { code: "BOT_DISABLED" });
          return effect();
        });
      },
      captureMove(userAutoMove) {
        if (!controller || !isMasterEnabled()) return null;
        const input = { ...(context().move || {}), userAutoMove };
        return Object.freeze({ epoch: controller.captureEffectEpoch(), input, gate: controller.autoMoveGate(input) });
      },
      movePrecheck(captured) {
        return Boolean(isMasterEnabled() && captured && controller && controller.isEffectEpochCurrent(captured.epoch) && controller.autoMoveGate(captured.input).allowed);
      },
      executeMove(captured, effect) {
        if (!isMasterEnabled()) return Promise.resolve({ allowed: false, reason: "BOT_DISABLED" });
        return controller.executeAutoMoveEffect(captured.input, captured.epoch, () => {
          if (!isMasterEnabled()) throw Object.assign(new Error("BOT_DISABLED"), { code: "BOT_DISABLED" });
          return effect();
        });
      },
      autoMoveChanged(enabled) {
        if (!enabled) {
          compatibilityAutoMove = false;
          compatibilityAutoQueue = false;
        }
        if (!enabled && controller && controller.executionMode === "COMPATIBILITY" && controller.isActive()) return controller.requestGracefulStop();
        if (!enabled && controller && controller.executionMode === "ACTIVE_DDA") return controller.pauseForDisabledAutoMove();
        return Promise.resolve({ allowed: false, reason: "NO_CHANGE" });
      },
      autoQueueChanged(enabled) {
        if (controller && controller.isActive()) return;
        if (!enabled) compatibilityAutoQueue = false;
      },
      async masterStatusChanged(enabled) {
        if (enabled) {
          warningCode = controller && controller.isActive() && controller.executionMode === "COMPATIBILITY" ? negotiatedWarningCode || controller.snapshot.executionReasonCode : null;
          handleAutoQueue();
          return { allowed: true, reason: "BOT_ENABLED" };
        }
        compatibilityAutoMove = false;
        compatibilityAutoQueue = false;
        warningCode = "BOT_DISABLED";
        handleAutoQueue();
        if (!controller || !controller.isActive()) return { allowed: true, reason: "BOT_DISABLED" };
        let result = await controller.requestGracefulStop();
        if (!result.allowed && controller.isActive()) {
          await controller.reconcileNow();
          result = await controller.requestGracefulStop();
        }
        if (!result.allowed) throw Object.assign(new Error(result.reason || "MASTER_STOP_FAILED"), { code: result.reason || "MASTER_STOP_FAILED" });
        return result;
      },
      async start(config) {
        if (!isMasterEnabled()) throw Object.assign(new Error("BOT_DISABLED"), { code: "BOT_DISABLED" });
        if (!controller && bootstrapProvider) await bootstrapProvider();
        if (!controller) throw new Error("SESSION_RUNTIME_UNAVAILABLE");
        if (rollout.stage === "DISABLED") throw new Error("ROLLOUT_DISABLED");
        if (startCoordinator) {
          const snapshot = await startCoordinator(config);
          if (!isMasterEnabled()) {
            if (controller && controller.isActive()) await controller.requestGracefulStop();
            throw Object.assign(new Error("BOT_DISABLED"), { code: "BOT_DISABLED" });
          }
          compatibilityAutoMove = true;
          compatibilityAutoQueue = true;
          negotiatedWarningCode = snapshot.executionReasonCode || null;
          warningCode = negotiatedWarningCode;
          if (compatibilityAutoQueue) handleAutoQueue();
          if (typeof window.krypbotUpdateUI === "function") window.krypbotUpdateUI();
          return snapshot;
        }
        const start = context().start || {};
        if (!start.accountKey || !start.authorizationDecision) throw new Error("ACCOUNT_CONTEXT_UNAVAILABLE");
        const snapshot = await controller.startSession({ accountKey: start.accountKey, authorizationDecision: start.authorizationDecision, config });
        warningCode = null;
        return snapshot;
      },
      async gracefulStop() {
        if (!controller) return { allowed: false, reason: "SESSION_RUNTIME_UNAVAILABLE" };
        const result = await controller.requestGracefulStop();
        warningCode = result.allowed ? null : result.reason;
        return result;
      },
      status() {
        const api = globalThis.ThinkerSessionControl;
        return api.buildStatusView(controller ? controller.snapshot : null, { nowEpochMs: Date.now(), isLeader: Boolean(controller && controller.isLeader()), rollout, warningCode, executionMode: controller ? controller.executionMode : "UNAVAILABLE" });
      },
      setWarning(code) {
        if (code) negotiatedWarningCode = code;
        warningCode = code || (controller && controller.isActive() && controller.executionMode === "COMPATIBILITY" ? negotiatedWarningCode || controller.snapshot.executionReasonCode : null);
      },
      exportDiagnostic() {
        const api = globalThis.ThinkerSessionControl;
        const events = telemetry && typeof telemetry.list === "function" ? telemetry.list() : [];
        return api.diagnosticExport(this.status(), events, Date.now());
      },
    });
  })();
  Object.defineProperty(window, "krypbotSessionControlBridge", { configurable: false, enumerable: false, writable: false, value: sessionControlBridge });

  let sessionControlBootstrap = null;
  let sessionControlObservedContext = Object.freeze({});
  let sessionControlReadinessTimer = null;
  let sessionControlStatusTimer = null;
  let sessionControlTargetScaleId = null;
  const sessionControlBootstrapReady = Promise.resolve().then(async () => {
    const api = await globalThis.ThinkerSessionControlReady;
    const calibrationFailure = (code, cause) => {
      const error = new Error(code);
      error.code = code;
      if (cause !== undefined) error.cause = cause;
      return error;
    };
    api.assertCanonicalOrigin(globalThis.location, globalThis.top, globalThis.self);
    api.preflightCapabilities({ isSecureContext: globalThis.isSecureContext, indexedDB: globalThis.indexedDB, navigator: globalThis.navigator, BroadcastChannel: globalThis.BroadcastChannel, crypto: globalThis.crypto, GM_getValue, GM_setValue });
    const probeCalibrationReadiness = async (config, queueContext) => {
      if (!globalThis.krypbotCalibrationApi || typeof globalThis.krypbotCalibrationApi.readiness !== "function") throw calibrationFailure("CALIBRATION_NOT_READY");
      try {
        return await globalThis.krypbotCalibrationApi.readiness({
          schemaVersion: 1,
          opponentRatingScaleId: queueContext.opponentRatingScaleId,
          targetScaleId: config.scaleId,
          requiredMode: "active",
        });
      } catch (cause) {
        throw calibrationFailure(cause && cause.code ? cause.code : "CALIBRATION_NOT_READY", cause);
      }
    };
    const publishQueueContext = (queueContext, calibrationReadiness) => {
      sessionControlObservedContext = Object.freeze({
        ...sessionControlObservedContext,
        queue: Object.freeze({ calibrationReadiness, intendedQueueScaleId: queueContext.opponentRatingScaleId }),
      });
    };
    const unavailableReadiness = (snapshot, code) => Object.freeze({
      schemaVersion: 1,
      active: false,
      executionMode: "compatibility",
      reasonCode: code,
      opponentRatingScaleId: snapshot.activationContext.opponentRatingScaleId,
      targetScaleId: snapshot.config.scaleId,
      generatedAtEpochMs: Date.now(),
      expiresAtEpochMs: Date.now() + 5000,
    });
    const publishRecoveredQueue = (snapshot, calibrationReadiness) => {
      if (!snapshot || !snapshot.activationContext) return;
      const recovered = api.recoverObservedContext(snapshot, calibrationReadiness);
      sessionControlObservedContext = Object.freeze({ ...sessionControlObservedContext, ...(recovered.queue ? { queue: recovered.queue } : {}) });
    };
    const scheduleReadinessRefresh = (config, queueContext, calibrationReadiness) => {
      if (sessionControlReadinessTimer !== null) window.clearTimeout(sessionControlReadinessTimer);
      const delay = Math.max(1000, Math.min(2147483647, calibrationReadiness.expiresAtEpochMs - Date.now() - 5000));
      sessionControlReadinessTimer = window.setTimeout(async () => {
        sessionControlReadinessTimer = null;
        try {
          const target = resolveAutoQueueTarget(getSearchTargets());
          const current = api.observeQueueContext(target);
          if (!current || current.contextClass !== queueContext.contextClass || current.poolId !== queueContext.poolId) throw calibrationFailure("CONTEXT_UNIDENTIFIABLE");
          const refreshed = await probeCalibrationReadiness(config, current);
          const negotiation = api.negotiateExecutionMode({ calibrationReadiness: refreshed, intendedQueueScaleId: current.opponentRatingScaleId }, config, Date.now());
          publishQueueContext(current, refreshed);
          sessionControlBridge.setCalibrationValidated(negotiation.executionMode === "ACTIVE_DDA");
          sessionControlBridge.setWarning(negotiation.warningCode);
          scheduleReadinessRefresh(config, current, refreshed);
        } catch (error) {
          const code = error && error.code ? error.code : "CALIBRATION_NOT_READY";
          publishQueueContext(queueContext, Object.freeze({ schemaVersion: 1, active: false, executionMode: "compatibility", reasonCode: code, opponentRatingScaleId: queueContext.opponentRatingScaleId, targetScaleId: config.scaleId, generatedAtEpochMs: Date.now(), expiresAtEpochMs: Date.now() + 5000 }));
          sessionControlBridge.setCalibrationValidated(false);
          sessionControlBridge.setWarning(code);
        }
      }, delay);
    };
    const revalidateRecoveredSession = async (snapshot) => {
      if (!snapshot || !snapshot.activationContext || snapshot.executionMode !== "ACTIVE_DDA") return false;
      const queueContext = {
        contextClass: snapshot.activationContext.context,
        poolId: snapshot.activationContext.pool,
        opponentRatingScaleId: snapshot.activationContext.opponentRatingScaleId,
      };
      const readiness = await probeCalibrationReadiness(snapshot.config, queueContext);
      const negotiation = api.negotiateExecutionMode({ calibrationReadiness: readiness, intendedQueueScaleId: queueContext.opponentRatingScaleId }, snapshot.config, Date.now());
      if (negotiation.executionMode !== "ACTIVE_DDA") throw calibrationFailure(negotiation.warningCode || "CALIBRATION_NOT_ACTIVE");
      publishQueueContext(queueContext, readiness);
      if (snapshot.activeGame) {
        const game = snapshot.activeGame;
        const offsetElo = snapshot.controller.mode === "BOOST" ? snapshot.config.boostOffsetElo : snapshot.config.correctionOffsetElo;
        await globalThis.krypbotCalibrationApi.capability({ schemaVersion: 1, runtimeGameToken: game.runtimeGameToken, scaleId: snapshot.config.scaleId, opponentRatingScaleId: game.opponent.ratingScaleId, opponentRating: game.opponent.rating, offsetElo, platformAdjustedRating: game.opponent.rating + offsetElo, requiredMode: "active" });
      }
      sessionControlBridge.setCalibrationValidated(true);
      sessionControlBridge.setWarning(null);
      scheduleReadinessRefresh(snapshot.config, queueContext, readiness);
      return true;
    };
    const scheduleStatusRetry = () => {
      if (sessionControlStatusTimer !== null) return;
      sessionControlStatusTimer = window.setTimeout(() => {
        sessionControlStatusTimer = null;
        const state = sessionControlBootstrap && sessionControlBootstrap.getState();
        const snapshot = state && state.runtime && state.runtime.controller.snapshot;
        refreshDeploymentStatus(snapshot).catch(() => {});
      }, 5000);
    };
    const refreshDeploymentStatus = async (snapshot) => {
      try {
        const deploymentStatus = await globalThis.krypbotCalibrationApi.status();
        sessionControlTargetScaleId = deploymentStatus && deploymentStatus.targetScaleId || sessionControlTargetScaleId;
        if (!sessionControlTargetScaleId) throw calibrationFailure(deploymentStatus && deploymentStatus.reasonCode || "CALIBRATION_UNAVAILABLE");
        if (snapshot && snapshot.executionMode === "ACTIVE_DDA") await revalidateRecoveredSession(snapshot);
        return deploymentStatus;
      } catch (error) {
        const code = error && error.code ? error.code : "SERVER_UNAVAILABLE";
        if (snapshot && snapshot.activationContext) publishRecoveredQueue(snapshot, unavailableReadiness(snapshot, code));
        if (snapshot && snapshot.executionMode === "ACTIVE_DDA") sessionControlBridge.setCalibrationValidated(false);
        sessionControlBridge.setWarning(code);
        scheduleStatusRetry();
        return null;
      }
    };
    const environment = {
      isSecureContext: globalThis.isSecureContext,
      indexedDB: globalThis.indexedDB,
      navigator: globalThis.navigator,
      BroadcastChannel: globalThis.BroadcastChannel,
      crypto: globalThis.crypto,
      GM_getValue,
      GM_setValue,
      location: globalThis.location,
      top: globalThis.top,
      self: globalThis.self,
      canStart: () => isMasterEnabled() ? true : "BOT_DISABLED",
    };
    sessionControlBootstrap = api.createSessionControlBootstrap({
      api,
      environment,
      location: globalThis.location,
      top: globalThis.top,
      self: globalThis.self,
      observeStartContext: async (config) => {
        const username = OpponentIntel.getMyOwnUsername();
        const target = resolveAutoQueueTarget(getSearchTargets());
        if (!username || !target || !target.source) {
          const error = new Error("ACCOUNT_CONTEXT_UNAVAILABLE");
          error.code = "ACCOUNT_CONTEXT_UNAVAILABLE";
          throw error;
        }
        const queueContext = api.observeQueueContext(target);
        if (!queueContext) {
          const error = new Error("CONTEXT_UNIDENTIFIABLE");
          error.code = "CONTEXT_UNIDENTIFIABLE";
          throw error;
        }
        const accountKey = await api.accountKeyForUsername(username, globalThis.crypto);
        const calibrationReadiness = await probeCalibrationReadiness(config, queueContext);
        const currentUsername = OpponentIntel.getMyOwnUsername();
        const currentTarget = resolveAutoQueueTarget(getSearchTargets());
        const currentQueueContext = api.observeQueueContext(currentTarget);
        if (!currentUsername || api.normalizeUsername(currentUsername) !== api.normalizeUsername(username) || !currentTarget || currentTarget.button !== target.button || !currentQueueContext || currentQueueContext.contextClass !== queueContext.contextClass || currentQueueContext.poolId !== queueContext.poolId) throw calibrationFailure("CONTEXT_UNIDENTIFIABLE");
        publishQueueContext(queueContext, calibrationReadiness);
        scheduleReadinessRefresh(config, queueContext, calibrationReadiness);
        return Object.freeze({
          accountKey,
          context: queueContext.contextClass,
          pool: queueContext.poolId,
          intendedQueueScaleId: queueContext.opponentRatingScaleId,
          calibrationReadiness,
        });
      },
      install: (runtime, dependencies) => {
        sessionControlBridge.install(runtime.controller, () => sessionControlObservedContext, {
          rollout: runtime.rollout,
          telemetry: dependencies.telemetry,
          start: runtime.start,
        });
      },
      onMode: (negotiation) => {
        if (!negotiation.recovered) sessionControlBridge.setCalibrationValidated(negotiation.executionMode === "ACTIVE_DDA");
        sessionControlBridge.setWarning(negotiation.warningCode);
      },
    });
    sessionControlBridge.setBootstrap(() => sessionControlBootstrap.begin());
    const runtime = await sessionControlBootstrap.begin();
    const username = OpponentIntel.getMyOwnUsername();
    if (username) {
      const accountKey = await api.accountKeyForUsername(username, globalThis.crypto);
      const recovered = await runtime.recover(accountKey);
      if (recovered && recovered.activationContext) publishRecoveredQueue(recovered, unavailableReadiness(recovered, "CALIBRATION_REVALIDATION_REQUIRED"));
      sessionControlBridge.restoreSession();
      if (recovered && recovered.executionMode === "ACTIVE_DDA" && runtime.controller.isActive()) sessionControlBridge.setWarning("CALIBRATION_REVALIDATION_REQUIRED");
      refreshDeploymentStatus(recovered).catch(() => {});
    } else {
      refreshDeploymentStatus(null).catch(() => {});
    }
    return runtime;
  }).catch((error) => {
    const code = error && error.code ? error.code : "SESSION_RUNTIME_UNAVAILABLE";
    sessionControlBridge.setWarning(code);
    return null;
  });
  Object.defineProperty(window, "krypbotSessionControlBootstrap", { configurable: false, enumerable: false, writable: false, value: Object.freeze({
    ready: sessionControlBootstrapReady,
    state: () => sessionControlBootstrap ? sessionControlBootstrap.getState() : { phase: "PENDING", reasonCode: null, runtime: null },
  }) });

  let sessionLifecycleBusy = false;
  let sessionLifecycleIdentity = null;
  let sessionGameTracker = null;
  let sessionResultTracker = null;
  let sessionLastPinAttemptAt = 0;
  const observedRatedState = () => {
    const { game } = get_cached_game();
    for (const value of [game && game.rated, game && game.isRated]) if (typeof value === "boolean") return value;
    for (const method of ["getIsRated", "isRatedGame"]) {
      try {
        const value = game && typeof game[method] === "function" ? game[method]() : null;
        if (typeof value === "boolean") return value;
      } catch (_) {}
    }
    const values = Array.from(document.querySelectorAll('[data-rated="true"], [data-rated="false"]')).map((node) => node.getAttribute("data-rated"));
    return new Set(values).size === 1 ? values[0] === "true" : null;
  };
  const terminalEvidence = () => {
    const node = document.querySelector('.game-over-modal-content, [data-cy="game-over-modal"], [data-test-element*="game-over"], .game-result');
    if (!node) return null;
    const text = String(node.textContent || "").normalize("NFKC").toLowerCase();
    if (!text.trim()) return null;
    let outcome = null;
    if (/\b(you won|you win|voc[eê] venceu)\b/.test(text)) outcome = "W";
    else if (/\b(draw|empate|drawn)\b/.test(text)) outcome = "D";
    else if (/\b(you lost|you lose|voc[eê] perdeu)\b/.test(text)) outcome = "L";
    return outcome ? { outcome, termination: "platform-terminal", proofDigest: `terminal:${outcome}:${text.length}` } : { unknown: true };
  };
  const observeSessionLifecycle = async () => {
    if (sessionLifecycleBusy || !sessionControlBridge.isRunning()) return;
    sessionLifecycleBusy = true;
    try {
      const api = await globalThis.ThinkerSessionControlReady;
      if (!sessionGameTracker) sessionGameTracker = new api.StableEvidenceTracker(api.validatePlatformObservation);
      if (!sessionResultTracker) sessionResultTracker = new api.StableEvidenceTracker(api.validateTerminalObservation);
      const snapshot = sessionControlBridge.sessionSnapshot();
      if (sessionControlBridge.isActive() && snapshot && snapshot.activeGame && snapshot.activeGame.targetPinStatus === "PENDING" && Date.now() - sessionLastPinAttemptAt >= 2000) {
        sessionLastPinAttemptAt = Date.now();
        const game = snapshot.activeGame;
        const offsetElo = snapshot.controller.mode === "BOOST" ? snapshot.config.boostOffsetElo : snapshot.config.correctionOffsetElo;
        await globalThis.krypbotCalibrationApi.capability({ schemaVersion: 1, runtimeGameToken: game.runtimeGameToken, scaleId: snapshot.config.scaleId, opponentRatingScaleId: game.opponent.ratingScaleId, opponentRating: game.opponent.rating, offsetElo, platformAdjustedRating: game.opponent.rating + offsetElo, requiredMode: "active" });
      }
      if (sessionControlBridge.isActive() && snapshot && snapshot.activeGame && snapshot.activeGame.targetPinStatus === "PINNED" && snapshot.activeGame.calibrationCapabilityExpiresAtEpochMs <= Date.now() + 60000) {
        const game = snapshot.activeGame;
        const offsetElo = snapshot.controller.mode === "BOOST" ? snapshot.config.boostOffsetElo : snapshot.config.correctionOffsetElo;
        await globalThis.krypbotCalibrationApi.capability({ schemaVersion: 1, runtimeGameToken: game.runtimeGameToken, scaleId: snapshot.config.scaleId, opponentRatingScaleId: game.opponent.ratingScaleId, opponentRating: game.opponent.rating, offsetElo, platformAdjustedRating: game.opponent.rating + offsetElo, requiredMode: "active" });
      }
      const gameId = api.canonicalGameIdFromUrl(window.location.href);
      const username = OpponentIntel.getMyOwnUsername();
      const opponentUsername = OpponentIntel.getOpponentUsername();
      const opponentRating = getOpponentRating();
      const queue = sessionControlObservedContext.queue;
      const rated = observedRatedState();
      if (snapshot && gameId && username && opponentUsername && Number.isInteger(opponentRating) && queue && typeof rated === "boolean") {
        const accountKey = await api.accountKeyForUsername(username, globalThis.crypto);
        const opponentKey = await api.accountKeyForUsername(opponentUsername, globalThis.crypto);
        const side = getPlayingSide() === "b" ? "black" : "white";
        const observedAtEpochMs = Date.now();
        const observation = { schemaVersion: 1, canonicalPlatformGameId: gameId, accountKey, opponentKey, opponentRating, opponentRatingScaleId: queue.intendedQueueScaleId, userSide: side, contextClass: "chesscom-live-game-v1", poolId: queue.intendedQueueScaleId, rated, observedAtEpochMs, sourceVersion: "chesscom-context-v1" };
        const stable = sessionGameTracker.observe(observation);
        const canAdmit = snapshot.executionMode === "COMPATIBILITY" ? !snapshot.activeGame : snapshot.queueIntent && ["DISPATCHED", "AMBIGUOUS"].includes(snapshot.queueIntent.status);
        if (stable.stable && snapshot.activeGame) {
          const recovered = api.recoverObservedContext(snapshot, queue.calibrationReadiness, observation);
          if (recovered.lifecycleIdentity) sessionLifecycleIdentity = recovered.lifecycleIdentity;
          if (recovered.move) sessionControlObservedContext = Object.freeze({ ...sessionControlObservedContext, move: recovered.move });
        } else if (stable.stable && canAdmit) {
          const admitted = await sessionControlBridge.admitGame(observation);
          if (admitted.allowed) {
            sessionLifecycleIdentity = observation;
            const current = sessionControlBridge.sessionSnapshot();
            if (sessionControlBridge.isActive()) {
              const game = current.activeGame;
              const offsetElo = current.controller.mode === "BOOST" ? current.config.boostOffsetElo : current.config.correctionOffsetElo;
              await globalThis.krypbotCalibrationApi.capability({ schemaVersion: 1, runtimeGameToken: game.runtimeGameToken, scaleId: current.config.scaleId, opponentRatingScaleId: game.opponent.ratingScaleId, opponentRating: game.opponent.rating, offsetElo, platformAdjustedRating: game.opponent.rating + offsetElo, requiredMode: "active" });
              const recovered = api.recoverObservedContext(sessionControlBridge.sessionSnapshot(), queue.calibrationReadiness, observation);
              if (recovered.move) sessionControlObservedContext = Object.freeze({ ...sessionControlObservedContext, move: recovered.move });
            }
          }
        }
      }
      const terminal = terminalEvidence();
      if (terminal && sessionLifecycleIdentity) {
        if (terminal.unknown) {
          const controller = sessionControlBootstrap && sessionControlBootstrap.getState().runtime && sessionControlBootstrap.getState().runtime.controller;
          if (controller) await controller.observeUnknownOutcome(sessionLifecycleIdentity);
          return;
        }
        const observation = { schemaVersion: 1, canonicalPlatformGameId: sessionLifecycleIdentity.canonicalPlatformGameId, accountKey: sessionLifecycleIdentity.accountKey, userSide: sessionLifecycleIdentity.userSide, ...terminal, source: "terminal-modal-v1", observedAtEpochMs: Date.now() };
        const stable = sessionResultTracker.observe(observation);
        if (stable.stable) {
          await sessionControlBridge.observeResult(observation);
          sessionGameTracker.reset();
          sessionResultTracker.reset();
          sessionLifecycleIdentity = null;
          sessionControlObservedContext = Object.freeze({ ...sessionControlObservedContext, move: undefined });
        }
      }
    } catch (error) {
      sessionControlBridge.setWarning(error && error.code ? error.code : "SESSION_LIFECYCLE_OBSERVATION_FAILED");
    } finally {
      sessionLifecycleBusy = false;
    }
  };
  window.setInterval(observeSessionLifecycle, 300);

  function debug(method, ...args) {
    if (!DEBUG) return;
    const logger = console[method];
    if (typeof logger === "function") logger.call(console, ...args);
  }

  // --- SAFETY RESET / CONFIGURAÇÃO INICIAL ---
  // Garante que todas as features comecem DESATIVADAS por padrão no primeiro uso desta versão,
  // limpando qualquer estado anterior que possa ter ficado ativo (Smart Pacing, Eval Bar, Auto Adjust).
  // Também força o modo do Auto Run Delay para Random (RND) por padrão.
  const resetDefaultsThisVersion = localStorage.getItem("kb_default_off_v6") !== "true";
  if (resetDefaultsThisVersion) {
    localStorage.setItem("smartPacing", "false");
    localStorage.setItem("smartPacingV2", "false");
    localStorage.setItem("smartPacingV2Shadow", "false");
    localStorage.setItem("evalBar", "false");
    localStorage.setItem("kb-auto-adjust", "false");
    localStorage.setItem("kb-auto-queue", "false");
    localStorage.setItem("autoDelayMode", "random");
    localStorage.setItem("autoMinDelay", "0.5");
    localStorage.setItem("autoMaxDelay", "2.0");
    localStorage.setItem("kb_default_off_v6", "true");
  }
  if (localStorage.getItem("thinker_visual_defaults_v1") !== "true") {
    localStorage.setItem("thinkerBanner", "true");
    localStorage.setItem("recentForm", "true");
    localStorage.setItem("thinker_visual_defaults_v1", "true");
  }

  // --- CONFIGURAÃ‡Ã•ES PADRÃƒO (AUTO RUN DELAY) ---
  const DEFAULT_MIN_DELAY = 0.5,
    DEFAULT_MAX_DELAY = 2.0,
    DEFAULT_DELAY_MODE = "random";

  // --- CONFIGURAÃ‡Ã•ES DO AUTO ADJUST RATING ---
  const AUTO_ADJUST_N = 5,
    AUTO_ADJUST_MIN_ELO = 800,
    AUTO_ADJUST_MAX_ELO = 3200,
    AUTO_ADJUST_STEP = 100,
    AUTO_ADJUST_OPPONENT_DELTA = 100;

  class AutoAdjustRating {
    constructor(baseElo, storage = localStorage) {
      this._storage = storage;
      this._baseElo = baseElo;
      this._currentDifficulty = baseElo;
      this._history = [];
      // Restaurar estado persistido
      this._enabled = this._storage.getItem("kb-auto-adjust") === "true";
      if (this._enabled) {
        this._currentDifficulty = this._loadDifficulty();
        this._history = this._loadHistory();
      }
    }

    _loadHistory() {
      try {
        const data = JSON.parse(
          this._storage.getItem("kb-auto-adjust-history"),
        );
        return Array.isArray(data) ? data : [];
      } catch {
        return [];
      }
    }

    _saveHistory() {
      this._storage.setItem(
        "kb-auto-adjust-history",
        JSON.stringify(this._history),
      );
    }

    _loadDifficulty() {
      const val = parseInt(this._storage.getItem("kb-auto-adjust-elo"), 10);
      return !isNaN(val) &&
        val >= AUTO_ADJUST_MIN_ELO &&
        val <= AUTO_ADJUST_MAX_ELO
        ? val
        : this._baseElo;
    }

    _saveDifficulty() {
      this._storage.setItem(
        "kb-auto-adjust-elo",
        this._currentDifficulty.toString(),
      );
    }

    enable() {
      this._enabled = true;
      this._currentDifficulty = this._baseElo;
      this._history = [];
      this._saveHistory();
      this._saveDifficulty();
      this._storage.setItem("kb-auto-adjust", "true");
    }

    disable() {
      this._enabled = false;
      this._storage.setItem("kb-auto-adjust", "false");
    }

    isEnabled() {
      return this._enabled;
    }

    recordResult(result) {
      if (!this._enabled) return;
      if (result !== "W" && result !== "L") return;
      this._history.push(result);
      if (this._history.length > AUTO_ADJUST_N) {
        this._history.shift();
      }
      this._saveHistory();
      this._adjustDifficulty();
    }

    _adjustDifficulty() {
      if (this._history.length < AUTO_ADJUST_N) return;
      const wins = this._history.filter((r) => r === "W").length;
      if (wins > AUTO_ADJUST_N / 2) {
        this._currentDifficulty = Math.min(
          this._currentDifficulty + AUTO_ADJUST_STEP,
          AUTO_ADJUST_MAX_ELO,
        );
      } else if (AUTO_ADJUST_N - wins > AUTO_ADJUST_N / 2) {
        this._currentDifficulty = Math.max(
          this._currentDifficulty - AUTO_ADJUST_STEP,
          AUTO_ADJUST_MIN_ELO,
        );
      }
      this._saveDifficulty();
    }

    getCurrentDifficulty() {
      return this._currentDifficulty;
    }

    updateBaseElo(newBase) {
      this._baseElo = newBase;
    }

    setOpponentRating(opponentRating) {
      if (!this._enabled) return;
      this._currentDifficulty = Math.max(
        AUTO_ADJUST_MIN_ELO,
        Math.min(
          opponentRating + AUTO_ADJUST_OPPONENT_DELTA,
          AUTO_ADJUST_MAX_ELO,
        ),
      );
      this._saveDifficulty();
    }

    resetToBase() {
      this._currentDifficulty = this._baseElo;
      this._saveDifficulty();
    }
  }

  const AUTO_ADJUST_TOP_PLAYER_SELECTOR = "#board-layout-player-top, #board-layout-main .board-layout-player.board-layout-top, #board-layout-main .player-top-component, #board-layout-main .player-component.player-top, #board-layout-main .player-row-top, #board-layout-main .player-row-component.player-row-top, #board-layout-main [data-cy='player-top'], #board-layout-main [data-player='top']";
  const AUTO_ADJUST_RATING_SELECTOR = "[data-rating], [data-user-rating], [data-cy*='rating'], [data-testid*='rating'], [data-test-element*='rating'], [class*='rating']";

  function parseOpponentRating(value) {
    if (typeof value !== "string") return null;
    const text = value.trim();
    if (!text) return null;
    const matches = [
      ...text.matchAll(/\((\d{3,4})\)/g),
      ...text.matchAll(/(?<![\w:])(\d{3,4})(?![\w:]|%)/g),
    ];
    for (const match of matches) {
      const rating = Number.parseInt(match[1], 10);
      if (
        Number.isInteger(rating) &&
        rating >= AUTO_ADJUST_MIN_ELO &&
        rating <= AUTO_ADJUST_MAX_ELO
      ) {
        return rating;
      }
    }
    return null;
  }

  function ratingFromElement(element) {
    if (!element) return null;
    const values = [
      element.getAttribute?.("data-rating"),
      element.getAttribute?.("data-user-rating"),
      element.getAttribute?.("aria-label"),
      element.getAttribute?.("title"),
      element.innerText,
      element.textContent,
    ];
    for (const value of values) {
      const rating = parseOpponentRating(value);
      if (rating !== null) return rating;
    }
    return null;
  }

  function ratingFromPlayerContainer(container) {
    if (!container) return null;
    const ratingNodes = container.matches?.(AUTO_ADJUST_RATING_SELECTOR)
      ? [container]
      : Array.from(container.querySelectorAll?.(AUTO_ADJUST_RATING_SELECTOR) || []);
    for (const node of ratingNodes) {
      const rating = ratingFromElement(node);
      if (rating !== null) return rating;
    }
    return ratingFromElement(container);
  }

  function getOpponentRating() {
    const opponentElement = OpponentIntel.getOpponentElement();
    const scopedContainers = [];
    const explicitContainer = opponentElement?.closest?.(
      AUTO_ADJUST_TOP_PLAYER_SELECTOR,
    );
    if (explicitContainer) scopedContainers.push(explicitContainer);
    if (opponentElement && !scopedContainers.includes(opponentElement)) {
      scopedContainers.push(opponentElement);
      let ancestor = opponentElement.parentElement;
      for (let depth = 0; ancestor && depth < 4; depth += 1) {
        scopedContainers.push(ancestor);
        ancestor = ancestor.parentElement;
      }
    }
    for (const container of document.querySelectorAll(
      AUTO_ADJUST_TOP_PLAYER_SELECTOR,
    )) {
      if (!scopedContainers.includes(container)) scopedContainers.push(container);
    }
    for (const container of scopedContainers) {
      const rating = ratingFromPlayerContainer(container);
      if (rating !== null) return rating;
    }
    return null;
  }

  function refreshAutoAdjustOpponentRating() {
    if (!isLegacyAutoAdjustEffective()) return null;
    const opponentRating = getOpponentRating();
    if (opponentRating === null) {
      autoAdjust.resetToBase();
      return null;
    }
    autoAdjust.setOpponentRating(opponentRating);
    return opponentRating;
  }

  let can_interval = true,
    auto_move = false,
    auto_queue = localStorage.getItem("kb-auto-queue") === "true",
    current_color =
      (typeof GM_getValue !== "undefined" ? GM_getValue("kb_color") : null) ||
      localStorage.getItem("kb_color") ||
      "#10B981",
    fen,
    checkfen,
    hint = false,
    moveCache = new Map(),
    auto_queue_observer = null,
    auto_queue_clicking = false,
    gameMode = "play",
    puzzleHint = false,
    puzzleAutoMove = false,
    puzzleFenCache = "",
    puzzleMoveCache = new Map();

  let masterStatusKnown = false;

  function isMasterEnabled() {
    return masterStatusKnown && hint === true;
  }

  function setMasterEnabled(enabled, notifyFailure = true) {
    masterStatusKnown = true;
    hint = enabled === true;
    checkfen = "";
    if (!hint) $(".myhigh, .myarrow").remove();
    sessionControlBridge.masterStatusChanged(hint).catch((error) => {
      const code = error && error.code ? error.code : "MASTER_STOP_FAILED";
      sessionControlBridge.setWarning(code);
      if (notifyFailure) notifySessionControl(code);
      debug("error", "[Session Control] Master status transition failed", error);
    });
    if (typeof window.krypbotUpdateUI === "function") window.krypbotUpdateUI();
    if (window.krypbotSessionControlUI && typeof window.krypbotSessionControlUI.update === "function") window.krypbotSessionControlUI.update();
    return hint;
  }

  Object.defineProperty(window, "krypbotSetMasterEnabled", { configurable: false, enumerable: false, writable: false, value: setMasterEnabled });

  let mySession = { wins: 0, losses: 0, draws: 0, streak: 0, streakType: null };
  let recentFormEnabled = localStorage.getItem("recentForm") !== "false";

  const SCOUT_CACHE_TTL = 20 * 60 * 1000;
  const SCOUT_RESULT_COLORS = Object.freeze({ win: "#22d36b", draw: "#e1e4ea", loss: "#64748b" });
  const SCOUT_DRAW_RESULTS = new Set([
    "agreed",
    "repetition",
    "stalemate",
    "insufficient",
    "50move",
    "timevsinsufficient",
    "draw",
  ]);
  const SCOUT_LOSS_RESULTS = new Set([
    "checkmated",
    "timeout",
    "resigned",
    "lose",
    "abandoned",
    "kingofthehill",
    "threecheck",
    "bughousepartnerlose",
  ]);
  const SCOUT_INVALID_USERNAMES = new Set([
    "adversario",
    "oponente",
    "opponent",
    "aguardando",
    "waiting",
    "searching",
    "procurando",
    "jogador",
    "player",
    "convidado",
    "guest",
    "computador",
    "computer",
  ]);

  const OpponentIntel = {
    lastOpponent: null,
    currentEntry: null,
    requestVersion: 0,
    requestController: null,
    retryTimer: null,
    retryCount: 0,
    observer: null,
    checkTimer: null,
    freshnessInterval: null,

    normalizeUsername(value) {
      return String(value || "").trim().toLowerCase();
    },

    cacheKey(username) {
      return `tc_scout_${this.normalizeUsername(username)}`;
    },

    isPlainObject(value) {
      return value !== null && typeof value === "object" && !Array.isArray(value);
    },

    hasExactKeys(value, expected) {
      if (!this.isPlainObject(value)) return false;
      const keys = Object.keys(value).sort();
      return (
        keys.length === expected.length &&
        expected.slice().sort().every((key, index) => key === keys[index])
      );
    },

    isIntegerInRange(value, min, max) {
      return Number.isInteger(value) && value >= min && value <= max;
    },

    isValidOpening(value, sampleSize) {
      return (
        this.hasExactKeys(value, ["name", "count"]) &&
        typeof value.name === "string" &&
        value.name.trim().length > 0 &&
        value.name.length <= 160 &&
        this.isIntegerInRange(value.count, 1, sampleSize)
      );
    },

    isValidRecord(value, sampleSize) {
      return (
        this.hasExactKeys(value, ["games", "wins", "draws", "losses", "winRate", "scoreRate"]) &&
        this.isIntegerInRange(value.games, 0, sampleSize) &&
        this.isIntegerInRange(value.wins, 0, value.games) &&
        this.isIntegerInRange(value.draws, 0, value.games) &&
        this.isIntegerInRange(value.losses, 0, value.games) &&
        value.wins + value.draws + value.losses === value.games &&
        this.isIntegerInRange(value.winRate, 0, 100) &&
        this.isIntegerInRange(value.scoreRate, 0, 100) &&
        value.winRate === (value.games ? Math.round((value.wins / value.games) * 100) : 0) &&
        value.scoreRate ===
          (value.games ? Math.round(((value.wins + value.draws * 0.5) / value.games) * 100) : 0)
      );
    },

    isValidCacheEntry(entry, username) {
      const normalized = this.normalizeUsername(username);
      const now = Date.now();
      if (!this.hasExactKeys(entry, ["timestamp", "username", "hudStats", "scoutStats"])) {
        return false;
      }
      if (
        !Number.isFinite(entry.timestamp) ||
        entry.timestamp <= 0 ||
        entry.timestamp > now ||
        now - entry.timestamp > SCOUT_CACHE_TTL ||
        new Date(entry.timestamp).getUTCFullYear() !== new Date(now).getUTCFullYear() ||
        new Date(entry.timestamp).getUTCMonth() !== new Date(now).getUTCMonth() ||
        entry.username !== normalized
      ) {
        return false;
      }

      const hud = entry.hudStats;
      if (!this.hasExactKeys(hud, ["wins", "draws", "losses", "total", "streak"])) {
        return false;
      }
      if (
        !this.isIntegerInRange(hud.wins, 0, 10) ||
        !this.isIntegerInRange(hud.draws, 0, 10) ||
        !this.isIntegerInRange(hud.losses, 0, 10) ||
        !this.isIntegerInRange(hud.total, 1, 10) ||
        hud.wins + hud.draws + hud.losses !== hud.total ||
        !this.hasExactKeys(hud.streak, ["type", "count"]) ||
        !["W", "D", "L"].includes(hud.streak.type) ||
        !this.isIntegerInRange(hud.streak.count, 1, 10)
      ) {
        return false;
      }

      const scout = entry.scoutStats;
      if (
        !this.hasExactKeys(scout, [
          "sampleSize",
          "wins",
          "draws",
          "losses",
          "winRate",
          "scoreRate",
          "rating",
          "momentum",
          "colors",
          "timeClasses",
          "lossPattern",
          "openings",
          "lastPlayed",
        ])
      ) {
        return false;
      }
      const streakResultCount =
        hud.streak.type === "W"
          ? hud.wins
          : hud.streak.type === "D"
            ? hud.draws
            : hud.losses;
      if (
        !this.isIntegerInRange(scout.sampleSize, 1, 50) ||
        !this.isIntegerInRange(scout.wins, 0, scout.sampleSize) ||
        !this.isIntegerInRange(scout.draws, 0, scout.sampleSize) ||
        !this.isIntegerInRange(scout.losses, 0, scout.sampleSize) ||
        scout.wins + scout.draws + scout.losses !== scout.sampleSize ||
        !this.isIntegerInRange(scout.winRate, 0, 100) ||
        scout.winRate !== Math.round((scout.wins / scout.sampleSize) * 100) ||
        !this.isIntegerInRange(scout.scoreRate, 0, 100) ||
        scout.scoreRate !==
          Math.round(((scout.wins + scout.draws * 0.5) / scout.sampleSize) * 100) ||
        hud.total !== Math.min(10, scout.sampleSize) ||
        hud.streak.count > streakResultCount ||
        hud.wins > scout.wins ||
        scout.wins > hud.wins + scout.sampleSize - hud.total ||
        !this.hasExactKeys(scout.colors, ["white", "black"]) ||
        !this.isValidRecord(scout.colors.white, scout.sampleSize) ||
        !this.isValidRecord(scout.colors.black, scout.sampleSize) ||
        scout.colors.white.games + scout.colors.black.games !== scout.sampleSize ||
        scout.colors.white.wins + scout.colors.black.wins !== scout.wins ||
        scout.colors.white.draws + scout.colors.black.draws !== scout.draws ||
        scout.colors.white.losses + scout.colors.black.losses !== scout.losses ||
        !this.hasExactKeys(scout.openings, ["white", "black"]) ||
        !Array.isArray(scout.openings.white) ||
        !Array.isArray(scout.openings.black) ||
        scout.openings.white.length > 2 ||
        scout.openings.black.length > 2 ||
        !scout.openings.white.every((opening) =>
          this.isValidOpening(opening, scout.colors.white.games),
        ) ||
        !scout.openings.black.every((opening) =>
          this.isValidOpening(opening, scout.colors.black.games),
        ) ||
        scout.openings.white.reduce((total, opening) => total + opening.count, 0) >
          scout.colors.white.games ||
        scout.openings.black.reduce((total, opening) => total + opening.count, 0) >
          scout.colors.black.games ||
        new Set(scout.openings.white.map((opening) => opening.name)).size !==
          scout.openings.white.length ||
        new Set(scout.openings.black.map((opening) => opening.name)).size !==
          scout.openings.black.length ||
        !Array.isArray(scout.timeClasses) ||
        scout.timeClasses.length < 1 ||
        scout.timeClasses.length > 4 ||
        scout.timeClasses.some(
          (item) =>
            !this.hasExactKeys(item, ["name", "games", "wins", "winRate"]) ||
            !["bullet", "blitz", "rapid", "daily", "other"].includes(item.name) ||
            !this.isIntegerInRange(item.games, 1, scout.sampleSize) ||
            !this.isIntegerInRange(item.wins, 0, item.games) ||
            item.winRate !== Math.round((item.wins / item.games) * 100),
        ) ||
        new Set(scout.timeClasses.map((item) => item.name)).size !== scout.timeClasses.length ||
        scout.timeClasses.reduce((total, item) => total + item.games, 0) !== scout.sampleSize ||
        scout.timeClasses.reduce((total, item) => total + item.wins, 0) !== scout.wins ||
        !this.hasExactKeys(scout.rating, ["latest", "average", "change"]) ||
        (scout.rating.latest !== null && !this.isIntegerInRange(scout.rating.latest, 1, 9999)) ||
        (scout.rating.average !== null && !this.isIntegerInRange(scout.rating.average, 1, 9999)) ||
        (scout.rating.change !== null && !this.isIntegerInRange(scout.rating.change, -9998, 9998)) ||
        ((scout.rating.latest === null || scout.rating.average === null) &&
          !(scout.rating.latest === null &&
            scout.rating.average === null &&
            scout.rating.change === null)) ||
        !this.hasExactKeys(scout.momentum, ["recentScoreRate", "previousScoreRate", "delta"]) ||
        !this.isIntegerInRange(scout.momentum.recentScoreRate, 0, 100) ||
        (scout.momentum.previousScoreRate !== null &&
          !this.isIntegerInRange(scout.momentum.previousScoreRate, 0, 100)) ||
        (scout.momentum.delta !== null &&
          !this.isIntegerInRange(scout.momentum.delta, -100, 100)) ||
        ((scout.momentum.previousScoreRate === null) !== (scout.momentum.delta === null)) ||
        (scout.momentum.delta !== null &&
          scout.momentum.delta !==
            scout.momentum.recentScoreRate - scout.momentum.previousScoreRate) ||
        (scout.lossPattern !== null &&
          (!this.hasExactKeys(scout.lossPattern, ["reason", "count"]) ||
            typeof scout.lossPattern.reason !== "string" ||
            !this.isIntegerInRange(scout.lossPattern.count, 1, scout.losses))) ||
        !Number.isInteger(scout.lastPlayed) ||
        scout.lastPlayed <= 0 ||
        scout.lastPlayed < Date.UTC(new Date(now).getUTCFullYear(), new Date(now).getUTCMonth() - 2, 1) / 1000 ||
        scout.lastPlayed > Math.floor(entry.timestamp / 1000)
      ) {
        return false;
      }
      return true;
    },

    invalidateCache(username) {
      try {
        localStorage.removeItem(this.cacheKey(username));
      } catch (e) {}
    },

    readCache(username) {
      const normalized = this.normalizeUsername(username);
      try {
        const raw = localStorage.getItem(this.cacheKey(normalized));
        if (!raw) return null;
        const entry = JSON.parse(raw);
        if (!this.isValidCacheEntry(entry, normalized)) {
          this.invalidateCache(normalized);
          return null;
        }
        return entry;
      } catch (e) {
        this.invalidateCache(normalized);
        return null;
      }
    },

    writeCache(entry) {
      if (!this.isValidCacheEntry(entry, entry && entry.username)) return;
      try {
        localStorage.setItem(this.cacheKey(entry.username), JSON.stringify(entry));
      } catch (e) {}
    },

    classifyGame(game, username) {
      if (!this.isPlainObject(game) || !this.isPlainObject(game.white) || !this.isPlainObject(game.black)) {
        return null;
      }
      const white = this.normalizeUsername(game.white.username);
      const black = this.normalizeUsername(game.black.username);
      let player;
      let opponent;
      let color;
      if (white === username) {
        player = game.white;
        opponent = game.black;
        color = "white";
      } else if (black === username) {
        player = game.black;
        opponent = game.white;
        color = "black";
      } else {
        return null;
      }

      const rawResult = String(player.result || "").toLowerCase();
      let result = null;
      if (rawResult === "win") result = "W";
      else if (SCOUT_DRAW_RESULTS.has(rawResult)) result = "D";
      else if (SCOUT_LOSS_RESULTS.has(rawResult)) result = "L";
      if (!result || !Number.isInteger(game.end_time) || game.end_time <= 0) return null;
      return {
        result,
        color,
        opening: this.extractOpening(game),
        timestamp: game.end_time,
        rating: Number.isInteger(player.rating) && player.rating > 0 ? player.rating : null,
        opponentRating:
          Number.isInteger(opponent.rating) && opponent.rating > 0 ? opponent.rating : null,
        timeClass: ["bullet", "blitz", "rapid", "daily"].includes(game.time_class)
          ? game.time_class
          : "other",
        lossReason: result === "L" ? rawResult : null,
      };
    },

    cleanOpeningName(value) {
      return String(value || "")
        .replace(/[-_]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 160);
    },

    extractOpening(game) {
      const pgn = typeof game.pgn === "string" ? game.pgn : "";
      const openingTag = pgn.match(/\[Opening\s+"([^"]+)"\]/i);
      if (openingTag) return this.cleanOpeningName(openingTag[1]);

      const ecoUrl = pgn.match(
        /\[ECOUrl\s+"https?:\/\/(?:www\.)?chess\.com\/openings\/([^"?#]+)(?:[?#][^"]*)?"\]/i,
      );
      const gameEcoUrl =
        typeof game.eco === "string"
          ? game.eco.match(/^https?:\/\/(?:www\.)?chess\.com\/openings\/([^?#]+)/i)
          : null;
      const trustedOpeningPath = ecoUrl?.[1] || gameEcoUrl?.[1];
      if (trustedOpeningPath) {
        try {
          return this.cleanOpeningName(decodeURIComponent(trustedOpeningPath));
        } catch (e) {
          return this.cleanOpeningName(trustedOpeningPath);
        }
      }
      return null;
    },

    favoriteOpenings(games, color, limit = 2) {
      const counts = new Map();
      games
        .filter((game) => game.color === color && game.opening)
        .forEach((game) => {
          counts.set(game.opening, (counts.get(game.opening) || 0) + 1);
        });
      if (!counts.size) return null;
      return [...counts.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, limit)
        .map(([name, count]) => ({ name, count }));
    },

    summarizeResults(games) {
      const total = games.length;
      const wins = games.filter((game) => game.result === "W").length;
      const draws = games.filter((game) => game.result === "D").length;
      const losses = games.filter((game) => game.result === "L").length;
      return {
        games: total,
        wins,
        draws,
        losses,
        winRate: total ? Math.round((wins / total) * 100) : 0,
        scoreRate: total ? Math.round(((wins + draws * 0.5) / total) * 100) : 0,
      };
    },

    summarizeTimeClasses(games) {
      const groups = new Map();
      games.forEach((game) => {
        if (!groups.has(game.timeClass)) groups.set(game.timeClass, []);
        groups.get(game.timeClass).push(game);
      });
      return [...groups.entries()]
        .map(([name, values]) => ({
          name,
          games: values.length,
          wins: this.summarizeResults(values).wins,
          winRate: this.summarizeResults(values).winRate,
        }))
        .sort((a, b) => b.games - a.games || a.name.localeCompare(b.name));
    },

    summarizeRating(games) {
      const ratings = games.filter((game) => Number.isInteger(game.rating));
      if (!ratings.length) return { latest: null, average: null, change: null };
      return {
        latest: ratings[0].rating,
        average: Math.round(
          ratings.reduce((total, game) => total + game.rating, 0) / ratings.length,
        ),
        change: ratings.length > 1 ? ratings[0].rating - ratings[ratings.length - 1].rating : 0,
      };
    },

    summarizeMomentum(games) {
      const recent = games.slice(0, Math.min(10, games.length));
      const previous = games.slice(10, 20);
      const recentScoreRate = this.summarizeResults(recent).scoreRate;
      if (!previous.length) {
        return { recentScoreRate, previousScoreRate: null, delta: null };
      }
      const previousScoreRate = this.summarizeResults(previous).scoreRate;
      return {
        recentScoreRate,
        previousScoreRate,
        delta: recentScoreRate - previousScoreRate,
      };
    },

    summarizeLossPattern(games) {
      const counts = new Map();
      games
        .filter((game) => game.result === "L" && game.lossReason)
        .forEach((game) => {
          counts.set(game.lossReason, (counts.get(game.lossReason) || 0) + 1);
        });
      if (!counts.size) return null;
      const [reason, count] = [...counts.entries()].sort(
        (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
      )[0];
      return { reason, count };
    },

    processGames(games, username) {
      const normalized = this.normalizeUsername(username);
      if (!Array.isArray(games) || !normalized) return null;
      const now = new Date();
      const currentTime = Math.floor(now.getTime() / 1000);
      const earliestMonth = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 2, 1) / 1000;
      const recent = games
        .filter((game) =>
          this.isPlainObject(game) &&
          Number.isInteger(game.end_time) &&
          game.end_time >= earliestMonth &&
          game.end_time <= currentTime &&
          (this.normalizeUsername(game.white?.username) === normalized ||
            this.normalizeUsername(game.black?.username) === normalized),
        )
        .sort((a, b) => b.end_time - a.end_time)
        .slice(0, 50)
        .map((game) => this.classifyGame(game, normalized))
        .filter(Boolean);
      if (!recent.length) return null;

      const hudGames = recent.slice(0, 10);
      const streakType = hudGames[0].result;
      let streakCount = 0;
      for (const game of hudGames) {
        if (game.result !== streakType) break;
        streakCount++;
      }

      const summary = this.summarizeResults(recent);
      return {
        timestamp: Date.now(),
        username: normalized,
        hudStats: {
          wins: hudGames.filter((game) => game.result === "W").length,
          draws: hudGames.filter((game) => game.result === "D").length,
          losses: hudGames.filter((game) => game.result === "L").length,
          total: hudGames.length,
          streak: { type: streakType, count: streakCount },
        },
        scoutStats: {
          sampleSize: recent.length,
          wins: summary.wins,
          draws: summary.draws,
          losses: summary.losses,
          winRate: summary.winRate,
          scoreRate: summary.scoreRate,
          rating: this.summarizeRating(recent),
          momentum: this.summarizeMomentum(recent),
          colors: {
            white: this.summarizeResults(recent.filter((game) => game.color === "white")),
            black: this.summarizeResults(recent.filter((game) => game.color === "black")),
          },
          timeClasses: this.summarizeTimeClasses(recent),
          lossPattern: this.summarizeLossPattern(recent),
          openings: {
            white: this.favoriteOpenings(recent, "white") || [],
            black: this.favoriteOpenings(recent, "black") || [],
          },
          lastPlayed: recent[0].timestamp,
        },
      };
    },

    getCurrentMonthUrl(username, monthOffset = 0) {
      const now = new Date();
      const archiveMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthOffset, 1));
      const year = archiveMonth.getUTCFullYear();
      const month = String(archiveMonth.getUTCMonth() + 1).padStart(2, "0");
      return `https://api.chess.com/pub/player/${encodeURIComponent(username)}/games/${year}/${month}`;
    },

    createMonthlyRequest(url) {
      const controller = new AbortController();
      let handle = null;
      const timeout = setTimeout(() => controller.abort(), 12000);
      const promise = fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: "omit",
        cache: "no-store",
        signal: controller.signal,
      })
        .then((response) => {
          if (!response.ok) {
            const error = new Error("scout-request-failed");
            error.status = response.status;
            throw error;
          }
          return response.json();
        })
        .catch((error) => {
          if (controller.signal.aborted || typeof GM_xmlhttpRequest !== "function") throw error;
          return new Promise((resolve, reject) => {
            try {
              handle = GM_xmlhttpRequest({
                method: "GET",
                url,
                headers: { Accept: "application/json" },
                timeout: 12000,
                onload: (response) => {
                  if (response.status < 200 || response.status >= 300) {
                    const error = new Error("scout-request-failed");
                    error.status = response.status;
                    reject(error);
                    return;
                  }
                  try { resolve(JSON.parse(response.responseText)); }
                  catch (_) { reject(new Error("scout-json-invalid")); }
                },
                onerror: () => reject(new Error("scout-network-failed")),
                ontimeout: () => reject(new Error("scout-request-timeout")),
                onabort: () => reject(new Error("scout-request-aborted")),
              });
            } catch (requestError) { reject(requestError); }
          });
        })
        .finally(() => clearTimeout(timeout));
      return {
        promise,
        abort() {
          controller.abort();
          if (handle && typeof handle.abort === "function") handle.abort();
        },
      };
    },

    clearRetry() {
      if (this.retryTimer) {
        clearTimeout(this.retryTimer);
        this.retryTimer = null;
      }
    },

    scheduleRetry(username) {
      this.clearRetry();
      if (this.retryCount >= 2) return;
      this.retryCount++;
      this.retryTimer = setTimeout(() => {
        this.retryTimer = null;
        if (
          username === this.lastOpponent &&
          !this.currentEntry &&
          !this.requestController &&
          username === this.getOpponentUsername()
        ) {
          this.fetchData(username);
        }
      }, this.retryCount === 1 ? 5000 : 15000);
    },

    async fetchData(username) {
      const normalized = this.normalizeUsername(username);
      if (!normalized) return;
      const requestId = ++this.requestVersion;
      if (this.requestController) {
        this.requestController.abort();
        this.requestController = null;
      }
      const cached = this.readCache(normalized);
      if (cached) {
        if (
          requestId === this.requestVersion &&
          normalized === this.lastOpponent &&
          normalized === this.getOpponentUsername()
        ) {
          this.clearRetry();
          this.retryCount = 0;
          this.renderEntry(cached);
        }
        return;
      }

      this.renderLoading();
      try {
        const games = [];
        const seenUrls = new Set();
        for (let monthOffset = 0; monthOffset < 3 && games.length < 50; monthOffset++) {
          const request = this.createMonthlyRequest(this.getCurrentMonthUrl(normalized, monthOffset));
          this.requestController = request;
          let payload;
          try {
            payload = await request.promise;
          } catch (error) {
            if (error.status === 404 || error.status === 410) continue;
            throw error;
          } finally {
            if (this.requestController === request) this.requestController = null;
          }
          if (requestId !== this.requestVersion || normalized !== this.lastOpponent) return;
          if (!Array.isArray(payload?.games)) throw new Error("scout-data-invalid");
          for (const game of payload.games) {
            const url = typeof game?.url === "string" ? game.url : "";
            if (url && seenUrls.has(url)) continue;
            if (url) seenUrls.add(url);
            games.push(game);
          }
        }
        const entry = this.processGames(games, normalized);
        if (!entry || !this.isValidCacheEntry(entry, normalized)) {
          throw new Error("scout-data-invalid");
        }
        if (
          requestId !== this.requestVersion ||
          normalized !== this.lastOpponent ||
          normalized !== this.getOpponentUsername()
        )
          return;
        this.clearRetry();
        this.retryCount = 0;
        this.writeCache(entry);
        this.renderEntry(entry);
      } catch (e) {
        if (requestId === this.requestVersion && normalized === this.lastOpponent) {
          this.currentEntry = null;
          this.hide();
          this.renderStatus("unavailable");
          this.scheduleRetry(normalized);
        }
      } finally {
        if (requestId === this.requestVersion) this.requestController = null;
      }
    },

    escapeHtml(value) {
      return String(value || "")
        .replace(/&/g, "\u0026amp;")
        .replace(/</g, "\u0026lt;")
        .replace(/>/g, "\u0026gt;")
        .replace(/"/g, "\u0026quot;")
        .replace(/'/g, "\u0026#039;");
    },

    ensureScoutWrapper() {
      const container = document.getElementById("krypbot-container");
      if (!container || !document.body) return null;
      let wrapper = document.getElementById("oi-wrapper");
      if (!wrapper) {
        wrapper = document.createElement("div");
        wrapper.id = "oi-wrapper";
      }
      if (container.parentNode !== wrapper) wrapper.appendChild(container);
      if (wrapper.parentNode !== document.body || wrapper.nextSibling) document.body.appendChild(wrapper);
      container.style.width = "292px";
      container.style.maxWidth = "292px";
      container.style.margin = "0";
      container.style.boxSizing = "border-box";
      return { container, wrapper };
    },

    mountScoutPanel(layout, panel) {
      const grid = layout.container.querySelector(".kb-console-grid");
      panel.classList.add("kb-scout-module");
      (grid || layout.wrapper).appendChild(panel);
    },

    renderStatus(state) {
      const layout = this.ensureScoutWrapper();
      if (!layout) return;
      const existing = document.getElementById("oi-zone2");
      if (existing) existing.remove();
      const panel = document.createElement("section");
      panel.id = "oi-zone2";
      panel.className = "tc-workspace-card";
      panel.dataset.state = state;
      panel.style.cssText =
        "width:292px;box-sizing:border-box;background:rgba(20,20,25,.65);border:1px solid rgba(255,255,255,.08);border-radius:18px;box-shadow:0 24px 64px rgba(0,0,0,.48);padding:14px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#fff;margin:0;display:flex;flex-direction:column;";
      const title = state === "waiting" ? "Waiting for opponent" : "History unavailable";
      const detail = state === "waiting"
        ? "Public data appears after an opponent is identified."
        : "Public games are unavailable right now. Scout will retry automatically.";
      panel.innerHTML = `
        <div class="tc-scout-head" style="display:flex;align-items:center;justify-content:space-between;gap:12px;min-width:0;padding-bottom:12px;border-bottom:1px solid #26282e">
          <div class="tc-scout-title">Opponent Scout</div>
        </div>
        <div class="tc-scout-empty" style="display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:8px;min-width:0;padding:18px 0 2px;text-align:left">
          <span class="tc-scout-status" style="display:inline-block;max-width:100%;padding:5px 8px;border:1px solid #303640;border-radius:999px;color:#c6cbd4;font-size:11px;line-height:1.3">${state === "waiting" ? '<span class="tc-scout-status-dot" aria-hidden="true"></span>' : ""}<span class="tc-scout-status-text">${title}</span></span>
          <p class="tc-scout-empty-detail" style="margin:0;max-width:100%;color:#9da3b2;font-size:11px;line-height:1.5;white-space:normal;overflow-wrap:anywhere">${detail}</p>
        </div>`;
      if (state === "unavailable" && this.lastOpponent) {
        const retry = document.createElement("button");
        retry.type = "button";
        retry.textContent = "Try again";
        retry.className = "tc-scout-retry";
        retry.addEventListener("click", () => this.fetchData(this.lastOpponent));
        panel.querySelector(".tc-scout-empty")?.appendChild(retry);
      }
      if ((typeof _ghostModeActive !== "undefined" && _ghostModeActive) || layout.container.classList.contains("minimized")) panel.style.display = "none";
      this.mountScoutPanel(layout, panel);
    },

    renderLoading() {
      this.renderHUD({
        wins: "–",
        draws: "–",
        losses: "–",
        streak: { type: "D", count: 0 },
      });
      const layout = this.ensureScoutWrapper();
      if (!layout) return;
      const previous = document.getElementById("oi-zone2");
      if (previous) previous.remove();
      const panel = document.createElement("section");
      panel.id = "oi-zone2";
      panel.className = "tc-workspace-card";
      panel.dataset.state = "loading";
      panel.style.cssText =
        "width:292px;min-height:260px;box-sizing:border-box;background:rgba(20,20,25,.65);border:1px solid rgba(255,255,255,.08);border-radius:18px;box-shadow:0 24px 64px rgba(0,0,0,.48);padding:14px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#fff;display:flex;flex-direction:column;gap:12px;margin:0;";
      panel.innerHTML = `
        <div class="tc-scout-head">
          <div>
            <div class="tc-scout-title">Opponent Scout</div>
            <div class="tc-scout-subtitle">Loading recent history…</div>
          </div>
        </div>
        <div class="tc-scout-loading">
          <div class="tc-scout-radar" aria-hidden="true"><span class="tc-scout-radar-dot"></span></div>
          <div class="tc-scout-skeleton" aria-hidden="true"></div>
          <div class="tc-scout-skeleton" aria-hidden="true"></div>
        </div>`;
      if ((typeof _ghostModeActive !== "undefined" && _ghostModeActive) || layout.container.classList.contains("minimized")) panel.style.display = "none";
      this.mountScoutPanel(layout, panel);
    },

    hide() {
      document.querySelectorAll(".tc-hud-stats").forEach((element) => element.remove());
      const panel = document.getElementById("oi-zone2");
      if (panel) panel.remove();
    },

    renderHUD(hudStats) {
      document.querySelectorAll(".tc-hud-stats").forEach((element) => element.remove());
      if (!recentFormEnabled) return;
      const target = this.getOpponentElement();
      if (!target) return;

      const hud = document.createElement("span");
      hud.className = "tc-hud-stats";
      hud.dataset.username = this.lastOpponent || "";
      hud.style.cssText =
        "display:inline-flex;align-items:center;gap:5px;margin-left:8px;padding:3px 7px;border-radius:8px;background:rgba(18,18,22,.78);border:1px solid rgba(255,255,255,.09);font:700 10px/1.2 Inter,sans-serif;white-space:nowrap;vertical-align:middle;box-shadow:0 3px 10px rgba(0,0,0,.24);";

      const streak = hudStats.streak;
      let badge = "";
      if (streak.count >= 3) {
        const badgeStyle =
          streak.type === "W"
            ? "color:#00e68a;background:rgba(0,230,138,.16);border-color:rgba(0,230,138,.28)"
            : streak.type === "L"
              ? "color:#76b7ff;background:rgba(244,67,90,.18);border-color:rgba(118,183,255,.28)"
              : "color:#d1d5db;background:rgba(209,213,219,.12);border-color:rgba(209,213,219,.22)";
        const icon = streak.type === "W" ? "\u{1F525}" : streak.type === "L" ? "\u2744" : "\u2796";
        badge = `<span style="padding:2px 5px;border:1px solid;border-radius:6px;${badgeStyle}">${icon} ${streak.count}${streak.type}</span>`;
      }

      hud.innerHTML = `
        <span style="color:#00e68a">W</span><span style="color:#cbd5e1">${hudStats.wins}</span>
        <span style="color:#596273">/</span>
        <span style="color:#d1d5db">D</span><span style="color:#cbd5e1">${hudStats.draws}</span>
        <span style="color:#596273">/</span>
        <span style="color:#ff6675">L</span><span style="color:#cbd5e1">${hudStats.losses}</span>
        ${badge}`;
      if (typeof _ghostModeActive !== "undefined" && _ghostModeActive) hud.style.display = "none";
      target.insertAdjacentElement("afterend", hud);
    },

    renderOpeningGroup(openings, totalGames, filled) {
      if (!Array.isArray(openings) || !openings.length) {
        return '<div style="padding:8px 0;color:#777e8d;font-size:10px">No openings identified.</div>';
      }
      return openings
        .map(
          (opening) => `
            <div class="tc-scout-opening-row">
              <span class="tc-scout-color-chip ${filled ? "is-filled" : ""}"></span>
              <span class="tc-scout-opening-name" title="${this.escapeHtml(opening.name)}">${this.escapeHtml(opening.name)}</span>
              <span class="tc-scout-opening-count"><b>${opening.count}</b><small>of ${totalGames}</small></span>
            </div>`,
        )
        .join("");
    },

    timeClassLabel(value) {
      return ({ bullet: "Bullet", blitz: "Blitz", rapid: "Rapid", daily: "Daily", other: "Other" })[
        value
      ];
    },

    lossReasonLabel(value) {
      return (
        {
          checkmated: "Checkmate",
          timeout: "Timeout",
          resigned: "Resignation",
          abandoned: "Abandonment",
          repetition: "Repetition",
        }[value] || this.cleanOpeningName(value)
      );
    },

    renderColorRecord(label, record, filled) {
      return `
        <div class="tc-scout-stat-row">
          <span class="tc-scout-color-chip ${filled ? "is-filled" : ""}"></span>
          <span class="tc-scout-stat-copy"><b>${label}</b><small>${record.games} games · ${record.wins}W–${record.draws}D–${record.losses}L</small></span>
          <span class="tc-scout-stat-value"><b>${record.winRate}%</b><small>wins</small></span>
        </div>`;
    },

    renderScout(scoutStats) {
      const layout = this.ensureScoutWrapper();
      if (!layout) {
        const stalePanel = document.getElementById("oi-zone2");
        if (stalePanel) stalePanel.remove();
        return;
      }

      const previous = document.getElementById("oi-zone2");
      if (previous) previous.remove();
      const panel = document.createElement("section");
      panel.id = "oi-zone2";
      panel.className = "tc-workspace-card";
      panel.style.cssText =
        "width:292px;box-sizing:border-box;background:rgba(20,20,25,.65);border:1px solid rgba(255,255,255,.08);border-radius:18px;box-shadow:0 24px 64px rgba(0,0,0,.48);padding:18px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#f7f8fa;display:flex;flex-direction:column;margin:0;";
      const lastPlayedDate = new Date(scoutStats.lastPlayed * 1000);
      const lastPlayed = Number.isNaN(lastPlayedDate.getTime())
        ? "—"
        : lastPlayedDate.toLocaleDateString("en-US", { day: "2-digit", month: "short" }).replace(",", "");
      const winEnd = (scoutStats.wins / scoutStats.sampleSize) * 100;
      const drawEnd = ((scoutStats.wins + scoutStats.draws) / scoutStats.sampleSize) * 100;
      const donutGradient = `conic-gradient(${SCOUT_RESULT_COLORS.win} 0% ${winEnd}%,${SCOUT_RESULT_COLORS.draw} ${winEnd}% ${drawEnd}%,${SCOUT_RESULT_COLORS.loss} ${drawEnd}% 100%)`;
      const timeRows = scoutStats.timeClasses
        .map(
          (item) => `
            <div class="tc-scout-stat-row tc-scout-speed-row">
              <span class="tc-scout-speed-icon" aria-hidden="true"></span>
              <span class="tc-scout-stat-copy"><b>${this.timeClassLabel(item.name)}</b><small>${item.games} of ${scoutStats.sampleSize} games</small></span>
              <span class="tc-scout-stat-value"><b>${item.winRate}%</b><small>wins</small></span>
            </div>`,
        )
        .join("");
      panel.innerHTML = `
        <style>
          #oi-zone2 .tc-scout-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
          #oi-zone2 .tc-scout-title{font-size:10px;line-height:13px;font-weight:700;color:#cfcfcb;letter-spacing:.04em;text-transform:uppercase}
          #oi-zone2 .tc-scout-subtitle{margin-top:2px;color:#777873;font-size:8px;line-height:1.3}
          #oi-zone2 .tc-scout-donut{position:relative;width:64px;height:64px;margin:10px auto 6px;border-radius:50%}
          #oi-zone2 .tc-scout-donut::after{content:"";position:absolute;inset:7px;border-radius:50%;background:#20201e}
          #oi-zone2 .tc-scout-donut-copy{position:absolute;inset:0;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center}
          #oi-zone2 .tc-scout-donut-copy b{font-size:15px;line-height:1;font-weight:800}
          #oi-zone2 .tc-scout-donut-copy small{margin-top:2px;color:#777873;font-size:7px}
          #oi-zone2 .tc-scout-record{text-align:center;color:#8c8c87;font-size:9px;margin:2px 0 7px}
          #oi-zone2 .tc-scout-section{border-top:1px solid #30302e;padding:5px 0}
          #oi-zone2 .tc-scout-section-title{padding:3px 0 5px;color:#8c8c87;font-size:8px;text-transform:uppercase;letter-spacing:.08em}
          #oi-zone2 .tc-scout-stat-row{display:grid;grid-template-columns:11px minmax(0,1fr) 44px;align-items:center;gap:5px;padding:4px 0}
          #oi-zone2 .tc-scout-color-chip{width:9px;height:9px;border:1px solid #747b88;border-radius:2px;box-sizing:border-box}
          #oi-zone2 .tc-scout-color-chip.is-filled{background:#f0f1f3;border-color:#f0f1f3}
          #oi-zone2 .tc-scout-stat-copy{min-width:0;display:flex;flex-direction:column;gap:2px}
          #oi-zone2 .tc-scout-stat-copy b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#d9d9d5;font-size:9px;font-weight:600}
          #oi-zone2 .tc-scout-stat-copy small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#777873;font-size:7px}
          #oi-zone2 .tc-scout-stat-value{display:flex;flex-direction:column;align-items:flex-end;gap:2px}
          #oi-zone2 .tc-scout-stat-value b{color:#46d977;font-size:9px;font-weight:700}
          #oi-zone2 .tc-scout-stat-value small{color:#777873;font-size:7px}
          #oi-zone2 .tc-scout-speed-icon{width:11px;height:14px;background:center/10px 10px no-repeat url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%238d93a1' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M13 2 3 14h9l-1 8 10-12h-9z'/%3E%3C/svg%3E")}
          #oi-zone2 .tc-scout-opening-row{display:grid;grid-template-columns:11px minmax(0,1fr) 25px;align-items:center;gap:5px;padding:4px 0}
          #oi-zone2 .tc-scout-opening-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#d9d9d5;font-size:8px;font-weight:600}
          #oi-zone2 .tc-scout-opening-count{display:flex;flex-direction:column;align-items:flex-end;color:#fff}
          #oi-zone2 .tc-scout-opening-count b{font-size:9px} #oi-zone2 .tc-scout-opening-count small{color:#777873;font-size:7px}
        </style>
        <div class="tc-scout-head">
          <div><div class="tc-scout-title">Opponent Scout</div><div class="tc-scout-subtitle">${this.escapeHtml(this.lastOpponent || "Opponent")} · ${scoutStats.sampleSize} games · through ${lastPlayed}</div></div>
        </div>
        <div class="tc-scout-donut" style="background:${donutGradient}">
          <div class="tc-scout-donut-copy"><b>${scoutStats.winRate}%</b><small>win rate</small></div>
        </div>
        <div class="tc-scout-record"><span class="w" style="color:${SCOUT_RESULT_COLORS.win}">${scoutStats.wins} W</span> · <span class="e" style="color:${SCOUT_RESULT_COLORS.draw}">${scoutStats.draws} D</span> · <span class="l" style="color:${SCOUT_RESULT_COLORS.loss}">${scoutStats.losses} L</span></div>
        <div class="tc-scout-section">
          ${this.renderColorRecord("White", scoutStats.colors.white, true)}
          ${this.renderColorRecord("Black", scoutStats.colors.black, false)}
        </div>
        <div class="tc-scout-section">${timeRows}</div>
        <div class="tc-scout-section">
          <div class="tc-scout-section-title">Most-played openings</div>
          ${this.renderOpeningGroup(scoutStats.openings.white, scoutStats.colors.white.games, true)}
          ${this.renderOpeningGroup(scoutStats.openings.black, scoutStats.colors.black.games, false)}
        </div>
        `;
      if ((typeof _ghostModeActive !== "undefined" && _ghostModeActive) || layout.container.classList.contains("minimized")) panel.style.display = "none";
      this.mountScoutPanel(layout, panel);
    },

    renderEntry(entry) {
      if (!this.isValidCacheEntry(entry, this.lastOpponent)) {
        this.hide();
        return;
      }
      this.currentEntry = entry;
      this.renderHUD(entry.hudStats);
      this.renderScout(entry.scoutStats);
    },

    normalizeCandidateUsername(value) {
      const normalized = this.normalizeUsername(value);
      const comparable = normalized.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (
        !/^[a-z0-9][a-z0-9_-]{1,24}$/i.test(normalized) ||
        SCOUT_INVALID_USERNAMES.has(comparable)
      ) {
        return null;
      }
      return normalized;
    },

    extractUsernameFromElement(element) {
      if (!element) return null;
      const memberLink =
        (element.matches && element.matches("a[href*='/member/']") ? element : null) ||
        (element.querySelector && element.querySelector("a[href*='/member/']"));
      if (memberLink) {
        const href = memberLink.getAttribute("href") || "";
        const match = href.match(/\/member\/([^/?#]+)/i);
        if (match) {
          try {
            const fromHref = this.normalizeCandidateUsername(decodeURIComponent(match[1]));
            if (fromHref) return fromHref;
          } catch (e) {}
        }
      }

      const raw = String(element.textContent || "").replace(/\([^)]*\)/g, " ").trim();
      const comparableRaw = raw
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/\s+/g, " ");
      if (
        /^(waiting for opponent|searching for opponent|procurando adversario|aguardando adversario|aguardando oponente)$/.test(
          comparableRaw,
        )
      ) {
        return null;
      }
      const tokens = raw.split(/\s+/).filter(Boolean);
      const ignoredTitles = new Set([
        "gm",
        "im",
        "fm",
        "cm",
        "nm",
        "wgm",
        "wim",
        "wfm",
        "wcm",
      ]);
      for (const token of tokens) {
        if (ignoredTitles.has(token.toLowerCase()) || /^\d{2,5}$/.test(token)) continue;
        const username = this.normalizeCandidateUsername(token.replace(/[,:|]+$/g, ""));
        if (username) return username;
      }
      return null;
    },

    getBoardElement() {
      const candidates = document.querySelectorAll(
        "wc-chess-board, chess-board, #board-single, .board, .chess-board, [class*='board-component']",
      );
      let best = null;
      let bestArea = 0;
      for (const candidate of candidates) {
        if (typeof candidate.getBoundingClientRect !== "function") continue;
        const rect = candidate.getBoundingClientRect();
        const area = rect.width * rect.height;
        const ratio = rect.height ? rect.width / rect.height : 0;
        if (rect.width >= 240 && rect.height >= 240 && ratio > 0.75 && ratio < 1.25 && area > bestArea) {
          best = candidate;
          bestArea = area;
        }
      }
      return best;
    },

    resolveUsernameNode(element) {
      if (!element) return null;
      if (
        element.matches &&
        element.matches("[class*='username'], [data-cy*='username'], [data-test-element*='username']")
      ) {
        return element;
      }
      return (
        (element.querySelector &&
          element.querySelector(
            "[class*='username'], [data-cy*='username'], [data-test-element*='username'], a[href*='/member/']",
          )) ||
        element
      );
    },

    findPlayerElement(position) {
      const isTop = position === "top";
      const containerSelector = isTop
        ? "#board-layout-player-top, #board-layout-main .board-layout-player.board-layout-top, #board-layout-main .player-top-component, #board-layout-main .player-component.player-top, #board-layout-main .player-row-top, #board-layout-main .player-row-component.player-row-top, #board-layout-main [data-cy='player-top'], #board-layout-main [data-player='top']"
        : "#board-layout-player-bottom, #board-layout-main .board-layout-player.board-layout-bottom, #board-layout-main .player-bottom-component, #board-layout-main .player-component.player-bottom, #board-layout-main .player-row-bottom, #board-layout-main .player-row-component.player-row-bottom, #board-layout-main [data-cy='player-bottom'], #board-layout-main [data-player='bottom']";
      const ownFromNav = this.extractUsernameFromElement(
        document.querySelector("#nav-user-tagline-username"),
      );
      for (const container of document.querySelectorAll(containerSelector)) {
        const node = this.resolveUsernameNode(container);
        const username = this.extractUsernameFromElement(node);
        const rect =
          node && typeof node.getBoundingClientRect === "function"
            ? node.getBoundingClientRect()
            : null;
        if (
          username &&
          rect &&
          rect.width > 0 &&
          rect.height > 0 &&
          (!isTop || !ownFromNav || username !== ownFromNav)
        ) {
          return node;
        }
      }

      const board = this.getBoardElement();
      if (!board || typeof board.getBoundingClientRect !== "function") return null;
      const boardRect = board.getBoundingClientRect();
      let best = null;
      let bestScore = Infinity;
      const candidates = document.querySelectorAll(
        "a[href*='/member/'], [class*='username'], [class*='player-name'], [class*='tagline'], [data-cy*='username'], [data-cy*='player'], [data-test-element*='username']",
      );
      for (const candidate of candidates) {
        if (
          candidate.closest &&
          candidate.closest(
            "nav, header, [role='navigation'], [class*='chat'], [class*='sidebar'], #krypbot-container, #oi-zone2",
          )
        ) {
          continue;
        }
        const node = this.resolveUsernameNode(candidate);
        const username = this.extractUsernameFromElement(node);
        if (!username || (isTop && ownFromNav && username === ownFromNav)) continue;
        if (typeof node.getBoundingClientRect !== "function") continue;
        const rect = node.getBoundingClientRect();
        if (!rect.width || !rect.height) continue;
        const centerX = rect.left + rect.width / 2;
        if (centerX < boardRect.left - 80 || centerX > boardRect.right + 120) continue;
        const distance = isTop
          ? Math.abs(rect.bottom - boardRect.top)
          : Math.abs(rect.top - boardRect.bottom);
        const inBand = isTop
          ? rect.bottom >= boardRect.top - 150 && rect.top <= boardRect.top + 45
          : rect.top <= boardRect.bottom + 150 && rect.bottom >= boardRect.bottom - 45;
        if (inBand && distance < bestScore) {
          best = node;
          bestScore = distance;
        }
      }
      return best;
    },

    getMyOwnUsername() {
      const bottom = this.findPlayerElement("bottom");
      if (bottom) return this.extractUsernameFromElement(bottom);
      return this.extractUsernameFromElement(document.querySelector("#nav-user-tagline-username"));
    },

    getOpponentElement() {
      return this.findPlayerElement("top");
    },

    getOpponentUsername() {
      return this.extractUsernameFromElement(this.getOpponentElement());
    },

    getMyUsernameElement() {
      return this.findPlayerElement("bottom");
    },

    checkOpponent() {
      const username = this.getOpponentUsername();
      if (!username) {
        if (this.lastOpponent || this.currentEntry || this.requestController) this.reset();
        if (!document.getElementById("oi-zone2")) this.renderStatus("waiting");
        return;
      }
      if (username === this.lastOpponent) {
        if (this.currentEntry && !this.isValidCacheEntry(this.currentEntry, username)) {
          this.invalidateCache(username);
          this.currentEntry = null;
          this.hide();
          this.fetchData(username);
          return;
        }
        const target = this.getOpponentElement();
        if (!target) return;
        const existingHud = document.querySelector(".tc-hud-stats");
        const scoutContainer = document.getElementById("krypbot-container");
        const uiMissing =
          !existingHud ||
          existingHud.dataset.username !== username ||
          target.nextElementSibling !== existingHud ||
          (scoutContainer && !document.getElementById("oi-zone2"));
        if (this.currentEntry && uiMissing) {
          this.renderEntry(this.currentEntry);
        } else if (this.requestController && uiMissing) {
          this.renderLoading();
        }
        return;
      }

      this.clearRetry();
      this.retryCount = 0;
      this.lastOpponent = username;
      this.currentEntry = null;
      this.hide();
      if (isLegacyAutoAdjustEffective()) {
        setTimeout(() => {
          if (username !== this.lastOpponent) return;
          const rating = refreshAutoAdjustOpponentRating();
          if (rating !== null) {
            window.krypbotUpdateUI();
          }
        }, 500);
      }
      this.fetchData(username);
    },

    startObserver() {
      if (this.observer) this.observer.disconnect();
      if (this.checkTimer) {
        clearTimeout(this.checkTimer);
        this.checkTimer = null;
      }
      this._getOpponentElement = () => this.getOpponentElement();
      this._getMyUsernameElement = () => this.getMyUsernameElement();
      this.observer = new MutationObserver(() => {
        if (this.checkTimer) return;
        this.checkTimer = setTimeout(() => {
          this.checkTimer = null;
          this.checkOpponent();
        }, 120);
      });
      if (document.body) {
        this.observer.observe(document.body, {
          childList: true,
          subtree: true,
          characterData: true,
          attributes: true,
          attributeFilter: ["class", "href"],
        });
      }
      if (!this.freshnessInterval) {
        this.freshnessInterval = window.setInterval(() => this.checkOpponent(), 60000);
      }
      this.checkOpponent();
    },

    reset() {
      this.clearRetry();
      this.retryCount = 0;
      if (this.requestController) {
        this.requestController.abort();
        this.requestController = null;
      }
      this.lastOpponent = null;
      this.currentEntry = null;
      this.requestVersion++;
      this.hide();
    },
  };

  // --- ESTADO DO AUTO RUN DELAY (PERSISTENTE) ---
  let autoDelayMin =
      parseFloat(localStorage.getItem("autoMinDelay")) || DEFAULT_MIN_DELAY,
    autoDelayMax =
      parseFloat(localStorage.getItem("autoMaxDelay")) || DEFAULT_MAX_DELAY,
    autoDelayMode = localStorage.getItem("autoDelayMode") || DEFAULT_DELAY_MODE;

  // Validacao inicial
  if (autoDelayMode !== "max") {
    autoDelayMin = Number.isFinite(autoDelayMin) ? Math.min(10, Math.max(0.01, autoDelayMin)) : DEFAULT_MIN_DELAY;
    autoDelayMax = Number.isFinite(autoDelayMax) ? Math.min(10, Math.max(0.01, autoDelayMax)) : DEFAULT_MAX_DELAY;
  }
  if (autoDelayMin > autoDelayMax)
    [autoDelayMin, autoDelayMax] = [autoDelayMax, autoDelayMin];

  let smartPacingEnabled = localStorage.getItem("smartPacing") === "true";
  let smartPacingV2Enabled = localStorage.getItem("smartPacingV2") === "true";
  let smartPacingV2ShadowEnabled = localStorage.getItem("smartPacingV2Shadow") === "true";

  let chessBot = {
    elo: 3200,
    time: 0.02,
  };

  let autoAdjust = new AutoAdjustRating(chessBot.elo);

  function isLegacyAutoAdjustEffective() {
    return autoAdjust.isEnabled() && !sessionControlBridge.suspendsLegacyAutoAdjust();
  }

  function log(msg) {
    debug("log", "[KrypBot]", msg);
  }

  function updateMySession(result) {
    try {
      if (result === "W") {
        mySession.wins++;
      } else if (result === "L") {
        mySession.losses++;
      } else {
        mySession.draws++;
      }

      if (mySession.streakType === result) {
        mySession.streak++;
      } else {
        mySession.streakType = result;
        mySession.streak = 1;
      }

      renderMySession();
    } catch (e) {
      log("updateMySession erro: " + e);
    }
  }

  function renderMySession() {
    try {
      $("#oi-mysession").remove();
      const target = OpponentIntel._getMyUsernameElement
        ? OpponentIntel._getMyUsernameElement()
        : null;

      if (!target) return;

      const { wins, losses, draws, streak, streakType } = mySession;
      const emoji =
        streakType === "W" ? "ðŸ”¥" : streakType === "L" ? "ðŸ’€" : "âž–";
      const streakStr = streakType ? `${emoji}${streakType}${streak} Â· ` : "";

      const html = `<span id="oi-mysession" style="font-size:11px;color:#e0e0e0;margin-left:8px;">
      ${streakStr}<span style="color:#4caf50">${wins}</span>-<span style="color:#9e9e9e">${draws}</span>-<span style="color:#f44336">${losses}</span>
    </span>`;

      $(target).after(html);
    } catch (e) {
      log("renderMySession erro: " + e);
    }
  }

  const detectGameMode = () => {
    const url = window.location.href;
    if (url.includes("/puzzle") || url.includes("/puzzles")) {
      gameMode = "puzzle";
    } else {
      gameMode = "play";
    }
    return gameMode;
  };

  // --- LÃ“GICA DE CÃLCULO DE DELAY ---
  const sessionPacingProfile = 0.8 + Math.random() * 0.4; // 0.8 (agressivo) a 1.2 (defensivo)

  class SmartPacer {
    constructor({
      jitterLimit = 0.18,
      jitterSigma = 0.06,
      emergencyMinMs = 150,
      emergencyMaxMs = 250,
      random = Math.random,
      now = Date.now,
    } = {}) {
      this.jitterLimit = jitterLimit;
      this.jitterSigma = jitterSigma;
      this.emergencyMinMs = emergencyMinMs;
      this.emergencyMaxMs = emergencyMaxMs;
      this.random = random;
      this.now = now;
      this.pendingTimer = null;
      this.pendingReject = null;
      this.pendingSignal = null;
      this.pendingAbort = null;
    }

    parseTime(value) {
      if (Number.isFinite(value)) return Math.max(0, value);
      if (typeof value !== "string") {
        throw new TypeError("Tempo deve ser numero em ms ou texto de relogio");
      }
      const normalized = value.trim().replace(",", ".");
      if (/^\d+(?:\.\d+)?$/.test(normalized)) {
        return Math.round(Number(normalized) * 1000);
      }
      const rawParts = normalized.split(":");
      const parts = rawParts.map(Number);
      if (
        parts.length < 2 ||
        parts.length > 3 ||
        rawParts.some((part) => part === "") ||
        parts.some((part) => !Number.isFinite(part) || part < 0)
      ) {
        throw new TypeError(`Tempo invalido: ${value}`);
      }
      if (parts[parts.length - 1] >= 60) {
        throw new TypeError(`Tempo invalido: ${value}`);
      }
      if (parts.length === 3 && parts[1] >= 60) {
        throw new TypeError(`Tempo invalido: ${value}`);
      }
      const seconds =
        parts.length === 3
          ? parts[0] * 3600 + parts[1] * 60 + parts[2]
          : parts[0] * 60 + parts[1];
      return Math.round(seconds * 1000);
    }

    uniform(min, max) {
      return min + this.random() * (max - min);
    }

    standardGaussian() {
      const rawU1 = Number(this.random());
      const rawU2 = Number(this.random());
      const u1 = Math.min(
        1 - Number.EPSILON,
        Math.max(Number.MIN_VALUE, Number.isFinite(rawU1) ? rawU1 : 0.5),
      );
      const u2 = Math.min(
        1 - Number.EPSILON,
        Math.max(0, Number.isFinite(rawU2) ? rawU2 : 0.5),
      );
      return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    }

    gaussianFactor() {
      const variation = Math.max(
        -this.jitterLimit,
        Math.min(this.jitterLimit, this.standardGaussian() * this.jitterSigma),
      );
      return 1 + variation;
    }

    clockScale(userTimeMs) {
      if (userTimeMs === null) return 1;
      const anchors = [
        [10000, 0.24],
        [20000, 0.3],
        [45000, 0.38],
        [75000, 0.48],
        [120000, 0.68],
        [180000, 0.88],
        [300000, 1],
        [600000, 1.1],
      ];
      if (userTimeMs <= anchors[0][0]) return anchors[0][1];
      for (let index = 1; index < anchors.length; index++) {
        const [rightTime, rightScale] = anchors[index];
        const [leftTime, leftScale] = anchors[index - 1];
        if (userTimeMs <= rightTime) {
          const progress = (userTimeMs - leftTime) / (rightTime - leftTime);
          return leftScale + (rightScale - leftScale) * progress;
        }
      }
      return anchors[anchors.length - 1][1];
    }

    clockThinkCap(userTimeMs) {
      if (userTimeMs === null) return 6500;
      if (userTimeMs < 20000) return 420;
      if (userTimeMs < 45000) return 700;
      if (userTimeMs <= 75000) return 950;
      if (userTimeMs <= 120000) return 1400;
      if (userTimeMs <= 240000) return 2800;
      return Math.min(6500, Math.max(2800, userTimeMs * 0.05));
    }

    calculateDelay({
      userTime = null,
      opponentTime = null,
      phase = "middlegame",
      complexityMultiplier = 1,
      isForced = false,
    }) {
      const parseOptionalTime = (value) => {
        if (value === null || value === undefined || value === "") return null;
        try { return this.parseTime(value); } catch (error) { return null; }
      };
      const userTimeMs = parseOptionalTime(userTime);
      const opponentTimeMs = parseOptionalTime(opponentTime);
      if (isForced || (userTimeMs !== null && userTimeMs < 10000)) {
        const reflexDelay = this.uniform(this.emergencyMinMs, this.emergencyMaxMs);
        if (userTimeMs === null) return Math.round(reflexDelay);
        return Math.round(Math.max(0, Math.min(reflexDelay, userTimeMs * 0.04)));
      }
      const phaseCenters = { opening: 800, middlegame: 1050, endgame: 850 };
      const center = phaseCenters[phase] || phaseCenters.middlegame;
      const rawComplexity = Number(complexityMultiplier);
      const positionFactor = Number.isFinite(rawComplexity)
        ? Math.max(0.15, Math.min(1.8, rawComplexity))
        : 1;
      let clockFactor = this.clockScale(userTimeMs);
      if (userTimeMs !== null && opponentTimeMs !== null) {
        const balance = (userTimeMs - opponentTimeMs) / Math.max(userTimeMs, opponentTimeMs, 1000);
        clockFactor *= balance >= 0
          ? 1 + Math.min(0.12, balance * 0.2)
          : 1 + Math.max(-0.2, balance * 0.32);
      }
      let delay = center * positionFactor * clockFactor * this.gaussianFactor();
      delay = Math.min(delay, this.clockThinkCap(userTimeMs));
      return Math.round(Math.max(140, Math.min(6500, delay)));
    }

    cancel() {
      if (this.pendingTimer !== null) {
        clearTimeout(this.pendingTimer);
      }
      if (this.pendingSignal && this.pendingAbort) {
        this.pendingSignal.removeEventListener("abort", this.pendingAbort);
      }
      const reject = this.pendingReject;
      this.pendingTimer = null;
      this.pendingReject = null;
      this.pendingSignal = null;
      this.pendingAbort = null;
      if (reject) reject(new DOMException("Agendamento cancelado", "AbortError"));
    }

    schedule(callback, pacingInput, { signal, exactDelay = false } = {}) {
      if (typeof callback !== "function") {
        throw new TypeError("callback deve ser uma funcao");
      }
      this.cancel();
      const exactDelayMs = Number(pacingInput?.baseDelayMs);
      if (exactDelay && (!Number.isFinite(exactDelayMs) || exactDelayMs < 0)) {
        throw new TypeError("baseDelayMs invalido");
      }
      const prescribedTargetMs = Number(pacingInput?.targetTotalMs);
      const targetDelayMs = exactDelay
        ? Math.round(exactDelayMs)
        : Number.isFinite(prescribedTargetMs) && prescribedTargetMs >= 0
          ? Math.round(prescribedTargetMs)
          : this.calculateDelay(pacingInput);
      const observedAt = Number(pacingInput?.positionObservedAt);
      const suppliedElapsedMs = Number(pacingInput?.technicalElapsedMs);
      const elapsedMs = !exactDelay && Number.isFinite(suppliedElapsedMs)
        ? Math.max(0, suppliedElapsedMs)
        : !exactDelay && Number.isFinite(observedAt)
          ? Math.max(0, this.now() - observedAt)
          : 0;
      const delayMs = Math.max(0, Math.round(targetDelayMs - elapsedMs));
      const promise = new Promise((resolve, reject) => {
        let timerId = null;
        const abort = () => {
          if (this.pendingTimer === timerId) this.cancel();
        };
        if (signal?.aborted) {
          reject(new DOMException("Agendamento cancelado", "AbortError"));
          return;
        }
        signal?.addEventListener("abort", abort, { once: true });
        timerId = setTimeout(async () => {
          if (this.pendingTimer !== timerId) return;
          this.pendingTimer = null;
          this.pendingReject = null;
          this.pendingSignal = null;
          this.pendingAbort = null;
          signal?.removeEventListener("abort", abort);
          try {
            resolve(await callback());
          } catch (error) {
            reject(error);
          }
        }, delayMs);
        this.pendingTimer = timerId;
        this.pendingReject = reject;
        this.pendingSignal = signal || null;
        this.pendingAbort = abort;
      });
      return { delayMs, targetDelayMs, elapsedMs, promise };
    }
  }

  const smartPacer = new SmartPacer();

  const smartPacingAnalysisCache = new Map();
  let engineCapability = typeof GM_getValue === "function"
    ? String(GM_getValue("thinkerEngineCapability", "") || "").trim()
    : "";
  let enginePairingPromptAttempted = false;
  const getEngineCapability = () => {
    if (engineCapability || enginePairingPromptAttempted) return engineCapability;
    enginePairingPromptAttempted = true;
    const promptFunction = typeof window !== "undefined" && typeof window.prompt === "function"
      ? window.prompt.bind(window)
      : null;
    if (!promptFunction) return "";
    const supplied = promptFunction(
      "Primeiro acesso ao Thinker Chess. Cole o token exibido no terminal do servidor:",
      "",
    );
    engineCapability = String(supplied || "").trim();
    if (engineCapability && typeof GM_setValue === "function") {
      GM_setValue("thinkerEngineCapability", engineCapability);
    }
    return engineCapability;
  };
  const engineRequestHeaders = () => {
    const headers = { "Content-Type": "application/json" };
    const capability = getEngineCapability();
    if (!capability) { const error = new Error("SERVER_AUTH_REQUIRED"); error.code = "SERVER_AUTH_REQUIRED"; throw error; }
    if (capability) headers.Authorization = `Bearer ${capability}`;
    return headers;
  };
  const handleEngineUnauthorized = (response) => {
    if (Number(response?.status) !== 401) return false;
    if (engineCapability) {
      engineCapability = "";
      enginePairingPromptAttempted = false;
      if (typeof GM_setValue === "function") GM_setValue("thinkerEngineCapability", "");
    }
    return true;
  };
  const requestCalibrationEndpoint = (path, payload, method = "POST") => new Promise((resolve, reject) => {
    let settled = false;
    GM_xmlhttpRequest({
      method,
      url: SERVER_URL + path,
      headers: engineRequestHeaders(),
      data: method === "GET" ? undefined : JSON.stringify(payload),
      timeout: 3000,
      onload: (response) => {
        if (settled) return;
        settled = true;
        if (handleEngineUnauthorized(response)) { const error = new Error("SERVER_AUTH_INVALID"); error.code = "SERVER_AUTH_INVALID"; return reject(error); }
        if (Number(response.status) >= 400) {
          let code = "CALIBRATION_UNAVAILABLE";
          try { code = JSON.parse(response.responseText).error || code; } catch (_) {}
          const error = new Error(code); error.code = code; return reject(error);
        }
        try { resolve(JSON.parse(response.responseText)); } catch (error) { reject(error); }
      },
      onerror: () => { if (!settled) { settled = true; const error = new Error("SERVER_UNAVAILABLE"); error.code = "SERVER_UNAVAILABLE"; reject(error); } },
      ontimeout: () => { if (!settled) { settled = true; const error = new Error("SERVER_UNAVAILABLE"); error.code = "SERVER_UNAVAILABLE"; reject(error); } },
      onabort: () => { if (!settled) { settled = true; reject(new DOMException("Request cancelado", "AbortError")); } },
    });
  });
  if (typeof window !== "undefined") Object.defineProperty(window, "krypbotCalibrationApi", {
    configurable: false,
    enumerable: false,
    writable: false,
    value: Object.freeze({
      status: () => requestCalibrationEndpoint("/calibration-status", null, "GET"),
      readiness: (payload) => requestCalibrationEndpoint("/calibration-readiness", payload),
      capability: async (payload) => {
        const capability = await requestCalibrationEndpoint("/calibration-capability", payload);
        const pinned = await sessionControlBridge.pinCalibration(capability);
        if (!pinned.allowed) throw new Error(`calibration pin rejeitado: ${pinned.reason}`);
        return capability;
      },
    }),
  });
  const smartPacingAnalysisPending = new Map();
  let smartPacingObservedFen = "";
  let smartPacingObservedAt = 0;

  const neutralSmartPacingAnalysis = (fen) => ({
    fen,
    complexityMultiplier: 1,
    isForced: false,
  });

  const cancelStaleSmartPacingAnalyses = (currentFen = "") => {
    for (const [pendingFen, pending] of smartPacingAnalysisPending) {
      if (pendingFen === currentFen) continue;
      pending.cancel();
    }
  };

  const observeSmartPacingPosition = (fen) => {
    if (!fen || fen === smartPacingObservedFen) return smartPacingObservedAt;
    smartPacingObservedFen = fen;
    smartPacingObservedAt = Date.now();
    cancelStaleSmartPacingAnalyses(fen);
    smartPacer.cancel();
    return smartPacingObservedAt;
  };

  const requestSmartPacingAnalysis = (fen) => {
    if (!fen) return Promise.resolve(neutralSmartPacingAnalysis(fen));
    if (smartPacingAnalysisCache.has(fen)) {
      return Promise.resolve(smartPacingAnalysisCache.get(fen));
    }
    const existing = smartPacingAnalysisPending.get(fen);
    if (existing) return existing.promise;

    let requestHandle = null;
    let settled = false;
    let rejectPending = null;
    const finish = (resolve, value, { cache = false } = {}) => {
      if (settled) return;
      settled = true;
      smartPacingAnalysisPending.delete(fen);
      if (cache) {
        smartPacingAnalysisCache.set(fen, value);
        while (smartPacingAnalysisCache.size > 64) {
          smartPacingAnalysisCache.delete(smartPacingAnalysisCache.keys().next().value);
        }
      }
      resolve(value);
    };
    const promise = new Promise((resolve, reject) => {
      rejectPending = reject;
      const fallback = () => finish(resolve, neutralSmartPacingAnalysis(fen));
      try {
        requestHandle = GM_xmlhttpRequest({
          method: "POST",
          url: SERVER_URL + "/analyze",
          headers: engineRequestHeaders(),
          data: JSON.stringify({ fen }),
          timeout: 5000,
          onload: (resp) => {
            try {
              if (handleEngineUnauthorized(resp)) return fallback();
              if (Number(resp?.status) >= 400) return fallback();
              const data = JSON.parse(resp.responseText);
              const multiplier = Number(data?.complexityMultiplier);
              if (!Number.isFinite(multiplier)) return fallback();
              finish(resolve, {
                fen,
                complexityMultiplier: Math.max(0.15, Math.min(1.8, multiplier)),
                isForced: data?.isForced === true,
              }, { cache: true });
            } catch (error) {
              fallback();
            }
          },
          onerror: fallback,
          ontimeout: fallback,
          onabort: () => {},
        });
      } catch (error) {
        fallback();
      }
    });
    const cancel = () => {
      if (settled) return;
      settled = true;
      smartPacingAnalysisPending.delete(fen);
      try { requestHandle?.abort?.(); } catch (error) {}
      rejectPending?.(new DOMException("Analise cancelada", "AbortError"));
    };
    smartPacingAnalysisPending.set(fen, { promise, cancel });
    return promise;
  };

  const smartPacingV2Runtime = {
    gameIdentity: null,
    runtimeGameToken: "",
    positionRevision: 0,
    fen: "",
    observedAtMonoMs: 0,
    activeRequest: null,
    initialUserTimeMs: null,
    temporalDebtMs: 0,
    cooldownMoves: 0,
  };

  const stableJson = (value) => {
    if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
    if (value && typeof value === "object") {
      return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
    }
    return JSON.stringify(value);
  };

  const sha256Hex = async (value) => {
    const bytes = new TextEncoder().encode(value);
    const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest), (item) => item.toString(16).padStart(2, "0")).join("");
  };

  const smartPacingV2Digest = async (namespace, payload) =>
    sha256Hex(stableJson({ namespace, payload }));

  const createSmartPacingV2Token = () => {
    const bytes = new Uint32Array(4);
    globalThis.crypto.getRandomValues(bytes);
    return Array.from(bytes, (value) => value.toString(16).padStart(8, "0")).join("");
  };

  const releaseSmartPacingV2Game = (runtimeGameToken) => {
    if (!runtimeGameToken || !engineCapability) return;
    try {
      GM_xmlhttpRequest({
        method: "POST",
        url: SERVER_URL + "/move-plan/release",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${engineCapability}`,
        },
        data: JSON.stringify({ runtimeGameToken }),
        timeout: 1000,
      });
    } catch (error) {}
  };

  const beginSmartPacingV2Observation = (fen, gameIdentity) => {
    if (smartPacingV2Runtime.gameIdentity !== gameIdentity) {
      try { smartPacingV2Runtime.activeRequest?.abort?.(); } catch (error) {}
      releaseSmartPacingV2Game(smartPacingV2Runtime.runtimeGameToken);
      smartPacingV2Runtime.gameIdentity = gameIdentity;
      smartPacingV2Runtime.runtimeGameToken = "";
      smartPacingV2Runtime.positionRevision = 0;
      smartPacingV2Runtime.fen = "";
      smartPacingV2Runtime.observedAtMonoMs = 0;
      smartPacingV2Runtime.activeRequest = null;
      smartPacingV2Runtime.initialUserTimeMs = null;
      smartPacingV2Runtime.temporalDebtMs = 0;
      smartPacingV2Runtime.cooldownMoves = 0;
    }
    if (!smartPacingV2Runtime.runtimeGameToken) {
      smartPacingV2Runtime.runtimeGameToken = createSmartPacingV2Token();
    }
    if (fen !== smartPacingV2Runtime.fen) {
      smartPacingV2Runtime.fen = fen;
      smartPacingV2Runtime.positionRevision += 1;
      smartPacingV2Runtime.observedAtMonoMs = performance.now();
      try { smartPacingV2Runtime.activeRequest?.abort?.(); } catch (error) {}
      smartPacingV2Runtime.activeRequest = null;
    }
    return {
      runtimeGameToken: smartPacingV2Runtime.runtimeGameToken,
      positionRevision: smartPacingV2Runtime.positionRevision,
      observedAtMonoMs: smartPacingV2Runtime.observedAtMonoMs,
    };
  };

  const smartPacingV2Keys = async (fen, observation, schemaVersion = 1) => {
    const fields = String(fen || "").trim().split(/\s+/);
    if (fields.length !== 6) throw new TypeError("FEN invalida para Smart Pacing V2");
    const observationHash = schemaVersion === 2
      ? await sha256Hex(stableJson({ fen: fields.join(" "), positionRevision: observation.positionRevision, runtimeGameToken: observation.runtimeGameToken, schemaVersion: 2 }))
      : await smartPacingV2Digest("observation-v1", { schemaVersion: 1, runtimeGameToken: observation.runtimeGameToken, positionRevision: observation.positionRevision, exactFullFen: fields.join(" ") });
    const analysisHash = await smartPacingV2Digest("analysis-v1", {
      boardFen: fields[0],
      sideToMove: fields[1],
      castlingRights: fields[2],
      enPassantSquare: fields[3],
      halfmoveClock: Number(fields[4]),
      historyDigestOrUnknown: "unknown",
    });
    return {
      observationKey: `obs${schemaVersion}:${observationHash}`,
      analysisPositionKey: `ana1:${analysisHash}`,
    };
  };

  const smartPacingV2ClockBudget = (clockValues) => {
    const parse = (value) => {
      try { return smartPacer.parseTime(value); } catch (error) { return null; }
    };
    const userRemainingMs = parse(clockValues?.userTime);
    if (smartPacingV2Runtime.initialUserTimeMs === null && userRemainingMs !== null) {
      smartPacingV2Runtime.initialUserTimeMs = userRemainingMs;
    }
    const initial = smartPacingV2Runtime.initialUserTimeMs ?? userRemainingMs;
    const family = initial !== null && initial <= 120000 ? "bullet" : initial !== null && initial > 600000 ? "rapid" : "blitz";
    const reserveMinimum = { bullet: 2500, blitz: 6500, rapid: 15000 }[family];
    const responseFloor = { bullet: 130, blitz: 180, rapid: 240 }[family];
    const paceRate = { bullet: 0.36, blitz: 0.5, rapid: 0.64 }[family];
    const reliable = userRemainingMs !== null;
    const reserveMs = reliable ? Math.max(reserveMinimum, 30 * responseFloor, 540) : Math.round(reserveMinimum * 1.35);
    const spendableMs = reliable ? Math.max(0, userRemainingMs - reserveMs - 180) : 0;
    const sustainableMs = Math.max(responseFloor, spendableMs / 30 * paceRate);
    const survival = !reliable || spendableMs <= reserveMs * 0.3;
    const analysisTier = survival ? "survival" : spendableMs < 1500 ? "fast" : spendableMs > 5000 ? "deep" : "standard";
    const tierCap = { survival: 90, fast: 250, standard: 700, deep: 1600 }[analysisTier];
    return {
      userRemainingMs,
      reserveMs,
      spendableMs,
      sustainableMs,
      survival,
      analysisTier,
      clientBudgetMs: Math.max(25, Math.min(tierCap, spendableMs)),
      executionMarginMs: 180,
    };
  };

  const decideSmartPacingV2 = (plan, clockBudget, observedAtMonoMs) => {
    const evidence = plan.evidence || {};
    const value = Math.max(0, Math.min(1, Number(evidence.decisionValue) || 0));
    const forcedness = Math.max(0, Math.min(1, Number(evidence.forcedness) || 0));
    const confidence = Math.max(0, Math.min(1, Number(evidence.analysisConfidence) || 0));
    const debtFactor = 1 / (1 + smartPacingV2Runtime.temporalDebtMs / Math.max(1, clockBudget.sustainableMs * 2));
    const longThink = !clockBudget.survival && value >= 0.78 && confidence >= 0.72 && forcedness <= 0.45 && smartPacingV2Runtime.cooldownMoves === 0;
    const pacingClass = clockBudget.survival
      ? "SURVIVAL"
      : confidence < 0.45
        ? "DEGRADED"
        : forcedness >= 0.8
          ? "REFLEX"
          : longThink
            ? "LONG_THINK"
            : value >= 0.62
              ? "CRITICAL"
              : value <= 0.25 || Number(evidence.familiarity) >= 0.7
                ? "SIMPLE"
                : "NORMAL";
    const factor = { SURVIVAL: 0.35, DEGRADED: 0.6, REFLEX: 0.45, SIMPLE: 0.75, NORMAL: 1, CRITICAL: 1.65, LONG_THINK: 4.5 }[pacingClass];
    const rationalTarget = clockBudget.sustainableMs * factor * debtFactor;
    const dynamicCap = longThink
      ? Math.min(clockBudget.spendableMs * 0.2, clockBudget.sustainableMs * 7)
      : Math.min(clockBudget.spendableMs, clockBudget.sustainableMs * 2.5);
    const targetTotalMs = Math.max(0, Math.round(Math.min(rationalTarget, dynamicCap, clockBudget.spendableMs)));
    return {
      timingModelVersion: 1,
      class: pacingClass,
      targetTotalMs,
      technicalElapsedMs: Math.max(0, Math.round(performance.now() - observedAtMonoMs)),
      sustainableMs: Math.round(clockBudget.sustainableMs),
      reserveMs: clockBudget.reserveMs,
      decisionValue: value,
      predictedOpponentReplies: evidence.predictedReplies || [],
      reasonCodes: evidence.reasonCodes || [],
    };
  };

  const commitSmartPacingV2Outcome = ({ pacingDecision }) => {
    if (!pacingDecision) return;
    const overspend = Math.max(0, pacingDecision.targetTotalMs - pacingDecision.sustainableMs);
    smartPacingV2Runtime.temporalDebtMs = Math.max(
      0,
      smartPacingV2Runtime.temporalDebtMs * 0.72 + overspend - Math.max(0, pacingDecision.sustainableMs - pacingDecision.targetTotalMs) * 0.4,
    );
    smartPacingV2Runtime.cooldownMoves = pacingDecision.class === "LONG_THINK"
      ? 3
      : Math.max(0, smartPacingV2Runtime.cooldownMoves - 1);
  };

  const reattestCurrentCalibration = async () => {
    const snapshot = sessionControlBridge.sessionSnapshot();
    const game = snapshot && snapshot.activeGame;
    if (!snapshot || !game || game.targetPinStatus !== "PINNED") throw new Error("CALIBRATION_CAPABILITY_REQUIRED");
    const offsetElo = snapshot.controller.mode === "BOOST" ? snapshot.config.boostOffsetElo : snapshot.config.correctionOffsetElo;
    return globalThis.krypbotCalibrationApi.capability({ schemaVersion: 1, runtimeGameToken: game.runtimeGameToken, scaleId: snapshot.config.scaleId, opponentRatingScaleId: game.opponent.ratingScaleId, opponentRating: game.opponent.rating, offsetElo, platformAdjustedRating: game.opponent.rating + offsetElo, requiredMode: "active" });
  };

  const requestSmartPacingV2Plan = async ({ fen, elo, clockValues, observation }, capabilityRetried = false) => {
    const sessionMovePlan = sessionControlBridge.isActive() ? await sessionControlBridge.prepareMovePlan(fen) : null;
    if (sessionControlBridge.isActive() && !sessionMovePlan) throw new DOMException("Posicao ainda nao estabilizada", "AbortError");
    const effectiveObservation = sessionMovePlan || observation;
    const schemaVersion = sessionMovePlan ? 2 : 1;
    const keys = await smartPacingV2Keys(fen, effectiveObservation, schemaVersion);
    if (!sessionMovePlan && observation.positionRevision !== smartPacingV2Runtime.positionRevision) {
      throw new DOMException("Posicao obsoleta", "AbortError");
    }
    const budget = smartPacingV2ClockBudget(clockValues);
    const requestId = `${effectiveObservation.runtimeGameToken}-${effectiveObservation.positionRevision}`;
    const payload = {
      schemaVersion,
      requestId,
      runtimeGameToken: effectiveObservation.runtimeGameToken,
      positionRevision: effectiveObservation.positionRevision,
      observationKey: keys.observationKey,
      analysisPositionKey: keys.analysisPositionKey,
      fen,
      lastMove: null,
      historyDigest: null,
      moveSelectionElo: Math.round(sessionMovePlan ? sessionMovePlan.moveSelectionElo : elo),
      perceptionElo: Math.round(sessionMovePlan ? sessionMovePlan.perceptionElo : elo),
      analysisTier: budget.analysisTier,
      clientBudgetMs: budget.clientBudgetMs,
      analysisBudgetVersion: 1,
      evidenceModelVersion: 1,
    };
    if (sessionMovePlan) payload.calibrationRequirement = sessionMovePlan.calibrationRequirement;
    return new Promise((resolve, reject) => {
      let settled = false;
      const handle = GM_xmlhttpRequest({
        method: "POST",
        url: SERVER_URL + "/move-plan",
        headers: engineRequestHeaders(),
        data: JSON.stringify(payload),
        timeout: Math.max(1000, budget.clientBudgetMs + 750),
        onload: async (response) => {
          if (settled) return;
          if (handleEngineUnauthorized(response)) return reject(new Error("move-plan nao autenticado"));
          if (Number(response.status) >= 400) {
            let code = `MOVE_PLAN_HTTP_${response.status}`;
            try { code = JSON.parse(response.responseText).error || code; } catch (_) {}
            if (code === "CALIBRATION_CAPABILITY_REQUIRED" && sessionMovePlan && !capabilityRetried) {
              settled = true;
              try {
                await reattestCurrentCalibration();
                return resolve(await requestSmartPacingV2Plan({ fen, elo, clockValues, observation }, true));
              } catch (error) {
                return reject(error);
              }
            }
            settled = true;
            const error = new Error(code); error.code = code; return reject(error);
          }
          settled = true;
          try {
            const plan = JSON.parse(response.responseText);
            if (
              plan.schemaVersion !== schemaVersion ||
              plan.requestId !== requestId ||
              plan.observationKey !== keys.observationKey ||
              plan.positionRevision !== effectiveObservation.positionRevision ||
              (plan.move !== null && !/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(plan.move))
            ) {
              throw new TypeError("Contrato move-plan invalido");
            }
            const acceptance = await sessionControlBridge.acceptMovePlan(plan, sessionMovePlan);
            if (!acceptance.allowed) throw new Error(`move-plan rejeitado: ${acceptance.reason}`);
            resolve({ plan, budget });
          } catch (error) {
            reject(error);
          }
        },
        onerror: () => { if (!settled) { settled = true; reject(new Error("move-plan indisponivel")); } },
        ontimeout: () => { if (!settled) { settled = true; reject(new Error("move-plan timeout")); } },
        onabort: () => { if (!settled) { settled = true; reject(new DOMException("Request cancelado", "AbortError")); } },
      });
      smartPacingV2Runtime.activeRequest = handle;
    });
  };

  const gaussianRandom = (mean = 0, stdev = 1) => {
    let u = 1 - Math.random();
    let v = Math.random();
    let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z * stdev + mean;
  };

  // ===== EVAL BAR ENGINE (baseado no documento tecnico) =====
  let evalBarEnabled = localStorage.getItem("evalBar") === "true";
  let evalBarV2Enabled = localStorage.getItem("evalBarV2") !== "false";
  let evalBarDiagnosticEnabled = localStorage.getItem("evalBarV2Diagnostics") === "true";
  let lastEvalData = { cp: 0, mate: null, depth: 0 };
  let evalBarCurrent = 50;
  let lastEvalFen = "";
  let evalBarV2Adapter = null;
  const evalBarClientId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let evalBarTransportDiagnostic = Object.freeze({ stage: "idle", status: null, elapsedMs: null, eventType: null, depth: null, error: null });

  function setEvalBarTransportDiagnostic(stage, details = {}) {
    evalBarTransportDiagnostic = Object.freeze({
      stage,
      status: Number.isFinite(Number(details.status)) ? Number(details.status) : null,
      elapsedMs: Number.isFinite(Number(details.elapsedMs)) ? Number(details.elapsedMs) : null,
      eventType: typeof details.eventType === "string" ? details.eventType : null,
      depth: Number.isFinite(Number(details.depth)) ? Number(details.depth) : null,
      error: details.error == null ? null : details.error instanceof Error ? details.error.message : String(details.error),
    });
  }

  function getEvalBarBoard() {
    return globalThis.ThinkerEvalBarV2?.findChessComBoard?.(document) || null;
  }

  function getEvalBarFen() {
    try {
      const api = globalThis.ThinkerEvalBarV2;
      const board = getEvalBarBoard();
      const boardFen = api?.readChessComFen?.(board);
      if (boardFen) return boardFen;
      const { board: gameBoard, game } = get_cached_game();
      const sameBoard = gameBoard === board || Boolean(
        gameBoard && board && (gameBoard.contains?.(board) || board.contains?.(gameBoard))
      );
      if (!sameBoard) return null;
      const fen = game?.getFEN?.() || null;
      return api?.isValidChessFen?.(fen) ? fen : null;
    } catch (_) {
      return null;
    }
  }

  function evalBarPresentationAllowed() {
    return Boolean(globalThis.ThinkerEvalBarV2?.resolveChessComEvalPresentation?.(window.location));
  }

  function evalBarAuthorization() {
    return globalThis.ThinkerEvalBarV2?.resolveChessComEvalAuthorization?.(window.location, document) || null;
  }

  function getEvalBarCacheContext() {
    return `stockfish-19|@lichess-org/stockfish-web@0.5.0|sf_19_smallnet|nn-61e7af4bb97d.nnue:61e7af4bb97d|threads=3|hash=16|multipv=1|movetime=8000|white-pov|lichess-winning-chances-0.00368208-v1|${SERVER_URL}/eval-bar/stream`;
  }

  function requestEvalBarV2({ fen, generation, requestId, cacheContext, onProgress, onResult, onError }) {
    if (!evalBarAuthorization()) return null;
    const transportRequestId = `eval-v2:${evalBarClientId}:${requestId}`;
    let settled = false;
    let handle = null;
    let streamReader = null;
    let streamStarted = false;
    let abortedByClient = false;
    let buffered = "";
    const startedAt = performance.now();
    const cancelReader = () => {
      const reader = streamReader;
      streamReader = null;
      if (!reader?.cancel) return;
      try {
        const cancellation = reader.cancel();
        cancellation?.catch?.(() => {});
      } catch (_) {}
    };
    const fail = (stage, error) => {
      if (settled) return;
      settled = true;
      cancelReader();
      setEvalBarTransportDiagnostic(stage, { elapsedMs: performance.now() - startedAt, error });
      reportEvalBarDiagnostic(stage, error);
      onError(error);
    };
    const httpError = (status, responseText, response) => {
      let detail = "";
      try { detail = JSON.parse(responseText)?.error || ""; } catch (_) {}
      if (Number(status) === 401) {
        handleEngineUnauthorized(response);
        return new Error(detail ? `${detail} (HTTP 401)` : "Eval authorization expired (HTTP 401)");
      }
      return new Error(detail ? `${detail} (HTTP ${status})` : `Eval HTTP ${status}`);
    };
    const consume = (chunk, flush = false) => {
      buffered += String(chunk || "");
      const lines = buffered.split("\n");
      buffered = flush ? "" : lines.pop() || "";
      if (flush && lines.length && !lines[lines.length - 1]) lines.pop();
      for (const raw of lines) {
        const line = raw.trim();
        if (!line || settled) continue;
        const item = JSON.parse(line);
        const mismatches = [];
        if (item.requestId !== transportRequestId) mismatches.push("requestId");
        if (item.generation !== generation) mismatches.push("generation");
        if (item.cacheContext !== cacheContext) mismatches.push("cacheContext");
        if (item.fen !== fen) mismatches.push("fen");
        if (item.perspective !== "white") mismatches.push("perspective");
        if (mismatches.length) throw new Error(`Eval response identity mismatch: ${mismatches.join(", ")}`);
        if (item.type === "started") {
          setEvalBarTransportDiagnostic("stream-started", { status: 200, elapsedMs: performance.now() - startedAt, eventType: item.type });
          reportEvalBarDiagnostic("stream-started", { latencyMs: performance.now() - startedAt, item });
          onProgress(item);
        } else if (item.type === "info") {
          setEvalBarTransportDiagnostic("stream-info", { status: 200, elapsedMs: performance.now() - startedAt, eventType: item.type, depth: item.depth });
          onProgress(item);
        } else if (item.type === "result") {
          settled = true;
          setEvalBarTransportDiagnostic("stream-complete", { status: 200, elapsedMs: performance.now() - startedAt, eventType: item.type, depth: item.depth });
          reportEvalBarDiagnostic("stream-complete", { latencyMs: performance.now() - startedAt, item });
          onResult(item);
        } else if (item.type === "error" || item.type === "cancelled") {
          throw new Error(item.detail || item.error || item.type);
        } else {
          throw new Error(`Unknown Eval event type: ${String(item.type)}`);
        }
      }
    };
    setEvalBarTransportDiagnostic("request-started", { elapsedMs: 0 });
    handle = GM_xmlhttpRequest({
      method: "POST",
      url: SERVER_URL + "/eval-bar/stream",
      headers: engineRequestHeaders(),
      data: JSON.stringify({ fen, requestId: transportRequestId, generation, cacheContext, context: evalBarAuthorization() }),
      timeout: 15000,
      responseType: "stream",
      onloadstart: function (resp) {
        const stream = resp?.response;
        if (settled || !stream?.getReader) return;
        let decoder;
        try {
          streamReader = stream.getReader();
          decoder = new TextDecoder();
        } catch (error) {
          streamReader = null;
          setEvalBarTransportDiagnostic("stream-init-error", { status: resp?.status, elapsedMs: performance.now() - startedAt, error });
          reportEvalBarDiagnostic("stream-init-error", error);
          return;
        }
        streamStarted = true;
        const reader = streamReader;
        const status = Number(resp?.status);
        void (async () => {
          let responseText = "";
          try {
            while (!settled) {
              const { done, value } = await reader.read();
              if (done) break;
              const chunk = decoder.decode(value, { stream: true });
              if (status >= 400) responseText += chunk;
              else consume(chunk);
            }
            const tail = decoder.decode();
            if (status >= 400) {
              responseText += tail;
              fail("http-error", httpError(status, responseText, resp));
              return;
            }
            if (!settled) consume(tail, true);
            if (!settled) fail("response-error", new Error("Eval stream ended without a terminal event"));
          } catch (error) {
            fail(status >= 400 ? "http-error" : "stream-read-error", status >= 400 ? httpError(status, responseText, resp) : error);
          } finally {
            if (streamReader === reader) streamReader = null;
            try { reader.releaseLock?.(); } catch (_) {}
          }
        })();
      },
      onload: function (resp) {
        if (settled || streamStarted) return;
        if (!evalBarAuthorization()) {
          fail("authorization-error", new Error("Eval authorization expired"));
          return;
        }
        if (resp.status < 200 || resp.status >= 300) {
          fail("http-error", httpError(resp.status, String(resp.responseText || ""), resp));
          return;
        }
        try {
          consume(String(resp.responseText || ""), true);
          if (!settled) throw new Error("Eval stream ended without a terminal event");
        } catch (error) {
          fail("response-error", error);
        }
      },
      onerror: function (error) {
        const status = Number(error?.status);
        const message = typeof error?.error === "string" ? error.error
          : typeof error?.statusText === "string" && error.statusText ? error.statusText
            : Number.isFinite(status) && status > 0 ? `Eval HTTP ${status}` : "Eval connection error";
        fail("connection-error", error instanceof Error ? error : new Error(message));
      },
      ontimeout: function () {
        if (!settled) {
          const error = new Error("Eval timeout");
          error.elapsedMs = performance.now() - startedAt;
          fail("timeout", error);
        }
      },
      onabort: function () {
        reportEvalBarDiagnostic("abort", { elapsedMs: performance.now() - startedAt });
        if (!abortedByClient) fail("abort", new Error("Eval request aborted"));
      },
    });
    return {
      abort: () => {
        if (settled) return;
        abortedByClient = true;
        settled = true;
        cancelReader();
        setEvalBarTransportDiagnostic("cancelled", { elapsedMs: performance.now() - startedAt });
        GM_xmlhttpRequest({
          method: "POST",
          url: SERVER_URL + "/eval-bar/cancel",
          headers: engineRequestHeaders(),
          data: JSON.stringify({ requestId: transportRequestId }),
          timeout: 2000,
        });
        handle?.abort?.();
      },
    };
  }

  function ensureEvalBarV2() {
    const api = globalThis.ThinkerEvalBarV2;
    if (!api?.createUserscriptEvalBar) return null;
    if (evalBarV2Adapter) return evalBarV2Adapter;
    globalThis.__thinkerEvalBarV2?.destroy?.();
    evalBarV2Adapter = api.createUserscriptEvalBar({
      window,
      document,
      getFen: getEvalBarFen,
      getBoard: getEvalBarBoard,
      getOrientation: getEvalBarOrientation,
      getCacheContext: getEvalBarCacheContext,
      authorize: evalBarAuthorization,
      shouldDisplay: evalBarPresentationAllowed,
      getRoute: () => `${window.location.pathname}${window.location.search}${window.location.hash}`,
      requestEvaluation: requestEvalBarV2,
      addStyle: typeof GM_addStyle === "function" ? css => GM_addStyle(css) : undefined,
      cacheNamespace: "stockfish-19-smallnet-local-white-v1",
    });
    globalThis.__thinkerEvalBarV2 = evalBarV2Adapter;
    return evalBarV2Adapter;
  }

  function getEvalBarDiagnostics() {
    const snapshot = evalBarV2Adapter?.snapshot?.() || null;
    return Object.freeze({
      enabled: evalBarDiagnosticEnabled,
      route: `${window.location.pathname}${window.location.search}${window.location.hash}`,
      boardFound: Boolean(getEvalBarBoard()),
      fen: getEvalBarFen(),
      authorization: evalBarAuthorization(),
      presentationAllowed: evalBarPresentationAllowed(),
      transport: evalBarTransportDiagnostic,
      adapter: snapshot,
    });
  }

  function reportEvalBarDiagnostic(stage, error) {
    if (!evalBarDiagnosticEnabled) return;
    console.warn("[Thinker Eval Bar V2]", stage, getEvalBarDiagnostics(), error || null);
  }

  globalThis.krypbotEvalBarDiagnostics = getEvalBarDiagnostics;
  globalThis.krypbotSetEvalBarDiagnostics = function (enabled) {
    evalBarDiagnosticEnabled = Boolean(enabled);
    localStorage.setItem("evalBarV2Diagnostics", String(evalBarDiagnosticEnabled));
    return getEvalBarDiagnostics();
  };
  const evalBarPageWindow = typeof unsafeWindow === "object" && unsafeWindow ? unsafeWindow : window;
  const redactedEvalBarDiagnostics = () => {
    const diagnostics = getEvalBarDiagnostics();
    const adapter = diagnostics.adapter;
    return Object.freeze({
      enabled: diagnostics.enabled,
      route: diagnostics.route,
      boardFound: diagnostics.boardFound,
      fen: diagnostics.fen,
      authorization: diagnostics.authorization,
      presentationAllowed: diagnostics.presentationAllowed,
      transport: diagnostics.transport ? Object.freeze({
        stage: diagnostics.transport.stage,
        status: diagnostics.transport.status,
        elapsedMs: diagnostics.transport.elapsedMs,
        eventType: diagnostics.transport.eventType,
        depth: diagnostics.transport.depth,
        error: diagnostics.transport.error,
      }) : null,
      adapter: adapter ? Object.freeze({
        route: adapter.route,
        authorization: adapter.authorization,
        boardFound: adapter.boardFound,
        fenAvailable: adapter.fenAvailable,
        state: adapter.state,
        mounted: adapter.mounted,
        geometry: adapter.geometry ? Object.freeze({
          left: adapter.geometry.left,
          top: adapter.geometry.top,
          width: adapter.geometry.width,
          height: adapter.geometry.height,
          placement: adapter.geometry.placement,
        }) : null,
        lastEvaluation: adapter.lastEvaluation ? Object.freeze({
          type: adapter.lastEvaluation.type,
          sequence: adapter.lastEvaluation.sequence,
          cp: adapter.lastEvaluation.cp,
          mate: adapter.lastEvaluation.mate,
          depth: adapter.lastEvaluation.depth,
          engine: adapter.lastEvaluation.engine,
          package: adapter.lastEvaluation.package,
          build: adapter.lastEvaluation.build,
          network: adapter.lastEvaluation.network,
          status: adapter.lastEvaluation.status,
        }) : null,
        lastError: adapter.lastError,
        activeSequence: adapter.activeSequence,
        requestStartedAt: adapter.requestStartedAt,
        requestElapsedMs: adapter.requestElapsedMs,
        lastRequestDurationMs: adapter.lastRequestDurationMs,
        abortCount: adapter.abortCount,
        lastAbortReason: adapter.lastAbortReason,
        renderedFen: adapter.renderedFen,
        visualStale: adapter.visualStale,
        visualFraction: adapter.visualFraction,
        targetFraction: adapter.targetFraction,
        lastFenDetectedAt: adapter.lastFenDetectedAt,
        lastRequestDispatchedAt: adapter.lastRequestDispatchedAt,
        lastFirstEvaluationAt: adapter.lastFirstEvaluationAt,
        lastDetectionToRequestMs: adapter.lastDetectionToRequestMs,
        lastRequestToFirstEvaluationMs: adapter.lastRequestToFirstEvaluationMs,
        staleResultCount: adapter.staleResultCount,
        mountCount: adapter.mountCount,
        boardRetargetCount: adapter.boardRetargetCount,
        lastFirstRenderedFrameAt: adapter.lastFirstRenderedFrameAt,
        lastEvaluationToFirstFrameMs: adapter.lastEvaluationToFirstFrameMs,
        presentation: adapter.presentation ? Object.freeze({
          selected: adapter.presentation.selected ? Object.freeze({
            kind: adapter.presentation.selected.score?.kind,
            value: adapter.presentation.selected.score?.kind === 'mate'
              ? adapter.presentation.selected.score?.mate
              : adapter.presentation.selected.score?.cp,
            fraction: adapter.presentation.selected.fraction,
            label: adapter.presentation.selected.label,
            favoredColor: adapter.presentation.selected.favoredColor,
            depth: adapter.presentation.selected.depth,
          }) : null,
          pending: adapter.presentation.pending ? Object.freeze({
            kind: adapter.presentation.pending.score?.kind,
            value: adapter.presentation.pending.score?.kind === 'mate'
              ? adapter.presentation.pending.score?.mate
              : adapter.presentation.pending.score?.cp,
            fraction: adapter.presentation.pending.fraction,
            label: adapter.presentation.pending.label,
            favoredColor: adapter.presentation.pending.favoredColor,
            depth: adapter.presentation.pending.depth,
          }) : null,
          highestDepth: adapter.presentation.highestDepth,
          lastSelectedAt: adapter.presentation.lastSelectedAt,
          coalescedCount: adapter.presentation.coalescedCount,
          selectedCount: adapter.presentation.selectedCount,
        }) : null,
      }) : null,
    });
  };
  evalBarPageWindow.krypbotEvalBarDiagnostics = redactedEvalBarDiagnostics;

  function syncEvalBarRenderer() {
    if (evalBarV2Enabled) {
      removeEvalBarDOM();
      const adapter = ensureEvalBarV2();
      adapter?.start(evalBarEnabled);
      adapter?.setEnabled(evalBarEnabled);
      return;
    }
    evalBarV2Adapter?.setEnabled(false);
    if (evalBarEnabled && evalBarAuthorization()) injectEvalBarDOM();
    else removeEvalBarDOM();
  }

  function safelySyncEvalBarRenderer() {
    try {
      syncEvalBarRenderer();
      return true;
    } catch (error) {
      try { evalBarV2Adapter?.destroy?.(); } catch (_) {}
      evalBarV2Adapter = null;
      globalThis.__thinkerEvalBarV2 = null;
      debug("eval bar bootstrap isolated", error);
      return false;
    }
  }

  globalThis.krypbotSetEvalBarV2 = function (enabled) {
    evalBarV2Enabled = Boolean(enabled);
    localStorage.setItem("evalBarV2", String(evalBarV2Enabled));
    syncEvalBarRenderer();
  };

  const evalBarEngine = {
    clamp(cp) {
      return Math.max(-1000, Math.min(1000, cp));
    },
    cpToPercent(cp) {
      return 50 + 50 * Math.tanh(cp / 400);
    },
    mateToPercent(mate) {
      const d = Math.abs(mate);
      const saturation = 1 - 1 / (d + 1);
      return mate > 0 ? 50 + saturation * 50 : 50 - saturation * 50;
    },
    update(data) {
      let target;
      if (data.mate !== undefined && data.mate !== null) {
        target = this.mateToPercent(data.mate);
      } else {
        const cp = this.clamp(data.cp || 0);
        target = this.cpToPercent(cp);
      }

      // Atualizar sempre para dar feedback visual instantaneo
      evalBarCurrent = target;
      return evalBarCurrent;
    },
  };

  function requestEval(fen) {
    if (evalBarV2Enabled) return;
    if (!evalBarEnabled) return;
    if (!fen) return;
    if (!evalBarAuthorization()) {
      removeEvalBarDOM();
      return;
    }
    // Sem guard de FEN duplicado aqui - o caller controla
    try {
      GM_xmlhttpRequest({
        method: "POST",
        url: SERVER_URL + "/eval",
        headers: engineRequestHeaders(),
        data: JSON.stringify({ fen: fen }),
        onload: function (resp) {
          try {
            if (handleEngineUnauthorized(resp)) return;
            const data = JSON.parse(resp.responseText);
            if (data) {
              lastEvalData = data;
              lastEvalFen = fen;
              if (evalBarEnabled) {
                evalBarEngine.update(data);
                renderEvalBar();
              }
            }
          } catch (e) {
            debug("log", "[KrypBot] Eval parse error:", e);
          }
        },
        onerror: function (e) {
          debug("log", "[KrypBot] Eval request error:", e);
        },
      });
    } catch (e) {
      debug("log", "[KrypBot] Eval exception:", e);
    }
  }

  function getPlayingSide() {
    // Metodo 1: Atributo flipped do Chess.com (mais confiavel)
    const boardEl =
      document.querySelector("wc-chess-board") ||
      document.querySelector("chess-board") ||
      document.querySelector(".board");

    if (boardEl) {
      const isFlipped =
        boardEl.hasAttribute("flipped") ||
        boardEl.classList.contains("flipped") ||
        boardEl.getAttribute("flipped") === "true" ||
        boardEl.getAttribute("flipped") === "";
      if (isFlipped) return "b";
    }

    // Metodo 2: Verificar as iniciais ou nomes nos componentes de player (opcional/fallback)

    // Metodo 3: URL
    const url = window.location.href;
    if (url.includes("color=black") || url.includes("color=b")) return "b";

    // Metodo 4: API do jogo
    try {
      const { game } = get_cached_game();
      if (game && typeof game.getPlayingAs === "function") {
        const side = game.getPlayingAs();
        if (side === "b" || side === 2 || side === "black") return "b";
      }
    } catch (e) {}

    return "w";
  }

  function getEvalBarOrientation() {
    const board = getEvalBarBoard();
    if (board) {
      const orientation = String(board.getAttribute("orientation") || board.dataset?.orientation || "").toLowerCase();
      if (orientation === "black" || orientation === "b") return "black";
      if (orientation === "white" || orientation === "w") return "white";
      if (board.hasAttribute("flipped") || board.classList.contains("flipped")) return "black";
      const game = board.game || board.gameManager?.game;
      try {
        const side = game?.getPlayingAs?.();
        if (side === "b" || side === 2 || side === "black") return "black";
        if (side === "w" || side === 1 || side === "white") return "white";
      } catch (_) {}
    }
    const url = window.location.href;
    return url.includes("color=black") || url.includes("color=b") ? "black" : "white";
  }

  function renderEvalBar() {
    let bar = document.getElementById("thinker-eval-bar");
    if (!bar) {
      injectEvalBarDOM();
      bar = document.getElementById("thinker-eval-bar");
      if (!bar) return;
    }
    const fill = document.getElementById("thinker-eval-fill");
    const label = document.getElementById("thinker-eval-label");
    if (!fill || !label) return;

    const side = getPlayingSide();
    const isBlack = side === "b";

    // Garante que o bar esteja visivel
    bar.style.display = "flex";
    syncLegacyEvalBarGeometry(bar);

    // evalBarCurrent: 50=igual, >50=vantagem brancas, <50=vantagem pretas
    const pct = Math.max(2, Math.min(98, evalBarCurrent));

    if (isBlack) {
      // Jogando de PRETAS:
      // Queremos que a parte PRETA (background) fique embaixo.
      // Entao o preenchimento BRANCO (fill) deve vir do TOPO.
      fill.style.bottom = "auto";
      fill.style.top = "0";
      fill.style.height = pct + "%";
      fill.style.borderRadius = "5px 5px 0 0";
    } else {
      // Jogando de BRANCAS:
      // Queremos que a parte BRANCA (fill) fique embaixo.
      fill.style.top = "auto";
      fill.style.bottom = "0";
      fill.style.height = pct + "%";
      fill.style.borderRadius = "0 0 5px 5px";
    }

    // Label (Perspectiva do Jogador)
    // Se for preto, invertemos o sinal para que vantagem do jogador seja sempre "+"
    if (lastEvalData.mate !== null && lastEvalData.mate !== undefined) {
      const displayMate = isBlack ? -lastEvalData.mate : lastEvalData.mate;
      label.textContent =
        (displayMate > 0 ? "+" : "") + "M" + Math.abs(displayMate);
    } else {
      let cpVal = (lastEvalData.cp || 0) / 100;
      if (isBlack) cpVal = -cpVal;
      label.textContent = (cpVal >= 0 ? "+" : "") + cpVal.toFixed(1);
    }

    // Cor do label baseada no contraste
    // Se pct > 50 (mais branco), label preto. Se pct < 50 (mais escuro), label branco.
    label.style.color = pct > 50 ? "#1a1a1a" : "#ffffff";
  }

  function syncLegacyEvalBarGeometry(bar) {
    const boardEl = getEvalBarBoard();
    if (!bar || !boardEl) return;
    const rect = boardEl.getBoundingClientRect();
    const width = 28;
    const gap = 6;
    const leftCandidate = rect.left - width - gap;
    const rightCandidate = rect.right + gap;
    const left = leftCandidate >= 0
      ? leftCandidate
      : rightCandidate + width <= window.innerWidth
        ? rightCandidate
        : Math.max(0, rect.left);
    bar.hidden = rect.width <= 0 || rect.height <= 0;
    bar.style.left = left + "px";
    bar.style.top = rect.top + "px";
    bar.style.height = rect.height + "px";
  }

  function injectEvalBarDOM() {
    if (evalBarV2Enabled || !evalBarAuthorization()) return;
    if (document.getElementById("thinker-eval-bar")) return;
    const boardEl =
      document.querySelector("wc-chess-board") ||
      document.querySelector(".board") ||
      document.querySelector("chess-board");
    if (!boardEl) return;
    const barEl = document.createElement("div");
    barEl.id = "thinker-eval-bar";
    barEl.style.cssText =
      "width:28px;background:#1a1a1a;border-radius:6px;position:fixed;overflow:hidden;display:flex;flex-direction:column;justify-content:flex-end;box-shadow:0 2px 12px rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.06);pointer-events:none;z-index:30;";

    const fillEl = document.createElement("div");
    fillEl.id = "thinker-eval-fill";
    fillEl.style.cssText =
      "width:100%;height:50%;background:linear-gradient(to top,#f0f0f0 0%,#ffffff 100%);transition:height 0.6s cubic-bezier(0.22,1,0.36,1);position:absolute;bottom:0;left:0;border-radius:0 0 5px 5px;";

    const labelEl = document.createElement("div");
    labelEl.id = "thinker-eval-label";
    labelEl.style.cssText =
      "position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:10px;font-weight:700;font-family:'Inter',sans-serif;z-index:2;pointer-events:none;text-shadow:0 1px 2px rgba(0,0,0,0.3);white-space:nowrap;";
    labelEl.textContent = "0.0";

    barEl.appendChild(fillEl);
    barEl.appendChild(labelEl);
    document.body.appendChild(barEl);
    syncLegacyEvalBarGeometry(barEl);
  }

  function removeEvalBarDOM() {
    const bar = document.getElementById("thinker-eval-bar");
    if (bar) bar.remove();
  }

  // ===== EVAL BAR POLLING INDEPENDENTE =====
  // Roda a cada 1s, verifica o FEN atual e pede eval
  // Funciona em TODOS os turnos (nosso e do oponente)
  let evalPollingFen = "";
  let lastEvalTime = 0;
  setInterval(() => {
    if (evalBarV2Enabled) return;
    if (!evalBarEnabled && !smartPacingEnabled) return;
    try {
      const { game } = get_cached_game();
      if (!game) return;
      const currentFen = game.getFEN();
      if (!currentFen) return;

      const now = Date.now();
      // Forçar atualização a cada 5s mesmo se o FEN for o mesmo (para garantir sincronia)
      if (currentFen === evalPollingFen && now - lastEvalTime < 5000) return;

      evalPollingFen = currentFen;
      lastEvalTime = now;
      requestEval(currentFen);
    } catch (e) {}
  }, 500);

  const computeDelayValue = () => {
    // PRIORIDADE MAXIMA: modo MAX sempre retorna 0, independente do Smart Pacing
    if (autoDelayMode === "max") return 0;

    // O SmartPacer calcula o atraso final no instante do agendamento.
    if (smartPacingEnabled) return 1;

    // AUTO RUN DELAY (Smart Pacing OFF)
    if (autoDelayMode === "average") {
      let min = parseFloat(autoDelayMin) || DEFAULT_MIN_DELAY;
      let max = parseFloat(autoDelayMax) || DEFAULT_MAX_DELAY;
      return Number(((min + max) / 2).toFixed(2));
    }
    // Modo random
    let min = parseFloat(autoDelayMin) || DEFAULT_MIN_DELAY;
    let max = parseFloat(autoDelayMax) || DEFAULT_MAX_DELAY;
    if (min > max) [min, max] = [max, min];
    const r = Math.random() * (max - min) + min;
    return Number(r.toFixed(2));
  };

  // --- AUTO QUEUE (detecção resiliente de fim de jogo) ---
  let auto_queue_checkInterval = null;
  let auto_queue_mutation_pending = false;
  let auto_queue_click_timer = null;
  let auto_queue_fallback_timer = null;
  let auto_queue_pending = false;
  let queueTriggered = false;
  let auto_queue_completed_fen = "";
  let auto_queue_last_url = window.location.href;

  function isElementVisible(el) {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.visibility !== "hidden" &&
      style.display !== "none" &&
      style.opacity !== "0"
    );
  }

  function normalizeAutoQueueText(value) {
    return (value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  function getSearchTargets() {
    const out = [];
    const seen = new Set();
    const pending = [document.documentElement];
    while (pending.length) {
      const node = pending.shift();
      if (!node || seen.has(node)) continue;
      seen.add(node);
      out.push(node);
      try {
        node.querySelectorAll("*").forEach((child) => {
          if (child.shadowRoot) pending.push(child.shadowRoot);
        });
      } catch (e) {}
      if (node.shadowRoot) pending.push(node.shadowRoot);
    }
    return out;
  }

  function getScopedSearchTargets(root) {
    const out = [];
    const seen = new Set();
    const pending = [root];
    while (pending.length) {
      const node = pending.shift();
      if (!node || seen.has(node)) continue;
      seen.add(node);
      out.push(node);
      if (node.shadowRoot) pending.push(node.shadowRoot);
      try {
        node.querySelectorAll("*").forEach((child) => {
          if (child.shadowRoot) pending.push(child.shadowRoot);
        });
      } catch (e) {}
    }
    return out;
  }

  function queryIn(targets, selector) {
    const out = [];
    targets.forEach((target) => {
      try {
        target.querySelectorAll(selector).forEach((el) => out.push(el));
      } catch (e) {}
    });
    return out;
  }

  const GAME_OVER_SELECTORS = [
    '[data-cy="game-over-modal"]',
    '[data-test-element="game-over-modal"]',
    '[data-cy="game-over-dialog"]',
    ".game-over-modal",
    ".board-modal-container",
    '[class*="game-over-modal"]',
    '[class*="modal-game-over"]',
    '[class*="board-modal-container"]',
  ];

  const GAME_OVER_TEXTS = [
    "voce ganhou",
    "voce perdeu",
    "game over",
    "draw",
    "empate",
    "you won",
    "you lost",
    "vitoria",
    "derrota",
  ];

  function hasGameOverText(el) {
    const text = normalizeAutoQueueText(el.innerText || el.textContent);
    return GAME_OVER_TEXTS.some((label) => text.includes(label));
  }

  function findGameOverRoot(targets) {
    for (const selector of GAME_OVER_SELECTORS) {
      const root = queryIn(targets, selector).find(isElementVisible);
      if (root) return root;
    }

    const modalCandidates = queryIn(
      targets,
      '[role="dialog"], [role="alertdialog"], [class*="game-over"], [class*="board-modal"], [class*="modal-container"], [class*="modal-content"]',
    );
    return (
      modalCandidates.find(
        (candidate) => isElementVisible(candidate) && hasGameOverText(candidate),
      ) || null
    );
  }

  const NEW_GAME_SELECTORS = [
    'button[data-cy="new-game-button"]',
    '[data-test-element="game-over-new-game-button"]',
    '[data-test-element="new-game-button"]',
    '[data-cy="game-over-new-game-button"]',
    '[data-cy="new-game-button"]',
    '[data-cy="game-over-button-new-game"]',
    '.game-over-new-game-button',
    '.new-game-button',
  ];

  const AUTO_QUEUE_SIDEBAR_SELECTORS = [
    ".play-controller-component",
    ".board-layout-sidebar",
    ".layout-board-sidebar",
    "#board-layout-sidebar",
  ];

  const SIDEBAR_NEW_GAME_SELECTORS = [
    'button[data-cy="new-game-button"]',
    '[data-test-element="new-game-button"]',
    '[data-cy="new-game-button"]',
    '[data-cy="game-over-new-game-button"]',
    '[aria-label*="New Game" i]',
    '[aria-label*="Nova Partida" i]',
    '[title*="New Game" i]',
    '[title*="Nova Partida" i]',
    '.new-game-button',
  ];

  const SIDEBAR_START_GAME_SELECTORS = [
    'button[data-cy="start-game-button"]',
    '[data-test-element="start-game-button"]',
    '[data-cy="start-game-button"]',
    '[data-cy="start-game"]',
    '[data-control-view="start-game"]',
    '[aria-label="Start Game" i]',
    '[aria-label="Iniciar Partida" i]',
    '[aria-label="Começar Partida" i]',
    '[title="Start Game" i]',
    '[title="Iniciar Partida" i]',
    '[title="Começar Partida" i]',
    '.start-game-button',
  ];

  const SIDEBAR_POST_GAME_SELECTORS = [
    '[data-cy*="game-review"]',
    '[data-test-element*="game-review"]',
    '[class*="game-review"]',
    '[href*="/analysis"]',
  ];

  const SIDEBAR_REMATCH_ANCHOR_SELECTORS = [
    '[data-test-element="play-again-button"]',
    '[data-test-element="game-over-play-again-button"]',
    '[data-cy="play-again-button"]',
    '[data-cy="game-over-play-again-button"]',
    '[data-control-view="play-again"]',
    '[aria-label*="Play Again" i]',
    '[aria-label*="Rematch" i]',
    '[title*="Play Again" i]',
    '[title*="Rematch" i]',
    '.play-again-button',
    '.game-over-play-again-button',
  ];

  const SIDEBAR_ACTION_SELECTORS = ["button", "a[href]", '[role="button"]'];
  const SIDEBAR_CLICKABLE_SELECTORS = [
    "button",
    "a[href]",
    '[role="button"]',
    '[tabindex]:not([tabindex="-1"])',
    '[class*="button"]',
    '[class*="control"]',
    '[class*="action"]',
  ];
  const SIDEBAR_NEW_GAME_TEXTS = ["new game", "nova partida", "novo jogo"];
  const SIDEBAR_START_GAME_TEXTS = [
    "start game",
    "iniciar partida",
    "comecar partida",
  ];
  const SIDEBAR_POST_GAME_TEXTS = [
    "game review",
    "analise da partida",
    "revisao da partida",
  ];

  const GENERIC_MODAL_BUTTON_SELECTORS = [
    ".ui_button-primary",
    ".game-over-controls button",
    ".game-over-controls a",
    ".game-over-button-button",
    "button",
    "a[href]",
    '[role="button"]',
  ];

  const NEW_GAME_TEXTS = [
    "nova 1 min",
    "nova partida",
    "novo jogo",
    "new game",
    "nova",
    "new",
  ];

  function getButtonText(button) {
    return normalizeAutoQueueText(
      `${button.innerText || button.textContent || ""} ${button.getAttribute("aria-label") || ""} ${button.getAttribute("title") || ""}`,
    );
  }

  function hasRematchSignal(button) {
    if (!button) return false;
    const signal = normalizeAutoQueueText(
      [
        getButtonText(button),
        button.getAttribute("data-cy") || "",
        button.getAttribute("data-test-element") || "",
        button.getAttribute("data-control-view") || "",
        button.getAttribute("class") || "",
      ].join(" "),
    );
    return /(^|[\s_-])(play[\s_-]*again|jogar[\s_-]*(novamente|de[\s_-]*novo)|rematch|revanche|retry|repeat|reload)([\s_-]|$)/i.test(
      signal,
    );
  }

  function hasMoveNavigationSignal(button) {
    if (!button) return false;
    const signal = normalizeAutoQueueText(
      [
        getButtonText(button),
        button.getAttribute("data-cy") || "",
        button.getAttribute("data-test-element") || "",
        button.getAttribute("data-control-view") || "",
        button.getAttribute("aria-controls") || "",
        button.getAttribute("class") || "",
      ].join(" "),
    );
    return /(^|[\s_-])(next|previous|prev|forward|back|first|last|step|ply|move|navigation|pause|paused|resume|unpause|playback|analysis|continue|proxima|proximo|anterior|avancar|voltar|primeira|primeiro|ultima|ultimo|pausar|pausado|retomar|continuar|analise)([\s_-]|$)/i.test(
      signal,
    );
  }

  function isSafeAutoQueueButton(button) {
    if (!button || !button.isConnected || !isElementVisible(button) || button.disabled) return false;
    if (hasRematchSignal(button) || hasMoveNavigationSignal(button)) return false;
    if (
      button.closest(
        '[aria-disabled="true"], [aria-hidden="true"], [disabled], [hidden]',
      )
    )
      return false;
    if (window.getComputedStyle(button).pointerEvents === "none") return false;
    if (button.closest("nav") || button.closest("[class*='menu']")) return false;
    return !/(review|revisao|revisar|analysis|analise|analisar|share|compartilhar|report|denunciar|close|fechar)/i.test(
      getButtonText(button),
    );
  }

  function matchesAutoQueueLabel(text, label) {
    return (
      text === label ||
      text.startsWith(`${label} `) ||
      text.endsWith(` ${label}`) ||
      text.includes(` ${label} `)
    );
  }

  function hasAutoQueueActionSignal(button) {
    const text = getButtonText(button);
    if (NEW_GAME_TEXTS.some((label) => matchesAutoQueueLabel(text, label))) {
      return true;
    }
    const attributes = [
      button.getAttribute("data-cy") || "",
      button.getAttribute("data-test-element") || "",
      button.getAttribute("data-control-view") || "",
      button.getAttribute("class") || "",
    ]
      .join(" ")
      .toLowerCase();
    return /(^|[\s_-])(new|novo|nova)([\s_-]|$)/i.test(
      attributes,
    );
  }

  function findNewGameButton(targets, root) {
    if (!root) return null;
    const modalTargets = getScopedSearchTargets(root);

    for (const selector of NEW_GAME_SELECTORS) {
      const button = queryIn(modalTargets, selector).find(isSafeAutoQueueButton);
      if (button) return button;
    }

    const modalButtons = queryIn(
      modalTargets,
      GENERIC_MODAL_BUTTON_SELECTORS.join(", "),
    ).filter(isSafeAutoQueueButton);

    for (const label of NEW_GAME_TEXTS) {
      const button = modalButtons.find((candidate) =>
        matchesAutoQueueLabel(getButtonText(candidate), label),
      );
      if (button) return button;
    }

    return modalButtons.find(hasAutoQueueActionSignal) || null;
  }

  function findAutoQueueSidebarRoots(targets) {
    const roots = [];
    const seen = new Set();
    for (const selector of AUTO_QUEUE_SIDEBAR_SELECTORS) {
      for (const root of queryIn(targets, selector)) {
        if (!seen.has(root) && isElementVisible(root)) {
          seen.add(root);
          roots.push(root);
        }
      }
    }
    return roots;
  }

  function findSidebarAction(root, selectors, labels) {
    const scopedTargets = getScopedSearchTargets(root);
    for (const selector of selectors) {
      const button = queryIn(scopedTargets, selector).find(isSafeAutoQueueButton);
      if (button) return button;
    }

    const buttons = queryIn(
      scopedTargets,
      SIDEBAR_ACTION_SELECTORS.join(", "),
    ).filter(isSafeAutoQueueButton);
    for (const label of labels) {
      const button = buttons.find((candidate) =>
        matchesAutoQueueLabel(getButtonText(candidate), label),
      );
      if (button) return button;
    }
    return null;
  }

  function hasStartGameSignal(control) {
    const values = [
      control.innerText || "",
      control.textContent || "",
      control.getAttribute("aria-label") || "",
      control.getAttribute("title") || "",
    ].map(normalizeAutoQueueText);
    if (
      values.some((value) => SIDEBAR_START_GAME_TEXTS.includes(value))
    )
      return true;
    const attributes = normalizeAutoQueueText(
      [
        control.getAttribute("data-cy") || "",
        control.getAttribute("data-test-element") || "",
        control.getAttribute("data-control-view") || "",
        control.getAttribute("class") || "",
      ].join(" "),
    );
    return /(^|[\s_-])start[\s_-]*game([\s_-]|$)/i.test(attributes);
  }

  function findStartGameButton(root) {
    const scopedTargets = getScopedSearchTargets(root);
    for (const selector of SIDEBAR_START_GAME_SELECTORS) {
      const button = queryIn(scopedTargets, selector).find(
        (candidate) =>
          isPotentialSidebarControl(candidate) &&
          isSafeAutoQueueButton(candidate) &&
          hasStartGameSignal(candidate),
      );
      if (button) return button;
    }
    return (
      queryIn(scopedTargets, SIDEBAR_CLICKABLE_SELECTORS.join(", ")).find(
        (candidate) =>
          isPotentialSidebarControl(candidate) &&
          isSafeAutoQueueButton(candidate) &&
          hasStartGameSignal(candidate),
      ) || null
    );
  }

  function hasPostGameSidebarContext(root) {
    const text = normalizeAutoQueueText(root.innerText || root.textContent || "");
    if (SIDEBAR_POST_GAME_TEXTS.some((label) => text.includes(label))) return true;
    const scopedTargets = getScopedSearchTargets(root);
    return SIDEBAR_POST_GAME_SELECTORS.some((selector) =>
      queryIn(scopedTargets, selector).some(isElementVisible),
    );
  }

  function isPotentialSidebarControl(control) {
    if (!control || !control.isConnected || !isElementVisible(control) || control.disabled) {
      return false;
    }
    if (
      control.closest(
        '[aria-disabled="true"], [aria-hidden="true"], [disabled], [hidden]',
      )
    )
      return false;
    const style = window.getComputedStyle(control);
    if (style.pointerEvents === "none") return false;
    const tagName = (control.tagName || "").toLowerCase();
    const tabIndex = control.getAttribute("tabindex");
    return (
      tagName === "button" ||
      (tagName === "a" && control.getAttribute("href") !== null) ||
      control.getAttribute("role") === "button" ||
      (tabIndex !== null && tabIndex !== "-1") ||
      style.cursor === "pointer"
    );
  }

  function findRematchAnchor(scopedTargets) {
    for (const selector of SIDEBAR_REMATCH_ANCHOR_SELECTORS) {
      const control = queryIn(scopedTargets, selector).find(
        (candidate) =>
          isPotentialSidebarControl(candidate) && hasRematchSignal(candidate),
      );
      if (control) return control;
    }
    return (
      queryIn(scopedTargets, SIDEBAR_CLICKABLE_SELECTORS.join(", ")).find(
        (candidate) =>
          isPotentialSidebarControl(candidate) && hasRematchSignal(candidate),
      ) || null
    );
  }

  function findSidebarPlusButton(root) {
    if (!hasPostGameSidebarContext(root)) return null;
    const scopedTargets = getScopedSearchTargets(root);
    const rematchAnchor = findRematchAnchor(scopedTargets);
    if (!rematchAnchor) return null;
    const anchorRect = rematchAnchor.getBoundingClientRect();
    const leftPeers = queryIn(
      scopedTargets,
      SIDEBAR_CLICKABLE_SELECTORS.join(", "),
    )
      .filter(
        (control) =>
          control !== rematchAnchor &&
          isPotentialSidebarControl(control) &&
          isSafeAutoQueueButton(control),
      )
      .map((button) => ({ button, rect: button.getBoundingClientRect() }))
      .filter(
        ({ rect }) =>
          rect.right <= anchorRect.left &&
          rect.top < anchorRect.bottom &&
          rect.bottom > anchorRect.top,
      )
      .sort(
        (left, right) =>
          right.rect.right - left.rect.right ||
          right.rect.width * right.rect.height - left.rect.width * left.rect.height,
      );
    if (!leftPeers.length) return null;
    const explicitPlus = leftPeers.find(
      ({ button }) =>
        getButtonText(button) === "+" ||
        /(^|[\s_-])plus([\s_-]|$)/i.test(
          [
            button.getAttribute("data-cy") || "",
            button.getAttribute("data-test-element") || "",
            button.getAttribute("class") || "",
          ].join(" "),
        ),
    );
    return (explicitPlus || leftPeers[0]).button;
  }

  function resolveAutoQueueTarget(targets) {
    const modalRoot = findGameOverRoot(targets);
    if (modalRoot) {
      const modalButton = findNewGameButton(targets, modalRoot);
      if (modalButton) return { source: "modal", root: modalRoot, button: modalButton };
    }

    const allSidebarRoots = findAutoQueueSidebarRoots(targets);
    for (const root of allSidebarRoots) {
      const button = findStartGameButton(root);
      if (button) return { source: "sidebar-start-game", root, button };
    }

    const sidebarRoots = allSidebarRoots.filter(hasPostGameSidebarContext);
    for (const root of sidebarRoots) {
      const button = findSidebarAction(
        root,
        SIDEBAR_NEW_GAME_SELECTORS,
        SIDEBAR_NEW_GAME_TEXTS,
      );
      if (button) return { source: "sidebar-new-game", root, button };
    }
    for (const root of sidebarRoots) {
      const button = findSidebarPlusButton(root);
      if (button) return { source: "sidebar-plus", root, button };
    }
    return null;
  }

  function getAutoQueueFen() {
    try {
      const { game } = get_cached_game();
      return game && typeof game.getFEN === "function" ? game.getFEN() || "" : "";
    } catch (e) {
      return "";
    }
  }

  function resetAutoQueueTrigger() {
    queueTriggered = false;
    auto_queue_pending = false;
    auto_queue_completed_fen = "";
    if (auto_queue_click_timer) {
      clearTimeout(auto_queue_click_timer);
      auto_queue_click_timer = null;
    }
    if (auto_queue_fallback_timer) {
      clearTimeout(auto_queue_fallback_timer);
      auto_queue_fallback_timer = null;
    }
  }

  function refreshAutoQueueGameState(targets) {
    if (window.location.href !== auto_queue_last_url) {
      auto_queue_last_url = window.location.href;
      resetAutoQueueTrigger();
      return;
    }
    if (!queueTriggered) return;
    const root = findGameOverRoot(targets || getSearchTargets());
    if (root) return;
    const currentFen = getAutoQueueFen();
    if (
      currentFen &&
      (!auto_queue_completed_fen || currentFen !== auto_queue_completed_fen)
    ) {
      resetAutoQueueTrigger();
    }
  }

  function clickAutoQueueTarget(target, allowFallback = true) {
    if (!target) return;
    try {
      target.scrollIntoView({ block: "center", inline: "center" });
    } catch (e) {}

    let nativeClickCompleted = false;
    try {
      target.click();
      nativeClickCompleted = true;
    } catch (e) {}

    if (!nativeClickCompleted) {
      try {
        target.dispatchEvent(
          new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            composed: true,
            view: window,
          }),
        );
      } catch (e) {}
      return;
    }

    if (!allowFallback) return;
    const clickUrl = window.location.href;
    auto_queue_fallback_timer = setTimeout(() => {
      auto_queue_fallback_timer = null;
      if (
        !sessionControlBridge.effectiveAutoQueue(auto_queue) ||
        !queueTriggered ||
        window.location.href !== clickUrl ||
        !target.isConnected ||
        !isElementVisible(target)
      )
        return;
      const latestTargets = getSearchTargets();
      const latestResolution = resolveAutoQueueTarget(latestTargets);
      if (!latestResolution || latestResolution.button !== target) return;
      try {
        target.dispatchEvent(
          new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            composed: true,
            view: window,
          }),
        );
      } catch (e) {}
    }, 1000);
  }

  function clickNewGame() {
    const effectiveAutoQueue = sessionControlBridge.effectiveAutoQueue(auto_queue);
    if (!effectiveAutoQueue) return;
    if (sessionControlBridge.ownsQueue() && !sessionControlBridge.queueGate(effectiveAutoQueue).allowed) return;
    const targets = getSearchTargets();
    refreshAutoQueueGameState(targets);
    if (queueTriggered || auto_queue_pending) return;

    const resolution = resolveAutoQueueTarget(targets);
    if (!resolution) return;

    auto_queue_pending = true;
    const delay = 1500 + Math.floor(Math.random() * 501);
    auto_queue_click_timer = setTimeout(() => {
      auto_queue_click_timer = null;
      auto_queue_pending = false;
      const currentEffectiveAutoQueue = sessionControlBridge.effectiveAutoQueue(auto_queue);
      if (!currentEffectiveAutoQueue) return;
      const latestTargets = getSearchTargets();
      const latestResolution = resolveAutoQueueTarget(latestTargets);
      if (!latestResolution) return;
      const target = latestResolution.button;
      if (sessionControlBridge.ownsQueue()) {
        sessionControlBridge.executeQueue(currentEffectiveAutoQueue, () => {
          queueTriggered = true;
          auto_queue_completed_fen = getAutoQueueFen();
          clickAutoQueueTarget(target, false);
        }).catch((error) => log("Session Control Auto Queue: " + error));
        return;
      }
      queueTriggered = true;
      auto_queue_completed_fen = getAutoQueueFen();
      clickAutoQueueTarget(target, latestResolution.source === "modal");
    }, delay);
  }

  function startGameOverObserver() {
    if (auto_queue_observer) auto_queue_observer.disconnect();

    auto_queue_observer = new MutationObserver(() => {
      if (!sessionControlBridge.effectiveAutoQueue(auto_queue) || auto_queue_mutation_pending) return;
      auto_queue_mutation_pending = true;
      setTimeout(() => {
        auto_queue_mutation_pending = false;
        clickNewGame();
      }, 200);
    });

    const observeTargets = [
      document.body,
      ...getSearchTargets().filter((target) => target instanceof ShadowRoot),
    ].filter(Boolean);
    observeTargets.forEach((target) => {
      try {
        auto_queue_observer.observe(target, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ["class", "style", "aria-hidden", "disabled"],
        });
      } catch (e) {}
    });
  }

  function handleAutoQueue() {
    if (auto_queue_checkInterval) {
      clearInterval(auto_queue_checkInterval);
      auto_queue_checkInterval = null;
    }
    if (auto_queue_observer) {
      auto_queue_observer.disconnect();
      auto_queue_observer = null;
    }
    if (!sessionControlBridge.effectiveAutoQueue(auto_queue)) {
      auto_queue_pending = false;
      if (auto_queue_click_timer) {
        clearTimeout(auto_queue_click_timer);
        auto_queue_click_timer = null;
      }
      if (auto_queue_fallback_timer) {
        clearTimeout(auto_queue_fallback_timer);
        auto_queue_fallback_timer = null;
      }
      return;
    }

    startGameOverObserver();
    clickNewGame();
    auto_queue_checkInterval = setInterval(clickNewGame, 1000);
  }

  function cleanCache() {
    if (moveCache.size > 100) {
      const keys = Array.from(moveCache.keys());
      keys.slice(0, 50).forEach((k) => moveCache.delete(k));
    }
  }

  const getSmartPacerClockValues = () => {
    const fallback = {
      userTime: null,
      opponentTime: null,
      hasClockData: false,
    };
    const board = document.querySelector?.(
      "wc-chess-board, chess-board, #board-single, .chess-board-wrapper, .board-wrapper, .board, .chess-board, [class*='board-component']",
    );
    const root = board?.closest?.(
      "#board-layout-main, .board-layout-main, .board-layout, main, .puzzle-layout, .puzzle-container",
    ) || document;
    const selector = [
      ".clock-component .clock-time-component",
      ".clock-component .clock-time",
      ".clock-time-component",
      ".clock-time",
      "[class*='clock-time']",
      "[data-testid='clock']",
      "[data-cy*='clock']",
      "[data-test-element*='clock']",
      "wc-chess-clock",
    ].join(",");
    const extractClockText = (value) => {
      const text = String(value || "").trim().replace(",", ".");
      const colonMatch = text.match(/(?:^|\s)(\d{1,3}:\d{2}(?:\.\d+)?)(?:\s|$)/);
      if (colonMatch) return colonMatch[1];
      return /^\d+(?:\.\d+)?$/.test(text) ? text : null;
    };
    const isActuallyVisible = (node) => {
      let current = node;
      while (current && current.nodeType !== 9) {
        if (current.hidden || current.getAttribute?.("aria-hidden") === "true") return false;
        if (typeof window !== "undefined" && typeof window.getComputedStyle === "function") {
          const style = window.getComputedStyle(current);
          if (style?.display === "none" || style?.visibility === "hidden" || Number(style?.opacity) === 0) return false;
        }
        current = current.parentElement;
      }
      return true;
    };
    const boardRect = typeof board?.getBoundingClientRect === "function" ? board.getBoundingClientRect() : null;
    const seen = new Set();
    const rootClockNodes = Array.from(root.querySelectorAll(selector));
    const clockNodes = root !== document && rootClockNodes.length < 2
      ? rootClockNodes.concat(Array.from(document.querySelectorAll(selector)))
      : rootClockNodes;
    const clocks = Array.from(new Set(clockNodes))
      .map((clock) => {
        const container = clock.closest?.(
          ".clock-component, [class*='clock-component'], [data-testid='clock'], wc-chess-clock, [class*='player-row'], [class*='player-component']",
        ) || clock;
        const rect =
          typeof container.getBoundingClientRect === "function"
            ? container.getBoundingClientRect()
            : null;
        return {
          text: extractClockText(clock.textContent),
          rect,
          container,
          visible: isActuallyVisible(clock) && (!rect || (rect.width > 0 && rect.height > 0)),
        };
      })
      .filter((clock) => {
        if (!clock.text || !clock.visible) return false;
        try { smartPacer.parseTime(clock.text); return true; } catch (error) { return false; }
      })
      .filter((clock) => {
        if (boardRect && clock.rect) {
          const verticalSlack = Math.max(120, boardRect.height * 0.25);
          if (clock.rect.bottom < boardRect.top - verticalSlack || clock.rect.top > boardRect.bottom + verticalSlack) return false;
        }
        const geometry = clock.rect
          ? `${Math.round(clock.rect.left || 0)}:${Math.round(clock.rect.top || 0)}:${Math.round(clock.rect.width || 0)}:${Math.round(clock.rect.height || 0)}`
          : "no-rect";
        const key = `${clock.text}|${geometry}`;
        if (seen.has(clock.container) || seen.has(key)) return false;
        seen.add(clock.container);
        seen.add(key);
        return true;
      })
      .sort((a, b) => {
        if (!a.rect || !b.rect) return 0;
        return a.rect.top - b.rect.top;
      });
    if (clocks.length < 2) return fallback;
    return {
      userTime: clocks[clocks.length - 1].text,
      opponentTime: clocks[0].text,
      hasClockData: true,
    };
  };

  const deriveSmartPacerPhase = (fen) => {
    if (typeof fen !== "string") return "middlegame";
    const fields = fen.trim().split(/\s+/);
    const ranks = (fields[0] || "").split("/");
    const validPlacement = ranks.length === 8 && ranks.every((rank) => {
      if (!/^(?:[prnbqkPRNBQK1-8])+$/.test(rank)) return false;
      return Array.from(rank).reduce((sum, token) => sum + (/\d/.test(token) ? Number(token) : 1), 0) === 8;
    });
    if (fields.length < 6 || !validPlacement || !/^[wb]$/.test(fields[1]) || !Number.isFinite(Number(fields[5]))) return "middlegame";
    const pieces = fields[0].replace(/[\d/]/g, "");
    const fullmove = Number(fields[5]);
    const values = { n: 3, b: 3, r: 5, q: 9 };
    const nonPawnMaterial = Array.from(pieces).reduce((total, piece) => total + (values[piece.toLowerCase()] || 0), 0);
    if (Number.isFinite(fullmove) && fullmove <= 8 && nonPawnMaterial >= 40) return "opening";
    if (nonPawnMaterial <= 20 || pieces.length <= 10) return "endgame";
    return "middlegame";
  };

  const isSmartPacerTimeTrouble = (userTime) => {
    if (userTime === null || userTime === undefined || userTime === "") return false;
    try { return smartPacer.parseTime(userTime) < 10000; }
    catch (error) { return false; }
  };

  const auto_move_piece = function (
    from,
    to,
    board,
    baseDelaySeconds = 0,
    {
      expectedFen = null,
      useSmartPacing = true,
      forceImmediate = false,
      shouldExecute = () => true,
      analysis = null,
      pacingDecision = null,
      promotion = null,
      onOutcome = null,
      dispatchEffect = (effect) => effect(),
      positionObservedAt = null,
      clockValues = null,
    } = {},
  ) {
    smartPacer.cancel();
    if (!board) return null;

    const getGame = () => resolveThinkerBoardGame(board);
    const scheduledGame = getGame();
    const normalizedPromotion = typeof promotion === "string" && /^[qrbn]$/i.test(promotion)
      ? promotion.toLowerCase()
      : null;
    const movePromotion = (move) => {
      if (!move) return null;
      const raw = move.promotion ?? move.promotionPiece ?? move.uci?.slice?.(4, 5) ?? null;
      if (typeof raw === "string") return raw.toLowerCase().slice(0, 1);
      return null;
    };
    const findMove = (game) => {
      if (!game || typeof game.getLegalMoves !== "function") return null;
      try {
        return (
          game
            .getLegalMoves()
            .find((move) =>
              move.from == from &&
              move.to == to &&
              (normalizedPromotion === null || movePromotion(move) === normalizedPromotion),
            ) || null
        );
      } catch (error) {
        return null;
      }
    };
    const executeMove = () => dispatchEffect(() => {
      const game = getGame();
      if (game !== scheduledGame || !shouldExecute()) return false;
      if (expectedFen !== null && (typeof game.getFEN !== "function" || game.getFEN() !== expectedFen)) return false;
      const move = findMove(game);
      if (!move || typeof game.move !== "function") return false;
      game.move({ ...move, promotion: normalizedPromotion || "q", animate: false, userGenerated: true });
      if (typeof onOutcome === "function") onOutcome({ outcome: "executed", pacingDecision });
      return true;
    });

    const game = scheduledGame;
    const legalMoves =
      game && typeof game.getLegalMoves === "function"
        ? (() => {
            try {
              return game.getLegalMoves();
            } catch (error) {
              return [];
            }
          })()
        : [];
    if (!legalMoves.some((move) =>
      move.from == from &&
      move.to == to &&
      (normalizedPromotion === null || movePromotion(move) === normalizedPromotion),
    )) {
      return null;
    }

    const delaySeconds = Number(baseDelaySeconds);
    const reportOutcome = outcome => {
      if (outcome === false || outcome?.allowed === false) {
        thinkerMoveDiagnostic = { stage: "move-execution-rejected", status: null };
        if (expectedFen !== null && checkfen === expectedFen) checkfen = "";
        moveRetryAfter = Date.now() + 1000;
      } else if (outcome === true) thinkerMoveDiagnostic = { stage: "move-executed", status: null };
      return outcome;
    };
    const reportFailure = error => {
      reportOutcome(false);
      if (error?.name !== "AbortError") log("SmartPacer erro: " + error);
    };
    if (forceImmediate || (!useSmartPacing && (!Number.isFinite(delaySeconds) || delaySeconds <= 0))) {
      const outcome = executeMove();
      if (outcome?.then) outcome.then(reportOutcome).catch(reportFailure);
      else reportOutcome(outcome);
      return outcome;
    }

    const scheduledFen = (() => {
      try { return game && typeof game.getFEN === "function" ? game.getFEN() : expectedFen; }
      catch (error) { return expectedFen; }
    })();
    const pacingClocks = clockValues || getSmartPacerClockValues();
    const complexityMultiplier = Number(analysis?.complexityMultiplier);
    const scheduled = smartPacer.schedule(executeMove, {
      userTime: pacingClocks.userTime,
      opponentTime: pacingClocks.opponentTime,
      baseDelayMs: delaySeconds * 1000,
      phase: deriveSmartPacerPhase(scheduledFen),
      complexityMultiplier: Number.isFinite(complexityMultiplier) ? complexityMultiplier : 1,
      isForced: legalMoves.length <= 1 || analysis?.isForced === true,
      targetTotalMs: pacingDecision?.targetTotalMs,
      technicalElapsedMs: pacingDecision?.technicalElapsedMs,
      positionObservedAt,
    }, {
      exactDelay: !useSmartPacing,
    });
    if (useSmartPacing) {
      log(
        `Smart Pacing | relogio=${pacingClocks.userTime ?? "?"} | fase=${deriveSmartPacerPhase(scheduledFen)} | ` +
        `complexidade=${Number.isFinite(complexityMultiplier) ? complexityMultiplier.toFixed(2) : "1.00"} | ` +
        `alvo=${scheduled.targetDelayMs}ms | motor=${Math.round(scheduled.elapsedMs)}ms | espera=${scheduled.delayMs}ms`,
      );
    }
    scheduled.promise.then(reportOutcome).catch(reportFailure);
    return scheduled;
  };

  const get_number = (elm) => {
    const data = ["a", "b", "c", "d", "e", "f", "g", "h"];
    return data.indexOf(elm) + 1;
  };

  const create_elm = (num, board) => {
    if (!board) return;
    const elm = document.createElement("div");
    elm.setAttribute("class", `highlight square-${num} myhigh`);
    $(elm).css({
      opacity: "0.85",
      border: `3px solid ${current_color}`,
      background: `${current_color}26`,
      "border-radius": "25%",
      "box-shadow": `0 4px 12px ${current_color}33`,
      "z-index": "10",
      transition: "all 0.3s ease",
    });
    $(board).append(elm);
  };

  const create_div = (str1) => {
    try {
      const target =
        cached_board ||
        $("chess-board")[0] ||
        $("wc-chess-board")[0] ||
        $(".board")[0] ||
        $(".chess-board")[0] ||
        $("[class*='board-component']")[0] ||
        $("wc-board")[0];

      if (!target) return;
      $(".myhigh").remove();
      $(".myarrow").remove();

      if (!str1 || str1.length < 4) return;

      const a = get_number(str1[0]);
      const row1 = parseInt(str1[1]);
      const b = get_number(str1[2]);
      const row2 = parseInt(str1[3]);

      create_elm(a + str1[1], target);
      create_elm(b + str1[3], target);

      const isFlipped =
        $(target).hasClass("flipped") ||
        $(target).attr("orientation") === "black";
      const getCoord = (col, row) => {
        const x = isFlipped ? (8 - col) * 12.5 + 6.25 : (col - 1) * 12.5 + 6.25;
        const y = isFlipped ? (row - 1) * 12.5 + 6.25 : (8 - row) * 12.5 + 6.25;
        return [x, y];
      };

      const [x1, y1] = getCoord(a, row1);
      const [x2, y2] = getCoord(b, row2);

      const markerId =
        "arrowhead-" + a + row1 + b + row2 + Math.floor(Math.random() * 1000);
      $(target).append(`
        <svg viewBox="0 0 100 100" class='myarrow' style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 11; filter: drop-shadow(0 4px 8px ${current_color}66); transition: all 0.3s ease;">
          <defs>
            <marker id="${markerId}" markerWidth="4" markerHeight="4" refX="2.6" refY="2" orient="auto">
              <path d="M0,0.5 L3,2 L0,3.5 L0.5,2 Z" fill="${current_color}" style="transition: fill 0.3s ease" />
            </marker>
          </defs>
          <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"
                stroke="${current_color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#${markerId})" style="transition: stroke 0.3s ease" />
        </svg>
      `);
    } catch (e) {
      log("Erro: " + e);
    }
  };

  let cached_board = null;
  let cached_game = null;
  let moveRetryAfter = 0;
  let thinkerMoveDiagnostic = { stage: "idle", status: null };

  function resolveThinkerBoardGame(board) {
    if (!board) return null;
    const read = (get) => { try { const game = get(); return typeof game?.getFEN === "function" ? game : null; } catch (_) { return null; } };
    const direct = read(() => board.game) || read(() => board.gameManager?.game);
    if (direct) return direct;
    let keys;
    try { keys = []; for (const key in board) keys.push(key); } catch (_) { return null; }
    for (const key of keys) {
      const game = read(() => board[key]);
      if (game) return game;
    }
    return null;
  }

  function findThinkerGameBoard() {
    const selector = "wc-chess-board, chess-board, wc-board, #board-single, .board, .chess-board, [class*='board-component']";
    const pageDocument = typeof unsafeWindow === "object" && unsafeWindow?.document ? unsafeWindow.document : document;
    const candidates = Array.from(pageDocument.querySelectorAll(selector));
    let selected = null, best = -1;
    for (const board of candidates) {
      if (!isRenderableThinkerLayoutNode(board, { minWidth: 200, minHeight: 200 })) continue;
      const rect = board.getBoundingClientRect();
      const inViewport = rect.bottom > 0 && rect.right > 0 && rect.top < window.innerHeight && rect.left < window.innerWidth;
      const score = (inViewport ? 10000000 : 0) + (resolveThinkerBoardGame(board) ? 2000000 : 0) + (/^(WC-CHESS-BOARD|CHESS-BOARD|WC-BOARD)$/.test(board.tagName || "") ? 1000000 : 0) + Math.min(rect.width * rect.height, 999999);
      if (score > best) { selected = board; best = score; }
    }
    return selected;
  }

  function get_cached_game() {
    const cachedRect = cached_board?.getBoundingClientRect?.();
    if (cached_game && cached_board && document.body.contains(cached_board) &&
        cachedRect?.bottom > 0 && cachedRect.right > 0 && cachedRect.top < window.innerHeight && cachedRect.left < window.innerWidth &&
        isRenderableThinkerLayoutNode(cached_board, { minWidth: 200, minHeight: 200 }) &&
        resolveThinkerBoardGame(cached_board) === cached_game) {
      return { board: cached_board, game: cached_game };
    }
    cached_board = findThinkerGameBoard();
    cached_game = resolveThinkerBoardGame(cached_board);
    return { board: cached_board, game: cached_game };
  }

  function request_move() {
    if (!can_interval || Date.now() < moveRetryAfter) return;

    const isPuzzleMode = gameMode === "puzzle";
    const shouldRun = isMasterEnabled() && (isPuzzleMode ? puzzleHint || puzzleAutoMove : true);
    if (!shouldRun) return;

    try {
      const { board, game } = get_cached_game();

      if (!board || !game) {
        thinkerMoveDiagnostic = { stage: board ? "game-api-unavailable" : "board-unavailable", status: null };
        return;
      }

      fen = game.getFEN();
      const requestFen = fen;
      const requestAutoMove = auto_move;
      const requestPuzzleAutoMove = isPuzzleMode && puzzleAutoMove;
      const retryMove = () => {
        if (checkfen === requestFen) checkfen = "";
        moveRetryAfter = Date.now() + 1000;
        can_interval = true;
      };
      const positionObservedAt = observeSmartPacingPosition(fen);

      if (!isPuzzleMode) {
        const normalizeSide = value => ({ white: "w", black: "b", w: "w", b: "b" })[String(value || "").toLowerCase()] || null;
        const turn = normalizeSide(typeof game.getTurn === "function" ? game.getTurn() : null) || fen.split(" ")[1];
        let side = normalizeSide(typeof game.getPlayingAs === "function" ? game.getPlayingAs() : null);

        // Detectar cor do jogador se getPlayingAs() retornar algo invÃ¡lido
        if (!side || side === null || side === undefined) {
          const url = window.location.href;
          if (url.includes("color=white") || url.includes("color=w"))
            side = "w";
          else if (url.includes("color=black") || url.includes("color=b"))
            side = "b";

          if (!side) side = turn;
        }

        if (turn !== side) {
          thinkerMoveDiagnostic = { stage: "waiting-turn", status: null };
          $(".myhigh, .myarrow").remove();
          return;
        }
      }

      if (fen === checkfen) return;

      const puzzleElo = 3200;
      if (!isPuzzleMode && isLegacyAutoAdjustEffective()) {
        refreshAutoAdjustOpponentRating();
      }
      const legacyElo = isPuzzleMode
        ? puzzleElo
        : isLegacyAutoAdjustEffective()
          ? autoAdjust.getCurrentDifficulty()
          : chessBot.elo;
      const currentElo = isPuzzleMode ? legacyElo : sessionControlBridge.moveSelectionElo(legacyElo);
      const cacheKey = fen + "_" + currentElo;
      const currentCache = isPuzzleMode ? puzzleMoveCache : moveCache;
      const capturedSessionMove = !isPuzzleMode && sessionControlBridge.isActive() ? sessionControlBridge.captureMove(sessionControlBridge.effectiveAutoMove(auto_move)) : null;
      const effectiveAutoMove = sessionControlBridge.effectiveAutoMove(auto_move);
      const isAutoMove = isPuzzleMode ? isMasterEnabled() && puzzleAutoMove : capturedSessionMove ? capturedSessionMove.gate.allowed : effectiveAutoMove;
      const clockValues = getSmartPacerClockValues();
      const autoMoveOptions = {
        expectedFen: fen,
        useSmartPacing: smartPacingEnabled,
        forceImmediate: !smartPacingEnabled && autoDelayMode === "max",
        positionObservedAt,
        clockValues,
        shouldExecute: () =>
          isPuzzleMode ? isMasterEnabled() && puzzleAutoMove : capturedSessionMove ? sessionControlBridge.movePrecheck(capturedSessionMove) : sessionControlBridge.effectiveAutoMove(auto_move) && gameMode !== "puzzle",
        dispatchEffect: (effect) => capturedSessionMove ? sessionControlBridge.executeMove(capturedSessionMove, effect) : effect(),
      };
      const sessionV2Active = !isPuzzleMode && sessionControlBridge.isActive();
      const v2Observation = !isPuzzleMode && (smartPacingV2Enabled || smartPacingV2ShadowEnabled || sessionV2Active)
        ? beginSmartPacingV2Observation(fen, game)
        : null;
      if (v2Observation && smartPacingV2ShadowEnabled && !smartPacingV2Enabled && !sessionV2Active) {
        requestSmartPacingV2Plan({ fen, elo: currentElo, clockValues, observation: v2Observation })
          .then(({ plan, budget }) => {
            const decision = decideSmartPacingV2(plan, budget, v2Observation.observedAtMonoMs);
            log(`Smart Pacing V2 shadow | classe=${decision.class} | alvo=${decision.targetTotalMs}ms | status=${plan.status}`);
          })
          .catch((error) => {
            if (error?.name !== "AbortError") log("Smart Pacing V2 shadow: " + error);
          });
      }
      const analysisPromise =
        smartPacingEnabled &&
        !smartPacingV2Enabled &&
        isAutoMove &&
        !isSmartPacerTimeTrouble(clockValues.userTime)
          ? requestSmartPacingAnalysis(fen)
          : null;
      const scheduleAutoMove = (move, onInvalid = null, v2Options = null) => {
        const perform = (analysis) => {
          const scheduledMove = auto_move_piece(
            move.substring(0, 2),
            move.substring(2, 4),
            board,
            v2Options ? 0 : chessBot.time,
            { ...autoMoveOptions, analysis, ...(v2Options || {}) },
          );
          if (scheduledMove === null || scheduledMove === false) {
            thinkerMoveDiagnostic = { stage: "move-api-rejected", status: null };
            currentCache.delete(cacheKey);
            retryMove();
            if (typeof onInvalid === "function") onInvalid();
          } else if (scheduledMove?.promise) thinkerMoveDiagnostic = { stage: "move-scheduled", status: null };
          return scheduledMove;
        };
        if (!analysisPromise) return perform(null);
        analysisPromise.then(perform).catch((error) => {
          if (error?.name !== "AbortError") perform(null);
        });
        return analysisPromise;
      };

      if (v2Observation && (smartPacingV2Enabled || sessionV2Active)) {
        checkfen = fen;
        can_interval = false;
        requestSmartPacingV2Plan({ fen, elo: currentElo, clockValues, observation: v2Observation })
          .then(({ plan, budget }) => {
            if (
              v2Observation.positionRevision !== smartPacingV2Runtime.positionRevision ||
              requestFen !== smartPacingV2Runtime.fen ||
              !isMasterEnabled() || game.getFEN() !== requestFen || auto_move !== requestAutoMove
            ) {
              retryMove();
              return;
            }
            if (plan.status === "terminal") return;
            if (!plan.move || plan.status === "error") { retryMove(); return; }
            const pacingDecision = decideSmartPacingV2(plan, budget, v2Observation.observedAtMonoMs);
            log(
              `Smart Pacing V2 | classe=${pacingDecision.class} | alvo=${pacingDecision.targetTotalMs}ms | ` +
              `motor=${pacingDecision.technicalElapsedMs}ms | reserva=${pacingDecision.reserveMs}ms`,
            );
            if (isAutoMove) {
              $(".myhigh, .myarrow").remove();
              scheduleAutoMove(plan.move, null, {
                pacingDecision,
                promotion: plan.move.length === 5 ? plan.move[4] : null,
                onOutcome: commitSmartPacingV2Outcome,
              });
            } else {
              create_div(plan.move);
            }
          })
          .catch((error) => {
            if (error?.name !== "AbortError") log("Smart Pacing V2: " + error);
            retryMove();
          })
          .finally(() => {
            can_interval = true;
          });
        return;
      }

      if (currentCache.has(cacheKey)) {
        const cached = currentCache.get(cacheKey);
        chessBot.time = computeDelayValue(game);
        if (isAutoMove) {
          $(".myhigh, .myarrow").remove();
          checkfen = fen;
          scheduleAutoMove(cached, () => {
            currentCache.delete(cacheKey);
            checkfen = "";
          });
        } else {
          checkfen = fen;
          create_div(cached);
          thinkerMoveDiagnostic = { stage: "recommendation", status: null };
        }
        return;
      }

      checkfen = fen;
      can_interval = false;

      // Solicitar avaliacao para Eval Bar e Smart Pacing
      requestEval(fen);

      chessBot.time = computeDelayValue(game);
      log(`Modo: ${gameMode} | Delay: ${chessBot.time}s | Elo: ${currentElo}`);
      log("Enviando request para " + SERVER_URL + "/getmove");
      thinkerMoveDiagnostic = { stage: "requesting", status: null };

      GM_xmlhttpRequest({
        method: "POST",
        url: SERVER_URL + "/getmove",
        headers: engineRequestHeaders(),
        data: JSON.stringify({
          fen: fen,
          elo: currentElo,
          time: chessBot.time,
        }),
        onload: function (resp) {
          thinkerMoveDiagnostic = { stage: "response", status: Number(resp.status) || null };
          try {
            if (handleEngineUnauthorized(resp)) {
              retryMove();
              return;
            }
            if (resp.status < 200 || resp.status >= 300) { retryMove(); return; }
            if (!isMasterEnabled() || board.isConnected === false || game.getFEN() !== requestFen || auto_move !== requestAutoMove || (isPuzzleMode && (puzzleAutoMove !== requestPuzzleAutoMove || (!puzzleHint && !puzzleAutoMove)))) { retryMove(); return; }
            const data = JSON.parse(resp.responseText);
            if (Array.isArray(data) && /^[a-h][1-8][a-h][1-8][qrbn]?$/.test(data[0])) {
              const move = data[0];
              log("Lance: " + move);
              if (!isPuzzleMode) cleanCache();
              currentCache.set(cacheKey, move);

              if (isAutoMove) {
                $(".myhigh, .myarrow").remove();
                scheduleAutoMove(move);
              } else {
                create_div(move);
                thinkerMoveDiagnostic = { stage: "recommendation", status: Number(resp.status) || null };
              }
            } else retryMove();
          } catch (e) {
            retryMove();
            log("Erro parse: " + e);
          }
          can_interval = true;
        },
        onerror: function (resp) {
          thinkerMoveDiagnostic = { stage: "connection-error", status: Number(resp?.status) || null };
          log("Erro request: " + (resp ? resp.status : "unknown"));
          retryMove();
        },
        ontimeout: function () {
          thinkerMoveDiagnostic = { stage: "timeout", status: null };
          log("Timeout: servidor nao respondeu em 5s");
          retryMove();
        },
        onabort: retryMove,
        timeout: 5000,
      });
    } catch (e) {
      thinkerMoveDiagnostic = { stage: e?.code === "SERVER_AUTH_REQUIRED" ? "authentication-required" : "request-error", status: null };
      log("Erro: " + e);
      checkfen = "";
      moveRetryAfter = Date.now() + 1000;
      can_interval = true;
    }
  }

  let scheduleThinkerBannerPosition = () => {};
  let thinkerBannerEnabled = localStorage.getItem("thinkerBanner") !== "false";
  let scheduleThinkerWorkspaceLayout = () => {};
  let thinkerMenuNode = null;
  let thinkerBannerNode = null;
  let thinkerUiReconcileTimer = null;
  let thinkerMountTimer = null;
  let thinkerUiBound = false;
  let thinkerUiLastFailure = "";
  let thinkerUiFailureCount = 0;
  let thinkerBannerFrame = null;
  let thinkerWorkspaceFrame = null;
  let thinkerWorkspaceCollapsed = false;
  let thinkerObservedBannerSidebar = null;
  let thinkerBannerResizeObserver = null;
  let thinkerBannerLayoutObserver = null;
  let thinkerResizeHandler = null;
  let thinkerKeyboardFocusHandler = null;
  let thinkerUrlMonitorTimer = null;
  const THINKER_PAGE_SCROLLBAR_CLASS = "tc-page-scrollbar-hidden";

  function setThinkerPageScrollbarHidden(hidden) {
    const root = document.documentElement;
    if (!root?.classList) return;
    root.classList.toggle(THINKER_PAGE_SCROLLBAR_CLASS, hidden === true);
  }

  function getThinkerRect(node) {
    if (!node || node.isConnected === false || typeof node.getBoundingClientRect !== "function") return null;
    const rect = node.getBoundingClientRect();
    if (!rect) return null;
    const width = Number(rect.width ?? rect.right - rect.left);
    const height = Number(rect.height ?? rect.bottom - rect.top);
    if (![rect.left, rect.top, rect.right, rect.bottom, width, height].every(Number.isFinite)) return null;
    return {
      left: Number(rect.left),
      top: Number(rect.top),
      right: Number(rect.right),
      bottom: Number(rect.bottom),
      width,
      height,
    };
  }

  function thinkerRectsOverlap(first, second, padding = 0) {
    if (!first || !second) return false;
    return !(
      first.right + padding <= second.left ||
      second.right + padding <= first.left ||
      first.bottom + padding <= second.top ||
      second.bottom + padding <= first.top
    );
  }

  function isRenderableThinkerLayoutNode(node, { minWidth = 1, minHeight = 1 } = {}) {
    const rect = getThinkerRect(node);
    if (!rect || rect.width < minWidth || rect.height < minHeight) return false;
    if (node.hidden || node.getAttribute?.("aria-hidden") === "true") return false;
    if (typeof window.getComputedStyle === "function") {
      let current = node;
      while (current && current.nodeType === 1) {
        const style = window.getComputedStyle(current);
        if (current.hidden || current.getAttribute?.("aria-hidden") === "true") return false;
        if (style && (
          style.display === "none" ||
          style.visibility === "hidden" ||
          (style.opacity !== "" && Number(style.opacity) === 0)
        )) return false;
        current = current.parentElement;
      }
    }
    return true;
  }

  function isVisibleThinkerLayoutNode(node, options = {}) {
    if (!isRenderableThinkerLayoutNode(node, options)) return false;
    const rect = getThinkerRect(node);
    const viewportWidth = document.documentElement?.clientWidth || window.innerWidth || Number.MAX_SAFE_INTEGER;
    const viewportHeight = window.innerHeight || document.documentElement?.clientHeight || Number.MAX_SAFE_INTEGER;
    return rect.right > 0 && rect.bottom > 0 && rect.left < viewportWidth && rect.top < viewportHeight;
  }

  function isExcludedThinkerSidebarCandidate(node) {
    return Boolean(node?.closest?.(
      "nav, header, [role='navigation'], [class*='chat'], [class*='ad-'], [id*='ad-'], .ad-container, .ad-unit, #ad-sidebar, .board-layout-ad, .sky-ad, .ads-container, .chess-ad-wrapper",
    ));
  }

  function updateThinkerMountDiagnostics() {
    const message = thinkerUiLastFailure.slice(0, 240);
    const controls = [document.getElementById("kb-ghost-recovery")].filter(Boolean);
    controls.forEach((control) => {
      control.dataset.mountError = message;
      const baseTitle = "Restore Thinker Chess controls";
      control.title = message ? `${baseTitle} (${message})` : baseTitle;
    });
  }

  function clearThinkerMountFailure() {
    thinkerUiLastFailure = "";
    thinkerUiFailureCount = 0;
    updateThinkerMountDiagnostics();
  }

  function recordThinkerMountFailure(error) {
    const rawMessage = error && error.message ? `${error.name || "Error"}: ${error.message}` : String(error || "mount failure");
    thinkerUiFailureCount = Math.min(999, thinkerUiFailureCount + 1);
    thinkerUiLastFailure = `${thinkerUiFailureCount}: ${rawMessage}`.slice(0, 240);
    updateThinkerMountDiagnostics();
  }

  function cleanupThinkerUiLifecycle({ removeMenu = false } = {}) {
    setThinkerPageScrollbarHidden(false);
    if (thinkerBannerFrame !== null && typeof cancelAnimationFrame === "function") cancelAnimationFrame(thinkerBannerFrame);
    if (thinkerWorkspaceFrame !== null && typeof cancelAnimationFrame === "function") cancelAnimationFrame(thinkerWorkspaceFrame);
    thinkerBannerFrame = null;
    thinkerWorkspaceFrame = null;
    if (thinkerBannerResizeObserver) thinkerBannerResizeObserver.disconnect();
    if (thinkerBannerLayoutObserver) thinkerBannerLayoutObserver.disconnect();
    thinkerBannerResizeObserver = null;
    thinkerBannerLayoutObserver = null;
    thinkerObservedBannerSidebar = null;
    if (thinkerResizeHandler) window.removeEventListener("resize", thinkerResizeHandler);
    thinkerResizeHandler = null;
    if (thinkerKeyboardFocusHandler) document.removeEventListener("keydown", thinkerKeyboardFocusHandler, true);
    thinkerKeyboardFocusHandler = null;
    if (thinkerUrlMonitorTimer !== null) clearInterval(thinkerUrlMonitorTimer);
    thinkerUrlMonitorTimer = null;
    scheduleThinkerBannerPosition = () => {};
    scheduleThinkerWorkspaceLayout = () => {};
    thinkerUiBound = false;
    _menuReady = false;
    if (removeMenu) {
      const menu = document.getElementById("krypbot-container");
      thinkerWorkspaceCollapsed = Boolean(menu?.classList.contains("minimized"));
      if (menu && typeof menu.remove === "function") menu.remove();
      else if (menu && menu.parentNode) menu.parentNode.removeChild(menu);
      thinkerMenuNode = null;
    }
  }

  function failThinkerUiMount(error) {
    if (thinkerMountTimer !== null) clearInterval(thinkerMountTimer);
    thinkerMountTimer = null;
    cleanupThinkerUiLifecycle({ removeMenu: true });
    recordThinkerMountFailure(error);
  }

  function findThinkerMenuHost() {
    const layouts = document.querySelectorAll(
      "#board-layout-main, .board-layout-main, .puzzle-layout, .puzzle-container",
    );
    for (const layout of layouts) {
      if (isVisibleThinkerLayoutNode(layout, { minWidth: 240, minHeight: 240 })) return layout;
    }
    const board = document.querySelector(
      "wc-chess-board, chess-board, #board-single, .chess-board-wrapper, .board-wrapper, [class*='puzzle-board'], .board, .chess-board, [class*='board-component']",
    );
    return board && (board.closest?.("main") || board.parentElement || board);
  }

  function getThinkerMountHost() {
    const host = findThinkerMenuHost();
    if (host) return host;
    const path = String(window.location.pathname || "").toLowerCase();
    return /^\/(play|game|puzzle|puzzles)(\/|$)/.test(path)
      ? document.querySelector("main") || document.body
      : null;
  }

  function findThinkerSidebar() {
    const knownSelectors = [
      ".play-controller-component",
      ".board-layout-sidebar",
      ".layout-board-sidebar",
      "#board-layout-sidebar",
      "[data-cy*='sidebar']",
      "[data-test-element*='sidebar']",
      "[class*='play-controller']",
      "[class*='game-panel']",
    ];
    const board = findThinkerGameBoard();
    const boardRect = getThinkerRect(board);
    const seen = new Set();
    const knownCandidates = [];
    knownSelectors.forEach((selector, priority) => {
      document.querySelectorAll(selector).forEach((candidate) => {
        if (seen.has(candidate)) return;
        seen.add(candidate);
        knownCandidates.push({ candidate, priority });
      });
    });
    knownCandidates.sort((first, second) => first.priority - second.priority);
    for (const { candidate } of knownCandidates) {
      if (isExcludedThinkerSidebarCandidate(candidate)) continue;
      if (!isVisibleThinkerLayoutNode(candidate, { minWidth: 240, minHeight: 300 })) continue;
      const rect = getThinkerRect(candidate);
      if (boardRect && (candidate.contains?.(board) || thinkerRectsOverlap(rect, boardRect, 4))) continue;
      if (boardRect && (rect.left < boardRect.right || rect.left - boardRect.right > 160)) continue;
      return candidate;
    }

    if (!boardRect || boardRect.width < 300) return null;
    let closest = null;
    let closestGap = Infinity;
    for (const candidate of document.querySelectorAll(
      "aside, [role='complementary'], [class*='sidebar'], [class*='controller'], [class*='board-layout'], [class*='game-panel']",
    )) {
      if (isExcludedThinkerSidebarCandidate(candidate)) continue;
      if (candidate.contains?.(board) || !isVisibleThinkerLayoutNode(candidate, { minWidth: 240, minHeight: 300 })) continue;
      const rect = getThinkerRect(candidate);
      const gap = rect.left - boardRect.right;
      if (gap < 0 || gap > 160 || rect.width < 240 || rect.width > 500 || rect.height < 300) continue;
      if (thinkerRectsOverlap(rect, boardRect, 4)) continue;
      if (gap < closestGap) {
        closest = candidate;
        closestGap = gap;
      }
    }
    let boardBranch = board;
    let ancestor = board.parentElement;
    for (let depth = 0; ancestor && depth < 7; depth += 1) {
      for (const candidate of Array.from(ancestor.children || [])) {
        if (candidate === boardBranch || candidate.contains?.(board)) continue;
        if (isExcludedThinkerSidebarCandidate(candidate)) continue;
        if (!isVisibleThinkerLayoutNode(candidate, { minWidth: 240, minHeight: 300 })) continue;
        const rect = getThinkerRect(candidate);
        const gap = rect.left - boardRect.right;
        const verticalOverlap = Math.min(rect.bottom, boardRect.bottom) - Math.max(rect.top, boardRect.top);
        if (
          gap < -4 ||
          gap > 220 ||
          rect.width < 240 ||
          rect.width > 560 ||
          rect.height < 300 ||
          verticalOverlap < Math.min(240, boardRect.height * 0.35)
        ) continue;
        if (gap < closestGap) {
          closest = candidate;
          closestGap = gap;
        }
      }
      if (closest) break;
      boardBranch = ancestor;
      ancestor = ancestor.parentElement;
    }
    return closest;
  }

  function getThinkerBannerSidebar() {
    const currentSidebar = findThinkerSidebar();
    if (currentSidebar) return currentSidebar;
    return isRenderableThinkerLayoutNode(
      thinkerObservedBannerSidebar,
      { minWidth: 240, minHeight: 300 },
    ) ? thinkerObservedBannerSidebar : null;
  }

  function shouldShowThinkerBanner() {
    if (!thinkerBannerEnabled || _ghostModeActive) return false;
    const path = String(window.location.pathname || "").toLowerCase();
    if (/^\/analysis(\/|$)/.test(path) || /(^|\/)review(\/|$)/.test(path)) return false;
    const isGameRoute = /^\/game\/(?:live\/)?[^/]+\/?$/.test(path);
    const isPlayOnlineRoute = /^\/play\/online\/?$/.test(path);
    if (!isGameRoute && !isPlayOnlineRoute) return false;

    const board = findThinkerGameBoard();
    if (!isRenderableThinkerLayoutNode(board, { minWidth: 240, minHeight: 240 })) return false;
    const sidebar = getThinkerBannerSidebar();
    return Boolean(sidebar);
  }

  function setThinkerBannerEnabled(enabled) {
    thinkerBannerEnabled = enabled === true;
    localStorage.setItem("thinkerBanner", String(thinkerBannerEnabled));
    positionThinkerBannerShell();
  }

  function getThinkerRuntimeDiagnostics() {
    const board = findThinkerGameBoard();
    const game = resolveThinkerBoardGame(board);
    const sidebar = getThinkerBannerSidebar();
    const banner = document.getElementById("thinker-chess-banner");
    const layout = sidebar ? calculateThinkerBannerLayout(sidebar.getBoundingClientRect(), document.documentElement.clientWidth, window.scrollX, window.scrollY, _ghostModeActive) : null;
    let reason = "visible";
    if (!thinkerBannerEnabled) reason = "disabled";
    else if (_ghostModeActive) reason = "ghost-mode";
    else if (!board) reason = "board-unavailable";
    else if (!sidebar) reason = "sidebar-unavailable";
    else if (!shouldShowThinkerBanner()) reason = "route-not-supported";
    else if (!layout) reason = "insufficient-space-or-height";
    else if (!banner || banner.style.display === "none") reason = "awaiting-layout";
    let fenAvailable = false;
    try { fenAvailable = typeof game?.getFEN?.() === "string"; } catch (_) {}
    return {
      version: "2026-10-23.2",
      route: window.location.pathname,
      banner: { enabled: thinkerBannerEnabled, shown: Boolean(banner && banner.style.display !== "none"), reason, minimumWidth: THINKER_BANNER_MIN_WIDTH_PX, geometry: layout },
      bot: { enabled: isMasterEnabled(), autoMove: auto_move, effectiveAutoMove: sessionControlBridge.effectiveAutoMove(auto_move), sessionActive: sessionControlBridge.isActive(), stage: thinkerMoveDiagnostic.stage, status: thinkerMoveDiagnostic.status, authenticated: Boolean(engineCapability), boardFound: Boolean(board), gameApiFound: Boolean(game), fenAvailable, canReadLegalMoves: typeof game?.getLegalMoves === "function", canExecuteMove: typeof game?.move === "function", retryPending: Date.now() < moveRetryAfter },
    };
  }

  try {
    const diagnosticsWindow = typeof unsafeWindow === "object" && unsafeWindow ? unsafeWindow : window;
    diagnosticsWindow.thinkerChessDiagnostics = () => JSON.parse(JSON.stringify(getThinkerRuntimeDiagnostics()));
  } catch (_) {}

  function ensureGhostRecoveryControl() {
    if (!document.body) return null;
    let control = document.getElementById("kb-ghost-recovery");
    if (!control) {
      control = document.createElement("button");
      control.id = "kb-ghost-recovery";
      control.type = "button";
      control.textContent = "TC";
      control.title = "Restore Thinker Chess controls";
      control.style.cssText =
        "position:fixed;left:14px;bottom:14px;z-index:2147483646;width:42px;height:42px;border:1px solid rgba(0,255,136,.55);border-radius:50%;background:#11151a;color:#00ff88;font:800 13px/1 Inter,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.55),0 0 16px rgba(0,255,136,.22);cursor:pointer;display:none;align-items:center;justify-content:center;";
      control.addEventListener("click", () => {
        applyGhostModeVisibility(false);
        if (typeof GM_xmlhttpRequest === "function") {
          GM_xmlhttpRequest({
            method: "POST",
            url: SERVER_URL + "/config/save",
            headers: { "Content-Type": "application/json" },
            data: JSON.stringify({ ghostMode: false }),
          });
        }
      });
      document.body.appendChild(control);
    }
    control.style.display = _ghostModeActive ? "flex" : "none";
    updateThinkerMountDiagnostics();
    return control;
  }

  function applyGhostModeVisibility(active) {
    _ghostModeActive = active === true;
    const menu = document.getElementById("krypbot-container");
    const wrapper = document.getElementById("oi-wrapper");
    const scoutPrimary = document.getElementById("oi-zone1");
    const scoutSecondary = document.getElementById("oi-zone2");
    const banner = document.getElementById("thinker-chess-banner");
    document.querySelectorAll(".tc-hud-stats").forEach((hud) => {
      hud.style.display = _ghostModeActive || !recentFormEnabled ? "none" : "inline-flex";
    });
    if (menu) menu.style.display = _ghostModeActive ? "none" : "flex";
    if (wrapper) wrapper.style.setProperty("display", _ghostModeActive ? "none" : "flex", "important");
    if (scoutPrimary) scoutPrimary.style.display = _ghostModeActive ? "none" : "";
    if (scoutSecondary) scoutSecondary.style.display = _ghostModeActive || menu?.classList.contains("minimized") ? "none" : "flex";
    if (banner && !shouldShowThinkerBanner()) banner.style.display = "none";
    ensureGhostRecoveryControl();
    if (shouldShowThinkerBanner()) {
      scheduleThinkerBannerPosition();
    }
  }

  function setThinkerWorkspaceCollapsed(collapsed) {
    const menu = document.getElementById("krypbot-container");
    if (!menu) return;
    const isCollapsed = collapsed === true;
    const launcher = document.getElementById("kb-workspace-launcher");
    const restoreFocus = !isCollapsed && document.activeElement === launcher;
    thinkerWorkspaceCollapsed = isCollapsed;
    menu.classList.toggle("minimized", isCollapsed);
    menu.setAttribute("data-workspace-collapsed", isCollapsed ? "true" : "false");
    if (launcher) launcher.setAttribute("aria-expanded", isCollapsed ? "false" : "true");
    const scout = document.getElementById("oi-zone2");
    if (scout) scout.style.display = isCollapsed || _ghostModeActive ? "none" : "flex";
    if (!isCollapsed && typeof OpponentIntel !== "undefined" && !scout) OpponentIntel.checkOpponent();
    if (isCollapsed && launcher) launcher.focus({ preventScroll: true });
    if (restoreFocus) menu.querySelector("input:not([disabled]), button:not(#kb-workspace-launcher)")?.focus({ preventScroll: true });
    if (typeof scheduleThinkerWorkspaceLayout === "function") scheduleThinkerWorkspaceLayout();
  }

  function reconcileThinkerUiShells() {
    const wrapper = document.getElementById("oi-wrapper");
    if (thinkerBannerNode && !thinkerBannerNode.isConnected && document.body) {
      document.body.appendChild(thinkerBannerNode);
    }
    if (
      thinkerMenuNode &&
      thinkerMenuNode.isConnected &&
      typeof OpponentIntel !== "undefined" &&
      typeof OpponentIntel.ensureScoutWrapper === "function" &&
      (!wrapper || !wrapper.isConnected || thinkerMenuNode.parentNode !== wrapper)
    ) {
      OpponentIntel.ensureScoutWrapper();
    }
    ensureGhostRecoveryControl();
    if (wrapper && document.body && (wrapper.parentNode !== document.body || wrapper.nextSibling)) {
      document.body.appendChild(wrapper);
    }
    if (thinkerBannerNode && !shouldShowThinkerBanner()) thinkerBannerNode.style.display = "none";
  }

  function startThinkerUiReconciler() {
    if (thinkerUiReconcileTimer !== null) return;
    thinkerUiReconcileTimer = window.setInterval(reconcileThinkerUiShells, 400);
  }

  const THINKER_BANNER_GAP_PX = 15;
  const THINKER_BANNER_SAFE_EDGE_PX = 6;
  const THINKER_BANNER_PREFERRED_WIDTH_PX = 170;
  const THINKER_BANNER_MIN_WIDTH_PX = 96;
  const THINKER_WORKSPACE_GAP_PX = 112;

  function calculateThinkerBannerLayout(
    sidebarRect,
    viewportWidth,
    scrollX,
    scrollY,
    ghostMode,
  ) {
    if (!sidebarRect || ghostMode) return null;
    const documentScrollX = Number(scrollX || 0);
    const viewportLeft = documentScrollX + THINKER_BANNER_SAFE_EDGE_PX;
    const viewportRight =
      documentScrollX + Number(viewportWidth) - THINKER_BANNER_SAFE_EDGE_PX;
    const safeViewportWidth = Math.floor(viewportRight - viewportLeft);
    const idealLeft =
      Number(sidebarRect.right) + documentScrollX + THINKER_BANNER_GAP_PX;
    const availableWidth = Math.floor(viewportRight - idealLeft);
    const top = Number(sidebarRect.top) + Number(scrollY || 0);
    const height = Number(sidebarRect.height);
    if (
      ![viewportLeft, viewportRight, safeViewportWidth, idealLeft, availableWidth, top, height].every(
        Number.isFinite,
      )
    ) {
      return null;
    }
    if (availableWidth < THINKER_BANNER_MIN_WIDTH_PX || height < 260) return null;
    const width = Math.min(THINKER_BANNER_PREFERRED_WIDTH_PX, availableWidth);
    const left = idealLeft;
    return {
      left,
      top,
      width,
      height,
    };
  }

  function calculateThinkerWorkspaceMargin(naturalDocumentTop, viewportHeight, gameplayDocumentBottom = 0) {
    const baseMargin = 30;
    const safeTop = Math.max(Math.max(0, viewportHeight) + THINKER_WORKSPACE_GAP_PX, Math.max(0, gameplayDocumentBottom) + THINKER_WORKSPACE_GAP_PX);
    return Math.ceil(baseMargin + Math.max(0, safeTop - naturalDocumentTop));
  }

  function positionThinkerBannerShell() {
    const banner = document.getElementById("thinker-chess-banner");
    if (!banner) return;
    if (!shouldShowThinkerBanner()) {
      banner.style.display = "none";
      return;
    }
    const sidebar = getThinkerBannerSidebar();
    if (!sidebar) {
      banner.style.display = "none";
      return;
    }
    if (thinkerBannerResizeObserver && thinkerObservedBannerSidebar !== sidebar) {
      if (thinkerObservedBannerSidebar) thinkerBannerResizeObserver.unobserve(thinkerObservedBannerSidebar);
      thinkerObservedBannerSidebar = sidebar;
      thinkerBannerResizeObserver.observe(sidebar);
    }
    const layout = calculateThinkerBannerLayout(
      sidebar.getBoundingClientRect(),
      document.documentElement.clientWidth,
      window.scrollX,
      window.scrollY,
      _ghostModeActive,
    );
    if (!layout) {
      banner.style.display = "none";
      return;
    }
    banner.style.left = layout.left + "px";
    banner.style.right = "auto";
    banner.style.top = layout.top + "px";
    banner.style.width = layout.width + "px";
    banner.style.height = layout.height + "px";
    const artwork = banner.querySelector("img");
    if (artwork?.naturalWidth) {
      artwork.style.maxWidth = Math.floor(
        artwork.naturalWidth / Math.max(1, window.devicePixelRatio || 1),
      ) + "px";
    } else {
      artwork?.addEventListener("load", scheduleThinkerBannerPosition, { once: true });
    }
    banner.style.display = "flex";
  }

  function createMenu() {
    if (thinkerUiBound) return;
    $ = $ || resolveThinkerJQuery();
    if (thinkerMountTimer !== null) return;

    const css = `
      <style id="tc-userscript-style">
        html.tc-page-scrollbar-hidden,
        html.tc-page-scrollbar-hidden body {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }

        html.tc-page-scrollbar-hidden::-webkit-scrollbar,
        html.tc-page-scrollbar-hidden body::-webkit-scrollbar {
          width: 0 !important;
          height: 0 !important;
          display: none !important;
        }

        #oi-wrapper {
          --tc-glass-bg: rgba(20, 20, 25, 0.65);
          --tc-glass-border: rgba(255, 255, 255, 0.08);
          --tc-glass-highlight: rgba(255, 255, 255, 0.13);
          --tc-glass-inset: rgba(8, 10, 14, 0.24);
          --tc-accent: #38e58b;
          --tc-text: #f7f8fa;
          --tc-muted: #9ca3b2;
          --tc-font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          position: absolute !important;
          top: calc(100vh + ${THINKER_WORKSPACE_GAP_PX}px) !important;
          left: 10px !important;
          width: max-content !important;
          z-index: 2147483647 !important;
          display: flex !important;
          align-items: flex-start !important;
          gap: 12px !important;
          pointer-events: none !important;
        }

        #oi-wrapper > * {
          pointer-events: auto !important;
        }

        #krypbot-container {
          margin: 30px 0;
          max-width: 400px;
          clear: both;
          background: rgba(18, 18, 22, 0.75);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          color: #fff;
          padding: 22px;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1);
          font-family: 'Inter', sans-serif;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        #krypbot-container.minimized {
          width: 154px !important;
          max-width: 154px !important;
          height: 46px;
          min-height: 46px !important;
          padding: 0 !important;
          border-radius: 15px !important;
          cursor: pointer;
          display: flex;
          justify-content: center;
          align-items: center;
          background: rgba(20,20,25,.78) !important;
          border-color: rgba(255,255,255,.1) !important;
          box-shadow:0 14px 34px rgba(0,0,0,.38), inset 0 1px 0 rgba(255,255,255,.08) !important;
        }

        #krypbot-container.minimized:hover {
          border-color: rgba(56,229,139,.26) !important;
          box-shadow:0 16px 38px rgba(0,0,0,.42), 0 0 0 3px rgba(56,229,139,.07) !important;
        }

        #krypbot-container.minimized > *:not(.kb-logo) {
          display: none !important;
        }

        #krypbot-container .kb-logo {
          display: none;
          width:100%; height:100%; padding:0 12px; align-items:center; gap:9px; border:0; border-radius:inherit;
          background:transparent; color:#f5f7f9; font:700 12px/1 var(--tc-font); cursor:pointer;
        }

        #krypbot-container.minimized .kb-logo {
          display: flex;
        }
        #krypbot-container .kb-logo-mark { width:26px; height:26px; display:grid; place-items:center; flex:none; border-radius:9px; background:linear-gradient(145deg,#42eca0,#16b969); color:#07150e; font-size:16px; box-shadow:0 6px 16px rgba(26,199,111,.22), inset 0 1px 0 rgba(255,255,255,.38); }
        #krypbot-container .kb-logo-copy { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; letter-spacing:-.01em; }

        .kb-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .kb-title {
          font-size: 22px;
          font-weight: 800;
          background: linear-gradient(90deg, #00ff88, #00b8ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin: 0;
        }

        .kb-minimize-btn {
          background: rgba(255, 255, 255, 0.08);
          border: none;
          color: #fff;
          width: 30px;
          height: 30px;
          border-radius: 15px;
          cursor: pointer;
          display: flex;
          justify-content: center;
          align-items: center;
          transition: background 0.2s;
        }
        .kb-minimize-btn:hover { background: rgba(255, 255, 255, 0.15); }

        .kb-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
        .kb-section-col { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
        .kb-section-label { font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.9); margin: 0; }

        .kb-radio-group {
          display: flex;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 20px;
          padding: 3px;
          border: 1px solid rgba(255,255,255,0.05);
        }
        .kb-radio-group input[type="radio"] { display: none; }
        .kb-radio-group label {
          padding: 5px 14px;
          font-size: 12px;
          font-weight: 600;
          border-radius: 16px;
          cursor: pointer;
          color: rgba(255,255,255,0.5);
          transition: all 0.3s;
          margin: 0;
        }
        .kb-radio-group input[type="radio"]:checked + label {
          background: linear-gradient(135deg, #00ff88, #00cc6a);
          color: #000;
          box-shadow: 0 2px 10px rgba(0, 255, 136, 0.3);
        }
        #kb-auto-queue-controls[aria-disabled="true"] { opacity: 0.72; cursor: not-allowed; }
        #kb-auto-queue-controls[aria-disabled="true"] label { cursor: not-allowed; }
        .kb-session-queue-note { margin: -9px 0 12px; color: #8bdcb3; font-size: 10px; line-height: 1.4; }

        .kb-slider-group { display: flex; align-items: center; gap: 12px; }
        .kb-slider {
          flex-grow: 1;
          accent-color: #00ff88;
          cursor: pointer;
          height: 4px;
          background: rgba(255,255,255,0.1);
          border-radius: 2px;
          outline: none;
        }
        .kb-slider-val { font-size: 13px; font-weight: 600; min-width: 40px; color: #00ff88; text-align: right; }

        .kb-footer {
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid rgba(255,255,255,0.06);
          display: flex; justify-content: space-between; align-items: center;
        }
        .kb-status { font-size: 12px; color: #00ff88; font-weight: 700; letter-spacing: 0.5px; }
        .kb-color-input {
          background: none; border: 1px solid rgba(255,255,255,0.1);
          border-radius: 4px; padding: 0; width: 28px; height: 28px; cursor: pointer;
        }

        .kb-num-input {
          width: 60px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1);
          color: #fff; padding: 6px; border-radius: 6px; font-size: 12px; font-family: 'Inter', sans-serif;
        }
        .kb-num-input:focus { outline: none; border-color: #00ff88; }

        #krypbot-container {
          position:relative; isolation:isolate; overflow:hidden; width: 292px; max-width: 292px; box-sizing: border-box; margin: 0; padding: 14px;
          gap: 0; background: var(--tc-glass-bg) !important;
          background-image:linear-gradient(145deg,rgba(255,255,255,.065),rgba(255,255,255,.012) 42%,rgba(3,5,8,.1)) !important;
          border: 1px solid var(--tc-glass-border) !important; border-radius: 18px !important;
          box-shadow: 0 24px 64px rgba(0,0,0,.48), 0 6px 20px rgba(0,0,0,.22), inset 0 1px 0 var(--tc-glass-highlight);
          backdrop-filter: blur(16px) !important; -webkit-backdrop-filter: blur(16px) !important;
          color: var(--tc-text); font-family: var(--tc-font) !important;
        }
        #oi-zone2.tc-workspace-card {
          position:relative; isolation:isolate; overflow:hidden; width:292px !important; min-height:0 !important; padding:14px !important;
          background: var(--tc-glass-bg) !important;
          background-image:linear-gradient(145deg,rgba(255,255,255,.065),rgba(255,255,255,.012) 42%,rgba(3,5,8,.1)) !important;
          backdrop-filter: blur(16px) !important;
          -webkit-backdrop-filter: blur(16px) !important;
          border: 1px solid var(--tc-glass-border) !important;
          border-radius: 18px !important;
          box-shadow: 0 24px 64px rgba(0,0,0,.48), 0 6px 20px rgba(0,0,0,.22), inset 0 1px 0 var(--tc-glass-highlight) !important;
          font-family: var(--tc-font) !important;
        }
        #krypbot-container .kb-radio-group:not(:has(input[name="delayMode"])) {
          position: relative; width: 40px; height: 24px; padding: 0; border: 1px solid rgba(255,255,255,.06); border-radius: 999px;
          background: rgba(255,255,255,.09); overflow: hidden;
        }
        #krypbot-container .kb-radio-group:not(:has(input[name="delayMode"]))::after {
          content: ""; position: absolute; top: 2px; left: 2px; width: 18px; height: 18px;
          border-radius: 50%; background: #f5f6f7; box-shadow: 0 1px 3px rgba(0,0,0,.35);
          transition: transform .16s ease; pointer-events: none;
        }
        #krypbot-container .kb-radio-group:not(:has(input[name="delayMode"])):has(input[value="1"]:checked) {
          background: rgba(42,211,111,.85); box-shadow:0 0 16px rgba(42,211,111,.22);
        }
        #krypbot-container .kb-radio-group:not(:has(input[name="delayMode"])):has(input[value="1"]:checked)::after {
          transform: translateX(16px);
        }
        #krypbot-container .kb-radio-group:not(:has(input[name="delayMode"])) label {
          position: relative; z-index: 2; width: 20px; height: 22px; padding: 0; margin: 0;
          border-radius: 0; background: transparent !important; box-shadow: none !important;
          color: transparent !important; font-size: 0;
        }
        #krypbot-container .kb-run-delay-card {
          min-height:58px; margin:6px 0 2px; padding:9px; display:flex; flex-direction:column; align-items:stretch; gap:8px;
          background:rgba(56,229,139,.035);
        }
        #krypbot-container .kb-run-delay-card[data-inactive="true"] {
          border-color:rgba(255,255,255,.045); background:rgba(255,255,255,.018);
        }
        #krypbot-container .kb-run-delay-card[data-inactive="true"] .kb-run-delay-controls { opacity:.56; }
        #krypbot-container .kb-dependency-hint {
          margin:0; color:#8f97a6; font-size:10px; line-height:1.4;
        }
        #krypbot-container .kb-run-delay-card > div { min-width:0; margin:0 !important; }
        #krypbot-container .kb-run-delay-controls { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:8px; }
        #krypbot-container .kb-delay-range { display:flex; align-items:center; gap:5px; min-width:0; }
        #krypbot-container .kb-delay-input { width:56px; height:32px; display:flex; align-items:center; box-sizing:border-box; border:1px solid rgba(255,255,255,.09); border-radius:9px; background:rgba(7,9,13,.55); box-shadow:inset 0 1px 0 rgba(255,255,255,.035); transition:border-color .18s ease, box-shadow .18s ease, background .18s ease; }
        #krypbot-container .kb-delay-input:focus-within { border-color:rgba(56,229,139,.6); background:rgba(7,12,10,.72); box-shadow:0 0 0 3px rgba(56,229,139,.1), inset 0 1px 0 rgba(255,255,255,.045); }
        #krypbot-container .kb-delay-input .kb-num-input { width:38px; height:30px; padding:0 0 0 7px; border:0; border-radius:0; background:transparent; text-align:right; outline:none; }
        #krypbot-container .kb-delay-unit { padding:0 6px 0 3px; color:#7f8793; font-size:9px; font-weight:650; }
        #krypbot-container .kb-delay-separator { color:#68707c; font-size:11px; }
        #krypbot-container .kb-run-delay-card .kb-radio-group:has(input[name="delayMode"]) { height:30px; }
        #krypbot-container .kb-run-delay-card .kb-radio-group:has(input[name="delayMode"]) label { min-width:34px; padding:6px 4px; font-size:9px; }
        #krypbot-container .kb-slider-group { gap: 8px; }
        #krypbot-container .kb-slider { height: 3px; accent-color: #28d875; }
        #krypbot-container .kb-slider-val { color: var(--tc-accent); font-size: 12px; }
        #krypbot-container .kb-num-input {
          width: 52px; height: 27px; box-sizing: border-box; padding: 4px 7px; border: 1px solid #303238;
          border-radius: 7px; background: #1a1b20; color: #fff; font-size: 11px; font-weight: 700;
          appearance: none; -webkit-appearance: none; -moz-appearance: textfield; font-variant-numeric:tabular-nums;
        }
        #krypbot-container .kb-num-input::-webkit-inner-spin-button,
        #krypbot-container .kb-num-input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        #krypbot-container .kb-radio-group:has(input[name="delayMode"]) {
          height: 27px; padding: 2px; border: 0; border-radius: 8px; background: #191a1f;
        }
        #krypbot-container .kb-radio-group:has(input[name="delayMode"]) label {
          min-width: 39px; padding: 5px 8px; box-sizing: border-box; color: #858b96; font-size: 9px;
          text-align: center;
        }
        #krypbot-container .kb-radio-group:has(input[name="delayMode"]) input:checked + label {
          background: #2ad36f; color: #0c1710 !important; box-shadow: none;
        }
        #krypbot-container .kb-footer {
          margin: 10px 0 0; padding: 10px 0 0; border-top: 1px solid rgba(255,255,255,.06);
        }
        #krypbot-container .kb-footer > div { width: 100%; justify-content: space-between; }
        #krypbot-container .kb-color-input {
          width: 19px; height: 19px; border: 0; border-radius: 6px; padding: 0; overflow: hidden;
        }
        #krypbot-container .kb-session-panel {
          margin-top:8px; padding:10px; display:flex; flex-direction:column; gap:7px;
          border:1px solid rgba(255,255,255,.075); border-radius:15px; background:rgba(5,8,12,.2);
          box-shadow:inset 0 1px 0 rgba(255,255,255,.035), 0 8px 24px rgba(0,0,0,.12);
        }
        #krypbot-container .kb-session-title { display:flex; justify-content:space-between; align-items:center; color:#f4f5f7; font-size:13px; line-height:20px; font-weight:750; letter-spacing:-.01em; }
        #krypbot-container .kb-session-title h3 { margin:0; color:inherit; font:inherit; letter-spacing:inherit; }
        #krypbot-container .kb-advanced-toggle {
          height:28px; display:flex; align-items:center; gap:6px; padding:0 9px; border:1px solid rgba(255,255,255,.08);
          border-radius:9px; background:rgba(255,255,255,.055); color:#aeb3bc; font-size:10px; line-height:1; font-weight:700;
          cursor:pointer; transition:background .2s ease, color .2s ease, border-color .2s ease;
        }
        #krypbot-container .kb-advanced-toggle:hover,
        #krypbot-container .kb-advanced-toggle:focus-visible { background:rgba(255,255,255,.11); border-color:rgba(255,255,255,.16); color:#fff; outline:none; }
        #krypbot-container .kb-advanced-toggle[aria-expanded="true"] { color:#62eea7; border-color:rgba(56,229,139,.22); background:rgba(56,229,139,.08); }
        #krypbot-container .kb-advanced-chevron { font-size:12px; transition:transform .28s cubic-bezier(.16,1,.3,1); }
        #krypbot-container .kb-advanced-toggle[aria-expanded="true"] .kb-advanced-chevron { transform:rotate(180deg); }
        #krypbot-container .kb-advanced-settings {
          display:grid; grid-template-rows:0fr; min-height:0; margin:0; opacity:0; visibility:hidden; pointer-events:none;
          transform:translateY(-5px); transition:grid-template-rows .32s cubic-bezier(.16,1,.3,1), opacity .2s ease, transform .32s cubic-bezier(.16,1,.3,1), margin .32s ease, visibility 0s linear .32s;
        }
        #krypbot-container .kb-advanced-settings[data-open="true"] {
          grid-template-rows:1fr; margin:2px 0 4px; opacity:1; visibility:visible; pointer-events:auto; transform:translateY(0);
          transition:grid-template-rows .32s cubic-bezier(.16,1,.3,1), opacity .2s ease, transform .32s cubic-bezier(.16,1,.3,1), margin .32s ease, visibility 0s;
        }
        #krypbot-container .kb-advanced-settings-inner { min-height:0; overflow:hidden; display:flex; flex-direction:column; gap:9px; }
        #krypbot-container .kb-advanced-heading { margin:3px 0 0; color:#8e94a1; font-size:10px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; }
        #krypbot-container .kb-advanced-toggle,
        #krypbot-container .kb-num-input,
        #krypbot-container .kb-session-field input,
        #krypbot-container .kb-session-button { font-family:inherit; }
        #krypbot-container .kb-session-fields { display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; }
        #krypbot-container .kb-session-field { display:flex; flex-direction:column; gap:5px; color:#929aa9; font-size:10px; line-height:1.25; }
        #krypbot-container .kb-session-field input { width:100%; height:34px; box-sizing:border-box; border:1px solid rgba(255,255,255,.09); border-radius:10px; background:rgba(0,0,0,.22); color:#fff; padding:6px 8px; font-size:11px; }
        #krypbot-container .kb-session-actions { display:grid; grid-template-columns:minmax(0,1fr) auto auto; align-items:center; gap:8px; }
        #krypbot-container .kb-session-button { height:32px; border:1px solid transparent; border-radius:10px; color:#0c1710; font-size:10px; font-weight:800; cursor:pointer; transition:transform .2s cubic-bezier(.16,1,.3,1), box-shadow .2s ease, filter .2s ease, background .2s ease; }
        #krypbot-container .kb-session-button[data-action="start"] {
          height:38px; border-radius:12px; background:linear-gradient(135deg,#42eca0 0%,#18b96a 100%); color:#06170e;
          font-size:12px; letter-spacing:.07em; box-shadow:0 10px 24px rgba(23,185,103,.26), inset 0 1px 0 rgba(255,255,255,.4);
        }
        #krypbot-container .kb-session-button[data-action="start"]:hover { transform:translateY(-1px); filter:brightness(1.06); box-shadow:0 14px 30px rgba(23,185,103,.34), inset 0 1px 0 rgba(255,255,255,.4); }
        #krypbot-container .kb-session-button[data-action="start"]:active { transform:translateY(0) scale(.99); }
        #krypbot-container .kb-session-button:focus-visible { outline:2px solid rgba(54,229,138,.75); outline-offset:2px; }
        #krypbot-container .kb-session-button[data-action="stop"] { width:48px; background:rgba(255,255,255,.08); border-color:rgba(255,255,255,.08); color:#f4f5f7; }
        #krypbot-container .kb-session-button[data-action="export"] { width:34px; background:rgba(255,255,255,.05); border-color:rgba(255,255,255,.08); color:#aeb3bc; }
        #krypbot-container .kb-session-button[aria-disabled="true"] { opacity:.45; cursor:not-allowed; }
        #krypbot-container .kb-session-status {
          display:grid; grid-template-columns:1fr 1fr; gap:6px; padding:0; border-radius:13px; background:transparent;
        }
        #krypbot-container .kb-session-metric {
          min-width:0; min-height:36px; box-sizing:border-box; display:flex; flex-direction:column; justify-content:center; gap:3px;
          padding:7px 9px; border:1px solid rgba(255,255,255,.055); border-radius:11px; background:rgba(255,255,255,.035);
          color:#8f97a6; font-size:9px; line-height:1.2; letter-spacing:.04em; text-transform:uppercase;
        }
        #krypbot-container .kb-session-metric strong { overflow:hidden; color:#f6f8fa; font-size:11px; line-height:1.25; font-weight:750; letter-spacing:-.01em; text-overflow:ellipsis; white-space:nowrap; text-transform:none; }
        #krypbot-container .kb-session-metric:first-child { background:linear-gradient(135deg,rgba(56,229,139,.075),rgba(255,255,255,.025)); }
        #krypbot-container .kb-session-metric:first-child strong { font-size:13px; font-variant-numeric:tabular-nums; }
        #krypbot-container .kb-session-metric:nth-child(2) strong { color:#65eea9; }
        #oi-zone2 .tc-scout-head { padding-bottom:17px !important; border-bottom:1px solid rgba(255,255,255,.075) !important; }
        #oi-zone2 .tc-scout-title,
        #oi-zone2 .tc-scout-head > div:first-child { font-size:17px !important; line-height:22px !important; font-weight:750 !important; letter-spacing:-.02em; }
        #oi-zone2 .tc-scout-subtitle { margin-top:5px !important; color:var(--tc-muted) !important; font-size:11px !important; }
        #oi-zone2 .tc-scout-empty {
          flex:0 0 auto !important; min-height:0; box-sizing:border-box; align-items:flex-start !important; justify-content:center !important;
          gap:8px !important; padding:18px 0 2px !important; text-align:left;
        }
        #oi-zone2[data-state="waiting"] .tc-scout-status { margin:0; }
        #oi-zone2 .tc-scout-status { padding:6px 10px !important; border-color:rgba(255,255,255,.09) !important; background:rgba(255,255,255,.035); color:#dce1e8 !important; font-size:11px !important; }
        #oi-zone2 .tc-scout-empty-detail { max-width:240px !important; color:var(--tc-muted) !important; font-size:11px !important; line-height:1.55 !important; }
        #oi-zone2 .tc-scout-retry {
          margin-top:4px; padding:9px 14px; border:1px solid rgba(56,229,139,.3); border-radius:10px;
          background:rgba(56,229,139,.1); color:#67efaa; font:700 11px/1.2 var(--tc-font); cursor:pointer;
        }
        #oi-zone2 .tc-scout-loading { flex:1; min-height:186px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; padding:20px 14px; box-sizing:border-box; }
        #oi-zone2 .tc-scout-loading .tc-scout-radar { margin-bottom:16px; }
        #oi-zone2 .tc-scout-skeleton { width:100%; height:52px; border:1px solid rgba(255,255,255,.045); border-radius:13px; background:linear-gradient(100deg,rgba(255,255,255,.025),rgba(255,255,255,.065),rgba(255,255,255,.025)); }
        #oi-zone2 .tc-scout-radar {
          position:relative; width:92px; height:92px; margin-bottom:6px; border:1px solid rgba(56,229,139,.32); border-radius:50%;
          background:repeating-radial-gradient(circle,transparent 0 14px,rgba(56,229,139,.16) 15px 16px),
            conic-gradient(from 210deg,transparent 0 72%,rgba(56,229,139,.28) 88%,transparent 100%);
          box-shadow:0 0 38px rgba(56,229,139,.11),inset 0 0 28px rgba(56,229,139,.055);
        }
        #oi-zone2 .tc-scout-radar::before,
        #oi-zone2 .tc-scout-radar::after { content:""; position:absolute; background:rgba(56,229,139,.22); }
        #oi-zone2 .tc-scout-radar::before { left:50%; top:8px; bottom:8px; width:1px; }
        #oi-zone2 .tc-scout-radar::after { top:50%; left:8px; right:8px; height:1px; }
        #oi-zone2 .tc-scout-radar-dot { position:absolute; z-index:2; width:7px; height:7px; left:70%; top:30%; border-radius:50%; background:#5bf0aa; box-shadow:0 0 12px rgba(91,240,170,.8); }
        #kb-session-toast { position:fixed; right:18px; bottom:18px; z-index:2147483647; max-width:320px; padding:10px 14px; border:1px solid #ffbd59; border-radius:8px; background:#18191e; color:#ffbd59; font-size:11px; font-weight:800; box-shadow:0 8px 28px rgba(0,0,0,.45); opacity:0; transform:translateY(8px); transition:opacity .16s ease,transform .16s ease; pointer-events:none; }
        #kb-session-toast[data-visible="true"] { opacity:1; transform:translateY(0); }
        #kb-session-toast[data-success="true"] { border-color:#2ad36f; color:#2ad36f; }
        #oi-wrapper {
          --tc-surface:rgba(20,20,24,.72); --tc-surface-subtle:rgba(255,255,255,.035); --tc-divider:rgba(255,255,255,.065);
          --tc-radius-card:16px; --tc-radius-control:9px; --tc-accent:#35d985;
        }
        #krypbot-container,
        #oi-zone2.tc-workspace-card {
          border-radius:var(--tc-radius-card) !important; background:var(--tc-surface) !important; background-image:none !important;
          box-shadow:0 18px 44px rgba(0,0,0,.38), inset 0 1px 0 rgba(255,255,255,.055) !important;
        }
        #krypbot-container { padding:12px; }
        #krypbot-container::before,
        #oi-zone2.tc-workspace-card::before { display:none; }
        #krypbot-container .kb-header { margin:0 0 4px; padding:0 0 10px; }
        #krypbot-container .kb-section { min-height:36px; }
        #krypbot-container .kb-section-label { font-size:12px; }
        #krypbot-container .kb-disclosure-block { margin-top:6px; border-top:1px solid var(--tc-divider); }
        #krypbot-container .kb-disclosure-toggle {
          width:100%; min-height:36px; display:flex; align-items:center; gap:8px; padding:0; border:0; background:transparent;
          color:#dfe2e7; font:650 11px/1.2 var(--tc-font); text-align:left; cursor:pointer;
        }
        #krypbot-container .kb-disclosure-toggle:focus-visible { outline:2px solid rgba(53,217,133,.72); outline-offset:3px; border-radius:var(--tc-radius-control); }
        #krypbot-container .kb-disclosure-summary { margin-left:auto; color:#8f97a4; font-size:10px; font-variant-numeric:tabular-nums; }
        #krypbot-container .kb-disclosure-toggle[aria-expanded="true"] .kb-advanced-chevron { transform:rotate(180deg); }
        #krypbot-container .kb-disclosure-panel {
          display:grid; grid-template-rows:0fr; min-height:0; opacity:0; visibility:hidden; pointer-events:none;
          transition:grid-template-rows .24s cubic-bezier(.16,1,.3,1), opacity .16s ease, visibility 0s linear .24s;
        }
        #krypbot-container .kb-disclosure-panel[data-open="true"] { grid-template-rows:1fr; opacity:1; visibility:visible; pointer-events:auto; transition:grid-template-rows .24s cubic-bezier(.16,1,.3,1), opacity .16s ease, visibility 0s; }
        #krypbot-container .kb-disclosure-inner { min-height:0; overflow:hidden; }
        #krypbot-container .kb-run-delay-card { min-height:0; margin-top:2px; padding:0; border:0; border-radius:0; background:transparent; box-shadow:none; }
        #krypbot-container .kb-run-delay-controls { padding:4px 0 8px; }
        #krypbot-container .kb-run-delay-card[data-inactive="true"] { border-color:var(--tc-divider); background:transparent; }
        #krypbot-container .kb-run-delay-card[data-inactive="true"] .kb-run-delay-controls { opacity:1; }
        #krypbot-container .kb-run-delay-card[data-inactive="true"] .kb-timing-mode input:checked + label { background:rgba(255,255,255,.08); color:#d8dce2 !important; }
        #krypbot-container .kb-run-delay-card[data-inactive="false"] .kb-timing-mode input:checked + label { background:var(--tc-accent); color:#07150e !important; }
        #krypbot-container .kb-timing-mode { display:grid; grid-template-columns:1fr 1fr; height:30px; }
        #krypbot-container .kb-run-delay-card .kb-timing-mode label { min-width:62px; padding:6px 7px; font-size:9px; }
        #krypbot-container .kb-dependency-hint { padding:0 0 8px; color:#858c98; }
        #krypbot-container .kb-strength-card { margin-top:6px; padding:9px 0 8px; border-top:1px solid var(--tc-divider); }
        #krypbot-container .kb-strength-head,
        #krypbot-container .kb-strength-limits { display:flex; align-items:center; justify-content:space-between; }
        #krypbot-container .kb-strength-head { margin-bottom:8px; color:#dfe2e7; font-size:11px; font-weight:650; }
        #krypbot-container .kb-strength-current { color:#8f97a4; font-size:9px; font-weight:550; }
        #krypbot-container .kb-strength-current strong { margin-left:4px; color:#f4f6f8; font-size:11px; font-variant-numeric:tabular-nums; }
        #krypbot-container .kb-strength-limits { margin-top:4px; color:#777f8c; font-size:8px; }
        #krypbot-container .kb-slider { width:100%; height:3px; accent-color:var(--tc-accent); }
        #krypbot-container .kb-session-panel { margin-top:4px; padding:10px 0; gap:8px; border:0; border-top:1px solid var(--tc-divider); border-radius:0; background:transparent; box-shadow:none; }
        #krypbot-container .kb-session-actions { grid-template-columns:minmax(0,1fr) auto auto; gap:6px; }
        #krypbot-container .kb-session-button { height:34px; border-radius:var(--tc-radius-control); }
        #krypbot-container .kb-session-button[data-action="start"] { height:36px; border-radius:var(--tc-radius-control); background:var(--tc-accent); box-shadow:none; color:#07150e; font-size:11px; letter-spacing:.02em; }
        #krypbot-container .kb-session-button[data-action="start"]:hover { box-shadow:none; }
        #krypbot-container .kb-session-button[data-action="stop"] { width:auto; padding:0 10px; }
        #krypbot-container .kb-session-button[data-action="export"] { width:auto; padding:0 9px; }
        #krypbot-container .kb-session-button[disabled],
        #krypbot-container .kb-session-button[aria-disabled="true"] { background:rgba(255,255,255,.045) !important; border-color:rgba(255,255,255,.055) !important; box-shadow:none !important; color:#737a85 !important; opacity:1; }
        #krypbot-container .kb-session-status { display:flex; flex-direction:column; gap:5px; padding:1px 0 0; }
        #krypbot-container .kb-session-primary,
        #krypbot-container .kb-session-stats { display:flex; align-items:baseline; min-width:0; color:#7f8793; font-size:9px; line-height:1.35; }
        #krypbot-container .kb-session-primary strong { margin-left:5px; color:#eef0f3; font-size:11px; font-weight:750; }
        #krypbot-container .kb-session-primary #kb-session-ttl { font-variant-numeric:tabular-nums; }
        #krypbot-container .kb-session-separator { margin:0 8px; color:#4f5661; }
        #krypbot-container .kb-session-stats { justify-content:space-between; gap:10px; }
        #krypbot-container .kb-session-stats strong { margin-left:4px; color:#c7ccd4; font-size:10px; font-weight:700; }
        #krypbot-container .kb-session-panel:not([data-session-state="never-started"]):not([data-session-state="completed"]):not([data-session-state="aborted"]) #kb-session-phase { color:#67eaa7; }
        #krypbot-container .kb-more-settings { margin-top:0; }
        #krypbot-container .kb-more-settings .kb-disclosure-inner { padding-bottom:2px; }
        #krypbot-container .kb-more-settings .kb-section { padding:0 2px; }
        #krypbot-container .kb-inline-note,
        #krypbot-container .kb-subsetting-label { margin:0; color:#858c98; font-size:10px; font-weight:500; }
        #krypbot-container .kb-footer { margin:0; padding:8px 0 0; }
        #krypbot-container .kb-footer > div { color:#777f8c; font-size:9px; }
        #oi-zone2 .tc-scout-head { padding-bottom:10px !important; }
        #oi-zone2 .tc-scout-title,
        #oi-zone2 .tc-scout-head > div:first-child { font-size:14px !important; line-height:19px !important; }
        #oi-zone2 .tc-scout-empty { padding:10px 0 0 !important; }
        #oi-zone2 .tc-scout-empty-detail { display:none; }
        #oi-wrapper {
          --tc-console-bg:#20201e; --tc-console-module:#252523; --tc-console-row:#292927; --tc-console-field:#1d1d1b;
          --tc-console-border:#3a3a36; --tc-console-divider:#32322f; --tc-console-text:#ecece8;
          --tc-console-muted:#a0a19b; --tc-console-subtle:#969791; --tc-console-accent:#46d977;
          --tc-console-accent-hover:#51df82; --tc-console-focus:#9be9b6;
          --tc-console-radius-module:7px; --tc-console-radius-control:5px;
          --tc-console-font:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
          gap:10px !important;
        }
        #krypbot-container.kb-console {
          width:700px !important; max-width:700px !important; padding:0 !important; gap:0 !important; overflow:visible;
          border:0 !important; border-radius:0 !important;
          background:transparent !important; background-image:none !important;
          box-shadow:none !important; backdrop-filter:none !important; -webkit-backdrop-filter:none !important;
          color:var(--tc-console-text); font-family:var(--tc-console-font) !important;
          font-synthesis:none; -webkit-font-smoothing:antialiased; text-rendering:optimizeLegibility;
        }
        #krypbot-container.kb-console::before { display:none !important; }
        #krypbot-container.kb-console *,
        #krypbot-container.kb-console *::before,
        #krypbot-container.kb-console *::after,
        #oi-zone2.tc-workspace-card *,
        #oi-zone2.tc-workspace-card *::before,
        #oi-zone2.tc-workspace-card *::after { box-shadow:none !important; text-shadow:none !important; }
        #krypbot-container.kb-console.minimized {
          width:154px !important; max-width:154px !important; padding:0 !important; border:1px solid var(--tc-console-border) !important;
          border-radius:var(--tc-console-radius-module) !important; background:var(--tc-console-bg) !important; box-shadow:none !important;
        }
        #krypbot-container.kb-console.minimized:hover { border-color:#4b4c47 !important; box-shadow:none !important; }
        #krypbot-container .kb-logo { color:var(--tc-console-text); font:600 12px/16px var(--tc-console-font); }
        #krypbot-container .kb-logo-mark { border-radius:5px !important; background:var(--tc-console-accent) !important; box-shadow:none !important; }
        #krypbot-container .kb-logo:focus-visible { outline:2px solid var(--tc-console-focus); outline-offset:2px; }
        #krypbot-container .kb-console-grid { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:10px; padding:0; }
        #krypbot-container .kb-console-column { min-width:0; display:flex; flex-direction:column; gap:10px; }
        #krypbot-container .kb-console-module {
          min-width:0; margin:0 !important; padding:12px !important; gap:0 !important; border:1px solid var(--tc-console-border) !important;
          border-radius:var(--tc-console-radius-module) !important; background:var(--tc-console-module) !important; box-shadow:none !important;
        }
        #krypbot-container .kb-auto-play-module { grid-column:1 / -1; }
        #krypbot-container .kb-console-caption {
          display:block; margin:0 0 6px !important; padding:0 0 8px !important; border-bottom:1px solid var(--tc-console-divider);
          color:var(--tc-console-muted) !important; font-size:10px !important; line-height:12px !important; font-weight:600 !important;
          letter-spacing:.12em !important; text-transform:uppercase;
        }
        #krypbot-container .kb-console-module .kb-section {
          min-height:36px; margin:0 !important; padding:0; border-bottom:1px solid var(--tc-console-divider);
        }
        #krypbot-container .kb-console-module .kb-section:last-child { border-bottom:0; }
        #krypbot-container .kb-console-module .kb-section:has(#am-on),
        #krypbot-container .kb-console-module .kb-section:has(#aq-on),
        #krypbot-container .kb-console-module .kb-section:has(#sp-on) {
          border-top:0 !important; background-image:linear-gradient(var(--tc-console-divider),var(--tc-console-divider));
          background-position:top; background-repeat:no-repeat; background-size:100% 1px;
        }
        #krypbot-container .kb-console-module .kb-section-label { gap:0; color:#deded9; font-size:12px; line-height:16px; font-weight:500; letter-spacing:-.005em; }
        #krypbot-container .kb-console-module .kb-row-icon { display:none; }
        #krypbot-container .kb-radio-group:not(:has(input[name="delayMode"])) {
          display:flex; align-items:center; box-sizing:border-box; width:40px; height:24px; padding:0 1px; border:1px solid #44443f; border-radius:12px; background:#3a3a37; box-shadow:none;
          transition:background-color .14s ease,border-color .14s ease;
        }
        #krypbot-container .kb-radio-group:not(:has(input[name="delayMode"]))::after {
          display:none;
        }
        #krypbot-container .kb-radio-group:not(:has(input[name="delayMode"])) .kb-toggle-thumb {
          position:relative; z-index:1; flex:0 0 18px; width:18px; height:18px; margin:0; border:1px solid #d5d6d2; border-radius:50%;
          background:#f1f1ee; box-shadow:none; pointer-events:none; transition:transform .14s ease;
        }
        #krypbot-container .kb-radio-group:not(:has(input[name="delayMode"])):not([aria-disabled="true"]):hover { border-color:#555650; }
        #krypbot-container .kb-radio-group:not(:has(input[name="delayMode"])):focus:not(:focus-visible) { outline:none; }
        #krypbot-container .kb-radio-group:not(:has(input[name="delayMode"])):not([aria-disabled="true"]):focus-visible { outline:2px solid var(--tc-console-focus); outline-offset:2px; }
        #krypbot-container .kb-radio-group[aria-disabled="true"] { border-color:#343431; background:#30302e; }
        #krypbot-container .kb-radio-group[aria-disabled="true"]:focus-visible { outline:2px solid #666760; outline-offset:2px; }
        #krypbot-container .kb-radio-group:not(:has(input[name="delayMode"])):has(input[value="1"]:checked) { border-color:var(--tc-console-accent); background:var(--tc-console-accent); box-shadow:none; }
        #krypbot-container .kb-radio-group:not(:has(input[name="delayMode"])):has(input[value="1"]:checked) .kb-toggle-thumb { transform:translateX(18px); }
        #krypbot-container .kb-radio-group:not(:has(input[name="delayMode"])) label { position:absolute; top:0; bottom:0; z-index:2; width:50%; height:auto; }
        #krypbot-container .kb-radio-group:not(:has(input[name="delayMode"])) input[value="1"] + label { left:0; }
        #krypbot-container .kb-radio-group:not(:has(input[name="delayMode"])) input[value="0"] + label { right:0; }
        #krypbot-container .kb-session-queue-note { margin:4px 1px; color:#9ab7a3; font-size:9px; line-height:13px; }
        #krypbot-container .kb-strength-card,
        #krypbot-container .kb-run-delay-card {
          margin:0 !important; padding:8px 0 !important; border:0 !important; border-bottom:1px solid var(--tc-console-divider) !important;
          border-radius:0 !important; background:transparent !important; box-shadow:none !important;
        }
        #krypbot-container .kb-strength-head,
        #krypbot-container .kb-timing-heading { display:flex; align-items:baseline; justify-content:space-between; margin:0 0 7px; color:#deded9; font-size:12px; line-height:16px; font-weight:500; letter-spacing:-.005em; }
        #krypbot-container .kb-strength-current { color:#b8b9b4; font-size:9px; line-height:13px; font-variant-numeric:tabular-nums; }
        #krypbot-container .kb-strength-current strong { color:#deded9; font-size:10px; line-height:13px; font-weight:600; font-variant-numeric:tabular-nums; }
        #krypbot-container .kb-strength-limits { margin-top:2px; color:var(--tc-console-subtle); font-size:9px; line-height:12px; font-variant-numeric:tabular-nums; }
        #krypbot-container .kb-slider { height:2px; margin:6px 0; appearance:none; -webkit-appearance:none; background:transparent; accent-color:var(--tc-console-accent); }
        #krypbot-container .kb-slider::-webkit-slider-runnable-track { height:2px; border-radius:1px; background:#42423e; }
        #krypbot-container .kb-slider::-webkit-slider-thumb { width:14px; height:14px; margin-top:-6px; border:1px solid #77e29e; border-radius:50%; background:var(--tc-console-accent); box-shadow:none; -webkit-appearance:none; }
        #krypbot-container .kb-slider::-moz-range-track { height:2px; border:0; border-radius:1px; background:#42423e; }
        #krypbot-container .kb-slider::-moz-range-thumb { width:14px; height:14px; border:1px solid #77e29e; border-radius:50%; background:var(--tc-console-accent); box-shadow:none; }
        #krypbot-container .kb-slider:not(:disabled):hover::-webkit-slider-runnable-track { background:#51514c; }
        #krypbot-container .kb-slider:not(:disabled):hover::-moz-range-track { background:#51514c; }
        #krypbot-container .kb-slider:not(:disabled):active::-webkit-slider-thumb { border-color:#b4efc9; background:var(--tc-console-accent-hover); }
        #krypbot-container .kb-slider:not(:disabled):active::-moz-range-thumb { border-color:#b4efc9; background:var(--tc-console-accent-hover); }
        #krypbot-container .kb-slider:disabled { cursor:not-allowed; opacity:.42; }
        #krypbot-container .kb-slider:focus-visible { outline:2px solid var(--tc-console-focus); outline-offset:3px; }
        #krypbot-container .kb-disclosure-toggle { display:none !important; }
        #krypbot-container .kb-disclosure-panel,
        #krypbot-container .kb-disclosure-panel[data-open="true"],
        #krypbot-container .kb-advanced-settings,
        #krypbot-container .kb-advanced-settings[data-open="true"] {
          display:block !important; grid-template-rows:1fr !important; max-height:none !important; opacity:1 !important; visibility:visible !important; pointer-events:auto !important;
          transform:none !important; transition:none !important;
        }
        #krypbot-container .kb-disclosure-inner { overflow:visible; }
        #krypbot-container .kb-run-delay-controls { display:flex; flex-direction:column; align-items:stretch; gap:6px; padding:0; }
        #krypbot-container .kb-delay-range { justify-content:space-between; gap:6px; }
        #krypbot-container .kb-delay-input { width:92px; height:30px; border:1px solid var(--tc-console-border); border-radius:var(--tc-console-radius-control); background:var(--tc-console-field); box-shadow:none; transition:border-color .14s ease,background-color .14s ease; }
        #krypbot-container .kb-delay-input:hover { border-color:#50504a; }
        #krypbot-container .kb-delay-input:focus-within { border-color:var(--tc-console-focus); outline:2px solid var(--tc-console-focus); outline-offset:1px; background:#20201e; box-shadow:none; }
        #krypbot-container .kb-delay-input .kb-num-input { width:68px; height:28px; padding-left:7px; color:#e8e8e4; font-size:11px; line-height:16px; font-weight:600; font-variant-numeric:tabular-nums; }
        #krypbot-container .kb-delay-unit { color:#8c8d87; font-size:9px; line-height:12px; font-weight:500; }
        #krypbot-container .kb-delay-separator { color:#777873; font-size:9px; line-height:12px; }
        #krypbot-container .kb-timing-mode { width:100%; height:29px; padding:1px; border:1px solid var(--tc-console-border); border-radius:var(--tc-console-radius-control); background:var(--tc-console-field); box-shadow:none; }
        #krypbot-container .kb-run-delay-card .kb-timing-mode label { min-width:0; padding:5px 4px; border-radius:3px; color:#999a94; font-size:9px; line-height:16px; font-weight:500; transition:background-color .14s ease,color .14s ease; }
        #krypbot-container .kb-run-delay-card .kb-timing-mode label:hover { color:#cacac5; }
        #krypbot-container .kb-timing-mode input[type="radio"] { position:absolute; display:block; width:1px; height:1px; opacity:0; }
        #krypbot-container .kb-timing-mode input[type="radio"]:focus-visible + label { outline:2px solid var(--tc-console-focus); outline-offset:-2px; }
        #krypbot-container .kb-run-delay-card[data-inactive="true"] .kb-timing-mode input:checked + label { background:#3a3a36; color:#deded9 !important; }
        #krypbot-container .kb-run-delay-card[data-inactive="false"] .kb-timing-mode input:checked + label { background:var(--tc-console-accent); color:#0d2113 !important; }
        #krypbot-container .kb-dependency-hint { margin:5px 0 0; padding:0; color:var(--tc-console-subtle); font-size:9px; line-height:13px; }
        #krypbot-container .kb-session-title { display:block; }
        #krypbot-container .kb-session-title .kb-advanced-toggle { display:none !important; }
        #krypbot-container .kb-advanced-settings-inner { padding:0 !important; }
        #krypbot-container .kb-advanced-heading { display:none; }
        #krypbot-container .kb-session-fields { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:6px; padding:1px 0 6px; }
        #krypbot-container .kb-session-field { position:relative; gap:4px; color:#999a94; font-size:9px; line-height:12px; font-weight:500; text-transform:uppercase; letter-spacing:.06em; }
        #krypbot-container .kb-session-field input { width:100%; height:30px; padding:4px 8px; border:1px solid var(--tc-console-border); border-radius:var(--tc-console-radius-control); background:var(--tc-console-field); color:#e8e8e4; font-size:11px; line-height:16px; font-weight:600; font-variant-numeric:tabular-nums; box-shadow:none; transition:border-color .14s ease,background-color .14s ease; }
        #krypbot-container .kb-session-field input:hover { border-color:#50504a; }
        #krypbot-container .kb-session-field input:focus-visible { border-color:var(--tc-console-focus); outline:2px solid var(--tc-console-focus); outline-offset:1px; background:#20201e; box-shadow:none; }
        #krypbot-container .kb-session-actions { grid-template-columns:1fr auto auto; gap:4px; margin:0; }
        #krypbot-container .kb-session-button,
        #krypbot-container .kb-session-button[data-action="start"] { height:34px; min-height:34px; padding:0 11px; border:1px solid var(--tc-console-border); border-radius:var(--tc-console-radius-control); box-shadow:none; font-size:10px; line-height:14px; font-weight:600; letter-spacing:.035em; transition:background-color .14s ease,border-color .14s ease,color .14s ease; }
        #krypbot-container .kb-session-button[data-action="start"] { border-color:var(--tc-console-accent); background:var(--tc-console-accent); color:#0c1d12; }
        #krypbot-container .kb-session-button:not([disabled]):not([aria-disabled="true"]):hover { border-color:#555650; background:#333330; color:#f1f1ed; transform:none; filter:none; box-shadow:none; }
        #krypbot-container .kb-session-button[data-action="start"]:not([disabled]):not([aria-disabled="true"]):hover { border-color:var(--tc-console-accent-hover); background:var(--tc-console-accent-hover); color:#0a1a10; }
        #krypbot-container .kb-session-button:not([disabled]):not([aria-disabled="true"]):active { border-color:#62635d; background:#292927; color:#fff; transform:none; }
        #krypbot-container .kb-session-button[data-action="start"]:not([disabled]):not([aria-disabled="true"]):active { border-color:#38c86d; background:#38c86d; color:#07150d; }
        #krypbot-container .kb-session-button:focus-visible { outline:2px solid var(--tc-console-focus); outline-offset:2px; box-shadow:none; }
        #krypbot-container .kb-session-button[disabled],
        #krypbot-container .kb-session-button[aria-disabled="true"] { border-color:#343431 !important; background:#2b2b29 !important; color:#6f706b !important; opacity:1; cursor:not-allowed; box-shadow:none !important; }
        #krypbot-container .kb-session-status { gap:3px; margin-top:6px; }
        #krypbot-container .kb-session-primary,
        #krypbot-container .kb-session-stats { color:#9b9c96; font-size:9px; line-height:13px; }
        #krypbot-container .kb-session-primary { display:grid; grid-template-columns:auto minmax(92px,1fr) auto auto 7ch; align-items:baseline; column-gap:5px; }
        #krypbot-container .kb-session-primary .kb-session-separator { margin:0 3px; }
        #krypbot-container .kb-session-stats { display:grid; grid-template-columns:minmax(0,1fr) auto; align-items:baseline; column-gap:12px; }
        #krypbot-container .kb-session-stats > span:last-child { min-width:9ch; text-align:right; }
        #krypbot-container .kb-session-primary strong,
        #krypbot-container .kb-session-stats strong { color:#d7d7d2; font-size:10px; line-height:13px; font-weight:600; font-variant-numeric:tabular-nums; }
        #krypbot-container #kb-session-ttl,
        #krypbot-container #kb-session-observed,
        #krypbot-container #kb-session-raw { font-variant-numeric:tabular-nums; }
        #krypbot-container .kb-engine-module #puzzle-section { margin:0; padding:0; border:0; border-radius:0; background:transparent; box-shadow:none; }
        #krypbot-container .kb-color-input { width:24px; height:24px; border:1px solid var(--tc-console-border); border-radius:3px; box-shadow:none; }
        #krypbot-container .kb-color-input:hover { border-color:#555650; }
        #krypbot-container .kb-color-input:focus-visible { outline:2px solid var(--tc-console-focus); outline-offset:2px; }
        #krypbot-container .kb-footer { width:100%; margin:0; padding:0; border:0; }
        #krypbot-container .kb-footer > div { width:100%; min-height:30px; display:flex; align-items:center; justify-content:space-between; color:#c9cac5; font-size:10px; line-height:14px; }
        #krypbot-container .kb-more-settings[hidden] { display:none !important; }
        #kb-session-toast { box-shadow:none !important; font-family:var(--tc-console-font); }
        #oi-zone2.tc-workspace-card {
          width:300px !important; min-height:0 !important; padding:12px !important; border:1px solid var(--tc-console-border) !important;
          border-radius:var(--tc-console-radius-module) !important; background:var(--tc-console-bg) !important; background-image:none !important;
          box-shadow:none !important; backdrop-filter:none !important; -webkit-backdrop-filter:none !important;
          color:var(--tc-console-text); font-family:var(--tc-console-font) !important;
          font-synthesis:none; -webkit-font-smoothing:antialiased; text-rendering:optimizeLegibility;
        }
        #oi-zone2.tc-workspace-card::before { display:none !important; }
        #oi-zone2 .tc-scout-head { min-height:26px; padding:0 0 7px !important; border-bottom:1px solid var(--tc-console-divider) !important; }
        #oi-zone2 .tc-scout-title,
        #oi-zone2 .tc-scout-head > div:first-child { color:#d7d7d2 !important; font-size:12px !important; line-height:16px !important; font-weight:600 !important; letter-spacing:.06em; text-transform:uppercase; }
        #oi-zone2 .tc-scout-subtitle { margin-top:2px !important; color:var(--tc-console-subtle) !important; font-size:9px !important; line-height:13px !important; }
        #oi-zone2 .tc-scout-empty { gap:5px !important; padding:9px 0 1px !important; }
        #oi-zone2 .tc-scout-status { padding:6px 8px !important; border:1px solid var(--tc-console-border) !important; border-radius:var(--tc-console-radius-control) !important; background:var(--tc-console-module) !important; color:#c4c5bf !important; font-size:10px !important; line-height:14px !important; font-weight:500; }
        #oi-zone2 .tc-scout-retry { margin-top:3px; padding:6px 9px; border:1px solid #3f5d49; border-radius:var(--tc-console-radius-control); background:#29332c; color:#8cdda8; font:600 9px/13px var(--tc-console-font); box-shadow:none; transition:background-color .14s ease,border-color .14s ease,color .14s ease; }
        #oi-zone2 .tc-scout-retry:hover { border-color:#567c61; background:#303d34; color:#a1e8b9; }
        #oi-zone2 .tc-scout-retry:active { border-color:#6a9274; background:#263029; color:#b1efc5; }
        #oi-zone2 .tc-scout-retry:focus-visible { outline:2px solid var(--tc-console-focus); outline-offset:2px; box-shadow:none; }
        #oi-zone2 .tc-scout-loading { min-height:112px; gap:8px; padding:12px; }
        #oi-zone2 .tc-scout-loading .tc-scout-radar { margin-bottom:5px; }
        #oi-zone2 .tc-scout-radar { width:58px; height:58px; border-color:#3f6f50; background:transparent; box-shadow:none; }
        #oi-zone2 .tc-scout-radar::before,
        #oi-zone2 .tc-scout-radar::after { background:#355a42; }
        #oi-zone2 .tc-scout-radar-dot { border:1px solid #9be9b6; background:var(--tc-console-accent); box-shadow:none; }
        #oi-zone2 .tc-scout-skeleton { height:36px; border:1px solid var(--tc-console-divider); border-radius:3px; background:var(--tc-console-row); box-shadow:none; }
        #oi-zone2 .tc-scout-donut,
        #oi-zone2 .tc-scout-donut-copy b,
        #oi-zone2 .tc-scout-stat-value b { font-variant-numeric:tabular-nums; }
        #oi-zone2 .tc-scout-record,
        #oi-zone2 .tc-scout-stat-copy small,
        #oi-zone2 .tc-scout-stat-value small { color:var(--tc-console-subtle) !important; font-size:9px !important; line-height:12px !important; }
        #oi-zone2 .tc-scout-section { border-color:var(--tc-console-divider) !important; }
        #oi-zone2 .tc-scout-section-title { color:var(--tc-console-muted) !important; font-size:9px !important; line-height:13px !important; letter-spacing:.08em !important; font-weight:600 !important; }
        #oi-zone2 .tc-scout-stat-copy b,
        #oi-zone2 .tc-scout-stat-value b { font-size:10px !important; line-height:13px !important; font-weight:600 !important; }
        @media (max-width: 1050px) {
          #oi-wrapper { width:calc(100vw - 20px) !important; flex-direction:column !important; align-items:flex-start !important; gap:8px !important; }
          #oi-wrapper > #krypbot-container.kb-console { width:min(700px, calc(100vw - 20px)) !important; max-width:100% !important; }
          #oi-wrapper > #oi-zone2.tc-workspace-card { width:min(300px, calc(100vw - 20px)) !important; max-width:100% !important; }
          #krypbot-container .kb-console-grid { grid-template-columns:1fr; }
          #oi-wrapper > #krypbot-container.minimized { width:154px !important; max-width:154px !important; }
        }
        @media (max-width: 980px) {
          #oi-wrapper { max-width:calc(100vw - 20px) !important; }
          #oi-wrapper > * { max-width:calc(100vw - 20px) !important; }
        }
        @media (max-width: 340px) {
          #krypbot-container .kb-run-delay-controls { flex-direction:column; align-items:stretch; }
          #krypbot-container .kb-run-delay-card .kb-radio-group:has(input[name="delayMode"]) { align-self:flex-start; }
        }
        @media (max-width: 368px) { #kb-session-toast { left:10px; right:10px; max-width:none; box-sizing:border-box; } }
        #oi-wrapper {
          --space-1:4px; --space-2:8px; --space-3:12px; --space-4:16px;
          --panel-gap:12px; --panel-padding:12px; --field-gap:8px;
          --row-height:36px; --control-height:32px;
          --radius-panel:8px; --radius-control:5px;
          width:min(1034px,100vw) !important; max-width:none !important; padding:var(--space-3) !important;
          display:block !important; box-sizing:border-box !important; gap:0 !important;
        }
        #oi-wrapper,
        #oi-wrapper *,
        #oi-wrapper *::before,
        #oi-wrapper *::after { box-sizing:border-box; }
        #oi-wrapper > #krypbot-container.kb-console {
          width:100% !important; max-width:none !important; min-width:0 !important;
        }
        #oi-wrapper > #krypbot-container.kb-console.minimized {
          width:154px !important; max-width:154px !important;
        }
        #krypbot-container .kb-console-grid {
          width:100%; min-width:0; display:grid; grid-template-columns:minmax(0,1fr);
          grid-template-areas:"core" "visuals" "engine" "autoplay" "scout";
          gap:var(--panel-gap); align-items:stretch; padding:0;
        }
        #oi-wrapper[data-layout-mode="desktop"] #krypbot-container .kb-console-grid {
          grid-template-columns:345px 345px 296px;
          grid-template-rows:auto minmax(0,1fr) auto;
          grid-template-areas:
            "core engine scout"
            "visuals engine scout"
            "autoplay autoplay scout";
        }
        #krypbot-container .kb-core-module { grid-area:core; }
        #krypbot-container .kb-visuals-module { grid-area:visuals; }
        #krypbot-container .kb-engine-module { grid-area:engine; }
        #krypbot-container .kb-auto-play-module { grid-area:autoplay; }
        #krypbot-container .kb-scout-module { grid-area:scout; }
        #krypbot-container .kb-console-column { display:contents; }
        #krypbot-container .kb-console-module,
        #oi-zone2.tc-workspace-card {
          width:auto !important; max-width:none !important; min-width:0 !important; height:auto;
          margin:0 !important; padding:var(--panel-padding) !important;
          border:1px solid var(--tc-console-border) !important; border-radius:var(--radius-panel) !important;
          align-self:stretch; background:var(--tc-console-module) !important;
        }
        #krypbot-container .kb-visuals-module { display:flex; flex-direction:column; }
        #krypbot-container .kb-visuals-module > :not(.kb-console-caption) { flex:0 0 auto; }
        #krypbot-container .kb-console-caption,
        #oi-zone2 .tc-scout-title {
          display:block; height:25px; margin:0 !important; padding:0 0 var(--space-2) !important;
          border-bottom:1px solid var(--tc-console-divider) !important;
          color:var(--tc-console-muted) !important; font:600 11px/16px var(--tc-console-font) !important;
          letter-spacing:.08em !important; text-transform:uppercase;
        }
        #oi-zone2 .tc-scout-head {
          min-height:25px; height:auto; margin:0; padding:0 !important; border:0 !important;
        }
        #oi-zone2 .tc-scout-head > div:first-child:not(.tc-scout-title) { min-width:0; width:100%; }
        #oi-zone2 .tc-scout-head > div:first-child:not(.tc-scout-title) > .tc-scout-title { width:100%; }
        #krypbot-container .kb-console-module .kb-section,
        #krypbot-container .kb-footer > div {
          min-height:var(--row-height); height:var(--row-height); margin:0 !important; padding:0 !important;
          display:flex; align-items:center; border:0 !important;
        }
        #krypbot-container .kb-console-module .kb-section + .kb-section,
        #krypbot-container .kb-footer { border-top:1px solid var(--tc-console-divider) !important; }
        #krypbot-container .kb-console-module .kb-section-label,
        #krypbot-container .kb-footer > div > span,
        #krypbot-container .kb-strength-head,
        #krypbot-container .kb-timing-heading {
          color:#deded9; font-size:13px; line-height:16px; font-weight:500; letter-spacing:0; text-transform:none;
        }
        #krypbot-container .kb-radio-group:not(:has(input[name="delayMode"])) { margin-left:auto; }
        #krypbot-container .kb-color-input {
          width:24px; height:24px; margin-left:auto; padding:0; overflow:hidden;
          border:1px solid var(--tc-console-border); border-radius:var(--radius-control); background:transparent;
        }
        #krypbot-container .kb-color-input::-webkit-color-swatch-wrapper { padding:0; }
        #krypbot-container .kb-color-input::-webkit-color-swatch { border:0; }
        #krypbot-container .kb-color-input::-moz-color-swatch { border:0; }
        #krypbot-container .kb-strength-card,
        #krypbot-container .kb-run-delay-card {
          margin:0 !important; padding:var(--space-3) 0 !important; border:0 !important;
          border-top:1px solid var(--tc-console-divider) !important; border-radius:0 !important;
        }
        #krypbot-container .kb-strength-head,
        #krypbot-container .kb-timing-heading { min-height:16px; margin:0 0 var(--space-2); align-items:baseline; }
        #krypbot-container .kb-strength-current,
        #krypbot-container .kb-strength-current strong,
        #krypbot-container #autoDelayDisplay {
          color:#b8b9b4 !important; font-size:11px !important; line-height:16px !important;
          font-weight:550 !important; font-variant-numeric:tabular-nums;
        }
        #krypbot-container .kb-slider {
          --kb-slider-fill:calc(1 * (100% - 16px) + 8px);
          width:100%; height:16px; margin:var(--space-1) 0; padding:0; background:transparent;
        }
        #krypbot-container .kb-slider::-webkit-slider-runnable-track {
          height:4px; border-radius:2px;
          background:linear-gradient(to right,var(--tc-console-accent) 0,var(--tc-console-accent) var(--kb-slider-fill),#42423e var(--kb-slider-fill),#42423e 100%);
        }
        #krypbot-container .kb-slider::-webkit-slider-thumb { width:16px; height:16px; margin-top:-6px; }
        #krypbot-container .kb-slider::-moz-range-track { height:4px; border-radius:2px; background:#42423e; }
        #krypbot-container .kb-slider::-moz-range-progress { height:4px; border-radius:2px; background:var(--tc-console-accent); }
        #krypbot-container .kb-slider::-moz-range-thumb { width:16px; height:16px; }
        #krypbot-container .kb-strength-limits { display:flex; justify-content:space-between; margin:var(--space-1) 0 0; font-size:11px; line-height:14px; }
        #krypbot-container .kb-run-delay-controls { display:grid; gap:var(--field-gap); }
        #krypbot-container .kb-delay-range { display:flex; align-items:center; width:100%; gap:var(--field-gap); }
        #krypbot-container .kb-delay-input {
          flex:1 1 0; width:auto; min-width:0; height:var(--control-height); display:grid;
          grid-template-columns:minmax(0,1fr) 24px; align-items:center;
        }
        #krypbot-container .kb-delay-input .kb-num-input {
          width:100%; min-width:0; height:30px; padding:0 10px; border:0; background:transparent;
          color:#e8e8e4; font-size:12px; line-height:30px; text-align:left; font-variant-numeric:tabular-nums;
        }
        #krypbot-container .kb-delay-unit { width:24px; padding-right:10px; font-size:11px; line-height:16px; text-align:right; pointer-events:none; }
        #krypbot-container .kb-delay-separator { flex:0 0 11px; color:#a0a19b; font-size:13px; line-height:16px; text-align:center; }
        #krypbot-container .kb-run-delay-card .kb-radio-group.kb-timing-mode:has(input[name="delayMode"]) {
          display:grid; grid-template-columns:var(--kb-timing-columns,repeat(2,minmax(0,1fr))); justify-content:space-between; align-items:stretch;
          width:100%; height:var(--control-height); padding:0; gap:0; box-sizing:border-box;
          border:1px solid var(--tc-console-border); border-radius:var(--radius-control); overflow:hidden; background:var(--tc-console-border);
        }
        #krypbot-container .kb-run-delay-card .kb-radio-group.kb-timing-mode:has(input[name="delayMode"]):focus-within { border-color:var(--tc-console-focus); }
        #krypbot-container[data-focus-input="pointer"] .kb-timing-mode input:focus + label { outline:none; }
        #krypbot-container[data-focus-input="pointer"] .kb-run-delay-card .kb-radio-group.kb-timing-mode:has(input[name="delayMode"]):focus-within { border-color:var(--tc-console-border); }
        #krypbot-container[data-focus-input="pointer"] .kb-session-field input:focus { border-color:var(--tc-console-border); outline:none; background:var(--tc-console-field); box-shadow:none; }
        #krypbot-container .kb-run-delay-card .kb-radio-group.kb-timing-mode:has(input[name="delayMode"]) label {
          display:flex; align-items:center; justify-content:center; width:100%; height:100%; min-width:0; padding:0;
          box-sizing:border-box; border:0; border-radius:0; background:var(--tc-console-module); color:#c4c5bf;
          font-size:11px !important; line-height:16px; font-weight:500;
        }
        #krypbot-container .kb-run-delay-card .kb-radio-group.kb-timing-mode:has(input[name="delayMode"]) label:hover { background:var(--tc-console-row); color:#e1e1dc; }
        #krypbot-container .kb-run-delay-card[data-inactive="true"] .kb-radio-group.kb-timing-mode:has(input[name="delayMode"]) input:checked + label { background:var(--tc-console-border); color:#deded9 !important; }
        #krypbot-container .kb-run-delay-card[data-inactive="false"] .kb-radio-group.kb-timing-mode:has(input[name="delayMode"]) input:checked + label { background:var(--tc-console-accent); color:#0d2113 !important; }
        #krypbot-container .kb-dependency-hint { margin:var(--space-2) 0 0; color:#aaaBa5; font-size:11px; line-height:15px; }
        #krypbot-container .kb-run-delay-card + .kb-section { border-top:1px solid var(--tc-console-divider) !important; }
        #krypbot-container .kb-session-fields {
          display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:var(--field-gap); padding:var(--space-2) 0;
        }
        #krypbot-container .kb-session-field {
          gap:var(--space-1); color:var(--tc-console-muted); font-size:12px; line-height:16px;
          font-weight:500; text-transform:none; letter-spacing:0;
        }
        #krypbot-container .kb-session-field input {
          height:var(--control-height); padding:0 10px; font-size:12px; line-height:30px;
        }
        #krypbot-container .kb-session-actions {
          display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:var(--field-gap); margin:0;
        }
        #krypbot-container #kb-session-start { grid-column:1 / 3; }
        #krypbot-container .kb-session-secondary-actions {
          grid-column:3; display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:var(--field-gap);
        }
        #krypbot-container .kb-session-button,
        #krypbot-container .kb-session-button[data-action="start"] {
          width:100%; min-width:0; height:var(--control-height); min-height:var(--control-height); padding:0 var(--space-2);
          font-size:11px; line-height:16px;
        }
        #krypbot-container .kb-session-button[disabled],
        #krypbot-container .kb-session-button[aria-disabled="true"] {
          border-color:#565752 !important; color:rgba(236,236,232,.55) !important; opacity:1;
        }
        #krypbot-container .kb-session-status {
          display:grid; grid-template-columns:max-content minmax(0,1fr) max-content max-content;
          gap:var(--space-2) var(--field-gap); align-items:baseline;
          margin:var(--space-3) 0 0; padding:var(--space-3) 0 0; border-top:1px solid var(--tc-console-divider);
          border-radius:0; overflow:visible; background:transparent;
        }
        #krypbot-container .kb-session-status-item {
          min-width:0; display:grid; grid-template-columns:subgrid; grid-column:span 2; align-items:baseline;
          color:#9b9c96; font-size:11px; line-height:15px;
        }
        #krypbot-container .kb-session-status-item span { min-width:0; text-align:left; }
        #krypbot-container .kb-session-status-item strong {
          min-width:0; color:#d7d7d2; font-size:11px; line-height:15px; font-weight:600;
          text-align:left; white-space:nowrap; font-variant-numeric:tabular-nums;
        }
        #krypbot-container .kb-session-status-item-right strong { text-align:right; }
        #oi-zone2 .tc-scout-empty { align-items:flex-start !important; justify-content:center; gap:var(--space-2) !important; padding:var(--space-3) 0 0 !important; }
        #oi-zone2[data-state="waiting"] .tc-scout-status {
          display:inline-flex !important; align-items:center; gap:var(--space-2); padding:0 !important; border:0 !important;
          border-radius:0 !important; background:transparent !important; color:#c4c5bf !important;
          font-size:11px !important; line-height:14px !important;
        }
        #oi-zone2[data-state="waiting"] .tc-scout-head > .tc-scout-title { flex:1 1 auto; width:100%; }
        #oi-zone2.tc-workspace-card .tc-scout-head > div.tc-scout-title:first-child {
          color:var(--tc-console-muted) !important; font-size:11px !important; line-height:16px !important;
          font-weight:600 !important; letter-spacing:.08em !important;
        }
        #oi-zone2[data-state="waiting"] .tc-scout-status-dot {
          display:block; width:6px; height:6px; flex:0 0 6px; border-radius:50%; background:var(--tc-console-muted);
        }
        #oi-zone2 .tc-scout-empty-detail { display:block; color:#aaaBa5 !important; font-size:11px !important; line-height:15px !important; }
        #oi-zone2 .tc-scout-subtitle,
        #oi-zone2 .tc-scout-record,
        #oi-zone2 .tc-scout-stat-copy small,
        #oi-zone2 .tc-scout-stat-value small { font-size:11px !important; line-height:15px !important; }
        #oi-wrapper:not([data-layout-mode="desktop"]) #krypbot-container .kb-console-grid { grid-template-columns:minmax(0,1fr); }
        @media (prefers-reduced-motion: reduce) {
          #krypbot-container,
          #krypbot-container .kb-advanced-settings,
          #krypbot-container .kb-advanced-settings[data-open="true"],
          #krypbot-container .kb-disclosure-panel,
          #krypbot-container .kb-disclosure-panel[data-open="true"],
          #krypbot-container .kb-advanced-toggle,
          #krypbot-container .kb-disclosure-toggle,
          #krypbot-container .kb-session-button,
          #krypbot-container .kb-radio-group label,
          #krypbot-container .kb-radio-group::after,
          #krypbot-container .kb-toggle-thumb,
          #kb-session-toast { transition:none !important; }
        }
      </style>
    `;

    const menuHtml = `
      <div id="krypbot-container">
        <button class="kb-logo" id="kb-workspace-launcher" type="button" aria-label="Open Thinker Chess panels" aria-expanded="true">
          <span class="kb-logo-mark" aria-hidden="true">♞</span>
          <span class="kb-logo-copy">Thinker Chess</span>
        </button>

        <div class="kb-section">
          <p class="kb-section-label">Bot</p>
          <div class="kb-radio-group">
            <input type="radio" id="st-on" name="kb-bot-status" value="1"><label for="st-on">ON</label>
            <input type="radio" id="st-off" name="kb-bot-status" value="0" checked><label for="st-off">OFF</label>
            <span class="kb-toggle-thumb" aria-hidden="true"></span>
          </div>
        </div>

        <div class="kb-section">
          <p class="kb-section-label">Auto Moves</p>
          <div class="kb-radio-group">
            <input type="radio" id="am-on" name="kb-auto-move" value="1"><label for="am-on">ON</label>
            <input type="radio" id="am-off" name="kb-auto-move" value="0" checked><label for="am-off">OFF</label>
            <span class="kb-toggle-thumb" aria-hidden="true"></span>
          </div>
        </div>

        <section class="kb-disclosure-block kb-run-delay-card" id="auto-delay-section" data-inactive="true">
          <button class="kb-disclosure-toggle" id="kb-move-timing-toggle" type="button" aria-controls="kb-move-timing-panel" aria-expanded="false">
            <span id="kb-run-delay-label">Move Timing</span>
            <span class="kb-disclosure-summary" id="autoDelayDisplay">0.50–1.00 s</span>
            <span class="kb-advanced-chevron" aria-hidden="true">⌄</span>
          </button>
          <div class="kb-disclosure-panel" id="kb-move-timing-panel" data-open="false" aria-hidden="true" inert>
            <div class="kb-disclosure-inner">
              <div class="kb-run-delay-controls">
                <div class="kb-delay-range">
                  <label class="kb-delay-input">
                    <input type="text" id="minDelayInput" class="kb-num-input" inputmode="decimal" aria-label="Minimum move delay in seconds">
                    <span class="kb-delay-unit" aria-hidden="true">s</span>
                  </label>
                  <span class="kb-delay-separator" aria-hidden="true">–</span>
                  <label class="kb-delay-input">
                    <input type="text" id="maxDelayInput" class="kb-num-input" inputmode="decimal" aria-label="Maximum move delay in seconds">
                    <span class="kb-delay-unit" aria-hidden="true">s</span>
                  </label>
                </div>
                <div class="kb-radio-group kb-timing-mode" role="group" aria-labelledby="kb-run-delay-label">
                  <input type="radio" id="dm-rand" name="delayMode" value="random"><label for="dm-rand">Random</label>
                  <input type="radio" id="dm-max" name="delayMode" value="max"><label for="dm-max">Immediate</label>
                </div>
              </div>
              <p class="kb-dependency-hint" id="kb-run-delay-hint">Enable Auto Moves to apply this timing.</p>
            </div>
          </div>
        </section>

        <section class="kb-strength-card" aria-labelledby="kb-strength-label">
          <div class="kb-strength-head"><span id="kb-strength-label">Strength Level</span><span class="kb-strength-current">Current <strong id="kb-elo-val">3200</strong></span></div>
          <input id="kb-elo-slider" class="kb-slider" type="range" min="800" max="3200" step="100" value="3200" aria-labelledby="kb-strength-label">
          <div class="kb-strength-limits"><span>Min 800</span><span>Max 3200</span></div>
        </section>

        <section class="kb-session-panel" id="kb-session-panel" aria-labelledby="kb-auto-play-title">
          <div class="kb-session-title">
            <h3 id="kb-auto-play-title">Auto Play</h3>
            <button class="kb-advanced-toggle" id="kb-advanced-settings-toggle" type="button" aria-label="Configure Auto Play" aria-controls="advanced-settings-panel" aria-expanded="false">
              <span>Configure</span><span class="kb-advanced-chevron" aria-hidden="true">⌄</span>
            </button>
          </div>
          <div class="kb-advanced-settings" id="advanced-settings-panel" data-open="false" aria-hidden="true" inert>
            <div class="kb-advanced-settings-inner">
              <p class="kb-advanced-heading">Session settings</p>
              <div class="kb-session-fields">
                <label class="kb-session-field">Duration (Min)<input id="kb-session-duration" type="number" min="1" max="1440" step="1" value="120"></label>
                <label class="kb-session-field">Min Wins %<input id="kb-session-min-rate" type="number" min="1" max="98" step="1" value="75"></label>
                <label class="kb-session-field">Max Wins %<input id="kb-session-max-rate" type="number" min="2" max="99" step="1" value="82"></label>
              </div>
            </div>
          </div>
          <div class="kb-session-actions">
            <button class="kb-session-button" id="kb-session-start" data-action="start" type="button">Start</button>
            <div class="kb-session-secondary-actions">
              <button class="kb-session-button" id="kb-session-stop" data-action="stop" type="button">Finish</button>
              <button class="kb-session-button" id="kb-session-export" data-action="export" type="button" aria-label="Export session diagnostic">Export</button>
            </div>
          </div>
          <div class="kb-session-status" aria-live="polite">
            <div class="kb-session-status-item"><span>Status</span><strong id="kb-session-phase">Idle</strong></div>
            <div class="kb-session-status-item kb-session-status-item-right"><span>Time Left</span><strong id="kb-session-ttl">00:00:00</strong></div>
            <div class="kb-session-status-item"><span>Score</span><strong id="kb-session-observed">0 W | 0 D | 0 L</strong></div>
            <div class="kb-session-status-item kb-session-status-item-right"><span>Win Rate</span><strong id="kb-session-raw">—</strong></div>
          </div>
        </section>

        <section class="kb-disclosure-block kb-more-settings">
          <button class="kb-disclosure-toggle" id="kb-more-settings-toggle" type="button" aria-controls="kb-more-settings-panel" aria-expanded="false">
            <span>More Settings</span><span class="kb-advanced-chevron" aria-hidden="true">⌄</span>
          </button>
          <div class="kb-disclosure-panel" id="kb-more-settings-panel" data-open="false" aria-hidden="true" inert>
            <div class="kb-disclosure-inner">
              <div class="kb-section">
                <p class="kb-section-label">Auto Queue</p>
                <div id="kb-auto-queue-controls" class="kb-radio-group">
                  <input type="radio" id="aq-on" name="kb-auto-queue" value="1"><label for="aq-on">ON</label>
                  <input type="radio" id="aq-off" name="kb-auto-queue" value="0" checked><label for="aq-off">OFF</label>
                  <span class="kb-toggle-thumb" aria-hidden="true"></span>
                </div>
              </div>
              <p id="kb-auto-queue-session-note" class="kb-session-queue-note" hidden aria-live="polite">Temporarily enabled by Auto Play. Your saved preference is unchanged.</p>
              <div class="kb-section">
                <p class="kb-section-label">Auto Rating</p>
                <div class="kb-radio-group"><input type="radio" id="aa-on" name="kb-auto-adjust" value="1"><label for="aa-on">ON</label><input type="radio" id="aa-off" name="kb-auto-adjust" value="0" checked><label for="aa-off">OFF</label><span class="kb-toggle-thumb" aria-hidden="true"></span></div>
              </div>
              <div class="kb-section">
                <p class="kb-section-label">Smart Pacing</p>
                <div class="kb-radio-group"><input type="radio" id="sp-on" name="kb-smart-pacing" value="1"><label for="sp-on">ON</label><input type="radio" id="sp-off" name="kb-smart-pacing" value="0" checked><label for="sp-off">OFF</label><span class="kb-toggle-thumb" aria-hidden="true"></span></div>
              </div>
              <div class="kb-section">
                <p class="kb-section-label">Evaluation Bar</p>
                <div class="kb-radio-group"><input type="radio" id="eb-on" name="kb-eval-bar" value="1"><label for="eb-on">ON</label><input type="radio" id="eb-off" name="kb-eval-bar" value="0" checked><label for="eb-off">OFF</label><span class="kb-toggle-thumb" aria-hidden="true"></span></div>
              </div>
              <div class="kb-section">
                <p class="kb-section-label">Banner</p>
                <div class="kb-radio-group" aria-label="Banner"><input type="radio" id="bn-on" name="kb-banner" value="1" checked><label for="bn-on">ON</label><input type="radio" id="bn-off" name="kb-banner" value="0"><label for="bn-off">OFF</label><span class="kb-toggle-thumb" aria-hidden="true"></span></div>
              </div>
              <div class="kb-section">
                <p class="kb-section-label">Recent Form</p>
                <div class="kb-radio-group" aria-label="Recent Form"><input type="radio" id="rf-on" name="kb-recent-form" value="1" checked><label for="rf-on">ON</label><input type="radio" id="rf-off" name="kb-recent-form" value="0"><label for="rf-off">OFF</label><span class="kb-toggle-thumb" aria-hidden="true"></span></div>
              </div>
              <div class="kb-section-col" id="puzzle-section" style="display:none">
                <p class="kb-section-label">Puzzle Mode <span class="kb-inline-note">(Elo 3200)</span></p>
                <div class="kb-section"><p class="kb-subsetting-label">Hint Lines</p><div class="kb-radio-group"><input type="radio" id="ph-on" name="kb-puzzle-hint" value="1"><label for="ph-on">ON</label><input type="radio" id="ph-off" name="kb-puzzle-hint" value="0" checked><label for="ph-off">OFF</label></div></div>
                <div class="kb-section"><p class="kb-subsetting-label">Auto Solve</p><div class="kb-radio-group"><input type="radio" id="pa-on" name="kb-puzzle-auto" value="1"><label for="pa-on">ON</label><input type="radio" id="pa-off" name="kb-puzzle-auto" value="0" checked><label for="pa-off">OFF</label></div></div>
              </div>
            </div>
          </div>
        </section>

        <div id="kb-session-toast" role="status" aria-live="assertive" aria-atomic="true"></div>
        <div class="kb-footer"><div><span>Theme</span><input type="color" id="kb-color-picker" class="kb-color-input" value="#00ff88" aria-label="Theme color"></div></div>
      </div>
    `;

    const syncTimingModeGeometry = (menu = document.getElementById("krypbot-container")) => {
      const group = menu?.querySelector?.(".kb-timing-mode");
      if (!group) return;
      const style = getComputedStyle(group);
      const innerWidth = Math.max(0, Math.round(group.getBoundingClientRect().width)
        - Math.round(Number.parseFloat(style.borderLeftWidth) || 0)
        - Math.round(Number.parseFloat(style.borderRightWidth) || 0));
      const columnWidth = Math.floor(innerWidth / 2);
      group.style.setProperty("--kb-timing-columns", `${columnWidth}px ${columnWidth}px`);
    };

    const applyCompactConsoleLayout = (menu) => {
      if (!menu || typeof menu.querySelector !== "function" || menu.dataset?.consoleLayout === "reference") return;
      const header = menu.querySelector(".kb-header");
      const eyebrow = header?.querySelector(".kb-eyebrow");
      const title = header?.querySelector(".kb-title");
      if (eyebrow) eyebrow.textContent = "THINKER CHESS";
      if (title) title.textContent = "Control Console";

      const sectionByLabel = (root, label) => Array.from(root?.querySelectorAll(".kb-section") || [])
        .find((section) => section.querySelector(".kb-section-label")?.textContent.trim() === label) || null;
      const module = (caption, className = "") => {
        const section = document.createElement("section");
        section.className = `kb-console-module ${className}`.trim();
        const heading = document.createElement("h3");
        heading.className = "kb-console-caption";
        heading.textContent = caption;
        section.appendChild(heading);
        return section;
      };

      const grid = document.createElement("div");
      grid.className = "kb-console-grid";
      const core = module("Core", "kb-core-module");
      const visuals = module("Visuals", "kb-visuals-module");
      const engine = module("Engine Control", "kb-engine-module");
      const autoPlay = menu.querySelector("#kb-session-panel");
      const morePanel = menu.querySelector("#kb-more-settings-panel");
      const moreBlock = morePanel?.closest(".kb-more-settings");
      const bot = sectionByLabel(menu, "Bot");
      const autoMoves = sectionByLabel(menu, "Auto Moves");
      const autoQueue = sectionByLabel(morePanel, "Auto Queue");
      const autoRating = sectionByLabel(morePanel, "Auto Rating");
      const smartPacing = sectionByLabel(morePanel, "Smart Pacing");
      const evaluationBar = sectionByLabel(morePanel, "Evaluation Bar");
      const bannerControl = sectionByLabel(morePanel, "Banner");
      const recentFormControl = sectionByLabel(morePanel, "Recent Form");
      const queueNote = menu.querySelector("#kb-auto-queue-session-note");
      const timing = menu.querySelector("#auto-delay-section");
      const strength = menu.querySelector(".kb-strength-card");
      const puzzle = menu.querySelector("#puzzle-section");
      const footer = menu.querySelector(".kb-footer");

      [bot, autoMoves, autoQueue, queueNote].forEach((node) => { if (node) core.appendChild(node); });
      [evaluationBar, bannerControl, recentFormControl, footer].forEach((node) => { if (node) visuals.appendChild(node); });
      if (timing) {
        const timingToggle = timing.querySelector("#kb-move-timing-toggle");
        const timingLabel = timingToggle?.querySelector("#kb-run-delay-label");
        const timingSummary = timingToggle?.querySelector("#autoDelayDisplay");
        if (timingToggle && timingLabel && timingSummary) {
          const timingHeading = document.createElement("div");
          timingHeading.className = "kb-timing-heading";
          timingHeading.append(timingLabel, timingSummary);
          timing.insertBefore(timingHeading, timingToggle.nextSibling);
        }
      }
      [autoRating, strength, timing, smartPacing, puzzle].forEach((node) => { if (node) engine.appendChild(node); });
      if (autoPlay) {
        autoPlay.classList.add("kb-console-module");
        const autoPlayTitle = autoPlay.querySelector("#kb-auto-play-title");
        autoPlayTitle?.classList.add("kb-console-caption");
      }
      if (moreBlock) moreBlock.hidden = true;

      grid.append(core, visuals, engine);
      if (autoPlay) {
        autoPlay.classList.add("kb-auto-play-module");
        grid.appendChild(autoPlay);
      }
      const scout = document.getElementById("oi-zone2");
      if (scout) {
        scout.classList.add("kb-scout-module");
        grid.appendChild(scout);
      }
      const toast = menu.querySelector("#kb-session-toast");
      menu.insertBefore(grid, toast || null);
      menu.classList.add("kb-console");
      menu.dataset.consoleLayout = "reference";
      syncTimingModeGeometry(menu);
    };

    const bannerHtml = `
      <div id="thinker-chess-banner" style="position:absolute!important;left:-9999px;top:0;z-index:2147483000;pointer-events:none;display:none;align-items:center;justify-content:center;overflow:hidden;background:#252523;border:1px solid #3A3A36;border-radius:8px;box-shadow:none;box-sizing:border-box;padding:12px;container-type:size;transition:none!important;">
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:round(nearest,0.6em,2px);font-size:clamp(12px,13cqw,28px);width:100%;min-width:0;">
          <img data-artwork="banner-horse.webp" src="data:image/webp;base64,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" alt="Thinker Chess horse" style="display:block;flex:0 0 auto;width:round(down,min(50cqw,70px,17cqh),2px);height:auto;max-width:60%;max-height:34cqh;object-fit:contain;">
          <div class="tc-banner-title" style="width:100%;min-width:0;color:#FFFFFF;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:inherit;font-weight:700;letter-spacing:0;line-height:round(nearest,1.1em,2px);white-space:normal;">Thinker Chess</div>
        </div>
      </div>
    `;

    if (!document.getElementById("tc-userscript-style")) document.head.insertAdjacentHTML("beforeend", css);
    startThinkerUiReconciler();

    thinkerMountTimer = setInterval(function () {
      try {
        if (document.body) {
        if (!document.getElementById("thinker-chess-banner")) document.body.insertAdjacentHTML("beforeend", bannerHtml);
        let wrapper = document.getElementById("oi-wrapper");
        if (!wrapper) {
          wrapper = document.createElement("div");
          wrapper.id = "oi-wrapper";
        }
        document.body.appendChild(wrapper);
        if (!document.getElementById("krypbot-container")) wrapper.insertAdjacentHTML("beforeend", menuHtml);
        thinkerMenuNode = document.getElementById("krypbot-container");
        applyCompactConsoleLayout(thinkerMenuNode);
        thinkerBannerNode = document.getElementById("thinker-chess-banner");
        if (!thinkerMenuNode || !thinkerBannerNode) return;
        startThinkerUiReconciler();
        scheduleThinkerBannerPosition = () => {
          if (thinkerBannerFrame !== null) return;
          thinkerBannerFrame = requestAnimationFrame(() => {
            thinkerBannerFrame = null;
            positionThinkerBannerShell();
          });
        };
        scheduleThinkerBannerPosition();
        $ = $ || resolveThinkerJQuery();
        if (typeof $ !== "function") return;
        clearInterval(thinkerMountTimer);
        thinkerMountTimer = null;
        ensureGhostRecoveryControl();

        function updateWorkspaceLayout() {
          const wrapper = document.getElementById("oi-wrapper");
          if (!wrapper || !document.body) return;
          if (wrapper.parentNode !== document.body || wrapper.nextSibling) document.body.appendChild(wrapper);
          const board = document.querySelector(
            "wc-chess-board, chess-board, #board-single, .board, .chess-board, [class*='board-component']",
          );
          const sidebar = findThinkerSidebar();
          const boardRect = getThinkerRect(board);
          const gameplayDocumentBottom = Math.max(
            boardRect?.bottom || 0,
            getThinkerRect(sidebar)?.bottom || 0,
          ) + window.scrollY;
          const safeTop = Math.max(window.innerHeight + THINKER_WORKSPACE_GAP_PX, gameplayDocumentBottom + THINKER_WORKSPACE_GAP_PX);
          const wrapperWidth = Math.min(1034, Math.max(0, window.innerWidth));
          wrapper.style.setProperty("width", wrapperWidth + "px", "important");
          const measuredWrapperWidth = Math.round(wrapper.getBoundingClientRect().width);
          wrapper.dataset.layoutMode = measuredWrapperWidth >= 1034 ? "desktop" : "stacked";
          syncTimingModeGeometry(thinkerMenuNode);
          const safeLeft = Math.round(window.scrollX + Math.max(0, (window.innerWidth - measuredWrapperWidth) / 2));
          wrapper.style.setProperty("top", Math.ceil(safeTop) + "px", "important");
          wrapper.style.setProperty("left", safeLeft + "px", "important");
        }
        scheduleThinkerWorkspaceLayout = () => {
          if (thinkerWorkspaceFrame !== null) return;
          thinkerWorkspaceFrame = requestAnimationFrame(() => {
            thinkerWorkspaceFrame = null;
            updateWorkspaceLayout();
          });
        };
        thinkerResizeHandler = () => {
          scheduleThinkerBannerPosition();
          scheduleThinkerWorkspaceLayout();
        };
        window.addEventListener("resize", thinkerResizeHandler, { passive: true });
        const observeBannerVisibility = () => {
          document.querySelectorAll("wc-chess-board, chess-board, wc-board, #board-single, .board, .chess-board, [class*='board-component'], #board-layout-main, .board-layout-main, .play-controller-component, .board-layout-sidebar, .layout-board-sidebar, #board-layout-sidebar, [data-cy*='sidebar'], [data-test-element*='sidebar'], [class*='game-panel'], aside, [role='complementary']").forEach((node) => {
            for (let current = node; current && current !== document.body && current !== document.documentElement; current = current.parentElement) {
              thinkerBannerLayoutObserver.observe(current, { attributes: true, attributeFilter: ["class", "style", "hidden", "aria-hidden"] });
            }
          });
        };
        thinkerBannerLayoutObserver = new MutationObserver(() => {
          observeBannerVisibility();
          scheduleThinkerWorkspaceLayout();
          const currentSidebar = getThinkerBannerSidebar();
          const sidebarChanged = currentSidebar !== thinkerObservedBannerSidebar;
          const banner = document.getElementById("thinker-chess-banner");
          if (!shouldShowThinkerBanner()) {
            if (banner) banner.style.display = "none";
            return;
          }
          if (thinkerBannerResizeObserver) {
            const currentBoard = document.querySelector("wc-chess-board, chess-board, #board-single, .board, .chess-board, [class*='board-component']");
            if (currentBoard) thinkerBannerResizeObserver.observe(currentBoard);
          }
          if (sidebarChanged || banner?.style.display === "none") scheduleThinkerBannerPosition();
        });
        thinkerBannerLayoutObserver.observe(document.body, {
          childList: true,
          subtree: true,
        });
        observeBannerVisibility();
        if (typeof ResizeObserver === "function") {
          thinkerBannerResizeObserver = new ResizeObserver(() => {
            scheduleThinkerBannerPosition();
            scheduleThinkerWorkspaceLayout();
          });
        }
        scheduleThinkerBannerPosition();
        scheduleThinkerWorkspaceLayout();

        OpponentIntel.ensureScoutWrapper();
        scheduleThinkerWorkspaceLayout();
        OpponentIntel.startObserver();
        setThinkerWorkspaceCollapsed(thinkerWorkspaceCollapsed);
        const switchGroups = document.querySelectorAll(
          "#krypbot-container .kb-radio-group",
        );
        switchGroups.forEach((group) => {
          if (group.querySelector('input[name="delayMode"]')) return;
          const onInput = group.querySelector('input[value="1"]');
          const offInput = group.querySelector('input[value="0"]');
          if (!onInput || !offInput) return;
          group.setAttribute("role", "switch");
          group.setAttribute("tabindex", "0");
          group.setAttribute("aria-checked", onInput.checked ? "true" : "false");
          const toggle = () => {
            if (group.getAttribute?.("aria-disabled") === "true") return;
            const nextInput = onInput.checked ? offInput : onInput;
            nextInput.checked = true;
            group.setAttribute("aria-checked", onInput.checked ? "true" : "false");
            nextInput.dispatchEvent(new Event("change", { bubbles: true }));
          };
          group.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            toggle();
          }, true);
          group.addEventListener("keydown", (event) => {
            if (event.key !== " " && event.key !== "Enter") return;
            event.preventDefault();
            toggle();
          });
        });
        const sessionMenu = document.getElementById("krypbot-container");
        sessionMenu.addEventListener("pointerdown", () => { sessionMenu.dataset.focusInput = "pointer"; }, true);
        thinkerKeyboardFocusHandler = (event) => {
          if (event.key === "Tab") sessionMenu.dataset.focusInput = "keyboard";
        };
        document.addEventListener("keydown", thinkerKeyboardFocusHandler, true);
        const setDisclosureOpen = (toggle, panel, open) => {
          if (!toggle || !panel) return;
          toggle.setAttribute("aria-expanded", open ? "true" : "false");
          panel.dataset.open = open ? "true" : "false";
          panel.setAttribute("aria-hidden", open ? "false" : "true");
          panel.toggleAttribute("inert", !open);
        };
        const resolveAdvancedSettings = (source) => {
          const sessionPanel = source?.closest?.("#kb-session-panel") || sessionMenu?.querySelector("#kb-session-panel");
          return {
            toggle: sessionPanel?.querySelector("#kb-advanced-settings-toggle") || null,
            panel: sessionPanel?.querySelector("#advanced-settings-panel") || null,
          };
        };
        const setAdvancedSettingsOpen = (open, source) => {
          const { toggle, panel } = resolveAdvancedSettings(source);
          setDisclosureOpen(toggle, panel, open);
        };
        const moveTimingToggle = sessionMenu?.querySelector("#kb-move-timing-toggle");
        const moveTimingPanel = sessionMenu?.querySelector("#kb-move-timing-panel");
        const moreSettingsToggle = sessionMenu?.querySelector("#kb-more-settings-toggle");
        const moreSettingsPanel = sessionMenu?.querySelector("#kb-more-settings-panel");
        const setMoveTimingOpen = (open, manual = false) => {
          const delaySection = sessionMenu?.querySelector("#auto-delay-section");
          if (manual && delaySection) delaySection.dataset.userExpanded = open ? "true" : "false";
          setDisclosureOpen(moveTimingToggle, moveTimingPanel, open);
        };
        if (sessionMenu) {
          setAdvancedSettingsOpen(true);
          setMoveTimingOpen(true);
          setDisclosureOpen(moreSettingsToggle, moreSettingsPanel, true);
          sessionMenu.addEventListener("click", (event) => {
            const toggle = event.target?.closest?.("#kb-advanced-settings-toggle");
            if (toggle && sessionMenu.contains(toggle)) {
              event.preventDefault();
              event.stopPropagation();
              setAdvancedSettingsOpen(toggle.getAttribute("aria-expanded") !== "true", toggle);
              return;
            }
            const timingToggle = event.target?.closest?.("#kb-move-timing-toggle");
            if (timingToggle && sessionMenu.contains(timingToggle)) {
              event.preventDefault();
              setMoveTimingOpen(timingToggle.getAttribute("aria-expanded") !== "true", true);
              return;
            }
            const settingsToggle = event.target?.closest?.("#kb-more-settings-toggle");
            if (settingsToggle && sessionMenu.contains(settingsToggle)) {
              event.preventDefault();
              setDisclosureOpen(settingsToggle, moreSettingsPanel, settingsToggle.getAttribute("aria-expanded") !== "true");
            }
          });
        }
        $("#kb-workspace-launcher").on("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          setThinkerWorkspaceCollapsed(false);
        });

        function syncAutoQueueSessionUI() {
          const sessionOwnsQueue = sessionControlBridge.isRunning();
          $(`input[name="kb-auto-queue"][value="${sessionOwnsQueue || auto_queue ? 1 : 0}"]`).prop("checked", true);
          $("input[name='kb-auto-queue']").prop("disabled", sessionOwnsQueue);
          $("#kb-auto-queue-controls")
            .attr("aria-disabled", sessionOwnsQueue ? "true" : "false")
            .attr("title", sessionOwnsQueue ? "Auto Play controls the queue until this session ends." : "");
          const queueNote = document.getElementById("kb-auto-queue-session-note");
          if (queueNote) queueNote.hidden = !sessionOwnsQueue;
        }

        const clampDelay = (value, fallback) => {
          const normalized = String(value).trim().replace(",", ".");
          if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) return fallback;
          const parsed = Number(normalized);
          return Number.isFinite(parsed) ? Math.min(10, Math.max(0.01, parsed)) : fallback;
        };
        const formatDelay = (value) => Number(value).toFixed(2);
        const setStrengthProgress = (value) => {
          const slider = document.getElementById("kb-elo-slider");
          if (!slider) return;
          const minimum = Number(slider.min);
          const maximum = Number(slider.max);
          const ratio = maximum > minimum ? Math.min(1, Math.max(0, (Number(value) - minimum) / (maximum - minimum))) : 0;
          slider.style.setProperty("--kb-slider-fill", `calc(${ratio.toFixed(4)} * (100% - 16px) + 8px)`);
        };
        const syncDelayPresentation = () => {
          const immediate = autoDelayMode === "max";
          $("#minDelayInput").val(immediate ? "0.00" : formatDelay(autoDelayMin));
          $("#maxDelayInput").val(immediate ? "0.00" : formatDelay(autoDelayMax));
          $("#autoDelayDisplay").text(immediate ? "Immediate" : `${formatDelay(autoDelayMin)}–${formatDelay(autoDelayMax)} s`);
        };
        const commitDelayInputs = () => {
          if (autoDelayMode === "max") {
            syncDelayPresentation();
            return;
          }
          let minimum = clampDelay($("#minDelayInput").val(), autoDelayMin);
          let maximum = clampDelay($("#maxDelayInput").val(), autoDelayMax);
          if (minimum > maximum) [minimum, maximum] = [maximum, minimum];
          const changed = minimum !== autoDelayMin || maximum !== autoDelayMax;
          autoDelayMin = minimum;
          autoDelayMax = maximum;
          syncDelayPresentation();
          if (changed) {
            localStorage.setItem("autoMinDelay", String(autoDelayMin));
            localStorage.setItem("autoMaxDelay", String(autoDelayMax));
            pushToServer();
          }
        };

        window.krypbotUpdateUI = function () {
          detectGameMode();
          $(`input[name="kb-bot-status"][value="${hint ? 1 : 0}"]`).prop(
            "checked",
            true,
          );
          $(`input[name="kb-auto-move"][value="${auto_move ? 1 : 0}"]`).prop(
            "checked",
            true,
          );
          const delaySection = document.getElementById("auto-delay-section");
          const delayHint = document.getElementById("kb-run-delay-hint");
          if (delaySection) {
            delaySection.dataset.inactive = auto_move ? "false" : "true";
            delaySection.dataset.mode = autoDelayMode;
            setMoveTimingOpen(true);
          }
          if (delayHint) delayHint.hidden = auto_move;
          syncAutoQueueSessionUI();
          $(`input[name="kb-banner"][value="${thinkerBannerEnabled ? 1 : 0}"]`).prop("checked", true);
          $(`input[name="kb-recent-form"][value="${recentFormEnabled ? 1 : 0}"]`).prop("checked", true);
          $(`input[name="kb-puzzle-hint"][value="${puzzleHint ? 1 : 0}"]`).prop(
            "checked",
            true,
          );
          $(
            `input[name="kb-puzzle-auto"][value="${puzzleAutoMove ? 1 : 0}"]`,
          ).prop("checked", true);
          $(
            `input[name="kb-auto-adjust"][value="${autoAdjust.isEnabled() ? 1 : 0}"]`,
          ).prop("checked", true);

          syncDelayPresentation();
          $(`input[name="delayMode"][value="${autoDelayMode}"]`).prop(
            "checked",
            true,
          );

          const legacyDisplayElo = isLegacyAutoAdjustEffective()
            ? autoAdjust.getCurrentDifficulty()
            : chessBot.elo;
          const displayElo = sessionControlBridge.moveSelectionElo(legacyDisplayElo);
          $("#kb-elo-val").text(displayElo);
          $("#kb-elo-slider").val(displayElo);
          setStrengthProgress(displayElo);
          $("#kb-color-picker").val(current_color);

          // Show/hide puzzle section based on current mode
          if (gameMode === "puzzle") {
            $("#puzzle-section").show();
          } else {
            $("#puzzle-section").hide();
          }
          switchGroups.forEach((group) => {
            const onInput = group.querySelector('input[value="1"]');
            if (onInput) group.setAttribute("aria-checked", onInput.checked ? "true" : "false");
          });
        };

        function sessionConfigFromDraft(draft) {
          const api = globalThis.ThinkerSessionControl;
          const durationMinutes = Number.parseInt(draft.durationMinutes, 10);
          const minimumPercent = Number.parseFloat(draft.minimumPercent);
          const maximumPercent = Number.parseFloat(draft.maximumPercent);
          return api.validateSessionConfig({
            schemaVersion: 1,
            durationMs: durationMinutes * 60000,
            minWinRate: minimumPercent / 100,
            maxWinRate: maximumPercent / 100,
            boostOffsetElo: 200,
            correctionOffsetElo: -200,
            minCompletedGames: 5,
            perceptionElo: Number.isInteger(chessBot.elo) ? chessBot.elo : 1700,
            scaleId: sessionControlTargetScaleId || "calibration-scale-unavailable",
            estimatorVersion: api.ESTIMATOR_VERSION,
            controllerVersion: api.CONTROLLER_VERSION,
            minimumAdmissionHeadroomMs: 30000,
            queueObservationTimeoutMs: 30000,
            maximumDrainMs: 900000,
            maximumConsecutiveSaturatedGames: 3,
          });
        }

        function downloadSessionDiagnostic(diagnostic) {
          const blob = new Blob([JSON.stringify(diagnostic, null, 2)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `thinker-session-diagnostic-${Date.now()}.json`;
          link.click();
          URL.revokeObjectURL(url);
        }

        globalThis.ThinkerSessionControlReady.then((api) => {
          const sessionControlPresenter = api.createSessionControlPresenter({
            getPanel: () => document.getElementById("kb-session-panel"),
            readStatus: () => sessionControlBridge.status(),
            readStartBlocker: () => isMasterEnabled() ? null : "BOT_DISABLED",
            formatDuration: api.formatDuration,
            createConfig: sessionConfigFromDraft,
            start: (config) => sessionControlBridge.start(config),
            stop: () => sessionControlBridge.gracefulStop(),
            setWarning: (code) => {
              sessionControlBridge.setWarning(code);
              if (code === "SESSION_CONFIG_INVALID") setAdvancedSettingsOpen(true);
            },
            notify: notifySessionControl,
            exportDiagnostic: () => sessionControlBridge.exportDiagnostic(),
            downloadDiagnostic: downloadSessionDiagnostic,
          });
          window.krypbotSessionControlUI = Object.freeze({ update: sessionControlPresenter.update, readConfig: sessionControlPresenter.readConfig, dispose: sessionControlPresenter.dispose });
          window.setInterval(() => {
            sessionControlPresenter.update();
            syncAutoQueueSessionUI();
          }, 1000);
          sessionControlPresenter.update();
        }).catch((error) => {
          const code = error && error.code ? error.code : "SESSION_RUNTIME_UNAVAILABLE";
          sessionControlBridge.setWarning(code);
          notifySessionControl(code);
        });

        // Push current menu state to server so config panel reads correct values
        function pushToServer() {
          _localConfigRevision++;
          _localConfigPending = true;
          _queuedConfigSnapshot = JSON.stringify({
            hint: hint,
            autoMove: auto_move,
            autoQueue: auto_queue,
            autoAdjust: typeof autoAdjust !== "undefined" && autoAdjust.isEnabled(),
            evalBar: typeof evalBarEnabled !== "undefined" ? evalBarEnabled : false,
            smartPacing: typeof smartPacingEnabled !== "undefined" ? smartPacingEnabled : false,
            elo: typeof chessBot !== "undefined" ? chessBot.elo : 1500,
            delayMode: typeof autoDelayMode !== "undefined" ? autoDelayMode : "random",
            minDelay: typeof autoDelayMin !== "undefined" ? autoDelayMin : 0.5,
            maxDelay: typeof autoDelayMax !== "undefined" ? autoDelayMax : 2.0,
            color: current_color,
            ghostMode: _ghostModeActive
          });
          flushConfigSave();
        }

        function flushConfigSave() {
          if (_configSaveInFlight || !_queuedConfigSnapshot) return;
          const snapshot = _queuedConfigSnapshot;
          _queuedConfigSnapshot = null;
          _configSaveInFlight = true;
          const onFailure = () => {
            _configSaveInFlight = false;
            if (!_queuedConfigSnapshot) _queuedConfigSnapshot = snapshot;
            if (_configRetryTimer === null) {
              _configRetryTimer = window.setTimeout(() => {
                _configRetryTimer = null;
                flushConfigSave();
              }, 2000);
            }
          };
          GM_xmlhttpRequest({
            method: "POST",
            url: SERVER_URL + "/config/save",
            headers: {"Content-Type": "application/json"},
            timeout: 5000,
            data: snapshot,
            onload(response) {
              if (response.status < 200 || response.status >= 300) {
                onFailure();
                return;
              }
              _configSaveInFlight = false;
              if (_queuedConfigSnapshot) {
                flushConfigSave();
              } else {
                _localConfigPending = false;
                _lastExternalConfig = null;
                pollExternalConfig();
              }
            },
            onerror: onFailure,
            ontimeout: onFailure,
            onabort: onFailure,
          });
        }

        $(document).off("change.kbMasterStatus", 'input[name="kb-bot-status"]').on("change.kbMasterStatus", 'input[name="kb-bot-status"]', function () {
          setMasterEnabled($(this).val() == "1");
          pushToServer();
        });

        $('input[name="kb-auto-move"]').on("change", function () {
          auto_move = $(this).val() == "1";
          checkfen = "";
          if (!auto_move) {
            smartPacer.cancel();
            sessionControlBridge.autoMoveChanged(false).catch((error) => debug("error", "[Session Control] Auto Move pause failed", error));
          }
          window.krypbotUpdateUI();
          pushToServer();
        });

        $('input[name="kb-auto-queue"]').on("change", function () {
          if (sessionControlBridge.isRunning()) {
            window.krypbotUpdateUI();
            return;
          }
          auto_queue = $(this).val() == "1";
          sessionControlBridge.autoQueueChanged(auto_queue);
          localStorage.setItem("kb-auto-queue", auto_queue ? "true" : "false");
          handleAutoQueue();
          window.krypbotUpdateUI();
          pushToServer();
        });

        $('input[name="kb-puzzle-hint"]').on("change", function () {
          puzzleHint = $(this).val() == "1";
          checkfen = "";
          if (!puzzleHint) $(".myhigh, .myarrow").remove();
          window.krypbotUpdateUI();
        });

        $('input[name="kb-puzzle-auto"]').on("change", function () {
          puzzleAutoMove = $(this).val() == "1";
          checkfen = "";
          window.krypbotUpdateUI();
        });

        $('input[name="kb-auto-adjust"]').on("change", function () {
          if ($(this).val() == "1") {
            autoAdjust.updateBaseElo(chessBot.elo);
            autoAdjust.enable();
            refreshAutoAdjustOpponentRating();
          } else {
            autoAdjust.disable();
          }
          window.krypbotUpdateUI();
          pushToServer();
        });

        $("#minDelayInput, #maxDelayInput")
          .on("keydown", function (event) {
            if (event.key !== "Enter") return;
            event.preventDefault();
            commitDelayInputs();
            this.blur();
          })
          .on("blur", function () {
            commitDelayInputs();
          });

        // --- SMART PACING TOGGLE ---
        $('input[name="kb-smart-pacing"]').on("change", function () {
          smartPacingEnabled = $(this).val() === "1";
          localStorage.setItem("smartPacing", smartPacingEnabled);
          if (smartPacingEnabled) {
            $("#auto-delay-section").slideUp(200);
          } else {
            $("#auto-delay-section").slideDown(200);
          }
          window.krypbotUpdateUI();
          pushToServer();
        });

        // Inicializar visibilidade do Auto Run Delay baseado no estado salvo
        if (smartPacingEnabled) {
          $(`input[name="kb-smart-pacing"][value="1"]`).prop("checked", true);
          $("#auto-delay-section").hide();
        }

        $('input[name="kb-banner"]').on("change", function () {
          setThinkerBannerEnabled($(this).val() === "1");
          window.krypbotUpdateUI();
        });

        $('input[name="kb-recent-form"]').on("change", function () {
          recentFormEnabled = $(this).val() === "1";
          localStorage.setItem("recentForm", String(recentFormEnabled));
          if (OpponentIntel.currentEntry) OpponentIntel.renderHUD(OpponentIntel.currentEntry.hudStats);
          else document.querySelectorAll(".tc-hud-stats").forEach((node) => node.remove());
          window.krypbotUpdateUI();
        });

        // --- EVAL BAR TOGGLE ---
        $('input[name="kb-eval-bar"]').on("change", function () {
          evalBarEnabled = $(this).val() === "1";
          localStorage.setItem("evalBar", evalBarEnabled);
          lastEvalFen = "";
          syncEvalBarRenderer();
          window.krypbotUpdateUI();
          pushToServer();
        });

        // Inicializar estado da Eval Bar
        if (evalBarEnabled) {
          $(`input[name="kb-eval-bar"][value="1"]`).prop("checked", true);
        }
        setTimeout(syncEvalBarRenderer, 1500);

        $("input[name='delayMode']").on("change", function () {
          autoDelayMode = $(this).val();
          localStorage.setItem("autoDelayMode", autoDelayMode);

          if (autoDelayMode === "max") {
            autoDelayMin = 0;
            autoDelayMax = 0;
            localStorage.setItem("autoMinDelay", 0);
            localStorage.setItem("autoMaxDelay", 0);
          } else {
            // Restaurar valores padrão ao voltar para Random/Avg
            autoDelayMin = 0.5;
            autoDelayMax = 1.0;
            localStorage.setItem("autoMinDelay", 0.5);
            localStorage.setItem("autoMaxDelay", 1.0);
          }

          syncDelayPresentation();
          window.krypbotUpdateUI();
          pushToServer();
        });

        $("#kb-elo-slider").on("input", function () {
          chessBot.elo = parseInt($(this).val());
          autoAdjust.updateBaseElo(chessBot.elo);
          setStrengthProgress(chessBot.elo);
          window.krypbotUpdateUI();
          pushToServer();
        });

        $("#kb-color-picker").on("input", function () {
          current_color = $(this).val();
          localStorage.setItem("kb_color", current_color);
          if (typeof GM_setValue !== "undefined") {
            GM_setValue("kb_color", current_color);
          }

          $(".myarrow").css(
            "filter",
            `drop-shadow(0 4px 8px ${current_color}66)`,
          );
          $(".myarrow path").attr("fill", current_color);
          $(".myarrow line").attr("stroke", current_color);

          $(".myhigh").css({
            "border-color": current_color,
            "background-color": current_color + "26",
            "box-shadow": `0 4px 12px ${current_color}33`,
          });
          pushToServer();
        });

        // Monitor URL changes to detect puzzle/play mode
        let lastUrl = window.location.href;
        thinkerUrlMonitorTimer = setInterval(() => {
          if (window.location.href !== lastUrl) {
            lastUrl = window.location.href;
            auto_queue_last_url = lastUrl;
            resetAutoQueueTrigger();
            OpponentIntel.reset();
            setTimeout(() => OpponentIntel.checkOpponent(), 150);
            if (isLegacyAutoAdjustEffective()) {
              autoAdjust.resetToBase();
            }
            detectGameMode();
            window.krypbotUpdateUI();

            // Tenta detectar resultado da Ãºltima partida
            const resultEl = document.querySelector(".game-result");
            if (resultEl) {
              const text = resultEl.textContent.trim().toLowerCase();
              if (
                text.includes("win") ||
                text.includes("won") ||
                text.includes("vitória")
              ) {
                updateMySession("W");
                if (gameMode === "play" && isLegacyAutoAdjustEffective()) autoAdjust.recordResult("W");
              } else if (text.includes("draw") || text.includes("empate")) {
                updateMySession("D");
              } else if (
                text.includes("loss") ||
                text.includes("lost") ||
                text.includes("derrota")
              ) {
                updateMySession("L");
                if (gameMode === "play" && isLegacyAutoAdjustEffective()) autoAdjust.recordResult("L");
              }
            }
          }
        }, 1000);

        handleAutoQueue();
        window.krypbotUpdateUI();
        _menuReady = true;
        _lastExternalConfig = null;
        if (resetDefaultsThisVersion) pushToServer();
        else pollExternalConfig();
        thinkerUiBound = true;
        clearThinkerMountFailure();
        applyGhostModeVisibility(_ghostModeActive);
        }
      } catch (error) {
        failThinkerUiMount(error);
      }
    }, 500);
  }

  function attemptThinkerUiMount() {
    try {
      createMenu();
      return true;
    } catch (error) {
      failThinkerUiMount(error);
      return false;
    }
  }

  function removeAds() {
    const adSelectors = [
      ".ad-container",
      ".ad-unit",
      "#ad-sidebar",
      ".board-layout-ad",
      ".sky-ad",
      ".ads-container",
      ".chess-ad-wrapper",
      'iframe[id*="google_ads"]',
    ];
    const style = document.createElement("style");
    style.innerHTML =
      adSelectors.join(", ") +
      " { display: none !important; visibility: hidden !important; height: 0 !important; width: 0 !important; }";
    document.head.appendChild(style);
    setInterval(() => {
      document.querySelectorAll(adSelectors.join(", ")).forEach((ad) => ad.remove());
    }, 1000);
  }

  // --- EXTERNAL CONFIG PANEL (Server Polling) ---
  // Config panel is the source of truth.
  // Userscript reads from server every 2s and applies silently.
  // NO startup POST — that was overwriting config panel values.
  let _lastExternalConfig = null;
  let _ghostModeActive = false;
  let _menuReady = false;
  let _localConfigRevision = 0;
  let _localConfigPending = false;
  let _configSaveInFlight = false;
  let _queuedConfigSnapshot = null;
  let _configRetryTimer = null;
  let _configPollId = 0;

  function pollExternalConfig() {
    if (!_menuReady || _localConfigPending) return;
    const requestRevision = _localConfigRevision;
    const pollId = ++_configPollId;
    GM_xmlhttpRequest({
      method: "GET",
      url: SERVER_URL + "/config/load",
      onload(resp) {
        try {
          if (!_menuReady || _localConfigPending || requestRevision !== _localConfigRevision || pollId !== _configPollId || resp.status !== 200) return;
          const s = JSON.parse(resp.responseText);
          const key = JSON.stringify(s);
          if (key === _lastExternalConfig) return;

          // Ghost Mode — apply immediately, hide EVERYTHING
          if (typeof s.ghostMode === "boolean") {
            applyGhostModeVisibility(s.ghostMode);
          }

          // Bot Status
          if (typeof s.hint === "boolean" && (!masterStatusKnown || hint !== s.hint)) {
            setMasterEnabled(s.hint, false);
            $('input[name="kb-bot-status"][value="' + (hint ? "1" : "0") + '"]').prop("checked", true);
          }

          // Only apply UI-bound values if menu exists (createMenu already ran)
          if (!$("#krypbot-container").length) return;
          // Auto Moves
          if (typeof s.autoMove === "boolean" && auto_move !== s.autoMove) {
            auto_move = s.autoMove;
            checkfen = "";
            $('input[name="kb-auto-move"][value="' + (auto_move ? "1" : "0") + '"]').prop("checked", true);
            if (!auto_move) {
              smartPacer.cancel();
              sessionControlBridge.autoMoveChanged(false).catch((error) => debug("error", "[Session Control] Auto Move pause failed", error));
            }
          }
          // Auto Queue
          if (typeof s.autoQueue === "boolean" && auto_queue !== s.autoQueue) {
            auto_queue = s.autoQueue;
            localStorage.setItem("kb-auto-queue", auto_queue ? "true" : "false");
            if (!sessionControlBridge.isRunning()) $('input[name="kb-auto-queue"][value="' + (auto_queue ? "1" : "0") + '"]').prop("checked", true);
            handleAutoQueue();
            if (typeof window.krypbotUpdateUI === "function") window.krypbotUpdateUI();
          }
          // Auto Adjust
          if (typeof s.autoAdjust === "boolean") {
            const isAdj = typeof autoAdjust !== "undefined" && autoAdjust.isEnabled();
            if (isAdj !== s.autoAdjust) {
              if (s.autoAdjust) { autoAdjust.updateBaseElo(chessBot.elo); autoAdjust.enable(); }
              else { autoAdjust.disable(); }
              $('input[name="kb-auto-adjust"][value="' + (s.autoAdjust ? "1" : "0") + '"]').prop("checked", true);
            }
          }
          // Eval Bar
          if (typeof s.evalBar === "boolean" && evalBarEnabled !== s.evalBar) {
            evalBarEnabled = s.evalBar;
            localStorage.setItem("evalBar", evalBarEnabled);
            $('input[name="kb-eval-bar"][value="' + (evalBarEnabled ? "1" : "0") + '"]').prop("checked", true);
            lastEvalFen = "";
            syncEvalBarRenderer();
          }
          // Smart Pacing
          if (typeof s.smartPacing === "boolean" && smartPacingEnabled !== s.smartPacing) {
            smartPacingEnabled = s.smartPacing;
            localStorage.setItem("smartPacing", smartPacingEnabled);
            $('input[name="kb-smart-pacing"][value="' + (smartPacingEnabled ? "1" : "0") + '"]').prop("checked", true);
            if (smartPacingEnabled) { $("#auto-delay-section").slideUp(200); } else { $("#auto-delay-section").slideDown(200); }
          }
          // Elo
          if (typeof s.elo === "number" && chessBot.elo !== s.elo) {
            chessBot.elo = s.elo;
            $("#kb-elo-slider").val(s.elo);
            setStrengthProgress(s.elo);
            autoAdjust.updateBaseElo(s.elo);
          }
          // Delay Mode
          if (s.delayMode && autoDelayMode !== s.delayMode) {
            autoDelayMode = s.delayMode;
            localStorage.setItem("autoDelayMode", autoDelayMode);
            $('input[name="delayMode"][value="' + autoDelayMode + '"]').prop("checked", true);
          }
          const nextDelayMin = autoDelayMode === "max" ? 0 : clampDelay(s.minDelay, autoDelayMin || DEFAULT_MIN_DELAY);
          const nextDelayMax = autoDelayMode === "max" ? 0 : clampDelay(s.maxDelay, autoDelayMax || DEFAULT_MAX_DELAY);
          let normalizedDelayMin = nextDelayMin;
          let normalizedDelayMax = nextDelayMax;
          if (autoDelayMode !== "max" && normalizedDelayMin > normalizedDelayMax) {
            [normalizedDelayMin, normalizedDelayMax] = [normalizedDelayMax, normalizedDelayMin];
          }
          if (autoDelayMin !== normalizedDelayMin || autoDelayMax !== normalizedDelayMax) {
            autoDelayMin = normalizedDelayMin;
            autoDelayMax = normalizedDelayMax;
            localStorage.setItem("autoMinDelay", String(autoDelayMin));
            localStorage.setItem("autoMaxDelay", String(autoDelayMax));
          }
          syncDelayPresentation();
          // Color
          if (s.color && current_color !== s.color) {
            current_color = s.color;
            localStorage.setItem("kb_color", current_color);
            if (typeof GM_setValue !== "undefined") GM_setValue("kb_color", current_color);
            $("#kb-color-picker").val(current_color);
            $(".myarrow").css("filter", `drop-shadow(0 4px 8px ${current_color}66)`);
            $(".myarrow path").attr("fill", current_color);
            $(".myarrow line").attr("stroke", current_color);
            $(".myhigh").css({"border-color": current_color, "background-color": current_color + "26", "box-shadow": `0 4px 12px ${current_color}33`});
          }
          if (typeof window.krypbotUpdateUI === "function") window.krypbotUpdateUI();
          _lastExternalConfig = key;
        } catch(e) {}
      }
    });
  }
  let thinkerUserscriptStarted = false;
  let thinkerRouteWatchTimer = null;
  let thinkerShellWatchTimer = null;
  let thinkerShellMissingTicks = 0;

  function isThinkerSupportedRoute() {
    const path = String(window.location.pathname || "").toLowerCase();
    return /^\/(play|game|puzzle|puzzles)(\/|$)/.test(path) || Boolean(findThinkerMenuHost());
  }

  function startThinkerUserscript() {
    if (thinkerUserscriptStarted) return;
    thinkerUserscriptStarted = true;
    if (thinkerRouteWatchTimer !== null) {
      window.clearInterval(thinkerRouteWatchTimer);
      thinkerRouteWatchTimer = null;
    }

    setThinkerPageScrollbarHidden(isThinkerSupportedRoute());
    try {
      attemptThinkerUiMount();
    } catch (error) {
      failThinkerUiMount(error);
    }
    thinkerShellWatchTimer = window.setInterval(() => {
      if (!document.body) return;
      if (!isThinkerSupportedRoute()) {
        setThinkerPageScrollbarHidden(false);
        const menu = document.getElementById("krypbot-container");
        const wrapper = document.getElementById("oi-wrapper");
        const banner = document.getElementById("thinker-chess-banner");
        if (menu) menu.style.display = "none";
        if (wrapper) wrapper.style.display = "none";
        if (banner) banner.style.display = "none";
        return;
      }
      setThinkerPageScrollbarHidden(true);
      try {
        reconcileThinkerUiShells();
        const menu = document.getElementById("krypbot-container");
        const banner = document.getElementById("thinker-chess-banner");
        if (menu && banner && thinkerUiBound) {
          thinkerShellMissingTicks = 0;
          if (!shouldShowThinkerBanner()) banner.style.display = "none";
          return;
        }
        thinkerShellMissingTicks++;
        if (thinkerShellMissingTicks >= 3) {
          if (thinkerMountTimer !== null) clearInterval(thinkerMountTimer);
          thinkerMountTimer = null;
          cleanupThinkerUiLifecycle({ removeMenu: true });
          thinkerShellMissingTicks = 0;
        }
        if (thinkerMountTimer === null) attemptThinkerUiMount();
      } catch (error) {
        failThinkerUiMount(error);
      }
    }, 1000);
    removeAds();
    handleAutoQueue();
    setInterval(pollExternalConfig, 2000);

    // Monitor game mode changes and update UI
    setInterval(() => {
      const newMode = detectGameMode();
      if (window.krypbotLastMode !== newMode) {
        window.krypbotLastMode = newMode;
        log("Modo detectado: " + newMode);
        if (typeof window.krypbotUpdateUI === "function")
          window.krypbotUpdateUI();
      }
    }, 500);

    setInterval(() => {
      if (gameMode === "puzzle") {
        if (isMasterEnabled() && (puzzleHint || puzzleAutoMove)) request_move();
      } else {
        if (isMasterEnabled()) request_move();
      }
    }, 10);
  }

  function maybeStartThinkerUserscript() {
    if (!thinkerUserscriptStarted && isThinkerSupportedRoute()) {
      startThinkerUserscript();
    }
  }

  function installThinkerRouteBootstrap() {
    safelySyncEvalBarRenderer();
    maybeStartThinkerUserscript();
    if (!thinkerUserscriptStarted && thinkerRouteWatchTimer === null) {
      thinkerRouteWatchTimer = window.setInterval(maybeStartThinkerUserscript, 250);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", installThinkerRouteBootstrap, { once: true });
  } else {
    installThinkerRouteBootstrap();
  }
})();

/* THINKER_SESSION_CONTROL_GENERATED_START */
globalThis.ThinkerSessionControlReady=(async()=>{
(function(root){
"use strict";
const factories=Object.create(null);
factories["models"]=function(module,exports,require){
const SCHEMA_VERSION=1;const REDUCER_VERSION="session-control-reducer-v1";const ESTIMATOR_VERSION="beta-binomial-terminal-v1";const CONTROLLER_VERSION="two-threshold-hysteresis-v1";const PHASES=Object.freeze(["IDLE","QUEUEING","IN_GAME","DRAINING","PAUSED_QUEUEING","PAUSED_ACTIVE","COMPLETED","ABORTED"]);const MODES=Object.freeze(["BOOST","CORRECT"]);const OUTCOMES=Object.freeze(["WIN","DRAW","LOSS"]);const EXECUTION_MODES=Object.freeze(["ACTIVE_DDA","COMPATIBILITY"]);const QUEUE_INTENT_STATUSES=Object.freeze(["PREPARED","CLAIMED","DISPATCHED","MATCH_OBSERVED","CANCELLED","AMBIGUOUS"]);const TERMINAL_PHASES=Object.freeze(["COMPLETED","ABORTED"]);const HEX_128=/^[0-9a-f]{32}$/;function fail(message){throw new TypeError(message);}function isPlainObject(value){return value!==null&&typeof value==="object"&&!Array.isArray(value)&&(Object.getPrototypeOf(value)===Object.prototype||Object.getPrototypeOf(value)===null);}function requireObject(value,field){if(!isPlainObject(value))fail(`${field} must be an object`);return value;}function exactKeys(value,required,optional,field){requireObject(value,field);const allowed=new Set(required.concat(optional||[]));for(const key of Object.keys(value))if(!allowed.has(key))fail(`${field}.${key} is unknown`);for(const key of required)if(!Object.prototype.hasOwnProperty.call(value,key))fail(`${field}.${key} is required`);}function integer(value,minimum,maximum,field){if(!Number.isInteger(value)||value<minimum||value>maximum)fail(`${field} must be an integer within [${minimum},${maximum}]`);return value;}function finiteRate(value,field){if(!Number.isFinite(value)||value<0||value>1)fail(`${field} must be within [0,1]`);return value;}function nonEmptyString(value,field){if(typeof value!=="string"||value.length===0)fail(`${field} must be a non-empty string`);return value;}function nullable(value,validator){return value===null?null:validator(value);}function enumValue(value,choices,field){if(!choices.includes(value))fail(`${field} is invalid`);return value;}function validateHex128(value,field){if(!HEX_128.test(value))fail(`${field} must be 128-bit lowercase hex`);return value;}function clone(value){return value===undefined?undefined:JSON.parse(JSON.stringify(value));}function deepFreeze(value){if(!value||typeof value!=="object"||Object.isFrozen(value))return value;Object.freeze(value);for(const item of Object.values(value))deepFreeze(item);return value;}function canonicalStringify(value){function canonical(item){if(Array.isArray(item))return item.map(canonical);if(isPlainObject(item)){const output={};for(const key of Object.keys(item).sort())output[key]=canonical(item[key]);return output;}if(typeof item==="number"&&!Number.isFinite(item))fail("canonical JSON cannot contain non-finite numbers");return item;}return JSON.stringify(canonical(value));}function validateSessionConfig(input){const required=["schemaVersion","durationMs","minWinRate","maxWinRate","boostOffsetElo","correctionOffsetElo","minCompletedGames","perceptionElo","scaleId","estimatorVersion","controllerVersion","minimumAdmissionHeadroomMs","queueObservationTimeoutMs","maximumDrainMs","maximumConsecutiveSaturatedGames"];exactKeys(input,required,[],"config");if(input.schemaVersion!==SCHEMA_VERSION)fail("config.schemaVersion is unsupported");integer(input.durationMs,60000,86400000,"config.durationMs");finiteRate(input.minWinRate,"config.minWinRate");finiteRate(input.maxWinRate,"config.maxWinRate");if(!(input.minWinRate>0&&input.minWinRate<input.maxWinRate&&input.maxWinRate<1))fail("config win-rate bounds are invalid");integer(input.boostOffsetElo,-1000,1000,"config.boostOffsetElo");integer(input.correctionOffsetElo,-1000,1000,"config.correctionOffsetElo");integer(input.minCompletedGames,1,100,"config.minCompletedGames");integer(input.perceptionElo,1,10000,"config.perceptionElo");nonEmptyString(input.scaleId,"config.scaleId");if(input.estimatorVersion!==ESTIMATOR_VERSION)fail("config.estimatorVersion is unsupported");if(input.controllerVersion!==CONTROLLER_VERSION)fail("config.controllerVersion is unsupported");integer(input.minimumAdmissionHeadroomMs,5000,600000,"config.minimumAdmissionHeadroomMs");if(input.minimumAdmissionHeadroomMs>=input.durationMs)fail("config.minimumAdmissionHeadroomMs must be less than durationMs");integer(input.queueObservationTimeoutMs,10000,600000,"config.queueObservationTimeoutMs");integer(input.maximumDrainMs,60000,14400000,"config.maximumDrainMs");integer(input.maximumConsecutiveSaturatedGames,1,20,"config.maximumConsecutiveSaturatedGames");return deepFreeze(clone(input));}function validateCounts(input,field){exactKeys(input,["wins","draws","losses","terminalGames"],[],field);for(const key of["wins","draws","losses","terminalGames"])integer(input[key],0,Number.MAX_SAFE_INTEGER,`${field}.${key}`);if(input.wins+input.draws+input.losses!==input.terminalGames)fail(`${field}.terminalGames is inconsistent`);return deepFreeze(clone(input));}function validateQueueIntent(input){if(input===null)return null;exactKeys(input,["schemaVersion","intentId","runtimeGameToken","status","preparedAtEpochMs","claimedByFence","dispatchedAtEpochMs","observeUntilEpochMs"],[],"queueIntent");if(input.schemaVersion!==SCHEMA_VERSION)fail("queueIntent.schemaVersion is unsupported");validateHex128(input.intentId,"queueIntent.intentId");validateHex128(input.runtimeGameToken,"queueIntent.runtimeGameToken");enumValue(input.status,QUEUE_INTENT_STATUSES,"queueIntent.status");integer(input.preparedAtEpochMs,0,Number.MAX_SAFE_INTEGER,"queueIntent.preparedAtEpochMs");nullable(input.claimedByFence,(value)=>integer(value,1,Number.MAX_SAFE_INTEGER,"queueIntent.claimedByFence"));nullable(input.dispatchedAtEpochMs,(value)=>integer(value,0,Number.MAX_SAFE_INTEGER,"queueIntent.dispatchedAtEpochMs"));nullable(input.observeUntilEpochMs,(value)=>integer(value,0,Number.MAX_SAFE_INTEGER,"queueIntent.observeUntilEpochMs"));if(input.status==="PREPARED"&&(input.claimedByFence!==null||input.dispatchedAtEpochMs!==null||input.observeUntilEpochMs!==null))fail("PREPARED queue intent has advanced fields");if(["CLAIMED","DISPATCHED","MATCH_OBSERVED","AMBIGUOUS"].includes(input.status)&&input.claimedByFence===null)fail("claimed queue intent requires a fence");if(["DISPATCHED","MATCH_OBSERVED"].includes(input.status)&&(input.dispatchedAtEpochMs===null||input.observeUntilEpochMs===null))fail("dispatched queue intent requires dispatch timestamps");return deepFreeze(clone(input));}function validateController(input,counts){exactKeys(input,["mode","posteriorWinRate","decisionAtGameCount"],[],"controller");enumValue(input.mode,MODES,"controller.mode");finiteRate(input.posteriorWinRate,"controller.posteriorWinRate");integer(input.decisionAtGameCount,0,Number.MAX_SAFE_INTEGER,"controller.decisionAtGameCount");const expected=(counts.wins+1)/(counts.terminalGames+2);if(Math.abs(input.posteriorWinRate-expected)>Number.EPSILON*4)fail("controller.posteriorWinRate is inconsistent");return deepFreeze(clone(input));}function validateActiveGame(input){if(input===null)return null;requireObject(input,"activeGame");if(input.schemaVersion!==SCHEMA_VERSION)fail("activeGame.schemaVersion is unsupported");for(const field of["canonicalPlatformGameId","queueIntentId","admittedAtEpochMs","runtimeGameToken","targetPinStatus","calibrationCapabilityExpiresAtEpochMs","lastFen","positionRevision","opponent","actuator","actuation"]){if(!Object.prototype.hasOwnProperty.call(input,field))fail(`activeGame.${field} is required`);}exactKeys(input,["schemaVersion","canonicalPlatformGameId","queueIntentId","admittedAtEpochMs","runtimeGameToken","targetPinStatus","calibrationCapabilityExpiresAtEpochMs","lastFen","positionRevision","opponent","actuator","actuation"],[],"activeGame");nonEmptyString(input.canonicalPlatformGameId,"activeGame.canonicalPlatformGameId");validateHex128(input.queueIntentId,"activeGame.queueIntentId");validateHex128(input.runtimeGameToken,"activeGame.runtimeGameToken");enumValue(input.targetPinStatus,["PENDING","PINNED"],"activeGame.targetPinStatus");integer(input.admittedAtEpochMs,0,Number.MAX_SAFE_INTEGER,"activeGame.admittedAtEpochMs");nullable(input.calibrationCapabilityExpiresAtEpochMs,(value)=>integer(value,0,Number.MAX_SAFE_INTEGER,"activeGame.calibrationCapabilityExpiresAtEpochMs"));if(typeof input.lastFen!=="string")fail("activeGame.lastFen must be a string");integer(input.positionRevision,0,Number.MAX_SAFE_INTEGER,"activeGame.positionRevision");exactKeys(input.opponent,["rating","ratingScaleId","source","confidence","observedAtEpochMs"],[],"activeGame.opponent");integer(input.opponent.rating,1,10000,"activeGame.opponent.rating");nonEmptyString(input.opponent.ratingScaleId,"activeGame.opponent.ratingScaleId");nonEmptyString(input.opponent.source,"activeGame.opponent.source");finiteRate(input.opponent.confidence,"activeGame.opponent.confidence");integer(input.opponent.observedAtEpochMs,0,Number.MAX_SAFE_INTEGER,"activeGame.opponent.observedAtEpochMs");if(input.targetPinStatus==="PENDING"){if(input.actuator!==null||input.calibrationCapabilityExpiresAtEpochMs!==null)fail("pending active game cannot contain a pinned actuator");}else{exactKeys(input.actuator,["controllerMode","offsetElo","rawTargetElo","effectiveTargetElo","ratingScaleMappingVersion","ratingScaleMappingChecksum","saturated","saturationReason","scaleId","artifactChecksum","artifactVersion","cohort","rolloutVersion","seedPolicyVersion","requiredBudgetClass"],[],"activeGame.actuator");enumValue(input.actuator.controllerMode,MODES,"activeGame.actuator.controllerMode");integer(input.actuator.offsetElo,-1000,1000,"activeGame.actuator.offsetElo");integer(input.actuator.rawTargetElo,-100000,100000,"activeGame.actuator.rawTargetElo");integer(input.actuator.effectiveTargetElo,1,10000,"activeGame.actuator.effectiveTargetElo");for(const field of["ratingScaleMappingVersion","ratingScaleMappingChecksum","scaleId","artifactChecksum","artifactVersion","cohort","rolloutVersion","seedPolicyVersion","requiredBudgetClass"])nonEmptyString(input.actuator[field],`activeGame.actuator.${field}`);if(typeof input.actuator.saturated!=="boolean")fail("activeGame.actuator.saturated must be boolean");nullable(input.actuator.saturationReason,(value)=>nonEmptyString(value,"activeGame.actuator.saturationReason"));if(input.calibrationCapabilityExpiresAtEpochMs===null)fail("pinned active game requires capability expiry");}exactKeys(input.actuation,["valid","invalidReason","appliedMoveCount","nonAppliedMoveCount","resolvedProfile"],[],"activeGame.actuation");if(typeof input.actuation.valid!=="boolean")fail("activeGame.actuation.valid must be boolean");nullable(input.actuation.invalidReason,(value)=>nonEmptyString(value,"activeGame.actuation.invalidReason"));integer(input.actuation.appliedMoveCount,0,Number.MAX_SAFE_INTEGER,"activeGame.actuation.appliedMoveCount");integer(input.actuation.nonAppliedMoveCount,0,Number.MAX_SAFE_INTEGER,"activeGame.actuation.nonAppliedMoveCount");if(input.actuation.resolvedProfile!==null){exactKeys(input.actuation.resolvedProfile,["resolverVersion","resolutionKey","latentSkill","appliedSkill","budgetClass","profileDigest"],[],"activeGame.actuation.resolvedProfile");for(const field of["resolverVersion","resolutionKey","budgetClass","profileDigest"])nonEmptyString(input.actuation.resolvedProfile[field],`activeGame.actuation.resolvedProfile.${field}`);if(!Number.isFinite(input.actuation.resolvedProfile.latentSkill))fail("activeGame.actuation.resolvedProfile.latentSkill must be finite");integer(input.actuation.resolvedProfile.appliedSkill,-1000,1000,"activeGame.actuation.resolvedProfile.appliedSkill");}return deepFreeze(clone(input));}function validateSnapshot(input){const required=["schemaVersion","sessionId","authorityEpoch","revision","accountKey","phase","createdAtEpochMs","startedAtEpochMs","deadlineEpochMs","enteredDrainingAtEpochMs","drainDeadlineEpochMs","lastObservedEpochMs","config","observedCounts","controlCounts","consecutiveSaturatedEligibleGames","saturationControllerMode","controller","queueIntent","activeGame","pauseReason","completionReason"];exactKeys(input,required,["checksum","executionMode","executionReasonCode","activationContext"],"snapshot");if(input.schemaVersion!==SCHEMA_VERSION)fail("snapshot.schemaVersion is unsupported");validateHex128(input.sessionId,"snapshot.sessionId");integer(input.authorityEpoch,1,Number.MAX_SAFE_INTEGER,"snapshot.authorityEpoch");integer(input.revision,0,Number.MAX_SAFE_INTEGER,"snapshot.revision");nonEmptyString(input.accountKey,"snapshot.accountKey");const executionMode=input.executionMode===undefined?"ACTIVE_DDA":enumValue(input.executionMode,EXECUTION_MODES,"snapshot.executionMode");const executionReasonCode=input.executionReasonCode===undefined||input.executionReasonCode===null?null:nonEmptyString(input.executionReasonCode,"snapshot.executionReasonCode");let activationContext=null;if(input.activationContext!==undefined&&input.activationContext!==null){exactKeys(input.activationContext,["context","pool","opponentRatingScaleId"],[],"snapshot.activationContext");activationContext={context:nonEmptyString(input.activationContext.context,"snapshot.activationContext.context"),pool:nonEmptyString(input.activationContext.pool,"snapshot.activationContext.pool"),opponentRatingScaleId:nonEmptyString(input.activationContext.opponentRatingScaleId,"snapshot.activationContext.opponentRatingScaleId"),};}enumValue(input.phase,PHASES,"snapshot.phase");for(const field of["createdAtEpochMs","startedAtEpochMs","deadlineEpochMs","lastObservedEpochMs"])integer(input[field],0,Number.MAX_SAFE_INTEGER,`snapshot.${field}`);nullable(input.enteredDrainingAtEpochMs,(value)=>integer(value,0,Number.MAX_SAFE_INTEGER,"snapshot.enteredDrainingAtEpochMs"));nullable(input.drainDeadlineEpochMs,(value)=>integer(value,0,Number.MAX_SAFE_INTEGER,"snapshot.drainDeadlineEpochMs"));if(input.deadlineEpochMs!==input.startedAtEpochMs+input.config.durationMs)fail("snapshot.deadlineEpochMs is inconsistent");if(input.lastObservedEpochMs<input.startedAtEpochMs)fail("snapshot.lastObservedEpochMs cannot precede start");const config=validateSessionConfig(input.config);const observedCounts=validateCounts(input.observedCounts,"observedCounts");const controlCounts=validateCounts(input.controlCounts,"controlCounts");integer(input.consecutiveSaturatedEligibleGames,0,Number.MAX_SAFE_INTEGER,"snapshot.consecutiveSaturatedEligibleGames");nullable(input.saturationControllerMode,(value)=>enumValue(value,MODES,"snapshot.saturationControllerMode"));const controller=validateController(input.controller,controlCounts);validateQueueIntent(input.queueIntent);validateActiveGame(input.activeGame);nullable(input.pauseReason,(value)=>nonEmptyString(value,"snapshot.pauseReason"));nullable(input.completionReason,(value)=>nonEmptyString(value,"snapshot.completionReason"));if(input.checksum!==undefined&&!/^[0-9a-f]{64}$/.test(input.checksum))fail("snapshot.checksum is invalid");return deepFreeze({...clone(input),executionMode,executionReasonCode,activationContext,config,observedCounts,controlCounts,controller});}function validateEventEnvelope(input){exactKeys(input,["schemaVersion","eventId","sessionId","authorityEpoch","expectedRevision","sequence","occurredAtEpochMs","type","payload","reducerVersion"],["canonicalPlatformGameId"],"event");if(input.schemaVersion!==SCHEMA_VERSION)fail("event.schemaVersion is unsupported");nonEmptyString(input.eventId,"event.eventId");validateHex128(input.sessionId,"event.sessionId");integer(input.authorityEpoch,1,Number.MAX_SAFE_INTEGER,"event.authorityEpoch");integer(input.expectedRevision,0,Number.MAX_SAFE_INTEGER,"event.expectedRevision");if(input.sequence!==input.expectedRevision+1)fail("event.sequence must equal expectedRevision + 1");integer(input.occurredAtEpochMs,0,Number.MAX_SAFE_INTEGER,"event.occurredAtEpochMs");nonEmptyString(input.type,"event.type");requireObject(input.payload,"event.payload");if(input.reducerVersion!==REDUCER_VERSION)fail("event.reducerVersion is unsupported");if(input.canonicalPlatformGameId!==undefined)nonEmptyString(input.canonicalPlatformGameId,"event.canonicalPlatformGameId");return deepFreeze(clone(input));}function withoutChecksum(snapshot){const output=clone(snapshot);delete output.checksum;return output;}module.exports={CONTROLLER_VERSION,ESTIMATOR_VERSION,EXECUTION_MODES,MODES,OUTCOMES,PHASES,QUEUE_INTENT_STATUSES,REDUCER_VERSION,SCHEMA_VERSION,TERMINAL_PHASES,canonicalStringify,clone,deepFreeze,exactKeys,isPlainObject,validateActiveGame,validateCounts,validateEventEnvelope,validateHex128,validateQueueIntent,validateSessionConfig,validateSnapshot,withoutChecksum,};
};
factories["statistics"]=function(module,exports,require){
const{MODES}=require("./models");const WILSON_Z_95=1.959963984540054;function posteriorMean(counts){return(counts.wins+1)/(counts.terminalGames+2);}function wilsonInterval(wins,terminalGames,z=WILSON_Z_95){if(!Number.isInteger(wins)||!Number.isInteger(terminalGames)||wins<0||terminalGames<0||wins>terminalGames){throw new TypeError("wins and terminalGames must be valid non-negative counts");}if(!Number.isFinite(z)||z<=0)throw new TypeError("z must be positive and finite");if(terminalGames===0)return Object.freeze({lower:0,upper:1});const p=wins / terminalGames;const z2=z*z;const denominator=1+z2 / terminalGames;const center=(p+z2 /(2*terminalGames))/ denominator;const margin=(z*Math.sqrt((p*(1-p)+z2 /(4*terminalGames))/ terminalGames))/ denominator;return Object.freeze({lower:Math.max(0,center-margin),upper:Math.min(1,center+margin)});}function nextControllerMode(mode,counts,config){if(!MODES.includes(mode))throw new TypeError("controller mode is invalid");const posteriorWinRate=posteriorMean(counts);if(counts.terminalGames<config.minCompletedGames)return Object.freeze({mode,posteriorWinRate});if(mode==="BOOST"&&posteriorWinRate>config.maxWinRate)return Object.freeze({mode:"CORRECT",posteriorWinRate});if(mode==="CORRECT"&&posteriorWinRate<config.minWinRate)return Object.freeze({mode:"BOOST",posteriorWinRate});return Object.freeze({mode,posteriorWinRate});}module.exports={WILSON_Z_95,nextControllerMode,posteriorMean,wilsonInterval};
};
factories["clock"]=function(module,exports,require){
const{TERMINAL_PHASES}=require("./models");function effectiveNow(lastObservedEpochMs,wallNowEpochMs){if(!Number.isInteger(lastObservedEpochMs)||!Number.isInteger(wallNowEpochMs)||lastObservedEpochMs<0||wallNowEpochMs<0){throw new TypeError("clock values must be non-negative integer epoch milliseconds");}return Math.max(lastObservedEpochMs,wallNowEpochMs);}function canAdmitQueue(snapshot,wallNowEpochMs){const now=effectiveNow(snapshot.lastObservedEpochMs,wallNowEpochMs);return snapshot.phase==="QUEUEING"&&snapshot.queueIntent===null&&now+snapshot.config.minimumAdmissionHeadroomMs<snapshot.deadlineEpochMs;}function enterDraining(snapshot,now){if(snapshot.enteredDrainingAtEpochMs!==null)return snapshot;return{...snapshot,phase:"DRAINING",enteredDrainingAtEpochMs:now,drainDeadlineEpochMs:now+snapshot.config.maximumDrainMs,};}function reconcileClock(snapshot,wallNowEpochMs){const now=effectiveNow(snapshot.lastObservedEpochMs,wallNowEpochMs);let next=snapshot.lastObservedEpochMs===now?snapshot:{...snapshot,lastObservedEpochMs:now};if(TERMINAL_PHASES.includes(next.phase))return next;if(next.phase==="DRAINING"&&now>=next.drainDeadlineEpochMs){return{...next,phase:"ABORTED",completionReason:"UNRECONCILED_DRAIN_TIMEOUT"};}if(next.phase==="QUEUEING"&&next.queueIntent&&next.queueIntent.status==="DISPATCHED"&&now<next.deadlineEpochMs&&now>=next.queueIntent.observeUntilEpochMs){return{...next,phase:"PAUSED_QUEUEING",pauseReason:"QUEUE_EFFECT_AMBIGUOUS",queueIntent:{...next.queueIntent,status:"AMBIGUOUS"}};}if(now<next.deadlineEpochMs)return next;if(next.phase==="IN_GAME"||next.activeGame!==null||(next.queueIntent&&["DISPATCHED","MATCH_OBSERVED"].includes(next.queueIntent.status))){return enterDraining(next,now);}if(next.phase==="QUEUEING"&&next.queueIntent&&next.queueIntent.status==="CLAIMED"){return{...next,phase:"PAUSED_QUEUEING",pauseReason:"QUEUE_EFFECT_AMBIGUOUS",queueIntent:{...next.queueIntent,status:"AMBIGUOUS"}};}if(next.phase==="QUEUEING"&&next.queueIntent&&next.queueIntent.status==="PREPARED"){next={...next,queueIntent:{...next.queueIntent,status:"CANCELLED"}};}if(next.phase==="QUEUEING"||next.phase==="PAUSED_QUEUEING")return{...next,phase:"COMPLETED",completionReason:"TTL_EXPIRED",pauseReason:null};return next;}module.exports={canAdmitQueue,effectiveNow,enterDraining,reconcileClock};
};
factories["reducer"]=function(module,exports,require){
const{canAdmitQueue,enterDraining,reconcileClock}=require("./clock");const{OUTCOMES,SCHEMA_VERSION,TERMINAL_PHASES,clone,deepFreeze,exactKeys,validateActiveGame,validateEventEnvelope,validateQueueIntent,validateSessionConfig,validateSnapshot,}=require("./models");const{nextControllerMode,posteriorMean}=require("./statistics");function emptyCounts(){return{wins:0,draws:0,losses:0,terminalGames:0};}function incrementCounts(counts,outcome){const next={...counts,terminalGames:counts.terminalGames+1};if(outcome==="WIN")next.wins+=1;if(outcome==="DRAW")next.draws+=1;if(outcome==="LOSS")next.losses+=1;return next;}function startSession(event){const payload=event.payload;exactKeys(payload,["accountKey","config","authorizationDecision"],["executionMode","executionReasonCode","activationContext"],"event.payload");if(typeof payload.accountKey!=="string"||!payload.accountKey)throw new TypeError("event.payload.accountKey is required");exactKeys(payload.authorizationDecision,["schemaVersion","allowed","reason"],[],"event.payload.authorizationDecision");if(payload.authorizationDecision.schemaVersion!==1||payload.authorizationDecision.allowed!==true||typeof payload.authorizationDecision.reason!=="string"||!payload.authorizationDecision.reason)throw new TypeError("session start requires an allowed authorization decision");const config=validateSessionConfig(payload.config);const counts=emptyCounts();return{schemaVersion:SCHEMA_VERSION,sessionId:event.sessionId,authorityEpoch:event.authorityEpoch,revision:event.sequence,accountKey:payload.accountKey,executionMode:payload.executionMode||"ACTIVE_DDA",executionReasonCode:payload.executionReasonCode||null,activationContext:payload.activationContext||null,phase:"QUEUEING",createdAtEpochMs:event.occurredAtEpochMs,startedAtEpochMs:event.occurredAtEpochMs,deadlineEpochMs:event.occurredAtEpochMs+config.durationMs,enteredDrainingAtEpochMs:null,drainDeadlineEpochMs:null,lastObservedEpochMs:event.occurredAtEpochMs,config,observedCounts:counts,controlCounts:counts,consecutiveSaturatedEligibleGames:0,saturationControllerMode:null,controller:{mode:"BOOST",posteriorWinRate:posteriorMean(counts),decisionAtGameCount:0},queueIntent:null,activeGame:null,pauseReason:null,completionReason:null,};}function requireRunning(snapshot){if(TERMINAL_PHASES.includes(snapshot.phase))throw new TypeError("terminal sessions are immutable");}function requirePhase(snapshot,phases,type){if(!phases.includes(snapshot.phase))throw new TypeError(`${type} is invalid in phase ${snapshot.phase}`);}function reduceResult(snapshot,event){const payload=event.payload;exactKeys(payload,["canonicalPlatformGameId","outcome"],["exclusionReason"],"event.payload");if(!snapshot.activeGame||snapshot.activeGame.canonicalPlatformGameId!==payload.canonicalPlatformGameId)throw new TypeError("result does not match the active game");if(event.eventId!==`result:${payload.canonicalPlatformGameId}`||event.canonicalPlatformGameId!==payload.canonicalPlatformGameId)throw new TypeError("result identity is not canonical");if(!OUTCOMES.includes(payload.outcome))throw new TypeError("result outcome is invalid");const controlEligible=snapshot.activeGame.actuation.valid===true&&snapshot.activeGame.actuation.appliedMoveCount>=1;const observedCounts=incrementCounts(snapshot.observedCounts,payload.outcome);const controlCounts=controlEligible?incrementCounts(snapshot.controlCounts,payload.outcome):snapshot.controlCounts;const decision=nextControllerMode(snapshot.controller.mode,controlCounts,snapshot.config);let consecutive=snapshot.consecutiveSaturatedEligibleGames;let saturationMode=snapshot.saturationControllerMode;if(controlEligible){if(snapshot.activeGame.actuator.saturated){consecutive=saturationMode===decision.mode?consecutive+1:1;saturationMode=decision.mode;}else{consecutive=0;saturationMode=null;}}let phase=snapshot.phase==="DRAINING"?"COMPLETED":"QUEUEING";let pauseReason=null;let completionReason=snapshot.phase==="DRAINING"?"DRAIN_COMPLETE":null;if(phase==="QUEUEING"&&consecutive>=snapshot.config.maximumConsecutiveSaturatedGames){phase="PAUSED_QUEUEING";pauseReason="ACTUATOR_SATURATED";}return{...snapshot,phase,observedCounts,controlCounts,consecutiveSaturatedEligibleGames:consecutive,saturationControllerMode:saturationMode,controller:{mode:decision.mode,posteriorWinRate:decision.posteriorWinRate,decisionAtGameCount:controlCounts.terminalGames},queueIntent:null,activeGame:null,pauseReason,completionReason,};}function transition(snapshot,event){const now=event.occurredAtEpochMs;const reconciled=reconcileClock(snapshot,now);if(TERMINAL_PHASES.includes(reconciled.phase)&&event.type!=="FORCE_STOP")return reconciled;switch(event.type){case "CLOCK_RECONCILED":exactKeys(event.payload,[],[],"event.payload");return reconciled;case "QUEUE_INTENT_PREPARED":{requirePhase(reconciled,["QUEUEING"],event.type);if(!canAdmitQueue(reconciled,now))throw new TypeError("queue admission is not allowed");exactKeys(event.payload,["queueIntent"],[],"event.payload");const intent=validateQueueIntent(event.payload.queueIntent);if(intent.status!=="PREPARED")throw new TypeError("new queue intent must be PREPARED");return{...reconciled,queueIntent:intent};}case "QUEUE_INTENT_CLAIMED":{requirePhase(reconciled,["QUEUEING"],event.type);exactKeys(event.payload,["fencingToken"],[],"event.payload");if(!reconciled.queueIntent||reconciled.queueIntent.status!=="PREPARED")throw new TypeError("only PREPARED queue intents can be claimed");if(!Number.isInteger(event.payload.fencingToken)||event.payload.fencingToken<1)throw new TypeError("fencingToken is invalid");return{...reconciled,queueIntent:{...reconciled.queueIntent,status:"CLAIMED",claimedByFence:event.payload.fencingToken}};}case "QUEUE_INTENT_DISPATCHED":{requirePhase(reconciled,["QUEUEING"],event.type);exactKeys(event.payload,[],[],"event.payload");if(!reconciled.queueIntent||reconciled.queueIntent.status!=="CLAIMED")throw new TypeError("only CLAIMED queue intents can be dispatched");return{...reconciled,queueIntent:{...reconciled.queueIntent,status:"DISPATCHED",dispatchedAtEpochMs:now,observeUntilEpochMs:now+reconciled.config.queueObservationTimeoutMs,},};}case "QUEUE_INTENT_FAILED":{requirePhase(reconciled,["QUEUEING","PAUSED_QUEUEING"],event.type);exactKeys(event.payload,["reason"],[],"event.payload");if(!reconciled.queueIntent||!["CLAIMED","DISPATCHED"].includes(reconciled.queueIntent.status))throw new TypeError("only claimed or dispatched queue intents can become ambiguous");return{...reconciled,phase:"PAUSED_QUEUEING",pauseReason:event.payload.reason||"QUEUE_EFFECT_AMBIGUOUS",queueIntent:{...reconciled.queueIntent,status:"AMBIGUOUS"}};}case "QUEUE_INTENT_CANCELLED":{requirePhase(reconciled,["QUEUEING"],event.type);exactKeys(event.payload,["reason"],[],"event.payload");if(!reconciled.queueIntent||reconciled.queueIntent.status!=="CLAIMED")throw new TypeError("only a claimed queue intent can be cancelled before dispatch");return{...reconciled,queueIntent:null,pauseReason:null};}case "GAME_OBSERVED":{requirePhase(reconciled,["QUEUEING","DRAINING","PAUSED_QUEUEING"],event.type);exactKeys(event.payload,["activeGame"],[],"event.payload");if(!reconciled.queueIntent||!["DISPATCHED","AMBIGUOUS"].includes(reconciled.queueIntent.status))throw new TypeError("game requires a dispatched queue intent");const activeGame=validateActiveGame(event.payload.activeGame);if(activeGame.queueIntentId!==reconciled.queueIntent.intentId||activeGame.runtimeGameToken!==reconciled.queueIntent.runtimeGameToken)throw new TypeError("active game does not match queue intent");const phase=now>=reconciled.deadlineEpochMs||reconciled.phase==="DRAINING"?"DRAINING":"IN_GAME";const next={...reconciled,phase,queueIntent:{...reconciled.queueIntent,status:"MATCH_OBSERVED"},activeGame,pauseReason:null};return phase==="DRAINING"?enterDraining(next,now):next;}case "COMPATIBILITY_GAME_OBSERVED":{requirePhase(reconciled,["QUEUEING","DRAINING"],event.type);if(reconciled.executionMode!=="COMPATIBILITY")throw new TypeError("compatibility game requires compatibility execution mode");exactKeys(event.payload,["activeGame"],[],"event.payload");if(reconciled.activeGame)throw new TypeError("an active game is already admitted");const activeGame=validateActiveGame(event.payload.activeGame);const phase=now>=reconciled.deadlineEpochMs||reconciled.phase==="DRAINING"?"DRAINING":"IN_GAME";const next={...reconciled,phase,activeGame,queueIntent:null,pauseReason:null};return phase==="DRAINING"?enterDraining(next,now):next;}case "TARGET_PINNED":{requirePhase(reconciled,["IN_GAME","DRAINING"],event.type);exactKeys(event.payload,["canonicalPlatformGameId","actuator","calibrationCapabilityExpiresAtEpochMs"],[],"event.payload");if(!reconciled.activeGame||reconciled.activeGame.canonicalPlatformGameId!==event.payload.canonicalPlatformGameId)throw new TypeError("target pin does not match active game");if(reconciled.activeGame.targetPinStatus==="PINNED")throw new TypeError("active game target is already pinned");const activeGame=validateActiveGame({...reconciled.activeGame,targetPinStatus:"PINNED",actuator:event.payload.actuator,calibrationCapabilityExpiresAtEpochMs:event.payload.calibrationCapabilityExpiresAtEpochMs});return{...reconciled,activeGame};}case "CAPABILITY_REFRESHED":{requirePhase(reconciled,["IN_GAME","DRAINING"],event.type);exactKeys(event.payload,["canonicalPlatformGameId","calibrationCapabilityExpiresAtEpochMs"],[],"event.payload");if(!reconciled.activeGame||reconciled.activeGame.targetPinStatus!=="PINNED"||reconciled.activeGame.canonicalPlatformGameId!==event.payload.canonicalPlatformGameId)throw new TypeError("capability refresh does not match pinned game");if(!Number.isInteger(event.payload.calibrationCapabilityExpiresAtEpochMs)||event.payload.calibrationCapabilityExpiresAtEpochMs<=reconciled.activeGame.calibrationCapabilityExpiresAtEpochMs)throw new TypeError("capability refresh must extend expiry");return{...reconciled,activeGame:validateActiveGame({...reconciled.activeGame,calibrationCapabilityExpiresAtEpochMs:event.payload.calibrationCapabilityExpiresAtEpochMs})};}case "POSITION_OBSERVED":{requirePhase(reconciled,["IN_GAME","DRAINING"],event.type);exactKeys(event.payload,["canonicalPlatformGameId","fen","positionRevision"],[],"event.payload");const game=reconciled.activeGame;if(!game||game.canonicalPlatformGameId!==event.payload.canonicalPlatformGameId)throw new TypeError("position does not match active game");if(typeof event.payload.fen!=="string"||event.payload.fen.trim().split(/\s+/).length!==6)throw new TypeError("position FEN must contain six fields");if(event.payload.fen===game.lastFen||event.payload.positionRevision!==game.positionRevision+1)throw new TypeError("position revision must advance for a new FEN");return{...reconciled,activeGame:validateActiveGame({...game,lastFen:event.payload.fen,positionRevision:event.payload.positionRevision})};}case "MOVE_PLAN_EVALUATED":{requirePhase(reconciled,["IN_GAME","DRAINING"],event.type);exactKeys(event.payload,["canonicalPlatformGameId","positionRevision","actuation"],[],"event.payload");const game=reconciled.activeGame;if(!game||game.canonicalPlatformGameId!==event.payload.canonicalPlatformGameId||game.positionRevision!==event.payload.positionRevision)throw new TypeError("move plan does not match persisted position");return{...reconciled,activeGame:validateActiveGame({...game,actuation:event.payload.actuation})};}case "GAME_RESULT_OBSERVED":requirePhase(reconciled,["IN_GAME","DRAINING","PAUSED_ACTIVE"],event.type);return reduceResult(reconciled,event);case "COMPATIBILITY_RESULT_OBSERVED":{requirePhase(reconciled,["IN_GAME","DRAINING","PAUSED_ACTIVE"],event.type);exactKeys(event.payload,["canonicalPlatformGameId","outcome"],[],"event.payload");if(!reconciled.activeGame||reconciled.activeGame.canonicalPlatformGameId!==event.payload.canonicalPlatformGameId||event.eventId!==`compat-result:${event.payload.canonicalPlatformGameId}`||event.canonicalPlatformGameId!==event.payload.canonicalPlatformGameId||!OUTCOMES.includes(event.payload.outcome))throw new TypeError("compatibility result identity is invalid");const observedCounts=incrementCounts(reconciled.observedCounts,event.payload.outcome);return{...reconciled,observedCounts,activeGame:null,phase:reconciled.phase==="DRAINING"?"COMPLETED":"QUEUEING",pauseReason:null,completionReason:reconciled.phase==="DRAINING"?"DRAIN_COMPLETE":null};}case "OUTCOME_UNKNOWN":{requirePhase(reconciled,["IN_GAME","DRAINING","PAUSED_ACTIVE"],event.type);exactKeys(event.payload,["canonicalPlatformGameId"],[],"event.payload");if(!reconciled.activeGame||reconciled.activeGame.canonicalPlatformGameId!==event.payload.canonicalPlatformGameId)throw new TypeError("unknown outcome does not match the active game");return{...reconciled,phase:"PAUSED_ACTIVE",pauseReason:"OUTCOME_UNKNOWN"};}case "REQUEST_GRACEFUL_STOP":{exactKeys(event.payload,[],[],"event.payload");requireRunning(reconciled);if(reconciled.activeGame||(reconciled.queueIntent&&["DISPATCHED","MATCH_OBSERVED"].includes(reconciled.queueIntent.status)))return enterDraining(reconciled,now);if(reconciled.queueIntent&&reconciled.queueIntent.status==="CLAIMED")return{...reconciled,phase:"PAUSED_QUEUEING",pauseReason:"QUEUE_EFFECT_AMBIGUOUS",queueIntent:{...reconciled.queueIntent,status:"AMBIGUOUS"}};const queueIntent=reconciled.queueIntent&&reconciled.queueIntent.status==="PREPARED"?{...reconciled.queueIntent,status:"CANCELLED"}:reconciled.queueIntent;return{...reconciled,phase:"COMPLETED",queueIntent,completionReason:"GRACEFUL_STOP"};}case "PAUSE":{exactKeys(event.payload,["reason"],[],"event.payload");requireRunning(reconciled);if(typeof event.payload.reason!=="string"||!event.payload.reason)throw new TypeError("pause reason is required");return{...reconciled,phase:reconciled.activeGame?"PAUSED_ACTIVE":"PAUSED_QUEUEING",pauseReason:event.payload.reason};}case "FORCE_STOP":exactKeys(event.payload,[],[],"event.payload");return{...reconciled,phase:"ABORTED",completionReason:"FORCE_STOPPED",pauseReason:null};default:throw new TypeError(`unsupported event type: ${event.type}`);}}function reduce(snapshot,rawEvent){const event=validateEventEnvelope(rawEvent);if(snapshot===null){if(event.type!=="SESSION_STARTED"||event.expectedRevision!==0||event.sequence!==1)throw new TypeError("first event must start the session");return Object.freeze({nextState:validateSnapshot(startSession(event)),effects:Object.freeze([])});}const current=validateSnapshot(snapshot);if(TERMINAL_PHASES.includes(current.phase))throw new TypeError("terminal sessions are immutable");if(event.sessionId!==current.sessionId||event.authorityEpoch!==current.authorityEpoch)throw new TypeError("event authority identity mismatch");if(event.expectedRevision!==current.revision)throw new TypeError("event revision mismatch");const transitioned=transition(clone(current),event);const nextState=validateSnapshot({...transitioned,revision:event.sequence,lastObservedEpochMs:Math.max(transitioned.lastObservedEpochMs,event.occurredAtEpochMs)});return Object.freeze({nextState:deepFreeze(nextState),effects:Object.freeze([])});}module.exports={emptyCounts,incrementCounts,reduce};
};
factories["repository"]=function(module,exports,require){
const{canonicalStringify,clone,validateEventEnvelope,validateSnapshot,withoutChecksum}=require("./models");const DB_NAME="thinker-session-control";const DB_VERSION=1;class SessionControlError extends Error{constructor(code,message,cause){super(message);this.name="SessionControlError";this.code=code;if(cause!==undefined)this.cause=cause;}}function requestResult(request){return new Promise((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error||new Error("IndexedDB request failed"));});}function transactionDone(transaction){return new Promise((resolve,reject)=>{transaction.oncomplete=()=>resolve();transaction.onabort=()=>reject(transaction.error||new Error("IndexedDB transaction aborted"));transaction.onerror=()=>reject(transaction.error||new Error("IndexedDB transaction failed"));});}function bytesToHex(bytes){return Array.from(bytes,(value)=>value.toString(16).padStart(2,"0")).join("");}async function checksumSnapshot(snapshot,cryptoObject){if(!cryptoObject||!cryptoObject.subtle||typeof cryptoObject.subtle.digest!=="function")throw new SessionControlError("UNSUPPORTED_BROWSER_CAPABILITY","Web Crypto SHA-256 is unavailable");const encoded=new TextEncoder().encode(canonicalStringify(withoutChecksum(snapshot)));return bytesToHex(new Uint8Array(await cryptoObject.subtle.digest("SHA-256",encoded)));}async function recoverAuthority(options){const repository=options.repository;const recoveryPort=options.recoveryPort;let pointer=null;try{pointer=recoveryPort?await recoveryPort.readRecovery():null;const snapshot=await repository.loadCurrentSession(options.accountKey);if(!snapshot){return Object.freeze({status:pointer?"paused":"empty",snapshot:null,pauseReason:pointer?"STORAGE_UNAVAILABLE":null});}let mirrorStatus="current";if(recoveryPort&&(!pointer||pointer.sessionId!==snapshot.sessionId||pointer.revision!==snapshot.revision||pointer.deadlineEpochMs!==snapshot.deadlineEpochMs)){try{await recoveryPort.writeRecovery({schemaVersion:1,sessionId:snapshot.sessionId,revision:snapshot.revision,deadlineEpochMs:snapshot.deadlineEpochMs,dbName:DB_NAME});mirrorStatus="repaired";}catch(_){mirrorStatus="failed";}}return Object.freeze({status:"recovered",snapshot,pauseReason:null,mirrorStatus});}catch(error){return Object.freeze({status:"paused",snapshot:null,pauseReason:error&&error.code==="CORRUPT_AUTHORITY"?"CORRUPT_AUTHORITY":"STORAGE_UNAVAILABLE"});}}function createStores(database){const sessions=database.createObjectStore("sessions",{keyPath:"sessionId"});sessions.createIndex("phase","phase",{unique:false});const events=database.createObjectStore("events",{keyPath:["sessionId","eventId"]});events.createIndex("sessionId","sessionId",{unique:false});events.createIndex("sequence",["sessionId","sequence"],{unique:true});events.createIndex("result",["sessionId","canonicalPlatformGameId"],{unique:true});database.createObjectStore("leases",{keyPath:"leaseName"});database.createObjectStore("metadata",{keyPath:"key"});}function openDatabase(indexedDB,name=DB_NAME){if(!indexedDB||typeof indexedDB.open!=="function")return Promise.reject(new SessionControlError("UNSUPPORTED_BROWSER_CAPABILITY","IndexedDB is unavailable"));return new Promise((resolve,reject)=>{const request=indexedDB.open(name,DB_VERSION);request.onupgradeneeded=(event)=>{if(event.oldVersion!==0){request.transaction.abort();return;}createStores(request.result);};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(new SessionControlError("STORAGE_UNAVAILABLE","IndexedDB open failed",request.error));request.onblocked=()=>reject(new SessionControlError("STORAGE_UNAVAILABLE","IndexedDB migration is blocked"));});}class IndexedDbRepository{constructor(options){const settings=options||{};this.indexedDB=settings.indexedDB;this.crypto=settings.crypto;this.dbName=settings.dbName||DB_NAME;this.recoveryPort=settings.recoveryPort||null;this.database=null;}async open(){if(!this.database)this.database=await openDatabase(this.indexedDB,this.dbName);return this;}close(){if(this.database)this.database.close();this.database=null;}async _db(){await this.open();return this.database;}async loadSession(sessionId){const database=await this._db();const transaction=database.transaction(["sessions","events"],"readonly");const snapshotPromise=requestResult(transaction.objectStore("sessions").get(sessionId));const eventsPromise=requestResult(transaction.objectStore("events").index("sessionId").getAll(sessionId));const[record,events]=await Promise.all([snapshotPromise,eventsPromise,transactionDone(transaction)]);if(!record)return null;let snapshot;try{const expectedChecksum=await checksumSnapshot(record,this.crypto);if(record.checksum!==expectedChecksum)throw new Error("snapshot checksum mismatch");snapshot=validateSnapshot(record);const maximumSequence=events.reduce((maximum,event)=>Math.max(maximum,event.sequence),0);if(maximumSequence!==snapshot.revision)throw new Error("snapshot and journal revisions diverge");}catch(error){throw new SessionControlError("CORRUPT_AUTHORITY","Stored session failed integrity validation",error);}return snapshot;}async loadCurrentSession(accountKey){const database=await this._db();const transaction=database.transaction("metadata","readonly");const pointer=await requestResult(transaction.objectStore("metadata").get(`currentSession:${accountKey}`));await transactionDone(transaction);if(!pointer)return null;const snapshot=await this.loadSession(pointer.sessionId);if(!snapshot)throw new SessionControlError("CORRUPT_AUTHORITY","Current-session metadata references a missing snapshot");return snapshot;}async commit(rawEvent,rawNextSnapshot,leaseBinding){const event=validateEventEnvelope(rawEvent);const nextSnapshot=validateSnapshot(rawNextSnapshot);if(nextSnapshot.sessionId!==event.sessionId||nextSnapshot.revision!==event.sequence||nextSnapshot.authorityEpoch!==event.authorityEpoch){throw new SessionControlError("INVALID_COMMIT","Event and snapshot identity mismatch");}const checksum=await checksumSnapshot(nextSnapshot,this.crypto);const storedSnapshot={...clone(nextSnapshot),checksum};const database=await this._db();const stores=leaseBinding?["sessions","events","metadata","leases"]:["sessions","events","metadata"];const transaction=database.transaction(stores,"readwrite");try{const eventStore=transaction.objectStore("events");const existingEvent=await requestResult(eventStore.get([event.sessionId,event.eventId]));if(existingEvent){transaction.abort();return Object.freeze({status:"duplicate",event:existingEvent});}if(event.canonicalPlatformGameId!==undefined){const existingResult=await requestResult(eventStore.index("result").get([event.sessionId,event.canonicalPlatformGameId]));if(existingResult){transaction.abort();return Object.freeze({status:"duplicate",event:existingResult});}}const current=await requestResult(transaction.objectStore("sessions").get(event.sessionId));const currentRevision=current?current.revision:0;if(currentRevision!==event.expectedRevision)throw new SessionControlError("REVISION_CONFLICT","Expected session revision does not match authority");if(!current){const pointer=await requestResult(transaction.objectStore("metadata").get(`currentSession:${nextSnapshot.accountKey}`));if(pointer&&pointer.sessionId!==nextSnapshot.sessionId){const prior=await requestResult(transaction.objectStore("sessions").get(pointer.sessionId));if(prior&&!["COMPLETED","ABORTED"].includes(prior.phase))throw new SessionControlError("ACTIVE_SESSION_EXISTS","Account already has a nonterminal session");}}if(leaseBinding){const lease=await requestResult(transaction.objectStore("leases").get(leaseBinding.leaseName));const floorRecord=await requestResult(transaction.objectStore("metadata").get("wallClockFloor"));const now=Math.max(leaseBinding.nowEpochMs,floorRecord?floorRecord.value:0);if(!lease||lease.authorityEpoch!==event.authorityEpoch||lease.sessionId!==event.sessionId||lease.ownerTabId!==leaseBinding.ownerTabId||lease.fencingToken!==leaseBinding.fencingToken||lease.expiresAtEpochMs<=now){throw new SessionControlError("STALE_FENCE","Lease fence is missing, expired, or stale");}}eventStore.add(clone(event));transaction.objectStore("sessions").put(storedSnapshot);transaction.objectStore("metadata").put({key:`currentSession:${nextSnapshot.accountKey}`,sessionId:nextSnapshot.sessionId});await transactionDone(transaction);}catch(error){if(transaction.readyState!=="done"){try{transaction.abort();}catch(_){}}if(error instanceof SessionControlError)throw error;throw new SessionControlError("STORAGE_UNAVAILABLE","Atomic IndexedDB commit failed",error);}let mirrorStatus="not-configured";if(this.recoveryPort){try{await this.recoveryPort.writeRecovery({schemaVersion:1,sessionId:nextSnapshot.sessionId,revision:nextSnapshot.revision,deadlineEpochMs:nextSnapshot.deadlineEpochMs,dbName:this.dbName});mirrorStatus="written";}catch(_){mirrorStatus="failed";}}return Object.freeze({status:"committed",snapshot:deepFreezeRecord(storedSnapshot),mirrorStatus});}async updateLease(command){const database=await this._db();const transaction=database.transaction(["leases","metadata"],"readwrite");try{const leases=transaction.objectStore("leases");const metadata=transaction.objectStore("metadata");const current=await requestResult(leases.get(command.leaseName));const floorRecord=await requestResult(metadata.get("wallClockFloor"));const effectiveNowMs=Math.max(command.nowEpochMs,floorRecord?floorRecord.value:0);metadata.put({key:"wallClockFloor",value:effectiveNowMs});const sameOwner=current&&current.authorityEpoch===command.authorityEpoch&&current.sessionId===command.sessionId&&current.ownerTabId===command.ownerTabId;if(current&&current.expiresAtEpochMs>effectiveNowMs&&!sameOwner){await transactionDone(transaction);return Object.freeze({status:"contended",lease:clone(current),effectiveNowMs});}const fencingToken=sameOwner&&current.expiresAtEpochMs>effectiveNowMs?current.fencingToken:(current?current.fencingToken:0)+1;const lease={leaseName:command.leaseName,authorityEpoch:command.authorityEpoch,sessionId:command.sessionId,ownerTabId:command.ownerTabId,fencingToken,expiresAtEpochMs:effectiveNowMs+command.leaseDurationMs,};leases.put(lease);await transactionDone(transaction);return Object.freeze({status:sameOwner?"renewed":"acquired",lease:Object.freeze(clone(lease)),effectiveNowMs});}catch(error){try{transaction.abort();}catch(_){}throw error instanceof SessionControlError?error:new SessionControlError("STORAGE_UNAVAILABLE","Lease update failed",error);}}async assertFence(binding){const database=await this._db();const transaction=database.transaction(["leases","metadata","sessions"],"readonly");const leasePromise=requestResult(transaction.objectStore("leases").get(binding.leaseName));const floorPromise=requestResult(transaction.objectStore("metadata").get("wallClockFloor"));const snapshotPromise=requestResult(transaction.objectStore("sessions").get(binding.sessionId));const[lease,floorRecord,snapshot]=await Promise.all([leasePromise,floorPromise,snapshotPromise,transactionDone(transaction)]);const now=Math.max(binding.nowEpochMs,floorRecord?floorRecord.value:0);if(!lease||lease.authorityEpoch!==binding.authorityEpoch||lease.sessionId!==binding.sessionId||lease.ownerTabId!==binding.ownerTabId||lease.fencingToken!==binding.fencingToken||lease.expiresAtEpochMs<=now){throw new SessionControlError("STALE_FENCE","Lease fence is missing, expired, or stale");}if(!snapshot||snapshot.revision!==binding.expectedRevision)throw new SessionControlError("REVISION_CONFLICT","Effect revision is stale");return Object.freeze(clone(lease));}}function deepFreezeRecord(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.freeze(value);Object.values(value).forEach(deepFreezeRecord);}return value;}module.exports={DB_NAME,DB_VERSION,IndexedDbRepository,SessionControlError,checksumSnapshot,openDatabase,recoverAuthority,requestResult,transactionDone,};
};
factories["controller"]=function(module,exports,require){
const{canAdmitQueue,effectiveNow}=require("./clock");const{REDUCER_VERSION,SCHEMA_VERSION,TERMINAL_PHASES,validateHex128,validateSessionConfig,validateSnapshot}=require("./models");const{reduce}=require("./reducer");const{SessionControlError}=require("./repository");const{validatePlatformObservation}=require("./platform-chesscom");const ACTIVE_PHASES=Object.freeze(["QUEUEING","IN_GAME","DRAINING","PAUSED_QUEUEING","PAUSED_ACTIVE"]);function decision(allowed,reason){return Object.freeze({allowed,reason});}function isSessionActive(snapshot){return Boolean(snapshot&&ACTIVE_PHASES.includes(snapshot.phase));}function evaluateQueueGate(input){if(!input.userAutoQueue)return decision(false,"USER_AUTO_QUEUE_DISABLED");if(!input.isLeader)return decision(false,"LEADER_REQUIRED");if(!input.storageHealthy)return decision(false,"STORAGE_UNAVAILABLE");const snapshot=validateSnapshot(input.snapshot);if(snapshot.phase!=="QUEUEING")return decision(false,"PHASE_NOT_QUEUEING");if(snapshot.activeGame!==null)return decision(false,"ACTIVE_GAME_PRESENT");if(snapshot.queueIntent!==null)return decision(false,"QUEUE_INTENT_PRESENT");if(!canAdmitQueue(snapshot,input.nowEpochMs))return decision(false,"TTL_HEADROOM_INSUFFICIENT");const readiness=input.calibrationReadiness;if(!readiness||readiness.active!==true)return decision(false,"CALIBRATION_NOT_ACTIVE");if(readiness.opponentRatingScaleId!==input.intendedQueueScaleId)return decision(false,"CALIBRATION_SCALE_MISMATCH");if(!Number.isInteger(readiness.expiresAtEpochMs)||readiness.expiresAtEpochMs<=effectiveNow(snapshot.lastObservedEpochMs,input.nowEpochMs))return decision(false,"CALIBRATION_EXPIRED");return decision(true,"ALLOWED");}function evaluateQueueDispatchGate(input){if(!input.userAutoQueue)return decision(false,"USER_AUTO_QUEUE_DISABLED");if(!input.isLeader)return decision(false,"LEADER_REQUIRED");if(!input.storageHealthy)return decision(false,"STORAGE_UNAVAILABLE");const snapshot=validateSnapshot(input.snapshot);if(snapshot.phase!=="QUEUEING")return decision(false,"PHASE_NOT_QUEUEING");if(snapshot.activeGame!==null)return decision(false,"ACTIVE_GAME_PRESENT");if(!snapshot.queueIntent||snapshot.queueIntent.status!=="CLAIMED")return decision(false,"QUEUE_INTENT_NOT_CLAIMED");const now=effectiveNow(snapshot.lastObservedEpochMs,input.nowEpochMs);if(now+snapshot.config.minimumAdmissionHeadroomMs>=snapshot.deadlineEpochMs)return decision(false,"TTL_HEADROOM_INSUFFICIENT");const readiness=input.calibrationReadiness;if(!readiness||readiness.active!==true)return decision(false,"CALIBRATION_NOT_ACTIVE");if(readiness.opponentRatingScaleId!==input.intendedQueueScaleId)return decision(false,"CALIBRATION_SCALE_MISMATCH");if(!Number.isInteger(readiness.expiresAtEpochMs)||readiness.expiresAtEpochMs<=now)return decision(false,"CALIBRATION_EXPIRED");return decision(true,"ALLOWED");}function evaluateAutoMoveGate(input){if(!input.userAutoMove)return decision(false,"USER_AUTOMOVE_DISABLED");if(!input.isLeader)return decision(false,"LEADER_REQUIRED");if(!input.storageHealthy)return decision(false,"STORAGE_UNAVAILABLE");const snapshot=validateSnapshot(input.snapshot);if(!["IN_GAME","DRAINING"].includes(snapshot.phase))return decision(false,"PHASE_NOT_ACTIVE");const game=snapshot.activeGame;if(!game)return decision(false,"ACTIVE_GAME_MISSING");if(game.targetPinStatus!=="PINNED"||!game.actuator)return decision(false,"TARGET_NOT_PINNED");if(!game.actuation.valid)return decision(false,game.actuation.invalidReason||"ACTUATION_INVALID");const now=effectiveNow(snapshot.lastObservedEpochMs,input.nowEpochMs);if(game.calibrationCapabilityExpiresAtEpochMs<=now)return decision(false,"CALIBRATION_EXPIRED");if(input.gameMode!=="play")return decision(false,"GAME_MODE_NOT_PLAY");const observed=input.observedGame;if(!observed||observed.gameIdentityStable!==true||observed.terminalState!=="ONGOING")return decision(false,"GAME_IDENTITY_UNSTABLE");if(observed.canonicalPlatformGameId!==game.canonicalPlatformGameId||observed.accountKey!==snapshot.accountKey||observed.runtimeGameToken!==game.runtimeGameToken)return decision(false,"GAME_IDENTITY_MISMATCH");return decision(true,"ALLOWED");}class EffectEpoch{constructor(){this.value=0;}advance(){this.value+=1;return this.value;}capture(){return this.value;}isCurrent(value){return value===this.value;}}class SessionControlController{constructor(options){if(!options||!options.repository||!options.leader||!options.clock||typeof options.idFactory!=="function")throw new TypeError("repository, leader, clock, and idFactory are required");validateHex128(options.ownerTabId,"ownerTabId");this.repository=options.repository;this.leader=options.leader;this.clock=options.clock;this.idFactory=options.idFactory;this.ownerTabId=options.ownerTabId;this.snapshot=null;this.lease=null;this.storageHealthy=true;this.effectEpoch=new EffectEpoch();this.pendingPosition=null;this.positionCommit=null;this.telemetry=options.telemetry||null;this.rolloutStage=options.rolloutStage||"DISABLED";this.executionMode=options.executionMode||"ACTIVE_DDA";this.activationContext=null;}setExecutionMode(mode){if(!["ACTIVE_DDA","COMPATIBILITY"].includes(mode))throw new TypeError("execution mode is invalid");if(this.isActive()&&mode!==this.executionMode)throw new SessionControlError("EXECUTION_MODE_IMMUTABLE","Execution mode is pinned for the session");this.executionMode=mode;return mode;}setSnapshot(rawSnapshot){const next=rawSnapshot===null?null:validateSnapshot(rawSnapshot);const previousKey=this.snapshot?`${this.snapshot.authorityEpoch}:${this.snapshot.sessionId}:${this.snapshot.phase}:${this.snapshot.activeGame?.canonicalPlatformGameId || ""}`:"";const nextKey=next?`${next.authorityEpoch}:${next.sessionId}:${next.phase}:${next.activeGame?.canonicalPlatformGameId || ""}`:"";this.snapshot=next;if(next){this.executionMode=next.executionMode;this.activationContext=next.activationContext;}if(previousKey!==nextKey)this.effectEpoch.advance();return this.snapshot;}setLease(lease){const previous=this.lease?`${this.lease.ownerTabId}:${this.lease.fencingToken}`:"";const next=lease?`${lease.ownerTabId}:${lease.fencingToken}`:"";this.lease=lease;if(previous!==next)this.effectEpoch.advance();}setStorageHealthy(value){const healthy=value===true;if(healthy!==this.storageHealthy)this.effectEpoch.advance();this.storageHealthy=healthy;}isActive(){return isSessionActive(this.snapshot);}isLeader(){return Boolean(this.snapshot&&this.lease&&this.lease.authorityEpoch===this.snapshot.authorityEpoch&&this.lease.sessionId===this.snapshot.sessionId&&this.lease.ownerTabId===this.ownerTabId);}legacyAutoAdjustSuspended(){return this.isActive()&&this.executionMode==="ACTIVE_DDA";}moveSelectionElo(fallbackElo){const actuator=this.snapshot&&this.snapshot.activeGame&&this.snapshot.activeGame.actuator;return this.isActive()&&actuator?actuator.effectiveTargetElo:fallbackElo;}_telemetryFields(reasonCode){const snapshot=this.snapshot;if(!snapshot)return{occurredAtEpochMs:this.clock.now(),rolloutStage:this.rolloutStage,reasonCode};const actuator=snapshot.activeGame&&snapshot.activeGame.actuator;return{occurredAtEpochMs:this.clock.now(),phase:snapshot.phase,revision:snapshot.revision,role:this.isLeader()?"LEADER":"FOLLOWER",observedCounts:snapshot.observedCounts,controlCounts:snapshot.controlCounts,controllerMode:snapshot.controller.mode,posteriorWinRate:snapshot.controller.posteriorWinRate,offsetElo:actuator?actuator.offsetElo:snapshot.controller.mode==="BOOST"?snapshot.config.boostOffsetElo:snapshot.config.correctionOffsetElo,rawTargetElo:actuator?actuator.rawTargetElo:undefined,effectiveTargetElo:actuator?actuator.effectiveTargetElo:undefined,saturated:actuator?actuator.saturated:false,reasonCode,reducerVersion:REDUCER_VERSION,estimatorVersion:snapshot.config.estimatorVersion,controllerVersion:snapshot.config.controllerVersion,rolloutStage:this.rolloutStage,};}_record(name,reasonCode){if(this.telemetry&&typeof this.telemetry.record==="function")this.telemetry.record(name,this._telemetryFields(reasonCode));}async startSession(input){if(!input||typeof input.accountKey!=="string"||!input.accountKey)throw new TypeError("accountKey is required");if(this.isActive())throw new SessionControlError("ACTIVE_SESSION_EXISTS","A session is already active");const config=validateSessionConfig(input.config);const sessionId=this.idFactory();validateHex128(sessionId,"sessionId");const authorityEpoch=input.authorityEpoch===undefined?((this.snapshot&&this.snapshot.authorityEpoch)||0)+1:input.authorityEpoch;if(!Number.isInteger(authorityEpoch)||authorityEpoch<1)throw new TypeError("authorityEpoch is invalid");const now=this.clock.now();const event={schemaVersion:SCHEMA_VERSION,eventId:"session:start",sessionId,authorityEpoch,expectedRevision:0,sequence:1,occurredAtEpochMs:now,type:"SESSION_STARTED",payload:{accountKey:input.accountKey,config,authorizationDecision:input.authorizationDecision,executionMode:this.executionMode,executionReasonCode:input.executionReasonCode||null,activationContext:input.activationContext||this.activationContext||null},reducerVersion:REDUCER_VERSION,};const acquired=await this.leader.acquire({authorityEpoch,sessionId,ownerTabId:this.ownerTabId});if(!["acquired","renewed"].includes(acquired.status))throw new SessionControlError("LEADER_REQUIRED","Session writer lease is contended");this.setLease(acquired.lease);const next=reduce(null,event).nextState;let result;try{result=await this.repository.commit(event,next);}catch(error){this.setLease(null);throw error;}if(result.status!=="committed"){this.setLease(null);throw new SessionControlError("REVISION_CONFLICT","Session start was not committed");}this.setSnapshot(next);this._record("session_started","START");this._record("leader_acquired",acquired.status==="acquired"?"LEASE_ACQUIRED":"LEASE_RENEWED");return this.snapshot;}async recoverSession(accountKey){const snapshot=await this.repository.loadCurrentSession(accountKey);this.setSnapshot(snapshot);if(!snapshot||TERMINAL_PHASES.includes(snapshot.phase))return snapshot;const acquired=await this.leader.acquire({authorityEpoch:snapshot.authorityEpoch,sessionId:snapshot.sessionId,ownerTabId:this.ownerTabId});if(["acquired","renewed"].includes(acquired.status))this.setLease(acquired.lease);else this.setLease(null);this._record("session_recovered",acquired.status==="contended"?"FOLLOWER_RECOVERY":"LEADER_RECOVERY");return this.snapshot;}async renewLeadership(){if(!this.snapshot||TERMINAL_PHASES.includes(this.snapshot.phase))return decision(false,"SESSION_INACTIVE");const result=await this.leader.renew({authorityEpoch:this.snapshot.authorityEpoch,sessionId:this.snapshot.sessionId,ownerTabId:this.ownerTabId});if(["acquired","renewed"].includes(result.status)){const takeover=!this.isLeader();this.setLease(result.lease);if(takeover)this._record("lease_takeover","LEASE_TAKEOVER");return decision(true,result.status.toUpperCase());}if(this.isLeader())this._record("leader_lost","LEASE_CONTENDED");this.setLease(null);return decision(false,"LEASE_CONTENDED");}async reconcileNow(){if(!this.snapshot||TERMINAL_PHASES.includes(this.snapshot.phase))return this.snapshot;return this._commit("CLOCK_RECONCILED",{},`clock:${this.snapshot.revision + 1}`);}async requestGracefulStop(){if(!this.snapshot||TERMINAL_PHASES.includes(this.snapshot.phase))return decision(false,"SESSION_INACTIVE");await this._commit("REQUEST_GRACEFUL_STOP",{},`stop:graceful:${this.snapshot.revision + 1}`);return decision(true,this.snapshot.phase==="DRAINING"?"DRAINING":"COMPLETED");}async pinCalibration(capability){const snapshot=this.snapshot;const game=snapshot&&snapshot.activeGame;if(!game)return decision(false,"TARGET_NOT_PENDING");if(!capability||capability.runtimeGameToken!==game.runtimeGameToken||capability.mode!=="active")return decision(false,"CALIBRATION_IDENTITY_MISMATCH");const expectedOffset=snapshot.controller.mode==="BOOST"?snapshot.config.boostOffsetElo:snapshot.config.correctionOffsetElo;if(capability.opponentRatingScaleId!==game.opponent.ratingScaleId||capability.platformAdjustedRating!==game.opponent.rating+expectedOffset||capability.scaleId!==snapshot.config.scaleId)return decision(false,"CALIBRATION_IDENTITY_MISMATCH");if(game.targetPinStatus==="PINNED"){const actuator=game.actuator;const sameIdentity=capability.effectiveTargetElo===actuator.effectiveTargetElo&&capability.ratingScaleMappingVersion===actuator.ratingScaleMappingVersion&&capability.ratingScaleMappingChecksum===actuator.ratingScaleMappingChecksum&&capability.artifactVersion===actuator.artifactVersion&&capability.artifactChecksum===actuator.artifactChecksum&&capability.cohort===actuator.cohort&&capability.rolloutVersion===actuator.rolloutVersion;if(!sameIdentity)return decision(false,"CALIBRATION_IDENTITY_MISMATCH");await this._commit("CAPABILITY_REFRESHED",{canonicalPlatformGameId:game.canonicalPlatformGameId,calibrationCapabilityExpiresAtEpochMs:capability.expiresAtEpochMs},`capability:refreshed:${game.canonicalPlatformGameId}:${capability.expiresAtEpochMs}`);return decision(true,"REFRESHED");}const actuator={controllerMode:snapshot.controller.mode,offsetElo:expectedOffset,rawTargetElo:capability.translatedTargetElo,effectiveTargetElo:capability.effectiveTargetElo,ratingScaleMappingVersion:capability.ratingScaleMappingVersion,ratingScaleMappingChecksum:capability.ratingScaleMappingChecksum,saturated:capability.targetSaturated,saturationReason:capability.targetSaturated?"TARGET_CLAMPED":null,scaleId:capability.scaleId,artifactChecksum:capability.artifactChecksum,artifactVersion:capability.artifactVersion,cohort:capability.cohort,rolloutVersion:capability.rolloutVersion,seedPolicyVersion:capability.seedPolicyVersion,requiredBudgetClass:capability.allowedBudgetClasses[0],};await this._commit("TARGET_PINNED",{canonicalPlatformGameId:game.canonicalPlatformGameId,actuator,calibrationCapabilityExpiresAtEpochMs:capability.expiresAtEpochMs},`target:pinned:${game.canonicalPlatformGameId}`);return decision(true,"PINNED");}async observePosition(fen,minimumSeparationMs=250){const game=this.snapshot&&this.snapshot.activeGame;if(!game||!["IN_GAME","DRAINING"].includes(this.snapshot.phase)||game.targetPinStatus!=="PINNED")return null;if(fen===game.lastFen)return this.movePlanContext();const now=this.clock.now();if(!this.pendingPosition||this.pendingPosition.fen!==fen){this.pendingPosition={fen,observedAtEpochMs:now};return null;}if(now-this.pendingPosition.observedAtEpochMs<minimumSeparationMs)return null;if(!this.positionCommit){const revision=game.positionRevision+1;this.positionCommit=this._commit("POSITION_OBSERVED",{canonicalPlatformGameId:game.canonicalPlatformGameId,fen,positionRevision:revision},`position:${game.runtimeGameToken}:${revision}`).finally(()=>{this.positionCommit=null;});}await this.positionCommit;this.pendingPosition=null;return this.movePlanContext();}movePlanContext(){const game=this.snapshot&&this.snapshot.activeGame;if(!game||game.targetPinStatus!=="PINNED"||!game.lastFen||game.positionRevision<1)return null;const actuator=game.actuator;return Object.freeze({runtimeGameToken:game.runtimeGameToken,positionRevision:game.positionRevision,fen:game.lastFen,moveSelectionElo:actuator.effectiveTargetElo,perceptionElo:this.snapshot.config.perceptionElo,calibrationRequirement:{requiredMode:"active",scaleId:actuator.scaleId,artifactVersion:actuator.artifactVersion,artifactChecksum:actuator.artifactChecksum,cohort:actuator.cohort,rolloutVersion:actuator.rolloutVersion,seedPolicyVersion:actuator.seedPolicyVersion,budgetClass:actuator.requiredBudgetClass,ratingScaleMappingVersion:actuator.ratingScaleMappingVersion,ratingScaleMappingChecksum:actuator.ratingScaleMappingChecksum,},});}async acceptMovePlanResponse(response,context){const game=this.snapshot&&this.snapshot.activeGame;if(!game||!context||context.runtimeGameToken!==game.runtimeGameToken||context.positionRevision!==game.positionRevision)return decision(false,"POSITION_IDENTITY_MISMATCH");const origin=response&&(response.originSource||response.source);const calibration=response&&response.calibration;let valid=true;let reason=null;let applied=false;let profile=game.actuation.resolvedProfile;if(["book","forced"].includes(origin)&&calibration&&calibration.calibrationStatus==="not_applied"){valid=game.actuation.valid;}else if(origin==="engine"&&calibration&&calibration.calibrationStatus==="applied"){const actuator=game.actuator;const identityMatches=calibration.targetElo===actuator.effectiveTargetElo&&calibration.scaleId===actuator.scaleId&&calibration.artifactVersion===actuator.artifactVersion&&calibration.artifactChecksum===actuator.artifactChecksum&&calibration.calibrationCohort===actuator.cohort&&calibration.rolloutVersion===actuator.rolloutVersion&&calibration.seedPolicyVersion===actuator.seedPolicyVersion&&calibration.budgetClass===actuator.requiredBudgetClass&&calibration.ratingScaleMappingVersion===actuator.ratingScaleMappingVersion&&calibration.ratingScaleMappingChecksum===actuator.ratingScaleMappingChecksum;profile={resolverVersion:calibration.resolverVersion,resolutionKey:calibration.resolutionKey,latentSkill:calibration.latentSkill,appliedSkill:calibration.appliedSkill,budgetClass:calibration.budgetClass,profileDigest:calibration.profileDigest};const profileMatches=!game.actuation.resolvedProfile||JSON.stringify(game.actuation.resolvedProfile)===JSON.stringify(profile);valid=identityMatches&&profileMatches;applied=valid;if(!valid)reason="CALIBRATION_IDENTITY_MISMATCH";}else{valid=false;reason=origin==="static"?"STATIC_FALLBACK":"CALIBRATION_NOT_APPLIED";}const actuation={valid:game.actuation.valid&&valid,invalidReason:game.actuation.valid&&valid?null:game.actuation.invalidReason||reason,appliedMoveCount:game.actuation.appliedMoveCount+(applied?1:0),nonAppliedMoveCount:game.actuation.nonAppliedMoveCount+(applied?0:1),resolvedProfile:applied?profile:game.actuation.resolvedProfile,};await this._commit("MOVE_PLAN_EVALUATED",{canonicalPlatformGameId:game.canonicalPlatformGameId,positionRevision:game.positionRevision,actuation},`move-plan:${game.runtimeGameToken}:${game.positionRevision}`);return decision(actuation.valid,actuation.valid?"ACCEPTED":actuation.invalidReason);}queueGate(input){if(this.executionMode==="COMPATIBILITY")return decision(false,"LEGACY_COMPATIBILITY_QUEUE");return evaluateQueueGate({...input,snapshot:this.snapshot,isLeader:this.isLeader(),storageHealthy:this.storageHealthy,nowEpochMs:this.clock.now()});}autoMoveGate(input){return evaluateAutoMoveGate({...input,snapshot:this.snapshot,isLeader:this.isLeader(),storageHealthy:this.storageHealthy,nowEpochMs:this.clock.now()});}queueDispatchGate(input){return evaluateQueueDispatchGate({...input,snapshot:this.snapshot,isLeader:this.isLeader(),storageHealthy:this.storageHealthy,nowEpochMs:this.clock.now()});}async observeGame(observation){const snapshot=this.snapshot;if(!snapshot||!snapshot.queueIntent||!["DISPATCHED","AMBIGUOUS"].includes(snapshot.queueIntent.status))return decision(false,"QUEUE_INTENT_NOT_DISPATCHED");try{observation=validatePlatformObservation(observation);}catch(_){return decision(false,"GAME_OBSERVATION_INVALID");}if(observation.accountKey!==snapshot.accountKey)return decision(false,"GAME_IDENTITY_MISMATCH");if(snapshot.activationContext&&(observation.poolId!==snapshot.activationContext.pool||observation.opponentRatingScaleId!==snapshot.activationContext.opponentRatingScaleId))return decision(false,"GAME_CONTEXT_MISMATCH");const activeGame={schemaVersion:1,canonicalPlatformGameId:observation.canonicalPlatformGameId,queueIntentId:snapshot.queueIntent.intentId,admittedAtEpochMs:this.clock.now(),runtimeGameToken:snapshot.queueIntent.runtimeGameToken,targetPinStatus:"PENDING",calibrationCapabilityExpiresAtEpochMs:null,lastFen:"",positionRevision:0,opponent:{rating:observation.opponentRating,ratingScaleId:observation.opponentRatingScaleId,source:observation.sourceVersion,confidence:1,observedAtEpochMs:observation.observedAtEpochMs},actuator:null,actuation:{valid:true,invalidReason:null,appliedMoveCount:0,nonAppliedMoveCount:0,resolvedProfile:null},};await this._commit("GAME_OBSERVED",{activeGame},`game:observed:${observation.canonicalPlatformGameId}`);return decision(true,"GAME_ADMITTED");}async observeCompatibilityGame(observation){const snapshot=this.snapshot;if(this.executionMode!=="COMPATIBILITY"||!snapshot||!["QUEUEING","DRAINING"].includes(snapshot.phase))return decision(false,"COMPATIBILITY_SESSION_INACTIVE");try{observation=validatePlatformObservation(observation);}catch(_){return decision(false,"GAME_OBSERVATION_INVALID");}if(observation.accountKey!==snapshot.accountKey)return decision(false,"GAME_IDENTITY_MISMATCH");if(snapshot.activationContext&&(observation.poolId!==snapshot.activationContext.pool||observation.opponentRatingScaleId!==snapshot.activationContext.opponentRatingScaleId))return decision(false,"GAME_CONTEXT_MISMATCH");const activeGame={schemaVersion:1,canonicalPlatformGameId:observation.canonicalPlatformGameId,queueIntentId:this.idFactory(),admittedAtEpochMs:this.clock.now(),runtimeGameToken:this.idFactory(),targetPinStatus:"PENDING",calibrationCapabilityExpiresAtEpochMs:null,lastFen:"",positionRevision:0,opponent:{rating:observation.opponentRating,ratingScaleId:observation.opponentRatingScaleId,source:observation.sourceVersion,confidence:1,observedAtEpochMs:observation.observedAtEpochMs},actuator:null,actuation:{valid:false,invalidReason:"COMPATIBILITY_OBSERVATION_ONLY",appliedMoveCount:0,nonAppliedMoveCount:0,resolvedProfile:null},};await this._commit("COMPATIBILITY_GAME_OBSERVED",{activeGame},`compat-game:observed:${observation.canonicalPlatformGameId}`);return decision(true,"GAME_ADMITTED");}async observeResult(observation){const game=this.snapshot&&this.snapshot.activeGame;if(!game||!observation||observation.canonicalPlatformGameId!==game.canonicalPlatformGameId||observation.accountKey!==this.snapshot.accountKey)return decision(false,"GAME_IDENTITY_MISMATCH");const outcome={W:"WIN",D:"DRAW",L:"LOSS"}[observation.outcome];if(!outcome)return decision(false,"OUTCOME_UNKNOWN");await this._commit("GAME_RESULT_OBSERVED",{canonicalPlatformGameId:game.canonicalPlatformGameId,outcome},`result:${game.canonicalPlatformGameId}`,game.canonicalPlatformGameId);return decision(true,"RESULT_COMMITTED");}async observeCompatibilityResult(observation){const game=this.snapshot&&this.snapshot.activeGame;if(this.executionMode!=="COMPATIBILITY"||!this.snapshot||!game||!["IN_GAME","DRAINING","PAUSED_ACTIVE"].includes(this.snapshot.phase))return decision(false,"COMPATIBILITY_SESSION_INACTIVE");if(!observation||observation.accountKey!==this.snapshot.accountKey||observation.canonicalPlatformGameId!==game.canonicalPlatformGameId)return decision(false,"GAME_IDENTITY_MISMATCH");const outcome={W:"WIN",D:"DRAW",L:"LOSS"}[observation.outcome];if(!outcome)return decision(false,"OUTCOME_UNKNOWN");await this._commit("COMPATIBILITY_RESULT_OBSERVED",{canonicalPlatformGameId:observation.canonicalPlatformGameId,outcome},`compat-result:${observation.canonicalPlatformGameId}`,observation.canonicalPlatformGameId);return decision(true,"RESULT_COMMITTED");}async observeUnknownOutcome(observation){const game=this.snapshot&&this.snapshot.activeGame;if(!game||!observation||observation.accountKey!==this.snapshot.accountKey||observation.canonicalPlatformGameId!==game.canonicalPlatformGameId)return decision(false,"GAME_IDENTITY_MISMATCH");await this._commit("OUTCOME_UNKNOWN",{canonicalPlatformGameId:game.canonicalPlatformGameId},`outcome:unknown:${game.canonicalPlatformGameId}`,game.canonicalPlatformGameId);return decision(false,"OUTCOME_UNKNOWN");}captureEffectEpoch(){return this.effectEpoch.capture();}isEffectEpochCurrent(value){return this.effectEpoch.isCurrent(value);}_leaseBinding(expectedRevision){if(!this.snapshot||!this.lease)throw new SessionControlError("STALE_FENCE","Session leadership is unavailable");return{leaseName:this.leader.leaseName,authorityEpoch:this.snapshot.authorityEpoch,sessionId:this.snapshot.sessionId,ownerTabId:this.ownerTabId,fencingToken:this.lease.fencingToken,expectedRevision,nowEpochMs:this.clock.now(),};}_event(type,payload,eventId,canonicalPlatformGameId){const snapshot=this.snapshot;const event={schemaVersion:SCHEMA_VERSION,eventId,sessionId:snapshot.sessionId,authorityEpoch:snapshot.authorityEpoch,expectedRevision:snapshot.revision,sequence:snapshot.revision+1,occurredAtEpochMs:this.clock.now(),type,payload,reducerVersion:REDUCER_VERSION,};if(canonicalPlatformGameId!==undefined)event.canonicalPlatformGameId=canonicalPlatformGameId;return event;}async _commit(type,payload,eventId,canonicalPlatformGameId){const previousPhase=this.snapshot.phase;const previousMode=this.snapshot.controller.mode;const event=this._event(type,payload,eventId,canonicalPlatformGameId);const next=reduce(this.snapshot,event).nextState;const result=await this.repository.commit(event,next,this._leaseBinding(event.expectedRevision));if(result.status==="duplicate"){const restored=await this.repository.loadSession(event.sessionId);if(!restored)throw new SessionControlError("REVISION_CONFLICT","Duplicate event has no authoritative snapshot");this.setSnapshot(restored);if(type==="GAME_RESULT_OBSERVED")this._record("duplicate_result_ignored","DUPLICATE_RESULT");return restored;}if(result.status!=="committed")throw new SessionControlError("REVISION_CONFLICT","Unexpected controller event status");this.setSnapshot(next);const eventName={QUEUE_INTENT_PREPARED:"queue_intent_admitted",QUEUE_INTENT_DISPATCHED:"queue_intent_consumed",TARGET_PINNED:"game_target_pinned",GAME_RESULT_OBSERVED:"result_committed",PAUSE:"session_paused",}[type];if(eventName)this._record(eventName,type);if(next.phase==="DRAINING"&&previousPhase!=="DRAINING")this._record("session_draining",type);if(TERMINAL_PHASES.includes(next.phase)&&!TERMINAL_PHASES.includes(previousPhase))this._record("session_completed",next.completionReason||type);if(next.controller.mode!==previousMode)this._record("dda_mode_changed",type);if(type==="TARGET_PINNED"&&next.activeGame&&next.activeGame.actuator.saturated)this._record("target_saturated","TARGET_CLAMPED");return next;}async executeQueueEffect(input,clickEffect){if(typeof clickEffect!=="function")throw new TypeError("clickEffect must be a function");const gate=this.queueGate(input);if(!gate.allowed)return gate;const intentId=this.idFactory();const runtimeGameToken=this.idFactory();validateHex128(intentId,"intentId");validateHex128(runtimeGameToken,"runtimeGameToken");const preparedAtEpochMs=this.clock.now();const queueIntent={schemaVersion:1,intentId,runtimeGameToken,status:"PREPARED",preparedAtEpochMs,claimedByFence:null,dispatchedAtEpochMs:null,observeUntilEpochMs:null};await this._commit("QUEUE_INTENT_PREPARED",{queueIntent},`queue:prepared:${intentId}`);await this._commit("QUEUE_INTENT_CLAIMED",{fencingToken:this.lease.fencingToken},`queue:claimed:${intentId}`);const epoch=this.captureEffectEpoch();const binding=this._leaseBinding(this.snapshot.revision);try{await this.leader.executeCommittedEffect(binding,async()=>{if(!this.isEffectEpochCurrent(epoch))throw new SessionControlError("STALE_EFFECT_EPOCH","Queue callback belongs to an obsolete epoch");const finalGate=this.queueDispatchGate(input);if(!finalGate.allowed)throw new SessionControlError(finalGate.reason,"Queue gate closed before dispatch");const dispatched=await this._commit("QUEUE_INTENT_DISPATCHED",{},`queue:dispatched:${intentId}`);return{binding:this._leaseBinding(dispatched.revision),value:dispatched};},clickEffect);}catch(error){if(this.snapshot&&this.snapshot.queueIntent){try{if(this.snapshot.queueIntent.status==="CLAIMED")await this._commit("QUEUE_INTENT_CANCELLED",{reason:error.code||"QUEUE_DISPATCH_CANCELLED"},`queue:cancelled:${intentId}`);else if(this.snapshot.queueIntent.status==="DISPATCHED")await this._commit("QUEUE_INTENT_FAILED",{reason:error.code||"QUEUE_EFFECT_AMBIGUOUS"},`queue:failed:${intentId}`);}catch(_){}}throw error;}return decision(true,"DISPATCHED");}async executeAutoMoveEffect(input,capturedEpoch,moveEffect){if(typeof moveEffect!=="function")throw new TypeError("moveEffect must be a function");const gate=this.autoMoveGate(input);if(!gate.allowed)return gate;if(!this.isEffectEpochCurrent(capturedEpoch))return decision(false,"STALE_EFFECT_EPOCH");await this.leader.executeEffect(this._leaseBinding(this.snapshot.revision),()=>{if(!this.isEffectEpochCurrent(capturedEpoch))throw new SessionControlError("STALE_EFFECT_EPOCH","Move callback belongs to an obsolete epoch");const finalGate=this.autoMoveGate(input);if(!finalGate.allowed)throw new SessionControlError(finalGate.reason,"Auto Move gate closed before dispatch");return moveEffect();});return decision(true,"DISPATCHED");}async pauseForDisabledAutoMove(){if(!this.snapshot||!this.snapshot.activeGame||TERMINAL_PHASES.includes(this.snapshot.phase))return decision(false,"NO_ACTIVE_GAME");await this._commit("PAUSE",{reason:"USER_AUTOMOVE_DISABLED"},`pause:user-automove:${this.snapshot.revision + 1}`);return decision(true,"PAUSED");}}module.exports={ACTIVE_PHASES,EffectEpoch,SessionControlController,evaluateAutoMoveGate,evaluateQueueDispatchGate,evaluateQueueGate,isSessionActive};
};
factories["ports"]=function(module,exports,require){
const{exactKeys,validateHex128,validateSessionConfig}=require("./models");const{DB_NAME,SessionControlError}=require("./repository");const CONFIG_KEY="thinker.sessionControl.config.v1";const RECOVERY_KEY="thinker.sessionControl.recovery.v1";const POLICY_KEY="thinker.sessionControl.authorization.v1";const FORBIDDEN_PATTERN=/[*?\[\]{}()+\\^$|/]/;function normalizeToken(value,field){if(typeof value!=="string")throw new TypeError(`${field} must be a string`);const normalized=value.normalize("NFKC").trim();if(!normalized||FORBIDDEN_PATTERN.test(normalized))throw new TypeError(`${field} must be a non-pattern exact token`);return normalized;}function validateTokenList(value,field){if(!Array.isArray(value))throw new TypeError(`${field} must be an array`);const normalized=value.map((item,index)=>normalizeToken(item,`${field}[${index}]`));if(new Set(normalized).size!==normalized.length)throw new TypeError(`${field} contains duplicates`);return Object.freeze(normalized);}function validateAuthorizationPolicy(input){exactKeys(input,["schemaVersion","accounts","contexts","pools"],[],"authorizationPolicy");if(input.schemaVersion!==1)throw new TypeError("authorizationPolicy.schemaVersion is unsupported");return Object.freeze({schemaVersion:1,accounts:validateTokenList(input.accounts,"authorizationPolicy.accounts"),contexts:validateTokenList(input.contexts,"authorizationPolicy.contexts"),pools:validateTokenList(input.pools,"authorizationPolicy.pools"),});}function evaluateAuthorization(policyInput,observation){const policy=validateAuthorizationPolicy(policyInput);exactKeys(observation,["account","context","pool"],[],"authorizationObservation");const account=normalizeToken(observation.account,"authorizationObservation.account");const context=normalizeToken(observation.context,"authorizationObservation.context");const pool=normalizeToken(observation.pool,"authorizationObservation.pool");const allowed=policy.accounts.length>0&&policy.contexts.length>0&&policy.pools.length>0&&policy.accounts.includes(account)&&policy.contexts.includes(context)&&policy.pools.includes(pool);return Object.freeze({schemaVersion:1,allowed,reason:allowed?"EXACT_MATCH":"NOT_AUTHORIZED"});}function policyIsFullyEmpty(policy){return policy.accounts.length===0&&policy.contexts.length===0&&policy.pools.length===0;}function authorizationError(code,message,cause){return new SessionControlError(code,message,cause);}async function resolveAuthorizationPolicy(storagePort,observationInput){const missingPolicy=`__THINKER_SESSION_CONTROL_POLICY_MISSING_V1__:${Date.now()}:${Math.random()}`;let observation;try{exactKeys(observationInput,["account","context","pool"],[],"authorizationObservation");observation=Object.freeze({account:normalizeToken(observationInput.account,"authorizationObservation.account"),context:normalizeToken(observationInput.context,"authorizationObservation.context"),pool:normalizeToken(observationInput.pool,"authorizationObservation.pool"),});}catch(error){throw authorizationError("ACCOUNT_CONTEXT_UNAVAILABLE","Authorization observation is unavailable",error);}let rawPolicy;try{rawPolicy=await storagePort.readPolicyValue(missingPolicy);}catch(error){throw authorizationError("AUTHORIZATION_STORAGE_UNAVAILABLE","Authorization policy could not be read",error);}const missing=rawPolicy===missingPolicy||rawPolicy===null;let policy;if(!missing){try{policy=validateAuthorizationPolicy(rawPolicy);}catch(error){throw authorizationError("AUTHORIZATION_POLICY_INVALID","Authorization policy is invalid",error);}}const shouldBootstrap=missing||policyIsFullyEmpty(policy);if(shouldBootstrap){const exactPolicy={schemaVersion:1,accounts:[observation.account],contexts:[observation.context],pools:[observation.pool]};try{await storagePort.writePolicy(exactPolicy);rawPolicy=await storagePort.readPolicyValue(missingPolicy);}catch(error){throw authorizationError("AUTHORIZATION_STORAGE_UNAVAILABLE","Authorization policy could not be persisted",error);}if(rawPolicy===missingPolicy||rawPolicy===null)throw authorizationError("AUTHORIZATION_STORAGE_UNAVAILABLE","Authorization policy read-back is unavailable");try{policy=validateAuthorizationPolicy(rawPolicy);}catch(error){throw authorizationError("AUTHORIZATION_BOOTSTRAP_CONFLICT","Authorization policy changed during bootstrap",error);}const readBack=evaluateAuthorization(policy,observation);if(!readBack.allowed)throw authorizationError("AUTHORIZATION_BOOTSTRAP_CONFLICT","Authorization policy changed during bootstrap");return Object.freeze({schemaVersion:1,allowed:true,reason:"BOOTSTRAPPED_EXACT_CONTEXT"});}const decision=evaluateAuthorization(policy,observation);if(!decision.allowed)throw authorizationError("NOT_AUTHORIZED","Authorization policy does not match the current context");return decision;}function validateRecoveryPointer(input){exactKeys(input,["schemaVersion","sessionId","revision","deadlineEpochMs","dbName"],[],"recovery");if(input.schemaVersion!==1)throw new TypeError("recovery.schemaVersion is unsupported");validateHex128(input.sessionId,"recovery.sessionId");if(!Number.isInteger(input.revision)||input.revision<1)throw new TypeError("recovery.revision is invalid");if(!Number.isInteger(input.deadlineEpochMs)||input.deadlineEpochMs<0)throw new TypeError("recovery.deadlineEpochMs is invalid");if(input.dbName!==DB_NAME)throw new TypeError("recovery.dbName is invalid");return Object.freeze({...input});}class GmStoragePort{constructor(getValue,setValue){if(typeof getValue!=="function"||typeof setValue!=="function")throw new SessionControlError("UNSUPPORTED_BROWSER_CAPABILITY","GM storage functions are required");this.getValue=getValue;this.setValue=setValue;}async readConfig(defaultValue){const value=await Promise.resolve(this.getValue(CONFIG_KEY,defaultValue));return validateSessionConfig(value);}async writeConfig(value){const config=validateSessionConfig(value);await Promise.resolve(this.setValue(CONFIG_KEY,config));return config;}async readPolicy(defaultValue){const value=await this.readPolicyValue(defaultValue);return validateAuthorizationPolicy(value);}async readPolicyValue(defaultValue){return Promise.resolve(this.getValue(POLICY_KEY,defaultValue));}async writePolicy(value){const policy=validateAuthorizationPolicy(value);await Promise.resolve(this.setValue(POLICY_KEY,policy));return policy;}async readRecovery(){const value=await Promise.resolve(this.getValue(RECOVERY_KEY,null));return value===null?null:validateRecoveryPointer(value);}async writeRecovery(value){const pointer=validateRecoveryPointer(value);await Promise.resolve(this.setValue(RECOVERY_KEY,pointer));return pointer;}}function preflightCapabilities(environment){const missing=[];if(!environment||!environment.isSecureContext)missing.push("secureContext");if(!environment||!environment.indexedDB||typeof environment.indexedDB.open!=="function")missing.push("indexedDB");if(!environment||!environment.navigator||!environment.navigator.locks||typeof environment.navigator.locks.request!=="function")missing.push("webLocks");if(!environment||typeof environment.BroadcastChannel!=="function")missing.push("broadcastChannel");if(!environment||!environment.crypto||!environment.crypto.subtle||typeof environment.crypto.subtle.digest!=="function")missing.push("webCryptoSha256");if(!environment||!environment.crypto||typeof environment.crypto.getRandomValues!=="function")missing.push("webCryptoRandom");if(!environment||typeof environment.GM_getValue!=="function"||typeof environment.GM_setValue!=="function")missing.push("gmStorage");if(missing.length)throw new SessionControlError("UNSUPPORTED_BROWSER_CAPABILITY",`Missing capabilities: ${missing.join(",")}`);return Object.freeze({ok:true});}function assertCanonicalOrigin(locationObject,topObject,selfObject){if(!locationObject||locationObject.origin!=="https://www.chess.com"||topObject!==selfObject){throw new SessionControlError("UNSUPPORTED_BROWSER_CAPABILITY","Module 14 requires the canonical top-level origin");}return true;}module.exports={CONFIG_KEY,POLICY_KEY,RECOVERY_KEY,GmStoragePort,assertCanonicalOrigin,evaluateAuthorization,normalizeToken,resolveAuthorizationPolicy,preflightCapabilities,validateAuthorizationPolicy,validateRecoveryPointer,};
};
factories["platform-chesscom"]=function(module,exports,require){
const{canonicalStringify,exactKeys,validateSnapshot}=require("./models");const ASCII_USERNAME=/^[A-Za-z0-9_-]{1,50}$/;const LIVE_TIME_CLASSES=Object.freeze(["bullet","blitz","rapid"]);const ACTIVE_QUEUE_SELECTORS=Object.freeze(['[aria-selected="true"]','[aria-checked="true"]','[data-active="true"]','[data-state="active"]','[data-state="selected"]','[role="tab"].active','[role="radio"].active',]);const SUMMARY_CONTROL_SELECTORS=Object.freeze(["button",'[role="button"]','[aria-haspopup="listbox"]','[aria-haspopup="menu"]',]);function isEligibleTopLevelContext(locationObject,windowObject){if(!locationObject||!windowObject)return false;try{return locationObject.protocol==="https:"&&locationObject.hostname==="www.chess.com"&&locationObject.origin==="https://www.chess.com"&&windowObject.self===windowObject.top;}catch(_){return false;}}function normalizeUsername(value){if(typeof value!=="string")throw new TypeError("username must be a string");const normalized=value.normalize("NFKC").toLowerCase();if(!ASCII_USERNAME.test(normalized))throw new TypeError("username is not a canonical ASCII identity");return normalized;}function bytesToHex(bytes){return Array.from(bytes,(value)=>value.toString(16).padStart(2,"0")).join("");}async function accountKeyForUsername(username,cryptoObject){if(!cryptoObject||!cryptoObject.subtle)throw new TypeError("Web Crypto is required");const digest=await cryptoObject.subtle.digest("SHA-256",new TextEncoder().encode(`chess.com:${normalizeUsername(username)}`));return bytesToHex(new Uint8Array(digest));}function canonicalGameIdFromUrl(value){const url=new URL(value,"https://www.chess.com");if(url.origin!=="https://www.chess.com")return null;const match=url.pathname.match(/^\/game\/(?:live|daily)\/([A-Za-z0-9_-]+)\/?$/);return match?match[1]:null;}function timeClassesInText(value){const text=String(value||"").normalize("NFKC").toLowerCase();return LIVE_TIME_CLASSES.filter((timeClass)=>new RegExp(`(^|[^a-z])${timeClass}([^a-z]|$)`).test(text));}function elementTimeClasses(element){if(!element||typeof element!=="object")return[];const values=[];for(const name of["data-time-class","data-time-control","data-category","data-tab","aria-label","title"]){if(typeof element.getAttribute==="function")values.push(element.getAttribute(name));}if(typeof element.className==="string")values.push(element.className);if(typeof element.textContent==="string")values.push(element.textContent);return Array.from(new Set(values.flatMap(timeClassesInText)));}function activeTimeClassCandidates(root){if(!root||typeof root.querySelectorAll!=="function")return[];const nodes=[];for(const selector of ACTIVE_QUEUE_SELECTORS){try{nodes.push(...root.querySelectorAll(selector));}catch(_){}}return Array.from(new Set(nodes.flatMap(elementTimeClasses)));}function normalizedControlText(element){if(!element||typeof element!=="object")return "";const values=[element.textContent,element.value];if(typeof element.getAttribute==="function"){for(const name of["aria-label","title","value"])values.push(element.getAttribute(name));}const value=values.find((candidate)=>typeof candidate==="string"&&candidate.trim());return typeof value==="string"?value.normalize("NFKC").replace(/\s+/g," ").trim().toLowerCase():"";}function parseSummaryTimeClass(text){const minuteMatch=text.match(/^(\d{1,3})\s*(?:min(?:ute)?s?)\s*\(\s*(bullet|blitz|rapid)\s*\)$/);if(minuteMatch&&Number(minuteMatch[1])>=1&&Number(minuteMatch[1])<=180)return minuteMatch[2];const incrementMatch=text.match(/^(\d{1,3})\s*[|+]\s*(\d{1,2})\s*\(\s*(bullet|blitz|rapid)\s*\)$/);if(incrementMatch&&Number(incrementMatch[1])>=1&&Number(incrementMatch[1])<=180&&Number(incrementMatch[2])<=60)return incrementMatch[3];const clockMatch=text.match(/^(\d{1,2}):(\d{2})\s*\(\s*(bullet|blitz|rapid)\s*\)$/);if(clockMatch&&Number(clockMatch[2])<=59&&Number(clockMatch[1])+Number(clockMatch[2])>0)return clockMatch[3];return null;}function hasClockLikeText(text){return /\d{1,3}\s*(?:min(?:ute)?s?|[|+]\s*\d{1,2})|\d{1,2}:\d{2}/.test(text);}function isHiddenControl(element){if(!element||typeof element!=="object")return true;for(let node=element;node&&typeof node==="object";node=node.parentElement){if(node.hidden===true||node.disabled===true)return true;if(typeof node.getAttribute==="function"){if(node.getAttribute("hidden")!==null||node.getAttribute("disabled")!==null||node.getAttribute("inert")!==null)return true;if(["aria-hidden","aria-disabled"].some((name)=>String(node.getAttribute(name)||"").toLowerCase()==="true"))return true;if(String(node.getAttribute("type")||"").toLowerCase()==="hidden")return true;if(/(?:^|;)\s*(?:display\s*:\s*none|visibility\s*:\s*(?:hidden|collapse)|content-visibility\s*:\s*hidden|opacity\s*:\s*0)(?:\s*!important)?\s*(?:;|$)/i.test(String(node.getAttribute("style")||"")))return true;}const view=node.ownerDocument&&node.ownerDocument.defaultView;if(view&&typeof view.getComputedStyle==="function"){const style=view.getComputedStyle(node);if(style&&(style.display==="none"||["hidden","collapse"].includes(style.visibility)||style.contentVisibility==="hidden"||Number(style.opacity)===0))return true;}}return element.isConnected===true&&typeof element.getClientRects==="function"&&element.getClientRects().length===0;}function summaryTimeClassEvidence(root,targetButton){if(!root||typeof root.querySelectorAll!=="function")return{valid:true,candidates:[]};const nodes=[];for(const selector of SUMMARY_CONTROL_SELECTORS){try{nodes.push(...root.querySelectorAll(selector));}catch(_){}}const candidates=[];for(const node of new Set(nodes)){const overlapsTarget=node===targetButton||(typeof targetButton.contains==="function"&&targetButton.contains(node))||(typeof node.contains==="function"&&node.contains(targetButton));if(overlapsTarget||isHiddenControl(node))continue;const text=normalizedControlText(node);if(!text||text.length>80||!hasClockLikeText(text))continue;const timeClass=parseSummaryTimeClass(text);if(!timeClass)return{valid:false,candidates:[]};candidates.push(timeClass);}return{valid:candidates.length<=1,candidates};}function observeQueueContext(target){if(!target||!["modal","sidebar-start-game","sidebar-new-game","sidebar-plus"].includes(target.source)||!target.button)return null;const localRoot=target.root||target.button.parentElement;const summaryEvidence=summaryTimeClassEvidence(localRoot,target.button);if(!summaryEvidence.valid)return null;const candidates=Array.from(new Set([...activeTimeClassCandidates(localRoot),...summaryEvidence.candidates]));if(candidates.length!==1)return null;const timeClass=candidates[0];const scopeId=`chesscom-live-${timeClass}-v1`;return Object.freeze({schemaVersion:1,timeClass,contextClass:`chesscom-queue-${target.source}-v1`,poolId:scopeId,opponentRatingScaleId:scopeId,sourceVersion:"chesscom-queue-context-v1",});}function validatePlatformObservation(input){exactKeys(input,["schemaVersion","canonicalPlatformGameId","accountKey","opponentKey","opponentRating","opponentRatingScaleId","userSide","contextClass","poolId","rated","observedAtEpochMs","sourceVersion"],[],"platformObservation");if(input.schemaVersion!==1)throw new TypeError("platformObservation.schemaVersion is unsupported");for(const field of["canonicalPlatformGameId","accountKey","opponentKey","opponentRatingScaleId","contextClass","poolId","sourceVersion"])if(typeof input[field]!=="string"||!input[field])throw new TypeError(`platformObservation.${field} is required`);if(!Number.isInteger(input.opponentRating)||input.opponentRating<1)throw new TypeError("platformObservation.opponentRating is invalid");if(!["white","black"].includes(input.userSide))throw new TypeError("platformObservation.userSide is invalid");if(typeof input.rated!=="boolean")throw new TypeError("platformObservation.rated must be boolean");if(!Number.isInteger(input.observedAtEpochMs)||input.observedAtEpochMs<0)throw new TypeError("platformObservation.observedAtEpochMs is invalid");return Object.freeze({...input});}function validateTerminalObservation(input){exactKeys(input,["schemaVersion","canonicalPlatformGameId","accountKey","userSide","outcome","termination","source","observedAtEpochMs","proofDigest"],[],"terminalObservation");if(input.schemaVersion!==1||!["W","D","L"].includes(input.outcome))throw new TypeError("terminalObservation is invalid");for(const field of["canonicalPlatformGameId","accountKey","termination","source","proofDigest"])if(typeof input[field]!=="string"||!input[field])throw new TypeError(`terminalObservation.${field} is required`);if(!["white","black"].includes(input.userSide))throw new TypeError("terminalObservation.userSide is invalid");if(!Number.isInteger(input.observedAtEpochMs)||input.observedAtEpochMs<0)throw new TypeError("terminalObservation.observedAtEpochMs is invalid");return Object.freeze({...input});}class StableEvidenceTracker{constructor(validator,minimumSeparationMs=250){this.validator=validator;this.minimumSeparationMs=minimumSeparationMs;this.previous=null;this.identity=null;}observe(raw){const observation=this.validator(raw);const identity={...observation};delete identity.observedAtEpochMs;const canonical=canonicalStringify(identity);const stable=this.previous!==null&&this.identity===canonical&&observation.observedAtEpochMs-this.previous.observedAtEpochMs>=this.minimumSeparationMs;this.previous=observation;this.identity=canonical;return Object.freeze({stable,observation});}reset(){this.previous=null;this.identity=null;}}function recoverObservedContext(rawSnapshot,calibrationReadiness,rawStableObservation){const snapshot=validateSnapshot(rawSnapshot);const recovered={};if(snapshot.activationContext){recovered.queue=Object.freeze({calibrationReadiness,intendedQueueScaleId:snapshot.activationContext.opponentRatingScaleId,});}if(!rawStableObservation||!snapshot.activeGame)return Object.freeze(recovered);let observation;try{observation=validatePlatformObservation(rawStableObservation);}catch(_){return Object.freeze(recovered);}const game=snapshot.activeGame;const activation=snapshot.activationContext;const matches=observation.canonicalPlatformGameId===game.canonicalPlatformGameId&&observation.accountKey===snapshot.accountKey&&observation.opponentRating===game.opponent.rating&&observation.opponentRatingScaleId===game.opponent.ratingScaleId&&(!activation||(observation.poolId===activation.pool&&observation.opponentRatingScaleId===activation.opponentRatingScaleId));if(!matches)return Object.freeze(recovered);recovered.lifecycleIdentity=observation;if(snapshot.executionMode==="ACTIVE_DDA"&&game.targetPinStatus==="PINNED"){recovered.move=Object.freeze({gameMode:"play",observedGame:Object.freeze({gameIdentityStable:true,terminalState:"ONGOING",canonicalPlatformGameId:game.canonicalPlatformGameId,accountKey:snapshot.accountKey,runtimeGameToken:game.runtimeGameToken,}),});}return Object.freeze(recovered);}module.exports={LIVE_TIME_CLASSES,StableEvidenceTracker,accountKeyForUsername,canonicalGameIdFromUrl,isEligibleTopLevelContext,normalizeUsername,observeQueueContext,recoverObservedContext,validatePlatformObservation,validateTerminalObservation};
};
factories["leader"]=function(module,exports,require){
const{SessionControlError}=require("./repository");const DEFAULT_LEASE_NAME="thinker-session-control-writer-v1";const LEASE_DURATION_MS=15000;const RENEWAL_INTERVAL_MS=5000;class LeaderCoordinator{constructor(options){if(!options||!options.repository||!options.locks||typeof options.locks.request!=="function"||!options.clock)throw new TypeError("repository, Web Locks, and clock are required");this.repository=options.repository;this.locks=options.locks;this.clock=options.clock;this.leaseName=options.leaseName||DEFAULT_LEASE_NAME;this.leaseDurationMs=options.leaseDurationMs||LEASE_DURATION_MS;}async acquire(identity){return this.locks.request(this.leaseName,{mode:"exclusive"},()=>this.repository.updateLease({leaseName:this.leaseName,authorityEpoch:identity.authorityEpoch,sessionId:identity.sessionId,ownerTabId:identity.ownerTabId,nowEpochMs:this.clock.now(),leaseDurationMs:this.leaseDurationMs,}));}async renew(identity){return this.acquire(identity);}async executeEffect(binding,effect){if(typeof effect!=="function")throw new TypeError("effect must be a function");return this.locks.request(this.leaseName,{mode:"exclusive"},async()=>{await this.repository.assertFence({...binding,leaseName:this.leaseName,nowEpochMs:this.clock.now()});const result=effect();if(result&&typeof result.then==="function")throw new SessionControlError("ASYNC_EFFECT_FORBIDDEN","Irreversible effects must dispatch synchronously while the lock is held");return result;});}async executeCommittedEffect(binding,prepare,effect){if(typeof prepare!=="function"||typeof effect!=="function")throw new TypeError("prepare and effect must be functions");return this.locks.request(this.leaseName,{mode:"exclusive"},async()=>{await this.repository.assertFence({...binding,leaseName:this.leaseName,nowEpochMs:this.clock.now()});const prepared=await prepare();if(!prepared||!prepared.binding)throw new TypeError("prepare must return an updated binding");await this.repository.assertFence({...prepared.binding,leaseName:this.leaseName,nowEpochMs:this.clock.now()});const result=effect();if(result&&typeof result.then==="function")throw new SessionControlError("ASYNC_EFFECT_FORBIDDEN","Irreversible effects must dispatch synchronously while the lock is held");return Object.freeze({prepared:prepared.value,result});});}}module.exports={DEFAULT_LEASE_NAME,LEASE_DURATION_MS,LeaderCoordinator,RENEWAL_INTERVAL_MS};
};
factories["runtime"]=function(module,exports,require){
const{SessionControlController}=require("./controller");const{LeaderCoordinator,RENEWAL_INTERVAL_MS}=require("./leader");const{exactKeys,validateSessionConfig}=require("./models");const{GmStoragePort,assertCanonicalOrigin,preflightCapabilities,resolveAuthorizationPolicy}=require("./ports");const{IndexedDbRepository,SessionControlError}=require("./repository");const{validateRollout}=require("./status");const{BoundedTelemetry}=require("./telemetry");const ROLLOUT_KEY="thinker.sessionControl.rollout.v1";const AUTHORIZATION_LOCK_NAME="thinker-session-control-authorization-v1";const BOOTSTRAP_STATES=Object.freeze(["PENDING","READY","FAILED"]);function reasonCode(error,fallback){if(error&&typeof error.code==="string"&&error.code)return error.code;if(error&&typeof error.reason==="string"&&error.reason)return error.reason;if(error&&typeof error.message==="string"&&/^[A-Z][A-Z0-9_]+$/.test(error.message))return error.message;return fallback;}function typedError(code,cause){return new SessionControlError(code,code,cause);}function randomHex128(cryptoObject){const bytes=new Uint8Array(16);cryptoObject.getRandomValues(bytes);return Array.from(bytes,(value)=>value.toString(16).padStart(2,"0")).join("");}function validateStartReadiness(observation,config,nowEpochMs){if(!observation||typeof observation!=="object")throw typedError("ACCOUNT_CONTEXT_UNAVAILABLE");const readiness=observation.calibrationReadiness;if(!readiness||readiness.active!==true){const reported=readiness&&typeof readiness.reason==="string"&&/^[A-Z][A-Z0-9_]+$/.test(readiness.reason)?readiness.reason:"CALIBRATION_NOT_ACTIVE";throw typedError(reported);}try{exactKeys(readiness,["schemaVersion","active","opponentRatingScaleId","targetScaleId","ratingScaleMappingVersion","ratingScaleMappingChecksum","artifactVersion","artifactChecksum","sourceMinimum","sourceMaximum","generatedAtEpochMs","expiresAtEpochMs"],["executionMode","reasonCode","supportedOpponentRatingScaleIds"],"calibrationReadiness");}catch(error){throw typedError("CALIBRATION_UNAVAILABLE",error);}if(readiness.schemaVersion!==1||typeof readiness.opponentRatingScaleId!=="string"||typeof readiness.targetScaleId!=="string")throw typedError("CALIBRATION_UNAVAILABLE");for(const field of["ratingScaleMappingVersion","ratingScaleMappingChecksum","artifactVersion","artifactChecksum"])if(typeof readiness[field]!=="string"||!readiness[field])throw typedError("CALIBRATION_UNAVAILABLE");if(!Number.isFinite(readiness.sourceMinimum)||!Number.isFinite(readiness.sourceMaximum)||readiness.sourceMinimum>=readiness.sourceMaximum)throw typedError("CALIBRATION_UNAVAILABLE");if(!Number.isInteger(readiness.generatedAtEpochMs)||readiness.generatedAtEpochMs>nowEpochMs)throw typedError("CALIBRATION_UNAVAILABLE");if(typeof observation.intendedQueueScaleId!=="string"||!observation.intendedQueueScaleId)throw typedError("CONTEXT_UNIDENTIFIABLE");if(readiness.opponentRatingScaleId!==observation.intendedQueueScaleId||readiness.targetScaleId!==config.scaleId)throw typedError("CALIBRATION_SCALE_MISMATCH");if(!Number.isInteger(readiness.expiresAtEpochMs))throw typedError("CALIBRATION_UNAVAILABLE");if(readiness.expiresAtEpochMs<=nowEpochMs)throw typedError("CALIBRATION_EXPIRED");return true;}function negotiateExecutionMode(observation,config,nowEpochMs){if(!observation||typeof observation!=="object")throw typedError("ACCOUNT_CONTEXT_UNAVAILABLE");const readiness=observation.calibrationReadiness;if(!readiness||typeof readiness!=="object"||readiness.schemaVersion!==1)throw typedError("CALIBRATION_UNAVAILABLE");if(typeof observation.intendedQueueScaleId!=="string"||!observation.intendedQueueScaleId)throw typedError("CONTEXT_UNIDENTIFIABLE");if(readiness.opponentRatingScaleId!==observation.intendedQueueScaleId)throw typedError("CALIBRATION_SCALE_MISMATCH");if(!Number.isInteger(readiness.generatedAtEpochMs)||readiness.generatedAtEpochMs>nowEpochMs||!Number.isInteger(readiness.expiresAtEpochMs)||readiness.expiresAtEpochMs<=nowEpochMs)throw typedError("CALIBRATION_EXPIRED");if(readiness.active===true){validateStartReadiness(observation,config,nowEpochMs);return Object.freeze({executionMode:"ACTIVE_DDA",warningCode:null});}const code=typeof readiness.reasonCode==="string"&&/^[A-Z][A-Z0-9_]+$/.test(readiness.reasonCode)?readiness.reasonCode:"DDA_MAPPING_UNAVAILABLE";if(!["DDA_MAPPING_UNAVAILABLE","CALIBRATION_NOT_ACTIVE","CALIBRATION_UNAVAILABLE"].includes(code))throw typedError(code);return Object.freeze({executionMode:"COMPATIBILITY",warningCode:code});}function createSessionControlRuntime(options){const settings=options||{};if(!settings.controller||!settings.storagePort||typeof settings.observeStartContext!=="function")throw new TypeError("controller, storagePort, and observeStartContext are required");const controller=settings.controller;const clock=settings.clock||{now:()=>Date.now()};const rollout=validateRollout(settings.rollout||{schemaVersion:1,stage:"ACTIVE_DDA"});const setIntervalFn=settings.setInterval||globalThis.setInterval;const clearIntervalFn=settings.clearInterval||globalThis.clearInterval;const renewalIntervalMs=settings.renewalIntervalMs===undefined?RENEWAL_INTERVAL_MS:settings.renewalIntervalMs;if(!Number.isInteger(renewalIntervalMs)||renewalIntervalMs<=0)throw new TypeError("renewalIntervalMs must be a positive integer");let renewalTimer=null;let renewalInFlight=false;let disposed=false;let generation=0;let startPromise=null;function ensureRenewal(){if(renewalTimer!==null||typeof setIntervalFn!=="function")return;renewalTimer=setIntervalFn(()=>{if(!controller.isActive()||renewalInFlight)return;renewalInFlight=true;Promise.resolve(controller.renewLeadership()).then(async(result)=>{if(!result||result.allowed!==true)throw typedError(result&&result.reason||"LEADERSHIP_RENEWAL_FAILED");controller.setStorageHealthy(true);await controller.reconcileNow();}).catch((error)=>{controller.setStorageHealthy(false);controller.setLease(null);if(typeof settings.onWarning==="function")settings.onWarning(reasonCode(error,"LEADERSHIP_RENEWAL_FAILED"));}).finally(()=>{renewalInFlight=false;});},renewalIntervalMs);}async function start(configInput){if(startPromise)return startPromise;startPromise=(async()=>{const startGeneration=generation;const assertCurrent=()=>{if(disposed||generation!==startGeneration)throw typedError("SESSION_RUNTIME_UNAVAILABLE");};const assertStartAllowed=()=>{if(typeof settings.canStart!=="function")return;const result=settings.canStart();if(result!==true)throw typedError(typeof result==="string"&&result?result:"SESSION_START_BLOCKED");};assertCurrent();assertStartAllowed();if(rollout.stage==="DISABLED")throw typedError("ROLLOUT_DISABLED");if(controller.isActive())throw typedError("ACTIVE_SESSION_EXISTS");let config;try{config=validateSessionConfig(configInput);}catch(error){throw typedError("SESSION_CONFIG_INVALID",error);}let observation;try{observation=await settings.observeStartContext(config);}catch(error){throw typedError(reasonCode(error,"ACCOUNT_CONTEXT_UNAVAILABLE"),error);}assertCurrent();if(!observation||typeof observation.accountKey!=="string"||!observation.accountKey)throw typedError("ACCOUNT_CONTEXT_UNAVAILABLE");const negotiation=settings.negotiateExecutionMode?settings.negotiateExecutionMode(observation,config,clock.now()):negotiateExecutionMode(observation,config,clock.now());controller.setExecutionMode(negotiation.executionMode);if(typeof settings.onMode==="function")settings.onMode(negotiation);const commitStart=async()=>{let current;try{current=await settings.observeStartContext(config);}catch(error){throw typedError(reasonCode(error,"ACCOUNT_CONTEXT_UNAVAILABLE"),error);}if(!current||current.accountKey!==observation.accountKey||current.context!==observation.context||current.pool!==observation.pool||current.intendedQueueScaleId!==observation.intendedQueueScaleId)throw typedError("START_CONTEXT_CHANGED");const authorizationDecision=await resolveAuthorizationPolicy(settings.storagePort,{account:current.accountKey,context:current.context,pool:current.pool,});assertCurrent();if(!controller.snapshot)await controller.recoverSession(observation.accountKey);assertCurrent();if(controller.isActive()){ensureRenewal();throw typedError("ACTIVE_SESSION_EXISTS");}const currentNegotiation=settings.negotiateExecutionMode?settings.negotiateExecutionMode(current,config,clock.now()):negotiateExecutionMode(current,config,clock.now());if(currentNegotiation.executionMode!==negotiation.executionMode)throw typedError("CALIBRATION_STATE_CHANGED");controller.setExecutionMode(currentNegotiation.executionMode);assertStartAllowed();try{const snapshot=await controller.startSession({accountKey:current.accountKey,authorizationDecision,config,executionReasonCode:currentNegotiation.warningCode,activationContext:{context:current.context,pool:current.pool,opponentRatingScaleId:current.intendedQueueScaleId},});try{assertStartAllowed();}catch(error){if(controller.isActive())await controller.requestGracefulStop();throw error;}if(disposed||generation!==startGeneration){try{await controller.requestGracefulStop();}catch(_){}throw typedError("SESSION_RUNTIME_UNAVAILABLE");}ensureRenewal();return snapshot;}catch(error){if(controller.isActive())ensureRenewal();throw error;}};const locks=settings.authorizationLocks;if(locks&&typeof locks.request==="function")return locks.request(AUTHORIZATION_LOCK_NAME,{mode:"exclusive"},commitStart);return commitStart();})();try{return await startPromise;}catch(error){if(error instanceof SessionControlError)throw error;throw typedError(reasonCode(error,"SESSION_START_FAILED"),error);}finally{startPromise=null;}}function dispose(){disposed=true;generation+=1;if(renewalTimer!==null&&typeof clearIntervalFn==="function")clearIntervalFn(renewalTimer);renewalTimer=null;const closeRepository=()=>{if(settings.repository&&typeof settings.repository.close==="function")settings.repository.close();};if(startPromise)Promise.resolve(startPromise).then(closeRepository,closeRepository);else closeRepository();}async function recover(accountKey){if(typeof accountKey!=="string"||!accountKey)throw typedError("ACCOUNT_CONTEXT_UNAVAILABLE");const snapshot=await controller.recoverSession(accountKey);if(controller.isActive()){ensureRenewal();if(typeof settings.onMode==="function")settings.onMode(Object.freeze({executionMode:controller.executionMode,warningCode:snapshot.executionReasonCode,recovered:true}));}return snapshot;}return Object.freeze({controller,dispose,ensureRenewal,recover,rollout,start});}function createSessionControlBootstrap(options){const settings=options||{};let state=Object.freeze({phase:"PENDING",reasonCode:null,runtime:null});let promise=null;function begin(){if(promise)return promise;promise=(async()=>{try{const environment=settings.environment||globalThis;assertCanonicalOrigin(settings.location||environment.location,settings.top||environment.top,settings.self||environment.self);preflightCapabilities(environment);const api=settings.api||module.exports;const storagePort=settings.storagePort||new GmStoragePort(environment.GM_getValue,environment.GM_setValue);const missingRollout="__THINKER_SESSION_CONTROL_ROLLOUT_MISSING_V1__";let rawRollout;try{rawRollout=await Promise.resolve(environment.GM_getValue(ROLLOUT_KEY,missingRollout));}catch(error){throw typedError("ROLLOUT_CONFIG_INVALID",error);}let rollout;try{rollout=rawRollout===missingRollout||rawRollout===null?{schemaVersion:1,stage:"ACTIVE_DDA"}:validateRollout(rawRollout);}catch(error){throw typedError("ROLLOUT_CONFIG_INVALID",error);}const clock=settings.clock||{now:()=>Date.now()};const telemetry=settings.telemetry||new BoundedTelemetry();const repository=settings.repository||new IndexedDbRepository({indexedDB:environment.indexedDB,crypto:environment.crypto,recoveryPort:storagePort});const leader=settings.leader||new LeaderCoordinator({repository,locks:environment.navigator.locks,clock});const ownerTabId=settings.ownerTabId||randomHex128(environment.crypto);const controller=settings.controller||new SessionControlController({repository,leader,clock,ownerTabId,idFactory:settings.idFactory||(()=>randomHex128(environment.crypto)),telemetry,rolloutStage:rollout.stage,});const runtime=createSessionControlRuntime({...settings,controller,storagePort,repository,clock,rollout,authorizationLocks:settings.authorizationLocks||environment.navigator.locks});if(typeof settings.install==="function")await settings.install(runtime,{controller,repository,storagePort,telemetry,rollout});state=Object.freeze({phase:"READY",reasonCode:null,runtime});return runtime;}catch(error){const code=reasonCode(error,"SESSION_RUNTIME_UNAVAILABLE");state=Object.freeze({phase:"FAILED",reasonCode:code,runtime:null});throw typedError(code,error);}})();return promise;}return Object.freeze({begin,getState:()=>state});}module.exports={AUTHORIZATION_LOCK_NAME,BOOTSTRAP_STATES,ROLLOUT_KEY,createSessionControlBootstrap,createSessionControlRuntime,negotiateExecutionMode,randomHex128,reasonCode,validateStartReadiness,};
};
factories["status"]=function(module,exports,require){
const{wilsonInterval}=require("./statistics");const ROLLOUT_STAGES=Object.freeze(["DISABLED","SHADOW_REDUCER","AUTO_QUEUE_CANARY","ACTIVE_DDA"]);function validateRollout(input){if(!input||typeof input!=="object"||Array.isArray(input)||Object.keys(input).length!==2||input.schemaVersion!==1||!ROLLOUT_STAGES.includes(input.stage))throw new TypeError("rollout configuration is invalid");return Object.freeze({schemaVersion:1,stage:input.stage});}function percentage(value){return Math.round(value*10000)/ 100;}function buildStatusView(snapshot,options){const settings=options||{};const now=Number.isInteger(settings.nowEpochMs)?settings.nowEpochMs:Date.now();const rollout=validateRollout(settings.rollout||{schemaVersion:1,stage:"DISABLED"});if(!snapshot){return Object.freeze({phase:"IDLE",role:"FOLLOWER",remainingTtlMs:0,drainDeadlineEpochMs:null,drainRemainingMs:null,observedCounts:{wins:0,draws:0,losses:0,terminalGames:0},controlCounts:{wins:0,draws:0,losses:0,terminalGames:0},rawWinRate:0,posteriorWinRate:0.5,wilsonLower:0,wilsonUpper:1,minWinRate:null,maxWinRate:null,controllerMode:"BOOST",offsetElo:200,opponentRating:null,effectiveTargetElo:null,targetSaturated:false,warningCode:settings.warningCode||null,rolloutStage:rollout.stage,executionMode:settings.executionMode||"UNAVAILABLE",});}const control=snapshot.controlCounts;const rawWinRate=control.terminalGames?control.wins / control.terminalGames:0;const interval=wilsonInterval(control.wins,control.terminalGames);const actuator=snapshot.activeGame&&snapshot.activeGame.actuator;const modeOffset=snapshot.controller.mode==="BOOST"?snapshot.config.boostOffsetElo:snapshot.config.correctionOffsetElo;return Object.freeze({phase:snapshot.phase,role:settings.isLeader?"LEADER":"FOLLOWER",remainingTtlMs:Math.max(0,snapshot.deadlineEpochMs-now),drainDeadlineEpochMs:snapshot.drainDeadlineEpochMs,drainRemainingMs:snapshot.drainDeadlineEpochMs===null?null:Math.max(0,snapshot.drainDeadlineEpochMs-now),observedCounts:{...snapshot.observedCounts},controlCounts:{...control},rawWinRate:percentage(rawWinRate),posteriorWinRate:percentage(snapshot.controller.posteriorWinRate),wilsonLower:percentage(interval.lower),wilsonUpper:percentage(interval.upper),minWinRate:percentage(snapshot.config.minWinRate),maxWinRate:percentage(snapshot.config.maxWinRate),controllerMode:snapshot.controller.mode,offsetElo:actuator?actuator.offsetElo:modeOffset,opponentRating:snapshot.activeGame?snapshot.activeGame.opponent.rating:null,effectiveTargetElo:actuator?actuator.effectiveTargetElo:null,targetSaturated:Boolean(actuator&&actuator.saturated),warningCode:settings.warningCode||snapshot.pauseReason||null,rolloutStage:rollout.stage,executionMode:settings.executionMode||"ACTIVE_DDA",});}function formatDuration(milliseconds){if(milliseconds===null)return "—";const seconds=Math.max(0,Math.ceil(milliseconds / 1000));const hours=Math.floor(seconds / 3600);const minutes=Math.floor((seconds%3600)/ 60);const remainder=seconds%60;return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;}module.exports={ROLLOUT_STAGES,buildStatusView,formatDuration,validateRollout};
};
factories["telemetry"]=function(module,exports,require){
const{clone,deepFreeze,exactKeys,isPlainObject}=require("./models");const TELEMETRY_VERSION="session-control-telemetry-v1";const DIAGNOSTIC_VERSION="session-control-diagnostic-v1";const EVENT_NAMES=Object.freeze(["session_started","session_recovered","session_draining","session_completed","leader_acquired","leader_lost","lease_takeover","queue_intent_admitted","queue_intent_consumed","queue_intent_expired","game_target_pinned","result_committed","duplicate_result_ignored","dda_mode_changed","target_saturated","calibration_mismatch","session_paused",]);const FIELD_NAMES=Object.freeze(["occurredAtEpochMs","phase","revision","role","observedCounts","controlCounts","controllerMode","posteriorWinRate","offsetElo","rawTargetElo","effectiveTargetElo","saturated","reasonCode","reducerVersion","estimatorVersion","controllerVersion","rolloutStage",]);function safeCounts(value,field){exactKeys(value,["wins","draws","losses","terminalGames"],[],field);const output={};for(const key of["wins","draws","losses","terminalGames"]){if(!Number.isInteger(value[key])||value[key]<0)throw new TypeError(`${field}.${key} is invalid`);output[key]=value[key];}return output;}function sanitizeFields(input){if(!isPlainObject(input))throw new TypeError("telemetry fields must be an object");for(const key of Object.keys(input))if(!FIELD_NAMES.includes(key))throw new TypeError(`telemetry field is forbidden: ${key}`);const output={};for(const[key,value]of Object.entries(input)){if(value===undefined||value===null)continue;if(key==="observedCounts"||key==="controlCounts")output[key]=safeCounts(value,`telemetry.${key}`);else if(["occurredAtEpochMs","revision","offsetElo","rawTargetElo","effectiveTargetElo"].includes(key)){if(!Number.isInteger(value))throw new TypeError(`telemetry.${key} must be an integer`);output[key]=value;}else if(key==="posteriorWinRate"){if(!Number.isFinite(value)||value<0||value>1)throw new TypeError("telemetry.posteriorWinRate is invalid");output[key]=value;}else if(key==="saturated"){if(typeof value!=="boolean")throw new TypeError("telemetry.saturated must be boolean");output[key]=value;}else{if(typeof value!=="string"||!value||value.length>120)throw new TypeError(`telemetry.${key} must be a short string`);output[key]=value;}}return output;}function sanitizeEvent(input){if(!isPlainObject(input))throw new TypeError("telemetry event must be an object");const{schemaVersion,telemetryVersion,name,...fields}=input;if(schemaVersion!==1)throw new TypeError("telemetry schema version is unsupported");if(telemetryVersion!==TELEMETRY_VERSION)throw new TypeError("telemetry version is unsupported");if(!EVENT_NAMES.includes(name))throw new TypeError("telemetry event name is unsupported");return{schemaVersion,telemetryVersion,name,...sanitizeFields(fields)};}class BoundedTelemetry{constructor(options){const settings=options||{};this.capacity=settings.capacity===undefined?500:settings.capacity;if(!Number.isInteger(this.capacity)||this.capacity<1||this.capacity>5000)throw new TypeError("telemetry capacity is invalid");this.events=[];}record(name,fields){const event=deepFreeze(sanitizeEvent({schemaVersion:1,telemetryVersion:TELEMETRY_VERSION,name,...(fields||{})}));this.events.push(event);if(this.events.length>this.capacity)this.events.splice(0,this.events.length-this.capacity);return event;}list(){return deepFreeze(clone(this.events));}clear(){this.events.length=0;}}function diagnosticExport(status,events,generatedAtEpochMs){if(!isPlainObject(status))throw new TypeError("diagnostic status must be an object");if(!Array.isArray(events))throw new TypeError("diagnostic events must be an array");if(!Number.isInteger(generatedAtEpochMs)||generatedAtEpochMs<0)throw new TypeError("diagnostic timestamp is invalid");const allowedStatus=["phase","role","remainingTtlMs","drainDeadlineEpochMs","drainRemainingMs","observedCounts","controlCounts","rawWinRate","posteriorWinRate","wilsonLower","wilsonUpper","minWinRate","maxWinRate","controllerMode","offsetElo","opponentRating","effectiveTargetElo","targetSaturated","warningCode","rolloutStage","executionMode",];const safeStatus={};for(const key of allowedStatus)if(Object.prototype.hasOwnProperty.call(status,key))safeStatus[key]=clone(status[key]);return deepFreeze({schemaVersion:1,diagnosticVersion:DIAGNOSTIC_VERSION,generatedAtEpochMs,status:safeStatus,events:events.map(sanitizeEvent)});}module.exports={BoundedTelemetry,DIAGNOSTIC_VERSION,EVENT_NAMES,FIELD_NAMES,TELEMETRY_VERSION,diagnosticExport,sanitizeEvent,sanitizeFields};
};
factories["ui"]=function(module,exports,require){
const FIELD_IDS=Object.freeze({durationMinutes:"kb-session-duration",minimumPercent:"kb-session-min-rate",maximumPercent:"kb-session-max-rate",});const TERMINAL_PHASES=Object.freeze(["IDLE","COMPLETED","ABORTED"]);const PHASE_LABELS=Object.freeze({IDLE:"Idle",QUEUEING:"Searching...",IN_GAME:"Playing...",DRAINING:"Finishing session...",PAUSED_QUEUEING:"Paused",PAUSED_ACTIVE:"Paused",COMPLETED:"Completed",ABORTED:"Stopped",});const SUCCESS_LABELS=Object.freeze({SESSION_STARTED:"Session started",DRAINING:"Finishing session...",SESSION_STOPPED:"Session finished",COMPLETED:"Completed",});function phaseLabel(phase){return Object.prototype.hasOwnProperty.call(PHASE_LABELS,phase)?PHASE_LABELS[phase]:"Updating...";}function warningLabel(code){if(!code)return "";if(code==="DDA_MAPPING_UNAVAILABLE"||code.includes("ARTIFACT"))return "⚠️ Check calibration artifact";if(code.startsWith("CALIBRATION_"))return "⚠️ Calibration unavailable";return "⚠️ Unable to update session";}function successLabel(code){return SUCCESS_LABELS[code]||"Operation completed";}function reasonCode(error,fallback){if(error&&typeof error.code==="string"&&error.code)return error.code;if(error&&typeof error.reason==="string"&&error.reason)return error.reason;if(error&&typeof error.message==="string"&&/^[A-Z][A-Z0-9_]+$/.test(error.message))return error.message;return fallback;}function findById(panel,id){return panel&&typeof panel.querySelector==="function"?panel.querySelector(`#${id}`):null;}function setText(panel,id,value){const node=findById(panel,id);if(node)node.textContent=value;}function actionNode(panel,target){let node=target;while(node&&node!==panel){if(typeof node.getAttribute==="function"&&node.getAttribute("data-action"))return node;node=node.parentNode;}return null;}function availability(status,startBlocker){const terminal=TERMINAL_PHASES.includes(status.phase);return Object.freeze({start:startBlocker||(status.rolloutStage==="DISABLED"?"ROLLOUT_DISABLED":terminal?null:"ACTIVE_SESSION_EXISTS"),stop:terminal?"SESSION_NOT_ACTIVE":null,});}function presentAvailability(panel,action,reason){const button=panel.querySelector(`[data-action="${action}"]`);if(!button)return;button.toggleAttribute("disabled",Boolean(reason));button.setAttribute("aria-disabled",reason?"true":"false");if(reason){button.setAttribute("data-disabled-reason",reason);}else{button.removeAttribute("data-disabled-reason");}button.removeAttribute("title");}function presentStatus(panel,status,formatDuration,startBlocker){const counts=status.observedCounts;const controlCounts=status.controlCounts;panel.setAttribute("data-session-state",status.phase==="IDLE"?"never-started":status.phase.toLowerCase().replace(/_/g,"-"));panel.setAttribute("data-session-history",status.phase==="IDLE"?"none":"present");setText(panel,"kb-session-phase",phaseLabel(status.phase));setText(panel,"kb-session-ttl",formatDuration(status.remainingTtlMs));setText(panel,"kb-session-observed",`${counts.wins} W | ${counts.draws} D | ${counts.losses} L`);setText(panel,"kb-session-raw",controlCounts.terminalGames===0?"—":`${status.rawWinRate.toFixed(0)}%`);const state=availability(status,startBlocker);presentAvailability(panel,"start",state.start);presentAvailability(panel,"stop",state.stop);return state;}function createSessionControlPresenter(options){if(!options||typeof options.getPanel!=="function")throw new TypeError("getPanel is required");const AbortControllerType=options.AbortController||globalThis.AbortController;if(typeof AbortControllerType!=="function")throw new TypeError("AbortController is required");let panel=null;let abortController=null;let currentAvailability=Object.freeze({start:"STATUS_UNAVAILABLE",stop:"STATUS_UNAVAILABLE"});let sequence=0;const draft=Object.create(null);const inFlight=new Set();function emit(type,detail){sequence+=1;if(panel){panel.setAttribute("data-session-ui-event",type);panel.setAttribute("data-session-ui-sequence",String(sequence));}if(typeof options.onTelemetry==="function")options.onTelemetry(Object.freeze({type,sequence,...(detail||{})}));}function warning(code){const value=code||"STATUS_UNAVAILABLE";if(typeof options.setWarning==="function")options.setWarning(value);const label=warningLabel(value);if(typeof options.notify==="function")options.notify(label,{transient:true});emit("warning",{code:value});}function success(code){if(typeof options.setWarning==="function")options.setWarning(null);if(typeof options.notify==="function")options.notify(successLabel(code),{transient:true,success:true});emit("success",{code});}function captureDraft(nextPanel){for(const[field,id]of Object.entries(FIELD_IDS)){const input=findById(nextPanel,id);if(!input)continue;if(Object.prototype.hasOwnProperty.call(draft,field))input.value=draft[field];else draft[field]=String(input.value);}}function readDraft(){return Object.freeze({durationMinutes:draft.durationMinutes,minimumPercent:draft.minimumPercent,maximumPercent:draft.maximumPercent,});}function readConfig(){if(typeof options.createConfig!=="function")throw new TypeError("createConfig is required");return options.createConfig(readDraft());}async function run(action){if(inFlight.has(action))return;const blocked=currentAvailability[action];if(blocked){emit("blocked",{action,code:blocked});return;}inFlight.add(action);emit("dispatch",{action});try{if(action==="start"){let config;try{config=readConfig();}catch(error){warning(reasonCode(error,"SESSION_CONFIG_INVALID"));return;}await options.start(config);success("SESSION_STARTED");}else if(action==="stop"){const result=await options.stop();if(!result||result.allowed!==true){warning(reasonCode(result,"GRACEFUL_STOP_FAILED"));return;}success(reasonCode(result,"SESSION_STOPPED"));}}catch(error){warning(reasonCode(error,action==="start"?"SESSION_START_FAILED":"GRACEFUL_STOP_FAILED"));}finally{inFlight.delete(action);update();}}function runExport(){emit("dispatch",{action:"export"});try{const diagnostic=options.exportDiagnostic();options.downloadDiagnostic(diagnostic);}catch(error){warning(reasonCode(error,"DIAGNOSTIC_EXPORT_FAILED"));}update();}function bind(nextPanel){if(nextPanel===panel&&abortController)return false;if(abortController)abortController.abort();panel=nextPanel||null;abortController=null;if(!panel)return false;captureDraft(panel);abortController=new AbortControllerType();const signal=abortController.signal;panel.addEventListener("input",(event)=>{for(const[field,id]of Object.entries(FIELD_IDS)){if(event.target&&event.target.id===id){draft[field]=String(event.target.value);emit("draft",{field});return;}}},{signal});panel.addEventListener("click",(event)=>{const button=actionNode(panel,event.target);if(!button)return;event.preventDefault();event.stopPropagation();const action=button.getAttribute("data-action");if(action==="export")runExport();else if(action==="start"||action==="stop")void run(action);},{signal});emit("bound");return true;}function update(){const nextPanel=options.getPanel();if(nextPanel!==panel)bind(nextPanel);if(!panel)return null;try{const status=options.readStatus();const startBlocker=typeof options.readStartBlocker==="function"?options.readStartBlocker():null;currentAvailability=presentStatus(panel,status,options.formatDuration,startBlocker);return status;}catch(error){warning(reasonCode(error,"STATUS_UNAVAILABLE"));return null;}}function dispose(){if(abortController)abortController.abort();abortController=null;panel=null;}return Object.freeze({bind,dispose,readConfig,readDraft,update});}module.exports={FIELD_IDS,createSessionControlPresenter,phaseLabel,presentStatus,reasonCode,successLabel,warningLabel};
};
factories["index"]=function(module,exports,require){
module.exports=Object.freeze({...require("./clock"),...require("./controller"),...require("./leader"),...require("./models"),...require("./ports"),...require("./platform-chesscom"),...require("./reducer"),...require("./repository"),...require("./runtime"),...require("./statistics"),...require("./status"),...require("./telemetry"),...require("./ui"),});
};
const cache=Object.create(null);
function localRequire(request){
const id=request.replace(/^\.\//,"").replace(/\.js$/,"");
if(!Object.prototype.hasOwnProperty.call(factories,id))throw new Error(`Unknown session-control module: ${request}`);
if(!cache[id]){
const module={exports:{}};
cache[id]=module;
factories[id](module,module.exports,localRequire);
}
return cache[id].exports;
}
const api=localRequire("./index");
Object.defineProperty(root,"ThinkerSessionControl",{configurable:false,enumerable:false,writable:false,value:api});
})(globalThis);
return globalThis.ThinkerSessionControl;
})();
/* THINKER_SESSION_CONTROL_GENERATED_END */
