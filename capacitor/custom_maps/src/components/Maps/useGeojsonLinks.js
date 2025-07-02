// import { useState, useEffect } from "react";
// import { Preferences } from '@capacitor/preferences';

// const GEOJSON_LINKS_URL = "https://raw.githubusercontent.com/Scaleorange-Technologies/MAPS/main/capacitor/custom_maps/public/geojsonLinks.json";
// const CACHE_KEY = "geojsonLinksCache";

// function isObjectEqual(a, b) {
//   return JSON.stringify(a) === JSON.stringify(b);
// }

// export function useGeojsonLinks() {
//   const [links, setLinks] = useState({});
//   const [categories, setCategories] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   // Load from Capacitor Storage cache
//   const loadFromCache = async () => {
//     try {
//       const { value } = await Preferences.get({ key: CACHE_KEY });
//       if (value) {
//         const parsed = JSON.parse(value);
//         setLinks(parsed);
//         setCategories(Object.keys(parsed));
//         setLoading(false);
//       }
//     } catch (e) {
//       // ignore
//     }
//   };

//   useEffect(() => {
//     let isMounted = true;
//     setLoading(true);

//     // Step 1: Load cache immediately
//     loadFromCache();

//     // Step 2: Fetch from network in background
//     fetch(GEOJSON_LINKS_URL)
//       .then(res => {
//         if (!res.ok) throw new Error("Failed to fetch geojson links");
//         return res.json();
//       })
//       .then(async fetchedData => {
//         if (!isMounted) return;
//         // Compare with cache
//         const { value: cached } = await Preferences.get({ key: CACHE_KEY });
//         let updateNeeded = false;
//         if (!cached) {
//           updateNeeded = true;
//         } else {
//           try {
//             const cachedObj = JSON.parse(cached);
//             if (!isObjectEqual(cachedObj, fetchedData)) {
//               updateNeeded = true;
//             }
//           } catch {
//             updateNeeded = true;
//           }
//         }
//         if (updateNeeded) {
//           await Preferences.set({ key: CACHE_KEY, value: JSON.stringify(fetchedData) });
//           setLinks(fetchedData);
//           setCategories(Object.keys(fetchedData));
//         }
//         setLoading(false);
//       })
//       .catch(err => {
//         if (!isMounted) return;
//         setError("Could not fetch latest data. Showing cached data if available.");
//         setLoading(false);
//       });

//     return () => {
//       isMounted = false;
//     };
//   }, []);

//   return { links, categories, loading, error };
// }





// import { useState, useEffect } from "react";

// const GEOJSON_LINKS_URL = "https://raw.githubusercontent.com/Scaleorange-Technologies/MAPS/main/capacitor/custom_maps/public/geojsonLinks.json";
// const CACHE_KEY = "geojsonLinksCache";

// // Utility: deep equality check
// function isObjectEqual(a, b) {
//   return JSON.stringify(a) === JSON.stringify(b);
// }

// // Platform-agnostic storage helpers
// const storage = {
//   async get(key) {
//     if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences) {
//       const { value } = await window.Capacitor.Plugins.Preferences.get({ key });
//       return value;
//     } else if (window.localStorage) {
//       return window.localStorage.getItem(key);
//     } else {
//       return null;
//     }
//   },
//   async set(key, value) {
//     if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences) {
//       await window.Capacitor.Plugins.Preferences.set({ key, value });
//     } else if (window.localStorage) {
//       window.localStorage.setItem(key, value);
//     }
//   }
// };

// export function useGeojsonLinks() {
//   const [links, setLinks] = useState({});
//   const [categories, setCategories] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   // Load from cache
//   const loadFromCache = async () => {
//     try {
//       const value = await storage.get(CACHE_KEY);
//       if (value) {
//         const parsed = JSON.parse(value);
//         setLinks(parsed);
//         setCategories(Object.keys(parsed));
//         setLoading(false);
//       }
//     } catch (e) {
//       // ignore
//     }
//   };

//   useEffect(() => {
//     let isMounted = true;
//     setLoading(true);

//     // Step 1: Load from cache immediately
//     loadFromCache();

//     // Step 2: Fetch from network
//     fetch(GEOJSON_LINKS_URL)
//       .then(res => {
//         if (!res.ok) throw new Error("Failed to fetch geojson links");
//         return res.json();
//       })
//       .then(async fetchedData => {
//         if (!isMounted) return;
//         // Compare with cache
//         const cached = await storage.get(CACHE_KEY);
//         let updateNeeded = false;
//         if (!cached) {
//           updateNeeded = true;
//         } else {
//           try {
//             const cachedObj = JSON.parse(cached);
//             if (!isObjectEqual(cachedObj, fetchedData)) {
//               updateNeeded = true;
//             }
//           } catch {
//             updateNeeded = true;
//           }
//         }
//         if (updateNeeded) {
//           await storage.set(CACHE_KEY, JSON.stringify(fetchedData));
//           setLinks(fetchedData);
//           setCategories(Object.keys(fetchedData));
//         }
//         setLoading(false);
//       })
//       .catch(err => {
//         if (!isMounted) return;
//         setError("Could not fetch latest data. Showing cached data if available.");
//         setLoading(false);
//       });

//     return () => {
//       isMounted = false;
//     };
//   }, []);

//   return { links, categories, loading, error };
// }






import { useState, useEffect } from "react";

const GEOJSON_LINKS_URL = "https://raw.githubusercontent.com/Scaleorange-Technologies/MAPS/main/capacitor/custom_maps/public/geojsonLinks.json";
const CACHE_KEY = "geojsonLinksCache";

// Deep equality check
function isObjectEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

// Storage abstraction: Capacitor Preferences if present, else localStorage
const storage = {
  async get(key) {
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences) {
      const { value } = await window.Capacitor.Plugins.Preferences.get({ key });
      return value;
    } else if (window.localStorage) {
      return window.localStorage.getItem(key);
    } else {
      return null;
    }
  },
  async set(key, value) {
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences) {
      await window.Capacitor.Plugins.Preferences.set({ key, value });
    } else if (window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  }
};

export function useGeojsonLinks() {
  const [links, setLinks] = useState({});
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    // Always fetch from network first (to ensure fresh data)
    fetch(GEOJSON_LINKS_URL)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch geojson links");
        return res.json();
      })
      .then(async fetchedData => {
        if (!isMounted) return;
        // Compare with cache
        const cached = await storage.get(CACHE_KEY);
        let updateNeeded = false;
        if (!cached) {
          updateNeeded = true;
        } else {
          try {
            const cachedObj = JSON.parse(cached);
            if (!isObjectEqual(cachedObj, fetchedData)) {
              updateNeeded = true;
            }
          } catch {
            updateNeeded = true;
          }
        }
        if (updateNeeded) {
          await storage.set(CACHE_KEY, JSON.stringify(fetchedData));
        }
        // Always use the latest fetched data
        setLinks(fetchedData);
        setCategories(Object.keys(fetchedData));
        setLoading(false);
      })
      .catch(async err => {
        // If fetch fails, try cache
        const cached = await storage.get(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          setLinks(parsed);
          setCategories(Object.keys(parsed));
          setError("Could not fetch latest data. Showing cached data.");
        } else {
          setError("Could not fetch data and no cache found.");
        }
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { links, categories, loading, error };
}