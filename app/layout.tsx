import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Rubicon Programs - Testing Application',
  description: 'Professional skills testing platform for typing, digital literacy, math, and English proficiency',
  icons: {
    icon: '/images/RUBICON-sqlogo.png',
    shortcut: '/images/RUBICON-sqlogo.png',
    apple: '/images/RUBICON-sqlogo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}