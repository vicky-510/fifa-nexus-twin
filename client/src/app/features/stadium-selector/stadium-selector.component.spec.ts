import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { StadiumSelectorComponent } from './stadium-selector.component';
import { StadiumStore } from '../../state/stadium.store';
import { AuthService } from '../../core/services/auth.service';
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

describe('StadiumSelectorComponent', () => {
  let storeStub: { stadiums: ReturnType<typeof signal<Stadium[]>>; loadReferenceData: jasmine.Spy };
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    storeStub = {
      stadiums: signal<Stadium[]>([]),
      loadReferenceData: jasmine.createSpy('loadReferenceData')
    };
    authServiceSpy = jasmine.createSpyObj('AuthService', ['logout']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [StadiumSelectorComponent],
      providers: [
        { provide: StadiumStore, useValue: storeStub },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();
  });

  function createComponent() {
    const fixture = TestBed.createComponent(StadiumSelectorComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('should create and load reference data on init', () => {
    const fixture = createComponent();
    expect(fixture.componentInstance).toBeTruthy();
    expect(storeStub.loadReferenceData).toHaveBeenCalled();
  });

  it('should have no hovered stadium initially', () => {
    const fixture = createComponent();
    expect(fixture.componentInstance.hoveredStadium()).toBeNull();
  });

  it('should navigate to the dashboard route when a stadium is selected', () => {
    const stadium = makeStadium({ id: 'stad-7' });
    const fixture = createComponent();
    fixture.componentInstance.selectStadium(stadium);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard', 'stad-7']);
  });

  it('should navigate to the overview route on goToOverview', () => {
    const fixture = createComponent();
    fixture.componentInstance.goToOverview();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/overview']);
  });

  it('should log out and navigate to the access-code route on onLogout', () => {
    const fixture = createComponent();
    fixture.componentInstance.onLogout();
    expect(authServiceSpy.logout).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/access-code']);
  });

  it('should render a map marker button per stadium and update hoveredStadium on hover', () => {
    const stadium = makeStadium({ id: 's1' });
    storeStub.stadiums.set([stadium]);
    const fixture = createComponent();
    fixture.detectChanges();

    const markerButton: HTMLButtonElement = fixture.nativeElement.querySelector('.relative button');
    expect(markerButton).toBeTruthy();

    markerButton.dispatchEvent(new Event('mouseenter'));
    fixture.detectChanges();
    expect(fixture.componentInstance.hoveredStadium()).toEqual(stadium);

    markerButton.dispatchEvent(new Event('mouseleave'));
    fixture.detectChanges();
    expect(fixture.componentInstance.hoveredStadium()).toBeNull();
  });

  it('should show the tooltip only when a stadium is hovered', () => {
    const stadium = makeStadium({ id: 's1', name: 'Estadio Azteca' });
    storeStub.stadiums.set([stadium]);
    const fixture = createComponent();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Estadio Azteca');

    fixture.componentInstance.hoveredStadium.set(stadium);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Estadio Azteca');
  });

  it('should invoke selectStadium when a grid list card is clicked', () => {
    const stadium = makeStadium({ id: 's1' });
    storeStub.stadiums.set([stadium]);
    const fixture = createComponent();
    fixture.detectChanges();
    spyOn(fixture.componentInstance, 'selectStadium');

    const gridButton: HTMLButtonElement = fixture.nativeElement.querySelector('.grid button');
    gridButton.click();

    expect(fixture.componentInstance.selectStadium).toHaveBeenCalledWith(stadium);
  });
});
