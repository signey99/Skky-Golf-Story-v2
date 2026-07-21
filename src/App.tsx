import { useState, useEffect } from 'react';
import { Player, Course, Game } from './types';
import { initialPlayers, initialCourses, initialGames } from './initialData';
import { LiveTab } from './components/LiveTab';
import { CourseTab } from './components/CourseTab';
import { DataTab } from './components/DataTab';
import { RecordTab } from './components/RecordTab';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  MapPin, 
  Calendar, 
  Trophy, 
  Sparkles,
  Info
} from 'lucide-react';
import { db } from './firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';

export default function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [activeTab, setActiveTab] = useState<'live' | 'course' | 'data' | 'record'>('live');
  const [showDemoInfo, setShowDemoInfo] = useState(false);
  const [showPwaGuide, setShowPwaGuide] = useState(false);
  const [logoSrc, setLogoSrc] = useState('/golf_couple.png?v=2026');

  const handleLogoError = () => {
    if (logoSrc.startsWith('/golf_couple.png')) {
      setLogoSrc('/golf_couple-1.png?v=2026');
    } else if (logoSrc.startsWith('/golf_couple-1.png')) {
      setLogoSrc('/apple-touch-icon.png?v=2026');
    }
  };

  // Load and listen to initial/real-time data from Firestore
  useEffect(() => {
    // 1. Listen to courses
    const unsubscribeCourses = onSnapshot(collection(db, 'courses'), (snapshot) => {
      const fetchedCourses: Course[] = [];
      snapshot.forEach((docSnap) => {
        fetchedCourses.push(docSnap.data() as Course);
      });
      
      if (fetchedCourses.length === 0) {
        // Seed initial courses if empty in Firestore
        initialCourses.forEach(async (course) => {
          await setDoc(doc(db, 'courses', course.id), course);
        });
        setShowDemoInfo(true);
      } else {
        setCourses(fetchedCourses);
      }
    });

    // 2. Listen to games
    const unsubscribeGames = onSnapshot(collection(db, 'games'), (snapshot) => {
      const fetchedGames: Game[] = [];
      snapshot.forEach((docSnap) => {
        fetchedGames.push(docSnap.data() as Game);
      });
      
      if (fetchedGames.length === 0) {
        // Seed initial games if empty in Firestore
        initialGames.forEach(async (game) => {
          await setDoc(doc(db, 'games', game.id), game);
        });
      } else {
        setGames(fetchedGames);
      }
    });

    // Always force players to be Sk and Ky
    setPlayers([
      { id: 'p1', name: 'Sk' },
      { id: 'p2', name: 'Ky' }
    ]);

    return () => {
      unsubscribeCourses();
      unsubscribeGames();
    };
  }, []);

  // Derived state: check if there's an active round
  const activeGame = games.find(g => g.status === 'active') || null;

  // Handlers
  const handleStartGame = async (courseId: string, p1Name: string, p2Name: string, dateStr?: string) => {
    // 1. Update permanent player names
    const updatedPlayers = [
      { id: players[0]?.id || 'p1', name: 'Sk' },
      { id: players[1]?.id || 'p2', name: 'Ky' }
    ];
    setPlayers(updatedPlayers);

    // 2. Create the new game
    const selectedCourse = courses.find(c => c.id === courseId);
    if (!selectedCourse) return;

    let gameDate = new Date().toISOString();
    if (dateStr) {
      try {
        const [year, month, day] = dateStr.split('-').map(Number);
        const localDate = new Date();
        localDate.setFullYear(year);
        localDate.setMonth(month - 1);
        localDate.setDate(day);
        localDate.setHours(10, 0, 0, 0); // default local daytime hour
        gameDate = localDate.toISOString();
      } catch (e) {
        // Fallback
      }
    }

    const newGame: Game = {
      id: 'g_' + Date.now(),
      date: gameDate,
      courseId,
      courseName: selectedCourse.name,
      players: [updatedPlayers[0], updatedPlayers[1]],
      scores: {
        [updatedPlayers[0].id]: Array(18).fill(0),
        [updatedPlayers[1].id]: Array(18).fill(0)
      },
      shots: {
        [updatedPlayers[0].id]: Array(18).fill(0),
        [updatedPlayers[1].id]: Array(18).fill(0)
      },
      putts: {
        [updatedPlayers[0].id]: Array(18).fill(0),
        [updatedPlayers[1].id]: Array(18).fill(0)
      },
      status: 'active',
      currentHole: 0
    };

    // Filter out any existing active game in Firestore to avoid duplicates, then append
    const activeGames = games.filter(g => g.status === 'active');
    for (const g of activeGames) {
      await deleteDoc(doc(db, 'games', g.id));
    }
    await setDoc(doc(db, 'games', newGame.id), newGame);
  };

  const handleUpdateActiveGameMeta = async (courseId: string, dateStr: string) => {
    const activeGame = games.find(g => g.status === 'active');
    if (!activeGame) return;

    const selectedCourse = courses.find(c => c.id === courseId);
    if (!selectedCourse) return;
    
    let gameDate = activeGame.date;
    if (dateStr) {
      try {
        const [year, month, day] = dateStr.split('-').map(Number);
        const localDate = new Date();
        localDate.setFullYear(year);
        localDate.setMonth(month - 1);
        localDate.setDate(day);
        localDate.setHours(10, 0, 0, 0);
        gameDate = localDate.toISOString();
      } catch (e) {
        // Fallback
      }
    }
    
    await updateDoc(doc(db, 'games', activeGame.id), {
      courseId,
      courseName: selectedCourse.name,
      date: gameDate
    });
  };

  const handleUpdateScores = async (
    holeIndex: number, 
    p1Score: number, 
    p2Score: number,
    p1Shots?: number,
    p1Putts?: number,
    p2Shots?: number,
    p2Putts?: number
  ) => {
    const activeGame = games.find(g => g.status === 'active');
    if (!activeGame) return;

    const p1Id = activeGame.players[0]?.id || 'p1';
    const p2Id = activeGame.players[1]?.id || 'p2';

    const updatedScores = {
      ...activeGame.scores,
      [p1Id]: (activeGame.scores[p1Id] || Array(18).fill(0)).map((s, idx) => idx === holeIndex ? p1Score : s),
      [p2Id]: (activeGame.scores[p2Id] || Array(18).fill(0)).map((s, idx) => idx === holeIndex ? p2Score : s)
    };

    const updatedShots = {
      ...activeGame.shots,
      [p1Id]: (activeGame.shots?.[p1Id] || Array(18).fill(0)).map((s, idx) => idx === holeIndex ? (p1Shots !== undefined ? p1Shots : p1Score) : s),
      [p2Id]: (activeGame.shots?.[p2Id] || Array(18).fill(0)).map((s, idx) => idx === holeIndex ? (p2Shots !== undefined ? p2Shots : p2Score) : s)
    };

    const updatedPutts = {
      ...activeGame.putts,
      [p1Id]: (activeGame.putts?.[p1Id] || Array(18).fill(0)).map((s, idx) => idx === holeIndex ? (p1Putts !== undefined ? p1Putts : 0) : s),
      [p2Id]: (activeGame.putts?.[p2Id] || Array(18).fill(0)).map((s, idx) => idx === holeIndex ? (p2Putts !== undefined ? p2Putts : 0) : s)
    };
    
    await updateDoc(doc(db, 'games', activeGame.id), {
      scores: updatedScores,
      shots: updatedShots,
      putts: updatedPutts,
      currentHole: holeIndex // update current hole index
    });
  };

  const handleUpdateCurrentHole = async (holeIndex: number) => {
    const activeGame = games.find(g => g.status === 'active');
    if (!activeGame) return;

    await updateDoc(doc(db, 'games', activeGame.id), {
      currentHole: holeIndex
    });
  };

  const handleCompleteGame = async () => {
    const activeGame = games.find(g => g.status === 'active');
    if (!activeGame) return;

    await updateDoc(doc(db, 'games', activeGame.id), {
      status: 'completed'
    });
    // Switch to results tab automatically
    setActiveTab('data');
  };

  const handleAbandonGame = async () => {
    const activeGames = games.filter(g => g.status === 'active');
    for (const g of activeGames) {
      await deleteDoc(doc(db, 'games', g.id));
    }
  };

  const handleUpdatePlayers = async (p1Name: string, p2Name: string) => {
    const updatedPlayers = [
      { id: players[0]?.id || 'p1', name: p1Name },
      { id: players[1]?.id || 'p2', name: p2Name }
    ];
    setPlayers(updatedPlayers);

    // Sync players in any active games in Firestore
    const activeGame = games.find(g => g.status === 'active');
    if (activeGame) {
      await updateDoc(doc(db, 'games', activeGame.id), {
        players: updatedPlayers
      });
    }
  };

  const handleAddCourse = async (
    name: string,
    address: string,
    phone: string,
    totalPar: number,
    blueRating: string,
    blueSlope: string,
    redRating: string,
    redSlope: string,
    pars: number[]
  ) => {
    const newCourse: Course = {
      id: 'c_' + Date.now(),
      name,
      address,
      phone,
      totalPar,
      blueRating,
      blueSlope,
      redRating,
      redSlope,
      pars
    };
    await setDoc(doc(db, 'courses', newCourse.id), newCourse);
  };

  const handleEditCourse = async (
    courseId: string,
    name: string,
    address: string,
    phone: string,
    totalPar: number,
    blueRating: string,
    blueSlope: string,
    redRating: string,
    redSlope: string,
    pars: number[]
  ) => {
    await setDoc(doc(db, 'courses', courseId), {
      id: courseId,
      name,
      address,
      phone,
      totalPar,
      blueRating,
      blueSlope,
      redRating,
      redSlope,
      pars
    });

    // Sync courseName in existing games in Firestore
    for (const g of games) {
      if (g.courseId === courseId) {
        await updateDoc(doc(db, 'games', g.id), {
          courseName: name
        });
      }
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    await deleteDoc(doc(db, 'courses', courseId));
  };

  const isCourseDeletable = (courseId: string) => {
    // Cannot delete course if there are rounds played on it
    return !games.some(g => g.courseId === courseId);
  };

  const handleDeleteGame = async (gameId: string) => {
    await deleteDoc(doc(db, 'games', gameId));
  };

  const handleExportData = () => {
    return JSON.stringify({ players, courses, games }, null, 2);
  };

  const handleImportData = async (jsonData: string) => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.courses && parsed.games) {
        // Upload courses to Firestore
        for (const c of parsed.courses) {
          await setDoc(doc(db, 'courses', c.id), c);
        }
        // Upload games to Firestore
        for (const g of parsed.games) {
          await setDoc(doc(db, 'games', g.id), g);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleResetDemoData = async () => {
    if (window.confirm('Are you sure you want to reset all data to the default demo data? (All custom round and course logs will be lost.)')) {
      // Delete all courses from Firestore
      for (const c of courses) {
        await deleteDoc(doc(db, 'courses', c.id));
      }
      // Delete all games from Firestore
      for (const g of games) {
        await deleteDoc(doc(db, 'games', g.id));
      }
      // Seed initial courses and games
      for (const c of initialCourses) {
        await setDoc(doc(db, 'courses', c.id), c);
      }
      for (const g of initialGames) {
        await setDoc(doc(db, 'games', g.id), g);
      }
      setActiveTab('live');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" id="app-root-wrapper">
      {/* Premium Header */}
      <header className="bg-white border-b border-slate-100 fixed top-0 left-0 right-0 z-40 shadow-xs" id="app-main-header">
        <div className="max-w-4xl mx-auto px-3 py-2.5 md:px-4 md:py-4 flex items-center justify-between" id="header-inner">
          <div className="flex items-center gap-3" id="header-brand">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden border-2 border-emerald-600/10 shadow-sm bg-slate-50 flex items-center justify-center active:scale-95 transition-transform cursor-pointer shrink-0" id="brand-logo" onClick={() => setShowDemoInfo(true)}>
              <img src={logoSrc} onError={handleLogoError} alt="Skky Golf Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="text-xl md:text-2xl font-normal tracking-wider text-blue-400 font-marker leading-none text-shadow-sm" id="header-title">
                SKKY GOLF STORY
              </h1>
              <p className="text-base md:text-lg text-pink-400 font-bold tracking-wide mt-1.5 font-brush leading-none text-shadow-sm" id="header-subtitle">
                시근이와 계영이의 골프이야기
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2" id="header-controls">
            {/* 앱설치버튼 제거됨 */}
          </div>
        </div>
      </header>

      {/* Spacer to push content down below the fixed header */}
      <div className="h-[72px] md:h-[96px] shrink-0" id="header-spacer"></div>

      {/* Demo Initial Welcome Alert */}
      {showDemoInfo && (
        <div className="max-w-4xl mx-auto px-4 mt-4 w-full" id="demo-alert-container">
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-start gap-3 relative text-emerald-800" id="demo-alert">
            <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs" id="demo-alert-text">
              <p className="font-bold">🎉 Welcome to SkKy Golf Story!</p>
              <p className="mt-1 text-emerald-700/90 leading-relaxed">
                This app is designed for 2 players to log and track golf scores in real-time. 
                Currently, demo rounds for <strong>{players[0]?.name || 'Sk'}</strong> and <strong>{players[1]?.name || 'Ky'}</strong> are preloaded so you can explore visual dashboard statistics right away in the <strong>Record</strong> and <strong>Data</strong> tabs.
              </p>
            </div>
            <button 
              onClick={() => setShowDemoInfo(false)}
              className="text-emerald-500 hover:text-emerald-800 absolute top-3 right-3 text-sm font-bold"
              id="close-demo-alert-btn"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Main Content View Frame */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-1.5 py-3 md:px-4 md:py-8 pb-16 md:pb-28" id="app-main-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            id="tab-content-wrapper"
          >
            {activeTab === 'live' && (
              <LiveTab
                activeGame={activeGame}
                courses={courses}
                players={players}
                onStartGame={handleStartGame}
                onUpdateScores={handleUpdateScores}
                onCompleteGame={handleCompleteGame}
                onAbandonGame={handleAbandonGame}
                onUpdatePlayers={handleUpdatePlayers}
                onUpdateActiveGameMeta={handleUpdateActiveGameMeta}
                onUpdateCurrentHole={handleUpdateCurrentHole}
              />
            )}

            {activeTab === 'course' && (
              <CourseTab
                courses={courses}
                games={games}
                onAddCourse={handleAddCourse}
                onEditCourse={handleEditCourse}
                onDeleteCourse={handleDeleteCourse}
                isCourseDeletable={isCourseDeletable}
              />
            )}

            {activeTab === 'data' && (
              <DataTab
                games={games}
                courses={courses}
                onDeleteGame={handleDeleteGame}
                onExportData={handleExportData}
                onImportData={handleImportData}
              />
            )}

            {activeTab === 'record' && (
              <RecordTab
                games={games}
                courses={courses}
                players={players}
                onUpdatePlayers={handleUpdatePlayers}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Sticky Tab Navigation */}
      <nav className="bg-[#f8fafc] border-t border-slate-100 fixed bottom-0 left-0 right-0 z-40 shadow-md py-1.5 pb-safe" id="app-bottom-nav">
        <div className="max-w-md mx-auto px-2 flex items-center justify-between gap-0.5" id="bottom-nav-inner">
          {/* Tab Button: Live */}
          <button
            onClick={() => setActiveTab('live')}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-xl transition-all relative cursor-pointer ${
              activeTab === 'live' 
                ? 'bg-white border border-slate-200/60 shadow-xs text-[#006e4a] font-black' 
                : 'text-slate-400 hover:text-slate-600 font-bold'
            }`}
            id="tab-live-btn"
          >
            <span className="text-lg md:text-xl">📝</span>
            {activeGame && activeTab !== 'live' && (
              <span className="absolute top-1.5 right-4 w-1.5 h-1.5 bg-rose-500 rounded-full ring-1 ring-white animate-pulse" title="Round Active" />
            )}
            <span className="text-[10px] md:text-xs tracking-tight">Scoreboard</span>
          </button>

          {/* Tab Button: Course */}
          <button
            onClick={() => setActiveTab('course')}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'course' 
                ? 'bg-white border border-slate-200/60 shadow-xs text-[#006e4a] font-black' 
                : 'text-slate-400 hover:text-slate-600 font-bold'
            }`}
            id="tab-course-btn"
          >
            <span className="text-lg md:text-xl">🗺️</span>
            <span className="text-[10px] md:text-xs tracking-tight">Courses</span>
          </button>

          {/* Tab Button: Data / History */}
          <button
            onClick={() => setActiveTab('data')}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'data' 
                ? 'bg-white border border-slate-200/60 shadow-xs text-[#006e4a] font-black' 
                : 'text-slate-400 hover:text-slate-600 font-bold'
            }`}
            id="tab-data-btn"
          >
            <span className="text-lg md:text-xl">📸</span>
            <span className="text-[10px] md:text-xs tracking-tight">History</span>
          </button>

          {/* Tab Button: Record */}
          <button
            onClick={() => setActiveTab('record')}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'record' 
                ? 'bg-white border border-slate-200/60 shadow-xs text-[#006e4a] font-black' 
                : 'text-slate-400 hover:text-slate-600 font-bold'
            }`}
            id="tab-record-btn"
          >
            <span className="text-lg md:text-xl">🏆</span>
            <span className="text-[10px] md:text-xs tracking-tight">Record</span>
          </button>
        </div>
      </nav>

      {/* PWA Installation Guide Modal */}
      <AnimatePresence>
        {showPwaGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs" id="pwa-guide-backdrop" onClick={() => setShowPwaGuide(false)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden text-slate-800"
              id="pwa-guide-modal"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 text-white p-5 relative" id="pwa-modal-header">
                <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                  📱 주소창 없이 '진짜 앱'처럼 사용하기
                </h3>
                <p className="text-xs text-emerald-100 font-medium mt-1 leading-relaxed">
                  스마트폰 홈 화면에 바로가기 앱을 추가하시면, 상하단 브라우저 주소창이 사라지고 꽉 찬 전체 화면의 진짜 앱처럼 작동합니다!
                </p>
                <button 
                  onClick={() => setShowPwaGuide(false)}
                  className="absolute top-4 right-4 text-emerald-100 hover:text-white transition-colors text-lg font-black cursor-pointer bg-black/10 hover:bg-black/20 w-8 h-8 rounded-full flex items-center justify-center"
                  id="pwa-modal-close"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto" id="pwa-modal-body">
                {/* iOS Section */}
                <div className="border-b border-slate-100 pb-4" id="pwa-ios-guide">
                  <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 mb-2.5">
                    <span className="w-5 h-5 bg-indigo-50 text-indigo-600 rounded-md flex items-center justify-center text-xs">🍎</span>
                    아이폰 (iOS / Safari 브라우저)
                  </h4>
                  <ol className="text-xs text-slate-600 space-y-2 list-decimal pl-4.5 font-medium leading-relaxed">
                    <li>
                      반드시 <strong className="text-slate-800">Safari(사파리) 앱</strong>으로 접속해 주세요. <span className="text-[10px] text-rose-500 font-bold">(카카오톡, 네이버 앱 등에서는 작동하지 않습니다.)</span>
                    </li>
                    <li>
                      Safari 화면 하단의 <strong className="text-slate-800">공유 아이콘</strong> (네모에 위쪽 화살표가 있는 모양 <span className="inline-block bg-slate-100 px-1 py-0.5 rounded font-black text-slate-700">⎙</span>)을 터치합니다.
                    </li>
                    <li>
                      공유 메뉴 목록을 아래로 스크롤하여 <strong className="text-emerald-700 font-bold">'홈 화면에 추가'</strong> 버튼을 누릅니다.
                    </li>
                    <li>
                      바탕화면에 새로 생성된 <strong className="text-slate-800">SkKy Golf Story</strong> 아이콘을 눌러 실행하시면 진짜 앱으로 작동합니다!
                    </li>
                  </ol>
                </div>

                {/* Android Section */}
                <div id="pwa-android-guide">
                  <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 mb-2.5">
                    <span className="w-5 h-5 bg-emerald-50 text-emerald-600 rounded-md flex items-center justify-center text-xs">🤖</span>
                    안드로이드 (갤럭시 / 크롬 브라우저)
                  </h4>
                  <ol className="text-xs text-slate-600 space-y-2 list-decimal pl-4.5 font-medium leading-relaxed">
                    <li>
                      <strong className="text-slate-800">Chrome(크롬) 앱</strong>으로 본 서비스에 접속합니다.
                    </li>
                    <li>
                      우측 상단의 <strong className="text-slate-800">메뉴 버튼</strong> (점 3개 모양 <span className="inline-block bg-slate-100 px-1 py-0.5 rounded font-black text-slate-700">⋮</span>)을 터치합니다.
                    </li>
                    <li>
                      메뉴 중 <strong className="text-emerald-700 font-bold">'홈 화면에 추가'</strong> 또는 <strong className="text-emerald-700 font-bold">'앱 설치'</strong>를 누릅니다.
                    </li>
                    <li>
                      스마트폰 홈 화면에 생성된 <strong className="text-slate-800">SkKy Golf Story</strong> 앱을 누르면 주소창 없이 전체 화면으로 실행됩니다!
                    </li>
                  </ol>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-slate-50 px-5 py-4 flex justify-end border-t border-slate-100" id="pwa-modal-footer">
                <button 
                  onClick={() => setShowPwaGuide(false)}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
                  id="pwa-modal-confirm"
                >
                  확인했습니다
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
