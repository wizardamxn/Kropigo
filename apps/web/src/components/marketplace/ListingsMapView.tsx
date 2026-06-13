'use client';

import dynamic from 'next/dynamic';

// Leaflet touches `window` on import, so the map must be client-only.
const ListingsMap = dynamic(() => import('./ListingsMap'), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800 shadow-sm">
      <div className="h-[70vh] min-h-[420px] w-full bg-stone-100 dark:bg-stone-800 animate-pulse flex items-center justify-center">
        <svg className="w-10 h-10 text-stone-400 dark:text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6-10l6-3m0 13l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 10m0 3V7" />
        </svg>
      </div>
    </div>
  ),
});

interface MapListing {
  _id: string;
  cropId?: { name?: string } | string;
  variety?: string;
  quantity?: number;
  unit?: string;
  farmDistrict?: string;
  farmState?: string;
  farmCoordinates?: { lat: number; lng: number };
}

export default function ListingsMapView({ listings }: Readonly<{ listings: MapListing[] }>) {
  return <ListingsMap listings={listings} />;
}
