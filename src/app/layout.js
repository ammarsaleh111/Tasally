import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProviderNew";
import DominantThemeBanner from "@/components/DominantThemeBanner";
import NotificationInitializer from "@/components/NotificationInitializer";
import IdentityProvider from "@/components/IdentityProvider";
import SessionInitializer from "@/components/SessionInitializer";
import AuthProvider from "@/components/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Ammar Times",
  description: "Daily Games Platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground transition-colors duration-300`}
      >
        <AuthProvider>
          <SessionInitializer>
            <IdentityProvider>
              <ThemeProvider>
                <NotificationInitializer>
                  <DominantThemeBanner />
                  {children}
                </NotificationInitializer>
              </ThemeProvider>
            </IdentityProvider>
          </SessionInitializer>
        </AuthProvider>
      </body>
    </html>
  );
}
