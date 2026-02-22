'use client';

import { SeatData } from '@/types';
import styles from './Seat.module.scss';

interface Props {
  seat: SeatData;
  isMySeat: boolean;
  isSelecting: boolean;
  onTap: () => void;
}

function formatStack(stack: number | null | undefined): string | null {
  if (stack == null) return null; // cubre null y undefined (datos viejos de localStorage)
  if (stack >= 1_000_000) return `${(stack / 1_000_000).toFixed(1).replace('.0', '')}M`;
  if (stack >= 1_000) return `${(stack / 1_000).toFixed(1).replace('.0', '')}k`;
  return stack.toString();
}

export default function Seat({ seat, isMySeat, isSelecting, onTap }: Props) {
  const hasNotes = seat.notes.trim().length > 0;
  const stackLabel = formatStack(seat.stack);

  return (
    <button
      className={styles.wrapper}
      onClick={onTap}
      aria-label={isMySeat ? `Asiento ${seat.id} — tu asiento` : `Asiento ${seat.id}`}
    >
      {/* Avatar circle */}
      <div
        className={[
          styles.avatar,
          isMySeat
            ? styles.avatarMine
            : seat.color
            ? styles.avatarColored
            : isSelecting
            ? styles.avatarSelectable
            : styles.avatarEmpty,
        ].join(' ')}
        style={seat.color && !isMySeat ? { background: seat.color, borderColor: seat.color } : {}}
      >
        {isMySeat ? (
          <span className={styles.star}>★</span>
        ) : (
          <span className={styles.num}>{seat.id}</span>
        )}
        {hasNotes && !isMySeat && <span className={styles.notesDot} />}
      </div>

      {/* Label */}
      <span
        className={[
          styles.label,
          isMySeat ? styles.labelMine : seat.color ? styles.labelColored : styles.labelEmpty,
        ].join(' ')}
        style={seat.color && !isMySeat ? { color: seat.color } : {}}
      >
        {isMySeat ? 'Vos' : `#${seat.id}`}
      </span>

      {/* Stack (only when set) */}
      {stackLabel && (
        <span className={styles.stack}>{stackLabel}</span>
      )}
    </button>
  );
}
