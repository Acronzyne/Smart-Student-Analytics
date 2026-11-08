/* ============================================================
   Minat & Bakat module — questionnaire, grouping, recommendations
   ============================================================ */

SSA.routes.interests = {
  // in-session questionnaire answers (so user can re-take)
  _tempAnswers: {},

  render: function (container) {
    container.innerHTML = `
      <div class="page-head">
        <h2>Minat & Bakat</h2>
        <p>Kuesioner minat siswa, pengelompokan kecenderungan, dan rekomendasi pengembangan potensi.</p>
      </div>

      <div class="tabs">
        <button class="tab active" data-tab="survey">Kuesioner</button>
        <button class="tab" data-tab="results">Hasil & Rekomendasi</button>
      </div>

      <div id="tab-survey" class="tab-panel">
        <div class="toolbar">
          <div>
            <label class="label">Pilih Kelas</label>
            <select class="select" id="surveyClassSelect">
              <option value="">Semua Kelas</option>
              ${getAccessibleClasses().map(function (c) {
                return `<option value="${c}">Kelas ${c}</option>`;
              }).join('')}
            </select>
          </div>
          <div style="flex:1">
            <label class="label">Pilih Siswa untuk Mengisi Kuesioner</label>
            <select class="select" id="surveyStudentSelect"></select>
          </div>
          <div style="display:flex;align-items:flex-end;gap:.5rem">
            <button class="btn btn-outline" id="resetAnswers">Reset Jawaban</button>
          </div>
        </div>

        <div class="card">
          <h3 class="card-title">📝 Kuesioner Minat Siswa</h3>
          <p class="text-sm text-gray mb-3">Beri penilaian dari 1 (Sangat Tidak Setuju) sampai 5 (Sangat Setuju) untuk setiap pernyataan berikut.</p>
          <div id="questionnaireArea"></div>
          <div class="flex items-center gap-2 mt-3" style="justify-content:space-between;flex-wrap:wrap">
            <span class="text-sm text-gray" id="progressLabel">0 dari ${QUESTIONNAIRE.length} terisi</span>
            <button class="btn btn-primary" id="submitSurvey">Kirim Kuesioner →</button>
          </div>
        </div>
      </div>

      <div id="tab-results" class="tab-panel" style="display:none">
        <div class="toolbar">
          <div>
            <label class="label">Pilih Kelas</label>
            <select class="select" id="resultClassSelect">
              <option value="">Semua Kelas</option>
              ${getAccessibleClasses().map(function (c) {
                return `<option value="${c}">Kelas ${c}</option>`;
              }).join('')}
            </select>
          </div>
          <div style="flex:1">
            <label class="label">Pilih Siswa untuk Melihat Hasil</label>
            <select class="select" id="resultStudentSelect"></select>
          </div>
        </div>
        <div id="resultArea"></div>
      </div>
    `;

    this.bindTabs(container);
    this.bindSurvey(container);
    this.bindResults(container);
  },

  bindTabs: function (container) {
    const tabs = container.querySelectorAll('.tab');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        container.querySelectorAll('.tab-panel').forEach(function (p) { p.style.display = 'none'; });
        container.querySelector('#tab-' + tab.dataset.tab).style.display = '';
      });
    });
  },

  bindSurvey: function (container) {
    const classSelect = container.querySelector('#surveyClassSelect');
    const select = container.querySelector('#surveyStudentSelect');
    const area = container.querySelector('#questionnaireArea');
    const progressLabel = container.querySelector('#progressLabel');
    const resetBtn = container.querySelector('#resetAnswers');
    const submitBtn = container.querySelector('#submitSurvey');

    const renderQuestions = () => {
      const student = getStudentById(select.value);
      if (!student) {
        area.innerHTML = SSA.ui.noStudentsMsg();
        return;
      }
      // load existing answers (from student data or temp)
      if (!SSA.routes.interests._tempAnswers[student.id]) {
        SSA.routes.interests._tempAnswers[student.id] = Object.assign({}, student.answers);
      }
      const answers = SSA.routes.interests._tempAnswers[student.id];

      area.innerHTML = QUESTIONNAIRE.map(function (q) {
        const cat = CATEGORY_INFO[q.category];
        return `
          <div class="question-card" data-qid="${q.id}">
            <div class="question-text">${q.id}. ${SSA.ui.escape(q.text)} <span class="badge badge-gray" style="font-size:.7rem">${cat.icon} ${q.category}</span></div>
            <div class="rating-group">
              ${RATING_LABELS.map(function (label, i) {
                const val = i + 1;
                return `<button type="button" class="rating-btn ${answers[q.id] === val ? 'active' : ''}" data-val="${val}" data-qid="${q.id}">
                  <span class="num">${val}</span>${label}
                </button>`;
              }).join('')}
            </div>
          </div>`;
      }).join('');

      // bind rating buttons
      area.querySelectorAll('.rating-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          const qid = parseInt(btn.dataset.qid);
          const val = parseInt(btn.dataset.val);
          answers[qid] = val;
          // update active states for this question
          area.querySelectorAll('.rating-btn[data-qid="' + qid + '"]').forEach(function (b) {
            b.classList.toggle('active', parseInt(b.dataset.val) === val);
          });
          // persist intermediate answers immediately
          student.answers = Object.assign({}, answers);
          saveStudentQuestionnaire(student);
          updateProgress();
        });
      });

      updateProgress();
    };

    function updateProgress() {
      const student = getStudentById(select.value);
      if (!student) { progressLabel.textContent = '0 dari ' + QUESTIONNAIRE.length + ' terisi'; return; }
      const answers = SSA.routes.interests._tempAnswers[student.id] || {};
      const filled = Object.keys(answers).length;
      progressLabel.textContent = `${filled} dari ${QUESTIONNAIRE.length} terisi`;
    }

    function populateStudents() {
      const cls = classSelect.value;
      const filtered = (cls
        ? getAccessibleStudents().filter(function (s) { return s.kelas === cls; })
        : getAccessibleStudents().slice()
      ).sort(function (a, b) { return a.kelas.localeCompare(b.kelas) || a.name.localeCompare(b.name); });
      select.innerHTML = filtered.map(function (s) {
        return `<option value="${s.id}">Kelas ${s.kelas} — ${SSA.ui.escape(s.name)}</option>`;
      }).join('');
      renderQuestions();
    }

    classSelect.addEventListener('change', populateStudents);
    select.addEventListener('change', renderQuestions);
    resetBtn.addEventListener('click', function () {
      const student = getStudentById(select.value);
      if (!student) return;
      // clear from localStorage too so it won't reload on refresh
      clearStudentQuestionnaire(student.id);
      SSA.routes.interests._tempAnswers[student.id] = {};
      renderQuestions();
    });

    submitBtn.addEventListener('click', function () {
      const student = getStudentById(select.value);
      if (!student) return;
      const answers = SSA.routes.interests._tempAnswers[student.id] || {};
      if (Object.keys(answers).length < QUESTIONNAIRE.length) {
        alert('Mohon lengkapi semua ' + QUESTIONNAIRE.length + ' pertanyaan terlebih dahulu.');
        return;
      }
      // recompute interest scores from answers
      const newScores = {};
      INTEREST_CATEGORIES.forEach(function (cat) {
        const catQuestions = QUESTIONNAIRE.filter(function (q) { return q.category === cat; });
        const sum = catQuestions.reduce(function (acc, q) { return acc + (answers[q.id] || 0); }, 0);
        newScores[cat] = Math.round((sum / (catQuestions.length * 5)) * 100);
      });
      student.interests = newScores;
      student.answers = Object.assign({}, answers);
      student.hasFilledQuestionnaire = true;
      // persist final result to localStorage
      saveStudentQuestionnaire(student);
      alert('Kuesioner berhasil disimpan! Skor minat telah diperbarui untuk ' + student.name + '.');
      // switch to results tab
      container.querySelector('[data-tab="results"]').click();
      // sync result class dropdown to student's class
      var resultClassSelect = container.querySelector('#resultClassSelect');
      resultClassSelect.value = student.kelas;
      resultClassSelect.dispatchEvent(new Event('change'));
      container.querySelector('#resultStudentSelect').value = student.id;
      container.querySelector('#resultStudentSelect').dispatchEvent(new Event('change'));
    });

    populateStudents();
  },

  bindResults: function (container) {
    const classSelect = container.querySelector('#resultClassSelect');
    const select = container.querySelector('#resultStudentSelect');
    const area = container.querySelector('#resultArea');

    const render = () => {
      const student = getStudentById(select.value);
      if (!student) {
        area.innerHTML = SSA.ui.noStudentsMsg();
        return;
      }
      this.renderResults(area, student);
    };

    function populateStudents() {
      const cls = classSelect.value;
      const filtered = (cls
        ? getAccessibleStudents().filter(function (s) { return s.kelas === cls; })
        : getAccessibleStudents().slice()
      ).sort(function (a, b) { return a.kelas.localeCompare(b.kelas) || a.name.localeCompare(b.name); });
      select.innerHTML = filtered.map(function (s) {
        return `<option value="${s.id}">Kelas ${s.kelas} — ${SSA.ui.escape(s.name)}</option>`;
      }).join('');
      render();
    }

    classSelect.addEventListener('change', populateStudents);
    select.addEventListener('change', render);
    populateStudents();
  },

  renderResults: function (container, student) {
    const ranked = topInterests(student);
    const top = ranked[0];

    container.innerHTML = `
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-icon ${student.hasFilledQuestionnaire ? 'green' : 'gray'}">${student.hasFilledQuestionnaire ? '✅' : '⏳'}</div>
          <div class="stat-info"><div class="stat-value" style="font-size:1.2rem">${student.hasFilledQuestionnaire ? 'Sudah' : 'Belum'}</div><div class="stat-label">Status Kuesioner</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon blue">${CATEGORY_INFO[top.category].icon}</div>
          <div class="stat-info"><div class="stat-value" style="font-size:1.2rem">${top.category}</div><div class="stat-label">Minat Dominan (${top.value}%)</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon purple">🎯</div>
          <div class="stat-info"><div class="stat-value" style="font-size:1.2rem">${ranked.filter(function(r){return r.value>=60;}).length}</div><div class="stat-label">Bidang Berpotensi</div></div>
        </div>
      </div>

      <div class="grid grid-2 mb-3">
        <div class="card">
          <h3 class="card-title">📊 Profil Minat Siswa</h3>
          <div class="chart-wrap"><canvas id="interestChart"></canvas></div>
        </div>
        <div class="card">
          <h3 class="card-title">🔍 Pengelompokan Kecenderungan</h3>
          <div id="categoryList"></div>
        </div>
      </div>

      <div class="card">
        <h3 class="card-title">💡 Rekomendasi Bidang Pengembangan Potensi</h3>
        <div id="recoArea"></div>
      </div>
    `;

    this.interestChart(container, student, ranked);
    this.categoryList(container, student, ranked);
    this.recommendations(container, student, ranked);
  },

  interestChart: function (container, student, ranked) {
    const ctx = container.querySelector('#interestChart');
    SSA.ui.newChart(ctx, {
      type: 'bar',
      data: {
        labels: ranked.map(function (r) { return r.category; }),
        datasets: [{
          label: 'Skor Minat',
          data: ranked.map(function (r) { return r.value; }),
          backgroundColor: ranked.map(function (r) { return CATEGORY_INFO[r.category].color; }),
          borderRadius: 8,
          maxBarThickness: 44
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (c) { return c.parsed.x + '%'; } } } },
        scales: {
          x: { min: 0, max: 100, grid: { color: SSA.chartGridColor() }, ticks: { color: '#94a3b8', callback: function (v) { return v + '%'; } } },
          y: { grid: { display: false }, ticks: { color: '#475569', font: { size: 11 } } }
        }
      }
    });
  },

  categoryList: function (container, student, ranked) {
    const el = container.querySelector('#categoryList');
    el.innerHTML = ranked.map(function (r) {
      const info = CATEGORY_INFO[r.category];
      const tier = r.value >= 80 ? { label: 'Sangat Tinggi', cls: 'badge-green' } :
                   r.value >= 60 ? { label: 'Tinggi', cls: 'badge-blue' } :
                   r.value >= 40 ? { label: 'Sedang', cls: 'badge-amber' } :
                   { label: 'Rendah', cls: 'badge-gray' };
      return `
        <div class="interest-row">
          <div class="top">
            <span class="name">${info.icon} ${r.category} <span class="badge ${tier.cls}" style="font-size:.7rem">${tier.label}</span></span>
            <span class="pct">${r.value}%</span>
          </div>
          <div class="progress"><div class="progress-fill" style="width:${r.value}%;background:${info.color}"></div></div>
        </div>`;
    }).join('');
  },

  recommendations: function (container, student, ranked) {
    const el = container.querySelector('#recoArea');
    const top3 = ranked.slice(0, 3);
    let html = '';

    html += `<div class="alert-box info">
      <div class="icon">🎯</div>
      <div class="body">Berdasarkan hasil kuesioner, <strong>${SSA.ui.escape(student.name)}</strong> memiliki kecenderungan minat tertinggi pada bidang <strong>${ranked[0].category}</strong>. Berikut rekomendasi pengembangan potensinya:</div>
    </div>`;

    top3.forEach(function (r) {
      const info = CATEGORY_INFO[r.category];
      html += `
        <div class="reco-box" style="background:${info.color}10;border-color:${info.color}30">
          <h4 style="color:${info.color}">${info.icon} ${r.category} <span class="badge badge-gray" style="font-size:.7rem">${r.value}%</span></h4>
          <p class="text-sm text-gray mb-2">${info.desc}</p>
          <ul class="reco-list">
            ${info.recommendations.map(function (rec) {
              return `<li>${rec}</li>`;
            }).join('')}
          </ul>
        </div>`;
    });

    el.innerHTML = html;
  }
};
