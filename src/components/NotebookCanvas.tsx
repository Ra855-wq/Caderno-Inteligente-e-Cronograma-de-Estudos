/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { Notebook, Stroke, Point, PaperType, ToolType } from '../types';
import { 
  ChevronLeft, ChevronRight, Plus, RotateCcw, Paintbrush, 
  Trash2, Download, FileText, LayoutGrid, CircleDot, FileLineChart, HelpCircle,
  UndoIcon, RedoIcon, Sparkles, Check
} from 'lucide-react';
import { motion } from 'motion/react';
import { soundEffects } from '../utils/audio';

interface NotebookCanvasProps {
  notebooks: Notebook[];
  activeNotebookId: string;
  onUpdateNotebooks: (notebooks: Notebook[]) => void;
  onAwardXp: (xp: number, message: string) => void;
}

const PRESET_COLORS = [
  { hex: '#000000', name: 'Preto Klas', dark: '#ffffff' },
  { hex: '#1e293b', name: 'Grafite', dark: '#e2e8f0' },
  { hex: '#ef4444', name: 'Urgente Red', dark: '#fca5a5' },
  { hex: '#3b82f6', name: 'Azul Caneta', dark: '#93c5fd' },
  { hex: '#10b981', name: 'Esmeralda', dark: '#6ee7b7' },
  { hex: '#8b5cf6', name: 'Púrpura', dark: '#c084fc' },
  { hex: '#f59e0b', name: 'Âmbar', dark: '#fcd34d' }
];

const PRESET_HIGHLIGHT_COLORS = [
  { hex: 'rgba(253, 224, 71, 0.45)', name: 'Marca-texto Amarelo' },
  { hex: 'rgba(147, 197, 253, 0.45)', name: 'Marca-texto Azul' },
  { hex: 'rgba(167, 243, 208, 0.45)', name: 'Marca-texto Verde' },
  { hex: 'rgba(244, 143, 177, 0.45)', name: 'Marca-texto Rosa' }
];

