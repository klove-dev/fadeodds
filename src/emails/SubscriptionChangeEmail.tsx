import { Button, Section, Text } from '@react-email/components';
import { EmailLayout } from './EmailLayout';

interface SubscriptionChangeEmailProps {
    firstName?: string;
    changeType: 'created' | 'upgraded' | 'downgraded' | 'updated';
    newPlan: string;
    oldPlan?: string;
    effectiveDate: string;
    manageUrl: string;
}

export function SubscriptionChangeEmail({
    firstName,
    changeType,
    newPlan,
    oldPlan,
    effectiveDate,
    manageUrl,
}: SubscriptionChangeEmailProps) {
    const name = firstName ?? 'there';

    const headings: Record<typeof changeType, string> = {
        created: "You're Subscribed. Let's Ride.",
        upgraded: 'Level Up. New Plan, More Edge.',
        downgraded: 'Plan Updated.',
        updated: 'Your Plan Just Changed.',
    };

    const intros: Record<typeof changeType, string> = {
        created: `Hey ${name} — you just locked in a FadeOdds subscription. Smart move.`,
        upgraded: `Hey ${name} — you just upgraded your FadeOdds plan. More access, more edge.`,
        downgraded: `Hey ${name} — your FadeOdds plan has been updated. Here's what changed:`,
        updated: `Hey ${name} — heads up, your FadeOdds subscription was updated. Here's the details:`,
    };

    return (
        <EmailLayout preview={`${headings[changeType]} — ${newPlan} plan active as of ${effectiveDate}`}>
            <Text style={heading}>{headings[changeType]}</Text>
            <Text style={body}>{intros[changeType]}</Text>

            <Section style={planBox}>
                {oldPlan && changeType !== 'created' && (
                    <Text style={planRow}>
                        <span style={planLabel}>Previous Plan</span>
                        <span style={oldPlanValue}>{oldPlan}</span>
                    </Text>
                )}
                <Text style={planRow}>
                    <span style={planLabel}>New Plan</span>
                    <span style={newPlanValue}>{newPlan}</span>
                </Text>
                <Text style={planRow}>
                    <span style={planLabel}>Effective</span>
                    <span style={planValue}>{effectiveDate}</span>
                </Text>
            </Section>

            <Text style={body}>
                Your new access level is active immediately. Any payment adjustments will
                be reflected on your next billing cycle.
            </Text>

            <Section style={ctaSection}>
                <Button href={manageUrl} style={button}>
                    Manage Subscription →
                </Button>
            </Section>

            <Text style={closing}>
                Questions? Hit us at{' '}
                <a href="mailto:support@fadeodds.com" style={link}>support@fadeodds.com</a>.
            </Text>
        </EmailLayout>
    );
}

export default SubscriptionChangeEmail;

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

const planBox: React.CSSProperties = {
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    margin: '20px 0',
    padding: '16px 20px',
};

const planRow: React.CSSProperties = {
    color: '#374151',
    display: 'flex',
    fontSize: '14px',
    justifyContent: 'space-between',
    margin: '0 0 8px',
};

const planLabel: React.CSSProperties = {
    color: '#6b7280',
};

const planValue: React.CSSProperties = {
    color: '#111827',
    fontWeight: '600',
};

const newPlanValue: React.CSSProperties = {
    color: '#2563eb',
    fontWeight: '700',
};

const oldPlanValue: React.CSSProperties = {
    color: '#9ca3af',
    fontWeight: '500',
    textDecoration: 'line-through',
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
