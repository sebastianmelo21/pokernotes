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
  const [amountBase, setAmountBase] = useState('');

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

  function handleAmountChange(raw: string) {
    setAmountInput(raw);
    setAmountBase(raw);
  }

  function handleKilo() {
    const n = parseInt(amountBase, 10);
    if (isNaN(n) || n <= 0) return;
    setAmountInput((n * 1_000).toString());
  }

  function handleMillion() {
    const n = parseInt(amountBase, 10);
    if (isNaN(n) || n <= 0) return;
    setAmountInput((n * 1_000_000).toString());
  }

  function handleTap(action: ActionType) {
    if (action === 'bet' || action === 'raise') {
      setPendingAction(action);
      setAmountInput('');
      setAmountBase('');
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
    setAmountBase('');
  }

  function handleAmountSkip() {
    if (!pendingAction) return;
    onAction(pendingAction);
    setPendingAction(null);
    setAmountInput('');
    setAmountBase('');
  }

  const parsedAmount = parseInt(amountInput, 10);
  const amountValid = !isNaN(parsedAmount) && parsedAmount > 0;

  const POT_PCTS = [25, 33, 50, 75, 100, 125];
  const RAISE_MULTIPLIERS = [2, 2.2, 2.5, 3, 4, 5];

  function handlePctBtn(pct: number) {
    if (!hand.pot) return;
    const val = Math.round((hand.pot * pct) / 100);
    setAmountInput(val.toString());
  }

  function handleMultiplierBtn(mult: number) {
    if (!currentBet) return;
    const val = Math.round(currentBet * mult);
    setAmountInput(val.toString());
  }

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
          {pendingAction === 'bet' && hand.pot > 0 && (
            <div className={styles.pctBtns}>
              {POT_PCTS.map((pct) => (
                <button key={pct} className={styles.pctBtn} onClick={() => handlePctBtn(pct)}>
                  {pct}%
                </button>
              ))}
            </div>
          )}
          {pendingAction === 'raise' && currentBet > 0 && (
            <div className={styles.pctBtns}>
              {RAISE_MULTIPLIERS.map((mult) => (
                <button key={mult} className={styles.pctBtn} onClick={() => handleMultiplierBtn(mult)}>
                  x{mult}
                </button>
              ))}
            </div>
          )}
          <div className={styles.amountRow}>
            <input
              className={styles.amountInput}
              type="number"
              inputMode="numeric"
              placeholder="ej: 80"
              value={amountInput}
              onChange={(e) => handleAmountChange(e.target.value)}
              autoFocus
            />
            <button
              className={styles.multBtn}
              onClick={handleKilo}
              disabled={!amountBase || parseInt(amountBase, 10) <= 0}
            >
              ×k
            </button>
            <button
              className={styles.multBtn}
              onClick={handleMillion}
              disabled={!amountBase || parseInt(amountBase, 10) <= 0}
            >
              ×M
            </button>
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
