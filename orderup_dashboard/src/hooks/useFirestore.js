import { useState, useEffect } from 'react';
import { collection, collectionGroup, query, onSnapshot, orderBy, limit, where } from 'firebase/firestore';
import { db } from '../firebase';

export function useCollection(path, queryConstraints = []) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Attempting to query Firestore. Note: Requires valid environment variables.
    if (!import.meta.env.VITE_FIREBASE_API_KEY) {
      setError(new Error("Firebase is not configured. (Missing Env Vars)"));
      setLoading(false);
      return;
    }

    try {
      const colRef = collection(db, path);
      const q = query(colRef, ...queryConstraints);
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setData(docs);
        setLoading(false);
      }, (err) => {
        console.error(`Error fetching ${path}:`, err);
        setError(err);
        setLoading(false);
      });

      return unsubscribe;
    } catch (err) {
      setError(err);
      setLoading(false);
    }
  }, [path, JSON.stringify(queryConstraints)]);

  return { data, loading, error };
}

export function useCollectionGroup(path, queryConstraints = []) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!import.meta.env.VITE_FIREBASE_API_KEY) {
      setError(new Error("Firebase is not configured."));
      setLoading(false);
      return;
    }

    try {
      const q = query(collectionGroup(db, path), ...queryConstraints);
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setData(docs);
        setLoading(false);
      }, (err) => {
        console.error(`Error fetching collectionGroup ${path}:`, err);
        setError(err);
        setLoading(false);
      });
      return unsubscribe;
    } catch (err) {
      setError(err);
      setLoading(false);
    }
  }, [path, JSON.stringify(queryConstraints)]);

  return { data, loading, error };
}
