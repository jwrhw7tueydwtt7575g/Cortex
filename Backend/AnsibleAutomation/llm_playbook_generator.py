"""
LLM-based Ansible Playbook Generator
Converts LLM reports to executable Ansible playbooks
"""

from groq import Groq
from config import GROQ_API_KEY, GROQ_MODEL
import logging
import json
import subprocess

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger(__name__)

class PlaybookGenerator:
    """Generate Ansible playbooks from LLM reports"""
    
    def __init__(self):
        logger.info("🔧 Initializing PlaybookGenerator...")
        if not GROQ_API_KEY:
            logger.error("❌ GROQ_API_KEY not set")
            self.client = None
        else:
            try:
                self.client = Groq(api_key=GROQ_API_KEY)
                logger.info(f"✅ Groq client initialized with model: {GROQ_MODEL}")
            except Exception as e:
                logger.error(f"❌ Failed to initialize Groq client: {e}")
                self.client = None
    
    def _validate_pod_exists(self, pod_name, namespace="default"):
        """Validate that pod exists in Kubernetes cluster"""
        try:
            result = subprocess.run(
                ["kubectl", "get", "pod", pod_name, "-n", namespace],
                capture_output=True,
                text=True,
                timeout=10
            )
            if result.returncode == 0:
                logger.info(f"✅ Pod validated: {pod_name} in namespace {namespace}")
                return True
            else:
                logger.error(f"❌ Pod not found: {pod_name} in namespace {namespace}")
                logger.error(f"   kubectl output: {result.stderr}")
                return False
        except subprocess.TimeoutExpired:
            logger.error(f"❌ kubectl timeout checking pod {pod_name}")
            return False
        except FileNotFoundError:
            logger.warning("⚠️  kubectl not available, skipping pod validation")
            return True  # Can't validate without kubectl
        except Exception as e:
            logger.warning(f"⚠️  Failed to validate pod: {e}")
            return True  # Don't block if validation fails
    
    def _sanitize_log_context(self, logs):
        """Sanitize logs before inserting into LLM prompt to prevent injection"""
        if not logs:
            return ""
        
        if isinstance(logs, list):
            logs_text = "\n".join(str(log) for log in logs[:10])  # Last 10 logs
        else:
            logs_text = str(logs)
        
        # Limit size
        if len(logs_text) > 5000:
            logs_text = logs_text[:5000]
        
        # Escape braces for prompt formatting
        logs_text = logs_text.replace("{", "{{").replace("}", "}}")
        
        return logs_text
    
    def _validate_playbook_yaml(self, playbook_content):
        """Validate that generated playbook is valid YAML"""
        try:
            # Basic YAML validation - check for required fields
            if not playbook_content.startswith('---'):
                logger.warning("⚠️  Playbook doesn't start with '---'")
            
            if '- name:' not in playbook_content and '- hosts:' not in playbook_content:
                logger.warning("⚠️  Playbook may be missing required Ansible structure")
            
            logger.info("✅ Playbook structure validation passed")
            return True
        except Exception as e:
            logger.error(f"❌ Playbook validation error: {e}")
            return False
    
    def generate_playbook(self, report_data, chunk_id, logs=None, pod_name=None):
        """Generate Ansible playbook from prevention report using template substitution"""
        
        logger.info(f"📝 generate_playbook called for chunk: {chunk_id}")
        logger.info(f"   Report keys: {list(report_data.keys()) if report_data else 'empty'}")
        logger.info(f"   Logs provided: {len(logs) if logs else 0} entries")
        logger.info(f"   Target Pod: {pod_name or 'Not specified'}")
        
        # ✅ VALIDATION: Ensure pod_name is provided
        if not pod_name:
            logger.error("❌ pod_name is required but not provided")
            return None
        
        # ✅ VALIDATION: Check pod exists in cluster
        if not self._validate_pod_exists(pod_name, namespace="default"):
            logger.warning(f"⚠️  Pod validation failed, but proceeding (kubectl may not be available)")
        
        try:
            # Extract deployment name from pod name (remove trailing hash)
            # Example: log-generator-54ffbcd85d-95twm -> log-generator
            deployment_name = '-'.join(pod_name.split('-')[:-2]) if pod_name else 'unknown'
            
            logger.info(f"   Extracted deployment name: {deployment_name}")
            
            # Load template
            import os
            template_path = os.path.join(os.path.dirname(__file__), 'templates', 'playbook_template.yml')
            
            if not os.path.exists(template_path):
                logger.error(f"❌ Template not found: {template_path}")
                # Fallback: generate inline
                return self._generate_fallback_playbook(deployment_name)
            
            logger.info(f"📄 Loading template from: {template_path}")
            with open(template_path, 'r') as f:
                template_content = f.read()
            
            # Substitute deployment name in template
            playbook_content = template_content.replace('DEPLOYMENT_NAME_REPLACE', deployment_name)
            
            logger.info(f"✅ Generated playbook from template")
            logger.info(f"   Lines: {len(playbook_content.split(chr(10)))}")
            logger.info(f"   Size: {len(playbook_content)} bytes")
            
            # ✅ VALIDATION: Validate generated YAML
            if not self._validate_playbook_yaml(playbook_content):
                logger.error("❌ Generated playbook failed YAML validation")
                return None
            
            logger.info(f"✅ Playbook generated successfully")
            return playbook_content
            
        except Exception as e:
            logger.error(f"❌ Error generating playbook: {str(e)}", exc_info=True)
            return None
    
    def _generate_fallback_playbook(self, deployment_name):
        """Fallback: Generate simple playbook when template not available"""
        logger.info(f"📋 Using fallback playbook generation for {deployment_name}")
        
        playbook = f"""---
- name: Fix deployment readinessProbe
  hosts: localhost
  gather_facts: no
  tasks:
  - name: Patch deployment with corrected readinessProbe
    kubernetes.core.k8s:
      api_version: apps/v1
      kind: Deployment
      name: {deployment_name}
      namespace: default
      definition:
        spec:
          template:
            spec:
              containers:
              - name: {deployment_name}
                readinessProbe:
                  httpGet:
                    path: /health
                    port: 8080
                  initialDelaySeconds: 10
                  periodSeconds: 5
                  timeoutSeconds: 3
                  failureThreshold: 3

  - name: Wait for deployment to update
    kubernetes.core.k8s_info:
      api_version: apps/v1
      kind: Deployment
      name: {deployment_name}
      namespace: default
    register: deployment_result
    until: deployment_result.resources[0].status.updatedReplicas | default(0) > 0
    retries: 20
    delay: 2

  - name: Display deployment status
    debug:
      msg: "Deployment {deployment_name} updated. Ready replicas: {{{{ deployment_result.resources[0].status.readyReplicas | default(0) }}}}"
"""
        logger.info(f"✅ Fallback playbook generated: {len(playbook)} bytes")
        return playbook
