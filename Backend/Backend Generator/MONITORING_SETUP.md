# Kubernetes Monitoring with Prometheus & Grafana (Helm)

## 🎯 Overview

This monitoring setup provides complete observability for your Kubernetes cluster using:
- **Prometheus**: Metrics collection and time-series database
- **Grafana**: Visualization and dashboarding
- **Helm**: Automated deployment and management
- **ServiceMonitor**: Custom resource for pod monitoring configuration

---

## 📦 What Was Deployed

### 1. **Prometheus Stack Components**
```
prometheus-community/kube-prometheus-stack includes:
├── Prometheus Operator
├── Prometheus
├── Grafana
├── AlertManager
├── Node Exporter (system metrics)
└── Kube State Metrics (Kubernetes state)
```

### 2. **Monitoring Stack Overview**
```
┌─────────────────────────────────────────────────┐
│         All Kubernetes Pods                     │
│  (including log-generator & system pods)        │
└──────────────────┬──────────────────────────────┘
                   ↓
        ┌─────────────────────────┐
        │  ServiceMonitor/         │
        │  PodMonitor              │
        │  (scrape config)         │
        └──────────┬───────────────┘
                   ↓
    ┌──────────────────────────┐
    │  Prometheus             │
    │  (metrics storage)       │
    │  Port: 9090            │
    └──────────┬──────────────┘
               ↓
    ┌──────────────────────────┐
    │  Grafana                │
    │  (visualization)        │
    │  Port: 3000             │
    └──────────────────────────┘
```

---

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

```bash
cd Backend/"Backend Generator"

# Make script executable
chmod +x setup-monitoring.sh

# Run the setup script
./setup-monitoring.sh
```

### Option 2: Manual Setup

```bash
# 1. Start Minikube
minikube start --cpus=4 --memory=4096

# 2. Add Helm repositories
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

# 3. Create monitoring namespace
kubectl create namespace monitoring

# 4. Deploy Prometheus Stack
helm install prometheus prometheus-community/kube-prometheus-stack \
  -f prometheus-values.yaml \
  -n monitoring

# 5. Apply ServiceMonitors
kubectl apply -f servicemonitor.yaml

# 6. Apply Grafana config
kubectl apply -f grafana-config.yaml
```

---

## 🔌 Access the Dashboards

### **Grafana (Visualization Dashboard)**

```bash
# Terminal 1: Port forward Grafana
kubectl port-forward -n monitoring svc/prometheus-grafana 4000:4000
```

Then open: **http://localhost:4000**

**Credentials:**
- Username: `admin`
- Password: `admin123`

### **Prometheus (Metrics Exploration)**

```bash
# Terminal 2: Port forward Prometheus
kubectl port-forward -n monitoring svc/prometheus-operated 9090:9090
```

Then open: **http://localhost:9090**

### **AlertManager (Alerts)**

```bash
# Terminal 3: Port forward AlertManager
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-alertmanager 9093:9093
```

Then open: **http://localhost:9093**

---

## 📊 What's Being Monitored

### **System Metrics (Automatic)**
- Pod CPU usage
- Pod memory usage
- Node CPU usage
- Node memory usage
- Pod network I/O
- Container disk usage
- Pod restart count
- Pod phase (Running/Pending/Failed)

### **Log Generator Pod (Custom)**
- Pod status (up/down)
- CPU usage
- Memory usage
- Network throughput
- Container metrics
- Custom application metrics (if exposed on port 8000)

### **Kubernetes Cluster**
- Node status
- Node capacity
- Pod count by namespace
- Pod count by status
- API server requests
- Etcd metrics

---

## 🎨 Available Metrics in Prometheus

### Common Queries to Try in Prometheus UI (http://localhost:9090):

```promql
# Pod CPU usage
sum(rate(container_cpu_usage_seconds_total[5m])) by (pod_name)

# Pod Memory in MB
sum(container_memory_working_set_bytes) by (pod_name) / 1024 / 1024

# Pod Network Receive (bytes/sec)
sum(rate(container_network_receive_bytes_total[5m])) by (pod_name)

# Log Generator Pod Status
up{namespace="default", pod="log-generator"}

# All pods in default namespace
count(kube_pod_info{namespace="default"})

# Pod restart count
kube_pod_container_status_restarts_total
```

---

## 📋 Configuration Files

### **prometheus-values.yaml**
- Prometheus storage: 10GB, 30-day retention
- Grafana pre-configured with Prometheus datasource
- AlertManager enabled with 2GB storage
- Node Exporter for system metrics
- ServiceMonitor selector to catch all custom monitors

### **servicemonitor.yaml**
- **Service**: `log-generator-metrics` - Exposes metrics on port 8000
- **ServiceMonitor**: Tells Prometheus to scrape log-generator metrics
- **PodMonitor**: Generic pod monitoring across all namespaces

### **grafana-config.yaml**
- Pre-configured Prometheus datasource
- LoadBalancer service for Grafana access
- Dashboard ConfigMap (ready for dashboard JSON)

---

## 🔍 Monitoring the Log Generator Pod

The log generator pod is automatically monitored through:

1. **Kubernetes Metrics** (automatic)
   - Pod CPU/Memory/Network
   - Pod status
   - Container metrics

