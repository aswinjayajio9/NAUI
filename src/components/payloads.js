export const HideDimensions = {
  'Version': 'Version.[Version Name]',
  'Data Object': 'Data Object.[Data Object]',
  'o9NetworkAggregation Network Plan Type': 'o9NetworkAggregation Network Plan Type.[o9NetworkAggregation Network Plan Type]'
};
export const getNetworkSummaryPayload = (srcVersion, srcPlan) => ({
    "Tenant": 6760,
    "Query": `Select ([Version].[Version Name].[${srcVersion}] * [o9NetworkAggregation Network Plan Type].[o9NetworkAggregation Network Plan Type] ) on row, \n({Measure.[Network Aggregation BOM Count], Measure.[Network Aggregation Base Plan Type], Measure.[Network Aggregation Item Count], Measure.[Network Aggregation Resource Count], Measure.[Network Aggregation Routing Count], Measure.[Network Aggregation Target Version]}) on column;`,
    "ExecutionContext": "Kibo Debugging Workspace",
    "EnableMultipleResults": true
});

export const getNetworkMaterialRulesDataPayload = (tgtVersion, tgtPlan) => ({
    "Tenant": 6760,
    "Query": `SELECT ([Version].[Version Name].[${tgtVersion}] * [Data Object].[Data Object].[Exclude Material Node]*[o9NetworkAggregation Network Plan Type].[o9NetworkAggregation Network Plan Type].[${tgtPlan}] * [DM Rule].[Rule]) ON ROW,({Measure.[Network Aggregation Item], Measure.[Network Aggregation Item Class], Measure.[Network Aggregation Item Stage], Measure.[Network Aggregation Item Type], Measure.[Network Aggregation Location], Measure.[Network Aggregation Location Region], Measure.[Network Aggregation Location Type], Measure.[Network Aggregation Include Material Node]}) ON COLUMN;`,
    "ExecutionContext": "Kibo Debugging Workspace",
    "EnableMultipleResults": true
});

export const getMaterialDetailsDataPayload = (tgtVersion, tgtPlan) => ({
    "Tenant": 6760,
    "Query": `SELECT ([Version].[Version Name].[${tgtVersion}] * [o9NetworkAggregation Network Plan Type].[o9NetworkAggregation Network Plan Type].[${tgtPlan}] * [Location].[Location] * [Item].[Item]) ON ROW, ({Measure.[Include Material Node], Measure.[Include Material Node Override], Measure.[Include Material Node Final], Measure.[Applied Material ABDM Rule]}) ON COLUMN;`,
    "ExecutionContext": "Kibo Debugging Workspace",
    "EnableMultipleResults": true
});

export const getResourceRulesPayload = (tgtVersion) => ({
    "Tenant": 6760,
    "Query": `SELECT ([Version].[Version Name].[${tgtVersion}] * [Data Object].[Data Object].[Exclude Resource Node] * [DM Rule].[Rule]) ON ROW, ({Measure.[Network Aggregation Resource], Measure.[Network Aggregation Resource Type], Measure.[Network Aggregation Location], Measure.[Network Aggregation Location Region], Measure.[Network Aggregation Location Type], Measure.[Network Aggregation Include Resource Node]}) ON COLUMN;`,
    "ExecutionContext": "Kibo Debugging Workspace",
    "EnableMultipleResults": true
});

export const getResourceDetailsPayload = (tgtVersion, tgtPlan) => ({
    "Tenant": 6760,
    "Query": `SELECT ([Version].[Version Name].[${tgtVersion}] * [o9NetworkAggregation Network Plan Type].[o9NetworkAggregation Network Plan Type].[${tgtPlan}] * [Location].[Location] * [Resource].[Resource]) ON ROW, ({Measure.[Include Resource Node], Measure.[Include Resource Node Override], Measure.[Include Resource Node Final], Measure.[Aggregation Simultaneous Resource], Measure.[Applied Resource ABDM Rule]}) ON COLUMN;`,
    "ExecutionContext": "Kibo Debugging Workspace",
    "EnableMultipleResults": true
});

export const versionPayload = {
    "Tenant": 6760,
    "Query": "SELECT ([Version].[Version Name]);",
    "ExecutionContext": "Kibo Debugging Workspace",
    "EnableMultipleResults": true
};


export const aliasHeader = {
    "Version": "Version",
    "Data Object": "Data Object",
    "DM Rule": "Rule",
    "o9NetworkAggregation Network Plan Type": "Network Plan Type",
    "Network Aggregation Resource": "Resource",
    "Network Aggregation Resource Type": "Resource Type",
    "Network Aggregation Location": "Location",
    "Network Aggregation Location Region": "Location Region",
    "Network Aggregation Location Type": "Location Type",
    "Network Aggregation Include Resource Node": "Include Resource Node",
    "Network Aggregation Item": "Item",
    "Network Aggregation Item Class": "Item Class",
    "Network Aggregation Item Stage": "Item Stage",
    "Network Aggregation Item Type": "Item Type",
    "Network Aggregation Routing": "Routing",
    "Network Aggregation BOM Count": "BOM Count",
    "Network Aggregation Base Plan Type": "Base Plan Type",
    "Network Aggregation Item Count": "Item Count",
    "Network Aggregation Resource Count": "Resource Count",
    "Network Aggregation Target Version": "Target Version",
    "Network Aggregation Routing Count": "Routing Count",
    "Network Aggregation Include Material Node": "Include Material Node",
    "Include Material Node": "Include Material Node",
    "Include Material Node Override": "Include Material Node Override",
    "Include Material Node Final": "Include Material Node Final",
    "Applied Material ABDM Rule": "Applied Material ABDM Rule",
    "Include Resource Node": "Include Resource Node",
    "Include Resource Node Override": "Include Resource Node Override",
    "Include Resource Node Final": "Include Resource Node Final",
    "Aggregation Simultaneous Resource": "Aggregation Simultaneous Resource",
    "Applied Resource ABDM Rule": "Applied Resource ABDM Rule",
    "Item": "Item",
    "Location": "Location"
};

export const generatePayloadForDimensions = (colsDisplayNameMapping = {}) => {
  const payloads = {};
  Object.entries(colsDisplayNameMapping).forEach(([displayName, realName]) => {
    if (realName.includes('.[') && realName.includes(']')) {
      // It's a dimension: extract DimensionName and Name
      const parts = realName.split('.[');
      if (parts.length === 2) {
        const dimensionName = parts[0].replace(/^\[|\]$/g, ""); // Remove beginning and trailing brackets
        const name = parts[1].replace(/^\[|\]$/g, ""); // Remove beginning and trailing brackets
        payloads[displayName] = {
          "Tenant": 6760,
          "Query": `SELECT ([${dimensionName}].[${name}]);`,
          "ExecutionContext": "Kibo Debugging Workspace",
          "EnableMultipleResults": true
        };
      }
    }
  });
  return payloads;
};