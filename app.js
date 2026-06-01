const LOGO_PLACEHOLDER = "assets/trevs-logo.svg";
const GIFT_VOUCHER_LINK = "https://app.squareup.com/gift/ML98DXGN0QVH1/order";
const MENU_DATA_VERSION = "2026-06-01-client-photos";

const defaultMenu = JSON.parse(document.querySelector("#menu-data").textContent);

const labels = {
  specials: "Trev's Specials",
  breakfast: "Breakfast/Lunch Menu",
  dinner: "Dinner Menu",
  takeaway: "Takeaway Menu",
  catering: "Catering Menu"
};

if (localStorage.getItem("trevs-menu-version") !== MENU_DATA_VERSION) {
  localStorage.setItem("trevs-menu", JSON.stringify(defaultMenu));
  localStorage.setItem("trevs-menu-version", MENU_DATA_VERSION);
}

let menu = read("trevs-menu", defaultMenu);
let cart = read("trevs-cart", []);
let orders = read("trevs-orders", []);
let settings = read("trevs-settings", { squareLink: "" });
let activeCategory = "specials";

const grid = document.querySelector("#menu-grid");
const cartDrawer = document.querySelector("#cart-drawer");
const cartItems = document.querySelector("#cart-items");
const cartCount = document.querySelector("#cart-count");
const cartTotal = document.querySelector("#cart-total");
const searchInput = document.querySelector("#menu-search");
const menuTitle = document.querySelector("#menu-title");
const menuKicker = document.querySelector("#menu-kicker");

function read(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function money(value) {
  return value === 0 ? "Enquire" : `$${Number(value).toFixed(2)}`;
}

function imageFor(item) {
  return item.image && item.image.trim() ? item.image : LOGO_PLACEHOLDER;
}

function renderMenu() {
  const term = searchInput.value.trim().toLowerCase();
  const items = menu.filter((item) => {
    const inCategory = item.category === activeCategory;
    const matchesSearch = !term || `${item.name} ${item.description}`.toLowerCase().includes(term);
    return inCategory && matchesSearch;
  });

  menuTitle.textContent = labels[activeCategory];
  menuKicker.textContent = activeCategory === "specials" ? "Trev's Specials" : "Order online";
  grid.innerHTML = items.map((item) => `
    <article class="menu-card">
      <img src="${imageFor(item)}" alt="${item.name}" onerror="this.src='${LOGO_PLACEHOLDER}'" />
      <div class="menu-card-body">
        <h3>${item.name}</h3>
        <p>${item.description}</p>
        <div class="menu-card-footer">
          <span class="price">${money(item.price)}</span>
          <button class="add-button" type="button" data-add="${item.id}">Add to Cart</button>
        </div>
      </div>
    </article>
  `).join("") || `<p>No menu items found.</p>`;
}

function setCategory(category) {
  activeCategory = category;
  document.querySelectorAll("[data-category]").forEach((button) => {
    button.classList.toggle("active", button.dataset.category === category);
  });
  renderMenu();
  document.querySelector("#order").scrollIntoView({ behavior: "smooth", block: "start" });
}

function addToCart(id) {
  const item = menu.find((entry) => entry.id === id);
  const existing = cart.find((entry) => entry.id === id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ id, quantity: 1, price: item.price, name: item.name });
  }
  write("trevs-cart", cart);
  renderCart();
  cartDrawer.classList.add("open");
  cartDrawer.setAttribute("aria-hidden", "false");
}

function changeQuantity(id, delta) {
  const line = cart.find((entry) => entry.id === id);
  if (!line) return;
  line.quantity += delta;
  cart = cart.filter((entry) => entry.quantity > 0);
  write("trevs-cart", cart);
  renderCart();
}

function renderCart() {
  const count = cart.reduce((sum, line) => sum + line.quantity, 0);
  const total = cart.reduce((sum, line) => sum + line.quantity * line.price, 0);
  cartCount.textContent = count;
  cartTotal.textContent = `$${total.toFixed(2)}`;
  cartItems.innerHTML = cart.map((line) => `
    <div class="cart-line">
      <strong>${line.name}</strong>
      <div class="cart-line-controls">
        <span>${line.quantity} × ${money(line.price)}</span>
        <span>
          <button class="quantity-button" type="button" data-qty="${line.id}" data-delta="-1">−</button>
          <button class="quantity-button" type="button" data-qty="${line.id}" data-delta="1">+</button>
        </span>
      </div>
    </div>
  `).join("") || "<p>Your cart is empty.</p>";
}

