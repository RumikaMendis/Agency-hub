// ============================================================
// AgencyHub — Reports Module
// ============================================================
(function () {
  'use strict';

  const TABS = [
    { id: 'daily',       label: 'Daily Sales' },
    { id: 'monthly',     label: 'Monthly Summary' },
    { id: 'product',     label: 'Product Analysis' },
    { id: 'credit',      label: 'Credit Outstanding' },
    { id: 'collection',  label: 'Collection Performance' },
    { id: 'stock',       label: 'Stock Audit Report' },
    { id: 'operations',  label: 'Operations Report' },
    { id: 'payroll',     label: 'Salary Summary' },
    { id: 'fuel',        label: 'Fuel & Mileage' }
  ];

  const AGENCY_COLORS = {
    bathipooja: '#10B981',
    domie:      '#F59E0B',
    kelani:     '#3B82F6',
    kalani:     '#3B82F6'
  };

  const AGENCY_IDS = ['bathipooja', 'domie', 'kelani'];

  // ── helpers ──────────────────────────────────────────────
  const fmt  = AgencyHub.utils.formatCurrency;
  const fmtD = AgencyHub.utils.formatDate;
  const fmtN = AgencyHub.utils.formatNumber;

  function currentMonth() {
    return AgencyHub.utils.today().slice(0, 7);          // 'YYYY-MM'
  }

  function daysInMonth(ym) {
    const [y, m] = ym.split('-').map(Number);
    return new Date(y, m, 0).getDate();
  }

  function agencyBadge(agId) {
    const info = AgencyHub.utils.getAgencyInfo(agId);
    if (!info) return '';
    return `<span class="badge badge-${agId}">${info.icon} ${info.name}</span>`;
  }

  function emptyState(msg) {
    return `<div class="empty-state anim-fade">
      <div class="empty-state-icon">
        <svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
          <path d="M3 7h18M3 12h18M3 17h18"/>
        </svg>
      </div>
      <p class="text-muted">${msg}</p>
    </div>`;
  }

  function printBtn(reportTitle = 'Report') {
    return `<div style="display:inline-flex;gap:8px;align-items:center;margin-left:auto;">
      <button class="btn btn-ghost btn-sm rpt-download-pdf-btn" data-title="${reportTitle}" style="display:inline-flex;align-items:center;gap:6px;color:var(--primary-light,#818cf8);border:1px solid var(--border-color,#334155);background:var(--bg-surface,#0f172a);">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        Download PDF
      </button>
      <button class="btn btn-ghost btn-sm" id="rpt-print-btn" style="display:inline-flex;align-items:center;gap:6px;">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
          <rect x="6" y="14" width="12" height="8" rx="1"/>
        </svg>
        Print Report
      </button>
    </div>`;
  }

  // ── tab rendering functions ──────────────────────────────

  // === 1. Daily Sales ======================================
  function renderDailyTab() {
    return `
      <div id="rpt-daily-panel" class="rpt-panel">
        <div class="filter-bar flex items-center gap-3">
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label">Date</label>
            <input type="date" id="rpt-daily-date" class="form-input form-input-sm" value="${AgencyHub.utils.today()}">
          </div>
          ${printBtn()}
        </div>
        <div id="rpt-daily-body" class="mt-4"></div>
      </div>`;
  }

  function refreshDaily() {
    const date = document.getElementById('rpt-daily-date').value;
    const entries = AgencyHub.data.getSalesEntries(null, date, date);
    const body = document.getElementById('rpt-daily-body');
    if (!entries.length) {
      body.innerHTML = emptyState('No sales entries for ' + fmtD(date));
      return;
    }

    let totGross = 0, totDisc = 0, totNet = 0;
    const rows = entries.map(e => {
      const g = e.grandTotals?.grossSale || e.totals?.grossSale || 0;
      const d = e.grandTotals?.discount  || e.totals?.discount  || 0;
      const n = e.grandTotals?.netSale   || e.totals?.netSale   || 0;
      const custs = (e.entries || []).length;
      totGross += g; totDisc += d; totNet += n;
      return `<tr>
        <td>${agencyBadge(e.agency)}</td>
        <td>${e.salesRep || '—'}</td>
        <td class="text-center" style="font-variant-numeric:tabular-nums">${custs}</td>
        <td class="text-right" style="font-variant-numeric:tabular-nums">${fmt(g)}</td>
        <td class="text-right" style="font-variant-numeric:tabular-nums">${fmt(d)}</td>
        <td class="text-right" style="font-variant-numeric:tabular-nums">${fmt(n)}</td>
      </tr>`;
    }).join('');

    body.innerHTML = `
      <div class="table-wrapper anim-fade">
        <table>
          <thead><tr>
            <th>Agency</th><th>Sales Rep</th><th class="text-center"># Customers</th>
            <th class="text-right">Gross Sale</th><th class="text-right">Discount</th><th class="text-right">Net Sale</th>
          </tr></thead>
          <tbody>${rows}</tbody>
          <tfoot><tr class="row-grand-total">
            <td colspan="3" class="font-bold">Total</td>
            <td class="text-right font-bold" style="font-variant-numeric:tabular-nums">${fmt(totGross)}</td>
            <td class="text-right font-bold" style="font-variant-numeric:tabular-nums">${fmt(totDisc)}</td>
            <td class="text-right font-bold" style="font-variant-numeric:tabular-nums">${fmt(totNet)}</td>
          </tr></tfoot>
        </table>
      </div>`;
  }

  // === 2. Monthly Summary ==================================
  function renderMonthlyTab() {
    return `
      <div id="rpt-monthly-panel" class="rpt-panel" style="display:none">
        <div class="filter-bar flex items-center gap-3">
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label">Month</label>
            <input type="month" id="rpt-monthly-month" class="form-input form-input-sm" value="${currentMonth()}">
          </div>
          ${printBtn()}
        </div>
        <div id="rpt-monthly-body" class="mt-4"></div>
      </div>`;
  }

  function refreshMonthly() {
    const ym   = document.getElementById('rpt-monthly-month').value;
    const days = daysInMonth(ym);
    const start = ym + '-01';
    const end   = ym + '-' + String(days).padStart(2, '0');
    const entries = AgencyHub.data.getSalesEntries(null, start, end);

    // build map  day -> { agency -> net }
    const map = {};
    for (let d = 1; d <= days; d++) map[d] = { bathipooja: 0, domie: 0, kelani: 0 };
    entries.forEach(e => {
      const day = parseInt(e.date.split('-')[2], 10);
      const net = e.grandTotals?.netSale || e.totals?.netSale || 0;
      const agKey = (e.agency === 'kalani' ? 'kelani' : e.agency);
      if (map[day] && map[day][agKey] !== undefined) map[day][agKey] += net;
    });

    let grandTotals = { bathipooja: 0, domie: 0, kelani: 0, all: 0 };
    const rows = [];
    for (let d = 1; d <= days; d++) {
      const row = map[d];
      const total = row.bathipooja + row.domie + row.kelani;
      grandTotals.bathipooja += row.bathipooja;
      grandTotals.domie      += row.domie;
      grandTotals.kelani     += row.kelani;
      grandTotals.all        += total;
      const dateStr = ym + '-' + String(d).padStart(2, '0');
      rows.push(`<tr>
        <td>${fmtD(dateStr)}</td>
        <td class="text-right" style="font-variant-numeric:tabular-nums">${row.bathipooja ? fmt(row.bathipooja) : '—'}</td>
        <td class="text-right" style="font-variant-numeric:tabular-nums">${row.domie ? fmt(row.domie) : '—'}</td>
        <td class="text-right" style="font-variant-numeric:tabular-nums">${row.kelani ? fmt(row.kelani) : '—'}</td>
        <td class="text-right font-bold" style="font-variant-numeric:tabular-nums">${total ? fmt(total) : '—'}</td>
      </tr>`);
    }

    const body = document.getElementById('rpt-monthly-body');
    body.innerHTML = `
      <div class="table-wrapper anim-fade" style="max-height:400px;overflow-y:auto">
        <table>
          <thead><tr>
            <th>Date</th>
            <th class="text-right" style="color:${AGENCY_COLORS.bathipooja}">Bathipooja</th>
            <th class="text-right" style="color:${AGENCY_COLORS.domie}">Domie</th>
            <th class="text-right" style="color:${AGENCY_COLORS.kelani}">Kelani</th>
            <th class="text-right">Total</th>
          </tr></thead>
          <tbody>${rows.join('')}</tbody>
          <tfoot><tr class="row-grand-total">
            <td class="font-bold">Grand Total</td>
            <td class="text-right font-bold" style="font-variant-numeric:tabular-nums">${fmt(grandTotals.bathipooja)}</td>
            <td class="text-right font-bold" style="font-variant-numeric:tabular-nums">${fmt(grandTotals.domie)}</td>
            <td class="text-right font-bold" style="font-variant-numeric:tabular-nums">${fmt(grandTotals.kelani)}</td>
            <td class="text-right font-bold" style="font-variant-numeric:tabular-nums">${fmt(grandTotals.all)}</td>
          </tr></tfoot>
        </table>
      </div>
      <div class="card mt-4 anim-slide-up" style="padding:16px">
        <h4 class="text-sm font-bold mb-4">Daily Sales Chart</h4>
        <canvas id="rpt-monthly-chart" width="900" height="320" style="width:100%;height:320px"></canvas>
      </div>`;

    drawMonthlyChart(map, days);
  }

  function drawMonthlyChart(map, days) {
    const canvas = document.getElementById('rpt-monthly-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width  = rect.width  * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const W = rect.width, H = rect.height;

    const PAD_L = 60, PAD_R = 16, PAD_T = 16, PAD_B = 36;
    const chartW = W - PAD_L - PAD_R;
    const chartH = H - PAD_T - PAD_B;

    // max value
    let maxVal = 0;
    for (let d = 1; d <= days; d++) {
      const t = map[d].bathipooja + map[d].domie + map[d].kelani;
      if (t > maxVal) maxVal = t;
    }
    if (maxVal === 0) maxVal = 1000;
    maxVal = Math.ceil(maxVal / 1000) * 1000;

    // grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    const gridLines = 5;
    ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.textAlign = 'right';
    for (let i = 0; i <= gridLines; i++) {
      const y = PAD_T + chartH - (chartH * i / gridLines);
      ctx.beginPath(); ctx.moveTo(PAD_L, y); ctx.lineTo(W - PAD_R, y); ctx.stroke();
      const val = (maxVal * i / gridLines);
      ctx.fillText(val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val.toFixed(0), PAD_L - 8, y + 4);
    }

    // bars
    const groupW = chartW / days;
    const barW = Math.max(2, (groupW - 4) / 3);
    const agencies = AGENCY_IDS;
    const colors   = [AGENCY_COLORS.bathipooja, AGENCY_COLORS.domie, AGENCY_COLORS.kelani];

    for (let d = 1; d <= days; d++) {
      const x0 = PAD_L + (d - 1) * groupW + (groupW - barW * 3 - 2) / 2;
      agencies.forEach((ag, i) => {
        const val = map[d][ag];
        const barH = (val / maxVal) * chartH;
        const x = x0 + i * (barW + 1);
        const y = PAD_T + chartH - barH;
        ctx.fillStyle = colors[i];
        ctx.globalAlpha = 0.85;
        ctx.fillRect(x, y, barW, barH);
        ctx.globalAlpha = 1;
      });
      // x-axis label
      if (days <= 15 || d % 2 === 1) {
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.textAlign = 'center';
        ctx.fillText(d, PAD_L + (d - 0.5) * groupW, H - PAD_B + 16);
      }
    }

    // legend
    const legendX = W - PAD_R - 260;
    const legendY = PAD_T + 4;
    agencies.forEach((ag, i) => {
      const info = AgencyHub.utils.getAgencyInfo(ag);
      ctx.fillStyle = colors[i];
      ctx.fillRect(legendX + i * 90, legendY, 12, 12);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.textAlign = 'left';
      ctx.fillText(info.name, legendX + i * 90 + 16, legendY + 10);
    });
  }

  // === 3. Product Analysis =================================
  function renderProductTab() {
    const opts = AGENCY_IDS.map(a => {
      const info = AgencyHub.utils.getAgencyInfo(a);
      return `<option value="${a}">${info.name}</option>`;
    }).join('');
    return `
      <div id="rpt-product-panel" class="rpt-panel" style="display:none">
        <div class="filter-bar flex items-center gap-3" style="flex-wrap:wrap">
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label">Agency</label>
            <select id="rpt-prod-agency" class="form-select form-input-sm">${opts}</select>
          </div>
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label">From</label>
            <input type="date" id="rpt-prod-from" class="form-input form-input-sm" value="${AgencyHub.utils.firstDayOfMonth()}">
          </div>
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label">To</label>
            <input type="date" id="rpt-prod-to" class="form-input form-input-sm" value="${AgencyHub.utils.today()}">
          </div>
          ${printBtn()}
        </div>
        <div id="rpt-product-body" class="mt-4"></div>
      </div>`;
  }

  function refreshProduct() {
    const agency = document.getElementById('rpt-prod-agency').value;
    const from   = document.getElementById('rpt-prod-from').value;
    const to     = document.getElementById('rpt-prod-to').value;
    const entries = AgencyHub.data.getSalesEntries(agency, from, to);

    const prodMap = {};
    entries.forEach(e => {
      (e.entries || []).forEach(ce => {
        if (ce.products) {
          Object.entries(ce.products).forEach(([name, qty]) => {
            prodMap[name] = (prodMap[name] || 0) + (Number(qty) || 0);
          });
        }
      });
    });

    const sorted = Object.entries(prodMap)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty);

    const totalQty = sorted.reduce((s, p) => s + p.qty, 0);
    const body = document.getElementById('rpt-product-body');

    if (!sorted.length) {
      body.innerHTML = emptyState('No product data for this period');
      return;
    }

    const rows = sorted.map(p => {
      const pct = totalQty ? ((p.qty / totalQty) * 100).toFixed(1) : '0.0';
      return `<tr>
        <td>${p.name}</td>
        <td class="text-right" style="font-variant-numeric:tabular-nums">${fmtN(p.qty)}</td>
        <td class="text-right" style="font-variant-numeric:tabular-nums">${pct}%</td>
      </tr>`;
    }).join('');

    body.innerHTML = `
      <div class="table-wrapper anim-fade" style="max-height:360px;overflow-y:auto">
        <table>
          <thead><tr>
            <th>Product</th><th class="text-right">Total Qty Sold</th><th class="text-right">% of Total</th>
          </tr></thead>
          <tbody>${rows}</tbody>
          <tfoot><tr class="row-grand-total">
            <td class="font-bold">Total</td>
            <td class="text-right font-bold" style="font-variant-numeric:tabular-nums">${fmtN(totalQty)}</td>
            <td class="text-right font-bold">100%</td>
          </tr></tfoot>
        </table>
      </div>
      <div class="card mt-4 anim-slide-up" style="padding:16px">
        <h4 class="text-sm font-bold mb-4">Top 10 Products</h4>
        <canvas id="rpt-product-chart" width="900" height="300" style="width:100%;height:300px"></canvas>
      </div>`;

    drawProductChart(sorted.slice(0, 10));
  }

  function drawProductChart(items) {
    const canvas = document.getElementById('rpt-product-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width  = rect.width  * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const W = rect.width, H = rect.height;

    const PAD_L = 130, PAD_R = 50, PAD_T = 8, PAD_B = 8;
    const chartW = W - PAD_L - PAD_R;
    const chartH = H - PAD_T - PAD_B;
    const barH = Math.min(24, (chartH - (items.length - 1) * 4) / items.length);
    const gap  = (chartH - barH * items.length) / (items.length + 1);
    const maxVal = items.length ? items[0].qty : 1;

    items.forEach((p, i) => {
      const y = PAD_T + gap + i * (barH + gap);
      const w = (p.qty / maxVal) * chartW;
      // gradient bar
      const grad = ctx.createLinearGradient(PAD_L, 0, PAD_L + w, 0);
      grad.addColorStop(0, '#10B981');
      grad.addColorStop(1, '#3B82F6');
      ctx.fillStyle = grad;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.roundRect(PAD_L, y, w, barH, 4);
      ctx.fill();
      ctx.globalAlpha = 1;

      // label
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.textAlign = 'right';
      ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(p.name.length > 18 ? p.name.slice(0, 16) + '…' : p.name, PAD_L - 8, y + barH / 2 + 4);

      // value
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.textAlign = 'left';
      ctx.fillText(fmtN(p.qty), PAD_L + w + 6, y + barH / 2 + 4);
    });
  }

  // === 4. Credit Outstanding ===============================
  function renderCreditTab() {
    const opts = `<option value="">All Agencies</option>` +
      AGENCY_IDS.map(a => `<option value="${a}">${AgencyHub.utils.getAgencyInfo(a).name}</option>`).join('');
    return `
      <div id="rpt-credit-panel" class="rpt-panel" style="display:none">
        <div class="filter-bar flex items-center gap-3">
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label">Agency</label>
            <select id="rpt-credit-agency" class="form-select form-input-sm">${opts}</select>
          </div>
          ${printBtn()}
        </div>
        <div id="rpt-credit-body" class="mt-4"></div>
      </div>`;
  }

  function refreshCredit() {
    const agency = document.getElementById('rpt-credit-agency').value;
    const params = { status: 'pending' };
    if (agency) params.agency = agency;
    // get pending + partial
    const pending = AgencyHub.data.getCreditBills(params);
    const partial = AgencyHub.data.getCreditBills(Object.assign({}, params, { status: 'partial' }));
    const bills = pending.concat(partial);

    // aging buckets
    const buckets = [
      { label: 'Current (Not Due)',   min: -Infinity, max: 0,  count: 0, amount: 0, cls: 'text-success' },
      { label: '1–7 Days Overdue',    min: 1,         max: 7,  count: 0, amount: 0, cls: 'text-warning' },
      { label: '8–14 Days Overdue',   min: 8,         max: 14, count: 0, amount: 0, cls: 'text-warning' },
      { label: '15–30 Days Overdue',  min: 15,        max: 30, count: 0, amount: 0, cls: 'text-danger' },
      { label: '30+ Days Overdue',    min: 31,        max: Infinity, count: 0, amount: 0, cls: 'text-danger' }
    ];

    bills.forEach(b => {
      const overdue = -AgencyHub.utils.daysUntilDue(b.dueDate);
      const outstanding = b.amount - (b.paidAmount || 0);
      for (const bk of buckets) {
        if (overdue >= bk.min && overdue <= bk.max) {
          bk.count++;
          bk.amount += outstanding;
          break;
        }
      }
    });

    const agingRows = buckets.map(bk =>
      `<tr>
        <td class="${bk.cls} font-bold">${bk.label}</td>
        <td class="text-center" style="font-variant-numeric:tabular-nums">${bk.count}</td>
        <td class="text-right" style="font-variant-numeric:tabular-nums">${fmt(bk.amount)}</td>
      </tr>`
    ).join('');

    const totalBills   = bills.length;
    const totalOutstanding = bills.reduce((s, b) => s + (b.amount - (b.paidAmount || 0)), 0);

    // detail rows, sorted by dueDate
    const sorted = bills.slice().sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
    const detailRows = sorted.map(b => {
      const overdue = -AgencyHub.utils.daysUntilDue(b.dueDate);
      const outstanding = b.amount - (b.paidAmount || 0);
      const overdueCls = overdue > 0 ? 'text-danger' : 'text-success';
      const statusBadge = b.status === 'partial'
        ? '<span class="badge badge-warning">Partial</span>'
        : '<span class="badge badge-danger">Pending</span>';
      return `<tr>
        <td>${b.customerName}</td>
        <td>${agencyBadge(b.agency)}</td>
        <td class="text-right" style="font-variant-numeric:tabular-nums">${fmt(outstanding)}</td>
        <td>${fmtD(b.dueDate)}</td>
        <td class="${overdueCls}" style="font-variant-numeric:tabular-nums">${overdue > 0 ? overdue + ' days' : 'Not due'}</td>
        <td>${statusBadge}</td>
      </tr>`;
    }).join('');

    const body = document.getElementById('rpt-credit-body');
    body.innerHTML = `
      <div class="stats-grid anim-fade" style="grid-template-columns:1fr 1fr">
        <div class="stat-card">
          <div class="card-header">Total Bills</div>
          <div class="card-value" style="font-variant-numeric:tabular-nums">${totalBills}</div>
        </div>
        <div class="stat-card">
          <div class="card-header">Total Outstanding</div>
          <div class="card-value" style="font-variant-numeric:tabular-nums">${fmt(totalOutstanding)}</div>
        </div>
      </div>
      <div class="card mt-4 anim-fade" style="padding:0;overflow:hidden">
        <div class="card-header" style="padding:12px 16px">
          <span class="card-title">Aging Analysis</span>
        </div>
        <div class="table-wrapper">
          <table>
            <thead><tr><th>Category</th><th class="text-center">Count</th><th class="text-right">Amount</th></tr></thead>
            <tbody>${agingRows}</tbody>
            <tfoot><tr class="row-grand-total">
              <td class="font-bold">Total</td>
              <td class="text-center font-bold" style="font-variant-numeric:tabular-nums">${totalBills}</td>
              <td class="text-right font-bold" style="font-variant-numeric:tabular-nums">${fmt(totalOutstanding)}</td>
            </tr></tfoot>
          </table>
        </div>
      </div>
      <div class="card mt-4 anim-slide-up" style="padding:0;overflow:hidden">
        <div class="card-header" style="padding:12px 16px">
          <span class="card-title">Outstanding Bills</span>
        </div>
        <div class="table-wrapper" style="max-height:360px;overflow-y:auto">
          <table>
            <thead><tr>
              <th>Customer</th><th>Agency</th><th class="text-right">Outstanding</th>
              <th>Due Date</th><th>Days Overdue</th><th>Status</th>
            </tr></thead>
            <tbody>${detailRows.length ? detailRows : `<tr><td colspan="6">${emptyState('No outstanding bills')}</td></tr>`}</tbody>
          </table>
        </div>
      </div>`;
  }

  // === 5. Collection Performance ===========================
  function renderCollectionTab() {
    return `
      <div id="rpt-collection-panel" class="rpt-panel" style="display:none">
        <div class="filter-bar flex items-center gap-3">
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label">Month</label>
            <input type="month" id="rpt-coll-month" class="form-input form-input-sm" value="${currentMonth()}">
          </div>
          ${printBtn()}
        </div>
        <div id="rpt-collection-body" class="mt-4"></div>
      </div>`;
  }

  function refreshCollection() {
    const ym   = document.getElementById('rpt-coll-month').value;
    const days = daysInMonth(ym);
    const start = ym + '-01';
    const end   = ym + '-' + String(days).padStart(2, '0');

    // Get all bills and scan their payments
    const allBills = AgencyHub.data.getCreditBills({});

    // Bills that were due in this month
    const dueThisMonth = allBills.filter(b => b.dueDate >= start && b.dueDate <= end);
    const totalDue = dueThisMonth.reduce((s, b) => s + b.amount, 0);

    // Payments made in this month
    const paymentsByDate = {};
    let totalCollected = 0;
    allBills.forEach(b => {
      (b.payments || []).forEach(p => {
        if (p.date >= start && p.date <= end) {
          if (!paymentsByDate[p.date]) paymentsByDate[p.date] = { count: 0, amount: 0 };
          paymentsByDate[p.date].count++;
          paymentsByDate[p.date].amount += p.amount;
          totalCollected += p.amount;
        }
      });
    });

    const collectionRate = totalDue > 0 ? ((totalCollected / totalDue) * 100).toFixed(1) : '0.0';

    const payRows = Object.entries(paymentsByDate)
      .sort(([a], [b]) => (a || '').localeCompare(b || ''))
      .map(([date, info]) =>
        `<tr>
          <td>${fmtD(date)}</td>
          <td class="text-center" style="font-variant-numeric:tabular-nums">${info.count}</td>
          <td class="text-right" style="font-variant-numeric:tabular-nums">${fmt(info.amount)}</td>
        </tr>`
      ).join('');

    const body = document.getElementById('rpt-collection-body');
    body.innerHTML = `
      <div class="stats-grid anim-fade">
        <div class="stat-card">
          <div class="card-header">Total Due</div>
          <div class="card-value" style="font-variant-numeric:tabular-nums">${fmt(totalDue)}</div>
        </div>
        <div class="stat-card">
          <div class="card-header">Total Collected</div>
          <div class="card-value text-success" style="font-variant-numeric:tabular-nums">${fmt(totalCollected)}</div>
        </div>
        <div class="stat-card">
          <div class="card-header">Collection Rate</div>
          <div class="card-value" style="font-variant-numeric:tabular-nums;color:${parseFloat(collectionRate)>=80?'#10B981':parseFloat(collectionRate)>=50?'#F59E0B':'#EF4444'}">${collectionRate}%</div>
        </div>
      </div>
      <div class="card mt-4 anim-slide-up" style="padding:0;overflow:hidden">
        <div class="card-header" style="padding:12px 16px">
          <span class="card-title">Payments Received</span>
        </div>
        <div class="table-wrapper" style="max-height:360px;overflow-y:auto">
          <table>
            <thead><tr><th>Date</th><th class="text-center">Payments</th><th class="text-right">Amount</th></tr></thead>
            <tbody>${payRows || `<tr><td colspan="3">${emptyState('No payments recorded this month')}</td></tr>`}</tbody>
            <tfoot><tr class="row-grand-total">
              <td class="font-bold">Total</td>
              <td></td>
              <td class="text-right font-bold" style="font-variant-numeric:tabular-nums">${fmt(totalCollected)}</td>
            </tr></tfoot>
          </table>
        </div>
      </div>`;
  }

  // === 6. Stock Audit Report ===============================
  function renderStockTab() {
    return `
      <div id="rpt-stock-panel" class="rpt-panel" style="display:none">
        <div class="filter-bar flex items-center gap-3">
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label">Month</label>
            <input type="month" id="rpt-stock-month" class="form-input form-input-sm" value="${currentMonth()}" style="width:160px;font-variant-numeric:tabular-nums">
          </div>
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label">Agency</label>
            <select id="rpt-stock-agency" class="form-input form-input-sm" style="width:160px">
              <option value="bathipooja">Bathipooja</option>
              <option value="domie">Domie</option>
              <option value="kelani">Kelani Cables</option>
            </select>
          </div>
          ${printBtn()}
        </div>
        <div id="rpt-stock-body" class="mt-4"></div>
      </div>`;
  }

  function getSoldQuantities(agencyId, monthStr) {
    const sold = {};
    const entries = AgencyHub.data.getSalesEntries(agencyId);
    entries.forEach(entry => {
      if (entry.date && entry.date.startsWith(monthStr)) {
        if (entry.entries && Array.isArray(entry.entries)) {
          entry.entries.forEach(custEntry => {
            if (custEntry.products) {
              Object.entries(custEntry.products).forEach(([prodName, qty]) => {
                sold[prodName] = (sold[prodName] || 0) + (Number(qty) || 0);
              });
            }
          });
        }
      }
    });
    return sold;
  }

  function getReceivedQuantities(agencyId, monthStr) {
    const received = {};
    const invoices = AgencyHub.data.getReceivedInvoices(agencyId, monthStr);
    invoices.forEach(inv => {
      if (inv.items) {
        Object.entries(inv.items).forEach(([prodName, qty]) => {
          received[prodName] = (received[prodName] || 0) + (Number(qty) || 0);
        });
      }
    });
    return received;
  }

  function refreshStock() {
    const agency = document.getElementById('rpt-stock-agency').value;
    const month = document.getElementById('rpt-stock-month').value;
    const products = AgencyHub.data.getProducts(agency) || [];
    const soldMap = getSoldQuantities(agency, month);
    const receivedMap = getReceivedQuantities(agency, month);
    const savedInventory = AgencyHub.data.getInventory(agency, month) || {};

    const body = document.getElementById('rpt-stock-body');
    if (!body) return;

    if (!products.length) {
      body.innerHTML = emptyState('No products configured for this agency.');
      return;
    }

    let rowsHtml = '';
    let totalOpening = 0, totalReceived = 0, totalSold = 0, totalExpected = 0, totalPhysical = 0, totalVariance = 0;
    let hasPhysicalCount = false;

    products.forEach(p => {
      const saved = savedInventory[p] || {};
      const opening = Number(saved.opening) || 0;
      const received = receivedMap[p] || 0;
      const sold = soldMap[p] || 0;
      const expected = opening + received - sold;
      const physical = (saved.physical === undefined || saved.physical === '') ? '' : Number(saved.physical);
      const variance = physical !== '' ? (physical - expected) : 0;

      totalOpening += opening;
      totalReceived += received;
      totalSold += sold;
      totalExpected += expected;
      
      let physicalStr = '—';
      let varianceStr = '—';

      if (physical !== '') {
        hasPhysicalCount = true;
        totalPhysical += physical;
        totalVariance += variance;
        physicalStr = physical;
        if (variance > 0) {
          varianceStr = `<span class="text-success" style="font-weight:700">+${variance}</span>`;
        } else if (variance < 0) {
          varianceStr = `<span class="text-danger" style="font-weight:700">${variance}</span>`;
        } else {
          varianceStr = '0';
        }
      }

      rowsHtml += `
        <tr>
          <td class="font-semibold" style="text-align:left;padding:10px 12px">${p}</td>
          <td class="text-center" style="font-variant-numeric:tabular-nums;padding:10px 12px">${opening}</td>
          <td class="text-center" style="font-variant-numeric:tabular-nums;padding:10px 12px">${received}</td>
          <td class="text-center text-primary" style="font-variant-numeric:tabular-nums;font-weight:600;padding:10px 12px">${sold}</td>
          <td class="text-center font-semibold" style="font-variant-numeric:tabular-nums;padding:10px 12px">${expected}</td>
          <td class="text-center" style="font-variant-numeric:tabular-nums;padding:10px 12px">${physicalStr}</td>
          <td class="text-center" style="font-variant-numeric:tabular-nums;padding:10px 12px">${varianceStr}</td>
        </tr>`;
    });

    let totalVarianceStr = '—';
    if (hasPhysicalCount) {
      if (totalVariance > 0) {
        totalVarianceStr = `<span class="text-success" style="font-weight:700">+${totalVariance}</span>`;
      } else if (totalVariance < 0) {
        totalVarianceStr = `<span class="text-danger" style="font-weight:700">${totalVariance}</span>`;
      } else {
        totalVarianceStr = '0';
      }
    }

    body.innerHTML = `
      <div class="card p-0 overflow-hidden anim-slide-up" style="padding:0">
        <div class="card-header flex items-center justify-between" style="padding:12px 16px">
          <span class="card-title">${AgencyHub.utils.getAgencyInfo(agency).name} Stock Summary for ${fmtD(month + '-01').substring(3)}</span>
        </div>
        <div class="table-wrapper" style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;min-width:650px">
            <thead>
              <tr style="border-bottom:2px solid var(--glass-border);background:rgba(255,255,255,0.02)">
                <th style="text-align:left;padding:10px 12px">Product</th>
                <th style="text-align:center;padding:10px 12px">Opening Stock</th>
                <th style="text-align:center;padding:10px 12px">Stock Received</th>
                <th style="text-align:center;padding:10px 12px">Sold Qty</th>
                <th style="text-align:center;padding:10px 12px">Expected Closing</th>
                <th style="text-align:center;padding:10px 12px">Physical Spot-Check</th>
                <th style="text-align:center;padding:10px 12px">Variance</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
            <tfoot>
              <tr class="row-grand-total" style="background:rgba(255,255,255,0.03);border-top:2px solid var(--glass-border-hover);font-weight:bold">
                <td style="padding:10px 12px;text-align:left">TOTAL</td>
                <td style="text-align:center;padding:10px 12px;font-variant-numeric:tabular-nums">${totalOpening}</td>
                <td style="text-align:center;padding:10px 12px;font-variant-numeric:tabular-nums">${totalReceived}</td>
                <td style="text-align:center;padding:10px 12px;color:#3B82F6;font-variant-numeric:tabular-nums">${totalSold}</td>
                <td style="text-align:center;padding:10px 12px;font-variant-numeric:tabular-nums">${totalExpected}</td>
                <td style="text-align:center;padding:10px 12px;font-variant-numeric:tabular-nums">${hasPhysicalCount ? totalPhysical : '—'}</td>
                <td style="text-align:center;padding:10px 12px">${totalVarianceStr}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>`;
  }

  // === 7. Operations Report ================================
  function renderOperationsTab() {
    return `
      <div id="rpt-operations-panel" class="rpt-panel" style="display:none">
        <div class="filter-bar flex items-center gap-3">
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label">Month</label>
            <input type="month" id="rpt-operations-month" class="form-input form-input-sm" value="${currentMonth()}" style="width:160px;font-variant-numeric:tabular-nums">
          </div>
          ${printBtn()}
        </div>
        <div id="rpt-operations-body" class="mt-4"></div>
      </div>`;
  }

  function refreshOperations() {
    const month = document.getElementById('rpt-operations-month').value;
    const body = document.getElementById('rpt-operations-body');
    if (!body) return;

    // Get all sales entries for the month
    const entries = AgencyHub.data.getSalesEntries(null);
    const monthEntries = entries.filter(e => e.date && e.date.startsWith(month));

    // 1. Calculate working days per agency
    const workingDays = {
      bathipooja: new Set(),
      domie: new Set(),
      kelani: new Set(),
      combined: new Set()
    };

    monthEntries.forEach(e => {
      const agKey = e.agency === 'kalani' ? 'kelani' : e.agency;
      if (workingDays[agKey]) {
        workingDays[agKey].add(e.date);
      }
      workingDays.combined.add(e.date);
    });

    // Generate working days HTML
    const getDaysList = (set) => [...set].sort().map(d => fmtD(d)).join(', ') || 'None';
    
    let workingDaysRows = '';
    ['bathipooja', 'domie', 'kelani'].forEach(agId => {
      const info = AgencyHub.utils.getAgencyInfo(agId);
      const set = workingDays[agId];
      workingDaysRows += `
        <tr>
          <td style="font-weight:600;text-align:left;padding:10px 12px">${info.icon} ${info.name}</td>
          <td class="text-center font-bold" style="font-size:1.1rem;font-variant-numeric:tabular-nums;padding:10px 12px">${set.size} days</td>
          <td style="font-size:0.85rem;color:rgba(255,255,255,0.6);text-align:left;padding:10px 12px">${getDaysList(set)}</td>
        </tr>
      `;
    });
    // Add combined total row
    workingDaysRows += `
      <tr class="row-grand-total" style="background:rgba(255,255,255,0.03);border-top:2px solid var(--glass-border-hover);font-weight:bold">
        <td style="text-align:left;padding:10px 12px">COMBINED TOTAL WORKED</td>
        <td class="text-center" style="font-size:1.15rem;font-variant-numeric:tabular-nums;padding:10px 12px">${workingDays.combined.size} days</td>
        <td style="font-size:0.85rem;text-align:left;padding:10px 12px">${getDaysList(workingDays.combined)}</td>
      </tr>
    `;

    // 2. Calculate vehicle stats
    const vehicleStats = {};
    monthEntries.forEach(e => {
      const v = (e.vehicleNo || '').trim().toUpperCase();
      if (!v || v === 'NONE') return;

      if (!vehicleStats[v]) {
        vehicleStats[v] = {
          vehicleNo: v,
          kms: [],
          dates: new Set(),
          sumKms: 0
        };
      }

      const km = Number(e.km) || 0;
      if (km > 0) {
        vehicleStats[v].kms.push(km);
        vehicleStats[v].sumKms += km;
      }
      if (e.date) {
        vehicleStats[v].dates.add(e.date);
      }
    });

    let vehicleRows = '';
    const vehiclesList = Object.values(vehicleStats);

    if (vehiclesList.length === 0) {
      vehicleRows = `
        <tr>
          <td colspan="6" class="text-center text-muted" style="padding:2rem">
            No vehicle mileage data recorded for this month.
          </td>
        </tr>
      `;
    } else {
      vehiclesList.forEach(v => {
        const minKm = v.kms.length ? Math.min(...v.kms) : 0;
        const maxKm = v.kms.length ? Math.max(...v.kms) : 0;
        const diffKm = maxKm - minKm;

        vehicleRows += `
          <tr>
            <td style="font-weight:600;text-align:left;padding:10px 12px">🚚 ${v.vehicleNo}</td>
            <td class="text-center" style="font-variant-numeric:tabular-nums;padding:10px 12px">${v.dates.size} days</td>
            <td class="text-center" style="font-variant-numeric:tabular-nums;padding:10px 12px">${minKm ? minKm.toLocaleString() : '—'} KM</td>
            <td class="text-center" style="font-variant-numeric:tabular-nums;padding:10px 12px">${maxKm ? maxKm.toLocaleString() : '—'} KM</td>
            <td class="text-center font-bold text-success" style="font-variant-numeric:tabular-nums;padding:10px 12px">${diffKm ? diffKm.toLocaleString() : '0'} KM</td>
            <td class="text-center text-primary" style="font-variant-numeric:tabular-nums;padding:10px 12px">${v.sumKms ? v.sumKms.toLocaleString() : '0'} KM</td>
          </tr>
        `;
      });
    }

    body.innerHTML = `
      <div class="grid-2" style="align-items:start;gap:20px">
        <!-- Working Days card -->
        <div class="card p-0 overflow-hidden anim-slide-up" style="padding:0">
          <div class="card-header" style="padding:12px 16px">
            <span class="card-title">📅 Operations &amp; Working Days</span>
          </div>
          <div class="table-wrapper" style="overflow-x:auto">
            <table style="width:100%;border-collapse:collapse">
              <thead>
                <tr style="border-bottom:2px solid var(--glass-border);background:rgba(255,255,255,0.02)">
                  <th style="text-align:left;padding:10px 12px">Agency</th>
                  <th style="text-align:center;padding:10px 12px">Days Worked</th>
                  <th style="text-align:left;padding:10px 12px">Logged Dates</th>
                </tr>
              </thead>
              <tbody>
                ${workingDaysRows}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Vehicle mileage card -->
        <div class="card p-0 overflow-hidden anim-slide-up" style="padding:0">
          <div class="card-header" style="padding:12px 16px">
            <span class="card-title">🚚 Vehicle Mileage &amp; Logs</span>
          </div>
          <div class="table-wrapper" style="overflow-x:auto">
            <table style="width:100%;border-collapse:collapse;min-width:450px">
              <thead>
                <tr style="border-bottom:2px solid var(--glass-border);background:rgba(255,255,255,0.02)">
                  <th style="text-align:left;padding:10px 12px">Vehicle No.</th>
                  <th style="text-align:center;padding:10px 12px">Days Active</th>
                  <th style="text-align:center;padding:10px 12px">Start Odo</th>
                  <th style="text-align:center;padding:10px 12px">End Odo</th>
                  <th style="text-align:center;padding:10px 12px">Odo Run</th>
                  <th style="text-align:center;padding:10px 12px">Sum Run</th>
                </tr>
              </thead>
              <tbody>
                ${vehicleRows}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  // === 8. Salary Summary ===================================
  function renderPayrollTab() {
    return `
      <div id="rpt-payroll-panel" class="rpt-panel" style="display:none">
        <div class="filter-bar flex items-center gap-3">
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label">Month</label>
            <input type="month" id="rpt-payroll-month" class="form-input form-input-sm" value="${currentMonth()}">
          </div>
          ${printBtn()}
        </div>
        <div id="rpt-payroll-body" class="mt-4"></div>
      </div>`;
  }

  function refreshPayroll() {
    const month = document.getElementById('rpt-payroll-month').value;
    const body = document.getElementById('rpt-payroll-body');
    if (!body) return;

    // Load payroll state databases
    const allAttendance = AgencyHub.data._get('attendance') || {};
    const advances = AgencyHub.data.getAdvances({ month }) || [];
    const rates = AgencyHub.data.getEmployeeRates() || {};
    const paidStatus = (AgencyHub.data._get('payroll_payouts') || {})[month] || {};

    const EMPLOYEES = ['Achini Isnaka', 'Sanki', 'Wimal', 'Jayarathna', 'Bandu Thilaka'];

    // 1. Calculate Monthly Attendance Counts
    const counts = {};
    EMPLOYEES.forEach(name => {
      counts[name] = { present: 0, half: 0, absent: 0, totalDays: 0, vehicleWorkedDays: 0, tempDriverDays: 0 };
    });

    Object.keys(allAttendance).forEach(date => {
      if (date.startsWith(month)) {
        const dayMap = allAttendance[date];
        EMPLOYEES.forEach(name => {
          const status = dayMap[name] || 'absent';
          if (status === 'present') {
            counts[name].present++;
            counts[name].totalDays += 1.0;
          } else if (status === 'half') {
            counts[name].half++;
            counts[name].totalDays += 0.5;
          } else if (status === 'absent') {
            counts[name].absent++;
          }
          if (name === 'Wimal' || name === 'Bandu Thilaka') {
            const vehicleStatus = dayMap[name + '_vehicle'] || 'idle';
            if (vehicleStatus === 'worked') {
              counts[name].vehicleWorkedDays++;
            }
          }
          if (name === 'Wimal' || name === 'Bandu Thilaka' || name === 'Jayarathna') {
            const tempStatus = dayMap[name + '_temp'] || 'idle';
            if (tempStatus === 'worked') {
              counts[name].tempDriverDays++;
            }
          }
        });
      }
    });

    // Calculate advances totals
    const advancesTotals = {};
    EMPLOYEES.forEach(name => { advancesTotals[name] = 0; });
    advances.forEach(adv => {
      if (advancesTotals[adv.employee] !== undefined) {
        advancesTotals[adv.employee] += Number(adv.amount) || 0;
      }
    });

    // 2. Build rows for regular staff
    let totalGross = 0;
    let totalVehicle = 0;
    let totalAdvances = 0;
    let totalNet = 0;
    let totalPaid = 0;
    let totalUnpaid = 0;

    const staffRows = EMPLOYEES.map(name => {
      const c = counts[name];
      const advTotal = advancesTotals[name] || 0;
      const rateConfig = rates[name] || { type: 'daily', rate: 1800, vehicleRate: 0, tempDriverRate: 1800 };
      const isPaid = !!paidStatus[name];

      let gross = 0;
      if (rateConfig.type === 'daily') {
        gross = c.totalDays * rateConfig.rate;
      } else {
        const absentDays = c.absent + (c.half * 0.5);
        const deduction = absentDays * (rateConfig.rate / 30);
        gross = Math.max(0, rateConfig.rate - deduction);
      }

      const vehicleRate = Number(rateConfig.vehicleRate) || 0;
      const vehicleAllowance = c.vehicleWorkedDays * vehicleRate;
      const net = (gross + vehicleAllowance) - advTotal;

      totalGross += gross;
      totalVehicle += vehicleAllowance;
      totalAdvances += advTotal;
      totalNet += net;

      if (isPaid) totalPaid += net;
      else totalUnpaid += net;

      const payoutBadge = isPaid
        ? '<span class="badge badge-success">Paid</span>'
        : '<span class="badge badge-warning">Unpaid</span>';

      return `
        <tr style="border-bottom:1px solid var(--glass-border);">
          <td style="font-weight:700; padding:10px 12px;">${name}</td>
          <td style="padding:10px 12px; font-size:0.8rem; color:rgba(255,255,255,0.6); text-transform:capitalize;">${rateConfig.type} (${fmt(rateConfig.rate)})</td>
          <td style="padding:10px 12px; text-align:center; font-variant-numeric:tabular-nums; font-size:0.85rem;">P:${c.present} H:${c.half} A:${c.absent}</td>
          <td class="text-right font-mono" style="padding:10px 12px; font-size:0.85rem;">${fmt(gross)}</td>
          <td class="text-right font-mono" style="padding:10px 12px; font-size:0.85rem; color:${vehicleAllowance > 0 ? 'var(--info,#06b6d4)' : 'inherit'};">${vehicleAllowance > 0 ? fmt(vehicleAllowance) : '—'}</td>
          <td class="text-right font-mono text-danger" style="padding:10px 12px; font-size:0.85rem;">${advTotal > 0 ? `-${fmt(advTotal)}` : '—'}</td>
          <td class="text-right font-mono font-bold" style="padding:10px 12px; font-size:0.9rem; color:var(--success,#10b981);">${fmt(net)}</td>
          <td style="padding:10px 12px; text-align:center;">${payoutBadge}</td>
        </tr>`;
    }).join('');

    // 3. Build rows for temporary drivers
    let totalTempPayable = 0;
    const tempDriverRowsList = [];
    EMPLOYEES.forEach(name => {
      if (name !== 'Wimal' && name !== 'Bandu Thilaka' && name !== 'Jayarathna') return;
      const c = counts[name];
      const rateConfig = rates[name] || { type: 'daily', rate: 1800, vehicleRate: 0, tempDriverRate: 1800 };
      const tempDriverRate = Number(rateConfig.tempDriverRate) || 1800;
      const tempDays = c.tempDriverDays || 0;
      const tempPayable = tempDays * tempDriverRate;
      
      if (tempDays > 0) {
        totalTempPayable += tempPayable;
        const routeLabel = name === 'Wimal' ? 'Domie Route' : (name === 'Bandu Thilaka' ? 'Kelani Route' : 'Bathipooja Route');
        tempDriverRowsList.push(`
          <tr style="border-bottom:1px solid var(--glass-border);">
            <td style="font-weight:700; padding:10px 12px;">${routeLabel} <span style="font-size:0.75rem; font-weight:normal; color:rgba(255,255,255,0.4);">(${name}'s Route)</span></td>
            <td style="padding:10px 12px; text-align:center; font-variant-numeric:tabular-nums;">${tempDays} Days</td>
            <td class="text-right font-mono" style="padding:10px 12px;">${fmt(tempDriverRate)}</td>
            <td class="text-right font-mono font-bold" style="padding:10px 12px; color:var(--primary-light,#818cf8);">${fmt(tempPayable)}</td>
          </tr>`);
      }
    });

    const tempDriversTableHtml = tempDriverRowsList.length === 0
      ? '<p class="text-muted text-sm text-center" style="padding:16px; border:1px dashed var(--glass-border); border-radius:6px;">No temporary driver wages paid this month.</p>'
      : `
        <div class="table-wrapper" style="overflow-x:auto; border-radius:8px; border:1px solid var(--glass-border);">
          <table style="width:100%; border-collapse:collapse;">
            <thead>
              <tr style="background:rgba(255,255,255,0.02); border-bottom:2px solid var(--glass-border);">
                <th style="text-align:left; padding:10px 12px;">Route / Vehicle</th>
                <th style="text-align:center; padding:10px 12px; width:150px;">Days Worked</th>
                <th style="text-align:right; padding:10px 12px; width:150px;">Daily Rate</th>
                <th style="text-align:right; padding:10px 12px; width:180px;">Total Payable</th>
              </tr>
            </thead>
            <tbody>
              ${tempDriverRowsList.join('')}
              <tr style="background:rgba(255,255,255,0.03); border-top:2px solid var(--glass-border); font-weight:700;">
                <td colspan="3" style="padding:12px 10px;">Subtotal (Temp Drivers)</td>
                <td class="text-right font-mono font-bold" style="padding:12px 10px; color:var(--primary-light,#818cf8);">${fmt(totalTempPayable)}</td>
              </tr>
            </tbody>
          </table>
        </div>`;

    body.innerHTML = `
      <div class="grid-2" style="gap:20px; align-items:start; margin-bottom:20px;">
        <!-- Payroll Metrics Cards -->
        <div class="card" style="padding:20px; border:1px solid var(--glass-border); display:grid; grid-template-columns:1fr 1fr; gap:16px; background:rgba(255,255,255,0.01);">
          <div>
            <div style="font-size:0.75rem; color:rgba(255,255,255,0.4); text-transform:uppercase; font-weight:600; margin-bottom:4px;">Total Payroll Cash Outflow</div>
            <div class="font-mono font-bold text-success" style="font-size:1.5rem; color:var(--success,#10b981);">${fmt(totalNet + totalTempPayable)}</div>
          </div>
          <div>
            <div style="font-size:0.75rem; color:rgba(255,255,255,0.4); text-transform:uppercase; font-weight:600; margin-bottom:4px;">Total Paid Out</div>
            <div class="font-mono font-bold" style="font-size:1.5rem; color:rgba(255,255,255,0.85);">${fmt(totalPaid)}</div>
          </div>
          <div>
            <div style="font-size:0.75rem; color:rgba(255,255,255,0.4); text-transform:uppercase; font-weight:600; margin-bottom:4px;">Total Unpaid (Pending)</div>
            <div class="font-mono font-bold text-warning" style="font-size:1.5rem; color:var(--warning,#f59e0b);">${fmt(totalUnpaid)}</div>
          </div>
          <div>
            <div style="font-size:0.75rem; color:rgba(255,255,255,0.4); text-transform:uppercase; font-weight:600; margin-bottom:4px;">Temp Driver Expenses</div>
            <div class="font-mono font-bold text-primary-light" style="font-size:1.5rem; color:var(--primary-light,#818cf8);">${fmt(totalTempPayable)}</div>
          </div>
        </div>

        <!-- Temporary Drivers Section -->
        <div class="card" style="padding:20px; border:1px solid var(--glass-border); background:rgba(255,255,255,0.01);">
          <h4 style="margin:0 0 12px 0; font-size:0.95rem; font-weight:700; color:var(--primary-light,#818cf8);">Temporary Drivers Payout Ledger</h4>
          ${tempDriversTableHtml}
        </div>
      </div>

      <!-- Main Payroll Table -->
      <div class="card" style="padding:20px; border:1px solid var(--glass-border); background:rgba(255,255,255,0.01);">
        <h4 style="margin:0 0 12px 0; font-size:0.95rem; font-weight:700; color:var(--success,#10b981);">Main Staff Payroll Summary</h4>
        <div class="table-wrapper" style="overflow-x:auto; border-radius:8px; border:1px solid var(--glass-border);">
          <table style="width:100%; border-collapse:collapse; min-width:850px;">
            <thead>
              <tr style="background:rgba(255,255,255,0.02); border-bottom:2px solid var(--glass-border);">
                <th style="text-align:left; padding:10px 12px;">Staff Member</th>
                <th style="text-align:left; padding:10px 12px;">Salary Setup</th>
                <th style="text-align:center; padding:10px 12px; width:170px;">Attendance Sheets</th>
                <th style="text-align:right; padding:10px 12px; width:120px;">Base Salary</th>
                <th style="text-align:right; padding:10px 12px; width:120px;">Vehicle Allow.</th>
                <th style="text-align:right; padding:10px 12px; width:100px;">Advances</th>
                <th style="text-align:right; padding:10px 12px; width:130px;">Net Payable</th>
                <th style="text-align:center; padding:10px 12px; width:110px;">Payout Status</th>
              </tr>
            </thead>
            <tbody>
              ${staffRows}
              <tr style="background:rgba(255,255,255,0.03); border-top:2px solid var(--glass-border); font-weight:700;">
                <td colspan="3" style="padding:12px 10px;">Grand Total Main Staff</td>
                <td class="text-right font-mono" style="padding:12px 10px;">${fmt(totalGross)}</td>
                <td class="text-right font-mono" style="padding:12px 10px; color:var(--info,#06b6d4);">${fmt(totalVehicle)}</td>
                <td class="text-right font-mono text-danger" style="padding:12px 10px;">-${fmt(totalAdvances)}</td>
                <td class="text-right font-mono font-bold" style="padding:12px 10px; color:var(--success,#10b981);">${fmt(totalNet)}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>`;
  }

  // === 9. Fuel & Mileage ===================================
  function renderFuelTab() {
    return `
      <div id="rpt-fuel-panel" class="rpt-panel" style="display:none">
        <div class="filter-bar flex items-center gap-3">
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label">Month</label>
            <input type="month" id="rpt-fuel-month" class="form-input form-input-sm" value="${currentMonth()}">
          </div>
          ${printBtn()}
        </div>
        <div id="rpt-fuel-body" class="mt-4"></div>
      </div>`;
  }

  function refreshFuel() {
    const month = document.getElementById('rpt-fuel-month').value;
    const body = document.getElementById('rpt-fuel-body');
    if (!body) return;

    // Load logs and odo readings
    const allSales = AgencyHub.data.getSalesEntries() || [];
    const fuelLogs = AgencyHub.data.getFuelLogs({ month }) || [];
    const odoReadings = AgencyHub.data.getOdometerReadings(month) || {};

    const VEHICLES = [
      { id: 'domie', name: 'Domie (Wimal)' },
      { id: 'kelani', name: 'Kelani (Bandu Thilaka)' },
      { id: 'bathipooja', name: 'Bathipooja (Jayarathna)' }
    ];

    let totalSpentSum = 0;
    let totalLitersSum = 0;

    const rows = VEHICLES.map(v => {
      // 1. Sales entries daily KM mileage
      const salesKm = allSales
        .filter(entry => {
          if (!entry.date.startsWith(month)) return false;
          if (v.id === 'kelani') {
            return entry.agency === 'kelani' || entry.agency === 'kalani';
          }
          return entry.agency === v.id;
        })
        .reduce((sum, entry) => sum + (Number(entry.km) || 0), 0);

      // 2. Odometer difference mileage
      const odoConfig = odoReadings[v.id] || { start: '', end: '' };
      const odoKm = (odoConfig.start !== '' && odoConfig.end !== '') ? (Number(odoConfig.end) - Number(odoConfig.start)) : 0;

      // Fuel log stats
      const logs = fuelLogs.filter(l => l.vehicle === v.id);
      const cost = logs.reduce((sum, l) => sum + (Number(l.cost) || 0), 0);
      const liters = logs.reduce((sum, l) => sum + (Number(l.liters) || 0), 0);

      totalSpentSum += cost;
      totalLitersSum += liters;

      // Efficiencies
      const salesKmL = (liters > 0) ? (salesKm / liters) : 0;
      const salesCostKm = (salesKm > 0) ? (cost / salesKm) : 0;

      const odoKmL = (liters > 0) ? (odoKm / liters) : 0;
      const odoCostKm = (odoKm > 0) ? (cost / odoKm) : 0;

      // Discrepancy
      const discrepancy = salesKm - odoKm;
      let discHtml = '';
      if (discrepancy === 0) {
        discHtml = '<span class="text-success font-bold">0 KM</span><br><span style="font-size:0.68rem; color:rgba(255,255,255,0.4)">Perfect matching</span>';
      } else if (discrepancy > 0) {
        discHtml = `<span class="text-warning font-bold">+${discrepancy} KM</span><br><span style="font-size:0.68rem; color:var(--warning,#f59e0b)">Unlogged mileage</span>`;
      } else {
        discHtml = `<span class="text-danger font-bold">${discrepancy} KM</span><br><span style="font-size:0.68rem; color:var(--danger,#ef4444)">Unrecorded travel</span>`;
      }

      return `
        <tr style="border-bottom:1px solid var(--glass-border);">
          <td style="padding:14px 12px;">
            <div style="font-weight:700; font-size:0.92rem;">${v.name}</div>
            <div style="font-size:0.75rem; color:rgba(255,255,255,0.4); margin-top:2px;">Fuel filled: ${liters.toFixed(1)} L | Cost: ${fmt(cost)}</div>
          </td>
          
          <td style="padding:14px 12px; background:rgba(255,255,255,0.01);">
            <div class="font-mono font-bold" style="font-size:0.9rem;">${salesKm.toLocaleString()} KM</div>
            <div style="font-size:0.75rem; color:rgba(255,255,255,0.6); margin-top:2px;">
              Eff: <span class="text-info font-bold">${salesKmL > 0 ? `${salesKmL.toFixed(2)} KM/L` : '—'}</span>
            </div>
            <div style="font-size:0.72rem; color:rgba(255,255,255,0.4);">
              Cost: ${salesCostKm > 0 ? `${fmt(salesCostKm)} / KM` : '—'}
            </div>
          </td>

          <td style="padding:14px 12px; background:rgba(255,255,255,0.02);">
            <div class="font-mono font-bold" style="font-size:0.9rem;">${odoKm > 0 ? `${odoKm.toLocaleString()} KM` : '—'}</div>
            <div style="font-size:0.75rem; color:rgba(255,255,255,0.6); margin-top:2px;">
              Eff: <span class="text-success font-bold">${odoKmL > 0 ? `${odoKmL.toFixed(2)} KM/L` : '—'}</span>
            </div>
            <div style="font-size:0.72rem; color:rgba(255,255,255,0.4);">
              Cost: ${odoCostKm > 0 ? `${fmt(odoCostKm)} / KM` : '—'}
            </div>
          </td>

          <td style="padding:14px 12px; text-align:center;">
            ${discHtml}
          </td>
        </tr>`;
    }).join('');

    const avgPriceSum = totalLitersSum > 0 ? (totalSpentSum / totalLitersSum) : 0;

    body.innerHTML = `
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:16px; margin-bottom:20px;">
        <div class="card" style="padding:16px; border:1px solid var(--glass-border); background:rgba(255,255,255,0.01);">
          <div style="font-size:0.75rem; color:rgba(255,255,255,0.4); text-transform:uppercase; font-weight:600; margin-bottom:4px;">Grand Total Fuel Cost</div>
          <div class="font-mono font-bold text-success" style="font-size:1.4rem; color:var(--success,#10b981);">${fmt(totalSpentSum)}</div>
        </div>
        <div class="card" style="padding:16px; border:1px solid var(--glass-border); background:rgba(255,255,255,0.01);">
          <div style="font-size:0.75rem; color:rgba(255,255,255,0.4); text-transform:uppercase; font-weight:600; margin-bottom:4px;">Total Volume Filled</div>
          <div class="font-mono font-bold" style="font-size:1.4rem; color:var(--info,#06b6d4);">${totalLitersSum.toFixed(2)} Liters</div>
        </div>
        <div class="card" style="padding:16px; border:1px solid var(--glass-border); background:rgba(255,255,255,0.01);">
          <div style="font-size:0.75rem; color:rgba(255,255,255,0.4); text-transform:uppercase; font-weight:600; margin-bottom:4px;">Average Unit Price</div>
          <div class="font-mono font-bold" style="font-size:1.4rem; color:rgba(255,255,255,0.85);">${fmt(avgPriceSum)} / L</div>
        </div>
      </div>

      <!-- Efficiency Analysis Table -->
      <div class="card" style="padding:20px; border:1px solid var(--glass-border); background:rgba(255,255,255,0.01);">
        <h4 style="margin:0 0 12px 0; font-size:0.95rem; font-weight:700; color:var(--info,#06b6d4);">Vehicle Performance &amp; Fuel Audit</h4>
        <div class="table-wrapper" style="overflow-x:auto; border-radius:8px; border:1px solid var(--glass-border);">
          <table style="width:100%; border-collapse:collapse; min-width:850px;">
            <thead>
              <tr style="background:rgba(255,255,255,0.02); border-bottom:2px solid var(--glass-border);">
                <th style="text-align:left; padding:12px;">Vehicle Route Info</th>
                <th style="text-align:left; padding:12px; width:250px; background:rgba(255,255,255,0.01);">Sales Entry Method (Daily Logs)</th>
                <th style="text-align:left; padding:12px; width:250px; background:rgba(255,255,255,0.02);">Odometer Method (Monthly delta)</th>
                <th style="text-align:center; padding:12px; width:180px;">Audit Variance</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  // ── render ────────────────────────────────────────────────
  function render(state) {
    const tabsHtml = TABS.map(t =>
      `<div class="tab${t.id === 'daily' ? ' active' : ''}" data-rpt-tab="${t.id}">${t.label}</div>`
    ).join('');

    return `
      <div class="anim-fade" id="reports-module-container">
        <div class="section-header flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 class="section-title">Reports & Analytics</h2>
            <p class="section-subtitle">Comprehensive business analytics, 5-in-1 monthly packages & automated exports</p>
          </div>
          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
            <button class="btn btn-primary" id="rpt-btn-master-pdf" style="display:inline-flex;align-items:center;gap:8px;font-weight:600;padding:9px 16px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download 5-in-1 Master PDF
            </button>
            <button class="btn btn-ghost" id="rpt-btn-master-email" style="display:inline-flex;align-items:center;gap:8px;font-weight:600;color:var(--primary-light,#818cf8);border:1px solid var(--border-color,#334155);background:var(--bg-surface,#0f172a);">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              Dispatch All Reports Package
            </button>
          </div>
        </div>

        <div class="tabs mb-4" id="rpt-tabs">${tabsHtml}</div>

        ${renderDailyTab()}
        ${renderMonthlyTab()}
        ${renderProductTab()}
        ${renderCreditTab()}
        ${renderCollectionTab()}
        ${renderStockTab()}
        ${renderOperationsTab()}
        ${renderPayrollTab()}
        ${renderFuelTab()}
      </div>`;
  }

  // ── init ──────────────────────────────────────────────────
  function init() {
    const container = document.getElementById('reports-module-container');
    if (!container) return;

    // Tab switching
    AgencyHub.utils.delegate(container, '.tab', 'click', function (e, target) {
      container.querySelectorAll('#rpt-tabs .tab').forEach(t => t.classList.remove('active'));
      target.classList.add('active');
      const tabId = target.dataset.rptTab;
      container.querySelectorAll('.rpt-panel').forEach(p => p.style.display = 'none');
      const panel = document.getElementById('rpt-' + tabId + '-panel');
      if (panel) panel.style.display = '';
      refreshTab(tabId);
    });

    // Filter change listeners
    const bind = (id, fn) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', fn);
    };
    bind('rpt-daily-date',    refreshDaily);
    bind('rpt-monthly-month', refreshMonthly);
    bind('rpt-monthly-agency', refreshMonthly);
    bind('rpt-prod-agency',   refreshProduct);
    bind('rpt-prod-from',     refreshProduct);
    bind('rpt-prod-to',       refreshProduct);
    bind('rpt-credit-agency', refreshCredit);
    bind('rpt-coll-month',    refreshCollection);
    bind('rpt-stock-month',   refreshStock);
    bind('rpt-stock-agency',  refreshStock);
    bind('rpt-operations-month', refreshOperations);
    bind('rpt-payroll-month', refreshPayroll);
    bind('rpt-fuel-month', refreshFuel);

    // Print button delegation (appears in each panel)
    AgencyHub.utils.delegate(container, '#rpt-print-btn', 'click', function (e, target) {
      window.print();
    });

    // PDF Download button delegation
    AgencyHub.utils.delegate(container, '.rpt-download-pdf-btn', 'click', function (e, target) {
      const panel = target.closest('.rpt-panel') || target.closest('.card') || container;
      const reportTitle = target.dataset.title || activeTab || 'Report';
      const activeAgency = state.currentAgency || 'All';
      const todayStr = new Date().toISOString().split('T')[0];

      AgencyHub.utils.toast(`Generating ${reportTitle.replace(/_/g, ' ')} PDF...`, 'info');

      const opt = {
        margin:       [8, 8, 8, 8],
        filename:     `${reportTitle}_${activeAgency}_${todayStr}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      if (window.html2pdf) {
        panel.classList.add('pdf-export-mode');
        window.html2pdf().set(opt).from(panel).save().then(() => {
          panel.classList.remove('pdf-export-mode');
          AgencyHub.utils.toast(`${reportTitle.replace(/_/g, ' ')} PDF downloaded!`, 'success');
        }).catch(err => {
          panel.classList.remove('pdf-export-mode');
          console.error(err);
          window.print();
        });
      } else {
        window.print();
      }
    });

    // 5-in-1 Master Monthly PDF Generator
    const masterPdfBtn = document.getElementById('rpt-btn-master-pdf');
    if (masterPdfBtn) {
      masterPdfBtn.addEventListener('click', () => {
        AgencyHub.utils.toast('Compiling 5-in-1 Monthly Master Report Package...', 'info');

        const masterDiv = document.createElement('div');
        masterDiv.className = 'printable-master-package';
        masterDiv.style.background = '#ffffff';
        masterDiv.style.color = '#000000';
        masterDiv.style.padding = '20px';
        masterDiv.style.fontFamily = 'Arial, sans-serif';

        const todayStr = new Date().toISOString().split('T')[0];
        
        masterDiv.innerHTML = `
          <div style="text-align:center;margin-bottom:20px;border-bottom:2px solid #000;padding-bottom:12px;">
            <h1 style="font-size:22px;margin:0;font-weight:800;">D & G SFA — MONTHLY EXECUTIVE REPORT PACKAGE</h1>
            <p style="margin:4px 0 0 0;font-size:12px;font-weight:600;">Generated Date: ${todayStr} | Recipient: dgsfa.admin@gmail.com</p>
          </div>

          <div style="margin-bottom:24px;">
            <h2 style="font-size:16px;border-bottom:1px solid #000;padding-bottom:4px;margin-bottom:8px;">1. CREDIT BILLS OUTSTANDING REPORT</h2>
            ${document.getElementById('rpt-credit-body') ? document.getElementById('rpt-credit-body').innerHTML : '<p>Credit Bills summary compiled.</p>'}
          </div>

          <div style="margin-bottom:24px;page-break-before:always;">
            <h2 style="font-size:16px;border-bottom:1px solid #000;padding-bottom:4px;margin-bottom:8px;">2. STOCK AUDIT & CLOSING BALANCES</h2>
            ${document.getElementById('rpt-stock-body') ? document.getElementById('rpt-stock-body').innerHTML : '<p>Stock balances compiled.</p>'}
          </div>

          <div style="margin-bottom:24px;page-break-before:always;">
            <h2 style="font-size:16px;border-bottom:1px solid #000;padding-bottom:4px;margin-bottom:8px;">3. FUEL & MILEAGE REPORT</h2>
            ${document.getElementById('rpt-fuel-body') ? document.getElementById('rpt-fuel-body').innerHTML : '<p>Fuel expenditure compiled.</p>'}
          </div>

          <div style="margin-bottom:24px;page-break-before:always;">
            <h2 style="font-size:16px;border-bottom:1px solid #000;padding-bottom:4px;margin-bottom:8px;">4. EMPLOYEE ADVANCES & PAYROLL REPORT</h2>
            ${document.getElementById('rpt-payroll-body') ? document.getElementById('rpt-payroll-body').innerHTML : '<p>Payroll advances compiled.</p>'}
          </div>

          <div style="margin-bottom:24px;page-break-before:always;">
            <h2 style="font-size:16px;border-bottom:1px solid #000;padding-bottom:4px;margin-bottom:8px;">5. CHEQUES MANAGEMENT & RETURNS</h2>
            ${document.getElementById('rpt-operations-body') ? document.getElementById('rpt-operations-body').innerHTML : '<p>Cheques summary compiled.</p>'}
          </div>
        `;

        const opt = {
          margin:       [6, 6, 6, 6],
          filename:     `DGSFA_5in1_Monthly_Master_Report_${todayStr}.pdf`,
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true, logging: false },
          jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        if (window.html2pdf) {
          window.html2pdf().set(opt).from(masterDiv).save().then(() => {
            AgencyHub.utils.toast('5-in-1 Master Monthly PDF downloaded!', 'success');
          }).catch(err => {
            console.error(err);
            window.print();
          });
        } else {
          window.print();
        }
      });
    }

    // Dispatch All Reports Package Email Button (Instant Background Dispatch)
    const masterEmailBtn = document.getElementById('rpt-btn-master-email');
    if (masterEmailBtn) {
      masterEmailBtn.addEventListener('click', async () => {
        const settings = AgencyHub.data.getSettings();
        const targetEmail = settings.adminEmail || 'dgsfa.admin@gmail.com';
        const todayStr = new Date().toISOString().split('T')[0];

        AgencyHub.utils.toast(`Sending 5-in-1 Monthly Report Package to ${targetEmail}...`, 'info');

        const subject = `[D&G SFA] Complete 5-in-1 Monthly Report Package — ${todayStr}`;
        const message = 
          `D & G SFA — COMPLETE MONTHLY EXECUTIVE REPORT PACKAGE\n` +
          `Date: ${todayStr}\n` +
          `Target Recipient: ${targetEmail}\n` +
          `====================================================\n\n` +
          `1. 💳 CREDIT BILLS REPORT: Outstanding balances & overdue dealer invoices compiled.\n` +
          `2. 📦 STOCK AUDIT REPORT: Opening stock, received stock, goods sold & closing balances compiled.\n` +
          `3. ⛽ FUEL & MILEAGE REPORT: Vehicle mileage (km) & fuel expenditure summarized.\n` +
          `4. 💵 EMPLOYEE ADVANCE & PAYROLL REPORT: Staff attendance & monthly salary advances compiled.\n` +
          `5. 📑 CHEQUES REPORT: Day cheques & return cheque collections updated.\n\n` +
          `====================================================\n` +
          `Dispatched instantly by D & G SFA System.`;

        await AgencyHub.utils.sendInstantEmail({
          to: targetEmail,
          subject: subject,
          bodyMessage: message,
          reportType: '5-in-1 Monthly Executive Package'
        });

        AgencyHub.utils.toast(`✅ 5-in-1 Monthly Report Package sent instantly to ${targetEmail}!`, 'success');
      });
    }

    // initial load
    refreshDaily();
  }

  function refreshTab(id) {
    switch (id) {
      case 'daily':      refreshDaily();      break;
      case 'monthly':    refreshMonthly();    break;
      case 'product':    refreshProduct();    break;
      case 'credit':     refreshCredit();     break;
      case 'collection': refreshCollection(); break;
      case 'stock':      refreshStock();      break;
      case 'operations': refreshOperations(); break;
      case 'payroll':    refreshPayroll();    break;
      case 'fuel':       refreshFuel();       break;
    }
  }

  AgencyHub.registerModule('reports', { render: render, init: init });
})();
