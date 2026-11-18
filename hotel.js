function getAmenityLabels() {
  return {
    pool: t('search.pool'), spa: t('search.spa'), gym: t('search.gym'),
    restaurant: t('search.rest'), bar:"Bar", wifi:"WiFi",
    parking: t('search.parking') || "Bãi đỗ xe",
    beach: t('search.beach'), conference: t('search.conf')
  };
}
const BRAND_LABELS = { luxury:"Luxury", grand:"Grand", holiday:"Holiday", muongthanh:"Mường Thanh" };
let ALL_HOTELS = [];
let _currentSlug = '';

const AMENITY_ICONS = {
  pool:'🏊', spa:'💆', gym:'🏋️', restaurant:'🍽️',
  bar:'🍸', wifi:'📶', parking:'🅿️', beach:'🏖️', conference:'🏢'
};
function getRoomIncludes() {
  return [t('hotel.incl_breakfast'), t('hotel.incl_wifi'), 'Minibar', t('hotel.incl_room_service'), t('hotel.incl_cancel')];
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('id');
  const checkIn = params.get('checkIn') || getDefaultDate(1);
  const checkOut = params.get('checkOut') || getDefaultDate(2);
  const guests = params.get('guests') || 2;

  try {
    const res = await fetch('api/hotels.php');
    const data = await res.json();
    ALL_HOTELS = data.hotels || [];
  } catch (_) { ALL_HOTELS = typeof HOTELS_DB !== 'undefined' ? HOTELS_DB : []; }

  const hotel = ALL_HOTELS.find(h => h.slug === slug);
  if (!hotel) { document.body.innerHTML = '<div style="padding:10rem 3rem;text-align:center;color:#c9a96e;font-family:serif;font-size:2rem">Không tìm thấy khách sạn</div>'; return; }

  _currentSlug = hotel.slug;
  renderGallery(hotel);
  renderHeader(hotel);
  renderOverview(hotel);
  renderRooms(hotel, checkIn, checkOut, guests);
  renderAmenities(hotel);
  renderMap(hotel);
  renderReviews(hotel);
  renderSimilar(hotel);
  setupTabs();
  setupDatePicker(hotel);

  document.getElementById('pageTitle').textContent = hotel.name + ' — Mường Thanh';
});

function getDefaultDate(offset) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  // dùng local date components thay vì toISOString (toISOString trả UTC → sai ngày khi trước 7h sáng giờ VN)
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ===== GALLERY =====
function renderGallery(hotel) {
  const mainImg = document.getElementById('heroGalleryImg');
  mainImg.src = hotel.gallery[0]; mainImg.alt = hotel.name;

  const thumbsCont = document.getElementById('galleryThumbs');
  hotel.gallery.forEach((src, i) => {
    const div = document.createElement('div');
    div.className = 'gallery-thumb' + (i === 0 ? ' active' : '');
    div.innerHTML = `<img src="${src}" alt="Photo ${i+1}" loading="lazy"/>`;
    div.addEventListener('click', () => {
      mainImg.style.opacity = '0';
      setTimeout(() => { mainImg.src = src; mainImg.style.opacity = '1'; }, 200);
      mainImg.style.transition = 'opacity 0.3s';
      thumbsCont.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
      div.classList.add('active');
    });
    thumbsCont.appendChild(div);
  });
}

// ===== HEADER =====
function renderHeader(hotel) {
  document.getElementById('hBrand').textContent = BRAND_LABELS[hotel.brand];
  document.getElementById('hName').textContent = hotel.name;
  document.getElementById('hStars').textContent = '★'.repeat(hotel.stars);
  document.getElementById('hCity').textContent = hotel.city + ', ' + hotel.province;
  document.getElementById('hPrice').textContent = formatPrice(hotel.price);
}

// ===== OVERVIEW =====
function renderOverview(hotel) {
  document.getElementById('hDesc').textContent = hotel.description;
  document.getElementById('hRating').textContent = hotel.rating;
  document.getElementById('hReviews').textContent = hotel.reviews.toLocaleString('vi-VN');
  document.getElementById('hStarNum').textContent = hotel.stars + ' ★';
  document.getElementById('overviewImg').src = hotel.gallery[1] || hotel.gallery[0];
  document.getElementById('overviewImg').alt = hotel.name;
}

