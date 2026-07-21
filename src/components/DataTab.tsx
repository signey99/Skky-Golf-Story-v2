import React, { useState, useEffect, useRef } from 'react';
import { Game, Course } from '../types';
import { 
  Calendar, 
  MapPin, 
  ChevronDown, 
  ChevronUp, 
  ChevronRight,
  ChevronLeft,
  Trash2, 
  Award, 
  Download, 
  Upload, 
  FileJson,
  X,
  Camera,
  Search
} from 'lucide-react';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface DataTabProps {
  games: Game[];
  courses: Course[];
  onDeleteGame: (gameId: string) => void;
  onImportData: (jsonData: string) => boolean;
  onExportData: () => string;
}

const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const max_width = 500;
        const max_height = 500;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > max_width) {
            height *= max_width / width;
            width = max_width;
          }
        } else {
          if (height > max_height) {
            width *= max_height / height;
            height = max_height;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
          resolve(dataUrl);
        } else {
          resolve(event.target?.result as string);
        }
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export const DataTab: React.FC<DataTabProps> = ({
  games,
  courses,
  onDeleteGame,
  onImportData,
  onExportData
}) => {
  const [detailGameId, setDetailGameId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [importText, setImportText] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);
  const [fullscreenIdx, setFullscreenIdx] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [photoError, setPhotoError] = useState<string | null>(null);

  const pushedCountRef = useRef(0);

  // Clean up pushed states on unmount so we don't pollute the browser history
  useEffect(() => {
    return () => {
      if (pushedCountRef.current > 0) {
        const diff = pushedCountRef.current;
        pushedCountRef.current = 0;
        for (let i = 0; i < diff; i++) {
          window.history.back();
        }
      }
    };
  }, []);

  useEffect(() => {
    const currentActiveCount = (showImportModal ? 1 : 0) + (detailGameId !== null ? 1 : 0) + (fullscreenIdx !== null ? 1 : 0);

    // Synchronize history.pushState if states were changed by user clicking UI buttons
    if (currentActiveCount > pushedCountRef.current) {
      const diff = currentActiveCount - pushedCountRef.current;
      for (let i = 0; i < diff; i++) {
        const nextLevel = pushedCountRef.current + 1;
        window.history.pushState({ modalLevel: nextLevel }, '');
        pushedCountRef.current = nextLevel;
      }
    } else if (currentActiveCount < pushedCountRef.current) {
      const diff = pushedCountRef.current - currentActiveCount;
      pushedCountRef.current = currentActiveCount;
      for (let i = 0; i < diff; i++) {
        window.history.back();
      }
    }

    const handlePopState = (event: PopStateEvent) => {
      const targetLevel = event.state && typeof event.state === 'object' && 'modalLevel' in event.state 
        ? (event.state as { modalLevel: number }).modalLevel 
        : 0;

      pushedCountRef.current = targetLevel;

      if (targetLevel === 0) {
        setDetailGameId(null);
        setFullscreenIdx(null);
        setShowImportModal(false);
        setPhotoError(null);
      } else if (targetLevel === 1) {
        setFullscreenIdx(null);
        setShowImportModal(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [detailGameId, fullscreenIdx, showImportModal]);

  const handlePhotoDelete = async (gameId: string, indexToDelete: number) => {
    const game = games.find(g => g.id === gameId);
    if (!game) return;
    const updatedPhotos = (game.photos || []).filter((_, i) => i !== indexToDelete);
    const gameRef = doc(db, 'games', gameId);
    await updateDoc(gameRef, {
      photos: updatedPhotos
    });
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      
      const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const weekday = weekdays[date.getDay()];
      
      return `${month}/${day}/${year} (${weekday})`;
    } catch {
      return isoString;
    }
  };

  // Filter completed games
  const completedGames = [...games]
    .filter(g => {
      if (g.status !== 'completed') return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const courseMatch = g.courseName?.toLowerCase().includes(q);
      const playerMatch = g.players.some(p => p.name.toLowerCase().includes(q));
      const dateStr = formatDate(g.date).toLowerCase();
      const dateMatch = dateStr.includes(q);
      return courseMatch || playerMatch || dateMatch;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getHoleScoreBgColor = (score: number, par: number) => {
    if (score === 0) return 'bg-slate-100 text-slate-400';
    const diff = score - par;
    if (diff < -1) return 'bg-amber-100 text-amber-800 border-amber-300 font-bold'; // Eagle+
    if (diff === -1) return 'bg-rose-100 text-rose-800 border-rose-200 font-bold'; // Birdie
    if (diff === 0) return 'bg-emerald-50 text-[#008251] border-emerald-200 font-semibold'; // Par
    if (diff === 1) return 'bg-blue-50 text-blue-800 border-blue-200'; // Bogey
    return 'bg-slate-100 text-slate-700 border-slate-200'; // Double Bogey+
  };

  const renderHoleScoreBadge = (score: number, par: number) => {
    if (score === 0) {
      return <span className="text-slate-300 font-bold">-</span>;
    }
    const diff = score - par;
    if (diff === 0) {
      return <span className="text-slate-800 font-extrabold text-xs sm:text-sm">E</span>;
    }
    if (diff === -1) {
      return (
        <div className="w-6 h-6 sm:w-7 sm:h-7 min-w-[24px] min-h-[24px] sm:min-w-[28px] sm:min-h-[28px] shrink-0 aspect-square rounded-full border border-rose-500 text-rose-500 flex items-center justify-center mx-auto text-[10px] sm:text-xs font-black bg-rose-50/40">
          -1
        </div>
      );
    }
    if (diff <= -2) {
      return (
        <div className="w-6 h-6 sm:w-7 sm:h-7 min-w-[24px] min-h-[24px] sm:min-w-[28px] sm:min-h-[28px] shrink-0 aspect-square rounded-full border-4 border-double border-rose-600 text-rose-600 flex items-center justify-center mx-auto text-[10px] sm:text-xs font-black bg-rose-50/40">
          {diff}
        </div>
      );
    }
    if (diff === 1) {
      return (
        <div className="w-6 h-6 sm:w-7 sm:h-7 min-w-[24px] min-h-[24px] sm:min-w-[28px] sm:min-h-[28px] shrink-0 aspect-square border border-slate-400 text-slate-700 flex items-center justify-center mx-auto text-[10px] sm:text-xs font-black rounded-none bg-slate-50">
          1
        </div>
      );
    }
    if (diff >= 2) {
      return (
        <div className="w-6 h-6 sm:w-7 sm:h-7 min-w-[24px] min-h-[24px] sm:min-w-[28px] sm:min-h-[28px] shrink-0 aspect-square border-4 border-double border-slate-500 text-slate-800 flex items-center justify-center mx-auto text-[10px] sm:text-xs font-black rounded-none bg-slate-50/80">
          {diff}
        </div>
      );
    }
    return <span className="text-slate-800 font-black text-xs sm:text-sm">{score}</span>;
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

  const handleExport = () => {
    const dataStr = onExportData();
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `skky_golf_backup_${new Date().toISOString().slice(0,10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setImportError('');
    setImportSuccess(false);

    if (!importText.trim()) {
      setImportError('Please enter JSON data.');
      return;
    }

    const success = onImportData(importText);
    if (success) {
      setImportSuccess(true);
      setImportText('');
      setTimeout(() => {
        setShowImportModal(false);
        setImportSuccess(false);
      }, 1500);
    } else {
      setImportError('Invalid format. Please enter a valid JSON backup file content.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        if (event.target?.result) {
          setImportText(event.target.result as string);
        }
      };
    }
  };

  // Helper to compute strokes & putts
  const calculatePStrokesAndPutts = (scores: number[], game?: Game, playerId?: string) => {
    let strokes = 0;
    let putts = 0;
    
    const savedShots = game && playerId ? game.shots?.[playerId] : undefined;
    const savedPutts = game && playerId ? game.putts?.[playerId] : undefined;
    
    if (savedShots && savedPutts) {
      scores.forEach((score, idx) => {
        if (score > 0) {
          strokes += savedShots[idx] || 0;
          putts += savedPutts[idx] || 0;
        }
      });
    } else {
      scores.forEach(score => {
        if (score > 0) {
          if (score === 1) {
            strokes += 1;
          } else if (score === 2) {
            strokes += 1;
            putts += 1;
          } else {
            putts += 2;
            strokes += (score - 2);
          }
        }
      });
    }
    return { strokes, putts };
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6" id="data-tab-container">
      {/* Unified Tab Header & Backup Options */}
      <div className="flex flex-row items-center justify-between gap-2 pb-2 border-b border-slate-100" id="data-header-section">
        <div className="flex items-center gap-1.5 sm:gap-3">
          <span className="text-2xl sm:text-3xl filter drop-shadow-sm shrink-0">📸</span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight text-shadow-sm" id="data-tab-title">
            History
          </h2>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0" id="backup-actions">
          <button
            onClick={handleExport}
            className="flex items-center gap-1 px-2 py-1.5 sm:px-3 sm:py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-semibold text-[10px] sm:text-xs rounded-lg sm:rounded-xl transition-all shadow-sm cursor-pointer"
            title="Download backup JSON file"
            id="export-btn"
          >
            <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            Backup
          </button>
          
          <button
            onClick={() => {
              setImportError('');
              setImportSuccess(false);
              setShowImportModal(true);
            }}
            className="flex items-center gap-1 px-2 py-1.5 sm:px-3 sm:py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-semibold text-[10px] sm:text-xs rounded-lg sm:rounded-xl transition-all shadow-sm cursor-pointer"
            title="Restore data from backup JSON file"
            id="import-btn"
          >
            <Upload className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            Restore
          </button>
        </div>
      </div>

      {/* Search Input Card */}
      <div className="bg-white rounded-2xl p-2.5 shadow-sm !mt-3">
        <div className="relative flex items-center">
          <span className="absolute left-3.5 text-slate-400">
            <Search className="w-4 h-4 text-[#4263eb]" />
          </span>
          <input
            type="text"
            placeholder="Search Games"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50/75 border border-slate-100 text-slate-700 placeholder-slate-400 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/10 transition-all"
          />
        </div>
      </div>

      {/* Game Lists */}
      {completedGames.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center" id="empty-history-box">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-base font-bold text-slate-700">
            {searchQuery.trim() ? "No matching game records" : "No game records found"}
          </h3>
          <p className="text-xs text-slate-400 mt-1.5 max-w-sm mx-auto leading-relaxed">
            {searchQuery.trim() 
              ? "Try checking your spelling or search for another golf course or player name." 
              : "Start your first round in the Live tab! Once completed, detailed records will be securely saved here."}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5" id="games-list-wrapper">
          {completedGames.map(game => {
            const course = courses.find(c => c.id === game.courseId);
            const totalPar = course ? course.pars.reduce((a, b) => a + b, 0) : 72;

            const p1 = game.players[0];
            const p2 = game.players[1];

            const p1Scores = game.scores[p1.id] || Array(18).fill(0);
            const p2Scores = game.scores[p2.id] || Array(18).fill(0);

            const p1Total = p1Scores.reduce((a, b) => a + b, 0);
            const p2Total = p2Scores.reduce((a, b) => a + b, 0);

            // Date processing for matching the custom date badge
            const dateObj = new Date(game.date);
            const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
            const day = dateObj.getDate().toString().padStart(2, '0');
            const yearStr = dateObj.getFullYear().toString();
            const monthDayStr = `${month}/${day}`;

            const p1Stats = calculatePStrokesAndPutts(p1Scores, game, p1.id);
            const p2Stats = calculatePStrokesAndPutts(p2Scores, game, p2.id);

            const isP1Sk = p1.name.toLowerCase().startsWith('s');
            
            const p1Color = isP1Sk ? 'text-blue-600' : 'text-pink-500';
            const p1ScoreColor = isP1Sk ? 'text-blue-700' : 'text-pink-600';
            const p1SubColor = isP1Sk ? 'text-blue-400/95' : 'text-pink-400/95';

            const p2Color = !isP1Sk ? 'text-blue-600' : 'text-pink-500';
            const p2ScoreColor = !isP1Sk ? 'text-blue-700' : 'text-pink-600';
            const p2SubColor = !isP1Sk ? 'text-blue-400/95' : 'text-pink-400/95';

            return (
              <div 
                key={game.id} 
                className="bg-white rounded-2xl border-2 border-slate-300 overflow-hidden shadow-xs hover:shadow-sm transition-all duration-200"
                id={`game-history-card-${game.id}`}
              >
                {/* Collapsed Brief Summary */}
                <div 
                  onClick={() => setDetailGameId(game.id)}
                  className="p-2.5 sm:p-3.5 flex items-center justify-between gap-2.5 cursor-pointer hover:bg-slate-50/50 transition-colors animate-fade-in"
                  id={`game-collapsed-header-${game.id}`}
                >
                  <div className="flex items-center gap-2.5 sm:gap-3.5 flex-1 min-w-0" id={`game-card-left-${game.id}`}>
                    {/* Date Badge */}
                    <div className="w-[44px] h-[44px] sm:w-[52px] sm:h-[52px] flex flex-col items-center justify-center rounded-xl bg-[#edfcf5] border border-emerald-100/70 shrink-0 select-none shadow-3xs" id={`date-badge-${game.id}`}>
                      <span className="text-[11px] sm:text-sm font-black text-[#005a36] leading-none">{monthDayStr}</span>
                      <span className="text-[9px] sm:text-[11px] font-bold text-[#005a36]/80 mt-0.5 leading-none">{yearStr}</span>
                    </div>

                    {/* Course & Player Stats capsules */}
                    <div className="flex-1 min-w-0 flex flex-col gap-1" id={`game-details-box-${game.id}`}>
                      {/* Course name */}
                      <h3 className="text-sm sm:text-base font-black text-slate-800 tracking-tight truncate max-w-[200px] xs:max-w-[280px] sm:max-w-md leading-tight" id={`game-course-title-${game.id}`}>
                        {game.courseName}
                      </h3>

                      {/* Player Score Summary */}
                      <div className="flex flex-row items-center flex-nowrap gap-x-1 sm:gap-x-1.5 text-[11px] sm:text-xs select-none whitespace-nowrap overflow-x-auto scrollbar-none" id={`game-players-badge-stack-${game.id}`}>
                        <div className="inline-flex items-center gap-0.5 sm:gap-1 shrink-0">
                          <span className={`${p1Color} font-black`}>{p1.name.toUpperCase()}:</span>
                          {(() => {
                            const relLabel = getRelativeScoreLabel(p1Scores, course?.pars || Array(18).fill(4));
                            return (
                              <span className={`${p1ScoreColor} font-extrabold`}>
                                {relLabel}
                              </span>
                            );
                          })()}
                          <span className={`${p1SubColor} font-bold text-[10px] sm:text-[11px]`}>({p1Stats.strokes}/{p1Stats.putts})</span>
                        </div>

                        <span className="text-slate-300 font-light text-[10px] sm:text-xs shrink-0 mx-0.5">|</span>

                        <div className="inline-flex items-center gap-0.5 sm:gap-1 shrink-0">
                          <span className={`${p2Color} font-black`}>{p2.name.toUpperCase()}:</span>
                          {(() => {
                            const relLabel = getRelativeScoreLabel(p2Scores, course?.pars || Array(18).fill(4));
                            return (
                              <span className={`${p2ScoreColor} font-extrabold`}>
                                {relLabel}
                              </span>
                            );
                          })()}
                          <span className={`${p2SubColor} font-bold text-[10px] sm:text-[11px]`}>({p2Stats.strokes}/{p2Stats.putts})</span>
                        </div>

                        {/* Photos indicator if round has photos */}
                        {game.photos && game.photos.length > 0 && (
                          <>
                            <span className="text-slate-300 font-light text-[10px] sm:text-xs shrink-0 mx-0.5">|</span>
                            <div className="inline-flex items-center bg-amber-50 text-amber-700 border border-amber-100 rounded-full px-1.5 py-0.5 text-[10px] font-bold gap-0.5 shadow-3xs shrink-0">
                              <Camera className="w-3 h-3 text-amber-600" /> {game.photos.length}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expand icon right side arrow */}
                  <div className="text-slate-300 pr-1 flex items-center justify-center shrink-0" id={`expand-icon-box-${game.id}`}>
                    <ChevronRight className="w-5 h-5 text-slate-300 hover:text-emerald-600 transition-colors" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detailed Game Popup Modal */}
      {detailGameId && (() => {
        const game = games.find(g => g.id === detailGameId);
        if (!game) return null;

        const course = courses.find(c => c.id === game.courseId);
        const totalPar = course ? course.pars.reduce((a, b) => a + b, 0) : 72;

        const p1 = game.players[0];
        const p2 = game.players[1];

        const p1Scores = game.scores[p1.id] || Array(18).fill(0);
        const p2Scores = game.scores[p2.id] || Array(18).fill(0);

        const p1Total = p1Scores.reduce((a, b) => a + b, 0);
        const p2Total = p2Scores.reduce((a, b) => a + b, 0);

        const p1Stats = calculatePStrokesAndPutts(p1Scores, game, p1.id);
        const p2Stats = calculatePStrokesAndPutts(p2Scores, game, p2.id);

        const isP1Sk = p1.name.toLowerCase().startsWith('s');
        const p1RowBg = isP1Sk ? "bg-blue-50/50" : "bg-rose-50/50";
        const p2RowBg = !isP1Sk ? "bg-blue-50/50" : "bg-rose-50/50";

        const p1NameBg = isP1Sk ? "bg-blue-100/30" : "bg-rose-100/30";
        const p2NameBg = !isP1Sk ? "bg-blue-100/30" : "bg-rose-100/30";

        const p1OutInBg = isP1Sk ? "bg-blue-100/40" : "bg-rose-100/40";
        const p2OutInBg = !isP1Sk ? "bg-blue-100/40" : "bg-rose-100/40";

        const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
          const files = e.target.files;
          if (!files) return;
          
          setPhotoError(null); // Reset previous errors
          
          const currentPhotos = game.photos || [];
          let totalPhotosSize = currentPhotos.reduce((sum, photo) => sum + (photo.length * 0.75), 0);
          const newPhotoUrls: string[] = [];
          let hasSizeExceeded = false;
          
          for (let i = 0; i < files.length; i++) {
            try {
              const base64 = await compressImage(files[i]);
              const approxSize = base64.length * 0.75;
              
              // Firestore standard document size limit is 1MB. Let's set a safe threshold of 800KB for photo assets.
              if (totalPhotosSize + approxSize > 800 * 1024) {
                hasSizeExceeded = true;
                break;
              }
              
              totalPhotosSize += approxSize;
              newPhotoUrls.push(base64);
            } catch (err) {
              console.error("Error compressing file:", err);
              setPhotoError("사진을 처리하는 중 오류가 발생했습니다.");
            }
          }
          
          if (newPhotoUrls.length > 0) {
            try {
              const gameRef = doc(db, 'games', game.id);
              await updateDoc(gameRef, {
                photos: [...currentPhotos, ...newPhotoUrls]
              });
              if (hasSizeExceeded) {
                setPhotoError("일부 사진은 저장 용량 제한(1MB)을 초과하여 추가되지 못했습니다. (최대 8~10장 권장)");
              } else {
                setPhotoError(null);
              }
            } catch (err) {
              console.error("Firestore update failed:", err);
              setPhotoError("서버 저장 용량 초과로 사진을 업로드할 수 없습니다. 기존 사진을 삭제하고 다시 시도해 주세요.");
            }
          } else if (hasSizeExceeded) {
            setPhotoError("데이터베이스 저장 용량 제한(1MB)을 초과하여 사진을 더 이상 추가할 수 없습니다. 기존 사진을 일부 삭제하고 다시 시도해 주세요.");
          }
        };

        const handlePhotoDelete = async (indexToDelete: number) => {
          try {
            const updatedPhotos = (game.photos || []).filter((_, i) => i !== indexToDelete);
            const gameRef = doc(db, 'games', game.id);
            await updateDoc(gameRef, {
              photos: updatedPhotos
            });
            setPhotoError(null);
          } catch (err) {
            console.error("Error deleting photo:", err);
            setPhotoError("사진 삭제 도중 오류가 발생했습니다.");
          }
        };

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-0 sm:p-4 z-50 overflow-y-auto animate-in fade-in duration-200" id="game-detail-modal-overlay">
            <div className="bg-white rounded-none sm:rounded-3xl max-w-2xl w-full p-3 xs:p-4 sm:p-7 shadow-2xl border-x-0 sm:border border-slate-100 my-0 sm:my-8 relative flex flex-col space-y-2 sm:space-y-3.5 animate-in slide-in-from-bottom-4 duration-300" id="game-detail-modal-card">
              
              {/* Top Section with reduced spacing */}
              <div className="space-y-2.5 sm:space-y-3" id="game-detail-top-section">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-2 sm:pb-2.5" id="game-detail-header-container">
                  <div className="space-y-0" id="game-detail-title-info">
                    <div className="flex items-center gap-1.5 text-emerald-800 text-base xs:text-lg sm:text-xl font-black select-none" id="game-detail-date-badge">
                      <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" /> {formatDate(game.date)}
                    </div>
                    <h3 className="text-base xs:text-lg sm:text-xl font-black text-slate-800 tracking-tight leading-tight" id="game-detail-course-name">
                      {game.courseName}
                    </h3>
                  </div>
                  <button 
                    onClick={() => {
                      setDetailGameId(null);
                      setDeleteConfirmId(null);
                      setPhotoError(null);
                    }}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-2xl transition-all shrink-0 cursor-pointer border border-transparent hover:border-slate-100 ml-4"
                    id="game-detail-close-btn"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Summary Cards Grid */}
                {(() => {
                  const p1Diff = p1Total - totalPar;
                  const p1OverPar = p1Total === 0 ? 'N/A' : (p1Diff === 0 ? 'E' : (p1Diff > 0 ? `+${p1Diff}` : `${p1Diff}`));
                  const p2Diff = p2Total - totalPar;
                  const p2OverPar = p2Total === 0 ? 'N/A' : (p2Diff === 0 ? 'E' : (p2Diff > 0 ? `+${p2Diff}` : `${p2Diff}`));
                  
                  const p1Bg = isP1Sk ? "bg-blue-50/80 border-blue-200 shadow-[0_4px_12px_rgba(59,130,246,0.08)]" : "bg-rose-50/80 border-rose-200 shadow-[0_4px_12px_rgba(244,63,94,0.08)]";
                  const p1ScoreColor = isP1Sk ? "text-blue-700" : "text-rose-700";
                  const p1LabelColor = isP1Sk ? "text-blue-400" : "text-rose-400";
                  
                  const p2Bg = !isP1Sk ? "bg-blue-50/80 border-blue-200 shadow-[0_4px_12px_rgba(59,130,246,0.08)]" : "bg-rose-50/80 border-rose-200 shadow-[0_4px_12px_rgba(244,63,94,0.08)]";
                  const p2ScoreColor = !isP1Sk ? "text-blue-700" : "text-rose-700";
                  const p2LabelColor = !isP1Sk ? "text-blue-400" : "text-rose-400";

                  return (
                    <div className="grid grid-cols-2 gap-3 sm:gap-4" id="game-detail-summary-cards">
                      {/* Player 1 Card */}
                      <div className={`${p1Bg} border rounded-2xl p-3 sm:p-4 flex items-center justify-between overflow-hidden gap-2`} id="game-detail-p1-card">
                        <div className="flex flex-col min-w-0" id="game-detail-p1-info">
                          <span className="text-slate-800 font-black text-xl sm:text-2xl truncate uppercase">{p1.name}</span>
                        </div>
                        <div className="flex flex-col items-center shrink-0" id="game-detail-p1-score-container">
                          <div className={`${p1ScoreColor} font-black text-lg sm:text-xl font-mono leading-none`} id="game-detail-p1-score">
                            {p1OverPar}
                          </div>
                          <span className={`${p1LabelColor} font-bold text-[10px] sm:text-xs font-mono whitespace-nowrap mt-1`}>
                            {p1Total === 0 ? 'S - / P -' : `S ${p1Stats.strokes} / P ${p1Stats.putts}`}
                          </span>
                        </div>
                      </div>

                      {/* Player 2 Card */}
                      <div className={`${p2Bg} border rounded-2xl p-3 sm:p-4 flex items-center justify-between overflow-hidden gap-2`} id="game-detail-p2-card">
                        <div className="flex flex-col min-w-0" id="game-detail-p2-info">
                          <span className="text-slate-800 font-black text-xl sm:text-2xl truncate uppercase">{p2.name}</span>
                        </div>
                        <div className="flex flex-col items-center shrink-0" id="game-detail-p2-score-container">
                          <div className={`${p2ScoreColor} font-black text-lg sm:text-xl font-mono leading-none`} id="game-detail-p2-score">
                            {p2OverPar}
                          </div>
                          <span className={`${p2LabelColor} font-bold text-[10px] sm:text-xs font-mono whitespace-nowrap mt-1`}>
                            {p2Total === 0 ? 'S - / P -' : `S ${p2Stats.strokes} / P ${p2Stats.putts}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Scorecard Detailed Tables */}
              <div className="space-y-4 sm:space-y-5 my-6 sm:my-8" id={`scorecards-container-${game.id}`}>
                {/* Front Nine Table */}
                <div className="overflow-x-auto" id={`scorecard-front-scroll-${game.id}`}>
                  <table className="w-[90.46%] text-center border-separate border-spacing-0 border-2 border-slate-400 rounded-none overflow-hidden text-[11px] sm:text-xs font-mono table-fixed shadow-2xs" id={`scorecard-table-front-${game.id}`}>
                    <colgroup>
                      <col className="w-[15.48%]" />
                      <col className="w-[8.4%]" />
                      <col className="w-[8.4%]" />
                      <col className="w-[8.4%]" />
                      <col className="w-[8.4%]" />
                      <col className="w-[8.4%]" />
                      <col className="w-[8.4%]" />
                      <col className="w-[8.4%]" />
                      <col className="w-[8.4%]" />
                      <col className="w-[8.4%]" />
                      <col className="w-[9.51%]" />
                    </colgroup>
                    <thead>
                      <tr className="bg-emerald-50 text-emerald-700 border-b-2 border-slate-400" id={`scorecard-front-headers-${game.id}`}>
                        <th className="py-2 px-1 text-center font-sans font-semibold text-emerald-700 border-b-2 border-r border-slate-400 truncate">Hole</th>
                        {Array.from({ length: 9 }).map((_, idx) => (
                          <th key={idx} className="py-2 px-0.5 font-semibold border-b-2 border-r border-slate-400">{idx + 1}</th>
                        ))}
                        <th className="py-2 px-1 font-bold bg-emerald-50/50 text-green-700 border-b-2 border-slate-400">OUT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Par Row */}
                      <tr className="text-slate-500 bg-white" id={`scorecard-front-par-row-${game.id}`}>
                        <td className="py-2 px-1 text-center font-sans font-medium border-b-2 border-r border-slate-400 bg-white">Par</td>
                        {course?.pars.slice(0, 9).map((par, idx) => (
                          <td key={idx} className="py-2 px-0.5 font-medium border-b-2 border-r border-slate-400 bg-white text-rose-500">{par}</td>
                        ))}
                        <td className="py-2 px-1 font-bold bg-white text-green-600 border-b-2 border-slate-400">
                          {course?.pars.slice(0, 9).reduce((a, b) => a + b, 0)}
                        </td>
                      </tr>
                      {/* Player 1 Row */}
                      <tr className={`text-slate-800 ${p1RowBg}`} id={`scorecard-front-p1-row-${game.id}`}>
                        <td className={`py-1.5 px-1 text-center font-sans font-bold text-slate-700 border-b border-r border-slate-300 truncate uppercase ${p1NameBg}`}>
                          {p1.name.slice(0, 4)}
                        </td>
                        {p1Scores.slice(0, 9).map((score, idx) => (
                          <td key={idx} className="p-0.5 sm:p-1 border-b border-r border-slate-300">
                            <div className="w-full h-8 sm:h-9 flex items-center justify-center">
                              {renderHoleScoreBadge(score, course?.pars[idx] || 4)}
                            </div>
                          </td>
                        ))}
                        <td className={`py-1.5 px-1 border-b border-slate-300 text-center ${p1OutInBg}`}>
                          {(() => {
                            const relLabel = getRelativeScoreLabel(p1Scores.slice(0, 9), course?.pars.slice(0, 9) || Array(9).fill(4));
                            return (
                              <span className="font-mono text-xs sm:text-sm font-black text-green-600">
                                {relLabel || '-'}
                              </span>
                            );
                          })()}
                        </td>
                      </tr>
                      {/* Player 2 Row */}
                      <tr className={`text-slate-800 ${p2RowBg}`} id={`scorecard-front-p2-row-${game.id}`}>
                        <td className={`py-1.5 px-1 text-center font-sans font-bold text-slate-700 border-r border-slate-300 truncate uppercase ${p2NameBg}`}>
                          {p2.name.slice(0, 4)}
                        </td>
                        {p2Scores.slice(0, 9).map((score, idx) => (
                          <td key={idx} className="p-0.5 sm:p-1 border-r border-slate-300">
                            <div className="w-full h-8 sm:h-9 flex items-center justify-center">
                              {renderHoleScoreBadge(score, course?.pars[idx] || 4)}
                            </div>
                          </td>
                        ))}
                        <td className={`py-1.5 px-1 text-center ${p2OutInBg}`}>
                          {(() => {
                            const relLabel = getRelativeScoreLabel(p2Scores.slice(0, 9), course?.pars.slice(0, 9) || Array(9).fill(4));
                            return (
                              <span className="font-mono text-xs sm:text-sm font-black text-green-600">
                                {relLabel || '-'}
                              </span>
                            );
                          })()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Back Nine Table */}
                <div className="overflow-x-auto" id={`scorecard-back-scroll-${game.id}`}>
                  <table className="w-full text-center border-separate border-spacing-0 border-2 border-slate-400 rounded-none overflow-hidden text-[11px] sm:text-xs font-mono table-fixed shadow-2xs" id={`scorecard-table-back-${game.id}`}>
                    <colgroup>
                      <col className="w-[14%]" />
                      <col className="w-[7.6%]" />
                      <col className="w-[7.6%]" />
                      <col className="w-[7.6%]" />
                      <col className="w-[7.6%]" />
                      <col className="w-[7.6%]" />
                      <col className="w-[7.6%]" />
                      <col className="w-[7.6%]" />
                      <col className="w-[7.6%]" />
                      <col className="w-[7.6%]" />
                      <col className="w-[8.6%]" />
                      <col className="w-[9.6%]" />
                    </colgroup>
                    <thead>
                      <tr className="bg-emerald-50 text-emerald-700 border-b-2 border-slate-400" id={`scorecard-back-headers-${game.id}`}>
                        <th className="py-2 px-1 text-center font-sans font-semibold text-emerald-700 border-b-2 border-r border-slate-400 truncate">Hole</th>
                        {Array.from({ length: 9 }).map((_, idx) => (
                          <th key={idx + 9} className="py-2 px-0.5 font-semibold border-b-2 border-r border-slate-400">{idx + 10}</th>
                        ))}
                        <th className="py-2 px-1 font-bold bg-emerald-50/50 text-green-700 border-b-2 border-r border-slate-400">IN</th>
                        <th className="py-2 px-1 font-bold bg-emerald-50/50 text-red-600 border-b-2 border-slate-400">TOT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Par Row */}
                      <tr className="text-slate-500 bg-white" id={`scorecard-back-par-row-${game.id}`}>
                        <td className="py-2 px-1 text-center font-sans font-medium border-b-2 border-r border-slate-400 bg-white">Par</td>
                        {course?.pars.slice(9, 18).map((par, idx) => (
                          <td key={idx + 9} className="py-2 px-0.5 font-medium border-b-2 border-r border-slate-400 bg-white text-rose-500">{par}</td>
                        ))}
                        <td className="py-2 px-1 font-bold bg-white text-green-600 border-b-2 border-r border-slate-400">
                          {course?.pars.slice(9, 18).reduce((a, b) => a + b, 0)}
                        </td>
                        <td className="py-2 px-1 font-bold bg-white text-red-600 border-b-2 border-slate-400">
                          {totalPar}
                        </td>
                      </tr>
                      {/* Player 1 Row */}
                      <tr className={`text-slate-800 ${p1RowBg}`} id={`scorecard-back-p1-row-${game.id}`}>
                        <td className={`py-1.5 px-1 text-center font-sans font-bold text-slate-700 border-b border-r border-slate-300 truncate uppercase ${p1NameBg}`}>
                          {p1.name.slice(0, 4)}
                        </td>
                        {p1Scores.slice(9, 18).map((score, idx) => (
                          <td key={idx + 9} className="p-0.5 sm:p-1 border-b border-r border-slate-300">
                            <div className="w-full h-8 sm:h-9 flex items-center justify-center">
                              {renderHoleScoreBadge(score, course?.pars[idx + 9] || 4)}
                            </div>
                          </td>
                        ))}
                        <td className={`py-1.5 px-1 border-b border-r border-slate-300 text-center ${p1OutInBg}`}>
                          {(() => {
                            const relLabel = getRelativeScoreLabel(p1Scores.slice(9, 18), course?.pars.slice(9, 18) || Array(9).fill(4));
                            return (
                              <span className="font-mono text-xs sm:text-sm font-black text-green-600">
                                {relLabel || '-'}
                              </span>
                            );
                          })()}
                        </td>
                        <td className={`py-1.5 px-1 text-center border-b border-slate-300 ${p1OutInBg}`}>
                          {(() => {
                            const relLabel = getRelativeScoreLabel(p1Scores, course?.pars || Array(18).fill(4));
                            return (
                              <span className="font-mono text-xs sm:text-sm font-black text-red-600">
                                {relLabel || '-'}
                              </span>
                            );
                          })()}
                        </td>
                      </tr>
                      {/* Player 2 Row */}
                      <tr className={`text-slate-800 ${p2RowBg}`} id={`scorecard-back-p2-row-${game.id}`}>
                        <td className={`py-1.5 px-1 text-center font-sans font-bold text-slate-700 border-r border-slate-300 truncate uppercase ${p2NameBg}`}>
                          {p2.name.slice(0, 4)}
                        </td>
                        {p2Scores.slice(9, 18).map((score, idx) => (
                          <td key={idx + 9} className="p-0.5 sm:p-1 border-r border-slate-300">
                            <div className="w-full h-8 sm:h-9 flex items-center justify-center">
                              {renderHoleScoreBadge(score, course?.pars[idx + 9] || 4)}
                            </div>
                          </td>
                        ))}
                        <td className={`py-1.5 px-1 border-r border-slate-300 text-center ${p2OutInBg}`}>
                          {(() => {
                            const relLabel = getRelativeScoreLabel(p2Scores.slice(9, 18), course?.pars.slice(9, 18) || Array(9).fill(4));
                            return (
                              <span className="font-mono text-xs sm:text-sm font-black text-green-600">
                                {relLabel || '-'}
                              </span>
                            );
                          })()}
                        </td>
                        <td className={`py-1.5 px-1 text-center ${p2OutInBg}`}>
                          {(() => {
                            const relLabel = getRelativeScoreLabel(p2Scores, course?.pars || Array(18).fill(4));
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

              {/* Photo Upload and View Gallery Section */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-emerald-600" /> Round Photos
                  </h4>
                  {game.photos && game.photos.length > 0 && (
                    <span className="text-[10px] text-slate-400 font-bold">
                      {game.photos.length} Photo{game.photos.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {photoError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-red-800 leading-normal">{photoError}</p>
                    </div>
                    <button 
                      onClick={() => setPhotoError(null)} 
                      className="p-1 hover:bg-red-100 rounded-lg transition-colors text-red-500 shrink-0 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {game.photos && game.photos.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                    {game.photos.map((photo, pIdx) => (
                      <div key={pIdx} className="relative group aspect-square rounded-2xl overflow-hidden border border-slate-100 shadow-2xs bg-slate-50">
                        <img 
                          src={photo} 
                          alt={`Golf game photo ${pIdx + 1}`} 
                          className="w-full h-full object-cover cursor-pointer hover:scale-[1.03] transition-transform duration-200"
                          referrerPolicy="no-referrer"
                          onClick={() => setFullscreenIdx(pIdx)}
                        />
                      </div>
                    ))}

                    {/* Standard add photo box inside the list */}
                    <label className="flex flex-col items-center justify-center border border-dashed border-slate-200 hover:border-emerald-400 rounded-2xl aspect-square cursor-pointer transition-colors bg-slate-50/50 hover:bg-emerald-50/5 hover:text-emerald-600">
                      <Camera className="w-5 h-5 text-slate-400 hover:text-emerald-500" />
                      <span className="text-[10px] text-slate-400 font-extrabold mt-1">Add Photo</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        multiple 
                        onChange={handlePhotoUpload} 
                        className="hidden" 
                      />
                    </label>
                  </div>
                ) : (
                  <div className="bg-slate-50/75 border border-slate-100 rounded-2xl p-5 text-center flex flex-col items-center justify-center">
                    <Camera className="w-8 h-8 text-slate-300 mb-1.5" />
                    <p className="text-[11px] text-slate-400 font-bold mb-3">No photos uploaded for this round yet.</p>
                    <label className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs">
                      <Camera className="w-3.5 h-3.5" /> Upload Photos
                      <input 
                        type="file" 
                        accept="image/*" 
                        multiple 
                        onChange={handlePhotoUpload} 
                        className="hidden" 
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="flex justify-between items-center pt-3 border-t border-slate-100" id="game-expanded-actions">
                <button
                  type="button"
                  onClick={() => {
                    setDetailGameId(null);
                    setDeleteConfirmId(null);
                    setPhotoError(null);
                  }}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Close View
                </button>

                {deleteConfirmId === game.id ? (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl p-1.5" id={`delete-confirm-${game.id}`}>
                    <span className="text-[10px] text-red-600 font-semibold px-2">Are you sure?</span>
                    <button 
                      onClick={() => {
                        onDeleteGame(game.id);
                        setDetailGameId(null);
                        setDeleteConfirmId(null);
                        setPhotoError(null);
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer"
                    >
                      Yes, Delete
                    </button>
                    <button 
                      onClick={() => setDeleteConfirmId(null)}
                      className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer"
                    >
                      No, Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirmId(game.id)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Record
                  </button>
                )}
              </div>

            </div>
          </div>
        );
      })()}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200" id="import-modal-overlay">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-slate-100 relative" id="import-modal-card">
            <button 
              onClick={() => setShowImportModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
              id="close-import-modal-btn"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4" id="import-modal-header">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl" id="import-header-icon">
                <FileJson className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800" id="import-modal-title">Restore Data (Import)</h3>
                <p className="text-xs text-slate-400 mt-0.5">Restore previously backed-up JSON data.</p>
              </div>
            </div>

            <form onSubmit={handleImportSubmit} className="space-y-4" id="import-form">
              {/* File input */}
              <div className="space-y-1.5" id="import-file-group">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Select Backup File
                </label>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                  id="import-file-input"
                />
              </div>

              {/* Text Area JSON input */}
              <div className="space-y-1.5" id="import-text-group">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider" htmlFor="json-paste-area">
                  Or Paste JSON Text
                </label>
                <textarea
                  id="json-paste-area"
                  className="w-full h-32 bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] font-mono outline-none focus:border-emerald-500 focus:bg-white transition-all resize-none"
                  placeholder='{"players": ..., "courses": ..., "games": ...}'
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                />
              </div>

              {importError && (
                <p className="text-xs font-semibold text-red-500" id="import-modal-error-msg">{importError}</p>
              )}

              {importSuccess && (
                <p className="text-xs font-bold text-emerald-600" id="import-modal-success-msg">✓ Data restored successfully!</p>
              )}

              <div className="flex gap-3 justify-end pt-2" id="import-modal-actions">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-200 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                  id="submit-import-btn"
                >
                  Restore
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fullscreen Photo Lightbox with Slider & Delete Option */}
      {detailGameId && fullscreenIdx !== null && (() => {
        const game = games.find(g => g.id === detailGameId);
        if (!game || !game.photos || game.photos.length === 0) return null;
        
        // Ensure index is valid
        const idx = Math.min(Math.max(0, fullscreenIdx), game.photos.length - 1);
        const currentPhoto = game.photos[idx];

        const handlePrevPhoto = (e: React.MouseEvent) => {
          e.stopPropagation();
          setFullscreenIdx((prev) => (prev !== null ? (prev - 1 + game.photos.length) % game.photos.length : 0));
        };

        const handleNextPhoto = (e: React.MouseEvent) => {
          e.stopPropagation();
          setFullscreenIdx((prev) => (prev !== null ? (prev + 1) % game.photos.length : 0));
        };

        const handleDeletePhotoFromLightbox = async (e: React.MouseEvent) => {
          e.stopPropagation();
          const nextIndex = game.photos!.length - 1 === 0 ? null : (idx === game.photos!.length - 1 ? idx - 1 : idx);
          await handlePhotoDelete(game.id, idx);
          setFullscreenIdx(nextIndex);
        };

        return (
          <div 
            className="fixed inset-0 bg-slate-950/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 z-50 animate-in fade-in duration-200 cursor-pointer select-none"
            onClick={() => setFullscreenIdx(null)}
            id="fullscreen-photo-lightbox"
          >
            {/* Top Toolbar */}
            <div className="absolute top-4 inset-x-4 flex items-center justify-between z-10" onClick={(e) => e.stopPropagation()}>
              {/* Photo Indicator */}
              <span className="text-white/80 bg-black/40 px-3.5 py-1.5 rounded-full border border-white/10 text-xs font-mono font-bold">
                {idx + 1} / {game.photos.length}
              </span>

              <div className="flex items-center gap-2.5">
                {/* Delete Button */}
                <button
                  type="button"
                  onClick={handleDeletePhotoFromLightbox}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-full transition-all shadow-md active:scale-95 cursor-pointer border border-red-500/30"
                  title="Delete current photo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Photo
                </button>

                {/* Close Button */}
                <button 
                  onClick={() => setFullscreenIdx(null)}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all border border-white/10 cursor-pointer"
                  id="close-lightbox-btn"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Slider Navigation & Image Container */}
            <div className="relative w-full max-w-5xl h-[70vh] sm:h-[80vh] flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
              {/* Left Arrow */}
              <button
                onClick={handlePrevPhoto}
                className="absolute left-2 sm:-left-12 p-3 bg-black/40 hover:bg-black/60 text-white rounded-full transition-all border border-white/10 active:scale-90 z-10 cursor-pointer"
                title="Previous Photo"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              {/* Central Photo */}
              <div className="w-full h-full flex items-center justify-center p-2">
                <img 
                  src={currentPhoto} 
                  alt={`Fullscreen round photo ${idx + 1}`} 
                  className="max-w-full max-h-full rounded-2xl object-contain shadow-2xl border border-white/5 animate-in zoom-in-95 duration-200"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Right Arrow */}
              <button
                onClick={handleNextPhoto}
                className="absolute right-2 sm:-right-12 p-3 bg-black/40 hover:bg-black/60 text-white rounded-full transition-all border border-white/10 active:scale-90 z-10 cursor-pointer"
                title="Next Photo"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
