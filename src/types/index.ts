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
