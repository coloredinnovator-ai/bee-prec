'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/FirebaseProvider';
import { collection, query, getDocs, doc, updateDoc, serverTimestamp, where } from 'firebase/firestore';
import { db } from '@/firebase';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { Shield, User, Edit3, Save, X, AlertCircle, CheckCircle, Search, FileText, MessageSquare, Check, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null, auth: any) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default function AdminPage() {
  const { user, profile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'posts' | 'resources' | 'requests' | 'consultations' | 'reports'>('users');
  const canManageUserRoles = profile?.role === 'admin';
  
  // Users State
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editedRole, setEditedRole] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  // Moderation State
  const [pendingPosts, setPendingPosts] = useState<any[]>([]);
  const [pendingResources, setPendingResources] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [pendingConsultations, setPendingConsultations] = useState<any[]>([]);
  const [pendingReports, setPendingReports] = useState<any[]>([]);
  const [loadingModeration, setLoadingModeration] = useState(true);

  // UI State
  const [toast, setToast] = useState<{message: string, type: 'success'|'error'} | null>(null);
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, action: () => void, title: string, message: string} | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const getComparableTime = useCallback((item: any) => {
    return item.updatedAt?.toDate?.()?.getTime?.() || item.createdAt?.toDate?.()?.getTime?.() || 0;
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      const q = query(collection(db, 'users'));
      const querySnapshot = await getDocs(q);
      const usersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersData);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'users', { currentUser: user });
      showToast('Failed to load users', 'error');
    } finally {
      setLoadingUsers(false);
    }
  }, [user, showToast]);

  const fetchPendingContent = useCallback(async () => {
    try {
      setLoadingModeration(true);
      // Fetch Pending Posts
      const postsQuery = query(collection(db, 'communityPosts'), where('moderationStatus', '==', 'pending'));
      const postsSnapshot = await getDocs(postsQuery);
      setPendingPosts(postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Fetch Pending Resources
      const resourcesQuery = query(collection(db, 'resources'), where('moderationStatus', '==', 'pending'));
      const resourcesSnapshot = await getDocs(resourcesQuery);
      setPendingResources(resourcesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Fetch Pending Resource Requests
      const requestsQuery = query(collection(db, 'resourceRequests'), where('status', '==', 'pending'));
      const requestsSnapshot = await getDocs(requestsQuery);
      setPendingRequests(requestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Fetch Active Consultations
      const consultationsSnapshot = await getDocs(collection(db, 'consultations'));
      const consultationItems = consultationsSnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((item: any) => !item.deleted && item.status !== 'closed')
        .sort((left: any, right: any) => getComparableTime(right) - getComparableTime(left));
      setPendingConsultations(consultationItems);

      // Fetch Open Incident Reports
      const reportsSnapshot = await getDocs(collection(db, 'incidentReports'));
      const reportItems = reportsSnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((item: any) => !item.deleted && item.status !== 'resolved')
        .sort((left: any, right: any) => getComparableTime(right) - getComparableTime(left));
      setPendingReports(reportItems);
    } catch (err) {
      console.error('Failed to fetch pending content:', err);
      showToast('Failed to load pending content', 'error');
    } finally {
      setLoadingModeration(false);
    }
  }, [getComparableTime, showToast]);

  useEffect(() => {
    if (profile?.role === 'admin' || profile?.role === 'board') {
      fetchUsers();
      fetchPendingContent();
    } else {
      setLoadingUsers(false);
      setLoadingModeration(false);
    }
  }, [profile, fetchUsers, fetchPendingContent]);

  const handleEditRole = (userId: string, currentRole: string) => {
    if (!canManageUserRoles) {
      showToast('Only admins can change user roles.', 'error');
      return;
    }
    setEditingUserId(userId);
    setEditedRole(currentRole);
  };

  const executeSaveRole = async (userId: string) => {
    if (!canManageUserRoles) {
      showToast('Only admins can change user roles.', 'error');
      return;
    }
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: editedRole,
        updatedAt: serverTimestamp()
      });
      setEditingUserId(null);
      showToast('User role updated successfully', 'success');
      fetchUsers();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`, { currentUser: user });
      showToast('Failed to update user role', 'error');
    }
  };

  const handleSaveRole = (userId: string, userName: string) => {
    if (editedRole === 'admin' || editedRole === 'board') {
      setConfirmModal({
        isOpen: true,
        title: 'Confirm Privilege Escalation',
        message: `Are you sure you want to grant ${editedRole} privileges to ${userName}? This grants significant access.`,
        action: () => {
          executeSaveRole(userId);
          setConfirmModal(null);
        }
      });
    } else {
      executeSaveRole(userId);
    }
  };

  const handleModeratePost = async (postId: string, status: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'communityPosts', postId), {
        moderationStatus: status,
        updatedAt: serverTimestamp()
      });
      showToast(`Post ${status} successfully`, 'success');
      setPendingPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err) {
      console.error('Failed to moderate post:', err);
      showToast('Failed to moderate post', 'error');
    }
  };

  const handleModerateResource = async (resourceId: string, status: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'resources', resourceId), {
        moderationStatus: status,
        updatedAt: serverTimestamp()
      });
      showToast(`Resource ${status} successfully`, 'success');
      setPendingResources(prev => prev.filter(r => r.id !== resourceId));
    } catch (err) {
      console.error('Failed to moderate resource:', err);
      showToast('Failed to moderate resource', 'error');
    }
  };

  const handleModerateRequest = async (requestId: string, status: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'resourceRequests', requestId), {
        status,
        updatedAt: serverTimestamp(),
      });
      showToast(`Request ${status} successfully`, 'success');
      setPendingRequests(prev => prev.filter(request => request.id !== requestId));
    } catch (err) {
      console.error('Failed to moderate request:', err);
      showToast('Failed to moderate request', 'error');
    }
  };

  const handleCloseConsultation = async (consultationId: string) => {
    try {
      await updateDoc(doc(db, 'consultations', consultationId), {
        status: 'closed',
        updatedAt: serverTimestamp(),
      });
      setPendingConsultations((prev) => prev.filter((consultation) => consultation.id !== consultationId));
      showToast('Consultation closed successfully', 'success');
    } catch (err) {
      console.error('Failed to update consultation:', err);
      showToast('Failed to close consultation', 'error');
    }
  };

  const handleModerateReport = async (reportId: string, status: 'reviewing' | 'resolved') => {
    try {
      await updateDoc(doc(db, 'incidentReports', reportId), {
        status,
        reviewedBy: user?.uid || null,
        reviewedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setPendingReports((prev) =>
        status === 'resolved'
          ? prev.filter((report) => report.id !== reportId)
          : prev.map((report) => (
              report.id === reportId
                ? { ...report, status }
                : report
            ))
      );
      showToast(`Report marked ${status}`, 'success');
    } catch (err) {
      console.error('Failed to update report:', err);
      showToast('Failed to update report', 'error');
    }
  };

  // Filter and Pagination for Users
  const filteredUsers = users.filter(u => 
    u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage);

  if (loading || loadingUsers || loadingModeration) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 flex items-center justify-center transition-colors duration-300">
        <div className="h-12 w-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" role="status" aria-label="Loading admin page" />
      </div>
    );
  }

  if (!user || (profile?.role !== 'admin' && profile?.role !== 'board')) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4 text-center transition-colors duration-300">
        <Shield className="h-16 w-16 text-stone-300 dark:text-zinc-700 mb-6" aria-hidden="true" />
        <h1 className="text-3xl font-serif text-stone-800 dark:text-zinc-100 mb-4">Access Denied</h1>
        <p className="text-stone-600 dark:text-zinc-400 max-w-md">
          You do not have permission to view this page. This area is restricted to administrators and board members.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 transition-colors duration-300 py-12 px-4 sm:px-6 lg:px-8 relative">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg border ${
              toast.type === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/50 dark:border-emerald-900/50 dark:text-emerald-400'
                : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/50 dark:border-red-900/50 dark:text-red-400'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            <span className="font-medium">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmModal?.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-stone-200 dark:border-zinc-800 p-6 max-w-md w-full"
            >
              <h3 className="text-xl font-bold text-stone-900 dark:text-zinc-100 mb-2">{confirmModal.title}</h3>
              <p className="text-stone-600 dark:text-zinc-400 mb-6">{confirmModal.message}</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setConfirmModal(null)}
                  className="px-4 py-2 rounded-lg text-stone-600 dark:text-zinc-400 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmModal.action}
                  className="px-4 py-2 rounded-lg bg-amber-500 text-zinc-950 font-medium hover:bg-amber-400 transition-colors"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif text-stone-900 dark:text-zinc-100 flex items-center gap-3">
              <Shield className="h-8 w-8 text-amber-600 dark:text-amber-500" aria-hidden="true" />
              Admin Dashboard
            </h1>
            <p className="mt-2 text-stone-600 dark:text-zinc-400">
              Manage users, roles, consultations, reports, and community moderation from one queue.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-stone-200/50 dark:bg-zinc-900/50 p-1 rounded-xl mb-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'users'
                ? 'bg-white dark:bg-zinc-800 text-stone-900 dark:text-zinc-100 shadow-sm'
                : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-200 hover:bg-stone-200 dark:hover:bg-zinc-800/50'
            }`}
          >
            <User className="h-4 w-4" />
            User Management
          </button>
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'posts'
                ? 'bg-white dark:bg-zinc-800 text-stone-900 dark:text-zinc-100 shadow-sm'
                : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-200 hover:bg-stone-200 dark:hover:bg-zinc-800/50'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            Pending Posts
            {pendingPosts.length > 0 && (
              <span className="ml-2 bg-amber-500 text-amber-950 text-xs py-0.5 px-2 rounded-full font-bold">
                {pendingPosts.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'resources'
                ? 'bg-white dark:bg-zinc-800 text-stone-900 dark:text-zinc-100 shadow-sm'
                : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-200 hover:bg-stone-200 dark:hover:bg-zinc-800/50'
            }`}
          >
            <FileText className="h-4 w-4" />
            Pending Resources
            {pendingResources.length > 0 && (
              <span className="ml-2 bg-amber-500 text-amber-950 text-xs py-0.5 px-2 rounded-full font-bold">
                {pendingResources.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'requests'
                ? 'bg-white dark:bg-zinc-800 text-stone-900 dark:text-zinc-100 shadow-sm'
                : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-200 hover:bg-stone-200 dark:hover:bg-zinc-800/50'
            }`}
          >
            <Clock className="h-4 w-4" />
            Access Requests
            {pendingRequests.length > 0 && (
              <span className="ml-2 bg-amber-500 text-amber-950 text-xs py-0.5 px-2 rounded-full font-bold">
                {pendingRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('consultations')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'consultations'
                ? 'bg-white dark:bg-zinc-800 text-stone-900 dark:text-zinc-100 shadow-sm'
                : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-200 hover:bg-stone-200 dark:hover:bg-zinc-800/50'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            Consultations
            {pendingConsultations.length > 0 && (
              <span className="ml-2 bg-amber-500 text-amber-950 text-xs py-0.5 px-2 rounded-full font-bold">
                {pendingConsultations.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'reports'
                ? 'bg-white dark:bg-zinc-800 text-stone-900 dark:text-zinc-100 shadow-sm'
                : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-200 hover:bg-stone-200 dark:hover:bg-zinc-800/50'
            }`}
          >
            <AlertCircle className="h-4 w-4" />
            Incident Reports
            {pendingReports.length > 0 && (
              <span className="ml-2 bg-amber-500 text-amber-950 text-xs py-0.5 px-2 rounded-full font-bold">
                {pendingReports.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-stone-200 dark:border-zinc-800 overflow-hidden transition-colors duration-300">
          
          {/* USERS TAB */}
          {activeTab === 'users' && (
            <div>
              <div className="p-4 border-b border-stone-200 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="relative w-full sm:w-96">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-stone-400 dark:text-zinc-500" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search users by name, email, or role..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="block w-full pl-10 pr-3 py-2 border border-stone-300 dark:border-zinc-700 rounded-xl leading-5 bg-stone-50 dark:bg-zinc-950 text-stone-900 dark:text-zinc-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 sm:text-sm transition-colors"
                  />
                </div>
                <div className="text-sm text-stone-500 dark:text-zinc-400 text-right">
                  <div>Showing {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}</div>
                  {!canManageUserRoles && <div>Board members have read-only user access.</div>}
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50 dark:bg-zinc-950/50 border-b border-stone-200 dark:border-zinc-800 text-stone-500 dark:text-zinc-400 text-sm uppercase tracking-wider">
                      <th className="p-4 font-medium">User</th>
                      <th className="p-4 font-medium">Email</th>
                      <th className="p-4 font-medium">Role</th>
                      <th className="p-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 dark:divide-zinc-800">
                    {paginatedUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-stone-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-stone-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden relative">
                              {u.avatarUrl ? (
                                <Image src={u.avatarUrl} alt={u.displayName} fill className="object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <User className="h-5 w-5 text-stone-400 dark:text-zinc-500" />
                              )}
                            </div>
                            <span className="font-medium text-stone-900 dark:text-zinc-100">{u.displayName || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="p-4 text-stone-600 dark:text-zinc-400">{u.email}</td>
                        <td className="p-4">
                          {editingUserId === u.id ? (
                            <select
                              value={editedRole}
                              onChange={(e) => setEditedRole(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-stone-900 dark:text-zinc-100 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                              aria-label={`Select role for ${u.displayName}`}
                            >
                              <option value="member">Member</option>
                              <option value="pendingLawyer">Pending Lawyer</option>
                              <option value="lawyer">Lawyer</option>
                              <option value="board">Board Member</option>
                              <option value="maintenance">Maintenance</option>
                              <option value="admin">Admin</option>
                            </select>
                          ) : (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                              u.role === 'admin' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' :
                              u.role === 'board' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                              u.role === 'lawyer' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                              'bg-stone-100 text-stone-800 dark:bg-zinc-800 dark:text-zinc-200'
                            }`}>
                              {u.role || 'member'}
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {editingUserId === u.id ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleSaveRole(u.id, u.displayName || u.email)}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                                aria-label="Save role"
                              >
                                <Save className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => setEditingUserId(null)}
                                className="p-1.5 text-stone-400 hover:bg-stone-100 dark:text-zinc-500 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                aria-label="Cancel editing"
                              >
                                <X className="h-5 w-5" />
                              </button>
                            </div>
                          ) : canManageUserRoles ? (
                            <button
                              onClick={() => handleEditRole(u.id, u.role || 'member')}
                              className="p-1.5 text-stone-400 hover:text-amber-600 hover:bg-amber-50 dark:text-zinc-500 dark:hover:text-amber-500 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                              aria-label={`Edit role for ${u.displayName}`}
                            >
                              <Edit3 className="h-5 w-5" />
                            </button>
                          ) : (
                            <span className="text-xs text-stone-400 dark:text-zinc-500 uppercase tracking-wider">Read only</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {paginatedUsers.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-stone-500 dark:text-zinc-400">
                          No users found matching your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-stone-200 dark:border-zinc-800 flex items-center justify-between">
                  <div className="text-sm text-stone-500 dark:text-zinc-400">
                    Page <span className="font-medium text-stone-900 dark:text-zinc-100">{currentPage}</span> of <span className="font-medium text-stone-900 dark:text-zinc-100">{totalPages}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-stone-200 dark:border-zinc-800 text-stone-600 dark:text-zinc-400 hover:bg-stone-50 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-stone-200 dark:border-zinc-800 text-stone-600 dark:text-zinc-400 hover:bg-stone-50 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* POSTS TAB */}
          {activeTab === 'posts' && (
            <div className="p-6">
              {pendingPosts.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium text-stone-900 dark:text-zinc-100">All caught up!</h3>
                  <p className="text-stone-500 dark:text-zinc-400 mt-1">There are no pending posts to moderate.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {pendingPosts.map(post => (
                    <div key={post.id} className="bg-stone-50 dark:bg-zinc-950/50 border border-stone-200 dark:border-zinc-800 rounded-xl p-6">
                      <div className="flex justify-between items-start gap-4 mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-stone-900 dark:text-zinc-100">{post.title}</h3>
                          <p className="text-sm text-stone-500 dark:text-zinc-400 mt-1">
                            By {post.authorName} • {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString() : 'Unknown date'}
                          </p>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                          Pending Review
                        </span>
                      </div>
                      <div className="prose prose-sm dark:prose-invert max-w-none mb-6">
                        <p className="whitespace-pre-wrap">{post.body}</p>
                      </div>
                      <div className="flex items-center gap-3 border-t border-stone-200 dark:border-zinc-800 pt-4">
                        <button
                          onClick={() => handleModeratePost(post.id, 'approved')}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
                        >
                          <Check className="h-4 w-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleModeratePost(post.id, 'rejected')}
                          className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                        >
                          <X className="h-4 w-4" />
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* RESOURCES TAB */}
          {activeTab === 'resources' && (
            <div className="p-6">
              {pendingResources.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium text-stone-900 dark:text-zinc-100">All caught up!</h3>
                  <p className="text-stone-500 dark:text-zinc-400 mt-1">There are no pending resources to moderate.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {pendingResources.map(resource => (
                    <div key={resource.id} className="bg-stone-50 dark:bg-zinc-950/50 border border-stone-200 dark:border-zinc-800 rounded-xl p-6">
                      <div className="flex justify-between items-start gap-4 mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-xl font-bold text-stone-900 dark:text-zinc-100">{resource.title}</h3>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-200 text-stone-800 dark:bg-zinc-800 dark:text-zinc-200 capitalize">
                              {resource.type}
                            </span>
                          </div>
                          <p className="text-sm text-stone-500 dark:text-zinc-400">
                            {resource.createdAt?.toDate ? resource.createdAt.toDate().toLocaleDateString() : 'Unknown date'}
                          </p>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                          Pending Review
                        </span>
                      </div>
                      <div className="prose prose-sm dark:prose-invert max-w-none mb-6">
                        <p className="whitespace-pre-wrap">{resource.description}</p>
                      </div>
                      <div className="flex items-center gap-3 border-t border-stone-200 dark:border-zinc-800 pt-4">
                        <button
                          onClick={() => handleModerateResource(resource.id, 'approved')}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
                        >
                          <Check className="h-4 w-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleModerateResource(resource.id, 'rejected')}
                          className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                        >
                          <X className="h-4 w-4" />
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ACCESS REQUESTS TAB */}
          {activeTab === 'requests' && (
            <div className="p-6">
              {pendingRequests.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium text-stone-900 dark:text-zinc-100">All caught up!</h3>
                  <p className="text-stone-500 dark:text-zinc-400 mt-1">There are no pending resource access requests.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {pendingRequests.map(request => (
                    <div key={request.id} className="bg-stone-50 dark:bg-zinc-950/50 border border-stone-200 dark:border-zinc-800 rounded-xl p-6">
                      <div className="flex justify-between items-start gap-4 mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-xl font-bold text-stone-900 dark:text-zinc-100">{request.resourceTitle}</h3>
                            {request.resourceType && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-200 text-stone-800 dark:bg-zinc-800 dark:text-zinc-200 capitalize">
                                {request.resourceType}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-stone-500 dark:text-zinc-400">
                            Requested by {request.requesterName || request.requesterEmail || 'Unknown member'}
                          </p>
                          {request.requesterEmail && (
                            <p className="text-xs text-stone-500 dark:text-zinc-500 mt-1">{request.requesterEmail}</p>
                          )}
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                          Pending Review
                        </span>
                      </div>
                      <div className="prose prose-sm dark:prose-invert max-w-none mb-6">
                        <p className="whitespace-pre-wrap">{request.note || 'No request note provided.'}</p>
                      </div>
                      <div className="flex items-center gap-3 border-t border-stone-200 dark:border-zinc-800 pt-4">
                        <button
                          onClick={() => handleModerateRequest(request.id, 'approved')}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
                        >
                          <Check className="h-4 w-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleModerateRequest(request.id, 'rejected')}
                          className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                        >
                          <X className="h-4 w-4" />
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CONSULTATIONS TAB */}
          {activeTab === 'consultations' && (
            <div className="p-6">
              {pendingConsultations.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium text-stone-900 dark:text-zinc-100">All caught up!</h3>
                  <p className="text-stone-500 dark:text-zinc-400 mt-1">There are no active consultations to triage.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {pendingConsultations.map((consultation) => (
                    <div key={consultation.id} className="bg-stone-50 dark:bg-zinc-950/50 border border-stone-200 dark:border-zinc-800 rounded-xl p-6">
                      <div className="flex justify-between items-start gap-4 mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-1 flex-wrap">
                            <h3 className="text-xl font-bold text-stone-900 dark:text-zinc-100">{consultation.topic}</h3>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-200 text-stone-800 dark:bg-zinc-800 dark:text-zinc-200 capitalize">
                              {consultation.consultationMode || consultation.area || 'consultation'}
                            </span>
                          </div>
                          <p className="text-sm text-stone-500 dark:text-zinc-400 mt-1">
                            {consultation.clientName || 'Unknown client'} • {consultation.createdAt?.toDate ? consultation.createdAt.toDate().toLocaleString() : 'Unknown date'}
                          </p>
                          {consultation.assignedAttorneyName && (
                            <p className="text-xs text-stone-500 dark:text-zinc-500 mt-1">
                              Assigned to {consultation.assignedAttorneyName}
                            </p>
                          )}
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                          {consultation.status || 'open'}
                        </span>
                      </div>
                      <div className="prose prose-sm dark:prose-invert max-w-none mb-6">
                        <p className="whitespace-pre-wrap">{consultation.notes}</p>
                        {consultation.attorneyResponse && (
                          <div className="mt-4 rounded-lg border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                            <p className="text-xs font-bold uppercase tracking-widest text-stone-500 dark:text-zinc-500 mb-2">
                              Attorney Response
                            </p>
                            <p className="whitespace-pre-wrap">{consultation.attorneyResponse}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 border-t border-stone-200 dark:border-zinc-800 pt-4">
                        <button
                          onClick={() => handleCloseConsultation(consultation.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-stone-900 hover:bg-stone-700 dark:bg-zinc-100 dark:hover:bg-zinc-300 text-white dark:text-zinc-950 rounded-lg font-medium transition-colors"
                        >
                          <Check className="h-4 w-4" />
                          Close Consultation
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* INCIDENT REPORTS TAB */}
          {activeTab === 'reports' && (
            <div className="p-6">
              {pendingReports.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium text-stone-900 dark:text-zinc-100">All caught up!</h3>
                  <p className="text-stone-500 dark:text-zinc-400 mt-1">There are no open incident reports to review.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {pendingReports.map((report) => (
                    <div key={report.id} className="bg-stone-50 dark:bg-zinc-950/50 border border-stone-200 dark:border-zinc-800 rounded-xl p-6">
                      <div className="flex justify-between items-start gap-4 mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-1 flex-wrap">
                            <h3 className="text-xl font-bold text-stone-900 dark:text-zinc-100">{report.title}</h3>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-200 text-stone-800 dark:bg-zinc-800 dark:text-zinc-200 capitalize">
                              {report.category || 'incident'}
                            </span>
                          </div>
                          <p className="text-sm text-stone-500 dark:text-zinc-400">
                            {report.anonymous ? 'Anonymous reporter' : (report.reporterAlias || report.reportedBy || 'Unknown reporter')}
                          </p>
                          <p className="text-xs text-stone-500 dark:text-zinc-500 mt-1">
                            Status: {report.status || 'open'} • {report.createdAt?.toDate ? report.createdAt.toDate().toLocaleString() : 'Unknown date'}
                          </p>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                          {report.priority || 'medium'}
                        </span>
                      </div>
                      <div className="prose prose-sm dark:prose-invert max-w-none mb-6">
                        <p className="whitespace-pre-wrap">{report.body}</p>
                      </div>
                      <div className="flex items-center gap-3 border-t border-stone-200 dark:border-zinc-800 pt-4">
                        {report.status !== 'reviewing' && (
                          <button
                            onClick={() => handleModerateReport(report.id, 'reviewing')}
                            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 rounded-lg font-medium transition-colors"
                          >
                            <Clock className="h-4 w-4" />
                            Mark Reviewing
                          </button>
                        )}
                        <button
                          onClick={() => handleModerateReport(report.id, 'resolved')}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
                        >
                          <Check className="h-4 w-4" />
                          Resolve
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
