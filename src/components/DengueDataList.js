import React, { useEffect, useRef } from "react";
import { useDengueData } from "../context/DengueDataContext"; // Use context for dengue data
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { ProgressSpinner } from "primereact/progressspinner";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast"; // Import Toast component
import { doc, deleteDoc } from "firebase/firestore"; // Import Firestore delete functionality
import { db } from "../firebase"; // Firestore instance

const DengueDataList = () => {
  const { data: dengueData1, fetchData, loading } = useDengueData(); // Access data, fetch function, and loading state
  const [normalizedData, setNormalizedData] = React.useState([]);
  const [filters, setFilters] = React.useState({
    global: { value: null, matchMode: "contains" },
    location: { value: null, matchMode: "contains" },
    regions: { value: null, matchMode: "contains" },
    cases: { value: null, matchMode: "equals" },
    deaths: { value: null, matchMode: "equals" },
    date: { value: null, matchMode: "equals" },
  });

  const toast = useRef(null); // Reference for Toast component

  useEffect(() => {
    fetchData(false); // Fetch data only if not already cached
  }, [fetchData]);

  useEffect(() => {
    if (dengueData1) {
      // Normalize the date field to ensure consistency
      const normalized = dengueData1.map((item) => {
        let formattedDate = null;

        if (item.date) {
          const parsedDate = new Date(item.date);
          if (!isNaN(parsedDate)) {
            formattedDate = parsedDate.toISOString().split("T")[0]; // Format to 'YYYY-MM-DD'
          } else {
            formattedDate = "Invalid Date";
          }
        }

        return {
          ...item,
          date: formattedDate,
        };
      });

      setNormalizedData(normalized);
    }
  }, [dengueData1]);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      try {
        // Delete the document from Firestore
        await deleteDoc(doc(db, "dengueData1", id));
        // Fetch updated data after deletion
        fetchData(true); // Force refresh data after deletion
        // Show success message
        toast.current.show({
          severity: "success",
          summary: "Delete Successful",
          detail: "Record has been deleted successfully.",
          life: 3000,
        });
      } catch (error) {
        console.error("Error deleting record:", error);
        // Show error message
        toast.current.show({
          severity: "error",
          summary: "Delete Failed",
          detail: "An error occurred while deleting the record.",
          life: 3000,
        });
      }
    }
  };

  const renderActionButtons = (rowData) => (
    <div>
      <Button
        label="Delete"
        icon="pi pi-trash"
        className="p-button-text"
        onClick={() => handleDelete(rowData.id)} // Call delete function with record ID
      />
    </div>
  );

  const header = (
    <div className="table-header">
      <h2 style={{ margin: 0, fontSize: "1.25rem", color: "#007ad9" }}>Dengue Data List</h2>
      <span className="p-input-icon-left" style={{ marginTop: "0.5rem" }}>
        <i className="pi pi-search" />
        <InputText
          value={filters.global?.value || ""}
          onChange={(e) =>
            setFilters({ ...filters, global: { value: e.target.value, matchMode: "contains" } })
          }
          placeholder="Global Search"
          className="global-search-input"
        />
      </span>
    </div>
  );

  const dateFilterTemplate = (options) => (
    <Calendar
      value={options.value}
      onChange={(e) => options.filterCallback(e.value, options.index)}
      dateFormat="yy-mm-dd"
      placeholder="Filter by Date"
    />
  );

  const textFilterTemplate = (options) => (
    <InputText
      value={options.value || ""}
      onChange={(e) => options.filterCallback(e.target.value, options.index)}
      placeholder="Search"
    />
  );

  if (loading) {
    return (
      <div className="loading-spinner">
        <ProgressSpinner />
      </div>
    );
  }

  return (
    <div>
      {/* Toast Component */}
      <Toast ref={toast} />

      <DataTable
        value={normalizedData}
        paginator
        rows={8} // Reduced rows per page to make the table smaller
        header={header}
        filters={filters}
        onFilter={(e) => setFilters(e.filters)}
        globalFilterFields={["location", "regions", "cases", "deaths"]}
        emptyMessage="No dengue data found."
        removableSort
      >
        <Column
          field="location"
          header="Location"
          sortable
          filter
          filterPlaceholder="Search by Location"
          filterMatchMode="contains"
          filterElement={textFilterTemplate}
        />
        <Column
          field="cases"
          header="Cases"
          sortable
          filter
          filterPlaceholder="Filter by Cases"
          filterMatchMode="equals"
        />
        <Column
          field="deaths"
          header="Deaths"
          sortable
          filter
          filterPlaceholder="Filter by Deaths"
          filterMatchMode="equals"
        />
        <Column
          field="date"
          header="Date"
          dataType="date"
          sortable
          filter
          filterElement={dateFilterTemplate}
          body={(rowData) => rowData.date || "N/A"}
        />
        <Column
          field="region"
          header="Region"
          sortable
          filter
          filterPlaceholder="Search by Region"
          filterMatchMode="contains"
          filterElement={textFilterTemplate}
        />
        <Column body={renderActionButtons} header="Actions" />
      </DataTable>
    </div>
  );
};

export default DengueDataList;
