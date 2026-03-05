'use client';

import { HandData, HandAction, Card } from '@/types';
import { POSITIONS, SUIT_SYMBOLS, SUIT_COLORS } from '@/constants/hand';
import styles from './HandSummary.module.scss';

interface HandSummaryProps {
  hand: HandData;
}

// ── Card rendering ───────────────────────────────────────────────────────────

function CardChip({ card, highlighted = false }: { card: Card; highlighted?: boolean }) {
  if (card === '?') {
    return <span className={`${styles.card} ${styles.cardUnknown}`}>??</span>;
  }
  const rank = card.slice(0, -1);
  const suit = card.slice(-1);
  return (
    <span
      className={`${styles.card} ${highlighted ? styles.cardHighlighted : ''}`}
      style={{ color: SUIT_COLORS[suit] }}
    >
      {rank}{SUIT_SYMBOLS[suit]}
    </span>
  );
}

function Cards({ cards }: { cards: [Card, Card] | null }) {
  if (!cards) return <span className={styles.noCards}>— —</span>;
  return (
    <span className={styles.cardGroup}>
      <CardChip card={cards[0]} />
      <CardChip card={cards[1]} />
    </span>
  );
}

// ── Action label (with bet level) ────────────────────────────────────────────

function getActionLabel(actions: HandAction[], index: number, isPreflop: boolean): string {
  const a = actions[index];
  if (a.action === 'fold') return 'Fold';
  if (a.action === 'check') return 'Check';
  if (a.action === 'call') return 'Call';
  if (a.action === 'limp') return 'Limp';
  if (a.action === 'bet') return 'Bet';
  // raise
  const aggressiveBefore = actions
    .slice(0, index)
    .filter((x) => x.action === 'bet' || x.action === 'raise').length;
  if (isPreflop) {
    return aggressiveBefore === 0 ? 'Raise' : `${aggressiveBefore + 2}-Bet`;
  }
  return aggressiveBefore <= 1 ? 'Raise' : `${aggressiveBefore + 1}-Bet`;
}

