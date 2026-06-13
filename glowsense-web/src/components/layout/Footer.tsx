"use client";

import Link from "next/link";
import { Instagram, Twitter, Facebook } from "lucide-react";

import { usePathname } from "next/navigation";

import { useCustomAlert } from "@/components/providers/CustomAlertProvider";

export function Footer() {
  const pathname = usePathname();
  const { showAlert } = useCustomAlert();

  const shouldHide = pathname === "/dashboard/ai-assistant";
  if (shouldHide) return null;

  return (
    <footer className="bg-white border-t">
      <div className="container mx-auto px-4 py-12 md:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="GlowSense AI Logo" className="h-8 w-auto object-contain" />
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
                GlowSense AI
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              AI-powered skin analysis, AR makeup previews, and trusted beauty bookings — all in one place.
            </p>
          </div>

          {/* Links Column 1 */}
          <div>
            <h3 className="font-semibold mb-4">Platform</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/" className="hover:text-primary">Home</Link></li>
              <li><Link href="/#features" className="hover:text-primary">Features</Link></li>
              <li><Link href="/signup" className="hover:text-primary">Sign Up</Link></li>
              <li><Link href="/login" className="hover:text-primary">Login</Link></li>
            </ul>
          </div>

          {/* Links Column 2 */}
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="mailto:support@glowsense.ai" className="hover:text-primary">Contact Support</a></li>
              <li><Link href="/dashboard" className="hover:text-primary">Dashboard</Link></li>
              <li><a href="#" className="hover:text-primary" onClick={(e) => { e.preventDefault(); showAlert("Privacy Policy - Coming Soon"); }}>Privacy Policy</a></li>
              <li><a href="#" className="hover:text-primary" onClick={(e) => { e.preventDefault(); showAlert("Terms of Service - Coming Soon"); }}>Terms of Service</a></li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="font-semibold mb-4">Connect</h3>
            <div className="flex gap-4 text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors"><Instagram className="h-5 w-5" /></a>
              <a href="#" className="hover:text-primary transition-colors"><Twitter className="h-5 w-5" /></a>
              <a href="#" className="hover:text-primary transition-colors"><Facebook className="h-5 w-5" /></a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} GlowSense AI. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

