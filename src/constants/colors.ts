export interface PlayerColor {
  id: string;
  value: string;
  label: string;
}

export const PLAYER_COLORS: PlayerColor[] = [
  { id: 'red',    value: '#e74c3c', label: 'Rojo' },
  { id: 'blue',   value: '#3498db', label: 'Azul' },
  { id: 'green',  value: '#2ecc71', label: 'Verde' },
  { id: 'yellow', value: '#f1c40f', label: 'Amarillo' },
  { id: 'orange', value: '#e67e22', label: 'Naranja' },
  { id: 'purple', value: '#9b59b6', label: 'Violeta' },
  { id: 'pink',   value: '#e91e8c', label: 'Rosa' },
  { id: 'teal',   value: '#1abc9c', label: 'Verde azulado' },
];
