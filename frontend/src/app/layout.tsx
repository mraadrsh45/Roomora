import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { SocketProvider } from '@/context/SocketContext';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Roomora – Smart Roommate Finder',
  description: 'Find safe and compatible roommates near you with smart matching, location-based search, and verified profiles.',
  keywords: ['roommate finder', 'room rental', 'flat sharing', 'PG', 'smart matching'],
  openGraph: {
    title: 'Roomora – Smart Roommate Finder',
    description: 'Find your perfect roommate with AI-powered compatibility matching.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-[#0a0a0f] text-white antialiased">
        <AuthProvider>
          <SocketProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                style: { background: '#1a1a2e', color: '#fff', border: '1px solid #7c3aed' },
                success: { iconTheme: { primary: '#7c3aed', secondary: '#fff' } },
              }}
            />
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
