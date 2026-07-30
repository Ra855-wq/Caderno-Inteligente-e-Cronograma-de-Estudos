/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Notebook, StudyTask, SpacedRevision, Quest } from '../types';
import { 
  BookOpen, Plus, Sparkles, Target, CalendarClock, BrainCircuit,
  ChevronRight, CircleSlash, ArrowUpRight 
} from 'lucide-react';
import { motion } from 'motion/react';
import { soundEffects } from '../utils/audio';

interface DashboardOverviewProps {
  notebooks: Notebook[];
  tasks: StudyTask[];
  revisions: SpacedRevision[];
  quests: Quest[];
  userEmail: string;
  onSelectNotebook: (id: string) => void;
  onNavigateTab: (tab: string) => void;
  onAddNewNotebook: () => void;
}

export default function DashboardOverview({
  notebooks, tasks, revisions, quests, userEmail, onSelectNotebook, onNavigateTab, onAddNewNotebook
}: DashboardOverviewProps) {

  const dueCardsCount = revisions.filter(rev => rev.nextReviewDate <= '2026-06-05').length;
  const pendingTasksCount = tasks.filter(t => t.date === '2026-06-05' && !t.completed).length;

  const handleSelectNb = (id: string) => {
    soundEffects.playClick();
    onSelectNotebook(id);
    onNavigateTab('notebook');
  };

  return (
    <div id="dashboard-overview-main" className="p-4 bg-slate-50/50 flex flex-col gap-4 select-none">
      
      {/* High Density Hero Header Banner */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Decorative Grid Pattern matching OmniStudy PRO digital canvas style */}
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />
        
        <div className="relative z-10 flex-1">
          <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-blue-600 tracking-wider">
            <Sparkles className="w-3.5 h-3.5 fill-blue-100" />
            <span>Premium Academic Suite</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight mt-1.5">
            Bons estudos, <span className="text-blue-600">{userEmail.split('@')[0]}</span>!
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed font-normal">
            Caderno digital de caneta inteligente com revisões programadas por algoritmo Anki (SM2). Apoie sua caneta inteligente ou use mouse/touch para rascunhar!
          </p>
        </div>

        <button
          id="btn-quick-new-notebook"
          onClick={onAddNewNotebook}
          className="relative z-10 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5 self-start sm:self-center shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Nova Matéria Binder</span>
        </button>
      </div>

      {/* Grid of central active sections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* PHYSICAL NOTEBOOK SHELF BINDERS (8 COLUMNS) */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
              <span>Painel de Cadernos PRO</span>
            </h3>
            <span className="text-[10px] font-bold text-slate-400 font-mono">{notebooks.length} matérias</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {notebooks.map(nb => {
              const bgColors = {
                slate: 'bg-slate-700 text-slate-100 border-slate-800',
                emerald: 'bg-emerald-700 text-emerald-100 border-emerald-800',
                indigo: 'bg-indigo-700 text-indigo-100 border-indigo-800',
                rose: 'bg-rose-700 text-rose-100 border-rose-800',
                amber: 'bg-amber-600 text-amber-100 border-amber-700',
                fuchsia: 'bg-fuchsia-700 text-fuchsia-100 border-fuchsia-800'
              };

              const currentBg = bgColors[nb.coverColor as keyof typeof bgColors] || bgColors.slate;

              return (
                <div 
                  key={nb.id}
                  id={`shelf-nb-${nb.id}`}
                  onClick={() => handleSelectNb(nb.id)}
                  className="bg-white p-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-xs cursor-pointer transition-all flex gap-3.5 items-center"
                >
                  {/* Notebook Graphic Cover spine layout - high density layout */}
                  <div className={`w-10 h-14 ${currentBg} rounded-lg shadow-sm flex flex-col justify-between p-1.5 shrink-0 border-l-[4px] border-l-slate-950/20 relative overflow-hidden`}>
                    <div className="text-right text-[8px] opacity-75 font-semibold font-serif leading-none">NB</div>
                    <div className="text-xs">📚</div>
                  </div>

                  {/* Informational right panel */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-800 text-sm leading-tight truncate">
                      {nb.title}
                    </h4>
                    <span className="text-[10px] font-bold text-slate-400 mt-1 block">{nb.pages.length} folhas anotadas</span>
                    <div className="flex items-center gap-1 mt-1.5 text-[10px] uppercase font-bold text-blue-600 font-mono">
                      <span>Rascunhar</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* STUDY HUBS AGGREGATES SUMMARY (4 COLUMNS) */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider px-1">Atividades & Foco</h3>
          
          <div className="bg-white rounded-xl p-3 border border-slate-200 flex flex-col gap-2.5">
            
            {/* Planner summary */}
            <div 
              onClick={() => { soundEffects.playClick(); onNavigateTab('planner'); }}
              className="p-2.5 bg-blue-50/50 border border-blue-100 hover:border-blue-200 hover:bg-blue-50 transition-all rounded-lg cursor-pointer flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center text-blue-700 text-sm shrink-0 font-bold">
                  📅
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Agenda Semanal</h4>
                  {pendingTasksCount > 0 ? (
                    <span className="text-[10px] text-blue-600 font-bold">{pendingTasksCount} tarefas para hoje</span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-medium">Tudo planejado!</span>
                  )}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </div>

            {/* Flashcards summary */}
            <div 
              onClick={() => { soundEffects.playClick(); onNavigateTab('revisions'); }}
              className="p-2.5 bg-teal-50/50 border border-teal-100 hover:border-teal-200 hover:bg-teal-50 transition-all rounded-lg cursor-pointer flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded bg-teal-100 flex items-center justify-center text-teal-700 text-sm shrink-0 font-bold">
                  🧠
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Flashcards Devidos</h4>
                  {dueCardsCount > 0 ? (
                    <span className="text-[10px] text-teal-600 font-bold">{dueCardsCount} revisões pendentes</span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-medium">Memória em dia!</span>
                  )}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </div>

          </div>

          {/* Active Buffs/Quests in High Density layout */}
          <div className="bg-white border border-slate-200 p-3 rounded-xl flex flex-col gap-3">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <Target className="w-3.5 h-3.5 text-blue-600" />
              <span>Quests do Dia</span>
            </div>

            <div className="flex flex-col gap-2">
              {quests.slice(0, 2).map(q => {
                const complete = q.currentValue >= q.targetValue;
                return (
                  <div key={q.id} className="text-xs">
                    <div className="flex justify-between items-center text-slate-600 font-medium">
                      <span className="truncate pr-2">{q.title}</span>
                      <span className="font-mono text-[9px] text-slate-500 font-bold shrink-0">{q.currentValue}/{q.targetValue}</span>
                    </div>
                    <div className="w-full h-1 bg-slate-150 rounded-full mt-1 overflow-hidden">
                      <div className={`h-full ${complete ? 'bg-emerald-500' : 'bg-blue-600'}`} style={{ width: `${Math.min(100, (q.currentValue/q.targetValue)*100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              id="btn-goto-gamification"
              onClick={() => { soundEffects.playClick(); onNavigateTab('store'); }}
              className="w-full text-center text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline pt-1 flex items-center justify-center gap-0.5"
            >
              <span>Ver Recompensas & Conquistas</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
