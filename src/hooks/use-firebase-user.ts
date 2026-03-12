"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { useEffect, useState } from "react";

import { getClientAuth } from "@/lib/firebase/client";

type UserState = {
  loading: boolean;
  user: User | null;
};

export function useFirebaseUser() {
  const [state, setState] = useState<UserState>({ loading: true, user: null });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getClientAuth(), (user) => {
      setState({ loading: false, user });
    });

    return () => unsubscribe();
  }, []);

  return state;
}
