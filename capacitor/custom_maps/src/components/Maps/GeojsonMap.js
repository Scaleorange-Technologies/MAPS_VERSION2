// import React, { useEffect, useState, useRef } from 'react';
// import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
// import 'leaflet/dist/leaflet.css';
// import L from 'leaflet';
// import { App } from '@capacitor/app';
// import { preloadGeoJsonLinks,getGeoJsonUniversalCache } from '../../utils/GeoJsonCacheManager';
// const GEOJSON_LINKS_URL = "https://raw.githubusercontent.com/Scaleorange-Technologies/MAPS_VERSION2/main/capacitor/custom_maps/public/geojsonLinks.json";
// const CACHE_KEY = "geojsonLinksCache";

// // Custom icon for user location
// const userLocationIcon = new L.Icon({
//     iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
//     iconSize: [32, 32],
//     iconAnchor: [16, 32],
//     popupAnchor: [0, -30],
// });

// // Custom icon for shared location
// const sharedLocationIcon = new L.Icon({
//     iconUrl: 'https://cdn-icons-png.flaticon.com/512/3177/3177361.png',
//     iconSize: [36, 36],
//     iconAnchor: [18, 36],
//     popupAnchor: [0, -34],
// });

// if (typeof window !== "undefined" && !window._externalLocationHandlerSet) {
//     window._externalLocationHandlerSet = true;
//     window.handleExternalLocation = (lat, lng) => {
//         window.dispatchEvent(new CustomEvent("externalLocation", { detail: { lat, lng } }));
//     };
// }

// const LocationMarker = ({ position, isShared = false }) => {
//     const map = useMap();
//     useEffect(() => {
//         if (position) {
//             map.setView(position, 12);
//         }
//     }, [position, map]);
//     return position ? (
//         <Marker position={position} icon={isShared ? sharedLocationIcon : userLocationIcon}>
//             <Popup>
//                 {isShared ? 'Shared Location' : 'Your Current Location'}
//                 <br />
//                 Lat: {position[0].toFixed(6)}, Lng: {position[1].toFixed(6)}
//             </Popup>
//         </Marker>
//     ) : null;
// };

// const GeoJSONUpdater = ({ data }) => {
//     const map = useMap();
//     useEffect(() => {
//         if (data && data.features && data.features.length > 0) {
//             const geoJsonLayer = L.geoJSON(data);
//             map.fitBounds(geoJsonLayer.getBounds());
//         }
//     }, [data, map]);
//     return null;
// };

// export default function IndiaMapExplorer() {
//     const [links, setLinks] = useState({});
//     const [categories, setCategories] = useState([]);
//     const [selectedCategory, setSelectedCategory] = useState(null);
//     const [selectedState, setSelectedState] = useState(null);
//     const [selectedLayer, setSelectedLayer] = useState(null);
//     const [geojsonData, setGeojsonData] = useState(null);
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState(null);
//     const [selectedLabel, setSelectedLabel] = useState('');
//     const [userLocation, setUserLocation] = useState(null);
//     const [currentState, setCurrentState] = useState('');
//     const [sidebarOpen, setSidebarOpen] = useState(false);
//     const [locationLoading, setLocationLoading] = useState(false);
//     const [watchId, setWatchId] = useState(null);
//     const [isLocationWatching, setIsLocationWatching] = useState(false);
//     const [locationAccuracy, setLocationAccuracy] = useState(null);
//     const [sharedLocation, setSharedLocation] = useState(null);
//     const [isLocationShared, setIsLocationShared] = useState(false);
//     const [shareDisabled, setShareDisabled] = useState(true);
//     const mapRef = useRef(null);
//     const sidebarRef = useRef(null);


//     useEffect(() => {
//         // ✅ Preload geojsonLinks.json on mount
//         preloadGeoJsonLinks();
//       }, []);

//     useEffect(() => {
//         const fetchGeoJsonLinks = async () => {
//             try {
//                 const response = await fetch(GEOJSON_LINKS_URL);
//                 if (!response.ok) {
//                     throw new Error('Network response was not ok');
//                 }
//                 const data = await response.json();
//                 console.log('Fetched GeoJSON links:', data);
//             } catch (error) {
//                 console.error('Error fetching GeoJSON links:', error);
//             }
//         };

//         fetchGeoJsonLinks();
//     }, []);


//     useEffect(() => {
//         let isMounted = true;
//         setLoading(true);
//         setError(null);

//         // 1. Synchronously load from localStorage for fastest display
//         let localCache = null;
//         if (typeof window !== "undefined" && window.localStorage) {
//             try {
//                 localCache = window.localStorage.getItem(CACHE_KEY);
//                 if (localCache) {
//                     const cacheObj = JSON.parse(localCache);
//                     setLinks(cacheObj);
//                     setCategories(Object.keys(cacheObj));
//                     setLoading(false);
//                 }
//             } catch { }
//         }

//         // 2. In background: fetch from Capacitor Preferences (if available) and then from network
//         (async () => {
//             // Capacitor Preferences cache check (might be newer than localStorage)
//             let capCache = null;
//             if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences) {
//                 try {
//                     const { value } = await window.Capacitor.Plugins.Preferences.get({ key: CACHE_KEY });
//                     capCache = value;
//                     if (capCache && capCache !== localCache && isMounted) {
//                         const capObj = JSON.parse(capCache);
//                         setLinks(capObj);
//                         setCategories(Object.keys(capObj));
//                         setLoading(false);
//                         window.localStorage.setItem(CACHE_KEY, capCache);
//                     }
//                 } catch { }
//             }

//             // 3. Always fetch from network in background
//             fetch(GEOJSON_LINKS_URL)
//                 .then(res => {
//                     if (!res.ok) throw new Error("Failed to fetch geojson links");
//                     return res.json();
//                 })
//                 .then(async fetchedData => {
//                     if (!isMounted) return;
//                     const fetchedStr = JSON.stringify(fetchedData);
//                     if (fetchedStr !== localCache && fetchedStr !== capCache) {
//                         setLinks(fetchedData);
//                         setCategories(Object.keys(fetchedData));
//                         setLoading(false);
//                         window.localStorage.setItem(CACHE_KEY, fetchedStr);
//                         if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences) {
//                             await window.Capacitor.Plugins.Preferences.set({ key: CACHE_KEY, value: fetchedStr });
//                         }
//                     }
//                 })
//                 .catch(() => {
//                     if (!localCache && !capCache && isMounted) {
//                         setError("Could not fetch data and no cache found.");
//                         setLoading(false);
//                     }
//                 });
//         })();

//         return () => {
//             isMounted = false;
//         };
//     }, []);

//     useEffect(() => {
//         function onExternalLocation(e) {
//             const { lat, lng } = e.detail;
//             setUserLocation([lat, lng]);
//             setLocationAccuracy(null);
//             setError(null);
//             setSidebarOpen(false);
//             if (mapRef.current && mapRef.current.setView) {
//                 mapRef.current.setView([lat, lng], 16);
//             }
//         }
//         window.addEventListener("externalLocation", onExternalLocation);
//         return () => window.removeEventListener("externalLocation", onExternalLocation);
//     }, []);

//     useEffect(() => {
//         if (selectedCategory) {
//             setSelectedState(null);
//             setSelectedLayer(null);
//             setGeojsonData(null);
//             setSelectedLabel('');
//         }
//     }, [selectedCategory]);


//     // --- THIS is the key part: use Filesystem cache for GeoJSON ---

//     useEffect(() => {
//         if (!selectedCategory || !links[selectedCategory]) return;
//         if (selectedCategory === 'STATES' && !selectedState) return;
//         if (!selectedLayer) return;

//         let url;
//         if (selectedCategory === 'STATES') {
//           if (!links[selectedCategory][selectedState]) return;
//           const obj = links[selectedCategory][selectedState][selectedLayer];
//           url = obj ? Object.keys(obj)[0] : null;
//         } else {
//           const obj = links[selectedCategory][selectedLayer];
//           url = obj ? Object.keys(obj)[0] : null;
//         }

//         if (!url) {
//           setError(`No URL found for the selected options`);
//           return;
//         }

//         setLoading(true);
//         setError(null);

//         let isMounted = true;
//         getGeoJsonUniversalCache(url)
//           .then(data => {
//             if (!isMounted) return;
//             setGeojsonData(data);
//             setSelectedLabel(selectedState ? `${selectedState} - ${selectedLayer}` : selectedLayer);
//             setLoading(false);
//           })
//           .catch(err => {
//             if (!isMounted) return;
//             setError(`Failed to load map data: ${err.message}`);
//             setLoading(false);
//             setGeojsonData(null);
//           });

//         return () => { isMounted = false; };
//       }, [selectedCategory, selectedState, selectedLayer, links]);

//     // Handle clicks outside sidebar to close it
//     useEffect(() => {
//         function handleClickOutside(event) {
//             if (sidebarRef.current && !sidebarRef.current.contains(event.target) &&
//                 !event.target.closest('.sidebar-toggle-btn')) {
//                 setSidebarOpen(false);
//             }
//         }

//         document.addEventListener("mousedown", handleClickOutside);
//         return () => {
//             document.removeEventListener("mousedown", handleClickOutside);
//         };
//     }, []);

//     // Cleanup watch location on unmount
//     useEffect(() => {
//         return () => {
//             stopWatchingLocation();
//         };
//     }, []);

//     useEffect(() => {
//         let backButtonListener = null;

//         const setupBackButton = async () => {
//             try {
//                 backButtonListener = await App.addListener('backButton', () => {
//                     App.exitApp();
//                 });
//             } catch (error) {
//                 console.log('Back button setup error:', error);
//             }
//         };

//         setupBackButton();

//         // Cleanup function
//         return () => {
//             if (backButtonListener) {
//                 backButtonListener.remove();
//             }
//         };
//     }, []);

//     useEffect(() => {
//         // Automatically get location when the app loads
//         handleGetLocation();
//         // eslint-disable-next-line
//     }, []); // Empty dependency array means this runs only once on mount

