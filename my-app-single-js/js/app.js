/**
 * Entry point. Listens to global events, mutates data models via state.js, and delegates rendering to view.js.
*/

import { elements } from "./domCache.js";
import { state, saveStateToMemory, clearCartState, resetPromptState } from "./state.js";
import { formatCurrency, showToast } from "./utils.js";
import { initCarousel } from "./carousel.js";
import * as view from "./view.js";

async function initApplication() {
  try {
    const response = await fetch("product.json");
    if (!response.ok) {
      throw new Error(`HTTP transaction layer failed with status: ${response.status}`);
    }

    const data = await response.json();
    const savedProducts = localStorage.getItem("PRODUCTS_STATE");
    const savedCart = localStorage.getItem("CART_STATE");

    if (savedProducts && savedCart) {
      const parsedProducts = JSON.parse(savedProducts);
      state.PRODUCTS = Array.isArray(parsedProducts) ? parsedProducts : [];
      state.CART = JSON.parse(savedCart);
    } else {
      state.PRODUCTS = Array.isArray(data.product) ? data.product : [];
      state.CART = [];
      saveStateToMemory();
    }

    view.renderCatalog();
    view.renderCart();
    view.renderProductCarouselSlides("track");
    view.renderAllProductImages("productsCarousel");

  } catch (error) {
    console.error("Initialization runtime failure:", error);
    if (elements.productGrid) {
      elements.productGrid.innerHTML = `
        <div class="error">
          <p class="error-p">Unable to load product catalog.</p>
          <small class="error-small">
            Please ensure you are opening this project via a local development server web server environment (e.g., Live Server).
          </small>
        </div>
      `;
    }
  }
}

function addToCart(productId) {
  // Loose equal comparison maintained as requested to handle safety across topologies
  const product = state.PRODUCTS.find((p) => p.id == productId);
  if (!product || product.stock <= 0) {
    alert("Sorry, this item is out of stock.");
    return;
  }

  state.activePromptProduct = product;
  state.currentPromptQuantity = 1;
  state.selectedMemory = product.memoryOptions?.length ? product.memoryOptions[0] : "";
  state.selectedColor = product.colorOptions?.length ? product.colorOptions[0] : "";

  if (elements.confirmProductDetails) {
    elements.confirmProductDetails.innerHTML = `
      <div class="modal-right">
        <img src="${product.image}" alt="${product.name}" class="product-img">
      </div>
      <div class="modal-left">
        <div>
          <h4>${product.name}</h4>
          <p><strong>Brand:</strong> ${product.brand}</p>
          <p><strong>Base Unit Cost:</strong> ${formatCurrency(product.price)}</p>
        </div>
      </div>
    `;
  }

  view.renderOptionChoices();
  if (elements.confirmQtyInput) elements.confirmQtyInput.value = state.currentPromptQuantity;
  if (elements.confirmStockWarn) elements.confirmStockWarn.innerText = `Available stock limit: ${product.stock}`;
  if (elements.confirmModal) elements.confirmModal.classList.add("active");
}

function adjustPromptQuantity(amount) {
  if (!state.activePromptProduct) return;
  const targetQty = state.currentPromptQuantity + amount;

  if (targetQty >= 1 && targetQty <= state.activePromptProduct.stock) {
    state.currentPromptQuantity = targetQty;
    if (elements.confirmQtyInput) elements.confirmQtyInput.value = state.currentPromptQuantity;
  }
}

function submitPromptToCart() {
  if (!state.activePromptProduct) return;

  const cartUid = `${state.activePromptProduct.id}-${state.selectedMemory}-${state.selectedColor}`;
  const cartItem = state.CART.find((item) => item.cartUid === cartUid);

  state.activePromptProduct.stock -= state.currentPromptQuantity;
  const addedQuantity = state.currentPromptQuantity;

  if (cartItem) {
    cartItem.quantity += state.currentPromptQuantity;
  } else {
    state.CART.push({
      cartUid,
      id: state.activePromptProduct.id,
      name: state.activePromptProduct.name,
      price: state.activePromptProduct.price,
      image: state.activePromptProduct.image,
      memory: state.selectedMemory,
      color: state.selectedColor,
      quantity: state.currentPromptQuantity,
    });
  }

  showToast({
    title: "Added to cart",
    message: `${state.activePromptProduct.name} • ${state.selectedMemory} | ${state.selectedColor} • Qty: ${addedQuantity}`,
    durationMs: 2400,
  });

  closePromptModal();
  view.triggerBadgeAnimation();
  saveStateToMemory();
  view.renderCatalog();
  view.renderCart();
}

