import { Filesystem, Directory } from '@capacitor/filesystem';

function toBase64(str) {
  if (typeof window !== "undefined" && window.btoa) {
    return btoa(unescape(encodeURIComponent(str)));
  }
  return Buffer.from(str, 'utf-8').toString('base64');
}

const VERSION_MAP_URL = "https://raw.githubusercontent.com/Scaleorange-Technologies/MAPS_VERSION2/main/capacitor/custom_maps/public/geojsonLinks.json";

const isCapacitor = typeof window !== "undefined" &&
  window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();

export async function getGeoJsonUniversalCache(url) {
  const fileKey = `geojson_${toBase64(url)}.json`;
  const versionKey = `geojson_version_${toBase64(url)}`;

  // ✅ Step 1: Get version from geojsonLinks.json
  let remoteVersion = null;
  try {
    const res = await fetch(VERSION_MAP_URL);
    const linksJson = await res.json();

    outer: for (const groupKey in linksJson) {
      const group = linksJson[groupKey];
      for (const label in group) {
        const obj = group[label];
        const foundUrl = Object.keys(obj)[0];
        if (foundUrl === url) {
          remoteVersion = obj[foundUrl];
          break outer;
        }
      }
    }
  } catch (err) {
    console.error("❌ Failed to load geojsonLinks.json:", err);
    throw new Error("Could not load version map.");
  }

  if (!remoteVersion) {
    throw new Error("Version info not found for: " + url);
  }

  // ✅ Step 2: Check stored version + data
  if (isCapacitor) {
    try {
      const storedVersion = await Filesystem.readFile({
        path: versionKey,
        directory: Directory.Data,
      }).then(res => res.data).catch(() => null);

      if (storedVersion === remoteVersion) {
        const file = await Filesystem.readFile({
          path: fileKey,
          directory: Directory.Data,
        });
        return JSON.parse(file.data);
      }

      // 🆕 Version mismatch or no data, fetch & cache
      const res = await fetch(url);
      const data = await res.json();

      await Filesystem.writeFile({
        path: fileKey,
        data: JSON.stringify(data),
        directory: Directory.Data,
      });
      await Filesystem.writeFile({
        path: versionKey,
        data: remoteVersion,
        directory: Directory.Data,
      });

      return data;
    } catch (err) {
      console.error("❌ Filesystem error:", err);
      throw new Error("Failed to load or cache file");
    }
  } else {
    try {
      const storedVersion = localStorage.getItem(versionKey);
      if (storedVersion === remoteVersion) {
        const cached = localStorage.getItem(fileKey);
        if (cached) return JSON.parse(cached);
      }

      // 🆕 Version mismatch or not cached
      const res = await fetch(url);
      const data = await res.json();

      const dataStr = JSON.stringify(data);
      if (dataStr.length < 4.5 * 1024 * 1024) {
        localStorage.setItem(fileKey, dataStr);
        localStorage.setItem(versionKey, remoteVersion);
      } else {
        console.warn("⚠️ Data too large for localStorage, skipping cache");
      }

      return data;
    } catch (err) {
      console.error("❌ Local cache error:", err);
      throw new Error("Failed to load or cache file");
    }
  }
}
