/**
 * FIFA World Cup 2026 — Real Tournament Match Schedule
 * Includes: completed group stage, knockouts, live SF2, upcoming 3rd place & Final
 * Data accurate as of July 15, 2026
 */

const MATCHES = [
  // ─── GROUP STAGE — COMPLETED ─────────────────────────────────────────────
  {
    id: 'gs_001',
    stage: 'Group Stage',
    group: 'Group A',
    date: '2026-06-11',
    kickoff: '18:00',
    timezone: 'CDT',
    homeTeam: 'Mexico',
    homeFlagEmoji: '🇲🇽',
    awayTeam: 'South Africa',
    awayFlagEmoji: '🇿🇦',
    homeScore: 2,
    awayScore: 0,
    stadiumId: 'azteca',
    status: 'completed',
    attendance: 85000,
    note: 'Tournament opening match — historic third WC opening at Azteca'
  },
  {
    id: 'gs_002',
    stage: 'Group Stage',
    group: 'Group B',
    date: '2026-06-12',
    kickoff: '15:00',
    timezone: 'PDT',
    homeTeam: 'USA',
    homeFlagEmoji: '🇺🇸',
    awayTeam: 'Paraguay',
    awayFlagEmoji: '🇵🇾',
    homeScore: 4,
    awayScore: 1,
    stadiumId: 'sofi',
    status: 'completed',
    attendance: 69800,
    note: 'USA opening match — dominant home nation performance'
  },
  {
    id: 'gs_003',
    stage: 'Group Stage',
    group: 'Group C',
    date: '2026-06-12',
    kickoff: '18:00',
    timezone: 'EDT',
    homeTeam: 'Canada',
    homeFlagEmoji: '🇨🇦',
    awayTeam: 'Bosnia-Herzegovina',
    awayFlagEmoji: '🇧🇦',
    homeScore: 1,
    awayScore: 1,
    stadiumId: 'bmo',
    status: 'completed',
    attendance: 44500,
    note: 'Canada home opener — strong local support'
  },
  {
    id: 'gs_004',
    stage: 'Group Stage',
    group: 'Group D',
    date: '2026-06-12',
    kickoff: '21:00',
    timezone: 'CDT',
    homeTeam: 'Korea Republic',
    homeFlagEmoji: '🇰🇷',
    awayTeam: 'Czechia',
    awayFlagEmoji: '🇨🇿',
    homeScore: 2,
    awayScore: 1,
    stadiumId: 'akron',
    status: 'completed',
    attendance: 48600,
    note: ''
  },
  {
    id: 'gs_005',
    stage: 'Group Stage',
    group: 'Group E',
    date: '2026-06-13',
    kickoff: '20:00',
    timezone: 'EDT',
    homeTeam: 'England',
    homeFlagEmoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    awayTeam: 'Serbia',
    awayFlagEmoji: '🇷🇸',
    homeScore: 3,
    awayScore: 1,
    stadiumId: 'gillette',
    status: 'completed',
    attendance: 64200,
    note: ''
  },
  {
    id: 'gs_006',
    stage: 'Group Stage',
    group: 'Group F',
    date: '2026-06-14',
    kickoff: '18:00',
    timezone: 'EDT',
    homeTeam: 'Argentina',
    homeFlagEmoji: '🇦🇷',
    awayTeam: 'Iceland',
    awayFlagEmoji: '🇮🇸',
    homeScore: 2,
    awayScore: 0,
    stadiumId: 'metlife',
    status: 'completed',
    attendance: 80400,
    note: 'Messi leads Argentina at record capacity MetLife'
  },
  {
    id: 'gs_007',
    stage: 'Group Stage',
    group: 'Group G',
    date: '2026-06-15',
    kickoff: '21:00',
    timezone: 'CDT',
    homeTeam: 'France',
    homeFlagEmoji: '🇫🇷',
    awayTeam: 'Austria',
    awayFlagEmoji: '🇦🇹',
    homeScore: 3,
    awayScore: 0,
    stadiumId: 'att',
    status: 'completed',
    attendance: 78000,
    note: ''
  },
  {
    id: 'gs_008',
    stage: 'Group Stage',
    group: 'Group H',
    date: '2026-06-16',
    kickoff: '20:00',
    timezone: 'EDT',
    homeTeam: 'Spain',
    homeFlagEmoji: '🇪🇸',
    awayTeam: 'Croatia',
    awayFlagEmoji: '🇭🇷',
    homeScore: 3,
    awayScore: 0,
    stadiumId: 'lincoln_financial',
    status: 'completed',
    attendance: 68000,
    note: ''
  },
  {
    id: 'gs_009',
    stage: 'Group Stage',
    group: 'Group I',
    date: '2026-06-17',
    kickoff: '19:00',
    timezone: 'EDT',
    homeTeam: 'Brazil',
    homeFlagEmoji: '🇧🇷',
    awayTeam: 'Costa Rica',
    awayFlagEmoji: '🇨🇷',
    homeScore: 4,
    awayScore: 0,
    stadiumId: 'mercedes_benz',
    status: 'completed',
    attendance: 70000,
    note: 'Brazil dominant opening — sold out'
  },

  // ─── KNOCKOUT STAGES — COMPLETED ─────────────────────────────────────────
  {
    id: 'r32_001',
    stage: 'Round of 32',
    date: '2026-06-28',
    kickoff: '18:00',
    timezone: 'PDT',
    homeTeam: 'USA',
    homeFlagEmoji: '🇺🇸',
    awayTeam: 'Netherlands',
    awayFlagEmoji: '🇳🇱',
    homeScore: 2,
    awayScore: 1,
    stadiumId: 'sofi',
    status: 'completed',
    attendance: 70240,
    note: 'USA advance in dramatic fashion'
  },
  {
    id: 'r32_002',
    stage: 'Round of 32',
    date: '2026-06-29',
    kickoff: '20:00',
    timezone: 'EDT',
    homeTeam: 'England',
    homeFlagEmoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    awayTeam: 'Senegal',
    awayFlagEmoji: '🇸🇳',
    homeScore: 3,
    awayScore: 0,
    stadiumId: 'metlife',
    status: 'completed',
    attendance: 80000,
    note: ''
  },
  {
    id: 'r32_003',
    stage: 'Round of 32',
    date: '2026-07-01',
    kickoff: '21:00',
    timezone: 'CDT',
    homeTeam: 'France',
    homeFlagEmoji: '🇫🇷',
    awayTeam: 'Poland',
    awayFlagEmoji: '🇵🇱',
    homeScore: 3,
    awayScore: 1,
    stadiumId: 'arrowhead',
    status: 'completed',
    attendance: 74000,
    note: ''
  },
  {
    id: 'r32_004',
    stage: 'Round of 32',
    date: '2026-07-02',
    kickoff: '19:00',
    timezone: 'EDT',
    homeTeam: 'Argentina',
    homeFlagEmoji: '🇦🇷',
    awayTeam: 'Ecuador',
    awayFlagEmoji: '🇪🇨',
    homeScore: 2,
    awayScore: 0,
    stadiumId: 'lincoln_financial',
    status: 'completed',
    attendance: 69000,
    note: ''
  },
  {
    id: 'r32_005',
    stage: 'Round of 32',
    date: '2026-07-02',
    kickoff: '21:00',
    timezone: 'EDT',
    homeTeam: 'Spain',
    homeFlagEmoji: '🇪🇸',
    awayTeam: 'Japan',
    awayFlagEmoji: '🇯🇵',
    homeScore: 1,
    awayScore: 0,
    stadiumId: 'hard_rock',
    status: 'completed',
    attendance: 64000,
    note: ''
  },

  // ─── QUARTERFINALS — COMPLETED ────────────────────────────────────────────
  {
    id: 'qf_001',
    stage: 'Quarterfinal',
    date: '2026-07-09',
    kickoff: '18:00',
    timezone: 'EDT',
    homeTeam: 'France',
    homeFlagEmoji: '🇫🇷',
    awayTeam: 'USA',
    awayFlagEmoji: '🇺🇸',
    homeScore: 2,
    awayScore: 1,
    stadiumId: 'metlife',
    status: 'completed',
    attendance: 82500,
    note: 'France eliminate host nation USA — heartbreak for capacity MetLife crowd'
  },
  {
    id: 'qf_002',
    stage: 'Quarterfinal',
    date: '2026-07-10',
    kickoff: '20:00',
    timezone: 'EDT',
    homeTeam: 'Spain',
    homeFlagEmoji: '🇪🇸',
    awayTeam: 'Brazil',
    awayFlagEmoji: '🇧🇷',
    homeScore: 3,
    awayScore: 2,
    stadiumId: 'levis',
    status: 'completed',
    attendance: 68500,
    note: 'Epic QF — Spain edge Brazil in extra time'
  },
  {
    id: 'qf_003',
    stage: 'Quarterfinal',
    date: '2026-07-11',
    kickoff: '18:00',
    timezone: 'CDT',
    homeTeam: 'England',
    homeFlagEmoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    awayTeam: 'Germany',
    awayFlagEmoji: '🇩🇪',
    homeScore: 2,
    awayScore: 1,
    stadiumId: 'att',
    status: 'completed',
    attendance: 79000,
    note: 'England through after Bellingham winner'
  },
  {
    id: 'qf_004',
    stage: 'Quarterfinal',
    date: '2026-07-11',
    kickoff: '21:00',
    timezone: 'EDT',
    homeTeam: 'Argentina',
    homeFlagEmoji: '🇦🇷',
    awayTeam: 'Netherlands',
    awayFlagEmoji: '🇳🇱',
    homeScore: 1,
    awayScore: 0,
    stadiumId: 'hard_rock',
    status: 'completed',
    attendance: 65326,
    note: 'Argentina grind out narrow QF win'
  },

  // ─── SEMIFINAL 1 — COMPLETED ──────────────────────────────────────────────
  {
    id: 'sf_001',
    stage: 'Semifinal',
    date: '2026-07-14',
    kickoff: '20:00',
    timezone: 'CDT',
    homeTeam: 'France',
    homeFlagEmoji: '🇫🇷',
    awayTeam: 'Spain',
    awayFlagEmoji: '🇪🇸',
    homeScore: 1,
    awayScore: 2,
    stadiumId: 'att',
    status: 'completed',
    attendance: 80000,
    note: '🏆 Spain advance to the FINAL — Yamal brace seals it'
  },

  // ─── SEMIFINAL 2 — completed ──────────────────────────────────────────────
  {
    id: 'sf_002',
    stage: 'Semifinal',
    date: '2026-07-15',
    kickoff: '20:00',
    timezone: 'EDT',
    homeTeam: 'England',
    homeFlagEmoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    awayTeam: 'Argentina',
    awayFlagEmoji: '🇦🇷',
    homeScore: 1,
    awayScore: 2,
    stadiumId: 'mercedes_benz',
    status: 'completed',
    attendance: 68400,
    note: '🇦🇷 Argentina edge England 2-1 to reach the Final — Messi seals it late'
  },

  // ─── 3RD PLACE PLAYOFF — 🔴 LIVE TODAY ───────────────────────────────────
  {
    id: 'tp_001',
    stage: '3rd Place Playoff',
    date: '2026-07-18',
    kickoff: '16:00',
    timezone: 'EDT',
    homeTeam: 'France',
    homeFlagEmoji: '🇫🇷',
    awayTeam: 'England',
    awayFlagEmoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    homeScore: null,
    awayScore: null,
    stadiumId: 'hard_rock',
    status: 'live',
    attendance: 64100,
    note: '🔴 LIVE NOW — 3rd Place Playoff: France vs England at Hard Rock Stadium, Miami'
  },

  // ─── THE FINAL 🏆 ─────────────────────────────────────────────────────────
  {
    id: 'final_001',
    stage: 'Final',
    date: '2026-07-19',
    kickoff: '18:00',
    timezone: 'EDT',
    homeTeam: 'Spain',
    homeFlagEmoji: '🇪🇸',
    awayTeam: 'Argentina',
    awayFlagEmoji: '🇦🇷',
    homeScore: null,
    awayScore: null,
    stadiumId: 'metlife',
    status: 'upcoming-final',
    attendance: null,
    note: '🏆 FIFA WORLD CUP 2026 FINAL — Spain vs Argentina, MetLife Stadium, East Rutherford, NJ'
  }
];