//     // Get user's current location (optimized for Capacitor)
//     const handleGetLocation = () => {
//         setLocationLoading(true);
//         setError(null);
//         setShareDisabled(true);

//         // First check if running in Capacitor
//         if (window.Capacitor && window.Capacitor.isNativePlatform()) {
//             getCapacitorLocation();
//         } else {
//             // Fallback to browser geolocation
//             getBrowserLocation();
//         }
//     };

//     // Get location using Capacitor Geolocation plugin
//     const getCapacitorLocation = async () => {
//         try {
//             // Make sure to import Geolocation correctly
//             const { Geolocation } = window.Capacitor.Plugins;

//             const position = await Geolocation.getCurrentPosition({
//                 enableHighAccuracy: false,
//                 timeout: 10000,
//                 maximumAge: 0
//             });

//             const { latitude, longitude, accuracy } = position.coords;
//             setUserLocation([latitude, longitude]);
//             setLocationAccuracy(accuracy);
//             setLocationLoading(false);
//             setShareDisabled(false);

//             // Here you would normally perform reverse geocoding
//             // For now we'll use a placeholder value
//             determineCurrentState([latitude, longitude]);

//         } catch (err) {
//             console.error('Capacitor Geolocation error:', err);
//             setError(`Location access error: ${err.message}`);
//             setLocationLoading(false);

//             // Fall back to browser geolocation if Capacitor fails
//             getBrowserLocation();
//         }
//     };

//     // Get location using browser geolocation API
//     const getBrowserLocation = () => {
//         if (!navigator.geolocation) {
//             setError('Geolocation is not supported by your browser');
//             setLocationLoading(false);
//             return;
//         }

//         navigator.geolocation.getCurrentPosition(
//             position => {
//                 const { latitude, longitude, accuracy } = position.coords;
//                 setUserLocation([latitude, longitude]);
//                 setLocationAccuracy(accuracy);
//                 setLocationLoading(false);
//                 setShareDisabled(false);

//                 // Determine the state based on coordinates
//                 determineCurrentState([latitude, longitude]);
//             },
//             err => {
//                 console.error('Browser Geolocation error:', err);
//                 setError(`Location access error: ${err.message}`);
//                 setLocationLoading(false);
//             },
//             {
//                 enableHighAccuracy: false,
//                 timeout: 10000,
//                 maximumAge: 0
//             }
//         );
//     };

//     // Start watching location
//     const startWatchingLocation = () => {
//         setError(null);
//         setIsLocationWatching(true);

//         if (window.Capacitor && window.Capacitor.isNativePlatform()) {
//             watchLocationCapacitor();
//         } else {
//             watchLocationBrowser();
//         }
//     };

//     // Watch location using Capacitor
//     const watchLocationCapacitor = async () => {
//         try {
//             const { Geolocation } = window.Capacitor.Plugins;

//             const id = await Geolocation.watchPosition(
//                 { enableHighAccuracy: false, timeout: 10000 },
//                 { timeout: 10000 },

//                 position => {
//                     const { latitude, longitude, accuracy } = position.coords;
//                     setUserLocation([latitude, longitude]);
//                     setLocationAccuracy(accuracy);
//                     setShareDisabled(false);
//                     determineCurrentState([latitude, longitude]);
//                 }
//             );

//             setWatchId(id);
//         } catch (err) {
//             console.error('Capacitor watch location error:', err);
//             setError(`Watch location error: ${err.message}`);
//             setIsLocationWatching(false);

//             // Fall back to browser
//             watchLocationBrowser();
//         }
//     };

//     // Watch location using browser API
//     const watchLocationBrowser = () => {
//         if (!navigator.geolocation) {
//             setError('Geolocation is not supported by your browser');
//             setIsLocationWatching(false);
//             return;
//         }

//         const id = navigator.geolocation.watchPosition(
//             position => {
//                 const { latitude, longitude, accuracy } = position.coords;
//                 setUserLocation([latitude, longitude]);
//                 setLocationAccuracy(accuracy);
//                 setShareDisabled(false);
//                 determineCurrentState([latitude, longitude]);
//             },
//             err => {
//                 console.error('Browser watch location error:', err);
//                 setError(`Watch location error: ${err.message}`);
//                 setIsLocationWatching(false);
//             },
//             {
//                 enableHighAccuracy: false,
//                 timeout: 30000,
//                 maximumAge: 5000
//             }
//         );

//         setWatchId(id);
//     };

//     // Stop watching location
//     const stopWatchingLocation = () => {
//         if (watchId !== null) {
//             if (window.Capacitor && window.Capacitor.isNativePlatform()) {
//                 try {
//                     const { Geolocation } = window.Capacitor.Plugins;
//                     Geolocation.clearWatch({ id: watchId });
//                 } catch (err) {
//                     console.error('Error clearing Capacitor watch:', err);
//                 }
//             } else if (navigator.geolocation) {
//                 navigator.geolocation.clearWatch(watchId);
//             }

//             setWatchId(null);
//             setIsLocationWatching(false);
//         }
//     };

//     // Share location
//     const shareLocation = async () => {
//         if (!userLocation) return;

//         setSharedLocation(userLocation);
//         setIsLocationShared(true);

//         // If on a Capacitor app, use native share functionality
//         if (window.Capacitor && window.Capacitor.isNativePlatform()) {
//             try {
//                 const { Share } = window.Capacitor.Plugins;

//                 await Share.share({
//                     title: 'Share My Location',
//                     text: `Check out my location! Latitude: ${userLocation[0].toFixed(6)}, Longitude: ${userLocation[1].toFixed(6)}`,
//                     url: `https://www.google.com/maps/search/?api=1&query=${userLocation[0]},${userLocation[1]}`,
//                     dialogTitle: 'Share your location'
//                 });
//             } catch (err) {
//                 console.error('Error sharing via Capacitor:', err);
//                 setError(`Failed to share location: ${err.message}`);
//             }
//         } else if (navigator.share) {
//             // Use Web Share API if available
//             try {
//                 await navigator.share({
//                     title: 'Share My Location',
//                     text: `Check out my location! Latitude: ${userLocation[0].toFixed(6)}, Longitude: ${userLocation[1].toFixed(6)}`,
//                     url: `https://www.google.com/maps/search/?api=1&query=${userLocation[0]},${userLocation[1]}`
//                 });
//             } catch (err) {
//                 if (err.name !== 'AbortError') {
//                     console.error('Error sharing via Web Share API:', err);
//                     setError(`Failed to share location: ${err.message}`);
//                 }
//             }
//         } else {
//             // Fallback for browsers that don't support sharing
//             // Copy location to clipboard
//             try {
//                 const locationText = `https://www.google.com/maps/search/?api=1&query=${userLocation[0]},${userLocation[1]}`;
//                 await navigator.clipboard.writeText(locationText);
//                 alert('Location link copied to clipboard');
//             } catch (err) {
//                 console.error('Error copying to clipboard:', err);
//                 setError('Could not copy location to clipboard');
//             }
//         }
//     };

//     // Determine the current state based on coordinates (would normally use reverse geocoding)
//     const determineCurrentState = (coordinates) => {
//         setCurrentState('');
//     };

//     // Handle category selection
//     const handleCategorySelect = (category) => {
//         if (category === selectedCategory) {
//             setSelectedCategory(null);
//         } else {
//             // When selecting a new category, clear previous state
//             setSelectedCategory(category);
//             setSelectedState(null);
//             setSelectedLayer(null);
//             setGeojsonData(null);
//             setSelectedLabel('');
//         }
//     };

//     // Handle state selection
//     const handleStateSelect = (state) => {
//         if (state === selectedState) {
//             setSelectedState(null);
//             setSelectedLayer(null);
//             setGeojsonData(null);
//             setSelectedLabel('');
//         } else {
//             setSelectedState(state);
//             setSelectedLayer(null);
//             setGeojsonData(null);
//             setSelectedLabel('');
//         }
//     };

//     // Handle layer selection
//     const handleLayerSelect = (layer) => {
//         setSelectedLayer(layer);
//     };

//     // On map feature click
// const onEachFeature = (feature, layer) => {
//     if (feature.properties) {
//         const popupContent = Object.entries(feature.properties)
//             .filter(([key]) => key !== 'shape_area' && key !== 'shape_length')
//             .map(([key, value]) => `<strong>${key}:</strong> ${value}`)
//             .join('<br>');

//         layer.bindPopup(popupContent);
//     }
// };

//     return (
//         <div style={{ display: 'flex', height: '100vh', width: '100vw', position: 'relative' }}>
//             {/* Sidebar Toggle Button */}
//             <button
//                 className="sidebar-toggle-btn"
//                 onClick={() => setSidebarOpen(!sidebarOpen)}
//                 style={{
//                     position: 'absolute',
//                     left: '20px',
//                     top: '20px',
//                     zIndex: 1000,
//                     borderRadius: '8px',
//                     padding: '10px 12px',
//                     backgroundColor: 'white',
//                     border: 'none',
//                     boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
//                     cursor: 'pointer',
//                     display: 'flex',
//                     alignItems: 'center',
//                     justifyContent: 'center',
//                     fontSize: '16px',
//                     transition: 'all 0.3s'
//                 }}
//             >
//                 {sidebarOpen ? '✕' : '≡'}
//             </button>

//             {/* Location Control Buttons */}
//             <div style={{
//                 position: 'absolute',
//                 right: '20px',
//                 top: '20px',
//                 zIndex: 1000,
//                 display: 'flex',
//                 flexDirection: 'column',
//                 gap: '8px'
//             }}>
//                 <button
//                     onClick={isLocationWatching ? stopWatchingLocation : handleGetLocation}
//                     disabled={locationLoading}
//                     style={{
//                         padding: '10px 15px',
//                         backgroundColor: isLocationWatching ? '#e91e63' : locationLoading ? '#a5d6a7' : '#4CAF50',
//                         color: 'white',
//                         border: 'none',
//                         borderRadius: '6px',
//                         cursor: locationLoading ? 'default' : 'pointer',
//                         fontWeight: 'bold',
//                         display: 'flex',
//                         alignItems: 'center',
//                         justifyContent: 'center',
//                         boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
//                         transition: 'all 0.2s ease'
//                     }}
//                 >
//                     <span style={{ marginRight: '5px' }}>
//                         {isLocationWatching ? '⏹️' : locationLoading ? '⏳' : '📍'}
//                     </span>
//                     {isLocationWatching ? 'Stop Tracking' : locationLoading ? 'Getting Location...' : 'Get My Location'}
//                 </button>

