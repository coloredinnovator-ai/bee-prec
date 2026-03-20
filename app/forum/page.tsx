'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { StatusNotice } from '@/components/StatusNotice';
import { useAuth, OperationType, handleFirestoreError } from '@/components/FirebaseProvider';
import { collection, query, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, increment, where, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Plus, ThumbsUp, Tag, Clock, User as UserIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function ForumPage() {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', body: '', category: 'general' });
  const [searchQuery, setSearchQuery] = useState('');
  const [notice, setNotice] = useState<{
    tone: 'error' | 'info' | 'success';
    message: string;
  } | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'communityPosts'),
      where('removed', '==', false),
      where('moderationStatus', '==', 'approved')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      postsData.sort((a: any, b: any) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      setPosts(postsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'communityPosts');
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setNotice({
        tone: 'info',
        message: 'Connect your account to publish a forum post.',
      });
      return;
    }

    try {
      await addDoc(collection(db, 'communityPosts'), {
        title: newPost.title,
        body: newPost.body,
        category: newPost.category,
        createdBy: user.uid,
        authorName: profile?.displayName || user.displayName || 'Anonymous Bee',
        likes: 0,
        likedBy: [],
        flags: 0,
        removed: false,
        moderationStatus: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setNewPost({ title: '', body: '', category: 'general' });
      setIsPosting(false);
      setNotice({
        tone: 'success',
        message: 'Your post was submitted for moderation and will appear once approved.',
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'communityPosts');
    }
  };

  const toggleLike = async (post: any) => {
    if (!user) {
      setNotice({
        tone: 'info',
        message: 'Connect your account to react to community posts.',
      });
      return;
    }

    const hasLiked = post.likedBy?.includes(user.uid);

    try {
      await updateDoc(doc(db, 'communityPosts', post.id), {
        likedBy: hasLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
        likes: increment(hasLiked ? -1 : 1),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `communityPosts/${post.id}`);
    }
  };

  const filteredPosts = posts.filter(p => 
    p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.body?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="min-h-screen pb-20">
      <Navbar />
      
      <div className="mx-auto max-w-5xl px-4 pt-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="font-display text-4xl font-black uppercase tracking-tighter text-zinc-100">
              Community <span className="text-yellow-500">Forum</span>
            </h1>
            <p className="text-zinc-500 mt-2">Share knowledge and build the swarm.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search forum..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded-full pl-4 pr-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-yellow-500 transition-all w-full md:w-64"
              />
            </div>
            {user && (
              <button
                onClick={() => setIsPosting(!isPosting)}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-yellow-500 text-zinc-950 font-bold uppercase tracking-tighter hover:bg-yellow-400 transition-all shrink-0"
              >
                <Plus className="h-5 w-5" />
                New Post
              </button>
            )}
          </div>
        </div>

        {notice && (
          <StatusNotice
            tone={notice.tone}
            message={notice.message}
            className="mb-8"
          />
        )}

        <AnimatePresence>
          {isPosting && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-12 overflow-hidden"
            >
              <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Title</label>
                    <input
                      required
                      value={newPost.title}
                      onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-yellow-500 transition-colors"
                      placeholder="What's on your mind?"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Category</label>
                    <select
                      value={newPost.category}
                      onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-yellow-500 transition-colors"
                    >
                      <option value="general">General Discussion</option>
                      <option value="legal">Legal Advice</option>
                      <option value="resources">Resource Sharing</option>
                      <option value="sharing">Co-op Stories</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Content</label>
                  <textarea
                    required
                    rows={5}
                    value={newPost.body}
                    onChange={(e) => setNewPost({ ...newPost, body: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-yellow-500 transition-colors resize-none"
                    placeholder="Describe your thoughts..."
                  />
                </div>
                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setIsPosting(false)}
                    className="px-6 py-2 rounded-full text-zinc-400 hover:text-zinc-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-2 rounded-full bg-yellow-500 text-zinc-950 font-bold uppercase tracking-tighter hover:bg-yellow-400 transition-all"
                  >
                    Publish Post
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-6">
          {filteredPosts.map((post) => (
            <motion.div
              layout
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 hover:border-zinc-700 transition-all group"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-zinc-900 flex items-center justify-center text-yellow-500">
                    <UserIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-100 group-hover:text-yellow-500 transition-colors">{post.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                      <span className="flex items-center gap-1">
                        <UserIcon className="h-3 w-3" />
                        {post.authorName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {post.createdAt?.toDate ? formatDistanceToNow(post.createdAt.toDate()) + ' ago' : 'Just now'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  <Tag className="h-3 w-3" />
                  {post.category}
                </div>
              </div>
              
              <p className="text-zinc-400 leading-relaxed mb-6 whitespace-pre-wrap">
                {post.body}
              </p>
              
              <div className="flex items-center gap-4 pt-6 border-t border-zinc-900">
                <button
                  onClick={() => toggleLike(post)}
                  className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                    user && post.likedBy?.includes(user.uid)
                      ? 'text-yellow-500'
                      : 'text-zinc-500 hover:text-zinc-100'
                  }`}
                >
                  <ThumbsUp className="h-4 w-4" />
                  {post.likes || 0}
                </button>
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-600">
                  Approved for public discussion
                </span>
              </div>
            </motion.div>
          ))}
          
          {filteredPosts.length === 0 && (
            <div className="text-center py-20 bg-zinc-900/30 rounded-3xl border border-dashed border-zinc-800">
              <MessageSquare className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500">No posts found.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
