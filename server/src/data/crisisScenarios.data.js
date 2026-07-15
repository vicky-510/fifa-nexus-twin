/**
 * FIFA World Cup 2026 — Crisis Management Framework
 * 12 real crisis scenarios across 4 domains, based on FIFA Venue Operations
 * Centre (VOC) severity classification.
 */

const SEVERITY = {
  1: { code: 'ADVISORY', label: 'Level 1 — Advisory', color: '#f59e0b', icon: '🟡', responseTime: '5-10 min' },
  2: { code: 'ELEVATED', label: 'Level 2 — Elevated', color: '#f97316', icon: '🟠', responseTime: '2-5 min' },
  3: { code: 'CRITICAL', label: 'Level 3 — Critical', color: '#ef4444', icon: '🔴', responseTime: 'Immediate' },
  4: { code: 'CATASTROPHIC', label: 'Level 4 — Catastrophic', color: '#dc2626', icon: '🚨', responseTime: 'Immediate' }
};

const CRISIS_SCENARIOS = [
  // ─── Category A — Crowd & Egress ─────────────────────────────────────────
  {
    id: 'exitSurge',
    label: 'Post-Match Exit Surge',
    category: 'Crowd & Egress',
    icon: '🏃',
    severityLevel: 3,
    escalatesTo: 'crowdCrush',
    promptFragment: 'A massive post-match exit surge is underway — all spectators are attempting to exit simultaneously, creating severe bottlenecking at primary gates.',
    agencyFocus: ['navigation', 'security', 'transport']
  },
  {
    id: 'crowdCrush',
    label: 'Crowd Crush / Barrier Failure',
    category: 'Crowd & Egress',
    icon: '🏃',
    severityLevel: 4,
    escalatesTo: null,
    promptFragment: 'A crowd crush is occurring — crush barriers have failed under pressure and fans are being compressed against fixed structures. Life-safety emergency.',
    agencyFocus: ['security', 'medical', 'evacuation']
  },
  {
    id: 'gateStorm',
    label: 'Gate Storming / Ticketless Entry',
    category: 'Crowd & Egress',
    icon: '🏃',
    severityLevel: 2,
    escalatesTo: 'pitchInvasion',
    promptFragment: 'A large group of ticketless fans is attempting to force entry through a gate, overwhelming ticket-checking staff.',
    agencyFocus: ['security', 'navigation']
  },
  {
    id: 'pitchInvasion',
    label: 'Pitch Invasion / Field Breach',
    category: 'Crowd & Egress',
    icon: '🏃',
    severityLevel: 2,
    escalatesTo: null,
    promptFragment: 'Fans have breached the perimeter and entered the field of play.',
    agencyFocus: ['security', 'evacuation']
  },

  // ─── Category B — Environmental & Weather ────────────────────────────────
  {
    id: 'stormInundation',
    label: 'Flash Storm / Flooding',
    category: 'Environmental & Weather',
    icon: '🌩️',
    severityLevel: 3,
    escalatesTo: 'powerOutage',
    promptFragment: 'A flash storm is causing rapid flooding across the main concourse level and pedestrian ramps.',
    agencyFocus: ['navigation', 'sustainability', 'transport']
  },
  {
    id: 'extremeHeat',
    label: 'Extreme Heat Emergency',
    category: 'Environmental & Weather',
    icon: '🌩️',
    severityLevel: 3,
    escalatesTo: 'massCasualty',
    promptFragment: 'Ambient and surface temperatures have reached emergency levels — fans are showing early signs of heat-related illness across multiple sectors.',
    agencyFocus: ['medical', 'accessibility', 'broadcast']
  },
  {
    id: 'tornadoWarning',
    label: 'Tornado / Severe Storm Warning',
    category: 'Environmental & Weather',
    icon: '🌩️',
    severityLevel: 4,
    escalatesTo: null,
    promptFragment: 'A tornado warning has been issued for the immediate area. Fans must be moved to designated shelter-in-place zones immediately.',
    agencyFocus: ['evacuation', 'security', 'broadcast']
  },
  {
    id: 'earthquake',
    label: 'Seismic Event',
    category: 'Environmental & Weather',
    icon: '🌩️',
    severityLevel: 4,
    escalatesTo: 'massCasualty',
    promptFragment: 'A significant seismic event has just occurred. Structural integrity checks are underway while crowds react.',
    agencyFocus: ['evacuation', 'medical', 'security']
  },

  // ─── Category C — Infrastructure & Technical ─────────────────────────────
  {
    id: 'gridlockOutage',
    label: 'Transport Gridlock + Power Failure',
    category: 'Infrastructure & Technical',
    icon: '⚡',
    severityLevel: 3,
    escalatesTo: null,
    promptFragment: 'Severe transport gridlock has combined with a power outage affecting the transit hub serving the venue.',
    agencyFocus: ['transport', 'sustainability', 'navigation']
  },
  {
    id: 'roofMalfunction',
    label: 'Retractable Roof Failure',
    category: 'Infrastructure & Technical',
    icon: '⚡',
    severityLevel: 2,
    escalatesTo: 'powerOutage',
    promptFragment: 'The retractable roof mechanism has malfunctioned mid-operation, leaving the stadium partially exposed.',
    agencyFocus: ['sustainability', 'security', 'broadcast']
  },
  {
    id: 'powerOutage',
    label: 'Total Power Outage',
    category: 'Infrastructure & Technical',
    icon: '⚡',
    severityLevel: 3,
    escalatesTo: null,
    promptFragment: 'A total power outage has struck the venue, affecting life-safety systems, lighting, and PA infrastructure.',
    agencyFocus: ['sustainability', 'security', 'medical']
  },

  // ─── Category D — Medical & Security ─────────────────────────────────────
  {
    id: 'massCasualty',
    label: 'Mass Casualty / Medical Emergency Cluster',
    category: 'Medical & Security',
    icon: '🏥',
    severityLevel: 4,
    escalatesTo: null,
    promptFragment: 'Multiple simultaneous medical emergencies have been reported across the venue, exceeding standard first-aid capacity.',
    agencyFocus: ['medical', 'evacuation', 'security']
  }
];

/**
 * Get a scenario definition by ID
 * @param {string} id
 * @returns {object|null}
 */
function getScenarioById(id) {
  return CRISIS_SCENARIOS.find(s => s.id === id) || null;
}

/**
 * Get all scenario IDs (used as the dynamic validation whitelist)
 * @returns {string[]}
 */
function getAllScenarioIds() {
  return CRISIS_SCENARIOS.map(s => s.id);
}

/**
 * Get scenarios relevant to a stadium's availableCrisisIds
 * @param {string[]} availableCrisisIds
 * @returns {Array}
 */
function getScenariosForStadium(availableCrisisIds) {
  if (!Array.isArray(availableCrisisIds)) return [];
  return CRISIS_SCENARIOS.filter(s => availableCrisisIds.includes(s.id));
}

/**
 * Get severity metadata by level (1-4)
 * @param {number} level
 */
function getSeverityInfo(level) {
  return SEVERITY[level] || SEVERITY[1];
}

module.exports = {
  CRISIS_SCENARIOS,
  SEVERITY,
  getScenarioById,
  getAllScenarioIds,
  getScenariosForStadium,
  getSeverityInfo
};
