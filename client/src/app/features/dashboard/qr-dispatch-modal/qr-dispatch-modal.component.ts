import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimulationStore } from '../../../state/simulation.store';
import * as QRCode from 'qrcode';

interface RoleOption {
  id: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-qr-dispatch-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur shadow-lg">
      <h2 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">📱 Ground Staff QR Dispatch</h2>

      @if (!store.activeSimulationId()) {
        <p class="text-[10px] text-slate-600 italic">Trigger a crisis simulation to dispatch mobile directive cards.</p>
      } @else {
        <div class="grid grid-cols-2 gap-2 mb-3">
          @for (role of roles; track role.id) {
            <button
              (click)="selectRole(role.id)"
              [class.border-cyan-500]="selectedRole() === role.id"
              [class.bg-cyan-500\/10]="selectedRole() === role.id"
              [class.border-slate-800]="selectedRole() !== role.id"
              class="p-2.5 border rounded-lg text-[10px] font-semibold text-slate-300 hover:border-slate-600 transition-all cursor-pointer"
            >
              {{ role.icon }} {{ role.label }}
            </button>
          }
        </div>

        @if (qrDataUrl(); as qr) {
          <div class="bg-white rounded-lg p-3 flex flex-col items-center">
            <img [src]="qr" alt="QR dispatch code" class="w-32 h-32" />
            <p class="text-[9px] text-slate-700 mt-2 font-mono break-all text-center">{{ staffUrl() }}</p>
          </div>
        }
      }
    </div>
  `
})
export class QrDispatchModalComponent {
  store = inject(SimulationStore);

  roles: RoleOption[] = [
    { id: 'security', label: 'Security', icon: '🛡️' },
    { id: 'medical', label: 'Medical', icon: '🏥' },
    { id: 'transport', label: 'Transport', icon: '🚌' },
    { id: 'accessibility', label: 'Accessibility', icon: '♿' }
  ];

  selectedRole = signal<string | null>(null);
  qrDataUrl = signal<string | null>(null);
  staffUrl = signal<string>('');

  constructor() {
    effect(() => {
      const role = this.selectedRole();
      const simId = this.store.activeSimulationId();
      if (role && simId) {
        this.generateQr(simId, role);
      }
    });
  }

  selectRole(roleId: string): void {
    this.selectedRole.set(roleId);
  }

  private async generateQr(simulationId: number, role: string): Promise<void> {
    const url = `${window.location.origin}/staff/${simulationId}/${role}`;
    this.staffUrl.set(url);
    try {
      const dataUrl = await QRCode.toDataURL(url, { width: 200, margin: 1 });
      this.qrDataUrl.set(dataUrl);
    } catch {
      this.qrDataUrl.set(null);
    }
  }
}
