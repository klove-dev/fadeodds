import { Button, Section, Text } from '@react-email/components';
import { EmailLayout } from './EmailLayout';

interface AccountClosureEmailProps {
    firstName?: string;
    accessEndsDate: string;
    reactivateUrl: string;
}

export function AccountClosureEmail({
    firstName,
    accessEndsDate,
    reactivateUrl,
}: AccountClosureEmailProps) {
    const name = firstName ?? 'there';

    return (
        <EmailLayout preview="Account closed. It was real — door's always open.">
            <Text style={heading}>Sad to See You Go.</Text>
            <Text style={body}>
                Hey {name} — your FadeOdds account has been closed. We hope we put some W's
                in your pocket while you were here.
            </Text>

            <Section style={infoBox}>
                <Text style={infoRow}>
                    <span style={infoLabel}>Account Status</span>
                    <span style={statusValue}>Closed</span>
                </Text>
                <Text style={infoRow}>
                    <span style={infoLabel}>Access Ends</span>
                    <span style={infoValue}>{accessEndsDate}</span>
                </Text>
            </Section>

            <Text style={body}>
                Your saved bets and preferences will be held for 30 days in case you change
                your mind. After that, it's gone for good.
            </Text>

            <Text style={body}>
                If this was a mistake or you're ready to get back in the game, you can
                reactivate anytime.
            </Text>

            <Section style={ctaSection}>
                <Button href={reactivateUrl} style={button}>
                    Come Back →
                </Button>
            </Section>

            <Text style={closing}>
                Good luck out there. And if the lines ever look too juicy to ignore,
                you know where to find us.
            </Text>
            <Text style={sig}>— The FadeOdds Crew</Text>
        </EmailLayout>
    );
}

export default AccountClosureEmail;

// ─── Styles ────────────────────────────────────────────────────────────────

const heading: React.CSSProperties = {
    color: '#111827',
    fontSize: '24px',
    fontWeight: '700',
    letterSpacing: '-0.02em',
    margin: '0 0 20px',
};

const body: React.CSSProperties = {
    color: '#374151',
    fontSize: '15px',
    lineHeight: '1.6',
    margin: '0 0 14px',
};

const infoBox: React.CSSProperties = {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    margin: '20px 0',
    padding: '16px 20px',
};

const infoRow: React.CSSProperties = {
    color: '#374151',
    display: 'flex',
    fontSize: '14px',
    justifyContent: 'space-between',
    margin: '0 0 8px',
};

const infoLabel: React.CSSProperties = {
    color: '#6b7280',
};

const infoValue: React.CSSProperties = {
    color: '#111827',
    fontWeight: '600',
};

const statusValue: React.CSSProperties = {
    color: '#dc2626',
    fontWeight: '700',
};

const ctaSection: React.CSSProperties = {
    margin: '24px 0',
};

const button: React.CSSProperties = {
    backgroundColor: '#2563eb',
    borderRadius: '6px',
    color: '#ffffff',
    display: 'inline-block',
    fontSize: '14px',
    fontWeight: '600',
    padding: '12px 24px',
    textDecoration: 'none',
};

const closing: React.CSSProperties = {
    color: '#6b7280',
    fontSize: '14px',
    margin: '24px 0 4px',
};

const sig: React.CSSProperties = {
    color: '#9ca3af',
    fontSize: '13px',
    margin: '0',
};
