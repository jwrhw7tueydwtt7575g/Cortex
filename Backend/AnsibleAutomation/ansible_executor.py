"""
Ansible Playbook Executor
Runs generated playbooks and tracks execution
"""

import subprocess
import os
import signal
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger(__name__)

class AnsibleExecutor:
    """Execute Ansible playbooks"""
    
    def __init__(self, playbooks_dir="./playbooks"):
        self.playbooks_dir = playbooks_dir
        os.makedirs(playbooks_dir, exist_ok=True)
        logger.info(f"✅ Playbooks directory: {playbooks_dir}")
    
    def save_playbook(self, playbook_content, chunk_id):
        """Save playbook to file"""
        filename = f"playbook_{chunk_id[:16]}.yml"
        filepath = os.path.join(self.playbooks_dir, filename)
        
        logger.info(f"💾 Saving playbook to: {filepath}")
        logger.info(f"   Content size: {len(playbook_content)} bytes")
        
        try:
            with open(filepath, 'w') as f:
                f.write(playbook_content)
            
            # Verify file was written
            if os.path.exists(filepath):
                file_size = os.path.getsize(filepath)
                logger.info(f"✅ Playbook saved successfully: {file_size} bytes written")
            else:
                logger.error(f"❌ File doesn't exist after write: {filepath}")
                return None
            
            return filepath
        except Exception as e:
            logger.error(f"❌ Failed to save playbook: {e}", exc_info=True)
            return None
    
    def execute_playbook(self, playbook_path):
        """Execute playbook and capture output with process cleanup on timeout"""
        try:
            logger.info(f"🚀 Starting playbook execution: {playbook_path}")
            
            # Verify playbook exists
            if not os.path.exists(playbook_path):
                logger.error(f"❌ Playbook file not found: {playbook_path}")
                return {"status": "error", "error": f"File not found: {playbook_path}"}
            
            file_size = os.path.getsize(playbook_path)
            logger.info(f"   File size: {file_size} bytes")
            
            # Check if ansible-playbook is available
            check = subprocess.run(["which", "ansible-playbook"], capture_output=True)
            if check.returncode != 0:
                logger.warning("⚠️  ansible-playbook not found in PATH")
                cmd = ["ansible-playbook", playbook_path, "-i", "localhost,", "-c", "local", "-v"]
            else:
                logger.info("✅ ansible-playbook found")
                # Always use local connection for guaranteed execution
                cmd = ["ansible-playbook", playbook_path, "-i", "localhost,", "-c", "local", "-v"]
            
            # Set Python interpreter to python3 in environment
            import sys
            env = os.environ.copy()
            env['ANSIBLE_PYTHON_INTERPRETER'] = '/usr/bin/python3'
            logger.info(f"   Using Python interpreter: {env.get('ANSIBLE_PYTHON_INTERPRETER')}")
            
            logger.info(f"   Command: {' '.join(cmd)}")
            
            try:
                result = subprocess.run(
                    cmd,
                    capture_output=True,
                    text=True,
                    timeout=300,
                    env=env,
                    preexec_fn=os.setpgrp if hasattr(os, 'setpgrp') else None  # Process group for cleanup
                )
                
                output = {
                    "status": "success" if result.returncode == 0 else "failed",
                    "return_code": result.returncode,
                    "stdout": result.stdout[-2000:] if result.stdout else "",
                    "stderr": result.stderr[-2000:] if result.stderr else "",
                    "timestamp": datetime.now().isoformat()
                }
                
                if result.returncode == 0:
                    logger.info(f"✅ Playbook executed successfully (exit code 0)")
                else:
                    logger.error(f"❌ Playbook execution failed with exit code {result.returncode}")
                    if result.stderr:
                        logger.error(f"   Error output: {result.stderr[:500]}")
                
                return output
                
            except subprocess.TimeoutExpired as e:
                logger.error("❌ Playbook execution timeout (5 minutes)")
                # Kill process group to ensure all child processes are cleaned up
                try:
                    if hasattr(os, 'killpg') and e.pid:
                        os.killpg(os.getpgid(e.pid), signal.SIGTERM)
                        logger.info("🛑 Terminated process group on timeout")
                except:
                    pass
                return {"status": "timeout", "error": "Execution timeout (5 minutes)"}
                
        except FileNotFoundError as e:
            logger.error(f"❌ Command not found: {e}")
            return {"status": "error", "error": f"ansible-playbook not installed: {e}"}
        except Exception as e:
            logger.error(f"❌ Execution error: {str(e)}", exc_info=True)
            return {"status": "error", "error": str(e)}
