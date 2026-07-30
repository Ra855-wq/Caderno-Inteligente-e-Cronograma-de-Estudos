/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { UserProgress, Quest, Achievement } from '../types';
import { COVER_THEMES } from '../utils/initialState';
import { 
  ShoppingBag, Shield, Trophy, Check, Sparkles, Coins, 
  Flame, Palette, CheckCircle2, BrainCircuit, Star, Compass, ArrowUpRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { soundEffects } from '../utils/audio';

interface ShopStoreProps {
  progress: UserProgress;
  quests: Quest[];
  achievements: Achievement[];
  onEquipCover: (id: string) => void;
  onPurchaseCover: (id: string, price: number) => void;
  onClaimQuestReward: (id: string, xp: number, coins: number) => void;
}

export default function ShopStore({ 
  progress, quests, achievements, onEquipCover, onPurchaseCover, onClaimQuestReward 
}: ShopStoreProps) {

  // Dynamic Icon selector for achievements
  const getAchievementIcon = (name: string, unlocked: boolean) => {
    const classes = `w-5 h-5 ${unlocked ? 'text-[#eab308]' : 'text-slate-300'}`;
    switch(name) {
      case 'Sparkles': return <Sparkles className={classes} />;
      case 'Palette': return <Palette className={classes} />;
      case 'CheckCircle2': return <CheckCircle2 className={classes} />;
      case 'BrainCircuit': return <BrainCircuit className={classes} />;
      case 'Flame': return <Flame className={classes} />;
      default: return <Trophy className={classes} />;
    }
  };

  const handleBuyCover = (id: string, price: number) => {
    if (progress.coins < price) {
      soundEffects.playError();
      alert(`Moedas insuficientes! Você precisa de mais ${price - progress.coins} AC.`);
      return;
    }
    onPurchaseCover(id, price);
    soundEffects.playLevelUp();
  };

  const handleClaim = (quest: Quest) => {
    onClaimQuestReward(quest.id, quest.xpReward, quest.coinsReward);
    soundEffects.playQuestComplete();
  };

  return (
    <div id="gamification-shop-view" className="p-4 bg-slate-50/50 min-h-screen">
      
      {/* 3 Grid layout: Shop, Quests, Achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* QUEST HUB LOGS (COLUMN SPAN 8) */}
        <div className="lg:col-span-8 flex flex-col gap-4 select-none">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-blue-600" />
              <span>Metas e Quests Diárias</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Renovação Contínua</span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {quests.map(quest => {
              const isDone = quest.currentValue >= quest.targetValue;
              const percent = Math.min(100, Math.floor((quest.currentValue / quest.targetValue) * 100));

              return (
                <div 
                  key={quest.id}
                  id={`quest-item-${quest.id}`}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    quest.claimed 
                      ? 'bg-slate-100/40 border-slate-200 opacity-60'
                      : isDone 
                      ? 'bg-emerald-50/20 border-emerald-350'
                      : 'bg-white border-slate-200 shadow-2xs hover:shadow-1xs'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-slate-800 text-xs leading-tight">{quest.title}</span>
                      {quest.claimed ? (
                        <span className="text-[8px] bg-slate-200 text-slate-600 font-extrabold px-1.5 py-0.5 rounded-md uppercase font-mono">Resgatado</span>
                      ) : isDone ? (
                        <span className="text-[8px] bg-emerald-500 text-white font-extrabold px-1.5 py-0.5 rounded-md uppercase flex items-center gap-0.5">Pronto <Check className="w-2.5 h-2.5" /></span>
                      ) : null}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{quest.description}</p>
                    
                    {/* Progress Bar slider info */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/40 max-w-sm">
                        <div 
                          className={`h-full transition-all ${isDone ? 'bg-emerald-500' : 'bg-blue-600'}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-bold font-mono text-slate-450">
                        {quest.currentValue}/{quest.targetValue} ({percent}%)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5 shrink-0 sm:border-l sm:border-slate-100 sm:pl-4">
                    {/* Rewards badges */}
                    <div className="text-left text-[10px] font-mono font-bold text-slate-500 shrink-0">
                      <div className="flex items-center gap-1 text-slate-600">
                        <Star className="w-3 w-3 text-amber-500 fill-amber-300" />
                        <span>+{quest.xpReward} XP</span>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5 text-slate-500">
                        <Coins className="w-3 w-3 text-yellow-500" />
                        <span>+{quest.coinsReward} ac</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="shrink-0">
                      {quest.claimed ? (
                        <button disabled className="bg-slate-100 text-slate-400 font-bold text-[10px] px-3 py-1.5 rounded-md">
                          Coletado
                        </button>
                      ) : isDone ? (
                        <button
                          id={`btn-claim-reward-${quest.id}`}
                          onClick={() => handleClaim(quest)}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] px-3 py-1.5 rounded-md transition-all cursor-pointer shadow-xs"
                        >
                          Resgatar
                        </button>
                      ) : (
                        <button disabled className="bg-slate-105 text-slate-400 font-bold text-[10px] px-3 py-1.5 rounded-md border border-slate-200">
                          Pendente
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ACHIEVEMENTS BLOCK */}
          <div className="mt-3">
            <h3 className="font-bold text-slate-705 text-xs uppercase tracking-wider mb-2.5 flex items-center gap-1.5 px-1">
              <Trophy className="w-3.5 h-3.5 text-blue-600" />
              <span>Conquistas Acadêmicas</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {achievements.map(ach => {
                const unlocked = !!ach.unlockedAt;
                return (
                  <div 
                    key={ach.id}
                    id={`ach-card-${ach.id}`}
                    className={`p-3 rounded-xl border transition-all flex items-start gap-3 ${
                      unlocked 
                        ? 'bg-amber-50/10 border-amber-300'
                        : 'bg-white border-slate-200 opacity-60'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg shrink-0 flex items-center justify-center ${
                      unlocked ? 'bg-amber-100/50 border border-amber-200' : 'bg-slate-100'
                    }`}>
                      {getAchievementIcon(ach.iconName, unlocked)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">{ach.title}</h4>
                      <p className="text-[10px] text-slate-450 leading-tight mt-0.5">{ach.description}</p>
                      {unlocked && (
                        <div className="text-[8px] text-amber-600 font-extrabold mt-1.5 font-mono uppercase bg-amber-50 border border-amber-100 py-0.5 px-1.5 rounded-md inline-block">Conquistado</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* STORE CABINET / PREMIUM COVERS (COLUMN SPAN 4) */}
        <div id="shop-covers-card" className="lg:col-span-4 bg-white rounded-xl p-4 border border-slate-200 flex flex-col gap-3 select-none">
          <div className="flex items-center gap-2 mb-1 pb-2 border-b border-slate-100">
            <ShoppingBag className="w-4 h-4 text-blue-600" />
            <h2 className="font-bold text-slate-850 text-xs uppercase tracking-wider">Papelaria & Capas</h2>
          </div>

          <div className="flex flex-col gap-2.5">
            {COVER_THEMES.map(theme => {
              const isUnlocked = progress.unlockedCovers.includes(theme.id);
              const isActive = progress.activeCover === theme.id;

              return (
                <div 
                  key={theme.id}
                  id={`store-theme-item-${theme.id}`}
                  className={`p-2.5 rounded-lg border flex items-center justify-between gap-3 transition-colors ${
                    isActive ? 'border-slate-800 bg-slate-50' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Notebook Spine Visual Mockup */}
                    <div className={`w-7 h-9 ${theme.bg} rounded-md border-l-4 border-slate-900 shadow-2xs flex items-center justify-center text-[8px] font-bold shrink-0 select-none ${theme.text}`}>
                      📖
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-700 truncate">{theme.name}</h4>
                      {isActive ? (
                        <span className="text-[9px] text-blue-600 font-bold">Equipado</span>
                      ) : isUnlocked ? (
                        <span className="text-[9px] text-emerald-600 font-bold">Disponível</span>
                      ) : (
                        <span className="text-[9px] text-slate-400 font-mono">Loja Estética</span>
                      )}
                    </div>
                  </div>

                  {/* Buttons logic */}
                  <div className="shrink-0">
                    {isActive ? (
                      <button disabled className="bg-slate-900 text-white font-bold text-[10px] px-2.5 py-1 rounded-md">
                        Ativo
                      </button>
                    ) : isUnlocked ? (
                      <button
                        id={`equip-theme-${theme.id}`}
                        onClick={() => { onEquipCover(theme.id); soundEffects.playClick(); }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-705 font-bold text-[10px] px-2.5 py-1 rounded-md transition-all cursor-pointer border border-slate-200/55"
                      >
                        Equipar
                      </button>
                    ) : (
                      <button
                        id={`buy-theme-${theme.id}`}
                        onClick={() => handleBuyCover(theme.id, theme.price)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] px-2 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 active:scale-95 shadow-2xs"
                      >
                        <Coins className="w-2.5 h-2.5 fill-white" />
                        <span>{theme.price} AC</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 mt-1 text-[11px] text-slate-500">
            <span className="font-bold text-slate-700 block mb-1">Como ganhar moedas?</span>
            <ul className="list-disc pl-4 flex flex-col gap-1 leading-snug">
              <li>Concluindo tarefas do cronograma (+15 Moedas)</li>
              <li>Revisando flashcards ativos (+10 Moedas)</li>
              <li>Concluindo ciclos de Pomodoro (+20 Moedas)</li>
            </ul>
          </div>

        </div>

      </div>

    </div>
  );
}
