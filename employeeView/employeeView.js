// script.js

const expenses = [];

// Defer DOM queries until content is loaded to avoid nulls when this script
// is loaded in the <head> before the DOM is ready.
let sumToSubmitEl, sumWaitingEl, sumApprovedEl, tableBody;
let uploadBtn, newBtn, fileInput;
let modal, form, cancelBtn, modalTitle;

// Render summary totals
function renderSummary() {
  // Guard: elements may not exist in some contexts
  if (!sumToSubmitEl || !sumWaitingEl || !sumApprovedEl) return;

  let toSubmit = 0, waiting = 0, approved = 0;
  expenses.forEach(e => {
    const amt = Number(e.amount);
    if (!Number.isFinite(amt)) return; // skip invalid amounts
    if (e.status === 'Draft')      toSubmit += amt;
    if (e.status === 'Submitted')  waiting  += amt;
    if (e.status === 'Approved')   approved += amt;
  });

  // format totals to 2 decimals
  sumToSubmitEl.textContent = `${toSubmit.toFixed(2)} rs`;
  sumWaitingEl.textContent  = `${waiting.toFixed(2)} rs`;
  sumApprovedEl.textContent = `${approved.toFixed(2)} rs`;
}

// Render table rows
function renderTable() {
  if (!tableBody) return;
  tableBody.innerHTML = '';
  // Render existing expense rows (editable amount)
  expenses.forEach((e, i) => {
    const tr = document.createElement('tr');
    const amt = Number(e.amount);
    const amtText = Number.isFinite(amt) ? amt.toFixed(2) : '0.00';
    tr.innerHTML = `
      <td>${e.employee || ''}</td>
      <td>${e.description || ''}</td>
      <td>${e.date || ''}</td>
      <td>${e.category || ''}</td>
      <td>${e.paidBy || ''}</td>
      <td>${e.remarks || ''}</td>
      <td><input type="number" step="0.01" id="amt_existing_${i}" value="${amtText}" class="amt-input"/></td>
      <td>
        <select class="status-select" data-index="${i}">
          <option value="Draft">Draft</option>
          <option value="Submitted">Submitted</option>
          <option value="Approved">Approved</option>
        </select>
      </td>
    `;
    tableBody.appendChild(tr);
    // wire status select
    const sel = tr.querySelector('.status-select');
    if (sel) {
      sel.value = e.status || 'Draft';
      sel.classList.add('status-' + sel.value);
      sel.onchange = () => {
        const v = sel.value;
        expenses[i].status = v;
        // update class to reflect color
        sel.className = 'status-select status-' + v;
        renderSummary();
      };
    }
    // wire amount input to update model immediately on change/input
    const amtInput = tr.querySelector(`#amt_existing_${i}`);
    if (amtInput) {
      amtInput.oninput = () => {
        const raw = amtInput.value?.toString().replace(/[,\s]+/g, '') || '0';
        const n = Number.parseFloat(raw);
        expenses[i].amount = Number.isFinite(n) ? n : 0;
        renderSummary();
      };
      // when blur, format to 2 decimals
      amtInput.onblur = () => {
        const n = Number(expenses[i].amount) || 0;
        amtInput.value = n.toFixed(2);
      };
    }
  });

  // Add editable vacant rows up to 10 total rows
  const totalRows = Math.max(10, expenses.length);
  const vacantCount = Math.max(0, 10 - expenses.length);
  for (let r = 0; r < vacantCount; r++) {
    const idx = expenses.length + r; // index for id uniqueness
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="text" id="emp_${idx}" placeholder="Employee"/></td>
      <td><input type="text" id="desc_${idx}" placeholder="Description"/></td>
      <td><input type="date" id="date_${idx}" /></td>
      <td>
        <select id="cat_${idx}">
          <option value="">Select...</option>
          <option>Food</option>
          <option>Travel</option>
          <option>Office Supplies</option>
        </select>
      </td>
      <td><input type="text" id="paidby_${idx}" placeholder="Paid By"/></td>
      <td><input type="text" id="rem_${idx}" placeholder="Remarks"/></td>
      <td><input type="number" id="amt_${idx}" step="0.01" placeholder="0.00"/></td>
      <td>
        <select id="status_new_${idx}" class="status-select">
          <option value="Draft">Draft</option>
          <option value="Submitted">Submitted</option>
          <option value="Approved">Approved</option>
        </select>
        <button type="button" id="add_${idx}">Add</button>
      </td>
    `;
    tableBody.appendChild(tr);

    // Wire up the Add button
    // Use a closure to capture idx
    (function(i2) {
      const btn = document.getElementById(`add_${i2}`);
      const amtEl = document.getElementById(`amt_${i2}`);
      const statusEl = document.getElementById(`status_new_${i2}`);
      if (amtEl) {
        // when user finishes entering amount (change / blur), auto-create the row
        amtEl.onchange = () => {
          const get = id => document.getElementById(id)?.value || '';
          const rawAmt = get(`amt_${i2}`).toString().replace(/[,\s]+/g, '');
          const amtVal = Number.parseFloat(rawAmt);
          const statusVal = get(`status_new_${i2}`) || 'Draft';
          // if amount is valid, create new expense immediately
          if (Number.isFinite(amtVal)) {
            const newExp = {
              employee: get(`emp_${i2}`) || 'Unknown',
              description: get(`desc_${i2}`),
              date: get(`date_${i2}`),
              category: get(`cat_${i2}`),
              paidBy: get(`paidby_${i2}`),
              remarks: get(`rem_${i2}`),
              amount: amtVal,
              status: statusVal
            };
            expenses.push(newExp);
            renderTable();
            renderSummary();
          }
        };
      }
      if (!btn) return;
      btn.onclick = () => {
        const get = id => document.getElementById(id)?.value || '';
        const rawAmt = get(`amt_${i2}`).toString().replace(/[,\s]+/g, '');
        const amtVal = Number.parseFloat(rawAmt);
        const statusVal = get(`status_new_${i2}`) || 'Draft';
        const newExp = {
          employee: get(`emp_${i2}`) || 'Unknown',
          description: get(`desc_${i2}`),
          date: get(`date_${i2}`),
          category: get(`cat_${i2}`),
          paidBy: get(`paidby_${i2}`),
          remarks: get(`rem_${i2}`),
          amount: Number.isFinite(amtVal) ? amtVal : 0,
          status: statusVal
        };
        expenses.push(newExp);
        renderTable();
        renderSummary();
      };
    })(idx);
  }
}

// Open new‐expense modal
function openModal(mode, data) {
  if (!form || !modal || !modalTitle) return;
  form.reset();
  modalTitle.textContent = mode === 'upload' ? 'Upload Expense' : 'New Expense';
  if (data) {
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val ?? '';
    };
    setVal('desc', data.description);
    setVal('date', data.date);
    setVal('category', data.category);
    setVal('amount', data.amount);
    setVal('paidBy', data.paidBy);
    setVal('remarks', data.remarks);
  }
  modal.classList.remove('hidden');
}

// Close modal
// Attach event handlers after DOM content loaded (see init below)

// Handle file upload
// Initialization: query DOM and wire up handlers
function init() {
  sumToSubmitEl = document.getElementById('sumToSubmit');
  sumWaitingEl  = document.getElementById('sumWaiting');
  sumApprovedEl = document.getElementById('sumApproved');
  tableBody     = document.getElementById('expenseTable');

  uploadBtn  = document.getElementById('uploadBtn');
  newBtn     = document.getElementById('newBtn');
  fileInput  = document.getElementById('fileInput');

  modal      = document.getElementById('expenseModal');
  form       = document.getElementById('expenseForm');
  cancelBtn  = document.getElementById('cancelBtn');
  modalTitle = document.getElementById('modalTitle');

  if (cancelBtn && modal) cancelBtn.onclick = () => modal.classList.add('hidden');

  if (uploadBtn && fileInput) uploadBtn.onclick = () => fileInput.click();
  if (fileInput) fileInput.onchange = () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    // Try to extract an amount from the filename (e.g., "receipt_1,234.50.jpg")
    const name = file.name;
    const m = name.match(/([0-9]{1,3}(?:[,\s][0-9]{3})*(?:\.[0-9]+)?)|([0-9]+(?:\.[0-9]+)?)/);
    const today = new Date().toISOString().split('T')[0];
    if (m) {
      // pick first matching group that is defined
      const raw = (m[1] || m[2] || '').toString().replace(/[,\s]+/g, '');
      const amt = Number.parseFloat(raw);
      if (Number.isFinite(amt)) {
        // create a new expense immediately with detected amount
        expenses.push({
          employee: 'Sarah',
          description: file.name,
          date: today,
          category: '',
          paidBy: 'Sarah',
          remarks: '',
          amount: amt,
          status: 'Draft'
        });
        renderTable();
        renderSummary();
        return;
      }
    }
    // fallback: open modal prefilled with filename
    openModal('upload', {
      description: file.name,
      date: today,
      category: '',
      amount: '',
      paidBy: 'Sarah',
      remarks: ''
    });
  };

  // Make New button open the newButton page in the same tab
  if (newBtn) newBtn.onclick = () => {
    // relative path to the new button page
    window.location.href = 'newButton/newButton.html';
  };

  if (form) {
    form.onsubmit = e => {
      e.preventDefault();
      const parseAmt = v => {
        const raw = (v || '').toString().replace(/[,\s]+/g, '');
        const n = Number.parseFloat(raw);
        return Number.isFinite(n) ? n : 0;
      };
      const newExp = {
        employee: 'Sarah',
        description: document.getElementById('desc')?.value || '',
        date:        document.getElementById('date')?.value || '',
        category:    document.getElementById('category')?.value || '',
        paidBy:      document.getElementById('paidBy')?.value || '',
        remarks:     document.getElementById('remarks')?.value || '',
        amount:      parseAmt(document.getElementById('amount')?.value),
        status:      'Draft'
      };
      expenses.push(newExp);
      if (modal) modal.classList.add('hidden');
      renderTable();
      renderSummary();
    };
  }

  // Import any expenses saved by the standalone newButton page via localStorage
  try {
    const pending = JSON.parse(localStorage.getItem('newExpenses') || '[]');
    if (Array.isArray(pending) && pending.length) {
      // Merge and clear
      pending.forEach(p => {
        // basic validation and normalization
        p.amount = Number.isFinite(Number(p.amount)) ? Number(p.amount) : 0;
        // if employee field is empty, fallback to paidBy
        if (!p.employee && p.paidBy) p.employee = p.paidBy;
        expenses.push(p);
      });
      localStorage.removeItem('newExpenses');
      renderTable();
      renderSummary();
    }
  } catch (err) {
    // ignore parse errors
  }

  // Initial render
  renderTable();
  renderSummary();
}

// Run init when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}