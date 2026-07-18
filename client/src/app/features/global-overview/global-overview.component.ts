import { Component, OnInit, inject, computed } from '@angular/core';

import { Router } from '@angular/router';
import { StadiumStore } from '../../state/stadium.store';
import { Stadium } from '../../core/services/reference.service';

@Component({
  selector: 'app-global-overview',
  standalone: true,
  imports: [],
  template: `
    <div class="min-h-screen bg-[#020817] text-slate-100 flex flex-col font-sans page-fade-in">
      <header
        class="bg-slate-900/40 border-b border-slate-800/80 px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 backdrop-blur"
      >
        <div class="flex items-center space-x-3.5 self-start sm:self-auto">
          <button
            type="button"
            (click)="goBack()"
            aria-label="Back to venue selector"
            class="w-10 h-10 shrink-0 rounded-lg bg-cyan-500 flex items-center justify-center font-black text-slate-950 text-xl tracking-tighter cursor-pointer"
          >
            <span aria-hidden="true">🌐</span>
          </button>
          <div>
            <h1 class="text-base sm:text-lg font-extrabold tracking-tight text-white leading-none">
              Global Command Overview
            </h1>
            <p class="text-[10px] text-slate-400 uppercase tracking-widest mt-1">
              FIFA World Cup 2026 — All 16 Venues
            </p>
          </div>
        </div>
        <button
          type="button"
          (click)="goBack()"
          class="px-3 sm:px-4 py-2 border border-slate-700 hover:border-cyan-500 bg-slate-800/40 hover:bg-slate-800 rounded-lg text-xs font-semibold uppercase tracking-wider text-slate-300 transition-all cursor-pointer"
        >
          <span aria-hidden="true">←</span> Back to Venue Selector
        </button>
      </header>

      <main
        class="flex-1 max-w-[1400px] w-full mx-auto p-3 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6"
      >
        @for (group of countryGroups(); track group.code) {
          <div class="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
            <h2
              class="text-sm font-bold uppercase tracking-wider text-white mb-4 flex items-center space-x-2"
            >
              <span aria-hidden="true">{{ group.flag }}</span
              ><span>{{ group.name }}</span>
              <span class="text-[10px] text-slate-500 font-normal"
                >({{ group.stadiums.length }} venues)</span
              >
            </h2>
            <div class="space-y-2">
              @for (stadium of group.stadiums; track stadium.id) {
                <button
                  type="button"
                  (click)="goToStadium(stadium)"
                  [attr.aria-label]="
                    'View ' +
                    stadium.shortName +
                    ' dashboard — status ' +
                    statusBadge(stadium.status)
                  "
                  class="w-full text-left flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-800/60 transition-all cursor-pointer group"
                >
                  <span class="text-xs text-slate-300 group-hover:text-white">{{
                    stadium.shortName
                  }}</span>
                  <span class="text-[10px] font-semibold" [style.color]="stadium.color">{{
                    statusBadge(stadium.status)
                  }}</span>
                </button>
              }
            </div>
          </div>
        }
      </main>
    </div>
  `,
  styles: [
    `
      @keyframes pageFadeIn {
        from {
          opacity: 0;
          transform: translateY(6px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .page-fade-in {
        animation: pageFadeIn 0.35s ease-out both;
      }
    `,
  ],
})
export class GlobalOverviewComponent implements OnInit {
  store = inject(StadiumStore);
  private router = inject(Router);

  countryGroups = computed(() => {
    const stadiums = this.store.stadiums();
    const groups: Record<
      string,
      { code: string; name: string; flag: string; stadiums: Stadium[] }
    > = {};

    for (const s of stadiums) {
      if (!groups[s.countryCode]) {
        groups[s.countryCode] = {
          code: s.countryCode,
          name: s.country,
          flag: s.flag,
          stadiums: [],
        };
      }
      groups[s.countryCode].stadiums.push(s);
    }

    return Object.values(groups);
  });

  ngOnInit(): void {
    this.store.loadReferenceData();
  }

  statusBadge(status: string): string {
    const badges: Record<string, string> = {
      live: '🔴 LIVE',
      'upcoming-final': '🏆 FINAL',
      upcoming: '🟡 UPCOMING',
      complete: '✅ DONE',
    };
    return badges[status] || status;
  }

  goToStadium(stadium: Stadium): void {
    this.router.navigate(['/dashboard', stadium.id]);
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
