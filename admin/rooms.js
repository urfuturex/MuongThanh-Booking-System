// ── STATE ──
let allRooms   = [];
let hotels     = [];   // from HOTELS_DB (data/hotels.js)
let editingId  = null;
let currentUser = null; // set by adminReady

const STATUS_DOT = { available: '●', occupied: '●', maintenance: '●', blocked: '●' };

// ── PHASE 1: bind UI event listeners (DOM ready) ──
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('fHotel').addEventListener('change', () => {
    document.getElementById('fFloor').value  = '';
    document.getElementById('fSearch').value = '';
    loadRooms();
  });
  document.getElementById('fStatus').addEventListener('change', renderGrid);
  document.getElementById('fFloor').addEventListener('input', renderGrid);
  document.getElementById('fSearch').addEventListener('input', renderGrid);
  document.getElementById('btnReset').addEventListener('click', resetFilters);

  document.getElementById('btnAddRoom').addEventListener('click', openAddModal);
  document.getElementById('modalRoomClose').addEventListener('click', () => closeModal('modalRoom'));
  document.getElementById('roomFormCancel').addEventListener('click', () => closeModal('modalRoom'));
  document.getElementById('roomForm').addEventListener('submit', saveRoom);
  document.getElementById('modalStatusClose').addEventListener('click', () => closeModal('modalStatus'));
  document.getElementById('fmHotel').addEventListener('change', () => buildRoomTypeSelect(document.getElementById('fmHotel').value));
});

// ── PHASE 2: init data sau khi admin-auth.js xác thực xong ──
document.addEventListener('adminReady', ({ detail: { staff } }) => {
  currentUser = staff;
  buildHotelDropdowns(staff);
  loadRooms();
  applyRoleUI(staff);
});

// ── ẨN/HIỆN UI THEO ROLE ──
function applyRoleUI(user) {
  const isManager = user.role === 'manager';

  // Non-manager: ẩn nút thêm phòng
  document.getElementById('btnAddRoom').style.display = isManager ? '' : 'none';

  // Non-manager: ẩn nút xóa trong grid (xử lý sau khi render)
  // → Đặt flag để roomCard biết có render nút xóa không
}

// ── BUILD HOTEL DROPDOWNS ──
function buildHotelDropdowns(user) {
  hotels = (typeof HOTELS_DB !== 'undefined') ? HOTELS_DB : [];
  const isManager = user.role === 'manager';

  // Non-manager: chỉ hiển thị khách sạn của mình
  const visibleHotels = isManager
    ? hotels
    : hotels.filter(h => h.id === user.hotel_id);

  const fHotel  = document.getElementById('fHotel');
  const fmHotel = document.getElementById('fmHotel');

  // Xóa option cũ (trừ option "Tất cả" nếu có)
  fHotel.querySelectorAll('option:not([value=""])').forEach(o => o.remove());
  fmHotel.innerHTML = '';

  visibleHotels.forEach(h => {
    const o1 = document.createElement('option');
    o1.value = h.slug; o1.textContent = h.name;
    fHotel.appendChild(o1);

    const o2 = document.createElement('option');
    o2.value = h.slug; o2.textContent = h.name;
    fmHotel.appendChild(o2);
  });

  if (!isManager && visibleHotels.length) {
    // Pre-select và lock dropdown filter về chi nhánh của nhân viên
    fHotel.value    = visibleHotels[0].slug;
    fHotel.disabled = true;
  }

  const firstSlug = visibleHotels[0]?.slug || '';
  if (firstSlug) buildRoomTypeSelect(firstSlug);
}

function buildRoomTypeSelect(slug) {
  const hotel = hotels.find(h => h.slug === slug);
  const sel   = document.getElementById('fmType');
  sel.innerHTML = '';
  (hotel?.rooms || []).forEach(r => {
    const o = document.createElement('option');
    o.value = r.type; o.textContent = r.type;
    sel.appendChild(o);
  });
}

// ── LOAD ──
async function loadRooms() {
  const slug = document.getElementById('fHotel').value;
  const url  = '../api/rooms.php' + (slug ? `?hotel_slug=${encodeURIComponent(slug)}` : '');
  const res  = await fetch(url);
  const data = await res.json();

  allRooms = data.rooms || [];
  updateStats(data.stats || {});
  renderGrid();
}

// ── STATS ──
function updateStats(s) {
  document.getElementById('stTotal').textContent = s.total   || 0;
  document.getElementById('stAvail').textContent = s.available  || 0;
  document.getElementById('stOcc').textContent   = s.occupied   || 0;
  document.getElementById('stMaint').textContent = s.maintenance|| 0;
  document.getElementById('stBlock').textContent = s.blocked    || 0;
}

// ── RENDER GRID ──
function renderGrid() {
  const fStatus = document.getElementById('fStatus').value;
  const fFloor  = parseInt(document.getElementById('fFloor').value) || 0;
  const fSearch = document.getElementById('fSearch').value.toLowerCase().trim();

  const filtered = allRooms.filter(r => {
    if (fStatus && r.status !== fStatus) return false;
    if (fFloor  && r.floor  !== fFloor)  return false;
    if (fSearch && !r.room_number.toLowerCase().includes(fSearch)
                && !r.room_type.toLowerCase().includes(fSearch)
                && !(r.first_name + ' ' + r.last_name).toLowerCase().includes(fSearch)) return false;
    return true;
  });

  document.getElementById('rmResults').textContent =
    filtered.length + ' ' + tAdm('rm.stat_total').toLowerCase();

  const grid = document.getElementById('roomsGrid');
  if (!filtered.length) {
    grid.innerHTML = `<div class="rooms-empty">${tAdm('rm.no_rooms')}</div>`;
    return;
  }

  grid.innerHTML = filtered.map(r => roomCard(r)).join('');
}

