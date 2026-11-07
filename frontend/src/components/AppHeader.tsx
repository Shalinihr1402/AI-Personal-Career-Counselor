import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BrainCircuit,
  LogOut,
  Menu,
  X,
  Compass,
  LayoutDashboard,
  Search,
  Map,
  Mic,
  ChevronDown,
  Settings,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';

import { CalendarCheck } from 'lucide-react';
const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/assessment', label: 'Discover Careers', icon: Compass },
  { to: '/careers', label: 'Career Explorer', icon: Search },
  { to: '/roadmap', label: 'Roadmap', icon: Map },
  { to: '/today', label: 'Today', icon: CalendarCheck },
];

export default function AppHeader() {
  const { user, signOut } = useAuth();
  const { profile, setupNeeded } = useProfile();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const username = user?.email ? user.email.split('@')[0] : 'Student';
  const initial = username.charAt(0).toUpperCase();

  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Title */}
        <Link to="/dashboard" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-9 h-9 rounded-xl bg-violet-700 text-white flex items-center justify-center shadow-xs group-hover:bg-violet-800 transition-colors">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-slate-900 text-sm tracking-tight flex items-center gap-1.5">
              <span>Personal Career Counselor</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700 bg-violet-50 px-1.5 py-0.2 rounded border border-violet-100 hidden md:inline">
                AI SaaS
              </span>
            </span>
            <span className="text-[11px] text-slate-400 font-medium -mt-0.5 hidden sm:inline">
              Intelligence & Statutory Pathways
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1 text-xs font-semibold" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.to || (item.to !== '/dashboard' && pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-150 ${
                  isActive
                    ? 'bg-violet-50 text-violet-900 font-bold border border-violet-200/70 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-violet-700' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Dedicated AI Counselor Action */}
          <Link
            to="/assessment"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-violet-700 hover:text-violet-900 hover:bg-violet-50 transition-colors font-bold ml-1 border border-transparent hover:border-violet-100"
          >
            <Mic className="w-3.5 h-3.5 text-violet-600" />
            <span>AI Counselor</span>
          </Link>
        </nav>

        {/* User Account Menu & Controls */}
        <div className="flex items-center gap-2.5">
          {/* User Profile Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-xl border border-slate-200/70 hover:border-slate-300 bg-white hover:bg-slate-50 transition-all text-xs font-semibold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
              aria-expanded={profileDropdownOpen}
            >
              <div className="w-6 h-6 rounded-lg bg-violet-100 text-violet-800 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                {initial}
              </div>
              <span className="text-slate-700 font-bold hidden sm:inline max-w-[120px] truncate">
                {username}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {profileDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setProfileDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200/90 z-50 p-2 text-xs divide-y divide-slate-100 animate-in fade-in duration-100">
                  <div className="px-3 py-2.5">
                    <p className="font-bold text-slate-900 truncate">{username}</p>
                    <p className="text-slate-400 text-[11px] truncate">{user?.email}</p>
                    {profile?.targetRole && (
                      <div className="mt-2 pt-2 border-t border-slate-100">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Target Goal</span>
                        <span className="font-semibold text-violet-900 text-xs truncate block">{profile.targetRole}</span>
                      </div>
                    )}
                  </div>

                  <div className="py-1">
                    <Link
                      to="/onboarding"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors font-medium"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      <span>Edit Onboarding Profile</span>
                    </Link>
                    <Link
                      to="/assessment"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors font-medium"
                    >
                      <Sparkles className="w-4 h-4 text-violet-600" />
                      <span>Career Assessment</span>
                    </Link>
                  </div>

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors font-bold cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
            aria-label="Toggle mobile navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200/80 bg-white px-4 py-3 space-y-1 text-sm font-semibold animate-in slide-in-from-top-2 duration-150">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.to || (item.to !== '/dashboard' && pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-violet-50 text-violet-900 font-bold border border-violet-200/70'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-violet-700' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <Link
            to="/assessment"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-violet-700 hover:bg-violet-50 font-bold"
          >
            <Mic className="w-4 h-4 text-violet-600" />
            <span>AI Voice Counselor</span>
          </Link>
        </div>
      )}

      {/* Database Setup Warning Notice if applicable */}
      {setupNeeded && (
        <div className="bg-amber-50 border-t border-amber-200/70 text-amber-900 text-xs font-medium px-6 py-2 text-center flex items-center justify-center gap-2">
          <span>Database not set up yet — run migrations in Supabase SQL editor to save profile data.</span>
        </div>
      )}
    </header>
  );
}
