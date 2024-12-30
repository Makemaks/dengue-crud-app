import React, { useRef, useState } from "react";
import AddDengueData from "../components/AddDengueData";
import DengueDataList from "../components/DengueDataList";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Divider } from "primereact/divider";
import { Toast } from "primereact/toast";
import { FileUpload } from "primereact/fileupload";
import Papa from "papaparse"; // For parsing CSV
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";
import { ProgressSpinner } from "primereact/progressspinner";

const DenguePage = () => {
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const toast = useRef(null);
  const [loading, setLoading] = useState(false);
  const [savedCount, setSavedCount] = useState(0); // Track the number of saved records

  const uploadHandler = async ({ files }) => {
    const file = files[0];
    console.log("File selected:", file);

    if (!file) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No file selected",
        life: 3000,
      });
      return;
    }

    setLoading(true); // Start loading spinner
    setSavedCount(0); // Reset the saved count

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        console.log("Parsing complete:", results);

        const { data } = results;
        try {
          for (const [index, row] of data.entries()) {
            console.log(`Processing row ${index}:`, row);

            // Skip the second row (metadata)
            if (index === 0 || index === 1) {
              console.log(`Skipping row ${index}`);
              continue;
            }

            await addDoc(collection(db, "dengueData1"), {
              location: row.loc || "",
              cases: parseInt(row.cases) || 0,
              deaths: parseInt(row.deaths) || 0,
              date: parseDate(row.date), // Format date using the parseDate function
              region: row.Region || "",
              year: parseInt(row.year) || null,
            });

            setSavedCount((prevCount) => prevCount + 1); // Increment the saved count
            console.log(`Row ${index} saved successfully`);
          }

          if (toast.current) {
            toast.current.show({
              severity: "success",
              summary: "File Uploaded",
              detail: "All data has been saved successfully.",
              life: 3000,
            });
          }
          console.log("All rows saved successfully");
        } catch (error) {
          console.error("Error saving data:", error);
          toast.current.show({
            severity: "error",
            summary: "Upload Failed",
            detail: "Error saving data to database.",
            life: 3000,
          });
        } finally {
          setLoading(false); // Stop loading spinner
        }
      },
      error: (error) => {
        console.error("Error parsing CSV:", error);
        toast.current.show({
          severity: "error",
          summary: "Parsing Error",
          detail: "There was an issue parsing the file.",
          life: 3000,
        });
        setLoading(false); // Stop loading spinner
      },
    });
  };

  function parseDate(inputDate) {
    const [day, month, year] = inputDate.split("/"); // Split the date string by "/"
    if (!day || !month || !year) {
      return ""; // Return an empty string for invalid dates
    }
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`; // Format as YYYY-MM-DD
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <ProgressSpinner />
        <p style={{ marginTop: "1rem", fontSize: "1.25rem" }}>
          Saving records... {savedCount} records saved so far.
        </p>
      </div>
    );
  }

  return (
    <div className="p-grid p-align-start p-justify-center dengue-page">
      {/* Header Section */}
      <div className="p-col-12 p-md-10 p-lg-8">
        <Card
          title="Dengue Cases Management"
          subTitle="Manage dengue data records, add new data, or edit existing records."
          className="p-mb-4"
        >
          <p>
            Use this page to track and manage dengue cases. You can add new cases, view the
            list of existing cases, and filter or sort the data for better insights.
          </p>
          <div className="button-group">
            <Button
              className="bg-green-500 hover:bg-green-600"
              onClick={() => setIsAddModalVisible(true)}
            >
              <img
                alt="mosquito icon"
                src="https://media.istockphoto.com/id/823840278/vector/mosquito-icon-on-white-background-vector.jpg?s=612x612&w=0&k=20&c=JmMyegstwz2XduMK1miBsNJdCCx23uKtAynrNs36UIE="
              />
              Add Dengue Data
            </Button>
            <FileUpload
              mode="basic"
              name="demo[]"
              accept=".csv"
              maxFileSize={3000000}
              customUpload
              uploadHandler={uploadHandler}
              chooseLabel="Upload File"
              className="bg-blue-500 hover:bg-blue-600"
            />
          </div>
        </Card>
      </div>

      {/* Data Table Section */}
      <div className="p-col-12 p-md-10 p-lg-8">
        <Card>
          <Divider />
          <DengueDataList />
        </Card>
      </div>

      {/* Add Data Modal */}
      <AddDengueData
        visible={isAddModalVisible}
        onHide={() => setIsAddModalVisible(false)}
      />

      {/* Toast for Notifications */}
      <Toast ref={toast} />
    </div>
  );
};

export default DenguePage;
