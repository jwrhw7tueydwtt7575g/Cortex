#!/bin/bash

# ╔════════════════════════════════════════════════════════════════════════════╗
# ║                                                                            ║
# ║     🚀 TESSERACT26 - Complete ML + Automation Pipeline                    ║
# ║                                                                            ║
# ║  • Pod Logs Stream → Parse & Segregate → MongoDB                          ║
# ║  • ML Model (Continuous 30-sec polling)                                   ║
# ║  • LLM Report Generator (Prevention reports)                              ║
# ║  • Ansible Automation (Auto-execute fixes)                                ║
# ║  • Prophet Forecasting (All historical data)                              ║
# ║  • Grafana + Prometheus Monitoring                                        ║
# ║  • Dash Dashboard (Auto-refresh 30-sec)                                   ║
# ║                                                                            ║
# ╚════════════════════════════════════════════════════════════════════════════╝

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

PROJECT_ROOT="/home/vivek/Desktop/Ai-Agent/Tesseract26"
PID_FILE="$PROJECT_ROOT/.service_pids"

# ═══════════════════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════

print_header() {
    echo -e "\n${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC} $1"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}\n"
}

print_step() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

print_info() {
    echo -e "${YELLOW}ℹ️${NC}  $1"
}

cleanup() {
    echo -e "\n${RED}🛑 Shutting down all services...${NC}\n"
    
    if [ -f "$PID_FILE" ]; then
        while read -r PID; do
            if ps -p "$PID" > /dev/null 2>&1; then
                kill "$PID" 2>/dev/null || true
                echo -e "${GREEN}✅${NC} Killed PID $PID"
            fi
        done < "$PID_FILE"
        rm "$PID_FILE"
    fi
    
    pkill -f "stream.*main.py" || true
    pkill -f "main.py.*AnomalyDetection" || true
    pkill -f "dash_dashboard.py" || true
    pkill -f "llm.*api_server" || true
    pkill -f "ansible.*api_server" || true
    pkill -f "port-forward" || true
    
    echo -e "\n${GREEN}✅ All services stopped${NC}\n"
}

# ═══════════════════════════════════════════════════════════════════════════
# PORT AVAILABILITY CHECK
# ═══════════════════════════════════════════════════════════════════════════

check_port_available() {
    local port=$1
    local name=$2
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_error "Port $port ($name) already in use"
        return 1
    fi
    return 0
}

# ═══════════════════════════════════════════════════════════════════════════
# SERVICE HEALTH CHECK
# ═══════════════════════════════════════════════════════════════════════════

wait_for_service() {
    local port=$1
    local name=$2
    local max_attempts=15
    local attempt=1
    
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} Waiting for $name (port $port)..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:$port/health >/dev/null 2>&1 || \
           curl -s http://localhost:$port/api/health >/dev/null 2>&1 || \
           curl -s http://localhost:$port/ >/dev/null 2>&1; then
            print_success "$name is healthy"
            return 0
        fi
        
        printf "."
        sleep 1
        attempt=$((attempt + 1))
    done
    
    print_error "$name failed to start or is not responding on port $port"
    return 1
}

# Trap to handle Ctrl+C
trap cleanup EXIT INT TERM

# ═══════════════════════════════════════════════════════════════════════════
# MAIN EXECUTION
# ═══════════════════════════════════════════════════════════════════════════

print_header "🚀 TESSERACT26 - Complete ML + Automation Pipeline"

# 1️⃣ CHECK MINIKUBE
print_step "Checking Minikube..."
if ! kubectl cluster-info > /dev/null 2>&1; then
    print_error "Minikube not running. Starting..."
    minikube start --driver=docker > /dev/null 2>&1
fi
print_success "Minikube Running"

# 2️⃣ GET POD NAME
print_step "Finding log-generator pod..."
POD_NAME=$(kubectl get pods -o jsonpath='{.items[*].metadata.name}' 2>/dev/null | tr ' ' '\n' | grep log-generator | head -1)

if [ -z "$POD_NAME" ]; then
    print_error "log-generator pod not found"
    echo "Available pods:"
    kubectl get pods
    exit 1
fi
print_success "Using Pod: $POD_NAME"

