document.addEventListener('DOMContentLoaded', () => {
  function getEl(id) {
    return document.getElementById(id);
  }

  function showToastById(id, message) {
    const toastEl = getEl(id);
    if (!toastEl) return;
    const body = toastEl.querySelector('.toast-body') || toastEl.querySelector('[id$="Body"]');
    if (body && message != null) body.textContent = message;

    if (typeof bootstrap === 'undefined' || !bootstrap.Toast) {
      toastEl.style.display = 'inline-block';
      setTimeout(() => {
        try {
          toastEl.style.display = 'none';
        } catch (e) {}
      }, parseInt(toastEl.getAttribute('data-bs-delay') || '3000', 10));
      return;
    }

    try {
      const delay = parseInt(toastEl.getAttribute('data-bs-delay') || '3000', 10);
      const toast = new bootstrap.Toast(toastEl, { autohide: true, delay });
      toast.show();

      toastEl.addEventListener(
        'hidden.bs.toast',
        () => {
        },
        { once: true },
      );
    } catch (e) {
      toastEl.style.display = 'inline-block';
      setTimeout(() => {
        toastEl.style.display = 'none';
      }, 3000);
    }
  }

  window.showSuccessToast = (projectCode) => {
    const msg = projectCode
      ? `✅ Proyecto guardado — Código: ${projectCode}`
      : `✅ Proyecto guardado correctamente.`;
    showToastById('projectSuccessToast', msg);
    try {
      const gen = document.getElementById('projectGeneratedId');
      if (gen) gen.value = projectCode || gen.value;
      if (projectCode) localStorage.setItem('proyekta:lastSavedProjectCode', projectCode);
    } catch (e) {}
  };

  window.showErrorToast = (message) => {
    const msg = message || '❌ Ocurrió un error. Revisa la consola.';
    showToastById('projectErrorToast', msg);
  };

  const maybeShowServerLogout = document.getElementById('logoutToast');
  if (maybeShowServerLogout) {
    try {
      const t = new bootstrap.Toast(maybeShowServerLogout);
      t.show();
    } catch (e) {}
  }
});
