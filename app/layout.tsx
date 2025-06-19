import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Archivion",
  description: "Upload and share media seamlessly, and find what you need in seconds with intelligent auto-tagging",
  generator: "v0.dev",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold">Tugas Besar LTKA 2025</span>
              </div>
              <nav className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">Kanaya V. H. dan Yasmin F. Z.</span>
              </nav>
            </div>
          </header>
          <main className="pt-16">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  )
}
