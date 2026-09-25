'use client';

import { useEffect, useState, useRef } from 'react';
import { IngestedArticle } from '@/lib/news';
import { SynthesizedNugget } from '@/lib/ai';
import {
  isArticleBookmarked,
  saveArticle,
  removeArticle,
  getBookmarkedArticles
} from '@/lib/bookmarks';
import {
  X,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Compass,
  CheckCircle2,
  Clock,
  BookOpen,
  Activity,
  Flame,
  Bookmark
} from 'lucide-react';

interface NuggetReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: IngestedArticle | null;
  userId?: string;
  onReadingComplete?: (newTotalXp?: number, newStreak?: number) => void;
  onBookmarkChange?: () => void;
}

const REQUIRED_READ_SECONDS = 10;

export default function NuggetReaderModal({
  isOpen,
  onClose,
  article,
  userId,
  onReadingComplete,
  onBookmarkChange,
}: NuggetReaderModalProps) {
  const [nugget, setNugget] = useState<SynthesizedNugget | null>(null);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [secondsRead, setSecondsRead] = useState(0);
  const [scrollDepth, setScrollDepth] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Check initial bookmark status
  useEffect(() => {
    if (!article) return;
    async function checkSaved() {
      if (!article) return;
      const allBookmarks = await getBookmarkedArticles(userId);
      setBookmarked(isArticleBookmarked(article.url, allBookmarks));
    }
    checkSaved();
  }, [article, userId]);

  // Active reading timer
  useEffect(() => {
    if (!isOpen || !article) {
      return;
    }

    const timer = setInterval(() => {
      setSecondsRead((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, article]);

  // Synthesis loader
  useEffect(() => {
    if (!isOpen || !article) return;

    let isMounted = true;
    async function synthesize() {
      setLoading(true);
      try {
        const res = await fetch('/api/synthesize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(article),
        });
        const data = await res.json();
        if (isMounted && data.success && data.nugget) {
          setNugget(data.nugget);
        }
      } catch (err: unknown) {
        console.error('Failed to synthesize nugget:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    synthesize();

    return () => {
      isMounted = false;
    };
  }, [isOpen, article]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const progress = Math.min(100, Math.round(((scrollTop + clientHeight) / scrollHeight) * 100));
      setScrollDepth(progress);
    }
  };

  const handleClose = () => {
    setNugget(null);
    setCompleted(false);
    setSecondsRead(0);
    setScrollDepth(0);
    onClose();
  };

  const toggleBookmark = async () => {
    if (!article) return;
    if (bookmarked) {
      await removeArticle(article.url, userId);
      setBookmarked(false);
    } else {
      await saveArticle(article, userId);
      setBookmarked(true);
    }
    if (onBookmarkChange) onBookmarkChange();
  };

  const isReadingVerified = secondsRead >= REQUIRED_READ_SECONDS;
  const progressPercent = Math.min(100, Math.round((secondsRead / REQUIRED_READ_SECONDS) * 100));

  const handleVerifyReading = async () => {
    if (!isReadingVerified || completed || verifying) return;

    setVerifying(true);
    try {
      if (userId) {
        const res = await fetch('/api/reading/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            category: nugget?.category,
            durationSeconds: secondsRead,
          }),
        });

        const data = await res.json();
        if (data.success) {
          setCompleted(true);
          if (onReadingComplete) {
            onReadingComplete(data.newTotalXp, data.newStreak);
          }
        }
      } else {
        setCompleted(true);
        if (onReadingComplete) {
          onReadingComplete();
        }
      }
    } catch (err: unknown) {
      console.error('Reading verification error:', err);
    } finally {
      setVerifying(false);
    }
  };

  if (!isOpen || !article) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-stone-200 dark:border-[#1A3F75] bg-[#FAF7F2] dark:bg-[#0A1333] shadow-2xl graph-paper-bg my-8 overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-[#1A3F75] px-5 py-3 bg-[#F3EDE2]/80 dark:bg-[#00002A]/90">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-stone-700 dark:text-[#D4E4EC] flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              Nugget Intelligence
            </span>
            <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded uppercase">
              Telemetry Active
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={toggleBookmark}
              title={bookmarked ? 'Remove bookmark' : 'Bookmark nugget'}
              className="rounded-lg p-1.5 text-stone-500 dark:text-[#8BA3C7] hover:bg-stone-200/60 dark:hover:bg-[#13264D] hover:text-stone-900 dark:hover:text-white transition"
            >
              <Bookmark className={`h-4 w-4 ${bookmarked ? 'fill-amber-500 text-amber-500' : ''}`} />
            </button>
            <button
              onClick={handleClose}
              className="rounded-lg p-1.5 text-stone-500 dark:text-[#8BA3C7] hover:bg-stone-200/60 dark:hover:bg-[#13264D] hover:text-stone-900 dark:hover:text-white transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Live Reading Telemetry HUD Bar */}
        <div className="border-b border-stone-200 dark:border-[#1A3F75] bg-[#F3EDE2]/50 dark:bg-[#13264D]/60 px-5 py-2 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-stone-700 dark:text-[#D4E4EC]">
              <Activity className={`h-3.5 w-3.5 ${!isReadingVerified ? 'animate-pulse text-amber-600' : 'text-emerald-500'}`} />
              Dwell: {secondsRead}s / {REQUIRED_READ_SECONDS}s
            </span>
            <span className="text-stone-300 dark:text-[#1A3F75]">|</span>
            <span className="text-stone-600 dark:text-[#8BA3C7]">Scroll: {scrollDepth}%</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-1.5 w-24 bg-stone-200 dark:bg-[#1A3F75] rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isReadingVerified ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[10px] uppercase font-bold text-stone-700 dark:text-[#D4E4EC]">
              {isReadingVerified ? 'Verified' : `${REQUIRED_READ_SECONDS - secondsRead}s remaining`}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="p-6 sm:p-8 space-y-6 max-h-[70vh] overflow-y-auto"
        >
          {loading ? (
            <div className="py-16 text-center space-y-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 text-white animate-bounce shadow-md shadow-amber-200">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="font-mono text-xs text-stone-700 dark:text-[#D4E4EC] uppercase tracking-widest animate-pulse">
                Synthesizing multi-source brief...
              </div>
              <p className="text-xs text-stone-500 dark:text-[#8BA3C7] max-w-sm mx-auto font-sans">
                Deconstructing article, verifying claims across sources, and isolating key takeaways.
              </p>
            </div>
          ) : nugget ? (
            <>
              {/* Meta pills */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 dark:border-[#1A3F75] pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider rounded border border-stone-200 dark:border-[#1A3F75] bg-stone-100 dark:bg-[#13264D] px-2 py-0.5 text-stone-800 dark:text-[#D4E4EC]">
                    {nugget.category}
                  </span>
                  <span className="font-mono text-[11px] text-stone-500 dark:text-[#8BA3C7]">
                    Via {nugget.originalSource.name}
                  </span>
                </div>

                <div className="flex items-center gap-1 font-mono text-[10px] text-stone-500 dark:text-[#8BA3C7]">
                  <Clock className="h-3 w-3" />
                  <span>~{nugget.readTimeMinutes} min read</span>
                </div>
              </div>

              {/* Title */}
              <h2 className="font-sans text-xl sm:text-2xl font-bold text-stone-900 dark:text-[#D4E4EC] leading-snug">
                {nugget.headline}
              </h2>

              {/* Section 1: Golden Core Insight */}
              <div className="rounded-xl border border-amber-300 dark:border-amber-500/40 bg-amber-50/70 dark:bg-amber-950/30 p-4 sm:p-5 relative shadow-2xs">
                <div className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-2">
                  <Sparkles className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Core Insight</span>
                </div>
                <p className="text-sm font-medium text-stone-900 dark:text-[#D4E4EC] leading-relaxed font-sans">
                  {nugget.coreInsight}
                </p>
              </div>

              {/* Section 2: Historical / Structural Context */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-[#8BA3C7]">
                  <BookOpen className="h-3.5 w-3.5 text-stone-700 dark:text-stone-300" />
                  <span>Context & Implications</span>
                </div>
                <p className="text-xs sm:text-sm text-stone-700 dark:text-[#8BA3C7] leading-relaxed font-sans">
                  {nugget.context}
                </p>
              </div>

              {/* Section 3: Verified Claims */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-[#8BA3C7]">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Multi-Source Verified Claims</span>
                </div>

                <div className="space-y-2">
                  {nugget.verifiedClaims.map((claim, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-stone-200 dark:border-[#1A3F75] bg-white dark:bg-[#13264D]/50 p-3.5 shadow-2xs flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-stone-800 dark:text-[#D4E4EC] font-sans">
                          {claim.statement}
                        </p>
                        <span className="font-mono text-[10px] text-stone-400 dark:text-[#8BA3C7] block">
                          Attribution: {claim.verificationSource}
                        </span>
                      </div>

                      <span className="shrink-0 font-mono text-[9px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded uppercase">
                        {claim.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 4: Curiosity Spark (Zero Quiz Anxiety) */}
              <div className="rounded-xl border border-stone-200 dark:border-[#1A3F75] bg-stone-50 dark:bg-[#13264D]/30 p-4 space-y-1.5">
                <div className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-[#D4E4EC]">
                  <Compass className="h-3.5 w-3.5 text-stone-800 dark:text-stone-300" />
                  <span>Curiosity Thread & Reflection</span>
                </div>
                <p className="text-xs text-stone-700 dark:text-[#D4E4EC] leading-relaxed font-sans italic">
                  &ldquo;{nugget.curiositySpark}&rdquo;
                </p>
              </div>

              {/* Footer Actions */}
              <div className="pt-4 border-t border-stone-200 dark:border-[#1A3F75] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <a
                    href={nugget.originalSource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-mono text-xs text-stone-600 dark:text-[#8BA3C7] hover:text-stone-900 dark:hover:text-white underline"
                  >
                    <span>Original Source</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>

                  <button
                    onClick={toggleBookmark}
                    className="inline-flex items-center gap-1 font-mono text-xs text-stone-600 dark:text-[#8BA3C7] hover:text-stone-900 dark:hover:text-white transition"
                  >
                    <Bookmark className={`h-3 w-3 ${bookmarked ? 'fill-amber-500 text-amber-500' : ''}`} />
                    <span>{bookmarked ? 'Saved' : 'Save Nugget'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {completed ? (
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-2 font-mono text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <Sparkles className="h-3.5 w-3.5 text-amber-500 fill-amber-500/20" />
                      <span>Reading Verified (+10 XP)</span>
                    </span>
                  ) : isReadingVerified ? (
                    <button
                      onClick={handleVerifyReading}
                      disabled={verifying}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-stone-900 dark:border-[#3B628A] bg-stone-900 dark:bg-[#1A3F75] px-4 py-2 font-mono text-xs font-bold text-white shadow-md hover:bg-stone-800 dark:hover:bg-[#13264D] transition uppercase tracking-wider"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                      <span>{verifying ? 'Recording...' : 'Claim Verified Read (+10 XP)'}</span>
                    </button>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 dark:border-[#1A3F75] bg-stone-100 dark:bg-[#13264D] px-3.5 py-2 font-mono text-xs font-semibold text-stone-500 dark:text-[#8BA3C7] cursor-not-allowed">
                      <Clock className="h-3.5 w-3.5 animate-spin text-amber-600 dark:text-amber-400" />
                      <span>Verifying Read ({REQUIRED_READ_SECONDS - secondsRead}s)</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-xs text-stone-500 dark:text-[#8BA3C7] font-mono">
              Unable to parse article dispatch.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
