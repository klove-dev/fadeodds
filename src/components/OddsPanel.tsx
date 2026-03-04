'use client';

import { Game, type Sport } from '@/types';
import { fmt, shortTeam, formatOddsTimestamp } from '@/lib/utils';
import { getBetUrl, isBookAvailable, rewriteLinkForState, getBookLogoUrl } from '@/lib/sportsbooks';
import { type TeamDef, teamLogoUrl, teamMatchesGame } from '@/lib/teams';

interface OddsPanelProps {
    game: Game;
    savedBetIds: string[];
    bettingState: string | null;
    oddsTimestamp: string | null;
    showOddsTimestamp: boolean;
    allTeams: TeamDef[];
    onSaveBet: (bookKey: string, bookTitle: string) => void;
}

function sportFromTitle(sportTitle: string): Sport | null {
    const t = sportTitle.toLowerCase();
    if (t.includes('ncaab') || t.includes('college basketball')) return 'basketball_ncaab';
    if (t.includes('nba') || t.includes('basketball')) return 'basketball_nba';
    if (t.includes('nfl') || t.includes('football')) return 'americanfootball_nfl';
    if (t.includes('nhl') || t.includes('hockey')) return 'icehockey_nhl';
    if (t.includes('mlb') || t.includes('baseball')) return 'baseball_mlb';
    return null;
}

function TeamLogoCell({ teamName, allTeams }: { teamName: string; allTeams: TeamDef[] }) {
    const team = allTeams.find((t) => teamMatchesGame(t, teamName));
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {team ? (
                <img
                    src={teamLogoUrl(team)}
                    alt={teamName}
                    width={20}
                    height={20}
                    style={{ objectFit: 'contain', flexShrink: 0 }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
            ) : null}
            <span>{shortTeam(teamName)}</span>
        </div>
    );
}

