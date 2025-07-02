import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polygon, useMapEvents, useMap, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Set up Leaflet default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Function to check if a point is inside a polygon
const isPointInPolygon = (point, polygon) => {
    const x = point[0], y = point[1];
    let inside = false;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i][0], yi = polygon[i][1];
        const xj = polygon[j][0], yj = polygon[j][1];
        
        const intersect = ((yi > y) !== (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    
    return inside;
};

// Function to check if a point is in a GeoJSON feature
const isPointInGeoJSON = (point, geojson) => {
    if (!geojson || !geojson.features) return false;
    
    const lat = point[0];
    const lng = point[1];
    
    for (const feature of geojson.features) {
        if (feature.geometry.type === 'Polygon') {
            const coordinates = feature.geometry.coordinates[0];
            const polygonPoints = coordinates.map(coord => [coord[1], coord[0]]);
            if (isPointInPolygon([lat, lng], polygonPoints)) {
                return {
                    isInside: true,
                    properties: {
                        id: feature.properties?.id || 'N/A',
                        assembly: feature.properties?.assembly || 'N/A',
                        assemblyCode: feature.properties?.asmbly_cod || 'N/A',
                        assemblyNumber: feature.properties?.assembly_n || 'N/A',
                        assemblyLabel: feature.properties?.assembly_l || 'N/A',
                        constituencyCode: feature.properties?.const_cod || 'N/A',
                        parlamentaryAssembly: feature.properties?.pr_asbly_n || 'N/A'
                    }
                };
            }
        } else if (feature.geometry.type === 'MultiPolygon') {
            for (const polygon of feature.geometry.coordinates) {
                const polygonPoints = polygon[0].map(coord => [coord[1], coord[0]]);
                if (isPointInPolygon([lat, lng], polygonPoints)) {
                    return {
                        isInside: true,
                        properties: {
                            id: feature.properties?.id || 'N/A',
                            assembly: feature.properties?.assembly || 'N/A',
                            assemblyCode: feature.properties?.asmbly_cod || 'N/A',
                            assemblyNumber: feature.properties?.assembly_n || 'N/A',
                            assemblyLabel: feature.properties?.assembly_l || 'N/A',
                            constituencyCode: feature.properties?.const_cod || 'N/A',
                            parlamentaryAssembly: feature.properties?.pr_asbly_n || 'N/A'
                        }
                    };
                }
            }
        }
    }
    return { isInside: false };
};

// MapController component to handle map view updates
function MapController({ center, zoom }) {
    const map = useMap();
    
    useEffect(() => {
        if (center) {
            map.setView(center, zoom || map.getZoom());
        }
    }, [center, zoom, map]);

    return null;
}

// LocationMarker component for handling map interactions
function LocationMarker({ position, onLocationSelect, isDrawing }) {
    const map = useMapEvents({
        click(e) {
            if (isDrawing && onLocationSelect) {
                const { lat, lng } = e.latlng;
                onLocationSelect([lat, lng]);
            }
        },
    });

    return position ? (
        <Marker
            position={position}
            icon={new L.Icon({
                iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
                shadowSize: [41, 41],
            })}
        />
    ) : null;
}

const Maps = () => {
    const [userPosition, setUserPosition] = useState(null);
    const [loading, setLoading] = useState(false);
    const [mapCenter, setMapCenter] = useState([51.505, -0.09]);
    const [error, setError] = useState('');
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentShape, setCurrentShape] = useState([]);
    const [shapes, setShapes] = useState([]);
    const [currentAreaName, setCurrentAreaName] = useState('');
    const [userAreaStatus, setUserAreaStatus] = useState('');
    const [geojsonAreaStatus, setGeojsonAreaStatus] = useState('');
    const [selectedShape, setSelectedShape] = useState(null);
    const [mapZoom, setMapZoom] = useState(13);
    const [geojsonData, setGeojsonData] = useState(null);

    useEffect(() => {
        // Load saved shapes from localStorage
        const savedShapes = localStorage.getItem('mapShapes');
        if (savedShapes) {
            setShapes(JSON.parse(savedShapes));
        }
        
        // Try to get initial location
        getCurrentLocation();
    }, []);

    useEffect(() => {
        // Save shapes to localStorage whenever they change
        localStorage.setItem('mapShapes', JSON.stringify(shapes));
    }, [shapes]);

    const getCurrentLocation = () => {
        setLoading(true);
        setError('');
        
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const newPosition = [latitude, longitude];
                    setUserPosition(newPosition);
                    setMapCenter(newPosition);
                    setMapZoom(15);
                    setLoading(false);
                    checkUserLocation(newPosition);
                },
                (error) => {
                    setLoading(false);
                    let errorMessage = 'Unable to get your location. ';
                    switch(error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage += 'Please enable location services in your browser.';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage += 'Location information is unavailable.';
                            break;
                        case error.TIMEOUT:
                            errorMessage += 'Location request timed out.';
                            break;
                        default:
                            errorMessage += 'An unknown error occurred.';
                    }
                    setError(errorMessage);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                }
            );
        } else {
            setLoading(false);
            setError('Geolocation is not supported by your browser.');
        }
    };

    const handleMapClick = (position) => {
        if (isDrawing) {
            setCurrentShape([...currentShape, position]);
        }
    };

    const startDrawing = () => {
        setIsDrawing(true);
        setCurrentShape([]);
        setCurrentAreaName('');
    };

    const cancelDrawing = () => {
        setIsDrawing(false);
        setCurrentShape([]);
        setCurrentAreaName('');
    };

    const finishDrawing = () => {
        if (currentShape.length >= 3 && currentAreaName.trim()) {
            const newShape = {
                points: currentShape,
                name: currentAreaName.trim(),
                color: `#${Math.floor(Math.random()*16777215).toString(16)}`
            };
            setShapes([...shapes, newShape]);
            setCurrentShape([]);
            setCurrentAreaName('');
            setIsDrawing(false);
            if (userPosition) {
                checkUserLocation(userPosition);
            }
        } else {
            setError('Please draw at least 3 points and provide a name for the area');
        }
    };

    const checkUserLocation = (position) => {
        let userAreas = [];
        let geojsonResult = '';
        
        // Check user-drawn areas
        shapes.forEach(shape => {
            if (isPointInPolygon(position, shape.points)) {
                userAreas.push(shape.name);
            }
        });
        
        // Check GeoJSON areas
        if (geojsonData) {
            const geoJsonCheck = isPointInGeoJSON(position, geojsonData);
            if (geoJsonCheck.isInside) {
                const props = geoJsonCheck.properties;
                geojsonResult = `Assembly Details:
    Assembly Name: ${props.assembly}
    Assembly ID: ${props.id}
    Assembly Number: ${props.assemblyNumber}
    Assembly Code: ${props.assemblyCode}
    Parliamentary Assembly: ${props.parlamentaryAssembly}
    Constituency Code: ${props.constituencyCode}`;
            } else {
                geojsonResult = 'You are not present in any uploaded assembly area';
            }
        }
        
        // Set status messages
        if (userAreas.length > 0) {
            setUserAreaStatus(`You are in: ${userAreas.join(', ')}`);
        } 
        
        if (geojsonResult) {
            setGeojsonAreaStatus(geojsonResult);
        }
    };

    const deleteShape = (index) => {
        const newShapes = shapes.filter((_, i) => i !== index);
        setShapes(newShapes);
        setSelectedShape(null);
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file && file.type === 'application/json') {
            const reader = new FileReader();
            reader.onload = () => {
                try {
                    const data = JSON.parse(reader.result);
                    setGeojsonData(data);
                    if (userPosition) {
                        checkUserLocation(userPosition);
                    }
                } catch (error) {
                    setError('Error parsing GeoJSON file');
                    console.error('Error parsing GeoJSON:', error);
                }
            };
            reader.readAsText(file);
        } else {
            setError('Please upload a valid JSON file');
        }
    };

    return (
        <div className="h-screen w-screen flex">
            {/* Sidebar */}
            <div className="w-64 bg-white shadow-lg z-10 p-4 overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">Area Manager</h2>
                
                <button
                    onClick={getCurrentLocation}
                    disabled={loading}
                    className="w-full mb-4 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-500 disabled:bg-blue-300"
                >
                    {loading ? 'Getting Location...' : '📍 Get My Location'}
                </button>

                {userAreaStatus && (
                    <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
                        {userAreaStatus}
                    </div>
                )}

                {geojsonAreaStatus && (
                    <div className="mb-4 p-3 bg-blue-100 text-blue-700 rounded">
                        {geojsonAreaStatus}
                    </div>
                )}

                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                        {error}
                    </div>
                )}

                {!isDrawing ? (
                    <button
                        onClick={startDrawing}
                        className="w-full mb-4 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-500"
                    >
                        ✏️ Draw New Area
                    </button>
                ) : (
                    <div className="space-y-2 mb-4">
                        <input
                            type="text"
                            value={currentAreaName}
                            onChange={(e) => setCurrentAreaName(e.target.value)}
                            placeholder="Enter area name"
                            className="w-full p-2 border rounded"
                        />
                        <div className="flex space-x-2">
                            <button
                                onClick={finishDrawing}
                                className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-500"
                            >
                                Save
                            </button>
                            <button
                                onClick={cancelDrawing}
                                className="flex-1 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-500"
                            >
                                Cancel
                            </button>
                        </div>
                        <p className="text-sm text-gray-600">
                            Click on the map to draw points. Minimum 3 points required.
                        </p>
                    </div>
                )}

                {/* File Upload */}
                <input 
                    type="file" 
                    accept="application/geo+json,application/json" 
                    onChange={handleFileUpload} 
                    className="w-full mb-4 p-2 border rounded"
                />

                <div className="mt-4">
                    <h3 className="font-bold mb-2">Defined Areas:</h3>
                    <div className="space-y-2">
                        {shapes.map((shape, index) => (
                            <div
                                key={index}
                                className={`p-2 rounded cursor-pointer flex justify-between items-center ${
                                    selectedShape === index ? 'bg-blue-100' : 'bg-gray-100'
                                }`}
                                onClick={() => setSelectedShape(index)}
                            >
                                <span>{shape.name}</span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteShape(index);
                                    }}
                                    className="text-red-600 hover:text-red-800"
                                >
                                    ❌
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Map */}
            <div className="flex-1">
                <MapContainer
                    center={mapCenter}
                    zoom={mapZoom}
                    className="h-full w-full"
                >
                    <MapController center={mapCenter} zoom={mapZoom} />
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    
                    <LocationMarker 
                        position={userPosition} 
                        onLocationSelect={handleMapClick}
                        isDrawing={isDrawing}
                    />
                    
                    {/* Current shape being drawn */}
                    {currentShape.length > 0 && (
                        <Polygon
                            positions={currentShape}
                            pathOptions={{ color: 'red', weight: 1 , fill: false}}
                        />
                    )}

                    {/* Saved shapes */}
                    {shapes.map((shape, index) => (
                        <Polygon
                            key={index}
                            positions={shape.points}
                            pathOptions={{
                                color: shape.color,
                                weight: selectedShape === index ? 4 : 2,
                                fill: false,
                            }}
                        />
                    ))}
                    
                    {/* GeoJSON Data */}
                    {geojsonData && (
                        <GeoJSON 
                            data={geojsonData}
                            style={() => ({
                                color: '#4a90e2',
                                weight: 2,
                                fillOpacity: 0.1,
                                fillColor: '#4a90e2'
                            })}
                        />
                    )}
                </MapContainer>
            </div>
        </div>
    );
};

export default Maps;




//main code with file upload


// import React, { useState, useEffect } from 'react';
// import { MapContainer, TileLayer, Marker, Polygon, useMapEvents, useMap, GeoJSON } from 'react-leaflet';
// import L from 'leaflet';
// import 'leaflet/dist/leaflet.css';

// // Set up Leaflet default icons
// delete L.Icon.Default.prototype._getIconUrl;
// L.Icon.Default.mergeOptions({
//     iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
//     iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
//     shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
// });

// // Function to check if a point is inside a polygon
// const isPointInPolygon = (point, polygon) => {
//     const x = point[0], y = point[1];
//     let inside = false;
    
//     for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
//         const xi = polygon[i][0], yi = polygon[i][1];
//         const xj = polygon[j][0], yj = polygon[j][1];
        
//         const intersect = ((yi > y) !== (yj > y))
//             && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
//         if (intersect) inside = !inside;
//     }
    
//     return inside;
// };

// // MapController component to handle map view updates
// function MapController({ center, zoom }) {
//     const map = useMap();
    
//     useEffect(() => {
//         if (center) {
//             map.setView(center, zoom || map.getZoom());
//         }
//     }, [center, zoom, map]);

//     return null;
// }

// // LocationMarker component for handling map interactions
// function LocationMarker({ position, onLocationSelect, isDrawing }) {
//     const map = useMapEvents({
//         click(e) {
//             if (isDrawing && onLocationSelect) {
//                 const { lat, lng } = e.latlng;
//                 onLocationSelect([lat, lng]);
//             }
//         },
//     });

