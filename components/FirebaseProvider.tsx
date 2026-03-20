'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/firebase';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  isAuthReady: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAuthReady: false,
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const loadProfile = useCallback(async (currentUser: User) => {
    const userDocRef = doc(db, 'users', currentUser.uid);
    const publicProfileRef = doc(db, 'profiles', currentUser.uid);

    const [userDoc, publicProfileDoc] = await Promise.all([
      getDoc(userDocRef),
      getDoc(publicProfileRef),
    ]);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      const publicProfileData = publicProfileDoc.exists() ? publicProfileDoc.data() : {};
      setProfile({
        ...publicProfileData,
        uid: currentUser.uid,
        displayName: publicProfileData.displayName ?? userData.displayName ?? currentUser.displayName ?? 'Anonymous Bee',
        avatarUrl: publicProfileData.avatarUrl ?? userData.avatarUrl ?? currentUser.photoURL ?? '',
        email: userData.email ?? currentUser.email,
        role: userData.role ?? 'member',
        notificationsEnabled: userData.notificationsEnabled ?? false,
        deleted: Boolean(userData.deleted),
        photoURL: currentUser.photoURL,
        createdAt: publicProfileData.createdAt ?? userData.createdAt,
        updatedAt: publicProfileData.updatedAt ?? userData.updatedAt,
      });
      return;
    }

    const newProfile: Record<string, any> = {
      uid: currentUser.uid,
      displayName: currentUser.displayName || 'Anonymous Bee',
      email: currentUser.email || '',
      role: 'member',
      notificationsEnabled: false,
      deleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (currentUser.photoURL) {
      newProfile.avatarUrl = currentUser.photoURL;
    }
    const firestoreProfile = {
      ...newProfile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(userDocRef, firestoreProfile);
    setProfile({
      ...(publicProfileDoc.exists() ? publicProfileDoc.data() : {}),
      ...newProfile,
      avatarUrl: (publicProfileDoc.exists() ? publicProfileDoc.data().avatarUrl : undefined) ?? newProfile.avatarUrl ?? '',
      photoURL: currentUser.photoURL,
      createdAt: { toDate: () => new Date() },
      updatedAt: { toDate: () => new Date() },
    });
  }, []);

  const refreshProfile = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setProfile(null);
      return;
    }

    try {
      await loadProfile(currentUser);
    } catch (error) {
      console.error('Error refreshing user profile:', error);
    }
  }, [loadProfile]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          await loadProfile(user);
        } catch (error) {
          console.error('Error fetching/creating user profile:', error);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, [loadProfile]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAuthReady, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

// Error handling utility as per instructions
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
