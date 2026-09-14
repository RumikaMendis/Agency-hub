// =============================================================================
// AgencyHub — Dashboard Module
// =============================================================================

(function () {
  'use strict';

  const { data, utils, state, AGENCIES } = AgencyHub;

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function getTodaySales(agency) {
    const today = utils.today();
    const entries = data.getSalesEntries(agency === 'all' ? undefined : agency);
    return entries
      .filter(e => e.date === today)
      .reduce((sum, e) => sum + (e.totals?.netSale || 0), 0);
  }

  function getMonthSales(agency) {
    const ym = utils.today().slice(0, 7); // 'YYYY-MM'
    const entries = data.getSalesEntries(agency === 'all' ? undefined : agency);
    return entries
      .filter(e => e.date && e.date.startsWith(ym))
      .reduce((sum, e) => sum + (e.totals?.netSale || 0), 0);
  }

  function getOutstandingCredit(agency) {
    const bills = data.getCreditBills({
      agency: agency === 'all' ? undefined : agency
    });
    return bills
      .filter(b => b.status !== 'collected')
      .reduce((sum, b) => sum + (b.amount - b.paidAmount), 0);
  }

  function getDueTodayCount(agency) {
    const bills = data.getCreditBills({
      dueToday: true,
      agency: agency === 'all' ? undefined : agency
    });
    return bills.length;
  }

  function getRecentSalesEntries(agency, limit) {
    const entries = data.getSalesEntries(agency === 'all' ? undefined : agency);
    return entries
      .sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0))
      .slice(0, limit);
  }

  function getOverdueBills(agency) {
    return data.getCreditBills({
      overdue: true,
      agency: agency === 'all' ? undefined : agency
    });
  }

  // ---------------------------------------------------------------------------
  // SVG Icons
  // ---------------------------------------------------------------------------

  const icons = {
    sales: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
    warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    clock: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    arrowRight: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>'
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  function render(st) {
    const ag = st.currentAgency || 'all';

    // --- Stats ---------------------------------------------------------------
    const bathipoojaToday = getTodaySales('bathipooja');
    const domieToday = getTodaySales('domie');
    const kelaniToday = getTodaySales('kelani');
    const totalToday = ag === 'all'
      ? bathipoojaToday + domieToday + kelaniToday
      : getTodaySales(ag);

    const bathipoojaMonth = getMonthSales('bathipooja');
    const domieMonth = getMonthSales('domie');
    const kelaniMonth = getMonthSales('kelani');
    const totalMonth = ag === 'all'
      ? bathipoojaMonth + domieMonth + kelaniMonth
      : getMonthSales(ag);

    const outstandingCredit = getOutstandingCredit(ag);
    const dueTodayCount = getDueTodayCount(ag);

    // --- Recent entries & overdue bills --------------------------------------
    const recentEntries = getRecentSalesEntries(ag, 10);
    const overdueBills = getOverdueBills(ag);

    // --- Build today stats cards ---------------------------------------------
    let todayStatsCards = '';

    if (ag === 'all' || ag === 'bathipooja') {
      todayStatsCards += `
        <div class="card stat-card" style="border-left:4px solid #22c55e">
          <div class="card-header">
            <span class="text-muted text-sm">🪔 Bathipooja Today</span>
          </div>
          <div class="card-value" style="color:#22c55e;font-variant-numeric:tabular-nums">
            ${utils.formatCurrency(bathipoojaToday)}
          </div>
        </div>`;
    }

    if (ag === 'all' || ag === 'domie') {
      todayStatsCards += `
        <div class="card stat-card" style="border-left:4px solid #f97316">
          <div class="card-header">
            <span class="text-muted text-sm">🍬 Domie Today</span>
          </div>
          <div class="card-value" style="color:#f97316;font-variant-numeric:tabular-nums">
            ${utils.formatCurrency(domieToday)}
          </div>
        </div>`;
    }

    if (ag === 'all' || ag === 'kelani' || ag === 'kalani') {
      todayStatsCards += `
        <div class="card stat-card" style="border-left:4px solid #3b82f6">
          <div class="card-header">
            <span class="text-muted text-sm">🔌 Kelani Cables Today</span>
          </div>
          <div class="card-value" style="color:#3b82f6;font-variant-numeric:tabular-nums">
            ${utils.formatCurrency(kelaniToday)}
          </div>
        </div>`;
    }

    todayStatsCards += `
      <div class="card stat-card" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff">
        <div class="card-header">
          <span style="opacity:.85" class="text-sm">${icons.sales} Total Sales Today</span>
        </div>
        <div class="card-value" style="color:#fff;font-variant-numeric:tabular-nums">
          ${utils.formatCurrency(totalToday)}
        </div>
      </div>

      <div class="card stat-card" style="border-left:4px solid #ef4444">
        <div class="card-header">
          <span class="text-muted text-sm">⚠️ Outstanding Credit</span>
        </div>
        <div class="card-value" style="color:#ef4444;font-variant-numeric:tabular-nums">
          ${utils.formatCurrency(outstandingCredit)}
        </div>
      </div>

      <div class="card stat-card" style="border-left:4px solid #eab308">
        <div class="card-header">
          <span class="text-muted text-sm">${icons.clock} Due Today</span>
        </div>
        <div class="card-value" style="color:#eab308;font-variant-numeric:tabular-nums">
          ${dueTodayCount}
        </div>
        <div class="card-change text-sm text-muted">collection${dueTodayCount !== 1 ? 's' : ''}</div>
      </div>`;

    // --- Build monthly stats cards -------------------------------------------
    let monthStatsCards = '';

    if (ag === 'all' || ag === 'bathipooja') {
      monthStatsCards += `
        <div class="card stat-card" style="border-left:4px solid #10b981">
          <div class="card-header">
            <span class="text-muted text-sm">🪔 Total Sale Bathipooja</span>
          </div>
          <div class="card-value" style="color:#10b981;font-variant-numeric:tabular-nums">
            ${utils.formatCurrency(bathipoojaMonth)}
          </div>
        </div>`;
    }

    if (ag === 'all' || ag === 'domie') {
      monthStatsCards += `
        <div class="card stat-card" style="border-left:4px solid #f59e0b">
          <div class="card-header">
            <span class="text-muted text-sm">🍬 Total Sale Domie</span>
          </div>
          <div class="card-value" style="color:#f59e0b;font-variant-numeric:tabular-nums">
            ${utils.formatCurrency(domieMonth)}
          </div>
        </div>`;
    }

    if (ag === 'all' || ag === 'kelani' || ag === 'kalani') {
      monthStatsCards += `
        <div class="card stat-card" style="border-left:4px solid #3b82f6">
          <div class="card-header">
            <span class="text-muted text-sm">🔌 Total Sale Kelani Cables</span>
          </div>
          <div class="card-value" style="color:#3b82f6;font-variant-numeric:tabular-nums">
            ${utils.formatCurrency(kelaniMonth)}
          </div>
        </div>`;
    }

    monthStatsCards += `
      <div class="card stat-card" style="background:linear-gradient(135deg,#06b6d4,#3b82f6);color:#fff">
        <div class="card-header">
          <span style="opacity:.85" class="text-sm">${icons.sales} Total Sale All of 3</span>
        </div>
        <div class="card-value" style="color:#fff;font-variant-numeric:tabular-nums">
          ${utils.formatCurrency(totalMonth)}
        </div>
      </div>`;

    // --- Recent Sales Table --------------------------------------------------
    let recentSalesRows = '';
    if (recentEntries.length === 0) {
      recentSalesRows = `
        <tr>
          <td colspan="4" class="text-center text-muted" style="padding:2rem">
            <div class="empty-state">
              <div class="empty-state-icon">📭</div>
              No sales entries yet
            </div>
          </td>
        </tr>`;
    } else {
      recentEntries.forEach(entry => {
        const info = utils.getAgencyInfo(entry.agency);
        const customerCount = entry.entries ? entry.entries.length : 0;
        recentSalesRows += `
          <tr>
            <td>${utils.formatDate(entry.date)}</td>
            <td><span class="badge badge-${entry.agency}">${info.name}</span></td>
            <td class="text-center" style="font-variant-numeric:tabular-nums">${customerCount}</td>
            <td class="text-right" style="font-variant-numeric:tabular-nums">${utils.formatCurrency(entry.totals?.netSale || 0)}</td>
          </tr>`;
      });
    }

    const recentSalesHtml = `
      <div class="card anim-slide-up">
        <div class="card-header">
          <div class="card-title">Recent Sales Entries</div>
        </div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Agency</th>
                <th class="text-center">Customers</th>
                <th class="text-right">Net Sale</th>
              </tr>
            </thead>
            <tbody>${recentSalesRows}</tbody>
          </table>
        </div>
      </div>`;

    // --- Overdue Bills -------------------------------------------------------
    let overdueBillsHtml = '';
    if (overdueBills.length === 0) {
      overdueBillsHtml = `
        <div class="card anim-slide-up">
          <div class="card-header">
            <div class="card-title">Overdue Bills</div>
          </div>
          <div class="empty-state" style="padding:2rem">
            <div class="empty-state-icon">🎉</div>
            No overdue bills — great job!
          </div>
        </div>`;
    } else {
      let billItems = '';
      overdueBills.forEach(bill => {
        const daysOver = Math.abs(utils.daysUntilDue(bill.dueDate));
        const remaining = bill.amount - bill.paidAmount;
        const info = utils.getAgencyInfo(bill.agency);
        const pct = bill.amount > 0 ? Math.round((bill.paidAmount / bill.amount) * 100) : 0;

        billItems += `
          <div class="bill-card">
            <div class="flex items-center justify-between">
              <div>
                <div class="bill-customer">${bill.customerName}</div>
                <div class="bill-meta">
                  <span class="badge badge-${bill.agency}">${info.name}</span>
                  <span class="due-badge overdue">${daysOver} day${daysOver !== 1 ? 's' : ''} overdue</span>
                </div>
              </div>
              <div class="text-right">
                <div class="bill-amount" style="font-variant-numeric:tabular-nums">${utils.formatCurrency(remaining)}</div>
                <button class="btn btn-success btn-sm dash-collect-btn" data-bill-id="${bill.id}">
                  Collect
                </button>
              </div>
            </div>
            <div class="bill-progress"><div class="bill-progress-bar" style="width:${pct}%"></div></div>
          </div>`;
      });

      overdueBillsHtml = `
        <div class="card anim-slide-up">
          <div class="card-header flex items-center justify-between">
            <div class="card-title">Overdue Bills</div>
            <span class="badge badge-danger">${overdueBills.length}</span>
          </div>
          <div style="padding:1rem;display:flex;flex-direction:column;gap:.75rem">
            ${billItems}
          </div>
        </div>`;
    }

    // --- Quick Actions -------------------------------------------------------
    const quickActionsHtml = `
      <div class="quick-actions anim-slide-up mt-6">
        <button class="quick-action" id="dash-qa-bathipooja">
          <span class="qa-icon">🪔</span>
          Enter Bathipooja Sales
        </button>
        <button class="quick-action" id="dash-qa-domie">
          <span class="qa-icon">🍬</span>
          Enter Domie Sales
        </button>
        <button class="quick-action" id="dash-qa-credit">
          <span class="qa-icon">📋</span>
          Add Credit Bill
        </button>
        <button class="quick-action" id="dash-qa-audit">
          <span class="qa-icon">✅</span>
          Start Audit
        </button>
      </div>`;

    // --- Assemble ------------------------------------------------------------
    return `
      <div class="anim-fade">
        <div class="section-header mb-6">
          <h1 class="section-title">Dashboard</h1>
          <p class="section-subtitle">Unified overview · ${utils.formatDate(utils.today())}</p>
        </div>

        <div style="margin: 0 0 12px; font-size: 0.85rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(255,255,255,0.5)">
          Today's Overview
        </div>
        <div class="stats-grid mb-6">
          ${todayStatsCards}
        </div>

        <div style="margin: 24px 0 12px; font-size: 0.85rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(255,255,255,0.5)">
          Monthly Sales Summary
        </div>
        <div class="stats-grid mb-6">
          ${monthStatsCards}
        </div>

        <div class="grid-2 mb-6">
          ${recentSalesHtml}
          ${overdueBillsHtml}
        </div>

        ${quickActionsHtml}
      </div>`;
  }

  // ---------------------------------------------------------------------------
  // Init (event listeners)
  // ---------------------------------------------------------------------------

  function init() {
    // Quick‑action buttons
    const qaMap = {
      'dash-qa-bathipooja': 'sales',
      'dash-qa-domie': 'sales',
      'dash-qa-credit': 'credit',
      'dash-qa-audit': 'audit'
    };

    Object.keys(qaMap).forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('click', () => AgencyHub.navigate(qaMap[id]));
      }
    });

    // Collect buttons — delegate on body since they're dynamic
    utils.delegate(document.body, '.dash-collect-btn', 'click', function (e) {
      const billId = e.target.dataset.billId;
      if (!billId) return;
      AgencyHub.navigate('credit');
    });
  }

  // ---------------------------------------------------------------------------
  // Register
  // ---------------------------------------------------------------------------

  AgencyHub.registerModule('dashboard', { render, init });
})();
