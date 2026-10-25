// Local YouTube/WhatsApp style canvas generator
function generateLetterAvatar(name) {
  const firstLetter = name ? name.charAt(0).toUpperCase() : 'U';
  
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.arc(64, 64, 64, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 64px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(firstLetter, 64, 64);

  return canvas.toDataURL('image/png');
}

function renderNavbarProfile() {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const navBtn = document.getElementById('authNavBtn') || document.querySelector('.nav-btn');
  const existingWrapper = document.querySelector('.nav-profile-wrapper');

  if (isLoggedIn) {
    const userName = localStorage.getItem('userName') || 'User Console';
    const userEmail = localStorage.getItem('userEmail') || 'user@vayugyan.com';
    
    // Resolve avatar URL priority
    const letterAvatar = generateLetterAvatar(userName);
    const avatarUrl = localStorage.getItem('globalUserAvatar') || letterAvatar;
    
    // If navbar profile is already mounted, update images and labels dynamically
    if (existingWrapper) {
      const avatarImgs = existingWrapper.querySelectorAll('img');
      avatarImgs.forEach(img => img.src = avatarUrl);
      
      const nameEl = existingWrapper.querySelector('.card-user-name');
      const emailEl = existingWrapper.querySelector('.card-user-email');
      if (nameEl) nameEl.textContent = userName;
      if (emailEl) emailEl.textContent = userEmail;
      return;
    }

    // Build profile card DOM if not yet created
    if (navBtn) {
      const profileWrapper = document.createElement('div');
      profileWrapper.className = 'nav-profile-wrapper';
      
      profileWrapper.innerHTML = `
        <img src="${avatarUrl}" alt="${userName}" class="nav-profile-avatar" id="profileAvatarBtn">
        
        <div class="profile-card-dropdown" id="profileDropdown">
          <div class="profile-card-header">
            <div class="profile-banner"></div>
            <div class="profile-avatar-container">
              <img src="${avatarUrl}" alt="${userName}" class="profile-card-avatar">
              <span class="status-indicator"></span>
            </div>
            <div class="profile-card-info">
              <h4 class="card-user-name">${userName}</h4>
              <span class="card-user-email">${userEmail}</span>
            </div>
          </div>




          

          <div class="profile-card-menu">
            <a href="profile.html" class="profile-menu-item">
              <span class="menu-icon">⚙️</span>
              <div class="menu-text">
                <strong>Account Settings</strong>
                <small>Edit profile & photo</small>
              </div>
            </a>

            <a href="purchases.html" class="profile-menu-item">
              <span class="menu-icon">📡</span>
              <div class="menu-text">
                <strong>My Purchases</strong>
                <small>Products and Services</small>
              </div>
            </a>

            <a href="contact.html" class="profile-menu-item">
              <span class="menu-icon">🔑</span>
              <div class="menu-text">
                <strong>Get Support</strong>
                <small>Contact Us</small>
              </div>
            </a>
          </div>

          <div class="profile-card-footer">
            <button type="button" class="sign-out-btn-card" id="signOutBtn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      `;

      navBtn.replaceWith(profileWrapper);

      const avatarBtn = profileWrapper.querySelector('#profileAvatarBtn');
      const dropdown = profileWrapper.querySelector('#profileDropdown');
      const signOutBtn = profileWrapper.querySelector('#signOutBtn');

      avatarBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
      });

      document.addEventListener('click', (e) => {
        if (!profileWrapper.contains(e.target)) {
          dropdown.classList.remove('show');
        }
      });

      // Custom Confirmation Modal Trigger on Sign Out Click
      signOutBtn.addEventListener('click', () => {
        let modal = document.getElementById('signOutModal');
        if (!modal) {
          modal = document.createElement('div');
          modal.id = 'signOutModal';
          modal.className = 'custom-modal-overlay';
          modal.innerHTML = `
            <div class="custom-modal-card">
              <h3>Sign Out Confirmation</h3>
              <p>Are you sure you want to sign out of your VayuGyan session?</p>
              <div class="custom-modal-actions">
                <button type="button" class="btn-modal-cancel" id="cancelSignOut">Cancel</button>
                <button type="button" class="btn-modal-confirm" id="confirmSignOut">Sign Out</button>
              </div>
            </div>
          `;
          document.body.appendChild(modal);

          document.getElementById('cancelSignOut').addEventListener('click', () => {
            modal.classList.remove('show');
          });

          document.getElementById('confirmSignOut').addEventListener('click', () => {
            localStorage.clear();
            window.location.href = 'login.html';
          });
        }

        modal.classList.add('show');
        dropdown.classList.remove('show');
      });
    }
  }
}

document.addEventListener('DOMContentLoaded', renderNavbarProfile);

// Listen for profile changes across tabs or pages
window.addEventListener('storage', renderNavbarProfile);