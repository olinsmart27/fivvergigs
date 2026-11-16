// ==========================================================================
// JavaScript for Live Interactive AI Website Assistant & Knowledge Hub
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

  // Article Modal Close listener
  const modal = document.getElementById('blogModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.classList.contains('modal-close')) {
        closeBlogModal();
      }
    });
  }
});

// Chat Containers
const demoChatMessages = document.getElementById('interactiveChat');
const demoUserInput = document.getElementById('userInput');
const heroChatMessages = document.getElementById('heroChatBody');
const heroUserInput = document.getElementById('heroUserInput');

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

// UI Helpers
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

function addMessageToContainer(container, text, sender) {
  if (!container) return;
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${sender}`;
  bubble.textContent = text;
  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;

  conversationHistory.push({ role: sender === 'user' ? 'user' : 'assistant', content: text });
  if (conversationHistory.length > 10) {
    conversationHistory = conversationHistory.slice(-10);
  }
}

// ==========================================================================
// AI Core: Try Netlify Serverless Function (NVIDIA NIM) -> Intelligent Local Fallback
// ==========================================================================

async function getSmartAIResponse(userQuery) {
  // 1. Try Netlify Serverless Proxy to NVIDIA Nemotron
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
      // Endpoint not reachable (e.g. running from local filesystem)
    }
  }

  // 2. Intelligent Contextual Engine (Trained on Wilson Guchu's exact services & data)
  return generateIntelligentResponse(userQuery);
}

// Contextual Knowledge Engine
function generateIntelligentResponse(query) {
  const q = query.toLowerCase();

  // Greetings
  if (q.match(/^(hi|hello|hey|greetings|good morning|good afternoon|good evening|sup)\b/)) {
    return "Hello there! 👋 I am Wilson's AI assistant. I'm trained to help you integrate custom AI chatbots into websites with zero monthly subscription fees. How can I help you today?";
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

  // Training / Setup process
  if (q.includes('train') || q.includes('setup') || q.includes('how it works') || q.includes('data') || q.includes('information')) {
    return "You don't need any technical skills! You simply provide your website URL and any FAQ sheets, product lists, or service descriptions you want the bot to know. Wilson trains the model, customizes the design to match your brand, and provides the 1-line installation code.";
  }

  // Security / Privacy
  if (q.includes('secure') || q.includes('security') || q.includes('privacy') || q.includes('data safe')) {
    return "Your data is completely private. You own the full source code and client implementation. The chatbot connects securely over HTTPS without tracking third-party user cookies or locking you into proprietary closed-source SaaS dashboards.";
  }

  // Dynamic contextual fallback
  return `That's an excellent question! Wilson Guchu builds custom AI chatbots tailored to your specific business requirements with zero monthly fees. Whether you want to automate customer support, recommend products, or capture visitor leads 24/7, check out his 5.0-star gigs on Fiverr (https://www.fiverr.com/wilson_guchu) or select one of the service cards above to order!`;
}

