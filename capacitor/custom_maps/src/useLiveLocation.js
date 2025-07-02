// src/useLiveLocation.js
import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './firebaseConfig';

export const useLiveLocation = (senderId) => {
  const [location, setLocation] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'live_locations', senderId), (docSnap) => {
      if (docSnap.exists()) {
        setLocation(docSnap.data());
      }
    });

    return () => unsub();
  }, [senderId]);

  return location;
};
