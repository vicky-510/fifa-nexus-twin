import { Component, Input, inject } from '@angular/core';

import { SimulationStore } from '../../../state/simulation.store';
import { Stadium } from '../../../core/services/reference.service';

@Component({
  selector: 'app-nexus-canvas-map',
  standalone: true,
  imports: [],
  template: `
    <div
      class="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur shadow-lg flex flex-col h-full relative overflow-hidden"
    >
      <div class="flex justify-between items-center mb-4">
        <div>
          <h2
            class="text-md font-bold uppercase tracking-wider text-slate-100 flex items-center space-x-2"
          >
            <span aria-hidden="true">🗺️</span>
            <span>{{ stadium ? stadium.name : 'Nexus Twin Venue Schematic' }}</span>
          </h2>
          <p class="text-[10px] text-slate-400">
            {{ stadium ? mapTypeLabel(stadium.mapType) : 'Live operational command view' }}
          </p>
        </div>

        <span
          role="status"
          [class.bg-emerald-500/10]="!store.activeScenario()"
          [class.text-emerald-400]="!store.activeScenario()"
          [class.border-emerald-500/30]="!store.activeScenario()"
          [class.bg-red-500/10]="!!store.activeScenario()"
          [class.text-red-400]="!!store.activeScenario()"
          [class.border-red-500/30]="!!store.activeScenario()"
          class="px-2.5 py-0.5 rounded border text-[10px] font-semibold uppercase tracking-wider animate-pulse"
        >
          {{ store.activeScenario() ? store.severity() || 'CRITICAL' : 'SECURE (STANDBY)' }}
        </span>
      </div>

      <div
        class="flex-1 bg-slate-950/80 rounded-lg border border-slate-800/60 p-2 flex items-center justify-center min-h-[280px] relative"
      >
        @if (stadium) {
          <svg
            viewBox="0 0 800 500"
            class="w-full h-full max-h-[380px]"
            role="img"
            [attr.aria-label]="'Venue schematic map of ' + stadium.name"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="rgba(51, 65, 85, 0.15)"
                  stroke-width="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            @if (stadium.mapType === 'oval-open-air') {
              <ellipse
                cx="400"
                cy="230"
                rx="300"
                ry="180"
                fill="none"
                stroke="#1e293b"
                stroke-width="6"
                stroke-dasharray="10 5"
              />
              <ellipse
                cx="400"
                cy="230"
                rx="260"
                ry="150"
                fill="#0b1329"
                stroke="#334155"
                stroke-width="4"
              />
              <ellipse
                cx="400"
                cy="230"
                rx="160"
                ry="90"
                fill="#020617"
                stroke="#1e293b"
                stroke-width="3"
              />
            } @else if (stadium.mapType === 'retractable-dome') {
              <rect
                x="140"
                y="80"
                width="520"
                height="300"
                rx="60"
                fill="#0b1329"
                stroke="#334155"
                stroke-width="4"
              />
              <circle
                cx="400"
                cy="230"
                r="160"
                fill="none"
                stroke="#0ea5e9"
                stroke-width="2"
                stroke-dasharray="4 4"
              />
              <rect
                x="240"
                y="150"
                width="320"
                height="160"
                rx="16"
                fill="#020617"
                stroke="#1e293b"
                stroke-width="3"
              />
            } @else if (stadium.mapType === 'circular-modern') {
              <circle cx="400" cy="230" r="220" fill="#0b1329" stroke="#334155" stroke-width="4" />
              <circle cx="400" cy="230" r="140" fill="#020617" stroke="#1e293b" stroke-width="3" />
            } @else {
              <rect
                x="120"
                y="90"
                width="560"
                height="280"
                rx="10"
                fill="#0b1329"
                stroke="#334155"
                stroke-width="4"
              />
              <rect
                x="250"
                y="150"
                width="300"
                height="160"
                rx="6"
                fill="#020617"
                stroke="#1e293b"
                stroke-width="3"
              />
            }
            <rect
              x="330"
              y="190"
              width="140"
              height="80"
              rx="8"
              fill="none"
              stroke="#475569"
              stroke-width="2"
            />
            <line x1="400" y1="190" x2="400" y2="270" stroke="#475569" stroke-width="2" />

            <!-- Gates rendered around the perimeter, highlighted if a crisis is active -->
            @for (gate of stadium.gates; track gate; let i = $index) {
              <g [attr.transform]="gatePosition(i, stadium.gates.length)">
                <circle
                  r="22"
                  [attr.fill]="isCriticalGate(i) ? '#7f1d1d' : '#1e293b'"
                  [attr.stroke]="isCriticalGate(i) ? '#ef4444' : '#475569'"
                  stroke-width="2"
                  [class.animate-pulse]="isCriticalGate(i)"
                />
                <text
                  y="5"
                  font-size="10"
                  font-weight="bold"
                  [attr.fill]="isCriticalGate(i) ? '#fca5a5' : '#cbd5e1'"
                  text-anchor="middle"
                >
                  {{ gateShortLabel(gate) }}
                </text>
              </g>
            }
          </svg>
        } @else {
          <div class="text-xs text-slate-500 italic">Loading stadium schematic...</div>
        }
      </div>

      @if (store.activeScenario() && store.latestResult(); as result) {
        <div
          class="mt-3 bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg text-xs space-y-1.5 backdrop-blur-sm shrink-0"
        >
          <div class="flex justify-between font-semibold border-b border-slate-800 pb-1">
            <span class="text-amber-500">Active AI Directives</span>
            <span class="text-slate-500 text-[10px]">Real-Time Sync</span>
          </div>
          <div class="grid grid-cols-2 gap-2 text-[10px]">
            <div>
              <span class="text-slate-400 block font-medium">Stadium Ops:</span>
              <span class="text-slate-200 block truncate">{{ result.navigation }}</span>
            </div>
            <div>
              <span class="text-slate-400 block font-medium">Transport:</span>
              <span class="text-slate-200 block truncate">{{ result.transport }}</span>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class NexusCanvasMapComponent {
  store = inject(SimulationStore);

  @Input() stadium: Stadium | null = null;

  mapTypeLabel(mapType: string): string {
    const labels: Record<string, string> = {
      'oval-open-air': 'Oval Open-Air Venue',
      'retractable-dome': 'Retractable Dome Venue',
      'circular-modern': 'Circular Modern Venue',
      'compact-rectangle': 'Compact Rectangle Venue',
    };
    return labels[mapType] || 'Venue Schematic';
  }

  gatePosition(index: number, total: number): string {
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
    const x = 400 + 300 * Math.cos(angle);
    const y = 230 + 190 * Math.sin(angle);
    return `translate(${x}, ${y})`;
  }

  gateShortLabel(gate: string): string {
    // e.g. "Gate A (North)" -> "A"
    const match = gate.match(/Gate\s+(\S+)/i);
    return match ? match[1].toUpperCase() : gate.slice(0, 3).toUpperCase();
  }

  isCriticalGate(index: number): boolean {
    // Highlight the first gate as the crisis epicenter when a scenario is active
    return !!this.store.activeScenario() && index === 0;
  }
}