//                 {!isLocationWatching && userLocation && (
//                     <button
//                         onClick={startWatchingLocation}
//                         style={{
//                             padding: '10px 15px',
//                             backgroundColor: '#2196F3',
//                             color: 'white',
//                             border: 'none',
//                             borderRadius: '6px',
//                             cursor: 'pointer',
//                             fontWeight: 'bold',
//                             display: 'flex',
//                             alignItems: 'center',
//                             justifyContent: 'center',
//                             boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
//                             transition: 'all 0.2s ease'
//                         }}
//                     >
//                         <span style={{ marginRight: '5px' }}>🔄</span>
//                         Track Location
//                     </button>
//                 )}

//                 <button
//                     onClick={shareLocation}
//                     disabled={shareDisabled}
//                     style={{
//                         padding: '10px 15px',
//                         backgroundColor: shareDisabled ? '#cccccc' : '#9C27B0',
//                         color: 'white',
//                         border: 'none',
//                         borderRadius: '6px',
//                         cursor: shareDisabled ? 'default' : 'pointer',
//                         fontWeight: 'bold',
//                         display: 'flex',
//                         alignItems: 'center',
//                         justifyContent: 'center',
//                         boxShadow: shareDisabled ? 'none' : '0 2px 6px rgba(0,0,0,0.3)',
//                         transition: 'all 0.2s ease',
//                         opacity: shareDisabled ? 0.7 : 1
//                     }}
//                 >
//                     <span style={{ marginRight: '5px' }}>🔗</span>
//                     Share Location
//                 </button>
//             </div>

//             {/* Sidebar */}
//             <div
//                 ref={sidebarRef}
//                 style={{
//                     width: '300px',
//                     height: '100vh',
//                     overflowY: 'auto',
//                     borderRight: '1px solid #ccc',
//                     padding: '15px',
//                     background: 'white',
//                     boxShadow: '2px 0 10px rgba(0,0,0,0.2)',
//                     position: 'absolute',
//                     zIndex: 999,
//                     left: sidebarOpen ? '0' : '-300px',
//                     transition: 'left 0.3s ease-in-out',
//                 }}
//             >
//                 <h2 style={{ margin: '30px 0 20px 0', color: '#333', textAlign: 'center' }}>India Map Explorer</h2>

//                 {error && (
//                     <div style={{
//                         padding: '12px',
//                         marginBottom: '15px',
//                         backgroundColor: '#ffebee',
//                         color: '#c62828',
//                         borderRadius: '6px',
//                         fontSize: '14px',
//                         boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
//                     }}>
//                         {error}
//                     </div>
//                 )}

//                 {/* Location Info Panel */}
//                 {userLocation && (
//                     <div style={{
//                         padding: '12px',
//                         marginBottom: '15px',
//                         backgroundColor: '#e8f5e9',
//                         borderRadius: '6px',
//                         fontSize: '14px',
//                         boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
//                     }}>
//                         <h4 style={{ margin: '0 0 8px 0', color: '#2e7d32' }}>Your Location</h4>
//                         <div style={{ marginBottom: '4px' }}>
//                             <strong>Latitude:</strong> {userLocation[0].toFixed(6)}
//                         </div>
//                         <div style={{ marginBottom: '4px' }}>
//                             <strong>Longitude:</strong> {userLocation[1].toFixed(6)}
//                         </div>
//                         {locationAccuracy && (
//                             <div style={{ marginBottom: '4px' }}>
//                                 <strong>Accuracy:</strong> ±{locationAccuracy.toFixed(1)} meters
//                             </div>
//                         )}
//                         {currentState && (
//                             <div style={{ marginBottom: '4px' }}>
//                                 <strong>State:</strong> {currentState}
//                             </div>
//                         )}
//                         <div style={{ marginTop: '8px', fontSize: '13px', color: '#4caf50' }}>
//                             {isLocationWatching ? '📡 Live tracking active' : '📍 Location captured'}
//                         </div>
//                     </div>
//                 )}

//                 <div style={{ marginBottom: '20px' }}>
//                     <h3 style={{ margin: '0 0 15px 0', color: '#444', borderBottom: '2px solid #eee', paddingBottom: '8px' }}>Map Layers</h3>
//                     {categories.map(category => (
//                         <div key={category} style={{ marginBottom: '12px' }}>
//                             <div
//                                 onClick={() => handleCategorySelect(category)}
//                                 style={{
//                                     cursor: 'pointer',
//                                     fontWeight: 'bold',
//                                     padding: '10px 12px',
//                                     backgroundColor: selectedCategory === category ? '#e8f4fd' : '#f5f5f5',
//                                     color: selectedCategory === category ? '#0277bd' : '#555',
//                                     borderRadius: '6px',
//                                     display: 'flex',
//                                     justifyContent: 'space-between',
//                                     alignItems: 'center',
//                                     boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
//                                     transition: 'all 0.2s ease'
//                                 }}
//                             >
//                                 <span>{category}</span>
//                                 <span>{selectedCategory === category ? '▼' : '▶'}</span>
//                             </div>

//                             {selectedCategory === category && (
//                                 <div style={{
//                                     marginTop: '8px',
//                                     paddingLeft: '12px',
//                                     borderLeft: '2px solid #e0e0e0',
//                                     marginLeft: '5px'
//                                 }}>
//                                     {category === 'STATES' ? (
//                                         // For States, show list of states first
//                                         Object.keys(links[category] || {}).map(state => (
//                                             <div key={state} style={{ marginBottom: '10px' }}>
//                                                 <div
//                                                     onClick={() => handleStateSelect(state)}
//                                                     style={{
//                                                         cursor: 'pointer',
//                                                         backgroundColor: selectedState === state ? '#e1f5fe' : '#f9f9f9',
//                                                         color: selectedState === state ? '#0288d1' : '#666',
//                                                         padding: '8px 12px',
//                                                         borderRadius: '5px',
//                                                         display: 'flex',
//                                                         justifyContent: 'space-between',
//                                                         alignItems: 'center',
//                                                         transition: 'all 0.2s ease',
//                                                         boxShadow: selectedState === state ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
//                                                     }}
//                                                 >
//                                                     <span>{state}</span>
//                                                     {selectedState === state && <span>▼</span>}
//                                                 </div>

//                                                 {selectedState === state && (
//                                                     <div style={{
//                                                         paddingLeft: '12px',
//                                                         marginTop: '6px',
//                                                         borderLeft: '1px solid #e0e0e0',
//                                                         marginLeft: '5px'
//                                                     }}>
//                                                         {Object.keys(links[category][state] || {}).map(layer => (
//                                                             <div
//                                                                 key={layer}
//                                                                 onClick={() => handleLayerSelect(layer)}
//                                                                 style={{
//                                                                     cursor: 'pointer',
//                                                                     backgroundColor: selectedLayer === layer ? '#b3e5fc' : 'transparent',
//                                                                     color: selectedLayer === layer ? '#01579b' : '#777',
//                                                                     padding: '6px 12px',
//                                                                     borderRadius: '4px',
//                                                                     marginTop: '4px',
//                                                                     transition: 'all 0.2s ease',
//                                                                     fontWeight: selectedLayer === layer ? '500' : 'normal'
//                                                                 }}
//                                                             >
//                                                                 {layer}
//                                                             </div>
//                                                         ))}
//                                                     </div>
//                                                 )}
//                                             </div>
//                                         ))
//                                     ) : (
//                                         // For other categories, just show the layers
//                                         Object.keys(links[category] || {}).map(layer => (
//                                             <div
//                                                 key={layer}
//                                                 onClick={() => handleLayerSelect(layer)}
//                                                 style={{
//                                                     cursor: 'pointer',
//                                                     backgroundColor: selectedLayer === layer ? '#e1f5fe' : 'transparent',
//                                                     color: selectedLayer === layer ? '#0288d1' : '#666',
//                                                     padding: '8px 12px',
//                                                     borderRadius: '5px',
//                                                     marginTop: '6px',
//                                                     transition: 'all 0.2s ease',
//                                                     fontWeight: selectedLayer === layer ? '500' : 'normal'
//                                                 }}
//                                             >
//                                                 {layer}
//                                             </div>
//                                         ))
//                                     )}
//                                 </div>
//                             )}
//                         </div>
//                     ))}
//                 </div>
//                 <div style={{
//                     fontSize: '14px',
//                     color: '#666',
//                     backgroundColor: '#f9f9f9',
//                     padding: '12px',
//                     borderRadius: '6px',
//                     border: '1px dashed #ddd'
//                 }}>
//                     <h4 style={{ margin: '0 0 8px 0', color: '#555' }}>Instructions:</h4>
//                     <ul style={{ paddingLeft: '20px', margin: '0' }}>
//                         <li>Select a category from the list</li>
//                         <li>For states, select a state then a boundary type</li>
//                         <li>Click on any region for more details</li>
//                         <li>Use "Get My Location" to see your position</li>
//                         <li>Enable "Track Location" for live updates</li>
//                         <li>Share your location with the share button</li>
//                     </ul>
//                 </div>
//             </div>

//             {/* Map Area */}
//             <div style={{ flex: 1, height: '100%', width: '100%', position: 'relative' }}>
//                 <MapContainer
//                     center={[22.9734, 78.6569]} // Center of India
//                     zoom={5}
//                     style={{ height: '100%', width: '100%' }}
//                     whenCreated={mapInstance => mapRef.current = mapInstance}
//                     zoomControl={false} // Disable default zoom controls
//                 >
//                     <ZoomControl position="bottomright" /> {/* Place zoom controls at bottom right */}

