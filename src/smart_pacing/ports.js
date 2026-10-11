class MemorySettingsPort {
  constructor(initial = { schemaVersion: 1, smartPacingV2: false, shadowMode: false }) {
    this.value = { ...initial };
  }
  async load() { return { ...this.value }; }
  async save(settings) { this.value = { ...settings, schemaVersion: 1 }; }
  async reset() { this.value = { schemaVersion: 1, smartPacingV2: false, shadowMode: false }; }
}

class NullTelemetryAdapter {
  async append() {}
  async export() { return "[]"; }
  async clear() {}
  async getRetentionInfo() { return { bounded: true, count: 0, rawFen: false }; }
}

class BoundedMemoryTelemetryAdapter {
  constructor(capacity = 500) { this.capacity = Math.max(1, capacity); this.events = []; }
  async append(event) {
    const safe = { ...event };
    delete safe.fen;
    delete safe.username;
    delete safe.opponentUsername;
    this.events.push(safe);
    this.events = this.events.slice(-this.capacity);
  }
  async export() { return JSON.stringify(this.events); }
  async clear() { this.events = []; }
  async getRetentionInfo() { return { bounded: true, count: this.events.length, rawFen: false }; }
}

module.exports = { BoundedMemoryTelemetryAdapter, MemorySettingsPort, NullTelemetryAdapter };
