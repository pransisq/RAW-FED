/**
 * Consumes raw data and outputs HTML string templates in your DOM wrappers.
 */
import { elements } from "./domCache.js";
import { formatCurrency } from "./utils.js";
import { state } from "./state.js";

export function triggerBadgeAnimation() {
  if (!elements.cartCounter) return;
  elements.cartCounter.classList.remove("pop");
  void elements.cartCounter.offsetWidth;
  elements.cartCounter.classList.add("pop");
  setTimeout(() => elements.cartCounter.classList.remove("pop"), 200);
}

export function updateCalculations() {
  const totalItems = state.CART.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = state.CART.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (elements.cartCounter) elements.cartCounter.innerText = totalItems;
  if (elements.summaryQty) elements.summaryQty.innerText = totalItems;
  if (elements.summaryTotal) elements.summaryTotal.innerText = formatCurrency(totalPrice);
}

export function toggleDescriptionFromButton(button) {
  const textSpan = button.previousElementSibling;
  if (!textSpan) return;

  const isExpanded = button.dataset.expanded === "true";
  const fullText = button.dataset.fulltext || "";
  const maxLength = Number(button.dataset.maxlength || "0");

  if (isExpanded) {
    textSpan.textContent = fullText.substring(0, maxLength) + "...";
    button.textContent = "See More";
    button.dataset.expanded = "false";
  } else {
    textSpan.textContent = fullText;
    button.textContent = "See Less";
    button.dataset.expanded = "true";
  }
}

export function renderCatalog() {
  if (!elements.productGrid) return;
  elements.productGrid.innerHTML = "";

  state.PRODUCTS.forEach((product) => {
    const isOutOfStock = product.stock === 0;
    const maxDescLength = 45;
    const maxTitleLength = 30;

    const needsTruncation = product.description.length > maxDescLength;
    const truncatedDescription = needsTruncation
      ? product.description.substring(0, maxDescLength) + "..."
      : product.description;

    const truncatedTitle = product.name.length > maxTitleLength
      ? product.name.substring(0, maxTitleLength) + "..."
      : product.name;

    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      <div class="product-image-container">
        <img src="${product.image}" alt="${product.name}" class="product-img">
      </div>
      <small class="brand">${product.brand.toUpperCase()}</small>
      <h3 title="${product.name}">${truncatedTitle}</h3>
      <p class="description-container">
        <span class="desc-text">${truncatedDescription}</span>
        ${needsTruncation ? `
          <button 
            class="toggle-desc-btn"
            type="button"
            data-fulltext="${product.description.replaceAll('`', "\\`")}"
            data-maxlength="${maxDescLength}"
            data-expanded="false"
          >See More</button>
        ` : ""}
      </p>
      <p class="price">${formatCurrency(product.price)}</p>
      <p class="stock">Stock: ${isOutOfStock ? "Out of Stock" : product.stock}</p>
      <button 
        class="add-to-cart-btn"
        type="button"
        data-product-id="${product.id}"
        ${isOutOfStock ? "disabled" : ""}
      >
        ${isOutOfStock ? "Unavailable" : "ADD TO CART"}
      </button>
    `;
    elements.productGrid.appendChild(card);
  });
}

export function renderCart() {
  if (!elements.cartContainer) return;
  elements.cartContainer.innerHTML = "";
  if (state.CART.length === 0) {
    elements.cartContainer.innerHTML = "<p class='empty-cart-message'>Your shopping cart is currently empty.</p>";
    if (elements.checkoutBtn) elements.checkoutBtn.disabled = true;
    if (elements.emptyCartBtn) elements.emptyCartBtn.disabled = true;
    updateCalculations();
    return;
  }
  if (elements.checkoutBtn) elements.checkoutBtn.disabled = false;
  if (elements.emptyCartBtn) elements.emptyCartBtn.disabled = false;
  state.CART.forEach((item) => {
    const itemRow = document.createElement("div");
    itemRow.className = "cart-item";
    itemRow.innerHTML = `
      <div class="cart-image-container">
        <img src="${item.image}" alt="${item.image}" class="cart-item-image">
      </div>
      <div class="cart-product-details">
        <h4>${item.name}</h4>
        <span class="rendered-color-memory">Specs: ${item.memory} | ${item.color}</span>
        <span>${formatCurrency(item.price * item.quantity)}</span>
      </div>
      <div class="cart-select">
        <button class="cart-qty-btn" type="button" data-cart-uid="${item.cartUid}" data-modifier="-1">-</button>
        <span class="quantity-num">${item.quantity}</span>
        <button class="cart-qty-btn" type="button" data-cart-uid="${item.cartUid}" data-modifier="1">+</button>
      </div>
    `;
    elements.cartContainer.appendChild(itemRow);
  });
  updateCalculations();
}

export function renderProductCarouselSlides(trackId) {
  const track = document.getElementById(trackId);
  if (!track) return;
  track.innerHTML = "";
  const products = Array.isArray(state.PRODUCTS) && state.PRODUCTS.length ? state.PRODUCTS : null;
  if (!products) return;
  products.forEach((product) => {
    const slide = document.createElement("div");
    slide.className = "slide";
    slide.innerHTML = `<img src="${product.image}" alt="${product.name}" class="carousel-product-image" />`;
    track.appendChild(slide);
  });
}

export function renderAllProductImages(productsCarousel) {
  const container = document.getElementById(productsCarousel);
  if (!container) return;
  container.innerHTML = "";
  const products = Array.isArray(state.PRODUCTS) && state.PRODUCTS.length ? state.PRODUCTS : null;
  if (!products) {
    container.innerHTML = '<p class="no-data">No products available.</p>';
    return;
  }
  products.forEach((product) => {
    const imageSrc = product.imageUrl || product.image;
    if (!imageSrc) return;
    const imgElement = document.createElement("img");
    imgElement.src = imageSrc;
    imgElement.alt = product.name;
    imgElement.className = "carousel-item-image";
    container.appendChild(imgElement);
  });
}

export function renderOptionChoices() {
  if (!state.activePromptProduct) return;
  if (elements.memoryOptionsTarget) {
    elements.memoryOptionsTarget.innerHTML = "";
    state.activePromptProduct.memoryOptions.forEach((size) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `btn-option-choice ${state.selectedMemory === size ? "selected-active" : ""}`;
      btn.innerText = size;
      btn.addEventListener("click", () => {
        state.selectedMemory = size;
        renderOptionChoices();
      });
      elements.memoryOptionsTarget.appendChild(btn);
    });
  }
  if (elements.colorOptionsTarget) {
    elements.colorOptionsTarget.innerHTML = "";
    state.activePromptProduct.colorOptions.forEach((color) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `btn-option-choice ${state.selectedColor === color ? "selected-active" : ""}`;
      btn.innerText = color;
      btn.addEventListener("click", () => {
        state.selectedColor = color;
        renderOptionChoices();
      });
      elements.colorOptionsTarget.appendChild(btn);
    });
  }
}

export function toggleCartModal(show) {
  if (elements.cartModal) {
    elements.cartModal.classList.toggle("active", show);
  }
  if (elements.stickyHeader) {
    elements.stickyHeader.classList.remove("hide-header");
  }
}

export function showCheckoutAlert(totalAmount) {
  if (elements.alertTotalPrice) {
    elements.alertTotalPrice.textContent = formatCurrency(totalAmount);
  }
  if (elements.stickyHeader) {
    elements.stickyHeader.classList.remove("hide-header");
  }
  if (elements.customAlert) {
    elements.customAlert.classList.add("active");
  }
}