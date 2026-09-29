(function () {
  const header = document.getElementById("site-header");
  const menuToggle = document.getElementById("menu-toggle");

  function onScroll() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 20);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (menuToggle) {
    menuToggle.addEventListener("click", () => {
      const open = document.body.classList.toggle("menu-open");
      menuToggle.setAttribute("aria-expanded", String(open));
      menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });

    document.querySelectorAll(".nav a").forEach((link) => {
      link.addEventListener("click", () => {
        document.body.classList.remove("menu-open");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Open menu");
      });
    });
  }

  /* About page reveal */
  const revealItems = document.querySelectorAll("[data-reveal]");
  if (revealItems.length && "IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.25 }
    );
    revealItems.forEach((el) => revealObserver.observe(el));
  } else {
    revealItems.forEach((el) => el.classList.add("is-visible"));
  }

  /* Catalog only runs when product data + grid exist */
  const products = window.NEXUS_PRODUCTS;
  const grid = document.getElementById("product-grid");
  if (!products || !grid) return;

  const filtersEl = document.getElementById("filters");
  const searchInput = document.getElementById("search");
  const sortSelect = document.getElementById("sort");
  const resultMeta = document.getElementById("result-meta");
  const dialog = document.getElementById("product-dialog");

  let activeCategory = "All";

  const categories = ["All", ...new Set(products.map((p) => p.category))];

  function formatSold(n) {
    return n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k sold` : `${n} sold`;
  }

  function renderFilters() {
    filtersEl.innerHTML = categories
      .map(
        (cat) =>
          `<button type="button" class="filter-btn${cat === activeCategory ? " is-active" : ""}" data-category="${cat}">${cat}</button>`
      )
      .join("");
  }

  function getFiltered() {
    const q = (searchInput.value || "").trim().toLowerCase();
    let list = products.filter((p) => {
      const catOk = activeCategory === "All" || p.category === activeCategory;
      const text = `${p.name} ${p.category} ${p.description}`.toLowerCase();
      return catOk && (!q || text.includes(q));
    });

    const sort = sortSelect.value;
    list = [...list].sort((a, b) => {
      if (sort === "rating") return b.rating - a.rating;
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      if (sort === "name") return a.name.localeCompare(b.name);
      return a.rank - b.rank;
    });

    return list;
  }

  function renderProducts() {
    const list = getFiltered();
    resultMeta.textContent =
      list.length === 0
        ? "No products match your filters."
        : `Showing ${list.length} product${list.length === 1 ? "" : "s"}`;

    if (list.length === 0) {
      grid.innerHTML = `<div class="empty-state">Try another category or clear the search.</div>`;
      return;
    }

    grid.innerHTML = list
      .map(
        (p, i) => `
      <button type="button" class="product" data-id="${p.id}" style="animation-delay:${i * 40}ms">
        <div class="product-media">
          <img src="${p.image}" alt="${p.name}" loading="lazy" />
          <span class="product-rank">#${p.rank}</span>
        </div>
        <div class="product-body">
          <p class="product-category">${p.category}</p>
          <h3>${p.name}</h3>
          <p class="product-desc">${p.description}</p>
          <div class="product-meta">
            <span>$${p.price}/yr</span>
            <span>★ ${p.rating}</span>
          </div>
        </div>
      </button>`
      )
      .join("");
  }

  function openProduct(id) {
    const p = products.find((item) => item.id === id);
    if (!p || !dialog) return;

    document.getElementById("dialog-img").src = p.image;
    document.getElementById("dialog-img").alt = p.name;
    document.getElementById("dialog-category").textContent = p.category;
    document.getElementById("dialog-title").textContent = p.name;
    document.getElementById("dialog-desc").textContent = p.description;
    document.getElementById("dialog-price").textContent = `$${p.price}/yr`;
    document.getElementById("dialog-rating").textContent = `★ ${p.rating}`;
    document.getElementById("dialog-sold").textContent = formatSold(p.sold);
    dialog.showModal();
  }

  filtersEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-category]");
    if (!btn) return;
    activeCategory = btn.dataset.category;
    renderFilters();
    renderProducts();
  });

  searchInput.addEventListener("input", renderProducts);
  sortSelect.addEventListener("change", renderProducts);

  grid.addEventListener("click", (e) => {
    const card = e.target.closest(".product");
    if (card) openProduct(card.dataset.id);
  });

  renderFilters();
  renderProducts();

  /* Animated stats */
  const stats = document.querySelectorAll(".stat[data-count]");
  const animateCount = (el) => {
    const target = Number(el.dataset.count);
    const numEl = el.querySelector(".stat-num");
    const duration = 1100;
    const start = performance.now();

    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      numEl.textContent = String(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  };

  if (stats.length && "IntersectionObserver" in window) {
    const statsObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            statsObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    stats.forEach((stat) => statsObserver.observe(stat));
  } else {
    stats.forEach(animateCount);
  }
})();
