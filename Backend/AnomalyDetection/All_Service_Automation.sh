#!/bin/bash

# ============================================================================
# CONTINUOUS ML PIPELINE - COMPLETE STARTUP
# ============================================================================

set -e

cd /home/vivek/Desktop/Ai-Agent/Tesseract26/Backend/AnomalyDetection

echo "╔════════════════════════════════════════════════════════════════════════╗"
echo "║     🚀 CONTINUOUS ML PIPELINE WITH GRAFANA & PROMETHEUS               ║"
echo "╚════════════════════════════════════════════════════════════════════════╝"
echo ""

# Check dependencies
echo "📦 Checking dependencies..."
python3 -c "import pymongo, pandas, prophet, sklearn" 2>/dev/null && echo "✅ All Python packages installed" || echo "⚠️  Installing packages..."

# Create logs directory
mkdir -p logs

echo ""
echo "🚀 STARTING SERVICES..."
echo "─────────────────────────────────────────────────────────────────────────"

# 1. Start ML Orchestrator
echo ""
echo "1️⃣  Starting ML Orchestrator..."
echo "   • Fetches latest 6 chunks every 30 seconds"
echo "   • Runs Isolation Forest anomaly detection"
echo "   • Trains Prophet on all historical data every 60 seconds"
python3 continuous_orchestrator.py > logs/ml-pipeline.log 2>&1 &
ML_PID=$!
echo "   ✅ ML Pipeline PID: $ML_PID"
sleep 3

# 2. Start Plotly Dash Dashboard
echo ""
echo "2️⃣  Starting Plotly Dash Dashboard..."
echo "   • Auto-refreshes every 5 seconds"
echo "   • Shows anomaly detection results"
echo "   • Shows Prophet forecasts"
python3 dash_dashboard_continuous.py > logs/dash-pipeline.log 2>&1 &
DASH_PID=$!
echo "   ✅ Dashboard PID: $DASH_PID"
sleep 3

# 3. Start Prometheus port forward
echo ""
echo "3️⃣  Starting Prometheus port forward..."
kubectl port-forward -n monitoring svc/prometheus-operated 9090:9090 --address=0.0.0.0 > /dev/null 2>&1 &
PROM_PID=$!
echo "   ✅ Prometheus PID: $PROM_PID"

# 4. Start Grafana port forward
echo ""
echo "4️⃣  Starting Grafana port forward..."
kubectl port-forward -n monitoring svc/grafana-standalone 4000:3000 --address=0.0.0.0 > /dev/null 2>&1 &
GRAFANA_PID=$!
echo "   ✅ Grafana PID: $GRAFANA_PID"

# 5. Start AlertManager port forward
echo ""
echo "5️⃣  Starting AlertManager port forward..."
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-alertmanager 9093:9093 --address=0.0.0.0 > /dev/null 2>&1 &
AM_PID=$!
echo "   ✅ AlertManager PID: $AM_PID"

sleep 3

echo ""
echo "╔════════════════════════════════════════════════════════════════════════╗"
echo "║                    ✅ PIPELINE RUNNING                                ║"
echo "╚════════════════════════════════════════════════════════════════════════╝"
echo ""

echo "📊 DASHBOARDS & MONITORING:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📈 GRAFANA (K8s Metrics)"
echo "   🌐 http://localhost:4000"
echo "   👤 admin | 🔑 admin123"
echo ""
echo "🔍 PROMETHEUS (Metrics Explorer)"
echo "   🌐 http://localhost:9090"
echo ""
echo "📊 PLOTLY DASH (ML & Prophet Results) ⭐"
echo "   🌐 http://localhost:8050"
echo "   📈 Auto-refreshes every 5 seconds"
echo "   🧠 Anomaly Detection Results"
echo "   🔮 Prophet Time Series Forecasts"
echo ""
echo "🚨 ALERTMANAGER"
echo "   🌐 http://localhost:9093"
echo ""

echo "🔄 CONTINUOUS PIPELINE FLOW:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📥 Every 30 Seconds:"
echo "   1. Fetch latest 6 chunks from MongoDB"
echo "   2. Extract 16 ML features"
echo "   3. Train Isolation Forest"
echo "   4. Detect anomalies"
echo "   5. Save to anomaly_detection_results.json"
echo ""
echo "📥 Every 60 Seconds:"
echo "   1. Fetch ALL historical chunks"
echo "   2. Train Prophet on complete history"
echo "   3. Forecast 4 metrics (latency, CPU, memory, queue)"
echo "   4. Calculate 95% confidence intervals"
echo "   5. Save to forecast_results.json"
echo ""
echo "🔄 Continuous:"
echo "   • MongoDB stream listening"
echo "   • Dashboard auto-refreshing"
echo "   • Results updating in real-time"
echo ""

echo "📋 LOG FILES:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "tail -f logs/ml-pipeline.log        (ML Orchestrator logs)"
echo "tail -f logs/dash-pipeline.log      (Dashboard logs)"
echo ""

echo "🛑 TO STOP PIPELINE:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "pkill -f continuous_orchestrator"
echo "pkill -f dash_dashboard_continuous"
echo "pkill -f 'kubectl port-forward -n monitoring'"
echo ""

echo "📊 LIVE MONITORING:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "To see live pipeline statistics:"
echo "watch 'tail logs/ml-pipeline.log | tail -20'"
echo ""

echo "✨ EVERYTHING IS RUNNING! Check dashboards at:"
echo ""
echo "   📊 Plotly Dash:  http://localhost:8050  ⭐ ML Results"
echo "   📈 Grafana:      http://localhost:4000  (K8s Metrics)"
echo "   🔍 Prometheus:   http://localhost:9090  (Metrics Explorer)"
echo ""

# Save PIDs
echo "
ML_PIPELINE_PID=$ML_PID
DASH_PIPELINE_PID=$DASH_PID
PROMETHEUS_PID=$PROM_PID
GRAFANA_PID=$GRAFANA_PID
ALERTMANAGER_PID=$AM_PID
" > .pipeline_pids

echo "✅ Pipeline fully started and running!"
echo ""
