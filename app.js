    // =========================
    // i18n (A-option: language-specific URL + JSON dictionaries)
    // =========================
    const PAGE_LANG = 'en';
    const SUPPORTED_LANGS = ['en','zh','hi','es','fr','ar','pt','ru'];
    const LANG_PATH = { en:'/en/', zh:'/zh/', hi:'/hi/', es:'/es/', fr:'/fr/', ar:'/ar/', pt:'/pt/', ru:'/ru/' };

    const MIN_BIRTH_YEAR = 1900;
    const MAX_BIRTH_YEAR = new Date().getFullYear();

    let selectedGender = '';

    function trackEvent(eventName, params = {}) {
      if (typeof window.gtag !== 'function') return;
      window.gtag('event', eventName, params);
    }

    async function loadDict(lang) {
      const res = await fetch(`/locales/${lang}.json`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Failed to load locale: ${lang}`);
      return await res.json();
    }

    function applyDict(lang, t) {
      if (!t) return;

      document.documentElement.dir  = t.dir || 'ltr';
      document.documentElement.lang = lang;

      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key] !== undefined) el.textContent = t[key];
      });

      document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (t[key] !== undefined) el.placeholder = t[key];
      });

      const relKeys = ['self','spouse','partner','parent','child','friend','other'];
      relKeys.forEach(k => {
        const opt = document.querySelector(`#field-relation option[value="${k}"]`);
        if (opt && t[`rel_${k}`]) opt.textContent = t[`rel_${k}`];
      });

      const monthPlaceholder = document.querySelector('#birth-month option[value=""]');
      if (monthPlaceholder && t.dobMonth) monthPlaceholder.textContent = t.dobMonth;

      const hourUnknown = document.querySelector('#birth-hour option[value=""]');
      if (hourUnknown && t.hourUnknown) hourUnknown.textContent = t.hourUnknown;

      const maleBtn = document.getElementById('btn-male');
      const femaleBtn = document.getElementById('btn-female');
      if (maleBtn && t.genderMale) maleBtn.textContent = t.genderMale;
      if (femaleBtn && t.genderFemale) femaleBtn.textContent = t.genderFemale;

      const langLabelEl = document.getElementById('lang-label');
      if (langLabelEl && t.langLabel) langLabelEl.textContent = t.langLabel;
    }

    function setActiveLangTile(lang) {
      document.querySelectorAll('.lang-tile').forEach(tile => tile.classList.remove('active'));
      const tile = document.querySelector(`.lang-tile[onclick*="'${lang}'"]`);
      if (tile) tile.classList.add('active');
    }

    async function initI18n() {
      try {
        const dict = await loadDict(PAGE_LANG);
        applyDict(PAGE_LANG, dict);
        setActiveLangTile(PAGE_LANG);
      } catch (e) {
        console.warn('Locale file unavailable; using inline default copy.', e);
      }
    }

    function goToLang(lang) {
      if (!SUPPORTED_LANGS.includes(lang)) lang = 'en';
      try { localStorage.setItem('lang', lang); } catch (_) {}
      location.href = LANG_PATH[lang] || '/en/';
    }

    function toggleLang() {
      const btn = document.getElementById('lang-btn');
      const overlay = document.getElementById('lang-overlay');
      const isOpen = overlay.classList.contains('open');
      overlay.classList.toggle('open', !isOpen);
      if (btn) btn.classList.toggle('open', !isOpen);
    }

    function closeLangOnOverlay(e) {
      if (e.target === document.getElementById('lang-overlay')) toggleLang();
    }

    function selectLang(tileEl, lang) {
      document.getElementById('lang-overlay').classList.remove('open');
      const langBtn = document.getElementById('lang-btn');
      if (langBtn) langBtn.classList.remove('open');
      goToLang(lang);
    }

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        document.getElementById('lang-overlay').classList.remove('open');
        const langBtn = document.getElementById('lang-btn');
        if (langBtn) langBtn.classList.remove('open');
        closeResult();
      }
    });

    function scrollToForm() {
      trackEvent('reveal_destiny_click', {
        event_category: 'engagement',
        event_label: 'hero_cta'
      });
      document.getElementById('form-section').scrollIntoView({ behavior: 'smooth' });
    }

    document.getElementById('field-relation').addEventListener('change', function () {
      const custom = document.getElementById('field-relation-custom');
      custom.style.display = this.value === 'other' ? 'block' : 'none';
      if (this.value === 'other') custom.focus();
    });

    function setGender(btn) {
      const val = btn.getAttribute('data-gender');

      if (selectedGender === val) {
        selectedGender = '';
        document.getElementById('gender-val').value = '';
        document.querySelectorAll('.gender-btn').forEach(b => b.classList.remove('active'));
      } else {
        selectedGender = val;
        document.getElementById('gender-val').value = val;
        document.querySelectorAll('.gender-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      }

      document.getElementById('error-gender').classList.remove('visible');
    }

    function validateField(inputEl, errorEl, isValid) {
      if (isValid) {
        inputEl.classList.remove('input-error');
        errorEl.classList.remove('visible');
      } else {
        inputEl.classList.add('input-error');
        errorEl.classList.add('visible');
        const eventType = inputEl.tagName === 'SELECT' ? 'change' : 'input';
        inputEl.addEventListener(eventType, () => {
          inputEl.classList.remove('input-error');
          errorEl.classList.remove('visible');
        }, { once: true });
      }
      return isValid;
    }

    // ✅ 숫자 입력 방어: type=number는 maxlength가 안 먹어서 JS로 처리
    function enforceMaxDigits(inputEl, maxDigits) {
      const raw = String(inputEl.value || '');
      const digitsOnly = raw.replace(/\D/g, '');
      const trimmed = digitsOnly.slice(0, maxDigits);
      if (raw !== trimmed) inputEl.value = trimmed;
    }

    // ✅ YYYY: 최대 4자리 제한
    const yearElLive = document.getElementById('birth-year');
    yearElLive.max = String(MAX_BIRTH_YEAR);
    yearElLive.addEventListener('input', () => enforceMaxDigits(yearElLive, 4));

    // ✅ DD: 최대 2자리 제한
    const dayElLive = document.getElementById('birth-day');
    dayElLive.addEventListener('input', () => enforceMaxDigits(dayElLive, 2));

    function showMaintenanceModal() {
      document.getElementById('result').classList.add('show');
    }

    function isValidCalendarDate(year, month, day) {
      if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
      const date = new Date(year, month - 1, day);
      return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
    }

    function handleSubmit(e) {
      e.preventDefault();

      const nameEl   = document.getElementById('field-name');
      const yearEl   = document.getElementById('birth-year');
      const monthEl  = document.getElementById('birth-month');
      const dayEl    = document.getElementById('birth-day');
      const errorDob = document.getElementById('error-dob');

      // ✅ 붙여넣기 케이스까지 방어
      enforceMaxDigits(yearEl, 4);
      enforceMaxDigits(dayEl, 2);

      const yr = parseInt(yearEl.value, 10);
      const mo = parseInt(monthEl.value, 10);
      const dy = parseInt(dayEl.value, 10);

      const nameOk  = validateField(nameEl, document.getElementById('error-name'), nameEl.value.trim().length > 0);
      const yearOk  = !isNaN(yr) && yearEl.value.length === 4 && yr >= MIN_BIRTH_YEAR && yr <= MAX_BIRTH_YEAR;
      const monthOk = !isNaN(mo) && mo >= 1 && mo <= 12;
      const dayOk   = !isNaN(dy) && dy >= 1 && dy <= 31;
      const dateOk  = yearOk && monthOk && dayOk && isValidCalendarDate(yr, mo, dy);
      const dobOk   = yearOk && monthOk && dayOk && dateOk;

      if (dobOk) {
        [yearEl, monthEl, dayEl].forEach(el => el.classList.remove('input-error'));
        errorDob.classList.remove('visible');
      } else {
        if (!yearOk)  yearEl.classList.add('input-error');
        if (!monthOk) monthEl.classList.add('input-error');
        if (!dayOk)   dayEl.classList.add('input-error');
        errorDob.classList.add('visible');
        [yearEl, monthEl, dayEl].forEach(el => {
          const evt = el.tagName === 'SELECT' ? 'change' : 'input';
          el.addEventListener(evt, () => el.classList.remove('input-error'), { once: true });
        });
      }

      let genderOk = true;
      if (!document.getElementById('gender-val').value) {
        document.getElementById('error-gender').classList.add('visible');
        genderOk = false;
      }

      const submitPassed = nameOk && dobOk && genderOk;

      trackEvent('unlock_submit', {
        event_category: 'form',
        event_label: 'saju_form_submit_attempt',
        validation_passed: submitPassed
      });

      if (!submitPassed) return;

      showMaintenanceModal();
    }

    function closeResult() {
      trackEvent('maintenance_close', {
        event_category: 'modal',
        event_label: 'maintenance_modal'
      });
      document.getElementById('result').classList.remove('show');
    }

    // init
    initI18n();
  
