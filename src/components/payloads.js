import { useEffect } from "react"

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

export const generatePayloadForDimensions = (colsDisplayNameMapping = {}) => {
  const payloads = {};
  Object.entries(colsDisplayNameMapping).forEach(([displayName, realName]) => {
    if (realName.includes('[') && realName.includes(']')) {
      // It's a dimension: extract DimensionName and Name
      const parts = realName.split('[');
      if (parts.length === 2) {
        const dimensionName = parts[0].slice(0, -1); // Remove the trailing .
        const name = parts[1].slice(0, -1); // Remove the trailing ]
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