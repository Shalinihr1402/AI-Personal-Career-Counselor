import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppFooter from '../components/AppFooter';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { getJourneyStatus } from '../lib/profile';
import { INTEREST_DOMAINS } from '../lib/interestDomains';
import {
  ArrowRight,
  BrainCircuit,
  Check,
  Target,
  Search,
  TrendingUp,
  Compass,
  BarChart2,
  Sparkles,
  Calculator,
  BookOpen,
  Code,
  Activity,
  Wrench,
  DollarSign,
  Palette,
  Users,
  Shield,
  GraduationCap,
  Layers,
  Briefcase,
} from 'lucide-react';

const renderDomainIcon = (iconName: string) => {
  const iconClass = 'w-5 h-5 text-[#168C89] group-hover:text-white transition-colors';
  switch (iconName) {
    case 'Calculator':
      return <Calculator className={iconClass} />;
    case 'BookOpen':
      return <BookOpen className={iconClass} />;
    case 'BarChart2':
      return <BarChart2 className={iconClass} />;
    case 'Code':
      return <Code className={iconClass} />;
    case 'Activity':
      return <Activity className={iconClass} />;
    case 'Wrench':
      return <Wrench className={iconClass} />;
    case 'Compass':
      return <Compass className={iconClass} />;
    case 'DollarSign':
      return <DollarSign className={iconClass} />;
    case 'Palette':
      return <Palette className={iconClass} />;
    case 'Users':
      return <Users className={iconClass} />;
    case 'Shield':
      return <Shield className={iconClass} />;
    case 'GraduationCap':
      return <GraduationCap className={iconClass} />;
    default:
      return <Sparkles className={iconClass} />;
  }
};

