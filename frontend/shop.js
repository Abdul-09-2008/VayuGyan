document.addEventListener("DOMContentLoaded", () => {
  const filterButtons = document.querySelectorAll(".tab-btn");
  const productCards = document.querySelectorAll(".product-card");

  if (filterButtons.length > 0 && productCards.length > 0) {
    filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        filterButtons.forEach((btn) => btn.classList.remove("active"));
        button.classList.add("active");

        const selectedCategory = button.getAttribute("data-category");

        productCards.forEach((card) => {
          const cardCategory = card.getAttribute("data-category");

          // Cancel any pending show/hide from a previous click so fast
          // filter switching can't hide a card that should be visible
          clearTimeout(card._filterTimer);

          if (selectedCategory === "all" || cardCategory === selectedCategory) {
            card.style.display = "flex";
            card._filterTimer = setTimeout(() => {
              card.style.opacity = "1";
              card.style.transform = "scale(1)";
            }, 50);
          } else {
            card.style.opacity = "0";
            card.style.transform = "scale(0.95)";
            card._filterTimer = setTimeout(() => {
              card.style.display = "none";
            }, 300);
          }
        });
      });
    });
  }

  const buyBtns = document.querySelectorAll('.buy-btn, .product-buy-btn');
  buyBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const card = e.target.closest('.product-card');
      if (!card) return;

      const titleEl = card.querySelector('.product-title, h3');
      const priceEl = card.querySelector('.product-price, .price');
      const imgEl = card.querySelector('img');

      const name = titleEl ? titleEl.textContent.trim() : 'VayuGyan Product';
      const price = priceEl ? priceEl.textContent.replace(/[^0-9.]/g, '') : '0';
      const image = imgEl ? imgEl.src : '';

      buyProduct({ name, price, image });
    });
  });
});

/* ---------- Mobile nav toggle ---------- */
document.addEventListener('DOMContentLoaded', () => {
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.querySelector('.nav-menu');
  const navbar = document.querySelector('.navbar');
  if (!navToggle || !navMenu) return;

  function setMenu(open) {
    navMenu.classList.toggle('is-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  navToggle.addEventListener('click', () => setMenu(!navMenu.classList.contains('is-open')));
  navMenu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('click', (e) => {
    if (navbar && !navbar.contains(e.target)) setMenu(false);
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  window.addEventListener('resize', () => { if (window.innerWidth > 900) setMenu(false); });
});

/* ---------- Auth nav button -> profile avatar ---------- */
document.addEventListener('DOMContentLoaded', () => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const navBtn = document.getElementById('authNavBtn');

  if (isLoggedIn && navBtn) {
    navBtn.replaceWith(createProfileAvatarElement());
  }
});

function createProfileAvatarElement() {
  const userAvatar = localStorage.getItem('userAvatar') || localStorage.getItem('globalUserAvatar') || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80";

  const container = document.createElement('a');
  container.href = 'profile.html';
  container.className = 'nav-profile-container';
  container.style.display = 'inline-block';
  container.style.textDecoration = 'none';

  // DOM APIs instead of innerHTML so a stored URL can't inject markup
  const img = document.createElement('img');
  img.src = userAvatar;
  img.alt = 'Profile Avatar';
  img.className = 'nav-profile-avatar';
  img.title = 'Account Settings';
  img.style.cssText = 'width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 2px solid #0F172A; display: block;';

  container.appendChild(img);
  return container;
}

function buyProduct(item) {
  // Corrupt or missing saved orders no longer crash the purchase
  let existingOrders = [];
  try {
    const saved = JSON.parse(localStorage.getItem('userOrders') || '[]');
    if (Array.isArray(saved)) existingOrders = saved;
  } catch (err) {
    existingOrders = [];
  }

  const newOrder = {
    orderId: 'VG-' + Math.floor(100000 + Math.random() * 900000),
    date: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }),
    items: [
      {
        name: item.name || 'VayuGyan Hardware Unit',
        price: item.price || '0',
        image: item.image || '',
        quantity: 1
      }
    ],
    status: 'Confirmed'
  };

  existingOrders.unshift(newOrder);
  localStorage.setItem('userOrders', JSON.stringify(existingOrders));

  window.location.href = 'profile.html';
}