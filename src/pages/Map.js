import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase"; // Ensure Firebase is configured correctly
import philippinesGeoJSON from "../philippines-geojson.json";
import { ProgressSpinner } from "primereact/progressspinner";

// Reference mapping of region codes to names
const regionMapping = {
  PH00: "NATIONAL CAPITAL REGION",
  PH01: "Region I-ILOCOS REGION",
  PH02: "Region II-CAGAYAN VALLEY",
  PH03: "REGION III-CENTRAL LUZON",
  PH05: "REGION V-BICOL REGION",
  PH06: "REGION VI-WESTERN VISAYAS",
  PH07: "Region VII-CENTRAL VISAYAS",
  PH08: "Region VIII-EASTERN VISAYAS",
  PH09: "Region IX-ZAMBOANGA PENINSULA",
  PH10: "Region X-NORTHERN MINDANAO",
  PH11: "Region XI-DAVAO REGION",
  PH12: "Region XII-SOCCSKSARGEN",
  PH13: "CARAGA",
  PH14: "BARMM",
  PH15: "CAR",
  PH40: "REGION IV-A-CALABARZON",
  PH41: "REGION IVB-MIMAROPA",
};

// Helper function to normalize region names
const normalizeRegion = (region) => {
  if (!region || typeof region !== "string") {
    return null;
  }
  return Object.keys(regionMapping).find(
    (code) => regionMapping[code].toLowerCase() === region.toLowerCase()
  );
};

const MapComponent = () => {
  const [geoData, setGeoData] = useState(null); // Enriched GeoJSON data
  const [loading, setLoading] = useState(false); // Loading state
  const [meanCases, setMeanCases] = useState(0);
  const [meanDeaths, setMeanDeaths] = useState(0);

  useEffect(() => {
    const fetchAndProcessData = async () => {
      setLoading(true);

      try {
        // Fetch dengue data from Firebase
        const dengueCollection = collection(db, "dengue_cases_lab3");
        const dengueSnapshot = await getDocs(dengueCollection);
        const dengue_cases_lab3 = dengueSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          date: new Date(doc.data().date),
        }));

        console.log("Fetched Dengue Data:", dengue_cases_lab3);

        // Aggregate dengue cases and deaths by GeoJSON region codes
        const regionCases = dengue_cases_lab3.reduce((acc, entry) => {
          const { region, cases, deaths } = entry;
          const regionCode = normalizeRegion(region);
          if (regionCode) {
            acc[regionCode] = acc[regionCode] || { cases: 0, deaths: 0 };
            acc[regionCode].cases += cases;
            acc[regionCode].deaths += deaths;
          }
          return acc;
        }, {});

        console.log("Processed Region Cases:", regionCases);

        // Calculate the mean for cases and deaths
        const totalCases = Object.values(regionCases).reduce(
          (sum, r) => sum + r.cases,
          0
        );
        const totalDeaths = Object.values(regionCases).reduce(
          (sum, r) => sum + r.deaths,
          0
        );
        const regionCount = Object.keys(regionCases).length;

        setMeanCases(totalCases / regionCount || 0);
        setMeanDeaths(totalDeaths / regionCount || 0);

        // Enrich GeoJSON with dengue cases and deaths
        const enrichedData = { ...philippinesGeoJSON };
        enrichedData.features = enrichedData.features.map((feature) => {
          const regionCode = feature.properties.id; // Match using `id`
          const cases = regionCases[regionCode]?.cases || 0;
          const deaths = regionCases[regionCode]?.deaths || 0;

          console.log(`Region: ${regionCode}, Cases: ${cases}, Deaths: ${deaths}`);

          return {
            ...feature,
            properties: {
              ...feature.properties,
              cases,
              deaths,
            },
          };
        });

        setGeoData(enrichedData); // Set enriched GeoJSON
      } catch (error) {
        console.error("Error fetching dengue data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAndProcessData();
  }, []); // Empty dependency array ensures it runs only once

  // Function to determine fill color based on case count compared to the mean
  const getColor = (cases) => {
    return cases > meanCases * 1.5
      ? "#FF0000" // Bright Red for significantly high cases
      : cases > meanCases
      ? "#FF4500" // Orange-Red for high cases
      : cases > meanCases * 0.75
      ? "#FFA500" // Orange for moderately high cases
      : cases > meanCases * 0.5
      ? "#FFFF00" // Yellow for moderate cases
      : cases > meanCases * 0.25
      ? "#ADFF2F" // Light Green for low-moderate cases
      : "#00FF00"; // Green for very low cases
  };
  

  // Style function for GeoJSON features
  const style = (feature) => ({
    fillColor: getColor(feature.properties.cases),
    weight: 2,
    opacity: 1,
    color: "white",
    dashArray: "3",
    fillOpacity: 0.7,
  });

  // Callback for each GeoJSON feature
  const onEachFeature = (feature, layer) => {
    const { id, cases, deaths } = feature.properties; // Use `id` instead of `name`
    const regionName = regionMapping[id]; // Get the name from `regionMapping` using `id`

    if (cases !== undefined && deaths !== undefined) {
      layer.bindTooltip(
        `<strong>${regionName}</strong><br/>
        Cases: ${cases}<br/>
        Deaths: ${deaths}<br/>
        Avg Cases: ${meanCases.toFixed(2)}<br/>
        Avg Deaths: ${meanDeaths.toFixed(2)}`,
        { direction: "auto" }
      );
    } else {
      console.warn(`No data for region: ${regionName}`);
    }
  };

  // Show loading spinner if data is still being enriched
  if (loading || !geoData) {
    return (
      <div className="loading-spinner">
        <ProgressSpinner />
      </div>
    );
  }

  // Render map with GeoJSON layer
  return (
    <MapContainer
      center={[12.8797, 121.774]} // Centered on the Philippines
      zoom={6} // Zoom level for a country view
      style={{ height: "90vh", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <GeoJSON data={geoData} style={style} onEachFeature={onEachFeature} />
    </MapContainer>
  );
};

export default MapComponent;
