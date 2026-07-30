/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserProgress } from '../types';
import { Flame, Star, Coins, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface HeaderStatsProps {
  progress: UserProgress;
}

export default function HeaderStats({ progress }: HeaderStatsProps) {
  const xpNeeded = progress.level * 100;
  const xpPercentage = Math.min(100, Math.floor((progress.xp / xpNeeded) * 105));

  return (
    <div id="header-stats-container" className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between gap-4 select-none">
      {/* Level + Experience indicator with high density layout */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-start">
          <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Acadêmico Nível {progress.level}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-32 sm:w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
              <motion.div 
                className="h-full bg-amber-400"
                initial={{ width: 0 }}
                animate={{ width: `${xpPercentage}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-400">{progress.xp}/{xpNeeded} XP</span>
          </div>
        </div>
      </div>

      {/* Streak + Coins Status Panels matching OmniStudy PRO */}
      <div className="flex items-center gap-6">
        <div className="flex flex-col items-center">
          <span className="text-sm font-bold text-slate-900 flex items-center gap-1">
            <motion.span
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-block"
            >
              🔥
            </motion.span>
            {progress.streak} d
          </span>
          <span className="text-[9px] font-bold uppercase text-slate-400">Ofensiva</span>
        </div>

        <div className="flex flex-col items-center">
          <span className="text-sm font-bold text-blue-600 flex items-center gap-1">
            <motion.span
              animate={{ rotateY: [0, 180, 360] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-block"
            >
              🪙
            </motion.span>
            {progress.coins} AC
          </span>
          <span className="text-[9px] font-bold uppercase text-slate-400">Moedas</span>
        </div>
      </div>
    </div>
  );
}
