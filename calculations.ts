
import { WegMotorData, DimensioningResult, ProjectSummary } from './types';

// Tabela 36 NBR 5410 - Método B1 (PVC 70°C)
const CABLE_CAPACITY = [
  { size: 1.5, amp: 15.5 }, 
  { size: 2.5, amp: 21 }, 
  { size: 4, amp: 28 },
  { size: 6, amp: 36 }, 
  { size: 10, amp: 50 }, 
  { size: 16, amp: 68 }, 
  { size: 25, amp: 89 }, 
  { size: 35, amp: 110 }, 
  { size: 50, amp: 134 },
  { size: 70, amp: 171 }, 
  { size: 95, amp: 207 }, 
  { size: 120, amp: 239 },
  { size: 150, amp: 272 }
];

export const calculateDimensioning = (motor: WegMotorData): DimensioningResult => {
  const In = motor.currentIn;
  
  // Fator Sênior: 1.25 (Norma) * 1.20 (Segurança Queda de Tensão/Partida) = 1.50x
  const targetAmp = In * 1.50; 
  
  let selected = CABLE_CAPACITY.find(c => c.amp >= targetAmp) || CABLE_CAPACITY[CABLE_CAPACITY.length - 1];

  // REGRAS DE PRECISÃO SÊNIOR PARA TODA A LINHA (NBR 5410 / WEG)
  if (motor.cv <= 1 && selected.size < 1.5) selected = CABLE_CAPACITY.find(c => c.size === 1.5)!;
  if (motor.cv > 1 && motor.cv <= 4 && selected.size < 2.5) selected = CABLE_CAPACITY.find(c => c.size === 2.5)!;
  if (motor.cv > 4 && motor.cv <= 6 && selected.size < 4) selected = CABLE_CAPACITY.find(c => c.size === 4)!;
  if (motor.cv > 6 && motor.cv <= 12.5 && selected.size < 6) selected = CABLE_CAPACITY.find(c => c.size === 6)!; // 10CV = 6mm²
  if (motor.cv > 12.5 && motor.cv <= 20 && selected.size < 10) selected = CABLE_CAPACITY.find(c => c.size === 10)!;
  if (motor.cv > 20 && motor.cv <= 30 && selected.size < 16) selected = CABLE_CAPACITY.find(c => c.size === 16)!;
  if (motor.cv > 30 && motor.cv <= 50 && selected.size < 25) selected = CABLE_CAPACITY.find(c => c.size === 25)!;
  if (motor.cv > 50 && motor.cv <= 75 && selected.size < 35) selected = CABLE_CAPACITY.find(c => c.size === 35)!;
  if (motor.cv > 75 && motor.cv <= 100 && selected.size < 50) selected = CABLE_CAPACITY.find(c => c.size === 50)!;
  if (motor.cv > 100 && motor.cv <= 150 && selected.size < 70) selected = CABLE_CAPACITY.find(c => c.size === 70)!;
  if (motor.cv > 150 && motor.cv <= 200 && selected.size < 95) selected = CABLE_CAPACITY.find(c => c.size === 95)!;
  if (motor.cv > 200 && selected.size < 120) selected = CABLE_CAPACITY.find(c => c.size === 120)!;

  const breakerVal = Math.ceil(In * 1.4);
  const breaker = motor.cv <= 40 ? `MPW40-${In.toFixed(1)}A` : `DWA-${breakerVal}A`;
  
  let contactor = "CWM9";
  if (In > 9) contactor = "CWM12";
  if (In > 12) contactor = "CWM18";
  if (In > 18) contactor = "CWM25";
  if (In > 25) contactor = "CWM32";
  if (In > 32) contactor = "CWM40";
  if (In > 40) contactor = "CWM50";
  if (In > 50) contactor = "CWM65";

  return {
    motor,
    circuitBreaker: breaker,
    cableSize: `${selected.size}mm²`,
    contactor: contactor,
    protectionType: "W22 IE3 Premium",
    softStarter: motor.cv >= 10 ? `SSW07` : undefined,
    inverter: (motor.cv >= 1 && motor.cv < 10) ? `CFW500` : undefined
  };
};

export const calculateGeneralSummary = (motors: WegMotorData[]): ProjectSummary => {
  const totalCv = motors.reduce((acc, m) => acc + m.cv, 0);
  const totalIn = motors.reduce((acc, m) => acc + m.currentIn, 0);
  const mainBreaker = [40, 63, 100, 125, 160, 200, 250, 400, 630, 800].find(r => r >= totalIn * 1.25) || 1250;

  return {
    motorCount: motors.length,
    totalCv: parseFloat(totalCv.toFixed(1)),
    totalKw: parseFloat((totalCv * 0.735).toFixed(1)),
    totalIn: parseFloat(totalIn.toFixed(1)),
    recommendedMainBreaker: `Disjuntor Geral ${mainBreaker}A`
  };
};
