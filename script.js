// ===== 🎵 NHẠC NỀN: AUTOPLAY MUTE + MỞ TIẾNG NGAY TRONG CỬ CHỈ ĐẦU =====
const audio = document.getElementById('bgm');
const musicBtn = document.getElementById('musicBtn');

let isPlaying = false;
let unlocked = false;

function setBtnState(playing) {
  if (!musicBtn) return;
  isPlaying = !!playing;
  musicBtn.classList.toggle('playing', playing);
  musicBtn.classList.toggle('muted', !playing);
  musicBtn.setAttribute('aria-pressed', playing ? 'true' : 'false');
}

// Fade volume
async function rampVolume(to = 1, duration = 800) {
  if (!audio) return;
  const from = audio.volume ?? 0;
  const start = performance.now();
  return new Promise(resolve => {
    function step(t) {
      const k = Math.min(1, (t - start) / duration);
      audio.volume = from + (to - from) * k;
      if (k < 1) requestAnimationFrame(step);
      else resolve();
    }
    requestAnimationFrame(step);
  });
}

// 🔓 Mở khóa âm thanh *trong chính cử chỉ*
async function unlockAudio() {
  if (!audio || unlocked) return;
  unlocked = true; // tránh chạy lặp

  try {
    // iOS/WebView thân thiện: đảm bảo inline
    audio.setAttribute('playsinline', '');
    audio.setAttribute('webkit-playsinline', '');

    // Một số webview cần bỏ attr muted lẫn thuộc tính
    audio.muted = false;
    audio.removeAttribute?.('muted');

    // Trick iOS: ensure play() nằm trong cùng event với unmute
    if (!audio.paused) audio.pause();
    try { await audio.play(); } catch {}

    // Bắt đầu từ 0 rồi fade lên để đỡ gắt
    audio.volume = 0;
    await rampVolume(1, 900);
    setBtnState(true);
  } catch (e) {
    // Nếu lỗi, cho phép lần cử chỉ kế tiếp thử lại
    unlocked = false;
    console.warn('Unlock audio failed:', e);
  }
}

// Khởi tạo: phát im lặng ngay khi load (để sẵn stream)
(function initAudio(){
  if (!audio) return;
  audio.loop = true;
  audio.volume = 0;
  audio.muted = true;
  audio.setAttribute('muted', '');
  audio.setAttribute('playsinline', '');
  audio.setAttribute('webkit-playsinline', '');
  audio.play().catch(()=>{});
  setBtnState(false);

  // Lắng nghe CỬ CHỈ ĐẦU TIÊN ở mức capture để ưu tiên
  const evts = ['pointerdown','pointerup','touchstart','touchend','click','keydown'];
  const opts = { capture:true, once:true, passive:true };
  evts.forEach(ev => window.addEventListener(ev, async () => {
    await unlockAudio();
  }, opts));
})();

// Nút nhạc: cũng đóng vai trò “mở khóa” nếu chưa unlock
if (musicBtn && audio) {
  musicBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    try {
      if (!unlocked) {
        await unlockAudio();
        return;
      }
      if (audio.paused) {
        audio.muted = false;
        audio.removeAttribute?.('muted');
        audio.volume = 0;
        await audio.play().catch(()=>{});
        await rampVolume(1, 500);
        setBtnState(true);
      } else {
        await rampVolume(0, 350);
        audio.pause();
        setBtnState(false);
      }
    } catch (err) {
      console.log('Music toggle error:', err);
    }
  });
}

// (Tùy chọn) Tạm dừng khi ẩn tab, phát lại khi quay về
document.addEventListener('visibilitychange', async () => {
  if (!audio) return;
  if (document.hidden && !audio.paused) {
    await rampVolume(0, 200);
    audio.pause();
  } else if (!document.hidden && unlocked && isPlaying) {
    try { await audio.play(); await rampVolume(1, 300); } catch {}
  }
});

/* ===== Toast (thông báo nổi) ===== */
function showToast(msg){
  let t = document.querySelector('.toast');
  if(!t){
    t = document.createElement('div');
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._hideTimer);
  t._hideTimer = setTimeout(()=> t.classList.remove('show'), 2500);
}

// ===== 🌸 HIỆU ỨNG KHI CUỘN =====
function initScrollAnimations() {
  const observer = new IntersectionObserver(
    entries => entries.forEach(entry => entry.isIntersecting && entry.target.classList.add('show')),
    { threshold: 0.15 }
  );
  document.querySelectorAll('img, h1, h2, h3, .script, .gallery-title, .gallery-sub')
    .forEach(el => {
      if (!el.classList.contains('fade-in') &&
          !el.classList.contains('slide-left') &&
          !el.classList.contains('slide-right')) {
        const fx = ['fade-in','slide-left','slide-right'][Math.floor(Math.random()*3)];
        el.classList.add(fx);
      }
      observer.observe(el);
    });
}

window.addEventListener('DOMContentLoaded', initScrollAnimations);
window.addEventListener('load', () => {
  // ❌ ensureAutoPlay() gây lỗi vì không tồn tại → làm hỏng các bind phía dưới
  // ensureAutoPlay();

  startHeartRain();
  bindGiftModal();
  bindGuestbook();
  bindWishPreset();
  bindRSVP();
});

// ===== 💖 TRÁI TIM RƠI =====
function startHeartRain(){
  const container = document.getElementById('hearts-container');
  if (!container) return;
  setInterval(()=>{
    const heart = document.createElement('div');
    heart.className = 'heart';
    heart.textContent = Math.random() > 0.5 ? '💗' : '💞';
    heart.style.left = Math.random()*100 + 'vw';
    heart.style.fontSize = (12 + Math.random()*16) + 'px';
    heart.style.animationDuration = (4 + Math.random()*4) + 's';
    container.appendChild(heart);
    setTimeout(()=>heart.remove(), 9000);
  }, 380);
}