// ── ROOM CARD ──
function roomCard(r) {
  const statusLabel = {
    available:   tAdm('rm.status_available'),
    occupied:    tAdm('rm.status_occupied'),
    maintenance: tAdm('rm.status_maintenance'),
    blocked:     tAdm('rm.status_blocked'),
  }[r.status] || r.status;

  const floorBadge = r.floor ? `<span class="rc-floor">${tAdm('rm.floor')} ${r.floor}</span>` : '';
  const guestInfo  = r.status === 'occupied' && r.last_name ? `
    <div class="rc-guest">${r.last_name} ${r.first_name}</div>
    <div class="rc-ref">${r.current_booking_ref || ''}</div>
    <div class="rc-dates">${tAdm('rm.checkout')}: ${formatDate(r.check_out)}</div>` : '';

  const noteInfo = r.status === 'maintenance' && r.notes
    ? `<div class="rc-dates" style="font-style:italic;font-size:.67rem;">${r.notes}</div>` : '';

  return `
    <div class="room-card ${r.status}">
      <div class="rc-number">${r.room_number}${floorBadge}</div>
      <div class="rc-type">${r.room_type}</div>
      <span class="rc-status ${r.status}">${statusLabel}</span>
      ${guestInfo}${noteInfo}
      <div class="rc-actions">
        <button class="rc-btn" onclick="openStatusModal(${r.id},'${r.status}')">${tAdm('rm.change_status')}</button>
        ${currentUser?.role === 'manager' ? `
        <button class="rc-btn" onclick="openEditModal(${r.id})">✎</button>
        <button class="rc-btn danger" onclick="deleteRoom(${r.id})">✕</button>` : ''}
      </div>
    </div>`;
}

// ── DATE FORMAT ──
function formatDate(d) {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

// ── RESET FILTERS ──
function resetFilters() {
  document.getElementById('fHotel').value  = '';
  document.getElementById('fStatus').value = '';
  document.getElementById('fFloor').value  = '';
  document.getElementById('fSearch').value = '';
  loadRooms();
}

// ── MODAL: ADD ──
function openAddModal() {
  editingId = null;
  document.getElementById('editRoomId').value = '';
  document.getElementById('roomForm').reset();
  document.getElementById('modalRoomTitle').textContent = tAdm('rm.modal_add');

  const firstSlug = hotels[0]?.slug || '';
  document.getElementById('fmHotel').value = firstSlug;
  buildRoomTypeSelect(firstSlug);

  openModal('modalRoom');
}

// ── MODAL: EDIT ──
function openEditModal(id) {
  const r = allRooms.find(x => x.id == id);
  if (!r) return;
  editingId = id;

  document.getElementById('modalRoomTitle').textContent = tAdm('rm.modal_edit');
  document.getElementById('editRoomId').value  = id;
  document.getElementById('fmHotel').value     = r.hotel_slug;
  buildRoomTypeSelect(r.hotel_slug);
  document.getElementById('fmType').value    = r.room_type;
  document.getElementById('fmNumber').value  = r.room_number;
  document.getElementById('fmFloor').value   = r.floor || '';
  document.getElementById('fmStatus').value  = r.status;
  document.getElementById('fmRef').value     = r.current_booking_ref || '';
  document.getElementById('fmNotes').value   = r.notes || '';

  openModal('modalRoom');
}

// ── SAVE ROOM ──
async function saveRoom(e) {
  e.preventDefault();
  const hotelSlug = document.getElementById('fmHotel').value;
  const hotel     = hotels.find(h => h.slug === hotelSlug);

  const body = {
    hotel_slug:          hotelSlug,
    hotel_name:          hotel?.name || '',
    room_number:         document.getElementById('fmNumber').value.trim(),
    room_type:           document.getElementById('fmType').value,
    floor:               parseInt(document.getElementById('fmFloor').value) || null,
    status:              document.getElementById('fmStatus').value,
    current_booking_ref: document.getElementById('fmRef').value.trim() || null,
    notes:               document.getElementById('fmNotes').value.trim() || null,
  };

  if (editingId) {
    await fetch(`../api/rooms.php?id=${editingId}`, {
      method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body)
    });
  } else {
    await fetch('../api/rooms.php', {
      method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body)
    });
  }

  closeModal('modalRoom');
  showToast(tAdm('common.saved'));
  loadRooms();
}

// ── MODAL: CHANGE STATUS ──
function openStatusModal(id, currentStatus) {
  document.getElementById('statusRoomId').value = id;
  document.getElementById('statusModalTitle').textContent =
    tAdm('rm.change_status') + ' — ' + (allRooms.find(r => r.id == id)?.room_number || '');

  document.querySelectorAll('.status-opt').forEach(el => {
    el.classList.toggle('current', el.classList.contains(currentStatus));
  });
  openModal('modalStatus');
}

async function applyStatus(newStatus) {
  const id = parseInt(document.getElementById('statusRoomId').value);
  if (!id) return;

  const body = { status: newStatus };
  if (newStatus !== 'occupied') body.current_booking_ref = null;

  await fetch(`../api/rooms.php?id=${id}`, {
    method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body)
  });

  closeModal('modalStatus');
  showToast(tAdm('common.saved'));
  loadRooms();
}

// ── DELETE ──
async function deleteRoom(id) {
  if (!confirm(tAdm('rm.confirm_delete'))) return;
  await fetch(`../api/rooms.php?id=${id}`, { method: 'DELETE' });
  showToast(tAdm('common.saved'));
  loadRooms();
}

// ── MODAL HELPERS ──
function openModal(id)  { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

// ── TOAST ──
function showToast(msg) {
  const t = document.getElementById('rmToast');
  t.textContent = msg;
  t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), 2500);
}
