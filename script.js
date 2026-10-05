// ==UserScript==
// @name         TC157
// @namespace    http://tampermonkey.net/
// @version      2026-10-04.1
// @description  Chess Bot com Servidor Local
// @author       You
// @match        https://www.chess.com/*
// @match        https://chess.com/*
// @noframes
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @run-at       document-idle
// @grant        GM_xmlhttpRequest
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

  function debug(method, ...args) {
    if (!DEBUG) return;
    const logger = console[method];
    if (typeof logger === "function") logger.call(console, ...args);
  }

  // --- SAFETY RESET / CONFIGURAÇÃO INICIAL ---
  // Garante que todas as features comecem DESATIVADAS por padrão no primeiro uso desta versão,
  // limpando qualquer estado anterior que possa ter ficado ativo (Smart Pacing, Eval Bar, Auto Adjust).
  // Também força o modo do Auto Run Delay para Random (RND) por padrão.
  const resetDefaultsThisVersion = localStorage.getItem("kb_default_off_v5") !== "true";
  if (resetDefaultsThisVersion) {
    localStorage.setItem("smartPacing", "false");
    localStorage.setItem("evalBar", "false");
    localStorage.setItem("kb-auto-adjust", "false");
    localStorage.setItem("kb-auto-queue", "false");
    localStorage.setItem("autoDelayMode", "random");
    localStorage.setItem("autoMinDelay", "0.5");
    localStorage.setItem("autoMaxDelay", "2.0");
    localStorage.setItem("kb_default_off_v5", "true");
  }

  // --- CONFIGURAÃ‡Ã•ES PADRÃƒO (AUTO RUN DELAY) ---
  const DEFAULT_MIN_DELAY = 0.5,
    DEFAULT_MAX_DELAY = 2.0,
    DEFAULT_DELAY_MODE = "random";

  // --- CONFIGURAÃ‡Ã•ES DO AUTO ADJUST RATING ---
  const AUTO_ADJUST_N = 5,
    AUTO_ADJUST_MIN_ELO = 800,
    AUTO_ADJUST_MAX_ELO = 3200,
    AUTO_ADJUST_STEP = 100;

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
      this._currentDifficulty = Math.min(
        opponentRating + 200,
        AUTO_ADJUST_MAX_ELO,
      );
      this._saveDifficulty();
    }

    resetToBase() {
      this._currentDifficulty = this._baseElo;
      this._saveDifficulty();
    }
  }

  function getOpponentRating() {
    const screenMiddle = window.innerHeight / 2;

    const players = document.querySelectorAll(
      ".player-component, .board-layout-player, .user-tagline-component, .user-tagline, [class*='player']",
    );

    let opponentEl = null;
    let minTop = Infinity;

    players.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top > screenMiddle) return;
      if (rect.top >= 0 && rect.top < minTop && rect.bottom > 0) {
        minTop = rect.top;
        opponentEl = el;
      }
    });

    if (!opponentEl) {
      const allLinks = document.querySelectorAll("a[href*='/member/']");
      for (const link of allLinks) {
        const rect = link.getBoundingClientRect();
        if (rect.top > screenMiddle || rect.top < 0) continue;
        const text = link.innerText;
        const match = text.match(/\((\d{3,4})\)/);
        if (match) {
          return parseInt(match[1], 10);
        }
      }
      return null;
    }

    const rawText = opponentEl.innerText || "";
    const regex = /(?<!\w)\(?(\d{3,4})\)?(?!:)/g;
    const matches = [...rawText.matchAll(regex)];

    let foundElo = null;
    for (const m of matches) {
      if (m[0].includes("(")) {
        foundElo = parseInt(m[1]);
        break;
      }
    }

    if (!foundElo && matches.length > 0) {
      const candidates = matches
        .map((m) => parseInt(m[1]))
        .filter((n) => n >= 400 && n < 3200);
      if (candidates.length > 0) foundElo = candidates[0];
    }

    return foundElo;
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

  let mySession = { wins: 0, losses: 0, draws: 0, streak: 0, streakType: null };

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
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    },

    ensureScoutWrapper() {
      const container = document.getElementById("krypbot-container");
      if (!container || !container.parentNode) return null;
      let wrapper = document.getElementById("oi-wrapper");
      let layoutChanged = false;
      if (!wrapper) {
        wrapper = document.createElement("div");
        wrapper.id = "oi-wrapper";
        container.parentNode.insertBefore(wrapper, container);
        wrapper.appendChild(container);
        layoutChanged = true;
      } else if (container.parentNode !== wrapper) {
        container.parentNode.insertBefore(wrapper, container);
        wrapper.appendChild(container);
        layoutChanged = true;
      }
      const currentMarginTop = wrapper.style.marginTop;
      wrapper.style.cssText =
        "display:grid;grid-template-columns:268px 296px;gap:14px;align-items:start;width:max-content;max-width:none;overflow:visible;margin-left:clamp(0px,calc(100% - 578px),44px);margin-bottom:30px;";
      wrapper.style.marginTop = currentMarginTop || "30px";
      container.style.width = "268px";
      container.style.maxWidth = "268px";
      container.style.margin = "0";
      container.style.boxSizing = "border-box";
      if (layoutChanged && typeof scheduleThinkerWorkspaceLayout === "function") {
        scheduleThinkerWorkspaceLayout();
      }
      return { container, wrapper };
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
        "width:296px;min-height:520px;box-sizing:border-box;background:#111216;border:1px solid #202228;border-radius:20px;box-shadow:0 18px 42px rgba(0,0,0,.34);padding:16px 18px;font-family:Inter,Arial,sans-serif;color:#fff;margin:0;display:flex;flex-direction:column;";
      const title = state === "waiting" ? "Aguardando adversário" : "Histórico indisponível";
      const detail = state === "waiting"
        ? "O Scout exibirá apenas dados públicos reais quando identificar o adversário."
        : "Não foi possível obter partidas públicas agora. O Scout tentará novamente automaticamente.";
      panel.innerHTML = `
        <div class="tc-scout-head" style="display:flex;align-items:center;justify-content:space-between;gap:12px;min-width:0;padding-bottom:12px;border-bottom:1px solid #26282e">
          <div style="min-width:0;font-size:14px;line-height:1.2;font-weight:800">Scout do Oponente</div>
          <button class="tc-scout-close" type="button" aria-label="Fechar Scout" style="flex:none;width:20px;height:20px;padding:0;border:0;border-radius:50%;background:#202126;color:#9da3b2;cursor:pointer">×</button>
        </div>
        <div class="tc-scout-empty" style="display:flex;flex-direction:column;align-items:flex-start;gap:8px;min-width:0;padding-top:16px">
          <span class="tc-scout-status" style="display:inline-block;max-width:100%;padding:5px 8px;border:1px solid #303640;border-radius:999px;color:#c6cbd4;font-size:11px;line-height:1.3">${title}</span>
          <p class="tc-scout-empty-detail" style="margin:0;max-width:100%;color:#9da3b2;font-size:11px;line-height:1.5;white-space:normal;overflow-wrap:anywhere">${detail}</p>
        </div>`;
      panel.querySelector(".tc-scout-close")?.addEventListener("click", () => {
        panel.style.display = "none";
      });
      if (state === "unavailable" && this.lastOpponent) {
        const retry = document.createElement("button");
        retry.type = "button";
        retry.textContent = "Tentar novamente";
        retry.style.cssText = "margin-top:16px;padding:8px 12px;border:1px solid #2d7650;border-radius:8px;background:#143522;color:#63ec9d;cursor:pointer";
        retry.addEventListener("click", () => this.fetchData(this.lastOpponent));
        panel.appendChild(retry);
      }
      if (typeof _ghostModeActive !== "undefined" && _ghostModeActive) panel.style.display = "none";
      layout.wrapper.appendChild(panel);
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
        "width:296px;min-height:520px;box-sizing:border-box;background:#111216;border:1px solid #202228;border-radius:20px;box-shadow:0 18px 42px rgba(0,0,0,.34);padding:16px 18px;font-family:Inter,Arial,sans-serif;color:#fff;display:flex;flex-direction:column;gap:14px;margin:0;";
      panel.innerHTML = `
        <div style="padding-bottom:12px;border-bottom:1px solid #25272d">
          <div style="font-size:14px;font-weight:800;color:#f7f8fa">Scout do Oponente</div>
          <div style="margin-top:4px;color:#8d93a1;font-size:10px">Carregando histórico recente…</div>
        </div>
        <div style="align-self:center;width:84px;height:84px;border-radius:50%;background:#202228"></div>
        <div style="height:52px;border-radius:10px;background:#18191e"></div>
        <div style="height:52px;border-radius:10px;background:#18191e"></div>`;
      if (typeof _ghostModeActive !== "undefined" && _ghostModeActive) panel.style.display = "none";
      layout.wrapper.appendChild(panel);
    },

    hide() {
      document.querySelectorAll(".tc-hud-stats").forEach((element) => element.remove());
      const panel = document.getElementById("oi-zone2");
      if (panel) panel.remove();
    },

    renderHUD(hudStats) {
      document.querySelectorAll(".tc-hud-stats").forEach((element) => element.remove());
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
        const icon = streak.type === "W" ? "&#128293;" : streak.type === "L" ? "&#10052;" : "&#10134;";
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
        return '<div style="padding:8px 0;color:#777e8d;font-size:10px">Nenhuma abertura identificada.</div>';
      }
      return openings
        .map(
          (opening) => `
            <div class="tc-scout-opening-row">
              <span class="tc-scout-color-chip ${filled ? "is-filled" : ""}"></span>
              <span class="tc-scout-opening-name" title="${this.escapeHtml(opening.name)}">${this.escapeHtml(opening.name)}</span>
              <span class="tc-scout-opening-count"><b>${opening.count}</b><small>de ${totalGames}</small></span>
            </div>`,
        )
        .join("");
    },

    timeClassLabel(value) {
      return ({ bullet: "Bullet", blitz: "Blitz", rapid: "Rápidas", daily: "Diárias", other: "Outras" })[
        value
      ];
    },

    lossReasonLabel(value) {
      return (
        {
          checkmated: "Xeque-mate",
          timeout: "Tempo",
          resigned: "Desistência",
          abandoned: "Abandono",
          repetition: "Repetição",
        }[value] || this.cleanOpeningName(value)
      );
    },

    renderColorRecord(label, record, filled) {
      return `
        <div class="tc-scout-stat-row">
          <span class="tc-scout-color-chip ${filled ? "is-filled" : ""}"></span>
          <span class="tc-scout-stat-copy"><b>${label}</b><small>${record.games} jogos · ${record.wins}V–${record.draws}E–${record.losses}D</small></span>
          <span class="tc-scout-stat-value"><b>${record.winRate}%</b><small>vitórias</small></span>
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
        "width:296px;box-sizing:border-box;background:#111216;border:1px solid #202228;border-radius:20px;box-shadow:0 18px 42px rgba(0,0,0,.34);padding:16px 18px 18px;font-family:Inter,Arial,sans-serif;color:#f7f8fa;display:flex;flex-direction:column;margin:0;";
      const lastPlayedDate = new Date(scoutStats.lastPlayed * 1000);
      const lastPlayed = Number.isNaN(lastPlayedDate.getTime())
        ? "—"
        : lastPlayedDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");
      const winEnd = (scoutStats.wins / scoutStats.sampleSize) * 100;
      const drawEnd = ((scoutStats.wins + scoutStats.draws) / scoutStats.sampleSize) * 100;
      const donutGradient = `conic-gradient(${SCOUT_RESULT_COLORS.win} 0% ${winEnd}%,${SCOUT_RESULT_COLORS.draw} ${winEnd}% ${drawEnd}%,${SCOUT_RESULT_COLORS.loss} ${drawEnd}% 100%)`;
      const timeRows = scoutStats.timeClasses
        .map(
          (item) => `
            <div class="tc-scout-stat-row tc-scout-speed-row">
              <span class="tc-scout-speed-icon" aria-hidden="true"></span>
              <span class="tc-scout-stat-copy"><b>${this.timeClassLabel(item.name)}</b><small>${item.games} de ${scoutStats.sampleSize} jogos</small></span>
              <span class="tc-scout-stat-value"><b>${item.winRate}%</b><small>vitórias</small></span>
            </div>`,
        )
        .join("");
      panel.innerHTML = `
        <style>
          #oi-zone2 .tc-scout-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
          #oi-zone2 .tc-scout-title{font-size:14px;line-height:1.2;font-weight:800;color:#f7f8fa}
          #oi-zone2 .tc-scout-subtitle{margin-top:4px;color:#8b91a0;font-size:10px;line-height:1.25}
          #oi-zone2 .tc-scout-close{width:20px;height:20px;padding:0;border:0;border-radius:50%;background:#202126 center/11px 11px no-repeat url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23808692' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='M18 6 6 18M6 6l12 12'/%3E%3C/svg%3E");color:transparent;font-size:0;cursor:pointer}
          #oi-zone2 .tc-scout-donut{position:relative;width:84px;height:84px;margin:20px auto 10px;border-radius:50%}
          #oi-zone2 .tc-scout-donut::after{content:"";position:absolute;inset:9px;border-radius:50%;background:#111216}
          #oi-zone2 .tc-scout-donut-copy{position:absolute;inset:0;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center}
          #oi-zone2 .tc-scout-donut-copy b{font-size:22px;line-height:1;font-weight:850}
          #oi-zone2 .tc-scout-donut-copy small{margin-top:3px;color:#8d93a1;font-size:8px}
          #oi-zone2 .tc-scout-record{text-align:center;color:#9298a5;font-size:11px;margin:4px 0 14px}
          #oi-zone2 .tc-scout-section{border-top:1px solid #26282e;padding:8px 0}
          #oi-zone2 .tc-scout-section-title{padding:4px 22px 7px;color:#9da3b2;font-size:11px}
          #oi-zone2 .tc-scout-stat-row{display:grid;grid-template-columns:15px minmax(0,1fr) 72px;align-items:center;gap:9px;padding:8px 0}
          #oi-zone2 .tc-scout-color-chip{width:11px;height:11px;border:1.5px solid #747b88;border-radius:3px;box-sizing:border-box}
          #oi-zone2 .tc-scout-color-chip.is-filled{background:#f0f1f3;border-color:#f0f1f3}
          #oi-zone2 .tc-scout-stat-copy{min-width:0;display:flex;flex-direction:column;gap:2px}
          #oi-zone2 .tc-scout-stat-copy b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#f4f5f7;font-size:11px;font-weight:750}
          #oi-zone2 .tc-scout-stat-copy small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#9298a6;font-size:9px}
          #oi-zone2 .tc-scout-stat-value{display:flex;flex-direction:column;align-items:flex-end;gap:2px}
          #oi-zone2 .tc-scout-stat-value b{color:#18e878;font-size:12px;font-weight:800}
          #oi-zone2 .tc-scout-stat-value small{color:#9298a6;font-size:8px}
          #oi-zone2 .tc-scout-speed-icon{width:15px;height:18px;background:center/14px 14px no-repeat url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%238d93a1' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M13 2 3 14h9l-1 8 10-12h-9z'/%3E%3C/svg%3E")}
          #oi-zone2 .tc-scout-opening-row{display:grid;grid-template-columns:15px minmax(0,1fr) 30px;align-items:center;gap:9px;padding:8px 0}
          #oi-zone2 .tc-scout-opening-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#f4f5f7;font-size:10px;font-weight:700}
          #oi-zone2 .tc-scout-opening-count{display:flex;flex-direction:column;align-items:flex-end;color:#fff}
          #oi-zone2 .tc-scout-opening-count b{font-size:12px} #oi-zone2 .tc-scout-opening-count small{color:#9298a6;font-size:8px}
        </style>
        <div class="tc-scout-head">
          <div><div class="tc-scout-title">Scout do Oponente</div><div class="tc-scout-subtitle">${this.escapeHtml(this.lastOpponent || "Oponente")} · ${scoutStats.sampleSize} jogos · até ${lastPlayed}</div></div>
          <button class="tc-scout-close" type="button" aria-label="Fechar Scout">Fechar</button>
        </div>
        <div class="tc-scout-donut" style="background:${donutGradient}">
          <div class="tc-scout-donut-copy"><b>${scoutStats.winRate}%</b><small>taxa de vitórias</small></div>
        </div>
        <div class="tc-scout-record"><span class="w" style="color:${SCOUT_RESULT_COLORS.win}">${scoutStats.wins} V</span> · <span class="e" style="color:${SCOUT_RESULT_COLORS.draw}">${scoutStats.draws} E</span> · <span class="l" style="color:${SCOUT_RESULT_COLORS.loss}">${scoutStats.losses} D</span></div>
        <div class="tc-scout-section">
          ${this.renderColorRecord("Brancas", scoutStats.colors.white, true)}
          ${this.renderColorRecord("Pretas", scoutStats.colors.black, false)}
        </div>
        <div class="tc-scout-section">${timeRows}</div>
        <div class="tc-scout-section">
          <div class="tc-scout-section-title">Aberturas mais jogadas</div>
          ${this.renderOpeningGroup(scoutStats.openings.white, scoutStats.colors.white.games, true)}
          ${this.renderOpeningGroup(scoutStats.openings.black, scoutStats.colors.black.games, false)}
        </div>
        `;
      if (typeof _ghostModeActive !== "undefined" && _ghostModeActive) panel.style.display = "none";
      layout.wrapper.appendChild(panel);
      panel.querySelector(".tc-scout-close")?.addEventListener("click", () => {
        panel.style.display = "none";
      });
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
      if (autoAdjust.isEnabled()) {
        setTimeout(() => {
          if (username !== this.lastOpponent) return;
          const rating = getOpponentRating();
          if (rating) {
            autoAdjust.setOpponentRating(rating);
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
  if (isNaN(autoDelayMin) || autoDelayMin < 0) autoDelayMin = DEFAULT_MIN_DELAY;
  if (isNaN(autoDelayMax) || autoDelayMax < 0) autoDelayMax = DEFAULT_MAX_DELAY;
  if (autoDelayMin > autoDelayMax)
    [autoDelayMin, autoDelayMax] = [autoDelayMax, autoDelayMin];

  let smartPacingEnabled = localStorage.getItem("smartPacing") === "true";

  let chessBot = {
    elo: 3200,
    time: 0.02,
  };

  let autoAdjust = new AutoAdjustRating(chessBot.elo);

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
      deltaFactor = 0.25,
      maxExtraDelayMs = 3500,
      jitterLimit = 0.18,
      jitterSigma = 0.06,
      emergencyMinMs = 150,
      emergencyMaxMs = 250,
      random = Math.random,
    } = {}) {
      this.deltaFactor = deltaFactor;
      this.maxExtraDelayMs = maxExtraDelayMs;
      this.jitterLimit = jitterLimit;
      this.jitterSigma = jitterSigma;
      this.emergencyMinMs = emergencyMinMs;
      this.emergencyMaxMs = emergencyMaxMs;
      this.random = random;
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

    calculateDelay({
      userTime,
      opponentTime,
      baseDelayMs,
      complexityMultiplier = 1,
      isForced = false,
    }) {
      const userTimeMs = this.parseTime(userTime);
      const opponentTimeMs = this.parseTime(opponentTime);
      const baseMs = Number(baseDelayMs);
      const multiplier = Number(complexityMultiplier);
      if (!Number.isFinite(baseMs) || baseMs < 0) {
        throw new TypeError("baseDelayMs invalido");
      }
      if (!Number.isFinite(multiplier) || multiplier <= 0) {
        throw new TypeError("complexityMultiplier invalido");
      }
      if (userTimeMs < 10000 || isForced) {
        return Math.round(this.uniform(this.emergencyMinMs, this.emergencyMaxMs));
      }
      const delta = userTimeMs - opponentTimeMs;
      const extraDelay =
        delta > 0
          ? Math.min(delta * this.deltaFactor, this.maxExtraDelayMs)
          : 0;
      const deterministicDelay = baseMs * multiplier + extraDelay;
      return Math.max(0, Math.round(deterministicDelay * this.gaussianFactor()));
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
      const delayMs = exactDelay
        ? Math.round(exactDelayMs)
        : this.calculateDelay(pacingInput);
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
      return { delayMs, promise };
    }
  }

  const smartPacer = new SmartPacer();

  const gaussianRandom = (mean = 0, stdev = 1) => {
    let u = 1 - Math.random();
    let v = Math.random();
    let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z * stdev + mean;
  };

  // ===== EVAL BAR ENGINE (baseado no documento tecnico) =====
  let evalBarEnabled = localStorage.getItem("evalBar") === "true";
  let lastEvalData = { cp: 0, mate: null, depth: 0 };
  let evalBarCurrent = 50;
  let lastEvalFen = "";

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
    if (!evalBarEnabled && !smartPacingEnabled) return;
    if (!fen) return;
    // Sem guard de FEN duplicado aqui - o caller controla
    try {
      GM_xmlhttpRequest({
        method: "POST",
        url: SERVER_URL + "/eval",
        headers: { "Content-Type": "application/json" },
        data: JSON.stringify({ fen: fen }),
        onload: function (resp) {
          try {
            const data = JSON.parse(resp.responseText);
            if (data) {
              lastEvalData = data;
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

  function injectEvalBarDOM() {
    if (document.getElementById("thinker-eval-bar")) return;
    const boardEl =
      document.querySelector("wc-chess-board") ||
      document.querySelector(".board") ||
      document.querySelector("chess-board");
    if (!boardEl) return;
    const container = boardEl.parentElement;
    if (!container) return;
    container.style.display = "flex";
    container.style.alignItems = "stretch";

    const barEl = document.createElement("div");
    barEl.id = "thinker-eval-bar";
    barEl.style.cssText =
      "width:28px;min-height:100%;background:#1a1a1a;border-radius:6px;margin-right:6px;position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:flex-end;box-shadow:0 2px 12px rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.06);transition:all 0.3s ease;";

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
    container.insertBefore(barEl, boardEl);
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

  const computeDelayValue = (gameObj = null) => {
    // PRIORIDADE MAXIMA: modo MAX sempre retorna 0, independente do Smart Pacing
    if (autoDelayMode === "max") return 0;

    // Smart Pacing ativo: usa logica humanizada
    if (smartPacingEnabled) {
      return computeSmartPacing(gameObj);
    }

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

  // ===== SMART PACING ENGINE (Gestão de tempo humanizada) =====
  const computeSmartPacing = (gameObj = null) => {
    let baseDelay = 0.2;
    let maxDelay = 2.5;

    // Detecta o controle de tempo pelo relógio na tela
    let timeMode = "blitz";
    const clockEls = document.querySelectorAll(
      ".clock-component .clock-time-component, .clock-component .clock-time",
    );
    let myTimeRemaining = null;
    for (const clock of clockEls) {
      const text = clock.textContent.trim();
      const parts = text.split(":");
      if (parts.length === 2) {
        const mins = parseInt(parts[0]);
        const secs = parseFloat(parts[1]);
        const total = mins * 60 + secs;
        if (myTimeRemaining === null || total < myTimeRemaining) {
          myTimeRemaining = total;
        }
        // Detectar modo pelo tempo inicial (baseado no range)
        if (total <= 120) timeMode = "bullet";
        else if (total <= 300) timeMode = "blitz";
        else timeMode = "rapid";
      }
    }

    if (timeMode === "bullet") maxDelay = 2.5;
    if (timeMode === "blitz") maxDelay = 6.0;
    if (timeMode === "rapid") maxDelay = 12.0;

    let legalMovesCount = 20;
    let moveNumber = 10;
    let isForced = false;

    if (gameObj) {
      try {
        const history =
          typeof gameObj.getHistory === "function" ? gameObj.getHistory() : [];
        moveNumber = history.length;

        if (typeof gameObj.getLegalMoves === "function") {
          const legalMoves = gameObj.getLegalMoves();
          legalMovesCount = legalMoves.length;
          if (legalMovesCount <= 1) isForced = true;
        }
      } catch (e) {}
    }

    // Lance forçado (xeque único, recaptura) → reflexo
    if (isForced) {
      return Math.max(0.1, Number(gaussianRandom(0.2, 0.05).toFixed(2)));
    }

    // Abertura (primeiros 8 lances) → memória muscular
    if (moveNumber <= 8) {
      return Math.max(
        0.1,
        Math.min(1.0, Number(gaussianRandom(0.4, 0.15).toFixed(2))),
      );
    }

    // Apuro de tempo → instinto de sobrevivência
    if (myTimeRemaining !== null && myTimeRemaining < 10) {
      return Math.max(0.1, Number(gaussianRandom(0.15, 0.05).toFixed(2)));
    }

    // ===== EVAL-AWARE PACING: usar dados da eval bar se disponíveis =====
    let evalFactor = 1.0;
    if (
      lastEvalData &&
      lastEvalData.cp !== null &&
      lastEvalData.cp !== undefined
    ) {
      const absCp = Math.abs(lastEvalData.cp);
      // Posição equilibrada (|cp| < 50): humano pensa mais
      if (absCp < 50) evalFactor = 1.4;
      // Leve vantagem/desvantagem (50-150): pensa moderado
      else if (absCp < 150) evalFactor = 1.1;
      // Vantagem clara (150-400): decisão relativamente rápida
      else if (absCp < 400) evalFactor = 0.85;
      // Vantagem esmagadora (>400): joga rápido, posição decidida
      else evalFactor = 0.6;
    }
    if (
      lastEvalData &&
      lastEvalData.mate !== null &&
      lastEvalData.mate !== undefined
    ) {
      const absMate = Math.abs(lastEvalData.mate);
      // Mate encontrado: joga rápido (reflexo de vitória/desespero)
      evalFactor = absMate <= 3 ? 0.3 : 0.5;
    }

    // Meio de jogo: complexidade posicional com ruído gaussiano
    let complexity = Math.min(1.0, legalMovesCount / 35.0);
    complexity = complexity * sessionPacingProfile * evalFactor;

    const meanTime = baseDelay + complexity * (maxDelay * 0.6);
    let finalTime = gaussianRandom(meanTime, maxDelay * 0.15);
    finalTime = Math.max(baseDelay, Math.min(maxDelay, finalTime));

    return Number(finalTime.toFixed(2));
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
    '[data-test-element="game-over-play-again-button"]',
    '[data-test-element="new-game-button"]',
    '[data-test-element="play-again-button"]',
    '[data-cy="game-over-new-game-button"]',
    '[data-cy="game-over-play-again-button"]',
    '[data-cy="new-game-button"]',
    '[data-cy="play-again-button"]',
    '[data-cy="game-over-button-new-game"]',
    '[data-control-view="play-again"]',
    '.game-over-new-game-button',
    '.game-over-play-again-button',
    '.new-game-button',
    '.play-again-button',
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
    "play again",
    "jogar novamente",
    "jogar de novo",
    "nova",
    "new",
    "jogar",
    "play",
    "revanche",
    "rematch",
  ];

  function getButtonText(button) {
    return normalizeAutoQueueText(
      `${button.innerText || button.textContent || ""} ${button.getAttribute("aria-label") || ""}`,
    );
  }

  function isSafeAutoQueueButton(button) {
    if (!button || !isElementVisible(button) || button.disabled) return false;
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
    return /(^|[\s_-])(new|play|again|novo|nova|jogar|revanche|rematch)([\s_-]|$)/i.test(
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

  function clickAutoQueueTarget(target) {
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

    const clickUrl = window.location.href;
    auto_queue_fallback_timer = setTimeout(() => {
      auto_queue_fallback_timer = null;
      if (
        !auto_queue ||
        !queueTriggered ||
        window.location.href !== clickUrl ||
        !target.isConnected ||
        !isElementVisible(target)
      )
        return;
      const latestTargets = getSearchTargets();
      const latestRoot = findGameOverRoot(latestTargets);
      if (!latestRoot) return;
      const latestButton = findNewGameButton(latestTargets, latestRoot);
      if (latestButton !== target) return;
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
    if (!auto_queue) return;
    const targets = getSearchTargets();
    refreshAutoQueueGameState(targets);
    if (queueTriggered || auto_queue_pending) return;

    const root = findGameOverRoot(targets);
    if (!root) return;
    const button = findNewGameButton(targets, root);
    if (!button) return;

    auto_queue_pending = true;
    const delay = 1500 + Math.floor(Math.random() * 501);
    auto_queue_click_timer = setTimeout(() => {
      auto_queue_click_timer = null;
      auto_queue_pending = false;
      if (!auto_queue) return;
      const latestTargets = getSearchTargets();
      const latestRoot = findGameOverRoot(latestTargets);
      if (!latestRoot) return;
      const latestButton = findNewGameButton(latestTargets, latestRoot);
      const target = latestButton || (isElementVisible(button) ? button : null);
      if (!target) return;
      queueTriggered = true;
      auto_queue_completed_fen = getAutoQueueFen();
      clickAutoQueueTarget(target);
    }, delay);
  }

  function startGameOverObserver() {
    if (auto_queue_observer) auto_queue_observer.disconnect();

    auto_queue_observer = new MutationObserver(() => {
      if (!auto_queue || auto_queue_mutation_pending) return;
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
    if (!auto_queue) {
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
      userTime: 60000,
      opponentTime: 60000,
      hasClockData: false,
    };
    const clocks = Array.from(
      new Set(
        document.querySelectorAll(
          ".clock-component .clock-time-component, .clock-component .clock-time",
        ),
      ),
    )
      .map((clock) => {
        const rect =
          typeof clock.getBoundingClientRect === "function"
            ? clock.getBoundingClientRect()
            : null;
        return {
          text: clock.textContent?.trim(),
          rect,
          visible: !rect || rect.width > 0 || rect.height > 0,
        };
      })
      .filter((clock) => clock.text && clock.visible)
      .sort((a, b) => {
        if (!a.rect || !b.rect) return 0;
        return a.rect.top - b.rect.top;
      });
    if (clocks.length < 2) return fallback;
    const values = {
      userTime: clocks[clocks.length - 1].text,
      opponentTime: clocks[0].text,
      hasClockData: true,
    };
    try {
      smartPacer.parseTime(values.userTime);
      smartPacer.parseTime(values.opponentTime);
      return values;
    } catch (error) {
      return fallback;
    }
  };

  const auto_move_piece = function (
    from,
    to,
    board,
    baseDelaySeconds = 0,
    {
      expectedFen = null,
      useSmartPacing = true,
      shouldExecute = () => true,
    } = {},
  ) {
    smartPacer.cancel();
    if (!board) return null;

    const getGame = () =>
      board.game || (board.gameManager && board.gameManager.game);
    const scheduledGame = getGame();
    const findMove = (game) => {
      if (!game || typeof game.getLegalMoves !== "function") return null;
      try {
        return (
          game
            .getLegalMoves()
            .find((move) => move.from == from && move.to == to) || null
        );
      } catch (error) {
        return null;
      }
    };
    const executeMove = () => {
      const game = getGame();
      if (game !== scheduledGame || !shouldExecute()) return false;
      if (
        expectedFen !== null &&
        (typeof game.getFEN !== "function" || game.getFEN() !== expectedFen)
      ) {
        return false;
      }
      const move = findMove(game);
      if (!move || typeof game.move !== "function") return false;
      game.move({
        ...move,
        promotion: "q",
        animate: false,
        userGenerated: true,
      });
      return true;
    };

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
    if (!legalMoves.some((move) => move.from == from && move.to == to)) {
      return null;
    }

    const delaySeconds = Number(baseDelaySeconds);
    if (!Number.isFinite(delaySeconds) || delaySeconds <= 0) {
      return executeMove();
    }

    const { hasClockData, ...clockValues } = getSmartPacerClockValues();
    const scheduled = smartPacer.schedule(executeMove, {
      ...clockValues,
      baseDelayMs: delaySeconds * 1000,
      complexityMultiplier: 1,
      isForced: legalMoves.length <= 1,
    }, {
      exactDelay: !useSmartPacing || !hasClockData,
    });
    scheduled.promise.catch((error) => {
      if (error?.name !== "AbortError") log("SmartPacer erro: " + error);
    });
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
  function get_cached_game() {
    if (
      cached_game &&
      typeof cached_game.getFEN === "function" &&
      document.body.contains(cached_board)
    ) {
      return { board: cached_board, game: cached_game };
    }
    cached_board =
      $("chess-board")[0] ||
      $("wc-chess-board")[0] ||
      $(".board")[0] ||
      $(".chess-board")[0] ||
      $("[class*='board-component']")[0] ||
      $("wc-board")[0];
    cached_game = null;
    if (cached_board) {
      if (cached_board.game) cached_game = cached_board.game;
      else if (cached_board.gameManager && cached_board.gameManager.game)
        cached_game = cached_board.gameManager.game;
      else {
        const keys = Object.keys(cached_board).filter(
          (k) =>
            k.toLowerCase().includes("game") ||
            k.toLowerCase().includes("chess"),
        );
        for (const k of keys) {
          if (cached_board[k] && cached_board[k].getFEN) {
            cached_game = cached_board[k];
            break;
          }
        }
        if (!cached_game) {
          for (const k in cached_board) {
            try {
              if (
                cached_board[k] &&
                typeof cached_board[k].getFEN === "function"
              ) {
                cached_game = cached_board[k];
                break;
              }
            } catch (e) {}
          }
        }
      }
    }
    return { board: cached_board, game: cached_game };
  }

  function request_move() {
    if (!can_interval) return;

    const isPuzzleMode = gameMode === "puzzle";
    const shouldRun = isPuzzleMode ? puzzleHint || puzzleAutoMove : hint;
    if (!shouldRun) return;

    try {
      const { board, game } = get_cached_game();

      if (!board || !game) {
        return;
      }

      fen = game.getFEN();

      if (!isPuzzleMode) {
        const turn = game ? game.getTurn() : null;
        let side = game ? game.getPlayingAs() : null;

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
          $(".myhigh, .myarrow").remove();
          return;
        }
      }

      if (fen === checkfen) return;

      const puzzleElo = 3200;
      const currentElo = isPuzzleMode
        ? puzzleElo
        : autoAdjust.isEnabled()
          ? autoAdjust.getCurrentDifficulty()
          : chessBot.elo;
      const cacheKey = fen + "_" + currentElo;
      const currentCache = isPuzzleMode ? puzzleMoveCache : moveCache;
      const isAutoMove = isPuzzleMode ? puzzleAutoMove : auto_move;
      const autoMoveOptions = {
        expectedFen: fen,
        useSmartPacing: smartPacingEnabled,
        shouldExecute: () =>
          isPuzzleMode ? puzzleAutoMove : auto_move && gameMode !== "puzzle",
      };

      if (currentCache.has(cacheKey)) {
        const cached = currentCache.get(cacheKey);
        chessBot.time = computeDelayValue(game);
        if (isAutoMove) {
          $(".myhigh, .myarrow").remove();
          checkfen = fen;
          const scheduledMove = auto_move_piece(
            cached.substring(0, 2),
            cached.substring(2, 4),
            board,
            chessBot.time,
            autoMoveOptions,
          );
          if (scheduledMove === null) {
            currentCache.delete(cacheKey);
            checkfen = "";
          }
        } else {
          create_div(cached);
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

      GM_xmlhttpRequest({
        method: "POST",
        url: SERVER_URL + "/getmove",
        headers: { "Content-Type": "application/json" },
        data: JSON.stringify({
          fen: fen,
          elo: currentElo,
          time: chessBot.time,
        }),
        onload: function (resp) {
          try {
            const data = JSON.parse(resp.responseText);
            if (data && data.length > 0) {
              const move = data[0];
              log("Lance: " + move);
              if (!isPuzzleMode) cleanCache();
              currentCache.set(cacheKey, move);

              if (isAutoMove) {
                $(".myhigh, .myarrow").remove();
                auto_move_piece(
                  move.substring(0, 2),
                  move.substring(2, 4),
                  board,
                  chessBot.time,
                  autoMoveOptions,
                );
              } else {
                create_div(move);
              }
            }
          } catch (e) {
            log("Erro parse: " + e);
          }
          can_interval = true;
        },
        onerror: function (resp) {
          log("Erro request: " + (resp ? resp.status : "unknown"));
          can_interval = true;
        },
        ontimeout: function () {
          log("Timeout: servidor nao respondeu em 5s");
          can_interval = true;
        },
        timeout: 5000,
      });
    } catch (e) {
      log("Erro: " + e);
      can_interval = true;
    }
  }

  let scheduleThinkerBannerPosition = () => {};
  let scheduleThinkerWorkspaceLayout = () => {};
  let thinkerMenuNode = null;
  let thinkerBannerNode = null;
  let thinkerLauncherNode = null;
  let thinkerUiReconcileTimer = null;
  let thinkerMountTimer = null;
  let thinkerUiBound = false;
  let thinkerUiLastFailure = "";
  let thinkerUiFailureCount = 0;
  let thinkerBannerFrame = null;
  let thinkerWorkspaceFrame = null;
  let thinkerObservedBannerSidebar = null;
  let thinkerBannerResizeObserver = null;
  let thinkerBannerLayoutObserver = null;
  let thinkerResizeHandler = null;
  let thinkerUrlMonitorTimer = null;

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

  function isVisibleThinkerLayoutNode(node, { minWidth = 1, minHeight = 1 } = {}) {
    const rect = getThinkerRect(node);
    if (!rect || rect.width < minWidth || rect.height < minHeight) return false;
    if (node.hidden || node.getAttribute?.("aria-hidden") === "true") return false;
    const viewportWidth = document.documentElement?.clientWidth || window.innerWidth || Number.MAX_SAFE_INTEGER;
    const viewportHeight = window.innerHeight || document.documentElement?.clientHeight || Number.MAX_SAFE_INTEGER;
    if (rect.right <= 0 || rect.bottom <= 0 || rect.left >= viewportWidth || rect.top >= viewportHeight) return false;
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

  function isExcludedThinkerSidebarCandidate(node) {
    return Boolean(node?.closest?.(
      "nav, header, [role='navigation'], [class*='chat'], [class*='ad-'], [id*='ad-'], .ad-container, .ad-unit, #ad-sidebar, .board-layout-ad, .sky-ad, .ads-container, .chess-ad-wrapper",
    ));
  }

  function updateThinkerMountDiagnostics() {
    const message = thinkerUiLastFailure.slice(0, 240);
    const controls = [
      document.getElementById("thinker-chess-launcher"),
      document.getElementById("kb-ghost-recovery"),
    ].filter(Boolean);
    controls.forEach((control) => {
      control.dataset.mountError = message;
      const baseTitle = control.id === "thinker-chess-launcher"
        ? "Abrir Thinker Chess"
        : "Restore Thinker Chess controls";
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
    if (thinkerUrlMonitorTimer !== null) clearInterval(thinkerUrlMonitorTimer);
    thinkerUrlMonitorTimer = null;
    scheduleThinkerBannerPosition = () => {};
    scheduleThinkerWorkspaceLayout = () => {};
    thinkerUiBound = false;
    _menuReady = false;
    if (removeMenu) {
      const menu = document.getElementById("krypbot-container");
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
    ];
    const board = document.querySelector(
      "wc-chess-board, chess-board, .board, .chess-board, [class*='board-component']",
    );
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
      "aside, [class*='sidebar'], [class*='controller'], [class*='board-layout']",
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
    return closest;
  }

  function positionThinkerLauncher() {
    const launcher = document.getElementById("thinker-chess-launcher");
    if (!launcher) return;
    const size = 46;
    const edge = 14;
    const viewportWidth = document.documentElement?.clientWidth || window.innerWidth || 1024;
    const viewportHeight = window.innerHeight || document.documentElement?.clientHeight || 768;
    const board = document.querySelector(
      "wc-chess-board, chess-board, #board-single, .board, .chess-board, [class*='board-component']",
    );
    const boardRect = getThinkerRect(board);
    const sidebarRect = getThinkerRect(findThinkerSidebar());
    const bannerRect = getThinkerRect(document.getElementById("thinker-chess-banner"));
    const blockedRects = [boardRect, sidebarRect, bannerRect].filter(Boolean);
    const clampLeft = (left) => Math.max(edge, Math.min(viewportWidth - size - edge, Math.round(left)));
    const clampTop = (top) => Math.max(edge, Math.min(viewportHeight - size - edge, Math.round(top)));
    const candidates = [];
    if (sidebarRect) candidates.push({ left: sidebarRect.right + edge, top: clampTop(sidebarRect.top) });
    if (boardRect) candidates.push({ left: boardRect.right + edge, top: clampTop(boardRect.top) });
    if (sidebarRect) candidates.push({ left: sidebarRect.left - size - edge, top: clampTop(sidebarRect.top) });
    if (boardRect) candidates.push({ left: boardRect.left - size - edge, top: clampTop(boardRect.top) });
    candidates.push(
      { left: edge, top: Math.max(edge, viewportHeight - size - edge) },
      { left: Math.max(edge, viewportWidth - size - edge), top: Math.max(edge, viewportHeight - size - edge) },
      { left: edge, top: edge },
      { left: Math.max(edge, viewportWidth - size - edge), top: edge },
      { left: edge, top: Math.max(edge, Math.round((viewportHeight - size) / 2)) },
      { left: Math.max(edge, viewportWidth - size - edge), top: Math.max(edge, Math.round((viewportHeight - size) / 2)) },
    );
    for (let top = edge; top <= viewportHeight - size - edge; top += size + edge) {
      candidates.push({ left: edge, top }, { left: viewportWidth - size - edge, top });
    }
    const chosen = candidates.find((candidate) => {
      const left = clampLeft(candidate.left);
      const top = clampTop(candidate.top);
      const rect = {
        left,
        top,
        right: left + size,
        bottom: top + size,
      };
      return blockedRects.every((blocked) => !thinkerRectsOverlap(rect, blocked, 8));
    });
    if (!chosen) {
      launcher.style.display = "none";
      return;
    }
    launcher.style.display = _ghostModeActive ? "none" : "flex";
    launcher.style.left = clampLeft(chosen.left) + "px";
    launcher.style.top = clampTop(chosen.top) + "px";
    launcher.style.right = "auto";
    launcher.style.bottom = "auto";
  }

  function ensureThinkerLauncher() {
    if (!document.body) return null;
    let launcher = document.getElementById("thinker-chess-launcher");
    if (!launcher) {
      launcher = document.createElement("button");
      launcher.id = "thinker-chess-launcher";
      launcher.type = "button";
      launcher.textContent = "TC";
      launcher.style.cssText =
        "position:fixed;left:14px;bottom:14px;z-index:2147483001;width:46px;height:46px;border:1px solid rgba(0,255,136,.62);border-radius:14px;background:#11151a;color:#00ff88;font:800 13px/1 Inter,Arial,sans-serif;box-shadow:0 10px 28px rgba(0,0,0,.55),0 0 16px rgba(0,255,136,.2);cursor:pointer;display:none;align-items:center;justify-content:center;";
      launcher.addEventListener("click", () => {
        const workspace = document.getElementById("oi-wrapper") || document.getElementById("krypbot-container");
        if (!workspace) {
          if (thinkerMountTimer === null) attemptThinkerUiMount();
          return;
        }
        workspace.scrollIntoView({ behavior: "smooth", block: "start" });
        if (typeof workspace.focus === "function") workspace.focus({ preventScroll: true });
      });
      document.body.appendChild(launcher);
    }
    thinkerLauncherNode = launcher;
    launcher.style.display = _ghostModeActive ? "none" : "flex";
    positionThinkerLauncher();
    updateThinkerMountDiagnostics();
    return launcher;
  }

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
    const launcher = document.getElementById("thinker-chess-launcher");
    document.querySelectorAll(".tc-hud-stats").forEach((hud) => {
      hud.style.display = _ghostModeActive ? "none" : "inline-flex";
    });
    if (menu) menu.style.display = _ghostModeActive ? "none" : "flex";
    if (wrapper) wrapper.style.display = _ghostModeActive ? "none" : "grid";
    if (scoutPrimary) scoutPrimary.style.display = _ghostModeActive ? "none" : "";
    if (scoutSecondary) scoutSecondary.style.display = _ghostModeActive ? "none" : "flex";
    if (banner && _ghostModeActive) banner.style.display = "none";
    if (launcher) launcher.style.display = _ghostModeActive ? "none" : "flex";
    ensureGhostRecoveryControl();
    if (!_ghostModeActive) {
      ensureThinkerLauncher();
      scheduleThinkerBannerPosition();
    }
  }

  function reconcileThinkerUiShells() {
    const host = getThinkerMountHost();
    const wrapper = document.getElementById("oi-wrapper");
    let bannerRemounted = false;
    if (thinkerMenuNode && host) {
      const shell = wrapper && typeof wrapper.contains === "function" && wrapper.contains(thinkerMenuNode)
        ? wrapper
        : thinkerMenuNode;
      if (!shell.isConnected || shell.parentNode !== host) host.appendChild(shell);
    }
    if (thinkerBannerNode && !thinkerBannerNode.isConnected && document.body) {
      document.body.appendChild(thinkerBannerNode);
      bannerRemounted = true;
    }
    if (thinkerLauncherNode && !thinkerLauncherNode.isConnected && document.body) {
      document.body.appendChild(thinkerLauncherNode);
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
    ensureThinkerLauncher();
    ensureGhostRecoveryControl();
    if (bannerRemounted) scheduleThinkerBannerPosition();
  }

  function startThinkerUiReconciler() {
    if (thinkerUiReconcileTimer !== null) return;
    thinkerUiReconcileTimer = window.setInterval(reconcileThinkerUiShells, 1000);
  }

  function calculateThinkerBannerLayout(
    sidebarRect,
    viewportWidth,
    viewportHeight,
    ghostMode,
  ) {
    if (!sidebarRect || ghostMode || sidebarRect.bottom <= 0 || sidebarRect.top >= viewportHeight) return null;
    const gap = 8;
    const edge = 6;
    const width = Math.floor(viewportWidth - sidebarRect.right - gap - edge);
    const top = Math.max(edge, Math.round(sidebarRect.top));
    const bottom = Math.min(viewportHeight - edge, Math.round(sidebarRect.bottom));
    const height = Math.floor(bottom - top);
    if (width < 96 || height < 260) return null;
    return {
      left: Math.round(sidebarRect.right + gap),
      top,
      width,
      height,
    };
  }

  function calculateThinkerWorkspaceMargin(naturalDocumentTop, viewportHeight, gameplayDocumentBottom = 0) {
    const baseMargin = 30;
    const safeTop = Math.max(Math.max(0, viewportHeight) + 32, Math.max(0, gameplayDocumentBottom) + 32);
    return Math.ceil(baseMargin + Math.max(0, safeTop - naturalDocumentTop));
  }

  function positionThinkerBannerShell() {
    const banner = document.getElementById("thinker-chess-banner");
    const sidebar = findThinkerSidebar();
    if (!banner) return;
    if (!sidebar) {
      banner.style.display = "none";
      positionThinkerLauncher();
      return;
    }
    const layout = calculateThinkerBannerLayout(
      sidebar.getBoundingClientRect(),
      document.documentElement.clientWidth,
      window.innerHeight,
      _ghostModeActive,
    );
    if (!layout) {
      banner.style.display = "none";
      positionThinkerLauncher();
      return;
    }
    banner.style.left = layout.left + "px";
    banner.style.right = "auto";
    banner.style.top = layout.top + "px";
    banner.style.width = layout.width + "px";
    banner.style.height = layout.height + "px";
    banner.style.display = "flex";
    positionThinkerLauncher();
  }

  function createMenu() {
    if (thinkerUiBound) return;
    $ = $ || resolveThinkerJQuery();
    if (thinkerMountTimer !== null) return;

    const css = `
      <style id="tc-userscript-style">
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

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
          width: 60px;
          height: 60px;
          padding: 0;
          border-radius: 30px;
          cursor: pointer;
          display: flex;
          justify-content: center;
          align-items: center;
          background: rgba(0, 255, 136, 0.15);
          border-color: rgba(0, 255, 136, 0.3);
        }

        #krypbot-container.minimized:hover {
          background: rgba(0, 255, 136, 0.25);
          box-shadow: 0 0 20px rgba(0, 255, 136, 0.4);
        }

        #krypbot-container.minimized > *:not(.kb-logo) {
          display: none !important;
        }

        .kb-logo {
          display: none;
          font-size: 26px;
          font-weight: 800;
          color: #00ff88;
          text-shadow: 0 0 12px rgba(0, 255, 136, 0.6);
        }

        #krypbot-container.minimized .kb-logo {
          display: block;
        }

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
        .kb-delay-display { font-size: 13px; color: #00ff88; font-weight: 600; }

        #krypbot-container {
          width: 268px; max-width: 268px; box-sizing: border-box; margin: 0; padding: 16px;
          gap: 0; background: #111216; border: 1px solid #202228; border-radius: 20px;
          box-shadow: 0 18px 42px rgba(0,0,0,.34); backdrop-filter: none; -webkit-backdrop-filter: none;
          color: #f7f8fa; font-family: Inter, Arial, sans-serif;
        }
        #krypbot-container .kb-header {
          margin: 0 0 12px; padding: 0 0 12px; border-bottom: 1px solid #24262c;
        }
        #krypbot-container .kb-title {
          margin: 0; color: #f7f8fa; background: none; -webkit-text-fill-color: currentColor;
          font-size: 14px; line-height: 20px; font-weight: 800;
        }
        #krypbot-container .kb-minimize-btn {
          width: 20px; height: 20px; padding: 0; border-radius: 50%; background: #202126;
          color: transparent; font-size: 0; background:#202126 center/11px 11px no-repeat url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%237f8591' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='M18 6 6 18M6 6l12 12'/%3E%3C/svg%3E");
        }
        #krypbot-container .kb-section {
          min-height: 44px; margin: 0; display: flex; align-items: center; justify-content: space-between;
        }
        #krypbot-container .kb-section-label {
          display: flex; align-items: center; gap: 10px; margin: 0; color: #f4f5f7;
          font-size: 12px; line-height: 18px; font-weight: 600;
        }
        #krypbot-container .kb-row-icon {
          width: 15px; height: 15px; display: inline-block; flex: 0 0 15px; background-position:center; background-repeat:no-repeat; background-size:14px 14px;
        }
        #krypbot-container .kb-icon-power { background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23858b97' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10'/%3E%3C/svg%3E") }
        #krypbot-container .kb-icon-play { background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23858b97' stroke-width='2' stroke-linejoin='round'%3E%3Cpath d='m5 3 14 9-14 9z'/%3E%3C/svg%3E") }
        #krypbot-container .kb-icon-list { background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23858b97' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01'/%3E%3C/svg%3E") }
        #krypbot-container .kb-icon-gauge { background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23858b97' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='M20 13a8 8 0 1 0-16 0M12 13l4-4M4 19h16'/%3E%3C/svg%3E") }
        #krypbot-container .kb-icon-activity { background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23858b97' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 12h4l2-7 4 14 2-7h6'/%3E%3C/svg%3E") }
        #krypbot-container .kb-icon-eye { background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23858b97' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z'/%3E%3Ccircle cx='12' cy='12' r='3'/%3E%3C/svg%3E") }
        #krypbot-container .kb-radio-group:not(:has(input[name="delayMode"])) {
          position: relative; width: 34px; height: 20px; padding: 0; border: 0; border-radius: 999px;
          background: #2a2c31; overflow: hidden;
        }
        #krypbot-container .kb-radio-group:not(:has(input[name="delayMode"]))::after {
          content: ""; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px;
          border-radius: 50%; background: #f5f6f7; box-shadow: 0 1px 3px rgba(0,0,0,.35);
          transition: transform .16s ease; pointer-events: none;
        }
        #krypbot-container .kb-radio-group:not(:has(input[name="delayMode"])):has(input[value="1"]:checked) {
          background: #2ad36f;
        }
        #krypbot-container .kb-radio-group:not(:has(input[name="delayMode"])):has(input[value="1"]:checked)::after {
          transform: translateX(14px);
        }
        #krypbot-container .kb-radio-group:not(:has(input[name="delayMode"])) label {
          position: relative; z-index: 2; width: 17px; height: 20px; padding: 0; margin: 0;
          border-radius: 0; background: transparent !important; box-shadow: none !important;
          color: transparent !important; font-size: 0;
        }
        #krypbot-container .kb-section-col {
          margin: 0; padding: 11px 0; gap: 8px; border-top: 1px solid #24262c;
        }
        #krypbot-container .kb-slider-group { gap: 8px; }
        #krypbot-container .kb-slider { height: 3px; accent-color: #28d875; }
        #krypbot-container .kb-slider-val { color: #24df75; font-size: 11px; }
        #krypbot-container .kb-num-input {
          width: 52px; height: 27px; box-sizing: border-box; padding: 4px 7px; border: 1px solid #303238;
          border-radius: 7px; background: #1a1b20; color: #fff; font-size: 11px; font-weight: 700;
          appearance: textfield; -moz-appearance: textfield;
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
        #krypbot-container .kb-delay-display { display: none; }
        #krypbot-container .kb-footer {
          margin: 0; padding: 11px 0 0; border-top: 1px solid #24262c;
        }
        #krypbot-container .kb-footer > div { width: 100%; justify-content: space-between; }
        #krypbot-container .kb-color-input {
          width: 19px; height: 19px; border: 0; border-radius: 6px; padding: 0; overflow: hidden;
        }
      </style>
    `;

    const menuHtml = `
      <div id="krypbot-container">
        <div class="kb-logo">K</div>

        <div class="kb-header">
          <h2 class="kb-title">Thinker Chess</h2>
          <button class="kb-minimize-btn" id="kb-minimize-toggle">
            Fechar
          </button>
        </div>

        <div class="kb-section">
          <p class="kb-section-label"><span class="kb-row-icon kb-icon-power" aria-hidden="true"></span>Bot</p>
          <div class="kb-radio-group">
            <input type="radio" id="st-on" name="kb-bot-status" value="1"><label for="st-on">ON</label>
            <input type="radio" id="st-off" name="kb-bot-status" value="0" checked><label for="st-off">OFF</label>
          </div>
        </div>

        <div class="kb-section">
          <p class="kb-section-label"><span class="kb-row-icon kb-icon-play" aria-hidden="true"></span>Auto Moves</p>
          <div class="kb-radio-group">
            <input type="radio" id="am-on" name="kb-auto-move" value="1"><label for="am-on">ON</label>
            <input type="radio" id="am-off" name="kb-auto-move" value="0" checked><label for="am-off">OFF</label>
          </div>
        </div>

        <div class="kb-section">
          <p class="kb-section-label"><span class="kb-row-icon kb-icon-list" aria-hidden="true"></span>Auto Queue</p>
          <div class="kb-radio-group">
            <input type="radio" id="aq-on" name="kb-auto-queue" value="1"><label for="aq-on">ON</label>
            <input type="radio" id="aq-off" name="kb-auto-queue" value="0" checked><label for="aq-off">OFF</label>
          </div>
        </div>

        <div class="kb-section">
          <p class="kb-section-label"><span class="kb-row-icon kb-icon-gauge" aria-hidden="true"></span>Auto Rating</p>
          <div class="kb-radio-group">
            <input type="radio" id="aa-on" name="kb-auto-adjust" value="1"><label for="aa-on">ON</label>
            <input type="radio" id="aa-off" name="kb-auto-adjust" value="0" checked><label for="aa-off">OFF</label>
          </div>
        </div>

        <div class="kb-section">
          <p class="kb-section-label"><span class="kb-row-icon kb-icon-activity" aria-hidden="true"></span>Smart Pacing</p>
          <div class="kb-radio-group">
            <input type="radio" id="sp-on" name="kb-smart-pacing" value="1"><label for="sp-on">ON</label>
            <input type="radio" id="sp-off" name="kb-smart-pacing" value="0" checked><label for="sp-off">OFF</label>
          </div>
        </div>

        <div class="kb-section">
          <p class="kb-section-label"><span class="kb-row-icon kb-icon-eye" aria-hidden="true"></span>Eval Bar</p>
          <div class="kb-radio-group">
            <input type="radio" id="eb-on" name="kb-eval-bar" value="1"><label for="eb-on">ON</label>
            <input type="radio" id="eb-off" name="kb-eval-bar" value="0" checked><label for="eb-off">OFF</label>
          </div>
        </div>

        <div class="kb-section-col" id="puzzle-section" style="display: none;">
          <p class="kb-section-label">Puzzle Mode <span style="font-size:11px; color:rgba(255,255,255,0.4); font-weight:normal;">(Elo 3200)</span></p>
          <div class="kb-section" style="margin:0">
            <p style="font-size:12px; margin:0; color:rgba(255,255,255,0.6)">Hint Lines</p>
            <div class="kb-radio-group">
              <input type="radio" id="ph-on" name="kb-puzzle-hint" value="1"><label for="ph-on">ON</label>
              <input type="radio" id="ph-off" name="kb-puzzle-hint" value="0" checked><label for="ph-off">OFF</label>
            </div>
          </div>
          <div class="kb-section" style="margin:0">
            <p style="font-size:12px; margin:0; color:rgba(255,255,255,0.6)">Auto Solve</p>
            <div class="kb-radio-group">
              <input type="radio" id="pa-on" name="kb-puzzle-auto" value="1"><label for="pa-on">ON</label>
              <input type="radio" id="pa-off" name="kb-puzzle-auto" value="0" checked><label for="pa-off">OFF</label>
            </div>
          </div>
        </div>

        <div class="kb-section-col">
          <p class="kb-section-label" style="color:#8e94a1;font-size:10px">Elo Level</p>
          <div class="kb-slider-group">
            <span style="font-size:11px; color:rgba(255,255,255,0.4)">800</span>
            <input id="kb-elo-slider" class="kb-slider" type="range" min="800" max="3200" step="100" value="3200">
            <span id="kb-elo-val" class="kb-slider-val">3200</span>
          </div>
        </div>

        <div class="kb-section-col" id="auto-delay-section">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <p class="kb-section-label" style="color:#8e94a1;font-size:10px">Run Delay</p>
            <span id="autoDelayDisplay" class="kb-delay-display">0.50 - 2.00s</span>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
            <div style="display:flex; gap:8px; align-items:center;">
              <input type="number" id="minDelayInput" class="kb-num-input" min="0.01" step="0.01">
              <span style="color:rgba(255,255,255,0.4); font-size:11px">to</span>
              <input type="number" id="maxDelayInput" class="kb-num-input" min="0.01" step="0.01">
            </div>
            <div class="kb-radio-group">
              <input type="radio" id="dm-rand" name="delayMode" value="random"><label for="dm-rand">RND</label>
              <input type="radio" id="dm-max" name="delayMode" value="max"><label for="dm-max">INST</label>
            </div>
          </div>
        </div>

        <div class="kb-footer">
          <div style="display:flex; align-items:center; gap:10px;">
            <span style="font-size:10px; color:#8e94a1;">Theme</span>
            <input type="color" id="kb-color-picker" class="kb-color-input" value="#00ff88">
          </div>
        </div>
      </div>


    `;

    const bannerHtml = `
      <!-- Thinker Chess Banner -->
      <div id="thinker-chess-banner" style="position:fixed;left:-9999px;top:0;z-index:2147483000;pointer-events:none;display:none;align-items:stretch;justify-content:center;overflow:hidden;background:#0b0d10;border:1px solid rgba(255,255,255,.06);border-radius:12px;box-shadow:0 18px 48px rgba(0,0,0,.48);box-sizing:border-box;">
        <img src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/4QA6RXhpZgAATU0AKgAAAAgAA1EQAAEAAAABAQAAAFERAAQAAAABAAAAAFESAAQAAAABAAAAAAAAAAD/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCAV6BGIDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD44GKWk70GgBaPaijFAAAKUUUUAHtRRRQAtBpOaOaAFo4pD1o9qAFopKAOaAFoFFFAC0dqKDQACg4oooAT+VLRSYoAWkzS0UAHajNFFMA60oxSdqBQAo96XNIOtL3pCEpcUd6O9ABRRRQMM0vekooAU0e1IKXHpTAO9FFApAAooFFACjBpe9JS0AFFFFMBc0cd6BS4oASijmjvQACloooEIaUUUCgYtLSCloAKO/NFKBQACnUnSloEFFFApgApRRRQAtLSUooAKUUDrS0AJS0lHSgApc4oooAKBmigUAApwoFKKAAUooFLQAClpMUuKACgcUY70UAKKcKYM5p46UAKKWkpRQACl70nvS0AFOFIKUcUALS0g9aUUAFLRQKAFFFFFACgU6kWl70AH1paABSigBeKcKQD0pQKADtRRS0AFL2oFLj0oAXtRQBxS0ABzSiilxQACnim9KcKBDhQTzSClpjAUo6UClFIQCnUmKdimMKO9LiigAopcUYoQBS9aAKUCgQDNLjmlxQBQAfWl60uKBQAmKcKKXHFAxKUUUAGkAo5FLQKXFMQmKKXFAFAwFLS96MZoAWigcClxQA38aKdtopAeX0hpetFSMBSikpaACil70UAJRRRmgAPFHWiigAopaWgBKKU0lAC0UdaM0AHakpaOtAB2oo70d6ADFFLQKAEpaDRQACg0UtACCl46UgpaADvRS0UAFHekpaAEpe3NFHpQAfWg0d/eigA6Gl96Sl70AFFL2ooAaRS0UUwFFFA6UtIApKXvRTABTqQUo9KBBSUvNA60AJigUuOaKBhRil4ooAKKKWgQUUUtAAKUUgpwFAAKWiigA70tFLTAQUUuKB7UAFHeiloASlopegoASlAoHrSigBBS8UoooABRSiigAxSigUoFABS0Uo60AJS4oxR2oABxSigUtAB2pRQOlKKAEoFOxQKAAU4dKaKcKAF6UvUUUDNAhcUAUCnCgYmPSjpS0uKAACloHXNKOtABThSAe9OAoAUClFIKcKADFAFKKUCgBKUClApaAEIpRQKXFAhMUopQKBQMAKUUU4UAKKKUetHamAgzThSCnigQgHNOxQKXpQMO1ApTRSAXFGKUClxTAO1KBSilxQAgpcUtLjHNACEcUU6gCgQlGOadRigBDRS49aMUDACnUgFOoASjpS0GgAHWlA4oFOGKAEIpcUuKDQA3miq7XtuGI3jg0UgPNu1FLRUjCg9aDRQAopO9ApaACiijvQAUUdKKAFFHekpTQAGg0daKAEoNFLimAdqMUUtIBMUUtFAgooxRQMWkoxxS9qYCUUtJSAKUUUUAFLSUopgFHAoopALSUtFABSUtJigAo70tAoABS96SlFMAo70oooEApcUCgUDCiiigQUopKUUAGKWiigAoFFFAB3pe9JS0AAFLQKBQAUCjFLQAClFAoFAC0oo7UtAAKKKBTAO9KKQdKWgAxQaM4paACigUtAAKO9FFADh1paQUooASloxS0AApaQCnUAA9KUUlLQAUUuOKWgBB1pQKBS0AAFOAoApQKAEop1FADacKAOc07FACClopaAAU4daSlFABSiilFACj0NKBQKUUAFKKMU4DmgBAKcKBS4pgApRRijFIBRS5pBSigAFKKBSgUwFoxSiigAxS0nNKKQCgYpe9ApQKYAKXNApQKAFxSnmj3paQBRilpRTABSgUCnUAAFOFAFLjmgBKWlAo70CDFLjmgU4CgBuKWg0tABikxTgKMUDEpfaj3paAEopaUCgAFOAopw6UAAHFZmr3W0G3iPzH75Hb2qxqV2LdNiH96w4/wBketYhJ5JOSaAE/wA9aKKKBHI0GgUVBQUUUtACUtAooAKKWkoAWjpQKKADpR2oo70AA4oNFHvQAUtJiloAKKKKACil7UlMAoopRQAntS0UUCDvS0lFIYtJS0UwEpaKKAFooooAKKKOpoEAopcUe1AB3oooxxigYUtApfWgBKWiimIKWgelFIA60lLR3oABQODRS+9AC0UCigA70ClHWigYdqB1paB1oEAoxRS0wDFIKWloASlopRSAKUUYopgFKKBQBQAUtFFABRRS4oAPcUtAooAMU4CgUoGKACilFFAAKXFA6Uo6UAJiil60CgApw6UmO1OA4oASloApe1AABSjmjFOFAABS4pRRQAgGKWloFAAB6UClH5UtABQBSijFMBKBS4pQKQCgUYx0pQKBQAU8UgFLQAopQKBSjpQAtHalFLQAlHvS496KYAPWgClpwHSkAnSnCgD2pcUxAKKWj0oASlFGKcBQAAetOFFKKBgBS0UoFAAKUUoFLigQlKBmlApwoGIPanYFGOaKAFFKKMUooABS0gp1ACU4dKKBQAmKXFL70UAApaB1ooAQ0UuKAOaBABTgBSgU8LQMaBUN7cLbRbjyx4UepqaeRIIjJIcKP19q5+6ne4mMjnHoPQUARyO0jl3O5ick0w0poNAhOaKWigDkKKKKgoD1paSloAKO1FFAAKUUUUAFBo70tMBMUUtFIAHSjtR2ooAKKU9KTtQIKUY9KbSimMXFFAopCFpKWgUAJRS4opjEPvS0UDrQAtJilApR0oASijtR7UgCg0vakHWmAUtGKKACiiigA6UtFFAgpQPeiigApaMUCgApaKXtQAgpe1FFACAUtFFAB0oFLQKAA0ooxRQMPwpaO1FMQUtA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rs3U3GRGv3R/Wp9WvPOYwxH92p5P94/4VnGgQhFJjmlNGKYCdKXFBpPegApKWkoAD0ooNFABiil/CigLHG0CgUZqChe1LSUtIAooooEFFFBoGH1opaO9MAoopaQBRRR0oAWjFFFMAooFFIQtApKWgYUUUtMAooo5oAKM0UY4oAKBQRSgUCCilxRQAdqKKKYBR160tAoAQil6UUUAKKWkpaADFFFLQAUUoxRSASijvSimAUUYoFACilpBS0AL2ooxRQAYopaBQAmKWijHNABilxSijFACCloApR1oAKMUtKKAAcUUYpaYgFKaAKWgBKUUClWgApRQKWgAFLR9KUetAxMUv4UUtACUooApQKBB36Uo96KUUAHeloA5pQKAClxQKX60AFA6UoFA60DFxRRS4oEKtOHSminCgAo6UvWlxQAAUtAoxQMKWjFLj1oASnCkApR9KAHClWkFOWgQoopVFOAoGIBS0uKXHtQIFpRQKUD2oGKOaWlUd6XFAhAKcBRilx6UAGKUgUopcc0ANxilUUuKUCgYY5oANLilAoAKeKQClAoELiloxS4oGJSikxSgUAKBxS4pccUYoAKWjFOAoATFKBS4pQKAALTgKXtRQAYpQOaXGaXFACj1rN1a8Cg28R56OR29qm1O7+zp5cZ/esP++R61hEknnJNACNTTSmkNMQh9KKU0lABQRRRQAlGKWkoAKTpSmkoAcOlFJmigDjaUUYpazKEpaKKBBRSUCmMWlHWkHWlpCFoxRRQMKKKKYBS4oooEFFLSd6QAKD1oPWloGBopKWmAtFFFACiiil7UCExRRS0AJjilFHaimAUd6KUCgBB1paB1paAEoopQKAAUd6KKAFooxRQAUo4pKWgBaBSCnCgBKXFFGKACjtRSigApRSUUAOFFIKWgAx2oxS0UAFFLjvQKAFFAoFKKADrzRigUtACUooxS0AA5paQUtMBaUdKQUtABQKKKAFHSlFIPpSigBRTh06UlLQAAUuKQUtAgxSgUUtABS4o7UooGKBRQOKWgQUtJSigYuKAKUUAcUAH4UoopaAFApQPagfSlFAC4oopRQAAUuKKMUALijFApQOcUAHalAo49KX0oASnKKKUUAOHAp4FNFOHNAC0oFGKUUAAFOWilUUAKOtAoApaBC0oFIKeKAAUtFKKAAClxx70DpS4xQMAOaUCgCnAUCEApwHNKBS0DEAoxSgUuPwoENxTgMUoFKPwoGGKXHrSgZp2O9ADQKUDFOxzRQA3FOFAFOAwKAEoA5p2OaUD2oAUDjOahv7lbWHccFz9xfX/61PnmjghaSQ4UdvU+lc9dTvcTGWQ8noOwHpQIZK7SOzuxZick1H3paOlMBDSYpTSUABooo70AJ2opaO9ACUlKaQ0AFJQaO9AC8+lFJmigDkKKKWsxiUUGigYdaMUYpRTAMUUUUgFxRRRTAKX3oooEAoopRSAKKKKYBiiiigYUtAooACKWjtQaBBRmiimAvak70v1oPSgA7UUUYoAUUUUUAFL2oo5oAMUo60dKKADFHelooAKBzRRQAd8UucUUCgBaO1JS9qAAUtAooAMUUUY4oAKUUYpBQA4ClpKXFABSigdaB1oAWiilBoABRRS0AHajtRRigAFLQBRTABSikHFOHWgBcGilFH0oEJinUD0pQOaADFFLRigYopRikpQKAAdaKKUCgAFOHFJS0AA60dDQKUUCFFLSUo60AKKcOlItOoASloooGAFOxQKcBxQAgp2KBQOtACgUoFApQKAEFKKKXFAgFOApAKdQAAUuKAKXHFAxKUZpQKMUAAqQU0DtTwKAFpRTRmngcUAKBTgKQDoaUfpQIXFA6UDpSgUDFApQKAKcKAACl60lPoAAOaO9KKUCgAUcdKdRQKBCgGlwaUClFAxAKXFKOOlFAgxS4pcc0YoGAFOA4oApQKAAelGKBTwOaBCAUuKcBR3oGIo55pZCqKXdgqjkk9qXpzWJqt757+VGf3Snr/ePr9KAIdQu2ups8iNfur/WqtO4opiExxSGnGkNADcUmKU0UAJSYpT0ooAKDRiimAhpvOacaQ0gENJilNJQAYopaKAOPNFFLUFCUo96SigBcUDrRRSAKWiimAUUUtAgpaSl60gCgUUUwDvRijvQKAQUtFJQMWlpKWi4goopRQAlLijrS0AJQaKKYAAaWijFAC80lLQKAClFFHagAoFHtQKAFooooAXvR7UYpKAFzQKBS0AApcUUDNABS/WiigA70UGigAo70oooAKUUlKKAFFGKO9KKAAUClFJigBRS9qQUo60xCiiig0ALxQKSlHNABSjrRSjigYopcUCgCgBRSige9KKACiigdaAA0vailoEApcUClFACUoo6mlA4oGGOKUCgUtABQKMUtAhRTqQU4CgYUAUtKBQAAUooApRQACigU6gAHSloHSlFABilFAFKBQIUUoFA6U4UAJTsUYpaAEpQKMUooGKopwHtSAYp1AABTgKBSgUAKPelAoFOXpigQmKcBS4pQMUDEFOoxSgUAApwFAFKKBAOtLS0Y9aBigUoFABp2Mc0AAFLR70oFAgFLjmlUetOC0DExS4pQKdigQwcUopTSigYmKcOKAKWgBcUuPahap6re+QnlRH96w5P90f40AV9YvAAbaI89HI/lWSfQUp9abTEOxxR0o7Uh9aAEoxS0lMBD0pKKKQBR2oFHemAUhoNJSADSUUpoAQ00049KaaYBRRj2ooA5AUuKSisihaDS4NIaBBS0lFAwpRSUDrTAXmloopAFL7Un1pR0oAKKKKYhaKQ0tAw96D60ufSg0AAoo7UCgQUtFKPemDA9KKKKQBQKKXFABRRS0AJijFLRTAOlFAo7mgAxSik5paAF96KMc0UAFFLSUALQKKMUAKKKKXHNACdKUUlL0oAUUCkxS0AA60UUc0AKB+VLjnij2oFAC0tJS0AApaBQBTAMUo96O1AoAUUtNAp1ACUtHaigQvelFIBinUAKKUCkpcUAHeloooGFKOtJ0paBBSiloHFAwFL9KKUCgBKXvRilFAhe1KOlHWl+lAwFLjmjFKKAACnAUKKUCgAFKOlGKKAFpe1IKUdaBC+lKKQUooAUUopPenCgApaQU4ZoGLTgOKaOKcPegQtLQPWlxQAClUUAU7FAwxzSigc0tACgU4Ugp680ALilUc0U4UAGKMUopaAEpyjtQBzSigBRQOtKKO9AC44oApcZpR1oAAKcKUClwelACYpaXGKXFACd808Gm04daAFopaBk0CFAJpccULTsUDEAp22jFNuZo7aEyyHgdB6n0oERahcraRbuC7cKv8AX6Vz0js7l3JLE5JNSXUz3EzSyHk9PYelQkUABpKUcUUwDtSUHiimAGkNL2pGNAhpooNJQMWjNJk0meaQCnrSHNLSUwCkpe/NJ70CA009acaaaBi/hRSUUCOQpRikFLWRYUUUUALQaTpS0wExnmlFJS0CFAooHNFIYtJS9qQ0wFoozRQAUtJS0AFLSUUCFpRSUCgBaXFAopgHSjvS59qTvQAoNFJzS0AFLSUUALRRRQAClo/GigA70UUUAHFOApBS0AA60uKBR1NABSYpaUUAJS0UUAFApfeloASijmjtQAtApBTulABQMUUtACiigUtMApaQfSgUAL2pR60lKKACl7UCjvQIKMUuKUCgYAUoooFAhwoFJSrQA4UUmec0tABiloo4xQMUc0YoBpRQAo6Yo/nQM0tABSigc0ooELRRS0DFFH8qBSigBR2pwpB706gBMelLRSigQlKKBSigYvagAUUo60AOFKKQGnCgA60oGKBS0AHanLSU4YoAUe9LxSDrThQAoHFKKKWgAHFKMUdqcBgUAC9ad3po9qeOlACrThSDrTh0oAPelFA9acBQAUo4oFHegBR0paSlHNADhTsUi4xzTxQACl5NIKUUALTgBQOadjmgBAKUilox60CEAp2OM0dDTgKBiDrT16UmKdQAMVjjZ5GCooyT6VzuoXbXU27kIOEX0H+NT6re/aG8qNv3Sn/vo+tUKYgo7UYooASk7UppMUwEopTTTQIWkNFIaAEPpSUppDzQAmeaKMUUDFopKDQIDSE0ho7UDCkPSiigQUUUUAch2paSlzWRYUUdqKACiiimAtAoFLQISloopAAoopaYxKWigdaAFoooNAhKKKKAFpRQKUUAL2pRSUGmAUCk70tABS9KQc0tABRRQKQC0Cgc0tMAo7UUuKQCYoxS0d6YBS0dqKADNLSUvegApaSjvQA6kNApaAClpKKADtR2paSgAFLmkFLQAtKKQdKXvQAvegUZoFACigelA60tMQUoo7UDrQMWgUUooEGKdSUooGFHeiloAKWijtQIWlzSClFAC0UhpR1oAUClBoAooGLRRSigBRSikFKOaAFBoo70CgQtOFIKcB3oGLS5pKWgQClFJSigY4UUD0oxxQIWlFIKcBQMUUo60ClUetAhwp1NFOHWgAApwpO9KKBiinDpSL1pwFAB2pVFGKUUALTgB2pBThxQAgpwoxThmgQo6daWkFPUUDAZ6U4CgdKcBQAlBo6Ud6BCd6eKSnAccUDFpRQKUCgBRmnDpmkFPoABinDpSClHXigBRTgOlAHrS96BCU5RzRjNOA5oAco9aytZvOttEeP+WhH8qn1W9+zp5UZ/esOT/dH+NYZNMBDQOlL3pOlAAaSlpM0AJmkNKetIaYhM0hNBpO9ABQaWkIoAQ0lLSUDCkoP1pKAFooFBoEIaaaU0hoAQ0maO9BoAWikzRQBydJS0VkUFLSUtAxKWgdKKYBS0lFIQtFFFAwoNFHemAfWloooELRQKKBhSgUCigQUvekpaYC0UUUAHaijvS0AFFL2xRQAlL2oo70ALRRRSAO9LSUtMApaSlFAC0lLRQAlLRRQAvajikFKKAFFFIPSloAO1L2o7c0UAIaWiigAFA96KXtQAopaTtSigBOhpR1o70opgApRSd6cO1AAOnNLRRmgQClpB2pRQAvenUgpR0oAWik7UuTQMO1KBQOtKKBABS0UUAJSiigdaAHA0tItO70DAUooFAoEKKUUClFAwHWlxQKcOaAEAp1ApR0oEFFKKXFACAUooApcUAApQKAOacKADFL2opRQALThSU4dqAFoHWjiloAUU8CmCnrQAo4pQKB1p2KAAfSlopRQAopwpoFPoGAp2OKQD2pwoAFHNOXrgUopVAzQAopRQtLigQHrSYp1LigBoHFOApQPWnAcUDADilApQOKXHAoABRSgE0oWgBV5p4FIPSnD3oAXtS4zQvtTgKBAoqG+ultYd3BdvuD+v0qW4mjt4TJIeB0HqfSudup5LiZpJDyeg9B6UARSMzuzsSzE5JPem0poPFMAFI3WiimAlIacaaaBAaac0vNBoAaaKU0hoAKQ9eaXNJmgBDTTTj1pD1pDE9qSlNJTEHtRSUlAC02lNJQAhoNBooASilooA5MUUmOaWsixaKKKAD6UtJS0CE4oooPWgYd6WkpcUwFpaBR7UAGKKBS9KBCdqWjtRQAopDRS0wAUtJS0AFFFFIAHWl60g60tMApaKOtIYtAoopiClpOKU+lACe1KKSlFABS0CloAQ0tFFABQKUUd6AFpKWigBKUe9JRQA6igUUAFL0pBS0AApaKBQAo55pcUCl5piEpRSUtAAKBRilFAxfSg9aBRQIB1pR6UlKtAxy0vtSClJoEJzQOtGaUUDHd6BSUooELmlpPelHrQAtHelFJQAq08U0UtACigUCnCgYAUtFLigQCnCminCgYopRSCnCgQYpwpBSigBaKKUUAKBSigUoFAC4oFFKBQAClAoFOwKAAUooA4pQKAAGnLz1oApQKAFWn9qQUooAMUoFFKtADhzTwOaatOFACgU6k9qUdKAFFOXrmkApyigYq80/FIBingetAhoFKBTh1pQKAEApR2opy0AKBS44pQKdigBoFKKWjpQMAaX2pVFLjmgByClkZY0LuwVVGSTSoOOtYmq3v2h/LjP7pT/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opDQAUhoNJQAGkNL3pDQAlGaOaO1ACGijNFACc5qOaQIMD7x6U6VxGuTyewqmzFmJPJNIAyfWikooGZGKWkpazGFFLikoAWkoopjCgUUDrQA7NFGKKBBS96T6Uo60ALQc0d6KYBS0UYoAKBRiloAKUUlLQAtGKKWgBKKWgigAFLRRQAUvaig0AHtS0lFAhaOlApe9MBB1oFJTh70AAowKWlFACD0pRiiigBaBR2ooAUUUZoHWgYoopBS0AKKWgUUCFFKKaKUUAL3oo6migAzSikpRQAYp3akpKAF9qcKaOacKAFo5pKUUAFHel6UgoAUUopBSigBaWgUtACUo60lO6UAKKcBTRT1oGAHrSiilFAgA5p4pBSigBaUdaSlAoAU0tJ70ooAcKfTBTxQAvWlFIKd2oAUUopKUUAOpR6U0U5aAF704cUgpe9ACin0gpwFAAKXFIKctMAA9acKB+tLigBwHHNOHSmj0paAHCnCkXmnDpQADtzTlH500GnD2oAk59KUU0UoHNADlHrTxTByeabdTrBFvOCeij1NADL+6FvHhMGVunt71jZOSTyT1J706R2kdnc5Y8mo+lMQ7PFBpBR3oATFANBFHfNAB1pTSDrS0AFITQTxSUAFBNFJmgBaSiigApDQelJQA2gUppKAF6Ck70ZozQAn0oo70negBDSZpTSUABpppaQ0AJRSmkoAQmkoPFIaAD2ooooAQ0GiigAprMFBJPFKcAHJqpPIXbj7o6UANlfexY/gKYaDzRSGHFFJiigDJpaQGisyhwoNJS+1MQlL3pKWgYUtJSigQUUp4pPemAtAoFL70AHaiijpQAopaSloAO1AopaAAUAUUGgBRQDzSUooAWlpKWgApTSZo70CFFFFFABRS0UAAo7UtJTAMc0o60UAUAKOKWkpaACgUCloABS9aBRQAlA9aWjFAwFO96QU4UCD0ooooAB0pRSUtAC5ooFFABR7UUuKADIoo60CgYopRSCnDrQIBSik+lOHagAzRQOtFABSjFJSgc0APFFApe1ACUvegCgUAKKeBimilFADhThTRSjpQA4UvNNHSnCgBRTu1NHSnCgAFKKSlFADhThTRTloAcKdTaUdKAHClFIKWgBRThSClHWgB4pcfnR0pRTAVaXNApQKAAUooApRzQA5fWndqaKcKAClFAFKKAHLTveminUAAp4601RTwKAHqMinAelC5p2QqkkgAck0gGSOkUZdzgCsa5maeUu3ToB6CpL66NxJxxGv3R6+9VhTAWkx3pe9JTEFGaToaTI6UALQaO9LQAlLSd/agmgAOKSg0UAFJRSZoAWkJopKAA0maKTpQA6mmlzimnpQAGkoNJQAtIaKDQAlJR24pDQAE9qDSGkzQAE0E0hpM0AKTSetFJmgANIKKTtQAtLTe1Q3EmMop5PWgBtxLuO1fujr71BS0lIYUUhooAWikooAyetLiiioGFLRRQAd6O9J3ooGOFHvRRigQUUuKQe9MBaWkFKKAFpBRS0AFLSUd6AFFLQKKACiiigApaKKACloAooAWgUlLQIKUdKTNA60DHe1Hekpe/WmIKXtSd6WgA/ClpBSigANFFFACil7Ugp1AwooooEL2oFFAoGKKXtSGigQtJS0UAA9KWkpRQAvaiilHSgAFLSUUAFA60tFAC9KUUgpRQAtKKQdaAfagBw60d6KOlAABzTqSndqAClFA60tABigDvQKUUAFKKKO9ADhSikFOFABThTacuaAFFOHpSClFAABTh0oFOFAAKeo4pgp46UAKBmlFIBTgKAAClFApRTAUU4DikWnUgFFOXtTB1p4pgLTxTBzTh060AOxSikHWnAZoAMGnjpSCnUAKKKBQeaBCilBpAKAOaBki09eT701BTwMHpQBIgzWZqV15jGGM/IDyf7xqXUrraphjPzH7xHYelZgoAWk7UtHSmIKKSg0AIaOtB4oHWgBaKBRn3oAKDRSGgA7Uhpe1IaAENBoNJQAUnXpS0hoADTc0tIeaAAH1pO1FFABRRR9KAE70Gg9KQ0AIe9IaDTTQAUh9KU0hoAQ8UntSmmmgBaSiigBOaKDmmSv5a5/KgBJ5NgwOpqqfWhiWJJOSab3pDFzSZopKAFFJ3xRQTQAUUlFAGZiilorMoBQaM0UwClpKXvQIKBQPWgUwFopRSUAFLSUvU5oAXFFFLQAlA60UUAO+lHagCigAoFFLxQAClpKUUAFFAooAKWjtRQAlOpKUUxBSikpR60DClxmiigQUvak5paACgUUtAAKcKQUYoAWjvRQaACl9qQdKUUAKKKKUUDAUUCjvQIKXrSUuaAFpaSloAKO9FFAC0c0o6UUAKKUUgpfpQAUooooAUUUCloABS0gpQKAFFOpopaAAU4dKaKUUAOFHekpwxmgBwpRTRTh1oAUdacBSCnUAFKKKBQA5acKaODThQAopwpopR70APFKKQGnUAA60vWkpy0AKKdmkxS0wFHBpRScU4UAOHWlFIOlKOaAHDinqKYKcKAHigevrSCloAcOlOUZpop45xTEAApQuaP0py0hj1HHSq97ceQm1eXPT296fcTrBFubknoPWsh3Z3Luck9aEAEk9eT60g6UUopiCikJpM0AKaKQmkzQAGijvSCgBaUc80maM0ALSUUhoAWkJpM0lAC0mcUopKAFNJ+FJ3ooADTTS0lABRR2pDQAtB6cUlBNACU00vWkPFAAaaaU0w0ALSUfSkoAD1pDSmkoAKKO1BIHJ7UANdgq5PSqcjF23H8vSnTyF2/2R0qM0hoDSGikJoAM0lHekNAC0hNJRQAtFJ+NFAGfRiiioKEPtSikpaAFoxRRQIXtRxSUooABS80lLTAD1pe1IKU0AKKKSloATFKBRg5paACiik7UAKKXFIaUUAFGaKDQIXtRQKWgYUd6KWgQnal7UnelpgFKKSl/CgBaMUUfhQAveijvRQMKUUA0UALS0lAxQIWgUnvS0AFLRQKAFFKPrSCigBaBRQKAClFIOtLQAtApKUUAKBSikFLQAtKBSdqWgBRRRRQAo60tNFLQAtAoH0pRQAU4UlLQAdKUcUlKKAFpaQUtAAKcKQUooAcKVRSCnCgBw6UtNFOzQAopRQPeigBRxQPWkpRQA8c0opo4paAHj6U6mrThTAUU4daQUopAKKUUlKKYDvanD6U0U4UAOApVpFp30oAd2oFNzSigBw9KeBz600U4cUAPFOFNHNOFADqSV1iQuxwB+tGQqkkgAck1l3dyZ5OOEH3R/WgBs8rzPvb8B6CmCkFKDTELmikpBQAtFFGeaYCGkoOc0gpAOpCaQmgmgANGeaSigB1FJRQAGk70pFIaACkzQaSgAoNFB5xxQAUlBooAO1JmikNABSGijtQAZpDRmkNACGk/ClppoATvRQaSgBTSUUGgAqrcS7jtXp/On3MmBsXr3qtQAZpKU0nWkMSil70hoEJikNLSE0hiGiijtQAUUZooAz+lJRQKkoWijNLQISloooAKWkpaYBilpB0pRQAopc0g4ooAXilFJRQApoFH1o7UAB60e1BNB6UAFFHtR0oAWiiigQvXpS03tSigBTS96SjvTAXrRR2ooGFLmkooEOHNGeKSloAWl70lKKADtRRRQAUUd6WgBRSUtAoAAeKWjvRQAopaQUCgAoopR0oGKKBRR70CFxQOlKDRQAtFIKUcUAOFFFFACigUUUAFLQOtAoAcKO9ApaACgdaWgUALS0lKKAAUoFFLigAFL3pAaUUAKKeKZSjNAD6VaaKcOKAHZopKWmAtOptKOlIBwpRSLThTAcAKWgUHrQA4dKcKYDTx6UgFHpSj2pKUUwHKad3zTRThQA4dKXtmm0qjmmAozTloC96OaQD1606oxUi0AOWpFqOql7c4BhQ8/wAR/pTAbf3HmN5aH5AeT6mqmaKKBC0ZpKBTAdQKQetApALmk70UduKAFpMelLSHrQAmOaSlJFFACUCiigBR1pTSUdeKACkopOlAC02lzSGgBKM0UhoAKCaO3FJQAGkoNJmgAJpDRSUALmkNBpM0ABpppabQAGiiigAqKeTYuB1NOmcIue/YVUZixJPU0AITSUUhpDCiikpiCkNGaQ0gCkpTSZzQMKSlpKACilwPSikKxnUUuOKKkoPcUtA60v0oATFA4opaYBRil6Ud6AExSijkmigBRS0gooAKKO9FACilpBSigAOKWkooAMClpKOtAC0fSiigBaKQmloAKUHtSdKWmIXNFJS0AFKPSgdKKACloFHrQAope1IKUdaACijtS0DEpRQO9KBQIKKWkoAKWijvQAClpBS0AFA60opcZoGAFB60tJ2oELSjmm9acKAACloHFFAC0o96QU72oAKKKBQAoFKKQUtAB0paKBQAoPNOFNFLQAvHelFIDS0ALS0gpR1oABSigAUd6AHds0AUAU4c0AKOlO7Zpo604UwDHSlFGKWgApRSCnAUAOXpSjpTRxTlPNAC04e9IKUdaAHcdaXtSCgetADvxp4pg6809aAHAd6eMd6bS0AKBzSgYGaF96dQAClHPSkpy9qAFA9actAGaiuZRCmTyew9aAEvJ/Kj2qfnPT2HrWdSszMSzHJPWkpiAGl4ptLQAuaKTNANAC5opKWgBRRj1pBSmgAooNJQAdTSGlpKADqaKDSZ6UALSZozzSUAKaQ0maKACiikoAXPFNJpSaaaAFpKKTPNAAaQ0c0hoACaBSEmigAJpDQeaSgApCaDRQAZprMFXcelKSACSaqyybz7DpSAbK5d8mmGlPWg0DEpKWkzQISk70tJQAho4oOKPrQMKDzRSd6ACig9aKQBzRRkUUAUO1FJ2paQwpaTpR1FAB1pe9JS0ALjvR70CigAxRRRQAtHSl6ik7UAB60DvSd6UdaAFpRQaKADmiiigBaKQ0tACClope1MQUDFFLQAUYxRS0DCikFOoEFFJ2pe9AwpaKKBC0tIKKAFoHSilFAC0UCigBaKTNKKACgUCgUALTsUlLQAUD1oooAWijNAoAB1paO1B6UAHSlFJilHSgBaPxoHNLQAtFA6UUAKKWkooAWlFIKcKAAClFJS0AAzTqaKcKAFFO96QUvWgAHSlopRQACnUlApgOFKKQUtADgaXHNNzzSg8UAOFLSZpaAAe9PFNHFLwaAHA0opnSnrQA6l7Ug55pRQAq1IDUY608GgCQdacMUxaeDgUxCil700Uq8mgY8e9OpFPHSlJwCTwB1NAgeRY4yzdB+tZk8jSvvb8B6CnXExlf8A2R0FRZ4oAKMj1pD1oFMBRQKTtSikAp60daTrS/SgBRR1pKXNAAKWmg0ZoAWikozQACgmikzQAUlJSUAOHNBPakooAKKQmjNAAaCaDTSaAA0meaCeKSgBelJmkozigBTTeKM+1BoATPNJmg0fSgAJ5o70lFABSZoqC5l6ovXuaAGzy7jtXoOvvURNIaKQwzRSUE0ALSGikpiCkpc0lIYlBpaSgApO9BpM0gA0lLSGgBc0UnNFAFGigUtIYUd6KWgAxzRSikPWgBaKBRQIKWiigYUUUd6ACgUUooABRSU6gAoopc0AJSiiimAdaMUUooAWg+tFHegQZpaKKACiiigBe1AzRS0DAUUUe9AhTRmgCgUALilpBS0AA60tIOvNHegBRQKKBQAtLRRQAoopKUetABS0d6BQAtFFHNAC9KO9JSj3oAWigUtAAKUUlKKAClAopRQAd6WigUALSikooAX60opKBQAopwpB6UUAOpR700UtADxRTQeKXtQA4UU3vTgeKAFzTs1HSg80wHinA03PpSigB496cD6UwU4daAF7Uq9aSlHrQAvWniminUAOFLTRThQA4UopBSimIevang0wU6kMUU9aRRTxTEAHNUryfe2xD8g6+5p17PgGJDz/ABH+lUwTQA40maM0hoAWikBooAdmj3ptLQAtLTaXNAC0UlLQAUUhpM0AOo7UlGaACgmkNIaAAmjrSUDigB3ekJ5opKAA9aO1IaM0ABpDSk000AB+tIaXNIaAENIaU00mgANGaQmkzzQAuaTOKKO1AAaTvRTZZAi+/agBs8mwYHU/pVU0pJJJJ5pDQAlFFJQAtFJSUgFJo7UlAoGBpDRSGgBe9IeaKTvQAUUGk70gAmjPakzRmgBaKTNFAFEdaWilFSMKUUUfjTBBRQKWgAozSUtABS0UUAFFFFAgpaQUooAMUUUvtQMM8UCiigBRRmiigQoo70daO1MBaBQOtFAC0UnSloAKWkFL1oAKBR3ooAWiiloAKWkFL7UABooPWigApaBR2oAM0uaSgUAOBpRTRThQAveikpRQAtFFA4oAUUvWkHSgUAHelFFFAC0opBS0ALS9uKbS0AKKUUgpRQAClzSCloAUUUlANADqBSdqUUAKKWm5paAFpc0nOaWgBRSjrSdqM0AO+tL2popc0AKKO9IaUdaYDlp4NRg04GgB9OFMHXmnCgB45pw96atLmgBwpw6U0U4UAKvWnCkFOBoAdTl6UzNOBoAcKcDTB1p49BQA9aiu5/LXap+c/pRNKIkyeT2FZ7MzMWY5JpiEzk0oPrSCjNMBQcUUhpaAFHSik96M0gFo6UdKOtAC0A8UCloAKQUUGncAPSkpTSE0AJ0pc03NFIB1FNBooAU9KPeikzQAZoz1pO1FACk0lFJQAp+tJSE4ozQAH600mlpuaAAmkzRSUALTe9LSUABpaShiAMmgBrkKMmqzsWbJpZXLt7dhTM0gA00+lONNzzTASigmkPSgBe1JRR3pAFFFFACUlBooGGaQ80UlAAaCaKOtIBOlIaU0h60AFFGfeigCpRSUtIYCg0Ud6AAU760go60AL2oFFHWgQUtIKWgYd6DQaWgAo70Ud6AFpKKUUAAoFFFMQtLSClpAAoooFMBRRRQaADvS0hoNAC0UUdqAFFKBSdqKAFpe1JmloABS0AUUAFLSUCgBRQKKKAClFApaAAUtIKWgANIKWigBR60opBS0AKKKB70tMAoozxSikAUvU0lKKAA9aUUUtABS/Wk96O9MBQKWigUgClFJS0AKOlGfWkozQAtKKQU4UAAp1JQKAAmgc0daAKAHUopCCBmn2UctxOsEEUk0zfdjjQuzfQDk0AJRUmpWl7p90Le+srqzmIyI7iFomI9cMAaYoO3JoASlWkyDSqDQA9akFRjAp64oAdSg8UnWgUwHjrTwajBpwNADwacDUYNPFADlNOFNUU/oaAHLQ8ixoWPakyACScAdapTyGRv9kdBQISR2dyzf/qppzQKM1QBRRQKADvRRilzQAhoo7UetIBRR+NIKM0wHA0uaaDS5pALRSCgntQAH2pO9J70dqACijPFJQAUuaTvRQAtJRmkJoAWkJoB7UlABn04ozxR3pKAAmkJ4zSZpM0AKaQ0ZpO1ABR70Z4o7UAITk0ZxQRSEUAGarzy7jtHQU6d+Nq9e9QUAFFIelKKBiUhpaQ0AIaDRSUhBRmikJoGL2pKKTtQAE0UUhoAWkoFFIAoozSZoADSGgmg0AGaKXHvRQBSpaO1FIYUdqWkFAC0UUtABzS0UUAA6UuKSigBcUUUtACUtJRQAdqX2pOlKKYAaUd6KKQCij60UUxBQKKKAF70UUCgBaBRRQAUUUUAFOFJigUAOFHSkzS0AGaUUlFACilopM80AKKUUgpRQAtApaSgBaKKBQAtJzmlFHegAAp1IKUUAKKKBQetMAHSlFJS0ALSj2pB606gAFFHaigApaBQKADtS0fWloAKM0UUAApaQU6kAgpQaSigBS2K9W+Bfwdu/ip4b8TXlhqS2V9pjQJZCVf3MzsHZlcjkcBcEdM8g15KwJ6V9xfsGad9m+Dl1eFAHvdZnbd3ZUSNB+oahjPjfxd4Z1/wjr82heI9Mn06/i5Mcg4dezow4dT6jI/Gs9RjljgDqT2r9K/ir8OvDPxL8ONpWtwqzJu+x30OPOtZehKN9RgqeDjBr4d1fQdQ+Bvxl0o+NNEt9X0+0uRcRlo90F7ADgyJnjeuQ209GAzkEEq4WO3+CX7Nut+MbS313xXNNoehygSRRKv8Apd0h6EAjEansxBJ7DBBr628CfD/wl4HsUtPDGh2lgoHzyhN00h9XkPzMfqa6PSry21Cxgv7SZJoLmJZYZF+66MAVI9iCDVlhk0rjMPxV4W8P+K9ObTvEej2eqWjDBS4iDFfdT1U+4INfLHxl/Zcv9Ohn1f4dTS6haqC76VcNm4Qf9Mn/AOWg/wBlsN7k19hDih8HHr2o2A/KBreeGeSCeKSKWJykkbqVZGBwQQeQR6GpbK3uLu8is7WCW4uJnEcUUSFnkY9FUDkk+gr2n9obUU+Jvx/l0DwToNvPeQOdPaa3QLJfTqfnkdumxMFdx6BSScYA+j/gP8EdA+Glouq37Q6j4laI/aL9x+7tgR8yQg/dHqx5PsOA7hY+ZfEvwB8S+GfhFqXjnxDcJaXlt5LJpkeHZY2kVWaVugYbgdozjue1ePRtX6U/GOztdW+DfiuNGjnhm0S5ljZTlWxEXVge/IBzX5qDhAfUUJisSqc07NRKaepqhMcBTh7U0U8UAOWnimLTloAeuKeOaYtRXM3BjX8TTENuJd3yqflH61Dmm5pRQApPFANJmgUwHUUCjtQAGig0lAATS9qTNFAC0UmaBSAUdaWm5ooAdkHpSE0UUAGBRRSUAFIaWkoAKWijigBOvFIaWkNABnikoPXNJQAuaTNJnvRxQAUlLSGgBKO1FJQAHpRSGjNAC1HNJt4HWiRgq5/KqzEk5PWgA+tIaKT3oADRRSUALSGjNIaQAaO1J3ooGH1pDS+1BzQAlJQaSgANFFJSAWjvSUUABpCaD6UUAFFITS0ALRSZ96KAKnajtR2zRSGFHSig0AKKdSAUtABRRRQAUvWk7UUALRRmk96AAUuaKTFAC0UvakoAXtQKMUopgApaBRQIKMUdRSjpQAUUd6WgAFFFL3oASlpPpS+9ABRS9qOKACloooAKKKKAFpaSlFACilFJzmloAKWiigApe9JQDTAWjpRQMUgFpRmkApaACl7UgopgLmlFJmgUAOHFL0pBS9aAF60UgopALS0CimAo9aXNJRQAtHek7UUgFozSZoFAC96UCkAp60my4xuOjXJr7t/YjuUf4GxRJjdbapcxn6kq/wDJq+Ec4Ga+ov2CPGEVvquueCbyXabsDULIE/edBtlUe5XY30U1LZs6T5bo7nwJ8RpfC/7Tviz4Ya2/l6bq179t0hmP+qnkiSRkH+zJ8xA/vA/3q9Q+Mnw90T4m+DLnw9qyBHIMlndhcvazAfK6+3YjuCRXkX7Tvwd8ReLPir4N8W+DsQXsk6W17ckfLaGEmWK4bHJAAce5CDvX0jGDgbsZ74FCMmtEzzP9mCLXtM+Fdp4a8TWs0GqaBcTaZJ5isBIkb5jdCfvIUZcEentXqlRoPmzUlBIEcVzXxI1e50DwLrWsWcE9xd2tlI9rFDGXeSbaRGoUcklyorpaRwD1oA8X/Zf+EUHw38Mf2nrCLceLNUjD6hO3zGAH5vJU+x5Y/wATewFcb+1z8TLwa1pPwh8MzMl9rckKapJGcOIZXCLCD2L8lv8AZwP4jX0uUGDivm+L4Ma3P+19L491yRb7RPKOo2kyrgJMgWKKBhnqg+YHvtHvQ2XFXuet/GS8ttF+C/iuUBYoYNDuIkUcAZiKKB+JAr800fcqj0Ffaf7dHjKHSfhzb+ELaUfbtdmUyoDyttEwZif95wij1w3pXxRACDSvqaQpNxuWVFSU1KkAq0zOcLCCnrmmgetOWqMh64p4561GvWllkEaZ6nsKYgnl2DaPvH9Kq5prMWOSeTSg0ALxilptGaYC5pRTaKQDs5ozTTRTAdRmkzRQAtFFJQAZ5o5oo+lIABpaQUdBQAtFJ2oFAC5pe1NFLntQAdqKM0lAC5pM80Uhx1oAXPFJRSZoAXPFNNKabnmgAJpCaD6U2gBcmjNJmigBc0hNJRQAZpGYAZNB4GagkfcfYUAI7Fjk0w0pNJQAlFB60lAxaSjtRQITNFFFIYUlLTTQAuaQmkzigmgBD0ooNIaQC0hzRRQAnSlpOlFAAaQ0tIc0AJRkZoJ5pKAFzRSUUAV+1FGaWkMSloooAXNKKQUooAKKKO1AB1ooBpaBCUtJxS0xhiiilpAGKKKOlMApRTaWgB3Q0GkooELTu1NFL2oADS0HpSUALQKSlFAC0tJ3ooAX2ooooAWlpO9L3oASgdaKUUAAp3FNpwoAWg0Uc0AApaQdKWgAooopgApaOKO1ACilpBS0AJ3pRRiigBc0o60gpaAFFL2xSCnUgEFFFLQAUZ5ooGKYDqO1JQaQBS0UUAFAo4pVoHFXFHSngUi9qlRazkzto07gEzWt4V1fUvDHiGw1/SZvIvrCdZoX7ZHYjupGQR3BNUoVGRXe/BPwBP8AEbx/aaGA6adEPtGpTL/yzgUjIB/vMcKPrntXNOTeiPaoYeEYOc9kffHw38TReMfBGk+JY7O4sl1C3ExgmXBU9Dj1XIOD3GD3qfRfE2ga5c3kGjazYahLZSmG6S3nV2hcHBDAcjnj6irVmsFpbQ2drEkMECLHFGgwqIowqj2AAFeR/F/4S3l5q/8AwsH4Z3Q0Dxtaje/k4SHUlHVJV+6WPTJ4PQ+o6LtI8NU4uT6J7f8ABPbk+7mlBrgPg18QE8eeCotTmtvsWqW0rWeqWZBBt7lOGXB5APUZ9cdq7mJ9wzTTTMp0pRbTJ6Y5wKUNiue+I3i3S/BPgzU/E2rsfs1jDv2KcNK54VF92Ygfr2pt2IjFtpIt6/4h0fw9p76jrmqWem2ifemuphGn0yep9hU0+o2v9jtq0bNPa/Zzcq0ClzIm3dlR3JHQd68D+Fnw+1r4h6zB8VPi2DcvL+90TQXB+z2UR5R2Q9TjkA/7x56fQazIkW1QFAGAAOlTGTaub1aKg7LV9T8z/i143vviJ4/1HxPehkjmfy7OAn/UW68In1xyfUkmuZSPvXsP7WHw5/4Qz4hvq+nQBNE112uIAi4WGfrLF7cncPZsdq8liHyiudSadme2qUZ0047CKuKcafikAroizzK1OwmKcBTTTlwBk8Ada1R50lZisQiljVR2LvuNE0vmN6KOlMB9KogXNLSUtABQOtFA60wF70UUUAJ7UopKWkAoo70lFAC0lFFAAOlLmkooAXNFIaM4oAM0p60lBoAKCeaQUGgBc8UA96QmkoAdSUZpO9ABSg02igBTzTe9LSGgBDSUUUAFIc0hNBNABS0gqOaTHyj8aAEmfcdo6CoqDQOtAB2pKWkNACUGg0hNAAaTvQfekzSAWkozRnnigYGkopDQAGkNKaQ0gENFKaaaAFNJmkJpaADrS0lLQAh4ptONJ3oASkpTSd6ACil4ooAr0d6O1FIYUUUdqAFFFFAoAWiiigApR0pKWgAooooAKWgiigA60Yoo70wCgUUtAgpaTjFA+tAC8U7tSUUAHNFHpRQAtKKSl4oAKWkpaAEpRRQKAFpaTtS9qADigdKKWgApaTvRQMWlpKKBC0CiloAKWkooAWgUdqKYC0optLQAtFA6UUALS0gp1AAOlOpo60ooAWikpaACgdaBRQAtANJmgUALS0lHekAdqUUlOFDLhuSIKsRioIqsRnmuebPXwsUTqMCvo/8AYY1hYNc8U6MxUPcWsN0nHP7tyrc/9tBXzrCA3FezfsdxunxhlVc4bSLkH80NcqlaaPdqUebCy7W/LU+xFvB5mNwz1xntUy6mqEZavJPjtNf6ZpFhrul3MtteadeDEiHojgggjoQSF4Ncv4W+MUN5LHaeII0s5zwLmMfumP8AtD+H8OKxqZhGnV9nLQ6sNwtXxuDWKoLmWqaW6t5ddLbfcerWegJpvxMvfFGkMsdrrlsI9WtxwDcRcxXA9ypZG/4CfWvQbFsqK4jQbkXKxyI4dHAKspyCPUHvXZWB2oK7qUubU+Zx1D2XulydtozXnvxG8Mx+Mtd8N22q7H8P6ZdPqF5Ax/4+Z0ULBGR3UFnY+uAO9d9ctlK5HX7loWJU81VWVkYYGi6krLc2bnUFJwpGBVU6goZQzAbsgc9cdceteMeM/i5pmiM9rYbdTvxxsRv3UZ/2mHX6CqPwV1TWfFninU/EWs3TztbwLb26D5Y4t7ZIVeg4UfnXn/X4yqKnHVn18OE69LBzxdZcsIrru29FZfq/lck/bY1JV+GWlWGEMl5qysMjkLHGxOPTllr5FjX1r6U/baaTy/B8JJ2Yu3x7/uhXzhtwK2lK87HJh6CjhVLvf8xjCm+1SjpzTXHtXTTZ42KgRnpVaeTcdqngdfepLmTClV696q8CulHiVBTQPWgGjNUZCilzSCigBRSikWlpgFFFFAB1NLRRQAUUnSigApRSUA0ALSUGkoAcaSkzRmkAue1HtSd6KAFopCaTNAC0lFFABSZpD60nPWgB2aPpSA0dutAAaQ9KOlHagApDS9qTFACUGg02Rtoz+VADZX2jAPNQdaCSTk0nagB1Jmj2pDSAWik7UGmAHrTTTjTTQAlFBpM80hhRS9qSgAzSUUGgAJpPejNFIBKTrS0negANJTqTtQAUUhpKAHE0ho9qQ0AB602nGm0DFooxRQIgoxRRSGFKDSUe1AC/hR9KKKAFpKM0tABQKKKAFFFFLTAKKKDSEFFFJTGL9KWkFLigQo5oGPSk79aWgAFLSUtABRRRQAtFAoFAxRS0lLQIKKKKAHCikooAWlptOoASl7UlKKAFoooHSgBRSimilFAC0opKXFMAooo+lAAKXFJSigBRSikoBoAU0o+tIPegUAOpaQUUALQPSko+lADqDSCjvQAd6dTQKXPagBc0neg0CkAopwpopRQy4ksdTxnmqynvU0ZrCaPVw0rGhA2MV9C/sR6ZJefEDWdX2/ubLSzET/tyuuP0Rq+dIieK+lP2KvG2h6PqmpeEdQCWt9q8qS2l0zYEzIpHkH0PJK+pJHpXKornVz3KlWX1Oair6f8AD/ge9+NtLt9T0+6sLyHzbedCrr7e3oR1Br5w174V61b3rDTJ4LuAn5RK3luB6Hsfwr6x1G3ExPFYsmiK0mdtc+KwUazuz0ch4jrZZBqD0fR7HnfwI8NeJ9AMg1PUYxYMvyWQbzNrf3g38P0Fe32hOBXnPxR8RH4deBJPEw0/7YkF1bxypnASN5Art9Quce5Fej6a0N1bQ3VtIssE0ayRuvRlYAg/iCK6cLRVGPIjxM8zGWYV3iZpK/ZW2/rd6kl03yV5N8b9J13WNFW10PVBZkk+dEfl89ey7xyv9c16xeoduAK8w8MeJ4fGXjfxjotpbg2fh2eC1FyDnzZmV/NX6KVAH0NXiaftIuHcwyfFfVK8a6t7uuquj57074W+Jp7sRzra2keeXaXd+QHWvoH4X+GLTw3pCafalpCzeZNKww0j46+w7AV0A0NQ+Qv6Vq6bY+Sw4rhw2BjSldH1WdcUV8wo+zk7R7I8F/bj0yQeHPC2rKv7uC6nt3PoXRWX/wBAavlkNkCvqn9tjxxoo0C28AQKt1qrTxXk7BuLNVB2g/7bBjx2HJ6ivlONsCumSXtHY8nCVJfU4qS7/cSEVFcSbF46npT5HCrk/gKpSOSST1rppo8jFSI37nNRk0rmm966UeJU3FFLSUVRiLmlFNpRQA6lzTRS0wFzQDSA0UAOzRTaXoaQAaBSZooAWjpQDR1oAM0lFIaAFzRmm5ooAdnHekJpKPrQAuaKTPFBoAXNITxSZpKAFopM0UALR2pCaCaAFopoNKKADNB6UUhIHWgBGYBcmq7kscmnO24+3amE0AIaSl70negBDSmk70GgYtFJnmgnFAgJpppTTTSAKDR3oxQMKTtR+NFACUdqBSUgF7UmaO9FAB3pKWkoAO9FFJmgANJS0GgBKDQeaKAEpKU0lABmijIooGQ0ppO1FIQUd6KKBi96KKOKAClpOtFABSikooAdRR2oNAgoo6Ue1MYUCiloAB1pe1FLSEJxQaO9LTABRQKWgBKUikpaAAdaWkoFADqWkpaAAUtJQOlAC0Ug96XNAAKdTacKAEpaSloAWkoooAWl70gHFL9KYCilpBSigAoFFFABjmlHvQKKQC0ntSU6gBRSikHtQKAFpaKSmAUopKO1ADqBSClFABR2paSgBRzS4pBS0gEpQaSlAoGmPHSpENQipFNRJHZSqWLcZwM0rXEkUiyxO8ciMGVlbDKRyCCOhHrVcPimSPwT6CuacD2KGKsrH3V+y78WI/iLoR0XWpl/4SbTYh5zEgfbIhwJgP7w4Dj1IPevb/sigZAr4/8AiR8PdT+GnhPwH8XfBKLa3mnafZrrMUYIVmKL+9Yd1bcY3+qn1NfVPw48Xab428E6b4n0tv8AR72IMYyctDIOHjPurAj8M1rDszzMTJfHT2f4MpfFLwuvi34da94a2jffWUkcWe0oG5D/AN9BawP2W9Wm1n4F+Fri63edDatZybuoMMjRc/gor0osM5rjfhP4efwvpmr6WFK27a3e3VsOyxzSGQAew3Gq5feuc7qN03F97nWaxcw2OnXF7LgJbwvMxPYKpY/yrxb9j/Q7iy+E7a9fqftniXUJtUkLD5ijHahP1ALf8Cr1H4k2F3q3gDXtKsdwur7TprSIjqrSoUz+G7Naei6VZ6LodhpFggS1sbaO2gX0RFCqPyFDjeQQqcsHHuKLVSc4rzb9oD4l2Hwt8INejyrjWr0NHplqx4ZwOZGH9xMgn1OB3r0fWdUsdG0e71bUrlLWys4WnuJXPCIoyT+Qr5P+Gfh+7/aH+MF/8QPE9uw8J6ZJ5NpZyZ2yBeY4PoAd8hHUsB34md1otzow9pNyqP3V+PkfNGoapfavqt1qmp3Ut3e3crTTzyHLSOxySaerYXJqrf20ljqt5ZzDbJb3EkTD0KsQf5ULJkYHSueENT3a2J92xK7ljk1E9DHimMc11wR4derca1J70d6OnStUedJgelANFH0pkCilpBRQA6ikpaYC0UUUABpKKKQADTjSUUAFFFFAAabTqSgBKSlNJQAUueaSigAJpM0e9JQAtJ2opTQAlAoNID2oAWiko7UALSZ5oFB9qADP4VFK+eB070sz4G0de9Q5oAUmkPNGaDQMQ0lKaaetAhe9GaSl+tAAaQ0ppO1ACd6SlFGKQxKKDRQAlIetKcUdqQCUlL2ooAQ0UlLQAhooNJ0oACaSl60lABRRRQAUhoooASkpaSgA/CikxRQMjozRQKQBS0lLQAuKTFLRQAgopaQ0AFKKTtS0AKaKO1FABiilFJQIKcKSlFMYtJ0oooEKKMUCigBaKBRQAUtFBoASlpKWgBRS0maKAFooo7UAHalpBS0AKOtL7U2lFABR3oNLQAUopOKUUALRQKM0ALS+1JRmgBeKKQUZpgO6UUUlIAFKKOKBTAcKXtSUdaAD3oFFGaAFopBS+lACilFJS0ALQOlA6UUAApaSloADQDR2pKQC04Gm0hNBSlYfk1a8P2MureI9N0iJC8l9eQ2yqOpLuFx+tU1Nep/so+Hf+Eg+Pnh4OhaDTTJqMvGceUvyZ/4GUqHE3jVaP0D1DRtO1Hw5PoN5bJNp9xbGzkhYcNEV24/Kvmz9iW7u9H8SfEP4fTXDT2mjahvhYngMJHic/wDAhGh/CvqLcVVfrmvkH9mW3v8AVo/jzrOmKzXl7JcQ2ZXq0jfaWUD3yVpW1M1NpNH0V4H+KHgTxrr2paH4b8Q21/qGnMVmhXKlwOC8ef8AWIDwWXIruUQAV8a+BvgdDH8JvCPxU+Ft5qMfjTT4I72aCWQlLx14ngCkDach1A6MBg9c19lQFmjDMCu4Zweo9qZNxXUEVx3xI+Ivg74e2VvdeLtdg01bhtsKEF5JcYyVRcsQMjJ6CuxkzsO3rXy941+Dlr4z8R+O/iZ8WLvU4tNszcWui2duSHgtYMqswABJLEFlQdd2T1FAXLP7b3iwyfBXR7Xw/dJc2nia/iRbiF8pNCF8xQCOoZtn5V7b8LvCdl4G8AaT4asI1VbC3VXYDmWU8yOfdmJNfJXxV8Ka34e/Ys8DPqqSx3ul6st20Uow8EcxmZFI7EbkyOxOK+0NDvV1TRrPUYyCl1bRTL9GQN/WlbW5Tm+XlPzX/aB07+w/jX4u0xQVVdTkmQH+7LiRf0euOgfivdf28vD/APZvxhstcjQiPWNMRnbHWWFjGf8Ax3y68EjbHFEYnS67cdS4WpuajDUoNaJHNKdx1LTRThVGIUUUdqAAUtJ0paYC0oxSCigBc0U2lFIAJ5xS0lFACmiko5oAXNGe1JQM0AFAPFITRQAtJ0oPrRQAGk+lLSUABpKDRQAdKTNFB9qAEJopCaSgB2aKSjPFAC02R8DjrQWAGahJJOTQAd6Q0tNPWgANFBooADTe9LRQAUGg0lAB7UmaCaKQwpDQaSkAvWkozRTAQ0GjvSGkAUUGkoAU0n0oooAQ9aOtLTaAA0UUUAB60ZpKKAA0nWgnsaSgBaSlFJQAvHpRRRQBDSUUUhi0tJxQKAHUUCigAooNFABijrRS4pgFHWiikIKXNJR3pgLxSikoFAxeKXFJRQIWiijvQAvajoaKKACijpSUALRmkpaAFzSim0ooAdRxSCnYFACCloooAKM0UcUAKM0tIKWgA4ooNFACigUgzSigBRQKBR9KAFFFFFAC0tJQKYB3p1IKKQDqSilHrTAKKBS/SgAoFHajjFAAKWkFLQA6gUmacKAD3oPSgUtIBOaPalpKYBTTzS0UgEJxX13/AME+fDeLPxL4wnix58iabatjsnzy/hlox+FfI+xpMLGhd2IVVAyWJ4AH41+l3wN8Hf8ACA/CzQvDbIBdQWwkvD63Enzyfkxx9AKTGjttQDrZytCheURsUUdzg4H518hfsE+KNI0i78S+B9cmfTvEt3qJuI7e6+Qy7V2vGM/8tFIJK9SDkdDX1lY6va3uo39hbvvlsGSO4I6K7LvC/XaVP/AhXlnxv+AvhT4jyf2vHJ/YXilSDb6nbcNIy8r5ijG/GOGGGHqQMVIz2KIKYwu3aB26U5jgYHWvkvTvjJ8SfgnrVr4T+M2lS61pbkiz1m2bdK6DA3BuBLjjKttcZ5zxXsOkftA/B/VY1e38eaXAWH3bstbsPYhwKAPU1PY0PhVJyfwrzbUfjp8JNPiMlx8QtAcDtBciVvyTJrxrxv8AtKa/4x8RReDPgbo019fXZKDUriH5sd2jjbhVHUvJwP7vegDoP27/ABPoFn8ILjwrc3itreqTwPZWafNIQkoZnYdlwCAe5IAr2n4UW93a/DXwza38EkF3Do9pHPFIMMjiFQyn3BryX4O/s72uia2vjf4hanJ4q8Yu4mMk7mSG2fsRu5dh2Y4A/hUYBr27VNXs9KW2a9lESXNwlsjHp5j5Cgn3PA9yKAPn/wDb88MtqXwt0/xFBHul0K+BlOOkEw2Mf++xHXw1CxJr9WPG+gWni3wlq3hvUFBttStJLZyRnbuUgMPdThh7ivy11bSL3QdavtF1OIxXun3EltcIezoxU/yqkDGLThTENPHvVEscKUU0UtMQ6l7UzOKXNAC5oFJQKAHUUlFABSg8UnWjoKAHd8UnfmkzS0AGaXNJSUALmjtRnik6UALSUd6b3oAd0ozTc80GgB2aQ0meKO2KADNB60maKAAmkNFITQAdaKQUvSgApCcCl+tRsdxoAaxJOaKDSUALTTS0lACGj6UH2ooADSUE0UDCgmkzS0gENBoNJQAUEUUGgBtGRQaBQAetJS0lIANJSmkoAKKBRQAlFHekoAXBpOaCaQmgAopKKAA4pKMcUUDA0UGigQUUUUAQ9qKU0UhiClooAoAcKKQcUtAAaKKO9ABS0d6KBAKKO9LQMKTFLRTEIaXmg0tAwoFKKKBBRRRQAtJS0UAFIaWkoAKd2pKWgAApR1oFH0oABSikpRQAtFFGe1ABQKWjigBR0pT1pBRQAd6BRQKAAUo9aBRQAtKKQetFAC0UUUAFAo9qXNABSjmk70o60AKOaUUgopgOoHWkHFLQAUopM0tIA7UUUUwFpRTRThQAoNLTaUUgFpD0oopgIKG6cUGm5wCcZwM4pAe1/sb+AW8Y/FOHV72DfpHh4rdzFhlZJ8/uY/zBc+ye9ffWo3MGn6dNeXUgSCCNpZXPRVUEkn8BXm/7MXgmz8FfB3RbeF4ZrrUYhqN5PEciSSVQwAPcKu1R9Ce9WP2mtTuNL+AXjG6twfMOntBkdQJGEbH8mNSyjC/ZK1afxN8PtV8WXWfN1vxDe3hz/CpKoi/RVRR+FeifEjw7N4l8J3em2V5JYaiF87Tr2Ntr21ynMbg+meCO6lgeDXmf7EJQ/s/aYEx8t7dg/XzT/wDWr25zxikB85+B9f0H9oXwBq3gP4haeLTxTo7mHUoFwksUqEoLqH+6Q2Qw5APB+Vhny68/Y58VrO403xpos0AY+Wbm3mjcr2yFDDP0NetfHT4F6vq3jGP4lfC/WToHjBOZ0D+XHeEDGd2CFcgYIYFWGM45J5L/AIXb8f8AwVH9l8a/Ck6l5fym6gtpIw59S8QkjP4AfSgDkbf9jzxmXAu/GHh+KPuYop5D+RVf516lBp/gX9lf4U3msRldT169HlJNMAs+oT9VjUDOyJepA6DqSSK5EftLfF7xDMNO8JfB50u34VpYricL742xgficV0fwy+B/i/xR42t/iL8c9SXUdStsPYaMCrRQEHK7wvyAA8hFzk8sT0oA9a+A1h4ig8AW2qeL5pJvEOtu2pahvyPKaTGyFV/hVIwi7exB96xf2tzPD+z/AOJ7y0dorm1W2uIJF+8jpdRMrD3BGa9VQFSBXmP7VxUfs8+Mt3T7Gv5+amP1oA6X4UeJ4vG3w60PxPFtH9o2Ucsir0STGJF/Bww/CvlH9vP4fnSvFNl8QdOhP2PVdtpqO0cJcovyOf8AfQY+qH1r1/8AYXuLiX4BWkUysI4NRu44Se6eZu4/4EzCvUvib4P07x34F1XwtqQAiv4CiSYyYpRzHIPdWAP5jvTWgH5dxDpUhGKS7iazvZ7N3jkeCVomeNtysVJBIPcHFKpyKtEsB1oFBo9qYgzSik7UCgBwopBRmgBaWm5paYC0d6TNFABRnFFFAC0UlH0pALnikzzSGigBaDSZpM8UALSUUZoAKSiigA9qKBRQAGkpM+lFABRQaY7dhQAO2TgGm0lJQAppM80E0nagBeKKKTNAAetJ3oJpM0AFFGeKSgBe9HvRSUhi9aKSigA60lKaQ0AJzSUtJSADRRSGgBc0h60H0ooAKTOaDSUABoopKAF4xSUdqOKAEIpKU0hoAKDRRQAUUUlAC4opOaKAIqUUUUhhilo6UUAJSg80daMUAKOtLSdqWgApaSigQClpOaBTAUUGj3ooGGKUCkpRQAv4UGig9aBCYpRQeuaBQAoo6UYooAKKKKAFxzRRRQAopaSigBaOoopaACiil9KACikpRQAClpKWgBcUnalFHWgApRSUtAB3oxRxRQAtFJS9qADtRRQKYBSikpR0oAd26UCkBozSAdmgUlKKYC0UUUAAozSUo60AKOlOFNFLQAtFFFAC+1JRRQAmeaUYHNFNakB9v/sNeP49f8AzeDb2b/iYeH2xCCeZLR2JQ++1iyn0GyvbviV4cTxb4B1zww5VRqdjLbB26IzKdrfg2D+Ffm98HPG138OviHpviq2DvFA/l3kKn/X2zcSJ9ccj/aUV+mmkalZavpFpqWm3KXVldwrPBMhyJEYAqR9QallHz3+wbqN3aeB/EngrVbd7bU9B1pluIX4ZPMXp+DxyfpX0oRXJ2XgjT7D4lXPjjTnFrc6jYi01OAL8l0UIMUp9HUBlzzlW9hXWA9u9IBAo/GmNHk8ufpUtMzzigCLy+eCamUD8fWlAGKTpQAOOK8C/bi1may+C50S0SSW813U7axhgjGXl+bzCAO+Sij8RXv2QeBXHeJvA1p4g8feH/E2qTiaDw+ksljZlPl+1SYHnMe+1VAUY4JJ9MAEXwO8HHwJ8LNA8LyY8+1tQ10RzmdyXk57jcxA9hXL/ALVPxGi+Hfwqv7q3nC6vqQNjpqA/N5jj5pB7IuTn12jvXrDSKkTF2CKoyzE4AHrX5s/tTfEn/hZfxMuLqymL6Hpe6z0wA8OoPzzY9XYZ/wB0KO1NAeZQvuAq3GcVQt+OKuoc1aJJs0U0dKU0xC5opKKAHUlHNAoAKKDSUwFBpRTRS0AKOtKDSUmaQCnrSd6KSgBc0dKTmigAoBpPaigBaQ0o6Ud6AE7UlKTTT1oAdSGko96AA0c0U1mAoAHbHHemZpM+tGe1ACUZpTSHrQAfWjrSUUALRQKD1oAQ0lKaQ0hiUUUUAFH1opKAFo7UGkoAKSjNFIBDRQaSgAoNGaKAEooNJQAUUUUAFJQelJzQAtITR3oJ9KAA033pTSH2oAKU0lFAAelJSmkpDHUUlFAEdFFJmgB1JRRQAuKWkpaAE7U4UlAoAO9HeloNAhKUdaSlpgLmijHFHWgYUooxS0CDvRRnNBoAKUUlLQAGlFIKWgAooo70AKKKKO9ACUtJSjNAAKdSUUAAp1JSjpQAUCjvR3oAWiijNABS9qSjNAC0tIKBQAUtHtRQAd6KKXFAAKKKWmAAUUUUAHelHTpSUopAKKUUlFMBaM0dqQUAKBThTRS80AOopKKQCijtRRTAKWkFHegBTSYpw6UEYoAhnbAr6w/Ya+K8NvYXXw98R6hDbx2oa60ma4lCLsJ/eQ5Y4GCd6+xb0FfLvhzRNR8TeJdP0DSYRNf39wtvboW2gsx7nsB1J9BX0gn7GniGS3Uv460UMQCyrYSkA9xnfz9cVLGj64/4S3w3jP8AwkGj/wDgfF/8VSDxZ4bzkeIdHP8A2/xf/FV8jD9i3Xj/AMz3pA/7h8v/AMXQ37Feu4/5H3Sf/BfJ/wDF1Iz68/4Svw7/ANB7Sf8AwOi/+Kpn/CUeHSc/2/pP/gdF/wDFV8g/8MVa8T/yP2l/+AEn/wAXUifsU64Bz490r/wXyf8AxygD6+HinQMca5pR/wC32L/4qkbxV4e769pI/wC36L/4qvkNv2LNeHTx7pX/AIL5f/i6Z/wxXr7Hnx7pY/7cJf8A4ugD68Hirw4Dx4g0f/wPi/8AiqcfFnhvvr+j/wDgfF/8VXyF/wAMUa5/0P8Apf8A4ASf/F07/hizXun/AAnulf8Agvk/+LoA7f8AbR+MVrongJfCvhnU7e41LX1eKea1nWQW9qOH5UnDPnaPbd7V8OQfMABX1W37FWtgFv8AhPdJ/wDBdJ/8XXz/APEzwNrHw58a3nhbWxE08AWSKaIkxzxNysi55weRg9CCKaEc9GuDxVmMcVFGKnAxVoTHdqKKO1MQooFFGaACikpaACiiigAopBS0ALmk7UUZoAPejNIaTNACmgUmeKOlAC0A02loAXNJk0neigANBoFIaADvRTSaM4oACRimE85oY5pM0ABoopKQC0mKDRTAO9FFGaAFpKTrSUAO7UlJ2opDA9aDRRQAlLSUUAGaSiikAlFFFACGkpTSUALRSUUABpKDRQAgoNFFABSUtJQAZpKDSUALQaM0GgBDnFJ9aXmigAOKTNFFIYUUfhRQAyk70tFABQKKKAFNFFAoAWgUnWloAKKKKBC4ooooGLRSGimIdRRRQAUtJRQAtLTe9L9KAFFKOtIKWgA70UUUALSUvejFACUtJSigBaKB60e9ACigUDrRQAvelpKXPpQMKO1BNFAgoooFAC0UUCgBcUEUtFMBO1LRRSABS96SigBaKKWmAUUfWikAUGjvRQAUtJS+lMBRS/jTaUUAKKUUlLmgApaSgUALSiijvQA6mOeMDrS5/Om9Dk0AX/B/iLUPCHizTPE+mLG13plwtxEsgyrEdVPsQSPxr9UtCuo9Q0mzvUh8pbi3jmCZ+7vUNj9a+E/2dP2ftV8fX1n4i8S28th4UjcShXBWXUcHIVB1EZ7v3H3eua+94USJFjjQIqgABRgAdhUMaHbFHUUhC9hTz0puOaQxFUZyRTti+lKKQ0AIVXsKRUFKtPxQA3YvpTWQZ4p460UARsFC4IzX5mftN+Lr3xd8cPENxdwpDHpty+l20a/wxQOygk9yTuY/XFfpo4zxXxr+1n+z5qsuv6j8Q/BVq99DdsbjVNOiXMscn8U0Y/jDdWXqDkjOcU0B8sw8gVN2qKJcAVL0qyQpaSimIWikzRQAtFFFABR0oHWjrQAUUfSkoAdSdKM8UGgBD04oNITRQAUUnejrQAtJRRmgAzRSUmaAHUhPNIDRQAGmGnMeOKZQAUe9IaXtQAUUGkoAKKKOKQBSGlpDTAKSg0lIYtFJRQAtIaM0lABRRRSADSUd6TpQAtIaKKACm0tJQAdaDRSUAL2pKXPFJQAlLRSUAFIaU0lACUUHpR3oAWkNGaDQMO1HSkopAHWkzS0lAgooxRQA3pRR2pe3FAxKKWigBKUdaO9HGaACloooAKKKKYC0UUUCCl4oooAUc0YoHFH0oAKXFFIaAAU8U0UooAWiiigApKCaWgAFLRRQAGiil470AFL2pKWgAoopfpQAUUCigBaKTtS96AClxRR3oAKUUlKKYC0UUUgCiiimAUUd6KQC44oHSgdKO1MBaDRxQKACgUUvagBO9LzijvQKAA0opCeaUUAKKWkooAU0opBS0AFI3FGcCmk5NAAGw3WvqT9lD4B2PiLT7bx941tvPsHfdpemuPknAP8ArpR3XIO1ehxk8Yr5TuiQjY9DX6YfCPxb4Vi+GPhSN/E2iQyR6JZo8bX8SsjCBAQQWyCDnik2CPR4IljjRFVVCAKoUYAHoBTm61gnxj4UAz/wlehf+DCL/wCKqNvGnhLv4r0D/wAGUP8A8VUFHRA5pcVzaeNPCRPHirQT/wBxKH/4qph4v8LEZHinQ/8AwYRf/FUAb1NJ5rBfxl4UXr4q0L8dRiH/ALNTB4y8Jk8eKdCP01GH/wCKoA6EdadWAPFvhXGf+En0T/wYRf8AxVB8Y+FR18U6F/4MIv8A4qgDoDTc4rAPjLwp/wBDVoP/AIMYv/iqb/wmPhP/AKGnQv8AwYw//FUAdBjNKV7jrXPr4z8JY/5GzQf/AAYw/wDxVO/4THwpjP8Awlehf+DCL/4qgD59/as+AenalpGpePPCFstprNsjXOoWUS4jvUAy7qB92UDJ4+9g98V8WJKHwQetfqZc+NPBzEJJ4r8PlScFTqMPI7/xV+VjMv2642Y2ec+3HTG41SYmXFp3amL0pc1ZItANJRmgB1JRmj2oAWgGkNANAC0GkoJoAM0GkNA6UAFFBNFABSUUZFABR24pDRQAE0lFIcUAL0pGOKM8U3r1oAXtSHpRSE0AFFFJQAuaSjPFHFIBaKTNFABSUp60hoGB6YptKetJmgBaSikoAXNFJRmgAoopM+tIBaSiigBKKKDQAh9KSlNJQAE+lHekzRQMXNFIaWgQUhoPWigBDRSn1o7UAJSGlNNNABS0lGeaBhRRSUAFJmg0lIQ78KKb+FFA7B2o4oooAXpRRxRQAdaMd6KUfpQAdKKKOKYC84o4AzRQKACl5zSUtIQYo6UUUwCl7Uh9KWgBRRRRQAfyoHFFFACilpBRnmgApaKKAFFLxTRS0ABpaTigYoAWlpPrR3oGLS02l7UCFxQOTSClHWgAp1JQKAFFA6UnWl60AApe9JRTAXtR0oopALRQOlFMAFFAo70AKKKKKAClpKKAFoFFHFAC5opM80tABQKKM0AL7UtNpw5oABSjpSUhPYUAIW5pU5NNNLGwVqAPVfhH8AvGnxP0x9X02Sx0zSVdo0u70tiZh1CKvJAPBPTPFdsv7GPjMP8A8jT4aPuYZf8ACvpT9k0If2ePB5UAf6LIfx86TNeoyADkGobGfD5/Yx8Z7f8AkZ/C/wD4Dy/4VAf2L/Gxb/kaPDQ/7Zy/4V9yo5PU1Jx6ikxnwuv7FvjYf8zR4a/GKX/ClP7GXjQcHxP4Y/78y/4V90cev61HJj1oA+Gf+GMPGj8DxT4aH0hl/wAKF/Yt8aKc/wDCVeGz9Ypf8K+5o8DvT+PUUAfD6fsZeMymD4q8Mf8AgPL/AIVHN+xd4yAyPFXhr/vxKP6V9xkgd+KMg96APhb/AIYx8Z5x/wAJT4b/AO/Mv+FTJ+xb4yYZ/wCEr8ND/thL/hX3AV75FPTGOtAHw6f2LPGajjxV4aP/AGwl/wAKZJ+xh41C/wDI0eGf+/Mv+Ffc/HrUTNk4BoA+Fx+xd4zJ58WeHR/2yl/wrmfil+zV43+HXhiTxHNeabrGnW+DdtZ7w8Ck43lWHK5PJHSv0QRRwSaw/iJDDP4B8RQzIskb6Xcq6tyCPKahAflaOBRnmoEk+Reewp6mtCSWj6U2jtTEOFOFMFKKAFzRTSaBQA40ZpuaPpQA6im5oFACmikNJmgBTRSE0lACnriikoBoAWkPrRmmk0hhmkpTSHrTEBNFJ1pKAFpM0UGgA6UUUUhhSZ6UUUAL1pKKM0AIcUUfWjPNIApKKKYBSdKPrR9KQBRkUlFAC0lBNJxQApNJRRQAhoPtS000DCjtzRRQIKSlPSkoGL3opBS5oEJQaXNNNAATSUp5pKBiHilopD1pAL0pKKKAENFHWjjFACYopfzooC4maO9JS0CFoopDQMWiiigBaKKB0oAWiilpiEpaKKAD2ooooAKUUgpRQAtFFFAB3paSjvQAooopcigApaSigBcUUCigA6ilFJQDQA6kopaACiiloASlFHeigApaKUUAJS0UlMBaTtS0daAAUA0UUAKKWk7UooAKWk70UAKDzRQOlB4oAKO9GaKAAdaCc0UUALQKTvS0gFpaSloAQdacKTFITg0wBj2pBQeaKAAjvUbZHNSimtyKAPpr4L/tPaB4G+GOi+EtR8K6vdz6bG8bT288QSTMjOCAxBHDY/Cuwf8AbM8IKP8AkS/EH/gRB/8AFV8WyLzULKSamw7n2p/w2d4Sz/yJev8A/gTD/jT1/bO8HHr4M8Q/9/4P/iq+JinNATHNKwz7Zb9s3weOngzxB/4EQf8AxVN/4bO8H/8AQl+IP/AiH/GvicrTdhosI+2x+2b4P/6EzxD/AN/4P/iqd/w2b4N7+DfEX/f6D/4qviUJxSFKLBc+2j+2d4N7eDfEX/f6D/4qk/4bO8Hd/BniL/v9B/jXxMENL5feiwXPtsftm+DMZPg3xH/3+g/+KpD+2d4MHTwb4i/7/Qf/ABVfEoWiRMinYD7YP7Z3g/t4M8Q/9/4P8aQftneEO/gvxB/4EQ/418SCI08R0rBc+2x+2Z4QOP8Aii/EH/gRD/8AFVn+KP2v/C2oeG9U0628Ha6k93ZywRtJcQ7AzoVBOGzjmvjlBgUx1LGiwDomJAFW4ycVXhTFWkFUgHZopDzSA9qoQ8GjPrSA0E0CFzSZpKUmgBaKbxS0ALRnFJmkzQA7NJSZooAM0UlFAxQaKTNGaBATmiko96QAaSjNA96YBikpc0ZoASijrRSAKQ0vekNABR9aQmjNAxaSjNBpABpKKWmAlFGaM8UgDHrSGj60GgBD7UUUe9ABxSUp6ZpKAEopaDQAUlHajtQAhpKU000ALRSCloABRRSGgBaTrR0ooAQ0UpoNAxO9IaXvSGkAUlLSUALSdqKOhxQAUUuaKAGcdKWiimAUtFApMAopaDQACloozxTAKM0fjSCgQtL2pKKAFoNAooAWijtxR3oAO9KKSlzQMKKSlNAhaKBzS5oADRRSZoGOBopuaUUCFooooAUGjNJS0AGaUmk7UfyoAWlHSkpRQAoooB70UALSdTSikpgFL2pKXvQAdqKTvS0gFoFApKYDqKTNHbrQAuaKKKACgUUUgFNIKUUYoAcBmgDnFfR/wR/Zps/iJ8N9M8WzeL7zTnvfMzbx2SSKmxyv3i4z0z0rtx+xlpK8nx9qWf8AsHx//F0XQ7HxyQRQpycV9jSfsZaWy4Hj7UR/3Do//i68/wDgT8GfCutfF7x34N8TR3Oq23h/altKJTbszeYAWIUnqD05pXCx8+bTio2GK9M/aT8KaH4G+Ld94c8PW0lvp0NrbyJHJMZCGdSWO489q82YFhkVQhFGQahd134DA11PwwufD9l8QNBuvFcHn6HFfRtfIV3Ax55yO6g4JHcA19Ffti+I/g/qnw6sLTwtceH77XPtUb2j6Use6GEff3lAMKRwFPcjjigD5OVs05ulJGvy1HI+DigAIyaPJJ7U6DJ6ivXf2WPBnhzx78TJtB8TWb3lkulzXCokzRkOrIAcrz0JoA8eERzyKRkxXuf7WngHwv8AD7xto2leFrCSyt7nS/tEyvO0pZ/NZc5b2FeIT8HpSAg204R06IFjU+3FAFfZijZmp5FAXNNi+Y4pgQhOaXaKsSIAOlQHg0AMKUFeKkGDXT/DvwH4m+IHiBND8L6cbu5275ZGO2K3T+/Ix4UfqTwM0AcmqZPFP8rivsbwp+xppYs1k8ReNL6a5I+ddPt1jiQ+gZ8lh+Aqn44/Y8kttPkn8J+LzcXIBKWupQhFk9hInQ/UY96V0Ox8hsMHFCrzyK9N+FPw9N38f9I+H3jvSLq28y4livLRnMb8QyOpDDtlQQRwR9a7f9r34V+D/hta+GH8KafcWjahLcrcGW5aXcEEe3Gen3jSuB4FGlP6U6Jcr1psvy1QhM0YxzTQeKkjG+gBM4pM06RdtMjO5sUAKKGPFPlXA4qEnmmA4ZxSg05ACKaw5oAAaKQ0ZoAUmimk0UgFzzS9utNBoz60ALSZoFAoEBo+hpDSUAOFH40goFMAooopDDvQTSUZoAKSjtSZ4oAKKOtJmkAtFJ2o7UALmkNFFABmim0A89aAHZ4oJpM80Z5oADSUUUABNGaQ0UALSe1Ao70AFFFFACU00tIaAClptKKACg0ZoNIAopKXNMYhNFBpKQC9aQ0CigApKWkoAKO9FHegBKKdxRQA3tRRSmgAFFFFAC0vekpaAA0UGjvQAlGKWgUwCiiigQpooo9qAFozRQDQAUppKKAClpKWgAzS9qT3pRQAGilpKAD2oFBooAWj3ooFAC0UCjvQAuaDSUtAAKUUnWl9qAFoFJQKAFFLmkpe9ABQaDRTAWgdfajNFIBaKBSUALQKKUUAJS0CigAooFL0oASnA03NL3pgbemeK/E2lWaWmmeJdasbZM7IbbUJYo1ycnCqwA5r7d/Yi1rU9c+EMtzq2pXuo3Ca1cJ5t3cPM+0LFgbnJOBk8e9fAsmcV90/sBAj4MXJPfXbj/0CKpY0fK/xS8aeLYPiX4pt4PFfiCKKPWLtI0TVJ1VFErYAAfAA9BXsP/BP24uLvx14xuLy4muLiaxgeSWVy7ufN6ljyT9a+f8A4rrj4p+K89f7au//AEc1e+/8E9x/xWXir/sHQf8Ao2joB7P8Ufhr8IE8d3Xj74oapYn7ckUFtBqN2LeBPLXHygMC7c55OB6Vn+I/2f8A4Q+OvCn2zwVBZ6dLNGWstT0u4MkLt2DLuKsueDjB96+ef27L28uvjxcWk87yQWenWyW6E/LGGDM2B2yep9hXrX/BPG5uH8D+JrRpXMEOqxNFHnhC0R3EfXaPypDPmfwZ4fA+MujeEPENpnGuxaff2+4gNiUI65HODzyOxr3z9sL4YeA/Bfw50zUfC/hqHS7ybV1geVZ5XLR+VIxX52I6qPfivPPEy4/bhCgY/wCKwtf1aOveP2+xn4UaMf8AqOr/AOiJadxHP/ssfBz4deMvg7Z674k8NRahqM91cRmdrmZTtV8LwrgcfSt2y+DX7OXgiePRfF+o6Rd6xMdw/tfVPKkOTxtjV1Cr6Zyfeui/YpO39n7Ssf8AP5d/+jTXwv8AETUbzVviF4k1HUJ3uLi41O5Mjuck4kZQPoAAAOwFHUD6s/aA/Zs8LW3gu/8AE/w/s30u906A3MlgszSw3USjLbNxJV8ZIwSDjGOc15l+weS/xwuCDx/YlwQf+BxV9QfAyebUP2Y/D0l1I00h0KRCznJKqHUD8AAPwr5k/YCQH4zzZ7aBN/6HFR0A6P8Abb0XWvEvxv8ACuheH9Om1DULrR9kMMQ5P758knoqjqSeAK67TvgP8J/hv8LpNd+LEMWr3kaiS5uBPKihyPlggVGXec8AnknngV9EaqPDOk6xBrWovp1lqV8I9Mgup3VJJssWSBCeuWJO0dT9BXzV+3r4P8U3tjp3jCyvri88P6cnlXdgPu2bseLjA6hshSTyvHYnCTGfPOk+Hm+J/wAUo9F8A+GbXQbe7bEFqJpJEtYV+9NLIxYkgcnHGcAD1+pB8GPgH8LvD1vc/EO5tb2eX5Rd6pO6+c46iKFCOB6fMR6153/wT0ks38e+KA+37WNKj8v18vzvn/XZ+let/tE6d8A7nxhZS/FTVb621RbFfssavchPJ3NyvlqV5bOec8DPam2IwNe+AXwg+J3hKXWfhVqFrptwoKwz2k7S2zSAZ2TRsSy9umCAc4NfM3wj8Ixy/HvRvBHjDSyyjU3s9Qs3crkqj5G5SDjIBBB5GK+mPhp4/wD2Y/htc6g3hPxfeWx1BEWdJY7uVDsJ2nDJweSM15wviLw34v8A25fD2veFb1L3TrmeAmdYmQPIts6scMAewHTtSuwPaPEP7MvwqubrT7+LT30jT7ISSX0EV0+LoYG0PI7HYq4JOME56ivmj9qvSPh/o/jTSrT4dx6WmnDTAZ/sFz56GbzXB3Nub5toXvXuP/BQHWdRsfAHh/SLW5kitdS1B/taKceasceVVvVctnHTIHpXxVvA4AA+gpoGDDbk9hX6F/sreGdN8C/AbTtXuVWG41K1Or6lPj5ipUsoJ9FjwAPXJ7mvz3XDAg9+K/Rz4UyW3jj9mjR7OynVDe+HDpbNn/VyrCYGz9GBoYI+MPiv8afGnj7xHcXw1rUNM0oSH7Fp9ncvDHFHn5d2wgu5HJJ7njAqf4bfH/4ieBnniXVJdcspImVbXVZnmWJ8fK6McsMH+HOCMjjrXmWr6bqOh6zd6Jq1rLaX9lKYbiCRcMjA4/L0PerWg6Hq2v332HRdMvNSuxG0phtYTI4RRlmwOwFMD1D9mrWdY8S/tS+Gtc17ULjUNRurqd5p5myzH7NLwOyqOgUYAHAr7F+OHwz8IeOP7F1Txvqf2TRtBaeaaNphDHL5gQDfISNqjZ25Oeor4x/ZKwv7RHhED/nvP/6TS17b/wAFENUvYfC3hPSo5mW0vL64lnjHSRokTZn1x5jUmCO50/4Ofs++NNGnj8L6Zo91En7trvSNRZpIG7fNvYZ/3ga+Nvjp4Avfhn49u/Dd1cG6twi3FndFdvnQNnDEdiCCp9wa9G/YLvLmD44S2scrLBdaPcCZAeH2tGVJHcjJx9TXUft1JZt8WvAi3oX7O9sqz56eX9qG7PtgtQBP8Af2atGvPC1t4x+Jry+VcQ/aYdM84wxww4yHncYOSOdoIwOpzwO80XwV+yz40upvDnhqPQ5dTKlYxZXkscxx1MZZiHI69DXqPxot/Bcnwx1CHx3eXll4bIiW7ktPMyE3DaD5YLbSdueMdM1876TH+yJpGqWmq6d4p1m3vLOZJ4JE+2ZR1IIP+r9qVwPIf2jvhRe/CnxNDbC4k1DRr9WfT7sphjt+9E4HG9cjp1BB46V7n8N/2c/h74S8Dx+LPi3drPMIFnuo5rlobS0DYwnykM7cgZzgngCsL9r/AOLPw08d/De203wxrh1DV4NTiuIQbOaMxIFcOdzqB3XjNdv4L/aC+Evj/wAEJ4f+JCxadPLAkN7bXsLNazMuPnSRc7eQCM7SP1p6gNsfDH7Jni8jTNHl0OK7k+WLyr6a3lJxk7d7YPGT0PSvm74ffDew+JXxovPC3hK6urTw7DLLN9ruiJJo7RG27uAAXY4AHv7V9Kv8BPgL4+sp5fA2tGJ1GS+laoLhYiem6Nyxx7ZFeEeCNavf2bf2gtR03XYf7Sslh+y3TwABpbaTEkcyAnhhx8pPcj0ouB7vqnw//Zg+GzW+j+LBpgv5Iw4OpXcss7qejMqEBQfoK85/aE8JfAKy+Gj+K/AdxCb+a5S1so9M1LzInkPLGRHLEBVBzgjkivTvEfiD9l34rzxX2v6to/8AaXlCITXksthOqjopY7Qce+a4H40fsu6Dp3g+88WfDzVruQ2tu121nczLMlxCq7mMcoAIIUEjOQcdaVwPldiCeDTcc1HG25QwOQRmng1dxC0lFGaACiikzQAtFJmigAo70daPamIKU9KBRmkMQmiikoELSUE0g+tAwoFBpM0gFpKDR2oASjtS0UAJS0UlAAaSlNJQAnelzSUGgBaSikNACmikooAXtSUE0GgYUmeKKKBBSdaKKACikpfWkAUGkopjCj2oopAHSk70HpSUAL3opKWgApBRRQAhooo4oAWikzRQAUvvSUooAMUd6DS0AJS5pKWgAo70Ud6YCmkozQaAFoo7UUCFpT1pKKAFoopKAFoFFLQAUUUnegBaWkooAWj3pKXpQAGiiigANLSUooAUUCgUvagAooowKAFFJilpRQAUUd6KAAUtJRTAX3pe9IDQKQBS0Cg0AFFFAoAWgUUvagAoFJS5oADRRRTAKcKaKWkA9FBPNfYf7G/j/wAC+FPhPLp/iTxdo+j3n9sTzCC7uljcoVjw2CehwefavjrdtpJGJTqaGgTNb4j39vqHxG8SXtpPHPbXGrXUsMsbbldGlYqwPcEEGvav2JPFvhjwn4n8SXPifXrDR4biwhSGS6lCB2EmSBnqcV86hfmqxGdq0WGerftZ+ItE8UfG3UdX0DVLXU7B7S2RLi3fcjFVORn2Jr1H9iHxz4L8IeGfEMHijxPpmjzXGoxSRJdTBDIojIJHtk18pyEl81IjECiwHrXiXxJocv7XP/CURapaNo3/AAlFvc/blkzD5KmPL7v7owefavXf20fiP4G8U/DXS9P8NeLNL1e7j1hJnhtZw7KgikBY47ZI/OvkGXLNnNNKE96VgPtv9kz4nfD7w78FdO0jxB4x0fS9Qjurl3t7m4COAz5BIPqK+OvEM8V14j1W4hkWSOa+uJEdTkMrSsQR7EEVmxgqMZNC5DZoSA+7Pgh8Tfh5pP7POh6LqnjTRbPU7fSpYpLWa6VZFYmTCleueR+dfP8A+xl4p0Dwl8VZ9Q8S6xZ6RaPossAnupAiby0ZC59flP5V41vO3GTVVwS2c0WA95/ba8caR4t+IWhTeGPEsOr6dZaYCGtLgtHDOZWJIx0fATnrwK9r+An7QnhHxT8Ozo/xM1rTbDVraL7LeHUHVYtShKkB+eCSMh19eehwPhkoe9OEdFguexXOrab8FvjnF4k+G/iHTPEWhMWaKK3uhJm2c4e1lIyQRxtY56KeoIr6fn+I/wCzz8YdAtofF1/pUTxnelprEhtJ7ZiOQsmRkHj7rEHAzXwCOBTZDkY7UWA+1vEWp/sqfD/w1qtjp9to2rPfwGKa20+Rr24nU9FEpYiPnBzuXBAPUCvmf4A63oui/Hnw5rN9cppej2+oSOZLuUEQRlJAod8AEjIGcDJrgEQBaaI+c0WA+qP23fHvg7xhoHha38L+JNN1iS1u7h51tZt5jBjUAn6nNfLg5NJggYpyU0A5cgYr2T9nD45X/wALL2XTdRtpdS8NXkvmTW8ZHm28mADLFng5AGVOM4ByD18cApcUCPvy98Rfs3/FaODUNev/AAve3KLgHUpPsl1GP7pLFWIHpkj0p83xM+AHwl0eaHwtfaKr4ybPQ0FxNcEdAzjI/F2wK/Pp1B6gH60EYGBwKVh3Pbfhn8QdD1H9q3TfHmpWul+FdJlvJ5ZEVtsMANvIoZm6FmJGSAAWboK7X9uLxp4Q8X6f4Rj8L+JNN1prWe7ecWk4k8oMsQXdjpnB/Kvl2PrmpXbjrTA9i/ZA8R6D4V+Mseq+I9Ws9KsBplzEbi5kCJvYx4XJ7nB/KtL9t7xf4a8XeOPD1x4Y1yx1i2t9LeOaS1l3qjmZjtJHQ4wa8JByKjdMnNFgPsb4GftLeFNT8HW/g34pOttPFbi0N/PEZba9ixtAmAB2tjgkjaeuR0rp7Dw3+yVo10PEC33hFyjCWNH1c3CKQcjEJc5+m0/Svg8pTolCHOOaVgPVf2k/EPgHxd8UJNV8FWdxa2MgVb66EexbmTODLHEcbfl9cbiMkCvoW0b9kzxv4c0uxuL3SdPnsbSO2je5kfTroKqgAO3yhz7nd9a+KdxqNwWNFgufdXh3Xv2bvglBqF/4d8RWtzfXcQSQWl41/cSKpyEXaSq8nvj3NeLeBvin8PvE37R2rfEL4mWjW1hNb/Z9LtpLX7TDCNvlqZgAckIPQjLH0FfPygBcYqMqd2RRYLn3Dc/D79kjXmOo22v6HaRv8zRQa80Cf98M2V+gxVP41/Hz4c+GfhlceBfhxcxapcPYHTLb7MGNtZQldhJkb75CkgAZ5OSRjn4wU5XBH51G43NRYB8Bwir2AxU4qCMYFTLxTEKaaaU0meKYC0d6Sl+lAB3opKKAFooooAKKKTNAAelIeKXikoATNFFHekAe9JS5pKACiiigBaSjNFABRQaSgAoo70nWgANBoNIaADrRRSUALRR0ooADSUppDQAlHrQaKACg0UGgApDS0lAwoo70UgEFFGKKAA0lLRQAlFB60E0AFFJRQAHpSUGigAopM0UAPo70UUAFLSUGgApaSg0ALRSUooAM0Cl4opgFFHaloEFHSigUAFHQ0tJ35oAWl7UCigAooooAKXGKTvS96ACijrRigANKKBSCgBaKKKAFo7UlLQAv1oFJS0ALRSdqXtQAtGaSl+lMA7UUClpAFL2pKKYBR34oopAL2oFJmloAXNFJmigBaKSimAopaQUtABS5xSE4puc0ALnJ5pD0oozQAgUdaU0tIaAG4yaDSilNADNtLjnilFLQAhFJilooC4U0CnClxSAbtowKf2pCKYDCKQrTzRikAzFOApaKAGkUqiloFMBR0ooooAYy80m3NSYooAYBR1p1FADQDilxSigUAJimkU/rQaAGbaMU8YopAREUbafilFADNtAWn0tADQKd0oooAQ0UUGmAA4oFNzSigB1IaBQaACikNFAC5oNJmkNIBaQ0ZooAO1BpKKAFopM0goAXoKPWijvmgBKWkooAD1ooooAOKSijtQAd6DRSGgANJSmkoAKWiigBDQaWkzQAGiijNABRR3pDQAdqSg0daQwNBpDRQAUUUhoAKWk7UlAC0HrQelJQAUlBoNACUHNFFABRRRQA+jrRQKACjFLRQAUlLRxQAAUtJxR1oAU0Ck+lLTAPrQB1opc0CCiig0AFFB9qKAHCikpaACikNLQAUUlKKAFoopaAEozS+1IKAClopaAExS8UUdqAF70dqSloABS0gNFACiiloNABS0lFMAzQDSe9LQAtFJ2ooAWgUUvakAD1ooooAKBQKBTAUUppKQkGkAE0lFFAC0UlHamAuaSkpRQAUUtJQADNLRRQAnegUvejvQADmloAooASiilxQISgUtGKAA0lFFABijtRRQAUClNGeKAE70UUUDDtSGiigBO9HelooABRRRQAUUUnWkAlKKDRQAUCiigA9qO9FB6UwCgmkoFABRRRQAooNJRQAc0UlFAAPWjNHakpABoOaBR2oADRR3pPpQAUUDrRQAUd6KSgBSfWk6UUUAFFFHtQAUUntRQAUd6KCaACkoooAKXtSUue9ABSGg0maAFpM80fSigAooJoJpDEpKU0lAAaSlNJ2oAKKM0lABRS8ikoADRQeaKAE96O9HSg0AIaSlNGaACijNFAElJ060UGgAopKWgBaKKKACiijtQAGiiigQvSjPNFFMYd6U0gpaBC0lLSUALRmjvRQAopDRRQAUo60nalFAC0UlFAC0UmKXvQAtAoo+tABSikpaAAUtJ9KUe9AB3oFFFAC0vvSUUAFHvRQKAFFAoFLQAmKUUUUAApaSimAooNJSikAA0tJignHHemAMaSiikAUUvFJ3oAO1JS0UwEApaBS0AJQPWjNFAhQaBSUtAAKWm0uaBiikoooAWg0maM5oELRSUE0DA9KKKKBBQaSgUDFoJpDmigA6ijtRmkoAWiiikAUUUcUwCiko6UALSUnelxzQACiiigAo96KKAA0Ud6KAEooooABxRRSZpALRSdqKYAaKSigAozzRSUgFoo5ooASj6dKO9HagApKWigApO9BNH1oASilzzSUALSE80tIetAAaSijvQMKDRRQAUUUUAHaijrSdTQIWkozRQAlLSGigANGaTvRSGGaKKQ0AKaSikoABQaKKAA0UUUAFFH1pDQAvem0tJQAUUUlAC80UlFAD6KKKAAUtJmloABRRRQAZoo70oxQAUdqO9GaACl70naloEFFHagUwHUmaPpRQAppO9Ao70AFLRS0AJSij3oHrQAUUd6M0DF60UUGgQUtJ2o5oAWiiigBRRSCloAWiiigBeKKPwpKADvS0gpRzTAWgUh6UCkAtGeaSlpgLRSZpaQB1paT8aX3oACcCm0E5ooAKWko6imAZoFJSigBaT3ozRQADNLSdKKAFFFJRn0oAWj6UCkoAWgGkzQKAHUGkooAWjtRSUCFo70lHvQMUc0h60d6KAA0lFBoAKKKTrQAAiik7UtAC0UgpaAFpKSlNABSUUUAFKPrSUlAC0tN7UCgB1JniikHNAC0ZopKQC80g9aO1HemAUhpaKQCUUUUAFBpaD7UANoo70UAGaM0UlAC0h9KO9GKADNHtRRQAUUGkoAM0UhooAWiikoAKKKKBhRRRQAUUneigQZo+lFJQMKM0UfWkITmig+tIaBi0UUUAFIaDSdqACiiigAooooAKKKBQAmDRQetBoASjFFFAAaOKD1pDSGLRRRQA4dKKT2paYhaTNAooAXvRmkPNFABSig0dqAClpKXpQAdqXtSGigApRSUo4piFxSUvfNFAAKWk70tABQaKKAAdaKKKBhRRS0CClpKKAFoopaACgdaQUtAC96KKKAFopKM0AL2opKKAFFLQKDQAUUUUAHelpB05ooAXvS0gpe9AAPU0E5FITSZoAWjvSUCmAUUveigBDSUtHFACUtBpPxoAWlzTe1FAC0UZoFAC+9JRRQAUv0pKXNACc0uaKKAClpKOpoABS0neigBaQUvtSGgAooHWg+lACGjtRR3oAKKKKAAUUUlAC0UlBoAM0UUUgCkoo70AKOtFFFAB2o4pKWgANJS0UAFFJR70AFLSUppgJQKKM0gCig9aQ0AFFFFABSGlooASjPag0lAC0nWiigYUnel70lAgoo6c0e9AwopKKBC0UUlAC0Uneg0AFJS5oNACUGig0hhSUUGmAUlLSGkAZozQaSgBTSGiigAooooAKQ0tJQAvakpaTNAB9aDRQaAENAo70E0ABpKU0nekMX8aKTFFAD6KSlpiCiiigAooooAKB1opaAAUUcmloAKKKOKADrQKKXrTABS0lFAhaKKKBhSmkHSlFAgoFFFABxS0lFAC0tJRQACloAooGKKKKKBCmkoooADRQKKAFFFFBoAUUUUlADhSdqO1FABxS0gpaAFFIx5ozgUhoAKKSigBR0o70UUwFoNJRxigAoNGeKSgBaBSUUALSUUUAKKKBRQAtFJRnmgBaKBRQAUdqKKQCjrRSCimAtFHSigA7UGkzRQAd6M0lGaACg0lFAC9aO9AopAFJ9KKKAFzRSUUwA0UUUAFFHtS0gEpetJRQAtIKWigAoopCaAFpKKKACigUUAFJS0lAAaKKQ9KAFopKKACijtSUALSdqKKAEo7UUUDCjtRRQIOKTvRnmjNABQevFJRQMXrRR70H2oEGaQ0h60tABRRRSAO9JRiigYUUGigBKWik5xQAnek96U0lAC0UUUAFFJil96AAUlKKKAA0lFHagAHSig0GgBKSlzSUAFA96DSUgFxRSc0UDH9KWkxS0xBmig0CgANFBooAKKWjvQAUUdaWgQUUlA96Bi4oFFLwaACil7UUxCUtJ3pfpQMKM0dKBQAopaSigQUCiigBaBRmjNACijvSUUALS0g60UAFGeKKKAF7UUUUAKKOKQdKKAFNJQaBQAtFHWlxzQAtITS03vmgBRRSjpSdqYBSUtFACUtJRSAWik7UGgAzRQKKACgUUUwAdaD0oopAFFFGaYC0cUlFIBaKKKADFB60ZooAKBSc0tAC0UnejtTAKPrR2opAJ3oNFLQAlBooFAAKKO9FAB9aWk60tMBMUUd6WkAlApKXNABRQKKADFHNHbig9qAAUUnalzQAUd6O9JQAtJRRQAvajqKSigApKD1ooAKDSUUAFL3pKB0oAWkoooAMUlLRQAlBpetJQMKKOlFAhMUmKdSUAJRSmkoGFFFBoEJRSmkoAKKKKBhS/Wg0lIQGkpe1IaBgetGeKO9JQAGig0UAFJzS0Y9aACikNLQAlBpaSgA70UUlACikpaSgANJ2pRQaQxKSlooEHFFJ+NFAySko7ZoFMQtHUUd6KACnfhTaXtQAUd6KKADpRQaKAFFFJS0AFFFGeaYC0GgUpoEJS0lBoAWgUlLQMBmgUUd6AFoopaBCcUCg0UAL2pcUUcUAFHtRRQAopBRSUAL70tNpaAHdqSkFLQAUvSkpelAC9qPWim5oAU0CkooAcOtFNzRmgBaM0A0UAJS0UnegBaM0lFAC0UlGc0AApaSigBaKTNKKAEpaSigBaBSUUALRR3oNABRRjmigAFGaKBQAUtIKBQAtJQaKADNFJR2oAKWkooAKKSigBaXNJRQAvako7UUAFFJS0AKKKQUvFAB9KSjPFFABxRRSUALRSUZoAWikooAWkpKMjigBaKKSgAopKXmgYlL25oooAKOlBo+tAg6UUmaKAFoIpKKADFLQKTtQAUUUhoADRQaKBhSH2paDQIbmiikpDFooozQAc0UZoNABSGlNJQAhoooNAC+9JRQaACiiigBKKWkNAAKM5opO9ABS0lAoAKDQTzRQAcUnSlpKQwooNHegAxRRRQA+kNLRTEFJQfWgUALS0lKelAAaKKOhoAKO9FJ3oAWlpPaloEIaBRzSjimMX60vakooEL2pM0UUALRSijFABSUtJ9KAFoooNABRR9aWgAoo60HigBaKQUUALSUZooAKWge1FABS0lLQAdqKKQ+lAC0d6T2ooAWiikoAWigUUAFBoNIKAFoFFA5oAKDRRQAUUUp6UAN70UtJQAUtFFABQaKKACiiigBRRSA0UAL3ooFJQAtFFHSgBKM0UdqAAUUlHOKAFJpMmg0dqAAUUUd6ACiijvQApooooAO9FFFABSUtJ9aAFoopO9AC0UnFFABRQKKACj2pM4o60AFFFLQAlHegHmigYUnNLScUCClxxR1oNACUvakNFAC0lFFAwopDRzigQd6O9FAoGLmgdaSigQppKWkNIA7UCkP6UUwFNJ1ooNACUUd6O/NAxKWg0lAAaKKKQAOtBzRRQAmKKDmigAoopDQAtJmlpO9AB2oNHtQaAEoNFFIANFGOKMUAFFJRQMKKKPrQAUlLRQISijFFFxjzRRQKYgopTSUALRRSigAoFLSUAJRS9OtJQAtHSkNHegBRS0UdKAFpKMUuKYgooFLQAClpBRQAtFFFABS96SigAooPFFAAaUUUCgAooooAKKKDQAvagdaSlFABRRRmgBaSj60UAFFBpKAClpBRQAtHeiigA70Zo70UAFFJSigBaKKKACikooAM0o6Unbmg0ALRSdKM0ALRSUtACUUUUALRSUCgBe1FIKM0AOoNIKCaAEJooooAKM0UUAJRR9KKAClFJRQAtFJQKAHDpRSZo7UAFHFAooAO9FJS0ALTaCaKACik70vagAzRRR3oASlFJQKAFoNAooAO1FB6UgoAWkpaSgApT0ozSUALSUGg0AFIaWg9aAEPtR9aKOpoAKKOlFACUvQUUlAC0maKKBgaSjNFAgpPrSmg0DEoozRQIX1pMYpTSGgA78UHrRSUhhS9KKSgAo7UUUABpKWkoADR0ooNACUtFHagBDSUtB9qAEooopDCig0UAFFFFAgpKWkNAC80UlFIY+g0UDpVCFooFFABS0lFAC0UCigApMUpooATGaXFLRQIKKKUUwA0UUUALQaSloAKO9BFFAC0UUUAFBooNAAaKDR60AFLmk7UdRQAtFFJQMU0ds0lFAhaKO9FAwNFB9KKBBSg8UlFAC0lKaSgAooOKKACkpaKACiiigAoHFFFAC0Uho70AKKBSUo6UAJRRRQAUUUUAKPeikooAKKKKAFopKKAD60d6O9FAC0daTNFABRSUUALRR70UABopcUnegAooooAKQUdqKADvS96SloAWikoHWgAopRRQAlJS+1FACUopDSigApKXFIKACig0UAFLRRQAhoNFJQAtHekHWg0AKKKTvS0AFFJmjvQAtJRQaACkpfeigYfhRmigUCCkpRSdeaACk+lL3oHWkAlFGKO1MYUlApaAEopfWm9KAFoNFHagA96KBR3pAJmjNBpKADrR9KO9BFABRRRnFAATSUtIetABQelGKDSAKSlpKYBRR2oFIAoooNABRSEGloADSdqWm0ALzRRRQMeKKBR0NMQtFFFABS4o70UAFFFFAARSUtFAABTqQUdKAF7Ud6KKYgoo7UUAHalpKWgYHrRRRQIKKKKBhRRR1oAKWkpaBBilpKWgA7UHrQKKAE/Cg0ZpeM0DEooPSigQCiigUALRSUvegAooooAKPwoo70AFHeiigApaSigBTSUopDQAUUnel4oABS0mKBQAHk0UmaUUABoopKAFoHWgUUALSUdaKACijtRQAUUEUCgBKXPagdaDQAnNIKXrRQAv8qSlooACaPpSUUALRSUvWgBKKKKACijFFABS0lGaAHUgoFL2oAQ0lB9aQUALRQOaU0AIKKKKACigUGgAooooATvRRSUAKKKUUUAIaKU0mDQAmKUUCjFAC0h9KO1FACUGiigYUUUUCCiijNAAaPajtRigApO2BS0GgBtLig0GkMKSl7UhoEB4o5oooGIaKU0lABSYp1JQAnNFLSYoADSGlNIaADtRRRQACilpKAEopcd6TtSAKSlNFABSjpTaUUDFNJSnrSHrQIQ0lL70GgYZFFJiigB9LRQKYhRRRRQAUuKKKADPNHeikJoAX60tJ3ooAWjtSClFAC4ooNHemID7UUUUAL2o60CigYdqB70d6U0CE70GjvRQMB1paTiloAKOlHbFIOlAhaWkozQAtJS0YoATFFLSd6Bimkpc0UCE+lFFGaAA0UUvWgAoPSkPFGaADNFIaTNADu9ApKX6UAB60opKUdKACikNA60AGKU0dDRmgBKBRRQAUUUgoAWiigYoAWiijFABSUUfWgAp3am/SloADSUopKAFFFJS54oASlApKWgYdBSZoNJQIX6UCk5oNADhijIzTc9qWgBaSiigAFL9aQdaU0AIfaig0UAFLk0gpetACGkxS0lAAKUCkGadgmgBvQ0tDcUlAC8UUlFAC0UA07igBuKTFOGKDQAlAFFFABiigClwKAEopSKT60AGaTNBNBoGHSkoo+lAB70UUUAJS9qTvxS9aBB7UZ5opDQAueaQGiikAUlFLQAUneig8UDCjmilzQAntSGilxQAn1oIpeKMUAJRil7UUAIeKTFOpKAG856UUtLQA2lPFFFACUlKfSkNABRRQRSATvS0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pRzQAO9O7UAIBj606m96WgBCMmmlSBTqKAGUE0/jvTSvcGgBo6UopCMUZoGLRSUGgQZpaTtR3pAGetBoo7UwEooopABozjrRiigYUUHiigQlFFFAxe1FHakoAUmikooAWg0UUAFFBPNFABRR3pKAFoNJR7UAFFFFAAaKKKACkNLRQAlFLRSGIaaad9aQ0CG49KTFPNJQA3B9KKdRQMZ9KBR2ooAWko60tAgpaSigAooooAWkooNAB70UUtACHpS0UUwCiikoAXvQaSigBetKKSigBaKSigB1FJR+FAC0UntTh9KAExRilNJQAUopKKAHZ7UZptKDQAGgUhNANADqKQHmloEAo70UgoGKKWkpRQAZzS03NKOlMQdqO9FFACZooooGJRnig0lIQv1pOtKKKAACigUfhQAtH4UlAPagB4p2ajGaUH0pgPzSFgKaMmlAoAXJpOKWm0AOopB0paAEoFLSd6ACgUvtS0AIVzTCPWpKP5UAQ0tP2g9KaVOKAEopKKQAKeKZS5oAlT3pxYLUOTS59adwHZJoFNzSigAo5paQ0AFLSUgoGOooooEHalFNooAdRSClFAAKKUClGKAACloHekoGFFGaKAA0UlFAhaSijNABmiikzSADSHFFFAxMelN5Bp9FMQ2ilx6U0gikA4dKM03pS0AHWk9qM0UDCiikNAC0ZoooAOtA96KKADtRR2pKAFNFIelGMCgBcUuaSgUAKaKKDQAHikpaQj0oAO/FFL2pKACiikNAC0UUnWgBaKSjNAC0neiigAzSGiikAUlBopgGaKMGigCOl60lLSGFLSD6UtABRRRQIBRRRQAtJRRnFACmg0YooAKKSigYtJR3opiCijtRQAUopOaKAFNHagdKBSAWikoFMBRS0lHagBc0UlAoAWjvSd6TvQA6ikzS0AB6UUlHegBRRRR0oAWikpcUALQKSlz0oAKKM+1GaYC0lGKKBBQKKKBiYopcUY9qQhKO9LQKYxMUuKCQPekyT04oELgCj6UlKOaACgdaUdaMUDFFLSUGgQtFJS0ABooo70DCkxS0UCDtSikpM0ALS0mciigBTSUv40lAxCAaaUI6c0+igCKlHFSEAjkU0rzxSsIaTQBTsY7UmKdhhinCkFFAhaSjNFABSikpR1oAWiiigBDQKXHNOAHegBAPSlxiiigAopKKAFpabnmloGFFJR+F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" alt="Thinker Chess" style="width:100%;height:100%;object-fit:cover;object-position:center center;display:block;">
      </div>
    `;

    if (!document.getElementById("tc-userscript-style")) document.head.insertAdjacentHTML("beforeend", css);
    ensureThinkerLauncher();
    startThinkerUiReconciler();

    thinkerMountTimer = setInterval(function () {
      try {
        const mainDiv = getThinkerMountHost();
        if (mainDiv) {
        if (!document.getElementById("krypbot-container")) mainDiv.insertAdjacentHTML("beforeend", menuHtml);
        if (!document.getElementById("thinker-chess-banner")) document.body.insertAdjacentHTML("beforeend", bannerHtml);
        thinkerMenuNode = document.getElementById("krypbot-container");
        thinkerBannerNode = document.getElementById("thinker-chess-banner");
        if (!thinkerMenuNode || !thinkerBannerNode) return;
        startThinkerUiReconciler();
        positionThinkerBannerShell();
        $ = $ || resolveThinkerJQuery();
        if (typeof $ !== "function") return;
        clearInterval(thinkerMountTimer);
        thinkerMountTimer = null;
        ensureGhostRecoveryControl();

        function updateBannerPosition() {
          const sidebar = findThinkerSidebar();
          const banner = document.getElementById("thinker-chess-banner");
          if (!banner) return;
          if (thinkerBannerResizeObserver && thinkerObservedBannerSidebar !== sidebar) {
            if (thinkerObservedBannerSidebar) thinkerBannerResizeObserver.unobserve(thinkerObservedBannerSidebar);
            thinkerObservedBannerSidebar = sidebar;
            if (thinkerObservedBannerSidebar) thinkerBannerResizeObserver.observe(thinkerObservedBannerSidebar);
          }
          if (!sidebar) {
            banner.style.display = "none";
            return;
          }

          const rect = sidebar.getBoundingClientRect();
          const layout = calculateThinkerBannerLayout(
            rect,
            document.documentElement.clientWidth,
            window.innerHeight,
            typeof _ghostModeActive !== "undefined" && _ghostModeActive,
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
          banner.style.display = "flex";
          positionThinkerLauncher();
        }
        scheduleThinkerBannerPosition = () => {
          if (thinkerBannerFrame !== null) return;
          thinkerBannerFrame = requestAnimationFrame(() => {
            thinkerBannerFrame = null;
            updateBannerPosition();
          });
        };
        function updateWorkspaceLayout() {
          const wrapper = document.getElementById("oi-wrapper");
          if (!wrapper) return;
          wrapper.style.marginTop = "30px";
          const naturalDocumentTop = wrapper.getBoundingClientRect().top + window.scrollY;
          const board = document.querySelector(
            "wc-chess-board, chess-board, #board-single, .board, .chess-board, [class*='board-component']",
          );
          const sidebar = findThinkerSidebar();
          const gameplayBottom = Math.max(
            getThinkerRect(board)?.bottom || 0,
            getThinkerRect(sidebar)?.bottom || 0,
          ) + window.scrollY;
          wrapper.style.marginTop =
            calculateThinkerWorkspaceMargin(naturalDocumentTop, window.innerHeight, gameplayBottom) + "px";
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
          positionThinkerLauncher();
        };
        window.addEventListener("resize", thinkerResizeHandler, { passive: true });
        thinkerBannerLayoutObserver = new MutationObserver(() => {
          reconcileThinkerUiShells();
          const currentSidebar = findThinkerSidebar();
          if (currentSidebar !== thinkerObservedBannerSidebar) scheduleThinkerBannerPosition();
          positionThinkerLauncher();
        });
        thinkerBannerLayoutObserver.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ["class", "style", "hidden", "aria-hidden"],
        });
        if (typeof ResizeObserver === "function") {
          thinkerBannerResizeObserver = new ResizeObserver(scheduleThinkerBannerPosition);
        }
        scheduleThinkerBannerPosition();
        scheduleThinkerWorkspaceLayout();

        OpponentIntel.ensureScoutWrapper();
        scheduleThinkerWorkspaceLayout();
        OpponentIntel.startObserver();
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
        // Add Minimize Logic
        $("#kb-minimize-toggle").on("click", function (e) {
          e.stopPropagation();
          $("#krypbot-container").addClass("minimized");
        });
        $("#krypbot-container").on("click", function (e) {
          if ($(this).hasClass("minimized")) {
            $(this).removeClass("minimized");
          }
        });

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
          $(`input[name="kb-auto-queue"][value="${auto_queue ? 1 : 0}"]`).prop(
            "checked",
            true,
          );
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

          $("#minDelayInput").val(autoDelayMin.toFixed(2));
          $("#maxDelayInput").val(autoDelayMax.toFixed(2));
          $(`input[name="delayMode"][value="${autoDelayMode}"]`).prop(
            "checked",
            true,
          );

          if (autoDelayMode === "max") {
            $(".kb-num-input").css({
              "border-color": "#fff",
              "box-shadow": "0 0 6px rgba(255,255,255,0.5)",
              color: "#fff",
            });
            $("#autoDelayDisplay").text("INSTANT");
          } else {
            $("#autoDelayDisplay").text(
              `${autoDelayMin.toFixed(2)} - ${autoDelayMax.toFixed(2)}s`,
            );
          }

          const displayElo = autoAdjust.isEnabled()
            ? autoAdjust.getCurrentDifficulty()
            : chessBot.elo;
          $("#kb-elo-val").text(displayElo);
          $("#kb-elo-slider").val(displayElo);
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

        $('input[name="kb-bot-status"]').on("change", function () {
          hint = $(this).val() == "1";
          if (!hint) $(".myhigh, .myarrow").remove();
          window.krypbotUpdateUI();
          pushToServer();
        });

        $('input[name="kb-auto-move"]').on("change", function () {
          auto_move = $(this).val() == "1";
          window.krypbotUpdateUI();
          pushToServer();
        });

        $('input[name="kb-auto-queue"]').on("change", function () {
          auto_queue = $(this).val() == "1";
          localStorage.setItem("kb-auto-queue", auto_queue ? "true" : "false");
          handleAutoQueue();
          window.krypbotUpdateUI();
          pushToServer();
        });

        $('input[name="kb-puzzle-hint"]').on("change", function () {
          puzzleHint = $(this).val() == "1";
          if (!puzzleHint) $(".myhigh, .myarrow").remove();
          window.krypbotUpdateUI();
        });

        $('input[name="kb-puzzle-auto"]').on("change", function () {
          puzzleAutoMove = $(this).val() == "1";
          window.krypbotUpdateUI();
        });

        $('input[name="kb-auto-adjust"]').on("change", function () {
          if ($(this).val() == "1") {
            autoAdjust.updateBaseElo(chessBot.elo);
            autoAdjust.enable();
          } else {
            autoAdjust.disable();
          }
          window.krypbotUpdateUI();
          pushToServer();
        });

        $("#minDelayInput, #maxDelayInput").on("input change", function () {
          let min = parseFloat($("#minDelayInput").val()) || 0.1;
          let max = parseFloat($("#maxDelayInput").val()) || 0.1;
          if (min > max) {
            autoDelayMin = max;
            autoDelayMax = min;
          } else {
            autoDelayMin = min;
            autoDelayMax = max;
          }
          localStorage.setItem("autoMinDelay", autoDelayMin);
          localStorage.setItem("autoMaxDelay", autoDelayMax);
          $("#autoDelayDisplay").text(
            `${autoDelayMin.toFixed(2)} - ${autoDelayMax.toFixed(2)}s`,
          );
          pushToServer();
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

        // --- EVAL BAR TOGGLE ---
        $('input[name="kb-eval-bar"]').on("change", function () {
          evalBarEnabled = $(this).val() === "1";
          localStorage.setItem("evalBar", evalBarEnabled);
          if (evalBarEnabled) {
            injectEvalBarDOM();
            lastEvalFen = ""; // force re-request
          } else {
            removeEvalBarDOM();
          }
          window.krypbotUpdateUI();
          pushToServer();
        });

        // Inicializar estado da Eval Bar
        if (evalBarEnabled) {
          $(`input[name="kb-eval-bar"][value="1"]`).prop("checked", true);
          // Injetar DOM imediatamente (nao esperar o primeiro eval)
          setTimeout(() => {
            injectEvalBarDOM();
          }, 1500);
        }

        $("input[name='delayMode']").on("change", function () {
          autoDelayMode = $(this).val();
          localStorage.setItem("autoDelayMode", autoDelayMode);

          if (autoDelayMode === "max") {
            autoDelayMin = 0;
            autoDelayMax = 0;
            localStorage.setItem("autoMinDelay", 0);
            localStorage.setItem("autoMaxDelay", 0);
            $(".kb-num-input").val("0.00").css({
              "border-color": "#fff",
              "box-shadow": "0 0 8px rgba(255,255,255,0.6)",
              color: "#fff",
            });
            $("#autoDelayDisplay").text("INSTANT");
          } else {
            // Restaurar valores padrão ao voltar para Random/Avg
            autoDelayMin = 0.5;
            autoDelayMax = 1.0;
            localStorage.setItem("autoMinDelay", 0.5);
            localStorage.setItem("autoMaxDelay", 1.0);
            $(".kb-num-input").val("").css({
              "border-color": "#333",
              "box-shadow": "none",
              color: "#fff",
            });
            $("#minDelayInput").val("0.50").css("color", "#fff");
            $("#maxDelayInput").val("1.00").css("color", "#fff");
            $("#autoDelayDisplay").text("0.50 - 1.00s");
          }

          window.krypbotUpdateUI();
          pushToServer();
        });

        $("#kb-elo-slider").on("input", function () {
          chessBot.elo = parseInt($(this).val());
          autoAdjust.updateBaseElo(chessBot.elo);
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
            if (autoAdjust.isEnabled()) {
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
                if (gameMode === "play") autoAdjust.recordResult("W");
              } else if (text.includes("draw") || text.includes("empate")) {
                updateMySession("D");
              } else if (
                text.includes("loss") ||
                text.includes("lost") ||
                text.includes("derrota")
              ) {
                updateMySession("L");
                if (gameMode === "play") autoAdjust.recordResult("L");
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

          // Only apply values if menu exists (createMenu already ran)
          if (!$("#krypbot-container").length) return;

          // Bot Status
          if (typeof s.hint === "boolean" && hint !== s.hint) {
            hint = s.hint;
            $('input[name="kb-bot-status"][value="' + (hint ? "1" : "0") + '"]').prop("checked", true);
            if (!hint) $(".myhigh, .myarrow").remove();
          }
          // Auto Moves
          if (typeof s.autoMove === "boolean" && auto_move !== s.autoMove) {
            auto_move = s.autoMove;
            $('input[name="kb-auto-move"][value="' + (auto_move ? "1" : "0") + '"]').prop("checked", true);
          }
          // Auto Queue
          if (typeof s.autoQueue === "boolean" && auto_queue !== s.autoQueue) {
            auto_queue = s.autoQueue;
            localStorage.setItem("kb-auto-queue", auto_queue ? "true" : "false");
            $('input[name="kb-auto-queue"][value="' + (auto_queue ? "1" : "0") + '"]').prop("checked", true);
            handleAutoQueue();
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
            if (evalBarEnabled) { injectEvalBarDOM(); lastEvalFen = ""; } else { removeEvalBarDOM(); }
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
            autoAdjust.updateBaseElo(s.elo);
          }
          // Delay Mode
          if (s.delayMode && autoDelayMode !== s.delayMode) {
            autoDelayMode = s.delayMode;
            localStorage.setItem("autoDelayMode", autoDelayMode);
            $('input[name="delayMode"][value="' + autoDelayMode + '"]').prop("checked", true);
          }
          // Min Delay
          if (typeof s.minDelay === "number" && autoDelayMin !== s.minDelay) {
            autoDelayMin = s.minDelay;
            localStorage.setItem("autoMinDelay", autoDelayMin);
            $("#minDelayInput").val(autoDelayMin.toFixed(2));
          }
          // Max Delay
          if (typeof s.maxDelay === "number" && autoDelayMax !== s.maxDelay) {
            autoDelayMax = s.maxDelay;
            localStorage.setItem("autoMaxDelay", autoDelayMax);
            $("#maxDelayInput").val(autoDelayMax.toFixed(2));
          }
          $("#autoDelayDisplay").text(autoDelayMode === "max" ? "INSTANT" : autoDelayMin.toFixed(2) + " - " + autoDelayMax.toFixed(2) + "s");
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

    try {
      ensureThinkerLauncher();
      attemptThinkerUiMount();
    } catch (error) {
      failThinkerUiMount(error);
    }
    thinkerShellWatchTimer = window.setInterval(() => {
      if (!document.body) return;
      if (!isThinkerSupportedRoute()) {
        const menu = document.getElementById("krypbot-container");
        const wrapper = document.getElementById("oi-wrapper");
        const banner = document.getElementById("thinker-chess-banner");
        const launcher = document.getElementById("thinker-chess-launcher");
        if (menu) menu.style.display = "none";
        if (wrapper) wrapper.style.display = "none";
        if (banner) banner.style.display = "none";
        if (launcher) launcher.style.display = "none";
        return;
      }
      try {
        reconcileThinkerUiShells();
        const menu = document.getElementById("krypbot-container");
        const banner = document.getElementById("thinker-chess-banner");
        const launcher = document.getElementById("thinker-chess-launcher");
        if (menu && banner && launcher && thinkerUiBound) {
          thinkerShellMissingTicks = 0;
          if (banner.style.display === "none" && !_ghostModeActive) positionThinkerBannerShell();
          positionThinkerLauncher();
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
        if (puzzleHint || puzzleAutoMove) request_move();
      } else {
        if (hint) request_move();
      }
    }, 10);
  }

  function maybeStartThinkerUserscript() {
    if (!thinkerUserscriptStarted && isThinkerSupportedRoute()) {
      startThinkerUserscript();
    }
  }

  function installThinkerRouteBootstrap() {
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
