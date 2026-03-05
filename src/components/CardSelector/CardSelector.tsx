'use client';

import { useState } from 'react';
import { Card } from '@/types';
import { SUIT_SYMBOLS, SUIT_COLORS } from '@/constants/hand';
import styles from './CardSelector.module.scss';

interface CardSelectorProps {
  title: string;
  count: number; // how many cards to select (1, 2, or 3)
  usedCards: Card[]; // cards already taken (cannot be selected)
  allowUnknown?: boolean; // show "?" option (for rival cards)
  onConfirm: (cards: Card[]) => void;
  onClose?: () => void;
}

function parseCard(card: Card) {
  const rank = card.slice(0, -1);
  const suit = card.slice(-1);
  return { rank, suit };
}

export default function CardSelector({
  title,
  count,
  usedCards,
  allowUnknown = false,
  onConfirm,
  onClose,
}: CardSelectorProps) {
  const [selected, setSelected] = useState<Card[]>([]);

  const usedSet = new Set(usedCards);

  function toggle(card: Card) {
    setSelected((prev) => {
      if (prev.includes(card)) return prev.filter((c) => c !== card);
      if (prev.length >= count) return prev; // max reached
      return [...prev, card];
    });
  }

  function handleUnknown() {
    // Fill remaining slots with "?"
    const remaining = count - selected.length;
    const unknowns = Array(remaining).fill('?');
    onConfirm([...selected, ...unknowns]);
  }

  function handleConfirm() {
    if (selected.length !== count) return;
    onConfirm(selected);
  }

  const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
  const SUITS = ['s', 'h', 'd', 'c']; // picas, corazones, diamantes, tréboles

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <span className={styles.title}>{title}</span>
          {onClose && (
            <button className={styles.closeBtn} onClick={onClose}>✕</button>
          )}
        </div>

        <p className={styles.hint}>
          Seleccioná {count} carta{count !== 1 ? 's' : ''} ({selected.length}/{count})
        </p>

        <div className={styles.grid}>
          {SUITS.map((suit) =>
            RANKS.map((rank) => {
              const deckCard = `${rank}${suit}`;
              const isUsed = usedSet.has(deckCard);
              const isSelected = selected.includes(deckCard);
              const suitSymbol = SUIT_SYMBOLS[suit];
              const suitColor = SUIT_COLORS[suit];

              return (
                <button
                  key={deckCard}
                  className={`${styles.card} ${isSelected ? styles.selected : ''} ${isUsed ? styles.used : ''}`}
                  onClick={() => !isUsed && toggle(deckCard)}
                  disabled={isUsed}
                  style={{ color: suitColor }}
                >
                  <span className={styles.cardRank}>{rank}</span>
                  <span className={styles.cardSuit}>{suitSymbol}</span>
                </button>
              );
            })
          )}
        </div>

        <div className={styles.actions}>
          {allowUnknown && (
            <button
              className={styles.unknownBtn}
              onClick={handleUnknown}
            >
              ? ? Desconocidas
            </button>
          )}
          <button
            className={styles.confirmBtn}
            onClick={handleConfirm}
            disabled={selected.length !== count}
          >
            Confirmar
          </button>
        </div>

        {selected.length > 0 && (
          <div className={styles.preview}>
            {selected.map((c, i) => {
              if (c === '?') return <span key={i} className={styles.previewCard}>??</span>;
              const { rank, suit } = parseCard(c);
              return (
                <span
                  key={i}
                  className={styles.previewCard}
                  style={{ color: SUIT_COLORS[suit] }}
                >
                  {rank}{SUIT_SYMBOLS[suit]}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
