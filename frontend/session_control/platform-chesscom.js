"use strict";

const { canonicalStringify, exactKeys } = require("./models");

const ASCII_USERNAME = /^[A-Za-z0-9_-]{1,50}$/;
const LIVE_TIME_CLASSES = Object.freeze(["bullet", "blitz", "rapid"]);
const ACTIVE_QUEUE_SELECTORS = Object.freeze([
  '[aria-selected="true"]',
  '[aria-checked="true"]',
  '[data-active="true"]',
  '[data-state="active"]',
  '[data-state="selected"]',
  '[role="tab"].active',
  '[role="radio"].active',
]);
const SUMMARY_CONTROL_SELECTORS = Object.freeze([
  "button",
  '[role="button"]',
  '[aria-haspopup="listbox"]',
  '[aria-haspopup="menu"]',
]);

function isEligibleTopLevelContext(locationObject, windowObject) {
  if (!locationObject || !windowObject) return false;
  try {
    return locationObject.protocol === "https:" && locationObject.hostname === "www.chess.com" && locationObject.origin === "https://www.chess.com" && windowObject.self === windowObject.top;
  } catch (_) {
    return false;
  }
}

function normalizeUsername(value) {
  if (typeof value !== "string") throw new TypeError("username must be a string");
  const normalized = value.normalize("NFKC").toLowerCase();
  if (!ASCII_USERNAME.test(normalized)) throw new TypeError("username is not a canonical ASCII identity");
  return normalized;
}

