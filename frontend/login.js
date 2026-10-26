const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://127.0.0.1:8000'
  : 'https://vayugyan.onrender.com';
 
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Failed to parse JWT:", e);
    return null;
  }
}

window.handleCredentialResponse = function(response) {
  const responsePayload = parseJwt(response.credential);

  if (responsePayload) {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userAvatar', responsePayload.picture); 
    localStorage.setItem('globalUserAvatar', responsePayload.picture); 
    localStorage.setItem('userName', responsePayload.name);
    localStorage.setItem('userEmail', responsePayload.email);

    const redirectUrl = localStorage.getItem('redirectAfterLogin') || 'index.html';
    localStorage.removeItem('redirectAfterLogin');

    window.location.href = redirectUrl;
  }
};

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

document.addEventListener('DOMContentLoaded', () => {
  const referrer = document.referrer;
  if (referrer && referrer.includes(window.location.hostname) && !referrer.includes('login.html')) {
    localStorage.setItem('redirectAfterLogin', referrer);
  }

  const tabSignIn = document.getElementById('tabSignIn');
  const tabRegister = document.getElementById('tabRegister');
  const signInForm = document.getElementById('signInForm');
  const registerForm = document.getElementById('registerForm');

  const signInAuthNotice = document.getElementById('inlineAuthNotice');
  const signInNoticeText = document.getElementById('inlineNoticeText');

  const registerAuthNotice = document.getElementById('registerAuthNotice');
  const registerNoticeText = document.getElementById('registerNoticeText');
  const regSubmitBtn = document.getElementById('regSubmitBtn');
  const regEmailInput = document.getElementById('regEmail');

  let isEmailAlreadyRegisteredMode = false;

  function setButtonLoading(button, isLoading, loadingText = "Processing...", originalText = "Sign in with Email") {
    if (!button) return;
    if (isLoading) {
      button.disabled = true;
      button.classList.add('loading');
      button.dataset.originalText = originalText || button.textContent;
      button.innerHTML = `<span class="btn-spinner"></span> <span>${loadingText}</span>`;
    } else {
      button.disabled = false;
      button.classList.remove('loading');
      button.textContent = button.dataset.originalText || originalText;
    }
  }

  function showNotice(noticeBox, noticeTextEl, message, type = 'error') {
    if (!noticeBox || !noticeTextEl) return;
    
    noticeBox.style.display = 'block';
    noticeTextEl.className = '';

    if (type === 'error') {
      noticeTextEl.style.color = "#ef4444";
      noticeTextEl.textContent = message;
    } else if (type === 'success') {
      noticeTextEl.style.color = "#10b981";
      noticeTextEl.textContent = message;
    } else if (type === 'loading') {
      noticeTextEl.classList.add('notice-loading');
      noticeTextEl.innerHTML = `<span class="notice-loading-dot"></span> <span>${message}</span>`;
    }
  }

  function clearNotices() {
    if (signInAuthNotice) signInAuthNotice.style.display = 'none';
    if (registerAuthNotice) registerAuthNotice.style.display = 'none';
  }

  if (regEmailInput) {
    regEmailInput.addEventListener('input', () => {
      if (isEmailAlreadyRegisteredMode) {
        isEmailAlreadyRegisteredMode = false;
        if (regSubmitBtn) regSubmitBtn.textContent = "Create Account";
        if (registerAuthNotice) registerAuthNotice.style.display = 'none';
      }
    });
  }

  if (tabSignIn && tabRegister && signInForm && registerForm) {
    tabSignIn.addEventListener('click', () => {
      tabSignIn.classList.add('active');
      tabRegister.classList.remove('active');
      signInForm.style.display = 'block';
      registerForm.style.display = 'none';
      clearNotices();
    });

    tabRegister.addEventListener('click', () => {
      tabRegister.classList.add('active');
      tabSignIn.classList.remove('active');
      registerForm.style.display = 'block';
      signInForm.style.display = 'none';
      clearNotices();
    });
  }

  document.querySelectorAll('.toggle-password-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetId = e.target.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (input) {
        input.type = input.type === 'password' ? 'text' : 'password';
        e.target.textContent = input.type === 'password' ? 'Show' : 'Hide';
      }
    });
  });

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (isEmailAlreadyRegisteredMode) {
        const emailVal = regEmailInput ? regEmailInput.value.trim() : '';
        const loginEmailField = document.getElementById('loginEmail');
        if (loginEmailField) loginEmailField.value = emailVal;
        if (tabSignIn) tabSignIn.click();
        return;
      }

      clearNotices();

      const nameInput = document.getElementById('regName').value.trim();
      const emailInput = regEmailInput ? regEmailInput.value.trim() : '';
      const passwordInput = document.getElementById('regPassword').value.trim();

      if (passwordInput.length < 8) {
        showNotice(registerAuthNotice, registerNoticeText, "Password must be at least 8 characters long.", 'error');
        return;
      }

      setButtonLoading(regSubmitBtn, true, "Creating Account...");
      showNotice(registerAuthNotice, registerNoticeText, "Creating your VayuGyan account...", 'loading');

      try {
        const response = await fetch(`${API_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: nameInput,
            email: emailInput,
            password: passwordInput
          })
        });

        const data = await response.json();

        if (!response.ok) {
          setButtonLoading(regSubmitBtn, false, "", "Create Account");
          showNotice(registerAuthNotice, registerNoticeText, data.detail || "Registration failed.", 'error');

          if (data.detail && data.detail.toLowerCase().includes("email already registered")) {
            isEmailAlreadyRegisteredMode = true;
            if (regSubmitBtn) regSubmitBtn.textContent = "Sign In";
          }
          return;
        }

        clearNotices();
        isEmailAlreadyRegisteredMode = false;
        setButtonLoading(regSubmitBtn, false, "", "Create Account");

        const loginEmailField = document.getElementById('loginEmail');
        if (loginEmailField) loginEmailField.value = emailInput;
        if (tabSignIn) tabSignIn.click();
        registerForm.reset();

      } catch (err) {
        console.error("Network error during registration:", err);
        setButtonLoading(regSubmitBtn, false, "", "Create Account");
        showNotice(registerAuthNotice, registerNoticeText, "Could not connect to the server :(", 'error');
      }
    });
  }

  const forgotPasswordLink = document.getElementById('forgotPasswordLink');
  const otpResetContainer = document.getElementById('otpResetContainer');
  const passwordGroup = document.getElementById('passwordGroup');
  const signInSubmitBtn = document.getElementById('signInSubmitBtn');
  const otpCodeInput = document.getElementById('otpCode');
  const newPasswordInput = document.getElementById('newPassword');
  
  const resendOtpBtn = document.getElementById('resendOtpBtn');
  const countdownEl = document.getElementById('countdown');
  const timerText = document.getElementById('timerText');
  let countdownInterval = null;

  let isOtpMode = false;

  function startOtpTimer() {
    let timeLeft = 60;
    if (resendOtpBtn) resendOtpBtn.style.display = 'none';
    if (timerText) timerText.style.display = 'block';
    if (countdownEl) countdownEl.textContent = timeLeft;

    if (countdownInterval) clearInterval(countdownInterval);

    countdownInterval = setInterval(() => {
      timeLeft--;
      if (countdownEl) countdownEl.textContent = timeLeft;

      if (timeLeft <= 0) {
        clearInterval(countdownInterval);
        if (timerText) timerText.style.display = 'none';
        if (resendOtpBtn) resendOtpBtn.style.display = 'inline-block';
      }
    }, 1000);
  }

  if (resendOtpBtn) {
    resendOtpBtn.addEventListener('click', async () => {
      clearNotices();
      const emailInput = document.getElementById('loginEmail').value.trim();

      showNotice(signInAuthNotice, signInNoticeText, "Sending new OTP to your email...", 'loading');

      try {
        const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailInput })
        });

        const data = await response.json();

        if (!response.ok) {
          showNotice(signInAuthNotice, signInNoticeText, data.detail || "Failed to resend OTP.", 'error');
          return;
        }

        showNotice(signInAuthNotice, signInNoticeText, "A new OTP has been sent to your email!", 'success');
        startOtpTimer();
      } catch (err) {
        console.error("Resend OTP error:", err);
        showNotice(signInAuthNotice, signInNoticeText, "Server connection error.", 'error');
      }
    });
  }

  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', async (e) => {
      e.preventDefault();
      clearNotices();

      const emailInput = document.getElementById('loginEmail').value.trim();
      if (!emailInput) {
        showNotice(signInAuthNotice, signInNoticeText, "Please enter your email address above first.", 'error');
        return;
      }

      if (!isOtpMode) {
        setButtonLoading(signInSubmitBtn, true, "Sending OTP...");
        showNotice(signInAuthNotice, signInNoticeText, "Connecting to mail server & dispatching OTP...", 'loading');

        try {
          const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailInput })
          });

          const data = await response.json();

          if (!response.ok) {
            setButtonLoading(signInSubmitBtn, false, "", "Sign In with Email");
            showNotice(signInAuthNotice, signInNoticeText, data.detail || "Could not send OTP.", 'error');
            return;
          }

          isOtpMode = true;
          passwordGroup.style.display = 'none';
          otpResetContainer.style.display = 'block';
          forgotPasswordLink.textContent = "Cancel";
          
          setButtonLoading(signInSubmitBtn, false, "", "Verify OTP & Reset Password");
          showNotice(signInAuthNotice, signInNoticeText, data.message, 'success');

          startOtpTimer();
        } catch (err) {
          console.error("OTP request error:", err);
          setButtonLoading(signInSubmitBtn, false, "", "Sign In with Email");
          showNotice(signInAuthNotice, signInNoticeText, "Server connection error.", 'error');
        }
      } else {
        isOtpMode = false;
        passwordGroup.style.display = 'block';
        otpResetContainer.style.display = 'none';
        forgotPasswordLink.textContent = "Forgot?";
        setButtonLoading(signInSubmitBtn, false, "", "Sign In with Email");
        if (countdownInterval) clearInterval(countdownInterval);
        clearNotices();
      }
    });
  }

  if (signInForm) {
    signInForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearNotices();

      const emailInput = document.getElementById('loginEmail').value.trim();

      if (isOtpMode) {
        const otpVal = otpCodeInput ? otpCodeInput.value.trim() : '';
        const newPassVal = newPasswordInput ? newPasswordInput.value.trim() : '';

        if (otpVal.length !== 6 || newPassVal.length < 8) {
          showNotice(signInAuthNotice, signInNoticeText, "Enter a valid 6-digit OTP and an 8+ character password.", 'error');
          return;
        }

        setButtonLoading(signInSubmitBtn, true, "Verifying OTP...");
        showNotice(signInAuthNotice, signInNoticeText, "Verifying OTP & updating password...", 'loading');

        try {
          const response = await fetch(`${API_URL}/api/auth/reset-password-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: emailInput,
              otp: otpVal,
              new_password: newPassVal
            })
          });

          const data = await response.json();

          if (!response.ok) {
            setButtonLoading(signInSubmitBtn, false, "", "Verify OTP & Reset Password");
            showNotice(signInAuthNotice, signInNoticeText, data.detail || "Password reset failed.", 'error');
            return;
          }

          setButtonLoading(signInSubmitBtn, false, "", "Verify OTP & Reset Password");
          showNotice(signInAuthNotice, signInNoticeText, data.message, 'success');

          setTimeout(() => {
            isOtpMode = false;
            passwordGroup.style.display = 'block';
            otpResetContainer.style.display = 'none';
            forgotPasswordLink.textContent = "Forgot?";
            setButtonLoading(signInSubmitBtn, false, "", "Sign In with Email");
            if (document.getElementById('loginPassword')) {
              document.getElementById('loginPassword').value = '';
            }
            if (countdownInterval) clearInterval(countdownInterval);
            clearNotices();
          }, 2500);

        } catch (err) {
          console.error("Password reset error:", err);
          setButtonLoading(signInSubmitBtn, false, "", "Verify OTP & Reset Password");
          showNotice(signInAuthNotice, signInNoticeText, "Server connection error.", 'error');
        }
        return;
      }

      const passwordInput = document.getElementById('loginPassword').value.trim();

      setButtonLoading(signInSubmitBtn, true, "Authenticating...");
      showNotice(signInAuthNotice, signInNoticeText, "Verifying credentials...", 'loading');

      try {
        const response = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: emailInput,
            password: passwordInput
          })
        });

        const data = await response.json();

        if (!response.ok) {
          setButtonLoading(signInSubmitBtn, false, "", "Sign In with Email");
          showNotice(signInAuthNotice, signInNoticeText, data.detail || "Invalid email or password.", 'error');
          return;
        }

        clearNotices();
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userName', data.user.name);
        localStorage.setItem('userEmail', data.user.email);

        const defaultAvatar = generateLetterAvatar(data.user.name);
        localStorage.setItem('globalUserAvatar', defaultAvatar);
        localStorage.setItem('userAvatar', defaultAvatar);

        const redirectUrl = localStorage.getItem('redirectAfterLogin') || 'index.html';
        localStorage.removeItem('redirectAfterLogin');

        window.location.href = redirectUrl;

      } catch (err) {
        console.error("Network error during login:", err);
        setButtonLoading(signInSubmitBtn, false, "", "Sign In with Email");
        showNotice(signInAuthNotice, signInNoticeText, "Server connection error.", 'error');
      }
    });
  }
});