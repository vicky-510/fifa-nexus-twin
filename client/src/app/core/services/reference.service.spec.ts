import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ReferenceService, Stadium, Match, CrisisScenario } from './reference.service';
import { environment } from '../../../environments/environment';

describe('ReferenceService', () => {
  let service: ReferenceService;
  let httpMock: HttpTestingController;

  const dummyStadium: Stadium = {
    id: 'wembley',
    name: 'Wembley Stadium',
    shortName: 'Wembley',
    city: 'London',
    country: 'England',
    countryCode: 'GB',
    flag: '🏴',
    capacity: 90000,
    role: 'final',
    mapType: 'oval-open-air',
    mapX: 10,
    mapY: 20,
    riskProfile: ['crowd-crush'],
    transport: ['tube'],
    uniqueRisks: 'high density egress',
    gates: ['A', 'B'],
    medicalZones: ['Zone 1'],
    availableCrisisIds: ['crisis-1'],
    status: 'active',
    color: '#fff'
  };

  const dummyMatch: Match = {
    id: 'm1',
    stage: 'final',
    date: '2026-07-19',
    kickoff: '20:00',
    timezone: 'Europe/London',
    homeTeam: 'England',
    homeFlagEmoji: '🏴',
    awayTeam: 'Brazil',
    awayFlagEmoji: '🇧🇷',
    homeScore: null,
    awayScore: null,
    stadiumId: 'wembley',
    status: 'upcoming',
    attendance: null,
    note: ''
  };

  const dummyScenario: CrisisScenario = {
    id: 'crisis-1',
    label: 'Medical emergency',
    category: 'medical',
    icon: '🚑',
    severityLevel: 3,
    escalatesTo: null,
    promptFragment: 'A fan has collapsed near section 112.',
    agencyFocus: ['medical']
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ReferenceService]
    });
    service = TestBed.inject(ReferenceService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeDefined();
  });

  it('getStadiums should GET /api/stadiums and return the list', () => {
    service.getStadiums().subscribe(res => {
      expect(res).toEqual([dummyStadium]);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/stadiums`);
    expect(req.request.method).toBe('GET');
    req.flush([dummyStadium]);
  });

  it('getStadiumById should GET /api/stadiums/:id and return a single stadium', () => {
    service.getStadiumById('wembley').subscribe(res => {
      expect(res).toEqual(dummyStadium);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/stadiums/wembley`);
    expect(req.request.method).toBe('GET');
    req.flush(dummyStadium);
  });

  it('getMatches should GET /api/matches and return the list', () => {
    service.getMatches().subscribe(res => {
      expect(res).toEqual([dummyMatch]);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/matches`);
    expect(req.request.method).toBe('GET');
    req.flush([dummyMatch]);
  });

  it('getMatchesByStadium should GET /api/matches/:stadiumId and return the list', () => {
    service.getMatchesByStadium('wembley').subscribe(res => {
      expect(res).toEqual([dummyMatch]);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/matches/wembley`);
    expect(req.request.method).toBe('GET');
    req.flush([dummyMatch]);
  });

  it('getScenarios should GET /api/scenarios and return the list', () => {
    service.getScenarios().subscribe(res => {
      expect(res).toEqual([dummyScenario]);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/scenarios`);
    expect(req.request.method).toBe('GET');
    req.flush([dummyScenario]);
  });

  it('getScenariosByStadium should GET /api/scenarios/:stadiumId and return the list', () => {
    service.getScenariosByStadium('wembley').subscribe(res => {
      expect(res).toEqual([dummyScenario]);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/scenarios/wembley`);
    expect(req.request.method).toBe('GET');
    req.flush([dummyScenario]);
  });

  it('should propagate a server error from getStadiums', () => {
    service.getStadiums().subscribe({
      next: () => fail('expected an error'),
      error: (err) => expect(err.status).toBe(500)
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/stadiums`);
    req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
  });
});
