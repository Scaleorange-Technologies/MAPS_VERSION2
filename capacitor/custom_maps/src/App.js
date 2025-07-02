

// // import React from "react";
// // import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// // import Maps from "./components/Maps/Maps";
// // import MapsCon from "./components/Maps/Tel_constituency";


// // function App() {
// //   return (
// //     <Router>
// //       <div>
// //         <Routes>
// //           {/* <Route path="/maps" element={<Maps />} /> */}
// //           <Route path="/" element={<MapsCon />} />
// //         </Routes>
// //       </div>
// //     </Router>
// //   );
// // }

// // export default App;




// import { Filesystem, Directory } from '@capacitor/filesystem';
// import { Preferences } from '@capacitor/preferences';

// import React, { useState, useEffect, useRef } from 'react';
// import { MapContainer, TileLayer, ZoomControl, LayersControl } from 'react-leaflet';
// import L from 'leaflet';
// import 'leaflet/dist/leaflet.css';
// import LocationMarker from './components/Maps/LocationMarker';
// import GeoJsonLayer from './components/Maps/GeoJsonLayer';

// // Fix for Leaflet marker icons
// delete L.Icon.Default.prototype._getIconUrl;
// L.Icon.Default.mergeOptions({
//   iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
//   iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
//   shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
// });

// // Add custom CSS for the app
// const appStyles = `
//   .map-container {
//     height: 100vh;
//     width: 100vw;
//     position: relative;
//   }
  
//   .sidebar {
//     position: fixed;
//     top: 0;
//     left: 0;
//     height: 100vh;
//     background-color: white;
//     box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
//     transition: transform 0.3s ease;
//     z-index: 1000;
//     overflow-y: auto;
//   }
  
//   .sidebar-toggle {
//     position: absolute;
//     top: 20px;
//     left: 20px;
//     width: 40px;
//     height: 40px;
//     background-color: white;
//     border-radius: 4px;
//     display: flex;
//     justify-content: center;
//     align-items: center;
//     cursor: pointer;
//     box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
//     z-index: 1001;
//     transition: left 0.3s ease;
//   }
  
//   .sidebar-toggle:hover {
//     background-color: #f8f9fa;
//   }
  
//   .sidebar-icon {
//     width: 20px;
//     height: 2px;
//     background-color: #333;
//     position: relative;
//     transition: all 0.3s ease;
//   }
  
//   .sidebar-icon::before,
//   .sidebar-icon::after {
//     content: '';
//     position: absolute;
//     width: 20px;
//     height: 2px;
//     background-color: #333;
//     transition: all 0.3s ease;
//   }
  
//   .sidebar-icon::before {
//     transform: translateY(-6px);
//   }
  
//   .sidebar-icon::after {
//     transform: translateY(6px);
//   }
  
//   .sidebar-open .sidebar-icon {
//     background-color: transparent;
//   }
  
//   .sidebar-open .sidebar-icon::before {
//     transform: rotate(45deg);
//   }
  
//   .sidebar-open .sidebar-icon::after {
//     transform: rotate(-45deg);
//   }
  
//   .overlay {
//     position: fixed;
//     top: 0;
//     left: 0;
//     width: 100vw;
//     height: 100vh;
//     background-color: rgba(0, 0, 0, 0.4);
//     z-index: 999;
//     opacity: 0;
//     visibility: hidden;
//     transition: opacity 0.3s ease, visibility 0.3s ease;
//   }
  
//   .overlay.active {
//     opacity: 1;
//     visibility: visible;
//   }
  
//   .loading-indicator {
//     display: inline-block;
//     width: 16px;
//     height: 16px;
//     border: 2px solid rgba(0, 0, 0, 0.2);
//     border-radius: 50%;
//     border-top-color: #3498db;
//     animation: spin 1s ease-in-out infinite;
//   }
  
//   @keyframes spin {
//     to { transform: rotate(360deg); }
//   }
  
//   .custom-tooltip {
//     background-color: rgba(44, 62, 80, 0.9);
//     color: white;
//     border: none;
//     border-radius: 4px;
//     padding: 8px 12px;
//     font-weight: bold;
//     box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
//   }
  
