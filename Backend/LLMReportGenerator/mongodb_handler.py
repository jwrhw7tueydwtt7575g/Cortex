"""
MongoDB handler for LLM Report Generator
Fetches latest chunks and saves reports to database
"""

from pymongo import MongoClient
from config import MONGODB_URI, MONGODB_DB, MONGODB_COLLECTION_INPUT, MONGODB_COLLECTION_OUTPUT
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MongoDBChunkFetcher:
    """Fetch log chunks from MongoDB and save reports"""
    
    def __init__(self):
        self.client = None
        self.db = None
        self.collection = None
        self.report_collection = None
    
    def connect(self):
        """Connect to MongoDB"""
        try:
            self.client = MongoClient(MONGODB_URI)
            self.db = self.client[MONGODB_DB]
            self.collection = self.db[MONGODB_COLLECTION_INPUT]
            self.report_collection = self.db[MONGODB_COLLECTION_OUTPUT]
            
            # Test connection
            self.client.admin.command('ping')
            logger.info("✅ Connected to MongoDB")
            return True
        except Exception as e:
            logger.error(f"❌ MongoDB connection error: {e}")
            return False
    
    def get_latest_chunks(self, limit=2):
        """Get latest N chunks with raw messages"""
        try:
            chunks = list(
                self.collection.find()
                .sort('_id', -1)
                .limit(limit)
            )
            
            logger.info(f"✅ Fetched {len(chunks)} latest chunks")
            return chunks[::-1]  # Return in ascending order
        
        except Exception as e:
            logger.error(f"❌ Error fetching chunks: {e}")
            return []
    
    def extract_raw_messages(self, chunks):
        """Extract raw messages from chunks"""
        all_messages = []
        
        for chunk in chunks:
            if 'raw_logs' in chunk:
                messages = chunk['raw_logs']
                if isinstance(messages, list):
                    all_messages.extend(messages)
                else:
                    all_messages.append(messages)
            
            elif 'logs' in chunk:
                messages = chunk['logs']
                if isinstance(messages, list):
                    all_messages.extend(messages)
                else:
                    all_messages.append(messages)
        
        logger.info(f"✅ Extracted {len(all_messages)} raw messages")
        return all_messages
    
    def disconnect(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
    
    def save_report(self, report_data):
        """Save generated report to MongoDB"""
        try:
            result = self.report_collection.insert_one(report_data)
            logger.info(f"✅ Report saved to MongoDB (ID: {result.inserted_id})")
            return result.inserted_id
        except Exception as e:
            logger.error(f"❌ Error saving report: {e}")
            return None
