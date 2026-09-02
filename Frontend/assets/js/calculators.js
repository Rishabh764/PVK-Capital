/* ============================================================
   PVK CAPITAL — SIP & Lumpsum calculators (INR)
   Drives any element with [data-calc]. All amounts in Indian Rupees.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Currency helpers (Indian numbering system) ---------- */
  var inr = new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR',
    minimumFractionDigits: 0, maximumFractionDigits: 0
  });
  var plain = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

  function money(n) {
    if (!isFinite(n)) n = 0;
    return inr.format(Math.round(n));
  }

  /** Compact Indian form: ₹1.24 Cr, ₹45.6 L, ₹78,000 */
  function moneyShort(n) {
    if (!isFinite(n)) n = 0;
    var a = Math.abs(n);
    if (a >= 1e7) return '₹' + (n / 1e7).toFixed(2).replace(/\.00$/, '') + ' Cr';
    if (a >= 1e5) return '₹' + (n / 1e5).toFixed(2).replace(/\.00$/, '') + ' L';
    return '₹' + plain.format(Math.round(n));
  }

  /** Words under the big number: "One Crore Twenty Four Lakh" style summary */
  function amountWords(n) {
    var a = Math.round(Math.abs(n));
    if (a >= 1e7) return (a / 1e7).toFixed(2) + ' crore rupees';
    if (a >= 1e5) return (a / 1e5).toFixed(2) + ' lakh rupees';
    return plain.format(a) + ' rupees';
  }

  /* ---------- Financial maths ---------- */

  /**
   * SIP future value with an optional annual step-up.
   * Contributions are made at the start of each month (annuity-due).
   */
  function sipSeries(monthly, annualRatePct, years, stepUpPct) {
    var i = annualRatePct / 100 / 12;
    var series = [];
    var balance = 0;
    var invested = 0;
    var contribution = monthly;

    for (var y = 1; y <= years; y++) {
      for (var m = 0; m < 12; m++) {
        balance = (balance + contribution) * (1 + i);
        invested += contribution;
      }
      series.push({ year: y, invested: invested, value: balance });
      contribution = contribution * (1 + (stepUpPct || 0) / 100);
    }

    return {
      invested: invested,
      value: balance,
      gains: balance - invested,
      series: series
    };
  }

  /** Lumpsum future value, compounded annually. */
  function lumpsumSeries(principal, annualRatePct, years) {
    var r = annualRatePct / 100;
    var series = [];

    for (var y = 1; y <= years; y++) {
      series.push({ year: y, invested: principal, value: principal * Math.pow(1 + r, y) });
    }

    var value = principal * Math.pow(1 + r, years);
    return { invested: principal, value: value, gains: value - principal, series: series };
  }

  /* ---------- Rendering helpers ---------- */

  function setDonut(root, investedPct) {
    var track = root.querySelector('[data-donut="track"]');
    var arc = root.querySelector('[data-donut="arc"]');
    if (!arc) return;

    var r = parseFloat(arc.getAttribute('r'));
    var c = 2 * Math.PI * r;
    var len = (Math.max(0, Math.min(100, investedPct)) / 100) * c;

    if (track) track.setAttribute('stroke-dasharray', c + ' ' + c);
    arc.setAttribute('stroke-dasharray', len + ' ' + (c - len));
  }

  function drawChart(root, series) {
    var svg = root.querySelector('[data-chart]');
    if (!svg || !series.length) return;

    var W = 340, H = 200, padB = 22, padT = 8;
    var max = series[series.length - 1].value || 1;
    var n = series.length;
    var slot = W / n;
    var bw = Math.max(3, Math.min(26, slot * 0.62));
    var labelEvery = Math.ceil(n / 6);
    var parts = [];

    // Each chart needs its own gradient id — two charts can share a page.
    var gradId = svg.__gradId || (svg.__gradId = 'goldGrad-' + Math.random().toString(36).slice(2, 8));

    parts.push(
      '<defs><linearGradient id="' + gradId + '" x1="0" y1="1" x2="0" y2="0">' +
      '<stop offset="0%" stop-color="#C6892C"/><stop offset="100%" stop-color="#E7BE63"/>' +
      '</linearGradient></defs>'
    );

    series.forEach(function (pt, idx) {
      var x = idx * slot + (slot - bw) / 2;
      var totalH = ((H - padB - padT) * pt.value) / max;
      var invH = ((H - padB - padT) * pt.invested) / max;
      var gainH = Math.max(0, totalH - invH);
      var yTotal = H - padB - totalH;

      if (gainH > 0.5) {
        parts.push('<rect x="' + x.toFixed(1) + '" y="' + yTotal.toFixed(1) +
          '" width="' + bw.toFixed(1) + '" height="' + gainH.toFixed(1) +
          '" rx="2" fill="url(#' + gradId + ')"/>');
      }
      parts.push('<rect class="bar-i" x="' + x.toFixed(1) + '" y="' + (H - padB - invH).toFixed(1) +
        '" width="' + bw.toFixed(1) + '" height="' + invH.toFixed(1) + '" rx="2"/>');

      if (idx === 0 || idx === n - 1 || (idx + 1) % labelEvery === 0) {
        parts.push('<text x="' + (idx * slot + slot / 2).toFixed(1) + '" y="' + (H - 6) +
          '" text-anchor="middle">Y' + pt.year + '</text>');
      }
    });

    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.innerHTML = parts.join('');
  }

  function syncRangeFill(range) {
    var min = parseFloat(range.min) || 0;
    var max = parseFloat(range.max) || 100;
    var val = parseFloat(range.value) || 0;
    var pct = max > min ? ((val - min) / (max - min)) * 100 : 0;
    range.style.setProperty('--fill', pct + '%');
  }

  /* ---------- Controller ---------- */

  function initCalc(root) {
    var mode = root.getAttribute('data-calc') || 'sip';
    var fields = {};

    // Pair each range with its number input and keep both in sync.
    root.querySelectorAll('[data-field]').forEach(function (group) {
      var key = group.getAttribute('data-field');
      var range = group.querySelector('input[type=range]');
      var num = group.querySelector('input[type=number]');
      fields[key] = { group: group, range: range, num: num };

      function clamp(v) {
        var min = parseFloat(range.min), max = parseFloat(range.max);
        if (isNaN(v)) v = min;
        return Math.max(min, Math.min(max, v));
      }

      if (range) {
        range.addEventListener('input', function () {
          if (num) num.value = range.value;
          syncRangeFill(range);
          update();
        });
        syncRangeFill(range);
      }

      if (num) {
        num.addEventListener('input', function () {
          var v = parseFloat(num.value);
          if (isNaN(v)) return;                 // let the user finish typing
          if (range) { range.value = clamp(v); syncRangeFill(range); }
          update();
        });
        num.addEventListener('blur', function () {
          var v = clamp(parseFloat(num.value));
          num.value = v;
          if (range) { range.value = v; syncRangeFill(range); }
          update();
        });
      }
    });

    function val(key, fallback) {
      var f = fields[key];
      if (!f || !f.range) return fallback;
      return parseFloat(f.range.value);
    }

    function out(name) { return root.querySelector('[data-out="' + name + '"]'); }

    function setText(name, text) {
      var el = out(name);
      if (el) el.textContent = text;
    }

    function update() {
      var rate = val('rate', 12);
      var years = Math.round(val('years', 10));
      var result;

      if (mode === 'lumpsum') {
        result = lumpsumSeries(val('amount', 100000), rate, years);
      } else {
        result = sipSeries(val('amount', 10000), rate, years, val('stepup', 0));
      }

      var investedPct = result.value > 0 ? (result.invested / result.value) * 100 : 100;

      setText('total', money(result.value));
      setText('total-short', moneyShort(result.value));
      setText('total-words', 'approximately ' + amountWords(result.value));
      setText('invested', money(result.invested));
      setText('returns', money(result.gains));
      setText('invested-short', moneyShort(result.invested));
      setText('returns-short', moneyShort(result.gains));
      setText('multiple', (result.invested > 0 ? (result.value / result.invested).toFixed(2) : '0') + 'x');
      setText('gain-pct', (result.invested > 0 ? Math.round((result.gains / result.invested) * 100) : 0) + '%');
      setText('donut-pct', Math.round(100 - investedPct) + '%');
      setText('years-label', years + (years === 1 ? ' year' : ' years'));
      setText('monthly-label', money(val('amount', 10000)));

      setDonut(root, investedPct);
      drawChart(root, result.series);

      // Keep the "discuss this plan" CTA carrying the current numbers.
      var cta = root.querySelector('[data-plan-cta]');
      if (cta) {
        var label = mode === 'lumpsum'
          ? 'Lumpsum of ' + moneyShort(val('amount', 100000))
          : 'Monthly SIP of ' + moneyShort(val('amount', 10000));
        var note = label + ' for ' + years + ' years at ' + rate +
          '% p.a. — projected corpus ' + moneyShort(result.value) + '.';
        cta.setAttribute('href', 'contact.html?service=' +
          encodeURIComponent(mode === 'lumpsum' ? 'Mutual Funds' : 'Mutual Funds') +
          '&message=' + encodeURIComponent(note));
      }
    }

    root.__update = update;
    update();
  }

  document.querySelectorAll('[data-calc]').forEach(initCalc);

  /* ---------- Tab switching between SIP and Lumpsum panels ---------- */
  document.querySelectorAll('[data-tabs]').forEach(function (tabs) {
    tabs.querySelectorAll('.tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        var target = tab.getAttribute('data-target');

        tabs.querySelectorAll('.tab').forEach(function (t) {
          var on = t === tab;
          t.classList.toggle('on', on);
          t.setAttribute('aria-selected', on ? 'true' : 'false');
        });

        document.querySelectorAll('[data-panel]').forEach(function (panel) {
          var show = panel.getAttribute('data-panel') === target;
          panel.hidden = !show;
          if (show) {
            var calc = panel.querySelector('[data-calc]');
            if (calc && calc.__update) calc.__update();
          }
        });
      });
    });
  });

  /* Expose for reuse elsewhere (e.g. future goal planners) */
  window.PVKCalc = { sipSeries: sipSeries, lumpsumSeries: lumpsumSeries, money: money, moneyShort: moneyShort };
})();
