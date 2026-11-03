import type { Metadata } from "next"
import { Geist, Geist_Mono, Share_Tech_Mono, VT323 } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { cn } from "@/lib/utils";

import { obterPoliticasAtuais } from "@/lib/security-policies"

const geist = Geist({subsets:['latin'],variable:'--font-sans'})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

const fontShareTech = Share_Tech_Mono({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-crt-mono",
})

const fontVt323 = VT323({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
})

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Logpad",
  description: "Logpad",
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/icon.ico", sizes: "any" },
    ],
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const politicas = await obterPoliticasAtuais()
  const tema = politicas.tema || "green"

  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        fontShareTech.variable,
        fontVt323.variable,
        "font-sans",
        geist.variable
      )}
    >
      <body suppressHydrationWarning>
        <ThemeProvider initialTheme={tema}>{children}</ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
