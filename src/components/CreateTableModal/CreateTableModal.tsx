'use client';

import { PlayerCount } from '@/types';
import styles from './CreateTableModal.module.scss';

const SIZES: PlayerCount[] = [6, 8, 9, 10];

interface Props {
  onConfirm: (playerCount: PlayerCount) => void;
  onClose: () => void;
}

export default function CreateTableModal({ onConfirm, onClose }: Props) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.handle} />
        <h2 className={styles.title}>Nueva Mesa</h2>
        <p className={styles.subtitle}>¿Cuántos jugadores?</p>

        <div className={styles.options}>
          {SIZES.map((size) => (
            <button
              key={size}
              className={styles.option}
              onClick={() => onConfirm(size)}
            >
              <span className={styles.optionNumber}>{size}</span>
              <span className={styles.optionLabel}>jugadores</span>
            </button>
          ))}
        </div>

        <button className={styles.cancelBtn} onClick={onClose}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
