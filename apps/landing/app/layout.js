import './globals.css';

export const metadata = {
  title: 'meow — Stay focused. Stay cozy.',
  description:
    'A little menu-bar app that pairs ambient sounds with a pomodoro timer and a furry friend.',
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
