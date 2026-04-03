"""
Automation API Server
Flask API for triggering and monitoring automations
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from automation_service import AutomationService
from config import API_HOST, API_PORT
import logging
import threading

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
# Enable CORS for all routes
CORS(app, resources={r"/api/*": {"origins": "*", "methods": ["GET", "POST", "OPTIONS"]}})
service = AutomationService()

@app.route('/api/test-automation', methods=['POST', 'OPTIONS'])
def test_automation():
    """Test the full automation flow with debug output and pod targeting"""
    if request.method == 'OPTIONS':
        return '', 204
    
    logger.info("🧪 TEST AUTOMATION ENDPOINT CALLED")
    
    pod_name = "log-generator-54ffbcd85d-95twm"  # Hardcoded test pod
    
    test_data = {
        "chunk_id": "test_chunk_debug",
        "report": {
            "risk_level": "High",
            "root_causes": ["CPU spike", "Memory leak"],
            "prevention_steps": ["Scale pods", "Update limits"],
            "immediate_actions": ["Restart pod"],
            "summary": "Test issue for debugging"
        },
        "logs": ["CPU usage 95%", "Memory usage 89%", "Pod restart triggered"]
    }
    
    try:
        # Test Groq connection with pod targeting
        logger.info(f"📡 Testing Groq LLM for pod: {pod_name}...")
        playbook = service.generator.generate_playbook(
            test_data["report"], 
            test_data["chunk_id"],
            test_data["logs"],
            pod_name=pod_name
        )
        
        if not playbook:
            logger.error("❌ Playbook generation returned None")
            return jsonify({
                "status": "failed",
                "error": "Playbook generation returned None",
                "details": "Check Groq API key and network connectivity"
            }), 500
        
        logger.info(f"✅ Playbook generated for pod {pod_name}: {len(playbook)} bytes")
        
        # Test save
        path = service.executor.save_playbook(playbook, test_data["chunk_id"])
        if not path:
            logger.error("❌ Failed to save playbook")
            return jsonify({
                "status": "failed",
                "error": "Failed to save playbook",
                "playbook_generated": True,
                "playbook_size": len(playbook)
            }), 500
        
        logger.info(f"✅ Playbook saved to {path}")
        
        return jsonify({
            "status": "success",
            "message": "Test automation successful",
            "playbook_generated": True,
            "playbook_path": path,
            "playbook_preview": playbook[:300],
            "playbook_size": len(playbook),
            "playbook_lines": len(playbook.split('\n'))
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Test failed: {str(e)}", exc_info=True)
        return jsonify({
            "status": "error",
            "error": str(e),
            "type": type(e).__name__
        }), 500

@app.route('/api/automate', methods=['POST', 'OPTIONS'])
def automate():
    """Trigger automation for a chunk with logs context, pod targeting, and status tracking"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.json
        chunk_id = data.get('chunk_id')
        report_data = data.get('report', {})
        logs = data.get('logs', None)
        pod_name = data.get('pod_name', 'log-generator-54ffbcd85d-95twm')  # Default pod
        
        if not chunk_id:
            return jsonify({"error": "chunk_id required"}), 400
        
        logger.info(f"📨 AUTOMATION REQUEST RECEIVED")
        logger.info(f"   Chunk ID: {chunk_id}")
        logger.info(f"   Report: {report_data}")
        logger.info(f"   Logs: {len(logs) if logs else 0} entries")
        logger.info(f"   Target Pod: {pod_name}")
        
        # Update cache with initial status
        service._update_status(chunk_id, "REQUEST_RECEIVED", "success", f"Automation request accepted for pod {pod_name}")
        
        # Run in background thread
        def run_automation():
            service.automate_chunk(chunk_id, report_data, logs, pod_name=pod_name)
        
        thread = threading.Thread(target=run_automation, daemon=True)
        thread.start()
        
        return jsonify({
            "status": "accepted",
            "chunk_id": chunk_id,
            "pod_name": pod_name,
            "message": "Automation pipeline initiated",
            "status_url": f"/api/automation/status/{chunk_id}"
        }), 202
        
    except Exception as e:
        logger.error(f"❌ API Error: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500

@app.route('/api/automation/status/<chunk_id>', methods=['GET', 'OPTIONS'])
def get_status(chunk_id):
    """Get real-time status and timeline of automation"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        # First check in-memory cache for real-time status
        cache_status = service.get_status(chunk_id)
        if cache_status is not None:
            return jsonify({
                "source": "cache",
                "chunk_id": chunk_id,
                **cache_status
            }), 200
        
        # Fall back to MongoDB if available
        if service.db is not None:
            doc = service.db.find_one(
                {"chunk_id": chunk_id},
                sort=[("timestamp", -1)]
            )
            if doc:
                doc['_id'] = str(doc['_id'])
                doc['source'] = 'database'
                return jsonify(doc), 200
        
        return jsonify({"error": "No record found", "chunk_id": chunk_id}), 404
    except Exception as e:
        logger.error(f"❌ Status check error: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500

@app.route('/api/automation/health', methods=['GET', 'OPTIONS'])
def health():
    """Health check endpoint"""
    if request.method == 'OPTIONS':
        return '', 204
    
    return jsonify({
        "status": "healthy",
        "service": "Ansible Automation",
        "version": "1.0.0",
        "active_automations": len(service.status_cache)
    }), 200

if __name__ == '__main__':
    logger.info(f"🚀 Starting Ansible Automation API")
    logger.info(f"📡 Listening on {API_HOST}:{API_PORT}")
    app.run(host=API_HOST, port=API_PORT, debug=False, threaded=True)