//     return position ? (
//         <Marker
//             position={position}
//             icon={new L.Icon({
//                 iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
//                 iconSize: [25, 41],
//                 iconAnchor: [12, 41],
//                 popupAnchor: [1, -34],
//                 shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
//                 shadowSize: [41, 41],
//             })}
//         />
//     ) : null;
// }

// const Maps = () => {
//     const [userPosition, setUserPosition] = useState(null);
//     const [loading, setLoading] = useState(false);
//     const [mapCenter, setMapCenter] = useState([51.505, -0.09]);
//     const [error, setError] = useState('');
//     const [isDrawing, setIsDrawing] = useState(false);
//     const [currentShape, setCurrentShape] = useState([]);
//     const [shapes, setShapes] = useState([]);
//     const [currentAreaName, setCurrentAreaName] = useState('');
//     const [userAreaStatus, setUserAreaStatus] = useState('');
//     const [selectedShape, setSelectedShape] = useState(null);
//     const [mapZoom, setMapZoom] = useState(13);
//     const [geojsonData, setGeojsonData] = useState(null);

//     useEffect(() => {
//         // Load saved shapes from localStorage
//         const savedShapes = localStorage.getItem('mapShapes');
//         if (savedShapes) {
//             setShapes(JSON.parse(savedShapes));
//         }
        
//         // Try to get initial location
//         getCurrentLocation();
//     }, []);

//     useEffect(() => {
//         // Save shapes to localStorage whenever they change
//         localStorage.setItem('mapShapes', JSON.stringify(shapes));
//     }, [shapes]);

//     const getCurrentLocation = () => {
//         setLoading(true);
//         setError('');
        
//         if (navigator.geolocation) {
//             navigator.geolocation.getCurrentPosition(
//                 (position) => {
//                     const { latitude, longitude } = position.coords;
//                     const newPosition = [latitude, longitude];
//                     setUserPosition(newPosition);
//                     setMapCenter(newPosition);
//                     setMapZoom(15); // Zoom in when location is found
//                     setLoading(false);
//                     checkUserLocation(newPosition);
//                 },
//                 (error) => {
//                     setLoading(false);
//                     let errorMessage = 'Unable to get your location. ';
//                     switch(error.code) {
//                         case error.PERMISSION_DENIED:
//                             errorMessage += 'Please enable location services in your browser.';
//                             break;
//                         case error.POSITION_UNAVAILABLE:
//                             errorMessage += 'Location information is unavailable.';
//                             break;
//                         case error.TIMEOUT:
//                             errorMessage += 'Location request timed out.';
//                             break;
//                         default:
//                             errorMessage += 'An unknown error occurred.';
//                     }
//                     setError(errorMessage);
//                 },
//                 {
//                     enableHighAccuracy: true,
//                     timeout: 5000,
//                     maximumAge: 0
//                 }
//             );
//         } else {
//             setLoading(false);
//             setError('Geolocation is not supported by your browser.');
//         }
//     };

//     const handleMapClick = (position) => {
//         if (isDrawing) {
//             setCurrentShape([...currentShape, position]);
//         }
//     };

//     const startDrawing = () => {
//         setIsDrawing(true);
//         setCurrentShape([]);
//         setCurrentAreaName('');
//     };

//     const cancelDrawing = () => {
//         setIsDrawing(false);
//         setCurrentShape([]);
//         setCurrentAreaName('');
//     };

//     const finishDrawing = () => {
//         if (currentShape.length >= 3 && currentAreaName.trim()) {
//             const newShape = {
//                 points: currentShape,
//                 name: currentAreaName.trim(),
//                 color: `#${Math.floor(Math.random()*16777215).toString(16)}` // Random color
//             };
//             setShapes([...shapes, newShape]);
//             setCurrentShape([]);
//             setCurrentAreaName('');
//             setIsDrawing(false);
//             if (userPosition) {
//                 checkUserLocation(userPosition);
//             }
//         } else {
//             setError('Please draw at least 3 points and provide a name for the area');
//         }
//     };

//     const checkUserLocation = (position) => {
//         let userAreas = [];
//         shapes.forEach(shape => {
//             if (isPointInPolygon(position, shape.points)) {
//                 userAreas.push(shape.name);
//             }
//         });
        
//         if (userAreas.length > 0) {
//             setUserAreaStatus(`You are in: ${userAreas.join(', ')}`);
//         } else {
//             setUserAreaStatus('You are not in any defined area');
//         }
//     };

//     const deleteShape = (index) => {
//         const newShapes = shapes.filter((_, i) => i !== index);
//         setShapes(newShapes);
//         setSelectedShape(null);
//     };

//     // File Upload Handler
//     const handleFileUpload = (event) => {
//         const file = event.target.files[0];
//         if (file && file.type === 'application/json') {
//             const reader = new FileReader();
//             reader.onload = () => {
//                 try {
//                     const data = JSON.parse(reader.result);
//                     setGeojsonData(data);
//                 } catch (error) {
//                     console.error('Error parsing GeoJSON:', error);
//                 }
//             };
//             reader.readAsText(file);
//         } else {
//             console.error('Please upload a valid JSON file');
//         }
//     };

//     return (
//         <div className="h-screen w-screen flex">
//             {/* Sidebar */}
//             <div className="w-64 bg-white shadow-lg z-10 p-4 overflow-y-auto">
//                 <h2 className="text-xl font-bold mb-4">Area Manager</h2>
                
//                 <button
//                     onClick={getCurrentLocation}
//                     disabled={loading}
//                     className="w-full mb-4 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-500 disabled:bg-blue-300"
//                 >
//                     {loading ? 'Getting Location...' : '📍 Get My Location'}
//                 </button>

//                 {userAreaStatus && (
//                     <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
//                         {userAreaStatus}
//                     </div>
//                 )}

//                 {error && (
//                     <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
//                         {error}
//                     </div>
//                 )}

//                 {!isDrawing ? (
//                     <button
//                         onClick={startDrawing}
//                         className="w-full mb-4 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-500"
//                     >
//                         ✏️ Draw New Area
//                     </button>
//                 ) : (
//                     <div className="space-y-2 mb-4">
//                         <input
//                             type="text"
//                             value={currentAreaName}
//                             onChange={(e) => setCurrentAreaName(e.target.value)}
//                             placeholder="Enter area name"
//                             className="w-full p-2 border rounded"
//                         />
//                         <div className="flex space-x-2">
//                             <button
//                                 onClick={finishDrawing}
//                                 className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-500"
//                             >
//                                 Save
//                             </button>
//                             <button
//                                 onClick={cancelDrawing}
//                                 className="flex-1 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-500"
//                             >
//                                 Cancel
//                             </button>
//                         </div>
//                         <p className="text-sm text-gray-600">
//                             Click on the map to draw points. Minimum 3 points required.
//                         </p>
//                     </div>
//                 )}

//                 {/* File Upload */}
//                 <input 
//                     type="file" 
//                     accept="application/geo+json,application/json" 
//                     onChange={handleFileUpload} 
//                     className="w-full mb-4 p-2 border rounded"
//                 />

//                 <div className="mt-4">
//                     <h3 className="font-bold mb-2">Defined Areas:</h3>
//                     <div className="space-y-2">
//                         {shapes.map((shape, index) => (
//                             <div
//                                 key={index}
//                                 className={`p-2 rounded cursor-pointer flex justify-between items-center ${
//                                     selectedShape === index ? 'bg-blue-100' : 'bg-gray-100'
//                                 }`}
//                                 onClick={() => setSelectedShape(index)}
//                             >
//                                 <span>{shape.name}</span>
//                                 <button
//                                     onClick={(e) => {
//                                         e.stopPropagation();
//                                         deleteShape(index);
//                                     }}
//                                     className="text-red-600 hover:text-red-800"
//                                 >
//                                     ❌
//                                 </button>
//                             </div>
//                         ))}
//                     </div>
//                 </div>
//             </div>

//             {/* Map */}
//             <div className="flex-1">
//                 <MapContainer
//                     center={mapCenter}
//                     zoom={mapZoom}
//                     className="h-full w-full"
//                 >
//                     <MapController center={mapCenter} zoom={mapZoom} />
//                     <TileLayer
//                         url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//                         attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//                     />
                    
//                     <LocationMarker 
//                         position={userPosition} 
//                         onLocationSelect={handleMapClick}
//                         isDrawing={isDrawing}
//                     />
                    
//                     {/* Current shape being drawn */}
//                     {currentShape.length > 0 && (
//                         <Polygon
//                             positions={currentShape}
//                             pathOptions={{ color: 'red', weight: 1 , fill: false}}
//                         />
//                     )}

//                     {/* Saved shapes */}
//                     {shapes.map((shape, index) => (
//                         <Polygon
//                             key={index}
//                             positions={shape.points}
//                             pathOptions={{
//                                 color: shape.color,
//                                 weight: selectedShape === index ? 4 : 2,
//                                 fill: false,
//                             }}
//                         />
//                     ))}
                    
//                     {/* GeoJSON Data */}
//                     {geojsonData && <GeoJSON data={geojsonData} />}
//                 </MapContainer>
//             </div>
//         </div>
//     );
// };

// export default Maps;





// import React, { useState, useEffect } from 'react';
// import { MapContainer, TileLayer, Marker, Polygon, useMapEvents, useMap } from 'react-leaflet';
// import L from 'leaflet';
// import 'leaflet/dist/leaflet.css';

// // Set up Leaflet default icons
// delete L.Icon.Default.prototype._getIconUrl;
// L.Icon.Default.mergeOptions({
//     iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
//     iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
//     shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
// });

// // Function to check if a point is inside a polygon
// const isPointInPolygon = (point, polygon) => {
//     const x = point[0], y = point[1];
//     let inside = false;
    
//     for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
//         const xi = polygon[i][0], yi = polygon[i][1];
//         const xj = polygon[j][0], yj = polygon[j][1];
        
//         const intersect = ((yi > y) !== (yj > y))
//             && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
//         if (intersect) inside = !inside;
//     }
    
//     return inside;
// };

// // MapController component to handle map view updates
// function MapController({ center, zoom }) {
//     const map = useMap();
    
//     useEffect(() => {
//         if (center) {
//             map.setView(center, zoom || map.getZoom());
//         }
//     }, [center, zoom, map]);

//     return null;
// }

// // LocationMarker component for handling map interactions
// function LocationMarker({ position, onLocationSelect, isDrawing }) {
//     const map = useMapEvents({
//         click(e) {
//             if (isDrawing && onLocationSelect) {
//                 const { lat, lng } = e.latlng;
//                 onLocationSelect([lat, lng]);
//             }
//         },
//     });

//     return position ? (
//         <Marker
//             position={position}
//             icon={new L.Icon({
//                 iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
//                 iconSize: [25, 41],
//                 iconAnchor: [12, 41],
//                 popupAnchor: [1, -34],
//                 shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
//                 shadowSize: [41, 41],
//             })}
//         />
//     ) : null;
// }

// const Maps = () => {
//     const [userPosition, setUserPosition] = useState(null);
//     const [loading, setLoading] = useState(false);
//     const [mapCenter, setMapCenter] = useState([51.505, -0.09]);
//     const [error, setError] = useState('');
//     const [isDrawing, setIsDrawing] = useState(false);
//     const [currentShape, setCurrentShape] = useState([]);
//     const [shapes, setShapes] = useState([]);
//     const [currentAreaName, setCurrentAreaName] = useState('');
//     const [userAreaStatus, setUserAreaStatus] = useState('');
//     const [selectedShape, setSelectedShape] = useState(null);
//     const [mapZoom, setMapZoom] = useState(13);

//     useEffect(() => {
//         // Load saved shapes from localStorage
//         const savedShapes = localStorage.getItem('mapShapes');
//         if (savedShapes) {
//             setShapes(JSON.parse(savedShapes));
//         }
        
//         // Try to get initial location
//         getCurrentLocation();
//     }, []);

//     useEffect(() => {
//         // Save shapes to localStorage whenever they change
//         localStorage.setItem('mapShapes', JSON.stringify(shapes));
//     }, [shapes]);

//     const getCurrentLocation = () => {
//         setLoading(true);
//         setError('');
        
//         if (navigator.geolocation) {
//             navigator.geolocation.getCurrentPosition(
//                 (position) => {
//                     const { latitude, longitude } = position.coords;
//                     const newPosition = [latitude, longitude];
//                     setUserPosition(newPosition);
//                     setMapCenter(newPosition);
//                     setMapZoom(15); // Zoom in when location is found
//                     setLoading(false);
//                     checkUserLocation(newPosition);
//                 },
//                 (error) => {
//                     setLoading(false);
//                     let errorMessage = 'Unable to get your location. ';
//                     switch(error.code) {
//                         case error.PERMISSION_DENIED:
//                             errorMessage += 'Please enable location services in your browser.';
//                             break;
//                         case error.POSITION_UNAVAILABLE:
//                             errorMessage += 'Location information is unavailable.';
//                             break;
//                         case error.TIMEOUT:
//                             errorMessage += 'Location request timed out.';
//                             break;
//                         default:
//                             errorMessage += 'An unknown error occurred.';
//                     }
//                     setError(errorMessage);
//                 },
//                 {
//                     enableHighAccuracy: true,
//                     timeout: 5000,
//                     maximumAge: 0
//                 }
//             );
//         } else {
//             setLoading(false);
//             setError('Geolocation is not supported by your browser.');
//         }
//     };

