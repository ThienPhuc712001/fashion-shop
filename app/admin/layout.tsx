import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../globals.css';
import { ThemeProvider } from '../providers';
import { AdminSidebar } from '@/components/admin/admin-sidebar';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Admin - Fashion Shop',
  description: 'Admin dashboard for Fashion Shop',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <div className="min-h-screen flex">
            <AdminSidebar />
            <main className="flex-1 bg-muted/30">{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
