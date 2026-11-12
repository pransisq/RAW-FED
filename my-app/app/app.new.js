let PRODUCTS = [];
let CART = [];

let activePromptProduct = null;
let currentPromptQuantity = 1;
let selectedMemory = "";
let selectedColor = "";

const productGrid = document.getElementById("product-grid");
const cartContainer = document.getElementById("cart-items-container");
const cartCounter = document.getElementById("cart-counter");
const summaryQty = document.getElementById("summary-qty");
const summaryTotal = document.getElementById("summary-total");
const checkoutBtn = document.getElementById("checkout-btn");

const cartModal = document.getElementById("cart-modal");
const cartTrigger = document.getElementById("cart-trigger");
const closeModalBtn = document.getElementById("close-modal-btn");
const emptyCartBtn = document.getElementById("empty-cart-btn");

const confirmModal = document.getElementById("confirm-modal");
const confirmProductDetails = document.getElementById(
  "confirm-product-details",
);
const memoryOptionsTarget = document.getElementById("memory-options-target");
const colorOptionsTarget = document.getElementById("color-options-target");
const confirmQtyInput = document.getElementById("confirm-qty-input");
const confirmStockWarn = document.getElementById("confirm-stock-warn");
const qtyMinusBtn = document.getElementById("qty-minus-btn");
const qtyPlusBtn = document.getElementById("qty-plus-btn");
const confirmCancelBtn = document.getElementById("confirm-cancel-btn");
const confirmAddBtn = document.getElementById("confirm-add-btn");

const hideHeader = document.getElementById("sticky-header");

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);
}

