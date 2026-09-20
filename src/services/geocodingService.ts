export interface GeocodedLocation {
  name: string;
  country: string;
  region?: string;
  lat: number;
  lng: number;
  displayName: string;
}

const geocodeCache = new Map<string, GeocodedLocation[]>();
const reverseCache = new Map<string, GeocodedLocation>();

/**
 * Forward geocoding: Resolves place names, addresses, or city queries to real coordinates
 */
export async function forwardGeocode(query: string): Promise<GeocodedLocation[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  const cacheKey = cleanQuery.toLowerCase();
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)!;
  }

  // 1. Check if input is direct coordinates "lat, lng"
  const coordRegex = /^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/;
  if (coordRegex.test(cleanQuery)) {
    const [latStr, lngStr] = cleanQuery.split(',').map(s => s.trim());
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    const reverse = await reverseGeocode(lat, lng);
    return [reverse];
  }

  const mapboxToken = process.env.VITE_MAPBOX_TOKEN || process.env.MAPBOX_TOKEN;
  if (mapboxToken) {
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(cleanQuery)}.json?access_token=${mapboxToken}&limit=5`;
      const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const data: any = await res.json();
        if (Array.isArray(data.features) && data.features.length > 0) {
          const results: GeocodedLocation[] = data.features.map((f: any) => ({
            name: f.text || f.place_name,
            country: f.context?.find((c: any) => c.id.startsWith('country'))?.text || 'Global',
            region: f.context?.find((c: any) => c.id.startsWith('region'))?.text || '',
            lat: Number(f.center[1].toFixed(4)),
            lng: Number(f.center[0].toFixed(4)),
            displayName: f.place_name
          }));
          geocodeCache.set(cacheKey, results);
          return results;
        }
      }
    } catch (err: any) {
      console.warn('[Geocoding] Mapbox forward error, fallback to OSM:', err.message);
    }
  }

  // 2. OpenStreetMap Nominatim
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanQuery)}&format=json&addressdetails=1&limit=5`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'EcoGrid-AI/2.4 (Renewable Energy Planning Platform; contact@ecogrid.ai)'
      },
      signal: AbortSignal.timeout(5000)
    });

    if (res.ok) {
      const data: any = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const results: GeocodedLocation[] = data.map((item: any) => {
          const addr = item.address || {};
          const country = addr.country || 'Global';
          const region = addr.state || addr.region || addr.county || '';
          const name = item.name || addr.city || addr.town || addr.municipality || item.display_name.split(',')[0];
          return {
            name,
            country,
            region,
            lat: Number(parseFloat(item.lat).toFixed(4)),
            lng: Number(parseFloat(item.lon).toFixed(4)),
            displayName: item.display_name
          };
        });
        geocodeCache.set(cacheKey, results);
        return results;
      }
    }
  } catch (err: any) {
    console.warn('[Geocoding] Nominatim forward error:', err.message);
  }

  return [];
}

/**
 * Reverse geocoding: Resolves coordinates to place name and administrative region
 */
export async function reverseGeocode(lat: number, lng: number): Promise<GeocodedLocation> {
  const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  if (reverseCache.has(key)) {
    return reverseCache.get(key)!;
  }

  const mapboxToken = process.env.VITE_MAPBOX_TOKEN || process.env.MAPBOX_TOKEN;
  if (mapboxToken) {
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}&limit=1`;
      const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const data: any = await res.json();
        if (Array.isArray(data.features) && data.features.length > 0) {
          const f = data.features[0];
          const country = f.context?.find((c: any) => c.id.startsWith('country'))?.text || 'Global';
          const region = f.context?.find((c: any) => c.id.startsWith('region'))?.text || '';
          const result: GeocodedLocation = {
            name: f.text || f.place_name.split(',')[0],
            country,
            region,
            lat: Number(lat.toFixed(4)),
            lng: Number(lng.toFixed(4)),
            displayName: f.place_name
          };
          reverseCache.set(key, result);
          return result;
        }
      }
    } catch (e) {}
  }

  // OpenStreetMap Nominatim
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'EcoGrid-AI/2.4 (Renewable Energy Planning Platform; contact@ecogrid.ai)'
      },
      signal: AbortSignal.timeout(5000)
    });

    if (res.ok) {
      const data: any = await res.json();
      if (data && data.display_name) {
        const addr = data.address || {};
        const country = addr.country || 'International Territory';
        const region = addr.state || addr.region || addr.county || '';
        const name = addr.city || addr.town || addr.suburb || addr.village || addr.county || data.name || data.display_name.split(',')[0];
        const result: GeocodedLocation = {
          name: name || 'Site Coordinates Study',
          country,
          region,
          lat: Number(lat.toFixed(4)),
          lng: Number(lng.toFixed(4)),
          displayName: data.display_name
        };
        reverseCache.set(key, result);
        return result;
      }
    }
  } catch (err: any) {
    console.warn('[Geocoding] Nominatim reverse error:', err.message);
  }

  // Fallback for marine/offshore coordinates
  const isOffshore = Math.abs(lat) < 70 && (
    (lng > -45 && lng < -15 && Math.abs(lat) > 10) || // Mid-Atlantic
    (lng > -160 && lng < -130 && Math.abs(lat) > 10) // Pacific
  );

  const fallbackResult: GeocodedLocation = {
    name: isOffshore ? `Offshore Marine Study (${lat >= 0 ? lat.toFixed(2) + '°N' : Math.abs(lat).toFixed(2) + '°S'})` : `Study Zone (${lat.toFixed(2)}°, ${lng.toFixed(2)}°)`,
    country: isOffshore ? 'Maritime EEZ / Open Waters' : 'Global Region',
    lat: Number(lat.toFixed(4)),
    lng: Number(lng.toFixed(4)),
    displayName: `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`
  };
  reverseCache.set(key, fallbackResult);
  return fallbackResult;
}

/**
 * Queries real Open-Meteo digital elevation model (DEM)
 */
export async function getRealElevation(lat: number, lng: number): Promise<number | null> {
  try {
    const url = `https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lng}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(3500) });
    if (res.ok) {
      const data: any = await res.json();
      if (Array.isArray(data.elevation) && typeof data.elevation[0] === 'number') {
        return Math.round(data.elevation[0]);
      }
    }
  } catch (err) {
    // Graceful fallback
  }
  return null;
}
