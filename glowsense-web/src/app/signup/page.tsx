import Link from "next/link";
import { User, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SignupRoleSelectionPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-background py-12 px-4">
      <div className="text-center mb-12 space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/5 p-2">
          <img src="/logo.png" alt="GlowSense AI Logo" className="h-12 w-auto object-contain" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Join GlowSense AI</h1>
        <p className="text-lg text-muted-foreground">Choose your account type to get started</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        {/* Customer Card */}
        <Link href="/signup/customer" className="group">
          <div className="h-full p-8 rounded-3xl border-2 border-border bg-white hover:border-primary/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center cursor-pointer">
            <div className="h-20 w-20 rounded-2xl bg-pink-50 flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
              <User className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Customer Account</h2>
            <p className="text-muted-foreground mb-6">
              Book appointments, analyze your skin, and discover beauty trends.
            </p>
            <Button className="w-full text-lg h-12 rounded-xl group-hover:bg-primary/90">
              Join as Customer
            </Button>
          </div>
        </Link>

        {/* Provider Card */}
        <Link href="/signup/provider" className="group">
          <div className="h-full p-8 rounded-3xl border-2 border-border bg-white hover:border-purple-500/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center cursor-pointer">
            <div className="h-20 w-20 rounded-2xl bg-purple-50 flex items-center justify-center mb-6 text-purple-600 group-hover:scale-110 transition-transform">
              <Briefcase className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Business Account</h2>
            <p className="text-muted-foreground mb-6">
              List services, manage schedule, and find new clients.
            </p>
            <Button className="w-full text-lg h-12 rounded-xl bg-purple-600 hover:bg-purple-700">
              Join as Expert
            </Button>
          </div>
        </Link>
      </div>
      
      <div className="mt-12 text-center text-sm text-muted-foreground">
        Already have an account? <Link href="/login" className="underline hover:text-primary">Login here</Link>
      </div>
    </div>
  );
}
