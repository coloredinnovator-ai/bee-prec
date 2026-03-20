'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = "An unexpected error occurred.";
      let isFirestoreError = false;

      try {
        // Check if it's our custom Firestore error JSON
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error && parsed.operationType) {
            errorMessage = `Database Error: ${parsed.error}`;
            isFirestoreError = true;
          }
        }
      } catch (e) {
        // Not a JSON error, use default
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-[40px] p-8 md:p-12 text-center shadow-2xl">
            <div className="h-20 w-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-red-500/20">
              <AlertTriangle className="h-10 w-10 text-red-500" />
            </div>
            
            <h1 className="font-display text-3xl font-black uppercase tracking-tighter text-zinc-100 mb-4">
              System <span className="text-red-500">Error</span>
            </h1>
            
            <p className="text-zinc-500 mb-8 leading-relaxed">
              {isFirestoreError 
                ? "We encountered a permission or data issue while accessing the B-PREC Nexus."
                : "Something went wrong in the swarm. Our systems have logged the issue."}
            </p>

            <div className="bg-zinc-950 rounded-2xl p-4 mb-8 border border-zinc-800 text-left overflow-auto max-h-32">
              <code className="text-xs text-red-400 font-mono break-all">
                {errorMessage}
              </code>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-yellow-500 text-zinc-950 font-black uppercase tracking-tighter hover:bg-yellow-400 transition-all"
              >
                <RefreshCw className="h-5 w-5" />
                Reload Swarm
              </button>
              <Link
                href="/"
                className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-zinc-800 text-zinc-100 font-black uppercase tracking-tighter hover:bg-zinc-700 transition-all"
              >
                <Home className="h-5 w-5" />
                Return Home
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
