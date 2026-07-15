import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimulationStore } from '../../../state/simulation.store';

@Component({
  selector: 'app-predictive-risk-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur shadow-lg">
      <h2 class="text-md font-bold uppercase tracking-wider text-cyan-400 mb-1 flex items-center space-x-2">
        <span>🔮</span><span>Predictive Risk Intelligence</span>
      </h2>
      <p class="text-[10px] text-slate-400 mb-4">Forward-looking forecast — next 60 minutes</p>

      @if (store.isPredicting()) {
        <div class="text-center py-6 text-xs text-slate-500 flex flex-col items-center space-y-2">
          <span class="animate-spin rounded-full h-5 w-5 border-2 border-cyan-500 border-t-transparent"></span>
          <span>Forecasting operational risk...</span>
        </div>
      } @else if (store.predictiveForecast(); as forecast) {
        <div class="space-y-2.5 mb-4">
          @for (risk of forecast.risks; track risk.label) {
            <div>
              <div class="flex justify-between text-[11px] mb-1">
                <span class="font-semibold text-slate-200">{{ levelIcon(risk.level) }} {{ risk.label }}</span>
                <span class="text-slate-400">{{ risk.probability }}% · within {{ risk.windowMinutes }}m</span>
              </div>
              <div class="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  class="h-full rounded-full transition-all duration-700"
                  [class]="barColor(risk.level)"
                  [style.width.%]="risk.probability"
                ></div>
              </div>
            </div>
          }
        </div>
        <p class="text-xs text-slate-400 italic leading-relaxed border-t border-slate-800 pt-3">
          {{ forecast.reasoning }}
        </p>
      } @else {
        <div class="text-center py-6 text-xs text-slate-600 italic">
          Press "Predict Risk" on the control deck to generate a pre-crisis forecast.
        </div>
      }
    </div>
  `
})
export class PredictiveRiskPanelComponent {
  store = inject(SimulationStore);

  levelIcon(level: string): string {
    if (level === 'HIGH') return '⚠️';
    if (level === 'MEDIUM') return '🟡';
    return '🟢';
  }

  barColor(level: string): string {
    if (level === 'HIGH') return 'bg-red-500';
    if (level === 'MEDIUM') return 'bg-amber-500';
    return 'bg-emerald-500';
  }
}
