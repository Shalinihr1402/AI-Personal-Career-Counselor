import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Sparkles,
  ArrowRight,
  RotateCcw,
  TrendingUp,
  Target,
  Compass,
  CheckCircle2,
} from 'lucide-react';
import { API_BASE } from '../lib/api';
import { useProfile } from '../context/ProfileContext';
import type { RiasecScores } from '../lib/assessment';

interface Message {
  id: string;
  role: 'assistant' | 'user';
  text: string;
}

interface CareerMatchItem {
  title: string;
  slug: string;
  field: string;
  code?: string;
  fit: number;
  reason: string;
  salary_india?: {
    entry?: string;
    mid?: string;
    senior?: string;
  };
  education?: string;
  skills?: string[];
}

interface ConclusionData {
  riasec_scores: RiasecScores;
  riasec_code: string;
  summary: string;
  matches: CareerMatchItem[];
}

interface Props {
  onRestartAssessment?: () => void;
}

// Speech recognition type declarations
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

export default function CounselorVoiceChat({ onRestartAssessment }: Props) {
  const { profile, saveAssessment } = useProfile();

  // Initial welcome message tailored to their Indian education stage
  const getInitialMessage = () => {
    const stage = profile?.educationStage;
    if (stage === 'sslc_10th') {
      return "Hello! I'm your AI Career Counselor. Finishing 10th / SSLC can feel overwhelming with everyone pushing you into different streams. Let's make it simple: What subjects in school do you naturally enjoy, and what kind of activities make you lose track of time?";
    }
    if (stage === 'puc_12th') {
      return `Welcome! You're in ${profile?.course || 'PUC / 12th'} — a crucial turning point. Tell me: When you think about college and your future, what fields or projects naturally excite you, and what subjects do you want to avoid?`;
    }
    if (stage === 'diploma') {
      return `Hey there! As a Polytechnic/Diploma student, you're building practical skills. Tell me: Do you want to continue in engineering through lateral entry, or are you looking to pivot into software, design, or specialized industry roles?`;
    }
    return `Hello! I'm your AI Career Counselor. Don't worry if you don't know your exact career path yet — we're going to figure it out together. To start: What kinds of activities, projects, or hobbies do you naturally find energizing?`;
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      text: getInitialMessage(),
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [conclusion, setConclusion] = useState<ConclusionData | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Check Web Speech API support
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
      rec.lang = 'en-IN'; // Optimized for Indian English

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

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Text to Speech playback for Counselor
  const speakText = (text: string) => {
    if (!isVoiceEnabled || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      // Pick Indian or natural English voice if present
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        (v) => v.lang.includes('en-IN') || v.name.includes('India') || v.lang.includes('en-GB'),
      );
      if (preferredVoice) utterance.voice = preferredVoice;

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  };

  // Toggle microphone
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

  // Send message to backend counselor
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || loading) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text,
    };

    const updated = [...messages, userMsg];
    setMessages(updated);
    setInputText('');
    setLoading(true);

    try {
      const payload = {
        messages: updated.map((m) => ({ role: m.role, content: m.text })),
        student_profile: {
          educationStage: profile?.educationStage || 'degree_ug',
          course: profile?.course,
          college: profile?.college,
          interests: profile?.interests,
          strengthsNote: profile?.strengthsNote,
        },
      };

      const res = await fetch(`${API_BASE}/api/counselor/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Counselor API error');
      const data = await res.json();

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: data.reply || "Thank you for sharing. Let's look closer at your strengths.",
      };

      setMessages((prev) => [...prev, assistantMsg]);
      speakText(assistantMsg.text);

      // If the counselor has completed diagnosis
      if (data.is_concluded && data.matches && data.matches.length > 0) {
        const conc: ConclusionData = {
          riasec_scores: data.riasec_scores || { R: 50, I: 50, A: 50, S: 50, E: 50, C: 50 },
          riasec_code: data.riasec_code || 'AIC',
          summary: data.summary || 'Strong alignment with creative problem solving and analytical thinking.',
          matches: data.matches,
        };
        setConclusion(conc);

        // Auto-save assessment to Supabase
        try {
          await saveAssessment({
            answers: {},
            workStyle: {},
            scores: conc.riasec_scores,
            code: conc.riasec_code,
            matches: conc.matches.map((m) => ({
              title: m.title,
              slug: m.slug,
              field: m.field,
              fit: m.fit,
              reason: m.reason,
              why_it_fits: m.reason,
              day_to_day: 'Executing core role deliverables.',
              key_skills: m.skills || [],
            })),
            source: 'ai',
          });
        } catch (saveErr) {
          console.warn('Could not auto-save assessment:', saveErr);
        }
      }
    } catch (err) {
      console.error('Counselor chat error:', err);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: "I had a brief glitch connecting to my reasoning engine. Could you please share that one more time?",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Quick suggestion chips based on turn
  const suggestionChips = [
    'I love coding & building digital products',
    'I prefer creative design, UI/UX & visuals',
    'I enjoy business strategy and managing people',
    'I dislike heavy calculus and dry theory',
    'I want a high-growth career with strong salary in India',
  ];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Counselor Chat Header */}
      <div className="bg-gradient-to-r from-purple-800 via-indigo-800 to-purple-900 rounded-3xl p-6 text-white shadow-xl mb-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl border border-white/20 shadow-inner">
              🌱
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-200">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Interactive AI Counselor Session
              </div>
              <h2 className="text-xl sm:text-2xl font-black">Voice & Diagnostic Chat</h2>
            </div>
          </div>

          {/* Education Stage Tag & Audio Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-purple-100">
              {profile?.educationStage === 'sslc_10th'
                ? '🏫 10th / SSLC Track'
                : profile?.educationStage === 'puc_12th'
                ? '🎓 12th / PUC Track'
                : profile?.educationStage === 'diploma'
                ? '📜 Polytechnic Track'
                : '🏛️ Degree Track'}
            </span>

            <button
              onClick={() => {
                if (isVoiceEnabled) window.speechSynthesis?.cancel();
                setIsVoiceEnabled(!isVoiceEnabled);
              }}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white"
              title={isVoiceEnabled ? 'Mute Counselor Voice' : 'Unmute Counselor Voice'}
            >
              {isVoiceEnabled ? <Volume2 className="w-4 h-4 text-emerald-300" /> : <VolumeX className="w-4 h-4 text-slate-300" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Conversation Window */}
      {!conclusion ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[580px] overflow-hidden">
          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 font-bold text-xs">
                    🌱
                  </div>
                )}
                <div
                  className={`max-w-[82%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-purple-600 text-white font-medium rounded-br-sm'
                      : 'bg-slate-100 text-slate-800 rounded-bl-sm border border-slate-200/60'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 font-bold text-xs animate-pulse">
                  🌱
                </div>
                <div className="bg-slate-100 rounded-2xl px-4 py-3 text-sm text-slate-500 rounded-bl-sm border border-slate-200/60 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-600 animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-purple-600 animate-bounce delay-100"></div>
                  <div className="w-2 h-2 rounded-full bg-purple-600 animate-bounce delay-200"></div>
                  <span className="text-xs font-semibold ml-1 text-slate-400">Counselor is thinking...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 overflow-x-auto flex gap-2 shrink-0">
            {suggestionChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(chip)}
                disabled={loading}
                className="whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:border-purple-300 hover:bg-purple-50 transition-all shrink-0 disabled:opacity-50"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Voice & Input Controls */}
          <div className="p-4 bg-white border-t border-slate-200">
            {isListening && (
              <div className="mb-2 px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold flex items-center gap-2 animate-pulse">
                <div className="w-2.5 h-2.5 rounded-full bg-red-600"></div>
                Listening to your voice... Speak naturally in English.
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              {/* Microphone Button */}
              {voiceSupported && (
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-3 rounded-2xl border transition-all shrink-0 ${
                    isListening
                      ? 'bg-red-600 border-red-600 text-white shadow-md animate-pulse ring-4 ring-red-200'
                      : 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'
                  }`}
                  title={isListening ? 'Stop recording' : 'Click to speak via Microphone'}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
              )}

              {/* Text Input */}
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  isListening
                    ? 'Listening... say what you enjoy or what you dislike...'
                    : 'Type or click the mic to speak...'
                }
                disabled={loading}
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all placeholder:text-slate-400"
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={loading || !inputText.trim()}
                className="p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold transition-all disabled:opacity-40 shrink-0 shadow-sm"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Conclusion / Diagnosis Results Screen */
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
          {/* Summary Box */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Diagnosis Complete
            </div>
            <h2 className="text-2xl font-black text-slate-900">Your Personality & Career Matches</h2>
            <p className="text-sm text-slate-600 max-w-xl mx-auto mt-2 leading-relaxed">
              {conclusion.summary}
            </p>

            <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 text-xs font-extrabold tracking-wider">
              Holland RIASEC Profile: {conclusion.riasec_code}
            </div>
          </div>

          {/* Top Recommended Career Cards */}
          <div className="space-y-4">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              Top Recommended Career Paths
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {conclusion.matches.map((c, idx) => (
                <div
                  key={c.slug}
                  className="bg-white rounded-2xl border border-slate-200/90 p-5 hover:border-purple-300 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-700">
                        {c.field}
                      </span>
                      <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {c.fit}% Match
                      </span>
                    </div>

                    <h4 className="text-base font-black text-slate-900 mb-1">
                      {idx + 1}. {c.title}
                    </h4>

                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      {c.reason}
                    </p>

                    {c.salary_india && (
                      <div className="mt-3.5 p-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-500 flex items-center gap-1 text-[11px] font-medium">
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                          Mid-Level (India):
                        </span>
                        <span className="font-bold text-slate-800 text-[11px]">
                          {c.salary_india.mid || '₹10 - ₹18 LPA'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <Link
                      to={`/careers/${c.slug}`}
                      className="w-full py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5"
                    >
                      Explore Career & Roadmap <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => {
                if (onRestartAssessment) {
                  onRestartAssessment();
                } else {
                  setConclusion(null);
                  setMessages([
                    {
                      id: Date.now().toString(),
                      role: 'assistant',
                      text: getInitialMessage(),
                    },
                  ]);
                }
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-4 py-2.5 rounded-xl transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Start New Session
            </button>

            <Link
              to="/careers"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-800 bg-purple-50 px-4 py-2.5 rounded-xl transition-colors"
            >
              <Compass className="w-4 h-4" /> Browse Full 1,000+ Career Catalog
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