function bytesToHex(bytes) {
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

async function accountKeyForUsername(username, cryptoObject) {
  if (!cryptoObject || !cryptoObject.subtle) throw new TypeError("Web Crypto is required");
  const digest = await cryptoObject.subtle.digest("SHA-256", new TextEncoder().encode(`chess.com:${normalizeUsername(username)}`));
  return bytesToHex(new Uint8Array(digest));
}

function canonicalGameIdFromUrl(value) {
  const url = new URL(value, "https://www.chess.com");
  if (url.origin !== "https://www.chess.com") return null;
  const match = url.pathname.match(/^\/game\/(?:live|daily)\/([A-Za-z0-9_-]+)\/?$/);
  return match ? match[1] : null;
}

function timeClassesInText(value) {
  const text = String(value || "").normalize("NFKC").toLowerCase();
  return LIVE_TIME_CLASSES.filter((timeClass) => new RegExp(`(^|[^a-z])${timeClass}([^a-z]|$)`).test(text));
}

function elementTimeClasses(element) {
  if (!element || typeof element !== "object") return [];
  const values = [];
  for (const name of ["data-time-class", "data-time-control", "data-category", "data-tab", "aria-label", "title"]) {
    if (typeof element.getAttribute === "function") values.push(element.getAttribute(name));
  }
  if (typeof element.className === "string") values.push(element.className);
  if (typeof element.textContent === "string") values.push(element.textContent);
  return Array.from(new Set(values.flatMap(timeClassesInText)));
}

function activeTimeClassCandidates(root) {
  if (!root || typeof root.querySelectorAll !== "function") return [];
  const nodes = [];
  for (const selector of ACTIVE_QUEUE_SELECTORS) {
    try { nodes.push(...root.querySelectorAll(selector)); } catch (_) {}
  }
  return Array.from(new Set(nodes.flatMap(elementTimeClasses)));
}

function normalizedControlText(element) {
  if (!element || typeof element !== "object") return "";
  const values = [element.textContent, element.value];
  if (typeof element.getAttribute === "function") {
    for (const name of ["aria-label", "title", "value"]) values.push(element.getAttribute(name));
  }
  const value = values.find((candidate) => typeof candidate === "string" && candidate.trim());
  return typeof value === "string" ? value.normalize("NFKC").replace(/\s+/g, " ").trim().toLowerCase() : "";
}

function parseSummaryTimeClass(text) {
  const minuteMatch = text.match(/^(\d{1,3})\s*(?:min(?:ute)?s?)\s*\(\s*(bullet|blitz|rapid)\s*\)$/);
  if (minuteMatch && Number(minuteMatch[1]) >= 1 && Number(minuteMatch[1]) <= 180) return minuteMatch[2];
  const incrementMatch = text.match(/^(\d{1,3})\s*[|+]\s*(\d{1,2})\s*\(\s*(bullet|blitz|rapid)\s*\)$/);
  if (incrementMatch && Number(incrementMatch[1]) >= 1 && Number(incrementMatch[1]) <= 180 && Number(incrementMatch[2]) <= 60) return incrementMatch[3];
  const clockMatch = text.match(/^(\d{1,2}):(\d{2})\s*\(\s*(bullet|blitz|rapid)\s*\)$/);
  if (clockMatch && Number(clockMatch[2]) <= 59 && Number(clockMatch[1]) + Number(clockMatch[2]) > 0) return clockMatch[3];
  return null;
}

function hasClockLikeText(text) {
  return /\d{1,3}\s*(?:min(?:ute)?s?|[|+]\s*\d{1,2})|\d{1,2}:\d{2}/.test(text);
}

function isHiddenControl(element) {
  if (!element || typeof element !== "object") return true;
  for (let node = element; node && typeof node === "object"; node = node.parentElement) {
    if (node.hidden === true || node.disabled === true) return true;
    if (typeof node.getAttribute === "function") {
      if (node.getAttribute("hidden") !== null || node.getAttribute("disabled") !== null || node.getAttribute("inert") !== null) return true;
      if (["aria-hidden", "aria-disabled"].some((name) => String(node.getAttribute(name) || "").toLowerCase() === "true")) return true;
      if (String(node.getAttribute("type") || "").toLowerCase() === "hidden") return true;
      if (/(?:^|;)\s*(?:display\s*:\s*none|visibility\s*:\s*(?:hidden|collapse)|content-visibility\s*:\s*hidden|opacity\s*:\s*0)(?:\s*!important)?\s*(?:;|$)/i.test(String(node.getAttribute("style") || ""))) return true;
    }
    const view = node.ownerDocument && node.ownerDocument.defaultView;
    if (view && typeof view.getComputedStyle === "function") {
      const style = view.getComputedStyle(node);
      if (style && (style.display === "none" || ["hidden", "collapse"].includes(style.visibility) || style.contentVisibility === "hidden" || Number(style.opacity) === 0)) return true;
    }
  }
  return element.isConnected === true && typeof element.getClientRects === "function" && element.getClientRects().length === 0;
}

function summaryTimeClassEvidence(root, targetButton) {
  if (!root || typeof root.querySelectorAll !== "function") return { valid: true, candidates: [] };
  const nodes = [];
  for (const selector of SUMMARY_CONTROL_SELECTORS) {
    try { nodes.push(...root.querySelectorAll(selector)); } catch (_) {}
  }
  const candidates = [];
  for (const node of new Set(nodes)) {
    const overlapsTarget = node === targetButton || (typeof targetButton.contains === "function" && targetButton.contains(node)) || (typeof node.contains === "function" && node.contains(targetButton));
    if (overlapsTarget || isHiddenControl(node)) continue;
    const text = normalizedControlText(node);
    if (!text || text.length > 80 || !hasClockLikeText(text)) continue;
    const timeClass = parseSummaryTimeClass(text);
    if (!timeClass) return { valid: false, candidates: [] };
    candidates.push(timeClass);
  }
  return { valid: candidates.length <= 1, candidates };
}

function observeQueueContext(target) {
  if (!target || !["modal", "sidebar-start-game", "sidebar-new-game", "sidebar-plus"].includes(target.source) || !target.button) return null;
  const localRoot = target.root || target.button.parentElement;
  const summaryEvidence = summaryTimeClassEvidence(localRoot, target.button);
  if (!summaryEvidence.valid) return null;
  const candidates = Array.from(new Set([...activeTimeClassCandidates(localRoot), ...summaryEvidence.candidates]));
  if (candidates.length !== 1) return null;
  const timeClass = candidates[0];
  const scopeId = `chesscom-live-${timeClass}-v1`;
  return Object.freeze({
    schemaVersion: 1,
    timeClass,
    contextClass: `chesscom-queue-${target.source}-v1`,
    poolId: scopeId,
    opponentRatingScaleId: scopeId,
    sourceVersion: "chesscom-queue-context-v1",
  });
}

function validatePlatformObservation(input) {
  exactKeys(input, ["schemaVersion", "canonicalPlatformGameId", "accountKey", "opponentKey", "opponentRating", "opponentRatingScaleId", "userSide", "contextClass", "poolId", "rated", "observedAtEpochMs", "sourceVersion"], [], "platformObservation");
  if (input.schemaVersion !== 1) throw new TypeError("platformObservation.schemaVersion is unsupported");
  for (const field of ["canonicalPlatformGameId", "accountKey", "opponentKey", "opponentRatingScaleId", "contextClass", "poolId", "sourceVersion"]) if (typeof input[field] !== "string" || !input[field]) throw new TypeError(`platformObservation.${field} is required`);
  if (!Number.isInteger(input.opponentRating) || input.opponentRating < 1) throw new TypeError("platformObservation.opponentRating is invalid");
  if (!["white", "black"].includes(input.userSide)) throw new TypeError("platformObservation.userSide is invalid");
  if (typeof input.rated !== "boolean") throw new TypeError("platformObservation.rated must be boolean");
  if (!Number.isInteger(input.observedAtEpochMs) || input.observedAtEpochMs < 0) throw new TypeError("platformObservation.observedAtEpochMs is invalid");
  return Object.freeze({ ...input });
}

function validateTerminalObservation(input) {
  exactKeys(input, ["schemaVersion", "canonicalPlatformGameId", "accountKey", "userSide", "outcome", "termination", "source", "observedAtEpochMs", "proofDigest"], [], "terminalObservation");
  if (input.schemaVersion !== 1 || !["W", "D", "L"].includes(input.outcome)) throw new TypeError("terminalObservation is invalid");
  for (const field of ["canonicalPlatformGameId", "accountKey", "termination", "source", "proofDigest"]) if (typeof input[field] !== "string" || !input[field]) throw new TypeError(`terminalObservation.${field} is required`);
  if (!["white", "black"].includes(input.userSide)) throw new TypeError("terminalObservation.userSide is invalid");
  if (!Number.isInteger(input.observedAtEpochMs) || input.observedAtEpochMs < 0) throw new TypeError("terminalObservation.observedAtEpochMs is invalid");
  return Object.freeze({ ...input });
}

class StableEvidenceTracker {
  constructor(validator, minimumSeparationMs = 250) {
    this.validator = validator;
    this.minimumSeparationMs = minimumSeparationMs;
    this.previous = null;
    this.identity = null;
  }

  observe(raw) {
    const observation = this.validator(raw);
    const identity = { ...observation };
    delete identity.observedAtEpochMs;
    const canonical = canonicalStringify(identity);
    const stable = this.previous !== null && this.identity === canonical && observation.observedAtEpochMs - this.previous.observedAtEpochMs >= this.minimumSeparationMs;
    this.previous = observation;
    this.identity = canonical;
    return Object.freeze({ stable, observation });
  }

  reset() {
    this.previous = null;
    this.identity = null;
  }
}

module.exports = { LIVE_TIME_CLASSES, StableEvidenceTracker, accountKeyForUsername, canonicalGameIdFromUrl, isEligibleTopLevelContext, normalizeUsername, observeQueueContext, validatePlatformObservation, validateTerminalObservation };
