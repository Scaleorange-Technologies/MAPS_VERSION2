import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

let geojsonLinkMap = null;
const memoryDataCache = new Map();

const isCapacitor = typeof window !== "undefined" &&
  window.Capacitor &&
  window.Capacitor.isNativePlatform &&
  window.Capacitor.isNativePlatform();

const VERSION_MAP_URL = "https://raw.githubusercontent.com/Scaleorange-Technologies/MAPS_VERSION2/main/capacitor/custom_maps/public/geojsonLinks.json";

function toBase64(str) {
  if (typeof window !== "undefined" && window.btoa) {
    return btoa(str); // avoid unescape
  }
  return Buffer.from(str, 'utf-8').toString('base64');
}

function normalizeVersion(version) {
  if (!version) return null;
  return version.toString().replace(/=+$/, '').trim();
}

function isCorruptVersion(version) {
  if (!version) return true;
  const v = normalizeVersion(version);
  return (
    v.length > 10 || /[^a-zA-Z0-9.]/.test(v)
  );
}

export const preloadGeoJsonLinks = async () => {
  if (geojsonLinkMap) return;
  const res = await fetch(VERSION_MAP_URL);
  geojsonLinkMap = await res.json();
};

function getRemoteVersion(url) {
  function searchInObject(obj) {
    for (const key in obj) {
      const value = obj[key];
      if (typeof value === 'string' && key === url) return value;
      if (typeof value === 'object' && value !== null) {
        if (value.hasOwnProperty(url)) return value[url];
        const result = searchInObject(value);
        if (result) return result;
      }
    }
    return null;
  }
  return searchInObject(geojsonLinkMap);
}

export async function isGeoJsonCached(url) {
  if (!geojsonLinkMap) await preloadGeoJsonLinks();

  const remoteVersion = normalizeVersion(getRemoteVersion(url));
  if (!remoteVersion) return false;

  // Check memory cache first
  if (memoryDataCache.has(url)) {
    return true;
  }

  const fileKey = `geojson_${toBase64(url)}.json`;
  const versionKey = `geojson_version_${toBase64(url)}`;

  if (isCapacitor) {
    try {
      let storedVersionRaw = await Filesystem.readFile({
        path: versionKey,
        directory: Directory.Data,
        encoding: Encoding.UTF8
      }).then(res => {
        try {
          const parsed = JSON.parse(res.data);
          return parsed;
        } catch (err) {
          return res.data;
        }
      }).catch(() => null);

      const storedVersion = normalizeVersion(storedVersionRaw);
      
      if (isCorruptVersion(storedVersion) || storedVersion !== remoteVersion) {
        return false;
      }

      // Check if the actual data file exists
      try {
        await Filesystem.readFile({ path: fileKey, directory: Directory.Data, encoding: Encoding.UTF8 });
        return true;
      } catch {
        return false;
      }
    } catch {
      return false;
    }
  } else {
    try {
      let storedVersionRaw = (() => {
        try {
          return JSON.parse(localStorage.getItem(versionKey));
        } catch {
          return localStorage.getItem(versionKey);
        }
      })();

      const storedVersion = normalizeVersion(storedVersionRaw);
      
      if (isCorruptVersion(storedVersion) || storedVersion !== remoteVersion) {
        return false;
      }

      // Check if the actual data exists in localStorage
      const cached = localStorage.getItem(fileKey);
      return cached !== null;
    } catch {
      return false;
    }
  }
}

