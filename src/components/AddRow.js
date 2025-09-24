import React, { useState, useEffect } from 'react';
import { Modal, Button, Space, Input, Select, Row, Col } from 'antd';
import { fetchDimensionDropdowns, getPayloadFromUrl } from './o9Interfacehelper'; // Import the helper
import { aliasHeader, measure_dimensions_mapper, add_row_orders, HideDimensions } from "./payloads"; // Import measure_dimensions_mapper and add_row_orders

// Helper function to sort columns based on add_row_orders
const sortColumnsByOrder = (columns) => {
  return [...columns].sort((a, b) => {
    const orderA = add_row_orders[a.dataIndex] || Infinity; // Default to Infinity if not in add_row_orders
    const orderB = add_row_orders[b.dataIndex] || Infinity;
    return orderA - orderB; // Ascending order: smallest values first
  });
};

const AddRow = ({ visible, onCancel, src_tgt, dimensions, columns, newRowData, setNewRowData, onSuccess, colsDisplayNameMapping }) => {
  const [dimensionOptions, setDimensionOptions] = useState({});
  const [newRule, setNewRule] = useState("Rule_01");

  // Create updatedMapping globally within the component
  const updatedMapping = Object.fromEntries(
    Object.entries({ ...colsDisplayNameMapping, ...measure_dimensions_mapper }).filter(
      ([key, value]) => !key.toLowerCase().includes("dm rule")
    )
  );

  useEffect(() => {
    const fetchDimensions = async () => {
      try {
        const dropdowns = await fetchDimensionDropdowns(updatedMapping); // Use updated mapping
        console.log("Dimensional Values:", dropdowns);
        setDimensionOptions(dropdowns); // Set filtered dropdowns
        setNewRule(findMissingOrNextRule(dimensions));
      } catch (error) {
        console.error('Error fetching dimensions:', error);
      }
    };

    if (visible) {
      fetchDimensions();
    }
  }, [visible, colsDisplayNameMapping]); // Add dimensions to dependencies

  const handleSubmit = async () => {
    try {
      // Build the query string
      const dimensions = [];
      const measures = [];
      const all_colsDisplayNameMapping = { 
        ...colsDisplayNameMapping,
        Version: HideDimensions['Version'],
        PlanType: HideDimensions['o9NetworkAggregation Network Plan Type'],
        DataObject: HideDimensions['Data Object'],
      };
      Object.entries(newRowData).forEach(([key, value]) => {
        const realName = all_colsDisplayNameMapping[key];
        if (realName && realName.includes('.[')) {
          // Dimension: parse to [Dim].[Attr].[Value]
          const parts = realName.split('.[');
          if (parts.length >= 2) {
            const dim = parts[0].replace(/\[|\]/g, '');
            const attr = parts[1].replace(/\[|\]/g, ''); // Remove brackets
            if (dim === 'Version') {
              value = src_tgt.src; // Use source version
            }
            if (dim === 'o9NetworkAggregation Network Plan Type') {
              value = src_tgt.tgt; // Use target plan type
            }
            if (dim === 'Data Object') {
              value = src_tgt.data_object; // Use data object from props
            }
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
      const response = await getPayloadFromUrl({ payload: new_payload });

      // Simplified and more robust response handling
      let responseData = response;
      if (typeof responseData === 'string') {
        try {
          responseData = JSON.parse(responseData);
        } catch (parseError) {
          throw new Error("Failed to parse API response as JSON: " + parseError.message);
        }
      }

      // Assuming a successful response contains a "Results" key. Adjust if needed.
      if (responseData && responseData.Results) {
        console.log("Row added successfully, reloading data...");
        onSuccess(); // Call the success callback to trigger reload
        onCancel();  // Close the modal
      } else {
        throw new Error("API error: Invalid response from server.");
      }
    } catch (error) {
      console.error('Error submitting new row:', error);
      // Optionally show an error message to the user
    }
  };

  const renderField = (col) => {
    const displayName = aliasHeader[col.dataIndex] || col.headerText || col.dataIndex; // Use aliasHeader for display name
    const isDimAttribute = dimAttributes.some((dimCol) => dimCol.dataIndex === col.dataIndex); // Check if the field is a Dim Attribute

    // Check if the dimension is "DM Rule" and skip rendering
    if (displayName.toLowerCase().includes("dm rule")) {
      return null; // Skip rendering this field
    }

    if (dimensionOptions[col.dataIndex]) {
      // If dimension dropdown values exist for this column
      return (
        <Select
          mode={isDimAttribute ? undefined : "tags"} // Disable multi-select for Dim Attributes
          value={
            isDimAttribute
              ? newRowData[col.dataIndex] || "" // Single value for Dim Attributes
              : newRowData[col.dataIndex]?.split(',').filter(Boolean) || [] // Multi-select for other attributes
          }
          onChange={(values) => {
            if (isDimAttribute) {
              setNewRowData({ ...newRowData, [col.dataIndex]: values }); // Single value for Dim Attributes
            } else {
              setNewRowData({ ...newRowData, [col.dataIndex]: values.join(',') }); // Convert array back to comma-separated string for multi-select
            }
          }}
          placeholder={`Select ${displayName}`}
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
          placeholder={`Enter ${displayName}`}
        />
      );
    }
  };

  // Sort columns based on add_row_orders
  const sortedColumns = sortColumnsByOrder(columns);

  // Sort each section individually
  const dimAttributes = sortedColumns.filter(col => {
    const realName = colsDisplayNameMapping[col.dataIndex];
    const displayName = aliasHeader[col.dataIndex] || col.headerText || col.dataIndex;

    // Exclude dimensions with "DM Rule"
    return realName && realName.includes('.[') && !displayName.toLowerCase().includes("rule");
  });

  const itemAttributes = sortedColumns.filter(col => {
    const displayName = aliasHeader[col.dataIndex] || col.headerText || col.dataIndex;
    return displayName.toLowerCase().includes('item') || displayName.toLowerCase().includes('brand') || displayName.toLowerCase().includes('criticality');
  });

  const resourceAttributes = sortedColumns.filter(col => {
    const displayName = aliasHeader[col.dataIndex] || col.headerText || col.dataIndex;
    return displayName.toLowerCase().includes('resource');
  });

  const locationAttributes = sortedColumns.filter(col => {
    const displayName = aliasHeader[col.dataIndex] || col.headerText || col.dataIndex;
    return displayName.toLowerCase().includes('location');
  });

  const otherAttributes = sortedColumns.filter(col => {
    const displayName = aliasHeader[col.dataIndex] || col.headerText || col.dataIndex;

    return (
      !dimAttributes.includes(col) &&
      !itemAttributes.includes(col) &&
      !resourceAttributes.includes(col) &&
      !locationAttributes.includes(col) &&
      !displayName.toLowerCase().includes("rule") // Exclude "DM Rule"
    );
  });

  const renderSection = (title, attributes, isLastSection) => {
    if (attributes.length === 0) return null;

    return (
      <div style={{ marginBottom: 12 }}>
        <h3 style={{ marginBottom: 8 }}>{title}</h3>
        <Row gutter={[8, 8]}>
          {attributes.map((col) => (
            <Col key={col.dataIndex} span={12}>
              <div style={{ fontWeight: "bold", marginBottom: 4 }}>
                {aliasHeader[col.dataIndex] || col.headerText || col.dataIndex}
              </div>
              {renderField(col)}
            </Col>
          ))}
        </Row>
        {!isLastSection && <hr style={{ marginTop: 8, marginBottom: 8 }} />}
      </div>
    );
  };

  return (
    <Modal
      visible={visible}
      title="Add New Row"
      onCancel={onCancel}
      footer={
        <Space size="small">
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="primary" onClick={handleSubmit}>Submit</Button>
        </Space>
      }
      width={700}
    >
      {renderSection("Dim Attributes", dimAttributes, false)}
      {renderSection("Item Attributes", itemAttributes, false)}
      {renderSection("Resource Attributes", resourceAttributes, false)}
      {renderSection("Location Attributes", locationAttributes, false)}
      {renderSection("Other Attributes", otherAttributes, true)} {/* Last section */}
    </Modal>
  );
};

const findMissingOrNextRule = (dimensions) => {
  if (!dimensions || !dimensions[0]?.meta?.DimensionValues) {
    console.error("Invalid dimensions input");
    return null;
  }

  const dimensionalValues = dimensions[0].meta.DimensionValues || [];
  console.log("Dimensional Values:", dimensionalValues);

  // Extract rule names in the format Rule_01, rule_02, etc.
  const ruleNumbers = dimensionalValues
    .map((rule) => rule?.Name) // Extract the Name property
    .filter((name) => /^rule_\d+$/i.test(name)) // Match "rule_xx" format (case-insensitive)
    .map((name) => parseInt(name.split('_')[1], 10)) // Extract the numeric part
    .sort((a, b) => a - b); // Sort in ascending order

  // Find the missing number or return the next highest + 1
  for (let i = 1; i <= ruleNumbers.length; i++) {
    if (!ruleNumbers.includes(i)) {
      return `Rule_${String(i).padStart(2, '0')}`; // Return missing rule in "Rule_XX" format
    }
  }

  // If no missing value, return the next highest + 1
  const nextRule = ruleNumbers.length > 0 ? ruleNumbers[ruleNumbers.length - 1] + 1 : 1;
  return `Rule_${String(nextRule).padStart(2, '0')}`;
};

export default AddRow;