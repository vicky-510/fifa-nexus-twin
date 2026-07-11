import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AccessibilityToggleComponent } from '../../../shared/components/accessibility-toggle/accessibility-toggle.component';

@Component({
  selector: 'app-access-code-entry',
  standalone: true,
  imports: [CommonModule, FormsModule, AccessibilityToggleComponent],
  template: `
    <div class="min-h-screen bg-slate-950 flex flex-col items-center justify-between p-6 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950">
      
      <!-- Top header spacing -->
      <div class="w-full max-w-6xl flex justify-between items-center mb-8">
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 rounded-md bg-amber-500 flex items-center justify-center font-black text-slate-950 tracking-tighter">SP</div>
          <span class="text-sm uppercase font-bold tracking-widest text-slate-400">StadiumPulse</span>
        </div>
        <app-accessibility-toggle></app-accessibility-toggle>
      </div>

      <!-- Main Login Container -->
      <div class="w-full max-w-md bg-slate-900/40 border border-slate-800 p-8 rounded-2xl shadow-2xl backdrop-blur-md relative overflow-hidden">
        
        <!-- Cyber decorative top line -->
        <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600"></div>

        <div class="text-center mb-8">
          <div class="w-16 h-16 mx-auto mb-4 bg-slate-800/80 border border-slate-700/60 rounded-full flex items-center justify-center text-amber-500 shadow-inner">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          </div>
          <h1 class="text-2xl font-extrabold tracking-tight text-white mb-2">Command Center Authorization</h1>
          <p class="text-slate-400 text-xs uppercase tracking-wider">FIFA World Cup 2026 Operations Portal</p>
        </div>

        <form (ngSubmit)="onSubmit()" #loginForm="ngForm" class="space-y-6">
          
          <div class="space-y-2">
            <label for="accessCode" class="block text-sm font-medium text-slate-300">Operations Access Code</label>
            <div class="relative">
              <input
                id="accessCode"
                name="accessCode"
                type="password"
                required
                [disabled]="isLoading()"
                [(ngModel)]="accessCode"
                placeholder="••••••••••••"
                class="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 pl-11 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-center tracking-widest font-mono transition-all"
              />
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
                </svg>
              </div>
            </div>
          </div>

          <!-- Error Message Banner -->
          @if (errorMessage()) {
            <div class="bg-red-950/40 border border-red-800/80 px-4 py-3 rounded-lg flex items-center space-x-3 text-red-300 text-sm animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 flex-shrink-0">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
              <span>{{ errorMessage() }}</span>
            </div>
          }

          <button
            type="submit"
            [disabled]="isLoading()"
            class="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-[0.98] text-slate-950 font-bold py-3 px-4 rounded-lg shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            @if (isLoading()) {
              <svg class="animate-spin h-5 w-5 text-slate-950" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Decrypting Session...</span>
            } @else {
              <span>Authenticate Gateway</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            }
          </button>

        </form>
      </div>

      <!-- Footer Info -->
      <div class="text-center text-xs text-slate-500 mt-8 space-y-1">
        <p>FIFA Nexus Twin - Command and Control System &copy; 2026</p>
        <p class="text-slate-600">Access to this system is logged and subject to monitoring. Unauthorized use is prohibited.</p>
      </div>

    </div>
  `
})
export class AccessCodeEntryComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  accessCode = '';
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  onSubmit(): void {
    const code = this.accessCode.trim();
    if (!code) {
      this.errorMessage.set('Please input a valid access code.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.verifyCode(code).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Verification failed. Invalid access credentials.');
      }
    });
  }
}
