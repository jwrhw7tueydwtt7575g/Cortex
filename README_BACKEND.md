# 🔧 Cortex - Backend Services Documentation

**Cortex** is a sophisticated Kubernetes monitoring and automation platform that continuously analyzes pod logs, detects anomalies, generates prevention reports, and automatically executes remediation playbooks.

## 📊 Backend Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CORTEX BACKEND PIPELINE                          │
└─────────────────────────────────────────────────────────────────────────┘

                   ┌──────────────────────────┐
                   │  Kubernetes Log Stream   │
                   │  (500+ logs/min)         │
                   └────────────┬─────────────┘
                                │
                   ┌────────────▼─────────────┐
                   │  Log Parser & Segregator │
                   │  (Chunks of 50 logs)     │
                   └────────────┬─────────────┘
                                │
                   ┌────────────▼─────────────┐
                   │   MongoDB Storage        │
                   │   (Raw log chunks)       │
                   └────────────┬─────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
   ┌────────────▼────────┐ ┌───▼──────────┐ ┌──▼─────────────┐
   │ Anomaly Detection   │ │ Forecasting  │ │ Dash Dashboard │
   │ (Isolation Forest)  │ │ (Prophet)    │ │ (Auto-refresh) │
   │ Every 30 seconds    │ │ Trends       │ │ Visualization  │
   └────────────┬────────┘ └──────────────┘ └────────────────┘
                │
   ┌────────────▼──────────────────┐
   │ LLM Report Generator (Groq)   │
   │ Prevention + Immediate Actions│
   │ API: localhost:5000           │
   └────────────┬──────────────────┘
                │
   ┌────────────▼──────────────────┐
   │ Ansible Automation Service    │
   │ Playbook Generation & Execute │
   │ API: localhost:5001           │
   └───────────────────────────────┘
                │
   ┌────────────▼──────────────────┐
   │ Prometheus + Grafana          │
   │ Metrics & Visualization       │
   │ localhost:4000, 9090          │
   └───────────────────────────────┘
```

## 🔌 Backend Services

### 1️⃣ **Log Parser & Segregator** 
📁 Location: `Backend/log-parse-segregator/`

**Purpose**: Streams logs from Kubernetes and organizes them into chunks
- Collects logs from K8s pods in real-time
- Groups logs into chunks of 50 logs
- Stores chunks in MongoDB with metadata
- Continuous streaming (24/7)

**Key Files**:
- `stream_parser.py` - Main streaming logic
- `categorizer.py` - Log categorization
- `log_parser.py` - Parsing logic
- `mongodb_handler.py` - Database operations
- `config.py` - Configuration

**API Endpoints**: None (background service only)

**Setup**:
```bash
cd Backend/log-parse-segregator
pip install -r requirements.txt
python3 stream_parser.py
```

---

### 2️⃣ **ML Anomaly Detection Pipeline**
📁 Location: `Backend/AnomalyDetection/`

**Purpose**: Analyzes log chunks and detects anomalies
- Reads log chunks from MongoDB every 30 seconds
- Extracts 16 features (CPU, memory, latency, errors, etc.)
- Uses Isolation Forest for anomaly detection
- Generates anomaly detection results
- Tracks trends with Prophet forecasting
- Stores results in MongoDB

**Key Files**:
- `main.py` - ML pipeline orchestrator
- `model.py` - Isolation Forest model
- `data_extractor.py` - Feature extraction from logs
- `prophet_forecaster.py` - Time-series forecasting
- `mlflow_tracker.py` - ML experiment tracking
- `config.py` - Configuration (regex patterns, model params)
- `dash_dashboard.py` - Interactive dashboard

**ML Process**:
```
Raw Logs → Regex Extraction → 16 Features → Isolation Forest → Anomalies
                                            ↓
                                    Prophet Forecasting → Trends
