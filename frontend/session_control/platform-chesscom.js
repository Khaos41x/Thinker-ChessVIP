"use strict";

const { canonicalStringify, exactKeys } = require("./models");

const ASCII_USERNAME = /^[A-Za-z0-9_-]{1,50}$/;

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

module.exports = { StableEvidenceTracker, accountKeyForUsername, canonicalGameIdFromUrl, isEligibleTopLevelContext, normalizeUsername, validatePlatformObservation, validateTerminalObservation };
