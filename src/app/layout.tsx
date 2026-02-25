import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs';
import "./globals.css";

export const metadata: Metadata = {
    title: "FadeOdds",
    description: "Live Odds · AI Analysis · Sharp Intelligence",
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