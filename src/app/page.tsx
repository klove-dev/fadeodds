'use client';

import { useState, useEffect, useCallback } from 'react';
import { Game, Score, Injury, Analysis, SavedBet, Sport, Tier } from '@/types';
import { makeScoreKey } from '@/lib/utils';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import GamesGrid from '@/components/GamesGrid';
import AnalysisView from '@/components/AnalysisView';

const TIER_LIMITS: Record<Tier, { games: number; questions: number }> = {
    free:  { games: 0,        questions: 0 },
    go:    { games: 3,        questions: 10 },
    plus:  { games: 10,       questions: 100 },
    pro:   { games: Infinity, questions: 5000 },
};

const LS_TIER  = 'fo_tier';
const LS_USAGE = 'fo_usage';
const LS_FAVS  = 'fo_favs';

function getUsage(): { date: string; games: number; questions: number } {
    const today = new Date().toISOString().slice(0, 10);
    try {
        const raw = localStorage.getItem(LS_USAGE);
        if (!raw) return { date: today, games: 0, questions: 0 };
        const u = JSON.parse(raw);
        return u.date === today ? u : { date: today, games: 0, questions: 0 };
    } catch {
        return { date: today, games: 0, questions: 0 };
    }
}

function incrementUsage(field: 'games' | 'questions') {
    const u = getUsage();
    u[field] = (u[field] || 0) + 1;
    localStorage.setItem(LS_USAGE, JSON.stringify(u));
}

function getSavedBets(): SavedBet[] {
    try { return JSON.parse(localStorage.getItem(LS_FAVS) || '[]'); }
    catch { return []; }
}

function saveBets(bets: SavedBet[]) {
    localStorage.setItem(LS_FAVS, JSON.stringify(bets));
}

