'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/components/FirebaseProvider';
import { db } from '@/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, updateDoc, deleteDoc, where } from 'firebase/firestore';
import { Loader2, AlertCircle, Plus, Wrench, CheckCircle2, Clock, Trash2, X } from 'lucide-react';

interface MaintenanceTicket {
  id: string;
  title: string;
  description: string;
  unitId: string;
  reportedBy: string;
  status: 'open' | 'in-progress' | 'resolved';
  createdAt: any;
}

export default function MaintenancePage() {
  const { user, profile, isAuthReady } = useAuth();
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [unitId, setUnitId] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user || !profile) return;

    const canManageTickets = ['lawyer', 'admin', 'board', 'maintenance'].includes(profile.role);
    
    let q;
    if (canManageTickets) {
      q = query(collection(db, 'maintenance_tickets'), orderBy('createdAt', 'desc'));
    } else {
      q = query(collection(db, 'maintenance_tickets'), where('reportedBy', '==', user.uid), orderBy('createdAt', 'desc'));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ticketData: MaintenanceTicket[] = [];
      snapshot.forEach((doc) => {
        ticketData.push({ id: doc.id, ...doc.data() } as MaintenanceTicket);
      });
      setTickets(ticketData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching tickets:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim() || !description.trim() || !unitId.trim()) {
      setFormError('Please fill in all fields.');
      return;
    }

    try {
      setIsSubmitting(true);
      await addDoc(collection(db, 'maintenance_tickets'), {
        title: title.trim(),
        description: description.trim(),
        unitId: unitId.trim(),
        reportedBy: user?.uid,
        status: 'open',
        createdAt: serverTimestamp(),
      });
      
      setTitle('');
      setDescription('');
      setUnitId('');
      setIsAdding(false);
    } catch (error) {
      console.error("Error adding ticket:", error);
      setFormError('Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateStatus = async (id: string, newStatus: MaintenanceTicket['status']) => {
    try {
      await updateDoc(doc(db, 'maintenance_tickets', id), {
        status: newStatus
      });
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status.");
    }
  };

  const deleteTicket = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this ticket?")) return;
    try {
      await deleteDoc(doc(db, 'maintenance_tickets', id));
    } catch (error) {
      console.error("Error deleting ticket:", error);
      alert("Failed to delete ticket.");
    }
  };

  if (!isAuthReady || loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-amber-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-50">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] px-4 text-center">
          <AlertCircle className="h-16 w-16 text-amber-600 mb-6" />
          <h1 className="text-3xl font-black text-stone-900 uppercase tracking-tighter mb-4">Access Denied</h1>
          <p className="text-stone-600 max-w-md">Please connect your account to access maintenance requests.</p>
        </div>
      </div>
    );
  }

  const canManageTickets = profile?.role === 'board' || profile?.role === 'maintenance';

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans">
      <Navbar />
      
      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter text-stone-900 flex items-center gap-3">
              <Wrench className="h-8 w-8 text-amber-600" />
              Maintenance
            </h1>
            <p className="text-stone-500 mt-2">Submit and track maintenance requests for your unit.</p>
          </div>
          
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-stone-50 bg-amber-600 hover:bg-amber-500 transition-colors"
          >
            {isAdding ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            {isAdding ? 'Cancel' : 'New Request'}
          </button>
        </div>

        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 md:p-8 mb-12"
          >
            <h2 className="text-2xl font-bold text-stone-900 mb-6">Submit Maintenance Request</h2>
            
            {formError && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-stone-700 uppercase tracking-wider mb-2">Issue Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Leaky Faucet"
                    className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 uppercase tracking-wider mb-2">Unit Number</label>
                  <input
                    type="text"
                    value={unitId}
                    onChange={(e) => setUnitId(e.target.value)}
                    placeholder="e.g., 4B"
                    className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-stone-700 uppercase tracking-wider mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please describe the issue in detail..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3 rounded-xl font-bold text-stone-50 bg-stone-900 hover:bg-stone-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Submit Request'}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        <div className="space-y-6">
          {tickets.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-stone-200">
              <Wrench className="h-12 w-12 text-stone-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-stone-900">No maintenance requests</h3>
              <p className="text-stone-500">There are currently no open maintenance tickets.</p>
            </div>
          ) : (
            tickets.map((ticket) => (
              <motion.div 
                key={ticket.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 flex flex-col md:flex-row gap-6"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-stone-100 text-stone-600">
                      Unit {ticket.unitId}
                    </span>
                    <StatusBadge status={ticket.status} />
                  </div>
                  <h3 className="text-xl font-bold text-stone-900 mb-2">{ticket.title}</h3>
                  <p className="text-stone-600 mb-4">{ticket.description}</p>
                  <div className="text-sm text-stone-400 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {ticket.createdAt?.toDate().toLocaleDateString()}
                  </div>
                </div>

                {canManageTickets && (
                  <div className="flex flex-row md:flex-col gap-2 justify-end border-t md:border-t-0 md:border-l border-stone-100 pt-4 md:pt-0 md:pl-6">
                    <select
                      value={ticket.status}
                      onChange={(e) => updateStatus(ticket.id, e.target.value as any)}
                      className="px-4 py-2 rounded-xl bg-stone-50 border border-stone-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="open">Open</option>
                      <option value="in-progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                    
                    <button
                      onClick={() => deleteTicket(ticket.id)}
                      className="px-4 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: MaintenanceTicket['status'] }) {
  switch (status) {
    case 'open':
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-100 text-red-700 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" /> Open
        </span>
      );
    case 'in-progress':
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-700 flex items-center gap-1">
          <Clock className="h-3 w-3" /> In Progress
        </span>
      );
    case 'resolved':
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" /> Resolved
        </span>
      );
  }
}
