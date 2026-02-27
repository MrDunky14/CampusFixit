/* ============================================================
   CampusFixit — app.js
   Full-featured ticket system with security hardening
   ============================================================ */
(() => {
  'use strict';

  /* ---------- Helpers ---------- */
  const $ = (s, p = document) => p.querySelector(s);
  const $$ = (s, p = document) => [...p.querySelectorAll(s)];

  function escapeHTML(str) {
    if (!str) return '';
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return String(str).replace(/[&<>"']/g, c => map[c]);
  }

  function genId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let id;
    do { id = ''; for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)]; }
    while (tickets.some(t => t.id === id));
    return id;
  }

  function timeAgo(ts) {
    const diff = (Date.now() - ts) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  function formatDate(ts) {
    return new Date(ts).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  }

  function toast(msg) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    $('#toast-container').appendChild(el);
    setTimeout(() => el.remove(), 3600);
  }

  /* ---------- Seed Data ---------- */
  const SEED_DATA = [
    { id: 'TK8X2A', category: '💻 IT/Projector', location: 'Lecture Hall 3, Block A', priority: 'High', description: 'Projector shows a large blue horizontal line across the screen. Tried restarting — still there. Faculty can\'t show slides properly.', reporter: 'Arjun Mehta', contact: 'arjun@campus.edu', photo: null, status: 'Pending', assignedTo: null, eta: null, votes: 14, notes: [], log: [{ time: Date.now() - 3600000 * 24, actor: 'System', text: 'Ticket created' }], verifiedRating: null, verifiedComment: null, createdAt: Date.now() - 3600000 * 24 },
    { id: 'TK3PY7', category: '❄️ AC/Ventilation', location: 'Lab 4, Block B', priority: 'Medium', description: 'AC not cooling at all — temperature goes above 35°C in afternoon. Fans alone don\'t help. Students complain daily.', reporter: 'Priya Sharma', contact: '9876543210', photo: null, status: 'Assigned', assignedTo: 'Maintenance Team A', eta: null, votes: 8, notes: [{ actor: 'Admin Rao', text: 'Assigned to HVAC technician. Will inspect tomorrow morning.', time: Date.now() - 3600000 * 18 }], log: [{ time: Date.now() - 3600000 * 36, actor: 'System', text: 'Ticket created' }, { time: Date.now() - 3600000 * 18, actor: 'Admin Rao', text: 'Status → Assigned to Maintenance Team A' }], verifiedRating: null, verifiedComment: null, createdAt: Date.now() - 3600000 * 36 },
    { id: 'TK5NQ9', category: '🪑 Furniture', location: 'Room 201, Block C', priority: 'Low', description: 'Three chairs have broken armrests. One has a wobbly leg. Taped up for now but needs proper repair.', reporter: 'Rahul Dev', contact: '', photo: null, status: 'In Progress', assignedTo: 'Carpenter - Mr. Kumar', eta: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0], votes: 3, notes: [{ actor: 'Admin Rao', text: 'Carpenter scheduled for Thursday.', time: Date.now() - 3600000 * 12 }], log: [{ time: Date.now() - 3600000 * 48, actor: 'System', text: 'Ticket created' }, { time: Date.now() - 3600000 * 24, actor: 'Admin Rao', text: 'Status → Assigned' }, { time: Date.now() - 3600000 * 12, actor: 'Admin Rao', text: 'Status → In Progress' }], verifiedRating: null, verifiedComment: null, createdAt: Date.now() - 3600000 * 48 },
    { id: 'TK9RW4', category: '💡 Lighting', location: 'Corridor, 2nd Floor, Block A', priority: 'Medium', description: 'Four tube-lights completely dead in the corridor. Very dark after 5pm — potential safety hazard.', reporter: 'Sneha Iyer', contact: 'sneha.i@campus.edu', photo: null, status: 'Fixed', assignedTo: 'Electrician - Mr. Patel', eta: null, votes: 11, notes: [{ actor: 'Admin Rao', text: 'Replaced all 4 tubes with new LED panels.', time: Date.now() - 3600000 * 6 }], log: [{ time: Date.now() - 3600000 * 72, actor: 'System', text: 'Ticket created' }, { time: Date.now() - 3600000 * 48, actor: 'Admin Rao', text: 'Status → Assigned' }, { time: Date.now() - 3600000 * 24, actor: 'Admin Rao', text: 'Status → In Progress' }, { time: Date.now() - 3600000 * 6, actor: 'Admin Rao', text: 'Status → Fixed' }], verifiedRating: null, verifiedComment: null, createdAt: Date.now() - 3600000 * 72 },
    { id: 'TKJC6M', category: '🚿 Plumbing', location: 'Washroom, Ground Floor, Block D', priority: 'High', description: 'Water leaking from ceiling pipe in second stall. Puddle forming on the floor — slippery and unhygienic. Bucket placed temporarily.', reporter: 'Karthik R.', contact: '9998887776', photo: null, status: 'Verified', assignedTo: 'Plumber - Mr. Singh', eta: null, votes: 19, notes: [{ actor: 'Admin Rao', text: 'Pipe joint replaced and sealed. Tested — no more leaks.', time: Date.now() - 3600000 * 4 }], log: [{ time: Date.now() - 3600000 * 96, actor: 'System', text: 'Ticket created' }, { time: Date.now() - 3600000 * 72, actor: 'Admin Rao', text: 'Status → Assigned' }, { time: Date.now() - 3600000 * 48, actor: 'Admin Rao', text: 'Status → In Progress' }, { time: Date.now() - 3600000 * 24, actor: 'Admin Rao', text: 'Status → Fixed' }, { time: Date.now() - 3600000 * 4, actor: 'Karthik R.', text: 'Verified ★★★★★ — Fixed perfectly' }], verifiedRating: 5, verifiedComment: 'Fixed perfectly', createdAt: Date.now() - 3600000 * 96 },
    { id: 'TKN7ZE', category: '📶 WiFi/Network', location: 'Library, 1st Floor', priority: 'High', description: 'WiFi keeps disconnecting every 5 minutes on the 1st floor only. Other floors are fine. Students can\'t do online research.', reporter: 'Divya Nair', contact: 'divya.nair@campus.edu', photo: null, status: 'In Progress', assignedTo: 'IT Dept - Sanjay', eta: new Date(Date.now() + 86400000).toISOString().split('T')[0], votes: 22, notes: [{ actor: 'IT Sanjay', text: 'Access point firmware outdated. Updating firmware and repositioning AP.', time: Date.now() - 3600000 * 8 }], log: [{ time: Date.now() - 3600000 * 30, actor: 'System', text: 'Ticket created' }, { time: Date.now() - 3600000 * 20, actor: 'IT Admin', text: 'Status → Assigned' }, { time: Date.now() - 3600000 * 8, actor: 'IT Sanjay', text: 'Status → In Progress' }], verifiedRating: null, verifiedComment: null, createdAt: Date.now() - 3600000 * 30 },
    { id: 'TK4AF8', category: '🔌 Electrical', location: 'Seminar Hall, Block E', priority: 'Medium', description: '3 out of 6 power sockets near the podium are not working. Speakers can\'t charge laptops during events.', reporter: 'Amit Verma', contact: '', photo: null, status: 'Pending', assignedTo: null, eta: null, votes: 5, notes: [], log: [{ time: Date.now() - 3600000 * 10, actor: 'System', text: 'Ticket created' }], verifiedRating: null, verifiedComment: null, createdAt: Date.now() - 3600000 * 10 },
    { id: 'TKMP2Q', category: '🧹 Cleaning', location: 'Canteen Seating Area', priority: 'Low', description: 'Tables are sticky and not wiped after lunch hours. Dustbins overflowing by 2pm daily. Need more frequent cleaning rounds.', reporter: 'Neha Gupta', contact: 'neha.g@campus.edu', photo: null, status: 'Assigned', assignedTo: 'Housekeeping Lead', eta: null, votes: 7, notes: [{ actor: 'Admin Rao', text: 'Informed housekeeping supervisor. Extra round added at 1:30pm.', time: Date.now() - 3600000 * 5 }], log: [{ time: Date.now() - 3600000 * 20, actor: 'System', text: 'Ticket created' }, { time: Date.now() - 3600000 * 5, actor: 'Admin Rao', text: 'Status → Assigned' }], verifiedRating: null, verifiedComment: null, createdAt: Date.now() - 3600000 * 20 }
  ];

  /* ---------- State ---------- */
  let tickets = [];
  let currentRole = 'student';
  let currentFilter = 'All';
  let staffFilter = 'All';
  let searchStudent = '';
  let searchStaff = '';
  let sortMode = 'newest';
  let verifyTicketId = null;
  let notesTicketId = null;
  let selectedRating = 0;
  let photoData = null; // base64 string
  let lastSubmitTime = 0;
  let voted = new Set();
  const STAFF_PIN = '1234';
  let staffAuthenticated = false;

  /* ---------- Custom Dialog System ---------- */
  function customDialog({ icon, title, message, placeholder, inputType, inputClass, confirmText, confirmClass, showInput }) {
    return new Promise(resolve => {
      const overlay = $('#custom-dialog');
      const dlgIcon = $('#dialog-icon');
      const dlgTitle = $('#dialog-title');
      const dlgMsg = $('#dialog-message');
      const dlgInputWrap = $('#dialog-input-wrap');
      const dlgInput = $('#dialog-input');
      const dlgConfirm = $('#dialog-confirm');
      const dlgCancel = $('#dialog-cancel');

      dlgIcon.textContent = icon || '💬';
      dlgTitle.textContent = title || 'Confirm';
      dlgMsg.textContent = message || '';
      dlgMsg.style.display = message ? '' : 'none';

      if (showInput) {
        dlgInputWrap.classList.remove('hidden');
        dlgInput.value = '';
        dlgInput.type = inputType || 'text';
        dlgInput.placeholder = placeholder || '';
        dlgInput.className = 'dialog-input' + (inputClass ? ' ' + inputClass : '');
        setTimeout(() => dlgInput.focus(), 80);
      } else {
        dlgInputWrap.classList.add('hidden');
      }

      dlgConfirm.textContent = confirmText || 'Confirm';
      dlgConfirm.className = confirmClass || 'btn-verify-accept';

      overlay.classList.remove('hidden');

      function cleanup() {
        overlay.classList.add('hidden');
        dlgConfirm.removeEventListener('click', onConfirm);
        dlgCancel.removeEventListener('click', onCancel);
        overlay.removeEventListener('click', onOverlay);
        document.removeEventListener('keydown', onKey);
      }
      function onConfirm() { cleanup(); resolve(showInput ? dlgInput.value : true); }
      function onCancel()  { cleanup(); resolve(showInput ? null : false); }
      function onOverlay(e) { if (e.target === overlay) onCancel(); }
      function onKey(e) {
        if (e.key === 'Escape') onCancel();
        if (e.key === 'Enter' && !e.shiftKey) onConfirm();
      }

      dlgConfirm.addEventListener('click', onConfirm);
      dlgCancel.addEventListener('click', onCancel);
      overlay.addEventListener('click', onOverlay);
      document.addEventListener('keydown', onKey);
    });
  }

  /* ---------- DOM Refs ---------- */
  const el = {
    toastContainer: $('#toast-container'),
    lightboxModal: $('#lightbox-modal'),
    lightboxImg: $('#lightbox-img'),
    lightboxClose: $('#lightbox-close'),
    verifyModal: $('#verify-modal'),
    modalTicketInfo: $('#modal-ticket-info'),
    verifyComment: $('#verify-comment'),
    starRating: $('#star-rating'),
    verifyAccept: $('#verify-accept'),
    verifyReject: $('#verify-reject'),
    verifyCancel: $('#verify-cancel'),
    notesModal: $('#notes-modal'),
    notesTicketInfo: $('#notes-ticket-info'),
    notesPhotoWrap: $('#notes-photo-wrap'),
    notesPhotoImg: $('#notes-photo-img'),
    staffNoteInput: $('#staff-note-input'),
    addNoteBtn: $('#add-note-btn'),
    etaDate: $('#eta-date'),
    setEtaBtn: $('#set-eta-btn'),
    activityLog: $('#activity-log'),
    notesClose: $('#notes-close'),
    roleBtns: $$('.role-btn'),
    resetBtn: $('#reset-data-btn'),
    darkToggle: $('#dark-toggle'),
    darkIcon: $('#dark-icon'),
    studentView: $('#student-view'),
    staffView: $('#staff-view'),
    form: $('#ticket-form'),
    reporter: $('#reporter'),
    contact: $('#contact'),
    category: $('#category'),
    location: $('#location'),
    priority: $('#priority'),
    description: $('#description'),
    descCounter: $('#desc-counter'),
    photoInput: $('#photo-input'),
    photoPlaceholder: $('#photo-placeholder'),
    photoPreviewWrap: $('#photo-preview-wrap'),
    photoPreview: $('#photo-preview'),
    photoRemove: $('#photo-remove'),
    studentSearch: $('#student-search'),
    studentFilters: $('#student-filters'),
    ticketsGrid: $('#tickets-grid'),
    emptyState: $('#empty-state'),
    staffSearch: $('#staff-search'),
    staffSort: $('#staff-sort'),
    staffFiltersGroup: $('#staff-filters'),
    staffTbody: $('#staff-tbody'),
    staffEmpty: $('#staff-empty'),
    staffName: $('#staff-name'),
    statTotal: $('#stat-total'),
    statPending: $('#stat-pending'),
    statProgress: $('#stat-progress'),
    statFixed: $('#stat-fixed'),
    statVerified: $('#stat-verified'),
  };

  /* ---------- Persistence ---------- */
  function save() { localStorage.setItem('campusfixit_tickets', JSON.stringify(tickets)); }
  function load() {
    const raw = localStorage.getItem('campusfixit_tickets');
    if (raw) { try { tickets = JSON.parse(raw); } catch { tickets = []; } }
    if (!tickets.length) resetToSeed();
    const v = localStorage.getItem('campusfixit_voted');
    if (v) { try { voted = new Set(JSON.parse(v)); } catch { voted = new Set(); } }
  }
  function saveVoted() { localStorage.setItem('campusfixit_voted', JSON.stringify([...voted])); }

  function resetToSeed() {
    tickets = JSON.parse(JSON.stringify(SEED_DATA));
    voted = new Set();
    save();
    saveVoted();
  }

  /* ---------- Init ---------- */
  function init() {
    load();
    // Theme
    const savedTheme = localStorage.getItem('campusfixit_theme');
    if (savedTheme === 'dark') document.body.classList.add('dark');
    updateDarkIcon();
    // Staff name
    const sn = localStorage.getItem('campusfixit_staff_name');
    if (sn) el.staffName.value = sn;
    render();
    bindEvents();
  }

  /* ---------- Event Bindings ---------- */
  function bindEvents() {
    // Role switching
    el.roleBtns.forEach(btn => btn.addEventListener('click', () => switchRole(btn.dataset.role)));

    // Dark mode
    el.darkToggle.addEventListener('click', toggleDark);

    // Reset
    el.resetBtn.addEventListener('click', () => {
      customDialog({
        icon: '🔄',
        title: 'Reset Demo Data',
        message: 'This will erase all current tickets and restore the 8 demo tickets. Continue?',
        showInput: false,
        confirmText: '🗑️ Reset Everything',
        confirmClass: 'btn-verify-reject',
      }).then(ok => {
        if (!ok) return;
        resetToSeed(); render(); toast('Demo data restored');
      });
    });

    // Form submit
    el.form.addEventListener('submit', handleSubmit);

    // Description char counter
    el.description.addEventListener('input', updateDescCounter);

    // Photo upload
    el.photoInput.addEventListener('change', handlePhotoSelect);
    el.photoRemove.addEventListener('click', removePhoto);

    // Search
    el.studentSearch.addEventListener('input', () => { searchStudent = el.studentSearch.value.trim(); renderStudentCards(); });
    el.staffSearch.addEventListener('input', () => { searchStaff = el.staffSearch.value.trim(); renderStaffTable(); });

    // Sort
    el.staffSort.addEventListener('change', () => { sortMode = el.staffSort.value; renderStaffTable(); });

    // Student filters
    $$('.filter-btn', el.studentFilters).forEach(btn => btn.addEventListener('click', () => {
      $$('.filter-btn', el.studentFilters).forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderStudentCards();
    }));

    // Staff filters
    $$('.filter-btn', el.staffFiltersGroup).forEach(btn => btn.addEventListener('click', () => {
      $$('.filter-btn', el.staffFiltersGroup).forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      staffFilter = btn.dataset.filter;
      renderStaffTable();
    }));

    // Staff name persist
    el.staffName.addEventListener('change', () => {
      localStorage.setItem('campusfixit_staff_name', el.staffName.value.trim());
    });

    // Verify modal
    el.verifyAccept.addEventListener('click', () => handleVerify(true));
    el.verifyReject.addEventListener('click', () => handleVerify(false));
    el.verifyCancel.addEventListener('click', closeVerifyModal);

    // Star rating
    $$('.star', el.starRating).forEach(star => {
      star.addEventListener('click', () => {
        selectedRating = parseInt(star.dataset.val);
        $$('.star', el.starRating).forEach(s => s.classList.toggle('active', parseInt(s.dataset.val) <= selectedRating));
      });
      star.addEventListener('mouseenter', () => {
        const v = parseInt(star.dataset.val);
        $$('.star', el.starRating).forEach(s => s.classList.toggle('active', parseInt(s.dataset.val) <= v));
      });
      star.addEventListener('mouseleave', () => {
        $$('.star', el.starRating).forEach(s => s.classList.toggle('active', parseInt(s.dataset.val) <= selectedRating));
      });
    });

    // Notes modal
    el.addNoteBtn.addEventListener('click', handleAddNote);
    el.setEtaBtn.addEventListener('click', handleSetEta);
    el.notesClose.addEventListener('click', closeNotesModal);

    // Lightbox
    el.lightboxClose.addEventListener('click', closeLightbox);
    el.lightboxModal.addEventListener('click', (e) => { if (e.target === el.lightboxModal) closeLightbox(); });

    // Notes photo click opens lightbox
    el.notesPhotoImg.addEventListener('click', () => {
      const t = tickets.find(t => t.id === notesTicketId);
      if (t && t.photo) openLightbox(t.photo);
    });

    // Escape key closes modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (!el.verifyModal.classList.contains('hidden')) closeVerifyModal();
        if (!el.notesModal.classList.contains('hidden')) closeNotesModal();
        if (!el.lightboxModal.classList.contains('hidden')) closeLightbox();
      }
    });

    // Click outside modals
    el.verifyModal.addEventListener('click', (e) => { if (e.target === el.verifyModal) closeVerifyModal(); });
    el.notesModal.addEventListener('click', (e) => { if (e.target === el.notesModal) closeNotesModal(); });

    // Delegated events for cards
    el.ticketsGrid.addEventListener('click', handleCardClick);
    // Delegated events for staff table
    el.staffTbody.addEventListener('click', handleStaffClick);
  }

  /* ---------- Role Switch ---------- */
  function switchRole(role) {
    if (role === 'staff' && !staffAuthenticated) {
      customDialog({
        icon: '🔒',
        title: 'Staff Authentication',
        message: 'Enter the staff PIN to access the management panel.',
        showInput: true,
        inputType: 'password',
        inputClass: 'pin-input',
        placeholder: '• • • •',
        confirmText: '🔓 Unlock',
      }).then(pin => {
        if (pin === null) return;
        if (pin !== STAFF_PIN) { toast('Invalid PIN. Access denied.'); return; }
        staffAuthenticated = true;
        currentRole = role;
        el.roleBtns.forEach(b => b.classList.toggle('active', b.dataset.role === role));
        el.studentView.classList.toggle('hidden', role !== 'student');
        el.staffView.classList.toggle('hidden', role !== 'staff');
        render();
      });
      return;
    }
    currentRole = role;
    el.roleBtns.forEach(b => b.classList.toggle('active', b.dataset.role === role));
    el.studentView.classList.toggle('hidden', role !== 'student');
    el.staffView.classList.toggle('hidden', role !== 'staff');
    render();
  }

  /* ---------- Dark Mode ---------- */
  function toggleDark() {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    localStorage.setItem('campusfixit_theme', isDark ? 'dark' : 'light');
    updateDarkIcon();
  }
  function updateDarkIcon() { el.darkIcon.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙'; }

  /* ---------- Description Counter ---------- */
  function updateDescCounter() {
    const len = el.description.value.length;
    el.descCounter.textContent = `${len}/500`;
    el.descCounter.classList.remove('near-limit', 'at-limit');
    if (len >= 500) el.descCounter.classList.add('at-limit');
    else if (len >= 400) el.descCounter.classList.add('near-limit');
  }

  /* ---------- Photo ---------- */
  function handlePhotoSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast('Please select an image file'); el.photoInput.value = ''; return; }
    if (file.size > 5 * 1024 * 1024) { toast('Image too large (max 5MB)'); el.photoInput.value = ''; return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      photoData = ev.target.result;
      el.photoPreview.src = photoData;
      el.photoPlaceholder.classList.add('hidden');
      el.photoPreviewWrap.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  }

  function removePhoto(e) {
    e.preventDefault();
    e.stopPropagation();
    photoData = null;
    el.photoInput.value = '';
    el.photoPreview.src = '';
    el.photoPreviewWrap.classList.add('hidden');
    el.photoPlaceholder.classList.remove('hidden');
  }

  /* ---------- Lightbox ---------- */
  function openLightbox(src) {
    el.lightboxImg.src = src;
    el.lightboxModal.classList.remove('hidden');
  }
  function closeLightbox() {
    el.lightboxModal.classList.add('hidden');
    el.lightboxImg.src = '';
  }

  /* ---------- Submit Ticket ---------- */
  function handleSubmit(e) {
    e.preventDefault();
    // Rate limiting
    const now = Date.now();
    if (now - lastSubmitTime < 5000) { toast('Please wait a few seconds before submitting again'); return; }

    const reporter = el.reporter.value.trim();
    const contact = el.contact.value.trim();
    const category = el.category.value;
    const location = el.location.value.trim();
    const priority = el.priority.value;
    const description = el.description.value.trim();

    // Validation
    if (!reporter || reporter.length < 2) { toast('Name must be at least 2 characters'); el.reporter.focus(); return; }
    if (!category) { toast('Please select a category'); el.category.focus(); return; }
    if (!location || location.length < 3) { toast('Location must be at least 3 characters'); el.location.focus(); return; }
    if (!priority) { toast('Please select a priority'); el.priority.focus(); return; }
    if (!description || description.length < 10) { toast('Description must be at least 10 characters'); el.description.focus(); return; }

    const ticket = {
      id: genId(),
      category, location, priority, description,
      reporter,
      contact,
      photo: photoData,
      status: 'Pending',
      assignedTo: null,
      eta: null,
      votes: 0,
      notes: [],
      log: [{ time: now, actor: 'System', text: 'Ticket created' }],
      verifiedRating: null,
      verifiedComment: null,
      createdAt: now
    };

    tickets.unshift(ticket);
    save();
    lastSubmitTime = now;

    // Reset form
    el.form.reset();
    removePhoto({ preventDefault() {}, stopPropagation() {} });
    updateDescCounter();

    toast(`Ticket #${ticket.id} submitted successfully!`);
    render();
  }

  /* ---------- Card Click (delegated) ---------- */
  function handleCardClick(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const id = btn.dataset.id;
    const action = btn.dataset.action;

    if (action === 'verify') openVerifyModal(id);
    else if (action === 'delete') handleDelete(id);
    else if (action === 'upvote') handleVote(id);
    else if (action === 'photo') {
      const t = tickets.find(t => t.id === id);
      if (t && t.photo) openLightbox(t.photo);
    }
  }

  /* ---------- Staff Click (delegated) ---------- */
  function handleStaffClick(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const id = btn.dataset.id;
    const action = btn.dataset.action;

    if (action === 'assign') staffUpdateStatus(id, 'Assigned');
    else if (action === 'progress') staffUpdateStatus(id, 'In Progress');
    else if (action === 'done') staffUpdateStatus(id, 'Fixed');
    else if (action === 'notes') openNotesModal(id);
    else if (action === 'photo') {
      const t = tickets.find(t => t.id === id);
      if (t && t.photo) openLightbox(t.photo);
    }
  }

  /* ---------- Staff Status Update ---------- */
  function staffUpdateStatus(id, newStatus) {
    const staffName = el.staffName.value.trim();
    if (!staffName) { toast('Enter your staff name before taking actions'); el.staffName.focus(); return; }
    const t = tickets.find(t => t.id === id);
    if (!t) return;

    const validTransitions = {
      'Pending': ['Assigned'],
      'Assigned': ['In Progress'],
      'In Progress': ['Fixed'],
      'Reopened': ['Assigned'],
    };
    if (!validTransitions[t.status]?.includes(newStatus)) { toast(`Can't move from ${t.status} to ${newStatus}`); return; }

    if (newStatus === 'Assigned') {
      customDialog({
        icon: '👷',
        title: 'Assign Ticket #' + id,
        message: 'Who should handle this issue?',
        showInput: true,
        placeholder: 'e.g. Maintenance Team A',
        confirmText: '✅ Assign',
      }).then(assignee => {
        if (!assignee || !assignee.trim()) return;
        t.assignedTo = assignee.trim();
        t.status = newStatus;
        t.log.push({ time: Date.now(), actor: staffName, text: `Status → ${newStatus} to ${t.assignedTo}` });
        save();
        toast(`Ticket #${id} → ${newStatus}`);
        render();
      });
      return;
    }
    t.status = newStatus;
    t.log.push({ time: Date.now(), actor: staffName, text: `Status → ${newStatus}` });
    save();
    toast(`Ticket #${id} → ${newStatus}`);
    render();
  }

  /* ---------- Delete Ticket ---------- */
  function handleDelete(id) {
    const t = tickets.find(t => t.id === id);
    if (!t) return;

    if (currentRole === 'student') {
      // Step 1: verify ownership by name
      customDialog({
        icon: '🗑️',
        title: 'Delete Ticket #' + id,
        message: 'Enter your name to confirm you are the original reporter.',
        showInput: true,
        placeholder: 'Your name',
        confirmText: '🗑️ Delete',
        confirmClass: 'btn-verify-reject',
      }).then(enteredName => {
        if (!enteredName || enteredName.trim().toLowerCase() !== t.reporter.toLowerCase()) {
          if (enteredName !== null) toast('Only the original reporter can delete this ticket');
          return;
        }
        // Step 2: final confirmation
        customDialog({
          icon: '⚠️',
          title: 'Are you sure?',
          message: `Ticket #${id} will be permanently deleted.`,
          showInput: false,
          confirmText: 'Yes, Delete',
          confirmClass: 'btn-verify-reject',
        }).then(ok => {
          if (!ok) return;
          tickets = tickets.filter(t => t.id !== id);
          save();
          toast(`Ticket #${id} deleted`);
          render();
        });
      });
    } else {
      // Staff delete — just confirm
      customDialog({
        icon: '⚠️',
        title: 'Delete Ticket #' + id,
        message: 'This action is permanent. Continue?',
        showInput: false,
        confirmText: '🗑️ Delete',
        confirmClass: 'btn-verify-reject',
      }).then(ok => {
        if (!ok) return;
        tickets = tickets.filter(t => t.id !== id);
        save();
        toast(`Ticket #${id} deleted`);
        render();
      });
    }
  }

  /* ---------- Voting ---------- */
  function handleVote(id) {
    const t = tickets.find(t => t.id === id);
    if (!t) return;
    if (voted.has(id)) {
      t.votes = Math.max(0, t.votes - 1);
      voted.delete(id);
    } else {
      t.votes++;
      voted.add(id);
    }
    save();
    saveVoted();
    render();
  }

  /* ---------- Verify Modal ---------- */
  function openVerifyModal(id) {
    const t = tickets.find(t => t.id === id);
    if (!t || t.status !== 'Fixed') { toast('Only "Fixed" tickets can be verified'); return; }
    verifyTicketId = id;
    selectedRating = 0;
    el.modalTicketInfo.textContent = `#${id} — ${t.category} @ ${t.location}`;
    el.verifyComment.value = '';
    $$('.star', el.starRating).forEach(s => s.classList.remove('active'));
    el.verifyModal.classList.remove('hidden');
  }

  function closeVerifyModal() { el.verifyModal.classList.add('hidden'); verifyTicketId = null; }

  function handleVerify(accepted) {
    const t = tickets.find(t => t.id === verifyTicketId);
    if (!t) return;
    if (accepted) {
      if (selectedRating === 0) { toast('Please rate the fix before verifying'); return; }
      t.status = 'Verified';
      t.verifiedRating = selectedRating;
      t.verifiedComment = el.verifyComment.value.trim() || null;
      const stars = '★'.repeat(selectedRating) + '☆'.repeat(5 - selectedRating);
      t.log.push({ time: Date.now(), actor: t.reporter, text: `Verified ${stars}${t.verifiedComment ? ' — ' + t.verifiedComment : ''}` });
      toast(`Ticket #${verifyTicketId} verified! Thank you.`);
    } else {
      t.status = 'Reopened';
      const comment = el.verifyComment.value.trim();
      t.log.push({ time: Date.now(), actor: t.reporter, text: `Reopened${comment ? ' — ' + comment : ''}` });
      toast(`Ticket #${verifyTicketId} reopened for further attention`);
    }
    save();
    closeVerifyModal();
    render();
  }

  /* ---------- Notes Modal ---------- */
  function openNotesModal(id) {
    const t = tickets.find(t => t.id === id);
    if (!t) return;
    notesTicketId = id;
    el.notesTicketInfo.textContent = `#${id} — ${escapeHTML(t.category)} @ ${escapeHTML(t.location)}`;
    el.staffNoteInput.value = '';
    el.etaDate.value = t.eta || '';

    // Photo preview
    if (t.photo) {
      el.notesPhotoImg.src = t.photo;
      el.notesPhotoWrap.classList.remove('hidden');
    } else {
      el.notesPhotoWrap.classList.add('hidden');
    }

    renderActivityLog(t);
    el.notesModal.classList.remove('hidden');
  }

  function closeNotesModal() { el.notesModal.classList.add('hidden'); notesTicketId = null; }

  function handleAddNote() {
    const staffName = el.staffName.value.trim();
    if (!staffName) { toast('Enter your staff name first'); el.staffName.focus(); return; }
    const text = el.staffNoteInput.value.trim();
    if (!text) { toast('Enter a note'); return; }
    if (text.length > 500) { toast('Note too long (max 500 chars)'); return; }

    const t = tickets.find(t => t.id === notesTicketId);
    if (!t) return;
    t.notes.push({ actor: staffName, text, time: Date.now() });
    t.log.push({ time: Date.now(), actor: staffName, text: `Note: ${text}` });
    save();
    el.staffNoteInput.value = '';
    renderActivityLog(t);
    toast('Note added');
  }

  function handleSetEta() {
    const t = tickets.find(t => t.id === notesTicketId);
    if (!t) return;
    const staffName = el.staffName.value.trim();
    if (!staffName) { toast('Enter your staff name first'); el.staffName.focus(); return; }
    const date = el.etaDate.value;
    if (!date) { toast('Select a date'); return; }
    t.eta = date;
    t.log.push({ time: Date.now(), actor: staffName, text: `ETA set to ${date}` });
    save();
    toast(`ETA set to ${date}`);
    renderActivityLog(t);
    render();
  }

  function renderActivityLog(t) {
    // Show latest first
    const logs = [...t.log].reverse();
    el.activityLog.innerHTML = logs.map(l => {
      const isSystem = l.actor === 'System';
      const isNote = l.text.startsWith('Note:');
      let cls = 'log-entry';
      if (isSystem) cls += ' log-system';
      else if (isNote) cls += ' log-note';
      return `<div class="${cls}"><span class="log-time">${formatDate(l.time)}</span><span class="log-actor">${escapeHTML(l.actor)}</span> — ${escapeHTML(l.text)}</div>`;
    }).join('');
  }

  /* ---------- Render ---------- */
  function render() {
    if (currentRole === 'student') renderStudentCards();
    else renderStaffView();
  }

  /* ----- Student Cards ----- */
  function renderStudentCards() {
    let filtered = tickets;

    // Filter
    if (currentFilter !== 'All') filtered = filtered.filter(t => t.status === currentFilter);

    // Search
    if (searchStudent) {
      const q = searchStudent.toLowerCase();
      filtered = filtered.filter(t =>
        t.id.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.location.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.priority.toLowerCase().includes(q) ||
        t.reporter.toLowerCase().includes(q)
      );
    }

    if (!filtered.length) {
      el.ticketsGrid.innerHTML = '<div class="empty-state"><p>🔍 No tickets match your search or filter.</p></div>';
      return;
    }

    el.ticketsGrid.innerHTML = filtered.map(t => {
      const displayName = '🕶️ Anonymous';
      const isVoted = voted.has(t.id);
      const voteClass = t.votes >= 15 ? 'vote-hot' : t.votes >= 8 ? 'vote-warm' : '';
      const labelClass = t.votes >= 15 ? 'vote-label vote-hot' : t.votes >= 8 ? 'vote-label vote-warm' : 'vote-label';
      const voteLabel = t.votes >= 15 ? '🔥 Trending' : t.votes >= 8 ? '⚡ Popular' : `${t.votes} vote${t.votes !== 1 ? 's' : ''}`;
      const statusCls = `status-${t.status.replace(/\s/g, '-')}`;

      let photoHTML = '';
      if (t.photo) {
        photoHTML = `<img class="card-photo" src="${t.photo}" alt="Issue photo" data-action="photo" data-id="${escapeHTML(t.id)}" />`;
      }

      let etaHTML = '';
      if (t.eta) etaHTML = `<div class="card-eta">📅 ETA: ${escapeHTML(t.eta)}</div>`;

      let assignedHTML = '';
      if (t.assignedTo) assignedHTML = `<div class="card-assigned">👷 ${escapeHTML(t.assignedTo)}</div>`;

      let verifyBtn = '';
      if (t.status === 'Fixed') verifyBtn = `<button class="btn-verify" data-action="verify" data-id="${escapeHTML(t.id)}">✅ Verify Fix</button>`;

      let verifiedStamp = '';
      if (t.status === 'Verified' && t.verifiedRating) {
        const stars = '★'.repeat(t.verifiedRating) + '☆'.repeat(5 - t.verifiedRating);
        verifiedStamp = `<div class="verified-stamp">✅ Verified <span class="star-display">${stars}</span></div>`;
      }

      let deleteBtn = '';
      if (t.status === 'Pending') deleteBtn = `<button class="delete-btn" data-action="delete" data-id="${escapeHTML(t.id)}" title="Delete">🗑️</button>`;

      return `
        <div class="ticket-card priority-${escapeHTML(t.priority)}">
          <div class="card-top">
            <span class="ticket-id">#${escapeHTML(t.id)}</span>
            <span class="ticket-time">${timeAgo(t.createdAt)}</span>
          </div>
          <div class="card-category">${escapeHTML(t.category)}</div>
          <div class="card-location">📍 ${escapeHTML(t.location)}</div>
          <div class="card-reporter">by ${displayName}</div>
          <div class="card-desc">${escapeHTML(t.description)}</div>
          ${photoHTML}
          ${etaHTML}
          ${assignedHTML}
          <div class="card-vote-row">
            <button class="btn-upvote ${isVoted ? 'voted' : ''} ${voteClass}" data-action="upvote" data-id="${escapeHTML(t.id)}">
              <span class="upvote-arrow">▲</span>
              <span class="upvote-count">${t.votes}</span>
            </button>
            <span class="${labelClass}">${voteLabel}</span>
          </div>
          <div class="card-bottom">
            <span class="status-badge ${statusCls}">${escapeHTML(t.status)}</span>
            <div style="display:flex;gap:8px;align-items:center;">
              ${verifyBtn}
              ${verifiedStamp}
              ${deleteBtn}
            </div>
          </div>
        </div>`;
    }).join('');
  }

  /* ----- Staff View ----- */
  function renderStaffView() {
    updateStats();
    renderStaffTable();
  }

  function updateStats() {
    el.statTotal.textContent = tickets.length;
    el.statPending.textContent = tickets.filter(t => t.status === 'Pending' || t.status === 'Reopened').length;
    el.statProgress.textContent = tickets.filter(t => t.status === 'In Progress' || t.status === 'Assigned').length;
    el.statFixed.textContent = tickets.filter(t => t.status === 'Fixed').length;
    el.statVerified.textContent = tickets.filter(t => t.status === 'Verified').length;
  }

  function renderStaffTable() {
    let filtered = tickets;

    // Filter
    if (staffFilter !== 'All') filtered = filtered.filter(t => t.status === staffFilter);

    // Search
    if (searchStaff) {
      const q = searchStaff.toLowerCase();
      filtered = filtered.filter(t =>
        t.id.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.location.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.reporter.toLowerCase().includes(q) ||
        (t.assignedTo || '').toLowerCase().includes(q) ||
        (t.contact || '').toLowerCase().includes(q)
      );
    }

    // Sort
    const priorityOrder = { High: 0, Medium: 1, Low: 2 };
    if (sortMode === 'newest') filtered.sort((a, b) => b.createdAt - a.createdAt);
    else if (sortMode === 'oldest') filtered.sort((a, b) => a.createdAt - b.createdAt);
    else if (sortMode === 'priority') filtered.sort((a, b) => (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9));
    else if (sortMode === 'votes') filtered.sort((a, b) => b.votes - a.votes);

    if (!filtered.length) {
      el.staffTbody.innerHTML = '';
      el.staffEmpty.classList.remove('hidden');
      return;
    }
    el.staffEmpty.classList.add('hidden');

    el.staffTbody.innerHTML = filtered.map(t => {
      const statusCls = `status-${t.status.replace(/\s/g, '-')}`;
      const voteClass = t.votes >= 15 ? 'vote-hot' : t.votes >= 8 ? 'vote-warm' : '';

      // Action buttons based on status
      let actions = '';
      if (t.status === 'Pending' || t.status === 'Reopened') actions += `<button class="action-btn assign" data-action="assign" data-id="${escapeHTML(t.id)}">Assign</button>`;
      if (t.status === 'Assigned') actions += `<button class="action-btn progress" data-action="progress" data-id="${escapeHTML(t.id)}">Start</button>`;
      if (t.status === 'In Progress') actions += `<button class="action-btn done" data-action="done" data-id="${escapeHTML(t.id)}">Mark Fixed</button>`;
      actions += `<button class="action-btn notes" data-action="notes" data-id="${escapeHTML(t.id)}">Notes</button>`;

      const photoCell = t.photo
        ? `<img class="table-photo" src="${t.photo}" alt="Photo" data-action="photo" data-id="${escapeHTML(t.id)}" />`
        : '<span style="color:var(--text-muted)">—</span>';

      const reporterDisplay = escapeHTML(t.reporter);

      return `<tr>
        <td><span class="ticket-id">#${escapeHTML(t.id)}</span></td>
        <td>${escapeHTML(t.category)}</td>
        <td>${escapeHTML(t.location)}</td>
        <td><span class="priority-dot ${escapeHTML(t.priority)}"></span>${escapeHTML(t.priority)}</td>
        <td>${reporterDisplay}</td>
        <td>${escapeHTML(t.contact || '—')}</td>
        <td><span class="status-badge ${statusCls}">${escapeHTML(t.status)}</span></td>
        <td>${escapeHTML(t.assignedTo || '—')}</td>
        <td>${t.eta ? escapeHTML(t.eta) : '—'}</td>
        <td class="vote-cell"><span class="vote-count-badge ${voteClass}">▲ ${t.votes}</span></td>
        <td>${photoCell}</td>
        <td>${timeAgo(t.createdAt)}</td>
        <td><div class="staff-actions">${actions}</div></td>
      </tr>`;
    }).join('');
  }

  /* ---------- Start ---------- */
  init();
})();
