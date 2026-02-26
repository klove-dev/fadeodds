'use client';

import { Game, Score } from '@/types';
import { fmt, shortTeam, shortName, formatTime } from '@/lib/utils';

interface GameCardProps {
    game: Game;
    score?: Score;
    onSelect: (gameId: string) => void;
    isMyTeam?: boolean;
}

export default function GameCard({ game, score, onSelect, isMyTeam }: GameCardProps) {
    const books = game.bookmakers || [];

    const findMarket = (key: string) => {
        for (const b of books) {
            const m = b.markets?.find((m) => m.key === key);
            if (m?.outcomes?.length) return m;
        }
        return null;
    };

    const h2h = findMarket('h2h');
    const spreads = findMarket('spreads');
    const totals = findMarket('totals');

    let spread = '-';
    let mlDisplay = '-';
    let total = '-';
    let awayML: number | undefined;

    if (h2h) {
        const away = h2h.outcomes.find((o) => o.name === game.away_team);
        const home = h2h.outcomes.find((o) => o.name === game.home_team);
        awayML = away?.price;
        mlDisplay = `${fmt(away?.price)} / ${fmt(home?.price)}`;
    }

    if (spreads) {
        const fav = spreads.outcomes.find((o) => o.point && o.point < 0) || spreads.outcomes[0];
        if (fav) spread = `${shortName(fav.name)} ${fav.point && fav.point > 0 ? '+' : ''}${fav.point}`;
    }

    if (totals) {
        const over = totals.outcomes.find((o) => o.name === 'Over');
        if (over) total = `O/U ${over.point}`;
    }

    const isLive = score?.isLive;
    const isFinal = score?.isFinal;

    const awayScore = Number(score?.awayScore);
    const homeScore = Number(score?.homeScore);
    const awayWinning = awayScore > homeScore;
    const homeWinning = homeScore > awayScore;

    return (
        <div className="game-card" onClick={() => onSelect(game.id)}>
            {isMyTeam && (
                <div style={{
                    position: 'absolute', top: '10px', right: '12px',
                    color: 'var(--cobalt)', fontSize: '0.75rem', fontWeight: 900,
                }}>
                    ★
                </div>
            )}

            {isLive && score?.homeScore !== null ? (
                <>
                    <div style={{ textAlign: 'center', marginBottom: '4px' }}>
                        <span className="live-clock">
                            {score.periodLabel} {score.displayClock}
                        </span>
                    </div>
                    <div className="live-score-row">
                        <div className="live-score-team">
                            <div className="live-score-name">{shortTeam(game.away_team)}</div>
                            <div className={`live-score-num ${awayWinning ? 'winning' : ''}`}>{score.awayScore}</div>
                        </div>
                        <div className="live-score-divider">-</div>
                        <div className="live-score-team">
                            <div className="live-score-name">{shortTeam(game.home_team)}</div>
                            <div className={`live-score-num ${homeWinning ? 'winning' : ''}`}>{score.homeScore}</div>
                        </div>
                    </div>
                </>
            ) : isFinal && score?.homeScore !== null ? (
                <>
                    <div style={{ textAlign: 'center', marginBottom: '4px' }}>
                        <span className="final-badge">Final</span>
                    </div>
                    <div className="live-score-row">
                        <div className="live-score-team">
                            <div className="live-score-name">{shortTeam(game.away_team)}</div>
                            <div className={`live-score-num ${awayWinning ? 'winning' : ''}`}>{score.awayScore}</div>
                        </div>
                        <div className="live-score-divider">-</div>
                        <div className="live-score-team">
                            <div className="live-score-name">{shortTeam(game.home_team)}</div>
                            <div className={`live-score-num ${homeWinning ? 'winning' : ''}`}>{score.homeScore}</div>
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <div className="game-time">{formatTime(game.commence_time)}</div>
                    <div className="matchup">
                        <div className="team-name away">{shortTeam(game.away_team)}</div>
                        <div className="vs-badge">@</div>
                        <div className="team-name home">{shortTeam(game.home_team)}</div>
                    </div>
                </>
            )}

            <div className="odds-row">
                <div className="odds-cell">
                    <div className="odds-cell-label">Spread</div>
                    <div className="odds-cell-val">{spread}</div>
                </div>
                <div className="odds-cell">
                    <div className="odds-cell-label">Moneyline</div>
                    <div className={`odds-cell-val ${awayML && awayML > 0 ? 'pos' : ''}`}>{mlDisplay}</div>
                </div>
                <div className="odds-cell">
                    <div className="odds-cell-label">Total</div>
                    <div className="odds-cell-val">{total}</div>
                </div>
            </div>

            <button className="analyze-btn">Analyze with AI</button>
            <div className="books-count">{books.length} book{books.length !== 1 ? 's' : ''} tracked</div>
        </div>
    );
}