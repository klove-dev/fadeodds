'use client';

import { useState, useEffect } from 'react';
import { Game, Injury, Analysis, SavedBet } from '@/types';
import { formatTime, fmt, shortName } from '@/lib/utils';
import OddsPanel from './OddsPanel';

interface AnalysisViewProps {
    game: Game;
    injuries: Injury[];
    analysis: Analysis | null;
    analysisError: 'upgrade' | 'limit' | 'error' | null;
    loading: boolean;
    savedBets: SavedBet[];
    bettingState: string | null;
    oddsTimestamp: string | null;
    showOddsTimestamp: boolean;
    onBack: () => void;
    onSaveBet: (favId: string, bookTitle: string) => void;
}

function InjuryPanel({ injuries }: { injuries: Injury[] }) {
    if (!injuries.length) return null;

    const statusColor = (s: string) => {
        s = (s || '').toLowerCase();
        if (s.includes('out')) return '#EF4444';
        if (s.includes('doubtful')) return 'var(--orange)';
        if (s.includes('questionable')) return '#F59E0B';
        return 'var(--dim)';
    };

    return (
        <div style={{ marginBottom: '16px' }}>
            <div style={{
                fontSize: '0.58rem', fontWeight: 900, textTransform: 'uppercase',
                letterSpacing: '2px', color: 'var(--orange)', marginBottom: '10px',
                display: 'flex', alignItems: 'center', gap: '6px'
            }}>
                Injury Report
            </div>
            {injuries.map((inj, i) => (
                <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '7px 10px', background: 'var(--card-sub)', borderRadius: '8px',
                    marginBottom: '5px', borderLeft: `3px solid ${statusColor(inj.status)}`
                }}>
                    <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>{inj.player}</div>
                        <div style={{ fontSize: '0.56rem', color: 'var(--dim)', marginTop: '1px' }}>
                            {inj.team}{inj.injury ? ` · ${inj.injury}` : ''}
                        </div>
                    </div>
                    <div style={{
                        fontSize: '0.62rem', fontWeight: 900,
                        color: statusColor(inj.status), whiteSpace: 'nowrap', marginLeft: '8px'
                    }}>
                        {inj.status}
                    </div>
                </div>
            ))}
        </div>
    );
}

function AnalysisLoading() {
    return (
        <div className="ai-loading">
            <div className="ai-loading-title">AI Market Scan</div>
            <div className="progress-track">
                <div className="progress-fill" />
            </div>
            <div className="ai-steps">
                <div className="ai-step active">
                    <span className="ai-step-icon">◉</span> Collecting odds from all books
                </div>
                <div className="ai-step">
                    <span className="ai-step-icon">○</span> Running market analysis
                </div>
                <div className="ai-step">
                    <span className="ai-step-icon">○</span> Building recommendation
                </div>
            </div>
        </div>
    );
}

function AnalysisLocked({ type }: { type: 'upgrade' | 'limit' | 'error' }) {
    const configs = {
        upgrade: { icon: '⚡', title: 'Analysis Locked', sub: 'Sign in and upgrade to unlock AI game analysis.' },
        limit:   { icon: '📊', title: 'Daily Limit Reached', sub: "You've hit your daily analysis cap. Check back tomorrow." },
        error:   { icon: '!', title: 'Analysis Unavailable', sub: 'Something went wrong. Try selecting the game again.' },
    };
    const c = configs[type];
    return (
        <div className="analysis-locked">
            <div className="analysis-locked-icon">{c.icon}</div>
            <div className="analysis-locked-title">{c.title}</div>
            <div className="analysis-locked-sub">{c.sub}</div>
        </div>
    );
}

