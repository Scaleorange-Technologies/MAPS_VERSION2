import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { App } from '@capacitor/app';
import { getGeoJsonUniversalCache } from './geojsonfileCache';

const GEOJSON_LINKS_URL = "https://raw.githubusercontent.com/Scaleorange-Technologies/MAPS/main/capacitor/custom_maps/public/geojsonLinks.json";
const CACHE_KEY = "geojsonLinksCache";

// Custom icon for user location
const userLocationIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -30],
});

// Custom icon for shared location
const sharedLocationIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3177/3177361.png',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -34],
});

if (typeof window !== "undefined" && !window._externalLocationHandlerSet) {
    window._externalLocationHandlerSet = true;
    window.handleExternalLocation = (lat, lng) => {
        window.dispatchEvent(new CustomEvent("externalLocation", { detail: { lat, lng } }));
    };
}

const LocationMarker = ({ position, isShared = false }) => {
    const map = useMap();
    useEffect(() => {
        if (position) {
            map.setView(position, 12);
        }
    }, [position, map]);
    return position ? (
        <Marker position={position} icon={isShared ? sharedLocationIcon : userLocationIcon}>
            <Popup>
                {isShared ? 'Shared Location' : 'Your Current Location'}
                <br />
                Lat: {position[0].toFixed(6)}, Lng: {position[1].toFixed(6)}
            </Popup>
        </Marker>
    ) : null;
};

const GeoJSONUpdater = ({ data }) => {
    const map = useMap();
    useEffect(() => {
        if (data && data.features && data.features.length > 0) {
            const geoJsonLayer = L.geoJSON(data);
            map.fitBounds(geoJsonLayer.getBounds());
        }
    }, [data, map]);
    return null;
};

