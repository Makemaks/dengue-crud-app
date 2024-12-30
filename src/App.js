import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { DengueDataProvider } from "./context/DengueDataContext";
import AppSidebar from "./components/AppSidebar";
import DenguePage from "./pages/DenguePage";
import DashboardPage from "./pages/DashboardPage";
import Map from "./pages/Map";

const App = () => {
  return (
    <DengueDataProvider>
      <Router>
        <div className="app-container">
          <AppSidebar />
          <div className="content">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/dengue" element={<DenguePage />} />
              <Route path="/map" element={<Map />} />
            </Routes>
          </div>
        </div>
      </Router>
    </DengueDataProvider>
  );
};

export default App;