// ===== ROOMS =====
function renderRooms(hotel, checkIn, checkOut, guests) {
  document.getElementById('rdpCheckIn').value = checkIn;
  document.getElementById('rdpCheckOut').value = checkOut;
  document.getElementById('rdpGuests').value = guests;
  updateNights(checkIn, checkOut);
  buildRoomRows(hotel, checkIn, checkOut);
}

function buildRoomRows(hotel, checkIn, checkOut) {
  const nights = calcNights(checkIn, checkOut);
  const cont = document.getElementById('roomsList');
  cont.innerHTML = hotel.rooms.map(room => {
    const total = room.price * nights;
    const includes = getRoomIncludes().slice(0, 3).map(inc => `<span class="room-include-tag">✓ ${inc}</span>`).join('');
    return `
    <div class="room-row">
      <div class="room-img">
        <img src="${hotel.gallery[0]}" alt="${room.type}" loading="lazy"/>
      </div>
      <div class="room-info">
        <div>
          <div class="room-type">${room.type}</div>
          <div class="room-specs">
            <span class="room-spec">📐 ${room.size}m²</span>
            <span class="room-spec">🛏 ${room.beds}</span>
            <span class="room-spec">👥 ${t('hotel.max_guests', 2)}</span>
          </div>
          <div class="room-includes">${includes}</div>
        </div>
      </div>
      <div class="room-pricing">
        <span class="room-price-night">${t('hotel.price_per_night')}</span>
        <span class="room-price-amount">${formatPrice(room.price)}</span>
        <span class="room-price-total">${t('hotel.total_nights', nights)}: ${formatPrice(total)}</span>
        <button class="btn-book-room"
           data-type="${encodeURIComponent(room.type)}"
           data-price="${room.price}"
           onclick="goBook(this)">${t('hotel.book_room_btn')}</button>
      </div>
    </div>`;
  }).join('');
}

function updateNights(checkIn, checkOut) {
  const n = calcNights(checkIn, checkOut);
  document.getElementById('nightCount').textContent = n;
}

function setupDatePicker(hotel) {
  const ci = document.getElementById('rdpCheckIn');
  const co = document.getElementById('rdpCheckOut');
  const today = getDefaultDate(0);
  ci.min = today; co.min = getDefaultDate(1);

  [ci, co].forEach(el => {
    el.addEventListener('change', () => {
      const civ = ci.value, cov = co.value;
      updateNights(civ, cov);
      buildRoomRows(hotel, civ, cov);
    });
  });
  document.getElementById('rdpGuests').addEventListener('change', () => {
    buildRoomRows(hotel, ci.value, co.value);
  });
}

// ===== AMENITIES =====
function renderAmenities(hotel) {
  function getAmenityFull(a) {
    const map = {
      pool: [t('hotel.am_pool_name'), t('hotel.am_pool_sub')],
      spa: [t('hotel.am_spa_name'), t('hotel.am_spa_sub')],
      gym: [t('hotel.am_gym_name'), t('hotel.am_gym_sub')],
      restaurant: [t('hotel.am_rest_name'), t('hotel.am_rest_sub')],
      bar: [t('hotel.am_bar_name'), t('hotel.am_bar_sub')],
      wifi: [t('hotel.am_wifi_name'), t('hotel.am_wifi_sub')],
      parking: [t('hotel.am_park_name'), t('hotel.am_park_sub')],
      beach: [t('hotel.am_beach_name'), t('hotel.am_beach_sub')],
      conference: [t('hotel.am_conf_name'), t('hotel.am_conf_sub')]
    };
    return map[a] || [getAmenityLabels()[a] || a, ''];
  }
  const cont = document.getElementById('amenityGrid');
  cont.innerHTML = hotel.amenities.map(a => {
    const [name, sub] = getAmenityFull(a);
    return `
    <div class="amenity-item">
      <span class="amenity-ico">${AMENITY_ICONS[a] || '✓'}</span>
      <span class="amenity-name">${name}</span>
      <span class="amenity-sub">${sub}</span>
    </div>`;
  }).join('');
}

// ===== MAP =====
let _leafletMap = null;
function renderMap(hotel) {
  document.getElementById('mapAddress').innerHTML =
    `📍 <span>${hotel.name}, ${hotel.city}, ${hotel.province}, Việt Nam</span>`;

  if (_leafletMap) { _leafletMap.remove(); _leafletMap = null; }

  const map = L.map('mapFrame', { scrollWheelZoom: false }).setView([hotel.lat, hotel.lng], 15);
  _leafletMap = map;

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
  }).addTo(map);

  const icon = L.divIcon({
    className: '',
    html: `<div style="background:#c9a96e;width:14px;height:14px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>`,
    iconSize: [14, 14], iconAnchor: [7, 7],
  });
  L.marker([hotel.lat, hotel.lng], { icon })
    .addTo(map)
    .bindPopup(`<b>${hotel.name}</b><br>${hotel.city}, ${hotel.province}`)
    .openPopup();
}

