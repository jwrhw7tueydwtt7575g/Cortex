import sys
sys.path.insert(0, '.')

import time
import json
import os
from datetime import datetime
from bson import ObjectId
from mongodb_handler import MongoDBChunkFetcher
from llm_generator import LLMReportGenerator
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def convert_objectid_to_str(obj):
    """Recursively convert ObjectId to string for JSON serialization"""
    if isinstance(obj, ObjectId):
        return str(obj)
    elif isinstance(obj, dict):
        return {k: convert_objectid_to_str(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_objectid_to_str(item) for item in obj]
    return obj


def ensure_output_dir():
    """Create output directory if it doesn't exist"""
    os.makedirs('./reports', exist_ok=True)


def run_continuous_report_generation(interval=60):
    """
    Run continuous LLM report generation
    Every 60 seconds:
    1. Fetch latest 2 chunks from MongoDB
    2. Extract raw messages
    3. Generate report using Groq LLM
    4. Save to file
    """
    
    ensure_output_dir()
    
    fetcher = MongoDBChunkFetcher()
    generator = LLMReportGenerator()
    
    if not fetcher.connect():
        logger.error("Failed to connect to MongoDB")
        return
    
    logger.info("=" * 70)
    logger.info("🚀 LLM REPORT GENERATOR - CONTINUOUS MODE")
    logger.info("=" * 70)
    logger.info(f"📊 Fetching latest 2 chunks every {interval} seconds")
    logger.info(f"📝 Generating prevention & POA reports using Groq LLM")
    logger.info(f"💾 Saving reports to: ./reports/")
    logger.info("=" * 70)
    
    run_count = 0
    
    try:
        while True:
            run_count += 1
            timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            
            logger.info(f"\n{'='*70}")
            logger.info(f"▶️  RUN #{run_count} - {timestamp}")
            logger.info(f"{'='*70}\n")
            
            try:
                # 1️⃣ Fetch latest 2 chunks
                logger.info("📥 Fetching latest 2 chunks from MongoDB...")
                chunks = fetcher.get_latest_chunks(limit=2)
                
                if not chunks or len(chunks) == 0:
                    logger.warning("⚠️  No chunks found in MongoDB")
                    time.sleep(interval)
                    continue
                
                logger.info(f"✅ Retrieved {len(chunks)} chunks")
                
                # 2️⃣ Process each chunk
                for idx, chunk in enumerate(chunks, 1):
                    chunk_id = chunk.get('_id', f'chunk_{idx}')
                    
                    logger.info(f"\n📍 Processing Chunk {idx}: {chunk_id}")
                    
                    # Extract raw messages
                    messages = fetcher.extract_raw_messages([chunk])
                    
                    if not messages:
                        logger.warning(f"⚠️  No messages in chunk {chunk_id}")
                        continue
                    
                    # 3️⃣ Generate report using Groq LLM
                    logger.info(f"🤖 Generating LLM report ({len(messages)} messages)...")
                    report_data = generator.generate_report(chunk_id, messages)
                    
                    if report_data:
                        # 4️⃣ Save report to MongoDB
                        mongo_id = fetcher.save_report(report_data)
                        
                        # 5️⃣ Also save to file
                        report_file = f"./reports/report_{timestamp.replace(':', '-').replace(' ', '_')}_{idx}.json"
                        
                        # Convert all ObjectIds to strings
                        clean_data = convert_objectid_to_str(report_data)
                        
                        with open(report_file, 'w') as f:
                            json.dump(clean_data, f, indent=2)
                        
                        logger.info(f"✅ Report saved: {report_file}")
                        
                        # Display report summary
                        report = report_data.get('report', {})
                        logger.info(f"\n📋 REPORT SUMMARY:")
                        logger.info(f"   Priority: {report.get('priority_level', 'Unknown')}")
                        logger.info(f"   Root Cause: {report.get('root_cause', 'N/A')[:100]}...")
                        logger.info(f"   Prevention Steps: {len(report.get('prevention_steps', []))} items")
                        logger.info(f"   Actions: {len(report.get('point_of_action', []))} items")
                    else:
                        logger.error(f"❌ Failed to generate report for chunk {chunk_id}")
                
                logger.info(f"\n⏳ Next report generation in {interval} seconds...")
                
            except Exception as e:
                logger.error(f"❌ Error in report generation cycle: {e}", exc_info=True)
                logger.info(f"⏳ Retrying in {interval} seconds...")
            
            # Wait for next cycle
            time.sleep(interval)
    
    except KeyboardInterrupt:
        logger.info("\n\n🛑 Stopping LLM Report Generator...")
    
    finally:
        fetcher.disconnect()
        logger.info("✅ Report Generator stopped")


if __name__ == "__main__":
    run_continuous_report_generation(interval=60)  # 1 minute