//   .leaflet-container {
//     background-color: #f0f0f0;
//   }
  
//   .layer-list {
//     margin-top: 15px;
//   }
  
//   .layer-item {
//     display: flex;
//     align-items: center;
//     margin-bottom: 8px;
//     padding: 8px;
//     border-radius: 4px;
//     transition: background-color 0.2s;
//   }
  
//   .layer-item:hover {
//     background-color: #f0f0f0;
//   }
  
//   .layer-item input {
//     margin-right: 8px;
//   }
  
//   .layer-item label {
//     font-size: 14px;
//     color: #333;
//     cursor: pointer;
//   }
  
//   .state-selector {
//     margin-top: 15px;
//     padding: 12px;
//     background-color: #f8f9fa;
//     border-radius: 6px;
//   }

//   .pulse-marker {
//     animation: pulse 1.5s infinite;
//   }

//   @keyframes pulse {
//     0% {
//       transform: scale(1);
//       opacity: 1;
//     }
//     50% {
//       transform: scale(1.1);
//       opacity: 0.8;
//     }
//     100% {
//       transform: scale(1);
//       opacity: 1;
//     }
//   }
// `;


// // const manifestUrl = 'https://drive.google.com/uc?id=1QzsItv97-xCyh9yPSsoMQJk71rl0TW4W&export=download';
// const manifestUrl = '/manifest.json';

// async function fetchManifest() {
//   const res = await fetch(manifestUrl);
//   return await res.json();
// }

// async function getGeoJsonFile(state, category) {
// const key = `${state}_${category}`.replace(/\s+/g, '_').toUpperCase();

//   const manifest = await fetchManifest();
//   console.log("manifetsttt:",manifest);
//   const entry = manifest.find(e =>
//     e.state.toUpperCase() === state.toUpperCase() &&
//     e.category.toLowerCase() === category.toLowerCase()
//   );
//   console.log("keyyyyy:",key);
//   if (!entry) throw new Error(`No manifest entry for \${key}`);

//   const storedVersion = (await Preferences.get({ key })).value;

//   if (storedVersion === entry.version) {
//     const cached = await Filesystem.readFile({
//       path: `\${key}.geojson`,
//       directory: Directory.Data
//     });
//     return JSON.parse(cached.data);
//   }

//   const res = await fetch(entry.url);
//   if (!res.ok) throw new Error(`Failed to fetch \${key}`);

//   const data = await res.text();

//   await Filesystem.writeFile({
//     path: `\${key}.geojson`,
//     data,
//     directory: Directory.Data
//   });

//   await Preferences.set({ key, value: entry.version });

//   return JSON.parse(data);
// }


// const App = () => {
//   const [selectedLayer, setSelectedLayer] = useState('states');
//   const [selectedState, setSelectedState] = useState('ALL');
//   const [stateName, setStateName] = useState('All States');
//   const [availableStates, setAvailableStates] = useState([]);
//   const [dataLayers, setDataLayers] = useState({
//     states: null,
//     districts: null,
//     subdistricts: null,
//     assembly: null,
//     parliament: null
//   });
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [isSidebarOpen, setIsSidebarOpen] = useState(false);
//   const mapRef = useRef();
//   const sidebarRef = useRef();
//   const toggleButtonRef = useRef();

//   // India bounds - restrict map to these coordinates
//   const indiaBounds = [
//     [6.7, 68.1],  // Southwest coordinates [latitude, longitude]
//     [37.6, 97.4]  // Northeast coordinates [latitude, longitude]
//   ];

