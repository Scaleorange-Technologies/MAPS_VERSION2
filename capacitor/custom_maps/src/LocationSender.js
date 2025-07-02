// src/LocationSender.js
import { Geolocation } from '@capacitor/geolocation';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebaseConfig';

export const startSendingLocation = (senderId) => {
  const sendLocation = async () => {
    try {
      const position = await Geolocation.getCurrentPosition();
      const { latitude, longitude } = position.coords;

      await setDoc(doc(db, 'live_locations', senderId), {
        latitude,
        longitude,
        timestamp: serverTimestamp(),
      });

      console.log(`📡 Location updated for ${senderId}`);
    } catch (err) {
      console.error('Failed to get location:', err);
    }
  };

  // Send every 5 seconds
  sendLocation(); // initial
  return setInterval(sendLocation, 5000);
};
