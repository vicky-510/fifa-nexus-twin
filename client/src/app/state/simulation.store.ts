import { Injectable, signal, computed, inject } from '@angular/core';
import { SimulationService, SimulationRecord, SimulationResult } from '../core/services/simulation.service';
import { finalize } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SimulationStore {
  private simService = inject(SimulationService);

  // Core signals
  readonly history = signal<SimulationRecord[]>([]);
  readonly activeScenario = signal<string | null>(null);
  readonly latestResult = signal<SimulationResult | null>(null);
  
  // Streaming signals
  readonly isStreaming = signal<boolean>(false);
  readonly streamText = signal<string>('');
  
  // Loading flags
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  /**
   * Loads historical runs from database
   */
  loadHistory(scenario?: string): void {
    this.isLoading.set(true);
    this.error.set(null);
    
    this.simService.getHistory(scenario).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (data) => {
        this.history.set(data);
        if (data.length > 0 && !this.latestResult()) {
          // Set the first item as default latest result
          this.latestResult.set(data[0].result);
          this.activeScenario.set(data[0].scenario);
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
  triggerSync(scenario: string): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.activeScenario.set(scenario);
    this.latestResult.set(null);
    this.streamText.set('');

    this.simService.trigger(scenario).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (record) => {
        this.latestResult.set(record.result);
        this.loadHistory();
      },
      error: (err) => {
        this.error.set('Failed to run simulation. Check connection.');
      }
    });
  }

  /**
   * Triggers SSE stream generation
   */
  async triggerStream(scenario: string): Promise<void> {
    this.isStreaming.set(true);
    this.isLoading.set(true);
    this.error.set(null);
    this.activeScenario.set(scenario);
    this.latestResult.set(null);
    this.streamText.set('');

    await this.simService.triggerStream(
      scenario,
      (chunk) => {
        if (chunk.text) {
          this.streamText.update(t => t + chunk.text);
        }
        if (chunk.done && chunk.record) {
          this.latestResult.set(chunk.record.result);
          this.loadHistory();
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
   * Selects an entry from the history log to display on dashboard panels
   */
  selectRecord(record: SimulationRecord): void {
    this.latestResult.set(record.result);
    this.activeScenario.set(record.scenario);
  }
}
