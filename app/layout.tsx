import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wordly - Learn Words with Flashcards",
  description: "A Quizlet-like app for learning words with automatic translation",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
