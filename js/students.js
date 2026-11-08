/* ============================================================
   Data Siswa module — list + detail
   ============================================================ */

SSA.routes.students = {
  render: function (container, param) {
    if (param) {
      this.renderDetail(container, param);
    } else {
      this.renderList(container);
    }
  },

  renderList: function (container) {
    container.innerHTML = `
      <div class="page-head">
        <h2>Data Siswa</h2>
        <p>Daftar lengkap siswa beserta nilai dan riwayat perkembangan.</p>
      </div>
      <div class="toolbar">
        <input type="text" class="input" id="searchInput" placeholder="🔍 Cari nama siswa..." style="flex:1;min-width:200px">
        <div>
          <select class="select" id="classFilter">
            <option value="">Semua Kelas</option>
            ${getAccessibleClasses().map(function (c) {
              return `<option value="${c}">Kelas ${c}</option>`;
            }).join('')}
          </select>
        </div>
      </div>
      <div class="student-list" id="studentList"></div>
    `;

    const listEl = container.querySelector('#studentList');
    const searchEl = container.querySelector('#searchInput');
    const classEl = container.querySelector('#classFilter');

    const update = () => {
      const q = searchEl.value.toLowerCase().trim();
      const cls = classEl.value;
      const filtered = getAccessibleStudents().filter(function (s) {
        const matchName = !q || s.name.toLowerCase().includes(q);
        const matchClass = !cls || s.kelas === cls;
        return matchName && matchClass;
      });
      this.renderStudentCards(listEl, filtered);
    };

    searchEl.addEventListener('input', update);
    classEl.addEventListener('change', update);
    update();
  },

  renderStudentCards: function (el, students) {
    if (!students.length) {
      el.innerHTML = '<div class="empty-state"><div class="icon">🔎</div><p>Tidak ada siswa yang cocok.</p></div>';
      return;
    }
    el.innerHTML = students.map(function (s) {
      const oa = overallAverage(s);
      const strong = strongestSubject(s);
      const weak = weakestSubject(s);
      return `
        <div class="student-card" onclick="SSA.router.navigate('students/${s.id}')">
          <div class="student-card-top">
            <div class="avatar">${SSA.ui.initials(s.name)}</div>
            <div style="min-width:0">
              <h4>${SSA.ui.escape(s.name)}</h4>
              <div class="meta">Kelas ${s.kelas}</div>
            </div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.7rem">
            <span class="badge badge-blue">Rata-rata ${oa}</span>
            <span class="badge ${oa >= 80 ? 'badge-green' : oa >= 70 ? 'badge-amber' : 'badge-red'}">${letterGrade(oa)}</span>
          </div>
          <div class="mini-grade-row"><span>🏆 ${strong.subject}</span><span class="val">${strong.value}</span></div>
          <div class="mini-grade-row"><span>📌 ${weak.subject}</span><span class="val">${weak.value}</span></div>
        </div>`;
    }).join('');
  },

  renderDetail: function (container, id) {
    const s = getStudentById(id);
    if (!s) {
      container.innerHTML = '<div class="empty-state"><div class="icon">❓</div><p>Siswa tidak ditemukan.</p></div>';
      return;
    }
    if (!SSA.auth.canAccessClass(s.kelas)) {
      container.innerHTML = '<div class="empty-state"><div class="icon">&#128274;</div><h3>Akses Ditolak</h3><p>Anda tidak memiliki akses ke kelas ' + s.kelas + '.</p></div>';
      return;
    }

    const oa = overallAverage(s);
    const sem1 = semesterAverage(s, 1);
    const sem2 = semesterAverage(s, 2);
    const strong = strongestSubject(s);
    const weak = weakestSubject(s);

    container.innerHTML = `
      <button class="back-link" onclick="SSA.router.navigate('students')">← Kembali ke Daftar Siswa</button>

      <div class="card mb-3">
        <div class="detail-header">
          <div class="avatar xl">${SSA.ui.initials(s.name)}</div>
          <div class="info" style="flex:1">
            <h3>${SSA.ui.escape(s.name)}</h3>
            <p>Kelas ${s.kelas} · NIS ${String(2024000 + parseInt(s.id)).slice(0)}</p>
          </div>
          <div style="text-align:right">
            <div class="stat-value">${oa}</div>
            <span class="badge ${oa >= 80 ? 'badge-green' : oa >= 70 ? 'badge-amber' : 'badge-red'}">Predikat ${letterGrade(oa)}</span>
          </div>
        </div>

        <div class="stat-grid" style="margin-bottom:0">
          <div class="stat-card" style="box-shadow:none;border-color:var(--gray-100)">
            <div class="stat-icon blue">📅</div>
            <div class="stat-info"><div class="stat-value" style="font-size:1.3rem">${sem1}</div><div class="stat-label">Rata-rata Semester 1</div></div>
          </div>
          <div class="stat-card" style="box-shadow:none;border-color:var(--gray-100)">
            <div class="stat-icon green">📅</div>
            <div class="stat-info"><div class="stat-value" style="font-size:1.3rem">${sem2}</div><div class="stat-label">Rata-rata Semester 2</div></div>
          </div>
          <div class="stat-card" style="box-shadow:none;border-color:var(--gray-100)">
            <div class="stat-icon amber">🏆</div>
            <div class="stat-info"><div class="stat-value" style="font-size:1.15rem">${strong.subject}</div><div class="stat-label">Terbaik (${strong.value})</div></div>
          </div>
          <div class="stat-card" style="box-shadow:none;border-color:var(--gray-100)">
            <div class="stat-icon red">📌</div>
            <div class="stat-info"><div class="stat-value" style="font-size:1.15rem">${weak.subject}</div><div class="stat-label">Perlu Perhatian (${weak.value})</div></div>
          </div>
        </div>
      </div>

      ${!hasAnyGrades(s) ? '<div class="alert-box info" style="margin-bottom:1rem"><div class="icon">\uD83D\uDCCB</div><div class="body"><strong>Siswa ini belum memiliki nilai.</strong> Tambahkan nilai melalui menu Manajemen Siswa \u2192 Edit Siswa.</div></div>' : ''}

      <!-- Tabs -->
      <div class="tabs">
        <button class="tab active" data-tab="grades">Nilai Mata Pelajaran</button>
        <button class="tab" data-tab="history">Riwayat Nilai</button>
        <button class="tab" data-tab="trend">Grafik Perkembangan</button>
      </div>

      <div id="tab-grades" class="tab-panel">
        <div class="card">
          <h3 class="card-title">Nilai Mata Pelajaran (Rata-rata Tahunan)</h3>
          <div class="table-wrap">
            <table class="data-table">
              <thead><tr><th>Mata Pelajaran</th><th>Semester 1</th><th>Semester 2</th><th>Rata-rata</th><th>Tren</th><th>Predikat</th></tr></thead>
              <tbody>
                ${SUBJECTS.map(function (subj) {
                  const s1 = round1(avg(s.grades[subj].filter(function(g){return g.semester===1}).map(function(g){return g.score})));
                  const s2 = round1(avg(s.grades[subj].filter(function(g){return g.semester===2}).map(function(g){return g.score})));
                  const avgAll = subjectAverage(s, subj);
                  const trend = subjectTrend(s, subj);
                  const tl = trendLabel(trend);
                  return `<tr>
                    <td><span style="display:inline-flex;align-items:center;gap:.4rem"><span style="width:10px;height:10px;border-radius:50%;background:${SUBJECT_COLORS[subj]};display:inline-block"></span>${subj}</span></td>
                    <td>${s1}</td><td>${s2}</td><td><strong>${avgAll}</strong></td>
                    <td><span class="badge ${tl.cls === 'trend-up' ? 'badge-green' : tl.cls === 'trend-down' ? 'badge-red' : 'badge-gray'}">${tl.text}</span></td>
                    <td><span class="badge ${avgAll>=80?'badge-green':avgAll>=70?'badge-amber':'badge-red'}">${letterGrade(avgAll)}</span></td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div id="tab-history" class="tab-panel" style="display:none">
        <div class="card">
          <h3 class="card-title">Riwayat Nilai Harian & Semester</h3>
          <div class="table-wrap">
            <table class="data-table">
              <thead><tr><th>Tanggal</th><th>Mata Pelajaran</th><th>Jenis</th><th>Semester</th><th>Nilai</th><th>Predikat</th></tr></thead>
              <tbody>
                ${(function () {
                  // flatten all assessments, sort by date descending
                  const all = [];
                  SUBJECTS.forEach(function (subj) {
                    s.grades[subj].forEach(function (g) {
                      all.push({ date: g.date, subject: subj, type: g.type, label: g.label, semester: g.semester, score: g.score });
                    });
                  });
                  all.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
                  return all.map(function (g) {
                    return `<tr>
                      <td>${SSA.ui.formatDate(g.date)}</td>
                      <td>${g.subject}</td>
                      <td><span class="badge ${g.type==='UAS'?'badge-purple':g.type==='UTS'?'badge-blue':'badge-gray'}">${g.label}</span></td>
                      <td>${g.semester}</td>
                      <td><strong>${g.score}</strong></td>
                      <td><span class="badge ${g.score>=80?'badge-green':g.score>=70?'badge-amber':'badge-red'}">${letterGrade(g.score)}</span></td>
                    </tr>`;
                  }).join('');
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div id="tab-trend" class="tab-panel" style="display:none">
        <div class="card">
          <h3 class="card-title">Grafik Perkembangan Nilai</h3>
          <div class="chart-wrap lg"><canvas id="studentTrendChart"></canvas></div>
        </div>
      </div>
    `;

    // Tab switching
    const tabs = container.querySelectorAll('.tab');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        container.querySelectorAll('.tab-panel').forEach(function (p) { p.style.display = 'none'; });
        container.querySelector('#tab-' + tab.dataset.tab).style.display = '';
        if (tab.dataset.tab === 'trend') this.renderTrendChart(container, s);
      }.bind(this));
    }.bind(this));
  },

  renderTrendChart: function (container, student) {
    const ctx = container.querySelector('#studentTrendChart');
    if (!ctx) return;
    const labels = ASSESSMENT_SCHEDULE.map(function (a) { return a.label; });

    const datasets = SUBJECTS.map(function (subj) {
      return {
        label: subj,
        data: student.grades[subj].map(function (g) { return g.score; }),
        borderColor: SUBJECT_COLORS[subj],
        backgroundColor: SUBJECT_COLORS[subj],
        tension: .3,
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5
      };
    });

    SSA.ui.newChart(ctx, {
      type: 'line',
      data: { labels: labels, datasets: datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
          tooltip: { callbacks: { label: function (c) { return c.dataset.label + ': ' + c.parsed.y; } } }
        },
        scales: {
          y: { min: 50, max: 100, grid: { color: SSA.chartGridColor() }, ticks: { color: '#94a3b8' } },
          x: { grid: { display: false }, ticks: { color: '#94a3b8', maxRotation: 30, autoSkip: true } }
        }
      }
    });
  }
};
