/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Notebook, StudyTask, SpacedRevision, Quest, Achievement, UserProgress } from '../types';

export const DEFAULT_USER_PROGRESS: UserProgress = {
  xp: 75,
  level: 1,
  streak: 3,
  lastActiveDate: '2026-06-04',
  coins: 120,
  activeCover: 'slate',
  unlockedCovers: ['slate', 'emerald']
};

export const INITIAL_NOTEBOOKS: Notebook[] = [
  {
    id: 'nb1',
    title: 'Anatomia Humana e Fisiologia',
    coverColor: 'emerald',
    createdAt: '2026-06-01T10:00:00Z',
    currentPageIndex: 0,
    pages: [
      {
        id: 'nb1-p1',
        title: 'Introdução aos Sistemas Organizados',
        bgType: 'ruled',
        createdAt: '2026-06-01T10:05:00Z',
        strokes: [
          {
            id: 'st1',
            tool: 'pen',
            color: '#10b981', // emerald-500
            size: 4,
            points: [
              { x: 100, y: 150 },
              { x: 105, y: 151 },
              { x: 115, y: 153 },
              { x: 130, y: 155 },
              { x: 150, y: 156 },
              { x: 170, y: 155 },
              { x: 190, y: 150 }
            ]
          },
          {
            id: 'st2',
            tool: 'highlighter',
            color: 'rgba(253, 224, 71, 0.4)', // yellow highlight
            size: 15,
            points: [
              { x: 90, y: 152 },
              { x: 210, y: 152 }
            ]
          }
        ]
      },
      {
        id: 'nb1-p2',
        title: 'Sistema Cardiovascular',
        bgType: 'grid',
        createdAt: '2026-06-02T14:20:00Z',
        strokes: []
      }
    ]
  },
  {
    id: 'nb2',
    title: 'Álgebra Linear & Matrizes',
    coverColor: 'indigo',
    createdAt: '2026-06-03T09:00:00Z',
    currentPageIndex: 0,
    pages: [
      {
        id: 'nb2-p1',
        title: 'Espaços Vetoriais',
        bgType: 'dots',
        createdAt: '2026-06-03T09:05:00Z',
        strokes: []
      }
    ]
  }
];

export const INITIAL_STUDY_TASKS: StudyTask[] = [
  {
    id: 'task1',
    title: 'Fisiologia Cardiovascular: Revisão Geral',
    subject: 'Anatomia Humana',
    date: '2026-06-05',
    time: '09:00',
    duration: 45,
    completed: false,
    priority: 'alta',
    notes: 'Focar na mecânica da bomba cardíaca e pressão arterial.'
  },
  {
    id: 'task2',
    title: 'Exercícios de Transformações Lineares (Lista 3)',
    subject: 'Álgebra Linear',
    date: '2026-06-05',
    time: '14:30',
    duration: 60,
    completed: false,
    priority: 'media',
    notes: 'Fazer exercícios do 5 ao 12 no caderno inteligente.'
  },
  {
    id: 'task3',
    title: 'Leitura de Artigo sobre Redes Neurais',
    subject: 'Inteligência Artificial',
    date: '2026-06-06',
    time: '10:00',
    duration: 30,
    completed: false,
    priority: 'baixa',
    notes: 'Anotar os principais conceitos para o flashcard.'
  }
];

export const INITIAL_REVISIONS: SpacedRevision[] = [
  {
    id: 'rev1',
    title: 'Ciclo Cardíaco: Sístole e Diástole',
    subject: 'Anatomia Humana',
    lastReviewed: '2026-06-04',
    nextReviewDate: '2026-06-05', // due today
    intervalDays: 1,
    easeFactor: 2.5,
    repetitions: 1,
    history: [
      { date: '2026-06-04', quality: 4, nextDate: '2026-06-05' }
    ]
  },
  {
    id: 'rev2',
    title: 'Teorema do Núcleo e da Imagem',
    subject: 'Álgebra Linear',
    lastReviewed: '2026-06-02',
    nextReviewDate: '2026-06-05', // due today
    intervalDays: 3,
    easeFactor: 2.4,
    repetitions: 2,
    history: [
      { date: '2026-05-30', quality: 3, nextDate: '2026-06-02' },
      { date: '2026-06-02', quality: 4, nextDate: '2026-06-05' }
    ]
  },
  {
    id: 'rev3',
    title: 'Complexidade de Algoritmos (Big-O)',
    subject: 'Estruturas de Dados',
    lastReviewed: '2026-05-28',
    nextReviewDate: '2026-06-08',
    intervalDays: 11,
    easeFactor: 2.6,
    repetitions: 3,
    history: [
      { date: '2026-05-18', quality: 4, nextDate: '2026-05-21' },
      { date: '2026-05-21', quality: 5, nextDate: '2026-05-28' },
      { date: '2026-05-28', quality: 5, nextDate: '2026-06-08' }
    ]
  }
];