function showToast({ title = "", message = "", durationMs = 2400 } = {}) {
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

function saveStateToMemory() {
  localStorage.setItem("PRODUCTS_STATE", JSON.stringify(PRODUCTS));
  localStorage.setItem("CART_STATE", JSON.stringify(CART));
}

async function initApplication() {
  try {
    const response = await fetch("product.json");
    if (!response.ok) {
      throw new Error(
        `HTTP transaction layer failed with status: ${response.status}`,
      );
    }

    const data = await response.json();
 
    const savedProducts = localStorage.getItem("PRODUCTS_STATE");
    const savedCart = localStorage.getItem("CART_STATE");

    if (savedProducts && savedCart) {
      const parsedProducts = JSON.parse(savedProducts);
      PRODUCTS = Array.isArray(parsedProducts) ? parsedProducts : [];
      CART = JSON.parse(savedCart);
    } else {
      PRODUCTS = Array.isArray(data.product) ? data.product : [];
      CART = [];
      saveStateToMemory();
    }

    renderCatalog();
    renderCart();
    renderProductCarouselSlides("track");
    renderAllProductImages("productsCarousel");

  } catch (error) {
    console.error("Initialization runtime failure:", error);
    if (productGrid) {
      productGrid.innerHTML = `
      <div class = "error">
                <p class = "error-p">
                  Unable to load product catalog.
                </p>
          <small class = "error-small">
            Please ensure you are opening this project via a local development server web server environment (e.g., Live Server).
          </small>
        </div>
      `;
    }
  }
}



function toggleDescriptionFromButton(button) {
  const textSpan = button.previousElementSibling;
  if (!textSpan) return;

  const isExpanded = button.getAttribute("data-expanded") === "true";
  const fullText = button.getAttribute("data-fulltext") || "";
  const maxLength = Number(button.getAttribute("data-maxlength") || "0");

  if (isExpanded) {
    textSpan.textContent = fullText.substring(0, maxLength) + "...";
    button.textContent = "See More";
    button.setAttribute("data-expanded", "false");
  } else {
    textSpan.textContent = fullText;
    button.textContent = "See Less";
    button.setAttribute("data-expanded", "true");
  }
}

function renderCatalog() {
  if (!productGrid) return;
  productGrid.innerHTML = "";

  PRODUCTS.forEach((product) => {
    const isOutOfStock = product.stock === 0;

    const maxDescLength = 45;
    const maxTitleLength = 30;

    const needsTruncation = product.description.length > maxDescLength;

    const truncatedDescription = needsTruncation
      ? product.description.substring(0, maxDescLength) + "..."
      : product.description;

    const truncatedTitle =
      product.name.length > maxTitleLength
        ? product.name.substring(0, maxTitleLength) + "..."
        : product.name;

    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      <div class="product-image-container">
        <img src="${product.image}" alt="${product.name}" class="product-img">
      </div>

      <small class="brand">${product.brand.toUpperCase()}</small>
      <h3 title="${product.name}"> ${truncatedTitle}</h3>

      <p class="description-container">
        <span class="desc-text">${truncatedDescription}</span>
        ${needsTruncation
        ? `
          <button 
            class="toggle-desc-btn"
            type="button"
            data-fulltext="${product.description.replace(/"/g, '"').replace(/`/g, "\\`")}"
            data-maxlength="${maxDescLength}"
            data-expanded="false"
          >See More</button>
        `
        : ""
      }

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

    productGrid.appendChild(card);
  });
}

function renderCart() {
  cartContainer.innerHTML = "";

  if (CART.length === 0) {
    cartContainer.innerHTML =
      "<p class='empty-cart-message'>Your shopping cart is currently empty.</p>";
    if (checkoutBtn) checkoutBtn.disabled = true;
    if (emptyCartBtn) emptyCartBtn.disabled = true;
    updateCalculations();
    return;
  }

  if (checkoutBtn) checkoutBtn.disabled = false;
  if (emptyCartBtn) emptyCartBtn.disabled = false;

  CART.forEach((item) => {
    const itemRow = document.createElement("div");
    itemRow.className = "cart-item";

    itemRow.innerHTML = `
      <div class="cart-image-container">
        <img src="${item.image}" alt="${item.image}" class="cart-item-image">
      </div>
      <div class="cart-product-details">
        <h4>${item.name}</h4>
        <span class = "rendered-color-memory">Specs: ${item.memory} | ${item.color}</span>
        <span>${formatCurrency(item.price * item.quantity)}</span>
      </div>

      <div class="cart-select">
        <button class="cart-qty-btn" type="button" data-cart-uid="${item.cartUid}" data-modifier="-1">-</button>
        <span class="quantity-num">${item.quantity}</span>
        <button class="cart-qty-btn" type="button" data-cart-uid="${item.cartUid}" data-modifier="1">+</button>
      </div>
    `;

    cartContainer.appendChild(itemRow);
  });

  updateCalculations();
}

function renderProductCarouselSlides(trackId) {
  const track = document.getElementById(trackId);
  if (!track) return;

  track.innerHTML = "";

  const products = Array.isArray(PRODUCTS) && PRODUCTS.length ? PRODUCTS : null;
  if (!products) {
    track.innerHTML = "";
    return;
  }

  products.forEach((product) => {
    const slide = document.createElement("div");
    slide.className = "slide";

    slide.innerHTML = `
      <img
        src="${product.image}"
        alt="${product.name}"
        class="carousel-product-image"
      />

    `;

    track.appendChild(slide);
  });
}


function renderAllProductImages(productsCarousel) {
  const container = document.getElementById(productsCarousel);
  if (!container) return;

  container.innerHTML = "";
  // Prefer in-memory PRODUCTS (populated from product.json in initApplication)
  // to avoid stale/partial localStorage state causing incomplete carousel rendering.
  const products = Array.isArray(PRODUCTS) && PRODUCTS.length ? PRODUCTS : null;

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

document.addEventListener("DOMContentLoaded", () => {
  const track = document.getElementById("track");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const indicatorsHost = document.getElementById("carouselIndicators");

  if (!track || !prevBtn || !nextBtn || !indicatorsHost) return;
  // Our carousel implementation uses:
  // - track.style.transform = translateX(-currentIndex * 100%)
  // - current slides are direct children of #track (rendered by renderProductCarouselSlides)

  function getItems() {
    return Array.from(track.children);
  }

  let currentIndex = 0;

  function getCurrentIndexFromTransform() {
    const count = getItems().length;
    if (!count) return 0;

    const t = track.style.transform || "";
    // Expected: translateX(-${currentIndex}%)
    const match = t.match(/translateX\(\s*([-\d.]+)%\s*\)/);
    if (!match) return 0;

    const percent = Number(match[1]); // negative number
    const idx = Math.round(-percent / 100);
    return Math.min(Math.max(idx, 0), count - 1);
  }

  function goToIndex(index) {
    const items = getItems();
    if (!items.length) return;

    const count = items.length;
    currentIndex = Math.min(Math.max(index, 0), count - 1);

    // keep in sync with the transition-based carousel logic.
    track.style.transform = `translateX(${-currentIndex * 100}%)`;
    updateActiveIndicator();
  }

  function renderIndicators() {
    const items = getItems();
    indicatorsHost.innerHTML = "";

    items.forEach((_, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "carousel-indicator-dot";
      btn.setAttribute("aria-label", `Go to slide ${i + 1}`);
      btn.addEventListener("click", () => goToIndex(i));
      indicatorsHost.appendChild(btn);
    });

    updateActiveIndicator();
  }

  function updateActiveIndicator() {
    // Prefer our state; fall back to transform parsing if needed.
    const idx = Number.isFinite(currentIndex)
      ? currentIndex
      : getCurrentIndexFromTransform();

    const dots = Array.from(
      indicatorsHost.querySelectorAll(".carousel-indicator-dot"),
    );

    dots.forEach((dot, i) => {
      if (i === idx) dot.classList.add("active");
      else dot.classList.remove("active");
    });
  }

  // Render dots once slides exist (they are generated in initApplication)
  const rebuild = () => {
    const items = getItems();
    if (!items.length) return;

    // If we already moved via inline transform (or previous state), sync.
    currentIndex = getCurrentIndexFromTransform();

    renderIndicators();
    updateActiveIndicator();
  };

  // initial + after next tick to ensure slides were injected
  setTimeout(rebuild, 0);
  setTimeout(rebuild, 50);

  nextBtn.addEventListener("click", () => {
    const count = getItems().length;
    if (!count) return;
    goToIndex(currentIndex + 1);
  });

  prevBtn.addEventListener("click", () => {
    const count = getItems().length;
    if (!count) return;
    goToIndex(currentIndex - 1);
  });

  window.addEventListener("resize", () => {
    // Keep dots aligned after layout changes.
    renderIndicators();
    updateActiveIndicator();
    // Avoid extra transform updates on resize to prevent transition jitter.
    // goToIndex(currentIndex);
  });

});


function triggerBadgeAnimation() {
  cartCounter.classList.remove("pop");
  void cartCounter.offsetWidth;
  cartCounter.classList.add("pop");
  setTimeout(() => {
    cartCounter.classList.remove("pop");
  }, 200);
}

function addToCart(productId) {
  const product = PRODUCTS.find((p) => p.id === productId);
  if (!product || product.stock <= 0) {
    alert("Sorry, this item is out of stock.");
    return;
  }

  activePromptProduct = product;
  currentPromptQuantity = 1;

  selectedMemory =
    product.memoryOptions && product.memoryOptions.length > 0
      ? product.memoryOptions[0]
      : "";
  selectedColor =
    product.colorOptions && product.colorOptions.length > 0
      ? product.colorOptions[0]
      : "";

  confirmProductDetails.innerHTML = `
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

  renderOptionChoices();

  confirmQtyInput.value = currentPromptQuantity;
  confirmStockWarn.innerText = `Available stock limit: ${product.stock}`;

  confirmModal.classList.add("active");
}

function renderOptionChoices() {
  if (!activePromptProduct) return;

  memoryOptionsTarget.innerHTML = "";
  activePromptProduct.memoryOptions.forEach((size) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `btn-option-choice ${selectedMemory === size ? "selected-active" : ""}`;
    btn.innerText = size;
    btn.addEventListener("click", () => {
      selectedMemory = size;
      renderOptionChoices();
    });
    memoryOptionsTarget.appendChild(btn);
  });

  colorOptionsTarget.innerHTML = "";
  activePromptProduct.colorOptions.forEach((color) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `btn-option-choice ${selectedColor === color ? "selected-active" : ""}`;
    btn.innerText = color;
    btn.addEventListener("click", () => {
      selectedColor = color;
      renderOptionChoices();
    });
    colorOptionsTarget.appendChild(btn);
  });
}

