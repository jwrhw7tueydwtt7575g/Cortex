# HELM Prometheus & Grafana Monitoring Setup - Complete

## ✅ SETUP COMPLETE!

Your Kubernetes cluster monitoring with Prometheus and Grafana has been successfully set up!

---

## 📊 What Was Deployed

### **Prometheus Stack (via Helm)**
- ✅ **Prometheus**: Metrics collection & time-series database (9090)
- ✅ **Grafana**: Visualization dashboard (3000)
- ✅ **AlertManager**: Alert routing & management (9093)
- ✅ **Kube-State-Metrics**: Kubernetes object metrics
- ✅ **Node-Exporter**: System-level metrics
- ✅ **Prometheus Operator**: Kubernetes operator for Prometheus

### **Custom Monitoring**
- ✅ **ServiceMonitor**: `log-generator-monitor` for log-generator pod
- ✅ **PodMonitor**: `pod-monitor-all` for all pods across namespaces
- ✅ **Service**: `log-generator-metrics` exposing metrics on port 8000

### **Namespace**
- ✅ **monitoring**: Dedicated namespace for all monitoring components

---

## 🚀 Quick Access

### **Option 1: Automated Dashboard Access** (Recommended)
```bash
cd Backend/"Backend Generator"
bash access-monitoring.sh
```
This will:
- Set up port forwarding for Grafana, Prometheus, and AlertManager
- Display connection information
- Optionally open dashboards in your browser

### **Option 2: Manual Port Forwarding**

**Terminal 1 - Grafana (Visualization)**
```bash
kubectl port-forward -n monitoring svc/prometheus-grafana 4000:4000
# Open: http://localhost:4000
# Login: admin / admin123
```

**Terminal 2 - Prometheus (Metrics Explorer)**
```bash
kubectl port-forward -n monitoring svc/prometheus-operated 9090:9090
# Open: http://localhost:9090
```

**Terminal 3 - AlertManager**
```bash
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-alertmanager 9093:9093
# Open: http://localhost:9093
```

---

## 📈 What You Can Monitor

### **Pod Metrics** (Log Generator & All Pods)
```
✅ CPU Usage (cores and percentage)
✅ Memory Usage (bytes and percentage)
✅ Network I/O (bytes in/out)
✅ Disk I/O (if available)
✅ Pod Status (Running/Pending/Failed)
✅ Container Restarts
✅ Pod Uptime
```

### **Node Metrics** (Kubernetes Nodes)
```
✅ Node CPU usage
✅ Node memory usage
✅ Node disk space
✅ Node network usage
✅ Node status (Ready/NotReady)
```

### **Kubernetes Cluster Metrics**
```
✅ API Server requests
✅ Etcd operations
✅ Kubelet metrics
✅ Total pod count
✅ Pod distribution by namespace
✅ Pod events and warnings
```

### **Log Generator Pod (Custom)**
```
✅ Pod up/down status
✅ Resource consumption
✅ Network throughput
✅ Custom application metrics (if exposed on :8000)
```

---

## 📁 Files Created

```
Backend Generator/
├── prometheus-values.yaml        # Helm values for Prometheus stack
├── servicemonitor.yaml           # ServiceMonitor & PodMonitor configs
├── grafana-config.yaml           # Grafana services & dashboards
├── setup-monitoring.sh           # Automated setup script
├── access-monitoring.sh          # Quick access script
└── MONITORING_SETUP.md           # Detailed documentation
```

---

## 🎯 Common Tasks

### View Prometheus Targets
1. Open http://localhost:9090/targets
2. See all services being scraped
3. Check status (UP/DOWN)

### Create a Custom Dashboard in Grafana
1. Open http://localhost:3000
2. Click **"+"** → **"Dashboard"**
3. Click **"Add Panel"**
4. Select **Prometheus** datasource
5. Enter PromQL query (see examples below)
6. Configure visualization
7. Save

### Monitor Log Generator Pod Metrics
In Prometheus or Grafana, use these queries:

```promql
# Pod CPU usage
sum(rate(container_cpu_usage_seconds_total{pod_name="log-generator"}[5m]))

# Pod Memory in MB
sum(container_memory_working_set_bytes{pod_name="log-generator"}) / 1024 / 1024

# Pod Network Receive (bytes/sec)
sum(rate(container_network_receive_bytes_total{pod_name="log-generator"}[5m]))

# Log Generator Pod Status
up{job="log-generator"}

# All pods in default namespace
count(kube_pod_info{namespace="default"})

# Pod restart count
kube_pod_container_status_restarts_total
```

### Check ServiceMonitor Status
```bash
# List all ServiceMonitors
kubectl get servicemonitor -n monitoring

# Describe log-generator monitor
kubectl describe servicemonitor log-generator-monitor -n monitoring

# Check if Prometheus sees the targets
kubectl exec -n monitoring prometheus-prometheus-kube-prometheus-prometheus-0 \
  -- curl http://localhost:9090/api/v1/targets
```