//     const handleMapClick = (position) => {
//         if (isDrawing) {
//             setCurrentShape([...currentShape, position]);
//         }
//     };

//     const startDrawing = () => {
//         setIsDrawing(true);
//         setCurrentShape([]);
//         setCurrentAreaName('');
//     };

//     const cancelDrawing = () => {
//         setIsDrawing(false);
//         setCurrentShape([]);
//         setCurrentAreaName('');
//     };

//     const finishDrawing = () => {
//         if (currentShape.length >= 3 && currentAreaName.trim()) {
//             const newShape = {
//                 points: currentShape,
//                 name: currentAreaName.trim(),
//                 color: `#${Math.floor(Math.random()*16777215).toString(16)}` // Random color
//             };
//             setShapes([...shapes, newShape]);
//             setCurrentShape([]);
//             setCurrentAreaName('');
//             setIsDrawing(false);
//             if (userPosition) {
//                 checkUserLocation(userPosition);
//             }
//         } else {
//             setError('Please draw at least 3 points and provide a name for the area');
//         }
//     };

//     const checkUserLocation = (position) => {
//         let userAreas = [];
//         shapes.forEach(shape => {
//             if (isPointInPolygon(position, shape.points)) {
//                 userAreas.push(shape.name);
//             }
//         });
        
//         if (userAreas.length > 0) {
//             setUserAreaStatus(`You are in: ${userAreas.join(', ')}`);
//         } else {
//             setUserAreaStatus('You are not in any defined area');
//         }
//     };

//     const deleteShape = (index) => {
//         const newShapes = shapes.filter((_, i) => i !== index);
//         setShapes(newShapes);
//         setSelectedShape(null);
//     };

//     return (
//         <div className="h-screen w-screen flex">
//             {/* Sidebar */}
//             <div className="w-64 bg-white shadow-lg z-10 p-4 overflow-y-auto">
//                 <h2 className="text-xl font-bold mb-4">Area Manager</h2>
                
//                 <button
//                     onClick={getCurrentLocation}
//                     disabled={loading}
//                     className="w-full mb-4 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-500 disabled:bg-blue-300"
//                 >
//                     {loading ? 'Getting Location...' : '📍 Get My Location'}
//                 </button>

//                 {userAreaStatus && (
//                     <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
//                         {userAreaStatus}
//                     </div>
//                 )}

//                 {error && (
//                     <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
//                         {error}
//                     </div>
//                 )}

//                 {!isDrawing ? (
//                     <button
//                         onClick={startDrawing}
//                         className="w-full mb-4 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-500"
//                     >
//                         ✏️ Draw New Area
//                     </button>
//                 ) : (
//                     <div className="space-y-2 mb-4">
//                         <input
//                             type="text"
//                             value={currentAreaName}
//                             onChange={(e) => setCurrentAreaName(e.target.value)}
//                             placeholder="Enter area name"
//                             className="w-full p-2 border rounded"
//                         />
//                         <div className="flex space-x-2">
//                             <button
//                                 onClick={finishDrawing}
//                                 className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-500"
//                             >
//                                 Save
//                             </button>
//                             <button
//                                 onClick={cancelDrawing}
//                                 className="flex-1 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-500"
//                             >
//                                 Cancel
//                             </button>
//                         </div>
//                         <p className="text-sm text-gray-600">
//                             Click on the map to draw points. Minimum 3 points required.
//                         </p>
//                     </div>
//                 )}

//                 <div className="mt-4">
//                     <h3 className="font-bold mb-2">Defined Areas:</h3>
//                     <div className="space-y-2">
//                         {shapes.map((shape, index) => (
//                             <div
//                                 key={index}
//                                 className={`p-2 rounded cursor-pointer flex justify-between items-center ${
//                                     selectedShape === index ? 'bg-blue-100' : 'bg-gray-100'
//                                 }`}
//                                 onClick={() => setSelectedShape(index)}
//                             >
//                                 <span>{shape.name}</span>
//                                 <button
//                                     onClick={(e) => {
//                                         e.stopPropagation();
//                                         deleteShape(index);
//                                     }}
//                                     className="text-red-600 hover:text-red-800"
//                                 >
//                                     ❌
//                                 </button>
//                             </div>
//                         ))}
//                     </div>
//                 </div>
//             </div>

//             {/* Map */}
//             <div className="flex-1">
//                 <MapContainer
//                     center={mapCenter}
//                     zoom={mapZoom}
//                     className="h-full w-full"
//                 >
//                     <MapController center={mapCenter} zoom={mapZoom} />
//                     <TileLayer
//                         url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//                         attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//                     />
                    
//                     <LocationMarker 
//                         position={userPosition} 
//                         onLocationSelect={handleMapClick}
//                         isDrawing={isDrawing}
//                     />
                    
//                     {/* Current shape being drawn */}
//                     {currentShape.length > 0 && (
//                         <Polygon
//                             positions={currentShape}
//                             pathOptions={{ color: 'red', weight: 2 }}
//                         />
//                     )}

//                     {/* Saved shapes */}
//                     {shapes.map((shape, index) => (
//                         <Polygon
//                             key={index}
//                             positions={shape.points}
//                             pathOptions={{
//                                 color: shape.color,
//                                 weight: selectedShape === index ? 4 : 2,
//                                 fillOpacity: selectedShape === index ? 0.3 : 0.2
//                             }}
//                         />
//                     ))}
//                 </MapContainer>
//             </div>
//         </div>
//     );
// };

// export default Maps;



// import React, { useState, useEffect } from 'react';
// import { sortBoundaryPoints } from './Algorithm';
// import { MapContainer, TileLayer, Marker, Polygon, useMapEvents, useMap, Tooltip } from 'react-leaflet';
// import L from 'leaflet';
// import 'leaflet/dist/leaflet.css';

// // Set up Leaflet default icons
// delete L.Icon.Default.prototype._getIconUrl;
// L.Icon.Default.mergeOptions({
//     iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
//     iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
//     shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
// });

// const isPointInPolygon = (point, polygon) => {
//     const x = point[0], y = point[1];
//     let inside = false;
    
//     for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
//         const xi = polygon[i][0], yi = polygon[i][1];
//         const xj = polygon[j][0], yj = polygon[j][1];
        
//         const intersect = ((yi > y) !== (yj > y))
//             && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
//         if (intersect) inside = !inside;
//     }
    
//     return inside;
// };

// // Calculate polygon center for label placement
// const calculatePolygonCenter = (points) => {
//     const lat = points.reduce((sum, point) => sum + point[0], 0) / points.length;
//     const lng = points.reduce((sum, point) => sum + point[1], 0) / points.length;
//     return [lat, lng];
// };

// function MapController({ center, zoom }) {
//     const map = useMap();
    
//     useEffect(() => {
//         if (center) {
//             map.setView(center, zoom || map.getZoom());
//         }
//     }, [center, zoom, map]);

//     return null;
// }

// function LocationMarker({ position, onLocationSelect, isDrawing }) {
//     const map = useMapEvents({
//         click(e) {
//             if (isDrawing && onLocationSelect) {
//                 const { lat, lng } = e.latlng;
//                 onLocationSelect([lat, lng]);
//             }
//         },
//     });

//     return position ? (
//         <Marker
//             position={position}
//             icon={new L.Icon({
//                 iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
//                 iconSize: [25, 41],
//                 iconAnchor: [12, 41],
//                 popupAnchor: [1, -34],
//                 shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
//                 shadowSize: [41, 41],
//             })}
//         >
//             <Tooltip permanent>Your Location</Tooltip>
//         </Marker>
//     ) : null;
// }

// const Maps = () => {
//     const [userPosition, setUserPosition] = useState(null);
//     const [loading, setLoading] = useState(false);
//     const [mapCenter, setMapCenter] = useState([14.7504291, 78.57002559]); // Updated center
//     const [error, setError] = useState('');
//     const [isDrawing, setIsDrawing] = useState(false);
//     const [currentShape, setCurrentShape] = useState([]);
//     const [shapes, setShapes] = useState([]);
//     const [currentAreaName, setCurrentAreaName] = useState('');
//     const [userAreaStatus, setUserAreaStatus] = useState('');
//     const [selectedShape, setSelectedShape] = useState(null);
//     const [mapZoom, setMapZoom] = useState(14); // Updated zoom level

