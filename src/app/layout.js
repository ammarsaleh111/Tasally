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
import {
//asdjasd
  isProductionDeploy,
  siteDescription,
  siteDescriptionArabic,
  siteName,
  siteNameArabic,
  siteUrl,
  brandKeywords,
  buildWebSiteJsonLd,
  buildOrganizationJsonLd,
} from "@/lib/seo";
import PWARegister from "@/components/PWARegister";
import OnboardingFlow from "@/components/OnboardingFlow";
import { NetworkStatusProvider } from "@/hooks/useNetworkStatus";
import SyncStatusIndicator from "@/components/SyncStatusIndicator";
import { getBuildVersion } from "@/lib/buildVersion";

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
    default: "Tasally (تسالي) — Daily Brain Games Platform",
    template: "%s | Tasally | Daily Puzzle & Brain Games",
  },
  description: siteDescription,
  applicationName: `${siteName} (${siteNameArabic})`,
  authors: [{ name: siteName, url: siteUrl }],
  creator: siteName,
  publisher: siteName,
  keywords: brandKeywords,
  alternates: {
    canonical: "/",
    languages: {
      en: "/",
      ar: "/تسالي",
      "x-default": "/",
    },
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName,
    locale: "en_US",
    alternateLocale: ["ar_AR"],
    title: "Tasally (تسالي) — Daily Brain Games Platform",
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
    title: "Tasally (تسالي) — Daily Brain Games Platform",
    description: siteDescription,
    images: ["/twitter-image"],
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "Bj4vWtesvRNecM3vXkvZwZwBCWm96NFT5j2IZ0RooYw",
    other: {
      "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION || undefined,
      yandex: process.env.NEXT_PUBLIC_YANDEX_SITE_VERIFICATION || undefined,
    },
  },
  other: {
    "description:ar": siteDescriptionArabic,
    "apple-mobile-web-app-title": "Tasally",
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
  const buildVersion = getBuildVersion();

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
        <PWARegister buildVersion={buildVersion} />
        <AuthProvider>
          <SessionBridge />
          <NetworkStatusProvider>
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
          <SyncStatusIndicator />
          </NetworkStatusProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
