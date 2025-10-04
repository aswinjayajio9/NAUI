import { generateGetDataPayload } from "./payloadGenerator";
export const Version = '[Version].[Version Name]'
export const DataObject = '[Data Object].[Data Object]'
export const DMRule = '[DM Rule].[Rule]'
export const o9PCComponent = '[o9PC Component].[Component Instance]'
export const NetworkPlanType = '[o9NetworkAggregation Network Plan Type].[o9NetworkAggregation Network Plan Type]'
export const HideDimensions = {
  '[Version].[Version Name]': '[Version].[Version Name]',
  '[Data Object].[Data Object]': '[Data Object].[Data Object]',
  '[o9PC Component].[Component Instance]': '[o9PC Component].[Component Instance]',
  '[o9NetworkAggregation Network Plan Type].[o9NetworkAggregation Network Plan Type]': '[o9NetworkAggregation Network Plan Type].[o9NetworkAggregation Network Plan Type]'
};
export const getNetworkSummaryPayload = () => ({
    "Tenant": 6760,
    "Query": `Select ([Version].[Version Name] * [o9NetworkAggregation Network Plan Type].[o9NetworkAggregation Network Plan Type] ) on row, \n({Measure.[Network Aggregation BOM Count], Measure.[Network Aggregation Base Plan Type], Measure.[Network Aggregation Item Count], Measure.[Network Aggregation Resource Count], Measure.[Network Aggregation Routing Count], Measure.[Network Aggregation Target Version]}) on column;`,
    "ExecutionContext": "Kibo Debugging Workspace",
    "EnableMultipleResults": true
});

export const getNetworkMaterialRulesDataPayload = (tgtVersion, tgtPlan) => ({
    "Tenant": 6760,
    "Query": `SELECT ([Version].[Version Name].[${tgtVersion}] * [Data Object].[Data Object].[Exclude Material Node]*[o9NetworkAggregation Network Plan Type].[o9NetworkAggregation Network Plan Type].[${tgtPlan}] * [DM Rule].[Rule]) ON ROW,({Measure.[Network Aggregation Item], Measure.[Network Aggregation Item Type],Measure.[Network Aggregation Brand],Measure.[Network Aggregation Sub Brand], Measure.[Network Aggregation Location], Measure.[Network Aggregation Location Region], Measure.[Network Aggregation Location Type], Measure.[Network Aggregation Include Material Node] ,Measure.[Network Aggregation Criticality]}) ON COLUMN;`,
    "ExecutionContext": "Kibo Debugging Workspace",
    "EnableMultipleResults": true
});

export const getMaterialDetailsDataPayload = (tgtVersion, tgtPlan) => ({
    "Tenant": 6760,
    "Query": `SELECT ([Version].[Version Name].[${tgtVersion}] * [o9NetworkAggregation Network Plan Type].[o9NetworkAggregation Network Plan Type].[${tgtPlan}] * [Location].[Location] * [Item].[Item]) ON ROW, ({Measure.[Include Material Node], Measure.[Include Material Node Override], Measure.[Include Material Node Final], Measure.[Applied Material ABDM Rule]}) ON COLUMN;`,
    "ExecutionContext": "Kibo Debugging Workspace",
    "EnableMultipleResults": true
});

export const getResourceRulesPayload = (tgtVersion, tgtPlan) => ({
    "Tenant": 6760,
    "Query": `SELECT ([Version].[Version Name].[${tgtVersion}] * [Data Object].[Data Object].[Exclude Resource Node] * [DM Rule].[Rule] *[o9NetworkAggregation Network Plan Type].[o9NetworkAggregation Network Plan Type].[${tgtPlan}]) ON ROW, ({Measure.[Network Aggregation Resource], Measure.[Network Aggregation Resource Type], Measure.[Network Aggregation Location], Measure.[Network Aggregation Location Region], Measure.[Network Aggregation Location Type], Measure.[Network Aggregation Include Resource Node]}) ON COLUMN;`,
    "ExecutionContext": "Kibo Debugging Workspace",
    "EnableMultipleResults": true
});

