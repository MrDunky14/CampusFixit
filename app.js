/* ============================================================
   CampusFixit — Application Logic (v2)
   Staff Panel · Verification Workflow · Activity Logs
   ============================================================ */

(() => {
  'use strict';

  // ──── Constants ────
  const STORAGE_KEY = 'campusfixit_tickets';
  const THEME_KEY   = 'campusfixit_theme';
  const STAFF_KEY   = 'campusfixit_staff_name';
  const STAFF_PIN   = '1234';  // Default staff PIN — change for production
  const VOTED_KEY    = 'campusfixit_voted';
  const MAX_NAME_LEN     = 60;
  const MAX_LOCATION_LEN = 100;
  const MAX_DESC_LEN     = 500;
  const SUBMIT_COOLDOWN  = 5000;  // ms between submissions
  let lastSubmitTime = 0;
  let staffAuthenticated = false;

  const MOCK_LOCATIONS = [
    'Lab 4, Block B', 'Room 201, Block A', 'Lecture Hall 3, Block C',
    'Library, 2nd Floor', 'Cafeteria, Ground Floor', 'Admin Office, Block D',
    'Computer Lab 2, Block B', 'Workshop 1, Block E',
    'Seminar Room 5, Block A', 'Room 302, Block C',
  ];

  // Status flow: Pending → Assigned → In Progress → Fixed → Verified
  //                                                    ↘ Reopened → (back to Pending)

  // ──── DOM References ────
  // Student
  const form          = document.getElementById('ticket-form');
  const reporterEl    = document.getElementById('reporter');
  const categoryEl    = document.getElementById('category');
  const locationEl    = document.getElementById('location');
  const priorityEl    = document.getElementById('priority');
  const descriptionEl = document.getElementById('description');
  const scanQrBtn     = document.getElementById('scan-qr');
  const ticketsGrid   = document.getElementById('tickets-grid');
  const emptyState    = document.getElementById('empty-state');
  const studentFilters = document.querySelectorAll('#student-filters .filter-btn');

  // Staff
  const staffTbody    = document.getElementById('staff-tbody');
  const staffEmpty    = document.getElementById('staff-empty');
  const staffNameEl   = document.getElementById('staff-name');
  const staffFilters  = document.querySelectorAll('#staff-filters .filter-btn');

  // Stats
  const statTotal    = document.getElementById('stat-total');
  const statPending  = document.getElementById('stat-pending');
  const statProgress = document.getElementById('stat-progress');
  const statFixed    = document.getElementById('stat-fixed');
  const statVerified = document.getElementById('stat-verified');

  // Views & Role
  const studentView  = document.getElementById('student-view');
  const staffView    = document.getElementById('staff-view');
  const roleBtns     = document.querySelectorAll('.role-btn');

  // Dark mode
  const darkToggle   = document.getElementById('dark-toggle');
  const darkIcon     = document.getElementById('dark-icon');

  // Toast
  const toastContainer = document.getElementById('toast-container');

  // Verify modal
  const verifyModal      = document.getElementById('verify-modal');
  const modalTicketInfo  = document.getElementById('modal-ticket-info');
  const verifyComment    = document.getElementById('verify-comment');
  const starRating       = document.getElementById('star-rating');
  const verifyAcceptBtn  = document.getElementById('verify-accept');
  const verifyRejectBtn  = document.getElementById('verify-reject');
  const verifyCancelBtn  = document.getElementById('verify-cancel');

  // Notes modal
  const notesModal       = document.getElementById('notes-modal');
  const notesTicketInfo  = document.getElementById('notes-ticket-info');
  const staffNoteInput   = document.getElementById('staff-note-input');
  const addNoteBtn       = document.getElementById('add-note-btn');
  const activityLog      = document.getElementById('activity-log');
  const notesCloseBtn    = document.getElementById('notes-close');

  // ──── Seed Data ────
  const SEED_DATA = [
    {
      id: '#TCKT-9B2A', category: '💻 IT/Projector', location: 'Lecture Hall 3, Block C',
      priority: 'High', reporter: 'Arjun Mehta',
      description: 'Projector displays a flickering image and sometimes shuts off mid-lecture. Already tried restarting it twice.',
      status: 'Pending', assignedTo: '', createdAt: new Date(Date.now() - 1000*60*12).toISOString(),
      log: [{ time: new Date(Date.now() - 1000*60*12).toISOString(), actor: 'Arjun Mehta', text: 'Ticket created', type: 'system' }],
      rating: 0, verifyComment: '', votes: 12,
    },
    {
      id: '#TCKT-4FX7', category: '❄️ AC/Ventilation', location: 'Room 201, Block A',
      priority: 'Medium', reporter: 'Priya Sharma',
      description: 'AC unit is blowing warm air. Temperature in the room is around 32 °C. Students unable to focus.',
      status: 'Assigned', assignedTo: 'Rajesh Kumar', createdAt: new Date(Date.now() - 1000*60*45).toISOString(),
      log: [
        { time: new Date(Date.now() - 1000*60*45).toISOString(), actor: 'Priya Sharma', text: 'Ticket created', type: 'system' },
        { time: new Date(Date.now() - 1000*60*30).toISOString(), actor: 'Rajesh Kumar', text: 'Assigned to self', type: 'system' },
      ],
      rating: 0, verifyComment: '', votes: 7,
    },
    {
      id: '#TCKT-L8QW', category: '🪑 Furniture', location: 'Library, 2nd Floor',
      priority: 'Low', reporter: 'Sneha Patel',
      description: 'Two chairs near the group-study table have broken armrests. Not urgent but could be a safety hazard.',
      status: 'Fixed', assignedTo: 'Anil Verma', votes: 3, createdAt: new Date(Date.now() - 1000*60*60*3).toISOString(),
      log: [
        { time: new Date(Date.now() - 1000*60*60*3).toISOString(), actor: 'Sneha Patel', text: 'Ticket created', type: 'system' },
        { time: new Date(Date.now() - 1000*60*60*2).toISOString(), actor: 'Anil Verma', text: 'Assigned to self', type: 'system' },
        { time: new Date(Date.now() - 1000*60*60*1.5).toISOString(), actor: 'Anil Verma', text: 'Started work', type: 'system' },
        { time: new Date(Date.now() - 1000*60*60).toISOString(), actor: 'Anil Verma', text: 'Replaced both armrests. Chairs are good to use.', type: 'note' },
        { time: new Date(Date.now() - 1000*60*55).toISOString(), actor: 'Anil Verma', text: 'Marked as Fixed — awaiting student verification', type: 'system' },
      ],
      rating: 0, verifyComment: '',
    },
    {
      id: '#TCKT-P3MN', category: '📶 WiFi/Network', location: 'Cafeteria, Ground Floor',
      priority: 'High', reporter: 'Rahul Gupta',
      description: 'WiFi keeps dropping every 5 minutes. Multiple students and staff affected. Tried reconnecting — same issue.',
      status: 'In Progress', assignedTo: 'Deepak IT', votes: 24, createdAt: new Date(Date.now() - 1000*60*25).toISOString(),
      log: [
        { time: new Date(Date.now() - 1000*60*25).toISOString(), actor: 'Rahul Gupta', text: 'Ticket created', type: 'system' },
        { time: new Date(Date.now() - 1000*60*20).toISOString(), actor: 'Deepak IT', text: 'Assigned to self', type: 'system' },
        { time: new Date(Date.now() - 1000*60*15).toISOString(), actor: 'Deepak IT', text: 'Started work', type: 'system' },
        { time: new Date(Date.now() - 1000*60*10).toISOString(), actor: 'Deepak IT', text: 'Checking router logs. Possible firmware issue.', type: 'note' },
      ],
      rating: 0, verifyComment: '',
    },
    {
      id: '#TCKT-7RKJ', category: '💡 Lighting', location: 'Computer Lab 2, Block B',
      priority: 'Medium', reporter: 'Kavya Nair',
      description: 'Three fluorescent tube lights are flickering constantly, causing eye strain during evening lab sessions.',
      status: 'Assigned', assignedTo: 'Suresh Electricals', createdAt: new Date(Date.now() - 1000*60*60).toISOString(),
      log: [
        { time: new Date(Date.now() - 1000*60*60).toISOString(), actor: 'Kavya Nair', text: 'Ticket created', type: 'system' },
        { time: new Date(Date.now() - 1000*60*50).toISOString(), actor: 'Suresh Electricals', text: 'Assigned to self', type: 'system' },
      ],
      rating: 0, verifyComment: '', votes: 5,
    },
    {
      id: '#TCKT-2VZD', category: '🚿 Plumbing', location: 'Admin Office, Block D',
      priority: 'High', reporter: 'Meena Iyer',
      description: 'Washroom tap on the 1st floor is leaking non-stop. Water pooling on the floor — slip hazard.',
      status: 'Pending', assignedTo: '', createdAt: new Date(Date.now() - 1000*60*8).toISOString(),
      log: [{ time: new Date(Date.now() - 1000*60*8).toISOString(), actor: 'Meena Iyer', text: 'Ticket created', type: 'system' }],
      rating: 0, verifyComment: '', votes: 18,
    },
    {
      id: '#TCKT-BNXC', category: '🔌 Electrical', location: 'Workshop 1, Block E',
      priority: 'High', reporter: 'Vikram Singh',
      description: 'Power socket near workstation 4 is sparking when plugs are inserted. Please cut the breaker and inspect.',
      status: 'In Progress', assignedTo: 'Suresh Electricals', votes: 9, createdAt: new Date(Date.now() - 1000*60*90).toISOString(),
      log: [
        { time: new Date(Date.now() - 1000*60*90).toISOString(), actor: 'Vikram Singh', text: 'Ticket created', type: 'system' },
        { time: new Date(Date.now() - 1000*60*80).toISOString(), actor: 'Suresh Electricals', text: 'Assigned to self', type: 'system' },
        { time: new Date(Date.now() - 1000*60*70).toISOString(), actor: 'Suresh Electricals', text: 'Started work — breaker has been turned off', type: 'system' },
        { time: new Date(Date.now() - 1000*60*50).toISOString(), actor: 'Suresh Electricals', text: 'Internal wiring damaged. Replacing socket unit.', type: 'note' },
      ],
      rating: 0, verifyComment: '',
    },
    {
      id: '#TCKT-6GTH', category: '🧹 Cleaning', location: 'Seminar Room 5, Block A',
      priority: 'Low', reporter: 'Ananya Das',
      description: 'Room was not cleaned after a workshop yesterday. Dusty tables, leftover food wrappers on the floor.',
      status: 'Verified', assignedTo: 'Housekeeping Team', votes: 2, createdAt: new Date(Date.now() - 1000*60*60*5).toISOString(),
      log: [
        { time: new Date(Date.now() - 1000*60*60*5).toISOString(), actor: 'Ananya Das', text: 'Ticket created', type: 'system' },
        { time: new Date(Date.now() - 1000*60*60*4).toISOString(), actor: 'Housekeeping Team', text: 'Assigned to self', type: 'system' },
        { time: new Date(Date.now() - 1000*60*60*3.5).toISOString(), actor: 'Housekeeping Team', text: 'Started work', type: 'system' },
        { time: new Date(Date.now() - 1000*60*60*3).toISOString(), actor: 'Housekeeping Team', text: 'Room fully cleaned and sanitized.', type: 'note' },
        { time: new Date(Date.now() - 1000*60*60*2.8).toISOString(), actor: 'Housekeeping Team', text: 'Marked as Fixed — awaiting verification', type: 'system' },
        { time: new Date(Date.now() - 1000*60*60*2).toISOString(), actor: 'Ananya Das', text: 'Verified ✅ — Room looks great! (Rating: ★★★★★)', type: 'system' },
      ],
      rating: 5, verifyComment: 'Room looks great!',
    },
  ];

  // ──── State ────
  let tickets         = loadTickets();
  let activeRole      = 'student';
  let studentFilter   = 'All';
  let staffFilter     = 'All';
  let verifyingTicketId = null;
  let selectedRating  = 0;
  let notesTicketId   = null;

  // Seed on first visit
  if (tickets.length === 0) {
    tickets = JSON.parse(JSON.stringify(SEED_DATA));
    saveTickets();
  }

  // --- Reset dummy data ---
  const resetBtn = document.getElementById('reset-data-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (!confirm('⚠️ This will erase ALL current tickets and load fresh demo data. Continue?')) return;
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(VOTED_KEY);
      tickets = JSON.parse(JSON.stringify(SEED_DATA));
      saveTickets();
      renderAll();
      showToast('🔄 Demo data refreshed!');
    });
  }

  // Restore staff name
  staffNameEl.value = localStorage.getItem(STAFF_KEY) || '';
  staffNameEl.addEventListener('input', () => {
    localStorage.setItem(STAFF_KEY, staffNameEl.value.trim());
  });

  // --- Description character counter ---
  const descCounter = document.getElementById('desc-counter');
  if (descriptionEl && descCounter) {
    descriptionEl.addEventListener('input', () => {
      const len = descriptionEl.value.length;
      descCounter.textContent = `${len}/${MAX_DESC_LEN}`;
      descCounter.classList.toggle('near-limit', len >= MAX_DESC_LEN * 0.8 && len < MAX_DESC_LEN);
      descCounter.classList.toggle('at-limit', len >= MAX_DESC_LEN);
    });
  }

  // ──── Init ────
  applyTheme();
  renderAll();

  // ============================================================
  //  EVENT LISTENERS
  // ============================================================

  // --- Role switching (staff requires PIN) ---
  roleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetRole = btn.dataset.role;

      if (targetRole === 'staff' && !staffAuthenticated) {
        const pin = prompt('🔒 Enter Staff PIN to access the panel:');
        if (pin !== STAFF_PIN) {
          showToast('❌ Incorrect PIN. Access denied.');
          return;
        }
        staffAuthenticated = true;
        showToast('✅ Staff access granted');
      }

      roleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeRole = targetRole;
      if (activeRole === 'student') {
        studentView.classList.remove('hidden');
        staffView.classList.add('hidden');
      } else {
        studentView.classList.add('hidden');
        staffView.classList.remove('hidden');
      }
      renderAll();
    });
  });

  // --- Dark mode ---
  darkToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    darkIcon.textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
  });

  // --- Student: submit (with validation & rate-limiting) ---
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Rate limiting
    const now = Date.now();
    if (now - lastSubmitTime < SUBMIT_COOLDOWN) {
      const wait = Math.ceil((SUBMIT_COOLDOWN - (now - lastSubmitTime)) / 1000);
      showToast(`⏳ Please wait ${wait}s before submitting again.`);
      return;
    }

    // Input validation
    const reporter = reporterEl.value.trim().slice(0, MAX_NAME_LEN);
    const location = locationEl.value.trim().slice(0, MAX_LOCATION_LEN);
    const description = descriptionEl.value.trim().slice(0, MAX_DESC_LEN);

    if (!reporter || reporter.length < 2) {
      showToast('❌ Name must be at least 2 characters.');
      reporterEl.focus();
      return;
    }
    if (!location || location.length < 3) {
      showToast('❌ Location must be at least 3 characters.');
      locationEl.focus();
      return;
    }
    if (!description || description.length < 10) {
      showToast('❌ Description must be at least 10 characters.');
      descriptionEl.focus();
      return;
    }

    const ticket = {
      id:          generateId(),
      category:    categoryEl.value,
      location:    location,
      priority:    priorityEl.value,
      reporter:    reporter,
      description: description,
      status:      'Pending',
      assignedTo:  '',
      createdAt:   new Date().toISOString(),
      log:         [{ time: new Date().toISOString(), actor: reporter, text: 'Ticket created', type: 'system' }],
      rating:      0,
      verifyComment: '',
      votes:       0,
    };
    tickets.unshift(ticket);
    saveTickets();
    lastSubmitTime = Date.now();
    renderAll();
    form.reset();
    showToast(`✅ Ticket ${ticket.id} submitted!`);
  });

  // --- QR scan mock ---
  scanQrBtn.addEventListener('click', () => {
    scanQrBtn.classList.add('scanning');
    scanQrBtn.innerHTML = '<span class="qr-spinner"></span> Scanning…';
    setTimeout(() => {
      const loc = MOCK_LOCATIONS[Math.floor(Math.random() * MOCK_LOCATIONS.length)];
      locationEl.value = loc;
      scanQrBtn.classList.remove('scanning');
      scanQrBtn.innerHTML = '📷 Scan QR';
      showToast(`📍 Location detected: ${loc}`);
    }, 1200);
  });

  // --- Student filters ---
  studentFilters.forEach(btn => {
    btn.addEventListener('click', () => {
      studentFilters.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      studentFilter = btn.dataset.filter;
      renderStudentDashboard();
    });
  });

  // --- Staff filters ---
  staffFilters.forEach(btn => {
    btn.addEventListener('click', () => {
      staffFilters.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      staffFilter = btn.dataset.filter;
      renderStaffTable();
    });
  });

  // --- Student card actions (verify, delete, upvote) ---
  ticketsGrid.addEventListener('click', (e) => {
    const verifyBtn = e.target.closest('.btn-verify');
    if (verifyBtn) {
      openVerifyModal(verifyBtn.dataset.ticketId);
      return;
    }
    const upvoteBtn = e.target.closest('.btn-upvote');
    if (upvoteBtn) {
      const ticketId = upvoteBtn.dataset.ticketId;
      const ticket = tickets.find(t => t.id === ticketId);
      if (ticket) {
        // Check if already voted (stored in a separate localStorage key)
        const votedSet = getVotedSet();
        if (votedSet.has(ticketId)) {
          // Un-vote
          ticket.votes = Math.max(0, (ticket.votes || 0) - 1);
          votedSet.delete(ticketId);
          saveVotedSet(votedSet);
          showToast(`👎 Vote removed from ${ticketId}`);
        } else {
          // Upvote
          ticket.votes = (ticket.votes || 0) + 1;
          votedSet.add(ticketId);
          saveVotedSet(votedSet);
          showToast(`👍 Upvoted ${ticketId} — ${ticket.votes} votes`);
        }
        saveTickets();
        renderAll();
      }
      return;
    }
    const delBtn = e.target.closest('.delete-btn');
    if (delBtn) {
      const ticketId = delBtn.dataset.ticketId;
      const ticket = tickets.find(t => t.id === ticketId);
      if (!ticket) return;

      // Ownership check: only the reporter (or staff) can delete
      const currentName = reporterEl.value.trim().toLowerCase();
      if (activeRole === 'student' && ticket.reporter.toLowerCase() !== currentName) {
        showToast('❌ You can only delete your own tickets. Enter your name in the form.');
        return;
      }

      if (!confirm(`Delete ticket ${ticketId}? This cannot be undone.`)) return;

      tickets = tickets.filter(t => t.id !== ticketId);
      saveTickets();
      renderAll();
      showToast(`🗑️ Ticket ${ticketId} deleted`);
    }
  });

  // --- Staff table actions (delegated) ---
  document.getElementById('staff-table').addEventListener('click', (e) => {
    const btn = e.target.closest('.action-btn');
    if (!btn) return;
    const id = btn.dataset.ticketId;
    const action = btn.dataset.action;
    const ticket = tickets.find(t => t.id === id);
    if (!ticket) return;

    const staffName = staffNameEl.value.trim();
    if (!staffName) {
      showToast('❌ Please enter your name in the Staff Name field first.');
      staffNameEl.focus();
      return;
    }

    switch (action) {
      case 'assign':
        ticket.status = 'Assigned';
        ticket.assignedTo = staffName;
        addLog(ticket, staffName, 'Assigned to self', 'system');
        showToast(`📌 ${id} assigned to ${staffName}`);
        break;
      case 'progress':
        ticket.status = 'In Progress';
        addLog(ticket, staffName, 'Started work', 'system');
        showToast(`🔨 ${id} → In Progress`);
        break;
      case 'done':
        ticket.status = 'Fixed';
        addLog(ticket, staffName, 'Marked as Fixed — awaiting student verification', 'system');
        showToast(`✅ ${id} → Fixed (awaiting verification)`);
        break;
      case 'notes':
        openNotesModal(id);
        return;
    }

    saveTickets();
    renderAll();
  });

  // ============================================================
  //  VERIFY MODAL
  // ============================================================

  function openVerifyModal(ticketId) {
    verifyingTicketId = ticketId;
    selectedRating = 0;
    const t = tickets.find(t => t.id === ticketId);
    modalTicketInfo.textContent = `${t.id} — ${t.category} @ ${t.location}`;
    verifyComment.value = '';
    starRating.querySelectorAll('.star').forEach(s => s.classList.remove('active'));
    verifyModal.classList.remove('hidden');
  }

  // Star rating interaction
  starRating.addEventListener('click', (e) => {
    const star = e.target.closest('.star');
    if (!star) return;
    selectedRating = parseInt(star.dataset.val);
    starRating.querySelectorAll('.star').forEach(s => {
      s.classList.toggle('active', parseInt(s.dataset.val) <= selectedRating);
    });
  });

  starRating.addEventListener('mouseover', (e) => {
    const star = e.target.closest('.star');
    if (!star) return;
    const val = parseInt(star.dataset.val);
    starRating.querySelectorAll('.star').forEach(s => {
      s.classList.toggle('active', parseInt(s.dataset.val) <= val);
    });
  });

  starRating.addEventListener('mouseleave', () => {
    starRating.querySelectorAll('.star').forEach(s => {
      s.classList.toggle('active', parseInt(s.dataset.val) <= selectedRating);
    });
  });

  verifyAcceptBtn.addEventListener('click', () => {
    const t = tickets.find(t => t.id === verifyingTicketId);
    if (!t) return;
    t.status = 'Verified';
    t.rating = selectedRating;
    t.verifyComment = verifyComment.value.trim();
    const ratingStr = selectedRating > 0 ? ` (Rating: ${'★'.repeat(selectedRating)}${'☆'.repeat(5 - selectedRating)})` : '';
    const commentStr = t.verifyComment ? ` — ${t.verifyComment}` : '';
    addLog(t, t.reporter, `Verified ✅${commentStr}${ratingStr}`, 'system');
    saveTickets();
    verifyModal.classList.add('hidden');
    renderAll();
    showToast(`✅ ${t.id} verified! Thank you.`);
  });

  verifyRejectBtn.addEventListener('click', () => {
    const t = tickets.find(t => t.id === verifyingTicketId);
    if (!t) return;
    t.status = 'Reopened';
    const commentStr = verifyComment.value.trim() ? ` — ${verifyComment.value.trim()}` : '';
    addLog(t, t.reporter, `Reopened 🔄 Issue not resolved${commentStr}`, 'system');
    saveTickets();
    verifyModal.classList.add('hidden');
    renderAll();
    showToast(`🔄 ${t.id} reopened — staff will be notified.`);
  });

  verifyCancelBtn.addEventListener('click', () => {
    verifyModal.classList.add('hidden');
  });

  // Close modal on backdrop click
  verifyModal.addEventListener('click', (e) => {
    if (e.target === verifyModal) verifyModal.classList.add('hidden');
  });

  // --- Keyboard: Escape to close modals ---
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!verifyModal.classList.contains('hidden')) verifyModal.classList.add('hidden');
      if (!notesModal.classList.contains('hidden')) notesModal.classList.add('hidden');
    }
  });

  // ============================================================
  //  NOTES MODAL
  // ============================================================

  function openNotesModal(ticketId) {
    notesTicketId = ticketId;
    const t = tickets.find(t => t.id === ticketId);
    notesTicketInfo.textContent = `${t.id} — ${t.category} @ ${t.location}`;
    staffNoteInput.value = '';
    renderActivityLog(t);
    notesModal.classList.remove('hidden');
  }

  addNoteBtn.addEventListener('click', () => {
    const text = staffNoteInput.value.trim().slice(0, 500);
    if (!text) {
      showToast('❌ Note cannot be empty.');
      return;
    }
    const t = tickets.find(t => t.id === notesTicketId);
    if (!t) return;
    const staffName = staffNameEl.value.trim();
    if (!staffName) {
      showToast('❌ Enter your name in the Staff Name field first.');
      return;
    }
    addLog(t, staffName, text, 'note');
    saveTickets();
    staffNoteInput.value = '';
    renderActivityLog(t);
    showToast('📝 Note added');
  });

  notesCloseBtn.addEventListener('click', () => {
    notesModal.classList.add('hidden');
  });

  notesModal.addEventListener('click', (e) => {
    if (e.target === notesModal) notesModal.classList.add('hidden');
  });

  function renderActivityLog(ticket) {
    if (!ticket.log || ticket.log.length === 0) {
      activityLog.innerHTML = '<p style="color:var(--text-muted);font-size:.85rem;">No activity yet.</p>';
      return;
    }
    // Staff sees everything; students see only system logs (not staff notes)
    const visibleLog = activeRole === 'staff'
      ? ticket.log
      : ticket.log.filter(entry => entry.type !== 'note');

    if (visibleLog.length === 0) {
      activityLog.innerHTML = '<p style="color:var(--text-muted);font-size:.85rem;">No activity yet.</p>';
      return;
    }
    activityLog.innerHTML = [...visibleLog].reverse().map(entry => `
      <div class="log-entry log-${entry.type}">
        <span class="log-time">${formatTime(entry.time)}</span>
        <span class="log-actor">${escapeHTML(entry.actor)}</span>:
        <span class="log-text">${escapeHTML(entry.text)}</span>
      </div>
    `).join('');
  }

  // ============================================================
  //  RENDER FUNCTIONS
  // ============================================================

  function renderAll() {
    renderStudentDashboard();
    renderStaffTable();
    renderStats();
  }

  // --- Student Dashboard ---
  function renderStudentDashboard() {
    const filtered = studentFilter === 'All'
      ? tickets
      : tickets.filter(t => t.status === studentFilter);

    ticketsGrid.querySelectorAll('.ticket-card').forEach(c => c.remove());

    if (filtered.length === 0) {
      emptyState.style.display = '';
      return;
    }
    emptyState.style.display = 'none';

    filtered.forEach(t => {
      const card = document.createElement('div');
      card.className = `ticket-card priority-${t.priority}`;

      // Build bottom-right actions
      let actionsHTML = '';
      if (t.status === 'Fixed') {
        actionsHTML = `<button class="btn-verify" data-ticket-id="${escapeHTML(t.id)}">🔍 Verify Fix</button>`;
      } else if (t.status === 'Verified') {
        const stars = t.rating > 0 ? `<span class="star-display">${'★'.repeat(t.rating)}${'☆'.repeat(5 - t.rating)}</span>` : '';
        actionsHTML = `<span class="verified-stamp">✅ Verified ${stars}</span>`;
      }

      const assignedHTML = t.assignedTo
        ? `<div class="card-assigned">🔧 ${escapeHTML(t.assignedTo)}</div>`
        : '';

      const statusClass = t.status.replace(/\s/g, '-');
      const voteCount = t.votes || 0;
      const votedSet = getVotedSet();
      const hasVoted = votedSet.has(t.id);
      const hotClass = voteCount >= 10 ? ' vote-hot' : voteCount >= 5 ? ' vote-warm' : '';

      const safeId = escapeHTML(t.id);
      const safeCategory = escapeHTML(t.category);
      const safeStatus = escapeHTML(t.status);

      card.innerHTML = `
        <div class="card-top">
          <span class="ticket-id">${safeId}</span>
          <span class="ticket-time">${formatTime(t.createdAt)}</span>
        </div>
        <div class="card-category">${safeCategory}</div>
        <div class="card-location">📌 ${escapeHTML(t.location)}</div>
        <div class="card-reporter">👤 Reported by ${escapeHTML(t.reporter)}</div>
        ${assignedHTML}
        <p class="card-desc">${escapeHTML(t.description)}</p>
        <div class="card-vote-row">
          <button class="btn-upvote${hasVoted ? ' voted' : ''}${hotClass}" data-ticket-id="${safeId}" title="${hasVoted ? 'Remove vote' : 'Upvote this issue'}">
            <span class="upvote-arrow">▲</span>
            <span class="upvote-count">${voteCount}</span>
          </button>
          <span class="vote-label${hotClass}">${voteCount >= 10 ? '🔥 Hot Issue' : voteCount >= 5 ? '⚠️ Gaining attention' : 'Upvote if affected'}</span>
        </div>
        <div class="card-bottom">
          <span class="status-badge status-${statusClass}">${safeStatus}</span>
          <div style="display:flex;align-items:center;gap:6px;">
            ${actionsHTML}
            <button class="delete-btn" data-ticket-id="${safeId}" title="Delete ticket">🗑️</button>
          </div>
        </div>
      `;

      ticketsGrid.appendChild(card);
    });
  }

  // --- Staff Table ---
  function renderStaffTable() {
    const filtered = staffFilter === 'All'
      ? tickets
      : tickets.filter(t => t.status === staffFilter);

    staffTbody.innerHTML = '';

    if (filtered.length === 0) {
      staffEmpty.style.display = '';
      document.getElementById('staff-table').style.display = 'none';
      return;
    }
    staffEmpty.style.display = 'none';
    document.getElementById('staff-table').style.display = '';

    filtered.forEach(t => {
      const tr = document.createElement('tr');
      const statusClass = t.status.replace(/\s/g, '-');

      // Determine available actions based on status
      let actionsHTML = '';
      const escapedId = escapeHTML(t.id);
      if (t.status === 'Pending' || t.status === 'Reopened') {
        actionsHTML += `<button class="action-btn assign" data-ticket-id="${escapedId}" data-action="assign">📌 Assign</button>`;
      }
      if (t.status === 'Assigned') {
        actionsHTML += `<button class="action-btn progress" data-ticket-id="${escapedId}" data-action="progress">▶ Start</button>`;
      }
      if (t.status === 'In Progress') {
        actionsHTML += `<button class="action-btn done" data-ticket-id="${escapedId}" data-action="done">✅ Mark Done</button>`;
      }
      actionsHTML += `<button class="action-btn notes" data-ticket-id="${escapedId}" data-action="notes">📝 Notes</button>`;

      const voteCount = t.votes || 0;
      const hotBadge = voteCount >= 10 ? ' 🔥' : voteCount >= 5 ? ' ⚠️' : '';

      const safeId = escapeHTML(t.id);
      const safePriority = escapeHTML(t.priority);
      const safeCategory = escapeHTML(t.category);
      const safeStatus = escapeHTML(t.status);

      tr.innerHTML = `
        <td><span class="ticket-id">${safeId}</span></td>
        <td>${safeCategory}</td>
        <td>${escapeHTML(t.location)}</td>
        <td><span class="priority-dot ${safePriority}"></span>${safePriority}</td>
        <td>${escapeHTML(t.reporter)}</td>
        <td><span class="status-badge status-${statusClass}">${safeStatus}</span></td>
        <td>${t.assignedTo ? escapeHTML(t.assignedTo) : '<span style="color:var(--text-muted)">—</span>'}</td>
        <td class="vote-cell"><span class="vote-count-badge${voteCount >= 10 ? ' vote-hot' : voteCount >= 5 ? ' vote-warm' : ''}">▲ ${voteCount}${hotBadge}</span></td>
        <td style="white-space:nowrap;">${formatTime(t.createdAt)}</td>
        <td><div class="staff-actions">${actionsHTML}</div></td>
      `;

      staffTbody.appendChild(tr);
    });
  }

  // --- Stats ---
  function renderStats() {
    statTotal.textContent    = tickets.length;
    statPending.textContent  = tickets.filter(t => t.status === 'Pending' || t.status === 'Reopened').length;
    statProgress.textContent = tickets.filter(t => t.status === 'Assigned' || t.status === 'In Progress').length;
    statFixed.textContent    = tickets.filter(t => t.status === 'Fixed').length;
    statVerified.textContent = tickets.filter(t => t.status === 'Verified').length;
  }

  // ============================================================
  //  HELPERS
  // ============================================================

  function generateId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const existingIds = new Set(tickets.map(t => t.id));
    let id;
    let attempts = 0;
    do {
      let code = '';
      for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
      id = `#TCKT-${code}`;
      attempts++;
    } while (existingIds.has(id) && attempts < 100);
    return id;
  }

  function formatTime(iso) {
    const d = new Date(iso);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function addLog(ticket, actor, text, type) {
    if (!ticket.log) ticket.log = [];
    ticket.log.push({ time: new Date().toISOString(), actor, text, type });
  }

  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3200);
  }

  // ──── Persistence ────
  function loadTickets() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  }

  function saveTickets() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
  }

  function applyTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark') {
      document.body.classList.add('dark');
      darkIcon.textContent = '☀️';
    }
  }

  // ──── Voting Persistence ────

  function getVotedSet() {
    try {
      return new Set(JSON.parse(localStorage.getItem(VOTED_KEY)) || []);
    } catch { return new Set(); }
  }

  function saveVotedSet(set) {
    localStorage.setItem(VOTED_KEY, JSON.stringify([...set]));
  }

})();
