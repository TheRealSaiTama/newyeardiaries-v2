export function renderOrderSuccessPage() {
  const orderNumber = sessionStorage.getItem('lastOrderNumber') || '';
  document.getElementById('app').innerHTML = `
    <div class="page-content">
      <div class="container section">
        <div class="checkout-stepper">
          <div class="step completed"><span class="step-indicator"><span class="material-symbols-outlined" style="font-size:16px;">check</span></span><span class="step-label">Contact Info</span></div>
          <div class="step-connector completed"></div>
          <div class="step completed"><span class="step-indicator"><span class="material-symbols-outlined" style="font-size:16px;">check</span></span><span class="step-label">Review</span></div>
          <div class="step-connector completed"></div>
          <div class="step active"><span class="step-indicator">3</span><span class="step-label">Order Confirmation</span></div>
        </div>
      </div>
      <div class="success-page">
        <div class="success-icon">
          <span class="material-symbols-outlined">check_circle</span>
        </div>
        <h1>Thank You!</h1>
        <p class="success-lede">Thank you for ordering with New Year Diaries.</p>
        <p class="success-received">We have successfully received your order${orderNumber ? ` <strong>#${orderNumber}</strong>` : ''}.</p>
        <p class="success-status">Order Confirmed.</p>
        <p class="success-followup">We will contact you soon for shipping and payment details.</p>
        <div style="display:flex;gap:var(--space-4);justify-content:center;flex-wrap:wrap;">
          <a href="/shop" class="btn btn--accent btn--lg">Continue Shopping</a>
          <a href="/account" class="btn btn--secondary btn--lg">View Order</a>
        </div>
      </div>
      </div>
    </div>
  `;
}
