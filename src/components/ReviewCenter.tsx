/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState } from 'react';
import { SpacedRevision } from '../types';
import { 
  BrainCircuit, Calendar, CheckSquare, Sparkles, HelpCircle, 
  ChevronRight, ArrowRight, Play, CheckCircle2, RefreshCw 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { soundEffects } from '../utils/audio';

interface ReviewCenterProps {
  revisions: SpacedRevision[];
  onReviewCard: (id: string, quality: number, nextDue: string, interval: number, ease: number, reps: number) => void;
  onAwardXp: (xp: number, message: string) => void;
}

export default function ReviewCenter({ revisions, onReviewCard, onAwardXp }: ReviewCenterProps) {
  const [activeReviewCard, setActiveReviewCard] = useState<SpacedRevision | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  // Divide revisions into due (today or past due) versus future planned
  const todayStr = '2026-06-05'; // anchor date
  
  const dueRevisions = revisions.filter(rev => rev.nextReviewDate <= todayStr);
  const futureRevisions = revisions.filter(rev => rev.nextReviewDate > todayStr);

  const startReviewing = (card: SpacedRevision) => {
    soundEffects.playClick();
    setActiveReviewCard(card);
    setShowAnswer(false);
  };

  // SM-2 Spaced Repetition algorithm calculation engine
  const submitReviewScore = (quality: number) => {
    if (!activeReviewCard) return;

    let reps = activeReviewCard.repetitions;
    let ease = activeReviewCard.easeFactor;
    let interval = activeReviewCard.intervalDays;

    if (quality < 3) {
      // Failed / Re-learn
      reps = 0;
      interval = 1;
    } else {
      // Success
      if (reps === 0) {
        interval = 1;
      } else if (reps === 1) {
        interval = 4; // 4 days offset
      } else {
        interval = Math.ceil(interval * ease);
      }
      reps += 1;
    }

    // Update Ease Factor
    ease = ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (ease < 1.3) ease = 1.3;

    // Calculate next due date offsets
    const nextDateObj = new Date('2026-06-05');
    nextDateObj.setDate(nextDateObj.getDate() + interval);
    const nextDueString = nextDateObj.toISOString().split('T')[0];

    // Trigger update up to state
    onReviewCard(activeReviewCard.id, quality, nextDueString, interval, ease, reps);

    // Give visual-audio reward feedback
    if (quality >= 4) {
      soundEffects.playQuestComplete();
      onAwardXp(30, `Excelente memorização: ${activeReviewCard.title}! +30 XP`);
    } else {
      soundEffects.playClick();
      onAwardXp(15, `Revisão anotada! Retornará em breve para consolidar.`);
    }

    // Close deck overlay modal
    setActiveReviewCard(null);
  };

  return (
    <div id="spaced-repetition-center" className="p-4 bg-slate-50/50 min-h-screen select-none">
      
      {/* Intro info card row */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-sm tracking-tight">Fila de Memorização Periódica (Active Recall)</h2>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed max-w-2xl">
              Nossa engine utiliza o algoritmo de fixação cerebral <strong>SuperMemo-2 (SM-2)</strong>. O sistema agenda sessões específicas no momento ideal para evitar o esquecimento e consolidar o aprendizado de longo prazo.
            </p>
          </div>
        </div>

        {/* Counter summaries info badges */}
        <div className="flex gap-4 shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-6">
          <div className="text-left">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">DEVEM SER REVISADOS</div>
            <div className={`text-lg font-bold font-mono mt-0.5 ${dueRevisions.length > 0 ? 'text-blue-600' : 'text-slate-600'}`}>
              {dueRevisions.length} cards
            </div>
          </div>
          <div className="w-[1px] h-8 bg-slate-200" />
          <div className="text-left">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">PLANEJAMENTO FUTURO</div>
            <div className="text-lg font-bold text-slate-600 font-mono mt-0.5">
              {futureRevisions.length} cards
            </div>
          </div>
        </div>
      </div>

      {/* Main interface grids layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* DUE REVISIONS ACTIVE LIST (8 COLUMNS) */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider">⚡ Fila Ativa de Perguntas</h3>
            {dueRevisions.length > 0 && (
              <span className="text-[9px] font-extrabold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full uppercase">Pendente</span>
            )}
          </div>

          {dueRevisions.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-xl border border-slate-200 flex flex-col items-center justify-center gap-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 fill-emerald-50 stroke-[2]" />
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Sua memória está 100% calibrada!</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Você concluiu ou agendou todas as revisões periódicas recomendadas para o dia de hoje.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {dueRevisions.map(card => (
                <div 
                  key={card.id}
                  id={`due-card-${card.id}`}
                  className="bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-350 transition-all flex flex-col justify-between shadow-2xs relative overflow-hidden"
                >
                  <div>
                    <span className="text-[9px] bg-blue-50 text-blue-600 border border-blue-100 font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-md">
                      {card.subject}
                    </span>
                    <h4 className="font-bold text-slate-850 text-sm mt-2.5 tracking-tight">{card.title}</h4>
                    
                    <div className="flex gap-2 text-[10px] text-slate-400 font-mono mt-2 flex-wrap font-semibold">
                      <span>• Intervalo: {card.intervalDays}d</span>
                      <span>• Taxa: {card.easeFactor.toFixed(1)}x</span>
                      <span>• Repetições: {card.repetitions}</span>
                    </div>
                  </div>

                  <button
                    id={`btn-study-card-${card.id}`}
                    onClick={() => startReviewing(card)}
                    className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Play className="w-3 h-3 fill-white" />
                    <span>Auto-revisão Ativa</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* PLANNED FUTURE REVISIONS IN TIMELINE */}
          <div className="mt-2">
            <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-2.5 px-1">📅 Previsões de Fixação Espaçada</h3>
            
            {futureRevisions.length === 0 ? (
              <p className="text-xs text-slate-400 italic px-1">Nenhum lembrete futuro agendado no momento. Use o Cronograma para gerar cartões.</p>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-col divide-y divide-slate-100">
                {futureRevisions.map(card => {
                  const dObj = new Date(card.nextReviewDate);
                  const formattedDate = dObj.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });

                  return (
                    <div 
                      key={card.id}
                      className="py-2.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-350 shrink-0" />
                        <div className="min-w-0">
                          <h5 className="text-xs font-bold text-slate-700 truncate">{card.title}</h5>
                          <span className="text-[10px] font-bold text-slate-400">{card.subject}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 font-mono shrink-0">
                        <span className="text-[9px] text-slate-400">Em {card.intervalDays}d</span>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                          {formattedDate}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* GUIDES ABOUT REVIEWS (4 COLUMNS) */}
        <div className="lg:col-span-4 flex flex-col gap-4 select-none">
          <div className="bg-slate-900 text-slate-300 p-4 rounded-xl border border-slate-850 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] opacity-5 pointer-events-none" />
            <h4 className="font-bold text-xs tracking-wider uppercase mb-2.5 text-slate-200 flex items-center gap-1.5">
              <span>Metodologia Leitner / SM-2</span>
            </h4>
            
            <ol className="text-slate-400 text-xs flex flex-col gap-2.5 list-decimal pl-4">
              <li>
                <strong>Fórmula de Repetição:</strong> O intervalo aumenta exponencialmente caso a resposta seja avaliada positivamente.
              </li>
              <li>
                <strong>Punição por Falha:</strong> Se você errar, o card volta ao primeiro estágio (relearn de 1 dia) para reeducar as conexões sinápticas.
              </li>
              <li>
                <strong>Engajamento Triplo:</strong> Revisar os cards concede moedas bônus e o ajuda nas <strong>Daily Quests</strong> de engajamento!
              </li>
            </ol>
          </div>
        </div>

      </div>

      {/* ACTIVE CARD OVERLAY MODAL */}
      <AnimatePresence>
        {activeReviewCard && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-xl border border-slate-200 overflow-hidden shadow-xl"
            >
              {/* Card Header stats */}
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#ef4444] font-mono">FLASHCARD ATIVO</span>
                  <h3 className="font-bold text-slate-500 text-[10px] mt-0.5">Recuperação e Memorização Conectiva</h3>
                </div>
                <button
                  id="close-card-modal"
                  onClick={() => { setActiveReviewCard(null); soundEffects.playError(); }}
                  className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer font-sans"
                >
                  ✕
                </button>
              </div>

              {/* CARD MAIN BODY */}
              <div className="p-4 flex flex-col items-center justify-center text-center select-text min-h-[140px]">
                <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-100 font-extrabold px-2.5 py-0.5 rounded-md mb-2 uppercase tracking-wider">
                  {activeReviewCard.subject}
                </span>
                
                <h4 className="text-sm font-bold text-slate-800 leading-tight max-w-sm mb-3">
                  {activeReviewCard.title}
                </h4>

                {!showAnswer ? (
                  <button
                    id="btn-reveal-answer"
                    onClick={() => { setShowAnswer(true); soundEffects.playClick(); }}
                    className="mt-2 bg-slate-900 hover:bg-slate-850 text-white font-bold text-xs px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <span>Ver Resposta / Conceito</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="w-full mt-2 border-t border-slate-100 pt-3 animate-fade-in text-slate-500 text-xs select-text flex flex-col gap-2">
                    <p className="font-bold text-slate-705">Explicação / Pergunta Cognitiva:</p>
                    <p className="italic bg-slate-50 p-3 rounded-lg text-slate-600 leading-relaxed text-xs border border-slate-100">
                      Tente mentalmente auto-explicar os pontos-chave de <strong>{activeReviewCard.title}</strong> antes de se auto-avaliar abaixo. O treino do "Active Recall" constrói conexões sólidas!
                    </p>
                  </div>
                )}
              </div>

              {/* ACTION BUTTON CHECKS */}
              {showAnswer && (
                <div className="bg-slate-50 border-t border-slate-200 px-4 py-4 flex flex-col gap-2.5">
                  <div className="text-center">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Qual foi seu nível de facilidade para responder?</span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      id="quality-1"
                      onClick={() => submitReviewScore(1)}
                      className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-100 p-2 rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-0.5 cursor-pointer active:scale-95"
                    >
                      <span className="text-xs font-mono">Errei ❌</span>
                      <span className="text-[8px] text-red-500 font-normal leading-tight font-sans">Esqueci</span>
                    </button>

                    <button
                      id="quality-3"
                      onClick={() => submitReviewScore(3)}
                      className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-100 p-2 rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-0.5 cursor-pointer active:scale-95"
                    >
                      <span className="text-xs font-mono">Difícil ⚠️</span>
                      <span className="text-[8px] text-amber-500 font-normal leading-tight font-sans">Esforço</span>
                    </button>

                    <button
                      id="quality-4"
                      onClick={() => submitReviewScore(4)}
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 p-2 rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-0.5 cursor-pointer active:scale-95"
                    >
                      <span className="text-xs font-mono">Bom 👍</span>
                      <span className="text-[8px] text-emerald-500 font-normal leading-tight font-sans">Ideal</span>
                    </button>

                    <button
                      id="quality-5"
                      onClick={() => submitReviewScore(5)}
                      className="bg-blue-50 hover:bg-blue-200 text-blue-700 border border-blue-100 p-2 rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-0.5 cursor-pointer active:scale-95"
                    >
                      <span className="text-xs font-mono">Fácil ⭐</span>
                      <span className="text-[8px] text-blue-500 font-normal leading-tight font-sans">Dominado</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