//                     <TileLayer
//                         url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//                         attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//                     />
//                     {geojsonData && (
//                         <GeoJSON
//                             key={selectedLabel} // Add key to force re-render when selection changes
//                             data={geojsonData}

//                             style={() => ({
//                                 fillColor: selectedCategory === 'STATES'
//                                     ? 'rgba(33, 150, 243, 0.3)' // blue with 30% opacity
//                                     : selectedCategory === 'DISTRICTS'
//                                         ? 'rgba(76, 175, 80, 0.3)' // green with 30% opacity
//                                         : selectedCategory === 'ASSEMBLY_CONSTITUENCIES'
//                                             ? 'rgba(156, 39, 176, 0.3)' // purple with 30% opacity
//                                             : 'rgba(255, 152, 0, 0.3)', // orange with 30% opacity
//                                 weight: 2,
//                                 opacity: 1,
//                                 color: '#333',
//                                 dashArray: '3',
//                                 fillOpacity: 0.4 // You can keep this for additional control, or set to 1
//                             })}
//                             onEachFeature={onEachFeature}
//                             pointToLayer={(feature, latlng) =>
//                                 L.circleMarker(latlng, {
//                                     radius: 8,
//                                     // fillColor: "#ff5722",
//                                     fillColor: "rgba(255, 87, 34, 0.5)", // orange with 50% opacity
//                                     color: "#fff",
//                                     weight: 1,
//                                     opacity: 1,
//                                     fillOpacity: 0.8
//                                 }).bindPopup(
//                                     Object.entries(feature.properties)
//                                         .filter(([key]) => key !== 'shape_area' && key !== 'shape_length')
//                                         .map(([key, value]) => `<strong>${key}:</strong> ${value}`)
//                                         .join('<br>')
//                                 )
//                             }
//                         />
//                     )}
//                     {userLocation && <LocationMarker position={userLocation} />}
//                     {sharedLocation && sharedLocation !== userLocation && <LocationMarker position={sharedLocation} isShared />}
//                     {/* Ensure map fits bounds when geojsonData changes */}
//                     {geojsonData && <GeoJSONUpdater data={geojsonData} />}
//                 </MapContainer>
//                 {/* Map loading indicator */}
//                 {loading && (
//                     <div style={{
//                         position: 'absolute',
//                         top: '50%',
//                         left: '50%',
//                         zIndex: 1200,
//                         transform: 'translate(-50%, -50%)',
//                         background: 'rgba(255,255,255,0.95)',
//                         padding: '28px 44px',
//                         borderRadius: '12px',
//                         boxShadow: '0 4px 16px rgba(44,62,80,0.18)',
//                         fontSize: '18px',
//                         fontWeight: 'bold',
//                         color: '#2196f3',
//                         textAlign: 'center'
//                     }}>
//                         Loading map...
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// }



