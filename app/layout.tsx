import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Providers } from "@/providers"
import { Sidebar } from "@/components/layout/sidebar"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Trama",
  description: "Trama app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="h-full flex bg-white dark:bg-zinc-950">
        <Providers>
          <Sidebar />
          <div className="flex flex-1 flex-col min-h-0 overflow-y-auto">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  )
}
