# AI Chatbot via Groq Edge Function Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate Groq LLM (openai/gpt-oss-20b) into FaqChatbot via Supabase edge function for dynamic responses.

**Architecture:** Edge function receives message, calls Groq with the exact user-provided code (key from Deno.env), returns text. Frontend POSTs to /functions/v1/chat and displays reply.

**Tech Stack:** Supabase Edge Functions (Deno), Groq SDK, existing FaqChatbot.js.

---

### Task 1: Create Supabase edge function chat

**Files:**
- Create: `supabase/functions/chat/index.ts`

- [ ] **Step 1: Write the edge function (exact Groq code adapted)**
```ts
import { Groq } from 'https://esm.sh/groq-sdk@0.7.0';

Deno.serve(async (req) => {
  const { message } = await req.json();
  const groq = new Groq({ apiKey: Deno.env.get('GROQ_API_KEY')! });
  const completion = await groq.chat.completions.create({
    model: 'openai/gpt-oss-20b',
    messages: [{ role: 'user', content: message }],
    temperature: 1,
    max_completion_tokens: 8192,
    top_p: 1,
    reasoning_effort: 'medium',
    stream: false,
  });
  const reply = completion.choices[0]?.message?.content || 'Sorry, no response.';
  return new Response(JSON.stringify({ reply }), { headers: { 'Content-Type': 'application/json' } });
});
```

- [ ] **Step 2: Commit**
```bash
git add supabase/functions/chat/index.ts
git commit -m "feat: groq edge function for AI chatbot (key from secrets)"
```

### Task 2: Wire chatbot to call the edge function

**Files:**
- Modify: `src/components/FaqChatbot.js` (send handler)

- [ ] **Step 1: Add send to function + display reply**
In the send logic (after user message), add:
```js
  const res = await fetch('/functions/v1/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: userText }),
  });
  const { reply } = await res.json();
  // append reply to chat window
```

- [ ] **Step 2: Commit**
```bash
git add src/components/FaqChatbot.js
git commit -m "feat: call edge fn from FaqChatbot and display AI reply"
```

### Task 3: Verification

**Files:** none

- [ ] **Step 1: Deploy edge fn**
`supabase functions deploy chat --no-verify-jwt`

- [ ] **Step 2: Set secret**
`supabase secrets set GROQ_API_KEY=gsk_...` (user does this in dashboard)

- [ ] **Step 3: Test chatbot**
Open site, open chatbot, send message, confirm AI reply appears.

- [ ] **Step 4: Commit note**
```bash
git commit --allow-empty -m "chore: manual verification of AI chatbot complete"
```

**Plan complete and saved to `docs/superpowers/plans/2026-06-03-ai-chatbot-groq.md`.**
