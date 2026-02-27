// Maps sport_title from The Odds API to a sport slug used in sportsbook URLs
export function gameSportSlug(sportTitle: string): string {
    const t = sportTitle.toLowerCase();
    if (t.includes('basketball') || t.includes('nba')) return 'basketball';
    if (t.includes('football') || t.includes('nfl')) return 'football';
    if (t.includes('hockey') || t.includes('nhl')) return 'hockey';
    if (t.includes('baseball') || t.includes('mlb')) return 'baseball';
    if (t.includes('soccer') || t.includes('mls')) return 'soccer';
    return 'sports';
}

// State abbreviations with legal online sports betting (as of 2025)
export const LEGAL_BETTING_STATES: { abbr: string; name: string }[] = [
    { abbr: 'AZ', name: 'Arizona' },
    { abbr: 'AR', name: 'Arkansas' },
    { abbr: 'CO', name: 'Colorado' },
    { abbr: 'CT', name: 'Connecticut' },
    { abbr: 'DC', name: 'Washington D.C.' },
    { abbr: 'DE', name: 'Delaware' },
    { abbr: 'IL', name: 'Illinois' },
    { abbr: 'IN', name: 'Indiana' },
    { abbr: 'IA', name: 'Iowa' },
    { abbr: 'KS', name: 'Kansas' },
    { abbr: 'KY', name: 'Kentucky' },
    { abbr: 'LA', name: 'Louisiana' },
    { abbr: 'MA', name: 'Massachusetts' },
    { abbr: 'MD', name: 'Maryland' },
    { abbr: 'MI', name: 'Michigan' },
    { abbr: 'MN', name: 'Minnesota' },
    { abbr: 'NJ', name: 'New Jersey' },
    { abbr: 'NY', name: 'New York' },
    { abbr: 'NC', name: 'North Carolina' },
    { abbr: 'OH', name: 'Ohio' },
    { abbr: 'OR', name: 'Oregon' },
    { abbr: 'PA', name: 'Pennsylvania' },
    { abbr: 'TN', name: 'Tennessee' },
    { abbr: 'VA', name: 'Virginia' },
    { abbr: 'VT', name: 'Vermont' },
    { abbr: 'WV', name: 'West Virginia' },
    { abbr: 'WY', name: 'Wyoming' },
];

// Which bookmaker keys are legal in each state
// Bookmaker keys match The Odds API's key field
export const STATE_BOOKS: Record<string, string[]> = {
    AZ: ['fanduel', 'draftkings', 'betmgm', 'caesars', 'espnbet', 'betrivers', 'pointsbet_us', 'betway', 'fliff'],
    AR: ['draftkings', 'caesars', 'betway'],
    CO: ['fanduel', 'draftkings', 'betmgm', 'caesars', 'espnbet', 'betrivers', 'pointsbet_us', 'betway'],
    CT: ['fanduel', 'draftkings', 'betmgm', 'caesars', 'betrivers'],
    DC: ['fanduel', 'draftkings', 'betmgm', 'caesars'],
    DE: ['fanduel', 'draftkings', 'betmgm'],
    IL: ['fanduel', 'draftkings', 'betmgm', 'caesars', 'espnbet', 'betrivers', 'pointsbet_us'],
    IN: ['fanduel', 'draftkings', 'betmgm', 'caesars', 'espnbet', 'betrivers', 'pointsbet_us'],
    IA: ['fanduel', 'draftkings', 'betmgm', 'caesars', 'espnbet', 'betrivers'],
    KS: ['fanduel', 'draftkings', 'betmgm', 'caesars', 'espnbet'],
    KY: ['fanduel', 'draftkings', 'betmgm', 'caesars', 'espnbet', 'betrivers'],
    LA: ['fanduel', 'draftkings', 'betmgm', 'caesars', 'espnbet'],
    MA: ['fanduel', 'draftkings', 'betmgm', 'caesars', 'espnbet', 'betrivers', 'pointsbet_us'],
    MD: ['fanduel', 'draftkings', 'betmgm', 'caesars', 'espnbet', 'betrivers'],
    MI: ['fanduel', 'draftkings', 'betmgm', 'caesars', 'espnbet', 'betrivers', 'pointsbet_us', 'betway'],
    MN: ['fanduel', 'draftkings', 'betmgm', 'caesars', 'espnbet', 'betrivers'],
    NJ: ['fanduel', 'draftkings', 'betmgm', 'caesars', 'espnbet', 'betrivers', 'pointsbet_us', 'unibet_us'],
    NY: ['fanduel', 'draftkings', 'betmgm', 'caesars', 'espnbet', 'betrivers', 'pointsbet_us', 'wynnbet'],
    NC: ['fanduel', 'draftkings', 'betmgm', 'caesars', 'espnbet', 'betrivers'],
    OH: ['fanduel', 'draftkings', 'betmgm', 'caesars', 'espnbet', 'betrivers', 'pointsbet_us', 'betway'],
    OR: ['draftkings', 'betmgm'],
    PA: ['fanduel', 'draftkings', 'betmgm', 'caesars', 'espnbet', 'betrivers', 'pointsbet_us', 'unibet_us'],
    TN: ['fanduel', 'draftkings', 'betmgm', 'caesars', 'betrivers'],
    VA: ['fanduel', 'draftkings', 'betmgm', 'caesars', 'espnbet', 'betrivers', 'pointsbet_us'],
    VT: ['fanduel', 'draftkings', 'betmgm'],
    WV: ['fanduel', 'draftkings', 'betmgm', 'caesars', 'espnbet', 'betrivers'],
    WY: ['draftkings', 'betmgm', 'caesars'],
};

