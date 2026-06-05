'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix broken default Leaflet marker icons in webpack/Next.js
const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface LocationData {
  lat: string;
  lng: string;
  farmAddress: string;
  farmDistrict: string;
  farmState: string;
}

interface LocationPickerMapProps {
  lat: string;
  lng: string;
  farmAddress: string;
  farmDistrict: string;
  farmState: string;
  onChange: (loc: LocationData) => void;
  disabled?: boolean;
}

interface NominatimSearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

// Inner component that handles map click/drag events
function MapEventHandler({
  onMapClick,
}: {
  onMapClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

async function reverseGeocode(lat: number, lng: number): Promise<Partial<LocationData>> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`,
    { headers: { Accept: 'application/json' } }
  );
  if (!res.ok) return {};
  const data = await res.json();
  const addr = data.address ?? {};
  return {
    farmAddress: addr.village || addr.hamlet || addr.suburb || addr.town || addr.city || '',
    farmDistrict: addr.county || addr.district || addr.state_district || '',
    farmState: addr.state || '',
  };
}

const INDIA_CENTER: [number, number] = [20.5937, 78.9629];

export default function LocationPickerMap({
  lat,
  lng,
  farmAddress,
  farmDistrict,
  farmState,
  onChange,
  disabled,
}: LocationPickerMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isSatellite, setIsSatellite] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NominatimSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const hasPin = lat !== '' && lng !== '';
  const pinPosition: [number, number] | null = hasPin
    ? [parseFloat(lat), parseFloat(lng)]
    : null;

  // Close search results when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchResults([]);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePinDrop = useCallback(
    async (newLat: number, newLng: number) => {
      if (disabled) return;
      setIsGeocoding(true);
      setLocationError('');
      const geocoded = await reverseGeocode(newLat, newLng).catch(() => ({}));
      onChange({
        lat: String(newLat),
        lng: String(newLng),
        farmAddress: (geocoded as Partial<LocationData>).farmAddress ?? farmAddress,
        farmDistrict: (geocoded as Partial<LocationData>).farmDistrict ?? farmDistrict,
        farmState: (geocoded as Partial<LocationData>).farmState ?? farmState,
      });
      setIsGeocoding(false);
    },
    [disabled, farmAddress, farmDistrict, farmState, onChange]
  );

  const handleDetectLocation = async () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    setLocationError('');
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });
      const { latitude, longitude } = position.coords;
      mapRef.current?.flyTo([latitude, longitude], 14, { animate: true, duration: 1.2 });
      await handlePinDrop(latitude, longitude);
    } catch (err: unknown) {
      const code = (err as GeolocationPositionError)?.code;
      setLocationError(
        code === 1
          ? 'Location access denied. Please allow location permissions in your browser.'
          : 'Could not determine your location. Please try again or search manually.'
      );
    } finally {
      setIsLocating(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!value.trim()) {
      setSearchResults([]);
      return;
    }
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&limit=5&accept-language=en&countrycodes=in`,
          { headers: { Accept: 'application/json' } }
        );
        const results: NominatimSearchResult[] = await res.json();
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);
  };

  const handleSearchSelect = async (result: NominatimSearchResult) => {
    setSearchQuery(result.display_name.split(',')[0]);
    setSearchResults([]);
    const newLat = parseFloat(result.lat);
    const newLng = parseFloat(result.lon);
    mapRef.current?.flyTo([newLat, newLng], 14, { animate: true, duration: 1.2 });
    await handlePinDrop(newLat, newLng);
  };

  const handleMarkerDrag = useCallback(
    async (e: L.DragEndEvent) => {
      const { lat: newLat, lng: newLng } = (e.target as L.Marker).getLatLng();
      await handlePinDrop(newLat, newLng);
    },
    [handlePinDrop]
  );

  const inputClass =
    'h-11 w-full rounded-xl bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 px-4 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-green-800 dark:focus:ring-green-700 focus:border-transparent transition-all shadow-sm';
  const labelClass =
    'block font-sans text-sm font-medium text-stone-800 dark:text-stone-300 mb-1.5 ml-1';

  return (
    <div className="space-y-4">
      {/* Search box */}
      <div ref={searchRef} className="relative">
        <label className={labelClass}>Search Location</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {isSearching ? (
              <svg className="animate-spin h-4 w-4 text-stone-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search for a village, town, or district..."
            disabled={disabled}
            className={`${inputClass} pl-10`}
          />
        </div>

        {searchResults.length > 0 && (
          <div className="absolute z-1000 top-full mt-1 w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl shadow-lg overflow-hidden">
            {searchResults.map((result) => (
              <button
                key={result.place_id}
                type="button"
                onClick={() => handleSearchSelect(result)}
                className="w-full text-left px-4 py-3 text-sm font-sans text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 border-b border-stone-100 dark:border-stone-800 last:border-0 transition-colors line-clamp-1"
              >
                <span className="font-medium">{result.display_name.split(',')[0]}</span>
                <span className="text-stone-400 dark:text-stone-500 ml-1 text-xs">
                  {result.display_name.split(',').slice(1, 3).join(',')}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Use My Location button */}
      <button
        type="button"
        onClick={handleDetectLocation}
        disabled={isLocating || disabled}
        className="w-full h-11 flex items-center justify-center gap-2.5 rounded-xl border-2 border-green-700 dark:border-green-600 text-green-800 dark:text-green-400 font-sans font-medium text-sm hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isLocating ? (
          <>
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Detecting location...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06z" />
            </svg>
            Use My Current Location
          </>
        )}
      </button>

      {locationError && (
        <p className="text-xs text-red-600 dark:text-red-400 font-sans flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {locationError}
        </p>
      )}

      {/* Map */}
      <div className="relative rounded-xl overflow-hidden border border-stone-300 dark:border-stone-700 shadow-sm">
        <MapContainer
          center={pinPosition ?? INDIA_CENTER}
          zoom={pinPosition ? 14 : 5}
          style={{ height: '320px', width: '100%' }}
          ref={mapRef}
          scrollWheelZoom
        >
          {isSatellite ? (
            <TileLayer
              attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          ) : (
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          )}
          <MapEventHandler onMapClick={(lt, ln) => handlePinDrop(lt, ln)} />
          {pinPosition && (
            <Marker
              position={pinPosition}
              icon={markerIcon}
              draggable={!disabled}
              eventHandlers={{ dragend: handleMarkerDrag }}
            />
          )}
        </MapContainer>

        {/* Map / Satellite toggle */}
        <div className="absolute top-3 right-3 z-400 flex rounded-lg overflow-hidden shadow-md border border-stone-300/80 dark:border-stone-600/80">
          <button
            type="button"
            onClick={() => setIsSatellite(false)}
            className={`px-3 py-1.5 text-xs font-sans font-medium transition-colors ${
              !isSatellite
                ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100'
                : 'bg-white/70 dark:bg-stone-800/70 text-stone-500 dark:text-stone-400 hover:bg-white dark:hover:bg-stone-800'
            }`}
          >
            Map
          </button>
          <button
            type="button"
            onClick={() => setIsSatellite(true)}
            className={`px-3 py-1.5 text-xs font-sans font-medium transition-colors border-l border-stone-300/80 dark:border-stone-600/80 ${
              isSatellite
                ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100'
                : 'bg-white/70 dark:bg-stone-800/70 text-stone-500 dark:text-stone-400 hover:bg-white dark:hover:bg-stone-800'
            }`}
          >
            Satellite
          </button>
        </div>

        {/* Map hint overlay */}
        {!hasPin && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs font-sans px-3 py-1.5 rounded-full pointer-events-none whitespace-nowrap z-400">
            Click anywhere on the map to drop a pin
          </div>
        )}

        {/* Geocoding spinner overlay */}
        {isGeocoding && (
          <div className="absolute inset-0 bg-white/40 dark:bg-stone-900/40 flex items-center justify-center z-400">
            <div className="bg-white dark:bg-stone-900 rounded-xl px-4 py-2 shadow-md flex items-center gap-2 font-sans text-sm text-stone-700 dark:text-stone-300">
              <svg className="animate-spin h-4 w-4 text-green-700" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Fetching address...
            </div>
          </div>
        )}
      </div>

      {hasPin && (
        <p className="text-xs text-stone-500 dark:text-stone-400 font-sans text-center">
          Pin at ({parseFloat(lat).toFixed(5)}, {parseFloat(lng).toFixed(5)}) — drag pin to adjust
        </p>
      )}

      {/* Address fields */}
      <div className="space-y-4 pt-1">
        <div>
          <label className={labelClass}>Farm Address / Village *</label>
          <input
            type="text"
            value={farmAddress}
            onChange={(e) => onChange({ lat, lng, farmAddress: e.target.value, farmDistrict, farmState })}
            required
            placeholder="e.g. Plot 42, Near Checkpost"
            disabled={disabled}
            className={inputClass}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>District *</label>
            <input
              type="text"
              value={farmDistrict}
              onChange={(e) => onChange({ lat, lng, farmAddress, farmDistrict: e.target.value, farmState })}
              required
              placeholder="e.g. Jabalpur"
              disabled={disabled}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>State *</label>
            <input
              type="text"
              value={farmState}
              onChange={(e) => onChange({ lat, lng, farmAddress, farmDistrict, farmState: e.target.value })}
              required
              placeholder="e.g. Madhya Pradesh"
              disabled={disabled}
              className={inputClass}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
