#!/usr/bin/env python3
"""
Simple Flask API server for LLM Reports
Provides endpoints to fetch latest reports from MongoDB
"""

from flask import Flask, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# MongoDB connection
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb+srv://vivekchaudhari3718:vivekchaudhari3718@cluster1.9qlun5j.mongodb.net/')
MONGODB_DB = os.getenv('MONGODB_DB', 'k8s_logs')
MONGODB_COLLECTION = os.getenv('MONGODB_COLLECTION', 'reportgenerated')

try:
    client = MongoClient(MONGODB_URI)
    db = client[MONGODB_DB]
    collection = db[MONGODB_COLLECTION]
    # Test connection
    client.admin.command('ping')
    logger.info("✅ Connected to MongoDB")
    mongo_connected = True
except Exception as e:
    logger.error(f"❌ MongoDB connection failed: {e}")
    mongo_connected = False
    collection = None


def serialize_doc(doc):
    """Convert MongoDB document to JSON-serializable format"""
    if isinstance(doc, list):
        return [serialize_doc(item) for item in doc]
    if isinstance(doc, dict):
        result = {}
        for k, v in doc.items():
            if isinstance(v, ObjectId):
                result[k] = str(v)
            elif isinstance(v, datetime):
                result[k] = v.isoformat()
            elif isinstance(v, (dict, list)):
                result[k] = serialize_doc(v)
            else:
                result[k] = v
        return result
    if isinstance(doc, ObjectId):
        return str(doc)
    if isinstance(doc, datetime):
        return doc.isoformat()
    return doc


@app.route('/api/reports/top5', methods=['GET'])
def get_top5_reports():
    """Fetch top 5 latest reports"""
    try:
        if not mongo_connected or collection is None:
            return jsonify({'error': 'Database not connected'}), 500
        
        # Get latest 5 reports sorted by timestamp
        reports = list(collection.find()
                      .sort('_id', -1)
                      .limit(5))
        
        # Serialize for JSON
        reports = [serialize_doc(r) for r in reports]
        
        return jsonify({
            'success': True,
            'count': len(reports),
            'reports': reports
        })
    except Exception as e:
        logger.error(f"Error fetching reports: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/reports/stats', methods=['GET'])
def get_stats():
    """Get report generation statistics"""
    try:
        if not mongo_connected or collection is None:
            return jsonify({'error': 'Database not connected'}), 500
        
        total = collection.count_documents({})
        
        return jsonify({
            'success': True,
            'total_reports': total,
            'last_24h': 0,  # Can add time-based filtering if needed
            'status': 'active'
        })
    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/reports/<report_id>', methods=['GET'])
def get_report_detail(report_id):
    """Fetch a specific report by ID"""
    try:
        if not mongo_connected or collection is None:
            return jsonify({'error': 'Database not connected'}), 500
        
        report = collection.find_one({'_id': ObjectId(report_id)})
        
        if not report:
            return jsonify({'error': 'Report not found'}), 404
        
        report = serialize_doc(report)
        
        return jsonify({
            'success': True,
            'report': report
        })
    except Exception as e:
        logger.error(f"Error fetching report: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'LLM Report API',
        'timestamp': datetime.now().isoformat()
    })


if __name__ == '__main__':
    logger.info("🚀 Starting LLM Report API Server on port 5000")
    app.run(host='0.0.0.0', port=5000, debug=False)
