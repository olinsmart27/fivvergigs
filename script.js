// ==========================================================================
// JavaScript for Polaris AI Assistant & Website Interactivity
// ==========================================================================

let conversationHistory = [];

document.addEventListener('DOMContentLoaded', () => {
  // FAQ Accordion
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      faqItems.forEach(i => i.classList.remove('active'));
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });

  if (faqItems.length > 0) {
    faqItems[0].classList.add('active');
  }
});

// Chat Containers
const demoChatMessages = document.getElementById('interactiveChat');
const demoUserInput = document.getElementById('userInput');
const heroChatMessages = document.getElementById('heroChatBody');
const heroUserInput = document.getElementById('heroUserInput');

function formatCurrentTime() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Global Copy Function for message bubbles
window.copyMessageText = function(btn) {
  const bubble = btn.closest('.chat-bubble');
  const textEl = bubble ? bubble.querySelector('.bubble-text') : null;
  const text = textEl ? textEl.innerText.trim() : '';

  if (!text) return;

  navigator.clipboard.writeText(text).then(() => {
    const label = btn.querySelector('.copy-label');
    const originalText = label ? label.textContent : '';
    if (label) label.textContent = 'Copied!';
    btn.classList.add('copied');

    setTimeout(() => {
      if (label) label.textContent = originalText || 'Copy';
      btn.classList.remove('copied');
    }, 1800);
  }).catch(() => {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);

    const label = btn.querySelector('.copy-label');
    if (label) label.textContent = 'Copied!';
    btn.classList.add('copied');
    setTimeout(() => {
      if (label) label.textContent = 'Copy';
      btn.classList.remove('copied');
    }, 1800);
  });
};

