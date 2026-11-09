
from fastapi import FastAPI

app = FastAPI(
    title="WondersMap AI API",
    description="Backend API for the bilingual AI travel planner.",
    version="0.1.0"
)


@app.get("/")
def home():
    return {
        "message": "Welcome to WondersMap AI!",
        "supported_languages": ["en", "ar"]
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "WondersMap AI Backend"
    }
