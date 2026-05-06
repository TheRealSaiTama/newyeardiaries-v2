export function renderEnquirySuccessPage() {
  document.getElementById('app').innerHTML = `
    <div class="page-content">
      <div class="success-page">
        <div class="success-icon">
          <span class="material-symbols-outlined">check_circle</span>
        </div>
        <h1>Enquiry Received</h1>
        <p>Thank you for entrusting New Year Diaries with your vision. Our team will review your specifications and respond within 24 hours.</p>
        <div style="display:flex;gap:var(--space-4);justify-content:center;flex-wrap:wrap;">
          <a href="/shop" class="btn btn--accent btn--lg">Explore 2026 Collection <span class="material-symbols-outlined" style="font-size:16px;">arrow_forward</span></a>
          <a href="/" class="btn btn--secondary btn--lg">Return Home</a>
        </div>
      </div>
    </div>
  `;
}
