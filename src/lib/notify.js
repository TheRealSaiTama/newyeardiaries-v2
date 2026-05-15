const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

export function sendQuoteEmail(data) {
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) return Promise.resolve();

  return fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: SERVICE_ID,
      template_id: TEMPLATE_ID,
      user_id: PUBLIC_KEY,
      template_params: {
        title: `Bulk Quote - ${data.company}`,
        name: data.name,
        email: data.email,
        message: [
          `Company: ${data.company}`,
          `Phone: ${data.phone}`,
          `Product: ${data.product_type || 'Not specified'}`,
          `Quantity: ${data.quantity || 'Not specified'}`,
          `Requirements: ${data.custom_requirements || 'None'}`,
        ].join('\n'),
      },
    }),
  });
}