// ===== 🎁 HỘP MỪNG CƯỚI =====
function bindGiftModal(){
  const btn = document.getElementById('giftBtn');
  const modal = document.getElementById('giftModal');
  const closeBtn = document.getElementById('giftClose');
  const backdrop = document.getElementById('giftBackdrop');
  if (!btn || !modal) return;

  const open = () => { modal.classList.remove('hidden'); modal.setAttribute('aria-hidden','false'); }
  const close = () => { modal.classList.add('hidden'); modal.setAttribute('aria-hidden','true'); }

  btn.addEventListener('click', (e)=>{ e.preventDefault(); e.stopPropagation(); open(); });
  if (closeBtn) closeBtn.addEventListener('click', close);
  if (backdrop) backdrop.addEventListener('click', close);
  document.addEventListener('keydown', e => { if(e.key === 'Escape') close(); });

  document.querySelectorAll('.copy-btn').forEach(b=>{
    b.addEventListener('click', async ()=>{
      const acc = b.dataset.account || '';
      try{
        await navigator.clipboard.writeText(acc);
        b.textContent = 'Đã copy ✓';
        setTimeout(()=> b.textContent = 'Copy STK', 1500);
      }catch{
        alert('Không copy được, vui lòng copy thủ công: ' + acc);
      }
    });
  });
}

// ===== ✍️ SỔ LƯU BÚT =====
function bindGuestbook(){
  const form = document.getElementById('wishForm');
  const note = document.getElementById('wishNote');
  if(!form) return;

  // Chặn submit (không reload/scroll lên đầu), chỉ hiện thông báo
  form.setAttribute('action','javascript:void(0)');
  form.addEventListener('submit', e=>{
    e.preventDefault();
    e.stopPropagation();
    const name = document.getElementById('fullname').value.trim();
    const rel  = document.getElementById('relation').value;
    const msg  = document.getElementById('message').value.trim();
    if(!name || !rel || !msg){
      showToast('⚠️ Vui lòng điền đầy đủ Họ tên, mối quan hệ và lời chúc!');
      return;
    }
    // Chỉ hiện thông báo (không điều hướng)
    showToast('💌 Đã nhận được lời chúc của bạn!');
    if (note) { note.hidden = false; setTimeout(()=> note.hidden = true, 3500); }
    form.reset();
  }, {capture:true});
}

// ===== Gợi ý chúc sẵn =====
function bindWishPreset(){
  const sel = document.getElementById('wishPreset');
  const ta  = document.getElementById('message');
  if(!sel || !ta) return;
  sel.addEventListener('change', ()=>{
    const v = sel.value;
    if(v && v.trim().length>0) ta.value = v;
  });
}

// ===== ✅ Xác nhận tham dự =====
function bindRSVP(){
  const form = document.getElementById('rsvpForm');
  const note = document.getElementById('rsvpNote');
  if(!form) return;

  // Chặn submit (không điều hướng), chỉ hiện thông báo
  form.setAttribute('action','javascript:void(0)');
  form.addEventListener('submit', e=>{
    e.preventDefault();
    e.stopPropagation();
    const name = document.getElementById('rsvpName')?.value.trim();
    const phone = document.getElementById('rsvpPhone')?.value.trim();
    const eventSel = document.getElementById('rsvpEvent')?.value;
    const guests = document.getElementById('rsvpGuests')?.value;
    const attend = (form.querySelector('input[name="rsvpAttend"]:checked')||{}).value;
    if(!name || !phone || !eventSel || !guests || !attend){
      showToast('⚠️ Vui lòng điền đủ thông tin và chọn tham dự/không tham dự!');
      return;
    }
    showToast('✅ Cảm ơn bạn! Chúng tôi đã ghi nhận thông tin tham dự.');
    if (note) { note.hidden = false; setTimeout(()=> note.hidden = true, 3500); }
    form.reset();
  }, {capture:true});
}

// ===== ⏳ COUNTDOWN =====
(function(){
  const box = document.querySelector('.countdown');
  if(!box) return;
  const targetStr = box.getAttribute('data-target') || '2025-10-26T10:00:00';
  const target = new Date(targetStr);
  const dEl = document.getElementById('cd-days');
  const hEl = document.getElementById('cd-hours');
  const mEl = document.getElementById('cd-mins');
  const sEl = document.getElementById('cd-secs');
  function pad(n){ return n.toString().padStart(2,'0'); }
  function tick(){
    const now = new Date();
    let ms = target - now;
    if (ms < 0) ms = 0;
    const sec = Math.floor(ms/1000)%60;
    const min = Math.floor(ms/1000/60)%60;
    const hr  = Math.floor(ms/1000/60/60)%24;
    const day = Math.floor(ms/1000/60/60/24);
    if (dEl) dEl.textContent = pad(day);
    if (hEl) hEl.textContent = pad(hr);
    if (mEl) mEl.textContent = pad(min);
    if (sEl) sEl.textContent = pad(sec);
  }
  tick();
  setInterval(tick, 1000);
})();

// Cuộn mượt xuống phần RSVP khi nhấn "Xác nhận tham dự"
document.querySelectorAll('a[href^="#rsvp"]').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector('#rsvp');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// ===== Nút lên đầu trang =====
const toTopBtn = document.getElementById('toTopBtn');

window.addEventListener('scroll', () => {
  if (!toTopBtn) return;
  if (window.scrollY > 160) toTopBtn.classList.add('show');
  else toTopBtn.classList.remove('show');
});

if (toTopBtn) {
  toTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}
