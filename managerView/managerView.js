const approvalTable = document.getElementById('approvalTable');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const spinner = document.getElementById('spinner');
const toast = document.getElementById('toast');
const emptyState = document.getElementById('emptyState');

const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const fileNameEl = document.getElementById('fileName');
const previewWrap = document.getElementById('previewWrap');
const previewImg = document.getElementById('previewImg');
const clearFileBtn = document.getElementById('clearFile');

const newBtn = document.getElementById('newBtn');
const newModal = document.getElementById('newModal');
const newForm = document.getElementById('newForm');
const newCancel = document.getElementById('newCancel');
const newFile = document.getElementById('newFile');
const newPreviewWrap = document.getElementById('newPreviewWrap');
const newPreview = document.getElementById('newPreview');

const previewModal = document.getElementById('previewModal');
const previewLarge = document.getElementById('previewLarge');
const previewClose = document.getElementById('previewClose');
const downloadBtn = document.getElementById('downloadBtn');

let approvals = [
  { id: 1, subject: "none", owner: "Sarah", category: "Food", status: "Pending", amount: 28.00, receipt: null },
  { id: 2, subject: "Travel Claim", owner: "Amit", category: "Travel", status: "Pending", amount: 300.00, receipt: null },
  { id: 3, subject: "Office Supplies", owner: "Priya", category: "Supplies", status: "Rejected", amount: 450.00, receipt: null },
  { id: 4, subject: "Lunch", owner: "Sarah", category: "Food", status: "Pending", amount: 30.00, receipt: null }
];

let attachedFileDataUrl = null;

// Upload / preview card logic
dropZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', e => handleFileSelect(e.target.files[0]));
dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  const f = e.dataTransfer.files && e.dataTransfer.files[0];
  if (f) handleFileSelect(f);
});
clearFileBtn.addEventListener('click', () => {
  attachedFileDataUrl = null;
  fileInput.value = '';
  fileNameEl.textContent = '';
  previewWrap.classList.add('hidden');
});

function handleFileSelect(file) {
  if (!file) return;
  fileNameEl.textContent = `Selected: ${file.name}`;
  if (!file.type.startsWith('image/')) {
    previewWrap.classList.add('hidden');
    attachedFileDataUrl = null;
    return;
  }
  const reader = new FileReader();
  reader.onload = e => {
    attachedFileDataUrl = e.target.result;
    previewImg.src = attachedFileDataUrl;
    previewWrap.classList.remove('hidden');
  };
  reader.readAsDataURL(file);
}

// Toast
function showToast(message){
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(()=> toast.classList.remove('show'), 2200);
}

// Render table with correct spinner and empty-state handling
function renderTable(){
  approvalTable.innerHTML = '';
  emptyState.classList.add('hidden');
  spinner.classList.remove('hidden');

  setTimeout(()=>{
    try {
      spinner.classList.add('hidden');

      const q = (searchInput.value || '').trim().toLowerCase();
      const filter = statusFilter.value || 'All';

      const filtered = approvals.filter(a => {
        const owner = (a.owner || '').toLowerCase();
        const matchName = q === '' || owner.includes(q);
        const matchStatus = filter === 'All' || a.status === filter;
        return matchName && matchStatus;
      });

      if (filtered.length === 0) {
        emptyState.classList.remove('hidden');
        return;
      }

      filtered.forEach(a => {
        const tr = document.createElement('tr');

        const subjectTd = document.createElement('td');
        subjectTd.textContent = a.subject || '';

        const ownerTd = document.createElement('td');
        ownerTd.textContent = a.owner;

        const categoryTd = document.createElement('td');
        categoryTd.textContent = a.category;

        const statusTd = document.createElement('td');
        const badge = document.createElement('span');
        badge.className = `status ${a.status}`;
        badge.textContent = a.status;
        statusTd.appendChild(badge);

        const amountTd = document.createElement('td');
        amountTd.textContent = a.amount.toFixed(2);

        const actionsTd = document.createElement('td');

        if (a.receipt) {
          const previewBtn = document.createElement('button');
          previewBtn.className = 'ghost';
          previewBtn.textContent = 'Preview';
          previewBtn.addEventListener('click', ()=> openPreview(a.receipt));
          actionsTd.appendChild(previewBtn);
        }

        if (a.status === 'Pending') {
          const approveBtn = document.createElement('button');
          approveBtn.className = 'approve-btn';
          approveBtn.textContent = 'Approve';
          approveBtn.addEventListener('click', ()=> handleActionById(a.id, 'Approved'));
          const rejectBtn = document.createElement('button');
          rejectBtn.className = 'reject-btn';
          rejectBtn.textContent = 'Reject';
          rejectBtn.addEventListener('click', ()=> handleActionById(a.id, 'Rejected'));
          actionsTd.appendChild(approveBtn);
          actionsTd.appendChild(rejectBtn);
        }

        tr.appendChild(subjectTd);
        tr.appendChild(ownerTd);
        tr.appendChild(categoryTd);
        tr.appendChild(statusTd);
        tr.appendChild(amountTd);
        tr.appendChild(actionsTd);

        approvalTable.appendChild(tr);
      });
    } catch (err) {
      console.error('renderTable error', err);
      spinner.classList.add('hidden');
      emptyState.classList.remove('hidden');
    }
  }, 300);
}

