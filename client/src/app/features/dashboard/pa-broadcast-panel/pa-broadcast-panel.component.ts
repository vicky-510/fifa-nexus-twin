import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimulationStore } from '../../../state/simulation.store';

type Lang = 'en' | 'es' | 'fr';

@Component({
  selector: 'app-pa-broadcast-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur shadow-lg">
      <h2 class="text-md font-bold uppercase tracking-wider text-slate-100 mb-1 flex items-center space-x-2">
        <span aria-hidden="true">📢</span><span>Stadium PA System — Broadcast Ready</span>
      </h2>
      <p class="text-[10px] text-slate-400 mb-4">Simulated public announcement dispatch</p>

      @if (store.latestResult(); as result) {
        <div class="space-y-2.5 mb-4">
          @for (lang of langs; track lang) {
            <div class="bg-slate-950/40 border border-slate-800 rounded-lg p-3 flex items-center justify-between gap-3">
              <div class="min-w-0">
                <span class="text-[10px] font-bold uppercase text-slate-400"><span aria-hidden="true">{{ langFlag(lang) }}</span> {{ lang }}</span>
                <p class="text-xs text-slate-300 truncate">"{{ result.multilingualScripts[lang] }}"</p>
              </div>
              <button
                type="button"
                (click)="broadcast(lang, result.multilingualScripts[lang])"
                [disabled]="liveLang() === lang"
                [attr.aria-label]="'Broadcast ' + lang + ' announcement'"
                class="shrink-0 px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 disabled:opacity-50 border border-cyan-500/30 text-cyan-400 rounded text-[10px] font-bold uppercase cursor-pointer transition-all"
              >
                <span aria-hidden="true">▶</span> Broadcast
              </button>
            </div>
          }
        </div>

        <button
          type="button"
          (click)="broadcastAll(result.multilingualScripts)"
          [disabled]="!!liveLang()"
          class="w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold py-2.5 rounded-lg text-xs uppercase tracking-wider cursor-pointer transition-all"
        >
          <span aria-hidden="true">🔊</span> Broadcast All Languages Simultaneously
        </button>

        @if (liveLang(); as lang) {
          <div class="mt-3 flex items-center justify-center space-x-2 text-red-400 text-xs font-bold animate-pulse" role="status" aria-live="polite">
            <span class="w-2 h-2 rounded-full bg-red-500" aria-hidden="true"></span>
            <span>LIVE ON AIR ({{ lang.toUpperCase() }}) — {{ countdown() }}s</span>
          </div>
        }

        @if (audioError(); as err) {
          <div class="mt-3 bg-amber-950/40 border border-amber-800/80 px-3 py-2 rounded-lg text-[10px] text-amber-300" role="alert">
            <span aria-hidden="true">🔇</span> {{ err }}
          </div>
        }
      } @else {
        <div class="text-center py-6 text-xs text-slate-600 italic">
          Trigger a crisis simulation to generate broadcast scripts.
        </div>
      }
    </div>
  `
})
export class PaBroadcastPanelComponent {
  store = inject(SimulationStore);
  langs: Lang[] = ['en', 'es', 'fr'];

  liveLang = signal<string | null>(null);
  countdown = signal<number>(30);

  private audioCtx: AudioContext | null = null;

  langFlag(lang: Lang): string {
    return { en: '🇬🇧', es: '🇪🇸', fr: '🇫🇷' }[lang];
  }

  private static readonly LOCALE: Record<Lang, string> = {
    en: 'en-GB',
    es: 'es-ES',
    fr: 'fr-FR'
  };

  broadcast(lang: Lang, script: string): void {
    this.playChime();
    this.speak(script, lang);
    this.startLiveState(lang);
    this.store.addManualNote(`PA Broadcast sent — ${lang.toUpperCase()}: "${script}"`);
  }

  broadcastAll(scripts: Record<Lang, string>): void {
    this.playChime();
    this.langs.forEach(lang => this.speak(scripts[lang], lang));
    this.startLiveState('EN/ES/FR');
    this.store.addManualNote(`PA Broadcast sent — EN/ES/FR (all languages simultaneously)`);
  }

  /**
   * Speaks the announcement aloud in the correct language via the browser's
   * built-in Web Speech API. Utterances queued with speechSynthesis.speak()
   * play sequentially, so calling this multiple times in a row (broadcastAll)
   * announces each language one after another rather than overlapping.
   */
  private speak(text: string, lang: Lang): void {
    if (!('speechSynthesis' in window)) {
      this.audioError.set('Text-to-speech is not supported in this browser.');
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = PaBroadcastPanelComponent.LOCALE[lang];
      utterance.rate = 0.95;
      utterance.onerror = (event) => {
        console.error('[PA Broadcast] Speech synthesis error:', event);
        this.audioError.set(`Speech synthesis failed for ${lang.toUpperCase()}.`);
      };
      window.speechSynthesis.speak(utterance);
    } catch (err: any) {
      console.error('[PA Broadcast] Failed to speak announcement:', err);
      this.audioError.set('Text-to-speech failed: ' + (err?.message || err));
    }
  }

  private startLiveState(lang: string): void {
    this.liveLang.set(lang);
    this.countdown.set(30);
    const interval = setInterval(() => {
      const remaining = this.countdown() - 1;
      if (remaining <= 0) {
        clearInterval(interval);
        this.liveLang.set(null);
      } else {
        this.countdown.set(remaining);
      }
    }, 1000);
  }

  audioError = signal<string | null>(null);

  private playChime(): void {
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = this.audioCtx;
      this.audioError.set(null);

      // Browsers create/keep AudioContext in "suspended" state until explicitly
      // resumed — without this, the oscillator schedules silently and no sound plays.
      const start = () => this.emitTwoToneChime(ctx);
      if (ctx.state === 'suspended') {
        ctx.resume().then(start).catch((err) => {
          console.error('[PA Broadcast] AudioContext.resume() failed:', err);
          this.audioError.set('Audio blocked by browser: ' + (err?.message || err));
        });
      } else {
        start();
      }
    } catch (err: any) {
      console.error('[PA Broadcast] Failed to play chime:', err);
      this.audioError.set('Audio failed: ' + (err?.message || err));
    }
  }

  private emitTwoToneChime(ctx: AudioContext): void {
    // Two-tone "ding-dong" style PA chime, louder and longer than a single blip
    const tones = [
      { freq: 880, start: 0, duration: 0.35 },
      { freq: 660, start: 0.3, duration: 0.45 }
    ];

    for (const tone of tones) {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = ctx.currentTime + tone.start;

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(tone.freq, startTime);
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.35, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + tone.duration);

      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(startTime);
      oscillator.stop(startTime + tone.duration + 0.05);
    }
  }
}
