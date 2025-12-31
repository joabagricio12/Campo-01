
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

export interface SummaryItemData {
  motorCv: number;
  in: number;
  ip: number;
  cable: string;
  breaker: string;
  contactor: string;
  vfd?: string;
}

export interface WidgetData {
  id: string;
  type: 'text' | 'motor' | 'summary-list';
  value: string; // Para 'text' e 'motor'
  items?: SummaryItemData[]; // Para 'summary-list'
  width: number;
  height: number;
  fontSize: number;
}

export interface PageData {
  id: string;
  type: 'report' | 'summary';
  title: string;
  widgets: WidgetData[];
}
