
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
  inverter?: string;
}

export interface ComparisonData {
  before: { cv: number; cable: string };
  after: { cv: number };
}

export interface BlockData {
  id: string;
  type: 'text' | 'comparison';
  value: string | ComparisonData;
  fontSize: number;
  bold?: boolean;
  italic?: boolean;
  align?: 'left' | 'center' | 'right' | 'justify';
}

export interface PageData {
  id: string;
  blocks: BlockData[];
}

export interface ProjectData {
  title: string;
  pages: PageData[];
}

export interface ProjectSummary {
  motorCount: number;
  totalCv: number;
  totalKw: number;
  totalIn: number;
  recommendedMainBreaker: string;
}
