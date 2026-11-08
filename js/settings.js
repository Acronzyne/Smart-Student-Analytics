/* ============================================================
   Pengaturan Sistem — admin-only settings page
   Configure school year, subjects, and assessment schedule.
   Saving resets all student data (grades won't match new config).
   ============================================================ */

SSA.routes.settings = {
  render: function (container) {
    // Work on a local copy so user can cancel without changes taking effect
    var draft = JSON.parse(JSON.stringify(SSA_SETTINGS));

    container.innerHTML = `
      <div class="page-head">
        <h2>Pengaturan Sistem</h2>
        <p>Atur tahun ajaran, daftar mata pelajaran, dan jadwal penilaian. Perubahan akan mereset data siswa.</p>
      </div>

      <div class="alert-box danger" style="margin-bottom:1.25rem">
        <div class="icon">\u26A0\uFE0F</div>
        <div class="body"><strong>Peringatan:</strong> Menyimpan perubahan akan menghapus semua data siswa yang ada (nilai, kuesioner, dll.) karena struktur mata pelajaran/penilaian berubah. Pastikan semua data sudah dicadangkan.</div>
      </div>

      <!-- School year + NIS prefix -->
      <div class="card mb-3">
        <h3 class="card-title">\uD83D\uDCC5 Tahun Ajaran & NIS</h3>
        <div class="form-grid">
          <div>
            <label class="label">Tahun Ajaran</label>
            <input type="text" class="input" id="setSchoolYear" value="${SSA.ui.escape(draft.schoolYear)}" placeholder="cth: 2025/2026">
          </div>
          <div>
            <label class="label">Prefix NIS</label>
            <input type="text" class="input" id="setNisPrefix" value="${SSA.ui.escape(draft.nisYearPrefix)}" placeholder="cth: 2025" maxlength="4">
            <span class="text-sm text-gray" style="margin-top:.25rem;display:block">NIS otomatis: prefix + 3 digit ID siswa (cth: 2025001)</span>
          </div>
        </div>
      </div>

      <!-- Subjects editor -->
      <div class="card mb-3">
        <h3 class="card-title">\uD83D\uDCDA Mata Pelajaran</h3>
        <p class="text-sm text-gray mb-2">Tambah, ubah nama, atau hapus mata pelajaran. Setiap mapel punya warna untuk grafik.</p>
        <div id="subjectList"></div>
        <button class="btn btn-outline btn-sm mt-2" id="addSubjectBtn">\u2795 Tambah Mata Pelajaran</button>
      </div>

      <!-- Assessment schedule editor -->
      <div class="card mb-3">
        <h3 class="card-title">\uD83D\uDCC4 Jadwal Penilaian</h3>
        <p class="text-sm text-gray mb-2">Atur jadwal penilaian untuk semester 1 dan 2. Label akan tampil di grafik dan riwayat nilai.</p>
        <div id="scheduleList"></div>
        <button class="btn btn-outline btn-sm mt-2" id="addAssessmentBtn">\u2795 Tambah Penilaian</button>
      </div>

      <div id="settingsError" class="login-error" style="display:none;text-align:left;margin-bottom:1rem"></div>

      <div class="flex gap-2" style="flex-wrap:wrap">
        <button class="btn btn-outline" id="resetDefaultsBtn">\u21BA Reset ke Default</button>
        <button class="btn btn-primary" id="saveSettingsBtn">\uD83D\uDCBE Simpan Pengaturan</button>
      </div>
    `;

    var subjectListEl  = container.querySelector('#subjectList');
    var scheduleListEl = container.querySelector('#scheduleList');
    var errEl          = container.querySelector('#settingsError');

    function showErr(msg) {
      errEl.textContent = msg; errEl.style.display = '';
      errEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    /* ---- Subjects ---- */
    var PALETTE = ['#3b82f6','#ef4444','#8b5cf6','#10b981','#f59e0b','#ec4899','#6366f1','#14b8a6','#f97316','#6366f1','#84cc16','#06b6d4','#a855f7','#e11d48'];

    function renderSubjects() {
      subjectListEl.innerHTML = draft.subjects.map(function (subj, i) {
        var color = draft.subjectColors[subj] || PALETTE[i % PALETTE.length];
        return `
          <div class="setting-row" data-idx="${i}">
            <input type="text" class="input subject-name" value="${SSA.ui.escape(subj)}" placeholder="Nama mapel" style="flex:1">
            <input type="color" class="subject-color" value="${color}" title="Warna grafik" style="width:42px;height:38px;border:1px solid var(--gray-300);border-radius:8px;cursor:pointer;background:var(--white)">
            <button class="action-btn delete remove-subject" data-idx="${i}" title="Hapus mapel">\u{1F5D1}\uFE0F</button>
          </div>`;
      }).join('');

      subjectListEl.querySelectorAll('.subject-name').forEach(function (input) {
        input.addEventListener('input', function () {
          var idx = parseInt(input.parentElement.dataset.idx);
          draft.subjects[idx] = input.value;
        });
      });

      subjectListEl.querySelectorAll('.subject-color').forEach(function (input) {
        input.addEventListener('input', function () {
          var idx = parseInt(input.parentElement.dataset.idx);
          draft.subjectColors[draft.subjects[idx]] = input.value;
        });
      });

      subjectListEl.querySelectorAll('.remove-subject').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var idx = parseInt(btn.dataset.idx);
          var name = draft.subjects[idx];
          if (draft.subjects.length <= 1) { alert('Minimal harus ada 1 mata pelajaran.'); return; }
          if (confirm('Hapus mata pelajaran "' + name + '"?')) {
            delete draft.subjectColors[name];
            draft.subjects.splice(idx, 1);
            renderSubjects();
          }
        });
      });
    }

    container.querySelector('#addSubjectBtn').addEventListener('click', function () {
      var name = 'Mapel Baru ' + (draft.subjects.length + 1);
      var color = PALETTE[draft.subjects.length % PALETTE.length];
      draft.subjects.push(name);
      draft.subjectColors[name] = color;
      renderSubjects();
      // Focus the new input
      var inputs = subjectListEl.querySelectorAll('.subject-name');
      if (inputs.length) inputs[inputs.length - 1].focus();
    });

    /* ---- Assessment schedule ---- */
    function renderSchedule() {
      scheduleListEl.innerHTML = draft.assessmentSchedule.map(function (a, i) {
        return `
          <div class="setting-row" data-idx="${i}" style="flex-wrap:wrap">
            <input type="date" class="input asm-date" value="${a.date}" style="width:150px">
            <input type="text" class="input asm-label" value="${SSA.ui.escape(a.label)}" placeholder="Label" style="flex:1;min-width:120px">
            <select class="select asm-type" style="width:auto">
              <option value="Harian" ${a.type==='Harian'?'selected':''}>Harian</option>
              <option value="UTS" ${a.type==='UTS'?'selected':''}>UTS</option>
              <option value="UAS" ${a.type==='UAS'?'selected':''}>UAS</option>
            </select>
            <select class="select asm-semester" style="width:auto">
              <option value="1" ${a.semester===1?'selected':''}>Sem 1</option>
              <option value="2" ${a.semester===2?'selected':''}>Sem 2</option>
            </select>
            <button class="action-btn delete remove-asm" data-idx="${i}" title="Hapus">\u{1F5D1}\uFE0F</button>
          </div>`;
      }).join('');

      scheduleListEl.querySelectorAll('.setting-row').forEach(function (row, i) {
        row.querySelector('.asm-date').addEventListener('input', function () {
          draft.assessmentSchedule[i].date = this.value;
        });
        row.querySelector('.asm-label').addEventListener('input', function () {
          draft.assessmentSchedule[i].label = this.value;
        });
        row.querySelector('.asm-type').addEventListener('change', function () {
          draft.assessmentSchedule[i].type = this.value;
        });
        row.querySelector('.asm-semester').addEventListener('change', function () {
          draft.assessmentSchedule[i].semester = parseInt(this.value);
        });
      });

      scheduleListEl.querySelectorAll('.remove-asm').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var idx = parseInt(btn.dataset.idx);
          if (draft.assessmentSchedule.length <= 1) { alert('Minimal harus ada 1 penilaian.'); return; }
          draft.assessmentSchedule.splice(idx, 1);
          renderSchedule();
        });
      });
    }

    container.querySelector('#addAssessmentBtn').addEventListener('click', function () {
      draft.assessmentSchedule.push({
        date: new Date().toISOString().slice(0, 10),
        label: 'Penilaian ' + (draft.assessmentSchedule.length + 1),
        type: 'Harian',
        semester: 1
      });
      renderSchedule();
    });

    /* ---- Reset to defaults ---- */
    container.querySelector('#resetDefaultsBtn').addEventListener('click', function () {
      if (confirm('Reset semua pengaturan ke nilai default? Data siswa akan dihapus.')) {
        draft = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
        container.querySelector('#setSchoolYear').value = draft.schoolYear;
        container.querySelector('#setNisPrefix').value = draft.nisYearPrefix;
        renderSubjects();
        renderSchedule();
      }
    });

    /* ---- Save ---- */
    container.querySelector('#saveSettingsBtn').addEventListener('click', function () {
      errEl.style.display = 'none';

      // Read school year + NIS prefix
      draft.schoolYear    = container.querySelector('#setSchoolYear').value.trim() || '2024/2025';
      draft.nisYearPrefix = container.querySelector('#setNisPrefix').value.trim() || '2025';

      // Validate subjects — no empty names, no duplicates
      var seen = {};
      for (var i = draft.subjects.length - 1; i >= 0; i--) {
        var name = (draft.subjects[i] || '').trim();
        if (!name) { draft.subjects.splice(i, 1); continue; }
        if (seen[name]) { showErr('Mata pelajaran "' + name + '" duplikat. Gunakan nama yang berbeda.'); return; }
        seen[name] = true;
        draft.subjects[i] = name;
      }
      if (draft.subjects.length === 0) { showErr('Minimal harus ada 1 mata pelajaran.'); return; }

      // Ensure every subject has a color
      draft.subjects.forEach(function (s, idx) {
        if (!draft.subjectColors[s]) draft.subjectColors[s] = PALETTE[idx % PALETTE.length];
      });
      // Clean up colors for removed subjects
      Object.keys(draft.subjectColors).forEach(function (key) {
        if (draft.subjects.indexOf(key) === -1) delete draft.subjectColors[key];
      });

      // Validate assessments
      for (var j = 0; j < draft.assessmentSchedule.length; j++) {
        if (!draft.assessmentSchedule[j].label || !draft.assessmentSchedule[j].label.trim()) {
          showErr('Penilaian baris ' + (j + 1) + ': label tidak boleh kosong.'); return;
        }
      }
      if (draft.assessmentSchedule.length === 0) { showErr('Minimal harus ada 1 penilaian.'); return; }

      // Confirm data reset
      if (!confirm('PERINGATAN: Semua data siswa (nilai, kuesioner, data custom) akan dihapus karena struktur berubah.\n\nLanjutkan menyimpan pengaturan?')) return;

      // Save settings
      saveSettings(draft);

      // Clear all student data — grades won't match new subjects/schedule
      localStorage.removeItem(SSA_STUDENTS_KEY);
      localStorage.removeItem(SSA_STORAGE_KEY);

      alert('Pengaturan berhasil disimpan!\n\nTahun Ajaran: ' + draft.schoolYear + '\nMata Pelajaran: ' + draft.subjects.length + '\nPenilaian: ' + draft.assessmentSchedule.length + '\n\nHalaman akan dimuat ulang dengan pengaturan baru.');

      // Reload to rebuild everything with new settings
      location.reload();
    });

    // Initial render
    renderSubjects();
    renderSchedule();
  }
};
