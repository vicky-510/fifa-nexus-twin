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

  it('should show a live-now branch (no fabricated score/clock) when match status is live', () => {
    const fixture = TestBed.createComponent(LiveMatchTickerComponent);
    const liveMatch: Match = { ...baseMatch, status: 'live' };
    fixture.componentInstance.stadium = stadium;
    fixture.componentInstance.match = liveMatch;
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('LIVE NOW');
    expect(text).toContain('Brazil');
    expect(text).toContain('France');
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

  describe('daysAway', () => {
    it('should compute a positive number of days for a date several days in the future', () => {
      const fixture = TestBed.createComponent(LiveMatchTickerComponent);
      const comp = fixture.componentInstance;
      const future = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
      const futureStr = future.toISOString().slice(0, 10);
      const result = comp.daysAway(futureStr);
      // Allow for the same rounding slack a real day boundary can introduce.
      expect(result).toBeGreaterThanOrEqual(4);
      expect(result).toBeLessThanOrEqual(6);
    });

    it('should clamp to 0 for a past date', () => {
      const fixture = TestBed.createComponent(LiveMatchTickerComponent);
      const comp = fixture.componentInstance;
      expect(comp.daysAway('2020-01-01')).toBe(0);
    });
  });
});
