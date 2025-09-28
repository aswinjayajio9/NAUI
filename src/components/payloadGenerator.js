export const generateGetDataPayload = (query) => {
    const payload = {
        RegularMeasures: [],
        LevelAttributes: [],
        DataProperties: {
            IncludeInactiveMembers: false,
            IncludeNulls: false,
            NullsForFinerGrainSelect: false,
            NullsForUnrelatedAttrSelect: false,
            RequireEditValidation: false,
            SubTotalsType: "NoSubtotals",
            IncludeNullsForSeries: "",
            MaxRecordLimit: "2000"
        }
    };

    // Extract Measures
    const measureRegex = /Measure\.\[([^\]]+)\]/g;
    let measureMatch;
    while ((measureMatch = measureRegex.exec(query)) !== null) {
        payload.RegularMeasures.push({ Name: measureMatch[1] });
    }

    // Extract Level Attributes
    const levelAttributeRegex = /\[([^\]]+)\]\.\[([^\]]+)\](?:\.filter\(#\.Name in \{([^\}]+)\}\))?/g;
    let levelAttributeMatch;
    while ((levelAttributeMatch = levelAttributeRegex.exec(query)) !== null) {
        const dimensionName = levelAttributeMatch[1];
        const name = levelAttributeMatch[2];
        const selectedMembers = levelAttributeMatch[3]
            ? levelAttributeMatch[3].split(',').map(member => member.trim().replace(/"/g, ''))
            : null;

        const levelAttribute = {
            Name: name,
            DimensionName: dimensionName,
            Axis: "row"
        };

        if (selectedMembers) {
            levelAttribute.IsFilter = true;
            levelAttribute.Axis = "none";
            levelAttribute.AllSelection = false;
            levelAttribute.SelectedMembers = selectedMembers.map(member => ({ Name: member }));
        }

        payload.LevelAttributes.push(levelAttribute);
    }

    return payload;
};

// Example usage
const query = `SELECT ([Version].[Version Name].filter(#.Name in {"SelectedMembers1","SelectedMembers2","SelectedMembers3"}) * [o9NetworkAggregation Network Plan Type].[o9NetworkAggregation Network Plan Type].filter(#.Name in {"","",""}) * [Location].[Location] * [Resource].[Resource]) ON ROW, ({Measure.[Include Resource Node], Measure.[Include Resource Node Override], Measure.[Include Resource Node Final], Measure.[Aggregation Simultaneous Resource], Measure.[Applied Resource ABDM Rule]}) ON COLUMN;`;

const payload = generateGetDataPayload(query);
console.log(JSON.stringify(payload, null, 2));