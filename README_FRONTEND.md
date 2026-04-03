# 🎨 Cortex - Frontend Documentation

**Cortex Frontend** is a modern Next.js dashboard that visualizes Kubernetes monitoring data, displays LLM-generated prevention reports, and triggers automated remediation through an intuitive UI.

## 📱 Frontend Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CORTEX FRONTEND (Next.js)                    │
└─────────────────────────────────────────────────────────────────┘

                        ┌──────────────────┐
                        │  Navbar (Menu)   │
                        │  - Sections      │
                        │  - Integration   │
                        └────────┬─────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
    ┌────▼─────────┐      ┌──────▼──────┐      ┌────────▼────────┐
    │  Dashboard   │      │  Reports    │      │  Automation     │
    │  Tab         │      │  Tab        │      │  Tab            │
    └──────────────┘      └─────────────┘      └─────────────────┘
         │                       │                       │
    • Monitoring             • Latest Reports        • Triggers
    • Metrics                • Risk Levels           • Timeline
    • Status                 • View/Automate         • Results
```

## 🗂️ Project Structure

```
Frontend/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page
│   └── globals.css              # Global styles
│
├── components/                   # React Components
│   ├── Navbar.tsx               # Main navigation
│   ├── TabBar.tsx               # Tab selection
│   ├── TabContent.tsx           # Tab content switcher
│   │
│   ├── Dashboard Tab
│   │   ├── GrafanaTab.tsx       # Grafana metrics
│   │   ├── PrometheusTab.tsx    # Prometheus dashboard
│   │   ├── DashplotTab.tsx      # Dash dashboard embedding
│   │   └── MLflowTab.tsx        # ML experiments
│   │
│   ├── Reports Tab
│   │   └── ReportsTab.tsx       # Latest reports + automation
│   │
│   ├── Automation Tab
│   │   └── AutomateTab.tsx      # Trigger automation
│   │
│   ├── Integration Tab
│   │   └── IntegrationsTab.tsx  # API integration setup
│   │
│   ├── Credentials
│   │   ├── CredentialModal.tsx  # API key setup
│   │   └── credentials config   # Local storage
│   │
│   ├── UI Components
│   │   └── ui/                  # Radix UI components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       └── ... (20+ components)
│   │
│   ├── Visual Effects
│   │   ├── CloudBackground.tsx  # Animated clouds
│   │   ├── ParticleBackground.tsx # Particle animation
│   │   └── theme-provider.tsx   # Dark/light theme
│   │
│   └── Other
│       ├── Footer.tsx           # Footer section
│       └── ... utility components
│
├── hooks/                        # Custom React Hooks
│   ├── use-mobile.ts            # Responsive detection
│   ├── use-mounted.ts           # Hydration safe rendering
│   └── use-toast.ts             # Toast notifications
│
├── lib/                          # Utilities
│   └── utils.ts                 # Helper functions
│
├── styles/                       # CSS Styles
│   └── globals.css              # Global CSS
│
├── public/                       # Static assets
│   └── ... (images, icons)
│
└── Configuration Files
    ├── package.json             # Dependencies
    ├── tsconfig.json            # TypeScript config
    ├── next.config.mjs          # Next.js config
    ├── postcss.config.mjs       # PostCSS config
    ├── components.json          # Shadcn components
    └── .env.local               # Environment variables
