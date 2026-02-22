'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTables } from '@/hooks/useTables';
import { SeatData } from '@/types';
import PokerTable from '@/components/PokerTable/PokerTable';
import SeatModal from '@/components/SeatModal/SeatModal';
import styles from './TableView.module.scss';

interface Props {
  tableId: string;
}

export default function TableView({ tableId }: Props) {
  const router = useRouter();
  const { getTable, updateSeat, setMySeat, mounted } = useTables();
  const [openSeatId, setOpenSeatId] = useState<number | null>(null);

  if (!mounted) {
    return <div className={styles.loadingScreen}><p>Cargando...</p></div>;
  }

  const table = getTable(tableId);

  if (!table) {
    return (
      <div className={styles.loadingScreen}>
        <p>Mesa no encontrada.</p>
        <button onClick={() => router.push('/')}>Volver al inicio</button>
      </div>
    );
  }

  const openSeat = openSeatId !== null
    ? table.seats.find((s) => s.id === openSeatId) ?? null
    : null;

  function handleSeatTap(seatId: number) {
    if (table!.mySeatId === null) {
      setMySeat(tableId, seatId);
    } else {
      setOpenSeatId(seatId);
    }
  }

  function handleSave(updates: Partial<SeatData>) {
    if (openSeatId !== null) {
      updateSeat(tableId, openSeatId, updates);
    }
  }

  function handleSetMySeat() {
    if (openSeatId !== null) {
      setMySeat(tableId, openSeatId);
      setOpenSeatId(null);
    }
  }

  function handleChangeMySeat() {
    setMySeat(tableId, null);
    setOpenSeatId(null);
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button
          className={styles.backBtn}
          onClick={() => router.push('/')}
          aria-label="Volver"
        >
          ‹ Inicio
        </button>
        <div className={styles.headerTitle}>
          <span className={styles.tableLabel}>Mesa</span>
          <span className={styles.playerCount}>{table.playerCount} jugadores</span>
        </div>
        <div className={styles.headerRight} />
      </header>

      <main className={styles.main}>
        <PokerTable table={table} onSeatTap={handleSeatTap} />
      </main>

      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={styles.legendMySeat}>★</span>
          <span>Tu asiento</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} />
          <span>Con notas</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendD}>D</span>
          <span>Crupier</span>
        </div>
      </div>

      {openSeat && (
        <SeatModal
          seat={openSeat}
          isMySeat={openSeat.id === table.mySeatId}
          onSave={handleSave}
          onSetMySeat={handleSetMySeat}
          onChangeMySeat={handleChangeMySeat}
          onClose={() => setOpenSeatId(null)}
        />
      )}
    </div>
  );
}
