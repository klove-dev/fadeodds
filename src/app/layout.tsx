import type { Metadata } from "next";
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
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}