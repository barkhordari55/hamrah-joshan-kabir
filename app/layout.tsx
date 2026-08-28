import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'همراه جوشن کبیر',
  description: 'ختم روزانه و گروهی دعای جوشن کبیر همراه با ترجمه فارسی',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/app-icon.png', apple: '/app-icon.png' },
};

export const viewport: Viewport = { themeColor: '#086b69', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fa" dir="rtl"><body>{children}</body></html>;
}
