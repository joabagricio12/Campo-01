
import { WegMotorData, DimensioningResult, ProjectSummary } from './types';

const CABLE_CAPACITY = [
  { size: 1.5, amp: 17.5 },
  { size: 2.5, amp: 24 },
  { size: 4, amp: 32 },
  { size: 6, amp: 41 },
  { size: 10, amp: 57 },
  { size: 16, amp: 76 },
  { size: 25, amp: 101 },
  { size: 35, amp: 125 },
  { size: 50, amp: 151 },
  { size: 70, amp: 192 },
  { size: 95, amp: 232 },
  { size: 120, amp: 269 },
  { size: 150, amp: 309 },
  { size: 185, amp: 353 },
  { size: 240, amp: 415 }
];

export const calculateDimensioning = (motor: WegMotorData): DimensioningResult => {
  const In = motor.currentIn;
  const distance = 100;
  const voltage = 380;
  const maxDeltaV = 4;

  const requiredIz = In * 1.25;
  let selectedCable = CABLE_CAPACITY.find(c => c.amp >= requiredIz) || CABLE_CAPACITY[CABLE_CAPACITY.length - 1];

  const rho = 0.021;
  const deltaVVolts = (maxDeltaV / 100) * voltage;
  const minSectionVoltageDrop = (Math.sqrt(3) * distance * In * rho) / deltaVVolts;
  
  if (selectedCable.size < minSectionVoltageDrop) {
    selectedCable = CABLE_CAPACITY.find(c => c.size >= minSectionVoltageDrop) || CABLE_CAPACITY[CABLE_CAPACITY.length - 1];
  }

  const contactorRating = In * 1.25;
  let contactorModel = "";
  if (contactorRating <= 9) contactorModel = "CWM9";
  else if (contactorRating <= 12) contactorModel = "CWM12";
  else if (contactorRating <= 18) contactorModel = "CWM18";
  else if (contactorRating <= 25) contactorModel = "CWM25";
  else if (contactorRating <= 32) contactorModel = "CWM32";
  else if (contactorRating <= 40) contactorModel = "CWM40";
  else if (contactorRating <= 50) contactorModel = "CWM50";
  else if (contactorRating <= 65) contactorModel = "CWM65";
  else if (contactorRating <= 80) contactorModel = "CWM80";
  else if (contactorRating <= 95) contactorModel = "CWM95";
  else contactorModel = `CWM${Math.ceil(contactorRating / 10) * 10}`;

  let breaker = "";
  let protType = "";
  let softStarter = undefined;

  if (motor.cv >= 5) {
    if (In <= 10) softStarter = "SSW05-10A";
    else if (In <= 16) softStarter = "SSW05-16A";
    else if (In <= 23) softStarter = "SSW05-23A";
    else if (In <= 30) softStarter = "SSW05-30A";
    else if (In <= 45) softStarter = "SSW07-45A";
    else if (In <= 60) softStarter = "SSW07-60A";
    else if (In <= 85) softStarter = "SSW07-85A";
    else if (In <= 110) softStarter = "SSW07-110A";
    else softStarter = `SSW06-${Math.ceil(In * 1.1)}A`;
  }

  if (motor.cv <= 40) {
    const adjMin = (In * 0.9).toFixed(1);
    const adjMax = (In * 1.15).toFixed(1);
    breaker = `MPW (Ajuste: ${adjMin}A a ${adjMax}A)`;
    protType = "Disjuntor-Motor";
  } else {
    const breakerIn = Math.ceil(In * 1.4 / 10) * 10;
    breaker = `DWA ${breakerIn}A`;
    protType = "Proteção Termomagnética";
  }

  return {
    motor,
    circuitBreaker: breaker,
    cableSize: `${selectedCable.size} mm²`,
    contactor: `${contactorModel} (AC-3)`,
    protectionType: protType,
    softStarter
  };
};

export const calculateGeneralSummary = (motors: WegMotorData[]): ProjectSummary => {
  const motorCount = motors.length;
  if (motorCount === 0) {
    return {
      motorCount: 0,
      motorList: [],
      totalCv: 0,
      totalKw: 0,
      totalIn: 0,
      totalIp: 0,
      recommendedMainBreaker: "N/A",
      softStarterCount: 0
    };
  }

  const totalCv = motors.reduce((acc, m) => acc + m.cv, 0);
  const totalKw = motors.reduce((acc, m) => acc + m.kw, 0);
  const totalIn = motors.reduce((acc, m) => acc + m.currentIn, 0);
  const softStarterCount = motors.filter(m => m.cv >= 5).length;

  const totalIp = motors.reduce((acc, m) => {
    const factor = m.cv >= 5 ? 3.0 : 7.5;
    return acc + (m.currentIn * factor);
  }, 0);

  const mainInRequired = totalIn * 1.25;
  const standardRatings = [16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 300, 400, 500, 630, 800, 1000, 1250];
  const breakerRating = standardRatings.find(r => r >= mainInRequired) || Math.ceil(mainInRequired / 10) * 10;

  const countMap: Record<number, number> = {};
  motors.forEach(m => {
    countMap[m.cv] = (countMap[m.cv] || 0) + 1;
  });
  
  const motorList = Object.entries(countMap)
    .map(([cv, count]) => ({ cv: parseFloat(cv), count }))
    .sort((a, b) => b.cv - a.cv);

  return {
    motorCount,
    motorList,
    totalCv: parseFloat(totalCv.toFixed(2)),
    totalKw: parseFloat(totalKw.toFixed(2)),
    totalIn: parseFloat(totalIn.toFixed(2)),
    totalIp: parseFloat(totalIp.toFixed(2)),
    recommendedMainBreaker: `DWA ${breakerRating}A`,
    softStarterCount
  };
};
