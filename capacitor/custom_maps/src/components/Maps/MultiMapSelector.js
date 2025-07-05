import React, {useState,useEffect} from "react";
import {  Marker, Popup, useMap} from 'react-leaflet';
import { isGeoJsonCached } from "../../utils/GeoJsonCacheManager";


// Custom icon for user location
const userLocationIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -30],
});

const sharedLocationIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3177/3177361.png',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -34],
});

export const MultiMapSelector = ({
    links,
    selectedMaps,
    onMapToggle,
    loadingStates,
    downloadingStates,
    cachedStates,
    onCacheStatusUpdate // Add this prop to update parent component
}) => {
    const [expandedCategories, setExpandedCategories] = useState({});
    const [expandedStates, setExpandedStates] = useState({});
    const [expandedSubCategories, setExpandedSubCategories] = useState({});
    const [isCheckingCache, setIsCheckingCache] = useState(false);
    useEffect(() => {
        const checkCacheStatus = async () => {
            if (!links || Object.keys(links).length === 0) return;
            
            setIsCheckingCache(true);
            try {
                const cacheStatus = await checkAllLayersCacheStatus(links);
                // Update parent component with cache status
                if (onCacheStatusUpdate) {
                    onCacheStatusUpdate(cacheStatus);
                }
            } catch (error) {
                console.error('Error checking cache status:', error);
            } finally {
                setIsCheckingCache(false);
            }
        };

        checkCacheStatus();
    }, [links]);
    const toggleCategory = (category) => {
        setExpandedCategories(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

    const toggleState = (state) => {
        setExpandedStates(prev => ({
            ...prev,
            [state]: !prev[state]
        }));
    };

    const toggleSubCategory = (category, state, subCategory) => {
        const key = `${category}-${state}-${subCategory}`;
        setExpandedSubCategories(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };


    const getMapKey = (category, state, layer, subCategory = null) => {
        if (subCategory) {
            return `${category}-${state}-${subCategory}-${layer}`;
        }
        return state ? `${category}-${state}-${layer}` : `${category}-${layer}`;
    };


    const getLayerStatus = (mapKey) => {
        console.log(`Status check for ${mapKey}:`, {
            downloading: downloadingStates[mapKey],
            loading: loadingStates[mapKey],
            selected: selectedMaps[mapKey],
            cached: cachedStates?.[mapKey]
        });
        
        if (downloadingStates[mapKey]) return { icon: '⬇️', color: '#ff9800' };
        if (loadingStates[mapKey]) return { icon: '⏳', color: '#2196f3' };
        if (selectedMaps[mapKey]) return { icon: '✅', color: '#4caf50' };
        if (cachedStates?.[mapKey]) return { icon: '💾', color: '#9c27b0' };
        return { icon: '⚪', color: '#9e9e9e' };
    };

    // const getLayerStatus = (mapKey) => {
    //     if (downloadingStates[mapKey]) return { icon: '⬇️', color: '#ff9800' };
    //     if (loadingStates[mapKey]) return { icon: '⏳', color: '#2196f3' };
    //     if (selectedMaps[mapKey]) return { icon: '✅', color: '#4caf50' };
    //     if (cachedStates?.[mapKey]) return { icon: '💾', color: '#9c27b0' }; // ← even if not selected
    //     return { icon: '⚪', color: '#9e9e9e' };
    //   };      

    // Helper function to check if an object contains URLs (has string values)
    const hasDirectUrls = (obj) => {
        return Object.values(obj).some(value => typeof value === 'string');
    };

    if (isCheckingCache) {
        return (
            <div style={{ 
                padding: '20px', 
                textAlign: 'center',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
            }}>
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '10px'
                }}>
                    <span style={{ fontSize: '16px' }}>🔍</span>
                    <span>Checking cache status...</span>
                </div>
            </div>
        );
    }
    // Helper function to render layer items
    const renderLayerItem = (layer, url, mapKey, category, state = null, subCategory = null) => {
        const status = getLayerStatus(mapKey);
        
        return (
            <div
                key={layer}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 12px',
                    margin: '4px 0',
                    backgroundColor: selectedMaps[mapKey] ? '#e8f5e9' : '#fafafa',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: selectedMaps[mapKey] ? '1px solid #4caf50' : '1px solid #e0e0e0'
                }}
                onClick={() => onMapToggle(category, layer, state, subCategory, url)}
            >
                <input
                    type="checkbox"
                    checked={selectedMaps[mapKey] || false}
                    onChange={() => {}}
                    style={{
                        marginRight: '12px',
                        transform: 'scale(1.2)',
                        cursor: 'pointer'
                    }}
                />
                <span style={{
                    flex: 1,
                    fontSize: state ? '12px' : '14px',
                    fontWeight: selectedMaps[mapKey] ? '500' : 'normal'
                }}>
                    {layer}
                </span>
                <span style={{
                    fontSize: '12px',
                    color: status.color,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                }}>
                    {status.icon}
                </span>
            </div>
        );
    };

    // Helper function to render sub-category content
    const renderSubCategory = (category, state, subCategory, subCategoryData) => {
        const subCategoryKey = `${category}-${state}-${subCategory}`;
        const isExpanded = expandedSubCategories[subCategoryKey];

        return (
            <div key={subCategory} style={{ marginBottom: '8px' }}>
                <div
                    onClick={() => toggleSubCategory(category, state, subCategory)}
                    style={{
                        cursor: 'pointer',
                        backgroundColor: isExpanded ? '#e3f2fd' : '#f5f5f5',
                        color: isExpanded ? '#1976d2' : '#666',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.2s ease',
                        border: '1px solid #e0e0e0',
                        fontSize: '12px'
                    }}
                >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        📁 {subCategory}
                    </span>
                    <span style={{ fontSize: '10px' }}>
                        {isExpanded ? '▼' : '▶'}
                    </span>
                </div>

                {isExpanded && (
                    <div style={{
                        paddingLeft: '16px',
                        marginTop: '6px',
                        borderLeft: '2px solid #e0e0e0',
                        marginLeft: '8px'
                    }}>
                        {Object.entries(subCategoryData).map(([layer, url]) => {
                            const mapKey = getMapKey(category, state, layer, subCategory);
                            return renderLayerItem(layer, url, mapKey, category, state, subCategory);
                        })}
                    </div>
                )}
            </div>
        );
    };

    return (
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
                🗺️ Multi-Map Layers
            </h3>

            {Object.keys(links).map(category => (
                <div key={category} style={{ marginBottom: '12px' }}>
                    <div
                        onClick={() => toggleCategory(category)}
                        style={{
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            padding: '12px 16px',
                            backgroundColor: expandedCategories[category] ? '#e8f4fd' : '#f8f9fa',
                            color: expandedCategories[category] ? '#0277bd' : '#555',
                            borderRadius: '8px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                            transition: 'all 0.2s ease',
                            border: '1px solid #e9ecef'
                        }}
                    >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            📂 {category}
                        </span>
                        <span style={{ fontSize: '12px' }}>
                            {expandedCategories[category] ? '▼' : '▶'}
                        </span>
                    </div>

                    {expandedCategories[category] && (
                        <div style={{
                            marginTop: '8px',
                            paddingLeft: '16px',
                            borderLeft: '3px solid #e3f2fd',
                            marginLeft: '8px'
                        }}>
                            {category === 'STATES' ? (
                                // Handle States category
                                Object.keys(links[category] || {}).map(state => (
                                    <div key={state} style={{ marginBottom: '12px' }}>
                                        <div
                                            onClick={() => toggleState(state)}
                                            style={{
                                                cursor: 'pointer',
                                                backgroundColor: expandedStates[state] ? '#e1f5fe' : '#f9f9f9',
                                                color: expandedStates[state] ? '#0288d1' : '#666',
                                                padding: '10px 14px',
                                                borderRadius: '6px',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                transition: 'all 0.2s ease',
                                                border: '1px solid #e0e0e0'
                                            }}
                                        >
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                🏛️ {state}
                                            </span>
                                            <span style={{ fontSize: '11px' }}>
                                                {expandedStates[state] ? '▼' : '▶'}
                                            </span>
                                        </div>

                                        {expandedStates[state] && (
                                            <div style={{
                                                paddingLeft: '16px',
                                                marginTop: '8px',
                                                borderLeft: '2px solid #e0e0e0',
                                                marginLeft: '8px'
                                            }}>
                                                {Object.entries(links[category][state] || {}).map(([layer, layerData]) => {
                                                    // Check if this layer has direct URLs or sub-categories
                                                    if (hasDirectUrls(layerData)) {
                                                        // Direct URLs - render as clickable items
                                                        const urlEntries = Object.entries(layerData);
                                                        if (urlEntries.length > 0) {
                                                            const [url, version] = urlEntries[0]; // Take the first URL
                                                            const mapKey = getMapKey(category, state, layer);
                                                            return renderLayerItem(layer, url, mapKey, category, state);
                                                        }
                                                        return null;
                                                    } else {
                                                        // Sub-categories - render as expandable sections
                                                        return renderSubCategory(category, state, layer, layerData);
                                                    }
                                                })}
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                // Handle other categories (like INDIA)
                                Object.entries(links[category] || {}).map(([layer, layerData]) => {
                                    // Check if this layer has direct URLs or sub-categories
                                    if (hasDirectUrls(layerData)) {
                                        // Direct URLs - render as clickable items
                                        const urlEntries = Object.entries(layerData);
                                        if (urlEntries.length > 0) {
                                            const [url, version] = urlEntries[0]; // Take the first URL
                                            const mapKey = getMapKey(category, null, layer);
                                            return renderLayerItem(layer, url, mapKey, category);
                                        }
                                        return null;
                                    } else {
                                        // Sub-categories - render as expandable sections
                                        const subCategoryKey = `${category}-${layer}`;
                                        const isExpanded = expandedSubCategories[subCategoryKey];

                                        return (
                                            <div key={layer} style={{ marginBottom: '12px' }}>
                                                <div
                                                    onClick={() => setExpandedSubCategories(prev => ({
                                                        ...prev,
                                                        [subCategoryKey]: !prev[subCategoryKey]
                                                    }))}
                                                    style={{
                                                        cursor: 'pointer',
                                                        backgroundColor: isExpanded ? '#e3f2fd' : '#f5f5f5',
                                                        color: isExpanded ? '#1976d2' : '#666',
                                                        padding: '10px 14px',
                                                        borderRadius: '6px',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        transition: 'all 0.2s ease',
                                                        border: '1px solid #e0e0e0'
                                                    }}
                                                >
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        📁 {layer}
                                                    </span>
                                                    <span style={{ fontSize: '11px' }}>
                                                        {isExpanded ? '▼' : '▶'}
                                                    </span>
                                                </div>

                                                {isExpanded && (
                                                    <div style={{
                                                        paddingLeft: '16px',
                                                        marginTop: '8px',
                                                        borderLeft: '2px solid #e0e0e0',
                                                        marginLeft: '8px'
                                                    }}>
                                                        {Object.entries(layerData).map(([subLayer, subLayerData]) => {
                                                            // Handle the nested URL structure
                                                            const urlEntries = Object.entries(subLayerData);
                                                            if (urlEntries.length > 0) {
                                                                const [url, version] = urlEntries[0]; // Take the first URL
                                                                const mapKey = getMapKey(category, null, subLayer, layer);
                                                                return renderLayerItem(subLayer, url, mapKey, category, null, layer);
                                                            }
                                                            return null;
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }
                                })
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export const checkAllLayersCacheStatus = async (links) => {
    const cacheStatus = {};
    
    const checkLayer = async (category, layer, url, state = null, subCategory = null) => {
        try {
            const mapKey = getMapKey(category, state, layer, subCategory);
            const isCached = await isGeoJsonCached(url);
            cacheStatus[mapKey] = isCached;
        } catch (error) {
            console.error(`Error checking cache for ${layer}:`, error);
            const mapKey = getMapKey(category, state, layer, subCategory);
            cacheStatus[mapKey] = false;
        }
    };

    // Helper function to generate map key (same as in your component)
    const getMapKey = (category, state, layer, subCategory = null) => {
        if (subCategory) {
            return `${category}-${state}-${subCategory}-${layer}`;
        }
        return state ? `${category}-${state}-${layer}` : `${category}-${layer}`;
    };

    // Helper function to check if an object contains URLs
    const hasDirectUrls = (obj) => {
        return Object.values(obj).some(value => typeof value === 'string');
    };

    // Process all categories
    for (const [category, categoryData] of Object.entries(links)) {
        if (category === 'STATES') {
            // Handle States category
            for (const [state, stateData] of Object.entries(categoryData)) {
                for (const [layer, layerData] of Object.entries(stateData)) {
                    if (hasDirectUrls(layerData)) {
                        // Direct URLs
                        const urlEntries = Object.entries(layerData);
                        if (urlEntries.length > 0) {
                            const [url] = urlEntries[0];
                            await checkLayer(category, layer, url, state);
                        }
                    } else {
                        // Sub-categories
                        for (const [subLayer, subLayerData] of Object.entries(layerData)) {
                            const urlEntries = Object.entries(subLayerData);
                            if (urlEntries.length > 0) {
                                const [url] = urlEntries[0];
                                await checkLayer(category, subLayer, url, state, layer);
                            }
                        }
                    }
                }
            }
        } else {
            // Handle other categories (like INDIA)
            for (const [layer, layerData] of Object.entries(categoryData)) {
                if (hasDirectUrls(layerData)) {
                    // Direct URLs
                    const urlEntries = Object.entries(layerData);
                    if (urlEntries.length > 0) {
                        const [url] = urlEntries[0];
                        await checkLayer(category, layer, url);
                    }
                } else {
                    // Sub-categories
                    for (const [subLayer, subLayerData] of Object.entries(layerData)) {
                        const urlEntries = Object.entries(subLayerData);
                        if (urlEntries.length > 0) {
                            const [url] = urlEntries[0];
                            await checkLayer(category, subLayer, url, null, layer);
                        }
                    }
                }
            }
        }
    }

    return cacheStatus;
};

export const LoadingIndicator = ({ type, message, progress = null }) => {
    const getIcon = () => {
        switch (type) {
            case 'loading': return '⏳';
            case 'downloading': return '⬇️';
            case 'processing': return '⚙️';
            default: return '📍';
        }
    };

    const getColor = () => {
        switch (type) {
            case 'loading': return '#2196f3';
            case 'downloading': return '#ff9800';
            case 'processing': return '#9c27b0';
            default: return '#4caf50';
        }
    };

    return (
        <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            zIndex: 1200,
            transform: 'translate(-50%, -50%)',
            background: 'rgba(255,255,255,0.98)',
            padding: '32px 48px',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            textAlign: 'center',
            minWidth: '280px',
            border: `3px solid ${getColor()}`
        }}>
            <div style={{
                fontSize: '32px',
                marginBottom: '16px',
                animation: 'pulse 2s infinite'
            }}>
                {getIcon()}
            </div>
            <div style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: getColor(),
                marginBottom: progress !== null ? '12px' : '0'
            }}>
                {message}
            </div>
            {progress !== null && (
                <div style={{
                    width: '100%',
                    height: '6px',
                    backgroundColor: '#e0e0e0',
                    borderRadius: '3px',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        width: `${progress}%`,
                        height: '100%',
                        backgroundColor: getColor(),
                        transition: 'width 0.3s ease',
                        borderRadius: '3px'
                    }} />
                </div>
            )}
            <style jsx>{`
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
            `}</style>
        </div>
    );
};




export const LocationMarker = ({ position, isShared = false }) => {
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

export const GeoJSONUpdater = ({ data }) => {
    const map = useMap();
    useEffect(() => {
        if (data && data.features && data.features.length > 0) {
            const geoJsonLayer = L.geoJSON(data);
            map.fitBounds(geoJsonLayer.getBounds());
        }
    }, [data, map]);
    return null;
};