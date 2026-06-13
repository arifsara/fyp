import Link from "next/link";
import { User, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RoleSelectionPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-background py-12 px-4">
      <div className="text-center mb-12 space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/5 p-2 animate-pulse">
          <img src="/logo.png" alt="GlowSense AI Logo" className="h-12 w-auto object-contain" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Welcome to GlowSense AI</h1>
        <p className="text-lg text-muted-foreground">Please select how you want to continue</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        {/* Customer Card */}
        <Link href="/login/customer" className="group">
          <div className="h-full p-8 rounded-3xl border-2 border-border bg-white hover:border-primary/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center cursor-pointer">
            <div className="h-20 w-20 rounded-2xl bg-pink-50 flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
              <User className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-bold mb-3">I'm a Customer</h2>
            <p className="text-muted-foreground mb-6">
              I want to book beauty services, get skin analysis, and try AR makeup.
            </p>
            <Button className="w-full text-lg h-12 rounded-xl group-hover:bg-primary/90">
              Continue as Customer
            </Button>
          </div>
        </Link>

        {/* Provider Card */}
        <Link href="/login/provider" className="group">
          <div className="h-full p-8 rounded-3xl border-2 border-border bg-white hover:border-purple-500/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center cursor-pointer">
            <div className="h-20 w-20 rounded-2xl bg-purple-50 flex items-center justify-center mb-6 text-purple-600 group-hover:scale-110 transition-transform">
              <Briefcase className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-bold mb-3">I'm a Beauty Expert</h2>
            <p className="text-muted-foreground mb-6">
              I want to list my services, manage bookings, and grow my business.
            </p>
            <Button className="w-full text-lg h-12 rounded-xl bg-purple-600 hover:bg-purple-700">
              Continue as Expert
            </Button>
          </div>
        </Link>
      </div>
      
      <div className="mt-12 text-center text-sm text-muted-foreground">
        Don't have an account? <Link href="/signup" className="underline hover:text-primary">Sign up here</Link>
      </div>
    </div>
  );
}