function formatAmount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace('.0', '')}k`;
  return n.toString();
}

// ── Street block ─────────────────────────────────────────────────────────────

interface StreetBlockProps {
  label: string;
  isPreflop?: boolean;
  boardCards?: Card[];
  newCardCount?: number;
  actions: HandAction[];
  heroPosition: number | null;
  heroCards: [Card, Card] | null;
  players: HandData['players'];
  streetPot: number; // pot accumulated at end of this street
}

function StreetBlock({ label, isPreflop = false, boardCards, newCardCount = 0, actions, heroPosition, heroCards, players, streetPot }: StreetBlockProps) {
  if (actions.length === 0 && !boardCards?.length) return null;

  function getCards(pos: number): [Card, Card] | null {
    if (pos === heroPosition) return heroCards;
    return players[pos]?.cards ?? null;
  }

  return (
    <div className={styles.street}>
      <div className={styles.streetHeader}>
        <span className={styles.streetLabel}>{label}</span>
        {boardCards && boardCards.length > 0 && (
          <span className={styles.boardCards}>
            {boardCards.map((c, i) => {
              const isNew = newCardCount > 0 && i >= boardCards.length - newCardCount;
              return <CardChip key={i} card={c} highlighted={isNew} />;
            })}
          </span>
        )}
        {streetPot > 0 && (
          <span className={styles.streetPot}>Pot {formatAmount(streetPot)}</span>
        )}
      </div>

      {actions.length > 0 && (
        <div className={styles.actionList}>
          {actions.map((a, i) => {
            const isHero = a.position === heroPosition;
            const actionLabel = getActionLabel(actions, i, isPreflop);
            const cards = getCards(a.position);
            return (
              <div key={i} className={`${styles.actionRow} ${isHero ? styles.heroAction : ''}`}>
                <span className={styles.actionPos}>
                  {POSITIONS[a.position]}
                  {isHero && <span className={styles.heroTag}>YO</span>}
                </span>
                <span className={`${styles.actionVerb} ${styles[`verb_${a.action}`]}`}>
                  {actionLabel}
                </span>
                {a.amount != null && (
                  <span className={styles.actionAmount}>{formatAmount(a.amount)}</span>
                )}
                <span className={styles.actionCards}>
                  {cards
                    ? <><CardChip card={cards[0]} /><CardChip card={cards[1]} /></>
                    : <span className={styles.unknownCards}>??</span>
                  }
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

function streetPotTotal(streetActions: HandAction[]): number {
  return streetActions.reduce((sum, a) => {
    if (a.amount != null && (a.action === 'bet' || a.action === 'raise' || a.action === 'call' || a.action === 'limp')) {
      return sum + a.amount;
    }
    return sum;
  }, 0);
}

export default function HandSummary({ hand }: HandSummaryProps) {
  const { board, actions, players, heroPosition, heroCards, pot } = hand;

  const activePlayers = Object.values(players).filter((p) => p.active);
  const isShowdown = activePlayers.length > 1;

  // Pot entering each street (what was accumulated in all previous streets)
  const potPreflop = 0;
  const potFlop = streetPotTotal(actions.preflop);
  const potTurn = potFlop + streetPotTotal(actions.flop);
  const potRiver = potTurn + streetPotTotal(actions.turn);

  return (
    <div className={styles.wrapper}>
      {/* Header */}
      <div className={styles.header}>
        <span className={styles.logo}>♠ PokerNotes</span>
        {pot > 0 && (
          <span className={styles.potBadge}>Pot {formatAmount(pot)}</span>
        )}
      </div>

      {/* Players row */}
      <div className={styles.players}>
        {Object.values(players).map((p) => (
          <div key={p.position} className={`${styles.playerCard} ${!p.active ? styles.folded : ''} ${p.position === heroPosition ? styles.heroCard : ''}`}>
            <div className={styles.playerTop}>
              <span className={styles.playerPos}>{POSITIONS[p.position]}</span>
              {p.position === heroPosition && <span className={styles.heroMark}>HERO</span>}
              {p.stack != null && (
                <span className={styles.playerStack}>{formatAmount(p.stack)}</span>
              )}
            </div>
            <div className={styles.playerCards}>
              <Cards cards={p.position === heroPosition ? heroCards : p.cards} />
            </div>
            {!p.active && <span className={styles.foldedBadge}>FOLD</span>}
          </div>
        ))}
      </div>

      {/* Streets */}
      <div className={styles.streets}>
        <StreetBlock
          label="Preflop" isPreflop streetPot={potPreflop}
          actions={actions.preflop}
          heroPosition={heroPosition} heroCards={heroCards} players={players}
        />
        {board.flop && (
          <StreetBlock
            label="Flop" boardCards={board.flop} streetPot={potFlop}
            actions={actions.flop}
            heroPosition={heroPosition} heroCards={heroCards} players={players}
          />
        )}
        {board.turn && board.flop && (
          <StreetBlock
            label="Turn" boardCards={[...board.flop, board.turn]} newCardCount={1} streetPot={potTurn}
            actions={actions.turn}
            heroPosition={heroPosition} heroCards={heroCards} players={players}
          />
        )}
        {board.river && board.flop && board.turn && (
          <StreetBlock
            label="River" boardCards={[...board.flop, board.turn, board.river]} newCardCount={1} streetPot={potRiver}
            actions={actions.river}
            heroPosition={heroPosition} heroCards={heroCards} players={players}
          />
        )}
      </div>

      {/* Showdown */}
      {isShowdown && (
        <div className={styles.showdown}>
          <span className={styles.showdownLabel}>Showdown</span>
          <div className={styles.showdownPlayers}>
            {activePlayers.map((p) => (
              <div key={p.position} className={styles.showdownRow}>
                <span className={styles.showdownPos}>
                  {POSITIONS[p.position]}
                  {p.position === heroPosition && <span className={styles.heroTag}>YO</span>}
                </span>
                <Cards cards={p.position === heroPosition ? heroCards : p.cards} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className={styles.footer}>
        <span>pokernotes.app</span>
      </div>
    </div>
  );
}
