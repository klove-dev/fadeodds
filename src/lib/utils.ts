export function fmt(price: number | undefined | null): string {
    if (price === undefined || price === null) return '-';
    return price > 0 ? `+${price}` : `${price}`;
}

export function shortTeam(name: string): string {
    if (!name) return '-';
    const parts = name.trim().split(' ');
    return parts.length > 2 ? parts.slice(-1)[0] : name;
}

export function shortName(name: string): string {
    if (!name) return '';
    return name.trim().split(' ').slice(-1)[0];
}

export function formatTime(iso: string): string {
    if (!iso) return 'TBD';
    const d = new Date(iso);
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    if (diff < 0 && diff > -7200000) return 'LIVE';
    if (diff < 0) return 'Recent';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return d.toLocaleString('en-US', {
        month: 'short', day: 'numeric',
        hour: 'numeric', minute: '2-digit',
        hour12: true, timeZone: tz,
        timeZoneName: 'short'
    });
}

export function lastWord(name: string): string {
    if (!name) return '';
    return name.trim().split(' ').pop() || '';
}

export function makeScoreKey(away: string, home: string): string {
    return `${lastWord(away)}_${lastWord(home)}`.toLowerCase();
}