2. **Custom Metrics** (if exposed)
   - ServiceMonitor scrapes `:8000/metrics`
   - Prometheus stores these metrics
   - Available in Grafana queries

3. **Log Metrics** (from your ML pipeline)
   - Chunk processing rate
   - Anomaly detection results
   - Feature extraction metrics

---

## 🛠️ Common Operations

### Check Prometheus Targets

```bash
kubectl port-forward -n monitoring svc/prometheus-operated 9090:9090
# Open http://localhost:9090/targets
```

### View Grafana Data Sources

```bash
# In Grafana UI (http://localhost:3000)
# Navigate to: Configuration → Data Sources
# Should see "Prometheus" pre-configured
```

### Check ServiceMonitor Status

```bash
# See all ServiceMonitors
kubectl get servicemonitor -n monitoring

# Describe log-generator monitor
kubectl describe servicemonitor log-generator-monitor -n monitoring
```

### View Pod Metrics

```bash
# SSH to Prometheus pod and query
kubectl exec -it prometheus-prometheus-kube-prometheus-prometheus-0 -n monitoring -- \
  curl http://localhost:9090/api/v1/query?query=up
```

### Increase Monitoring Detail

Edit prometheus-values.yaml and change:
```yaml
prometheus:
  prometheusSpec:
    retention: 30d  # Increase storage duration
```

Then upgrade:
```bash
helm upgrade prometheus prometheus-community/kube-prometheus-stack \
  -f prometheus-values.yaml \
  -n monitoring
```

---

## 🐛 Troubleshooting

### Grafana Not Loading

```bash
# Check Grafana pod
kubectl get pods -n monitoring | grep grafana

# Check logs
kubectl logs -n monitoring -l app.kubernetes.io/name=grafana --tail=50

# Fix: Clear volume and redeploy
helm uninstall prometheus -n monitoring
kubectl delete pvc -n monitoring --all
helm install prometheus prometheus-community/kube-prometheus-stack \
  -f prometheus-values.yaml -n monitoring
```

### Prometheus Not Scraping Targets

```bash
# Check ServiceMonitor
kubectl get servicemonitor -n monitoring
kubectl describe servicemonitor log-generator-monitor -n monitoring

# Verify service exists
kubectl get svc -n default | grep log-generator

# Check Prometheus targets
# Open http://localhost:9090/targets
```

### ServiceMonitor Not Working

```bash
# Ensure Prometheus operator sees the monitor
kubectl logs -n monitoring prometheus-kube-prometheus-operator-* | tail -20

# Verify label selectors match
kubectl get servicemonitor -n monitoring -o yaml | grep -A5 selector
kubectl get svc -n default -o yaml | grep -A5 labels
```

---

## 📈 Creating Custom Dashboards in Grafana

1. Open Grafana: **http://localhost:3000**
2. Click **"+"** → **"Dashboard"**
3. Click **"Add Panel"**
4. In query section, select **Prometheus** datasource
5. Enter PromQL query (examples above)
6. Configure visualization (graph, gauge, stat, etc.)
7. Save dashboard

### Dashboard Ideas

- **CPU & Memory**: Monitor all pod resource usage
- **Log Generator Health**: Uptime, throughput, error rate
- **Network Traffic**: Pod network I/O over time
- **Error Rates**: Application error metrics
- **Custom Metrics**: From your ML pipeline

---

## 🔐 Security Notes

⚠️ **For Production:**
- Change Grafana admin password (`admin123` → strong password)
- Implement RBAC for Prometheus access
- Use TLS/HTTPS for Grafana
- Restrict metric endpoint access
- Set up proper network policies

---

## 📚 Helpful Commands

```bash
# View all monitoring resources
kubectl get all -n monitoring

# Check Helm release status
helm status prometheus -n monitoring

# View Helm values used
helm get values prometheus -n monitoring

# Upgrade monitoring stack
helm upgrade prometheus prometheus-community/kube-prometheus-stack \
  -f prometheus-values.yaml -n monitoring

# Uninstall everything
helm uninstall prometheus -n monitoring
kubectl delete namespace monitoring

# Check resource usage of monitoring stack
kubectl top pods -n monitoring
kubectl top nodes
```

---

## 🔗 Related Documentation

- [Prometheus Operator](https://prometheus-operator.dev/)
- [ServiceMonitor CRD](https://prometheus-operator.dev/docs/operator/api/#servicemonitor)
- [Grafana Documentation](https://grafana.com/docs/grafana/latest/)
- [PromQL Query Language](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [kube-prometheus-stack Helm Chart](https://github.com/prometheus-community/helm-charts/tree/main/charts/kube-prometheus-stack)

---

## ✅ Monitoring Checklist

- [x] Minikube cluster running
- [x] Helm installed
- [x] Prometheus stack deployed
- [x] Grafana accessible at http://localhost:3000
- [x] ServiceMonitor created for log-generator
- [x] PodMonitor for all pods enabled
- [x] Prometheus targets healthy
- [x] Grafana datasource configured
- [ ] Custom dashboards created
- [ ] Alerts configured (optional)

---

**Setup Date**: March 27, 2026
**Monitoring Version**: kube-prometheus-stack v60.x
