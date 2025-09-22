export const networkSummaryPayload = {
    "Tenant": 6760,
    "Query": "Select ([Version].[Version Name].[Operational Plan] * [o9NetworkAggregation Network Plan Type].[o9NetworkAggregation Network Plan Type] ) on row, \n({Measure.[Network Aggregation BOM Count], Measure.[Network Aggregation Base Plan Type], Measure.[Network Aggregation Item Count], Measure.[Network Aggregation Resource Count], Measure.[Network Aggregation Routing Count], Measure.[Network Aggregation Target Version]}) on column;",
    "ExecutionContext": "Kibo Debugging Workspace",
    "EnableMultipleResults": true
}
export const networkMaterialRulesDataPayload = {
    "Tenant": 6760,
    "Query": "SELECT ([Version].[Version Name] * [Data Object].[Data Object].[Exclude Material Node]*[o9NetworkAggregation Network Plan Type].[o9NetworkAggregation Network Plan Type] * [DM Rule].[Rule]) ON ROW,({Measure.[Network Aggregation Item], Measure.[Network Aggregation Item Class], Measure.[Network Aggregation Item Stage], Measure.[Network Aggregation Item Type], Measure.[Network Aggregation Location], Measure.[Network Aggregation Location Region], Measure.[Network Aggregation Location Type], Measure.[Network Aggregation Include Material Node]}) ON COLUMN;",
    "ExecutionContext": "Kibo Debugging Workspace",
    "EnableMultipleResults": true
}

