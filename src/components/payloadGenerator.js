import tenantID from './HomePage';

/**
 * Build payload for "exec" templates or SELECT-style queries.
 * - query: string starting with "exec" or "SELECT"
 */
export const generateGetDataPayload = (query) => {
  if (typeof query !== 'string') {
    throw new Error("Unsupported query format. Query must be a string.");
  }

  const q = query.trim();

  // "exec ..." template (case-insensitive)
  if (/^exec/i.test(q)) {
    return {
      tenantId: tenantID,
      schema: { model: { fields: {} } },
      data: {},
      ibplrules: [{ template: q }],
    };
  }

  // "SELECT ..." (case-insensitive)
  if (/^select/i.test(q)) {
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
        MaxRecordLimit: "2000",
      },
    };

    // Extract Measures (deduped, case-insensitive)
    const measureRegex = /measure\.\[([^\]]+)\]/gi;
    const measureSet = new Set();
    let m;
    while ((m = measureRegex.exec(q)) !== null) {
      const name = (m[1] || '').trim();
      if (name && !measureSet.has(name.toLowerCase())) {
        measureSet.add(name.toLowerCase());
        payload.RegularMeasures.push({ Name: name });
      }
    }

    // Extract Level Attributes (supports optional filters/single member; deduped)
    // Matches:
    //   [Dimension].[Attribute]
    //   [Dimension].[Attribute].filter(#.Name in {"A","B"})
    //   [Dimension].[Attribute].[SingleMember]
    const levelAttributeRegex =
      /\[([^\]]+)\]\.\[([^\]]+)\](?:\.filter\(#\.Name in \{([^\}]+)\}\))?(?:\.\[([^\]]+)\])?/gi;

    const laKey = (dim, name) => `${dim.toLowerCase()}||${name.toLowerCase()}`;
    const laSet = new Set();

    let la;
    while ((la = levelAttributeRegex.exec(q)) !== null) {
      const dimensionName = (la[1] || '').trim();
      const name = (la[2] || '').trim();
      if (!dimensionName || !name) continue;

      const key = laKey(dimensionName, name);
      // Collect filters
      const selectedMembersFilter = la[3]
        ? la[3]
            .split(',')
            .map(s => s.trim().replace(/"/g, ''))
            .filter(Boolean)
        : null;

      const singleSelectedMember = la[4] && la[4].trim() !== '' ? la[4].trim() : null;

      const levelAttribute = {
        Name: name,
        DimensionName: dimensionName,
        Axis: "row",
      };

      if (selectedMembersFilter && selectedMembersFilter.length > 0) {
        levelAttribute.IsFilter = true;
        levelAttribute.AllSelection = false;
        levelAttribute.SelectedMembers = selectedMembersFilter.map(Name => ({ Name }));
      } else if (singleSelectedMember) {
        levelAttribute.IsFilter = true;
        levelAttribute.AllSelection = false;
        levelAttribute.SelectedMembers = [{ Name: singleSelectedMember }];
      }

      // Deduplicate by Dimension+Name
      if (!laSet.has(key)) {
        laSet.add(key);
        payload.LevelAttributes.push(levelAttribute);
      }
    }

    return payload;
  }

  throw new Error("Unsupported query format. Query must start with 'exec' or 'SELECT'.");
};

/**
 * Build a Cell Edit payload from a plain table row object.
 * - o9Meta: array of meta rows for dims and measures
 * - updatedRow: object keyed by "[Dim].[Attr]" and measure names
 * - Filters: optional array of o9 filters
 * - CreatedMember: optional map like { "[Dim].[Attr]": { Name, MemberIndex } } or wrapped { CreatedMember: {...} }
 */
export const generateCellEditPayload = (o9Meta, updatedRow, Filters = [], CreatedMember = {}) => {
  const unwrap = (cm) => (cm && cm.CreatedMember) ? cm.CreatedMember : (cm || {});
  const toKey = (k) => (k || '').trim().toLowerCase();

  const createdMemberMap = Object.fromEntries(
    Object.entries(unwrap(CreatedMember)).map(([k, v]) => [toKey(k), v])
  );

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

  const looksLikeDateFormat = (fmt) =>
    typeof fmt === 'string' && /[yY].*[mM].*[dD]|[dD].*[mM].*[yY]/.test(fmt);

  const looksLikeNumericFormat = (fmt) =>
    typeof fmt === 'string' && /[#0]/.test(fmt);

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

    if (looksLikeDateFormat(formatString)) {
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
    return `[${String(val)}]`;
  };

  // 1) Dimensions Meta (+CreatedMember) — filter valid, build stable structure
  const dimensionMeta = (Array.isArray(o9Meta) ? o9Meta : [])
    .filter((item) => item && !item.MeasureId && item.DimensionName && item.Name && Array.isArray(item.DimensionValues))
    .map((item) => {
      const dimensionKey = `[${item.DimensionName}].[${item.Name}]`;
      const dv = Array.isArray(item.DimensionValues) ? [...item.DimensionValues] : [];
      const cm = createdMemberMap[toKey(dimensionKey)];
      if (cm) {
        const exists = dv.some(
          (x) => toKey(x?.Name) === toKey(cm.Name)
        );
        if (!exists) {
          dv.push({ Name: cm.Name, MemberIndex: cm.MemberIndex });
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
    });

  // 2) DataCells: include all measures present on updatedRow (even when null), with bracket formatting
  const DataCells = [];
  const includedMeasures = [];

  (Array.isArray(o9Meta) ? o9Meta : [])
    .filter((item) => item && item.MeasureId && item.Name && Object.prototype.hasOwnProperty.call(updatedRow || {}, item.Name))
    .forEach((item) => {
      const rawVal = updatedRow[item.Name];
      const coerced = coerceByTypeOrFormat(item.DataType, item.FormatString, rawVal);
      const valueOut = toBracketValue(coerced !== undefined ? coerced : rawVal);

      DataCells.push({ Alias: item.Alias, Value: valueOut });
      includedMeasures.push({ Name: item.Name, Alias: item.Alias });
    });

  // 3) Final Meta = dimensions + included measures
  const Meta = [
    ...dimensionMeta,
    ...includedMeasures.map((m) => ({ Name: m.Name, Alias: m.Alias })),
  ];

  // 4) ModelDefinition
  const ModelDefinition = {
    RegularMeasures: includedMeasures.map((m) => ({ Name: m.Name })),
    LevelAttributes: dimensionMeta.map((d) => ({
      Axis: 'row',
      Name: d.Name,
      DimensionName: d.DimensionName,
    })),
  };

  // 5) MemberCells (resolve by Name; fallback to CreatedMember)
  const MemberCells = [];
  for (const m of dimensionMeta) {
    const key = `[${m.DimensionName}].[${m.Name}]`;
    const cm = createdMemberMap[toKey(key)];

    if (Object.prototype.hasOwnProperty.call(updatedRow || {}, key)) {
      const val = updatedRow[key];
      let memberIndex = null;

      if (val != null && Array.isArray(m.DimensionValues) && m.DimensionValues.length) {
        // Build a fast lookup map once per dimension row
        const lookup = new Map(m.DimensionValues.map(dv => [toKey(dv?.Name), dv.MemberIndex]));
        memberIndex = lookup.get(toKey(String(val))) ?? null;
      }
      if (memberIndex === null && cm) memberIndex = cm.MemberIndex;

      MemberCells.push({ Alias: m.Alias, MemberIndex: memberIndex });
    } else if (cm) {
      MemberCells.push({ Alias: m.Alias, MemberIndex: cm.MemberIndex });
    }
  }

  return {
    Meta,
    ModelDefinition,
    UpdatedRows: [{ MemberCells, DataCells }],
    Filters,
  };
};

