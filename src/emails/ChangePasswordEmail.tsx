import { Button, Section, Text } from '@react-email/components';
import { EmailLayout } from './EmailLayout';

interface ChangePasswordEmailProps {
    firstName?: string;
    changedAt: string;
    supportUrl: string;
}

export function ChangePasswordEmail({
    firstName,
    changedAt,
    supportUrl,
}: ChangePasswordEmailProps) {
    const name = firstName ?? 'there';

    return (
        <EmailLayout preview="Your FadeOdds password was just changed — if that wasn't you, act now.">
            <Text style={heading}>Your Password Was Changed.</Text>
            <Text style={body}>
                Hey {name} — someone just updated the password on your FadeOdds account.
            </Text>

            <Section style={alertBox}>
                <Text style={alertRow}>
                    <span style={alertLabel}>Changed At</span>
                    <span style={alertValue}>{changedAt}</span>
                </Text>
            </Section>

            <Text style={body}>
                <strong style={strong}>If that was you</strong> — you're all good. Nothing
                else to do here.
            </Text>

            <Text style={bodyWarning}>
                <strong style={strong}>If that wasn't you</strong> — your account may be
                compromised. Contact us immediately.
            </Text>

            <Section style={ctaSection}>
                <Button href={supportUrl} style={button}>
                    Contact Support →
                </Button>
            </Section>

            <Text style={closing}>
                We take account security seriously. If anything looks off, don't wait —
                reach out at{' '}
                <a href="mailto:support@fadeodds.com" style={link}>support@fadeodds.com</a>.
            </Text>
        </EmailLayout>
    );
}

export default ChangePasswordEmail;

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

const bodyWarning: React.CSSProperties = {
    color: '#b91c1c',
    fontSize: '15px',
    lineHeight: '1.6',
    margin: '0 0 14px',
};

const alertBox: React.CSSProperties = {
    backgroundColor: '#fffbeb',
    border: '1px solid #fde68a',
    borderRadius: '6px',
    margin: '20px 0',
    padding: '16px 20px',
};

const alertRow: React.CSSProperties = {
    color: '#374151',
    display: 'flex',
    fontSize: '14px',
    justifyContent: 'space-between',
    margin: '0',
};

const alertLabel: React.CSSProperties = {
    color: '#6b7280',
};

const alertValue: React.CSSProperties = {
    color: '#d97706',
    fontWeight: '600',
};

const strong: React.CSSProperties = {
    color: '#111827',
};

const ctaSection: React.CSSProperties = {
    margin: '24px 0',
};

const button: React.CSSProperties = {
    backgroundColor: '#dc2626',
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
    fontSize: '13px',
    margin: '8px 0 0',
};

const link: React.CSSProperties = {
    color: '#2563eb',
    textDecoration: 'none',
};
