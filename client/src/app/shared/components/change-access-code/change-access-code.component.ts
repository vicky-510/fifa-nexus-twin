import {
  Component,
  signal,
  inject,
  ElementRef,
  Renderer2,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  effect,
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { trapFocus } from '../../a11y/focus-trap';

@Component({
  selector: 'app-change-access-code',
  standalone: true,
  imports: [FormsModule],
  template: `
    <button
      type="button"
      (click)="openDialog($event)"
      class="px-4 py-2 border border-slate-700 hover:border-cyan-500 bg-slate-800/40 hover:bg-slate-800 rounded-lg text-xs font-semibold uppercase tracking-wider text-slate-300 transition-all cursor-pointer"
    >
      <span aria-hidden="true">🔑</span> Change Access Code
    </button>

    <!--
      Rendered here in the template so Angular manages its lifecycle, but moved to
      document.body at runtime (see ngAfterViewInit) since this component lives inside a
      header with backdrop-blur, and per spec backdrop-filter (like filter or
      transform) creates a new containing block for position:fixed descendants.
      Left in place, this overlay would be sized against the header bar instead of
      the viewport, squeezing it into a thin strip at the top of the page.
    -->
    <div #modalRoot>
      @if (isOpen()) {
        <!-- Backdrop click-to-close is a mouse-only affordance by design; keyboard
             users close via Escape on the dialog itself, so the scrim is presentational. -->
        <div
          role="presentation"
          class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          (click)="close()"
        >
          <div
            #dialogEl
            class="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="changeAccessCodeHeading"
            (click)="$event.stopPropagation()"
            (keydown)="onDialogKeydown($event)"
          >
            <h2 id="changeAccessCodeHeading" class="text-lg font-bold text-white mb-1">
              Rotate Shared Access Code
            </h2>
            <p class="text-xs text-slate-400 mb-5">
              You choose the new code — it's never shown or transmitted anywhere else, so relay it
              to the rest of the ops team yourself (radio, shift briefing, etc.). This will log
              everyone out, including you.
            </p>

            <form (ngSubmit)="onSubmit()" class="space-y-4">
              <div>
                <label for="currentCode" class="block text-xs font-medium text-slate-300 mb-1"
                  >Current Code</label
                >
                <input
                  #firstFocusable
                  id="currentCode"
                  type="password"
                  [(ngModel)]="currentCode"
                  name="currentCode"
                  required
                  [disabled]="isLoading()"
                  class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label for="newCode" class="block text-xs font-medium text-slate-300 mb-1"
                  >New Code (min. 6 characters)</label
                >
                <input
                  id="newCode"
                  type="password"
                  [(ngModel)]="newCode"
                  name="newCode"
                  required
                  minlength="6"
                  [disabled]="isLoading()"
                  class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label for="confirmCode" class="block text-xs font-medium text-slate-300 mb-1"
                  >Confirm New Code</label
                >
                <input
                  id="confirmCode"
                  type="password"
                  [(ngModel)]="confirmCode"
                  name="confirmCode"
                  required
                  [disabled]="isLoading()"
                  class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              @if (errorMessage()) {
                <div
                  class="bg-red-950/40 border border-red-800/80 px-3 py-2 rounded-lg text-xs text-red-300"
                  role="alert"
                >
                  {{ errorMessage() }}
                </div>
              }

              @if (successMessage()) {
                <div
                  class="bg-emerald-950/40 border border-emerald-800/80 px-3 py-2 rounded-lg text-xs text-emerald-300"
                  role="status"
                >
                  {{ successMessage() }}
                </div>
              }

              <div class="flex space-x-2 pt-2">
                <button
                  type="button"
                  (click)="close()"
                  [disabled]="isLoading()"
                  aria-label="Cancel and close dialog"
                  class="flex-1 py-2 border border-slate-700 hover:border-slate-500 rounded-lg text-xs font-semibold uppercase tracking-wider text-slate-300 cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  [disabled]="isLoading()"
                  class="flex-1 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-950 cursor-pointer transition-all"
                >
                  {{ isLoading() ? 'Rotating...' : 'Rotate Code' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
})
export class ChangeAccessCodeComponent implements AfterViewInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private renderer = inject(Renderer2);

  @ViewChild('modalRoot') modalRoot!: ElementRef<HTMLElement>;
  @ViewChild('dialogEl') dialogEl?: ElementRef<HTMLElement>;
  @ViewChild('firstFocusable') firstFocusable?: ElementRef<HTMLElement>;

  isOpen = signal(false);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  currentCode = '';
  newCode = '';
  confirmCode = '';

  /** Element that opened the dialog, so focus can return to it on close. */
  private triggerElement: HTMLElement | null = null;

  constructor() {
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
    // Re-parent to <body> once so the overlay's `position: fixed` is relative to
    // the real viewport, not a blurred/transformed ancestor.
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
    this.currentCode = '';
    this.newCode = '';
    this.confirmCode = '';
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  onDialogKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.stopPropagation();
      this.close();
      return;
    }
    const dialog = this.dialogEl?.nativeElement;
    if (dialog) {
      trapFocus(dialog, event);
    }
  }

  onSubmit(): void {
    this.errorMessage.set(null);

    if (this.newCode !== this.confirmCode) {
      this.errorMessage.set('New code and confirmation do not match.');
      return;
    }
    if (this.newCode.length < 6) {
      this.errorMessage.set('New code must be at least 6 characters.');
      return;
    }

    this.isLoading.set(true);
    this.authService.changeCode(this.currentCode, this.newCode).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.successMessage.set('Code rotated. Logging out — sign back in with the new code.');
        this.authService.logout();
        setTimeout(() => this.router.navigate(['/access-code']), 1500);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.error?.error || 'Failed to change access code.');
      },
    });
  }
}
