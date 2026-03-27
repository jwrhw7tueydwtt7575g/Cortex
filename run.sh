#!/bin/bash

# ╔════════════════════════════════════════════════════════════════════════════╗
# ║                                                                            ║
# ║           🚀 TESSERACT26 - Complete Automated ML Pipeline                 ║
# ║                                                                            ║
# ║  • Pod Logs Stream → Parse & Segregate → MongoDB                          ║
# ║  • ML Model (Continuous 30-sec polling)                                   ║
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
    pkill -f "port-forward" || true
    
    echo -e "\n${GREEN}✅ All services stopped${NC}\n"
}

# Trap to handle Ctrl+C
trap cleanup EXIT INT TERM

# ═══════════════════════════════════════════════════════════════════════════
# MAIN EXECUTION
# ═══════════════════════════════════════════════════════════════════════════

print_header "🚀 TESSERACT26 - Complete ML Pipeline Automation"

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

print_header "✨ ALL SERVICES RUNNING"

echo -e "${CYAN}📊 DASHBOARDS:${NC}"
echo -e "   ${GREEN}•${NC} Dash Dashboard:    ${BLUE}http://localhost:8050${NC}"
echo -e "   ${GREEN}•${NC} Grafana:           ${BLUE}http://localhost:4000${NC} (admin/admin123)"
echo -e "   ${GREEN}•${NC} Prometheus:        ${BLUE}http://localhost:9090${NC}"

echo -e "\n${CYAN}📦 DATA FLOW:${NC}"
echo -e "   ${GREEN}Pod: $POD_NAME${NC}"
echo -e "   ├─ Logs: 500+/min"
echo -e "   ↓"
echo -e "   ${GREEN}Stream Parser${NC} (PID: $STREAM_PID)"
echo -e "   ├─ Chunks: 50-log batches"
echo -e "   ├─ Categorizes: HEALTH/ANOMALY/SERVICE/SECURITY"
echo -e "   ↓"
echo -e "   ${GREEN}MongoDB${NC} (Cloud Storage)"
echo -e "   ├─ Stores all chunks"
echo -e "   ↓"
echo -e "   ${GREEN}ML Pipeline${NC} (PID: $ML_PID)"
echo -e "   ├─ Fetches: Latest 6 chunks every 30 seconds"
echo -e "   ├─ Model: Isolation Forest (contamination=0.1)"
echo -e "   ├─ Features: 16 ML features"
echo -e "   ├─ Saves: anomaly_detection_results.json"
echo -e "   ↓"
echo -e "   ${GREEN}Prophet Forecaster${NC}"
echo -e "   ├─ Uses: ALL historical data from DB"
echo -e "   ├─ Forecasts: 4 key metrics (latency, CPU, memory, queue_depth)"
echo -e "   ├─ Confidence: 95% intervals"
echo -e "   ↓"
echo -e "   ${GREEN}Dash Dashboard${NC} (PID: $DASH_PID)"
echo -e "   ├─ Auto-refresh: Every 30 seconds"
echo -e "   ├─ Shows: Anomalies, forecasts, trends"

echo -e "\n${CYAN}🔄 CONTINUOUS OPERATIONS:${NC}"
echo -e "   ${GREEN}•${NC} Stream Parser: Continuously reading pod logs"
echo -e "   ${GREEN}•${NC} MongoDB: Storing chunks in real-time"
echo -e "   ${GREEN}•${NC} ML Pipeline: Polling DB every 30 seconds"
echo -e "   ${GREEN}•${NC} Prophet: Forecasting on full history"
echo -e "   ${GREEN}•${NC} Dashboard: Refreshing every 30 seconds"
echo -e "   ${GREEN}•${NC} Grafana: Monitoring Kubernetes metrics"

echo -e "\n${CYAN}📝 LOGS:${NC}"
echo -e "   ${GREEN}•${NC} Stream Parser: $PROJECT_ROOT/Backend/log-parse-segregator/stream_parser.log"
echo -e "   ${GREEN}•${NC} ML Pipeline:    $PROJECT_ROOT/Backend/AnomalyDetection/ml_pipeline.log"
echo -e "   ${GREEN}•${NC} Dashboard:      $PROJECT_ROOT/Backend/AnomalyDetection/dash_server.log"

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
    
    if ! ps -p "$DASH_PID" > /dev/null 2>&1; then
        print_error "Dash Dashboard crashed! Restarting..."
        cd "$PROJECT_ROOT/Backend/AnomalyDetection"
        nohup python3 dash_dashboard.py > dash_server.log 2>&1 &
        DASH_PID=$!
    fi
done