//     // Predefined area coordinates
//     const unsortedPoints = [
//         [18.5736873, 83.2562721],
//         [18.5730466, 83.2568622],
//         [18.5809689, 83.2560468],
//         [18.5764027, 83.2561648],
//         [18.5891756, 83.2490837],
//         [18.5883926, 83.2482362],
//         [18.5892366, 83.2472491],
//         [18.5888705, 83.2464230],
//         [18.5878129, 83.2452536],
//         [18.5873451, 83.2452857],
//         [18.5864807, 83.2457149],
//         [18.5857791, 83.2463908],
//         [18.5858299, 83.2475817],
//         [18.5861248, 83.2485795],
//         [18.5862672, 83.2502639],
//         [18.5865723, 83.2526135],
//         [18.5866740, 83.2542443],
//         [18.5864096, 83.2554459],
//         [18.5849960, 83.2556605],
//         [18.5839587, 83.2558966],
//         [18.5907314, 83.2500279],
//         [18.5894806, 83.2478177],
//         [18.5951651, 83.2542121],
//         [18.5943821, 83.2524419],
//         [18.5930398, 83.2513690],
//         [18.5991105, 83.2566905],
//         [18.5977377, 83.2566583],
//         [18.5967005, 83.2565296],
//         [18.5960497, 83.2558215],
//         [18.4969474, 83.3090579],
//         [18.4973137, 83.3086824],
//         [18.5096957, 83.2950890],
//         [18.5103163, 83.2950890],
//         [18.4980056, 83.3083284],
//         [18.4992978, 83.3080923],
//         [18.5006611, 83.3080709],
//         [18.5016684, 83.3082533],
//         [18.5029198, 83.3091009],
//         [18.5103672, 83.2966554],
//         [18.5112523, 83.2954109],
//         [18.5122087, 83.2956684],
//         [18.5122900, 83.2932544],
//         [18.5148131, 83.2933509],
//         [18.5179058, 83.2935548],
//         [18.5181093, 83.2902825],
//         [18.5196963, 83.2903039],
//         [18.5202253, 83.2907760],
//         [18.5204898, 83.2916558],
//         [18.5207238, 83.2926214],
//         [18.5222701, 83.2926428],
//         [18.5120052, 83.3026743],
//         [18.5125444, 83.3018052],
//         [18.5129717, 83.3011293],
//         [18.5129208, 83.2998633],
//         [18.5127580, 83.2992518],
//         [18.5119543, 83.2983291],
//         [18.5109573, 83.2974708],
//         [18.5125851, 83.3087683],
//         [18.5127275, 83.3077168],
//         [18.5128292, 83.3062255],
//         [18.5118119, 83.3048093],
//         [18.5117712, 83.3038974],
//         [18.4973850, 83.3139932],
//         [18.4973646, 83.3125234],
//         [18.4973850, 83.3113968],
//         [18.4972425, 83.3108818],
//         [18.4968966, 83.3097553],
//         [18.4985348, 83.3219217],
//         [18.4979954, 83.3188641],
//         [18.4976800, 83.3160639],
//         [18.5043035, 83.3107316],
//         [18.5059009, 83.3122659],
//         [18.5069081, 83.3133495],
//         [18.5074982, 83.3143473],
//         [18.5078950, 83.3150124],
//         [18.5091769, 83.3158493],
//         [18.5102756, 83.3162141],
//         [18.5023704, 83.3229196],
//         [18.5001219, 83.3228874],
//         [18.5106317, 83.3257735],
//         [18.5067351, 83.3255803],
//         [18.5052395, 83.3254301],
//         [18.5100722, 83.3339381],
//         [18.5105503, 83.3322966],
//         [18.5118221, 83.3157205],
//         [18.5117305, 83.3141327],
//         [18.5116491, 83.3125448],
//         [18.5116186, 83.3115256],
//         [18.5120255, 83.3103347],
//         [18.5114558, 83.3164179],
//         [18.5121374, 83.3160746],
//         [18.5140501, 83.3285200],
//         [18.5154235, 83.3270395],
//         [18.5168173, 83.3257520],
//         [18.5153014, 83.3240569],
//         [18.5151285, 83.3234346],
//         [18.5139992, 83.3235311],
//         [18.5130429, 83.3237243],
//         [18.5121069, 83.3240354],
//         [18.5109980, 83.3240569],
//         [18.5116593, 83.3257842],
//         [18.5115168, 83.3306980],
//         [18.5129310, 83.3296573],
//         [18.5100518, 83.3358049],
//         [18.5117305, 83.3419847],
//         [18.5107233, 83.3383369],
//         [18.5170004, 83.3457398],
//         [18.5162679, 83.3463406],
//         [18.5152200, 83.3468127],
//         [18.5145486, 83.3468234],
//         [18.5139076, 83.3467054],
//         [18.5129717, 83.3456647],
//         [18.5120662, 83.3439910],
//         [18.5233892, 83.3433151],
//         [18.5223210, 83.3426070],
//         [18.5212935, 83.3423602],
//         [18.5203576, 83.3427465],
//         [18.5192385, 83.3436155],
//         [18.5178346, 83.3451283],
//         [18.5219649, 83.3548701],
//         [18.5225143, 83.3519733],
//         [18.5228907, 83.3504927],
//         [18.5210595, 83.3615434],
//         [18.5213545, 83.3597410],
//         [18.5219446, 83.3569729],
//         [18.5247117, 83.2926321],
//         [18.5249456, 83.2926750],
//         [18.5266343, 83.2925355],
//         [18.5287604, 83.2921600],
//         [18.5295539, 83.2920205],
//         [18.5306627, 83.2924068],
//         [18.5319445, 83.2931578],
//         [18.5331448, 83.2938981],
//         [18.5352403, 83.2946706],
//         [18.5364101, 83.2952928],
//         [18.5368577, 83.2947886],
//         [18.5374375, 83.2938766],
//         [18.5378546, 83.2938015],
//         [18.5402755, 83.2939625],
//         [18.5418013, 83.2940054],
//         [18.5438255, 83.2941449],
//         [18.5447003, 83.2943916],
//         [18.5463583, 83.2952285],
//         [18.5473958, 83.2954538],
//         [18.5493284, 83.2953036],
//         [18.5617677, 83.2758415],
//         [18.5580756, 83.2814956],
//         [18.5598149, 83.2770002],
//         [18.5723754, 83.2577312],
//         [18.5723754, 83.2608104],
//         [18.5726602, 83.2664215],
//         [18.5726195, 83.2645439],
//         [18.5642595, 83.2745862],
//         [18.5679717, 83.2724404],
//         [18.5715923, 83.2710027],
//         [18.5522883, 83.2952928],
//         [18.5540072, 83.2953143],
//         [18.5590317, 83.2872784],
//         [18.5588486, 83.2836950],
//         [18.5570382, 83.2927287],
//         [18.5587876, 83.2920205],
//         [18.5594487, 83.2914948],
//         [18.5237656, 83.3475530],
//         [18.5239080, 83.3458471],
//         [18.5238571, 83.3442914],
//         [18.5748202, 83.3522594],
//         [18.5202253, 83.3672404],
//         [18.5203372, 83.3651912],
//         [18.5206017, 83.3636355],
//         [18.5225550, 83.3694613],
//         [18.5211613, 83.3690429],
//         [18.5205305, 83.3684206],
//         [18.5278245, 83.3748472],
//         [18.5273668, 83.3719826],
//         [18.5272752, 83.3704162],
//         [18.5257493, 83.3702338],
//         [18.5240606, 83.3698153],
//         [18.5282925, 83.3801687],
//         [18.5282315, 83.3775616],
//         [18.5281297, 83.3760166],
//         [18.5298693, 83.3873033],
//         [18.5297472, 83.3864343],
//         [18.5290351, 83.3852541],
//         [18.5284858, 83.3840740],
//         [18.5282925, 83.3824754],
//         [18.5312324, 83.3876681],
//         [18.5304796, 83.3875286],
//         [18.5348639, 83.3928609],
//         [18.5351895, 83.3911765],
//         [18.5346910, 83.3901250],
//         [18.5342536, 83.3895779],
//         [18.5334500, 83.3888805],
//         [18.5323107, 83.3885801],
//         [18.5317817, 83.3882797],
//         [18.5323310, 83.4009397],
//         [18.5332974, 83.3986866],
//         [18.5336127, 83.3979249],
//         [18.5341010, 83.3953929],
//         [18.5307848, 83.4071624],
//         [18.5305203, 83.4057891],
//         [18.5311307, 83.4037292],
//         [18.5328091, 83.4135139],
//         [18.5321479, 83.4118938],
//         [18.5312832, 83.4093511],
//         [18.5345995, 83.4201872],
//         [18.5340908, 83.4190822],
//         [18.5340298, 83.4176445],
//         [18.5335110, 83.4162176],
//         [18.5332160, 83.4148765],
//         [18.5356777, 83.4212816],
//         [18.5360949, 83.4383940],
//         [18.5361355, 83.4369028],
//         [18.5363288, 83.4360444],
//         [18.5368170, 83.4354651],
//         [18.5364101, 83.4402394],
//         [18.5407333, 83.4267211],
//         [18.5397059, 83.4256911],
//         [18.5384853, 83.4244358],
//         [18.5368781, 83.4224403],
//         [18.5390549, 83.4337807],
//         [18.5399806, 83.4329438],
//         [18.5410181, 83.4315598],
//         [18.5415877, 83.4302509],
//         [18.5418725, 83.4290063],
//         [18.5419234, 83.4278798],
//         [18.5417098, 83.4274828],
//         [18.5380682, 83.4349608],
//         [18.5366950, 83.4488010],
//         [18.5366746, 83.4481788],
//         [18.5366746, 83.4470415],
//         [18.5371120, 83.4449923],
//         [18.5371120, 83.4432864],
//         [18.5369493, 83.4420204],
//         [18.5433373, 83.4495628],
//         [18.5416793, 83.4487903],
//         [18.5395126, 83.4489083],
//         [18.5371018, 83.4490049],
//         [18.5480773, 83.4507859],
//         [18.5464905, 83.4510755],
//         [18.5446901, 83.4510112],
//         [18.5441002, 83.4501743],
//         [18.5545971, 83.4499168],
//         [18.5532647, 83.4497344],
//         [18.5523086, 83.4498525],
//         [18.5509965, 83.4500778],
//         [18.5499895, 83.4501850],
//         [18.5621541, 83.4531569],
//         [18.5602827, 83.4524274],
//         [18.5594385, 83.4520090],
//         [18.5583604, 83.4510326],
//         [18.5566415, 83.4503245],
//         [18.5628152, 83.4599912],
//         [18.5619609, 83.4581458],
//         [18.5623576, 83.4571159],
//         [18.5596725, 83.4658384],
//         [18.5595402, 83.4644115],
//         [18.5598759, 83.4633064],
//         [18.5608625, 83.4619653],
//         [18.5614727, 83.4610104],
//         [18.5617778, 83.4602487],
//         [18.5631407, 83.4549057],
//         [18.5636289, 83.4537041],
//         [18.6018966, 83.2595980],
//         [18.6003510, 83.2578492],
//         [18.6073468, 83.2631171],
//         [18.6056385, 83.2621515],
//         [18.6038795, 83.2607138],
//         [18.6147693, 83.2684815],
//         [18.6138034, 83.2673871],
//         [18.6111394, 83.2655954],
//         [18.6090550, 83.2642329],
//         [18.6157657, 83.2698870],
//         [18.6213577, 83.2755518],
//         [18.6198631, 83.2742321],
//         [18.6193955, 83.2734167],
//         [18.6188464, 83.2727194],
//         [18.6180737, 83.2723975],
//         [18.6169655, 83.2714963],
//         [18.6229235, 83.2764208],
//         [18.6247841, 83.2769143],
//         [18.6267157, 83.2815385],
//         [18.6264006, 83.2804334],
//         [18.6263396, 83.2793927],
//         [18.6260956, 83.2780838],
//         [18.6256889, 83.2774293],
//         [18.6195988, 83.2890594],
//         [18.6200055, 83.2886839],
//         [18.6201987, 83.2882333],
//         [18.6203715, 83.2874286],
//         [18.6210120, 83.2873964],
//         [18.6213679, 83.2917416],
//         [18.6225880, 83.2874715],
//         [18.6251805, 83.2879543],
//         [18.6264107, 83.2878578],
//         [18.6275189, 83.2870638],
//         [18.6279663, 83.2857764],
//         [18.6276918, 83.2845533],
//         [18.6272546, 83.2834268],
//         [18.6238834, 83.2947777],
//         [18.6282001, 83.3000243],
//         [18.6270818, 83.2985759],
//         [18.6254100, 83.2963365],
//         [18.5941685, 83.3613396],
//         [18.5930195, 83.3598590],
//         [18.5928364, 83.3592152],
//         [18.5929889, 83.3591294],
//         [18.5937821, 83.3589148],
//         [18.5945041, 83.3589363],
//         [18.5956633, 83.3588183],
//         [18.6011747, 83.3550632],
//         [18.6021915, 83.3546555],
//         [18.5964667, 83.3587646],
//         [18.5969243, 83.3581853],
//         [18.5971683, 83.3577025],
//         [18.5971581, 83.3572626],
//         [18.5971683, 83.3564472],
//         [18.5973310, 83.3562326],
//         [18.5978699, 83.3559430],
//         [18.5986529, 83.3557176],
//         [18.5997206, 83.3555245],
//         [18.6077332, 83.3482611],
//         [18.6082517, 83.3465767],
//         [18.6086991, 83.3448279],
//         [18.6092075, 83.3431864],
//         [18.6097668, 83.3427465],
//         [18.6101938, 83.3427036],
//         [18.6111191, 83.3429503],
//         [18.6125222, 83.3434009],
//         [18.6138949, 83.3438837],
//         [18.6147489, 83.3443451],
//         [18.6152573, 83.3449030],
//         [18.6026593, 83.3538616],
//         [18.6030660, 83.3534324],
//         [18.6035439, 83.3532715],
//         [18.6041438, 83.3533251],
//         [18.6045912, 83.3530033],
//         [18.6049776, 83.3527458],
//         [18.6053030, 83.3525741],
//         [18.6058928, 83.3526277],
//         [18.6064927, 83.3527028],
//         [18.6066249, 83.3521771],
//         [18.6067265, 83.3513617],
//         [18.6067570, 83.3504069],
//         [18.6067977, 83.3500421],
//         [18.6072349, 83.3492160],
//         [18.6156844, 83.3451819],
//         [18.6166808, 83.3455253],
//         [18.6180127, 83.3463514],
//         [18.6184194, 83.3461904],
//         [18.6187447, 83.3459008],
//         [18.6193548, 83.3453536],
//         [18.6200462, 83.3448493],
//         [18.6206257, 83.3442700],
//         [18.6214696, 83.3439803],
//         [18.6264209, 83.3420920],
//         [18.6267056, 83.3419418],
//         [18.6272546, 83.3418560],
//         [18.6222626, 83.3439696],
//         [18.6228421, 83.3443022],
//         [18.6238588, 83.3451390],
//         [18.6249264, 83.3461797],
//         [18.6248654, 83.3457076],
//         [18.6249975, 83.3448708],
//         [18.6251297, 83.3442378],
//         [18.6255161, 83.3435726],
//         [18.6262786, 83.3433151],
//         [18.6262887, 83.3426285],
//         [18.6280069, 83.3422315],
//         [18.6296133, 83.3025885],
//         [18.6346457, 83.3085537],
//         [18.6330292, 83.3085966],
//         [18.6313924, 83.3084142],
//         [18.6316771, 83.3069336],
//         [18.6318601, 83.3060324],
//         [18.6305283, 83.3041549],
//         [18.6358047, 83.3089399],
//         [18.6352964, 83.3085966],
//         [18.6413452, 83.3151841],
//         [18.6400135, 83.3133280],
//         [18.6384682, 83.3110857],
//         [18.6373499, 83.3101308],
//         [18.6417010, 83.3161390],
//         [18.6432971, 83.3215034],
//         [18.6425245, 83.3194542],
//         [18.6421178, 83.3181882],
//         [18.6442426, 83.3237885],
//         [18.6440189, 83.3281338],
//         [18.6442323, 83.3265352],
//         [18.6448220, 83.3351290],
//         [18.6443747, 83.3328009],
//         [18.6442120, 83.3309770],
//         [18.6439680, 83.3293462],
//         [18.6292574, 83.3419418],
//         [18.6300199, 83.3419633],
//         [18.6312094, 83.3421242],
//         [18.6325514, 83.3418453],
//         [18.6327649, 83.3404505],
//         [18.6329886, 83.3392811],
//         [18.6332732, 83.3384120],
//         [18.6344017, 83.3382296],
//         [18.6287593, 83.3428430],
//         [18.6289321, 83.3421457],
//         [18.6324803, 83.3424461],
//         [18.6364960, 83.3376396],
//         [18.6376244, 83.3374464],
//         [18.6385394, 83.3378219],
//         [18.6395865, 83.3385408],
//         [18.6404099, 83.3391416],
//         [18.6431751, 83.3392918],
//         [18.6445373, 83.3394635],
//         [18.6448829, 83.3379722],
//         [18.6450151, 83.3365774],
//         [18.5953481, 83.3629489],
//         [18.5967310, 83.3669615],
//         [18.5970768, 83.3651054],
//         [18.5971276, 83.3747935],
//         [18.5968836, 83.3721220],
//         [18.5967412, 83.3716285],
//         [18.5962430, 83.3708775],
//         [18.5961718, 83.3704805],
//         [18.5962531, 83.3689892],
//         [18.6013882, 83.3760488],
//         [18.5992427, 83.3768535],
//         [18.5974022, 83.3778727],
//         [18.5974835, 83.3772075],
//         [18.5972395, 83.3759737],
//         [18.6046827, 83.3696329],
//         [18.6043065, 83.3706844],
//         [18.6042658, 83.3716071],
//         [18.6043675, 83.3724546],
//         [18.6047539, 83.3739889],
//         [18.6153488, 83.3730447],
//         [18.6132035, 83.3727765],
//         [18.6119833, 83.3724975],
//         [18.6050793, 83.3749652],
//         [18.6033100, 83.3755124],
//         [18.6077637, 83.3878612],
//         [18.6079162, 83.3872282],
//         [18.6081399, 83.3863807],
//         [18.6084958, 83.3854365],
//         [18.6123799, 83.3795249],
//         [18.6131730, 83.3790958],
//         [18.6144642, 83.3786452],
//         [18.6149320, 83.3782911],
//         [18.6151251, 83.3775186],
//         [18.6154098, 83.3761775],
//         [18.6092787, 83.3835697],
//         [18.6105395, 83.3816814],
//         [18.6077128, 83.3886015],
//         [18.6132441, 83.3943844],
//         [18.6127968, 83.3926678],
//         [18.6126239, 83.3922601],
//         [18.6125629, 83.3914018],
//         [18.6126036, 83.3897710],
//         [18.6113021, 83.3893633],
//         [18.6090957, 83.3888912],
//         [18.6145049, 83.3957684],
//         [18.6134983, 83.3952963],
//         [18.6196700, 83.4008968],
//         [18.6181550, 83.3984935],
//         [18.6170671, 83.3974850],
//         [18.6217237, 83.4061324],
//         [18.6207579, 83.4029245],
//         [18.6175145, 83.4136748],
//         [18.6178399, 83.4136855],
//         [18.6188769, 83.4141254],
//         [18.6242553, 83.4141898],
//         [18.6233301, 83.4115612],
//         [18.6226185, 83.4093833],
//         [18.6089432, 83.4267318],
//         [18.6147489, 83.4200585],
//         [18.6098379, 83.4265065],
//         [18.6103972, 83.4264421],
//         [18.6112818, 83.4265816],
//         [18.6121359, 83.4267855],
//         [18.6122985, 83.4263027],
//         [18.6126544, 83.4251118],
//         [18.6131933, 83.4231591],
//         [18.6138745, 83.4214640],
//         [18.6086381, 83.4307444],
//         [18.6071333, 83.4279871],
//         [18.6103260, 83.4329545],
//         [18.6151556, 83.4398639],
//         [18.6134577, 83.4376860],
//         [18.6121053, 83.4358835],
//         [18.6159385, 83.4183419],
//         [18.6165588, 83.4169149],
//         [18.6170976, 83.4155631],
//         [18.6215509, 83.4149516],
//         [18.6241130, 83.4154880],
//         [18.6212256, 83.4437048],
//         [18.6186837, 83.4435010],
//         [18.6171790, 83.4428573],
//         [18.6163351, 83.4412050],
//         [18.6276308, 83.4437156],
//         [18.6233098, 83.4437585],
//         [18.6175552, 83.4665680],
//         [18.6177687, 83.4654200],
//         [18.6180025, 83.4652591],
//         [18.6201072, 83.4653342],
//         [18.6230658, 83.4654844],
//         [18.6246214, 83.4656775],
//         [18.6259329, 83.4658813],
//         [18.6265327, 83.4658062],
//         [18.6271529, 83.4654415],
//         [18.6278443, 83.4645831],
//         [18.6282713, 83.4639931],
//         [18.6345644, 83.4435010],
//         [18.6337511, 83.4438658],
//         [18.6328767, 83.4445524],
//         [18.6322566, 83.4445953],
//         [18.6308943, 83.4443378],
//         [18.6290033, 83.4437048],
//         [18.6371263, 83.4464729],
//         [18.6369941, 83.4456146],
//         [18.6366180, 83.4445846],
//         [18.6356725, 83.4436941],
//         [18.6404099, 83.4503996],
//         [18.6392002, 83.4508717],
//         [18.6377464, 83.4512472],
//         [18.6364451, 83.4517622],
//         [18.6353370, 83.4520841],
//         [18.6355098, 83.4514296],
//         [18.6359470, 83.4506464],
//         [18.6366180, 83.4493911],
//         [18.6371263, 83.4477496],
//         [18.6333749, 83.4598732],
//         [18.6339747, 83.4598839],
//         [18.6293489, 83.4629738],
//         [18.6310976, 83.4615898],
//         [18.6324803, 83.4603131],
//         [18.6348795, 83.4601092],
//         [18.6416401, 83.4583926],
//         [18.6365061, 83.4596264],
//         [18.6368416, 83.4581995],
//         [18.6372991, 83.4578347],
//         [18.6384072, 83.4574807],
//         [18.6392104, 83.4573197],
//         [18.6400846, 83.4576094],
//         [18.6366078, 83.4608281],
//         [18.6480038, 83.4534144],
//         [18.6470482, 83.4494555],
//         [18.6456352, 83.4495950],
//         [18.6429413, 83.4499061],
//         [18.6417417, 83.4500134],
//         [18.6495896, 83.4512579],
//         [18.6494981, 83.4503245],
//         [18.6494981, 83.4489620],
//         [18.6484308, 83.4491336],
//         [18.6427278, 83.4586608],
//         [18.6445576, 83.4571803],
//         [18.6458284, 83.4557211],
//         [18.5626525, 83.4717178],
//         [18.5611269, 83.4716427],
//         [18.5596521, 83.4712994],
//         [18.5594284, 83.4708488],
//         [18.5596114, 83.4694111],
//         [18.5599064, 83.4681129],
//         [18.5599979, 83.4671044],
//         [18.5694770, 83.4725225],
//         [18.5690904, 83.4721470],
//         [18.5675242, 83.4720719],
//         [18.5656833, 83.4723616],
//         [18.5643713, 83.4720075],
//         [18.5703719, 83.4728229],
//         [18.5714092, 83.4730375],
//         [18.5729246, 83.4734452],
//         [18.5741450, 83.4736597],
//         [18.5750399, 83.4738099],
//         [18.5765654, 83.4738099],
//         [18.5769926, 83.4740460],
//         [18.5778163, 83.4746146],
//         [18.5788435, 83.4754944],
//         [18.5796672, 83.4758484],
//         [18.5802164, 83.4789491],
//         [18.5809079, 83.4814918],
//         [18.5823113, 83.4833050],
//         [18.5837452, 83.4852040],
//         [18.5842943, 83.4857404],
//         [18.5846503, 83.4859121],
//         [18.5865621, 83.4862769],
//         [18.5895518, 83.4869420],
//         [18.5912399, 83.4873819],
//         [18.5924195, 83.4872317],
//         [18.5946871, 83.4873712],
//         [18.5972293, 83.4876931],
//         [18.5992834, 83.4882188],
//         [18.6010628, 83.4884763],
//         [18.6148099, 83.4787881],
//         [18.6154912, 83.4768140],
//         [18.6031168, 83.4889161],
//         [18.6043269, 83.4893453],
//         [18.6055165, 83.4898174],
//         [18.6068384, 83.4905147],
//         [18.6083331, 83.4908473],
//         [18.6128781, 83.4855688],
//         [18.6134678, 83.4842062],
//         [18.6140779, 83.4817386],
//         [18.6093092, 83.4908581],
//         [18.6100820, 83.4900105],
//         [18.6109767, 83.4888625],
//         [18.6122375, 83.4871995],
//         [18.6176263, 83.4729087],
//         [18.6175348, 83.4718573],
//         [18.6172806, 83.4705591],
//         [18.6172196, 83.4690785],
//         [18.6172603, 83.4681666]
//       ]
//       const predefinedArea = sortBoundaryPoints(unsortedPoints);
//     useEffect(() => {
//         const savedShapes = localStorage.getItem('mapShapes');
//         if (savedShapes) {
//             setShapes(JSON.parse(savedShapes));
//         }
//         getCurrentLocation();
//     }, []);

