import type { Metadata } from 'next';
import { AuthProvider } from '../lib/authContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'Inkloom AI — Pre-Publication Brand Governance Platform',
  description: 'Automated pre-publication brand voice, claim verification, and compliance governance platform.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full">
      <body className="min-h-full flex flex-col bg-[#090D16] text-gray-100 antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
