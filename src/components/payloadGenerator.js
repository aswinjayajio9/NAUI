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
                levelAttribute.Axis = "row";
                levelAttribute.AllSelection = false;
                levelAttribute.SelectedMembers = selectedMembersFilter.map(member => ({ Name: member }));
            } else if (singleSelectedMember) {
                levelAttribute.IsFilter = true;
                levelAttribute.Axis = "row";
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
 * Build a Cell Edit payload from a plain table row object.
 * - updatedRow: an object with keys for all dimension/measure headers plus "key"
 * - modelDefinition: { RegularMeasures: (string[]|{Name:string}[]), LevelAttributes: ({Name, DimensionName, Axis, IsFilter?}[]) }
 * - filters: optional array of filter objects in o9 format, or empty
 */
export const generateCellEditPayload = (o9Meta, updatedRow, Filters=[]) => {
    // Build Meta array: transform each meta entry that has DimensionValues into a
    // lightweight object { DimensionName, Alias, Name, DimensionValues: [{ Name, MemberIndex }] }.
    // Preserve array positions; entries without DimensionValues become empty objects.
    const Meta = Array.isArray(o9Meta) ? o9Meta.map((item) => {
        if (!item) {
            return {};
        }

        // If this entry is a Measure, include only Name and Alias
        if (item.MeasureId) {
            return {
                Name: item.Name,
                Alias: item.Alias
            };
        }

        if (!Array.isArray(item.DimensionValues) || item.DimensionValues.length === 0) {
            return {};
        }

        return {
            DimensionName: item.DimensionName,
            Alias: item.Alias,
            Name: item.Name,
            DimensionValues: item.DimensionValues.map((v, idx) => ({
                Name: v.Name,
                MemberIndex: (v.MemberIndex != null ? v.MemberIndex : idx)
            }))
        };
    }) : [];

    // Build ModelDefinition from original o9Meta (only include actual measures/attributes; remove empty placeholders)
    const ModelDefinition = {
        RegularMeasures: Array.isArray(o9Meta)
            ? o9Meta
                  .filter(item => item && item.MeasureId)
                  .map(item => ({ Name: item.Name }))
            : [],
        LevelAttributes: Array.isArray(o9Meta)
            ? o9Meta
                  .filter(item => item && item.DimensionName && Array.isArray(item.DimensionValues) && item.DimensionValues.length > 0)
                  .map(item => ({
                      Axis: "row",
                      Name: item.Name,
                      DimensionName: item.DimensionName
                  }))
            : []
    };

    // Build UpdatedCells: single object with MemberCells (dimensions) and DataCells (measures)
    const MemberCells = [];
    const DataCells = [];

    Meta.forEach((m) => {
        if (!m || Object.keys(m).length === 0) return;

        // Dimension entry -> key is "[DimensionName].[Name]"
        if (m.DimensionName) {
            const key = `[${m.DimensionName}].[${m.Name}]`;
            if (Object.prototype.hasOwnProperty.call(updatedRow, key)) {
                const val = updatedRow[key];
                let memberIndex = null;
                if (val != null && Array.isArray(m.DimensionValues)) {
                    const found = m.DimensionValues.find(dv => dv.Name === val);
                    if (found) {
                        memberIndex = found.MemberIndex;
                    } else {
                        memberIndex = null;
                    }
                }
                MemberCells.push({
                    Alias: m.Alias,
                    MemberIndex: memberIndex
                });
            }
            return;
        }

        // Measure entry -> key is "Name"
        if (m.Name) {
            const key = m.Name;
            if (Object.prototype.hasOwnProperty.call(updatedRow, key)) {
                const val = updatedRow[key];
                // Only include measures that have a non-null/undefined value to avoid generating
                // malformed update statements like "... = ,"
                if (val !== null && val !== undefined) {
                    DataCells.push({
                        Alias: m.Alias,
                        Value: val
                    });
                }
            }
            return;
        }
    });

    return {
        Meta,
        ModelDefinition,
        UpdatedRows: [
            {
                MemberCells,
                DataCells
            }
        ],
        Filters
    };
};

