import React, { useState } from 'react';
import { Player, Course, Game } from '../types';
import { MapPin, Calendar, RotateCcw, CheckCircle, AlertTriangle, ChevronLeft, Plus, Minus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LiveTabProps {
  activeGame: Game | null;
  courses: Course[];
  players: Player[];
  onStartGame: (courseId: string, p1Name: string, p2Name: string, date?: string) => void;
  onUpdateScores: (
    holeIndex: number, 
    p1Score: number, 
    p2Score: number,
    p1Shots?: number,
    p1Putts?: number,
    p2Shots?: number,
    p2Putts?: number
  ) => void;
  onCompleteGame: () => void;
  onAbandonGame: () => void;
  onUpdatePlayers: (p1Name: string, p2Name: string) => void;
  onUpdateActiveGameMeta: (courseId: string, date?: string) => void;
  onUpdateCurrentHole?: (holeIndex: number) => void;
}

const getPlayerShortName = (name: string) => {
  if (!name) return '';
  const cleaned = name.trim();
  if (cleaned.length <= 2) return cleaned.toUpperCase();
  return cleaned.slice(0, 2).toUpperCase();
};

const getHoleScoreColorClass = (score: number, par: number) => {
  if (score === 0) return 'text-slate-300';
  const diff = score - par;
  if (diff < -1) return 'text-amber-500 font-extrabold'; // Eagle+
  if (diff === -1) return 'text-rose-500 font-extrabold'; // Birdie
  if (diff === 0) return 'text-[#008251] font-black'; // Par
  if (diff === 1) return 'text-blue-500 font-bold'; // Bogey
  return 'text-slate-700 font-bold'; // Double Bogey+
};

const getFormattedDate = (isoStr?: string) => {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (e) {
    return '';
  }
};

const getHoleScoreBgColorClass = (score: number, par: number) => {
  if (score === 0) return 'bg-slate-50 border-slate-200 text-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-emerald-100';
  const diff = score - par;
  if (diff < -1) return 'bg-amber-100 border-amber-300 text-amber-800 focus:bg-white focus:border-amber-500 focus:ring-amber-100'; // Eagle or Better
  if (diff === -1) return 'bg-rose-100 border-rose-300 text-rose-800 focus:bg-white focus:border-rose-500 focus:ring-rose-100'; // Birdie
  if (diff === 0) return 'bg-emerald-50 border-emerald-300 text-emerald-800 focus:bg-white focus:border-emerald-500 focus:ring-emerald-100'; // Par
  if (diff === 1) return 'bg-blue-50 border-blue-300 text-blue-800 focus:bg-white focus:border-blue-500 focus:ring-blue-100'; // Bogey
  return 'bg-slate-100 border-slate-300 text-slate-700 focus:bg-white focus:border-slate-500 focus:ring-slate-100'; // Double Bogey or Worse
};

const renderHoleScoreBadge = (score: number, par: number) => {
  if (score === 0) {
    return <span className="text-slate-300 font-bold">-</span>;
  }
  const diff = score - par;
  if (diff === 0) {
    return <span className="text-slate-800 font-extrabold text-[10px] sm:text-sm">E</span>;
  }
  if (diff === -1) {
    return (
      <div className="w-[21px] h-[21px] xs:w-6 xs:h-6 sm:w-8 sm:h-8 min-w-[21px] min-h-[21px] xs:min-w-[24px] xs:min-h-[24px] sm:min-w-[32px] sm:min-h-[32px] shrink-0 aspect-square rounded-full border border-rose-500 text-rose-500 flex items-center justify-center mx-auto text-[9px] xs:text-[10px] sm:text-xs font-black bg-rose-50/40">
        -1
      </div>
    );
  }
  if (diff <= -2) {
    return (
      <div className="w-[21px] h-[21px] xs:w-6 xs:h-6 sm:w-8 sm:h-8 min-w-[21px] min-h-[21px] xs:min-w-[24px] xs:min-h-[24px] sm:min-w-[32px] sm:min-h-[32px] shrink-0 aspect-square rounded-full border-2 sm:border-4 sm:border-double border-rose-600 text-rose-600 flex items-center justify-center mx-auto text-[9px] xs:text-[10px] sm:text-xs font-black bg-rose-50/40">
        {diff}
      </div>
    );
  }
  if (diff === 1) {
    return (
      <div className="w-[21px] h-[21px] xs:w-6 xs:h-6 sm:w-8 sm:h-8 min-w-[21px] min-h-[21px] xs:min-w-[24px] xs:min-h-[24px] sm:min-w-[32px] sm:min-h-[32px] shrink-0 aspect-square border border-slate-400 text-slate-700 flex items-center justify-center mx-auto text-[9px] xs:text-[10px] sm:text-xs font-black rounded-none bg-slate-50">
        1
      </div>
    );
  }
  if (diff >= 2) {
    return (
      <div className="w-[21px] h-[21px] xs:w-6 xs:h-6 sm:w-8 sm:h-8 min-w-[21px] min-h-[21px] xs:min-w-[24px] xs:min-h-[24px] sm:min-w-[32px] sm:min-h-[32px] shrink-0 aspect-square border-2 sm:border-4 sm:border-double border-slate-500 text-slate-800 flex items-center justify-center mx-auto text-[9px] xs:text-[10px] sm:text-xs font-black rounded-none bg-slate-50/80">
        {diff}
      </div>
    );
  }
  return <span className="text-slate-800 font-black text-[10px] sm:text-xs">{score}</span>;
};

const getRelativeScoreLabel = (scores: number[], pars: number[]) => {
  let playedScoresSum = 0;
  let playedParsSum = 0;
  let playedCount = 0;

  scores.forEach((s, idx) => {
    if (s > 0) {
      playedScoresSum += s;
      playedParsSum += pars[idx];
      playedCount++;
    }
  });

  if (playedCount === 0) return '';
  const diff = playedScoresSum - playedParsSum;
  if (diff === 0) return 'E';
  return `${diff}`;
};

const getRelativeScoreStyle = (label: string) => {
  if (label === 'E') return 'text-[#008251] font-black';
  if (label.startsWith('-')) return 'text-rose-600 font-black';
  return 'text-slate-600 font-bold';
};

export const LiveTab: React.FC<LiveTabProps> = ({
  activeGame,
  courses,
  players,
  onStartGame,
  onUpdateScores,
  onCompleteGame,
  onAbandonGame,
  onUpdateActiveGameMeta,
  onUpdateCurrentHole
}) => {
  const [selectedCourseId, setSelectedCourseId] = useState<string>(() => {
    return activeGame?.courseId || courses[0]?.id || '';
  });

  const [playDate, setPlayDate] = useState<string>(() => {
    if (activeGame?.date) {
      return getFormattedDate(activeGame.date);
    }
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const [editingScoreState, setEditingScoreState] = useState<{
    isOpen: boolean;
    holeIdx: number;
    par: number;
    p1Strokes: number;
    p1Putts: number;
    p2Strokes: number;
    p2Putts: number;
  }>({
    isOpen: false,
    holeIdx: 0,
    par: 4,
    p1Strokes: 0,
    p1Putts: 0,
    p2Strokes: 0,
    p2Putts: 0
  });

  const handleCellClick = (holeIdx: number, par: number, p1Score: number, p2Score: number) => {
    let p1StrokesInit = 0;
    let p1PuttsInit = 0;
    const p1Id = activeGame?.players[0]?.id || 'p1';
    
    if (activeGame?.shots?.[p1Id] && activeGame?.putts?.[p1Id]) {
      p1StrokesInit = activeGame.shots[p1Id][holeIdx] || 0;
      p1PuttsInit = activeGame.putts[p1Id][holeIdx] || 0;
      if (p1Score > 0 && p1StrokesInit === 0 && p1PuttsInit === 0) {
        if (p1Score === 1) {
          p1StrokesInit = 1;
          p1PuttsInit = 0;
        } else if (p1Score === 2) {
          p1StrokesInit = 1;
          p1PuttsInit = 1;
        } else {
          p1PuttsInit = 2;
          p1StrokesInit = p1Score - 2;
        }
      }
    } else if (p1Score > 0) {
      if (p1Score === 1) {
        p1StrokesInit = 1;
        p1PuttsInit = 0;
      } else if (p1Score === 2) {
        p1StrokesInit = 1;
        p1PuttsInit = 1;
      } else {
        p1PuttsInit = 2;
        p1StrokesInit = p1Score - 2;
      }
    }

    let p2StrokesInit = 0;
    let p2PuttsInit = 0;
    const p2Id = activeGame?.players[1]?.id || 'p2';
    
    if (activeGame?.shots?.[p2Id] && activeGame?.putts?.[p2Id]) {
      p2StrokesInit = activeGame.shots[p2Id][holeIdx] || 0;
      p2PuttsInit = activeGame.putts[p2Id][holeIdx] || 0;
      if (p2Score > 0 && p2StrokesInit === 0 && p2PuttsInit === 0) {
        if (p2Score === 1) {
          p2StrokesInit = 1;
          p2PuttsInit = 0;
        } else if (p2Score === 2) {
          p2StrokesInit = 1;
          p2PuttsInit = 1;
        } else {
          p2PuttsInit = 2;
          p2StrokesInit = p2Score - 2;
        }
      }
    } else if (p2Score > 0) {
      if (p2Score === 1) {
        p2StrokesInit = 1;
        p2PuttsInit = 0;
      } else if (p2Score === 2) {
        p2StrokesInit = 1;
        p2PuttsInit = 1;
      } else {
        p2PuttsInit = 2;
        p2StrokesInit = p2Score - 2;
      }
    }

    setEditingScoreState({
      isOpen: true,
      holeIdx,
      par,
      p1Strokes: p1StrokesInit,
      p1Putts: p1PuttsInit,
      p2Strokes: p2StrokesInit,
      p2Putts: p2PuttsInit
    });

    onUpdateCurrentHole?.(holeIdx);
  };

  // Synchronize dropdown state with activeGame when it changes
  React.useEffect(() => {
    if (activeGame) {
      setSelectedCourseId(activeGame.courseId);
      setPlayDate(getFormattedDate(activeGame.date));
    }
  }, [activeGame]);

  // Auto-initialize active game if none exists
  React.useEffect(() => {
    if (!activeGame && courses.length > 0 && selectedCourseId) {
      onStartGame(selectedCourseId, 'Sk', 'Ky', playDate);
    }
  }, [activeGame, courses, selectedCourseId, playDate, onStartGame]);

  const handleCourseChange = (courseId: string) => {
    setSelectedCourseId(courseId);
    if (activeGame) {
      onUpdateActiveGameMeta(courseId, playDate);
    } else {
      onStartGame(courseId, 'Sk', 'Ky', playDate);
    }
  };

  const handleDateChange = (dateStr: string) => {
    setPlayDate(dateStr);
    if (activeGame) {
      onUpdateActiveGameMeta(selectedCourseId, dateStr);
    } else {
      onStartGame(selectedCourseId, 'Sk', 'Ky', dateStr);
    }
  };

  const handleScoreChange = (
    holeIdx: number, 
    p1Score: number, 
    p2Score: number,
    p1Shots?: number,
    p1Putts?: number,
    p2Shots?: number,
    p2Putts?: number
  ) => {
    onUpdateScores(holeIdx, p1Score, p2Score, p1Shots, p1Putts, p2Shots, p2Putts);
  };

  const handleResetScorecard = () => {
    onAbandonGame();
    setShowResetConfirm(false);
  };

  // If activeGame is not ready yet, render a subtle loading state
  if (!activeGame) {
    return (
      <div className="max-w-3xl mx-auto flex flex-col items-center justify-center py-12 text-slate-500" id="live-loading-state">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-medium">Initializing Scorecard...</p>
      </div>
    );
  }

  const activeCourse = courses.find(c => c.id === activeGame.courseId) || courses[0];
  if (!activeCourse) return null;

  const p1 = activeGame.players[0] || { id: 'p1', name: 'Sk' };
  const p2 = activeGame.players[1] || { id: 'p2', name: 'Ky' };

  const p1Scores = activeGame.scores[p1.id] || Array(18).fill(0);
  const p2Scores = activeGame.scores[p2.id] || Array(18).fill(0);

  const isP1Sk = p1.name.toLowerCase().startsWith('s');
  const p1RowBg = isP1Sk ? "bg-blue-50/50" : "bg-rose-50/50";
  const p2RowBg = !isP1Sk ? "bg-blue-50/50" : "bg-rose-50/50";

  const p1NameBg = isP1Sk ? "bg-blue-100/30" : "bg-rose-100/30";
  const p2NameBg = !isP1Sk ? "bg-blue-100/30" : "bg-rose-100/30";

  const p1OutInBg = isP1Sk ? "bg-blue-100/40" : "bg-rose-100/40";
  const p2OutInBg = !isP1Sk ? "bg-blue-100/40" : "bg-rose-100/40";

  // Calculations for OUT course (Holes 1 to 9)
  const outPars = activeCourse.pars.slice(0, 9);
  const outParSum = outPars.reduce((a, b) => a + b, 0);
  const p1OutScoreSum = p1Scores.slice(0, 9).reduce((a, b) => a + b, 0);
  const p2OutScoreSum = p2Scores.slice(0, 9).reduce((a, b) => a + b, 0);

  // Calculations for IN course (Holes 10 to 18)
  const inPars = activeCourse.pars.slice(9, 18);
  const inParSum = inPars.reduce((a, b) => a + b, 0);
  const p1InScoreSum = p1Scores.slice(9, 18).reduce((a, b) => a + b, 0);
  const p2InScoreSum = p2Scores.slice(9, 18).reduce((a, b) => a + b, 0);

  // Calculations for Total
  const totalParSum = activeCourse.pars.reduce((a, b) => a + b, 0);
  const p1TotalScoreSum = p1Scores.reduce((a, b) => a + b, 0);
  const p2TotalScoreSum = p2Scores.reduce((a, b) => a + b, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6" id="live-scorecard-container">
      {/* Unified Tab Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-100" id="live-tab-header">
        <div className="flex items-center gap-2">
          <span className="text-2xl sm:text-3xl filter drop-shadow-sm shrink-0">📝</span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight text-shadow-sm">
            Scoreboard
          </h2>
        </div>
        <button
          type="button"
          onClick={onCompleteGame}
          className="px-3 py-1.5 sm:px-5 sm:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm rounded-lg sm:rounded-xl transition-all shadow-md shadow-emerald-50 cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
          id="complete-round-action-btn"
        >
          <CheckCircle className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
          Save
        </button>
      </div>

      {/* Course & Date selectors */}
      <div className="py-0.5 sm:py-2" id="live-selectors-card">
        <div className="grid grid-cols-5 gap-2 sm:gap-4" id="live-selectors-grid">
          {/* Course selector */}
          <div className="col-span-3 space-y-0.5 sm:space-y-1.5" id="course-select-group">
            <label className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1" htmlFor="live-course-select">
              <MapPin className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-emerald-500" /> Course
            </label>
            <div className="relative">
              <select
                id="live-course-select"
                className="w-full bg-slate-50/50 border-2 border-slate-300 text-slate-800 rounded-lg sm:rounded-xl px-2 sm:px-4 py-1.5 sm:py-3 outline-none focus:border-emerald-500 focus:bg-white text-xs sm:text-sm font-semibold transition-all appearance-none pr-7 sm:pr-10 cursor-pointer"
                value={selectedCourseId}
                onChange={(e) => handleCourseChange(e.target.value)}
              >
                {[...courses].sort((a, b) => a.name.localeCompare(b.name)).map(course => {
                  return (
                    <option key={course.id} value={course.id} className="text-xs sm:text-xs font-normal text-slate-700 bg-white">
                      {course.name}
                    </option>
                  );
                })}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3 pointer-events-none text-slate-400">
                <ChevronLeft className="w-3.5 h-3.5 rotate-270" />
              </div>
            </div>
          </div>

          {/* Date selector */}
          <div className="col-span-2 space-y-0.5 sm:space-y-1.5" id="date-select-group">
            <label className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1" htmlFor="live-date-select">
              <Calendar className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-emerald-500" /> Date
            </label>
            <div className="relative">
              <input
                id="live-date-select"
                type="date"
                className="w-full bg-slate-50/50 border-2 border-slate-300 text-slate-800 rounded-lg sm:rounded-xl px-2 sm:px-4 py-1.5 sm:py-3 outline-none focus:border-emerald-500 focus:bg-white text-xs sm:text-sm font-semibold transition-all"
                value={playDate}
                onChange={(e) => handleDateChange(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tables block */}
      <div className="space-y-6" id="scorecard-tables-block">
        {/* Table 1: OUT Course (1 - 9) */}
        <div className="py-1 px-1 overflow-hidden" id="out-course-card">
          {/* Front Nine Badge Header */}
          <div className="flex items-center justify-between mb-1.5 px-1" id="out-badge-header">
            <div className="bg-[#ecfdf5] text-[#005a36] px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-sm">
              <span className="text-xs sm:text-sm">⛳</span> Front (Holes 1-9)
            </div>
          </div>

          <div className="overflow-x-auto -mx-0.5 px-0.5 sm:-mx-6 sm:px-6" id="out-table-wrapper">
            <table className="w-full text-center border-separate border-spacing-0 rounded-none overflow-hidden text-[10px] xs:text-[11px] sm:text-xs font-mono table-fixed" id="out-table">
              <colgroup>
                <col className="w-[11%] sm:w-[14%]" />
                <col className="w-[7.8%] sm:w-[7.6%]" />
                <col className="w-[7.8%] sm:w-[7.6%]" />
                <col className="w-[7.8%] sm:w-[7.6%]" />
                <col className="w-[7.8%] sm:w-[7.6%]" />
                <col className="w-[7.8%] sm:w-[7.6%]" />
                <col className="w-[7.8%] sm:w-[7.6%]" />
                <col className="w-[7.8%] sm:w-[7.6%]" />
                <col className="w-[7.8%] sm:w-[7.6%]" />
                <col className="w-[7.8%] sm:w-[7.6%]" />
                <col className="w-[8.8%] sm:w-[8.6%]" />
                <col className="w-[10%] sm:w-[9.6%]" />
              </colgroup>
              <thead>
                <tr className="bg-emerald-50" id="out-table-header">
                  {/* Hole Header Title */}
                  <th className="py-1 px-0 sm:py-3 sm:px-3 text-center font-sans font-extrabold text-green-700 bg-emerald-50 border-t-2 border-b-2 border-l-2 border-r border-slate-400 truncate">
                    Hole
                  </th>
                  {Array.from({ length: 9 }).map((_, idx) => {
                    const isActive = idx === (activeGame.currentHole !== undefined ? activeGame.currentHole : 0);
                    return (
                      <th 
                        key={idx} 
                        onClick={() => onUpdateCurrentHole?.(idx)}
                        className={`py-1 px-0 sm:py-3 sm:px-1 font-black cursor-pointer transition-all ${
                          isActive 
                            ? 'border-l-2 border-r-2 border-t-2 border-b border-amber-400 bg-amber-50 text-[#a16207] text-[11px] sm:text-sm font-black relative z-10' 
                            : 'text-green-700 bg-emerald-50 border-t-2 border-b-2 border-r border-slate-400'
                        }`}
                      >
                        {idx + 1}
                      </th>
                    );
                  })}
                  <th className="py-1 px-0 sm:py-3 sm:px-2 font-black text-green-700 bg-emerald-50 border-t-2 border-b-2 border-r-2 border-slate-400 truncate">
                    OUT
                  </th>
                  <th className="border-0 border-transparent bg-transparent"></th>
                </tr>
              </thead>
              <tbody>
                {/* Par Row */}
                <tr id="out-par-row" className="bg-white">
                  <td className="py-1 px-0.5 sm:py-3 sm:px-3 text-center font-sans font-extrabold text-[#334155] border-b-2 border-l-2 border-r border-slate-400 bg-white">
                    Par
                  </td>
                  {outPars.map((par, idx) => {
                    const isActive = idx === (activeGame.currentHole !== undefined ? activeGame.currentHole : 0);
                    return (
                      <td 
                        key={idx} 
                        onClick={() => onUpdateCurrentHole?.(idx)}
                        className={`py-1 px-0.5 sm:py-3 sm:px-1 font-black transition-all cursor-pointer bg-white ${
                          isActive 
                            ? 'border-l-2 border-r-2 border-b border-amber-400 bg-amber-50 text-rose-500 relative z-10' 
                            : 'text-[#fca5a5] border-b-2 border-r border-slate-400'
                        }`}
                      >
                        {par}
                      </td>
                    );
                  })}
                  <td className="py-1 px-0.5 sm:py-3 sm:px-2 font-black text-green-600 bg-white border-b-2 border-r-2 border-slate-400">
                    {outParSum}
                  </td>
                  <td className="border-0 border-transparent bg-transparent"></td>
                </tr>

                {/* Player 1 (SK) Row */}
                <tr id="out-p1-row" className={p1RowBg}>
                  <td className={`py-1 px-0.5 sm:py-2.5 sm:px-3 text-center font-sans font-black text-[#475569] text-[10px] xs:text-xs sm:text-sm md:text-base border-b border-l-2 border-r border-slate-400 uppercase truncate ${p1NameBg}`}>
                    {getPlayerShortName(p1.name)}
                  </td>
                  {outPars.map((par, idx) => {
                    const score = p1Scores[idx];
                    const isActive = idx === (activeGame.currentHole !== undefined ? activeGame.currentHole : 0);
                    const isClickable = isActive || (p1Scores[idx] > 0 || p2Scores[idx] > 0);
                    return (
                      <td 
                        key={idx} 
                        onClick={isClickable ? () => handleCellClick(idx, par, p1Scores[idx], p2Scores[idx]) : undefined}
                        className={`p-0.5 transition-all ${p1RowBg} ${
                          isActive 
                            ? 'border-l-2 border-r-2 border-b border-amber-400 bg-amber-50/50 cursor-pointer hover:bg-amber-100/40 relative z-10' 
                            : isClickable
                              ? 'border-b border-r border-slate-400 cursor-pointer hover:bg-slate-100/40'
                              : 'border-b border-r border-slate-400'
                        }`}
                      >
                        <div className="w-full h-6 sm:h-9 flex items-center justify-center">
                           {renderHoleScoreBadge(score, par)}
                        </div>
                      </td>
                    );
                  })}
                  <td className={`py-1 px-0.5 sm:py-2.5 sm:px-2 border-b border-r-2 border-slate-400 text-center ${p1OutInBg}`}>
                    {(() => {
                      const relLabel = getRelativeScoreLabel(p1Scores.slice(0, 9), outPars);
                      return (
                        <span className="font-mono text-xs sm:text-sm font-black text-green-600">
                          {relLabel || '-'}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="border-0 border-transparent bg-transparent"></td>
                </tr>

                {/* Player 2 (KY) Row */}
                <tr id="out-p2-row" className={p2RowBg}>
                  <td className={`py-1 px-0.5 sm:py-2.5 sm:px-3 text-center font-sans font-black text-[#475569] text-[10px] xs:text-xs sm:text-sm md:text-base border-b-2 border-l-2 border-r border-slate-400 uppercase truncate ${p2NameBg}`}>
                    {getPlayerShortName(p2.name)}
                  </td>
                  {outPars.map((par, idx) => {
                    const score = p2Scores[idx];
                    const isActive = idx === (activeGame.currentHole !== undefined ? activeGame.currentHole : 0);
                    const isClickable = isActive || (p1Scores[idx] > 0 || p2Scores[idx] > 0);
                    return (
                      <td 
                        key={idx} 
                        onClick={isClickable ? () => handleCellClick(idx, par, p1Scores[idx], p2Scores[idx]) : undefined}
                        className={`p-0.5 transition-all ${p2RowBg} ${
                          isActive 
                            ? 'border-l-2 border-r-2 border-b-2 border-amber-400 bg-amber-50/50 cursor-pointer hover:bg-amber-100/40 relative z-10' 
                            : isClickable
                              ? 'border-b-2 border-r border-slate-400 cursor-pointer hover:bg-slate-100/40'
                              : 'border-b-2 border-r border-slate-400'
                        }`}
                      >
                        <div className="w-full h-6 sm:h-9 flex items-center justify-center">
                          {renderHoleScoreBadge(score, par)}
                        </div>
                      </td>
                    );
                  })}
                  <td className={`py-1 px-0.5 sm:py-2.5 sm:px-2 border-b-2 border-r-2 border-slate-400 text-center ${p2OutInBg}`}>
                    {(() => {
                      const relLabel = getRelativeScoreLabel(p2Scores.slice(0, 9), outPars);
                      return (
                        <span className="font-mono text-xs sm:text-sm font-black text-green-600">
                          {relLabel || '-'}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="border-0 border-transparent bg-transparent"></td>
                </tr>
          </tbody>
        </table>
      </div>
    </div>

        {/* Table 2: IN Course (10 - 18) */}
        <div className="py-1 px-1 overflow-hidden" id="in-course-card">
          {/* Back Nine Badge Header */}
          <div className="flex items-center justify-between mb-1.5 px-1" id="in-badge-header">
            <div className="bg-[#ecfdf5] text-[#005a36] px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-sm">
              <span className="text-xs sm:text-sm">⛳</span> Back (Holes 10-18)
            </div>
          </div>

          <div className="overflow-x-auto -mx-0.5 px-0.5 sm:-mx-6 sm:px-6" id="in-table-wrapper">
            <table className="w-full text-center border-separate border-spacing-0 rounded-none overflow-hidden text-[10px] xs:text-[11px] sm:text-xs font-mono table-fixed" id="in-table">
              <colgroup>
                <col className="w-[11%] sm:w-[14%]" />
                <col className="w-[7.8%] sm:w-[7.6%]" />
                <col className="w-[7.8%] sm:w-[7.6%]" />
                <col className="w-[7.8%] sm:w-[7.6%]" />
                <col className="w-[7.8%] sm:w-[7.6%]" />
                <col className="w-[7.8%] sm:w-[7.6%]" />
                <col className="w-[7.8%] sm:w-[7.6%]" />
                <col className="w-[7.8%] sm:w-[7.6%]" />
                <col className="w-[7.8%] sm:w-[7.6%]" />
                <col className="w-[7.8%] sm:w-[7.6%]" />
                <col className="w-[8.8%] sm:w-[8.6%]" />
                <col className="w-[10%] sm:w-[9.6%]" />
              </colgroup>
              <thead>
                <tr className="bg-emerald-50" id="in-table-header">
                  {/* Hole Header Title */}
                  <th className="py-1 px-0 sm:py-3 sm:px-3 text-center font-sans font-extrabold text-green-700 bg-emerald-50 border-t-2 border-b-2 border-l-2 border-r border-slate-400 truncate">
                    Hole
                  </th>
                  {Array.from({ length: 9 }).map((_, idx) => {
                    const holeIdx = idx + 9;
                    const isActive = holeIdx === (activeGame.currentHole !== undefined ? activeGame.currentHole : 0);
                    return (
                      <th 
                        key={idx} 
                        onClick={() => onUpdateCurrentHole?.(holeIdx)}
                        className={`py-1 px-0 sm:py-3 sm:px-1 font-black cursor-pointer transition-all ${
                          isActive 
                            ? 'border-l-2 border-r-2 border-t-2 border-b border-amber-400 bg-amber-50 text-[#a16207] text-[11px] sm:text-sm font-black relative z-10' 
                            : 'text-green-700 bg-emerald-50 border-t-2 border-b-2 border-r border-slate-400'
                        }`}
                      >
                        {holeIdx + 1}
                      </th>
                    );
                  })}
                  <th className="py-1 px-0 sm:py-3 sm:px-2 font-black text-green-700 bg-emerald-50 border-t-2 border-b-2 border-r border-slate-400 truncate">
                    IN
                  </th>
                  <th className="py-1 px-0 sm:py-3 sm:px-2 font-black text-red-600 bg-emerald-50 border-t-2 border-b-2 border-r-2 border-slate-400 truncate">
                    TOT
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Par Row */}
                <tr id="in-par-row" className="bg-white">
                  <td className="py-1 px-0.5 sm:py-3 sm:px-3 text-center font-sans font-extrabold text-[#334155] border-b-2 border-l-2 border-r border-slate-400 bg-white">
                    Par
                  </td>
                  {inPars.map((par, idx) => {
                    const holeIdx = idx + 9;
                    const isActive = holeIdx === (activeGame.currentHole !== undefined ? activeGame.currentHole : 0);
                    return (
                      <td 
                        key={idx} 
                        onClick={() => onUpdateCurrentHole?.(holeIdx)}
                        className={`py-1 px-0.5 sm:py-3 sm:px-1 font-black transition-all cursor-pointer bg-white ${
                          isActive 
                            ? 'border-l-2 border-r-2 border-b border-amber-400 bg-amber-50 text-rose-500 relative z-10' 
                            : 'text-[#fca5a5] border-b-2 border-r border-slate-400'
                        }`}
                      >
                        {par}
                      </td>
                    );
                  })}
                  <td className="py-1 px-0.5 sm:py-3 sm:px-2 font-black text-green-600 bg-white border-b-2 border-r border-slate-400">
                    {inParSum}
                  </td>
                  <td className="py-1 px-0.5 sm:py-3 sm:px-2 font-black text-red-600 bg-white border-b-2 border-r-2 border-slate-400">
                    {totalParSum}
                  </td>
                </tr>

                {/* Player 1 (SK) Row */}
                <tr id="in-p1-row" className={p1RowBg}>
                  <td className={`py-1 px-0.5 sm:py-2.5 sm:px-3 text-center font-sans font-black text-[#475569] text-[10px] xs:text-xs sm:text-sm md:text-base border-b border-l-2 border-r border-slate-400 uppercase truncate ${p1NameBg}`}>
                    {getPlayerShortName(p1.name)}
                  </td>
                  {inPars.map((par, idx) => {
                    const holeIdx = idx + 9;
                    const score = p1Scores[holeIdx];
                    const isActive = holeIdx === (activeGame.currentHole !== undefined ? activeGame.currentHole : 0);
                    const isClickable = isActive || (p1Scores[holeIdx] > 0 || p2Scores[holeIdx] > 0);
                    return (
                      <td 
                        key={idx} 
                        onClick={isClickable ? () => handleCellClick(holeIdx, par, p1Scores[holeIdx], p2Scores[holeIdx]) : undefined}
                        className={`p-0.5 transition-all ${p1RowBg} ${
                          isActive 
                            ? 'border-l-2 border-r-2 border-b border-amber-400 bg-amber-50/50 cursor-pointer hover:bg-amber-100/40 relative z-10' 
                            : isClickable
                              ? 'border-b border-r border-slate-400 cursor-pointer hover:bg-slate-100/40'
                              : 'border-b border-r border-slate-400'
                        }`}
                      >
                        <div className="w-full h-6 sm:h-9 flex items-center justify-center">
                          {renderHoleScoreBadge(score, par)}
                        </div>
                      </td>
                    );
                  })}
                  <td className={`py-1 px-0.5 sm:py-2.5 sm:px-2 border-b border-r border-slate-400 text-center ${p1OutInBg}`}>
                    {(() => {
                      const relLabel = getRelativeScoreLabel(p1Scores.slice(9, 18), inPars);
                      return (
                        <span className="font-mono text-xs sm:text-sm font-black text-green-600">
                          {relLabel || '-'}
                        </span>
                      );
                    })()}
                  </td>
                  <td className={`py-1 px-0.5 sm:py-2.5 sm:px-2 border-b border-r-2 border-slate-400 text-center ${p1OutInBg}`}>
                    {(() => {
                      const relLabel = getRelativeScoreLabel(p1Scores, activeCourse.pars);
                      return (
                        <span className="font-mono text-xs sm:text-sm font-black text-red-600">
                          {relLabel || '-'}
                        </span>
                      );
                    })()}
                  </td>
                </tr>

                {/* Player 2 (KY) Row */}
                <tr id="in-p2-row" className={p2RowBg}>
                  <td className={`py-1 px-0.5 sm:py-2.5 sm:px-3 text-center font-sans font-black text-[#475569] text-[10px] xs:text-xs sm:text-sm md:text-base border-b-2 border-l-2 border-r border-slate-400 uppercase truncate ${p2NameBg}`}>
                    {getPlayerShortName(p2.name)}
                  </td>
                  {inPars.map((par, idx) => {
                    const score = p2Scores[idx + 9];
                    const isActive = (idx + 9) === (activeGame.currentHole !== undefined ? activeGame.currentHole : 0);
                    const isClickable = isActive || (p1Scores[idx + 9] > 0 || p2Scores[idx + 9] > 0);
                    return (
                      <td 
                        key={idx} 
                        onClick={isClickable ? () => handleCellClick(idx + 9, par, p1Scores[idx + 9], p2Scores[idx + 9]) : undefined}
                        className={`p-0.5 transition-all ${p2RowBg} ${
                          isActive 
                            ? 'border-l-2 border-r-2 border-b-2 border-amber-400 bg-amber-50/50 cursor-pointer hover:bg-amber-100/40 relative z-10' 
                            : isClickable
                              ? 'border-b-2 border-r border-slate-400 cursor-pointer hover:bg-slate-100/40'
                              : 'border-b-2 border-r border-slate-400'
                        }`}
                      >
                        <div className="w-full h-6 sm:h-9 flex items-center justify-center">
                          {renderHoleScoreBadge(score, par)}
                        </div>
                      </td>
                    );
                  })}
                  <td className={`py-1 px-0.5 sm:py-2.5 sm:px-2 border-b-2 border-r border-slate-400 text-center ${p2OutInBg}`}>
                    {(() => {
                      const relLabel = getRelativeScoreLabel(p2Scores.slice(9, 18), inPars);
                      return (
                        <span className="font-mono text-xs sm:text-sm font-black text-green-600">
                          {relLabel || '-'}
                        </span>
                      );
                    })()}
                  </td>
                  <td className={`py-1 px-0.5 sm:py-2.5 sm:px-2 border-b-2 border-r-2 border-slate-400 text-center ${p2OutInBg}`}>
                    {(() => {
                      const relLabel = getRelativeScoreLabel(p2Scores, activeCourse.pars);
                      return (
                        <span className="font-mono text-xs sm:text-sm font-black text-red-600">
                          {relLabel || '-'}
                        </span>
                      );
                    })()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>



      {/* Score Entry Modal */}
      <AnimatePresence>
        {editingScoreState.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="bg-white rounded-3xl shadow-xl border border-slate-100 max-w-xl w-full overflow-hidden p-4 sm:p-6 relative my-auto max-h-[95vh] flex flex-col"
              id="score-entry-modal"
            >
              {/* Close button */}
              <button 
                onClick={() => setEditingScoreState(prev => ({ ...prev, isOpen: false }))}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-50 z-10"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Header */}
              <div className="text-center mb-3 sm:mb-5 shrink-0">
                <span className="inline-block bg-[#ecfdf5] text-[#005a36] px-3 py-1 rounded-full text-xs font-black mb-1 uppercase">
                  ⛳ Hole {editingScoreState.holeIdx + 1}
                </span>
                <p className="text-xs font-bold text-slate-400">
                  코스 기준 파: {editingScoreState.par}
                </p>
              </div>

              {/* Scrollable Container for Tall content on short screens */}
              <div className="overflow-y-auto pr-1 flex-1 py-1 max-h-[55vh]" id="modal-scroll-container">
                {/* Modal Content - Dual Player Column Layout */}
                <div className="grid grid-cols-2 divide-x divide-slate-100 gap-2 sm:gap-6 relative">
                  {/* Left Column: Player 1 (SK) */}
                  <div className="flex flex-col text-center space-y-3.5">
                    <h3 className="text-lg sm:text-xl font-black text-[#005a36] uppercase tracking-wide">
                      {p1.name}
                    </h3>

                    {/* Strokes Selector */}
                    <div className="space-y-1">
                      <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                        SHOTS
                      </span>
                      <div className="border border-emerald-200/80 rounded-2xl p-1.5 bg-white max-w-[145px] mx-auto w-full">
                        <div className="border border-emerald-100 rounded-xl p-0.5 flex items-center justify-between bg-slate-50/50">
                          <button
                            type="button"
                            onClick={() => setEditingScoreState(prev => ({ ...prev, p1Strokes: Math.max(0, prev.p1Strokes - 1) }))}
                            className="w-8 h-8 sm:w-9 sm:h-9 bg-white hover:bg-slate-50 text-[#005a36] flex items-center justify-center font-black text-lg transition-colors border border-slate-100 rounded-lg cursor-pointer shadow-xs"
                          >
                            -
                          </button>
                          <span className="text-base sm:text-lg font-black font-mono text-slate-800 w-8 text-center select-none">
                            {editingScoreState.p1Strokes}
                          </span>
                          <button
                            type="button"
                            onClick={() => setEditingScoreState(prev => ({ ...prev, p1Strokes: Math.min(15, prev.p1Strokes + 1) }))}
                            className="w-8 h-8 sm:w-9 sm:h-9 bg-white hover:bg-slate-50 text-[#005a36] flex items-center justify-center font-black text-lg transition-colors border border-slate-100 rounded-lg cursor-pointer shadow-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Putts Selector */}
                    <div className="space-y-1">
                      <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                        PUTTS
                      </span>
                      <div className="border border-emerald-200/80 rounded-2xl p-1.5 bg-white max-w-[145px] mx-auto w-full">
                        <div className="border border-emerald-100 rounded-xl p-0.5 flex items-center justify-between bg-slate-50/50">
                          <button
                            type="button"
                            onClick={() => setEditingScoreState(prev => ({ ...prev, p1Putts: Math.max(0, prev.p1Putts - 1) }))}
                            className="w-8 h-8 sm:w-9 sm:h-9 bg-white hover:bg-slate-50 text-[#005a36] flex items-center justify-center font-black text-lg transition-colors border border-slate-100 rounded-lg cursor-pointer shadow-xs"
                          >
                            -
                          </button>
                          <span className="text-base sm:text-lg font-black font-mono text-slate-800 w-8 text-center select-none">
                            {editingScoreState.p1Putts}
                          </span>
                          <button
                            type="button"
                            onClick={() => setEditingScoreState(prev => ({ ...prev, p1Putts: Math.min(15, prev.p1Putts + 1) }))}
                            className="w-8 h-8 sm:w-9 sm:h-9 bg-white hover:bg-slate-50 text-[#005a36] flex items-center justify-center font-black text-lg transition-colors border border-slate-100 rounded-lg cursor-pointer shadow-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Total Preview */}
                    <div className="pt-1">
                      <div className="bg-emerald-50/50 text-[#005a36] border border-emerald-100 rounded-xl py-2 px-3 font-black text-center text-xs sm:text-sm max-w-[145px] mx-auto w-full">
                        Total: {editingScoreState.p1Strokes + editingScoreState.p1Putts}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Player 2 (KY) */}
                  <div className="flex flex-col text-center space-y-3.5 border-l border-slate-100 pl-2 sm:pl-6">
                    <h3 className="text-lg sm:text-xl font-black text-[#005a36] uppercase tracking-wide">
                      {p2.name}
                    </h3>

                    {/* Strokes Selector */}
                    <div className="space-y-1">
                      <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                        SHOTS
                      </span>
                      <div className="border border-emerald-200/80 rounded-2xl p-1.5 bg-white max-w-[145px] mx-auto w-full">
                        <div className="border border-emerald-100 rounded-xl p-0.5 flex items-center justify-between bg-slate-50/50">
                          <button
                            type="button"
                            onClick={() => setEditingScoreState(prev => ({ ...prev, p2Strokes: Math.max(0, prev.p2Strokes - 1) }))}
                            className="w-8 h-8 sm:w-9 sm:h-9 bg-white hover:bg-slate-50 text-[#005a36] flex items-center justify-center font-black text-lg transition-colors border border-slate-100 rounded-lg cursor-pointer shadow-xs"
                          >
                            -
                          </button>
                          <span className="text-base sm:text-lg font-black font-mono text-slate-800 w-8 text-center select-none">
                            {editingScoreState.p2Strokes}
                          </span>
                          <button
                            type="button"
                            onClick={() => setEditingScoreState(prev => ({ ...prev, p2Strokes: Math.min(15, prev.p2Strokes + 1) }))}
                            className="w-8 h-8 sm:w-9 sm:h-9 bg-white hover:bg-slate-50 text-[#005a36] flex items-center justify-center font-black text-lg transition-colors border border-slate-100 rounded-lg cursor-pointer shadow-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Putts Selector */}
                    <div className="space-y-1">
                      <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                        PUTTS
                      </span>
                      <div className="border border-emerald-200/80 rounded-2xl p-1.5 bg-white max-w-[145px] mx-auto w-full">
                        <div className="border border-emerald-100 rounded-xl p-0.5 flex items-center justify-between bg-slate-50/50">
                          <button
                            type="button"
                            onClick={() => setEditingScoreState(prev => ({ ...prev, p2Putts: Math.max(0, prev.p2Putts - 1) }))}
                            className="w-8 h-8 sm:w-9 sm:h-9 bg-white hover:bg-slate-50 text-[#005a36] flex items-center justify-center font-black text-lg transition-colors border border-slate-100 rounded-lg cursor-pointer shadow-xs"
                          >
                            -
                          </button>
                          <span className="text-base sm:text-lg font-black font-mono text-slate-800 w-8 text-center select-none">
                            {editingScoreState.p2Putts}
                          </span>
                          <button
                            type="button"
                            onClick={() => setEditingScoreState(prev => ({ ...prev, p2Putts: Math.min(15, prev.p2Putts + 1) }))}
                            className="w-8 h-8 sm:w-9 sm:h-9 bg-white hover:bg-slate-50 text-[#005a36] flex items-center justify-center font-black text-lg transition-colors border border-slate-100 rounded-lg cursor-pointer shadow-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Total Preview */}
                    <div className="pt-1">
                      <div className="bg-emerald-50/50 text-[#005a36] border border-emerald-100 rounded-xl py-2 px-3 font-black text-center text-xs sm:text-sm max-w-[145px] mx-auto w-full">
                        Total: {editingScoreState.p2Strokes + editingScoreState.p2Putts}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-100 mt-3 sm:mt-5 shrink-0" id="modal-action-buttons">
                <button
                  type="button"
                  onClick={() => {
                    handleScoreChange(editingScoreState.holeIdx, 0, 0, 0, 0, 0, 0);
                    setEditingScoreState(prev => ({ ...prev, isOpen: false }));
                  }}
                  className="flex-1 py-3 sm:py-3.5 bg-[#b91c1c] hover:bg-[#991b1b] text-white font-black text-sm sm:text-base rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-md shadow-red-100/30"
                >
                  Reset 🔄
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const p1Final = editingScoreState.p1Strokes + editingScoreState.p1Putts;
                    const p2Final = editingScoreState.p2Strokes + editingScoreState.p2Putts;
                    
                    handleScoreChange(
                      editingScoreState.holeIdx, 
                      p1Final, 
                      p2Final, 
                      editingScoreState.p1Strokes, 
                      editingScoreState.p1Putts,
                      editingScoreState.p2Strokes,
                      editingScoreState.p2Putts
                    );
                    
                    if (editingScoreState.holeIdx < 17) {
                      onUpdateCurrentHole?.(editingScoreState.holeIdx + 1);
                    }
                    
                    setEditingScoreState(prev => ({ ...prev, isOpen: false }));
                  }}
                  className="flex-1 py-3 sm:py-3.5 bg-[#006e4a] hover:bg-[#005a3c] text-white font-black text-sm sm:text-base rounded-xl transition-all cursor-pointer text-center flex items-center justify-center shadow-md shadow-emerald-100/30"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
