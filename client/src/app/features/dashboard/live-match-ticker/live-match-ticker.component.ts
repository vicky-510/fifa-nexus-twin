import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Stadium, Match } from '../../../core/services/reference.service';

@Component({
  selector: 'app-live-match-ticker',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (stadium) {
      <div class="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs font-mono" role="status" aria-live="polite" aria-label="Live match status">
        <span class="font-bold text-white"><span aria-hidden="true">🏟️</span> {{ stadium.name }}</span>
        <span class="text-slate-600" aria-hidden="true">|</span>

        @if (match && match.status === 'live') {
          <span class="text-red-400 font-bold animate-pulse"><span aria-hidden="true">🔴</span> LIVE NOW: {{ match.homeFlagEmoji }} {{ match.homeTeam }} vs {{ match.awayTeam }} {{ match.awayFlagEmoji }}</span>
          <span class="text-slate-600" aria-hidden="true">|</span>
          <span class="text-slate-300"><span aria-hidden="true">👥</span> {{ stadium.capacity.toLocaleString() }} capacity</span>
        } @else if (match) {
          <span class="text-amber-400 font-bold"><span aria-hidden="true">🏆</span> {{ match.stage }}: {{ match.homeFlagEmoji }} {{ match.homeTeam }} vs {{ match.awayFlagEmoji }} {{ match.awayTeam }}</span>
          <span class="text-slate-600" aria-hidden="true">|</span>
          <span class="text-slate-300"><span aria-hidden="true">📅</span> {{ match.date }}</span>
          <span class="text-slate-600" aria-hidden="true">|</span>
          <span class="text-slate-300"><span aria-hidden="true">👥</span> {{ stadium.capacity.toLocaleString() }} capacity</span>
          <span class="text-slate-600" aria-hidden="true">|</span>
          <span class="text-cyan-400"><span aria-hidden="true">⏳</span> {{ daysAway(match.date) }} days away</span>
        } @else {
          <span class="text-slate-500">Standby — no scheduled match</span>
        }
      </div>
    }
  `
})
export class LiveMatchTickerComponent {
  @Input() stadium: Stadium | null = null;
  @Input() match: Match | null = null;

  daysAway(dateStr: string): number {
    const target = new Date(dateStr).getTime();
    const now = Date.now();
    return Math.max(0, Math.ceil((target - now) / (1000 * 60 * 60 * 24)));
  }
}
