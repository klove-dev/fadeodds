'use client';

import { Game, Bookmaker } from '@/types';
import { fmt, shortTeam, formatOddsTimestamp } from '@/lib/utils';
import { getBetUrl, isBookAvailable, rewriteLinkForState } from '@/lib/sportsbooks';

interface OddsPanelProps {
    game: Game;
    savedBetIds: string[];
    bettingState: string | null;
    oddsTimestamp: string | null;
    showOddsTimestamp: boolean;
    onSaveBet: (bookKey: string, bookTitle: string) => void;
}

function findBestOdds(books: Bookmaker[], game: Game) {
    let awayML = -Infinity;
    let total = -Infinity;
    books.forEach((book) => {
        const h2h = book.markets?.find((m) => m.key === 'h2h');
        const totals = book.markets?.find((m) => m.key === 'totals');
        const away = h2h?.outcomes.find((o) => o.name === game.away_team)?.price;
        if (away !== undefined && away > awayML) awayML = away;
        const over = totals?.outcomes.find((o) => o.name === 'Over')?.point;
        if (over !== undefined && over > total) total = over;
    });
    return { awayML, total };
}

export default function OddsPanel({ game, savedBetIds, bettingState, oddsTimestamp, showOddsTimestamp, onSaveBet }: OddsPanelProps) {
    const books = (game.bookmakers || []).filter((b) => isBookAvailable(b.key, bettingState));

    if (!books.length) {
        return (
            <div style={{ color: 'var(--dim)', textAlign: 'center', padding: '40px', fontSize: '0.8rem' }}>
                No odds data available
            </div>
        );
    }

    const best = findBestOdds(books, game);

    return (
        <div className="odds-panel">
            {showOddsTimestamp && oddsTimestamp && (
                <div className="odds-timestamp">odds as of {formatOddsTimestamp(oddsTimestamp)}</div>
            )}
            {books.map((book, i) => {
                const h2h = book.markets?.find((m) => m.key === 'h2h');
                const spreads = book.markets?.find((m) => m.key === 'spreads');
                const totals = book.markets?.find((m) => m.key === 'totals');

                const awayML = h2h?.outcomes.find((o) => o.name === game.away_team)?.price;
                const homeML = h2h?.outcomes.find((o) => o.name === game.home_team)?.price;
                const awaySpread = spreads?.outcomes.find((o) => o.name === game.away_team);
                const overLine = totals?.outcomes.find((o) => o.name === 'Over');

                const isBestAway = awayML !== undefined && awayML === best.awayML;
                const isBestTotal = overLine?.point !== undefined && overLine.point === best.total;

                const favId = `${game.id}-${book.key}`;
                const isStarred = savedBetIds.includes(favId);

                return (
                    <div key={book.key} className={`odds-card ${i === 0 ? 'best' : ''}`}>
                        <div className="odds-card-header">
                            <div className="book-name">{book.title}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {i === 0 && <div className="best-badge">Sharp Pick</div>}
                                <button
                                    className={`star-btn ${isStarred ? 'starred' : ''}`}
                                    onClick={() => onSaveBet(favId, book.title)}
                                >
                                    {isStarred ? '★' : '☆'}
                                </button>
                            </div>
                        </div>
                        <div className="odds-markets">
                            <div className="market-cell">
                                <div className="market-label">Away ML</div>
                                <div className={`market-val ${isBestAway ? 'best-val' : ''}`}>{fmt(awayML)}</div>
                                <div className="market-subval">{shortTeam(game.away_team)}</div>
                            </div>
                            <div className="market-cell">
                                <div className="market-label">Spread</div>
                                <div className="market-val">
                                    {awaySpread ? `${awaySpread.point && awaySpread.point > 0 ? '+' : ''}${awaySpread.point}` : '-'}
                                </div>
                                <div className="market-subval">{fmt(awaySpread?.price)}</div>
                            </div>
                            <div className="market-cell">
                                <div className="market-label">O/U</div>
                                <div className={`market-val ${isBestTotal ? 'best-val' : ''}`}>
                                    {overLine ? overLine.point : '-'}
                                </div>
                                <div className="market-subval">{fmt(overLine?.price)}</div>
                            </div>
                        </div>
                        <a
                            href={book.link ? rewriteLinkForState(book.link, bettingState) : getBetUrl(book.key, bettingState, game.sport_title)}
                            className="bet-link"
                            target="_blank"
                            rel="noreferrer noopener"
                        >
                            Bet at {book.title} →
                        </a>
                    </div>
                );
            })}
        </div>
    );
}