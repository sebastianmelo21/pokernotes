'use client';

import { useRef, useState } from 'react';
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
  const [baseValue, setBaseValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const parsed = parseInt(value, 10);
  const isValid = !isNaN(parsed) && parsed > 0;

  function handleChange(raw: string) {
    setValue(raw);
    setBaseValue(raw); // reset base whenever user types
  }

  function applyMultiplier(mult: number) {
    const n = parseInt(baseValue, 10);
    if (isNaN(n) || n <= 0) return;
    setValue((n * mult).toString());
    inputRef.current?.focus();
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <p className={styles.title}>{title}</p>
        <p className={styles.subtitle}>Ingresá el stack (opcional)</p>

        <div className={styles.inputRow}>
          <input
            ref={inputRef}
            className={styles.input}
            type="number"
            inputMode="numeric"
            placeholder="ej: 80"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            autoFocus
          />
          <button
            className={styles.multBtn}
            onClick={() => applyMultiplier(1_000)}
            disabled={!isValid}
          >
            ×k
          </button>
          <button
            className={styles.multBtn}
            onClick={() => applyMultiplier(1_000_000)}
            disabled={!isValid}
          >
            ×M
          </button>
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
