import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimulationStore } from '../../../state/simulation.store';

@Component({
  selector: 'app-nexus-canvas-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur shadow-lg flex flex-col h-full relative overflow-hidden">
      
      <!-- Panel Header -->
      <div class="flex justify-between items-center mb-4">
        <div>
          <h2 class="text-md font-bold uppercase tracking-wider text-slate-100 flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 text-amber-500">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
            </svg>
            <span>Nexus Twin Venue Schematic</span>
          </h2>
          <p class="text-[10px] text-slate-400">Live operational command view of FIFA World Cup Stadium 2026</p>
        </div>
        
        <!-- Status Indicator -->
        <span 
          [class.bg-emerald-500\/10]="!activeScenario()"
          [class.text-emerald-400]="!activeScenario()"
          [class.border-emerald-500\/30]="!activeScenario()"
          [class.bg-red-500\/10]="activeScenario()"
          [class.text-red-400]="activeScenario()"
          [class.border-red-500\/30]="activeScenario()"
          class="px-2.5 py-0.5 rounded border text-[10px] font-semibold uppercase tracking-wider animate-pulse"
        >
          {{ activeScenario() ? 'CRITICAL: ' + getScenarioLabel() : 'SECURE (STANDBY)' }}
        </span>
      </div>

      <!-- SVG Venue Schematic Canvas -->
      <div class="flex-1 bg-slate-950/80 rounded-lg border border-slate-800/60 p-2 flex items-center justify-center min-h-[280px] relative">
        <svg viewBox="0 0 800 500" class="w-full h-full max-h-[380px]" xmlns="http://www.w3.org/2000/svg">
          
          <!-- Grid Overlay Pattern -->
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(51, 65, 85, 0.15)" stroke-width="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          <!-- Background Concourse ring -->
          <ellipse cx="400" cy="230" rx="300" ry="180" fill="none" stroke="#1e293b" stroke-width="6" stroke-dasharray="10 5" />
          
          <!-- Main Stadium Outer Ring -->
          <ellipse cx="400" cy="230" rx="260" ry="150" fill="#0b1329" stroke="#334155" stroke-width="4" />
          
          <!-- Inner pitch / seating bowl -->
          <ellipse cx="400" cy="230" rx="160" ry="90" fill="#020617" stroke="#1e293b" stroke-width="3" />
          <rect x="330" y="190" width="140" height="80" rx="8" fill="none" stroke="#475569" stroke-width="2" />
          <line x1="400" y1="190" x2="400" y2="270" stroke="#475569" stroke-width="2" />

          <!-- --- STATIC GATE NODES & ACCESS PATHS --- -->
          <!-- Gate B (North-East) -->
          <g transform="translate(620, 160)">
            <circle r="22" fill="#1e293b" stroke="#475569" stroke-width="2" />
            <text y="5" font-size="12" font-weight="bold" fill="#cbd5e1" text-anchor="middle">GATE B</text>
          </g>
          <!-- Gate C (South-East) -->
          <g transform="translate(620, 300)">
            <circle r="22" fill="#1e293b" stroke="#475569" stroke-width="2" />
            <text y="5" font-size="12" font-weight="bold" fill="#cbd5e1" text-anchor="middle">GATE C</text>
          </g>
          <!-- Gate D (North-West) -->
          <g transform="translate(180, 160)">
            <circle r="22" fill="#1e293b" stroke="#475569" stroke-width="2" />
            <text y="5" font-size="12" font-weight="bold" fill="#cbd5e1" text-anchor="middle">GATE D</text>
          </g>

          <!-- Elevator East Node -->
          <g transform="translate(560, 230)">
            <rect x="-18" y="-18" width="36" height="36" rx="4" fill="#0f172a" stroke="#1e293b" stroke-width="2" />
            <text y="5" font-size="11" font-weight="bold" fill="#64748b" text-anchor="middle">LIFT E</text>
          </g>

          <!-- East Parking Loop -->
          <g transform="translate(710, 230)">
            <rect x="-25" y="-35" width="50" height="70" rx="8" fill="#1e293b" stroke="#334155" stroke-width="2" />
            <text x="0" y="-10" font-size="10" font-weight="bold" fill="#94a3b8" text-anchor="middle">EAST</text>
            <text x="0" y="10" font-size="10" font-weight="bold" fill="#94a3b8" text-anchor="middle">PARK</text>
          </g>

          <!-- --- CRISIS SPECIFIC ANIMATED OVERLAYS --- -->
          
          <!-- CRISIS VECTOR 1: exitSurge (Gate A bottleneck) -->
          <!-- Gate A Node (South-West) -->
          <g transform="translate(180, 300)">
            <!-- Pulsing red background in crisis -->
            <circle *ngIf="activeScenario() === 'exitSurge'" r="38" fill="none" stroke="#f43f5e" stroke-width="2" class="animate-ping" style="animation-duration: 1.5s;" />
            <circle r="24" [attr.fill]="activeScenario() === 'exitSurge' ? '#881337' : '#1e293b'" [attr.stroke]="activeScenario() === 'exitSurge' ? '#f43f5e' : '#475569'" stroke-width="2" />
            <text y="5" font-size="12" font-weight="bold" [attr.fill]="activeScenario() === 'exitSurge' ? '#fda4af' : '#cbd5e1'" text-anchor="middle">GATE A</text>
          </g>
          
          <!-- Redirection Arrow Paths (Gate A to B & C) -->
          <g *ngIf="activeScenario() === 'exitSurge'" stroke="#f59e0b" stroke-width="4" stroke-dasharray="10 5" fill="none" class="animate-[dash_1s_linear_infinite]">
            <path d="M 210 300 Q 400 390 590 310" />
            <path d="M 200 280 Q 400 120 590 170" />
            <!-- Draw arrow heads -->
            <polygon points="590,310 575,305 582,320" fill="#f59e0b" stroke="none" />
            <polygon points="590,170 580,160 575,178" fill="#f59e0b" stroke="none" />
          </g>

          <!-- CRISIS VECTOR 2: stormInundation (Lower Concourse Flooding) -->
          <!-- Inundation zones (Lower rings shaded blue) -->
          <path 
            *ngIf="activeScenario() === 'stormInundation'" 
            d="M 250 230 A 150 150 0 0 0 550 230 Z" 
            fill="rgba(14, 165, 233, 0.25)" 
            stroke="#0ea5e9" 
            stroke-width="2" 
            stroke-dasharray="6 3" 
          />
          <g *ngIf="activeScenario() === 'stormInundation'" transform="translate(400, 310)">
            <rect x="-65" y="-12" width="130" height="24" rx="4" fill="#0369a1" class="animate-pulse" />
            <text y="5" font-size="10" font-weight="bold" fill="#e0f2fe" text-anchor="middle">FLOOD LEVEL: 12CM</text>
          </g>

          <!-- Highlight Lift E in stormInundation as Safe Accessibility Route -->
          <g *ngIf="activeScenario() === 'stormInundation'" transform="translate(560, 230)">
            <rect x="-22" y="-22" width="44" height="44" rx="6" fill="rgba(16, 185, 129, 0.2)" stroke="#10b981" stroke-width="2" class="animate-pulse" />
            <text y="4" font-size="11" font-weight="extrabold" fill="#34d399" text-anchor="middle">LIFT E</text>
            <circle cx="20" cy="-20" r="8" fill="#10b981" />
            <path d="M 18 -22 L 21 -19 L 24 -24" stroke="#ffffff" stroke-width="2" fill="none" />
          </g>

          <!-- CRISIS VECTOR 3: gridlockOutage (West Transit Gridlock) -->
          <g transform="translate(70, 230)">
            <!-- Pulsing alert area -->
            <circle *ngIf="activeScenario() === 'gridlockOutage'" r="45" fill="none" stroke="#ef4444" stroke-width="2" class="animate-ping" style="animation-duration: 2s;" />
            <rect x="-40" y="-35" width="80" height="70" rx="8" [attr.fill]="activeScenario() === 'gridlockOutage' ? '#7f1d1d' : '#1e293b'" [attr.stroke]="activeScenario() === 'gridlockOutage' ? '#ef4444' : '#334155'" stroke-width="2" />
            <text x="0" y="-10" font-size="9" font-weight="bold" [attr.fill]="activeScenario() === 'gridlockOutage' ? '#fecaca' : '#94a3b8'" text-anchor="middle">WEST</text>
            <text x="0" y="5" font-size="9" font-weight="bold" [attr.fill]="activeScenario() === 'gridlockOutage' ? '#fecaca' : '#94a3b8'" text-anchor="middle">TRANSIT</text>
            <text x="0" y="20" font-size="9" font-weight="extrabold" [attr.fill]="activeScenario() === 'gridlockOutage' ? '#ef4444' : '#64748b'" text-anchor="middle" [class.animate-pulse]="activeScenario() === 'gridlockOutage'">
              {{ activeScenario() === 'gridlockOutage' ? 'GRIDLOCK' : 'STABLE' }}
            </text>
          </g>

          <!-- Routing gridlock transit arrow (Buses diverted to East Park) -->
          <path 
            *ngIf="activeScenario() === 'gridlockOutage'" 
            d="M 70 185 Q 400 40 710 185" 
            stroke="#10b981" 
            stroke-width="4" 
            stroke-dasharray="8 4" 
            fill="none" 
            class="animate-[dash_1.5s_linear_infinite]" 
          />
        </svg>

        <!-- Dynamic Overlay HUD displaying details -->
        <div *ngIf="activeScenario()" class="absolute bottom-3 left-3 right-3 bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg text-xs space-y-1.5 backdrop-blur-sm">
          <div class="flex justify-between font-semibold border-b border-slate-800 pb-1">
            <span class="text-amber-500">Active AI Directives</span>
            <span class="text-slate-500 text-[10px]">Real-Time Sync</span>
          </div>
          
          <div class="grid grid-cols-2 gap-2 text-[10px]">
            <div>
              <span class="text-slate-400 block font-medium">Tactical Routing:</span>
              <span class="text-slate-200 block truncate">{{ store.latestResult()?.navigation || 'Calculating...' }}</span>
            </div>
            <div>
              <span class="text-slate-400 block font-medium">Transit Status:</span>
              <span class="text-slate-200 block truncate">{{ store.latestResult()?.transportUpdates || 'Calculating...' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Keyframe animation for moving dashes (flow redirection indicator) */
    @keyframes dash {
      to {
        stroke-dashoffset: -20;
      }
    }
  `]
})
export class NexusCanvasMapComponent {
  store = inject(SimulationStore);
  activeScenario = this.store.activeScenario;

  getScenarioLabel(): string {
    const s = this.activeScenario();
    if (s === 'exitSurge') return 'EXIT SURGE GATE A';
    if (s === 'stormInundation') return 'STORM INUNDATION';
    if (s === 'gridlockOutage') return 'WEST GRIDLOCK & OUTAGE';
    return s || '';
  }
}
