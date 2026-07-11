import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SimulationStore } from '../../state/simulation.store';
import { AuthService } from '../../core/services/auth.service';
import { NexusCanvasMapComponent } from './nexus-canvas-map/nexus-canvas-map.component';
import { ScenarioControlDeckComponent } from './scenario-control-deck/scenario-control-deck.component';
import { CyberpunkTerminalComponent } from './cyberpunk-terminal/cyberpunk-terminal.component';
import { AiReasoningStripComponent } from './ai-reasoning-strip/ai-reasoning-strip.component';
import { AccessibilityToggleComponent } from '../../shared/components/accessibility-toggle/accessibility-toggle.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    NexusCanvasMapComponent,
    ScenarioControlDeckComponent,
    CyberpunkTerminalComponent,
    AiReasoningStripComponent,
    AccessibilityToggleComponent
  ],
  template: `
    <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      
      <!-- Top Command Header -->
      <header class="bg-slate-900/40 border-b border-slate-800/80 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 backdrop-blur shadow-sm">
        
        <!-- Logo and Title -->
        <div class="flex items-center space-x-3.5">
          <div class="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center font-black text-slate-950 text-xl tracking-tighter">SP</div>
          <div>
            <h1 class="text-lg font-extrabold tracking-tight text-white leading-none">StadiumPulse Command Centre</h1>
            <p class="text-[10px] text-slate-400 uppercase tracking-widest mt-1">FIFA World Cup 2026 Operations HQ</p>
          </div>
        </div>

        <!-- System Controls & Logout -->
        <div class="flex items-center space-x-4">
          <app-accessibility-toggle></app-accessibility-toggle>
          
          <button 
            (click)="onLogout()"
            class="px-4 py-2 border border-slate-700 hover:border-slate-500 bg-slate-800/40 hover:bg-slate-800 rounded-lg text-xs font-semibold uppercase tracking-wider text-slate-300 transition-all flex items-center space-x-1.5 cursor-pointer"
            aria-label="Logout command center session"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 text-slate-400">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
            </svg>
            <span>Disconnect</span>
          </button>
        </div>
      </header>

      <!-- Main Dashboard Grid Layout -->
      <main class="flex-1 max-w-[1600px] w-full mx-auto p-6 grid grid-cols-1 xl:grid-cols-4 gap-6 overflow-hidden">
        
        <!-- Sidebar Log: Historical Runs (1/4 Width) -->
        <section class="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur shadow-lg flex flex-col h-full">
          <div class="mb-4">
            <h2 class="text-xs font-bold uppercase tracking-wider text-slate-400">
              Operations Log History
            </h2>
            <p class="text-[10px] text-slate-500">Select any record to load static directives</p>
          </div>

          <!-- History List Scroll Box -->
          <div class="flex-1 overflow-y-auto space-y-2.5 max-h-[600px] xl:max-h-[none] pr-1">
            
            <button 
              *ngFor="let item of store.history()"
              (click)="store.selectRecord(item)"
              [class.bg-slate-850]="store.latestResult()?.operationalRecommendation === item.result.operationalRecommendation"
              [class.border-slate-700]="store.latestResult()?.operationalRecommendation === item.result.operationalRecommendation"
              [class.border-slate-850]="store.latestResult()?.operationalRecommendation !== item.result.operationalRecommendation"
              class="w-full text-left p-3 rounded-lg border bg-slate-950/40 hover:bg-slate-900/40 transition-all duration-150 flex flex-col justify-between space-y-2 cursor-pointer group"
            >
              <div class="flex justify-between items-center w-full">
                <!-- Scenario Badge -->
                <span 
                  [class.text-red-400]="item.scenario === 'stormInundation'"
                  [class.bg-red-950\/40]="item.scenario === 'stormInundation'"
                  [class.border-red-900\/50]="item.scenario === 'stormInundation'"
                  [class.text-amber-400]="item.scenario !== 'stormInundation'"
                  [class.bg-amber-950\/40]="item.scenario !== 'stormInundation'"
                  [class.border-amber-900\/50]="item.scenario !== 'stormInundation'"
                  class="px-2 py-0.5 rounded border text-[9px] font-mono font-bold uppercase tracking-wider"
                >
                  {{ getScenarioLabel(item.scenario) }}
                </span>
                
                <!-- Time -->
                <span class="text-[9px] text-slate-500 font-mono">
                  {{ formatDate(item.created_at) }}
                </span>
              </div>

              <!-- One-line rationale snippet -->
              <p class="text-xs text-slate-400 leading-snug truncate w-full group-hover:text-slate-200 transition-colors">
                {{ item.result.operationalRecommendation }}
              </p>
            </button>

            <!-- Loading Spinner inside logs -->
            <div *ngIf="store.isLoading() && store.history().length === 0" class="text-center py-8 text-xs text-slate-500 flex flex-col items-center justify-center space-y-2">
              <span class="animate-spin rounded-full h-5 w-5 border-2 border-slate-500 border-t-transparent"></span>
              <span>Syncing Postgres Logs...</span>
            </div>

            <!-- Empty logs warning -->
            <div *ngIf="!store.isLoading() && store.history().length === 0" class="text-center py-8 text-xs text-slate-600 italic">
              No previous simulation records found.
            </div>

          </div>
        </section>

        <!-- Main HUD Panels Grid (3/4 Width) -->
        <section class="xl:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <!-- Left Column (Visual Map & Terminal console) - takes 2 cols -->
          <div class="md:col-span-2 flex flex-col space-y-6">
            
            <!-- Map Component -->
            <div class="flex-1">
              <app-nexus-canvas-map></app-nexus-canvas-map>
            </div>
            
            <!-- Terminal Component -->
            <div class="flex-1">
              <app-cyberpunk-terminal></app-cyberpunk-terminal>
            </div>

          </div>

          <!-- Right Column (Triggers & AI text) - takes 1 col -->
          <div class="flex flex-col space-y-6">
            
            <!-- Control deck -->
            <div class="flex-1">
              <app-scenario-control-deck></app-scenario-control-deck>
            </div>

            <!-- AI rationale summaries -->
            <div class="flex-1">
              <app-ai-reasoning-strip></app-ai-reasoning-strip>
            </div>

          </div>

        </section>

      </main>

      <!-- Bottom System status bar -->
      <footer class="bg-slate-900/30 border-t border-slate-800/80 px-6 py-2 flex justify-between text-[10px] text-slate-500 font-mono">
        <span>SECURITY ENCRYPTED GATEWAY</span>
        <span>DATABASE STATUS: SUPABASE POOL OK</span>
      </footer>

    </div>
  `
})
export class DashboardComponent implements OnInit {
  store = inject(SimulationStore);
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    // Load simulation history runs
    this.store.loadHistory();
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/access-code']);
  }

  getScenarioLabel(scenario: string): string {
    if (scenario === 'exitSurge') return 'Exit Surge';
    if (scenario === 'stormInundation') return 'Flooding';
    if (scenario === 'gridlockOutage') return 'Gridlock';
    return scenario;
  }

  formatDate(dateStr: string): string {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch (e) {
      return dateStr;
    }
  }
}
