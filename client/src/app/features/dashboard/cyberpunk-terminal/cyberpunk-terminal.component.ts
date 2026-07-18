import { Component, signal, inject, computed, effect } from '@angular/core';

import { SimulationStore } from '../../../state/simulation.store';

@Component({
  selector: 'app-cyberpunk-terminal',
  standalone: true,
  imports: [],
  template: `
    <div
      class="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur shadow-lg flex flex-col h-full scanline-effect min-h-[300px]"
    >
      <!-- Terminal Header -->
      <div class="flex justify-between items-center mb-3">
        <div class="flex items-center space-x-2">
          <span class="w-3 h-3 rounded-full bg-emerald-500/80 animate-pulse"></span>
          <h2 class="text-xs font-mono uppercase tracking-widest text-emerald-400">
            System Terminal - Multilingual Broadcasts
          </h2>
        </div>

        <!-- Language Tabs / Raw Console Tab -->
        <div class="flex space-x-1">
          <button
            type="button"
            (click)="activeTab.set('raw')"
            [attr.aria-pressed]="activeTab() === 'raw'"
            aria-label="Show raw JSON console"
            [class.bg-emerald-500/10]="activeTab() === 'raw'"
            [class.text-emerald-400]="activeTab() === 'raw'"
            [class.border-emerald-500/30]="activeTab() === 'raw'"
            [class.bg-slate-950/40]="activeTab() !== 'raw'"
            [class.text-slate-500]="activeTab() !== 'raw'"
            [class.border-slate-850]="activeTab() !== 'raw'"
            class="px-2 py-0.5 border rounded text-[10px] font-mono cursor-pointer transition-all duration-150"
          >
            RAW_JSON
          </button>

          @for (lang of ['en', 'es', 'fr']; track lang) {
            <button
              type="button"
              (click)="activeTab.set(lang)"
              [disabled]="!hasResult()"
              [attr.aria-pressed]="activeTab() === lang"
              [attr.aria-label]="'Show ' + lang + ' broadcast script'"
              [class.bg-emerald-500/10]="activeTab() === lang"
              [class.text-emerald-400]="activeTab() === lang"
              [class.border-emerald-500/30]="activeTab() === lang"
              [class.bg-slate-950/40]="activeTab() !== lang"
              [class.text-slate-500]="activeTab() !== lang"
              [class.border-slate-850]="activeTab() !== lang"
              [class.opacity-50]="!hasResult()"
              class="px-2 py-0.5 border rounded text-[10px] font-mono uppercase cursor-pointer transition-all duration-150"
            >
              {{ lang }}
            </button>
          }
        </div>
      </div>

      <!-- Terminal Body Screen -->
      <div
        class="flex-1 bg-slate-950 border border-emerald-950/40 p-4 rounded-lg font-mono text-xs text-emerald-500 overflow-y-auto max-h-[350px] relative shadow-inner select-none flex flex-col justify-between"
      >
        <!-- CRT Monitor Overlay Textures -->
        <div
          class="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-900/5 to-transparent pointer-events-none"
        ></div>

        <!-- Text area -->
        <div
          class="relative z-10 whitespace-pre-wrap break-all leading-relaxed"
          role="log"
          aria-live="polite"
          aria-atomic="false"
          aria-label="System terminal output"
        >
          <!-- Case 1: Streaming in progress & raw tab is active -->
          @if (store.isStreaming() && activeTab() === 'raw') {
            <span class="text-slate-400 font-semibold">// CONNECTED TO GEMINI SSE ENDPOINT...</span>
            <br />
            {{ store.streamText()
            }}<span class="animate-[blink_1s_infinite] font-extrabold">█</span>
          }

          <!-- Case 2: Streaming is complete or showing selected history -->
          @if (!store.isStreaming()) {
            <!-- Raw Tab Selected -->
            @if (activeTab() === 'raw') {
              <div class="text-slate-400">
                <span class="text-emerald-500 font-semibold"
                  >// SIMULATION PERSISTED TO SUPABASE POSTGRES</span
                >
                <br />
                <span class="text-emerald-600">// JSON STRING VALUE:</span>
                <br />
                {{ rawJsonRepresentation() }}
              </div>
            }
            <!-- EN Tab Selected -->
            @if (activeTab() === 'en') {
              <div class="text-emerald-400">
                <span class="text-slate-500 uppercase font-semibold"
                  >// LOUDSPEAKER ANNOUNCEMENT SCRIPT [ENGLISH]</span
                >
                <p class="mt-2 text-sm text-emerald-300 font-medium">
                  "{{ store.latestResult()?.multilingualScripts?.en }}"
                </p>
              </div>
            }
            <!-- ES Tab Selected -->
            @if (activeTab() === 'es') {
              <div class="text-emerald-400">
                <span class="text-slate-500 uppercase font-semibold"
                  >// LOUDSPEAKER ANNOUNCEMENT SCRIPT [SPANISH]</span
                >
                <p class="mt-2 text-sm text-emerald-300 font-medium">
                  "{{ store.latestResult()?.multilingualScripts?.es }}"
                </p>
              </div>
            }
            <!-- FR Tab Selected -->
            @if (activeTab() === 'fr') {
              <div class="text-emerald-400">
                <span class="text-slate-500 uppercase font-semibold"
                  >// LOUDSPEAKER ANNOUNCEMENT SCRIPT [FRENCH]</span
                >
                <p class="mt-2 text-sm text-emerald-300 font-medium">
                  "{{ store.latestResult()?.multilingualScripts?.fr }}"
                </p>
              </div>
            }
            @if (!store.latestResult() && !store.isLoading()) {
              <div class="text-slate-600 italic">
                // NO SYSTEM DIRECTIVES LOADED. PRESS 'TRIGGER' TO INITIALIZE ENGINE.
              </div>
            }
            <!-- Simple loading visual -->
            @if (store.isLoading() && !store.isStreaming()) {
              <div class="text-emerald-600 animate-pulse">
                // COMPUTING OPTIMAL ROUTING GUIDES...
                <br />
                // GENERATING TRANSLATION SCRIPTS...
              </div>
            }
          }
        </div>

        <!-- Terminal Status Bar -->
        <div
          class="relative z-10 border-t border-emerald-950/40 pt-2 mt-4 text-[10px] text-emerald-700 flex justify-between"
        >
          <span>HOST: STADIUMPULSE.FIFA.NET</span>
          <span>SYS_STATUS: READY</span>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      @keyframes blink {
        0%,
        49% {
          opacity: 1;
        }
        50%,
        100% {
          opacity: 0;
        }
      }
      .scanline-effect {
        /* Handled by styles.css global styling */
      }
    `,
  ],
})
export class CyberpunkTerminalComponent {
  store = inject(SimulationStore);

  activeTab = signal<string>('raw');

  hasResult = computed(() => !!this.store.latestResult());

  rawJsonRepresentation = computed(() => {
    const res = this.store.latestResult();
    return res ? JSON.stringify(res, null, 2) : '';
  });

  constructor() {
    // Automatically switch from raw console to English when a stream finishes
    effect(() => {
      if (this.hasResult() && !this.store.isStreaming() && this.activeTab() === 'raw') {
        this.activeTab.set('en');
      }
    });
    // If a stream starts, reset back to raw JSON console to watch it stream
    effect(() => {
      if (this.store.isStreaming()) {
        this.activeTab.set('raw');
      }
    });
  }
}
