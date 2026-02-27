'use client';

import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { Game } from '@/types';
import { shortName, formatTime } from '@/lib/utils';

interface HeaderProps {
    games: Game[];
    onMenuClick: () => void;
    onSelectGame: (gameId: string) => void;
}

export default function Header({ games, onMenuClick, onSelectGame }: HeaderProps) {

    const tickerGames = games.slice(0, 8).map((g) => {
        const book = g.bookmakers?.[0];
        const spreads = book?.markets?.find((m) => m.key === 'spreads');
        const fav = spreads?.outcomes?.find((o) => o.point && o.point < 0);
        const line = fav ? ` (${shortName(fav.name)} ${fav.point})` : '';
        return { id: g.id, label: `${g.away_team} @ ${g.home_team}${line} · ${formatTime(g.commence_time)}` };
    });

    const allItems = [...tickerGames, ...tickerGames];

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
                        <button key={i} className="ticker-item ticker-item-btn" onClick={() => onSelectGame(item.id)}>
                            {item.label}
                        </button>
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