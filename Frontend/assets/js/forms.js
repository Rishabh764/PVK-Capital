/* ============================================================
   PVK CAPITAL — Enquiry & contact forms
   Validation, submission, and a no-backend fallback.
   ============================================================ */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     CONFIGURE ME
     ------------------------------------------------------------------
     endpoint : The deployed Google Apps Script Web App URL (ends in /exec).
                See google-apps-script/Code.gs and README.md for the
                five-minute setup. On every submission it emails both the
                founder and the enquirer automatically. Leave empty ('')
                and the form falls back to opening the visitor's mail app
                addressed to you instead.
     inbox    : Your receiving address — used by the mailto fallback.
     phone    : 10-digit number (no +91, no spaces) — used by the tel fallback.
     ------------------------------------------------------------------ */
  var CONFIG = {
    endpoint: 'https://script.google.com/macros/s/AKfycby0gtHUXDUIDnS8Q4Y7f8GLNjboQv03mRMiN50AaTn0j_R8eTZgCDhnqWKM8NA5RRtcZA/exec',
    inbox: 'pvkcapital.in@gmail.com',
    phone: '9510809046'
  };

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
  var PHONE_RE = /^(\+?91[\-\s]?)?[6-9]\d{9}$/;

  /* ---------- Validation ---------- */

  function fieldGroup(input) {
    return input.closest('.fg') || input.parentElement;
  }

  function setError(input, message) {
    var group = fieldGroup(input);
    if (!group) return;
    group.classList.add('err');
    var msg = group.querySelector('.msg');
    if (msg) msg.textContent = message;
    input.setAttribute('aria-invalid', 'true');
  }

  function clearError(input) {
    var group = fieldGroup(input);
    if (!group) return;
    group.classList.remove('err');
    var msg = group.querySelector('.msg');
    if (msg) msg.textContent = '';
    input.removeAttribute('aria-invalid');
  }

  function validateField(input) {
    var value = (input.value || '').trim();
    var type = input.getAttribute('data-validate') || '';

    if (input.hasAttribute('required') && !value) {
      setError(input, 'This field is required.');
      return false;
    }
    if (input.type === 'checkbox' && input.hasAttribute('required') && !input.checked) {
      setError(input, 'Please tick this to continue.');
      return false;
    }
    if (value && type === 'email' && !EMAIL_RE.test(value)) {
      setError(input, 'Enter a valid email address.');
      return false;
    }
    if (value && type === 'phone' && !PHONE_RE.test(value.replace(/[\s\-()]/g, ''))) {
      setError(input, 'Enter a valid 10-digit Indian mobile number.');
      return false;
    }
    if (value && type === 'name' && value.length < 2) {
      setError(input, 'Please enter your full name.');
      return false;
    }

    clearError(input);
    return true;
  }

  function validateForm(form) {
    var ok = true;
    var firstBad = null;

    form.querySelectorAll('input, select, textarea').forEach(function (input) {
      if (input.type === 'hidden' || input.disabled) return;
      if (!validateField(input)) {
        ok = false;
        if (!firstBad) firstBad = input;
      }
    });

    // Checkbox groups that need at least one selection.
    form.querySelectorAll('[data-require-one]').forEach(function (wrap) {
      var checked = wrap.querySelectorAll('input[type=checkbox]:checked').length;
      var group = wrap.closest('.fg') || wrap;
      var msg = group.querySelector('.msg');
      if (!checked) {
        ok = false;
        group.classList.add('err');
        if (msg) msg.textContent = 'Select at least one option.';
        if (!firstBad) firstBad = wrap.querySelector('input');
      } else {
        group.classList.remove('err');
        if (msg) msg.textContent = '';
      }
    });

    if (firstBad) {
      firstBad.focus({ preventScroll: true });
      firstBad.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return ok;
  }

  /* ---------- Status messages ---------- */

  var ICON_OK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';
  var ICON_BAD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v5M12 16.5h.01"/></svg>';

  function showStatus(form, kind, html) {
    var box = form.querySelector('.form-status');
    if (!box) return;
    box.className = 'form-status show ' + kind;
    box.innerHTML = (kind === 'ok' ? ICON_OK : ICON_BAD) + '<span>' + html + '</span>';
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /* ---------- Collecting the payload ---------- */

  function collect(form) {
    var data = {};
    var fd = new FormData(form);

    fd.forEach(function (value, key) {
      if (data[key] === undefined) {
        data[key] = value;
      } else if (Array.isArray(data[key])) {
        data[key].push(value);
      } else {
        data[key] = [data[key], value];
      }
    });

    data._page = location.pathname.split('/').pop() || 'index.html';
    data._submitted = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    return data;
  }

  function humanLabel(key) {
    return key.replace(/[_-]/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }

  function toPlainText(data) {
    return Object.keys(data).map(function (key) {
      var value = Array.isArray(data[key]) ? data[key].join(', ') : data[key];
      return humanLabel(key) + ': ' + value;
    }).join('\n');
  }

  /** Keep a local copy so nothing is lost if the network hiccups. */
  function archive(data) {
    try {
      var all = JSON.parse(localStorage.getItem('pvk_enquiries') || '[]');
      all.push(data);
      localStorage.setItem('pvk_enquiries', JSON.stringify(all.slice(-50)));
    } catch (e) { /* storage unavailable — not critical */ }
  }

  /* ---------- Submission ---------- */

  function handleSubmit(form) {
    return function (e) {
      e.preventDefault();
      if (!validateForm(form)) {
        showStatus(form, 'bad', 'Please correct the highlighted fields and try again.');
        return;
      }

      var btn = form.querySelector('[type=submit]');
      var data = collect(form);
      var subject = (form.getAttribute('data-subject') || 'Website enquiry') +
        ' — ' + (data.name || 'New enquiry');

      archive(data);

      if (!CONFIG.endpoint) {
        // No backend configured: hand the details to the visitor's mail app.
        var mailto = 'mailto:' + CONFIG.inbox +
          '?subject=' + encodeURIComponent(subject) +
          '&body=' + encodeURIComponent(toPlainText(data));
        window.location.href = mailto;
        showStatus(form, 'ok',
          '<strong>Almost there.</strong> Your mail app is opening with these details filled in — ' +
          'just press send and Vedant will get back to you within one working day. ' +
          'Prefer to talk now? <a href="tel:+91' + CONFIG.phone + '" style="text-decoration:underline">Call us</a>.');
        return;
      }

      if (btn) { btn.classList.add('loading'); btn.disabled = true; }

      fetch(CONFIG.endpoint, {
        method: 'POST',
        // text/plain avoids a CORS preflight, which Google Apps Script web apps cannot
        // answer — the body itself is still JSON and is parsed as such server-side.
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(Object.assign({ _subject: subject }, data))
      })
        .then(function (res) {
          if (!res.ok) throw new Error('Request failed: ' + res.status);
          form.reset();
          form.querySelectorAll('.fg').forEach(function (g) { g.classList.remove('err'); });
          showStatus(form, 'ok',
            '<strong>Thank you, ' + (data.name || 'there') + '.</strong> Your enquiry has reached us. ' +
            'Vedant or a member of the team will call you on the number you shared within one working day.');
        })
        .catch(function () {
          showStatus(form, 'bad',
            'We could not send that just now. Please call us on ' +
            '<a href="tel:+91' + CONFIG.phone + '" style="text-decoration:underline">+91 ' +
            CONFIG.phone + '</a> or email ' +
            '<a href="mailto:' + CONFIG.inbox + '" style="text-decoration:underline">' + CONFIG.inbox + '</a>.');
        })
        .then(function () {
          if (btn) { btn.classList.remove('loading'); btn.disabled = false; }
        });
    };
  }

  /* ---------- Wire up every form on the page ---------- */

  document.querySelectorAll('form[data-pvk-form]').forEach(function (form) {
    form.setAttribute('novalidate', 'novalidate');
    form.addEventListener('submit', handleSubmit(form));

    form.querySelectorAll('input, select, textarea').forEach(function (input) {
      input.addEventListener('blur', function () {
        if ((input.value || '').trim() || input.hasAttribute('required')) validateField(input);
      });
      input.addEventListener('input', function () {
        if (fieldGroup(input) && fieldGroup(input).classList.contains('err')) validateField(input);
      });
    });

    form.querySelectorAll('[data-require-one] input').forEach(function (box) {
      box.addEventListener('change', function () {
        var wrap = box.closest('[data-require-one]');
        var group = wrap.closest('.fg') || wrap;
        if (wrap.querySelectorAll('input:checked').length) {
          group.classList.remove('err');
          var msg = group.querySelector('.msg');
          if (msg) msg.textContent = '';
        }
      });
    });
  });

  /* ---------- Prefill from the URL (used by the calculator CTA) ---------- */

  var params = new URLSearchParams(location.search);
  if (params.toString()) {
    var serviceParam = params.get('service');
    var messageParam = params.get('message');

    if (messageParam) {
      document.querySelectorAll('textarea[name="message"]').forEach(function (ta) {
        if (!ta.value) ta.value = messageParam;
      });
    }

    if (serviceParam) {
      document.querySelectorAll('select[name="service"]').forEach(function (sel) {
        Array.prototype.forEach.call(sel.options, function (opt) {
          if (opt.value.toLowerCase() === serviceParam.toLowerCase()) sel.value = opt.value;
        });
      });
      document.querySelectorAll('[data-require-one] input[type=checkbox]').forEach(function (box) {
        if (box.value.toLowerCase() === serviceParam.toLowerCase()) box.checked = true;
      });
    }

    if (messageParam || serviceParam) {
      var target = document.getElementById('enquiry') || document.getElementById('contact');
      if (target) {
        window.setTimeout(function () {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 350);
      }
    }
  }

  /* ---------- Fill contact details from CONFIG ---------- */

  document.querySelectorAll('[data-inbox]').forEach(function (a) {
    a.setAttribute('href', 'mailto:' + CONFIG.inbox);
    if (a.hasAttribute('data-inbox-text')) a.textContent = CONFIG.inbox;
  });
})();
