/* ============================================================
   Learning Analytics module
   ============================================================ */

SSA.routes.analytics = {
  render: function (container) {
    const stats = getGlobalStats();

    container.innerHTML = `
      <div class="page-head">
        <h2>Learning Analytics</h2>
        <p>Analisis perkembangan nilai, keunggulan, dan area yang perlu perhatian.</p>
      </div>

      <div class="toolbar">
        <div>
          <label class="label">Pilih Siswa</label>
          <select class="select" id="studentSelect">
            ${STUDENTS.map(function (s) {
              return `<option value="${s.id}">${SSA.ui.escape(s.name)} — Kelas ${s.kelas}</option>`;
            }).join('')}
          </select>
        </div>
      </div>

      <div id="analyticsContent"></div>
    `;

    const select = container.querySelector('#studentSelect');
    const content = container.querySelector('#analyticsContent');

    const update = () => {
      const s = getStudentById(select.value);
      if (!s) return;
      this.renderAnalysis(content, s);
    };

    select.addEventListener('change', update);
    update();
  },

  renderAnalysis: function (container, student) {
    const oa = overallAverage(student);
    const strong = strongestSubject(student);
    const weak = weakestSubject(student);

    // rank subjects by average
    const ranked = SUBJECTS.map(function (subj) {
      return { subject: subj, value: subjectAverage(student, subj), trend: subjectTrend(student, subj) };
    }).sort(function (a, b) { return b.value - a.value; });

    const topSubjects = ranked.slice(0, 3);
    const bottomSubjects = ranked.slice(-3).reverse();

    container.innerHTML = `
      <!-- Summary stat cards -->
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-icon blue">📊</div>
          <div class="stat-info"><div class="stat-value">${oa}</div><div class="stat-label">Rata-rata Keseluruhan</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green">🏆</div>
          <div class="stat-info"><div class="stat-value" style="font-size:1.2rem">${strong.subject}</div><div class="stat-label">Mata Pelajaran Terbaik (${strong.value})</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon red">📌</div>
          <div class="stat-info"><div class="stat-value" style="font-size:1.2rem">${weak.subject}</div><div class="stat-label">Perlu Perhatian (${weak.value})</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon ${oa >= 80 ? 'green' : oa >= 70 ? 'amber' : 'red'}">⭐</div>
          <div class="stat-info"><div class="stat-value">${letterGrade(oa)}</div><div class="stat-label">Predikat Akademik</div></div>
        </div>
      </div>

      <!-- Charts -->
      <div class="grid grid-2 mb-3">
        <div class="card">
          <div class="card-header"><h3>Perkembangan Nilai per Mata Pelajaran</h3></div>
          <div class="chart-wrap"><canvas id="anaTrendChart"></canvas></div>
        </div>
        <div class="card">
          <div class="card-header"><h3>Perbandingan Nilai Antar Mapel</h3></div>
          <div class="chart-wrap"><canvas id="anaRadarChart"></canvas></div>
        </div>
      </div>

      <!-- Strengths -->
      <div class="card mb-3">
        <h3 class="card-title">🏆 Mata Pelajaran Keunggulan</h3>
        <p class="text-sm text-gray mb-2">Tiga mata pelajaran dengan rata-rata tertinggi yang menjadi keunggulan ${SSA.ui.escape(student.name)}.</p>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>Peringkat</th><th>Mata Pelajaran</th><th>Rata-rata</th><th>Tren</th><th>Predikat</th></tr></thead>
            <tbody>
              ${topSubjects.map(function (item, i) {
                const tl = trendLabel(item.trend);
                return `<tr>
                  <td><span class="badge ${i===0?'badge-amber':i===1?'badge-gray':'badge-blue'}">${i+1}</span></td>
                  <td><span style="display:inline-flex;align-items:center;gap:.4rem"><span style="width:10px;height:10px;border-radius:50%;background:${SUBJECT_COLORS[item.subject]}"></span>${item.subject}</span></td>
                  <td><strong>${item.value}</strong></td>
                  <td><span class="badge ${tl.cls==='trend-up'?'badge-green':tl.cls==='trend-down'?'badge-red':'badge-gray'}">${tl.text}</span></td>
                  <td><span class="badge ${item.value>=80?'badge-green':'badge-amber'}">${letterGrade(item.value)}</span></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Weaknesses -->
      <div class="card mb-3">
        <h3 class="card-title">📌 Mata Pelajaran yang Perlu Perhatian</h3>
        <p class="text-sm text-gray mb-2">Tiga mata pelajaran dengan rata-rata terendah yang membutuhkan dukungan tambahan.</p>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>Peringkat</th><th>Mata Pelajaran</th><th>Rata-rata</th><th>Tren</th><th>Predikat</th></tr></thead>
            <tbody>
              ${bottomSubjects.map(function (item, i) {
                const tl = trendLabel(item.trend);
                return `<tr>
                  <td><span class="badge badge-red">${i+1}</span></td>
                  <td><span style="display:inline-flex;align-items:center;gap:.4rem"><span style="width:10px;height:10px;border-radius:50%;background:${SUBJECT_COLORS[item.subject]}"></span>${item.subject}</span></td>
                  <td><strong>${item.value}</strong></td>
                  <td><span class="badge ${tl.cls==='trend-up'?'badge-green':tl.cls==='trend-down'?'badge-red':'badge-gray'}">${tl.text}</span></td>
                  <td><span class="badge ${item.value>=70?'badge-amber':'badge-red'}">${letterGrade(item.value)}</span></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Analysis summary -->
      <div class="card">
        <h3 class="card-title">📋 Ringkasan Analisis</h3>
        <div id="analysisSummary"></div>
      </div>
    `;

    this.trendChart(container, student);
    this.radarChart(container, student);
    this.summary(container, student, oa, strong, weak, ranked);
  },

  trendChart: function (container, student) {
    const ctx = container.querySelector('#anaTrendChart');
    const labels = ASSESSMENT_SCHEDULE.map(function (a) { return a.label; });
    const datasets = SUBJECTS.map(function (subj) {
      return {
        label: subj,
        data: student.grades[subj].map(function (g) { return g.score; }),
        borderColor: SUBJECT_COLORS[subj],
        backgroundColor: SUBJECT_COLORS[subj] + '20',
        tension: .3,
        borderWidth: 2,
        pointRadius: 2,
        pointHoverRadius: 5,
        hidden: SUBJECTS.indexOf(subj) >= 4 // show top 4 by default
      };
    });
    SSA.ui.newChart(ctx, {
      type: 'line',
      data: { labels: labels, datasets: datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } },
        scales: {
          y: { min: 50, max: 100, grid: { color: '#f1f5f9' }, ticks: { color: '#94a3b8' } },
          x: { grid: { display: false }, ticks: { color: '#94a3b8', maxRotation: 30, autoSkip: true } }
        }
      }
    });
  },

  radarChart: function (container, student) {
    const ctx = container.querySelector('#anaRadarChart');
    const data = SUBJECTS.map(function (subj) { return subjectAverage(student, subj); });
    const classAvg = SUBJECTS.map(function (subj) {
      return round1(avg(STUDENTS.filter(function (s) { return s.kelas === student.kelas; })
        .map(function (s) { return subjectAverage(s, subj); })));
    });
    SSA.ui.newChart(ctx, {
      type: 'radar',
      data: {
        labels: SUBJECTS,
        datasets: [
          { label: student.name, data: data, borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,.15)', borderWidth: 2, pointRadius: 3 },
          { label: 'Rata-rata Kelas ' + student.kelas, data: classAvg, borderColor: '#94a3b8', backgroundColor: 'rgba(148,163,184,.1)', borderWidth: 2, borderDash: [5,5], pointRadius: 2 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } },
        scales: {
          r: { min: 50, max: 100, ticks: { display: false, stepSize: 10 }, grid: { color: '#e2e8f0' }, angleLines: { color: '#e2e8f0' }, pointLabels: { font: { size: 10 }, color: '#64748b' } }
        }
      }
    });
  },

  summary: function (container, student, oa, strong, weak, ranked) {
    const el = container.querySelector('#analysisSummary');
    let html = '';

    const improvingCount = ranked.filter(function (r) { return r.trend > 0.3; }).length;
    const decliningCount = ranked.filter(function (r) { return r.trend < -0.3; }).length;
    const stableCount = ranked.length - improvingCount - decliningCount;

    // overall trend
    const avgTrend = round1(avg(ranked.map(function (r) { return r.trend; })));
    const trendText = avgTrend > 0.3 ? 'menunjukkan peningkatan yang positif' :
                      avgTrend < -0.3 ? 'menunjukkan penurunan yang perlu diwaspadai' :
                      'cenderung stabil';

    html += `<div class="alert-box info">
      <div class="icon">📈</div>
      <div class="body">Secara keseluruhan, perkembangan akademik <strong>${SSA.ui.escape(student.name)}</strong> ${trendText} dengan tren rata-rata ${avgTrend > 0 ? '+' : ''}${avgTrend} poin per penilaian.</div>
    </div>`;

    html += `<div class="alert-box success">
      <div class="icon">🏆</div>
      <div class="body"><strong>${strong.subject}</strong> adalah mata pelajaran terbaik dengan rata-rata <strong>${strong.value}</strong>. Siswa menunjukkan kemampuan unggul di bidang ini.</div>
    </div>`;

    html += `<div class="alert-box ${weak.value < 70 ? 'danger' : 'warn'}">
      <div class="icon">⚠️</div>
      <div class="body"><strong>${weak.subject}</strong> membutuhkan perhatian khusus dengan rata-rata <strong>${weak.value}</strong>. Disarankan untuk memberikan pendampingan belajar tambahan.</div>
    </div>`;

    html += `<div class="grid grid-3 mt-2">
      <div class="stat-card" style="box-shadow:none;border-color:var(--gray-100)">
        <div class="stat-icon green">↑</div>
        <div class="stat-info"><div class="stat-value">${improvingCount}</div><div class="stat-label">Mapel Meningkat</div></div>
      </div>
      <div class="stat-card" style="box-shadow:none;border-color:var(--gray-100)">
        <div class="stat-icon gray">→</div>
        <div class="stat-info"><div class="stat-value">${stableCount}</div><div class="stat-label">Mapel Stabil</div></div>
      </div>
      <div class="stat-card" style="box-shadow:none;border-color:var(--gray-100)">
        <div class="stat-icon red">↓</div>
        <div class="stat-info"><div class="stat-value">${decliningCount}</div><div class="stat-label">Mapel Menurun</div></div>
      </div>
    </div>`;

    el.innerHTML = html;
  }
};
