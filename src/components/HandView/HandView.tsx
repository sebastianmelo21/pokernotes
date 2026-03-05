'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useHandEngine } from '@/hooks/useHandEngine';
import { useHands } from '@/hooks/useHands';
import { Card } from '@/types';
import { POSITIONS } from '@/constants/hand';
import HandTable from '@/components/HandTable/HandTable';
import CardSelector from '@/components/CardSelector/CardSelector';
import BettingRound from '@/components/BettingRound/BettingRound';
import StackInput from '@/components/StackInput/StackInput';
import HandSummary from '@/components/HandSummary/HandSummary';
import styles from './HandView.module.scss';

interface HandViewProps {
  handId: string;
}

export default function HandView({ handId }: HandViewProps) {
  const router = useRouter();
  const { mounted } = useHands();
  const engine = useHandEngine(handId);
  const { hand } = engine;
  const summaryRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    if (!summaryRef.current) return;
    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(summaryRef.current, {
        backgroundColor: '#0d1117',
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `mano-${handId.slice(0, 8)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setDownloading(false);
    }
  }

  // Rivals selection
  const [selectedRivals, setSelectedRivals] = useState<number[]>([]);

  // Stack input flow
  const [heroStackPending, setHeroStackPending] = useState<number | null>(null);
  const [rivalStackQueue, setRivalStackQueue] = useState<number[]>([]);
  const [collectedStacks, setCollectedStacks] = useState<Record<number, number | null>>({});

  // Sync bettingRound when entering PREFLOP
  useEffect(() => {
    if (hand?.state === 'PREFLOP' && !engine.bettingRound) {
      engine.startPreflop();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hand?.state]);

  if (!mounted) return <div className={styles.loading}>Cargando...</div>;

  if (!hand) {
    return (
      <div className={styles.loading}>
        Mano no encontrada.{' '}
        <button onClick={() => router.push('/')} className={styles.backLink}>Volver</button>
      </div>
    );
  }

  function getUsedCards(): Card[] {
    if (!hand) return [];
    const used: Card[] = [];
    if (hand.heroCards) used.push(...hand.heroCards);
    Object.values(hand.players).forEach((p) => {
      if (p.cards) p.cards.forEach((c) => { if (c !== '?') used.push(c); });
    });
    if (hand.board.flop) used.push(...hand.board.flop);
    if (hand.board.turn) used.push(hand.board.turn);
    if (hand.board.river) used.push(hand.board.river);
    return used;
  }

  // ── Hero seat tap → ask for stack first ─────────────────────────────────
  function handleHeroTap(pos: number) {
    setHeroStackPending(pos);
  }

  function handleHeroStackDone(stack: number | null) {
    const pos = heroStackPending!;
    setHeroStackPending(null);
    engine.selectHeroPosition(pos, stack);
  }

  // ── Rivals: collect stacks before confirming ─────────────────────────────
  function handleToggleRival(pos: number) {
    setSelectedRivals((prev) =>
      prev.includes(pos) ? prev.filter((p) => p !== pos) : [...prev, pos]
    );
  }

  function handleConfirmRivalsBtn() {
    if (selectedRivals.length === 0) return;
    setRivalStackQueue([...selectedRivals]);
    setCollectedStacks({});
  }

  function handleRivalStackDone(stack: number | null) {
    const pos = rivalStackQueue[0];
    const newStacks = { ...collectedStacks, [pos]: stack };
    const remaining = rivalStackQueue.slice(1);

    if (remaining.length === 0) {
      // All stacks collected → confirm rivals
      engine.confirmRivals(selectedRivals, newStacks);
      setSelectedRivals([]);
      setRivalStackQueue([]);
      setCollectedStacks({});
    } else {
      setCollectedStacks(newStacks);
      setRivalStackQueue(remaining);
    }
  }

  const streetLabel: Record<string, string> = {
    PREFLOP: 'Preflop',
    FLOP: 'Flop',
    TURN: 'Turn',
    RIVER: 'River',
  };

  const showRivalStackInput = rivalStackQueue.length > 0;
  const currentRivalStackPos = rivalStackQueue[0];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.push('/')}>
          ‹ Volver
        </button>
        <span className={styles.stateLabel}>
          {streetLabel[hand.state] ?? hand.state.replace(/_/g, ' ')}
        </span>
      </header>

      <div className={styles.tableSection}>
        <HandTable
          hand={hand}
          onSelectHero={hand.state === 'SELECT_HERO' ? handleHeroTap : undefined}
          selectedRivals={selectedRivals}
          onToggleRival={hand.state === 'SELECT_RIVALS' ? handleToggleRival : undefined}
          currentTurnPosition={engine.currentTurnPosition}
        />
      </div>

      {/* ── SELECT_RIVALS: confirm button ── */}
      {hand.state === 'SELECT_RIVALS' && !showRivalStackInput && (
        <div className={styles.section}>
          <p className={styles.hint}>
            Seleccioná los rivales que participaron.
            {selectedRivals.length > 0 &&
              ` (${selectedRivals.length} seleccionado${selectedRivals.length > 1 ? 's' : ''})`}
          </p>
          <button
            className={styles.primaryBtn}
            onClick={handleConfirmRivalsBtn}
            disabled={selectedRivals.length === 0}
          >
            Confirmar rivales
          </button>
        </div>
      )}

      {/* ── PREFLOP: start button ── */}
      {hand.state === 'PREFLOP' && !engine.bettingRound && (
        <div className={styles.section}>
          <button className={styles.primaryBtn} onClick={engine.startPreflop}>
            Continuar a Preflop
          </button>
        </div>
      )}

      {/* ── Betting round panel ── */}
      {(hand.state === 'PREFLOP' || hand.state === 'FLOP' ||
        hand.state === 'TURN' || hand.state === 'RIVER') &&
        engine.bettingRound && (
          <div className={styles.section}>
            <BettingRound
              hand={hand}
              currentTurnPosition={engine.currentTurnPosition}
              currentBet={engine.bettingRound?.currentBet ?? 0}
              hasRaise={engine.bettingRound?.hasRaise ?? false}
              onAction={engine.registerAction}
            />
          </div>
        )}

      {/* ── Card selectors ── */}
      {hand.state === 'SELECT_FLOP' && (
        <CardSelector title="Seleccioná el flop" count={3} usedCards={getUsedCards()}
          onConfirm={(c) => engine.confirmFlop(c as [Card, Card, Card])} />
      )}
      {hand.state === 'SELECT_TURN' && (
        <CardSelector title="Seleccioná el turn" count={1} usedCards={getUsedCards()}
          onConfirm={(c) => engine.confirmTurn(c[0])} />
      )}
      {hand.state === 'SELECT_RIVER' && (
        <CardSelector title="Seleccioná el river" count={1} usedCards={getUsedCards()}
          onConfirm={(c) => engine.confirmRiver(c[0])} />
      )}
      {hand.state === 'SELECT_HERO_CARDS' && (
        <CardSelector title="Tus cartas (Hero)" count={2} usedCards={getUsedCards()}
          onConfirm={(c) => engine.confirmHeroCards(c as [Card, Card])} />
      )}
      {hand.state === 'SELECT_RIVAL_CARDS' && engine.currentRivalCardSelect != null && (
        <CardSelector
          title={`Cartas de ${POSITIONS[engine.currentRivalCardSelect]} (Pos ${engine.currentRivalCardSelect})`}
          count={2} usedCards={getUsedCards()} allowUnknown
          onConfirm={(c) => engine.confirmRivalCards(engine.currentRivalCardSelect!, c as [Card, Card])}
        />
      )}

      {/* ── Stack inputs (overlays) ── */}
      {heroStackPending != null && (
        <StackInput
          title={`Tu stack — ${POSITIONS[heroStackPending]}`}
          onConfirm={handleHeroStackDone}
        />
      )}
      {showRivalStackInput && (
        <StackInput
          title={`Stack de ${POSITIONS[currentRivalStackPos]} (Pos ${currentRivalStackPos})`}
          onConfirm={handleRivalStackDone}
        />
      )}

      {/* ── SHOWDOWN / FINISHED — resumen para screenshot ── */}
      {(hand.state === 'SHOWDOWN' || hand.state === 'FINISHED') && (
        <div className={styles.section}>
          <div ref={summaryRef}>
            <HandSummary hand={hand} />
          </div>
          <button
            className={styles.downloadBtn}
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? 'Generando...' : '↓ Descargar imagen'}
          </button>
          <button className={styles.primaryBtn} onClick={() => router.push('/')}>
            Volver al inicio
          </button>
        </div>
      )}

      {/* ── Players summary ── */}
      {hand.playersInHand.length > 0 &&
        !['SELECT_HERO','SELECT_RIVALS','SELECT_HERO_CARDS','SELECT_RIVAL_CARDS'].includes(hand.state) && (
          <div className={styles.playersSummary}>
            {hand.playersInHand.filter((pos) => hand.players[pos]).map((pos) => {
              const player = hand.players[pos];
              return (
                <div key={pos}
                  className={`${styles.playerChip} ${!player.active ? styles.foldedChip : ''}`}>
                  <span className={styles.chipPos}>{POSITIONS[pos]}</span>
                  {pos === hand.heroPosition && <span className={styles.chipHero}>YO</span>}
                  {player.stack != null && (
                    <span className={styles.chipStack}>
                      {player.stack >= 1000
                        ? `${(player.stack / 1000).toFixed(0)}k`
                        : player.stack}
                    </span>
                  )}
                  {!player.active && <span className={styles.chipFolded}>FOLD</span>}
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
}