```

**Feature List** (extracted from logs):
1. `latency` - Response time in ms
2. `db_query_time` - Database query duration
3. `cpu_usage` - CPU percentage
4. `memory_usage` - Memory percentage
5. `gc_time` - Garbage collection time
6. `queue_depth` - Pending requests
7. `request_rate` - Requests per minute
8. `timeout_count` - Timeout errors
9. `error_rate` - Error percentage
10. Plus 6 more time-series features

**Setup**:
```bash
cd Backend/AnomalyDetection
pip install -r requirements.txt
python3 main.py  # Start ML pipeline (polling every 30s)
python3 dash_dashboard.py  # Start Dash dashboard on 8050
```

**Dashboard**: http://localhost:8050 (auto-refreshes every 30 seconds)

---

### 3️⃣ **LLM Report Generator**
📁 Location: `Backend/LLMReportGenerator/`

**Purpose**: Converts anomalies into prevention reports using LLM
- Reads anomaly detection results
- Calls Groq LLM API to generate prevention strategies
- Creates structured reports with:
  - Risk level (Low/Medium/High)
  - Root causes analysis
  - Prevention steps
  - Immediate actions
- Stores reports in MongoDB
- Exposes REST API for frontend

**Key Files**:
- `api_server.py` - Flask API server
- `llm_generator.py` - LLM integration with Groq
- `mongodb_handler.py` - Report storage
- `main.py` - Main orchestrator
- `config.py` - Configuration

**API Endpoints**:
```bash
# Get top 5 latest reports
GET http://localhost:5000/api/reports/top5

# Get report by chunk ID
GET http://localhost:5000/api/reports/<chunk_id>

# Get logs for a chunk (context)
GET http://localhost:5000/api/logs/<chunk_id>

# Health check
GET http://localhost:5000/api/health
```

**Report Structure**:
```json
{
  "chunk_id": "69c6abaf167f...",
  "timestamp": "2026-03-27T09:39:54Z",
  "risk_level": "High",
  "root_causes": [
    "Pod OOMKilled after 5 hours",
    "Memory leak in application"
  ],
  "prevention_steps": [
    "Increase memory limit to 512Mi",
    "Enable memory profiling",
    "Add monitoring alerts"
  ],
  "immediate_actions": [
    "Restart pod immediately",
    "Investigate memory logs"
  ]
}
```

**Setup**:
```bash
cd Backend/LLMReportGenerator
pip install -r requirements.txt
export GROQ_API_KEY="gsk_..."  # Groq API key
python3 api_server.py  # Runs on port 5000
```

**Environment Variables**:
- `GROQ_API_KEY` - Groq LLM API key (required)
- `MONGODB_URI` - MongoDB connection string
- `MONGODB_DB` - Database name (default: k8s_logs)

---

### 4️⃣ **Ansible Automation Service**
📁 Location: `Backend/AnsibleAutomation/`

**Purpose**: Generates and executes Ansible playbooks for remediation
- Receives reports + logs from frontend
- Uses LLM to generate Ansible playbook YAML
- Saves playbook to disk
- Executes playbook using `ansible-playbook`
- Tracks execution status and results
- Stores results in MongoDB
- Exposes REST API with real-time status polling

**Key Files**:
- `api_server.py` - Flask API server
- `automation_service.py` - Main orchestrator (3-stage pipeline)
- `llm_playbook_generator.py` - LLM → Ansible YAML conversion
- `ansible_executor.py` - Playbook execution engine
- `config.py` - Configuration

**3-Stage Automation Pipeline**:
```
Stage 1: PLAYBOOK_GENERATION
├─ Input: report + logs
├─ LLM Prompt: Risk level, root causes, prevention steps
└─ Output: Ansible YAML playbook

Stage 2: PLAYBOOK_SAVE
├─ Write playbook to ./playbooks/playbook_<chunk_id>.yml
└─ Validate file creation

Stage 3: PLAYBOOK_EXECUTION
├─ Run: ansible-playbook playbook_*.yml
├─ Capture: stdout, stderr, return_code
└─ Store results in MongoDB
```

**API Endpoints**:
```bash
# Trigger automation (returns 202 Accepted)
POST http://localhost:5001/api/automate
Content-Type: application/json
{
  "chunk_id": "69c6abaf167f",
  "report": { "risk_level": "High", ... },
  "logs": ["log1", "log2", ...]
}

# Get real-time automation status
GET http://localhost:5001/api/automation/status/<chunk_id>

