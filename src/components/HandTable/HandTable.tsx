'use client';

import React from 'react';
import { POSITIONS, POSITION_COUNT, SUIT_SYMBOLS, SUIT_COLORS } from '@/constants/hand';
import { HandData, HandPlayer, Card } from '@/types';
import { getSeatPosition, getDealerPosition } from '@/utils/tableLayout';
import styles from './HandTable.module.scss';

interface HandTableProps {
  hand: HandData;
  onSelectHero?: (position: number) => void;
  selectedRivals?: number[];
  onToggleRival?: (position: number) => void;
  currentTurnPosition?: number | null;
}

function formatCards(cards: [Card, Card] | null): React.ReactNode {
  if (!cards) return null;
  return cards.map((c, i) => {
    if (c === '?') return <span key={i} className={styles.cardUnknown}>??</span>;
    const rank = c.slice(0, -1);
    const suit = c.slice(-1);
    return (
      <span key={i} style={{ color: SUIT_COLORS[suit] }}>
        {rank}{SUIT_SYMBOLS[suit]}
      </span>
    );
  });
}

export default function HandTable({
  hand,
  onSelectHero,
  selectedRivals,
  onToggleRival,
  currentTurnPosition,
}: HandTableProps) {
  const isSelectHero = hand.state === 'SELECT_HERO';
  const isSelectRivals = hand.state === 'SELECT_RIVALS';

  // Fixed 10-seat layout, no rotation
  const dealerPos = getDealerPosition(POSITION_COUNT, 0);

  function handleSeatClick(pos: number) {
    if (isSelectHero && onSelectHero) {
      onSelectHero(pos);
    } else if (isSelectRivals && onToggleRival && pos !== hand.heroPosition) {
      onToggleRival(pos);
    }
  }

  return (
    <div className={styles.tableContainer}>
      {/* Outer dark rail */}
      <div className={styles.rail}>
        {/* Inner green felt */}
        <div className={styles.felt}>
          {isSelectHero && (
            <p className={styles.hint}>Seleccioná tu posición</p>
          )}
          {isSelectRivals && (
            <p className={styles.hint}>Seleccioná los rivales</p>
          )}
          {!isSelectHero && !isSelectRivals && (
            <BoardDisplay hand={hand} />
          )}
        </div>
      </div>

      {/* Dealer chip */}
      <div
        className={styles.dealerWrapper}
        style={{ left: dealerPos.left, top: dealerPos.top }}
      >
        <div className={styles.dealerChip}>D</div>
      </div>

      {/* Seats */}
      {Array.from({ length: POSITION_COUNT }, (_, i) => {
        const pos = i + 1;
        const posStyle = getSeatPosition(i, POSITION_COUNT, 0);
        const isHero = hand.heroPosition === pos;
        const player: HandPlayer | undefined = hand.players[pos];
        const isInHand = hand.playersInHand.includes(pos);
        const isFolded = isInHand && player && !player.active;
        const isRivalSelected = selectedRivals?.includes(pos);
        const isCurrentTurn = currentTurnPosition === pos;
        const isSelectable =
          (isSelectHero) ||
          (isSelectRivals && pos !== hand.heroPosition);

        return (
          <div
            key={pos}
            className={styles.seatWrapper}
            style={{ left: posStyle.left, top: posStyle.top }}
          >
            <HandSeat
              position={pos}
              positionName={POSITIONS[pos]}
              isHero={isHero}
              isInHand={isInHand}
              isFolded={!!isFolded}
              isRivalSelected={!!isRivalSelected}
              isCurrentTurn={isCurrentTurn}
              isSelectable={isSelectable}
              cards={player?.cards ?? null}
              showCards={!isSelectHero && !isSelectRivals}
              onTap={() => handleSeatClick(pos)}
            />
          </div>
        );
      })}
    </div>
  );
}

// ── HandSeat ────────────────────────────────────────────────────────────────

interface HandSeatProps {
  position: number;
  positionName: string;
  isHero: boolean;
  isInHand: boolean;
  isFolded: boolean;
  isRivalSelected: boolean;
  isCurrentTurn: boolean;
  isSelectable: boolean;
  cards: [Card, Card] | null;
  showCards: boolean;
  onTap: () => void;
}

function HandSeat({
  positionName,
  isHero,
  isInHand,
  isFolded,
  isRivalSelected,
  isCurrentTurn,
  isSelectable,
  cards,
  showCards,
  onTap,
}: HandSeatProps) {
  const avatarClass = [
    styles.avatar,
    isHero
      ? styles.avatarMine
      : isCurrentTurn
      ? styles.avatarCurrentTurn
      : isRivalSelected
      ? styles.avatarRivalSelected
      : isInHand && !isFolded
      ? styles.avatarInHand
      : isFolded
      ? styles.avatarFolded
      : isSelectable
      ? styles.avatarSelectable
      : styles.avatarEmpty,
  ].join(' ');

  return (
    <button className={styles.seatBtn} onClick={onTap}>
      <div className={avatarClass}>
        {isHero ? (
          <span className={styles.star}>★</span>
        ) : (
          <span className={styles.posNum}>{positionName}</span>
        )}
      </div>
      {isHero && <span className={styles.labelMine}>Héroe</span>}
      {showCards && cards && (
        <span className={styles.cardLabel}>{formatCards(cards)}</span>
      )}
      {isFolded && <span className={styles.foldedLabel}>FOLD</span>}
    </button>
  );
}

// ── BoardDisplay ────────────────────────────────────────────────────────────

function formatPot(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace('.0', '')}k`;
  return n.toString();
}

function BoardDisplay({ hand }: { hand: HandData }) {
  const { flop, turn, river } = hand.board;
  if (!flop) return <span className={styles.logo}>♠</span>;

  function renderCard(c: Card, i: number) {
    if (c === '?') return <span key={i} className={styles.boardCard} style={{ color: 'var(--text-secondary)' }}>??</span>;
    const rank = c.slice(0, -1);
    const suit = c.slice(-1);
    return (
      <span key={i} className={styles.boardCard} style={{ color: SUIT_COLORS[suit] }}>
        {rank}{SUIT_SYMBOLS[suit]}
      </span>
    );
  }

  return (
    <>
      <div className={styles.board}>
        {flop.map((c, i) => renderCard(c, i))}
        {turn && renderCard(turn, 3)}
        {river && renderCard(river, 4)}
      </div>
      {hand.pot > 0 && (
        <span className={styles.pot}>Pot: {formatPot(hand.pot)}</span>
      )}
    </>
  );
}
