'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTables } from '@/hooks/useTables';
import { useHands } from '@/hooks/useHands';
import { formatRelativeDate } from '@/utils/tableLayout';
import { PlayerCount, HandData } from '@/types';
import { POSITIONS } from '@/constants/hand';
import CreateTableModal from '@/components/CreateTableModal/CreateTableModal';
import styles from './HomeView.module.scss';

function handStatusLabel(hand: HandData): string {
  const s = hand.state;
  if (s === 'SHOWDOWN' || s === 'FINISHED') return 'Finalizada';
  if (s === 'PREFLOP' || s === 'FLOP' || s === 'TURN' || s === 'RIVER') return s.charAt(0) + s.slice(1).toLowerCase();
  return 'En configuración';
}

function handStatusClass(hand: HandData): string {
  const s = hand.state;
  if (s === 'SHOWDOWN' || s === 'FINISHED') return styles.statusDone;
  if (s === 'PREFLOP' || s === 'FLOP' || s === 'TURN' || s === 'RIVER') return styles.statusInProgress;
  return styles.statusSetup;
}

export default function HomeView() {
  const router = useRouter();
  const { tables, mounted, createTable, deleteTable } = useTables();
  const { hands, createHand, deleteHand } = useHands();
  const [deletingHandId, setDeletingHandId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function handleCreateHand() {
    const newHand = createHand();
    router.push(`/hand/${newHand.id}`);
  }

  function handleCreate(playerCount: PlayerCount, name: string) {
    const newTable = createTable(playerCount, name);
    setShowCreate(false);
    router.push(`/table/${newTable.id}`);
  }

  function handleDelete(id: string) {
    setDeletingId(id);
    setTimeout(() => {
      deleteTable(id);
      setDeletingId(null);
    }, 300);
  }

  function handleDeleteHand(id: string) {
    setDeletingHandId(id);
    setTimeout(() => {
      deleteHand(id);
      setDeletingHandId(null);
    }, 300);
  }

  if (!mounted) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.logo}>PokerNotes</h1>
        </header>
        <div className={styles.loading}>Cargando...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.logo}>
          <span className={styles.logoIcon}>♠</span>
          PokerNotes
        </h1>
        <p className={styles.subtitle}>Anotador de mesas en vivo</p>
      </header>

      <main className={styles.main}>
        <div className={styles.btnRow}>
          <button
            className={styles.createBtn}
            onClick={() => setShowCreate(true)}
          >
            + Nueva Mesa
          </button>
          <button
            className={styles.handBtn}
            onClick={handleCreateHand}
          >
            ✎ Crear Mano
          </button>
        </div>

        {tables.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>♣</span>
            <p>No hay mesas guardadas.</p>
            <p>Crea una para empezar.</p>
          </div>
        ) : (
          <ul className={styles.tableList}>
            {[...tables].reverse().map((table) => (
              <li
                key={table.id}
                className={`${styles.tableCard} ${deletingId === table.id ? styles.deleting : ''}`}
              >
                <button
                  className={styles.cardBody}
                  onClick={() => router.push(`/table/${table.id}`)}
                >
                  <div className={styles.cardInfo}>
                    <span className={styles.cardTitle}>
                      {table.name || 'Mesa sin nombre'}
                    </span>
                    <span className={styles.cardPlayers}>
                      {table.playerCount} jugadores
                    </span>
                    <span className={styles.cardDate}>
                      {formatRelativeDate(table.createdAt)}
                    </span>
                  </div>
                  <span className={styles.cardArrow}>›</span>
                </button>
                <button
                  className={styles.deleteBtn}
                  onClick={() => handleDelete(table.id)}
                  aria-label="Eliminar mesa"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* ── Manos guardadas ── */}
        {hands.length > 0 && (
          <div className={styles.handsSection}>
            <h2 className={styles.sectionTitle}>Manos guardadas</h2>
            <ul className={styles.tableList}>
              {[...hands].reverse().map((hand) => {
                const heroPos = hand.heroPosition != null ? POSITIONS[hand.heroPosition] : null;
                const playerCount = hand.playersInHand.length;
                return (
                  <li
                    key={hand.id}
                    className={`${styles.tableCard} ${deletingHandId === hand.id ? styles.deleting : ''}`}
                  >
                    <button
                      className={styles.cardBody}
                      onClick={() => router.push(`/hand/${hand.id}`)}
                    >
                      <div className={styles.cardInfo}>
                        <span className={styles.cardTitle}>
                          {heroPos ? `Hero: ${heroPos}` : 'Mano sin hero'}
                          {playerCount > 0 && ` · ${playerCount}p`}
                          {hand.pot > 0 && <span className={styles.handPot}> · Pot {hand.pot >= 1_000_000 ? `${(hand.pot / 1_000_000).toFixed(1).replace('.0', '')}M` : hand.pot >= 1_000 ? `${(hand.pot / 1_000).toFixed(1).replace('.0', '')}k` : hand.pot}</span>}
                        </span>
                        <span className={`${styles.handStatus} ${handStatusClass(hand)}`}>
                          {handStatusLabel(hand)}
                        </span>
                        <span className={styles.cardDate}>
                          {formatRelativeDate(hand.createdAt)}
                        </span>
                      </div>
                      <span className={styles.cardArrow}>›</span>
                    </button>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleDeleteHand(hand.id)}
                      aria-label="Eliminar mano"
                    >
                      ✕
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </main>

      {showCreate && (
        <CreateTableModal
          onConfirm={handleCreate}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}

