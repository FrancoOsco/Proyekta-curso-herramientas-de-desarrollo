const Proyekta = (function () {
  const STORAGE_KEY = 'proyekta_projects';
  const MAX_VISIBLE = 3;
  let currentMembers = [];
  const $ = (id) => document.getElementById(id);

  const csrfTokenMeta = document.querySelector('meta[name="_csrf"]');
  const csrfHeaderMeta = document.querySelector('meta[name="_csrf_header"]');
  const CSRF_TOKEN = csrfTokenMeta ? csrfTokenMeta.getAttribute('content') : null;
  const CSRF_HEADER = csrfHeaderMeta ? csrfHeaderMeta.getAttribute('content') : 'X-CSRF-TOKEN';

  function readCookie(name) {
    const v = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
    return v ? v.pop() : null;
  }
  const XSRF_COOKIE = !CSRF_TOKEN ? readCookie('XSRF-TOKEN') || readCookie('XSRF_TOKEN') : null;

  const api = {
    list: async () => {
      const res = await fetch('/api/projects', { credentials: 'same-origin' });
      if (!res.ok) throw new Error('Error cargando proyectos');
      return res.json();
    },
    get: async (id) => {
      const res = await fetch(`/api/projects/${id}`, { credentials: 'same-origin' });
      if (!res.ok) throw new Error('Error cargando proyecto');
      return res.json();
    },
    create: async (project) => {
      const headers = { 'Content-Type': 'application/json;charset=UTF-8' };
      if (CSRF_TOKEN) headers[CSRF_HEADER] = CSRF_TOKEN;
      else if (XSRF_COOKIE) headers['X-XSRF-TOKEN'] = XSRF_COOKIE;

      const doFetch = async (body) => {
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers,
          body,
          credentials: 'same-origin',
        });
        const text = await res.text();
        if (!res.ok) {
          try {
            const parsed = JSON.parse(text);
            console.error('Server error (JSON):', parsed);
            throw new Error(`Error ${res.status} - ${parsed.message || JSON.stringify(parsed)}`);
          } catch (e) {
            console.error('Server error (text):', text);
            throw new Error(`Error ${res.status} - ${text}`);
          }
        }
        try {
          return JSON.parse(text);
        } catch (e) {
          return text;
        }
      };

      try {
        return await doFetch(JSON.stringify(project));
      } catch (err) {
        console.warn(
          'Primer intento falló, intentando fallback con members como JSON string...',
          err,
        );
        const projectStringMembers = Object.assign({}, project, {
          members: JSON.stringify(Array.isArray(project.members) ? project.members : []),
        });
        try {
          return await doFetch(JSON.stringify(projectStringMembers));
        } catch (err2) {
          console.warn('Fallback 1 falló, intentando fallback con members = null...', err2);
          const projectNullMembers = Object.assign({}, project, { members: null });
          return await doFetch(JSON.stringify(projectNullMembers));
        }
      }
    },
    delete: async (id) => {
      const headers = {};
      if (CSRF_TOKEN) headers[CSRF_HEADER] = CSRF_TOKEN;
      else if (XSRF_COOKIE) headers['X-XSRF-TOKEN'] = XSRF_COOKIE;
      const res = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
        headers,
        credentials: 'same-origin',
      });
      if (!res.ok && res.status !== 204) throw new Error('Error eliminando proyecto');
      return true;
    },
  };

  function normalizeMembers(v) {
    if (!v) return [];
    if (Array.isArray(v)) return v;
    if (typeof v === 'string') {
      const trimmed = v.trim();
      if (trimmed === '[]' || trimmed === '') return [];
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        return trimmed
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }
    return [];
  }

  function escapeHtml(str = '') {
    return String(str).replace(/[&<>"'`=\/]/g, function (s) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '/': '&#x2F;',
        '`': '&#x60;',
        '=': '&#x3D;',
      }[s];
    });
  }

  function renderMembersPreview() {
    const preview = $('membersPreview');
    if (!preview) return;
    preview.innerHTML = '';
    if (!currentMembers.length) {
      preview.innerHTML = '<div class="small muted-on-bg">No hay miembros añadidos.</div>';
      return;
    }
    const frag = document.createDocumentFragment();
    currentMembers.forEach((m, i) => {
      const span = document.createElement('span');
      span.className = 'member-chip d-inline-flex align-items-center';
      span.style.marginRight = '6px';
      span.style.marginBottom = '6px';
      const text = document.createElement('span');
      text.textContent = m;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-sm btn-link remove-member';
      btn.setAttribute('data-idx', String(i));
      btn.title = 'Eliminar miembro';
      btn.style.color = 'inherit';
      btn.style.textDecoration = 'none';
      btn.style.marginLeft = '8px';
      btn.style.padding = '0';
      btn.innerHTML = '<i class="bi bi-x-circle-fill"></i>';
      span.appendChild(text);
      span.appendChild(btn);
      frag.appendChild(span);
    });
    preview.appendChild(frag);
  }

  function addMember(name) {
    const nm = (name || '').trim();
    if (!nm) return false;
    currentMembers.push(nm);
    renderMembersPreview();
    return true;
  }

  function removeMemberAt(index) {
    if (index < 0 || index >= currentMembers.length) return;
    currentMembers.splice(index, 1);
    renderMembersPreview();
  }

  function createMemberField(value = '') {
    const wrapper = document.createElement('div');
    wrapper.className = 'd-flex gap-2 mb-2 align-items-center';
    const input = document.createElement('input');
    input.type = 'text';
    input.value = value;
    input.placeholder = 'Nombre y apellidos';
    input.className = 'form-control form-control-sm';
    input.setAttribute('data-member-field', '1');
    const btnRemove = document.createElement('button');
    btnRemove.type = 'button';
    btnRemove.className = 'btn btn-sm btn-danger';
    btnRemove.innerHTML = '<i class="bi bi-trash"></i>';
    btnRemove.onclick = () => wrapper.remove();
    wrapper.appendChild(input);
    wrapper.appendChild(btnRemove);
    return wrapper;
  }

  function openMembersModal() {
    const container = $('membersFieldsContainer');
    if (!container) return;
    container.innerHTML = '';
    if (currentMembers.length) {
      currentMembers.forEach((m) => container.appendChild(createMemberField(m)));
    } else {
      for (let i = 0; i < 3; i++) container.appendChild(createMemberField(''));
    }
    const count = $('membersCount');
    if (count) count.value = container.querySelectorAll('input[data-member-field]').length;
  }

  function generateMemberFields(count) {
    const container = $('membersFieldsContainer');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const val = currentMembers[i] || '';
      container.appendChild(createMemberField(val));
    }
  }

  function saveMembersFromModal() {
    const container = $('membersFieldsContainer');
    if (!container) return;
    const inputs = container.querySelectorAll('input[data-member-field]');
    currentMembers = Array.from(inputs)
      .map((i) => i.value.trim())
      .filter(Boolean);
    renderMembersPreview();
    const modalEl = $('membersModal');
    const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
    modal.hide();
  }

  function setupDeleteConfirm() {
    const modalEl = $('confirmDeleteModal');
    const confirmBtn = $('confirmDeleteBtn');
    const nameEl = $('confirmDeleteProjectName');
    const metaEl = $('confirmDeleteProjectMeta');
    if (!modalEl || !confirmBtn) return;

    async function onConfirmClick() {
      const pid = modalEl.dataset.projectId;
      if (!pid) {
        bootstrap.Modal.getInstance(modalEl)?.hide();
        return;
      }
      confirmBtn.disabled = true;
      const original = confirmBtn.innerHTML;
      confirmBtn.innerHTML =
        '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Eliminando...';
      try {
        await api.delete(pid);
        bootstrap.Modal.getInstance(modalEl)?.hide();
        await renderProjects();
        await renderAllProjectsModal();
        if (typeof window.showSuccessToast === 'function') {
          window.showSuccessToast(`Proyecto eliminado`);
        } else {
          console.log('Proyecto eliminado:', pid);
        }
      } catch (err) {
        console.error('Error eliminando proyecto:', err);
        if (typeof window.showErrorToast === 'function') {
          window.showErrorToast('No se pudo eliminar el proyecto');
        } else {
          alert('No se pudo eliminar el proyecto.');
        }
      } finally {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = original;
      }
    }

    confirmBtn.addEventListener('click', onConfirmClick, { once: false });
  }

  function openDeleteModal(projectId, projectName) {
    const modalEl = $('confirmDeleteModal');
    const nameEl = $('confirmDeleteProjectName');
    const metaEl = $('confirmDeleteProjectMeta');
    if (!modalEl) {
      if (confirm(`Eliminar proyecto "${projectName || ''}"?`)) {
        api
          .delete(projectId)
          .then(() => {
            renderProjects();
            renderAllProjectsModal();
          })
          .catch((e) => {
            console.error(e);
            alert('No se pudo eliminar');
          });
      }
      return;
    }
    modalEl.dataset.projectId = String(projectId || '');
    if (nameEl) nameEl.textContent = projectName || 'Proyecto';
    if (metaEl)
      metaEl.textContent = `¿Eliminar "${
        projectName || 'este proyecto'
      }"? Esta acción no se puede deshacer.`;
    const inst = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
    inst.show();
    setTimeout(() => {
      const btn = $('confirmDeleteBtn');
      if (btn) btn.focus();
    }, 200);
  }

  async function renderProjects() {
    const container = $('projectsContainer');
    if (!container) return;
    container.innerHTML = '';
    let list = [];
    try {
      list = await api.list();
    } catch (err) {
      console.error(err);
      container.innerHTML =
        '<div class="col-12"><div class="card p-3 project-card small muted-on-bg">Error cargando proyectos.</div></div>';
      return;
    }
    const countText = `${list.length} proyecto${list.length !== 1 ? 's' : ''}`;
    const totalEl = $('totalProjects');
    if (totalEl) totalEl.innerText = countText;
    const totalHeaderEl = $('totalProjectsHeader');
    if (totalHeaderEl) totalHeaderEl.innerText = countText;
    if (!list.length) {
      container.innerHTML =
        '<div class="col-12"><div class="card p-3 project-card small muted-on-bg">No hay proyectos guardados.</div></div>';
      return;
    }
    const frag = document.createDocumentFragment();
    const visible = list.slice(0, MAX_VISIBLE);

    visible.forEach((p) => {
      const col = document.createElement('div');
      col.className = 'col-md-6 col-lg-4 mb-3';

      const card = document.createElement('div');
      card.className = 'card p-3 project-card h-100';

      const title = document.createElement('h5');
      title.className = 'mb-1';
      title.textContent = p.name || 'Sin nombre';

      const membersArr = normalizeMembers(p.members);

      const meta = document.createElement('div');
      meta.className = 'small muted-on-bg mb-2';
      meta.textContent = `${p.method || '—'} • ${p.start || '—'} → ${p.end || '—'}`;
      if (membersArr.length) {
        meta.textContent += ` • ${membersArr.length} miembro${membersArr.length > 1 ? 's' : ''}`;
      }

      const desc = document.createElement('p');
      desc.className = 'small text-truncate';
      desc.textContent = p.description || '';

      const actions = document.createElement('div');
      actions.className = 'd-flex gap-2 mt-3';

      const btnView = document.createElement('button');
      btnView.className = 'btn btn-sm btn-outline-black';
      btnView.innerHTML = '<i class="bi bi-eye"></i> Ver';
      btnView.onclick = () => openProject(p.id);

      const btnDelete = document.createElement('button');
      btnDelete.className = 'btn btn-sm btn-danger ms-auto';
      btnDelete.innerHTML = '<i class="bi bi-trash"></i>';
      btnDelete.onclick = () => {
        openDeleteModal(p.id, p.name);
      };

      actions.appendChild(btnView);
      actions.appendChild(btnDelete);

      card.appendChild(title);
      card.appendChild(meta);
      card.appendChild(desc);
      card.appendChild(actions);

      col.appendChild(card);
      frag.appendChild(col);
    });

    if (list.length > MAX_VISIBLE) {
      const col = document.createElement('div');
      col.className = 'col-12';
      const notice = document.createElement('div');
      notice.className = 'card p-3 project-card d-flex align-items-center justify-content-between';
      notice.style.cursor = 'pointer';
      const left = document.createElement('div');
      left.innerHTML = `<div class="small muted-on-bg">Ver todos los proyectos</div>`;
      const rightBtn = document.createElement('button');
      rightBtn.className = 'btn btn-sm btn-outline-black';
      rightBtn.innerHTML = '<i class="bi bi-folder2-open"></i> Abrir';
      rightBtn.onclick = (e) => {
        e.stopPropagation();
        openAllProjectsModal();
      };
      notice.addEventListener('click', openAllProjectsModal);
      notice.appendChild(left);
      notice.appendChild(rightBtn);
      col.appendChild(notice);
      frag.appendChild(col);
    }

    container.appendChild(frag);
  }

  async function deleteProject(id) {
    try {
      await api.delete(id);
      await renderProjects();
      await renderAllProjectsModal();
    } catch (err) {
      console.error(err);
      alert('Error eliminando proyecto.');
    }
  }

  async function openProject(id) {
    try {
      const p = await api.get(id);
      if (!p) return;

      const modalEl = $('viewProjectModal');
      const viewNameEl = $('viewName');
      viewNameEl.innerText = p.name || '';
      viewNameEl.classList.add('text-white');

      $('viewDesc').innerText = p.description || '';
      $('viewMethod').innerText = p.method || '';
      $('viewDates').innerText = `${p.start || '—'} → ${p.end || '—'}`;

      const viewCodeEl = $('viewCode');
      if (viewCodeEl) {
        viewCodeEl.innerText = p.code || '';
        viewCodeEl.setAttribute('title', p.code || '');
      }
      const btnCopy = $('btnCopyProjectCode');
      if (btnCopy) {
        btnCopy.replaceWith(btnCopy.cloneNode(true));
        const newBtn = $('btnCopyProjectCode');
        newBtn.addEventListener(
          'click',
          async () => {
            const codeText = p.code || '';
            if (!codeText) return;
            try {
              await navigator.clipboard.writeText(codeText);
              if (typeof window.showSuccessToast === 'function') {
                window.showSuccessToast('Código copiado al portapapeles');
              } else {
                const orig = newBtn.innerHTML;
                newBtn.innerHTML = '<i class="bi bi-check-lg"></i> Copiado';
                setTimeout(() => (newBtn.innerHTML = orig), 1400);
              }
            } catch (err) {
              console.error('No se pudo copiar:', err);
              if (typeof window.showErrorToast === 'function') {
                window.showErrorToast('No se pudo copiar el código');
              } else {
                alert('No se pudo copiar el código. Selecciónalo manualmente.');
              }
            }
          },
          { once: false },
        );
      }

      const membersEl = $('viewMembers');
      if (membersEl) {
        membersEl.innerHTML = '';
        const membersArr = normalizeMembers(p.members);
        membersArr.forEach((m) => {
          const span = document.createElement('span');
          span.className = 'member-chip';
          span.textContent = m;
          membersEl.appendChild(span);
        });
        if (!membersArr.length) {
          membersEl.innerHTML = '<div class="small muted-on-bg">No hay miembros.</div>';
        }
      }

      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    } catch (err) {
      console.error(err);
      alert('Error cargando detalles del proyecto.');
    }
  }

  async function renderAllProjectsModal() {
    const listContainer = $('allProjectsList');
    const countEl = $('allProjectsCount');
    if (!listContainer) return;
    listContainer.innerHTML = '';
    let list = [];
    try {
      list = await api.list();
    } catch (err) {
      console.error(err);
      listContainer.innerHTML = '<div class="small muted-on-bg">Error cargando proyectos.</div>';
      if (countEl) countEl.innerText = '0 proyectos';
      return;
    }
    if (countEl) countEl.innerText = `${list.length} proyecto${list.length !== 1 ? 's' : ''}`;
    if (!list.length) {
      listContainer.innerHTML = '<div class="small muted-on-bg">No hay proyectos guardados.</div>';
      return;
    }
    const frag = document.createDocumentFragment();
    list.forEach((p) => {
      const row = document.createElement('div');
      row.className = 'd-flex align-items-start gap-3 mb-3';
      const info = document.createElement('div');
      info.style.flex = '1';
      const title = document.createElement('div');
      title.className = 'fw-bold';
      title.textContent = p.name || 'Sin nombre';
      const membersArr = normalizeMembers(p.members);
      const meta = document.createElement('div');
      meta.className = 'small muted-on-bg mb-1';
      meta.textContent = `${p.method || '—'} • ${p.start || '—'} → ${p.end || '—'}`;
      if (membersArr.length)
        meta.textContent += ` • ${membersArr.length} miembro${membersArr.length > 1 ? 's' : ''}`;
      const desc = document.createElement('div');
      desc.className = 'small text-truncate';
      desc.textContent = p.description || '';
      info.appendChild(title);
      info.appendChild(meta);
      info.appendChild(desc);
      const actions = document.createElement('div');
      actions.className = 'd-flex flex-column gap-2 ms-0';
      const btnView = document.createElement('button');
      btnView.className = 'btn btn-sm btn-outline-black';
      btnView.innerHTML = '<i class="bi bi-eye"></i> Ver';

      btnView.addEventListener('click', (e) => {
        e.stopPropagation();
        const allModalEl = $('allProjectsModal');
        const viewModalEl = $('viewProjectModal');
        if (!viewModalEl) {
          openProject(p.id);
          return;
        }
        const openDetailAndBindReturn = () => {
          openProject(p.id);
          const onDetailHidden = () => {
            viewModalEl.removeEventListener('hidden.bs.modal', onDetailHidden);
            renderAllProjectsModal();
            if (allModalEl) {
              const inst =
                bootstrap.Modal.getInstance(allModalEl) || new bootstrap.Modal(allModalEl);
              inst.show();
            }
          };
          viewModalEl.addEventListener('hidden.bs.modal', onDetailHidden, { once: true });
        };

        if (allModalEl) {
          const allInst = bootstrap.Modal.getInstance(allModalEl);
          if (allInst) {
            const onAllHidden = () => {
              allModalEl.removeEventListener('hidden.bs.modal', onAllHidden);
              openDetailAndBindReturn();
            };
            allModalEl.addEventListener('hidden.bs.modal', onAllHidden, { once: true });
            allInst.hide();
            return;
          }
        }

        openDetailAndBindReturn();
      });

      const btnDelete = document.createElement('button');
      btnDelete.className = 'btn btn-sm btn-danger';
      btnDelete.innerHTML = '<i class="bi bi-trash"></i> Eliminar';
      btnDelete.onclick = () => {
        openDeleteModal(p.id, p.name);
      };

      actions.appendChild(btnView);
      actions.appendChild(btnDelete);

      row.appendChild(info);
      row.appendChild(actions);
      frag.appendChild(row);
    });

    listContainer.appendChild(frag);
  }

  async function openAllProjectsModal() {
    await renderAllProjectsModal();
    const modalEl = $('allProjectsModal');
    if (!modalEl) return;
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  }

  function scrollToSaved() {
    const el = $('savedProjectsSection');
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth' });
  }

  function selectPlan(planKey, price) {
    const pretty =
      {
        basico: 'Básico',
        pro: 'Pro',
        empresa: 'Empresa',
      }[planKey] || planKey;

    const selectedBlock = $('planSelected');
    const nameEl = $('planSelectedName');
    const detailEl = $('planSelectedDetail');

    if (nameEl) nameEl.innerText = pretty;
    if (detailEl) {
      detailEl.innerText = `Precio: S/ ${price} / mes`;
      detailEl.setAttribute('data-price', `S/ ${price} x mes`);
    }
    if (selectedBlock) selectedBlock.classList.remove('d-none');
  }

  function clearPlanSelection() {
    const selectedBlock = $('planSelected');
    if (selectedBlock) selectedBlock.classList.add('d-none');
    const nameEl = $('planSelectedName');
    const detailEl = $('planSelectedDetail');
    if (nameEl) nameEl.innerText = '';
    if (detailEl) {
      detailEl.innerText = '';
      detailEl.removeAttribute('data-price');
    }
  }

  function bindPlanModal() {
    const btnImprove = $('btnImprovePlan');
    const planModalEl = $('planModal');
    if (!btnImprove || !planModalEl) return;
    const planModal = new bootstrap.Modal(planModalEl);

    btnImprove.addEventListener('click', (e) => {
      e.preventDefault();
      const projModalEl = $('projectModal');
      if (projModalEl) {
        const inst = bootstrap.Modal.getInstance(projModalEl);
        if (inst) inst.hide();
      }
      clearPlanSelection();
      planModal.show();
    });

    planModalEl.addEventListener('click', (ev) => {
      const btn = ev.target.closest('.btn-select-plan');
      if (!btn) return;
      const plan = btn.getAttribute('data-plan');
      const price = btn.getAttribute('data-price');
      selectPlan(plan, price);
    });

    const proceedBtn = $('btnProceedPayment');
    if (proceedBtn) {
      proceedBtn.addEventListener('click', () => {
        const name = $('planSelectedName')?.innerText || '';
        const price = $('planSelectedDetail')?.getAttribute('data-price') || '';
        if (!name) {
          alert('Selecciona primero un plan.');
          return;
        }
        alert(
          `Acabas de pagar ${price} por el plan "${name}".\nMuchas gracias por la compra de este plan`,
        );
        planModal.hide();
      });
    }

    const cancelBtn = $('btnCancelPlan');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        clearPlanSelection();
        planModal.hide();
      });
    }
  }

  function init() {
    document.addEventListener('DOMContentLoaded', async () => {
      await renderProjects();
      renderMembersPreview();

      const memberQuickInput = $('memberQuickInput');
      const btnAddMember = $('btnAddMember');
      const membersPreview = $('membersPreview');

      if (btnAddMember && memberQuickInput) {
        btnAddMember.addEventListener('click', () => {
          const val = memberQuickInput.value.trim();
          if (addMember(val)) memberQuickInput.value = '';
        });
        memberQuickInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            const val = memberQuickInput.value.trim();
            if (addMember(val)) memberQuickInput.value = '';
          }
        });
      }

      if (membersPreview) {
        membersPreview.addEventListener('click', (e) => {
          const btn = e.target.closest('.remove-member');
          if (!btn) return;
          const idx = parseInt(btn.getAttribute('data-idx') || '-1', 10);
          if (!Number.isNaN(idx)) removeMemberAt(idx);
        });
      }

      const membersModal = $('membersModal');
      if (membersModal) membersModal.addEventListener('show.bs.modal', openMembersModal);

      const btnGenerateMembers = $('btnGenerateMembers');
      if (btnGenerateMembers) {
        btnGenerateMembers.addEventListener('click', () => {
          const countEl = $('membersCount');
          const count = Math.min(Math.max(0, parseInt(countEl?.value || '0', 10)), 50);
          generateMemberFields(count);
        });
      }

      const btnAddField = $('btnAddField');
      if (btnAddField) {
        btnAddField.addEventListener('click', () => {
          const container = $('membersFieldsContainer');
          if (!container) return;
          container.appendChild(createMemberField(''));
          const countEl = $('membersCount');
          if (countEl)
            countEl.value = container.querySelectorAll('input[data-member-field]').length;
        });
      }

      const btnSaveMembersModal = $('btnSaveMembersModal');
      if (btnSaveMembersModal) btnSaveMembersModal.addEventListener('click', saveMembersFromModal);

      const form = $('projectForm');
      if (form) {
        form.addEventListener('submit', async function (e) {
          e.preventDefault();
          const name = ($('projectName')?.value || '').trim();
          if (!name) return alert('El proyecto necesita un nombre');
          const generatedId = 'PRJ-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
          const project = {
            code: generatedId,
            name,
            method: $('projectMethod')?.value || '',
            description: ($('projectDesc')?.value || '').trim(),
            members: [...currentMembers],
            start: $('projectStart')?.value || '',
            end: $('projectEnd')?.value || '',
            created_at: new Date().toISOString(),
          };
          try {
            const savedProject = await api.create(project);
            const modalEl = $('projectModal');
            const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
            modal.hide();
            form.reset();
            currentMembers = [];
            renderMembersPreview();
            await renderProjects();
            if (typeof window.showSuccessToast === 'function') {
              window.showSuccessToast(generatedId);
            } else {
              alert(`Proyecto guardado en la base de datos.\nCódigo de proyecto: ${generatedId}`);
            }
          } catch (err) {
            console.error('Error creando proyecto:', err);
            if (typeof window.showErrorToast === 'function') {
              const serverMsg =
                err && err.message ? err.message : 'Error al guardar proyecto. Revisa la consola.';
              window.showErrorToast(serverMsg);
            } else {
              alert('Error al guardar proyecto.');
            }
          }
        });
      }

      const btnAll = $('btnShowSaved');
      if (btnAll) {
        btnAll.addEventListener('click', (e) => {
          e.preventDefault();
          openAllProjectsModal();
        });
      }
      const btnManage = $('btnManageProjects') || $('btnShowSaved');
      if (btnManage) {
        btnManage.addEventListener('click', (e) => {
          e.preventDefault();
          openAllProjectsModal();
        });
      }

      bindPlanModal();
      setupDeleteConfirm();
    });

    (function () {
      const btnManageMembers = document.getElementById('btnManageMembers');
      const projectModalEl = document.getElementById('projectModal');
      const membersModalEl = document.getElementById('membersModal');
      if (!btnManageMembers || !membersModalEl) return;

      btnManageMembers.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const projInst = projectModalEl
          ? bootstrap.Modal.getInstance(projectModalEl) || null
          : null;
        const membersInst =
          bootstrap.Modal.getInstance(membersModalEl) || new bootstrap.Modal(membersModalEl);

        const openMembers = () => {
          membersInst.show();
          const onMembersHidden = function () {
            membersModalEl.removeEventListener('hidden.bs.modal', onMembersHidden);
            if (projectModalEl) {
              const restoredProjInst =
                bootstrap.Modal.getInstance(projectModalEl) || new bootstrap.Modal(projectModalEl);
              setTimeout(() => restoredProjInst.show(), 50);
            }
          };
          membersModalEl.addEventListener('hidden.bs.modal', onMembersHidden, { once: true });
        };

        if (projInst) {
          const onProjHidden = function () {
            projectModalEl.removeEventListener('hidden.bs.modal', onProjHidden);
            openMembers();
          };
          projectModalEl.addEventListener('hidden.bs.modal', onProjHidden, { once: true });
          projInst.hide();
          return;
        }

        openMembers();
      });

      ['shown.bs.modal', 'hidden.bs.modal'].forEach((evt) => {
        document.addEventListener(evt, (ev) => {
          try {
            document.body.style.paddingRight = '';
            const modal = ev.target;
            if (modal && modal.style) modal.style.paddingRight = '';
          } catch (err) {}
        });
      });

      document.addEventListener('hidden.bs.modal', () => {
        setTimeout(() => {
          document.body.style.paddingRight = '';
          document.querySelectorAll('.modal').forEach((m) => (m.style.paddingRight = ''));
        }, 10);
      });
    })();
  }

  return {
    init,
    renderProjects,
    openProject,
    deleteProject,
    scrollToSaved,
    openAllProjectsModal,
    renderAllProjectsModal,
    currentMembers,
    renderMembersPreview,
    api,
    openDeleteModal,
  };
})();

