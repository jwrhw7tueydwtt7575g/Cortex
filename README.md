# 🧠 Cortex - Kubernetes Monitoring & Automation Platform

> **Cortex**: Intelligent, end-to-end Kubernetes monitoring system that detects anomalies, generates prevention reports with LLM, and automatically executes remediation playbooks.

## 🎯 What is Cortex?

Cortex is an advanced observability platform designed to solve the critical problem of **reactive incident response** in Kubernetes environments. Instead of waiting for issues to occur and then responding, Cortex:

1. **🔍 Continuously Monitors** Pod logs in real-time (500+ logs/min)
2. **🤖 Detects Anomalies** Using ML (Isolation Forest algorithm)
3. **💡 Generates Reports** Using LLM to explain root causes and prevention strategies
4. **⚡ Automatically Remedies** By executing Ansible playbooks
5. **📊 Tracks Everything** In MongoDB for audit and learning

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CORTEX END-TO-END FLOW                             │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌────────────────────────────────────────────────────────────────┐
    │        KUBERNETES CLUSTER (Minikube/Production)               │
    │   ┌──────────────────────────────────────────────────────┐   │
    │   │  Pod Logs (500+ logs/min)                            │   │
    │   │  • Application logs                                  │   │
    │   │  • System logs                                       │   │
    │   │  • Error messages                                    │   │
    │   └────────────────────┬─────────────────────────────────┘   │
    │                        │                                      │
    └────────────────────────┼──────────────────────────────────────┘
                             │
    ┌────────────────────────▼──────────────────────────────────────┐
    │  BACKEND SERVICES (Python + Node.js)                          │
    │  ┌─────────────────────────────────────────────────────────┐  │
    │  │ 1️⃣ LOG PARSER & SEGREGATOR                             │  │
    │  │    • Streams logs from K8s                              │  │
    │  │    • Groups into chunks (50 logs)                       │  │
    │  │    • Stores in MongoDB                                  │  │
    │  │    📁 Backend/log-parse-segregator/                    │  │
    │  └──────────────────┬──────────────────────────────────────┘  │
    │                     │                                         │
    │  ┌──────────────────▼──────────────────────────────────────┐  │
    │  │ 2️⃣ ML ANOMALY DETECTION (Every 30 seconds)             │  │
    │  │    • Reads chunks from MongoDB                          │  │
    │  │    • Extracts 16 features (CPU, memory, latency, etc)  │  │
    │  │    • Uses Isolation Forest algorithm                    │  │
    │  │    • Generates anomaly_detection_results.json           │  │
    │  │    • Prophet forecasting for trends                     │  │
    │  │    📁 Backend/AnomalyDetection/                         │  │
    │  │    🌐 Dashboard: http://localhost:8050                  │  │
    │  └──────────────────┬──────────────────────────────────────┘  │
    │                     │                                         │
    │  ┌──────────────────▼──────────────────────────────────────┐  │
    │  │ 3️⃣ LLM REPORT GENERATOR (On Anomaly)                   │  │
    │  │    • Reads anomaly results                              │  │
    │  │    • Calls Groq LLM API                                 │  │
    │  │    • Generates prevention reports:                      │  │
    │  │      - Risk level assessment                            │  │
    │  │      - Root causes explanation                          │  │
    │  │      - Prevention steps                                 │  │
    │  │      - Immediate actions                                │  │
    │  │    • Stores in MongoDB                                  │  │
    │  │    📁 Backend/LLMReportGenerator/                       │  │
    │  │    🌐 API: http://localhost:5000                        │  │
    │  └──────────────────┬──────────────────────────────────────┘  │
    │                     │                                         │
    │  ┌──────────────────▼──────────────────────────────────────┐  │
    │  │ 4️⃣ AUTOMATION SERVICE (On User Trigger)                │  │
    │  │    Stage 1: Playbook Generation                         │  │
    │  │    ├─ LLM converts report → Ansible YAML               │  │
    │  │    ├─ Includes actual logs for context                 │  │
    │  │    └─ Saves to disk                                    │  │
    │  │                                                         │  │
    │  │    Stage 2: Playbook Save                              │  │
    │  │    ├─ File: ./playbooks/playbook_<id>.yml             │  │
    │  │    └─ Validated before execution                       │  │
    │  │                                                         │  │
    │  │    Stage 3: Playbook Execution                         │  │
    │  │    ├─ Runs: ansible-playbook                           │  │
    │  │    ├─ Captures stdout/stderr                           │  │
    │  │    └─ Stores results in MongoDB                        │  │
    │  │    📁 Backend/AnsibleAutomation/                        │  │
    │  │    🌐 API: http://localhost:5001                        │  │
    │  └──────────────────┬──────────────────────────────────────┘  │
    │                     │                                         │
    │  ┌──────────────────▼──────────────────────────────────────┐  │
    │  │ 5️⃣ MONITORING STACK                                    │  │
    │  │    • Prometheus: Metrics collection                     │  │
    │  │    • Grafana: Visualization                             │  │
    │  │    • 🌐 Grafana: http://localhost:4000                  │  │
    │  │    • 🌐 Prometheus: http://localhost:9090               │  │
    │  │    📁 Backend/Backend Generator/                        │  │
    │  └──────────────────┬──────────────────────────────────────┘  │
    │                     │                                         │
    └─────────────────────┼─────────────────────────────────────────┘
                          │
    ┌─────────────────────▼─────────────────────────────────────────┐
    │  FRONTEND DASHBOARD (Next.js React)                           │
    │  📁 Frontend/                                                 │
    │  🌐 http://localhost:3000                                     │
    │                                                               │
    │  ┌───────────────┬──────────────┬──────────────┐             │
    │  │ Dashboard Tab │ Reports Tab  │ Automation   │             │
    │  │               │              │ & Settings   │             │
    │  ├───────────────┼──────────────┼──────────────┤             │
    │  │ • Grafana     │ • Latest 5   │ • Manual     │             │
    │  │ • Prometheus  │   reports    │   triggers   │             │
    │  │ • Dash ML     │ • Risk badge │ • API config │             │
    │  │ • MLflow      │ • Automate   │ • Logs       │             │
    │  │               │   button     │               │             │
    │  │               │ • Real-time  │               │             │
    │  │               │   timeline   │               │             │
    │  └───────────────┴──────────────┴──────────────┘             │
    │                                                               │
    │  Automation Flow:                                            │
    │  1. User clicks "Automate" on report                         │
    │  2. Fetches logs: GET /api/logs/<chunk_id>                  │
    │  3. Sends to backend: POST /api/automate                     │
    │  4. Polls status: GET /api/automation/status/<id>            │
    │  5. Displays timeline with real-time updates                 │
    │  6. Shows result with toast notification                     │
    └─────────────────────────────────────────────────────────────┘
                          │
                     MongoDB
                   ┌────────────┐
                   │ Collections│
                   ├────────────┤
                   │ • logs     │
                   │ • anomalies│
                   │ • reports  │
                   │ • automati │
                   │   ons      │
                   └────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Ubuntu/Linux OS