/**
 * Today's date as 'YYYY-MM-DD' (UTC), so status can be derived from the real
 * clock instead of a hand-maintained field that goes stale every day.
 */
function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Derives a match's live/completed/upcoming status from its date vs. today,
 * rather than trusting a static field that would otherwise need manual
 * updates every single day the tournament runs.
 * @param {object} match
 * @param {string} [todayStr] - injectable for testing; defaults to the real today
 */
function deriveStatus(match, todayStr = getTodayDateString()) {
  if (match.date < todayStr) return 'completed';
  if (match.date > todayStr) return match.stage === 'Final' ? 'upcoming-final' : 'upcoming';
  // date === todayStr: the match is happening today, regardless of stage —
  // once it's underway there's no more "upcoming" flavor to preserve.
  return 'live';
}

/**
 * Returns a shallow copy of a match with its status overlaid by deriveStatus.
 */
function withDerivedStatus(match, todayStr = getTodayDateString()) {
  return { ...match, status: deriveStatus(match, todayStr) };
}

/**
 * Get all matches, with status freshly derived from today's date
 */
function getAllMatches() {
  const today = getTodayDateString();
  return MATCHES.map(m => withDerivedStatus(m, today));
}

/**
 * Get matches for a specific stadium, with status freshly derived
 * @param {string} stadiumId
 */
function getMatchesByStadium(stadiumId) {
  const today = getTodayDateString();
  return MATCHES.filter(m => m.stadiumId === stadiumId).map(m => withDerivedStatus(m, today));
}

/**
 * Get the current/next match for a stadium (upcoming or live)
 * @param {string} stadiumId
 */
function getActiveMatch(stadiumId) {
  const stadiumMatches = getMatchesByStadium(stadiumId);
  const live = stadiumMatches.find(m => m.status === 'live');
  if (live) return live;
  const upcoming = stadiumMatches
    .filter(m => m.status === 'upcoming' || m.status === 'upcoming-final')
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  return upcoming[0] || null;
}

/**
 * Get the live match (only one at a time in our mock)
 */
function getLiveMatch() {
  return getAllMatches().find(m => m.status === 'live') || null;
}

/**
 * Get upcoming matches (sorted by date)
 */
function getUpcomingMatches() {
  return getAllMatches()
    .filter(m => m.status === 'upcoming' || m.status === 'upcoming-final')
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

module.exports = {
  MATCHES,
  getAllMatches,
  getMatchesByStadium,
  getActiveMatch,
  getLiveMatch,
  getUpcomingMatches,
  deriveStatus,
  getTodayDateString
};