// ==========================================================================
// Blog Articles Data & Interactive Modal
// ==========================================================================
const blogArticles = {
  'free-ai-revolution': {
    title: 'The Free AI API Revolution: Why Smart Businesses Are Ditching $100/Mo Chatbot Subscriptions in 2026',
    category: 'Industry Trends & Cost Savings',
    date: 'November 16, 2026 • 5 min read',
    content: `
      <p>For the past five years, every website owner who wanted an interactive chatbot had only one real option: pay a monthly SaaS subscription. Platforms like Intercom, Drift, Tidio, and Chatbase built massive businesses by charging $50, $150, or even $300 every single month just to host a chat bubble on your website.</p>
      
      <h3>The Hidden Markup of SaaS Chatbots</h3>
      <p>What most business owners don't realize is that these platforms do not have proprietary AI. They simply wrap around foundational AI models, slap a logo on it, and mark up the price by over 5000%. When you cancel your subscription, your bot dies immediately.</p>

      <h3>How the Free AI API Architecture Works</h3>
      <p>With modern open-access and developer-tier AI APIs (including NVIDIA NIM, Hugging Face endpoints, and free developer keys), you no longer need a middleman. By building a custom lightweight JavaScript embed connected directly to a free AI endpoint:</p>
      <ul>
        <li><strong>You own 100% of the code:</strong> The bot is yours forever. No monthly renewal dates.</li>
        <li><strong>Zero monthly fees:</strong> Your recurring software cost drops from $1,200/year to $0/year.</li>
        <li><strong>Zero performance hit:</strong> Custom embeds are under 15KB—10x lighter than bloated SaaS scripts.</li>
      </ul>

      <h3>How to Get Started</h3>
      <p>Wilson Guchu specializes in building and embedding custom AI chatbots for websites. You can hire him directly on Fiverr for a one-time fee starting at just $30, with 48-hour delivery.</p>
      <div style="margin-top:24px;">
        <a href="https://www.fiverr.com/wilson_guchu/integrate-ai-agent-to-websites-no-monthly-bills-with-js" target="_blank" class="btn btn-primary">Order Custom Chatbot on Fiverr →</a>
      </div>
    `
  },
  'wordpress-ai-guide': {
    title: 'Step-by-Step: Adding an AI Assistant to WordPress & WooCommerce (Without Recurring Plugin Fees)',
    category: 'WordPress & E-Commerce',
    date: 'November 14, 2026 • 6 min read',
    content: `
      <p>WordPress powers over 43% of the web, and WooCommerce is the backbone of millions of online stores. But WordPress store owners suffer from severe <strong>plugin fatigue</strong>—accumulating dozens of plugins that each charge $20 to $60 every month.</p>

      <h3>Why Most WordPress Chatbot Plugins Fail</h3>
      <p>Most commercial WordPress chatbot plugins introduce database bloat, slow down Time to First Byte (TTFB), and force you onto tiered plans that restrict how many messages your customers can send.</p>

      <h3>What a True Custom WooCommerce AI Assistant Does</h3>
      <p>A properly integrated AI agent on WordPress can:</p>
      <ul>
        <li><strong>Recommend Products:</strong> Understand natural language queries like <em>"I need a gift for an outdoor runner under $50"</em> and provide direct product links.</li>
        <li><strong>Handle Order & Shipping FAQs:</strong> Instantly clarify delivery windows, return policies, and sizing charts.</li>
        <li><strong>Capture Visitor Leads:</strong> Collect buyer email addresses for high-intent queries and sync them directly to your email list.</li>
      </ul>

      <h3>Zero Monthly Maintenance</h3>
      <p>By using a clean JavaScript integration connected to a free AI API, your WooCommerce store gets 24/7 sales assistance without adding another recurring bill to your ledger.</p>
      <div style="margin-top:24px;">
        <a href="https://www.fiverr.com/wilson_guchu/build-a-custom-ai-chatbot-for-wordpress-and-woocommerce-website" target="_blank" class="btn btn-primary">Get WordPress AI Bot on Fiverr ($30) →</a>
      </div>
    `
  },
  'shopify-support-playbook': {
    title: 'How Shopify Stores Use AI Chatbots to Cut Customer Support Tickets by 70%',
    category: 'Shopify Growth',
    date: 'November 12, 2026 • 4 min read',
    content: `
      <p>In e-commerce, over 60% of customer support requests revolve around the exact same four questions: <em>"Where is my order?"</em>, <em>"How do returns work?"</em>, <em>"What size should I get?"</em>, and <em>"How much is international shipping?"</em>.</p>

      <h3>The Late-Night Conversion Problem</h3>
      <p>Peak browsing hours for many online shoppers are between 9 PM and 1 AM—times when your customer service team is offline. If a potential buyer has a sizing hesitation at midnight and nobody answers, they close the tab and buy from Amazon.</p>

      <h3>The AI Support Solution</h3>
      <p>A custom AI agent trained on your Shopify FAQ and store policies answers these questions instantly. It feels like chatting with a live store representative, providing confidence that leads directly to completed checkouts.</p>

      <h3>Why Pay Once Instead of Monthly?</h3>
      <p>Tools like Gorgias and Zendesk charge hundreds of dollars per seat per month. A custom-built AI chatbot built on a free API gives boutique brands enterprise-grade customer experience with zero monthly overhead.</p>
      <div style="margin-top:24px;">
        <a href="https://www.fiverr.com/wilson_guchu/create-an-ai-customer-support-chatbot-for-shopify-store" target="_blank" class="btn btn-primary">Get Shopify AI Bot on Fiverr ($35) →</a>
      </div>
    `
  },
  'real-estate-lead-gen': {
    title: '24/7 Real Estate Lead Generation: How Realtors Capture & Pre-Qualify Buyers On Autopilot',
    category: 'Real Estate Marketing',
    date: 'November 10, 2026 • 5 min read',
    content: `
      <p>For solo realtors and boutique brokerages, time is money. When you are out hosting an open house or showing a luxury listing, you cannot answer inbound website inquiries immediately. In real estate, responding after 30 minutes decreases your chance of qualifying a lead by 21x.</p>

      <h3>Automated Buyer Qualification</h3>
      <p>An AI real estate agent doesn't just say hello—it performs proactive client intake:</p>
      <ul>
        <li>Inquires about the buyer's desired neighborhood and school district</li>
        <li>Filters by budget range and financing pre-approval status</li>
        <li>Checks target move-in timeline and number of bedrooms</li>
        <li>Directs qualified high-intent leads to your Calendly for showing bookings</li>
      </ul>

      <h3>Instant CRM Integration</h3>
      <p>Every lead's complete intake profile is delivered straight to your smartphone via email or webhook, so you know exactly what the buyer wants before you even call them back.</p>
      <div style="margin-top:24px;">
        <a href="https://www.fiverr.com/wilson_guchu/build-an-ai-lead-generation-chatbot-for-real-estate-websites" target="_blank" class="btn btn-primary">Get Real Estate AI Bot on Fiverr ($40) →</a>
      </div>
    `
  }
};

function openBlogModal(articleKey) {
  const article = blogArticles[articleKey];
  if (!article) return;

  const modal = document.getElementById('blogModal');
  const title = document.getElementById('modalTitle');
  const meta = document.getElementById('modalMeta');
  const body = document.getElementById('modalBody');

  title.textContent = article.title;
  meta.textContent = `${article.category} • ${article.date}`;
  body.innerHTML = article.content;

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeBlogModal() {
  const modal = document.getElementById('blogModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}
