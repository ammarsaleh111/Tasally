import { Cairo, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProviderNew";
import DominantThemeBanner from "@/components/DominantThemeBanner";
import { SeasonIdentityProvider } from "@/components/SeasonIdentity";
import NotificationInitializer from "@/components/NotificationInitializer";
import IdentityGate from "@/components/IdentityGate";
import SessionInitializer from "@/components/SessionInitializer";
import AuthProvider from "@/components/AuthProvider";
import SessionBridge from "@/components/SessionBridge";
import { TutorialProvider } from "@/components/tutorial/TutorialProvider";
import GlobalTutorial from "@/components/tutorial/GlobalTutorial";
import PresenceProvider from "@/components/PresenceProvider";
import { isProductionDeploy, siteDescription, siteName, siteUrl, buildWebSiteJsonLd, buildOrganizationJsonLd } from "@/lib/seo";
import PWARegister from "@/components/PWARegister";
import OnboardingFlow from "@/components/OnboardingFlow";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cairo = Cairo({
  variable: "--font-arabic",
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700"],
});

// Theme colour matches --background dark token: hsl(222 47% 11%) ≈ #0f1729
export const viewport = {
  themeColor: '#0f1729',
  colorScheme: 'dark light',
};

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Tasally | Daily Puzzle & Brain Games",
    template: "%s | Tasally",
  },
  description: siteDescription,
  applicationName: siteName,
  alternates: {
    canonical: "/",
  },
  keywords: [
    "daily puzzle games",
    "free online puzzle games",
    "brain games",
    "word games online",
    "daily word game",
    "wordle alternative",
    "wordle online free",
    "connections game",
    "mini crossword",
    "spelling bee game",
    "trivia game",
    "numbers puzzle",
    "strands game",
    "waffle word game",
    "daily brain challenge",
    "puzzle games no download",
    "tasally",
    "free word puzzles",
    "daily quiz",
    "online brain teasers",
  ],
  creator: siteName,
  publisher: siteName,
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName,
    title: "Tasally | Daily Puzzle & Brain Games",
    description: siteDescription,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Tasally daily puzzle & brain games",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tasally | Daily Puzzle & Brain Games",
    description: siteDescription,
    images: ["/twitter-image"],
  },
  // PWA
  manifest: '/manifest.webmanifest',
  icons: {
    apple: '/icons/maskable-192.png',
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Tasally',
  },
  robots: isProductionDeploy
    ? {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          "max-image-preview": "large",
          "max-snippet": -1,
          "max-video-preview": -1,
        },
      }
    : {
        index: false,
        follow: false,
        googleBot: {
          index: false,
          follow: false,
        },
      },
};

export default function RootLayout({ children }) {
  const webSiteJsonLd = buildWebSiteJsonLd();
  const organizationJsonLd = buildOrganizationJsonLd();

  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cairo.variable} antialiased bg-background text-foreground transition-colors duration-300`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <PWARegister />
        <AuthProvider>
          <SessionBridge />
          <PresenceProvider intervalMs={90000}>
            <SessionInitializer>
              <IdentityGate>
                <ThemeProvider>
                  <NotificationInitializer>
                    <TutorialProvider>
                      <OnboardingFlow />
                      <SeasonIdentityProvider showBackground={true} showCorners={true} showParticles={false}>
                        <DominantThemeBanner />
                        <GlobalTutorial />
                        <div className="relative z-10">
                          {children}
                        </div>
                      </SeasonIdentityProvider>
                    </TutorialProvider>
                  </NotificationInitializer>
                </ThemeProvider>
              </IdentityGate>
            </SessionInitializer>
          </PresenceProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
