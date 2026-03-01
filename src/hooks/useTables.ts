'use client';

import { useLocalStorage } from './useLocalStorage';
import { TableData, PlayerCount, SeatData } from '@/types';
import { generateId } from '@/utils/tableLayout';

const STORAGE_KEY = 'pokernotes_tables';

export function useTables() {
  const [tables, setTables, mounted] = useLocalStorage<TableData[]>(
    STORAGE_KEY,
    []
  );

  function createTable(playerCount: PlayerCount, name: string): TableData {
    const seats: SeatData[] = Array.from({ length: playerCount }, (_, i) => ({
      id: i + 1,
      color: null,
      notes: '',
      stack: null,
    }));

    const newTable: TableData = {
      id: generateId(),
      name,
      playerCount,
      seats,
      mySeatId: null,
      createdAt: new Date().toISOString(),
    };

    setTables((prev) => [...prev, newTable]);
    return newTable;
  }

  function updateSeat(
    tableId: string,
    seatId: number,
    updates: Partial<SeatData>
  ) {
    setTables((prev) =>
      prev.map((t) =>
        t.id === tableId
          ? {
              ...t,
              seats: t.seats.map((s) =>
                s.id === seatId ? { ...s, ...updates } : s
              ),
            }
          : t
      )
    );
  }

  function setMySeat(tableId: string, seatId: number | null) {
    setTables((prev) =>
      prev.map((t) => (t.id === tableId ? { ...t, mySeatId: seatId } : t))
    );
  }

  function deleteTable(tableId: string) {
    setTables((prev) => prev.filter((t) => t.id !== tableId));
  }

  function getTable(tableId: string): TableData | undefined {
    return tables.find((t) => t.id === tableId);
  }

  return { tables, mounted, createTable, updateSeat, setMySeat, deleteTable, getTable };
}
