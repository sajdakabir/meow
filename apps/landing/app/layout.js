import './globals.css';

export const metadata = {
  title: 'meow — Stay focused. Stay cozy.',
  description:
    'A free, open-source menu bar app for macOS. Pomodoro timer, ambient sounds, and adorable focus companions — all in 11 MB. Fully private, no tracking.',
  keywords: [
    'pomodoro timer mac',
    'focus app mac',
    'menu bar timer',
    'ambient sounds app',
    'focus timer macos',
    'pomodoro app macos',
    'productivity app mac',
    'free focus app',
    'open source pomodoro',
    'mac menu bar app',
    'study timer mac',
    'white noise app mac',
  ],
  authors: [{ name: 'Sajda Kabir', url: 'https://sajdakabir.com' }],
  creator: 'Sajda Kabir',
  metadataBase: new URL('https://meow.sajdakabir.com'),
  openGraph: {
    title: 'meow — Stay focused. Stay cozy.',
    description:
      'A free, open-source menu bar app for macOS. Pomodoro timer, ambient sounds, and adorable focus companions.',
    url: 'https://meow.sajdakabir.com',
    siteName: 'meow',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'meow — Focus app for macOS',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'meow — Stay focused. Stay cozy.',
    description:
      'Free, open-source menu bar focus app for macOS. Pomodoro timer, ambient sounds, and cute companions.',
    images: ['/og-image.png'],
    creator: '@sajdakabir',
  },
  icons: {
    icon: '/image.png',
    apple: '/image.png',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'meow',
              operatingSystem: 'macOS',
              applicationCategory: 'ProductivityApplication',
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
              description:
                'A free, open-source menu bar app for macOS with pomodoro timer, ambient sounds, and focus companions.',
              url: 'https://meow.sajdakabir.com',
              downloadUrl: 'https://github.com/sajdakabir/meow/releases/latest',
              author: { '@type': 'Person', name: 'Sajda Kabir', url: 'https://sajdakabir.com' },
            }),
          }}
        />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
