
/**
 * Centralized DOM elements selectors.
 * 
 */

export const elements = {
  productGrid: document.getElementById("product-grid"),
  cartContainer: document.getElementById("cart-items-container"),
  cartCounter: document.getElementById("cart-counter"),
  summaryQty: document.getElementById("summary-qty"),
  summaryTotal: document.getElementById("summary-total"),
  checkoutBtn: document.getElementById("checkout-btn"),

  cartModal: document.getElementById("cart-modal"),
  cartTrigger: document.getElementById("cart-trigger"),
  closeModalBtn: document.getElementById("close-modal-btn"),
  emptyCartBtn: document.getElementById("empty-cart-btn"),

  confirmModal: document.getElementById("confirm-modal"),
  confirmProductDetails: document.getElementById("confirm-product-details"),
  memoryOptionsTarget: document.getElementById("memory-options-target"),
  colorOptionsTarget: document.getElementById("color-options-target"),
  confirmQtyInput: document.getElementById("confirm-qty-input"),
  confirmStockWarn: document.getElementById("confirm-stock-warn"),
  qtyMinusBtn: document.getElementById("qty-minus-btn"),
  qtyPlusBtn: document.getElementById("qty-plus-btn"),
  confirmCancelBtn: document.getElementById("confirm-cancel-btn"),
  confirmAddBtn: document.getElementById("confirm-add-btn"),

  stickyHeader: document.getElementById("sticky-header"),

  // Clear cart confirmation modal elements
  clearCartConfirmBtn: document.getElementById("clear-cart-confirm-btn"),
  clearCartCancelBtn: document.getElementById("clear-cart-cancel-btn"),
  clearCartCloseBtn: document.getElementById("clear-cart-close-btn"),

  // Custom checkout alert elements
  customAlert : document.getElementById("alert-overlay"),
  alertTotalPrice : document.getElementById("total-price"),
  closeAlert: document.getElementById("close-alert"),
};