# 3️⃣ START STREAM PARSER (Pod → MongoDB)
print_step "Starting Stream Parser (Pod Logs → MongoDB)..."
cd "$PROJECT_ROOT/Backend/log-parse-segregator"
nohup python3 main.py --source kubectl --pod "$POD_NAME" --chunk-size 50 > stream_parser.log 2>&1 &
STREAM_PID=$!
echo "$STREAM_PID" >> "$PID_FILE"
sleep 2
print_success "Stream Parser Started (PID: $STREAM_PID)"

# 4️⃣ START ML PIPELINE (MongoDB → Anomaly Detection - Continuous)
print_step "Starting ML Pipeline (Continuous 30-sec polling)..."
cd "$PROJECT_ROOT/Backend/AnomalyDetection"
nohup python3 main.py > ml_pipeline.log 2>&1 &
ML_PID=$!
echo "$ML_PID" >> "$PID_FILE"
sleep 3
print_success "ML Pipeline Started (PID: $ML_PID)"

# 5️⃣ START DASH DASHBOARD (Auto-refresh 30-sec)
print_step "Starting Dash Dashboard (Auto-refresh 30-sec)..."
nohup python3 dash_dashboard.py > dash_server.log 2>&1 &
DASH_PID=$!
echo "$DASH_PID" >> "$PID_FILE"
sleep 2
print_success "Dash Dashboard Started (PID: $DASH_PID)"

# 5️⃣.1 START LLM REPORT GENERATOR API
print_step "Starting LLM Report Generator API (port 5000)..."
cd "$PROJECT_ROOT/Backend/LLMReportGenerator"
# Install dependencies if not already installed
if ! python3 -c "import flask" 2>/dev/null; then
    print_info "Installing LLM Report Generator dependencies..."
    pip install -r requirements.txt > /dev/null 2>&1 || print_error "Failed to install LLM dependencies"
fi
nohup python3 api_server.py > llm_reports_api.log 2>&1 &
LLM_PID=$!
echo "$LLM_PID" >> "$PID_FILE"
sleep 3
if wait_for_service 5000 "LLM Report Generator API"; then
    print_success "LLM Report Generator API Started (PID: $LLM_PID)"
else
    print_error "LLM Report Generator API failed to start - check llm_reports_api.log"
    tail -20 llm_reports_api.log
    exit 1
fi

# 5️⃣.2 START ANSIBLE AUTOMATION SERVICE
print_step "Starting Ansible Automation Service (port 5001)..."
cd "$PROJECT_ROOT/Backend/AnsibleAutomation"
# Install dependencies if not already installed
if ! python3 -c "import flask" 2>/dev/null; then
    print_info "Installing Ansible Automation dependencies..."
    pip install -r requirements.txt > /dev/null 2>&1 || print_error "Failed to install Automation dependencies"
fi
# Create playbooks directory
mkdir -p playbooks results_cache
nohup python3 api_server.py > automation_api.log 2>&1 &
AUTOMATION_PID=$!
echo "$AUTOMATION_PID" >> "$PID_FILE"
sleep 3
if wait_for_service 5001 "Ansible Automation Service"; then
    print_success "Ansible Automation Service Started (PID: $AUTOMATION_PID)"
else
    print_error "Ansible Automation Service failed to start - check automation_api.log"
    tail -20 automation_api.log
    exit 1
fi

# 6️⃣ VERIFY MONITORING STACK
print_step "Verifying Prometheus & Grafana..."

if kubectl get ns monitoring > /dev/null 2>&1; then
    print_success "Monitoring Namespace Active"
    
    # Kill existing port forwards
    pkill -f "port-forward.*9090" 2>/dev/null || true
    pkill -f "port-forward.*4000" 2>/dev/null || true
    sleep 1
    
    # Port forward Prometheus
    nohup kubectl port-forward -n monitoring svc/prometheus-operated 9090:9090 --address=0.0.0.0 > /tmp/prometheus_forward.log 2>&1 &
    PROM_PID=$!
    echo "$PROM_PID" >> "$PID_FILE"
    
    # Port forward Grafana
    nohup kubectl port-forward -n monitoring svc/grafana-standalone 4000:3000 --address=0.0.0.0 > /tmp/grafana_forward.log 2>&1 &
    GRAFANA_PID=$!
    echo "$GRAFANA_PID" >> "$PID_FILE"
    
    sleep 2
    print_success "Prometheus: http://localhost:9090"
    print_success "Grafana: http://localhost:4000 (admin/admin123)"
else
    print_info "Monitoring stack not found (optional)"
