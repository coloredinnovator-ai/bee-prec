'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { StatusNotice } from '@/components/StatusNotice';
import { useAuth } from '@/components/FirebaseProvider';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Upload, FileText, AlertTriangle, CheckCircle, Loader2, FileUp, X, Download, History, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import { collection, addDoc, query, where, orderBy, getDocs, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;
const MAX_PROMPT_LENGTH = 5000;
const ALLOWED_DOCUMENT_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'text/plain',
]);

function buildDocumentNotice(status: number, payload: any) {
  if (status === 401) {
    return {
      tone: 'info' as const,
      message: payload?.error || 'Sign in again before running secure document analysis.',
    };
  }

  if (status === 413) {
    return {
      tone: 'error' as const,
      message: payload?.error || 'This document is too large to analyze. Keep uploads under 5 MB.',
    };
  }

  if (status === 429) {
    const retryAfterSeconds =
      Number(payload?.retryAfterSeconds) > 0 ? Number(payload.retryAfterSeconds) : null;
    return {
      tone: 'info' as const,
      message:
        retryAfterSeconds != null
          ? `Document analysis is rate limited for your account. Try again in about ${retryAfterSeconds} seconds.`
          : payload?.error || 'Document analysis is temporarily rate limited. Try again shortly.',
    };
  }

  if (status === 503) {
    return {
      tone: 'info' as const,
      message: 'Document analysis is temporarily unavailable on the server. Try again shortly.',
    };
  }

  return {
    tone: 'error' as const,
    message: payload?.error || 'Failed to generate analysis. Please try again.',
  };
}