// Approve / Reject by stable id
function handleActionById(id, newStatus){
  const idx = approvals.findIndex(r => r.id === id);
  if (idx === -1) return;
  approvals[idx] = { ...approvals[idx], status: newStatus };
  showToast(`${newStatus} successfully`);
  setTimeout(renderTable, 240);
}

// New request modal flow
newBtn.addEventListener('click', () => {
  newModal.classList.remove('hidden');
  newModal.setAttribute('aria-hidden', 'false');
  newForm.reset();
  newPreviewWrap.classList.add('hidden');
});

newCancel.addEventListener('click', () => {
  newModal.classList.add('hidden');
  newModal.setAttribute('aria-hidden', 'true');
});

newFile.addEventListener('change', e => {
  const f = e.target.files[0];
  if(!f) return;
  if(!f.type.startsWith('image/')) return;
  const r = new FileReader();
  r.onload = ev => {
    newPreview.src = ev.target.result;
    newPreviewWrap.classList.remove('hidden');
  };
  r.readAsDataURL(f);
});

newForm.addEventListener('submit', e => {
  e.preventDefault();
  const subject = (document.getElementById('newSubject').value || '').trim();
  const owner = (document.getElementById('newOwner').value || '').trim();
  const category = (document.getElementById('newCategory').value || '').trim();
  const amount = parseFloat(document.getElementById('newAmount').value) || 0;
  const file = newFile.files[0];

  if (file && file.type.startsWith('image/')) {
    const r = new FileReader();
    r.onload = ev => {
      saveNewRequest(subject, owner, category, amount, ev.target.result);
    };
    r.readAsDataURL(file);
  } else {
    saveNewRequest(subject, owner, category, amount, null);
  }
});

function saveNewRequest(subject, owner, category, amount, receiptDataUrl){
  const id = Date.now();
  approvals.unshift({ id, subject, owner, category, status: 'Pending', amount: parseFloat(amount), receipt: receiptDataUrl });
  newModal.classList.add('hidden');
  showToast('Request created');
  renderTable();
}

// Preview modal
function openPreview(dataUrl){
  previewLarge.src = dataUrl;
  previewModal.classList.remove('hidden');
  previewModal.setAttribute('aria-hidden', 'false');
}

previewClose.addEventListener('click', ()=> {
  previewModal.classList.add('hidden');
  previewModal.setAttribute('aria-hidden', 'true');
});

downloadBtn.addEventListener('click', ()=> {
  const url = previewLarge.src;
  if(!url) return;
  const a = document.createElement('a');
  a.href = url;
  a.download = 'receipt.png';
  document.body.appendChild(a);
  a.click();
  a.remove();
});

// Utilities & events
function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
}

searchInput.addEventListener('input', debounce(renderTable, 220));
statusFilter.addEventListener('change', renderTable);

renderTable();

function debounce(fn, delay){
  let t;
  return function(...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), delay); };
}
