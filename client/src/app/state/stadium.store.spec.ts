import { TestBed } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';
import { StadiumStore } from './stadium.store';
import { ReferenceService, Stadium, Match, CrisisScenario } from '../core/services/reference.service';

describe('StadiumStore', () => {
  let store: StadiumStore;
  let refServiceSpy: jasmine.SpyObj<ReferenceService>;

  function makeStadium(overrides: Partial<Stadium> = {}): Stadium {
    return {
      id: 'stad-1',
      name: 'MetLife Stadium',
      shortName: 'MetLife',
      city: 'East Rutherford',
      country: 'USA',
      countryCode: 'US',
      flag: '🇺🇸',
      capacity: 82500,
      role: 'Final',
      mapType: 'oval-open-air',
      mapX: 10,
      mapY: 20,
      riskProfile: [],
      transport: [],
      uniqueRisks: '',
      gates: [],
      medicalZones: [],
      availableCrisisIds: [],
      status: 'active',
      color: '#fff',
      ...overrides
    };
  }

  function makeMatch(overrides: Partial<Match> = {}): Match {
    return {
      id: 'match-1',
      stage: 'Group',
      date: '2026-06-15',
      kickoff: '18:00',
      timezone: 'EST',
      homeTeam: 'USA',
      homeFlagEmoji: '🇺🇸',
      awayTeam: 'MEX',
      awayFlagEmoji: '🇲🇽',
      homeScore: null,
      awayScore: null,
      stadiumId: 'stad-1',
      status: 'upcoming',
      attendance: null,
      note: '',
      ...overrides
    };
  }

  beforeEach(() => {
    refServiceSpy = jasmine.createSpyObj('ReferenceService', [
      'getStadiums',
      'getStadiumById',
      'getMatches',
      'getMatchesByStadium',
      'getScenarios',
      'getScenariosByStadium'
    ]);

    TestBed.configureTestingModule({
      providers: [StadiumStore, { provide: ReferenceService, useValue: refServiceSpy }]
    });

    store = TestBed.inject(StadiumStore);
  });

  it('should initialize with empty/default state', () => {
    expect(store.stadiums()).toEqual([]);
    expect(store.matches()).toEqual([]);
    expect(store.selectedStadiumId()).toBeNull();
    expect(store.availableScenarios()).toEqual([]);
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.selectedStadium()).toBeNull();
    expect(store.liveMatch()).toBeNull();
    expect(store.selectedStadiumMatch()).toBeNull();
  });

  describe('loadReferenceData', () => {
    it('should load stadiums and matches and clear isLoading on stadium success', () => {
      const stadiums = [makeStadium()];
      const matches = [makeMatch()];
      refServiceSpy.getStadiums.and.returnValue(of(stadiums));
      refServiceSpy.getMatches.and.returnValue(of(matches));

      store.loadReferenceData();

      expect(refServiceSpy.getStadiums).toHaveBeenCalled();
      expect(refServiceSpy.getMatches).toHaveBeenCalled();
      expect(store.stadiums()).toEqual(stadiums);
      expect(store.matches()).toEqual(matches);
      expect(store.isLoading()).toBe(false);
    });

    it('should not reload when stadiums are already populated', () => {
      const stadiums = [makeStadium()];
      refServiceSpy.getStadiums.and.returnValue(of(stadiums));
      refServiceSpy.getMatches.and.returnValue(of([]));

      store.loadReferenceData();
      expect(refServiceSpy.getStadiums).toHaveBeenCalledTimes(1);

      store.loadReferenceData();
      expect(refServiceSpy.getStadiums).toHaveBeenCalledTimes(1);
      expect(refServiceSpy.getMatches).toHaveBeenCalledTimes(1);
    });

    it('should set isLoading true synchronously while the stadiums request is in flight', () => {
      const subject = new Subject<Stadium[]>();
      refServiceSpy.getStadiums.and.returnValue(subject.asObservable());
      refServiceSpy.getMatches.and.returnValue(of([]));

      store.loadReferenceData();
      expect(store.isLoading()).toBe(true);

      subject.next([]);
      subject.complete();
      expect(store.isLoading()).toBe(false);
    });

    it('should set an error and clear isLoading when stadiums request fails', () => {
      refServiceSpy.getStadiums.and.returnValue(throwError(() => new Error('boom')));
      refServiceSpy.getMatches.and.returnValue(of([]));

      store.loadReferenceData();

      expect(store.error()).toBe('Failed to load stadium data.');
      expect(store.isLoading()).toBe(false);
    });

    it('should set an error when the matches request fails, independent of stadiums', () => {
      refServiceSpy.getStadiums.and.returnValue(of([makeStadium()]));
      refServiceSpy.getMatches.and.returnValue(throwError(() => new Error('boom')));

      store.loadReferenceData();

      expect(store.error()).toBe('Failed to load match data.');
      expect(store.stadiums().length).toBe(1);
    });
  });

  describe('selectStadium', () => {
    it('should set selectedStadiumId and load scenarios for that stadium', () => {
      const scenarios: CrisisScenario[] = [
        {
          id: 'medical-emergency',
          label: 'Medical Emergency',
          category: 'medical',
          icon: 'medical',
          severityLevel: 2,
          escalatesTo: null,
          promptFragment: '',
          agencyFocus: []
        }
      ];
      refServiceSpy.getScenariosByStadium.and.returnValue(of(scenarios));

      store.selectStadium('stad-1');

      expect(store.selectedStadiumId()).toBe('stad-1');
      expect(refServiceSpy.getScenariosByStadium).toHaveBeenCalledWith('stad-1');
      expect(store.availableScenarios()).toEqual(scenarios);
    });

    it('should set an error message when scenario loading fails', () => {
      refServiceSpy.getScenariosByStadium.and.returnValue(throwError(() => new Error('boom')));

      store.selectStadium('stad-1');

      expect(store.error()).toBe('Failed to load crisis scenarios for stadium.');
    });
  });

  describe('selectedStadium computed', () => {
    it('should return null when nothing is selected', () => {
      expect(store.selectedStadium()).toBeNull();
    });

    it('should return the matching stadium once loaded and selected', () => {
      const stadium = makeStadium({ id: 'stad-2', name: 'Другой' });
      refServiceSpy.getStadiums.and.returnValue(of([stadium]));
      refServiceSpy.getMatches.and.returnValue(of([]));
      refServiceSpy.getScenariosByStadium.and.returnValue(of([]));

      store.loadReferenceData();
      store.selectStadium('stad-2');

      expect(store.selectedStadium()).toEqual(stadium);
    });

    it('should return null when selectedStadiumId does not match any loaded stadium', () => {
      refServiceSpy.getStadiums.and.returnValue(of([makeStadium({ id: 'stad-1' })]));
      refServiceSpy.getMatches.and.returnValue(of([]));
      refServiceSpy.getScenariosByStadium.and.returnValue(of([]));

      store.loadReferenceData();
      store.selectStadium('does-not-exist');

      expect(store.selectedStadium()).toBeNull();
    });
  });

  describe('liveMatch computed', () => {
    it('should return null when there is no live match', () => {
      store.matches.set([makeMatch({ status: 'upcoming' })]);
      expect(store.liveMatch()).toBeNull();
    });

    it('should return the first match with status "live"', () => {
      const live = makeMatch({ id: 'match-live', status: 'live' });
      store.matches.set([makeMatch({ id: 'match-1', status: 'upcoming' }), live]);
      expect(store.liveMatch()).toEqual(live);
    });
  });

  describe('selectedStadiumMatch computed', () => {
    it('should return null when no stadium is selected', () => {
      store.matches.set([makeMatch()]);
      expect(store.selectedStadiumMatch()).toBeNull();
    });

    it('should return null when the selected stadium has no matches', () => {
      store.selectedStadiumId.set('stad-1');
      store.matches.set([makeMatch({ stadiumId: 'stad-2' })]);
      expect(store.selectedStadiumMatch()).toBeNull();
    });

    it('should prefer a live match over upcoming matches for the selected stadium', () => {
      store.selectedStadiumId.set('stad-1');
      const live = makeMatch({ id: 'live-match', stadiumId: 'stad-1', status: 'live' });
      const upcoming = makeMatch({
        id: 'upcoming-match',
        stadiumId: 'stad-1',
        status: 'upcoming',
        date: '2026-06-20'
      });
      store.matches.set([upcoming, live]);

      expect(store.selectedStadiumMatch()).toEqual(live);
    });

    it('should return the earliest upcoming match when there is no live match', () => {
      store.selectedStadiumId.set('stad-1');
      const later = makeMatch({ id: 'later', stadiumId: 'stad-1', status: 'upcoming', date: '2026-07-01' });
      const sooner = makeMatch({ id: 'sooner', stadiumId: 'stad-1', status: 'upcoming-final', date: '2026-06-10' });
      store.matches.set([later, sooner]);

      expect(store.selectedStadiumMatch()).toEqual(sooner);
    });

    it('should ignore completed matches for the selected stadium', () => {
      store.selectedStadiumId.set('stad-1');
      store.matches.set([makeMatch({ stadiumId: 'stad-1', status: 'completed' })]);

      expect(store.selectedStadiumMatch()).toBeNull();
    });
  });
});
