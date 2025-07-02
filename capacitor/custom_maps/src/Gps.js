import React, { useState } from "react";

const GPSComponent = () => {
  const [location, setLocation] = useState({
    latitude: null,
    longitude: null,
    error: null,
  });

  const getLocation = () => {
    if (!navigator.geolocation) {
      setLocation((prevState) => ({
        ...prevState,
        error: "Geolocation is not supported by your browser.",
      }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          error: null,
        });
      },
      (error) => {
        setLocation((prevState) => ({
          ...prevState,
          error: error.message,
        }));
      }
    );
  };

  return (
    <div>
      <h1>GPS Location</h1>
      <button onClick={getLocation}>Get Location</button>
      {location.latitude && location.longitude && (
        <p>
          Latitude: {location.latitude}, Longitude: {location.longitude}
        </p>
      )}
      {location.error && <p>Error: {location.error}</p>}
    </div>
  );
};

export default GPSComponent;
