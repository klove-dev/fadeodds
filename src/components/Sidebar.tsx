'use client';

import { useState } from 'react';
import { SavedBet } from '@/types';
import { formatTime } from '@/lib/utils';
import { LEGAL_BETTING_STATES } from '@/lib/sportsbooks';

interface SidebarProps {
    isOpen: boolean;
    savedBets: SavedBet[];
    sessionHistory: { title: string; sport: string }[];
    oddsCredits: string | null;
    theme: 'light' | 'dark';
    bettingState: string | null;
    showOddsTimestamp: boolean;
    onClose: () => void;
    onSelectHistory: (title: string) => void;
    onRemoveBet: (id: string) => void;
    onOpenAccount: () => void;
    onOpenPricing: () => void;
    onToggleTheme: () => void;
    onBettingStateChange: (state: string | null) => void;
    onToggleOddsTimestamp: () => void;
}

function isActiveBet(bet: SavedBet): boolean {
    return new Date(bet.commenceTime).getTime() + 4 * 60 * 60 * 1000 > Date.now();
}

export default function Sidebar({
    isOpen,
    savedBets,
    sessionHistory,
    oddsCredits,
    theme,
    bettingState,
    showOddsTimestamp,
    onClose,
    onSelectHistory,
    onRemoveBet,
    onOpenAccount,
    onOpenPricing,
    onToggleTheme,
    onBettingStateChange,
    onToggleOddsTimestamp,
}: SidebarProps) {
    const [activeTab, setActiveTab] = useState<'tracker' | 'history' | 'settings'>('tracker');
    const [betFilter, setBetFilter] = useState<'active' | 'archived'>('active');

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
                    <div
                        className={`sidebar-tab ${activeTab === 'settings' ? 'active' : ''}`}
                        onClick={() => setActiveTab('settings')}
                    >
                        Settings
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
                                        ? 'No active bets saved. Star a book line while analyzing a game.'
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

                    {activeTab === 'settings' && (
                        <div>
                            <div className="settings-section">
                                <div className="settings-label">Appearance</div>
                                <div className="settings-toggle-row">
                                    <span className="settings-toggle-label">Dark mode</span>
                                    <button
                                        className={`settings-toggle ${theme === 'dark' ? 'on' : ''}`}
                                        onClick={onToggleTheme}
                                        aria-label="Toggle dark mode"
                                    >
                                        <span className="settings-toggle-knob" />
                                    </button>
                                </div>
                            </div>

                            <div className="settings-section" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                                <div className="settings-label">Betting State</div>
                                <div className="settings-sub">
                                    We&apos;ll only show sportsbooks legal in your state and link you directly to their site.
                                </div>
                                <select
                                    className="settings-state-select"
                                    value={bettingState ?? ''}
                                    onChange={(e) => onBettingStateChange(e.target.value || null)}
                                >
                                    <option value="">— Select your state —</option>
                                    {LEGAL_BETTING_STATES.map((s) => (
                                        <option key={s.abbr} value={s.abbr}>{s.name} ({s.abbr})</option>
                                    ))}
                                </select>
                                {bettingState && (
                                    <button
                                        className="settings-clear-btn"
                                        onClick={() => onBettingStateChange(null)}
                                    >
                                        Clear state
                                    </button>
                                )}
                            </div>

                            <div className="settings-section" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                                <div className="settings-label">Dev Options</div>

                                <div className="settings-toggle-row">
                                    <span className="settings-toggle-label">Show odds timestamp</span>
                                    <button
                                        className={`settings-toggle ${showOddsTimestamp ? 'on' : ''}`}
                                        onClick={onToggleOddsTimestamp}
                                        aria-label="Toggle odds timestamp"
                                    >
                                        <span className="settings-toggle-knob" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
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
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 900 }}>Account</div>
                            <div
                                style={{ fontSize: '0.6rem', color: 'var(--gold)', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer' }}
                                onClick={onOpenPricing}
                            >
                                View Plans
                            </div>
                        </div>
                    </div>
                    {oddsCredits && (
                        <div style={{ marginTop: '10px', fontSize: '0.56rem', color: 'var(--dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {oddsCredits} Odds API credits left
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
}
