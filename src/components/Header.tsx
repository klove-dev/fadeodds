'use client';

import { useState, useEffect } from 'react';
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { Game } from '@/types';
import { shortName, formatTime } from '@/lib/utils';

interface HeaderProps {
    games: Game[];
    onMenuClick: () => void;
}

function useTheme() {
    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    useEffect(() => {
        const stored = localStorage.getItem('fadeodds-theme') as 'light' | 'dark' | null;
        if (stored) setTheme(stored);
    }, []);

    const toggle = () => {
        const next = theme === 'light' ? 'dark' : 'light';
        setTheme(next);
        localStorage.setItem('fadeodds-theme', next);
        document.documentElement.setAttribute('data-theme', next);
    };

    return { theme, toggle };
}

export default function Header({ games, onMenuClick }: HeaderProps) {
    const { theme, toggle } = useTheme();

    const tickerItems = games.slice(0, 8).map((g) => {
        const book = g.bookmakers?.[0];
        const spreads = book?.markets?.find((m) => m.key === 'spreads');
        const fav = spreads?.outcomes?.find((o) => o.point && o.point < 0);
        const line = fav ? ` (${shortName(fav.name)} ${fav.point})` : '';
        return `${g.away_team} @ ${g.home_team}${line} · ${formatTime(g.commence_time)}`;
    });

    const allItems = [...tickerItems, ...tickerItems];

    return (
        <header className="fixed-header">
            <button className="hamburger-btn" onClick={onMenuClick}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
            </button>
            <div className="ticker-wrap">
                <div className="ticker">
                    {allItems.length > 0 ? allItems.map((item, i) => (
                        <div key={i} className="ticker-item">{item}</div>
                    )) : (
                        <>
                            <div className="ticker-item">FADEODDS AI <span className="t-green">LIVE</span></div>
                            <div className="ticker-item">NBA · NCAAB · NFL · NHL · MLB <span className="t-gold">ALL SPORTS</span></div>
                            <div className="ticker-item">REAL-TIME ODDS · AI ANALYSIS <span className="t-green">ACTIVE</span></div>
                            <div className="ticker-item">ALWAYS GAMBLE RESPONSIBLY <span className="t-gold">21+</span></div>
                        </>
                    )}
                </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, marginLeft: '16px' }}>
                <button className="theme-toggle" onClick={toggle} aria-label="Toggle theme">
                    {theme === 'light' ? (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                        </svg>
                    ) : (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="5" />
                            <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                            <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                        </svg>
                    )}
                </button>
                <SignedOut>
                    <SignInButton mode="modal">
                        <button style={{
                            background: 'var(--cobalt)', color: '#fff',
                            border: 'none', borderRadius: '8px',
                            padding: '7px 14px', fontWeight: 900,
                            fontSize: '0.7rem', textTransform: 'uppercase',
                            letterSpacing: '0.5px', cursor: 'pointer'
                        }}>
                            Sign In
                        </button>
                    </SignInButton>
                </SignedOut>
                <SignedIn>
                    <UserButton afterSignOutUrl="/" />
                </SignedIn>
            </div>
        </header>
    );
}