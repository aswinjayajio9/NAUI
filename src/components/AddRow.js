import React, { useState, useEffect } from 'react';
import { Modal, Button, Space, Input, Select, Row, Col } from 'antd';
import { fetchDimensionDropdowns, getPayloadFromUrl } from './o9Interfacehelper';
import { aliasHeader, measure_dimensions_mapper, add_row_orders, HideDimensions, measure_picklist } from './payloads';

// Helper function to sort columns based on add_row_orders
const sortColumnsByOrder = (columns) =>
  [...columns].sort((a, b) => (add_row_orders[a.dataIndex] || Infinity) - (add_row_orders[b.dataIndex] || Infinity));

const AddRow = ({ visible, onCancel, src_tgt, dimensions, columns, newRowData, setNewRowData, onSuccess, colsDisplayNameMapping }) => {
  const [dimensionOptions, setDimensionOptions] = useState({});
  const [newRule, setNewRule] = useState('Rule_01');

  // Create updatedMapping globally within the component
  const updatedMapping = { ...colsDisplayNameMapping, ...measure_dimensions_mapper };

  useEffect(() => {
    const fetchDimensions = async () => {
      try {
        const updatedMapping = { ...colsDisplayNameMapping, ...measure_dimensions_mapper };
        let dropdowns = await fetchDimensionDropdowns(updatedMapping);
        dropdowns = { ...dropdowns, ...measure_picklist }; // Add fixed values
        setDimensionOptions(dropdowns);
        setNewRule(findMissingOrNextRule(dimensions));
      } catch (error) {
        console.error('Error fetching dimensions:', error);
      }
    };

    if (visible) fetchDimensions();
  }, [visible, src_tgt, colsDisplayNameMapping]);

  const handleSubmit = async () => {
    try {
      const dimensions = [];
      const measures = [];
      const all_colsDisplayNameMapping = {
        ...colsDisplayNameMapping,
        Version: HideDimensions['Version'],
        PlanType: HideDimensions['o9NetworkAggregation Network Plan Type'],
        DataObject: HideDimensions['Data Object'],
        DMRule: '[DM Rule].[Rule]',
      };

      const updatedNewRowData = {
        ...newRowData,
        Version: src_tgt?.src || '',
        PlanType: src_tgt?.tgt || '',
        DataObject: src_tgt?.data_object || '',
        DMRule: newRule || 'Rule_01',
      };

      Object.entries(updatedNewRowData).forEach(([key, value]) => {
        const realName = all_colsDisplayNameMapping[key];
        if (realName?.includes('.[')) {
          const [dim, attr] = realName.split('.[').map((part) => part.replace(/\[|\]/g, ''));
          dimensions.push(`[${dim}].[${attr}].[${value}]`);
        } else {
          const formattedValue =
            value === null || value === undefined || value === ''
              ? 'null'
              : !isNaN(Number(value)) && value.trim() !== ''
              ? Number(value)
              : `"${value}"`;
          measures.push(`Measure.[${key}] = ${formattedValue}`);
        }
      });

      const query = `scope: (${dimensions.join(' * ')}); ${measures.join('; ')}; end scope;`;
      const new_payload = { query, Tenant: 6760, ExecutionContext: 'Kibo Debugging Workspace', EnableMultipleResults: true };
      console.log('Submitting new payload:', new_payload);

      const response = await getPayloadFromUrl({ payload: new_payload });
      const responseData = typeof response === 'string' ? JSON.parse(response) : response;

      if (responseData?.Results) {
        console.log('Row added successfully, reloading data...');
        onSuccess();
        onCancel();
      } else {
        throw new Error('API error: Invalid response from server.');
      }
    } catch (error) {
      console.error('Error submitting new row:', error);
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
      title="Add New Row"
      onCancel={onCancel}
      footer={
        <Space size="small">
          <Button onClick={onCancel}>Cancel</Button>
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
const findMissingOrNextRule = (dimensions) => {
  if (!dimensions?.[0]?.meta?.DimensionValues) {
    console.error('Invalid dimensions input');
    return null;
  }

  const ruleNumbers = dimensions[0].meta.DimensionValues
    .map((rule) => rule?.Name)
    .filter((name) => /^rule_\d+$/i.test(name))
    .map((name) => parseInt(name.split('_')[1], 10))
    .sort((a, b) => a - b);

  for (let i = 1; i <= ruleNumbers.length; i++) {
    if (!ruleNumbers.includes(i)) return `Rule_${String(i).padStart(2, '0')}`;
  }

  return `Rule_${String(ruleNumbers.length ? ruleNumbers[ruleNumbers.length - 1] + 1 : 1).padStart(2, '0')}`;
};

export default AddRow;