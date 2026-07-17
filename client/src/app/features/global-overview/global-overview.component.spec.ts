import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { GlobalOverviewComponent } from './global-overview.component';
import { StadiumStore } from '../../state/stadium.store';
import { Stadium } from '../../core/services/reference.service';

function makeStadium(overrides: Partial<Stadium>): Stadium {
  return {
    id: 's1',
    name: 'Test Stadium',
    shortName: 'TST',
    city: 'Test City',
    country: 'United States',
    countryCode: 'US',
    flag: '🇺🇸',
    capacity: 70000,
    role: 'Group Stage',
    mapType: 'oval-open-air',
    mapX: 10,
    mapY: 20,
    riskProfile: [],
    transport: [],
    uniqueRisks: '',
    gates: [],
    medicalZones: [],
    availableCrisisIds: [],
    status: 'upcoming',
    color: '#ffcc00',
    ...overrides
  };
}

describe('GlobalOverviewComponent', () => {
  let storeStub: { stadiums: ReturnType<typeof signal<Stadium[]>>; loadReferenceData: jasmine.Spy };
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    storeStub = {
      stadiums: signal<Stadium[]>([]),
      loadReferenceData: jasmine.createSpy('loadReferenceData')
    };
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [GlobalOverviewComponent],
      providers: [
        { provide: StadiumStore, useValue: storeStub },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();
  });

  function createComponent() {
    const fixture = TestBed.createComponent(GlobalOverviewComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('should create and call loadReferenceData on init', () => {
    const fixture = createComponent();
    expect(fixture.componentInstance).toBeTruthy();
    expect(storeStub.loadReferenceData).toHaveBeenCalled();
  });

  it('should group stadiums by country code', () => {
    storeStub.stadiums.set([
      makeStadium({ id: 's1', countryCode: 'US', country: 'United States', flag: '🇺🇸' }),
      makeStadium({ id: 's2', countryCode: 'US', country: 'United States', flag: '🇺🇸' }),
      makeStadium({ id: 's3', countryCode: 'MX', country: 'Mexico', flag: '🇲🇽' })
    ]);
    const fixture = createComponent();
    const component = fixture.componentInstance;

    const groups = component.countryGroups();
    expect(groups.length).toBe(2);
    const us = groups.find(g => g.code === 'US');
    const mx = groups.find(g => g.code === 'MX');
    expect(us?.stadiums.length).toBe(2);
    expect(mx?.stadiums.length).toBe(1);
  });

  it('should return an empty group list when there are no stadiums', () => {
    const fixture = createComponent();
    expect(fixture.componentInstance.countryGroups()).toEqual([]);
  });

  it('should map status to the correct badge text', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    expect(component.statusBadge('live')).toBe('🔴 LIVE');
    expect(component.statusBadge('upcoming-final')).toBe('🏆 FINAL');
    expect(component.statusBadge('upcoming')).toBe('🟡 UPCOMING');
    expect(component.statusBadge('complete')).toBe('✅ DONE');
  });

  it('should fall back to the raw status string for an unknown status', () => {
    const fixture = createComponent();
    expect(fixture.componentInstance.statusBadge('mystery')).toBe('mystery');
  });

  it('should navigate to the dashboard route for the selected stadium', () => {
    const stadium = makeStadium({ id: 'stad-42' });
    const fixture = createComponent();
    fixture.componentInstance.goToStadium(stadium);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard', 'stad-42']);
  });

  it('should navigate back to root on goBack', () => {
    const fixture = createComponent();
    fixture.componentInstance.goBack();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should render a country group card and stadium buttons in the template', () => {
    storeStub.stadiums.set([makeStadium({ id: 's1', countryCode: 'US', country: 'United States', shortName: 'TST' })]);
    const fixture = createComponent();
    fixture.detectChanges();

    const buttons: HTMLButtonElement[] = fixture.nativeElement.querySelectorAll('main button');
    expect(buttons.length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('TST');
  });

  it('should invoke goToStadium when a stadium button is clicked', () => {
    storeStub.stadiums.set([makeStadium({ id: 's1', countryCode: 'US' })]);
    const fixture = createComponent();
    fixture.detectChanges();
    spyOn(fixture.componentInstance, 'goToStadium');

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('main button');
    button.click();

    expect(fixture.componentInstance.goToStadium).toHaveBeenCalled();
  });
});
