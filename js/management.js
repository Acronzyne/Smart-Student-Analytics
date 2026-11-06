/* ============================================================
   Manajemen Siswa module — CRUD untuk guru
   Tambah/hapus siswa, ubah kelas & nilai
   ============================================================ */

SSA.routes.management = {
  render: function (container, param) {
    if (param === 'add') {
      this.renderAddForm(container);
    } else if (param) {
      this.renderEditForm(container, param);
    } else {
      this.renderList(container);
    }
  },

  /* ---------- Student list with actions ---------- */
  renderList: function (container) {
    container.innerHTML = `
      <div class="page-head">
        <h2>Manajemen Siswa</h2>
        <p>Tambah, ubah, dan hapus data siswa beserta nilai.</p>
      </div>
      <div class="toolbar">
        <button class="btn btn-primary" onclick="SSA.router.navigate('management/add')">➕ Tambah Siswa</button>
      </div>
      <div class="card">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Nama</th>
                <th>Kelas</th>
                <th>Rata-rata</th>
                <th>Predikat</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              ${STUDENTS.length ? STUDENTS.map(function (s, i) {
                const oa = overallAverage(s);
                return `<tr>
                  <td>${i + 1}</td>
                  <td><div class="flex items-center gap-1"><div class="avatar" style="width:28px;height:28px;font-size:.72rem">${SSA.ui.initials(s.name)}</div> ${SSA.ui.escape(s.name)}</div></td>
                  <td><span class="badge badge-blue">${s.kelas}</span></td>
                  <td><strong>${oa}</strong></td>
                  <td><span class="badge ${oa >= 80 ? 'badge-green' : oa >= 70 ? 'badge-amber' : 'badge-red'}">${letterGrade(oa)}</span></td>
                  <td style="white-space:nowrap">
                    <button class="action-btn edit" onclick="SSA.router.navigate('management/${s.id}')" title="Edit siswa">✏️</button>
                    <button class="action-btn delete" onclick="SSA.routes.management.confirmDelete(${s.id})" title="Hapus siswa">🗑️</button>
                  </td>
                </tr>`;
              }).join('') : '<tr><td colspan="6" class="empty-state">Belum ada siswa. Klik "Tambah Siswa" untuk menambah.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  confirmDelete: function (id) {
    const s = getStudentById(id);
    if (!s) return;
    if (confirm('Hapus siswa "' + s.name + '"?\n\nTindakan ini tidak dapat dibatalkan.')) {
      removeStudent(id);
      SSA.router.render();
    }
  },

  /* ---------- Add new student form ---------- */
  renderAddForm: function (container) {
    const classes = getGlobalStats().classes;

    container.innerHTML = `
      <button class="back-link" onclick="SSA.router.navigate('management')">← Kembali ke Manajemen</button>

      <div class="page-head">
        <h2>Tambah Siswa Baru</h2>
        <p>Isi data siswa dan nilai awal per mata pelajaran. Sistem akan membuat riwayat nilai dengan variasi wajar dari nilai awal.</p>
      </div>

      <div class="card mb-3">
        <h3 class="card-title">📋 Data Siswa</h3>
        <div class="form-grid">
          <div>
            <label class="label">Nama Lengkap *</label>
            <input type="text" class="input" id="newStudentName" placeholder="cth: Andi Wijaya">
          </div>
          <div>
            <label class="label">Kelas *</label>
            <input type="text" class="input" id="newStudentClass" list="classListOpts" placeholder="cth: 8A">
            <datalist id="classListOpts">
              ${classes.map(function (c) { return '<option value="' + c + '">'; }).join('')}
            </datalist>
          </div>
        </div>
      </div>

      <div class="card mb-3">
        <h3 class="card-title">📊 Nilai Awal per Mata Pelajaran</h3>
        <p class="text-sm text-gray mb-2">Masukkan perkiraan nilai awal (0–100). Nilai akan terdistribusi pada 10 penilaian.</p>
        <div class="form-grid grid-2">
          ${SUBJECTS.map(function (subj) {
            return `<div>
              <label class="label">${subj}</label>
              <input type="number" class="input grade-base-input" data-subject="${SSA.ui.escape(subj)}" value="75" min="0" max="100" style="width:90px">
            </div>`;
          }).join('')}
        </div>
      </div>

      <div class="flex gap-2">
        <button class="btn btn-outline" onclick="SSA.router.navigate('management')">Batal</button>
        <button class="btn btn-primary" id="saveNewStudent">💾 Simpan Siswa</button>
      </div>
    `;

    const saveBtn = container.querySelector('#saveNewStudent');
    saveBtn.addEventListener('click', function () {
      const name = container.querySelector('#newStudentName').value.trim();
      const kelas = container.querySelector('#newStudentClass').value.trim();
      if (!name || !kelas) {
        alert('Nama dan kelas harus diisi.');
        return;
      }
      const baseGrades = {};
      container.querySelectorAll('.grade-base-input').forEach(function (input) {
        const subj = input.dataset.subject;
        const val = parseInt(input.value);
        baseGrades[subj] = (isNaN(val) ? 75 : clamp(val, 0, 100));
      });
      addStudent(name, kelas, baseGrades);
      alert('Siswa "' + name + '" berhasil ditambahkan ke kelas ' + kelas + '!');
      SSA.router.navigate('management');
    });
  },

  /* ---------- Edit student (info + grades) ---------- */
  renderEditForm: function (container, id) {
    const s = getStudentById(id);
    if (!s) {
      container.innerHTML = '<div class="empty-state"><div class="icon">❓</div><p>Siswa tidak ditemukan.</p></div>';
      return;
    }

    const oa = overallAverage(s);
    const classes = getGlobalStats().classes;

    container.innerHTML = `
      <button class="back-link" onclick="SSA.router.navigate('management')">← Kembali ke Manajemen</button>

      <div class="page-head">
        <h2>Edit Siswa</h2>
        <p>Ubah data siswa, kelas, dan kelola nilai per mata pelajaran.</p>
      </div>

      <!-- Edit info -->
      <div class="card mb-3">
        <div class="detail-header" id="editHeader">
          <div class="avatar xl">${SSA.ui.initials(s.name)}</div>
          <div class="info" style="flex:1">
            <h3 id="editHeaderName">${SSA.ui.escape(s.name)}</h3>
            <p id="editHeaderMeta">Kelas ${s.kelas} · Rata-rata ${oa} · ${letterGrade(oa)}</p>
          </div>
        </div>
        <h3 class="card-title">📋 Data Siswa</h3>
        <div class="form-grid">
          <div>
            <label class="label">Nama Lengkap</label>
            <input type="text" class="input" id="editStudentName" value="${SSA.ui.escape(s.name)}">
          </div>
          <div>
            <label class="label">Kelas</label>
            <input type="text" class="input" id="editStudentClass" list="classListOpts2" value="${s.kelas}">
            <datalist id="classListOpts2">
              ${classes.map(function (c) { return '<option value="' + c + '">'; }).join('')}
            </datalist>
          </div>
        </div>
        <div class="mt-2 flex items-center gap-1">
          <button class="btn btn-primary btn-sm" id="saveStudentInfo">💾 Simpan Data Siswa</button>
          <span class="saved-flash" id="infoSaved">✓ Tersimpan</span>
        </div>
      </div>

      <!-- Grade management -->
      <div class="card">
        <h3 class="card-title">📊 Kelola Nilai</h3>
        <div id="gradeSection"></div>
      </div>
    `;

    /* --- Save student info --- */
    const saveInfoBtn = container.querySelector('#saveStudentInfo');
    saveInfoBtn.addEventListener('click', function () {
      const name = container.querySelector('#editStudentName').value.trim();
      const kelas = container.querySelector('#editStudentClass').value.trim();
      if (!name || !kelas) {
        alert('Nama dan kelas harus diisi.');
        return;
      }
      updateStudentInfo(s.id, name, kelas);
      // update header display
      container.querySelector('#editHeaderName').textContent = name;
      container.querySelector('#editHeaderMeta').textContent = 'Kelas ' + kelas + ' · Rata-rata ' + overallAverage(s) + ' · ' + letterGrade(overallAverage(s));
      // flash saved indicator
      const flash = container.querySelector('#infoSaved');
      flash.classList.add('show');
      setTimeout(function () { flash.classList.remove('show'); }, 1800);
    });

    /* --- Grade management (subject selector + editable table + add form) --- */
    const gradeSection = container.querySelector('#gradeSection');
    let currentSubject = SUBJECTS[0];

    function renderGradeSection() {
      const subj = currentSubject;
      const assessments = s.grades[subj] || [];

      gradeSection.innerHTML = `
        <div class="toolbar">
          <div style="flex:1">
            <label class="label">Mata Pelajaran</label>
            <select class="select" id="subjectSelect" style="min-width:280px">
              ${SUBJECTS.map(function (subj2) {
                return '<option value="' + subj2 + '"' + (subj2 === subj ? ' selected' : '') + '>' +
                  subj2 + ' (rata-rata ' + subjectAverage(s, subj2) + ')</option>';
              }).join('')}
            </select>
          </div>
          <div style="display:flex;align-items:flex-end">
            <span class="badge ${subjectAverage(s, subj) >= 80 ? 'badge-green' : subjectAverage(s, subj) >= 70 ? 'badge-amber' : 'badge-red'}">Rata-rata: ${subjectAverage(s, subj)}</span>
          </div>
        </div>

        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Jenis</th>
                <th>Semester</th>
                <th style="width:80px;text-align:center">Nilai</th>
                <th style="width:50px;text-align:center">Hapus</th>
              </tr>
            </thead>
            <tbody>
              ${assessments.length ? assessments.map(function (g, i) {
                return `<tr>
                  <td>${SSA.ui.formatDate(g.date)}</td>
                  <td><span class="badge ${g.type === 'UAS' ? 'badge-purple' : g.type === 'UTS' ? 'badge-blue' : 'badge-gray'}">${g.label}</span></td>
                  <td>${g.semester}</td>
                  <td style="text-align:center">
                    <input type="number" class="grade-edit-input" data-subj="${subj}" data-idx="${i}" value="${g.score}" min="0" max="100">
                  </td>
                  <td style="text-align:center">
                    <button class="action-btn delete" data-subj="${subj}" data-idx="${i}" title="Hapus penilaian ini">🗑️</button>
                  </td>
                </tr>`;
              }).join('') : '<tr><td colspan="5" class="text-center text-gray" style="padding:1.5rem">Belum ada penilaian untuk mapel ini.</td></tr>'}
            </tbody>
          </table>
        </div>

        <div class="mt-3">
          <h4 style="font-size:.95rem;font-weight:700;color:var(--gray-800);margin-bottom:.75rem">➕ Tambah Penilaian Baru</h4>
          <div class="inline-form">
            <div>
              <label class="label">Tanggal</label>
              <input type="date" class="input" id="newAsmDate" value="${new Date().toISOString().slice(0, 10)}">
            </div>
            <div>
              <label class="label">Label</label>
              <input type="text" class="input" id="newAsmLabel" placeholder="Harian 7" value="Harian 7">
            </div>
            <div>
              <label class="label">Jenis</label>
              <select class="select" id="newAsmType">
                <option value="Harian">Harian</option>
                <option value="UTS">UTS</option>
                <option value="UAS">UAS</option>
              </select>
            </div>
            <div>
              <label class="label">Semester</label>
              <select class="select" id="newAsmSemester">
                <option value="1">Semester 1</option>
                <option value="2" selected>Semester 2</option>
              </select>
            </div>
            <div>
              <label class="label">Nilai</label>
              <input type="number" class="input" id="newAsmScore" value="75" min="0" max="100" style="width:80px">
            </div>
            <div>
              <button class="btn btn-primary btn-sm" id="addAsmBtn">Tambah</button>
            </div>
          </div>
        </div>
      `;

      // subject selector
      const subjectSelect = gradeSection.querySelector('#subjectSelect');
      subjectSelect.addEventListener('change', function () {
        currentSubject = subjectSelect.value;
        renderGradeSection();
      });

      // score inputs — update on change
      gradeSection.querySelectorAll('.grade-edit-input').forEach(function (input) {
        input.addEventListener('change', function () {
          const subj2 = input.dataset.subj;
          const idx = parseInt(input.dataset.idx);
          const newScore = parseInt(input.value);
          if (isNaN(newScore)) { input.value = s.grades[subj2][idx].score; return; }
          updateGrade(s.id, subj2, idx, newScore);
          // update average badge + dropdown option
          const avgNow = subjectAverage(s, subj2);
          const badge = gradeSection.querySelector('.badge.badge-green, .badge.badge-amber, .badge.badge-red');
          // find the average badge (last toolbar badge)
          const avgBadge = gradeSection.querySelector('.toolbar .badge');
          if (avgBadge) {
            avgBadge.textContent = 'Rata-rata: ' + avgNow;
            avgBadge.className = 'badge ' + (avgNow >= 80 ? 'badge-green' : avgNow >= 70 ? 'badge-amber' : 'badge-red');
          }
          const opt = subjectSelect.querySelector('option[value="' + subj2 + '"]');
          if (opt) opt.textContent = subj2 + ' (rata-rata ' + avgNow + ')';
          // flash green border
          input.style.borderColor = 'var(--green)';
          setTimeout(function () { input.style.borderColor = ''; }, 800);
        });
      });

      // delete assessment buttons
      gradeSection.querySelectorAll('.action-btn.delete').forEach(function (btn) {
        btn.addEventListener('click', function () {
          const subj2 = btn.dataset.subj;
          const idx = parseInt(btn.dataset.idx);
          if (confirm('Hapus penilaian "' + s.grades[subj2][idx].label + '" (' + SSA.ui.formatDate(s.grades[subj2][idx].date) + ')?')) {
            removeAssessment(s.id, subj2, idx);
            renderGradeSection();
          }
        });
      });

      // add assessment button
      const addBtn = gradeSection.querySelector('#addAsmBtn');
      addBtn.addEventListener('click', function () {
        const date = gradeSection.querySelector('#newAsmDate').value;
        const label = gradeSection.querySelector('#newAsmLabel').value.trim();
        const type = gradeSection.querySelector('#newAsmType').value;
        const semester = parseInt(gradeSection.querySelector('#newAsmSemester').value);
        const score = parseInt(gradeSection.querySelector('#newAsmScore').value);

        if (!date) { alert('Tanggal harus diisi.'); return; }
        if (!label) { alert('Label harus diisi.'); return; }
        if (isNaN(score)) { alert('Nilai harus berupa angka.'); return; }

        addAssessment(s.id, currentSubject, date, type, label, semester, score);
        renderGradeSection();
      });
    }

    renderGradeSection();
  }
};
