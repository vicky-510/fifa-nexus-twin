import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { NexusCanvasMapComponent } from './nexus-canvas-map.component';
import { SimulationStore } from '../../../state/simulation.store';
import { Stadium } from '../../../core/services/reference.service';

describe('NexusCanvasMapComponent', () => {
  let storeStub: {
    activeScenario: ReturnType<typeof signal<string | null>>;
    severity: ReturnType<typeof signal<string | null>>;
    latestResult: ReturnType<typeof signal<any>>;
  };

  const stadium: Stadium = {
    id: 'st1',
    name: 'Estadio Azteca',
    shortName: 'Azteca',
    city: 'Mexico City',
    country: 'Mexico',
    countryCode: 'MX',
    flag: '🇲🇽',
    capacity: 87000,
    role: 'Opening',
    mapType: 'oval-open-air',
    mapX: 0,
    mapY: 0,
    riskProfile: [],
    transport: [],
    uniqueRisks: '',
    gates: ['Gate A (North)', 'Gate B (South)', 'Gate C (East)'],
    medicalZones: [],
    availableCrisisIds: [],
    status: 'active',
    color: '#000'
  };

  beforeEach(async () => {
    storeStub = {
      activeScenario: signal<string | null>(null),
      severity: signal<string | null>(null),
      latestResult: signal<any>(null)
    };

    await TestBed.configureTestingModule({
      imports: [NexusCanvasMapComponent],
      providers: [{ provide: SimulationStore, useValue: storeStub }]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(NexusCanvasMapComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show loading placeholder when stadium is null', () => {
    const fixture = TestBed.createComponent(NexusCanvasMapComponent);
    fixture.componentInstance.stadium = null;
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Loading stadium schematic');
  });

  it('should show SECURE badge when no active scenario', () => {
    const fixture = TestBed.createComponent(NexusCanvasMapComponent);
    fixture.componentInstance.stadium = stadium;
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('SECURE (STANDBY)');
  });

  it('should show severity badge and directives panel when a scenario is active with a result', () => {
    storeStub.activeScenario.set('stampede');
    storeStub.severity.set('CRITICAL');
    storeStub.latestResult.set({ navigation: 'Reroute crowd to Gate C', transport: 'Divert buses to Lot 4' });

    const fixture = TestBed.createComponent(NexusCanvasMapComponent);
    fixture.componentInstance.stadium = stadium;
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('CRITICAL');
    expect(text).toContain('Active AI Directives');
    expect(text).toContain('Reroute crowd to Gate C');
    expect(text).toContain('Divert buses to Lot 4');
  });

  it('should render one gate marker per stadium gate', () => {
    const fixture = TestBed.createComponent(NexusCanvasMapComponent);
    fixture.componentInstance.stadium = stadium;
    fixture.detectChanges();
    const circles = fixture.nativeElement.querySelectorAll('svg g circle');
    expect(circles.length).toBe(stadium.gates.length);
  });

  describe('mapTypeLabel', () => {
    it('should map known types to friendly labels', () => {
      const fixture = TestBed.createComponent(NexusCanvasMapComponent);
      const comp = fixture.componentInstance;
      expect(comp.mapTypeLabel('oval-open-air')).toBe('Oval Open-Air Venue');
      expect(comp.mapTypeLabel('retractable-dome')).toBe('Retractable Dome Venue');
      expect(comp.mapTypeLabel('circular-modern')).toBe('Circular Modern Venue');
      expect(comp.mapTypeLabel('compact-rectangle')).toBe('Compact Rectangle Venue');
    });

    it('should fall back to a generic label for unknown types', () => {
      const fixture = TestBed.createComponent(NexusCanvasMapComponent);
      expect(fixture.componentInstance.mapTypeLabel('unknown-type')).toBe('Venue Schematic');
    });
  });

  describe('gateShortLabel', () => {
    it('should extract the gate letter from "Gate X (...)" format', () => {
      const fixture = TestBed.createComponent(NexusCanvasMapComponent);
      const comp = fixture.componentInstance;
      expect(comp.gateShortLabel('Gate A (North)')).toBe('A');
      expect(comp.gateShortLabel('gate b (south)')).toBe('B');
    });

    it('should fall back to first 3 uppercased chars when the pattern does not match', () => {
      const fixture = TestBed.createComponent(NexusCanvasMapComponent);
      expect(fixture.componentInstance.gateShortLabel('Northwest Entrance')).toBe('NOR');
    });
  });

  describe('isCriticalGate', () => {
    it('should be false when there is no active scenario, even for index 0', () => {
      const fixture = TestBed.createComponent(NexusCanvasMapComponent);
      expect(fixture.componentInstance.isCriticalGate(0)).toBe(false);
    });

    it('should be true only for index 0 when a scenario is active', () => {
      storeStub.activeScenario.set('fire');
      const fixture = TestBed.createComponent(NexusCanvasMapComponent);
      const comp = fixture.componentInstance;
      expect(comp.isCriticalGate(0)).toBe(true);
      expect(comp.isCriticalGate(1)).toBe(false);
    });
  });

  describe('gatePosition', () => {
    it('should return a translate transform string', () => {
      const fixture = TestBed.createComponent(NexusCanvasMapComponent);
      const result = fixture.componentInstance.gatePosition(0, 4);
      expect(result).toMatch(/^translate\([-\d.]+, [-\d.]+\)$/);
    });
  });
});