- Docker & Kubernetes (Minikube)
- MongoDB Atlas account (free tier ok)
- Groq API key (free tier at groq.com)
- Node.js 18+ (for frontend)
- Python 3.8+ (for backend)

### Step 1: Clone & Setup
```bash
cd /home/vivek/Desktop/Ai-Agent/Tesseract26
bash run.sh
```

This automatically starts:
- Log Parser (streaming)
- ML Pipeline (detection every 30s)
- Dash Dashboard (port 8050)
- LLM Reports API (port 5000)
- Ansible Automation (port 5001)
- Prometheus (port 9090)
- Grafana (port 4000)
- Frontend Dashboard (port 3000)

### Step 2: Access Dashboard
```bash
# Open browser
http://localhost:3000
```

### Step 3: Verify Integration
1. Go to **Integrations Tab**
2. Add your Groq API key
3. Check API endpoints
4. Click "Test Connection"

### Step 4: Monitor
1. Go to **Dashboard Tab**
2. View real-time metrics in Grafana

### Step 5: Automate
1. Go to **Reports Tab**
2. When reports appear, click "Automate"
3. Watch real-time timeline
4. See automation results

---

## 📋 Architecture Components

| Component | Language | Purpose | Port | Status |
|-----------|----------|---------|------|--------|
| Log Parser | Python | Stream K8s logs | - | Background |
| ML Pipeline | Python | Detect anomalies | 8050 | Dashboard |
| LLM Reports | Python | Generate reports | 5000 | API |
| Ansible Automation | Python | Execute playbooks | 5001 | API |
| Frontend | Next.js/React | UI Dashboard | 3000 | Web |
| Prometheus | Go | Metrics collection | 9090 | Web |
| Grafana | Node.js | Visualization | 4000 | Web |
| MongoDB | NoSQL | Data storage | - | Cloud |

