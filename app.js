/* ============================================
   AgencyHub — Core Application Engine
   Router, Data Layer, State, Utilities
   ============================================ */

const AgencyHub = (() => {
  'use strict';

  // ─── Agency Configuration ────────────────────────
  const AGENCIES = {
    bathipooja: {
      id: 'bathipooja',
      name: 'Bathipooja',
      fullName: 'Bakthi Herbal Lanka (Pvt) Ltd',
      color: '#10B981',
      icon: '🪔',
      badge: 'badge-bathipooja',
      address: '70/A, Mahalwarawa, Pannipitiya',
    },
    domie: {
      id: 'domie',
      name: 'Domie',
      fullName: 'Domie Toffees',
      color: '#F59E0B',
      icon: '🍬',
      badge: 'badge-domie',
      address: '',
    },
    kelani: {
      id: 'kelani',
      name: 'Kelani Cables',
      fullName: 'Kelani Cables (KCL Lighting)',
      color: '#3B82F6',
      icon: '🔌',
      badge: 'badge-kelani',
      address: '',
    },
  };

  // Non-enumerable alias for backward compatibility so Object.keys(AGENCIES) yields 3 agencies
  Object.defineProperty(AGENCIES, 'kalani', {
    get() { return AGENCIES.kelani; },
    enumerable: false,
    configurable: true
  });

  // ─── Default Product Lists ───────────────────────
  const DEFAULT_PRODUCTS = {
    bathipooja: [
      'SALMAL',
      'MALMAL',
      'JASMINE',
      'SUPER DX',
      'WATAKEIYA',
      'LAVENDRA',
      'PINK',
      'COOL CHAMPA',
      'CLASSIC',
      'SUPER HIT',
      'GREEN',
      'RED',
      'CLASSIC PRO',
      'SAMADI',
      'WICKS',
      'MOGRA',
      'DOOPA'
    ],
    domie: [
      'ECLIORS',
      'COCONUT BOTTLE',
      'MINTY CHOC. BOTTLE',
      'MINTY CHOC. BAG',
      'TAMARIND BOTTLE',
      'TAMARIND BAG',
      'BLUE BERRY BOTTLE',
      'MILK BOTTLE',
      'ACHCHARU BAG',
      'ACHCHARU BOTTLE',
      'PINEAPPLE BOTTLE',
      'PINEAPPLE BAG',
      'BETTER SCOTCH BOTTLE',
      'BETTER SCOTCH BAG',
      'ECLIORS 200',
      'GUAWA',
      'COOLO'
    ],
    kelani: [
      '1/1.13 BLU (FS) 100m',
      '1/1.13 BLU (FS) 50m',
      '1/1.13 BLU POWER PLUS 100m',
      '1/1.13 BLU POWER PLUS 50m',
      '1/1.13 BRN (FS) 100m',
      '1/1.13 BRN POWER PLUS 100m',
      '12*1200 CBS ROD WITH BRASS CLAMP',
      '16/0.20 2-C (0.50mm) BLK 100m',
      '16/0.20 2-C (0.50mm2) WHT SHT 100m',
      '16/0.20 PARALLEL TWIN WHT (100m)',
      '16/0.20 TWISTED TWIN 100m',
      '28/0.30 A/C BLK 100m(bob)',
      '28/0.30 A/C YLW 30m',
      '32/0.20 A/C BLK 30m',
      '32/0.20 A/C RED 30m',
      '32/0.20 A/C YLW 30m',
      '40W GLS B22',
      '60W GLS B23',
      '7/0.53 BLU POWER PLUS (100m)',
      '7/0.53 BRN POWER PLUS (100m)',
      '7/0.67 EARTH POWER PLUS (100m)',
      '7/0.67 FT POWER PLUS GH 100m',
      '7/1.04 FT POWER PLUS GH 50m',
      '9/0.30 A/C BLK 100m (bob)',
      '9/0.30 A/C BLK 30m',
      '9/0.30 A/C BLU 30m',
      '9/0.30 A/C BRN 30m',
      '9/0.30 A/C GRN 30m',
      '9/0.30 A/C PUR 30m',
      '9/0.30 A/C RED 30m',
      '9/0.30 A/C WHT 30m',
      '9/0.30 A/C YLW 30m',
      '9/0.30 A/C ONG 30m',
      '9/0.30 A/C GRY 30m',
      'ACL 13a PLUG TOP',
      'ACL MOUNTING BOX MODULAR',
      'KELANI FAN (B) WHT STR',
      'KELANI LED2 40w Hw DI B22',
      'LAMP HOLDER',
      'TAPE BLK',
      'TAPE BLU',
      'TAPE BRN',
      'TAPE GRN',
      'TAPE RED',
      'TAPE YLW',
      '100W GLS B22',
      '75W GLS B22',
      '7/0.53 FT POWER PLUS GH 100m',
      'IRON CABLE 50m',
      'IGNITION 30m',
      '32/0.20 A/C Grn 30m',
      '32/0.20 A/C Pur 30m',
      '32/0.20 A/C Gry 30m',
      '32/0.20 A/C Brn 30m',
      '7/0.20 I/O Wht 100m',
      '7/0.20 I/O Red 100m',
      '7/0.20 I/O Blk 100m',
      '7/0.20 I/O Ylw 100m',
      '1/1.13 BRN (FS) 50m',
      '16/0.20 3-C (0.50mm2) WHT SHT 100m',
      '9/0.30 A/C BLU 100m (bob)',
      '32/0.20 A/C BLU 30m',
      '32/0.20 A/C WHT 30m',
      '32/0.20 A/C ONG 30m',
      '16/0.20 3-C (0.50mm2) BLK SHT 100m',
      '1/1.13 BRN POWER PLUS 50m',
      '16/0.20 PARALLEL TWIN BLK (100m)',
      '9/0.30 A/C YLW 100m (bob)',
      '32/0.20 A/C RED 100M(BOB)',
      '32/0.20 A/C BLK 100M(BOB)',
      '7/0.67 EARTH POWER PLUS (50m)',
      '7/0.67 BRN POWER PLUS 100m',
      '7/0.67 BLU POWER PLUS 100m',
      '9/0.30 A/C PUR 100m (bob)',
      '32/0.20 A/C YLW 100m (bob)',
      '32/0.20 A/C BLU 100m (bob)',
      'TAPE GRY',
      '9/0.30 A/C RED 100m (bob)',
      '28/0.30 A/C RED 100m(bob)',
      '30/0.25 3-C(1.5mm2) BLK SHT 100m',
      'ENCLOSURE 12W',
      'ENCLOSURE 14W',
      'ENCLOSURE 16W',
      'LED 30W',
      'LED 12W',
      'LED 9W',
      'LED 15W',
      'LED 7W',
      'LED SUNK PANEL SQURE 2W',
      '7/1.04 FT POWER PLUS GH 100m',
      'LED 3W',
      'LED 18W'
    ]
  };
  Object.defineProperty(DEFAULT_PRODUCTS, 'kalani', {
    get() { return DEFAULT_PRODUCTS.kelani; },
    enumerable: false,
    configurable: true
  });

  // ─── Audit Checklist Template ────────────────────
  const AUDIT_ITEMS = [
    { id: 1, label: 'Credit bills entered to Excel match actual bills', category: 'Financial' },
    { id: 2, label: 'Overdue bills identified — remind staff to collect today', category: 'Collections' },
    { id: 3, label: 'Cash in hand matches recorded amount', category: 'Cash Verification' },
    { id: 4, label: 'Cheques in hand — verify physical vs recorded', category: 'Cash Verification' },
    { id: 5, label: 'Bank deposit slips — were deposits made on time?', category: 'Banking' },
    { id: 6, label: "Today's sales entries completed for all agencies", category: 'Data Entry' },
    { id: 7, label: 'Stock count — physical stock vs recorded (spot check)', category: 'Inventory' },
    { id: 8, label: 'Returned / damaged goods — properly recorded?', category: 'Inventory' },
    { id: 9, label: 'Customer complaints — any pending issues?', category: 'Customer Service' },
    { id: 10, label: 'Delivery schedule — are deliveries on track?', category: 'Operations' },
    { id: 11, label: 'Expense receipts — all petty cash expenses have receipts', category: 'Expenses' },
    { id: 12, label: 'Employee attendance — both staff present?', category: 'HR' },
    { id: 13, label: 'Pending orders — any unprocessed orders?', category: 'Orders' },
    { id: 14, label: 'Daily sales targets vs actual performance', category: 'Performance' },
    { id: 15, label: 'Office cleanliness and organization', category: 'General' },
  ];

  // ─── Page Configuration ──────────────────────────
  const PAGES = {
    dashboard: { title: 'Dashboard', subtitle: 'Overview of all agencies', module: 'dashboard' },
    executive: { title: 'Executive P&L & Banking', subtitle: 'Admin Profit & Loss Statement & Cheque Control', module: 'executive' },
    sales:     { title: 'Sales Entry', subtitle: 'Record daily sales', module: 'salesEntry' },
    credit:    { title: 'Credit Bills', subtitle: 'Track outstanding payments', module: 'creditBills' },
    cheques:   { title: 'Cheque Management', subtitle: 'Track day & credit cheques', module: 'cheques' },
    stock:     { title: 'Stock Management', subtitle: 'Track opening, received, sold & closing stock', module: 'stock' },
    reports:   { title: 'Reports', subtitle: 'Sales & financial analysis', module: 'reports' },
    audit:     { title: 'Office Audit', subtitle: 'Evaluate office operations', module: 'audit' },
    payroll:   { title: 'Attendance & Payroll', subtitle: 'Manage attendance, advances & salaries', module: 'payroll' },
    fuel:      { title: 'Fuel & Mileage', subtitle: 'Track fuel efficiency & mileage', module: 'fuel' },
    worksheets:{ title: 'Sale Worksheet Forms', subtitle: 'Printable Daily Sales Statement worksheets & statement formats', module: 'worksheets' },
    settings:  { title: 'Settings', subtitle: 'Configuration & data management', module: 'dataManager' },
  };

  // ─── State ───────────────────────────────────────
  const state = {
    currentPage: 'dashboard',
    currentAgency: 'all',
    sidebarOpen: false,
  };

  // ─── Registered Modules ──────────────────────────
  const modules = {};

  // ============================================
  //  DATA LAYER (localStorage)
  // ============================================
  const data = {
    _key(name) {
      return `agencyhub_${name}`;
    },

    _get(name) {
      try {
        const raw = localStorage.getItem(this._key(name));
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        console.error('Data read error:', name, e);
        return null;
      }
    },

    _set(name, value) {
      try {
        // Save locally for offline access
        localStorage.setItem(this._key(name), JSON.stringify(value));
        // Push collection to Firestore
        if (window.FirebaseDB) {
          window.FirebaseDB.setCollection(name, value)
            .then(() => console.log(`✅ Firestore ${name} synced`))
            .catch(err => console.error(`⚠️ Firestore sync error for ${name}:`, err));
        }
      } catch (e) {
        console.error('Data write error:', name, e);
        utils.toast('Storage error — data may not be saved', 'error');
      }
    },

    // --- Sales Entries ---
    getSalesEntries(agency = null, startDate = null, endDate = null) {
      const all = this._get('sales') || [];
      return all.filter(e => {
        if (agency && agency !== 'all') {
          if (agency === 'kelani' || agency === 'kalani') {
            if (e.agency !== 'kelani' && e.agency !== 'kalani') return false;
          } else if (e.agency !== agency) {
            return false;
          }
        }
        if (startDate && e.date < startDate) return false;
        if (endDate && e.date > endDate) return false;
        return true;
      }).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    },

    saveSalesEntry(entry) {
      const all = this._get('sales') || [];
      const idx = all.findIndex(e => e.id === entry.id);
      if (idx >= 0) {
        all[idx] = entry;
      } else {
        entry.id = entry.id || utils.generateId();
        entry.createdAt = new Date().toISOString();
        all.push(entry);
      }
      entry.updatedAt = new Date().toISOString();
      this._set('sales', all);
      return entry;
    },

    deleteSalesEntry(id) {
      const all = this._get('sales') || [];
      this._set('sales', all.filter(e => e.id !== id));
    },

    getLastSalesEntry(agency) {
      const entries = this.getSalesEntries(agency);
      return entries.length > 0 ? entries[0] : null;
    },

    // --- Credit Bills ---
    getCreditBills(filters = {}) {
      let all = this._get('creditBills') || [];
      if (filters.agency && filters.agency !== 'all') {
        if (filters.agency === 'kelani' || filters.agency === 'kalani') {
          all = all.filter(b => b.agency === 'kelani' || b.agency === 'kalani');
        } else {
          all = all.filter(b => b.agency === filters.agency);
        }
      }
      if (filters.status) {
        all = all.filter(b => b.status === filters.status);
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        all = all.filter(b => (b.customerName || '').toLowerCase().includes(q));
      }
      if (filters.overdue) {
        const today = utils.today();
        all = all.filter(b => b.dueDate < today && b.status !== 'collected');
      }
      if (filters.dueToday) {
        const today = utils.today();
        all = all.filter(b => b.dueDate === today && b.status !== 'collected');
      }
      return all.sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
    },

    saveCreditBill(bill) {
      const all = this._get('creditBills') || [];
      const idx = all.findIndex(b => b.id === bill.id);
      if (idx >= 0) {
        all[idx] = bill;
      } else {
        bill.id = bill.id || utils.generateId();
        bill.payments = bill.payments || [];
        bill.status = bill.status || 'pending';
        bill.createdAt = new Date().toISOString();
        all.push(bill);
      }
      bill.updatedAt = new Date().toISOString();
      this._set('creditBills', all);
      return bill;
    },

    deleteCreditBill(id) {
      const all = this._get('creditBills') || [];
      this._set('creditBills', all.filter(b => b.id !== id));
    },

    addPayment(billId, payment) {
      const all = this._get('creditBills') || [];
      const bill = all.find(b => b.id === billId);
      if (!bill) return null;
      payment.id = utils.generateId();
      payment.date = payment.date || utils.today();
      bill.payments.push(payment);
      const totalPaid = bill.payments.reduce((s, p) => s + (p.amount || 0), 0);
      if (totalPaid >= bill.amount) {
        bill.status = 'collected';
      } else if (totalPaid > 0) {
        bill.status = 'partial';
      }
      bill.paidAmount = totalPaid;
      bill.updatedAt = new Date().toISOString();
      this._set('creditBills', all);
      return bill;
    },

    // --- Cheques ---
    getCheques(filters = {}) {
      let all = this._get('cheques') || [];
      if (filters.agency && filters.agency !== 'all') {
        all = all.filter(c => c.agency === filters.agency);
      }
      if (filters.type && filters.type !== 'all') {
        all = all.filter(c => c.type === filters.type);
      }
      if (filters.status && filters.status !== 'all') {
        all = all.filter(c => c.status === filters.status);
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        all = all.filter(c => 
          (c.chequeNo && c.chequeNo.toLowerCase().includes(q)) ||
          (c.customerName && c.customerName.toLowerCase().includes(q)) ||
          (c.bank && c.bank.toLowerCase().includes(q))
        );
      }
      return all.sort((a, b) => (b.chequeDate || '').localeCompare(a.chequeDate || ''));
    },

    saveCheque(cheque) {
      const all = this._get('cheques') || [];
      
      // Assign id if new
      if (!cheque.id) {
        cheque.id = utils.generateId();
      }

      // Clean up any existing payment with this chequeId from all credit bills first
      const bills = this._get('creditBills') || [];
      let billChanged = false;
      bills.forEach(b => {
        const origLen = b.payments.length;
        b.payments = b.payments.filter(p => p.chequeId !== cheque.id);
        if (b.payments.length !== origLen) {
          // Recalculate bill status and paidAmount
          const totalPaid = b.payments.reduce((s, p) => s + (p.amount || 0), 0);
          if (totalPaid >= b.amount) {
            b.status = 'collected';
          } else if (totalPaid > 0) {
            b.status = 'partial';
          } else {
            b.status = 'pending';
          }
          b.paidAmount = totalPaid;
          b.updatedAt = new Date().toISOString();
          billChanged = true;
        }
      });

      // If credit cheque is linked to a credit bill and status is not bounced, add the payment
      if (cheque.type === 'credit' && cheque.billId && cheque.status !== 'bounced') {
        const bill = bills.find(b => b.id === cheque.billId);
        if (bill) {
          cheque.customerName = bill.customerName; // Sync customer name with credit bill
          
          const payment = {
            id: utils.generateId(),
            amount: cheque.amount,
            date: cheque.entryDate || utils.today(),
            note: `Cheque #${cheque.chequeNo} [${cheque.status.toUpperCase()}]`,
            chequeId: cheque.id
          };
          
          bill.payments.push(payment);
          
          // Recalculate status and paidAmount
          const totalPaid = bill.payments.reduce((s, p) => s + (p.amount || 0), 0);
          if (totalPaid >= bill.amount) {
            bill.status = 'collected';
          } else if (totalPaid > 0) {
            bill.status = 'partial';
          } else {
            bill.status = 'pending';
          }
          bill.paidAmount = totalPaid;
          bill.updatedAt = new Date().toISOString();
          billChanged = true;
        }
      }

      if (billChanged) {
        this._set('creditBills', bills);
      }

      const idx = all.findIndex(c => c.id === cheque.id);
      if (idx >= 0) {
        all[idx] = cheque;
      } else {
        cheque.createdAt = new Date().toISOString();
        all.push(cheque);
      }
      cheque.updatedAt = new Date().toISOString();
      this._set('cheques', all);
      return cheque;
    },

    deleteCheque(id) {
      const all = this._get('cheques') || [];
      const cheque = all.find(c => c.id === id);
      
      // Reverse payment on linked credit bill
      if (cheque && cheque.type === 'credit' && cheque.billId) {
        const bills = this._get('creditBills') || [];
        let billChanged = false;
        const bill = bills.find(b => b.id === cheque.billId);
        if (bill) {
          bill.payments = bill.payments.filter(p => p.chequeId !== id);
          const totalPaid = bill.payments.reduce((s, p) => s + (p.amount || 0), 0);
          if (totalPaid >= bill.amount) {
            bill.status = 'collected';
          } else if (totalPaid > 0) {
            bill.status = 'partial';
          } else {
            bill.status = 'pending';
          }
          bill.paidAmount = totalPaid;
          bill.updatedAt = new Date().toISOString();
          billChanged = true;
        }
        if (billChanged) {
          this._set('creditBills', bills);
        }
      }

      this._set('cheques', all.filter(c => c.id !== id));
    },

    // --- Attendance & Payroll ---
    getAttendance(date) {
      const all = this._get('attendance') || {};
      return all[date] || {}; // Returns map of { employeeName: 'present' | 'absent' | 'half' }
    },

    saveAttendance(date, attendanceMap) {
      const all = this._get('attendance') || {};
      all[date] = attendanceMap;
      this._set('attendance', all);
      return attendanceMap;
    },

    getAdvances(filters = {}) {
      let all = this._get('advances') || [];
      if (filters.employee && filters.employee !== 'all') {
        all = all.filter(a => a.employee === filters.employee);
      }
      if (filters.month) { // Format: 'YYYY-MM'
        all = all.filter(a => a.date && a.date.startsWith(filters.month));
      }
      return all.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    },

    saveAdvance(advance) {
      const all = this._get('advances') || [];
      if (!advance.id) {
        advance.id = utils.generateId();
        advance.createdAt = new Date().toISOString();
      }
      advance.updatedAt = new Date().toISOString();
      
      const idx = all.findIndex(a => a.id === advance.id);
      if (idx >= 0) {
        all[idx] = advance;
      } else {
        all.push(advance);
      }
      this._set('advances', all);
      return advance;
    },

    deleteAdvance(id) {
      const all = this._get('advances') || [];
      this._set('advances', all.filter(a => a.id !== id));
    },

    getEmployeeRates() {
      // Default configurations
      const defaultRates = {
        'Sanki': { type: 'daily', rate: 2400, epfEligible: true, basicSalary: 30000, vehicleRate: 0, tempDriverRate: 0, loanDeduction: 0 },
        'Jayarathna': { type: 'daily', rate: 2000, epfEligible: true, basicSalary: 30000, vehicleRate: 0, tempDriverRate: 1800, loanDeduction: 0 },
        'Wimal': { type: 'daily', rate: 2000, epfEligible: false, basicSalary: 0, vehicleRate: 2500, tempDriverRate: 1800, loanDeduction: 0 },
        'Bandu Thilaka': { type: 'daily', rate: 2000, epfEligible: false, basicSalary: 0, vehicleRate: 2500, tempDriverRate: 1800, loanDeduction: 0 },
        'Achini Isnaka': { type: 'daily', rate: 2000, epfEligible: true, basicSalary: 30000, vehicleRate: 0, tempDriverRate: 0, loanDeduction: 0 }
      };
      return this._get('employeeRates') || defaultRates;
    },

    saveEmployeeRates(rates) {
      this._set('employeeRates', rates);
    },

    // --- Fuel & Mileage ---
    getFuelLogs(filters = {}) {
      let all = this._get('fuelLogs') || [];
      if (filters.month) {
        all = all.filter(l => l.date && l.date.startsWith(filters.month));
      }
      if (filters.vehicle) {
        all = all.filter(l => l.vehicle === filters.vehicle);
      }
      return all.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    },

    saveFuelLog(log) {
      const all = this._get('fuelLogs') || [];
      if (!log.id) {
        log.id = 'fuel_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        all.push(log);
      } else {
        const idx = all.findIndex(l => l.id === log.id);
        if (idx !== -1) all[idx] = log;
        else all.push(log);
      }
      this._set('fuelLogs', all);
      return log;
    },

    deleteFuelLog(id) {
      const all = this._get('fuelLogs') || [];
      this._set('fuelLogs', all.filter(l => l.id !== id));
    },

    getOdometerReadings(month) {
      const all = this._get('odometers') || {};
      return all[month] || {};
    },

    saveOdometerReading(month, readings) {
      const all = this._get('odometers') || {};
      all[month] = readings;
      this._set('odometers', all);
    },

    // --- Audits ---
    getAudits(startDate = null, endDate = null) {
      const all = this._get('audits') || [];
      return all.filter(a => {
        if (startDate && a.date < startDate) return false;
        if (endDate && a.date > endDate) return false;
        return true;
      }).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    },

    saveAudit(audit) {
      const all = this._get('audits') || [];
      const idx = all.findIndex(a => a.id === audit.id);
      if (idx >= 0) {
        all[idx] = audit;
      } else {
        audit.id = audit.id || utils.generateId();
        audit.createdAt = new Date().toISOString();
        all.push(audit);
      }
      audit.updatedAt = new Date().toISOString();
      this._set('audits', all);
      return audit;
    },

    deleteAudit(id) {
      const all = this._get('audits') || [];
      this._set('audits', all.filter(a => a.id !== id));
    },

    // --- Products (configurable) ---
    getProducts(agency) {
      const custom = this._get('products');
      if (custom && custom[agency]) return custom[agency];
      return DEFAULT_PRODUCTS[agency] || [];
    },

    saveProducts(agency, products) {
      const all = this._get('products') || {};
      all[agency] = products;
      this._set('products', all);
    },

    // --- Inventory / Stock ---
    getInventory(agency, month) {
      const all = this._get('inventory') || {};
      if (!all[agency]) all[agency] = {};
      if (!all[agency][month]) all[agency][month] = {};
      return all[agency][month];
    },

    saveInventory(agency, month, inventoryData) {
      const all = this._get('inventory') || {};
      if (!all[agency]) all[agency] = {};
      all[agency][month] = inventoryData;
      this._set('inventory', all);
    },

    // --- Received Invoices (Stock In) ---
    getReceivedInvoices(agency = null, month = null) {
      const all = this._get('receivedInvoices') || [];
      return all.filter(inv => {
        if (agency && inv.agency !== agency) return false;
        if (month && (!inv.date || !inv.date.startsWith(month))) return false;
        return true;
      }).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    },

    saveReceivedInvoice(invoice) {
      const all = this._get('receivedInvoices') || [];
      const idx = all.findIndex(inv => inv.id === invoice.id);
      if (idx >= 0) {
        all[idx] = invoice;
      } else {
        invoice.id = invoice.id || utils.generateId();
        invoice.createdAt = new Date().toISOString();
        all.push(invoice);
      }
      invoice.updatedAt = new Date().toISOString();
      this._set('receivedInvoices', all);
      return invoice;
    },

    deleteReceivedInvoice(id) {
      const all = this._get('receivedInvoices') || [];
      this._set('receivedInvoices', all.filter(inv => inv.id !== id));
    },

    // --- Returned Stock Invoices ---
    getReturnedStockInvoices(agency = null, month = null) {
      const all = this._get('returnedStockInvoices') || [];
      return all.filter(inv => {
        if (agency && inv.agency !== agency) return false;
        if (month && (!inv.date || !inv.date.startsWith(month))) return false;
        return true;
      }).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    },

    saveReturnedStockInvoice(invoice) {
      const all = this._get('returnedStockInvoices') || [];
      const idx = all.findIndex(inv => inv.id === invoice.id);
      if (idx >= 0) {
        all[idx] = invoice;
      } else {
        invoice.id = invoice.id || utils.generateId();
        invoice.createdAt = new Date().toISOString();
        all.push(invoice);
      }
      invoice.updatedAt = new Date().toISOString();
      this._set('returnedStockInvoices', all);
      return invoice;
    },

    deleteReturnedStockInvoice(id) {
      const all = this._get('returnedStockInvoices') || [];
      this._set('returnedStockInvoices', all.filter(inv => inv.id !== id));
    },


    // --- Settings ---
    getSettings() {
      return this._get('settings') || {
        creditPeriodDays: 14,
        currency: 'Rs.',
        companyName: 'D & G Agro Lanka',
      };
    },

    saveSettings(settings) {
      this._set('settings', settings);
    },

    // --- Export / Import ---
    exportAll() {
      const exported = {
        version: 1,
        exportedAt: new Date().toISOString(),
        sales: this._get('sales') || [],
        creditBills: this._get('creditBills') || [],
        audits: this._get('audits') || [],
        products: this._get('products') || {},
        settings: this.getSettings(),
        inventory: this._get('inventory') || {},
        receivedInvoices: this._get('receivedInvoices') || [],
        cheques: this._get('cheques') || [],
        attendance: this._get('attendance') || {},
        advances: this._get('advances') || [],
        employeeRates: this._get('employeeRates') || {},
        fuelLogs: this._get('fuelLogs') || [],
        odometers: this._get('odometers') || {},
      };
      const blob = new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agencyhub-backup-${utils.today()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      utils.toast('Backup exported successfully', 'success');
    },

    importAll(jsonString) {
      try {
        const imported = JSON.parse(jsonString);
        if (!imported.version) throw new Error('Invalid backup file');
        if (imported.sales) this._set('sales', imported.sales);
        if (imported.creditBills) this._set('creditBills', imported.creditBills);
        if (imported.audits) this._set('audits', imported.audits);
        if (imported.products) this._set('products', imported.products);
        if (imported.settings) this._set('settings', imported.settings);
        if (imported.inventory) this._set('inventory', imported.inventory);
        if (imported.receivedInvoices) this._set('receivedInvoices', imported.receivedInvoices);
        if (imported.cheques) this._set('cheques', imported.cheques);
        if (imported.attendance) this._set('attendance', imported.attendance);
        if (imported.advances) this._set('advances', imported.advances);
        if (imported.employeeRates) this._set('employeeRates', imported.employeeRates);
        if (imported.fuelLogs) this._set('fuelLogs', imported.fuelLogs);
        if (imported.odometers) this._set('odometers', imported.odometers);
        utils.toast('Data imported successfully! Refreshing...', 'success');
        setTimeout(() => navigate(state.currentPage), 500);
        return true;
      } catch (e) {
        console.error('Import error:', e);
        utils.toast('Invalid backup file', 'error');
        return false;
      }
    },

    clearAll() {
      const keys = ['sales', 'creditBills', 'audits', 'products', 'settings', 'inventory', 'receivedInvoices', 'cheques', 'attendance', 'advances', 'employeeRates', 'fuelLogs', 'odometers'];
      keys.forEach(k => localStorage.removeItem(this._key(k)));
    },

    async pushToCloud() {
      return await syncAllToFirestore();
    },
  };

  // ============================================
  //  UTILITIES
  // ============================================

  // ----- Firebase Initialization -----
  // Configuration generated from the Firebase console
  // ----- Sync Firestore & LocalStorage -----
  async function syncFromFirestore() {
    if (!window.FirebaseDB) return;
    try {
      const collections = ['sales', 'creditBills', 'audits', 'products', 'settings', 'inventory', 'receivedInvoices', 'cheques', 'attendance', 'advances', 'employeeRates', 'fuelLogs', 'odometers'];
      for (const col of collections) {
        const localRaw = localStorage.getItem(`agencyhub_${col}`);
        let localData = null;
        if (localRaw) {
          try { localData = JSON.parse(localRaw); } catch (e) {}
        }

        const fetchedData = await window.FirebaseDB.getCollection(col);
        const cloudData = fetchedData ? fetchedData.items : null;

        const localHasItems = Array.isArray(localData) ? localData.length > 0 : (localData && Object.keys(localData).length > 0);
        const cloudHasItems = Array.isArray(cloudData) ? cloudData.length > 0 : (cloudData && Object.keys(cloudData).length > 0);

        if (localHasItems && !cloudHasItems) {
          await window.FirebaseDB.setCollection(col, localData);
          console.log(`☁️ Auto-pushed local ${col} (${Array.isArray(localData) ? localData.length : Object.keys(localData).length} items) to Cloud`);
        } else if (cloudHasItems) {
          localStorage.setItem(`agencyhub_${col}`, JSON.stringify(cloudData));
        } else {
          let val = localData;
          if (val === null || val === undefined) {
            if (col === 'products') val = { bathipooja: DEFAULT_PRODUCTS.bathipooja, domie: DEFAULT_PRODUCTS.domie, kelani: DEFAULT_PRODUCTS.kelani };
            else if (col === 'settings') val = { companyName: 'D & G SFA', creditPeriodDays: 14, currency: 'Rs.' };
            else if (['inventory', 'attendance', 'advances', 'employeeRates', 'odometers'].includes(col)) val = {};
            else val = [];
          }
          await window.FirebaseDB.setCollection(col, val);
        }
      }
      console.log('✅ Synced Firestore data with local storage');
    } catch (e) {
      console.error('⚠️ Firestore sync error:', e);
    }
  }

  async function syncAllToFirestore() {
    if (!window.FirebaseDB) return 0;
    const collections = ['sales', 'creditBills', 'audits', 'products', 'settings', 'inventory', 'receivedInvoices', 'cheques', 'attendance', 'advances', 'employeeRates', 'fuelLogs', 'odometers'];
    let count = 0;
    for (const col of collections) {
      const raw = localStorage.getItem(`agencyhub_${col}`);
      let val;
      if (raw) {
        try { val = JSON.parse(raw); } catch (e) { val = null; }
      }
      if (val === null || val === undefined) {
        if (col === 'products') val = { bathipooja: DEFAULT_PRODUCTS.bathipooja, domie: DEFAULT_PRODUCTS.domie, kelani: DEFAULT_PRODUCTS.kelani };
        else if (col === 'settings') val = { companyName: 'D & G SFA', creditPeriodDays: 14, currency: 'Rs.' };
        else if (['inventory', 'attendance', 'advances', 'employeeRates', 'odometers'].includes(col)) val = {};
        else val = [];
      }
      await window.FirebaseDB.setCollection(col, val);
      count++;
    }
    console.log(`✅ Force uploaded ${count} collections to Firestore`);
    return count;
  }

  // Call sync on app start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      syncFromFirestore().then(() => console.log('Firestore data loaded'));
    });
  } else {
    syncFromFirestore().then(() => console.log('Firestore data loaded'));
  }
  const utils = {
    generateId() {
      return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    },

    today() {
      return new Date().toISOString().split('T')[0];
    },

    formatDate(dateStr) {
      if (!dateStr) return '—';
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    },

    formatDateTime(isoStr) {
      if (!isoStr) return '—';
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
        ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    },

    formatCurrency(amount) {
      const settings = data.getSettings();
      const num = Number(amount) || 0;
      return `${settings.currency} ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    },

    formatNumber(num) {
      return (Number(num) || 0).toLocaleString('en-US');
    },

    daysBetween(date1, date2) {
      const d1 = new Date(date1 + 'T00:00:00');
      const d2 = new Date(date2 + 'T00:00:00');
      return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
    },

    daysUntilDue(dueDate) {
      return this.daysBetween(this.today(), dueDate);
    },

    getMonthRange(dateStr) {
      const d = new Date(dateStr + 'T00:00:00');
      const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
      return { start, end };
    },

    getAgencyInfo(agencyId) {
      return AGENCIES[agencyId] || { name: agencyId, color: '#888', icon: '📦' };
    },

    exportToCSV(filename, headers, rows) {
      if (!rows || !rows.length) {
        this.toast('No data available to export', 'error');
        return;
      }
      let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';
      csvContent += headers.map(h => `"${(h || '').toString().replace(/"/g, '""')}"`).join(',') + '\r\n';
      rows.forEach(row => {
        const line = row.map(val => `"${(val === null || val === undefined ? '' : val).toString().replace(/"/g, '""')}"`).join(',');
        csvContent += line + '\r\n';
      });
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      this.toast(`Exported ${rows.length} rows to ${filename}.csv`, 'success');
    },

    // Toast notification
    toast(message, type = 'info') {
      const container = document.getElementById('toast-container');
      if (!container) return;
      const icons = { success: '✅', warning: '⚠️', error: '❌', info: 'ℹ️' };
      const toast = document.createElement('div');
      toast.className = `toast ${type}`;
      toast.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span><span>${message}</span>`;
      container.appendChild(toast);
      setTimeout(() => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
      }, 3500);
    },

    // Modal
    showModal(title, bodyHtml, footerHtml = '', options = {}) {
      const overlay = document.getElementById('modal-overlay');
      document.getElementById('modal-title').textContent = title;
      document.getElementById('modal-body').innerHTML = bodyHtml;
      document.getElementById('modal-footer').innerHTML = footerHtml;
      const modal = document.getElementById('modal');
      modal.className = `modal ${options.size ? `modal-${options.size}` : ''}`;
      overlay.classList.remove('hidden');
      if (options.onInit) setTimeout(() => options.onInit(), 50);
    },

    closeModal() {
      document.getElementById('modal-overlay').classList.add('hidden');
    },

    // Confirm dialog
    confirm(title, message) {
      return new Promise((resolve) => {
        const overlay = document.getElementById('confirm-overlay');
        document.getElementById('confirm-title').textContent = title;
        document.getElementById('confirm-body').innerHTML = `<p>${message}</p>`;
        overlay.classList.remove('hidden');
        const ok = document.getElementById('confirm-ok');
        const cancel = document.getElementById('confirm-cancel');
        const cleanup = () => {
          overlay.classList.add('hidden');
          ok.replaceWith(ok.cloneNode(true));
          cancel.replaceWith(cancel.cloneNode(true));
        };
        ok.addEventListener('click', () => { cleanup(); resolve(true); }, { once: true });
        cancel.addEventListener('click', () => { cleanup(); resolve(false); }, { once: true });
      });
    },

    // Delegate event helper
    delegate(container, selector, event, handler) {
      container.addEventListener(event, (e) => {
        const target = e.target.closest(selector);
        if (target && container.contains(target)) {
          handler(e, target);
        }
      });
    },

    // Debounce
    debounce(fn, delay = 300) {
      let timer;
      return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
      };
    },

    // Escape HTML helper
    escapeHtml(str) {
      if (str == null) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    },

    // Get first day of month
    firstDayOfMonth() {
      const d = new Date();
      return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
    },

    // Send Instant Real Email via Resend API directly to dgsfa.admin@gmail.com
    async sendInstantEmail({ to, subject, bodyMessage, reportType }) {
      const recipient = to || 'dgsfa.admin@gmail.com';
      const apiKey = process.env.RESEND_API_KEY || 'YOUR_RESEND_API_KEY';
      const htmlBody = `
        <div style="font-family: Arial, Helvetica, sans-serif; max-width: 680px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff; color: #0f172a;">
          <div style="text-align: center; border-bottom: 3px solid #6366f1; padding-bottom: 16px; margin-bottom: 20px;">
            <h1 style="color: #4f46e5; margin: 0; font-size: 22px; font-weight: 800;">D & G SFA — ${reportType || 'Monthly Executive Report'}</h1>
            <p style="margin: 6px 0 0 0; color: #64748b; font-size: 13px; font-weight: 600;">Recipient: <strong>${recipient}</strong> | Date: ${new Date().toLocaleDateString()}</p>
          </div>
          
          <pre style="background: #f8fafc; padding: 18px; border-radius: 8px; border: 1px solid #cbd5e1; font-family: 'Courier New', Courier, monospace; font-size: 13px; line-height: 1.6; white-space: pre-wrap; color: #0f172a;">${bodyMessage}</pre>

          <div style="margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 14px; text-align: center; font-size: 12px; color: #94a3b8;">
            Dispatched via Resend API by D & G SFA Sales Automation System.
          </div>
        </div>
      `;

      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'onboarding@resend.dev',
            to: [recipient],
            subject: subject || `[D&G SFA] ${reportType || 'Monthly Summary Report'}`,
            text: bodyMessage,
            html: htmlBody
          })
        });

        const resData = await response.json();
        console.log('✅ Resend API Response:', resData);
        return { success: true, resendId: resData.id };
      } catch (err) {
        console.error('Resend API Dispatch Error:', err);
        try {
          await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to: recipient, subject, message: bodyMessage, reportType })
          });
        } catch (e) {}
        return { success: true };
      }
    },
  };

  // ============================================
  //  NAVIGATION / ROUTER
  // ============================================
  function navigate(page) {
    if (!PAGES[page]) page = 'dashboard';
    state.currentPage = page;

    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.toggle('active', link.dataset.page === page);
    });

    // Update page title
    const pageInfo = PAGES[page];
    document.querySelector('#page-title h1').textContent = pageInfo.title;
    document.querySelector('.page-subtitle').textContent = pageInfo.subtitle;

    // Close sidebar on mobile
    closeSidebar();

    // Render module
    const moduleName = pageInfo.module;
    const content = document.getElementById('content');
    
    if (modules[moduleName]) {
      content.innerHTML = '<div class="anim-fade">' + modules[moduleName].render(state) + '</div>';
      if (modules[moduleName].init) {
        modules[moduleName].init(state);
      }
    } else {
      content.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🚧</div>
          <h3>Module Loading...</h3>
          <p>The ${pageInfo.title} module is being loaded. Please wait.</p>
        </div>
      `;
    }

    // Update URL hash
    window.location.hash = page;
  }

  function setAgency(agency) {
    state.currentAgency = agency;
    document.querySelectorAll('.agency-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.agency === agency);
    });
    // Re-render current page
    navigate(state.currentPage);
  }

  // ============================================
  //  SIDEBAR
  // ============================================
  function toggleSidebar() {
    state.sidebarOpen = !state.sidebarOpen;
    document.getElementById('sidebar').classList.toggle('open', state.sidebarOpen);
    let backdrop = document.querySelector('.sidebar-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'sidebar-backdrop';
      backdrop.addEventListener('click', closeSidebar);
      document.getElementById('app').appendChild(backdrop);
    }
    backdrop.classList.toggle('active', state.sidebarOpen);
  }

  function closeSidebar() {
    state.sidebarOpen = false;
    document.getElementById('sidebar').classList.remove('open');
    const backdrop = document.querySelector('.sidebar-backdrop');
    if (backdrop) backdrop.classList.remove('active');
  }

  // ============================================
  //  CLOCK
  // ============================================
  function updateClock() {
    const el = document.getElementById('sidebar-clock');
    if (el) {
      const now = new Date();
      el.textContent = now.toLocaleDateString('en-GB', {
        weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
      }) + '  •  ' + now.toLocaleTimeString('en-GB', {
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
    }
  }

  // ============================================
  //  MODULE REGISTRATION
  // ============================================
  function registerModule(name, module) {
    modules[name] = module;
  }

  // ============================================
  //  LOGIN SYSTEM (Credential Monad Validation Flow)
  // ============================================
  class CredentialMonad {
    constructor(value, error = null) {
      this.value = value;
      this.error = error;
    }

    static of(value) {
      return new CredentialMonad(value);
    }

    static fail(error) {
      return new CredentialMonad(null, error);
    }

    chain(fn) {
      if (this.error) return this;
      return fn(this.value);
    }

    map(fn) {
      if (this.error) return this;
      return new CredentialMonad(fn(this.value));
    }

    isSuccess() {
      return !this.error;
    }
  }

  // ─── Role Helpers ─────────────────────────────
  function applyRole(role) {
    document.body.classList.remove('role-admin', 'role-user');
    const badge = document.getElementById('role-badge');
    if (role === 'admin') {
      document.body.classList.add('role-admin');
      if (badge) { badge.textContent = '🛡️ Admin'; badge.className = 'role-badge role-admin-badge'; }
    } else if (role === 'user') {
      document.body.classList.add('role-user');
      if (badge) { badge.textContent = '👤 Viewer'; badge.className = 'role-badge role-user-badge'; }
    } else {
      if (badge) { badge.textContent = ''; badge.className = 'role-badge'; }
    }
  }

  function isAdmin() {
    return sessionStorage.getItem('agencyhub_role') === 'admin';
  }

  function initLogin() {
    const loginOverlay = document.getElementById('login-overlay');
    const loginSubmit = document.getElementById('login-submit');
    const usernameInput = document.getElementById('login-username');
    const passwordInput = document.getElementById('login-password');
    const togglePwBtn = document.getElementById('login-toggle-pw');
    const errorMsg = document.getElementById('login-error');

    const eyeIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
    const eyeOffIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';

    if (togglePwBtn && passwordInput) {
      togglePwBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const isPw = passwordInput.type === 'password';
        passwordInput.type = isPw ? 'text' : 'password';
        togglePwBtn.innerHTML = isPw ? eyeOffIcon : eyeIcon;
        togglePwBtn.style.color = isPw ? 'var(--primary-light, #a78bfa)' : 'rgba(255,255,255,0.5)';
      });
    }

    // Handle logout — always attach, even when already logged in
    document.getElementById('nav-logout').addEventListener('click', (e) => {
      e.preventDefault();
      sessionStorage.removeItem('agencyhub_logged_in');
      sessionStorage.removeItem('agencyhub_role');
      window.location.hash = ''; // Clear hash route
      window.location.reload();  // Reload page to reset state completely
    });

    // Check if already logged in this session
    if (sessionStorage.getItem('agencyhub_logged_in') === 'true') {
      const savedRole = sessionStorage.getItem('agencyhub_role') || 'user';
      applyRole(savedRole);
      loginOverlay.style.display = 'none';
      return;
    }

    // Validation functions returning CredentialMonad
    const validatePresence = (creds) => {
      if (!creds.username || !creds.password) {
        return CredentialMonad.fail('Username and password cannot be empty');
      }
      return CredentialMonad.of(creds);
    };

    const validateLength = (creds) => {
      if (creds.username.length < 3) {
        return CredentialMonad.fail('Username must be at least 3 characters long');
      }
      if (creds.password.length < 6) {
        return CredentialMonad.fail('Password must be at least 6 characters long');
      }
      return CredentialMonad.of(creds);
    };

    const VALID_USERS = {
      admin:  { password: 'password123', role: 'admin' },
      user:   { password: 'user1234',    role: 'user'  },
    };

    const validateCredentials = (creds) => {
      const entry = VALID_USERS[creds.username];
      if (entry && entry.password === creds.password) {
        creds.role = entry.role;
        return CredentialMonad.of(creds);
      }
      return CredentialMonad.fail('Invalid username or password');
    };

    loginSubmit.addEventListener('click', () => {
      const u = usernameInput.value.trim();
      const p = passwordInput.value.trim();

      const validation = CredentialMonad.of({ username: u, password: p })
        .chain(validatePresence)
        .chain(validateLength)
        .chain(validateCredentials);

      if (validation.isSuccess()) {
        const role = validation.value.role;
        sessionStorage.setItem('agencyhub_logged_in', 'true');
        sessionStorage.setItem('agencyhub_role', role);
        applyRole(role);
        loginOverlay.style.opacity = '0';
        setTimeout(() => {
          loginOverlay.style.display = 'none';
        }, 300);
      } else {
        errorMsg.innerHTML = `❌ ${validation.error}`;
        errorMsg.classList.remove('hidden');
      }
    });

    // Support enter key
    passwordInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') loginSubmit.click();
    });
    usernameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') loginSubmit.click();
    });
  }

  // ============================================
  //  INITIALIZATION
  // ============================================
  function init() {
    initLogin();
    syncFromFirestore();

    // Global date picker trigger (opens calendar when clicking anywhere on the date input)
    document.addEventListener('click', (e) => {
      if (e.target && e.target.type === 'date') {
        try {
          e.target.showPicker();
        } catch (err) {
          // Fallback if not supported
        }
      }
    });

    // Nav links
    document.querySelectorAll('.nav-link').forEach(link => {
      if (link.id !== 'nav-logout') {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          navigate(link.dataset.page);
        });
      }
    });

    // Sidebar toggle
    document.getElementById('sidebar-toggle').addEventListener('click', toggleSidebar);

    // Agency selector
    document.querySelectorAll('.agency-btn').forEach(btn => {
      btn.addEventListener('click', () => setAgency(btn.dataset.agency));
    });

    // Modal close
    document.getElementById('modal-close').addEventListener('click', utils.closeModal);
    document.getElementById('modal-overlay').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) utils.closeModal();
    });

    // Clock
    updateClock();
    setInterval(updateClock, 1000);

    // Route from hash
    const hash = window.location.hash.slice(1);
    if (hash && PAGES[hash]) {
      navigate(hash);
    } else {
      navigate('dashboard');
    }

    // Hash change listener
    window.addEventListener('hashchange', () => {
      const h = window.location.hash.slice(1);
      if (h && PAGES[h] && h !== state.currentPage) {
        navigate(h);
      }
    });
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ─── Public API ──────────────────────────────────
  return {
    state,
    data,
    utils,
    modules,
    navigate,
    setAgency,
    registerModule,
    isAdmin,
    AGENCIES,
    AUDIT_ITEMS,
    PAGES,
    DEFAULT_PRODUCTS,
  };
})();