export const materialDetailsDataPayload = {
    "RegularMeasures": [
        {
            "Name": "Network Aggregation Item Included",
            "Id": "863be851-fca6-d847-60e5-e24e5ece46ca",
            "RelationshipTypeId": "c5474b3e-9920-db40-47de-43e069e9dad6",
            "RelationshipType": "001.001 Material Consumption Detail",
            "IsEdgeProperty": true,
            "IsVisible": true,
            "RenderType": "Value",
            "Alignment": "MiddleRight",
            "FormatString": "",
            "Sort": "",
            "UseExcelAggregation": false,
            "ShowInfo": {
                "ShowDetail": true,
                "ShowPulse": true,
                "ShowTask": true,
                "ShowMarketIntelligence": true
            },
            "ChildMeasureCollections": null,
            "Guid": "863be851-fca6-d847-60e5-e24e5ece46ca"
        }
    ],
    "LevelAttributes": [
        {
            "Id": "76b53acc-f155-c829-ff34-2f931a6ff3b4",
            "AttributeName": "o9NetworkAggregation Network Plan Type",
            "Dimension": "o9NetworkAggregation Network Plan Type",
            "Axis": "row",
            "ShowInfo": {
                "ShowDetail": true,
                "ShowPulse": true,
                "ShowTask": true,
                "ShowMarketIntelligence": true
            },
            "IsVisible": true,
            "DisplayName": "",
            "Name": "o9NetworkAggregation Network Plan Type",
            "DimensionName": "o9NetworkAggregation Network Plan Type",
            "Guid": "76b53acc-f155-c829-ff34-2f931a6ff3b4",
            "ShowSubtotal": true
        },
        {
            "Id": "e594aad2-d604-4a05-95b8-81a9047605b7",
            "AttributeName": "Item",
            "Dimension": "Item",
            "Axis": "row",
            "ShowInfo": {
                "ShowDetail": true,
                "ShowPulse": true,
                "ShowTask": true,
                "ShowMarketIntelligence": true
            },
            "IsVisible": true,
            "DisplayName": "",
            "Name": "Item",
            "DimensionName": "Item",
            "Guid": "e594aad2-d604-4a05-95b8-81a9047605b7",
            "ShowSubtotal": true
        },
        {
            "Id": "9c3b45ac-e578-4b7d-8bba-9b631bdb0b79",
            "AttributeName": "Location",
            "Dimension": "Location",
            "Axis": "row",
            "ShowInfo": {
                "ShowDetail": true,
                "ShowPulse": true,
                "ShowTask": true,
                "ShowMarketIntelligence": true
            },
            "IsVisible": true,
            "DisplayName": "",
            "Name": "Location",
            "DimensionName": "Location",
            "Guid": "9c3b45ac-e578-4b7d-8bba-9b631bdb0b79",
            "ShowSubtotal": true
        },
        {
            "Id": "76b53acc-f155-c829-ff34-2f931a6ff3b4",
            "AttributeName": "o9NetworkAggregation Network Plan Type",
            "Dimension": "o9NetworkAggregation Network Plan Type",
            "DimensionId": 5224809,
            "IsFilter": true,
            "Axis": "none",
            "IsDefault": true,
            "AllSelection": false,
            "SelectedMembers": [
                {
                    "Name": "OP"
                }
            ],
            "Name": "o9NetworkAggregation Network Plan Type",
            "DimensionName": "o9NetworkAggregation Network Plan Type",
            "OverrideFavSelection": false,
            "CurrencyFilter": false,
            "IsSingleSelect": true,
            "MemberFilterExpression": "",
            "DefaultValueExpression": "",
            "WorksheetLevelFilter": false,
            "HideDummyMembers": false,
            "SortBy": "",
            "SortOrder": "",
            "IsNarrowYourSelection": false,
            "Position": 0,
            "ShowFilterAs": "TileView",
            "FiltersMap": {
                "aba86a5703c23914facf21391c41ed4a": "aba86a5703c23914facf21391c41ed4a"
            },
            "UserBagSelection": [],
            "Guid": "76b53acc-f155-c829-ff34-2f931a6ff3b4",
            "SelectedMembersIbplExpression": ""
        },
        {
            "Id": "211b33d5-d91f-40ec-9668-20e0da2ae7b3",
            "AttributeName": "Version Name",
            "Dimension": "Version",
            "DimensionId": 5224789,
            "IsFilter": true,
            "Axis": "none",
            "IsDefault": true,
            "AllSelection": false,
            "SelectedMembers": [
                {
                    "Name": "Operational Plan"
                }
            ],
            "Name": "Version Name",
            "DimensionName": "Version",
            "OverrideFavSelection": false,
            "IsSingleSelect": true,
            "MemberFilterExpression": "",
            "DefaultValueExpression": "",
            "WorksheetLevelFilter": false,
            "HideDummyMembers": false,
            "SortBy": "",
            "SortOrder": "",
            "IsNarrowYourSelection": false,
            "Position": 3,
            "ShowFilterAs": "TileView",
            "CurrencyFilter": false,
            "FiltersMap": {
                "d68e103980ccd153fc7eaa3e2c2dee46": "d68e103980ccd153fc7eaa3e2c2dee46"
            },
            "UserBagSelection": [],
            "Guid": "211b33d5-d91f-40ec-9668-20e0da2ae7b3",
            "SelectedMembersIbplExpression": ""
        }
    ],
    "NamedSets": [],
    "DataProperties": {
        "IncludeInactiveMembers": false,
        "IncludeNullsForSeries": "",
        "ExcludeConditionalFormatting": true,
        "NodeTraversalSteps": "ALL",
        "TraversalDirection": "Top-Down",
        "IsBom": true
    },
    "AssociationMeasures": [
        {}
    ],
    "AssociationMeasureExpressions": [
        {}
    ],
    "TransientMeasures": [],
    "PeggingAttributes": [],
    "GraphRelations": [
        {
            "Name": "001.002 Material Production Detail",
            "RelationshipTypeId": "e3248549-cdee-21ad-6021-6aac921695f7",
            "EdgeProperties": []
        },
        {
            "Name": "001.001 Material Consumption Detail",
            "RelationshipTypeId": "c5474b3e-9920-db40-47de-43e069e9dad6",
            "EdgeProperties": []
        }
    ],
    "PeggingGraphs": [
        {
            "RelationshipType": "001.001 Material Consumption Detail",
            "RelationshipTypeId": "c5474b3e-9920-db40-47de-43e069e9dad6",
            "PeggingEdgeProperties": [
                {
                    "Id": "863be851-fca6-d847-60e5-e24e5ece46ca",
                    "Name": "Network Aggregation Item Included"
                }
            ]
        }
    ]
}

export const versionPayload = {
    "LevelAttributes": [
        {
            "Id": "211b33d5-d91f-40ec-9668-20e0da2ae7b3",
            "AttributeName": "Version Name",
            "Dimension": "Version",
            "DimensionId": 5224789,
            "IsFilter": false,
            "Axis": "row",
            "IsDefault": true,
            "AllSelection": true,
            "SelectedMembers": [],
            "Name": "Version Name",
            "DimensionName": "Version",
            "OverrideFavSelection": false,
            "IsSingleSelect": true,
            "MemberFilterExpression": "",
            "DefaultValueExpression": "",
            "WorksheetLevelFilter": false,
            "HideDummyMembers": false,
            "SortBy": "",
            "SortOrder": "",
            "IsNarrowYourSelection": false,
            "Position": 3,
            "ShowFilterAs": "TileView",
            "CurrencyFilter": false,
            "IncludeAllMemberProperties": false,
            "MemberProperties": [
                {
                    "Name": "DisplayName",
                    "Sort": "ascending",
                    "ExcludeFromSelect": true
                }
            ]
        }
    ],
    "DataProperties": {
        "IncludeNulls": false,
        "NullsForFinerGrainSelect": false,
        "NullsForUnrelatedAttrSelect": false,
        "SubTotalsType": "NoSubtotals",
        "MaxRecordLimit": 10000
    }
};
