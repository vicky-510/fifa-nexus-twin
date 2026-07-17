import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { StaffService, PublicSimulationRecord } from '../../core/services/staff.service';
import { SimulationResult } from '../../core/services/simulation.service';

const ROLE_TO_AGENCY: Record<string, { key: keyof SimulationResult; label: string; icon: string }> = {
  security: { key: 'security', label: 'Security / Police', icon: '🛡️' },
  medical: { key: 'medical', label: 'Emergency Medical', icon: '🏥' },
  transport: { key: 'transport', label: 'Transport Steward', icon: '🚌' },
  accessibility: { key: 'accessibility', label: 'Accessibility Guide', icon: '♿' }
};

@Component({
  selector: 'app-staff-mobile-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans">
      @if (record(); as r) {
        <div class="w-full max-w-sm bg-slate-900 border-2 rounded-2xl overflow-hidden shadow-2xl" [class]="severityBorder(r.severity)" role="region" aria-live="polite" aria-label="Staff directive card">
          <div class="p-4" [class]="severityBg(r.severity)">
            <div class="text-white font-black text-lg leading-tight"><span aria-hidden="true">{{ severityIcon(r.severity) }}</span> {{ r.severity }} — {{ r.scenarioLabel }}</div>
            <div class="text-white/80 text-xs mt-1">{{ r.stadiumName }}{{ r.gate ? ' | ' + r.gate : '' }}</div>
            <div class="text-white/60 text-[10px] mt-1">Issued: {{ formatTime(r.createdAt) }}</div>
          </div>

          <div class="p-4 space-y-3">
            <div class="text-center">
              <span class="text-[10px] uppercase tracking-widest text-slate-500">Your Role</span>
              <div class="text-lg font-bold text-white"><span aria-hidden="true">{{ roleInfo.icon }}</span> {{ roleInfo.label }}</div>
            </div>

            <div class="bg-slate-950/60 border border-slate-800 rounded-lg p-3">
              <p class="text-sm text-slate-200 leading-relaxed"><span aria-hidden="true">▶</span> {{ r.result[roleInfo.key] }}</p>
            </div>

            <div class="bg-slate-950/60 border border-slate-800 rounded-lg p-3">
              <span class="text-[10px] uppercase tracking-widest text-slate-500 block mb-1"><span aria-hidden="true">📢</span> Say to crowd</span>
              <p class="text-xs text-slate-300">EN: "{{ r.result.multilingualScripts.en }}"</p>
              <p class="text-xs text-slate-300 mt-1">ES: "{{ r.result.multilingualScripts.es }}"</p>
            </div>

            <div class="flex justify-between items-center pt-2 border-t border-slate-800 text-[10px] text-slate-500">
              <span><span aria-hidden="true">⚠️</span> Severity: {{ r.severity }}</span>
              <span><span aria-hidden="true">🕐</span> Next update in: {{ secondsToRefresh() }}s</span>
            </div>
          </div>
        </div>
      } @else if (error()) {
        <div class="text-center text-slate-500 text-sm" role="alert">{{ error() }}</div>
      } @else {
        <div class="text-center text-slate-500 text-sm animate-pulse" role="status" aria-live="polite">Loading directive card...</div>
      }
    </div>
  `
})
export class StaffMobileCardComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private staffService = inject(StaffService);

  record = signal<PublicSimulationRecord | null>(null);
  error = signal<string | null>(null);
  secondsToRefresh = signal(60);

  roleInfo = ROLE_TO_AGENCY['security'];
  private crisisId = '';
  private refreshInterval: any;
  private countdownInterval: any;

  ngOnInit(): void {
    this.crisisId = this.route.snapshot.paramMap.get('crisisId') || '';
    const role = this.route.snapshot.paramMap.get('role') || 'security';
    this.roleInfo = ROLE_TO_AGENCY[role] || ROLE_TO_AGENCY['security'];

    this.fetchRecord();
    this.refreshInterval = setInterval(() => this.fetchRecord(), 60000);
    this.countdownInterval = setInterval(() => {
      this.secondsToRefresh.update(s => (s <= 1 ? 60 : s - 1));
    }, 1000);
  }

  ngOnDestroy(): void {
    clearInterval(this.refreshInterval);
    clearInterval(this.countdownInterval);
  }

  private fetchRecord(): void {
    this.staffService.getPublicRecord(this.crisisId).subscribe({
      next: (data) => {
        this.record.set(data);
        this.secondsToRefresh.set(60);
      },
      error: () => this.error.set('Directive card not found or has expired.')
    });
  }

  formatTime(ts: string): string {
    try {
      return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return ts;
    }
  }

  severityIcon(severity: string): string {
    const icons: Record<string, string> = { ADVISORY: '🟡', ELEVATED: '🟠', CRITICAL: '🔴', CATASTROPHIC: '🚨' };
    return icons[severity] || '🔴';
  }

  severityBorder(severity: string): string {
    const colors: Record<string, string> = {
      ADVISORY: 'border-amber-500',
      ELEVATED: 'border-orange-500',
      CRITICAL: 'border-red-500',
      CATASTROPHIC: 'border-red-600'
    };
    return colors[severity] || 'border-red-500';
  }

  severityBg(severity: string): string {
    const colors: Record<string, string> = {
      ADVISORY: 'bg-amber-600',
      ELEVATED: 'bg-orange-600',
      CRITICAL: 'bg-red-600',
      CATASTROPHIC: 'bg-red-700'
    };
    return colors[severity] || 'bg-red-600';
  }
}
