// ============================================================
// AgencyHub — Sale Worksheet Forms Module (Bathipooja & Domie Formats)
// ============================================================
(function () {
  'use strict';

  // Default Domie Format Items (from original PDF)
  const DOMIE_STOCK_ITEMS = [
    'BATHIPOOJA SALMAL',
    'BATHPOOJA MALMAL',
    'BATH. LAVENDAR',
    'BATH. WETAKEIYA',
    'BATH. JASMINE',
    'BATH. SUPER DELUXE',
    'BATHPOOJA PINK',
    'BATHPOOJA MOGRA',
    'BATH. COOL CHAMPA',
    'BATH. CLASSIC',
    'BATH. SUPER HIT',
    'POOJAWALI RED',
    'POOJAWALI GREEN',
    'FRAGRANCE DOOPA'
  ];

  // Default Bathipooja Format Items
  const BATHIPOOJA_STOCK_ITEMS = [
    'BATHIPOOJA SALMAL',
    'BATHIPOOJA MALMAL',
    'BATHIPOOJA JASMINE',
    'BATHIPOOJA SUPER DX',
    'BATHIPOOJA WATAKEIYA',
    'BATHIPOOJA LAVENDRA',
    'BATHIPOOJA PINK',
    'BATHIPOOJA COOL CHAMPA',
    'BATHIPOOJA CLASSIC',
    'BATHIPOOJA SUPER HIT',
    'BATHIPOOJA GREEN',
    'BATHIPOOJA RED',
    'BATHIPOOJA CLASSIC PRO',
    'BATHIPOOJA SAMADI',
    'BATHIPOOJA WICKS',
    'BATHIPOOJA MOGRA',
    'FRAGRANCE DOOPA'
  ];

  let currentSettings = {
    selectedAgency: 'bathipooja', // 'bathipooja', 'domie', 'kelani'
    agencyTitle: 'BAKTHI HERBAL LANKA (PVT) LTD - AMBALANGODA',
    activeTab: 'all', // 'all', 'page1', 'page2'
    productMode: 'agency_preset', // 'agency_preset', 'custom_agency', 'blank'
    zoomLevel: 100,
  };

  function getAgencyPresetConfig(agId) {
    if (agId === 'bathipooja') {
      return {
        companyName: 'BAKTHI HERBAL LANKA (PVT) LTD',
        locationTitle: 'BATHIPOOJA - AMBALANGODA',
        items: BATHIPOOJA_STOCK_ITEMS,
        badgeColor: '#10B981',
        icon: '🪔'
      };
    } else if (agId === 'kelani') {
      const kelaniProds = AgencyHub.DEFAULT_PRODUCTS ? AgencyHub.DEFAULT_PRODUCTS.kelani || [] : [];
      return {
        companyName: 'KELANI CABLES (KCL LIGHTING)',
        locationTitle: 'KELANI CABLES - AMBALANGODA',
        items: kelaniProds.slice(0, 16),
        badgeColor: '#3B82F6',
        icon: '🔌'
      };
    } else {
      // Domie
      return {
        companyName: 'DOMIE TOFFEES',
        locationTitle: 'DOMIE - AMBALANGODA',
        items: DOMIE_STOCK_ITEMS,
        badgeColor: '#F59E0B',
        icon: '🍬'
      };
    }
  }

  function getStockItems(state, presetConfig) {
    if (currentSettings.productMode === 'blank') {
      return Array(presetConfig.items.length || 14).fill('');
    }
    if (currentSettings.productMode === 'custom_agency') {
      const agKey = state.currentAgency !== 'all' ? state.currentAgency : currentSettings.selectedAgency;
      const prods = AgencyHub.DEFAULT_PRODUCTS ? AgencyHub.DEFAULT_PRODUCTS[agKey] || [] : [];
      const result = [...prods];
      while (result.length < 14) result.push('');
      return result;
    }
    return presetConfig.items;
  }

  function render(state) {
    // If state current agency is specific (bathipooja / domie / kelani) and wasn't manually overridden yet
    if (state.currentAgency !== 'all' && state.currentAgency !== currentSettings.selectedAgency) {
      currentSettings.selectedAgency = state.currentAgency;
      const cfg = getAgencyPresetConfig(state.currentAgency);
      currentSettings.agencyTitle = `${cfg.companyName} — ${cfg.locationTitle}`;
    }

    const presetConfig = getAgencyPresetConfig(currentSettings.selectedAgency);
    const stockItems = getStockItems(state, presetConfig);
    const displayTitle = currentSettings.agencyTitle || `${presetConfig.companyName} — ${presetConfig.locationTitle}`;

    const showPage1 = currentSettings.activeTab === 'all' || currentSettings.activeTab === 'page1';
    const showPage2 = currentSettings.activeTab === 'all' || currentSettings.activeTab === 'page2';

    return `
      <div class="worksheet-studio container-fluid anim-fade">
        <!-- Top Studio Header -->
        <div class="ws-studio-header no-print">
          <div class="ws-studio-title">
            <div class="ws-icon-badge">${presetConfig.icon}</div>
            <div>
              <h2>Sale Worksheet Forms Studio</h2>
              <p>Printable Daily Sales Statement worksheets for Bathipooja, Domie & Kelani agencies</p>
            </div>
          </div>
          
          <div class="ws-studio-actions" style="display:flex;gap:10px;align-items:center;">
            <button class="btn btn-ghost" id="ws-btn-download-pdf" style="display:inline-flex;align-items:center;gap:8px;padding:9px 16px;font-weight:600;color:var(--primary-light,#818cf8);border:1px solid var(--border-color,#334155);background:var(--bg-surface,#0f172a);">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download PDF
            </button>
            <button class="btn btn-primary" id="ws-btn-print" style="display:inline-flex;align-items:center;gap:8px;padding:9px 18px;font-weight:600;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2 2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
              Print ${presetConfig.companyName.split(' ')[0]} Worksheet
            </button>
          </div>
        </div>

        <!-- Agency Format Switcher Cards (Screen Only) -->
        <div class="ws-agency-switcher mb-3 no-print">
          <button class="ws-agency-card ${currentSettings.selectedAgency === 'bathipooja' ? 'active' : ''}" data-agency-preset="bathipooja">
            <span class="ag-icon">🪔</span>
            <div class="ag-info">
              <span class="ag-name">Bathipooja Worksheet</span>
              <span class="ag-sub">Bakthi Herbal Lanka (Pvt) Ltd</span>
            </div>
          </button>

          <button class="ws-agency-card ${currentSettings.selectedAgency === 'domie' ? 'active' : ''}" data-agency-preset="domie">
            <span class="ag-icon">🍬</span>
            <div class="ag-info">
              <span class="ag-name">Domie Worksheet</span>
              <span class="ag-sub">Domie Toffees - Ambalangoda</span>
            </div>
          </button>

          <button class="ws-agency-card ${currentSettings.selectedAgency === 'kelani' ? 'active' : ''}" data-agency-preset="kelani">
            <span class="ag-icon">🔌</span>
            <div class="ag-info">
              <span class="ag-name">Kelani Cables Worksheet</span>
              <span class="ag-sub">Kelani Cables (KCL Lighting)</span>
            </div>
          </button>
        </div>

        <!-- Format & Studio Controls -->
        <div class="card mb-4 no-print" style="background:var(--card-bg, #1e293b);border:1px solid var(--border-color, #334155);border-radius:12px;padding:16px;">
          <!-- Format Tabs -->
          <div class="ws-format-tabs mb-3">
            <button class="ws-tab-btn ${currentSettings.activeTab === 'all' ? 'active' : ''}" data-tab="all">
              <span class="tab-icon">📑</span> Both Formats (Page 1 & 2)
            </button>
            <button class="ws-tab-btn ${currentSettings.activeTab === 'page1' ? 'active' : ''}" data-tab="page1">
              <span class="tab-icon">📄</span> Page 1: Cash, Stock & Credit
            </button>
            <button class="ws-tab-btn ${currentSettings.activeTab === 'page2' ? 'active' : ''}" data-tab="page2">
              <span class="tab-icon">📄</span> Page 2: Cheques & Collections
            </button>
          </div>

          <div class="grid grid-3 gap-3" style="align-items:end;">
            <div>
              <label class="form-label" style="font-weight:600;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted, #94a3b8);">Header Title & Location</label>
              <input type="text" class="form-input" id="ws-input-title" value="${AgencyHub.utils.escapeHtml(displayTitle)}" placeholder="e.g. BAKTHI HERBAL LANKA (PVT) LTD - AMBALANGODA" />
            </div>

            <div>
              <label class="form-label" style="font-weight:600;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted, #94a3b8);">Stock Row Format</label>
              <select class="form-select" id="ws-select-products">
                <option value="agency_preset" ${currentSettings.productMode === 'agency_preset' ? 'selected' : ''}>Pre-filled ${presetConfig.companyName.split(' ')[0]} Items (${stockItems.length} items)</option>
                <option value="blank" ${currentSettings.productMode === 'blank' ? 'selected' : ''}>Clean Blank Stock Rows</option>
              </select>
            </div>

            <div>
              <label class="form-label" style="font-weight:600;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted, #94a3b8);">Preview Zoom</label>
              <div class="ws-zoom-controls">
                <button class="btn btn-ghost btn-sm" id="ws-zoom-out" title="Zoom Out">-</button>
                <span class="ws-zoom-value">${currentSettings.zoomLevel}%</span>
                <button class="btn btn-ghost btn-sm" id="ws-zoom-in" title="Zoom In">+</button>
                <button class="btn btn-ghost btn-sm" id="ws-zoom-reset" style="margin-left:auto;">Fit</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Document Preview Canvas Stage -->
        <div class="ws-stage-wrapper no-print-bg">
          <div class="ws-stage-container" style="transform: scale(${currentSettings.zoomLevel / 100}); transform-origin: top center;">
            
            <div id="worksheet-printable-area" class="worksheet-paper-container">
              ${showPage1 ? `
              <!-- PAGE 1 FORMAT -->
              <div class="ws-page" id="ws-page-1">
                <div class="ws-page-badge no-print">${presetConfig.companyName.split(' ')[0]} • PAGE 1 OF 2</div>
                
                <div class="ws-header-container">
                  <div class="ws-title-block">
                    <h1 class="ws-main-title">DAILY SALES STATEMENT</h1>
                    <h2 class="ws-sub-title" id="ws-title-display-1">${AgencyHub.utils.escapeHtml(displayTitle)}</h2>
                    <div class="ws-header-fields">
                      <span>DATE: ________________________________</span>
                      <span>AREA: ________________________</span>
                    </div>
                  </div>
                  <div class="ws-summary-box">
                    <table class="ws-table ws-table-summary">
                      <tr>
                        <th style="width:60%;">SUMMARY SALE</th>
                        <td style="width:40%;"></td>
                      </tr>
                      <tr>
                        <th>P/CALLS DONE</th>
                        <td></td>
                      </tr>
                      <tr>
                        <th>K.M DONE</th>
                        <td></td>
                      </tr>
                    </table>
                  </div>
                </div>

                <div class="ws-grid-2">
                  <!-- Left Column: Cash & Expenses -->
                  <div class="ws-col-left">
                    <div class="ws-section-title">DETAILS OF CASH</div>
                    <table class="ws-table ws-table-cash">
                      <thead>
                        <tr>
                          <th style="width:45%;">NOTES</th>
                          <th style="width:35%;">Rs.</th>
                          <th style="width:20%;">CTS.</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr><td class="text-left">5000 X</td><td></td><td></td></tr>
                        <tr><td class="text-left">2000 X</td><td></td><td></td></tr>
                        <tr><td class="text-left">1000 X</td><td></td><td></td></tr>
                        <tr><td class="text-left">500 X</td><td></td><td></td></tr>
                        <tr><td class="text-left">100 X</td><td></td><td></td></tr>
                        <tr><td class="text-left">50 X</td><td></td><td></td></tr>
                        <tr><td class="text-left">20 X</td><td></td><td></td></tr>
                        <tr><td class="text-left">COINS</td><td></td><td></td></tr>
                        <tr class="ws-row-total"><th class="text-left">TOTAL</th><td></td><td></td></tr>
                      </tbody>
                    </table>

                    <div class="ws-section-title" style="margin-top:10px;">EXPENSES</div>
                    <table class="ws-table ws-table-expenses">
                      <tbody>
                        <tr><td class="text-left" style="width:60%;">CASH COLLECTOR</td><td style="width:40%;"></td></tr>
                        <tr><td class="text-left">SALES REP</td><td></td></tr>
                        <tr><td class="text-left">DIESEL</td><td></td></tr>
                        <tr><td class="text-left">OTHERS</td><td></td></tr>
                        <tr class="ws-row-total"><th class="text-left">TOTAL</th><td></td></tr>
                      </tbody>
                    </table>
                  </div>

                  <!-- Right Column: Stocks -->
                  <div class="ws-col-right">
                    <div class="ws-section-title">STOCKS (${stockItems.length} ITEMS)</div>
                    <table class="ws-table ws-table-stocks">
                      <thead>
                        <tr>
                          <th style="width:30%;">ITEM</th>
                          <th style="width:14%;">UNIT PRICE</th>
                          <th style="width:14%;">LOADING</th>
                          <th style="width:14%;">UNLOADING</th>
                          <th style="width:14%;">SHORT</th>
                          <th style="width:14%;">MARGIN RETURN</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${stockItems.map(item => `
                          <tr>
                            <td class="text-left ws-cell-item">${AgencyHub.utils.escapeHtml(item)}</td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- Bottom: Details of Credit Bills -->
                <div class="ws-section-credit" style="margin-top:10px;">
                  <div class="ws-section-title">DETAILS OF CREDIT BILLS</div>
                  <table class="ws-table ws-table-credit">
                    <thead>
                      <tr>
                        <th style="width:6%;">NO.</th>
                        <th style="width:18%;">INVOICE NO:</th>
                        <th style="width:30%;">DEALER NAME</th>
                        <th style="width:32%;">ADDRESS</th>
                        <th style="width:14%;">AMOUNT</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${Array.from({ length: 12 }, (_, i) => `
                        <tr>
                          <td>${i + 1}</td>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td></td>
                        </tr>
                      `).join('')}
                      <tr class="ws-row-total">
                        <th colspan="4" class="text-right" style="padding-right:12px;">TOTAL</th>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              ` : ''}

              ${showPage2 ? `
              <!-- PAGE 2 FORMAT -->
              <div class="ws-page ${showPage1 ? 'ws-page-break' : ''}" id="ws-page-2">
                <div class="ws-page-badge no-print">${presetConfig.companyName.split(' ')[0]} • PAGE 2 OF 2</div>
                
                <div class="ws-header-container-p2">
                  <h1 class="ws-main-title-p2">DAILY SALES STATEMENT — <span id="ws-title-display-2">${AgencyHub.utils.escapeHtml(displayTitle)}</span></h1>
                  <div class="ws-sub-p2">Page 2</div>
                </div>

                <div class="ws-grid-2">
                  <!-- Left Column: Details of Cheques -->
                  <div class="ws-col-cheques" style="width:63%;">
                    <div class="ws-section-title">DETAILS OF CHEQUES</div>
                    <table class="ws-table ws-table-cheques">
                      <thead>
                        <tr>
                          <th style="width:15%;">INVOICE DATE</th>
                          <th style="width:15%;">BANK</th>
                          <th style="width:16%;">CHEQ NO:</th>
                          <th style="width:26%;">DEALER NAME</th>
                          <th style="width:14%;">DATE</th>
                          <th style="width:14%;">AMOUNT</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${Array.from({ length: 8 }, () => `
                          <tr>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                          </tr>
                        `).join('')}
                        <tr class="ws-row-total">
                          <th colspan="5" class="text-right" style="padding-right:8px;">TOTAL</th>
                          <td></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <!-- Right Column: Summary Details -->
                  <div class="ws-col-summary" style="width:35%;">
                    <div class="ws-section-title">SUMMARY DETAILS</div>
                    <table class="ws-table ws-table-summary-details">
                      <thead>
                        <tr>
                          <th style="width:65%;">DETAILS</th>
                          <th style="width:35%;">Rs.</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr><td class="text-left">DAY CASH</td><td></td></tr>
                        <tr><td class="text-left">DAY CREDIT</td><td></td></tr>
                        <tr><td class="text-left">DAY CHEQUES</td><td></td></tr>
                        <tr class="ws-row-highlight"><th class="text-left">TOTAL</th><td></td></tr>
                        <tr><td class="text-left">SUMMARY SALE</td><td></td></tr>
                        <tr><td class="text-left">EXPENSES</td><td></td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- Collection Details -->
                <div class="ws-section-collections" style="margin-top:12px;">
                  <div class="ws-section-title">COLLECTION DETAILS</div>
                  <table class="ws-table ws-table-collections">
                    <thead>
                      <tr>
                        <th style="width:12%;">INVOICE DATE</th>
                        <th style="width:12%;">INVOICE NO:</th>
                        <th style="width:24%;">DEALER NAME</th>
                        <th style="width:24%;">ADDRESS</th>
                        <th style="width:10%;">AMOUNT</th>
                        <th style="width:9%;">CASH</th>
                        <th style="width:9%;">CHEQUE</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${Array.from({ length: 12 }, () => `
                        <tr>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td></td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>

                <!-- Return Cheques -->
                <div class="ws-section-returns" style="margin-top:12px;">
                  <div class="ws-section-title">RETURN CHEQUES</div>
                  <table class="ws-table ws-table-returns">
                    <thead>
                      <tr>
                        <th style="width:15%;">CHEQUE NO:</th>
                        <th style="width:28%;">DEALER NAME</th>
                        <th style="width:28%;">ADDRESS</th>
                        <th style="width:14%;">AMOUNT</th>
                        <th style="width:15%;">COLLECTION DETAILS</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${Array.from({ length: 5 }, () => `
                        <tr>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td></td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              </div>
              ` : ''}
            </div>

          </div>
        </div>
      </div>
    `;
  }

  function init(state) {
    const container = document.getElementById('content');
    if (!container) return;

    // Handle Agency Preset Switcher
    const agencyPresetBtns = document.querySelectorAll('.ws-agency-card');
    agencyPresetBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const agPreset = e.currentTarget.dataset.agencyPreset;
        currentSettings.selectedAgency = agPreset;
        const cfg = getAgencyPresetConfig(agPreset);
        currentSettings.agencyTitle = `${cfg.companyName} — ${cfg.locationTitle}`;
        container.innerHTML = render(state);
        init(state);
      });
    });

    // Handle Title Input Change
    const titleInput = document.getElementById('ws-input-title');
    if (titleInput) {
      titleInput.addEventListener('input', (e) => {
        const val = e.target.value;
        currentSettings.agencyTitle = val;
        const d1 = document.getElementById('ws-title-display-1');
        const d2 = document.getElementById('ws-title-display-2');
        if (d1) d1.textContent = val || 'DAILY SALES STATEMENT';
        if (d2) d2.textContent = val || 'DAILY SALES STATEMENT';
      });
    }

    // Handle Format Tabs
    const tabBtns = document.querySelectorAll('.ws-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.dataset.tab;
        currentSettings.activeTab = tab;
        container.innerHTML = render(state);
        init(state);
      });
    });

    // Handle Product Mode Filter
    const prodSelect = document.getElementById('ws-select-products');
    if (prodSelect) {
      prodSelect.addEventListener('change', (e) => {
        currentSettings.productMode = e.target.value;
        container.innerHTML = render(state);
        init(state);
      });
    }

    // Zoom Controls
    const zoomOut = document.getElementById('ws-zoom-out');
    const zoomIn = document.getElementById('ws-zoom-in');
    const zoomReset = document.getElementById('ws-zoom-reset');

    if (zoomOut) {
      zoomOut.addEventListener('click', () => {
        if (currentSettings.zoomLevel > 50) {
          currentSettings.zoomLevel -= 10;
          container.innerHTML = render(state);
          init(state);
        }
      });
    }
    if (zoomIn) {
      zoomIn.addEventListener('click', () => {
        if (currentSettings.zoomLevel < 150) {
          currentSettings.zoomLevel += 10;
          container.innerHTML = render(state);
          init(state);
        }
      });
    }
    if (zoomReset) {
      zoomReset.addEventListener('click', () => {
        currentSettings.zoomLevel = 100;
        container.innerHTML = render(state);
        init(state);
      });
    }

    // Print Button
    const printBtn = document.getElementById('ws-btn-print');
    if (printBtn) {
      printBtn.addEventListener('click', () => {
        window.print();
      });
    }

    // Download PDF Button
    const pdfBtn = document.getElementById('ws-btn-download-pdf');
    if (pdfBtn) {
      pdfBtn.addEventListener('click', () => {
        const el = document.getElementById('worksheet-printable-area');
        if (!el) return;

        AgencyHub.utils.toast('Generating PDF document...', 'info');

        const opt = {
          margin:       [4, 4, 4, 4],
          filename:     `Sales_Statement_${currentSettings.selectedAgency}_${new Date().toISOString().split('T')[0]}.pdf`,
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true, logging: false },
          jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        if (window.html2pdf) {
          window.html2pdf().set(opt).from(el).save().then(() => {
            AgencyHub.utils.toast('PDF generated & downloaded!', 'success');
          }).catch(err => {
            console.error(err);
            window.print();
          });
        } else {
          window.print();
        }
      });
    }
  }

  // Register Module
  AgencyHub.registerModule('worksheets', {
    render: render,
    init: init
  });

})();
