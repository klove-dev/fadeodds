'use client';

import { useState, useEffect, useRef } from 'react';
import { Game, Score, Injury, Analysis, SavedBet, Sport } from '@/types';
import { formatTime, fmt } from '@/lib/utils';
import OddsPanel, { type MarketKey } from './OddsPanel';
import { useSportsbookConfig } from '@/contexts/SportsbookContext';

function renderMarkdown(text: string): string {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // bold first
        .replace(/\*(.*?)\*/g, '<em>$1</em>');               // then italic
}

interface AnalysisViewProps {
    game: Game;
    score?: Score;
    sport: Sport;
    injuries: Injury[];
    analysis: Analysis | null;
    analysisError: 'upgrade' | 'limit' | 'error' | null;
    loading: boolean;
    savedBets: SavedBet[];
    bettingState: string | null;
    oddsTimestamp: string | null;
    showOddsTimestamp: boolean;
    onBack: () => void;
    onSaveBet: (marketKey: MarketKey, bestBookTitle: string) => void;
}

function InjuryPanel({ injuries, homeTeam, awayTeam }: { injuries: Injury[]; homeTeam: string; awayTeam: string }) {
    const [expanded, setExpanded] = useState(false);

    if (!injuries.length) return null;

    const statusColor = (s: string) => {
        s = (s || '').toLowerCase();
        if (s.includes('out')) return '#EF4444';
        if (s.includes('doubtful')) return 'var(--orange)';
        if (s.includes('questionable')) return '#F59E0B';
        return 'var(--dim)';
    };

    // Build per-team counts for the collapsed summary
    const teamCounts: Record<string, number> = {};
    for (const inj of injuries) {
        teamCounts[inj.team] = (teamCounts[inj.team] || 0) + 1;
    }

    // Map full team names to short names (last word of team name)
    const shortName = (t: string) => t.split(' ').pop() ?? t;

    const summaryParts = Object.entries(teamCounts).map(([t, n]) => `${shortName(t)}: ${n}`).join(' · ');
    const totalLabel = `${injuries.length} injured · ${summaryParts}`;

    return (
        <div style={{ marginBottom: '16px' }}>
            <button
                onClick={() => setExpanded((v) => !v)}
                style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'none', border: 'none', padding: '0 0 8px 0', cursor: 'pointer',
                    textAlign: 'left', gap: '8px'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.58rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--orange)' }}>
                        Injury Report
                    </span>
                    <span style={{ fontSize: '0.58rem', color: 'var(--dim)', fontWeight: 700 }}>{totalLabel}</span>
                </div>
                <span style={{ fontSize: '0.6rem', color: 'var(--dim)', fontWeight: 700 }}>{expanded ? '▲' : '▼'}</span>
            </button>
            {expanded && injuries.map((inj, i) => (
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

function SharpTake({ text }: { text: string }) {
    const [expanded, setExpanded] = useState(false);
    const LIMIT = 160;
    const isTruncatable = text.length > LIMIT;

    return (
        <div style={{ marginBottom: '16px' }}>
            <div style={{
                fontSize: '0.58rem', fontWeight: 900, textTransform: 'uppercase',
                letterSpacing: '2px', color: 'var(--cobalt)', marginBottom: '8px',
                display: 'flex', alignItems: 'center', gap: '6px'
            }}>
                Sharp Take
            </div>
            <div
                className="expert-take"
                onClick={() => isTruncatable && setExpanded((v) => !v)}
                style={{ cursor: isTruncatable ? 'pointer' : 'default', marginBottom: 0 }}
            >
                <div
                    dangerouslySetInnerHTML={{
                        __html: renderMarkdown(expanded || !isTruncatable ? text : text.slice(0, LIMIT) + '…')
                    }}
                />
                {isTruncatable && (
                    <span style={{
                        display: 'inline-block', marginTop: '4px',
                        fontSize: '0.6rem', color: 'var(--cobalt)', fontWeight: 700
                    }}>
                        {expanded ? 'Show less' : 'Read more'}
                    </span>
                )}
            </div>
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

function TeamRecords({ game }: { game: Game }) {
    const [records, setRecords] = useState<{ away: string | null; home: string | null } | null>(null);

    useEffect(() => {
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
        <div className="team-records-inline">
            <div className="tri-record">
                <span className="tri-team">{game.home_team}</span>
                <span className="tri-val">{records.home ?? '—'}</span>
                <span className="tri-label">Home</span>
            </div>
            <div className="tri-vs">vs</div>
            <div className="tri-record">
                <span className="tri-team">{game.away_team}</span>
                <span className="tri-val">{records.away ?? '—'}</span>
                <span className="tri-label">Away</span>
            </div>
        </div>
    );
}

export default function AnalysisView({
    game,
    score,
    sport,
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
    const { isBookAvailable } = useSportsbookConfig();
    const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const chatWindowRef = useRef<HTMLDivElement>(null);
    const lastPlayerRef = useRef<string | null>(null);

    useEffect(() => {
        const el = chatWindowRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [chatMessages, chatLoading]);

    const savedBetIds = savedBets.map((b) => b.id);
    const title = `${game.away_team} @ ${game.home_team}`;
    const meta  = `${game.sport_title} · ${formatTime(game.commence_time)} · ${game.bookmakers?.length || 0} Books Tracked`;

    const sendChat = async () => {
        const text = chatInput.trim();
        if (!text || chatLoading) return;

        setChatMessages((prev) => [...prev, { role: 'user', text }]);
        setChatInput('');
        setChatLoading(true);

        try {
            // On-demand player splits: extract player name from query and fetch splits
            const PLAYER_ALIASES: Record<string, string> = {
                'lebron': 'LeBron James', 'lbj': 'LeBron James',
                'steph': 'Stephen Curry', 'curry': 'Stephen Curry',
                'kd': 'Kevin Durant', 'durant': 'Kevin Durant',
                'kyrie': 'Kyrie Irving', 'tatum': 'Jayson Tatum',
                'giannis': 'Giannis Antetokounmpo',
                'ant': 'Anthony Edwards', 'embiid': 'Joel Embiid',
                'jokic': 'Nikola Jokic', 'joker': 'Nikola Jokic',
                'wemby': 'Victor Wembanyama', 'wembanyama': 'Victor Wembanyama',
                'sga': 'Shai Gilgeous-Alexander', 'shai': 'Shai Gilgeous-Alexander',
                'lamelo': 'LaMelo Ball', 'luka': 'Luka Doncic', 'doncic': 'Luka Doncic',
                'brunson': 'Jalen Brunson', 'dame': 'Damian Lillard', 'lillard': 'Damian Lillard',
                'sabonis': 'Domantas Sabonis', 'lauri': 'Lauri Markkanen',
                // NFL
                'mahomes': 'Patrick Mahomes', 'lamar': 'Lamar Jackson', 'hurts': 'Jalen Hurts',
                'burrow': 'Joe Burrow', 'purdy': 'Brock Purdy', 'allen': 'Josh Allen',
                'cmc': 'Christian McCaffrey', 'kelce': 'Travis Kelce', 'diggs': 'Stefon Diggs',
                'tyreek': 'Tyreek Hill', 'hill': 'Tyreek Hill', 'davante': 'Davante Adams',
                // NHL
                'mcdavid': 'Connor McDavid', 'ovechkin': 'Alex Ovechkin', 'ovi': 'Alex Ovechkin',
                'draisaitl': 'Leon Draisaitl', 'matthews': 'Auston Matthews',
                'mackinnon': 'Nathan MacKinnon', 'hedman': 'Victor Hedman',
                'crosby': 'Sidney Crosby', 'sid': 'Sidney Crosby',
                // MLB
                'ohtani': 'Shohei Ohtani', 'trout': 'Mike Trout', 'betts': 'Mookie Betts',
                'judge': 'Aaron Judge', 'acuna': 'Ronald Acuna Jr.', 'devers': 'Rafael Devers',
                'soto': 'Juan Soto', 'vlad': 'Vladimir Guerrero Jr.',
                // NCAAB
                'reed': 'Cooper Flagg', 'flagg': 'Cooper Flagg',
                'boozer': 'Cameron Boozer', 'bynum': 'Tre Johnson',
            };

            let playerSplits = null;
            // 1. Try capitalized name match ("LeBron James", "Anthony Davis", "LeBron")
            const nameMatch = text.match(/\b([A-Z][a-z]*[A-Z][a-zA-Z']*(?:\s+[A-Z][a-zA-Z']+)?|[A-Z][a-zA-Z']+\s+[A-Z][a-zA-Z']+)\b/);
            let queryName: string | null = nameMatch?.[1] ?? null;
            // 2. Fallback: scan words for alias/nickname ("lebron", "steph", "kd")
            if (!queryName) {
                const words = text.toLowerCase().split(/\W+/);
                for (const word of words) {
                    if (PLAYER_ALIASES[word]) { queryName = PLAYER_ALIASES[word]; break; }
                }
            }
            // 3. Pronoun fallback: reuse last mentioned player
            if (!queryName && /\b(he|him|his|she|her|they|them)\b/i.test(text)) {
                queryName = lastPlayerRef.current;
            }
            if (queryName) lastPlayerRef.current = queryName;

            if (queryName) {
                try {
                    const splitsRes = await fetch(`/api/player-splits?name=${encodeURIComponent(queryName)}&sport=${sport}`);
                    if (splitsRes.ok) {
                        const splitsData = await splitsRes.json();
                        playerSplits = splitsData.splits || null;
                    }
                } catch { /* continue without splits */ }
            }

            const res = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    game: {
                        away_team: game.away_team,
                        home_team: game.home_team,
                        sport_title: game.sport_title,
                    },
                    oddsData: game.bookmakers.filter((b) => isBookAvailable(b.key, bettingState)),
                    bettingState,
                    injuryData: injuries,
                    userQuery: text,
                    chatHistory: chatMessages,
                    playerSplits,
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

            {/* Breadcrumb */}
            <div className="analysis-breadcrumb">
                <button className="breadcrumb-back" onClick={onBack}>
                    <span className="breadcrumb-sep">←</span>
                    <span className="breadcrumb-games">Games</span>
                    <span className="breadcrumb-sep">/</span>
                    <span className="breadcrumb-current">{title}</span>
                </button>
            </div>

            {/* Game header + Logo */}
            <div className="game-header" style={{ alignItems: 'flex-end' }}>
                <div>
                    <div className="game-header-teams">{title}</div>
                    <div className="game-header-meta">{meta}</div>
                </div>
                <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0 }}>
                    <img src="/logo.png" alt="FadeOdds" style={{ display: 'block', height: '100px', width: 'auto' }} />
                </button>
            </div>

            {/* Odds Matrix — full width */}
            <div style={{ marginBottom: '20px' }}>
                <div className="section-chip">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M3 3h18v4H3zM3 10h18v4H3zM3 17h18v4H3z" />
                    </svg>
                    Live Odds · {game.bookmakers?.length || 0} Books
                </div>
                <OddsPanel
                    game={game}
                    score={score}
                    savedBetIds={savedBetIds}
                    bettingState={bettingState}
                    oddsTimestamp={oddsTimestamp}
                    showOddsTimestamp={showOddsTimestamp}
                    onSaveBet={onSaveBet}
                />
            </div>

            {/* Neural Intelligence — full-width rectangle */}
            <div className="neural-panel">
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
                        {analysis?.recommendation && (
                            <div className="rec-box">
                                <div>
                                    <div className="rec-label">Top Recommendation</div>
                                    <div
                                        className="rec-val"
                                        dangerouslySetInnerHTML={{ __html: renderMarkdown(analysis.recommendation) }}
                                    />
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div className="rec-label">Edge</div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--dim)', fontWeight: 700, marginTop: '4px' }}>
                                        {analysis.edge}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="intel-tiles intel-tiles-wide">
                            {analysis?.tiles.map((tile, i) => (
                                <div key={i} className={`intel-tile ${i % 2 === 0 ? 'hl' : ''}`}>
                                    <div className="intel-tile-label">{tile.label}</div>
                                    <div className="intel-tile-val">{tile.val}</div>
                                </div>
                            ))}
                        </div>

                        {analysis?.expertTake && <SharpTake text={analysis.expertTake} />}

                        <InjuryPanel injuries={injuries} homeTeam={game.home_team} awayTeam={game.away_team} />
                    </>
                )}

                {/* Chat */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    <span style={{ fontSize: '0.58rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text)' }}>
                        Ask a Follow-up
                    </span>
                </div>
                <div className="chat-window" ref={chatWindowRef}>
                    {chatMessages.map((msg, i) => (
                        msg.role === 'ai' ? (
                            <div
                                key={i}
                                className="msg msg-ai"
                                dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }}
                            />
                        ) : (
                            <div key={i} className="msg msg-user">{msg.text}</div>
                        )
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

        </div>
    );
}
