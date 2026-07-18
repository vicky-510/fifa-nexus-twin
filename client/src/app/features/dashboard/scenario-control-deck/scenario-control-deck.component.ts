import { Component, signal, inject, Input, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimulationStore } from '../../../state/simulation.store';
import { StadiumStore } from '../../../state/stadium.store';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-scenario-control-deck',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur shadow-lg flex flex-col justify-between h-full">
      <div>
        <h2 class="text-md font-bold uppercase tracking-wider text-amber-500 mb-4 flex items-center space-x-2">
          <span class="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" aria-hidden="true"></span>
          <span>Crisis Simulation Deck</span>
        </h2>

        <p class="text-xs text-slate-400 mb-5">
          Select a crisis vector relevant to this stadium's risk profile. GenAI will orchestrate 8-agency directives.
        </p>

        <!-- Scenario Choices (data-driven from stadium.availableCrisisIds) -->
        <div class="space-y-2 mb-6 max-h-[260px] overflow-y-auto pr-1" role="radiogroup" aria-label="Crisis scenario selection">
          @for (s of stadiumStore.availableScenarios(); track s.id) {
            <button
              type="button"
              (click)="selectedScenario.set(s.id)"
              role="radio"
              [attr.aria-checked]="selectedScenario() === s.id"
              [class.border-amber-500]="selectedScenario() === s.id"
              [class.bg-slate-800\/80]="selectedScenario() === s.id"
              [class.text-white]="selectedScenario() === s.id"
              [class.border-slate-800]="selectedScenario() !== s.id"
              [class.bg-slate-950\/30]="selectedScenario() !== s.id"
              class="w-full text-left p-3 rounded-lg border hover:border-slate-600 transition-all duration-150 flex items-start space-x-3 group cursor-pointer"
            >
              <span class="text-lg leading-none mt-0.5" aria-hidden="true">{{ s.icon }}</span>
              <div>
                <div class="font-semibold text-sm group-hover:text-amber-400 transition-colors">{{ s.label }}</div>
                <div class="text-[10px] text-slate-400 mt-0.5">{{ s.category }} · Level {{ s.severityLevel }}</div>
              </div>
            </button>
          } @empty {
            <div class="text-xs text-slate-500 italic py-4 text-center">Loading crisis scenarios for this venue...</div>
          }
        </div>

        <!-- Mode Selection -->
        <div class="bg-slate-950/40 border border-slate-800/80 p-3.5 rounded-lg mb-4">
          <span id="execModeLabel" class="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Execution Mode</span>
          <div class="grid grid-cols-2 gap-2" role="group" aria-labelledby="execModeLabel">
            <button
              type="button"
              (click)="streamMode.set(true)"
              [attr.aria-pressed]="streamMode()"
              [class.bg-slate-800]="streamMode()"
              [class.text-amber-400]="streamMode()"
              [class.border-slate-700]="streamMode()"
              [class.border-slate-850]="!streamMode()"
              class="px-3 py-2 border rounded-md text-xs font-semibold hover:border-slate-600 transition-all cursor-pointer"
            >
              Stream SSE (Live)
            </button>
            <button
              type="button"
              (click)="streamMode.set(false)"
              [attr.aria-pressed]="!streamMode()"
              [class.bg-slate-800]="!streamMode()"
              [class.text-amber-400]="!streamMode()"
              [class.border-slate-700]="!streamMode()"
              [class.border-slate-850]="streamMode()"
              class="px-3 py-2 border rounded-md text-xs font-semibold hover:border-slate-600 transition-all cursor-pointer"
            >
              Sync (Standard)
            </button>
          </div>
        </div>
      </div>

      <div class="space-y-2">
        @if (authService.isGuest()) {
          <p role="note" class="text-[10px] text-slate-500 italic text-center pb-1">
            <span aria-hidden="true">🔒</span> Read-only guest session — triggering is reserved for authenticated ops staff.
          </p>
        }

        <!-- Trigger Action Button -->
        <button
          type="button"
          (click)="onTrigger()"
          [disabled]="isReadOnly() || store.isLoading() || !selectedScenario()"
          [attr.aria-busy]="store.isLoading()"
          class="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold py-3 rounded-lg flex items-center justify-center space-x-2 cursor-pointer shadow-md active:scale-[0.98] transition-all"
        >
          <span *ngIf="store.isLoading()" class="animate-spin rounded-full h-4.5 w-4.5 border-2 border-slate-950 border-t-transparent" aria-hidden="true"></span>
          <span>{{ store.isLoading() ? 'Running Engine...' : 'Trigger Ops Directive' }}</span>
        </button>

        <!-- Escalate / Predict -->
        <div class="grid grid-cols-2 gap-2">
          <button
            type="button"
            (click)="store.escalate()"
            [disabled]="isReadOnly() || !store.activeSimulationId() || store.isLoading()"
            aria-label="Escalate active crisis"
            class="px-3 py-2.5 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-40 border border-red-500/30 text-red-400 font-bold rounded-lg text-xs uppercase tracking-wider cursor-pointer transition-all"
          >
            <span aria-hidden="true">⚠️</span> Escalate
          </button>
          <button
            type="button"
            (click)="onPredict()"
            [disabled]="isReadOnly() || store.isPredicting()"
            [attr.aria-busy]="store.isPredicting()"
            aria-label="Predict operational risk"
            class="px-3 py-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 disabled:opacity-40 border border-cyan-500/30 text-cyan-400 font-bold rounded-lg text-xs uppercase tracking-wider cursor-pointer transition-all"
          >
            <span aria-hidden="true">🔮</span> {{ store.isPredicting() ? 'Predicting...' : 'Predict Risk' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class ScenarioControlDeckComponent {
  store = inject(SimulationStore);
  stadiumStore = inject(StadiumStore);
  authService = inject(AuthService);

  @Input() stadiumId: string | null = null;
  isReadOnly = this.authService.isGuest;

  selectedScenario = signal<string>('');
  streamMode = signal<boolean>(true);

  constructor() {
    // Auto-select the first relevant scenario whenever the stadium's list loads/changes
    effect(() => {
      const scenarios = this.stadiumStore.availableScenarios();
      const current = this.selectedScenario();
      if (scenarios.length > 0 && !scenarios.some(s => s.id === current)) {
        this.selectedScenario.set(scenarios[0].id);
      }
    });
  }

  onTrigger(): void {
    const scenario = this.selectedScenario();
    const stadiumId = this.stadiumId;
    if (!scenario || !stadiumId) return;

    if (this.streamMode()) {
      this.store.triggerStream(stadiumId, scenario);
    } else {
      this.store.triggerSync(stadiumId, scenario);
    }
  }

  onPredict(): void {
    if (this.stadiumId) {
      this.store.predictRisk(this.stadiumId);
    }
  }
}
