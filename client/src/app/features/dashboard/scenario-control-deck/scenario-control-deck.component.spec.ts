import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ScenarioControlDeckComponent } from './scenario-control-deck.component';
import { SimulationStore } from '../../../state/simulation.store';
import { StadiumStore } from '../../../state/stadium.store';
import { CrisisScenario } from '../../../core/services/reference.service';

describe('ScenarioControlDeckComponent', () => {
  let simStoreStub: {
    isLoading: ReturnType<typeof signal<boolean>>;
    isPredicting: ReturnType<typeof signal<boolean>>;
    activeSimulationId: ReturnType<typeof signal<number | null>>;
    triggerStream: jasmine.Spy;
    triggerSync: jasmine.Spy;
    escalate: jasmine.Spy;
    predictRisk: jasmine.Spy;
  };
  let stadiumStoreStub: { availableScenarios: ReturnType<typeof signal<CrisisScenario[]>> };

  const scenarios: CrisisScenario[] = [
    { id: 'stampede', label: 'Stampede', category: 'Crowd', icon: '🏃', severityLevel: 3, escalatesTo: null, promptFragment: '', agencyFocus: [] },
    { id: 'fire', label: 'Fire', category: 'Safety', icon: '🔥', severityLevel: 4, escalatesTo: null, promptFragment: '', agencyFocus: [] }
  ];

  beforeEach(async () => {
    simStoreStub = {
      isLoading: signal(false),
      isPredicting: signal(false),
      activeSimulationId: signal<number | null>(null),
      triggerStream: jasmine.createSpy('triggerStream'),
      triggerSync: jasmine.createSpy('triggerSync'),
      escalate: jasmine.createSpy('escalate'),
      predictRisk: jasmine.createSpy('predictRisk')
    };
    stadiumStoreStub = { availableScenarios: signal<CrisisScenario[]>([]) };

    await TestBed.configureTestingModule({
      imports: [ScenarioControlDeckComponent],
      providers: [
        { provide: SimulationStore, useValue: simStoreStub },
        { provide: StadiumStore, useValue: stadiumStoreStub }
      ]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(ScenarioControlDeckComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show the "loading scenarios" placeholder when there are none yet', () => {
    const fixture = TestBed.createComponent(ScenarioControlDeckComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Loading crisis scenarios');
  });

  it('should auto-select the first available scenario once scenarios load', () => {
    stadiumStoreStub.availableScenarios.set(scenarios);
    const fixture = TestBed.createComponent(ScenarioControlDeckComponent);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(fixture.componentInstance.selectedScenario()).toBe('stampede');
  });

  it('should keep the current selection if it is still present in the updated scenario list', () => {
    stadiumStoreStub.availableScenarios.set(scenarios);
    const fixture = TestBed.createComponent(ScenarioControlDeckComponent);
    fixture.detectChanges();
    TestBed.flushEffects();

    fixture.componentInstance.selectedScenario.set('fire');
    stadiumStoreStub.availableScenarios.set([...scenarios]);
    fixture.detectChanges();
    TestBed.flushEffects();

    expect(fixture.componentInstance.selectedScenario()).toBe('fire');
  });

  describe('onTrigger', () => {
    it('should do nothing if no scenario or stadiumId is set', () => {
      const fixture = TestBed.createComponent(ScenarioControlDeckComponent);
      fixture.componentInstance.stadiumId = null;
      fixture.componentInstance.onTrigger();
      expect(simStoreStub.triggerStream).not.toHaveBeenCalled();
      expect(simStoreStub.triggerSync).not.toHaveBeenCalled();
    });

    it('should call triggerStream when in stream mode', () => {
      const fixture = TestBed.createComponent(ScenarioControlDeckComponent);
      const comp = fixture.componentInstance;
      comp.stadiumId = 'st1';
      comp.selectedScenario.set('fire');
      comp.streamMode.set(true);
      comp.onTrigger();
      expect(simStoreStub.triggerStream).toHaveBeenCalledWith('st1', 'fire');
      expect(simStoreStub.triggerSync).not.toHaveBeenCalled();
    });

    it('should call triggerSync when not in stream mode', () => {
      const fixture = TestBed.createComponent(ScenarioControlDeckComponent);
      const comp = fixture.componentInstance;
      comp.stadiumId = 'st1';
      comp.selectedScenario.set('fire');
      comp.streamMode.set(false);
      comp.onTrigger();
      expect(simStoreStub.triggerSync).toHaveBeenCalledWith('st1', 'fire');
      expect(simStoreStub.triggerStream).not.toHaveBeenCalled();
    });

    it('should be wired to the trigger button click and disabled while loading', () => {
      stadiumStoreStub.availableScenarios.set(scenarios);
      const fixture = TestBed.createComponent(ScenarioControlDeckComponent);
      fixture.componentInstance.stadiumId = 'st1';
      simStoreStub.isLoading.set(true);
      fixture.detectChanges();
      TestBed.flushEffects();
      fixture.detectChanges();

      const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
      const triggerButton = buttons.find(
        b => b.textContent?.includes('Running Engine') || b.textContent?.includes('Trigger Ops Directive')
      )!;
      expect(triggerButton.disabled).toBe(true);
    });
  });

  describe('onPredict', () => {
    it('should call predictRisk with the stadiumId when set', () => {
      const fixture = TestBed.createComponent(ScenarioControlDeckComponent);
      fixture.componentInstance.stadiumId = 'st1';
      fixture.componentInstance.onPredict();
      expect(simStoreStub.predictRisk).toHaveBeenCalledWith('st1');
    });

    it('should do nothing when stadiumId is null', () => {
      const fixture = TestBed.createComponent(ScenarioControlDeckComponent);
      fixture.componentInstance.stadiumId = null;
      fixture.componentInstance.onPredict();
      expect(simStoreStub.predictRisk).not.toHaveBeenCalled();
    });
  });

  it('should call store.escalate() when the Escalate button is clicked', () => {
    simStoreStub.activeSimulationId.set(5);
    const fixture = TestBed.createComponent(ScenarioControlDeckComponent);
    fixture.detectChanges();

    const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
    const escalateBtn = buttons.find(b => b.textContent?.includes('Escalate'))!;
    escalateBtn.click();

    expect(simStoreStub.escalate).toHaveBeenCalled();
  });
});
