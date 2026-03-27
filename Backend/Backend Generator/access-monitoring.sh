#!/bin/bash

# ============================================================================
# QUICK ACCESS SCRIPT - Port Forward & Open Monitoring Dashboards
# ============================================================================

echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║     Kubernetes Monitoring - Dashboard Access                        ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"

# Function to open browser
open_browser() {
    local url=$1
    if command -v xdg-open &> /dev/null; then
        xdg-open "$url"
    elif command -v open &> /dev/null; then
        open "$url"
    else
        echo "🌐 Open in browser: $url"
    fi
}

# ============================================================================
# GRAFANA - VISUALIZATION DASHBOARD
# ============================================================================
echo ""
echo "📈 GRAFANA SETUP"
echo "─────────────────────────────────────────────────────────────────────"

# Check if port forward already running
if lsof -Pi :4000 -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ Port 4000 already forwarding"
else
    echo "🔌 Setting up Grafana port forward (4000)..."
    kubectl port-forward -n monitoring svc/prometheus-grafana 4000:4000 > /dev/null 2>&1 &
    PF_PID=$!
    echo "✅ Port forward started (PID: $PF_PID)"
    sleep 2
fi

echo "🌐 Grafana URL: http://localhost:4000"
echo "👤 Username: admin"
echo "🔑 Password: admin123"
echo ""
read -p "Open Grafana in browser? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    open_browser "http://localhost:4000"
fi

# ============================================================================
# PROMETHEUS - METRICS EXPLORER
# ============================================================================
echo ""
echo "🔍 PROMETHEUS SETUP"
echo "─────────────────────────────────────────────────────────────────────"

if lsof -Pi :9090 -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ Port 9090 already forwarding"
else
    echo "🔌 Setting up Prometheus port forward (9090)..."
    kubectl port-forward -n monitoring svc/prometheus-operated 9090:9090 > /dev/null 2>&1 &
    echo "✅ Port forward started"
    sleep 2
fi

echo "🌐 Prometheus URL: http://localhost:9090"
echo "   Targets: http://localhost:9090/targets"
echo "   Graph: http://localhost:9090/graph"
echo ""
read -p "Open Prometheus in browser? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    open_browser "http://localhost:9090"
fi

# ============================================================================
# ALERTMANAGER
# ============================================================================
echo ""
echo "🚨 ALERTMANAGER SETUP"
echo "─────────────────────────────────────────────────────────────────────"

if lsof -Pi :9093 -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ Port 9093 already forwarding"
else
    echo "🔌 Setting up AlertManager port forward (9093)..."
    kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-alertmanager 9093:9093 > /dev/null 2>&1 &
    echo "✅ Port forward started"
    sleep 2
fi

echo "🌐 AlertManager URL: http://localhost:9093"
echo ""
read -p "Open AlertManager in browser? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    open_browser "http://localhost:9093"
fi

# ============================================================================
# STATUS INFORMATION
# ============================================================================
echo ""
echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║                      MONITORING STATUS                              ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""

echo "📊 MONITORING PODS:"
kubectl get pods -n monitoring -o wide

echo ""
echo "🔗 SERVICE MONITORS:"
kubectl get servicemonitor -n monitoring

echo ""
echo "📋 POD MONITORS:"
kubectl get podmonitor -n monitoring

echo ""
echo "🎯 PROMETHEUS TARGETS (via API):"
kubectl exec -n monitoring prometheus-prometheus-kube-prometheus-prometheus-0 \
  -- curl -s http://localhost:9090/api/v1/targets 2>/dev/null | grep -o '"job":"[^"]*"' | sort -u

echo ""
echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║                    USEFUL COMMANDS                                   ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""
echo "View pod metrics:"
echo "  kubectl top pods -n monitoring"
echo ""
echo "View node metrics:"
echo "  kubectl top nodes"
echo ""
echo "Check Prometheus logs:"
echo "  kubectl logs -n monitoring prometheus-prometheus-kube-prometheus-prometheus-0"
echo ""
echo "Check Grafana logs:"
echo "  kubectl logs -n monitoring -l app.kubernetes.io/name=grafana"
echo ""
echo "Stop all port forwards:"
echo "  pkill -f 'kubectl port-forward -n monitoring'"
echo ""
echo "View active port forwards:"
echo "  lsof -i -P -n | grep LISTEN"
echo ""
