import './globals.css';

export const metadata = {
  title: 'meow — Focus mode. Made delightful.',
  description:
    'A cozy desktop companion that turns your Mac into a focus machine. Pomodoro timer, ambient sounds, and adorable focus pals.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  );
}
