/**
 * Simple, streamlined DOM carousel.
 */
export function initCarousel() {
  // --- DOM References ---
  const track = document.getElementById("track");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const indicatorsHost = document.getElementById("carouselIndicators");

  // Safety check: Exit if elements aren't present yet
  if (!track || !prevBtn || !nextBtn || !indicatorsHost) return;

  let currentIndex = 0;

  // Helper to fetch current slides (dynamically injected by view.js)
  const getItems = () => Array.from(track.children);

  // --- Core Navigation ---
  function goToIndex(index) {
    const items = getItems();
    if (!items.length) return;

    // Clamp index between 0 and the last item index
    currentIndex = Math.min(Math.max(index, 0), items.length - 1);

    // Slide the track based on index (100% width per slide)
    track.style.transform = `translateX(${-currentIndex * 100}%)`;

    updateActiveIndicator();
  }

  // --- Indicators (Dots) ---
  function renderIndicators() {
    indicatorsHost.innerHTML = "";
    
    getItems().forEach((_, i) => {
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
    const dots = Array.from(indicatorsHost.querySelectorAll(".carousel-indicator-dot"));
    dots.forEach((dot, i) => {
      dot.classList.toggle("active", i === currentIndex);
    });
  }

  // --- Initialization & View Setup ---
  // Wait a split second for view.js to finish injecting slides, then draw indicators
  setTimeout(() => {
    renderIndicators();
    goToIndex(0); 
  }, 50);

  // --- Event Listeners ---
  nextBtn.addEventListener("click", () => goToIndex(currentIndex + 1));
  prevBtn.addEventListener("click", () => goToIndex(currentIndex - 1));

  // Accessibility: Left/Right Arrow keyboard navigation
  track.setAttribute("tabindex", "0");
  track.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      goToIndex(currentIndex + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      goToIndex(currentIndex - 1);
    }
  });
}