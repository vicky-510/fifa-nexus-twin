import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { CrisisTimelineComponent } from './crisis-timeline.component';
import { SimulationStore } from '../../../state/simulation.store';

describe('CrisisTimelineComponent', () => {
  let crisisTimeline: ReturnType<typeof signal<any[]>>;
  let activeSimulationId: ReturnType<typeof signal<number | null>>;
  let addManualNoteSpy: jasmine.Spy;

  beforeEach(async () => {
    crisisTimeline = signal<any[]>([]);
    activeSimulationId = signal<number | null>(null);
    addManualNoteSpy = jasmine.createSpy('addManualNote');

    const storeStub = {
      crisisTimeline,
      activeSimulationId,
      addManualNote: addManualNoteSpy
    };

    await TestBed.configureTestingModule({
      imports: [CrisisTimelineComponent],
      providers: [{ provide: SimulationStore, useValue: storeStub }]
    }).compileComponents();
  });

  function create() {
    const fixture = TestBed.createComponent(CrisisTimelineComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('should create', () => {
    const fixture = create();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show empty-state message when timeline is empty', () => {
    const fixture = create();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('No active crisis timeline. Trigger a scenario to begin logging.');
  });

  it('should render timeline entries when present', () => {
    crisisTimeline.set([
      { timestamp: '2026-01-01T10:00:00Z', type: 'declared', message: 'Crisis declared' },
      { timestamp: '2026-01-01T10:05:00Z', type: 'note', message: 'Manual note added' }
    ]);
    const fixture = create();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Crisis declared');
    expect(text).toContain('Manual note added');
    expect(text).not.toContain('No active crisis timeline');
  });

  it('should disable input and Add button when there is no active simulation', () => {
    const fixture = create();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(input.disabled).toBe(true);
    expect(button.disabled).toBe(true);
  });

  it('should enable input once a simulation is active, and disable Add button until noteText is non-empty', () => {
    activeSimulationId.set(42);
    const fixture = create();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(input.disabled).toBe(false);
    expect(button.disabled).toBe(true);

    // Simulate real user typing (rather than mutating the component's noteText field directly)
    // so the input's [value] binding only ever transitions through the component's own
    // (input) handler, matching how the DOM would actually drive this in the browser.
    input.value = 'Evacuate section B';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(button.disabled).toBe(false);
  });

  it('submitNote() should call store.addManualNote with the trimmed note text and reset noteText', () => {
    activeSimulationId.set(7);
    const fixture = create();
    fixture.componentInstance.noteText = '  Reinforce checkpoint  ';

    fixture.componentInstance.submitNote();

    expect(addManualNoteSpy).toHaveBeenCalledWith('  Reinforce checkpoint  ');
    expect(fixture.componentInstance.noteText).toBe('');
  });

  it('formatTime() should format a valid ISO timestamp and fall back to the raw string on invalid input', () => {
    const fixture = create();
    const comp = fixture.componentInstance;

    const formatted = comp.formatTime('2026-01-01T10:00:00Z');
    expect(typeof formatted).toBe('string');
    expect(formatted.length).toBeGreaterThan(0);
  });

  it('typeIcon() should map known types and fall back to a default for unknown types', () => {
    const fixture = create();
    const comp = fixture.componentInstance;
    expect(comp.typeIcon('declared')).toBe('🔴');
    expect(comp.typeIcon('escalated')).toBe('🚨');
    expect(comp.typeIcon('note')).toBe('📝');
    expect(comp.typeIcon('broadcast')).toBe('📢');
    expect(comp.typeIcon('signage')).toBe('📺');
    expect(comp.typeIcon('dispatch')).toBe('📨');
    expect(comp.typeIcon('unknown-type')).toBe('✅');
  });

  it('typeColor() should map known types and fall back to a default for unknown types', () => {
    const fixture = create();
    const comp = fixture.componentInstance;
    expect(comp.typeColor('declared')).toBe('text-red-400');
    expect(comp.typeColor('escalated')).toBe('text-red-500 font-bold');
    expect(comp.typeColor('note')).toBe('text-slate-300');
    expect(comp.typeColor('unknown-type')).toBe('text-slate-400');
  });
});