---

## 🔄 Data Flow Example

### Scenario: Pod Memory Leak Detected

```
Time: 14:23:15

┌─────────────────────────────────────────────────────┐
│ 1. LOG STREAM (Continuous)                          │
│    Pod generates 50 logs mentioning "memory 92%"    │
│    Stream parser chunks and stores in MongoDB       │
└──────────┬──────────────────────────────────────────┘
           │
    14:23:30 (30s polling)
           │
┌──────────▼──────────────────────────────────────────┐
│ 2. ML DETECTION                                     │
│    Extracts 16 features from chunk                  │
│    Isolation Forest scores: 0.87 (anomaly!)        │
│    Stores result: anomaly_detection_results.json    │
└──────────┬──────────────────────────────────────────┘
           │
    Triggered by anomaly
           │
┌──────────▼──────────────────────────────────────────┐
│ 3. LLM REPORT GENERATION                            │
│    Report prompt includes:                          │
│    - Anomaly score 0.87                             │
│    - 16 features with values                        │
│    - Sample logs                                    │
│    - Alert timestamps                               │
│                                                     │
│    LLM generates:                                   │
│    Risk Level: HIGH                                 │
│    Root Cause: Memory leak in pod                   │
│    Prevention: Set memory limit, add monitoring     │
│    Immediate: Restart pod, investigate logs         │
│                                                     │
│    Stores in MongoDB: reportgenerated collection    │
└──────────┬──────────────────────────────────────────┘
           │
    User sees report
           │
┌──────────▼──────────────────────────────────────────┐
│ 4. USER CLICKS "AUTOMATE"                           │
│    Frontend fetches report + logs                   │
│    Sends to automation API                          │
└──────────┬──────────────────────────────────────────┘
           │
┌──────────▼──────────────────────────────────────────┐
│ 5. PLAYBOOK GENERATION                              │
│    LLM converts report to Ansible YAML:             │
│    ---                                              │
│    - hosts: localhost                               │
│      tasks:                                         │
│      - name: Check pod memory                       │
│        shell: kubectl top pod                       │
│      - name: Set memory limit                       │
│        shell: kubectl set resources ...             │
│      - name: Restart pod                            │
│        shell: kubectl rollout restart ...           │
│                                                     │
│    Status: PLAYBOOK_GENERATION: success             │
└──────────┬──────────────────────────────────────────┘
           │
┌──────────▼──────────────────────────────────────────┐
│ 6. PLAYBOOK EXECUTION                               │
│    ansible-playbook playbook_chunk123.yml           │
│                                                     │
│    Tasks execute:                                   │
│    TASK [Check pod memory] ..................... ok │
│    TASK [Set memory limit] .................... ok │
│    TASK [Restart pod] ......................... ok │
│                                                     │
│    Status: PLAYBOOK_EXECUTION: success              │
│    Return code: 0                                   │
└──────────┬──────────────────────────────────────────┘
           │
    📊 Results stored in MongoDB
    ✅ Timeline shown in frontend
    🔔 Toast notification: "Automation completed!"
    
Total time: ~1-2 minutes from detection to fix
```

---

## 📊 Feature Extraction

The ML pipeline extracts **16 features** from logs for anomaly detection:

