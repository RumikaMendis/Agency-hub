// AgencyHub — Executive P&L & Cheque Banking Module (Admin Only)

(function () {
  let selectedMonth = new Date().toISOString().substring(0, 7); // Default YYYY-MM
  let chequeFilter = 'all';

  function calculateExecutivePL(month) {
    const data = AgencyHub.data;
    const utils = AgencyHub.utils;

    // 1. Gross Sales Net Revenue
    const sales = data.getSalesEntries('all').filter(s => s.date && s.date.startsWith(month));
    const grossSalesNet = sales.reduce((sum, s) => sum + (Number(s.netSale) || 0), 0);
    const cashCollected = sales.reduce((sum, s) => sum + (Number(s.cashDeposited || s.cashInHand) || 0), 0);
    const chequeCollected = sales.reduce((sum, s) => sum + (Number(s.chequeDeposited || s.chequeInHand) || 0), 0);
    const creditBillsIssued = sales.reduce((sum, s) => sum + (Number(s.creditBillsToDate) || 0), 0);

    // 2. Stock Purchase Invoices Cost (Stock In)
    const invoices = data.getReceivedInvoices(null, month);
    const stockInCost = invoices.reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);

    // 3. Staff Payroll & Advances Cost
    const advances = data.getAdvances({ month });
    const advancesSum = advances.filter(a => a.type !== 'loan').reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
    
    // Monthly payroll calculation
    const rates = data.getEmployeeRates() || {};
    const employees = Object.keys(rates);
    const attendanceAll = data._get('attendance') || {};
    let payrollGross = 0;
    let epfCompanyCost = 0;
    let vehicleRentCost = 0;

    employees.forEach(name => {
      let days = 0;
      let vehicleDays = 0;
      Object.keys(attendanceAll).forEach(date => {
        if (date.startsWith(month)) {
          const st = attendanceAll[date][name];
          if (st === 'present') days += 1.0;
          else if (st === 'half') days += 0.5;

          if ((name === 'Wimal' || name === 'Bandu Thilaka') && attendanceAll[date][name + '_vehicle'] === 'worked') {
            vehicleDays++;
          }
        }
      });

      const config = rates[name] || {};
      const rate = Number(config.rate) || 2000;
      const totalSalary = days * rate;

      const isEpf = config.epfEligible !== false && (name === 'Sanki' || name === 'Jayarathna' || name === 'Achini Isnaka');
      if (isEpf) {
        const basic = Number(config.basicSalary) || 30000;
        const incentive = Math.max(0, totalSalary - basic);
        payrollGross += (basic + incentive);
        epfCompanyCost += Math.round(basic * 0.12); // EPF 12% Company Portion
      } else {
        const vRate = Number(config.vehicleRate) || 0;
        vehicleRentCost += (vehicleDays * vRate);
        payrollGross += totalSalary;
      }
    });

    const totalStaffCost = payrollGross + epfCompanyCost + vehicleRentCost + advancesSum;

    // 4. Fuel & Mileage Expenses
    const fuelLogs = data.getFuelLogs({ month });
    const fuelCost = fuelLogs.reduce((sum, l) => sum + (Number(l.cost) || 0), 0);

    // 5. Net Operating Profit & Margins
    const totalExpenses = stockInCost + totalStaffCost + fuelCost;
    const netProfit = grossSalesNet - totalExpenses;
    const profitMargin = grossSalesNet > 0 ? ((netProfit / grossSalesNet) * 100) : 0;

    return {
      grossSalesNet,
      cashCollected,
      chequeCollected,
      creditBillsIssued,
      stockInCost,
      payrollGross,
      epfCompanyCost,
      vehicleRentCost,
      advancesSum,
      totalStaffCost,
      fuelCost,
      totalExpenses,
      netProfit,
      profitMargin
    };
  }

  function getChequeBankingStats() {
    const data = AgencyHub.data;
    const utils = AgencyHub.utils;
    const today = utils.today();
    const cheques = data.getCheques({});

    const dueToday = [];
    const dueSoon = [];
    const overdue = [];
    const bounced = [];

    cheques.forEach(c => {
      if (c.status === 'bounced') {
        bounced.push(c);
      } else if (c.status === 'pending') {
        if (c.chequeDate === today) {
          dueToday.push(c);
        } else if (c.chequeDate < today) {
          overdue.push(c);
        } else {
          const diff = utils.daysBetween(today, c.chequeDate);
          if (diff > 0 && diff <= 3) {
            dueSoon.push(c);
          }
        }
      }
    });

    return { dueToday, dueSoon, overdue, bounced, all: cheques };
  }

  function render(state) {
    const utils = AgencyHub.utils;
    const isAdmin = AgencyHub.isAdmin();

    if (!isAdmin) {
      return `
        <div class="empty-state anim-fade card" style="padding:50px 20px; text-align:center; max-width:550px; margin:40px auto; background:rgba(15,23,42,0.6); border:1px solid var(--glass-border); border-radius:16px;">
          <div style="font-size:3.5rem; margin-bottom:12px;">🛡️</div>
          <h2 style="font-size:1.5rem; font-weight:800; margin-bottom:8px; color:#f8fafc;">Admin Access Restricted</h2>
          <p style="color:rgba(255,255,255,0.6); font-size:0.9rem; margin-bottom:24px; line-height:1.5;">
            The <b>Executive Profit & Loss (P&L) Dashboard</b> and <b>Cheque Banking Alerts</b> contain confidential financial controls restricted to Administrator login.
          </p>
          <div style="font-size:0.85rem; color:var(--warning,#f59e0b); background:rgba(245,158,11,0.12); border:1px solid rgba(245,158,11,0.25); padding:12px 16px; border-radius:10px;">
            🔒 Please sign in with Admin credentials to unlock full Executive financial controls.
          </div>
        </div>
      `;
    }

    const pl = calculateExecutivePL(selectedMonth);
    const chq = getChequeBankingStats();

    const dueTodayTotal = chq.dueToday.reduce((s, c) => s + (Number(c.amount) || 0), 0);
    const dueSoonTotal = chq.dueSoon.reduce((s, c) => s + (Number(c.amount) || 0), 0);
    const overdueTotal = chq.overdue.reduce((s, c) => s + (Number(c.amount) || 0), 0);
    const bouncedTotal = chq.bounced.reduce((s, c) => s + (Number(c.amount) || 0), 0);

    // Filter cheques list for display
    let displayCheques = chq.all;
    if (chequeFilter === 'today') displayCheques = chq.dueToday;
    else if (chequeFilter === 'soon') displayCheques = chq.dueSoon;
    else if (chequeFilter === 'overdue') displayCheques = chq.overdue;
    else if (chequeFilter === 'bounced') displayCheques = chq.bounced;

    const chequeRows = displayCheques.length === 0
      ? `<tr><td colspan="7" class="text-center" style="padding:20px; color:rgba(255,255,255,0.4);">No cheques match this filter.</td></tr>`
      : displayCheques.map(c => {
        const isOverdue = c.status === 'pending' && c.chequeDate < utils.today();
        const isToday = c.status === 'pending' && c.chequeDate === utils.today();
        const badgeClass = c.status === 'cleared' ? 'badge-success' : c.status === 'bounced' ? 'badge-danger' : isOverdue ? 'badge-danger' : isToday ? 'badge-warning' : 'badge-primary';
        const statusText = c.status === 'cleared' ? 'Cleared' : c.status === 'bounced' ? 'Bounced' : isOverdue ? 'Overdue Banking' : isToday ? 'Bank Today' : 'Pending';

        return `
          <tr style="border-bottom:1px solid var(--glass-border);">
            <td style="padding:10px; font-weight:700; font-size:0.85rem;">${c.chequeNo}</td>
            <td style="padding:10px; font-size:0.85rem;">${c.customerName || '—'}</td>
            <td style="padding:10px; font-size:0.85rem;">${c.bank || '—'}</td>
            <td style="padding:10px; font-weight:700; text-align:right; font-variant-numeric:tabular-nums;">${utils.formatCurrency(c.amount)}</td>
            <td style="padding:10px; font-size:0.85rem; font-variant-numeric:tabular-nums;">${utils.formatDate(c.chequeDate)}</td>
            <td style="padding:10px; text-align:center;"><span class="badge ${badgeClass}">${statusText}</span></td>
            <td style="padding:10px; text-align:center;">
              ${c.status === 'pending' ? `
                <button class="btn btn-success btn-sm exec-chq-clear" data-id="${c.id}" style="padding:2px 8px; font-size:0.7rem; height:24px; min-width:unset;">Bank & Clear</button>
                <button class="btn btn-danger btn-sm exec-chq-bounce" data-id="${c.id}" style="padding:2px 8px; font-size:0.7rem; height:24px; min-width:unset;">Bounce</button>
              ` : '—'}
            </td>
          </tr>
        `;
      }).join('');

    return `
      <div class="anim-fade space-y-6">
        <!-- Top Toolbar & Month Selection -->
        <div class="card" style="padding:16px 20px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="font-size:1.8rem;">🛡️</div>
            <div>
              <h2 style="margin:0; font-size:1.15rem; font-weight:800;">Executive P&L & Cheque Control</h2>
              <p style="margin:0; font-size:0.8rem; color:rgba(255,255,255,0.5);">Admin Financial Operating Statement & Cheque Banking Schedule</p>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
            <div style="display:flex; align-items:center; gap:8px;">
              <label style="font-size:0.85rem; font-weight:600;">Statement Month:</label>
              <input type="month" id="exec-month-input" class="form-input" value="${selectedMonth}" style="width:160px; padding:6px 10px;">
            </div>
            <button class="btn btn-primary" id="exec-export-btn" style="padding:8px 16px; font-size:0.85rem;">
              📊 Export P&L Report (CSV)
            </button>
          </div>
        </div>

        <!-- 🚨 Cheque Banking Alert Schedule -->
        <div class="card" style="padding:20px; border-left:4px solid var(--warning,#f59e0b);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:12px;">
            <div>
              <h3 style="margin:0; font-size:1.05rem; font-weight:700; display:flex; align-items:center; gap:8px;">
                🚨 Cheque Banking Alert Schedule
              </h3>
              <p style="margin:0; font-size:0.8rem; color:rgba(255,255,255,0.4);">Immediate Banking & Collection Management</p>
            </div>
            <div style="display:flex; gap:6px;">
              <button class="btn btn-sm ${chequeFilter === 'all' ? 'btn-primary' : 'btn-ghost'}" id="exec-flt-all" style="padding:4px 10px; font-size:0.75rem;">All (${chq.all.length})</button>
              <button class="btn btn-sm ${chequeFilter === 'today' ? 'btn-warning' : 'btn-ghost'}" id="exec-flt-today" style="padding:4px 10px; font-size:0.75rem;">Due Today (${chq.dueToday.length})</button>
              <button class="btn btn-sm ${chequeFilter === 'overdue' ? 'btn-danger' : 'btn-ghost'}" id="exec-flt-overdue" style="padding:4px 10px; font-size:0.75rem;">Overdue (${chq.overdue.length})</button>
              <button class="btn btn-sm ${chequeFilter === 'bounced' ? 'btn-danger' : 'btn-ghost'}" id="exec-flt-bounced" style="padding:4px 10px; font-size:0.75rem;">Bounced (${chq.bounced.length})</button>
            </div>
          </div>

          <!-- Alert Cards Grid -->
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:12px; margin-bottom:16px;">
            <div style="background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.25); border-radius:10px; padding:12px 14px;">
              <div style="font-size:0.75rem; font-weight:700; color:#F59E0B; text-transform:uppercase;">📅 Bank Today</div>
              <div style="font-size:1.3rem; font-weight:800; margin-top:2px;">${utils.formatCurrency(dueTodayTotal)}</div>
              <div style="font-size:0.75rem; color:rgba(255,255,255,0.5);">${chq.dueToday.length} Cheque(s)</div>
            </div>
            <div style="background:rgba(99,102,241,0.08); border:1px solid rgba(99,102,241,0.25); border-radius:10px; padding:12px 14px;">
              <div style="font-size:0.75rem; font-weight:700; color:#818CF8; text-transform:uppercase;">⏰ Due Next 3 Days</div>
              <div style="font-size:1.3rem; font-weight:800; margin-top:2px;">${utils.formatCurrency(dueSoonTotal)}</div>
              <div style="font-size:0.75rem; color:rgba(255,255,255,0.5);">${chq.dueSoon.length} Cheque(s)</div>
            </div>
            <div style="background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.25); border-radius:10px; padding:12px 14px;">
              <div style="font-size:0.75rem; font-weight:700; color:#EF4444; text-transform:uppercase;">🚨 Overdue Banking</div>
              <div style="font-size:1.3rem; font-weight:800; margin-top:2px;">${utils.formatCurrency(overdueTotal)}</div>
              <div style="font-size:0.75rem; color:rgba(255,255,255,0.5);">${chq.overdue.length} Cheque(s)</div>
            </div>
            <div style="background:rgba(239,68,68,0.12); border:1px solid rgba(239,68,68,0.35); border-radius:10px; padding:12px 14px;">
              <div style="font-size:0.75rem; font-weight:700; color:#F87171; text-transform:uppercase;">⚠️ Bounced Cheques</div>
              <div style="font-size:1.3rem; font-weight:800; margin-top:2px;">${utils.formatCurrency(bouncedTotal)}</div>
              <div style="font-size:0.75rem; color:rgba(255,255,255,0.5);">${chq.bounced.length} Cheque(s)</div>
            </div>
          </div>

          <!-- Cheques Table -->
          <div class="table-wrapper" style="overflow-x:auto; border-radius:8px; border:1px solid var(--glass-border);">
            <table style="width:100%; border-collapse:collapse;">
              <thead>
                <tr style="background:rgba(255,255,255,0.02); border-bottom:2px solid var(--glass-border);">
                  <th style="text-align:left; padding:10px;">Cheque #</th>
                  <th style="text-align:left; padding:10px;">Customer / Payee</th>
                  <th style="text-align:left; padding:10px;">Bank</th>
                  <th style="text-align:right; padding:10px;">Amount</th>
                  <th style="text-align:left; padding:10px;">Cheque Date</th>
                  <th style="text-align:center; padding:10px;">Status</th>
                  <th style="text-align:center; padding:10px;">Action</th>
                </tr>
              </thead>
              <tbody>
                ${chequeRows}
              </tbody>
            </table>
          </div>
        </div>

        <!-- 📈 Executive Profit & Loss (P&L) Dashboard -->
        <div class="card" style="padding:20px;">
          <h3 style="margin:0 0 16px; font-size:1.1rem; font-weight:800; display:flex; align-items:center; gap:8px;">
            📈 Operating Profit & Loss Summary (${selectedMonth})
          </h3>

          <!-- Big Net Profit KPI Banner -->
          <div style="background: ${pl.netProfit >= 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)'}; border: 1px solid ${pl.netProfit >= 0 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}; border-radius:12px; padding:20px; margin-bottom:20px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
            <div>
              <div style="font-size:0.85rem; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:${pl.netProfit >= 0 ? '#10B981' : '#EF4444'};">
                ${pl.netProfit >= 0 ? '✅ NET OPERATING PROFIT' : '⚠️ NET OPERATING LOSS'}
              </div>
              <div style="font-size:2.2rem; font-weight:900; margin-top:4px; color:${pl.netProfit >= 0 ? '#10B981' : '#EF4444'};">
                ${utils.formatCurrency(pl.netProfit)}
              </div>
              <div style="font-size:0.8rem; color:rgba(255,255,255,0.6); margin-top:2px;">
                Gross Revenue (${utils.formatCurrency(pl.grossSalesNet)}) minus Total Expenses (${utils.formatCurrency(pl.totalExpenses)})
              </div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:0.8rem; color:rgba(255,255,255,0.5);">Net Operating Margin</div>
              <div style="font-size:2rem; font-weight:800; color:${pl.profitMargin >= 0 ? '#10B981' : '#EF4444'};">
                ${pl.profitMargin.toFixed(1)}%
              </div>
            </div>
          </div>

          <!-- Revenue vs Expenses Grid -->
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap:16px; margin-bottom:20px;">
            <!-- Revenue Card -->
            <div style="background:rgba(255,255,255,0.02); border:1px solid var(--glass-border); border-radius:10px; padding:16px;">
              <div style="font-size:0.8rem; font-weight:700; color:var(--primary-light,#a78bfa); text-transform:uppercase; margin-bottom:8px;">
                💵 Gross Sales Revenue
              </div>
              <div style="font-size:1.5rem; font-weight:800; color:#fff; margin-bottom:8px;">${utils.formatCurrency(pl.grossSalesNet)}</div>
              <div style="font-size:0.78rem; color:rgba(255,255,255,0.6); space-y-1;">
                <div style="display:flex; justify-content:space-between;"><span>Cash Collected:</span><span style="font-weight:600;">${utils.formatCurrency(pl.cashCollected)}</span></div>
                <div style="display:flex; justify-content:space-between;"><span>Cheques Collected:</span><span style="font-weight:600;">${utils.formatCurrency(pl.chequeCollected)}</span></div>
                <div style="display:flex; justify-content:space-between;"><span>Credit Bills Issued:</span><span style="font-weight:600;">${utils.formatCurrency(pl.creditBillsIssued)}</span></div>
              </div>
            </div>

            <!-- Expenses Card 1: Stock Purchase -->
            <div style="background:rgba(255,255,255,0.02); border:1px solid var(--glass-border); border-radius:10px; padding:16px;">
              <div style="font-size:0.8rem; font-weight:700; color:var(--info-light,#22d3ee); text-transform:uppercase; margin-bottom:8px;">
                🏭 Stock Purchase Invoices
              </div>
              <div style="font-size:1.5rem; font-weight:800; color:#fff; margin-bottom:8px;">${utils.formatCurrency(pl.stockInCost)}</div>
              <div style="font-size:0.78rem; color:rgba(255,255,255,0.6);">
                Total Stock Received Invoices cost logged for Bathipooja, Domie & Kelani agencies.
              </div>
            </div>

            <!-- Expenses Card 2: Staff Payroll -->
            <div style="background:rgba(255,255,255,0.02); border:1px solid var(--glass-border); border-radius:10px; padding:16px;">
              <div style="font-size:0.8rem; font-weight:700; color:#F59E0B; text-transform:uppercase; margin-bottom:8px;">
                👥 Staff Payroll & Allowances
              </div>
              <div style="font-size:1.5rem; font-weight:800; color:#fff; margin-bottom:8px;">${utils.formatCurrency(pl.totalStaffCost)}</div>
              <div style="font-size:0.78rem; color:rgba(255,255,255,0.6); space-y-1;">
                <div style="display:flex; justify-content:space-between;"><span>Salaries & Incentives:</span><span>${utils.formatCurrency(pl.payrollGross)}</span></div>
                <div style="display:flex; justify-content:space-between;"><span>EPF Company 12%:</span><span>${utils.formatCurrency(pl.epfCompanyCost)}</span></div>
                <div style="display:flex; justify-content:space-between;"><span>Vehicle Allowances:</span><span>${utils.formatCurrency(pl.vehicleRentCost)}</span></div>
              </div>
            </div>

            <!-- Expenses Card 3: Fuel -->
            <div style="background:rgba(255,255,255,0.02); border:1px solid var(--glass-border); border-radius:10px; padding:16px;">
              <div style="font-size:0.8rem; font-weight:700; color:#EF4444; text-transform:uppercase; margin-bottom:8px;">
                ⛽ Fuel & Mileage Expenses
              </div>
              <div style="font-size:1.5rem; font-weight:800; color:#fff; margin-bottom:8px;">${utils.formatCurrency(pl.fuelCost)}</div>
              <div style="font-size:0.78rem; color:rgba(255,255,255,0.6);">
                Total fuel log costs across delivery vehicles for ${selectedMonth}.
              </div>
            </div>
          </div>

          <!-- P&L Financial Statement Breakdown Table -->
          <div class="table-wrapper" style="overflow-x:auto; border-radius:8px; border:1px solid var(--glass-border);">
            <table style="width:100%; border-collapse:collapse;">
              <thead>
                <tr style="background:rgba(255,255,255,0.03); border-bottom:2px solid var(--glass-border);">
                  <th style="text-align:left; padding:12px;">Financial Category</th>
                  <th style="text-align:right; padding:12px;">Amount (LKR)</th>
                  <th style="text-align:right; padding:12px;">% of Revenue</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom:1px solid var(--glass-border); background:rgba(16,185,129,0.03);">
                  <td style="padding:10px 12px; font-weight:700;">1. Gross Sales Net Revenue</td>
                  <td style="padding:10px 12px; font-weight:700; text-align:right; font-variant-numeric:tabular-nums; color:#10B981;">${utils.formatCurrency(pl.grossSalesNet)}</td>
                  <td style="padding:10px 12px; font-weight:700; text-align:right; font-variant-numeric:tabular-nums;">100.0%</td>
                </tr>
                <tr style="border-bottom:1px solid var(--glass-border);">
                  <td style="padding:10px 12px; padding-left:24px; color:rgba(255,255,255,0.8);">• Stock Purchase / Invoices Cost</td>
                  <td style="padding:10px 12px; text-align:right; font-variant-numeric:tabular-nums;">${utils.formatCurrency(pl.stockInCost)}</td>
                  <td style="padding:10px 12px; text-align:right; font-variant-numeric:tabular-nums;">${pl.grossSalesNet > 0 ? ((pl.stockInCost / pl.grossSalesNet) * 100).toFixed(1) : 0}%</td>
                </tr>
                <tr style="border-bottom:1px solid var(--glass-border);">
                  <td style="padding:10px 12px; padding-left:24px; color:rgba(255,255,255,0.8);">• Staff Salaries & Incentives</td>
                  <td style="padding:10px 12px; text-align:right; font-variant-numeric:tabular-nums;">${utils.formatCurrency(pl.payrollGross)}</td>
                  <td style="padding:10px 12px; text-align:right; font-variant-numeric:tabular-nums;">${pl.grossSalesNet > 0 ? ((pl.payrollGross / pl.grossSalesNet) * 100).toFixed(1) : 0}%</td>
                </tr>
                <tr style="border-bottom:1px solid var(--glass-border);">
                  <td style="padding:10px 12px; padding-left:24px; color:rgba(255,255,255,0.8);">• Staff EPF Company Portion (12%)</td>
                  <td style="padding:10px 12px; text-align:right; font-variant-numeric:tabular-nums;">${utils.formatCurrency(pl.epfCompanyCost)}</td>
                  <td style="padding:10px 12px; text-align:right; font-variant-numeric:tabular-nums;">${pl.grossSalesNet > 0 ? ((pl.epfCompanyCost / pl.grossSalesNet) * 100).toFixed(1) : 0}%</td>
                </tr>
                <tr style="border-bottom:1px solid var(--glass-border);">
                  <td style="padding:10px 12px; padding-left:24px; color:rgba(255,255,255,0.8);">• Vehicle Allowances & Rent</td>
                  <td style="padding:10px 12px; text-align:right; font-variant-numeric:tabular-nums;">${utils.formatCurrency(pl.vehicleRentCost)}</td>
                  <td style="padding:10px 12px; text-align:right; font-variant-numeric:tabular-nums;">${pl.grossSalesNet > 0 ? ((pl.vehicleRentCost / pl.grossSalesNet) * 100).toFixed(1) : 0}%</td>
                </tr>
                <tr style="border-bottom:1px solid var(--glass-border);">
                  <td style="padding:10px 12px; padding-left:24px; color:rgba(255,255,255,0.8);">• Fuel & Mileage Expenses</td>
                  <td style="padding:10px 12px; text-align:right; font-variant-numeric:tabular-nums;">${utils.formatCurrency(pl.fuelCost)}</td>
                  <td style="padding:10px 12px; text-align:right; font-variant-numeric:tabular-nums;">${pl.grossSalesNet > 0 ? ((pl.fuelCost / pl.grossSalesNet) * 100).toFixed(1) : 0}%</td>
                </tr>
                <tr style="border-bottom:2px solid var(--glass-border); background:rgba(239,68,68,0.03);">
                  <td style="padding:10px 12px; font-weight:700;">2. Total Operating Expenses</td>
                  <td style="padding:10px 12px; font-weight:700; text-align:right; font-variant-numeric:tabular-nums; color:#EF4444;">${utils.formatCurrency(pl.totalExpenses)}</td>
                  <td style="padding:10px 12px; font-weight:700; text-align:right; font-variant-numeric:tabular-nums;">${pl.grossSalesNet > 0 ? ((pl.totalExpenses / pl.grossSalesNet) * 100).toFixed(1) : 0}%</td>
                </tr>
                <tr style="background: ${pl.netProfit >= 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)'}; font-size:1.05rem;">
                  <td style="padding:12px; font-weight:900; color:${pl.netProfit >= 0 ? '#10B981' : '#EF4444'};">3. NET OPERATING PROFIT / (LOSS)</td>
                  <td style="padding:12px; font-weight:900; text-align:right; font-variant-numeric:tabular-nums; color:${pl.netProfit >= 0 ? '#10B981' : '#EF4444'};">${utils.formatCurrency(pl.netProfit)}</td>
                  <td style="padding:12px; font-weight:900; text-align:right; font-variant-numeric:tabular-nums; color:${pl.netProfit >= 0 ? '#10B981' : '#EF4444'};">${pl.profitMargin.toFixed(1)}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  function init(state) {
    const utils = AgencyHub.utils;
    const data = AgencyHub.data;

    // Month input listener
    const monthEl = document.getElementById('exec-month-input');
    if (monthEl) {
      monthEl.addEventListener('change', (e) => {
        selectedMonth = e.target.value;
        AgencyHub.navigate('executive');
      });
    }

    // Cheque filter buttons
    const bindFilter = (id, val) => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener('click', () => {
          chequeFilter = val;
          AgencyHub.navigate('executive');
        });
      }
    };
    bindFilter('exec-flt-all', 'all');
    bindFilter('exec-flt-today', 'today');
    bindFilter('exec-flt-overdue', 'overdue');
    bindFilter('exec-flt-bounced', 'bounced');

    // Cheque action buttons
    document.querySelectorAll('.exec-chq-clear').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const cheques = data.getCheques({});
        const chq = cheques.find(c => c.id === id);
        if (chq) {
          chq.status = 'cleared';
          data.saveCheque(chq);
          utils.toast(`Cheque #${chq.chequeNo} marked as Cleared!`, 'success');
          AgencyHub.navigate('executive');
        }
      });
    });

    document.querySelectorAll('.exec-chq-bounce').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const cheques = data.getCheques({});
        const chq = cheques.find(c => c.id === id);
        if (chq) {
          chq.status = 'bounced';
          data.saveCheque(chq);
          utils.toast(`Cheque #${chq.chequeNo} marked as Bounced!`, 'warning');
          AgencyHub.navigate('executive');
        }
      });
    });

    // CSV Export button
    const exportBtn = document.getElementById('exec-export-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const pl = calculateExecutivePL(selectedMonth);
        const headers = ['Financial Category', 'Amount (LKR)', 'Percentage of Revenue (%)'];
        const rows = [
          ['Gross Sales Net Revenue', pl.grossSalesNet.toFixed(2), '100.0%'],
          ['Cash Collected', pl.cashCollected.toFixed(2), pl.grossSalesNet > 0 ? ((pl.cashCollected / pl.grossSalesNet) * 100).toFixed(1) + '%' : '0%'],
          ['Cheques Collected', pl.chequeCollected.toFixed(2), pl.grossSalesNet > 0 ? ((pl.chequeCollected / pl.grossSalesNet) * 100).toFixed(1) + '%' : '0%'],
          ['Credit Bills Issued', pl.creditBillsIssued.toFixed(2), pl.grossSalesNet > 0 ? ((pl.creditBillsIssued / pl.grossSalesNet) * 100).toFixed(1) + '%' : '0%'],
          ['Stock Purchase / Invoices Cost', pl.stockInCost.toFixed(2), pl.grossSalesNet > 0 ? ((pl.stockInCost / pl.grossSalesNet) * 100).toFixed(1) + '%' : '0%'],
          ['Staff Salaries & Incentives', pl.payrollGross.toFixed(2), pl.grossSalesNet > 0 ? ((pl.payrollGross / pl.grossSalesNet) * 100).toFixed(1) + '%' : '0%'],
          ['Staff EPF Company Portion (12%)', pl.epfCompanyCost.toFixed(2), pl.grossSalesNet > 0 ? ((pl.epfCompanyCost / pl.grossSalesNet) * 100).toFixed(1) + '%' : '0%'],
          ['Vehicle Allowances & Rent', pl.vehicleRentCost.toFixed(2), pl.grossSalesNet > 0 ? ((pl.vehicleRentCost / pl.grossSalesNet) * 100).toFixed(1) + '%' : '0%'],
          ['Fuel & Mileage Expenses', pl.fuelCost.toFixed(2), pl.grossSalesNet > 0 ? ((pl.fuelCost / pl.grossSalesNet) * 100).toFixed(1) + '%' : '0%'],
          ['Total Operating Expenses', pl.totalExpenses.toFixed(2), pl.grossSalesNet > 0 ? ((pl.totalExpenses / pl.grossSalesNet) * 100).toFixed(1) + '%' : '0%'],
          ['NET OPERATING PROFIT / (LOSS)', pl.netProfit.toFixed(2), pl.profitMargin.toFixed(1) + '%']
        ];
        utils.exportToCSV(`Executive_PL_Statement_${selectedMonth}`, headers, rows);
      });
    }
  }

  // Register with AgencyHub
  AgencyHub.registerModule('executive', { render, init });
})();
