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
