'use client';

import { useState, useRef, type KeyboardEvent } from 'react';

const SUGGESTIONS = [
    'Best underdog tonight?',
    'Best over/under value?',
    'Biggest favorite tonight?',
    'Safest spread bet?',
    'Highest payout potential?',
];

interface ParsedSegment {
    type: 'text' | 'game';
    content: string;
    gameId?: string;
    sportKey?: string;
    label?: string;
}

function parseResponse(text: string): ParsedSegment[] {
    const segments: ParsedSegment[] = [];
    const regex = /\[\[GAME:([^:]+):([^|]+)\|([^\]]+)\]\]/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            segments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
        }
        segments.push({
            type: 'game',
            content: match[0],
            gameId: match[1],
            sportKey: match[2],
            label: match[3],
        });
        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
        segments.push({ type: 'text', content: text.slice(lastIndex) });
    }

    return segments;
}

interface AskBarProps {
    onSelectGame: (gameId: string, sportKey: string) => void;
}

export default function AskBar({ onSelectGame }: AskBarProps) {
    const [query, setQuery] = useState('');
    const [response, setResponse] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeQuery, setActiveQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const submit = async (q: string) => {
        const trimmed = q.trim();
        if (!trimmed || loading) return;
        setActiveQuery(trimmed);
        setQuery('');
        setLoading(true);
        setResponse(null);

        try {
            const res = await fetch('/api/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: trimmed }),
            });
            const data = await res.json();
            setResponse(data.text || 'No answer available right now.');
        } catch {
            setResponse('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') submit(query);
    };

    const handleSuggestion = (s: string) => {
        submit(s);
        inputRef.current?.blur();
    };

    const segments = response ? parseResponse(response) : [];

    return (
        <div className="ask-bar-wrap">
            <div className="ask-bar-card">
                {/* Top gradient bar */}
                <div className="ask-bar-glow" />

                {/* Label */}
                <div className="ask-bar-eyebrow">
                    <span className="ask-bar-ai-dot" />
                    Neural Intelligence
                </div>

                {/* Input row */}
                <div className="ask-bar-input-row">
                    <input
                        ref={inputRef}
                        className="ask-bar-input"
                        type="text"
                        placeholder="Ask about tonight's games…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={loading}
                    />
                    <button
                        className="ask-bar-submit"
                        onClick={() => submit(query)}
                        disabled={loading || !query.trim()}
                    >
                        Ask
                    </button>
                </div>

                {/* Suggestion chips */}
                {!loading && !response && (
                    <div className="ask-suggestions">
                        {SUGGESTIONS.map((s) => (
                            <button
                                key={s}
                                className="ask-suggestion"
                                onClick={() => handleSuggestion(s)}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                )}

                {/* Loading state */}
                {loading && (
                    <div className="ask-loading">
                        <div className="ask-loading-label">Analyzing {SUGGESTIONS.length > 0 ? 'the lines' : ''}…</div>
                        <div className="ask-loading-dots">
                            <span className="ask-loading-dot" />
                            <span className="ask-loading-dot" />
                            <span className="ask-loading-dot" />
                        </div>
                    </div>
                )}

                {/* Response */}
                {response && !loading && (
                    <div className="ask-response">
                        <div className="ask-response-query">"{activeQuery}"</div>
                        <p className="ask-response-text">
                            {segments.map((seg, i) =>
                                seg.type === 'game' ? (
                                    <button
                                        key={i}
                                        className="ask-game-link"
                                        onClick={() => onSelectGame(seg.gameId!, seg.sportKey!)}
                                    >
                                        {seg.label}
                                    </button>
                                ) : (
                                    <span key={i}>{seg.content}</span>
                                )
                            )}
                        </p>
                        <button
                            className="ask-reset"
                            onClick={() => {
                                setResponse(null);
                                setActiveQuery('');
                                setTimeout(() => inputRef.current?.focus(), 50);
                            }}
                        >
                            Ask another question
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
