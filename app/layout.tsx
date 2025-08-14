import type React from "react"
import type { Metadata } from "next"
import { Inter, Kalam } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

const kalam = Kalam({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  display: "swap",
  variable: "--font-kalam",
})

export const metadata: Metadata = {
  title: "心语迹 - icare",
  description: "一款有情感智能的AI对话日记应用，帮助你用文艺的方式记录生活",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" className={`${inter.variable} ${kalam.variable} antialiased`}>
      <body className="font-sans" style={{ backgroundColor: "#FFF3E0" }}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
