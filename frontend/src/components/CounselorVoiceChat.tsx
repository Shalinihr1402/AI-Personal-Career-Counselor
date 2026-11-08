import { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Compass,
  CheckCircle2,
  ShieldCheck,
  Layers,
  AlertTriangle,
} from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import {
  sendDiagnosticChatTurn,
  generateDiagnosticRecommendations,
  type DiagnosticProfileData,
  type DiagnosticRecommendationResult,
  type ScoreResult,
  type AdaptiveScoreResult,
} from '../lib/assessment';

interface Message {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  timestamp?: string;
}

interface Props {
  assessmentScore?: ScoreResult | null;
  adaptiveScore?: AdaptiveScoreResult | null;
  initialDiagnosticProfile?: DiagnosticProfileData | null;
  onDiagnosticComplete?: (
    results: DiagnosticRecommendationResult,
    diagnosticProfile: DiagnosticProfileData
  ) => void;
  onRestartAssessment?: () => void;
}

// Web Speech API interface definitions
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    [key: number]: {
      [key: number]: {
        transcript: string;
      };
      isFinal: boolean;
    };
    length: number;
  };
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: unknown) => void;
  onend: () => void;
}

export default function CounselorVoiceChat({
  assessmentScore,
  adaptiveScore,
  initialDiagnosticProfile,
  onDiagnosticComplete,
  onRestartAssessment,
}: Props) {
  const { user } = useAuth();
  const { profile, assessment } = useProfile();

  const hollandCode = assessmentScore?.code || assessment?.code || 'EAI';
  const stage = adaptiveScore?.stage || profile?.educationStage || 'college_ug_pg';
  const firstName = user?.email ? user.email.split('@')[0] : 'there';

  const profileSkills: string[] = Array.isArray(profile?.skills_and_experience?.skills)
    ? profile.skills_and_experience.skills.map((s) => (typeof s === 'string' ? s : s.name))
    : profile?.resume?.skills || [];

  const defaultDiagnostic: DiagnosticProfileData = {
    education_background: [profile?.course, profile?.college, stage].filter(Boolean).join(' — '),
    education_status: profile?.course ? 'collected' : 'not_collected',
    projects: [],
    projects_status: 'not_collected',
    technical_skills: profileSkills,
    skills_status: profileSkills.length > 0 ? 'partially_collected' : 'not_collected',
    technical_interests: profile?.interests || [],
    interests_status: (profile?.interests?.length ?? 0) > 0 ? 'partially_collected' : 'not_collected',
    challenges_and_growth: [],
    challenges_status: 'not_collected',
    work_preferences: {},
    preferences_status: 'not_collected',
    career_goals: profile?.targetRole ? [profile.targetRole] : [],
    goals_status: profile?.targetRole ? 'partially_collected' : 'not_collected',
    summary_of_student: '',
    completeness_score: 25,
    is_ready_for_recommendations: false,
  };

  const [diagnosticProfile, setDiagnosticProfile] = useState<DiagnosticProfileData>(
    () => initialDiagnosticProfile || defaultDiagnostic
  );

  // Generate personalized initial greeting acknowledging assessment results
  const getInitialMessage = () => {
    const isSchool = stage.includes('10th') || stage.includes('sslc');
    const isHigherSecondary = stage.includes('12th') || stage.includes('puc');

    if (isSchool) {
      return (
        `Hello ${firstName}! I've reviewed your Career Discovery Assessment. ` +
        `Your Holland RIASEC profile shows a dominant pattern in ${hollandCode} environments. ` +
        `Finishing Class 10 is an exciting milestone. Which school subjects (like Science, Math, or Social Science) ` +
        `or personal hobbies do you naturally find most engaging?`
      );
    }

    if (isHigherSecondary) {
      return (
        `Hello ${firstName}! I've reviewed your Career Discovery Assessment. ` +
        `Your Holland RIASEC profile shows strong resonance in ${hollandCode} activities. ` +
        `As you plan ahead from Class 11/12, which academic streams, college degrees, or entrance exam directions excite you most?`
      );
    }

    return (
      `Hello ${firstName}! I've reviewed your Career Discovery Assessment. ` +
      `Your Holland RIASEC profile indicates a dominant pattern in ${hollandCode} environments. ` +
      `To help me tailor your career recommendations to the real world, tell me: ` +
      `What practical project, application, or significant assignment have you worked on that you found engaging?`
    );
  };

  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: '1',
      role: 'assistant',
      text: getInitialMessage(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [suggestionChips, setSuggestionChips] = useState<string[]>([
    'I built a web application',
    'I worked on a data / ML project',
    'I built a mobile or systems app',
    'I have academic coursework assignments',
  ]);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Check speech recognition support
  useEffect(() => {
    const win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionInstance;
      webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
    };
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (SpeechRec) {
      setVoiceSupported(true);
      const rec = new SpeechRec();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'en-IN';

      rec.onresult = (event: SpeechRecognitionEvent) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          setInputText(transcript);
        }
      };

      rec.onerror = (err) => {
        console.warn('Speech recognition error:', err);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Speech synthesis
  const speakText = (text: string) => {
    if (!isVoiceEnabled || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const clean = text.replace(/```[\s\S]*?```/g, '').replace(/\{[\s\S]*?\}/g, '').trim();
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        (v) => v.lang.includes('en-IN') || v.name.includes('India') || v.lang.includes('en-GB')
      );
      if (preferred) utterance.voice = preferred;

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please type your message.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setInputText('');
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Failed to start speech recognition:', err);
      }
    }
  };

  // Send message turn to diagnostic counselor
  const handleSendMessage = async (textToSend?: string, isEarlyCompletion = false) => {
    const text = (textToSend || inputText).trim();
    if (!text && !isEarlyCompletion) return;
    if (loading || generating) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: text || (isEarlyCompletion ? 'I am ready to review my profile and see career recommendations.' : ''),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputText('');
    setLoading(true);
    setError(null);

    try {
      const payload = {
        messages: updatedMessages.map((m) => ({ role: m.role, content: m.text })),
        student_profile: {
          name: firstName,
          educationStage: stage,
          course: profile?.course,
          college: profile?.college,
          interests: profile?.interests || [],
          resume: profile?.resume,
          skills: profile?.resume?.skills || [],
          targetRole: profile?.targetRole,
        },
        assessment_evidence: {
          holland_code: hollandCode,
          scores: assessmentScore?.scores || assessment?.scores,
          top_fields: assessmentScore?.top_fields || assessment?.adaptiveEvidence?.top_fields || [],
          evidence_tiers: adaptiveScore?.evidence_breakdown || assessment?.adaptiveEvidence?.evidence_breakdown || {},
          statutory_eligibility: adaptiveScore?.statutory_eligibility || assessment?.adaptiveEvidence?.statutory_eligibility || {},
        },
        diagnostic_profile: diagnosticProfile,
        requested_completion: isEarlyCompletion,
        user_confirmed: false,
      };

      const res = await sendDiagnosticChatTurn(payload);

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      speakText(res.reply);

      if (res.diagnostic_profile) {
        setDiagnosticProfile(res.diagnostic_profile);
      }

      if (res.suggested_chips && res.suggested_chips.length > 0) {
        setSuggestionChips(res.suggested_chips);
      }
    } catch (err) {
      console.error('Diagnostic counselor turn error:', err);
      setError('Connection to AI Counselor timed out. Please try sending your message again.');
      const fallbackMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: "I had a momentary glitch connecting to my reasoning engine. Could you share what technologies or responsibilities were involved in that project?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Generate final career recommendations once diagnostic is complete
  const handleGenerateRecommendations = async () => {
    if (generating) return;
    setGenerating(true);
    setError(null);

    try {
      const payload = {
        riasec_scores: assessmentScore?.scores || assessment?.scores || { R: 12, I: 19, A: 19, S: 12, E: 19, C: 12 },
        code: hollandCode,
        interests: profile?.interests || [],
        education: [profile?.course, profile?.year].filter(Boolean).join(' — ') || stage,
        work_style: assessment?.workStyle || {},
        resume_skills: profile?.resume?.skills || [],
        strengths_note: profile?.strengthsNote || undefined,
        know_me: (profile?.knowMe as unknown as Record<string, unknown>) || {},
        diagnostic_profile: diagnosticProfile,
      };

      const result = await generateDiagnosticRecommendations(payload);
      if (onDiagnosticComplete) {
        onDiagnosticComplete(result, diagnosticProfile);
      }
    } catch (err) {
      console.error('Failed to generate career recommendations:', err);
      setError('Could not generate career matches. Please ensure the backend server is running and try again.');
      setGenerating(false);
    }
  };

  return (
    <div className="w-full">
      {/* Top Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-700 border border-violet-100 flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
            <Compass className="w-5 h-5 text-violet-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                AI Diagnostic Career Counselor
              </h2>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Diagnostic Active
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Interactive consultation synthesizing your assessment, practical projects, and technical skills.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {onRestartAssessment && (
            <button
              type="button"
              onClick={onRestartAssessment}
              className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-800"
              title="Retake Career Assessment"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (isVoiceEnabled) window.speechSynthesis?.cancel();
              setIsVoiceEnabled(!isVoiceEnabled);
            }}
            className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors text-slate-700"
            title={isVoiceEnabled ? 'Mute counselor audio voice' : 'Enable counselor audio voice'}
          >
            {isVoiceEnabled ? <Volume2 className="w-4 h-4 text-violet-700" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSendMessage('I am ready to review my profile and see career recommendations.', true)}
            disabled={loading || generating}
            rightIcon={<ArrowRight className="w-3.5 h-3.5 text-violet-700" />}
            className="bg-white hover:bg-violet-50 hover:border-violet-300"
          >
            Finish & Review
          </Button>
        </div>
      </div>

      {/* Main 2-Column Desktop Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side Panel: Profile & Diagnostic State Tracker */}
        <div className="lg:col-span-4 space-y-4">
          {/* Assessment Foundation Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-2">
              Assessment Foundation
            </span>
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-sm font-extrabold text-slate-900 block capitalize">{firstName}</span>
                <span className="text-xs text-slate-500">{stage}</span>
              </div>
              <div className="flex items-center gap-1 bg-violet-50 px-2.5 py-1 rounded-xl border border-violet-100">
                <span className="text-[10px] font-bold text-violet-600 mr-1">RIASEC</span>
                <span className="font-mono font-extrabold text-xs text-violet-900 tracking-wider">
                  {hollandCode}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 flex items-start gap-2 leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Assessment verified. Now collecting practical evidence & project responsibilities.</span>
            </div>
          </div>

          {/* Diagnostic Completeness Tracker */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-violet-600" />
                  Diagnostic Profile
                </span>
                <span className="font-mono text-violet-700">{diagnosticProfile.completeness_score}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-600 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${Math.min(100, Math.max(15, diagnosticProfile.completeness_score))}%` }}
                />
              </div>
            </div>

            {/* Category Status List */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-700 font-medium flex items-center gap-1.5">
                  🎓 Academic Background
                </span>
                <Badge variant={diagnosticProfile.education_status !== 'not_collected' ? 'success' : 'neutral'} size="xs">
                  {diagnosticProfile.education_status !== 'not_collected' ? 'Collected' : 'Pending'}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-700 font-medium flex items-center gap-1.5">
                  💻 Projects & Practical Work
                </span>
                <Badge variant={diagnosticProfile.projects_status === 'collected' ? 'success' : diagnosticProfile.projects_status === 'partially_collected' ? 'brand' : 'neutral'} size="xs">
                  {diagnosticProfile.projects_status === 'collected' ? 'Collected' : diagnosticProfile.projects_status === 'partially_collected' ? 'In Progress' : 'Pending'}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-700 font-medium flex items-center gap-1.5">
                  🛠️ Technical Skills & Tools
                </span>
                <Badge variant={diagnosticProfile.skills_status === 'collected' ? 'success' : diagnosticProfile.skills_status === 'partially_collected' ? 'brand' : 'neutral'} size="xs">
                  {diagnosticProfile.skills_status === 'collected' ? 'Collected' : diagnosticProfile.skills_status === 'partially_collected' ? 'In Progress' : 'Pending'}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-700 font-medium flex items-center gap-1.5">
                  💡 Technical Interests & Focus
                </span>
                <Badge variant={diagnosticProfile.interests_status !== 'not_collected' ? 'success' : 'neutral'} size="xs">
                  {diagnosticProfile.interests_status !== 'not_collected' ? 'Collected' : 'Pending'}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-700 font-medium flex items-center gap-1.5">
                  🎯 Career Preferences & Goals
                </span>
                <Badge variant={diagnosticProfile.goals_status !== 'not_collected' ? 'success' : 'neutral'} size="xs">
                  {diagnosticProfile.goals_status !== 'not_collected' ? 'Collected' : 'Pending'}
                </Badge>
              </div>
            </div>

            {/* Collected Skills Pill Cloud */}
            {diagnosticProfile.technical_skills && diagnosticProfile.technical_skills.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Identified Skills & Tools
                </span>
                <div className="flex flex-wrap gap-1">
                  {diagnosticProfile.technical_skills.slice(0, 8).map((s) => (
                    <span
                      key={s}
                      className="text-[11px] font-medium text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-md"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center: Main Conversational Workspace */}
        <div className="lg:col-span-8 flex flex-col bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden h-[660px]">
          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            {messages.map((m) => {
              const isAssistant = m.role === 'assistant';
              return (
                <div
                  key={m.id}
                  className={`flex gap-3 ${isAssistant ? 'justify-start' : 'justify-end'}`}
                >
                  {isAssistant && (
                    <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-700 border border-violet-100 flex items-center justify-center shrink-0 font-bold text-xs shadow-2xs">
                      <Sparkles className="w-4 h-4 text-violet-700" />
                    </div>
                  )}

                  <div className={`max-w-[85%] sm:max-w-[78%] flex flex-col ${isAssistant ? 'items-start' : 'items-end'}`}>
                    <div
                      className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        isAssistant
                          ? 'bg-slate-50/90 text-slate-800 rounded-bl-sm border border-slate-200/70 shadow-2xs'
                          : 'bg-violet-700 text-white font-medium rounded-br-sm shadow-xs'
                      }`}
                    >
                      <p className="whitespace-pre-line">{m.text}</p>
                    </div>
                    {m.timestamp && (
                      <span className="text-[10px] text-slate-400 mt-1 px-1">{m.timestamp}</span>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-700 border border-violet-100 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-violet-700" />
                </div>
                <div className="bg-slate-50 rounded-2xl px-4 py-3 text-sm text-slate-500 rounded-bl-sm border border-slate-200/70 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-violet-600 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-violet-600 animate-bounce delay-100" />
                  <div className="w-2 h-2 rounded-full bg-violet-600 animate-bounce delay-200" />
                  <span className="text-xs font-semibold ml-1 text-slate-400">Counselor is analyzing your response...</span>
                </div>
              </div>
            )}

            {/* Diagnostic Confirmation Card (Ready for Recommendations) */}
            {diagnosticProfile.is_ready_for_recommendations && !generating && (
              <div className="p-5 rounded-2xl bg-gradient-to-br from-violet-50 via-purple-50/40 to-white border-2 border-violet-500/80 shadow-md space-y-3.5 my-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-violet-700 text-white flex items-center justify-center shadow-2xs">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Diagnostic Consultation Complete
                    </h3>
                    <p className="text-xs text-slate-500">
                      Sufficient practical evidence collected to synthesize your final career recommendations.
                    </p>
                  </div>
                </div>

                {diagnosticProfile.summary_of_student && (
                  <div className="p-3.5 bg-white rounded-xl border border-violet-100 text-xs text-slate-700 leading-relaxed">
                    <span className="font-bold text-violet-950 block mb-1">Counselor Summary:</span>
                    <p className="whitespace-pre-line">{diagnosticProfile.summary_of_student}</p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
                  <Button
                    variant="primary"
                    size="md"
                    isLoading={generating}
                    rightIcon={<Sparkles className="w-4 h-4" />}
                    onClick={handleGenerateRecommendations}
                    className="flex-1 justify-center shadow-sm"
                  >
                    Generate My Career Recommendations
                  </Button>

                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => handleSendMessage('I want to add another detail about my experience.', false)}
                    className="bg-white hover:bg-slate-50 text-xs"
                  >
                    Add More Details
                  </Button>
                </div>
              </div>
            )}

            {/* Recommendation Generation Loading Banner */}
            {generating && (
              <div className="p-6 rounded-2xl bg-violet-50/80 border border-violet-200 text-center space-y-3 my-2">
                <div className="w-8 h-8 border-2 border-violet-300 border-t-violet-700 rounded-full animate-spin mx-auto" />
                <h4 className="text-sm font-bold text-slate-900">
                  Synthesizing Final Recommendations
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Ranking across 1,016 occupational pathways, matching your Holland RIASEC scores, practical projects, and skills.
                </p>
              </div>
            )}

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          {suggestionChips.length > 0 && !generating && (
            <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200/70 overflow-x-auto flex gap-2 shrink-0">
              {suggestionChips.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(chip)}
                  disabled={loading || generating}
                  className="whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:border-violet-300 hover:bg-violet-50 transition-all shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Message Composer */}
          <div className="p-4 bg-white border-t border-slate-200/80">
            {isListening && (
              <div className="mb-2 px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold flex items-center gap-2 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-red-600" />
                Listening to your voice... Speak clearly in English.
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              {voiceSupported && (
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-3 rounded-xl border transition-all shrink-0 cursor-pointer ${
                    isListening
                      ? 'bg-red-600 border-red-600 text-white shadow-md animate-pulse ring-4 ring-red-200'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  title={isListening ? 'Stop recording voice' : 'Click to speak via Microphone'}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              )}

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  isListening
                    ? 'Listening... say what you worked on or tools you used...'
                    : 'Type your response (e.g. project role, tools used, or challenges)...'
                }
                disabled={loading || generating}
                className="flex-1 px-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-600 focus:bg-white transition-all placeholder:text-slate-400"
              />

              <button
                type="submit"
                disabled={loading || generating || !inputText.trim()}
                className="p-2.5 bg-violet-700 hover:bg-violet-800 text-white rounded-xl font-bold transition-all disabled:opacity-40 shrink-0 shadow-xs cursor-pointer"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
