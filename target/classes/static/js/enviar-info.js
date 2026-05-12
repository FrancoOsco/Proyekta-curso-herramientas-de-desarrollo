(function () {
  const btn = document.getElementById('btnNewProject');
  if (!btn) return;

  btn.addEventListener('click', (e) => {
    e.preventDefault();

    let project = window.selectedProject || null;
    if (!project) {
      try {
        const raw = sessionStorage.getItem('proyekta_selected_project');
        if (raw) project = JSON.parse(raw);
      } catch (err) {
        project = null;
      }
    }

    if (!project || (!project.id && !project.code)) {
      const warning = document.createElement('div');
      warning.className = 'small text-danger mt-2';
      warning.id = 'newProjectWarning';
      warning.textContent = 'Primero selecciona un proyecto (usar "Seleccionar proyecto").';
      const main = document.querySelector('main') || document.body;
      main.insertBefore(warning, main.firstChild);
      setTimeout(() => {
        const w = document.getElementById('newProjectWarning');
        if (w) w.remove();
      }, 2500);
      return;
    }

    try {
      const key = 'proyekta_transfer_project';
      const payload = { __ts: Date.now(), project: project };
      localStorage.setItem(key, JSON.stringify(payload));
      const newWin = window.open('/proyecto', '_blank');
      if (newWin) newWin.focus();
      else {
        const warning2 = document.createElement('div');
        warning2.className = 'small text-danger mt-2';
        warning2.id = 'newProjectWarning';
        warning2.textContent =
          'No se pudo abrir la nueva pestaña (popup bloqueado). Permite popups y vuelve a intentarlo.';
        const main = document.querySelector('main') || document.body;
        main.insertBefore(warning2, main.firstChild);
        setTimeout(() => {
          const w2 = document.getElementById('newProjectWarning');
          if (w2) w2.remove();
        }, 4000);
      }
    } catch (err) {
      console.error('Error transfiriendo proyecto:', err);
      alert('Error transfiriendo proyecto. Revisa la consola.');
    }
  });
})();