//   const predefinedStates = [
//     { code: 'ALL', name: 'All States' },
//     { code: 'ANDHRA PRADESH', name: 'Andhra Pradesh' },
//     { code: 'ARUNACHAL PRADESH', name: 'Arunachal Pradesh' },
//     { code: 'ASSAM', name: 'Assam' },
//     { code: 'BIHAR', name: 'Bihar' },
//     { code: 'CHHATTISGARH', name: 'Chhattisgarh' },
//     { code: 'GOA', name: 'Goa' },
//     { code: 'GUJARAT', name: 'Gujarat' },
//     { code: 'HARYANA', name: 'Haryana' },
//     { code: 'HIMACHAL PRADESH', name: 'Himachal Pradesh' },
//     { code: 'JHARKHAND', name: 'Jharkhand' },
//     { code: 'KARNATAKA', name: 'Karnataka' },
//     { code: 'KERALA', name: 'Kerala' },
//     { code: 'MADHYA PRADESH', name: 'Madhya Pradesh' },
//     { code: 'MAHARASHTRA', name: 'Maharashtra' },
//     { code: 'MANIPUR', name: 'Manipur' },
//     { code: 'MEGHALAYA', name: 'Meghalaya' },
//     { code: 'MIZORAM', name: 'Mizoram' },
//     { code: 'NAGALAND', name: 'Nagaland' },
//     { code: 'ODISHA', name: 'Odisha' },
//     { code: 'PUNJAB', name: 'Punjab' },
//     { code: 'RAJASTHAN', name: 'Rajasthan' },
//     { code: 'SIKKIM', name: 'Sikkim' },
//     { code: 'TAMIL NADU', name: 'Tamil Nadu' },
//     { code: 'TELANGANA', name: 'Telangana' },
//     { code: 'TRIPURA', name: 'Tripura' },
//     { code: 'UTTAR PRADESH', name: 'Uttar Pradesh' },
//     { code: 'UTTARAKHAND', name: 'Uttarakhand' },
//     { code: 'WEST BENGAL', name: 'West Bengal' },
//     { code: 'DELHI', name: 'Delhi' },
//     { code: 'JAMMU AND KASHMIR', name: 'Jammu and Kashmir' },
//     { code: 'LADAKH', name: 'Ladakh' },
//     { code: 'PUDUCHERRY', name: 'Puducherry' },
//     { code: 'ANDAMAN AND NICOBAR ISLANDS', name: 'Andaman and Nicobar Islands' },
//     { code: 'CHANDIGARH', name: 'Chandigarh' },
//     { code: 'DADRA AND NAGAR HAVELI AND DAMAN AND DIU', name: 'Dadra and Nagar Haveli and Daman and Diu' },
//     { code: 'LAKSHADWEEP', name: 'Lakshadweep' }
//   ];