export default function IndiaMapExplorer() {
    const [links, setLinks] = useState({});
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedState, setSelectedState] = useState(null);
    const [selectedLayer, setSelectedLayer] = useState(null);
    const [geojsonData, setGeojsonData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedLabel, setSelectedLabel] = useState('');
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
    const mapRef = useRef(null);
    const sidebarRef = useRef(null);


    useEffect(() => {
        const fetchGeoJsonLinks = async () => {
          try {
            const response = await fetch(GEOJSON_LINKS_URL);
            if (!response.ok) {
              throw new Error('Network response was not ok');
            }
            const data = await response.json();
            console.log('Fetched GeoJSON links:', data);
          } catch (error) {
            console.error('Error fetching GeoJSON links:', error);
          }
        };
    
        fetchGeoJsonLinks();
      }, []);


    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        setError(null);

        // 1. Synchronously load from localStorage for fastest display
        let localCache = null;
        if (typeof window !== "undefined" && window.localStorage) {
            try {
                localCache = window.localStorage.getItem(CACHE_KEY);
                if (localCache) {
                    const cacheObj = JSON.parse(localCache);
                    setLinks(cacheObj);
                    setCategories(Object.keys(cacheObj));
                    setLoading(false);
                }
            } catch { }
        }

        // 2. In background: fetch from Capacitor Preferences (if available) and then from network
        (async () => {
            // Capacitor Preferences cache check (might be newer than localStorage)
            let capCache = null;
            if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences) {
                try {
                    const { value } = await window.Capacitor.Plugins.Preferences.get({ key: CACHE_KEY });
                    capCache = value;
                    if (capCache && capCache !== localCache && isMounted) {
                        const capObj = JSON.parse(capCache);
                        setLinks(capObj);
                        setCategories(Object.keys(capObj));
                        setLoading(false);
                        window.localStorage.setItem(CACHE_KEY, capCache);
                    }
                } catch { }
            }

            // 3. Always fetch from network in background
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
                        setLoading(false);
                        window.localStorage.setItem(CACHE_KEY, fetchedStr);
                        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences) {
                            await window.Capacitor.Plugins.Preferences.set({ key: CACHE_KEY, value: fetchedStr });
                        }
                    }
                })
                .catch(() => {
                    if (!localCache && !capCache && isMounted) {
                        setError("Could not fetch data and no cache found.");
                        setLoading(false);
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

    useEffect(() => {
        if (selectedCategory) {
            setSelectedState(null);
            setSelectedLayer(null);
            setGeojsonData(null);
            setSelectedLabel('');
        }
    }, [selectedCategory]);

    // --- THIS is the key part: use Filesystem cache for GeoJSON ---
    useEffect(() => {
        if (!selectedCategory || !links[selectedCategory]) return;
        if (selectedCategory === 'STATES' && !selectedState) return;
        if (!selectedLayer) return;

        let url;
        if (selectedCategory === 'STATES') {
            if (!links[selectedCategory][selectedState]) return;
            url = links[selectedCategory][selectedState][selectedLayer];
        } else {
            url = links[selectedCategory][selectedLayer];
        }
        if (!url) {
            setError(`No URL found for the selected options`);
            return;
        }

        setLoading(true);
        setError(null);

        let isMounted = true;
        getGeoJsonUniversalCache(url)
            .then(data => {
                if (!isMounted) return;
                setGeojsonData(data);
                setSelectedLabel(selectedState ? `${selectedState} - ${selectedLayer}` : selectedLayer);
                setLoading(false);
            })
            .catch(err => {
                if (!isMounted) return;
                setError(`Failed to load map data: ${err.message}`);
                setLoading(false);
                setGeojsonData(null);
            });
        return () => { isMounted = false; };
    }, [selectedCategory, selectedState, selectedLayer, links]);

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

        // Cleanup function
        return () => {
            if (backButtonListener) {
                backButtonListener.remove();
            }
        };
    }, []);

    useEffect(() => {
        // Automatically get location when the app loads
        handleGetLocation();
        // eslint-disable-next-line
    }, []); // Empty dependency array means this runs only once on mount

    // Get user's current location (optimized for Capacitor)
    const handleGetLocation = () => {
        setLocationLoading(true);
        setError(null);
        setShareDisabled(true);

        // First check if running in Capacitor
        if (window.Capacitor && window.Capacitor.isNativePlatform()) {
            getCapacitorLocation();
        } else {
            // Fallback to browser geolocation
            getBrowserLocation();
        }
    };

    // Get location using Capacitor Geolocation plugin
    const getCapacitorLocation = async () => {
        try {
            // Make sure to import Geolocation correctly
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

            // Here you would normally perform reverse geocoding
            // For now we'll use a placeholder value
            determineCurrentState([latitude, longitude]);

        } catch (err) {
            console.error('Capacitor Geolocation error:', err);
            setError(`Location access error: ${err.message}`);
            setLocationLoading(false);

            // Fall back to browser geolocation if Capacitor fails
            getBrowserLocation();
        }
    };

    // Get location using browser geolocation API
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

                // Determine the state based on coordinates
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

    // Start watching location
    const startWatchingLocation = () => {
        setError(null);
        setIsLocationWatching(true);

        if (window.Capacitor && window.Capacitor.isNativePlatform()) {
            watchLocationCapacitor();
        } else {
            watchLocationBrowser();
        }
    };

    // Watch location using Capacitor
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

            // Fall back to browser
            watchLocationBrowser();
        }
    };

    // Watch location using browser API
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

    // Stop watching location
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

    // Share location
    const shareLocation = async () => {
        if (!userLocation) return;

        setSharedLocation(userLocation);
        setIsLocationShared(true);

        // If on a Capacitor app, use native share functionality
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
            // Use Web Share API if available
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
            // Fallback for browsers that don't support sharing
            // Copy location to clipboard
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

    // Determine the current state based on coordinates (would normally use reverse geocoding)
    const determineCurrentState = (coordinates) => {
        setCurrentState('');
    };

    // Handle category selection
    const handleCategorySelect = (category) => {
        if (category === selectedCategory) {
            setSelectedCategory(null);
        } else {
            // When selecting a new category, clear previous state
            setSelectedCategory(category);
            setSelectedState(null);
            setSelectedLayer(null);
            setGeojsonData(null);
            setSelectedLabel('');
        }
    };

    // Handle state selection
    const handleStateSelect = (state) => {
        if (state === selectedState) {
            setSelectedState(null);
            setSelectedLayer(null);
            setGeojsonData(null);
            setSelectedLabel('');
        } else {
            setSelectedState(state);
            setSelectedLayer(null);
            setGeojsonData(null);
            setSelectedLabel('');
        }
    };

    // Handle layer selection
    const handleLayerSelect = (layer) => {
        setSelectedLayer(layer);
    };

    // On map feature click
    const onEachFeature = (feature, layer) => {
        if (feature.properties) {
            const popupContent = Object.entries(feature.properties)
                .filter(([key]) => key !== 'shape_area' && key !== 'shape_length')
                .map(([key, value]) => `<strong>${key}:</strong> ${value}`)
                .join('<br>');

            layer.bindPopup(popupContent);
        }
    };

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100vw', position: 'relative' }}>
            {/* Sidebar Toggle Button */}
            <button
                className="sidebar-toggle-btn"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                style={{
                    position: 'absolute',
                    left: '20px',
                    top: '20px',
                    zIndex: 1000,
                    borderRadius: '8px',
                    padding: '10px 12px',
                    backgroundColor: 'white',
                    border: 'none',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    transition: 'all 0.3s'
                }}
            >
                {sidebarOpen ? '✕' : '≡'}
            </button>

            {/* Location Control Buttons */}
            <div style={{
                position: 'absolute',
                right: '20px',
                top: '20px',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
            }}>
                <button
                    onClick={isLocationWatching ? stopWatchingLocation : handleGetLocation}
                    disabled={locationLoading}
                    style={{
                        padding: '10px 15px',
                        backgroundColor: isLocationWatching ? '#e91e63' : locationLoading ? '#a5d6a7' : '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: locationLoading ? 'default' : 'pointer',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                        transition: 'all 0.2s ease'
                    }}
                >
                    <span style={{ marginRight: '5px' }}>
                        {isLocationWatching ? '⏹️' : locationLoading ? '⏳' : '📍'}
                    </span>
                    {isLocationWatching ? 'Stop Tracking' : locationLoading ? 'Getting Location...' : 'Get My Location'}
                </button>

                {!isLocationWatching && userLocation && (
                    <button
                        onClick={startWatchingLocation}
                        style={{
                            padding: '10px 15px',
                            backgroundColor: '#2196F3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <span style={{ marginRight: '5px' }}>🔄</span>
                        Track Location
                    </button>
                )}

                <button
                    onClick={shareLocation}
                    disabled={shareDisabled}
                    style={{
                        padding: '10px 15px',
                        backgroundColor: shareDisabled ? '#cccccc' : '#9C27B0',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: shareDisabled ? 'default' : 'pointer',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: shareDisabled ? 'none' : '0 2px 6px rgba(0,0,0,0.3)',
                        transition: 'all 0.2s ease',
                        opacity: shareDisabled ? 0.7 : 1
                    }}
                >
                    <span style={{ marginRight: '5px' }}>🔗</span>
                    Share Location
                </button>
            </div>

            {/* Sidebar */}
            <div
                ref={sidebarRef}
                style={{
                    width: '300px',
                    height: '100vh',
                    overflowY: 'auto',
                    borderRight: '1px solid #ccc',
                    padding: '15px',
                    background: 'white',
                    boxShadow: '2px 0 10px rgba(0,0,0,0.2)',
                    position: 'absolute',
                    zIndex: 999,
                    left: sidebarOpen ? '0' : '-300px',
                    transition: 'left 0.3s ease-in-out',
                }}
            >
                <h2 style={{ margin: '30px 0 20px 0', color: '#333', textAlign: 'center' }}>India Map Explorer</h2>

                {error && (
                    <div style={{
                        padding: '12px',
                        marginBottom: '15px',
                        backgroundColor: '#ffebee',
                        color: '#c62828',
                        borderRadius: '6px',
                        fontSize: '14px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    }}>
                        {error}
                    </div>
                )}

                {/* Location Info Panel */}
                {userLocation && (
                    <div style={{
                        padding: '12px',
                        marginBottom: '15px',
                        backgroundColor: '#e8f5e9',
                        borderRadius: '6px',
                        fontSize: '14px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    }}>
                        <h4 style={{ margin: '0 0 8px 0', color: '#2e7d32' }}>Your Location</h4>
                        <div style={{ marginBottom: '4px' }}>
                            <strong>Latitude:</strong> {userLocation[0].toFixed(6)}
                        </div>
                        <div style={{ marginBottom: '4px' }}>
                            <strong>Longitude:</strong> {userLocation[1].toFixed(6)}
                        </div>
                        {locationAccuracy && (
                            <div style={{ marginBottom: '4px' }}>
                                <strong>Accuracy:</strong> ±{locationAccuracy.toFixed(1)} meters
                            </div>
                        )}
                        {currentState && (
                            <div style={{ marginBottom: '4px' }}>
                                <strong>State:</strong> {currentState}
                            </div>
                        )}
                        <div style={{ marginTop: '8px', fontSize: '13px', color: '#4caf50' }}>
                            {isLocationWatching ? '📡 Live tracking active' : '📍 Location captured'}
                        </div>
                    </div>
                )}

                <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ margin: '0 0 15px 0', color: '#444', borderBottom: '2px solid #eee', paddingBottom: '8px' }}>Map Layers</h3>
                    {categories.map(category => (
                        <div key={category} style={{ marginBottom: '12px' }}>
                            <div
                                onClick={() => handleCategorySelect(category)}
                                style={{
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    padding: '10px 12px',
                                    backgroundColor: selectedCategory === category ? '#e8f4fd' : '#f5f5f5',
                                    color: selectedCategory === category ? '#0277bd' : '#555',
                                    borderRadius: '6px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <span>{category}</span>
                                <span>{selectedCategory === category ? '▼' : '▶'}</span>
                            </div>

                            {selectedCategory === category && (
                                <div style={{
                                    marginTop: '8px',
                                    paddingLeft: '12px',
                                    borderLeft: '2px solid #e0e0e0',
                                    marginLeft: '5px'
                                }}>
                                    {category === 'STATES' ? (
                                        // For States, show list of states first
                                        Object.keys(links[category] || {}).map(state => (
                                            <div key={state} style={{ marginBottom: '10px' }}>
                                                <div
                                                    onClick={() => handleStateSelect(state)}
                                                    style={{
                                                        cursor: 'pointer',
                                                        backgroundColor: selectedState === state ? '#e1f5fe' : '#f9f9f9',
                                                        color: selectedState === state ? '#0288d1' : '#666',
                                                        padding: '8px 12px',
                                                        borderRadius: '5px',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        transition: 'all 0.2s ease',
                                                        boxShadow: selectedState === state ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                                                    }}
                                                >
                                                    <span>{state}</span>
                                                    {selectedState === state && <span>▼</span>}
                                                </div>

                                                {selectedState === state && (
                                                    <div style={{
                                                        paddingLeft: '12px',
                                                        marginTop: '6px',
                                                        borderLeft: '1px solid #e0e0e0',
                                                        marginLeft: '5px'
                                                    }}>
                                                        {Object.keys(links[category][state] || {}).map(layer => (
                                                            <div
                                                                key={layer}
                                                                onClick={() => handleLayerSelect(layer)}
                                                                style={{
                                                                    cursor: 'pointer',
                                                                    backgroundColor: selectedLayer === layer ? '#b3e5fc' : 'transparent',
                                                                    color: selectedLayer === layer ? '#01579b' : '#777',
                                                                    padding: '6px 12px',
                                                                    borderRadius: '4px',
                                                                    marginTop: '4px',
                                                                    transition: 'all 0.2s ease',
                                                                    fontWeight: selectedLayer === layer ? '500' : 'normal'
                                                                }}
                                                            >
                                                                {layer}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        // For other categories, just show the layers
                                        Object.keys(links[category] || {}).map(layer => (
                                            <div
                                                key={layer}
                                                onClick={() => handleLayerSelect(layer)}
                                                style={{
                                                    cursor: 'pointer',
                                                    backgroundColor: selectedLayer === layer ? '#e1f5fe' : 'transparent',
                                                    color: selectedLayer === layer ? '#0288d1' : '#666',
                                                    padding: '8px 12px',
                                                    borderRadius: '5px',
                                                    marginTop: '6px',
                                                    transition: 'all 0.2s ease',
                                                    fontWeight: selectedLayer === layer ? '500' : 'normal'
                                                }}
                                            >
                                                {layer}
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                <div style={{
                    fontSize: '14px',
                    color: '#666',
                    backgroundColor: '#f9f9f9',
                    padding: '12px',
                    borderRadius: '6px',
                    border: '1px dashed #ddd'
                }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#555' }}>Instructions:</h4>
                    <ul style={{ paddingLeft: '20px', margin: '0' }}>
                        <li>Select a category from the list</li>
                        <li>For states, select a state then a boundary type</li>
                        <li>Click on any region for more details</li>
                        <li>Use "Get My Location" to see your position</li>
                        <li>Enable "Track Location" for live updates</li>
                        <li>Share your location with the share button</li>
                    </ul>
                </div>
            </div>

            {/* Map Area */}
            <div style={{ flex: 1, height: '100%', width: '100%', position: 'relative' }}>
                <MapContainer
                    center={[22.9734, 78.6569]} // Center of India
                    zoom={5}
                    style={{ height: '100%', width: '100%' }}
                    whenCreated={mapInstance => mapRef.current = mapInstance}
                    zoomControl={false} // Disable default zoom controls
                >
                    <ZoomControl position="bottomright" /> {/* Place zoom controls at bottom right */}

                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    /> 
                    {/* <TileLayer
                        url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png"
                        attribution='© <a href="https://stadiamaps.com/">Stadia Maps</a>, © <a href="https://openmaptiles.org/">OpenMapTiles</a> © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
                    /> */}
                    {/* <TileLayer
                        url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png"
                        attribution='© <a href="https://stadiamaps.com/">Stadia Maps</a>, © <a href="https://openmaptiles.org/">OpenMapTiles</a> © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
                    /> */}
                    {geojsonData && (
                        <GeoJSON
                            key={selectedLabel} // Add key to force re-render when selection changes
                            data={geojsonData}
                          
                            style={() => ({
                                fillColor: selectedCategory === 'STATES'
                                    ? 'rgba(33, 150, 243, 0.3)' // blue with 30% opacity
                                    : selectedCategory === 'DISTRICTS'
                                    ? 'rgba(76, 175, 80, 0.3)' // green with 30% opacity
                                    : selectedCategory === 'ASSEMBLY_CONSTITUENCIES'
                                    ? 'rgba(156, 39, 176, 0.3)' // purple with 30% opacity
                                    : 'rgba(255, 152, 0, 0.3)', // orange with 30% opacity
                                weight: 2,
                                opacity: 1,
                                color: '#333',
                                dashArray: '3',
                                fillOpacity: 0.4 // You can keep this for additional control, or set to 1
                            })}
                            onEachFeature={onEachFeature}
                            pointToLayer={(feature, latlng) =>
                                L.circleMarker(latlng, {
                                    radius: 8,
                                    // fillColor: "#ff5722",
                                    fillColor: "rgba(255, 87, 34, 0.5)", // orange with 50% opacity
                                    color: "#fff",
                                    weight: 1,
                                    opacity: 1,
                                    fillOpacity: 0.8
                                }).bindPopup(
                                    Object.entries(feature.properties)
                                        .filter(([key]) => key !== 'shape_area' && key !== 'shape_length')
                                        .map(([key, value]) => `<strong>${key}:</strong> ${value}`)
                                        .join('<br>')
                                )
                            }
                        />
                    )}
                    {userLocation && <LocationMarker position={userLocation} />}
                    {sharedLocation && sharedLocation !== userLocation && <LocationMarker position={sharedLocation} isShared />}
                    {/* Ensure map fits bounds when geojsonData changes */}
                    {geojsonData && <GeoJSONUpdater data={geojsonData} />}
                </MapContainer>
                {/* Map loading indicator */}
                {loading && (
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        zIndex: 1200,
                        transform: 'translate(-50%, -50%)',
                        background: 'rgba(255,255,255,0.95)',
                        padding: '28px 44px',
                        borderRadius: '12px',
                        boxShadow: '0 4px 16px rgba(44,62,80,0.18)',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        color: '#2196f3',
                        textAlign: 'center'
                    }}>
                        Loading map...
                    </div>
                )}
            </div>
        </div>
    );
}