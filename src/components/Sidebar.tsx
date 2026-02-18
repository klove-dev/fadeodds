'use client';

import { SavedBet, Tier } from '@/types';
import { formatTime } from '@/lib/utils';
import { useState } from 'react';

const TIER_LABELS: Record<Tier, string> = {
    free: 'Free',
    go: 'Go',
    plus: 'Plus',
    pro: 'Pro',
};

const TIER_BADGES: Record<Tier, string> = {
    free: 'Click to Upgrade',
    go: 'Go Member',
    plus: 'Plus Member',
    pro: 'Pro Member',
};

interface SidebarProps {
    isOpen: boolean;
    tier: Tier;
    savedBets: SavedBet[];
    sessionHistory: { title: string; sport: string }[];
    oddsCredits: string | null;
    onClose: () => void;
    onSelectHistory: (title: string) => void;
    onRemoveBet: (id: string) => void;
    onOpenAccount: () => void;
    onOpenPricing: () => void;
    onSetTier: (tier: Tier) => void;
}

function isActiveBet(bet: SavedBet): boolean {
    return new Date(bet.commenceTime).getTime() + 4 * 60 * 60 * 1000 > Date.now();
}

export default function Sidebar({
    isOpen,
    tier,
    savedBets,
    sessionHistory,
    oddsCredits,
    onClose,
    onSelectHistory,
    onRemoveBet,
    onOpenAccount,
    onOpenPricing,
    onSetTier,
}: SidebarProps) {
    const [activeTab, setActiveTab] = useState<'tracker' | 'history'>('tracker');
    const [betFilter, setBetFilter] = useState<'active' | 'archived'>('active');
    const [protoOpen, setProtoOpen] = useState(false);

    const filteredBets = savedBets.filter((b) =>
        betFilter === 'active' ? isActiveBet(b) : !isActiveBet(b)
    );

    return (
        <>
            <div
                className={`sidebar-overlay ${isOpen ? 'active' : ''}`}
                onClick={onClose}
            />
            <aside className={`sidebar-tray ${isOpen ? 'open' : ''}`}>

                <div className="sidebar-head">
                    <div className="sidebar-logo">
                        FADE<span style={{ color: 'var(--green)' }}>ODDS</span>
                    </div>
                </div>

                <div className="sidebar-tabs">
                    <div
                        className={`sidebar-tab ${activeTab === 'tracker' ? 'active' : ''}`}
                        onClick={() => setActiveTab('tracker')}
                    >
                        Bet Tracker
                    </div>
                    <div
                        className={`sidebar-tab ${activeTab === 'history' ? 'active' : ''}`}
                        onClick={() => setActiveTab('history')}
                    >
                        History
                    </div>
                </div>

                <div className="sidebar-body">

                    {activeTab === 'tracker' && (
                        <div>
                            <div className="bet-filter-row">
                                <div
                                    className={`bet-filter ${betFilter === 'active' ? 'active' : ''}`}
                                    onClick={() => setBetFilter('active')}
                                >
                                    Active
                                </div>
                                <div
                                    className={`bet-filter ${betFilter === 'archived' ? 'active' : ''}`}
                                    onClick={() => setBetFilter('archived')}
                                >
                                    Archived
                                </div>
                            </div>

                            {filteredBets.length === 0 ? (
                                <div style={{ fontSize: '0.7rem', color: 'var(--dim)', textAlign: 'center', padding: '30px 0', lineHeight: 1.7 }}>
                                    {betFilter === 'active'
                                        ? 'No active bets saved.\nStar a book line while analyzing a game.'
                                        : 'No archived bets yet.'}
                                </div>
                            ) : (
                                filteredBets.map((bet) => (
                                    <div key={bet.id} className="bet-item">
                                        <div className="bet-item-top">
                                            <div className="bet-item-book">★ {bet.bookName}</div>
                                            <button className="bet-item-remove" onClick={() => onRemoveBet(bet.id)}>✕</button>
                                        </div>
                                        <div className="bet-item-game">{bet.awayTeam} @ {bet.homeTeam}</div>
                                        <div className="bet-item-time">
                                            {formatTime(bet.commenceTime)} · {bet.sport}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div>
                            <div style={{ fontSize: '0.58rem', color: 'var(--dim)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '14px' }}>
                                Session History
                            </div>
                            {sessionHistory.length === 0 ? (
                                <div style={{ fontSize: '0.72rem', color: 'var(--dim)' }}>No history yet</div>
                            ) : (
                                sessionHistory.slice(0, 8).map((h, i) => (
                                    <div
                                        key={i}
                                        className="history-item"
                                        onClick={() => { onSelectHistory(h.title); onClose(); }}
                                    >
                                        <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>{h.title}</div>
                                        <div style={{ fontSize: '0.56rem', color: 'var(--dim)', marginTop: '4px', textTransform: 'uppercase' }}>
                                            {h.sport} · Analyzed
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                <div className="proto-section">
                    <div className="proto-toggle" onClick={() => setProtoOpen(!protoOpen)}>
                        <div className="proto-toggle-label">Prototype Settings</div>
                        <span className={`proto-chevron ${protoOpen ? 'open' : ''}`}>▼</span>
                    </div>
                    <div className={`proto-body ${protoOpen ? 'open' : ''}`}>
                        <div className="proto-credit">
                            <div>
                                <div className="proto-credit-label">Odds API Credits</div>
                                <div className="proto-credit-val">{oddsCredits || '-'}</div>
                            </div>
                        </div>
                        <div className="proto-tier-label">Simulate Tier</div>
                        <div className="proto-tier-grid">
                            {(['free', 'go', 'plus', 'pro'] as Tier[]).map((t) => (
                                <button
                                    key={t}
                                    className={`proto-tier-btn ${tier === t ? 'active' : ''}`}
                                    onClick={() => onSetTier(t)}
                                >
                                    {TIER_LABELS[t]} {tier === t ? '✓' : ''}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="sidebar-footer">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="avatar" onClick={onOpenAccount}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                            <div className="status-dot" />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 900 }}>{TIER_LABELS[tier]}</div>
                            <div
                                style={{ fontSize: '0.6rem', color: 'var(--gold)', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer' }}
                                onClick={onOpenPricing}
                            >
                                {TIER_BADGES[tier]}
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}