import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from './providers';
import { CartProvider } from '@/lib/cart-context';
import { ToastContainer } from '@/components/ui/toast';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Fashion Shop - E-commerce Platform',
  description: 'Your destination for premium fashion. Shop the latest trends with exclusive designs.',
  keywords: ['fashion', 'ecommerce', 'clothing', 'style', 'shop'],
  authors: [{ name: 'Fashion Shop' }],
  openGraph: {
    title: 'Fashion Shop',
    description: 'Premium fashion e-commerce platform',
    type: 'website',
  },
};

export default function RootLayout({
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
          <CartProvider>
            <div className="relative min-h-screen flex flex-col">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
              <ToastContainer />
            </div>
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
