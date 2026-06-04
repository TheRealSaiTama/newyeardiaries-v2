const CEREBRAS_KEY = import.meta.env.VITE_CEREBRAS_API_KEY;
const CEREBRAS_URL = 'https://api.cerebras.ai/v1/chat/completions';

const SYSTEM_PROMPT = `You are a helpful assistant for New Year Diaries (newyeardiaries.in), a company based in Delhi, India that manufactures and supplies corporate promotional gifts and stationery.

Key facts:
- Products: corporate diaries, mugs, calendars, leather planners, trophies, laptop bags, pen stands, key chains, t-shirts, umbrellas, mouse pads, certificate folders, wallets, bottles, notebooks, and 1100+ more items
- Address: 174 D, Bawana Industrial Area, Delhi 110039, India
- Phone: +91 9899223130 (Mon-Sat, 9am-6pm IST)
- Email: newyeardiaries@gmail.com
- Customization: We offer logo printing, engraving, embossing, gold/silver foiling, custom designs
- Payment: For customized items 50% advance, balance before dispatch. Non-customized: full payment upfront
- Delivery: 5-10 working days via road/lorry, air and train also available
- Colors: Exact color match not guaranteed due to heat transfer process
- To order: Add items to quote list, submit enquiry, our team contacts you

Keep answers short, friendly, and helpful. If asked about pricing, direct them to submit a bulk quote or contact via phone/email. Answer only about New Year Diaries and their products/services.`;

const FAQS = [
  { q: 'What is New Year Diaries?', a: 'We are manufacturers, traders and suppliers of corporate promotional, advertising gifts and printing needs. Our product range includes 1100+ business promotion products like corporate diaries, mugs, calendars, leather planners, trophies, laptop bags, and more.' },
  { q: 'Where is your office?', a: '174 D, Bawana Industrial Area, Delhi, India 110039.' },
  { q: 'How do I contact you?', a: 'Email: newyeardiaries@gmail.com | Call: +91 9899223130 (Mon-Sat, 9am-6pm IST).' },
  { q: 'How can I personalize a product?', a: 'Choose your product and customize it with your name, text, art, or design. Send your design via email after placing the order.' },
  { q: 'Do I need to pay in full upfront?', a: 'For customized items: 50% advance, balance before dispatch. For non-customized items: full payment upfront.' },
  { q: 'Can you print my logo?', a: 'Yes! Select and order your product, then send your design/logo via email to newyeardiaries@gmail.com with your order details.' },
  { q: 'Will printed colors match my design?', a: 'Exact color match is not guaranteed as the process involves heat transfer where some color loss is normal.' },
  { q: 'How long does delivery take?', a: 'Normally 5-10 working days via road/lorry service. Air and train options also available.' },
  { q: 'How do I place an order?', a: 'Select items and add to quote list, submit your enquiry, and our customer executive will contact you to finalize.' },
];

let isOpen = false;
let chatHistory = [];

async function askLLM(question) {
  if (!CEREBRAS_KEY) return 'Sorry, the AI assistant is not configured. Please contact us directly at newyeardiaries@gmail.com or +91 9899223130.';

  chatHistory.push({ role: 'user', content: question });

  try {
    const res = await fetch(CEREBRAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CEREBRAS_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama3.1-8b',
        stream: false,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...chatHistory.slice(-10),
        ],
        temperature: 0.3,
        max_tokens: 300,
      }),
    });

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || 'Sorry, I could not process that. Please contact us directly.';
    chatHistory.push({ role: 'assistant', content: reply });
    return reply;
  } catch {
    return 'Sorry, something went wrong. Please contact us at newyeardiaries@gmail.com or +91 9899223130.';
  }
}

function addMsg(body, text, type) {
  const msg = document.createElement('div');
  msg.className = `faq-chatbot-msg ${type}`;
  msg.textContent = text;
  body.appendChild(msg);
  body.scrollTop = body.scrollHeight;
  return msg;
}

export function initFaqChatbot() {
  const existing = document.getElementById('faq-chatbot');
  if (existing) existing.remove();

  const el = document.createElement('div');
  el.id = 'faq-chatbot';
  el.innerHTML = `
    <button class="faq-chatbot-toggle" id="faq-chatbot-toggle" aria-label="Chat with us">
      <span class="material-symbols-outlined">chat</span>
    </button>
    <div class="faq-chatbot-window" id="faq-chatbot-window">
      <div class="faq-chatbot-header">
        <span>NYD Support</span>
        <button class="faq-chatbot-close" id="faq-chatbot-close" aria-label="Close">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <div class="faq-chatbot-body" id="faq-chatbot-body">
        <div class="faq-chatbot-msg bot">Hi! Ask me anything or pick a question below:</div>
        ${FAQS.map((f, i) => `<button class="faq-chatbot-q" data-idx="${i}">${f.q}</button>`).join('')}
      </div>
      <form class="faq-chatbot-input" id="faq-chatbot-form">
        <input type="text" id="faq-chatbot-text" placeholder="Type your question..." autocomplete="off" />
        <button type="submit" aria-label="Send">
          <span class="material-symbols-outlined">send</span>
        </button>
      </form>
    </div>
  `;
  document.body.appendChild(el);

  const toggle = document.getElementById('faq-chatbot-toggle');
  const win = document.getElementById('faq-chatbot-window');
  const closeBtn = document.getElementById('faq-chatbot-close');
  const body = document.getElementById('faq-chatbot-body');
  const form = document.getElementById('faq-chatbot-form');
  const input = document.getElementById('faq-chatbot-text');

  toggle.addEventListener('click', () => {
    isOpen = !isOpen;
    win.classList.toggle('open', isOpen);
    toggle.classList.toggle('active', isOpen);
    if (isOpen) input.focus();
  });

  closeBtn.addEventListener('click', () => {
    isOpen = false;
    win.classList.remove('open');
    toggle.classList.remove('active');
  });

  body.addEventListener('click', (e) => {
    const btn = e.target.closest('.faq-chatbot-q');
    if (!btn) return;
    const idx = Number(btn.dataset.idx);
    const faq = FAQS[idx];
    if (!faq) return;

    addMsg(body, faq.q, 'user');
    addMsg(body, faq.a, 'bot');
    btn.remove();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const question = input.value.trim();
    if (!question) return;

    input.value = '';
    addMsg(body, question, 'user');

    const res = await fetch('/functions/v1/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: question }),
    });
    const { reply } = await res.json();
    addMsg(body, reply || 'Sorry, no reply.', 'bot');
  });
}
