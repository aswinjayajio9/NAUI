import React, { useState, useEffect } from 'react';
import { Modal, Button, Space, Input, Select } from 'antd';
import { fetchDimensionDropdowns, getPayloadFromUrl } from './o9Interfacehelper'; // Import the helper
import {versionPayload } from './payloads'; // Import your dynamic payload.js

const AddRow = ({ visible, onCancel, onAdd, columns, newRowData, setNewRowData, onSuccess ,colsDisplayNameMapping }) => {
  const [dimensionOptions, setDimensionOptions] = useState({});

  useEffect(() => {
    const fetchDimensions = async () => {
      try {
        const dropdowns = await fetchDimensionDropdowns(colsDisplayNameMapping); // Use dynamic payload
        console.log("Fetched dimension dropdowns:", dropdowns);
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
      // Build the query string
      const dimensions = [];
      const measures = [];
      Object.entries(newRowData).forEach(([key, value]) => {
        const realName = colsDisplayNameMapping[key];
        if (realName && realName.includes('.')) {
          // Dimension: parse to [Dim].[Attr].[Value]
          const parts = realName.split('.');
          if (parts.length >= 2) {
            const dim = parts[0];
            const attr = parts[1].replace(/\[|\]/g, ''); // Remove brackets
            dimensions.push(`[${dim}].[${attr}].[${value}]`);
          }
        } else {
          // Measure: Measure.[Name] = value; auto-detect string/number
          let formattedValue;
          if (value === null || value === undefined || value === '') {
            formattedValue = 'null';
          } else {
            const numValue = Number(value);
            if (!isNaN(numValue) && value.trim() !== '') {
              formattedValue = numValue;
            } else {
              formattedValue = `"${value}"`;
            }
          }
          measures.push(`Measure.[${key}] = ${formattedValue}`);
        }
      });
      const query = `scope: (${dimensions.join(' * ')}); ${measures.join('; ')}; end scope;`;
      const new_payload = { "query": query, "Tenant": 6760, "ExecutionContext": "Kibo Debugging Workspace", "EnableMultipleResults": true };
      console.log("Submitting new payload:", new_payload);
      // Call your API to add the new row
      var response = await getPayloadFromUrl({payload: new_payload});
      if (typeof response === 'string') {
        try {
          response = JSON.parse(response);
          response = response["Results"]["0"];
        } catch (parseError) {
          throw new Error("Failed to parse API response as JSON: " + parseError.message);
        }
      }
      onAdd(newRowData);  // Optional: Keep for any local state updates if needed
      onSuccess();  // New: Call the success callback to trigger reload in SheetComponent
      onCancel();  // Close the modal on success
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
            <Select.Option key={option} value={option}>
              {option}
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