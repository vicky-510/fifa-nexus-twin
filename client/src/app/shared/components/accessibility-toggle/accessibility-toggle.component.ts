import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-accessibility-toggle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center space-x-3 bg-slate-800/90 backdrop-blur border border-slate-700/80 px-4 py-2 rounded-lg text-sm text-slate-300 shadow-md">
      <span class="font-medium text-slate-400 text-xs uppercase tracking-wider">Accessibility:</span>
      
      <button 
        (click)="toggleContrast()"
        [class.bg-amber-400]="isHighContrast()"
        [class.text-slate-950]="isHighContrast()"
        [class.bg-slate-700]="!isHighContrast()"
        [class.hover:bg-slate-600]="!isHighContrast()"
        class="px-3 py-1 rounded font-medium border border-slate-600/50 transition-all duration-200 flex items-center space-x-1 cursor-pointer"
        aria-label="Toggle High Contrast Mode"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v18m9-9a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
        <span>Contrast</span>
      </button>

      <button 
        (click)="toggleFontSize()"
        [class.bg-amber-400]="isLargeText()"
        [class.text-slate-950]="isLargeText()"
        [class.bg-slate-700]="!isLargeText()"
        [class.hover:bg-slate-600]="!isLargeText()"
        class="px-3 py-1 rounded font-medium border border-slate-600/50 transition-all duration-200 flex items-center space-x-1 cursor-pointer"
        aria-label="Toggle Large Text Mode"
      >
        <span class="font-bold text-xs">A+</span>
        <span>Large Text</span>
      </button>
    </div>
  `
})
export class AccessibilityToggleComponent {
  readonly isHighContrast = signal<boolean>(false);
  readonly isLargeText = signal<boolean>(false);

  toggleContrast(): void {
    this.isHighContrast.update(val => {
      const next = !val;
      if (next) {
        document.body.classList.add('high-contrast');
      } else {
        document.body.classList.remove('high-contrast');
      }
      return next;
    });
  }

  toggleFontSize(): void {
    this.isLargeText.update(val => {
      const next = !val;
      if (next) {
        document.documentElement.classList.add('large-text');
      } else {
        document.documentElement.classList.remove('large-text');
      }
      return next;
    });
  }
}