function adjustPromptQuantity(amount) {
  if (!activePromptProduct) return;
  const targetQty = currentPromptQuantity + amount;

  if (targetQty >= 1 && targetQty <= activePromptProduct.stock) {
    currentPromptQuantity = targetQty;
    confirmQtyInput.value = currentPromptQuantity;
  }
}

function submitPromptToCart() {
  if (!activePromptProduct) return;

  const cartUid = `${activePromptProduct.id}-${selectedMemory}-${selectedColor}`;
  const cartItem = CART.find((item) => item.cartUid === cartUid);

  activePromptProduct.stock -= currentPromptQuantity;

  const addedQuantity = currentPromptQuantity;

  if (cartItem) {
    cartItem.quantity += currentPromptQuantity;
  } else {
    CART.push({
      cartUid,
      id: activePromptProduct.id,
      name: activePromptProduct.name,
      price: activePromptProduct.price,
      image: activePromptProduct.image,
      memory: selectedMemory,
      color: selectedColor,
      quantity: currentPromptQuantity,
    });
  }

  showToast({
    title: "Added to cart",
    message: `${activePromptProduct.name} • ${selectedMemory} | ${selectedColor} • Qty: ${addedQuantity}`,
    durationMs: 2400,
  });

  closePromptModal();
  triggerBadgeAnimation();
  saveStateToMemory();
  renderCatalog();
  renderCart();
  updateCalculations();
}

