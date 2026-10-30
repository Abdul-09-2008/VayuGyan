document.addEventListener('DOMContentLoaded', () => {
  // Kept inside the handler so it can't clash with another API_URL declared in app.js
  const API_URL = window.API_URL || (
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://127.0.0.1:8000'
      : 'https://vayugyan.onrender.com'
  );

  const contactForm = document.querySelector('form');
  if (!contactForm) return;

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nameInput = contactForm.querySelector('input[type="text"]');
    const emailInput = contactForm.querySelector('input[type="email"]');
    const typeSelect = contactForm.querySelector('select');
    const messageInput = contactForm.querySelector('textarea');
    const submitBtn = contactForm.querySelector('button[type="submit"]');

    // Missing field = HTML changed; fail quietly instead of throwing
    if (!nameInput || !emailInput || !typeSelect || !messageInput || !submitBtn) {
      console.error('Contact form is missing an expected field.');
      return;
    }

    // Respect the browser's required / email-format checks
    if (!contactForm.checkValidity()) {
      contactForm.reportValidity();
      return;
    }

    const full_name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const inquiryType = typeSelect.value;
    const message = messageInput.value.trim();

    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending Message...";

    // The Render free tier can take ~30-60s to wake up; don't hang forever
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch(`${API_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name, email, inquiry_type: inquiryType, message }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error("Failed to send message.");
      }

      alert("Message sent successfully! We will get back to you within 24 hours.");
      contactForm.reset();
    } catch (err) {
      console.error("Contact form error:", err);
      if (err.name === 'AbortError') {
        alert("The server is taking too long to respond. Please try again in a minute.");
      } else {
        alert("Could not send message. Please try again later.");
      }
    } finally {
      clearTimeout(timeoutId);
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
});