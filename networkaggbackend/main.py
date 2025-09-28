from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import os
import httpx
import numpy as np
app = FastAPI()

# ✅ Correct CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # you can restrict e.g. ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_FOLDER = r"D:\NetworkAggUI\NAUI\networkaggbackend\data"
DATA_FOLDER_OUT = r"D:\NetworkAggUI\NAUI\networkaggbackend\data_out"

def clean_dataframe(df: pd.DataFrame):
    """
    Replaces infinity, -infinity, and NaN values in a DataFrame with None.
    """
    return df.replace([np.inf, -np.inf, np.nan], None)

# GET endpoint: Read CSV file and return as JSON
@app.get("/read/{filename}")
def read_csv(filename: str):
    filepath = os.path.join(DATA_FOLDER, filename)

    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found")

    try:
        df = pd.read_csv(filepath)
        df = clean_dataframe(df)  # Fix JSON compliance
        return JSONResponse(content=df.to_dict(orient="records"))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/read_json/{filename}")
def read_json(filename: str):
    import json
    filepath = os.path.join(DATA_FOLDER, filename)

    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found")

    try:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        return JSONResponse(content=data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


from fastapi import Request
import io

@app.post("/write/{filename}")
async def write_csv(filename: str, request: Request):
    filepath = os.path.join(DATA_FOLDER_OUT, filename)
    try:
        body = await request.body()
        csv_str = body.decode("utf-8")
        print(csv_str)
        df = pd.read_csv(io.StringIO(csv_str))
        print(df)
        df.to_csv(filepath, index=False)
        return {"status": "success", "file": filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/getData")
async def get_data(request: Request):
    url = "https://mygcppmm.o9solutions.com/api/v2/widget/getdata"
    json_payload = await request.json()

    # forward most headers except those that cause conflicts
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"ApiKey hkj7ja11.v37hrv9jxv6g38n7sp297gz",
        "Accept": "application/json",
    }
    print(json_payload)

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(url, headers=headers, json=json_payload)
            return resp.json()
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@app.post("/getRules")
async def get_rules(request: Request):
    url = "https://mygcppmm.o9solutions.com/api/ibplrules/bindkendomodel?includeMeta=undefined"
    json_payload = await request.json()

    # forward most headers except those that cause conflicts
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"ApiKey hkj7ja11.v37hrv9jxv6g38n7sp297gz",
        "Accept": "application/json",
    }
    print(json_payload)

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(url, headers=headers, json=json_payload)
            return resp.json()
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
@app.post("/updateCellEdit")
async def update_cell_edit(request: Request):
    url = "https://mygcppmm.o9solutions.com/api/v2/widget/update/CellEdit"
    json_payload = await request.json()

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"ApiKey hkj7ja11.v37hrv9jxv6g38n7sp297gz",
        "Accept": "application/json",
    }

    # verify=False only if you're using a self-signed cert on localhost
    async with httpx.AsyncClient(verify=False) as client:
        try:
            resp = await client.post(url, headers=headers, json=json_payload)
            return resp.json()
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))