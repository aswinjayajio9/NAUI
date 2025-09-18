from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import os
from typing import Dict, Any
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