```

## 🎯 Main Tabs & Features

### 1️⃣ **Dashboard Tab**

Comprehensive monitoring hub with multiple sub-tabs:

#### Grafana Monitoring
- **Purpose**: Real-time metrics visualization
- **Data Source**: Prometheus
- **Displays**:
  - Pod CPU usage
  - Pod memory usage
  - Network I/O
  - Request rates
  - Error rates
- **URL**: http://localhost:4000
- **Integration**: Embedded iframe

#### Prometheus Metrics
- **Purpose**: Raw metrics exploration
- **URL**: http://localhost:9090
- **Features**:
  - Query builder
  - Graph visualization
  - Time range selection
- **Integration**: Embedded iframe

#### Dash Dashboard
- **Purpose**: ML-specific visualizations
- **URL**: http://localhost:8050
- **Displays**:
  - Anomaly detection results
  - Feature distributions
  - Historical trends
  - Model performance
- **Refresh**: Every 30 seconds (auto)
- **Integration**: Embedded iframe

#### MLflow Experiments
- **Purpose**: ML model tracking
- **URL**: http://localhost:5000 (MLflow UI)
- **Displays**:
  - Model runs
  - Hyperparameters
  - Metrics history
  - Artifacts
- **Integration**: Embedded iframe

---

### 2️⃣ **Reports Tab**

Displays latest prevention reports and automation triggers.

**Features**:
- 📋 **Report List**: Latest 5 reports fetched from `GET http://localhost:5000/api/reports/top5`
- 🔴 **Risk Level Badge**: Color-coded (Low=Green, Medium=Yellow, High=Red)
- 📝 **Report Details**:
  - Chunk ID
  - Risk Level
  - Root Causes
  - Prevention Steps
  - Immediate Actions
- 🤖 **Automate Button**: Triggers automation with real-time timeline

**Automation Workflow**:
1. User clicks "Automate" button on a report
2. Frontend fetches logs for context: `GET http://localhost:5000/api/logs/<chunk_id>`
3. Sends to automation API: `POST http://localhost:5001/api/automate`
4. Starts polling automation status: `GET http://localhost:5001/api/automation/status/<chunk_id>`
5. Displays real-time timeline as automation progresses:
   - ✅ PLAYBOOK_GENERATION: success
   - ⏳ PLAYBOOK_SAVE: in_progress
   - ⏳ PLAYBOOK_EXECUTION: queued
6. Timeline updates every 2 seconds
7. Shows completion status with toast notification

**Report Card Display**:
```
┌─────────────────────────────────┐
│ Risk Level: [HIGH]              │
├─────────────────────────────────┤
│ Chunk ID: 69c6abaf167f          │
│ Timestamp: 2026-03-27 09:39     │
├─────────────────────────────────┤
│ Root Causes:                    │
│ • Pod OOMKilled                 │
│ • Memory leak detected          │
├─────────────────────────────────┤
│ Prevention Steps:               │
│ • Increase memory limit         │
│ • Enable profiling              │
├─────────────────────────────────┤
│ [View] [Automate]               │
├─────────────────────────────────┤
│ 🔄 Automation Timeline:         │
│ ✅ PLAYBOOK_GENERATION: success │
│ ⏳ PLAYBOOK_SAVE: in_progress   │
│ ⏳ PLAYBOOK_EXECUTION: queued    │
└─────────────────────────────────┘
```

---

### 3️⃣ **Automate Tab**

Manual automation trigger interface.

**Features**:
- 📝 Report input form
- 📋 Custom logs input
- 🎯 Manual trigger button
- 📊 Results display
- 🔄 Status tracking

**Payload Structure**:
```json
{
  "chunk_id": "manual_test_123",
  "report": {
    "risk_level": "High",
    "root_causes": ["CPU spike"],
    "prevention_steps": ["Scale pods"],
    "immediate_actions": ["Restart"]
  },
  "logs": ["CPU: 95%", "Memory: 80%"]
}
```

---

### 4️⃣ **Integrations Tab**

Setup and configuration interface.

**Features**:
- 🔑 API Key management
- 🔗 Endpoint configuration
- 📋 Service status checks
- 📚 Integration documentation
- ⚙️ Settings panel

**API Endpoints Configured**:
- LLM Reports API: `http://localhost:5000`
- Automation API: `http://localhost:5001`
- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:4000`
- Dash Dashboard: `http://localhost:8050`

---

### 5️⃣ **Additional Pages**

#### Credential Modal
- Modal popup for API key setup
- Secure local storage (sessionStorage/localStorage)
- Environment variable override support

