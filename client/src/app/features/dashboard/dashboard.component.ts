import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { SimulationStore } from '../../state/simulation.store';
import { StadiumStore } from '../../state/stadium.store';
import { AuthService } from '../../core/services/auth.service';
import { NexusCanvasMapComponent } from './nexus-canvas-map/nexus-canvas-map.component';
import { ScenarioControlDeckComponent } from './scenario-control-deck/scenario-control-deck.component';
import { CyberpunkTerminalComponent } from './cyberpunk-terminal/cyberpunk-terminal.component';
import { AgencyPanelGridComponent } from './agency-panel-grid/agency-panel-grid.component';
import { LiveMatchTickerComponent } from './live-match-ticker/live-match-ticker.component';
import { CrisisTimelineComponent } from './crisis-timeline/crisis-timeline.component';
import { PredictiveRiskPanelComponent } from './predictive-risk-panel/predictive-risk-panel.component';
import { PaBroadcastPanelComponent } from './pa-broadcast-panel/pa-broadcast-panel.component';
import { SignagePreviewComponent } from './signage-preview/signage-preview.component';
import { DepartmentNotificationLogComponent } from './department-notification-log/department-notification-log.component';
import { QrDispatchModalComponent } from './qr-dispatch-modal/qr-dispatch-modal.component';
import { AccessibilityToggleComponent } from '../../shared/components/accessibility-toggle/accessibility-toggle.component';
import { ChangeAccessCodeComponent } from '../../shared/components/change-access-code/change-access-code.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    NexusCanvasMapComponent,
    ScenarioControlDeckComponent,
    CyberpunkTerminalComponent,
    AgencyPanelGridComponent,
    LiveMatchTickerComponent,
    CrisisTimelineComponent,
    PredictiveRiskPanelComponent,
    PaBroadcastPanelComponent,
    SignagePreviewComponent,
    DepartmentNotificationLogComponent,
    QrDispatchModalComponent,
    AccessibilityToggleComponent,
    ChangeAccessCodeComponent
  ],
  template: `
    <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">

      <!-- Top Command Header -->
      <header class="bg-slate-900/40 border-b border-slate-800/80 px-6 py-4 flex flex-col gap-3 backdrop-blur shadow-sm">
        <div class="flex flex-col lg:flex-row justify-between items-center gap-4">
          <div class="flex items-center space-x-3.5 self-start lg:self-auto">
            <button (click)="goToSelector()" class="w-10 h-10 shrink-0 rounded-lg bg-amber-500 flex items-center justify-center font-black text-slate-950 text-xl tracking-tighter cursor-pointer">SP</button>
            <div>
              <h1 class="text-base sm:text-lg font-extrabold tracking-tight text-white leading-none">StadiumPulse Command Centre</h1>
              <p class="text-[10px] text-slate-400 uppercase tracking-widest mt-1">FIFA World Cup 2026 Operations HQ</p>
            </div>
          </div>

          <div class="flex flex-wrap items-center justify-center lg:justify-end gap-2">
            <button
              (click)="goToSelector()"
              class="px-3 sm:px-4 py-2 border border-slate-700 hover:border-cyan-500 bg-slate-800/40 hover:bg-slate-800 rounded-lg text-xs font-semibold uppercase tracking-wider text-slate-300 transition-all cursor-pointer"
            >
              🗺️ Map View
            </button>
            <app-change-access-code></app-change-access-code>
            <app-accessibility-toggle></app-accessibility-toggle>
            <button
              (click)="onLogout()"
              class="px-3 sm:px-4 py-2 border border-slate-700 hover:border-slate-500 bg-slate-800/40 hover:bg-slate-800 rounded-lg text-xs font-semibold uppercase tracking-wider text-slate-300 transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <span>Disconnect</span>
            </button>
          </div>
        </div>

        <!-- Live match ticker -->
        <app-live-match-ticker
          [stadium]="stadiumStore.selectedStadium()"
          [match]="stadiumStore.selectedStadiumMatch()"
        ></app-live-match-ticker>
      </header>

      <!-- Main Dashboard Grid Layout -->
      <main class="flex-1 max-w-[1600px] w-full mx-auto p-3 sm:p-6 grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-6">

        <!-- Sidebar Log: Historical Runs (1/4 Width) -->
        <section class="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur shadow-lg flex flex-col h-full">
          <div class="mb-4">
            <h2 class="text-xs font-bold uppercase tracking-wider text-slate-400">Operations Log History</h2>
            <p class="text-[10px] text-slate-500">Select any record to load static directives</p>
          </div>

          <div class="flex-1 overflow-y-auto space-y-2.5 max-h-[300px] xl:max-h-[none] pr-1">
            <button
              *ngFor="let item of store.history()"
              (click)="store.selectRecord(item)"
              [class.bg-slate-850]="store.activeSimulationId() === item.id"
              [class.border-slate-700]="store.activeSimulationId() === item.id"
              [class.border-slate-850]="store.activeSimulationId() !== item.id"
              class="w-full text-left p-3 rounded-lg border bg-slate-950/40 hover:bg-slate-900/40 transition-all duration-150 flex flex-col justify-between space-y-2 cursor-pointer group"
            >
              <div class="flex justify-between items-center w-full">
                <span class="px-2 py-0.5 rounded border text-[9px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-950/40 border-amber-900/50">
                  {{ item.scenario }}
                </span>
                <span class="text-[9px] text-slate-500 font-mono">{{ formatDate(item.created_at) }}</span>
              </div>
              <p class="text-xs text-slate-400 leading-snug truncate w-full group-hover:text-slate-200 transition-colors">
                {{ item.result.operationalRecommendation }}
              </p>
            </button>

            <div *ngIf="store.isLoading() && store.history().length === 0" class="text-center py-8 text-xs text-slate-500 flex flex-col items-center justify-center space-y-2">
              <span class="animate-spin rounded-full h-5 w-5 border-2 border-slate-500 border-t-transparent"></span>
              <span>Syncing Postgres Logs...</span>
            </div>

            <div *ngIf="!store.isLoading() && store.history().length === 0" class="text-center py-8 text-xs text-slate-600 italic">
              No previous simulation records found.
            </div>
          </div>

          <!-- Crisis timeline -->
          <div class="mt-4 pt-4 border-t border-slate-800">
            <app-crisis-timeline></app-crisis-timeline>
          </div>
        </section>

        <!-- Main HUD Panels Grid (3/4 Width) -->
        <section class="xl:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">

          <!-- Left Column -->
          <div class="md:col-span-2 flex flex-col space-y-6">
            <div class="flex-1">
              <app-nexus-canvas-map [stadium]="stadiumStore.selectedStadium()"></app-nexus-canvas-map>
            </div>
            <div class="flex-1">
              <app-cyberpunk-terminal></app-cyberpunk-terminal>
            </div>
            <div class="flex-1">
              <app-predictive-risk-panel></app-predictive-risk-panel>
            </div>
            <div class="flex-1">
              <app-pa-broadcast-panel></app-pa-broadcast-panel>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <app-signage-preview></app-signage-preview>
              <app-department-notification-log></app-department-notification-log>
            </div>
          </div>

          <!-- Right Column -->
          <div class="flex flex-col space-y-6">
            <div class="flex-1">
              <app-scenario-control-deck [stadiumId]="stadiumId"></app-scenario-control-deck>
            </div>
            <div class="flex-1">
              <app-qr-dispatch-modal></app-qr-dispatch-modal>
            </div>
            <div class="flex-1">
              <app-agency-panel-grid></app-agency-panel-grid>
            </div>
          </div>

        </section>

      </main>

      <footer class="bg-slate-900/30 border-t border-slate-800/80 px-6 py-2 flex justify-between text-[10px] text-slate-500 font-mono">
        <span>SECURITY ENCRYPTED GATEWAY</span>
        <span>DATABASE STATUS: SUPABASE POOL OK</span>
      </footer>

    </div>
  `
})
export class DashboardComponent implements OnInit {
  store = inject(SimulationStore);
  stadiumStore = inject(StadiumStore);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  stadiumId: string | null = null;

  ngOnInit(): void {
    this.stadiumStore.loadReferenceData();
    this.route.paramMap.subscribe(params => {
      const id = params.get('stadiumId');
      this.stadiumId = id;
      if (id) {
        this.stadiumStore.selectStadium(id);
        this.store.loadHistory(id);
      }
    });
  }

  goToSelector(): void {
    this.router.navigate(['/']);
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/access-code']);
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
