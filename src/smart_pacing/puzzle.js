function decidePuzzleDelay({ configuredDelayMs = 0, autoMove = false }) {
  const delayMs = Number.isFinite(configuredDelayMs) ? Math.max(0, Math.round(configuredDelayMs)) : 0;
  return Object.freeze({ policyVersion: 1, namespace: "puzzle", delayMs: autoMove ? delayMs : 0, updatesCompetitiveSession: false });
}

module.exports = { decidePuzzleDelay };
