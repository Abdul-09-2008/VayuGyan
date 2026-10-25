// ==========================================
// CONFIGURATION: Environment-Aware API URL
// ==========================================
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://127.0.0.1:8000'
  : 'https://vayugyan-backend.onrender.com'; // Replace with your actual live Render backend URL

document.addEventListener("DOMContentLoaded", () => {
  // ==========================================
  // 1. LIVE CLOCK & WATCH HANDS ANIMATION
  // ==========================================
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

  // ==========================================
  // 2. GSAP SCROLLTRIGGER ANIMATIONS
  // ==========================================
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

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
      .to("#badgeIot", { scale: 0, opacity: 0, duration: 0.8 }, "<")
      .to("#badgeFirmware", { scale: 0, opacity: 0, duration: 0.8 }, "<")
      .to("#phoneWrapper", { x: -350, scale: 1.15, duration: 1 }, "<")
      .to("#phoneScrollContent", { y: -260, duration: 2 });
  }

  // ==========================================
  // 3. AUTHENTICATION & PROFILE AVATAR
  // ==========================================
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const navBtn = document.getElementById('authNavBtn');

  if (isLoggedIn && navBtn) {
    navBtn.replaceWith(createProfileAvatarElement());
  }
});

// ==========================================
// HELPER: CREATE PROFILE AVATAR ELEMENT
// ==========================================
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