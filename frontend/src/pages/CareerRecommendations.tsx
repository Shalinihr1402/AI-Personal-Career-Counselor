import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  BarChart3,
  Code2,
  Server,
  Database,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Briefcase,
  Star,
  Check,
  GraduationCap,
  Lightbulb,
  ChevronRight,
  Compass,
  Crown,
  Diamond,
  Laptop,
  Target,
  Rocket,
  Search,
  RotateCcw,
} from 'lucide-react';
import AppHeader from '../components/AppHeader';
import AppFooter from '../components/AppFooter';
import { useProfile } from '../context/ProfileContext';
import { type CareerMatch } from '../lib/assessment';

export interface RecommendationCardData {
  id: string;
  title: string;
  slug: string;
  matchPercentage: number;
  matchBadge: string;
  salary: string;
  demand: string;
  industry: string;
  summary: string;
  iconType: 'analytics' | 'ml' | 'backend' | 'datascience' | 'general';
  whyItSuitsYou: string[];
  yourStrengths: string[];
  whatToLearnNext: string[];
  growthPath: {
    junior: string;
    target: string;
    senior: string;
    specialist: string;
  };
  nextStep: string;
}

const DEFAULT_RECOMMENDATIONS: RecommendationCardData[] = [
  {
    id: 'data-analyst',
    title: 'Data Analyst',
    slug: 'data-analyst',
    matchPercentage: 92,
    matchBadge: '92% Match',
    salary: '₹6 - 15 LPA',
    demand: 'Growing Demand',
    industry: 'IT & Analytics',
    summary: 'Turn data into insights and drive smarter business decisions.',
    iconType: 'analytics',
    whyItSuitsYou: [
      'Your interest in data, Python skills and analytical thinking align perfectly with this role.',
      'You have a strong foundation in problem-solving and are curious about technology.',
      'This career offers great growth in today\'s data-driven world.',
    ],
    yourStrengths: [
      'Demonstrated foundation in Python programming and structured data interpretation.',
      'Aptitude for logical pattern recognition and database querying with SQL.',
      'Clear analytical communication and curiosity about business metrics.',
    ],
    whatToLearnNext: [
      'Interactive dashboards with Power BI or Tableau.',
      'Advanced SQL (Window Functions, Common Table Expressions, indexing).',
      'Exploratory data analysis libraries (Pandas, NumPy, Matplotlib, Seaborn).',
    ],
    growthPath: {
      junior: 'Junior Data Analyst',
      target: 'Data Analyst',
      senior: 'Senior Data Analyst',
      specialist: 'Data Science Specialist',
    },
    nextStep:
      'Build hands-on projects in Python (Pandas, Matplotlib) and explore real datasets. This will strengthen your profile and boost your opportunities.',
  },
  {
    id: 'ml-engineer',
    title: 'Machine Learning Engineer',
    slug: 'machine-learning-engineer',
    matchPercentage: 87,
    matchBadge: '87% Match',
    salary: '₹8 - 20 LPA',
    demand: 'High Growth',
    industry: 'AI & Engineering',
    summary: 'Build and improve ML models to solve real-world problems.',
    iconType: 'ml',
    whyItSuitsYou: [
      'Your strong mathematical intuition and programming background fit algorithm development.',
      'You thrive when training predictive systems and exploring automated reasoning.',
      'Exceptional global and domestic industry demand across product companies.',
    ],
    yourStrengths: [
      'Good code structure in Python and comfort with mathematical modeling concepts.',
      'Curiosity for modern neural architectures, classification, and regression problems.',
      'Analytical problem-solving and systematic model experimentation.',
    ],
    whatToLearnNext: [
      'Scikit-learn, PyTorch or TensorFlow for supervised and unsupervised pipelines.',
      'Feature engineering, model evaluation metrics, and hyperparameter tuning.',
      'Deploying models as microservices using FastAPI and Docker containers.',
    ],
    growthPath: {
      junior: 'Junior ML Engineer',
      target: 'Machine Learning Engineer',
      senior: 'Senior ML Engineer',
      specialist: 'AI Systems Architect',
    },
    nextStep:
      'Train a classification or regression pipeline using Scikit-learn on an open dataset, document evaluation metrics, and deploy it as a REST API.',
  },
  {
    id: 'backend-developer',
    title: 'Backend Developer (Java)',
    slug: 'backend-developer-java',
    matchPercentage: 84,
    matchBadge: '84% Match',
    salary: '₹7 - 18 LPA',
    demand: 'Strong Demand',
    industry: 'Enterprise Software',
    summary: 'Design and build scalable server-side applications and secure APIs.',
    iconType: 'backend',
    whyItSuitsYou: [
      'Your appreciation for robust software architecture, server stability, and databases.',
      'Strong logical foundation suitable for high-throughput distributed architectures.',
      'High long-term career stability across major tech companies and financial institutions.',
    ],
    yourStrengths: [
      'Solid grasp of Object-Oriented Programming (OOP) concepts and design patterns.',
      'Understanding of relational databases, schema normalization, and ACID properties.',
      'Disciplined coding habits, unit testing interest, and clean architecture awareness.',
    ],
    whatToLearnNext: [
      'Spring Boot framework, Spring Security, and RESTful API standards.',
      'Database connection pooling, Redis in-memory caching, and message queues (Kafka).',
      'Microservices architecture, containerization with Docker, and CI/CD pipelines.',
    ],
    growthPath: {
      junior: 'Junior Backend Developer',
      target: 'Backend Developer (Java)',
      senior: 'Senior Backend Engineer',
      specialist: 'Principal Systems Architect',
    },
    nextStep:
      'Develop a multi-tier REST API in Spring Boot connected to PostgreSQL, incorporating authentication, error handling, and unit test coverage.',
  },
  {
    id: 'data-scientist',
    title: 'Data Scientist',
    slug: 'data-scientist',
    matchPercentage: 80,
    matchBadge: '80% Match',
    salary: '₹8 - 20 LPA',
    demand: 'Excellent Scope',
    industry: 'Data Science & AI',
    summary: 'Use data, statistics and ML to solve complex organizational problems.',
    iconType: 'datascience',
    whyItSuitsYou: [
      'Blends investigative research, predictive algorithms, and statistical inference.',
      'Excels when translating ambiguous business dilemmas into measurable quantitative models.',
      'Tremendous strategic leverage across tech, health, finance, and consumer sectors.',
    ],
    yourStrengths: [
      'Strong mathematical mindset and passion for uncovering empirical patterns.',
      'Comfort with data preparation, exploratory visualization, and testing hypotheses.',
      'Ability to articulate quantitative insights clearly to cross-functional stakeholders.',
    ],
    whatToLearnNext: [
      'Applied inferential statistics, probability distributions, and A/B testing methods.',
      'Advanced regression, tree-based models (XGBoost/LightGBM), and clustering.',
      'Data pipeline tools (dbt, Airflow) and collaborative data science platforms.',
    ],
    growthPath: {
      junior: 'Associate Data Scientist',
      target: 'Data Scientist',
      senior: 'Senior Data Scientist',
      specialist: 'Chief Data Scientist',
    },
    nextStep:
      'Publish an end-to-end data analysis notebook exploring a real-world dataset with hypothesis testing, feature insights, and business recommendations.',
  },
];