export default function NexusAIPage() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: 'error' | 'info' | 'success'; message: string } | null>(null);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [history, setHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loweredNotice = notice?.message?.toLowerCase() || '';
  const noticeNeedsReconnect = Boolean(
    loweredNotice.includes('sign in') || loweredNotice.includes('session')
  );

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    setIsLoadingHistory(true);
    try {
      const q = query(
        collection(db, 'aiAnalyses'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const historyData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistory(historyData);
    } catch (err) {
      console.error('Failed to fetch history:', err);
      setNotice({
        tone: 'info',
        message: 'We could not load your saved analysis history right now.',
      });
    } finally {
      setIsLoadingHistory(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user, fetchHistory]);

  const validateSelectedFile = (candidate: File) => {
    if (!ALLOWED_DOCUMENT_TYPES.has(candidate.type)) {
      return 'Unsupported file type. Upload a PDF, PNG, JPG, or TXT file.';
    }

    if (candidate.size > MAX_DOCUMENT_BYTES) {
      return 'Document too large. Maximum supported size is 5 MB.';
    }

    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validationError = validateSelectedFile(selectedFile);
      if (validationError) {
        setFile(null);
        setPreviewUrl(null);
        setAnalysisResult(null);
        setNotice({ tone: 'error', message: validationError });
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      setFile(selectedFile);
      setNotice(null);
      setAnalysisResult(null);
      
      // Create preview for images
      if (selectedFile.type.startsWith('image/')) {
        const url = URL.createObjectURL(selectedFile);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreviewUrl(null);
    setAnalysisResult(null);
    setNotice(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const promptSignIn = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (err) {
      console.error('Nexus AI connect failed:', err);
      setNotice({
        tone: 'error',
        message: 'Could not start sign-in. Use the Connect button in the header and try again.',
      });
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
          const base64String = reader.result.split(',')[1];
          resolve(base64String);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = error => reject(error);
    });
  };

  const analyzeDocument = async () => {
    if (!file) return;

    if (!user) {
      setNotice({ tone: 'info', message: 'Sign in to run secure document analysis.' });
      return;
    }

    const validationError = validateSelectedFile(file);
    if (validationError) {
      setNotice({ tone: 'error', message: validationError });
      return;
    }

    setIsAnalyzing(true);
    setNotice(null);
    setAnalysisResult(null);

    try {
      const base64Data = await fileToBase64(file);

      const defaultPrompt = `Analyze this document for a cooperative enterprise. 
      Please provide:
      1. A brief summary of the document.
      2. Key legal or operational risks identified.
      3. Recommended actions for the cooperative board.
      Format the response in clean Markdown.`;

      const finalPrompt = customPrompt.trim() ? customPrompt : defaultPrompt;
      if (finalPrompt.length > MAX_PROMPT_LENGTH) {
        setNotice({
          tone: 'error',
          message: `Prompt too long. Maximum supported prompt length is ${MAX_PROMPT_LENGTH} characters.`,
        });
        setIsAnalyzing(false);
        return;
      }

      const requestDocumentAnalysis = async (forceRefresh = false) => {
        const token = await user.getIdToken(forceRefresh);
        const response = await fetch('/api/document-analysis', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            fileName: file.name,
            mimeType: file.type,
            base64Data,
            prompt: finalPrompt,
          }),
        });
        const payload = await response.json();
        return { response, payload };
      };

      let { response, payload } = await requestDocumentAnalysis();
      if (response.status === 401) {
        ({ response, payload } = await requestDocumentAnalysis(true));
      }

      if (!response.ok) {
        setNotice(buildDocumentNotice(response.status, payload));
        return;
      }

      if (payload.result) {
        setAnalysisResult(payload.result);
        
        // Save to history if user is logged in
        if (user) {
          try {
            await addDoc(collection(db, 'aiAnalyses'), {
              userId: user.uid,
              fileName: file.name,
              fileType: file.type,
              prompt: finalPrompt,
              result: payload.result,
              createdAt: serverTimestamp()
            });
            fetchHistory(); // Refresh history
          } catch (saveErr) {
            console.error('Failed to save analysis to history:', saveErr);
            setNotice({
              tone: 'info',
              message:
                'Analysis completed, but we could not save it to your history. Download the result if you need to keep it.',
            });
          }
        }
      } else {
        setNotice({ tone: 'error', message: 'Failed to generate analysis. Please try again.' });
      }
    } catch (err: any) {
      console.error('Analysis error:', err);
      setNotice({
        tone: 'error',
        message: err.message || 'An error occurred during analysis.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const downloadAnalysis = () => {
    if (!analysisResult || !file) return;
    
    const element = document.createElement("a");
    const fileContent = new Blob([analysisResult], {type: 'text/markdown'});
    element.href = URL.createObjectURL(fileContent);
    element.download = `Analysis_${file.name}.md`;
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
    document.body.removeChild(element);
  };

  return (
    <main className="min-h-screen pb-20 bg-stone-50 dark:bg-zinc-950 transition-colors duration-300">
      <Navbar />
      
      <div className="mx-auto max-w-4xl px-4 pt-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 mb-6">
            <Sparkles className="h-8 w-8" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-black uppercase tracking-tighter text-stone-900 dark:text-zinc-100 mb-4">
            Nexus <span className="text-amber-500">AI</span> Analysis
          </h1>
          <p className="text-stone-600 dark:text-zinc-400 max-w-2xl mx-auto text-lg">
            Upload cooperative bylaws, contracts, or meeting minutes. Our AI will analyze the document for legal risks, compliance issues, and provide actionable recommendations.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            <Sparkles className="h-4 w-4" />
            Analysis runs through the secured server route. Sign in is required for analysis and history.
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-stone-200 dark:border-zinc-800 shadow-sm p-8 mb-8 transition-colors duration-300">
          {!user && (
            <div className="mb-6 space-y-4">
              <StatusNotice
                tone="info"
                message="Sign in before uploading a document. Secure analysis and retained history are available only to authenticated members."
              />
              <button
                type="button"
                onClick={promptSignIn}
                className="inline-flex items-center gap-2 rounded-full border border-amber-300 px-5 py-2 text-sm font-bold uppercase tracking-widest text-amber-700 transition-colors hover:border-amber-500 hover:text-amber-600 dark:border-amber-500/30 dark:text-amber-300 dark:hover:border-amber-400 dark:hover:text-amber-200"
              >
                Connect Account
              </button>
            </div>
          )}

          {!file ? (
            <div 
              className={`border-2 border-dashed border-stone-300 dark:border-zinc-700 rounded-2xl p-12 text-center transition-colors ${
                user
                  ? 'hover:border-amber-500 dark:hover:border-amber-500 cursor-pointer'
                  : 'opacity-60 cursor-not-allowed'
              }`}
              onClick={() => {
                if (user) {
                  fileInputRef.current?.click();
                }
              }}
            >
              <FileUp className="h-12 w-12 text-stone-400 dark:text-zinc-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-stone-900 dark:text-zinc-100 mb-2">Upload Document</h3>
              <p className="text-stone-500 dark:text-zinc-400 text-sm mb-6">
                Supports PDF, PNG, JPG, and TXT files up to 5 MB.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (user) {
                    fileInputRef.current?.click();
                  } else {
                    promptSignIn();
                  }
                }}
                className="px-6 py-2 rounded-full bg-stone-100 dark:bg-zinc-800 text-stone-900 dark:text-zinc-100 font-medium transition-colors disabled:opacity-60"
              >
                {user ? 'Browse Files' : 'Connect To Upload'}
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-full flex items-center justify-between p-4 bg-stone-50 dark:bg-zinc-950 rounded-xl border border-stone-200 dark:border-zinc-800 mb-6">
                <div className="flex items-center gap-4 overflow-hidden">
                  <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-500 shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="truncate">
                    <p className="font-medium text-stone-900 dark:text-zinc-100 truncate">{file.name}</p>
                    <p className="text-xs text-stone-500 dark:text-zinc-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button 
                  onClick={clearFile}
                  className="p-2 text-stone-400 hover:text-red-500 transition-colors"
                  disabled={isAnalyzing}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {previewUrl && (
                <div className="mb-6 max-w-sm w-full rounded-xl overflow-hidden border border-stone-200 dark:border-zinc-800">
                  <Image src={previewUrl} alt="Document preview" width={400} height={300} className="w-full h-auto" unoptimized />
                </div>
              )}

              <div className="w-full mb-6">
                <label className="block text-sm font-medium text-stone-700 dark:text-zinc-300 mb-2">
                  Custom Instructions (Optional)
                </label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  maxLength={MAX_PROMPT_LENGTH}
                  placeholder="e.g., Focus specifically on intellectual property clauses..."
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-stone-900 dark:text-zinc-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all resize-none h-24"
                  disabled={isAnalyzing}
                />
                <p className="mt-2 text-right text-[11px] font-medium text-stone-500 dark:text-zinc-500">
                  {customPrompt.length}/{MAX_PROMPT_LENGTH}
                </p>
              </div>

              <button
                onClick={analyzeDocument}
                disabled={isAnalyzing || !user}
                className={`flex items-center gap-2 px-8 py-3 rounded-full font-bold uppercase tracking-tighter transition-all ${
                  isAnalyzing || !user
                    ? 'bg-stone-200 dark:bg-zinc-800 text-stone-400 dark:text-zinc-600 cursor-not-allowed' 
                    : 'bg-amber-500 text-white hover:bg-amber-600 shadow-md hover:shadow-lg'
                }`}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Analyzing Document...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    Analyze Document
                  </>
                )}
              </button>
            </div>
          )}
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/png,image/jpeg,application/pdf,text/plain"
          />
        </div>

        <AnimatePresence>
          {notice && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-8 space-y-3"
            >
              <StatusNotice tone={notice.tone} message={notice.message} />
              {noticeNeedsReconnect && (
                <button
                  type="button"
                  onClick={promptSignIn}
                  className="inline-flex items-center gap-2 rounded-full border border-amber-300 px-5 py-2 text-sm font-bold uppercase tracking-widest text-amber-700 transition-colors hover:border-amber-500 hover:text-amber-600 dark:border-amber-500/30 dark:text-amber-300 dark:hover:border-amber-400 dark:hover:text-amber-200"
                >
                  Reconnect Account
                </button>
              )}
            </motion.div>
          )}

          {analysisResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl border border-stone-200 dark:border-zinc-800 shadow-sm p-8 transition-colors duration-300"
            >
              <div className="flex items-center justify-between mb-6 pb-6 border-b border-stone-100 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-emerald-500" />
                  <h2 className="text-xl font-bold text-stone-900 dark:text-zinc-100">Analysis Complete</h2>
                </div>
                <button
                  onClick={downloadAnalysis}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 hover:bg-stone-200 dark:hover:bg-zinc-700 transition-colors text-sm font-medium"
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
              </div>
              
              <div className="prose prose-stone dark:prose-invert max-w-none prose-headings:font-serif prose-a:text-amber-600 dark:prose-a:text-amber-500 hover:prose-a:text-amber-700 dark:hover:prose-a:text-amber-400">
                <ReactMarkdown>{analysisResult}</ReactMarkdown>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History Section */}
        {user && (
          <div className="mt-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-stone-900 dark:text-zinc-100 flex items-center gap-2">
                <History className="h-6 w-6 text-amber-500" />
                Analysis History
              </h2>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="text-stone-500 hover:text-stone-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors text-sm font-medium"
              >
                {showHistory ? 'Hide History' : 'Show History'}
              </button>
            </div>

            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  {isLoadingHistory ? (
                    <div className="rounded-2xl border border-stone-200 bg-white p-6 text-sm text-stone-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                      Loading your saved analyses...
                    </div>
                  ) : history.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-stone-200 bg-white p-6 text-sm text-stone-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                      No saved analyses yet. Completed analyses will appear here when history retention succeeds.
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {history.map((item) => (
                        <div 
                          key={item.id}
                          className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl p-6 hover:border-amber-500 dark:hover:border-amber-500 transition-colors cursor-pointer group"
                          onClick={() => {
                            setAnalysisResult(item.result);
                            setCustomPrompt(item.prompt);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-stone-100 dark:bg-zinc-800 flex items-center justify-center text-stone-500 dark:text-zinc-400">
                                <FileText className="h-5 w-5" />
                              </div>
                              <div>
                                <h3 className="font-bold text-stone-900 dark:text-zinc-100 truncate max-w-[200px]">{item.fileName}</h3>
                                <p className="text-xs text-stone-500 dark:text-zinc-500">
                                  {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : 'Recent'}
                                </p>
                              </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-stone-300 dark:text-zinc-600 group-hover:text-amber-500 transition-colors" />
                          </div>
                          <p className="text-sm text-stone-600 dark:text-zinc-400 line-clamp-2">
                            {item.result.replace(/[#*]/g, '')}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </main>
  );
}
