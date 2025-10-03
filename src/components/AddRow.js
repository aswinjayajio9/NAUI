import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Space, Input, Select, Row, Col, message } from 'antd';
import Draggable from 'react-draggable'; // Import Draggable
import { cellEditSubmit, fetchDimensionDropdowns } from './o9Interfacehelper';
import { generateCellEditPayload } from './payloadGenerator';
import { aliasHeader, measure_dimensions_mapper, add_row_orders, HideDimensions, measure_picklist } from './payloads';
import { DMRule } from './payloads';
// Helper function to sort columns based on add_row_orders
const sortColumnsByOrder = (columns) =>
  [...columns].sort((a, b) => (add_row_orders[a.dataIndex] || Infinity) - (add_row_orders[b.dataIndex] || Infinity));

const AddRow = ({ visible, onCancel, src_tgt, meta, dimensions, columns, newRowData, setNewRowData, onSuccess, colsDisplayNameMapping }) => {
  const [dimensionOptions, setDimensionOptions] = useState({});
  const [newRule, setNewRule] = useState({}); // Corrected initialization format
  const dragRef = useRef(null); // Ref for draggable modal
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 }); // State to track modal position
  const [newMeta, setMeta] = useState(meta);
  useEffect(() => {
    const fetchDimensions = async () => {
      try {
        const updatedMapping = { ...colsDisplayNameMapping, ...measure_dimensions_mapper };
        let dropdowns = await fetchDimensionDropdowns(updatedMapping);
        dropdowns = { ...dropdowns, ...measure_picklist }; // Add fixed values
        setDimensionOptions(dropdowns);

        if (Object.keys(colsDisplayNameMapping).includes(DMRule)) {
          const res = findMissingOrNextRule(dimensions, dropdowns[DMRule], meta);
          const ruleObj = res?.rule ?? res; // unwrap if function returns { message, rule }
          if (ruleObj && ruleObj.Name) {
            setNewRule(ruleObj); // store only the rule object
            src_tgt[DMRule] = ruleObj.Name; // set selected member name
          }
        }
      } catch (error) {
        console.error('Error fetching dimensions:', error);
      }
    };

    if (visible) fetchDimensions();
  }, [visible, src_tgt, colsDisplayNameMapping]);

  const handleResetPosition = () => {
    setModalPosition({ x: 0, y: 0 }); // Reset modal position to default
  };

  const handleSubmit = async () => {
    try {
      // Ensure src_tgt and newRowData are defined
      const updatedNewRowData = Object.keys(colsDisplayNameMapping).reduce((acc, key) => {
        acc[key] = src_tgt && key in src_tgt ? src_tgt[key] : newRowData[key] || null; // Use src_tgt value if available, otherwise fallback to newRowData or null
        return acc;
      }, {});
      
      // Ensure CreatedMember uses only the unwrapped rule object
      const cmRule = newRule?.rule ?? newRule;
      const createdMember = (cmRule && cmRule.Name !== undefined) ? { [DMRule]: cmRule } : {};

      const payload = await generateCellEditPayload(meta, updatedNewRowData, [], { CreatedMember: createdMember });
      const responseData = await cellEditSubmit({ payload: payload });
      if (responseData && (responseData.Meta || responseData.Data)) {
        onSuccess();
        handleResetPosition(); // Reset modal position on submit
        onCancel();
      } else {
        throw new Error('API error: Invalid response from server.', responseData);
      }
    } catch (error) {
      console.error('Error submitting new row:', error);
      message.error('Error submitting new row. Please check the console for details.');
    }
  };

  const renderField = (col) => {
    const displayName = aliasHeader[col.dataIndex] || col.headerText || col.dataIndex;
    const isDimAttribute = dimAttributes.some((dimCol) => dimCol.dataIndex === col.dataIndex);

    if (displayName.toLowerCase().includes('dm rule')) return null;

    if (dimensionOptions[col.dataIndex]) {
      return (
        <Select
          mode={isDimAttribute ? undefined : 'tags'}
          value={
            isDimAttribute
              ? newRowData[col.dataIndex] || ''
              : newRowData[col.dataIndex]?.split(',').filter(Boolean) || []
          }
          onChange={(values) => {
            setNewRowData({
              ...newRowData,
              [col.dataIndex]: isDimAttribute ? values : values.join(','),
            });
          }}
          placeholder={`Select ${displayName}`}
          style={{ width: '100%' }}
        >
          {dimensionOptions[col.dataIndex].map((option) => (
            <Select.Option key={option} value={option}>
              {option}
            </Select.Option>
          ))}
        </Select>
      );
    }

    return (
      <Input
        value={newRowData[col.dataIndex] || ''}
        onChange={(e) => setNewRowData({ ...newRowData, [col.dataIndex]: e.target.value })}
        placeholder={`Enter ${displayName}`}
      />
    );
  };

  const sortedColumns = sortColumnsByOrder(columns);

  const dimAttributes = sortedColumns.filter((col) => {
    const realName = colsDisplayNameMapping[col.dataIndex];
    const displayName = aliasHeader[col.dataIndex] || col.headerText || col.dataIndex;
    return realName?.includes('.[') && !displayName.toLowerCase().includes('rule');
  });

  const itemAttributes = sortedColumns.filter((col) => {
    const displayName = aliasHeader[col.dataIndex] || col.headerText || col.dataIndex;
    return ['item', 'brand', 'criticality'].some((keyword) => displayName.toLowerCase().includes(keyword));
  });

  const resourceAttributes = sortedColumns.filter((col) =>
    (aliasHeader[col.dataIndex] || col.headerText || col.dataIndex).toLowerCase().includes('resource')
  );

  const locationAttributes = sortedColumns.filter((col) =>
    (aliasHeader[col.dataIndex] || col.headerText || col.dataIndex).toLowerCase().includes('location')
  );

  const otherAttributes = sortedColumns.filter((col) => {
    const displayName = aliasHeader[col.dataIndex] || col.headerText || col.dataIndex;
    return (
      !dimAttributes.includes(col) &&
      !itemAttributes.includes(col) &&
      !resourceAttributes.includes(col) &&
      !locationAttributes.includes(col) &&
      !displayName.toLowerCase().includes('rule')
    );
  });

  const renderSection = (title, attributes, isLastSection) => {
    if (!attributes.length) return null;

    return (
      <div style={{ marginBottom: 12 }}>
        <h3 style={{ marginBottom: 8 }}>{title}</h3>
        <Row gutter={[8, 8]}>
          {attributes.map((col) => (
            <Col key={col.dataIndex} span={12}>
              <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
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
      title={
        <div
          className="draggable-modal-title"
          style={{ cursor: 'move' }}
        >
          Add New Row
        </div>
      }
      onCancel={() => {
        handleResetPosition(); // Reset modal position on cancel
        onCancel();
      }}
      modalRender={(modal) => (
        <Draggable
          handle=".draggable-modal-title" // Use a custom class for the draggable handle
          nodeRef={dragRef}
          position={modalPosition} // Bind modal position to state
          onStop={(e, data) => setModalPosition({ x: data.x, y: data.y })} // Update position on drag stop
        >
          <div ref={dragRef}>{modal}</div>
        </Draggable>
      )}
      footer={
        <Space size="small">
          <Button
            onClick={() => {
              handleResetPosition(); // Reset modal position on cancel
              onCancel();
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              setNewRowData({}); // Reset newRowData to an empty object
              handleResetPosition(); // Reset modal position on reset
            }}
          >
            Reset
          </Button>
          <Button type="primary" onClick={handleSubmit}>
            Submit
          </Button>
        </Space>
      }
      width={700}
    >
      {renderSection('Dim Attributes', dimAttributes, false)}
      {renderSection('Item Attributes', itemAttributes, false)}
      {renderSection('Resource Attributes', resourceAttributes, false)}
      {renderSection('Location Attributes', locationAttributes, false)}
      {renderSection('Other Attributes', otherAttributes, true)}
    </Modal>
  );
};

// Helper function to find missing or next rule
const findMissingOrNextRule = (dimensions, memberValues) => {
  if (!dimensions || !Array.isArray(dimensions) || dimensions.length === 0) {
    console.error('Invalid dimensions input');
    return { message: 'Invalid dimensions input', rule: null };
  }

  const rule_dim = dimensions.find(
    (dim) =>
      dim?.header === DMRule || (typeof dim?.name === 'string' && dim.name.includes('Rule'))
  );

  const dimensionValues = rule_dim?.meta?.DimensionValues;
  if (!Array.isArray(dimensionValues) || dimensionValues.length === 0) {
    console.error('No rule dimension values found');
    return { message: 'No rule dimension values found', rule: null };
  }

  const ruleNumbers = dimensionValues
    .map((rule) => rule?.Name)
    .filter((name) => typeof name === 'string' && /^rule_\d+$/i.test(name))
    .map((name) => parseInt(name.split('_')[1], 10))
    .sort((a, b) => a - b);

  const dropdownList = Array.isArray(memberValues) ? memberValues : Object.values(memberValues || {});

  for (let i = 1; i <= (ruleNumbers.length || 0); i++) {
    const newRule = `Rule_${String(i).padStart(2, '0')}`;
    if (!ruleNumbers.includes(i) && dropdownList.includes(newRule)) {
      const next = ruleNumbers.length ? ruleNumbers[ruleNumbers.length - 1] + 1 : 1;
      return { message: 'Rule found', rule: { Name: newRule, MemberIndex: next - 1 } };
    }
  }

  const next = ruleNumbers.length ? ruleNumbers[ruleNumbers.length - 1] + 1 : 1;
  const newRule = `Rule_${String(next).padStart(2, '0')}`;
  if (dropdownList.includes(newRule)) {
    return { message: 'Rule found', rule: { Name: newRule, MemberIndex: next - 1 } };
  }

  console.error('Member not found in dropdown list', newRule, dropdownList);
  return { message: 'Rule member not found', rule: null };
};

export default AddRow;