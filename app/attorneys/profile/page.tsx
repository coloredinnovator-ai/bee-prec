'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { StatusNotice } from '@/components/StatusNotice';
import { useAuth, OperationType, handleFirestoreError } from '@/components/FirebaseProvider';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '@/firebase';
import { Briefcase, Edit2, MessageSquare, Plus, Save, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Notice = {
  tone: 'error' | 'info' | 'success';
  message: string;
};

type ServiceDraft = {
  title: string;
  category: string;
  description: string;
  feeType: string;
  feeAmount: string;
};

const emptyService: ServiceDraft = {
  title: '',
  category: '',
  description: '',
  feeType: 'flat',
  feeAmount: '',
};

export default function AttorneyProfileEditor() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const isConsultationTriage = profile?.role === 'admin' || profile?.role === 'board';

  const [attorney, setAttorney] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [consultationActionId, setConsultationActionId] = useState<string | null>(null);
  const [consultationDrafts, setConsultationDrafts] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<Notice | null>(null);

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState<number>(0);
  const [barAdmissions, setBarAdmissions] = useState<string>('');
  const [specializations, setSpecializations] = useState<string>('');

  const [isEditingService, setIsEditingService] = useState<string | null>(null);
  const [newService, setNewService] = useState<ServiceDraft>(emptyService);

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
    const unsubServices = onSnapshot(
      qServices,
      (snapshot) => {
        setServices(snapshot.docs.map((serviceDoc) => ({ id: serviceDoc.id, ...serviceDoc.data() })));
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'legalServices');
      }
    );

    const consultationQuery = isConsultationTriage
      ? collection(db, 'consultations')
      : query(collection(db, 'consultations'), where('assignedTo', '==', user.uid));

    const unsubConsultations = onSnapshot(
      consultationQuery,
      (snapshot) => {
        const items = snapshot.docs
          .map((consultDoc): any => ({ id: consultDoc.id, ...consultDoc.data() }))
          .filter((item) => !item.deleted)
          .sort((a, b) => {
            const left = a.updatedAt?.toDate?.()?.getTime?.() || a.createdAt?.toDate?.()?.getTime?.() || 0;
            const right = b.updatedAt?.toDate?.()?.getTime?.() || b.createdAt?.toDate?.()?.getTime?.() || 0;
            return right - left;
          });
        setConsultations(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'consultations');
      }
    );

    return () => {
      unsubServices();
      unsubConsultations();
    };
  }, [isConsultationTriage, user, profile, router]);

  const attorneyDisplayName =
    (name || attorney?.name || profile?.displayName || user?.displayName || user?.email || 'Attorney').slice(0, 120);

  const directAttorneyConsultations = consultations.filter(
    (consultation) =>
      consultation.area === 'directAttorney' || consultation.consultationMode === 'direct_attorney'
  );

  const unassignedConsultations = isConsultationTriage
    ? directAttorneyConsultations.filter(
        (consultation) => !consultation.assignedTo && consultation.status !== 'closed'
      )
    : [];

  const myConsultations = directAttorneyConsultations.filter(
    (consultation) => consultation.assignedTo === user?.uid
  );

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setNotice(null);

    try {
      const profileData = {
        uid: user.uid,
        name,
        bio,
        yearsOfExperience: Number(yearsOfExperience),
        barAdmissions: barAdmissions.split(',').map((entry) => entry.trim()).filter(Boolean),
        specializations: specializations.split(',').map((entry) => entry.trim()).filter(Boolean),
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

      setAttorney((current: any) => ({ ...(current || {}), ...profileData }));
      setNotice({
        tone: 'success',
        message: 'Attorney profile saved.',
      });
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
    setNotice(null);

    try {
      const serviceData = {
        attorneyId: user.uid,
        attorneyName: attorneyDisplayName,
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
      setNewService(emptyService);
      setNotice({
        tone: 'success',
        message: 'Service catalog updated.',
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'legalServices');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('Delete this service from your public catalog?')) return;

    try {
      await deleteDoc(doc(db, 'legalServices', id));
      setNotice({
        tone: 'success',
        message: 'Service removed.',
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `legalServices/${id}`);
    }
  };

  const handleClaimConsultation = async (consultation: any) => {
    if (!user) return;

    try {
      setConsultationActionId(consultation.id);
      await updateDoc(doc(db, 'consultations', consultation.id), {
        assignedTo: user.uid,
        assignedAttorneyName: attorneyDisplayName,
        consultationMode: 'direct_attorney',
        status: 'attorney_review',
        updatedAt: serverTimestamp(),
      });
      setNotice({
        tone: 'success',
        message: `Claimed consultation "${consultation.topic}".`,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `consultations/${consultation.id}`);
    } finally {
      setConsultationActionId(null);
    }
  };

  const handleConsultationResponse = async (consultation: any, closeAfterResponse: boolean) => {
    if (!user) return;

    const responseText = (consultationDrafts[consultation.id] ?? consultation.attorneyResponse ?? '').trim();
    if (!responseText) {
      setNotice({
        tone: 'error',
        message: 'Enter a response before sending it to the client.',
      });
      return;
    }

    try {
      setConsultationActionId(consultation.id);
      await updateDoc(doc(db, 'consultations', consultation.id), {
        assignedTo: consultation.assignedTo || user.uid,
        assignedAttorneyName: attorneyDisplayName,
        consultationMode: 'direct_attorney',
        attorneyResponse: responseText,
        attorneyRespondedAt: serverTimestamp(),
        attorneyRespondedBy: user.uid,
        status: closeAfterResponse ? 'closed' : 'attorney_review',
        updatedAt: serverTimestamp(),
      });
      setNotice({
        tone: 'success',
        message: closeAfterResponse
          ? 'Response sent and consultation closed.'
          : 'Response saved to the consultation thread.',
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `consultations/${consultation.id}`);
    } finally {
      setConsultationActionId(null);
    }
  };

  const handleToggleConsultationStatus = async (consultation: any) => {
    try {
      setConsultationActionId(consultation.id);
      await updateDoc(doc(db, 'consultations', consultation.id), {
        status: consultation.status === 'closed' ? 'attorney_review' : 'closed',
        updatedAt: serverTimestamp(),
      });
      setNotice({
        tone: 'success',
        message: consultation.status === 'closed' ? 'Consultation reopened.' : 'Consultation closed.',
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `consultations/${consultation.id}`);
    } finally {
      setConsultationActionId(null);
    }
  };

  const formatTimestamp = (value: any) => {
    if (!value?.toDate) return 'Pending timestamp';
    return new Date(value.toDate()).toLocaleString();
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-zinc-800 border-t-yellow-500 rounded-full animate-spin" />
      </main>
    );
  }

  if (!user || (profile?.role !== 'lawyer' && profile?.role !== 'admin')) {
    return null;
  }

  return (
    <main className="min-h-screen pb-20 bg-zinc-950">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 pt-32">
        <div className="mb-12">
          <h1 className="font-display text-4xl font-black uppercase tracking-tighter text-zinc-100">
            Attorney <span className="text-yellow-500">Dashboard</span>
          </h1>
          <p className="text-zinc-500 mt-2">
            Manage your public profile, service catalog, and direct consultation queue.
          </p>
        </div>

        {notice && <StatusNotice tone={notice.tone} message={notice.message} className="mb-8" />}

        <div className="grid grid-cols-1 gap-12">
          <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
            <h2 className="text-xl font-bold text-zinc-100 uppercase tracking-tight flex items-center gap-2 mb-8">
              <Briefcase className="h-5 w-5 text-yellow-500" />
              Public Profile
            </h2>

            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Full Name
                  </label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-yellow-500 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={yearsOfExperience}
                    onChange={(e) => setYearsOfExperience(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-yellow-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  Bar Admissions (Comma separated)
                </label>
                <input
                  value={barAdmissions}
                  onChange={(e) => setBarAdmissions(e.target.value)}
                  placeholder="e.g., New York, California"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-yellow-500 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  Specializations (Comma separated)
                </label>
                <input
                  value={specializations}
                  onChange={(e) => setSpecializations(e.target.value)}
                  placeholder="e.g., Co-op Formation, Governance, Dispute Resolution"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-yellow-500 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  Biography (Markdown supported)
                </label>
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

          <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-8">
              <div>
                <h2 className="text-xl font-bold text-zinc-100 uppercase tracking-tight flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-yellow-500" />
                  Direct Consultation Inbox
                </h2>
                <p className="text-sm text-zinc-500 mt-2">
                  {isConsultationTriage
                    ? 'Claim direct-attorney requests, respond in-thread, and close matters without leaving the dashboard.'
                    : 'Review only the matters assigned to you and respond in-thread without leaving the dashboard.'}
                </p>
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                {unassignedConsultations.length} unassigned · {myConsultations.length} assigned to you
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">
                  Admin Triage Queue
                </h3>
                {!isConsultationTriage && (
                  <div className="text-center py-10 border border-dashed border-zinc-800 rounded-2xl">
                    <p className="text-sm text-zinc-500">
                      Unassigned direct-attorney requests are restricted to admin triage.
                    </p>
                  </div>
                )}
                {isConsultationTriage && unassignedConsultations.length === 0 && (
                  <div className="text-center py-10 border border-dashed border-zinc-800 rounded-2xl">
                    <p className="text-sm text-zinc-500">No unassigned direct-attorney consultations right now.</p>
                  </div>
                )}
                {isConsultationTriage && unassignedConsultations.map((consultation) => (
                  <div
                    key={consultation.id}
                    className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="text-lg font-bold text-zinc-100">{consultation.topic}</h4>
                        <p className="text-xs text-zinc-500 mt-1">
                          {consultation.clientName} · {formatTimestamp(consultation.createdAt)}
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-bold uppercase tracking-widest text-yellow-500">
                        {consultation.status || 'open'}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-400 leading-relaxed">{consultation.notes}</p>
                    {consultation.preferredContact && (
                      <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                        Preferred contact: {consultation.preferredContact}
                      </p>
                    )}
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleClaimConsultation(consultation)}
                        disabled={consultationActionId === consultation.id}
                        className="px-5 py-2 rounded-xl bg-yellow-500 text-zinc-950 font-bold uppercase tracking-widest hover:bg-yellow-400 disabled:opacity-60 transition-colors"
                      >
                        {consultationActionId === consultation.id ? 'Claiming...' : 'Claim Request'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">
                  Assigned To You
                </h3>
                {myConsultations.length === 0 && (
                  <div className="text-center py-10 border border-dashed border-zinc-800 rounded-2xl">
                    <p className="text-sm text-zinc-500">Claim a request from the queue to start the thread.</p>
                  </div>
                )}
                {myConsultations.map((consultation) => (
                  <div
                    key={consultation.id}
                    className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="text-lg font-bold text-zinc-100">{consultation.topic}</h4>
                        <p className="text-xs text-zinc-500 mt-1">
                          {consultation.clientName} · {formatTimestamp(consultation.updatedAt || consultation.createdAt)}
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-bold uppercase tracking-widest text-yellow-500">
                        {consultation.status || 'attorney_review'}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                        Client Inquiry
                      </p>
                      <p className="text-sm text-zinc-400 leading-relaxed">{consultation.notes}</p>
                    </div>

                    {consultation.aiResponse && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                          Existing AI Guidance
                        </p>
                        <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">
                          {consultation.aiResponse}
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label
                        htmlFor={`consult-response-${consultation.id}`}
                        className="text-[10px] font-bold uppercase tracking-widest text-zinc-500"
                      >
                        Attorney Response
                      </label>
                      <textarea
                        id={`consult-response-${consultation.id}`}
                        rows={5}
                        value={consultationDrafts[consultation.id] ?? consultation.attorneyResponse ?? ''}
                        onChange={(e) =>
                          setConsultationDrafts((current) => ({
                            ...current,
                            [consultation.id]: e.target.value,
                          }))
                        }
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-yellow-500 transition-colors resize-y"
                        placeholder="Write the next legal guidance step, follow-up question, or closing note."
                      />
                    </div>

                    <div className="flex flex-wrap justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => handleToggleConsultationStatus(consultation)}
                        disabled={consultationActionId === consultation.id}
                        className="px-4 py-2 rounded-xl border border-zinc-700 text-zinc-200 font-bold uppercase tracking-widest hover:border-zinc-500 transition-colors disabled:opacity-60"
                      >
                        {consultation.status === 'closed' ? 'Reopen' : 'Close'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleConsultationResponse(consultation, false)}
                        disabled={consultationActionId === consultation.id}
                        className="px-4 py-2 rounded-xl border border-yellow-500/40 text-yellow-400 font-bold uppercase tracking-widest hover:border-yellow-400 transition-colors disabled:opacity-60"
                      >
                        Save Response
                      </button>
                      <button
                        type="button"
                        onClick={() => handleConsultationResponse(consultation, true)}
                        disabled={consultationActionId === consultation.id}
                        className="px-4 py-2 rounded-xl bg-yellow-500 text-zinc-950 font-bold uppercase tracking-widest hover:bg-yellow-400 transition-colors disabled:opacity-60"
                      >
                        Send & Close
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

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
              <form
                onSubmit={handleSaveService}
                className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 mb-8 space-y-4"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-yellow-500">
                    {isEditingService === 'new' ? 'New Service' : 'Edit Service'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingService(null);
                      setNewService(emptyService);
                    }}
                    className="text-zinc-500 hover:text-zinc-300"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                      Service Title
                    </label>
                    <input
                      required
                      value={newService.title}
                      onChange={(e) => setNewService({ ...newService, title: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                      Category
                    </label>
                    <input
                      required
                      value={newService.category}
                      onChange={(e) => setNewService({ ...newService, category: e.target.value })}
                      placeholder="e.g., Incorporation"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                      Fee Type
                    </label>
                    <select
                      value={newService.feeType}
                      onChange={(e) => setNewService({ ...newService, feeType: e.target.value })}
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
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                      Fee Amount
                    </label>
                    <input
                      required
                      value={newService.feeAmount}
                      onChange={(e) => setNewService({ ...newService, feeAmount: e.target.value })}
                      placeholder="e.g., $500 or $150/hr"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Description
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={newService.description}
                    onChange={(e) => setNewService({ ...newService, description: e.target.value })}
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
              {services.map((service) => (
                <div
                  key={service.id}
                  className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between"
                >
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
                        setNewService({
                          title: service.title || '',
                          category: service.category || '',
                          description: service.description || '',
                          feeType: service.feeType || 'flat',
                          feeAmount: service.feeAmount || '',
                        });
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
                  <p className="text-zinc-500 text-sm">You haven&apos;t added any services yet.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