//   // Handle clicks outside the sidebar
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (
//         isSidebarOpen && 
//         sidebarRef.current && 
//         !sidebarRef.current.contains(event.target) &&
//         toggleButtonRef.current &&
//         !toggleButtonRef.current.contains(event.target)
//       ) {
//         setIsSidebarOpen(false);
//       }
//     };

//     document.addEventListener('mousedown', handleClickOutside);
//     return () => {
//       document.removeEventListener('mousedown', handleClickOutside);
//     };
//   }, [isSidebarOpen]);

//   // Set available states
//   useEffect(() => {
//     setAvailableStates(predefinedStates);
//   }, []);



  



//   // Fetch main GeoJSON data
//   // useEffect(() => {
//   //   const fetchGeoJson = async () => {
//   //     setLoading(true);
//   //     setError(null);
//   //     try {
//   //       let url;
//   //       switch (selectedLayer) {
//   //         case 'states':
//   //           url = '/INDIA_STATES.geojson';
//   //           break;
//   //         case 'districts':
//   //           url = '/INDIA_DISTRICTS.geojson';
//   //           break;
//   //         case 'subdistricts':
//   //           url = '/INDIAN_SUB_DISTRICTS.geojson';
//   //           break;
//   //         case 'assembly':
//   //           // Use the new file naming convention
//   //           url = selectedState === 'ALL' 
//   //             ? '/ALL_assembly.geojson' // If you have an "all states" assembly file
//   //             : `/${selectedState}_ASSEMBLY.geojson`;
//   //           break;
//   //         case 'parliament':
//   //           // Use the new file naming convention
//   //           url = selectedState === 'ALL' 
//   //             ? '/ALL_parliament.geojson' // If you have an "all states" parliament file
//   //             : `/${selectedState}_parliament.geojson`;
//   //           break;
//   //         default:
//   //           url = '/INDIA_STATES.geojson';
//   //       }

//   //       console.log(`Fetching from: ${url}`);
//   //       const response = await fetch(url);
//   //       if (!response.ok) throw new Error(`Failed to fetch ${selectedLayer} data from ${url}`);
//   //       const data = await response.json();
        
//   //       // Update the specific layer data
//   //       setDataLayers(prevLayers => ({
//   //         ...prevLayers,
//   //         [selectedLayer]: data
//   //       }));
//   //     } catch (err) {
//   //       console.error('Fetch error:', err);
//   //       setError('please select state.');
//   //       // Make sure your file ${selectedLayer === 'assembly' || selectedLayer === 'parliament' ? selectedState + '_' + selectedLayer + '.geojson' : ''} exists in the public folder.
//   //     } finally {
//   //       setLoading(false);
//   //     }
//   //   };

//   //   fetchGeoJson();
//   // }, [selectedLayer, selectedState]);

//   // useEffect(() => {
//   //   const fetchGeoJson = async () => {
//   //     setLoading(true);
//   //     setError(null);
//   //     try {
//   //       const stateKey = selectedState === 'ALL' ? 'ALL' : selectedState;
//   //       const data = await getGeoJsonFile(stateKey, selectedLayer);

//   //       setDataLayers(prev => ({
//   //         ...prev,
//   //         [selectedLayer]: data
//   //       }));
//   //     } catch (err) {
//   //       console.error('Fetch error:', err);
//   //       setError('Failed to load map data. Please try a different state or layer.');
//   //     } finally {
//   //       setLoading(false);
//   //     }
//   //   };

//   //   fetchGeoJson();
//   // }, [selectedLayer, selectedState]);


//   // useEffect(() => {
//   //   const fetchGeoJson = async () => {
//   //     setLoading(true);
//   //     setError(null);
  
//   //     try {
//   //       const stateKey = selectedState === 'ALL' ? 'ALL' : selectedState;
//   //       const manifestUrl = '/manifest.json'; // Local public folder path
//   //       // Fetch manifest and parse JSON
//   //       const manifestResponse = await fetch(manifestUrl);
//   //       const manifest = await manifestResponse.json();
//   //       console.log("manifesttturslll:",manifest);

//   //       // Validate manifest is an array
//   //       if (!Array.isArray(manifest)) {
//   //         throw new Error('Manifest format invalid: expected an array');
//   //       }
  
//   //       // Find matching entry
//   //       const entry = manifest.find(e =>
//   //         e.state.toUpperCase() === stateKey.toUpperCase() &&
//   //         e.category.toLowerCase() === selectedLayer.toLowerCase()
//   //       );
  
//   //       if (!entry) {
//   //         throw new Error(`No matching entry found for state: ${stateKey}, layer: ${selectedLayer}`);
//   //       }
//   //       console.log("statekeyy,selectedlayerrr:",stateKey,selectedLayer);
//   //       // Prepare cache key
//   //       const cacheKey = `${stateKey}_${selectedLayer}`.replace(/\s+/g, '_').toUpperCase();
  
//   //       // Check cached version
//   //       const storedVersion = (await Preferences.get({ key: cacheKey })).value;
  
//   //       // If version matches, load from cache
//   //       if (storedVersion === entry.version) {
//   //         const cachedFile = await Filesystem.readFile({
//   //           path: `${cacheKey}.geojson`,
//   //           directory: Directory.Data,
//   //         });
//   //         setDataLayers(prev => ({
//   //           ...prev,
//   //           [selectedLayer]: JSON.parse(cachedFile.data),
//   //         }));
//   //       } else {
//   //         // Fetch file from URL, cache and update version
//   //         const fileResponse = await fetch(entry.url);
//   //         if (!fileResponse.ok) throw new Error(`Failed to download file from ${entry.url}`);
  
//   //         const fileText = await fileResponse.text();
  
//   //         // Write to local file system
//   //         await Filesystem.writeFile({
//   //           path: `${cacheKey}.geojson`,
//   //           data: fileText,
//   //           directory: Directory.Data,
//   //         });
  
//   //         // Save version
//   //         await Preferences.set({ key: cacheKey, value: entry.version });
  
//   //         setDataLayers(prev => ({
//   //           ...prev,
//   //           [selectedLayer]: JSON.parse(fileText),
//   //         }));
//   //       }
//   //     } catch (error) {
//   //       console.error('Fetch error:', error);
//   //       setError(error.message || 'Failed to load map data. Please try again.');
//   //     } finally {
//   //       setLoading(false);
//   //     }
//   //   };
  
//   //   fetchGeoJson();
//   // }, [selectedLayer, selectedState]);
  





//   useEffect(() => {
//     const fetchGeoJson = async () => {
//       setLoading(true);
//       setError(null);
  
//       try {
//         const stateKey = selectedState === 'ALL' ? 'ALL' : selectedState;
        
//         // Fetch manifest from local public folder
//         let manifest;
//         try {
//           const manifestUrl = '/manifest.json'; // Path in your public folder
//           const manifestResponse = await fetch(manifestUrl);
//           if (!manifestResponse.ok) {
//             throw new Error(`Failed to load manifest: ${manifestResponse.status}`);
//           }
//           manifest = await manifestResponse.json();
//           console.log("Loaded manifest:", manifest);
//         } catch (manifestError) {
//           console.error("Manifest loading error:", manifestError);
//           throw new Error("Failed to load GeoJSON manifest file");
//         }
  
//         // Validate manifest is an array
//         if (!Array.isArray(manifest)) {
//           throw new Error('Manifest format invalid: expected an array');
//         }
  
//         // Find matching entry
//         const entry = manifest.find(e => 
//           e.state.toUpperCase() === stateKey.toUpperCase() && 
//           e.category.toLowerCase() === selectedLayer.toLowerCase()
//         );
  
//         if (!entry) {
//           throw new Error(`No matching entry found for state: ${stateKey}, layer: ${selectedLayer}`);
//         }
        
//         console.log("Found entry:", entry);
  
//         // Prepare cache key
//         const cacheKey = `${stateKey}_${selectedLayer}`.replace(/\s+/g, '_').toUpperCase();
  
//         try {
//           // Check cached version first
//           const storedVersion = localStorage.getItem(`${cacheKey}_version`);
//           const cachedData = localStorage.getItem(`${cacheKey}_data`);
  
//           // If version matches, load from cache
//           if (storedVersion === entry.version && cachedData) {
//             console.log("Loading from cache:", cacheKey);
//             setDataLayers(prev => ({
//               ...prev,
//               [selectedLayer]: JSON.parse(cachedData),
//             }));
//             setLoading(false);
//             return;
//           }
//         } catch (cacheError) {
//           console.warn("Cache error:", cacheError);
//           // Continue with fetch if cache fails
//         }
  
//         // ======= CORS WORKAROUND SOLUTION =======
//         // Use a CORS proxy
//         const corsProxyUrl = "https://corsproxy.io/?";
        
//         // Modify Dropbox URL to ensure direct download
//         let downloadUrl = entry.url;
//         if (downloadUrl.includes('dropbox.com') && !downloadUrl.includes('&raw=1')) {
//           // Replace dl=1 with raw=1 or add raw=1 to force direct download
//           downloadUrl = downloadUrl.replace('dl=1', 'raw=1');
//           if (!downloadUrl.includes('raw=1')) {
//             downloadUrl += '&raw=1';
//           }
//         }
        
//         const proxyUrl = corsProxyUrl + encodeURIComponent(downloadUrl);
//         console.log("Fetching from:", proxyUrl);
        
//         // Fetch with the proxy
//         const fileResponse = await fetch(proxyUrl);
        
//         if (!fileResponse.ok) {
//           throw new Error(`Failed to download file: ${fileResponse.status} ${fileResponse.statusText}`);
//         }
  
//         const fileText = await fileResponse.text();
//         const geoJsonData = JSON.parse(fileText);
  
//         // Cache the data
//         try {
//           localStorage.setItem(`${cacheKey}_data`, fileText);
//           localStorage.setItem(`${cacheKey}_version`, entry.version);
//         } catch (storageError) {
//           console.warn("LocalStorage error:", storageError);
//           // Continue even if caching fails
//         }
  
//         setDataLayers(prev => ({
//           ...prev,
//           [selectedLayer]: geoJsonData,
//         }));
        
//       } catch (error) {
//         console.error('Fetch error:', error);
//         setError(error.message || 'Failed to load map data. Please try again.');
//       } finally {
//         setLoading(false);
//       }
//     };
  
//     if (selectedLayer && selectedState) {
//       fetchGeoJson();
//     }
//   }, [selectedLayer, selectedState]);





//   // Effect to set map bounds after it's initialized
//   useEffect(() => {
//     if (mapRef.current) {
//       const map = mapRef.current;
//       // Set max bounds to India so user can't pan away
//       map.setMaxBounds(indiaBounds);
//       // Add padding to bounds
//       const paddedBounds = L.latLngBounds(indiaBounds).pad(0.1);
//       map.fitBounds(paddedBounds);
//       // Set min zoom level to prevent zooming out too far
//       map.setMinZoom(4);
//     }
//   }, [mapRef.current]);

//   // Update state name when selected state changes
//   useEffect(() => {
//     const stateObj = availableStates.find(state => state.code === selectedState);
//     if (stateObj) {
//       setStateName(stateObj.name);
//     }
//   }, [selectedState, availableStates]);

//   // Create layer description text based on the selected layer
//   const getLayerDescription = () => {
//     switch(selectedLayer) {
//       case 'states':
//         return 'Showing states and union territories of India';
//       case 'districts':
//         return 'Showing districts within Indian states';
//       case 'subdistricts':
//         return 'Showing sub-districts (tehsils/talukas) within districts';
//       case 'assembly':
//         return `Showing assembly constituencies ${selectedState !== 'ALL' ? `in ${stateName}` : 'across India'}`;
//       case 'parliament':
//         return `Showing parliamentary constituencies ${selectedState !== 'ALL' ? `in ${stateName}` : 'across India'}`;
//       default:
//         return 'Showing map of India';
//     }
//   };

//   return (
//     <>
//       <style>{appStyles}</style>
//       <div className="map-container">
//         {/* Toggle Button */}
//         <div 
//           className={`sidebar-toggle ${isSidebarOpen ? 'sidebar-open' : ''}`}
//           style={{ left: isSidebarOpen ? '300px' : '20px' }}
//           onClick={() => setIsSidebarOpen(!isSidebarOpen)}
//           ref={toggleButtonRef}
//         >
//           <div className="sidebar-icon" />
//         </div>

//         {/* Overlay for clicking outside */}
//         <div 
//           className={`overlay ${isSidebarOpen ? 'active' : ''}`} 
//           onClick={() => setIsSidebarOpen(false)}
//         />
        
//         {/* Sidebar */}
//         <div 
//           className="sidebar" 
//           ref={sidebarRef}
//           style={{
//             width: '300px',
//             padding: '80px 20px 20px 20px',
//             transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)'
//           }}
//         >
//           <h2 style={{ margin: '0 0 20px 0', color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>
//             India Map Explorer
//           </h2>
          
//           <div style={{ marginBottom: '20px' }}>
//             <h3 style={{ color: '#2c3e50', fontSize: '16px', marginBottom: '10px' }}>Map Layers</h3>
//             <div>
//               <label style={{ fontWeight: 'bold', color: '#555', display: 'block', marginBottom: '8px' }}>
//                 Select Geographic Level
//               </label>
//               <select
//                 value={selectedLayer}
//                 onChange={(e) => {
//                   setSelectedLayer(e.target.value);
//                   // Reset state selection when changing layer types
//                   if (['states', 'districts', 'subdistricts'].includes(e.target.value)) {
//                     setSelectedState('ALL');
//                   }
//                 }}
//                 style={{
//                   width: '100%',
//                   padding: '12px',
//                   borderRadius: '8px',
//                   border: '1px solid #ddd',
//                   backgroundColor: '#f8f9fa',
//                   boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
//                   outline: 'none',
//                   fontSize: '14px',
//                 }}
//               >
//                 <option value="states">States</option>
//                 <option value="districts">Districts</option>
//                 <option value="subdistricts">Subdistricts</option>
//                 <option value="assembly">Assembly Constituencies</option>
//                 <option value="parliament">Parliament Constituencies</option>
//               </select>
//             </div>
            
//             {/* State selector for assembly and parliament constituencies */}
//             {['assembly', 'parliament'].includes(selectedLayer) && availableStates.length > 0 && (
//               <div className="state-selector">
//                 <label style={{ fontWeight: 'bold', color: '#555', display: 'block', marginBottom: '8px' }}>
//                   Select State
//                 </label>
//                 <select
//                   value={selectedState}
//                   onChange={(e) => setSelectedState(e.target.value)}
//                   style={{
//                     width: '100%',
//                     padding: '12px',
//                     borderRadius: '8px',
//                     border: '1px solid #ddd',
//                     backgroundColor: '#fff',
//                     boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
//                     outline: 'none',
//                     fontSize: '14px',
//                   }}
//                 >
//                   {availableStates.map(state => (
//                     <option key={state.code} value={state.code}>
//                       {state.name}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             )}
            
//             <div style={{ 
//               marginTop: '15px', 
//               padding: '12px', 
//               backgroundColor: '#e8f4f8', 
//               borderRadius: '6px',
//               fontSize: '13px',
//               color: '#2980b9'
//             }}>
//               {getLayerDescription()}
//             </div>
//           </div>
          
//           {loading && (
//             <div style={{ margin: '20px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
//               <div className="loading-indicator"></div>
//               <span>Loading {selectedLayer}...</span>
//             </div>
//           )}
          
//           {error && (
//             <div style={{ 
//               margin: '20px 0', 
//               padding: '12px', 
//               backgroundColor: '#ffeeee', 
//               color: '#e74c3c', 
//               borderRadius: '8px',
//               border: '1px solid #e74c3c'
//             }}>
//               <strong>Error:</strong> {error}
//             </div>
//           )}
          
//           <div style={{ marginTop: '30px' }}>
//             <h3 style={{ color: '#2c3e50', fontSize: '16px', marginBottom: '10px' }}>Legend</h3>
//             <div style={{ 
//               padding: '15px', 
//               backgroundColor: '#f8f9fa', 
//               borderRadius: '8px',
//               border: '1px solid #e9ecef'
//             }}>
//               <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
//                 <div style={{ 
//                   width: '20px', 
//                   height: '20px', 
//                   backgroundColor: 'hsl(120, 70%, 80%)', 
//                   opacity: 0.7, 
//                   marginRight: '10px',
//                   borderRadius: '4px'
//                 }} />
//                 <span>Administrative Boundaries</span>
//               </div>
              
//               <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
//                 <div style={{ 
//                   width: '20px', 
//                   height: '20px', 
//                   backgroundColor: 'hsl(200, 70%, 80%)', 
//                   opacity: 0.7, 
//                   marginRight: '10px',
//                   borderRadius: '4px'
//                 }} />
//                 <span>Assembly Constituencies</span>
//               </div>
              
//               <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
//                 <div style={{ 
//                   width: '20px', 
//                   height: '20px', 
//                   backgroundColor: 'hsl(20, 70%, 80%)', 
//                   opacity: 0.7, 
//                   marginRight: '10px',
//                   borderRadius: '4px'
//                 }} />
//                 <span>Parliament Constituencies</span>
//               </div>
              
//               <div style={{ display: 'flex', alignItems: 'center' }}>
//                 <div style={{ 
//                   width: '20px', 
//                   height: '20px', 
//                   backgroundImage: 'url(https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png)',
//                   backgroundSize: 'contain',
//                   backgroundRepeat: 'no-repeat',
//                   marginRight: '10px'
//                 }} />
//                 <span>Your Location</span>
//               </div>
//             </div>
//           </div>
          
//           <div style={{ marginTop: '30px' }}>
//             <h3 style={{ color: '#2c3e50', fontSize: '16px', marginBottom: '10px' }}>Instructions</h3>
//             <ul style={{ padding: '0 0 0 20px', color: '#555' }}>
//               <li style={{ marginBottom: '8px' }}>Hover over any region to see its name</li>
//               <li style={{ marginBottom: '8px' }}>Click on any region for more details</li>
//               <li style={{ marginBottom: '8px' }}>Use the "My Location" button to find your current position</li>
//               <li style={{ marginBottom: '8px' }}>Select different boundary types from the dropdown</li>
//               <li>For assembly and parliament constituencies, select a specific state</li>
//             </ul>
//           </div>
          
//           <div style={{ marginTop: '30px', fontSize: '12px', color: '#7f8c8d', textAlign: 'center' }}>
//             <p>Map data is displayed in English</p>
//             <p>© {new Date().getFullYear()} India Map Explorer</p>
//           </div>
//         </div>

//         <MapContainer
//           center={[22.5937, 82.9629]} // Center of India
//           zoom={5}
//           style={{ height: '100%', width: '100%' }}
//           ref={mapRef}
//           maxBounds={indiaBounds}
//           maxBoundsViscosity={1.0} // Makes the bounds completely "sticky"
//           minZoom={4}
//           zoomControl={false}
//         >
//           {/* Custom TileLayer with English labels */}
//           <TileLayer
//             url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
//             attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
//             subdomains="abcd"
//             maxZoom={19}
//           />
          
//           {/* Conditionally render the GeoJSON based on selected layer */}
//           {dataLayers.states && selectedLayer === 'states' && !loading && !error && (
//             <GeoJsonLayer 
//               data={dataLayers.states} 
//               selectedLayer={selectedLayer}
//               layerType="administrative" 
//             />
//           )}
          
//           {dataLayers.districts && selectedLayer === 'districts' && !loading && !error && (
//             <GeoJsonLayer 
//               data={dataLayers.districts} 
//               selectedLayer={selectedLayer} 
//               layerType="administrative"
//             />
//           )}
          
//           {dataLayers.subdistricts && selectedLayer === 'subdistricts' && !loading && !error && (
//             <GeoJsonLayer 
//               data={dataLayers.subdistricts} 
//               selectedLayer={selectedLayer}
//               layerType="administrative" 
//             />
//           )}
          
//           {dataLayers.assembly && selectedLayer === 'assembly' && !loading && !error && (
//             <GeoJsonLayer 
//               data={dataLayers.assembly} 
//               selectedLayer={selectedLayer}
//               layerType="assembly" 
//             />
//           )}
          
//           {dataLayers.parliament && selectedLayer === 'parliament' && !loading && !error && (
//             <GeoJsonLayer 
//               data={dataLayers.parliament} 
//               selectedLayer={selectedLayer}
//               layerType="parliament" 
//             />
//           )}
          
//           <LocationMarker geoJsonData={dataLayers[selectedLayer]} selectedLayer={selectedLayer} />
          
//           {/* Custom zoom control position */}
//           <ZoomControl position="bottomleft" />
          
//           <div style={{ 
//             position: 'absolute', 
//             bottom: '20px', 
//             left: '80px', 
//             zIndex: 999,
//             backgroundColor: 'rgba(255, 255, 255, 0.8)', 
//             padding: '8px 12px', 
//             borderRadius: '4px', 
//             fontSize: '12px',
//             boxShadow: '0 1px 5px rgba(0,0,0,0.2)'
//           }}>
//             {getLayerDescription()}
//           </div>
//         </MapContainer>
//       </div>
//     </>
//   );
// };

// export default App;






import React from 'react';
import GeojsonMap from './components/Maps/GeojsonMap'
import Maps from './components/Maps/Maps';
function App() {
  return (
    <div>
      <GeojsonMap />
      {/* <Maps/> */}
    </div>
  );
}

export default App;



// import { BrowserRouter, Routes, Route } from "react-router-dom";
// import Register from "./components/Maps/Register";
// import Login from "./components/Maps/Login";
// import RoleSelection from "./components/Maps/RoleSelection";
// import ProviderDashboard from "./components/Maps/ProviderDashboard";
// import RequesterDashboard from "./components/Maps/RequesterDashboard";

// function App() {
//   return (
//     <BrowserRouter>
//       <Routes>
//         <Route path="/" element={<Login />} />
//         <Route path="/register" element={<Register />} />
//         <Route path="/select-role" element={<RoleSelection />} />
//         <Route path="/provider/dashboard" element={<ProviderDashboard />} />
//         <Route path="/requester/dashboard" element={<RequesterDashboard />} />
//       </Routes>
//     </BrowserRouter>
//   );
// }

// export default App;

