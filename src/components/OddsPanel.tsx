'use client';

import { useState, useEffect } from 'react';
import { Game, Score, type Sport } from '@/types';
import { fmt, formatOddsTimestamp, formatTime } from '@/lib/utils';
import { getBetUrl, rewriteLinkForState, getBookLogoUrl } from '@/lib/sportsbooks';
import { useSportsbookConfig } from '@/contexts/SportsbookContext';

export type MarketKey = 'spreads' | 'h2h' | 'totals';

interface OddsPanelProps {
    game: Game;
    score?: Score;
    savedBetIds: string[];
    bettingState: string | null;
    oddsTimestamp: string | null;
    showOddsTimestamp: boolean;
    onSaveBet: (marketKey: MarketKey, bestBookTitle: string) => void;
}

interface BestOdds {
    books: Array<{ key: string; title: string; link?: string }>;
    point?: number;
    price: number;
}

function findBest(
    bookmakers: Game['bookmakers'],
    bettingState: string | null,
    marketKey: MarketKey,
    outcomeName: string,
    isBookAvailable: (bookKey: string, state: string | null) => boolean,
): BestOdds | null {
    const candidates: Array<{
        bookKey: string; bookTitle: string; bookLink?: string;
        point?: number; price: number;
    }> = [];

    for (const book of (bookmakers || [])) {
        if (!isBookAvailable(book.key, bettingState)) continue;
        const market = book.markets?.find((m) => m.key === marketKey);
        if (!market) continue;
        const outcome = market.outcomes.find((o) => o.name === outcomeName);
        if (outcome?.price == null) continue;
        candidates.push({
            bookKey: book.key,
            bookTitle: book.title,
            bookLink: book.link,
            point: outcome.point,
            price: outcome.price,
        });
    }

    if (!candidates.length) return null;

    // Spreads: best = highest point (most favorable for bettor), then highest price if tied
    // Totals Over: lowest point first (easiest to go over), then highest price if tied
    // Totals Under: highest point first (most cushion), then highest price if tied
    // ML: highest price
    let best: typeof candidates;
    if (marketKey === 'spreads') {
        const maxPoint = Math.max(...candidates.map((c) => c.point ?? -Infinity));
        const atMax = candidates.filter((c) => c.point === maxPoint);
        const maxPrice = Math.max(...atMax.map((c) => c.price));
        best = atMax.filter((c) => c.price === maxPrice);
    } else if (marketKey === 'totals' && outcomeName === 'Over') {
        const minPoint = Math.min(...candidates.map((c) => c.point ?? Infinity));
        const atMin = candidates.filter((c) => c.point === minPoint);
        const maxPrice = Math.max(...atMin.map((c) => c.price));
        best = atMin.filter((c) => c.price === maxPrice);
    } else if (marketKey === 'totals' && outcomeName === 'Under') {
        const maxPoint = Math.max(...candidates.map((c) => c.point ?? -Infinity));
        const atMax = candidates.filter((c) => c.point === maxPoint);
        const maxPrice = Math.max(...atMax.map((c) => c.price));
        best = atMax.filter((c) => c.price === maxPrice);
    } else {
        const maxPrice = Math.max(...candidates.map((c) => c.price));
        best = candidates.filter((c) => c.price === maxPrice);
    }

    return {
        books: best.map((c) => ({ key: c.bookKey, title: c.bookTitle, link: c.bookLink })),
        point: best[0].point,
        price: best[0].price,
    };
}

function sportKeyFromTitle(title: string): Sport {
    const t = title.toLowerCase();
    if (t.includes('ncaab') || t.includes('college basketball')) return 'basketball_ncaab';
    if (t.includes('nba') || t.includes('basketball')) return 'basketball_nba';
    if (t.includes('nfl') || t.includes('football')) return 'americanfootball_nfl';
    if (t.includes('nhl') || t.includes('hockey')) return 'icehockey_nhl';
    return 'baseball_mlb';
}

