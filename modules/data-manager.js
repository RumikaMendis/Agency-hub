// =============================================================================
// AgencyHub — Data Manager (Settings & Data Management) Module
// =============================================================================

(function () {
  'use strict';

  const { data, utils, AGENCIES } = AgencyHub;

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  let activeTab = 'general'; // 'general' | 'products' | 'products' | 'data'

  // ---------------------------------------------------------------------------
  // SVG Icons
  // ---------------------------------------------------------------------------

  const icons = {
    settings: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    download: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
    upload: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
    trash: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
    plus: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    x: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    database: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>',
    package: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>'
  };

  // ---------------------------------------------------------------------------
  // Render — General Settings Tab
  // ---------------------------------------------------------------------------

  function renderGeneralTab() {
    const settings = data.getSettings();

    return `
      <div class="card anim-fade" id="dm-tab-general">
        <div class="card-header">
          <div class="card-title">${icons.settings} General Settings</div>
        </div>
        <div style="padding:1.5rem;display:flex;flex-direction:column;gap:1.25rem">
          <div class="form-group">
            <label class="form-label" for="dm-company-name">Company Name</label>
            <input class="form-input" type="text" id="dm-company-name"
                   value="${settings.companyName || 'D & G Agro Lanka'}"
                   placeholder="Company name" />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="dm-credit-period">Default Credit Period (days)</label>
              <input class="form-input" type="number" id="dm-credit-period"
                     value="${settings.creditPeriodDays || 14}" min="1" max="365"
                     style="font-variant-numeric:tabular-nums" />
            </div>
            <div class="form-group">
              <label class="form-label" for="dm-currency">Currency Symbol</label>
              <input class="form-input" type="text" id="dm-currency"
                     value="${settings.currency || 'Rs.'}" placeholder="Rs." />
            </div>
          </div>

          <hr style="border:0;border-top:1px solid var(--border-color,#334155);margin:0.5rem 0;" />

          <div class="form-group">
            <label class="form-label" for="dm-admin-email" style="display:flex;align-items:center;gap:6px;font-weight:700;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              Automated Monthly Report Recipient Email
            </label>
            <input class="form-input" type="email" id="dm-admin-email"
                   value="${settings.adminEmail || 'dgsfa.admin@gmail.com'}"
                   placeholder="dgsfa.admin@gmail.com" />
            <p class="text-sm text-muted" style="margin-top:4px;">End-of-month reports (Credit, Stock, Fuel, Payroll Advances, Cheques) will be sent to this email.</p>
          </div>

          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
            <button class="btn btn-primary admin-only" id="dm-save-settings">Save Settings</button>
            <button class="btn btn-ghost admin-only" id="dm-send-test-email" style="display:inline-flex;align-items:center;gap:6px;color:var(--primary-light,#818cf8);">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              Send Test Monthly Report Now
            </button>
          </div>
        </div>
      </div>`;
  }

  // ---------------------------------------------------------------------------
  // Render — Product Configuration Tab
  // ---------------------------------------------------------------------------

  function renderProductsTab() {
    const agencyKeys = Object.keys(AGENCIES);
    let sections = '';

    agencyKeys.forEach(key => {
      const agency = AGENCIES[key];
      const products = data.getProducts(key) || [];

      let productTags = '';
      products.forEach((p, idx) => {
        productTags += `
          <span class="badge badge-${key}" style="display:inline-flex;align-items:center;gap:4px;padding:0.35rem 0.65rem;margin:0.2rem">
            ${p}
            <button class="btn-icon dm-remove-product admin-only" data-agency="${key}" data-index="${idx}"
                    style="background:none;border:none;cursor:pointer;opacity:.7;padding:0;margin-left:2px;display:inline-flex">
              ${icons.x}
            </button>
          </span>`;
      });

      sections += `
        <div class="card mb-4">
          <div class="card-header flex items-center justify-between">
            <div class="card-title">${agency.icon || ''} ${agency.name} Products</div>
            <button class="btn btn-ghost btn-sm dm-reset-products admin-only" data-agency="${key}">Reset to Defaults</button>
          </div>
          <div style="padding:1rem">
            <div style="display:flex;flex-wrap:wrap;gap:0.25rem;min-height:2.5rem;margin-bottom:1rem">
              ${productTags || '<span class="text-muted text-sm">No products configured</span>'}
            </div>
            <div class="form-inline" style="display:flex;gap:0.5rem">
              <input class="form-input form-input-sm dm-new-product-input" type="text"
                     id="dm-new-product-${key}" placeholder="New product name…"
                     style="flex:1" />
              <button class="btn btn-primary btn-sm dm-add-product admin-only" data-agency="${key}">
                ${icons.plus} Add
              </button>
            </div>
          </div>
        </div>`;
    });

    return `
      <div class="anim-fade" id="dm-tab-products">
        ${sections}
      </div>`;
  }

  // ---------------------------------------------------------------------------
  // Render — Data Management Tab
  // ---------------------------------------------------------------------------

  function renderDataTab() {
    const salesCount = data.getSalesEntries().length;
    const creditCount = data.getCreditBills({}).length;
    const auditCount = data.getAudits().length;
    const lastBackup = localStorage.getItem('agencyhub_last_backup');

    return `
      <div class="anim-fade" id="dm-tab-data">
        <!-- Data Statistics -->
        <div class="card mb-4">
          <div class="card-header">
            <div class="card-title">${icons.database} Data Statistics</div>
          </div>
          <div style="padding:1.25rem">
            <div class="stats-grid" style="grid-template-columns:repeat(3,1fr)">
              <div class="card stat-card">
                <div class="card-header"><span class="text-muted text-sm">Sales Entries</span></div>
                <div class="card-value" style="font-variant-numeric:tabular-nums">${utils.formatNumber(salesCount)}</div>
              </div>
              <div class="card stat-card">
                <div class="card-header"><span class="text-muted text-sm">Credit Bills</span></div>
                <div class="card-value" style="font-variant-numeric:tabular-nums">${utils.formatNumber(creditCount)}</div>
              </div>
              <div class="card stat-card">
                <div class="card-header"><span class="text-muted text-sm">Audits</span></div>
                <div class="card-value" style="font-variant-numeric:tabular-nums">${utils.formatNumber(auditCount)}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Cloud Sync -->
        <div class="card mb-4">
          <div class="card-header">
            <div class="card-title">☁️ Firebase Cloud Sync</div>
          </div>
          <div style="padding:1.25rem">
            <p class="text-muted text-sm mb-4">Push all local data up to your Firebase Cloud database immediately.</p>
            <button class="btn btn-primary admin-only" id="dm-sync-cloud-btn">☁️ Push Local Data to Cloud</button>
          </div>
        </div>

        <!-- Export / Import -->
        <div class="grid-2 mb-4">
          <div class="card">
            <div class="card-header">
              <div class="card-title">${icons.download} Export Backup</div>
            </div>
            <div style="padding:1.25rem">
              <p class="text-muted text-sm mb-4">Download a full JSON backup of all your data.</p>
              ${lastBackup ? `<p class="text-sm text-muted mb-4">Last backup: <strong>${utils.formatDateTime(lastBackup)}</strong></p>` : ''}
              <button class="btn btn-primary admin-only" id="dm-export-btn">${icons.download} Export All Data</button>
            </div>
          </div>
          <div class="card">
            <div class="card-header">
              <div class="card-title">${icons.upload} Import Backup</div>
            </div>
            <div style="padding:1.25rem">
              <p class="text-muted text-sm mb-4">Restore data from a previously exported JSON file.</p>
              <div class="form-group">
                <input class="form-input" type="file" id="dm-import-file" accept=".json,application/json" />
              </div>
              <button class="btn btn-warning mt-2 admin-only" id="dm-import-btn">${icons.upload} Import Data</button>
            </div>
          </div>
        </div>

        <!-- Danger Zone -->
        <div class="card" style="border:1px solid rgba(239,68,68,.3)">
          <div class="card-header" style="background:rgba(239,68,68,.05)">
            <div class="card-title text-danger">${icons.trash} Danger Zone</div>
          </div>
          <div style="padding:1.25rem">
            <p class="text-muted text-sm mb-4">
              This action will permanently delete <strong>all</strong> sales entries, credit bills, audits and settings. This cannot be undone.
            </p>
            <button class="btn btn-danger admin-only" id="dm-clear-all">${icons.trash} Clear All Data</button>
          </div>
        </div>
      </div>`;
  }

  // ---------------------------------------------------------------------------
  // Render — Main
  // ---------------------------------------------------------------------------

  function render() {
    const tabs = [
      { id: 'general',  label: `${icons.settings} General` },
      { id: 'products', label: `${icons.package} Products` },
      { id: 'data',     label: `${icons.database} Data` }
    ];

    const tabsHtml = tabs.map(t =>
      `<button class="tab ${t.id === activeTab ? 'active' : ''}" data-dm-tab="${t.id}">${t.label}</button>`
    ).join('');

    let tabContent = '';
    if (activeTab === 'general')  tabContent = renderGeneralTab();
    if (activeTab === 'products') tabContent = renderProductsTab();
    if (activeTab === 'data')     tabContent = renderDataTab();

    return `
      <div class="anim-fade">
        <div class="section-header mb-6">
          <h1 class="section-title">Settings &amp; Data</h1>
          <p class="section-subtitle">Manage configuration, products and backups</p>
        </div>

        <div class="tabs mb-6">${tabsHtml}</div>

        ${tabContent}
      </div>`;
  }

  // ---------------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------------

  function init() {
    // --- Tab switching -------------------------------------------------------
    utils.delegate(document.body, '[data-dm-tab]', 'click', function (e) {
      const tabId = e.target.closest('[data-dm-tab]').dataset.dmTab;
      if (tabId && tabId !== activeTab) {
        activeTab = tabId;
        AgencyHub.navigate('settings'); // re-render
      }
    });

    // --- General: Save Settings ----------------------------------------------
    const saveBtn = document.getElementById('dm-save-settings');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        if (!AgencyHub.isAdmin()) { AgencyHub.utils.toast('View-only access', 'warning'); return; }
        const companyName = document.getElementById('dm-company-name').value.trim();
        const creditPeriodDays = parseInt(document.getElementById('dm-credit-period').value, 10) || 14;
        const currency = document.getElementById('dm-currency').value.trim() || 'Rs.';
        const adminEmail = (document.getElementById('dm-admin-email') ? document.getElementById('dm-admin-email').value.trim() : 'dgsfa.admin@gmail.com');

        data.saveSettings({ companyName, creditPeriodDays, currency, adminEmail });
        utils.toast('Settings & Recipient Email saved successfully!', 'success');
      });
    }

    // --- General: Send Test Email (Instant Background Dispatch) -------------
    const sendTestEmailBtn = document.getElementById('dm-send-test-email');
    if (sendTestEmailBtn) {
      sendTestEmailBtn.addEventListener('click', async () => {
        const settings = data.getSettings();
        const targetEmail = (document.getElementById('dm-admin-email') ? document.getElementById('dm-admin-email').value.trim() : settings.adminEmail) || 'dgsfa.admin@gmail.com';
        
        const today = new Date().toISOString().split('T')[0];
        const creditBills = data.getCreditBills ? data.getCreditBills() || [] : [];
        const pendingBills = creditBills.filter(b => b.status === 'pending');
        const totalPendingCredit = pendingBills.reduce((acc, b) => acc + (parseFloat(b.amount) || 0), 0);
        
        utils.toast(`Sending Test Report instantly to ${targetEmail}...`, 'info');

        const subject = `[D&G SFA] End-of-Month Summary Report — ${today}`;
        const message = 
          `D & G SFA — END OF MONTH SUMMARY REPORT\n` +
          `Date: ${today}\n` +
          `Target Recipient: ${targetEmail}\n` +
          `-----------------------------------------\n` +
          `1. CREDIT BILLS REPORT: ${pendingBills.length} Pending Bills (Total Rs. ${totalPendingCredit.toFixed(2)})\n` +
          `2. STOCK REPORT: Closing stock balances & shortages compiled.\n` +
          `3. FUEL & MILEAGE REPORT: Vehicle mileage & fuel expenditure summarized.\n` +
          `4. EMPLOYEE ADVANCE REPORT: Attendance, advances & salary totals compiled.\n` +
          `5. CHEQUES REPORT: Day cheques & return cheque collections updated.\n` +
          `-----------------------------------------\n` +
          `Dispatched instantly by D & G SFA System.`;

        await AgencyHub.utils.sendInstantEmail({
          to: targetEmail,
          subject: subject,
          bodyMessage: message,
          reportType: 'Test Monthly Summary Report'
        });

        utils.toast(`✅ Test Report sent instantly to ${targetEmail}!`, 'success');
      });
    }

    // --- Products: Add product -----------------------------------------------
    utils.delegate(document.body, '.dm-add-product', 'click', function (e) {
      if (!AgencyHub.isAdmin()) { AgencyHub.utils.toast('View-only access', 'warning'); return; }
      const agency = e.target.closest('.dm-add-product').dataset.agency;
      const input = document.getElementById('dm-new-product-' + agency);
      if (!input) return;

      const name = input.value.trim();
      if (!name) {
        utils.toast('Please enter a product name', 'warning');
        return;
      }

      const products = data.getProducts(agency) || [];
      if (products.includes(name)) {
        utils.toast('Product already exists', 'warning');
        return;
      }

      products.push(name);
      data.saveProducts(agency, products);
      utils.toast(`Added "${name}" to ${AGENCIES[agency].name}`, 'success');
      AgencyHub.navigate('settings'); // re-render
    });

    // --- Products: Remove product --------------------------------------------
    utils.delegate(document.body, '.dm-remove-product', 'click', function (e) {
      if (!AgencyHub.isAdmin()) { AgencyHub.utils.toast('View-only access', 'warning'); return; }
      const btn = e.target.closest('.dm-remove-product');
      const agency = btn.dataset.agency;
      const index = parseInt(btn.dataset.index, 10);

      const products = data.getProducts(agency) || [];
      if (index >= 0 && index < products.length) {
        const removed = products.splice(index, 1)[0];
        data.saveProducts(agency, products);
        utils.toast(`Removed "${removed}"`, 'info');
        AgencyHub.navigate('settings');
      }
    });

    // --- Products: Reset to defaults -----------------------------------------
    utils.delegate(document.body, '.dm-reset-products', 'click', async function (e) {
      if (!AgencyHub.isAdmin()) { AgencyHub.utils.toast('View-only access', 'warning'); return; }
      const agency = e.target.closest('.dm-reset-products').dataset.agency;
      const yes = await utils.confirm(
        'Reset Products',
        `Are you sure you want to reset ${AGENCIES[agency].name} products to defaults?`
      );
      if (yes) {
        data.saveProducts(agency, null); // null triggers default restoration
        utils.toast(`${AGENCIES[agency].name} products reset to defaults`, 'success');
        AgencyHub.navigate('settings');
      }
    });

    // --- Data: Cloud Sync ---------------------------------------------------
    const syncCloudBtn = document.getElementById('dm-sync-cloud-btn');
    if (syncCloudBtn) {
      syncCloudBtn.addEventListener('click', async () => {
        if (!AgencyHub.isAdmin()) { AgencyHub.utils.toast('View-only access', 'warning'); return; }
        try {
          utils.toast('Syncing to Firebase Cloud...', 'info');
          const count = await data.pushToCloud();
          utils.toast(`Successfully synced ${count} data collections to Firebase Cloud!`, 'success');
        } catch (err) {
          console.error(err);
          utils.toast('Cloud sync failed — check Firebase rules', 'error');
        }
      });
    }

    // --- Data: Export --------------------------------------------------------
    const exportBtn = document.getElementById('dm-export-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        if (!AgencyHub.isAdmin()) { AgencyHub.utils.toast('View-only access', 'warning'); return; }
        data.exportAll();
        localStorage.setItem('agencyhub_last_backup', new Date().toISOString());
        utils.toast('Backup exported successfully', 'success');
      });
    }

    // --- Data: Import --------------------------------------------------------
    const importBtn = document.getElementById('dm-import-btn');
    if (importBtn) {
      importBtn.addEventListener('click', async () => {
        if (!AgencyHub.isAdmin()) { AgencyHub.utils.toast('View-only access', 'warning'); return; }
        const fileInput = document.getElementById('dm-import-file');
        if (!fileInput || !fileInput.files || !fileInput.files[0]) {
          utils.toast('Please select a JSON file first', 'warning');
          return;
        }

        const yes = await utils.confirm(
          'Import Data',
          'This will overwrite all existing data. Are you sure?'
        );
        if (!yes) return;

        const reader = new FileReader();
        reader.onload = function (evt) {
          try {
            data.importAll(evt.target.result);
            utils.toast('Data imported successfully!', 'success');
            AgencyHub.navigate('settings');
          } catch (err) {
            utils.toast('Import failed — invalid file format', 'error');
          }
        };
        reader.readAsText(fileInput.files[0]);
      });
    }

    // --- Data: Clear All -----------------------------------------------------
    const clearBtn = document.getElementById('dm-clear-all');
    if (clearBtn) {
      clearBtn.addEventListener('click', async () => {
        if (!AgencyHub.isAdmin()) { AgencyHub.utils.toast('View-only access', 'warning'); return; }
        const yes = await utils.confirm(
          'Clear All Data',
          'This will permanently delete ALL sales entries, credit bills, audits and settings. This action cannot be undone!'
        );
        if (!yes) return;

        // Remove all agencyhub-related localStorage keys
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('agencyhub_')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));

        utils.toast('All data has been cleared', 'success');
        AgencyHub.navigate('settings');
      });
    }

    // --- Enter-key support for product inputs --------------------------------
    utils.delegate(document.body, '.dm-new-product-input', 'keydown', function (e) {
      if (e.key === 'Enter') {
        const agency = e.target.id.replace('dm-new-product-', '');
        const addBtn = document.querySelector(`.dm-add-product[data-agency="${agency}"]`);
        if (addBtn) addBtn.click();
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Register
  // ---------------------------------------------------------------------------

  AgencyHub.registerModule('dataManager', { render, init });
})();
