'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { LEGAL_BETTING_STATES, STATE_BOOKS } from '@/lib/sportsbooks';

interface SportsbookContextValue {
    bettingStates: { abbr: string; name: string }[];
    isBookAvailable: (bookKey: string, state: string | null) => boolean;
}

const SportsbookContext = createContext<SportsbookContextValue>({
    bettingStates: LEGAL_BETTING_STATES,
    isBookAvailable: (bookKey, state) => {
        if (!state) return true;
        const available = STATE_BOOKS[state];
        return available ? available.includes(bookKey) : true;
    },
});

export function SportsbookProvider({ children }: { children: React.ReactNode }) {
    const [stateBooks, setStateBooks] = useState<Record<string, string[]>>(STATE_BOOKS);
    const [bettingStates, setBettingStates] = useState(LEGAL_BETTING_STATES);

    useEffect(() => {
        fetch('/api/sportsbooks')
            .then((r) => r.json())
            .then((data) => {
                if (data.bettingStates) setBettingStates(data.bettingStates);
                if (data.stateBooks) setStateBooks(data.stateBooks);
            })
            .catch(() => null);
    }, []);

    function isBookAvailable(bookKey: string, state: string | null): boolean {
        if (!state) return true;
        const available = stateBooks[state];
        return available ? available.includes(bookKey) : true;
    }

    return (
        <SportsbookContext.Provider value={{ bettingStates, isBookAvailable }}>
            {children}
        </SportsbookContext.Provider>
    );
}

export function useSportsbookConfig() {
    return useContext(SportsbookContext);
}
