'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTables } from '@/hooks/useTables';
import { formatRelativeDate } from '@/utils/tableLayout';
import { PlayerCount } from '@/types';
import CreateTableModal from '@/components/CreateTableModal/CreateTableModal';
import styles from './HomeView.module.scss';

export default function HomeView() {
  const router = useRouter();
  const { tables, mounted, createTable, deleteTable } = useTables();
  const [showCreate, setShowCreate] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function handleCreate(playerCount: PlayerCount) {
    const newTable = createTable(playerCount);
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
        <button
          className={styles.createBtn}
          onClick={() => setShowCreate(true)}
        >
          + Nueva Mesa
        </button>

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
                  <div className={styles.cardIcon}>
                    <TableIcon seats={table.playerCount} />
                  </div>
                  <div className={styles.cardInfo}>
                    <span className={styles.cardTitle}>
                      Mesa de {table.playerCount} jugadores
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

function TableIcon({ seats }: { seats: number }) {
  return (
    <svg viewBox="0 0 40 28" width="40" height="28" aria-hidden="true">
      <ellipse
        cx="20"
        cy="14"
        rx="18"
        ry="11"
        fill="#1a4f2e"
        stroke="#b8962e"
        strokeWidth="1.5"
      />
      <text x="20" y="18" textAnchor="middle" fill="#c9a84c" fontSize="9" fontWeight="bold">
        {seats}p
      </text>
    </svg>
  );
}
