'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Building2, Plus, Edit2, User, Key, AlertCircle } from 'lucide-react';
import { collection, onSnapshot, doc, setDoc, updateDoc, query, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuth, handleFirestoreError, OperationType } from '@/components/FirebaseProvider';
import { Navbar } from '@/components/Navbar';

interface Unit {
  id: string;
  number: string;
  occupantId: string;
  status: 'occupied' | 'vacant' | 'maintenance';
}

interface CoOpUser {
  uid: string;
  displayName: string;
  email: string;
}

export default function UnitsDirectory() {
  const { user, profile, isAuthReady } = useAuth();
  const [units, setUnits] = useState<Unit[]>([]);
  const [users, setUsers] = useState<CoOpUser[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [formData, setFormData] = useState({
    number: '',
    occupantId: '',
    status: 'vacant' as Unit['status'],
  });

  const isBoard = profile?.role === 'board';
  const isMaintenance = profile?.role === 'maintenance';

  useEffect(() => {
    if (!isAuthReady) {
      return;
    }
    if (!user) {
      const timer = setTimeout(() => setLoading(false), 0);
      return () => clearTimeout(timer);
    }

    // Fetch users for the occupant dropdown
    const fetchUsers = async () => {
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const usersList = usersSnap.docs.map(doc => ({
          uid: doc.id,
          displayName: doc.data().displayName || 'Unknown',
          email: doc.data().email || '',
        }));
        setUsers(usersList);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    if (isBoard) {
      fetchUsers();
    }

    // Listen to units
    const unsubscribe = onSnapshot(
      collection(db, 'units'),
      (snapshot) => {
        const unitsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Unit[];
        
        // Sort by unit number
        unitsData.sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }));
        setUnits(unitsData);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'units');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isAuthReady, user, isBoard]);

  const handleOpenModal = (unit?: Unit) => {
    if (unit) {
      setEditingUnit(unit);
      setFormData({
        number: unit.number,
        occupantId: unit.occupantId || '',
        status: unit.status,
      });
    } else {
      setEditingUnit(null);
      setFormData({
        number: '',
        occupantId: '',
        status: 'vacant',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBoard) return;

    try {
      if (editingUnit) {
        await updateDoc(doc(db, 'units', editingUnit.id), {
          number: formData.number,
          occupantId: formData.occupantId || null,
          status: formData.status,
        });
      } else {
        const newUnitRef = doc(collection(db, 'units'));
        await setDoc(newUnitRef, {
          id: newUnitRef.id,
          number: formData.number,
          occupantId: formData.occupantId || null,
          status: formData.status,
        });
      }
      setIsModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, editingUnit ? OperationType.UPDATE : OperationType.CREATE, 'units');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'occupied': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'vacant': return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
      case 'maintenance': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default: return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  const getOccupantName = (occupantId: string) => {
    if (!occupantId) return 'None';
    const occupant = users.find(u => u.uid === occupantId);
    return occupant ? occupant.displayName : 'Unknown Member';
  };

  if (!isAuthReady || loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600"></div>
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
          <p className="text-stone-600 max-w-md">Please connect your account to view the Unit Directory.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-stone-900 mb-2 flex items-center gap-3">
              <Building2 className="h-10 w-10 text-amber-600" />
              Unit Directory
            </h1>
            <p className="text-stone-500 text-lg">Manage and view housing units within the BEE-CO-OP.</p>
          </div>
          
          {isBoard && (
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-6 py-3 bg-stone-900 text-stone-50 rounded-full font-bold uppercase tracking-tight hover:bg-stone-800 transition-colors shadow-lg"
            >
              <Plus className="h-5 w-5" />
              Add Unit
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {units.map((unit) => (
            <motion.div
              key={unit.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 w-2 h-full bg-amber-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 font-black text-xl">
                    {unit.number}
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-900 uppercase tracking-tight">Unit {unit.number}</h3>
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border mt-1 ${getStatusColor(unit.status)}`}>
                      {unit.status}
                    </span>
                  </div>
                </div>
                
                {isBoard && (
                  <button
                    onClick={() => handleOpenModal(unit)}
                    className="p-2 text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded-full transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-stone-600 bg-stone-50 p-3 rounded-xl">
                  <User className="h-4 w-4 text-stone-400" />
                  <span className="font-medium">
                    {unit.occupantId ? (isBoard ? getOccupantName(unit.occupantId) : 'Occupied') : 'No Occupant'}
                  </span>
                </div>
                {isBoard && unit.occupantId && (
                  <div className="flex items-center gap-3 text-xs text-stone-500 px-3">
                    <Key className="h-3 w-3" />
                    <span className="truncate">{unit.occupantId}</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          
          {units.length === 0 && (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-stone-200 rounded-3xl">
              <Building2 className="h-12 w-12 text-stone-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-stone-900 mb-2">No Units Found</h3>
              <p className="text-stone-500">There are currently no units in the directory.</p>
            </div>
          )}
        </div>
      </main>

      {/* Add/Edit Modal */}
      {isModalOpen && isBoard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-stone-100"
          >
            <h2 className="text-2xl font-black uppercase tracking-tighter text-stone-900 mb-6">
              {editingUnit ? 'Edit Unit' : 'Add New Unit'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-stone-700 uppercase tracking-tight mb-2">
                  Unit Number
                </label>
                <input
                  type="text"
                  required
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  placeholder="e.g. 101, 2A"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-700 uppercase tracking-tight mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Unit['status'] })}
                  className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                >
                  <option value="vacant">Vacant</option>
                  <option value="occupied">Occupied</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-700 uppercase tracking-tight mb-2">
                  Assign Occupant
                </label>
                <select
                  value={formData.occupantId}
                  onChange={(e) => setFormData({ ...formData, occupantId: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                >
                  <option value="">-- No Occupant --</option>
                  {users.map(u => (
                    <option key={u.uid} value={u.uid}>
                      {u.displayName} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-3 rounded-xl font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors uppercase tracking-tight"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 rounded-xl font-bold text-stone-50 bg-amber-600 hover:bg-amber-500 transition-colors uppercase tracking-tight shadow-md shadow-amber-600/20"
                >
                  {editingUnit ? 'Save Changes' : 'Add Unit'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
