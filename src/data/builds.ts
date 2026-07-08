import type { Build } from './types';

export const builds: Build[] = [
  { id: 'lexus-gx-long-travel', title: 'Lexus GX Long-Travel', vehicle: 'Lexus GX', summary: 'Full long-travel suspension build with Kings shocks. Built for high-speed desert and rough trail.', category: 'long-travel', photoIds: ['lexus-long-travel-01','lexus-long-travel-02','lexus-long-travel-03','lexus-long-travel-04','lexus-kings-shocks'] },
  { id: 'tacoma-3in-lift-camper', title: 'Tacoma 3" Lift + Camper', vehicle: '2018 Toyota Tacoma', summary: '3-inch lift install paired with a camper setup. Daily driver that doubles as a weekend basecamp.', category: 'lift', photoIds: ['tacoma-lift-camper'] },
  { id: 'tacoma-2017-bumper', title: '2017 Tacoma Custom Bumper', vehicle: '2017 Toyota Tacoma', summary: 'Custom front bumper install — trail-ready, recovery points, winch-mount capable.', category: 'bumper', photoIds: ['tacoma-2017-bumper'] },
  { id: 'bronco-light-bar', title: 'Bronco Off-Road Lights', vehicle: 'Ford Bronco', summary: 'Light bar wiring and mounting for night-trail driving.', category: 'full', photoIds: ['bronco-light-bar'] },
  { id: 'tacoma-shock-rebuild', title: 'Tacoma Shock Rebuild', vehicle: '2016 Toyota Tacoma', summary: 'Full shock rebuild — saved this owner the cost of new units.', category: 'suspension', photoIds: ['tacoma-2016-shock-rebuild'] },
  { id: 'tacoma-leveled', title: 'Tacoma Leveling Kit', vehicle: 'Toyota Tacoma', summary: 'Clean leveling kit install — no rake, room for larger tires.', category: 'lift', photoIds: ['tacoma-leveled-01'] },
];
