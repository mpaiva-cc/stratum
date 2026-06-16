'use strict';
(function () {
  var db = window.FFEngine.buildDb(window.FF_GRAPH);
  var $ = function (id) { return document.getElementById(id); };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>]/g,
    function (c) { return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' })[c]; }); }

  function renderResult(spec, result, narrative) {
    var html = '';
    if (narrative) html += '<div class="panel"><p>' + esc(narrative) + '</p></div>';
    html += '<div class="panel"><strong>Result (' + result.rows.length + ' rows)</strong><table><tbody>';
    result.rows.slice(0, 50).forEach(function (r) {
      html += '<tr>' + Object.keys(r).map(function (k) {
        var v = r[k];
        if (v === null) return '<td class="redacted">redacted</td>';
        if (Array.isArray(v)) v = v.length;
        return '<td>' + esc(v) + '</td>';
      }).join('') + '</tr>';
    });
    html += '</tbody></table></div>';
    if (result.trace.length) {
      var byReason = {};
      result.trace.forEach(function (t) { byReason[t.reason] = (byReason[t.reason] || 0) + 1; });
      html += '<div class="panel trace"><strong>Governance trace</strong><ul>';
      Object.keys(byReason).forEach(function (reason) {
        html += '<li><span class="badge">' + esc(reason) + '</span> ' + byReason[reason] + ' refusal(s)</li>';
      });
      html += '</ul></div>';
    }
    html += '<div class="panel"><strong>Query that ran</strong><div class="spec">' +
            esc(JSON.stringify(spec, null, 2)) + '</div></div>';
    html += '<div class="panel"><strong>Based on ' + result.citations.length + ' notes</strong></div>';
    $('answer').innerHTML = html;
  }

  // TEMPORARY smoke-test wiring (replaced in Task 12): run a fixed spec on click.
  $('ask').addEventListener('click', function () {
    var purpose = $('purpose').value;
    var spec = { from: 'person', select: ['title', 'pay_rate'] };
    var result = window.FFEngine.runSpec(spec, db, purpose);
    renderResult(spec, result, '(smoke test — fixed query)');
  });

  window.FFApp = { db: db, renderResult: renderResult, esc: esc };
})();