// ===== SIMILAR =====
function renderSimilar(hotel) {
  const similar = ALL_HOTELS.filter(h => h.slug !== hotel.slug && (h.province === hotel.province || h.brand === hotel.brand)).slice(0, 3);
  const cont = document.getElementById('similarGrid');
  cont.innerHTML = similar.map(h => `
    <div class="similar-card" onclick="location.href='hotel.html?id=${h.slug}'">
      <div class="similar-card-img"><img src="${h.image}" alt="${h.name}" loading="lazy"/></div>
      <div class="similar-card-body">
        <div class="similar-card-name">${h.name}</div>
        <div class="similar-card-loc">📍 ${h.city}, ${h.province}</div>
        <div class="similar-card-price">${t('search.from')} ${formatPrice(h.price)}<span style="font-size:0.7rem;color:var(--muted)">/${t('search.night')}</span></div>
      </div>
    </div>`).join('');
}

// ===== REVIEWS =====
async function renderReviews(hotel) {
  let customer = null;
  try {
    const r = await fetch('api/auth.php?action=me', { credentials: 'include' });
    const d = await r.json();
    if (d.authenticated) customer = d.customer;
  } catch (_) {}

  let reviews = [];
  try {
    const r = await fetch(`api/reviews.php?hotel_id=${hotel.id}&public=1`);
    const d = await r.json();
    reviews = d.reviews || [];
  } catch (_) {}

  // Summary
  const rvSummary = document.getElementById('rvSummary');
  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + (+r.rating), 0) / reviews.length).toFixed(1)
    : hotel.rating;
  const starCounts = [5,4,3,2,1].map(s => ({ star: s, count: reviews.filter(r => +r.rating === s).length }));
  rvSummary.innerHTML = `
    <div class="rv-avg">
      <span class="rv-avg-num">${avg}</span>
      <div class="rv-avg-stars">${'★'.repeat(Math.round(avg))}${'☆'.repeat(5 - Math.round(avg))}</div>
      <span class="rv-avg-total">${reviews.length} ${t('hotel.rv_count_lbl')}</span>
    </div>
    <div class="rv-bars">
      ${starCounts.map(sc => `
        <div class="rv-bar-row">
          <span class="rv-bar-label">${sc.star}★</span>
          <div class="rv-bar-track"><div class="rv-bar-fill" style="width:${reviews.length ? Math.round(sc.count / reviews.length * 100) : 0}%"></div></div>
          <span class="rv-bar-count">${sc.count}</span>
        </div>`).join('')}
    </div>`;

  // List
  const rvList = document.getElementById('rvList');
  if (!reviews.length) {
    rvList.innerHTML = `<p class="rv-empty">${t('hotel.rv_empty')}</p>`;
  } else {
    rvList.innerHTML = reviews.map(rv => `
      <div class="rv-card">
        <div class="rv-card-head">
          <div class="rv-avatar">${(rv.customer_name?.[0] || 'K').toUpperCase()}</div>
          <div class="rv-card-meta">
            <span class="rv-name">${rv.customer_name || t('hotel.rv_anon')}</span>
            <span class="rv-date">${formatRvDate(rv.created_at)}</span>
          </div>
          <div class="rv-stars">${'★'.repeat(+rv.rating)}${'☆'.repeat(5 - +rv.rating)}</div>
        </div>
        ${rv.title ? `<div class="rv-title">${rv.title}</div>` : ''}
        <div class="rv-comment">${rv.comment}</div>
        ${rv.reply ? `<div class="rv-reply"><span class="rv-reply-label">${t('hotel.rv_reply_label')}</span> ${rv.reply}</div>` : ''}
      </div>`).join('');
  }

  // Form
  const rvFormWrap = document.getElementById('rvFormWrap');
  if (!customer) {
    rvFormWrap.innerHTML = `<div class="rv-login-cta">
      <a href="login.html?redirect=${encodeURIComponent(location.href)}" class="rv-login-link">${t('hotel.rv_login_cta')}</a>
    </div>`;
  } else {
    rvFormWrap.innerHTML = `
      <div class="rv-form">
        <h3 class="rv-form-title">${t('hotel.rv_form_title')}</h3>
        <div class="rv-star-pick" id="rvStarPick" data-rating="5">
          ${[1,2,3,4,5].map(s => `<span class="rv-star-btn" data-val="${s}">★</span>`).join('')}
        </div>
        <input class="rv-input" id="rvTitle" type="text" placeholder="${t('hotel.rv_title_ph')}"/>
        <textarea class="rv-textarea" id="rvComment" rows="4" placeholder="${t('hotel.rv_comment_ph')}"></textarea>
        <button class="rv-submit" onclick="submitReview(${hotel.id})">${t('hotel.rv_submit')}</button>
        <div class="rv-form-msg" id="rvMsg"></div>
      </div>`;
    const picker = document.getElementById('rvStarPick');
    const stars  = picker.querySelectorAll('.rv-star-btn');
    const updateStars = val => {
      picker.dataset.rating = val;
      stars.forEach((s, i) => s.classList.toggle('active', i < val));
    };
    updateStars(5);
    stars.forEach((s, i) => {
      s.addEventListener('mouseenter', () => updateStars(i + 1));
      s.addEventListener('click', () => { picker.dataset.rating = i + 1; updateStars(i + 1); });
    });
    picker.addEventListener('mouseleave', () => updateStars(+picker.dataset.rating));
  }
}

