# Red Discounted Price Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the final (discounted) price red in product cards when originalPrice > price.

**Architecture:** Add conditional class in ProductCard render, pure CSS rule for the class.

**Tech Stack:** Vanilla JS + CSS, existing ProductCard + components.css.

---

### Task 1: Add discounted class in ProductCard.js

**Files:**
- Modify: `src/components/ProductCard.js:36`

- [ ] **Step 1: Read current price render**
Run: `sed -n '32,38p' src/components/ProductCard.js`

- [ ] **Step 2: Add class when discounted**
Change the current price span to:
```js
<span class="ap-price-current ${product.originalPrice && product.originalPrice > product.price ? 'ap-price--discounted' : ''}">₹${product.price}</span>
```

- [ ] **Step 3: Commit**
```bash
git add src/components/ProductCard.js
git commit -m "feat: add ap-price--discounted class on current price when discounted"
```

### Task 2: Add CSS rule for red discounted price

**Files:**
- Modify: `src/styles/components.css` (near .ap-price-current)

- [ ] **Step 1: Add the rule**
```css
.ap-price--discounted {
  color: #c0392b;
  font-weight: 700;
}
```

- [ ] **Step 2: Commit**
```bash
git add src/styles/components.css
git commit -m "style: red color for discounted current price"
```

### Task 3: Verification

**Files:** none

- [ ] **Step 1: Run dev**
`npm run dev`

- [ ] **Step 2: Check cards**
Open shop/home, confirm discounted products show current price in red.

- [ ] **Step 3: Commit note**
```bash
git commit --allow-empty -m "chore: manual verification of red discounted price complete"
```

**Plan complete and saved to `docs/superpowers/plans/2026-06-03-red-discounted-price.md`.**
