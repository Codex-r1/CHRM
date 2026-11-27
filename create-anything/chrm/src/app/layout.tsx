import "./globals.css";
import React from "react";
import { AuthProvider } from "./(backend)/context/auth";
import SessionWarning from "./(frontend)/components/SessionWarning";
import { Playfair_Display, Montserrat, Manrope } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["600", "800", "900", "900", "700"],
  display: "swap",
});

// Primary typeface of the redesigned public site (see styles/site.css).
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["400", "500", "600", "700", "800"],
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
    <html lang="en" className={`${playfair.variable} ${montserrat.variable} ${manrope.variable}`}>
      <body className="bg-white text-[#1B3A6B] antialiased selection:bg-[#C9A84C] selection:text-[#1B3A6B]">
        <AuthProvider>
          <SessionWarning />
          <main className="min-h-screen">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}