//     useEffect(() => {
//         localStorage.setItem('mapShapes', JSON.stringify(shapes));
//     }, [shapes]);

//     const getCurrentLocation = () => {
//         setLoading(true);
//         setError('');
        
//         if (navigator.geolocation) {
//             navigator.geolocation.getCurrentPosition(
//                 (position) => {
//                     const { latitude, longitude } = position.coords;
//                     const newPosition = [latitude, longitude];
//                     setUserPosition(newPosition);
//                     // Don't set map center here to keep focus on predefined area
//                     setLoading(false);
//                     checkUserLocation(newPosition);
//                 },
//                 (error) => {
//                     setLoading(false);
//                     let errorMessage = 'Unable to get your location. ';
//                     switch(error.code) {
//                         case error.PERMISSION_DENIED:
//                             errorMessage += 'Please enable location services in your browser.';
//                             break;
//                         case error.POSITION_UNAVAILABLE:
//                             errorMessage += 'Location information is unavailable.';
//                             break;
//                         case error.TIMEOUT:
//                             errorMessage += 'Location request timed out.';
//                             break;
//                         default:
//                             errorMessage += 'An unknown error occurred.';
//                     }
//                     setError(errorMessage);
//                 },
//                 {
//                     enableHighAccuracy: true,
//                     timeout: 5000,
//                     maximumAge: 0
//                 }
//             );
//         } else {
//             setLoading(false);
//             setError('Geolocation is not supported by your browser.');
//         }
//     };

//     const handleMapClick = (position) => {
//         if (isDrawing) {
//             setCurrentShape([...currentShape, position]);
//         }
//     };

//     const startDrawing = () => {
//         setIsDrawing(true);
//         setCurrentShape([]);
//         setCurrentAreaName('');
//         setError('');
//     };

//     const cancelDrawing = () => {
//         setIsDrawing(false);
//         setCurrentShape([]);
//         setCurrentAreaName('');
//         setError('');
//     };

//     const finishDrawing = () => {
//         if (currentShape.length > 0 && currentAreaName.trim()) {
//             const newShape = {
//                 points: currentShape,
//                 name: currentAreaName.trim(),
//                 color: `#${Math.floor(Math.random()*16777215).toString(16)}`
//             };
//             setShapes([...shapes, newShape]);
//             setCurrentShape([]);
//             setCurrentAreaName('');
//             setIsDrawing(false);
//             setError('');
//             if (userPosition) {
//                 checkUserLocation(userPosition);
//             }
//         } else if (currentShape.length === 0) {
//             setError('Please draw at least one point on the map');
//         } else {
//             setError('Please provide a name for the area');
//         }
//     };

//     const checkUserLocation = (position) => {
//         let userAreas = [];
//         shapes.forEach(shape => {
//             if (isPointInPolygon(position, shape.points)) {
//                 userAreas.push(shape.name);
//             }
//         });
        
//         if (isPointInPolygon(position, predefinedArea)) {
//             userAreas.push('Predefined Area');
//         }
        
//         if (userAreas.length > 0) {
//             setUserAreaStatus(`You are in: ${userAreas.join(', ')}`);
//         } else {
//             setUserAreaStatus('You are not in any defined area');
//         }
//     };

//     const deleteShape = (index) => {
//         const newShapes = shapes.filter((_, i) => i !== index);
//         setShapes(newShapes);
//         setSelectedShape(null);
//     };

//     return (
//         <div className="h-screen w-screen flex">
//             {/* Sidebar */}
//             <div className="w-64 bg-white shadow-lg z-10 p-4 overflow-y-auto">
//                 <h2 className="text-xl font-bold mb-4">Area Manager</h2>
                
//                 <button
//                     onClick={getCurrentLocation}
//                     disabled={loading}
//                     className="w-full mb-4 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-500 disabled:bg-blue-300"
//                 >
//                     {loading ? 'Getting Location...' : '📍 Get My Location'}
//                 </button>

//                 {userAreaStatus && (
//                     <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
//                         {userAreaStatus}
//                     </div>
//                 )}

//                 {error && (
//                     <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
//                         {error}
//                     </div>
//                 )}

//                 {!isDrawing ? (
//                     <button
//                         onClick={startDrawing}
//                         className="w-full mb-4 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-500"
//                     >
//                         ✏️ Draw New Area
//                     </button>
//                 ) : (
//                     <div className="space-y-2 mb-4">
//                         <input
//                             type="text"
//                             value={currentAreaName}
//                             onChange={(e) => setCurrentAreaName(e.target.value)}
//                             placeholder="Enter area name"
//                             className="w-full p-2 border rounded"
//                         />
//                         <div className="flex space-x-2">
//                             <button
//                                 onClick={finishDrawing}
//                                 className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-500"
//                             >
//                                 Save
//                             </button>
//                             <button
//                                 onClick={cancelDrawing}
//                                 className="flex-1 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-500"
//                             >
//                                 Cancel
//                             </button>
//                         </div>
//                         <p className="text-sm text-gray-600">
//                             Click on the map to draw points. Click Save when finished.
//                         </p>
//                     </div>
//                 )}

