"""
Core Automation Service with Real-Time Status Tracking
Orchestrates LLM report → Playbook → Execution
"""

from llm_playbook_generator import PlaybookGenerator
from ansible_executor import AnsibleExecutor
from config import ANSIBLE_PLAYBOOKS_DIR, MONGODB_URI, DB_NAME, AUTOMATION_COLLECTION
import logging
from datetime import datetime, timedelta
import time
from threading import Lock

try:
    from pymongo import MongoClient
    from pymongo.errors import ServerSelectionTimeoutError, ConnectionFailure
    MONGO_AVAILABLE = True
except ImportError:
    MONGO_AVAILABLE = False

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger(__name__)

class AutomationService:
    """Orchestrate full automation workflow"""
    
    def __init__(self):
        self.generator = PlaybookGenerator()
        self.executor = AnsibleExecutor(ANSIBLE_PLAYBOOKS_DIR)
        self.db = self._init_db()
        # In-memory status cache for real-time tracking with thread-safe lock
        self.status_cache = {}
        self.cache_lock = Lock()
        # Cleanup old status entries periodically
        self.last_cleanup = datetime.now()
        logger.info("✅ AutomationService initialized")
    
    def _connect_with_retry(self):
        """Connect to MongoDB with exponential backoff retry"""
        max_attempts = 3
        for attempt in range(1, max_attempts + 1):
            try:
                client = MongoClient(
                    MONGODB_URI,
                    maxPoolSize=50,
                    minPoolSize=10,
                    maxIdleTimeMS=45000,
                    serverSelectionTimeoutMS=5000,
                    connectTimeoutMS=10000,
                    retryWrites=True
                )
                client.admin.command('ping')
                return client
            except (ServerSelectionTimeoutError, ConnectionFailure) as e:
                if attempt < max_attempts:
                    wait_time = 2 ** (attempt - 1)  # Exponential backoff: 1s, 2s, 4s
                    logger.warning(f"MongoDB connection failed (attempt {attempt}/{max_attempts}), retrying in {wait_time}s: {e}")
                    time.sleep(wait_time)
                else:
                    raise
    
    def _init_db(self):
        """Initialize MongoDB connection with pooling"""
        if not MONGO_AVAILABLE:
            logger.warning("⚠️ pymongo not installed, skipping DB")
            return None
        
        try:
            client = self._connect_with_retry()
            db = client[DB_NAME][AUTOMATION_COLLECTION]
            logger.info("✅ MongoDB connected with connection pooling (max_pool=50)")
            return db
        except Exception as e:
            logger.warning(f"⚠️ MongoDB connection failed after retries: {e}")
            return None
    
    def get_status(self, chunk_id):
        """Get current status from cache (thread-safe)"""
        with self.cache_lock:
            return self.status_cache.get(chunk_id, None)
    
    def _update_status(self, chunk_id, stage, status, details=""):
        """Update status in cache with timestamp (thread-safe)"""
        # Cleanup old entries if needed
        if (datetime.now() - self.last_cleanup).seconds > 300:  # Every 5 minutes
            self._cleanup_old_status()
            self.last_cleanup = datetime.now()
        
        with self.cache_lock:
            if chunk_id not in self.status_cache:
                self.status_cache[chunk_id] = {
                    "chunk_id": chunk_id,
                    "start_time": datetime.now().isoformat(),
                    "timeline": [],
                    "current_stage": None,
                    "overall_status": "in_progress"
                }
            
            timestamp = datetime.now().isoformat()
            self.status_cache[chunk_id]["timeline"].append({
                "timestamp": timestamp,
                "stage": stage,
                "status": status,
                "details": details
            })
            self.status_cache[chunk_id]["current_stage"] = stage
            
            # Update overall status
            if status == "failed" or status == "error":
                self.status_cache[chunk_id]["overall_status"] = "failed"
            elif status == "success":
                self.status_cache[chunk_id]["overall_status"] = "success"
            
            # Log to console for backend visibility
            emoji = "✅" if status == "success" else "🔄" if status == "in_progress" else "❌"
            logger.info(f"{emoji} [{chunk_id}] {stage}: {status} - {details}")
    
    def _cleanup_old_status(self, hours=24):
        """Clean up status cache entries older than specified hours (thread-safe)"""
        cutoff = datetime.now() - timedelta(hours=hours)
        with self.cache_lock:
            to_delete = []
            for chunk_id, status in self.status_cache.items():
                try:
                    start_time = datetime.fromisoformat(status["start_time"])
                    if start_time < cutoff:
                        to_delete.append(chunk_id)
                except:
                    pass
            
            for chunk_id in to_delete:
                del self.status_cache[chunk_id]
            
            if to_delete:
                logger.info(f"🧹 Cleaned up {len(to_delete)} old status entries")
    
    def automate_chunk(self, chunk_id, report_data, logs=None, pod_name=None):
        """Execute full automation pipeline with logs context and pod targeting"""
        logger.info(f"🚀 STARTING AUTOMATION FOR CHUNK: {chunk_id}")
        logger.info(f"📊 Report Data: {report_data}")
        logger.info(f"📝 Logs Context: {len(logs) if logs else 0} entries")
        logger.info(f"🎯 Target Pod: {pod_name if pod_name else 'Not specified (default: log-generator-54ffbcd85d-95twm)'}")
        
        result = {
            "chunk_id": chunk_id,
            "timestamp": datetime.now().isoformat(),
            "status": "in_progress",
            "timeline": [],
            "stages": {},
            "pod_name": pod_name or "log-generator-54ffbcd85d-95twm"
        }
        
        try:
            # ============ STAGE 1: GENERATE PLAYBOOK ============
            self._update_status(chunk_id, "PLAYBOOK_GENERATION", "in_progress", f"Calling Groq LLM to generate playbook for pod {pod_name or 'default'}...")
            result["timeline"].append({"time": datetime.now().isoformat(), "event": "Playbook generation started"})
            
            logger.info("═" * 60)
            logger.info("📝 STAGE 1: PLAYBOOK GENERATION")
            logger.info(f"   Risk Level: {report_data.get('risk_level', 'Unknown')}")
            logger.info(f"   Root Causes: {report_data.get('root_causes', [])}")
            logger.info(f"   Prevention Steps: {report_data.get('prevention_steps', [])}")
            logger.info(f"   Logs provided: {bool(logs)}")
            logger.info(f"   Target Pod: {pod_name or 'Not specified (default will be used)'}")
            logger.info("═" * 60)
            
            playbook_content = self.generator.generate_playbook(report_data, chunk_id, logs, pod_name=pod_name or "log-generator-54ffbcd85d-95twm")
            
            if not playbook_content:
                self._update_status(chunk_id, "PLAYBOOK_GENERATION", "failed", "LLM returned empty playbook")
                result["status"] = "failed"
                result["error"] = "Failed to generate playbook"
                result["stages"]["playbook_generation"] = "failed"
                self._save_result(result)
                return result
            
            playbook_lines = len(playbook_content.split('\n'))
            self._update_status(chunk_id, "PLAYBOOK_GENERATION", "success", f"Generated {playbook_lines} lines of YAML")
            result["stages"]["playbook_generation"] = "success"
            result["playbook_preview"] = playbook_content[:500]
            logger.info(f"✅ STAGE 1 SUCCESS: {playbook_lines} lines generated")
            logger.info(f"   Preview:\n{playbook_content[:300]}...")
            
            # ============ STAGE 2: SAVE PLAYBOOK ============
            self._update_status(chunk_id, "PLAYBOOK_SAVE", "in_progress", "Writing playbook to disk...")
            result["timeline"].append({"time": datetime.now().isoformat(), "event": "Playbook save started"})
            
            logger.info("═" * 60)
            logger.info("💾 STAGE 2: PLAYBOOK SAVE")
            logger.info("═" * 60)
            
            playbook_path = self.executor.save_playbook(playbook_content, chunk_id)
            if not playbook_path:
                self._update_status(chunk_id, "PLAYBOOK_SAVE", "failed", "Could not write to filesystem")
                result["status"] = "failed"
                result["error"] = "Failed to save playbook"
                result["stages"]["playbook_saved"] = "failed"
                self._save_result(result)
                return result
            
            self._update_status(chunk_id, "PLAYBOOK_SAVE", "success", f"Saved to {playbook_path}")
            result["stages"]["playbook_path"] = playbook_path
            # Extract just the filename for frontend display
            playbook_filename = playbook_path.split('/')[-1] if playbook_path else f"playbook_{chunk_id}.yml"
            result["playbook_filename"] = playbook_filename
            # Also add to cache so frontend can display it
            with self.cache_lock:
                self.status_cache[chunk_id]["playbook_filename"] = playbook_filename
            logger.info(f"✅ STAGE 2 SUCCESS: Saved to {playbook_path}")
            
            # ============ STAGE 3: EXECUTE PLAYBOOK ============
            self._update_status(chunk_id, "PLAYBOOK_EXECUTION", "in_progress", "Running ansible-playbook...")
            result["timeline"].append({"time": datetime.now().isoformat(), "event": "Playbook execution started"})
            
            logger.info("═" * 60)
            logger.info("🚀 STAGE 3: PLAYBOOK EXECUTION")
            logger.info(f"   File: {playbook_path}")
            logger.info("═" * 60)
            
            execution_result = self.executor.execute_playbook(playbook_path)
            result["stages"]["execution"] = dict(execution_result)  # Convert to plain dict for MongoDB
            
            if execution_result.get("status") == "success":
                self._update_status(chunk_id, "PLAYBOOK_EXECUTION", "success", f"Completed with return code {execution_result.get('return_code', 0)}")
                result["status"] = "success"
                logger.info(f"✅ STAGE 3 SUCCESS")
                logger.info(f"   Output: {execution_result.get('output', '')[:300]}")
            else:
                self._update_status(chunk_id, "PLAYBOOK_EXECUTION", "failed", execution_result.get("error", "Unknown error"))
                result["status"] = "failed"
                logger.error(f"❌ STAGE 3 FAILED")
                logger.error(f"   Error: {execution_result.get('error', 'Unknown')}")
            
            # ============ COMPLETION ============
            result["end_time"] = datetime.now().isoformat()
            self._save_result(result)
            
            logger.info("═" * 60)
            logger.info(f"🎯 AUTOMATION COMPLETED: {result['status'].upper()}")
            logger.info("═" * 60)
            
            return result
            
        except Exception as e:
            logger.error(f"❌ CRITICAL ERROR: {str(e)}", exc_info=True)
            self._update_status(chunk_id, "ERROR", "failed", str(e))
            result["status"] = "error"
            result["error"] = str(e)
            result["end_time"] = datetime.now().isoformat()
            self._save_result(result)
            return result
    
    def _save_result(self, result):
        """Save automation result to database"""
        if self.db is not None:
            try:
                # Ensure all values are serializable for MongoDB
                clean_result = self._make_serializable(result)
                self.db.insert_one(clean_result)
                logger.info(f"💾 Result persisted to MongoDB")
            except Exception as e:
                logger.warning(f"⚠️ Failed to save result to DB: {e}", exc_info=True)
    
    def _make_serializable(self, obj):
        """Recursively convert non-serializable objects to dicts"""
        if isinstance(obj, dict):
            return {k: self._make_serializable(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [self._make_serializable(item) for item in obj]
        elif hasattr(obj, '__dict__'):  # Convert objects with __dict__ to dicts
            return self._make_serializable(obj.__dict__)
        else:
            return obj
