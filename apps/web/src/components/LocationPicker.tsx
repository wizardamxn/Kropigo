'use client';

import dynamic from 'next/dynamic';

export interface LocationData {
  lat: string;
  lng: string;
  farmAddress: string;
  farmDistrict: string;
  farmState: string;
}

export interface LocationPickerProps extends LocationData {
  onChange: (loc: LocationData) => void;
  disabled?: boolean;
}

const LocationPickerMap = dynamic(() => import('./LocationPickerMap'), {
  ssr: false,
  loading: () => (
    <div className="space-y-4">
      {/* Search skeleton */}
      <div>
        <div className="h-4 w-32 bg-stone-200 dark:bg-stone-700 rounded mb-2 animate-pulse" />
        <div className="h-11 w-full bg-stone-100 dark:bg-stone-800 rounded-xl animate-pulse" />
      </div>
      {/* Button skeleton */}
      <div className="h-11 w-full bg-stone-100 dark:bg-stone-800 rounded-xl animate-pulse" />
      {/* Map skeleton */}
      <div className="h-80 w-full bg-stone-100 dark:bg-stone-800 rounded-xl animate-pulse flex items-center justify-center">
        <svg className="w-8 h-8 text-stone-400 dark:text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6-10l6-3m0 13l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 10m0 3V7" />
        </svg>
      </div>
      {/* Address fields skeleton */}
      <div className="space-y-4 pt-1">
        <div className="h-11 w-full bg-stone-100 dark:bg-stone-800 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-11 bg-stone-100 dark:bg-stone-800 rounded-xl animate-pulse" />
          <div className="h-11 bg-stone-100 dark:bg-stone-800 rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  ),
});

export default function LocationPicker(props: LocationPickerProps) {
  return <LocationPickerMap {...props} />;
}
