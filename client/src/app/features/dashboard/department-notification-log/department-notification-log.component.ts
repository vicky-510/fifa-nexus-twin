import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimulationStore } from '../../../state/simulation.store';
import { AuthService } from '../../../core/services/auth.service';

interface AgencyNotification {
  label: string;
  notified: boolean;
  delayMs: number;
}

@Component({
  selector: 'app-department-notification-log',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur shadow-lg">
      <h2 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Dispatch Status</h2>
      <p class="text-[10px] text-slate-500 mb-3">{{ notifiedCount() }}/{{ notifications().length }} agencies notified</p>

      <div class="space-y-1.5" role="status" aria-live="polite" aria-label="Agency dispatch notification status">
        @for (n of notifications(); track n.label) {
          <div class="flex items-center justify-between text-[10px] font-mono">
            <span [class.text-emerald-400]="n.notified" [class.text-slate-600]="!n.notified">
              <span aria-hidden="true">{{ n.notified ? '✅' : '⏳' }}</span> {{ n.label }}
            </span>
            <span class="text-slate-600">{{ n.notified ? 'notified' : 'pending...' }}</span>
          </div>
        }
      </div>
    </div>
  `
})
export class DepartmentNotificationLogComponent {
  store = inject(SimulationStore);
  private authService = inject(AuthService);

  notifications = signal<AgencyNotification[]>([
    { label: 'Gate Operations Team Lead', notified: false, delayMs: 300 },
    { label: 'Medical Unit 1 (Sector A)', notified: false, delayMs: 300 },
    { label: 'Security Perimeter Chief', notified: false, delayMs: 500 },
    { label: 'Fire & Rescue Standby', notified: false, delayMs: 700 },
    { label: 'Transport Coordinator', notified: false, delayMs: 400 },
    { label: 'Accessibility Supervisor', notified: false, delayMs: 500 },
    { label: 'Sustainability Control Room', notified: false, delayMs: 900 },
    { label: 'Communications Desk', notified: false, delayMs: 600 }
  ]);

  notifiedCount = signal(0);

  constructor() {
    let lastScenario: string | null = null;
    effect(() => {
      const scenario = this.store.activeScenario();
      if (scenario && scenario !== lastScenario) {
        lastScenario = scenario;
        this.dispatchNotifications();
      }
    });
  }

  private dispatchNotifications(): void {
    const reset = this.notifications().map(n => ({ ...n, notified: false }));
    this.notifications.set(reset);
    this.notifiedCount.set(0);

    reset.forEach((n, i) => {
      setTimeout(() => {
        this.notifications.update(list =>
          list.map((item, idx) => idx === i ? { ...item, notified: true } : item)
        );
        this.notifiedCount.update(c => c + 1);
        // Guests can passively trigger this simulated dispatch just by viewing a
        // historical record (no click involved), so — unlike the other manual-note
        // actions elsewhere, which are disabled at the UI — this one is silently
        // skipped for guests rather than surfacing an error for something they
        // never asked to do.
        if (this.notifiedCount() === reset.length && !this.authService.isGuest()) {
          this.store.addManualNote(`All ${reset.length} agencies notified`);
        }
      }, n.delayMs + i * 100);
    });
  }
}
