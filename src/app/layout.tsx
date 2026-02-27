import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs';
import "./globals.css";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://fadeodds.com';

export const metadata: Metadata = {
    title: 'FadeOdds',
    description: 'Live Odds · AI Analysis · Sharp Intelligence',
    openGraph: {
        title: 'FadeOdds',
        description: 'Live Odds · AI Analysis · Sharp Intelligence',
        url: BASE_URL,
        siteName: 'FadeOdds',
        images: [{ url: `${BASE_URL}/logo.png`, width: 512, height: 512, alt: 'FadeOdds' }],
        type: 'website',
    },
    twitter: {
        card: 'summary',
        title: 'FadeOdds',
        description: 'Live Odds · AI Analysis · Sharp Intelligence',
        images: [`${BASE_URL}/logo.png`],
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ClerkProvider>
            {/* suppressHydrationWarning: the anti-flash script sets data-theme before
                React hydrates, causing a server/client mismatch that is intentional and safe. */}
            <html lang="en" suppressHydrationWarning>
                <head>
                    <script
                        dangerouslySetInnerHTML={{
                            __html: `try{var t=localStorage.getItem('fadeodds-theme')||'light';document.documentElement.setAttribute('data-theme',t);}catch(e){}`,
                        }}
                    />
                </head>
                <body>{children}</body>
            </html>
        </ClerkProvider>
    );
}