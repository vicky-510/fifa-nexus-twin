import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { PredictiveRiskPanelComponent } from './predictive-risk-panel.component';
import { SimulationStore } from '../../../state/simulation.store';

describe('PredictiveRiskPanelComponent', () => {
  let storeStub: {
    isPredicting: ReturnType<typeof signal<boolean>>;
    predictiveForecast: ReturnType<typeof signal<any>>;
  };

  beforeEach(async () => {
    storeStub = {
      isPredicting: signal(false),
      predictiveForecast: signal<any>(null)
    };

    await TestBed.configureTestingModule({
      imports: [PredictiveRiskPanelComponent],
      providers: [{ provide: SimulationStore, useValue: storeStub }]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(PredictiveRiskPanelComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show the loading state while isPredicting is true', () => {
    storeStub.isPredicting.set(true);
    const fixture = TestBed.createComponent(PredictiveRiskPanelComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Forecasting operational risk');
  });

  it('should show the empty state when not predicting and no forecast exists', () => {
    const fixture = TestBed.createComponent(PredictiveRiskPanelComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Press "Predict Risk"');
  });

  it('should render forecast risks and reasoning when a forecast is available', () => {
    storeStub.predictiveForecast.set({
      risks: [
        { label: 'Crowd Crush', probability: 72, level: 'HIGH', windowMinutes: 20 },
        { label: 'Medical Surge', probability: 30, level: 'MEDIUM', windowMinutes: 45 }
      ],
      reasoning: 'Density trending upward near Gate B.'
    });
    const fixture = TestBed.createComponent(PredictiveRiskPanelComponent);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Crowd Crush');
    expect(text).toContain('72%');
    expect(text).toContain('Medical Surge');
    expect(text).toContain('Density trending upward near Gate B.');
  });

  it('should not render the loading spinner once a forecast replaces it', () => {
    storeStub.isPredicting.set(false);
    storeStub.predictiveForecast.set({ risks: [], reasoning: 'All clear.' });
    const fixture = TestBed.createComponent(PredictiveRiskPanelComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Forecasting operational risk');
  });

  describe('levelIcon', () => {
    it('should map risk levels to icons', () => {
      const fixture = TestBed.createComponent(PredictiveRiskPanelComponent);
      const comp = fixture.componentInstance;
      expect(comp.levelIcon('HIGH')).toBe('⚠️');
      expect(comp.levelIcon('MEDIUM')).toBe('🟡');
      expect(comp.levelIcon('LOW')).toBe('🟢');
      expect(comp.levelIcon('UNKNOWN')).toBe('🟢');
    });
  });

  describe('barColor', () => {
    it('should map risk levels to bar color classes', () => {
      const fixture = TestBed.createComponent(PredictiveRiskPanelComponent);
      const comp = fixture.componentInstance;
      expect(comp.barColor('HIGH')).toBe('bg-red-500');
      expect(comp.barColor('MEDIUM')).toBe('bg-amber-500');
      expect(comp.barColor('LOW')).toBe('bg-emerald-500');
      expect(comp.barColor('UNKNOWN')).toBe('bg-emerald-500');
    });
  });
});