### View Logs
```bash
# Prometheus logs
kubectl logs -n monitoring -l app.kubernetes.io/name=prometheus -f

# Grafana logs
kubectl logs -n monitoring -l app.kubernetes.io/name=grafana -f

# Operator logs
kubectl logs -n monitoring -l app.kubernetes.io/name=kube-prometheus-operator -f
```

---

## 🔧 Configuration Details

### **Prometheus Storage**
- Retention: 30 days
- Size: 10GB
- Type: PersistentVolumeClaim

### **Grafana**
- Admin Password: `admin123` (change in production!)
- Pre-configured datasource: Prometheus
- Port: 4000
- Persistence: 5GB

### **AlertManager**
- Enabled with 2GB storage
- Ready for custom alert rules

---

## 🐛 Troubleshooting

### Grafana Won't Load
```bash
kubectl logs -n monitoring -l app.kubernetes.io/name=grafana --tail=50
# Common: Storage issues. Try:
helm uninstall prometheus -n monitoring
kubectl delete pvc -n monitoring --all
# Then redeploy
```

### Prometheus Not Scraping
```bash
# Check targets
kubectl exec -n monitoring prometheus-prometheus-kube-prometheus-prometheus-0 \
  -- curl http://localhost:9090/api/v1/targets | jq '.data.activeTargets'

# Check ServiceMonitor
kubectl get servicemonitor log-generator-monitor -n monitoring -o yaml

# Verify service exists
kubectl get svc log-generator-metrics -n default
```

### ServiceMonitor Not Working
```bash
# Check Prometheus operator logs
kubectl logs -n monitoring -l app.kubernetes.io/name=kube-prometheus-operator

# Verify selector labels match
kubectl get servicemonitor -n monitoring -o yaml | grep -A5 selector
kubectl get svc -n default log-generator-metrics -o yaml | grep -A5 labels
```

---

## 📊 Monitoring Stack Info

```
Namespace: monitoring
Release: prometheus
Chart: kube-prometheus-stack
Version: Helm chart v60.x
```

### Active Components
```
✅ Prometheus Operator
✅ Prometheus
✅ Grafana
✅ AlertManager
✅ Kube-State-Metrics
✅ Node-Exporter
✅ ServiceMonitor (log-generator)
✅ PodMonitor (all pods)
```

---

## 🔗 Useful Commands Cheat Sheet

```bash
# Check all monitoring resources
kubectl get all -n monitoring

# Get pod metrics
kubectl top pods -n monitoring
kubectl top nodes

# Port forwarding (manual)
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80
kubectl port-forward -n monitoring svc/prometheus-operated 9090:9090
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-alertmanager 9093:9093

# View Helm release
helm status prometheus -n monitoring
helm get values prometheus -n monitoring

# Upgrade Prometheus
helm upgrade prometheus prometheus-community/kube-prometheus-stack \
  -f prometheus-values.yaml -n monitoring

# Uninstall (if needed)
helm uninstall prometheus -n monitoring
kubectl delete namespace monitoring
```

---

## 📚 Next Steps

1. **Create Custom Dashboards**
   - Log into Grafana (http://localhost:4000)
   - Create dashboards for your specific metrics
   - Save and share dashboards

2. **Configure Alerts**
   - Set up alert rules in Prometheus
   - Configure AlertManager routing
   - Send alerts to Slack, PagerDuty, etc.

3. **Add More Monitors**
   - Create ServiceMonitors for other applications
   - Add PodMonitors for specific namespaces
   - Configure custom scrape configs

4. **Optimize Performance**
   - Adjust retention period in `prometheus-values.yaml`
   - Configure storage class for better performance
   - Set resource requests/limits based on your needs

---

## 🎓 Learning Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Dashboards](https://grafana.com/grafana/dashboards/)
- [PromQL Query Language](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [kube-prometheus-stack](https://github.com/prometheus-community/helm-charts/tree/main/charts/kube-prometheus-stack)
- [ServiceMonitor CRD](https://prometheus-operator.dev/docs/operator/api/#servicemonitor)

---

## ✨ Summary

Your Kubernetes monitoring stack is now ready! You have:

- ✅ Prometheus running and collecting metrics
- ✅ Grafana configured for visualization
- ✅ ServiceMonitor set up for log-generator pod
- ✅ PodMonitor for all pods across namespaces
- ✅ AlertManager ready for alerting
- ✅ All the tools to monitor your cluster

**Start by running:**
```bash
bash access-monitoring.sh
```

Then open Grafana at http://localhost:3000 and start creating dashboards!

---

**Setup completed**: March 27, 2026
**Deployment method**: Helm with kube-prometheus-stack
