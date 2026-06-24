# Design: Simple AI Chatbot via Groq Edge Function (2026-06-03)

## Overview (Sub-project 3 of 3)
Integrate a simple AI (Groq with openai/gpt-oss-20b model) into the existing FaqChatbot so user messages get dynamic responses instead of static FAQ.

## Approach (B approved)
- Create Supabase Edge Function `chat` (Deno) that:
  - Receives POST { message }
  - Calls Groq client with the provided model and message
  - Returns the completion text (non-stream for simplicity)
- In FaqChatbot.js, on message send, POST to the function URL (from env or hardcoded /functions/v1/chat), append the AI response to the chat.
- API key set in Supabase secrets (GROQ_API_KEY) — never in code or vault (per AGENTS.md).

## Files
- New: supabase/functions/chat/index.ts (the edge function with the exact Groq code from user, adapted to Deno)
- Modify: src/components/FaqChatbot.js (send message handler + display AI reply)
- (Optional) VITE_ env for function URL if needed.

## Success
- Chatbot sends user message to edge fn, displays Groq response in the window.
- Key never committed to repo.

(The user-provided Groq code is the core of the edge function.)
