import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { FirebaseProvider } from '@/components/FirebaseProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ThemeProvider } from '@/components/ThemeProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
});

export const metadata: Metadata = {
  title: 'B-PREC | Cooperative Legal Nexus',
  description: 'A comprehensive digital ecosystem for cooperative enterprises, featuring community forums, resource sharing, and AI-assisted legal services.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`} suppressHydrationWarning>
      <body className="bg-stone-50 text-stone-900 dark:bg-zinc-950 dark:text-zinc-100 font-sans antialiased transition-colors duration-300">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ErrorBoundary>
            <FirebaseProvider>
              {children}
            </FirebaseProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