//                 <div className="mt-4">
//                     <h3 className="font-bold mb-2">Defined Areas:</h3>
//                     <div className="space-y-2">
//                         {shapes.map((shape, index) => (
//                             <div
//                                 key={index}
//                                 className={`p-2 rounded cursor-pointer flex justify-between items-center ${
//                                     selectedShape === index ? 'bg-blue-100' : 'bg-gray-100'
//                                 }`}
//                                 onClick={() => setSelectedShape(index)}
//                             >
//                                 <span>{shape.name}</span>
//                                 <button
//                                     onClick={(e) => {
//                                         e.stopPropagation();
//                                         deleteShape(index);
//                                     }}
//                                     className="text-red-600 hover:text-red-800"
//                                 >
//                                     ❌
//                                 </button>
//                             </div>
//                         ))}
//                     </div>
//                 </div>
//             </div>

// {/* Map */}
// <div className="flex-1">
//                 <MapContainer
//                     center={mapCenter}
//                     zoom={mapZoom}
//                     className="h-full w-full"
//                 >
//                     <MapController center={mapCenter} zoom={mapZoom} />
//                     <TileLayer
//                         url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//                         attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//                     />
                    
//                     <LocationMarker 
//                         position={userPosition} 
//                         onLocationSelect={handleMapClick}
//                         isDrawing={isDrawing}
//                     />
                    
//                     {/* Current shape being drawn */}
//                     {currentShape.length > 0 && (
//                         <Polygon
//                             positions={currentShape}
//                             pathOptions={{ color: 'red', weight: 2 }}
//                         />
//                     )}

//                     {/* Saved shapes with labels */}
//                     {shapes.map((shape, index) => (
//                         <Polygon
//                             key={index}
//                             positions={shape.points}
//                             pathOptions={{
//                                 color: shape.color,
//                                 weight: selectedShape === index ? 4 : 2,
//                                 fillOpacity: selectedShape === index ? 0.3 : 0.2
//                             }}
//                         >
//                             <Tooltip permanent direction="center" offset={[0, 0]}>
//                                 <span className="font-semibold">{shape.name}</span>
//                             </Tooltip>
//                         </Polygon>
//                     ))}

//                     {/* Predefined area */}
//                     <Polygon
//                         positions={predefinedArea}
//                         pathOptions={{
//                             color: '#3388ff',
//                             weight: 3,
//                             fillOpacity: 0.2
//                         }}
//                     >
//                         <Tooltip permanent direction="center" offset={[0, 0]}>
//                             <span className="font-semibold">Predefined Area</span>
//                         </Tooltip>
//                     </Polygon>
//                 </MapContainer>
//             </div>
//         </div>
//     );
// };

// export default Maps;






// import React, { useState, useEffect } from 'react';
// import { sortBoundaryPoints } from './Algorithm';
// import { MapContainer, TileLayer, Marker, Polygon, useMapEvents, useMap, Tooltip } from 'react-leaflet';
// import L from 'leaflet';
// import 'leaflet/dist/leaflet.css';

// // Set up Leaflet default icons
// delete L.Icon.Default.prototype._getIconUrl;
// L.Icon.Default.mergeOptions({
//     iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
//     iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
//     shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
// });

// const isPointInPolygon = (point, polygon) => {
//     const x = point[0], y = point[1];
//     let inside = false;
    
//     for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
//         const xi = polygon[i][0], yi = polygon[i][1];
//         const xj = polygon[j][0], yj = polygon[j][1];
        
//         const intersect = ((yi > y) !== (yj > y))
//             && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
//         if (intersect) inside = !inside;
//     }
    
//     return inside;
// };

// // Calculate polygon center for label placement
// const calculatePolygonCenter = (points) => {
//     const lat = points.reduce((sum, point) => sum + point[0], 0) / points.length;
//     const lng = points.reduce((sum, point) => sum + point[1], 0) / points.length;
//     return [lat, lng];
// };

// function MapController({ center, zoom }) {
//     const map = useMap();
    
//     useEffect(() => {
//         if (center) {
//             map.setView(center, zoom || map.getZoom());
//         }
//     }, [center, zoom, map]);

//     return null;
// }

// function LocationMarker({ position, onLocationSelect, isDrawing }) {
//     const map = useMapEvents({
//         click(e) {
//             if (isDrawing && onLocationSelect) {
//                 const { lat, lng } = e.latlng;
//                 onLocationSelect([lat, lng]);
//             }
//         },
//     });

//     return position ? (
//         <Marker
//             position={position}
//             icon={new L.Icon({
//                 iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
//                 iconSize: [25, 41],
//                 iconAnchor: [12, 41],
//                 popupAnchor: [1, -34],
//                 shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
//                 shadowSize: [41, 41],
//             })}
//         >
//             <Tooltip permanent>Your Location</Tooltip>
//         </Marker>
//     ) : null;
// }

// const Maps = () => {
//     const [userPosition, setUserPosition] = useState(null);
//     const [loading, setLoading] = useState(false);
//     const [mapCenter, setMapCenter] = useState([14.7504291, 78.57002559]); 
//     const [error, setError] = useState('');
//     const [isDrawing, setIsDrawing] = useState(false);
//     const [currentShape, setCurrentShape] = useState([]);
//     const [shapes, setShapes] = useState([]);
//     const [currentAreaName, setCurrentAreaName] = useState('');
//     const [userAreaStatus, setUserAreaStatus] = useState('');
//     const [selectedShape, setSelectedShape] = useState(null);
//     const [mapZoom, setMapZoom] = useState(14); 

