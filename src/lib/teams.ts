import type { Sport } from '@/types';

export interface TeamDef {
    id: string;
    name: string;
    city: string;
    mascot: string;
    league: string;
    sport: Sport;
    espnAbbr: string;
}

export function teamLogoUrl(team: TeamDef): string {
    if (team.league === 'NCAAB') {
        return `https://a.espncdn.com/i/teamlogos/ncaa/500/${team.espnAbbr}.png`;
    }
    return `https://a.espncdn.com/i/teamlogos/${team.league.toLowerCase()}/500/${team.espnAbbr}.png`;
}

export function teamMatchesGame(team: TeamDef, gameTeamName: string): boolean {
    const g = gameTeamName.toLowerCase().trim();
    const name = team.name.toLowerCase();
    const city = team.city.toLowerCase();
    return g === name || g === city || g.startsWith(city + ' ') || name.startsWith(g + ' ') || g.includes(city);
}