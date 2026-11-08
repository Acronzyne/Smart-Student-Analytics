/* ============================================================
   Dashboard module
   ============================================================ */

SSA.routes.dashboard = {
  render: function (container) {
    const stats = getScopedStats();
    const isAdmin = SSA.auth.isAdmin();
    const scopeLabel = isAdmin ? 'seluruh siswa' : 'kelas Anda';

    container.innerHTML = `
      <div class="page-head">
        <h2>Dashboard</h2>
        <p>Ringkasan perkembangan akademik ${scopeLabel} tahun ajaran ${SSA_SETTINGS.schoolYear}.</p>
      </div>

      <!-- Stat cards -->
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-icon blue">👥</div>
          <div class="stat-info">
            <div class="stat-value">${stats.total}</div>
            <div class="stat-label">Total Siswa</div>
            <div class="stat-sub" style="color:var(--gray-400)">${stats.classes.length} kelas aktif</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green">📊</div>
          <div class="stat-info">
            <div class="stat-value">${stats.overall}</div>
            <div class="stat-label">Rata-rata Nilai</div>
            <div class="stat-sub trend-up">▲ Semua mata pelajaran</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon amber">📈</div>
          <div class="stat-info">
            <div class="stat-value">${stats.improving}</div>
            <div class="stat-label">Siswa Meningkat</div>
            <div class="stat-sub" style="color:var(--amber)">Tren positif</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon red">⚠️</div>
          <div class="stat-info">
            <div class="stat-value">${stats.declining}</div>
            <div class="stat-label">Perlu Perhatian</div>
            <div class="stat-sub trend-down">Tren menurun</div>
          </div>
        </div>
      </div>

      <!-- Charts row -->
      <div class="grid grid-2 mb-3">
        <div class="card">
          <div class="card-header">
            <h3>Perkembangan Nilai Rata-rata</h3>
            <span class="badge badge-blue">2 Semester</span>
          </div>
          <div class="chart-wrap"><canvas id="trendChart"></canvas></div>
        </div>
        <div class="card">
          <div class="card-header">
            <h3>Rata-rata per Mata Pelajaran</h3>
            <span class="badge badge-gray">${SUBJECTS.length} Mapel</span>
          </div>
          <div class="chart-wrap"><canvas id="subjectChart"></canvas></div>
        </div>
      </div>

      <!-- Summary row -->
      <div class="grid grid-2">
        <div class="card">
          <h3 class="card-title">Ringkasan Perkembangan Akademik</h3>
          <div id="summaryList"></div>
        </div>
        <div class="card">
          <h3 class="card-title">Distribusi Per Kelas</h3>
          <div id="classList"></div>
        </div>
      </div>
    `;

    this.trendChart(container, stats);
    this.subjectChart(container, stats);
    this.summary(container, stats);
    this.classList(container, stats);
  },

  trendChart: function (container, stats) {
    const ctx = container.querySelector('#trendChart');
    const labels = ASSESSMENT_SCHEDULE.map(function (a) { return a.label; });
    const data = stats.trendByAssessment;

    // gradient
    const c = ctx.getContext('2d');
    const grad = c.createLinearGradient(0, 0, 0, 320);
    grad.addColorStop(0, 'rgba(59,130,246,.28)');
    grad.addColorStop(1, 'rgba(59,130,246,0)');

    SSA.ui.newChart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Rata-rata Nilai',
          data: data,
          borderColor: '#2563eb',
          backgroundColor: grad,
          fill: true,
          tension: .35,
          borderWidth: 3,
          pointBackgroundColor: '#2563eb',
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: function (c) { return 'Nilai: ' + c.parsed.y; } } }
        },
        scales: {
          y: { min: 60, max: 100, grid: { color: SSA.chartGridColor() }, ticks: { color: '#94a3b8' } },
          x: { grid: { display: false }, ticks: { color: '#94a3b8', maxRotation: 30, autoSkip: true } }
        }
      }
    });
  },

  subjectChart: function (container, stats) {
    const ctx = container.querySelector('#subjectChart');
    SSA.ui.newChart(ctx, {
      type: 'bar',
      data: {
        labels: SUBJECTS,
        datasets: [{
          label: 'Rata-rata',
          data: SUBJECTS.map(function (s) { return stats.subjectAvgs[s]; }),
          backgroundColor: SUBJECTS.map(function (s) { return SUBJECT_COLORS[s]; }),
          borderRadius: 8,
          maxBarThickness: 42
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { min: 60, max: 100, grid: { color: SSA.chartGridColor() }, ticks: { color: '#94a3b8' } },
          x: { grid: { display: false }, ticks: { color: '#94a3b8', maxRotation: 30, autoSkip: true } }
        }
      }
    });
  },

  summary: function (container, stats) {
    const list = container.querySelector('#summaryList');
    let html = '';

    // Empty state — no students or no grade data
    if (!stats.trendByAssessment.length || stats.total === 0) {
      list.innerHTML = '<div class="alert-box info"><div class="icon">\uD83D\uDCCB</div><div class="body">Belum ada data nilai. Tambahkan siswa dan masukkan nilai melalui menu Manajemen Siswa.</div></div>';
      return;
    }

    // overall trend direction
    const first = stats.trendByAssessment[0];
    const last = stats.trendByAssessment[stats.trendByAssessment.length - 1];
    const diff = Math.round((last - first) * 10) / 10;
    const dir = diff > 0 ? 'meningkat' : (diff < 0 ? 'menurun' : 'stabil');
    html += `<div class="alert-box ${diff >= 0 ? 'success' : 'warn'}">
      <div class="icon">${diff >= 0 ? '📈' : '📉'}</div>
      <div class="body">Rata-rata nilai kelas secara umum <strong>${dir}</strong> sebesar <strong>${Math.abs(diff)} poin</strong> dari awal hingga akhir tahun ajaran (dari ${first} menjadi ${last}).</div>
    </div>`;

    // strongest subject overall
    let bestSubj = SUBJECTS[0], bestVal = 0;
    SUBJECTS.forEach(function (s) { if (stats.subjectAvgs[s] > bestVal) { bestVal = stats.subjectAvgs[s]; bestSubj = s; } });
    html += `<div class="alert-box info">
      <div class="icon">🏆</div>
      <div class="body">Mata pelajaran dengan rata-rata tertinggi: <strong>${bestSubj}</strong> (${bestVal}).</div>
    </div>`;

    // weakest subject overall
    let worstSubj = SUBJECTS[0], worstVal = 100;
    SUBJECTS.forEach(function (s) { if (stats.subjectAvgs[s] < worstVal) { worstVal = stats.subjectAvgs[s]; worstSubj = s; } });
    html += `<div class="alert-box warn">
      <div class="icon">📌</div>
      <div class="body">Mata pelajaran dengan rata-rata terendah: <strong>${worstSubj}</strong> (${worstVal}). Perlu strategi pembelajaran tambahan.</div>
    </div>`;

    html += `<div class="alert-box ${stats.declining === 0 ? 'success' : 'danger'}">
      <div class="icon">${stats.declining === 0 ? '✅' : '⚠️'}</div>
      <div class="body"><strong>${stats.declining} siswa</strong> menunjukkan tren penurunan nilai dan membutuhkan perhatian khusus.</div>
    </div>`;

    list.innerHTML = html;
  },

  classList: function (container, stats) {
    const el = container.querySelector('#classList');
    let html = '';
    stats.classes.forEach(function (cls) {
      const classStudents = getAccessibleStudents().filter(function (s) { return s.kelas === cls; });
      const classAvg = round1(avg(classStudents.map(function (s) { return overallAverage(s); })));
      const pct = Math.round(classAvg);
      html += `
        <div class="interest-row">
          <div class="top">
            <span class="name">🏫 Kelas ${cls}</span>
            <span class="pct">${classStudents.length} siswa · rata-rata ${classAvg}</span>
          </div>
          <div class="progress"><div class="progress-fill" style="width:${pct}%;background:linear-gradient(90deg,#3b82f6,#2563eb)"></div></div>
        </div>`;
    });
    el.innerHTML = html;
  }
};
