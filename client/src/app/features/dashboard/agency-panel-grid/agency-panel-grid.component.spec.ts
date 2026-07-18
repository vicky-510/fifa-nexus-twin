import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { AgencyPanelGridComponent } from './agency-panel-grid.component';
import { SimulationStore } from '../../../state/simulation.store';

describe('AgencyPanelGridComponent', () => {
  let latestResult: ReturnType<typeof signal<any>>;
  let severity: ReturnType<typeof signal<string | null>>;
  let storeStub: Partial<SimulationStore>;

  beforeEach(async () => {
    latestResult = signal<any>(null);
    severity = signal<string | null>(null);

    storeStub = {
      latestResult,
      severity
    } as unknown as Partial<SimulationStore>;

    await TestBed.configureTestingModule({
      imports: [AgencyPanelGridComponent],
      providers: [{ provide: SimulationStore, useValue: storeStub }]
    }).compileComponents();
  });

  function create() {
    const fixture = TestBed.createComponent(AgencyPanelGridComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('should create', () => {
    const fixture = create();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should default activeLang to en and expose 3 languages', () => {
    const fixture = create();
    expect(fixture.componentInstance.activeLang()).toBe('en');
    expect(fixture.componentInstance.langs).toEqual(['en', 'es', 'fr']);
  });

  it('should render 8 agency definitions', () => {
    const fixture = create();
    expect(fixture.componentInstance.agencies.length).toBe(8);
  });

  it('should show empty-state message when there is no latest result', () => {
    const fixture = create();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('No directives compiled. Select a crisis scenario and trigger.');
  });

  it('should render agency cards and multilingual script when a latest result exists', () => {
    latestResult.set({
      navigation: 'Route crowd via Gate 3',
      medical: 'Deploy medic team to Sector A',
      security: 'Lock down perimeter',
      evacuation: 'Prepare evac route B',
      transport: 'Reroute shuttles',
      accessibility: 'Assist wheelchair users',
      sustainability: 'Reduce water usage',
      broadcast: 'Announce delay',
      multilingualScripts: { en: 'English script', es: 'Guion espanol', fr: 'Script francais' },
      operationalRecommendation: 'Escalate to level 2',
      severity: 'HIGH'
    });
    const fixture = create();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Route crowd via Gate 3');
    expect(text).toContain('English script');
    expect(text).toContain('Escalate to level 2');
    expect(text).not.toContain('No directives compiled');
  });

  it('should display severity badge only when store.severity() is set', () => {
    severity.set('CRITICAL');
    const fixture = create();
    expect((fixture.nativeElement.textContent as string)).toContain('CRITICAL');
  });

  it('should switch multilingual script when a language button is clicked', () => {
    latestResult.set({
      navigation: 'n', medical: 'm', security: 's', evacuation: 'e',
      transport: 't', accessibility: 'a', sustainability: 'su', broadcast: 'b',
      multilingualScripts: { en: 'English script', es: 'Guion espanol', fr: 'Script francais' },
      operationalRecommendation: 'rec'
    });
    const fixture = create();

    fixture.componentInstance.activeLang.set('es');
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Guion espanol');
  });
});