function BookLogos({ best, onBookClick }: { best: BestOdds; onBookClick?: (b: { key: string; title: string; link?: string }) => void }) {
    const multi = best.books.length > 1;
    return (
        <div style={{ display: 'flex', gap: '3px', justifyContent: 'center', marginBottom: '4px', flexWrap: 'wrap' }}>
            {best.books.map((b) => {
                const logoUrl = getBookLogoUrl(b.key);
                const handleClick = multi && onBookClick
                    ? (e: React.MouseEvent) => { e.stopPropagation(); onBookClick(b); }
                    : undefined;
                return logoUrl ? (
                    <img key={b.key} src={logoUrl} alt={b.title} title={b.title}
                        width={18} height={18}
                        style={{ objectFit: 'contain', cursor: multi ? 'pointer' : undefined }}
                        onClick={handleClick}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                ) : (
                    <span key={b.key} style={{ fontSize: '0.6rem', color: 'var(--dim)', cursor: multi ? 'pointer' : undefined }}
                        onClick={handleClick}
                    >{b.title}</span>
                );
            })}
        </div>
    );
}

export default function OddsPanel({
    game,
    score,
    savedBetIds,
    bettingState,
    oddsTimestamp,
    showOddsTimestamp,
    onSaveBet,
}: OddsPanelProps) {
    const { isBookAvailable } = useSportsbookConfig();
    const [records, setRecords] = useState<{ away: string | null; home: string | null } | null>(null);
    const [showDetails, setShowDetails] = useState(false);

    const gameSport = sportKeyFromTitle(game.sport_title);

    useEffect(() => {
        const params = new URLSearchParams({ sport: gameSport, away: game.away_team, home: game.home_team });
        fetch(`/api/team-stats?${params}`)
            .then((r) => r.json())
            .then(setRecords)
            .catch(() => setRecords(null));
    }, [game.id, gameSport, game.away_team, game.home_team]);

    // Score state — only meaningful for live/final games
    const hasScore = (score?.isLive || score?.isFinal) && score?.homeScore != null;
    const awayScoreNum = hasScore ? Number(score!.awayScore) : null;
    const homeScoreNum = hasScore ? Number(score!.homeScore) : null;
    const awayLeading = awayScoreNum !== null && homeScoreNum !== null && awayScoreNum > homeScoreNum;
    const homeLeading = awayScoreNum !== null && homeScoreNum !== null && homeScoreNum > awayScoreNum;

    const books = game.bookmakers || [];
    const availableBooks = books.filter((b) => isBookAvailable(b.key, bettingState));

    if (!availableBooks.length) {
        return (
            <div style={{ color: 'var(--dim)', textAlign: 'center', padding: '30px', fontSize: '0.8rem' }}>
                No odds data available
            </div>
        );
    }

    const bestAwaySpr = findBest(books, bettingState, 'spreads', game.away_team, isBookAvailable);
    const bestHomeSpr = findBest(books, bettingState, 'spreads', game.home_team, isBookAvailable);
    const bestAwayML  = findBest(books, bettingState, 'h2h',     game.away_team, isBookAvailable);
    const bestHomeML  = findBest(books, bettingState, 'h2h',     game.home_team, isBookAvailable);
    const bestOver    = findBest(books, bettingState, 'totals',  'Over',         isBookAvailable);
    const bestUnder   = findBest(books, bettingState, 'totals',  'Under',        isBookAvailable);

    const openLink = (best: BestOdds | null) => {
        if (!best) return;
        const b = best.books[0];
        const url = b.link
            ? rewriteLinkForState(b.link, bettingState)
            : getBetUrl(b.key, bettingState, game.sport_title);
        window.open(url, '_blank', 'noreferrer noopener');
    };

    const openBookLink = (b: { key: string; title: string; link?: string }) => {
        const url = b.link
            ? rewriteLinkForState(b.link, bettingState)
            : getBetUrl(b.key, bettingState, game.sport_title);
        window.open(url, '_blank', 'noreferrer noopener');
    };

    const markets: { key: MarketKey; label: string }[] = [
        { key: 'spreads', label: 'Spread' },
        { key: 'h2h',     label: 'Money'  },
        { key: 'totals',  label: 'Total'  },
    ];

    const bestBookTitle = (key: MarketKey): string => {
        if (key === 'spreads') return bestAwaySpr?.books[0]?.title ?? 'Spread';
        if (key === 'h2h')     return bestAwayML?.books[0]?.title ?? 'Money';
        return bestOver?.books[0]?.title ?? 'Total';
    };

    const renderSpread = (best: BestOdds | null) => {
        if (!best) return <span className="omc-na">—</span>;
        const pt = best.point;
        return (
            <>
                <BookLogos best={best} onBookClick={openBookLink} />
                <div className="omc-main">{pt != null ? (pt > 0 ? `+${pt}` : String(pt)) : '—'}</div>
                <div className="omc-juice">{fmt(best.price)}</div>
            </>
        );
    };

    const renderML = (best: BestOdds | null) => {
        if (!best) return <span className="omc-na">—</span>;
        return (
            <>
                <BookLogos best={best} onBookClick={openBookLink} />
                <div className="omc-main">{fmt(best.price)}</div>
            </>
        );
    };

    const renderTotal = (best: BestOdds | null, side: 'O' | 'U') => {
        if (!best) return <span className="omc-na">—</span>;
        return (
            <>
                <BookLogos best={best} onBookClick={openBookLink} />
                <div className="omc-main">{side} {best.point}</div>
                <div className="omc-juice">{fmt(best.price)}</div>
            </>
        );
    };

    const OddsCell = ({ best, children }: { best: BestOdds | null; children: React.ReactNode }) => {
        const multi = (best?.books.length ?? 0) > 1;
        return (
            <td className="odds-matrix-cell"
                style={{ cursor: multi ? 'default' : 'pointer', textAlign: 'center' }}
                onClick={multi ? undefined : () => openLink(best)}>
                {children}
            </td>
        );
    };

    const TeamRow = ({ name, record, spreadBest, mlBest, totalBest, scoreVal, isLeading }: {
        name: string;
        record: string | null | undefined;
        spreadBest: BestOdds | null;
        mlBest: BestOdds | null;
        totalBest: BestOdds | null;
        scoreVal?: string | number | null;
        isLeading?: boolean;
    }) => (
        <tr>
            <td className="odds-matrix-row-label" style={{ minWidth: '180px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.82rem', lineHeight: 1.2 }}>{name}</div>
                        {record && <div style={{ fontSize: '0.65rem', color: 'var(--dim)', marginTop: '2px' }}>{record}</div>}
                    </div>
                    {scoreVal != null && (
                        <div className={`row-score${isLeading ? ' leading' : ''}`}>{scoreVal}</div>
                    )}
                </div>
            </td>
            <OddsCell best={spreadBest}>{renderSpread(spreadBest)}</OddsCell>
            <OddsCell best={mlBest}>{renderML(mlBest)}</OddsCell>
            <OddsCell best={totalBest}>{renderTotal(totalBest, name === game.away_team ? 'O' : 'U')}</OddsCell>
        </tr>
    );

    // ── All-Books detail table ───────────────────────────────────────────────
    const bookRows = availableBooks.map((book) => {
        const spreadMkt = book.markets?.find((m) => m.key === 'spreads');
        const h2hMkt    = book.markets?.find((m) => m.key === 'h2h');
        const totalsMkt = book.markets?.find((m) => m.key === 'totals');
        return {
            key: book.key, title: book.title, link: book.link,
            spread: {
                away: spreadMkt?.outcomes.find((o) => o.name === game.away_team),
                home: spreadMkt?.outcomes.find((o) => o.name === game.home_team),
            },
            h2h: {
                away: h2hMkt?.outcomes.find((o) => o.name === game.away_team),
                home: h2hMkt?.outcomes.find((o) => o.name === game.home_team),
            },
            totals: {
                over:  totalsMkt?.outcomes.find((o) => o.name === 'Over'),
                under: totalsMkt?.outcomes.find((o) => o.name === 'Under'),
            },
        };
    });

    const openBookByKey = (bookKey: string, bookLink?: string) => {
        const url = bookLink
            ? rewriteLinkForState(bookLink, bettingState)
            : getBetUrl(bookKey, bettingState, game.sport_title);
        window.open(url, '_blank', 'noreferrer noopener');
    };

    const fmtSpreadCell = (o?: { point?: number; price: number } | null) => {
        if (!o) return null;
        const pt = o.point != null ? (o.point > 0 ? `+${o.point}` : String(o.point)) : null;
        return <><div className="dc-main">{pt ?? '—'}</div><div className="dc-juice">{fmt(o.price)}</div></>;
    };
    const fmtMLCell = (o?: { price: number } | null) =>
        o ? <div className="dc-main">{fmt(o.price)}</div> : null;
    const fmtTotalCell = (o?: { point?: number; price: number } | null, side?: 'O' | 'U') =>
        o ? <><div className="dc-main">{side} {o.point}</div><div className="dc-juice">{fmt(o.price)}</div></> : null;

    const SECTIONS = [
        {
            label: 'SPREAD',
            rows: [
                { label: game.away_team, cells: bookRows.map((b) => ({ b, node: fmtSpreadCell(b.spread.away) })) },
                { label: game.home_team, cells: bookRows.map((b) => ({ b, node: fmtSpreadCell(b.spread.home) })) },
            ],
        },
        {
            label: 'MONEYLINE',
            rows: [
                { label: game.away_team, cells: bookRows.map((b) => ({ b, node: fmtMLCell(b.h2h.away) })) },
                { label: game.home_team, cells: bookRows.map((b) => ({ b, node: fmtMLCell(b.h2h.home) })) },
            ],
        },
        {
            label: 'TOTAL',
            rows: [
                { label: game.away_team, cells: bookRows.map((b) => ({ b, node: fmtTotalCell(b.totals.over,  'O') })) },
                { label: game.home_team, cells: bookRows.map((b) => ({ b, node: fmtTotalCell(b.totals.under, 'U') })) },
            ],
        },
    ];

    return (
        <div className="odds-table-wrap">
            {showOddsTimestamp && oddsTimestamp && (
                <div className="odds-timestamp" style={{ padding: '10px 16px 0' }}>
                    odds as of {formatOddsTimestamp(oddsTimestamp)}
                </div>
            )}
            <div className="details-toggle-row">
                <button
                    className={`details-toggle-btn${showDetails ? ' open' : ''}`}
                    onClick={() => setShowDetails((v) => !v)}
                >
                    {showDetails ? 'Hide Details' : 'All Books'}
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 9l6 6 6-6" />
                    </svg>
                </button>
            </div>

            <div className="odds-table-scroll">
                <table className="odds-matrix">
                    <thead>
                        <tr>
                            <th className="odds-matrix-corner">
                                {score?.isLive ? (
                                    <span className="live-clock">{score.periodLabel} {score.displayClock}</span>
                                ) : score?.isFinal ? (
                                    <span className="final-badge">Final</span>
                                ) : (
                                    <span className="corner-time">{formatTime(game.commence_time)}</span>
                                )}
                            </th>
                            {markets.map(({ key, label }) => {
                                const favId  = `${game.id}-${key}`;
                                const starred = savedBetIds.includes(favId);
                                return (
                                    <th key={key} className="odds-matrix-book-th">
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                            <span>{label}</span>
                                            <button
                                                className={`matrix-star${starred ? ' starred' : ''}`}
                                                onClick={() => onSaveBet(key, bestBookTitle(key))}
                                            >
                                                {starred ? '★' : '☆'}
                                            </button>
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        <TeamRow
                            name={game.away_team}
                            record={records?.away}
                            spreadBest={bestAwaySpr}
                            mlBest={bestAwayML}
                            totalBest={bestOver}
                            scoreVal={hasScore ? score!.awayScore : null}
                            isLeading={awayLeading}
                        />
                        <TeamRow
                            name={game.home_team}
                            record={records?.home}
                            spreadBest={bestHomeSpr}
                            mlBest={bestHomeML}
                            totalBest={bestUnder}
                            scoreVal={hasScore ? score!.homeScore : null}
                            isLeading={homeLeading}
                        />
                    </tbody>
                </table>
            </div>

            {showDetails && (
                <div className="details-table-wrap">
                    <div className="details-table-scroll">
                        <table className="details-matrix">
                            <thead>
                                <tr>
                                    <th className="details-label-th"></th>
                                    {bookRows.map((b) => {
                                        const logoUrl = getBookLogoUrl(b.key);
                                        return (
                                            <th key={b.key} className="details-book-th"
                                                onClick={() => openBookByKey(b.key, b.link)}
                                                style={{ cursor: 'pointer' }}>
                                                {logoUrl
                                                    ? <img src={logoUrl} alt={b.title} width={18} height={18}
                                                        style={{ objectFit: 'contain', display: 'block', margin: '0 auto 3px' }}
                                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                                    : null}
                                                <div>{b.title}</div>
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody>
                                {SECTIONS.map((section) => (
                                    <>
                                        <tr key={section.label + '-hdr'} className="details-section-hdr">
                                            <td colSpan={bookRows.length + 1}>{section.label}</td>
                                        </tr>
                                        {section.rows.map((row) => (
                                            <tr key={section.label + '-' + row.label}>
                                                <td className="details-row-label">{row.label}</td>
                                                {row.cells.map(({ b, node }) => (
                                                    <td key={b.key} className="details-cell"
                                                        style={{ cursor: node ? 'pointer' : 'default' }}
                                                        onClick={node ? () => openBookByKey(b.key, b.link) : undefined}>
                                                        {node ?? <span className="dc-na">—</span>}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
