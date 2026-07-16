# Order email — free Gmail SMTP (long-term)

Replaces EmailJS paid attachments for **order** mail. Contact/quote can stay on EmailJS free.

## What you get

- Professional HTML order table (same as now)
- Product thumbnails (JPEG proxy)
- **Real PDF / JPG attachments** (paperclips)
- Dual send: `newyeardiaries@gmail.com` + customer

## 1. Gmail App Password

1. Google Account for **newyeardiaries@gmail.com**
2. Enable **2-Step Verification**
3. [App passwords](https://myaccount.google.com/apppasswords) → Mail → create
4. Copy the **16-character** password

## 2. Deploy Edge Function

```bash
cd /path/to/newyeardiaries-v2

# Link project if needed
supabase link --project-ref cqrnmyssytgfvgrhhfoz

# Secrets (never commit these)
supabase secrets set \
  SMTP_USER="newyeardiaries@gmail.com" \
  SMTP_PASS="xxxx xxxx xxxx xxxx" \
  SMTP_FROM="New Year Diaries <newyeardiaries@gmail.com>" \
  ORDER_ADMIN_EMAIL="newyeardiaries@gmail.com"

# Deploy (public invoke from checkout with anon key)
supabase functions deploy send-order-email --no-verify-jwt
```

## 3. Verify

```bash
# After deploy, place a test order on the site with a logo JPG + optional PDF.
# Admin + customer should both receive mail; files as real attachments.
```

## 4. Fallback

If SMTP secrets are missing or deploy fails, the site **falls back to EmailJS** automatically (HTML works; free plan cannot add dynamic PDF attachments).

## Security notes

- SMTP password lives only in Supabase secrets, not in the browser.
- Function is callable with anon key (same as forms). Abuse risk is low at wholesale volume; rate-limit later if needed.
