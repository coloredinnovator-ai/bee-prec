'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { useAuth, OperationType, handleFirestoreError } from '@/components/FirebaseProvider';
import { collection, query, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase';
import { motion } from 'motion/react';
import { Search, Filter, Briefcase, Star, MapPin, Scale, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function ServiceCatalogPage() {
  const { user, profile } = useAuth();
  const [attorneys, setAttorneys] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'services' | 'attorneys'>('services');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    // Fetch Attorneys
    const qAttorneys = query(collection(db, 'attorneyProfiles'));
    const unsubAttorneys = onSnapshot(qAttorneys, (snapshot) => {
      setAttorneys(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'attorneyProfiles');
    });

    // Fetch Services
    const qServices = query(collection(db, 'legalServices'));
    const unsubServices = onSnapshot(qServices, (snapshot) => {
      setServices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'legalServices');
    });

    return () => {
      unsubAttorneys();
      unsubServices();
    };
  }, []);

  const categories = ['all', ...Array.from(new Set(services.map(s => s.category)))];

  const filteredServices = services.filter(service => {
    const matchesSearch = service.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          service.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredAttorneys = attorneys.filter(attorney => {
    return attorney.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           attorney.specializations?.some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  return (
    <main className="min-h-screen pb-20 bg-zinc-950">
      <Navbar />
      
      {/* Hero Section */}
      <div className="bg-zinc-900 border-b border-zinc-800 pt-24 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="font-display text-5xl font-black uppercase tracking-tighter text-zinc-100 mb-4">
            Legal <span className="text-yellow-500">Service Catalog</span>
          </h1>
          <p className="text-zinc-400 max-w-2xl text-lg">
            Browse specialized legal services for cooperatives or find the right attorney for your needs.
          </p>

          {/* Search and Filter Bar */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
              <input
                type="text"
                placeholder="Search services, attorneys, or specializations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl pl-12 pr-4 py-4 text-zinc-100 focus:outline-none focus:border-yellow-500 transition-colors"
              />
            </div>
            {activeTab === 'services' && (
              <div className="relative min-w-[200px]">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl pl-12 pr-4 py-4 text-zinc-100 focus:outline-none focus:border-yellow-500 transition-colors appearance-none"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat === 'all' ? 'All Categories' : cat}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mt-8 border-b border-zinc-800">
            <button
              onClick={() => setActiveTab('services')}
              className={`pb-4 px-2 text-sm font-bold uppercase tracking-widest transition-colors relative ${
                activeTab === 'services' ? 'text-yellow-500' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Legal Services
              {activeTab === 'services' && (
                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-500" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('attorneys')}
              className={`pb-4 px-2 text-sm font-bold uppercase tracking-widest transition-colors relative ${
                activeTab === 'attorneys' ? 'text-yellow-500' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Attorney Directory
              {activeTab === 'attorneys' && (
                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-500" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {activeTab === 'services' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map(service => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col hover:border-yellow-500/50 transition-colors group"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="px-3 py-1 bg-zinc-950 border border-zinc-800 rounded-full text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    {service.category}
                  </span>
                  <span className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-[10px] font-bold uppercase tracking-widest text-yellow-500">
                    {service.feeType}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-zinc-100 mb-2">{service.title}</h3>
                <p className="text-zinc-400 text-sm line-clamp-3 mb-6 flex-grow">
                  {service.description}
                </p>
                <div className="mt-auto pt-6 border-t border-zinc-800 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Provided By</p>
                    <Link href={`/attorneys/${service.attorneyId}`} className="text-sm font-medium text-zinc-300 hover:text-yellow-500 transition-colors">
                      {service.attorneyName}
                    </Link>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Fee</p>
                    <p className="text-lg font-bold text-zinc-100">{service.feeAmount}</p>
                  </div>
                </div>
              </motion.div>
            ))}
            {filteredServices.length === 0 && (
              <div className="col-span-full text-center py-20">
                <Scale className="h-12 w-12 text-zinc-800 mx-auto mb-4" />
                <p className="text-zinc-500">No services found matching your criteria.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredAttorneys.map(attorney => (
              <Link key={attorney.id} href={`/attorneys/${attorney.id}`}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex items-start gap-6 hover:border-yellow-500/50 transition-colors group"
                >
                  <div className="h-20 w-20 rounded-2xl bg-zinc-800 flex items-center justify-center shrink-0">
                    <Briefcase className="h-8 w-8 text-zinc-500" />
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-xl font-bold text-zinc-100 group-hover:text-yellow-500 transition-colors flex items-center gap-2">
                      {attorney.name}
                      <ChevronRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h3>
                    <p className="text-sm text-zinc-400 mt-1">
                      {attorney.yearsOfExperience} Years Experience
                    </p>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {attorney.specializations?.slice(0, 3).map((spec: string) => (
                        <span key={spec} className="px-2 py-1 bg-zinc-950 border border-zinc-800 rounded-md text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                          {spec}
                        </span>
                      ))}
                      {attorney.specializations?.length > 3 && (
                        <span className="px-2 py-1 bg-zinc-950 border border-zinc-800 rounded-md text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                          +{attorney.specializations.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
            {filteredAttorneys.length === 0 && (
              <div className="col-span-full text-center py-20">
                <Briefcase className="h-12 w-12 text-zinc-800 mx-auto mb-4" />
                <p className="text-zinc-500">No attorneys found matching your criteria.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
