import type { Metadata, Viewport } from 'next'
import { Inter, Poppins, Roboto_Mono } from 'next/font/google'
import './globals.css'

// Police principale - Inter pour une excellente lisibilité
const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
})

// Police secondaire - Poppins pour les titres
const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
  preload: true,
})

// Police monospace - Roboto Mono pour le code et les données
const robotoMono = Roboto_Mono({ 
  subsets: ['latin'],
  variable: '--font-roboto-mono',
  display: 'swap',
  preload: true,
})

export const metadata: Metadata = {
  title: 'SoliReserve Enhanced - Gestion Hôtelière Moderne',
  description: 'Application moderne de gestion d\'hébergements sociaux avec interface intuitive et fonctionnalités avancées',
  keywords: 'gestion hôtelière, réservations, hébergement social, SoliReserve',
  authors: [{ name: 'SoliReserve Team' }],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#3B82F6',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={`${inter.variable} ${poppins.variable} ${robotoMono.variable}`}>
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  )
} 