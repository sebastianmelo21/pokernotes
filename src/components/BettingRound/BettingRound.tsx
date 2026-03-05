'use client';

import { useState } from 'react';
import { ActionType, HandData } from '@/types';
import { POSITIONS } from '@/constants/hand';
import styles from './BettingRound.module.scss';

interface BettingRoundProps {
  hand: HandData;
  currentTurnPosition: number | null;
  currentBet: number;
  hasRaise: boolean;
  onAction: (action: ActionType, amount?: number) => void;
}

function formatAmount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace('.0', '')}k`;
  return n.toString();
}

export default function BettingRound({
  hand,
  currentTurnPosition,
  currentBet,
  hasRaise,
  onAction,
}: BettingRoundProps) {
  const [pendingAction, setPendingAction] = useState<'bet' | 'raise' | null>(null);
  const [amountInput, setAmountInput] = useState('');

  const street = hand.state.toLowerCase() as 'preflop' | 'flop' | 'turn' | 'river';

  if (currentTurnPosition == null) return null;

  const posName = POSITIONS[currentTurnPosition] ?? `Pos ${currentTurnPosition}`;
  const isHero = currentTurnPosition === hand.heroPosition;
  const isPreflop = hand.state === 'PREFLOP';

  const actions: ActionType[] = !isPreflop
    ? currentBet === 0 ? ['check', 'bet'] : ['fold', 'call', 'raise']
    : currentBet === 0
    ? ['limp', 'bet']           // nadie actuó: limp u open
    : !hasRaise
    ? ['limp', 'raise']         // solo hay limps: limp o raise
    : ['fold', 'call', 'raise']; // hay raise: fold/call/raise

  // Count aggressive actions for raise label
  const aggressiveCount = hand.actions[street].filter(
    (a) => a.action === 'bet' || a.action === 'raise'
  ).length;
  // Preflop: BB = 1-bet implícito → raise = 2-bet = "Raise", siguiente = 3-Bet, etc.
  // Postflop: bet = 1-bet, raise = 2-bet = "Raise", siguiente = 3-Bet, etc.
  const raiseLabel = isPreflop
    ? aggressiveCount === 0 ? 'Raise' : `${aggressiveCount + 2}-Bet`
    : aggressiveCount <= 1 ? 'Raise' : `${aggressiveCount + 1}-Bet`;

  const actionLabels: Record<ActionType, string> = {
    fold: 'Fold',
    call: 'Call',
    raise: raiseLabel,
    check: 'Check',
    bet: 'Bet',
    limp: 'Limp',
  };

  function handleTap(action: ActionType) {
    if (action === 'bet' || action === 'raise') {
      setPendingAction(action);
      setAmountInput('');
    } else {
      onAction(action);
    }
  }

  function handleAmountConfirm() {
    if (!pendingAction) return;
    const parsed = parseInt(amountInput, 10);
    onAction(pendingAction, isNaN(parsed) ? undefined : parsed);
    setPendingAction(null);
    setAmountInput('');
  }

  function handleAmountSkip() {
    if (!pendingAction) return;
    onAction(pendingAction);
    setPendingAction(null);
    setAmountInput('');
  }

  const parsedAmount = parseInt(amountInput, 10);
  const amountValid = !isNaN(parsedAmount) && parsedAmount > 0;

  return (
    <div className={styles.container}>
      <div className={styles.topRow}>
        <div className={styles.turnLabel}>
          Turno:{' '}
          <span className={isHero ? styles.heroName : styles.rivalName}>
            {posName} {isHero ? '(Vos)' : ''}
          </span>
        </div>
        {hand.pot > 0 && (
          <div className={styles.pot}>
            Pot: <strong>{formatAmount(hand.pot)}</strong>
          </div>
        )}
      </div>

      {hand.actions[street].length > 0 && (
        <div className={styles.log}>
          {[...hand.actions[street]].slice(-5).map((a, i) => (
            <span key={i} className={styles.logEntry}>
              {POSITIONS[a.position]}: <strong>{a.action}</strong>
              {a.amount != null ? ` ${formatAmount(a.amount)}` : ''}
            </span>
          ))}
        </div>
      )}

      {pendingAction ? (
        <div className={styles.amountSection}>
          <p className={styles.amountLabel}>
            {actionLabels[pendingAction]} — ingresá el monto
          </p>
          <div className={styles.amountRow}>
            <input
              className={styles.amountInput}
              type="number"
              inputMode="numeric"
              placeholder="ej: 5000"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              autoFocus
            />
            {amountValid && (
              <span className={styles.amountFormatted}>{formatAmount(parsedAmount)}</span>
            )}
          </div>
          <div className={styles.amountActions}>
            <button className={styles.skipAmountBtn} onClick={handleAmountSkip}>
              Sin monto
            </button>
            <button
              className={styles.confirmAmountBtn}
              onClick={handleAmountConfirm}
              disabled={!amountValid}
            >
              Confirmar
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.buttons}>
          {actions.map((action) => (
            <button
              key={action}
              className={`${styles.actionBtn} ${styles[action]}`}
              onClick={() => handleTap(action)}
            >
              {actionLabels[action]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
