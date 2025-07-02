import { Filesystem, Directory } from '@capacitor/filesystem';

function toBase64(str) {
  if (typeof window !== "undefined" && window.btoa) {
    return btoa(unescape(encodeURIComponent(str)));
  }
  // Node.js or non-browser
  return Buffer.from(str, 'utf-8').toString('base64');
}

export async function getGeoJsonUniversalCache(url) {
  const fileName = `geojson_${toBase64(url)}.json`;

  // 1. Try Capacitor Filesystem if available
  if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
    let geojson = null;
    try {
      const contents = await Filesystem.readFile({
        path: fileName,
        directory: Directory.Data,
      });
      geojson = JSON.parse(contents.data);
    } catch {
      // File doesn't exist or error reading, proceed to fetch
    }
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch geojson data");
      const freshObj = await response.json();
      if (!geojson || JSON.stringify(freshObj) !== JSON.stringify(geojson)) {
        await Filesystem.writeFile({
          path: fileName,
          data: JSON.stringify(freshObj),
          directory: Directory.Data,
        });
      }
      return freshObj;
    } catch (err) {
      if (geojson) return geojson;
      throw new Error("No data available");
    }
  }

  // 2. Fallback to browser localStorage
  const cacheKey = `GEOJSON_DATA_${url}`;
  let cached = null;
  if (typeof window !== "undefined" && window.localStorage) {
    cached = window.localStorage.getItem(cacheKey);
  }
  let cachedObj = null;
  if (cached) {
    try { cachedObj = JSON.parse(cached); } catch {}
  }
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch geojson data");
    const freshObj = await response.json();
    const freshStr = JSON.stringify(freshObj);
    if (typeof window !== "undefined" && window.localStorage && freshStr.length < 4.5 * 1024 * 1024) {
      try {
        window.localStorage.setItem(cacheKey, freshStr);
      } catch (err) {
        // Quota exceeded or other error, skip caching
        console.warn("GeoJSON too large for localStorage, skipping cache for", url);
      }
    }
    return freshObj;
  } catch (err) {
    if (cachedObj) return cachedObj;
    throw new Error("No data available");
  }
}