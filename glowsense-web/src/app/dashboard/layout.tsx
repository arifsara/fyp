"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, 
  ScanFace, 
  Camera, 
  Calendar, 
  User, 
  CreditCard, 
  LogOut,
  Bell,
  Search,
  Menu,
  X as XIcon,
  Sparkles,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const getSidebarLinks = (role: string | null) => {
  const baseLinks = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  ];
  
  if (role === "provider") {
    return [
      ...baseLinks,
      { name: "Portfolio", href: "/dashboard/portfolio", icon: Camera },
      { name: "Bookings", href: "/dashboard/bookings", icon: Calendar },
      { name: "Ratings", href: "/dashboard/ratings", icon: Star },
      { name: "Payments", href: "/dashboard/payments", icon: CreditCard },
      { name: "Profile", href: "/dashboard/profile", icon: User },
    ];
  } else if (role === "customer") {
    return [
      ...baseLinks,
      { name: "AI Assistant", href: "/dashboard/ai-assistant", icon: Sparkles },
      { name: "Skin Analysis", href: "/dashboard/analysis", icon: ScanFace },
      { name: "AR Try-On", href: "/dashboard/ar-try-on", icon: Camera },
      { name: "Service Providers", href: "/dashboard/providers", icon: Search },
      { name: "My Bookings", href: "/dashboard/my-bookings", icon: Calendar },
      { name: "Payments", href: "/dashboard/payments", icon: CreditCard },
      { name: "Profile", href: "/dashboard/profile", icon: User },
    ];
  }
  
  return baseLinks;
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    setRole(localStorage.getItem("role"));
  }, []);

  const handleLogout = () => {
    const currentRole = localStorage.getItem("role");
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    router.push(currentRole === "provider" ? "/login/provider" : "/login/customer");
  };

  const sidebarLinks = getSidebarLinks(role);

  return (
    <div className="flex min-h-screen bg-muted/20">
      {/* Sliding Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-border transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } md:translate-x-0 md:static md:z-auto`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-6 flex items-center justify-between border-b border-border/50">
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
              GlowSense AI
            </span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-2 hover:bg-muted rounded-lg"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>
          
          {/* Sidebar Navigation */}
          <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
            {sidebarLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                  }`}
                >
                  <link.icon className="h-5 w-5" />
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-border/50">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Log Out
            </button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 md:ml-0">
        {/* Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b bg-white/80 px-6 backdrop-blur-md">
          <div className="flex items-center gap-4 md:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-muted rounded-lg"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex flex-1 items-center gap-4 md:max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search services, experts..."
                className="w-full bg-muted/30 pl-9"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
            </Button>
            <div className="h-8 w-8 rounded-full bg-primary/20 border border-primary/30 overflow-hidden">
              {/* User Avatar Placeholder */}
              <div className="w-full h-full flex items-center justify-center text-xs font-bold text-primary">JD</div>
            </div>
          </div>
        </header>

        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