// Generates a sport-section URL for each sportsbook
// state: 2-letter abbreviation (e.g. 'PA'), sportSlug: e.g. 'basketball'
type BookUrlFn = (state: string, sportSlug: string) => string;

export const BOOK_URLS: Record<string, BookUrlFn> = {
    fanduel:       (_, s) => `https://sportsbook.fanduel.com/navigation/sport/${s}`,
    draftkings:    (_, s) => `https://sportsbook.draftkings.com/leagues/${s}`,
    betmgm:        (state, s) => `https://sports.${state.toLowerCase()}.betmgm.com/en/sports/${s}`,
    caesars:       (state, s) => `https://sportsbook.caesars.com/us/${state.toLowerCase()}/sports/${s}`,
    espnbet:       (_, s) => `https://espnbet.com/sport/${s}`,
    betrivers:     (state, s) => `https://${state.toLowerCase()}.betrivers.com/sports/${s}`,
    pointsbet_us:  (_, s) => `https://pointsbet.com/sports/${s}`,
    unibet_us:     (_, s) => `https://www.unibet.com/betting/${s}`,
    wynnbet:       (_, s) => `https://www.wynnbet.com/sports/${s}`,
    betway:        (_, s) => `https://betway.com/en-us/sports/${s}`,
    fliff:         () => 'https://app.getfliff.com',
};

// Rewrites a deep link URL to target the correct state.
// Books with state subdomains (BetMGM, BetRivers, Caesars) embed the state in the URL.
// FanDuel and DraftKings use geolocation so their links need no rewriting.
export function rewriteLinkForState(url: string, state: string | null): string {
    if (!url || !state) return url;
    const s = state.toLowerCase();

    // BetMGM: sports.{state}.betmgm.com or sports.pa.betmgm.com → sports.la.betmgm.com
    const betmgm = url.replace(/sports\.(\{state\}|[a-z]{2})\.betmgm\.com/, `sports.${s}.betmgm.com`);
    if (betmgm !== url) return betmgm;

    // BetRivers: {state}.betrivers.com or pa.betrivers.com → la.betrivers.com
    const betrivers = url.replace(/(https?:\/\/)(\{state\}|[a-z]{2})(\.betrivers\.com)/, `$1${s}$3`);
    if (betrivers !== url) return betrivers;

    // Caesars: caesars.com/us/{state}/ or caesars.com/us/pa/ → caesars.com/us/la/
    const caesars = url.replace(/(caesars\.com\/us\/)(\{state\}|[a-z]{2})(\/)/, `$1${s}$3`);
    if (caesars !== url) return caesars;

    // FanDuel, DraftKings, ESPN Bet etc. use geolocation — no rewrite needed
    return url;
}

// Returns URL for a book. Falls back to '#' if not found.
export function getBetUrl(bookKey: string, state: string | null, sportTitle: string): string {
    const fn = BOOK_URLS[bookKey];
    if (!fn) return '#';
    const slug = gameSportSlug(sportTitle);
    return fn(state ?? '', slug);
}

// Returns true if the given bookmaker key is available in the given state.
// If no state is set, all books are shown.
export function isBookAvailable(bookKey: string, state: string | null): boolean {
    if (!state) return true;
    const available = STATE_BOOKS[state];
    if (!available) return true; // unknown state: show all
    return available.includes(bookKey);
}
