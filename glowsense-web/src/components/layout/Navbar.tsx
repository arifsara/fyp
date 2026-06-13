"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { usePathname } from "next/navigation";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Features", href: "/#features" },
  { name: "Sign Up", href: "/signup" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <nav className="navbar-glass sticky top-0 z-50 w-full transition-all duration-300">
      <div className="mx-auto flex h-20 items-center justify-between px-6 md:px-12 relative">
        
        {/* Left: Logo */}
        <div className="flex-1 flex items-center justify-start">
          <Link href="/" className="flex items-center gap-2.5 group">
            <img src="/logo.png" alt="GlowSense AI Logo" className="h-12 w-auto object-contain transition-transform group-hover:scale-105" />
            <span className="text-3xl font-extrabold text-pink-500 tracking-tight">
              GlowSense AI
            </span>
          </Link>
        </div>

        {/* Center: Desktop Navigation (Absolutely Centered) */}
        <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="relative text-[15px] font-semibold text-[#5C5470] transition-all duration-200 hover:text-pink-500 group"
            >
              {link.name}
              <span className="absolute -bottom-1.5 left-1/2 w-1.5 h-1.5 bg-pink-500 rounded-full opacity-0 -translate-x-1/2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 translate-y-1"></span>
            </Link>
          ))}
        </div>

        {/* Right: Desktop Actions */}
        <div className="hidden md:flex flex-1 items-center justify-end gap-6">
          <Link href="/login">
            <span className="text-[15px] font-semibold text-[#5C5470] transition-colors duration-200 hover:text-pink-500 cursor-pointer">
              Login
            </span>
          </Link>
          <Link href="/signup">
            <button 
              className="bg-pink-500 text-white px-7 py-2.5 rounded-full font-bold text-[15px] transition-all duration-200 hover:bg-pink-600 hover:scale-105"
              style={{ boxShadow: '0 4px 14px rgba(244, 63, 94, 0.3)' }}
            >
              Get Started
            </button>
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex md:hidden flex-1 justify-end">
          <button
            className="p-2 text-[#5C5470] hover:text-pink-500 transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {isOpen && (
        <div className="md:hidden border-t border-pink-100/50 bg-white/95 backdrop-blur-xl px-6 py-6 shadow-2xl absolute w-full left-0">
          <div className="flex flex-col gap-5">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-base font-semibold text-[#5C5470] hover:text-pink-500 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <div className="flex flex-col gap-3 pt-5 border-t border-gray-100">
              <Link href="/login" onClick={() => setIsOpen(false)}>
                <button className="w-full py-3 rounded-xl border-2 border-pink-100 text-pink-600 font-bold hover:bg-pink-50 transition-colors">
                  Login
                </button>
              </Link>
              <Link href="/signup" onClick={() => setIsOpen(false)}>
                <button 
                  className="w-full py-3 rounded-xl bg-pink-500 text-white font-bold hover:bg-pink-600 transition-colors"
                  style={{ boxShadow: '0 4px 14px rgba(244, 63, 94, 0.3)' }}
                >
                  Get Started
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

