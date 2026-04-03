"""
Configuration for LLM Report Generator
"""

import os
from dotenv import load_dotenv

load_dotenv()

# MongoDB
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb+srv://XXXXXX:XXXXXX@XXXXXX.mongodb.net/")
MONGODB_DB = os.getenv("MONGODB_DB", "k8s_logs")
MONGODB_COLLECTION_INPUT = "log_streams"  # Fetch latest chunks from here
MONGODB_COLLECTION_OUTPUT = "reportgenerated"  # Save reports here

# Groq LLM
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "gsk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
GROQ_MODEL = "llama-3.3-70b-versatile"  # ✅ Confirmed available model

# Report settings
REPORT_INTERVAL = 60  # seconds (1 minute)
CHUNKS_TO_ANALYZE = 2  # Latest 2 chunks
OUTPUT_DIR = "./reports"
REPORT_COLLECTION = "llm_reports"
