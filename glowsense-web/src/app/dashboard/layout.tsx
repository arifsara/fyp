"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { API_URL } from "@/lib/api";
import { 
  LayoutDashboard, 
  ScanFace, 
  Camera, 
  Calendar, 
  User, 
  CreditCard, 
  LogOut,
  Search,
  Menu,
  X as XIcon,
  Sparkles,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import NotificationBell from "@/components/notifications/NotificationBell";

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
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [initials, setInitials] = useState<string>("U");

  useEffect(() => {
    const currentRole = localStorage.getItem("role");
    setRole(currentRole);

    const fetchHeaderProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token || !currentRole) return;
      try {
        const endpoint = currentRole === "provider" 
          ? `${API_URL}/provider/profile` 
          : `${API_URL}/customer/profile`;
        const res = await fetch(endpoint, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          const photo = data.profile_photo || data.profile_picture;
          if (photo) {
             setProfilePhoto(photo.startsWith('http') ? photo : `${API_URL}${photo}`);
          }
          if (data.full_name) {
             const parts = data.full_name.trim().split(' ');
             if (parts.length > 1) {
                setInitials((parts[0][0] + parts[parts.length - 1][0]).toUpperCase());
             } else if (parts[0]) {
                setInitials(parts[0].substring(0, 2).toUpperCase());
             }
          }
        }
      } catch (err) {
        console.error("Failed to fetch header profile:", err);
      }
    };

    fetchHeaderProfile();
  }, []);

  const handleLogout = () => {
    const currentRole = localStorage.getItem("role");
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    sessionStorage.removeItem("glowsense_chat_session");
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
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="GlowSense AI Logo" className="h-8 w-auto object-contain" />
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
                GlowSense AI
              </span>
            </div>
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
      <div className={`flex-1 md:ml-0 flex flex-col ${pathname === "/dashboard/ai-assistant" ? "h-screen" : "min-h-screen"}`}>
        {/* Header */}
        {pathname !== "/dashboard/ai-assistant" && (
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
            <NotificationBell role={role} />
            <div className="h-10 w-10 rounded-full bg-pink-100 border-2 border-pink-200 overflow-hidden shadow-sm flex items-center justify-center flex-shrink-0">
              {profilePhoto ? (
                <img 
                  src={profilePhoto} 
                  alt="Profile" 
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.nextElementSibling) {
                      e.currentTarget.nextElementSibling.classList.remove('hidden');
                    }
                  }}
                />
              ) : null}
              <div className={`${profilePhoto ? 'hidden' : ''} w-full h-full flex items-center justify-center text-sm font-bold text-pink-500`}>
                {initials}
              </div>
            </div>
          </div>
        </header>
        )}

        <main className={pathname === "/dashboard/ai-assistant" ? "flex-1 h-full w-full" : "p-6"}>
          {children}
        </main>
      </div>
    </div>
  );
}