export default function OddsPanel({ game, savedBetIds, bettingState, oddsTimestamp, showOddsTimestamp, allTeams, onSaveBet }: OddsPanelProps) {
    const gameSport = sportFromTitle(game.sport_title);
    const sportTeams = gameSport ? allTeams.filter((t) => t.sport === gameSport) : allTeams;

    const allBooks = (game.bookmakers || []).filter((b) => isBookAvailable(b.key, bettingState));

    if (!allBooks.length) {
        return (
            <div style={{ color: 'var(--dim)', textAlign: 'center', padding: '30px', fontSize: '0.8rem' }}>
                No odds data available
            </div>
        );
    }

    // Extract per-book data
    const bookData = allBooks.map((book) => {
        const h2h     = book.markets?.find((m) => m.key === 'h2h');
        const spreads = book.markets?.find((m) => m.key === 'spreads');
        const totals  = book.markets?.find((m) => m.key === 'totals');

        const awayML    = h2h?.outcomes.find((o) => o.name === game.away_team)?.price;
        const homeML    = h2h?.outcomes.find((o) => o.name === game.home_team)?.price;
        const awaySpread = spreads?.outcomes.find((o) => o.name === game.away_team);
        const overLine  = totals?.outcomes.find((o) => o.name === 'Over');

        return { book, awayML, homeML, awaySpread, overLine };
    });

    // Sort columns: best away ML first (highest = most favorable for away bettors)
    bookData.sort((a, b) => (b.awayML ?? -Infinity) - (a.awayML ?? -Infinity));

    // Best values per row for highlighting
    const awayMLs  = bookData.map((d) => d.awayML).filter((v): v is number => v != null);
    const homeMLs  = bookData.map((d) => d.homeML).filter((v): v is number => v != null);
    const spreadPts = bookData.map((d) => d.awaySpread?.point).filter((v): v is number => v != null);

    const bestAwayML  = awayMLs.length  ? Math.max(...awayMLs)  : null;
    const bestHomeML  = homeMLs.length  ? Math.max(...homeMLs)  : null;
    // Best spread for away team = highest (least negative / most positive)
    const bestSpread  = spreadPts.length ? Math.max(...spreadPts) : null;

    const openLink = (url: string) => window.open(url, '_blank', 'noreferrer noopener');

    const getLink = (book: (typeof bookData)[0]['book']) =>
        book.link
            ? rewriteLinkForState(book.link, bettingState)
            : getBetUrl(book.key, bettingState, game.sport_title);

    return (
        <div className="odds-table-wrap">
            {showOddsTimestamp && oddsTimestamp && (
                <div className="odds-timestamp" style={{ padding: '10px 16px 0' }}>
                    odds as of {formatOddsTimestamp(oddsTimestamp)}
                </div>
            )}
            <div className="odds-table-scroll">
                <table className="odds-matrix">
                    <thead>
                        <tr>
                            <th className="odds-matrix-corner"></th>
                            {bookData.map(({ book }, i) => {
                                const link    = getLink(book);
                                const favId   = `${game.id}-${book.key}`;
                                const starred = savedBetIds.includes(favId);
                                const logoUrl = getBookLogoUrl(book.key);
                                return (
                                    <th key={book.key} className={`odds-matrix-book-th${i === 0 ? ' best-book-col' : ''}`}>
                                        <div className="odds-matrix-book-name" onClick={() => openLink(link)}>
                                            {logoUrl ? (
                                                <img
                                                    src={logoUrl}
                                                    alt={book.title}
                                                    title={book.title}
                                                    width={24}
                                                    height={24}
                                                    style={{ objectFit: 'contain' }}
                                                    onError={(e) => {
                                                        const img = e.target as HTMLImageElement;
                                                        img.style.display = 'none';
                                                        const next = img.nextElementSibling as HTMLElement | null;
                                                        if (next) next.style.display = 'block';
                                                    }}
                                                />
                                            ) : null}
                                            <span style={{ display: logoUrl ? 'none' : 'block' }}>{book.title}</span>
                                            {i === 0 && <span className="matrix-best-badge">Best</span>}
                                        </div>
                                        <button
                                            className={`matrix-star${starred ? ' starred' : ''}`}
                                            onClick={(e) => { e.stopPropagation(); onSaveBet(favId, book.title); }}
                                        >
                                            {starred ? '★' : '☆'}
                                        </button>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {/* Row 1 — Spread */}
                        <tr>
                            <td className="odds-matrix-row-label">Spread</td>
                            {bookData.map(({ book, awaySpread }) => {
                                const pt   = awaySpread?.point;
                                const best = pt != null && pt === bestSpread;
                                return (
                                    <td key={book.key} className={`odds-matrix-cell${best ? ' best-cell' : ''}`} onClick={() => openLink(getLink(book))}>
                                        {pt != null ? (
                                            <>
                                                <div className="omc-main">{pt > 0 ? `+${pt}` : pt}</div>
                                                <div className="omc-juice">{fmt(awaySpread?.price)}</div>
                                            </>
                                        ) : <span className="omc-na">—</span>}
                                    </td>
                                );
                            })}
                        </tr>

                        {/* Row 2 — Home ML */}
                        <tr>
                            <td className="odds-matrix-row-label">
                                <TeamLogoCell teamName={game.home_team} allTeams={sportTeams} />
                            </td>
                            {bookData.map(({ book, homeML }) => {
                                const best = homeML != null && homeML === bestHomeML;
                                return (
                                    <td key={book.key} className={`odds-matrix-cell${best ? ' best-cell' : ''}`} onClick={() => openLink(getLink(book))}>
                                        <div className="omc-main">{fmt(homeML)}</div>
                                    </td>
                                );
                            })}
                        </tr>

                        {/* Row 3 — Away ML */}
                        <tr>
                            <td className="odds-matrix-row-label">
                                <TeamLogoCell teamName={game.away_team} allTeams={sportTeams} />
                            </td>
                            {bookData.map(({ book, awayML }) => {
                                const best = awayML != null && awayML === bestAwayML;
                                return (
                                    <td key={book.key} className={`odds-matrix-cell${best ? ' best-cell' : ''}`} onClick={() => openLink(getLink(book))}>
                                        <div className="omc-main">{fmt(awayML)}</div>
                                    </td>
                                );
                            })}
                        </tr>

                        {/* Row 4 — O/U */}
                        <tr>
                            <td className="odds-matrix-row-label">O / U</td>
                            {bookData.map(({ book, overLine }) => {
                                const pt = overLine?.point;
                                return (
                                    <td key={book.key} className="odds-matrix-cell" onClick={() => openLink(getLink(book))}>
                                        {pt != null ? (
                                            <>
                                                <div className="omc-main">{pt}</div>
                                                <div className="omc-juice">{fmt(overLine?.price)}</div>
                                            </>
                                        ) : <span className="omc-na">—</span>}
                                    </td>
                                );
                            })}
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
