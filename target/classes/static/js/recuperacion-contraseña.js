document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('forgotPasswordForm');
  const message = document.getElementById('forgotPasswordMessage');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const submitUrl = form.action;

    try {
      const res = await fetch(submitUrl, {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' },
      });

      if (res.ok) {
        message.classList.remove('d-none');
        form.reset();
        setTimeout(() => {
          const modalEl = document.getElementById('forgotPasswordModal');
          const modal = bootstrap.Modal.getInstance(modalEl);
          if (modal) modal.hide();
          message.classList.add('d-none');
        }, 3000);
      } else {
        alert('Hubo un error al enviar la solicitud. Intenta nuevamente.');
      }
    } catch (err) {
      console.error(err);
      alert('Error de red. Intenta nuevamente.');
    }
  });
});
