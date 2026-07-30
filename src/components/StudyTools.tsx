/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Wand2, Volume2, VolumeX, Calculator, BookOpen, Clock, 
  Sparkles, Check, HelpCircle, AlertCircle, Play, Pause, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { soundEffects } from '../utils/audio';

interface StudyToolsProps {
  onAwardXp: (xp: number, message: string) => void;
}

export default function StudyTools({ onAwardXp }: StudyToolsProps) {
  
  // Tab states for inside tools
  const [activeSubTool, setActiveSubTool] = useState<'ambient' | 'grades' | 'wpm'>('ambient');

  // --- AUDIO SYNTHESIS ENGINE ---
  const [playingNoise, setPlayingNoise] = useState<'none' | 'brown' | 'rain' | 'binaural'>('none');
  const [volume, setVolume] = useState(0.4); // 0 to 1
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  
  // Binaural oscillators
  const osc1Ref = useRef<OscillatorNode | null>(null);
  const osc2Ref = useRef<OscillatorNode | null>(null);

  // Modulation loop for rain wave effect
  const modulationIntervalRef = useRef<number | null>(null);

  // Ensure cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllSounds();
    };
  }, []);

  // Sync volume with gain node when slider changes
  useEffect(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.linearRampToValueAtTime(volume * 0.15, audioCtxRef.current.currentTime + 0.1);
    }
  }, [volume]);

  const stopAllSounds = () => {
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch(e){}
      sourceNodeRef.current = null;
    }
    if (osc1Ref.current) {
      try { osc1Ref.current.stop(); } catch(e){}
      osc1Ref.current = null;
    }
    if (osc2Ref.current) {
      try { osc2Ref.current.stop(); } catch(e){}
      osc2Ref.current = null;
    }
    if (modulationIntervalRef.current) {
      window.clearInterval(modulationIntervalRef.current);
      modulationIntervalRef.current = null;
    }
    setPlayingNoise('none');
  };

  const initAudioCtx = () => {
    if (!audioCtxRef.current) {
      const AudioCtxClass = typeof window !== 'undefined' ? (window.AudioContext || (window as any).webkitAudioContext) : null;
      if (AudioCtxClass) {
        try {
          audioCtxRef.current = new AudioCtxClass();
        } catch (e) {
          console.warn('Failed to initialize AudioContext in StudyTools:', e);
          audioCtxRef.current = null;
        }
      } else {
        audioCtxRef.current = null;
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  };

  const handleToggleNoise = (type: 'brown' | 'rain' | 'binaural') => {
    soundEffects.playClick();
    
    if (playingNoise === type) {
      stopAllSounds();
      return;
    }

    // Stop previous sound
    stopAllSounds();

    const ctx = initAudioCtx();
    if (!ctx) return;

    // Create volume node wrapper
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(volume * 0.15, ctx.currentTime);
    gainNode.connect(ctx.destination);
    gainNodeRef.current = gainNode;

    if (type === 'brown') {
      // Synthesize soft brown noise buffer (deep focus frequency)
      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Brown noise formula: filter coefficient
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5; // Compensate for loss of gain
      }

      const source = ctx.createBufferSource();
      source.buffer = noiseBuffer;
      source.loop = true;

      // Add low-pass filter to make it even cozier/softer
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(350, ctx.currentTime);

      source.connect(filter);
      filter.connect(gainNode);
      source.start();
      
      sourceNodeRef.current = source;
      setPlayingNoise('brown');
      onAwardXp(15, 'Foco ativado: Iniciou Ruído Marrom para isolamento sonoro!');

    } else if (type === 'rain') {
      // Filtered white noise with dynamic low frequency oscillation mimicking waves or soft rain
      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const source = ctx.createBufferSource();
      source.buffer = noiseBuffer;
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(500, ctx.currentTime);
      filter.Q.setValueAtTime(1.2, ctx.currentTime);

      source.connect(filter);
      filter.connect(gainNode);
      source.start();
      sourceNodeRef.current = source;

      // Create beautiful smooth oscillation gain mimicking passing showers / wind
      let angle = 0;
      modulationIntervalRef.current = window.setInterval(() => {
        if (gainNodeRef.current && audioCtxRef.current) {
          angle += 0.07;
          // modulate filter frequency up and down softly
          const targetFreq = 500 + Math.sin(angle) * 180;
          filter.frequency.setValueAtTime(targetFreq, audioCtxRef.current.currentTime);
        }
      }, 100);

      setPlayingNoise('rain');
      onAwardXp(15, 'Sons de Chuva & Natureza iniciados! Estude com harmonia.');

    } else if (type === 'binaural') {
      // Binaural alpha waves (10Hz difference) - Left/Right stereos
      // Osc 1: 150Hz in left ear, Osc 2: 160Hz in right ear
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      
      osc1.frequency.setValueAtTime(150, ctx.currentTime);
      osc2.frequency.setValueAtTime(158, ctx.currentTime); // 8Hz Theta waves
      
      osc1.type = 'sine';
      osc2.type = 'sine';

      // Panner nodes for real stereo separation
      const panner1 = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      const panner2 = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

      if (panner1 && panner2) {
        panner1.pan.setValueAtTime(-0.9, ctx.currentTime);
        panner2.pan.setValueAtTime(0.9, ctx.currentTime);

        osc1.connect(panner1);
        panner1.connect(gainNode);

        osc2.connect(panner2);
        panner2.connect(gainNode);
      } else {
        // Fallback
        osc1.connect(gainNode);
        osc2.connect(gainNode);
      }

      osc1.start();
      osc2.start();

      osc1Ref.current = osc1;
      osc2Ref.current = osc2;

      setPlayingNoise('binaural');
      onAwardXp(15, 'Batidas Binaurais (Estágio Ondas Alpha) ativadas!');
    }
  };


  // --- ACADEMIC GRADES CALCULATOR STATE ---
  const [currentGrades, setCurrentGrades] = useState<{ value: string; weight: string }[]>([
    { value: '6.5', weight: '2' },
    { value: '7.8', weight: '3' }
  ]);
  const [targetAverage, setTargetAverage] = useState('7.0');
  const [nextExamWeight, setNextExamWeight] = useState('5');
  const [calcResult, setCalcResult] = useState<{ currentAvg: number; needed: number | null; errorMsg?: string } | null>(null);

  const handleAddGradeInput = () => {
    soundEffects.playClick();
    setCurrentGrades([...currentGrades, { value: '', weight: '1' }]);
  };

  const handleRemoveGradeInput = (index: number) => {
    soundEffects.playError();
    const copy = [...currentGrades];
    copy.splice(index, 1);
    setCurrentGrades(copy);
  };

  const handleUpdateGrade = (index: number, key: 'value' | 'weight', val: string) => {
    const copy = [...currentGrades];
    copy[index][key] = val;
    setCurrentGrades(copy);
  };

  const calculateTargetGrade = (e: React.FormEvent) => {
    e.preventDefault();
    soundEffects.playQuestComplete();

    // Sum currents
    let weightedSum = 0;
    let totalWeight = 0;

    let invalid = false;
    currentGrades.forEach(g => {
      const valNum = parseFloat(g.value);
      const wNum = parseFloat(g.weight);
      if (isNaN(valNum) || isNaN(wNum) || valNum < 0 || wNum <= 0) {
        invalid = true;
      } else {
        weightedSum += valNum * wNum;
        totalWeight += wNum;
      }
    });

    const target = parseFloat(targetAverage);
    const nextWeight = parseFloat(nextExamWeight);

    if (invalid || isNaN(target) || isNaN(nextWeight) || nextWeight <= 0) {
      setCalcResult({
        currentAvg: 0,
        needed: null,
        errorMsg: 'Por favor, insira números válidos maiores que zero em todas as notas e pesos!'
      });
      return;
    }

    if (totalWeight === 0) {
      setCalcResult({
        currentAvg: 0,
        needed: null,
        errorMsg: 'Insira pelo menos uma avaliação existente para realizar a estimativa.'
      });
      return;
    }

    const currentAvg = weightedSum / totalWeight;

    // Formula: (weightedSum + X * nextWeight) / (totalWeight + nextWeight) = target
    // weightedSum + X * nextWeight = target * totalWeight + target * nextWeight
    // X * nextWeight = target * totalWeight + target * nextWeight - weightedSum
    // X = (target * (totalWeight + nextWeight) - weightedSum) / nextWeight
    const needed = (target * (totalWeight + nextWeight) - weightedSum) / nextWeight;

    setCalcResult({
      currentAvg,
      needed: needed > 10 ? Math.min(needed, 100) : Math.max(0, needed)
    });

    onAwardXp(10, 'Metas Bimestrais simuladas! Planejamento de notas em dia.');
  };


  // --- READING WPM SPEED CALCULATOR ENGINE ---
  const [pasteText, setPasteText] = useState('');
  const [readingWpm, setReadingWpm] = useState('220');
  const [durationStats, setDurationStats] = useState<{ words: number; minutes: number } | null>(null);

  // Live typing WPM counters
  const [wpmTimerActive, setWpmTimerActive] = useState(false);
  const [wpmSeconds, setWpmSeconds] = useState(0);
  const [typedWords, setTypedWords] = useState('');
  const [liveWpmResult, setLiveWpmResult] = useState<number | null>(null);

  // Handle auto readings WPM
  const handleCalculateWpmStats = () => {
    soundEffects.playClick();
    const trimmed = pasteText.trim();
    if (!trimmed) {
      alert('Insira ou cole seu texto escolar para analisar!');
      return;
    }

    const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
    const speed = parseInt(readingWpm) || 220;
    const mins = wordCount / speed;

    setDurationStats({
      words: wordCount,
      minutes: parseFloat(mins.toFixed(1))
    });

    onAwardXp(12, `Métricas de Estudo: Leituras estimadas em ${mins.toFixed(1)}m!`);
  };

  // Live Timer speed test
  useEffect(() => {
    let t: NodeJS.Timeout | null = null;
    if (wpmTimerActive) {
      t = setInterval(() => {
        setWpmSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (t) clearInterval(t);
    };
  }, [wpmTimerActive]);

  const toggleWpmTimer = () => {
    soundEffects.playClick();
    if (wpmTimerActive) {
      // Pause/Calculate result
      setWpmTimerActive(false);
      const wordsCount = typedWords.trim().split(/\s+/).filter(Boolean).length;
      if (wordsCount > 0 && wpmSeconds > 2) {
        const calculatedWPM = Math.round((wordsCount / wpmSeconds) * 60);
        setLiveWpmResult(calculatedWPM);
        onAwardXp(25, `Excelente digitação! Seu ritmo registrado foi de ${calculatedWPM} WPM!`);
      }
    } else {
      // Start test
      setWpmTimerActive(true);
      setWpmSeconds(0);
      setTypedWords('');
      setLiveWpmResult(null);
    }
  };

  const handleResetWpmTimer = () => {
    soundEffects.playError();
    setWpmTimerActive(false);
    setWpmSeconds(0);
    setTypedWords('');
    setLiveWpmResult(null);
  };

  return (
    <div id="school-utility-workspace" className="p-4 bg-slate-50/50 min-h-screen select-none">
      
      {/* Dynamic Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <Wand2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-sm tracking-tight">Kit de Ferramentas Escolares Acadêmicas</h2>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed max-w-xl">
              Diversos utilitários integrados para impulsionar suas sessões de estudo: sons relaxantes, simulações de notas bimestrais e testes de produtividade de leitura.
            </p>
          </div>
        </div>

        {/* Short tools navigation pills */}
        <div className="flex bg-slate-100 p-1.5 rounded-lg gap-1 shrink-0">
          <button
            id="subtool-tab-ambient"
            onClick={() => { setActiveSubTool('ambient'); soundEffects.playClick(); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeSubTool === 'ambient' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Sons Focus</span>
          </button>
          
          <button
            id="subtool-tab-grades"
            onClick={() => { setActiveSubTool('grades'); soundEffects.playClick(); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeSubTool === 'grades' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Média Acadêmica</span>
          </button>

          <button
            id="subtool-tab-wpm"
            onClick={() => { setActiveSubTool('wpm'); soundEffects.playClick(); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeSubTool === 'wpm' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Ritmo de Leitura</span>
          </button>
        </div>
      </div>

      {/* RENDER ACTIVE SUB UTILITY INTERACTIVE PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* LEFT COMPACT INFO PANEL (4 COLS) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-850 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] opacity-5 pointer-events-none" />
            <span className="text-[9px] font-extrabold text-blue-400 bg-blue-950 px-2 py-0.5 rounded-md border border-blue-900/50 uppercase tracking-widest leading-none block w-max mb-3">
              DICAS DE ESTUDO
            </span>

            {activeSubTool === 'ambient' && (
              <div>
                <h4 className="font-bold text-xs text-slate-200 mb-2">Por que sons ambientais ajudam?</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                  Eles camuflam ruídos intermitentes da sua casa (carros, conversas). O Ruído Marrom atenua sons agudos com alta eficácia, estimulando as famosas ondas de hiperfoco no cérebro.
                </p>
                <div className="border-t border-slate-800/80 pt-2.5 text-[10px] text-slate-500 flex items-center gap-1.5 font-mono">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Sons gerados em tempo real na máquina!</span>
                </div>
              </div>
            )}

            {activeSubTool === 'grades' && (
              <div>
                <h4 className="font-bold text-xs text-slate-200 mb-2">Planejamento das Provas Finais</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                  Evite surpresas no final do ano escolar. Calculando os pesos atribuídos pelas suas provas escolares, você saberá com precisão qual resultado focar em cada tema para aprovação limpa.
                </p>
                <div className="border-t border-slate-800/80 pt-2.5 text-[10px] text-slate-500 flex items-center gap-1.5 font-mono">
                  <Clock className="w-3 h-3 text-blue-400" />
                  <span>Calcule com base nos critérios de sua escola.</span>
                </div>
              </div>
            )}

            {activeSubTool === 'wpm' && (
              <div>
                <h4 className="font-bold text-xs text-slate-200 mb-2">Velocidade de Processamento</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                  Um leitor médio processa cerca de 200 a 250 palavras por minuto (WPM). Ao identificar sua velocidade e calibrá-la com o tempo livre disponível, você consegue planejar melhor a rotina de estudos.
                </p>
                <div className="border-t border-slate-800/80 pt-2.5 text-[10px] text-slate-500 flex items-center gap-1.5 font-mono">
                  <Wand2 className="w-3 h-3 text-yellow-400" />
                  <span>Treine expandindo seu campo de visão diário.</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT DETAIL PANEL FOR SUB UTILITIES (8 COLS) */}
        <div className="lg:col-span-8">
          
          {/* 1. FOCUS SOUNDS CABINET */}
          {activeSubTool === 'ambient' && (
            <div id="subtool-ambient-panel" className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col gap-4 animate-fade-in">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Gerador Síntetico de Áudio Coletivo</h3>
                <p className="text-xs text-slate-500 mt-0.5">Clique em qualquer ambiente para iniciar ou pausar. Ideal para usar com fones de ouvido integrados.</p>
              </div>

              {/* Grid selectors */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                
                {/* Brown Sound */}
                <div className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  playingNoise === 'brown' ? 'border-blue-500 bg-blue-50/10' : 'border-slate-200 hover:border-slate-350 bg-white'
                }`}>
                  <div>
                    <span className="text-[9px] font-extrabold uppercase bg-amber-50 border border-amber-200 text-amber-700 px-1.5 py-0.5 rounded-md">Deep Focus</span>
                    <h4 className="font-bold text-slate-800 text-xs mt-3">Ruído Marrom Estável</h4>
                    <p className="text-[10px] text-slate-450 mt-1 leading-normal">Frequência profunda isolante para amortecer distrações ruidosas do ambiente.</p>
                  </div>
                  
                  <button
                    id="play-sound-brown"
                    onClick={() => handleToggleNoise('brown')}
                    className={`mt-4 w-full py-1.5 rounded-md text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      playingNoise === 'brown' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-705 hover:bg-slate-200'
                    }`}
                  >
                    {playingNoise === 'brown' ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-white" />
                        <span>Pausar</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-slate-705" />
                        <span>Play</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Simulated Rain/Waves */}
                <div className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  playingNoise === 'rain' ? 'border-emerald-500 bg-emerald-50/10' : 'border-slate-200 hover:border-slate-350 bg-white'
                }`}>
                  <div>
                    <span className="text-[9px] font-extrabold uppercase bg-emerald-50 border border-emerald-200 text-emerald-700 px-1.5 py-0.5 rounded-md">Natureza Coz</span>
                    <h4 className="font-bold text-slate-800 text-xs mt-3">Chuva & Sopros de Vento</h4>
                    <p className="text-[10px] text-slate-450 mt-1 leading-normal">Filtro modulado imitando o ritmo analógico de ondas de chuva intermitentes.</p>
                  </div>
                  
                  <button
                    id="play-sound-rain"
                    onClick={() => handleToggleNoise('rain')}
                    className={`mt-4 w-full py-1.5 rounded-md text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      playingNoise === 'rain' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-705 hover:bg-slate-200'
                    }`}
                  >
                    {playingNoise === 'rain' ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-white" />
                        <span>Pausar</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-slate-705" />
                        <span>Play</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Binaural Beats */}
                <div className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  playingNoise === 'binaural' ? 'border-purple-500 bg-purple-50/10' : 'border-slate-200 hover:border-slate-350 bg-white'
                }`}>
                  <div>
                    <span className="text-[9px] font-extrabold uppercase bg-purple-50 border border-purple-200 text-purple-705 px-1.5 py-0.5 rounded-md">Neuro-Tuning</span>
                    <h4 className="font-bold text-slate-800 text-xs mt-3">Ondas Binaurais (Alpha)</h4>
                    <p className="text-[10px] text-slate-450 mt-1 leading-normal">Tons de baixa frequência que estimulam o foco mental e as sinapses cognitivas.</p>
                  </div>
                  
                  <button
                    id="play-sound-binaural"
                    onClick={() => handleToggleNoise('binaural')}
                    className={`mt-4 w-full py-1.5 rounded-md text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      playingNoise === 'binaural' ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-100 text-slate-705 hover:bg-slate-200'
                    }`}
                  >
                    {playingNoise === 'binaural' ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-white" />
                        <span>Pausar</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-slate-705" />
                        <span>Play</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Master Volume Sliders */}
              <div className="mt-2 bg-slate-50 p-3 rounded-xl border border-slate-150 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  {volume === 0 ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-slate-600" />}
                  <span className="text-xs font-bold text-slate-650">Volume do Ruído de Estudo:</span>
                </div>
                <div className="flex items-center gap-3 flex-1 max-w-xs">
                  <input
                    id="noise-volume-slider"
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <span className="text-xs font-mono font-bold text-slate-500 w-8 text-right">{Math.round(volume * 100)}%</span>
                </div>
              </div>
            </div>
          )}

          {/* 2. SCHOOL GRADES CALCULATOR */}
          {activeSubTool === 'grades' && (
            <div id="subtool-grades-panel" className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col gap-4 animate-fade-in select-text">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Previsão e Simulador Acadêmico</h3>
                <p className="text-xs text-slate-400 mt-0.5">Informe as notas que você já recebeu e descubra o valor necessário para a última prova.</p>
              </div>

              <form onSubmit={calculateTargetGrade} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <div className="grid grid-cols-12 gap-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-1">
                    <span className="col-span-1">#</span>
                    <span className="col-span-6">NOTA DA AVALIAÇÃO</span>
                    <span className="col-span-4">PESO DA AVALIAÇÃO</span>
                    <span className="col-span-1 text-center">EXCLUIR</span>
                  </div>

                  {currentGrades.map((gradeObj, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-3 items-center">
                      <span className="col-span-1 font-mono text-xs font-bold text-slate-400">{idx + 1}</span>
                      
                      <input
                        id={`grade-val-${idx}`}
                        type="text"
                        placeholder="Ex: 7.5"
                        value={gradeObj.value}
                        onChange={(e) => handleUpdateGrade(idx, 'value', e.target.value)}
                        className="col-span-6 border border-slate-200 focus:border-blue-500 rounded-md p-1.5 text-xs focus:outline-hidden"
                      />

                      <input
                        id={`grade-wt-${idx}`}
                        type="number"
                        min="1"
                        max="20"
                        placeholder="Peso"
                        value={gradeObj.weight}
                        onChange={(e) => handleUpdateGrade(idx, 'weight', e.target.value)}
                        className="col-span-4 border border-slate-200 focus:border-blue-500 rounded-md p-1.5 text-xs focus:outline-hidden"
                      />

                      <button
                        type="button"
                        id={`btn-remove-grade-${idx}`}
                        disabled={currentGrades.length <= 1}
                        onClick={() => handleRemoveGradeInput(idx)}
                        className="col-span-1 text-red-500 hover:bg-red-50 py-1.5 rounded-md text-xs font-bold disabled:opacity-30 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    id="btn-add-grade"
                    onClick={handleAddGradeInput}
                    className="mt-1 w-max bg-slate-100 hover:bg-slate-200 text-slate-705 font-bold text-xs px-3 py-1.5 rounded-lg border border-slate-250 border-dashed cursor-pointer"
                  >
                    + Adicionar Nota Adicional
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">MÉDIA DE CORTE ESCOLAR DESEJADA</label>
                    <input
                      id="target-grade-average"
                      type="text"
                      value={targetAverage}
                      onChange={(e) => setTargetAverage(e.target.value)}
                      className="w-full text-xs border border-slate-200 focus:border-blue-500 rounded-md p-2 focus:outline-hidden bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">PESO DA PRÓXIMA PROVA/ATIVIDADE FINAL</label>
                    <input
                      id="next-exam-weight"
                      type="number"
                      min="1"
                      max="20"
                      value={nextExamWeight}
                      onChange={(e) => setNextExamWeight(e.target.value)}
                      className="w-full text-xs border border-slate-200 focus:border-blue-500 rounded-md p-2 focus:outline-hidden bg-slate-50"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  id="btn-trigger-grading"
                  className="w-full inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 rounded-lg cursor-pointer transition-all active:scale-[0.99]"
                >
                  <Calculator className="w-4 h-4" />
                  <span>Calcular Planejamento de Notas</span>
                </button>
              </form>

              {/* CALC RESULT BLOCK */}
              <AnimatePresence>
                {calcResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-4 rounded-xl border mt-1 select-none"
                    style={{
                      borderColor: calcResult.errorMsg ? '#fecaca' : '#bfdbfe',
                      backgroundColor: calcResult.errorMsg ? '#fef2f2' : '#f0f9ff'
                    }}
                  >
                    {calcResult.errorMsg ? (
                      <div className="flex gap-2 items-start text-red-700">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span className="text-xs font-bold">{calcResult.errorMsg}</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                        <div>
                          <span className="text-[10px] text-slate-450 uppercase font-bold">Média Atual Registrada</span>
                          <div className="text-2xl font-bold font-mono text-slate-800">{calcResult.currentAvg.toFixed(2)}</div>
                          <p className="text-[10px] text-slate-500 mt-1 leading-normal">Resultado ponderado de todas as avaliações feitas até o momento.</p>
                        </div>

                        <div className="border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-4">
                          <span className="text-[10px] text-blue-600 uppercase font-bold block mb-1">Nota necessária na próxima prova:</span>
                          <div className={`text-2xl font-bold font-mono ${calcResult.needed && calcResult.needed > 10 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {calcResult.needed !== null ? calcResult.needed.toFixed(1) : 'Calculando...'}
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                            {calcResult.needed && calcResult.needed > 10 
                              ? '⚠️ Atenção: A nota necessária ultrapassa 10. Você precisará de pontuações de bônus ou notas extras.' 
                              : `Você precisará alcançar esta média na avaliação final de peso ${nextExamWeight} para ser aprovado sem provações!`}
                          </p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* 3. READING TRACKER / WPM ENGINE */}
          {activeSubTool === 'wpm' && (
            <div id="subtool-wpm-panel" className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col gap-4 animate-fade-in select-text">
              
              {/* Box 1: ESTIMATOR COPIER */}
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Estimando Linha de Tempo de Estudo</h3>
                <p className="text-xs text-slate-400 mt-0.5">Cole seu artigo científico ou capítulo escolar no campo abaixo para descobrir quanto tempo a leitura exigirá.</p>
              </div>

              <div className="flex flex-col gap-3">
                <textarea
                  id="wpm-text-copier"
                  rows={4}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="Cole seu texto de biologia, medicina, física para calcular os minutos..."
                  className="w-full text-xs border border-slate-200 focus:border-blue-500 rounded-md p-2 focus:outline-hidden resize-none font-sans"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600 select-none">Velocidade de Leitura:</span>
                    <select
                      id="wpm-speed-selector"
                      value={readingWpm}
                      onChange={(e) => setReadingWpm(e.target.value)}
                      className="border border-slate-200 rounded-md p-1.5 text-xs bg-white focus:outline-hidden font-bold select-none text-blue-600"
                    >
                      <option value="150">Lenta (150 WPM)</option>
                      <option value="220">Média Humana (220 WPM)</option>
                      <option value="350">Rápida/Dinâmica (350 WPM)</option>
                      <option value="500">Hiperleitura (500 WPM)</option>
                    </select>
                  </div>

                  <button
                    id="btn-trigger-reading-wpm"
                    onClick={handleCalculateWpmStats}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1 shrink-0 select-none"
                  >
                    <span>Medir Tempo Estimado</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Show Stats result */}
                <AnimatePresence>
                  {durationStats && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="bg-slate-50 border border-slate-200 p-3 rounded-xl grid grid-cols-2 gap-4 text-center select-none"
                    >
                      <div className="border-r border-slate-200">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Total de palavras em análise</span>
                        <div className="text-xl font-bold font-mono text-slate-850 mt-0.5">{durationStats.words}</div>
                      </div>

                      <div>
                        <span className="text-[10px] text-blue-650 uppercase font-bold">Tempo médio estimado</span>
                        <div className="text-xl font-bold font-mono text-blue-600 mt-0.5">{durationStats.minutes} minutos</div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Box 2: SPEED TEST TYPING CHALLENGE */}
              <div className="border-t border-slate-150 pt-4.5 mt-2 flex flex-col gap-3">
                <div>
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">⏱️ Desafio / Teste o seu Ritmo Próprio de Digitação</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Inicie o cronômetro e digite o que está estudando no campo abaixo para descobrir seu potencial de palavras por minuto (WPM) em tempo real!</p>
                </div>

                <div className="flex flex-col gap-3">
                  {/* Digital timer */}
                  <div className="flex items-center justify-between bg-slate-100 p-2.5 rounded-lg border border-slate-200 select-none">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span className="text-xs font-bold text-slate-650">Cronômetro de Digitação:</span>
                    </div>
                    <span className="font-mono text-base font-bold text-slate-800 bg-white border border-slate-200/80 px-2.5 py-0.5 rounded-md">
                      {wpmSeconds} segundos
                    </span>
                  </div>

                  <textarea
                    id="typing-test-input"
                    rows={3}
                    disabled={!wpmTimerActive}
                    value={typedWords}
                    onChange={(e) => setTypedWords(e.target.value)}
                    placeholder={wpmTimerActive ? "Escreva livremente o seu resumo acadêmico ou digite o texto de teste..." : "Clique em 'Iniciar Teste' para liberar a escrita e o relógio..."}
                    className="w-full text-xs border border-slate-200 focus:border-blue-500 rounded-md p-2 focus:outline-hidden resize-none bg-slate-50/50"
                  />

                  {/* Operational controls */}
                  <div className="flex items-center gap-2 select-none">
                    <button
                      id="btn-toggle-wpm-test"
                      onClick={toggleWpmTimer}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        wpmTimerActive ? 'bg-amber-600 text-white hover:bg-amber-700' : 'bg-slate-900 hover:bg-slate-850 text-white'
                      }`}
                    >
                      {wpmTimerActive ? (
                        <>
                          <Pause className="w-3.5 h-3.5" />
                          <span>Finalizar / Calcular WPM</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-white text-white" />
                          <span>Iniciar Teste</span>
                        </>
                      )}
                    </button>

                    <button
                      id="btn-reset-wpm-test"
                      onClick={handleResetWpmTimer}
                      className="border border-slate-200 text-slate-400 hover:text-red-500 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer bg-white"
                    >
                      Resetar
                    </button>
                  </div>

                  {/* Show live typing test stats */}
                  <AnimatePresence>
                    {liveWpmResult !== null && (
                      <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="bg-purple-50 p-4 rounded-xl border border-purple-200 flex items-center justify-between text-center select-none"
                      >
                        <div>
                          <span className="text-[10px] text-purple-600 uppercase font-bold tracking-widest block leading-none mb-1">Ritmo Alcançado</span>
                          <span className="text-3xl font-bold font-mono text-purple-800">{liveWpmResult} <span className="text-sm font-sans font-bold text-purple-600">WPM</span></span>
                        </div>

                        <div className="text-right text-[11px] text-slate-650 max-w-sm leading-normal italic">
                          "{liveWpmResult > 200 ? 'Velocidade excelente! Você escreve em um ritmo ideal para registrar notas rápidas!' : 'Excelente progresso! O treino regular e os resumos contínuos aumentarão sua fluência natural!'}"
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
