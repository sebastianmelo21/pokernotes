'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { HandData, HandState, HandAction, ActionType, Card, HandPlayer } from '@/types';
import { PREFLOP_ORDER, POSTFLOP_ORDER } from '@/constants/hand';
import { useHands } from './useHands';

type Street = 'preflop' | 'flop' | 'turn' | 'river';

interface BettingRoundState {
  currentTurnIndex: number;
  activeTurnOrder: number[];
  currentBet: number;
  bets: Record<number, number>;
  hasRaise: boolean; // true once someone bet/raised (distinguishes limp from raise)
}

interface HandEngineState {
  hand: HandData | null;
  bettingRound: BettingRoundState | null;
  rivalCardSelectQueue: number[];
  currentRivalCardSelect: number | null;
  heroStack: number | null;
  rivalStacks: Record<number, number | null>;
}

function buildTurnOrder(positions: number[], street: Street): number[] {
  const base = street === 'preflop' ? PREFLOP_ORDER : POSTFLOP_ORDER;
  return base.filter((p) => positions.includes(p));
}

function initBettingRound(
  activePlayers: number[],
  street: Street
): BettingRoundState {
  const order = buildTurnOrder(activePlayers, street);
  return {
    currentTurnIndex: 0,
    activeTurnOrder: order,
    currentBet: 0,
    bets: Object.fromEntries(activePlayers.map((p) => [p, 0])),
    hasRaise: false,
  };
}