//     const unsortedPoints = [
//         [18.5736873, 83.2562721],
//         [18.5730466, 83.2568622],
//         [18.5809689, 83.2560468],
//         [18.5764027, 83.2561648],
//         [18.5891756, 83.2490837],
//         [18.5883926, 83.2482362],
//         [18.5892366, 83.2472491],
//         [18.5888705, 83.2464230],
//         [18.5878129, 83.2452536],
//         [18.5873451, 83.2452857],
//         [18.5864807, 83.2457149],
//         [18.5857791, 83.2463908],
//         [18.5858299, 83.2475817],
//         [18.5861248, 83.2485795],
//         [18.5862672, 83.2502639],
//         [18.5865723, 83.2526135],
//         [18.5866740, 83.2542443],
//         [18.5864096, 83.2554459],
//         [18.5849960, 83.2556605],
//         [18.5839587, 83.2558966],
//         [18.5907314, 83.2500279],
//         [18.5894806, 83.2478177],
//         [18.5951651, 83.2542121],
//         [18.5943821, 83.2524419],
//         [18.5930398, 83.2513690],
//         [18.5991105, 83.2566905],
//         [18.5977377, 83.2566583],
//         [18.5967005, 83.2565296],
//         [18.5960497, 83.2558215],
//         [18.4969474, 83.3090579],
//         [18.4973137, 83.3086824],
//         [18.5096957, 83.2950890],
//         [18.5103163, 83.2950890],
//         [18.4980056, 83.3083284],
//         [18.4992978, 83.3080923],
//         [18.5006611, 83.3080709],
//         [18.5016684, 83.3082533],
//         [18.5029198, 83.3091009],
//         [18.5103672, 83.2966554],
//         [18.5112523, 83.2954109],
//         [18.5122087, 83.2956684],
//         [18.5122900, 83.2932544],
//         [18.5148131, 83.2933509],
//         [18.5179058, 83.2935548],
//         [18.5181093, 83.2902825],
//         [18.5196963, 83.2903039],
//         [18.5202253, 83.2907760],
//         [18.5204898, 83.2916558],
//         [18.5207238, 83.2926214],
//         [18.5222701, 83.2926428],
//         [18.5120052, 83.3026743],
//         [18.5125444, 83.3018052],
//         [18.5129717, 83.3011293],
//         [18.5129208, 83.2998633],
//         [18.5127580, 83.2992518],
//         [18.5119543, 83.2983291],
//         [18.5109573, 83.2974708],
//         [18.5125851, 83.3087683],
//         [18.5127275, 83.3077168],
//         [18.5128292, 83.3062255],
//         [18.5118119, 83.3048093],
//         [18.5117712, 83.3038974],
//         [18.4973850, 83.3139932],
//         [18.4973646, 83.3125234],
//         [18.4973850, 83.3113968],
//         [18.4972425, 83.3108818],
//         [18.4968966, 83.3097553],
//         [18.4985348, 83.3219217],
//         [18.4979954, 83.3188641],
//         [18.4976800, 83.3160639],
//         [18.5043035, 83.3107316],
//         [18.5059009, 83.3122659],
//         [18.5069081, 83.3133495],
//         [18.5074982, 83.3143473],
//         [18.5078950, 83.3150124],
//         [18.5091769, 83.3158493],
//         [18.5102756, 83.3162141],
//         [18.5023704, 83.3229196],
//         [18.5001219, 83.3228874],
//         [18.5106317, 83.3257735],
//         [18.5067351, 83.3255803],
//         [18.5052395, 83.3254301],
//         [18.5100722, 83.3339381],
//         [18.5105503, 83.3322966],
//         [18.5118221, 83.3157205],
//         [18.5117305, 83.3141327],
//         [18.5116491, 83.3125448],
//         [18.5116186, 83.3115256],
//         [18.5120255, 83.3103347],
//         [18.5114558, 83.3164179],
//         [18.5121374, 83.3160746],
//         [18.5140501, 83.3285200],
//         [18.5154235, 83.3270395],
//         [18.5168173, 83.3257520],
//         [18.5153014, 83.3240569],
//         [18.5151285, 83.3234346],
//         [18.5139992, 83.3235311],
//         [18.5130429, 83.3237243],
//         [18.5121069, 83.3240354],
//         [18.5109980, 83.3240569],
//         [18.5116593, 83.3257842],
//         [18.5115168, 83.3306980],
//         [18.5129310, 83.3296573],
//         [18.5100518, 83.3358049],
//         [18.5117305, 83.3419847],
//         [18.5107233, 83.3383369],
//         [18.5170004, 83.3457398],
//         [18.5162679, 83.3463406],
//         [18.5152200, 83.3468127],
//         [18.5145486, 83.3468234],
//         [18.5139076, 83.3467054],
//         [18.5129717, 83.3456647],
//         [18.5120662, 83.3439910],
//         [18.5233892, 83.3433151],
//         [18.5223210, 83.3426070],
//         [18.5212935, 83.3423602],
//         [18.5203576, 83.3427465],
//         [18.5192385, 83.3436155],
//         [18.5178346, 83.3451283],
//         [18.5219649, 83.3548701],
//         [18.5225143, 83.3519733],
//         [18.5228907, 83.3504927],
//         [18.5210595, 83.3615434],
//         [18.5213545, 83.3597410],
//         [18.5219446, 83.3569729],
//         [18.5247117, 83.2926321],
//         [18.5249456, 83.2926750],
//         [18.5266343, 83.2925355],
//         [18.5287604, 83.2921600],
//         [18.5295539, 83.2920205],
//         [18.5306627, 83.2924068],
//         [18.5319445, 83.2931578],
//         [18.5331448, 83.2938981],
//         [18.5352403, 83.2946706],
//         [18.5364101, 83.2952928],
//         [18.5368577, 83.2947886],
//         [18.5374375, 83.2938766],
//         [18.5378546, 83.2938015],
//         [18.5402755, 83.2939625],
//         [18.5418013, 83.2940054],
//         [18.5438255, 83.2941449],
//         [18.5447003, 83.2943916],
//         [18.5463583, 83.2952285],
//         [18.5473958, 83.2954538],
//         [18.5493284, 83.2953036],
//         [18.5617677, 83.2758415],
//         [18.5580756, 83.2814956],
//         [18.5598149, 83.2770002],
//         [18.5723754, 83.2577312],
//         [18.5723754, 83.2608104],
//         [18.5726602, 83.2664215],
//         [18.5726195, 83.2645439],
//         [18.5642595, 83.2745862],
//         [18.5679717, 83.2724404],
//         [18.5715923, 83.2710027],
//         [18.5522883, 83.2952928],
//         [18.5540072, 83.2953143],
//         [18.5590317, 83.2872784],
//         [18.5588486, 83.2836950],
//         [18.5570382, 83.2927287],
//         [18.5587876, 83.2920205],
//         [18.5594487, 83.2914948],
//         [18.5237656, 83.3475530],
//         [18.5239080, 83.3458471],
//         [18.5238571, 83.3442914],
//         [18.5748202, 83.3522594],
//         [18.5202253, 83.3672404],
//         [18.5203372, 83.3651912],
//         [18.5206017, 83.3636355],
//         [18.5225550, 83.3694613],
//         [18.5211613, 83.3690429],
//         [18.5205305, 83.3684206],
//         [18.5278245, 83.3748472],
//         [18.5273668, 83.3719826],
//         [18.5272752, 83.3704162],
//         [18.5257493, 83.3702338],
//         [18.5240606, 83.3698153],
//         [18.5282925, 83.3801687],
//         [18.5282315, 83.3775616],
//         [18.5281297, 83.3760166],
//         [18.5298693, 83.3873033],
//         [18.5297472, 83.3864343],
//         [18.5290351, 83.3852541],
//         [18.5284858, 83.3840740],
//         [18.5282925, 83.3824754],
//         [18.5312324, 83.3876681],
//         [18.5304796, 83.3875286],
//         [18.5348639, 83.3928609],
//         [18.5351895, 83.3911765],
//         [18.5346910, 83.3901250],
//         [18.5342536, 83.3895779],
//         [18.5334500, 83.3888805],
//         [18.5323107, 83.3885801],
//         [18.5317817, 83.3882797],
//         [18.5323310, 83.4009397],
//         [18.5332974, 83.3986866],
//         [18.5336127, 83.3979249],
//         [18.5341010, 83.3953929],
//         [18.5307848, 83.4071624],
//         [18.5305203, 83.4057891],
//         [18.5311307, 83.4037292],
//         [18.5328091, 83.4135139],
//         [18.5321479, 83.4118938],
//         [18.5312832, 83.4093511],
//         [18.5345995, 83.4201872],
//         [18.5340908, 83.4190822],
//         [18.5340298, 83.4176445],
//         [18.5335110, 83.4162176],
//         [18.5332160, 83.4148765],
//         [18.5356777, 83.4212816],
//         [18.5360949, 83.4383940],
//         [18.5361355, 83.4369028],
//         [18.5363288, 83.4360444],
//         [18.5368170, 83.4354651],
//         [18.5364101, 83.4402394],
//         [18.5407333, 83.4267211],
//         [18.5397059, 83.4256911],
//         [18.5384853, 83.4244358],
//         [18.5368781, 83.4224403],
//         [18.5390549, 83.4337807],
//         [18.5399806, 83.4329438],
//         [18.5410181, 83.4315598],
//         [18.5415877, 83.4302509],
//         [18.5418725, 83.4290063],
//         [18.5419234, 83.4278798],
//         [18.5417098, 83.4274828],
//         [18.5380682, 83.4349608],
//         [18.5366950, 83.4488010],
//         [18.5366746, 83.4481788],
//         [18.5366746, 83.4470415],
//         [18.5371120, 83.4449923],
//         [18.5371120, 83.4432864],
//         [18.5369493, 83.4420204],
//         [18.5433373, 83.4495628],
//         [18.5416793, 83.4487903],
//         [18.5395126, 83.4489083],
//         [18.5371018, 83.4490049],
//         [18.5480773, 83.4507859],
//         [18.5464905, 83.4510755],
//         [18.5446901, 83.4510112],
//         [18.5441002, 83.4501743],
//         [18.5545971, 83.4499168],
//         [18.5532647, 83.4497344],
//         [18.5523086, 83.4498525],
//         [18.5509965, 83.4500778],
//         [18.5499895, 83.4501850],
//         [18.5621541, 83.4531569],
//         [18.5602827, 83.4524274],
//         [18.5594385, 83.4520090],
//         [18.5583604, 83.4510326],
//         [18.5566415, 83.4503245],
//         [18.5628152, 83.4599912],
//         [18.5619609, 83.4581458],
//         [18.5623576, 83.4571159],
//         [18.5596725, 83.4658384],
//         [18.5595402, 83.4644115],
//         [18.5598759, 83.4633064],
//         [18.5608625, 83.4619653],
//         [18.5614727, 83.4610104],
//         [18.5617778, 83.4602487],
//         [18.5631407, 83.4549057],
//         [18.5636289, 83.4537041],
//         [18.6018966, 83.2595980],
//         [18.6003510, 83.2578492],
//         [18.6073468, 83.2631171],
//         [18.6056385, 83.2621515],
//         [18.6038795, 83.2607138],
//         [18.6147693, 83.2684815],
//         [18.6138034, 83.2673871],
//         [18.6111394, 83.2655954],
//         [18.6090550, 83.2642329],
//         [18.6157657, 83.2698870],
//         [18.6213577, 83.2755518],
//         [18.6198631, 83.2742321],
//         [18.6193955, 83.2734167],
//         [18.6188464, 83.2727194],
//         [18.6180737, 83.2723975],
//         [18.6169655, 83.2714963],
//         [18.6229235, 83.2764208],
//         [18.6247841, 83.2769143],
//         [18.6267157, 83.2815385],
//         [18.6264006, 83.2804334],
//         [18.6263396, 83.2793927],
//         [18.6260956, 83.2780838],
//         [18.6256889, 83.2774293],
//         [18.6195988, 83.2890594],
//         [18.6200055, 83.2886839],
//         [18.6201987, 83.2882333],
//         [18.6203715, 83.2874286],
//         [18.6210120, 83.2873964],
//         [18.6213679, 83.2917416],
//         [18.6225880, 83.2874715],
//         [18.6251805, 83.2879543],
//         [18.6264107, 83.2878578],
//         [18.6275189, 83.2870638],
//         [18.6279663, 83.2857764],
//         [18.6276918, 83.2845533],
//         [18.6272546, 83.2834268],
//         [18.6238834, 83.2947777],
//         [18.6282001, 83.3000243],
//         [18.6270818, 83.2985759],
//         [18.6254100, 83.2963365],
//         [18.5941685, 83.3613396],
//         [18.5930195, 83.3598590],
//         [18.5928364, 83.3592152],
//         [18.5929889, 83.3591294],
//         [18.5937821, 83.3589148],
//         [18.5945041, 83.3589363],
//         [18.5956633, 83.3588183],
//         [18.6011747, 83.3550632],
//         [18.6021915, 83.3546555],
//         [18.5964667, 83.3587646],
//         [18.5969243, 83.3581853],
//         [18.5971683, 83.3577025],
//         [18.5971581, 83.3572626],
//         [18.5971683, 83.3564472],
//         [18.5973310, 83.3562326],
//         [18.5978699, 83.3559430],
//         [18.5986529, 83.3557176],
//         [18.5997206, 83.3555245],
//         [18.6077332, 83.3482611],
//         [18.6082517, 83.3465767],
//         [18.6086991, 83.3448279],
//         [18.6092075, 83.3431864],
//         [18.6097668, 83.3427465],
//         [18.6101938, 83.3427036],
//         [18.6111191, 83.3429503],
//         [18.6125222, 83.3434009],
//         [18.6138949, 83.3438837],
//         [18.6147489, 83.3443451],
//         [18.6152573, 83.3449030],
//         [18.6026593, 83.3538616],
//         [18.6030660, 83.3534324],
//         [18.6035439, 83.3532715],
//         [18.6041438, 83.3533251],
//         [18.6045912, 83.3530033],
//         [18.6049776, 83.3527458],
//         [18.6053030, 83.3525741],
//         [18.6058928, 83.3526277],
//         [18.6064927, 83.3527028],
//         [18.6066249, 83.3521771],
//         [18.6067265, 83.3513617],
//         [18.6067570, 83.3504069],
//         [18.6067977, 83.3500421],
//         [18.6072349, 83.3492160],
//         [18.6156844, 83.3451819],
//         [18.6166808, 83.3455253],
//         [18.6180127, 83.3463514],
//         [18.6184194, 83.3461904],
//         [18.6187447, 83.3459008],
//         [18.6193548, 83.3453536],
//         [18.6200462, 83.3448493],
//         [18.6206257, 83.3442700],
//         [18.6214696, 83.3439803],
//         [18.6264209, 83.3420920],
//         [18.6267056, 83.3419418],
//         [18.6272546, 83.3418560],
//         [18.6222626, 83.3439696],
//         [18.6228421, 83.3443022],
//         [18.6238588, 83.3451390],
//         [18.6249264, 83.3461797],
//         [18.6248654, 83.3457076],
//         [18.6249975, 83.3448708],
//         [18.6251297, 83.3442378],
//         [18.6255161, 83.3435726],
//         [18.6262786, 83.3433151],
//         [18.6262887, 83.3426285],
//         [18.6280069, 83.3422315],
//         [18.6296133, 83.3025885],
//         [18.6346457, 83.3085537],
//         [18.6330292, 83.3085966],
//         [18.6313924, 83.3084142],
//         [18.6316771, 83.3069336],
//         [18.6318601, 83.3060324],
//         [18.6305283, 83.3041549],
//         [18.6358047, 83.3089399],
//         [18.6352964, 83.3085966],
//         [18.6413452, 83.3151841],
//         [18.6400135, 83.3133280],
//         [18.6384682, 83.3110857],
//         [18.6373499, 83.3101308],
//         [18.6417010, 83.3161390],
//         [18.6432971, 83.3215034],
//         [18.6425245, 83.3194542],
//         [18.6421178, 83.3181882],
//         [18.6442426, 83.3237885],
//         [18.6440189, 83.3281338],
//         [18.6442323, 83.3265352],
//         [18.6448220, 83.3351290],
//         [18.6443747, 83.3328009],
//         [18.6442120, 83.3309770],
//         [18.6439680, 83.3293462],
//         [18.6292574, 83.3419418],
//         [18.6300199, 83.3419633],
//         [18.6312094, 83.3421242],
//         [18.6325514, 83.3418453],
//         [18.6327649, 83.3404505],
//         [18.6329886, 83.3392811],
//         [18.6332732, 83.3384120],
//         [18.6344017, 83.3382296],
//         [18.6287593, 83.3428430],
//         [18.6289321, 83.3421457],
//         [18.6324803, 83.3424461],
//         [18.6364960, 83.3376396],
//         [18.6376244, 83.3374464],
//         [18.6385394, 83.3378219],
//         [18.6395865, 83.3385408],
//         [18.6404099, 83.3391416],
//         [18.6431751, 83.3392918],
//         [18.6445373, 83.3394635],
//         [18.6448829, 83.3379722],
//         [18.6450151, 83.3365774],
//         [18.5953481, 83.3629489],
//         [18.5967310, 83.3669615],
//         [18.5970768, 83.3651054],
//         [18.5971276, 83.3747935],
//         [18.5968836, 83.3721220],
//         [18.5967412, 83.3716285],
//         [18.5962430, 83.3708775],
//         [18.5961718, 83.3704805],
//         [18.5962531, 83.3689892],
//         [18.6013882, 83.3760488],
//         [18.5992427, 83.3768535],
//         [18.5974022, 83.3778727],
//         [18.5974835, 83.3772075],
//         [18.5972395, 83.3759737],
//         [18.6046827, 83.3696329],
//         [18.6043065, 83.3706844],
//         [18.6042658, 83.3716071],
//         [18.6043675, 83.3724546],
//         [18.6047539, 83.3739889],
//         [18.6153488, 83.3730447],
//         [18.6132035, 83.3727765],
//         [18.6119833, 83.3724975],
//         [18.6050793, 83.3749652],
//         [18.6033100, 83.3755124],
//         [18.6077637, 83.3878612],
//         [18.6079162, 83.3872282],
//         [18.6081399, 83.3863807],
//         [18.6084958, 83.3854365],
//         [18.6123799, 83.3795249],
//         [18.6131730, 83.3790958],
//         [18.6144642, 83.3786452],
//         [18.6149320, 83.3782911],
//         [18.6151251, 83.3775186],
//         [18.6154098, 83.3761775],
//         [18.6092787, 83.3835697],
//         [18.6105395, 83.3816814],
//         [18.6077128, 83.3886015],
//         [18.6132441, 83.3943844],
//         [18.6127968, 83.3926678],
//         [18.6126239, 83.3922601],
//         [18.6125629, 83.3914018],
//         [18.6126036, 83.3897710],
//         [18.6113021, 83.3893633],
//         [18.6090957, 83.3888912],
//         [18.6145049, 83.3957684],
//         [18.6134983, 83.3952963],
//         [18.6196700, 83.4008968],
//         [18.6181550, 83.3984935],
//         [18.6170671, 83.3974850],
//         [18.6217237, 83.4061324],
//         [18.6207579, 83.4029245],
//         [18.6175145, 83.4136748],
//         [18.6178399, 83.4136855],
//         [18.6188769, 83.4141254],
//         [18.6242553, 83.4141898],
//         [18.6233301, 83.4115612],
//         [18.6226185, 83.4093833],
//         [18.6089432, 83.4267318],
//         [18.6147489, 83.4200585],
//         [18.6098379, 83.4265065],
//         [18.6103972, 83.4264421],
//         [18.6112818, 83.4265816],
//         [18.6121359, 83.4267855],
//         [18.6122985, 83.4263027],
//         [18.6126544, 83.4251118],
//         [18.6131933, 83.4231591],
//         [18.6138745, 83.4214640],
//         [18.6086381, 83.4307444],
//         [18.6071333, 83.4279871],
//         [18.6103260, 83.4329545],
//         [18.6151556, 83.4398639],
//         [18.6134577, 83.4376860],
//         [18.6121053, 83.4358835],
//         [18.6159385, 83.4183419],
//         [18.6165588, 83.4169149],
//         [18.6170976, 83.4155631],
//         [18.6215509, 83.4149516],
//         [18.6241130, 83.4154880],
//         [18.6212256, 83.4437048],
//         [18.6186837, 83.4435010],
//         [18.6171790, 83.4428573],
//         [18.6163351, 83.4412050],
//         [18.6276308, 83.4437156],
//         [18.6233098, 83.4437585],
//         [18.6175552, 83.4665680],
//         [18.6177687, 83.4654200],
//         [18.6180025, 83.4652591],
//         [18.6201072, 83.4653342],
//         [18.6230658, 83.4654844],
//         [18.6246214, 83.4656775],
//         [18.6259329, 83.4658813],
//         [18.6265327, 83.4658062],
//         [18.6271529, 83.4654415],
//         [18.6278443, 83.4645831],
//         [18.6282713, 83.4639931],
//         [18.6345644, 83.4435010],
//         [18.6337511, 83.4438658],
//         [18.6328767, 83.4445524],
//         [18.6322566, 83.4445953],
//         [18.6308943, 83.4443378],
//         [18.6290033, 83.4437048],
//         [18.6371263, 83.4464729],
//         [18.6369941, 83.4456146],
//         [18.6366180, 83.4445846],
//         [18.6356725, 83.4436941],
//         [18.6404099, 83.4503996],
//         [18.6392002, 83.4508717],
//         [18.6377464, 83.4512472],
//         [18.6364451, 83.4517622],
//         [18.6353370, 83.4520841],
//         [18.6355098, 83.4514296],
//         [18.6359470, 83.4506464],
//         [18.6366180, 83.4493911],
//         [18.6371263, 83.4477496],
//         [18.6333749, 83.4598732],
//         [18.6339747, 83.4598839],
//         [18.6293489, 83.4629738],
//         [18.6310976, 83.4615898],
//         [18.6324803, 83.4603131],
//         [18.6348795, 83.4601092],
//         [18.6416401, 83.4583926],
//         [18.6365061, 83.4596264],
//         [18.6368416, 83.4581995],
//         [18.6372991, 83.4578347],
//         [18.6384072, 83.4574807],
//         [18.6392104, 83.4573197],
//         [18.6400846, 83.4576094],
//         [18.6366078, 83.4608281],
//         [18.6480038, 83.4534144],
//         [18.6470482, 83.4494555],
//         [18.6456352, 83.4495950],
//         [18.6429413, 83.4499061],
//         [18.6417417, 83.4500134],
//         [18.6495896, 83.4512579],
//         [18.6494981, 83.4503245],
//         [18.6494981, 83.4489620],
//         [18.6484308, 83.4491336],
//         [18.6427278, 83.4586608],
//         [18.6445576, 83.4571803],
//         [18.6458284, 83.4557211],
//         [18.5626525, 83.4717178],
//         [18.5611269, 83.4716427],
//         [18.5596521, 83.4712994],
//         [18.5594284, 83.4708488],
//         [18.5596114, 83.4694111],
//         [18.5599064, 83.4681129],
//         [18.5599979, 83.4671044],
//         [18.5694770, 83.4725225],
//         [18.5690904, 83.4721470],
//         [18.5675242, 83.4720719],
//         [18.5656833, 83.4723616],
//         [18.5643713, 83.4720075],
//         [18.5703719, 83.4728229],
//         [18.5714092, 83.4730375],
//         [18.5729246, 83.4734452],
//         [18.5741450, 83.4736597],
//         [18.5750399, 83.4738099],
//         [18.5765654, 83.4738099],
//         [18.5769926, 83.4740460],
//         [18.5778163, 83.4746146],
//         [18.5788435, 83.4754944],
//         [18.5796672, 83.4758484],
//         [18.5802164, 83.4789491],
//         [18.5809079, 83.4814918],
//         [18.5823113, 83.4833050],
//         [18.5837452, 83.4852040],
//         [18.5842943, 83.4857404],
//         [18.5846503, 83.4859121],
//         [18.5865621, 83.4862769],
//         [18.5895518, 83.4869420],
//         [18.5912399, 83.4873819],
//         [18.5924195, 83.4872317],
//         [18.5946871, 83.4873712],
//         [18.5972293, 83.4876931],
//         [18.5992834, 83.4882188],
//         [18.6010628, 83.4884763],
//         [18.6148099, 83.4787881],
//         [18.6154912, 83.4768140],
//         [18.6031168, 83.4889161],
//         [18.6043269, 83.4893453],
//         [18.6055165, 83.4898174],
//         [18.6068384, 83.4905147],
//         [18.6083331, 83.4908473],
//         [18.6128781, 83.4855688],
//         [18.6134678, 83.4842062],
//         [18.6140779, 83.4817386],
//         [18.6093092, 83.4908581],
//         [18.6100820, 83.4900105],
//         [18.6109767, 83.4888625],
//         [18.6122375, 83.4871995],
//         [18.6176263, 83.4729087],
//         [18.6175348, 83.4718573],
//         [18.6172806, 83.4705591],
//         [18.6172196, 83.4690785],
//         [18.6172603, 83.4681666]
//       ]
//       const predefinedArea = sortBoundaryPoints(unsortedPoints);
//     useEffect(() => {
//         const savedShapes = localStorage.getItem('mapShapes');
//         if (savedShapes) {
//             setShapes(JSON.parse(savedShapes));
//         }
//         getCurrentLocation();
//     }, []);

