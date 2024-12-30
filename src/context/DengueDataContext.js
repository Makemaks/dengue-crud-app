import React, { createContext, useContext, useState, useCallback } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

const DengueDataContext = createContext();

export const useDengueData = () => useContext(DengueDataContext);

export const DengueDataProvider = ({ children }) => {
  const [data, setData] = useState([]); // Cached data
  const [loading, setLoading] = useState(false);
  const [fetchedOnce, setFetchedOnce] = useState(false); // Track if data has been fetched at least once

  const fetchData = useCallback(async (force = false) => {
    if (!force && fetchedOnce) {
      // Prevent fetching if data has already been fetched once unless forced
      console.log("Using cached data");
      return;
    }

    setLoading(true);
    try {
      const dengueCollection = collection(db, "dengue_cases_lab3");
      const dengueSnapshot = await getDocs(dengueCollection);
      const fetchedData = dengueSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        date: new Date(doc.data().date),
      }));
      console.log("Fetched data:", fetchedData);
      setData(fetchedData);
      setFetchedOnce(true); // Mark data as fetched
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [fetchedOnce]);

  return (
    <DengueDataContext.Provider value={{ data, fetchData, loading }}>
      {children}
    </DengueDataContext.Provider>
  );
};