export function useHandEngine(handId: string) {
  const { getHand, updateHand, mounted } = useHands();
  const [engine, setEngine] = useState<HandEngineState>({
    hand: null,
    bettingRound: null,
    rivalCardSelectQueue: [],
    currentRivalCardSelect: null,
    heroStack: null,
    rivalStacks: {},
  });

  // Sync hand from storage — wait until localStorage is loaded
  useEffect(() => {
    if (!mounted) return;
    const h = getHand(handId);
    if (!h) return;
    setEngine((prev) => ({ ...prev, hand: h }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handId, mounted]);

  // Keep a ref to latest engine state so callbacks don't stale-close
  const engineRef = useRef(engine);
  engineRef.current = engine;

  // Helper: persist hand + update local state
  const saveHand = useCallback(
    (updates: Partial<HandData>) => {
      const current = engineRef.current.hand;
      if (!current) return;
      const next = { ...current, ...updates };
      updateHand(handId, updates);
      setEngine((prev) => ({ ...prev, hand: next }));
    },
    [handId, updateHand]
  );

  // ── STEP 1: Hero selects position ──────────────────────────────────────
  const selectHeroPosition = useCallback(
    (position: number, stack: number | null = null) => {
      saveHand({ heroPosition: position, state: 'SELECT_HERO_CARDS' });
      // Stack will be applied when players map is built in confirmRivals
      setEngine((prev) => ({ ...prev, heroStack: stack }));
    },
    [saveHand]
  );

  // ── STEP 2: Hero selects cards ─────────────────────────────────────────
  const confirmHeroCards = useCallback(
    (cards: [Card, Card]) => {
      saveHand({ heroCards: cards, state: 'SELECT_RIVALS' });
    },
    [saveHand]
  );

  // ── STEP 3: Select rivals ──────────────────────────────────────────────
  const confirmRivals = useCallback(
    (rivalPositions: number[], rivalStacks: Record<number, number | null> = {}) => {
      const hand = engineRef.current.hand;
      if (!hand || hand.heroPosition == null) return;

      const heroStack = engineRef.current.heroStack;
      const allInHand = [...rivalPositions, hand.heroPosition];

      // Build players map with stacks
      const players: Record<number, HandPlayer> = {};
      allInHand.forEach((pos) => {
        players[pos] = {
          position: pos,
          cards: pos === hand.heroPosition ? hand.heroCards : null,
          active: true,
          stack: pos === hand.heroPosition ? heroStack : (rivalStacks[pos] ?? null),
        };
      });

      // Queue rivals for card selection
      setEngine((prev) => ({
        ...prev,
        rivalCardSelectQueue: [...rivalPositions],
        currentRivalCardSelect: rivalPositions[0] ?? null,
      }));

      saveHand({
        playersInHand: allInHand,
        players,
        state: 'SELECT_RIVAL_CARDS',
      });
    },
    [saveHand]
  );

  // ── STEP 4: Rival card selection ───────────────────────────────────────
  const confirmRivalCards = useCallback(
    (position: number, cards: [Card, Card]) => {
      const hand = engineRef.current.hand;
      if (!hand) return;

      const updatedPlayers: Record<number, HandPlayer> = {
        ...hand.players,
        [position]: { ...hand.players[position], cards },
      };

      const queue = engineRef.current.rivalCardSelectQueue.filter(
        (p) => p !== position
      );
      const nextRival = queue[0] ?? null;

      if (nextRival !== null) {
        // Still more rivals to fill cards
        setEngine((prev) => ({
          ...prev,
          rivalCardSelectQueue: queue,
          currentRivalCardSelect: nextRival,
        }));
        saveHand({ players: updatedPlayers });
      } else {
        // All rivals done → ready for preflop
        setEngine((prev) => ({
          ...prev,
          rivalCardSelectQueue: [],
          currentRivalCardSelect: null,
        }));
        saveHand({ players: updatedPlayers, state: 'PREFLOP' });
      }
    },
    [saveHand]
  );

  // ── Shared: start a betting round ──────────────────────────────────────
  const startBettingRound = useCallback(
    (street: Street, activePlayers: number[]) => {
      const round = initBettingRound(activePlayers, street);
      setEngine((prev) => ({ ...prev, bettingRound: round }));
    },
    []
  );

  // Called when entering PREFLOP state (after rivals confirmed)
  const startPreflop = useCallback(() => {
    const hand = engineRef.current.hand;
    if (!hand) return;
    const active = hand.playersInHand.filter(
      (p) => hand.players[p]?.active !== false
    );
    startBettingRound('preflop', active);
  }, [startBettingRound]);

  // ── STEP 5+: Register a betting action ────────────────────────────────
  const registerAction = useCallback(
    (action: ActionType, amount?: number) => {
      const { hand, bettingRound } = engineRef.current;
      if (!hand || !bettingRound) return;

      const street = stateToStreet(hand.state);
      if (!street) return;

      const position =
        bettingRound.activeTurnOrder[bettingRound.currentTurnIndex];
      if (position == null) return;

      const handAction: HandAction = { position, action, amount };

      // Update actions list
      const updatedActions = {
        ...hand.actions,
        [street]: [...hand.actions[street], handAction],
      };

      // Update players and bettingRound
      let updatedPlayers = { ...hand.players };
      let updatedBetting = { ...bettingRound };

      if (action === 'fold') {
        // Mark inactive, remove from turn order (index shifts naturally)
        updatedPlayers = {
          ...updatedPlayers,
          [position]: { ...updatedPlayers[position], active: false },
        };
        updatedBetting = {
          ...updatedBetting,
          activeTurnOrder: updatedBetting.activeTurnOrder.filter(
            (p) => p !== position
          ),
        };
      } else if (action === 'bet' || action === 'raise') {
        const betAmount = amount ?? 1;
        const base = street === 'preflop' ? PREFLOP_ORDER : POSTFLOP_ORDER;
        const otherActive = Object.values(updatedPlayers)
          .filter((p) => p.active && p.position !== position)
          .map((p) => p.position);
        const bettorBaseIdx = base.indexOf(position);
        const rotated = [
          ...base.slice(bettorBaseIdx + 1),
          ...base.slice(0, bettorBaseIdx + 1),
        ].filter((p) => otherActive.includes(p));

        updatedBetting = {
          ...updatedBetting,
          currentBet: betAmount,
          bets: { ...updatedBetting.bets, [position]: betAmount },
          activeTurnOrder: rotated,
          currentTurnIndex: 0,
          hasRaise: true,
        };
      } else if (action === 'limp') {
        // Limp = call the BB preflop without raising. Sets currentBet to 1
        // (sentinel for "BB level") if nobody has acted yet, then advances.
        updatedBetting = {
          ...updatedBetting,
          currentBet: updatedBetting.currentBet === 0 ? 1 : updatedBetting.currentBet,
          bets: { ...updatedBetting.bets, [position]: updatedBetting.currentBet || 1 },
        };
        updatedBetting = advance(updatedBetting);
      } else if (action === 'call') {
        updatedBetting = {
          ...updatedBetting,
          bets: { ...updatedBetting.bets, [position]: updatedBetting.currentBet },
        };
        updatedBetting = advance(updatedBetting);
      } else {
        // check
        updatedBetting = advance(updatedBetting);
      }

      // Check how many active players remain
      const activePlayers = Object.values(updatedPlayers).filter(
        (p) => p.active
      );

      // Update pot
      let potDelta = 0;
      if (action === 'bet' || action === 'raise') {
        potDelta = amount ?? 0;
      } else if (action === 'call') {
        potDelta = updatedBetting.currentBet;
      }
      const updatedPot = (hand.pot ?? 0) + potDelta;

      // Persist actions + players + pot
      saveHand({ actions: updatedActions, players: updatedPlayers, pot: updatedPot });

      // Round is over when index exceeds the order (everyone acted) or only 1 left
      const roundOver =
        activePlayers.length <= 1 ||
        updatedBetting.currentTurnIndex >= updatedBetting.activeTurnOrder.length;

      if (activePlayers.length <= 1) {
        // Hand over — only one player left
        saveHand({
          actions: updatedActions,
          players: updatedPlayers,
          state: 'FINISHED',
        });
        setEngine((prev) => ({ ...prev, bettingRound: null }));
        return;
      }

      if (roundOver) {
        // Advance to next street
        const nextState = nextStreetState(hand.state);
        saveHand({
          actions: updatedActions,
          players: updatedPlayers,
          state: nextState,
        });
        setEngine((prev) => ({ ...prev, bettingRound: null }));
      } else {
        setEngine((prev) => ({ ...prev, bettingRound: updatedBetting }));
      }
    },
    [saveHand]
  );

  // ── Board cards ────────────────────────────────────────────────────────
  const confirmFlop = useCallback(
    (cards: [Card, Card, Card]) => {
      const hand = engineRef.current.hand;
      if (!hand) return;
      const active = Object.values(hand.players)
        .filter((p) => p.active)
        .map((p) => p.position);
      saveHand({
        board: { ...hand.board, flop: cards },
        state: 'FLOP',
      });
      startBettingRound('flop', active);
    },
    [saveHand, startBettingRound]
  );

  const confirmTurn = useCallback(
    (card: Card) => {
      const hand = engineRef.current.hand;
      if (!hand) return;
      const active = Object.values(hand.players)
        .filter((p) => p.active)
        .map((p) => p.position);
      saveHand({
        board: { ...hand.board, turn: card },
        state: 'TURN',
      });
      startBettingRound('turn', active);
    },
    [saveHand, startBettingRound]
  );

  const confirmRiver = useCallback(
    (card: Card) => {
      const hand = engineRef.current.hand;
      if (!hand) return;
      const active = Object.values(hand.players)
        .filter((p) => p.active)
        .map((p) => p.position);
      saveHand({
        board: { ...hand.board, river: card },
        state: 'RIVER',
      });
      startBettingRound('river', active);
    },
    [saveHand, startBettingRound]
  );

  const currentTurnPosition =
    engine.bettingRound?.activeTurnOrder[
      engine.bettingRound.currentTurnIndex
    ] ?? null;

  return {
    hand: engine.hand,
    bettingRound: engine.bettingRound,
    currentRivalCardSelect: engine.currentRivalCardSelect,
    currentTurnPosition,
    selectHeroPosition,
    confirmHeroCards,
    confirmRivals,
    confirmRivalCards,
    startPreflop,
    registerAction,
    confirmFlop,
    confirmTurn,
    confirmRiver,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────

function stateToStreet(state: HandState): Street | null {
  if (state === 'PREFLOP') return 'preflop';
  if (state === 'FLOP') return 'flop';
  if (state === 'TURN') return 'turn';
  if (state === 'RIVER') return 'river';
  return null;
}

function nextStreetState(state: HandState): HandState {
  if (state === 'PREFLOP') return 'SELECT_FLOP';
  if (state === 'FLOP') return 'SELECT_TURN';
  if (state === 'TURN') return 'SELECT_RIVER';
  if (state === 'RIVER') return 'SHOWDOWN';
  return 'FINISHED';
}

function advance(round: BettingRoundState): BettingRoundState {
  return { ...round, currentTurnIndex: round.currentTurnIndex + 1 };
}
