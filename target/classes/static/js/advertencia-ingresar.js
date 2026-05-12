(function () {
  const $ = (id) => document.getElementById(id);

  function normalizeMembers(v) {
    if (!v) return [];
    if (Array.isArray(v)) return v;
    if (typeof v === 'string') {
      const t = v.trim();
      if (t === '[]' || t === '') return [];
      try {
        const p = JSON.parse(t);
        if (Array.isArray(p)) return p;
      } catch (e) {
        return t
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }
    return [];
  }

  function escapeHtml(s = '') {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderMembersInto(container, membersArr) {
    if (!container) return;
    container.innerHTML = '';
    if (!membersArr || !membersArr.length) {
      container.innerHTML = '<div class="small muted-on-bg">No hay miembros.</div>';
      return;
    }
    membersArr.forEach((m) => {
      const span = document.createElement('span');
      span.className = 'member-chip me-1 mb-1 d-inline-block';
      span.style.padding = '6px 10px';
      span.style.borderRadius = '999px';
      span.style.background = 'rgba(255,255,255,0.04)';
      span.style.fontSize = '0.85rem';
      span.textContent = m;
      container.appendChild(span);
    });
  }

  async function fetchProjectsSafe() {
    try {
      if (window.Proyekta && Proyekta.api && typeof Proyekta.api.list === 'function') {
        const list = await Proyekta.api.list();
        return Array.isArray(list) ? list : [];
      }
      const res = await fetch('/api/projects', { credentials: 'same-origin' });
      if (!res.ok) return [];
      const json = await res.json();
      return Array.isArray(json) ? json : [];
    } catch (err) {
      console.warn('Error leyendo proyectos:', err);
      return [];
    }
  }

  async function fetchProjectByIdOrCode(idOrCode) {
    if (!idOrCode) return null;
    const raw = String(idOrCode).trim();
    if (!raw) return null;
    const isNumeric = /^\d+$/.test(raw);
    if (isNumeric) {
      try {
        const r = await fetch(`/api/projects/${raw}`, { credentials: 'same-origin' });
        if (r.ok) return await r.json();
      } catch (e) {
        console.warn('fetch by id failed', e);
      }
    }
    try {
      const r2 = await fetch(`/api/projects/code/${encodeURIComponent(raw)}`, {
        credentials: 'same-origin',
      });
      if (r2.ok) return await r2.json();
    } catch (e) {
      console.warn('fetch by code failed', e);
    }
    return null;
  }

  async function populateProjectSelect() {
    const select = $('selectProjectToEnter');
    if (!select) return;
    select.innerHTML = '<option value="">-- Seleccionar --</option>';
    select.disabled = true;
    const projects = await fetchProjectsSafe();
    if (!projects || !projects.length) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = 'No hay proyectos disponibles';
      select.appendChild(opt);
      select.disabled = true;
      return;
    }
    projects.forEach((p) => {
      try {
        const opt = document.createElement('option');
        opt.value = String(p.id);
        opt.textContent = p.name || `Proyecto ${p.id}`;
        opt.setAttribute('data-code', p.code || '');
        select.appendChild(opt);
      } catch (err) {
        console.warn('Error rendering option for project', p, err);
      }
    });
    select.disabled = false;
  }

  function showPreviewModal(project) {
    const modalEl = $('previewProjectModal');
    if (!modalEl) return;
    const notFoundEl = $('previewNotFound');
    const contentEl = $('previewContent');
    const codeEl = $('previewCode');
    const nameEl = $('previewName');
    const descEl = $('previewDesc');
    const methodEl = $('previewMethod');
    const datesEl = $('previewDates');
    const membersEl = $('previewMembers');

    if (!project) {
      if (notFoundEl) notFoundEl.classList.remove('d-none');
      if (contentEl) contentEl.classList.add('d-none');
    } else {
      if (notFoundEl) notFoundEl.classList.add('d-none');
      if (contentEl) contentEl.classList.remove('d-none');
      if (codeEl) codeEl.innerText = project.code || '';
      if (nameEl) nameEl.innerText = project.name || '';
      if (descEl) descEl.innerText = project.description || '';
      if (methodEl) methodEl.innerText = project.method || '—';
      if (datesEl) datesEl.innerText = `${project.start || '—'} → ${project.end || '—'}`;
      renderMembersInto(membersEl, normalizeMembers(project.members));
    }

    const btnConfirm = $('btnConfirmOpenProject');
    if (btnConfirm) {
      btnConfirm.onclick = async () => {
        if (!project || !project.id) {
          try {
            bootstrap.Modal.getInstance(modalEl)?.hide();
          } catch (e) {}
          return;
        }
        try {
          sessionStorage.setItem('proyekta_selected_project', JSON.stringify(project));
        } catch (e) {}
        try {
          sessionStorage.setItem(
            'currentProject',
            JSON.stringify({ id: project.id, name: project.name || '' }),
          );
        } catch (e) {}
        try {
          localStorage.setItem(
            'currentProject',
            JSON.stringify({ id: project.id, name: project.name || '' }),
          );
        } catch (e) {}
        try {
          if (window.setCurrentProject && typeof window.setCurrentProject === 'function') {
            window.setCurrentProject({ id: project.id, name: project.name || '' });
          } else if (
            window.enableIngresarButton &&
            typeof window.enableIngresarButton === 'function'
          ) {
            window.enableIngresarButton(true);
          } else {
            const btn = $('btnNewProject');
            if (btn) btn.disabled = false;
          }
        } catch (e) {
          console.warn('No se pudo notificar setCurrentProject/enableIngresarButton', e);
        }
        document.dispatchEvent(new CustomEvent('proyekta:project-selected', { detail: project }));
        try {
          const inst = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
          inst.hide();
        } catch (e) {}
        await openProjectIntoKanban(project);
        if (window.Proyekta && typeof window.Proyekta.openProject === 'function') {
          try {
            await window.Proyekta.openProject(project.id);
          } catch (e) {
            console.warn('Proyekta.openProject falló (no crítico):', e);
          }
        }
      };
    }
    new bootstrap.Modal(modalEl).show();
  }

  async function openProjectIntoKanban(project) {
    if (!project) return;
    try {
      sessionStorage.setItem('proyekta_selected_project', JSON.stringify(project));
    } catch (e) {}
    window.selectedProject = project;
    const root = $('kanban-root');
    if (!root) return;
    root.innerHTML = `<div class="p-3">
      <div class="d-flex align-items-start justify-content-between mb-3">
        <div>
          <h3 class="mb-1 text-white">${escapeHtml(project.name || '')}</h3>
          <div class="small text-muted text-white-50">${escapeHtml(project.description || '')}</div>
          <div class="small text-muted mt-2 text-white-50">Código: <strong class="text-white">${escapeHtml(
            project.code || '',
          )}</strong></div>
          <div class="small text-muted text-white-50">Metodología: ${escapeHtml(
            project.method || '—',
          )}</div>
          <div class="small text-muted text-white-50">Fechas: ${escapeHtml(
            project.start || '—',
          )} → ${escapeHtml(project.end || '—')}</div>
        </div>
      </div>
      <div class="mt-3 text-white-75">
        <strong>Miembros:</strong>
        <div id="kanbanMembers" class="mt-2 text-white"></div>
      </div>
    </div>`;
    renderMembersInto($('kanbanMembers'), normalizeMembers(project.members));
    const btnFull = $('btnOpenInFull');
    if (btnFull)
      btnFull.addEventListener('click', () =>
        document.dispatchEvent(new CustomEvent('proyekta:open-full-board', { detail: project })),
      );
    document.dispatchEvent(new CustomEvent('proyekta:project-opened', { detail: project }));
  }

  async function onSelectChange(e) {
    const select = e.target;
    const selectedId = select.value;
    const input = $('projectIdInput');
    if (input) input.value = selectedId || '';
    if (!selectedId) {
      window.selectedProject = null;
      return;
    }
    const p = await fetchProjectByIdOrCode(selectedId);
    window.selectedProject = p || { id: Number(selectedId) };
  }

  async function onInputChange(e) {
    const input = e.target;
    const val = input.value.trim();
    const select = $('selectProjectToEnter');
    if (!select) return;
    if (!val) {
      select.value = '';
      window.selectedProject = null;
      return;
    }
    const opt = Array.from(select.options).find((o) => o.value === val);
    if (opt) {
      select.value = val;
      await onSelectChange({ target: select });
      return;
    }
    const p = await fetchProjectByIdOrCode(val);
    if (p) {
      const newOpt = document.createElement('option');
      newOpt.value = String(p.id);
      newOpt.textContent = p.name || `Proyecto ${p.id}`;
      newOpt.setAttribute('data-code', p.code || '');
      select.appendChild(newOpt);
      select.value = String(p.id);
      window.selectedProject = p;
    } else {
      window.selectedProject = null;
    }
  }

  async function onBtnEnterProjectClick() {
    const select = $('selectProjectToEnter');
    const input = $('projectIdInput');
    const idVal = (input && input.value.trim()) || (select && select.value) || '';
    const enterModalEl = $('enterProjectModal');
    if (!idVal) {
      if (enterModalEl) {
        const footer = enterModalEl.querySelector('.modal-footer');
        if (footer) {
          const existing = $('enterProjectWarning');
          if (existing) existing.remove();
          const tmp = document.createElement('div');
          tmp.className = 'small text-danger mt-2';
          tmp.id = 'enterProjectWarning';
          tmp.textContent = 'Selecciona o escribe el ID o CÓDIGO de un proyecto.';
          footer.appendChild(tmp);
          setTimeout(() => {
            const el = $('enterProjectWarning');
            if (el) el.remove();
          }, 2500);
        }
      }
      return;
    }
    const p = await fetchProjectByIdOrCode(idVal);
    showPreviewModal(p);
    window.selectedProject = p || { id: Number(idVal) };
  }

  function bindEvents() {
    const select = $('selectProjectToEnter');
    const input = $('projectIdInput');
    const btnEnter = $('btnEnterProject');
    const modalEl = $('enterProjectModal');
    if (select) select.addEventListener('change', onSelectChange);
    if (input) {
      input.addEventListener('change', onInputChange);
      input.addEventListener('paste', () => setTimeout(() => onInputChange({ target: input }), 50));
    }
    if (btnEnter) btnEnter.addEventListener('click', onBtnEnterProjectClick);
    if (modalEl)
      modalEl.addEventListener('show.bs.modal', async () => {
        window.selectedProject = null;
        const inputEl = $('projectIdInput');
        if (inputEl) inputEl.value = '';
        await populateProjectSelect();
      });
    document.addEventListener('proyekta:preview-project', async (ev) => {
      const val = ev?.detail;
      if (!val) return;
      const p = await fetchProjectByIdOrCode(val);
      showPreviewModal(p);
    });
  }

  (function init() {
    window.selectedProject = null;
    bindEvents();
    try {
      const raw =
        sessionStorage.getItem('proyekta_selected_project') ||
        localStorage.getItem('proyekta_selected_project');
      if (raw) window.selectedProject = JSON.parse(raw);
    } catch (err) {}
    document.addEventListener('DOMContentLoaded', () => {
      const btn = $('btnNewProject');
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          let cur = null;
          try {
            cur = JSON.parse(
              localStorage.getItem('currentProject') ||
                sessionStorage.getItem('currentProject') ||
                'null',
            );
          } catch (err) {
            cur = null;
          }
          if (!cur || !cur.id) {
            const selModal = $('selectProjectModal');
            if (selModal) {
              const inst = bootstrap.Modal.getInstance(selModal) || new bootstrap.Modal(selModal);
              inst.show();
            }
            return;
          }
          const url = `/proyecto?projectId=${encodeURIComponent(cur.id)}`;
          window.open(url, '_blank', 'noopener');
        });
      }
    });
  })();
})();
