// 10 fixed positions for hand logging
export const POSITIONS: Record<number, string> = {
  1: 'SB',
  2: 'BB',
  3: 'UTG',
  4: 'UTG+1',
  5: 'UTG+2',
  6: 'MP',
  7: 'LJ',
  8: 'HJ',
  9: 'CO',
  10: 'BTN',
};

export const POSITION_COUNT = 10;

// Turn order preflop: UTG first, then around to BB
export const PREFLOP_ORDER = [3, 4, 5, 6, 7, 8, 9, 10, 1, 2];

// Turn order postflop: SB first
export const POSTFLOP_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
const SUITS = ['s', 'h', 'd', 'c'];

export const FULL_DECK: string[] = RANKS.flatMap((rank) =>
  SUITS.map((suit) => `${rank}${suit}`)
);

export const SUIT_SYMBOLS: Record<string, string> = {
  s: '♠',
  h: '♥',
  d: '♦',
  c: '♣',
};

export const SUIT_COLORS: Record<string, string> = {
  s: '#c0c8d8', // picas — gris claro (sobre fondo oscuro)
  h: '#e74c3c', // corazones — rojo
  d: '#4a9eff', // diamantes — azul
  c: '#2ecc71', // tréboles — verde
};
