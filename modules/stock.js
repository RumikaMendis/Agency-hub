// =============================================================================
// AgencyHub — Stock Management Module (With Return Stock Support)
// =============================================================================

(function () {
  'use strict';

  const { data, utils, AGENCIES } = AgencyHub;

  // Active state for stock view
  let activeAgency = 'bathipooja';
  let activeMonth = utils.today().substring(0, 7); // YYYY-MM
  let activeSubTab = 'registry'; // 'registry' | 'invoices' | 'returns'

  // Helper: calculate total sold quantities for an agency in a specific month
  function getSoldQuantities(agencyId, monthStr) {
    const sold = {};
    const entries = data.getSalesEntries(agencyId);

    entries.forEach(entry => {
      if (entry.date && entry.date.startsWith(monthStr)) {
        if (entry.itemQuantities) {
          Object.entries(entry.itemQuantities).forEach(([prodName, qty]) => {
            sold[prodName] = (sold[prodName] || 0) + (Number(qty) || 0);
          });
        } else if (entry.entries && Array.isArray(entry.entries)) {
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

  // Helper: calculate total received stock from invoices for an agency in a month
  function getReceivedQuantities(agencyId, monthStr) {
    const received = {};
    const invoices = data.getReceivedInvoices(agencyId, monthStr);

    invoices.forEach(inv => {
      if (inv.items) {
        Object.entries(inv.items).forEach(([prodName, qty]) => {
          received[prodName] = (received[prodName] || 0) + (Number(qty) || 0);
        });
      }
    });
    return received;
  }

  // Helper: calculate total returned stock for an agency in a month
  function getReturnedQuantities(agencyId, monthStr) {
    const returned = {};
    const invoices = data.getReturnedStockInvoices(agencyId, monthStr);

    invoices.forEach(inv => {
      if (inv.items) {
        Object.entries(inv.items).forEach(([prodName, qty]) => {
          returned[prodName] = (returned[prodName] || 0) + (Number(qty) || 0);
        });
      }
    });
    return returned;
  }

  // ---------------------------------------------------------------------------
  // Render Module
  // ---------------------------------------------------------------------------
  function render(state) {
    const products = data.getProducts(activeAgency) || [];
    const soldMap = getSoldQuantities(activeAgency, activeMonth);
    const receivedMap = getReceivedQuantities(activeAgency, activeMonth);
    const returnedMap = getReturnedQuantities(activeAgency, activeMonth);
    const savedInventory = data.getInventory(activeAgency, activeMonth) || {};

    const agencyInfo = AGENCIES[activeAgency] || { name: activeAgency, color: '#3B82F6', icon: '📦' };

    // Build main agency tabs
    const tabsHtml = Object.keys(AGENCIES).map(key => {
      const agency = AGENCIES[key];
      return `<button class="tab ${key === activeAgency ? 'active' : ''}" data-stock-agency="${key}">
        ${agency.icon || ''} ${agency.name}
      </button>`;
    }).join('');

    // Sub-tab Navigation
    const subTabsHtml = `
      <div class="flex gap-2" style="border-bottom:1px solid var(--glass-border);padding-bottom:12px;margin-bottom:20px;flex-wrap:wrap;">
        <button class="btn btn-sm ${activeSubTab === 'registry' ? 'btn-primary' : 'btn-ghost'}" id="stock-subtab-registry" style="border-radius:20px;padding:6px 16px">
          📋 Stock Registry
        </button>
        <button class="btn btn-sm ${activeSubTab === 'invoices' ? 'btn-primary' : 'btn-ghost'}" id="stock-subtab-invoices" style="border-radius:20px;padding:6px 16px">
          🚚 Received Invoices
        </button>
        <button class="btn btn-sm ${activeSubTab === 'returns' ? 'btn-primary' : 'btn-ghost'}" id="stock-subtab-returns" style="border-radius:20px;padding:6px 16px">
          🔄 Return Stock Logs
        </button>
      </div>
    `;

    // Dynamic inner content
    let innerContentHtml = '';

    if (activeSubTab === 'registry') {
      // REGISTRY TAB
      let rowsHtml = '';
      let totalOpening = 0;
      let totalReceived = 0;
      let totalReturned = 0;
      let totalSold = 0;
      let totalExpected = 0;
      let totalPhysical = 0;
      let totalVariance = 0;
      let physicalCountEntered = 0;

      if (products.length === 0) {
        rowsHtml = `<tr>
          <td colspan="8" class="text-center text-muted" style="padding:2rem">
            No products configured for this agency. Go to Settings to add products.
          </td>
        </tr>`;
      } else {
        products.forEach(p => {
          const saved = savedInventory[p] || {};
          const opening = Number(saved.opening) || 0;
          const received = receivedMap[p] || 0;
          const returned = returnedMap[p] || 0;
          const sold = soldMap[p] || 0;
          const expected = opening + received + returned - sold;

          const physicalVal = (saved.physical === undefined || saved.physical === '') ? '' : Number(saved.physical);
          const hasPhysical = physicalVal !== '';
          const variance = hasPhysical ? (physicalVal - expected) : 0;

          totalOpening += opening;
          totalReceived += received;
          totalReturned += returned;
          totalSold += sold;
          totalExpected += expected;
          if (hasPhysical) {
            totalPhysical += physicalVal;
            totalVariance += variance;
            physicalCountEntered++;
          }

          // Variance Badge
          let varianceHtml = '<span class="text-muted">—</span>';
          if (hasPhysical) {
            if (variance > 0) {
              varianceHtml = `<span class="badge" style="background:rgba(16,185,129,0.15);color:#10B981;font-weight:700">+${variance}</span>`;
            } else if (variance < 0) {
              varianceHtml = `<span class="badge" style="background:rgba(239,68,68,0.15);color:#EF4444;font-weight:700">${variance}</span>`;
            } else {
              varianceHtml = `<span class="badge" style="background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.7)">0</span>`;
            }
          }

          rowsHtml += `
            <tr data-product-row="${p}">
              <td style="font-weight:600;color:rgba(255,255,255,0.9)">${p}</td>
              <td>
                <input type="number" class="form-input form-input-sm st-opening" data-product="${p}" value="${opening}" min="0" style="width:90px;text-align:center;margin:0 auto">
              </td>
              <td class="st-received-val" data-product="${p}" style="font-weight:600;font-variant-numeric:tabular-nums;color:var(--text-muted)">${received}</td>
              <td class="st-returned-val" data-product="${p}" style="font-weight:600;font-variant-numeric:tabular-nums;color:#F59E0B">${returned}</td>
              <td style="color:#3B82F6;font-weight:600;font-variant-numeric:tabular-nums">${sold}</td>
              <td class="st-expected-val" data-product="${p}" style="font-weight:600;font-variant-numeric:tabular-nums">${expected}</td>
              <td>
                <input type="number" class="form-input form-input-sm st-physical" data-product="${p}" value="${physicalVal}" placeholder="${expected}" min="0" style="width:90px;text-align:center;margin:0 auto">
              </td>
              <td class="st-variance-cell" data-product="${p}">${varianceHtml}</td>
            </tr>
          `;
        });

        // Add Total Row
        const displayTotalVariance = physicalCountEntered > 0 ? totalVariance : 0;
        let totalVarianceHtml = '<span class="text-muted">—</span>';
        if (physicalCountEntered > 0) {
          if (displayTotalVariance > 0) {
            totalVarianceHtml = `<span class="badge" style="background:rgba(16,185,129,0.15);color:#10B981;font-weight:700">+${displayTotalVariance}</span>`;
          } else if (displayTotalVariance < 0) {
            totalVarianceHtml = `<span class="badge" style="background:rgba(239,68,68,0.15);color:#EF4444;font-weight:700">${displayTotalVariance}</span>`;
          } else {
            totalVarianceHtml = `<span class="badge" style="background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.7)">0</span>`;
          }
        }

        rowsHtml += `
          <tr class="row-total" style="background:rgba(255,255,255,0.03);border-top:2px solid var(--glass-border-hover)">
            <td style="font-weight:bold;text-transform:uppercase;color:rgba(255,255,255,0.9)">Total</td>
            <td id="st-total-opening" style="font-weight:bold;font-variant-numeric:tabular-nums">${totalOpening}</td>
            <td id="st-total-received" style="font-weight:bold;font-variant-numeric:tabular-nums">${totalReceived}</td>
            <td id="st-total-returned" style="font-weight:bold;color:#F59E0B;font-variant-numeric:tabular-nums">${totalReturned}</td>
            <td id="st-total-sold" style="font-weight:bold;color:#3B82F6;font-variant-numeric:tabular-nums">${totalSold}</td>
            <td id="st-total-expected" style="font-weight:bold;font-variant-numeric:tabular-nums">${totalExpected}</td>
            <td id="st-total-physical" style="font-weight:bold;font-variant-numeric:tabular-nums">${physicalCountEntered > 0 ? totalPhysical : '—'}</td>
            <td id="st-total-variance">${totalVarianceHtml}</td>
          </tr>
        `;
      }

      innerContentHtml = `
        <div class="flex items-center justify-between mb-4 flex-wrap gap-4">
          <h3 class="card-title" style="margin:0">${agencyInfo.icon} ${agencyInfo.name} — Monthly Stock Registry</h3>
          <div class="flex gap-2">
            <button class="btn btn-ghost btn-sm" id="stock-autofill-btn" ${products.length === 0 ? 'disabled' : ''}>
              ✨ Auto-Fill Physical Count
            </button>
            <button class="btn btn-primary btn-sm" id="stock-save-btn" ${products.length === 0 ? 'disabled' : ''}>
              💾 Save Stock Records
            </button>
          </div>
        </div>

        <div class="sales-table-wrapper" style="overflow-x:auto">
          <table class="sales-table" style="min-width:750px;width:100%">
            <thead>
              <tr>
                <th style="text-align:left;width:25%">Product Name</th>
                <th style="width:11%">Opening Stock</th>
                <th style="width:11%">Stock Received (+)</th>
                <th style="width:11%">Stock Returned (+)</th>
                <th style="width:10%">Sold Qty (-)</th>
                <th style="width:11%">Expected Closing</th>
                <th style="width:11%">Physical Count</th>
                <th style="width:11%">Variance</th>
              </tr>
            </thead>
            <tbody id="stock-table-body">
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      `;
    } else if (activeSubTab === 'returns') {
      // RETURN STOCK LOGS TAB
      const returnInvoices = data.getReturnedStockInvoices(activeAgency, activeMonth);
      let returnRows = '';

      if (returnInvoices.length === 0) {
        returnRows = `
          <tr>
            <td colspan="4" class="text-center text-muted" style="padding:3rem">
              No stock returns recorded in ${utils.formatDate(activeMonth + '-01').substring(3)}. Click "➕ Log Return Stock" to record returned items.
            </td>
          </tr>
        `;
      } else {
        returnInvoices.forEach(inv => {
          const totalQty = Object.values(inv.items || {}).reduce((s, q) => s + Number(q), 0);
          const itemsList = Object.entries(inv.items || {})
            .map(([name, qty]) => `${name} (${qty})`)
            .join(', ');

          const itemsPreview = itemsList 
            ? `<div style="font-size:0.8rem;color:rgba(255,255,255,0.45);margin-top:4px;max-width:400px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:400" title="${itemsList}">🔄 ${itemsList}</div>`
            : '<div style="font-size:0.8rem;color:rgba(255,255,255,0.3);margin-top:4px;font-weight:400">🔄 No items recorded</div>';

          returnRows += `
            <tr style="border-bottom:1px solid var(--glass-border)">
              <td style="font-weight:600;color:rgba(255,255,255,0.95);text-align:left;padding:12px 16px">
                ${inv.invoiceNo}
                ${itemsPreview}
              </td>
              <td style="text-align:center;padding:12px 16px">${utils.formatDate(inv.date)}</td>
              <td style="text-align:center;padding:12px 16px;font-variant-numeric:tabular-nums;color:#F59E0B;font-weight:700">${totalQty} items</td>
              <td style="text-align:center;padding:12px 16px;display:flex;justify-content:center;gap:8px">
                <button class="btn btn-ghost btn-sm stock-edit-return-inv" data-id="${inv.id}" style="padding:4px 8px">
                  ✏️ Edit
                </button>
                <button class="btn btn-danger btn-sm stock-delete-return-inv admin-only" data-id="${inv.id}" style="padding:4px 8px">
                  🗑️ Delete
                </button>
              </td>
            </tr>
          `;
        });
      }

      innerContentHtml = `
        <div class="flex items-center justify-between mb-4 flex-wrap gap-4">
          <h3 class="card-title" style="margin:0">${agencyInfo.icon} ${agencyInfo.name} — Customer & Market Returns</h3>
          <button class="btn btn-primary btn-sm" id="stock-add-return-btn" style="background:#F59E0B;border-color:#F59E0B;color:#000;font-weight:700;">
            ➕ Log Return Stock
          </button>
        </div>

        <div class="sales-table-wrapper" style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;min-width:600px">
            <thead>
              <tr style="border-bottom:2px solid var(--glass-border);background:rgba(255,255,255,0.02)">
                <th style="text-align:left;padding:12px 16px">Return Ref / Notes</th>
                <th style="text-align:center;padding:12px 16px">Date Returned</th>
                <th style="text-align:center;padding:12px 16px">Returned Quantity</th>
                <th style="text-align:center;padding:12px 16px">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${returnRows}
            </tbody>
          </table>
        </div>
      `;
    } else {
      // RECEIVED INVOICES TAB
      const invoices = data.getReceivedInvoices(activeAgency, activeMonth);
      let invoicesRows = '';

      if (invoices.length === 0) {
        invoicesRows = `
          <tr>
            <td colspan="4" class="text-center text-muted" style="padding:3rem">
              No stock invoices received in ${utils.formatDate(activeMonth + '-01').substring(3)}. Click "+ Add Stock Invoice" to log incoming stock.
            </td>
          </tr>
        `;
      } else {
        invoices.forEach(inv => {
          const totalQty = Object.values(inv.items || {}).reduce((s, q) => s + Number(q), 0);
          
          const itemsList = Object.entries(inv.items || {})
            .map(([name, qty]) => `${name} (${qty})`)
            .join(', ');

          const itemsPreview = itemsList 
            ? `<div style="font-size:0.8rem;color:rgba(255,255,255,0.45);margin-top:4px;max-width:400px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:400" title="${itemsList}">📦 ${itemsList}</div>`
            : '<div style="font-size:0.8rem;color:rgba(255,255,255,0.3);margin-top:4px;font-weight:400">📦 No items recorded</div>';

          invoicesRows += `
            <tr style="border-bottom:1px solid var(--glass-border)">
              <td style="font-weight:600;color:rgba(255,255,255,0.95);text-align:left;padding:12px 16px">
                ${inv.invoiceNo}
                ${itemsPreview}
              </td>
              <td style="text-align:center;padding:12px 16px">${utils.formatDate(inv.date)}</td>
              <td style="text-align:center;padding:12px 16px;font-variant-numeric:tabular-nums">${totalQty} items</td>
              <td style="text-align:center;padding:12px 16px;display:flex;justify-content:center;gap:8px">
                <button class="btn btn-ghost btn-sm stock-edit-inv" data-id="${inv.id}" style="padding:4px 8px">
                  ✏️ Edit
                </button>
                <button class="btn btn-danger btn-sm stock-delete-inv admin-only" data-id="${inv.id}" style="padding:4px 8px">
                  🗑️ Delete
                </button>
              </td>
            </tr>
          `;
        });
      }

      innerContentHtml = `
        <div class="flex items-center justify-between mb-4 flex-wrap gap-4">
          <h3 class="card-title" style="margin:0">${agencyInfo.icon} ${agencyInfo.name} — Incoming Shipments</h3>
          <button class="btn btn-primary btn-sm" id="stock-add-inv-btn">
            ➕ Add Stock Invoice
          </button>
        </div>

        <div class="sales-table-wrapper" style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;min-width:600px">
            <thead>
              <tr style="border-bottom:2px solid var(--glass-border);background:rgba(255,255,255,0.02)">
                <th style="text-align:left;padding:12px 16px">Invoice No.</th>
                <th style="text-align:center;padding:12px 16px">Date Received</th>
                <th style="text-align:center;padding:12px 16px">Total Quantity</th>
                <th style="text-align:center;padding:12px 16px">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${invoicesRows}
            </tbody>
          </table>
        </div>
      `;
    }

    return `
      <div class="anim-fade" id="stock-module-container">
        <div class="section-header mb-6">
          <div>
            <h2 class="section-title">Stock Management</h2>
            <p class="section-subtitle">Track inventories, opening, received, returned & sold stock</p>
          </div>
          <div class="flex items-center gap-4">
            <div class="form-group" style="margin:0">
              <label class="form-label text-xs uppercase" style="margin-bottom:4px">Month</label>
              <input type="month" id="stock-month-input" class="form-input form-input-sm" value="${activeMonth}" style="width:160px;font-variant-numeric:tabular-nums">
            </div>
          </div>
        </div>

        <div class="tabs mb-6">${tabsHtml}</div>

        <div class="card mb-6 anim-slide-up" style="padding:20px">
          ${subTabsHtml}
          ${innerContentHtml}
        </div>
      </div>
    `;
  }

  // ---------------------------------------------------------------------------
  // Recalculate Registry Dynamic totals
  // ---------------------------------------------------------------------------
  function updateCalculations() {
    if (activeSubTab !== 'registry') return;

    const rows = document.querySelectorAll('#stock-table-body tr:not(.row-total)');
    let totalOpening = 0;
    let totalReceived = 0;
    let totalReturned = 0;
    let totalSold = 0;
    let totalExpected = 0;
    let totalPhysical = 0;
    let totalVariance = 0;
    let physicalCountEntered = 0;

    const soldMap = getSoldQuantities(activeAgency, activeMonth);
    const returnedMap = getReturnedQuantities(activeAgency, activeMonth);

    rows.forEach(row => {
      const p = row.getAttribute('data-product-row');
      if (!p) return;

      const openingInput = row.querySelector('.st-opening');
      const receivedEl = row.querySelector('.st-received-val');
      const returnedEl = row.querySelector('.st-returned-val');
      const physicalInput = row.querySelector('.st-physical');
      const expectedEl = row.querySelector('.st-expected-val');
      const varianceCell = row.querySelector('.st-variance-cell');

      const opening = Number(openingInput?.value) || 0;
      const received = Number(receivedEl?.textContent) || 0;
      const returned = returnedMap[p] || 0;
      const soldQty = soldMap[p] || 0;

      if (returnedEl) returnedEl.textContent = returned;

      const computedExpected = opening + received + returned - soldQty;

      if (expectedEl) expectedEl.textContent = computedExpected;

      const physicalText = physicalInput?.value ? physicalInput.value.trim() : '';
      const hasPhysical = physicalText !== '';
      const physicalVal = hasPhysical ? Number(physicalText) : 0;
      const variance = hasPhysical ? (physicalVal - computedExpected) : 0;

      totalOpening += opening;
      totalReceived += received;
      totalReturned += returned;
      totalSold += soldQty;
      totalExpected += computedExpected;

      if (hasPhysical) {
        totalPhysical += physicalVal;
        totalVariance += variance;
        physicalCountEntered++;
      }

      // Update Variance UI in the row
      if (hasPhysical) {
        if (variance > 0) {
          varianceCell.innerHTML = `<span class="badge" style="background:rgba(16,185,129,0.15);color:#10B981;font-weight:700">+${variance}</span>`;
        } else if (variance < 0) {
          varianceCell.innerHTML = `<span class="badge" style="background:rgba(239,68,68,0.15);color:#EF4444;font-weight:700">${variance}</span>`;
        } else {
          varianceCell.innerHTML = `<span class="badge" style="background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.7)">0</span>`;
        }
      } else {
        varianceCell.innerHTML = '<span class="text-muted">—</span>';
      }
    });

    // Update Bottom Row Totals
    const totalOpeningEl = document.getElementById('st-total-opening');
    const totalReceivedEl = document.getElementById('st-total-received');
    const totalReturnedEl = document.getElementById('st-total-returned');
    const totalExpectedEl = document.getElementById('st-total-expected');
    const totalPhysicalEl = document.getElementById('st-total-physical');
    const totalVarianceEl = document.getElementById('st-total-variance');
    const totalSoldEl = document.getElementById('st-total-sold');

    if (totalOpeningEl) totalOpeningEl.textContent = totalOpening;
    if (totalReceivedEl) totalReceivedEl.textContent = totalReceived;
    if (totalReturnedEl) totalReturnedEl.textContent = totalReturned;
    if (totalSoldEl) totalSoldEl.textContent = totalSold;
    if (totalExpectedEl) totalExpectedEl.textContent = totalExpected;

    if (totalPhysicalEl) {
      totalPhysicalEl.textContent = physicalCountEntered > 0 ? totalPhysical : '—';
    }

    if (totalVarianceEl) {
      if (physicalCountEntered > 0) {
        if (totalVariance > 0) {
          totalVarianceEl.innerHTML = `<span class="badge" style="background:rgba(16,185,129,0.15);color:#10B981;font-weight:700">+${totalVariance}</span>`;
        } else if (totalVariance < 0) {
          totalVarianceEl.innerHTML = `<span class="badge" style="background:rgba(239,68,68,0.15);color:#EF4444;font-weight:700">${totalVariance}</span>`;
        } else {
          totalVarianceEl.innerHTML = `<span class="badge" style="background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.7)">0</span>`;
        }
      } else {
        totalVarianceEl.innerHTML = '<span class="text-muted">—</span>';
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Stock Invoice Modal
  // ---------------------------------------------------------------------------
  function showInvoiceModal(invoiceId = null) {
    const products = data.getProducts(activeAgency) || [];
    const isEdit = invoiceId !== null;
    let invoice = {
      invoiceNo: '',
      date: utils.today(),
      items: {}
    };

    if (isEdit) {
      const invoices = data.getReceivedInvoices(activeAgency, activeMonth);
      const found = invoices.find(inv => inv.id === invoiceId);
      if (found) {
        invoice = found;
      }
    }

    let productsHtml = '';
    products.forEach(p => {
      const qty = invoice.items[p] === undefined ? '' : invoice.items[p];
      productsHtml += `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05)">
          <span style="font-size:0.85rem;color:rgba(255,255,255,0.85);max-width:65%;word-break:break-all">${p}</span>
          <input type="number" class="form-input form-input-sm st-modal-qty" data-product="${p}" value="${qty}" placeholder="0" min="0" style="width:80px;text-align:center">
        </div>
      `;
    });

    const body = `
      <div style="display:flex;flex-direction:column;gap:12px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="form-group">
            <label class="form-label">Invoice Number</label>
            <input type="text" id="st-modal-no" class="form-input" value="${invoice.invoiceNo}" placeholder="e.g. INV-1025">
          </div>
          <div class="form-group">
            <label class="form-label">Date Received</label>
            <input type="date" id="st-modal-date" class="form-input" value="${invoice.date}">
          </div>
        </div>
        <h4 style="margin:8px 0 4px;font-size:0.85rem;text-transform:uppercase;color:var(--text-muted);letter-spacing:0.05em">Received Quantities</h4>
        <div style="max-height:300px;overflow-y:auto;padding-right:8px;display:flex;flex-direction:column;gap:0;">
          ${productsHtml}
        </div>
      </div>
    `;

    const footer = `
      <button class="btn btn-ghost btn-sm" onclick="AgencyHub.utils.closeModal()">Cancel</button>
      <button class="btn btn-primary btn-sm" id="st-modal-save-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:4px"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
        Save Invoice
      </button>
    `;

    utils.showModal(isEdit ? 'Edit Stock Invoice' : 'Add Stock Invoice', body, footer, {
      size: 'md',
      onInit: () => {
        document.getElementById('st-modal-save-btn').addEventListener('click', () => {
          const invoiceNo = document.getElementById('st-modal-no').value.trim();
          const date = document.getElementById('st-modal-date').value || utils.today();

          if (!invoiceNo) {
            utils.toast('Invoice number is required', 'warning');
            return;
          }

          const items = {};
          document.querySelectorAll('.st-modal-qty').forEach(input => {
            const p = input.getAttribute('data-product');
            const val = parseInt(input.value, 10) || 0;
            if (val > 0) {
              items[p] = val;
            }
          });

          const savedInv = {
            id: invoice.id,
            invoiceNo,
            date,
            agency: activeAgency,
            items
          };

          data.saveReceivedInvoice(savedInv);
          utils.toast(isEdit ? 'Invoice updated!' : 'Invoice added!', 'success');
          utils.closeModal();
          AgencyHub.navigate('stock');
        });
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Return Stock Modal
  // ---------------------------------------------------------------------------
  function showReturnStockModal(invoiceId = null) {
    const products = data.getProducts(activeAgency) || [];
    const isEdit = invoiceId !== null;
    let invoice = {
      invoiceNo: '',
      date: utils.today(),
      items: {}
    };

    if (isEdit) {
      const invoices = data.getReturnedStockInvoices(activeAgency, activeMonth);
      const found = invoices.find(inv => inv.id === invoiceId);
      if (found) {
        invoice = found;
      }
    }

    let productsHtml = '';
    products.forEach(p => {
      const qty = invoice.items[p] === undefined ? '' : invoice.items[p];
      productsHtml += `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05)">
          <span style="font-size:0.85rem;color:rgba(255,255,255,0.85);max-width:65%;word-break:break-all">${p}</span>
          <input type="number" class="form-input form-input-sm st-modal-return-qty" data-product="${p}" value="${qty}" placeholder="0" min="0" style="width:80px;text-align:center">
        </div>
      `;
    });

    const body = `
      <div style="display:flex;flex-direction:column;gap:12px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="form-group">
            <label class="form-label">Return Ref / Notes</label>
            <input type="text" id="st-modal-return-no" class="form-input" value="${invoice.invoiceNo}" placeholder="e.g. RET-Customer A / Market Return">
          </div>
          <div class="form-group">
            <label class="form-label">Date Returned</label>
            <input type="date" id="st-modal-return-date" class="form-input" value="${invoice.date}">
          </div>
        </div>
        <h4 style="margin:8px 0 4px;font-size:0.85rem;text-transform:uppercase;color:var(--text-muted);letter-spacing:0.05em">Returned Quantities</h4>
        <div style="max-height:300px;overflow-y:auto;padding-right:8px;display:flex;flex-direction:column;gap:0;">
          ${productsHtml}
        </div>
      </div>
    `;

    const footer = `
      <button class="btn btn-ghost btn-sm" onclick="AgencyHub.utils.closeModal()">Cancel</button>
      <button class="btn btn-primary btn-sm" id="st-modal-return-save-btn" style="background:#F59E0B;border-color:#F59E0B;color:#000;font-weight:700;">
        💾 Save Return Record
      </button>
    `;

    utils.showModal(isEdit ? 'Edit Return Stock Log' : 'Log Return Stock', body, footer, {
      size: 'md',
      onInit: () => {
        document.getElementById('st-modal-return-save-btn').addEventListener('click', () => {
          const invoiceNo = document.getElementById('st-modal-return-no').value.trim();
          const date = document.getElementById('st-modal-return-date').value || utils.today();

          if (!invoiceNo) {
            utils.toast('Return reference/note is required', 'warning');
            return;
          }

          const items = {};
          document.querySelectorAll('.st-modal-return-qty').forEach(input => {
            const p = input.getAttribute('data-product');
            const val = parseInt(input.value, 10) || 0;
            if (val > 0) {
              items[p] = val;
            }
          });

          const savedInv = {
            id: invoice.id,
            invoiceNo,
            date,
            agency: activeAgency,
            items
          };

          data.saveReturnedStockInvoice(savedInv);
          utils.toast(isEdit ? 'Return record updated!' : 'Return record logged!', 'success');
          utils.closeModal();
          AgencyHub.navigate('stock');
        });
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Initialize Module
  // ---------------------------------------------------------------------------
  function init() {
    const container = document.getElementById('stock-module-container');
    if (!container) return;

    // --- Tab Switching (Agency) ---
    utils.delegate(container, '[data-stock-agency]', 'click', function (e, target) {
      const agencyId = target.getAttribute('data-stock-agency');
      if (agencyId && agencyId !== activeAgency) {
        activeAgency = agencyId;
        AgencyHub.navigate('stock');
      }
    });

    // --- Month Selector Change ---
    const monthInput = document.getElementById('stock-month-input');
    if (monthInput) {
      monthInput.addEventListener('change', function () {
        activeMonth = monthInput.value;
        AgencyHub.navigate('stock');
      });
    }

    // --- Sub-tab navigation ---
    const subtabRegistry = document.getElementById('stock-subtab-registry');
    if (subtabRegistry) {
      subtabRegistry.addEventListener('click', () => {
        activeSubTab = 'registry';
        AgencyHub.navigate('stock');
      });
    }

    const subtabInvoices = document.getElementById('stock-subtab-invoices');
    if (subtabInvoices) {
      subtabInvoices.addEventListener('click', () => {
        activeSubTab = 'invoices';
        AgencyHub.navigate('stock');
      });
    }

    const subtabReturns = document.getElementById('stock-subtab-returns');
    if (subtabReturns) {
      subtabReturns.addEventListener('click', () => {
        activeSubTab = 'returns';
        AgencyHub.navigate('stock');
      });
    }

    // --- Dynamic inputs handler (Registry Tab) ---
    const handleInput = utils.debounce(() => {
      updateCalculations();
    }, 150);

    utils.delegate(container, '.st-opening, .st-physical', 'input', handleInput);

    // --- Auto-fill physical count shortcut (Registry Tab) ---
    const autofillBtn = document.getElementById('stock-autofill-btn');
    if (autofillBtn) {
      autofillBtn.addEventListener('click', function () {
        const rows = document.querySelectorAll('#stock-table-body tr:not(.row-total)');
        rows.forEach(row => {
          const expectedEl = row.querySelector('.st-expected-val');
          const physicalInput = row.querySelector('.st-physical');
          if (expectedEl && physicalInput) {
            physicalInput.value = expectedEl.textContent;
          }
        });
        updateCalculations();
        utils.toast('Physical counts auto-filled with expected stock!', 'info');
      });
    }

    // --- Save Stock Registry records (Registry Tab) ---
    const saveBtn = document.getElementById('stock-save-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        const rows = document.querySelectorAll('#stock-table-body tr:not(.row-total)');
        const inventoryData = {};

        rows.forEach(row => {
          const p = row.getAttribute('data-product-row');
          if (!p) return;

          const openingInput = row.querySelector('.st-opening');
          const physicalInput = row.querySelector('.st-physical');

          inventoryData[p] = {
            opening: openingInput.value === '' ? 0 : Number(openingInput.value),
            physical: physicalInput.value === '' ? '' : Number(physicalInput.value)
          };
        });

        data.saveInventory(activeAgency, activeMonth, inventoryData);
        utils.toast('Stock registry saved successfully!', 'success');
        AgencyHub.navigate('stock');
      });
    }

    // --- Add Stock Invoice button (Invoices Tab) ---
    const addInvBtn = document.getElementById('stock-add-inv-btn');
    if (addInvBtn) {
      addInvBtn.addEventListener('click', () => {
        if (!AgencyHub.isAdmin()) { AgencyHub.utils.toast('View-only access', 'warning'); return; }
        showInvoiceModal();
      });
    }

    // --- Edit Stock Invoice (Invoices Tab) ---
    utils.delegate(container, '.stock-edit-inv', 'click', function (e, target) {
      const invId = target.getAttribute('data-id');
      if (invId) {
        showInvoiceModal(invId);
      }
    });

    // --- Delete Stock Invoice (Invoices Tab) ---
    utils.delegate(container, '.stock-delete-inv', 'click', async function (e, target) {
      if (!AgencyHub.isAdmin()) { AgencyHub.utils.toast('View-only access — contact admin to delete', 'warning'); return; }
      const invId = target.getAttribute('data-id');
      if (!invId) return;

      const yes = await utils.confirm('Delete Stock Invoice', 'Are you sure you want to delete this invoice? Incoming quantities will be removed from your stock calculations.');
      if (yes) {
        data.deleteReceivedInvoice(invId);
        utils.toast('Invoice deleted', 'success');
        AgencyHub.navigate('stock');
      }
    });

    // --- Add Return Stock Log button (Returns Tab) ---
    const addReturnBtn = document.getElementById('stock-add-return-btn');
    if (addReturnBtn) {
      addReturnBtn.addEventListener('click', () => {
        showReturnStockModal();
      });
    }

    // --- Edit Return Stock Log (Returns Tab) ---
    utils.delegate(container, '.stock-edit-return-inv', 'click', function (e, target) {
      const invId = target.getAttribute('data-id');
      if (invId) {
        showReturnStockModal(invId);
      }
    });

    // --- Delete Return Stock Log (Returns Tab) ---
    utils.delegate(container, '.stock-delete-return-inv', 'click', async function (e, target) {
      if (!AgencyHub.isAdmin()) { AgencyHub.utils.toast('View-only access', 'warning'); return; }
      const invId = target.getAttribute('data-id');
      if (!invId) return;

      const yes = await utils.confirm('Delete Return Log', 'Are you sure you want to delete this return log? Returned quantities will be removed from stock calculations.');
      if (yes) {
        data.deleteReturnedStockInvoice(invId);
        utils.toast('Return record deleted', 'success');
        AgencyHub.navigate('stock');
      }
    });
  }

  // Register in AgencyHub
  AgencyHub.registerModule('stock', { render, init });
})();
