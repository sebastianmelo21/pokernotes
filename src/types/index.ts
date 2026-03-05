export type PlayerCount = 6 | 8 | 9 | 10;

export interface SeatData {
  id: number;
  color: string | null;
  notes: string;
  stack: number | null;
}

export interface TableData {
  id: string;
  name: string;
  playerCount: PlayerCount;
  seats: SeatData[];
  mySeatId: number | null;
  createdAt: string;
}

// --- Hand types ---

export type HandState =
  | 'INIT'
  | 'SELECT_HERO'
  | 'SELECT_HERO_CARDS'
  | 'SELECT_RIVALS'
  | 'SELECT_RIVAL_CARDS'
  | 'PREFLOP'
  | 'SELECT_FLOP'
  | 'FLOP'
  | 'SELECT_TURN'
  | 'TURN'
  | 'SELECT_RIVER'
  | 'RIVER'
  | 'SHOWDOWN'
  | 'FINISHED';

export type ActionType = 'fold' | 'call' | 'raise' | 'check' | 'bet' | 'limp';

export interface HandAction {
  position: number;
  action: ActionType;
  amount?: number;
}

export type Card = string; // e.g. "As", "Kd", "?"

export interface HandPlayer {
  position: number;
  cards: [Card, Card] | null;
  active: boolean;
  stack: number | null;
}

export interface HandData {
  id: string;
  heroPosition: number | null;
  heroCards: [Card, Card] | null;
  players: Record<number, HandPlayer>;
  playersInHand: number[];
  board: {
    flop: [Card, Card, Card] | null;
    turn: Card | null;
    river: Card | null;
  };
  actions: {
    preflop: HandAction[];
    flop: HandAction[];
    turn: HandAction[];
    river: HandAction[];
  };
  pot: number;
  state: HandState;
  createdAt: string;
}
