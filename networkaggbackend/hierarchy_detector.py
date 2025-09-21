# python
import json, sys
p = r'd:\NetworkAggUI\NAUI\networkaggbackend\data\material_definition_levels.json'
j = json.load(open(p, encoding='utf-8'))

meta = j.get('Meta', [])
# helpers: find meta entries by Alias
def meta_by_alias(a):
    return next((m for m in meta if str(m.get('Alias'))==str(a)), None)

item_meta = meta_by_alias('2')
loc_meta  = meta_by_alias('3')

def name_for(meta_entry, idx):
    try:
        return meta_entry['DimensionValues'][idx]['Name']
    except Exception:
        return f'<missing idx={idx}>'

data = j.get('Data', [])
parents = {}
for i,row in enumerate(data):
    coord = row[0] if row and isinstance(row[0], list) else []
    if len(coord) < 2:
        continue
    level, group = coord[0], coord[1]
    if level == 1:
        item_idx = row[2] if len(row) > 2 else None
        parents[group] = {'row_index': i, 'item_idx': item_idx, 'children': [], 'included': coord[2] if len(coord)>2 else None}
for i,row in enumerate(data):
    coord = row[0] if row and isinstance(row[0], list) else []
    if len(coord) < 2:
        continue
    level, group = coord[0], coord[1]
    if level == 2 and group in parents:
        item_idx = row[2] if len(row) > 2 else None
        # measure value may be in last cell
        last = row[-1]
        if isinstance(last, list): val = last[0]
        else: val = last if last not in (None, "") else coord[2] if len(coord)>2 else None
        parents[group]['children'].append({'row_index': i, 'item_idx': item_idx, 'value': val})

# print summary
for group, info in parents.items():
    pname = name_for(item_meta, info['item_idx']) if item_meta else f'idx:{info["item_idx"]}'
    print(f'Parent group {group} (row {info["row_index"]}) -> {pname}  included={info["included"]}  children={len(info["children"])}')
    for c in info['children']:
        print('  -', name_for(item_meta, c['item_idx']), 'value=', c['value'])
    print()