import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { StaffMobileCardComponent } from './staff-mobile-card.component';
import { StaffService, PublicSimulationRecord } from '../../core/services/staff.service';
import { SimulationResult } from '../../core/services/simulation.service';

function makeResult(overrides: Partial<SimulationResult> = {}): SimulationResult {
  return {
    navigation: 'nav',
    medical: 'medical instructions',
    security: 'security instructions',
    evacuation: 'evac',
    transport: 'transport instructions',
    accessibility: 'accessibility instructions',
    sustainability: 'sustain',
    broadcast: 'broadcast',
    severity: 'CRITICAL',
    operationalRecommendation: 'rec',
    multilingualScripts: { en: 'Please evacuate', es: 'Por favor evacue', fr: 'Veuillez évacuer' },
    ...overrides
  } as SimulationResult;
}

function makeRecord(overrides: Partial<PublicSimulationRecord> = {}): PublicSimulationRecord {
  return {
    id: 1,
    scenario: 'stampede',
    scenarioLabel: 'Crowd Stampede',
    severity: 'CRITICAL',
    stadiumName: 'MetLife Stadium',
    gate: 'Gate A',
    result: makeResult(),
    createdAt: new Date('2026-07-17T12:00:00Z').toISOString(),
    ...overrides
  };
}

describe('StaffMobileCardComponent', () => {
  let staffServiceSpy: jasmine.SpyObj<StaffService>;
  let paramMap: Map<string, string>;

  beforeEach(async () => {
    staffServiceSpy = jasmine.createSpyObj('StaffService', ['getPublicRecord']);
    paramMap = new Map([['crisisId', 'crisis-123'], ['role', 'medical']]);

    await TestBed.configureTestingModule({
      imports: [StaffMobileCardComponent],
      providers: [
        { provide: StaffService, useValue: staffServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: { get: (key: string) => paramMap.get(key) ?? null }
            }
          }
        }
      ]
    }).compileComponents();
  });

  it('should show the loading state before ngOnInit has fired', () => {
    staffServiceSpy.getPublicRecord.and.returnValue(of(makeRecord()));
    const fixture = TestBed.createComponent(StaffMobileCardComponent);
    // Before detectChanges(), ngOnInit hasn't run yet so record()/error() are both
    // still unset and the "Loading directive card..." branch is what would render.
    expect(fixture.componentInstance.record()).toBeNull();
    expect(fixture.componentInstance.error()).toBeNull();
  });

  it('should fetch the record for the route crisisId and selected role on init, then render it', () => {
    staffServiceSpy.getPublicRecord.and.returnValue(of(makeRecord()));
    const fixture = TestBed.createComponent(StaffMobileCardComponent);
    fixture.detectChanges();

    expect(staffServiceSpy.getPublicRecord).toHaveBeenCalledWith('crisis-123');
    expect(fixture.componentInstance.roleInfo.label).toBe('Emergency Medical');
    expect(fixture.componentInstance.record()).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Crowd Stampede');
    expect(fixture.nativeElement.textContent).toContain('MetLife Stadium');
    expect(fixture.nativeElement.textContent).toContain('Gate A');

    fixture.destroy();
  });

  it('should default to the security role when role param is missing or unknown', () => {
    paramMap.set('role', 'not-a-real-role');
    staffServiceSpy.getPublicRecord.and.returnValue(of(makeRecord()));
    const fixture = TestBed.createComponent(StaffMobileCardComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.roleInfo.label).toBe('Security / Police');
    fixture.destroy();
  });

  it('should set an error message when the fetch fails', () => {
    staffServiceSpy.getPublicRecord.and.returnValue(throwError(() => new Error('not found')));
    const fixture = TestBed.createComponent(StaffMobileCardComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.error()).toBe('Directive card not found or has expired.');
    expect(fixture.nativeElement.textContent).toContain('Directive card not found or has expired.');
    fixture.destroy();
  });

  it('should count down secondsToRefresh every second and reset to 60 on refetch', () => {
    jasmine.clock().install();
    try {
      staffServiceSpy.getPublicRecord.and.returnValue(of(makeRecord()));
      const fixture = TestBed.createComponent(StaffMobileCardComponent);
      fixture.detectChanges();

      expect(fixture.componentInstance.secondsToRefresh()).toBe(60);
      jasmine.clock().tick(1000);
      expect(fixture.componentInstance.secondsToRefresh()).toBe(59);

      // At the 60s mark both the refresh interval (registered first, refetches and resets the
      // counter to 60) and the countdown interval (registered second, decrements whatever the
      // counter currently is) fire in the same tick — refresh runs first, then countdown
      // decrements the freshly-reset 60 down to 59.
      jasmine.clock().tick(59000);
      expect(fixture.componentInstance.secondsToRefresh()).toBe(59);

      fixture.destroy();
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('should clear intervals on destroy', () => {
    staffServiceSpy.getPublicRecord.and.returnValue(of(makeRecord()));
    const fixture = TestBed.createComponent(StaffMobileCardComponent);
    fixture.detectChanges();

    spyOn(window, 'clearInterval').and.callThrough();
    fixture.destroy();

    expect(window.clearInterval).toHaveBeenCalledTimes(2);
  });

  it('should map severities to the correct icon, border and background classes', () => {
    const fixture = TestBed.createComponent(StaffMobileCardComponent);
    const component = fixture.componentInstance;

    expect(component.severityIcon('CATASTROPHIC')).toBe('🚨');
    expect(component.severityBorder('CRITICAL')).toBe('border-red-500');
    expect(component.severityBg('ADVISORY')).toBe('bg-amber-600');

    // Unknown severity falls back to the CRITICAL-ish default.
    expect(component.severityIcon('UNKNOWN')).toBe('🔴');
    expect(component.severityBorder('UNKNOWN')).toBe('border-red-500');
    expect(component.severityBg('UNKNOWN')).toBe('bg-red-600');
  });

  it('should format a valid timestamp, and return "Invalid Date" (not throw) on invalid input', () => {
    const fixture = TestBed.createComponent(StaffMobileCardComponent);
    const component = fixture.componentInstance;

    const formatted = component.formatTime('2026-07-17T12:00:00Z');
    expect(formatted).toMatch(/\d{1,2}:\d{2}:\d{2}/);

    // `new Date('not-a-date')` never throws, and Invalid Date#toLocaleTimeString()
    // just returns the string 'Invalid Date' rather than throwing, so the try/catch's
    // fallback branch is effectively unreachable in practice.
    expect(component.formatTime('not-a-date')).toBe('Invalid Date');
  });
});
