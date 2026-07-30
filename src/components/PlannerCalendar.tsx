/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { StudyTask, SpacedRevision } from '../types';
import { 
  Calendar, Clock, AlertTriangle, CheckCircle2, Circle, 
  Plus, CalendarPlus2, Timer, Play, Pause, RotateCcw, 
  Sparkles, Check, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { soundEffects } from '../utils/audio';

interface PlannerCalendarProps {
  tasks: StudyTask[];
  onAddTask: (task: StudyTask) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onGenerateRevisions: (title: string, subject: string) => void;
  onAwardXp: (xp: number, message: string) => void;
}

export default function PlannerCalendar({ 
  tasks, onAddTask, onToggleTask, onDeleteTask, onGenerateRevisions, onAwardXp 
}: PlannerCalendarProps) {
  
  // Tasks input state
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [date, setDate] = useState('2026-06-05');
  const [time, setTime] = useState('10:00');
  const [duration, setDuration] = useState(30);
  const [priority, setPriority] = useState<'baixa' | 'media' | 'alta'>('media');
  const [notes, setNotes] = useState('');

  // Generated feedback indicator
  const [generatedLogs, setGeneratedLogs] = useState<string | null>(null);

  // Filter tasks for selected date (default 2026-06-05 and onwards)
  const [selectedFilterDate, setSelectedFilterDate] = useState('2026-06-05');

  // Pomodoro Focus Timer State
  const [pomoTime, setPomoTime] = useState(25 * 60); // 25 mins in seconds
  const [pomoActive, setPomoActive] = useState(false);
  const [pomoMode, setPomoMode] = useState<'estudo' | 'pausa'>('estudo');
  const [pomoTotalRounds, setPomoTotalRounds] = useState(0);

  // Auto-ticking Pomodoro
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (pomoActive && pomoTime > 0) {
      interval = setInterval(() => {
        setPomoTime(prev => prev - 1);
      }, 1000);
    } else if (pomoActive && pomoTime === 0) {
      handlePomoCycleComplete();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [pomoActive, pomoTime]);

  const handlePomoCycleComplete = () => {
    setPomoActive(false);
    if (pomoMode === 'estudo') {
      soundEffects.playLevelUp();
      const updatedRounds = pomoTotalRounds + 1;
      setPomoTotalRounds(updatedRounds);
      
      onAwardXp(50, 'Sessão de foco Pomodoro finalizada com perfeição! +50 XP!');
      setPomoMode('pausa');
      setPomoTime(5 * 60); // 5 mins break
    } else {
      soundEffects.playQuestComplete();
      setPomoMode('estudo');
      setPomoTime(25 * 60); // 25 mins study
    }
  };

  const startPomo = () => {
    soundEffects.playClick();
    setPomoActive(true);
  };

  const pausePomo = () => {
    soundEffects.playClick();
    setPomoActive(false);
  };

  const resetPomo = () => {
    soundEffects.playError();
    setPomoActive(false);
    setPomoMode('estudo');
    setPomoTime(25 * 60);
  };

  const formatPomoTime = () => {
    const min = Math.floor(pomoTime / 60);
    const sec = pomoTime % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // Create Task handle
  const handleAddNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !subject.trim()) {
      soundEffects.playError();
      alert('Por favor, informe o título e a matéria do estudo.');
      return;
    }

    const newTask: StudyTask = {
      id: 'task-' + Date.now(),
      title: title.trim(),
      subject: subject.trim(),
      date,
      time,
      duration: Number(duration),
      completed: false,
      priority,
      notes: notes.trim() || undefined
    };

    onAddTask(newTask);
    soundEffects.playQuestComplete();

    // Reset inputs
    setTitle('');
    setSubject('');
    setNotes('');

    onAwardXp(20, 'Atividades Acadêmicas organizadas! Planejador atualizado.');
  };

  // Dynamic automatic review schedule generator clicking
  const handleTriggerLembretes = (task: StudyTask) => {
    onGenerateRevisions(task.title, task.subject);
    soundEffects.playQuestComplete();
    
    setGeneratedLogs(task.id);
    setTimeout(() => setGeneratedLogs(null), 4000);
    
    // Reward for configuring active repetition
    onAwardXp(25, 'Repetição Espaçada Agendada automaticamente!');
  };

  const filteredTasksList = tasks.filter(t => t.date === selectedFilterDate);

  return (
    <div id="planner-calendar-parent" className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 bg-slate-50/50 min-h-screen">
      
      {/* LEFT COLUMN: Input form & scheduler */}
      <div className="lg:col-span-4 flex flex-col gap-4 select-none">
        
        {/* Task builder form */}
        <div id="planner-form-card" className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 mb-3.5">
            <CalendarPlus2 className="w-4 h-4 text-blue-600" />
            <h2 className="font-bold text-slate-800 text-sm tracking-tight">Agendar Sessão de Estudos</h2>
          </div>

          <form onSubmit={handleAddNewTask} className="flex flex-col gap-3">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">TÍTULO DO ESTUDO</label>
              <input
                id="task-title-input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex. Equações de Maxwell, Sistema Cardiovascular, etc."
                className="w-full text-xs border border-slate-200 focus:border-blue-500 rounded-md px-2.5 py-1.5 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">MATÉRIA</label>
                <input
                  id="task-subject-input"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ex: Física II"
                  className="w-full text-xs border border-slate-200 focus:border-blue-500 rounded-md px-2.5 py-1.5 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">ALERTA/PRIORIDADE</label>
                <select
                  id="task-priority-input"
                  value={priority}
                  onChange={(e: any) => setPriority(e.target.value)}
                  className="w-full text-xs border border-slate-200 focus:border-blue-500 rounded-md p-1.5 bg-white focus:outline-hidden"
                >
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-1">
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">DATA</label>
                <input
                  id="task-date-input"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-[11px] border border-slate-200 focus:border-blue-500 rounded-md p-1 bg-white focus:outline-hidden"
                />
              </div>

              <div className="col-span-1">
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">HORA</label>
                <input
                  id="task-time-input"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full text-[11px] border border-slate-200 focus:border-blue-500 rounded-md p-1 bg-white focus:outline-hidden"
                />
              </div>

              <div className="col-span-1">
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">MINUTOS</label>
                <input
                  id="task-duration-input"
                  type="number"
                  min="5"
                  max="300"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full text-[11px] border border-slate-200 focus:border-blue-500 rounded-md p-1 bg-white focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">CONCEITOS-CHAVE / NOTAS</label>
              <textarea
                id="task-notes-input"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex. Focar nas fórmulas de indução eletromagnética..."
                className="w-full text-xs border border-slate-200 focus:border-blue-500 rounded-md p-2 focus:outline-hidden resize-none"
              />
            </div>

            <button
              id="submit-study-task"
              type="submit"
              className="w-full mt-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Inserir Sessão Ativa</span>
            </button>
          </form>
        </div>

        {/* POMODORO CONTROLLER TIMER */}
        <div id="pomodoro-timer-card" className="bg-slate-900 text-white p-4 rounded-xl shadow-xs relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] opacity-5 pointer-events-none" />
          
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-blue-400" />
              <span className="font-bold text-xs uppercase tracking-wider text-slate-200">Cronômetro de Foco</span>
            </div>
            <div className={`text-[9px] px-2 py-0.5 rounded-md font-bold uppercase ${pomoMode === 'estudo' ? 'bg-amber-400 text-slate-950' : 'bg-emerald-400 text-slate-950'}`}>
              {pomoMode === 'estudo' ? 'Estudar' : 'Pausar'}
            </div>
          </div>

          <div className="flex flex-col items-center justify-center py-2">
            <motion.div 
              animate={{ scale: pomoActive ? [1, 1.02, 1] : 1 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="text-3xl font-mono font-bold tracking-tight text-amber-400"
            >
              {formatPomoTime()}
            </motion.div>

            <div className="flex items-center gap-2 mt-4">
              {!pomoActive ? (
                <button
                  id="pomo-play"
                  onClick={startPomo}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white text-white" />
                  <span>Focar</span>
                </button>
              ) : (
                <button
                  id="pomo-pause"
                  onClick={pausePomo}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Pause className="w-3.5 h-3.5 text-white" />
                  <span>Pausar</span>
                </button>
              )}

              <button
                id="pomo-reset"
                onClick={resetPomo}
                className="p-1.5 border border-slate-700 hover:border-slate-600 rounded-md text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="border-t border-slate-800/80 pt-2.5 mt-3 flex justify-between items-center text-[10px] text-slate-400">
            <span>Sessões finalizadas:</span>
            <span className="font-bold text-amber-400 font-mono">{pomoTotalRounds} ciclos</span>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Interactive timeline organizer */}
      <div className="lg:col-span-8 flex flex-col gap-3">
        
        {/* Day selector tabs */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between flex-wrap gap-4 select-none">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="font-bold text-slate-700 text-xs uppercase tracking-wider">Resumo do Cronograma</span>
          </div>

          <div className="flex gap-1">
            {['2026-06-05', '2026-06-06', '2026-06-07'].map(dString => {
              const formatted = dString === '2026-06-05' ? 'Hoje' : dString === '2026-06-06' ? 'Amanhã' : 'Domingo';
              const isSelected = selectedFilterDate === dString;
              return (
                <button
                  key={dString}
                  id={`btn-date-${dString}`}
                  onClick={() => { setSelectedFilterDate(dString); soundEffects.playClick(); }}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    isSelected ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {formatted}
                </button>
              );
            })}
          </div>
        </div>

        {/* Task lists timeline cards */}
        <div className="flex-1 flex flex-col gap-3">
          {filteredTasksList.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                <Check className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Nada agendado para esta data!</h3>
                <p className="text-[11px] text-slate-400 mt-0.5 max-w-sm">Use o planejador lateral para agendar novos horários e disciplinas escolares.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {filteredTasksList.map((task) => {
                const priorityClasses = {
                  baixa: 'border-l-4 border-l-slate-300 bg-slate-50/20',
                  media: 'border-l-4 border-l-blue-500 bg-blue-50/5',
                  alta: 'border-l-4 border-l-red-500 bg-red-50/5'
                };

                return (
                  <motion.div
                    key={task.id}
                    id={`task-item-${task.id}`}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`bg-white p-3 pr-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all hover:shadow-1xs ${priorityClasses[task.priority]}`}
                  >
                    {/* Tick Checkbox and title */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <button
                        id={`btn-task-chk-${task.id}`}
                        onClick={() => { onToggleTask(task.id); soundEffects.playClick(); }}
                        className="text-slate-400 hover:text-slate-800 transition-colors mt-0.5 cursor-pointer shrink-0"
                      >
                        {task.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-50" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-300 hover:border-slate-500" />
                        )}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-bold leading-tight ${task.completed ? 'line-through text-slate-400 font-normal' : 'text-slate-800'}`}>
                            {task.title}
                          </span>
                          <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-extrabold uppercase tracking-wider ${
                            task.priority === 'alta' ? 'bg-red-50 text-red-600 border border-red-100' : task.priority === 'media' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-slate-50 text-slate-500 border border-slate-100'
                          }`}>
                            {task.priority}
                          </span>
                        </div>

                        {/* Badges Info */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[10px] text-slate-400">
                          <span className="font-bold text-slate-500">
                            📚 {task.subject}
                          </span>
                          <span className="flex items-center gap-0.5 font-mono">
                            <Clock className="w-3 h-3 text-slate-300" />
                            {task.time} ({task.duration} min)
                          </span>
                        </div>

                        {task.notes && (
                          <p className={`text-[11px] mt-1.5 italic px-2 py-1 bg-slate-50 border-l border-slate-250 ${task.completed ? 'text-slate-400 bg-slate-100/20' : 'text-slate-500 font-normal'}`}>
                            {task.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Automation Generator triggers */}
                    <div className="flex sm:flex-col items-end gap-1.5 shrink-0 justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                      {/* Active Recall Reminder Spaced scheduler button */}
                      <button
                        id={`btn-gen-rev-${task.id}`}
                        disabled={task.completed}
                        onClick={() => handleTriggerLembretes(task)}
                        className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-md border transition-all cursor-pointer ${
                          generatedLogs === task.id
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-blue-600 text-white hover:bg-blue-700 hover:border-blue-700 border-transparent disabled:opacity-40'
                        }`}
                      >
                        {generatedLogs === task.id ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Agendado!</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3 fill-white" />
                            <span>Agendar Revisão</span>
                          </>
                        )}
                      </button>

                      <button
                        id={`btn-task-del-${task.id}`}
                        onClick={() => { onDeleteTask(task.id); soundEffects.playError(); }}
                        className="text-[10px] text-slate-400 hover:text-red-500 px-1 py-0.5 rounded-md transition-all font-bold uppercase"
                      >
                        Remover
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Explain Card */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-start gap-3 select-none">
          <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed text-slate-500">
            <h4 className="font-bold text-slate-800 mb-0.5">Como funcionam os Lembretes de Revisão Espaçada?</h4>
            <p>
              Ao agendar, o algoritmo Anki/SM-2 cria instâncias de fixação na aba de <strong>Flashcards</strong>. O tempo entre as revisões aumenta organicamente conforme você acerta!
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
