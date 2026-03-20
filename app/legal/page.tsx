'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Navbar } from '@/components/Navbar';
import { StatusNotice } from '@/components/StatusNotice';
import { useAuth, OperationType, handleFirestoreError } from '@/components/FirebaseProvider';
import { collection, addDoc, query, where, onSnapshot, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Send, Bot, Clock, CheckCircle2, AlertCircle, Scale, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useSearchParams } from 'next/navigation';

function LegalPageContent() {
  const { user, profile } = useAuth();
  const searchParams = useSearchParams();
  const attorneyId = searchParams.get('attorney');
  
  const [consultations, setConsultations] = useState<any[]>([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAttorney, setSelectedAttorney] = useState<any>(null);
  const [submissionNotice, setSubmissionNotice] = useState<{
    tone: 'error' | 'info' | 'success';
    message: string;
  } | null>(null);

  useEffect(() => {
    if (attorneyId) {
      const fetchAttorney = async () => {
        try {
          const docRef = doc(db, 'attorneyProfiles', attorneyId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setSelectedAttorney({ id: docSnap.id, ...docSnap.data() });
          }
        } catch (error) {
          console.error("Error fetching attorney:", error);
        }
      };
      fetchAttorney();
    }
  }, [attorneyId]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'consultations'),
      where('createdBy', '==', user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => {
          const left = a.createdAt?.toDate?.()?.getTime?.() || 0;
          const right = b.createdAt?.toDate?.()?.getTime?.() || 0;
          return right - left;
        });

      setConsultations(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'consultations');
    });
    return () => unsubscribe();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !subject || !message) return;
    setIsSubmitting(true);
    setSubmissionNotice(null);

    try {
      let aiText = '';
      if (!selectedAttorney) {
        const token = await user.getIdToken();
        const aiResponse = await fetch('/api/legal-assist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            subject,
            message,
          }),
        });

        const aiPayload = await aiResponse.json();

        if (!aiResponse.ok) {
          throw new Error(aiPayload.error || 'Failed to generate legal guidance.');
        }

        aiText =
          aiPayload.response ||
          "I'm sorry, I couldn't generate a response at this time.";
      }

      const clientName =
        (profile?.displayName || user.displayName || user.email || 'Unknown').slice(0, 80);
      const payload: Record<string, any> = {
        createdBy: user.uid,
        clientName,
        topic: subject,
        area: selectedAttorney ? 'directAttorney' : 'AI Consultation',
        consultationMode: selectedAttorney ? 'direct_attorney' : 'ai_guidance',
        notes: message,
        status: selectedAttorney ? 'attorney_review' : 'ai_responded',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        deleted: false
      };

      const preferredContact = user.email && user.email.length <= 80 ? user.email : null;
      if (preferredContact) {
        payload.preferredContact = preferredContact;
      }
      if (!selectedAttorney && aiText) {
        payload.aiResponse = aiText;
      }
      if (selectedAttorney?.id) {
        payload.assignedTo = selectedAttorney.id;
      }
      if (selectedAttorney?.name) {
        payload.assignedAttorneyName = selectedAttorney.name;
      }

      await addDoc(collection(db, 'consultations'), payload);

      setSubject('');
      setMessage('');
      setSubmissionNotice({
        tone: 'success',
        message: selectedAttorney
          ? `Your consultation request has been sent to ${selectedAttorney.name}.`
          : 'Your AI consultation has been recorded and added to your history.',
      });
    } catch (error) {
      console.error('Consultation submission failed:', error);
      setSubmissionNotice({
        tone: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to submit your consultation.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen pb-20">
      <Navbar />
      
      <div className="mx-auto max-w-6xl px-4 pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Left Column: Form */}
          <div className="lg:col-span-1 space-y-8">
            <div>
              <h1 className="font-display text-4xl font-black uppercase tracking-tighter text-zinc-100">
                Legal <span className="text-yellow-500">Nexus</span>
              </h1>
              <p className="text-zinc-500 mt-2">
                {selectedAttorney ? `Request a consultation with ${selectedAttorney.name}.` : 'AI-assisted guidance for cooperative legal matters.'}
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl">
              {submissionNotice && (
                <StatusNotice
                  tone={submissionNotice.tone}
                  message={submissionNotice.message}
                  className="mb-6"
                />
              )}

              {selectedAttorney ? (
                <div className="flex items-center gap-3 mb-6 p-3 bg-zinc-800/50 rounded-2xl border border-zinc-700">
                  <User className="h-5 w-5 text-zinc-400 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 leading-tight">
                      Consulting with
                    </p>
                    <p className="text-sm font-bold text-zinc-200">{selectedAttorney.name}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 mb-6 p-3 bg-yellow-500/10 rounded-2xl border border-yellow-500/20">
                  <AlertCircle className="h-5 w-5 text-yellow-500 shrink-0" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-500 leading-tight">
                    AI Guidance is not a substitute for professional legal advice.
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Subject</label>
                  <input
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-yellow-500 transition-colors"
                    placeholder="e.g., Co-op Incorporation"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Your Question</label>
                  <textarea
                    required
                    rows={6}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-yellow-500 transition-colors resize-none"
                    placeholder="Describe your legal concern..."
                  />
                </div>
                <button
                  disabled={isSubmitting || !user}
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-yellow-500 text-zinc-950 font-black uppercase tracking-tighter hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isSubmitting ? (
                    <div className="h-5 w-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      {selectedAttorney ? 'Request Consultation' : 'Consult AI'}
                    </>
                  )}
                </button>
                {!user && (
                  <p className="text-center text-xs text-zinc-600 mt-2 uppercase font-bold tracking-widest">
                    Please connect to consult the Nexus
                  </p>
                )}
              </form>
            </div>

            <div className="p-6 rounded-3xl bg-zinc-900/30 border border-zinc-800">
              <div className="flex items-center gap-3 mb-4">
                <Scale className="h-5 w-5 text-zinc-400" />
                <h3 className="font-bold text-zinc-100 uppercase tracking-tight">Attorney Review</h3>
              </div>
              <p className="text-sm text-zinc-500 leading-relaxed">
                All AI consultations can be flagged for review by our network of cooperative attorneys. 
                We ensure that your collective interests are protected by human expertise.
              </p>
            </div>
          </div>

          {/* Right Column: History */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold text-zinc-100 uppercase tracking-tight flex items-center gap-2">
              <Clock className="h-5 w-5 text-zinc-500" />
              Consultation History
            </h2>

            <div className="space-y-6">
              {consultations.map((consult) => (
                <motion.div
                  layout
                  key={consult.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden"
                >
                  <div className="p-6 border-b border-zinc-900 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-zinc-100">{consult.topic || consult.subject}</h3>
                      <p className="text-xs text-zinc-500 mt-1">
                        {consult.createdAt?.toDate ? new Date(consult.createdAt.toDate()).toLocaleString() : 'Just now'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 text-[10px] font-bold uppercase tracking-widest text-yellow-500 border border-yellow-500/20">
                      <CheckCircle2 className="h-3 w-3" />
                      {consult.status?.replace('_', ' ')}
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-6">
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Your Inquiry</p>
                      <p className="text-zinc-400 text-sm leading-relaxed">{consult.notes || consult.message}</p>
                    </div>

                    {consult.assignedAttorneyName && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Assigned Attorney</p>
                        <p className="text-zinc-300 text-sm">{consult.assignedAttorneyName}</p>
                      </div>
                    )}

                    {consult.attorneyResponse && (
                      <div className="space-y-3 p-6 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                        <div className="flex items-center gap-2 text-yellow-500">
                          <Scale className="h-4 w-4" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">
                            Attorney Response
                          </span>
                        </div>
                        <div className="prose prose-invert prose-sm max-w-none text-zinc-300">
                          <ReactMarkdown>{consult.attorneyResponse}</ReactMarkdown>
                        </div>
                        {consult.attorneyRespondedAt?.toDate && (
                          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                            Responded {new Date(consult.attorneyRespondedAt.toDate()).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}
                    
                    {consult.aiResponse && (
                      <div className="space-y-3 p-6 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                        <div className="flex items-center gap-2 text-yellow-500">
                          <Bot className="h-4 w-4" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Nexus AI Response</span>
                        </div>
                        <div className="prose prose-invert prose-sm max-w-none text-zinc-300">
                          <ReactMarkdown>{consult.aiResponse}</ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {consultations.length === 0 && (
                <div className="text-center py-20 bg-zinc-900/30 rounded-3xl border border-dashed border-zinc-800">
                  <Shield className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
                  <p className="text-zinc-500">No consultations yet. Submit your first inquiry to the Nexus.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}

export default function LegalPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 flex items-center justify-center"><div className="h-8 w-8 border-4 border-zinc-800 border-t-yellow-500 rounded-full animate-spin" /></div>}>
      <LegalPageContent />
    </Suspense>
  );
}
