import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, type MapType, type Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { toast } from 'sonner-native';
import { useTranslations } from 'use-intl';
import { searchPlaces, reverseGeocode, type PlaceResult } from '@/lib/nominatim';
import { useDebounced } from '@/hooks/useDebounced';
import { Field, Input } from '@/components/ui';

export interface LocationValue {
  farmAddress: string;
  farmState: string;
  farmDistrict: string;
  lat?: number;
  lng?: number;
}

/** Same India-wide fallback view the web picker opens with. */
const INDIA_REGION: Region = {
  latitude: 20.5937,
  longitude: 78.9629,
  latitudeDelta: 25,
  longitudeDelta: 25,
};
const PINNED_DELTA = { latitudeDelta: 0.02, longitudeDelta: 0.02 };

/**
 * Address entry backed by a Google map, GPS, and Nominatim search — the mobile
 * counterpart of the web LocationPickerMap. Geocoding stays on Nominatim (free);
 * only the map tiles come from Google, whose Android SDK map loads are not billed.
 */
export function LocationPicker({ value, onChange }: {
  value: LocationValue;
  onChange: (value: LocationValue) => void;
}) {
  const t = useTranslations('mobile.location');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [mapType, setMapType] = useState<MapType>('standard');
  const [mapReady, setMapReady] = useState(false);
  const debouncedQuery = useDebounced(query, 600);
  const mapRef = useRef<MapView>(null);
  const centredOnPin = useRef(false);

  const hasPin = value.lat !== undefined && value.lng !== undefined;

  useEffect(() => {
    if (debouncedQuery.trim().length < 3) { setResults([]); return; }

    const controller = new AbortController();
    setSearching(true);
    searchPlaces(debouncedQuery, controller.signal)
      .then(setResults)
      .catch(() => setResults([]))
      .finally(() => setSearching(false));

    return () => controller.abort();
  }, [debouncedQuery]);

  const focusMap = (lat: number, lng: number) => {
    mapRef.current?.animateToRegion({ latitude: lat, longitude: lng, ...PINNED_DELTA }, 800);
  };

  // `initialRegion` is only read at mount, but the edit screen hydrates its pin
  // from the API a tick later. Centre once, as soon as both the map and a pin exist.
  useEffect(() => {
    if (!mapReady || centredOnPin.current || !hasPin) return;
    centredOnPin.current = true;
    focusMap(value.lat!, value.lng!);
  }, [mapReady, hasPin, value.lat, value.lng]);

  const apply = (place: PlaceResult) => {
    onChange({
      farmAddress: place.displayName,
      farmState: place.state ?? value.farmState,
      farmDistrict: place.district ?? value.farmDistrict,
      lat: place.lat,
      lng: place.lng,
    });
    focusMap(place.lat, place.lng);
    setQuery('');
    setResults([]);
  };

  /**
   * Tapping the map or dragging the marker moves the pin first and fills the
   * address afterwards, so the pin never appears to lag behind the gesture.
   */
  const dropPin = async (lat: number, lng: number) => {
    onChange({ ...value, lat, lng });
    setGeocoding(true);
    try {
      const place = await reverseGeocode(lat, lng);
      if (place) {
        onChange({
          farmAddress: place.displayName,
          farmState: place.state ?? value.farmState,
          farmDistrict: place.district ?? value.farmDistrict,
          lat,
          lng,
        });
      }
      // A failed lookup keeps the coordinates — they still help with pickup.
    } catch {
      // Same: the pin stands, the user can type the address by hand.
    } finally {
      setGeocoding(false);
    }
  };

  const useCurrentLocation = async () => {
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        toast.error(t('permission'));
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      focusMap(position.coords.latitude, position.coords.longitude);
      await dropPin(position.coords.latitude, position.coords.longitude);
    } catch {
      toast.error(t('failedBody'));
    } finally {
      setLocating(false);
    }
  };

  return (
    <View>
      <Field label={t('search')}>
        <Input value={query} onChangeText={setQuery} placeholder={t('searchPlaceholder')} autoCorrect={false} />
        {searching ? <ActivityIndicator color="#166534" style={{ marginTop: 10 }} /> : null}
        {results.length > 0 ? (
          <View className="mt-2 overflow-hidden rounded-xl border border-stone-200 dark:border-stone-800">
            {results.map((place, index) => (
              <Pressable
                key={`${place.lat}-${place.lng}-${index}`}
                onPress={() => apply(place)}
                className={`bg-white p-3 active:opacity-70 dark:bg-stone-900 ${index > 0 ? 'border-t border-stone-100 dark:border-stone-800' : ''}`}
              >
                <Text className="text-sm text-stone-800 dark:text-stone-200" numberOfLines={2}>{place.displayName}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </Field>

      <Pressable
        onPress={useCurrentLocation}
        disabled={locating}
        className="mt-4 h-12 flex-row items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 active:opacity-90 dark:border-green-900 dark:bg-green-950"
      >
        {locating ? (
          <ActivityIndicator color="#166534" />
        ) : (
          <>
            <Ionicons name="locate-outline" size={18} color="#166534" />
            <Text className="font-bold text-primary">{t('useCurrent')}</Text>
          </>
        )}
      </Pressable>

      <View className="mt-4 overflow-hidden rounded-xl border border-stone-200 dark:border-stone-800">
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          mapType={mapType}
          style={{ height: 260 }}
          onMapReady={() => setMapReady(true)}
          initialRegion={hasPin ? { latitude: value.lat!, longitude: value.lng!, ...PINNED_DELTA } : INDIA_REGION}
          onPress={(event) => {
            const { latitude, longitude } = event.nativeEvent.coordinate;
            void dropPin(latitude, longitude);
          }}
        >
          {hasPin ? (
            <Marker
              coordinate={{ latitude: value.lat!, longitude: value.lng! }}
              draggable
              onDragEnd={(event) => {
                const { latitude, longitude } = event.nativeEvent.coordinate;
                void dropPin(latitude, longitude);
              }}
            />
          ) : null}
        </MapView>

        <View className="absolute right-2 top-2 flex-row overflow-hidden rounded-lg border border-stone-300/80 bg-white/90 dark:border-stone-600/80 dark:bg-stone-800/90">
          {(['standard', 'hybrid'] as const).map((type) => (
            <Pressable
              key={type}
              onPress={() => setMapType(type)}
              className={`px-3 py-1.5 ${mapType === type ? 'bg-white dark:bg-stone-800' : ''}`}
            >
              <Text className={`text-xs font-medium ${mapType === type ? 'text-stone-900 dark:text-stone-100' : 'text-stone-500 dark:text-stone-400'}`}>
                {t(type === 'standard' ? 'mapView' : 'satelliteView')}
              </Text>
            </Pressable>
          ))}
        </View>

        {!hasPin ? (
          <View className="absolute bottom-3 left-0 right-0 items-center">
            <Text className="overflow-hidden rounded-full bg-stone-950/60 px-3 py-1.5 text-xs text-white">
              {t('tapToPin')}
            </Text>
          </View>
        ) : null}

        {geocoding ? (
          <View className="absolute inset-0 items-center justify-center bg-white/40 dark:bg-stone-900/40">
            <View className="flex-row items-center gap-2 rounded-xl bg-white px-4 py-2 dark:bg-stone-900">
              <ActivityIndicator color="#166534" />
              <Text className="text-sm text-stone-700 dark:text-stone-300">{t('fetchingAddress')}</Text>
            </View>
          </View>
        ) : null}
      </View>

      {hasPin ? (
        <Text className="mt-2 text-center text-xs text-stone-500 dark:text-stone-400">
          📍 {value.lat!.toFixed(5)}, {value.lng!.toFixed(5)}
        </Text>
      ) : null}

      <Field label={t('address')}>
        <Input
          value={value.farmAddress}
          onChangeText={(farmAddress) => onChange({ ...value, farmAddress })}
          placeholder={t('addressPlaceholder')}
          multiline
          className="h-20 pt-3"
          style={{ textAlignVertical: 'top' }}
        />
      </Field>

      <View className="flex-row gap-3">
        <View className="flex-1">
          <Field label={t('district')}>
            <Input value={value.farmDistrict} onChangeText={(farmDistrict) => onChange({ ...value, farmDistrict })} placeholder={t('district')} />
          </Field>
        </View>
        <View className="flex-1">
          <Field label={t('state')}>
            <Input value={value.farmState} onChangeText={(farmState) => onChange({ ...value, farmState })} placeholder={t('state')} />
          </Field>
        </View>
      </View>
    </View>
  );
}
