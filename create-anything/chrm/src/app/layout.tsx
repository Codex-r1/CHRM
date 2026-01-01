import { Poppins } from 'next/font/google'
import './globals.css'
import React from 'react'

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} antialiased`}
      >
        
        <main className="min-h-screen">
          {children}
        </main>
        
      </body>
    </html>
  );
}