'use client';

import { useState, useMemo } from 'react';
import { teamLogoUrl, type TeamDef } from '@/lib/teams';

interface MyTeamsWizardProps {
    allTeams: TeamDef[];
    savedTeamIds: string[];
    onConfirm: (teams: TeamDef[]) => void;
    onClose: () => void;
}

export default function MyTeamsWizard({ allTeams, savedTeamIds, onConfirm, onClose }: MyTeamsWizardProps) {
    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState<Set<string>>(new Set(savedTeamIds));

    const results = useMemo(() => {
        const q = query.toLowerCase().trim();
        if (!q) return allTeams.slice(0, 60);
        return allTeams.filter((t) =>
            t.name.toLowerCase().includes(q) ||
            t.city.toLowerCase().includes(q) ||
            t.mascot.toLowerCase().includes(q)
        );
    }, [query, allTeams]);

    const selectedTeams = useMemo(
        () => allTeams.filter((t) => selected.has(t.id)),
        [selected, allTeams]
    );

    const toggle = (id: string) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const leagueColor: Record<string, string> = {
        NBA: '#1d428a',
        NFL: '#013369',
        NHL: '#000',
        MLB: '#e81828',
        NCAAB: '#ff6b00',
    };

    return (
        <div className="modal-overlay open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="modal-box wizard-modal">
                <button className="modal-close" onClick={onClose}>✕</button>

                <div className="wizard-header">
                    <div className="wizard-title">MY TEAMS</div>
                    <div className="wizard-sub">Follow your teams — we'll surface their games first</div>
                </div>

                <div className="wizard-body">
                    <input
                        className="wizard-search"
                        type="text"
                        placeholder="Search any team, city, or mascot..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                    />

                    <div className="wizard-results">
                        {results.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--dim)', fontSize: '0.78rem' }}>
                                No teams found for &ldquo;{query}&rdquo;
                            </div>
                        ) : (
                            results.map((team) => {
                                const isSelected = selected.has(team.id);
                                return (
                                    <div key={team.id} className="wizard-team-row">
                                        <TeamLogo team={team} />
                                        <div className="wizard-team-info">
                                            <div className="wizard-team-name">{team.name}</div>
                                            <span
                                                className="wizard-league-tag"
                                                style={{ background: leagueColor[team.league] ?? 'var(--border-strong)' }}
                                            >
                                                {team.league}
                                            </span>
                                        </div>
                                        <button
                                            className={`wizard-add-btn ${isSelected ? 'selected' : ''}`}
                                            onClick={() => toggle(team.id)}
                                        >
                                            {isSelected ? '✓ Added' : '+ Add'}
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="wizard-footer">
                    {selectedTeams.length > 0 && (
                        <div className="wizard-selected-chips">
                            {selectedTeams.map((t) => (
                                <span key={t.id} className="wizard-chip" onClick={() => toggle(t.id)}>
                                    {t.mascot} ✕
                                </span>
                            ))}
                        </div>
                    )}
                    <button
                        className="wizard-confirm-btn"
                        disabled={selectedTeams.length === 0}
                        onClick={() => onConfirm(selectedTeams)}
                    >
                        {selectedTeams.length === 0
                            ? 'Select at least one team'
                            : `Confirm ${selectedTeams.length} Team${selectedTeams.length !== 1 ? 's' : ''}`}
                    </button>
                </div>
            </div>
        </div>
    );
}

function TeamLogo({ team }: { team: TeamDef }) {
    const [errored, setErrored] = useState(false);

    if (errored) {
        return (
            <div className="wizard-logo-fallback">
                <span style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--dim)' }}>
                    {team.league}
                </span>
            </div>
        );
    }

    return (
        <img
            className="wizard-logo"
            src={teamLogoUrl(team)}
            alt={team.name}
            onError={() => setErrored(true)}
        />
    );
}