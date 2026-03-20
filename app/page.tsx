'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Navbar } from '@/components/Navbar';
import { HeavyMetalBee } from '@/components/HeavyMetalBee';
import { Shield, Users, Zap, Scale, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(234,179,8,0.05),transparent_70%)]" />
        
        <div className="mx-auto max-w-7xl relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-xs font-bold uppercase tracking-widest mb-6">
                <Zap className="h-3 w-3" />
                Cooperative Legal Nexus
              </div>
              
              <h1 className="font-display text-6xl md:text-8xl font-black tracking-tighter text-zinc-100 leading-[0.85] mb-8 uppercase">
                B-PREC <br />
                <span className="text-yellow-500">Nexus</span>
              </h1>
              
              <p className="text-xl text-zinc-400 max-w-xl mb-10 leading-relaxed">
                The premier digital ecosystem for cooperative enterprises. 
                Founded on the principles of the Aleut Nation: sharing resources, 
                minimizing costs, and collective legal empowerment.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/forum"
                  className="px-8 py-4 rounded-full bg-yellow-500 text-zinc-950 font-black uppercase tracking-tighter hover:bg-yellow-400 transition-all flex items-center gap-2 group"
                >
                  Join the Swarm
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/legal"
                  className="px-8 py-4 rounded-full bg-zinc-900 text-zinc-100 font-black uppercase tracking-tighter border border-zinc-800 hover:bg-zinc-800 transition-all"
                >
                  Legal Aid
                </Link>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="relative flex justify-center"
            >
              <div className="absolute inset-0 bg-yellow-500/20 blur-[100px] rounded-full" />
              <HeavyMetalBee className="w-full max-w-md" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-zinc-900/50 border-y border-zinc-800">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={Users}
              title="Community Forum"
              description="Connect with other co-op enthusiasts, share insights, and build collective knowledge."
              href="/forum"
            />
            <FeatureCard
              icon={Scale}
              title="Legal Nexus"
              description="Access AI-assisted legal guidance and professional attorney services tailored for co-ops."
              href="/legal"
            />
            <FeatureCard
              icon={Shield}
              title="Resource Sharing"
              description="Minimize overhead by sharing tools, spaces, and expertise within the B-PREC network."
              href="/resources"
            />
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-32 px-4">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-display text-4xl md:text-6xl font-black uppercase tracking-tighter text-zinc-100 mb-8">
            The Vision of <span className="text-yellow-500">B-PREC</span>
          </h2>
          <p className="text-lg text-zinc-400 leading-relaxed mb-12 italic font-serif">
            &quot;Rooted in the wisdom of the Aleut Nation, we believe that true strength 
            comes from the swarm. By sharing the burden of legal costs and physical 
            resources, we empower the individual through the collective.&quot;
          </p>
          <div className="h-px w-24 bg-yellow-500 mx-auto" />
        </div>
      </section>
    </main>
  );
}

function FeatureCard({ icon: Icon, title, description, href }: { icon: any, title: string, description: string, href: string }) {
  return (
    <Link href={href} className="group block p-8 rounded-3xl bg-zinc-950 border border-zinc-800 hover:border-yellow-500/50 transition-all">
      <div className="h-12 w-12 rounded-2xl bg-zinc-900 flex items-center justify-center mb-6 group-hover:bg-yellow-500 group-hover:text-zinc-950 transition-colors">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-xl font-bold text-zinc-100 mb-3 uppercase tracking-tight">{title}</h3>
      <p className="text-zinc-500 leading-relaxed">{description}</p>
    </Link>
  );
}
