"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X, Home, ScanFace, UserRound, Sparkles, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { name: "Home", href: "/", icon: Home },
  { name: "Skin Analysis", href: "/dashboard/analysis", icon: ScanFace },
  { name: "Recommendations", href: "/dashboard/recommendations", icon: Sparkles },
  { name: "Profile", href: "/dashboard/profile", icon: UserRound },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`navbar-glass sticky top-0 z-50 w-full transition-all duration-300 ${scrolled ? 'py-2' : 'py-4'}`}>
      <div className="mx-auto flex items-center justify-between px-6 md:px-12 relative">

        {/* Left: Logo */}
        <div className="flex-1 flex items-center justify-start">
          <Link href="/" className="flex items-center gap-2.5 group">
            <img src="/logo.png" alt="GlowSense AI Logo" className="h-10 w-auto object-contain transition-transform group-hover:scale-105" />
            <span className="text-2xl font-bold text-primary tracking-tight">
              GlowSense AI
            </span>
          </Link>
        </div>

        {/* Center: Desktop Navigation (Absolutely Centered) */}
        <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-8">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`relative text-[15px] font-medium transition-all duration-300 group
                  ${isActive ? 'text-primary font-semibold' : 'text-foreground/80 hover:text-primary'}
                `}
              >
                {link.name}
                <span className={`absolute -bottom-1.5 left-1/2 w-1 h-1 rounded-full -translate-x-1/2 transition-all duration-300
                  ${isActive ? 'bg-primary opacity-100' : 'bg-primary opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-1'}
                `}></span>
              </Link>
            );
          })}
        </div>

        {/* Right: Desktop Actions */}
        <div className="hidden lg:flex flex-1 items-center justify-end gap-6">
          <Link href="/login">
            <span className="text-[15px] font-medium text-foreground/80 transition-colors duration-200 hover:text-primary cursor-pointer">
              Login
            </span>
          </Link>
          <Link href="/signup">
            <button className="btn-primary-gradient px-6 py-2.5 text-sm">
              Get Started
            </button>
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex lg:hidden flex-1 justify-end">
          <button
            className="p-2 text-foreground/80 hover:text-primary transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "calc(100vh - 72px)" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="lg:hidden absolute left-0 right-0 top-[100%] bg-background/95 backdrop-blur-xl border-t border-border overflow-y-auto shadow-2xl"
          >
            <div className="flex flex-col gap-4 px-6 py-8 min-h-full">
              {navLinks.map((link, i) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <motion.div
                    key={link.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 + 0.1 }}
                  >
                    <Link
                      href={link.href}
                      className={`flex items-center gap-5 text-lg font-medium transition-colors p-4 rounded-2xl
                        ${isActive ? 'bg-primary/10 text-primary' : 'text-foreground/80 hover:bg-muted hover:text-primary'}
                      `}
                      onClick={() => setIsOpen(false)}
                    >
                      <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors shadow-sm
                        ${isActive ? 'bg-primary text-white' : 'bg-muted text-primary'}
                      `}>
                        <Icon className="h-6 w-6" />
                      </div>
                      {link.name}
                    </Link>
                  </motion.div>
                );
              })}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: navLinks.length * 0.05 + 0.2 }}
                className="flex flex-col gap-4 pt-8 mt-4 border-t border-border pb-8"
              >
                <Link href="/login" onClick={() => setIsOpen(false)} className="block w-full">
                  <button className="w-full py-4 rounded-full border border-primary/20 text-primary font-semibold hover:bg-primary/5 transition-colors text-lg">
                    Login
                  </button>
                </Link>
                <Link href="/signup" onClick={() => setIsOpen(false)} className="block w-full">
                  <button className="w-full btn-primary-gradient py-4 text-lg">
                    Get Started
                  </button>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

