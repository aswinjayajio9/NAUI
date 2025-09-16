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


# POST endpoint: Write JSON to CSV file
@app.post("/write/{filename}")
def write_csv(filename: str, data: Dict[str, Any]):
    filepath = os.path.join(DATA_FOLDER, filename)

    try:
        # Convert JSON to DataFrame
        print(data)
        df = pd.DataFrame(data)
        df.to_csv(filepath, index=False)
        return {"status": "success", "file": filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
