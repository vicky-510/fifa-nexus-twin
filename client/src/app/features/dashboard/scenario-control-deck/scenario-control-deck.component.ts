import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimulationStore } from '../../../state/simulation.store';

@Component({
  selector: 'app-scenario-control-deck',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur shadow-lg flex flex-col justify-between h-full">
      <div>
        <h2 class="text-md font-bold uppercase tracking-wider text-amber-500 mb-4 flex items-center space-x-2">
          <span class="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
          <span>Crisis Simulation Deck</span>
        </h2>
        
        <p class="text-xs text-slate-400 mb-5">
          Select a tournament operations crisis vector to execute. GenAI will orchestrate stadium redirections, accessibility guides, and multilingual announcements.
        </p>

        <!-- Scenario Choices -->
        <div class="space-y-3 mb-6">
          <button 
            *ngFor="let s of scenarios"
            (click)="selectedScenario.set(s.id)"
            [class.border-red-500]="selectedScenario() === s.id && s.id === 'stormInundation'"
            [class.border-amber-500]="selectedScenario() === s.id && (s.id === 'exitSurge' || s.id === 'gridlockOutage')"
            [class.bg-slate-800\/80]="selectedScenario() === s.id"
            [class.text-white]="selectedScenario() === s.id"
            [class.border-slate-800]="selectedScenario() !== s.id"
            [class.bg-slate-950\/30]="selectedScenario() !== s.id"
            class="w-full text-left p-3.5 rounded-lg border hover:border-slate-600 transition-all duration-150 flex items-start space-x-3 group cursor-pointer"
          >
            <div 
              [class.bg-red-500\/10]="s.id === 'stormInundation'"
              [class.text-red-400]="s.id === 'stormInundation'"
              [class.bg-amber-500\/10]="s.id !== 'stormInundation'"
              [class.text-amber-400]="s.id !== 'stormInundation'"
              class="p-2 rounded"
            >
              <svg *ngIf="s.id === 'exitSurge'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
              </svg>
              <svg *ngIf="s.id === 'stormInundation'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15a4.5 4.5 0 0 0 4.5 4.5H18a3.75 3.75 0 0 0 1.332-7.257 3 3 0 0 0-3.758-3.848 5.25 5.25 0 0 0-10.233 2.33A4.502 4.502 0 0 0 2.25 15Z" />
              </svg>
              <svg *ngIf="s.id === 'gridlockOutage'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17 17.25 21A9.04 9.04 0 0 0 21 14.75V12h-2.25a1.5 1.5 0 0 0-1.5 1.5v1.42ZM8.83 13.04l-5.75-5.75m0 0A8.96 8.96 0 0 0 2.25 12v2.75A9.04 9.04 0 0 0 6 18.25V15c0-.621.25-1.18.659-1.591l2.17-2.368ZM20.25 8.25A1.5 1.5 0 0 1 18.75 9.75h-1.42l-1.591-1.591M3.75 8.25A1.5 1.5 0 0 1 5.25 6.75h1.42l2.368 2.17M12 2.25a9 9 0 0 1 9 9v1.42a1.5 1.5 0 0 1-1.5 1.5h-1.42l-5.75-5.75M12 21.75a9 9 0 0 1-9-9v-1.42a1.5 1.5 0 0 1 1.5-1.5h1.42l5.75 5.75" />
              </svg>
            </div>
            <div>
              <div class="font-semibold text-sm group-hover:text-amber-400 transition-colors">{{ s.title }}</div>
              <div class="text-[10px] text-slate-400 mt-0.5">{{ s.description }}</div>
            </div>
          </button>
        </div>

        <!-- Mode Selection -->
        <div class="bg-slate-950/40 border border-slate-800/80 p-3.5 rounded-lg mb-6">
          <span class="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Execution Mode</span>
          <div class="grid grid-cols-2 gap-2">
            <button 
              (click)="streamMode.set(true)"
              [class.bg-slate-800]="streamMode()"
              [class.text-amber-400]="streamMode()"
              [class.border-slate-700]="streamMode()"
              [class.border-slate-850]="!streamMode()"
              class="px-3 py-2 border rounded-md text-xs font-semibold hover:border-slate-600 transition-all cursor-pointer"
            >
              Stream SSE (Live)
            </button>
            <button 
              (click)="streamMode.set(false)"
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

      <!-- Trigger Action Button -->
      <button 
        (click)="onTrigger()"
        [disabled]="store.isLoading()"
        class="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold py-3 rounded-lg flex items-center justify-center space-x-2 cursor-pointer shadow-md active:scale-[0.98] transition-all"
      >
        <span *ngIf="store.isLoading()" class="animate-spin rounded-full h-4.5 w-4.5 border-2 border-slate-950 border-t-transparent"></span>
        <span>{{ store.isLoading() ? 'Running Engine...' : 'Trigger Ops Directive' }}</span>
      </button>
    </div>
  `
})
export class ScenarioControlDeckComponent {
  store = inject(SimulationStore);

  selectedScenario = signal<string>('exitSurge');
  streamMode = signal<boolean>(true);

  scenarios = [
    {
      id: 'exitSurge',
      title: 'Crowd Exit Surge',
      description: 'Exit gate A bottleneck under critical load'
    },
    {
      id: 'stormInundation',
      title: 'Storm Flooding',
      description: 'Heavy precipitation inundating lower pathways'
    },
    {
      id: 'gridlockOutage',
      title: 'West Gridlock & Outage',
      description: 'Hub power loss and secondary traffic lock'
    }
  ];

  onTrigger(): void {
    const scenario = this.selectedScenario();
    if (this.streamMode()) {
      this.store.triggerStream(scenario);
    } else {
      this.store.triggerSync(scenario);
    }
  }
}
