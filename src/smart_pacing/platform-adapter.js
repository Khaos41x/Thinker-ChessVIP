class PlatformAdapter {
  constructor({ observePosition, observeClocks, executeMove, isEnabled }) {
    this.observePosition = observePosition;
    this.observeClocks = observeClocks;
    this.executeMove = executeMove;
    this.isEnabled = isEnabled;
  }

  executeGuarded(decision, expected) {
    const current = this.observePosition();
    if (!this.isEnabled()) return false;
    if (!current || current.runtimeGameToken !== expected.runtimeGameToken) return false;
    if (current.positionRevision !== expected.positionRevision) return false;
    if (current.observationKey !== decision.observationKey) return false;
    return this.executeMove(decision.move);
  }
}

module.exports = { PlatformAdapter };
