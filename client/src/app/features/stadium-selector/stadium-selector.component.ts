import { Component, OnInit, inject, signal } from '@angular/core';

import { Router } from '@angular/router';
import { StadiumStore } from '../../state/stadium.store';
import { AuthService } from '../../core/services/auth.service';
import { Stadium } from '../../core/services/reference.service';
import { AccessibilityToggleComponent } from '../../shared/components/accessibility-toggle/accessibility-toggle.component';
import { ChangeAccessCodeComponent } from '../../shared/components/change-access-code/change-access-code.component';

@Component({
  selector: 'app-stadium-selector',
  standalone: true,
  imports: [AccessibilityToggleComponent, ChangeAccessCodeComponent],
  template: `
    <div class="min-h-screen bg-[#020817] text-slate-100 flex flex-col font-sans page-fade-in">
      <header
        class="bg-slate-900/40 border-b border-slate-800/80 px-4 sm:px-6 py-4 flex flex-col lg:flex-row justify-between items-center gap-4 backdrop-blur"
      >
        <div class="flex items-center space-x-3.5 self-start lg:self-auto">
          <div
            class="w-10 h-10 shrink-0 rounded-lg bg-amber-500 flex items-center justify-center font-black text-slate-950 text-xl tracking-tighter"
          >
            SP
          </div>
          <div>
            <h1 class="text-base sm:text-lg font-extrabold tracking-tight text-white leading-none">
              FIFA Nexus Twin
            </h1>
            <p class="text-[10px] text-slate-400 uppercase tracking-widest mt-1">
              Select a Venue — World Cup 2026
            </p>
          </div>
        </div>
        <div class="flex flex-wrap items-center justify-center lg:justify-end gap-2">
          <button
            type="button"
            (click)="goToOverview()"
            class="px-3 sm:px-4 py-2 border border-slate-700 hover:border-cyan-500 bg-slate-800/40 hover:bg-slate-800 rounded-lg text-xs font-semibold uppercase tracking-wider text-slate-300 transition-all cursor-pointer"
          >
            <span aria-hidden="true">🌐</span> Global Overview
          </button>
          @if (!authService.isGuest()) {
            <app-change-access-code></app-change-access-code>
          }
          <app-accessibility-toggle></app-accessibility-toggle>
          <button
            type="button"
            (click)="onLogout()"
            aria-label="Log out of command center"
            class="px-3 sm:px-4 py-2 border border-slate-700 hover:border-slate-500 bg-slate-800/40 hover:bg-slate-800 rounded-lg text-xs font-semibold uppercase tracking-wider text-slate-300 transition-all cursor-pointer"
          >
            Disconnect
          </button>
        </div>
      </header>

      <main class="flex-1 max-w-[1400px] w-full mx-auto p-3 sm:p-6 flex flex-col gap-6">
        <!-- North America Map -->
        <div
          class="relative bg-slate-900/40 border border-slate-800 rounded-2xl p-3 sm:p-6 backdrop-blur shadow-xl"
        >
          <svg
            viewBox="0 0 79.39 100"
            class="w-full h-[340px] sm:h-[480px] absolute inset-0"
            preserveAspectRatio="none"
            role="img"
            aria-label="Map of North America showing World Cup 2026 stadium locations"
          >
            <defs>
              <pattern id="grid" width="4" height="5" patternUnits="userSpaceOnUse">
                <path d="M 4 0 L 0 0 0 5" fill="none" stroke="#00D4FF" stroke-width="0.15" />
              </pattern>
            </defs>
            <rect width="79.39" height="100" fill="url(#grid)" opacity="0.05" />

            <!-- Real North America coastline outline (mainland + Baja California + Yucatán/Caribbean subpaths) -->
            <path
              d="M13.45,2L14.24,3.19L14.63,4.78L16.61,5.28L17.99,3.79L19.17,4.39L22.53,4.69L24.9,3.69L25.29,6.97L26.68,6.97L26.68,5.58L28.06,5.68L31.51,9.76L33.78,11.15L32.6,13.04L33.09,13.53L37.53,14.43L37.63,16.42L38.81,16.61L39.11,13.63L40.98,13.14L42.36,15.22L45.32,16.61L46.8,16.91L47.79,15.72L47.89,13.83L49.66,12.73L50.25,14.33L48.67,17.11L48.87,18.5L49.76,17.11L51.53,15.52L51.63,13.43L50.65,11.84L50.94,10.55L53.31,9.36L54.4,10.15L54.6,17.11L56.27,15.62L57.26,16.22L55.88,18.61L57.65,19L60.22,15.02L62.39,17.31L61.5,21.39L59.33,22.58L57.26,21.58L53.51,22.38L53.91,23.67L52.92,25.26L49.86,25.96L46.41,28.65L43.35,32.72L42.96,34.01L45.03,34.81L45.82,36.8L48.68,39.68L53.22,41.67L52.23,46.24L52.13,47.53L53.31,48.33L54.9,46.24L55.09,42.27L57.56,42.17L58.74,39.88L58.94,36.4L62.1,30.24L66.05,31.63L68.12,34.51L67.23,37.4L68.81,38.29L72.66,35.7L73.74,42.76L77.3,47.04L77.39,49.22L73.45,50.22L71.58,52.21L67.63,51.31L65.66,51.21L62.2,53.9L64.28,53.4L66.84,52.91L67.34,53.51L66.65,55.69L66.75,57.68L67.93,58.48L69.12,58.18L69.71,57.28L70.5,57.28L69.21,59.67L66.75,59.77L65.66,61.36L64.28,61.36L63.88,60.17L65.86,58.18L63.49,58.98L63.38,55.6L62.7,55.2L60.63,56.1L60.43,57.79L55.69,57.79L51.64,60.57L46.22,62.37L45.63,61.57L48.36,57.49L46.81,55.99L45.82,54.1L43.81,52.57L41.66,52.39L37.8,49.68L9.79,45.08L9.32,43.18L6.75,40.8L6.75,38.81L7.15,37.02L6.95,36.03L5.97,35.03L5.77,33.44L8.34,31.65L6.76,23.1L4.58,23L2.61,20.41L13.45,2L13.45,2ZM9.7,45.45L9.3,47.04L7.92,46.14L7.23,46.14L6.84,47.84L2,58.67L3.28,68.12L4.86,68.91L5.16,71.5L8.42,71.5L11.57,73.88L17.79,74.48L18.48,77.66L19.46,78.36L20.85,76.97L21.93,77.47L22.92,82.04L24.59,83.13L25.98,80.54L30.22,77.46L32.98,78.75L35.35,78.95L35.45,77.46L40.38,77.56L41.37,78.65L41.56,81.14L40.97,82.53L41.66,84.91L43.15,84.91L44.63,82.63L44.04,81.53L43.45,79.15L44.33,76.46L48.38,72.99L51.44,72.09L51.04,69.21L55.28,64.63L59.53,63.93L58.84,61.56L62.98,59.17L62.98,55.99L62.58,55.79L61.1,56.29L60.9,58.24L55.98,58.29L52.12,60.86L46.06,62.84L45.1,61.65L47.85,57.49L46.49,56.2L45.57,54.44L43.65,52.9L41.57,52.73L37.64,50.05L9.7,45.45L9.7,45.45ZM5.24,72.02L7.15,78.05L6.26,78.55L6.36,79.74L8.04,81.04L8.04,83.44L10.12,85.43L9.23,79.54L8.04,75.65L8.34,72.96L9.33,73.06L9.73,73.96L9.33,76.25L14.48,86.33L14.48,89.92L18.64,94.81L23.19,96.9L25.07,95.81L27.75,98L29.33,96.4L28.64,94.61L30.92,93.91L31.61,94.31L32.3,93.61L33.39,93.61L35.37,90.12L34.38,89.22L30.52,90.12L29.63,92.71L27.35,93.11L24.68,92.01L23.49,88.22L24.39,83.44L22.55,82.3L21.68,77.71L20.94,77.39L19.6,78.75L18.07,77.93L17.47,74.87L11.38,74.23L8.23,71.87L5.24,72.02L5.24,72.02Z"
              fill="#0b1329"
              stroke="#00D4FF"
              stroke-width="0.35"
              stroke-opacity="0.5"
              stroke-linejoin="round"
              fill-opacity="0.85"
            />
          </svg>

          <div class="relative w-full h-[340px] sm:h-[480px]">
            @for (stadium of store.stadiums(); track stadium.id) {
              <button
                type="button"
                (click)="selectStadium(stadium)"
                (mouseenter)="hoveredStadium.set(stadium)"
                (mouseleave)="hoveredStadium.set(null)"
                (focus)="hoveredStadium.set(stadium)"
                (blur)="hoveredStadium.set(null)"
                [attr.aria-label]="stadium.name + ' — ' + stadium.status"
                class="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                [style.left.%]="stadium.mapX"
                [style.top.%]="stadium.mapY"
              >
                <span
                  aria-hidden="true"
                  class="block w-3.5 h-3.5 rounded-full ring-2 ring-slate-950 transition-transform group-hover:scale-150"
                  [class.animate-pulse]="stadium.status === 'live'"
                  [style.background]="stadium.color"
                  [style.box-shadow]="'0 0 12px ' + stadium.color"
                ></span>
              </button>
            }
          </div>

          <!-- Hover Tooltip -->
          @if (hoveredStadium(); as s) {
            <div
              class="absolute bottom-3 left-3 right-3 sm:right-auto sm:bottom-6 sm:left-6 bg-slate-950/95 border border-slate-700 rounded-xl p-3 sm:p-4 shadow-2xl sm:max-w-xs z-10"
              role="status"
            >
              <div class="font-bold text-white text-sm mb-1">
                <span aria-hidden="true">{{ s.flag }}</span> {{ s.name }}
              </div>
              <div class="text-xs text-slate-400 mb-2">
                <span aria-hidden="true">📍</span> {{ s.city }} · <span aria-hidden="true">👥</span>
                {{ s.capacity.toLocaleString() }}
              </div>
              <div class="text-xs text-amber-400">{{ s.role }}</div>
            </div>
          }

          <!-- Legend -->
          <div
            class="absolute top-3 right-3 sm:top-6 sm:right-6 bg-slate-950/70 border border-slate-800 rounded-lg p-2 sm:p-3 text-[9px] sm:text-[10px] space-y-1 sm:space-y-1.5"
          >
            <div class="flex items-center space-x-2">
              <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse" aria-hidden="true"></span
              ><span>Live now</span>
            </div>
            <div class="flex items-center space-x-2">
              <span class="w-2 h-2 rounded-full bg-amber-500" aria-hidden="true"></span
              ><span>Upcoming / Final</span>
            </div>
            <div class="flex items-center space-x-2">
              <span class="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true"></span
              ><span>Complete</span>
            </div>
          </div>
        </div>

        <!-- Stadium Grid List -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          @for (stadium of store.stadiums(); track stadium.id) {
            <button
              type="button"
              (click)="selectStadium(stadium)"
              [attr.aria-label]="'View ' + stadium.name + ' dashboard'"
              class="text-left p-3.5 rounded-xl border border-slate-800 bg-slate-900/50 hover:border-cyan-500/60 hover:bg-slate-900 transition-all cursor-pointer"
            >
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-bold text-white"
                  ><span aria-hidden="true">{{ stadium.flag }}</span> {{ stadium.shortName }}</span
                >
                <span
                  class="w-2 h-2 rounded-full"
                  aria-hidden="true"
                  [style.background]="stadium.color"
                ></span>
              </div>
              <div class="text-[10px] text-slate-500">{{ stadium.city }}</div>
            </button>
          }
        </div>
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
export class StadiumSelectorComponent implements OnInit {
  store = inject(StadiumStore);
  authService = inject(AuthService);
  private router = inject(Router);

  hoveredStadium = signal<Stadium | null>(null);

  ngOnInit(): void {
    this.store.loadReferenceData();
  }

  selectStadium(stadium: Stadium): void {
    this.router.navigate(['/dashboard', stadium.id]);
  }

  goToOverview(): void {
    this.router.navigate(['/overview']);
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/access-code']);
  }
}
