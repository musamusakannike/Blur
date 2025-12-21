import type { Metadata } from "next";
import { Belanosima } from "next/font/google";
import "./globals.css";

const belanosima = Belanosima({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: [ "400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Blur - Anonymous Social Platform",
  description: "Create temporary chat rooms and anonymous portals. Real chats, real anonymity.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${belanosima.className} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
