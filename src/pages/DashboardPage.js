import React, { useEffect, useState } from "react";
import { Dropdown } from "primereact/dropdown";
import { Card } from "primereact/card";
import { Divider } from "primereact/divider";
import { Bar, Scatter } from "react-chartjs-2";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, Tooltip, Legend);

const DashboardPage = () => {
  const [dengueData1, setDengueData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [groupBy, setGroupBy] = useState("City"); // Default grouping by City

  const fetchDengueData = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "dengueData1"));
      const data = querySnapshot.docs.map((doc) => doc.data());
      setDengueData(data);
      setFilteredData(data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchDengueData();
  }, []);

  const applyFilters = () => {
    let filtered = dengueData1;
    if (selectedYear) {
      filtered = filtered.filter((item) => item.date.startsWith(selectedYear));
    }
    if (selectedMonth) {
      filtered = filtered.filter((item) => item.date.includes(`-${selectedMonth}-`));
    }
    setFilteredData(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [selectedYear, selectedMonth]);

  // Determine labels based on grouping (City or Region)
  const labels = [...new Set(filteredData.map((item) => (groupBy === "City" ? item.location : item.region)))];

  // Aggregate data by selected grouping (City or Region)
  const aggregatedData = labels.map((label) => {
    const groupData = filteredData.filter((item) =>
      groupBy === "City" ? item.location === label : item.region === label
    );
    return {
      cases: groupData.reduce((sum, item) => sum + item.cases, 0),
      deaths: groupData.reduce((sum, item) => sum + item.deaths, 0),
    };
  });

  // Bar Chart Data
  const comparisonData = {
    labels: labels, // Dynamically set to either locations (City) or regions
    datasets: [
      {
        label: "Cases",
        data: aggregatedData.map((item) => item.cases),
        backgroundColor: "rgba(75, 192, 192, 0.6)",
      },
      {
        label: "Deaths",
        data: aggregatedData.map((item) => item.deaths),
        backgroundColor: "rgba(255, 99, 132, 0.6)",
      },
    ],
  };

  // Scatter Plot Data (Aggregate by Group)
  const relationshipData = {
    datasets: [
      {
        label: `Cases vs Deaths (By ${groupBy})`,
        data: labels.map((label, index) => ({
          x: aggregatedData[index].cases,
          y: aggregatedData[index].deaths,
        })),
        backgroundColor: "rgba(54, 162, 235, 0.6)",
      },
    ],
  };

  const months = [
    { label: "January", value: "01" },
    { label: "February", value: "02" },
    { label: "March", value: "03" },
    { label: "April", value: "04" },
    { label: "May", value: "05" },
    { label: "June", value: "06" },
    { label: "July", value: "07" },
    { label: "August", value: "08" },
    { label: "September", value: "09" },
    { label: "October", value: "10" },
    { label: "November", value: "11" },
    { label: "December", value: "12" },
  ];

  const groupOptions = [
    { label: "City", value: "City" },
    { label: "Region", value: "Region" },
  ];

  return (
    <div className="p-grid p-align-start p-justify-center dashboard-page">
      {/* Header Section */}
      <div className="p-col-12 p-md-10 p-lg-8">
        <Card
          title="Dengue Dashboard"
          subTitle="Visualize dengue case data and trends with interactive graphs and filters."
          className="p-mb-4"
        >
          <p>
            Use the filters below to view data for specific months, years, or regions. The graphs
            provide insights into dengue cases and their relationships.
          </p>
          <div className="filter-group">
            <Dropdown
              value={selectedYear}
              options={[...new Set(dengueData1.map((item) => item.date.split("-")[0]))].map((year) => ({
                label: year,
                value: year,
              }))}
              onChange={(e) => setSelectedYear(e.value)}
              placeholder="Select Year"
              className="p-mb-3 p-mr-2"
            />
            <Dropdown
              value={selectedMonth}
              options={months}
              onChange={(e) => setSelectedMonth(e.value)}
              placeholder="Select Month"
              className="p-mb-3 p-mr-2"
            />
            <Dropdown
              value={groupBy}
              options={groupOptions}
              onChange={(e) => setGroupBy(e.value)}
              placeholder="Group by"
              className="p-mb-3"
            />
          </div>
        </Card>
      </div>

      {/* Comparison Chart */}
      <div className="p-col-12 p-md-10 p-lg-8">
        <Card>
          <h3>Cases vs Deaths (Comparison by {groupBy})</h3>
          <Bar data={comparisonData} options={{ responsive: true, plugins: { legend: { position: "top" } } }} />
        </Card>
      </div>

      {/* Relationship Chart */}
      <div className="p-col-12 p-md-10 p-lg-8">
        <Card>
          <h3>Cases vs Deaths (Relationship by {groupBy})</h3>
          <Scatter
            data={relationshipData}
            options={{
              responsive: true,
              plugins: { legend: { position: "top" } },
              scales: {
                x: { title: { display: true, text: "Cases" } },
                y: { title: { display: true, text: "Deaths" } },
              },
            }}
          />
        </Card>
      </div>

      <Divider />
    </div>
  );
};

export default DashboardPage;
