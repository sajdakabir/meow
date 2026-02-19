import './globals.css';

export const metadata = {
  title: 'meow — Focus mode. Made delightful.',
  description:
    'A cozy menu-bar companion for your Mac with calming music and a focus pal by your side.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
