export function renderOrderSuccessPage() {
  document.getElementById('app').innerHTML = `
    <div class="page-content">
      <div class="success-page">
        <div class="success-icon">
          <span class="material-symbols-outlined">check_circle</span>
        </div>
        <h1>Order Received</h1>
        <p>Thank you for your order! We have received your request and will contact you shortly with payment confirmation and shipping details.</p>
        <div style="display:flex;gap:var(--space-4);justify-content:center;flex-wrap:wrap;">
          <a href="/shop" class="btn btn--accent btn--lg">Continue Shopping <span class="material-symbols-outlined" style="font-size:16px;">arrow_forward</span></a>
          <a href="/" class="btn btn--secondary btn--lg">Return Home</a>
        </div>
      </div>
    </div>
  `;
}
