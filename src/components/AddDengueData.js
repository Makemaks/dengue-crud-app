import React, { useState, useRef } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";

const AddDengueData = ({ visible, onHide }) => {
  const [location, setLocation] = useState("");
  const [cases, setCases] = useState(null);
  const [deaths, setDeaths] = useState(null);
  const [date, setDate] = useState(null);
  const [regions, setRegions] = useState("");
  const toast = useRef(null);

  const handleSubmit = async () => {
    try {
      await addDoc(collection(db, "dengueData1"), {
        location,
        cases: cases || 0,
        deaths: deaths || 0,
        date: date ? date.toISOString().split("T")[0] : "",
        regions,
      });
      setLocation("");
      setCases(null);
      setDeaths(null);
      setDate(null);
      setRegions("");
      toast.current.show({
        severity: "success",
        summary: "Success",
        detail: "Dengue data added successfully!",
      });
      onHide();
    } catch (error) {
      console.error("Error adding document: ", error);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to add dengue data.",
      });
    }
  };

  const footer = (
    <div className="dialog-footer">
      <Button
        label="Cancel"
        icon="pi pi-times"
        onClick={onHide}
        className="p-button-text"
      />
      <Button
        label="Save"
        icon="pi pi-check"
        onClick={handleSubmit}
        autoFocus
      />
    </div>
  );

  return (
    <>
      <Toast ref={toast} />
      <Dialog
        header="Add Dengue Data"
        visible={visible}
        onHide={onHide}
        style={{ width: "600px" }}
        className="add-dengue-data-dialog"
        footer={footer}
      >
        <div className="p-fluid">
          <div className="p-field">
            <label htmlFor="location">Location</label>
            <InputText
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter location"
              required
            />
          </div>

          <div className="p-field">
            <label htmlFor="cases">Cases</label>
            <InputNumber
              id="cases"
              value={cases}
              onChange={(e) => setCases(e.value)}
              placeholder="Enter number of cases"
              useGrouping={false}
              required
            />
          </div>

          <div className="p-field">
            <label htmlFor="deaths">Deaths</label>
            <InputNumber
              id="deaths"
              value={deaths}
              onChange={(e) => setDeaths(e.value)}
              placeholder="Enter number of deaths"
              useGrouping={false}
              required
            />
          </div>

          <div className="p-field">
            <label htmlFor="date">Date</label>
            <Calendar
              id="date"
              value={date}
              onChange={(e) => setDate(e.value)}
              placeholder="Select date"
              showIcon
              required
            />
          </div>

          <div className="p-field">
            <label htmlFor="regions">Region</label>
            <InputText
              id="regions"
              value={regions}
              onChange={(e) => setRegions(e.target.value)}
              placeholder="Enter region"
              required
            />
          </div>
        </div>
      </Dialog>
    </>
  );
};

export default AddDengueData;