//     useEffect(() => {
//         localStorage.setItem('mapShapes', JSON.stringify(shapes));
//     }, [shapes]);

//     const getCurrentLocation = () => {
//         setLoading(true);
//         setError('');
        
//         if (navigator.geolocation) {
//             navigator.geolocation.getCurrentPosition(
//                 (position) => {
//                     const { latitude, longitude } = position.coords;
//                     const newPosition = [latitude, longitude];
//                     setUserPosition(newPosition);
//                     // Don't set map center here to keep focus on predefined area
//                     setLoading(false);
//                     checkUserLocation(newPosition);
//                 },
//                 (error) => {
//                     setLoading(false);
//                     let errorMessage = 'Unable to get your location. ';
//                     switch(error.code) {
//                         case error.PERMISSION_DENIED:
//                             errorMessage += 'Please enable location services in your browser.';
//                             break;
//                         case error.POSITION_UNAVAILABLE:
//                             errorMessage += 'Location information is unavailable.';
//                             break;
//                         case error.TIMEOUT:
//                             errorMessage += 'Location request timed out.';
//                             break;
//                         default:
//                             errorMessage += 'An unknown error occurred.';
//                     }
//                     setError(errorMessage);
//                 },
//                 {
//                     enableHighAccuracy: true,
//                     timeout: 5000,
//                     maximumAge: 0
//                 }
//             );
//         } else {
//             setLoading(false);
//             setError('Geolocation is not supported by your browser.');
//         }
//     };

//     const handleMapClick = (position) => {
//         if (isDrawing) {
//             setCurrentShape([...currentShape, position]);
//         }
//     };

//     const startDrawing = () => {
//         setIsDrawing(true);
//         setCurrentShape([]);
//         setCurrentAreaName('');
//         setError('');
//     };

//     const cancelDrawing = () => {
//         setIsDrawing(false);
//         setCurrentShape([]);
//         setCurrentAreaName('');
//         setError('');
//     };

//     const finishDrawing = () => {
//         if (currentShape.length > 0 && currentAreaName.trim()) {
//             const newShape = {
//                 points: currentShape,
//                 name: currentAreaName.trim(),
//                 color: `#${Math.floor(Math.random()*16777215).toString(16)}`
//             };
//             setShapes([...shapes, newShape]);
//             setCurrentShape([]);
//             setCurrentAreaName('');
//             setIsDrawing(false);
//             setError('');
//             if (userPosition) {
//                 checkUserLocation(userPosition);
//             }
//         } else if (currentShape.length === 0) {
//             setError('Please draw at least one point on the map');
//         } else {
//             setError('Please provide a name for the area');
//         }
//     };

//     const checkUserLocation = (position) => {
//         let userAreas = [];
//         shapes.forEach(shape => {
//             if (isPointInPolygon(position, shape.points)) {
//                 userAreas.push(shape.name);
//             }
//         });
        
//         if (isPointInPolygon(position, predefinedArea)) {
//             userAreas.push('Predefined Area');
//         }
        
//         if (userAreas.length > 0) {
//             setUserAreaStatus(`You are in: ${userAreas.join(', ')}`);
//         } else {
//             setUserAreaStatus('You are not in any defined area');
//         }
//     };

//     const deleteShape = (index) => {
//         const newShapes = shapes.filter((_, i) => i !== index);
//         setShapes(newShapes);
//         setSelectedShape(null);
//     };

//     return (
//         <div className="h-screen w-screen flex">
//             {/* Sidebar */}
//             <div className="w-64 bg-white shadow-lg z-10 p-4 overflow-y-auto">
//                 <h2 className="text-xl font-bold mb-4">Area Manager</h2>
                
//                 <button
//                     onClick={getCurrentLocation}
//                     disabled={loading}
//                     className="w-full mb-4 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-500 disabled:bg-blue-300"
//                 >
//                     {loading ? 'Getting Location...' : '📍 Get My Location'}
//                 </button>

//                 {userAreaStatus && (
//                     <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
//                         {userAreaStatus}
//                     </div>
//                 )}

//                 {error && (
//                     <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
//                         {error}
//                     </div>
//                 )}

//                 {!isDrawing ? (
//                     <button
//                         onClick={startDrawing}
//                         className="w-full mb-4 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-500"
//                     >
//                         ✏️ Draw New Area
//                     </button>
//                 ) : (
//                     <div className="space-y-2 mb-4">
//                         <input
//                             type="text"
//                             value={currentAreaName}
//                             onChange={(e) => setCurrentAreaName(e.target.value)}
//                             placeholder="Enter area name"
//                             className="w-full p-2 border rounded"
//                         />
//                         <div className="flex space-x-2">
//                             <button
//                                 onClick={finishDrawing}
//                                 className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-500"
//                             >
//                                 Save
//                             </button>
//                             <button
//                                 onClick={cancelDrawing}
//                                 className="flex-1 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-500"
//                             >
//                                 Cancel
//                             </button>
//                         </div>
//                         <p className="text-sm text-gray-600">
//                             Click on the map to draw points. Click Save when finished.
//                         </p>
//                     </div>
//                 )}

//                 <div className="mt-4">
//                     <h3 className="font-bold mb-2">Defined Areas:</h3>
//                     <div className="space-y-2">
//                         {shapes.map((shape, index) => (
//                             <div
//                                 key={index}
//                                 className={`p-2 rounded cursor-pointer flex justify-between items-center ${
//                                     selectedShape === index ? 'bg-blue-100' : 'bg-gray-100'
//                                 }`}
//                                 onClick={() => setSelectedShape(index)}
//                             >
//                                 <span>{shape.name}</span>
//                                 <button
//                                     onClick={(e) => {
//                                         e.stopPropagation();
//                                         deleteShape(index);
//                                     }}
//                                     className="text-red-600 hover:text-red-800"
//                                 >
//                                     ❌
//                                 </button>
//                             </div>
//                         ))}
//                     </div>
//                 </div>
//             </div>

// {/* Map */}
// <div className="flex-1">
//                 <MapContainer
//                     center={mapCenter}
//                     zoom={mapZoom}
//                     className="h-full w-full"
//                 >
//                     <MapController center={mapCenter} zoom={mapZoom} />
//                     <TileLayer
//                         url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//                         attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//                     />
                    
//                     <LocationMarker 
//                         position={userPosition} 
//                         onLocationSelect={handleMapClick}
//                         isDrawing={isDrawing}
//                     />
                    
//                     <Polygon
//                         positions={predefinedArea}
//                         pathOptions={{
//                             color: '#3388ff',
//                             weight: 2,
//                             fillOpacity: 0,
//                             fill: false
//                         }}
//                     />

//                     {/* Display user-drawn shapes */}
//                     {shapes.map((shape, index) => (
//                         <Polygon
//                             key={index}
//                             positions={shape.points}
//                             pathOptions={{
//                                 color: shape.color,
//                                 weight: 2,
//                                 fillOpacity: 0,
//                                 fill: false
//                             }}
//                         >
//                             <Tooltip permanent>
//                                 {shape.name}
//                             </Tooltip>
//                         </Polygon>
//                     ))}

//                     {/* Current shape being drawn */}
//                     {currentShape.length > 0 && (
//                         <Polygon
//                             positions={currentShape}
//                             pathOptions={{
//                                 color: '#ff3388',
//                                 weight: 2,
//                                 fillOpacity: 0,
//                                 fill: false
//                             }}
//                         />
//                     )}
//                 </MapContainer>
//             </div>
//         </div>
//     );
// };

// export default Maps;
