'use client';

import { useState } from 'react';
import styles from './StackInput.module.scss';

interface StackInputProps {
  title: string;
  onConfirm: (stack: number | null) => void; // null = skip
}

function formatDisplay(val: string): string {
  const n = parseInt(val, 10);
  if (isNaN(n)) return val;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace('.0', '')}k`;
  return n.toString();
}

export default function StackInput({ title, onConfirm }: StackInputProps) {
  const [value, setValue] = useState('');

  const parsed = parseInt(value, 10);
  const isValid = !isNaN(parsed) && parsed > 0;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <p className={styles.title}>{title}</p>
        <p className={styles.subtitle}>Ingresá el stack (opcional)</p>

        <div className={styles.inputRow}>
          <input
            className={styles.input}
            type="number"
            inputMode="numeric"
            placeholder="ej: 80000"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
          />
          {isValid && (
            <span className={styles.formatted}>{formatDisplay(value)}</span>
          )}
        </div>

        <div className={styles.actions}>
          <button
            className={styles.skipBtn}
            onClick={() => onConfirm(null)}
          >
            Saltar
          </button>
          <button
            className={styles.confirmBtn}
            onClick={() => onConfirm(isValid ? parsed : null)}
            disabled={!isValid}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
