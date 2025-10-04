import csv

# Small helper to normalize empty/nulls consistently across the module
def _is_null(value):
    if value is None:
        return True
    if isinstance(value, str):
        s = value.strip()
        if s == "":
            return True
        # Treat common null tokens as null (case-insensitive)
        if s.lower() in {"null", "none", "nan", "n/a", "na"}:
            return True
    return False

# Constants
VERSION = "Version.[Version Name]"
LOCATION = "Location.[Location]"
ACTIVITY1 = "Activity1.[Activity1]"
ITEM = "Item.[Item]"
ERP_BOM = "ERP BOM Association"
ERP_BOM_CONSUMED = "ERP BOM Consumed Item Association"


def read_csv(filepath):
    """Read CSV without filtering columns. Leave shaping to build/write steps.

    We intentionally keep all columns here so downstream logic (e.g., ERP BOM
    associations, activity, item, version/location) is available for
    processing. Column pruning (keeping only Item-* and dropping all-null Item
    columns) is performed in write_csv.
    """
    with open(filepath, mode="r", newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        data = list(reader)
        return data or []


def build_bom_bottom_up_sorted(data, max_level=5):
    """Build bottom-up BOM (L1 = leaf, L2 = parent, ...) and sort from highest to lowest level"""
    max_level = max(2, max_level)

    activity_to_parent = {}
    activity_to_children = {}

    for row in data:
        act = row.get(ACTIVITY1, "")
        item = row.get(ITEM, "")

        assoc = str(row.get(ERP_BOM, "")).strip()
        consumed = str(row.get(ERP_BOM_CONSUMED, "")).strip()

        if assoc == "1":
            activity_to_parent[act] = {
                "item": item,
                "version": row.get(VERSION, ""),
                "location": row.get(LOCATION, "")
            }
        if consumed == "1":
            activity_to_children.setdefault(act, []).append(item)

    # Build child → parent mapping
    child_to_parent = {}
    for act, parent in activity_to_parent.items():
        for child in activity_to_children.get(act, []):
            child_to_parent[child] = parent["item"]

    results = []

    # Build path bottom-up
    for leaf in set(child_to_parent.keys()):
        path = [leaf]
        current = leaf
        while len(path) < max_level:
            parent = child_to_parent.get(current)
            if not parent:
                break
            path.append(parent)
            current = parent
        while len(path) < max_level:
            path.append(None)
        row = {VERSION: "", LOCATION: ""}
        for i, val in enumerate(path, 1):
            row[f"Item L{i}"] = val
        results.append(row)

    # Fill version/location from parent if possible
    for row in results:
        leaf_item = row["Item L1"]
        for act, parent in activity_to_parent.items():
            if parent["item"] == child_to_parent.get(leaf_item, leaf_item):
                row[VERSION] = parent["version"]
                row[LOCATION] = parent["location"]
                break

    # Remove duplicates
    seen = set()
    unique_results = []
    for r in results:
        key = tuple(r[f"Item L{i}"] for i in range(1, max_level + 1))
        if key not in seen:
            seen.add(key)
            unique_results.append(r)

    # Sort rows: highest ancestor first
    def sort_key(row):
        # Build tuple from highest (last in path) → lowest (leaf)
        return tuple((row[f"Item L{i}"] or "") for i in range(max_level, 0, -1))

    unique_results.sort(key=sort_key)
    return unique_results


def write_csv(filepath, rows):
    """Write CSV with only Item-* columns and drop all-null Item columns.

    - Keep only columns whose names start with 'Item'.
    - Drop any Item column if all of its values are null/empty across rows.
    - Drop rows where all remaining Item columns are null/empty.
    """
    if not rows:
        return

    # Only keep columns with 'Item' prefix
    item_columns = [col for col in rows[0].keys() if col.startswith("Item")]

    # Drop item columns where all values are empty/null at the column level
    valid_item_columns = []
    for col in item_columns:
        if not all(_is_null(row.get(col, "")) for row in rows):
            valid_item_columns.append(col)

    # Nothing to write if no valid item columns remain
    if not valid_item_columns:
        return

    # Filter each row to only valid item columns and drop fully-empty rows
    filtered_rows = []
    for row in rows:
        filtered_row = {col: row.get(col, "") for col in valid_item_columns}
        if not all(_is_null(filtered_row.get(col, "")) for col in valid_item_columns):
            filtered_rows.append(filtered_row)

    if not filtered_rows:
        return

    with open(filepath, mode="w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=valid_item_columns)
        writer.writeheader()
        writer.writerows(filtered_rows)
# ------------------------------
if __name__ == "__main__":
    input_file = r"D:\NetworkAggUI\NAUI\networkaggbackend\data\needtree.csv"
    output_file = r"D:\NetworkAggUI\NAUI\networkaggbackend\data\outtree.csv"
    data = read_csv(input_file)
    result = build_bom_bottom_up_sorted(data, max_level=8)
    write_csv(output_file, result)

    print(f"Expanded BOM written to {output_file}")
