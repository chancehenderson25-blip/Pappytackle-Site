export type ServiceCategory =
  | 'maintenance' | 'diagnostics' | 'hvac' | 'electrical'
  | 'exhaust' | 'brakes' | 'oil_change' | '4x4_custom';

export interface Service {
  id: string;
  category: ServiceCategory;
  name: string;
  summary: string;
  body: string;
}

export interface RecentJob {
  id: string;
  vehicle: string;
  work: string;
  category: ServiceCategory;
  photoIds: string[];
}

export interface Photo {
  id: string;
  category: 'lexus-gx' | 'tacomas' | 'broncos' | 'exhaust' | 'vans';
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface Review {
  id: string;
  rating: 1 | 2 | 3 | 4 | 5;
  name: string;
  date: string;
  body: string;
  _isSample?: boolean;
}

export interface Build {
  id: string;
  title: string;
  vehicle: string;
  summary: string;
  category: 'lift' | 'suspension' | 'long-travel' | 'bumper' | 'full';
  photoIds: string[];
}
