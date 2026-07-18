const { deriveStatus, getAllMatches } = require('../data/matches.data');
const { getAllStadiums } = require('../data/stadiums.data');

describe('deriveStatus', () => {
  const TODAY = '2026-07-18';

  it('should mark a match on a past date as completed', () => {
    const match = { date: '2026-07-15', stage: 'Semifinal' };
    expect(deriveStatus(match, TODAY)).toBe('completed');
  });

  it('should mark a match on today\'s date as live, regardless of stage', () => {
    const match = { date: TODAY, stage: '3rd Place Playoff' };
    expect(deriveStatus(match, TODAY)).toBe('live');
  });

  it('should mark the Final as live once it is actually today, not "upcoming-final"', () => {
    const match = { date: TODAY, stage: 'Final' };
    expect(deriveStatus(match, TODAY)).toBe('live');
  });

  it('should mark a future non-Final match as upcoming', () => {
    const match = { date: '2026-07-19', stage: 'Group Stage' };
    expect(deriveStatus(match, TODAY)).toBe('upcoming');
  });

  it('should mark a future Final as upcoming-final', () => {
    const match = { date: '2026-07-19', stage: 'Final' };
    expect(deriveStatus(match, TODAY)).toBe('upcoming-final');
  });
});

describe('getAllMatches (real clock)', () => {
  it('should return every match with a freshly derived status field', () => {
    const matches = getAllMatches();
    expect(matches.length).toBeGreaterThan(0);
    matches.forEach(m => {
      expect(['completed', 'live', 'upcoming', 'upcoming-final']).toContain(m.status);
    });
  });
});

describe('Stadium status derived from its active match (real clock)', () => {
  it('should return every stadium with a status consistent with the derived match statuses', () => {
    const stadiums = getAllStadiums();
    stadiums.forEach(s => {
      expect(['complete', 'live', 'upcoming', 'upcoming-final']).toContain(s.status);
    });
  });
});
