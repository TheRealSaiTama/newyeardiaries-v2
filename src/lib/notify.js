const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

function sendEmail(templateParams) {
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) return Promise.resolve();
  return fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: SERVICE_ID,
      template_id: TEMPLATE_ID,
      user_id: PUBLIC_KEY,
      template_params: {
        to_email: 'iamravi11@gmail.com',
        ...templateParams,
      },
    }),
  });
}

export function sendQuoteEmail(data) {
  return sendEmail({
    title: `[${data.enquiry_code || 'BQ'}] Bulk Quote - ${data.company}`,
    name: data.name,
    email: data.email,
    message: [
      `Enquiry Code: ${data.enquiry_code || 'N/A'}`,
      ``,
      `--- CONTACT ---`,
      `Name: ${data.name}`,
      `Company: ${data.company}`,
      `Email: ${data.email}`,
      `Phone: ${data.phone}`,
      ``,
      `--- ORDER DETAILS ---`,
      `Product Interest: ${data.product_type || 'Not specified'}`,
      `Quantity: ${data.quantity || 'Not specified'}`,
      `${data.product_names ? `Products from Quote List:\n${data.product_names}` : ''}`,
      ``,
      `--- REQUIREMENTS ---`,
      `Requirements: ${data.custom_requirements || 'None'}`,
    ].join('\n'),
  });
}

export function sendContactEmail(data) {
  return sendEmail({
    title: `[${data.enquiry_code || 'CT'}] Contact: ${data.subject}`,
    name: data.name,
    email: data.email,
    message: [
      `Enquiry Code: ${data.enquiry_code || 'N/A'}`,
      ``,
      `--- CONTACT ---`,
      `Name: ${data.name}`,
      `Email: ${data.email}`,
      ``,
      `--- MESSAGE ---`,
      `Subject: ${data.subject}`,
      `Message: ${data.message || 'No message'}`,
    ].join('\n'),
  });
}

export function sendOrderEmail(data) {
  const itemsText = data.items.map(item =>
    `- ${item.name} × ${item.qty} = ₹${item.lineTotal}`
  ).join('\n');

  return sendEmail({
    title: `[${data.orderNumber || 'ORD'}] New Order`,
    name: `${data.firstName} ${data.lastName}`,
    email: data.email,
    message: [
      `Order Number: ${data.orderNumber}`,
      ``,
      `--- BILLING DETAILS ---`,
      `Name: ${data.firstName} ${data.lastName}`,
      `Company: ${data.company || 'N/A'}`,
      `GST: ${data.gst || 'N/A'}`,
      `Address: ${data.addressLine1}${data.addressLine2 ? ', ' + data.addressLine2 : ''}`,
      `City: ${data.city}`,
      `State: ${data.state}`,
      `Postcode: ${data.postcode}`,
      `Country: ${data.country}`,
      `Phone: ${data.phone}`,
      `Email: ${data.email}`,
      ``,
      `--- ORDER ITEMS ---`,
      itemsText,
      ``,
      `--- PAYMENT ---`,
      `Payment Method: ${data.paymentMethod}`,
      `Subtotal: ₹${data.subtotal}`,
      `IGST (18%): ₹${data.gstAmount}`,
      `Shipping: ₹${data.shipping}`,
      `Total: ₹${data.total}`,
      ``,
      `Special Instructions: ${data.specialInstructions || 'None'}`,
    ].join('\n'),
  });
}
