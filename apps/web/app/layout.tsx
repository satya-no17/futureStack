import type { Metadata } from 'next';
import { AuthProvider } from '../lib/authContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'Inkloom AI — Pre-Publication Brand Governance Platform',
  description: 'Automated pre-publication brand voice, claim verification, and compliance governance platform powered by AI.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
