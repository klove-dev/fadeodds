'use client';

import { Game, Score, Sport } from '@/types';
import { makeScoreKey } from '@/lib/utils';
import GameCard from './GameCard';

const SPORTS: { key: Sport; label: string }[] = [
    { key: 'basketball_nba', label: 'NBA' },
    { key: 'basketball_ncaab', label: 'NCAAB' },
    { key: 'americanfootball_nfl', label: 'NFL' },
    { key: 'icehockey_nhl', label: 'NHL' },
    { key: 'baseball_mlb', label: 'MLB' },
];

interface GamesGridProps {
    games: Game[];
    scores: Score[];
    loading: boolean;
    currentSport: Sport;
    onSportChange: (sport: Sport) => void;
    onSelectGame: (gameId: string) => void;
}

export default function GamesGrid({
    games,
    scores,
    loading,
    currentSport,
    onSportChange,
    onSelectGame,
}: GamesGridProps) {
    const scoreMap: Record<string, Score> = {};
    scores.forEach((s) => {
        scoreMap[makeScoreKey(s.awayTeam, s.homeTeam)] = s;
    });

    const getScore = (game: Game): Score | undefined => {
        return scoreMap[makeScoreKey(game.away_team, game.home_team)];
    };

    return (
        <>
            <div className="sport-tabs">
                {SPORTS.map((s) => (
                    <button
                        key={s.key}
                        className={`sport-tab ${currentSport === s.key ? 'active' : ''}`}
                        onClick={() => onSportChange(s.key)}
                    >
                        {s.label}
                    </button>
                ))}
            </div>

            <div className="games-section">
                <div className="section-label">
                    {loading ? 'Loading Games...' : `${games.length} Upcoming Games`}
                </div>

                {loading ? (
                    <div className="games-grid">
                        {Array(6).fill(null).map((_, i) => (
                            <div key={i} className="skeleton" />
                        ))}
                    </div>
                ) : games.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--dim)' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📅</div>
                        <div style={{ fontWeight: 700 }}>No upcoming games right now</div>
                        <div style={{ fontSize: '0.72rem', marginTop: '8px' }}>Try another sport or check back later</div>
                    </div>
                ) : (
                    <div className="games-grid">
                        {games.map((game) => (
                            <GameCard
                                key={game.id}
                                game={game}
                                score={getScore(game)}
                                onSelect={onSelectGame}
                            />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}