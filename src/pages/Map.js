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
  PH07: "REGION VII-CENTRAL VISAYAS",
  PH08: "REGION VIII-EASTERN VISAYAS",
  PH09: "REGION IX-ZAMBOANGA PENINSULA",
  PH10: "REGION X-NORTHERN MINDANAO",
  PH11: "REGION XI-DAVAO REGION",
  PH12: "REGION XII-SOCCSKSARGEN",
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

  useEffect(() => {
    const fetchAndProcessData = async () => {
      setLoading(true);

      try {
        // Fetch dengue data from Firebase
        const dengueCollection = collection(db, "dengueData1");
        const dengueSnapshot = await getDocs(dengueCollection);
        const dengueData1 = dengueSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          date: new Date(doc.data().date),
        }));

        console.log("Fetched Dengue Data:", dengueData1);

        // Aggregate dengue cases and deaths by GeoJSON region codes
        const regionCases = dengueData1.reduce((acc, entry) => {
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

  // Function to determine fill color based on case count
  const getColor = (cases) => {
    return cases > 1000
      ? "#800026"
      : cases > 500
      ? "#BD0026"
      : cases > 200
      ? "#E31A1C"
      : cases > 100
      ? "#FC4E2A"
      : cases > 50
      ? "#FD8D3C"
      : cases > 20
      ? "#FEB24C"
      : cases > 10
      ? "#FED976"
      : "#FFEDA0";
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
        Deaths: ${deaths}`,
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