### Core Features (Extracted via Regex)
1. **latency** - Response time in milliseconds
2. **db_query_time** - Database query duration
3. **cpu_usage** - CPU percentage (0-100)
4. **memory_usage** - Memory percentage (0-100)
5. **gc_time** - Garbage collection pause time
6. **queue_depth** - Pending requests in queue
7. **request_rate** - Requests per minute
8. **timeout_count** - Number of timeouts
9. **error_rate** - Percentage of errors

### Aggregated Features (Time-series)
10. **avg_latency** - Average of latency over window
11. **max_memory** - Peak memory usage
12. **error_spike** - Sudden increase in errors
13. **request_spike** - Sudden increase in requests
14. **recovery_time** - Time to recover from spike
15. **trend** - Upward/downward trend
16. **volatility** - Variability in metrics

---

## 🔑 Environment Configuration

### Required Environment Variables

```bash
# Groq LLM API (Get from https://console.groq.com)
export GROQ_API_KEY="gsk_..."

# MongoDB (Use MongoDB Atlas free tier)
export MONGODB_URI="mongodb+srv://user:password@cluster.mongodb.net/"
export MONGODB_DB="k8s_logs"
```

### Optional Configuration

```bash
# Service Ports
export LLM_API_PORT=5000
export AUTOMATION_API_PORT=5001
export DASH_PORT=8050

# Ansible Settings
export ANSIBLE_PLAYBOOKS_DIR="./Backend/AnsibleAutomation/playbooks"

# Log Collection
export K8S_NAMESPACE="default"
export LOG_CHUNK_SIZE=50
export ML_POLLING_INTERVAL=30
```

---

## 📁 Project Structure

```
Cortex/
├── README.md                         # Main documentation (you are here)
├── README_FRONTEND.md               # Frontend detailed guide
├── README_BACKEND.md                # Backend detailed guide
├── run.sh                           # Main startup script (KEEP THIS)
│
├── Frontend/                         # Next.js React Dashboard
│   ├── app/                         # Page layouts
│   ├── components/                  # React components
│   ├── hooks/                       # Custom hooks
│   ├── lib/                         # Utilities
│   ├── public/                      # Static assets
│   ├── styles/                      # CSS
│   └── package.json                 # Dependencies
│
├── Backend/
│   ├── log-parse-segregator/        # 1️⃣ Log streaming & chunking
│   │   ├── stream_parser.py
│   │   ├── log_parser.py
│   │   ├── categorizer.py
│   │   ├── mongodb_handler.py
│   │   └── requirements.txt
│   │
│   ├── AnomalyDetection/            # 2️⃣ ML anomaly detection
│   │   ├── main.py                  # ML pipeline
│   │   ├── model.py                 # Isolation Forest
│   │   ├── data_extractor.py        # Feature extraction
│   │   ├── prophet_forecaster.py    # Time-series forecasting
│   │   ├── dash_dashboard.py        # Dashboard
│   │   ├── mlflow_tracker.py        # Experiment tracking
│   │   └── requirements.txt
│   │
│   ├── LLMReportGenerator/          # 3️⃣ LLM report generation
│   │   ├── api_server.py            # Flask API
│   │   ├── llm_generator.py         # Groq integration
│   │   ├── mongodb_handler.py       # DB operations
│   │   └── requirements.txt
│   │
│   ├── AnsibleAutomation/           # 4️⃣ Automation & execution
│   │   ├── api_server.py            # Flask API
│   │   ├── automation_service.py    # 3-stage pipeline
│   │   ├── llm_playbook_generator.py # Playbook generation
│   │   ├── ansible_executor.py      # Execution engine
│   │   ├── playbooks/               # Generated playbooks
│   │   └── requirements.txt
│   │
│   └── Backend Generator/           # 5️⃣ Monitoring stack
│       ├── configmap.yaml           # K8s config
│       ├── deployment.yaml          # K8s deployment
│       ├── prometheus-values.yaml
│       ├── grafana-config.yaml
│       └── servicemonitor.yaml
│
├── logs/                            # Log storage
│   └── *.log                        # Service logs
│
└── INTEGRATION_GUIDE.md             # Data flow documentation
```

---

## 🔌 API Reference

### Frontend → Backend APIs