# Get complete automation timeline with timestamps
GET http://localhost:5001/api/automation/timeline/<chunk_id>

# Health check
GET http://localhost:5001/api/automation/health
```

**Status Response**:
```json
{
  "source": "cache",
  "chunk_id": "chunk_123",
  "start_time": "2026-04-02T14:23:15.123Z",
  "overall_status": "in_progress",
  "current_stage": "PLAYBOOK_EXECUTION",
  "timeline": [
    {
      "timestamp": "2026-04-02T14:23:15.132Z",
      "stage": "PLAYBOOK_GENERATION",
      "status": "success",
      "details": "Generated 45 lines of YAML"
    }
  ]
}
```

**Setup**:
```bash
cd Backend/AnsibleAutomation
pip install -r requirements.txt
export GROQ_API_KEY="gsk_..."  # Groq API key
export ANSIBLE_PLAYBOOKS_DIR="./playbooks"
python3 api_server.py  # Runs on port 5001
```

**Environment Variables**:
- `GROQ_API_KEY` - Groq LLM API key
- `MONGODB_URI` - MongoDB connection string
- `ANSIBLE_PLAYBOOKS_DIR` - Directory for generated playbooks (default: ./playbooks)
- `API_PORT` - Port for API server (default: 5001)

---

## 🚀 Starting All Backend Services

### Option 1: Use Main run.sh (Recommended)
```bash
cd /home/vivek/Desktop/Ai-Agent/Tesseract26
bash run.sh
```

This starts all services in background:
- Log Parser (port: streaming)
- ML Pipeline (port: 8050 dashboard)
- LLM Report Generator (port: 5000)
- Ansible Automation (port: 5001)
- Prometheus (port: 9090)
- Grafana (port: 4000)

### Option 2: Start Individually
```bash
# Terminal 1: Log Parser
cd Backend/log-parse-segregator
python3 stream_parser.py

# Terminal 2: ML Pipeline
cd Backend/AnomalyDetection
python3 main.py

# Terminal 3: ML Dashboard
cd Backend/AnomalyDetection
python3 dash_dashboard.py

# Terminal 4: LLM Reports API
cd Backend/LLMReportGenerator
export GROQ_API_KEY="gsk_..."
python3 api_server.py

# Terminal 5: Ansible Automation API
cd Backend/AnsibleAutomation
export GROQ_API_KEY="gsk_..."
python3 api_server.py
```

---

## 📁 MongoDB Collections

### Collections Used:
- `logs` - Raw log chunks (50 logs per chunk)
- `anomaly_detection_results` - Detected anomalies
- `reportgenerated` - LLM-generated prevention reports
- `automation_runs` - Completed automation execution records

### Collection Schema:

**logs**:
```json
{
  "_id": ObjectId,
  "chunk_id": "69c6abaf167f...",
  "timestamp": ISODate,
  "logs": ["log1", "log2", ...],
  "source": "stream_parser"
}
```

**anomaly_detection_results**:
```json
{
  "_id": ObjectId,
  "chunk_id": "69c6abaf167f",
  "timestamp": ISODate,
  "anomaly_score": 0.87,
  "is_anomaly": true,
  "features": { ... },
  "ml_model": "isolation_forest"
}
```

**reportgenerated**:
```json
{
  "_id": ObjectId,
  "chunk_id": "69c6abaf167f",
  "timestamp": ISODate,
  "risk_level": "High",
  "root_causes": [...],
  "prevention_steps": [...],
  "immediate_actions": [...]
}
```

**automation_runs**:
```json
{
  "_id": ObjectId,
  "chunk_id": "69c6abaf167f",
  "timestamp": ISODate,
  "status": "success",
  "stages": {
    "playbook_generation": "success",
    "playbook_save": "success",
    "playbook_execution": {
      "status": "success",
      "return_code": 0,
      "stdout": "...",
      "stderr": ""
    }
  }
}
```

---

## 🔍 Monitoring & Debugging

### Check Service Health
```bash
# Log Parser - check logs
tail -f Backend/log-parse-segregator/stream_parser.log

# ML Pipeline - check logs
tail -f Backend/AnomalyDetection/ml_pipeline.log

