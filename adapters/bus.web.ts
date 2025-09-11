// adapters/bus.web.ts
// Cross-tab communication for orchestrator telemetry

import { getLogger } from '@qvlt/core-logger';

export interface TelemetryEvent {
  type: 'job-progress' | 'job-started' | 'job-completed' | 'job-failed';
  jobId: string;
  timestamp: number;
  data?: Record<string, unknown>;
}

export class TelemetryBus {
  private channel = 'qvlt-orchestrator-telemetry';
  private bc: BroadcastChannel | null = null;
  private listeners = new Set<(event: TelemetryEvent) => void>();

  constructor() {
    if (typeof BroadcastChannel !== 'undefined') {
      this.bc = new BroadcastChannel(this.channel);
      this.bc.addEventListener('message', this.handleMessage.bind(this));
    }
  }

  private handleMessage = (event: MessageEvent) => {
    try {
      const telemetryEvent = event.data as TelemetryEvent;
      if (this.isValidTelemetryEvent(telemetryEvent)) {
        this.listeners.forEach((listener) => listener(telemetryEvent));
      }
    } catch (error) {
      getLogger('telemetry-bus').warn('Failed to handle telemetry message', { error: String(error) });
    }
  };

  private isValidTelemetryEvent(event: unknown): event is TelemetryEvent {
    return (
      event &&
      typeof event === 'object' &&
      typeof event.type === 'string' &&
      typeof event.jobId === 'string' &&
      typeof event.timestamp === 'number' &&
      ['job-progress', 'job-started', 'job-completed', 'job-failed'].includes(event.type)
    );
  }

  /**
   * Emit a telemetry event to all tabs
   */
  emit(event: TelemetryEvent): void {
    if (this.bc) {
      try {
        this.bc.postMessage(event);
      } catch (error) {
        getLogger('telemetry-bus').warn('Failed to emit telemetry event', { error: String(error) });
      }
    }
  }

  /**
   * Listen for telemetry events from all tabs
   */
  on(listener: (event: TelemetryEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Clean up the broadcast channel
   */
  dispose(): void {
    if (this.bc) {
      this.bc.removeEventListener('message', this.handleMessage);
      this.bc.close();
      this.bc = null;
    }
    this.listeners.clear();
  }
}

// Singleton instance for the orchestrator
let telemetryBusInstance: TelemetryBus | null = null;

export function getTelemetryBus(): TelemetryBus {
  if (!telemetryBusInstance) {
    telemetryBusInstance = new TelemetryBus();
  }
  return telemetryBusInstance;
}

export function disposeTelemetryBus(): void {
  if (telemetryBusInstance) {
    telemetryBusInstance.dispose();
    telemetryBusInstance = null;
  }
}