export async function getGeoJsonUniversalCache(url) {
  if (!geojsonLinkMap) await preloadGeoJsonLinks();

  const remoteVersion = normalizeVersion(getRemoteVersion(url));
  if (!remoteVersion) throw new Error("Version not found for: " + url);

  if (memoryDataCache.has(url)) {
    console.log("✅ Memory cache hit:", url);
    return { data: memoryDataCache.get(url), status: 'memory', wasCached: true,
      cacheType: 'memory' };
  }

  const fileKey = `geojson_${toBase64(url)}.json`;
  const versionKey = `geojson_version_${toBase64(url)}`;
  const readAndCache = async (data) => {
    memoryDataCache.set(url, data);
    return data;
  };

  if (isCapacitor) {
    try {
      let storedVersionRaw = await Filesystem.readFile({
        path: versionKey,
        directory: Directory.Data,
        encoding: Encoding.UTF8
      }).then(res => {
        console.log("✅ File read successfully:", res);
      
        try {
          const parsed = JSON.parse(res.data);
          console.log("📦 Parsed data:", parsed);
          return parsed;
        } catch (err) {
          console.warn("⚠️ JSON parsing failed, returning raw data:", res.data);
          return res.data;
        }
      
      }).catch((err) => {
        console.error("❌ Failed to read file:", err);
        return null;
      });
            
      const storedVersion = normalizeVersion(storedVersionRaw);
      console.log("storedVersion (normalized):", storedVersion);
      console.log("remoteVersion (normalized):", remoteVersion);

      if (isCorruptVersion(storedVersion) || storedVersion !== remoteVersion) {
        console.warn("⚠️ Invalid or mismatched version — cleaning...");
        await Filesystem.deleteFile({ path: versionKey, directory: Directory.Data }).catch(() => {});
        storedVersionRaw = null;
      }

      if (storedVersion === remoteVersion) {
        const file = await Filesystem.readFile({ path: fileKey, directory: Directory.Data,encoding: Encoding.UTF8 });
        const data = JSON.parse(file.data);
        await readAndCache(data);
        return { data, status: 'local', wasCached: true,
          cacheType: 'filesystem' };
      }

      // 🧠 Fetch from network and cache
      console.log("🌐 Fetching from network...");
      const res = await fetch(url);
      const data = await res.json();
      console.log("hdkhwedlkwej:",JSON.stringify(remoteVersion));
      await Filesystem.writeFile({ path: fileKey, data: JSON.stringify(data), directory: Directory.Data,  encoding: Encoding.UTF8});
      await Filesystem.writeFile({ path: versionKey, data: JSON.stringify(remoteVersion), directory: Directory.Data,  encoding: Encoding.UTF8}); // ✅ store as JSON

      await readAndCache(data);
      return { data, status: 'network', wasCached: false,
        cacheType: 'none' };
    } catch (err) {
      console.error("❌ Filesystem error:", err);
      throw new Error("Capacitor file fetch error");
    }
  } else {
    try {
      let storedVersionRaw = (() => {
        try {
          return JSON.parse(localStorage.getItem(versionKey));
        } catch {
          return localStorage.getItem(versionKey);
        }
      })();

      const storedVersion = normalizeVersion(storedVersionRaw);
      console.log("storedVersion (normalized):", storedVersion);
      console.log("remoteVersion (normalized):", remoteVersion);

      if (isCorruptVersion(storedVersion) || storedVersion !== remoteVersion) {
        console.warn("⚠️ Detected corrupt/mismatched version in localStorage");
        localStorage.removeItem(versionKey);
      }

      if (storedVersion === remoteVersion) {
        const cached = localStorage.getItem(fileKey);
        if (cached) {
          const data = JSON.parse(cached);
          await readAndCache(data);
          return { data, status: 'local',wasCached: true,
            cacheType: 'localStorage' };
        }
      }

      // 🧠 Fetch and store
      console.log("🌐 Fetching from network (version mismatch or no local):", url);
      const res = await fetch(url);
      const data = await res.json();
      const dataStr = JSON.stringify(data);

      if (dataStr.length < 4.5 * 1024 * 1024) {
        localStorage.setItem(fileKey, dataStr);
        localStorage.setItem(versionKey, JSON.stringify(remoteVersion)); // ✅ store as JSON
      } else {
        console.warn("⚠️ GeoJSON too large for localStorage:", url);
      }

      await readAndCache(data);
      return { data, status: 'network', wasCached: false,
        cacheType: 'none' };
    } catch (err) {
      console.error("❌ Local fetch error:", err);
      throw new Error("Web fetch error");
    }
  }
}


export const clearGeoJsonFilesystemCache = async () => {
  try {
    const dir = await Filesystem.readdir({ directory: Directory.Data });
    const filesToDelete = dir.files.filter(file =>
      file.name.startsWith('geojson_') || file.name.startsWith('geojson_version_')
    );

    for (const file of filesToDelete) {
      console.log("🗑 Deleting:", file.name);
      await Filesystem.deleteFile({ path: file.name, directory: Directory.Data }).catch(() => {});
    }

    console.log("✅ GeoJSON cache cleared from Filesystem.");
  } catch (err) {
    console.error("❌ Error clearing cache:", err);
  }
};