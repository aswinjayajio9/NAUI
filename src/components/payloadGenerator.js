import tenantID from './HomePage';
export const generateGetDataPayload = (query) => {
    // Check if the query starts with "exec" (case-insensitive)
    if (/^exec/i.test(query)) {
        return {
            tenantId: tenantID,
            schema: {
                model: {
                    fields: {}
                }
            },
            data: {},
            ibplrules: [
                {
                    template: query
                }
            ]
        };
    }

    // If the query starts with "SELECT" (case-insensitive)
    if (/^select/i.test(query)) {
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
            if (measureMatch[1].trim() !== "") {
                payload.RegularMeasures.push({ Name: measureMatch[1] });
            }
        }

        // Extract Level Attributes
        const levelAttributeRegex = /\[([^\]]+)\]\.\[([^\]]+)\](?:\.filter\(#\.Name in \{([^\}]+)\}\))?(?:\.\[([^\]]+)\])?/g;
        let levelAttributeMatch;
        while ((levelAttributeMatch = levelAttributeRegex.exec(query)) !== null) {
            const dimensionName = levelAttributeMatch[1];
            const name = levelAttributeMatch[2];
            const selectedMembersFilter = levelAttributeMatch[3]
                ? levelAttributeMatch[3]
                      .split(',')
                      .map(member => member.trim().replace(/"/g, ''))
                      .filter(member => member !== "") // Filter out empty strings
                : null;
            const singleSelectedMember = levelAttributeMatch[4] && levelAttributeMatch[4].trim() !== ""
                ? levelAttributeMatch[4].trim()
                : null;

            const levelAttribute = {
                Name: name,
                DimensionName: dimensionName,
                Axis: "row"
            };

            if (selectedMembersFilter && selectedMembersFilter.length > 0) {
                levelAttribute.IsFilter = true;
                levelAttribute.Axis = "none";
                levelAttribute.AllSelection = false;
                levelAttribute.SelectedMembers = selectedMembersFilter.map(member => ({ Name: member }));
            } else if (singleSelectedMember) {
                levelAttribute.IsFilter = true;
                levelAttribute.Axis = "none";
                levelAttribute.AllSelection = false;
                levelAttribute.SelectedMembers = [{ Name: singleSelectedMember }];
            }

            payload.LevelAttributes.push(levelAttribute);
        }

        return payload;
    }

    // If the query doesn't match "exec" or "SELECT", return null or throw an error
    throw new Error("Unsupported query format. Query must start with 'exec' or 'SELECT'.");
};
/**
 * Generates a payload for cell editing based on the provided data.
 * @param {Object} updatedRow - The updated row data.
 * @param {Object} modelDefinition - The model definition containing measures and level attributes.
 * @param {Object} filters - The filters applied to the data.
 * @returns {Object} - The generated payload.
 */
export const generateCellEditPayload = (updatedRow, modelDefinition, filters) => {
    const payload = {
        Meta: [],
        UpdatedRows: [],
        ModelDefinition: {
            RegularMeasures: modelDefinition.RegularMeasures || [],
            LevelAttributes: modelDefinition.LevelAttributes || []
        },
        Filters: []
    };

    // Add Meta data
    modelDefinition.LevelAttributes.forEach(attr => {
        const metaEntry = {
            DimensionName: attr.DimensionName,
            Alias: attr.Alias || attr.Name,
            Name: attr.Name
        };

        if (attr.IsFilter) {
            metaEntry.DimensionValues = attr.SelectedMembers.map(member => ({
                Name: member.Name,
                MemberIndex: 0 // Default index, can be adjusted based on actual data
            }));
        }

        payload.Meta.push(metaEntry);
    });

    modelDefinition.RegularMeasures.forEach(measure => {
        payload.Meta.push({
            DataType: "number", // Assuming measures are numeric
            Name: measure.Name,
            Alias: measure.Name
        });
    });

    // Add UpdatedRows
    const updatedRowEntry = {
        MemberCells: updatedRow.MemberCells.map(cell => ({
            Alias: cell.Alias,
            MemberIndex: cell.MemberIndex
        })),
        DataCells: updatedRow.DataCells.map(cell => ({
            Alias: cell.Alias,
            Value: cell.Value
        }))
    };

    payload.UpdatedRows.push(updatedRowEntry);

    // Add Filters
    filters.forEach(filter => {
        payload.Filters.push({
            IsFilter: true,
            Axis: "none",
            AllSelection: false,
            SelectedMembers: filter.SelectedMembers.map(member => ({
                Name: member.Name
            })),
            Name: filter.Name,
            DimensionName: filter.DimensionName
        });
    });

    return payload;
};

