'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { useAuth, OperationType, handleFirestoreError } from '@/components/FirebaseProvider';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';
import { motion } from 'motion/react';
import { Briefcase, Star, MapPin, Scale, Award, BookOpen, Clock, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';

export default function AttorneyProfilePage() {
  const { uid } = useParams();
  const [attorney, setAttorney] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!uid) return;
      try {
        // Fetch Attorney Profile
        const docRef = doc(db, 'attorneyProfiles', uid as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setAttorney({ id: docSnap.id, ...docSnap.data() });
        } else {
          setAttorney(null);
        }

        // Fetch Attorney Services
        const qServices = query(collection(db, 'legalServices'), where('attorneyId', '==', uid));
        const servicesSnap = await getDocs(qServices);
        setServices(servicesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `attorneyProfiles/${uid}`);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [uid]);

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-zinc-800 border-t-yellow-500 rounded-full animate-spin" />
      </main>
    );
  }

  if (!attorney) {
    return (
      <main className="min-h-screen bg-zinc-950">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 pt-32 text-center">
          <Briefcase className="h-16 w-16 text-zinc-800 mx-auto mb-6" />
          <h1 className="text-3xl font-black uppercase tracking-tighter text-zinc-100 mb-4">Profile Not Found</h1>
          <p className="text-zinc-500 mb-8">The attorney profile you are looking for does not exist.</p>
          <Link href="/attorneys" className="text-yellow-500 font-bold uppercase tracking-widest hover:text-yellow-400 transition-colors">
            &larr; Back to Directory
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-20 bg-zinc-950">
      <Navbar />
      
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Link href="/attorneys" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-yellow-500 transition-colors mb-8">
            <ChevronLeft className="h-4 w-4" />
            Back to Directory
          </Link>
          
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="h-32 w-32 rounded-3xl bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-700">
              <Briefcase className="h-12 w-12 text-zinc-500" />
            </div>
            <div>
              <h1 className="font-display text-4xl md:text-5xl font-black uppercase tracking-tighter text-zinc-100 mb-2">
                {attorney.name}
              </h1>
              <div className="flex flex-wrap gap-4 text-sm font-bold uppercase tracking-widest text-zinc-500 mb-6">
                <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {attorney.yearsOfExperience} Years Exp.</span>
                <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> Licensed in {attorney.barAdmissions?.length || 0} States</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {attorney.specializations?.map((spec: string) => (
                  <span key={spec} className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-[10px] font-bold uppercase tracking-widest text-yellow-500">
                    {spec}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-12">
          
          {/* Bio */}
          {attorney.bio && (
            <section>
              <h2 className="text-xl font-bold text-zinc-100 uppercase tracking-tight flex items-center gap-2 mb-6">
                <BookOpen className="h-5 w-5 text-zinc-500" />
                About
              </h2>
              <div className="prose prose-invert prose-zinc max-w-none prose-p:leading-relaxed prose-p:text-zinc-400">
                <ReactMarkdown>{attorney.bio}</ReactMarkdown>
              </div>
            </section>
          )}

          {/* Services */}
          <section>
            <h2 className="text-xl font-bold text-zinc-100 uppercase tracking-tight flex items-center gap-2 mb-6">
              <Scale className="h-5 w-5 text-zinc-500" />
              Services Offered
            </h2>
            <div className="space-y-4">
              {services.map(service => (
                <div key={service.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-zinc-100">{service.title}</h3>
                    <span className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-[10px] font-bold uppercase tracking-widest text-yellow-500 whitespace-nowrap ml-4">
                      {service.feeType}
                    </span>
                  </div>
                  <p className="text-zinc-400 text-sm mb-4">{service.description}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{service.category}</span>
                    <span className="font-bold text-zinc-100">{service.feeAmount}</span>
                  </div>
                </div>
              ))}
              {services.length === 0 && (
                <p className="text-zinc-500 italic">No services listed yet.</p>
              )}
            </div>
          </section>

          {/* Testimonials */}
          {attorney.testimonials && attorney.testimonials.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-zinc-100 uppercase tracking-tight flex items-center gap-2 mb-6">
                <Star className="h-5 w-5 text-zinc-500" />
                Client Testimonials
              </h2>
              <div className="grid gap-6">
                {attorney.testimonials.map((test: any, i: number) => (
                  <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 relative">
                    <Star className="absolute top-6 right-6 h-8 w-8 text-zinc-800/50" />
                    <p className="text-zinc-300 italic mb-4 relative z-10">&quot;{test.quote}&quot;</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-500">— {test.author}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* Bar Admissions */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
            <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-widest flex items-center gap-2 mb-4">
              <Award className="h-4 w-4 text-zinc-500" />
              Bar Admissions
            </h3>
            <ul className="space-y-3">
              {attorney.barAdmissions?.map((state: string) => (
                <li key={state} className="flex items-center gap-3 text-sm text-zinc-400">
                  <div className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
                  {state}
                </li>
              ))}
              {(!attorney.barAdmissions || attorney.barAdmissions.length === 0) && (
                <li className="text-sm text-zinc-500 italic">Not specified</li>
              )}
            </ul>
          </div>

          {/* Contact / CTA */}
          <div className="bg-yellow-500 rounded-3xl p-6 text-zinc-950">
            <h3 className="font-black uppercase tracking-tighter text-xl mb-2">Request Consultation</h3>
            <p className="text-sm font-medium mb-6 opacity-90">
              Connect with {attorney.name} to discuss your cooperative&apos;s legal needs.
            </p>
            <Link 
              href={`/legal?attorney=${attorney.id}`}
              className="block w-full text-center bg-zinc-950 text-yellow-500 font-bold uppercase tracking-widest py-4 rounded-xl hover:bg-zinc-900 transition-colors"
            >
              Contact Attorney
            </Link>
          </div>

        </div>

      </div>
    </main>
  );
}