export const INITIAL_QUESTS: Quest[] = [
  {
    id: 'q1',
    title: 'Prática no Caderno',
    description: 'Faça um desenho, anotação ou diagrama com pelo menos 5 traços no Pincel.',
    type: 'canvas',
    targetValue: 5,
    currentValue: 0,
    xpReward: 30,
    coinsReward: 15,
    completed: false,
    claimed: false
  },
  {
    id: 'q2',
    title: 'Foco Absoluto',
    description: 'Complete uma sessão inteira de Pomodoro (25 min de estudo com som de concentração).',
    type: 'pomodoro',
    targetValue: 1,
    currentValue: 0,
    xpReward: 50,
    coinsReward: 25,
    completed: false,
    claimed: false
  },
  {
    id: 'q3',
    title: 'Mente Afiada',
    description: 'Faça 2 revisões ativas pendentes na aba de flashcards hoje.',
    type: 'review',
    targetValue: 2,
    currentValue: 0,
    xpReward: 40,
    coinsReward: 20,
    completed: false,
    claimed: false
  },
  {
    id: 'q4',
    title: 'Mestre da Organização',
    description: 'Adicione uma nova tarefa ou sessão de estudos personalizada no Cronograma.',
    type: 'planner',
    targetValue: 1,
    currentValue: 0,
    xpReward: 20,
    coinsReward: 10,
    completed: false,
    claimed: false
  }
];

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'ach1',
    title: 'Primeiros Passos',
    description: 'Alcance 100 XP no total para iniciar sua jornada.',
    iconName: 'Sparkles',
    targetType: 'total_xp',
    targetValue: 100
  },
  {
    id: 'ach2',
    title: 'Pintor Acadêmico',
    description: 'Crie ou desenhe em 3 páginas diferentes do seu Caderno Inteligente.',
    iconName: 'Palette',
    targetType: 'pages_drawn',
    targetValue: 3
  },
  {
    id: 'ach3',
    title: 'Estudante Focado',
    description: 'Marque 5 tarefas de estudos do cronograma como concluídas.',
    iconName: 'CheckCircle2',
    targetType: 'completed_tasks',
    targetValue: 5
  },
  {
    id: 'ach4',
    title: 'Retenção Absoluta',
    description: 'Complete 5 revisões ativas baseadas em repetição espaçada.',
    iconName: 'BrainCircuit',
    targetType: 'reviews_done',
    targetValue: 5
  },
  {
    id: 'ach5',
    title: 'Hábito Inabalável',
    description: 'Atinja uma sequência de 5 dias seguidos de estudos.',
    iconName: 'Flame',
    targetType: 'streak_days',
    targetValue: 5
  }
];

export const COVER_THEMES = [
  { id: 'slate', name: 'Ardosia Nobre', bg: 'bg-slate-700', text: 'text-slate-100', border: 'border-slate-800', price: 0 },
  { id: 'emerald', name: 'Verde Médico / Floresta', bg: 'bg-emerald-700', text: 'text-emerald-100', border: 'border-emerald-800', price: 0 },
  { id: 'indigo', name: 'Índigo Científico', bg: 'bg-indigo-700', text: 'text-indigo-100', border: 'border-indigo-800', price: 40 },
  { id: 'rose', name: 'Rosa Vintage', bg: 'bg-rose-700', text: 'text-rose-100', border: 'border-rose-800', price: 50 },
  { id: 'amber', name: 'Âmbar Erudito', bg: 'bg-amber-600', text: 'text-amber-100', border: 'border-amber-700', price: 60 },
  { id: 'fuchsia', name: 'Neon Cibernético', bg: 'bg-fuchsia-700', text: 'text-fuchsia-100', border: 'border-fuchsia-800', price: 80 }
];
