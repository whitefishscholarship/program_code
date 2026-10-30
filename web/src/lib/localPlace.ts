import type { StudentAward } from './studentCatalog';

type LocalPlace = {
  id: string;
  residencyScope: 'whitefish' | 'flathead';
  poolLevel: 1 | 2;
  poolReason: string;
};

/**
 * Whitefish and Flathead awards whose pages did not yield a place, so the
 * catalog left residencyScope empty. The place comes from the award name or
 * from text already stored on the award. National awards with no place stay empty.
 */
const LOCAL_PLACES: readonly LocalPlace[] = [
  {
    id: 'award-5dc2aab768d2',
    residencyScope: 'whitefish',
    poolLevel: 1,
    poolReason: 'Whitefish High School students. The Bulldog Booster Club is a Whitefish group.',
  },
  {
    id: 'award-5dd4c3d3988a',
    residencyScope: 'whitefish',
    poolLevel: 1,
    poolReason: 'Whitefish students. The Whitefish Soroptimist club sponsors this award.',
  },
  {
    id: 'award-bb8ca59a7f0f',
    residencyScope: 'flathead',
    poolLevel: 2,
    poolReason: 'Flathead Valley residents, or a Montana Coffee Traders employee family. The sponsor is the Whitefish Community Foundation.',
  },
  {
    id: 'award-615c2c524263',
    residencyScope: 'flathead',
    poolLevel: 2,
    poolReason: 'Kalispell students who played for the Kalispell Youth Softball Association.',
  },
];

const BY_ID = new Map(LOCAL_PLACES.map((place) => [place.id, place]));

export function applyLocalPlace(award: StudentAward): StudentAward {
  if (award.residencyScope != null) return award;
  const place = BY_ID.get(award.publicId);
  if (!place) return award;
  return {
    ...award,
    residencyScope: place.residencyScope,
    poolLevel: place.poolLevel,
    poolReason: place.poolReason,
  };
}

export function applyLocalPlaces<T extends { awards: StudentAward[] }>(catalog: T): T {
  let changed = false;
  const awards = catalog.awards.map((award) => {
    const next = applyLocalPlace(award);
    if (next !== award) changed = true;
    return next;
  });
  return changed ? { ...catalog, awards } : catalog;
}
