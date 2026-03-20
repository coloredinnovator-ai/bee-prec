'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { useAuth, OperationType, handleFirestoreError } from '@/components/FirebaseProvider';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import Image from 'next/image';
import { User, Mail, Shield, Calendar, Edit3, Save, X, Award, Bell, Camera } from 'lucide-react';

const parseFocusAreas = (value: string) =>
  value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .slice(0, 8);

export default function ProfilePage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({ 
    displayName: '', 
    bio: '',
    avatarUrl: '',
    notificationsEnabled: false,
    organization: '',
    location: '',
    coordinates: { lat: 0, lng: 0 },
    focusAreas: [] as string[],
    visibility: 'members',
    offlineAccessRequested: false,
    matchingOptIn: false,
  });

  if (loading) return (
    <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 flex items-center justify-center transition-colors duration-300">
      <div className="h-12 w-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" role="status" aria-label="Loading profile" />
    </div>
  );

  if (!user) return (
    <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4 text-center transition-colors duration-300">
      <Shield className="h-16 w-16 text-stone-300 dark:text-zinc-700 mb-6" aria-hidden="true" />
      <h1 className="text-2xl font-bold text-stone-900 dark:text-zinc-100 uppercase tracking-tight mb-2">Access Restricted</h1>
      <p className="text-stone-500 dark:text-zinc-400 max-w-md mb-8">Please connect your account to view and manage your B-PREC profile.</p>
      <Navbar />
    </div>
  );

  const startEditing = () => {
    setEditedProfile({
      displayName: profile?.displayName || '',
      bio: profile?.bio || '',
      avatarUrl: profile?.avatarUrl || '',
      notificationsEnabled: profile?.notificationsEnabled || false,
      organization: profile?.organization || '',
      location: profile?.location || '',
      coordinates: profile?.coordinates || { lat: 0, lng: 0 },
      focusAreas: Array.isArray(profile?.focusAreas) ? profile.focusAreas : [],
      visibility: profile?.visibility === 'public' ? 'public' : 'members',
      offlineAccessRequested: Boolean(profile?.offlineAccessRequested),
      matchingOptIn: Boolean(profile?.matchingOptIn),
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const normalizedDisplayName =
        editedProfile.displayName.trim()
        || profile?.displayName
        || user.displayName
        || 'Anonymous Bee';
      const normalizedFocusAreas = editedProfile.focusAreas.slice(0, 8);
      const publicProfileFields = {
        displayName: normalizedDisplayName,
        bio: editedProfile.bio.trim(),
        avatarUrl: editedProfile.avatarUrl.trim(),
        organization: editedProfile.organization.trim(),
        location: editedProfile.location.trim(),
        coordinates: editedProfile.coordinates,
        focusAreas: normalizedFocusAreas,
      };

      await updateDoc(doc(db, 'users', user.uid), {
        displayName: normalizedDisplayName,
        avatarUrl: publicProfileFields.avatarUrl,
        notificationsEnabled: editedProfile.notificationsEnabled,
        updatedAt: serverTimestamp()
      });

      const publicProfileRef = doc(db, 'profiles', user.uid);
      const existingPublicProfile = await getDoc(publicProfileRef);
      const publicProfilePayload: Record<string, any> = {
        uid: user.uid,
        ...publicProfileFields,
        visibility: editedProfile.visibility,
        offlineAccessRequested: editedProfile.offlineAccessRequested,
        matchingOptIn: editedProfile.matchingOptIn,
        updatedAt: serverTimestamp(),
      };

      if (!existingPublicProfile.exists()) {
        publicProfilePayload.createdAt = serverTimestamp();
        publicProfilePayload.verified = false;
      }

      await setDoc(publicProfileRef, publicProfilePayload, { merge: true });
      await refreshProfile();
      setIsEditing(false);

      if (editedProfile.notificationsEnabled && user.email) {
        try {
          const token = await user.getIdToken();
          await fetch('/api/send-notification', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              to: user.email,
              subject: 'Profile Updated',
              text: 'Your profile has been successfully updated.',
              html: '<p>Your profile has been successfully updated.</p>',
            }),
          });
        } catch (emailError) {
          console.error('Failed to send email notification:', emailError);
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const displayAvatar = profile?.avatarUrl || user.photoURL;

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 text-stone-900 dark:text-zinc-100 font-sans transition-colors duration-300">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-stone-200 dark:border-zinc-800 shadow-sm p-8 md:p-12 overflow-hidden relative transition-colors duration-300">
          <div className="absolute top-0 right-0 p-8 opacity-5 dark:opacity-10 pointer-events-none">
            <Shield className="h-64 w-64 text-amber-600" aria-hidden="true" />
          </div>

          <div className="relative flex flex-col md:flex-row items-center gap-8">
            <div className="relative">
              <div className="h-32 w-32 rounded-full bg-stone-100 dark:bg-zinc-800 border-4 border-amber-500 flex items-center justify-center overflow-hidden shadow-md relative">
                {displayAvatar ? (
                  <Image 
                    src={displayAvatar} 
                    alt={`${profile?.displayName || user.displayName || 'User'}'s avatar`} 
                    fill 
                    className="object-cover" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <User className="h-16 w-16 text-stone-400 dark:text-zinc-600" aria-hidden="true" />
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full bg-amber-500 flex items-center justify-center text-white border-4 border-white dark:border-zinc-900" aria-label="Verified Member" title="Verified Member">
                <Award className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>

            <div className="flex-grow text-center md:text-left w-full">
              {isEditing ? (
                <div className="space-y-4 max-w-md mx-auto md:mx-0">
                  <div>
                    <label htmlFor="displayName" className="sr-only">Display Name</label>
                    <input
                      id="displayName"
                      value={editedProfile.displayName}
                      onChange={(e) => setEditedProfile({ ...editedProfile, displayName: e.target.value })}
                      className="w-full bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-2xl font-bold text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
                      placeholder="Display Name"
                    />
                  </div>
                  <div>
                    <label htmlFor="avatarUrl" className="sr-only">Avatar URL</label>
                    <div className="relative">
                      <Camera className="absolute left-3 top-3.5 h-5 w-5 text-stone-400 dark:text-zinc-500" aria-hidden="true" />
                      <input
                        id="avatarUrl"
                        value={editedProfile.avatarUrl}
                        onChange={(e) => setEditedProfile({ ...editedProfile, avatarUrl: e.target.value })}
                        className="w-full bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
                        placeholder="Avatar Image URL (optional)"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="bio" className="sr-only">Biography</label>
                    <textarea
                      id="bio"
                      rows={3}
                      value={editedProfile.bio}
                      onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                      className="w-full bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-stone-600 dark:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors resize-none"
                      placeholder="Tell the community about yourself..."
                    />
                  </div>
                  <div>
                    <label htmlFor="organization" className="sr-only">Organization</label>
                    <input
                      id="organization"
                      value={editedProfile.organization}
                      onChange={(e) => setEditedProfile({ ...editedProfile, organization: e.target.value })}
                      className="w-full bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
                      placeholder="Organization or collective"
                    />
                  </div>
                  <div>
                    <label htmlFor="location" className="sr-only">Location Name</label>
                    <input
                      id="location"
                      value={editedProfile.location}
                      onChange={(e) => setEditedProfile({ ...editedProfile, location: e.target.value })}
                      className="w-full bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
                      placeholder="City, Country"
                    />
                  </div>
                  <div>
                    <label htmlFor="focusAreas" className="sr-only">Focus Areas</label>
                    <input
                      id="focusAreas"
                      value={editedProfile.focusAreas.join(', ')}
                      onChange={(e) => setEditedProfile({ ...editedProfile, focusAreas: parseFocusAreas(e.target.value) })}
                      className="w-full bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
                      placeholder="Co-op formation, governance, legal aid"
                    />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label htmlFor="lat" className="sr-only">Latitude</label>
                      <input
                        id="lat"
                        type="number"
                        step="any"
                        value={editedProfile.coordinates.lat || ''}
                        onChange={(e) => setEditedProfile({ ...editedProfile, coordinates: { ...editedProfile.coordinates, lat: parseFloat(e.target.value) || 0 } })}
                        className="w-full bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
                        placeholder="Latitude (e.g. 37.7749)"
                      />
                    </div>
                    <div className="flex-1">
                      <label htmlFor="lng" className="sr-only">Longitude</label>
                      <input
                        id="lng"
                        type="number"
                        step="any"
                        value={editedProfile.coordinates.lng || ''}
                        onChange={(e) => setEditedProfile({ ...editedProfile, coordinates: { ...editedProfile.coordinates, lng: parseFloat(e.target.value) || 0 } })}
                        className="w-full bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
                      placeholder="Longitude (e.g. -122.4194)"
                    />
                  </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label htmlFor="visibility" className="block text-xs font-bold uppercase tracking-widest text-stone-500 dark:text-zinc-500 mb-2">
                        Profile Visibility
                      </label>
                      <select
                        id="visibility"
                        value={editedProfile.visibility}
                        onChange={(e) => setEditedProfile({ ...editedProfile, visibility: e.target.value as 'members' | 'public' })}
                        className="w-full bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
                      >
                        <option value="members">Members Only</option>
                        <option value="public">Public Map + Profile</option>
                      </select>
                    </div>
                    <div className="rounded-xl border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-950 p-4">
                      <p className="text-xs font-bold uppercase tracking-widest text-stone-500 dark:text-zinc-500 mb-3">
                        Discovery Settings
                      </p>
                      <div className="space-y-3">
                        <label className="flex items-start gap-3 text-sm text-stone-700 dark:text-zinc-300">
                          <input
                            type="checkbox"
                            checked={editedProfile.matchingOptIn}
                            onChange={(e) => setEditedProfile({ ...editedProfile, matchingOptIn: e.target.checked })}
                            className="mt-0.5 h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                          />
                          <span>Opt into member matching and introductions</span>
                        </label>
                        <label className="flex items-start gap-3 text-sm text-stone-700 dark:text-zinc-300">
                          <input
                            type="checkbox"
                            checked={editedProfile.offlineAccessRequested}
                            onChange={(e) => setEditedProfile({ ...editedProfile, offlineAccessRequested: e.target.checked })}
                            className="mt-0.5 h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                          />
                          <span>Request offline or low-connectivity support</span>
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-stone-50 dark:bg-zinc-950 p-4 rounded-xl border border-stone-200 dark:border-zinc-800">
                    <input 
                      type="checkbox" 
                      id="notifications" 
                      checked={editedProfile.notificationsEnabled}
                      onChange={(e) => setEditedProfile({ ...editedProfile, notificationsEnabled: e.target.checked })}
                      className="h-5 w-5 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                    />
                    <label htmlFor="notifications" className="text-sm font-medium text-stone-700 dark:text-zinc-300 flex items-center gap-2">
                      <Bell className="h-4 w-4" aria-hidden="true" />
                      Enable Email Notifications
                    </label>
                  </div>
                  <div className="flex justify-center md:justify-start gap-4 pt-2">
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-2 px-6 py-2 rounded-full bg-amber-600 text-white font-bold uppercase tracking-tighter hover:bg-amber-500 transition-all"
                      aria-label="Save Changes"
                    >
                      <Save className="h-4 w-4" aria-hidden="true" />
                      Save Changes
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="flex items-center gap-2 px-6 py-2 rounded-full bg-stone-200 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100 transition-all"
                      aria-label="Cancel Editing"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-stone-900 dark:text-zinc-100">
                      {profile?.displayName || user.displayName || 'Anonymous Member'}
                    </h1>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-bold uppercase tracking-widest self-center md:self-auto" aria-label={`Role: ${profile?.role || 'Member'}`}>
                      <Shield className="h-3 w-3" aria-hidden="true" />
                      {profile?.role || 'Member'}
                    </div>
                  </div>
                  <p className="text-stone-600 dark:text-zinc-400 max-w-xl mb-6 leading-relaxed">
                    {profile?.bio || 'No biography provided. Edit your profile to share your co-op interests with the community.'}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {profile?.organization && (
                      <span className="inline-flex items-center rounded-full bg-stone-100 dark:bg-zinc-800 px-3 py-1 text-xs font-bold uppercase tracking-widest text-stone-600 dark:text-zinc-300">
                        {profile.organization}
                      </span>
                    )}
                    {profile?.visibility && (
                      <span className="inline-flex items-center rounded-full bg-stone-100 dark:bg-zinc-800 px-3 py-1 text-xs font-bold uppercase tracking-widest text-stone-600 dark:text-zinc-300">
                        {profile.visibility === 'public' ? 'Public Profile' : 'Members Only'}
                      </span>
                    )}
                    {profile?.focusAreas?.slice?.(0, 3)?.map?.((area: string) => (
                      <span key={area} className="inline-flex items-center rounded-full bg-amber-50 dark:bg-amber-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">
                        {area}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={startEditing}
                    className="flex items-center gap-2 px-6 py-2 rounded-full bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100 hover:bg-stone-200 dark:hover:bg-zinc-700 transition-all mx-auto md:mx-0 font-medium"
                    aria-label="Edit Profile"
                  >
                    <Edit3 className="h-4 w-4" aria-hidden="true" />
                    Edit Profile
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats & Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-3xl p-6 flex items-center gap-4 shadow-sm transition-colors duration-300">
            <div className="h-12 w-12 rounded-2xl bg-stone-50 dark:bg-zinc-950 flex items-center justify-center text-stone-400 dark:text-zinc-500" aria-hidden="true">
              <Mail className="h-6 w-6" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold uppercase tracking-widest text-stone-500 dark:text-zinc-500">Email Address</p>
              <p className="text-stone-900 dark:text-zinc-100 font-medium truncate" aria-label={`Email: ${user.email}`}>{user.email}</p>
            </div>
          </div>
          
          <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-3xl p-6 flex items-center gap-4 shadow-sm transition-colors duration-300">
            <div className="h-12 w-12 rounded-2xl bg-stone-50 dark:bg-zinc-950 flex items-center justify-center text-stone-400 dark:text-zinc-500" aria-hidden="true">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-stone-500 dark:text-zinc-500">Member Since</p>
              <p className="text-stone-900 dark:text-zinc-100 font-medium">
                {profile?.createdAt?.toDate ? new Date(profile.createdAt.toDate()).toLocaleDateString() : 'Recently'}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-3xl p-6 flex items-center gap-4 shadow-sm transition-colors duration-300">
            <div className="h-12 w-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-500" aria-hidden="true">
              <Bell className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-stone-500 dark:text-zinc-500">Notifications</p>
              <p className="text-stone-900 dark:text-zinc-100 font-medium">
                {profile?.notificationsEnabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
