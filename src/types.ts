/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Point {
  x: number;
  y: number;
  pressure?: number;
}

export type ToolType = 'pen' | 'highlighter' | 'eraser';
export type PaperType = 'blank' | 'ruled' | 'grid' | 'dots' | 'dark-slate';

export interface Stroke {
  id: string;
  points: Point[];
  tool: ToolType;
  color: string;
  size: number;
}

export interface NotebookPage {
  id: string;
  title: string;
  bgType: PaperType;
  strokes: Stroke[];
  createdAt: string;
}

export interface Notebook {
  id: string;
  title: string;
  coverColor: string;
  pages: NotebookPage[];
  currentPageIndex: number;
  createdAt: string;
}

export interface StudyTask {
  id: string;
  title: string;
  subject: string;
  date: string;
  time: string;
  duration: number; // in minutes
  completed: boolean;
  priority: 'baixa' | 'media' | 'alta';
  notes?: string;
}

export interface SpacedRevision {
  id: string;
  title: string;
  subject: string;
  lastReviewed?: string;
  nextReviewDate: string;
  intervalDays: number; // current interval
  easeFactor: number;   // SM-2 Ease Factor (default 2.5)
  repetitions: number;  // number of consecutive successful reviews
  history: { date: string; quality: number; nextDate: string }[];
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'canvas' | 'pomodoro' | 'review' | 'planner';
  targetValue: number;
  currentValue: number;
  xpReward: number;
  coinsReward: number;
  completed: boolean;
  claimed: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  iconName: string;
  unlockedAt?: string;
  targetType: 'total_xp' | 'pages_drawn' | 'completed_tasks' | 'reviews_done' | 'streak_days';
  targetValue: number;
}

export interface UserProgress {
  xp: number;
  level: number;
  streak: number;
  lastActiveDate?: string;
  coins: number;
  activeCover: string;
  unlockedCovers: string[];
}
