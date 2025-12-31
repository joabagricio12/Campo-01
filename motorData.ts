
import { WegMotorData } from './types';

// Dados técnicos baseados no catálogo oficial WEG W22 - Motores de Indução Trifásicos (IE3/IE4)
// Considerada tensão de 380V @ 60Hz.
export const WEG_MOTORS: WegMotorData[] = [
  { cv: 0.16, kw: 0.12, model: "W22 63", currentIn: 0.49, efficiency: 62.0, powerFactor: 0.58, frame: "63", weight: 4.5, rpm: 1680 },
  { cv: 0.25, kw: 0.18, model: "W22 63", currentIn: 0.68, efficiency: 64.0, powerFactor: 0.61, frame: "63", weight: 5.0, rpm: 1690 },
  { cv: 0.33, kw: 0.25, model: "W22 63", currentIn: 0.82, efficiency: 68.0, powerFactor: 0.66, frame: "63", weight: 5.5, rpm: 1700 },
  { cv: 0.5, kw: 0.37, model: "W22 71", currentIn: 1.12, efficiency: 70.0, powerFactor: 0.70, frame: "71", weight: 7.2, rpm: 1710 },
  { cv: 0.75, kw: 0.55, model: "W22 71", currentIn: 1.55, efficiency: 73.0, powerFactor: 0.72, frame: "71", weight: 8.5, rpm: 1720 },
  { cv: 1, kw: 0.75, model: "W22 80", currentIn: 1.95, efficiency: 82.5, powerFactor: 0.69, frame: "80", weight: 14.5, rpm: 1735 },
  { cv: 1.5, kw: 1.1, model: "W22 80", currentIn: 2.70, efficiency: 84.1, powerFactor: 0.72, frame: "80", weight: 16.0, rpm: 1735 },
  { cv: 2, kw: 1.5, model: "W22 90S", currentIn: 3.52, efficiency: 85.3, powerFactor: 0.74, frame: "90S", weight: 21.0, rpm: 1740 },
  { cv: 3, kw: 2.2, model: "W22 90L", currentIn: 5.02, efficiency: 86.7, powerFactor: 0.75, frame: "90L", weight: 25.0, rpm: 1745 },
  { cv: 4, kw: 3, model: "W22 100L", currentIn: 6.64, efficiency: 87.7, powerFactor: 0.76, frame: "100L", weight: 36.0, rpm: 1750 },
  { cv: 5, kw: 3.7, model: "W22 100L", currentIn: 8.02, efficiency: 88.3, powerFactor: 0.77, frame: "100L", weight: 39.0, rpm: 1755 },
  { cv: 6, kw: 4.5, model: "W22 112M", currentIn: 9.60, efficiency: 89.0, powerFactor: 0.78, frame: "112M", weight: 48.0, rpm: 1755 },
  { cv: 7.5, kw: 5.5, model: "W22 132S", currentIn: 11.5, efficiency: 89.5, powerFactor: 0.79, frame: "132S", weight: 64.0, rpm: 1760 },
  { cv: 10, kw: 7.5, model: "W22 132M", currentIn: 15.3, efficiency: 90.4, powerFactor: 0.80, frame: "132M", weight: 75.0, rpm: 1765 },
  { cv: 12.5, kw: 9.2, model: "W22 132M/L", currentIn: 18.5, efficiency: 91.0, powerFactor: 0.81, frame: "132M/L", weight: 82.0, rpm: 1765 },
  { cv: 15, kw: 11, model: "W22 160M", currentIn: 21.8, efficiency: 91.4, powerFactor: 0.82, frame: "160M", weight: 125, rpm: 1770 },
  { cv: 20, kw: 15, model: "W22 160L", currentIn: 29.2, efficiency: 92.1, powerFactor: 0.83, frame: "160L", weight: 145, rpm: 1770 },
  { cv: 25, kw: 18.5, model: "W22 180M", currentIn: 35.5, efficiency: 92.6, powerFactor: 0.83, frame: "180M", weight: 180, rpm: 1775 },
  { cv: 30, kw: 22, model: "W22 180L", currentIn: 41.8, efficiency: 93.0, powerFactor: 0.84, frame: "180L", weight: 205, rpm: 1775 },
  { cv: 40, kw: 30, model: "W22 200M", currentIn: 56.5, efficiency: 93.6, powerFactor: 0.84, frame: "200M", weight: 265, rpm: 1780 },
  { cv: 50, kw: 37, model: "W22 200L", currentIn: 69.1, efficiency: 93.9, powerFactor: 0.85, frame: "200L", weight: 305, rpm: 1780 },
  { cv: 60, kw: 45, model: "W22 225S/M", currentIn: 83.2, efficiency: 94.2, powerFactor: 0.85, frame: "225S/M", weight: 395, rpm: 1785 },
  { cv: 75, kw: 55, model: "W22 250S/M", currentIn: 101, efficiency: 94.6, powerFactor: 0.85, frame: "250S/M", weight: 480, rpm: 1785 },
  { cv: 100, kw: 75, model: "W22 280S/M", currentIn: 137, efficiency: 95.0, powerFactor: 0.86, frame: "280S/M", weight: 620, rpm: 1790 },
  { cv: 125, kw: 92, model: "W22 315S/M", currentIn: 167, efficiency: 95.2, powerFactor: 0.86, frame: "315S/M", weight: 890, rpm: 1790 },
  { cv: 150, kw: 110, model: "W22 315S/M", currentIn: 200, efficiency: 95.4, powerFactor: 0.86, frame: "315S/M", weight: 980, rpm: 1790 },
  { cv: 175, kw: 132, model: "W22 315L", currentIn: 242, efficiency: 95.6, powerFactor: 0.86, frame: "315L", weight: 1050, rpm: 1790 },
  { cv: 200, kw: 150, model: "W22 315L", currentIn: 270, efficiency: 95.8, powerFactor: 0.86, frame: "315L", weight: 1120, rpm: 1790 },
  { cv: 250, kw: 185, model: "W22 355M/L", currentIn: 332, efficiency: 96.0, powerFactor: 0.86, frame: "355M/L", weight: 1550, rpm: 1790 }
];

export const getMotorByCv = (cv: number): WegMotorData | undefined => {
  return WEG_MOTORS.find(m => m.cv === cv);
};
