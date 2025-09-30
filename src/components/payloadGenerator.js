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
export const generateCellEditPayload = (o9Meta, updatedRow, Filters = [], CreatedMember = {}) => {
  console.log('generateCellEditPayload - o9Meta:', o9Meta);
  console.log('generateCellEditPayload - updatedRow:', updatedRow);
  console.log('generateCellEditPayload - CreatedMember:', CreatedMember);

  const unwrap = (cm) => (cm && cm.CreatedMember) ? cm.CreatedMember : (cm || {});
  const toKey = (k) => (k || '').trim().toLowerCase();
  const createdMemberMap = Object.fromEntries(
    Object.entries(unwrap(CreatedMember)).map(([k, v]) => [toKey(k), v])
  );

  // -- helpers (unchanged) --
  const parseNumberLike = (val) => {
    if (typeof val === 'number') return Number.isFinite(val) ? val : undefined;
    if (typeof val !== 'string') return undefined;
    let s = val.trim();
    if (s === '') return undefined;
    let sign = 1;
    if (/^\(.*\)$/.test(s)) { sign = -1; s = s.slice(1, -1); }
    s = s.replace(/,/g, '');
    const n = Number(s);
    return Number.isFinite(n) ? sign * n : undefined;
  };
  const parseBooleanLike = (val) => {
    if (typeof val === 'boolean') return val;
    if (typeof val === 'number') return val !== 0;
    if (typeof val !== 'string') return undefined;
    const s = val.trim().toLowerCase();
    if (s === 'true' || s === '1' || s === 'yes' || s === 'y') return true;
    if (s === 'false' || s === '0' || s === 'no' || s === 'n') return false;
    return undefined;
  };
  const toISODate = (val) => {
    const d = (val instanceof Date) ? val : new Date(val);
    if (Number.isNaN(d.getTime())) return undefined;
    return d.toISOString().slice(0, 10);
  };
  const toISODateTime = (val) => {
    const d = (val instanceof Date) ? val : new Date(val);
    if (Number.isNaN(d.getTime())) return undefined;
    return d.toISOString();
  };
  const looksLikeDateFormat = (fmt) => typeof fmt === 'string' && /[yY].*[mM].*[dD]|[dD].*[mM].*[yY]/.test(fmt);
  const looksLikeNumericFormat = (fmt) => typeof fmt === 'string' && /[#0]/.test(fmt);
  const coerceByTypeOrFormat = (dataType, formatString, val) => {
    if (val === null || val === undefined) return undefined;

    const t = (dataType || '').toLowerCase();
    if (t) {
      switch (t) {
        case 'int':
        case 'integer': {
          const n = parseNumberLike(val);
          return n !== undefined ? Math.trunc(n) : undefined;
        }
        case 'float':
        case 'double':
        case 'decimal':
        case 'number':
          return parseNumberLike(val);
        case 'bool':
        case 'boolean':
          return parseBooleanLike(val);
        case 'date':
          return toISODate(val);
        case 'datetime':
        case 'timestamp':
          return toISODateTime(val);
        default:
          return typeof val === 'string' ? val : String(val);
      }
    }

    // No DataType: infer from FormatString
    if (looksLikeDateFormat(formatString)) {
      // Best-effort: output ISO date
      return toISODate(val) ?? toISODateTime(val);
    }
    if (looksLikeNumericFormat(formatString)) {
      return parseNumberLike(val);
    }
    return typeof val === 'string' ? val : String(val);
  };

  // Format any value into the required bracketed string: "[]", "[value]", "[a, b]"
  const toBracketValue = (val) => {
    if (val === null || val === undefined) return "[]";
    if (Array.isArray(val)) {
      if (val.length === 0) return "[]";
      const items = val.map((x) => (x === null || x === undefined) ? "" : String(x));
      return `[${items.join(', ')}]`;
    }
    if (typeof val === 'string') {
      const s = val.trim();
      if (s === '') return "[]";
      if (s.startsWith('[') && s.endsWith(']')) return s; // already bracketed
      return `[${s}]`;
    }
    // numbers, booleans, dates -> stringify then bracket
    return `[${String(val)}]`;
  };

  // 1) Dimensions Meta (with CreatedMember)
  const dimensionMeta = (Array.isArray(o9Meta) ? o9Meta : [])
    .filter((item) => item && !item.MeasureId && Array.isArray(item.DimensionValues))
    .map((item) => {
      if (!item.DimensionName || !item.Name) return {};
      const dimensionKey = `[${item.DimensionName}].[${item.Name}]`;
      const dv = Array.isArray(item.DimensionValues) ? [...item.DimensionValues] : [];
      const cm = createdMemberMap[toKey(dimensionKey)];
      if (cm) {
        const exists = dv.some(
          (x) => (x?.Name || '').trim().toLowerCase() === (cm.Name || '').trim().toLowerCase()
        );
        if (!exists) {
          dv.push({ Name: cm.Name, MemberIndex: cm.MemberIndex });
          console.log(`Added CreatedMember to Meta: ${dimensionKey} ->`, cm);
        }
      }
      return {
        DimensionName: item.DimensionName,
        Alias: item.Alias,
        Name: item.Name,
        DimensionValues: dv.map((v, idx) => ({
          Name: v.Name,
          MemberIndex: (v.MemberIndex ?? idx),
        })),
      };
    })
    .filter((m) => Object.keys(m).length);

  // 2) DataCells: include all measures present on updatedRow (even when null), with bracket formatting
  const DataCells = [];
  const includedMeasures = [];

  (Array.isArray(o9Meta) ? o9Meta : [])
    .filter((item) => item && item.MeasureId)
    .forEach((item) => {
      if (!Object.prototype.hasOwnProperty.call(updatedRow, item.Name)) return;

      const rawVal = updatedRow[item.Name];
      // Try type coercion first (for numbers/dates/etc). If undefined (e.g., null), we still output "[]".
      const coerced = coerceByTypeOrFormat(item.DataType, item.FormatString, rawVal);
      const valueOut = toBracketValue(coerced !== undefined ? coerced : rawVal);

      DataCells.push({ Alias: item.Alias, Value: valueOut });
      includedMeasures.push({ Name: item.Name, Alias: item.Alias });
    });

  // 3) Measures Meta: include all we added to DataCells
  const measuresMeta = includedMeasures.map((m) => ({ Name: m.Name, Alias: m.Alias }));

  // 4) Final Meta = dimensions + included measures
  const Meta = [...dimensionMeta, ...measuresMeta];

  // 5) ModelDefinition
  const ModelDefinition = {
    RegularMeasures: includedMeasures.map((m) => ({ Name: m.Name })),
    LevelAttributes: dimensionMeta.map((d) => ({
      Axis: 'row',
      Name: d.Name,
      DimensionName: d.DimensionName,
    })),
  };

  // 6) MemberCells (resolve by Name; fallback to CreatedMember)
  const MemberCells = [];
  dimensionMeta.forEach((m) => {
    const key = `[${m.DimensionName}].[${m.Name}]`;
    const cm = createdMemberMap[toKey(key)];

    if (Object.prototype.hasOwnProperty.call(updatedRow, key)) {
      const val = updatedRow[key];
      let memberIndex = null;

      if (val != null && Array.isArray(m.DimensionValues)) {
        const found = m.DimensionValues.find(
          (dv) => (dv?.Name || '').trim().toLowerCase() === String(val).trim().toLowerCase()
        );
        memberIndex = found ? found.MemberIndex : null;
      }
      if (memberIndex === null && cm) memberIndex = cm.MemberIndex;

      MemberCells.push({ Alias: m.Alias, MemberIndex: memberIndex });
    } else if (cm) {
      MemberCells.push({ Alias: m.Alias, MemberIndex: cm.MemberIndex });
    }
  });

  return {
    Meta,
    ModelDefinition,
    UpdatedRows: [{ MemberCells, DataCells }],
    Filters,
  };
};

