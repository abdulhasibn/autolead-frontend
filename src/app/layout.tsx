import type { Metadata, Viewport } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import { Providers } from "@/lib/providers"
import "./globals.css"

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "Wheels Experts",
    template: "%s | Wheels Experts",
  },
  description: "Car showroom sales management platform",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Lets the app draw under the notch; the shell pads with safe-area insets.
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F3F4F6" },
    { media: "(prefers-color-scheme: dark)", color: "#0F1A18" },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Sets .dark before first paint to prevent flash when preference is dark/system-dark */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var s=localStorage.getItem('ui.themePreference.v1');var d=s==='dark'||(s==='system'||!s)&&window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark')}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-full">
        <Providers>{children}</Providers>
        <Toaster richColors closeButton />
      </body>
    </html>
  )
}
