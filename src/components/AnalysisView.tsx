'use client';

import { useState } from 'react';
import { Game, Injury, Analysis, SavedBet } from '@/types';
import { formatTime } from '@/lib/utils';
import OddsPanel from './OddsPanel';

interface AnalysisViewProps {
    game: Game;
    injuries: Injury[];
    analysis: Analysis | null;
    loading: boolean;
    savedBets: SavedBet[];
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

export default function AnalysisView({
    game,
    injuries,
    analysis,
    loading,
    savedBets,
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
            <div className="game-header">
                <div>
                    <div className="game-header-teams">{title}</div>
                    <div className="game-header-meta">{meta}</div>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {analysis?.confidence && (
                        <div className="conf-badge">{analysis.confidence}% Confidence</div>
                    )}
                    <button className="back-btn" onClick={onBack}>← Back to Games</button>
                </div>
            </div>

            <div className="analysis-grid">
                <div className="intel-panel">
                    <div className="panel-title">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                        </svg>
                        Neural Intelligence
                    </div>

                    {loading ? (
                        <AnalysisLoading />
                    ) : (
                        <>
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
                    onSaveBet={onSaveBet}
                />
            </div>
        </div>
    );
}