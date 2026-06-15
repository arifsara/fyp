"use client";

import { ScanFace, Camera, Users, Calendar, ArrowRight, Star, Sparkles, TrendingUp, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen font-sans">

      {/* ═══════════════════════════════════════════════════════ */}
      {/* HERO SECTION                                           */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">

        {/* Background Image & Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/girl2.png"
            alt="Hero Background"
            fill
            priority
            className="object-cover object-center"
          />
        </div>
        <div className="absolute inset-0 z-10 hero-overlay" />

        {/* Hero Content */}
        <motion.div
          className="container relative z-20 mx-auto px-6 text-center text-white flex flex-col items-center max-w-4xl"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >

          <motion.div variants={fadeUp}>
            <h1 className="text-hero font-bold tracking-tight mb-6">
              Personalized Beauty, <br className="hidden md:block" />
              <span className="text-primary-light">Elevated by AI.</span>
            </h1>
          </motion.div>

          <motion.div variants={fadeUp}>
            <p className="text-body-fluid text-white/90 max-w-2xl mx-auto mb-10 font-light">
              Discover your perfect skincare routine and try on makeup virtually with unparalleled precision. Experience the future of premium beauty.
            </p>
          </motion.div>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto">
            <Link href="/signup" className="w-full sm:w-auto block">
              <button className="btn-primary-gradient w-full text-lg">
                Discover Your Glow
              </button>
            </Link>
            <Link href="/dashboard/ar-try-on" className="w-full sm:w-auto block">
              <button className="btn-secondary-outline w-full text-lg border-white/40 text-white hover:bg-white/10 hover:text-white">
                Try AR Studio
              </button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* TRUSTED BEAUTY TECH                                    */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="section-padding bg-transparent border-b border-border/50">
        <div className="container mx-auto px-6">
          <p className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-8">
            Trusted by Beauty Professionals Worldwide
          </p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Placeholder logos for premium feel */}
            <div className="text-xl font-bold tracking-widest text-foreground">VOGUE</div>
            <div className="text-xl font-bold tracking-widest text-foreground">SEPHORA</div>
            <div className="text-xl font-bold tracking-widest text-foreground">ALLURE</div>
            <div className="text-xl font-bold tracking-widest text-foreground">ELLE</div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* FEATURES SECTION                                       */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="section-padding relative bg-transparent">
        <div className="container mx-auto px-6 max-w-[1280px]">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-16 md:mb-24"
          >
            <motion.h2 variants={fadeUp} className="text-section font-bold text-foreground mb-6">
              Intelligent Beauty Architecture
            </motion.h2>
            <motion.p variants={fadeUp} className="text-body-fluid text-secondary-foreground max-w-2xl mx-auto font-light">
              We merge clinical dermatology principles with cutting-edge computer vision to deliver an experience tailored exclusively to you.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: ScanFace,
                title: "AI Skin Analysis",
                desc: "Clinical-grade face scanning to identify hydration, texture, and specific concerns."
              },
              {
                icon: Sparkles,
                title: "Product Matching",
                desc: "Curated selections from top brands matched precisely to your unique skin profile."
              },
              {
                icon: Camera,
                title: "AR Virtual Studio",
                desc: "Hyper-realistic makeup simulation that adapts to your facial geometry and lighting."
              },
              {
                icon: TrendingUp,
                title: "Beauty Insights",
                desc: "Track your skin's progress over time and refine your regimen with data-driven advice."
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="glass-card feature-card card-padding flex flex-col items-center text-center"
              >
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-6 text-primary">
                  <feature.icon className="h-7 w-7" />
                </div>
                <h3 className="text-card font-semibold text-foreground mb-3">{feature.title}</h3>
                <p className="text-body-fluid text-secondary-foreground font-light">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* HOW IT WORKS                                           */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="section-padding bg-transparent overflow-hidden">
        <div className="container mx-auto px-6 max-w-[1280px]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={staggerContainer}
              className="relative"
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary-light/30 rounded-full blur-[100px] pointer-events-none" />

              <motion.div variants={fadeUp} className="glass-card p-8 md:p-12 relative z-10 border border-primary/10">
                <div className="space-y-10">
                  {[
                    { step: "1", title: "Upload Your Photo", desc: "Start with a simple selfie. Our secure system analyzes your unique features." },
                    { step: "2", title: "AI Skin Analysis", desc: "Proprietary algorithms assess your skin health, tone, and specific needs." },
                    { step: "3", title: "Receive Personalized Insights", desc: "Get a bespoke routine tailored precisely to your goals." },
                    { step: "4", title: "Build Your Beauty Routine", desc: "Shop curated recommendations and track your transformation." }
                  ].map((s, i) => (
                    <div key={i} className="flex gap-6 group">
                      <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl shrink-0 transition-all duration-300 group-hover:bg-primary group-hover:text-white group-hover:shadow-lg group-hover:shadow-primary/30">
                        {s.step}
                      </div>
                      <div>
                        <h4 className="text-card font-semibold text-foreground mb-2">{s.title}</h4>
                        <p className="text-body-fluid text-secondary-foreground font-light">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}
            >
              <h2 className="text-section font-bold text-foreground mb-6">
                Your Journey to <br className="hidden lg:block" />Radiant Confidence
              </h2>
              <p className="text-body-fluid text-secondary-foreground mb-10 font-light">
                We've simplified the path to perfect skin and flawless makeup. GlowSense AI acts as your personal beauty concierge, available 24/7 to guide your choices with scientific precision.
              </p>

              <ul className="space-y-4 mb-10">
                {["Dermatologist-approved algorithms", "Real-time AR rendering", "Unbiased product matching", "Privacy-first architecture"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-foreground font-medium">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    {item}
                  </li>
                ))}
              </ul>

              <Link href="/signup" className="block w-full sm:w-auto">
                <button className="btn-primary-gradient w-full sm:w-auto">
                  Begin Your Analysis
                </button>
              </Link>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* TESTIMONIALS                                           */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="section-padding bg-transparent relative">
        <div className="container mx-auto px-6 max-w-[1280px]">
          <div className="text-center mb-16">
            <h2 className="text-section font-bold text-foreground mb-4">
              Real Results, Real Glow
            </h2>
            <p className="text-body-fluid text-secondary-foreground font-light">Join thousands who have revolutionized their beauty routines.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: "Isabella M.", role: "Beauty Editor", text: "The most accurate shade matching I've ever experienced. It literally completely replaced my trial-and-error process at the store." },
              { name: "Chloe T.", role: "Skincare Enthusiast", text: "The AI noticed hydration issues I couldn't even see yet. Within three weeks of following the recommended routine, my skin is transformed." },
              { name: "Sophia L.", role: "Makeup Artist", text: "I use GlowSense with my clients now. The AR try-on is incredibly realistic and helps them visualize the final look instantly." }
            ].map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="glass-card card-padding flex flex-col"
              >
                <div className="flex gap-1 mb-6">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-5 w-5 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-body-fluid text-foreground/90 font-light italic mb-8 flex-1">
                  "{t.text}"
                </p>
                <div>
                  <p className="text-card font-bold text-foreground">{t.name}</p>
                  <p className="text-body-fluid text-secondary-foreground">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* FINAL CTA                                              */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="section-padding px-6 bg-transparent">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.7 }}
          className="container mx-auto max-w-5xl"
        >
          <div className="glass-card relative overflow-hidden p-12 md:p-20 text-center border border-primary/20 bg-primary/5">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px]" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-dark/10 rounded-full blur-[80px]" />

            <div className="relative z-10 max-w-2xl mx-auto space-y-8">
              <h2 className="text-section font-bold text-foreground leading-tight">
                Ready to Meet Your <br className="hidden sm:block" />Best Skin?
              </h2>
              <p className="text-body-fluid text-secondary-foreground font-light">
                Join GlowSense AI today and unlock a world of personalized beauty recommendations, clinical insights, and professional artistry.
              </p>
              <Link href="/signup" className="inline-block w-full sm:w-auto">
                <button className="btn-primary-gradient w-full sm:w-auto text-lg px-10 shadow-xl">
                  Create Your Free Profile
                </button>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

    </div>
  );
}