export const getResourceDetailsPayload = (tgtVersion, tgtPlan) => ({
    "Tenant": 6760,
    "Query": `SELECT ([Version].[Version Name].[${tgtVersion}] * [o9NetworkAggregation Network Plan Type].[o9NetworkAggregation Network Plan Type].[${tgtPlan}] * [Location].[Location] * [Resource].[Resource]) ON ROW, ({Measure.[Include Resource Node], Measure.[Include Resource Node Override], Measure.[Include Resource Node Final], Measure.[Aggregation Simultaneous Resource], Measure.[Applied Resource ABDM Rule]}) ON COLUMN;`,
    "ExecutionContext": "Kibo Debugging Workspace",
    "EnableMultipleResults": true
});

export const generateMaterialExclusionPayload = (srcVersion, tgtPlan) => ({
    "Tenant": 6760,
    "Query": `exec procedure [GenerateMaterialExclusion] {"Version":"${srcVersion}","DataObject":"Exclude Material Node","PlanType":"${tgtPlan}"};`,
    "ExecutionContext": "Kibo Debugging Workspace",
    "EnableMultipleResults": true
});

export const generateResourceExclusionPayload = (srcVersion, tgtPlan) => ({
    "Tenant": 6760,
    "Query": `exec procedure [GenerateResourceExclusion] {"Version":"${srcVersion}","DataObject":"Exclude Resource Node","PlanType":"${tgtPlan}"};`,
    "ExecutionContext": "Kibo Debugging Workspace",
    "EnableMultipleResults": true
});

export const runExcludeMaterialNodeProcessPayload = (filters) => ({

    "Tenant": 6760,
    "Query": `exec plugin instance [ABDM_py_Exclude_Material_Node] for measures {[Network Aggregation Location]} using scope ([Version].[Version Name].filter(#.Name in ${filters[Version]})* [o9NetworkAggregation Network Plan Type].[o9NetworkAggregation Network Plan Type].filter(#.Name in ${filters[NetworkPlanType]})* [Data Object].[Data Object].filter(#.Name in ${filters[DataObject]}) * [DM Rule].[Rule].filter(#.Name in ${filters[DMRule]})* [Location].[Location] * [Resource].[Resource]) using arguments {("IncludeNullRows","False"),(ExecutionMode, “MediumWeight”),(DataTransferMode,"csv")};`,
    "ExecutionContext": "Kibo Debugging Workspace",
    "EnableMultipleResults": true
});
export const runExcludeResourceNodeProcessPayload = (filters) => ({
    "Tenant": 6760,
    "Query": `exec plugin instance [ABDM_py_Exclude_Resource_Node] for measures {[Network Aggregation Location]} using scope ([Version].[Version Name].filter(#.Name in ${filters[Version]})* [o9NetworkAggregation Network Plan Type].[o9NetworkAggregation Network Plan Type].filter(#.Name in ${filters[NetworkPlanType]})* [Data Object].[Data Object].filter(#.Name in ${filters[DataObject]}) * [DM Rule].[Rule].filter(#.Name in ${filters[DMRule]}) * [Location].[Location] * [Resource].[Resource]) using arguments {("IncludeNullRows","False"),(ExecutionMode, “MediumWeight”),(DataTransferMode,"csv")};`,
    "ExecutionContext": "Kibo Debugging Workspace",
    "EnableMultipleResults": true
});

export const getPayloadForParameters = (srcVersion, ComponentInstanceName) => ({
    "Tenant": 6760,
    "Query": `Select ([Version].[Version Name].[${srcVersion}] * [o9PC Component].[Component Instance].[${ComponentInstanceName}] * [o9PC Setting].[Setting] ) on row,({Measure.[PC Setting Is Enabled], Measure.[PC Setting Value - Aggregation Method],Measure.[PC Setting Value]}) on column;`,
    "ExecutionContext": "Kibo Debugging Workspace",
    "EnableMultipleResults": true
});

