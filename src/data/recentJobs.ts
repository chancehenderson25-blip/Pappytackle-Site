import type { RecentJob } from './types';

export const recentJobs: RecentJob[] = [
  { id: 'lexus-gx-long-travel', vehicle: 'Lexus GX', work: 'Long-travel suspension build with Kings shocks', category: '4x4_custom', photoIds: ['lexus-long-travel-01','lexus-long-travel-02','lexus-long-travel-03','lexus-long-travel-04','lexus-kings-shocks'] },
  { id: 'tacoma-3in-lift-camper', vehicle: '2018 Toyota Tacoma', work: '3-inch lift install with camper setup', category: '4x4_custom', photoIds: ['tacoma-lift-camper'] },
  { id: 'tacoma-leveled', vehicle: 'Toyota Tacoma', work: 'Leveling kit install', category: '4x4_custom', photoIds: ['tacoma-leveled-01'] },
  { id: 'tacoma-17-bumper', vehicle: '2017 Toyota Tacoma', work: 'Custom bumper install', category: '4x4_custom', photoIds: ['tacoma-2017-bumper'] },
  { id: 'tacoma-16-shock-rebuild', vehicle: '2016 Toyota Tacoma', work: 'Shock rebuild', category: '4x4_custom', photoIds: ['tacoma-2016-shock-rebuild'] },
  { id: 'bronco-lights', vehicle: 'Ford Bronco', work: 'Off-road light bar install', category: '4x4_custom', photoIds: ['bronco-light-bar'] },
  { id: 'van-exhaust-1', vehicle: 'Service van', work: 'Custom exhaust work', category: 'exhaust', photoIds: ['exhaust-van-01'] },
  { id: 'van-exhaust-2', vehicle: 'Service van', work: 'Exhaust system service', category: 'exhaust', photoIds: ['exhaust-02'] },
  { id: 'van-service-1', vehicle: 'Service van', work: 'General service', category: 'maintenance', photoIds: ['vans-van-01'] },
  { id: 'van-service-2', vehicle: 'Service van', work: 'General service', category: 'maintenance', photoIds: ['vans-van-02'] },
  { id: 'sienna-lift', vehicle: 'Toyota Sienna', work: '3.5-inch lift install', category: '4x4_custom', photoIds: [] },
  { id: 'gladiator-diff', vehicle: 'Jeep Gladiator', work: 'Differential service', category: 'maintenance', photoIds: [] },
  { id: 'transit-injectors', vehicle: 'Ford Transit', work: 'Fuel injector replacement', category: 'diagnostics', photoIds: [] },
  { id: 'sierra-oil', vehicle: 'GMC Sierra', work: 'Oil service', category: 'oil_change', photoIds: [] },
];
