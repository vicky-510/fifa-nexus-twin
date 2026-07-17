import { Component, inject, signal, effect, ElementRef, Renderer2, AfterViewInit, OnDestroy, ViewChild } from '@angular/core';
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
      <h2 id="qrDispatchHeading" class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3"><span aria-hidden="true">📱</span> Ground Staff QR Dispatch</h2>

      @if (!store.activeSimulationId()) {
        <p class="text-[10px] text-slate-600 italic">Trigger a crisis simulation to dispatch mobile directive cards.</p>
      } @else {
        <button
          type="button"
          (click)="openDialog($event)"
          class="w-full px-4 py-2 border border-slate-700 hover:border-cyan-500 bg-slate-800/40 hover:bg-slate-800 rounded-lg text-xs font-semibold uppercase tracking-wider text-slate-300 transition-all cursor-pointer"
        >
          <span aria-hidden="true">📱</span> Open QR Dispatch
        </button>
      }
    </div>

    <!--
      Rendered here so Angular manages its lifecycle, but moved to document.body at
      runtime (see ngAfterViewInit) — same reasoning as change-access-code's overlay:
      an ancestor with backdrop-blur/transform creates a new containing block for
      position:fixed descendants, which would squeeze this overlay into that
      ancestor's box instead of centering on the real viewport.
    -->
    <div #modalRoot>
      @if (isOpen()) {
        <div class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" (click)="close()">
          <div
            #dialogEl
            class="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="qrDispatchDialogHeading"
            (click)="$event.stopPropagation()"
            (keydown)="onDialogKeydown($event)"
          >
            <div class="flex justify-between items-start mb-4">
              <h2 id="qrDispatchDialogHeading" class="text-lg font-bold text-white"><span aria-hidden="true">📱</span> Ground Staff QR Dispatch</h2>
              <button
                #firstFocusable
                type="button"
                (click)="close()"
                aria-label="Close dialog"
                class="text-slate-400 hover:text-white cursor-pointer text-lg leading-none"
              >&times;</button>
            </div>

            <div class="grid grid-cols-2 gap-2 mb-3" role="group" aria-labelledby="qrDispatchDialogHeading">
              @for (role of roles; track role.id) {
                <button
                  type="button"
                  (click)="selectRole(role.id)"
                  [attr.aria-pressed]="selectedRole() === role.id"
                  [attr.aria-label]="'Generate QR dispatch for ' + role.label"
                  [class.border-cyan-500]="selectedRole() === role.id"
                  [class.bg-cyan-500\/10]="selectedRole() === role.id"
                  [class.border-slate-800]="selectedRole() !== role.id"
                  class="p-2.5 border rounded-lg text-[10px] font-semibold text-slate-300 hover:border-slate-600 transition-all cursor-pointer"
                >
                  <span aria-hidden="true">{{ role.icon }}</span> {{ role.label }}
                </button>
              }
            </div>

            @if (qrDataUrl(); as qr) {
              <div class="bg-white rounded-lg p-3 flex flex-col items-center" role="status">
                <img [src]="qr" [attr.alt]="'QR dispatch code for ' + (selectedRole() || 'ground staff') + ' role'" class="w-32 h-32" />
                <p class="text-[9px] text-slate-700 mt-2 font-mono break-all text-center">{{ staffUrl() }}</p>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class QrDispatchModalComponent implements AfterViewInit, OnDestroy {
  store = inject(SimulationStore);
  private renderer = inject(Renderer2);

  @ViewChild('modalRoot') modalRoot!: ElementRef<HTMLElement>;
  @ViewChild('dialogEl') dialogEl?: ElementRef<HTMLElement>;
  @ViewChild('firstFocusable') firstFocusable?: ElementRef<HTMLElement>;

  roles: RoleOption[] = [
    { id: 'security', label: 'Security', icon: '🛡️' },
    { id: 'medical', label: 'Medical', icon: '🏥' },
    { id: 'transport', label: 'Transport', icon: '🚌' },
    { id: 'accessibility', label: 'Accessibility', icon: '♿' }
  ];

  isOpen = signal(false);
  selectedRole = signal<string | null>(null);
  qrDataUrl = signal<string | null>(null);
  staffUrl = signal<string>('');

  /** Element that opened the dialog, so focus can return to it on close. */
  private triggerElement: HTMLElement | null = null;

  constructor() {
    effect(() => {
      const role = this.selectedRole();
      const simId = this.store.activeSimulationId();
      if (role && simId) {
        this.generateQr(simId, role);
      }
    });

    // Focus management: move focus into the dialog when it opens, and back
    // to whatever opened it once it closes.
    effect(() => {
      if (this.isOpen()) {
        setTimeout(() => this.firstFocusable?.nativeElement.focus());
      } else if (this.triggerElement) {
        this.triggerElement.focus();
        this.triggerElement = null;
      }
    });
  }

  ngAfterViewInit(): void {
    this.renderer.appendChild(document.body, this.modalRoot.nativeElement);
  }

  ngOnDestroy(): void {
    this.modalRoot?.nativeElement?.remove();
  }

  openDialog(event: Event): void {
    this.triggerElement = event.currentTarget as HTMLElement;
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
    this.selectedRole.set(null);
    this.qrDataUrl.set(null);
    this.staffUrl.set('');
  }

  onDialogKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.stopPropagation();
      this.close();
      return;
    }
    if (event.key === 'Tab') {
      this.trapFocus(event);
    }
  }

  /** Keeps Tab / Shift+Tab cycling within the dialog while it's open. */
  private trapFocus(event: KeyboardEvent): void {
    const dialog = this.dialogEl?.nativeElement;
    if (!dialog) {
      return;
    }

    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );
    if (focusable.length === 0) {
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (event.shiftKey) {
      if (active === first || !active || !dialog.contains(active)) {
        event.preventDefault();
        last.focus();
      }
    } else {
      if (active === last || !active || !dialog.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    }
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
