// =============================================================================
// AgencyHub — Cheque Management Module
// =============================================================================

(function () {
  'use strict';

  const { data, utils, state, AGENCIES } = AgencyHub;

  // ---------------------------------------------------------------------------
  // Module State & Filters
  // ---------------------------------------------------------------------------
  const filters = {
    search: '',
    agency: 'all',
    type: 'all',
    status: 'all'
  };

  // ---------------------------------------------------------------------------
  // Filtering & Calculations
  // ---------------------------------------------------------------------------
  function getFilteredCheques() {
    const agencyFilter = state.currentAgency !== 'all' ? state.currentAgency : filters.agency;
    return data.getCheques({
      agency: agencyFilter,
      type: filters.type,
      status: filters.status,
      search: filters.search
    });
  }

  function getStats() {
    const agencyFilter = state.currentAgency !== 'all' ? state.currentAgency : filters.agency;
    
    // Retrieve all cheques matching agency (unfiltered by other filter inputs)
    const cheques = data.getCheques({ agency: agencyFilter });
    
    let pendingCount = 0, pendingSum = 0;
    let realizedCount = 0, realizedSum = 0;
    let bouncedCount = 0, bouncedSum = 0;
    let returnedCount = 0, returnedSum = 0;

    cheques.forEach(c => {
      const amt = Number(c.amount) || 0;
      if (c.status === 'realized') {
        realizedCount++;
        realizedSum += amt;
      } else if (c.status === 'bounced') {
        bouncedCount++;
        bouncedSum += amt;
      } else if (c.status === 'returned') {
        returnedCount++;
        returnedSum += amt;
      } else {
        pendingCount++;
        pendingSum += amt;
      }
    });

    return {
      pendingCount, pendingSum,
      realizedCount, realizedSum,
      bouncedCount, bouncedSum,
      returnedCount, returnedSum,
      totalReturnedCount: bouncedCount + returnedCount,
      totalReturnedSum: bouncedSum + returnedSum
    };
  }

  // ---------------------------------------------------------------------------
  // Render Helpers
  // ---------------------------------------------------------------------------
  function renderStats() {
    const s = getStats();
    return `
      <div class="stats-grid anim-fade">
        <div class="stat-card">
          <div class="card-header">
            <span class="card-title text-warning">Pending Cheques</span>
            <span style="font-size:1.5rem;">⏳</span>
          </div>
          <div class="card-value text-warning" style="font-variant-numeric:tabular-nums;">
            ${utils.formatCurrency(s.pendingSum)}
          </div>
          <div class="card-subtitle">${s.pendingCount} cheque${s.pendingCount === 1 ? '' : 's'} pending clearance</div>
        </div>

        <div class="stat-card">
          <div class="card-header">
            <span class="card-title text-success">Realized Cheques</span>
            <span style="font-size:1.5rem;">🏛️</span>
          </div>
          <div class="card-value text-success" style="font-variant-numeric:tabular-nums;">
            ${utils.formatCurrency(s.realizedSum)}
          </div>
          <div class="card-subtitle">${s.realizedCount} cheque${s.realizedCount === 1 ? '' : 's'} realized successfully</div>
        </div>

        <div class="stat-card">
          <div class="card-header">
            <span class="card-title text-danger">Returned / Bounced</span>
            <span style="font-size:1.5rem;">🚨</span>
          </div>
          <div class="card-value text-danger" style="font-variant-numeric:tabular-nums;">
            ${utils.formatCurrency(s.totalReturnedSum)}
          </div>
          <div class="card-subtitle">${s.totalReturnedCount} cheque${s.totalReturnedCount === 1 ? '' : 's'} returned</div>
        </div>
      </div>`;
  }

  function renderFilterBar() {
    const showAgencyFilter = state.currentAgency === 'all';
    return `
      <div class="filter-bar anim-fade" style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin-bottom:20px;">
        <div style="display:flex;gap:8px;flex:1;min-width:280px;">
          <input type="text" class="form-input search-input" id="ch-search"
                 placeholder="🔍 Search Cheque No, Customer, Bank..."
                 value="${filters.search}" style="flex:1;">
        </div>

        ${showAgencyFilter ? `
          <select class="form-select" id="ch-agency-filter" style="min-width:150px;">
            <option value="all" ${filters.agency === 'all' ? 'selected' : ''}>All Agencies</option>
            <option value="bathipooja" ${filters.agency === 'bathipooja' ? 'selected' : ''}>Bathipooja</option>
            <option value="domie" ${filters.agency === 'domie' ? 'selected' : ''}>Domie</option>
            <option value="kelani" ${filters.agency === 'kelani' || filters.agency === 'kalani' ? 'selected' : ''}>Kelani</option>
          </select>
        ` : ''}

        <select class="form-select" id="ch-type-filter" style="min-width:145px;">
          <option value="all" ${filters.type === 'all' ? 'selected' : ''}>All Cheque Types</option>
          <option value="day" ${filters.type === 'day' ? 'selected' : ''}>Day Cheque (Daily Sales)</option>
          <option value="credit" ${filters.type === 'credit' ? 'selected' : ''}>Credit Cheque (Bill Payment)</option>
        </select>

        <select class="form-select" id="ch-status-filter" style="min-width:130px;">
          <option value="all" ${filters.status === 'all' ? 'selected' : ''}>All Status</option>
          <option value="pending" ${filters.status === 'pending' ? 'selected' : ''}>Pending</option>
          <option value="realized" ${filters.status === 'realized' ? 'selected' : ''}>Realized</option>
          <option value="bounced" ${filters.status === 'bounced' ? 'selected' : ''}>Bounced</option>
          <option value="returned" ${filters.status === 'returned' ? 'selected' : ''}>Returned</option>
        </select>

        <button class="btn btn-primary" id="ch-record-btn" style="display:flex;align-items:center;gap:6px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Record Cheque
        </button>
      </div>`;
  }

  function renderChequeRow(c) {
    const info = utils.getAgencyInfo(c.agency);
    
    // Determine status badge classes
    let statusClass = 'badge-warning';
    if (c.status === 'realized') statusClass = 'badge-success';
    if (c.status === 'bounced' || c.status === 'returned') statusClass = 'badge-danger';

    // Format type label
    const typeLabel = c.type === 'credit' 
      ? '<span style="color:var(--primary,#6366f1); font-weight:600;">💳 Credit Cheque</span>' 
      : '<span style="color:var(--info,#06b6d4); font-weight:600;">☀️ Day Cheque</span>';

    return `
      <tr class="anim-slide-up" data-cheque-id="${c.id}" style="border-bottom:1px solid var(--glass-border);">
        <td class="font-mono text-center" style="font-size:0.9rem; font-weight:600; color:rgba(255,255,255,0.85)">
          ${c.chequeNo || '—'}
        </td>
        <td style="text-align:left;">
          <div style="font-weight:700; color:rgba(255,255,255,0.95); font-size:0.92rem;">${c.customerName || '—'}</div>
          <div style="font-size:0.75rem; color:rgba(255,255,255,0.4); margin-top:2px;">🏦 ${c.bank || 'Unknown Bank'}</div>
        </td>
        <td style="text-align:left;">
          <span class="badge badge-${c.agency}" style="font-size:0.75rem; padding: 2px 8px;">${info ? info.name : c.agency}</span>
        </td>
        <td style="text-align:left; font-size:0.85rem; color:rgba(255,255,255,0.75);">
          <div>Date: ${utils.formatDate(c.chequeDate)}</div>
          <div style="font-size:0.72rem; color:rgba(255,255,255,0.38); margin-top:2px;">Rec: ${utils.formatDate(c.entryDate)}</div>
        </td>
        <td style="text-align:left; font-size:0.85rem;">
          ${typeLabel}
          ${c.billId ? `<div style="font-size:0.72rem; color:rgba(255,255,255,0.4); margin-top:2px;">🔗 Credit Bill Linked</div>` : ''}
        </td>
        <td style="text-align:left;">
          <span class="badge ${statusClass}" style="font-size:0.75rem; padding: 2px 8px; text-transform: capitalize;">${c.status}</span>
        </td>
        <td class="text-right font-mono font-bold" style="font-size:0.95rem; color:rgba(255,255,255,0.95);">
          ${utils.formatCurrency(c.amount)}
        </td>
        <td style="text-align:center;">
          <div style="display:flex; gap:6px; justify-content:center; align-items:center;">
            ${c.status !== 'realized' ? `
              <button class="btn btn-success btn-sm ch-action-realize" data-cheque-id="${c.id}" title="Mark as Realized" style="padding:4px 8px; font-size:0.75rem; height:26px; min-width:unset;">
                Realize
              </button>
            ` : ''}
            ${c.status === 'pending' ? `
              <button class="btn btn-warning btn-sm ch-action-bounce" data-cheque-id="${c.id}" title="Mark as Returned / Bounced" style="padding:4px 8px; font-size:0.75rem; height:26px; min-width:unset; color:#000;">
                Return
              </button>
            ` : ''}
            <button class="btn btn-ghost btn-sm btn-icon ch-action-edit" data-cheque-id="${c.id}" title="Edit" style="padding:4px; width:26px; height:26px; min-width:unset; display:flex; align-items:center; justify-content:center;">
              ✏️
            </button>
            <button class="btn btn-danger btn-sm btn-icon ch-action-delete admin-only" data-cheque-id="${c.id}" title="Delete" style="padding:4px; width:26px; height:26px; min-width:unset; display:flex; align-items:center; justify-content:center;">
              🗑️
            </button>
          </div>
        </td>
      </tr>`;
  }

  function renderChequesTable(cheques) {
    if (cheques.length === 0) {
      return `
        <div class="empty-state anim-fade">
          <div class="empty-state-icon">🎟️</div>
          <h3>No Cheques Found</h3>
          <p>No cheque transactions match your selection. Click "Record Cheque" to add one.</p>
        </div>`;
    }

    return `
      <div class="card p-0 overflow-hidden anim-slide-up" style="padding:0; overflow:hidden;">
        <div class="table-wrapper" style="overflow-x:auto;">
          <table style="width:100%; border-collapse:collapse; min-width:900px;">
            <thead>
              <tr style="border-bottom:2px solid var(--glass-border); background:rgba(255,255,255,0.02)">
                <th style="width:100px; text-align:center; padding:12px 8px;">Cheque No</th>
                <th style="text-align:left; padding:12px 12px;">Customer & Bank</th>
                <th style="width:100px; text-align:left; padding:12px 8px;">Agency</th>
                <th style="width:150px; text-align:left; padding:12px 8px;">Cheque Dates</th>
                <th style="width:130px; text-align:left; padding:12px 8px;">Type</th>
                <th style="width:100px; text-align:left; padding:12px 8px;">Status</th>
                <th style="width:130px; text-align:right; padding:12px 8px;">Amount</th>
                <th style="width:170px; text-align:center; padding:12px 8px;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${cheques.map(c => renderChequeRow(c)).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  // ---------------------------------------------------------------------------
  // Main Render View
  // ---------------------------------------------------------------------------
  function render(appState) {
    const cheques = getFilteredCheques();
    
    return `
      <div id="cheque-management-module">
        <div class="section-header anim-fade">
          <div>
            <h1 class="section-title">Cheque Book</h1>
            <p class="section-subtitle">Track realized, pending, and bounced cheques across agencies</p>
          </div>
        </div>

        ${renderStats()}
        ${renderFilterBar()}
        ${renderChequesTable(cheques)}
      </div>`;
  }

  // ---------------------------------------------------------------------------
  // Modals & Forms
  // ---------------------------------------------------------------------------
  function showChequeModal(cheque = null) {
    const isEdit = !!cheque;
    const title = isEdit ? 'Edit Cheque Record' : 'Record New Cheque';
    const activeAgency = state.currentAgency !== 'all' ? state.currentAgency : 'bathipooja';
    
    // Outstanding bills list for linking
    const outstandingBills = data.getCreditBills().filter(b => b.status !== 'collected');

    // Default values if creating new
    const c = cheque || {
      id: '',
      type: 'day',
      agency: activeAgency,
      billId: '',
      customerName: '',
      chequeNo: '',
      bank: '',
      amount: '',
      chequeDate: utils.today(),
      entryDate: utils.today(),
      status: 'pending',
      notes: ''
    };

    const body = `
      <div class="form-group">
        <label class="form-label">Cheque Type *</label>
        <div style="display:flex; gap:16px; margin: 8px 0;">
          <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
            <input type="radio" name="ch-modal-type" value="day" ${c.type === 'day' ? 'checked' : ''} ${isEdit ? 'disabled' : ''}>
            <span>Day Cheque (Daily Sales)</span>
          </label>
          <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
            <input type="radio" name="ch-modal-type" value="credit" ${c.type === 'credit' ? 'checked' : ''} ${isEdit ? 'disabled' : ''}>
            <span>Credit Cheque (Bill Payment)</span>
          </label>
        </div>
      </div>

      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">Agency *</label>
          <select class="form-select" id="ch-modal-agency" ${isEdit ? 'disabled' : ''}>
            <option value="bathipooja" ${c.agency === 'bathipooja' ? 'selected' : ''}>Bathipooja</option>
            <option value="domie" ${c.agency === 'domie' ? 'selected' : ''}>Domie</option>
            <option value="kelani" ${c.agency === 'kelani' || c.agency === 'kalani' ? 'selected' : ''}>Kelani</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <select class="form-select" id="ch-modal-status">
            <option value="pending" ${c.status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="realized" ${c.status === 'realized' ? 'selected' : ''}>Realized</option>
            <option value="bounced" ${c.status === 'bounced' ? 'selected' : ''}>Bounced</option>
          </select>
        </div>
      </div>

      <!-- Credit Bill Link Selection (Visible only for Credit Cheque) -->
      <div class="form-group ${c.type === 'credit' ? '' : 'hidden'}" id="ch-modal-bill-link-group">
        <label class="form-label">Link to outstanding Credit Bill</label>
        <select class="form-select" id="ch-modal-bill-link">
          <option value="">-- Select Bill (Optional) --</option>
          ${outstandingBills.map(b => {
            const rem = b.amount - (b.paidAmount || 0);
            const selectAttr = c.billId === b.id ? 'selected' : '';
            return `
              <option value="${b.id}" data-agency="${b.agency}" data-customer="${b.customerName}" data-remaining="${rem}" ${selectAttr}>
                [${b.agency.toUpperCase()}] ${b.customerName} - Bill #${b.billNo || 'N/A'} (Bal: ${utils.formatCurrency(rem)})
              </option>`;
          }).join('')}
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Customer Name *</label>
        <input type="text" class="form-input" id="ch-modal-customer" placeholder="Enter customer name" value="${c.customerName}">
      </div>

      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">Cheque Number *</label>
          <input type="text" class="form-input" id="ch-modal-cheque-no" placeholder="e.g. 102938" value="${c.chequeNo}">
        </div>
        <div class="form-group">
          <label class="form-label">Bank / Branch *</label>
          <input type="text" class="form-input" id="ch-modal-bank" placeholder="e.g. Sampath Bank" value="${c.bank}">
        </div>
      </div>

      <div class="grid-3">
        <div class="form-group">
          <label class="form-label">Amount (Rs.) *</label>
          <input type="number" class="form-input" id="ch-modal-amount" placeholder="0.00" min="0.01" step="0.01" value="${c.amount}">
        </div>
        <div class="form-group">
          <label class="form-label">Cheque Date *</label>
          <input type="date" class="form-input" id="ch-modal-cheque-date" value="${c.chequeDate}">
        </div>
        <div class="form-group">
          <label class="form-label">Entry Date</label>
          <input type="date" class="form-input" id="ch-modal-entry-date" value="${c.entryDate}">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Notes</label>
        <textarea class="form-textarea" id="ch-modal-notes" rows="2" placeholder="Optional notes...">${c.notes || ''}</textarea>
      </div>`;

    const footer = `
      <button class="btn btn-ghost" onclick="AgencyHub.utils.closeModal()">Cancel</button>
      <button class="btn btn-primary" id="ch-modal-save">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
        Save Record
      </button>`;

    utils.showModal(title, body, footer, {
      size: 'md',
      onInit: () => {
        const modalSave = document.getElementById('ch-modal-save');
        const agencySelect = document.getElementById('ch-modal-agency');
        const billLinkGroup = document.getElementById('ch-modal-bill-link-group');
        const billLinkSelect = document.getElementById('ch-modal-bill-link');
        const customerInput = document.getElementById('ch-modal-customer');
        const amountInput = document.getElementById('ch-modal-amount');
        const radioTypes = document.getElementsByName('ch-modal-type');

        // Toggle Linked Bill field & adjust choices based on Agency Selection
        function updateBillLinkDropdown() {
          const selectedType = Array.from(radioTypes).find(r => r.checked)?.value;
          const selectedAgency = agencySelect.value;

          if (selectedType === 'credit') {
            billLinkGroup.classList.remove('hidden');
            // Filter option items by selected agency
            Array.from(billLinkSelect.options).forEach((opt, idx) => {
              if (idx === 0) return; // Skip default
              const agency = opt.getAttribute('data-agency');
              if (agency === selectedAgency) {
                opt.style.display = 'block';
              } else {
                opt.style.display = 'none';
              }
            });
          } else {
            billLinkGroup.classList.add('hidden');
            billLinkSelect.value = '';
          }
        }

        // Attach listeners for type change
        Array.from(radioTypes).forEach(r => {
          r.addEventListener('change', updateBillLinkDropdown);
        });

        // Attach listener for agency change
        agencySelect.addEventListener('change', () => {
          // Clear bill link when switching agency to prevent cross-agency link mismatch
          billLinkSelect.value = '';
          updateBillLinkDropdown();
        });

        // Autocomplete on Bill Selection
        billLinkSelect.addEventListener('change', () => {
          const opt = billLinkSelect.options[billLinkSelect.selectedIndex];
          if (opt && opt.value !== '') {
            const customer = opt.getAttribute('data-customer');
            const remaining = opt.getAttribute('data-remaining');
            
            customerInput.value = customer;
            amountInput.value = parseFloat(remaining) || '';
          }
        });

        // Run once initially to set up correct visible options
        updateBillLinkDropdown();

        // Submit form
        modalSave.addEventListener('click', () => {

          const type = Array.from(radioTypes).find(r => r.checked)?.value || 'day';
          const agency = agencySelect.value;
          const customer = customerInput.value.trim();
          const chequeNo = document.getElementById('ch-modal-cheque-no').value.trim();
          const bank = document.getElementById('ch-modal-bank').value.trim();
          const amount = parseFloat(amountInput.value);
          const chequeDate = document.getElementById('ch-modal-cheque-date').value;
          const entryDate = document.getElementById('ch-modal-entry-date').value || utils.today();
          const status = document.getElementById('ch-modal-status').value;
          const notes = document.getElementById('ch-modal-notes').value.trim();
          const billId = billLinkSelect.value;

          if (!customer) { utils.toast('Customer name is required', 'warning'); return; }
          if (!chequeNo) { utils.toast('Cheque number is required', 'warning'); return; }
          if (!bank) { utils.toast('Bank / Branch is required', 'warning'); return; }
          if (!amount || amount <= 0) { utils.toast('Valid amount is required', 'warning'); return; }
          if (!chequeDate) { utils.toast('Cheque date is required', 'warning'); return; }

          const chequeData = {
            id: c.id, // Keeps original ID if editing
            type,
            agency,
            customerName: customer,
            chequeNo,
            bank,
            amount,
            chequeDate,
            entryDate,
            status,
            notes,
            billId: type === 'credit' ? billId : ''
          };

          data.saveCheque(chequeData);
          utils.toast(isEdit ? 'Cheque updated successfully!' : 'Cheque recorded successfully!', 'success');
          utils.closeModal();
          // Reload the page
          AgencyHub.navigate(state.currentPage);
        });
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Event Bindings / Lifecycle
  // ---------------------------------------------------------------------------
  function init() {
    const chSearch = document.getElementById('ch-search');
    const chAgencyFilter = document.getElementById('ch-agency-filter');
    const chTypeFilter = document.getElementById('ch-type-filter');
    const chStatusFilter = document.getElementById('ch-status-filter');
    const chRecordBtn = document.getElementById('ch-record-btn');

    // Debounced search typing
    if (chSearch) {
      chSearch.addEventListener('input', utils.debounce((e) => {
        filters.search = e.target.value.trim();
        AgencyHub.navigate(state.currentPage);
      }, 250));
    }

    // Filter selectors
    if (chAgencyFilter) {
      chAgencyFilter.addEventListener('change', (e) => {
        filters.agency = e.target.value;
        AgencyHub.navigate(state.currentPage);
      });
    }
    if (chTypeFilter) {
      chTypeFilter.addEventListener('change', (e) => {
        filters.type = e.target.value;
        AgencyHub.navigate(state.currentPage);
      });
    }
    if (chStatusFilter) {
      chStatusFilter.addEventListener('change', (e) => {
        filters.status = e.target.value;
        AgencyHub.navigate(state.currentPage);
      });
    }

    // Open Record Cheque Modal
    if (chRecordBtn) {
      chRecordBtn.addEventListener('click', () => {
        showChequeModal();
      });
    }

    // Table Actions Delegation
    utils.delegate(document.body, '.ch-action-realize', 'click', (e, btn) => {
      const chequeId = btn.dataset.chequeId;
      const chs = data.getCheques();
      const ch = chs.find(item => item.id === chequeId);
      if (ch) {
        ch.status = 'realized';
        data.saveCheque(ch);
        utils.toast('Cheque marked as Realized!', 'success');
        AgencyHub.navigate(state.currentPage);
      }
    });

    utils.delegate(document.body, '.ch-action-bounce', 'click', async (e, btn) => {
      const chequeId = btn.dataset.chequeId;
      const chs = data.getCheques();
      const ch = chs.find(item => item.id === chequeId);
      if (ch) {
        const confirmBounce = await utils.confirm(
          'Confirm Cheque Bounce',
          `Are you sure you want to mark Cheque #${ch.chequeNo} as Bounced? This will reverse any payment applied to the outstanding bill.`
        );
        if (confirmBounce) {
          ch.status = 'bounced';
          data.saveCheque(ch);
          utils.toast('Cheque marked as Bounced. Linked bill payment reversed.', 'warning');
          AgencyHub.navigate(state.currentPage);
        }
      }
    });

    utils.delegate(document.body, '.ch-action-edit', 'click', (e, btn) => {

      const chequeId = btn.dataset.chequeId;
      const chs = data.getCheques();
      const ch = chs.find(item => item.id === chequeId);
      if (ch) {
        showChequeModal(ch);
      }
    });

    utils.delegate(document.body, '.ch-action-delete', 'click', async (e, btn) => {
      if (!AgencyHub.isAdmin()) { AgencyHub.utils.toast('View-only access', 'warning'); return; }
      const chequeId = btn.dataset.chequeId;
      const chs = data.getCheques();
      const ch = chs.find(item => item.id === chequeId);
      if (ch) {
        const confirmDelete = await utils.confirm(
          'Delete Cheque Record',
          `Are you sure you want to delete Cheque #${ch.chequeNo}? This action is permanent and will reverse any linked payments.`
        );
        if (confirmDelete) {
          data.deleteCheque(chequeId);
          utils.toast('Cheque record deleted.', 'success');
          AgencyHub.navigate(state.currentPage);
        }
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Register Module
  // ---------------------------------------------------------------------------
  AgencyHub.registerModule('cheques', { render, init });
})();