#### LLM Reports API (Port 5000)
```bash
# Get top 5 latest reports
GET http://localhost:5000/api/reports/top5

# Get specific report
GET http://localhost:5000/api/reports/<chunk_id>

# Get logs for context
GET http://localhost:5000/api/logs/<chunk_id>

# Health check
GET http://localhost:5000/api/health
```

#### Automation API (Port 5001)
```bash
# Trigger automation (returns 202 Accepted)
POST http://localhost:5001/api/automate
Body: {
  "chunk_id": "...",
  "report": {...},
  "logs": [...]
}

# Get real-time status
GET http://localhost:5001/api/automation/status/<chunk_id>

# Get full timeline
GET http://localhost:5001/api/automation/timeline/<chunk_id>

# Health check
GET http://localhost:5001/api/automation/health
```

---

## 🔄 Complete Automation Workflow

```
Frontend                          Backend

User on Reports Tab
│
├─ Sees report card
│ • Risk: HIGH
│ • Root causes listed
│ • Prevention steps shown
│
├─ Clicks "Automate" button
│
├─ [API Call] POST /api/automate ────┐
│   {                                 │
│     chunk_id,                       ├──> Automation Service
│     report,                         │
│     logs                            │ Stage 1: PLAYBOOK_GENERATION
│   }                                 │ ├─ LLM: report → Ansible YAML
│                                     │ ├─ Status: in_progress → success
│                                     │
│  [Polling] GET /api/automation/ ◄──┤ Stage 2: PLAYBOOK_SAVE
│            status/<chunk_id>        │ ├─ Write to disk
│  (every 2 seconds)                  │ ├─ Status: in_progress → success
│                                     │
│ Shows timeline:                     │ Stage 3: PLAYBOOK_EXECUTION
│ ✅ PLAYBOOK_GENERATION: success     │ ├─ ansible-playbook
│ ⏳ PLAYBOOK_SAVE: in_progress       │ ├─ Capture output
│ ⏳ PLAYBOOK_EXECUTION: queued       │ └─ Status: in_progress → success
│                                     │
├─ [Poll continues until complete]   ├──> MongoDB: Save results
│                                     │
├─ Timeline completes:               │
│ ✅ All stages: success              │
│                                     │
├─ Toast: "Automation completed!" ◄──┘
│
└─ Timeline persists for review
```

---

## 📈 Performance Metrics

| Metric | Value | Notes |
|--------|-------|-------|
| Log Ingestion | 500+ logs/min | Per pod per minute |
| Chunk Processing | ~2-5 sec | Per 50-log chunk |
| ML Detection | ~1 sec | Every 30 seconds |
| Report Generation | ~2-5 sec | Using Groq LLM |
| Playbook Generation | ~5-10 sec | Using Groq LLM |
| Playbook Execution | ~30-60 sec | Ansible runtime |
| **Total Pipeline** | **~1-2 min** | Detection to fix |
| Real-time Status Update | 2 sec | Frontend polling |

---

## 🧪 Testing

### Test Log Generation
```bash
# Check if K8s pod is generating logs
kubectl logs -l app=log-generator -f
```

### Test ML Detection
```bash
# Check ML dashboard
curl http://localhost:8050

# View anomaly results
curl http://localhost:5000/api/reports/top5 | jq .
```

### Test Automation Workflow
```bash
# Manual automation trigger
curl -X POST http://localhost:5001/api/automate \
  -H "Content-Type: application/json" \
  -d '{
    "chunk_id": "test_123",
    "report": {
      "risk_level": "High",
      "root_causes": ["Test"],
      "prevention_steps": ["Test"],
      "immediate_actions": ["Test"]
    },
    "logs": ["test log"]
  }'

# Check status
curl http://localhost:5001/api/automation/status/test_123 | jq .
```

---

## 🚨 Common Issues & Fixes

### Issue: "GROQ_API_KEY not found"
```bash
export GROQ_API_KEY="gsk_..."
# Verify
echo $GROQ_API_KEY
```

### Issue: "MongoDB connection failed"
```bash
# Check connection string
grep MONGODB_URI Backend/*/config.py

# Test connection
python3 -c "from pymongo import MongoClient; MongoClient('your_uri').admin.command('ping')"
```

