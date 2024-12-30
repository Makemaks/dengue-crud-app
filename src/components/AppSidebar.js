import React from "react";
import { useDengueData } from "../context/DengueDataContext";

const AppSidebar = () => {
  const { fetchData } = useDengueData();

  const menuItems = [
    { label: "Dashboard", icon: "pi pi-home", path: "/" },
    { label: "Dengue Data", icon: "pi pi-database", path: "/dengue" },
    { label: "World Data", icon: "pi pi-globe", path: "/map" },
    // { label: "Fetch Data", icon: "pi pi-refresh", onClick: () => fetchData(true) },
  ];

  return (
    <div className="sidebar">
      <h2>Dengue Case Management</h2>
      <ul className="menu">
        {menuItems.map((item, index) => (
          <li key={index} onClick={item.onClick || (() => (window.location.href = item.path))}>
            <i className={item.icon}></i>
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AppSidebar;
