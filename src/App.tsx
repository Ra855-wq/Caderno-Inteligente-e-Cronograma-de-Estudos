/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Notebook, StudyTask, SpacedRevision, Quest, Achievement, UserProgress 
} from './types';
import { 
  DEFAULT_USER_PROGRESS, INITIAL_NOTEBOOKS, INITIAL_STUDY_TASKS, 
  INITIAL_REVISIONS, INITIAL_QUESTS, INITIAL_ACHIEVEMENTS 
} from './utils/initialState';
import { soundEffects } from './utils/audio';
import { 
  Compass, BookOpen, CalendarClock, BrainCircuit, Trophy, 
  Menu, X, Sparkles, CheckSquare, Settings, ArrowUpRight, Wand2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Modular imports
import HeaderStats from './components/HeaderStats';
import DashboardOverview from './components/DashboardOverview';
import NotebookCanvas from './components/NotebookCanvas';
import PlannerCalendar from './components/PlannerCalendar';
import ReviewCenter from './components/ReviewCenter';
import ShopStore from './components/ShopStore';
import StudyTools from './components/StudyTools';

export default function App() {
  
  // 1. Core State loaded from localStorage with rich initial fallback states
  const [userProgress, setUserProgress] = useState<UserProgress>(() => {
    const saved = localStorage.getItem('estuda_progress');
    return saved ? JSON.parse(saved) : DEFAULT_USER_PROGRESS;
  });

  const [notebooks, setNotebooks] = useState<Notebook[]>(() => {
    const saved = localStorage.getItem('estuda_notebooks');
    return saved ? JSON.parse(saved) : INITIAL_NOTEBOOKS;
  });

  const [studyTasks, setStudyTasks] = useState<StudyTask[]>(() => {
    const saved = localStorage.getItem('estuda_tasks');
    return saved ? JSON.parse(saved) : INITIAL_STUDY_TASKS;
  });

  const [revisions, setRevisions] = useState<SpacedRevision[]>(() => {
    const saved = localStorage.getItem('estuda_revisions');
    return saved ? JSON.parse(saved) : INITIAL_REVISIONS;
  });

  const [quests, setQuests] = useState<Quest[]>(() => {
    const saved = localStorage.getItem('estuda_quests');
    return saved ? JSON.parse(saved) : INITIAL_QUESTS;
  });

  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    const saved = localStorage.getItem('estuda_achievements');
    return saved ? JSON.parse(saved) : INITIAL_ACHIEVEMENTS;
  });

  const [activeNotebookId, setActiveNotebookId] = useState<string>(() => {
    const saved = localStorage.getItem('estuda_notebooks');
    const nbs = saved ? JSON.parse(saved) : INITIAL_NOTEBOOKS;
    return nbs[0]?.id || 'nb1';
  });

  // UI States
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeXpAlert, setActiveXpAlert] = useState<{ id: string; msg: string; amt: number } | null>(null);

  // User Email (from metadata context)
  const userEmail = "dr.rda.med@gmail.com";

  // 2. Persists blocks on update
  useEffect(() => {
    localStorage.setItem('estuda_progress', JSON.stringify(userProgress));
  }, [userProgress]);

  useEffect(() => {
    localStorage.setItem('estuda_notebooks', JSON.stringify(notebooks));
  }, [notebooks]);

  useEffect(() => {
    localStorage.setItem('estuda_tasks', JSON.stringify(studyTasks));
  }, [studyTasks]);

  useEffect(() => {
    localStorage.setItem('estuda_revisions', JSON.stringify(revisions));
  }, [revisions]);

  useEffect(() => {
    localStorage.setItem('estuda_quests', JSON.stringify(quests));
  }, [quests]);

  useEffect(() => {
    localStorage.setItem('estuda_achievements', JSON.stringify(achievements));
  }, [achievements]);


  // 3. Dynamic XP Reward & Level Up Engine
  const handleAwardXp = (amount: number, message: string) => {
    const alertId = 'alert-' + Date.now();
    setActiveXpAlert({ id: alertId, msg: message, amt: amount });

    setUserProgress(prev => {
      let nextXp = prev.xp + amount;
      let nextLevel = prev.level;
      let leveledUp = false;

      while (nextXp >= nextLevel * 100) {
        nextXp -= nextLevel * 100;
        nextLevel += 1;
        leveledUp = true;
      }

      if (leveledUp) {
        // Trigger level up delay retro fanfare
        setTimeout(() => {
          soundEffects.playLevelUp();
        }, 300);
      }

      return {
        ...prev,
        xp: nextXp,
        level: nextLevel,
        coins: prev.coins + Math.floor(amount / 2) // Give auxiliary coins proportion
      };
    });

    // Auto clear alert
    setTimeout(() => {
      setActiveXpAlert(prev => prev && prev.id === alertId ? null : prev);
    }, 4500);

    // Update quest stats based on actions
    updateAchievements();
  };

  // 4. Update Quest Metrics & Progression logs
  const incrementQuestProgress = (type: 'canvas' | 'pomodoro' | 'review' | 'planner', incAmount = 1) => {
    setQuests(prevQuests => {
      return prevQuests.map(q => {
        if (q.type === type && !q.completed) {
          const nextVal = q.currentValue + incAmount;
          const complete = nextVal >= q.targetValue;
          return {
            ...q,
            currentValue: nextVal,
            completed: complete
          };
        }
        return q;
      });
    });
  };

  const updateAchievements = () => {
    setAchievements(prevAch => {
      return prevAch.map(ach => {
        if (ach.unlockedAt) return ach;

        let currentMetricValue = 0;
        if (ach.targetType === 'total_xp') {
          // Calculate cumulative XP across current levels
          let totalXp = userProgress.xp;
          for (let l = 1; l < userProgress.level; l++) {
            totalXp += l * 100;
          }
          currentMetricValue = totalXp;
        } else if (ach.targetType === 'pages_drawn') {
          currentMetricValue = notebooks.reduce((acc, nb) => acc + nb.pages.length, 0);
        } else if (ach.targetType === 'completed_tasks') {
          currentMetricValue = studyTasks.filter(t => t.completed).length;
        } else if (ach.targetType === 'reviews_done') {
          currentMetricValue = revisions.reduce((acc, r) => acc + (r.history?.length || 0), 0);
        } else if (ach.targetType === 'streak_days') {
          currentMetricValue = userProgress.streak;
        }

        if (currentMetricValue >= ach.targetValue) {
          return {
            ...ach,
            unlockedAt: new Date().toISOString()
          };
        }
        return ach;
      });
    });
  };

  // 5. Planner and Task interactions
  const handleAddTask = (newTask: StudyTask) => {
    setStudyTasks(prev => [...prev, newTask]);
    incrementQuestProgress('planner', 1);
  };

  const handleToggleTask = (id: string) => {
    setStudyTasks(prev => {
      return prev.map(t => {
        if (t.id === id) {
          const nextState = !t.completed;
          if (nextState) {
            handleAwardXp(15, `Tarefa Concluída: ${t.title}! +15 XP`);
          }
          return { ...t, completed: nextState };
        }
        return t;
      });
    });
  };

  const handleDeleteTask = (id: string) => {
    setStudyTasks(prev => prev.filter(t => t.id !== id));
  };

  // Automatically schedules Spaced Repetition reviews (1, 3, 7, 14, 30 days offsets)
  const handleGenerateRevisions = (title: string, subject: string) => {
    const revisionsNeeded = [
      { offset: 1, label: 'Revisão Básica' },
      { offset: 3, label: 'Revisão Consolidada' },
      { offset: 7, label: 'Revisão Sistemática' },
      { offset: 14, label: 'Revisão Conectiva' },
      { offset: 30, label: 'Revisão de Fixação Final' }
    ];

    const todayObj = new Date('2026-06-05'); // anchoring base time

    const newRevs: SpacedRevision[] = revisionsNeeded.map((cfg, idx) => {
      const scheduledDate = new Date(todayObj);
      scheduledDate.setDate(scheduledDate.getDate() + cfg.offset);
      const scheduledStr = scheduledDate.toISOString().split('T')[0];

      return {
        id: `rev-auto-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 5)}`,
        title: `${title} · ${cfg.label}`,
        subject: subject,
        nextReviewDate: scheduledStr, // actual calculated SM2 targets
        intervalDays: cfg.offset,
        easeFactor: 2.5,
        repetitions: 0,
        history: []
      };
    });

    setRevisions(prev => [...prev, ...newRevs]);
  };

  // 6. Spaced Repetition Flashcard actions
  const handleReviewCard = (
    id: string, quality: number, nextDue: string, interval: number, ease: number, reps: number
  ) => {
    setRevisions(prev => {
      return prev.map(rev => {
        if (rev.id === id) {
          const histItem = {
            date: '2026-06-05',
            quality,
            nextDate: nextDue
          };
          return {
            ...rev,
            nextReviewDate: nextDue,
            intervalDays: interval,
            easeFactor: ease,
            repetitions: reps,
            lastReviewed: '2026-06-05',
            history: [...rev.history, histItem]
          };
        }
        return rev;
      });
    });

    incrementQuestProgress('review', 1);
  };

  // 7. Gamification Claim Rewards
  const handleClaimQuestReward = (id: string, xp: number, coins: number) => {
    setQuests(prev => {
      return prev.map(q => {
        if (q.id === id) {
          return { ...q, claimed: true };
        }
        return q;
      });
    });

    setUserProgress(prev => ({
      ...prev,
      coins: prev.coins + coins
    }));

    handleAwardXp(xp, `Recompensa de Quest Coletada! +${xp} XP & +${coins} AC`);
  };

  // Customization Store unlocks
  const handleEquipCover = (id: string) => {
    setUserProgress(prev => ({
      ...prev,
      activeCover: id
    }));
  };

  const handlePurchaseCover = (id: string, price: number) => {
    setUserProgress(prev => ({
      ...prev,
      coins: prev.coins - price,
      unlockedCovers: [...prev.unlockedCovers, id],
      activeCover: id
    }));
    handleAwardXp(40, `Capa premium desbloqueada! Caderno estilizado.`);
  };

  // Adding clean custom notebook binders
  const handleAddNewNotebook = () => {
    const title = window.prompt("Digite o nome da nova matéria escolar:");
    if (!title || !title.trim()) return;

    const newNbId = 'nb-' + Date.now();
    const newNb: Notebook = {
      id: newNbId,
      title: title.trim(),
      coverColor: ['indigo', 'emerald', 'rose', 'amber', 'fuchsia'][Math.floor(Math.random() * 5)],
      createdAt: new Date().toISOString(),
      currentPageIndex: 0,
      pages: [
        {
          id: `page-${Date.now()}-0`,
          title: 'Primeiras Anotações',
          bgType: 'ruled',
          strokes: [],
          createdAt: new Date().toISOString()
        }
      ]
    };

    setNotebooks(prev => [...prev, newNb]);
    setActiveNotebookId(newNbId);
    setActiveTab('notebook');
    
    soundEffects.playQuestComplete();
    handleAwardXp(15, `Nova Matéria Binder criada: ${newNb.title}!`);
  };

  // Drawing log hook to increment strokes for canvas practices
  const handleUpdateNotebooks = (updatedNotebooks: Notebook[]) => {
    setNotebooks(updatedNotebooks);
    
    // Check if new stroke added to increment progress
    const activeNb = updatedNotebooks.find(n => n.id === activeNotebookId);
    const activePg = activeNb?.pages[activeNb.currentPageIndex];
    if (activePg && activePg.strokes.length > 0) {
      incrementQuestProgress('canvas', 1);
    }
  };

  // Side Navigation Menu definitions
  const NAVIGATION_ITEMS = [
    { id: 'dashboard', label: 'Início', icon: Compass, group: 'Estudos' },
    { id: 'notebook', label: 'Caderno Digital', icon: BookOpen, group: 'Estudos' },
    { id: 'planner', label: 'Agenda & Foco', icon: CalendarClock, group: 'Estudos' },
    { id: 'revisions', label: 'Flashcards', icon: BrainCircuit, group: 'Recursos' },
    { id: 'tools', label: 'Ferramentas', icon: Wand2, group: 'Recursos' },
    { id: 'store', label: 'Conquistas & Loja', icon: Trophy, group: 'Recompensas' }
  ];

  return (
    <div id="estudaink-root-app" className="min-h-screen flex bg-slate-50 font-sans text-slate-900 antialiased relative overflow-hidden">
      
      {/* SIDEBAR NAVIGATION - DESKTOP & MOBILE TRANSITIONS */}
      <AnimatePresence>
        {(sidebarOpen || !sidebarOpen) && (
          <aside 
            id="sidebar-navigation"
            className={`fixed inset-y-0 left-0 z-40 w-56 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-300 select-none ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
            }`}
          >
            <div className="flex flex-col">
              {/* Premium Title header */}
              <div className="h-14 px-4 flex items-center justify-between border-b border-slate-200 bg-white">
                <div className="flex items-center gap-2.5">
                  <div className="bg-blue-600 w-7 h-7 rounded-md flex items-center justify-center shadow-xs shrink-0">
                    <div className="w-3.5 h-3.5 border-2 border-white rounded-xs"></div>
                  </div>
                  <div>
                    <span className="font-bold tracking-tight text-sm text-slate-900">
                      EstudaCaneta <span className="text-blue-600 font-extrabold text-xs">PRO</span>
                    </span>
                  </div>
                </div>
                
                {/* Mobile close menu */}
                <button 
                  id="btn-sidebar-close"
                  onClick={() => setSidebarOpen(false)}
                  className="md:hidden text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation list in beautiful groups */}
              <div className="p-3 space-y-4">
                {/* Group 1: Estudos */}
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2.5 mb-1.5">
                    Estudos
                  </div>
                  <nav className="flex flex-col gap-0.5">
                    {NAVIGATION_ITEMS.filter(item => item.group === 'Estudos').map(item => {
                      const IconComp = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          id={`nav-item-${item.id}`}
                          onClick={() => {
                            setActiveTab(item.id);
                            setSidebarOpen(false);
                            soundEffects.playClick();
                          }}
                          className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-all cursor-pointer ${
                            isActive 
                              ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-600' 
                              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          <IconComp className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </nav>
                </div>

                {/* Group 2: Recursos */}
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2.5 mb-1.5">
                    Kit Auxiliar
                  </div>
                  <nav className="flex flex-col gap-0.5">
                    {NAVIGATION_ITEMS.filter(item => item.group === 'Recursos').map(item => {
                      const IconComp = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          id={`nav-item-${item.id}`}
                          onClick={() => {
                            setActiveTab(item.id);
                            setSidebarOpen(false);
                            soundEffects.playClick();
                          }}
                          className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-all cursor-pointer ${
                            isActive 
                              ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-600' 
                              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          <IconComp className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </nav>
                </div>

                {/* Group 3: Recompensas */}
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2.5 mb-1.5">
                    Recompensas
                  </div>
                  <nav className="flex flex-col gap-0.5">
                    {NAVIGATION_ITEMS.filter(item => item.group === 'Recompensas').map(item => {
                      const IconComp = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          id={`nav-item-${item.id}`}
                          onClick={() => {
                            setActiveTab(item.id);
                            setSidebarOpen(false);
                            soundEffects.playClick();
                          }}
                          className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-all cursor-pointer ${
                            isActive 
                              ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-600' 
                              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          <IconComp className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </nav>
                </div>
              </div>
            </div>

            {/* Sidebar bottom branding panel */}
            <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-center">
              <div className="flex items-center justify-center gap-1.5 text-[10px] font-semibold text-slate-400 font-mono">
                <span>Versão PRO 2.1</span>
              </div>
            </div>
          </aside>
        )}
      </AnimatePresence>

      {/* OVERLAY BACKGROUND CLICKS ON MOBILE CHANNELS */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 md:hidden"
        />
      )}

      {/* MAIN VIEWPORT LAYOUT */}
      <div className="flex-1 md:pl-56 flex flex-col overflow-x-hidden min-h-screen">
        
        {/* MOBILE UPPER BAR */}
        <header className="md:hidden bg-white text-slate-900 px-4 py-3 flex items-center justify-between border-b border-slate-200">
          <div className="flex items-center gap-2">
            <button 
              id="btn-sidebar-hamburger"
              onClick={() => setSidebarOpen(true)}
              className="text-slate-600 hover:text-slate-950 p-1"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-bold text-sm tracking-tight text-slate-900">EstudaCaneta <span className="text-blue-600 font-extrabold text-xs">PRO</span></span>
          </div>
          
          <div className="flex items-center gap-1 font-bold text-blue-600 text-xs bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
            <span>Nív. {userProgress.level}</span>
          </div>
        </header>

        {/* HUD LEVEL/COINS BAR */}
        <HeaderStats progress={userProgress} />

        {/* INTERACTIVE CENTRAL TABS RENDER WITH MOTION TRANSITIONS */}
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 5 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -5 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              {activeTab === 'dashboard' && (
                <DashboardOverview
                  notebooks={notebooks}
                  tasks={studyTasks}
                  revisions={revisions}
                  quests={quests}
                  userEmail={userEmail}
                  onSelectNotebook={setActiveNotebookId}
                  onNavigateTab={setActiveTab}
                  onAddNewNotebook={handleAddNewNotebook}
                />
              )}

              {activeTab === 'notebook' && (
                <NotebookCanvas
                  notebooks={notebooks}
                  activeNotebookId={activeNotebookId}
                  onUpdateNotebooks={handleUpdateNotebooks}
                  onAwardXp={handleAwardXp}
                />
              )}

              {activeTab === 'planner' && (
                <PlannerCalendar
                  tasks={studyTasks}
                  onAddTask={handleAddTask}
                  onToggleTask={handleToggleTask}
                  onDeleteTask={handleDeleteTask}
                  onGenerateRevisions={handleGenerateRevisions}
                  onAwardXp={handleAwardXp}
                />
              )}

              {activeTab === 'revisions' && (
                <ReviewCenter
                  revisions={revisions}
                  onReviewCard={handleReviewCard}
                  onAwardXp={handleAwardXp}
                />
              )}

              {activeTab === 'tools' && (
                <StudyTools
                  onAwardXp={handleAwardXp}
                />
              )}

              {activeTab === 'store' && (
                <ShopStore
                  progress={userProgress}
                  quests={quests}
                  achievements={achievements}
                  onEquipCover={handleEquipCover}
                  onPurchaseCover={handlePurchaseCover}
                  onClaimQuestReward={handleClaimQuestReward}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* FLOAT XP SUCCESS ALERT NOTIFIER OVERLAY POP */}
      <AnimatePresence>
        {activeXpAlert && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-55 bg-slate-900 border border-slate-800 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-3.5 max-w-sm select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0 animate-bounce">
              +{activeXpAlert.amt}
            </div>
            <div>
              <p className="text-xs font-bold text-amber-400">XP Adquirido!</p>
              <h4 className="text-xs text-slate-300 font-medium leading-tight mt-0.5">{activeXpAlert.msg}</h4>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
