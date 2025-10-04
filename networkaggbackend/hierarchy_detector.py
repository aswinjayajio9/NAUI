import csv

# Constants
VERSION = "Version.[Version Name]"
LOCATION = "Location.[Location]"
ACTIVITY1 = "Activity1.[Activity1]"
ITEM = "Item.[Item]"
ERP_BOM = "ERP BOM Association"
ERP_BOM_CONSUMED = "ERP BOM Consumed Item Association"


def read_csv(filepath):
    with open(filepath, mode="r", newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        return list(reader)


def build_bom_bottom_up_sorted(data, max_level=5):
    """Build bottom-up BOM (L1 = leaf, L2 = parent, ...) and sort from highest to lowest level"""
    max_level = max(2, max_level)

    activity_to_parent = {}
    activity_to_children = {}

    for row in data:
        act = row[ACTIVITY1]
        item = row[ITEM]

        assoc = str(row.get(ERP_BOM, "")).strip()
        consumed = str(row.get(ERP_BOM_CONSUMED, "")).strip()

        if assoc == "1":
            activity_to_parent[act] = {
                "item": item,
                "version": row[VERSION],
                "location": row[LOCATION]
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
    if not rows:
        return
    # Dynamic columns
    fieldnames = set()
    for row in rows:
        fieldnames.update(row.keys())
    fieldnames = sorted(fieldnames)
    with open(filepath, mode="w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


# ------------------------------
# Example usage
# ------------------------------
if __name__ == "__main__":
    input_file = r"D:\NetworkAggUI\NAUI\networkaggbackend\data\needtree.csv"
    output_file = r"D:\NetworkAggUI\NAUI\networkaggbackend\data\outtree.csv"

    data = read_csv(input_file)
    result = build_bom_bottom_up_sorted(data, max_level=8)
    write_csv(output_file, result)

    print(f"Expanded BOM written to {output_file}")
