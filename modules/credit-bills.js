// =============================================================================
// AgencyHub — Credit Bills Management Module
// =============================================================================
(function () {
  'use strict';

  const { data, utils, state, AGENCIES } = AgencyHub;

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  let filters = {
    search: '',
    searchName: '',
    searchBillNo: '',
    searchDate: '',
    agency: 'all',
    status: 'all'
  };

  let advSearchOpen = false;
  let lastFocusedId = null;

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function getFilteredBills() {
    const opts = {};
    if (filters.agency !== 'all') opts.agency = filters.agency;
    if (filters.status !== 'all' && filters.status !== 'overdue') opts.status = filters.status;
    if (filters.search) opts.search = filters.search;
    if (filters.status === 'overdue') opts.overdue = true;

    // Respect global agency filter
    if (state.currentAgency !== 'all') opts.agency = state.currentAgency;

    let bills = data.getCreditBills(opts);

    // Apply advanced search filters
    if (filters.searchName) {
      const q = filters.searchName.toLowerCase();
      bills = bills.filter(b => (b.customerName || '').toLowerCase().includes(q));
    }
    if (filters.searchBillNo) {
      const q = filters.searchBillNo.toLowerCase();
      bills = bills.filter(b => b.billNo && b.billNo.toLowerCase().includes(q));
    }
    if (filters.searchDate) {
      bills = bills.filter(b => b.date === filters.searchDate || b.dueDate === filters.searchDate);
    }

    return bills;
  }

  function getStats() {
    const allBills = data.getCreditBills(
      state.currentAgency !== 'all' ? { agency: state.currentAgency } : {}
    );

    let totalOutstanding = 0;
    let overdueAmount = 0;
    let dueTodayAmount = 0;
    let collectedThisMonth = 0;

    const { start: monthStart, end: monthEnd } = utils.getMonthRange(utils.today());

    allBills.forEach(bill => {
      const remaining = bill.amount - (bill.paidAmount || 0);

      if (bill.status !== 'collected') {
        totalOutstanding += remaining;

        const daysUntil = utils.daysUntilDue(bill.dueDate);
        if (daysUntil < 0) overdueAmount += remaining;
        if (daysUntil === 0) dueTodayAmount += remaining;
      }

      if (bill.status === 'collected') {
        // Check if collected this month
        const payments = bill.payments || [];
        const lastPayment = payments[payments.length - 1];
        if (lastPayment && lastPayment.date >= monthStart && lastPayment.date <= monthEnd) {
          collectedThisMonth += bill.amount;
        }
      }
    });

    return { totalOutstanding, overdueAmount, dueTodayAmount, collectedThisMonth };
  }

  // ---------------------------------------------------------------------------
  // Render — Summary Stats
  // ---------------------------------------------------------------------------

  function renderStats() {
    const s = getStats();
    return `
      <div class="stats-grid anim-fade">
        <div class="stat-card">
          <div class="card-header">
            <span class="card-title">Total Outstanding</span>
            <span style="font-size:1.5rem;">💳</span>
          </div>
          <div class="card-value" style="font-variant-numeric:tabular-nums;">${utils.formatCurrency(s.totalOutstanding)}</div>
        </div>

        <div class="stat-card">
          <div class="card-header">
            <span class="card-title text-danger">Overdue</span>
            <span style="font-size:1.5rem;">⚠️</span>
          </div>
          <div class="card-value text-danger" style="font-variant-numeric:tabular-nums;">${utils.formatCurrency(s.overdueAmount)}</div>
        </div>

        <div class="stat-card">
          <div class="card-header">
            <span class="card-title text-warning">Due Today</span>
            <span style="font-size:1.5rem;">📅</span>
          </div>
          <div class="card-value text-warning" style="font-variant-numeric:tabular-nums;">${utils.formatCurrency(s.dueTodayAmount)}</div>
        </div>

        <div class="stat-card">
          <div class="card-header">
            <span class="card-title text-success">Collected This Month</span>
            <span style="font-size:1.5rem;">✅</span>
          </div>
          <div class="card-value text-success" style="font-variant-numeric:tabular-nums;">${utils.formatCurrency(s.collectedThisMonth)}</div>
        </div>
      </div>`;
  }

  // ---------------------------------------------------------------------------
  // Render — Filter Bar
  // ---------------------------------------------------------------------------

  function renderFilterBar() {
    const showAgencyFilter = state.currentAgency === 'all';
    return `
      <div class="filter-bar anim-fade" style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin-bottom:20px;">
        <input type="text" class="form-input search-input" id="cb-search"
               placeholder="🔍 Search by customer name..."
               value="${filters.search}" style="flex:1;min-width:200px;max-width:320px;">

        <div style="position:relative;display:inline-flex;align-items:center;">
          <button class="btn btn-ghost" id="cb-toggle-adv-search" style="padding:8px 12px;display:flex;align-items:center;gap:6px;" title="Advanced Filters">
            <span>⚙️</span> Filters
          </button>

          <!-- Advanced Search Popup Box -->
          <div id="cb-adv-search-popup" class="card ${advSearchOpen ? '' : 'hidden'}" style="position:absolute;top:45px;left:0;z-index:100;width:320px;padding:16px;box-shadow:0 10px 25px rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.1);background:#1a1a2e;">
            <div style="font-weight:700;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;">
              <span>Advanced Search</span>
              <button class="btn-icon" id="cb-close-adv-search" style="border:none;background:none;cursor:pointer;color:#fff;">✕</button>
            </div>
            <div class="form-group" style="margin-bottom:10px;">
              <label class="form-label" style="font-size:0.75rem;">Search by Customer Name</label>
              <input type="text" class="form-input form-input-sm" id="cb-adv-name" placeholder="Name" value="${filters.searchName}">
            </div>
            <div class="form-group" style="margin-bottom:10px;">
              <label class="form-label" style="font-size:0.75rem;">Search by Bill No</label>
              <input type="text" class="form-input form-input-sm" id="cb-adv-bill-no" placeholder="Bill No" value="${filters.searchBillNo}">
            </div>
            <div class="form-group" style="margin-bottom:12px;">
              <label class="form-label" style="font-size:0.75rem;">Search by Date</label>
              <input type="date" class="form-input form-input-sm" id="cb-adv-date" value="${filters.searchDate}">
            </div>
            <div style="display:flex;justify-content:flex-end;gap:8px;">
              <button class="btn btn-ghost btn-sm" id="cb-adv-reset">Reset</button>
            </div>
          </div>
        </div>

        ${showAgencyFilter ? `
          <select class="form-select" id="cb-agency-filter" style="min-width:150px;width:auto;">
            <option value="all" ${filters.agency === 'all' ? 'selected' : ''}>All Agencies</option>
            <option value="bathipooja" ${filters.agency === 'bathipooja' ? 'selected' : ''}>Bathipooja</option>
            <option value="domie" ${filters.agency === 'domie' ? 'selected' : ''}>Domie</option>
            <option value="kelani" ${filters.agency === 'kelani' || filters.agency === 'kalani' ? 'selected' : ''}>Kelani</option>
          </select>
        ` : ''}

        <select class="form-select" id="cb-status-filter" style="min-width:140px;width:auto;">
          <option value="all" ${filters.status === 'all' ? 'selected' : ''}>All Status</option>
          <option value="pending" ${filters.status === 'pending' ? 'selected' : ''}>Pending</option>
          <option value="partial" ${filters.status === 'partial' ? 'selected' : ''}>Partial</option>
          <option value="collected" ${filters.status === 'collected' ? 'selected' : ''}>Collected</option>
          <option value="overdue" ${filters.status === 'overdue' ? 'selected' : ''}>Overdue</option>
        </select>

        <button class="btn btn-ghost" id="cb-download-pdf" style="display:inline-flex;align-items:center;gap:6px;color:var(--primary-light,#818cf8);border:1px solid var(--border-color,#334155);background:var(--bg-surface,#0f172a);">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Download PDF
        </button>

        <button class="btn btn-ghost" id="cb-export-csv" style="display:inline-flex;align-items:center;gap:6px;color:#10B981;border:1px solid var(--border-color,#334155);background:var(--bg-surface,#0f172a);">
          📊 Export CSV
        </button>

        <button class="btn btn-primary" id="cb-add-bill">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add New Bill
        </button>
      </div>`;
  }

  // ---------------------------------------------------------------------------
  // Render — Bill Card
  // ---------------------------------------------------------------------------

  // Render — Bill Row (Compact horizontal layout)
  // ---------------------------------------------------------------------------

  function renderBillRow(bill) {
    const info = utils.getAgencyInfo(bill.agency);
    const remaining = bill.amount - (bill.paidAmount || 0);
    const progress = bill.amount > 0 ? ((bill.paidAmount || 0) / bill.amount * 100) : 0;
    const daysUntil = utils.daysUntilDue(bill.dueDate);

    let dueBadge = '';
    if (bill.status === 'collected') {
      dueBadge = '<span class="badge badge-success" style="font-size:0.7rem; padding:2px 6px;">Collected</span>';
    } else if (daysUntil < 0) {
      dueBadge = `<span class="due-badge overdue" style="font-size:0.7rem; padding:2px 6px;">${Math.abs(daysUntil)}d overdue</span>`;
    } else if (daysUntil === 0) {
      dueBadge = '<span class="due-badge due-today" style="font-size:0.7rem; padding:2px 6px;">Due Today</span>';
    } else {
      dueBadge = `<span class="due-badge upcoming" style="font-size:0.7rem; padding:2px 6px;">in ${daysUntil}d</span>`;
    }

    const progressColor = bill.status === 'collected'
      ? 'var(--success,#10b981)'
      : progress > 50
        ? 'var(--warning,#f59e0b)'
        : 'var(--primary,#6366f1)';

    return `
      <tr class="anim-slide-up" data-bill-id="${bill.id}" style="border-bottom:1px solid var(--glass-border); background: ${bill.status === 'collected' ? 'rgba(255,255,255,0.01)' : 'transparent'};">
        <td class="text-center font-mono" style="font-size:0.85rem; color:rgba(255,255,255,0.5)">
          ${bill.billNo ? `#${bill.billNo}` : '—'}
        </td>
        <td style="text-align:left;">
          <div style="font-weight:700; color:rgba(255,255,255,0.95); font-size:0.92rem;">${bill.customerName}</div>
          ${bill.customerAddress ? `<div style="font-size:0.75rem; color:rgba(255,255,255,0.4); margin-top:2px;">📍 ${bill.customerAddress}</div>` : ''}
        </td>
        <td style="text-align:left;">
          <span class="badge badge-${bill.agency}" style="font-size:0.75rem; padding: 2px 8px;">${info ? info.name : bill.agency}</span>
        </td>
        <td style="font-size:0.85rem; color:rgba(255,255,255,0.7); text-align:left;">
          <div style="font-variant-numeric:tabular-nums">${utils.formatDate(bill.date)}</div>
          <div style="font-size:0.75rem; color:rgba(255,255,255,0.4); margin-top:2px; font-variant-numeric:tabular-nums">Due: ${utils.formatDate(bill.dueDate)}</div>
        </td>
        <td style="text-align:left;">
          ${dueBadge}
        </td>
        <td class="text-right font-mono" style="font-size:0.85rem; color:rgba(255,255,255,0.6)">
          ${utils.formatCurrency(bill.amount)}
        </td>
        <td class="text-right font-mono font-bold" style="font-size:0.95rem; color: ${remaining > 0 ? 'var(--primary,#6366f1)' : 'var(--success,#10b981)'}">
          ${utils.formatCurrency(remaining)}
        </td>
        <td style="width:180px; text-align:left;">
          <div style="display:flex; align-items:center; gap:8px;">
            <div class="bill-progress" style="background:rgba(255,255,255,0.08); border-radius:4px; height:6px; flex:1; overflow:hidden; margin:0;">
              <div class="bill-progress-bar" style="width:${Math.min(progress, 100)}%; height:100%; background:${progressColor}; border-radius:4px; transition:width 0.4s ease;"></div>
            </div>
            <span style="font-size:0.75rem; color:rgba(255,255,255,0.6); min-width:30px; text-align:right; font-variant-numeric:tabular-nums;">${progress.toFixed(0)}%</span>
          </div>
        </td>
        <td style="text-align:center;">
          <div style="display:flex; gap:6px; justify-content:center; align-items:center;">
            ${bill.status !== 'collected' ? `
              <button class="btn btn-primary btn-sm cb-pay-btn" data-bill-id="${bill.id}" style="padding:4px 10px; font-size:0.75rem; display:flex; align-items:center; gap:4px; min-width:unset; height:26px;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
                Pay
              </button>
            ` : '<div style="width: 48px; height:26px;"></div>'}
            <button class="btn btn-danger btn-sm btn-icon cb-delete-btn admin-only" data-bill-id="${bill.id}" title="Delete" style="padding:4px; width:26px; height:26px; min-width:unset; display:flex; align-items:center; justify-content:center;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  // ---------------------------------------------------------------------------
  // Render — Bills List
  // ---------------------------------------------------------------------------

  function renderBillsGrid() {
    const bills = getFilteredBills();

    if (bills.length === 0) {
      return `
        <div class="empty-state anim-fade">
          <div class="empty-state-icon">📋</div>
          <p style="font-size:1.1rem;font-weight:600;">No credit bills found</p>
          <p class="text-muted">Try adjusting your filters or add a new bill</p>
        </div>`;
    }

    // Sort: overdue first, then by due date
    bills.sort((a, b) => {
      // Collected last
      if (a.status === 'collected' && b.status !== 'collected') return 1;
      if (b.status === 'collected' && a.status !== 'collected') return -1;
      // Overdue first
      const aDue = utils.daysUntilDue(a.dueDate);
      const bDue = utils.daysUntilDue(b.dueDate);
      return aDue - bDue;
    });

    return `
      <div class="card p-0 overflow-hidden anim-slide-up" style="padding:0; overflow:hidden;">
        <div class="table-wrapper" style="overflow-x:auto;">
          <table style="width:100%; border-collapse:collapse; min-width:900px;">
            <thead>
              <tr style="border-bottom:2px solid var(--glass-border); background:rgba(255,255,255,0.02)">
                <th style="width:80px; text-align:center; padding:10px 8px;">Bill No</th>
                <th style="text-align:left; padding:10px 12px;">Customer</th>
                <th style="width:100px; text-align:left; padding:10px 8px;">Agency</th>
                <th style="width:140px; text-align:left; padding:10px 8px;">Dates</th>
                <th style="width:110px; text-align:left; padding:10px 8px;">Status</th>
                <th style="width:120px; text-align:right; padding:10px 8px;">Total</th>
                <th style="width:120px; text-align:right; padding:10px 8px;">Outstanding</th>
                <th style="width:180px; text-align:left; padding:10px 12px;">Progress</th>
                <th style="width:110px; text-align:center; padding:10px 8px;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${bills.map(b => renderBillRow(b)).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  // ---------------------------------------------------------------------------
  // Modals
  // ---------------------------------------------------------------------------

  function showAddBillModal() {
    const settings = data.getSettings() || {};
    const creditDays = settings.creditPeriodDays || 30;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + creditDays);
    const dueDateStr = dueDate.toISOString().split('T')[0];

    const defaultAgency = state.currentAgency !== 'all' ? state.currentAgency : 'bathipooja';

    const body = `
      <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div class="form-group">
          <label class="form-label">Customer Name *</label>
          <input type="text" class="form-input" id="cb-modal-customer" placeholder="Customer name" required>
        </div>
        <div class="form-group">
          <label class="form-label">Bill No</label>
          <input type="text" class="form-input" id="cb-modal-bill-no" placeholder="e.g. 625">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Customer Address</label>
        <input type="text" class="form-input" id="cb-modal-address" placeholder="Customer address (optional)">
      </div>
      <div class="form-group">
        <label class="form-label">Agency</label>
        <select class="form-select" id="cb-modal-agency">
          <option value="bathipooja" ${defaultAgency === 'bathipooja' ? 'selected' : ''}>Bathipooja</option>
          <option value="domie" ${defaultAgency === 'domie' ? 'selected' : ''}>Domie</option>
          <option value="kelani" ${defaultAgency === 'kelani' || defaultAgency === 'kalani' ? 'selected' : ''}>Kelani</option>
        </select>
      </div>
      <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div class="form-group">
          <label class="form-label">Bill Amount *</label>
          <input type="number" class="form-input" id="cb-modal-amount" min="0" step="0.01" placeholder="0.00" required>
        </div>
        <div class="form-group">
          <label class="form-label">Bill Date</label>
          <input type="date" class="form-input" id="cb-modal-date" value="${utils.today()}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Due Date</label>
        <input type="date" class="form-input" id="cb-modal-due" value="${dueDateStr}">
      </div>
      <div class="form-group">
        <label class="form-label">Notes</label>
        <textarea class="form-textarea" id="cb-modal-notes" rows="3" placeholder="Optional notes..."></textarea>
      </div>`;

    const footer = `
      <button class="btn btn-ghost" onclick="AgencyHub.utils.closeModal()">Cancel</button>
      <button class="btn btn-primary" id="cb-modal-save">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
        Save Bill
      </button>`;

    utils.showModal('Add New Credit Bill', body, footer, {
      size: 'sm',
      onInit: () => {
        document.getElementById('cb-modal-save').addEventListener('click', () => {

          const customer = document.getElementById('cb-modal-customer').value.trim();
          const amount = parseFloat(document.getElementById('cb-modal-amount').value);

          if (!customer) { utils.toast('Customer name is required', 'warning'); return; }
          if (!amount || amount <= 0) { utils.toast('Valid amount is required', 'warning'); return; }

          const bill = {
            agency: document.getElementById('cb-modal-agency').value,
            customerName: customer,
            billNo: document.getElementById('cb-modal-bill-no').value.trim(),
            customerAddress: document.getElementById('cb-modal-address').value.trim(),
            amount: amount,
            paidAmount: 0,
            date: document.getElementById('cb-modal-date').value || utils.today(),
            dueDate: document.getElementById('cb-modal-due').value || dueDateStr,
            status: 'pending',
            payments: [],
            notes: document.getElementById('cb-modal-notes').value.trim()
          };

          data.saveCreditBill(bill);
          utils.toast('Credit bill added!', 'success');
          utils.closeModal();
          AgencyHub.navigate('credit');
        });
      }
    });
  }

  function showPaymentModal(billId) {
    const bills = data.getCreditBills();
    const bill = bills.find(b => b.id === billId);
    if (!bill) return;

    const remaining = bill.amount - (bill.paidAmount || 0);
    const info = utils.getAgencyInfo(bill.agency);

    const body = `
      <div style="background:rgba(99,102,241,0.08);border-radius:12px;padding:16px;margin-bottom:16px;">
        <div class="flex items-center justify-between" style="margin-bottom:8px;">
          <span class="font-bold">${bill.billNo ? `#${bill.billNo} ` : ''}${bill.customerName}</span>
          <span class="badge badge-${bill.agency}">${info ? info.name : bill.agency}</span>
        </div>
        ${bill.customerAddress ? `<div class="text-xs text-muted" style="margin-bottom:8px;">📍 ${bill.customerAddress}</div>` : ''}
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;font-variant-numeric:tabular-nums;">
          <div>
            <div class="text-sm text-muted">Total</div>
            <div class="font-bold">${utils.formatCurrency(bill.amount)}</div>
          </div>
          <div>
            <div class="text-sm text-muted">Paid</div>
            <div class="font-bold text-success">${utils.formatCurrency(bill.paidAmount || 0)}</div>
          </div>
          <div>
            <div class="text-sm text-muted">Remaining</div>
            <div class="font-bold text-warning">${utils.formatCurrency(remaining)}</div>
          </div>
        </div>
      </div>

      ${bill.payments && bill.payments.length > 0 ? `
        <div style="margin-bottom:16px;">
          <div class="text-sm font-bold" style="margin-bottom:8px;">Payment History</div>
          <div style="max-height:120px;overflow-y:auto;">
            ${bill.payments.map(p => `
              <div class="flex items-center justify-between text-sm" style="padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
                <span>${utils.formatDate(p.date)}</span>
                <span class="font-mono">${utils.formatCurrency(p.amount)}</span>
                ${p.note ? `<span class="text-muted">${p.note}</span>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <div class="form-group">
        <label class="form-label">Payment Amount *</label>
        <input type="number" class="form-input" id="cb-pay-amount" min="0.01" max="${remaining}" step="0.01" placeholder="0.00" value="${remaining}">
      </div>
      <div class="form-group">
        <label class="form-label">Payment Date</label>
        <input type="date" class="form-input" id="cb-pay-date" value="${utils.today()}">
      </div>
      <div class="form-group">
        <label class="form-label">Note</label>
        <input type="text" class="form-input" id="cb-pay-note" placeholder="e.g. Cash payment, Cheque #1234...">
      </div>`;

    const footer = `
      <button class="btn btn-ghost" onclick="AgencyHub.utils.closeModal()">Cancel</button>
      <button class="btn btn-success" id="cb-pay-save">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
        Record Payment
      </button>`;

    utils.showModal('Add Payment', body, footer, {
      size: 'sm',
      onInit: () => {
        document.getElementById('cb-pay-save').addEventListener('click', () => {

          const amount = parseFloat(document.getElementById('cb-pay-amount').value);
          if (!amount || amount <= 0) { utils.toast('Enter a valid amount', 'warning'); return; }
          if (amount > remaining + 0.01) { utils.toast('Amount exceeds remaining balance', 'warning'); return; }

          const payment = {
            amount: amount,
            date: document.getElementById('cb-pay-date').value || utils.today(),
            note: document.getElementById('cb-pay-note').value.trim()
          };

          data.addPayment(billId, payment);
          utils.toast('Payment recorded!', 'success');
          utils.closeModal();
          AgencyHub.navigate('credit');
        });
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Main Render
  // ---------------------------------------------------------------------------

  function render(appState) {
    const isFiltered = filters.search || filters.searchName || filters.searchBillNo || filters.searchDate;
    let searchSummaryHtml = '';
    if (isFiltered) {
      const filteredBills = getFilteredBills();
      const pendingFiltered = filteredBills.filter(b => b.status !== 'collected');
      const totalPendingAmount = pendingFiltered.reduce((s, b) => s + (b.amount - (b.paidAmount || 0)), 0);
      searchSummaryHtml = `
        <div class="anim-fade" style="background:rgba(99,102,241,0.1); border-left:4px solid var(--primary,#6366f1); padding:12px 16px; border-radius:6px; margin-bottom:16px; font-weight:600; display:flex; justify-content:space-between; align-items:center; font-size:0.95rem;">
          <span>🔍 Found ${pendingFiltered.length} bill${pendingFiltered.length === 1 ? '' : 's'} left to collect for this search</span>
          <span style="color:var(--primary,#6366f1); font-size:1.1rem; font-weight:700;">${utils.formatCurrency(totalPendingAmount)}</span>
        </div>`;
    }

    return `
      <div id="credit-bills-module">
        <div class="section-header anim-fade">
          <div>
            <h1 class="section-title">Credit Bills</h1>
            <p class="section-subtitle">Track and manage all outstanding credit bills across agencies</p>
          </div>
        </div>

        ${renderStats()}
        ${renderFilterBar()}
        ${searchSummaryHtml}
        ${renderBillsGrid()}
      </div>`;
  }

  // ---------------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------------

  function init(appState) {
    const container = document.getElementById('credit-bills-module');
    if (!container) return;

    // Search with debounce
    const searchInput = document.getElementById('cb-search');
    if (searchInput) {
      const debouncedSearch = utils.debounce(() => {
        filters.search = searchInput.value.trim();
        AgencyHub.navigate('credit');
      }, 300);
      searchInput.addEventListener('input', debouncedSearch);
    }

    // Toggle advanced search popup
    const toggleBtn = document.getElementById('cb-toggle-adv-search');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        advSearchOpen = !advSearchOpen;
        const popup = document.getElementById('cb-adv-search-popup');
        if (popup) popup.classList.toggle('hidden', !advSearchOpen);
      });
    }

    const closeBtn = document.getElementById('cb-close-adv-search');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        advSearchOpen = false;
        const popup = document.getElementById('cb-adv-search-popup');
        if (popup) popup.classList.add('hidden');
      });
    }

    // Prevent click inside popup from closing it (if we add outside click listener)
    const popupEl = document.getElementById('cb-adv-search-popup');
    if (popupEl) {
      popupEl.addEventListener('click', (e) => e.stopPropagation());
    }

    // Track focused input ID
    utils.delegate(container, '#cb-search, #cb-adv-name, #cb-adv-bill-no, #cb-adv-date', 'focus', (e, target) => {
      lastFocusedId = target.id;
    });

    // Advanced Name filter
    const advNameInput = document.getElementById('cb-adv-name');
    if (advNameInput) {
      const debouncedName = utils.debounce(() => {
        filters.searchName = advNameInput.value.trim();
        AgencyHub.navigate('credit');
      }, 300);
      advNameInput.addEventListener('input', debouncedName);
    }

    // Advanced Bill No filter
    const advBillInput = document.getElementById('cb-adv-bill-no');
    if (advBillInput) {
      const debouncedBill = utils.debounce(() => {
        filters.searchBillNo = advBillInput.value.trim();
        AgencyHub.navigate('credit');
      }, 300);
      advBillInput.addEventListener('input', debouncedBill);
    }

    // Advanced Date filter
    const advDateInput = document.getElementById('cb-adv-date');
    if (advDateInput) {
      advDateInput.addEventListener('change', () => {
        filters.searchDate = advDateInput.value;
        AgencyHub.navigate('credit');
      });
    }

    // Reset advanced search
    const resetBtn = document.getElementById('cb-adv-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        filters.search = '';
        filters.searchName = '';
        filters.searchBillNo = '';
        filters.searchDate = '';
        advSearchOpen = false;
        lastFocusedId = null;
        AgencyHub.navigate('credit');
      });
    }

    // Agency filter
    const agencyFilter = document.getElementById('cb-agency-filter');
    if (agencyFilter) {
      agencyFilter.addEventListener('change', () => {
        filters.agency = agencyFilter.value;
        AgencyHub.navigate('credit');
      });
    }

    // Status filter
    const statusFilter = document.getElementById('cb-status-filter');
    if (statusFilter) {
      statusFilter.addEventListener('change', () => {
        filters.status = statusFilter.value;
        AgencyHub.navigate('credit');
      });
    }

    // Add bill button
    const addBtn = document.getElementById('cb-add-bill');
    if (addBtn) {
      addBtn.addEventListener('click', showAddBillModal);
    }

    // Download PDF button
    const pdfBtn = document.getElementById('cb-download-pdf');
    if (pdfBtn) {
      pdfBtn.addEventListener('click', () => {
        const todayStr = new Date().toISOString().split('T')[0];
        AgencyHub.utils.toast('Generating Credit Bills PDF...', 'info');

        const opt = {
          margin:       [8, 8, 8, 8],
          filename:     `Credit_Bills_Report_${todayStr}.pdf`,
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' },
          jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        if (window.html2pdf) {
          container.classList.add('pdf-export-mode');
          window.html2pdf().set(opt).from(container).save().then(() => {
            container.classList.remove('pdf-export-mode');
            AgencyHub.utils.toast('Credit Bills PDF downloaded successfully!', 'success');
          }).catch(err => {
            container.classList.remove('pdf-export-mode');
            console.error(err);
            window.print();
          });
        } else {
          window.print();
        }
      });
    }

    // Export CSV button
    const csvBtn = document.getElementById('cb-export-csv');
    if (csvBtn) {
      csvBtn.addEventListener('click', () => {
        const bills = getFilteredBills();
        const headers = ['Bill No', 'Customer Name', 'Agency', 'Original Amount', 'Paid Amount', 'Remaining Amount', 'Bill Date', 'Due Date', 'Status'];
        const rows = bills.map(b => [
          b.billNo || '—',
          b.customerName || '—',
          b.agency || '—',
          (Number(b.amount) || 0).toFixed(2),
          (Number(b.paidAmount) || 0).toFixed(2),
          ((Number(b.amount) || 0) - (Number(b.paidAmount) || 0)).toFixed(2),
          b.date || '—',
          b.dueDate || '—',
          b.status || 'pending'
        ]);
        AgencyHub.utils.exportToCSV(`Credit_Bills_Report_${AgencyHub.utils.today()}`, headers, rows);
      });
    }

    // Add Payment buttons (delegation)
    utils.delegate(container, '.cb-pay-btn', 'click', function (e, target) {

      const billId = target.getAttribute('data-bill-id');
      showPaymentModal(billId);
    });

    // Delete buttons (delegation)
    utils.delegate(container, '.cb-delete-btn', 'click', async function (e, target) {
      if (!AgencyHub.isAdmin()) { AgencyHub.utils.toast('View-only access', 'warning'); return; }
      const billId = target.getAttribute('data-bill-id');
      const confirmed = await utils.confirm('Delete Bill', 'Are you sure you want to delete this credit bill? This action cannot be undone.');
      if (confirmed) {
        data.deleteCreditBill(billId);
        utils.toast('Credit bill deleted', 'success');
        AgencyHub.navigate('credit');
      }
    });

    // Restore focus and cursor position if an input was active
    if (lastFocusedId) {
      const el = document.getElementById(lastFocusedId);
      if (el) {
        el.focus();
        if (el.type === 'text') {
          const val = el.value;
          el.value = '';
          el.value = val;
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Register
  // ---------------------------------------------------------------------------

  AgencyHub.registerModule('creditBills', { render, init });
})();
