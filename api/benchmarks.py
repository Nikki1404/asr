from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from sqlalchemy.orm import Session
import pandas as pd
import io
from typing import List
from database import SessionLocal
from schemas import FileUploadResponse
import json

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post(
    "/upload", 
    response_model=FileUploadResponse,
    summary="Upload benchmark Excel file",
    description="Upload and process an Excel file containing ASR benchmark data",
    response_description="Processed benchmark data ready for analysis",
    responses={
        200: {"description": "File processed successfully"},
        400: {"description": "Invalid file format or missing required columns"},
        500: {"description": "Server error during file processing"}
    },
    tags=["Benchmarks"]
)
async def upload_benchmark_file(
    file: UploadFile = File(
        ..., 
        description="Excel file (.xlsx or .xls) containing benchmark data",
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
):
    """
    Upload and process an Excel file containing ASR benchmark data.
    
    **Required Excel columns:**
    - Audio File Name: Name of the audio file tested
    - Audio Length: Duration of audio in seconds
    - Model: Name of the ASR model used
    - Ground_truth: Correct transcription text
    - Transcription: Model's transcription output
    - WER Score: Word Error Rate as a decimal (0.0 to 1.0)
    - Inference time (in sec): Processing time in seconds
    
    **File Requirements:**
    - Format: Excel (.xlsx or .xls)
    - Size: Maximum 50MB
    - Structure: First row must contain column headers
    
    **Returns:**
    - Processed data array ready for dashboard analysis
    - Summary message with processing statistics
    
    **Errors:**
    - 400: Invalid file format or missing required columns
    - 400: Invalid data types in rows
    - 500: Server processing error
    """
    
    # Validate file type
    if not file.filename or not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="File must be an Excel file (.xlsx or .xls)")
    
    try:
        # Read the uploaded file
        contents = await file.read()
        
        # Parse Excel file using pandas
        df = pd.read_excel(io.BytesIO(contents))
        
        # Validate required columns
        required_columns = [
            'Audio File Name', 'Audio Length', 'Model', 
            'Ground_truth', 'Transcription', 'WER Score', 
            'Inference time (in sec)'
        ]
        
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise HTTPException(
                status_code=400, 
                detail=f"Missing required columns: {', '.join(missing_columns)}"
            )
        
        # Convert DataFrame to list of dictionaries
        data = df.to_dict('records')
        
        # Clean and validate data
        processed_data = []
        for i, row in enumerate(data):
            try:
                processed_row = {
                    'Audio File Name': str(row.get('Audio File Name', '')),
                    'Audio Length': float(row.get('Audio Length', 0)),
                    'Model': str(row.get('Model', '')),
                    'Ground_truth': str(row.get('Ground_truth', '')),
                    'Transcription': str(row.get('Transcription', '')),
                    'WER Score': float(row.get('WER Score', 0)),
                    'Inference time (in sec)': float(row.get('Inference time (in sec)', 0))
                }
                processed_data.append(processed_row)
            except (ValueError, TypeError) as e:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Invalid data in row {i+2}: {str(e)}"
                )
        
        if not processed_data:
            raise HTTPException(status_code=400, detail="No valid data found in the file")
        
        return FileUploadResponse(
            data=processed_data,
            message=f"Successfully processed {len(processed_data)} rows from {file.filename}"
        )
        
    except pd.errors.EmptyDataError:
        raise HTTPException(status_code=400, detail="The uploaded file is empty")
    except pd.errors.ParserError as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse the Excel file: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred while processing the file: {str(e)}")
    finally:
        await file.close()




