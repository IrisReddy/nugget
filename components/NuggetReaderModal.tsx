'use client';

import { useEffect, useState } from 'react';
import { IngestedArticle } from '@/lib/news';
import { SynthesizedNugget } from '@/lib/ai';
import {
  X,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Compass,
  CheckCircle2,
  Clock,
  Terminal,
  BookOpen
} from 'lucide-react';

interface NuggetReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: IngestedArticle | null;
  onReadingComplete?: (nuggetId: string) => void;
}

export default function NuggetReaderModal({
  isOpen,
  onClose,
  article,
  onReadingComplete,
}: NuggetReaderModalProps) {
  const [nugget, setNugget] = useState<SynthesizedNugget | null>(null);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

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

  const handleClose = () => {
    setNugget(null);
    setCompleted(false);
    onClose();
  };

  if (!isOpen || !article) return null;

  const handleComplete = () => {
    setCompleted(true);
    if (nugget && onReadingComplete) {
      onReadingComplete(nugget.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-stone-300 bg-white/98 shadow-2xl graph-paper-bg my-8 overflow-hidden">
        {/* Dossier Header Bar */}
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-3 bg-stone-50/90">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-stone-600 flex items-center gap-1.5">
              <Terminal className="h-3 w-3 text-stone-800" />
              NUGGET_INTELLIGENCE // SYNTHESIS_DOSSIER
            </span>
            <span className="font-mono text-[10px] text-emerald-700 border border-emerald-300 bg-emerald-50 px-1.5 py-0.2 rounded uppercase">
              STEP 07: AI_SYNTHESIZED
            </span>
          </div>

          <button
            onClick={handleClose}
            className="rounded p-1 text-stone-400 hover:bg-stone-200 hover:text-stone-700 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[80vh] overflow-y-auto">
          {loading ? (
            <div className="py-16 text-center space-y-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 text-white animate-bounce shadow-md shadow-amber-200">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="font-mono text-xs text-stone-600 uppercase tracking-widest animate-pulse">
                [SYNTHESIZING_BRIEF: EXTRACTING_FACTUAL_CLAIMS...]
              </div>
              <p className="text-xs text-stone-400 max-w-sm mx-auto font-sans">
                Deconstructing article, verifying multi-source claims, and eliminating fluff.
              </p>
            </div>
          ) : nugget ? (
            <>
              {/* Meta pills */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider rounded border border-stone-200 bg-stone-100 px-2 py-0.5 text-stone-800">
                    [{nugget.category}]
                  </span>
                  <span className="font-mono text-[11px] text-stone-500">
                    VIA {nugget.originalSource.name}
                  </span>
                </div>

                <div className="flex items-center gap-1 font-mono text-[10px] text-stone-400">
                  <Clock className="h-3 w-3" />
                  <span>~{nugget.readTimeMinutes} MIN READ</span>
                </div>
              </div>

              {/* Title */}
              <h2 className="font-sans text-xl sm:text-2xl font-bold text-stone-900 leading-snug">
                {nugget.headline}
              </h2>

              {/* Section 1: Golden Core Insight */}
              <div className="rounded-xl border border-amber-300 bg-amber-50/70 p-4 sm:p-5 relative shadow-2xs">
                <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-800 mb-2">
                  <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                  <span>THE_GOLDEN_NUGGET // CORE_INSIGHT</span>
                </div>
                <p className="text-sm font-medium text-stone-900 leading-relaxed font-sans">
                  {nugget.coreInsight}
                </p>
              </div>

              {/* Section 2: Historical / Structural Context */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  <BookOpen className="h-3.5 w-3.5 text-stone-700" />
                  <span>CONTEXT & IMPLICATIONS</span>
                </div>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-sans">
                  {nugget.context}
                </p>
              </div>

              {/* Section 3: Verified Claims */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span>MULTI_SOURCE_VERIFIED_CLAIMS</span>
                </div>

                <div className="space-y-2">
                  {nugget.verifiedClaims.map((claim, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-stone-200 bg-white p-3 shadow-2xs flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-stone-800 font-sans">
                          {claim.statement}
                        </p>
                        <span className="font-mono text-[10px] text-stone-400 block">
                          ATTRIBUTION: {claim.verificationSource}
                        </span>
                      </div>

                      <span className="shrink-0 font-mono text-[9px] font-bold text-emerald-700 border border-emerald-300 bg-emerald-50 px-2 py-0.5 rounded uppercase">
                        [{claim.status}]
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 4: Curiosity Spark (Zero Quiz Anxiety) */}
              <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 space-y-1.5">
                <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-stone-600">
                  <Compass className="h-3.5 w-3.5 text-stone-800" />
                  <span>CURIOSITY_THREAD // REFLECTION</span>
                </div>
                <p className="text-xs text-stone-700 leading-relaxed font-sans italic">
                  &ldquo;{nugget.curiositySpark}&rdquo;
                </p>
              </div>

              {/* Footer Actions */}
              <div className="pt-4 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <a
                  href={nugget.originalSource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-mono text-xs text-stone-600 hover:text-stone-900 underline"
                >
                  <span>SOURCE_DOCUMENT</span>
                  <ExternalLink className="h-3 w-3" />
                </a>

                <div className="flex items-center gap-2">
                  {completed ? (
                    <span className="inline-flex items-center gap-1.5 rounded border border-emerald-300 bg-emerald-50 px-4 py-2 font-mono text-xs font-bold text-emerald-800">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>READING_VERIFIED (+10 XP)</span>
                    </span>
                  ) : (
                    <button
                      onClick={handleComplete}
                      className="inline-flex items-center gap-1.5 rounded border border-stone-900 bg-stone-900 px-4 py-2 font-mono text-xs font-bold text-white shadow-2xs hover:bg-stone-800 transition uppercase tracking-wider"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>MARK_READ (+10 XP)</span>
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-xs text-stone-500 font-mono">
              [SYNTHESIS_FAILED: UNABLE_TO_PARSE_DISPATCH]
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
