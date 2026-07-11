import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimulationStore } from '../../../state/simulation.store';

@Component({
  selector: 'app-ai-reasoning-strip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur shadow-lg flex flex-col justify-between h-full space-y-5">
      
      <!-- Panel Title -->
      <div>
        <h2 class="text-md font-bold uppercase tracking-wider text-slate-100 flex items-center space-x-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 text-amber-500">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468l-1.823-.364a1.5 1.5 0 0 1-1.07-1.45V7.5M3.75 6h16.5M3.75 12h16.5m-16.5 6h16.5" />
          </svg>
          <span>Operational Guidance & Rationale</span>
        </h2>
        <p class="text-[10px] text-slate-400">Detailed intelligence reports from StadiumPulse AI</p>
      </div>

      <!-- Main Content -->
      <div class="flex-1 space-y-4 overflow-y-auto max-h-[450px]">
        
        <!-- Rationale Callout Banner -->
        <div class="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 relative">
          <div class="text-[10px] uppercase font-bold tracking-wider text-amber-400 mb-1">
            Why this recommendation
          </div>
          <p class="text-xs text-amber-200 font-medium leading-relaxed italic">
            "{{ store.latestResult()?.operationalRecommendation || 'Awaiting simulation triggers to generate operational reasoning...' }}"
          </p>
        </div>

        <!-- Guidance Breakdown Cards -->
        @if (store.latestResult()) {
          <div class="space-y-3">
            
            <!-- Navigation -->
            <div class="bg-slate-950/40 border border-slate-800 p-3.5 rounded-lg">
              <div class="flex items-center space-x-2 mb-1.5">
                <span class="w-2 h-2 rounded bg-amber-400"></span>
                <span class="text-xs uppercase font-bold tracking-wider text-slate-300">Navigation & Routing</span>
              </div>
              <p class="text-xs text-slate-400 leading-relaxed">
                {{ store.latestResult()?.navigation }}
              </p>
            </div>

            <!-- Crowd Control -->
            <div class="bg-slate-950/40 border border-slate-800 p-3.5 rounded-lg">
              <div class="flex items-center space-x-2 mb-1.5">
                <span class="w-2 h-2 rounded bg-red-400"></span>
                <span class="text-xs uppercase font-bold tracking-wider text-slate-300">Crowd Management</span>
              </div>
              <p class="text-xs text-slate-400 leading-relaxed">
                {{ store.latestResult()?.crowdControl }}
              </p>
            </div>

            <!-- Accessibility Guidance -->
            <div class="bg-slate-950/40 border border-slate-800 p-3.5 rounded-lg">
              <div class="flex items-center space-x-2 mb-1.5">
                <span class="w-2 h-2 rounded bg-blue-400"></span>
                <span class="text-xs uppercase font-bold tracking-wider text-slate-300">Accessibility Accommodations</span>
              </div>
              <p class="text-xs text-slate-400 leading-relaxed">
                {{ store.latestResult()?.accessibilityGuidance }}
              </p>
            </div>

            <!-- Transport Updates -->
            <div class="bg-slate-950/40 border border-slate-800 p-3.5 rounded-lg">
              <div class="flex items-center space-x-2 mb-1.5">
                <span class="w-2 h-2 rounded bg-purple-400"></span>
                <span class="text-xs uppercase font-bold tracking-wider text-slate-300">Transport & Transit Systems</span>
              </div>
              <p class="text-xs text-slate-400 leading-relaxed">
                {{ store.latestResult()?.transportUpdates }}
              </p>
            </div>

            <!-- Sustainability -->
            <div class="bg-slate-950/40 border border-slate-800 p-3.5 rounded-lg">
              <div class="flex items-center space-x-2 mb-1.5">
                <span class="w-2 h-2 rounded bg-emerald-400"></span>
                <span class="text-xs uppercase font-bold tracking-wider text-slate-300">Green Ops & Sustainability</span>
              </div>
              <p class="text-xs text-slate-400 leading-relaxed">
                {{ store.latestResult()?.sustainability }}
              </p>
            </div>

          </div>
        } @else {
          <div class="text-center py-8 text-xs text-slate-500 italic">
            No report details compiled. Select a scenario vector above and trigger.
          </div>
        }

      </div>
    </div>
  `
})
export class AiReasoningStripComponent {
  store = inject(SimulationStore);
}
