#!/bin/bash

# ============================================================================
# KUBERNETES MONITORING SETUP SCRIPT
# Setup Prometheus & Grafana monitoring for all pods using Helm
# ============================================================================

set -e

echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║  Kubernetes Monitoring Setup with Prometheus & Grafana via Helm     ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"

# ============================================================================
# STEP 1: START MINIKUBE
# ============================================================================
echo ""
echo "📦 STEP 1: Checking Minikube cluster..."
if minikube status | grep -q "Stopped"; then
    echo "🚀 Starting Minikube..."
    minikube start --cpus=4 --memory=4096
else
    echo "✅ Minikube already running"
fi

# ============================================================================
# STEP 2: VERIFY HELM INSTALLATION
# ============================================================================
echo ""
echo "📦 STEP 2: Checking Helm installation..."
if ! command -v helm &> /dev/null; then
    echo "❌ Helm not found. Install from: https://helm.sh"
    exit 1
else
    echo "✅ Helm found: $(helm version --short)"
fi

# ============================================================================
# STEP 3: ADD HELM REPOSITORIES
# ============================================================================
echo ""
echo "📦 STEP 3: Adding Helm repositories..."
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts 2>/dev/null || true
helm repo add grafana https://grafana.github.io/helm-charts 2>/dev/null || true
helm repo update

echo "✅ Helm repositories updated"

# ============================================================================
# STEP 4: CREATE MONITORING NAMESPACE
# ============================================================================
echo ""
echo "📦 STEP 4: Creating monitoring namespace..."
kubectl create namespace monitoring 2>/dev/null || echo "⚠️  Namespace already exists"

# ============================================================================
# STEP 5: GET SCRIPT DIRECTORY
# ============================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ============================================================================
# STEP 6: DEPLOY PROMETHEUS STACK
# ============================================================================
echo ""
echo "📦 STEP 5: Installing Prometheus Stack with Helm..."
helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
    -f "$SCRIPT_DIR/prometheus-values.yaml" \
    -n monitoring \
    --wait

echo "✅ Prometheus stack deployed"

# ============================================================================
# STEP 7: APPLY SERVICE MONITORS
# ============================================================================
echo ""
echo "📦 STEP 6: Applying ServiceMonitors for pod monitoring..."
kubectl apply -f "$SCRIPT_DIR/servicemonitor.yaml"

echo "✅ ServiceMonitors applied"

# ============================================================================
# STEP 8: WAIT FOR PODS
# ============================================================================
echo ""
echo "📦 STEP 7: Waiting for pods to be ready..."
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=prometheus \
    -n monitoring --timeout=120s 2>/dev/null || true
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=grafana \
    -n monitoring --timeout=120s 2>/dev/null || true

# ============================================================================
# STEP 9: DISPLAY ACCESS INFORMATION
# ============================================================================
echo ""
echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║                  ✅ SETUP COMPLETE                                  ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"

echo ""
echo "📊 PROMETHEUS:"
echo "   Port: 9090"
echo "   Access: http://localhost:9090"
echo "   Setup: kubectl port-forward -n monitoring svc/prometheus-operated 9090:9090"

echo ""
echo "📈 GRAFANA:"
echo "   Port: 4000"
echo "   Access: http://localhost:4000"
echo "   Username: admin"
echo "   Password: admin123"
echo "   Setup: kubectl port-forward -n monitoring svc/prometheus-grafana 4000:4000"

echo ""
echo "📋 ALERTMANAGER:"
echo "   Port: 9093"
echo "   Access: http://localhost:9093"
echo "   Setup: kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-alertmanager 9093:9093"

echo ""
echo "🔍 MONITORING STATUS:"
kubectl get pods -n monitoring
echo ""
echo "🔗 SERVICEmonitor STATUS:"
kubectl get servicemonitor -n monitoring
echo ""

echo "✅ Setup complete! Start port forwarding in a new terminal window:"
echo ""
echo "   # Grafana"
echo "   kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80"
echo ""
echo "   # Then open http://localhost:3000 in your browser"
echo ""
