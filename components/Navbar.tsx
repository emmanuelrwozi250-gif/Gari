'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import { useTheme } from './ThemeProvider';
import { useLanguage, type Locale } from '@/lib/language';
import {
  Car, Menu, X, Sun, Moon, User, LogOut, LayoutDashboard,
  Bell, ChevronDown, MessageSquare, Globe,
} from 'lucide-react';

const LOCALE_LABELS: Record<Locale, string> = { en: 'EN', fr: 'FR', rw: 'RW' };
const LOCALE_FLAGS: Record<Locale, string> = { en: '🇬🇧', fr: '🇫🇷', rw: '🇷🇼' };

export function Navbar() {
  const { data: session } = useSession();
  const { theme, toggleTheme } = useTheme();
  const { locale, setLocale, t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-dark-bg text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <Car className="w-7 h-7 text-primary" strokeWidth={2.5} />
            <span className="text-2xl font-bold tracking-tight">
              Gar<span className="text-accent-yellow">i</span>
              <span className="text-primary text-sm">•</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            <Link href="/search" className="px-3 py-2 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5" /> {t('nav', 'rentCar')}
            </Link>
            <Link href="/safari" className="px-3 py-2 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1.5">
              🏕️ Safari
            </Link>
            <Link href="/airport-transfer" className="px-3 py-2 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1.5">
              ✈️ Airport
            </Link>
            {session && (session.user.role === 'HOST' || session.user.role === 'BOTH' || session.user.role === 'ADMIN') ? (
              <Link href="/dashboard/host" className="px-3 py-2 rounded-xl text-sm font-medium text-primary hover:text-white hover:bg-white/10 transition-all flex items-center gap-1.5">
                <LayoutDashboard className="w-3.5 h-3.5" /> Host Dashboard
              </Link>
            ) : (
              <Link href="/host" className="px-3 py-2 rounded-xl text-sm font-medium text-accent-yellow hover:text-white hover:bg-white/10 transition-all flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5" /> Become a Host
              </Link>
            )}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language switcher */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(v => !v)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-all text-sm"
              >
                <Globe className="w-4 h-4" />
                <span className="font-semibold">{LOCALE_LABELS[locale]}</span>
              </button>
              {langOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-gray-900 border border-white/10 rounded-xl shadow-xl py-1 z-50">
                  {(['en', 'fr', 'rw'] as Locale[]).map(l => (
                    <button
                      key={l}
                      onClick={() => { if (l === 'en') { setLocale(l); setLangOpen(false); } }}
                      className={`flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors ${
                        locale === l ? 'text-primary font-semibold bg-primary/10' : 'text-gray-300 hover:bg-white/10'
                      } ${l !== 'en' ? 'opacity-50 cursor-default' : ''}`}
                    >
                      <span>{LOCALE_FLAGS[l]}</span>
                      <span>{{ en: 'English', fr: 'Français', rw: 'Kinyarwanda' }[l]}</span>
                      {l !== 'en' && <span className="ml-auto text-[10px] text-gray-500">soon</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {session ? (
              <>
                <Link href="/dashboard" className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                  <Bell className="w-5 h-5" />
                </Link>
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 transition-all"
                  >
                    {session.user.image ? (
                      <div className="relative w-7 h-7 rounded-full overflow-hidden">
                        <Image src={session.user.image} alt="" fill className="object-cover" sizes="28px" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-xs font-bold">
                        {session.user.name?.[0] || 'U'}
                      </div>
                    )}
                    <span className="text-sm font-medium">{session.user.name?.split(' ')[0]}</span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-900 rounded-modal shadow-xl border border-border py-1 z-50">
                      <Link href="/dashboard" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-text-primary dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <LayoutDashboard className="w-4 h-4" /> Dashboard
                      </Link>
                      <Link href="/messages" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-text-primary dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <MessageSquare className="w-4 h-4" /> Messages
                      </Link>
                      {(session.user.role === 'HOST' || session.user.role === 'BOTH' || session.user.role === 'ADMIN') && (
                        <Link href="/dashboard/host" onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-text-primary dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800">
                          <Car className="w-4 h-4" /> Host Dashboard
                        </Link>
                      )}
                      <Link href="/profile" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-text-primary dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <User className="w-4 h-4" /> Profile
                      </Link>
                      <hr className="my-1 border-border" />
                      <button onClick={() => signOut({ callbackUrl: '/' })}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">
                  {t('nav', 'signIn')}
                </Link>
                <Link href="/register" className="btn-primary text-sm py-2 px-5">
                  {t('nav', 'getStarted')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/10 bg-dark-bg px-4 py-4 space-y-1">
          <Link href="/search" onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10">
            <Car className="w-4 h-4" /> Rent a Car
          </Link>
          <Link href="/safari" onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10">
            🏕️ Safari
          </Link>
          <Link href="/airport-transfer" onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10">
            ✈️ Airport Transfer
          </Link>
          <hr className="border-white/10 my-2" />
          {/* "Become a Host" always visible in mobile menu for non-hosts */}
          {(!session || (session.user.role !== 'HOST' && session.user.role !== 'BOTH' && session.user.role !== 'ADMIN')) && (
            <Link href="/host" onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-accent-yellow hover:text-white hover:bg-white/10">
              <Car className="w-4 h-4" /> Become a Host
            </Link>
          )}
          {session ? (
            <>
              <Link href="/dashboard" onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10">
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </Link>
              {(session.user.role === 'HOST' || session.user.role === 'BOTH' || session.user.role === 'ADMIN') && (
                <Link href="/dashboard/host" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-primary hover:text-white hover:bg-white/10">
                  <Car className="w-4 h-4" /> Host Dashboard
                </Link>
              )}
              <Link href="/messages" onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10">
                <MessageSquare className="w-4 h-4" /> Messages
              </Link>
              <button onClick={() => { setMenuOpen(false); signOut({ callbackUrl: '/' }); }}
                className="flex items-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-900/20">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </>
          ) : (
            <div className="flex gap-2 pt-2">
              <Link href="/login" onClick={() => setMenuOpen(false)}
                className="flex-1 text-center px-4 py-2 border border-white/20 rounded-xl text-sm text-gray-300">
                Sign In
              </Link>
              <Link href="/register" onClick={() => setMenuOpen(false)}
                className="flex-1 text-center px-4 py-2 bg-primary rounded-xl text-sm font-semibold text-white">
                Get Started
              </Link>
            </div>
          )}
          <div className="flex items-center justify-between px-4 pt-2">
            <span className="text-sm text-gray-400">Dark mode</span>
            <button onClick={toggleTheme} className="p-2 rounded-xl text-gray-400 hover:bg-white/10">
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
          <div className="flex items-center gap-1 px-4 pt-1 pb-2">
            {(['en', 'fr', 'rw'] as Locale[]).map(l => (
              <button
                key={l}
                onClick={() => { setLocale(l); setMenuOpen(false); }}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  locale === l ? 'bg-primary text-white' : 'bg-white/10 text-gray-300'
                }`}
              >
                {LOCALE_FLAGS[l]} {LOCALE_LABELS[l]}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
