import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, Check, BrainCircuit, Star, Clock,
  Target, Search, TrendingUp, User, Compass,
  Map, BarChart2, ClipboardList, Calendar,
  MessageSquare, GraduationCap, Shield, Zap,
  Heart, CheckSquare, Sparkles
} from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAFBFF] font-sans text-slate-900 selection:bg-purple-100 overflow-x-hidden">
      
      {/* 1. HEADER */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-7 h-7 text-purple-600" />
            <span className="text-lg font-bold tracking-tight text-slate-900">AI Personal Career Counselor</span>
          </div>
          
          <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#" className="text-purple-600 font-semibold">Home</a>
            <a href="#how-it-works" className="hover:text-purple-600 transition-colors">How It Works</a>
            <a href="#features" className="hover:text-purple-600 transition-colors">Features</a>
            <a href="#resources" className="hover:text-purple-600 transition-colors">Resources</a>
            <a href="#about" className="hover:text-purple-600 transition-colors">About</a>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900 hidden sm:block">Log in</Link>
            <Link to="/signup" className="bg-purple-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-purple-700 transition-colors shadow-sm">
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      {/* 2. HERO SECTION */}
      <section className="pt-4 pb-10 px-6 max-w-7xl mx-auto overflow-hidden relative">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          
          {/* Left Side: Text and Buttons */}
          <div className="max-w-xl z-10 relative">
            <h1 className="text-5xl md:text-[56px] font-extrabold tracking-tight text-slate-900 leading-[1.1] mb-2">
              Not sure what career is right for you?
            </h1>
            <h2 className="text-5xl md:text-[56px] font-extrabold tracking-tight text-purple-600 leading-[1.1] mb-6">
              Let's figure it out together.
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed mb-6">
              Your AI career counselor that helps you discover the right career, understand your skill gaps, and build a personalized roadmap around your life and goals.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <Link to="/signup" className="bg-purple-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-purple-700 transition-all shadow-lg hover:shadow-purple-600/30 flex items-center justify-center gap-2">
                Start Career Discovery <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/signup" className="bg-white text-purple-600 border border-purple-100 px-8 py-4 rounded-xl font-bold hover:bg-purple-50 transition-all flex items-center justify-center">
                I Know My Career Goal
              </Link>
            </div>
            
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-medium text-slate-500">
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-purple-500" /> Personalized guidance</span>
              <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-purple-500" /> Multiple career fields</span>
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-purple-500" /> Built around your real life</span>
            </div>
          </div>

          {/* Right Side: Avatar & Floating Cards */}
          <div className="relative h-[440px] lg:h-[500px] flex items-center justify-center">
            <div className="absolute inset-0 z-0">
              <svg className="w-full h-full text-purple-100" viewBox="0 0 500 500" preserveAspectRatio="none">
                <path d="M 50 250 Q 150 50 400 150 T 450 400" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="6 6" />
                <path d="M 100 450 Q 250 500 450 300" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="6 6" />
              </svg>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-purple-50 rounded-full blur-3xl opacity-60"></div>
            </div>

            <motion.div 
              animate={{ y: [-8, 8, -8] }} 
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="relative z-10 w-[340px] h-[340px] lg:w-[400px] lg:h-[400px] rounded-full bg-[#F3F6FF] border-[12px] border-white shadow-2xl flex items-center justify-center overflow-hidden"
            >
              <div className="absolute inset-2 border border-purple-100 rounded-full z-0"></div>
              <img src="/counselor.jpg" alt="AI Career Counselor" className="w-full h-full object-cover object-top relative z-10 scale-[1.02]" />
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20, y: 20 }} animate={{ opacity: 1, x: 0, y: 0 }} transition={{ delay: 0.5, duration: 0.6 }}
              className="absolute top-20 left-0 md:-left-12 z-20 bg-white p-5 rounded-2xl rounded-br-sm shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-slate-100 max-w-[240px]"
            >
              <p className="text-sm font-medium text-slate-700 leading-relaxed">
                Hi! I'm your <br/><span className="text-purple-600 font-bold">AI career counselor.</span><br/>
                You don't need to know your career yet.<br/>Let's find it together.
              </p>
            </motion.div>

            <motion.div 
              animate={{ y: [-5, 5, -5] }} transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
              className="absolute top-32 -right-4 z-20 bg-white px-4 py-3 rounded-xl shadow-lg border border-slate-100 flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center">
                <svg className="w-4 h-4 text-rose-500 fill-rose-500" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
              </div>
              <span className="font-bold text-slate-800 text-sm">Your Interests</span>
            </motion.div>

            <motion.div 
              animate={{ y: [5, -5, 5] }} transition={{ repeat: Infinity, duration: 5.5, ease: "easeInOut" }}
              className="absolute bottom-32 -left-8 z-20 bg-white px-4 py-3 rounded-xl shadow-lg border border-slate-100 flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                <User className="w-4 h-4 text-emerald-500 fill-emerald-500" />
              </div>
              <span className="font-bold text-slate-800 text-sm">Your Skills</span>
            </motion.div>

            <motion.div 
              animate={{ y: [-4, 4, -4] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
              className="absolute bottom-12 right-4 z-20 bg-white px-4 py-3 rounded-xl shadow-lg border border-slate-100 flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-purple-600 fill-purple-600" />
              </div>
              <span className="font-bold text-slate-800 text-sm">Career Options</span>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3. WHAT DO YOU NEED HELP WITH? */}
      <section className="py-10 relative overflow-hidden bg-[#FAFBFF]">
        {/* Subtle background color blobs for glass effect */}
        <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-purple-100/50 rounded-full blur-[80px] -translate-y-1/2 pointer-events-none"></div>
        <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-purple-100/30 rounded-full blur-[80px] -translate-y-1/2 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-3">
              What do you need help with?
            </h2>
            <p className="text-slate-500 font-medium">
              Choose the option that best describes you so I can guide you in the right way.
            </p>
          </div>
          
          {/* Reduced gap to 5, set a max-width to bring cards closer */}
          <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            
            <Link to="/signup" className="group relative bg-white/60 backdrop-blur-2xl border border-white/80 rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 hover:bg-white/90 transition-all duration-300 flex flex-col justify-between h-[240px] overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-100/50 rounded-full blur-2xl group-hover:bg-purple-200/50 transition-colors"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 bg-white/80 backdrop-blur-md shadow-sm border border-purple-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-purple-500">
                  <Target className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">I know my career goal</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  I know what I want. Help me reach it with a personalized plan.
                </p>
              </div>
              <div className="flex justify-end relative z-10">
                <div className="w-10 h-10 rounded-full bg-white/80 border border-slate-200 shadow-sm flex items-center justify-center text-slate-400 group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-600 transition-colors">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </Link>
            
            <Link to="/signup" className="group relative bg-white/60 backdrop-blur-2xl border border-white/80 rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(37,99,235,0.08)] hover:shadow-[0_20px_40px_rgb(37,99,235,0.15)] hover:-translate-y-1 hover:bg-white/90 transition-all duration-300 flex flex-col justify-between h-[240px] overflow-hidden">
              <div className="absolute top-6 right-6 bg-purple-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider z-20 shadow-md">
                Most chosen
              </div>
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-100/60 rounded-full blur-2xl group-hover:bg-purple-200/60 transition-colors"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 bg-white/80 backdrop-blur-md shadow-sm border border-purple-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-purple-600">
                  <Search className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3 pr-12">I'm not sure which career is right for me</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Help me discover careers that fit my skills and interests.
                </p>
              </div>
              <div className="flex justify-end relative z-10">
                <div className="w-10 h-10 rounded-full bg-white/80 border border-slate-200 shadow-sm flex items-center justify-center text-slate-400 group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-600 transition-colors">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </Link>

            <Link to="/signup" className="group relative bg-white/60 backdrop-blur-2xl border border-white/80 rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 hover:bg-white/90 transition-all duration-300 flex flex-col justify-between h-[240px] overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-100/50 rounded-full blur-2xl group-hover:bg-purple-200/50 transition-colors"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 bg-white/80 backdrop-blur-md shadow-sm border border-purple-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-purple-600">
                  <TrendingUp className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">I know my career, need a plan</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Show me exactly what I need to learn and do to get there.
                </p>
              </div>
              <div className="flex justify-end relative z-10">
                <div className="w-10 h-10 rounded-full bg-white/80 border border-slate-200 shadow-sm flex items-center justify-center text-slate-400 group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-600 transition-colors">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </Link>

          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS */}
      <section id="how-it-works" className="py-10 bg-[#FCFAFF] border-y border-purple-50">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="text-center mb-10 relative">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-3 flex items-center justify-center gap-2">
              <Star className="w-6 h-6 text-purple-300 fill-purple-300 opacity-50" />
              How it works
              <Star className="w-4 h-4 text-purple-300 fill-purple-300 opacity-50 -mt-6" />
            </h2>
            <p className="text-slate-500 font-medium text-lg">
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
                <div className="relative bg-white rounded-[2rem] p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 flex flex-col items-center text-center w-full max-w-[280px] h-[340px] hover:-translate-y-2 transition-transform duration-300">
                  {/* Number Badge */}
                  <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-purple-500 text-white font-bold flex items-center justify-center text-sm shadow-md z-10">
                    {i + 1}
                  </div>
                  
                  {/* Image Wrapper */}
                  <div className="w-36 h-36 rounded-2xl bg-[#F4F1FF] overflow-hidden relative mb-6 border-4 border-[#F4F1FF]">
                    <img src={step.img} alt={`Counselor step ${i+1}`} className="w-full h-full object-cover object-top scale-110 translate-y-2" />
                    {/* Floating Icon to differentiate steps */}
                    <div className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center text-purple-600 shadow-sm border border-purple-50">
                      {React.cloneElement(step.icon as any, { className: "w-4 h-4" })}
                    </div>
                  </div>
                  
                  <h4 className="font-bold text-slate-900 text-base mb-3">{step.title}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed px-2">{step.desc}</p>
                  
                  {/* Bottom Dash */}
                  <div className="w-6 h-1 bg-purple-600 rounded-full mt-auto mb-2 opacity-80"></div>
                </div>
                
                {/* Arrow connecting cards */}
                {i < arr.length - 1 && (
                  <div className="hidden lg:block text-purple-300 shrink-0">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="mt-10 mx-auto bg-[#F6F4FF] text-slate-700 px-8 py-5 rounded-full max-w-3xl flex items-center justify-center gap-4 text-sm md:text-base font-medium shadow-sm border border-purple-100">
            <div className="w-8 h-8 rounded-full bg-purple-200 text-purple-600 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <span>I'm with you at every step — <span className="text-purple-600 font-bold">guiding, motivating</span> and helping you become the best version of yourself.</span>
          </div>
        </div>
      </section>

      {/* 5. FEATURES / EVERYTHING YOU NEED */}
      <section id="features" className="py-10 bg-[#FAFBFF]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10 flex flex-col items-center">
            <div className="text-purple-600 bg-purple-50 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest inline-block mb-4 shadow-sm border border-purple-100">
              Powerful Tools
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 mb-3">
              Everything you need in one place
            </h2>
            <p className="text-slate-500 font-medium text-lg">
              Powerful tools to help you make better career decisions.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
            {[
              { icon: <Search/>, title: "Career Discovery", desc: "Explore careers that match your interests, skills and personality.", color: "purple" },
              { icon: <ClipboardList/>, title: "Skill Gap Analysis", desc: "Know exactly what skills you need to learn and improve.", color: "purple" },
              { icon: <Map/>, title: "Personalized Roadmap", desc: "Get a step-by-step plan tailored to your goals and time.", color: "purple" },
              { icon: <Calendar/>, title: "Smart Schedule", desc: "Study plan, projects and tasks that fit your college life and time.", color: "purple" },
              { icon: <TrendingUp/>, title: "Progress Tracker", desc: "Track your learning, build consistency and grow every day.", color: "purple" },
              { icon: <MessageSquare/>, title: "AI Career Mentor", desc: "Ask anything. Get clarity, motivation and right guidance.", color: "purple" },
            ].map((feature, i) => {
              const palette: Record<string, { bg: string; text: string; dash: string }> = {
                purple: { bg: "bg-purple-50", text: "text-purple-500", dash: "bg-purple-500" },
                emerald: { bg: "bg-emerald-50", text: "text-emerald-500", dash: "bg-emerald-500" },
                amber: { bg: "bg-amber-50", text: "text-amber-500", dash: "bg-amber-500" },
                sky: { bg: "bg-sky-50", text: "text-sky-500", dash: "bg-sky-500" },
                pink: { bg: "bg-pink-50", text: "text-pink-500", dash: "bg-pink-500" },
              };
              const colors = palette[feature.color] ?? palette.purple;

              return (
                <div key={i} className="bg-white border border-slate-100 rounded-[2rem] p-8 text-center shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-2 transition-all duration-300 flex flex-col items-center h-[260px]">
                  <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-6 ${colors.bg} ${colors.text}`}>
                    {React.cloneElement(feature.icon as any, { className: "w-7 h-7" })}
                  </div>
                  <h4 className="font-bold text-slate-900 mb-3 text-lg">{feature.title}</h4>
                  <p className="text-slate-500 text-sm leading-relaxed mb-6 px-2">{feature.desc}</p>
                  <div className={`w-8 h-1 rounded-full mt-auto opacity-80 ${colors.dash}`}></div>
                </div>
              );
            })}
          </div>

          <div className="mt-10 mx-auto bg-[#F6F4FF] text-slate-700 px-8 py-5 rounded-[1.5rem] max-w-4xl flex items-center justify-center gap-4 text-sm md:text-base font-medium shadow-sm border border-purple-100">
            <div className="w-10 h-10 rounded-xl bg-[#7C3AED] text-white flex items-center justify-center shrink-0 shadow-sm">
              <Zap className="w-5 h-5 fill-white" />
            </div>
            <span><strong className="text-slate-900">All in one place</strong> so you can focus on what matters most — your future.</span>
          </div>
        </div>
      </section>

      {/* 6. MADE FOR STUDENTS LIKE YOU */}
      <section className="py-12 bg-white relative overflow-hidden">
        {/* Background Sparkles / Dots */}
        <div className="absolute top-1/4 left-10 text-purple-300"><Sparkles className="w-6 h-6" /></div>
        <div className="absolute top-1/3 right-12 text-purple-300"><Sparkles className="w-4 h-4" /></div>
        <div className="absolute bottom-1/4 right-20 text-purple-400"><Sparkles className="w-8 h-8" /></div>
        <div className="absolute bottom-1/3 left-16 text-purple-200"><Sparkles className="w-5 h-5" /></div>

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="text-center mb-10 flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-purple-600 bg-purple-50 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-6 shadow-sm border border-purple-100">
              <Heart className="w-3.5 h-3.5" /> BUILT FOR STUDENTS
            </div>
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
              Made for students like you
            </h2>
            <p className="text-slate-500 font-medium text-lg">
              Whether you're just starting or planning your next step — we've got you covered.
            </p>
          </div>
          
          <div className="relative w-full max-w-5xl mx-auto mb-10">
            {/* Wavy dashed line background */}
            <svg width="100%" height="100" className="absolute top-1/2 left-0 -translate-y-1/2 -z-10 text-purple-200 hidden md:block" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="6 6">
              <path d="M-50 50 C 150 -30, 300 130, 500 50 C 700 -30, 850 130, 1050 50" />
            </svg>
            
            <div className="flex flex-wrap md:flex-nowrap justify-center gap-4 lg:gap-6 relative z-10">
              {[
                { icon: <GraduationCap/>, title: "College Students" },
                { icon: <Compass/>, title: "Confused About Career" },
                { icon: <Target/>, title: "Planning Switch" },
                { icon: <BarChart2/>, title: "Building Skills" },
                { icon: <CheckSquare/>, title: "Future Ready" },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-[2rem] p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-purple-50 flex flex-col items-center justify-center w-[160px] h-[180px] shrink-0 hover:-translate-y-2 hover:shadow-[0_12px_30px_rgb(124,58,237,0.08)] transition-all duration-300 relative group cursor-pointer">
                  <div className="absolute top-4 right-4 text-purple-300 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Sparkles className="w-3 h-3" />
                  </div>
                  <div className="absolute bottom-6 left-4 text-purple-200 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Sparkles className="w-2 h-2" />
                  </div>
                  <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-4 text-purple-600 transition-transform group-hover:scale-110">
                    {React.cloneElement(item.icon as any, { className: "w-7 h-7" })}
                  </div>
                  <span className="font-bold text-slate-800 text-[13px] text-center leading-tight">{item.title}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="max-w-2xl mx-auto bg-[#FCFAFF] border border-purple-100 rounded-[1.5rem] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-6 text-center sm:text-left">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <Star className="w-6 h-6 fill-white text-white" />
              </div>
              <div>
                <h4 className="font-bold text-purple-700 mb-1 text-lg">You're not alone.</h4>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Thousands of students are on the same journey.<br className="hidden sm:block"/> We're here to help you reach your goals.
                </p>
              </div>
            </div>
            <Link to="/signup" className="w-10 h-10 rounded-full border border-purple-200 flex items-center justify-center text-purple-600 hover:bg-purple-600 hover:text-white transition-colors shrink-0">
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 7. TRUSTED BY STUDENTS */}
      <section className="py-10 bg-[#FAFBFF]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-3">
              Trusted by students
            </h2>
            <p className="text-slate-500 font-medium">
              Real stories from students who found their direction.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Aishwarya K.", role: "BCA Student", quote: "I was completely confused about what to do next. This platform helped me discover a career path I actually enjoy. The roadmap is so clear!" },
              { name: "Pranav S.", role: "MCA Student", quote: "The skill gap analysis opened my eyes. Now I know exactly what to learn and I'm following a plan that fits my schedule perfectly." },
              { name: "Sneha R.", role: "Final Year Student", quote: "It's like having a personal mentor available 24/7. The guidance is practical, simple and really effective." },
            ].map((testimonial, i) => (
              <div key={i} className="bg-white border border-slate-100 rounded-2xl p-8 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
                <p className="text-slate-600 text-sm leading-relaxed mb-6 italic">"{testimonial.quote}"</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center font-bold text-purple-700">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-900 text-sm">{testimonial.name}</h5>
                      <p className="text-xs text-slate-500">{testimonial.role}</p>
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
            <div className="w-2 h-2 rounded-full bg-purple-600"></div>
            <div className="w-2 h-2 rounded-full bg-slate-200"></div>
            <div className="w-2 h-2 rounded-full bg-slate-200"></div>
            <div className="w-2 h-2 rounded-full bg-slate-200"></div>
          </div>
        </div>
      </section>

      {/* 8. CTA BANNER */}
      <section className="pb-12 pt-4 bg-[#FAFBFF]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-[2rem] p-10 md:p-14 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl shadow-purple-900/10 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>
            
            <div className="flex items-center gap-6 relative z-10 w-full md:w-auto">
              <div className="hidden md:flex w-20 h-20 bg-white/10 backdrop-blur-sm rounded-full items-center justify-center shrink-0">
                <Target className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-2">
                  Ready to find the right career<br/>and build your future?
                </h2>
                <p className="text-purple-100">Let's start your journey today.</p>
              </div>
            </div>
            
            <div className="relative z-10 w-full md:w-auto">
              <Link to="/signup" className="block w-full md:w-auto bg-white text-purple-600 font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all text-center flex items-center justify-center gap-2">
                Start Career Discovery <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 9. FOOTER */}
      <footer className="bg-white border-t border-slate-100 pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-10">
            
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <BrainCircuit className="w-6 h-6 text-purple-600" />
                <span className="font-bold text-slate-900">AI Personal Career Counselor</span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed mb-6 max-w-xs">
                Your AI mentor for the right career decision and a better future.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 font-bold text-xs hover:text-purple-500 hover:bg-purple-50 transition-colors">TW</a>
                <a href="#" className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 font-bold text-xs hover:text-purple-500 hover:bg-purple-50 transition-colors">IN</a>
                <a href="#" className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 font-bold text-xs hover:text-purple-500 hover:bg-purple-50 transition-colors">IG</a>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-6">Product</h4>
              <ul className="space-y-4 text-sm text-slate-500">
                <li><a href="#" className="hover:text-purple-600 transition-colors">How It Works</a></li>
                <li><a href="#" className="hover:text-purple-600 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-purple-600 transition-colors">Career Options</a></li>
                <li><a href="#" className="hover:text-purple-600 transition-colors">Pricing</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-6">Resources</h4>
              <ul className="space-y-4 text-sm text-slate-500">
                <li><a href="#" className="hover:text-purple-600 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-purple-600 transition-colors">Guides</a></li>
                <li><a href="#" className="hover:text-purple-600 transition-colors">Career Library</a></li>
                <li><a href="#" className="hover:text-purple-600 transition-colors">Student Stories</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-6">Company</h4>
              <ul className="space-y-4 text-sm text-slate-500">
                <li><a href="#" className="hover:text-purple-600 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-purple-600 transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-purple-600 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-purple-600 transition-colors">Terms of Service</a></li>
              </ul>
            </div>

          </div>
          
          <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-400">© 2026 AI Personal Career Counselor. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
