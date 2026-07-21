import { Player, Course, Game } from './types';

export const initialPlayers: Player[] = [
  { id: 'p1', name: 'Sk' },
  { id: 'p2', name: 'Ky' }
];

export const initialCourses: Course[] = [
  {
    id: 'c1',
    name: 'SKKY Golf CC',
    address: '123 Skyview Lane, Seoul',
    phone: '02-123-4567',
    totalPar: 72,
    blueRating: '72.4',
    blueSlope: '125',
    redRating: '70.1',
    redSlope: '118',
    pars: [4, 4, 3, 5, 4, 4, 3, 5, 4, 4, 3, 4, 5, 4, 3, 4, 4, 5] // Par 72
  },
  {
    id: 'c2',
    name: 'Dallas Monday CC',
    address: '456 Preston Road, Dallas, TX',
    phone: '214-555-0199',
    totalPar: 72,
    blueRating: '71.8',
    blueSlope: '122',
    redRating: '69.4',
    redSlope: '115',
    pars: [4, 3, 4, 4, 5, 3, 4, 5, 4, 4, 4, 3, 5, 4, 4, 3, 5, 4] // Par 72
  },
  {
    id: 'c3',
    name: 'Stonebriar Golf Club',
    address: '5050 Country Club Drive, Frisco, TX',
    phone: '972-625-5050',
    totalPar: 71,
    blueRating: '71.1',
    blueSlope: '120',
    redRating: '68.9',
    redSlope: '113',
    pars: [4, 4, 3, 4, 5, 3, 4, 4, 4, 4, 3, 5, 4, 4, 3, 4, 5, 4] // Par 71
  }
];

export const initialGames: Game[] = [
  {
    id: 'g1',
    date: '2026-06-15T10:30:00Z',
    courseId: 'c1',
    courseName: 'SKKY Golf CC',
    players: [initialPlayers[0], initialPlayers[1]],
    scores: {
      'p1': [4, 5, 3, 6, 4, 4, 4, 5, 4,  5, 3, 4, 5, 4, 3, 5, 5, 5], // Total: 78 (+6)
      'p2': [5, 4, 4, 5, 5, 5, 3, 6, 4,  4, 4, 5, 6, 4, 4, 4, 4, 6]  // Total: 82 (+10)
    },
    status: 'completed',
    currentHole: 17
  },
  {
    id: 'g2',
    date: '2026-06-29T09:00:00Z',
    courseId: 'c2',
    courseName: 'Dallas Monday CC',
    players: [initialPlayers[0], initialPlayers[1]],
    scores: {
      'p1': [5, 4, 4, 5, 6, 3, 5, 5, 4,  4, 5, 3, 6, 5, 4, 4, 6, 4], // Total: 82 (+10)
      'p2': [4, 3, 4, 4, 5, 4, 4, 5, 4,  4, 4, 3, 5, 4, 4, 3, 5, 5]  // Total: 74 (+2)
    },
    status: 'completed',
    currentHole: 17
  },
  {
    id: 'g3',
    date: '2026-07-06T08:15:00Z',
    courseId: 'c3',
    courseName: 'Stonebriar Golf Club',
    players: [initialPlayers[0], initialPlayers[1]],
    scores: {
      'p1': [4, 4, 3, 4, 4, 3, 4, 4, 5,  4, 3, 5, 4, 4, 3, 4, 5, 4], // Total: 72 (+1)
      'p2': [4, 5, 3, 5, 5, 3, 4, 5, 4,  5, 3, 6, 4, 4, 4, 3, 5, 4]  // Total: 76 (+5)
    },
    status: 'completed',
    currentHole: 17
  }
];