function OddsSnapshot({ game }: { game: Game }) {
    const books = game.bookmakers || [];
    if (books.length === 0) return null;

    const spreadFavPts: number[] = [];
    const awayMLs: number[] = [];
    const homeMLs: number[] = [];
    const totals: number[] = [];
    let favName = '';

    for (const book of books) {
        const spreadMarket = book.markets?.find((m) => m.key === 'spreads');
        const h2hMarket    = book.markets?.find((m) => m.key === 'h2h');
        const totalsMarket = book.markets?.find((m) => m.key === 'totals');

        const fav = spreadMarket?.outcomes?.find((o) => o.point != null && o.point <= 0);
        if (fav?.point != null) {
            spreadFavPts.push(fav.point);
            if (!favName && fav.name) favName = fav.name;
        }

        const awayML = h2hMarket?.outcomes?.find((o) => o.name === game.away_team);
        const homeML = h2hMarket?.outcomes?.find((o) => o.name === game.home_team);
        if (awayML?.price != null) awayMLs.push(awayML.price);
        if (homeML?.price != null) homeMLs.push(homeML.price);

        const over = totalsMarket?.outcomes?.find((o) => o.name === 'Over');
        if (over?.point != null) totals.push(over.point);
    }

    if (spreadFavPts.length === 0 && awayMLs.length === 0 && totals.length === 0) return null;

    const minV = (arr: number[]) => (arr.length ? Math.min(...arr) : null);
    const maxV = (arr: number[]) => (arr.length ? Math.max(...arr) : null);

    const spreadMin = minV(spreadFavPts);
    const spreadMax = maxV(spreadFavPts);
    const totalMin  = minV(totals);
    const totalMax  = maxV(totals);
    const awayMin   = minV(awayMLs);
    const awayMax   = maxV(awayMLs);
    const homeMin   = minV(homeMLs);
    const homeMax   = maxV(homeMLs);

    return (
        <div className="odds-snapshot">
            <div className="odds-snapshot-title">Odds Snapshot · {books.length} Books</div>
            <div className="odds-snapshot-grid">
                {spreadMin !== null && (
                    <div className="odds-snap-cell">
                        <div className="odds-snap-label">Spread</div>
                        <div className="odds-snap-val">
                            {favName && <span className="odds-snap-team">{shortName(favName)} </span>}
                            {spreadMin === spreadMax ? spreadMin : `${spreadMin} / ${spreadMax}`}
                        </div>
                        {spreadMin !== spreadMax && <div className="odds-snap-move">↕ Line moving</div>}
                    </div>
                )}
                {awayMin !== null && homeMin !== null && (
                    <div className="odds-snap-cell">
                        <div className="odds-snap-label">Moneyline</div>
                        <div className="odds-snap-val">
                            <span className="odds-snap-team">{shortName(game.away_team)} </span>
                            {awayMin === awayMax ? fmt(awayMin) : `${fmt(awayMin)} / ${fmt(awayMax!)}`}
                        </div>
                        <div className="odds-snap-val" style={{ marginTop: '3px' }}>
                            <span className="odds-snap-team">{shortName(game.home_team)} </span>
                            {homeMin === homeMax ? fmt(homeMin) : `${fmt(homeMin)} / ${fmt(homeMax!)}`}
                        </div>
                    </div>
                )}
                {totalMin !== null && (
                    <div className="odds-snap-cell">
                        <div className="odds-snap-label">Total</div>
                        <div className="odds-snap-val">
                            {totalMin === totalMax ? `O/U ${totalMin}` : `${totalMin} – ${totalMax}`}
                        </div>
                        {totalMin !== totalMax && <div className="odds-snap-move">↕ Disagreement</div>}
                    </div>
                )}
            </div>
        </div>
    );
}

function TeamRecords({ game }: { game: Game }) {
    const [records, setRecords] = useState<{ away: string | null; home: string | null } | null>(null);

    useEffect(() => {
        // Map sport_title → Odds API sport key for the team-stats endpoint
        const t = game.sport_title.toLowerCase();
        const sport = t.includes('ncaab') || t.includes('college basketball') ? 'basketball_ncaab'
            : t.includes('nba') || t.includes('basketball') ? 'basketball_nba'
            : t.includes('nfl') || t.includes('football') ? 'americanfootball_nfl'
            : t.includes('nhl') || t.includes('hockey') ? 'icehockey_nhl'
            : t.includes('mlb') || t.includes('baseball') ? 'baseball_mlb'
            : 'basketball_nba';

        const params = new URLSearchParams({ sport, away: game.away_team, home: game.home_team });
        fetch(`/api/team-stats?${params}`)
            .then((r) => r.json())
            .then(setRecords)
            .catch(() => setRecords(null));
    }, [game.id, game.sport_title, game.away_team, game.home_team]);

    if (!records || (!records.away && !records.home)) return null;

    return (
        <div className="team-records">
            <div className="team-records-title">Season Records</div>
            <div className="team-records-row">
                <div className="team-record-cell">
                    <div className="team-record-val">{records.away ?? '—'}</div>
                    <div className="team-record-name">{shortName(game.away_team)}</div>
                    <div className="team-record-label">Away</div>
                </div>
                <div className="team-records-vs">vs</div>
                <div className="team-record-cell">
                    <div className="team-record-val">{records.home ?? '—'}</div>
                    <div className="team-record-name">{shortName(game.home_team)}</div>
                    <div className="team-record-label">Home</div>
                </div>
            </div>
        </div>
    );
}