function closePromptModal() {
  if (elements.confirmModal) elements.confirmModal.classList.remove("active");
  resetPromptState();
}

function changeQuantity(cartUid, modifier) {
  const item = state.CART.find((i) => i.cartUid === cartUid);
  if (!item) return;

  const product = state.PRODUCTS.find((p) => p.id === item.id);
  if (!product) return;

  if (modifier === 1) {
    if (product.stock > 0) {
      product.stock -= 1;
      item.quantity += 1;
      view.triggerBadgeAnimation();
    } else {
      alert("Maximum available inventory allocation limit reached for this specific variant configuration.");
    }
  } else if (modifier === -1) {
    product.stock += 1;
    item.quantity -= 1;
    view.triggerBadgeAnimation();

    if (item.quantity <= 0) {
      state.CART = state.CART.filter((i) => i.cartUid !== cartUid);
    }
  }

  saveStateToMemory();
  view.renderCatalog();
  view.renderCart();
}

function openClearCartConfirmModal() {
  const overlay = document.getElementById("clear-cart-confirm-modal");
  if (elements.cartModal) elements.cartModal.classList.remove("active");
  if (overlay) overlay.classList.add("active");
}

// Global scope logic preservation
function closeClearCartConfirmModal() {
  const overlay = document.getElementById("clear-cart-confirm-modal");
  if (overlay) overlay.classList.remove("active");
}

function performClearCart() {
  state.CART.forEach((item) => {
    const product = state.PRODUCTS.find((p) => p.id === item.id);
    if (product) product.stock += item.quantity;
  });

  state.CART = [];
  view.triggerBadgeAnimation();
  saveStateToMemory();
  view.renderCatalog();
  view.renderCart();
}

function clearCart() {
  if (state.CART.length > 0) openClearCartConfirmModal();
}

function proceedToCheckout() {
  if (!state.CART.length) {
    alert("Cart is empty.");
    return;
  }

  const totalBill = state.CART.reduce((sum, item) => sum + item.price * item.quantity, 0);
  view.showCheckoutAlert(totalBill);

  clearCartState();
  view.toggleCartModal(false);
  view.renderCart();
}

// ----------------------------
// Event Declarations & Delegation
// ----------------------------
elements.productGrid?.addEventListener("click", (e) => {
  const target = e.target;
  if (!(target instanceof HTMLElement)) return;

  if (target.classList.contains("toggle-desc-btn")) {
    view.toggleDescriptionFromButton(target);
    return;
  }
  if (target.classList.contains("add-to-cart-btn")) {
    const productId = target.getAttribute("data-product-id");
    addToCart(productId);
  }
});

elements.cartContainer?.addEventListener("click", (e) => {
  const target = e.target;
  if (!(target instanceof HTMLElement) || !target.classList.contains("cart-qty-btn")) return;

  const cartUid = target.getAttribute("data-cart-uid");
  const modifier = Number(target.getAttribute("data-modifier"));
  changeQuantity(cartUid, modifier);
});

elements.cartTrigger?.addEventListener("click", () => view.toggleCartModal(true));
elements.closeModalBtn?.addEventListener("click", () => view.toggleCartModal(false));
elements.emptyCartBtn?.addEventListener("click", clearCart);

elements.qtyMinusBtn?.addEventListener("click", () => adjustPromptQuantity(-1));
elements.qtyPlusBtn?.addEventListener("click", () => adjustPromptQuantity(1));
elements.confirmCancelBtn?.addEventListener("click", closePromptModal);
elements.confirmAddBtn?.addEventListener("click", submitPromptToCart);

elements.clearCartConfirmBtn?.addEventListener("click", () => {
  performClearCart();
  closeClearCartConfirmModal();
  view.toggleCartModal(false);
  showToast({
    title: "Cart Cleared",
    message: "Your shopping cart has been cleared.",
    durationMs: 2400,
  });
});

elements.clearCartCancelBtn?.addEventListener("click", closeClearCartConfirmModal);
elements.clearCartCloseBtn?.addEventListener("click", closeClearCartConfirmModal);

elements.closeAlert?.addEventListener("click", () => {
  if (elements.customAlert) elements.customAlert.classList.remove("active");
});

globalThis.addEventListener("click", (event) => {
  if (event.target === elements.cartModal) view.toggleCartModal(false);
  if (event.target === elements.confirmModal) closePromptModal();

  const clearCartOverlay = document.getElementById("clear-cart-confirm-modal");
  if (event.target === clearCartOverlay) closeClearCartConfirmModal();
});

elements.checkoutBtn?.addEventListener("click", proceedToCheckout);

// Runtime Kickoff
document.addEventListener("DOMContentLoaded", () => {
  initApplication();
  initCarousel();
});