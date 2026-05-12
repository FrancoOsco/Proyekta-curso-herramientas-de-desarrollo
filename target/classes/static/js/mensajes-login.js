document.addEventListener('DOMContentLoaded', function () {
  function safeGetDelay(el) {
    if (!el) return 3000;
    const attr = el.getAttribute('data-bs-delay') || el.dataset.delay;
    const n = parseInt(attr, 10);
    return isNaN(n) ? 3000 : n;
  }

  function showToastById(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const delay = safeGetDelay(el);
    if (typeof bootstrap === 'undefined' || !bootstrap.Toast) {
      el.style.display = 'inline-block';
      setTimeout(() => {
        try {
          el.remove();
        } catch (e) {}
      }, delay);
      return;
    }

    window.requestAnimationFrame(() => {
      const toast = new bootstrap.Toast(el, { autohide: true, delay: delay });
      toast.show();

      el.addEventListener(
        'hidden.bs.toast',
        () => {
          try {
            el.remove();
          } catch (e) {}
        },
        { once: true },
      );
    });
  }

  showToastById('logoutToast');
  showToastById('errorToast');
});
