import { Injectable, signal, computed, inject } from '@angular/core';
import {
  SimulationService,
  SimulationRecord,
  SimulationResult,
  TimelineEntry,
  PredictiveForecast
} from '../core/services/simulation.service';
import { finalize } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SimulationStore {
  private simService = inject(SimulationService);

  // Core signals
  readonly history = signal<SimulationRecord[]>([]);
  readonly activeScenario = signal<string | null>(null);
  readonly activeSimulationId = signal<number | null>(null);
  readonly latestResult = signal<SimulationResult | null>(null);
  readonly crisisTimeline = signal<TimelineEntry[]>([]);

  // Streaming signals
  readonly isStreaming = signal<boolean>(false);
  readonly streamText = signal<string>('');

  // Predictive mode signals
  readonly predictiveForecast = signal<PredictiveForecast | null>(null);
  readonly isPredicting = signal<boolean>(false);

  // Loading flags
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  readonly severity = computed(() => this.latestResult()?.severity || null);

  /**
   * Loads historical runs from database, scoped to a stadium
   */
  loadHistory(stadiumId?: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.simService.getHistory(undefined, stadiumId).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (data) => {
        this.history.set(data);
        if (data.length > 0 && !this.latestResult()) {
          this.selectRecord(data[0]);
        }
      },
      error: (err) => {
        this.error.set('Failed to load simulation history.');
      }
    });
  }

  /**
   * Triggers a synchronous simulation
   */
  triggerSync(stadiumId: string, scenario: string): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.activeScenario.set(scenario);
    this.latestResult.set(null);
    this.streamText.set('');
    this.crisisTimeline.set([]);

    this.simService.trigger(stadiumId, scenario).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (record) => this.applyRecord(record, true),
      error: (err) => {
        this.error.set('Failed to run simulation. Check connection.');
      }
    });
  }

  /**
   * Triggers SSE stream generation
   */
  async triggerStream(stadiumId: string, scenario: string): Promise<void> {
    this.isStreaming.set(true);
    this.isLoading.set(true);
    this.error.set(null);
    this.activeScenario.set(scenario);
    this.latestResult.set(null);
    this.streamText.set('');
    this.crisisTimeline.set([]);

    await this.simService.triggerStream(
      stadiumId,
      scenario,
      (chunk) => {
        if (chunk.text) {
          this.streamText.update(t => t + chunk.text);
        }
        if (chunk.done && chunk.record) {
          this.applyRecord(chunk.record, true);
        }
        if (chunk.error) {
          this.error.set(chunk.error);
        }
      },
      () => {
        this.isStreaming.set(false);
        this.isLoading.set(false);
      },
      (err) => {
        this.error.set('Connection to simulation stream lost.');
        this.isStreaming.set(false);
        this.isLoading.set(false);
      }
    );
  }

  /**
   * Escalates the active crisis to the next severity level
   */
  escalate(): void {
    const id = this.activeSimulationId();
    if (!id) return;

    this.isLoading.set(true);
    this.error.set(null);

    this.simService.escalate(id).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (record) => this.applyRecord(record, true),
      error: () => this.error.set('Failed to escalate crisis.')
    });
  }

  /**
   * Generates a predictive risk forecast for a stadium (not persisted)
   */
  predictRisk(stadiumId: string): void {
    this.isPredicting.set(true);
    this.predictiveForecast.set(null);

    this.simService.predict(stadiumId).pipe(
      finalize(() => this.isPredicting.set(false))
    ).subscribe({
      next: (forecast) => this.predictiveForecast.set(forecast),
      error: () => this.error.set('Failed to generate predictive risk forecast.')
    });
  }

  /**
   * Appends a manual note to the active crisis timeline
   */
  addManualNote(message: string): void {
    const id = this.activeSimulationId();
    if (!id || !message.trim()) return;

    this.simService.addTimelineEntry(id, 'note', message.trim()).subscribe({
      next: (record) => this.crisisTimeline.set(record.timeline || []),
      error: () => this.error.set('Failed to add timeline note.')
    });
  }

  /**
   * Selects an entry from the history log to display on dashboard panels
   */
  selectRecord(record: SimulationRecord): void {
    this.applyRecord(record);
  }

  private applyRecord(record: SimulationRecord, refreshHistory = false): void {
    this.latestResult.set(record.result);
    this.activeScenario.set(record.scenario);
    this.activeSimulationId.set(record.id);
    this.crisisTimeline.set(record.timeline || []);
    if (refreshHistory) {
      this.loadHistory(record.stadium_id || undefined);
    }
  }
}
