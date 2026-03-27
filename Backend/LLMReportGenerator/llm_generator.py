"""
Groq LLM Report Generator
Analyzes log chunks and generates prevention/POA reports
"""

from groq import Groq
from config import GROQ_API_KEY, GROQ_MODEL
import logging
import json
import re
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class LLMReportGenerator:
    """Generate reports using Groq LLM"""
    
    def __init__(self):
        if not GROQ_API_KEY:
            logger.error("❌ GROQ_API_KEY not set in environment")
            self.client = None
        else:
            self.client = Groq(api_key=GROQ_API_KEY)
    
    def generate_report(self, chunk_id, messages):
        """Generate prevention & POA report from messages"""
        
        if not self.client:
            logger.error("❌ Groq client not initialized")
            return None
        
        try:
            # Prepare message summary
            message_summary = self._summarize_messages(messages)
            
            logger.info(f"🤖 Calling Groq LLM for chunk {chunk_id}...")
            
            # System prompt - MINIMAL
            system_prompt = """Analyze Kubernetes logs. Return ONLY valid JSON:
{
    "root_causes": ["cause1", "cause2"],
    "components_affected": ["component1"],
    "prevention_steps": ["step1", "step2", "step3"],
    "immediate_actions": ["action1", "action2"],
    "risk_level": "High",
    "fix_time": "2 hours"
}"""
            
            # Generate report using Groq
            response = self.client.chat.completions.create(
                model=GROQ_MODEL,
                max_tokens=1024,
                messages=[
                    {
                        "role": "system",
                        "content": system_prompt
                    },
                    {
                        "role": "user",
                        "content": f"""Analyze these Kubernetes logs:

{message_summary}

Return ONLY the JSON response with no markdown or extra text."""
                    }
                ]
            )
            
            # Extract response
            response_text = response.choices[0].message.content
            
            # Parse JSON with better error handling
            try:
                report = json.loads(response_text)
            except json.JSONDecodeError:
                # Try to extract JSON from markdown code blocks if present
                import re
                json_match = re.search(r'```json\n(.*?)\n```', response_text, re.DOTALL)
                if json_match:
                    report = json.loads(json_match.group(1))
                else:
                    # Try to find JSON object directly
                    json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
                    if json_match:
                        report = json.loads(json_match.group(0))
                    else:
                        logger.error(f"❌ Could not find valid JSON in response")
                        return None
            
            logger.info(f"✅ Report generated - Priority: {report.get('priority_level', 'Unknown')}")
            
            return {
                "chunk_id": chunk_id,
                "timestamp": datetime.now().isoformat(),
                "messages_count": len(messages),
                "report": report
            }
        
        except json.JSONDecodeError as e:
            logger.error(f"❌ JSON parsing error: {e}")
            return None
        except Exception as e:
            logger.error(f"❌ Error generating report: {e}")
            return None
    
    def _summarize_messages(self, messages):
        """Summarize messages for LLM"""
        formatted_messages = []
        
        for msg in messages:
            if isinstance(msg, dict):
                # Convert dict to string
                formatted_messages.append(str(msg))
            else:
                formatted_messages.append(str(msg))
        
        if len(formatted_messages) > 50:
            # Sample messages if too many
            summary = "\n".join(formatted_messages[:25])
            summary += "\n... [" + str(len(formatted_messages) - 50) + " more logs] ...\n"
            summary += "\n".join(formatted_messages[-25:])
        else:
            summary = "\n".join(formatted_messages)
        
        return summary
