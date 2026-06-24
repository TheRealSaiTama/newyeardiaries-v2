# Design: Red Discounted Price (2026-06-03)

## Overview (Sub-project 2 of 3)
Highlight the final (discounted) price in red when a product has an originalPrice > price.

## Approach
- In ProductCard.js, when rendering the current price span and originalPrice exists, add class `ap-price--discounted`.
- Add CSS rule: `.ap-price--discounted { color: #c0392b; font-weight: 700; }`

## Files
- Modify: `src/components/ProductCard.js:36`
- Modify: `src/styles/components.css` (new rule)

## Success
- Discounted price appears red in all product cards.

(Approved approach B)