import React, { useEffect, useState, useRef, cache, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { App } from '@capacitor/app';
import { preloadGeoJsonLinks, getGeoJsonUniversalCache, clearGeoJsonFilesystemCache, isGeoJsonCached } from '../../utils/GeoJsonCacheManager';
import { Filesystem, Encoding, Directory } from '@capacitor/filesystem';
import { MultiMapSelector, LoadingIndicator, GeoJSONUpdater, LocationMarker, checkAllLayersCacheStatus } from './MultiMapSelector';

const GEOJSON_LINKS_URL = "https://raw.githubusercontent.com/Scaleorange-Technologies/MAPS_VERSION2/main/capacitor/custom_maps/public/geojsonLinks.json";
const CACHE_KEY = "geojsonLinksCache";

if (typeof window !== "undefined" && !window._externalLocationHandlerSet) {
    window._externalLocationHandlerSet = true;
    window.handleExternalLocation = (lat, lng) => {
        window.dispatchEvent(new CustomEvent("externalLocation", { detail: { lat, lng } }));
    };
}

export default function IndiaMapExplorer() {
    const [links, setLinks] = useState({});
    const [categories, setCategories] = useState([]);
    const [selectedMaps, setSelectedMaps] = useState({});
    const [geojsonDataMap, setGeojsonDataMap] = useState({});
    const [loadingStates, setLoadingStates] = useState({});
    const [downloadingStates, setDownloadingStates] = useState({});
    const [error, setError] = useState(null);
    const [userLocation, setUserLocation] = useState(null);
    const [currentState, setCurrentState] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
    const [watchId, setWatchId] = useState(null);
    const [isLocationWatching, setIsLocationWatching] = useState(false);
    const [locationAccuracy, setLocationAccuracy] = useState(null);
    const [sharedLocation, setSharedLocation] = useState(null);
    const [isLocationShared, setIsLocationShared] = useState(false);
    const [shareDisabled, setShareDisabled] = useState(true);
    const [appLoading, setAppLoading] = useState(true);
    const [currentZoom, setCurrentZoom] = useState(5);
    const [loadedChunks, setLoadedChunks] = useState(new Set());
    const [riverChunksData, setRiverChunksData] = useState({});
    const [cachedStates, setCachedStates] = useState({});
    const mapRef = useRef(null);
    const sidebarRef = useRef(null);
    const tileLayers = {
        openstreetmap: {
            name: "OpenStreetMap",
            url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        },
        cartoLight: {
            name: "CartoDB Light",
            url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
            attribution: '&copy; <a href="https://carto.com/">CartoDB</a>'
        }
    };

    const [selectedTileLayer, setSelectedTileLayer] = useState("openstreetmap");

    // Color mapping for different map types
    // const getMapStyle = (category, index = 0) => {
    //     const colors = [
    //         'rgba(33, 150, 243, 0.4)',   // blue
    //         'rgba(76, 175, 80, 0.4)',    // green
    //         'rgba(156, 39, 176, 0.4)',   // purple
    //         'rgba(255, 152, 0, 0.4)',    // orange
    //         'rgba(244, 67, 54, 0.4)',    // red
    //         'rgba(96, 125, 139, 0.4)',   // blue grey
    //         'rgba(121, 85, 72, 0.4)',    // brown
    //         'rgba(233, 30, 99, 0.4)',    // pink
    //     ];

    //     const categoryColors = {
    //         'STATES': colors[0],
    //         'DISTRICTS': colors[1],
    //         'ASSEMBLY_CONSTITUENCIES': colors[2],
    //         'PARLIAMENTARY_CONSTITUENCIES': colors[3]
    //     };

    //     return categoryColors[category] || colors[index % colors.length];
    // };

    const handleCacheStatusUpdate = useCallback((cacheStatus) => {
        setCachedStates(cacheStatus);
    }, []);

    const getMapStyle = (category, layer = null) => {
        // Check if it's river-related data
        // Ensure layer is a string before using includes()
        // console.log("wdjkjnwjkekjn:",layer);
        // console.log("categoryy:",category);
        const isRiverData = category === 'INDIAN_RIVERS' ||
            (typeof layer === 'string' && (
                layer.includes('RIVER') ||
                layer.includes('NORTH') ||
                layer.includes('SOUTH') ||
                layer.includes('EAST') ||
                layer.includes('WEST') ||
                layer.includes('CENTRAL')
            ));

        if (isRiverData) {
            return '#2196f3'; // Blue color for all river data
        }

        // Default colors for other categories
        const colors = {
            'STATES': '#4caf50',
            'INDIA': '#343434',
            'DISTRICTS': '#9c27b0',
            'RAILWAYS': '#f44336',
            'HIGHWAYS': '#607d8b',
            'POLICE': '#795548',
            'ENERGY': '#ff5722'
        };

        return colors[category] || '#666666'; // Default gray if category not found
    };

    const ZOOM_CHUNK_CONFIG = {
        5: { maxChunks: 2, chunkIds: [1, 2] },          // Country level - major rivers only
        7: { maxChunks: 5, chunkIds: [1, 2, 3, 4, 5] }, // State level - more rivers
        9: { maxChunks: 10, chunkIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] }, // District level
        11: { maxChunks: 15, chunkIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] }, // City level
        13: { maxChunks: 25, chunkIds: Array.from({ length: 25 }, (_, i) => i + 1) } // All chunks
    };
    const downloadAndChunkRivers = async () => {
        console.log("⬇️ Downloading fresh river data...");
        setDownloadingStates(prev => ({ ...prev, "INDIAN_RIVERS": true }));

        try {
            const linksResponse = await fetch("https://raw.githubusercontent.com/Scaleorange-Technologies/MAPS_VERSION2/main/capacitor/custom_maps/public/geojson_indian_rivers_links.json");
            const linksJson = await linksResponse.json();
            const urls = linksJson["indian_rivers"];

            const allFeatures = [];
            for (const link of urls) {
                try {
                    const res = await fetch(link);
                    const json = await res.json();

                    if (json.type === "FeatureCollection" && Array.isArray(json.features)) {
                        allFeatures.push(...json.features);
                    }
                } catch (fetchErr) {
                    console.error(`⚠️ Failed to fetch ${link}:`, fetchErr);
                }
            }

            // Sort features by importance (you might want to sort by river size/importance)
            // For now, we'll assume the data is already sorted by importance

            // Save chunks
            const chunkSize = 5000; // Keep your current chunk size
            const totalChunks = Math.ceil(allFeatures.length / chunkSize);

            for (let i = 0; i < totalChunks; i++) {
                const chunk = {
                    type: "FeatureCollection",
                    features: allFeatures.slice(i * chunkSize, (i + 1) * chunkSize)
                };

                await Filesystem.writeFile({
                    path: `geojson_indian_rivers_chunk_${i + 1}.json`,
                    data: JSON.stringify(chunk),
                    directory: Directory.Data,
                    encoding: Encoding.UTF8
                });

                console.log(`📁 Saved chunk ${i + 1}/${totalChunks}`);
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            // Save meta info
            await Filesystem.writeFile({
                path: "geojson_indian_rivers_meta.json",
                data: JSON.stringify({ totalChunks }),
                directory: Directory.Data,
                encoding: Encoding.UTF8
            });

            console.log(`✅ Successfully chunked ${allFeatures.length} river features into ${totalChunks} chunks`);

            // Start progressive loading
            loadRiversProgressively(currentZoom);

        } catch (err) {
            console.error("❌ Error downloading and chunking rivers:", err);
            setError(`Failed to download rivers: ${err.message}`);
        } finally {
            setDownloadingStates(prev => {
                const ns = { ...prev };
                delete ns["INDIAN_RIVERS"];
                return ns;
            });
        }
    };
    const loadRiversProgressively = async (zoom) => {
        const mapKey = "INDIAN_RIVERS";
        setError(null);

        try {
            console.log(`🔍 Loading rivers for zoom level: ${zoom}`);

            // Get required chunks for this zoom level
            const zoomConfig = Object.keys(ZOOM_CHUNK_CONFIG)
                .sort((a, b) => b - a) // Sort descending
                .find(z => zoom >= parseInt(z));

            const config = ZOOM_CHUNK_CONFIG[zoomConfig || 5];
            console.log(`📋 Zoom config:`, config);

            // Check which chunks we already have
            const neededChunks = config.chunkIds.filter(id => !loadedChunks.has(id));
            console.log(`📦 Need to load chunks:`, neededChunks);

            if (neededChunks.length === 0) {
                // All required chunks already loaded, just filter and render
                updateRiverDisplay(config.chunkIds);
                return;
            }

            setLoadingStates(prev => ({ ...prev, [mapKey]: true }));

            // Check if meta file exists
            let meta;
            try {
                const metaFile = await Filesystem.readFile({
                    path: "geojson_indian_rivers_meta.json",
                    directory: Directory.Data,
                    encoding: Encoding.UTF8
                });
                meta = JSON.parse(metaFile.data);
            } catch (statErr) {
                console.log("📂 No meta file, will download fresh data");
                // If no meta file, fall back to downloading fresh data
                await downloadAndChunkRivers();
                return;
            }

            // Load only the needed chunks
            const newChunkData = { ...riverChunksData };

            for (const chunkId of neededChunks) {
                try {
                    const chunkFile = await Filesystem.readFile({
                        path: `geojson_indian_rivers_chunk_${chunkId}.json`,
                        directory: Directory.Data,
                        encoding: Encoding.UTF8
                    });
                    const chunk = JSON.parse(chunkFile.data);

                    if (chunk?.features?.length > 0) {
                        newChunkData[chunkId] = chunk;
                        setLoadedChunks(prev => new Set([...prev, chunkId]));
                        console.log(`✅ Loaded chunk ${chunkId} with ${chunk.features.length} features`);
                    }

                    // Small delay to prevent UI blocking
                    await new Promise(resolve => setTimeout(resolve, 10));

                } catch (chunkError) {
                    console.error(`❌ Error loading chunk ${chunkId}:`, chunkError);
                }
            }

            setRiverChunksData(newChunkData);
            updateRiverDisplay(config.chunkIds);

        } catch (err) {
            console.error("❌ Error in progressive loading:", err);
            setError(`Failed to load rivers: ${err.message}`);
        } finally {
            setLoadingStates(prev => {
                const ns = { ...prev };
                delete ns[mapKey];
                return ns;
            });
        }
    };

    // Function to combine and display selected chunks
    const updateRiverDisplay = (chunkIds) => {
        const mapKey = "INDIAN_RIVERS";

        // Combine features from selected chunks
        const combinedFeatures = [];
        chunkIds.forEach(chunkId => {
            const chunk = riverChunksData[chunkId];
            if (chunk?.features) {
                combinedFeatures.push(...chunk.features);
            }
        });

        const combinedData = {
            type: "FeatureCollection",
            features: combinedFeatures
        };

        console.log(`🌊 Displaying ${combinedFeatures.length} river features from ${chunkIds.length} chunks`);

        // Update the display
        setSelectedMaps(prev => ({ ...prev, [mapKey]: true }));
        setGeojsonDataMap(prev => ({
            ...prev,
            [mapKey]: {
                data: combinedData,
                category: "RIVERS",
                layer: "INDIAN_RIVERS",
                timestamp: Date.now(),
                chunksLoaded: chunkIds.length
            }
        }));
    };

    // Add zoom change handler to your MapContainer
    const handleZoomChange = (zoom) => {
        setCurrentZoom(zoom);

        // Only reload if rivers are currently selected
        const mapKey = "INDIAN_RIVERS";
        if (selectedMaps[mapKey]) {
            loadRiversProgressively(zoom);
        }
    };
    useEffect(() => {
        preloadGeoJsonLinks();
    }, []);

    useEffect(() => {
        let isMounted = true;
        setAppLoading(true);
        setError(null);

        // Load from localStorage first for fastest display
        let localCache = null;
        if (typeof window !== "undefined" && window.localStorage) {
            try {
                localCache = window.localStorage.getItem(CACHE_KEY);
                if (localCache) {
                    const cacheObj = JSON.parse(localCache);
                    setLinks(cacheObj);
                    setCategories(Object.keys(cacheObj));
                    setAppLoading(false);
                }
            } catch { }
        }

        // Background fetch and cache update
        (async () => {
            // Check Capacitor Preferences
            let capCache = null;
            if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences) {
                try {
                    const { value } = await window.Capacitor.Plugins.Preferences.get({ key: CACHE_KEY });
                    capCache = value;
                    if (capCache && capCache !== localCache && isMounted) {
                        const capObj = JSON.parse(capCache);
                        setLinks(capObj);
                        setCategories(Object.keys(capObj));
                        setAppLoading(false);
                        window.localStorage.setItem(CACHE_KEY, capCache);
                    }
                } catch { }
            }

            // Network fetch
            fetch(GEOJSON_LINKS_URL)
                .then(res => {
                    if (!res.ok) throw new Error("Failed to fetch geojson links");
                    return res.json();
                })
                .then(async fetchedData => {
                    if (!isMounted) return;
                    const fetchedStr = JSON.stringify(fetchedData);
                    if (fetchedStr !== localCache && fetchedStr !== capCache) {
                        setLinks(fetchedData);
                        setCategories(Object.keys(fetchedData));
                        setAppLoading(false);
                        window.localStorage.setItem(CACHE_KEY, fetchedStr);
                        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences) {
                            await window.Capacitor.Plugins.Preferences.set({ key: CACHE_KEY, value: fetchedStr });
                        }
                    }
                })
                .catch(() => {
                    if (!localCache && !capCache && isMounted) {
                        setError("Could not fetch data and no cache found.");
                        setAppLoading(false);
                    }
                });
        })();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        function onExternalLocation(e) {
            const { lat, lng } = e.detail;
            setUserLocation([lat, lng]);
            setLocationAccuracy(null);
            setError(null);
            setSidebarOpen(false);
            if (mapRef.current && mapRef.current.setView) {
                mapRef.current.setView([lat, lng], 16);
            }
        }
        window.addEventListener("externalLocation", onExternalLocation);
        return () => window.removeEventListener("externalLocation", onExternalLocation);
    }, []);

    // Handle clicks outside sidebar to close it
    useEffect(() => {
        function handleClickOutside(event) {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target) &&
                !event.target.closest('.sidebar-toggle-btn')) {
                setSidebarOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Cleanup watch location on unmount
    useEffect(() => {
        return () => {
            stopWatchingLocation();
        };
    }, []);

    useEffect(() => {
        let backButtonListener = null;

        const setupBackButton = async () => {
            try {
                backButtonListener = await App.addListener('backButton', () => {
                    App.exitApp();
                });
            } catch (error) {
                console.log('Back button setup error:', error);
            }
        };

        setupBackButton();

        return () => {
            if (backButtonListener) {
                backButtonListener.remove();
            }
        };
    }, []);

    useEffect(() => {
        handleGetLocation();
    }, []);

    const getMapKey = (category, state, layer) => {
        return state ? `${category}-${state}-${layer}` : `${category}-${layer}`;
    };

    const handleMapToggle = async (category, layer, state = null, subCategory = null, url = null) => {
        // Generate the correct map key based on the parameters
        const mapKey = subCategory
            ? `${category}-${state}-${subCategory}-${layer}`
            : state
                ? `${category}-${state}-${layer}`
                : `${category}-${layer}`;

        if (selectedMaps[mapKey]) {
            // Remove map
            setSelectedMaps(prev => {
                const newMaps = { ...prev };
                delete newMaps[mapKey];
                return newMaps;
            });
            setGeojsonDataMap(prev => {
                const newData = { ...prev };
                delete newData[mapKey];
                return newData;
            });
            setLoadingStates(prev => {
                const ns = { ...prev };
                delete ns[mapKey];
                return ns;
            });
            setDownloadingStates(prev => {
                const ns = { ...prev };
                delete ns[mapKey];
                return ns;
            });

        } else {
            // Add map
            let finalUrl = url;

            // If URL is not provided directly, try to extract it from links object
            if (!finalUrl) {
                if (subCategory) {
                    // Handle nested sub-categories (like INDIAN_RIVERS -> NORTH)
                    const categoryData = links[category];
                    if (categoryData && categoryData[layer] && categoryData[layer][subCategory]) {
                        const obj = categoryData[layer][subCategory];
                        finalUrl = obj ? Object.keys(obj)[0] : null;
                    }
                } else if (state) {
                    // Handle state-based layers
                    if (!links[category][state]) return;
                    const obj = links[category][state][layer];
                    finalUrl = obj ? Object.keys(obj)[0] : null;
                } else {
                    // Handle direct category layers
                    const obj = links[category][layer];
                    finalUrl = obj ? Object.keys(obj)[0] : null;
                }
            }

            if (!finalUrl) {
                setError(`No URL found for ${layer}`);
                return;
            }

            console.log(`🔗 Loading layer: ${layer}, URL: ${finalUrl}`);

            // Special handling for INDIAN_RIVERS
            // if (layer === "INDIAN_RIVERS") {
            //     loadRiversProgressively(currentZoom);
            //     return;
            // }
            try {
                const isCached = await isGeoJsonCached(finalUrl);
                console.log(`📦 Cache status for ${layer}:`, isCached ? 'CACHED' : 'NOT CACHED');
                setLoadingStates(prev => {
                    const ns = { ...prev };
                    delete ns[mapKey];
                    return ns;
                });
                setDownloadingStates(prev => {
                    const ns = { ...prev };
                    delete ns[mapKey];
                    return ns;
                });
                // You can update UI here to show green dot if cached
                if (isCached) {
                    // Show green dot indicator immediately
                    setCachedStates(prev => ({ ...prev, [mapKey]: true }));
                    setLoadingStates(prev => ({ ...prev, [mapKey]: true }));
                } else {
                    // Will be downloading from network
                    setDownloadingStates(prev => ({ ...prev, [mapKey]: true }));
                }
            } catch (err) {
                console.warn('Failed to check cache status:', err);
                setDownloadingStates(prev => ({ ...prev, [mapKey]: true }));
            }
            // Set loading state
            // setDownloadingStates(prev => ({ ...prev, [mapKey]: false }));
            // setLoadingStates(prev => ({ ...prev, [mapKey]: true }));
            setError(null);

            try {
                const { data, status, wasCached, cacheType } = await getGeoJsonUniversalCache(finalUrl);
                console.log("dataa:", data);
                console.log("statussss:", status);
                console.log("waschachedd:", wasCached);
                console.log("cachetypee:", cacheType);
                // Now set correct states
                // if (status === 'network') {
                //     setDownloadingStates(prev => ({ ...prev, [mapKey]: true }));
                //     setLoadingStates(prev => {
                //         const ns = { ...prev }; delete ns[mapKey]; return ns;
                //     });
                // } else {
                //     setLoadingStates(prev => ({ ...prev, [mapKey]: true }));
                //     setDownloadingStates(prev => {
                //         const ns = { ...prev }; delete ns[mapKey]; return ns;
                //     });
                // }
                if (wasCached || status === 'cache') {
                    // Data was already cached - show green indicator
                    setCachedStates(prev => ({ ...prev, [mapKey]: true }));
                    // setLoadingStates(prev => {
                    //     const ns = { ...prev }; 
                    //     delete ns[mapKey]; 
                    //     return ns;
                    // });
                    console.log(`✅ ${layer} loaded from ${cacheType} cache`);
                } else {
                    // Data was downloaded from network - show download indicator
                    // setDownloadingStates(prev => ({ ...prev, [mapKey]: true }));
                    // setLoadingStates(prev => {
                    //     const ns = { ...prev }; 
                    //     delete ns[mapKey]; 
                    //     return ns;
                    // });
                    setCachedStates(prev => ({ ...prev, [mapKey]: true }));
                    console.log(`🌐 ${layer} downloaded from network`);
                }

                setSelectedMaps(prev => ({ ...prev, [mapKey]: true }));

                // Create a descriptive layer name
                let layerDisplayName = layer;
                if (subCategory) {
                    layerDisplayName = `${layer} - ${subCategory}`;
                } else if (state) {
                    layerDisplayName = `${state} - ${layer}`;
                }
                setGeojsonDataMap(prev => ({
                    ...prev,
                    [mapKey]: {
                        data,
                        category,
                        layer: layerDisplayName,
                        // Add cache metadata to the stored data
                        cacheInfo: {
                            wasCached,
                            cacheType,
                            loadedAt: new Date().toISOString()
                        }
                    }
                }));

                // setGeojsonDataMap(prev => ({
                //     ...prev,
                //     [mapKey]: {
                //         data,
                //         category,
                //         layer: layerDisplayName
                //     }
                // }));

            } catch (err) {
                setError(`Failed to load ${layer}: ${err.message}`);
            } finally {
                // Remove both after short timeout so UI shows
                setTimeout(() => {
                    setLoadingStates(prev => {
                        const ns = { ...prev }; delete ns[mapKey]; return ns;
                    });
                    setDownloadingStates(prev => {
                        const ns = { ...prev }; delete ns[mapKey]; return ns;
                    });
                }, 500);
            }
        }
    };

    // const handleMapToggle = async (category, layer, state = null) => {
    //     const mapKey = getMapKey(category, state, layer);

    //     if (selectedMaps[mapKey]) {
    //         // Remove map
    //         setSelectedMaps(prev => {
    //             const newMaps = { ...prev };
    //             delete newMaps[mapKey];
    //             return newMaps;
    //         });
    //         setGeojsonDataMap(prev => {
    //             const newData = { ...prev };
    //             delete newData[mapKey];
    //             return newData;
    //         });

    //     } else {
    //         // Add map
    //         let url;
    //         if (state) {
    //             if (!links[category][state]) return;
    //             const obj = links[category][state][layer];
    //             url = obj ? Object.keys(obj)[0] : null;
    //         } else {
    //             const obj = links[category][layer];
    //             url = obj ? Object.keys(obj)[0] : null;
    //         }

    //         if (!url) {
    //             setError(`No URL found for ${layer}`);
    //             return;
    //         }
    //         if (layer === "INDIAN_RIVERS") {
    //             loadRiversProgressively(currentZoom);
    //             return;
    //         }
    //         // if (layer === "INDIAN_RIVERS") {
    //         //     setDownloadingStates(prev => ({ ...prev, [mapKey]: false }));
    //         //     setLoadingStates(prev => ({ ...prev, [mapKey]: true }));
    //         //     setError(null);

    //         //     try {
    //         //         console.log("🔍 Checking for cached INDIAN_RIVERS file...");

    //         //         let meta;
    //         //         try {
    //         //             const metaFile = await Filesystem.readFile({
    //         //                 path: "geojson_indian_rivers_meta.json",
    //         //                 directory: Directory.Data,
    //         //                 encoding: Encoding.UTF8
    //         //             });
    //         //             meta = JSON.parse(metaFile.data);
    //         //             console.log("✅ Found meta file:", meta);
    //         //         } catch (statErr) {
    //         //             console.log("📂 Meta file does not exist yet:", statErr.message);
    //         //         }

    //         //         let data;

    //         //         if (meta?.totalChunks) {
    //         //             console.log("📖 Reading chunks from cache...");
    //         //             setLoadingStates(prev => ({ ...prev, [mapKey]: true }));
    //         //             setDownloadingStates(prev => {
    //         //                 const ns = { ...prev };
    //         //                 delete ns[mapKey];
    //         //                 return ns;
    //         //             });

    //         //             const allFeatures = [];

    //         //             // Process chunks in smaller batches to avoid blocking
    //         //             for (let i = 1; i <= meta.totalChunks; i++) {
    //         //                 try {
    //         //                     const chunkFile = await Filesystem.readFile({
    //         //                         path: `geojson_indian_rivers_chunk_${i}.json`,
    //         //                         directory: Directory.Data,
    //         //                         encoding: Encoding.UTF8
    //         //                     });
    //         //                     const chunk = JSON.parse(chunkFile.data);

    //         //                     // Validate chunk structure
    //         //                     if (chunk && chunk.features && Array.isArray(chunk.features)) {
    //         //                         allFeatures.push(...chunk.features);
    //         //                         console.log(`📦 Loaded chunk ${i}/${meta.totalChunks} with ${chunk.features.length} features`);
    //         //                     } else {
    //         //                         console.warn(`⚠️ Invalid chunk structure in chunk ${i}`);
    //         //                     }

    //         //                     // Add small delay to prevent blocking UI
    //         //                     if (i % 5 === 0) {
    //         //                         await new Promise(resolve => setTimeout(resolve, 10));
    //         //                     }

    //         //                 } catch (chunkError) {
    //         //                     console.error(`❌ Error loading chunk ${i}:`, chunkError);
    //         //                     // Continue with other chunks instead of failing completely
    //         //                 }
    //         //             }

    //         //             data = {
    //         //                 type: "FeatureCollection",
    //         //                 features: allFeatures
    //         //             };

    //         //             console.log(`✅ Successfully loaded ${allFeatures.length} river features from cache`);

    //         //         } else {
    //         //             console.log("⬇️ Fetching list of GeoJSON links...");
    //         //             setDownloadingStates(prev => ({ ...prev, [mapKey]: true }));
    //         //             setLoadingStates(prev => {
    //         //                 const ns = { ...prev };
    //         //                 delete ns[mapKey];
    //         //                 return ns;
    //         //             });

    //         //             const linksResponse = await fetch("https://raw.githubusercontent.com/Scaleorange-Technologies/MAPS_VERSION2/main/capacitor/custom_maps/public/geojson_indian_rivers_links.json");
    //         //             const linksJson = await linksResponse.json();
    //         //             const urls = linksJson["indian_rivers"];

    //         //             const allFeatures = [];
    //         //             for (const link of urls) {
    //         //                 try {
    //         //                     const res = await fetch(link);
    //         //                     const json = await res.json();

    //         //                     console.log(`🌊 Loaded ${link} with ${json.features?.length || 0} features`);

    //         //                     if (json.type === "FeatureCollection" && Array.isArray(json.features)) {
    //         //                         allFeatures.push(...json.features);
    //         //                     }
    //         //                 } catch (fetchErr) {
    //         //                     console.error(`⚠️ Failed to fetch ${link}:`, fetchErr);
    //         //                 }
    //         //             }

    //         //             // Save chunks logic
    //         //             const chunkSize = 5000;
    //         //             const totalChunks = Math.ceil(allFeatures.length / chunkSize);
    //         //             for (let i = 0; i < totalChunks; i++) {
    //         //                 const chunk = {
    //         //                     type: "FeatureCollection",
    //         //                     features: allFeatures.slice(i * chunkSize, (i + 1) * chunkSize)
    //         //                 };

    //         //                 await Filesystem.writeFile({
    //         //                     path: `geojson_indian_rivers_chunk_${i + 1}.json`,
    //         //                     data: JSON.stringify(chunk),
    //         //                     directory: Directory.Data,
    //         //                     encoding: Encoding.UTF8
    //         //                 });

    //         //                 console.log(`📁 Saved chunk ${i + 1}/${totalChunks}`);
    //         //                 await new Promise(resolve => setTimeout(resolve, 100));
    //         //             }

    //         //             // Save meta info
    //         //             await Filesystem.writeFile({
    //         //                 path: "geojson_indian_rivers_meta.json",
    //         //                 data: JSON.stringify({ totalChunks }),
    //         //                 directory: Directory.Data,
    //         //                 encoding: Encoding.UTF8
    //         //             });

    //         //             data = {
    //         //                 type: "FeatureCollection",
    //         //                 features: allFeatures
    //         //             };
    //         //         }

    //         //         // CRITICAL: Validate data structure before setting state
    //         //         if (!data || !data.features || !Array.isArray(data.features)) {
    //         //             throw new Error("Invalid GeoJSON data structure");
    //         //         }

    //         //         if (data.features.length === 0) {
    //         //             throw new Error("No river features found in data");
    //         //         }

    //         //         console.log("✅ Rivers data validation passed:", data.features.length, "features");

    //         //         // Force re-render by updating state immediately
    //         //         setSelectedMaps(prev => ({ ...prev, [mapKey]: true }));
    //         //         setGeojsonDataMap(prev => ({
    //         //             ...prev,
    //         //             [mapKey]: {
    //         //                 data,
    //         //                 category,
    //         //                 layer: state ? `${state} - ${layer}` : layer,
    //         //                 // Add timestamp to force re-render
    //         //                 timestamp: Date.now()
    //         //             }
    //         //         }));

    //         //         console.log("✅ INDIAN_RIVERS state updated successfully");

    //         //     } catch (err) {
    //         //         console.error("❌ Error loading INDIAN_RIVERS:", err);
    //         //         setError(`Failed to load INDIAN_RIVERS: ${err.message}`);
    //         //     } finally {
    //         //         // Clear loading states
    //         //         setTimeout(() => {
    //         //             setLoadingStates(prev => {
    //         //                 const ns = { ...prev };
    //         //                 delete ns[mapKey];
    //         //                 return ns;
    //         //             });
    //         //             setDownloadingStates(prev => {
    //         //                 const ns = { ...prev };
    //         //                 delete ns[mapKey];
    //         //                 return ns;
    //         //             });
    //         //         }, 500);
    //         //     }

    //         //     return;
    //         // }

    //         // Set loading state
    //         setDownloadingStates(prev => ({ ...prev, [mapKey]: false }));
    //         setLoadingStates(prev => ({ ...prev, [mapKey]: true }));
    //         setError(null);

    //         try {
    //             const { data, status } = await getGeoJsonUniversalCache(url);
    //             console.log("dataa:", data);
    //             console.log("statussss:", status);
    //             // Now set correct states
    //             if (status === 'network') {
    //                 setDownloadingStates(prev => ({ ...prev, [mapKey]: true }));
    //                 setLoadingStates(prev => {
    //                     const ns = { ...prev }; delete ns[mapKey]; return ns;
    //                 });
    //             } else {
    //                 setLoadingStates(prev => ({ ...prev, [mapKey]: true }));
    //                 setDownloadingStates(prev => {
    //                     const ns = { ...prev }; delete ns[mapKey]; return ns;
    //                 });
    //             }

    //             setSelectedMaps(prev => ({ ...prev, [mapKey]: true }));
    //             setGeojsonDataMap(prev => ({
    //                 ...prev,
    //                 [mapKey]: {
    //                     data,
    //                     category,
    //                     layer: state ? `${state} - ${layer}` : layer
    //                 }
    //             }));
    //         } catch (err) {
    //             setError(`Failed to load ${layer}: ${err.message}`);
    //         } finally {
    //             // Remove both after short timeout so UI shows
    //             setTimeout(() => {
    //                 setLoadingStates(prev => {
    //                     const ns = { ...prev }; delete ns[mapKey]; return ns;
    //                 });
    //                 setDownloadingStates(prev => {
    //                     const ns = { ...prev }; delete ns[mapKey]; return ns;
    //                 });
    //             }, 500);
    //         }
    //     }
    // };

    // Get user's current location
    const handleGetLocation = () => {
        setLocationLoading(true);
        setError(null);
        setShareDisabled(true);

        if (window.Capacitor && window.Capacitor.isNativePlatform()) {
            getCapacitorLocation();
        } else {
            getBrowserLocation();
        }
    };

    const getCapacitorLocation = async () => {
        try {
            const { Geolocation } = window.Capacitor.Plugins;
            const position = await Geolocation.getCurrentPosition({
                enableHighAccuracy: false,
                timeout: 10000,
                maximumAge: 0
            });

            const { latitude, longitude, accuracy } = position.coords;
            setUserLocation([latitude, longitude]);
            setLocationAccuracy(accuracy);
            setLocationLoading(false);
            setShareDisabled(false);
            determineCurrentState([latitude, longitude]);
        } catch (err) {
            console.error('Capacitor Geolocation error:', err);
            setError(`Location access error-Please check your internet connection and try again`);
            setLocationLoading(false);
            getBrowserLocation();
        }
    };

    const getBrowserLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            setLocationLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude, accuracy } = position.coords;
                setUserLocation([latitude, longitude]);
                setLocationAccuracy(accuracy);
                setLocationLoading(false);
                setShareDisabled(false);
                determineCurrentState([latitude, longitude]);
            },
            err => {
                console.error('Browser Geolocation error:', err);
                setError(`Location access error: ${err.message}`);
                setLocationLoading(false);
            },
            {
                enableHighAccuracy: false,
                timeout: 10000,
                maximumAge: 0
            }
        );
    };

    const startWatchingLocation = () => {
        setError(null);
        setIsLocationWatching(true);

        if (window.Capacitor && window.Capacitor.isNativePlatform()) {
            watchLocationCapacitor();
        } else {
            watchLocationBrowser();
        }
    };

    const watchLocationCapacitor = async () => {
        try {
            const { Geolocation } = window.Capacitor.Plugins;
            const id = await Geolocation.watchPosition(
                { enableHighAccuracy: false, timeout: 10000 },
                { timeout: 10000 },
                position => {
                    const { latitude, longitude, accuracy } = position.coords;
                    setUserLocation([latitude, longitude]);
                    setLocationAccuracy(accuracy);
                    setShareDisabled(false);
                    determineCurrentState([latitude, longitude]);
                }
            );
            setWatchId(id);
        } catch (err) {
            console.error('Capacitor watch location error:', err);
            setError(`Watch location error: ${err.message}`);
            setIsLocationWatching(false);
            watchLocationBrowser();
        }
    };

    const watchLocationBrowser = () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            setIsLocationWatching(false);
            return;
        }

        const id = navigator.geolocation.watchPosition(
            position => {
                const { latitude, longitude, accuracy } = position.coords;
                setUserLocation([latitude, longitude]);
                setLocationAccuracy(accuracy);
                setShareDisabled(false);
                determineCurrentState([latitude, longitude]);
            },
            err => {
                console.error('Browser watch location error:', err);
                setError(`Watch location error: ${err.message}`);
                setIsLocationWatching(false);
            },
            {
                enableHighAccuracy: false,
                timeout: 30000,
                maximumAge: 5000
            }
        );
        setWatchId(id);
    };

    const stopWatchingLocation = () => {
        if (watchId !== null) {
            if (window.Capacitor && window.Capacitor.isNativePlatform()) {
                try {
                    const { Geolocation } = window.Capacitor.Plugins;
                    Geolocation.clearWatch({ id: watchId });
                } catch (err) {
                    console.error('Error clearing Capacitor watch:', err);
                }
            } else if (navigator.geolocation) {
                navigator.geolocation.clearWatch(watchId);
            }
            setWatchId(null);
            setIsLocationWatching(false);
        }
    };

    const shareLocation = async () => {
        if (!userLocation) return;

        setSharedLocation(userLocation);
        setIsLocationShared(true);

        if (window.Capacitor && window.Capacitor.isNativePlatform()) {
            try {
                const { Share } = window.Capacitor.Plugins;
                await Share.share({
                    title: 'Share My Location',
                    text: `Check out my location! Latitude: ${userLocation[0].toFixed(6)}, Longitude: ${userLocation[1].toFixed(6)}`,
                    url: `https://www.google.com/maps/search/?api=1&query=${userLocation[0]},${userLocation[1]}`,
                    dialogTitle: 'Share your location'
                });
            } catch (err) {
                console.error('Error sharing via Capacitor:', err);
                setError(`Failed to share location: ${err.message}`);
            }
        } else if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Share My Location',
                    text: `Check out my location! Latitude: ${userLocation[0].toFixed(6)}, Longitude: ${userLocation[1].toFixed(6)}`,
                    url: `https://www.google.com/maps/search/?api=1&query=${userLocation[0]},${userLocation[1]}`
                });
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Error sharing via Web Share API:', err);
                    setError(`Failed to share location: ${err.message}`);
                }
            }
        } else {
            try {
                const locationText = `https://www.google.com/maps/search/?api=1&query=${userLocation[0]},${userLocation[1]}`;
                await navigator.clipboard.writeText(locationText);
                alert('Location link copied to clipboard');
            } catch (err) {
                console.error('Error copying to clipboard:', err);
                setError('Could not copy location to clipboard');
            }
        }
    };

    const determineCurrentState = async (location) => {
        try {
            const [lat, lng] = location;
            // Simple reverse geocoding logic - you might want to use a proper geocoding service
            // For now, just setting a placeholder
            setCurrentState('Location detected');
        } catch (err) {
            console.error('Error determining state:', err);
        }
    };

    const onEachFeature = (feature, layer) => {
        if (feature.properties) {
            const popupContent = Object.entries(feature.properties)
                .filter(([key]) => key !== 'shape_area' && key !== 'shape_length')
                .map(([key, value]) => `<strong>${key}:</strong> ${value}`)
                .join('<br>');

            layer.bindPopup(popupContent);
        }
    };
    const clearAllMaps = () => {
        setSelectedMaps({});
        setGeojsonDataMap({});
        setLoadingStates({});
        setDownloadingStates({});
        setError(null);
    };

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    if (appLoading) {
        return (
            <div style={{ position: 'relative', height: '100vh', width: '100%' }}>
                <LoadingIndicator
                    type="loading"
                    message="Loading India Map Explorer..."
                />
            </div>
        );
    }

    if (error && Object.keys(links).length === 0) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                padding: '20px',
                textAlign: 'center'
            }}>
                <div style={{
                    fontSize: '48px',
                    marginBottom: '20px'
                }}>
                    ❌
                </div>
                <h2 style={{ color: '#d32f2f', marginBottom: '10px' }}>
                    Failed to Load Map Data
                </h2>
                <p style={{ color: '#666', marginBottom: '20px' }}>
                    {error}
                </p>
                <button
                    onClick={() => window.location.reload()}
                    style={{
                        padding: '12px 24px',
                        backgroundColor: '#2196f3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '16px'
                    }}
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div style={{ position: 'relative', height: '100vh', width: '100%' }}>
            {/* Map Container */}
            <MapContainer
                center={userLocation || [20.5937, 78.9629]}
                zoom={userLocation ? 12 : 5}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
                ref={mapRef}
                onZoomEnd={(e) => handleZoomChange(e.target.getZoom())} // Add this line
            >
                {/* <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                /> */}
                <TileLayer
                    attribution={tileLayers[selectedTileLayer].attribution}
                    url={tileLayers[selectedTileLayer].url}
                />


                <ZoomControl position="bottomright" />

                {/* Render all selected GeoJSON layers */}
                {Object.entries(geojsonDataMap).map(([mapKey, mapInfo], index) => {
                    console.log(`Rendering map layer: ${mapKey}`, mapInfo); // Debug log

                    return (
                        <GeoJSON
                            key={`${mapKey}-${mapInfo.timestamp || index}`} // Use timestamp to force re-render
                            data={mapInfo.data}
                            style={(feature) => {
                                // Different styles for different geometry types
                                if (feature.geometry.type === 'Point') {
                                    return {
                                        color: "#2a52be",
                                        weight: 2,
                                        opacity: 1,
                                        fillOpacity: 0.8
                                    };
                                } else {
                                    return {
                                        color: getMapStyle(mapInfo.category, index),
                                        weight: mapInfo.layer === 'INDIAN_RIVERS' ? 1 : 2, // Thinner lines for rivers
                                        opacity: 0.8,
                                        fillOpacity: 0.3,
                                        fillColor: getMapStyle(mapInfo.category, index)
                                    };
                                }
                            }}
                            pointToLayer={(feature, latlng) => {
                                return L.circleMarker(latlng, {
                                    radius: 4, // Smaller radius for rivers
                                    fillColor: getMapStyle(mapInfo.category, index),
                                    color: "#2a52be",
                                    weight: 1,
                                    opacity: 1,
                                    fillOpacity: 0.8
                                });
                            }}
                            onEachFeature={(feature, layer) => {
                                // Capture mapInfo values for use in event handlers
                                const layerName = mapInfo.layer;
                                const isRiverLayer = layerName === 'INDIAN_RIVERS';
                                const normalWeight = isRiverLayer ? 1 : 2;

                                // Enhanced popup for rivers
                                if (feature.properties) {
                                    const popupContent = Object.entries(feature.properties)
                                        .filter(([key, value]) =>
                                            key !== 'shape_area' &&
                                            key !== 'shape_length' &&
                                            value !== null &&
                                            value !== undefined &&
                                            value !== ''
                                        )
                                        .map(([key, value]) => `<strong>${key}:</strong> ${value}`)
                                        .join('<br>');

                                    if (popupContent) {
                                        layer.bindPopup(`
                            <div style="max-width: 200px;">
                                <strong style="color: #2a52be;">${layerName}</strong><br/>
                                ${popupContent}
                            </div>
                        `);
                                    }
                                }

                                // Add hover effects
                                layer.on({
                                    mouseover: function (e) {
                                        this.setStyle({
                                            weight: 3,
                                            opacity: 1.0
                                        });
                                    },
                                    mouseout: function (e) {
                                        this.setStyle({
                                            weight: normalWeight,
                                            opacity: 0.8
                                        });
                                    }
                                });
                            }}
                        />
                    );
                })}

                {/* User Location Marker */}
                {userLocation && (
                    <LocationMarker position={userLocation} isShared={false} />
                )}

                {/* Shared Location Marker */}
                {sharedLocation && isLocationShared && (
                    <LocationMarker position={sharedLocation} isShared={true} />
                )}

                {/* Auto-fit bounds for GeoJSON */}
                {Object.keys(geojsonDataMap).length > 0 && (
                    <GeoJSONUpdater data={Object.values(geojsonDataMap)[0]?.data} />
                )}
            </MapContainer>

            {/* Sidebar Toggle Button */}
            <button
                className="sidebar-toggle-btn"
                onClick={toggleSidebar}
                style={{
                    position: 'absolute',
                    top: '20px',
                    left: '20px',
                    zIndex: 1000,
                    backgroundColor: 'white',
                    color: 'black',
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    fontSize: '18px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease'
                }}
            >
                {sidebarOpen ? '✕' : '☰'}
            </button>

            {/* Sidebar */}
            <div
                ref={sidebarRef}
                style={{
                    position: 'absolute',
                    top: '0',
                    left: sidebarOpen ? '0' : '-400px',
                    width: '320px',
                    height: '100%',
                    backgroundColor: 'white',
                    boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
                    zIndex: 999,
                    transition: 'left 0.3s ease',
                    overflowY: 'auto',
                    padding: '80px 20px 20px 20px'
                }}
            >
                <div style={{ marginBottom: '10px' }}>
                    <label style={{ fontSize: '14px', marginRight: '10px' }}>🗺️ Map Theme:</label>
                    <select
                        value={selectedTileLayer}
                        onChange={(e) => setSelectedTileLayer(e.target.value)}
                        style={{ padding: '6px 10px', fontSize: '14px', borderRadius: '6px' }}
                    >
                        <option value="openstreetmap">OpenStreetMap</option>
                        <option value="cartoLight">CartoDB Light</option>
                    </select>
                </div>

                {/* Location Controls */}
                <div style={{ marginBottom: '20px' }}>
                    <h3 style={{
                        margin: '0 0 15px 0',
                        color: '#444',
                        borderBottom: '2px solid #eee',
                        paddingBottom: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        📍 Location Services
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <button
                            onClick={handleGetLocation}
                            disabled={locationLoading}
                            style={{
                                padding: '12px 16px',
                                backgroundColor: locationLoading ? '#ccc' : '#4caf50',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: locationLoading ? 'not-allowed' : 'pointer',
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            {locationLoading ? '⏳' : '📍'}
                            {locationLoading ? 'Getting Location...' : 'Get My Location'}
                        </button>

                        <button
                            onClick={shareLocation}
                            disabled={shareDisabled}
                            style={{
                                padding: '12px 16px',
                                backgroundColor: shareDisabled ? '#ccc' : '#ff9800',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: shareDisabled ? 'not-allowed' : 'pointer',
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            📤 Share Location
                        </button>
                    </div>

                    {/* Location Info */}
                    {userLocation && (
                        <div style={{
                            marginTop: '12px',
                            padding: '12px',
                            backgroundColor: '#f5f5f5',
                            borderRadius: '8px',
                            fontSize: '12px'
                        }}>
                            <div><strong>📍 Current Location:</strong></div>
                            <div>Lat: {userLocation[0].toFixed(6)}</div>
                            <div>Lng: {userLocation[1].toFixed(6)}</div>
                            {locationAccuracy && (
                                <div>Accuracy: {Math.round(locationAccuracy)}m</div>
                            )}
                            {currentState && (
                                <div>State: {currentState}</div>
                            )}
                        </div>
                    )}
                </div>

                {/* Multi-Map Selector */}
                {Object.keys(links).length > 0 && (
                    <MultiMapSelector
                        links={links}
                        selectedMaps={selectedMaps}
                        onMapToggle={handleMapToggle}
                        downloadingStates={downloadingStates}
                        loadingStates={loadingStates}
                        cachedStates={cachedStates} // ✅ ADD THIS LINE
                        onCacheStatusUpdate={handleCacheStatusUpdate}
                    />
                )}

                {/* Map Controls */}
                <div style={{ marginTop: '20px' }}>
                    <button
                        onClick={clearAllMaps}
                        style={{
                            padding: '12px 16px',
                            backgroundColor: '#f44336',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            justifyContent: 'center'
                        }}
                    >
                        🗑️ Clear All Maps
                    </button>
                    {/* <button onClick={clearGeoJsonFilesystemCache}>Reset Cache</button> */}

                </div>

                {/* Active Maps Info */}
                {Object.keys(selectedMaps).length > 0 && (
                    <div style={{ marginTop: '20px' }}>
                        <h3 style={{
                            margin: '0 0 15px 0',
                            color: '#444',
                            borderBottom: '2px solid #eee',
                            paddingBottom: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            ✅ Active Maps ({Object.keys(selectedMaps).length})
                        </h3>

                        <div style={{ fontSize: '12px', color: '#666' }}>
                            {Object.entries(geojsonDataMap).map(([mapKey, mapInfo]) => (
                                <div key={mapKey} style={{
                                    padding: '8px',
                                    margin: '4px 0',
                                    backgroundColor: '#e8f5e9',
                                    borderRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <span style={{
                                        width: '12px',
                                        height: '12px',
                                        borderRadius: '50%',
                                        backgroundColor: getMapStyle(mapInfo.category),
                                        display: 'inline-block'
                                    }}></span>
                                    {mapInfo.layer}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>


            {/* Error Display */}
            {error && (
                <div style={{
                    position: 'absolute',
                    bottom: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#f44336',
                    color: 'white',
                    padding: '12px 20px',
                    borderRadius: '8px',
                    zIndex: 1000,
                    maxWidth: '90%',
                    textAlign: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>⚠️</span>
                        <span>{error}</span>
                        <button
                            onClick={() => setError(null)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '16px',
                                marginLeft: '8px'
                            }}
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}