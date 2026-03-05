'use client';

import { useLocalStorage } from './useLocalStorage';
import { HandData } from '@/types';
import { generateId } from '@/utils/tableLayout';

const STORAGE_KEY = 'pokernotes_hands';

export function useHands() {
  const [hands, setHands, mounted] = useLocalStorage<HandData[]>(
    STORAGE_KEY,
    []
  );

  function createHand(): HandData {
    const newHand: HandData = {
      id: generateId(),
      heroPosition: null,
      heroCards: null,
      players: {},
      playersInHand: [],
      board: { flop: null, turn: null, river: null },
      actions: { preflop: [], flop: [], turn: [], river: [] },
      pot: 0,
      state: 'SELECT_HERO',
      createdAt: new Date().toISOString(),
    };
    setHands((prev) => [...prev, newHand]);
    return newHand;
  }

  function updateHand(id: string, updates: Partial<HandData>) {
    setHands((prev) =>
      prev.map((h) => (h.id === id ? { ...h, ...updates } : h))
    );
  }

  function deleteHand(id: string) {
    setHands((prev) => prev.filter((h) => h.id !== id));
  }

  function getHand(id: string): HandData | undefined {
    return hands.find((h) => h.id === id);
  }

  return { hands, mounted, createHand, updateHand, deleteHand, getHand };
}