### Issue: "ansible-playbook not found"
```bash
sudo apt-get install ansible
ansible --version
```

### Issue: "Port 5000/5001 already in use"
```bash
lsof -i :5000
kill -9 <PID>
# Or change port in config
export LLM_API_PORT=5002
```

### Issue: "No reports showing"
```bash
# Check if ML pipeline is running
ps aux | grep main.py | grep AnomalyDetection

# Check for anomalies
curl http://localhost:5000/api/reports/top5 | jq '.count'

# View ML logs
tail -f Backend/AnomalyDetection/ml_pipeline.log
```

---

## 📚 Documentation Files

- **README.md** (this file) - Complete project overview
- **README_FRONTEND.md** - Frontend detailed guide
- **README_BACKEND.md** - Backend services documentation
- **INTEGRATION_GUIDE.md** - Data flow and integration
- **AUTOMATION_TIMELINE_GUIDE.md** - Real-time tracking

---

## 🔐 Security Considerations

1. **Never commit** `GROQ_API_KEY` to git
2. **Use** `.env.local` for secrets
3. **Enable CORS** only for frontend domain in production
4. **Validate** all user inputs on backend
5. **Use HTTPS** in production
6. **Implement** authentication/authorization
7. **Rotate** API keys regularly

---

## 🎓 Learning Path

1. **Start**: Read README.md (you are here)
2. **Backend**: Read README_BACKEND.md
3. **Frontend**: Read README_FRONTEND.md
4. **Integration**: Read INTEGRATION_GUIDE.md
5. **Advanced**: Read AUTOMATION_TIMELINE_GUIDE.md
6. **Deploy**: Use run.sh to start all services

---

## 🤝 Architecture Decisions

### Why Isolation Forest for Anomaly Detection?
- Detects multivariate anomalies (16 features)
- No need to define normal behavior
- Faster than statistical methods
- Works with high-dimensional data

### Why Groq LLM?
- Fast inference (5-10 sec vs 30+ sec for GPT-4)
- Free tier available
- Good for report generation
- Contextual understanding of logs

### Why Ansible for Automation?
- Agentless (no pod modifications needed)
- YAML-based (human-readable)
- Widely adopted in DevOps
- Easy to audit and review

### Why MongoDB?
- Schema-flexible (reports vary)
- Good for log storage
- Easy to query
- Free Atlas tier available

---

## 📞 Support

### Issues & Debugging
1. Check logs in `Backend/*/logs/`
2. Verify all services running: `curl http://localhost:PORT/health`
3. Review error details in browser console
4. Check MongoDB connection
5. Verify Groq API key

### Getting Help
- Check the relevant README file (Frontend/Backend)
- Review log files in service directories
- Test APIs with curl
- Monitor in real-time with `tail -f logs/*.log`

---

## 🚀 Deployment

### Local Development
```bash
bash run.sh
# All services start in background
```

### Production Considerations
1. Enable MongoDB persistence
2. Configure TLS/SSL certificates
3. Implement authentication
4. Set up proper logging/monitoring
5. Use Kubernetes-native deployments
6. Configure RBAC policies
7. Set resource limits/requests
8. Implement backup strategy

---

## 📊 Success Metrics

Cortex is working well when:
- ✅ Logs flowing into MongoDB (50 logs every 2-3 seconds)
- ✅ ML detection running every 30 seconds (check Dashboard)
- ✅ Reports appearing in Frontend (check Reports Tab)
- ✅ Automation working (click Automate, see timeline)
- ✅ Playbooks generating (check `Backend/AnsibleAutomation/playbooks/`)

---

## 🎉 You're All Set!

Cortex is now ready to:
- **Monitor** your Kubernetes pods 24/7
- **Detect** anomalies automatically with ML
- **Report** issues with LLM-generated insights
- **Remediate** problems with Ansible playbooks
- **Track** everything in MongoDB

**Start monitoring**: Open http://localhost:3000 🚀

---

**Made with ❤️ for smarter Kubernetes operations**

*Cortex v1.0 - Kubernetes Monitoring & Automation Platform*

