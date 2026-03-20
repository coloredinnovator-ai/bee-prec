'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { useAuth, OperationType, handleFirestoreError } from '@/components/FirebaseProvider';
import { doc, getDoc, setDoc, collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase';
import { motion } from 'motion/react';
import { Briefcase, Plus, Trash2, Edit2, Save, X, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AttorneyProfileEditor() {
  const { user, profile } = useAuth();
  const router = useRouter();
  
  const [attorney, setAttorney] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState<number>(0);
  const [barAdmissions, setBarAdmissions] = useState<string>(''); // comma separated
  const [specializations, setSpecializations] = useState<string>(''); // comma separated
  
  const [isEditingService, setIsEditingService] = useState<string | null>(null);
  const [newService, setNewService] = useState({
    title: '',
    category: '',
    description: '',
    feeType: 'flat',
    feeAmount: ''
  });

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    if (profile?.role !== 'lawyer' && profile?.role !== 'admin') {
      router.push('/attorneys');
      return;
    }

    const fetchProfile = async () => {
      try {
        const docRef = doc(db, 'attorneyProfiles', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setAttorney({ id: docSnap.id, ...data });
          setName(data.name || '');
          setBio(data.bio || '');
          setYearsOfExperience(data.yearsOfExperience || 0);
          setBarAdmissions((data.barAdmissions || []).join(', '));
          setSpecializations((data.specializations || []).join(', '));
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `attorneyProfiles/${user.uid}`);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();

    const qServices = query(collection(db, 'legalServices'), where('attorneyId', '==', user.uid));
    const unsubServices = onSnapshot(qServices, (snapshot) => {
      setServices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'legalServices');
    });

    return () => unsubServices();
  }, [user, profile, router]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    try {
      const profileData = {
        uid: user.uid,
        name,
        bio,
        yearsOfExperience: Number(yearsOfExperience),
        barAdmissions: barAdmissions.split(',').map(s => s.trim()).filter(Boolean),
        specializations: specializations.split(',').map(s => s.trim()).filter(Boolean),
        updatedAt: serverTimestamp(),
      };

      if (!attorney) {
        await setDoc(doc(db, 'attorneyProfiles', user.uid), {
          ...profileData,
          createdAt: serverTimestamp(),
        });
      } else {
        await updateDoc(doc(db, 'attorneyProfiles', user.uid), profileData);
      }
      
      // Update local state to reflect changes
      setAttorney({ ...attorney, ...profileData });
      alert('Profile saved successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `attorneyProfiles/${user.uid}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    try {
      const serviceData = {
        attorneyId: user.uid,
        attorneyName: name || profile?.displayName || user.email,
        ...newService,
      };

      if (isEditingService === 'new') {
        await addDoc(collection(db, 'legalServices'), {
          ...serviceData,
          createdAt: serverTimestamp(),
        });
      } else if (isEditingService) {
        await updateDoc(doc(db, 'legalServices', isEditingService), serviceData);
      }

      setIsEditingService(null);
      setNewService({ title: '', category: '', description: '', feeType: 'flat', feeAmount: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'legalServices');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    try {
      await deleteDoc(doc(db, 'legalServices', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `legalServices/${id}`);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-zinc-800 border-t-yellow-500 rounded-full animate-spin" />
      </main>
    );
  }

  if (!user || (profile?.role !== 'lawyer' && profile?.role !== 'admin')) {
    return null; // Handled by useEffect redirect
  }

  return (
    <main className="min-h-screen pb-20 bg-zinc-950">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 pt-32">
        <div className="mb-12">
          <h1 className="font-display text-4xl font-black uppercase tracking-tighter text-zinc-100">
            Attorney <span className="text-yellow-500">Dashboard</span>
          </h1>
          <p className="text-zinc-500 mt-2">Manage your public profile and service catalog.</p>
        </div>

        <div className="grid grid-cols-1 gap-12">
          
          {/* Profile Editor */}
          <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
            <h2 className="text-xl font-bold text-zinc-100 uppercase tracking-tight flex items-center gap-2 mb-8">
              <Briefcase className="h-5 w-5 text-yellow-500" />
              Public Profile
            </h2>

            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Full Name</label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-yellow-500 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Years of Experience</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={yearsOfExperience}
                    onChange={(e) => setYearsOfExperience(parseInt(e.target.value) || 0)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-yellow-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Bar Admissions (Comma separated)</label>
                <input
                  value={barAdmissions}
                  onChange={(e) => setBarAdmissions(e.target.value)}
                  placeholder="e.g., New York, California"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-yellow-500 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Specializations (Comma separated)</label>
                <input
                  value={specializations}
                  onChange={(e) => setSpecializations(e.target.value)}
                  placeholder="e.g., Co-op Formation, Governance, Dispute Resolution"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-yellow-500 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Biography (Markdown supported)</label>
                <textarea
                  rows={6}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-yellow-500 transition-colors resize-y"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-yellow-500 text-zinc-950 rounded-xl font-bold uppercase tracking-widest hover:bg-yellow-400 disabled:opacity-50 transition-colors"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </section>

          {/* Services Editor */}
          <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-zinc-100 uppercase tracking-tight flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-yellow-500" />
                Service Catalog
              </h2>
              {!isEditingService && (
                <button
                  onClick={() => setIsEditingService('new')}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-zinc-100 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-zinc-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add Service
                </button>
              )}
            </div>

            {isEditingService && (
              <form onSubmit={handleSaveService} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 mb-8 space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-yellow-500">
                    {isEditingService === 'new' ? 'New Service' : 'Edit Service'}
                  </h3>
                  <button type="button" onClick={() => setIsEditingService(null)} className="text-zinc-500 hover:text-zinc-300">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Service Title</label>
                    <input
                      required
                      value={newService.title}
                      onChange={(e) => setNewService({...newService, title: e.target.value})}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Category</label>
                    <input
                      required
                      value={newService.category}
                      onChange={(e) => setNewService({...newService, category: e.target.value})}
                      placeholder="e.g., Incorporation"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Fee Type</label>
                    <select
                      value={newService.feeType}
                      onChange={(e) => setNewService({...newService, feeType: e.target.value})}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:border-yellow-500"
                    >
                      <option value="flat">Flat Fee</option>
                      <option value="hourly">Hourly Rate</option>
                      <option value="sliding-scale">Sliding Scale</option>
                      <option value="consultation">Consultation</option>
                      <option value="contingency">Contingency</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Fee Amount</label>
                    <input
                      required
                      value={newService.feeAmount}
                      onChange={(e) => setNewService({...newService, feeAmount: e.target.value})}
                      placeholder="e.g., $500 or $150/hr"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Description</label>
                  <textarea
                    required
                    rows={3}
                    value={newService.description}
                    onChange={(e) => setNewService({...newService, description: e.target.value})}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:border-yellow-500 resize-y"
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2 bg-yellow-500 text-zinc-950 rounded-lg font-bold uppercase tracking-widest hover:bg-yellow-400 disabled:opacity-50 transition-colors"
                  >
                    {saving ? 'Saving...' : 'Save Service'}
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {services.map(service => (
                <div key={service.id} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
                  <div className="flex-grow">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-zinc-100">{service.title}</h3>
                      <span className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded-md text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                        {service.category}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-400 line-clamp-2 mb-2">{service.description}</p>
                    <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-yellow-500">
                      <span>{service.feeType}</span>
                      <span>•</span>
                      <span>{service.feeAmount}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setNewService(service);
                        setIsEditingService(service.id);
                      }}
                      className="p-2 text-zinc-500 hover:text-zinc-300 bg-zinc-900 rounded-lg transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteService(service.id)}
                      className="p-2 text-red-500 hover:text-red-400 bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              {services.length === 0 && !isEditingService && (
                <div className="text-center py-12 border border-dashed border-zinc-800 rounded-2xl">
                  <p className="text-zinc-500 text-sm">You haven't added any services yet.</p>
                </div>
              )}
            </div>
          </section>

        </div>
      </div>
    </main>
  );
}
