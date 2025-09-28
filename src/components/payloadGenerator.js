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
 * Build a Cell Edit payload from a plain table row object.
 * - updatedRow: an object with keys for all dimension/measure headers plus "key"
 * - modelDefinition: { RegularMeasures: (string[]|{Name:string}[]), LevelAttributes: ({Name, DimensionName, Axis, IsFilter?}[]) }
 * - filters: optional array of filter objects in o9 format, or empty
 */
export const generateCellEditPayload = (updatedRow, modelDefinition = {}, filters = []) => {
    if (!updatedRow || typeof updatedRow !== "object") {
        throw new Error("generateCellEditPayload: updatedRow must be a row object");
    }

    // Normalize Measures -> array of names
    const regularMeasureNames = (modelDefinition.RegularMeasures || [])
        .map(m => typeof m === "string" ? m : m?.Name)
        .filter(Boolean);

    // Normalize LevelAttributes
    const allLevelAttrs = (modelDefinition.LevelAttributes || []).filter(Boolean);
    const nonFilterAttrs = allLevelAttrs.filter(a => !a.IsFilter);
    const filterAttrs = allLevelAttrs.filter(a => a.IsFilter);

    // Build Meta
    const Meta = [];
    const aliasByAttrName = {};
    const aliasByMeasureName = {};
    let aliasCounter = 0;

    // Dimension Meta (non-filter attributes only)
    nonFilterAttrs.forEach(attr => {
        const attrName = attr.Name;
        const dimName = attr.DimensionName || attr.Dimension || attrName;
        const alias = String(aliasCounter++);
        aliasByAttrName[attrName] = alias;

        const memberName = updatedRow[attrName] != null ? String(updatedRow[attrName]) : "";
        Meta.push({
            DimensionName: dimName,
            Alias: alias,
            Name: attrName,
            DimensionValues: [
                {
                    Name: memberName,
                    MemberIndex: 0
                }
            ]
        });
    });

    // Measure Meta (include all measures)
    regularMeasureNames.forEach(mName => {
        const alias = String(aliasCounter++);
        aliasByMeasureName[mName] = alias;
        Meta.push({
            DataType: "number",
            Name: mName,
            Alias: alias
        });
    });

    // UpdatedRows: take full row -> MemberCells for all non-filter dims, DataCells for all measures
    const MemberCells = nonFilterAttrs.map(attr => ({
        Alias: aliasByAttrName[attr.Name],
        MemberIndex: 0
    }));

    const toNumberIfPossible = (v) => {
        if (v === "" || v === undefined || v === null) return null;
        const num = Number(String(v).replace(/,/g, ""));
        return Number.isNaN(num) ? v : num;
    };

    const DataCells = regularMeasureNames.map(mName => ({
        Alias: aliasByMeasureName[mName],
        Value: toNumberIfPossible(updatedRow[mName])
    }));

    const UpdatedRows = [
        { MemberCells, DataCells }
    ];

    // ModelDefinition: keep full measures and level attributes (including filter attributes)
    const ModelDefinition = {
        RegularMeasures: regularMeasureNames.map(n => ({ Name: n })),
        LevelAttributes: allLevelAttrs.map(a => ({
            ...a,
            Name: a.Name,
            DimensionName: a.DimensionName || a.Dimension || a.Name
        }))
    };

    // Filters: accept array; if not array, try to convert a mapping object
    let Filters = Array.isArray(filters) ? filters : [];
    if (!Array.isArray(filters) && filters && typeof filters === "object") {
        // Convert { AttrName: [values] } to filter objects, best-effort DimensionName from attrs
        Filters = Object.entries(filters).map(([name, values]) => {
            const la = allLevelAttrs.find(a => a.Name === name);
            return {
                IsFilter: true,
                Axis: "none",
                AllSelection: !Array.isArray(values) || values.length === 0,
                SelectedMembers: Array.isArray(values) ? values.map(v => ({ Name: String(v) })) : [],
                Name: name,
                DimensionName: la?.DimensionName || name
            };
        });
    }

    return { Meta, UpdatedRows, ModelDefinition, Filters };
};

