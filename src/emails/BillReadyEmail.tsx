import { Button, Section, Text } from '@react-email/components';
import { EmailLayout } from './EmailLayout';

interface BillReadyEmailProps {
    firstName?: string;
    amount: string;
    planName: string;
    dueDate: string;
    invoiceUrl: string;
}

export function BillReadyEmail({
    firstName,
    amount,
    planName,
    dueDate,
    invoiceUrl,
}: BillReadyEmailProps) {
    const name = firstName ?? 'there';

    return (
        <EmailLayout preview={`Your invoice for ${planName} is ready — $${amount} due ${dueDate}`}>
            <Text style={heading}>Your Invoice is Ready.</Text>
            <Text style={body}>
                Hey {name} — your upcoming bill for FadeOdds is ready. Here's the breakdown:
            </Text>

            <Section style={invoiceBox}>
                <Text style={invoiceRow}>
                    <span style={invoiceLabel}>Plan</span>
                    <span style={invoiceValue}>{planName}</span>
                </Text>
                <Text style={invoiceRow}>
                    <span style={invoiceLabel}>Amount Due</span>
                    <span style={invoiceValue}>${amount}</span>
                </Text>
                <Text style={invoiceRow}>
                    <span style={invoiceLabel}>Due Date</span>
                    <span style={invoiceValue}>{dueDate}</span>
                </Text>
            </Section>

            <Text style={body}>
                Your card on file will be charged automatically. No action needed unless
                you want to update your payment method before the due date.
            </Text>

            <Section style={ctaSection}>
                <Button href={invoiceUrl} style={button}>
                    View Invoice →
                </Button>
            </Section>

            <Text style={closing}>
                Questions about your bill? Reply to this email or hit{' '}
                <a href="mailto:support@fadeodds.com" style={link}>support@fadeodds.com</a>.
            </Text>
        </EmailLayout>
    );
}

export default BillReadyEmail;

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

const invoiceBox: React.CSSProperties = {
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    margin: '20px 0',
    padding: '16px 20px',
};

const invoiceRow: React.CSSProperties = {
    color: '#374151',
    display: 'flex',
    fontSize: '14px',
    justifyContent: 'space-between',
    margin: '0 0 8px',
};

const invoiceLabel: React.CSSProperties = {
    color: '#6b7280',
};

const invoiceValue: React.CSSProperties = {
    color: '#111827',
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
    fontSize: '13px',
    margin: '8px 0 0',
};

const link: React.CSSProperties = {
    color: '#2563eb',
    textDecoration: 'none',
};
