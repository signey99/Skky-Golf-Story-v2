export interface Player {
  id: string;
  name: string;
}

export interface Course {
  id: string;
  name: string;
  address: string;
  phone: string;
  totalPar: number;
  blueRating: string;
  blueSlope: string;
  redRating: string;
  redSlope: string;
  pars: number[]; // 18 numbers
}

export interface Game {
  id: string;
  date: string; // ISO string
  courseId: string;
  courseName: string;
  players: [Player, Player];
  scores: {
    [playerId: string]: number[]; // 18 numbers, e.g. [4, 5, 3, ...]
  };
  shots?: {
    [playerId: string]: number[]; // 18 numbers, e.g. [2, 3, 1, ...]
  };
  putts?: {
    [playerId: string]: number[]; // 18 numbers, e.g. [2, 2, 2, ...]
  };
  status: 'active' | 'completed';
  currentHole: number; // 0 to 17
  photos?: string[]; // base64 strings
}
