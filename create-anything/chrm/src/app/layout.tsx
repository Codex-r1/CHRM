import { Playfair_Display, Montserrat } from "next/font/google";
import "./globals.css";
import React from "react";
import { AuthProvider } from "./(backend)/context/auth";
import SessionWarning from "./(frontend)/components/SessionWarning";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata = {
  title: "Old Turians Portal | St Andrew's School, Turi",
  description: "Official Alumni Platform for St Andrew's School, Turi. Established 1931.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${montserrat.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      {/* Explicitly set font-montserrat class and apply Montserrat variable */}
      <body className={`${montserrat.className} bg-white text-[#1B3A6B] antialiased selection:bg-[#C9A84C] selection:text-[#1B3A6B]`}>
        <AuthProvider>
          <SessionWarning />
          <main className="min-h-screen">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}