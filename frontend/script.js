window.API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://127.0.0.1:8000'
  : 'https://vayugyan.onrender.com';

document.addEventListener("DOMContentLoaded", () => {

  /* ---------- Live clock (watch hands + phone status bar) ---------- */
  function updateLiveTime() {
    const now = new Date();

    const rawHours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    const hours12 = rawHours % 12;
    const secondDeg = seconds * 6;
    const minuteDeg = (minutes * 6) + (seconds * 0.1);
    const hourDeg = (hours12 * 30) + (minutes * 0.5);

    const hourHand = document.getElementById("hourHand");
    const minuteHand = document.getElementById("minuteHand");
    const secondHand = document.getElementById("secondHand");

    if (hourHand) hourHand.style.transform = `translateX(-50%) rotate(${hourDeg}deg)`;
    if (minuteHand) minuteHand.style.transform = `translateX(-50%) rotate(${minuteDeg}deg)`;
    if (secondHand) secondHand.style.transform = `translateX(-50%) rotate(${secondDeg}deg)`;

    const displayHours = hours12 === 0 ? 12 : hours12;
    const formattedHours = String(displayHours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');
    const ampm = rawHours >= 12 ? 'PM' : 'AM';

    const phoneClock = document.getElementById("phoneClock");

    if (phoneClock) {
      phoneClock.textContent = `${formattedHours}:${formattedMinutes} ${ampm}`;
    }
  }

  updateLiveTime();
  setInterval(updateLiveTime, 1000);

  /* ---------- Hero scroll animation (desktop only) ---------- */
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    const mm = gsap.matchMedia();

    // Same pinned timeline as before, now created only on wide screens.
    // gsap.matchMedia() reverts all inline styles automatically when the
    // query stops matching (resize / rotate), so mobile CSS takes over cleanly.
    mm.add("(min-width: 901px)", () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: "#pinSection",
          start: "top top+=70",
          end: "+=2000",
          pin: true,
          scrub: 1,
          anticipatePin: 1
        }
      });

      tl.to("#leftPanel", { x: -400, opacity: 0, duration: 1 })
        .to("#watchContainer", { x: -300, y: 100, opacity: 0, duration: 1 }, "<")
        .to("#badgeIot", { scale: 0, opacity: 0, duration: 0.8 }, "<");

      // Kept from the original; only runs if the element exists (avoids GSAP warning)
      if (document.getElementById("badgeFirmware")) {
        tl.to("#badgeFirmware", { scale: 0, opacity: 0, duration: 0.8 }, "<");
      }

      tl.to("#phoneWrapper", { x: -350, scale: 1.15, duration: 1 }, "<")
        .to("#phoneScrollContent", { y: -260, duration: 2 });
    });
  }

  /* ---------- Mobile nav toggle ---------- */
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.querySelector('.nav-menu');
  const navbar = document.querySelector('.navbar');

  function setMenu(open) {
    if (!navToggle || !navMenu) return;
    navMenu.classList.toggle('is-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      setMenu(!navMenu.classList.contains('is-open'));
    });
    navMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('click', (e) => {
      if (navbar && !navbar.contains(e.target)) setMenu(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setMenu(false);
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 900) setMenu(false);
    });
  }

  /* ---------- Auth nav button -> profile avatar ---------- */
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

  // Built with DOM APIs instead of innerHTML so a stored URL can't inject markup
  const img = document.createElement('img');
  img.src = userAvatar;
  img.alt = 'Profile Avatar';
  img.className = 'nav-profile-avatar';
  img.title = 'Account Settings';
  img.style.cssText = 'width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 2px solid #0F172A; display: block;';

  container.appendChild(img);
  return container;
}