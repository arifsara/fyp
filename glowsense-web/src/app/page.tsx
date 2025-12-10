import { Button } from "@/components/ui/button";
import { ScanFace, Camera, Users, Calendar, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 md:pt-32 md:pb-48 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
        <div className="container relative mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center text-center space-y-8">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              Beauty Built <span className="text-primary">Smart</span>.
            </h1>
            <p className="text-xl text-muted-foreground max-w-[700px] md:text-2xl">
              AI-powered skin analysis, AR makeup previews, and trusted beauty bookings — all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 min-w-[200px]">
              <Link href="/ar-demo">
                <Button size="lg" className="w-full sm:w-auto text-lg h-12 px-8">
                  Try AR Demo
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto text-lg h-12 px-8">
                  Sign Up Free
                </Button>
              </Link>
            </div>
            
            {/* Hero Image Placeholder */}
            <div className="mt-12 w-full max-w-4xl mx-auto rounded-3xl shadow-2xl overflow-hidden border border-border bg-white aspect-video relative">
               {/* In a real app, replace with actual Next.js Image */}
               <div className="absolute inset-0 flex items-center justify-center bg-muted/30 text-muted-foreground">
                 <div className="text-center">
                   <p className="text-lg font-medium">App Dashboard Preview</p>
                   <p className="text-sm">Skin Analysis & AR Makeup Interface</p>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section id="features" className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Key Features</h2>
            <p className="text-muted-foreground text-lg">Everything you need for your personalized beauty journey.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: ScanFace,
                title: "AI Skin Analysis",
                description: "Get personalized skincare recommendations based on advanced AI scans."
              },
              {
                icon: Camera,
                title: "AR Virtual Makeup",
                description: "Try on lipstick, eyeshadow, and more in real-time before you buy."
              },
              {
                icon: Users,
                title: "Verified Experts",
                description: "Connect with top-rated beauty professionals and dermatologists."
              },
              {
                icon: Calendar,
                title: "Smart Booking",
                description: "Seamlessly schedule appointments with automated reminders."
              }
            ].map((feature, index) => (
              <div key={index} className="flex flex-col items-center text-center p-6 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors border border-transparent hover:border-primary/10">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <feature.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">How It Works</h2>
              <div className="space-y-8">
                {[
                  "Upload your photo or use live camera.",
                  "Get personalized AI analysis and product matches.",
                  "Book with a trusted professional near you."
                ].map((step, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center font-bold shrink-0">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-lg font-medium">{step}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Link href="/signup">
                  <Button variant="link" className="text-primary p-0 h-auto text-lg">
                    Start your journey <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative h-[500px] rounded-3xl bg-white shadow-xl overflow-hidden border border-border">
               {/* Placeholder for How It Works Image */}
               <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/5 to-purple-500/5">
                 <p className="text-muted-foreground font-medium">Step-by-Step Walkthrough UI</p>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Testimonials</h2>
            <p className="text-muted-foreground text-lg">Loved by beauty enthusiasts everywhere.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Sophia R.",
                quote: "This app is a game-changer! The AI skin analysis is so accurate, and the AR makeup previews help me choose the perfect shades every time."
              },
              {
                name: "Olivia M.",
                quote: "I love the convenience of booking appointments with verified professionals through this app. It's saved me so much time and hassle."
              },
              {
                name: "Emma L.",
                quote: "The personalized recommendations based on my skin analysis have improved my skincare routine significantly. I'm so happy with the results!"
              }
            ].map((testimonial, index) => (
              <div key={index} className="p-8 rounded-2xl bg-muted/30 border border-border/50">
                <div className="flex flex-col items-center text-center">
                  <div className="h-16 w-16 rounded-full bg-gray-200 mb-4" /> {/* Avatar Placeholder */}
                  <h4 className="font-semibold text-lg mb-2">{testimonial.name}</h4>
                  <p className="text-muted-foreground italic">"{testimonial.quote}"</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="bg-black text-white rounded-3xl p-12 md:p-24 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-500/20" />
            <div className="relative z-10 max-w-2xl mx-auto space-y-8">
              <h2 className="text-3xl md:text-5xl font-bold">Discover Personalized Beauty Today!</h2>
              <p className="text-gray-300 text-lg">Sign up now for AI-based personalized beauty insights and professional services.</p>
              <Link href="/signup">
                <Button size="lg" className="text-lg px-10 h-14 bg-primary hover:bg-primary-dark text-white border-none">
                  Join Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
