import { getFooterContent } from '../lib/content.js';

export function renderFooter(content) {
  const f = content ? getFooterContent(content) : {};
  return `
    <footer class="nyd-footer">
      <div class="nyd-footer__inner">
        <div class="nyd-footer__grid">
          <div class="nyd-footer__brand">
            <img src="/logo-big-transparent.png" alt="New Year Diaries" class="nyd-footer__logo">
            <p class="nyd-footer__tagline">${f.tagline || 'Premium Diaries, Planners & Corporate Stationery. Crafted in India since 1998.'}</p>
            <p class="nyd-footer__about">${content?.footerSections?.about_left?.content || ''}</p>
            <p class="nyd-footer__exporter">${content?.footerSections?.exporter_right?.content || ''}</p>
            <div class="nyd-footer__contact">
              <div class="nyd-footer__contact-item">
                <span class="nyd-footer__contact-icon">📍</span>
                <span>${f.address || '174 D, Bawana Industrial Area, Delhi 110039, INDIA'}</span>
              </div>
              <div class="nyd-footer__contact-item">
                <span class="nyd-footer__contact-icon">📞</span>
                <span>${f.phone || '+91 9311135190'}${f.phone2 ? ' | ' + f.phone2 : ''}</span>
              </div>
              <div class="nyd-footer__contact-item">
                <span class="nyd-footer__contact-icon">✉️</span>
                <span>${f.email || 'support@newyeardiaries.in'}</span>
              </div>
              <div class="nyd-footer__contact-item">
                <span class="nyd-footer__contact-icon">🕐</span>
                <span>${f.hours || 'Open time: 10:30AM - 8:00PM'}</span>
              </div>
            </div>
          </div>

          <div class="nyd-footer__col">
            <h4 class="nyd-footer__heading">Information</h4>
            <ul class="nyd-footer__links">
              <li><a href="/about">About Us</a></li>
              <li><a href="/faq">FAQ's</a></li>
              <li><a href="/privacy-policy">Privacy Policy</a></li>
              <li><a href="/terms">Terms & Conditions</a></li>
              <li><a href="/shipping-returns">Shipping & Returns</a></li>
              <li><a href="/contact">Contact Us</a></li>
            </ul>
          </div>

           <div class="nyd-footer__col">
             <h4 class="nyd-footer__heading">Our Products</h4>
             <div class="nyd-footer__services">${content?.footerSections?.services_list?.content || ''}</div>
             <ul class="nyd-footer__links">
              <li><a href="/shop">Premium Diary</a></li>
              <li><a href="/shop">New Year Diary</a></li>
              <li><a href="/shop">Leather Planners</a></li>
              <li><a href="/shop">Calendars</a></li>
              <li><a href="/shop/corporate">Corporate Gift Sets</a></li>
              <li><a href="/shop/corporate">Best Seller Corporate Gifts</a></li>
              <li><a href="/shop">Leather Gifts</a></li>
            </ul>
          </div>

          <div class="nyd-footer__col nyd-footer__map-col">
            <h4 class="nyd-footer__heading">Find Us</h4>
            ${f.mapEmbed
              ? `<div class="nyd-footer__map-container" style="border-radius:var(--radius-md);overflow:hidden;border:1px solid var(--color-border-light)">
                  ${f.mapEmbed.trim().startsWith('<iframe')
                    ? f.mapEmbed
                    : `<iframe src="${f.mapEmbed}" style="width:100%;height:150px;border:0;display:block;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`
                  }
                 </div>`
              : `<img class="nyd-footer__map" src="/images/footer-map.png" alt="New Year Diaries location map" loading="lazy">`
            }
          </div>
        </div>

        <div class="nyd-footer__bottom">
          <div class="nyd-footer__bottom-left">
            <span class="nyd-footer__copyright">${f.copyright || '© 2027 New Year Diaries. All Rights Reserved.'}</span>
          </div>
          <div class="nyd-footer__bottom-right">
            <div class="nyd-footer__social">
              ${f.facebook ? `<a href="${f.facebook}" target="_blank" rel="noopener" aria-label="Facebook"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg></a>` : ''}
              ${f.instagram ? `<a href="${f.instagram}" target="_blank" rel="noopener" aria-label="Instagram"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="white" stroke-width="2"/></svg></a>` : ''}
              ${f.twitter ? `<a href="${f.twitter}" target="_blank" rel="noopener" aria-label="Twitter"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/></svg></a>` : ''}
              ${f.youtube ? `<a href="${f.youtube}" target="_blank" rel="noopener" aria-label="YouTube"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="white"/></svg></a>` : ''}
            </div>
            <img src="${f.paymentIcons || '/images/payment-icons-transparent.png'}" alt="Payment Methods" class="nyd-footer__payment">
          </div>
        </div>
      </div>
    </footer>
  `;
}
