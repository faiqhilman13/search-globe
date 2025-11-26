export type Country = {
  code: string;
  name: string;
  region: string;
  lat: number;
  lon: number;
};

export type RegionsMap = Record<string, Country[]>;

export type Trend = {
  term: string;
  score: number;
  breakout_flag: number;
  points?: number;
  countries?: string;
};
