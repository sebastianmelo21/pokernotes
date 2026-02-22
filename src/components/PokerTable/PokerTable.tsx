'use client';

import { useMemo } from 'react';
import { TableData } from '@/types';
import {
  getSeatPosition,
  getDealerPosition,
  getRotationOffset,
} from '@/utils/tableLayout';
import Seat from '@/components/Seat/Seat';
import styles from './PokerTable.module.scss';

interface Props {
  table: TableData;
  onSeatTap: (seatId: number) => void;
}

export default function PokerTable({ table, onSeatTap }: Props) {
  const isSelectingMySeat = table.mySeatId === null;

  const rotationOffset = useMemo(() => {
    if (table.mySeatId === null) return 0;
    return getRotationOffset(table.mySeatId - 1, table.playerCount);
  }, [table.mySeatId, table.playerCount]);

  const dealerPos = getDealerPosition(table.playerCount, rotationOffset);

  return (
    <div className={styles.tableContainer}>
      {/* Outer dark rail */}
      <div className={styles.rail}>
        {/* Inner green felt */}
        <div className={styles.felt}>
          {isSelectingMySeat ? (
            <p className={styles.hint}>Toca tu asiento</p>
          ) : (
            <span className={styles.logo}>♠</span>
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
      {table.seats.map((seat, index) => {
        const pos = getSeatPosition(index, table.playerCount, rotationOffset);
        return (
          <div
            key={seat.id}
            className={styles.seatWrapper}
            style={{ left: pos.left, top: pos.top }}
          >
            <Seat
              seat={seat}
              isMySeat={seat.id === table.mySeatId}
              isSelecting={isSelectingMySeat}
              onTap={() => onSeatTap(seat.id)}
            />
          </div>
        );
      })}
    </div>
  );
}
