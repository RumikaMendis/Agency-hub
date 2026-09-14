// ============================================================
// AgencyHub — Audit Module
// ============================================================
(function () {
  'use strict';

  const fmt  = AgencyHub.utils.formatCurrency;
  const fmtD = AgencyHub.utils.formatDate;

  // ── helpers ──────────────────────────────────────────────

  function groupByCategory(items) {
    const groups = {};
    items.forEach(item => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return groups;
  }

  function scoreColor(score, total) {
    const pct = total > 0 ? (score / total) * 100 : 0;
    if (pct >= 80) return '#10B981';
    if (pct >= 50) return '#F59E0B';
    return '#EF4444';
  }

  function scoreBadgeHtml(score, total) {
    const color = scoreColor(score, total);
    return `<span class="font-bold" style="color:${color};font-variant-numeric:tabular-nums">${score}/${total}</span>`;
  }

  // ── render ────────────────────────────────────────────────

  function render(state) {
    const items = AgencyHub.AUDIT_ITEMS || [];
    const total = items.length;
    const grouped = groupByCategory(items);

    // Build checklist HTML grouped by category
    let checklistHtml = '';
    Object.entries(grouped).forEach(([category, catItems]) => {
      checklistHtml += `<div class="mb-4">
        <h4 class="text-sm font-bold text-muted mb-2" style="text-transform:uppercase;letter-spacing:0.05em">${category}</h4>`;
      catItems.forEach(item => {
        checklistHtml += `
          <div class="check-item" data-audit-item-id="${item.id}">
            <div class="check-box" data-item-id="${item.id}" id="audit-chk-${item.id}"></div>
            <div style="flex:1;min-width:0">
              <div class="flex items-center gap-2">
                <span class="check-label">${item.label}</span>
                <span class="check-category">${item.category}</span>
              </div>
              <div class="check-notes mt-2">
                <input type="text" class="form-input form-input-sm" placeholder="Notes for this item…"
                       id="audit-note-${item.id}" style="font-size:0.8rem">
              </div>
            </div>
          </div>`;
      });
      checklistHtml += '</div>';
    });

    return `
      <div class="anim-fade" id="audit-module-container">
        <div class="section-header">
          <div>
            <h2 class="section-title">Office Audit</h2>
            <p class="section-subtitle">Daily checklist &amp; compliance tracking</p>
          </div>
        </div>

        <div class="grid-2" style="align-items:start">
          <!-- LEFT: Audit Form -->
          <div class="card anim-slide-up" style="padding:20px;position:relative">
            <!-- Score Circle (top-right) -->
            <div class="score-circle" id="audit-score-circle"
                 style="position:absolute;top:20px;right:20px;border-color:#EF4444">
              <div class="score-value" id="audit-score-value" style="font-variant-numeric:tabular-nums">0/${total}</div>
              <div class="score-label">Score</div>
            </div>

            <h3 class="card-title mb-4" style="padding-right:100px">
              <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="vertical-align:middle;margin-right:6px">
                <path d="M9 11l3 3L22 4"/>
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
              </svg>
              New Audit
            </h3>

            <div class="form-row mb-4">
              <div class="form-group" style="flex:1">
                <label class="form-label">Date</label>
                <input type="date" id="audit-date" class="form-input" value="${AgencyHub.utils.today()}">
              </div>
            </div>

            ${checklistHtml}

            <div class="form-group mt-4">
              <label class="form-label">Overall Notes</label>
              <textarea id="audit-overall-notes" class="form-textarea" rows="3"
                        placeholder="General observations about the office visit…"></textarea>
            </div>

            <button class="btn btn-primary btn-lg w-full mt-4 admin-only" id="audit-save-btn">
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="vertical-align:middle;margin-right:6px">
                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                <polyline points="17,21 17,13 7,13 7,21"/>
                <polyline points="7,3 7,8 15,8"/>
              </svg>
              Save Audit
            </button>
          </div>

          <!-- RIGHT: Audit History -->
          <div>
            <h3 class="card-title mb-4">
              <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="vertical-align:middle;margin-right:6px">
                <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
              </svg>
              Audit History
            </h3>
            <div id="audit-history-list"></div>
          </div>
        </div>
      </div>`;
  }

  // ── init ──────────────────────────────────────────────────

  function init() {
    const container = document.getElementById('audit-module-container');
    if (!container) return;

    const items = AgencyHub.AUDIT_ITEMS || [];
    const total = items.length;

    // --- Checkbox toggling ---
    AgencyHub.utils.delegate(container, '.check-box', 'click', function (e, target) {
      target.classList.toggle('checked');
      updateScore();
    });

    function updateScore() {
      const checked = document.querySelectorAll('.check-box.checked').length;
      const circleEl = document.getElementById('audit-score-circle');
      const valueEl  = document.getElementById('audit-score-value');
      if (valueEl) valueEl.textContent = checked + '/' + total;
      if (circleEl) circleEl.style.borderColor = scoreColor(checked, total);
    }

    // --- Save Audit ---
    const saveBtn = document.getElementById('audit-save-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', function (e, target) {
        if (!AgencyHub.isAdmin()) { AgencyHub.utils.toast('View-only access', 'warning'); return; }
        const date = document.getElementById('audit-date').value;
        const overallNotes = document.getElementById('audit-overall-notes').value.trim();

        const auditItems = items.map(item => {
          const checkEl = document.getElementById('audit-chk-' + item.id);
          const noteEl  = document.getElementById('audit-note-' + item.id);
          return {
            id:       item.id,
            label:    item.label,
            category: item.category,
            checked:  checkEl ? checkEl.classList.contains('checked') : false,
            notes:    noteEl ? noteEl.value.trim() : ''
          };
        });

        const score = auditItems.filter(i => i.checked).length;

        const audit = {
          id:           AgencyHub.utils.generateId(),
          date:         date,
          items:        auditItems,
          score:        score,
          totalItems:   total,
          overallNotes: overallNotes
        };

        AgencyHub.data.saveAudit(audit);
        AgencyHub.utils.toast('Audit saved successfully!', 'success');
        resetForm();
        loadHistory();
      });
    }

    function resetForm() {
      document.getElementById('audit-date').value = AgencyHub.utils.today();
      document.getElementById('audit-overall-notes').value = '';
      document.querySelectorAll('.check-box').forEach(el => el.classList.remove('checked'));
      items.forEach(item => {
        const noteEl = document.getElementById('audit-note-' + item.id);
        if (noteEl) noteEl.value = '';
      });
      updateScore();
    }

    // --- History ---
    function loadHistory() {
      const audits = AgencyHub.data.getAudits().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      const container = document.getElementById('audit-history-list');
      if (!container) return;

      if (!audits.length) {
        container.innerHTML = `
          <div class="empty-state anim-fade">
            <div class="empty-state-icon">
              <svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                <rect x="9" y="3" width="6" height="4" rx="1"/>
              </svg>
            </div>
            <p class="text-muted">No audits recorded yet</p>
          </div>`;
        return;
      }

      container.innerHTML = audits.map(a => {
        const color = scoreColor(a.score, a.totalItems);
        const pct = a.totalItems > 0 ? Math.round((a.score / a.totalItems) * 100) : 0;
        const preview = a.overallNotes
          ? (a.overallNotes.length > 60 ? a.overallNotes.slice(0, 57) + '…' : a.overallNotes)
          : '<span class="text-muted">No notes</span>';
        return `
          <div class="card anim-fade" style="padding:14px;margin-bottom:12px;cursor:pointer" data-audit-view="${a.id}">
            <div class="flex items-center justify-between">
              <div>
                <div class="font-bold">${fmtD(a.date)}</div>
                <div class="text-sm mt-2">${preview}</div>
              </div>
              <div class="text-center" style="min-width:60px">
                <div class="font-bold" style="font-size:1.3rem;color:${color};font-variant-numeric:tabular-nums">${a.score}/${a.totalItems}</div>
                <div class="text-sm text-muted">${pct}%</div>
              </div>
            </div>
          </div>`;
      }).join('');
    }

    // --- View audit detail in modal ---
    AgencyHub.utils.delegate(container, '[data-audit-view]', 'click', function (e, target) {
      const id = target.dataset.auditView;
      const audits = AgencyHub.data.getAudits();
      const audit = audits.find(a => a.id === id);
      if (!audit) return;

      const color = scoreColor(audit.score, audit.totalItems);
      const grouped = groupByCategory(audit.items);

      let itemsHtml = '';
      Object.entries(grouped).forEach(([cat, catItems]) => {
        itemsHtml += `<h4 class="text-sm font-bold text-muted mt-4 mb-2" style="text-transform:uppercase;letter-spacing:0.05em">${cat}</h4>`;
        catItems.forEach(item => {
          const icon = item.checked
            ? `<svg width="18" height="18" fill="#10B981" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#10B981" stroke-width="2" fill="none"/></svg>`
            : `<svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="#EF4444" stroke-width="2" fill="none"/><path d="M15 9l-6 6M9 9l6 6" stroke="#EF4444" stroke-width="2"/></svg>`;
          const noteStr = item.notes ? `<div class="text-sm text-muted" style="margin-left:26px">${item.notes}</div>` : '';
          itemsHtml += `
            <div style="padding:6px 0;display:flex;align-items:center;gap:8px">
              ${icon}
              <span style="color:${item.checked ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.4)'}">${item.label}</span>
            </div>${noteStr}`;
        });
      });

      const bodyHtml = `
        <div class="flex items-center justify-between mb-4">
          <div>
            <div class="text-sm text-muted">Date</div>
            <div class="font-bold">${fmtD(audit.date)}</div>
          </div>
          <div class="text-center">
            <div class="font-bold" style="font-size:1.6rem;color:${color};font-variant-numeric:tabular-nums">${audit.score}/${audit.totalItems}</div>
            <div class="text-sm text-muted">Score</div>
          </div>
        </div>
        ${audit.overallNotes ? `<div class="card" style="padding:12px;margin-bottom:12px;background:rgba(255,255,255,0.04)"><div class="text-sm text-muted mb-2">Overall Notes</div><div>${audit.overallNotes}</div></div>` : ''}
        ${itemsHtml}`;

      const footerHtml = `
        <button class="btn btn-danger btn-sm admin-only" id="audit-delete-${audit.id}">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="vertical-align:middle;margin-right:4px">
            <polyline points="3,6 5,6 21,6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
            <path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
          </svg>
          Delete Audit
        </button>
        <button class="btn btn-ghost btn-sm" onclick="AgencyHub.utils.closeModal()">Close</button>`;

      AgencyHub.utils.showModal('Audit Details', bodyHtml, footerHtml, {
        size: 'lg',
        onInit: function (e, target) {
          const delBtn = document.getElementById('audit-delete-' + audit.id);
          if (delBtn) {
            delBtn.addEventListener('click', async function (e, target) {
              if (!AgencyHub.isAdmin()) { AgencyHub.utils.toast('View-only access', 'warning'); return; }
              const yes = await AgencyHub.utils.confirm('Delete Audit', 'Are you sure you want to delete this audit? This action cannot be undone.');
              if (yes) {
                AgencyHub.data.deleteAudit(audit.id);
                AgencyHub.utils.closeModal();
                AgencyHub.utils.toast('Audit deleted', 'success');
                loadHistory();
              }
            });
          }
        }
      });
    });

    // Initial load
    loadHistory();
  }

  AgencyHub.registerModule('audit', { render: render, init: init });
})();