function closePromptModal() {
  confirmModal.classList.remove("active");
  activePromptProduct = null;
  currentPromptQuantity = 1;
  selectedMemory = "";
  selectedColor = "";
}

function changeQuantity(cartUid, modifier) {
  const item = CART.find((i) => i.cartUid === cartUid);
  if (!item) return;

  const product = PRODUCTS.find((p) => p.id === item.id);
  if (!product) return;

  if (modifier === 1) {
    if (product.stock > 0) {
      product.stock -= 1;
      item.quantity += 1;
      triggerBadgeAnimation();
    } else {
      alert(
        `Maximum available inventory allocation limit reached for this specific variant configuration.`,
      );
    }
  } else if (modifier === -1) {
    product.stock += 1;
    item.quantity -= 1;
    triggerBadgeAnimation();

    if (item.quantity <= 0) {
      CART = CART.filter((i) => i.cartUid !== cartUid);
    }
  }

  saveStateToMemory();
  renderCatalog();
  renderCart();
}

function openClearCartConfirmModal() {
  const overlay = document.getElementById("clear-cart-confirm-modal");
  if (!overlay) return;

  if (cartModal) cartModal.classList.remove("active");

  overlay.classList.add("active");
}

function closeClearCartConfirmModal() {
  const overlay = document.getElementById("clear-cart-confirm-modal");
  if (!overlay) return;
  overlay.classList.remove("active");
}

function performClearCart() {
  CART.forEach((item) => {
    const product = PRODUCTS.find((p) => p.id === item.id);
    if (product) {
      product.stock += item.quantity;
    }
  });

  CART = [];
  triggerBadgeAnimation();
  saveStateToMemory();
  renderCatalog();
  renderCart();
  updateCalculations();
}

function clearCart() {
  if (CART.length === 0) return;
  openClearCartConfirmModal();
}

