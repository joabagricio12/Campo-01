
export interface WegMotorData {
  cv: number;
  kw: number;
  model: string;
  currentIn: number;
  efficiency: number;
  powerFactor: number;
  frame: string;
  weight: number;
  rpm: number;
}

export interface DimensioningResult {
  motor: WegMotorData;
  circuitBreaker: string;
  cableSize: string;
  contactor: string;
  protectionType: string;
  softStarter?: string;
}

export interface ProjectSummary {
  motorCount: number;
  motorList: { cv: number; count: number }[];
  totalCv: number;
  totalKw: number;
  totalIn: number;
  totalIp: number;
  recommendedMainBreaker: string;
  softStarterCount: number;
}
