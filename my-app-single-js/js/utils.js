/**
 * Isolates pure utility functions that do not depend on application state or specific DOM structures.
 */

export function formatCurrency(amount) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);
}

/**
 * Show a transient notification (toast) at the bottom/top of the page.
 */

export function showToast({ title = "", message = "", durationMs = 2400 } = {}) {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toastEl = document.createElement("div");
  toastEl.className = "toast";
  toastEl.innerHTML = `
    ${title ? `<div class="toast-title">${title}</div>` : ""}
    ${message ? `<div class="toast-message">${message}</div>` : ""}
  `;

  container.appendChild(toastEl);
  requestAnimationFrame(() => toastEl.classList.add("active"));

  window.setTimeout(() => {
    toastEl.classList.remove("active");
    window.setTimeout(() => {
      toastEl.remove();
      if (container && container.childElementCount === 0) {
        container.remove();
      }
    }, 220);
  }, durationMs);
}