(function () {
  let openedFromProjectModal = false;

  const btnManageMembers = document.getElementById('btnManageMembers');
  if (btnManageMembers) {
    btnManageMembers.addEventListener('click', (e) => {
      e.preventDefault();

      const projectModalEl = document.getElementById('projectModal');
      const membersModalEl = document.getElementById('membersModal');
      if (!membersModalEl) return;

      openedFromProjectModal =
        !!projectModalEl && bootstrap.Modal.getInstance(projectModalEl) !== null;

      if (projectModalEl) {
        const projModalInst =
          bootstrap.Modal.getInstance(projectModalEl) || new bootstrap.Modal(projectModalEl);
        projModalInst.hide();
      }

      const membersModalInst =
        bootstrap.Modal.getInstance(membersModalEl) || new bootstrap.Modal(membersModalEl);
      membersModalInst.show();
    });
  }

  const btnSaveMembers = document.getElementById('btnSaveMembersModal');
  if (btnSaveMembers) {
    btnSaveMembers.addEventListener('click', (e) => {
      if (typeof saveMembersFromModal === 'function') {
        saveMembersFromModal();
      }

      const membersModalEl = document.getElementById('membersModal');
      const projectModalEl = document.getElementById('projectModal');

      if (membersModalEl && projectModalEl && openedFromProjectModal) {
        membersModalEl.addEventListener(
          'hidden.bs.modal',
          function handler() {
            membersModalEl.removeEventListener('hidden.bs.modal', handler);

            const projModalInst =
              bootstrap.Modal.getInstance(projectModalEl) || new bootstrap.Modal(projectModalEl);
            projModalInst.show();

            openedFromProjectModal = false;
          },
          { once: true },
        );
      }
    });
  }

  const membersModalEl = document.getElementById('membersModal');
  if (membersModalEl) {
    membersModalEl.addEventListener('hidden.bs.modal', () => {
      if (!openedFromProjectModal) return;
      const projectModalEl = document.getElementById('projectModal');
      if (!projectModalEl) return;

      const projModalInst =
        bootstrap.Modal.getInstance(projectModalEl) || new bootstrap.Modal(projectModalEl);
      projModalInst.show();
      openedFromProjectModal = false;
    });
  }
})();

Proyekta.init();

window.renderProjects = Proyekta.renderProjects;
window.openProject = Proyekta.openProject;
window.deleteProject = Proyekta.deleteProject;
window.scrollToSaved = Proyekta.scrollToSaved;
window.openAllProjectsModal = Proyekta.openAllProjectsModal;
window.openDeleteModal = Proyekta.openDeleteModal;
