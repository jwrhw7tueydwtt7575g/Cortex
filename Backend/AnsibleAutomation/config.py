"""
Configuration for Ansible Automation Service
"""

import os
from dotenv import load_dotenv

load_dotenv()

# LLM Configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "gsk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

# Kubernetes Configuration
KUBERNETES_ENABLED = os.getenv("KUBERNETES_ENABLED", "true").lower() == "true"
KUBECTL_PATH = os.getenv("KUBECTL_PATH", "kubectl")

# Ansible Configuration
ANSIBLE_PLAYBOOKS_DIR = os.getenv("ANSIBLE_PLAYBOOKS_DIR", "./playbooks")
ANSIBLE_VAULT_FILE = os.getenv("ANSIBLE_VAULT_FILE", None)

# Logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

# API Configuration
API_PORT = int(os.getenv("API_PORT", 5001))
API_HOST = os.getenv("API_HOST", "0.0.0.0")

# Database - for tracking automation runs
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb+srv://XXXXXX:XXXXXX@XXXXXX.mongodb.net/")
DB_NAME = "tesseract26"
AUTOMATION_COLLECTION = "automation_runs"

print("""
╔════════════════════════════════════════════════════════════╗
║       🤖 Ansible Automation Service Configuration         ║
╚════════════════════════════════════════════════════════════╝

✅ GROQ LLM Model: {}
✅ Kubernetes Enabled: {}
✅ Playbooks Directory: {}
✅ API Running on: http://{}:{}

""".format(
    GROQ_MODEL,
    KUBERNETES_ENABLED,
    ANSIBLE_PLAYBOOKS_DIR,
    API_HOST,
    API_PORT
))