function createMessageBubble(text, sender) {
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${sender}`;

  const textDiv = document.createElement('div');
  textDiv.className = 'bubble-text';
  textDiv.textContent = text;
  bubble.appendChild(textDiv);

  const metaDiv = document.createElement('div');
  metaDiv.className = 'bubble-meta';

  const timeSpan = document.createElement('span');
  timeSpan.className = 'bubble-time';
  timeSpan.textContent = formatCurrentTime();
  metaDiv.appendChild(timeSpan);

  const copyBtn = document.createElement('button');
  copyBtn.type = 'button';
  copyBtn.className = 'copy-btn';
  copyBtn.title = 'Copy text';
  copyBtn.setAttribute('onclick', 'copyMessageText(this)');
  copyBtn.innerHTML = `
    <svg class="copy-icon" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
    <span class="copy-label">Copy</span>
  `;
  metaDiv.appendChild(copyBtn);

  bubble.appendChild(metaDiv);
  return bubble;
}

function addMessageToContainer(container, text, sender) {
  if (!container) return;
  const bubble = createMessageBubble(text, sender);
  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;

  conversationHistory.push({ role: sender === 'user' ? 'user' : 'assistant', content: text });
  if (conversationHistory.length > 10) {
    conversationHistory = conversationHistory.slice(-10);
  }
}

function showTypingIndicator(container) {
  const id = 'typing-' + Date.now() + Math.random().toString(36).substring(2, 6);
  const bubble = document.createElement('div');
  bubble.id = id;
  bubble.className = 'chat-bubble bot typing';
  bubble.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
  return id;
}

function removeTypingIndicator(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

// Handle Demo Chat Submit
async function handleChatSubmit(e) {
  e.preventDefault();
  const text = demoUserInput.value.trim();
  if (!text) return;

  addMessageToContainer(demoChatMessages, text, 'user');
  demoUserInput.value = '';

  const typingId = showTypingIndicator(demoChatMessages);

  try {
    const aiReply = await getSmartAIResponse(text);
    removeTypingIndicator(typingId);
    addMessageToContainer(demoChatMessages, aiReply, 'bot');
  } catch (err) {
    console.error('AI chat error:', err);
    removeTypingIndicator(typingId);
    const fallback = generateIntelligentResponse(text);
    addMessageToContainer(demoChatMessages, fallback, 'bot');
  }
}

// Handle Hero Chat Submit
async function handleHeroChatSubmit(e) {
  e.preventDefault();
  const text = heroUserInput.value.trim();
  if (!text) return;

  addMessageToContainer(heroChatMessages, text, 'user');
  heroUserInput.value = '';

  const typingId = showTypingIndicator(heroChatMessages);

  try {
    const aiReply = await getSmartAIResponse(text);
    removeTypingIndicator(typingId);
    addMessageToContainer(heroChatMessages, aiReply, 'bot');
  } catch (err) {
    removeTypingIndicator(typingId);
    const fallback = generateIntelligentResponse(text);
    addMessageToContainer(heroChatMessages, fallback, 'bot');
  }
}

// Quick Chip Buttons
async function sendQuickMessage(text) {
  addMessageToContainer(demoChatMessages, text, 'user');
  const typingId = showTypingIndicator(demoChatMessages);

  try {
    const aiReply = await getSmartAIResponse(text);
    removeTypingIndicator(typingId);
    addMessageToContainer(demoChatMessages, aiReply, 'bot');
  } catch (err) {
    removeTypingIndicator(typingId);
    const fallback = generateIntelligentResponse(text);
    addMessageToContainer(demoChatMessages, fallback, 'bot');
  }
}

// ==========================================================================
// AI Core: Netlify Serverless Function (Polaris) -> Intelligent Local Fallback
// ==========================================================================

async function getSmartAIResponse(userQuery) {
  const endpoints = ['/.netlify/functions/chat', '/api/chat'];
  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userQuery, history: conversationHistory })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.reply && data.reply.trim().length > 5) {
          return data.reply.trim();
        }
      }
    } catch (e) {
      // Local/offline preview
    }
  }

  // Contextual Knowledge Engine (Polaris persona)
  return generateIntelligentResponse(userQuery);
}

function generateIntelligentResponse(query) {
  const q = query.toLowerCase();

  // Name / Persona
  if (q.includes('who are you') || q.includes('your name') || q.includes('what are you')) {
    return "I am Polaris! 🌟 I'm Wilson Guchu's real-time AI Website Assistant. I demonstrate how intelligent chatbots can be integrated into any website with zero monthly subscription fees.";
  }

  // Greetings
  if (q.match(/^(hi|hello|hey|greetings|good morning|good afternoon|good evening|sup)\b/)) {
    return "Hello there! 👋 I am Polaris. How can I help you automate customer support or capture leads on your website today?";
  }

  // Monthly fees / "no monthly bills" explanation
  if (q.includes('monthly') || q.includes('bill') || q.includes('subscription') || q.includes('hidden cost') || q.includes('recurring')) {
    return "Zero monthly fees! Traditional platforms (Intercom, Tidio, Drift) charge $50–$200 every month just to host the chat bubble. We build custom-coded chatbots powered by free AI APIs. You pay a one-time fee on Fiverr starting at $30, own the code, and never get billed a monthly subscription.";
  }

  // Pricing / Packages
  if (q.includes('price') || q.includes('cost') || q.includes('how much') || q.includes('package') || q.includes('tier')) {
    return "Our packages on Fiverr are: Basic ($30) for a single-page FAQ AI chatbot with custom styling; Standard ($75) for a full business bot trained on your full website/PDFs plus lead capture; and Premium ($150) for advanced multi-step workflows, CRM integration, and calendar booking. All packages include source code and 48-hour delivery!";
  }

  // WordPress / WooCommerce
  if (q.includes('wordpress') || q.includes('woocommerce') || q.includes('wp')) {
    return "Yes! We have a dedicated Fiverr gig for WordPress & WooCommerce ($30). The AI assistant is trained on your WooCommerce catalog to recommend products, assist shoppers with sizing/shipping questions, and capture leads—all without installing bloated monthly paid plugins.";
  }

  // Shopify
  if (q.includes('shopify') || q.includes('ecommerce') || q.includes('store') || q.includes('product')) {
    return "Yes! Our Shopify AI Customer Support gig ($35) is custom-trained on your store policies, return procedures, and product specs. It provides 24/7 automated support so late-night shoppers get immediate answers instead of abandoning their cart.";
  }

  // Real Estate
  if (q.includes('real estate') || q.includes('realtor') || q.includes('property') || q.includes('housing') || q.includes('listing')) {
    return "Our Real Estate AI Lead Generation gig ($40) asks visitors for their budget, preferred location, timeline, and bedrooms, then immediately emails the qualified lead to you. It also integrates with Calendly so clients can book showings directly on your calendar.";
  }

  // Lead Capture / Emails
  if (q.includes('lead') || q.includes('email') || q.includes('phone') || q.includes('capture') || q.includes('crm')) {
    return "Yes! In the Standard and Premium packages, the AI assistant proactively asks visitors for their name, email, phone number, and inquiry details. The moment they submit, the lead is automatically forwarded straight to your inbox or CRM webhook.";
  }

  // Speed / Performance
  if (q.includes('slow') || q.includes('speed') || q.includes('performance') || q.includes('core web') || q.includes('pagespeed')) {
    return "Not at all. The chatbot embed is lightweight (under 15KB) and loads asynchronously after your page has already rendered. It has zero negative impact on your Google PageSpeed scores or Core Web Vitals.";
  }

  // Platforms supported
  if (q.includes('platform') || q.includes('wix') || q.includes('squarespace') || q.includes('webflow') || q.includes('react') || q.includes('html')) {
    return "We support all major platforms: WordPress, WooCommerce, Shopify, Webflow, Squarespace, Wix, and custom websites built with HTML, React, Vue, PHP, or Laravel. If your website can accept a snippet of JavaScript, our AI bot will run on it seamlessly.";
  }

  // How to order / Fiverr process
  if (q.includes('order') || q.includes('hire') || q.includes('fiverr') || q.includes('get started') || q.includes('buy')) {
    return "Getting started is easy! Simply visit Wilson's verified Fiverr profile at https://www.fiverr.com/wilson_guchu, pick the gig that matches your platform (Core, WordPress, Shopify, or Real Estate), and provide your website link and business info. Wilson delivers your working bot within 48 to 72 hours!";
  }

  // Dynamic contextual fallback
  return `That's an excellent question! As Polaris, I'm here to show you how Wilson Guchu builds custom AI chatbots tailored to your specific business requirements with zero monthly fees. Whether you want to automate customer support, recommend products, or capture visitor leads 24/7, check out his 5.0-star gigs on Fiverr (https://www.fiverr.com/wilson_guchu) or select one of the service cards above to order!`;
}
