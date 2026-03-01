import {
    Body,
    Container,
    Head,
    Hr,
    Html,
    Preview,
    Section,
    Text,
} from '@react-email/components';
import { ReactNode } from 'react';

interface EmailLayoutProps {
    preview: string;
    children: ReactNode;
}

export function EmailLayout({ preview, children }: EmailLayoutProps) {
    return (
        <Html>
            <Head />
            <Preview>{preview}</Preview>
            <Body style={body}>
                <Container style={container}>
                    {/* Header */}
                    <Section style={header}>
                        <Text style={logo}>FADEODDS</Text>
                        <Text style={tagline}>Sharp picks. No noise.</Text>
                    </Section>

                    <Hr style={divider} />

                    {/* Content */}
                    <Section style={content}>
                        {children}
                    </Section>

                    <Hr style={divider} />

                    {/* Footer */}
                    <Section style={footer}>
                        <Text style={footerText}>
                            © {new Date().getFullYear()} FadeOdds. All rights reserved.
                        </Text>
                        <Text style={footerText}>
                            Questions? Hit us at{' '}
                            <a href="mailto:support@fadeodds.com" style={link}>
                                support@fadeodds.com
                            </a>
                        </Text>
                        <Text style={footerDisclaimer}>
                            FadeOdds is for entertainment and informational purposes only.
                            Please gamble responsibly.
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const body: React.CSSProperties = {
    backgroundColor: '#f4f4f5',
    fontFamily: "'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif",
    margin: '0',
    padding: '20px 0',
};

const container: React.CSSProperties = {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    margin: '0 auto',
    maxWidth: '560px',
    overflow: 'hidden',
};

const header: React.CSSProperties = {
    padding: '32px 40px 20px',
};

const logo: React.CSSProperties = {
    color: '#2563eb',
    fontSize: '22px',
    fontWeight: '800',
    letterSpacing: '0.12em',
    margin: '0 0 4px',
};

const tagline: React.CSSProperties = {
    color: '#9ca3af',
    fontSize: '12px',
    letterSpacing: '0.08em',
    margin: '0',
    textTransform: 'uppercase',
};

const divider: React.CSSProperties = {
    borderColor: '#e5e7eb',
    margin: '0',
};

const content: React.CSSProperties = {
    padding: '32px 40px',
};

const footer: React.CSSProperties = {
    padding: '20px 40px 32px',
};

const footerText: React.CSSProperties = {
    color: '#9ca3af',
    fontSize: '12px',
    margin: '0 0 4px',
};

const footerDisclaimer: React.CSSProperties = {
    color: '#d1d5db',
    fontSize: '11px',
    margin: '12px 0 0',
};

const link: React.CSSProperties = {
    color: '#2563eb',
    textDecoration: 'none',
};
