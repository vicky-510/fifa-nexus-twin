import { TestBed } from '@angular/core/testing';
import { LiveMatchTickerComponent } from './live-match-ticker.component';
import { Stadium, Match } from '../../../core/services/reference.service';

describe('LiveMatchTickerComponent', () => {
  const stadium: Stadium = {
    id: 'st1',
    name: 'MetLife Stadium',
    shortName: 'MetLife',
    city: 'New York',
    country: 'USA',
    countryCode: 'US',
    flag: '🇺🇸',
    capacity: 82500,
    role: 'Final',
    mapType: 'oval-open-air',
    mapX: 0,
    mapY: 0,
    riskProfile: [],
    transport: [],
    uniqueRisks: '',
    gates: ['Gate A (North)'],
    medicalZones: [],
    availableCrisisIds: [],
    status: 'active',
    color: '#000'
  };

  const baseMatch: Match = {
    id: 'm1',
    stage: 'Final',
    date: '2026-07-19',
    kickoff: '15:00',
    timezone: 'UTC',
    homeTeam: 'Brazil',
    homeFlagEmoji: '🇧🇷',
    awayTeam: 'France',
    awayFlagEmoji: '🇫🇷',
    homeScore: null,
    awayScore: null,
    stadiumId: 'st1',
    status: 'upcoming',
    attendance: null,
    note: ''
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LiveMatchTickerComponent],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(LiveMatchTickerComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render nothing when stadium is null', () => {
    const fixture = TestBed.createComponent(LiveMatchTickerComponent);
    fixture.componentInstance.stadium = null;
    fixture.componentInstance.match = null;
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent.trim()).toBe('');
  });

  it('should show standby message when stadium is set but match is null', () => {
    const fixture = TestBed.createComponent(LiveMatchTickerComponent);
    fixture.componentInstance.stadium = stadium;
    fixture.componentInstance.match = null;
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Standby');
    expect(fixture.nativeElement.textContent).toContain('MetLife Stadium');
  });

  it('should show live score branch when match status is live', () => {
    const fixture = TestBed.createComponent(LiveMatchTickerComponent);
    const liveMatch: Match = { ...baseMatch, status: 'live', liveScore: { home: 2, away: 1 }, currentMinute: 63 };
    fixture.componentInstance.stadium = stadium;
    fixture.componentInstance.match = liveMatch;
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('LIVE');
    expect(text).toContain('2');
    expect(text).toContain('1');
    expect(text).toContain("63'");
    expect(text).toContain('82,500');
  });

  it('should show upcoming branch with days-away countdown when match is not live', () => {
    const fixture = TestBed.createComponent(LiveMatchTickerComponent);
    fixture.componentInstance.stadium = stadium;
    fixture.componentInstance.match = { ...baseMatch, status: 'upcoming', date: '2026-07-19' };
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Final');
    expect(text).toContain('days away');
  });

  describe('liveScoreHome / liveScoreAway', () => {
    it('should prefer liveScore over homeScore/awayScore', () => {
      const fixture = TestBed.createComponent(LiveMatchTickerComponent);
      const comp = fixture.componentInstance;
      const match: Match = { ...baseMatch, homeScore: 5, awayScore: 5, liveScore: { home: 1, away: 0 } };
      expect(comp.liveScoreHome(match)).toBe(1);
      expect(comp.liveScoreAway(match)).toBe(0);
    });

    it('should fall back to homeScore/awayScore when liveScore is absent', () => {
      const fixture = TestBed.createComponent(LiveMatchTickerComponent);
      const comp = fixture.componentInstance;
      const match: Match = { ...baseMatch, homeScore: 3, awayScore: 2 };
      expect(comp.liveScoreHome(match)).toBe(3);
      expect(comp.liveScoreAway(match)).toBe(2);
    });

    it('should default to 0 when neither liveScore nor scores are set', () => {
      const fixture = TestBed.createComponent(LiveMatchTickerComponent);
      const comp = fixture.componentInstance;
      const match: Match = { ...baseMatch, homeScore: null, awayScore: null };
      expect(comp.liveScoreHome(match)).toBe(0);
      expect(comp.liveScoreAway(match)).toBe(0);
    });
  });

  describe('daysAway', () => {
    it('should compute a positive number of days for a future date', () => {
      const fixture = TestBed.createComponent(LiveMatchTickerComponent);
      const comp = fixture.componentInstance;
      // Component's "now" is hardcoded to 2026-07-15
      expect(comp.daysAway('2026-07-19')).toBe(4);
    });

    it('should clamp to 0 for a past date', () => {
      const fixture = TestBed.createComponent(LiveMatchTickerComponent);
      const comp = fixture.componentInstance;
      expect(comp.daysAway('2026-07-01')).toBe(0);
    });
  });
});
