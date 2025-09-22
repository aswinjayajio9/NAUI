import React, { useState, useEffect } from 'react';
import { Modal, Button, Space, Input, Select } from 'antd';
import { fetchDimensionDropdowns } from './o9Interfacehelper'; // Import the helper
import {versionPayload } from './payloads'; // Import your dynamic payload.js

const AddRow = ({ visible, onCancel, onAdd, columns, newRowData, setNewRowData, onSuccess }) => {
  const [dimensionOptions, setDimensionOptions] = useState({});

  useEffect(() => {
    const fetchDimensions = async () => {
      try {
        const dropdowns = await fetchDimensionDropdowns(versionPayload); // Use dynamic payload
        setDimensionOptions(dropdowns); // dropdowns is an object: { DimensionName: [values] }
      } catch (error) {
        console.error('Error fetching dimensions:', error);
      }
    };

    if (visible) {
      fetchDimensions();
    }
  }, [visible]);

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/addRow', {  // Replace with your actual API endpoint
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRowData),
      });
      if (response.ok) {
        onAdd(newRowData);  // Optional: Keep for any local state updates if needed
        onSuccess();  // New: Call the success callback to trigger reload in SheetComponent
        onCancel();  // Close the modal on success
      } else {
        // Handle error, e.g., show a message
        console.error('Failed to add row');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const renderField = (col) => {
    if (dimensionOptions[col.dataIndex]) {
      // If dimension dropdown values exist for this column
      return (
        <Select
          value={newRowData[col.dataIndex] || ""}
          onChange={(value) => setNewRowData({ ...newRowData, [col.dataIndex]: value })}
          placeholder={`Select ${col.headerText || col.dataIndex}`}
          style={{ width: '100%' }}
        >
          {dimensionOptions[col.dataIndex].map(option => (
            <Select.Option key={option.Key || option.Name} value={option.Name}>
              {option.DisplayName || option.Name}
            </Select.Option>
          ))}
        </Select>
      );
    } else {
      // For measures or other fields, use Input
      return (
        <Input
          value={newRowData[col.dataIndex] || ""}
          onChange={(e) => setNewRowData({ ...newRowData, [col.dataIndex]: e.target.value })}
          placeholder={`Enter ${col.headerText || col.dataIndex}`}
        />
      );
    }
  };

  return (
    <Modal
      visible={visible}
      title="Add New Row"
      onCancel={onCancel}
      footer={
        <Space>
          <Button onClick={onCancel}>
            Cancel
          </Button>
          <Button type="primary" onClick={handleSubmit}>
            Submit
          </Button>
        </Space>
      }
      width={600}
    >
      {columns.map((col) => (
        <div key={col.dataIndex} style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: "bold", marginBottom: 8 }}>{col.headerText || col.dataIndex}</div>
          {renderField(col)}
        </div>
      ))}
    </Modal>
  );
};

export default AddRow;