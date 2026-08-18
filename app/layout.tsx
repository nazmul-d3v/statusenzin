import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: 'StatusEnzin — Uptime Monitoring & Public Status Pages',
  description: 'Multi-tenant uptime monitoring and public status page platform built for high reliability.',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-black text-vercel-text antialiased selection:bg-[#30ff87] selection:text-[#042713]">
        {children}
      </body>
    </html>
  );
}
