const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://127.0.0.1:8000'
  : 'https://vayugyan.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
  const contactForm = document.querySelector('form'); // Or give your form an ID like id="contactForm"

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const fullName = contactForm.querySelector('input[type="text"]').value.trim();
      const email = contactForm.querySelector('input[type="email"]').value.trim();
      const inquiryType = contactForm.querySelector('select').value;
      const message = contactForm.querySelector('textarea').value.trim();

      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending Message...";

      try {
        const response = await fetch(`${API_URL}/api/contact`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fullName, email, inquiry_type: inquiryType, message })
        });

        if (!response.ok) {
          throw new Error("Failed to send message.");
        }

        alert("Message sent successfully! We will get back to you within 24 hours.");
        contactForm.reset();
      } catch (err) {
        console.error("Contact form error:", err);
        alert("Could not send message. Please try again later.");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }
});