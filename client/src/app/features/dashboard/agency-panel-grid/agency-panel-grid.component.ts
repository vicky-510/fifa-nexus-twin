import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimulationStore } from '../../../state/simulation.store';

interface AgencyDef {
  key: 'navigation' | 'medical' | 'security' | 'evacuation' | 'transport' | 'accessibility' | 'sustainability' | 'broadcast';
  label: string;
  icon: string;
  dot: string;
}

@Component({
  selector: 'app-agency-panel-grid',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur shadow-lg flex flex-col h-full">

      <div class="flex justify-between items-center mb-4">
        <div>
          <h2 class="text-md font-bold uppercase tracking-wider text-slate-100">8-Agency AI Directive Board</h2>
          <p class="text-[10px] text-slate-400">Domain-specific guidance from StadiumPulse AI</p>
        </div>
        @if (store.severity(); as sev) {
          <span class="px-2.5 py-0.5 rounded border text-[10px] font-semibold uppercase tracking-wider bg-red-500/10 text-red-400 border-red-500/30 animate-pulse">
            {{ sev }}
          </span>
        }
      </div>

      @if (store.latestResult(); as result) {
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto max-h-[480px] pr-1">
          @for (agency of agencies; track agency.key; let i = $index) {
            <div
              class="bg-slate-950/40 border border-slate-800 p-3.5 rounded-lg agency-card-in"
              [style.animation-delay.ms]="i * 300"
            >
              <div class="flex items-center space-x-2 mb-1.5">
                <span class="w-2 h-2 rounded-full" [class]="agency.dot"></span>
                <span class="text-xs uppercase font-bold tracking-wider text-slate-300">{{ agency.icon }} {{ agency.label }}</span>
              </div>
              <p class="text-xs text-slate-400 leading-relaxed typewriter-text">
                {{ result[agency.key] }}
              </p>
            </div>
          }
        </div>

        <!-- Multilingual card -->
        <div class="mt-3 bg-slate-950/40 border border-slate-800 p-3.5 rounded-lg">
          <div class="flex justify-between items-center mb-2">
            <span class="text-xs uppercase font-bold tracking-wider text-slate-300">📢 Multilingual Broadcast Scripts</span>
          </div>
          <div class="flex space-x-1 mb-2">
            @for (lang of langs; track lang) {
              <button
                (click)="activeLang.set(lang)"
                [class.bg-cyan-500\/10]="activeLang() === lang"
                [class.text-cyan-400]="activeLang() === lang"
                [class.border-cyan-500\/30]="activeLang() === lang"
                [class.text-slate-500]="activeLang() !== lang"
                [class.border-slate-800]="activeLang() !== lang"
                class="px-2 py-0.5 border rounded text-[10px] font-mono uppercase cursor-pointer transition-all"
              >
                {{ lang }}
              </button>
            }
          </div>
          <p class="text-xs text-slate-300 italic leading-relaxed">"{{ result.multilingualScripts[activeLang()] }}"</p>
        </div>

        <div class="mt-3 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3.5">
          <div class="text-[10px] uppercase font-bold tracking-wider text-amber-400 mb-1">Why this recommendation</div>
          <p class="text-xs text-amber-200 font-medium leading-relaxed italic">"{{ result.operationalRecommendation }}"</p>
        </div>
      } @else {
        <div class="flex-1 flex items-center justify-center text-center py-8 text-xs text-slate-500 italic">
          No directives compiled. Select a crisis scenario and trigger.
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes agencyCardIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .agency-card-in {
      animation: agencyCardIn 0.4s ease-out both;
    }
  `]
})
export class AgencyPanelGridComponent {
  store = inject(SimulationStore);

  activeLang = signal<'en' | 'es' | 'fr'>('en');
  langs: Array<'en' | 'es' | 'fr'> = ['en', 'es', 'fr'];

  agencies: AgencyDef[] = [
    { key: 'navigation', label: 'Stadium Operations', icon: '🔵', dot: 'bg-blue-400' },
    { key: 'medical', label: 'Emergency Medical', icon: '🔴', dot: 'bg-red-400' },
    { key: 'security', label: 'Security / Police', icon: '🟡', dot: 'bg-yellow-400' },
    { key: 'evacuation', label: 'Fire & Rescue', icon: '🟠', dot: 'bg-orange-400' },
    { key: 'transport', label: 'Transport Authority', icon: '🟢', dot: 'bg-green-400' },
    { key: 'accessibility', label: 'Accessibility Team', icon: '⚪', dot: 'bg-slate-300' },
    { key: 'sustainability', label: 'Sustainability Ops', icon: '🟣', dot: 'bg-purple-400' },
    { key: 'broadcast', label: 'Communications', icon: '📢', dot: 'bg-cyan-400' }
  ];
}
