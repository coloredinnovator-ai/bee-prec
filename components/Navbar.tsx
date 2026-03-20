'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import { Shield, MessageSquare, Package, User, LogIn, LogOut, Menu, X, Building2, Sparkles, Wrench, FileText, Moon, Sun, Map as MapIcon, Briefcase } from 'lucide-react';
import { auth } from '@/firebase';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { useAuth } from './FirebaseProvider';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import Image from 'next/image';

export function Navbar() {
  const pathname = usePathname();
  const { user, profile } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const login = () => signInWithPopup(auth, new GoogleAuthProvider());
  const logout = () => signOut(auth);

  const navItems = [
    { name: 'Units', href: '/units', icon: Building2 },
    { name: 'Maintenance', href: '/maintenance', icon: Wrench },
    { name: 'Minutes', href: '/meeting-minutes', icon: FileText },
    { name: 'Nexus AI', href: '/nexus-ai', icon: Sparkles },
    { name: 'Forum', href: '/forum', icon: MessageSquare },
    { name: 'Resources', href: '/resources', icon: Package },
    { name: 'Legal', href: '/legal', icon: Shield },
    { name: 'Attorneys', href: '/attorneys', icon: User },
    { name: 'Map', href: '/map', icon: MapIcon },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-stone-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group" aria-label="Home">
              <div className="relative h-8 w-8 overflow-hidden rounded-lg bg-amber-500 flex items-center justify-center">
                <span className="font-display font-black text-white dark:text-zinc-950 text-xl">B</span>
              </div>
              <span className="font-display text-xl font-black tracking-tighter text-stone-900 dark:text-zinc-100 group-hover:text-amber-500 transition-colors">
                B-PREC
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-1" role="navigation" aria-label="Main Navigation">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                    pathname === item.href
                      ? "bg-stone-100 dark:bg-zinc-800 text-amber-600 dark:text-amber-500"
                      : "text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100 hover:bg-stone-100 dark:hover:bg-zinc-900"
                  )}
                  aria-current={pathname === item.href ? 'page' : undefined}
                >
                  <item.icon className="h-4 w-4" aria-hidden="true" />
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-full text-stone-600 dark:text-zinc-400 hover:bg-stone-100 dark:hover:bg-zinc-900 transition-colors"
                aria-label="Toggle Dark Mode"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            )}

            {user ? (
              <div className="flex items-center gap-4">
                {(profile?.role === 'admin' || profile?.role === 'board') && (
                  <Link
                    href="/admin"
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                      pathname === '/admin'
                        ? "bg-stone-100 dark:bg-zinc-800 text-amber-600 dark:text-amber-500"
                        : "text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100 hover:bg-stone-100 dark:hover:bg-zinc-900"
                    )}
                    aria-label="Admin Dashboard"
                  >
                    <Shield className="h-4 w-4" aria-hidden="true" />
                    <span className="hidden lg:inline">Admin</span>
                  </Link>
                )}
                {(profile?.role === 'lawyer' || profile?.role === 'admin') && (
                  <Link
                    href="/attorneys/profile"
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                      pathname === '/attorneys/profile'
                        ? "bg-stone-100 dark:bg-zinc-800 text-amber-600 dark:text-amber-500"
                        : "text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100 hover:bg-stone-100 dark:hover:bg-zinc-900"
                    )}
                    aria-label="Attorney Dashboard"
                  >
                    <Briefcase className="h-4 w-4" aria-hidden="true" />
                    <span className="hidden lg:inline">Dashboard</span>
                  </Link>
                )}
                <Link
                  href="/profile"
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                    pathname === '/profile'
                      ? "bg-stone-100 dark:bg-zinc-800 text-amber-600 dark:text-amber-500"
                      : "text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100 hover:bg-stone-100 dark:hover:bg-zinc-900"
                  )}
                  aria-label="User Profile"
                >
                  {profile?.avatarUrl || user.photoURL ? (
                    <div className="h-6 w-6 rounded-full overflow-hidden relative border border-stone-200 dark:border-zinc-700">
                      <Image 
                        src={profile?.avatarUrl || user.photoURL || ''} 
                        alt="Avatar" 
                        fill 
                        className="object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <User className="h-4 w-4" aria-hidden="true" />
                  )}
                  <span className="hidden lg:inline">{profile?.displayName || 'Profile'}</span>
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-stone-600 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-400/10 transition-all"
                  aria-label="Logout"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden lg:inline">Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={login}
                className="flex items-center gap-2 px-6 py-2 rounded-full text-sm font-bold bg-amber-500 text-white dark:text-zinc-950 hover:bg-amber-600 dark:hover:bg-amber-400 transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                aria-label="Connect Account"
              >
                <LogIn className="h-4 w-4" aria-hidden="true" />
                Connect
              </button>
            )}
          </div>

          <div className="flex md:hidden items-center gap-2">
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-full text-stone-600 dark:text-zinc-400 hover:bg-stone-100 dark:hover:bg-zinc-900 transition-colors"
                aria-label="Toggle Dark Mode"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100 p-2"
              aria-label={isOpen ? "Close Menu" : "Open Menu"}
              aria-expanded={isOpen}
            >
              {isOpen ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden border-b border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-4 space-y-2"
          role="menu"
        >
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium",
                pathname === item.href
                  ? "bg-stone-100 dark:bg-zinc-800 text-amber-600 dark:text-amber-500"
                  : "text-stone-600 dark:text-zinc-400"
              )}
              role="menuitem"
            >
              <item.icon className="h-5 w-5" aria-hidden="true" />
              {item.name}
            </Link>
          ))}
          <hr className="border-stone-200 dark:border-zinc-800 my-2" />
          {user ? (
            <>
              {(profile?.role === 'admin' || profile?.role === 'board') && (
                <Link
                  href="/admin"
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium",
                    pathname === '/admin'
                      ? "bg-stone-100 dark:bg-zinc-800 text-amber-600 dark:text-amber-500"
                      : "text-stone-600 dark:text-zinc-400"
                  )}
                  role="menuitem"
                >
                  <Shield className="h-5 w-5" aria-hidden="true" />
                  Admin Dashboard
                </Link>
              )}
              <Link
                href="/profile"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-stone-600 dark:text-zinc-400"
                role="menuitem"
              >
                <User className="h-5 w-5" aria-hidden="true" />
                Profile
              </Link>
              <button
                onClick={() => {
                  logout();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-red-500 dark:text-red-400"
                role="menuitem"
              >
                <LogOut className="h-5 w-5" aria-hidden="true" />
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                login();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-bold bg-amber-500 text-white dark:text-zinc-950"
              role="menuitem"
            >
              <LogIn className="h-5 w-5" aria-hidden="true" />
              Connect
            </button>
          )}
        </motion.div>
      )}
    </nav>
  );
}
