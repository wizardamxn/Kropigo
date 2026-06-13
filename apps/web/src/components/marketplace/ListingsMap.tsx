'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

// Default Leaflet marker icons break under bundlers — point them at the copies
// in /public/leaflet (no external CDN dependency).
const markerIcon = new L.Icon({
  iconUrl: '/leaflet/marker-icon.png',
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  shadowUrl: '/leaflet/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const INDIA_CENTER: [number, number] = [20.5937, 78.9629];

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

type PinnedListing = MapListing & { farmCoordinates: { lat: number; lng: number } };

export default function ListingsMap({ listings }: Readonly<{ listings: MapListing[] }>) {
  const t = useTranslations('buyerMarketplace');

  const pinned = listings.filter(
    (l): l is PinnedListing =>
      !!l.farmCoordinates &&
      typeof l.farmCoordinates.lat === 'number' &&
      typeof l.farmCoordinates.lng === 'number',
  );

  // Center on the first pin if available, else fall back to India-wide view.
  const first = pinned[0];
  const center: [number, number] = first
    ? [first.farmCoordinates.lat, first.farmCoordinates.lng]
    : INDIA_CENTER;

  return (
    <div className="relative rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800 shadow-sm">
      <MapContainer
        center={center}
        zoom={pinned.length ? 6 : 5}
        style={{ height: '70vh', minHeight: '420px', width: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {pinned.map((l) => {
          const crop = typeof l.cropId === 'string' ? null : l.cropId;
          const cropName = crop?.name ?? '—';
          return (
            <Marker
              key={l._id}
              position={[l.farmCoordinates.lat, l.farmCoordinates.lng]}
              icon={markerIcon}
            >
              <Popup>
                <div className="font-sans min-w-44 space-y-1.5">
                  <p className="font-serif text-base font-semibold text-stone-800 leading-tight">
                    {cropName} {l.variety ? `(${l.variety})` : ''}
                  </p>
                  {l.quantity != null && (
                    <p className="text-xs text-stone-600">
                      {t('available', { quantity: l.quantity, unit: l.unit ?? '' })}
                    </p>
                  )}
                  {(l.farmDistrict || l.farmState) && (
                    <p className="text-xs text-stone-500">
                      {[l.farmDistrict, l.farmState].filter(Boolean).join(', ')}
                    </p>
                  )}
                  <Link
                    href={`/buyer/marketplace/${l._id}`}
                    className="inline-flex mt-1 px-3 py-1.5 rounded-lg bg-green-800 hover:bg-green-700 text-white text-xs font-medium transition-colors"
                  >
                    {t('viewListing')}
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
