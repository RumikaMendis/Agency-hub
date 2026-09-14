// =============================================================================
// AgencyHub — Attendance & Payroll Module
// =============================================================================

(function () {
  'use strict';

  const { data, utils, state } = AgencyHub;
  const escapeHtml = utils.escapeHtml || ((str) => str == null ? '' : String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'));

  // ---------------------------------------------------------------------------
  // Module State
  // ---------------------------------------------------------------------------
  let activeTab = 'attendance'; // 'attendance' | 'advances' | 'summary' | 'setup'
  
  // Attendance Tab State
  let selectedDate = utils.today();
  let tempAttendance = {}; // Maps name -> 'present' | 'absent' | 'half'

  // Advances Tab State
  let selectedAdvanceEmployee = 'all';

  // Summary Tab State
  let selectedSummaryMonth = utils.today().slice(0, 7); // 'YYYY-MM'

  function getEmployeesList() {
    const rates = data.getEmployeeRates() || {};
    const storedList = data._get('payroll_employees');
    if (storedList && Array.isArray(storedList) && storedList.length > 0) {
      const valid = storedList.filter(name => rates[name] !== undefined);
      const missing = Object.keys(rates).filter(name => !valid.includes(name));
      return valid.concat(missing);
    }
    return Object.keys(rates);
  }

  // ---------------------------------------------------------------------------
  // Calculations & Helpers
  // ---------------------------------------------------------------------------
  function getMonthlyAttendanceCounts(month) {
    const all = data._get('attendance') || {};
    const counts = {};
    const employees = getEmployeesList();
    employees.forEach(name => {
      counts[name] = { present: 0, half: 0, absent: 0, totalDays: 0, vehicleWorkedDays: 0, tempDriverDays: 0 };
    });

    Object.keys(all).forEach(date => {
      if (date.startsWith(month)) {
        const dayMap = all[date];
        employees.forEach(name => {
          const status = dayMap[name] || 'absent'; // default absent if not marked
          if (status === 'present') {
            counts[name].present++;
            counts[name].totalDays += 1.0;
          } else if (status === 'half') {
            counts[name].half++;
            counts[name].totalDays += 0.5;
          } else if (status === 'absent') {
            counts[name].absent++;
          }

          // Count vehicle usage days for eligible employees
          if (name === 'Wimal' || name === 'Bandu Thilaka') {
            const vehicleStatus = dayMap[name + '_vehicle'] || 'idle';
            if (vehicleStatus === 'worked') {
              counts[name].vehicleWorkedDays++;
            }
          }

          // Count temporary driver days
          if (name === 'Wimal' || name === 'Bandu Thilaka' || name === 'Jayarathna') {
            const tempStatus = dayMap[name + '_temp'] || 'idle';
            if (tempStatus === 'worked') {
              counts[name].tempDriverDays++;
            }
          }
        });
      }
    });

    return counts;
  }

  function getMonthlyAdvancesTotal(month) {
    const advances = data.getAdvances({ month });
    const totals = {};
    const employees = getEmployeesList();
    employees.forEach(name => { totals[name] = 0; });
    advances.forEach(adv => {
      if (totals[adv.employee] !== undefined && adv.type !== 'loan') {
        totals[adv.employee] += Number(adv.amount) || 0;
      }
    });
    return totals;
  }

  function getMonthlyLoansTotal(month) {
    const advances = data.getAdvances({ month });
    const totals = {};
    const employees = getEmployeesList();
    employees.forEach(name => { totals[name] = 0; });
    advances.forEach(adv => {
      if (totals[adv.employee] !== undefined && adv.type === 'loan') {
        totals[adv.employee] += Number(adv.amount) || 0;
      }
    });
    return totals;
  }

  function getPayoutStatus(month) {
    const payouts = data._get('payroll_payouts') || {};
    return payouts[month] || {};
  }

  function savePayoutStatus(month, employee, paid) {
    const payouts = data._get('payroll_payouts') || {};
    if (!payouts[month]) payouts[month] = {};
    payouts[month][employee] = paid;
    data._set('payroll_payouts', payouts);
  }

  // ---------------------------------------------------------------------------
  // Tab Renderings
  // ---------------------------------------------------------------------------
  
  // --- Tab 1: Attendance ---
  function renderAttendanceTab() {
    // Load attendance from database for selectedDate
    const saved = data.getAttendance(selectedDate);
    const employees = getEmployeesList();
    const rates = data.getEmployeeRates();
    
    // Initialize temporary state with saved data or defaults
    employees.forEach(name => {
      tempAttendance[name] = saved[name] || 'present'; // Default to present
      const config = rates[name] || {};
      const isVehicleEligible = (name === 'Wimal' || name === 'Bandu Thilaka' || Number(config.vehicleRate) > 0);
      const isDriver = (name === 'Wimal' || name === 'Bandu Thilaka' || name === 'Jayarathna' || Number(config.tempDriverRate) > 0);

      if (isVehicleEligible) {
        tempAttendance[name + '_vehicle'] = saved[name + '_vehicle'] || 'idle';
      }
      if (isDriver) {
        tempAttendance[name + '_temp'] = saved[name + '_temp'] || 'idle';
      }
    });

    const rows = employees.map(name => {
      const config = rates[name] || {};
      const status = tempAttendance[name];
      const isVehicleEligible = (name === 'Wimal' || name === 'Bandu Thilaka' || Number(config.vehicleRate) > 0);
      const isDriver = (name === 'Wimal' || name === 'Bandu Thilaka' || name === 'Jayarathna' || Number(config.tempDriverRate) > 0);
      
      let vehicleWidgetHtml = '';
      if (isVehicleEligible) {
        const vehicleStatus = tempAttendance[name + '_vehicle'] || 'idle';
        vehicleWidgetHtml = `
          <div style="display:flex; justify-content:center; gap:8px; margin-top:8px;">
            <span style="font-size:0.8rem; color:var(--info-light,#22d3ee); display:inline-flex; align-items:center; gap:4px; width:110px; justify-content:flex-end;">🚚 Vehicle Usage:</span>
            <button class="btn btn-sm att-btn-vehicle ${vehicleStatus === 'worked' ? 'btn-info' : 'btn-ghost'}" 
                    data-employee="${name}" data-status="worked" style="padding:2px 10px; font-size:0.75rem; min-width:70px; height:24px;">
              Active
            </button>
            <button class="btn btn-sm att-btn-vehicle ${vehicleStatus === 'idle' ? 'btn-danger' : 'btn-ghost'}" 
                    data-employee="${name}" data-status="idle" style="padding:2px 10px; font-size:0.75rem; min-width:70px; height:24px;">
              Idle
            </button>
          </div>
        `;
      }

      let tempDriverWidgetHtml = '';
      if (isDriver) {
        const tempStatus = tempAttendance[name + '_temp'] || 'idle';
        tempDriverWidgetHtml = `
          <div style="display:flex; justify-content:center; gap:8px; margin-top:8px;">
            <span style="font-size:0.8rem; color:var(--primary-light,#818cf8); display:inline-flex; align-items:center; gap:4px; width:110px; justify-content:flex-end;">👤 Temp Driver:</span>
            <button class="btn btn-sm att-btn-temp ${tempStatus === 'worked' ? 'btn-primary' : 'btn-ghost'}" 
                    data-employee="${name}" data-status="worked" style="padding:2px 10px; font-size:0.75rem; min-width:70px; height:24px;">
              Active
            </button>
            <button class="btn btn-sm att-btn-temp ${tempStatus === 'idle' ? 'btn-danger' : 'btn-ghost'}" 
                    data-employee="${name}" data-status="idle" style="padding:2px 10px; font-size:0.75rem; min-width:70px; height:24px;">
              Idle
            </button>
          </div>
        `;
      }

      return `
        <tr style="border-bottom:1px solid var(--glass-border);">
          <td style="font-weight:700; padding:16px 12px; font-size:0.95rem;">${name}</td>
          <td style="padding:12px; text-align:center;">
            <div style="display:flex; justify-content:center; gap:8px;">
              <button class="btn btn-sm att-btn-status ${status === 'present' ? 'btn-success' : 'btn-ghost'}" 
                      data-employee="${name}" data-status="present" style="padding:6px 16px; min-width:80px;">
                Present
              </button>
              <button class="btn btn-sm att-btn-status ${status === 'half' ? 'btn-warning' : 'btn-ghost'}" 
                      data-employee="${name}" data-status="half" style="padding:6px 16px; min-width:80px; ${status === 'half' ? 'color:#000;' : ''}">
                Half Day
              </button>
              <button class="btn btn-sm att-btn-status ${status === 'absent' ? 'btn-danger' : 'btn-ghost'}" 
                      data-employee="${name}" data-status="absent" style="padding:6px 16px; min-width:80px;">
                Absent
              </button>
            </div>
            ${vehicleWidgetHtml}
            ${tempDriverWidgetHtml}
          </td>
        </tr>`;
    }).join('');

    const monthStr = selectedDate.substring(0, 7);
    const monthlyCounts = getMonthlyAttendanceCounts(monthStr);

    return `
      <div class="anim-fade card" style="padding:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:12px;">
          <div>
            <h3 style="margin:0 0 4px; font-size:1.1rem; font-weight:700;">Daily Attendance Sheets</h3>
            <p style="margin:0; font-size:0.8rem; color:rgba(255,255,255,0.4);">Mark present, half-day, or absent status for each staff member, vehicle usage, and temporary drivers.</p>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <label class="form-label" style="margin:0; font-size:0.85rem;">Sheet Date:</label>
            <input type="date" class="form-input" id="att-date-input" value="${selectedDate}" style="width:160px; padding:6px 10px;">
          </div>
        </div>

        <!-- Month-to-Date Attendance Summary Cards -->
        <div style="margin-bottom:20px; background:rgba(255,255,255,0.015); border:1px solid var(--glass-border); border-radius:10px; padding:14px 16px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <span style="font-size:0.8rem; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:rgba(255,255,255,0.6);">
              📊 Month-to-Date Attendance Summary (${monthStr})
            </span>
            <span style="font-size:0.75rem; color:rgba(255,255,255,0.4);">Auto-calculated from saved daily sheets</span>
          </div>
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:10px;">
            ${employees.map(name => {
              const c = monthlyCounts[name] || { present: 0, half: 0, absent: 0, totalDays: 0 };
              return `
                <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:10px 12px;">
                  <div style="font-weight:700; font-size:0.85rem; color:var(--primary-light,#a78bfa); display:flex; justify-content:space-between; align-items:center;">
                    <span>${escapeHtml(name)}</span>
                    <span style="font-size:0.8rem; font-weight:800; color:#10B981;">${c.totalDays.toFixed(1)} Days</span>
                  </div>
                  <div style="font-size:0.75rem; color:rgba(255,255,255,0.7); margin-top:6px; display:flex; justify-content:space-between;">
                    <span style="color:#10B981; font-weight:600;">Present: ${c.present}</span>
                    <span style="color:#F59E0B; font-weight:600;">Half: ${c.half}</span>
                    <span style="color:#EF4444; font-weight:600;">Absent: ${c.absent}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <div class="table-wrapper" style="overflow-x:auto; border-radius:8px; border:1px solid var(--glass-border); margin-bottom:20px;">
          <table style="width:100%; border-collapse:collapse;">
            <thead>
              <tr style="background:rgba(255,255,255,0.02); border-bottom:2px solid var(--glass-border);">
                <th style="text-align:left; padding:12px;">Employee Name</th>
                <th style="text-align:center; padding:12px; width:350px;">Attendance Status</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>

        <div style="display:flex; justify-content:flex-end;">
          <button class="btn btn-primary" id="att-save-btn" style="padding:10px 24px; display:flex; align-items:center; gap:8px;">
            💾 Save Attendance Sheet
          </button>
        </div>
      </div>`;
  }

  // --- Tab 2: Advances & Loans ---
  function renderAdvancesTab() {
    const advances = data.getAdvances({
      employee: selectedAdvanceEmployee,
      month: selectedSummaryMonth
    });

    const totalAdvancesSum = advances.filter(a => a.type !== 'loan').reduce((s, a) => s + (Number(a.amount) || 0), 0);
    const totalLoansSum = advances.filter(a => a.type === 'loan').reduce((s, a) => s + (Number(a.amount) || 0), 0);

    const rows = advances.length === 0 
      ? `<tr><td colspan="6" class="text-center" style="padding:24px; color:rgba(255,255,255,0.4);">No salary advances or loan payments logged for this selection.</td></tr>`
      : advances.map(adv => `
        <tr style="border-bottom:1px solid var(--glass-border);">
          <td style="padding:12px; font-size:0.88rem; color:rgba(255,255,255,0.85); font-variant-numeric:tabular-nums;">
            ${utils.formatDate(adv.date)}
          </td>
          <td style="font-weight:700; padding:12px; font-size:0.9rem;">${adv.employee}</td>
          <td style="padding:12px; font-size:0.8rem;">
            <span class="badge ${adv.type === 'loan' ? 'badge-primary' : 'badge-danger'}" style="font-size:0.7rem; padding:2px 8px;">
              ${adv.type === 'loan' ? 'Loan Payment' : 'Salary Advance'}
            </span>
          </td>
          <td style="padding:12px; font-size:0.85rem; color:rgba(255,255,255,0.5);">${adv.notes || '—'}</td>
          <td class="text-right font-mono font-bold" style="padding:12px; font-size:0.95rem; color:${adv.type === 'loan' ? 'var(--primary-light,#818cf8)' : 'var(--danger,#ef4444)'};">
            -${utils.formatCurrency(adv.amount)}
          </td>
          <td style="text-align:center; padding:8px;">
            <button class="btn btn-danger btn-sm btn-icon adv-delete-btn admin-only" data-adv-id="${adv.id}" title="Delete Record" style="padding:4px; width:26px; height:26px; min-width:unset; display:flex; align-items:center; justify-content:center; margin: 0 auto;">
              🗑️
            </button>
          </td>
        </tr>`).join('');

    return `
      <div class="anim-fade card" style="padding:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:12px;">
          <div>
            <h3 style="margin:0 0 4px; font-size:1.1rem; font-weight:700;">Employee Advances & Loans Log</h3>
            <p style="margin:0; font-size:0.8rem; color:rgba(255,255,255,0.4);">Record cash advances and loan payments which auto-deduct from monthly payouts.</p>
          </div>
          <button class="btn btn-primary" id="adv-add-btn" style="display:flex; align-items:center; gap:6px;">
            💸 Record Advance / Loan
          </button>
        </div>

        <div class="filter-bar" style="display:flex; flex-wrap:wrap; gap:12px; align-items:center; margin-bottom:16px; background:rgba(255,255,255,0.01); padding:10px; border-radius:8px; border:1px solid var(--glass-border);">
          <div style="display:flex; align-items:center; gap:8px;">
            <label class="form-label" style="margin:0; font-size:0.8rem;">Month:</label>
            <input type="month" class="form-input" id="adv-month-filter" value="${selectedSummaryMonth}" style="width:150px; padding:5px 8px;">
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <label class="form-label" style="margin:0; font-size:0.8rem;">Staff Member:</label>
            <select class="form-select" id="adv-employee-filter" style="min-width:160px; padding:5px 8px;">
              <option value="all" ${selectedAdvanceEmployee === 'all' ? 'selected' : ''}>All Employees</option>
              ${getEmployeesList().map(name => `<option value="${escapeHtml(name)}" ${selectedAdvanceEmployee === name ? 'selected' : ''}>${escapeHtml(name)}</option>`).join('')}
            </select>
          </div>
          <div style="margin-left:auto; display:flex; gap:16px; font-size:0.88rem; font-weight:600;">
            <div>Advances: <span class="font-mono text-danger font-bold">${utils.formatCurrency(totalAdvancesSum)}</span></div>
            <div>Loans: <span class="font-mono text-primary-light font-bold" style="color:var(--primary-light,#818cf8);">${utils.formatCurrency(totalLoansSum)}</span></div>
          </div>
        </div>

        <div class="table-wrapper" style="overflow-x:auto; border-radius:8px; border:1px solid var(--glass-border);">
          <table style="width:100%; border-collapse:collapse; min-width:650px;">
            <thead>
              <tr style="background:rgba(255,255,255,0.02); border-bottom:2px solid var(--glass-border);">
                <th style="text-align:left; padding:12px; width:120px;">Date</th>
                <th style="text-align:left; padding:12px; width:160px;">Employee</th>
                <th style="text-align:left; padding:12px; width:120px;">Type</th>
                <th style="text-align:left; padding:12px;">Notes / Purpose</th>
                <th style="text-align:right; padding:12px; width:120px;">Amount</th>
                <th style="text-align:center; padding:12px; width:80px;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  // --- Tab 3: Monthly Summary ---
  function renderSummaryTab() {
    const employees = getEmployeesList();
    const counts = getMonthlyAttendanceCounts(selectedSummaryMonth);
    const advances = getMonthlyAdvancesTotal(selectedSummaryMonth);
    const loggedLoans = getMonthlyLoansTotal(selectedSummaryMonth);
    const rates = data.getEmployeeRates();
    const paidStatus = getPayoutStatus(selectedSummaryMonth);

    let grandTotalSalary = 0;
    let grandBasicSalary = 0;
    let grandIncentive = 0;
    let grandVehicleRent = 0;
    let grandGross = 0;
    let grandEpf8 = 0;
    let grandAdvances = 0;
    let grandLoans = 0;
    let grandNet = 0;

    const rows = employees.map((name, index) => {
      const c = counts[name] || { present: 0, half: 0, absent: 0, totalDays: 0, vehicleWorkedDays: 0, tempDriverDays: 0 };
      const advTotal = advances[name] || 0;
      const rateConfig = rates[name] || { type: 'daily', rate: 2000, epfEligible: false, basicSalary: 30000, vehicleRate: 0, tempDriverRate: 0, loanDeduction: 0 };
      const isPaid = !!paidStatus[name];

      const daySalary = Number(rateConfig.rate) || 2000;
      const totalSalary = c.totalDays * daySalary;

      const isEpfEligible = rateConfig.epfEligible !== false && (name === 'Sanki' || name === 'Jayarathna' || name === 'Achini Isnaka' || rateConfig.epfEligible === true);

      let basicSalary = 0;
      let incentive = 0;
      let vehicleRent = 0;
      let grossSalary = 0;
      let epf8 = 0;

      if (isEpfEligible) {
        basicSalary = Number(rateConfig.basicSalary) || 30000;
        incentive = Math.max(0, totalSalary - basicSalary);
        vehicleRent = 0;
        grossSalary = basicSalary + incentive;
        epf8 = Math.round(basicSalary * 0.08); // Rs. 2400
      } else {
        basicSalary = 0;
        incentive = totalSalary;
        const vehicleRate = Number(rateConfig.vehicleRate) || 0;
        vehicleRent = (c.vehicleWorkedDays || 0) * vehicleRate;
        grossSalary = totalSalary + vehicleRent;
        epf8 = 0;
      }

      const loanTotal = (Number(rateConfig.loanDeduction) || 0) + (loggedLoans[name] || 0);
      const netSalary = grossSalary - epf8 - advTotal - loanTotal;

      grandTotalSalary += totalSalary;
      grandBasicSalary += basicSalary;
      grandIncentive += incentive;
      grandVehicleRent += vehicleRent;
      grandGross += grossSalary;
      grandEpf8 += epf8;
      grandAdvances += advTotal;
      grandLoans += loanTotal;
      grandNet += netSalary;

      const payoutBadge = isPaid
        ? '<span class="badge badge-success" style="font-size:0.72rem; padding:2px 8px;">Paid</span>'
        : '<span class="badge badge-warning" style="font-size:0.72rem; padding:2px 8px;">Unpaid</span>';

      const payActionBtn = isPaid
        ? `<button class="btn btn-ghost btn-sm summary-btn-unpay admin-only" data-employee="${escapeHtml(name)}" style="padding:4px 8px; font-size:0.7rem; height:24px; min-width:unset;">Unpay</button>`
        : `<button class="btn btn-success btn-sm summary-btn-pay admin-only" data-employee="${escapeHtml(name)}" style="padding:4px 8px; font-size:0.7rem; height:24px; min-width:unset; color:#fff;">Pay</button>`;

      return `
        <tr style="border-bottom:1px solid var(--glass-border); background: ${isPaid ? 'rgba(16,185,129,0.02)' : 'transparent'};">
          <td style="padding:10px; font-size:0.85rem; text-align:center; font-weight:600; color:rgba(255,255,255,0.5);">${index + 1}</td>
          <td style="font-weight:700; padding:10px; font-size:0.9rem;">${escapeHtml(name)}</td>
          <td style="padding:10px; text-align:center; font-size:0.88rem; font-variant-numeric:tabular-nums;">${c.totalDays.toFixed(1)}</td>
          <td class="text-right font-mono" style="padding:10px; font-size:0.85rem;">${utils.formatCurrency(daySalary)}</td>
          <td class="text-right font-mono font-bold" style="padding:10px; font-size:0.88rem;">${utils.formatCurrency(totalSalary)}</td>
          <td class="text-right font-mono" style="padding:10px; font-size:0.85rem; color:${basicSalary > 0 ? 'var(--primary-light,#818cf8)' : 'rgba(255,255,255,0.3)'};">${basicSalary > 0 ? utils.formatCurrency(basicSalary) : '—'}</td>
          <td class="text-right font-mono" style="padding:10px; font-size:0.85rem;">${incentive > 0 ? utils.formatCurrency(incentive) : '—'}</td>
          <td class="text-right font-mono" style="padding:10px; font-size:0.85rem; color:${vehicleRent > 0 ? 'var(--info,#06b6d4)' : 'rgba(255,255,255,0.3)'};">${vehicleRent > 0 ? utils.formatCurrency(vehicleRent) : '—'}</td>
          <td class="text-right font-mono font-bold" style="padding:10px; font-size:0.9rem; color:var(--warning,#f59e0b);">${utils.formatCurrency(grossSalary)}</td>
          <td class="text-right font-mono text-danger" style="padding:10px; font-size:0.85rem;">${epf8 > 0 ? `-${utils.formatCurrency(epf8)}` : '—'}</td>
          <td class="text-right font-mono text-danger" style="padding:10px; font-size:0.85rem;">${advTotal > 0 ? `-${utils.formatCurrency(advTotal)}` : '—'}</td>
          <td class="text-right font-mono text-danger" style="padding:10px; font-size:0.85rem;">${loanTotal > 0 ? `-${utils.formatCurrency(loanTotal)}` : '—'}</td>
          <td class="text-right font-mono font-bold" style="padding:10px; font-size:0.95rem; color:${netSalary >= 0 ? 'var(--success,#10b981)' : 'var(--danger,#ef4444)'};">${utils.formatCurrency(netSalary)}</td>
          <td style="padding:8px; text-align:center;">
            <div style="display:flex; gap:4px; justify-content:center; align-items:center;">
              <button class="btn btn-ghost btn-sm summary-btn-paysheet" data-employee="${escapeHtml(name)}" title="Generate Pay Sheet Slip" style="padding:4px 8px; font-size:0.72rem; height:26px; min-width:unset; border:1px solid var(--glass-border);">📄 Pay Sheet</button>
              ${payActionBtn}
            </div>
          </td>
        </tr>`;
    }).join('');

    let hasTempDrivers = false;
    let totalTempPayable = 0;
    const tempDriverRows = employees.map(name => {
      const c = counts[name] || {};
      const rateConfig = rates[name] || {};
      const isDriver = (name === 'Wimal' || name === 'Bandu Thilaka' || name === 'Jayarathna' || Number(rateConfig.tempDriverRate) > 0);
      if (!isDriver) return '';

      const tempDriverRate = Number(rateConfig.tempDriverRate) || 1800;
      const tempDays = c.tempDriverDays || 0;
      const tempPayable = tempDays * tempDriverRate;
      
      if (tempDays === 0) return '';
      hasTempDrivers = true;
      totalTempPayable += tempPayable;
      
      const routeLabel = name === 'Wimal' ? 'Domie Route' : (name === 'Bandu Thilaka' ? 'Kelani Route' : (name === 'Jayarathna' ? 'Bathipooja Route' : `${name}'s Route`));

      return `
        <tr style="border-bottom:1px solid var(--glass-border);">
          <td style="font-weight:700; padding:12px; font-size:0.92rem;">${routeLabel} <span style="font-size:0.75rem; font-weight:normal; color:rgba(255,255,255,0.4);">(${escapeHtml(name)}'s Vehicle)</span></td>
          <td style="padding:12px; text-align:center; font-variant-numeric:tabular-nums; font-size:0.88rem;">${tempDays} Days</td>
          <td class="text-right font-mono" style="padding:12px; font-size:0.85rem; color:rgba(255,255,255,0.65);">${utils.formatCurrency(tempDriverRate)}</td>
          <td class="text-right font-mono font-bold" style="padding:12px; font-size:0.95rem; color:var(--primary-light,#818cf8);">${utils.formatCurrency(tempPayable)}</td>
        </tr>`;
    }).join('');

    const tempDriverSectionHtml = !hasTempDrivers
      ? ''
      : `
        <div style="margin-top:30px;">
          <h4 style="margin:0 0 10px; font-size:1rem; font-weight:700; color:var(--primary-light,#818cf8);">Temporary Driver Payout Summary</h4>
          <div class="table-wrapper" style="overflow-x:auto; border-radius:8px; border:1px solid var(--glass-border);">
            <table style="width:100%; border-collapse:collapse; min-width:600px;">
              <thead>
                <tr style="background:rgba(255,255,255,0.02); border-bottom:2px solid var(--glass-border);">
                  <th style="text-align:left; padding:12px;">Route / Vehicle</th>
                  <th style="text-align:center; padding:12px; width:150px;">Days Worked</th>
                  <th style="text-align:right; padding:12px; width:150px;">Daily Rate</th>
                  <th style="text-align:right; padding:12px; width:180px;">Total Payable</th>
                </tr>
              </thead>
              <tbody>
                ${tempDriverRows}
                <tr style="background:rgba(255,255,255,0.03); border-top:2px solid var(--glass-border); font-weight:700;">
                  <td colspan="3" style="padding:14px 12px; font-size:0.9rem;">Grand Total Temp Drivers</td>
                  <td class="text-right font-mono font-bold" style="padding:14px 12px; font-size:1.02rem; color:var(--primary-light,#818cf8);">${utils.formatCurrency(totalTempPayable)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>`;

    return `
      <div class="anim-fade card" style="padding:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:12px;">
          <div>
            <h3 style="margin:0 0 4px; font-size:1.1rem; font-weight:700;">Monthly Payroll Table</h3>
            <p style="margin:0; font-size:0.8rem; color:rgba(255,255,255,0.4);">Auto-computes wages, EPF 8%, advances, vehicle rent, and net salaries based on daily logs.</p>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <label class="form-label" style="margin:0; font-size:0.85rem;">Salary Month:</label>
            <input type="month" class="form-input" id="sum-month-input" value="${selectedSummaryMonth}" style="width:160px; padding:6px 10px;">
            <button class="btn btn-ghost btn-sm" id="payroll-export-csv" style="padding:6px 12px; font-size:0.8rem; color:#10B981; border:1px solid rgba(16,185,129,0.3);">
              📊 Export Payroll CSV
            </button>
          </div>
        </div>

        <div class="table-wrapper" style="overflow-x:auto; border-radius:8px; border:1px solid var(--glass-border); margin-bottom:20px;">
          <table style="width:100%; border-collapse:collapse; min-width:1100px; font-size:0.85rem;">
            <thead>
              <tr style="background:rgba(255,255,255,0.02); border-bottom:2px solid var(--glass-border); text-transform:uppercase; font-size:0.75rem; letter-spacing:0.5px; color:rgba(255,255,255,0.6);">
                <th style="text-align:center; padding:10px; width:45px;">NOS</th>
                <th style="text-align:left; padding:10px; width:150px;">NAME</th>
                <th style="text-align:center; padding:10px; width:80px;">WORKING DAYS</th>
                <th style="text-align:right; padding:10px; width:90px;">DAY SALARY</th>
                <th style="text-align:right; padding:10px; width:100px;">TOTAL SALARY</th>
                <th style="text-align:right; padding:10px; width:100px;">BASIC SALARY</th>
                <th style="text-align:right; padding:10px; width:100px;">INCENTIVE</th>
                <th style="text-align:right; padding:10px; width:100px;">LORRY RENT</th>
                <th style="text-align:right; padding:10px; width:110px;">GROSS SALARY</th>
                <th style="text-align:right; padding:10px; width:85px;">EPF 8%</th>
                <th style="text-align:right; padding:10px; width:95px;">ADVANCE</th>
                <th style="text-align:right; padding:10px; width:85px;">LOAN</th>
                <th style="text-align:right; padding:10px; width:110px;">NET SALARY</th>
                <th style="text-align:center; padding:10px; width:120px;">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
              <!-- Grand Total Row -->
              <tr style="background:rgba(255,255,255,0.04); border-top:2px solid var(--glass-border); font-weight:700;">
                <td colspan="4" style="padding:14px 10px; font-size:0.88rem;">TOTAL</td>
                <td class="text-right font-mono" style="padding:14px 10px;">${utils.formatCurrency(grandTotalSalary)}</td>
                <td class="text-right font-mono" style="padding:14px 10px; color:var(--primary-light,#818cf8);">${utils.formatCurrency(grandBasicSalary)}</td>
                <td class="text-right font-mono" style="padding:14px 10px;">${utils.formatCurrency(grandIncentive)}</td>
                <td class="text-right font-mono" style="padding:14px 10px; color:var(--info,#06b6d4);">${utils.formatCurrency(grandVehicleRent)}</td>
                <td class="text-right font-mono" style="padding:14px 10px; color:var(--warning,#f59e0b);">${utils.formatCurrency(grandGross)}</td>
                <td class="text-right font-mono text-danger" style="padding:14px 10px;">-${utils.formatCurrency(grandEpf8)}</td>
                <td class="text-right font-mono text-danger" style="padding:14px 10px;">-${utils.formatCurrency(grandAdvances)}</td>
                <td class="text-right font-mono text-danger" style="padding:14px 10px;">-${utils.formatCurrency(grandLoans)}</td>
                <td class="text-right font-mono font-bold" style="padding:14px 10px; font-size:1.02rem; color:var(--success,#10b981);">${utils.formatCurrency(grandNet)}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>

        ${tempDriverSectionHtml}
      </div>`;
  }

  // --- Tab 4: Employee Setup ---
  function renderSetupTab() {
    const rates = data.getEmployeeRates();
    const employees = getEmployeesList();
    
    const rows = employees.map(name => {
      const config = rates[name] || { type: 'daily', rate: 2000, epfEligible: false, basicSalary: 30000, vehicleRate: 0, loanDeduction: 0 };
      const isEpf = config.epfEligible !== false && (name === 'Sanki' || name === 'Jayarathna' || name === 'Achini Isnaka' || config.epfEligible === true);

      return `
        <div class="card" style="padding:16px; border: 1px solid var(--glass-border); background:rgba(255,255,255,0.01); display:flex; flex-direction:column; justify-content:space-between;">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; padding-bottom:10px; border-bottom:1px solid rgba(255,255,255,0.06);">
              <h4 style="margin:0; font-size:1.05rem; font-weight:700; color:var(--primary-light,#818cf8);">${escapeHtml(name)}</h4>
              <div style="display:flex; gap:4px;">
                <button type="button" class="btn btn-ghost btn-sm btn-icon setup-duplicate-btn admin-only" data-employee="${escapeHtml(name)}" title="Duplicate Employee Settings" style="padding:4px; font-size:0.9rem;">
                  📋
                </button>
                <button type="button" class="btn btn-ghost btn-sm btn-icon setup-delete-btn admin-only" data-employee="${escapeHtml(name)}" title="Delete Employee" style="padding:4px; font-size:0.9rem; color:var(--danger,#ef4444);">
                  🗑️
                </button>
              </div>
            </div>
            
            <div class="form-group" style="margin-bottom:12px;">
              <label class="form-label" style="font-size:0.75rem;">EPF 8% Deduction Eligible</label>
              <select class="form-select setup-epf-select" data-employee="${escapeHtml(name)}">
                <option value="true" ${isEpf ? 'selected' : ''}>Yes (Deduct EPF 8% on Base Salary)</option>
                <option value="false" ${!isEpf ? 'selected' : ''}>No (Direct Wages / Vehicle Rent)</option>
              </select>
            </div>

            <div class="form-group" style="margin-bottom:12px;">
              <label class="form-label" style="font-size:0.75rem;">Day Salary Rate (Rs. / Day)</label>
              <input type="number" class="form-input setup-rate-input" data-employee="${escapeHtml(name)}" 
                     placeholder="Rate Amount" min="0" step="100" value="${config.rate != null ? config.rate : 2000}">
            </div>

            <div class="form-group" style="margin-bottom:12px;">
              <label class="form-label" style="font-size:0.75rem;">EPF Fixed Basic Salary (Rs.)</label>
              <input type="number" class="form-input setup-basic-input" data-employee="${escapeHtml(name)}" 
                     placeholder="Basic Salary" min="0" step="1000" value="${config.basicSalary != null ? config.basicSalary : 30000}">
            </div>

            <div class="form-group" style="margin-bottom:12px;">
              <label class="form-label" style="font-size:0.75rem;">Vehicle Allowance Rate (Rs. / Day)</label>
              <input type="number" class="form-input setup-vehiclerate-input" data-employee="${escapeHtml(name)}" 
                     placeholder="Vehicle Rate (0 for none)" min="0" step="100" value="${config.vehicleRate || 0}">
            </div>

            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label" style="font-size:0.75rem;">Monthly Loan Recovery (Rs.)</label>
              <input type="number" class="form-input setup-loan-input" data-employee="${escapeHtml(name)}" 
                     placeholder="Loan Deduction Amount" min="0" step="500" value="${config.loanDeduction || 0}">
            </div>
          </div>
        </div>`;
    }).join('');

    return `
      <div class="anim-fade card" style="padding:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:12px;">
          <div>
            <h3 style="margin:0 0 4px; font-size:1.1rem; font-weight:700;">Employee Rate Structures</h3>
            <p style="margin:0; font-size:0.8rem; color:rgba(255,255,255,0.4);">Configure monthly baselines, EPF eligibility, daily wages, and loans.</p>
          </div>

          <div style="display:flex; gap:10px; align-items:center;">
            <button class="btn btn-ghost admin-only" id="setup-add-btn" style="padding:8px 16px; font-size:0.85rem; display:flex; align-items:center; gap:6px;">
              ➕ Add New Employee
            </button>
            <button class="btn btn-primary admin-only" id="setup-save-btn" style="padding:8px 20px; font-size:0.85rem; display:flex; align-items:center; gap:6px;">
              💾 Save Configurations
            </button>
          </div>
        </div>

        <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:16px; margin-bottom:20px;">
          ${rows}
        </div>
      </div>`;
  }

  // ---------------------------------------------------------------------------
  // Main Render View Dispatcher
  // ---------------------------------------------------------------------------
  function render(appState) {
    const isAdmin = AgencyHub.isAdmin();
    if (!isAdmin && (activeTab === 'summary' || activeTab === 'setup')) {
      activeTab = 'attendance';
    }

    let activeTabContent = '';
    if (activeTab === 'attendance') activeTabContent = renderAttendanceTab();
    else if (activeTab === 'advances') activeTabContent = renderAdvancesTab();
    else if (activeTab === 'summary' && isAdmin) activeTabContent = renderSummaryTab();
    else if (activeTab === 'setup' && isAdmin) activeTabContent = renderSetupTab();

    return `
      <div id="attendance-payroll-module">
        <div class="section-header anim-fade" style="margin-bottom:16px;">
          <div>
            <h1 class="section-title">Attendance & Payroll</h1>
            <p class="section-subtitle">Track staff logs, advances, and auto-compute monthly payouts</p>
          </div>
        </div>

        <!-- Top Navigation Tabs -->
        <div class="payroll-tabs anim-fade" style="display:flex; flex-wrap:wrap; gap:8px; border-bottom:1px solid var(--glass-border); padding-bottom:12px; margin-bottom:20px;">
          <button class="btn ${activeTab === 'attendance' ? 'btn-primary' : 'btn-ghost'}" id="p-tab-btn-attendance" style="padding:8px 16px; font-size:0.85rem; height:36px; min-width:unset;">📅 Daily Attendance</button>
          <button class="btn ${activeTab === 'advances' ? 'btn-primary' : 'btn-ghost'}" id="p-tab-btn-advances" style="padding:8px 16px; font-size:0.85rem; height:36px; min-width:unset;">💸 Salary Advances & Loans</button>
          ${isAdmin ? `
          <button class="btn ${activeTab === 'summary' ? 'btn-primary' : 'btn-ghost'}" id="p-tab-btn-summary" style="padding:8px 16px; font-size:0.85rem; height:36px; min-width:unset;">📊 Salary Summary</button>
          <button class="btn ${activeTab === 'setup' ? 'btn-primary' : 'btn-ghost'}" id="p-tab-btn-setup" style="padding:8px 16px; font-size:0.85rem; height:36px; min-width:unset;">⚙️ Employee Setup</button>
          ` : ''}
        </div>

        <!-- Dynamic Body Content -->
        <div id="payroll-tab-content">
          ${activeTabContent}
        </div>
      </div>`;
  }

  // ---------------------------------------------------------------------------
  // Tab Action Handlers & Modals
  // ---------------------------------------------------------------------------
  function showPaySheetModal(employee) {
    const counts = getMonthlyAttendanceCounts(selectedSummaryMonth);
    const c = counts[employee] || { present: 0, half: 0, absent: 0, totalDays: 0, vehicleWorkedDays: 0 };
    const advances = getMonthlyAdvancesTotal(selectedSummaryMonth);
    const advTotal = advances[employee] || 0;
    const rates = data.getEmployeeRates();
    const rateConfig = rates[employee] || { type: 'daily', rate: 2000, epfEligible: false, basicSalary: 30000, vehicleRate: 0, loanDeduction: 0 };

    const daySalary = Number(rateConfig.rate) || 2000;
    const totalSalary = c.totalDays * daySalary;

    const isEpfEligible = rateConfig.epfEligible !== false && (employee === 'Sanki' || employee === 'Jayarathna' || employee === 'Achini Isnaka' || rateConfig.epfEligible === true);
    
    let basicSalary = 0;
    let incentive = 0;
    let epf8 = 0;
    let epf12 = 0;
    let etf3 = 0;
    let vehicleRent = 0;
    let grossSalary = 0;

    if (isEpfEligible) {
      basicSalary = Number(rateConfig.basicSalary) || 30000;
      incentive = Math.max(0, totalSalary - basicSalary);
      grossSalary = basicSalary + incentive;
      epf8 = Math.round(basicSalary * 0.08); // 2400
      epf12 = Math.round(basicSalary * 0.12); // 3600
      etf3 = Math.round(basicSalary * 0.03); // 900
    } else {
      basicSalary = 0;
      incentive = totalSalary;
      const vehicleRate = Number(rateConfig.vehicleRate) || 0;
      vehicleRent = (c.vehicleWorkedDays || 0) * vehicleRate;
      grossSalary = totalSalary + vehicleRent;
      epf8 = 0;
      epf12 = 0;
      etf3 = 0;
    }

    const loanTotal = Number(rateConfig.loanDeduction) || 0;
    const totalDeductions = epf8 + advTotal + loanTotal;
    const netSalary = grossSalary - totalDeductions;

    const employeesList = getEmployeesList();
    const empIndex = employeesList.indexOf(employee);
    const empNoStr = (empIndex >= 0 ? empIndex + 1 : 1).toString().padStart(2, '0');

    const dateObj = new Date(selectedSummaryMonth + '-01');
    const monthName = isNaN(dateObj.getTime()) 
      ? selectedSummaryMonth 
      : dateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();

    const body = `
      <div id="payslip-modal-printable" style="background:#ffffff; color:#0f172a; padding:24px; border-radius:8px; font-family:'Segoe UI', system-ui, -apple-system, sans-serif; font-size:13px; max-width:680px; margin:0 auto; box-shadow:0 10px 25px rgba(0,0,0,0.15);">
        <!-- Company Header -->
        <div style="text-align:center; margin-bottom:18px; border-bottom:2px solid #1e293b; padding-bottom:12px;">
          <h2 style="margin:0; font-size:1.35rem; font-weight:800; text-transform:uppercase; letter-spacing:1px; color:#0f172a;">D & G AGRO LANKA ( PVT ) LTD</h2>
          <h3 style="margin:4px 0 0; font-size:1.05rem; font-weight:700; color:#475569; letter-spacing:0.5px;">PAY SHEET</h3>
        </div>

        <!-- Employee Info Header -->
        <div style="display:flex; justify-content:space-between; margin-bottom:18px; font-size:0.88rem; font-weight:600; color:#334155; background:#f8fafc; padding:10px 14px; border-radius:6px; border:1px solid #e2e8f0;">
          <div>
            <div style="margin-bottom:4px;">PAY SLIP FOR : <span style="font-weight:700; color:#0f172a;">${monthName}</span></div>
            <div>NAME : <span style="font-weight:700; text-transform:uppercase; color:#0f172a;">${escapeHtml(employee)}</span></div>
            <div style="margin-top:2px;">EMPLOYEE NO : <span style="font-weight:700; color:#0f172a;">${empNoStr}</span></div>
          </div>
          <div style="text-align:right;">
            <div style="margin-bottom:4px;">WORKING DAYS : <span style="font-weight:700; color:#0f172a;">${c.totalDays.toFixed(1)}</span></div>
            <div>DAY SALARY RATE : <span style="font-weight:700; color:#0f172a;">Rs. ${daySalary.toLocaleString()}</span></div>
            ${vehicleRent > 0 ? `<div style="margin-top:2px; color:#0284c7;">VEHICLE DAYS : <span style="font-weight:700;">${c.vehicleWorkedDays}</span></div>` : ''}
          </div>
        </div>

        <!-- Grid Tables for Earnings and Deductions -->
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; margin-bottom:18px;">
          <!-- EARNINGS TABLE -->
          <table style="width:100%; border-collapse:collapse; border:1px solid #cbd5e1; font-size:12px;">
            <thead>
              <tr style="background:#f1f5f9; border-bottom:1px solid #cbd5e1;">
                <th style="text-align:left; padding:8px 10px; font-weight:700; color:#0f172a;">EARNINGS</th>
                <th style="text-align:right; padding:8px 10px; font-weight:700; color:#0f172a;">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              <tr><td style="padding:6px 10px; border-bottom:1px solid #f1f5f9;">BASIC SALARY</td><td style="text-align:right; padding:6px 10px; font-family:monospace; border-bottom:1px solid #f1f5f9;">${basicSalary > 0 ? basicSalary.toLocaleString() : '-'}</td></tr>
              <tr><td style="padding:6px 10px; border-bottom:1px solid #f1f5f9;">B R ALLOWANCE</td><td style="text-align:right; padding:6px 10px; font-family:monospace; border-bottom:1px solid #f1f5f9;">-</td></tr>
              <tr><td style="padding:6px 10px; border-bottom:1px solid #f1f5f9;">TOTAL SALARY</td><td style="text-align:right; padding:6px 10px; font-family:monospace; border-bottom:1px solid #f1f5f9;">${totalSalary.toLocaleString()}</td></tr>
              <tr><td style="padding:6px 10px; border-bottom:1px solid #f1f5f9;">VEHICLE RENT</td><td style="text-align:right; padding:6px 10px; font-family:monospace; border-bottom:1px solid #f1f5f9;">${vehicleRent > 0 ? vehicleRent.toLocaleString() : '-'}</td></tr>
              <tr><td style="padding:6px 10px; border-bottom:1px solid #f1f5f9;">ATTENDANCE INCENTIVE</td><td style="text-align:right; padding:6px 10px; font-family:monospace; border-bottom:1px solid #f1f5f9;">${incentive > 0 ? incentive.toLocaleString() : '-'}</td></tr>
              <tr style="font-weight:700; background:#f8fafc; border-top:2px solid #cbd5e1; color:#0f172a;">
                <td style="padding:8px 10px;">TOTAL EARNINGS</td>
                <td style="text-align:right; padding:8px 10px; font-family:monospace; font-size:13px;">${grossSalary.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          <!-- DEDUCTIONS TABLE -->
          <table style="width:100%; border-collapse:collapse; border:1px solid #cbd5e1; font-size:12px;">
            <thead>
              <tr style="background:#f1f5f9; border-bottom:1px solid #cbd5e1;">
                <th style="text-align:left; padding:8px 10px; font-weight:700; color:#0f172a;">DEDUCTIONS</th>
                <th style="text-align:right; padding:8px 10px; font-weight:700; color:#0f172a;">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              <tr><td style="padding:6px 10px; border-bottom:1px solid #f1f5f9;">E P F 8%</td><td style="text-align:right; padding:6px 10px; font-family:monospace; color:${epf8 > 0 ? '#dc2626' : 'inherit'}; border-bottom:1px solid #f1f5f9;">${epf8 > 0 ? epf8.toLocaleString() : '-'}</td></tr>
              <tr><td style="padding:6px 10px; border-bottom:1px solid #f1f5f9;">SALARY ADVANCE</td><td style="text-align:right; padding:6px 10px; font-family:monospace; color:${advTotal > 0 ? '#dc2626' : 'inherit'}; border-bottom:1px solid #f1f5f9;">${advTotal > 0 ? advTotal.toLocaleString() : '-'}</td></tr>
              <tr><td style="padding:6px 10px; border-bottom:1px solid #f1f5f9;">LOAN RECOVERY</td><td style="text-align:right; padding:6px 10px; font-family:monospace; color:${loanTotal > 0 ? '#dc2626' : 'inherit'}; border-bottom:1px solid #f1f5f9;">${loanTotal > 0 ? loanTotal.toLocaleString() : '-'}</td></tr>
              <tr><td style="padding:6px 10px; border-bottom:1px solid #f1f5f9;">WELFARE</td><td style="text-align:right; padding:6px 10px; font-family:monospace; border-bottom:1px solid #f1f5f9;">-</td></tr>
              <tr><td style="padding:6px 10px; border-bottom:1px solid #f1f5f9;">NO PAY / DAMAGE</td><td style="text-align:right; padding:6px 10px; font-family:monospace; border-bottom:1px solid #f1f5f9;">-</td></tr>
              <tr style="font-weight:700; background:#f8fafc; border-top:2px solid #cbd5e1; color:#0f172a;">
                <td style="padding:8px 10px;">TOTAL DEDUCTIONS</td>
                <td style="text-align:right; padding:8px 10px; font-family:monospace; font-size:13px; color:${totalDeductions > 0 ? '#dc2626' : '#0f172a'};">${totalDeductions.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- NET PAY BANNER -->
        <div style="background:#059669; color:#ffffff; padding:12px 18px; border-radius:6px; display:flex; justify-content:space-between; align-items:center; font-weight:800; font-size:1.1rem; margin-bottom:0; letter-spacing:0.5px;">
          <span>NET PAY</span>
          <span style="font-family:monospace; font-size:1.25rem;">Rs. ${netSalary.toLocaleString()}</span>
        </div>
      </div>`;

    const footer = `
      <button class="btn btn-ghost" onclick="AgencyHub.utils.closeModal()">Close</button>
      <button class="btn btn-ghost" id="btn-download-paysheet-pdf" style="display:flex; align-items:center; gap:6px; color:var(--primary-light,#818cf8);">
        📥 Download Paysheet PDF
      </button>
      <button class="btn btn-primary" id="btn-print-paysheet" style="display:flex; align-items:center; gap:6px;">
        🖨️ Print Pay Sheet
      </button>`;

    utils.showModal('Pay Sheet Preview', body, footer, {
      size: 'md',
      onInit: () => {
        const printBtn = document.getElementById('btn-print-paysheet');
        if (printBtn) {
          printBtn.addEventListener('click', () => {
            const printContent = document.getElementById('payslip-modal-printable').outerHTML;
            const printWindow = window.open('', '_blank', 'width=800,height=700');
            printWindow.document.write(`
              <html>
                <head>
                  <title>Pay Sheet - ${employee}</title>
                  <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 20px; background: #fff; }
                    @media print {
                      body { margin: 0; }
                      #payslip-modal-printable { box-shadow: none !important; border: 1px solid #ccc !important; }
                    }
                  </style>
                </head>
                <body>
                  ${printContent}
                  <script>
                    window.onload = function() { window.print(); window.close(); };
                  <\/script>
                </body>
              </html>
            `);
            printWindow.document.close();
          });
        }

        const pdfBtn = document.getElementById('btn-download-paysheet-pdf');
        if (pdfBtn) {
          pdfBtn.addEventListener('click', () => {
            const el = document.getElementById('payslip-modal-printable');
            if (!el) return;

            AgencyHub.utils.toast('Generating Pay Sheet PDF...', 'info');

            const opt = {
              margin:       [8, 8, 8, 8],
              filename:     `PaySheet_${employee}_${month}.pdf`,
              image:        { type: 'jpeg', quality: 0.98 },
              html2canvas:  { scale: 2, useCORS: true, logging: false },
              jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            if (window.html2pdf) {
              window.html2pdf().set(opt).from(el).save().then(() => {
                AgencyHub.utils.toast('Pay Sheet PDF downloaded!', 'success');
              }).catch(err => {
                console.error(err);
              });
            }
          });
        }
      }
    });
  }

  function showAddEmployeeModal(sourceEmployeeName = null) {
    const rates = data.getEmployeeRates() || {};
    const sourceConfig = sourceEmployeeName && rates[sourceEmployeeName] 
      ? rates[sourceEmployeeName] 
      : { type: 'daily', rate: 2000, epfEligible: false, basicSalary: 30000, vehicleRate: 0, loanDeduction: 0 };

    const initialName = sourceEmployeeName ? `${sourceEmployeeName} (Copy)` : '';
    const title = sourceEmployeeName ? `Duplicate Employee (${escapeHtml(sourceEmployeeName)})` : 'Add New Employee';

    const body = `
      <div class="form-group">
        <label class="form-label">Employee Name *</label>
        <input type="text" class="form-input" id="emp-modal-name" value="${escapeHtml(initialName)}" placeholder="e.g. Nimal Perera">
      </div>

      <div class="form-group">
        <label class="form-label">EPF 8% Deduction Eligible</label>
        <select class="form-select" id="emp-modal-epf">
          <option value="true" ${sourceConfig.epfEligible !== false ? 'selected' : ''}>Yes (Deduct EPF 8% on Base Salary)</option>
          <option value="false" ${sourceConfig.epfEligible === false ? 'selected' : ''}>No (Direct Wages / Vehicle Rent)</option>
        </select>
      </div>

      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">Day Salary Rate (Rs./Day) *</label>
          <input type="number" class="form-input" id="emp-modal-rate" min="0" step="100" value="${sourceConfig.rate != null ? sourceConfig.rate : 2000}">
        </div>
        <div class="form-group">
          <label class="form-label">EPF Base Salary (Rs.)</label>
          <input type="number" class="form-input" id="emp-modal-basic" min="0" step="1000" value="${sourceConfig.basicSalary != null ? sourceConfig.basicSalary : 30000}">
        </div>
      </div>

      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">Vehicle Allowance Rate (Rs./Day)</label>
          <input type="number" class="form-input" id="emp-modal-vehiclerate" min="0" step="100" value="${sourceConfig.vehicleRate || 0}">
        </div>
        <div class="form-group">
          <label class="form-label">Monthly Loan Recovery (Rs.)</label>
          <input type="number" class="form-input" id="emp-modal-loan" min="0" step="500" value="${sourceConfig.loanDeduction || 0}">
        </div>
      </div>`;

    const footer = `
      <button class="btn btn-ghost" onclick="AgencyHub.utils.closeModal()">Cancel</button>
      <button class="btn btn-primary" id="emp-modal-save">
        💾 Save Employee
      </button>`;

    utils.showModal(title, body, footer, {
      size: 'sm',
      onInit: () => {
        const nameInput = document.getElementById('emp-modal-name');
        if (nameInput) nameInput.focus();

        document.getElementById('emp-modal-save').addEventListener('click', () => {
          const empName = document.getElementById('emp-modal-name').value.trim();
          const epfEligible = document.getElementById('emp-modal-epf').value === 'true';
          const rate = parseFloat(document.getElementById('emp-modal-rate').value) || 0;
          const basicSalary = parseFloat(document.getElementById('emp-modal-basic').value) || 0;
          const vehicleRate = parseFloat(document.getElementById('emp-modal-vehiclerate').value) || 0;
          const loanDeduction = parseFloat(document.getElementById('emp-modal-loan').value) || 0;

          if (!empName) {
            utils.toast('Please enter employee name', 'warning');
            return;
          }

          const currentRates = data.getEmployeeRates() || {};
          if (!sourceEmployeeName && currentRates[empName]) {
            utils.toast(`Employee "${empName}" already exists!`, 'warning');
            return;
          }

          currentRates[empName] = { type: 'daily', rate, epfEligible, basicSalary, vehicleRate, loanDeduction };
          data.saveEmployeeRates(currentRates);

          const list = getEmployeesList();
          if (!list.includes(empName)) {
            list.push(empName);
            data._set('payroll_employees', list);
          }

          utils.toast(`Employee "${empName}" ${sourceEmployeeName ? 'duplicated' : 'added'} successfully!`, 'success');
          utils.closeModal();
          AgencyHub.navigate(state.currentPage);
        });
      }
    });
  }

  function showAdvanceModal() {
    const body = `
      <div class="form-group">
        <label class="form-label">Entry Type *</label>
        <select class="form-select" id="adv-modal-type">
          <option value="advance">Salary Advance</option>
          <option value="loan">Loan Payment / Recovery</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Employee Name *</label>
        <select class="form-select" id="adv-modal-employee">
          ${getEmployeesList().map(name => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join('')}
        </select>
      </div>

      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">Date *</label>
          <input type="date" class="form-input" id="adv-modal-date" value="${utils.today()}">
        </div>
        <div class="form-group">
          <label class="form-label">Amount (Rs.) *</label>
          <input type="number" class="form-input" id="adv-modal-amount" placeholder="0.00" min="1" step="100">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Notes / Remarks</label>
        <input type="text" class="form-input" id="adv-modal-notes" placeholder="e.g. Festival advance, emergency cash, vehicle loan...">
      </div>`;

    const footer = `
      <button class="btn btn-ghost" onclick="AgencyHub.utils.closeModal()">Cancel</button>
      <button class="btn btn-primary" id="adv-modal-save">
        💾 Save Record
      </button>`;

    utils.showModal('Record Salary Advance / Loan', body, footer, {
      size: 'sm',
      onInit: () => {
        document.getElementById('adv-modal-save').addEventListener('click', () => {
          const type = document.getElementById('adv-modal-type').value;
          const employee = document.getElementById('adv-modal-employee').value;
          const date = document.getElementById('adv-modal-date').value || utils.today();
          const amount = parseFloat(document.getElementById('adv-modal-amount').value);
          const notes = document.getElementById('adv-modal-notes').value.trim();

          if (!amount || amount <= 0) {
            utils.toast('Please enter a valid amount', 'warning');
            return;
          }

          data.saveAdvance({ employee, date, amount, notes, type });
          utils.toast(`${type === 'loan' ? 'Loan payment' : 'Salary advance'} recorded successfully!`, 'success');
          utils.closeModal();
          AgencyHub.navigate(state.currentPage);
        });
      }
    });
  }

  function showSummaryDetailModal(employee) {
    const counts = getMonthlyAttendanceCounts(selectedSummaryMonth);
    const c = counts[employee];
    const advances = data.getAdvances({
      employee,
      month: selectedSummaryMonth
    });
    const rates = data.getEmployeeRates();
    const rateConfig = rates[employee] || { type: 'daily', rate: 1800, vehicleRate: 0, tempDriverRate: 1800 };

    // Find days present list
    const allAttendance = data._get('attendance') || {};
    const attendDates = [];
    const vehicleDates = [];
    const tempDates = [];
    Object.keys(allAttendance).sort().forEach(date => {
      if (date.startsWith(selectedSummaryMonth)) {
        const stat = allAttendance[date][employee] || 'absent';
        attendDates.push({ date, status: stat });
        
        const vehicleStatus = allAttendance[date][employee + '_vehicle'] || 'idle';
        if (vehicleStatus === 'worked') {
          vehicleDates.push(date);
        }

        const tempStatus = allAttendance[date][employee + '_temp'] || 'idle';
        if (tempStatus === 'worked') {
          tempDates.push(date);
        }
      }
    });

    const ratesLabel = rateConfig.type === 'daily' 
      ? `Daily wage of ${utils.formatCurrency(rateConfig.rate)}`
      : `Monthly basic of ${utils.formatCurrency(rateConfig.rate)}`;

    const attendanceListHtml = attendDates.length === 0
      ? '<p class="text-muted text-sm" style="text-align:center; padding:16px;">No daily logs found for this employee in the selected month.</p>'
      : `
        <div style="max-height:180px; overflow-y:auto; border:1px solid var(--glass-border); border-radius:6px; padding:8px 12px; margin-bottom:12px; background:rgba(0,0,0,0.1);">
          ${attendDates.map(item => {
            let badgeClass = 'badge-success';
            if (item.status === 'half') badgeClass = 'badge-warning';
            if (item.status === 'absent') badgeClass = 'badge-danger';
            return `
              <div class="flex items-center justify-between text-xs" style="padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.03);">
                <span>${utils.formatDate(item.date)}</span>
                <span class="badge ${badgeClass}" style="text-transform: capitalize; font-size:0.65rem; padding:1px 6px;">${item.status}</span>
              </div>`;
          }).join('')}
        </div>`;

    const advancesListHtml = advances.length === 0
      ? '<p class="text-muted text-sm" style="text-align:center; padding:16px;">No advances logged for this month.</p>'
      : `
        <div style="max-height:150px; overflow-y:auto; border:1px solid var(--glass-border); border-radius:6px; padding:8px 12px; background:rgba(0,0,0,0.1);">
          ${advances.map(adv => `
            <div class="flex items-center justify-between text-xs" style="padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.03);">
              <span>${utils.formatDate(adv.date)} ${adv.notes ? `<span class="text-muted">(${adv.notes})</span>` : ''}</span>
              <span class="font-mono text-danger font-bold">-${utils.formatCurrency(adv.amount)}</span>
            </div>`).join('')}
        </div>`;

    const vehicleRate = Number(rateConfig.vehicleRate) || 0;
    const vehicleAllowance = (c.vehicleWorkedDays || 0) * vehicleRate;
    
    const vehicleDatesListHtml = vehicleDates.length === 0
      ? '<p class="text-muted text-sm" style="text-align:center; padding:10px 0;">No active vehicle logs recorded for this month.</p>'
      : `
        <div style="max-height:100px; overflow-y:auto; border:1px solid var(--glass-border); border-radius:6px; padding:6px 12px; margin-bottom:12px; background:rgba(0,0,0,0.1);">
          ${vehicleDates.map(d => `
            <div class="flex items-center justify-between text-xs" style="padding:3px 0; border-bottom:1px solid rgba(255,255,255,0.02);">
              <span>🚚 ${utils.formatDate(d)}</span>
              <span class="badge badge-info" style="font-size:0.65rem; padding:1px 6px;">Active</span>
            </div>`).join('')}
        </div>`;

    const vehSection = vehicleRate > 0 ? `
      <div style="font-weight:700; font-size:0.8rem; margin-top:14px; margin-bottom:6px; text-transform:uppercase; color:rgba(255,255,255,0.5)">Vehicle Allowance Summary</div>
      <div style="font-size:0.82rem; color:rgba(255,255,255,0.85); background:rgba(6,182,212,0.05); padding:8px 12px; border-radius:6px; border:1px solid rgba(6,182,212,0.15); display:flex; justify-content:space-between; margin-bottom:12px; align-items:center;">
        <span>Rate: ${utils.formatCurrency(vehicleRate)} / Day × ${c.vehicleWorkedDays} Days</span>
        <span class="font-mono font-bold text-info">${utils.formatCurrency(vehicleAllowance)}</span>
      </div>
      <div style="font-weight:700; font-size:0.8rem; margin-bottom:6px; text-transform:uppercase; color:rgba(255,255,255,0.5)">Daily Vehicle Worked Logs</div>
      ${vehicleDatesListHtml}` : '';

    const tempDriverRate = Number(rateConfig.tempDriverRate) || 1800;
    const tempDriverAllowance = (c.tempDriverDays || 0) * tempDriverRate;
    
    const tempDatesListHtml = tempDates.length === 0
      ? '<p class="text-muted text-sm" style="text-align:center; padding:10px 0;">No active temp driver logs recorded for this month.</p>'
      : `
        <div style="max-height:100px; overflow-y:auto; border:1px solid var(--glass-border); border-radius:6px; padding:6px 12px; margin-bottom:12px; background:rgba(0,0,0,0.1);">
          ${tempDates.map(d => `
            <div class="flex items-center justify-between text-xs" style="padding:3px 0; border-bottom:1px solid rgba(255,255,255,0.02);">
              <span>👤 Temp Driver: ${utils.formatDate(d)}</span>
              <span class="badge badge-primary" style="font-size:0.65rem; padding:1px 6px;">Active</span>
            </div>`).join('')}
        </div>`;

    const tempSection = (c.tempDriverDays || 0) > 0 ? `
      <div style="font-weight:700; font-size:0.8rem; margin-top:14px; margin-bottom:6px; text-transform:uppercase; color:rgba(255,255,255,0.5)">Temporary Driver Payout Details</div>
      <div style="font-size:0.82rem; color:rgba(255,255,255,0.85); background:rgba(129,140,248,0.05); padding:8px 12px; border-radius:6px; border:1px solid rgba(129,140,248,0.15); display:flex; justify-content:space-between; margin-bottom:12px; align-items:center;">
        <span>Rate: ${utils.formatCurrency(tempDriverRate)} / Day × ${c.tempDriverDays} Days</span>
        <span class="font-mono font-bold text-primary-light" style="color:var(--primary-light,#818cf8);">${utils.formatCurrency(tempDriverAllowance)}</span>
      </div>
      <div style="font-weight:700; font-size:0.8rem; margin-bottom:6px; text-transform:uppercase; color:rgba(255,255,255,0.5)">Daily Temp Driver Worked Logs</div>
      ${tempDatesListHtml}` : '';

    const body = `
      <div style="font-size:0.85rem; margin-bottom:16px;">
        <div class="flex justify-between items-center" style="margin-bottom:6px; flex-wrap:wrap; gap:8px;">
          <span style="font-weight:700; font-size:1.05rem; color:#fff;">${employee}</span>
          <span style="color:var(--primary-light,#818cf8); font-weight:600;">${ratesLabel}</span>
        </div>
        <div style="color:rgba(255,255,255,0.4); font-size:0.75rem;">Statement Month: ${selectedSummaryMonth}</div>
      </div>

      <div style="font-weight:700; font-size:0.8rem; margin-bottom:6px; text-transform:uppercase; color:rgba(255,255,255,0.5)">Daily Attendance logs</div>
      ${attendanceListHtml}

      ${vehSection}
      ${tempSection}

      <div style="font-weight:700; font-size:0.8rem; margin-top:14px; margin-bottom:6px; text-transform:uppercase; color:rgba(255,255,255,0.5)">Salary Advances Logged</div>
      ${advancesListHtml}`;

    const footer = `<button class="btn btn-primary" onclick="AgencyHub.utils.closeModal()" style="width:100px; margin: 0 auto;">Close</button>`;

    utils.showModal('Salary Ledger Details', body, footer, { size: 'sm' });
  }

  // ---------------------------------------------------------------------------
  // Event Bindings / Lifecycle
  // ---------------------------------------------------------------------------
  function init() {
    // Tab switching event listeners
    const tabIds = ['attendance', 'advances', 'summary', 'setup'];
    tabIds.forEach(tab => {
      const btn = document.getElementById(`p-tab-btn-${tab}`);
      if (btn) {
        btn.addEventListener('click', () => {
          activeTab = tab;
          AgencyHub.navigate(state.currentPage);
        });
      }
    });

    // --- Tab 1: Attendance Listeners ---
    if (activeTab === 'attendance') {
      const attDateInput = document.getElementById('att-date-input');
      const attSaveBtn = document.getElementById('att-save-btn');

      if (attDateInput) {
        attDateInput.addEventListener('change', (e) => {
          selectedDate = e.target.value;
          AgencyHub.navigate(state.currentPage);
        });
      }

      // Delegate status button toggles
      utils.delegate(document.getElementById('payroll-tab-content'), '.att-btn-status', 'click', (e, btn) => {

        const employee = btn.dataset.employee;
        const status = btn.dataset.status;
        
        tempAttendance[employee] = status;
        
        // Quick visual updates for buttons in this row without fully re-rendering the whole page
        const row = btn.closest('tr');
        if (row) {
          row.querySelectorAll('.att-btn-status').forEach(b => {
            const bStatus = b.dataset.status;
            b.className = 'btn btn-sm att-btn-status btn-ghost'; // reset
            b.style.color = ''; // reset color
            
            if (bStatus === status) {
              if (status === 'present') b.className = 'btn btn-sm att-btn-status btn-success';
              else if (status === 'half') {
                b.className = 'btn btn-sm att-btn-status btn-warning';
                b.style.color = '#000';
              }
              else if (status === 'absent') b.className = 'btn btn-sm att-btn-status btn-danger';
            }
          });
        }
      });

      // Delegate vehicle status button toggles
      utils.delegate(document.getElementById('payroll-tab-content'), '.att-btn-vehicle', 'click', (e, btn) => {

        const employee = btn.dataset.employee;
        const status = btn.dataset.status;
        
        tempAttendance[employee + '_vehicle'] = status;
        
        // Quick visual updates for buttons in this row
        const row = btn.closest('tr');
        if (row) {
          row.querySelectorAll('.att-btn-vehicle').forEach(b => {
            const bStatus = b.dataset.status;
            b.className = 'btn btn-sm att-btn-vehicle btn-ghost'; // reset
            
            if (bStatus === status) {
              if (status === 'worked') b.className = 'btn btn-sm att-btn-vehicle btn-info';
              else if (status === 'idle') b.className = 'btn btn-sm att-btn-vehicle btn-danger';
            }
          });
        }
      });

      // Delegate temp driver status button toggles
      utils.delegate(document.getElementById('payroll-tab-content'), '.att-btn-temp', 'click', (e, btn) => {

        const employee = btn.dataset.employee;
        const status = btn.dataset.status;
        
        tempAttendance[employee + '_temp'] = status;
        
        // Quick visual updates for buttons in this row
        const row = btn.closest('tr');
        if (row) {
          row.querySelectorAll('.att-btn-temp').forEach(b => {
            const bStatus = b.dataset.status;
            b.className = 'btn btn-sm att-btn-temp btn-ghost'; // reset
            
            if (bStatus === status) {
              if (status === 'worked') b.className = 'btn btn-sm att-btn-temp btn-primary';
              else if (status === 'idle') b.className = 'btn btn-sm att-btn-temp btn-danger';
            }
          });
        }
      });

      if (attSaveBtn) {
        attSaveBtn.addEventListener('click', () => {

          data.saveAttendance(selectedDate, tempAttendance);
          utils.toast(`Attendance sheet saved for ${utils.formatDate(selectedDate)}!`, 'success');
          AgencyHub.navigate(state.currentPage);
        });
      }
    }

    // --- Tab 2: Advances Listeners ---
    if (activeTab === 'advances') {
      const advMonthFilter = document.getElementById('adv-month-filter');
      const advEmployeeFilter = document.getElementById('adv-employee-filter');
      const advAddBtn = document.getElementById('adv-add-btn');

      if (advMonthFilter) {
        advMonthFilter.addEventListener('change', (e) => {
          selectedSummaryMonth = e.target.value;
          AgencyHub.navigate(state.currentPage);
        });
      }
      if (advEmployeeFilter) {
        advEmployeeFilter.addEventListener('change', (e) => {
          selectedAdvanceEmployee = e.target.value;
          AgencyHub.navigate(state.currentPage);
        });
      }
      if (advAddBtn) {
        advAddBtn.addEventListener('click', () => {

          showAdvanceModal();
        });
      }

      // Delegate deletion click
      utils.delegate(document.getElementById('payroll-tab-content'), '.adv-delete-btn', 'click', async (e, btn) => {
        if (!AgencyHub.isAdmin()) { AgencyHub.utils.toast('View-only access', 'warning'); return; }
        const id = btn.dataset.advId;
        const confirmDelete = await utils.confirm(
          'Delete Advance Log',
          'Are you sure you want to delete this salary advance record? This will revert the deduction from their paycheck.'
        );
        if (confirmDelete) {
          data.deleteAdvance(id);
          utils.toast('Salary advance record deleted.', 'success');
          AgencyHub.navigate(state.currentPage);
        }
      });
    }

    // --- Tab 3: Monthly Summary Listeners ---
    if (activeTab === 'summary') {
      const sumMonthInput = document.getElementById('sum-month-input');

      if (sumMonthInput) {
        sumMonthInput.addEventListener('change', (e) => {
          selectedSummaryMonth = e.target.value;
          AgencyHub.navigate(state.currentPage);
        });
      }

      const csvBtn = document.getElementById('payroll-export-csv');
      if (csvBtn) {
        csvBtn.addEventListener('click', () => {
          const employees = getEmployeesList();
          const counts = getMonthlyAttendanceCounts(selectedSummaryMonth);
          const advances = getMonthlyAdvancesTotal(selectedSummaryMonth);
          const loggedLoans = getMonthlyLoansTotal(selectedSummaryMonth);
          const rates = data.getEmployeeRates();
          const paidStatus = getPayoutStatus(selectedSummaryMonth);

          const headers = ['Employee Name', 'Working Days', 'Day Rate', 'Total Salary', 'Basic Salary', 'Incentive', 'Lorry Rent', 'Gross Salary', 'EPF 8%', 'Advances', 'Loans', 'Net Payable', 'Status'];
          const rows = employees.map(name => {
            const c = counts[name] || { totalDays: 0, vehicleWorkedDays: 0 };
            const advTotal = advances[name] || 0;
            const rateConfig = rates[name] || { type: 'daily', rate: 2000, epfEligible: false, basicSalary: 30000, vehicleRate: 0 };
            const isPaid = !!paidStatus[name];

            const daySalary = Number(rateConfig.rate) || 2000;
            const totalSalary = c.totalDays * daySalary;
            const isEpfEligible = rateConfig.epfEligible !== false && (name === 'Sanki' || name === 'Jayarathna' || name === 'Achini Isnaka' || rateConfig.epfEligible === true);

            let basicSalary = 0, incentive = 0, vehicleRent = 0, grossSalary = 0, epf8 = 0;
            if (isEpfEligible) {
              basicSalary = Number(rateConfig.basicSalary) || 30000;
              incentive = Math.max(0, totalSalary - basicSalary);
              grossSalary = basicSalary + incentive;
              epf8 = Math.round(basicSalary * 0.08);
            } else {
              incentive = totalSalary;
              vehicleRent = (c.vehicleWorkedDays || 0) * (Number(rateConfig.vehicleRate) || 0);
              grossSalary = totalSalary + vehicleRent;
            }

            const loanTotal = (Number(rateConfig.loanDeduction) || 0) + (loggedLoans[name] || 0);
            const netSalary = grossSalary - epf8 - advTotal - loanTotal;

            return [
              name,
              c.totalDays.toFixed(1),
              daySalary.toFixed(2),
              totalSalary.toFixed(2),
              basicSalary.toFixed(2),
              incentive.toFixed(2),
              vehicleRent.toFixed(2),
              grossSalary.toFixed(2),
              epf8.toFixed(2),
              advTotal.toFixed(2),
              loanTotal.toFixed(2),
              netSalary.toFixed(2),
              isPaid ? 'Paid' : 'Unpaid'
            ];
          });
          utils.exportToCSV(`Payroll_Summary_${selectedSummaryMonth}`, headers, rows);
        });
      }

      // Delegate pay actions
      utils.delegate(document.getElementById('payroll-tab-content'), '.summary-btn-pay', 'click', (e, btn) => {
        if (!AgencyHub.isAdmin()) { AgencyHub.utils.toast('View-only access', 'warning'); return; }
        const emp = btn.dataset.employee;
        savePayoutStatus(selectedSummaryMonth, emp, true);
        utils.toast(`Marked ${emp}'s salary as Paid for ${selectedSummaryMonth}!`, 'success');
        AgencyHub.navigate(state.currentPage);
      });

      utils.delegate(document.getElementById('payroll-tab-content'), '.summary-btn-unpay', 'click', (e, btn) => {
        if (!AgencyHub.isAdmin()) { AgencyHub.utils.toast('View-only access', 'warning'); return; }
        const emp = btn.dataset.employee;
        savePayoutStatus(selectedSummaryMonth, emp, false);
        utils.toast(`Marked ${emp}'s salary as Unpaid for ${selectedSummaryMonth}!`, 'warning');
        AgencyHub.navigate(state.currentPage);
      });

      // Delegate Pay Sheet modal
      utils.delegate(document.getElementById('payroll-tab-content'), '.summary-btn-paysheet', 'click', (e, btn) => {
        const emp = btn.dataset.employee;
        showPaySheetModal(emp);
      });

      // Delegate ledger detail details modal
      utils.delegate(document.getElementById('payroll-tab-content'), '.summary-btn-details', 'click', (e, btn) => {
        const emp = btn.dataset.employee;
        showSummaryDetailModal(emp);
      });
    }

    // --- Tab 4: Employee Setup Listeners ---
    if (activeTab === 'setup') {
      const setupAddBtn = document.getElementById('setup-add-btn');
      const setupSaveBtn = document.getElementById('setup-save-btn');

      if (setupAddBtn) {
        setupAddBtn.addEventListener('click', () => {
          if (!AgencyHub.isAdmin()) { AgencyHub.utils.toast('View-only access', 'warning'); return; }
          showAddEmployeeModal(null);
        });
      }

      // Delegate duplicate employee button click
      utils.delegate(document.getElementById('payroll-tab-content'), '.setup-duplicate-btn', 'click', (e, btn) => {
        if (!AgencyHub.isAdmin()) { AgencyHub.utils.toast('View-only access', 'warning'); return; }
        const empName = btn.dataset.employee;
        showAddEmployeeModal(empName);
      });

      // Delegate delete employee button click
      utils.delegate(document.getElementById('payroll-tab-content'), '.setup-delete-btn', 'click', async (e, btn) => {
        if (!AgencyHub.isAdmin()) { AgencyHub.utils.toast('View-only access', 'warning'); return; }
        const empName = btn.dataset.employee;
        const confirmDelete = await utils.confirm(
          `Delete Employee: ${empName}`,
          `Are you sure you want to delete ${empName}? This will remove them from setup and payroll lists.`
        );
        if (confirmDelete) {
          const currentRates = data.getEmployeeRates() || {};
          delete currentRates[empName];
          data.saveEmployeeRates(currentRates);

          let storedList = getEmployeesList();
          storedList = storedList.filter(name => name !== empName);
          data._set('payroll_employees', storedList);

          utils.toast(`Employee "${empName}" deleted successfully!`, 'success');
          AgencyHub.navigate(state.currentPage);
        }
      });

      if (setupSaveBtn) {
        setupSaveBtn.addEventListener('click', () => {
          if (!AgencyHub.isAdmin()) { AgencyHub.utils.toast('View-only access', 'warning'); return; }
          const epfSelects = document.querySelectorAll('.setup-epf-select');
          const rateInputs = document.querySelectorAll('.setup-rate-input');
          const basicInputs = document.querySelectorAll('.setup-basic-input');
          const vehicleInputs = document.querySelectorAll('.setup-vehiclerate-input');
          const loanInputs = document.querySelectorAll('.setup-loan-input');

          const rates = {};
          epfSelects.forEach(select => {
            const emp = select.dataset.employee;
            const epfEligible = select.value === 'true';
            const rateInput = Array.from(rateInputs).find(i => i.dataset.employee === emp);
            const rate = parseFloat(rateInput?.value) || 0;
            const basicInput = Array.from(basicInputs).find(i => i.dataset.employee === emp);
            const basicSalary = parseFloat(basicInput?.value) || 0;
            const vehicleInput = Array.from(vehicleInputs).find(i => i.dataset.employee === emp);
            const vehicleRate = parseFloat(vehicleInput?.value) || 0;
            const loanInput = Array.from(loanInputs).find(i => i.dataset.employee === emp);
            const loanDeduction = parseFloat(loanInput?.value) || 0;
            rates[emp] = { type: 'daily', rate, epfEligible, basicSalary, vehicleRate, loanDeduction };
          });

          data.saveEmployeeRates(rates);
          utils.toast('Salary rate configurations saved successfully!', 'success');
          AgencyHub.navigate(state.currentPage);
        });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Register Module
  // ---------------------------------------------------------------------------
  AgencyHub.registerModule('payroll', { render, init });
})();
