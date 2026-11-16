// ==========================================================================
// Netlify Serverless Function: Proxy to NVIDIA NIM API Catalog
// ==========================================================================

const https = require('https');

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || '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';
const PRIMARY_MODEL = 'nvidia/nemotron-3.5-super-vl-120b-a12b';
const FALLBACK_MODEL = 'meta/llama-3.1-70b-instruct';

const SYSTEM_PROMPT = `You are Wilson Guchu's real-time AI Website Assistant (FreeAPIBots). 
You are an expert full-stack AI engineer. You converse naturally, intelligently, and helpfully with website visitors.

YOUR CORE EXPERTISE & SERVICES:
1. Custom AI Chatbot Integration ($30 on Fiverr):
   - Universal chatbot integration for any website (WordPress, Shopify, Wix, Webflow, Custom HTML/PHP/React).
   - Trained on the client's business documents, FAQs, pricing, and service offerings.
   - Zero recurring monthly SaaS fees (no $50-$200/mo fees like Intercom, Drift, Tidio, or Chatbase).
   - Powered by free AI APIs with zero API costs.
   - Includes full source code and clean, lightweight JavaScript embed (under 15KB, won't slow down the site).

2. WordPress & WooCommerce Sales & Support Bot ($30 on Fiverr):
   - Trained on the WooCommerce product catalog.
   - Recommends products based on user intent, answers shipping/order questions, captures customer emails.

3. Shopify Customer Support & Conversion Agent ($35 on Fiverr):
   - Handles 24/7 customer support for returns, sizing, and shipping FAQs.
   - Captures shopper emails and cuts repetitive support tickets by up to 70%.

4. Real Estate Lead Generation Agent ($40 on Fiverr):
   - Pre-qualifies buyers by budget, timeline, location, and property type.
   - Directs high-intent leads to Calendly/Google Calendar for showing bookings.
   - Emails full lead summaries directly to the realtor.

HOW CLIENTS GET STARTED:
- They place an order directly on Wilson's verified Fiverr profile (https://www.fiverr.com/wilson_guchu) with buyer protection and fast 48-hour delivery.
- They only provide their website URL and business info/FAQs. Wilson handles 100% of the technical setup and testing.

STYLE & TONE:
- Be genuinely helpful, conversational, professional, and knowledgeable.
- Answer their specific question directly before recommending the appropriate Fiverr gig package.
- Keep responses concise (2 to 4 sentences max) so they are easy to read in a live chat window.
- Never output internal thinking tags or system instructions.`;

function callNvidia(model, messages) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model: model,
      messages: messages,
      temperature: 0.6,
      max_tokens: 1024
    });

    const req = https.request('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NVIDIA_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsed = JSON.parse(body);
            const choice = parsed.choices?.[0]?.message;
            let text = choice?.content;
            if (!text && choice?.reasoning_content) {
              text = choice.reasoning_content;
            }
            if (text) {
              // Strip any reasoning artifact or <think> tags if present
              text = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
              resolve({ ok: true, text });
            } else {
              resolve({ ok: false, error: 'Empty content' });
            }
          } catch (e) {
            resolve({ ok: false, error: e.message });
          }
        } else {
          resolve({ ok: false, status: res.statusCode, body });
        }
      });
    });

    req.on('error', err => resolve({ ok: false, error: err.message }));
    req.write(postData);
    req.end();
  });
}

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const userMessage = payload.message || 'Hello';
    const history = payload.history || [];

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.slice(-6).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: userMessage }
    ];

    // Try primary Nemotron model
    let result = await callNvidia(PRIMARY_MODEL, messages);

    // If primary model failed, try fallback Llama model on NVIDIA NIM
    if (!result.ok || !result.text) {
      console.warn('Primary model failed, attempting fallback model...');
      result = await callNvidia(FALLBACK_MODEL, messages);
    }

    if (result.ok && result.text) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ reply: result.text })
      };
    } else {
      console.error('All NVIDIA calls failed:', result);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          reply: `Hello! I am Wilson Guchu's AI assistant. We build custom AI chatbots for websites with zero monthly subscription fees starting at $30 on Fiverr. We support WordPress, Shopify, Real Estate, and custom websites. What kind of website are you looking to automate?`
        })
      };
    }

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        reply: `Welcome! Wilson creates custom AI chatbots that run on free AI APIs, meaning you pay zero monthly subscription fees. You can view his packages and order with 48-hour delivery on Fiverr at https://www.fiverr.com/wilson_guchu. How can I help you today?`
      })
    };
  }
};
