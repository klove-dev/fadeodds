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

// Common nicknames, slang, and misspellings keyed by "LEAGUE:espnAbbr"
// This avoids key collisions between sports that share the same abbreviation (e.g. BOS in NBA vs NHL)
export const TEAM_ALIASES: Record<string, string[]> = {
    // ── NBA ─────────────────────────────────────────────────────────────────
    'NBA:BOS': ["c's", 'celts', 'celtics'],
    'NBA:BKN': ['nets'],
    'NBA:NYK': ['knicks', 'ny knicks'],
    'NBA:PHI': ['sixers', 'sixer', '76s', 'six', 'philly'],
    'NBA:TOR': ['raps'],
    'NBA:CHI': ['bulls'],
    'NBA:CLE': ['cavs'],
    'NBA:DET': ['pistons'],
    'NBA:IND': ['pacers'],
    'NBA:MIL': ['bucks'],
    'NBA:ATL': ['hawks'],
    'NBA:CHA': ['hornets', 'buzz'],
    'NBA:MIA': ['heat'],
    'NBA:ORL': ['magic'],
    'NBA:WAS': ['wizards', 'dc', 'wash'],
    'NBA:DEN': ['nuggets', 'nuggs'],
    'NBA:MIN': ['wolves', 'twolves', 'timberwolves'],
    'NBA:OKC': ['thunder'],
    'NBA:POR': ['blazers', 'trail blazers'],
    'NBA:UTA': ['jazz'],
    'NBA:GSW': ['warriors', 'dubs', 'golden state'],
    'NBA:LAC': ['clippers', 'clips'],
    'NBA:LAL': ['lakers'],
    'NBA:PHX': ['suns'],
    'NBA:SAC': ['kings'],
    'NBA:DAL': ['mavs', 'mavericks'],
    'NBA:HOU': ['rockets', 'htown'],
    'NBA:MEM': ['grizzlies', 'grizz'],
    'NBA:NOP': ['pelicans', 'pels', 'nola'],
    'NBA:SAS': ['spurs', 'san antonio', 'sa'],
    // ── NFL ─────────────────────────────────────────────────────────────────
    'NFL:ARI': ['cardinals', 'cards', 'az cards'],
    'NFL:ATL': ['falcons', 'dirty birds'],
    'NFL:BAL': ['ravens', 'bmore'],
    'NFL:BUF': ['bills', 'mafia'],
    'NFL:CAR': ['panthers'],
    'NFL:CHI': ['bears', 'da bears'],
    'NFL:CIN': ['bengals', 'bengles', 'bungles'],
    'NFL:CLE': ['browns', 'dawg pound'],
    'NFL:DAL': ['cowboys', 'boys', "america's team"],
    'NFL:DEN': ['broncos'],
    'NFL:DET': ['lions', 'kitties'],
    'NFL:GB':  ['packers', 'green bay', 'cheeseheads', 'pack'],
    'NFL:HOU': ['texans'],
    'NFL:IND': ['colts', 'indy'],
    'NFL:JAX': ['jaguars', 'jags'],
    'NFL:KC':  ['chiefs', 'kansas city'],
    'NFL:LV':  ['raiders', 'las vegas', 'silver and black', 'oakland'],
    'NFL:LAC': ['chargers', 'bolts'],
    'NFL:LAR': ['rams'],
    'NFL:MIA': ['dolphins', 'fins'],
    'NFL:MIN': ['vikings', 'vikes', 'skol'],
    'NFL:NE':  ['patriots', 'pats', 'new england'],
    'NFL:NO':  ['saints', 'nola', 'who dat'],
    'NFL:NYG': ['giants', 'ny giants', 'big blue'],
    'NFL:NYJ': ['jets', 'gang green'],
    'NFL:PHI': ['eagles', 'birds', 'iggles', 'eaglee', 'fly eagles fly'],
    'NFL:PIT': ['steelers', 'stillers', 'black and gold'],
    'NFL:SF':  ['49ers', 'niners'],
    'NFL:SEA': ['seahawks', '12s'],
    'NFL:TB':  ['buccaneers', 'bucs', 'tampa'],
    'NFL:TEN': ['titans'],
    'NFL:WAS': ['commanders', 'wash', 'dc'],
    // ── NHL ─────────────────────────────────────────────────────────────────
    'NHL:ANA': ['ducks', 'mighty ducks'],
    'NHL:ARI': ['coyotes', 'yotes'],
    'NHL:BOS': ['bruins', "b's"],
    'NHL:BUF': ['sabres'],
    'NHL:CGY': ['flames'],
    'NHL:CAR': ['hurricanes', 'canes'],
    'NHL:CHI': ['blackhawks', 'hawks'],
    'NHL:COL': ['avalanche', 'avs'],
    'NHL:CBJ': ['blue jackets', 'jackets'],
    'NHL:DAL': ['stars'],
    'NHL:DET': ['red wings', 'wings'],
    'NHL:EDM': ['oilers'],
    'NHL:FLA': ['florida panthers', 'cats'],
    'NHL:LAK': ['kings', 'la kings'],
    'NHL:MIN': ['wild'],
    'NHL:MTL': ['canadiens', 'habs'],
    'NHL:NSH': ['predators', 'preds'],
    'NHL:NJD': ['devils', 'nj'],
    'NHL:NYI': ['islanders', 'isles'],
    'NHL:NYR': ['rangers', 'broadway blues'],
    'NHL:OTT': ['senators', 'sens'],
    'NHL:PHI': ['flyers'],
    'NHL:PIT': ['penguins', 'pens'],
    'NHL:SEA': ['kraken'],
    'NHL:SJS': ['sharks'],
    'NHL:STL': ['blues', 'stl'],
    'NHL:TBL': ['lightning', 'bolts'],
    'NHL:TOR': ['maple leafs', 'leafs'],
    'NHL:VAN': ['canucks'],
    'NHL:VGK': ['golden knights', 'vegas', 'knights'],
    'NHL:WPG': ['jets'],
    'NHL:WSH': ['capitals', 'caps', 'dc'],
    'NHL:UTA': ['utah hockey club', 'utah hc'],
    // ── MLB ─────────────────────────────────────────────────────────────────
    'MLB:ARI': ['diamondbacks', 'd-backs', 'dbacks'],
    'MLB:ATL': ['braves', 'tomahawk'],
    'MLB:BAL': ['orioles', "o's", 'os'],
    'MLB:BOS': ['red sox', 'sox', 'redsox'],
    'MLB:CHC': ['cubs', 'cubbies', 'northsiders'],
    'MLB:CWS': ['white sox', 'wsox', 'chisox', 'southsiders'],
    'MLB:CIN': ['reds'],
    'MLB:CLE': ['guardians'],
    'MLB:COL': ['rockies'],
    'MLB:DET': ['tigers'],
    'MLB:HOU': ['astros', 'stros'],
    'MLB:KC':  ['royals'],
    'MLB:LAA': ['angels', 'halos'],
    'MLB:LAD': ['dodgers', 'bums'],
    'MLB:MIA': ['marlins'],
    'MLB:MIL': ['brewers', 'brew crew'],
    'MLB:MIN': ['twins'],
    'MLB:NYM': ['mets', "amazin'"],
    'MLB:NYY': ['yankees', 'yanks', 'bronx bombers'],
    'MLB:OAK': ['athletics', "a's", 'as'],
    'MLB:PHI': ['phillies', 'phils'],
    'MLB:PIT': ['pirates', 'bucs'],
    'MLB:SD':  ['padres', 'friars'],
    'MLB:SF':  ['giants', 'sf giants'],
    'MLB:SEA': ['mariners', "m's"],
    'MLB:STL': ['cardinals', 'cards', 'redbirds'],
    'MLB:TB':  ['rays'],
    'MLB:TEX': ['rangers', 'texas rangers'],
    'MLB:WAS': ['nationals', 'nats'],
    // ── NCAAB ────────────────────────────────────────────────────────────────
    'NCAAB:DUKE': ['blue devils', 'dookies'],
    'NCAAB:UNC':  ['tar heels', 'heels'],
    'NCAAB:KU':   ['jayhawks', 'hawks', 'kansas'],
    'NCAAB:UK':   ['wildcats', 'cats', 'kentucky'],
    'NCAAB:UL':   ['cardinals', 'cards', 'louisville'],
    'NCAAB:UCLA': ['bruins'],
    'NCAAB:USC':  ['trojans'],
    'NCAAB:OU':   ['sooners', 'oklahoma'],
    'NCAAB:GONZ': ['bulldogs', 'zags', 'gonzaga'],
    'NCAAB:VIL':  ['wildcats', 'nova', 'villanova'],
    'NCAAB:MICH': ['wolverines', 'michigan'],
    'NCAAB:MSU':  ['spartans', 'michigan state'],
    'NCAAB:UF':   ['gators', 'florida gators'],
    'NCAAB:ARK':  ['razorbacks', 'hogs'],
};

// Returns true if the team matches the search query (name, city, or alias)
export function searchTeam(team: TeamDef, query: string): boolean {
    if (!query) return true;
    const q = query.toLowerCase().trim();
    if (team.name.toLowerCase().includes(q)) return true;
    if (team.city.toLowerCase().includes(q)) return true;
    const key = `${team.league.toUpperCase()}:${team.espnAbbr.toUpperCase()}`;
    const aliases = TEAM_ALIASES[key] ?? [];
    return aliases.some((alias) => alias.includes(q) || q.includes(alias));
}