async function submitReview(hotelId) {
  const picker  = document.getElementById('rvStarPick');
  const rating  = +(picker?.dataset.rating || 5);
  const title   = document.getElementById('rvTitle').value.trim();
  const comment = document.getElementById('rvComment').value.trim();
  const msg     = document.getElementById('rvMsg');

  if (!comment) { msg.textContent = t('hotel.rv_err_empty'); msg.className = 'rv-form-msg err'; return; }

  const btn = document.querySelector('.rv-submit');
  btn.disabled = true; btn.textContent = t('hotel.rv_sending');
  msg.className = 'rv-form-msg';

  try {
    const r = await fetch('api/reviews.php', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hotel_id: hotelId, rating, title, comment }),
    });
    const d = await r.json();
    if (d.success) {
      msg.textContent = t('hotel.rv_success');
      msg.className = 'rv-form-msg ok';
      document.getElementById('rvTitle').value = '';
      document.getElementById('rvComment').value = '';
    } else {
      msg.textContent = d.error || t('hotel.rv_fail');
      msg.className = 'rv-form-msg err';
    }
  } catch (_) {
    msg.textContent = t('hotel.rv_conn_err'); msg.className = 'rv-form-msg err';
  }
  btn.disabled = false; btn.textContent = t('hotel.rv_submit');
}

function formatRvDate(str) {
  // dùng T12:00:00 để tránh UTC midnight parse bị lùi ngày ở timezone âm
  const d = new Date(str + 'T12:00:00');
  const lang = (typeof getLang === 'function') ? getLang() : 'vi';
  return d.toLocaleDateString(lang === 'en' ? 'en-GB' : 'vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ===== TABS =====
function setupTabs() {
  const tabs = document.querySelectorAll('.htab');
  const sections = ['overview','roomSection','amenitySection','mapSection','reviewSection'];
  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el && el.getBoundingClientRect().top <= 200) current = id;
    });
    tabs.forEach(t => {
      const href = t.getAttribute('href').replace('#','');
      t.classList.toggle('active', href === current);
    });
  });
}

// ===== BOOK ROOM — đọc date picker tại thời điểm click, không dùng URL được build sẵn =====
function goBook(btn) {
  const type  = btn.dataset.type;
  const price = parseInt(btn.dataset.price);
  const ci    = document.getElementById('rdpCheckIn').value  || getDefaultDate(1);
  const co    = document.getElementById('rdpCheckOut').value || getDefaultDate(2);
  const g     = document.getElementById('rdpGuests').value   || 2;
  const n     = calcNights(ci, co);
  const total = price * n;
  location.href = `booking.html?hotel=${encodeURIComponent(_currentSlug)}&room=${type}&checkIn=${ci}&checkOut=${co}&guests=${g}&price=${price}&nights=${n}&total=${total}`;
}

// ===== HELPERS =====
function calcNights(ci, co) {
  if (!ci || !co) return 1;
  return Math.max(1, Math.round((new Date(co) - new Date(ci)) / 86400000));
}
function formatPrice(n) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);
}
