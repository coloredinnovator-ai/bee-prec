'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/components/FirebaseProvider';
import { db } from '@/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, deleteDoc } from 'firebase/firestore';
import { Loader2, AlertCircle, Plus, FileText, Clock, Trash2, X } from 'lucide-react';

interface MeetingMinute {
  id: string;
  title: string;
  content: string;
  date: any;
  recordedBy: string;
}

export default function MeetingMinutesPage() {
  const { user, profile, isAuthReady } = useAuth();
  const [minutes, setMinutes] = useState<MeetingMinute[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'meeting_minutes'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const minutesData: MeetingMinute[] = [];
      snapshot.forEach((doc) => {
        minutesData.push({ id: doc.id, ...doc.data() } as MeetingMinute);
      });
      setMinutes(minutesData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching meeting minutes:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim() || !content.trim()) {
      setFormError('Please fill in all fields.');
      return;
    }

    try {
      setIsSubmitting(true);
      await addDoc(collection(db, 'meeting_minutes'), {
        title: title.trim(),
        content: content.trim(),
        recordedBy: user?.uid,
        date: serverTimestamp(),
      });
      
      setTitle('');
      setContent('');
      setIsAdding(false);
    } catch (error) {
      console.error("Error adding meeting minute:", error);
      setFormError('Failed to save minutes. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteMinute = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete these minutes?")) return;
    try {
      await deleteDoc(doc(db, 'meeting_minutes', id));
    } catch (error) {
      console.error("Error deleting minutes:", error);
      alert("Failed to delete minutes.");
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
          <p className="text-stone-600 max-w-md">Please connect your account to access meeting minutes.</p>
        </div>
      </div>
    );
  }

  const canManageMinutes = profile?.role === 'board';

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans">
      <Navbar />
      
      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter text-stone-900 flex items-center gap-3">
              <FileText className="h-8 w-8 text-amber-600" />
              Meeting Minutes
            </h1>
            <p className="text-stone-500 mt-2">Review official records of board and community meetings.</p>
          </div>
          
          {canManageMinutes && (
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-stone-50 bg-amber-600 hover:bg-amber-500 transition-colors"
            >
              {isAdding ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              {isAdding ? 'Cancel' : 'Record Minutes'}
            </button>
          )}
        </div>

        {isAdding && canManageMinutes && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 md:p-8 mb-12"
          >
            <h2 className="text-2xl font-bold text-stone-900 mb-6">Record New Minutes</h2>
            
            {formError && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-stone-700 uppercase tracking-wider mb-2">Meeting Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Q3 General Board Meeting"
                  className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-stone-700 uppercase tracking-wider mb-2">Minutes Content</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Record the minutes here..."
                  rows={10}
                  className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none font-mono text-sm"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3 rounded-xl font-bold text-stone-50 bg-stone-900 hover:bg-stone-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save Minutes'}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        <div className="space-y-6">
          {minutes.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-stone-200">
              <FileText className="h-12 w-12 text-stone-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-stone-900">No minutes recorded</h3>
              <p className="text-stone-500">There are currently no meeting minutes available.</p>
            </div>
          ) : (
            minutes.map((minute) => (
              <motion.div 
                key={minute.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 flex flex-col md:flex-row gap-6"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-700 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {minute.date?.toDate().toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-stone-900 mb-4">{minute.title}</h3>
                  <div className="prose prose-stone max-w-none text-stone-600 whitespace-pre-wrap font-serif">
                    {minute.content}
                  </div>
                </div>

                {canManageMinutes && (
                  <div className="flex flex-row md:flex-col gap-2 justify-end border-t md:border-t-0 md:border-l border-stone-100 pt-4 md:pt-0 md:pl-6">
                    <button
                      onClick={() => deleteMinute(minute.id)}
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
