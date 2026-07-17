import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { CyberpunkTerminalComponent } from './cyberpunk-terminal.component';
import { SimulationStore } from '../../../state/simulation.store';

describe('CyberpunkTerminalComponent', () => {
  let latestResult: ReturnType<typeof signal<any>>;
  let isStreaming: ReturnType<typeof signal<boolean>>;
  let streamText: ReturnType<typeof signal<string>>;
  let isLoading: ReturnType<typeof signal<boolean>>;

  beforeEach(async () => {
    latestResult = signal<any>(null);
    isStreaming = signal<boolean>(false);
    streamText = signal<string>('');
    isLoading = signal<boolean>(false);

    const storeStub = { latestResult, isStreaming, streamText, isLoading };

    await TestBed.configureTestingModule({
      imports: [CyberpunkTerminalComponent],
      providers: [{ provide: SimulationStore, useValue: storeStub }]
    }).compileComponents();
  });

  function create() {
    const fixture = TestBed.createComponent(CyberpunkTerminalComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('should create', () => {
    const fixture = create();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should default activeTab to raw', () => {
    const fixture = create();
    expect(fixture.componentInstance.activeTab()).toBe('raw');
  });

  it('hasResult() should reflect whether the store has a latest result', () => {
    const fixture = create();
    expect(fixture.componentInstance.hasResult()).toBe(false);

    latestResult.set({ severity: 'LOW' });
    fixture.detectChanges();
    expect(fixture.componentInstance.hasResult()).toBe(true);
  });

  it('rawJsonRepresentation() should return an empty string with no result, and a JSON string once a result exists', () => {
    const fixture = create();
    expect(fixture.componentInstance.rawJsonRepresentation()).toBe('');

    const result = { severity: 'HIGH', navigation: 'go' };
    latestResult.set(result);
    fixture.detectChanges();
    expect(fixture.componentInstance.rawJsonRepresentation()).toBe(JSON.stringify(result, null, 2));
  });

  it('should show the no-directives message when idle', () => {
    const fixture = create();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain("NO SYSTEM DIRECTIVES LOADED. PRESS 'TRIGGER' TO INITIALIZE ENGINE.");
  });

  it('should show streaming raw console text while store.isStreaming() is true', () => {
    isStreaming.set(true);
    streamText.set('partial output...');
    const fixture = create();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('CONNECTED TO GEMINI SSE ENDPOINT');
    expect(text).toContain('partial output...');
  });

  it('should auto-switch from raw to en once streaming finishes and a result exists (effect)', () => {
    isStreaming.set(true);
    const fixture = create();
    expect(fixture.componentInstance.activeTab()).toBe('raw');

    latestResult.set({ multilingualScripts: { en: 'English text', es: 'Texto', fr: 'Texte' } });
    isStreaming.set(false);
    fixture.detectChanges();

    expect(fixture.componentInstance.activeTab()).toBe('en');
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('English text');
  });

  it('should reset activeTab back to raw whenever streaming starts again', () => {
    const fixture = create();
    fixture.componentInstance.activeTab.set('en');
    fixture.detectChanges();
    expect(fixture.componentInstance.activeTab()).toBe('en');

    isStreaming.set(true);
    fixture.detectChanges();

    expect(fixture.componentInstance.activeTab()).toBe('raw');
  });

  it('should disable language tab buttons while there is no result', () => {
    const fixture = create();
    const langButtons: HTMLButtonElement[] = (Array.from(
      fixture.nativeElement.querySelectorAll('button')
    ) as HTMLButtonElement[]).filter((b: HTMLButtonElement) => ['en', 'es', 'fr'].includes(b.textContent!.trim()));

    expect(langButtons.length).toBe(3);
    langButtons.forEach(btn => expect(btn.disabled).toBe(true));
  });
});