const Home: React.FC = () => {
  const { user, loading, signOut } = useAuth();
  const { profile, assessment, activeGoal, loading: profileLoading } = useProfile();
  const navigate = useNavigate();

  // Scroll Reveal IntersectionObserver
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Respect user's reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.querySelectorAll('.reveal-init').forEach((el) => {
        el.classList.add('revealed');
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target); // Unobserve so animation only triggers once
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    const elements = document.querySelectorAll('.reveal-init');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  // Detect OAuth exchange parameters
  const hasAuthParams =
    typeof window !== 'undefined' &&
    (window.location.hash.includes('access_token') || window.location.search.includes('code='));

  // If user completed an OAuth callback, navigate to journey destination
  useEffect(() => {
    if (hasAuthParams && !loading && user && !profileLoading) {
      const { nextRoute } = getJourneyStatus(profile, assessment, activeGoal);
      navigate(nextRoute, { replace: true });
    }
  }, [hasAuthParams, user, loading, profile, assessment, activeGoal, profileLoading, navigate]);

  if (hasAuthParams && (loading || (user && profileLoading))) {
    return (
      <div className="min-h-screen bg-[#0B1930] flex items-center justify-center font-sans text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#168C89]/30 border-t-[#168C89] rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-300">Signing you in and loading your journey...</p>
        </div>
      </div>
    );
  }

  const { nextRoute } = user && !profileLoading ? getJourneyStatus(profile, assessment, activeGoal) : { nextRoute: '/onboarding' };

  return (
    <div className="min-h-screen bg-[#F5F8FC] font-sans text-[#172638] selection:bg-[#EAF5F4] overflow-x-hidden">
      
      {/* 1. CINEMATIC DARK NAVIGATION BAR */}
      <header className="sticky top-0 z-50 bg-[#0B1930]/90 backdrop-blur-md border-b border-[#142B4A]/80 text-white transition-all">
        <nav className="flex items-center justify-between px-4 sm:px-6 py-3.5 max-w-7xl mx-auto">
          {/* Logo & Platform Name */}
          <Link to="/" className="flex items-center gap-3 min-w-0 pr-2 group">
            <div className="w-9 h-9 rounded-xl bg-[#142B4A] border border-[#168C89]/40 flex items-center justify-center shadow-xs group-hover:border-[#168C89] group-hover:scale-105 transition-all shrink-0">
              <BrainCircuit className="w-5 h-5 text-[#168C89]" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs sm:text-base font-extrabold tracking-tight text-white flex items-center gap-1.5 truncate">
                <span className="hidden sm:inline">Personal Career Counselor</span>
                <span className="sm:hidden font-bold">Counselor</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300 bg-[#168C89]/20 px-1.5 py-0.5 rounded border border-[#168C89]/40 hidden md:inline">
                  AI SaaS
                </span>
              </span>
              <span className="text-[11px] text-slate-400 font-medium -mt-0.5 hidden sm:inline truncate">
                Evidence Intelligence & Statutory Pathways
              </span>
            </div>
          </Link>
          
          {/* Center Links */}
          <div className="hidden lg:flex items-center gap-7 text-xs font-semibold text-slate-300">
            <a href="#how-it-works" className="hover:text-teal-300 transition-colors focus-visible:ring-2 focus-visible:ring-[#168C89] outline-none rounded">How It Works</a>
            <a href="#features" className="hover:text-teal-300 transition-colors focus-visible:ring-2 focus-visible:ring-[#168C89] outline-none rounded">Core Features</a>
            <a href="#domains" className="hover:text-teal-300 transition-colors focus-visible:ring-2 focus-visible:ring-[#168C89] outline-none rounded">Subject Domains</a>
            <Link to="/careers" className="hover:text-teal-300 transition-colors focus-visible:ring-2 focus-visible:ring-[#168C89] outline-none rounded">Career Directory</Link>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-3 shrink-0">
            {user ? (
              <div className="flex items-center gap-2.5">
                <Link
                  to={nextRoute}
                  className="bg-[#168C89] hover:bg-[#137471] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 whitespace-nowrap cursor-pointer hover:shadow-teal-900/30"
                >
                  <span>Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    await signOut();
                    navigate('/login', { replace: true });
                  }}
                  className="text-xs font-semibold text-slate-400 hover:text-white px-3 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-xs font-bold text-slate-300 hover:text-white px-3 py-2 rounded-xl transition-colors hidden sm:block"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="bg-[#168C89] hover:bg-[#137471] text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 whitespace-nowrap cursor-pointer hover:shadow-teal-900/30"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* 2. FULL-WIDTH CINEMATIC HERO SECTION */}
      <section className="relative bg-[#0B1930] text-white overflow-hidden min-h-[620px] lg:min-h-[700px] flex flex-col justify-center items-center border-b border-[#142B4A]">
        {/* Background Photography with Layered Deep Navy Overlays */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src="/hero-bg.jpg"
            alt="Student discovering career paths and opportunities"
            className="w-full h-full object-cover object-[28%_center] sm:object-center opacity-95 filter brightness-100 contrast-105 transition-transform duration-1000 ease-out sm:hover:scale-[1.01]"
            style={{
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          />
          {/* Layered Cinematic Overlays - Preserves photographic vibrance while guaranteeing text readability */}
          {/* 1. Subtle top & bottom atmospheric fade to blend navbar and stats bar */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0B1930]/75 via-transparent to-[#0B1930]/90 pointer-events-none" />
          
          {/* 2. Horizontal framing: low opacity on left/right so student and sunrise pop, deeper in center for text contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B1930]/35 via-[#0B1930]/65 to-[#0B1930]/25 pointer-events-none" />
          
          {/* 3. Central ambient radial vignette focused strictly behind the hero headline and copy */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(11,25,48,0.65)_0%,rgba(11,25,48,0.3)_45%,transparent_75%)] animate-pulse-ambient pointer-events-none" />

          {/* 4. Mobile contrast stabilizer: keeps text razor-sharp over portrait details on small screens */}
          <div className="absolute inset-0 bg-[#0B1930]/35 sm:hidden pointer-events-none" />
        </div>

        {/* Hero Centered Content Container */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24 relative z-10 w-full text-center flex flex-col items-center">
          
          {/* Centered Editorial Headline with Space Grotesk */}
          <h1 className="reveal-init revealed font-headline text-4xl sm:text-5xl md:text-6xl lg:text-[64px] font-extrabold tracking-tight text-white leading-[1.12] mb-6 max-w-4xl drop-shadow-[0_4px_16px_rgba(11,25,48,0.85)]">
            <span className="block text-white">Your Potential Has</span>
            <span className="block text-teal-400 mt-1.5 sm:mt-2 drop-shadow-[0_2px_16px_rgba(45,212,191,0.35)]">More Than One Direction.</span>
          </h1>

          {/* Centered Supporting Message */}
          <p className="reveal-init revealed delay-150 font-sans text-base sm:text-lg lg:text-[18px] text-slate-100 font-normal leading-relaxed mb-8 sm:mb-10 max-w-2xl mx-auto drop-shadow-[0_2px_8px_rgba(11,25,48,0.8)]">
            Discover what drives you, uncover your strengths, and turn your ambitions into a meaningful career journey.
          </p>

          {/* Centered CTA Buttons (Strictly 2 Distinct Actions) */}
          <div className="reveal-init revealed delay-225 flex flex-col sm:flex-row items-center justify-center gap-4 mb-10 sm:mb-12 w-full sm:w-auto">
            <Link
              to={user ? '/assessment' : '/signup'}
              className="w-full sm:w-auto bg-[#168C89] hover:bg-[#137471] text-white px-8 py-3.5 rounded-xl font-bold text-sm sm:text-base transition-all shadow-lg hover:shadow-teal-900/50 hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer group"
            >
              <span>Start Career Discovery</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              to="/careers"
              className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border border-white/25 px-8 py-3.5 rounded-xl font-bold text-sm sm:text-base backdrop-blur-md transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Explore Careers</span>
            </Link>
          </div>

          {/* Centered Evidence-Based Guidance Highlights */}
          <div className="reveal-init revealed delay-300 flex flex-wrap items-center justify-center gap-x-8 gap-y-2.5 text-xs sm:text-sm font-semibold text-slate-200 pt-5 border-t border-white/15 max-w-2xl mx-auto">
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#168C89]" />
              Holland RIASEC Diagnostic
            </span>
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#168C89]" />
              Statutory Pathways
            </span>
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#168C89]" />
              Evidence Grounded
            </span>
          </div>
        </div>

        {/* Bottom Metrics Bar */}
        <div className="w-full bg-[#0B1930]/95 border-t border-white/10 backdrop-blur-md hidden md:block">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 grid grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-xl lg:text-2xl font-extrabold text-[#168C89] font-mono">12</div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Universal Domains</div>
            </div>
            <div>
              <div className="text-xl lg:text-2xl font-extrabold text-white font-mono">RIASEC</div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Psychometric Intelligence</div>
            </div>
            <div>
              <div className="text-xl lg:text-2xl font-extrabold text-[#168C89] font-mono">100+</div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Verified Trajectories</div>
            </div>
            <div>
              <div className="text-xl lg:text-2xl font-extrabold text-white font-mono">100%</div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Evidence Grounded</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. LIGHT CONTENT SECTION: PERSONALIZED STARTING POINTS (GLASSMORPHIC CARDS) */}
      <section className="py-16 sm:py-20 bg-[#F5F8FC] border-b border-[#E2E8F0] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-12 reveal-init">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF5F4] text-[#168C89] font-bold text-xs border border-[#C5E6E4] uppercase tracking-wider mb-3">
              <Target className="w-3.5 h-3.5" />
              <span>Personalized Starting Point</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#172638] tracking-tight">
              Where are you in your career journey?
            </h2>
            <p className="text-sm sm:text-base text-[#64748B] mt-2">
              Select the option that best reflects where you stand today. Each pathway provides immediate, tailored guidance.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Card 1: Goal Known -> Goes to Roadmap */}
            <Link
              to={user ? '/roadmap' : '/login'}
              className="glass-card-light card-hover-cinematic reveal-init delay-75 rounded-2xl p-7 flex flex-col justify-between group cursor-pointer relative overflow-hidden"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#EAF5F4] border border-[#C5E6E4] flex items-center justify-center text-[#168C89] mb-5 group-hover:bg-[#168C89] group-hover:text-white group-hover:scale-110 transition-all duration-300">
                  <Target className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#172638] mb-2 group-hover:text-[#168C89] transition-colors">
                  I Know My Career Goal
                </h3>
                <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                  I have a specific target role. Diagnose my skill gaps and build a structured milestone roadmap to achieve it.
                </p>
              </div>
              <div className="pt-6 flex items-center justify-between text-xs font-bold text-[#168C89]">
                <span>Build My Execution Roadmap</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </div>
            </Link>

            {/* Card 2: Exploring -> Goes to Assessment */}
            <Link
              to={user ? '/assessment' : '/signup'}
              className="glass-card-teal card-hover-cinematic reveal-init delay-150 rounded-2xl p-7 flex flex-col justify-between relative group cursor-pointer"
            >
              <div className="absolute -top-3 right-6 bg-[#142B4A] text-white text-[10px] font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                Recommended
              </div>
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#142B4A] text-white flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-[#0B1930] transition-all duration-300 shadow-sm">
                  <Search className="w-6 h-6 text-teal-300" />
                </div>
                <h3 className="text-lg font-bold text-[#172638] mb-2 group-hover:text-[#168C89] transition-colors">
                  I'm Exploring & Discovering
                </h3>
                <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                  I want to discover which careers match my genuine interests, RIASEC behavioral profile, and educational strengths.
                </p>
              </div>
              <div className="pt-6 flex items-center justify-between text-xs font-bold text-[#168C89]">
                <span>Start Discovery Assessment</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </div>
            </Link>

            {/* Card 3: Transition -> Goes to Career Directory */}
            <Link
              to="/careers"
              className="glass-card-light card-hover-cinematic reveal-init delay-225 rounded-2xl p-7 flex flex-col justify-between group cursor-pointer relative overflow-hidden"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#EAF5F4] border border-[#C5E6E4] flex items-center justify-center text-[#168C89] mb-5 group-hover:bg-[#168C89] group-hover:text-white group-hover:scale-110 transition-all duration-300">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#172638] mb-2 group-hover:text-[#168C89] transition-colors">
                  I Need a Career Transition
                </h3>
                <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                  I'm considering switching fields or preparing for higher degree requirements. Compare pathways and requirements.
                </p>
              </div>
              <div className="pt-6 flex items-center justify-between text-xs font-bold text-[#168C89]">
                <span>Explore Transition Pathways</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* 4. EDITORIAL STEP-BY-STEP PROCESS (HOW IT WORKS TIMELINE) */}
      <section id="how-it-works" className="py-20 bg-white border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 reveal-init">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF5F4] text-[#168C89] font-bold text-xs border border-[#C5E6E4] uppercase tracking-wider mb-3">
              <Compass className="w-3.5 h-3.5" />
              <span>The Methodology</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#172638] tracking-tight">
              Four Steps from Uncertainty to Clarity
            </h2>
            <p className="text-sm sm:text-base text-[#64748B] mt-2">
              A transparent, evidence-grounded diagnostic journey designed to build clarity without guesswork or locked paths.
            </p>
          </div>

          <div className="relative max-w-6xl mx-auto">
            {/* Subtle connecting line across steps on desktop */}
            <div className="hidden lg:block absolute top-7 left-14 right-14 h-0.5 bg-gradient-to-r from-[#168C89]/20 via-[#168C89]/60 to-[#168C89]/20 z-0" />

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
              {[
                {
                  num: '01',
                  title: 'Subject & Interest Discovery',
                  desc: 'Explore real-world problem scenarios across 12 domains to uncover what you voluntarily enjoy solving.',
                  badge: 'Exploration Phase',
                  delay: 'delay-75',
                },
                {
                  num: '02',
                  title: 'Adaptive Assessment',
                  desc: 'Answer calibrated scenario questions mapping your Holland RIASEC occupational code and core work preferences.',
                  badge: 'Psychometric Profile',
                  delay: 'delay-150',
                },
                {
                  num: '03',
                  title: 'Multi-Signal AI Synthesis',
                  desc: 'Synthesize your projects, declared skills, and academic stream with O*NET occupational intelligence.',
                  badge: 'Diagnostic Matching',
                  delay: 'delay-225',
                },
                {
                  num: '04',
                  title: 'Verified Execution Roadmap',
                  desc: 'Follow a curated milestone plan with weekly tasks, daily learning objectives, and pace control.',
                  badge: 'Action Roadmap',
                  delay: 'delay-300',
                },
              ].map((step) => (
                <div
                  key={step.num}
                  className={`glass-card-light card-hover-cinematic reveal-init ${step.delay} rounded-2xl p-6 relative flex flex-col justify-between group`}
                >
                  <div>
                    <div className="w-14 h-14 rounded-2xl bg-[#0B1930] text-white flex items-center justify-center font-mono font-extrabold text-lg border-2 border-[#168C89] shadow-sm mb-5 group-hover:scale-105 group-hover:border-teal-300 transition-all duration-300">
                      {step.num}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#168C89] bg-[#EAF5F4] px-2 py-0.5 rounded border border-[#C5E6E4] inline-block mb-2">
                      {step.badge}
                    </span>
                    <h3 className="text-base font-bold text-[#172638] mb-2">{step.title}</h3>
                    <p className="text-xs text-[#64748B] leading-relaxed">{step.desc}</p>
                  </div>
                  <div className="w-8 h-1 bg-[#168C89] rounded-full mt-6 group-hover:w-12 transition-all duration-300" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. PRODUCT EXPLANATION SECTION (MULTI-SIGNAL INTELLIGENCE WITH SOFT PHOTOGRAPHIC DEPTH) */}
      <section id="features" className="py-20 bg-[#F5F8FC] border-b border-[#E2E8F0] relative overflow-hidden">
        {/* Soft atmospheric background photograph */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <img
            src="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=2400&q=80"
            alt=""
            className="w-full h-full object-cover opacity-8 filter grayscale brightness-50"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#F5F8FC] via-[#F5F8FC]/95 to-[#F5F8FC]" />
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-[radial-gradient(circle,rgba(22,140,137,0.08)_0%,transparent_70%)] pointer-events-none" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Conceptual Overview */}
            <div className="lg:col-span-5 space-y-6 reveal-init">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF5F4] text-[#168C89] font-bold text-xs border border-[#C5E6E4] uppercase tracking-wider">
                <BrainCircuit className="w-3.5 h-3.5" />
                <span>Multi-Signal Intelligence</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#172638] tracking-tight leading-tight">
                Career Guidance Grounded in Your Complete Profile
              </h2>
              <p className="text-sm sm:text-base text-[#64748B] leading-relaxed">
                Traditional aptitude tests reduce students to a single static label. Our counselor synthesizes six distinct, verifiable signals to recommend career trajectories aligned with who you actually are.
              </p>

              {/* Glass Dark Callout */}
              <div className="glass-card-dark text-white rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#168C89] flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Zero Forced Lock-In</h4>
                    <p className="text-xs text-slate-300 mt-0.5">Guidance dynamically updates as you complete activities, learn new skills, or change interests.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#142B4A] border border-[#168C89]/50 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <Shield className="w-4 h-4 text-teal-300" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Statutory & Regulatory Alignment</h4>
                    <p className="text-xs text-slate-300 mt-0.5">Accounts for licensing bodies, entrance requirements, and qualification pathways across Indian and global benchmarks.</p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to={user ? '/assessment' : '/signup'}
                  className="inline-flex items-center gap-2 text-sm font-bold text-[#168C89] hover:underline"
                >
                  <span>Experience the multi-signal assessment</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Right Column: 6 Signals Grid */}
            <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
              {[
                {
                  icon: Sparkles,
                  title: 'Personal Interests',
                  desc: 'Topics, domains, and micro-challenges you voluntarily explore without pressure or grading.',
                  tag: 'Signal 01',
                  delay: 'delay-75',
                },
                {
                  icon: GraduationCap,
                  title: 'Academic Foundation',
                  desc: 'Current education stage, academic stream prerequisites, and degree runway.',
                  tag: 'Signal 02',
                  delay: 'delay-150',
                },
                {
                  icon: Code,
                  title: 'Demonstrated Skills',
                  desc: 'Software tools, technical proficiencies, problem-solving methods, and languages.',
                  tag: 'Signal 03',
                  delay: 'delay-225',
                },
                {
                  icon: Briefcase,
                  title: 'Projects & Builds',
                  desc: 'Tangible coursework artifacts, portfolio builds, experiments, and hackathon experience.',
                  tag: 'Signal 04',
                  delay: 'delay-300',
                },
                {
                  icon: Target,
                  title: 'Career Preferences',
                  desc: 'Work style preferences, weekly commitment hours, and target industry domains.',
                  tag: 'Signal 05',
                  delay: 'delay-375',
                },
                {
                  icon: BarChart2,
                  title: 'Assessment Evidence',
                  desc: 'Calibrated Holland RIASEC psychometrics cross-referenced with O*NET occupational data.',
                  tag: 'Signal 06',
                  delay: 'delay-450',
                },
              ].map((signal) => {
                const Icon = signal.icon;
                return (
                  <div
                    key={signal.title}
                    className={`glass-card-light card-hover-cinematic reveal-init ${signal.delay} rounded-2xl p-5 shadow-xs`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-[#EAF5F4] border border-[#C5E6E4] flex items-center justify-center text-[#168C89] group-hover:scale-105 transition-transform">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider">
                        {signal.tag}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-[#172638] mb-1">{signal.title}</h3>
                    <p className="text-xs text-[#64748B] leading-relaxed">{signal.desc}</p>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </section>

      {/* 6. SPOTLIGHT: 12 UNIVERSAL SUBJECT DOMAINS SHOWCASE (GLASSMORPHIC HOVER CARDS) */}
      <section id="domains" className="py-20 bg-white border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 reveal-init">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF5F4] text-[#168C89] font-bold text-xs border border-[#C5E6E4] uppercase tracking-wider mb-3">
                <Layers className="w-3.5 h-3.5" />
                <span>12 Universal Domains</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#172638] tracking-tight">
                Discover What You Naturally Enjoy
              </h2>
              <p className="text-sm sm:text-base text-[#64748B] mt-2">
                Explore bite-sized interactive challenges across 12 distinct academic and practical fields to discover where your natural curiosity lies.
              </p>
            </div>

            <Link
              to="/discover-interests"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#142B4A] hover:bg-[#0E1F36] text-white font-bold text-xs shadow-xs transition-all shrink-0 cursor-pointer hover:shadow-md hover:-translate-y-0.5"
            >
              <span>Explore All 12 Domains</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#168C89]" />
            </Link>
          </div>

          {/* 12 Domain Editorial Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {INTEREST_DOMAINS.map((domain, idx) => {
              const staggerDelay = idx % 4 === 0 ? 'delay-75' : idx % 4 === 1 ? 'delay-150' : idx % 4 === 2 ? 'delay-225' : 'delay-300';
              return (
                <Link
                  key={domain.id}
                  to="/discover-interests"
                  className={`glass-card-light card-hover-cinematic reveal-init ${staggerDelay} rounded-2xl p-5 shadow-2xs group flex flex-col justify-between cursor-pointer focus-visible:ring-2 focus-visible:ring-[#168C89] outline-none`}
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-[#EAF5F4] border border-[#C5E6E4] flex items-center justify-center mb-3.5 group-hover:bg-[#168C89] group-hover:scale-110 group-hover:shadow-xs transition-all duration-300">
                      {renderDomainIcon(domain.iconName)}
                    </div>
                    <h3 className="text-sm font-bold text-[#172638] group-hover:text-[#168C89] transition-colors mb-1">
                      {domain.name}
                    </h3>
                    <p className="text-xs text-[#64748B] leading-relaxed line-clamp-2 mb-3">
                      {domain.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#168C89]">
                      {domain.activities.length} interactive {domain.activities.length === 1 ? 'activity' : 'activities'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#168C89] group-hover:translate-x-1.5 transition-all duration-200" />
                  </div>
                </Link>
              );
            })}
          </div>

        </div>
      </section>

      {/* 7. DISTINCTIVE FULL-WIDTH FINAL CTA (DEEP NAVY WITH PHOTOGRAPHIC HORIZON DEPTH) */}
      <section className="py-24 bg-gradient-to-br from-[#0B1930] via-[#142B4A] to-[#0A182E] text-white relative overflow-hidden">
        {/* Soft photographic horizon depth */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <img
            src="https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=2400&q=80"
            alt=""
            className="w-full h-full object-cover opacity-12 filter brightness-50 contrast-125"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0B1930]/95 via-[#142B4A]/90 to-[#0A182E]/98" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(22,140,137,0.22)_0%,transparent_65%)] animate-pulse-ambient" />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <h2 className="reveal-init font-headline text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4 drop-shadow-sm">
            Your Next Chapter Starts With Understanding Yourself.
          </h2>
          <p className="reveal-init delay-150 text-base sm:text-lg text-slate-300 mb-9 max-w-xl mx-auto font-normal leading-relaxed">
            Explore your strengths, understand your options, and take your next career step with confidence.
          </p>

          <div className="reveal-init delay-225 flex justify-center">
            <Link
              to={user ? '/assessment' : '/signup'}
              className="bg-[#168C89] hover:bg-[#137471] text-white px-9 py-4 rounded-xl font-bold text-base transition-all shadow-lg hover:shadow-teal-900/50 hover:-translate-y-0.5 inline-flex items-center gap-2.5 cursor-pointer group"
            >
              <span>Start Your Career Journey</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="reveal-init delay-300 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 mt-8 font-medium">
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-[#168C89]" />
              Evidence-based psychometrics
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-[#168C89]" />
              Statutory Indian benchmarks
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-[#168C89]" />
              Zero forced career locks
            </span>
          </div>
        </div>
      </section>

      {/* 8. GLOBAL FOOTER */}
      <AppFooter />
    </div>
  );
};

export default Home;
