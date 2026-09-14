(function() {
  const state = AgencyHub.state;
  const data = AgencyHub.data;
  const utils = AgencyHub.utils;

  // Module State
  let activeTab = 'logs'; // 'logs' | 'odo' | 'efficiency'
  let selectedMonth = utils.today().slice(0, 7); // 'YYYY-MM'
  let selectedVehicleFilter = 'all'; // 'all' | 'domie' | 'kelani' | 'bathipooja'

  const VEHICLES = [
    { id: 'domie', name: 'Domie (Wimal)', key: 'domie' },
    { id: 'kelani', name: 'Kelani (Bandu Thilaka)', key: 'kelani' },
    { id: 'bathipooja', name: 'Bathipooja (Jayarathna)', key: 'bathipooja' }
  ];

  // ---------------------------------------------------------------------------
  // Calculations & Aggregations
  // ---------------------------------------------------------------------------
  function getSalesEntryMileage(month, vehicleId) {
    const allSales = data.getSalesEntries() || [];
    // Account for potential naming variants ('kelani' or 'kalani')
    return allSales
      .filter(entry => {
        if (!entry.date.startsWith(month)) return false;
        if (vehicleId === 'kelani') {
          return entry.agency === 'kelani' || entry.agency === 'kalani';
        }
        return entry.agency === vehicleId;
      })
      .reduce((sum, entry) => sum + (Number(entry.km) || 0), 0);
  }

  function getFuelStatsForMonth(month, vehicleId = 'all') {
    const filters = { month };
    if (vehicleId !== 'all') filters.vehicle = vehicleId;
    const logs = data.getFuelLogs(filters);

    const totalCost = logs.reduce((sum, l) => sum + (Number(l.cost) || 0), 0);
    const totalLiters = logs.reduce((sum, l) => sum + (Number(l.liters) || 0), 0);
    const avgPrice = totalLiters > 0 ? (totalCost / totalLiters) : 0;

    return { totalCost, totalLiters, avgPrice, count: logs.length };
  }

  // ---------------------------------------------------------------------------
  // Tab rendering
  // ---------------------------------------------------------------------------

  // --- Tab 1: Fuel Logs ---
  function renderLogsTab() {
    const filters = { month: selectedMonth };
    if (selectedVehicleFilter !== 'all') filters.vehicle = selectedVehicleFilter;
    const logs = data.getFuelLogs(filters);

    const stats = getFuelStatsForMonth(selectedMonth, selectedVehicleFilter);

    const rows = logs.length === 0
      ? `<tr><td colspan="7" class="text-center" style="padding:24px; color:rgba(255,255,255,0.4);">No fuel fills logged for this selection.</td></tr>`
      : logs.map(l => {
          const vehName = VEHICLES.find(v => v.id === l.vehicle)?.name || l.vehicle;
          return `
            <tr style="border-bottom:1px solid var(--glass-border);">
              <td style="padding:12px; font-size:0.88rem; font-variant-numeric:tabular-nums;">${utils.formatDate(l.date)}</td>
              <td style="font-weight:700; padding:12px; font-size:0.9rem;">${vehName}</td>
              <td class="text-right font-mono" style="padding:12px; font-size:0.88rem;">${Number(l.liters).toFixed(2)} L</td>
              <td class="text-right font-mono" style="padding:12px; font-size:0.88rem;">${utils.formatCurrency(l.pricePerLiter)} / L</td>
              <td class="text-right font-mono font-bold" style="padding:12px; font-size:0.92rem; color:var(--success,#10b981);">${utils.formatCurrency(l.cost)}</td>
              <td class="text-right font-mono text-muted" style="padding:12px; font-size:0.85rem; color:rgba(255,255,255,0.5);">${l.odometer ? Number(l.odometer).toLocaleString() : '—'}</td>
              <td style="text-align:center; padding:8px;">
                <div style="display:flex; justify-content:center; gap:6px;">
                  <button class="btn btn-ghost btn-sm btn-icon fuel-edit-btn" data-id="${l.id}" title="Edit" style="padding:4px; width:26px; height:26px; min-width:unset;">✏️</button>
                  <button class="btn btn-danger btn-sm btn-icon fuel-delete-btn admin-only" data-id="${l.id}" title="Delete" style="padding:4px; width:26px; height:26px; min-width:unset; display:flex; align-items:center; justify-content:center;">🗑️</button>
                </div>
              </td>
            </tr>`;
        }).join('');

    return `
      <div class="anim-fade card" style="padding:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:12px;">
          <div>
            <h3 style="margin:0 0 4px; font-size:1.1rem; font-weight:700;">Fuel Consumption Logs</h3>
            <p style="margin:0; font-size:0.8rem; color:rgba(255,255,255,0.4);">Record day-to-day diesel fills, pricing, and odometer parameters.</p>
          </div>
          <button class="btn btn-primary" id="fuel-add-btn" style="display:flex; align-items:center; gap:6px;">
            ⛽ Log Fuel Fill
          </button>
        </div>

        <!-- Filter Bar -->
        <div class="filter-bar" style="display:flex; flex-wrap:wrap; gap:12px; align-items:center; margin-bottom:16px; background:rgba(255,255,255,0.01); padding:10px; border-radius:8px; border:1px solid var(--glass-border);">
          <div style="display:flex; align-items:center; gap:8px;">
            <label class="form-label" style="margin:0; font-size:0.8rem;">Month:</label>
            <input type="month" class="form-input" id="fuel-month-filter" value="${selectedMonth}" style="width:150px; padding:5px 8px;">
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <label class="form-label" style="margin:0; font-size:0.8rem;">Vehicle / Route:</label>
            <select class="form-select" id="fuel-vehicle-filter" style="min-width:160px; padding:5px 8px;">
              <option value="all" ${selectedVehicleFilter === 'all' ? 'selected' : ''}>All Vehicles</option>
              ${VEHICLES.map(v => `<option value="${v.id}" ${selectedVehicleFilter === v.id ? 'selected' : ''}>${v.name}</option>`).join('')}
            </select>
          </div>
          <button class="btn btn-ghost" id="fl-export-csv" style="padding:5px 12px; font-size:0.8rem; color:#10B981; border:1px solid rgba(16,185,129,0.3); margin-left:auto;">
            📊 Export CSV
          </button>
        </div>

        <!-- Cost Breakdown Cards -->
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:12px; margin-bottom:20px;">
          <div class="card" style="padding:14px; border:1px solid var(--glass-border); background:rgba(255,255,255,0.01);">
            <div style="font-size:0.75rem; color:rgba(255,255,255,0.4); margin-bottom:4px; text-transform:uppercase; font-weight:600;">Total Spent</div>
            <div class="font-mono font-bold" style="font-size:1.25rem; color:var(--success,#10b981);">${utils.formatCurrency(stats.totalCost)}</div>
          </div>
          <div class="card" style="padding:14px; border:1px solid var(--glass-border); background:rgba(255,255,255,0.01);">
            <div style="font-size:0.75rem; color:rgba(255,255,255,0.4); margin-bottom:4px; text-transform:uppercase; font-weight:600;">Total Fuel Liters</div>
            <div class="font-mono font-bold" style="font-size:1.25rem; color:var(--info,#06b6d4);">${stats.totalLiters.toFixed(2)} L</div>
          </div>
          <div class="card" style="padding:14px; border:1px solid var(--glass-border); background:rgba(255,255,255,0.01);">
            <div style="font-size:0.75rem; color:rgba(255,255,255,0.4); margin-bottom:4px; text-transform:uppercase; font-weight:600;">Average Fuel Price</div>
            <div class="font-mono font-bold" style="font-size:1.25rem; color:rgba(255,255,255,0.85);">${utils.formatCurrency(stats.avgPrice)}/L</div>
          </div>
        </div>

        <!-- Logs Table -->
        <div class="table-wrapper" style="overflow-x:auto; border-radius:8px; border:1px solid var(--glass-border);">
          <table style="width:100%; border-collapse:collapse; min-width:700px;">
            <thead>
              <tr style="background:rgba(255,255,255,0.02); border-bottom:2px solid var(--glass-border);">
                <th style="text-align:left; padding:12px; width:120px;">Date</th>
                <th style="text-align:left; padding:12px; width:180px;">Vehicle Route</th>
                <th style="text-align:right; padding:12px; width:120px;">Liters</th>
                <th style="text-align:right; padding:12px; width:130px;">Price per Liter</th>
                <th style="text-align:right; padding:12px; width:130px;">Total Cost</th>
                <th style="text-align:right; padding:12px; width:120px;">Odometer (KM)</th>
                <th style="text-align:center; padding:12px; width:100px;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  // --- Tab 2: Odometer Readings ---
  function renderOdoTab() {
    const readings = data.getOdometerReadings(selectedMonth);

    const rows = VEHICLES.map(v => {
      const config = readings[v.id] || { start: '', end: '' };
      return `
        <tr style="border-bottom:1px solid var(--glass-border);">
          <td style="font-weight:700; padding:16px 12px; font-size:0.95rem;">${v.name}</td>
          <td style="padding:12px;">
            <input type="number" class="form-input odo-start-input" data-vehicle="${v.id}" 
                   placeholder="Start Month Odo (KM)" min="0" value="${config.start || ''}" style="width:100%; max-width:220px; font-family:monospace;">
          </td>
          <td style="padding:12px;">
            <input type="number" class="form-input odo-end-input" data-vehicle="${v.id}" 
                   placeholder="End Month Odo (KM)" min="0" value="${config.end || ''}" style="width:100%; max-width:220px; font-family:monospace;">
          </td>
        </tr>`;
    }).join('');

    return `
      <div class="anim-fade card" style="padding:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:12px;">
          <div>
            <h3 style="margin:0 0 4px; font-size:1.1rem; font-weight:700;">Monthly Odometer Metrics</h3>
            <p style="margin:0; font-size:0.8rem; color:rgba(255,255,255,0.4);">Enter manually the initial and final vehicle odometer values for the month.</p>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <label class="form-label" style="margin:0; font-size:0.85rem;">Select Month:</label>
            <input type="month" class="form-input" id="odo-month-input" value="${selectedMonth}" style="width:160px; padding:6px 10px;">
          </div>
        </div>

        <div class="table-wrapper" style="overflow-x:auto; border-radius:8px; border:1px solid var(--glass-border); margin-bottom:20px;">
          <table style="width:100%; border-collapse:collapse; min-width:650px;">
            <thead>
              <tr style="background:rgba(255,255,255,0.02); border-bottom:2px solid var(--glass-border);">
                <th style="text-align:left; padding:12px;">Vehicle / Route</th>
                <th style="text-align:left; padding:12px; width:260px;">Odo Start (1st of Month)</th>
                <th style="text-align:left; padding:12px; width:260px;">Odo End (End of Month)</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>

        <div style="display:flex; justify-content:flex-end;">
          <button class="btn btn-primary" id="odo-save-btn" style="padding:10px 24px; display:flex; align-items:center; gap:8px;">
            💾 Save Odometer Readings
          </button>
        </div>
      </div>`;
  }

  // --- Tab 3: Fuel Efficiency Report ---
  function renderEfficiencyTab() {
    const odoReadings = data.getOdometerReadings(selectedMonth);

    const rows = VEHICLES.map(v => {
      // Mileage Method 1: Sales Entry daily KM aggregates
      const salesKm = getSalesEntryMileage(selectedMonth, v.id);

      // Mileage Method 2: Odometer start/end delta
      const odoConfig = odoReadings[v.id] || { start: '', end: '' };
      const odoKm = (odoConfig.start !== '' && odoConfig.end !== '') ? (Number(odoConfig.end) - Number(odoConfig.start)) : 0;

      // Fuel parameters for this month
      const fuelStats = getFuelStatsForMonth(selectedMonth, v.id);
      const liters = fuelStats.totalLiters;
      const cost = fuelStats.totalCost;

      // Efficiency Calculations
      const salesKmL = (liters > 0) ? (salesKm / liters) : 0;
      const salesCostKm = (salesKm > 0) ? (cost / salesKm) : 0;

      const odoKmL = (liters > 0) ? (odoKm / liters) : 0;
      const odoCostKm = (odoKm > 0) ? (cost / odoKm) : 0;

      // Discrepancy (Sales Entries vs Odometer Delta)
      const discrepancy = salesKm - odoKm;
      const discColor = discrepancy === 0 ? 'rgba(255,255,255,0.5)' : (discrepancy > 0 ? 'var(--warning,#f59e0b)' : 'var(--danger,#ef4444)');

      return `
        <tr style="border-bottom:1px solid var(--glass-border);">
          <!-- Route Column -->
          <td style="padding:14px 12px;">
            <div style="font-weight:700; font-size:0.92rem;">${v.name}</div>
            <div style="font-size:0.75rem; color:rgba(255,255,255,0.4); margin-top:2px;">Fuel filled: ${liters.toFixed(1)} L | Cost: ${utils.formatCurrency(cost)}</div>
          </td>
          
          <!-- Method 1: Sales Entry -->
          <td style="padding:14px 12px; background:rgba(255,255,255,0.01);">
            <div class="font-mono font-bold" style="font-size:0.9rem;">${salesKm.toLocaleString()} KM</div>
            <div style="font-size:0.75rem; color:rgba(255,255,255,0.6); margin-top:2px;">
              Eff: <span class="text-info font-bold">${salesKmL > 0 ? `${salesKmL.toFixed(2)} KM/L` : '—'}</span>
            </div>
            <div style="font-size:0.72rem; color:rgba(255,255,255,0.4);">
              Cost: ${salesCostKm > 0 ? `${utils.formatCurrency(salesCostKm)} / KM` : '—'}
            </div>
          </td>

          <!-- Method 2: Odo Delta -->
          <td style="padding:14px 12px; background:rgba(255,255,255,0.02);">
            <div class="font-mono font-bold" style="font-size:0.9rem;">${odoKm > 0 ? `${odoKm.toLocaleString()} KM` : '—'}</div>
            <div style="font-size:0.75rem; color:rgba(255,255,255,0.6); margin-top:2px;">
              Eff: <span class="text-success font-bold">${odoKmL > 0 ? `${odoKmL.toFixed(2)} KM/L` : '—'}</span>
            </div>
            <div style="font-size:0.72rem; color:rgba(255,255,255,0.4);">
              Cost: ${odoCostKm > 0 ? `${utils.formatCurrency(odoCostKm)} / KM` : '—'}
            </div>
          </td>

          <!-- Variance / Audit -->
          <td style="padding:14px 12px; text-align:center;">
            <span class="font-mono font-bold" style="color:${discColor}; font-size:0.92rem;">
              ${discrepancy > 0 ? `+${discrepancy}` : discrepancy} KM
            </span>
            <div style="font-size:0.7rem; color:rgba(255,255,255,0.3); margin-top:2px;">Sales vs Odometer</div>
          </td>
        </tr>`;
    }).join('');

    return `
      <div class="anim-fade card" style="padding:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:12px;">
          <div>
            <h3 style="margin:0 0 4px; font-size:1.1rem; font-weight:700;">Mileage & Fuel Efficiency Report</h3>
            <p style="margin:0; font-size:0.8rem; color:rgba(255,255,255,0.4);">Compares daily sales entries KM against manual odometer reports.</p>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <label class="form-label" style="margin:0; font-size:0.85rem;">Analysis Month:</label>
            <input type="month" class="form-input" id="eff-month-input" value="${selectedMonth}" style="width:160px; padding:6px 10px;">
          </div>
        </div>

        <div class="table-wrapper" style="overflow-x:auto; border-radius:8px; border:1px solid var(--glass-border);">
          <table style="width:100%; border-collapse:collapse; min-width:850px;">
            <thead>
              <tr style="background:rgba(255,255,255,0.02); border-bottom:2px solid var(--glass-border);">
                <th style="text-align:left; padding:12px;">Vehicle Route Info</th>
                <th style="text-align:left; padding:12px; width:220px; background:rgba(255,255,255,0.01);">Sales Entry Method (Daily logs)</th>
                <th style="text-align:left; padding:12px; width:220px; background:rgba(255,255,255,0.02);">Odometer Method (Start/End Delta)</th>
                <th style="text-align:center; padding:12px; width:160px;">Odo Variance</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  // ---------------------------------------------------------------------------
  // Main View Dispatcher
  // ---------------------------------------------------------------------------
  function render(appState) {
    let activeContent = '';
    if (activeTab === 'logs') activeContent = renderLogsTab();
    else if (activeTab === 'odo') activeContent = renderOdoTab();
    else if (activeTab === 'efficiency') activeContent = renderEfficiencyTab();

    return `
      <div id="fuel-mileage-module">
        <div class="section-header anim-fade" style="margin-bottom:16px;">
          <div>
            <h1 class="section-title">Fuel & Mileage</h1>
            <p class="section-subtitle">Monitor vehicle cost metrics and audit traveling efficiency</p>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="payroll-tabs anim-fade" style="display:flex; flex-wrap:wrap; gap:8px; border-bottom:1px solid var(--glass-border); padding-bottom:12px; margin-bottom:20px;">
          <button class="btn ${activeTab === 'logs' ? 'btn-primary' : 'btn-ghost'}" id="f-tab-btn-logs" style="padding:8px 16px; font-size:0.85rem; height:36px; min-width:unset;">⛽ Fuel Logs</button>
          <button class="btn ${activeTab === 'odo' ? 'btn-primary' : 'btn-ghost'}" id="f-tab-btn-odo" style="padding:8px 16px; font-size:0.85rem; height:36px; min-width:unset;">🏁 Odometer Readings</button>
          <button class="btn ${activeTab === 'efficiency' ? 'btn-primary' : 'btn-ghost'}" id="f-tab-btn-eff" style="padding:8px 16px; font-size:0.85rem; height:36px; min-width:unset;">📊 Efficiency Report</button>
        </div>

        <!-- Dynamic Body -->
        <div id="fuel-tab-content">
          ${activeContent}
        </div>
      </div>`;
  }

  // ---------------------------------------------------------------------------
  // Modal Creation Form
  // ---------------------------------------------------------------------------
  function showFuelLogModal(logToEdit = null) {
    const isEdit = !!logToEdit;
    const l = logToEdit || { date: utils.today(), vehicle: 'domie', liters: '', cost: '', pricePerLiter: '', odometer: '' };

    const body = `
      <div class="form-group">
        <label class="form-label">Vehicle Route *</label>
        <select class="form-select" id="fl-modal-vehicle">
          ${VEHICLES.map(v => `<option value="${v.id}" ${l.vehicle === v.id ? 'selected' : ''}>${v.name}</option>`).join('')}
        </select>
      </div>

      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">Fill Date *</label>
          <input type="date" class="form-input" id="fl-modal-date" value="${l.date}">
        </div>
        <div class="form-group">
          <label class="form-label">Fuel Liters *</label>
          <input type="number" class="form-input math-trigger" id="fl-modal-liters" placeholder="0.00" min="0.1" step="0.01" value="${l.liters}">
        </div>
      </div>

      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">Price per Liter (Rs.)</label>
          <input type="number" class="form-input math-trigger" id="fl-modal-price" placeholder="0.00" min="1" step="0.5" value="${l.pricePerLiter}">
        </div>
        <div class="form-group">
          <label class="form-label">Total Cost (Rs.)</label>
          <input type="number" class="form-input math-trigger" id="fl-modal-cost" placeholder="0.00" min="1" step="10" value="${l.cost}">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Odometer Reading (KM)</label>
        <input type="number" class="form-input" id="fl-modal-odo" placeholder="Current Odometer (optional)" min="0" value="${l.odometer || ''}">
      </div>`;

    const footer = `
      <button class="btn btn-ghost" onclick="AgencyHub.utils.closeModal()">Cancel</button>
      <button class="btn btn-primary" id="fl-modal-save">
        💾 Save Fuel Log
      </button>`;

    utils.showModal(isEdit ? 'Modify Fuel Log Entry' : 'Log Fuel Fill details', body, footer, {
      size: 'sm',
      onInit: () => {
        const litersEl = document.getElementById('fl-modal-liters');
        const priceEl = document.getElementById('fl-modal-price');
        const costEl = document.getElementById('fl-modal-cost');

        // Automatic Math helpers: Price & Cost binding
        const triggerMath = (changedField) => {
          const lVal = parseFloat(litersEl.value) || 0;
          const pVal = parseFloat(priceEl.value) || 0;
          const cVal = parseFloat(costEl.value) || 0;

          if (changedField === 'liters' || changedField === 'price') {
            if (lVal > 0 && pVal > 0) {
              costEl.value = (lVal * pVal).toFixed(2);
            }
          } else if (changedField === 'cost') {
            if (lVal > 0 && cVal > 0) {
              priceEl.value = (cVal / lVal).toFixed(2);
            } else if (pVal > 0 && cVal > 0) {
              litersEl.value = (cVal / pVal).toFixed(2);
            }
          }
        };

        litersEl.addEventListener('input', () => triggerMath('liters'));
        priceEl.addEventListener('input', () => triggerMath('price'));
        costEl.addEventListener('input', () => triggerMath('cost'));

        // Save action
        document.getElementById('fl-modal-save').addEventListener('click', () => {

          const vehicle = document.getElementById('fl-modal-vehicle').value;
          const date = document.getElementById('fl-modal-date').value || utils.today();
          const liters = parseFloat(litersEl.value);
          const pricePerLiter = parseFloat(priceEl.value) || 0;
          const cost = parseFloat(costEl.value) || 0;
          const odometer = parseFloat(document.getElementById('fl-modal-odo').value) || '';

          if (!liters || liters <= 0) {
            utils.toast('Please input a valid volume of liters', 'warning');
            return;
          }
          if (!cost || cost <= 0) {
            utils.toast('Please input a valid total cost or unit price', 'warning');
            return;
          }

          const savePayload = {
            vehicle,
            date,
            liters,
            pricePerLiter: pricePerLiter || (cost / liters),
            cost,
            odometer
          };
          if (isEdit) savePayload.id = l.id;

          data.saveFuelLog(savePayload);
          utils.toast('Fuel fill entry saved successfully!', 'success');
          utils.closeModal();
          AgencyHub.navigate(state.currentPage);
        });
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Lifecycle Bindings
  // ---------------------------------------------------------------------------
  function init() {
    // Tab Toggles
    const tabs = [
      { id: 'logs', btn: 'f-tab-btn-logs' },
      { id: 'odo', btn: 'f-tab-btn-odo' },
      { id: 'efficiency', btn: 'f-tab-btn-eff' }
    ];

    tabs.forEach(t => {
      const btn = document.getElementById(t.btn);
      if (btn) {
        btn.addEventListener('click', () => {
          activeTab = t.id;
          AgencyHub.navigate(state.currentPage);
        });
      }
    });

    // --- Tab 1: Fuel Logs listeners ---
    if (activeTab === 'logs') {
      const addBtn = document.getElementById('fuel-add-btn');
      const monthFilter = document.getElementById('fuel-month-filter');
      const vehicleFilter = document.getElementById('fuel-vehicle-filter');

      if (addBtn) {
        addBtn.addEventListener('click', () => showFuelLogModal());
      }
      if (monthFilter) {
        monthFilter.addEventListener('change', (e) => {
          selectedMonth = e.target.value;
          AgencyHub.navigate(state.currentPage);
        });
      }
      if (vehicleFilter) {
        vehicleFilter.addEventListener('change', (e) => {
          selectedVehicleFilter = e.target.value;
          AgencyHub.navigate(state.currentPage);
        });
      }

      const csvBtn = document.getElementById('fl-export-csv');
      if (csvBtn) {
        csvBtn.addEventListener('click', () => {
          const logs = data.getFuelLogs({
            month: selectedMonth,
            vehicle: selectedVehicleFilter !== 'all' ? selectedVehicleFilter : undefined
          });
          const headers = ['Date', 'Vehicle Route', 'Liters', 'Price Per Liter', 'Total Cost', 'Odometer (KM)'];
          const rows = logs.map(l => {
            const vInfo = VEHICLES.find(v => v.id === l.vehicle);
            return [
              l.date || '—',
              vInfo ? vInfo.name : l.vehicle,
              (Number(l.liters) || 0).toFixed(2),
              (Number(l.pricePerLiter) || 0).toFixed(2),
              (Number(l.cost) || 0).toFixed(2),
              l.odometer || '—'
            ];
          });
          utils.exportToCSV(`Fuel_Logs_Report_${selectedMonth}`, headers, rows);
        });
      }

      // Delegate Edit/Delete
      utils.delegate(document.getElementById('fuel-tab-content'), '.fuel-edit-btn', 'click', (e, btn) => {

        const id = btn.dataset.id;
        const allLogs = data.getFuelLogs({ month: selectedMonth });
        const log = allLogs.find(x => x.id === id);
        if (log) showFuelLogModal(log);
      });

      utils.delegate(document.getElementById('fuel-tab-content'), '.fuel-delete-btn', 'click', async (e, btn) => {
        if (!AgencyHub.isAdmin()) { AgencyHub.utils.toast('View-only access', 'warning'); return; }
        const id = btn.dataset.id;
        const confirmDelete = await utils.confirm(
          'Delete Fuel Log',
          'Are you sure you want to delete this fuel log entry? This action is permanent.'
        );
        if (confirmDelete) {
          data.deleteFuelLog(id);
          utils.toast('Fuel fill entry deleted.', 'success');
          AgencyHub.navigate(state.currentPage);
        }
      });
    }

    // --- Tab 2: Odometer listeners ---
    if (activeTab === 'odo') {
      const odoMonthInput = document.getElementById('odo-month-input');
      const saveBtn = document.getElementById('odo-save-btn');

      if (odoMonthInput) {
        odoMonthInput.addEventListener('change', (e) => {
          selectedMonth = e.target.value;
          AgencyHub.navigate(state.currentPage);
        });
      }

      if (saveBtn) {
        saveBtn.addEventListener('click', () => {
          const starts = document.querySelectorAll('.odo-start-input');
          const ends = document.querySelectorAll('.odo-end-input');

          const readings = {};
          starts.forEach(s => {
            const vehicle = s.dataset.vehicle;
            const startVal = s.value !== '' ? parseFloat(s.value) : '';
            const endEl = Array.from(ends).find(e => e.dataset.vehicle === vehicle);
            const endVal = endEl && endEl.value !== '' ? parseFloat(endEl.value) : '';
            
            readings[vehicle] = { start: startVal, end: endVal };
          });

          data.saveOdometerReading(selectedMonth, readings);
          utils.toast('Odometer values saved successfully!', 'success');
          AgencyHub.navigate(state.currentPage);
        });
      }
    }

    // --- Tab 3: Efficiency listeners ---
    if (activeTab === 'efficiency') {
      const effMonthInput = document.getElementById('eff-month-input');
      if (effMonthInput) {
        effMonthInput.addEventListener('change', (e) => {
          selectedMonth = e.target.value;
          AgencyHub.navigate(state.currentPage);
        });
      }
    }
  }

  // Register Module
  AgencyHub.registerModule('fuel', { render, init });
})();
