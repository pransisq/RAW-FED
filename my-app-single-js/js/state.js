/**
 * Acts as the single source code of truth that handles local storage sync operations and mutations.
 */

export const state = {
  PRODUCTS: [],
  CART: [],
  // Modal states
  activePromptProduct: null,
  currentPromptQuantity: 1,
  selectedMemory: "",
  selectedColor: ""
};

export function saveStateToMemory() {
  localStorage.setItem("PRODUCTS_STATE", JSON.stringify(state.PRODUCTS));
  localStorage.setItem("CART_STATE", JSON.stringify(state.CART));
}

export function clearCartState() {
  state.CART = [];
  localStorage.removeItem("CART_STATE");
}

export function resetPromptState() {
  state.activePromptProduct = null;
  state.currentPromptQuantity = 1;
  state.selectedMemory = "";
  state.selectedColor = "";
}