export const aliasHeader = {
    "[Version].[Version Name]": "Version",
    "[Data Object].[Data Object]": "Data Object",
    "[DM Rule].[Rule]": "Rules",
    "[o9PC Component].[Component]": "PC Component",
    "[o9PC Setting].[Setting]": "Parameters",
    "[o9NetworkAggregation Network Plan Type].[o9NetworkAggregation Network Plan Type]": "Network Process Type",
    "[Item].[Item]": "Item",
    "[Location].[Location]": "Location",
    "[Resource].[Resource]":"Resource",
    "Network Aggregation Resource": "Resource",
    "Network Aggregation Resource Type": "Resource Type",
    "Network Aggregation Location": "Location",
    "Network Aggregation Location Region": "Location Region",
    "Network Aggregation Location Type": "Location Type",
    "Network Aggregation Include Resource Node": "Include Resource Node",
    "Network Aggregation Item": "Item",
    "Network Aggregation Item Class": "Item Class",
    "Network Aggregation Criticality": "Criticality",
    "Network Aggregation Sub Brand": "Sub Brand",
    "Network Aggregation Brand": "Brand",
    "Network Aggregation Item Type": "Item Type",
    "Network Aggregation Routing": "Routing",
    "Network Aggregation BOM Count": "No. of BOMs",
    "Network Aggregation Base Plan Type": "Base Process Type",
    "Network Aggregation Item Count": "No. of Items",
    "Network Aggregation Resource Count": "No. of Resources",
    "Network Aggregation Target Version": "Target Version",
    "Network Aggregation Routing Count": "No. of Routings",
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
    "Item Type": "Item Type",
    "Location Region": "Location Region",
    "Location Type": "Location Type",
    "Resource": "Resource",
    "Resource Type": "Resource Type",
    "Location": "Location",
    "PC Setting Is Enabled": "Is Enabled",
    "PC Setting Value - Aggregation Method": "Aggregation Method",
    "PC Setting Value": "Calculation Details"
};

export const editableMeasureList = [
  "Network Aggregation Item",
  "Network Aggregation Item Type",
  "Network Aggregation Brand",
  "Network Aggregation Sub Brand",
  "Network Aggregation Resource",
  "Network Aggregation Resource Type",
  "Network Aggregation Location",
  "Network Aggregation Location Region",
  "Network Aggregation Location Type",
  "Network Aggregation Include Material Node",
  "Network Aggregation Criticality",
  "Network Aggregation Include Resource Node",
  "Include Material Node Override",
  "Include Resource Node Override",
  "Aggregation Simultaneous Resource",
  "Applied Resource ABDM Rule",
  "PC Setting Is Enabled",
  "PC Setting Value - Aggregation Method"
];
export const measure_dimensions_mapper = {
  "Network Aggregation Item": "[Item].[Item]",
  "Network Aggregation Item Type": "[Item].[Item Type]",
  "Network Aggregation Location": "[Location].[Location]",
  "Network Aggregation Location Region": "[Location].[Location Region]",
  "Network Aggregation Location Type": "[Location].[Location Type]",
  "Network Aggregation Sub Brand": "[Item].[L1]",
  "Network Aggregation Brand": "[Item].[L2]",
  "Network Aggregation Resource": "[Resource].[Resource]",
  "Network Aggregation Resource Type": "[Resource].[Resource Type]",
};

export const measure_picklist = {
  "Include Material Node": ["Yes", "No"],
  "Include Resource Node": ["Yes", "No"],
  "Include Material Node Override": ["Yes", "No"],
  "Include Resource Node Override": ["Yes", "No"],
  "PC Setting Value - Aggregation Method": ["Min", "Max", "Average", "Sum"]
}

export const add_row_orders = {
  "Network Aggregation Item": 4,
  "Network Aggregation Item Type": 3 ,
  "Network Aggregation Brand": 1,
  "Network Aggregation Sub Brand": 2,
  "Network Aggregation Location": 3,
  "Network Aggregation Location Region": 1,
  "Network Aggregation Location Type": 2,
  "Network Aggregation Resource": 2,
  "Network Aggregation Resource Type": 1,
}

export const generatePayloadForDimensions = (colsDisplayNameMapping = {}) => {
  const payloads = {};
  Object.entries(colsDisplayNameMapping).forEach(([displayName, realName]) => {
    if (realName.includes('.[') && realName.includes(']')) {
      // It's a dimension: extract DimensionName and Name
      const parts = realName.split('.[');
      if (parts.length === 2) {
        const dimensionName = parts[0].replace(/^\[|\]$/g, ""); // Remove beginning and trailing brackets
        const name = parts[1].replace(/^\[|\]$/g, ""); // Remove beginning and trailing brackets
        payloads[displayName] = generateGetDataPayload(`SELECT ([${dimensionName}].[${name}]);`)
      }
    }
  });
  return payloads;
};
