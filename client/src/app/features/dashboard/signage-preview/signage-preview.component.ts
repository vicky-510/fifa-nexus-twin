import { Component, inject, signal } from '@angular/core';

import { SimulationStore } from '../../../state/simulation.store';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-signage-preview',
  standalone: true,
  imports: [],
  template: `
    <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur shadow-lg">
      <h2 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
        Stadium Screen Preview
      </h2>

      @if (store.latestResult(); as result) {
        <div
          class="bg-black border-2 border-cyan-500/40 rounded-lg p-4 mb-3 shadow-[0_0_20px_rgba(6,182,212,0.15)]"
          role="status"
          aria-live="polite"
        >
          <div class="text-red-400 text-xs font-bold mb-2">
            <span aria-hidden="true">⚠️</span> {{ store.severity() || 'ALERT' }}
          </div>
          <div class="text-cyan-300 text-sm font-bold uppercase mb-1 leading-tight">
            {{ result.navigation }}
          </div>
          <div class="text-slate-400 text-[10px] uppercase tracking-wider mt-3">
            <span aria-hidden="true">🚨</span> Operational Notice <span aria-hidden="true">🚨</span>
          </div>
        </div>

        @if (authService.isGuest()) {
          <p role="note" class="text-[10px] text-slate-500 italic text-center mb-2">
            <span aria-hidden="true">🔒</span> Read-only guest session — pushing to signage is
            reserved for authenticated ops staff.
          </p>
        }

        <button
          type="button"
          (click)="pushToSignage()"
          [disabled]="authService.isGuest()"
          [attr.aria-pressed]="pushed()"
          class="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-semibold py-2 rounded-lg text-xs uppercase tracking-wider cursor-pointer transition-all"
        >
          <span aria-hidden="true">{{ pushed() ? '✅' : '' }}</span>
          {{ pushed() ? 'Pushed to Signage Network' : 'Push to Signage Network' }}
        </button>
      } @else {
        <div
          class="bg-black border-2 border-slate-800 rounded-lg p-4 text-center text-slate-600 text-xs italic"
        >
          No active notice
        </div>
      }
    </div>
  `,
})
export class SignagePreviewComponent {
  store = inject(SimulationStore);
  authService = inject(AuthService);
  pushed = signal<boolean>(false);

  pushToSignage(): void {
    this.pushed.set(true);
    this.store.addManualNote('Signage pushed to stadium LED network');
    setTimeout(() => this.pushed.set(false), 2500);
  }
}
