import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppFooter from '../components/AppFooter';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { getJourneyStatus } from '../lib/profile';
import { motion } from 'framer-motion';
import {
  ArrowRight, Check, BrainCircuit, Star, Clock,
  Target, Search, TrendingUp, User, Compass,
  Map, BarChart2, ClipboardList, Calendar,
  MessageSquare, GraduationCap, Shield, Zap,
  Heart, CheckSquare, Sparkles
} from 'lucide-react';

const Home: React.FC = () => {
  const { user, loading, signOut } = useAuth();
  const { profile, assessment, activeGoal, loading: profileLoading } = useProfile();
  const navigate = useNavigate();

  // Detect OAuth exchange parameters
  const hasAuthParams = typeof window !== 'undefined' && (
    window.location.hash.includes('access_token') ||
    window.location.search.includes('code=')
  );

  // If user completed an OAuth callback, navigate to journey destination
  useEffect(() => {
    if (hasAuthParams && !loading && user && !profileLoading) {
      const { nextRoute } = getJourneyStatus(profile, assessment, activeGoal);
      navigate(nextRoute, { replace: true });
    }
  }, [hasAuthParams, user, loading, profile, assessment, activeGoal, profileLoading, navigate]);

  if (hasAuthParams && (loading || (user && profileLoading))) {
    return (
      <div className="min-h-screen bg-[#F5F8FC] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-3 border-[#168C89]/20 border-t-[#168C89] rounded-full animate-spin" />
          <p className="text-sm font-semibold text-[#172638]">Signing you in and loading your journey...</p>
        </div>
      </div>
    );
  }

  const { nextRoute } = user && !profileLoading ? getJourneyStatus(profile, assessment, activeGoal) : { nextRoute: '/onboarding' };
  return (
    <div className="min-h-screen bg-[#F5F8FC] font-sans text-[#172638] selection:bg-[#EAF5F4] overflow-x-hidden">
      
      {/* 1. HEADER */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#E2E8F0]">
        <nav className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#142B4A] flex items-center justify-center shadow-xs shrink-0">
              <BrainCircuit className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-sm sm:text-lg font-bold tracking-tight text-[#172638] truncate">AI Personal Career Counselor</span>
          </div>
          
          <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-[#64748B]">
            <a href="#" className="text-[#168C89] font-semibold">Home</a>
            <a href="#how-it-works" className="hover:text-[#168C89] transition-colors">How It Works</a>
            <a href="#features" className="hover:text-[#168C89] transition-colors">Features</a>
            <a href="#resources" className="hover:text-[#168C89] transition-colors">Resources</a>
            <a href="#about" className="hover:text-[#168C89] transition-colors">About</a>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
            {user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  to={nextRoute}
                  className="bg-[#142B4A] text-white px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold hover:bg-[#10233D] transition-colors shadow-xs flex items-center gap-1.5 whitespace-nowrap"
                >
                  Go to {nextRoute === '/dashboard' ? 'Dashboard' : nextRoute === '/assessment' ? 'Assessment' : 'Onboarding'} <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    await signOut();
                    navigate('/login', { replace: true });
                  }}
                  className="text-xs sm:text-sm font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-xl transition-colors border border-rose-200 cursor-pointer"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="text-xs sm:text-sm font-semibold text-[#64748B] hover:text-[#172638] hidden sm:block">Log in</Link>
                <Link to="/signup" className="bg-[#142B4A] text-white px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold hover:bg-[#10233D] transition-colors shadow-xs whitespace-nowrap">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* 2. HERO SECTION */}
      <section className="pt-6 pb-12 px-6 max-w-7xl mx-auto overflow-hidden relative">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          
          {/* Left Side: Text and Buttons */}
          <div className="max-w-xl z-10 relative">
            <h1 className="text-5xl md:text-[56px] font-extrabold tracking-tight text-[#172638] leading-[1.1] mb-2">
              Not sure what career is right for you?
            </h1>
            <h2 className="text-5xl md:text-[56px] font-extrabold tracking-tight text-[#168C89] leading-[1.1] mb-6">
              Let's figure it out together.
            </h2>
            <p className="text-lg text-[#64748B] leading-relaxed mb-6">
              Your AI career counselor that helps you discover the right career, understand your skill gaps, and build a personalized roadmap around your life and goals.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <Link
                to={user ? nextRoute : '/signup'}
                className="bg-[#142B4A] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#10233D] transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                {user ? 'Continue Your Journey' : 'Start Career Discovery'} <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to={user ? nextRoute : '/signup'}
                className="bg-white text-[#142B4A] border border-[#E2E8F0] px-8 py-4 rounded-xl font-bold hover:bg-[#EAF5F4] hover:border-[#168C89]/30 transition-all flex items-center justify-center"
              >
                I Know My Career Goal
              </Link>
            </div>
            
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-medium text-[#64748B]">
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-[#168C89]" /> Personalized guidance</span>
              <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-[#168C89]" /> Multiple career fields</span>
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-[#168C89]" /> Built around your real life</span>
            </div>
          </div>

          {/* Right Side: Avatar & Floating Cards */}
          <div className="relative h-[440px] lg:h-[500px] flex items-center justify-center">
            <div className="absolute inset-0 z-0">
              <svg className="w-full h-full text-[#168C89]/15" viewBox="0 0 500 500" preserveAspectRatio="none">
                <path d="M 50 250 Q 150 50 400 150 T 450 400" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="6 6" />
                <path d="M 100 450 Q 250 500 450 300" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="6 6" />
              </svg>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-[#EAF5F4] rounded-full blur-3xl opacity-70"></div>
            </div>

            <motion.div 
              animate={{ y: [-8, 8, -8] }} 
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="relative z-10 w-[340px] h-[340px] lg:w-[400px] lg:h-[400px] rounded-full bg-[#EAF5F4] border-[12px] border-white shadow-xl flex items-center justify-center overflow-hidden"
            >
              <div className="absolute inset-2 border border-[#168C89]/20 rounded-full z-0"></div>
              <img src="/counselor.jpg" alt="AI Career Counselor" className="w-full h-full object-cover object-top relative z-10 scale-[1.02]" />
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20, y: 20 }} animate={{ opacity: 1, x: 0, y: 0 }} transition={{ delay: 0.5, duration: 0.6 }}
              className="absolute top-20 left-0 md:-left-12 z-20 bg-white p-5 rounded-2xl rounded-br-sm shadow-lg border border-[#E2E8F0] max-w-[240px]"
            >
              <p className="text-sm font-medium text-[#172638] leading-relaxed">
                Hi! I'm your <br/><span className="text-[#142B4A] font-bold">AI career counselor.</span><br/>
                You don't need to know your career yet.<br/>Let's find it together.
              </p>
            </motion.div>

            <motion.div 
              animate={{ y: [-5, 5, -5] }} transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
              className="absolute top-32 -right-4 z-20 bg-white px-4 py-3 rounded-xl shadow-md border border-[#E2E8F0] flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center">
                <svg className="w-4 h-4 text-rose-500 fill-rose-500" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
              </div>
              <span className="font-bold text-[#172638] text-sm">Your Interests</span>
            </motion.div>

            <motion.div 
              animate={{ y: [5, -5, 5] }} transition={{ repeat: Infinity, duration: 5.5, ease: "easeInOut" }}
              className="absolute bottom-32 -left-8 z-20 bg-white px-4 py-3 rounded-xl shadow-md border border-[#E2E8F0] flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                <User className="w-4 h-4 text-emerald-500 fill-emerald-500" />
              </div>
              <span className="font-bold text-[#172638] text-sm">Your Skills</span>
            </motion.div>

            <motion.div 
              animate={{ y: [-4, 4, -4] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
              className="absolute bottom-12 right-4 z-20 bg-white px-4 py-3 rounded-xl shadow-md border border-[#E2E8F0] flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-[#EAF5F4] flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-[#168C89]" />
              </div>
              <span className="font-bold text-[#172638] text-sm">Career Options</span>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3. WHAT DO YOU NEED HELP WITH? */}
      <section className="py-12 relative overflow-hidden bg-[#F5F8FC]">
        {/* Subtle background color blobs */}
        <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-[#EAF5F4]/60 rounded-full blur-[80px] -translate-y-1/2 pointer-events-none"></div>
        <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-[#EAF5F4]/40 rounded-full blur-[80px] -translate-y-1/2 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-[#172638] mb-3">
              What do you need help with?
            </h2>
            <p className="text-[#64748B] font-medium">
              Choose the option that best describes you so I can guide you in the right way.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            
            <Link to="/signup" className="group relative bg-white border border-[#E2E8F0] rounded-2xl p-8 shadow-xs hover:shadow-md hover:border-[#168C89] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[260px] h-auto overflow-hidden">
              <div className="relative z-10">
                <div className="w-14 h-14 bg-[#EAF5F4] border border-[#168C89]/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-[#168C89]">
                  <Target className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-[#172638] mb-3">I know my career goal</h3>
                <p className="text-[#64748B] text-sm leading-relaxed">
                  I know what I want. Help me reach it with a personalized plan.
                </p>
              </div>
              <div className="flex justify-end relative z-10 mt-6">
                <div className="w-10 h-10 rounded-full bg-slate-50 border border-[#E2E8F0] shadow-xs flex items-center justify-center text-[#64748B] group-hover:bg-[#142B4A] group-hover:text-white group-hover:border-[#142B4A] transition-colors">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </Link>
            
            <Link to="/signup" className="group relative bg-white border border-[#E2E8F0] rounded-2xl p-8 shadow-xs hover:shadow-md hover:border-[#168C89] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[260px] h-auto overflow-hidden">
              <div className="absolute top-6 right-6 bg-[#142B4A] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider z-20 shadow-xs">
                Most chosen
              </div>
              <div className="relative z-10">
                <div className="w-14 h-14 bg-[#EAF5F4] border border-[#168C89]/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-[#168C89]">
                  <Search className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-[#172638] mb-3 pr-12">I'm not sure which career is right for me</h3>
                <p className="text-[#64748B] text-sm leading-relaxed">
                  Help me discover careers that fit my skills and interests.
                </p>
              </div>
              <div className="flex justify-end relative z-10 mt-6">
                <div className="w-10 h-10 rounded-full bg-slate-50 border border-[#E2E8F0] shadow-xs flex items-center justify-center text-[#64748B] group-hover:bg-[#142B4A] group-hover:text-white group-hover:border-[#142B4A] transition-colors">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </Link>

            <Link to="/signup" className="group relative bg-white border border-[#E2E8F0] rounded-2xl p-8 shadow-xs hover:shadow-md hover:border-[#168C89] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[260px] h-auto overflow-hidden">
              <div className="relative z-10">
                <div className="w-14 h-14 bg-[#EAF5F4] border border-[#168C89]/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-[#168C89]">
                  <TrendingUp className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-[#172638] mb-3">I know my career, need a plan</h3>
                <p className="text-[#64748B] text-sm leading-relaxed">
                  Show me exactly what I need to learn and do to get there.
                </p>
              </div>
              <div className="flex justify-end relative z-10 mt-6">
                <div className="w-10 h-10 rounded-full bg-slate-50 border border-[#E2E8F0] shadow-xs flex items-center justify-center text-[#64748B] group-hover:bg-[#142B4A] group-hover:text-white group-hover:border-[#142B4A] transition-colors">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </Link>

          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS */}
      <section id="how-it-works" className="py-14 bg-white border-y border-[#E2E8F0]">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="text-center mb-10 relative">
            <h2 className="text-4xl font-extrabold text-[#172638] mb-3 flex items-center justify-center gap-2">
              <Star className="w-6 h-6 text-[#168C89]/30 fill-[#168C89]/30" />
              How it works
              <Star className="w-4 h-4 text-[#168C89]/30 fill-[#168C89]/30 -mt-6" />
            </h2>
            <p className="text-[#64748B] font-medium text-lg">
              Simple steps to clarity and confidence.
            </p>
          </div>
          
          <div className="flex flex-col lg:flex-row items-center justify-center gap-4 xl:gap-6">
            {[
              { img: "/counselor.jpg", icon: <User/>, title: "Tell me about yourself", desc: "Share your interests, strengths, goals and current skills." },
              { img: "/counselor-step2.jpg", icon: <Search/>, title: "Discover your best options", desc: "I'll analyze and match you with careers that fit you best." },
              { img: "/counselor-step3.jpg", icon: <BarChart2/>, title: "Understand the gaps", desc: "See the skills you need to learn and the areas to improve." },
              { img: "/counselor-step4.jpg", icon: <ClipboardList/>, title: "Get your personalized plan", desc: "Follow a custom roadmap with resources and a smart schedule." },
              { img: "/counselor-step5.jpg", icon: <Target/>, title: "Track & grow", desc: "Track your progress, stay consistent, and achieve your goals." },
            ].map((step, i, arr) => (
              <React.Fragment key={i}>
                <div className="relative bg-white rounded-2xl p-6 shadow-xs border border-[#E2E8F0] flex flex-col items-center text-center w-full max-w-[280px] h-[340px] hover:-translate-y-1 hover:shadow-md hover:border-[#168C89] transition-all duration-300">
                  {/* Number Badge */}
                  <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-[#142B4A] text-white font-bold flex items-center justify-center text-sm shadow-xs z-10">
                    {i + 1}
                  </div>
                  
                  {/* Image Wrapper */}
                  <div className="w-36 h-36 rounded-2xl bg-[#F5F8FC] overflow-hidden relative mb-6 border-4 border-[#F5F8FC]">
                    <img src={step.img} alt={`Counselor step ${i+1}`} className="w-full h-full object-cover object-top scale-110 translate-y-2" />
                    {/* Floating Icon to differentiate steps */}
                    <div className="absolute top-2 right-2 w-8 h-8 bg-white/95 rounded-lg flex items-center justify-center text-[#168C89] shadow-xs border border-[#E2E8F0]">
                      {React.cloneElement(step.icon as any, { className: "w-4 h-4" })}
                    </div>
                  </div>
                  
                  <h4 className="font-bold text-[#172638] text-base mb-3">{step.title}</h4>
                  <p className="text-sm text-[#64748B] leading-relaxed px-2">{step.desc}</p>
                  
                  {/* Bottom Dash */}
                  <div className="w-6 h-1 bg-[#168C89] rounded-full mt-auto mb-2 opacity-80"></div>
                </div>
                
                {/* Arrow connecting cards */}
                {i < arr.length - 1 && (
                  <div className="hidden lg:block text-[#168C89]/30 shrink-0">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="mt-12 mx-auto bg-[#EAF5F4] text-[#172638] px-8 py-5 rounded-2xl max-w-3xl flex items-center justify-center gap-4 text-sm md:text-base font-medium shadow-xs border border-[#168C89]/20">
            <div className="w-8 h-8 rounded-full bg-[#168C89] text-white flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <span>I'm with you at every step — <span className="text-[#142B4A] font-bold">guiding, motivating</span> and helping you become the best version of yourself.</span>
          </div>
        </div>
      </section>

      {/* 5. FEATURES / EVERYTHING YOU NEED */}
      <section id="features" className="py-14 bg-[#F5F8FC]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10 flex flex-col items-center">
            <div className="text-[#168C89] bg-[#EAF5F4] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest inline-block mb-4 border border-[#168C89]/20">
              Powerful Tools
            </div>
            <h2 className="text-3xl font-extrabold text-[#172638] mb-3">
              Everything you need in one place
            </h2>
            <p className="text-[#64748B] font-medium text-lg">
              Powerful tools to help you make better career decisions.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
            {[
              { icon: <Search/>, title: "Career Discovery", desc: "Explore careers that match your interests, skills and personality." },
              { icon: <ClipboardList/>, title: "Skill Gap Analysis", desc: "Know exactly what skills you need to learn and improve." },
              { icon: <Map/>, title: "Personalized Roadmap", desc: "Get a step-by-step plan tailored to your goals and time." },
              { icon: <Calendar/>, title: "Smart Schedule", desc: "Study plan, projects and tasks that fit your college life and time." },
              { icon: <TrendingUp/>, title: "Progress Tracker", desc: "Track your learning, build consistency and grow every day." },
              { icon: <MessageSquare/>, title: "AI Career Mentor", desc: "Ask anything. Get clarity, motivation and right guidance." },
            ].map((feature, i) => (
              <div key={i} className="bg-white border border-[#E2E8F0] rounded-2xl p-8 text-center shadow-xs hover:shadow-md hover:border-[#168C89] hover:-translate-y-1 transition-all duration-300 flex flex-col items-center h-[260px]">
                <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-6 bg-[#EAF5F4] text-[#168C89]">
                  {React.cloneElement(feature.icon as any, { className: "w-7 h-7" })}
                </div>
                <h4 className="font-bold text-[#172638] mb-3 text-lg">{feature.title}</h4>
                <p className="text-[#64748B] text-sm leading-relaxed mb-6 px-2">{feature.desc}</p>
                <div className="w-8 h-1 rounded-full mt-auto bg-[#168C89] opacity-80"></div>
              </div>
            ))}
          </div>

          <div className="mt-12 mx-auto bg-white text-[#172638] px-8 py-5 rounded-2xl max-w-4xl flex items-center justify-center gap-4 text-sm md:text-base font-medium shadow-xs border border-[#E2E8F0]">
            <div className="w-10 h-10 rounded-xl bg-[#142B4A] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Zap className="w-5 h-5 fill-white" />
            </div>
            <span><strong className="text-[#172638]">All in one place</strong> so you can focus on what matters most — your future.</span>
          </div>
        </div>
      </section>

      {/* 6. MADE FOR STUDENTS LIKE YOU */}
      <section className="py-14 bg-white relative overflow-hidden">
        {/* Background Sparkles / Dots */}
        <div className="absolute top-1/4 left-10 text-[#168C89]/20"><Sparkles className="w-6 h-6" /></div>
        <div className="absolute top-1/3 right-12 text-[#168C89]/20"><Sparkles className="w-4 h-4" /></div>
        <div className="absolute bottom-1/4 right-20 text-[#168C89]/20"><Sparkles className="w-8 h-8" /></div>
        <div className="absolute bottom-1/3 left-16 text-[#168C89]/20"><Sparkles className="w-5 h-5" /></div>

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="text-center mb-10 flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-[#168C89] bg-[#EAF5F4] text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-6 border border-[#168C89]/20">
              <Heart className="w-3.5 h-3.5" /> BUILT FOR STUDENTS
            </div>
            <h2 className="text-4xl font-extrabold text-[#172638] mb-4 tracking-tight">
              Made for students like you
            </h2>
            <p className="text-[#64748B] font-medium text-lg">
              Whether you're just starting or planning your next step — we've got you covered.
            </p>
          </div>
          
          <div className="relative w-full max-w-5xl mx-auto mb-10">
            <div className="flex flex-wrap md:flex-nowrap justify-center gap-4 lg:gap-6 relative z-10">
              {[
                { icon: <GraduationCap/>, title: "College Students" },
                { icon: <Compass/>, title: "Confused About Career" },
                { icon: <Target/>, title: "Planning Switch" },
                { icon: <BarChart2/>, title: "Building Skills" },
                { icon: <CheckSquare/>, title: "Future Ready" },
              ].map((item, i) => (
                <div key={i} className="bg-[#F5F8FC] rounded-2xl p-6 shadow-xs border border-[#E2E8F0] flex flex-col items-center justify-center w-[160px] h-[180px] shrink-0 hover:-translate-y-1 hover:shadow-md hover:border-[#168C89] transition-all duration-300 relative group cursor-pointer">
                  <div className="w-16 h-16 rounded-2xl bg-white border border-[#E2E8F0] flex items-center justify-center mb-4 text-[#168C89] transition-transform group-hover:scale-110 shadow-xs">
                    {React.cloneElement(item.icon as any, { className: "w-7 h-7" })}
                  </div>
                  <span className="font-bold text-[#172638] text-[13px] text-center leading-tight">{item.title}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="max-w-2xl mx-auto bg-[#EAF5F4] border border-[#168C89]/20 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs">
            <div className="flex items-center gap-6 text-center sm:text-left">
              <div className="w-12 h-12 rounded-full bg-[#142B4A] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Star className="w-6 h-6 fill-white text-white" />
              </div>
              <div>
                <h4 className="font-bold text-[#142B4A] mb-1 text-lg">You're not alone.</h4>
                <p className="text-[#64748B] text-sm leading-relaxed">
                  Thousands of students are on the same journey.<br className="hidden sm:block"/> We're here to help you reach your goals.
                </p>
              </div>
            </div>
            <Link to="/signup" className="w-10 h-10 rounded-full border border-[#168C89]/40 bg-white flex items-center justify-center text-[#168C89] hover:bg-[#142B4A] hover:text-white hover:border-[#142B4A] transition-colors shrink-0">
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 7. TRUSTED BY STUDENTS */}
      <section className="py-14 bg-[#F5F8FC]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-[#172638] mb-3">
              Trusted by students
            </h2>
            <p className="text-[#64748B] font-medium">
              Real stories from students who found their direction.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Aishwarya K.", role: "BCA Student", quote: "I was completely confused about what to do next. This platform helped me discover a career path I actually enjoy. The roadmap is so clear!" },
              { name: "Pranav S.", role: "MCA Student", quote: "The skill gap analysis opened my eyes. Now I know exactly what to learn and I'm following a plan that fits my schedule perfectly." },
              { name: "Sneha R.", role: "Final Year Student", quote: "It's like having a personal mentor available 24/7. The guidance is practical, simple and really effective." },
            ].map((testimonial, i) => (
              <div key={i} className="bg-white border border-[#E2E8F0] rounded-2xl p-8 shadow-xs hover:border-[#168C89] transition-colors">
                <p className="text-[#64748B] text-sm leading-relaxed mb-6 italic">"{testimonial.quote}"</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#EAF5F4] flex items-center justify-center font-bold text-[#142B4A]">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <h5 className="font-bold text-[#172638] text-sm">{testimonial.name}</h5>
                      <p className="text-xs text-[#64748B]">{testimonial.role}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(star => <Star key={star} className="w-3 h-3 text-amber-400 fill-amber-400" />)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination dots */}
          <div className="flex justify-center gap-2 mt-8">
            <div className="w-2 h-2 rounded-full bg-[#142B4A]"></div>
            <div className="w-2 h-2 rounded-full bg-slate-300"></div>
            <div className="w-2 h-2 rounded-full bg-slate-300"></div>
            <div className="w-2 h-2 rounded-full bg-slate-300"></div>
          </div>
        </div>
      </section>

      {/* 8. CTA BANNER */}
      <section className="pb-16 pt-4 bg-[#F5F8FC]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="bg-gradient-to-r from-[#142B4A] to-[#10233D] rounded-2xl p-10 md:p-14 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>
            
            <div className="flex items-center gap-6 relative z-10 w-full md:w-auto">
              <div className="hidden md:flex w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl items-center justify-center shrink-0">
                <Target className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-2">
                  Ready to find the right career <br className="hidden sm:inline" />and build your future?
                </h2>
                <p className="text-[#EAF5F4]">Let's start your journey today.</p>
              </div>
            </div>
            
            <div className="relative z-10 w-full md:w-auto">
              <Link to="/signup" className="block w-full md:w-auto bg-[#168C89] text-white font-bold px-8 py-4 rounded-xl shadow-md hover:bg-[#137573] hover:shadow-lg transition-all text-center flex items-center justify-center gap-2">
                Start Career Discovery <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 9. GLOBAL MINIMAL FOOTER */}
      <AppFooter />
    </div>
  );
};

export default Home;
