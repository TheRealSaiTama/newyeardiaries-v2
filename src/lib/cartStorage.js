export function parseStorageList(raw) {
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addLineItem(list, productId, qty, defaultQty = 1) {
  const next = Array.isArray(list) ? list.slice() : [];
  const id = productId;
  const addQty = Number(qty) || defaultQty;
  const existing = next.find((item) => String(item.productId) === String(id));
  if (existing) {
    existing.qty = (Number(existing.qty) || 0) + addQty;
  } else {
    next.push({ productId: id, qty: addQty });
  }
  return next;
}

export function removeLineItem(list, productId) {
  return (Array.isArray(list) ? list : []).filter(
    (item) => String(item.productId) !== String(productId)
  );
}

export function setLineQty(list, productId, qty, minQty = 1) {
  const next = Array.isArray(list) ? list.slice() : [];
  const item = next.find((i) => String(i.productId) === String(productId));
  if (item) item.qty = Math.max(minQty, Number(qty) || minQty);
  return next;
}

export function cartItemCount(list) {
  return (Array.isArray(list) ? list : []).reduce((s, i) => s + (Number(i.qty) || 0), 0);
}