export default function CareerRecommendations() {
  const { profile, assessment, saveProfile } = useProfile();
  const navigate = useNavigate();

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'why' | 'strengths' | 'learn'>('why');
  const [isSettingGoal, setIsSettingGoal] = useState(false);

  // Map assessment matches or fall back to curated recommendations
  const recommendations: RecommendationCardData[] = useMemo(() => {
    if (assessment?.matches && assessment.matches.length > 0) {
      // Merge with default details when titles match, or generate structured item
      return assessment.matches.slice(0, 5).map((match: CareerMatch, index: number) => {
        const titleLower = match.title.toLowerCase();
        const matchedDefault = DEFAULT_RECOMMENDATIONS.find((d) =>
          d.title.toLowerCase() === titleLower ||
          titleLower.includes(d.slug.replace(/-/g, ' ')) ||
          d.slug.includes(titleLower.replace(/\s+/g, '-'))
        );

        const calculatedFit = typeof match.fit === 'number' && !isNaN(match.fit)
          ? Math.round(match.fit * 100)
          : Math.max(75, 94 - index * 4);

        if (matchedDefault) {
          return {
            ...matchedDefault,
            title: match.title,
            matchPercentage: calculatedFit,
            matchBadge: `${calculatedFit}% Match`,
            summary: match.day_to_day || matchedDefault.summary,
            salary: match.salary_india?.entry
              ? `${match.salary_india.entry} - ${match.salary_india.senior || match.salary_india.mid || '15 LPA'}`
              : matchedDefault.salary,
            industry: match.field || matchedDefault.industry,
            whyItSuitsYou: match.why_it_fits
              ? [
                  match.why_it_fits,
                  'You have a strong foundation in problem-solving and are curious about technology.',
                  'This career offers great growth in today\'s technology and business landscape.',
                ]
              : matchedDefault.whyItSuitsYou,
            yourStrengths: match.matched_skills && match.matched_skills.length > 0
              ? [
                  `Demonstrated skills in ${match.matched_skills.slice(0, 3).join(', ')}.`,
                  'Strong academic preparation aligned with industry requirements.',
                  'Problem-solving and continuous learning attitude.',
                ]
              : matchedDefault.yourStrengths,
            whatToLearnNext: match.missing_skills && match.missing_skills.length > 0
              ? match.missing_skills.slice(0, 3).map((s) => `Target core competency: ${s}`)
              : matchedDefault.whatToLearnNext,
          };
        }

        // Generic fallback for any novel career from assessment
        const iconType = titleLower.includes('data') || titleLower.includes('analyst')
          ? 'analytics'
          : titleLower.includes('machine') || titleLower.includes('ai')
          ? 'ml'
          : titleLower.includes('develop') || titleLower.includes('engineer') || titleLower.includes('backend')
          ? 'backend'
          : 'general';

        return {
          id: match.slug || `career-${index}`,
          title: match.title,
          slug: match.slug || match.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          matchPercentage: calculatedFit,
          matchBadge: `${calculatedFit}% Match`,
          salary: match.salary_india?.entry
            ? `${match.salary_india.entry} - ${match.salary_india.senior || '16 LPA'}`
            : '₹6 - 16 LPA',
          demand: 'High Growth',
          industry: match.field || 'Technology & Innovation',
          summary: match.day_to_day || 'Design, build, and deploy high-impact domain solutions.',
          iconType,
          whyItSuitsYou: [
            match.why_it_fits || 'Your interests and aptitudes align strongly with the core demands of this role.',
            'You have demonstrated analytical and structured problem-solving abilities.',
            'This pathway provides strong long-term market demand and career satisfaction.',
          ],
          yourStrengths: match.matched_skills && match.matched_skills.length > 0
            ? match.matched_skills.map((s) => `Verified competency in ${s}.`)
            : ['Solid foundation in computer science and technology fundamentals.', 'Eager learning attitude and project curiosity.'],
          whatToLearnNext: match.missing_skills && match.missing_skills.length > 0
            ? match.missing_skills.map((s) => `Focus on mastering: ${s}.`)
            : ['Deepen specialized industry tooling and practical application.', 'Build portfolio projects showcasing complete lifecycle.'],
          growthPath: {
            junior: `Junior ${match.title}`,
            target: match.title,
            senior: `Senior ${match.title}`,
            specialist: `${match.title} Lead / Specialist`,
          },
          nextStep: `Build hands-on practical projects in ${match.key_skills?.[0] || 'core technologies'} and contribute to real-world codebases to boost your profile.`,
        };
      });
    }

    return DEFAULT_RECOMMENDATIONS;
  }, [assessment]);

  const selectedCareer = recommendations[selectedIndex] || recommendations[0];

  // Dynamic AI Counselor's Insight synthesizer
  const counselorInsight = useMemo(() => {
    const interests = profile?.interests || [];
    const skills = profile?.skills_and_experience?.skills || [];
    const degree = profile?.education_details?.degree || profile?.course || '';

    const topCareer1 = recommendations[0]?.title || 'Data Analyst';
    const topCareer2 = recommendations[1]?.title || 'Machine Learning Engineer';

    let focusArea = 'technology and strong problem-solving';
    if (interests.length > 0) {
      focusArea = interests.slice(0, 2).join(' and ');
    }

    let skillHighlight = 'analytical mindset and curiosity';
    if (skills.length > 0) {
      skillHighlight = `${skills.slice(0, 2).map((s) => s.name).join(' and ')} skills`;
    }

    let backgroundText = '';
    if (degree) {
      backgroundText = ` in ${degree}`;
    }

    return {
      title: "AI Counselor's Insight",
      text: `Your analytical mindset${backgroundText}, interest in ${focusArea} and strong ${skillHighlight} make you a great fit for ${topCareer1} and ${topCareer2} roles. Keep exploring real-world datasets, build hands-on projects, and you'll be ready for exciting opportunities! 💚`,
    };
  }, [profile, recommendations]);

  // Handle setting active goal and navigating to roadmap
  const handleProceedToRoadmap = async () => {
    try {
      setIsSettingGoal(true);
      if (profile && selectedCareer) {
        await saveProfile({
          targetRole: selectedCareer.title,
        });
      }
    } catch {
      // Continue even if save fails
    } finally {
      setIsSettingGoal(false);
      navigate('/roadmap');
    }
  };

  // Helper for rendering icons
  const renderCareerIcon = (type: RecommendationCardData['iconType']) => {
    switch (type) {
      case 'analytics':
        return (
          <div className="w-11 h-11 rounded-xl bg-[#EAF5F4] text-[#168C89] flex items-center justify-center shrink-0">
            <BarChart3 className="w-6 h-6 text-[#168C89]" />
          </div>
        );
      case 'ml':
        return (
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Code2 className="w-6 h-6 text-blue-600" />
          </div>
        );
      case 'backend':
        return (
          <div className="w-11 h-11 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center shrink-0">
            <Server className="w-6 h-6 text-cyan-700" />
          </div>
        );
      case 'datascience':
        return (
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Database className="w-6 h-6 text-emerald-700" />
          </div>
        );
      default:
        return (
          <div className="w-11 h-11 rounded-xl bg-[#EAF5F4] text-[#168C89] flex items-center justify-center shrink-0">
            <Compass className="w-6 h-6 text-[#168C89]" />
          </div>
        );
    }
  };

  // Circular gauge math
  const gaugeRadius = 38;
  const gaugeCircumference = 2 * Math.PI * gaugeRadius;
  const gaugeOffset = gaugeCircumference - (selectedCareer.matchPercentage / 100) * gaugeCircumference;

  return (
    <div className="min-h-screen bg-[#F5F8FC] font-sans flex flex-col text-[#172638]">
      <AppHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        
        {/* A. Top Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF5F4] text-[#168C89] font-bold text-xs border border-[#C5E6E4] shadow-2xs mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#168C89]" />
              <span>Your Career Recommendations</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#172638] tracking-tight">
              Here are your <span className="text-[#168C89]">best</span> career matches!
            </h1>

            <p className="text-sm text-[#64748B] mt-1">
              Based on your profile, skills, interests and assessment results
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
            <Link
              to="/assessment?retake=true"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-[#64748B] hover:text-[#172638] bg-white hover:bg-slate-50 border border-[#E2E8F0] shadow-2xs transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#168C89]" />
              <span>Retake Assessment</span>
            </Link>
          </div>
        </div>

        {/* B. AI Counselor's Insight Banner */}
        <div className="rounded-2xl border border-[#C5E6E4] bg-gradient-to-r from-[#F0FAF9] via-[#F5FCFB] to-[#EAF5F4] p-5 sm:p-6 mb-8 shadow-xs relative overflow-hidden flex items-center gap-4 sm:gap-5">
          {/* 3D-styled Friendly Robot Avatar */}
          <div className="relative shrink-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-[#C5E6E4] to-[#EAF5F4] p-1.5 shadow-md flex items-center justify-center ring-4 ring-white">
              <div className="w-full h-full rounded-full bg-[#142B4A] flex items-center justify-center relative overflow-hidden">
                {/* Robot Head Shape */}
                <div className="w-9 h-7 sm:w-11 sm:h-8.5 rounded-lg bg-white flex items-center justify-around px-1.5 shadow-inner relative">
                  {/* Glowing Eyes */}
                  <div className="w-2 h-2.5 sm:w-2.5 sm:h-3 rounded-full bg-[#168C89] animate-pulse" />
                  <div className="w-2 h-2.5 sm:w-2.5 sm:h-3 rounded-full bg-[#168C89] animate-pulse" />
                  {/* Cute Smile */}
                  <div className="absolute bottom-1 w-3.5 h-1 border-b-2 border-[#142B4A] rounded-full" />
                </div>
                {/* Antennas */}
                <div className="absolute top-1 w-1.5 h-1.5 rounded-full bg-[#168C89]" />
              </div>
            </div>
            <span className="absolute -top-1 -right-1 text-sm">💡</span>
          </div>

          {/* Insight Text */}
          <div className="flex-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#168C89] uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5 text-[#168C89]" />
              <span className="text-[#142B4A] font-extrabold">{counselorInsight.title}</span>
            </div>
            <p className="text-xs sm:text-sm text-[#172638] leading-relaxed font-medium">
              {counselorInsight.text}
            </p>
          </div>
        </div>

        {/* C. Two-Column Layout (~36% Left / 64% Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Top Career Matches Stack */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* List Header */}
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">🏆</span>
                <h2 className="text-base sm:text-lg font-bold text-[#172638]">
                  Your Top Career Matches
                </h2>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#EAF5F4] text-[#168C89] font-bold text-xs border border-[#C5E6E4]">
                Top {recommendations.length} Results
              </span>
            </div>

            {/* Career Cards Stack */}
            <div className="space-y-3">
              {recommendations.map((item, index) => {
                const isSelected = selectedIndex === index;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedIndex(index)}
                    className={`w-full text-left p-4 rounded-2xl transition-all duration-200 flex items-center justify-between gap-3.5 group cursor-pointer ${
                      isSelected
                        ? 'bg-[#F0FAF9] border-2 border-[#168C89] shadow-sm ring-1 ring-[#168C89]/20'
                        : 'bg-white border border-[#E2E8F0] hover:border-[#168C89]/40 hover:bg-[#F8FAFC]'
                    }`}
                  >
                    {/* Icon */}
                    {renderCareerIcon(item.iconType)}

                    {/* Middle Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-[#172638] text-sm sm:text-base truncate group-hover:text-[#168C89] transition-colors">
                          {item.title}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#E6F4EA] text-[#137333] shrink-0">
                          {item.matchBadge}
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-[#64748B] flex items-center gap-1.5 mt-0.5">
                        <span>{item.salary}</span>
                        <span>•</span>
                        <span className="text-[#168C89] font-bold">{item.demand}</span>
                      </div>

                      <p className="text-xs text-[#64748B] line-clamp-1 mt-1">
                        {item.summary}
                      </p>
                    </div>

                    {/* Right Circular Arrow Indicator */}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-[#168C89] text-white shadow-2xs'
                          : 'bg-[#F1F5F9] text-[#64748B] group-hover:bg-[#EAF5F4] group-hover:text-[#168C89]'
                      }`}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Bottom Explore More CTA */}
            <Link
              to="/careers"
              className="w-full py-3 px-4 rounded-xl border border-[#C5E6E4] bg-white hover:bg-[#EAF5F4] text-[#168C89] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-2xs cursor-pointer group mt-2"
            >
              <Search className="w-4 h-4 text-[#168C89]" />
              <span>Explore More Careers</span>
              <ArrowRight className="w-4 h-4 text-[#168C89] group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Right Column: Selected Career Detailed Showcase */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* 1. Deep Navy Hero Card (#142B4A) */}
            <div className="bg-[#142B4A] text-white rounded-2xl p-6 sm:p-7 shadow-sm relative overflow-hidden">
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                
                {/* Career Title & Meta */}
                <div className="flex-1">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {selectedCareer.title}
                  </h2>
                  <p className="text-sm text-slate-200 mt-1 mb-5 max-w-md leading-relaxed">
                    {selectedCareer.summary}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-200">
                    <span className="flex items-center gap-1.5 font-bold">
                      <Briefcase className="w-3.5 h-3.5 text-[#168C89]" />
                      <span>{selectedCareer.salary}</span>
                    </span>
                    <span className="text-slate-500">|</span>
                    <span className="flex items-center gap-1.5 font-bold text-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{selectedCareer.demand}</span>
                    </span>
                    <span className="text-slate-500">|</span>
                    <span className="flex items-center gap-1.5 font-semibold text-slate-300">
                      <Laptop className="w-3.5 h-3.5 text-[#168C89]" />
                      <span>{selectedCareer.industry}</span>
                    </span>
                  </div>
                </div>

                {/* Right Circular Gauge & Graphic */}
                <div className="flex items-center gap-4 shrink-0">
                  {/* Subtle Tech Screen Illustration */}
                  <div className="hidden md:block w-24 h-16 rounded-lg bg-[#0E1F36] border border-[#1E3A5F] p-1.5 shadow-inner opacity-80">
                    <div className="flex items-center gap-1 mb-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    </div>
                    <div className="flex items-end justify-between h-8 px-1 pt-1">
                      <div className="w-2 h-4 bg-[#168C89] rounded-t-xs" />
                      <div className="w-2 h-6 bg-[#168C89]/80 rounded-t-xs" />
                      <div className="w-2 h-7 bg-cyan-400 rounded-t-xs" />
                      <div className="w-2 h-5 bg-[#168C89]/60 rounded-t-xs" />
                    </div>
                  </div>

                  {/* Circular SVG Match Gauge */}
                  <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                    <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 90 90">
                      {/* Background Track */}
                      <circle
                        cx="45"
                        cy="45"
                        r={gaugeRadius}
                        className="stroke-[#1E3A5F]"
                        strokeWidth="7"
                        fill="transparent"
                      />
                      {/* Animated Progress Ring */}
                      <circle
                        cx="45"
                        cy="45"
                        r={gaugeRadius}
                        className="stroke-[#168C89] transition-all duration-700 ease-out"
                        strokeWidth="7"
                        strokeDasharray={gaugeCircumference}
                        strokeDashoffset={gaugeOffset}
                        strokeLinecap="round"
                        fill="transparent"
                      />
                    </svg>
                    {/* Gauge Center Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-xl font-extrabold text-white leading-none">
                        {selectedCareer.matchPercentage}%
                      </span>
                      <span className="text-[10px] font-bold text-[#A5F3FC] uppercase tracking-wider mt-0.5">
                        Match
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Interactive 3-Tab Bar */}
            <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setActiveTab('why')}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'why'
                    ? 'bg-[#142B4A] text-white shadow-2xs'
                    : 'bg-white text-[#172638] hover:bg-[#F1F5F9] border border-[#E2E8F0]'
                }`}
              >
                <Star className={`w-3.5 h-3.5 ${activeTab === 'why' ? 'text-amber-300 fill-amber-300' : 'text-slate-400'}`} />
                <span>Why It Suits You</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('strengths')}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'strengths'
                    ? 'bg-[#142B4A] text-white shadow-2xs'
                    : 'bg-white text-[#172638] hover:bg-[#F1F5F9] border border-[#E2E8F0]'
                }`}
              >
                <Check className={`w-3.5 h-3.5 ${activeTab === 'strengths' ? 'text-emerald-400 stroke-[3]' : 'text-slate-400'}`} />
                <span>Your Strengths</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('learn')}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'learn'
                    ? 'bg-[#142B4A] text-white shadow-2xs'
                    : 'bg-white text-[#172638] hover:bg-[#F1F5F9] border border-[#E2E8F0]'
                }`}
              >
                <GraduationCap className={`w-3.5 h-3.5 ${activeTab === 'learn' ? 'text-cyan-300' : 'text-slate-400'}`} />
                <span>What to Learn Next</span>
              </button>
            </div>

            {/* 3. Tab Content Area */}
            <div className="bg-[#F0FAF9] border border-[#C5E6E4] rounded-2xl p-5 sm:p-6 shadow-2xs">
              <ul className="space-y-3">
                {activeTab === 'why' &&
                  selectedCareer.whyItSuitsYou.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-[#172638] leading-relaxed">
                      <CheckCircle2 className="w-4 h-4 text-[#168C89] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}

                {activeTab === 'strengths' &&
                  selectedCareer.yourStrengths.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-[#172638] leading-relaxed">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}

                {activeTab === 'learn' &&
                  selectedCareer.whatToLearnNext.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-[#172638] leading-relaxed">
                      <Target className="w-4 h-4 text-[#168C89] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
              </ul>
            </div>

            {/* 4. Career Growth Path */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 shadow-2xs">
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="w-4 h-4 text-[#168C89]" />
                <h3 className="font-bold text-[#172638] text-sm sm:text-base">
                  Career Growth Path
                </h3>
              </div>

              {/* 4-Node Horizontal Progression */}
              <div className="relative flex items-center justify-between">
                {/* Horizontal Connecting Line */}
                <div className="absolute left-6 right-6 top-5 h-0.5 bg-[#E2E8F0] z-0" />

                {/* Node 1: Junior */}
                <div className="relative z-10 flex flex-col items-center text-center max-w-[80px] sm:max-w-[100px]">
                  <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-slate-300 text-slate-600 flex items-center justify-center mb-2 shadow-2xs">
                    <BarChart3 className="w-4 h-4 text-[#168C89]" />
                  </div>
                  <span className="text-[11px] font-semibold text-[#64748B] leading-tight">
                    {selectedCareer.growthPath.junior}
                  </span>
                </div>

                {/* Node 2: Target Role (Highlighted) */}
                <div className="relative z-10 flex flex-col items-center text-center max-w-[80px] sm:max-w-[100px]">
                  <div className="w-10 h-10 rounded-full bg-[#168C89] border-2 border-white text-white flex items-center justify-center mb-2 shadow-xs ring-2 ring-[#168C89]/30">
                    <Star className="w-4 h-4 fill-white text-white" />
                  </div>
                  <span className="text-[11px] font-bold text-[#172638] leading-tight">
                    {selectedCareer.growthPath.target}
                  </span>
                </div>

                {/* Node 3: Senior */}
                <div className="relative z-10 flex flex-col items-center text-center max-w-[80px] sm:max-w-[100px]">
                  <div className="w-10 h-10 rounded-full bg-amber-50 border-2 border-amber-300 text-amber-700 flex items-center justify-center mb-2 shadow-2xs">
                    <Crown className="w-4 h-4 text-amber-600" />
                  </div>
                  <span className="text-[11px] font-semibold text-[#64748B] leading-tight">
                    {selectedCareer.growthPath.senior}
                  </span>
                </div>

                {/* Node 4: Specialist / Lead */}
                <div className="relative z-10 flex flex-col items-center text-center max-w-[80px] sm:max-w-[100px]">
                  <div className="w-10 h-10 rounded-full bg-cyan-50 border-2 border-cyan-300 text-cyan-700 flex items-center justify-center mb-2 shadow-2xs">
                    <Diamond className="w-4 h-4 text-cyan-600" />
                  </div>
                  <span className="text-[11px] font-semibold text-[#64748B] leading-tight">
                    {selectedCareer.growthPath.specialist}
                  </span>
                </div>
              </div>
            </div>

            {/* 5. Personalized Next Step Card */}
            <div className="bg-[#F0FAF9] border border-[#C5E6E4] rounded-2xl p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#EAF5F4] text-[#168C89] border border-[#C5E6E4] flex items-center justify-center shrink-0 mt-0.5">
                  <Lightbulb className="w-4 h-4 text-[#168C89]" />
                </div>
                <div>
                  <h4 className="font-bold text-[#172638] text-xs uppercase tracking-wider mb-1">
                    Next Step
                  </h4>
                  <p className="text-xs sm:text-sm text-[#172638] leading-relaxed">
                    {selectedCareer.nextStep}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleProceedToRoadmap}
                disabled={isSettingGoal}
                className="bg-[#142B4A] hover:bg-[#0E1F36] text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-xs flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer"
              >
                <span>{isSettingGoal ? 'Setting Goal...' : 'View Learning Roadmap'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>

        {/* D. Bottom Section ("Your Personalized Next Steps") */}
        <div className="bg-gradient-to-r from-[#F0FAF9] via-[#F5FCFB] to-[#EAF5F4] border border-[#C5E6E4] rounded-2xl p-6 sm:p-8 mt-10 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-8">
          
          {/* Left Side: 4-Step Action Plan */}
          <div className="flex-1 w-full">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-[#142B4A] text-white flex items-center justify-center shadow-2xs shrink-0">
                <Rocket className="w-5 h-5 text-[#168C89]" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#172638] tracking-tight">
                  Your Personalized Next Steps
                </h3>
                <p className="text-xs sm:text-sm text-[#64748B]">
                  Follow this simple plan to move closer to your dream career.
                </p>
              </div>
            </div>

            {/* Stepper Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-center">
              
              {/* Step 1 */}
              <div className="flex flex-col items-center text-center p-3 rounded-xl bg-white/70 border border-[#C5E6E4] shadow-2xs">
                <div className="w-6 h-6 rounded-full bg-[#168C89] text-white font-extrabold text-xs flex items-center justify-center mb-2">
                  1
                </div>
                <Laptop className="w-5 h-5 text-[#142B4A] mb-1.5" />
                <span className="text-xs font-bold text-[#172638]">
                  Enhance Your Skills
                </span>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center p-3 rounded-xl bg-white/70 border border-[#C5E6E4] shadow-2xs">
                <div className="w-6 h-6 rounded-full bg-[#168C89] text-white font-extrabold text-xs flex items-center justify-center mb-2">
                  2
                </div>
                <Code2 className="w-5 h-5 text-[#142B4A] mb-1.5" />
                <span className="text-xs font-bold text-[#172638]">
                  Work on Projects
                </span>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center p-3 rounded-xl bg-white/70 border border-[#C5E6E4] shadow-2xs">
                <div className="w-6 h-6 rounded-full bg-[#168C89] text-white font-extrabold text-xs flex items-center justify-center mb-2">
                  3
                </div>
                <Briefcase className="w-5 h-5 text-[#142B4A] mb-1.5" />
                <span className="text-xs font-bold text-[#172638]">
                  Build Your Portfolio
                </span>
              </div>

              {/* Step 4 */}
              <div className="flex flex-col items-center text-center p-3 rounded-xl bg-white/70 border border-[#C5E6E4] shadow-2xs">
                <div className="w-6 h-6 rounded-full bg-[#168C89] text-white font-extrabold text-xs flex items-center justify-center mb-2">
                  4
                </div>
                <Target className="w-5 h-5 text-[#142B4A] mb-1.5" />
                <span className="text-xs font-bold text-[#172638]">
                  Apply for Dream Roles
                </span>
              </div>

            </div>
          </div>

          {/* Right Callout Card (Deep Navy #142B4A) */}
          <div className="bg-[#142B4A] text-white rounded-2xl p-6 text-center shadow-md min-w-[240px] flex flex-col items-center justify-center shrink-0 w-full lg:w-auto">
            <div className="w-10 h-10 rounded-xl bg-[#0E1F36] border border-[#1E3A5F] flex items-center justify-center mb-3">
              <TrendingUp className="w-5 h-5 text-[#168C89]" />
            </div>
            <h4 className="text-sm font-bold text-white mb-0.5">
              You're on the right path!
            </h4>
            <p className="text-xs text-slate-300 mb-4">
              Keep learning and growing.
            </p>
            <button
              type="button"
              onClick={handleProceedToRoadmap}
              className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-[#142B4A] font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Go to Roadmap</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </main>

      <AppFooter />
    </div>
  );
}
