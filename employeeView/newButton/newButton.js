// script.js

// Wrap DOM access in DOMContentLoaded to avoid null references if this script
// runs before the elements are parsed.
document.addEventListener('DOMContentLoaded', () => {
  const attachBtn = document.getElementById('attachBtn');
  const fileInput = document.getElementById('fileInput');
  const fileName  = document.getElementById('fileName');
  const preview   = document.getElementById('preview');
  const form      = document.getElementById('expenseForm');

  if (!attachBtn || !fileInput || !fileName || !form) return;

  // trigger file chooser
  attachBtn.addEventListener('click', () => fileInput.click());

  // when a file is selected
  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) {
      fileName.textContent = '';
      if (preview) preview.classList.add('hidden');
      return;
    }

    // show filename
    fileName.textContent = 'Selected: ' + file.name;

    // only preview images
    if (preview && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = e => {
        preview.src = e.target.result;
        preview.classList.remove('hidden');
      };
      reader.readAsDataURL(file);
    } else if (preview) {
      preview.classList.add('hidden');
    }
  });

  // form submission (optional)
  // track selected status from the status buttons (none selected initially)
  let selectedStatus = '';
  // reference to the one-time highlight handler so it can be removed
  let highlightHandler = null;

  // wire status buttons (if present) to set selectedStatus and mark active
  const statusButtons = Array.from(document.querySelectorAll('.status-btn'));
  statusButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // derive status name from text or class
      const s = (btn.textContent || btn.innerText || '').trim();
      if (s) selectedStatus = s;
      // mark active class
      statusButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      // show persistent error if 'Approved' is selected, hide otherwise
      const formErrorEl = document.getElementById('formError');
      if (selectedStatus && selectedStatus.toLowerCase() === 'approved') {
        if (formErrorEl) {
          formErrorEl.textContent = 'Only Approver can approve the amount .';
          formErrorEl.classList.remove('hidden');
          formErrorEl.classList.remove('highlight');

          // add a one-time document listener to highlight the error when user touches anywhere
          // store the handler so we can remove it later
          highlightHandler = () => {
            formErrorEl.classList.add('highlight');
            // remove listener after first activation
            document.removeEventListener('click', highlightHandler);
            document.removeEventListener('touchstart', highlightHandler);
            highlightHandler = null;
          };
          document.addEventListener('click', highlightHandler);
          document.addEventListener('touchstart', highlightHandler);
        }
      } else {
        if (formErrorEl) {
          formErrorEl.textContent = '';
          formErrorEl.classList.add('hidden');
          formErrorEl.classList.remove('highlight');
          // ensure any leftover listeners are removed
          if (highlightHandler) {
            document.removeEventListener('click', highlightHandler);
            document.removeEventListener('touchstart', highlightHandler);
            highlightHandler = null;
          }
        }
      }

      // (no auto-submit) user should click Submit to finalize the form
    });
  });

  form.addEventListener('submit', e => {
    e.preventDefault();

    const formErrorEl = document.getElementById('formError');
    // require user to pick a status explicitly
    if (!selectedStatus) {
      if (formErrorEl) {
        formErrorEl.textContent = 'Please select a status before submitting.';
        formErrorEl.classList.remove('hidden');
      }
      return;
    }

    // If the user selected Approved, block submission — only approver can approve
    if (selectedStatus && selectedStatus.toLowerCase() === 'approved') {
      if (formErrorEl) {
        formErrorEl.textContent = 'Only Approver can approve the amount .';
        formErrorEl.classList.remove('hidden');
      }
      return; // do not proceed with saving/navigating
    }
    // clear any previous error
    if (formErrorEl) { formErrorEl.textContent = ''; formErrorEl.classList.add('hidden'); }

    // Build expense object matching employeeView.js expected shape
    const get = id => document.getElementById(id)?.value || '';
    const rawAmount = get('amount').toString().replace(/[,\s]+/g, '') || '0';
    const amount = Number.parseFloat(rawAmount);

    const paidByVal = get('paidBy') || '';
    const expense = {
      employee: paidByVal || '',
      description: get('description') || get('description') || get('desc') || '',
      date: get('expenseDate') || get('date') || '',
      category: get('category') || '',
      paidBy: paidByVal,
      remarks: get('remarks') || '',
      amount: Number.isFinite(amount) ? amount : 0,
      status: selectedStatus || 'Draft'
    };

    try {
      const key = 'newExpenses';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      if (Array.isArray(existing)) existing.push(expense);
      else existing = [expense];
      localStorage.setItem(key, JSON.stringify(existing));
    } catch (err) {
      // fallback: single item
      localStorage.setItem('newExpenses', JSON.stringify([expense]));
    }

    // Navigate back to the dashboard (employeeView) so it can pick up the new expense
    window.location.href = '../employeeView.html';
  });
});