export default function AnalysisView({
    game,
    injuries,
    analysis,
    analysisError,
    loading,
    savedBets,
    bettingState,
    oddsTimestamp,
    showOddsTimestamp,
    onBack,
    onSaveBet,
}: AnalysisViewProps) {
    const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);

    const savedBetIds = savedBets.map((b) => b.id);
    const title = `${game.away_team} @ ${game.home_team}`;
    const meta = `${game.sport_title} · ${formatTime(game.commence_time)} · ${game.bookmakers?.length || 0} Books Tracked`;

    const sendChat = async () => {
        const text = chatInput.trim();
        if (!text || chatLoading) return;

        setChatMessages((prev) => [...prev, { role: 'user', text }]);
        setChatInput('');
        setChatLoading(true);

        try {
            const res = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    game: {
                        away_team: game.away_team,
                        home_team: game.home_team,
                        sport_title: game.sport_title,
                    },
                    oddsData: game.bookmakers,
                    injuryData: injuries,
                    userQuery: text,
                    mode: 'chat',
                }),
            });
            const data = await res.json();
            setChatMessages((prev) => [...prev, { role: 'ai', text: data.text || 'No response.' }]);
        } catch {
            setChatMessages((prev) => [...prev, { role: 'ai', text: 'Connection error. Try again.' }]);
        } finally {
            setChatLoading(false);
        }
    };

    return (
        <div className="analysis-container">
            {/* Breadcrumb nav */}
            <div className="analysis-breadcrumb">
                <button className="breadcrumb-back" onClick={onBack}>
                    <img src="/logo.png" alt="FadeOdds" className="breadcrumb-logo" />
                    <span className="breadcrumb-sep">←</span>
                    <span className="breadcrumb-games">Games</span>
                    <span className="breadcrumb-sep">/</span>
                    <span className="breadcrumb-current">{title}</span>
                </button>
            </div>

            <div className="game-header">
                <div>
                    <div className="game-header-teams">{title}</div>
                    <div className="game-header-meta">{meta}</div>
                </div>
                {analysis?.confidence && (
                    <div className="conf-badge">{analysis.confidence}% Confidence</div>
                )}
            </div>

            <div className="analysis-grid">
                <div className="intel-panel">

                    {/* Odds Snapshot — current lines across all books */}
                    <OddsSnapshot game={game} />

                    {/* Season Records */}
                    <TeamRecords game={game} />

                    <div className="panel-title">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                        </svg>
                        Neural Intelligence
                    </div>

                    {loading ? (
                        <AnalysisLoading />
                    ) : analysisError ? (
                        <AnalysisLocked type={analysisError} />
                    ) : (
                        <>
                            {analysis?.blurb && (
                                <div className="analysis-blurb">{analysis.blurb}</div>
                            )}

                            <div className="intel-tiles">
                                {analysis?.tiles.map((tile, i) => (
                                    <div key={i} className={`intel-tile ${i % 2 === 0 ? 'hl' : ''}`}>
                                        <div className="intel-tile-label">{tile.label}</div>
                                        <div className="intel-tile-val">{tile.val}</div>
                                    </div>
                                ))}
                            </div>

                            {analysis?.recommendation && (
                                <div className="rec-box">
                                    <div>
                                        <div className="rec-label">Top Recommendation</div>
                                        <div className="rec-val">{analysis.recommendation}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div className="rec-label">Edge</div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--dim)', fontWeight: 700, marginTop: '4px' }}>
                                            {analysis.edge}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {analysis?.expertTake && (
                                <div className="expert-take">{analysis.expertTake}</div>
                            )}

                            <InjuryPanel injuries={injuries} />
                        </>
                    )}

                    <div className="chat-window">
                        {chatMessages.map((msg, i) => (
                            <div key={i} className={`msg ${msg.role === 'user' ? 'msg-user' : 'msg-ai'}`}>
                                {msg.text}
                            </div>
                        ))}
                        {chatLoading && (
                            <div className="msg msg-ai pulse">Thinking...</div>
                        )}
                    </div>

                    <div className="chat-input-row">
                        <input
                            type="text"
                            placeholder="Ask a sharp follow-up..."
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') sendChat(); }}
                        />
                        <div className="send-btn" onClick={sendChat}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <OddsPanel
                    game={game}
                    savedBetIds={savedBetIds}
                    bettingState={bettingState}
                    oddsTimestamp={oddsTimestamp}
                    showOddsTimestamp={showOddsTimestamp}
                    onSaveBet={onSaveBet}
                />
            </div>
        </div>
    );
}
