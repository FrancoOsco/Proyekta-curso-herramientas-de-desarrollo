(function () {
  const TRANSFER_KEY = 'proyekta_transfer_project';
  const SESSION_KEY = 'proyekta_selected_project';

  function safeParse(raw) {
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function tryGetFromSession() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const parsed = safeParse(raw);
      return parsed && parsed.project ? parsed.project : parsed;
    } catch (e) {
      return null;
    }
  }

  function updateHeaderWithTitle(title) {
    const hdr = document.querySelector('#kanban-root .display-5');
    if (hdr) {
      hdr.textContent = `✅ PROYECTO: ${title || 'Sin nombre'}`;
    } else {
      const root = document.getElementById('kanban-root');
      if (!root) return;
      const wrapper = document.createElement('div');
      wrapper.className = 'text-center py-3';
      const h = document.createElement('h1');
      h.className = 'display-5 text-success mb-3';
      h.textContent = `✅ PROYECTO: ${title || 'Sin nombre'}`;
      wrapper.appendChild(h);
      root.insertBefore(wrapper, root.firstChild);
    }
  }

  function renderPreviewContainerText(text) {
    const pre = document.getElementById('projectDataPreview');
    if (pre) {
      pre.textContent = text;
    } else {
      const root = document.getElementById('kanban-root');
      if (!root) return;
      root.innerText = text;
    }
  }

  function normalizeMembersLocal(v) {
    if (!v) return [];
    if (Array.isArray(v)) return v;
    if (typeof v === 'string') {
      try {
        const parsed = JSON.parse(v);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
      return v
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [];
  }

  function renderMembersList(project) {
    try {
      const membersEl = document.getElementById('kanbanMembers');
      if (!membersEl) return;
      const members = project && project.members ? normalizeMembersLocal(project.members) : [];
      if (!members.length) {
        membersEl.innerHTML = '<div class="small muted-on-bg">No hay miembros.</div>';
      } else {
        membersEl.innerHTML = members
          .map((m) => {
            const safe = String(m).replace(/</g, '&lt;').replace(/>/g, '&gt;');
            return `<span class="member-chip me-1 mb-1 d-inline-block">${safe}</span>`;
          })
          .join('');
      }
    } catch (e) {}
  }

  document.addEventListener('DOMContentLoaded', function () {
    try {
      let raw = localStorage.getItem(TRANSFER_KEY);
      let parsed = raw ? safeParse(raw) : null;
      if (parsed && parsed.project) {
        const project = parsed.project;
        localStorage.removeItem(TRANSFER_KEY);

        try {
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(project));
        } catch (e) {}

        updateHeaderWithTitle(project.name || project.code || 'Sin nombre');
        renderPreviewContainerText(JSON.stringify(project, null, 2));
        renderMembersList(project);

        document.dispatchEvent(new CustomEvent('proyekta:project-selected', { detail: project }));
        return;
      }

      const fromSession = tryGetFromSession();
      if (fromSession) {
        const project = fromSession;
        updateHeaderWithTitle(project.name || project.code || 'Sin nombre');
        renderPreviewContainerText(JSON.stringify(project, null, 2));
        renderMembersList(project);
        document.dispatchEvent(new CustomEvent('proyekta:project-selected', { detail: project }));
        return;
      }

      const hdr = document.querySelector('#kanban-root .display-5');
      if (hdr) {
        hdr.textContent = 'No se transfirió proyecto';
      }
      renderPreviewContainerText('No se encontró información del proyecto.');
    } catch (err) {
      console.warn('Error consumiendo proyecto transferido:', err);
      renderPreviewContainerText('Error procesando la información del proyecto (ver consola).');
    }
  });
})();
