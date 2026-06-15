import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { CustomAlertProvider } from "@/components/providers/CustomAlertProvider";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GlowSense AI - Beauty Built Smart",
  description: "AI-powered skin analysis, AR makeup previews, and trusted beauty bookings.",
  icons: {
    icon: "/logo.png?v=2",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${outfit.variable} antialiased min-h-screen flex flex-col font-sans`}
      >
        {/* Global Atmospheric Background */}
        <div
          className="fixed inset-0 z-0 pointer-events-none bg-cover bg-center bg-no-repeat opacity-30 md:opacity-100 transition-all duration-300"
          style={{ backgroundImage: "url('/makeup.png')" }}
        />

        <div className="relative z-10 flex flex-col flex-1">
          <SessionProvider>
            <CustomAlertProvider>
              <Navbar />
              <main className="flex-1 flex flex-col">{children}</main>
              <Footer />
            </CustomAlertProvider>
          </SessionProvider>
        </div>
      </body>
    </html>
  );
}
