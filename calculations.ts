
import { WegMotorData, DimensioningResult, ProjectSummary } from './types';

const CABLE_CAPACITY = [
  { size: 1.5, amp: 17.5 }, { size: 2.5, amp: 24 }, { size: 4, amp: 32 },
  { size: 6, amp: 41 }, { size: 10, amp: 57 }, { size: 16, amp: 76 },
  { size: 25, amp: 101 }, { size: 35, amp: 125 }, { size: 50, amp: 151 },
  { size: 70, amp: 192 }, { size: 95, amp: 232 }, { size: 120, amp: 269 },
  { size: 150, amp: 309 }, { size: 185, amp: 353 }, { size: 240, amp: 415 }
];

export const calculateDimensioning = (motor: WegMotorData): DimensioningResult => {
  const In = motor.currentIn;
  const distance = 80; 
  const voltage = 380;
  
  const requiredIz = In * 1.25;
  let selectedCable = CABLE_CAPACITY.find(c => c.amp >= requiredIz) || CABLE_CAPACITY[CABLE_CAPACITY.length - 1];

  const rho = 0.021; 
  const deltaVPermissible = (4 / 100) * voltage;
  const minSectionDeltaV = (Math.sqrt(3) * distance * In * rho) / deltaVPermissible;
  
  if (selectedCable.size < minSectionDeltaV) {
    selectedCable = CABLE_CAPACITY.find(c => c.size >= minSectionDeltaV) || CABLE_CAPACITY[CABLE_CAPACITY.length - 1];
  }

  const contactorIn = In * 1.25;
  let contactor = contactorIn <= 9 ? "CWM9" : contactorIn <= 12 ? "CWM12" : contactorIn <= 18 ? "CWM18" : contactorIn <= 25 ? "CWM25" : contactorIn <= 32 ? "CWM32" : `CWM${Math.ceil(contactorIn / 10) * 10}`;

  let breaker = "";
  let vfd = undefined;

  // Lógica técnica de Inversores/Softstarters
  if (motor.cv >= 2) {
    if (In <= 13) vfd = "CFW500-A (13A, IP20, Filtro RFI Integrado)";
    else if (In <= 24) vfd = "CFW500-B (24A, IP20, Controle Vetorial)";
    else if (In <= 45) vfd = "CFW11 (45A, Heavy Duty, PLC Integrado)";
    else vfd = "CFW11 G2 (Alta Performance Industrial)";
  }

  if (motor.cv <= 40) {
    breaker = `Disjuntor-Motor MPW40 (Ajuste: ${(In * 0.9).toFixed(1)}A a ${(In * 1.15).toFixed(1)}A)`;
  } else {
    breaker = `Disjuntor DWA ${Math.ceil(In * 1.3 / 10) * 10}A (Cap. Ruptura 35kA)`;
  }

  return {
    motor,
    circuitBreaker: breaker,
    cableSize: `${selectedCable.size} mm² (Cobre)`,
    contactor: `${contactor} (Bobina 220V AC)`,
    protectionType: motor.cv > 40 ? "Termomagnética Industrial" : "Proteção Escalar Especializada",
    softStarter: vfd
  };
};

export const calculateGeneralSummary = (motors: WegMotorData[]): ProjectSummary => {
  const totalCv = motors.reduce((acc, m) => acc + m.cv, 0);
  const totalKw = motors.reduce((acc, m) => acc + m.kw, 0);
  const totalIn = motors.reduce((acc, m) => acc + m.currentIn, 0);
  
  const maxMotorIn = motors.length > 0 ? Math.max(...motors.map(m => m.currentIn)) : 0;
  // Ip estimado = (Soma das correntes nominais - maior corrente) + (Maior corrente * 7)
  const totalIp = (totalIn - maxMotorIn) + (maxMotorIn * 7); 

  const mainBreakerRating = [40, 50, 63, 80, 100, 125, 160, 200, 250, 400, 630, 800].find(r => r >= totalIn * 1.15) || 1000;

  const motorList = Array.from(new Set(motors.map(m => m.cv))).map(cv => ({
    cv,
    count: motors.filter(m => m.cv === cv).length
  })).sort((a, b) => b.cv - a.cv);

  return {
    motorCount: motors.length,
    motorList,
    totalCv: parseFloat(totalCv.toFixed(2)),
    totalKw: parseFloat(totalKw.toFixed(2)),
    totalIn: parseFloat(totalIn.toFixed(2)),
    totalIp: parseFloat(totalIp.toFixed(2)),
    recommendedMainBreaker: `DWA ${mainBreakerRating}A`,
    softStarterCount: motors.filter(m => m.cv >= 2).length
  };
};
