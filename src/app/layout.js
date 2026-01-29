import { Cairo, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProviderNew";
import DominantThemeBanner from "@/components/DominantThemeBanner";
import { SeasonIdentityProvider } from "@/components/SeasonIdentity";
import NotificationInitializer from "@/components/NotificationInitializer";
import IdentityProvider from "@/components/IdentityProvider";
import SessionInitializer from "@/components/SessionInitializer";
import AuthProvider from "@/components/AuthProvider";
import SessionBridge from "@/components/SessionBridge";

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

export const metadata = {
  title: "Ammar Times",
  description: "Daily Games Platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cairo.variable} antialiased bg-background text-foreground transition-colors duration-300`}
      >
        <AuthProvider>
          <SessionBridge />
          <SessionInitializer>
            <IdentityProvider>
              <ThemeProvider>
                <NotificationInitializer>
                  <SeasonIdentityProvider showBackground={true} showCorners={true} showParticles={false}>
                    <DominantThemeBanner />
                    <div className="relative z-10">
                      {children}
                    </div>
                  </SeasonIdentityProvider>
                </NotificationInitializer>
              </ThemeProvider>
            </IdentityProvider>
          </SessionInitializer>
        </AuthProvider>
      </body>
    </html>
  );
}
