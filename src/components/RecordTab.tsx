import React, { useState } from 'react';
import { Game, Player, Course } from '../types';
import { 
  Award, 
  TrendingUp, 
  Target, 
  BarChart3, 
  Calendar,
  HelpCircle,
  Activity
} from 'lucide-react';

interface RecordTabProps {
  games: Game[];
  courses: Course[];
  players: Player[];
  onUpdatePlayers: (p1Name: string, p2Name: string) => void;
}

export const RecordTab: React.FC<RecordTabProps> = ({
  games,
  courses,
  players,
  onUpdatePlayers
}) => {
  const [p1Name, setP1Name] = useState(players[0]?.name || 'Sk');
  const [p2Name, setP2Name] = useState(players[1]?.name || 'Ky');

  const completedGames = [...games]
    .filter(g => g.status === 'completed')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // chronological for trends

  const p1 = players[0];
  const p2 = players[1];

  // Head to Head calculation
  let h2hTotal = 0;
  let p1Wins = 0;
  let p2Wins = 0;
  let ties = 0;

  completedGames.forEach(game => {
    const c = courses.find(course => course.id === game.courseId);
    if (!c) return;

    const p1Scores = game.scores[p1.id] || [];
    const p2Scores = game.scores[p2.id] || [];

    const p1Sum = p1Scores.reduce((a, b) => a + b, 0);
    const p2Sum = p2Scores.reduce((a, b) => a + b, 0);

    if (p1Sum > 0 && p2Sum > 0) {
      h2hTotal++;
      if (p1Sum < p2Sum) p1Wins++;
      else if (p2Sum < p1Sum) p2Wins++;
      else ties++;
    }
  });

  // Individual Stats helper
  const getPlayerStats = (playerId: string) => {
    let totalScore = 0;
    let totalParsSum = 0;
    let roundsCount = 0;
    let bestScore = Infinity;
    let bestGameInfo = '';
    
    let totalStrokesSum = 0;
    let totalPuttsSum = 0;
    let bestStrokes = Infinity;
    let bestPutts = Infinity;
    let bestScoreToPar = 0;

    // Hole outcome distributions
    let eaglesAndBetter = 0;
    let birdies = 0;
    let pars = 0;
    let bogeys = 0;
    let doublesAndWorse = 0;
    let totalHolesCount = 0;

    completedGames.forEach(game => {
      const course = courses.find(c => c.id === game.courseId);
      if (!course) return;

      const scores = game.scores[playerId];
      if (!scores || scores.length < 18) return;

      const roundSum = scores.reduce((a, b) => a + b, 0);
      const courseParSum = course.pars.reduce((a, b) => a + b, 0);

      if (roundSum > 0) {
        totalScore += roundSum;
        totalParsSum += courseParSum;
        roundsCount++;

        // Calculate strokes and putts using saved fields if available, otherwise heuristic fallback
        let roundStrokes = 0;
        let roundPutts = 0;
        const savedShots = game.shots?.[playerId];
        const savedPutts = game.putts?.[playerId];

        if (savedShots && savedPutts) {
          scores.forEach((score, idx) => {
            if (score > 0) {
              roundStrokes += savedShots[idx] || 0;
              roundPutts += savedPutts[idx] || 0;
            }
          });
        } else {
          scores.forEach(score => {
            if (score > 0) {
              if (score === 1) {
                roundStrokes += 1;
              } else if (score === 2) {
                roundStrokes += 1;
                roundPutts += 1;
              } else {
                roundPutts += 2;
                roundStrokes += (score - 2);
              }
            }
          });
        }

        totalStrokesSum += roundStrokes;
        totalPuttsSum += roundPutts;

        if (roundStrokes < bestStrokes) {
          bestStrokes = roundStrokes;
        }
        if (roundPutts < bestPutts) {
          bestPutts = roundPutts;
        }

        // Best score check
        if (roundSum < bestScore) {
          bestScore = roundSum;
          bestScoreToPar = roundSum - courseParSum;
          const diff = roundSum - courseParSum;
          const label = diff === 0 ? 'E' : `${diff}`;
          bestGameInfo = `${course.name} (${label}, ${new Date(game.date).toLocaleDateString()})`;
        }

        // Hole outcomes breakdown
        scores.forEach((score, holeIdx) => {
          if (score === 0) return;
          const par = course.pars[holeIdx];
          const diff = score - par;
          totalHolesCount++;

          if (diff < -1) eaglesAndBetter++;
          else if (diff === -1) birdies++;
          else if (diff === 0) pars++;
          else if (diff === 1) bogeys++;
          else doublesAndWorse++;
        });
      }
    });

    const averageScore = roundsCount > 0 ? (totalScore / roundsCount).toFixed(1) : '-';
    const avgToParVal = roundsCount > 0 ? (totalScore - totalParsSum) / roundsCount : 0;
    const averageToPar = roundsCount > 0 
      ? (avgToParVal === 0 ? 'E' : `${avgToParVal.toFixed(1)}`)
      : '-';

    // In golf, "Strokes" (타수) represents the total score (including putts)
    const averageStroke = averageScore;
    const bestStroke = bestScore === Infinity ? '-' : `${bestScore}`;

    // "Shots" represents shots excluding putts
    const averageShot = roundsCount > 0 ? (totalStrokesSum / roundsCount).toFixed(1) : '-';
    const bestShot = bestStrokes === Infinity ? '-' : `${bestStrokes}`;

    const averagePut = roundsCount > 0 ? (totalPuttsSum / roundsCount).toFixed(1) : '-';
    const bestPut = bestPutts === Infinity ? '-' : `${bestPutts}`;

    // Simple Handicap Index estimate (Average score over par)
    const handicapEst = roundsCount > 0 
      ? (avgToParVal * 0.96).toFixed(1)
      : '-';

    return {
      averageScore,
      averageToPar,
      bestScore: bestScore === Infinity ? '-' : (bestScoreToPar === 0 ? 'E' : `${bestScoreToPar}`),
      bestGameInfo,
      roundsCount,
      handicapEst,
      averageStroke,
      averagePut,
      bestStroke,
      bestPut,
      averageShot,
      bestShot,
      distributions: {
        eaglesAndBetter,
        birdies,
        pars,
        bogeys,
        doublesAndWorse,
        total: totalHolesCount || 1
      }
    };
  };

  const p1Stats = getPlayerStats(p1.id);
  const p2Stats = getPlayerStats(p2.id);

  const isP1Sk = p1.name.toLowerCase().startsWith('s');
  const p1TextClass = isP1Sk ? 'text-blue-600' : 'text-pink-500';
  const p2TextClass = !isP1Sk ? 'text-blue-600' : 'text-pink-500';

  // Safe division percentages for horizontal stacked bar
  const getPct = (val: number, total: number) => {
    return ((val / total) * 100).toFixed(1) + '%';
  };

  // Pre-calculate line chart SVG paths
  const renderTrendChart = () => {
    if (completedGames.length < 2) {
      return (
        <div className="h-48 flex items-center justify-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs text-center px-6">
          At least 2 completed rounds are required to show score trends.
        </div>
      );
    }

    const chartWidth = 600;
    const chartHeight = 220;
    const paddingX = 40;
    const paddingY = 30;

    // find min and max scores to scale Y-axis
    let allScores: number[] = [];
    const trendData = completedGames.map(game => {
      const course = courses.find(c => c.id === game.courseId);
      const totalPar = course ? course.pars.reduce((a, b) => a + b, 0) : 72;
      const p1RoundScore = (game.scores[p1.id] || []).reduce((a, b) => a + b, 0);
      const p2RoundScore = (game.scores[p2.id] || []).reduce((a, b) => a + b, 0);

      const p1Over = p1RoundScore > 0 ? (p1RoundScore - totalPar) : 0;
      const p2Over = p2RoundScore > 0 ? (p2RoundScore - totalPar) : 0;

      if (p1RoundScore > 0) allScores.push(p1Over);
      if (p2RoundScore > 0) allScores.push(p2Over);
      return {
        dateStr: new Date(game.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        p1: p1Over,
        p2: p2Over,
        p1Raw: p1RoundScore,
        p2Raw: p2RoundScore
      };
    });

    const maxScore = allScores.length > 0 ? Math.max(...allScores, 5) + 2 : 10;
    const minScore = allScores.length > 0 ? Math.min(...allScores, -2) - 2 : -5;
    const scoreRange = maxScore - minScore;

    // Helper functions for scaling coordinates
    const getX = (index: number) => {
      if (trendData.length <= 1) return paddingX;
      return paddingX + (index / (trendData.length - 1)) * (chartWidth - paddingX * 2);
    };

    const getY = (score: number) => {
      if (scoreRange === 0) return chartHeight / 2;
      return chartHeight - paddingY - ((score - minScore) / scoreRange) * (chartHeight - paddingY * 2);
    };

    // Construct SVG path strings
    let p1Points = '';
    let p2Points = '';

    trendData.forEach((d, idx) => {
      const x = getX(idx);
      if (d.p1Raw > 0) {
        const y1 = getY(d.p1);
        p1Points += `${p1Points === '' ? 'M' : 'L'} ${x} ${y1} `;
      }
      if (d.p2Raw > 0) {
        const y2 = getY(d.p2);
        p2Points += `${p2Points === '' ? 'M' : 'L'} ${x} ${y2} `;
      }
    });

    // Horizontal grid lines (3 lines)
    const gridScores = [
      Math.round(minScore + scoreRange * 0.25),
      Math.round(minScore + scoreRange * 0.5),
      Math.round(minScore + scoreRange * 0.75),
    ];

    return (
      <div className="space-y-2" id="trend-chart-component">
        <div className="overflow-x-auto" id="trend-chart-scroll">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full min-w-[500px] h-auto overflow-visible font-sans">
            {/* Grid Lines */}
            {gridScores.map((scoreValue, i) => (
              <g key={i} className="opacity-10">
                <line 
                  x1={paddingX} 
                  y1={getY(scoreValue)} 
                  x2={chartWidth - paddingX} 
                  y2={getY(scoreValue)} 
                  stroke="#475569" 
                  strokeWidth="1" 
                  strokeDasharray="4 4"
                />
                <text 
                  x={paddingX - 10} 
                  y={getY(scoreValue) + 3} 
                  fontSize="9" 
                  fill="#475569" 
                  textAnchor="end"
                  className="font-mono"
                >
                  {scoreValue > 0 ? `+${scoreValue}` : scoreValue === 0 ? 'E' : scoreValue}
                </text>
              </g>
            ))}

            {/* X-axis labels */}
            {trendData.map((d, idx) => (
              <text
                key={idx}
                x={getX(idx)}
                y={chartHeight - 8}
                fontSize="8"
                fill="#94a3b8"
                textAnchor="middle"
                className="font-medium"
              >
                {d.dateStr}
              </text>
            ))}

            {/* Player 1 Line & Dots */}
            {p1Points && (
              <>
                <path 
                  d={p1Points.trim()} 
                  fill="none" 
                  stroke={isP1Sk ? "#2563eb" : "#ec4899"} 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                {trendData.map((d, idx) => d.p1Raw > 0 && (
                  <g key={`p1-${idx}`}>
                    <circle 
                      cx={getX(idx)} 
                      cy={getY(d.p1)} 
                      r="4" 
                      fill={isP1Sk ? "#2563eb" : "#ec4899"} 
                      stroke="#ffffff" 
                      strokeWidth="1.5"
                    />
                    <text 
                      x={getX(idx)} 
                      y={getY(d.p1) - 8} 
                      fontSize="9" 
                      fontWeight="bold" 
                      fill={isP1Sk ? "#1d4ed8" : "#be185d"} 
                      textAnchor="middle"
                      className="font-mono bg-white"
                    >
                      {d.p1 > 0 ? `+${d.p1}` : d.p1 === 0 ? 'E' : d.p1}
                    </text>
                  </g>
                ))}
              </>
            )}

            {/* Player 2 Line & Dots */}
            {p2Points && (
              <>
                <path 
                  d={p2Points.trim()} 
                  fill="none" 
                  stroke={!isP1Sk ? "#2563eb" : "#ec4899"} 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                {trendData.map((d, idx) => d.p2Raw > 0 && (
                  <g key={`p2-${idx}`}>
                    <circle 
                      cx={getX(idx)} 
                      cy={getY(d.p2)} 
                      r="4" 
                      fill={!isP1Sk ? "#2563eb" : "#ec4899"} 
                      stroke="#ffffff" 
                      strokeWidth="1.5"
                    />
                    <text 
                      x={getX(idx)} 
                      y={getY(d.p2) + 14} 
                      fontSize="9" 
                      fontWeight="bold" 
                      fill={!isP1Sk ? "#1d4ed8" : "#be185d"} 
                      textAnchor="middle"
                      className="font-mono"
                    >
                      {d.p2 > 0 ? `+${d.p2}` : d.p2 === 0 ? 'E' : d.p2}
                    </text>
                  </g>
                ))}
              </>
            )}
          </svg>
        </div>
        <div className="flex items-center justify-center gap-6 text-[10px] text-slate-500 font-sans" id="chart-legend-box">
          <div className="flex items-center gap-1.5">
            <span className={`w-3 h-0.5 rounded inline-block ${isP1Sk ? "bg-blue-500" : "bg-pink-500"}`}></span>
            <span className="font-semibold text-slate-700">{p1.name.toUpperCase()} (Avg {p1Stats.averageToPar})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-3 h-0.5 rounded inline-block ${!isP1Sk ? "bg-blue-500" : "bg-pink-500"}`}></span>
            <span className="font-semibold text-slate-700">{p2.name.toUpperCase()} (Avg {p2Stats.averageToPar})</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6" id="record-tab-container">
      {/* Unified Tab Header */}
      <div className="flex items-center gap-3 pb-2 border-b border-slate-100" id="record-header-row">
        <span className="text-3xl filter drop-shadow-sm shrink-0">🏆</span>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight text-shadow-sm" id="record-tab-title">
          Record
        </h2>
      </div>

      {/* Records Comparison Table */}
      <div className="bg-white rounded-2xl border-2 border-slate-300 overflow-hidden shadow-sm animate-fade-in" id="records-comparison-table-card">
         <div className="overflow-x-auto" id="records-table-wrapper">
          <table className="w-full text-left border-collapse text-sm sm:text-base font-sans" id="records-table">
            <thead>
              <tr className="bg-slate-100 border-b-2 border-slate-300 text-slate-700 font-bold" id="records-table-head-row">
                <th className="py-3 px-3 font-black text-center w-[40%]">Metric</th>
                <th className={`py-3 px-3 font-black text-center ${p1TextClass} w-[30%]`}>{p1.name.toUpperCase()}</th>
                <th className={`py-3 px-3 font-black text-center ${p2TextClass} w-[30%]`}>{p2.name.toUpperCase()}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono text-slate-700" id="records-table-body">
              <tr className="bg-white hover:bg-slate-50 transition-colors" id="row-avg-score">
                <td className="py-2.5 px-3 font-sans font-bold text-center text-slate-600 bg-slate-50/40">Average Score</td>
                <td className={`py-2.5 px-3 text-center font-extrabold ${p1TextClass}`}>{p1Stats.averageToPar}</td>
                <td className={`py-2.5 px-3 text-center font-extrabold ${p2TextClass}`}>{p2Stats.averageToPar}</td>
              </tr>
              <tr className="bg-slate-100/65 hover:bg-slate-100 transition-colors" id="row-best-score">
                <td className="py-2.5 px-3 font-sans font-bold text-center text-slate-600 bg-slate-100/30">Best Score</td>
                <td className={`py-2.5 px-3 text-center font-extrabold ${p1TextClass}`}>{p1Stats.bestScore}</td>
                <td className={`py-2.5 px-3 text-center font-extrabold ${p2TextClass}`}>{p2Stats.bestScore}</td>
              </tr>
              <tr className="bg-white hover:bg-slate-50 transition-colors" id="row-avg-shot">
                <td className="py-2.5 px-3 font-sans font-bold text-center text-slate-600 bg-slate-50/40">Average Shots</td>
                <td className={`py-2.5 px-3 text-center font-extrabold ${p1TextClass}`}>{p1Stats.averageShot}</td>
                <td className={`py-2.5 px-3 text-center font-extrabold ${p2TextClass}`}>{p2Stats.averageShot}</td>
              </tr>
              <tr className="bg-slate-100/65 hover:bg-slate-100 transition-colors" id="row-best-shot">
                <td className="py-2.5 px-3 font-sans font-bold text-center text-slate-600 bg-slate-100/30">Best Shots</td>
                <td className={`py-2.5 px-3 text-center font-extrabold ${p1TextClass}`}>{p1Stats.bestShot}</td>
                <td className={`py-2.5 px-3 text-center font-extrabold ${p2TextClass}`}>{p2Stats.bestShot}</td>
              </tr>
              <tr className="bg-white hover:bg-slate-50 transition-colors" id="row-avg-put">
                <td className="py-2.5 px-3 font-sans font-bold text-center text-slate-600 bg-slate-50/40">Average Putts</td>
                <td className={`py-2.5 px-3 text-center font-extrabold ${p1TextClass}`}>{p1Stats.averagePut}</td>
                <td className={`py-2.5 px-3 text-center font-extrabold ${p2TextClass}`}>{p2Stats.averagePut}</td>
              </tr>
              <tr className="bg-slate-100/65 hover:bg-slate-100 transition-colors" id="row-best-put">
                <td className="py-2.5 px-3 font-sans font-bold text-center text-slate-600 bg-slate-100/30">Best Putts</td>
                <td className={`py-2.5 px-3 text-center font-extrabold ${p1TextClass}`}>{p1Stats.bestPut}</td>
                <td className={`py-2.5 px-3 text-center font-extrabold ${p2TextClass}`}>{p2Stats.bestPut}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Score Progress Trend Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 space-y-4" id="trend-card">
        <div className="flex items-center gap-2" id="trend-header">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          <h3 className="text-base font-bold text-slate-800">Recent Score Progression Trend (Over Par)</h3>
        </div>
        {renderTrendChart()}
      </div>
    </div>
  );
};