fi

# ═══════════════════════════════════════════════════════════════════════════
# FINAL SUMMARY
# ═══════════════════════════════════════════════════════════════════════════

print_header "✨ ALL SERVICES RUNNING - FULL PIPELINE ACTIVE"

echo -e "${CYAN}📊 DASHBOARDS & APIS:${NC}"
echo -e "   ${GREEN}•${NC} Dash Dashboard:         ${BLUE}http://localhost:8050${NC}"
echo -e "   ${GREEN}•${NC} Grafana:                ${BLUE}http://localhost:4000${NC} (admin/admin123)"
echo -e "   ${GREEN}•${NC} Prometheus:             ${BLUE}http://localhost:9090${NC}"
echo -e "   ${GREEN}•${NC} LLM Report Generator:   ${BLUE}http://localhost:5000${NC}"
echo -e "   ${GREEN}•${NC} Ansible Automation:     ${BLUE}http://localhost:5001${NC}"

echo -e "\n${CYAN}📦 COMPLETE DATA FLOW:${NC}"
echo -e "   ${GREEN}1️⃣ Pod: $POD_NAME${NC}"
echo -e "      └─ Generates: 500+/min logs"
echo -e ""
echo -e "   ${GREEN}2️⃣ Stream Parser${NC} (PID: $STREAM_PID)"
echo -e "      └─ Collects logs into 50-log chunks"
echo -e "      └─ Categorizes: HEALTH/ANOMALY/SERVICE/SECURITY"
echo -e ""
echo -e "   ${GREEN}3️⃣ MongoDB${NC}"
echo -e "      └─ Stores all log chunks"
echo -e ""
echo -e "   ${GREEN}4️⃣ ML Pipeline${NC} (PID: $ML_PID)"
echo -e "      └─ Polls every 30 seconds"
echo -e "      └─ Isolation Forest model (16 features)"
echo -e "      └─ Detects anomalies"
echo -e ""
echo -e "   ${GREEN}5️⃣ LLM Report Generator${NC} (PID: $LLM_PID)"
echo -e "      └─ Takes anomalies as input"
echo -e "      └─ Generates prevention reports (http://5000)"
echo -e "      └─ Stores in MongoDB"
echo -e ""
echo -e "   ${GREEN}6️⃣ Frontend Dashboard${NC}"
echo -e "      └─ Displays top 5 reports"
echo -e "      └─ View & Automate buttons"
echo -e ""
echo -e "   ${GREEN}7️⃣ Ansible Automation${NC} (PID: $AUTOMATION_PID)"
echo -e "      └─ Receives report + logs (http://5001)"
echo -e "      └─ Generates Ansible playbook (LLM)"
echo -e "      └─ Executes playbook automatically"
echo -e "      └─ Tracks results in MongoDB"
echo -e ""
echo -e "   ${GREEN}8️⃣ Dash Dashboard${NC} (PID: $DASH_PID)"
echo -e "      └─ Auto-refresh every 30 seconds"
echo -e "      └─ Shows anomalies & forecasts"
echo -e ""
echo -e "   ${GREEN}9️⃣ Grafana + Prometheus${NC}"
echo -e "      └─ Real-time metrics monitoring"
echo -e "      └─ Kubernetes resource tracking"

echo -e "\n${CYAN}🔄 CONTINUOUS OPERATIONS:${NC}"
echo -e "   ${GREEN}•${NC} Stream Parser: Continuously reading pod logs"
echo -e "   ${GREEN}•${NC} MongoDB: Storing chunks in real-time"
echo -e "   ${GREEN}•${NC} ML Pipeline: Polling DB every 30 seconds"
echo -e "   ${GREEN}•${NC} LLM Reports: Processing anomalies to generate prevention reports"
echo -e "   ${GREEN}•${NC} Ansible Automation: Ready to execute remediation playbooks"
echo -e "   ${GREEN}•${NC} Dashboard: Refreshing every 30 seconds"
echo -e "   ${GREEN}•${NC} Grafana: Monitoring Kubernetes metrics"