function updateCalculations() {
  const totalItems = CART.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = CART.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  if (cartCounter) cartCounter.innerText = totalItems;
  if (summaryQty) summaryQty.innerText = totalItems;
  if (summaryTotal) summaryTotal.innerText = formatCurrency(totalPrice);
}

function toggleCartModal(show) {
  if (show) cartModal.classList.add("active");
  else cartModal.classList.remove("active");

  const stickyHeader = document.getElementById("sticky-header");
  if (stickyHeader) stickyHeader.classList.remove("hide-header");
}

// ---- Event delegation: remove inline onclick statements ----
productGrid?.addEventListener("click", (e) => {
  const target = e.target;

  if (!(target instanceof HTMLElement)) return;

  if (target.classList.contains("toggle-desc-btn")) {
    toggleDescriptionFromButton(target);
    return;
  }

  if (target.classList.contains("add-to-cart-btn")) {
    const productId = Number(target.getAttribute("data-product-id"));
    addToCart(productId);
  }
});

cartContainer?.addEventListener("click", (e) => {
  const target = e.target;
  if (!(target instanceof HTMLElement)) return;

  if (!target.classList.contains("cart-qty-btn")) return;

  const cartUid = target.getAttribute("data-cart-uid");
  const modifier = Number(target.getAttribute("data-modifier"));
  changeQuantity(cartUid, modifier);
});

// ---- Static event listeners (from index.html) ----
cartTrigger?.addEventListener("click", () => toggleCartModal(true));
closeModalBtn?.addEventListener("click", () => toggleCartModal(false));

if (emptyCartBtn) emptyCartBtn.addEventListener("click", clearCart);

qtyMinusBtn?.addEventListener("click", () => adjustPromptQuantity(-1));
qtyPlusBtn?.addEventListener("click", () => adjustPromptQuantity(1));

confirmCancelBtn?.addEventListener("click", closePromptModal);
confirmAddBtn?.addEventListener("click", submitPromptToCart);

// Clear cart confirmation modal wiring
const clearCartConfirmBtn = document.getElementById("clear-cart-confirm-btn");
const clearCartCancelBtn = document.getElementById("clear-cart-cancel-btn");
const clearCartCloseBtn = document.getElementById("clear-cart-close-btn");

clearCartConfirmBtn?.addEventListener("click", () => {
  performClearCart();
  closeClearCartConfirmModal();
  toggleCartModal(false);

  showToast({
    title: "Cart Cleared",
    message: "Your shopping cart has been cleared.",
    durationMs: 2400,
  });
});

clearCartCancelBtn?.addEventListener("click", () => {
  closeClearCartConfirmModal();
});

clearCartCloseBtn?.addEventListener("click", () => {
  closeClearCartConfirmModal();
});

window.addEventListener("click", (event) => {
  if (event.target === cartModal) toggleCartModal(false);
  if (event.target === confirmModal) closePromptModal();

  const clearCartOverlay = document.getElementById("clear-cart-confirm-modal");
  if (event.target === clearCartOverlay) closeClearCartConfirmModal();
});

checkoutBtn?.addEventListener("click", proceedToCheckout);

function proceedToCheckout() {
  if (!CART.length) {
    alert("Cart is empty.");
    return;
  }

  const totalBill = CART.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  showCheckoutAlert(totalBill);

  CART = [];
  localStorage.removeItem("CART_STATE");
  toggleCartModal(false);
  renderCart();
  updateCalculations();
}

function showCheckoutAlert(totalAmount) {
  const customAlert = document.getElementById("alert-overlay");
  const alertTotalPrice = document.getElementById("total-price");
  const closeAlert = document.getElementById("close-alert");

  if (alertTotalPrice)
    alertTotalPrice.textContent = formatCurrency(totalAmount);

  const stickyHeader = document.getElementById("sticky-header");
  if (stickyHeader) stickyHeader.classList.remove("hide-header");

  if (customAlert) customAlert.classList.add("active");

  if (closeAlert && customAlert) {
    closeAlert.onclick = () => {
      customAlert.classList.remove("active");
    };
  }
}

initApplication();