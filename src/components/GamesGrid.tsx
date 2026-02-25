'use client';

import { Game, Score, Sport } from '@/types';
import { makeScoreKey } from '@/lib/utils';
import type { TeamDef } from '@/lib/teams';
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
    myTeamsActive: boolean;
    myTeams: TeamDef[];
    onMyTeamsToggle: () => void;
    onEditMyTeams: () => void;
}

export default function GamesGrid({
    games,
    scores,
    loading,
    currentSport,
    onSportChange,
    onSelectGame,
    myTeamsActive,
    myTeams,
    onMyTeamsToggle,
    onEditMyTeams,
}: GamesGridProps) {
    const scoreMap: Record<string, Score> = {};
    scores.forEach((s) => {
        scoreMap[makeScoreKey(s.awayTeam, s.homeTeam)] = s;
    });

    const getScore = (game: Game): Score | undefined => {
        return scoreMap[makeScoreKey(game.away_team, game.home_team)];
    };

    const sectionLabel = myTeamsActive
        ? `My Teams · ${games.length} Game${games.length !== 1 ? 's' : ''}`
        : loading
        ? 'Loading Games...'
        : `${games.length} Upcoming Games`;

    return (
        <>
            <div className="sport-tabs">
                {/* My Teams toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                        className={`sport-tab my-teams ${myTeamsActive ? 'active' : ''}`}
                        onClick={onMyTeamsToggle}
                    >
                        ★ My Teams{myTeams.length > 0 ? ` (${myTeams.length})` : ''}
                    </button>
                    {myTeamsActive && (
                        <button className="gear-btn" onClick={onEditMyTeams} title="Edit My Teams">
                            ⚙
                        </button>
                    )}
                </div>

                {/* Sport tabs — dimmed when My Teams is active */}
                {SPORTS.map((s) => (
                    <button
                        key={s.key}
                        className={`sport-tab ${!myTeamsActive && currentSport === s.key ? 'active' : ''}`}
                        style={myTeamsActive ? { opacity: 0.45 } : undefined}
                        onClick={() => onSportChange(s.key)}
                    >
                        {s.label}
                    </button>
                ))}
            </div>

            <div className="games-section">
                <div className="section-label">{sectionLabel}</div>

                {loading ? (
                    <div className="games-grid">
                        {Array(6).fill(null).map((_, i) => (
                            <div key={i} className="skeleton" />
                        ))}
                    </div>
                ) : myTeamsActive && games.length === 0 ? (
                    <div className="my-teams-empty">
                        <div className="my-teams-empty-icon">📅</div>
                        <div className="my-teams-empty-title">None of your teams are playing soon</div>
                        <div className="my-teams-empty-sub">Check back closer to game day, or update your teams.</div>
                        <button className="my-teams-manage-btn" onClick={onEditMyTeams}>
                            Manage My Teams
                        </button>
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