function checkout(method) {
  if (!cart.length) {
    alert("Please add an item to the cart first.");
    return;
  }
  const order = {
    id: `TRV-${Date.now()}`,
    created: new Date().toLocaleString(),
    method,
    name: document.querySelector("#customer-name").value || "Counter customer",
    phone: document.querySelector("#customer-phone").value || "",
    notes: document.querySelector("#order-notes").value || "",
    items: cart,
    total: cart.reduce((sum, line) => sum + line.quantity * line.price, 0)
  };
  orders.unshift(order);
  write("trevs-orders", orders);
  cart = [];
  write("trevs-cart", cart);
  renderCart();
  renderOrders();
  cartDrawer.classList.remove("open");
  cartDrawer.setAttribute("aria-hidden", "true");
  if (method === "Pay Now") {
    if (settings.squareLink) {
      window.open(settings.squareLink, "_blank", "noopener");
    } else {
      alert("Order saved. Add a Square checkout link in Admin Portal to activate card payments.");
    }
  } else {
    alert("Order saved for Pay at Counter.");
  }
}

function populateAdmin() {
  const select = document.querySelector("#admin-item");
  select.innerHTML = menu.map((item) => `<option value="${item.id}">${labels[item.category]} - ${item.name}</option>`).join("");
  document.querySelector("#square-link").value = settings.squareLink || "";
  loadAdminItem(select.value);
}

function loadAdminItem(id) {
  const item = menu.find((entry) => entry.id === id);
  if (!item) return;
  document.querySelector("#admin-name").value = item.name;
  document.querySelector("#admin-description").value = item.description;
  document.querySelector("#admin-price").value = item.price;
  document.querySelector("#admin-image").value = item.image;
}

function renderOrders() {
  document.querySelector("#orders-list").innerHTML = orders.map((order) => `
    <div class="order-line">
      <strong>${order.id} · ${order.method}</strong>
      <span>${order.created}</span>
      <span>${order.name} ${order.phone ? `· ${order.phone}` : ""}</span>
      <span>${order.items.map((item) => `${item.quantity}× ${item.name}`).join(", ")}</span>
      <strong>$${order.total.toFixed(2)}</strong>
    </div>
  `).join("") || "<p>No orders yet.</p>";
}

document.addEventListener("click", (event) => {
  const add = event.target.closest("[data-add]");
  if (add) addToCart(add.dataset.add);

  const category = event.target.closest("[data-category]");
  if (category) setCategory(category.dataset.category);

  const jump = event.target.closest("[data-category-jump]");
  if (jump) setCategory(jump.dataset.categoryJump);

  const qty = event.target.closest("[data-qty]");
  if (qty) changeQuantity(qty.dataset.qty, Number(qty.dataset.delta));
});

document.querySelector(".mobile-toggle").addEventListener("click", (event) => {
  const nav = document.querySelector("#main-nav");
  nav.classList.toggle("open");
  event.currentTarget.setAttribute("aria-expanded", String(nav.classList.contains("open")));
});

document.querySelector("[data-open-cart]").addEventListener("click", () => {
  cartDrawer.classList.add("open");
  cartDrawer.setAttribute("aria-hidden", "false");
});

document.querySelector("[data-close-cart]").addEventListener("click", () => {
  cartDrawer.classList.remove("open");
  cartDrawer.setAttribute("aria-hidden", "true");
});

document.querySelector("[data-pay-counter]").addEventListener("click", () => checkout("Pay at Counter"));
document.querySelector("[data-pay-now]").addEventListener("click", () => checkout("Pay Now"));
document.querySelector("[data-open-promo]").addEventListener("click", () => document.querySelector("#promo-modal").classList.add("open"));
document.querySelectorAll("[data-close-promo]").forEach((element) => {
  element.addEventListener("click", () => document.querySelector("#promo-modal").classList.remove("open"));
});

searchInput.addEventListener("input", renderMenu);
document.querySelector("#admin-item").addEventListener("change", (event) => loadAdminItem(event.target.value));

document.querySelector("#menu-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const id = document.querySelector("#admin-item").value;
  const item = menu.find((entry) => entry.id === id);
  item.name = document.querySelector("#admin-name").value;
  item.description = document.querySelector("#admin-description").value;
  item.price = Number(document.querySelector("#admin-price").value);
  item.image = document.querySelector("#admin-image").value;
  write("trevs-menu", menu);
  write("trevs-menu-version", MENU_DATA_VERSION);
  populateAdmin();
  renderMenu();
});

document.querySelector("#settings-form").addEventListener("submit", (event) => {
  event.preventDefault();
  settings.squareLink = document.querySelector("#square-link").value;
  write("trevs-settings", settings);
  alert("Payment settings saved.");
});

document.querySelector("[data-reset-menu]").addEventListener("click", () => {
  menu = defaultMenu.map((item) => ({ ...item }));
  write("trevs-menu", menu);
  write("trevs-menu-version", MENU_DATA_VERSION);
  populateAdmin();
  renderMenu();
});

renderMenu();
renderCart();
populateAdmin();
renderOrders();

if (new Date().getDay() === 1) {
  setTimeout(() => document.querySelector("#promo-modal").classList.add("open"), 800);
}
