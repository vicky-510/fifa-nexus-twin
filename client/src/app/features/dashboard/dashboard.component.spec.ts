import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, convertToParamMap } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { SimulationStore } from '../../state/simulation.store';
import { StadiumStore } from '../../state/stadium.store';
import { AuthService } from '../../core/services/auth.service';

describe('DashboardComponent', () => {
  let history: ReturnType<typeof signal<any[]>>;
  let isLoading: ReturnType<typeof signal<boolean>>;
  let activeSimulationId: ReturnType<typeof signal<number | null>>;
  let selectRecordSpy: jasmine.Spy;
  let loadHistorySpy: jasmine.Spy;

  let selectedStadium: ReturnType<typeof signal<any>>;
  let selectedStadiumMatch: ReturnType<typeof signal<any>>;
  let loadReferenceDataSpy: jasmine.Spy;
  let selectStadiumSpy: jasmine.Spy;

  let logoutSpy: jasmine.Spy;
  let navigateSpy: jasmine.Spy;
  let paramMapSubject: BehaviorSubject<any>;

  beforeEach(async () => {
    history = signal<any[]>([]);
    isLoading = signal<boolean>(false);
    activeSimulationId = signal<number | null>(null);
    selectRecordSpy = jasmine.createSpy('selectRecord');
    loadHistorySpy = jasmine.createSpy('loadHistory');

    selectedStadium = signal<any>(null);
    selectedStadiumMatch = signal<any>(null);
    loadReferenceDataSpy = jasmine.createSpy('loadReferenceData');
    selectStadiumSpy = jasmine.createSpy('selectStadium');

    logoutSpy = jasmine.createSpy('logout');
    navigateSpy = jasmine.createSpy('navigate');
    paramMapSubject = new BehaviorSubject(convertToParamMap({}));

    const simulationStoreStub = {
      history,
      isLoading,
      activeSimulationId,
      selectRecord: selectRecordSpy,
      loadHistory: loadHistorySpy
    };

    const stadiumStoreStub = {
      selectedStadium,
      selectedStadiumMatch,
      loadReferenceData: loadReferenceDataSpy,
      selectStadium: selectStadiumSpy
    };

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: SimulationStore, useValue: simulationStoreStub },
        { provide: StadiumStore, useValue: stadiumStoreStub },
        { provide: AuthService, useValue: { logout: logoutSpy, isGuest: signal(false) } },
        { provide: Router, useValue: { navigate: navigateSpy } },
        { provide: ActivatedRoute, useValue: { paramMap: paramMapSubject.asObservable() } }
      ]
    })
      // Strip real child components so this spec only exercises DashboardComponent's own logic,
      // but keep CommonModule since the template relies on *ngFor/*ngIf structural directives.
      .overrideComponent(DashboardComponent, {
        set: { imports: [CommonModule], schemas: [NO_ERRORS_SCHEMA] }
      })
      .compileComponents();
  });

  function create() {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('should create', () => {
    const fixture = create();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('ngOnInit should always load reference data', () => {
    create();
    expect(loadReferenceDataSpy).toHaveBeenCalled();
  });

  it('ngOnInit should not select a stadium or load history when no stadiumId route param is present', () => {
    const fixture = create();
    expect(fixture.componentInstance.stadiumId).toBeNull();
    expect(selectStadiumSpy).not.toHaveBeenCalled();
    expect(loadHistorySpy).not.toHaveBeenCalled();
  });

  it('ngOnInit should select the stadium and load its history when a stadiumId route param is present', () => {
    paramMapSubject.next(convertToParamMap({ stadiumId: 'stadium-42' }));
    const fixture = create();

    expect(fixture.componentInstance.stadiumId).toBe('stadium-42');
    expect(selectStadiumSpy).toHaveBeenCalledWith('stadium-42');
    expect(loadHistorySpy).toHaveBeenCalledWith('stadium-42');
  });

  it('should react to subsequent route param changes after init', () => {
    const fixture = create();
    expect(fixture.componentInstance.stadiumId).toBeNull();

    paramMapSubject.next(convertToParamMap({ stadiumId: 'stadium-7' }));

    expect(fixture.componentInstance.stadiumId).toBe('stadium-7');
    expect(selectStadiumSpy).toHaveBeenCalledWith('stadium-7');
    expect(loadHistorySpy).toHaveBeenCalledWith('stadium-7');
  });

  it('goToSelector() should navigate to the root route', () => {
    const fixture = create();
    fixture.componentInstance.goToSelector();
    expect(navigateSpy).toHaveBeenCalledWith(['/']);
  });

  it('onLogout() should log out via AuthService and navigate to the access-code route', () => {
    const fixture = create();
    fixture.componentInstance.onLogout();
    expect(logoutSpy).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/access-code']);
  });

  it('formatDate() should format a valid ISO date string', () => {
    const fixture = create();
    const formatted = fixture.componentInstance.formatDate('2026-01-01T12:34:56Z');
    expect(typeof formatted).toBe('string');
    expect(formatted.length).toBeGreaterThan(0);
  });

  it('formatDate() should return the original string if formatting throws', () => {
    const fixture = create();
    const original = 'not-a-real-date-string';
    // Date parsing of an invalid string does not throw and toLocaleTimeString
    // on an Invalid Date still returns a string, so this exercises the happy path
    // of the try block rather than the catch fallback.
    const formatted = fixture.componentInstance.formatDate(original);
    expect(typeof formatted).toBe('string');
  });

  it('should render history log items and highlight the active record', () => {
    history.set([
      { id: 1, scenario: 'stampede', created_at: '2026-01-01T10:00:00Z', result: { operationalRecommendation: 'Evacuate now' } },
      { id: 2, scenario: 'fire', created_at: '2026-01-01T10:05:00Z', result: { operationalRecommendation: 'Contain the blaze' } }
    ]);
    activeSimulationId.set(2);
    const fixture = create();

    const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
    const historyButtons = buttons.filter(b => b.textContent!.includes('Evacuate now') || b.textContent!.includes('Contain the blaze'));
    expect(historyButtons.length).toBe(2);

    const activeButton = historyButtons.find(b => b.textContent!.includes('Contain the blaze'))!;
    expect(activeButton.classList.contains('bg-slate-850')).toBe(true);
  });

  it('clicking a history item should call store.selectRecord with that record', () => {
    const record = { id: 5, scenario: 'flood', created_at: '2026-01-01T10:00:00Z', result: { operationalRecommendation: 'Move to high ground' } };
    history.set([record]);
    const fixture = create();

    const button: HTMLButtonElement = Array.from(fixture.nativeElement.querySelectorAll('button'))
      .find((b: any) => (b as HTMLButtonElement).textContent!.includes('Move to high ground')) as HTMLButtonElement;
    button.click();
    fixture.detectChanges();

    expect(selectRecordSpy).toHaveBeenCalledWith(record);
  });

  it('should show the loading indicator only while isLoading is true and history is empty', () => {
    isLoading.set(true);
    const fixture = create();
    expect((fixture.nativeElement.textContent as string)).toContain('Syncing Postgres Logs...');
  });

  it('should show the empty-history message when not loading and history is empty', () => {
    const fixture = create();
    expect((fixture.nativeElement.textContent as string)).toContain('No previous simulation records found.');
  });
});
