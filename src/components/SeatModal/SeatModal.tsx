'use client';

import { useState, useEffect } from 'react';
import { SeatData } from '@/types';
import { PLAYER_COLORS } from '@/constants/colors';
import styles from './SeatModal.module.scss';

interface Props {
  seat: SeatData;
  isMySeat: boolean;
  onSave: (updates: Partial<SeatData>) => void;
  onSetMySeat: () => void;
  onChangeMySeat: () => void;
  onClose: () => void;
}

export default function SeatModal({
  seat,
  isMySeat,
  onSave,
  onSetMySeat,
  onChangeMySeat,
  onClose,
}: Props) {
  const [selectedColor, setSelectedColor] = useState<string | null>(seat.color);
  const [notes, setNotes] = useState(seat.notes);
  const [stackInput, setStackInput] = useState(
    seat.stack != null ? String(seat.stack) : ''
  );

  useEffect(() => {
    setSelectedColor(seat.color);
    setNotes(seat.notes);
    setStackInput(seat.stack != null ? String(seat.stack) : '');
  }, [seat.id, seat.color, seat.notes, seat.stack]);

  function handleAddThreeZeros() {
    if (stackInput.trim() === '') return;
    const val = Number(stackInput);
    if (!isNaN(val)) setStackInput(String(val * 1000));
  }

  function handleSave() {
    const parsed = stackInput.trim() === '' ? null : Number(stackInput);
    const stack = parsed !== null && !isNaN(parsed) && parsed >= 0 ? parsed : null;
    onSave({ color: selectedColor, notes, stack });
    onClose();
  }

  if (isMySeat) {
    function handleSaveMySeat() {
      const parsed = stackInput.trim() === '' ? null : Number(stackInput);
      const stack = parsed !== null && !isNaN(parsed) && parsed >= 0 ? parsed : null;
      onSave({ stack });
      onClose();
    }

    return (
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.handle} />
          <div className={styles.mySeatHeader}>
            <span className={styles.mySeatIcon}>★</span>
            <div>
              <h2 className={styles.title}>Asiento {seat.id}</h2>
              <p className={styles.mySeatLabel}>Tu asiento</p>
            </div>
          </div>

          <section className={styles.section}>
            <label className={styles.sectionLabel} htmlFor={`stack-my`}>
              Mi stack
            </label>
            <div className={styles.stackInputWrapper}>
              <input
                id="stack-my"
                className={styles.stackInput}
                type="number"
                inputMode="numeric"
                min="0"
                placeholder="Cantidad de fichas"
                value={stackInput}
                onChange={(e) => setStackInput(e.target.value)}
              />
              <button
                type="button"
                className={styles.thousandBtn}
                onClick={handleAddThreeZeros}
              >
                +000
              </button>
            </div>
          </section>

          <div className={styles.actions}>
            <button className={styles.saveBtn} onClick={handleSaveMySeat}>
              Guardar
            </button>
            <button className={styles.changeSeatBtn} onClick={onChangeMySeat}>
              Cambiar mi posición
            </button>
            <button className={styles.cancelBtn} onClick={onClose}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.handle} />

        <div className={styles.header}>
          <h2 className={styles.title}>Asiento {seat.id}</h2>
          <button className={styles.setMySeatBtn} onClick={onSetMySeat}>
            Marcar como mi asiento
          </button>
        </div>

        {/* Color palette */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>Color del jugador</span>
            {selectedColor && (
              <button className={styles.clearColor} onClick={() => setSelectedColor(null)}>
                Quitar color
              </button>
            )}
          </div>
          <div className={styles.palette}>
            {PLAYER_COLORS.map((c) => (
              <button
                key={c.id}
                className={`${styles.colorBtn} ${selectedColor === c.value ? styles.colorActive : ''}`}
                style={{ backgroundColor: c.value }}
                onClick={() => setSelectedColor(c.value)}
                aria-label={c.label}
                title={c.label}
              >
                {selectedColor === c.value && (
                  <span className={styles.checkmark}>✓</span>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Stack */}
        <section className={styles.section}>
          <label className={styles.sectionLabel} htmlFor={`stack-${seat.id}`}>
            Stack
          </label>
          <div className={styles.stackInputWrapper}>
            <input
              id={`stack-${seat.id}`}
              className={styles.stackInput}
              type="number"
              inputMode="numeric"
              min="0"
              placeholder="Cantidad de fichas"
              value={stackInput}
              onChange={(e) => setStackInput(e.target.value)}
            />
            <button
              type="button"
              className={styles.thousandBtn}
              onClick={handleAddThreeZeros}
            >
              +000
            </button>
          </div>
        </section>

        {/* Notes */}
        <section className={styles.section}>
          <label className={styles.sectionLabel} htmlFor={`notes-${seat.id}`}>
            Notas
          </label>
          <textarea
            id={`notes-${seat.id}`}
            className={styles.notes}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observaciones del jugador..."
            rows={3}
          />
        </section>

        <div className={styles.actions}>
          <button className={styles.saveBtn} onClick={handleSave}>
            Guardar
          </button>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
