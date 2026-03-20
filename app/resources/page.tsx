'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { useAuth, OperationType, handleFirestoreError } from '@/components/FirebaseProvider';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Package, Plus, Search, Filter, Hammer, Building, GraduationCap, Coins, MapPin } from 'lucide-react';

export default function ResourcesPage() {
  const { user } = useAuth();
  const [resources, setResources] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newResource, setNewResource] = useState({ title: '', description: '', type: 'tool', category: '' });
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) {
      return;
    }
    const q = query(collection(db, 'resources'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setResources(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'resources');
    });
    return () => unsubscribe();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await addDoc(collection(db, 'resources'), {
        ...newResource,
        ownerUid: user.uid,
        moderationStatus: 'pending',
        createdAt: serverTimestamp(),
      });
      setNewResource({ title: '', description: '', type: 'tool', category: '' });
      setIsAdding(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'resources');
    }
  };

  const filteredResources = resources.filter(r => {
    const isApproved = r.moderationStatus === 'approved';
    const matchesFilter = filter === 'all' || r.type === filter;
    const matchesSearch = r.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          r.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.category?.toLowerCase().includes(searchQuery.toLowerCase());
    return isApproved && matchesFilter && matchesSearch;
  });

  const typeIcons: any = {
    tool: Hammer,
    space: Building,
    expertise: GraduationCap,
    funding: Coins,
  };

  return (
    <main className="min-h-screen pb-20">
      <Navbar />
      
      <div className="mx-auto max-w-7xl px-4 pt-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div>
            <h1 className="font-display text-4xl font-black uppercase tracking-tighter text-zinc-100">
              Shared <span className="text-yellow-500">Resources</span>
            </h1>
            <p className="text-zinc-500 mt-2">Collective assets for cooperative growth.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded-full pl-12 pr-6 py-3 text-sm text-zinc-100 focus:outline-none focus:border-yellow-500 transition-all w-full md:w-64"
              />
            </div>
            
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-full p-1">
              {['all', 'tool', 'space', 'expertise', 'funding'].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
                    filter === t ? 'bg-yellow-500 text-zinc-950' : 'text-zinc-500 hover:text-zinc-100'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {user && (
              <button
                onClick={() => setIsAdding(!isAdding)}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-yellow-500 text-zinc-950 font-bold uppercase tracking-tighter hover:bg-yellow-400 transition-all"
              >
                <Plus className="h-5 w-5" />
                Share
              </button>
            )}
          </div>
        </div>

        <AnimatePresence>
          {isAdding && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-12"
            >
              <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Resource Title</label>
                  <input
                    required
                    value={newResource.title}
                    onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-yellow-500 transition-colors"
                    placeholder="e.g., Industrial 3D Printer"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Resource Type</label>
                  <select
                    value={newResource.type}
                    onChange={(e) => setNewResource({ ...newResource, type: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-yellow-500 transition-colors"
                  >
                    <option value="tool">Tool / Equipment</option>
                    <option value="space">Physical Space</option>
                    <option value="expertise">Expertise / Mentorship</option>
                    <option value="funding">Funding / Grants</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Category (Optional)</label>
                  <input
                    value={newResource.category}
                    onChange={(e) => setNewResource({ ...newResource, category: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-yellow-500 transition-colors"
                    placeholder="e.g., Legal, Tech, Agriculture"
                  />
                </div>
                <div className="space-y-2 md:col-span-3">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Description</label>
                  <textarea
                    required
                    rows={3}
                    value={newResource.description}
                    onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-yellow-500 transition-colors resize-none"
                    placeholder="Describe the resource and terms of sharing..."
                  />
                </div>
                <div className="md:col-span-3 flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-6 py-2 rounded-full text-zinc-400 hover:text-zinc-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-2 rounded-full bg-yellow-500 text-zinc-950 font-bold uppercase tracking-tighter hover:bg-yellow-400 transition-all"
                  >
                    Add Resource
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((resource) => {
            const Icon = typeIcons[resource.type] || Package;
            return (
              <motion.div
                layout
                key={resource.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="group bg-zinc-950 border border-zinc-800 rounded-3xl p-8 hover:border-yellow-500/30 transition-all flex flex-col"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="h-12 w-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-yellow-500 group-hover:bg-yellow-500 group-hover:text-zinc-950 transition-all">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex gap-2">
                    {resource.category && (
                      <div className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                        {resource.category}
                      </div>
                    )}
                    <div className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                      {resource.type}
                    </div>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-zinc-100 mb-3 uppercase tracking-tight group-hover:text-yellow-500 transition-colors">
                  {resource.title}
                </h3>
                
                <p className="text-zinc-500 text-sm leading-relaxed mb-8 flex-grow">
                  {resource.description}
                </p>
                
                <div className="flex items-center justify-between pt-6 border-t border-zinc-900">
                  <div className="flex items-center gap-2 text-xs text-zinc-600">
                    <MapPin className="h-3 w-3" />
                    B-PREC Network
                  </div>
                  <button className="text-xs font-bold uppercase tracking-widest text-yellow-500 hover:text-yellow-400 transition-colors">
                    Request Access
                  </button>
                </div>
              </motion.div>
            );
          })}
          
          {filteredResources.length === 0 && (
            <div className="col-span-full text-center py-20 bg-zinc-900/30 rounded-3xl border border-dashed border-zinc-800">
              <Package className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500">No resources found in this category.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