#### Navbar
- Project branding
- Tab navigation
- Time display
- Status indicator

#### Footer
- Documentation links
- Support information
- Version info

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Next.js 14+
- All backend services running (see Backend README)

### Installation

```bash
cd Frontend
npm install
```

### Development

```bash
npm run dev
# Opens on http://localhost:3000
```

### Production Build

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

---

## 🔗 API Integration

### Frontend → Backend Communication

#### 1. Get Latest Reports
```javascript
// ReportsTab.tsx
const response = await fetch('http://localhost:5000/api/reports/top5');
const reports = await response.json();
```

**Response**:
```json
{
  "success": true,
  "count": 5,
  "reports": [
    {
      "_id": "...",
      "chunk_id": "69c6abaf167f",
      "risk_level": "High",
      "root_causes": [...],
      "prevention_steps": [...],
      "immediate_actions": [...]
    }
  ]
}
```

---

#### 2. Get Logs for Context
```javascript
const response = await fetch(`http://localhost:5000/api/logs/${chunkId}`);
const logsData = await response.json();
```

---

#### 3. Trigger Automation
```javascript
const response = await fetch('http://localhost:5001/api/automate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    chunk_id: report.chunk_id,
    report: report.report,
    logs: logsData.logs
  })
});
```

**Response**: 202 Accepted (automation runs in background)

---

#### 4. Poll Automation Status
```javascript
// Poll every 2 seconds
const pollStatus = setInterval(async () => {
  const response = await fetch(
    `http://localhost:5001/api/automation/status/${chunkId}`
  );
  const status = await response.json();
  
  // Update UI with timeline
  updateTimeline(status.timeline);
  
  // Stop polling if complete
  if (status.overall_status !== 'in_progress') {
    clearInterval(pollStatus);
  }
}, 2000);
```

**Response**:
```json
{
  "source": "cache",
  "chunk_id": "chunk_123",
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

---

## 🎨 UI Components

### Radix UI Components Used
- Button
- Card
- Dialog
- Tabs
- Input
- Badge
- Toast
- Skeleton
- Progress
- And 10+ more...

### Custom Components

#### ReportsTab
- Fetches and displays reports
- Handles automation flow
- Shows timeline
- Toast notifications

#### DashplotTab
- Embeds Dash iframe
- Auto-refresh on interval
- Error handling

#### GrafanaTab
- Embeds Grafana iframe
- Monitors K8s metrics
- Real-time updates

#### CloudBackground
- Animated SVG clouds
- Parallax scrolling
- Theme-aware colors

#### ParticleBackground
- Particle animation effect
- Canvas-based rendering
- Performance optimized

---

## 🌐 Environment Variables

Create `.env.local`:
```
NEXT_PUBLIC_LLM_API_URL=http://localhost:5000
NEXT_PUBLIC_AUTOMATION_API_URL=http://localhost:5001
NEXT_PUBLIC_PROMETHEUS_URL=http://localhost:9090
NEXT_PUBLIC_GRAFANA_URL=http://localhost:4000
NEXT_PUBLIC_DASH_URL=http://localhost:8050
```

---

## 📊 Data Flow

```
┌─────────────────┐
│ Reports Tab UI  │
└────────┬────────┘
         │
    ┌────▼─────────────────────┐
    │ Fetch latest reports      │
    │ GET /api/reports/top5     │
    └────┬──────────────────────┘
         │
    ┌────▼─────────────────────┐
    │ Display report cards      │
    │ Show risk levels          │
    └────┬──────────────────────┘
         │
    ┌────▼─────────────────────┐
    │ User clicks "Automate"    │
    └────┬──────────────────────┘
         │
    ┌────▼─────────────────────┐
    │ Fetch logs for context    │
    │ GET /api/logs/<chunk_id>  │
    └────┬──────────────────────┘
         │
    ┌────▼─────────────────────┐
    │ Send automation request   │
    │ POST /api/automate        │
    └────┬──────────────────────┘
         │
    ┌────▼─────────────────────────┐
    │ Poll status every 2 seconds   │
    │ GET /api/automation/status    │
    └────┬──────────────────────────┘
         │
    ┌────▼─────────────────────┐
    │ Update timeline UI        │
    │ Show stages in real-time  │
    └────┬──────────────────────┘
         │
    ┌────▼─────────────────────┐
    │ Poll until complete       │
    │ Show result toast         │
    └─────────────────────────┘
```

---

## 🔄 Real-Time Features

### Automation Timeline
- Real-time status updates every 2 seconds
- Stage-by-stage progress tracking
- Timestamps for each event
- Error details on failure
- Auto-stop polling when complete

### Auto-Refresh Dashboards
- Grafana: Real-time metrics
- Dash: 30-second refresh
- Prometheus: Configurable intervals
- MLflow: On-demand refresh

---

## 🐛 Troubleshooting

### Issue: "Failed to fetch reports"
**Solution**:
```bash
# Check if LLM Reports API is running
curl http://localhost:5000/api/reports/top5

# Check API in browser console for CORS errors
# Ensure backend is running on correct ports
```

### Issue: Automation not triggering
**Solution**:
```bash
# Check if Automation API is running
curl http://localhost:5001/api/automation/health

# Check browser console for request errors
# Verify API endpoints in Integrations tab
```

### Issue: Dashboard iframe not loading
**Solution**:
```bash
# Verify service is running
curl http://localhost:8050 (Dash)
curl http://localhost:4000 (Grafana)
curl http://localhost:9090 (Prometheus)

# Check CORS headers
# Update .env.local with correct URLs
```

### Issue: Slow UI/Unresponsive
**Solution**:
```bash
# Reduce polling frequency in ReportsTab.tsx
# Decrease iframe refresh rates
# Check browser resource usage (DevTools)
# Ensure backend services have adequate resources
```

---

## 📈 Performance Tips

1. **Reduce Polling**: Increase poll interval in ReportsTab
2. **Lazy Load**: Use React.lazy() for heavy components
3. **Optimize Images**: Compress logos and backgrounds
4. **Cache Data**: Implement client-side caching
5. **Minimize API Calls**: Batch requests when possible

---

## 🎨 Customization

### Changing Theme
Edit `components/theme-provider.tsx`:
```javascript
// Change primary color
--primary: hsl(0, 100%, 50%); // Red
```

### Adding New Tab
1. Create component in `components/NewTab.tsx`
2. Add to `TabBar.tsx` with tab name
3. Add to switch statement in `TabContent.tsx`
4. Add to routing logic

### Custom Animations
- Edit `CloudBackground.tsx` for background
- Edit `ParticleBackground.tsx` for particles
- Add Framer Motion for transitions

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Radix UI Components](https://www.radix-ui.com/docs/primitives)
- [TypeScript React Guide](https://www.typescriptlang.org/docs/handbook/react.html)
- [Backend Integration](README_BACKEND.md)
- [Full Project Architecture](README.md)

---

## 🔒 Security Notes

1. **Never commit API keys** to version control
2. **Use environment variables** for sensitive config
3. **Enable CORS** on backend only for frontend domain
4. **Validate user input** before sending to APIs
5. **Use HTTPS** in production
6. **Implement authentication** for production deployment

---

## 📝 Component Documentation

### ReportsTab.tsx
- Fetches reports from LLM API
- Displays risk levels
- Triggers automation
- Shows real-time timeline
- Handles errors gracefully

### DashplotTab.tsx
- Embeds Dash dashboard
- Auto-refresh every 30 seconds
- Shows ML metrics
- Responsive iframe

### GrafanaTab.tsx
- Embeds Grafana dashboards
- Real-time metrics
- Pre-configured queries
- Dark mode support

### AutomateTab.tsx
- Manual automation trigger
- Custom report input
- Logs submission
- Results tracking

### IntegrationsTab.tsx
- API key management
- Service status checks
- Configuration display
- Help documentation

