// =============================================================================
// AgencyHub — Daily Sales Entry Module (Total Quantity & B/F Mode)
// =============================================================================
(function () {
  'use strict';

  const { data, utils, state, AGENCIES } = AgencyHub;
  const escapeHtml = utils.escapeHtml || ((str) => str == null ? '' : String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'));

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function agencyTabs() {
    const current = state.currentAgency;
    const agencies = current !== 'all'
      ? [AGENCIES[current]]
      : [AGENCIES.bathipooja, AGENCIES.domie, AGENCIES.kelani || AGENCIES.kalani];
    return agencies;
  }

  function defaultTab() {
    const current = state.currentAgency;
    return current !== 'all' ? current : 'bathipooja';
  }

  // Active state
  let activeTab = null;
  let editingEntryId = null;
  let savedEntriesOpen = false;

  /**
   * Calculate previous Brought Forward (B/F) item quantities & financial figures for a given date in the month.
   * - On the 1st of the month (e.g. YYYY-MM-01), B/F totals start at 0 (B/F = Today Sold).
   * - On subsequent days, B/F totals are fetched from the latest previous daily entry of the same month.
   */
  function getPreviousBfQuantities(agencyId, targetDateStr) {
    if (!targetDateStr) targetDateStr = utils.today();
    const yearMonth = targetDateStr.substring(0, 7); // 'YYYY-MM'
    const dayNum = parseInt(targetDateStr.substring(8, 10), 10);

    // On 1st of month: B/F total is 0
    if (dayNum === 1) {
      return { itemBf: {}, financialBf: { grossSale: 0, discount: 0, netSale: 0 } };
    }

    const entries = data.getSalesEntries(agencyId) || [];
    // Find latest sales entry in the same month prior to targetDateStr (excluding current editing entry)
    const prevEntry = entries.find(e => e.date && e.date.startsWith(yearMonth) && e.date < targetDateStr && e.id !== editingEntryId);

    if (!prevEntry) {
      return { itemBf: {}, financialBf: { grossSale: 0, discount: 0, netSale: 0 } };
    }

    const itemBf = {};
    if (prevEntry.itemBfQuantities) {
      Object.assign(itemBf, prevEntry.itemBfQuantities);
    } else if (prevEntry.itemQuantities) {
      Object.assign(itemBf, prevEntry.itemQuantities);
    }

    const financialBf = prevEntry.grandTotals || prevEntry.totals || { grossSale: 0, discount: 0, netSale: 0 };
    return { itemBf, financialBf };
  }

  // ---------------------------------------------------------------------------
  // Render — Agency Tab Bar
  // ---------------------------------------------------------------------------

  function renderTabBar(agencies) {
    if (agencies.length === 1) return '';
    return `
      <div class="tabs mb-4">
        ${agencies.map((a) => `
          <button class="tab ${(activeTab || defaultTab()) === a.id ? 'active' : ''}"
                  data-tab-agency="${a.id}" id="sales-tab-${a.id}">
            <span>${a.icon}</span> ${a.name}
          </button>
        `).join('')}
      </div>`;
  }

  // ---------------------------------------------------------------------------
  // Render — Product Row for Daily Total Entry
  // ---------------------------------------------------------------------------

  function renderProductRow(agencyId, prodName, index, todayQty = '', prevBfQty = 0, isCustom = false) {
    const todayNum = parseFloat(todayQty) || 0;
    const prevBfNum = parseFloat(prevBfQty) || 0;
    const totalBf = todayNum + prevBfNum;

    return `
      <tr data-agency="${agencyId}" data-product="${escapeHtml(prodName)}" class="sf-item-row">
        <td style="text-align:center;width:45px;color:rgba(255,255,255,0.4);font-size:0.85rem;">
          ${index + 1}
        </td>
        <td style="font-weight:600;color:rgba(255,255,255,0.92);min-width:180px;">
          ${isCustom
            ? `<input type="text" class="table-input sf-custom-item-name" placeholder="Item Name" value="${escapeHtml(prodName)}" style="width:100%;">`
            : escapeHtml(prodName)}
        </td>
        <td style="width:140px;text-align:center;">
          <input type="number" class="table-input sf-today-qty font-mono text-center font-bold" data-agency="${agencyId}" min="0" step="1" placeholder="0" value="${todayQty !== '' ? todayQty : ''}" style="color:var(--primary-light,#818cf8);">
        </td>
        <td style="width:140px;text-align:center;">
          <span class="sf-prev-bf-qty font-mono" style="display:block;padding:6px 8px;color:rgba(255,255,255,0.6);font-weight:600;">${prevBfNum}</span>
        </td>
        <td style="width:150px;text-align:center;">
          <span class="sf-total-bf-qty font-mono font-bold" style="display:block;padding:6px 8px;color:#10B981;">${totalBf}</span>
        </td>
        <td style="width:40px;text-align:center;">
          ${isCustom ? `
            <button type="button" class="btn btn-ghost btn-sm btn-icon sf-remove-item-btn" title="Remove Item" style="color:var(--danger,#ef4444);opacity:0.75;">×</button>
          ` : ''}
        </td>
      </tr>`;
  }

  // ---------------------------------------------------------------------------
  // Render — Full Sales Form (Bathipooja / Domie)
  // ---------------------------------------------------------------------------

  function renderFullForm(agency) {
    const agencyId = agency.id;
    const dateStr = utils.today();
    const products = data.getProducts(agencyId) || [];
    const { itemBf, financialBf } = getPreviousBfQuantities(agencyId, dateStr);

    return `
      <div class="card anim-fade" id="sales-form-${agencyId}" style="display:${(activeTab || defaultTab()) === agencyId ? 'block' : 'none'}">
        <div class="card-header flex items-center justify-between">
          <div class="card-title flex items-center gap-2">
            <span>${agency.icon}</span> ${agency.fullName} — Daily Sales & Item Totals
          </div>
          <a href="#worksheets" class="btn btn-ghost btn-sm" style="display:inline-flex;align-items:center;gap:6px;font-size:0.8rem;" title="View & print printable sale worksheet forms">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            Sale Worksheet Forms
          </a>
        </div>

        <!-- Header Fields -->
        <div class="sales-form-header" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;padding:16px 20px 0;">
          <div class="form-group">
            <label class="form-label">Date</label>
            <input type="date" class="form-input sf-date-input" id="sf-date-${agencyId}" data-agency="${agencyId}" value="${dateStr}">
          </div>
          <div class="form-group">
            <label class="form-label">Sales Rep</label>
            <input type="text" class="form-input" id="sf-rep-${agencyId}" placeholder="Sales Rep Name">
          </div>
          <div class="form-group">
            <label class="form-label">Agent</label>
            <input type="text" class="form-input" id="sf-agent-${agencyId}" placeholder="Agent Name">
          </div>
          <div class="form-group">
            <label class="form-label">Driver</label>
            <input type="text" class="form-input" id="sf-driver-${agencyId}" placeholder="Driver Name">
          </div>
          <div class="form-group">
            <label class="form-label">Vehicle No</label>
            <input type="text" class="form-input" id="sf-vehicle-${agencyId}" placeholder="ABC-1234">
          </div>
          <div class="form-group">
            <label class="form-label">K.M.</label>
            <input type="number" class="form-input" id="sf-km-${agencyId}" placeholder="0" min="0">
          </div>
        </div>

        <div style="padding:16px 20px 4px;">
          <div class="flex items-center justify-between">
            <h3 style="font-size:1rem;font-weight:700;margin:0;display:flex;align-items:center;gap:8px;">
              📦 Total Item Quantities Sold Today
            </h3>
            <span class="text-sm text-muted" id="sf-bf-notice-${agencyId}" style="font-style:italic;">
              ${dateStr.endsWith('-01') ? '🗓️ 1st of Month — B/F initialized to 0' : '🔄 B/F Total = Yesterday B/F + Today Sold'}
            </span>
          </div>
        </div>

        <!-- Total Item Quantities Table -->
        <div class="sales-table-wrapper" style="overflow-x:auto;padding:8px 20px 8px;">
          <table class="sales-table" id="sf-table-${agencyId}">
            <thead>
              <tr>
                <th style="width:45px;text-align:center;">#</th>
                <th style="text-align:left;">Product / Item Name</th>
                <th style="width:140px;text-align:center;">Today Sold Qty</th>
                <th style="width:140px;text-align:center;">Previous B/F Qty</th>
                <th style="width:150px;text-align:center;">Total B/F Qty</th>
                <th style="width:40px;text-align:center;"></th>
              </tr>
            </thead>
            <tbody id="sf-tbody-${agencyId}">
              ${products.map((p, i) => renderProductRow(agencyId, p, i, '', itemBf[p] || 0)).join('')}
            </tbody>
            <tfoot>
              <tr class="row-total" id="sf-item-total-row-${agencyId}">
                <td colspan="2" style="font-weight:700;">TOTAL QUANTITIES SOLD</td>
                <td class="font-mono text-center font-bold" id="sf-item-today-total-${agencyId}" style="color:var(--primary-light,#818cf8);">0</td>
                <td class="font-mono text-center font-bold" id="sf-item-prev-total-${agencyId}">0</td>
                <td class="font-mono text-center font-bold" id="sf-item-grand-total-${agencyId}" style="color:#10B981;">0</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div style="padding:0 20px 12px;display:flex;gap:12px;align-items:center;">
          <button type="button" class="btn btn-ghost btn-sm" id="sf-add-custom-item-${agencyId}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Extra Product Item
          </button>
        </div>

        <!-- Sales Financial Summary Section -->
        <div style="padding:12px 20px;border-top:1px solid var(--border-color,#334155);background:rgba(0,0,0,0.15);">
          <h3 style="margin-bottom:12px;font-size:1rem;font-weight:700;display:flex;align-items:center;gap:8px;">
            💵 Financial Sales Summary (Rs.)
          </h3>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;">
            <div class="form-group">
              <label class="form-label">Today Gross Sale (Rs.)</label>
              <input type="number" class="form-input sf-financial-gross" id="sf-gross-${agencyId}" min="0" step="0.01" placeholder="0.00" style="font-variant-numeric:tabular-nums;font-weight:700;">
            </div>
            <div class="form-group">
              <label class="form-label">Today Discount (Rs.)</label>
              <input type="number" class="form-input sf-financial-disc" id="sf-disc-${agencyId}" min="0" step="0.01" placeholder="0.00" style="font-variant-numeric:tabular-nums;">
            </div>
            <div class="form-group">
              <label class="form-label">Today Net Sale (Rs.)</label>
              <div class="form-input font-mono font-bold" id="sf-net-${agencyId}" style="background:rgba(255,255,255,0.05);color:var(--primary-light,#818cf8);display:flex;align-items:center;">Rs. 0.00</div>
            </div>
            <div class="form-group">
              <label class="form-label">Previous B/F Net Sale (Rs.)</label>
              <div class="form-input font-mono" id="sf-bf-net-val-${agencyId}" style="background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.7);display:flex;align-items:center;">${(financialBf.netSale || 0).toFixed(2)}</div>
            </div>
            <div class="form-group">
              <label class="form-label">Grand B/F Net Sale (Rs.)</label>
              <div class="form-input font-mono font-bold" id="sf-grand-net-val-${agencyId}" style="background:rgba(16,185,129,0.1);color:#10B981;display:flex;align-items:center;">0.00</div>
            </div>
          </div>
        </div>

        <!-- Finance Report -->
        <div style="padding:16px 20px 12px;border-top:1px solid var(--border-color,#334155);">
          <h3 style="margin-bottom:12px;font-size:1rem;font-weight:700;">💰 Cash & Banking Reconciliation</h3>
          <div class="finance-report" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;">
            ${renderFinanceItem('Cash Deposited', `sf-fin-cash-${agencyId}`)}
            ${renderFinanceItem('Cheque Deposited', `sf-fin-cheque-${agencyId}`)}
            ${renderFinanceItem('Credit Bills B/F', `sf-fin-creditbf-${agencyId}`)}
            ${renderFinanceItem('Cheque in Hand to date', `sf-fin-chequehand-${agencyId}`)}
            ${renderFinanceItem('Credit Bills in Hand to date', `sf-fin-credithand-${agencyId}`)}
            ${renderFinanceItem('Cash in Hand', `sf-fin-cashhand-${agencyId}`)}
            <div class="finance-item" style="background:rgba(99,102,241,0.1);border-radius:10px;padding:12px;">
              <label class="form-label" style="font-weight:700;">Total Reconciled</label>
              <div class="font-mono font-bold" id="sf-fin-total-${agencyId}" style="font-size:1.1rem;color:var(--primary,#6366f1);margin-top:4px;">Rs. 0.00</div>
            </div>
          </div>
        </div>

        <!-- Save -->
        <div style="padding:16px 20px;display:flex;gap:12px;justify-content:flex-end;">
          <button type="button" class="btn btn-ghost" id="sf-clear-${agencyId}">Clear Form</button>
          <button type="button" class="btn btn-primary btn-lg" id="sf-save-${agencyId}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            Save Entry
          </button>
        </div>
      </div>`;
  }

  function renderFinanceItem(label, id) {
    return `
      <div class="finance-item">
        <label class="form-label">${label}</label>
        <input type="number" class="form-input sf-finance-input" id="${id}" min="0" step="0.01" placeholder="0.00" style="font-variant-numeric:tabular-nums;">
      </div>`;
  }

  // ---------------------------------------------------------------------------
  // Render — Kelani Simplified Form
  // ---------------------------------------------------------------------------

  function renderKelaniForm() {
    const agency = AGENCIES.kelani || AGENCIES.kalani;
    const tabActive = (activeTab || defaultTab()) === 'kelani' || (activeTab || defaultTab()) === 'kalani';
    return `
      <div class="card anim-fade" id="sales-form-kelani" style="display:${tabActive ? 'block' : 'none'}">
        <div class="card-header">
          <div class="card-title flex items-center gap-2">
            <span>${agency.icon}</span> ${agency.fullName} — Daily Sales Summary
          </div>
          <span class="badge badge-info">Simplified — SFA Integrated</span>
        </div>

        <div style="padding:20px;max-width:500px;">
          <div class="form-group">
            <label class="form-label">Date</label>
            <input type="date" class="form-input" id="sf-date-kelani" value="${utils.today()}">
          </div>
          <div class="form-group">
            <label class="form-label">Daily Sales Total</label>
            <input type="number" class="form-input" id="sf-kelani-sales" min="0" step="0.01" placeholder="0.00">
          </div>
          <div class="form-group">
            <label class="form-label">Outstanding Amount</label>
            <input type="number" class="form-input" id="sf-kelani-outstanding" min="0" step="0.01" placeholder="0.00">
          </div>
          <div class="form-group">
            <label class="form-label">Notes</label>
            <textarea class="form-textarea" id="sf-kelani-notes" rows="4" placeholder="Any additional notes..."></textarea>
          </div>
          <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:16px;">
            <button class="btn btn-ghost" id="sf-clear-kelani">Clear</button>
            <button class="btn btn-primary btn-lg" id="sf-save-kelani">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              Save Entry
            </button>
          </div>
        </div>
      </div>`;
  }
  const renderKalaniForm = renderKelaniForm;

  // ---------------------------------------------------------------------------
  // Render — Saved Entries
  // ---------------------------------------------------------------------------

  function renderSavedEntries() {
    const currentAgency = state.currentAgency;
    const entries = data.getSalesEntries(currentAgency !== 'all' ? currentAgency : undefined)
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      .slice(0, 50);

    return `
      <div class="card mt-6 anim-fade" id="saved-entries-card">
        <div class="card-header" style="cursor:pointer;" id="saved-entries-toggle">
          <div class="card-title flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Saved Daily Entries (${entries.length})
          </div>
          <div style="display:flex; align-items:center; gap:10px;">
            <button class="btn btn-ghost btn-sm" id="se-export-csv" style="padding:4px 10px; font-size:0.75rem; color:#10B981; border:1px solid rgba(16,185,129,0.3);">
              📊 Export CSV
            </button>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" id="saved-entries-chevron" style="transition:transform 0.3s;transform:rotate(${savedEntriesOpen ? 180 : 0}deg);">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        </div>

        <div id="saved-entries-body" style="display:${savedEntriesOpen ? 'block' : 'none'};">
          ${entries.length === 0
            ? `<div class="empty-state"><div class="empty-state-icon">📋</div><p>No saved entries yet</p></div>`
            : `<div class="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Agency</th>
                      <th>Total Items Sold</th>
                      <th>Gross Sale</th>
                      <th>Discount</th>
                      <th>Net Sale</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${entries.map(e => {
                      const info = utils.getAgencyInfo(e.agency);
                      const t = e.totals || { grossSale: 0, discount: 0, netSale: 0 };
                      let itemTotalQty = 0;
                      if (e.itemQuantities) {
                        itemTotalQty = Object.values(e.itemQuantities).reduce((s, v) => s + (Number(v) || 0), 0);
                      } else if (e.entries && Array.isArray(e.entries)) {
                        e.entries.forEach(cust => {
                          if (cust.products) {
                            itemTotalQty += Object.values(cust.products).reduce((s, v) => s + (Number(v) || 0), 0);
                          }
                        });
                      }
                      return `
                        <tr>
                          <td>${utils.formatDate(e.date)}</td>
                          <td><span class="badge badge-${e.agency}">${info ? info.name : e.agency}</span></td>
                          <td class="text-center font-bold" style="color:var(--primary-light,#818cf8);">${itemTotalQty}</td>
                          <td class="font-mono text-right">${utils.formatCurrency(t.grossSale)}</td>
                          <td class="font-mono text-right">${utils.formatCurrency(t.discount)}</td>
                          <td class="font-mono text-right font-bold">${utils.formatCurrency(t.netSale)}</td>
                          <td>
                            <div class="btn-group">
                              <button class="btn btn-ghost btn-sm btn-icon se-view-btn" data-entry-id="${e.id}" title="View/Edit">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                              </button>
                              <button class="btn btn-danger btn-sm btn-icon se-delete-btn admin-only" data-entry-id="${e.id}" title="Delete">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                              </button>
                            </div>
                          </td>
                        </tr>`;
                    }).join('')}
                  </tbody>
                </table>
              </div>`}
        </div>
      </div>`;
  }

  // ---------------------------------------------------------------------------
  // Main Render
  // ---------------------------------------------------------------------------

  function render(appState) {
    if (!activeTab) activeTab = defaultTab();

    const agencies = agencyTabs();

    return `
      <div id="sales-entry-module">
        <div class="section-header anim-fade">
          <div>
            <h1 class="section-title">Daily Sales Entry</h1>
            <p class="section-subtitle">Record daily total item quantities sold with automatic month-to-date B/F tracking</p>
          </div>
        </div>

        ${renderTabBar(agencies)}

        ${agencies.map(a => {
          if (a.id === 'kelani' || a.id === 'kalani') return renderKelaniForm();
          return renderFullForm(a);
        }).join('')}

        ${renderSavedEntries()}
      </div>`;
  }

  // ---------------------------------------------------------------------------
  // Recalculate totals
  // ---------------------------------------------------------------------------

  function updateBfForDate(agencyId) {
    const dateEl = document.getElementById(`sf-date-${agencyId}`);
    if (!dateEl) return;
    const targetDateStr = dateEl.value || utils.today();

    const { itemBf, financialBf } = getPreviousBfQuantities(agencyId, targetDateStr);

    // Update notice badge
    const noticeEl = document.getElementById(`sf-bf-notice-${agencyId}`);
    if (noticeEl) {
      noticeEl.textContent = targetDateStr.endsWith('-01')
        ? '🗓️ 1st of Month — B/F initialized to 0'
        : '🔄 B/F Total = Yesterday B/F + Today Sold';
    }

    // Update Previous B/F values per item row
    const tbody = document.getElementById(`sf-tbody-${agencyId}`);
    if (tbody) {
      const rows = tbody.querySelectorAll('.sf-item-row');
      rows.forEach(row => {
        const customInput = row.querySelector('.sf-custom-item-name');
        const prodName = customInput ? customInput.value.trim() : row.getAttribute('data-product');
        const prevBfSpan = row.querySelector('.sf-prev-bf-qty');
        const prevVal = Number(itemBf[prodName]) || 0;
        if (prevBfSpan) prevBfSpan.textContent = prevVal;
      });
    }

    // Update financial previous B/F
    const prevBfNetEl = document.getElementById(`sf-bf-net-val-${agencyId}`);
    if (prevBfNetEl) prevBfNetEl.textContent = (financialBf.netSale || 0).toFixed(2);

    recalcTotals(agencyId);
  }

  function recalcTotals(agencyId) {
    const tbody = document.getElementById(`sf-tbody-${agencyId}`);
    if (!tbody) return;

    const rows = tbody.querySelectorAll('.sf-item-row');
    let totalTodayQty = 0;
    let totalPrevBfQty = 0;
    let totalGrandBfQty = 0;

    rows.forEach(row => {
      const todayInput = row.querySelector('.sf-today-qty');
      const prevSpan = row.querySelector('.sf-prev-bf-qty');
      const totalSpan = row.querySelector('.sf-total-bf-qty');

      const todayVal = parseFloat(todayInput?.value) || 0;
      const prevVal = parseFloat(prevSpan?.textContent) || 0;
      const totalVal = todayVal + prevVal;

      if (totalSpan) totalSpan.textContent = totalVal;

      totalTodayQty += todayVal;
      totalPrevBfQty += prevVal;
      totalGrandBfQty += totalVal;
    });

    // Update Item Quantity Totals
    const todayTotalEl = document.getElementById(`sf-item-today-total-${agencyId}`);
    const prevTotalEl = document.getElementById(`sf-item-prev-total-${agencyId}`);
    const grandTotalEl = document.getElementById(`sf-item-grand-total-${agencyId}`);

    if (todayTotalEl) todayTotalEl.textContent = totalTodayQty;
    if (prevTotalEl) prevTotalEl.textContent = totalPrevBfQty;
    if (grandTotalEl) grandTotalEl.textContent = totalGrandBfQty;

    // Financial calculations
    const grossEl = document.getElementById(`sf-gross-${agencyId}`);
    const discEl = document.getElementById(`sf-disc-${agencyId}`);
    const netEl = document.getElementById(`sf-net-${agencyId}`);
    const bfNetEl = document.getElementById(`sf-bf-net-val-${agencyId}`);
    const grandNetEl = document.getElementById(`sf-grand-net-val-${agencyId}`);

    const gross = parseFloat(grossEl?.value) || 0;
    const disc = parseFloat(discEl?.value) || 0;
    const todayNet = gross - disc;
    const bfNet = parseFloat(bfNetEl?.textContent) || 0;
    const grandNet = todayNet + bfNet;

    if (netEl) netEl.textContent = utils.formatCurrency(todayNet);
    if (grandNetEl) grandNetEl.textContent = (grandNet).toFixed(2);
  }

  function recalcFinance(agencyId) {
    const ids = ['cash', 'cheque', 'creditbf', 'chequehand', 'credithand', 'cashhand'];
    let total = 0;
    ids.forEach(key => {
      const el = document.getElementById(`sf-fin-${key}-${agencyId}`);
      if (el) total += parseFloat(el.value) || 0;
    });
    const totalEl = document.getElementById(`sf-fin-total-${agencyId}`);
    if (totalEl) totalEl.textContent = utils.formatCurrency(total);
  }

  // ---------------------------------------------------------------------------
  // Gather form data
  // ---------------------------------------------------------------------------

  function gatherEntry(agencyId) {
    if (agencyId === 'kelani' || agencyId === 'kalani') return gatherKelaniEntry();

    const tbody = document.getElementById(`sf-tbody-${agencyId}`);
    const rows = tbody ? tbody.querySelectorAll('.sf-item-row') : [];

    const itemQuantities = {};
    const itemBfQuantities = {};

    rows.forEach(row => {
      const customInput = row.querySelector('.sf-custom-item-name');
      const prodName = customInput ? customInput.value.trim() : row.getAttribute('data-product');
      const todayVal = parseFloat(row.querySelector('.sf-today-qty')?.value) || 0;
      const prevBfVal = parseFloat(row.querySelector('.sf-prev-bf-qty')?.textContent) || 0;

      if (prodName && (todayVal > 0 || prevBfVal > 0)) {
        itemQuantities[prodName] = todayVal;
        itemBfQuantities[prodName] = todayVal + prevBfVal;
      }
    });

    const gross = parseFloat(document.getElementById(`sf-gross-${agencyId}`)?.value) || 0;
    const disc = parseFloat(document.getElementById(`sf-disc-${agencyId}`)?.value) || 0;
    const net = gross - disc;

    const bfNet = parseFloat(document.getElementById(`sf-bf-net-val-${agencyId}`)?.textContent) || 0;
    const grandNet = parseFloat(document.getElementById(`sf-grand-net-val-${agencyId}`)?.textContent) || (net + bfNet);

    // Build synthetic bill entry for legacy compatibility
    const syntheticEntries = [{
      billNo: 'DAILY-TOTAL',
      customerName: 'Daily Total Summary',
      products: itemQuantities,
      grossSale: gross,
      discount: disc,
      netSale: net
    }];

    const entry = {
      agency: agencyId,
      date: document.getElementById(`sf-date-${agencyId}`)?.value || utils.today(),
      salesRep: document.getElementById(`sf-rep-${agencyId}`)?.value || '',
      agent: document.getElementById(`sf-agent-${agencyId}`)?.value || '',
      driver: document.getElementById(`sf-driver-${agencyId}`)?.value || '',
      vehicleNo: document.getElementById(`sf-vehicle-${agencyId}`)?.value || '',
      km: parseFloat(document.getElementById(`sf-km-${agencyId}`)?.value) || 0,
      itemQuantities,
      itemBfQuantities,
      entries: syntheticEntries,
      totals: { grossSale: gross, discount: disc, netSale: net },
      bfTotals: { grossSale: 0, discount: 0, netSale: bfNet },
      grandTotals: { grossSale: gross, discount: disc, netSale: grandNet },
      finance: {
        cashDeposited: parseFloat(document.getElementById(`sf-fin-cash-${agencyId}`)?.value) || 0,
        chequeDeposited: parseFloat(document.getElementById(`sf-fin-cheque-${agencyId}`)?.value) || 0,
        creditBillsBF: parseFloat(document.getElementById(`sf-fin-creditbf-${agencyId}`)?.value) || 0,
        chequeInHand: parseFloat(document.getElementById(`sf-fin-chequehand-${agencyId}`)?.value) || 0,
        creditBillsToDate: parseFloat(document.getElementById(`sf-fin-credithand-${agencyId}`)?.value) || 0,
        cashInHand: parseFloat(document.getElementById(`sf-fin-cashhand-${agencyId}`)?.value) || 0,
      }
    };

    if (editingEntryId) entry.id = editingEntryId;
    return entry;
  }

  function gatherKelaniEntry() {
    const dateEl = document.getElementById('sf-date-kelani') || document.getElementById('sf-date-kalani');
    const salesEl = document.getElementById('sf-kelani-sales') || document.getElementById('sf-kalani-sales');
    const outEl = document.getElementById('sf-kelani-outstanding') || document.getElementById('sf-kalani-outstanding');
    const notesEl = document.getElementById('sf-kelani-notes') || document.getElementById('sf-kalani-notes');

    const salesVal = parseFloat(salesEl?.value) || 0;
    const outVal = parseFloat(outEl?.value) || 0;

    const entry = {
      agency: 'kelani',
      date: dateEl?.value || utils.today(),
      salesRep: '',
      agent: '',
      driver: '',
      vehicleNo: '',
      km: 0,
      entries: [{
        customerName: 'Daily Summary',
        products: {},
        grossSale: salesVal,
        discount: 0,
        netSale: salesVal,
      }],
      totals: { grossSale: salesVal, discount: 0, netSale: salesVal },
      bfTotals: { grossSale: 0, discount: 0, netSale: 0 },
      grandTotals: { grossSale: salesVal, discount: 0, netSale: salesVal },
      finance: {
        cashDeposited: 0, chequeDeposited: 0, creditBillsBF: 0, chequeInHand: 0, creditBillsToDate: outVal, cashInHand: 0,
      },
      notes: notesEl?.value || ''
    };

    if (editingEntryId) entry.id = editingEntryId;
    return entry;
  }
  const gatherKalaniEntry = gatherKelaniEntry;

  // ---------------------------------------------------------------------------
  // Load entry into form
  // ---------------------------------------------------------------------------

  function loadEntry(entry) {
    const agencyId = entry.agency;
    editingEntryId = entry.id;

    activeTab = agencyId;
    AgencyHub.navigate('sales'); // re-render

    setTimeout(() => {
      if (agencyId === 'kelani' || agencyId === 'kalani') {
        const dateEl = document.getElementById('sf-date-kelani') || document.getElementById('sf-date-kalani');
        if (dateEl) dateEl.value = entry.date;
        const salesEl = document.getElementById('sf-kelani-sales') || document.getElementById('sf-kalani-sales');
        if (salesEl) salesEl.value = entry.totals?.grossSale || 0;
        const outEl = document.getElementById('sf-kelani-outstanding') || document.getElementById('sf-kalani-outstanding');
        if (outEl) outEl.value = entry.finance?.creditBillsToDate || 0;
        const notesEl = document.getElementById('sf-kelani-notes') || document.getElementById('sf-kalani-notes');
        if (notesEl) notesEl.value = entry.notes || '';
        return;
      }

      // Header
      const dateEl = document.getElementById(`sf-date-${agencyId}`);
      if (dateEl) dateEl.value = entry.date;
      const repEl = document.getElementById(`sf-rep-${agencyId}`);
      if (repEl) repEl.value = entry.salesRep || '';
      const agentEl = document.getElementById(`sf-agent-${agencyId}`);
      if (agentEl) agentEl.value = entry.agent || '';
      const driverEl = document.getElementById(`sf-driver-${agencyId}`);
      if (driverEl) driverEl.value = entry.driver || '';
      const vehicleEl = document.getElementById(`sf-vehicle-${agencyId}`);
      if (vehicleEl) vehicleEl.value = entry.vehicleNo || '';
      const kmEl = document.getElementById(`sf-km-${agencyId}`);
      if (kmEl) kmEl.value = entry.km || '';

      // Financials
      const grossEl = document.getElementById(`sf-gross-${agencyId}`);
      if (grossEl) grossEl.value = entry.totals?.grossSale || 0;
      const discEl = document.getElementById(`sf-disc-${agencyId}`);
      if (discEl) discEl.value = entry.totals?.discount || 0;

      // Quantities
      const itemQtys = entry.itemQuantities || {};
      if (Object.keys(itemQtys).length === 0 && entry.entries) {
        // Fallback extract from customer entries
        entry.entries.forEach(cust => {
          if (cust.products) {
            Object.entries(cust.products).forEach(([pName, q]) => {
              itemQtys[pName] = (itemQtys[pName] || 0) + (Number(q) || 0);
            });
          }
        });
      }

      const tbody = document.getElementById(`sf-tbody-${agencyId}`);
      if (tbody) {
        const rows = tbody.querySelectorAll('.sf-item-row');
        rows.forEach(row => {
          const prodName = row.getAttribute('data-product');
          const input = row.querySelector('.sf-today-qty');
          if (input && itemQtys[prodName] != null) {
            input.value = itemQtys[prodName];
          }
        });
      }

      // Finance
      if (entry.finance) {
        const fin = entry.finance;
        const setFin = (key, val) => {
          const el = document.getElementById(`sf-fin-${key}-${agencyId}`);
          if (el && val != null) el.value = val;
        };
        setFin('cash', fin.cashDeposited);
        setFin('cheque', fin.chequeDeposited);
        setFin('creditbf', fin.creditBillsBF);
        setFin('chequehand', fin.chequeInHand);
        setFin('credithand', fin.creditBillsToDate);
        setFin('cashhand', fin.cashInHand);
      }

      updateBfForDate(agencyId);
      recalcFinance(agencyId);
    }, 100);
  }

  // ---------------------------------------------------------------------------
  // Clear form
  // ---------------------------------------------------------------------------

  function clearForm(agencyId) {
    editingEntryId = null;
    AgencyHub.navigate('sales');
  }

  // ---------------------------------------------------------------------------
  // Init — Event Listeners
  // ---------------------------------------------------------------------------

  function init() {
    const container = document.getElementById('sales-entry-module');
    if (!container) return;

    // Initial calculation on load
    ['bathipooja', 'domie'].forEach(agencyId => {
      updateBfForDate(agencyId);
    });

    // Tab switching
    utils.delegate(container, '.tab[data-tab-agency]', 'click', function (e, target) {
      const newTab = target.getAttribute('data-tab-agency');
      activeTab = newTab;
      const forms = container.querySelectorAll('[id^="sales-form-"]');
      forms.forEach(f => f.style.display = 'none');
      const active = document.getElementById(`sales-form-${newTab}`);
      if (active) active.style.display = 'block';
      container.querySelectorAll('.tab[data-tab-agency]').forEach(t => t.classList.remove('active'));
      target.classList.add('active');
    });

    // Date change listener -> recalculates B/F quantities
    utils.delegate(container, '.sf-date-input', 'change', function (e, target) {
      const agencyId = target.getAttribute('data-agency');
      if (agencyId) updateBfForDate(agencyId);
    });

    // Recalculate totals on input changes
    const debouncedRecalc = {};
    ['bathipooja', 'domie'].forEach(agencyId => {
      debouncedRecalc[agencyId] = utils.debounce(() => recalcTotals(agencyId), 150);
    });

    utils.delegate(container, '.sf-today-qty, .sf-financial-gross, .sf-financial-disc', 'input', function (e, target) {
      const agencyId = target.getAttribute('data-agency') || target.closest('[id^="sales-form-"]')?.id.replace('sales-form-', '');
      if (agencyId && debouncedRecalc[agencyId]) {
        debouncedRecalc[agencyId]();
      }
    });

    // Finance input → recalculate
    utils.delegate(container, '.sf-finance-input', 'input', function (e, target) {
      const id = target.id;
      const parts = id.split('-');
      const agencyId = parts[parts.length - 1];
      recalcFinance(agencyId);
    });

    // Add Custom Extra Product Row
    utils.delegate(container, '[id^="sf-add-custom-item-"]', 'click', function (e, target) {
      const agencyId = target.id.replace('sf-add-custom-item-', '');
      const tbody = document.getElementById(`sf-tbody-${agencyId}`);
      if (tbody) {
        const nextIdx = tbody.querySelectorAll('.sf-item-row').length;
        tbody.insertAdjacentHTML('beforeend', renderProductRow(agencyId, '', nextIdx, '', 0, true));
      }
    });

    // Remove Custom Extra Product Row
    utils.delegate(container, '.sf-remove-item-btn', 'click', function (e, target) {
      const row = target.closest('.sf-item-row');
      const agencyId = row ? row.getAttribute('data-agency') : null;
      if (row) {
        row.remove();
        if (agencyId) recalcTotals(agencyId);
      }
    });

    // Save full form
    utils.delegate(container, '[id^="sf-save-"]:not(#sf-save-kelani):not(#sf-save-kalani)', 'click', function (e, target) {
      const agencyId = target.id.replace('sf-save-', '');
      const entry = gatherEntry(agencyId);
      const totalSold = Object.values(entry.itemQuantities || {}).reduce((s, v) => s + v, 0);

      if (totalSold === 0 && !entry.totals.grossSale) {
        utils.toast('Please enter daily sold quantities or gross sale amount', 'warning');
        return;
      }

      data.saveSalesEntry(entry);
      utils.toast('Daily sales entry saved successfully!', 'success');
      editingEntryId = null;
      AgencyHub.navigate('sales');
    });

    // Save Kelani
    const kelaniSaveBtn = document.getElementById('sf-save-kelani') || document.getElementById('sf-save-kalani');
    if (kelaniSaveBtn) {
      kelaniSaveBtn.addEventListener('click', function () {
        const entry = gatherKelaniEntry();
        if (!entry.totals.grossSale) {
          utils.toast('Please enter the daily sales total', 'warning');
          return;
        }
        data.saveSalesEntry(entry);
        utils.toast('Kelani entry saved!', 'success');
        editingEntryId = null;
        AgencyHub.navigate('sales');
      });
    }

    // Clear buttons
    utils.delegate(container, '[id^="sf-clear-"]', 'click', function (e, target) {
      const agencyId = target.id.replace('sf-clear-', '');
      clearForm(agencyId);
    });

    // Toggle saved entries
    const toggle = document.getElementById('saved-entries-toggle');
    if (toggle) {
      toggle.addEventListener('click', () => {
        savedEntriesOpen = !savedEntriesOpen;
        const body = document.getElementById('saved-entries-body');
        const chevron = document.getElementById('saved-entries-chevron');
        if (body) body.style.display = savedEntriesOpen ? 'block' : 'none';
        if (chevron) chevron.style.transform = `rotate(${savedEntriesOpen ? 180 : 0}deg)`;
      });
    }

    // Export CSV
    const csvExportBtn = document.getElementById('se-export-csv');
    if (csvExportBtn) {
      csvExportBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const entries = data.getSalesEntries(state.currentAgency !== 'all' ? state.currentAgency : undefined);
        const headers = ['Date', 'Agency', 'Total Items Sold', 'Gross Sale', 'Discount', 'Net Sale', 'Cash Deposited', 'Cheque Deposited', 'Credit Bills Issued', 'Created At'];
        const rows = entries.map(e => {
          let itemQty = 0;
          if (e.itemQuantities) {
            itemQty = Object.values(e.itemQuantities).reduce((s, v) => s + (Number(v) || 0), 0);
          }
          return [
            e.date || '—',
            e.agency || '—',
            itemQty,
            (Number(e.totals?.grossSale) || 0).toFixed(2),
            (Number(e.totals?.discount) || 0).toFixed(2),
            (Number(e.totals?.netSale) || 0).toFixed(2),
            (Number(e.finance?.cashDeposited) || 0).toFixed(2),
            (Number(e.finance?.chequeDeposited) || 0).toFixed(2),
            (Number(e.finance?.creditBillsToDate) || 0).toFixed(2),
            e.createdAt ? e.createdAt.split('T')[0] : '—'
          ];
        });
        utils.exportToCSV(`Sales_Entries_Report_${utils.today()}`, headers, rows);
      });
    }

    // View entry
    utils.delegate(container, '.se-view-btn', 'click', function (e, target) {
      const id = target.getAttribute('data-entry-id');
      const entries = data.getSalesEntries();
      const entry = entries.find(e => e.id === id);
      if (entry) {
        savedEntriesOpen = false;
        loadEntry(entry);
      }
    });

    // Delete entry
    utils.delegate(container, '.se-delete-btn', 'click', async function (e, target) {
      if (!AgencyHub.isAdmin()) { AgencyHub.utils.toast('View-only access', 'warning'); return; }
      const id = target.getAttribute('data-entry-id');
      const confirmed = await utils.confirm('Delete Entry', 'Are you sure you want to delete this sales entry? This cannot be undone.');
      if (confirmed) {
        data.deleteSalesEntry(id);
        utils.toast('Entry deleted', 'success');
        AgencyHub.navigate('sales');
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Register
  // ---------------------------------------------------------------------------

  AgencyHub.registerModule('salesEntry', { render, init });
})();
