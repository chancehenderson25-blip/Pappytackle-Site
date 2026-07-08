import type { Photo } from './types';

import lexus01 from '@/assets/photos/lexus-gx/long-travel-01.jpg';
import lexus02 from '@/assets/photos/lexus-gx/long-travel-02.jpg';
import lexus03 from '@/assets/photos/lexus-gx/long-travel-03.jpg';
import lexus04 from '@/assets/photos/lexus-gx/long-travel-04.jpg';
import lexusKings from '@/assets/photos/lexus-gx/kings-shocks.jpg';
import tacoLeveled from '@/assets/photos/tacomas/leveled-01.jpg';
import tacoLiftCamper from '@/assets/photos/tacomas/lift-camper.jpg';
import taco17Bumper from '@/assets/photos/tacomas/2017-bumper.jpg';
import taco16Shock from '@/assets/photos/tacomas/2016-shock-rebuild.jpg';
import broncoLights from '@/assets/photos/broncos/light-bar.jpg';
import vanExhaust01 from '@/assets/photos/exhaust/van-exhaust-01.jpg';
import exhaust02 from '@/assets/photos/exhaust/exhaust-02.jpg';
import van01 from '@/assets/photos/vans/van-01.jpg';
import van02 from '@/assets/photos/vans/van-02.jpg';

type Src = typeof lexus01;
const mk = (id: string, category: Photo['category'], src: Src, alt: string): Photo => ({
  id, category, src: src.src, alt, width: src.width, height: src.height,
});

export const photos: Photo[] = [
  mk('lexus-long-travel-01', 'lexus-gx', lexus01, 'Lexus GX with long-travel suspension build in shop bay'),
  mk('lexus-long-travel-02', 'lexus-gx', lexus02, 'Lexus GX long-travel build — under-vehicle suspension detail'),
  mk('lexus-long-travel-03', 'lexus-gx', lexus03, 'Lexus GX long-travel build — front-end three-quarter view'),
  mk('lexus-long-travel-04', 'lexus-gx', lexus04, 'Lexus GX long-travel build — side profile'),
  mk('lexus-kings-shocks', 'lexus-gx', lexusKings, 'Lexus GX with Kings coilover shocks installed'),
  mk('tacoma-leveled-01', 'tacomas', tacoLeveled, 'Toyota Tacoma after leveling kit installation'),
  mk('tacoma-lift-camper', 'tacomas', tacoLiftCamper, 'Toyota Tacoma with 3-inch lift and camper setup'),
  mk('tacoma-2017-bumper', 'tacomas', taco17Bumper, '2017 Toyota Tacoma with custom front bumper'),
  mk('tacoma-2016-shock-rebuild', 'tacomas', taco16Shock, '2016 Toyota Tacoma after shock rebuild service'),
  mk('bronco-light-bar', 'broncos', broncoLights, 'Ford Bronco with off-road light bar installation'),
  mk('exhaust-van-01', 'exhaust', vanExhaust01, 'Custom exhaust work on service van underside'),
  mk('exhaust-02', 'exhaust', exhaust02, 'Exhaust system work in shop bay'),
  mk('vans-van-01', 'vans', van01, 'Service van in for general maintenance'),
  mk('vans-van-02', 'vans', van02, 'Service van in shop bay'),
];

export const photoById = (id: string) => photos.find(p => p.id === id);