export default function Home() {
    const [currentSport, setCurrentSport] = useState<Sport>('basketball_nba');
    const [games, setGames]               = useState<Game[]>([]);
    const [scores, setScores]             = useState<Score[]>([]);
    const [gamesLoading, setGamesLoading] = useState(true);
    const [selectedGame, setSelectedGame] = useState<Game | null>(null);
    const [injuries, setInjuries]         = useState<Injury[]>([]);
    const [analysis, setAnalysis]         = useState<Analysis | null>(null);
    const [analysisLoading, setAnalysisLoading] = useState(false);
    const [sidebarOpen, setSidebarOpen]   = useState(false);
    const [tier, setTierState]            = useState<Tier>('pro');
    const [savedBets, setSavedBets]       = useState<SavedBet[]>([]);
    const [sessionHistory, setSessionHistory] = useState<{ title: string; sport: string }[]>([]);
    const [oddsCredits, setOddsCredits]   = useState<string | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem(LS_TIER) as Tier | null;
        if (!stored) localStorage.setItem(LS_TIER, 'pro');
        setTierState((stored as Tier) || 'pro');
        setSavedBets(getSavedBets());
    }, []);

    const loadGames = useCallback(async (sport: Sport) => {
        setGamesLoading(true);
        try {
            const [oddsRes, scoresRes] = await Promise.all([
                fetch(`/api/odds?sport=${sport}`),
                fetch(`/api/scores?sport=${sport}`),
            ]);

            if (!oddsRes.ok) throw new Error(`HTTP ${oddsRes.status}`);
            const gamesData: Game[] = await oddsRes.json();

            const remaining = oddsRes.headers.get('x-requests-remaining');
            if (remaining && remaining !== 'unknown') setOddsCredits(remaining);

            setGames(gamesData);

            if (scoresRes.ok) {
                const scoresData: Score[] = await scoresRes.json();
                setScores(scoresData);
            }
        } catch (err) {
            console.error('Failed to load games:', err);
            setGames([]);
        } finally {
            setGamesLoading(false);
        }
    }, []);

    useEffect(() => {
        loadGames(currentSport);
    }, [currentSport, loadGames]);

    const getGameInjuries = useCallback(async (game: Game): Promise<Injury[]> => {
        try {
            const res = await fetch(`/api/injuries?sport=${currentSport}`);
            if (!res.ok) return [];
            const data = await res.json();
            const all: Injury[] = data.injuries || [];
            const awayLast = game.away_team.trim().split(' ').pop()?.toLowerCase() || '';
            const homeLast = game.home_team.trim().split(' ').pop()?.toLowerCase() || '';
            return all.filter((inj) => {
                const t = inj.team.toLowerCase();
                return t.includes(awayLast) || t.includes(homeLast);
            });
        } catch {
            return [];
        }
    }, [currentSport]);

    const selectGame = useCallback(async (gameId: string) => {
        const game = games.find((g) => g.id === gameId);
        if (!game) return;

        const title = `${game.away_team} @ ${game.home_team}`;
        setSessionHistory((prev) => {
            const filtered = prev.filter((h) => h.title !== title);
            return [{ title, sport: game.sport_title }, ...filtered];
        });

        setSelectedGame(game);
        setAnalysis(null);
        setAnalysisLoading(true);

        const canAnalyze = tier !== 'free' && (
            TIER_LIMITS[tier].games === Infinity ||
            getUsage().games < TIER_LIMITS[tier].games
        );

        if (!canAnalyze) {
            setAnalysisLoading(false);
            return;
        }

        incrementUsage('games');

        const gameInjuries = await getGameInjuries(game);
        setInjuries(gameInjuries);

        try {
            const res = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    game: {
                        away_team: game.away_team,
                        home_team: game.home_team,
                        sport_title: game.sport_title,
                        commence_time: game.commence_time,
                    },
                    oddsData: game.bookmakers,
                    injuryData: gameInjuries,
                    mode: 'initial',
                }),
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data: Analysis = await res.json();
            setAnalysis(data);
        } catch (err) {
            console.error('Analysis failed:', err);
        } finally {
            setAnalysisLoading(false);
        }
    }, [games, tier, getGameInjuries]);

    const handleSelectHistory = useCallback((title: string) => {
        const game = games.find((g) => `${g.away_team} @ ${g.home_team}` === title);
        if (game) selectGame(game.id);
    }, [games, selectGame]);

    const handleSetTier = useCallback((t: Tier) => {
        localStorage.setItem(LS_TIER, t);
        setTierState(t);
    }, []);

    const handleSaveBet = useCallback((favId: string, bookTitle: string) => {
        if (!selectedGame) return;
        setSavedBets((prev) => {
            const exists = prev.findIndex((b) => b.id === favId);
            let updated: SavedBet[];
            if (exists >= 0) {
                updated = prev.filter((b) => b.id !== favId);
            } else {
                const newBet: SavedBet = {
                    id: favId,
                    type: 'line',
                    bookName: bookTitle,
                    awayTeam: selectedGame.away_team,
                    homeTeam: selectedGame.home_team,
                    sport: selectedGame.sport_title,
                    commenceTime: selectedGame.commence_time,
                    pick: bookTitle,
                    savedAt: Date.now(),
                };
                updated = [newBet, ...prev];
            }
            saveBets(updated);
            return updated;
        });
    }, [selectedGame]);

    const handleRemoveBet = useCallback((id: string) => {
        setSavedBets((prev) => {
            const updated = prev.filter((b) => b.id !== id);
            saveBets(updated);
            return updated;
        });
    }, []);

    return (
        <>
            <Header
                games={games}
                onMenuClick={() => setSidebarOpen(true)}
            />

            <Sidebar
                isOpen={sidebarOpen}
                tier={tier}
                savedBets={savedBets}
                sessionHistory={sessionHistory}
                oddsCredits={oddsCredits}
                onClose={() => setSidebarOpen(false)}
                onSelectHistory={handleSelectHistory}
                onRemoveBet={handleRemoveBet}
                onOpenAccount={() => {}}
                onOpenPricing={() => {}}
                onSetTier={handleSetTier}
            />

            <main className="main-content">
                {selectedGame ? (
                    <AnalysisView
                        game={selectedGame}
                        injuries={injuries}
                        analysis={analysis}
                        loading={analysisLoading}
                        savedBets={savedBets}
                        onBack={() => setSelectedGame(null)}
                        onSaveBet={handleSaveBet}
                    />
                ) : (
                    <>
                        <div className="logo">
                            FADE<span className="logo-accent">ODDS</span>
                        </div>
                        <p style={{
                            textAlign: 'center', fontSize: '0.62rem', color: 'var(--dim)',
                            fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px',
                            margin: '6px 0 0'
                        }}>
                            Live Odds · AI Analysis · Sharp Intelligence
                        </p>
                        <GamesGrid
                            games={games}
                            scores={scores}
                            loading={gamesLoading}
                            currentSport={currentSport}
                            onSportChange={setCurrentSport}
                            onSelectGame={selectGame}
                        />
                    </>
                )}

                <footer style={{ textAlign: 'center', padding: '60px 20px 40px', maxWidth: '700px', margin: '0 auto' }}>
                    <p style={{ fontSize: '0.58rem', color: 'var(--dim)', textTransform: 'uppercase', fontWeight: 700, lineHeight: 2.2 }}>
                        FadeOdds is an AI analytical tool. All insights are informational only.<br />
                        Not financial advice. Must be 21+ to gamble. Odds subject to change.
                    </p>
                    <a href="https://www.ncpgambling.org" target="_blank" rel="noreferrer"
                        style={{ display: 'inline-block', marginTop: '14px', padding: '6px 16px', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--gold)', fontSize: '0.62rem', fontWeight: 900, textDecoration: 'none' }}>
                        Problem Gambling? Call 1-800-GAMBLER
                    </a>
                </footer>
            </main>
        </>
    );
}