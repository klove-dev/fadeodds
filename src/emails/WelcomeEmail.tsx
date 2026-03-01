import { Button, Section, Text } from '@react-email/components';
import { EmailLayout } from './EmailLayout';

interface WelcomeEmailProps {
    firstName?: string;
}

export function WelcomeEmail({ firstName }: WelcomeEmailProps) {
    const name = firstName ?? 'Homie';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://fadeodds.com';

    return (
        <EmailLayout preview="You're in. Let's get to work.">
            <Text style={heading}>You're In. Let's Get to Work.</Text>
            <Text style={body}>
                What's good, {name} — welcome to FadeOdds.
            </Text>
            <Text style={body}>
                You now have access to real-time odds, sharp analysis, and the kind of
                insights that'll make you the smartest guy in your group chat. Use it wisely.
            </Text>
            <Text style={body}>Here's what's waiting for you:</Text>
            <Text style={bullet}>📊 Live odds across NFL, NBA, NHL, MLB & NCAAB</Text>
            <Text style={bullet}>🧠 AI-powered game analysis — no fluff, just edge</Text>
            <Text style={bullet}>🔖 Save your picks and track your action</Text>
            <Text style={bullet}>⚡ Injury reports that actually matter</Text>

            <Section style={ctaSection}>
                <Button href={appUrl} style={button}>
                    Start Fading →
                </Button>
            </Section>

            <Text style={closing}>
                See you in the app. Don't sleep on the lines.
            </Text>
            <Text style={sig}>— The FadeOdds Crew</Text>
        </EmailLayout>
    );
}

export default WelcomeEmail;

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

const bullet: React.CSSProperties = {
    color: '#374151',
    fontSize: '14px',
    lineHeight: '1.5',
    margin: '0 0 8px',
    paddingLeft: '4px',
};

const ctaSection: React.CSSProperties = {
    margin: '28px 0',
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
