import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimulationStore } from '../../../state/simulation.store';

@Component({
  selector: 'app-crisis-timeline',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <h2 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Crisis Timeline</h2>

      @if (store.crisisTimeline().length > 0) {
        <div class="space-y-1.5 max-h-[220px] overflow-y-auto pr-1 mb-3" role="log" aria-live="polite" aria-label="Crisis timeline events">
          @for (entry of store.crisisTimeline(); track entry.timestamp) {
            <div class="text-[10px] font-mono flex items-start space-x-2">
              <span class="text-slate-600 whitespace-nowrap">[{{ formatTime(entry.timestamp) }}]</span>
              <span [class]="typeColor(entry.type)"><span aria-hidden="true">{{ typeIcon(entry.type) }}</span> {{ entry.type }}: {{ entry.message }}</span>
            </div>
          }
        </div>
      } @else {
        <p class="text-[10px] text-slate-600 italic mb-3">No active crisis timeline. Trigger a scenario to begin logging.</p>
      }

      <div class="flex space-x-1.5">
        <label for="crisisNote" class="sr-only">Add manual note</label>
        <input
          id="crisisNote"
          [value]="noteText"
          (input)="noteText = $any($event.target).value"
          [disabled]="!store.activeSimulationId()"
          placeholder="Add manual note..."
          class="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-[10px] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 disabled:opacity-50"
        />
        <button
          type="button"
          (click)="submitNote()"
          [disabled]="!store.activeSimulationId() || !noteText.trim()"
          aria-label="Add manual note to timeline"
          class="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded text-[10px] font-semibold text-slate-300 cursor-pointer transition-all"
        >
          Add
        </button>
      </div>
    </div>
  `
})
export class CrisisTimelineComponent {
  store = inject(SimulationStore);
  noteText = '';

  submitNote(): void {
    this.store.addManualNote(this.noteText);
    this.noteText = '';
  }

  formatTime(ts: string): string {
    try {
      return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return ts;
    }
  }

  typeIcon(type: string): string {
    const icons: Record<string, string> = {
      declared: '🔴',
      escalated: '🚨',
      note: '📝',
      broadcast: '📢',
      signage: '📺',
      dispatch: '📨'
    };
    return icons[type] || '✅';
  }

  typeColor(type: string): string {
    const colors: Record<string, string> = {
      declared: 'text-red-400',
      escalated: 'text-red-500 font-bold',
      note: 'text-slate-300',
      broadcast: 'text-cyan-400',
      signage: 'text-purple-400',
      dispatch: 'text-emerald-400'
    };
    return colors[type] || 'text-slate-400';
  }
}
