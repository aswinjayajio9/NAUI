import pandas as pd

# First table data
table1_data = [
    ["ERP", "CVW", "NA", 500, 2000, 100, 200, 600, 2500, "25 Errors, 0 Warnings", "15th July 08:00"],
    ["OP", "CVW", "ERP", 400, 2400, 200, 240, 400, 2800, "0 Errors, 0 Warnings", "15th July 20:00"],
    ["MP", "Version 2", "OP", 325, 1490, 60, 190, 380, 1960, "16 Errors, 0 Warnings", "1st June 20:01"],
    ["S&OP", "CVW", "OP", 240, 1440, 95, 200, 300, 1740, "12 Errors, 0 Warnings", "1st June 20:01"],
    ["LRP", "CVW", "MP", 72, 432, 14, 43, 86, 575, "0 Errors, 0 Warnings", "28th March 20:02"]
]

table1_columns = [
    "Network", "Version", "Base", "No# BOMs", "No# Routings", "No# FQNs", "No# SFQNs",
    "No# RFMs", "No# Resources", "Network Validated", "Last NW Run"
]

df1 = pd.DataFrame(table1_data, columns=table1_columns)

# Second table data
table2_data = [
    ["Error", "Manufacturing Hanging Node", "LRP", "Hanging Resource Node", "PACK_KEG_1_BREWERY NORTH", "Capacity is present but the Association is null"],
    ["Warning", "Out of Range", "MP", "Manufacturing Min LotSize Outside Range", "DILUTE_1_BREWERY NORTH", "Breached MFG Min LotSize Threshold Min"],
    ["Warning", "Out of Range", "MP", "Procurement Lead Time Outside Range", "RM2_BREWERY NORTH", "Breached PROC Lead Time Threshold Min"],
    ["Warning", "Out of Range", "MP", "BOILER Efficacy Outside Horizon", "Beer_DCI", "Breached BOIL Efficacy Threshold Max"],
    ["Warning", "Out of Range", "MP", "Manufacturing Lead Time Outside Range", "PACK_CAN_1_BREWERY SOUTH", "Breached MFG Routing Lead Time Threshold Min"]
]

table2_columns = ["Type", "Exception", "Network", "Group", "Node", "Reason"]

df2 = pd.DataFrame(table2_data, columns=table2_columns)

# Save both tables as CSV
file1 = r"D:\NetworkAggUI\NAUI\networkaggbackend\data\network_summary.csv"
file2 = r"D:\NetworkAggUI\NAUI\networkaggbackend\data\network_violations.csv"

df1.to_csv(file1, index=False)
df2.to_csv(file2, index=False)