export default function NotebookCanvas({ notebooks, activeNotebookId, onUpdateNotebooks, onAwardXp }: NotebookCanvasProps) {
  const activeNotebook = notebooks.find(nb => nb.id === activeNotebookId) || notebooks[0];
  const currentPage = activeNotebook?.pages[activeNotebook.currentPageIndex] || activeNotebook?.pages[0];

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolType>('pen');
  const [penColor, setPenColor] = useState('#3b82f6'); // Royal blue default
  const [highlighterColor, setHighlighterColor] = useState('rgba(253, 224, 71, 0.45)'); // Yellow default
  const [brushSize, setBrushSize] = useState(4); // default thin-medium
  const [highlighterSize, setHighlighterSize] = useState(16);
  const [eraserSize, setEraserSize] = useState(25);
  const [usePressure, setUsePressure] = useState(true);
  const [palmRejection, setPalmRejection] = useState(false);
  const [pressureMultiplier, setPressureMultiplier] = useState(1.5);
  const [pencilDetected, setPencilDetected] = useState(false);
  const [livePressure, setLivePressure] = useState<number | null>(null);

  // Undo / Redo history local cache for this exact page
  const [redoStack, setRedoStack] = useState<Stroke[]>([]);
  const [strokeCountThisClick, setStrokeCountThisClick] = useState(0);

  // Get current state context values
  const strokes = currentPage?.strokes || [];
  const currentBg = currentPage?.bgType || 'ruled';

  // Resize canvas safely fitting parent container card
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * 1.5; // High DPI sizing
      canvas.height = Math.max(700, rect.height) * 1.5;
      redrawCanvas();
    };

    window.addEventListener('resize', handleResize);
    // Dynamic slight delays to let transitions settle
    const timer = setTimeout(handleResize, 150);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [currentPage?.id, currentBg]);

  // Redraw hook whenever strokes or background structure shifts
  useEffect(() => {
    redrawCanvas();
  }, [strokes, currentBg, activeTool]);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw Paper background
    drawPaperBackground(ctx, canvas.width, canvas.height);

    // 2. Draw all saved vector strokes
    strokes.forEach(stroke => {
      if (stroke.points.length === 0) return;

      ctx.beginPath();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Setup specific brush composite modes
      if (stroke.tool === 'highlighter') {
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.size * 1.5;
        ctx.globalAlpha = 1.0;
        ctx.globalCompositeOperation = 'multiply';
      } else {
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.size * 1.5; // scaling for high DPI
        ctx.globalAlpha = 1.0;
        ctx.globalCompositeOperation = 'source-over';
      }

      const p0 = stroke.points[0];
      ctx.moveTo(p0.x * 1.5, p0.y * 1.5);

      if (stroke.points.length === 1) {
        ctx.lineTo(p0.x * 1.5 + 0.1, p0.y * 1.5);
        ctx.stroke();
      } else {
        for (let i = 1; i < stroke.points.length; i++) {
          const pt = stroke.points[i];
          ctx.lineTo(pt.x * 1.5, pt.y * 1.5);
        }
        ctx.stroke();
      }
    });

    // Reset overlay operations
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1.0;
  };

  const drawPaperBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const isDark = currentBg === 'dark-slate';
    
    // Background filling
    if (isDark) {
      ctx.fillStyle = '#0f172a'; // Slate-900 night mode
    } else {
      ctx.fillStyle = '#ffffff'; // Pristine clean white paper
    }
    ctx.fillRect(0, 0, width, height);

    ctx.lineWidth = 1;

    if (currentBg === 'ruled') {
      const lineGap = 42;
      const marginWidth = 120;

      // Draw horizontal lines
      ctx.strokeStyle = isDark ? '#1e293b' : '#e2e8f0';
      for (let y = lineGap * 2.5; y < height; y += lineGap) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Left red study margin line
      ctx.strokeStyle = isDark ? '#475569' : '#fecaca'; // soft pink margin
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(marginWidth, 0);
      ctx.lineTo(marginWidth, height);
      ctx.stroke();

    } else if (currentBg === 'grid') {
      const gridSize = 36;
      ctx.strokeStyle = isDark ? '#1e293b' : '#f1f5f9';
      
      // Vertical grid
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      
      // Horizontal grid
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

    } else if (currentBg === 'dots') {
      const dotSpacing = 30;
      ctx.fillStyle = isDark ? '#334155' : '#cbd5e1';
      
      for (let x = dotSpacing; x < width; x += dotSpacing) {
        for (let y = dotSpacing; y < height; y += dotSpacing) {
          ctx.beginPath();
          ctx.arc(x, y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  };

  // Convert client cursor coords into relative canvas coordinate space
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * (canvas.width / 1.5);
    const y = ((e.clientY - rect.top) / rect.height) * (canvas.height / 1.5);
    const pressure = e.pressure !== undefined && e.pressure > 0 ? e.pressure : 0.5;

    return { x, y, pressure };
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    const isPen = e.pointerType === 'pen';
    if (isPen) {
      setPencilDetected(true);
    }

    // Strict Stylus/Apple Pencil mode palm rejection
    if (palmRejection && !isPen) {
      return;
    }

    canvasRef.current?.setPointerCapture(e.pointerId);

    const coords = getCanvasCoords(e);
    setIsDrawing(true);

    if (isPen) {
      setLivePressure(coords.pressure || 0.5);
    }

    if (activeTool === 'eraser') {
      eraseStrokesAt(coords);
    } else {
      soundEffects.playClick();
      // Start a fresh drawing stroke
      const sizeDetermined = activeTool === 'pen' ? brushSize : highlighterSize;
      const colorDetermined = activeTool === 'pen' ? penColor : highlighterColor;

      // Handle custom scaled pressure sensitivity
      const strokeSize = usePressure && isPen
        ? sizeDetermined * (coords.pressure ? coords.pressure * pressureMultiplier : 1)
        : sizeDetermined;

      const newStroke: Stroke = {
        id: 'stroke-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        tool: activeTool,
        color: colorDetermined,
        size: strokeSize,
        points: [coords]
      };

      // Push into current page state
      const updatedNotebooks = notebooks.map(nb => {
        if (nb.id === activeNotebook.id) {
          const updatedPages = nb.pages.map((p, idx) => {
            if (idx === nb.currentPageIndex) {
              return { ...p, strokes: [...p.strokes, newStroke] };
            }
            return p;
          });
          return { ...nb, pages: updatedPages };
        }
        return nb;
      });

      onUpdateNotebooks(updatedNotebooks);
      // Clean stack of redos
      setRedoStack([]);
    }
  };

  const drawMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();

    const isPen = e.pointerType === 'pen';
    if (palmRejection && !isPen) {
      return;
    }

    const coords = getCanvasCoords(e);
    if (isPen) {
      setLivePressure(coords.pressure || 0.5);
    }

    if (activeTool === 'eraser') {
      eraseStrokesAt(coords);
    } else {
      // Append coordinates point to current stroke (last element)
      const updatedNotebooks = notebooks.map(nb => {
        if (nb.id === activeNotebook.id) {
          const updatedPages = nb.pages.map((p, idx) => {
            if (idx === nb.currentPageIndex) {
              const lastStroke = p.strokes[p.strokes.length - 1];
              if (!lastStroke) return p;

              // Incorporate dynamic pressure variance with user-defined multiplier scales
              const currentSize = usePressure && isPen
                ? (activeTool === 'pen' ? brushSize : highlighterSize) * (coords.pressure ? coords.pressure * pressureMultiplier : 1)
                : lastStroke.size;

              const updatedStrokes = [...p.strokes];
              updatedStrokes[updatedStrokes.length - 1] = {
                ...lastStroke,
                size: (lastStroke.size * 0.8 + currentSize * 0.2), // smooth sizes
                points: [...lastStroke.points, coords]
              };

              return { ...p, strokes: updatedStrokes };
            }
            return p;
          });
          return { ...nb, pages: updatedPages };
        }
        return nb;
      });

      onUpdateNotebooks(updatedNotebooks);
    }
  };

  const stopDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    canvasRef.current?.releasePointerCapture(e.pointerId);
    setIsDrawing(false);
    setLivePressure(null);

    // Increment stroke tracker for gamification reward quests
    if (activeTool !== 'eraser') {
      const nextStrokeSession = strokeCountThisClick + 1;
      setStrokeCountThisClick(nextStrokeSession);

      if (nextStrokeSession === 5) {
        onAwardXp(30, 'Quest concluída: Desenho ativo no Caderno!');
      }
    }
  };

  // Solid, vector-based proximity eraser
  const eraseStrokesAt = (pos: Point) => {
    let strokeRemoved = false;
    const threshPixel = eraserSize * 1.2;

    const updatedPages = activeNotebook.pages.map((p, idx) => {
      if (idx === activeNotebook.currentPageIndex) {
        const filteredStrokes = p.strokes.filter(stroke => {
          // Check if any point in this stroke is within eraser radius
          const strokeIntersect = stroke.points.some(pt => {
            const dx = pt.x - pos.x;
            const dy = pt.y - pos.y;
            return Math.sqrt(dx*dx + dy*dy) < threshPixel;
          });

          if (strokeIntersect) strokeRemoved = true;
          return !strokeIntersect;
        });

        return { ...p, strokes: filteredStrokes };
      }
      return p;
    });

    if (strokeRemoved) {
      soundEffects.playClick();
      const updatedNotebooks = notebooks.map(nb => {
        if (nb.id === activeNotebook.id) {
          return { ...nb, pages: updatedPages };
        }
        return nb;
      });
      onUpdateNotebooks(updatedNotebooks);
    }
  };

  // Undo stroke
  const handleUndo = () => {
    if (strokes.length === 0) return;
    const targetStroke = strokes[strokes.length - 1];
    setRedoStack(prev => [...prev, targetStroke]);

    const updatedNotebooks = notebooks.map(nb => {
      if (nb.id === activeNotebook.id) {
        const updatedPages = nb.pages.map((p, idx) => {
          if (idx === nb.currentPageIndex) {
            return { ...p, strokes: p.strokes.slice(0, p.strokes.length - 1) };
          }
          return p;
        });
        return { ...nb, pages: updatedPages };
      }
      return nb;
    });

    onUpdateNotebooks(updatedNotebooks);
    soundEffects.playClick();
  };

  // Redo stroke
  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const targetStroke = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, prev.length - 1));

    const updatedNotebooks = notebooks.map(nb => {
      if (nb.id === activeNotebook.id) {
        const updatedPages = nb.pages.map((p, idx) => {
          if (idx === nb.currentPageIndex) {
            return { ...p, strokes: [...p.strokes, targetStroke] };
          }
          return p;
        });
        return { ...nb, pages: updatedPages };
      }
      return nb;
    });

    onUpdateNotebooks(updatedNotebooks);
    soundEffects.playClick();
  };

  const handleClearPage = () => {
    if (window.confirm('Deseja realmente apagar esta página inteira?')) {
      const updatedNotebooks = notebooks.map(nb => {
        if (nb.id === activeNotebook.id) {
          const updatedPages = nb.pages.map((p, idx) => {
            if (idx === nb.currentPageIndex) {
              return { ...p, strokes: [] };
            }
            return p;
          });
          return { ...nb, pages: updatedPages };
        }
        return nb;
      });

      onUpdateNotebooks(updatedNotebooks);
      setRedoStack([]);
      soundEffects.playError();
    }
  };

  // Navigating Notebook Pages
  const handlePrevPage = () => {
    if (activeNotebook.currentPageIndex > 0) {
      const updatedNotebooks = notebooks.map(nb => {
        if (nb.id === activeNotebook.id) {
          return { ...nb, currentPageIndex: nb.currentPageIndex - 1 };
        }
        return nb;
      });
      onUpdateNotebooks(updatedNotebooks);
      setRedoStack([]);
      soundEffects.playClick();
    }
  };

  const handleNextPage = () => {
    if (activeNotebook.currentPageIndex < activeNotebook.pages.length - 1) {
      const updatedNotebooks = notebooks.map(nb => {
        if (nb.id === activeNotebook.id) {
          return { ...nb, currentPageIndex: nb.currentPageIndex + 1 };
        }
        return nb;
      });
      onUpdateNotebooks(updatedNotebooks);
      setRedoStack([]);
      soundEffects.playClick();
    }
  };

  const handleAddPage = () => {
    const newPageId = 'page-' + Date.now();
    const newPage = {
      id: newPageId,
      title: `Nova Anotação ${activeNotebook.pages.length + 1}`,
      bgType: 'ruled' as PaperType,
      strokes: [],
      createdAt: new Date().toISOString()
    };

    const updatedNotebooks = notebooks.map(nb => {
      if (nb.id === activeNotebook.id) {
        return {
          ...nb,
          pages: [...nb.pages, newPage],
          currentPageIndex: nb.pages.length
        };
      }
      return nb;
    });

    onUpdateNotebooks(updatedNotebooks);
    setRedoStack([]);
    soundEffects.playQuestComplete();

    onAwardXp(15, 'Sua criatividade não tem limites! Nova página binder criada.');
  };

  const handleRenamePage = (newTitle: string) => {
    const updatedNotebooks = notebooks.map(nb => {
      if (nb.id === activeNotebook.id) {
        const updatedPages = nb.pages.map((p, idx) => {
          if (idx === nb.currentPageIndex) {
            return { ...p, title: newTitle };
          }
          return p;
        });
        return { ...nb, pages: updatedPages };
      }
      return nb;
    });
    onUpdateNotebooks(updatedNotebooks);
  };

  const handlePaperBgChange = (paper: PaperType) => {
    const updatedNotebooks = notebooks.map(nb => {
      if (nb.id === activeNotebook.id) {
        const updatedPages = nb.pages.map((p, idx) => {
          if (idx === nb.currentPageIndex) {
            return { ...p, bgType: paper };
          }
          return p;
        });
        return { ...nb, pages: updatedPages };
      }
      return nb;
    });
    onUpdateNotebooks(updatedNotebooks);
    soundEffects.playClick();
  };

  // Vector render download to PNG
  const handleExportPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    soundEffects.playQuestComplete();
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${activeNotebook?.title || 'caderno'}_p${(activeNotebook?.currentPageIndex || 0) + 1}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div id="notebook-root-editor" className="flex flex-col h-full bg-slate-50 relative overflow-hidden">
      {/* 1. Header toolbar */}
      <div className="bg-white border-b border-slate-200 px-4 py-2 flex flex-wrap items-center justify-between gap-3 shadow-2xs select-none">
        
        {/* Page / Binder Info */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 rounded-md">
            <span className="font-bold text-[10px] text-slate-500 font-mono">
              FÔLHA {activeNotebook.currentPageIndex + 1}/{activeNotebook.pages.length}
            </span>
          </div>
          <input 
            type="text" 
            value={currentPage?.title || ''} 
            onChange={(e) => handleRenamePage(e.target.value)}
            className="text-xs font-bold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 transition-colors focus:outline-hidden py-0.5 px-1 max-w-[140px] sm:max-w-[200px]"
            placeholder="Alterar título da página..."
          />
        </div>

        {/* Brush Tools Controller */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg gap-0.5">
          <button
            id="tool-pen"
            onClick={() => { setActiveTool('pen'); soundEffects.playClick(); }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold tracking-tight transition-all ${
              activeTool === 'pen' 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Paintbrush className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Caneta</span>
          </button>
          
          <button
            id="tool-highlighter"
            onClick={() => { setActiveTool('highlighter'); soundEffects.playClick(); }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold tracking-tight transition-all ${
              activeTool === 'highlighter' 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span className="relative flex h-3.5 w-3.5 items-center justify-center">
              <span className="absolute inline-flex h-full w-full rounded-full bg-yellow-450 opacity-60"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
            </span>
            <span className="hidden sm:inline">Marca-texto</span>
          </button>

          <button
            id="tool-eraser"
            onClick={() => { setActiveTool('eraser'); soundEffects.playClick(); }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold tracking-tight transition-all ${
              activeTool === 'eraser' 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span className="hidden sm:inline">Borracha</span>
          </button>
        </div>

        {/* Paper selector */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg gap-0.5">
          <button
            id="paper-ruled"
            title="Papel Pautado"
            onClick={() => handlePaperBgChange('ruled')}
            className={`p-1 rounded-md text-slate-500 transition-colors ${currentBg === 'ruled' ? 'bg-white text-slate-900 shadow-xs' : 'hover:bg-slate-200'}`}
          >
            <FileLineChart className="w-3.5 h-3.5" />
          </button>
          <button
            id="paper-grid"
            title="Papel Quadriculado"
            onClick={() => handlePaperBgChange('grid')}
            className={`p-1 rounded-md text-slate-500 transition-colors ${currentBg === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'hover:bg-slate-200'}`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            id="paper-dots"
            title="Papel Pontilhado"
            onClick={() => handlePaperBgChange('dots')}
            className={`p-1 rounded-md text-slate-500 transition-colors ${currentBg === 'dots' ? 'bg-white text-slate-900 shadow-xs' : 'hover:bg-slate-200'}`}
          >
            <CircleDot className="w-3.5 h-3.5" />
          </button>
          <button
            id="paper-blank"
            title="Papel Branco"
            onClick={() => handlePaperBgChange('blank')}
            className={`p-1 rounded-md text-slate-500 transition-colors ${currentBg === 'blank' ? 'bg-white text-slate-900 shadow-xs' : 'hover:bg-slate-200'}`}
          >
            <FileText className="w-3.5 h-3.5" />
          </button>
          <button
            id="paper-dark"
            title="Caderno Noite Escura"
            onClick={() => handlePaperBgChange('dark-slate')}
            className={`p-1 rounded-md text-slate-500 transition-colors ${currentBg === 'dark-slate' ? 'bg-white text-blue-600 shadow-xs' : 'hover:bg-slate-200'}`}
          >
            <span className="w-3.5 h-3.5 block rounded-sm bg-slate-900 border border-slate-600" />
          </button>
        </div>

        {/* Undo, Redo, Clear & Exports */}
        <div className="flex items-center gap-0.5">
          <button
            id="btn-undo"
            disabled={strokes.length === 0}
            onClick={handleUndo}
            title="Desfazer"
            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md disabled:opacity-40 transition-colors"
          >
            <UndoIcon className="w-3.5 h-3.5" />
          </button>
          <button
            id="btn-redo"
            disabled={redoStack.length === 0}
            onClick={handleRedo}
            title="Refazer"
            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md disabled:opacity-40 transition-colors"
          >
            <RedoIcon className="w-3.5 h-3.5" />
          </button>
          <button
            id="btn-clear-page"
            onClick={handleClearPage}
            title="Limpar tudo nesta folha"
            className="p-1 text-rose-500 hover:bg-rose-50 rounded-md transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <div className="w-[1px] h-4 bg-slate-200 mx-1" />
          <button
            id="btn-export-png"
            onClick={handleExportPng}
            title="Compartilhar / Baixar PNG"
            className="flex items-center gap-1 bg-blue-600 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-md hover:bg-blue-700 transition-all cursor-pointer shadow-xs"
          >
            <Download className="w-3 h-3" />
            <span>Exportar</span>
          </button>
        </div>
      </div>

      {/* 2. Sub-Toolbar tool configuration options (Colors/Thickness) */}
      <div className="bg-white border-b border-slate-200 px-4 py-2 flex flex-wrap items-center justify-between gap-4 gap-y-2 text-xs text-slate-600 shadow-2xs select-none">
        {/* Colors Palette */}
        {activeTool !== 'eraser' && (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Cores de Estudo:</span>
            <div className="flex items-center gap-1.5">
              {activeTool === 'pen' ? (
                // Solid Pen Colors
                PRESET_COLORS.map(color => {
                  const drawColor = currentBg === 'dark-slate' ? (color.dark || color.hex) : color.hex;
                  const isSelected = penColor === drawColor;
                  return (
                    <button
                      key={color.hex}
                      id={`pen-col-${color.hex}`}
                      style={{ backgroundColor: drawColor }}
                      onClick={() => { setPenColor(drawColor); soundEffects.playClick(); }}
                      className={`w-6 h-6 rounded-full border transition-transform relative ${
                        isSelected ? 'scale-115 border-slate-900 shadow-sm ring-2 ring-slate-100' : 'border-slate-200 hover:scale-105'
                      }`}
                      title={color.name}
                    >
                      {isSelected && (
                        <Check className="w-3 h-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white stroke-[3.5]" />
                      )}
                    </button>
                  );
                })
              ) : (
                // Highlighter Colors
                PRESET_HIGHLIGHT_COLORS.map(color => {
                  const isSelected = highlighterColor === color.hex;
                  return (
                    <button
                      key={color.hex}
                      id={`highl-col-${color.hex}`}
                      style={{ backgroundColor: color.hex }}
                      onClick={() => { setHighlighterColor(color.hex); soundEffects.playClick(); }}
                      className={`w-6 h-6 rounded-full border transition-transform relative ${
                        isSelected ? 'scale-115 border-slate-900 shadow-sm ring-2 ring-slate-100' : 'border-slate-200 hover:scale-105'
                      }`}
                      title={color.name}
                    >
                      {isSelected && (
                        <Check className="w-3 h-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-800 stroke-[3.5]" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Thickness Sliders */}
        <div className="flex items-center gap-4">
          {activeTool === 'pen' && (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Espessura:</span>
              <input
                id="pen-size-slider"
                type="range"
                min="1.5"
                max="12"
                step="0.5"
                value={brushSize}
                onChange={(e) => setBrushSize(parseFloat(e.target.value))}
                className="w-24 accent-slate-800"
              />
              <span className="w-6 font-mono font-bold text-center">{brushSize}px</span>
            </div>
          )}

          {activeTool === 'highlighter' && (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Largura do Marca-texto:</span>
              <input
                id="highl-size-slider"
                type="range"
                min="10"
                max="40"
                step="2"
                value={highlighterSize}
                onChange={(e) => setHighlighterSize(parseInt(e.target.value))}
                className="w-24 accent-slate-800"
              />
              <span className="w-8 font-mono font-bold text-center">{highlighterSize}px</span>
            </div>
          )}

          {activeTool === 'eraser' && (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Tamanho do Apagador:</span>
              <input
                id="eraser-size-slider"
                type="range"
                min="10"
                max="60"
                step="5"
                value={eraserSize}
                onChange={(e) => setEraserSize(parseInt(e.target.value))}
                className="w-24 accent-slate-800"
              />
              <span className="w-8 font-mono font-bold text-center">{eraserSize}px</span>
            </div>
          )}

          {/* Precision Settings */}
          <div className="flex items-center gap-3 select-none border-l border-slate-200 pl-4 flex-wrap gap-y-1">
            <div className="flex items-center gap-1.5 cursor-pointer">
              <input 
                type="checkbox" 
                id="pressure-chk"
                checked={usePressure} 
                onChange={() => { setUsePressure(!usePressure); soundEffects.playClick(); }}
                className="accent-blue-600 rounded-sm"
              />
              <label htmlFor="pressure-chk" className="text-[11px] font-bold text-slate-700 cursor-pointer">
                Sensibilidade de Traço (Mesa/Apple Pencil)
              </label>
            </div>

            {usePressure && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400 font-mono">Sensibilidade:</span>
                <input
                  id="pressure-scale-slider"
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.1"
                  value={pressureMultiplier}
                  onChange={(e) => setPressureMultiplier(parseFloat(e.target.value))}
                  className="w-16 accent-blue-600 h-1 cursor-pointer"
                />
                <span className="text-[10px] font-bold font-mono text-slate-500">{pressureMultiplier.toFixed(1)}x</span>
              </div>
            )}
            
            <div className="w-px h-3.5 bg-slate-200 ml-1" />
            
            {/* Palm Rejection Option (ignores touch while using Apple Pencil) */}
            <div className="flex items-center gap-1.5 cursor-pointer" title="Bloqueia comandos de toque do dedo para desenhar somente com a caneta">
              <input 
                type="checkbox" 
                id="palm-rejection-chk"
                checked={palmRejection} 
                onChange={() => { setPalmRejection(!palmRejection); soundEffects.playClick(); }}
                className="accent-blue-600 rounded-sm"
              />
              <label htmlFor="palm-rejection-chk" className="text-[11px] font-extrabold text-blue-600 cursor-pointer flex items-center gap-0.5">
                ✒️ Palm Rejection
              </label>
            </div>
          </div>
        </div>

        {/* Apple Pencil Real-time Diagnostics widget */}
        <div className="flex items-center gap-2">
          {pencilDetected ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded-md text-[10px] font-extrabold text-emerald-700 font-sans shadow-2xs">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shrink-0" />
              <span>Apple Pencil Ativo</span>
              {livePressure !== null && (
                <span className="font-mono font-bold bg-emerald-100 px-1 py-0.2 rounded-sm text-emerald-800 ml-1">
                  {Math.round(livePressure * 100)}%
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md" title="Ativa ao usar caneta ou mouse com suporte a ponteiro">
              <span>Caneta Aguardando...</span>
            </div>
          )}

          <div className="hidden lg:flex items-center text-slate-450 gap-1 text-[10px]">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Sensível à pressão.</span>
          </div>
        </div>
      </div>

      {/* 3. Outer Draw board canvas */}
      <div 
        ref={containerRef}
        id="canvas-canvas-container"
        className="flex-1 w-full relative overflow-y-auto min-h-[500px] h-[calc(100vh-190px)]"
      >
        <canvas
          ref={canvasRef}
          id="drawing-board-element"
          onPointerDown={startDrawing}
          onPointerMove={drawMove}
          onPointerUp={stopDrawing}
          className="absolute top-0 left-0 w-full cursor-crosshair touch-none select-none block"
          style={{ height: '1000px' }}
        />
      </div>

      {/* 4. Footer navigation pages controller */}
      <div className="bg-white border-t border-slate-200 px-4 py-2 flex items-center justify-between select-none">
        <button
          id="btn-nav-prev"
          disabled={activeNotebook.currentPageIndex === 0}
          onClick={handlePrevPage}
          className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold disabled:opacity-40 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Voltar</span>
        </button>

        <span className="text-slate-500 text-xs font-medium">
          {activeNotebook.title} · Pág. {activeNotebook.currentPageIndex + 1}
        </span>

        <div className="flex items-center gap-1.5">
          <button
            id="btn-nav-next"
            disabled={activeNotebook.currentPageIndex === activeNotebook.pages.length - 1}
            onClick={handleNextPage}
            className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold disabled:opacity-40 transition-colors cursor-pointer"
          >
            <span>Próxima</span>
            <ChevronRight className="w-4 h-4" />
          </button>
          
          <button
            id="btn-nav-add"
            onClick={handleAddPage}
            title="Adicionar página ao binder"
            className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Inserir Folha</span>
          </button>
        </div>
      </div>
    </div>
  );
}
