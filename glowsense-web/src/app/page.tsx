import { ScanFace, Camera, Users, Calendar, ArrowRight, Star, Sparkles } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">

      {/* ═══════════════════════════════════════════════════════ */}
      {/* HERO SECTION                                           */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="relative pt-28 pb-0 md:pt-40 overflow-hidden min-h-[92vh] flex flex-col items-center">

        {/* ── Ambient blob background ── */}
        <div className="hero-blob hero-blob-pink"   aria-hidden="true" />
        <div className="hero-blob hero-blob-purple" aria-hidden="true" />
        <div className="hero-blob hero-blob-peach"  aria-hidden="true" />

        {/* ── Hero content ── */}
        <div className="container relative mx-auto px-4 md:px-6 flex flex-col items-center text-center space-y-7 z-10">

          {/* Pill badge */}
          <div className="animate-fade-in-up animation-delay-100 inline-flex items-center gap-2 bg-white/70 border border-pink-200 rounded-full px-4 py-1.5 text-sm font-semibold text-pink-600 shadow-sm backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-pink-500" />
            Now with AI Beauty Concierge
          </div>

          {/* Main heading */}
          <h1 className="animate-fade-in-up animation-delay-200 text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.05] max-w-4xl">
            {/* "Beauty Built" stays charcoal — warm dark, not pure black */}
            <span className="text-[#1C1120]">Beauty Built&nbsp;</span>
            {/* "Smart." gets the gradient + glow */}
            <span className="hero-gradient-text">Smart.</span>
          </h1>

          {/* Sub-heading — slightly darker, well-wrapped */}
          <p className="animate-fade-in-up animation-delay-300 text-lg md:text-xl text-[#5C5470] max-w-[560px] leading-relaxed font-medium">
            AI-powered skin analysis, AR makeup previews,<br className="hidden md:block" />
            and trusted beauty bookings — all in one place.
          </p>

          {/* CTA Buttons */}
          <div className="animate-fade-in-up animation-delay-400 flex flex-col sm:flex-row gap-4">
            <Link href="/dashboard/ar-try-on">
              <button className="btn-primary-gradient inline-flex items-center gap-2 rounded-full text-base font-bold h-13 px-9 py-3.5 cursor-pointer">
                <Camera className="h-4 w-4" />
                Try AR Demo
              </button>
            </Link>
            <Link href="/signup">
              <button className="btn-secondary-outline inline-flex items-center gap-2 rounded-full text-base font-bold h-13 px-9 py-3.5 cursor-pointer">
                Sign Up Free
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="animate-fade-in-up animation-delay-500 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-[#5C5470] font-medium">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" />
              No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400 inline-block" />
              Free AI skin analysis
            </span>
            <span className="flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              4.9 / 5 from 1,200+ users
            </span>
          </div>

          {/* ── Dashboard preview card ── */}
          <div className="hero-preview-card animate-fade-in-up animation-delay-500 mt-14 w-full max-w-5xl mx-auto overflow-hidden">
            {/* Fake browser chrome strip */}
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-gray-100 bg-gray-50/80">
              <span className="h-3 w-3 rounded-full bg-red-400 opacity-80" />
              <span className="h-3 w-3 rounded-full bg-yellow-400 opacity-80" />
              <span className="h-3 w-3 rounded-full bg-green-400 opacity-80" />
              <span className="mx-auto text-xs text-gray-400 font-medium tracking-wide">
                app.glowsense.ai — AI Dashboard
              </span>
            </div>

            {/* Preview body */}
            <div className="aspect-video bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center relative overflow-hidden">
              {/* Fake UI skeleton elements for visual depth */}
              <div className="absolute inset-0 grid grid-cols-3 gap-4 p-8 opacity-60 pointer-events-none">
                <div className="col-span-2 space-y-3">
                  <div className="h-3 rounded-full bg-pink-200 w-3/4" />
                  <div className="h-3 rounded-full bg-purple-100 w-1/2" />
                  <div className="mt-4 h-32 rounded-2xl bg-gradient-to-br from-pink-100 to-rose-50 border border-pink-100" />
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-pink-200" />
                    <div className="h-8 flex-1 rounded-full bg-gray-100" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-24 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-50 border border-purple-100" />
                  <div className="h-3 rounded-full bg-gray-100 w-4/5" />
                  <div className="h-3 rounded-full bg-gray-100 w-3/5" />
                  <div className="h-8 rounded-xl bg-gradient-to-r from-pink-400 to-purple-400 opacity-80" />
                </div>
              </div>
              {/* Central label */}
              <div className="relative z-10 text-center bg-white/80 backdrop-blur-sm border border-pink-100 rounded-2xl px-8 py-5 shadow-sm">
                <ScanFace className="h-8 w-8 text-pink-500 mx-auto mb-2" />
                <p className="text-base font-bold text-[#1C1120]">Skin Analysis &amp; AR Makeup Interface</p>
                <p className="text-sm text-[#5C5470] mt-1">Powered by GlowSense AI</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* KEY FEATURES                                           */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section id="features" className="py-28 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <span className="inline-block text-sm font-bold text-pink-500 tracking-widest uppercase mb-3">
              What We Offer
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#1C1120] mb-4">
              Everything for Your Beauty Journey
            </h2>
            <p className="text-[#5C5470] text-lg max-w-xl mx-auto">
              Intelligent tools and expert connections designed around you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: ScanFace,
                title: "AI Skin Analysis",
                description: "Personalized skincare recommendations powered by advanced computer vision.",
                color: "from-pink-50 to-rose-50",
                iconColor: "text-pink-500 bg-pink-100"
              },
              {
                icon: Camera,
                title: "AR Virtual Makeup",
                description: "Try on lipstick, eyeshadow, and more in real-time before you buy.",
                color: "from-purple-50 to-violet-50",
                iconColor: "text-violet-500 bg-violet-100"
              },
              {
                icon: Users,
                title: "Verified Experts",
                description: "Connect with top-rated beauty professionals and dermatologists.",
                color: "from-sky-50 to-blue-50",
                iconColor: "text-sky-500 bg-sky-100"
              },
              {
                icon: Calendar,
                title: "Smart Booking",
                description: "Seamlessly schedule appointments with automated reminders.",
                color: "from-amber-50 to-orange-50",
                iconColor: "text-amber-500 bg-amber-100"
              }
            ].map((feature, index) => (
              <div key={index} className={`feature-card flex flex-col items-center text-center p-7 rounded-2xl bg-gradient-to-br ${feature.color}`}>
                <div className={`h-14 w-14 rounded-2xl ${feature.iconColor} flex items-center justify-center mb-5`}>
                  <feature.icon className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-bold text-[#1C1120] mb-2">{feature.title}</h3>
                <p className="text-sm text-[#5C5470] leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* HOW IT WORKS                                           */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="py-28 bg-gradient-to-br from-[#FFF5F7] via-white to-purple-50/40 relative overflow-hidden">
        {/* Subtle background accent */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-pink-100 rounded-full filter blur-3xl opacity-40 pointer-events-none" />
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block text-sm font-bold text-pink-500 tracking-widest uppercase mb-3">
                Simple Process
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#1C1120] mb-8">
                How It Works
              </h2>
              <div className="space-y-8">
                {[
                  { step: "Upload your photo or use live camera.", detail: "Snap or upload — our AI handles the rest instantly." },
                  { step: "Get personalized AI analysis.", detail: "Receive tailored skin insights and product matches." },
                  { step: "Book with a trusted professional.", detail: "Schedule with verified beauty experts near you." }
                ].map(({ step, detail }, index) => (
                  <div key={index} className="flex items-start gap-5 group">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-md shadow-pink-200 group-hover:scale-110 transition-transform">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-base font-bold text-[#1C1120]">{step}</p>
                      <p className="text-sm text-[#5C5470] mt-0.5">{detail}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-10">
                <Link href="/signup">
                  <button className="btn-primary-gradient inline-flex items-center gap-2 rounded-full text-sm font-bold px-7 py-3 cursor-pointer">
                    Start Your Journey
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
              </div>
            </div>

            <div className="relative h-[480px] rounded-3xl overflow-hidden shadow-xl border border-pink-100 bg-gradient-to-br from-pink-50 via-white to-purple-50">
              {/* Decorative inner elements */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-4 p-8">
                  <div className="h-20 w-20 mx-auto rounded-2xl bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center shadow-lg">
                    <ScanFace className="h-10 w-10 text-white" />
                  </div>
                  <p className="text-[#1C1120] font-bold text-lg">Step-by-Step Visual Walkthrough</p>
                  <p className="text-sm text-[#5C5470]">Interactive demo coming soon</p>
                </div>
              </div>
              {/* Floating badge */}
              <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-sm border border-pink-100 rounded-xl px-4 py-2 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-xs font-semibold text-emerald-600">AI Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* TESTIMONIALS                                           */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="py-28 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <span className="inline-block text-sm font-bold text-pink-500 tracking-widest uppercase mb-3">
              Social Proof
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#1C1120] mb-4">
              Loved by Beauty Enthusiasts
            </h2>
            <p className="text-[#5C5470] text-lg">Real results from real people.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Sophia R.",
                role: "Skincare Enthusiast",
                initials: "SR",
                avatarColor: "from-pink-400 to-rose-500",
                quote: "This app is a game-changer! The AI skin analysis is so accurate, and the AR makeup previews help me choose the perfect shades every time.",
                rating: 5
              },
              {
                name: "Olivia M.",
                role: "Beauty Blogger",
                initials: "OM",
                avatarColor: "from-violet-400 to-purple-500",
                quote: "I love the convenience of booking appointments with verified professionals. It's saved me so much time and the recommendations are spot-on.",
                rating: 5
              },
              {
                name: "Emma L.",
                role: "Makeup Artist",
                initials: "EL",
                avatarColor: "from-amber-400 to-orange-500",
                quote: "The personalized recommendations based on my skin analysis have transformed my routine. The AR try-on is the most realistic I've ever seen.",
                rating: 5
              }
            ].map((t, index) => (
              <div key={index} className="feature-card p-8 rounded-2xl flex flex-col gap-5">
                {/* Stars */}
                <div className="flex gap-1">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                {/* Quote */}
                <p className="text-[#3D3350] italic leading-relaxed text-sm flex-1">
                  &ldquo;{t.quote}&rdquo;
                </p>
                {/* Author */}
                <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                  <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${t.avatarColor} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="font-bold text-[#1C1120] text-sm">{t.name}</p>
                    <p className="text-xs text-[#5C5470]">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* FINAL CTA                                              */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <div className="relative rounded-3xl overflow-hidden p-12 md:p-20 text-center text-white"
               style={{ background: "linear-gradient(135deg, #1C1120 0%, #2D1250 50%, #1C1120 100%)" }}>
            {/* Blob overlays inside CTA */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute -top-20 -right-20 w-80 h-80 bg-pink-500 rounded-full filter blur-3xl opacity-20" />
              <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-purple-600 rounded-full filter blur-3xl opacity-20" />
            </div>

            <div className="relative z-10 max-w-2xl mx-auto space-y-7">
              <span className="inline-block text-sm font-bold text-pink-400 tracking-widest uppercase">
                Get Started Today
              </span>
              <h2 className="text-3xl md:text-5xl font-extrabold leading-tight">
                Discover Personalized<br />
                <span className="hero-gradient-text">Beauty Intelligence</span>
              </h2>
              <p className="text-gray-300 text-lg">
                Sign up now for AI-based personalized beauty insights and professional services.
              </p>
              <Link href="/signup">
                <button className="btn-primary-gradient inline-flex items-center gap-2 rounded-full text-base font-bold px-10 py-4 mt-2 cursor-pointer">
                  Join Free Today
                  <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
