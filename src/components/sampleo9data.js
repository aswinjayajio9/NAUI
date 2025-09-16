export const data = {
"Meta": [
{
"DimensionName": "SCSItem",
"DimensionId": "ec227160-8545-422f-b5bc-7d2e4b8ac6c9",
"DimensionType": "Regular",
"Alias": "0",
"AttributeId": "0f050408-33cb-495d-9492-439f85f1df5a",
"AttributeName": "ProductLine",
"ApiName": null,
"AttributeKey": "ProductLineKey",
"KeyDataType": "integer",
"Name": "ProductLine",
"EdgeDirection": null,
"RelationshipType": null,
"DimensionValues": [
{
"Key": "7",
"Name": "PG_1000",
"DisplayName": "PG_1000",
"Image": "",
"IsEditable": true,
"MemberProperties": [ ]
}
],
"TopologicalSortOrder": 10,
"AncestorAttributeNames": [
"Brand",
"ProductGroup4",
"ProductGroup5",
"ProductGroup6"
],
"OrderBy": "Name",
"DimensionTranslation": "SCSItem",
"Translation": "ProductLine",
"AttributeMemberProperties": [ ]
},
{
"DimensionName": "SCSItem",
"DimensionId": "ec227160-8545-422f-b5bc-7d2e4b8ac6c9",
"DimensionType": "Regular",
"Alias": "1",
"AttributeId": "d3755bd7-d4e8-4d54-9944-3b8f01fd6551",
"AttributeName": "Item",
"ApiName": null,
"AttributeKey": "ItemKey",
"KeyDataType": "integer",
"Name": "Item",
"EdgeDirection": null,
"RelationshipType": null,
"DimensionValues": [
{
"Key": "51",
"Name": "P_1000_1",
"DisplayName": "P_1000_1",
"Image": "",
"IsEditable": true,
"MemberProperties": [ ]
},
{
"Key": "52",
"Name": "P_1000_2",
"DisplayName": "P_1000_2",
"Image": "",
"IsEditable": true,
"MemberProperties": [ ]
},
{
"Key": "53",
"Name": "P_1000_3",
"DisplayName": "P_1000_3",
"Image": "",
"IsEditable": true,
"MemberProperties": [ ]
}
],
"TopologicalSortOrder": 0,
"AncestorAttributeNames": [
"AltGroup4",
"ProductGroup6",
"ItemSubGroup",
"ProductGroup5",
"Packaging",
"ProductLine",
"AltGroup3",
"ItemAll",
"Stage",
"AltGroup2",
"ItemGroup",
"Brand",
"Quality",
"ProductClass",
"ProductType",
"ProductGroup4",
"AltGroup1",
"Thickness"
],
"OrderBy": "Name",
"DimensionTranslation": "SCSItem",
"Translation": "Item",
"AttributeMemberProperties": [ ]
},
{
"DimensionName": "SCSLocation",
"DimensionId": "9de808f8-bed0-494c-94a7-399c075e4093",
"DimensionType": "Regular",
"Alias": "2",
"AttributeId": "14cd8915-e970-43c6-a245-66a8dd0e5d0c",
"AttributeName": "Location",
"ApiName": null,
"AttributeKey": "LocationKey",
"KeyDataType": "integer",
"Name": "Location",
"EdgeDirection": null,
"RelationshipType": null,
"DimensionValues": [
{
"Key": "19",
"Name": "ShipTo_1",
"DisplayName": "ShipTo_1",
"Image": "",
"IsEditable": true,
"MemberProperties": [ ]
},
{
"Key": "20",
"Name": "ShipTo_2",
"DisplayName": "ShipTo_2",
"Image": "",
"IsEditable": true,
"MemberProperties": [ ]
}
],
"TopologicalSortOrder": 0,
"AncestorAttributeNames": [
"All",
"Territory",
"Country",
"Region",
"Global",
"Zip",
"LocationGroup",
"State"
],
"OrderBy": "Name",
"DimensionTranslation": "SCSLocation",
"Translation": "Location",
"AttributeMemberProperties": [ ]
},
{
"DimensionName": "Time",
"DimensionId": "3001c9cd-ee95-4b47-9fc9-66ce4c9f6db0",
"DimensionType": "Time",
"Alias": "3",
"AttributeId": "6afd40f8-cd60-4ebd-aef8-0446dae9588e",
"AttributeName": "FiscalQuarter",
"ApiName": null,
"AttributeKey": "FiscalQuarterKey",
"KeyDataType": "datetime",
"Name": "FiscalQuarter",
"EdgeDirection": null,
"RelationshipType": null,
"DimensionValues": [
{
"Key": "2019/04/07 00:00:00",
"Name": "Q2-2019",
"DisplayName": "Q2-2019",
"Image": null,
"IsEditable": true,
"MemberProperties": [
{
"ValueDataType": "boolean",
"PropertyValue": false,
"TranslationName": "FiscalQuarter$InPast",
"PropertyName": "FiscalQuarter$InPast",
"KeyColumnDataType": null,
"Id": "00000000-0000-0000-0000-000000000000",
"FormatString": null,
"ConversionFormatString": null
},
{
"ValueDataType": "boolean",
"PropertyValue": true,
"TranslationName": "FiscalQuarter$IsCurrent",
"PropertyName": "FiscalQuarter$IsCurrent",
"KeyColumnDataType": null,
"Id": "00000000-0000-0000-0000-000000000000",
"FormatString": null,
"ConversionFormatString": null
}
]
},
{
"Key": "2019/07/07 00:00:00",
"Name": "Q3-2019",
"DisplayName": "Q3-2019",
"Image": null,
"IsEditable": true,
"MemberProperties": [
{
"ValueDataType": "boolean",
"PropertyValue": false,
"TranslationName": "FiscalQuarter$InPast",
"PropertyName": "FiscalQuarter$InPast",
"KeyColumnDataType": null,
"Id": "00000000-0000-0000-0000-000000000000",
"FormatString": null,
"ConversionFormatString": null
},
{
"ValueDataType": "boolean",
"PropertyValue": false,
"TranslationName": "FiscalQuarter$IsCurrent",
"PropertyName": "FiscalQuarter$IsCurrent",
"KeyColumnDataType": null,
"Id": "00000000-0000-0000-0000-000000000000",
"FormatString": null,
"ConversionFormatString": null
}
]
},
{
"Key": "2019/10/06 00:00:00",
"Name": "Q4-2019",
"DisplayName": "Q4-2019",
"Image": null,
"IsEditable": true,
"MemberProperties": [
{
"ValueDataType": "boolean",
"PropertyValue": false,
"TranslationName": "FiscalQuarter$InPast",
"PropertyName": "FiscalQuarter$InPast",
"KeyColumnDataType": null,
"Id": "00000000-0000-0000-0000-000000000000",
"FormatString": null,
"ConversionFormatString": null
},
{
"ValueDataType": "boolean",
"PropertyValue": false,
"TranslationName": "FiscalQuarter$IsCurrent",
"PropertyName": "FiscalQuarter$IsCurrent",
"KeyColumnDataType": null,
"Id": "00000000-0000-0000-0000-000000000000",
"FormatString": null,
"ConversionFormatString": null
}
]
},
{
"Key": "2020/01/05 00:00:00",
"Name": "Q1-2020",
"DisplayName": "Q1-2020",
"Image": null,
"IsEditable": true,
"MemberProperties": [
{
"ValueDataType": "boolean",
"PropertyValue": false,
"TranslationName": "FiscalQuarter$InPast",
"PropertyName": "FiscalQuarter$InPast",
"KeyColumnDataType": null,
"Id": "00000000-0000-0000-0000-000000000000",
"FormatString": null,
"ConversionFormatString": null
},
{
"ValueDataType": "boolean",
"PropertyValue": false,
"TranslationName": "FiscalQuarter$IsCurrent",
"PropertyName": "FiscalQuarter$IsCurrent",
"KeyColumnDataType": null,
"Id": "00000000-0000-0000-0000-000000000000",
"FormatString": null,
"ConversionFormatString": null
}
]
},
{
"Key": "2020/04/05 00:00:00",
"Name": "Q2-2020",
"DisplayName": "Q2-2020",
"Image": null,
"IsEditable": true,
"MemberProperties": [
{
"ValueDataType": "boolean",
"PropertyValue": false,
"TranslationName": "FiscalQuarter$InPast",
"PropertyName": "FiscalQuarter$InPast",
"KeyColumnDataType": null,
"Id": "00000000-0000-0000-0000-000000000000",
"FormatString": null,
"ConversionFormatString": null
},
{
"ValueDataType": "boolean",
"PropertyValue": false,
"TranslationName": "FiscalQuarter$IsCurrent",
"PropertyName": "FiscalQuarter$IsCurrent",
"KeyColumnDataType": null,
"Id": "00000000-0000-0000-0000-000000000000",
"FormatString": null,
"ConversionFormatString": null
}
]
},
{
"Key": "2020/07/05 00:00:00",
"Name": "Q3-2020",
"DisplayName": "Q3-2020",
"Image": null,
"IsEditable": true,
"MemberProperties": [
{
"ValueDataType": "boolean",
"PropertyValue": false,
"TranslationName": "FiscalQuarter$InPast",
"PropertyName": "FiscalQuarter$InPast",
"KeyColumnDataType": null,
"Id": "00000000-0000-0000-0000-000000000000",
"FormatString": null,
"ConversionFormatString": null
},
{
"ValueDataType": "boolean",
"PropertyValue": false,
"TranslationName": "FiscalQuarter$IsCurrent",
"PropertyName": "FiscalQuarter$IsCurrent",
"KeyColumnDataType": null,
"Id": "00000000-0000-0000-0000-000000000000",
"FormatString": null,
"ConversionFormatString": null
}
]
},
{
"Key": "2020/10/04 00:00:00",
"Name": "Q4-2020",
"DisplayName": "Q4-2020",
"Image": null,
"IsEditable": true,
"MemberProperties": [
{
"ValueDataType": "boolean",
"PropertyValue": false,
"TranslationName": "FiscalQuarter$InPast",
"PropertyName": "FiscalQuarter$InPast",
"KeyColumnDataType": null,
"Id": "00000000-0000-0000-0000-000000000000",
"FormatString": null,
"ConversionFormatString": null
},
{
"ValueDataType": "boolean",
"PropertyValue": false,
"TranslationName": "FiscalQuarter$IsCurrent",
"PropertyName": "FiscalQuarter$IsCurrent",
"KeyColumnDataType": null,
"Id": "00000000-0000-0000-0000-000000000000",
"FormatString": null,
"ConversionFormatString": null
}
]
}
],
"TopologicalSortOrder": 3,
"AncestorAttributeNames": [
"FiscalYear",
"All"
],
"OrderBy": "Key",
"DimensionTranslation": "Time",
"Translation": "Quarter",
"AttributeMemberProperties": [
{
"ValueDataType": "boolean",
"PropertyValue": null,
"TranslationName": "FiscalQuarter$InPast",
"PropertyName": "FiscalQuarter$InPast",
"KeyColumnDataType": "boolean",
"Id": "f57b10b3-f9d2-4673-b846-b8393869766f",
"FormatString": null,
"ConversionFormatString": null
},
{
"ValueDataType": "boolean",
"PropertyValue": null,
"TranslationName": "FiscalQuarter$IsCurrent",
"PropertyName": "FiscalQuarter$IsCurrent",
"KeyColumnDataType": "boolean",
"Id": "c78a8917-1dac-494c-bc01-3164f42cddce",
"FormatString": null,
"ConversionFormatString": null
}
]
},
{
"DimensionName": "Time",
"DimensionId": "3001c9cd-ee95-4b47-9fc9-66ce4c9f6db0",
"DimensionType": "Time",
"Alias": "4",
"AttributeId": "28de70af-21cf-4bc9-a406-ee04d12d7b17",
"AttributeName": "FiscalMonth",
"ApiName": null,
"AttributeKey": "FiscalMonthKey",
"KeyDataType": "datetime",
"Name": "FiscalMonth",
"EdgeDirection": null,
"RelationshipType": null,
"DimensionValues": [
{
"Key": "2019/05/05 00:00:00",
"Name": "M05-2019",
"DisplayName": "M05-2019",
"Image": null,
"IsEditable": true,
"MemberProperties": [
{
"ValueDataType": "boolean",
"PropertyValue": false,
"TranslationName": "FiscalMonth$InPast",
"PropertyName": "FiscalMonth$InPast",
"KeyColumnDataType": null,
"Id": "00000000-0000-0000-0000-000000000000",
"FormatString": null,
"ConversionFormatString": null
},
{
"ValueDataType": "boolean",
"PropertyValue": true,
"TranslationName": "FiscalMonth$IsCurrent",
"PropertyName": "FiscalMonth$IsCurrent",
"KeyColumnDataType": null,
"Id": "00000000-0000-0000-0000-000000000000",
"FormatString": null,
"ConversionFormatString": null
}
]
},
{
"Key": "2019/06/02 00:00:00",
"Name": "M06-2019",
"DisplayName": "M06-2019",
"Image": null,
"IsEditable": true,
"MemberProperties": [
{
"ValueDataType": "boolean",
"PropertyValue": false,
"TranslationName": "FiscalMonth$InPast",
"PropertyName": "FiscalMonth$InPast",
"KeyColumnDataType": null,
"Id": "00000000-0000-0000-0000-000000000000",
"FormatString": null,
"ConversionFormatString": null
},
{
"ValueDataType": "boolean",
"PropertyValue": false,
"TranslationName": "FiscalMonth$IsCurrent",
"PropertyName": "FiscalMonth$IsCurrent",
"KeyColumnDataType": null,
"Id": "00000000-0000-0000-0000-000000000000",
"FormatString": null,
"ConversionFormatString": null
}
]
},
{
"Key": "2019/07/07 00:00:00",
"Name": "M07-2019",
"DisplayName": "M07-2019",
"Image": null,
"IsEditable": true,
"MemberProperties": [
{
"ValueDataType": "boolean",
"PropertyValue": false,
"TranslationName": "FiscalMonth$InPast",
"PropertyName": "FiscalMonth$InPast",
"KeyColumnDataType": null,
"Id": "00000000-0000-0000-0000-000000000000",
"FormatString": null,
"ConversionFormatString": null
},
{
"ValueDataType": "boolean",
"PropertyValue": false,
"TranslationName": "FiscalMonth$IsCurrent",
"PropertyName": "FiscalMonth$IsCurrent",
"KeyColumnDataType": null,
"Id": "00000000-0000-0000-0000-000000000000",
"FormatString": null,
"ConversionFormatString": null
}
]
},
{
"Key": "2019/08/04 00:00:00",
"Name": "M08-2019",
"DisplayName": "M08-2019",
"Image": null,
"IsEditable": true,
"MemberProperties": [
{
"ValueDataType": "boolean",
"PropertyValue": false,
"TranslationName": "FiscalMonth$InPast",
"PropertyName": "FiscalMonth$InPast",
"KeyColumnDataType": null,
"Id": "00000000-0000-0000-0000-000000000000",
"FormatString": null,
"ConversionFormatString": null
},
{
"ValueDataType": "boolean",
"PropertyValue": false,
"TranslationName": "FiscalMonth$IsCurrent",
"PropertyName": "FiscalMonth$IsCurrent",
"KeyColumnDataType": null,
"Id": "00000000-0000-0000-0000-000000000000",
"FormatString": null,
"ConversionFormatString": null
}
]
},
{
"Key": "2019/09/01 00:00:00",
"Name": "M09-2019",
"DisplayName": "M09-2019",
"Image": null,
"IsEditable": true,
"MemberProperties": [
{
"ValueDataType": "boolean",
"PropertyValue": false,
"TranslationName": "FiscalMonth$InPast",
"PropertyName": "FiscalMonth$InPast",
"KeyColumnDataType": null,
"Id": "00000000-0000-0000-0000-000000000000",
"FormatString": null,
"ConversionFormatString": null
},
{
"ValueDataType": "boolean",
"PropertyValue": false,
"TranslationName": "FiscalMonth$IsCurrent",
"PropertyName": "FiscalMonth$IsCurrent",
"KeyColumnDataType": null,
"Id": "00000000-0000-0000-0000-000000000000",
"FormatString": null,
"ConversionFormatString": null
}
]
},
{
"Key": "2019/10/06 00:00:00",
"Name": "M10-2019",
"DisplayName": "M10-2019",
"Image": null,
"IsEditable": true,
"MemberProperties": [
{
"ValueDataType": "boolean",
"PropertyValue": false,
"TranslationName": "FiscalMonth$InPast",
"PropertyName": "FiscalMonth$InPast",
"KeyColumnDataType": null,
"Id": "00000000-0000-0000-0000-000000000000",
"FormatString": null,
"ConversionFormatString": null
},
{
"ValueDataType": "boolean",
"PropertyValue": false,
"TranslationName": "FiscalMonth$IsCurrent",
"PropertyName": "FiscalMonth$IsCurrent",
"KeyColumnDataType": null,
"Id": "00000000-0000-0000-0000-000000000000",
"FormatString": null,
"ConversionFormatString": null
}
]
},
{
"Key": "2019/11/03 00:00:00",
"Name": "M11-2019",
"DisplayName": "M11-2019",
"Image": null,
"IsEditable": true,
"MemberProperties": [
{
"ValueDataType": "boolean",
"PropertyValue": false,
"TranslationName": "FiscalMonth$InPast",
"PropertyName": "FiscalMonth$InPast",
"KeyColumnDataType": null,
"Id": "00000000-0000-0000-0000-000000000000",
"FormatString": null,
"ConversionFormatString": null
},
{
"ValueDataType": "boolean",
"PropertyValue": false,
"TranslationName": "FiscalMonth$IsCurrent",
"PropertyName": "FiscalMonth$IsCurrent",
"KeyColumnDataType": null,
"Id": "00000000-0000-0000-0000-000000000000",
"FormatString": null,
"ConversionFormatString": null
}
]
},
{
"Key": "2019/12/01 00:00:00",
"Name": "M12-2019",
"DisplayName": "M12-2019",
"Image": null,
"IsEditable": true,
"MemberProperties": [
{
"ValueDataType": "boolean",
"PropertyValue": false,
"TranslationName": "FiscalMonth$InPast",
"PropertyName": "FiscalMonth$InPast",
"KeyColumnDataType": null,
"Id": "00000000-0000-0000-0000-000000000000",
"FormatString": null,
"ConversionFormatString": null
},
{
"ValueDataType": "boolean",
"PropertyValue": false,
"TranslationName": "FiscalMonth$IsCurrent",
"PropertyName": "FiscalMonth$IsCurrent",
"KeyColumnDataType": null,
"Id": "00000000-0000-0000-0000-000000000000",
"FormatString": null,
"ConversionFormatString": null
}
]
},
{
"Key": "2020/01/05 00:00:00",
"Name": "M01-2020",
"DisplayName": "M01-2020",
"Image": null,
"IsEditable": true,
"MemberProperties": [
{
"ValueDataType": "boolean",
"PropertyValue": false,
"TranslationName": "FiscalMonth$InPast",
"PropertyName": "FiscalMonth$InPast",
"KeyColumnDataType": null,
"Id": "00000000-0000-0000-0000-000000000000",
"FormatString": null,
"ConversionFormatString": null
},
{
"ValueDataType": "boolean",
"PropertyValue": false,
"TranslationName": "FiscalMonth$IsCurrent",
"PropertyName": "FiscalMonth$IsCurrent",
"KeyColumnDataType": null,
"Id": "00000000-0000-0000-0000-000000000000",
"FormatString": null,
"ConversionFormatString": null
}
]
},
{
"Key": "2020/02/02 00:00:00",
"Name": "M02-2020",
"DisplayName": "M02-2020",
"Image": null,
"IsEditable": true,
"MemberProperties": [
{
"ValueDataType": "boolean",
"PropertyValue": false,
"TranslationName": "FiscalMonth$InPast",
"PropertyName": "FiscalMonth$InPast",
"KeyColumnDataType": null,
"Id": "00000000-0000-0000-0000-000000000000",
"FormatString": null,
"ConversionFormatString": null
},
{
"ValueDataType": "boolean",
"PropertyValue": false,
"TranslationName": "FiscalMonth$IsCurrent",
"PropertyName": "FiscalMonth$IsCurrent",
"KeyColumnDataType": null,
"Id": "00000000-0000-0000-0000-000000000000",
"FormatString": null,
"ConversionFormatString": null
}
]
},
{
"Key": "2020/03/01 00:00:00",
"Name": "M03-2020",
"DisplayName": "M03-2020",
"Image": null,
"IsEditable": true,
"MemberProperties": [
{
"ValueDataType": "boolean",
"PropertyValue": false,
"TranslationName": "FiscalMonth$InPast",
"PropertyName": "FiscalMonth$InPast",
"KeyColumnDataType": null,
"Id": "00000000-0000-0000-0000-000000000000",
"FormatString": null,
"ConversionFormatString": null
},
{
"ValueDataType": "boolean",
"PropertyValue": false,
"TranslationName": "FiscalMonth$IsCurrent",
"PropertyName": "FiscalMonth$IsCurrent",
"KeyColumnDataType": null,
"Id": "00000000-0000-0000-0000-000000000000",
"FormatString": null,
"ConversionFormatString": null
}
]
},
{
"Key": "2020/04/05 00:00:00",
"Name": "M04-2020",
"DisplayName": "M04-2020",
"Image": null,
"IsEditable": true,
"MemberProperties": [
{
"ValueDataType": "boolean",
"PropertyValue": false,
"TranslationName": "FiscalMonth$InPast",
"PropertyName": "FiscalMonth$InPast",
"KeyColumnDataType": null,
"Id": "00000000-0000-0000-0000-000000000000",
"FormatString": null,
"ConversionFormatString": null
},
{
"ValueDataType": "boolean",
"PropertyValue": false,
"TranslationName": "FiscalMonth$IsCurrent",
"PropertyName": "FiscalMonth$IsCurrent",
"KeyColumnDataType": null,
"Id": "00000000-0000-0000-0000-000000000000",
"FormatString": null,
"ConversionFormatString": null
}
]
},
{
"Key": "2020/05/03 00:00:00",
"Name": "M05-2020",
"DisplayName": "M05-2020",
"Image": null,
"IsEditable": true,
"MemberProperties": [
{
"ValueDataType": "boolean",
"PropertyValue": false,
"TranslationName": "FiscalMonth$InPast",
"PropertyName": "FiscalMonth$InPast",
"KeyColumnDataType": null,
"Id": "00000000-0000-0000-0000-000000000000",
"FormatString": null,
"ConversionFormatString": null
},
{
"ValueDataType": "boolean",
"PropertyValue": false,
"TranslationName": "FiscalMonth$IsCurrent",
"PropertyName": "FiscalMonth$IsCurrent",
"KeyColumnDataType": null,
"Id": "00000000-0000-0000-0000-000000000000",
"FormatString": null,
"ConversionFormatString": null
}
]
},
{
"Key": "2020/06/07 00:00:00",
"Name": "M06-2020",
"DisplayName": "M06-2020",
"Image": null,
"IsEditable": true,
"MemberProperties": [
{
"ValueDataType": "boolean",
"PropertyValue": false,
"TranslationName": "FiscalMonth$InPast",
"PropertyName": "FiscalMonth$InPast",
"KeyColumnDataType": null,
"Id": "00000000-0000-0000-0000-000000000000",
"FormatString": null,
"ConversionFormatString": null
},
{
"ValueDataType": "boolean",
"PropertyValue": false,
"TranslationName": "FiscalMonth$IsCurrent",
"PropertyName": "FiscalMonth$IsCurrent",
"KeyColumnDataType": null,
"Id": "00000000-0000-0000-0000-000000000000",
"FormatString": null,
"ConversionFormatString": null
}
]
},
{
"Key": "2020/07/05 00:00:00",
"Name": "M07-2020",
"DisplayName": "M07-2020",
"Image": null,
"IsEditable": true,
"MemberProperties": [
{
"ValueDataType": "boolean",
"PropertyValue": false,
"TranslationName": "FiscalMonth$InPast",
"PropertyName": "FiscalMonth$InPast",
"KeyColumnDataType": null,
"Id": "00000000-0000-0000-0000-000000000000",
"FormatString": null,
"ConversionFormatString": null
},
{
"ValueDataType": "boolean",
"PropertyValue": false,
"TranslationName": "FiscalMonth$IsCurrent",
"PropertyName": "FiscalMonth$IsCurrent",
"KeyColumnDataType": null,
"Id": "00000000-0000-0000-0000-000000000000",
"FormatString": null,
"ConversionFormatString": null
}
]
},
{
"Key": "2020/08/02 00:00:00",
"Name": "M08-2020",
"DisplayName": "M08-2020",
"Image": null,
"IsEditable": true,
"MemberProperties": [
{
"ValueDataType": "boolean",
"PropertyValue": false,
"TranslationName": "FiscalMonth$InPast",
"PropertyName": "FiscalMonth$InPast",
"KeyColumnDataType": null,
"Id": "00000000-0000-0000-0000-000000000000",
"FormatString": null,
"ConversionFormatString": null
},
{
"ValueDataType": "boolean",
"PropertyValue": false,
"TranslationName": "FiscalMonth$IsCurrent",
"PropertyName": "FiscalMonth$IsCurrent",
"KeyColumnDataType": null,
"Id": "00000000-0000-0000-0000-000000000000",
"FormatString": null,
"ConversionFormatString": null
}
]
},
{
"Key": "2020/09/06 00:00:00",
"Name": "M09-2020",
"DisplayName": "M09-2020",
"Image": null,
"IsEditable": true,
"MemberProperties": [
{
"ValueDataType": "boolean",
"PropertyValue": false,
"TranslationName": "FiscalMonth$InPast",
"PropertyName": "FiscalMonth$InPast",
"KeyColumnDataType": null,
"Id": "00000000-0000-0000-0000-000000000000",
"FormatString": null,
"ConversionFormatString": null
},
{
"ValueDataType": "boolean",
"PropertyValue": false,
"TranslationName": "FiscalMonth$IsCurrent",
"PropertyName": "FiscalMonth$IsCurrent",
"KeyColumnDataType": null,
"Id": "00000000-0000-0000-0000-000000000000",
"FormatString": null,
"ConversionFormatString": null
}
]
},
{
"Key": "2020/10/04 00:00:00",
"Name": "M10-2020",
"DisplayName": "M10-2020",
"Image": null,
"IsEditable": true,
"MemberProperties": [
{
"ValueDataType": "boolean",
"PropertyValue": false,
"TranslationName": "FiscalMonth$InPast",
"PropertyName": "FiscalMonth$InPast",
"KeyColumnDataType": null,
"Id": "00000000-0000-0000-0000-000000000000",
"FormatString": null,
"ConversionFormatString": null
},
{
"ValueDataType": "boolean",
"PropertyValue": false,
"TranslationName": "FiscalMonth$IsCurrent",
"PropertyName": "FiscalMonth$IsCurrent",
"KeyColumnDataType": null,
"Id": "00000000-0000-0000-0000-000000000000",
"FormatString": null,
"ConversionFormatString": null
}
]
},
{
"Key": "2020/11/01 00:00:00",
"Name": "M11-2020",
"DisplayName": "M11-2020",
"Image": null,
"IsEditable": true,
"MemberProperties": [
{
"ValueDataType": "boolean",
"PropertyValue": false,
"TranslationName": "FiscalMonth$InPast",
"PropertyName": "FiscalMonth$InPast",
"KeyColumnDataType": null,
"Id": "00000000-0000-0000-0000-000000000000",
"FormatString": null,
"ConversionFormatString": null
},
{
"ValueDataType": "boolean",
"PropertyValue": false,
"TranslationName": "FiscalMonth$IsCurrent",
"PropertyName": "FiscalMonth$IsCurrent",
"KeyColumnDataType": null,
"Id": "00000000-0000-0000-0000-000000000000",
"FormatString": null,
"ConversionFormatString": null
}
]
},
{
"Key": "2020/12/06 00:00:00",
"Name": "M12-2020",
"DisplayName": "M12-2020",
"Image": null,
"IsEditable": true,
"MemberProperties": [
{
"ValueDataType": "boolean",
"PropertyValue": false,
"TranslationName": "FiscalMonth$InPast",
"PropertyName": "FiscalMonth$InPast",
"KeyColumnDataType": null,
"Id": "00000000-0000-0000-0000-000000000000",
"FormatString": null,
"ConversionFormatString": null
},
{
"ValueDataType": "boolean",
"PropertyValue": false,
"TranslationName": "FiscalMonth$IsCurrent",
"PropertyName": "FiscalMonth$IsCurrent",
"KeyColumnDataType": null,
"Id": "00000000-0000-0000-0000-000000000000",
"FormatString": null,
"ConversionFormatString": null
}
]
}
],
"TopologicalSortOrder": 2,
"AncestorAttributeNames": [
"FiscalQuarter",
"FiscalYear",
"All"
],
"OrderBy": "Key",
"DimensionTranslation": "Time",
"Translation": "Month",
"AttributeMemberProperties": [
{
"ValueDataType": "boolean",
"PropertyValue": null,
"TranslationName": "FiscalMonth$InPast",
"PropertyName": "FiscalMonth$InPast",
"KeyColumnDataType": "boolean",
"Id": "079eb95d-1a80-409e-861c-766ffb40de0b",
"FormatString": null,
"ConversionFormatString": null
},
{
"ValueDataType": "boolean",
"PropertyValue": null,
"TranslationName": "FiscalMonth$IsCurrent",
"PropertyName": "FiscalMonth$IsCurrent",
"KeyColumnDataType": "boolean",
"Id": "586636b9-97a2-45ee-960a-128a821ac9c0",
"FormatString": null,
"ConversionFormatString": null
}
]
},
{
"MeasureId": "541117cd-3701-416a-b405-14c59f00c19b",
"Name": "SCPBaseForecastLC",
"Alias": "5",
"ApiName": null,
"AllCellsReadOnly": true,
"IsEditable": false,
"FormatString": "#,##0",
"ConversionFormatString": "#,##0",
"MeasureColumnName": "SCPBaseForecastLC",
"MeasureFormula": null,
"DataType": "number",
"AggregateFunction": "Sum",
"AggregationType": 0,
"ToolTip": "Base Forecast LC",
"IsComputedByPlanningService": true,
"HasEditableCellsInPast": false,
"MeasureGroupName": "Forecast",
"MeasureType": "Regular",
"ConversionFormula": null,
"Translation": "Unconstrained Forecast LC",
"ValidationToolTip": null
},
{
"MeasureId": "81922673-d312-4db8-85a5-73bdea2ab396",
"Name": "SCPBaseForecastQty",
"Alias": "6",
"ApiName": null,
"AllCellsReadOnly": false,
"IsEditable": true,
"FormatString": "#,##0",
"ConversionFormatString": "#,##0",
"MeasureColumnName": "SPForecastQty",
"MeasureFormula": null,
"DataType": "number",
"AggregateFunction": "Sum",
"AggregationType": 0,
"ToolTip": "Base Forecast",
"IsComputedByPlanningService": true,
"HasEditableCellsInPast": false,
"MeasureGroupName": "Forecast",
"MeasureType": "Regular",
"ConversionFormula": "",
"Translation": "Unconstrained Forecast",
"ValidationToolTip": null
},
{
"MeasureId": "c75b7cfd-75ed-4b73-b9b1-6a355986578a",
"Name": "SCPPROTOOutlook",
"Alias": "7",
"ApiName": null,
"AllCellsReadOnly": false,
"IsEditable": true,
"FormatString": "#,##0",
"ConversionFormatString": "#,##0",
"MeasureColumnName": "SCPPROTOOutlook",
"MeasureFormula": null,
"DataType": "number",
"AggregateFunction": "Sum",
"AggregationType": 0,
"ToolTip": "Forecast",
"IsComputedByPlanningService": true,
"HasEditableCellsInPast": false,
"MeasureGroupName": "PROTODemandReviewAnalystics With Week Grandularity",
"MeasureType": "Regular",
"ConversionFormula": "",
"Translation": "Forecasted Demand",
"ValidationToolTip": null
}
],
"Data": [
[
0,
0,
0,
0,
0,
[
956.1757221860003,
{
"rw": 1
}
],
[
10000.000000000002,
{
"rw": 2
}
],
[
4000.0000000000005,
{
"rw": 2
}
]
],
[
0,
0,
0,
0,
1,
[
1266.1874388660005,
{
"rw": 1
}
],
[
2999.9999999999995,
{
"rw": 2
}
],
[
4000.0000000000005,
{
"rw": 2
}
]
],
[
0,
0,
0,
1,
2,
[
768.1470831909999,
{
"rw": 1
}
],
[
2999.9999999999986,
{
"rw": 2
}
],
[
4000,
{
"rw": 2
}
]
],
[
0,
0,
0,
1,
3,
[
1071.6176919799996,
{
"rw": 1
}
],
[
3000,
{
"rw": 2
}
],
[
4000,
{
"rw": 2
}
]
],
[
0,
0,
0,
1,
4,
[
1276.8717889430002,
{
"rw": 1
}
],
[
2999.9999999999995,
{
"rw": 2
}
],
[
4000.0000000000005,
{
"rw": 2
}
]
],
[
0,
0,
0,
2,
5,
[
744.1233091150001,
{
"rw": 1
}
],
[
2999.9999999999995,
{
"rw": 2
}
],
[
4000,
{
"rw": 2
}
]
],
[
0,
0,
0,
2,
6,
[
917.3550186200001,
{
"rw": 1
}
],
[
3000,
{
"rw": 2
}
],
[
4000,
{
"rw": 2
}
]
],
[
0,
0,
0,
2,
7,
[
1049.86294688,
{
"rw": 1
}
],
[
3000.0000000000014,
{
"rw": 2
}
],
[
4000,
{
"rw": 2
}
]
],
[
0,
0,
0,
3,
8,
[
958.7797716659996,
{
"rw": 1
}
],
[
2999.9999999999995,
{
"rw": 2
}
],
[
4000,
{
"rw": 2
}
]
],
[
0,
0,
0,
3,
9,
[
1120.8480719679997,
{
"rw": 1
}
],
[
2999.999999999999,
{
"rw": 2
}
],
[
4000,
{
"rw": 2
}
]
],
[
0,
0,
0,
3,
10,
[
903.3508236969999,
{
"rw": 1
}
],
[
2999.9999999999995,
{
"rw": 2
}
],
[
4000.0000000000005,
{
"rw": 2
}
]
],
[
0,
0,
0,
4,
11,
[
null,
{
"rw": 1
}
],
[
null,
{
"rw": 2
}
],
[
1100.018048153,
{
"rw": 2
}
]
],
[
0,
0,
0,
4,
12,
[
null,
{
"rw": 1
}
],
[
null,
{
"rw": 2
}
],
[
1251.822770395,
{
"rw": 2
}
]
],
[
0,
0,
0,
4,
13,
[
null,
{
"rw": 1
}
],
[
null,
{
"rw": 2
}
],
[
970.540390657,
{
"rw": 2
}
]
],
[
0,
0,
0,
5,
14,
[
null,
{
"rw": 1
}
],
[
null,
{
"rw": 2
}
],
[
768.1470831909999,
{
"rw": 2
}
]
],
[
0,
0,
0,
5,
15,
[
null,
{
"rw": 1
}
],
[
null,
{
"rw": 2
}
],
[
1357.5222911870003,
{
"rw": 2
}
]
],
[
0,
0,
0,
5,
16,
[
null,
{
"rw": 1
}
],
[
null,
{
"rw": 2
}
],
[
990.9671897359999,
{
"rw": 2
}
]
],
[
0,
0,
0,
6,
17,
[
null,
{
"rw": 1
}
],
[
null,
{
"rw": 2
}
],
[
744.123309115,
{
"rw": 2
}
]
],
[
0,
0,
0,
6,
18,
[
null,
{
"rw": 1
}
],
[
null,
{
"rw": 2
}
],
[
1118.729165802,
{
"rw": 2
}
]
],
[
0,
0,
0,
6,
19,
[
null,
{
"rw": 1
}
],
[
null,
{
"rw": 2
}
],
[
848.488799698,
{
"rw": 2
}
]
],
[
0,
1,
0,
0,
0,
[
958.1966733489999,
{
"rw": 1
}
],
[
3000,
{
"rw": 2
}
],
[
3999.9999999999995,
{
"rw": 2
}
]
],
[
0,
1,
0,
0,
1,
[
1269.7891778710002,
{
"rw": 1
}
],
[
3000.000000000001,
{
"rw": 2
}
],
[
4000,
{
"rw": 2
}
]
],
[
0,
1,
0,
1,
2,
[
770.604789046,
{
"rw": 1
}
],
[
3000.0000000000023,
{
"rw": 2
}
],
[
4000,
{
"rw": 2
}
]
],
[
0,
1,
0,
1,
3,
[
1075.9270534310003,
{
"rw": 1
}
],
[
2999.9999999999995,
{
"rw": 2
}
],
[
4000.0000000000005,
{
"rw": 2
}
]
],
[
0,
1,
0,
1,
4,
[
1281.837763386,
{
"rw": 1
}
],
[
3000,
{
"rw": 2
}
],
[
3999.999999999999,
{
"rw": 2
}
]
],
[
0,
1,
0,
2,
5,
[
749.0112359620002,
{
"rw": 1
}
],
[
3000.0000000000014,
{
"rw": 2
}
],
[
4000,
{
"rw": 2
}
]
],
[
0,
1,
0,
2,
6,
[
921.7156037000002,
{
"rw": 1
}
],
[
3000.0000000000005,
{
"rw": 2
}
],
[
3999.999999999999,
{
"rw": 2
}
]
],
[
0,
1,
0,
2,
7,
[
1055.833710415,
{
"rw": 1
}
],
[
3000.0000000000014,
{
"rw": 2
}
],
[
3999.9999999999995,
{
"rw": 2
}
]
],
[
0,
1,
0,
3,
8,
[
964.6600528100005,
{
"rw": 1
}
],
[
2999.999999999999,
{
"rw": 2
}
],
[
3999.9999999999995,
{
"rw": 2
}
]
],
[
0,
1,
0,
3,
9,
[
1127.735786997,
{
"rw": 1
}
],
[
3000.0000000000023,
{
"rw": 2
}
],
[
4000,
{
"rw": 2
}
]
],
[
0,
1,
0,
3,
10,
[
908.9087344389997,
{
"rw": 1
}
],
[
2999.999999999997,
{
"rw": 2
}
],
[
4000,
{
"rw": 2
}
]
],
[
0,
1,
0,
4,
11,
[
null,
{
"rw": 1
}
],
[
null,
{
"rw": 2
}
],
[
1105.767281947,
{
"rw": 2
}
]
],
[
0,
1,
0,
4,
12,
[
null,
{
"rw": 1
}
],
[
null,
{
"rw": 2
}
],
[
1256.8575459990002,
{
"rw": 2
}
]
],
[
0,
1,
0,
4,
13,
[
null,
{
"rw": 1
}
],
[
null,
{
"rw": 2
}
],
[
971.128305221,
{
"rw": 2
}
]
],
[
0,
1,
0,
5,
14,
[
null,
{
"rw": 1
}
],
[
null,
{
"rw": 2
}
],
[
770.604789046,
{
"rw": 2
}
]
],
[
0,
1,
0,
5,
15,
[
null,
{
"rw": 1
}
],
[
null,
{
"rw": 2
}
],
[
1360.985606319,
{
"rw": 2
}
]
],
[
0,
1,
0,
5,
16,
[
null,
{
"rw": 1
}
],
[
null,
{
"rw": 2
}
],
[
996.7792104980001,
{
"rw": 2
}
]
],
[
0,
1,
0,
6,
17,
[
null,
{
"rw": 1
}
],
[
null,
{
"rw": 2
}
],
[
749.011235962,
{
"rw": 2
}
]
],
[
0,
1,
0,
6,
18,
[
null,
{
"rw": 1
}
],
[
null,
{
"rw": 2
}
],
[
1126.064259789,
{
"rw": 2
}
]
],
[
0,
1,
0,
6,
19,
[
null,
{
"rw": 1
}
],
[
null,
{
"rw": 2
}
],
[
851.485054326,
{
"rw": 2
}
]
],
[
0,
2,
0,
0,
0,
[
957.2510216230004,
{
"rw": 1
}
],
[
3000.000000000001,
{
"rw": 2
}
],
[
4000,
{
"rw": 2
}
]
],
[
0,
2,
0,
0,
1,
[
1268.135363947,
{
"rw": 1
}
],
[
3000.000000000001,
{
"rw": 2
}
],
[
4000,
{
"rw": 2
}
]
],
[
0,
2,
0,
1,
2,
[
768.2184866929998,
{
"rw": 1
}
],
[
2999.999999999998,
{
"rw": 2
}
],
[
3999.9999999999995,
{
"rw": 2
}
]
],
[
0,
2,
0,
1,
3,
[
1073.886753855,
{
"rw": 1
}
],
[
3000.0000000000005,
{
"rw": 2
}
],
[
4000,
{
"rw": 2
}
]
],
[
0,
2,
0,
1,
4,
[
1278.683524428,
{
"rw": 1
}
],
[
2999.9999999999986,
{
"rw": 2
}
],
[
4000,
{
"rw": 2
}
]
],
[
0,
2,
0,
2,
5,
[
746.4320604629999,
{
"rw": 1
}
],
[
2999.999999999999,
{
"rw": 2
}
],
[
4000,
{
"rw": 2
}
]
],
[
0,
2,
0,
2,
6,
[
919.389978455,
{
"rw": 1
}
],
[
3000.000000000002,
{
"rw": 2
}
],
[
4000,
{
"rw": 2
}
]
],
[
0,
2,
0,
2,
7,
[
1052.3007525420005,
{
"rw": 1
}
],
[
3000.0000000000005,
{
"rw": 2
}
],
[
4000,
{
"rw": 2
}
]
],
[
0,
2,
0,
3,
8,
[
961.7400448840002,
{
"rw": 1
}
],
[
3000,
{
"rw": 2
}
],
[
4000,
{
"rw": 2
}
]
],
[
0,
2,
0,
3,
9,
[
1124.6291880909998,
{
"rw": 1
}
],
[
3000.0000000000014,
{
"rw": 2
}
],
[
3999.9999999999995,
{
"rw": 2
}
]
],
[
0,
2,
0,
3,
10,
[
906.4005854039999,
{
"rw": 1
}
],
[
3000.0000000000005,
{
"rw": 2
}
],
[
4000,
{
"rw": 2
}
]
],
[
0,
2,
0,
4,
11,
[
null,
{
"rw": 1
}
],
[
null,
{
"rw": 2
}
],
[
1100.7647819459999,
{
"rw": 2
}
]
],
[
0,
2,
0,
4,
12,
[
null,
{
"rw": 1
}
],
[
null,
{
"rw": 2
}
],
[
1251.300305511,
{
"rw": 2
}
]
],
[
0,
2,
0,
4,
13,
[
null,
{
"rw": 1
}
],
[
null,
{
"rw": 2
}
],
[
974.086080059,
{
"rw": 2
}
]
],
[
0,
2,
0,
5,
14,
[
null,
{
"rw": 1
}
],
[
null,
{
"rw": 2
}
],
[
768.2184866930002,
{
"rw": 2
}
]
],
[
0,
2,
0,
5,
15,
[
null,
{
"rw": 1
}
],
[
null,
{
"rw": 2
}
],
[
1359.182994539,
{
"rw": 2
}
]
],
[
0,
2,
0,
5,
16,
[
null,
{
"rw": 1
}
],
[
null,
{
"rw": 2
}
],
[
993.387283744,
{
"rw": 2
}
]
],
[
0,
2,
0,
6,
17,
[
null,
{
"rw": 1
}
],
[
null,
{
"rw": 2
}
],
[
746.4320604629999,
{
"rw": 2
}
]
],
[
0,
2,
0,
6,
18,
[
null,
{
"rw": 1
}
],
[
null,
{
"rw": 2
}
],
[
1123.204252773,
{
"rw": 2
}
]
],
[
0,
2,
0,
6,
19,
[
null,
{
"rw": 1
}
],
[
null,
{
"rw": 2
}
],
[
848.486478224,
{
"rw": 2
}
]
],
[
0,
0,
1,
0,
0,
[
956.1757221860003,
{
"rw": 1
}
],
[
7999.999999999998,
{
"rw": 2
}
],
[
7000.000000000001,
{
"rw": 2
}
]
],
[
0,
0,
1,
0,
1,
[
1266.1874388660005,
{
"rw": 1
}
],
[
3000.0000000000005,
{
"rw": 2
}
],
[
4000.0000000000005,
{
"rw": 2
}
]
],
[
0,
0,
1,
1,
2,
[
768.1470831909999,
{
"rw": 1
}
],
[
2999.9999999999986,
{
"rw": 2
}
],
[
4000,
{
"rw": 2
}
]
],
[
0,
0,
1,
1,
3,
[
1071.6176919799996,
{
"rw": 1
}
],
[
3000.0000000000023,
{
"rw": 2
}
],
[
4000,
{
"rw": 2
}
]
],
[
0,
0,
1,
1,
4,
[
1276.8717889430002,
{
"rw": 1
}
],
[
2999.9999999999995,
{
"rw": 2
}
],
[
4000.0000000000005,
{
"rw": 2
}
]
],
[
0,
0,
1,
2,
5,
[
744.1233091150001,
{
"rw": 1
}
],
[
2999.9999999999995,
{
"rw": 2
}
],
[
4000,
{
"rw": 2
}
]
],
[
0,
0,
1,
2,
6,
[
917.3550186200001,
{
"rw": 1
}
],
[
2999.9999999999995,
{
"rw": 2
}
],
[
4000,
{
"rw": 2
}
]
],
[
0,
0,
1,
2,
7,
[
1049.86294688,
{
"rw": 1
}
],
[
3000.0000000000027,
{
"rw": 2
}
],
[
4000,
{
"rw": 2
}
]
],
[
0,
0,
1,
3,
8,
[
958.7797716659996,
{
"rw": 1
}
],
[
2999.9999999999995,
{
"rw": 2
}
],
[
4000,
{
"rw": 2
}
]
],
[
0,
0,
1,
3,
9,
[
1120.8480719679997,
{
"rw": 1
}
],
[
2999.999999999999,
{
"rw": 2
}
],
[
4000,
{
"rw": 2
}
]
],
[
0,
0,
1,
3,
10,
[
903.3508236969999,
{
"rw": 1
}
],
[
2999.9999999999986,
{
"rw": 2
}
],
[
4000.0000000000005,
{
"rw": 2
}
]
],
[
0,
0,
1,
4,
11,
[
null,
{
"rw": 1
}
],
[
null,
{
"rw": 2
}
],
[
1100.018048153,
{
"rw": 2
}
]
],
[
0,
0,
1,
4,
12,
[
null,
{
"rw": 1
}
],
[
null,
{
"rw": 2
}
],
[
1251.822770395,
{
"rw": 2
}
]
],
[
0,
0,
1,
4,
13,
[
null,
{
"rw": 1
}
],
[
null,
{
"rw": 2
}
],
[
970.540390657,
{
"rw": 2
}
]
],
[
0,
0,
1,
5,
14,
[
null,
{
"rw": 1
}
],
[
null,
{
"rw": 2
}
],
[
768.1470831909999,
{
"rw": 2
}
]
],
[
0,
0,
1,
5,
15,
[
null,
{
"rw": 1
}
],
[
null,
{
"rw": 2
}
],
[
1357.5222911870003,
{
"rw": 2
}
]
],
[
0,
0,
1,
5,
16,
[
null,
{
"rw": 1
}
],
[
null,
{
"rw": 2
}
],
[
990.9671897359999,
{
"rw": 2
}
]
],
[
0,
0,
1,
6,
17,
[
null,
{
"rw": 1
}
],
[
null,
{
"rw": 2
}
],
[
744.123309115,
{
"rw": 2
}
]
],
[
0,
0,
1,
6,
18,
[
null,
{
"rw": 1
}
],
[
null,
{
"rw": 2
}
],
[
1118.729165802,
{
"rw": 2
}
]
],
[
0,
0,
1,
6,
19,
[
null,
{
"rw": 1
}
],
[
null,
{
"rw": 2
}
],
[
848.488799698,
{
"rw": 2
}
]
],
[
0,
1,
1,
0,
0,
[
958.1966733489999,
{
"rw": 1
}
],
[
3000,
{
"rw": 2
}
],
[
4000.0000000000005,
{
"rw": 2
}
]
],
[
0,
1,
1,
0,
1,
[
1269.7891778710002,
{
"rw": 1
}
],
[
3000.000000000001,
{
"rw": 2
}
],
[
3999.9999999999995,
{
"rw": 2
}
]
],
[
0,
1,
1,
1,
2,
[
770.604789046,
{
"rw": 1
}
],
[
3000.000000000001,
{
"rw": 2
}
],
[
4000,
{
"rw": 2
}
]
],
[
0,
1,
1,
1,
3,
[
1075.9270534310003,
{
"rw": 1
}
],
[
2999.9999999999995,
{
"rw": 2
}
],
[
4000,
{
"rw": 2
}
]
],
[
0,
1,
1,
1,
4,
[
1281.837763386,
{
"rw": 1
}
],
[
3000,
{
"rw": 2
}
],
[
3999.999999999999,
{
"rw": 2
}
]
],
[
0,
1,
1,
2,
5,
[
749.0112359620002,
{
"rw": 1
}
],
[
3000.000000000001,
{
"rw": 2
}
],
[
4000,
{
"rw": 2
}
]
],
[
0,
1,
1,
2,
6,
[
921.7156037000002,
{
"rw": 1
}
],
[
3000.0000000000005,
{
"rw": 2
}
],
[
4000.0000000000005,
{
"rw": 2
}
]
],
[
0,
1,
1,
2,
7,
[
1055.833710415,
{
"rw": 1
}
],
[
3000.0000000000014,
{
"rw": 2
}
],
[
4000.0000000000005,
{
"rw": 2
}
]
],
[
0,
1,
1,
3,
8,
[
964.6600528100005,
{
"rw": 1
}
],
[
2999.999999999999,
{
"rw": 2
}
],
[
4000,
{
"rw": 2
}
]
],
[
0,
1,
1,
3,
9,
[
1127.735786997,
{
"rw": 1
}
],
[
3000.0000000000023,
{
"rw": 2
}
],
[
4000,
{
"rw": 2
}
]
],
[
0,
1,
1,
3,
10,
[
908.9087344389997,
{
"rw": 1
}
],
[
2999.999999999997,
{
"rw": 2
}
],
[
4000,
{
"rw": 2
}
]
],
[
0,
1,
1,
4,
11,
[
null,
{
"rw": 1
}
],
[
null,
{
"rw": 2
}
],
[
1105.767281947,
{
"rw": 2
}
]
],
[
0,
1,
1,
4,
12,
[
null,
{
"rw": 1
}
],
[
null,
{
"rw": 2
}
],
[
1256.8575459990002,
{
"rw": 2
}
]
],
[
0,
1,
1,
4,
13,
[
null,
{
"rw": 1
}
],
[
null,
{
"rw": 2
}
],
[
971.128305221,
{
"rw": 2
}
]
],
[
0,
1,
1,
5,
14,
[
null,
{
"rw": 1
}
],
[
null,
{
"rw": 2
}
],
[
770.604789046,
{
"rw": 2
}
]
],
[
0,
1,
1,
5,
15,
[
null,
{
"rw": 1
}
],
[
null,
{
"rw": 2
}
],
[
1360.985606319,
{
"rw": 2
}
]
],
[
0,
1,
1,
5,
16,
[
null,
{
"rw": 1
}
],
[
null,
{
"rw": 2
}
],
[
996.7792104980001,
{
"rw": 2
}
]
],
[
0,
1,
1,
6,
17,
[
null,
{
"rw": 1
}
],
[
null,
{
"rw": 2
}
],
[
749.011235962,
{
"rw": 2
}
]
],
[
0,
1,
1,
6,
18,
[
null,
{
"rw": 1
}
],
[
null,
{
"rw": 2
}
],
[
1126.064259789,
{
"rw": 2
}
]
],
[
0,
1,
1,
6,
19,
[
null,
{
"rw": 1
}
],
[
null,
{
"rw": 2
}
],
[
851.485054326,
{
"rw": 2
}
]
],
[
0,
2,
1,
0,
0,
[
957.2510216230004,
{
"rw": 1
}
],
[
3000.0000000000005,
{
"rw": 2
}
],
[
4000,
{
"rw": 2
}
]
],
[
0,
2,
1,
0,
1,
[
1268.135363947,
{
"rw": 1
}
],
[
3000.0000000000014,
{
"rw": 2
}
],
[
4000.000000000001,
{
"rw": 2
}
]
],
[
0,
2,
1,
1,
2,
[
768.2184866929998,
{
"rw": 1
}
],
[
2999.999999999998,
{
"rw": 2
}
],
[
3999.9999999999995,
{
"rw": 2
}
]
],
[
0,
2,
1,
1,
3,
[
1073.886753855,
{
"rw": 1
}
],
[
3000.0000000000005,
{
"rw": 2
}
],
[
4000,
{
"rw": 2
}
]
],
[
0,
2,
1,
1,
4,
[
1278.683524428,
{
"rw": 1
}
],
[
2999.9999999999986,
{
"rw": 2
}
],
[
4000,
{
"rw": 2
}
]
],
[
0,
2,
1,
2,
5,
[
746.4320604629999,
{
"rw": 1
}
],
[
2999.999999999999,
{
"rw": 2
}
],
[
3999.9999999999995,
{
"rw": 2
}
]
],
[
0,
2,
1,
2,
6,
[
919.389978455,
{
"rw": 1
}
],
[
3000.000000000002,
{
"rw": 2
}
],
[
4000,
{
"rw": 2
}
]
],
[
0,
2,
1,
2,
7,
[
1052.3007525420005,
{
"rw": 1
}
],
[
3000.0000000000005,
{
"rw": 2
}
],
[
4000,
{
"rw": 2
}
]
],
[
0,
2,
1,
3,
8,
[
961.7400448840002,
{
"rw": 1
}
],
[
3000,
{
"rw": 2
}
],
[
4000,
{
"rw": 2
}
]
],
[
0,
2,
1,
3,
9,
[
1124.6291880909998,
{
"rw": 1
}
],
[
3000.0000000000014,
{
"rw": 2
}
],
[
4000.0000000000005,
{
"rw": 2
}
]
],
[
0,
2,
1,
3,
10,
[
906.4005854039999,
{
"rw": 1
}
],
[
3000.000000000002,
{
"rw": 2
}
],
[
4000,
{
"rw": 2
}
]
],
[
0,
2,
1,
4,
11,
[
null,
{
"rw": 1
}
],
[
null,
{
"rw": 2
}
],
[
1100.7647819459999,
{
"rw": 2
}
]
],
[
0,
2,
1,
4,
12,
[
null,
{
"rw": 1
}
],
[
null,
{
"rw": 2
}
],
[
1251.300305511,
{
"rw": 2
}
]
],
[
0,
2,
1,
4,
13,
[
null,
{
"rw": 1
}
],
[
null,
{
"rw": 2
}
],
[
974.086080059,
{
"rw": 2
}
]
],
[
0,
2,
1,
5,
14,
[
null,
{
"rw": 1
}
],
[
null,
{
"rw": 2
}
],
[
768.2184866930002,
{
"rw": 2
}
]
],
[
0,
2,
1,
5,
15,
[
null,
{
"rw": 1
}
],
[
null,
{
"rw": 2
}
],
[
1359.182994539,
{
"rw": 2
}
]
],
[
0,
2,
1,
5,
16,
[
null,
{
"rw": 1
}
],
[
null,
{
"rw": 2
}
],
[
993.387283744,
{
"rw": 2
}
]
],
[
0,
2,
1,
6,
17,
[
null,
{
"rw": 1
}
],
[
null,
{
"rw": 2
}
],
[
746.4320604629999,
{
"rw": 2
}
]
],
[
0,
2,
1,
6,
18,
[
null,
{
"rw": 1
}
],
[
null,
{
"rw": 2
}
],
[
1123.204252773,
{
"rw": 2
}
]
],
[
0,
2,
1,
6,
19,
[
null,
{
"rw": 1
}
],
[
null,
{
"rw": 2
}
],
[
848.486478224,
{
"rw": 2
}
]
]
],
"QueryGuid": "4b0f0954-0835-4c45-aa9d-1bfc68d90da4",
"ConversionCulture": "en-US",
"ResultId": "00000000-0000-0000-0000-000000000000"
}