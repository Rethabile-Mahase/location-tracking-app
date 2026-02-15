import React from "react"
import type { Metadata } from 'next'
import { Inter, DM_Sans } from 'next/font/google'
import UserbackProvider from "@/components/UserFeedBackProvider"

import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans' })

export const metadata: Metadata = {
  title: 'Fuel Cost Calculator | Trip Planner & Live Tracker',
  description:
    'Calculate transport pricing, plan trips with Google Maps, and track live trip costs. Get smart pricing suggestions in South African Rands.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${dmSans.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        {children}
         <UserbackProvider />
      </body>
    </html>
  )
}
