import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { PaBroadcastPanelComponent } from './pa-broadcast-panel.component';
import { SimulationStore } from '../../../state/simulation.store';

describe('PaBroadcastPanelComponent', () => {
  let storeStub: { latestResult: ReturnType<typeof signal<any>>; addManualNote: jasmine.Spy };
  let speechSynthesisSpy: jasmine.Spy;
  const scripts = { en: 'Please evacuate calmly.', es: 'Por favor evacuen con calma.', fr: 'Veuillez evacuer calmement.' };

  beforeEach(async () => {
    storeStub = {
      latestResult: signal<any>(null),
      addManualNote: jasmine.createSpy('addManualNote')
    };

    await TestBed.configureTestingModule({
      imports: [PaBroadcastPanelComponent],
      providers: [{ provide: SimulationStore, useValue: storeStub }]
    }).compileComponents();

    // Stub Web Audio / Speech Synthesis so tests don't produce real sound/errors
    // and behave deterministically across environments.
    spyOn(window, 'AudioContext').and.returnValue({
      state: 'running',
      currentTime: 0,
      createOscillator: () => ({
        type: '',
        frequency: { setValueAtTime: () => {} },
        connect: () => {},
        start: () => {},
        stop: () => {}
      }),
      createGain: () => ({
        gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
        connect: () => {}
      })
    } as any);

    speechSynthesisSpy = spyOnProperty(window, 'speechSynthesis', 'get').and.returnValue({
      speak: jasmine.createSpy('speak')
    } as any);
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(PaBroadcastPanelComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show empty state when there is no latestResult', () => {
    const fixture = TestBed.createComponent(PaBroadcastPanelComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Trigger a crisis simulation');
  });

  it('should list a broadcast button per language when a result exists', () => {
    storeStub.latestResult.set({ multilingualScripts: scripts });
    const fixture = TestBed.createComponent(PaBroadcastPanelComponent);
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('button');
    // 3 per-language buttons + 1 "broadcast all" button
    expect(buttons.length).toBe(4);
  });

  describe('broadcast', () => {
    it('should log a manual note and enter the live state for the chosen language', () => {
      jasmine.clock().install();
      try {
        storeStub.latestResult.set({ multilingualScripts: scripts });
        const fixture = TestBed.createComponent(PaBroadcastPanelComponent);
        const comp = fixture.componentInstance;
        fixture.detectChanges();

        comp.broadcast('en', scripts.en);

        expect(storeStub.addManualNote).toHaveBeenCalledWith(
          `PA Broadcast sent — EN: "${scripts.en}"`
        );
        expect(comp.liveLang()).toBe('en');
        expect(comp.countdown()).toBe(30);

        jasmine.clock().tick(30000);
        expect(comp.liveLang()).toBeNull();
      } finally {
        jasmine.clock().uninstall();
      }
    });

    it('should disable the button for the currently broadcasting language', () => {
      storeStub.latestResult.set({ multilingualScripts: scripts });
      const fixture = TestBed.createComponent(PaBroadcastPanelComponent);
      const comp = fixture.componentInstance;
      comp.liveLang.set('en');
      fixture.detectChanges();

      const firstButton: HTMLButtonElement = fixture.nativeElement.querySelector('button');
      expect(firstButton.disabled).toBe(true);
    });
  });

  describe('broadcastAll', () => {
    it('should log a combined note and set liveLang to the combined label', () => {
      const fixture = TestBed.createComponent(PaBroadcastPanelComponent);
      const comp = fixture.componentInstance;
      comp.broadcastAll(scripts);

      expect(storeStub.addManualNote).toHaveBeenCalledWith(
        'PA Broadcast sent — EN/ES/FR (all languages simultaneously)'
      );
      expect(comp.liveLang()).toBe('EN/ES/FR');
    });
  });

  describe('speech synthesis unsupported', () => {
    it('should set audioError when speechSynthesis.speak throws (e.g. unavailable in this environment)', () => {
      // The component only guards with `'speechSynthesis' in window`, which is true here since
      // the getter itself is stubbed; when the returned value is unusable, the failure is caught
      // by the try/catch around window.speechSynthesis.speak() and surfaced via audioError().
      speechSynthesisSpy.and.returnValue(undefined as any);
      const fixture = TestBed.createComponent(PaBroadcastPanelComponent);
      const comp = fixture.componentInstance;
      comp.broadcast('en', scripts.en);
      expect(comp.audioError()).toContain('Text-to-speech failed');
    });
  });

  describe('langFlag', () => {
    it('should return the correct flag emoji per language', () => {
      const fixture = TestBed.createComponent(PaBroadcastPanelComponent);
      const comp = fixture.componentInstance;
      expect(comp.langFlag('en')).toBe('🇬🇧');
      expect(comp.langFlag('es')).toBe('🇪🇸');
      expect(comp.langFlag('fr')).toBe('🇫🇷');
    });
  });
});
