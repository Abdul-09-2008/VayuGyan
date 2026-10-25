document.addEventListener('DOMContentLoaded', () => {
  const savedName = localStorage.getItem('userName') || 'Abdul Muktadir Choudhury';
  const savedEmail = localStorage.getItem('userEmail') || 'abdulmuktadirchoudhury.345@gmail.com';
  let savedAvatar = localStorage.getItem('userAvatar');

  const nameInput = document.getElementById('fullName');
  const emailInput = document.getElementById('emailAddress');
  const profileAvatarImg = document.getElementById('profileAvatarImg');
  const defaultLetterAvatar = document.getElementById('defaultLetterAvatar');
  const editCropBtn = document.getElementById('editCropBtn');
  const defaultAvatarBtn = document.getElementById('defaultAvatarBtn');

  if (nameInput) nameInput.value = savedName;
  if (emailInput) emailInput.value = savedEmail;

  function updateAvatarUI() {
    savedAvatar = localStorage.getItem('userAvatar');
    if (savedAvatar) {
      if (profileAvatarImg) {
        profileAvatarImg.src = savedAvatar;
        profileAvatarImg.style.display = 'block';
      }
      if (defaultLetterAvatar) defaultLetterAvatar.style.display = 'none';
      if (editCropBtn) editCropBtn.style.display = 'inline-block';
      if (defaultAvatarBtn) defaultAvatarBtn.style.display = 'inline-block';
    } else {
      if (profileAvatarImg) profileAvatarImg.style.display = 'none';
      if (defaultLetterAvatar) {
        defaultLetterAvatar.textContent = savedName.charAt(0).toUpperCase();
        defaultLetterAvatar.style.display = 'flex';
      }
      if (editCropBtn) editCropBtn.style.display = 'none';
      if (defaultAvatarBtn) defaultAvatarBtn.style.display = 'none';
    }
  }

  updateAvatarUI();

  const avatarUploadInput = document.getElementById('avatarUploadInput');
  const cropModal = document.getElementById('cropModal');
  const cropCanvas = document.getElementById('cropCanvas');
  const zoomRange = document.getElementById('zoomRange');
  const cancelCropBtn = document.getElementById('cancelCropBtn');
  const confirmCropBtn = document.getElementById('confirmCropBtn');

  let uploadedImage = new Image();
  let imageX = 0, imageY = 0;
  let isDragging = false;
  let startX = 0, startY = 0;
  let scale = 1;
  const canvasSize = 240;

  if (cropCanvas) {
    cropCanvas.width = canvasSize;
    cropCanvas.height = canvasSize;
  }
  const ctx = cropCanvas ? cropCanvas.getContext('2d') : null;

  function openCropperWithImage(imageSource) {
    uploadedImage = new Image();
    uploadedImage.src = imageSource;
    uploadedImage.onload = function() {
      scale = 1;
      if (zoomRange) zoomRange.value = 1;
      imageX = (canvasSize - uploadedImage.width * scale) / 2;
      imageY = (canvasSize - uploadedImage.height * scale) / 2;
      
      drawCropper();
      if (cropModal) cropModal.style.display = 'flex';
    };
  }

  if (avatarUploadInput) {
    avatarUploadInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(uploadEvent) {
          const rawOriginalImage = uploadEvent.target.result;
          localStorage.setItem('originalUserAvatar', rawOriginalImage);
          openCropperWithImage(rawOriginalImage);
        };
        reader.readAsDataURL(file);
      }
      avatarUploadInput.value = '';
    });
  }

  if (editCropBtn) {
    editCropBtn.addEventListener('click', () => {
      const originalAvatar = localStorage.getItem('originalUserAvatar') || localStorage.getItem('userAvatar');
      if (originalAvatar) {
        openCropperWithImage(originalAvatar);
      }
    });
  }

  function drawCropper() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasSize, canvasSize);
    ctx.drawImage(uploadedImage, imageX, imageY, uploadedImage.width * scale, uploadedImage.height * scale);
  }

  if (cropCanvas) {
    cropCanvas.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX - imageX;
      startY = e.clientY - imageY;
    });
  }

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    imageX = e.clientX - startX;
    imageY = e.clientY - startY;
    drawCropper();
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
  });

  if (zoomRange) {
    zoomRange.addEventListener('input', (e) => {
      const newScale = parseFloat(e.target.value);
      const centerX = canvasSize / 2;
      const centerY = canvasSize / 2;
      
      imageX = centerX - (centerX - imageX) * (newScale / scale);
      imageY = centerY - (centerY - imageY) * (newScale / scale);
      scale = newScale;
      
      drawCropper();
    });
  }

  if (confirmCropBtn) {
    confirmCropBtn.addEventListener('click', () => {
      if (!cropCanvas) return;
      const croppedDataUrl = cropCanvas.toDataURL('image/png');
      
      localStorage.setItem('userAvatar', croppedDataUrl);
      localStorage.setItem('globalUserAvatar', croppedDataUrl);

      updateAvatarUI();
      if (cropModal) cropModal.style.display = 'none';
    });
  }

  if (cancelCropBtn) {
    cancelCropBtn.addEventListener('click', () => {
      if (cropModal) cropModal.style.display = 'none';
    });
  }

  if (defaultAvatarBtn) {
    defaultAvatarBtn.addEventListener('click', () => {
      localStorage.removeItem('userAvatar');
      localStorage.removeItem('globalUserAvatar');
      localStorage.removeItem('originalUserAvatar');
      updateAvatarUI();
    });
  }

  const signOutBtn = document.getElementById('signOutBtn');
  const signOutModal = document.getElementById('signOutModal');
  const cancelSignOutBtn = document.getElementById('cancelSignOutBtn');
  const confirmSignOutBtn = document.getElementById('confirmSignOutBtn');

  if (signOutBtn && signOutModal) {
    signOutBtn.addEventListener('click', () => {
      signOutModal.style.display = 'flex';
    });
  }

  if (cancelSignOutBtn && signOutModal) {
    cancelSignOutBtn.addEventListener('click', () => {
      signOutModal.style.display = 'none';
    });
  }

  if (confirmSignOutBtn) {
    confirmSignOutBtn.addEventListener('click', () => {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userName');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userAvatar');
      localStorage.removeItem('originalUserAvatar');
      window.location.href = 'login.html';
    });
  }

  const statusBanner = document.getElementById('profileStatusBanner');
  function showBanner(message, type = 'success') {
    if (!statusBanner) return;
    statusBanner.style.display = 'block';
    if (type === 'success') {
      statusBanner.style.backgroundColor = '#dcfce7';
      statusBanner.style.color = '#166534';
      statusBanner.style.border = '1px solid #bbf7d0';
    } else {
      statusBanner.style.backgroundColor = '#fee2e2';
      statusBanner.style.color = '#991b1b';
      statusBanner.style.border = '1px solid #fecaca';
    }
    statusBanner.textContent = message;
  }

  const profileForm = document.getElementById('profileForm');
  if (profileForm) {
    profileForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const updatedName = nameInput ? nameInput.value.trim() : '';
      if (updatedName) {
        localStorage.setItem('userName', updatedName);
      }
      showBanner('Profile changes saved successfully!', 'success');
    });
  }
});