echo -e "\n${CYAN}📝 LOG FILES:${NC}"
echo -e "   ${GREEN}•${NC} Stream Parser:  $PROJECT_ROOT/Backend/log-parse-segregator/stream_parser.log"
echo -e "   ${GREEN}•${NC} ML Pipeline:    $PROJECT_ROOT/Backend/AnomalyDetection/ml_pipeline.log"
echo -e "   ${GREEN}•${NC} LLM Reports:    $PROJECT_ROOT/Backend/LLMReportGenerator/llm_reports_api.log"
echo -e "   ${GREEN}•${NC} Automation:     $PROJECT_ROOT/Backend/AnsibleAutomation/automation_api.log"
echo -e "   ${GREEN}•${NC} Dashboard:      $PROJECT_ROOT/Backend/AnomalyDetection/dash_server.log"
echo -e "   ${GREEN}•${NC} Playbooks:      $PROJECT_ROOT/Backend/AnsibleAutomation/playbooks/"

echo -e "\n${CYAN}🧪 TEST COMMANDS:${NC}"
echo -e "   ${GREEN}Check ML Anomalies:${NC}"
echo -e "      curl -s http://localhost:5000/api/reports/top5 | jq ."
echo -e "   ${GREEN}Check Automation Status:${NC}"
echo -e "      curl -s http://localhost:5001/api/automation/health | jq ."
echo -e "   ${GREEN}View Dashboard:${NC}"
echo -e "      open http://localhost:8050"
echo -e "   ${GREEN}Monitor Service Logs:${NC}"
echo -e "      tail -f $PROJECT_ROOT/Backend/LLMReportGenerator/llm_reports_api.log"
echo -e "      tail -f $PROJECT_ROOT/Backend/AnsibleAutomation/automation_api.log"

echo -e "\n${CYAN}🛑 TO STOP ALL SERVICES:${NC}"
echo -e "   ${YELLOW}Press Ctrl+C${NC} in this terminal"

echo -e "\n${GREEN}✅ Ready! All systems operational${NC}\n"

# Keep services running
while true; do
    sleep 60
    
    # Health check - restart if crashed
    if ! ps -p "$STREAM_PID" > /dev/null 2>&1; then
        print_error "Stream Parser crashed! Restarting..."
        cd "$PROJECT_ROOT/Backend/log-parse-segregator"
        nohup python3 main.py --source kubectl --pod "$POD_NAME" --chunk-size 50 > stream_parser.log 2>&1 &
        STREAM_PID=$!
    fi
    
    if ! ps -p "$ML_PID" > /dev/null 2>&1; then
        print_error "ML Pipeline crashed! Restarting..."
        cd "$PROJECT_ROOT/Backend/AnomalyDetection"
        nohup python3 main.py > ml_pipeline.log 2>&1 &
        ML_PID=$!
    fi
    
    if ! ps -p "$LLM_PID" > /dev/null 2>&1; then
        print_error "LLM Report Generator crashed! Restarting..."
        cd "$PROJECT_ROOT/Backend/LLMReportGenerator"
        if ! python3 -c "import flask" 2>/dev/null; then
            pip install -r requirements.txt > /dev/null 2>&1
        fi
        nohup python3 api_server.py > llm_reports_api.log 2>&1 &
        LLM_PID=$!
    fi
    
    if ! ps -p "$AUTOMATION_PID" > /dev/null 2>&1; then
        print_error "Ansible Automation crashed! Restarting..."
        cd "$PROJECT_ROOT/Backend/AnsibleAutomation"
        if ! python3 -c "import flask" 2>/dev/null; then
            pip install -r requirements.txt > /dev/null 2>&1
        fi
        mkdir -p playbooks
        nohup python3 api_server.py > automation_api.log 2>&1 &
        AUTOMATION_PID=$!
    fi
    
    if ! ps -p "$DASH_PID" > /dev/null 2>&1; then
        print_error "Dash Dashboard crashed! Restarting..."
        cd "$PROJECT_ROOT/Backend/AnomalyDetection"
        nohup python3 dash_dashboard.py > dash_server.log 2>&1 &
        DASH_PID=$!
    fi
done
# ➜  Tesseract26 git:(main) ✗ cd /home/vivek/Desktop/Ai-Agent/Tesseract26/Backend/LLMReportGenerator && python3 api_server.py > llm_reports.log 2>&1 &
# echo $! > /tmp/llm_server.pid
# sleep 2
# ps aux | grep api_server | grep -v grep
# [1] 12080
# vivek      12080 12.0  0.3 503088 49104 pts/20   SNl  23:52   0:00 python3 api_server.py
# ➜  LLMReportGenerator git:(main) ✗ 