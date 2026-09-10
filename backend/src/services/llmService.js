const { Anthropic } = require('@anthropic-ai/sdk');
const config = require('../config/env');
const logger = require('../utils/logger');

async function queryAssistant(question, incidents) {
  if (!config.anthropicApiKey) {
    throw new Error('Anthropic API key is not configured');
  }

  const client = new Anthropic({
    apiKey: config.anthropicApiKey
  });

  const contextData = incidents.map(inc => ({
    id: inc.incident_id,
    video: inc.video_id,
    behaviour: inc.behaviour,
    risk: inc.risk_level,
    timeRange: `${inc.timestamp_start_sec.toFixed(1)}s - ${inc.timestamp_end_sec.toFixed(1)}s`,
    evidence: inc.evidence
  }));

  const systemPrompt = `You are a warehouse safety assistant. Answer the supervisor's question using ONLY the incident data provided below. If the data doesn't contain enough information to answer, say so clearly — do NOT infer, guess, or fabricate any incidents or statistics. Always reference specific incident IDs when citing evidence.`;

  const userMessage = `
Incident Data Context:
${JSON.stringify(contextData, null, 2)}

Supervisor Question: ${question}
`;

  try {
    const response = await client.messages.create({
      model: config.anthropicModel,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }]
    });

    const answer = response.content[0].text;
    
    // Extract incident IDs
    const idRegex = /inc_[a-f0-9]{8}/gi;
    const matches = answer.match(idRegex) || [];
    const cited_incident_ids = [...new Set(matches)];

    return { answer, cited_incident_ids };
  } catch (error) {
    logger.error('Error querying LLM', { error: error.message });
    throw new Error('Failed to query assistant: ' + error.message);
  }
}

module.exports = { queryAssistant };
