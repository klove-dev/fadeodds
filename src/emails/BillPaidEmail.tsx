import { Button, Section, Text } from '@react-email/components';
import { EmailLayout } from './EmailLayout';

interface BillPaidEmailProps {
    firstName?: string;
    amount: string;
    planName: string;
    nextBillingDate: string;
    receiptUrl: string;
}

export function BillPaidEmail({
    firstName,
    amount,
    planName,
    nextBillingDate,
    receiptUrl,
}: BillPaidEmailProps) {
    const name = firstName ?? 'there';

    return (
        <EmailLayout preview={`Payment confirmed — $${amount} for ${planName}. You're locked in.`}>
            <Text style={heading}>Paid. You're Locked In.</Text>
            <Text style={body}>
                Hey {name} — payment confirmed. You're all set for another month of sharp picks.
            </Text>

            <Section style={receiptBox}>
                <Text style={receiptRow}>
                    <span style={receiptLabel}>Plan</span>
                    <span style={receiptValue}>{planName}</span>
                </Text>
                <Text style={receiptRow}>
                    <span style={receiptLabel}>Amount Charged</span>
                    <span style={receiptValue}>${amount}</span>
                </Text>
                <Text style={receiptRow}>
                    <span style={receiptLabel}>Next Billing Date</span>
                    <span style={receiptValue}>{nextBillingDate}</span>
                </Text>
            </Section>

            <Section style={ctaSection}>
                <Button href={receiptUrl} style={button}>
                    View Receipt →
                </Button>
            </Section>

            <Text style={closing}>
                Now stop checking your email and go fade some lines.
            </Text>
            <Text style={sig}>— The FadeOdds Crew</Text>
        </EmailLayout>
    );
}

export default BillPaidEmail;

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

const receiptBox: React.CSSProperties = {
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '6px',
    margin: '20px 0',
    padding: '16px 20px',
};

const receiptRow: React.CSSProperties = {
    color: '#374151',
    display: 'flex',
    fontSize: '14px',
    justifyContent: 'space-between',
    margin: '0 0 8px',
};

const receiptLabel: React.CSSProperties = {
    color: '#6b7280',
};

const receiptValue: React.CSSProperties = {
    color: '#16a34a',
    fontWeight: '600',
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