# LLM Reports - check logs
tail -f Backend/LLMReportGenerator/llm_reports_api.log

# Automation - check logs
tail -f Backend/AnsibleAutomation/automation_api.log
```

### View Real-Time Status
```bash
# Check if all APIs are running
curl -s http://localhost:5000/api/health | jq .
curl -s http://localhost:5001/api/automation/health | jq .

# Get latest reports
curl -s http://localhost:5000/api/reports/top5 | jq .

# Check automation status
curl -s http://localhost:5001/api/automation/status/chunk_123 | jq .
```

### View Generated Playbooks
```bash
ls -la Backend/AnsibleAutomation/playbooks/
cat Backend/AnsibleAutomation/playbooks/playbook_*.yml
```

---

## ⚙️ Configuration

### Environment Variables Required:
```bash
# Groq LLM API (for reports and playbook generation)
export GROQ_API_KEY="gsk_your_api_key_here"

# MongoDB (optional - defaults provided)
export MONGODB_URI="mongodb+srv://user:password@cluster.mongodb.net/"
export MONGODB_DB="k8s_logs"

# Optional service ports
export LLM_API_PORT=5000
export AUTOMATION_API_PORT=5001
export DASH_PORT=8050
```

### Service Ports:
| Service | Port | Purpose |
|---------|------|---------|
| Stream Parser | N/A | Streaming logs to MongoDB |
| ML Pipeline | N/A | Background polling |
| Dash Dashboard | 8050 | ML metrics visualization |
| LLM Reports API | 5000 | Report generation REST API |
| Ansible Automation API | 5001 | Playbook execution REST API |
| Prometheus | 9090 | Metrics collection |
| Grafana | 4000 | Dashboard visualization |

---

## 🐛 Troubleshooting

### Issue: "GROQ_API_KEY not found"
**Solution**:
```bash
export GROQ_API_KEY="gsk_..."
# Verify it's set
echo $GROQ_API_KEY
```

### Issue: MongoDB Connection Failed
**Solution**:
```bash
# Check MongoDB connection string in config files
grep MONGODB_URI Backend/*/config.py

# Test connection manually
python3 -c "from pymongo import MongoClient; client = MongoClient('mongodb+srv://...'); print(client.admin.command('ping'))"
```

### Issue: ansible-playbook not found
**Solution**:
```bash
# Install Ansible
sudo apt-get update
sudo apt-get install ansible

# Verify installation
ansible --version
```

### Issue: Port already in use
**Solution**:
```bash
# Find process on port 5000
lsof -i :5000

# Kill process
kill -9 <PID>

# Or change port in config
export LLM_API_PORT=5002
```

### Issue: Logs not appearing in MongoDB
**Solution**:
```bash
# Check if stream_parser is running
ps aux | grep stream_parser

# Check stream_parser logs
tail -f Backend/log-parse-segregator/stream_parser.log

# Verify K8s pod is generating logs
kubectl logs -l app=log-generator -f
```

---

## 📊 Performance Metrics

| Component | Processing Time | Frequency |
|-----------|-----------------|-----------|
| Log Parsing | ~2-5 sec per chunk | Continuous |
| Feature Extraction | ~1 sec per chunk | Every 30 sec |
| Anomaly Detection | ~1 sec per chunk | Every 30 sec |
| Report Generation | ~2-5 sec per anomaly | Triggered on anomaly |
| Playbook Generation | ~5-10 sec per report | On user request |
| Playbook Execution | ~30-60 sec | On automation trigger |

**Total Pipeline Latency**: ~1-2 minutes from anomaly detection to fix execution

---

## 🔐 Security Considerations

1. **API Keys**: Keep GROQ_API_KEY secure
2. **MongoDB**: Use secure connection strings with authentication
3. **CORS**: APIs have CORS enabled for frontend access
4. **Ansible**: Use connection: local for testing (update for production)

---

## 📚 Additional Resources

- [Integration Guide](INTEGRATION_GUIDE.md) - Full data flow
- [Automation Timeline Guide](AUTOMATION_TIMELINE_GUIDE.md) - Real-time tracking
- [Frontend README](README_FRONTEND.md) - UI integration
- [Project Architecture](README.md) - Complete overview

