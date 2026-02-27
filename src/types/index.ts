export interface Outcome {
    name: string;
    price: number;
    point?: number;
}

export interface Market {
    key: string;
    outcomes: Outcome[];
}

export interface Bookmaker {
    key: string;
    title: string;
    link?: string;
    markets: Market[];
}

export interface Game {
    id: string;
    sport_title: string;
    commence_time: string;
    away_team: string;
    home_team: string;
    bookmakers: Bookmaker[];
}

export interface Score {
    espnId: string;
    homeTeam: string;
    awayTeam: string;
    homeScore: string | null;
    awayScore: string | null;
    isLive: boolean;
    isFinal: boolean;
    period: number | null;
    periodLabel: string;
    displayClock: string;
    startTime: string;
}

export interface Injury {
    team: string;
    player: string;
    status: string;
    injury: string;
}

export interface AnalysisTile {
    label: string;
    val: string;
}

export interface Analysis {
    tiles: AnalysisTile[];
    expertTake: string;
    recommendation: string;
    confidence: number;
    edge: string;
}

export interface SavedBet {
    id: string;
    type: string;
    bookName: string;
    awayTeam: string;
    homeTeam: string;
    sport: string;
    commenceTime: string;
    pick: string;
    savedAt: number;
}

export type Sport =
    | 'basketball_nba'
    | 'basketball_ncaab'
    | 'americanfootball_nfl'
    | 'icehockey_nhl'
    | 'baseball_mlb';

export type Tier = 'free' | 'go' | 'plus' | 'pro';