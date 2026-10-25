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

          if (selectedCategory === "all" || cardCategory === selectedCategory) {
            card.style.display = "flex";
            setTimeout(() => {
              card.style.opacity = "1";
              card.style.transform = "scale(1)";
            }, 50);
          } else {
            card.style.opacity = "0";
            card.style.transform = "scale(0.95)";
            setTimeout(() => {
              card.style.display = "none";
            }, 300);
          }
        });
      });
    });
  }

  // Bind Buy / Purchase buttons on product cards if present
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

document.addEventListener('DOMContentLoaded', () => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const navBtn = document.getElementById('authNavBtn');

  if (isLoggedIn && navBtn) {
    // Replace the "Get Started" button with a profile avatar container linking to profile.html
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
  container.innerHTML = `
    <img src="${userAvatar}" alt="Profile Avatar" class="nav-profile-avatar" title="Account Settings" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 2px solid #0F172A; display: block;">
  `;

  return container;
}

// Global Purchase Saver Function for My Purchases Page
function buyProduct(item) {
  const existingOrders = JSON.parse(localStorage.getItem('userOrders') || '[]');

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

  // Redirect to Profile Page to show the purchased item
  window.location.href = 'profile.html';
}