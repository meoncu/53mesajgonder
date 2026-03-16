import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contacts Campaign Hub',
  description: 'Google Contacts sync + campaign management, n8n-ready.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
