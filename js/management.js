/* ============================================================
   Manajemen Siswa module — CRUD untuk guru
   Tambah/hapus siswa, ubah NIS / kelas / nilai
   ============================================================ */

SSA.routes.management = {
  render: function (container, param) {
    if (param === 'add') {
      this.renderAddForm(container);
    } else if (param === 'import') {
      this.renderImportForm(container);
    } else if (param) {
      this.renderEditForm(container, param);
    } else {
      this.renderList(container);
    }
  },

  /* ---------------------------------------------------------- */
  /* Student list                                                */
  /* ---------------------------------------------------------- */
  renderList: function (container) {
    const isAdmin  = SSA.auth.isAdmin();
    const scopedStudents = getAccessibleStudents();
    container.innerHTML = `
      <div class="page-head">
        <h2>Manajemen Siswa</h2>
        <p>Tambah, ubah, dan hapus data siswa beserta nilai. Setiap perubahan disimpan otomatis.</p>
      </div>
      <div class="toolbar">
        <button class="btn btn-primary" onclick="SSA.router.navigate('management/add')">✚ Tambah Siswa</button>
        <button class="btn btn-outline" onclick="SSA.router.navigate('management/import')">⬇ Import CSV</button>
      </div>
      <div class="card">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>NIS</th>
                <th>Nama</th>
                <th>Kelas</th>
                <th>Rata-rata</th>
                <th>Predikat</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              ${scopedStudents.length ? scopedStudents.map(function (s, i) {
                const oa = overallAverage(s);
                const nis = s.nis || generateNis(s.id);
                return `<tr>
                  <td>${i + 1}</td>
                  <td><code style="font-size:.82rem;color:var(--blue-600);background:var(--blue-50);padding:.15rem .4rem;border-radius:4px">${SSA.ui.escape(nis)}</code></td>
                  <td><div class="flex items-center gap-1"><div class="avatar" style="width:28px;height:28px;font-size:.72rem">${SSA.ui.initials(s.name)}</div>${SSA.ui.escape(s.name)}</div></td>
                  <td><span class="badge badge-blue">${s.kelas}</span></td>
                  <td><strong>${oa}</strong></td>
                  <td><span class="badge ${oa >= 80 ? 'badge-green' : oa >= 70 ? 'badge-amber' : 'badge-red'}">${letterGrade(oa)}</span></td>
                  <td style="white-space:nowrap">
                    <button class="action-btn edit" onclick="SSA.router.navigate('management/${s.id}')" title="Edit siswa">✏️</button>
                    ${isAdmin ? `<button class="action-btn delete" onclick="SSA.routes.management.confirmDelete(${s.id})" title="Hapus siswa">🗑️</button>` : ''}
                  </td>
                </tr>`;
              }).join('') : '<tr><td colspan="7" class="empty-state">Belum ada siswa di kelas Anda.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  confirmDelete: function (id) {
    const s = getStudentById(id);
    if (!s) return;
    if (confirm('Hapus siswa "' + s.name + '" (NIS: ' + (s.nis || generateNis(s.id)) + ')?\n\nTindakan ini tidak dapat dibatalkan.')) {
      removeStudent(id);   // saveStudentsData() called inside removeStudent
      SSA.router.render();
    }
  },

  /* ---------------------------------------------------------- */
  /* Add new student                                             */
  /* ---------------------------------------------------------- */
  renderAddForm: function (container) {
    const classes = getAccessibleClasses();
    const isAdmin = SSA.auth.isAdmin();
    const nextId  = (STUDENTS.length
      ? STUDENTS.reduce(function (mx, s) { return Math.max(mx, s.id); }, 0) + 1
      : 1);
    const previewNis = generateNis(nextId);
    // Pre-fill class if teacher only has one class
    const defaultClass = (!isAdmin && classes.length === 1) ? classes[0] : '';

    container.innerHTML = `
      <button class="back-link" onclick="SSA.router.navigate('management')">← Kembali ke Manajemen</button>

      <div class="page-head">
        <h2>Tambah Siswa Baru</h2>
        <p>Daftarkan siswa baru. Nilai dapat ditambahkan sekarang atau kapan saja lewat Edit Siswa.</p>
      </div>

      <div class="card mb-3">
        <h3 class="card-title">📋 Data Siswa</h3>
        <div class="form-grid">
          <div>
            <label class="label">NIS (Nomor Induk Siswa) *</label>
            <input type="text" class="input" id="newStudentNis" value="${previewNis}" maxlength="20"
              placeholder="cth: 2025001">
            <span class="text-sm text-gray" style="margin-top:.25rem;display:block">Harus unik untuk setiap siswa.</span>
          </div>
          <div>
            <label class="label">Nama Lengkap *</label>
            <input type="text" class="input" id="newStudentName" placeholder="cth: Andi Wijaya">
          </div>
          <div>
            <label class="label">Kelas *</label>
            <input type="text" class="input" id="newStudentClass" list="classListOpts" placeholder="cth: 8A" value="${defaultClass}" ${!isAdmin && classes.length === 1 ? 'readonly' : ''}>
            <datalist id="classListOpts">
              ${classes.map(function (c) { return '<option value="' + c + '">'; }).join('')}
            </datalist>
          </div>
        </div>
      </div>

      <div class="card mb-3">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.75rem">
          <div>
            <h3 class="card-title" style="margin-bottom:.15rem">📊 Nilai Awal per Mata Pelajaran</h3>
            <p class="text-sm text-gray">Aktifkan jika siswa sudah memiliki nilai yang ingin langsung dimasukkan.</p>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="enableGrades">
            <span class="toggle-track"><span class="toggle-thumb"></span></span>
            <span class="toggle-label" id="toggleLabel">Tidak perlu (siswa baru)</span>
          </label>
        </div>

        <div id="gradeInputSection" style="display:none;margin-top:1.25rem;padding-top:1.25rem;border-top:1px solid var(--gray-100)">
          <p class="text-sm text-gray mb-2">Masukkan nilai awal (0–100). Sistem membuat 10 riwayat penilaian dari nilai ini.</p>
          <div class="form-grid grid-2">
            ${SUBJECTS.map(function (subj) {
              return `<div>
                <label class="label">${subj}</label>
                <input type="number" class="input grade-base-input" data-subject="${SSA.ui.escape(subj)}" value="75" min="0" max="100" style="width:90px">
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>

      <div id="addFormError" class="login-error" style="display:none;text-align:left;margin-bottom:1rem"></div>

      <div class="flex gap-2">
        <button class="btn btn-outline" onclick="SSA.router.navigate('management')">Batal</button>
        <button class="btn btn-primary" id="saveNewStudent">💾 Simpan Siswa</button>
      </div>
    `;

    const errEl = container.querySelector('#addFormError');

    // Toggle: show/hide grade section
    const toggleEl  = container.querySelector('#enableGrades');
    const sectionEl = container.querySelector('#gradeInputSection');
    const labelEl   = container.querySelector('#toggleLabel');
    toggleEl.addEventListener('change', function () {
      const on = toggleEl.checked;
      sectionEl.style.display = on ? '' : 'none';
      labelEl.textContent = on ? 'Ya, masukkan nilai sekarang' : 'Tidak perlu (siswa baru)';
    });

    function showErr(msg) {
      errEl.textContent = msg;
      errEl.style.display = '';
      errEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    container.querySelector('#saveNewStudent').addEventListener('click', function () {
      errEl.style.display = 'none';

      const nis   = container.querySelector('#newStudentNis').value.trim();
      const name  = container.querySelector('#newStudentName').value.trim();
      const kelas = container.querySelector('#newStudentClass').value.trim();

      if (!nis)   { showErr('NIS harus diisi.'); return; }
      if (!name)  { showErr('Nama harus diisi.'); return; }
      if (!kelas) { showErr('Kelas harus diisi.'); return; }

      // Class access check
      if (!SSA.auth.canAccessClass(kelas)) {
        showErr('Anda tidak memiliki akses untuk menambah siswa ke kelas ' + kelas + '.');
        return;
      }

      // Duplicate NIS check
      if (isNisDuplicate(nis, null)) {
        showErr('NIS "' + nis + '" sudah digunakan oleh siswa lain. Gunakan NIS yang berbeda.');
        container.querySelector('#newStudentNis').focus();
        return;
      }

      let newStudent;

      if (toggleEl.checked) {
        // Build grade history from inputs
        const baseGrades = {};
        container.querySelectorAll('.grade-base-input').forEach(function (input) {
          const subj = input.dataset.subject;
          const val  = parseInt(input.value);
          baseGrades[subj] = isNaN(val) ? 75 : clamp(val, 0, 100);
        });
        newStudent = addStudent(name, kelas, baseGrades);
      } else {
        // No grades — fresh enrolment
        newStudent = addStudentNoGrades(name, kelas);
      }

      newStudent.nis = nis;
      saveStudentsData();

      const gradeMsg = toggleEl.checked
        ? 'Data nilai awal telah dibuat.'
        : 'Belum ada nilai — dapat ditambahkan kapan saja melalui Edit Siswa.';
      alert('Siswa "' + name + '" (NIS: ' + nis + ') berhasil ditambahkan ke kelas ' + kelas + '.\n\n' + gradeMsg);
      SSA.router.navigate('management');
    });
  },

  /* ---------------------------------------------------------- */
  /* Import students from CSV                                    */
  /* ---------------------------------------------------------- */
  renderImportForm: function (container) {
    var classes = getAccessibleClasses();
    var isAdmin = SSA.auth.isAdmin();

    container.innerHTML = `
      <button class="back-link" onclick="SSA.router.navigate('management')">← Kembali ke Manajemen</button>

      <div class="page-head">
        <h2>Import Siswa dari CSV</h2>
        <p>Daftarkan banyak siswa sekaligus dengan mengunggah file CSV. Semua siswa dibuat tanpa nilai.</p>
      </div>

      <div class="card mb-3">
        <h3 class="card-title">📥 Unggah File CSV</h3>
        <p class="text-sm text-gray mb-2">Format kolom: <code>NIS ; Nama ; Kelas</code> (dipisah titik koma) — baris pertama adalah header.</p>

        <input type="file" id="csvFile" accept=".csv,text/csv" style="display:none">
        <div class="import-dropzone" id="dropZone">
          <div class="import-icon">📄</div>
          <p>Klik untuk pilih file CSV atau drag & drop di sini</p>
          <span class="text-sm text-gray">Format .csv (maks 1MB)</span>
        </div>

        <div class="mt-2">
          <button class="btn btn-outline btn-sm" id="downloadTemplate">⬇ Download Template CSV</button>
        </div>
      </div>

      <div id="previewArea"></div>
      <div id="resultArea"></div>
    `;

    var fileInput   = container.querySelector('#csvFile');
    var dropZone    = container.querySelector('#dropZone');
    var previewArea = container.querySelector('#previewArea');
    var resultArea  = container.querySelector('#resultArea');

    function handleFile(file) {
      if (!file) return;
      if (file.size > 1024 * 1024) { alert('Ukuran file terlalu besar (maks 1MB).'); return; }
      var reader = new FileReader();
      reader.onload = function (e) {
        resultArea.innerHTML = '';
        showPreview(parseCSV(e.target.result));
      };
      reader.readAsText(file);
    }

    dropZone.addEventListener('click', function () { fileInput.click(); });
    fileInput.addEventListener('change', function () { handleFile(this.files[0]); });

    dropZone.addEventListener('dragover', function (e) {
      e.preventDefault(); dropZone.classList.add('drag-over');
    });
    dropZone.addEventListener('dragleave', function () { dropZone.classList.remove('drag-over'); });
    dropZone.addEventListener('drop', function (e) {
      e.preventDefault(); dropZone.classList.remove('drag-over');
      handleFile(e.dataTransfer.files[0]);
    });

    container.querySelector('#downloadTemplate').addEventListener('click', function () {
      var csv = 'NIS;Nama;Kelas\n2025001;Andi Pratama;7A\n2025002;Siti Nurhaliza;7A\n2025003;Bayu Setiawan;7B\n2025004;Dewi Lestari;8A\n2025005;Eko Wijaya;8B\n2025006;Fitri Handayani;9A\n';
      var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = 'template_import_siswa.csv';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });

    function showPreview(rows) {
      if (!rows.length) {
        previewArea.innerHTML = '<div class="login-error">File CSV kosong atau format tidak valid.</div>';
        return;
      }

      // Validate each row
      var valid = [], skipped = [], invalid = [];
      var seenNis = {};

      rows.forEach(function (row, idx) {
        var lineNum = idx + 2;
        var nis   = (row.nis || '').trim();
        var name  = (row.nama || row.name || row.namalengkap || '').trim();
        var kelas = (row.kelas || '').trim();

        if (!nis && !name && !kelas) return;

        if (!nis)   { invalid.push({ line: lineNum, msg: 'NIS kosong' }); return; }
        if (!name)  { invalid.push({ line: lineNum, msg: 'Nama kosong' }); return; }
        if (!kelas) { invalid.push({ line: lineNum, msg: 'Kelas kosong' }); return; }

        if (!isAdmin && classes.indexOf(kelas) === -1) {
          invalid.push({ line: lineNum, msg: 'Tidak ada akses ke kelas ' + kelas }); return;
        }

        if (isNisDuplicate(nis, null)) {
          skipped.push({ line: lineNum, nis: nis, name: name, msg: 'NIS sudah ada di sistem' }); return;
        }

        if (seenNis[nis]) {
          skipped.push({ line: lineNum, nis: nis, name: name, msg: 'NIS duplikat dalam file' }); return;
        }
        seenNis[nis] = true;
        valid.push({ nis: nis, name: name, kelas: kelas, line: lineNum });
      });

      previewArea.innerHTML = `
        <div class="card mb-3">
          <div class="card-header">
            <h3>Pratinjau Data</h3>
            <div class="flex gap-1">
              <span class="badge badge-green">${valid.length} valid</span>
              ${skipped.length ? '<span class="badge badge-amber">' + skipped.length + ' duplikat</span>' : ''}
              ${invalid.length ? '<span class="badge badge-red">' + invalid.length + ' error</span>' : ''}
            </div>
          </div>

          ${valid.length ? `
          <p class="text-sm text-gray mb-2">Semua siswa akan dibuat <strong>tanpa nilai</strong>. Nilai dapat ditambahkan kapan saja lewat Edit Siswa.</p>
          <div class="table-wrap">
            <table class="data-table">
              <thead><tr><th>#</th><th>NIS</th><th>Nama</th><th>Kelas</th><th>Status</th></tr></thead>
              <tbody>
                ${valid.map(function (r, i) {
                  return '<tr><td>' + (i+1) + '</td>' +
                    '<td><code style="font-size:.82rem;color:var(--blue-600);background:var(--blue-50);padding:.15rem .4rem;border-radius:4px">' + SSA.ui.escape(r.nis) + '</code></td>' +
                    '<td>' + SSA.ui.escape(r.name) + '</td>' +
                    '<td><span class="badge badge-blue">' + SSA.ui.escape(r.kelas) + '</span></td>' +
                    '<td><span class="badge badge-green">\u2713 Siap import</span></td></tr>';
                }).join('')}
              </tbody>
            </table>
          </div>` : '<div class="empty-state"><p>Tidak ada data valid untuk diimport.</p></div>'}

          ${skipped.length ? `
          <div class="mt-3">
            <h4 style="font-size:.9rem;font-weight:700;color:var(--amber);margin-bottom:.5rem">\u26A0 Duplikat (akan dilewati)</h4>
            <div class="table-wrap">
              <table class="data-table">
                <thead><tr><th>Baris</th><th>NIS</th><th>Nama</th><th>Alasan</th></tr></thead>
                <tbody>
                  ${skipped.map(function (s) {
                    return '<tr><td>' + s.line + '</td><td>' + SSA.ui.escape(s.nis) + '</td><td>' + SSA.ui.escape(s.name) + '</td><td><span class="badge badge-amber">' + SSA.ui.escape(s.msg) + '</span></td></tr>';
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>` : ''}

          ${invalid.length ? `
          <div class="mt-3">
            <h4 style="font-size:.9rem;font-weight:700;color:var(--red);margin-bottom:.5rem">\u2716 Error (tidak akan diimport)</h4>
            <div class="table-wrap">
              <table class="data-table">
                <thead><tr><th>Baris</th><th>Alasan</th></tr></thead>
                <tbody>
                  ${invalid.map(function (e) {
                    return '<tr><td>' + e.line + '</td><td><span class="badge badge-red">' + SSA.ui.escape(e.msg) + '</span></td></tr>';
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>` : ''}
        </div>

        ${valid.length ? `
        <div class="flex gap-2 mb-3">
          <button class="btn btn-outline" onclick="SSA.router.navigate('management')">Batal</button>
          <button class="btn btn-primary" id="confirmImport">\uD83D\uDCE5 Import ${valid.length} Siswa</button>
        </div>` : `
        <button class="btn btn-outline" onclick="SSA.router.navigate('management')">\u2190 Kembali</button>`}
      `;

      var importBtn = container.querySelector('#confirmImport');
      if (importBtn) {
        importBtn.addEventListener('click', function () {
          importBtn.disabled = true;
          importBtn.textContent = 'Mengimport...';

          var results = importStudents(valid);

          previewArea.innerHTML = '';
          resultArea.innerHTML = `
            <div class="card">
              <h3 class="card-title">\u2705 Hasil Import</h3>
              <div class="stat-grid">
                <div class="stat-card">
                  <div class="stat-icon green">\u2705</div>
                  <div class="stat-info"><div class="stat-value">${results.added}</div><div class="stat-label">Berhasil Ditambahkan</div></div>
                </div>
                <div class="stat-card">
                  <div class="stat-icon amber">\u26A0\uFE0F</div>
                  <div class="stat-info"><div class="stat-value">${skipped.length}</div><div class="stat-label">Dilewati (Duplikat)</div></div>
                </div>
                <div class="stat-card">
                  <div class="stat-icon red">\u2716</div>
                  <div class="stat-info"><div class="stat-value">${invalid.length}</div><div class="stat-label">Error</div></div>
                </div>
              </div>

              ${skipped.length ? `
              <div class="mt-3">
                <h4 style="font-size:.85rem;font-weight:700;color:var(--amber);margin-bottom:.4rem">Siswa dilewati:</h4>
                <ul style="list-style:none;padding:0">
                  ${skipped.map(function (s) { return '<li style="font-size:.83rem;color:var(--gray-500);padding:.15rem 0">Baris ' + s.line + ' \u2014 ' + SSA.ui.escape(s.msg) + ' (' + SSA.ui.escape(s.nis) + ' / ' + SSA.ui.escape(s.name) + ')</li>'; }).join('')}
                </ul>
              </div>` : ''}

              ${invalid.length ? `
              <div class="mt-3">
                <h4 style="font-size:.85rem;font-weight:700;color:var(--red);margin-bottom:.4rem">Baris error:</h4>
                <ul style="list-style:none;padding:0">
                  ${invalid.map(function (e) { return '<li style="font-size:.83rem;color:var(--gray-500);padding:.15rem 0">Baris ' + e.line + ' \u2014 ' + SSA.ui.escape(e.msg) + '</li>'; }).join('')}
                </ul>
              </div>` : ''}

              <div class="mt-3">
                <button class="btn btn-primary" onclick="SSA.router.navigate('management')">Selesai \u2014 Lihat Daftar Siswa</button>
              </div>
            </div>
          `;
        });
      }
    }
  },

  /* ---------------------------------------------------------- */
  /* Edit student (info + NIS + grades)                          */
  /* ---------------------------------------------------------- */
  renderEditForm: function (container, id) {
    const s = getStudentById(id);
    if (!s) {
      container.innerHTML = '<div class="empty-state"><div class="icon">❓</div><p>Siswa tidak ditemukan.</p></div>';
      return;
    }
    if (!SSA.auth.canAccessClass(s.kelas)) {
      container.innerHTML = '<div class="empty-state"><div class="icon">&#128274;</div><h3>Akses Ditolak</h3><p>Anda tidak memiliki akses ke kelas ' + s.kelas + '.</p></div>';
      return;
    }

    const oa         = overallAverage(s);
    const classes    = getAccessibleClasses();
    const isAdmin    = SSA.auth.isAdmin();
    const currentNis = s.nis || generateNis(s.id);

    container.innerHTML = `
      <button class="back-link" onclick="SSA.router.navigate('management')">← Kembali ke Manajemen</button>

      <div class="page-head">
        <h2>Edit Siswa</h2>
        <p>Ubah NIS, nama, kelas, dan nilai siswa.</p>
      </div>

      <!-- Edit info card -->
      <div class="card mb-3">
        <div class="detail-header" id="editHeader">
          <div class="avatar xl">${SSA.ui.initials(s.name)}</div>
          <div class="info" style="flex:1">
            <h3 id="editHeaderName">${SSA.ui.escape(s.name)}</h3>
            <p id="editHeaderMeta">NIS ${SSA.ui.escape(currentNis)} · Kelas ${s.kelas} · Rata-rata ${oa} · ${letterGrade(oa)}</p>
          </div>
        </div>

        <h3 class="card-title">📋 Data Siswa</h3>
        <div class="form-grid">
          <div>
            <label class="label">NIS (Nomor Induk Siswa)</label>
            <input type="text" class="input" id="editStudentNis" value="${SSA.ui.escape(currentNis)}" maxlength="20">
            <span class="text-sm text-gray" style="margin-top:.25rem;display:block">NIS harus unik dan tidak boleh sama dengan siswa lain.</span>
          </div>
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

        <div id="editInfoError" class="login-error" style="display:none;text-align:left;margin-top:.75rem"></div>

        <div class="mt-2 flex items-center gap-1">
          <button class="btn btn-primary btn-sm" id="saveStudentInfo">💾 Simpan Data Siswa</button>
          <span class="saved-flash" id="infoSaved">✓ Tersimpan</span>
        </div>
      </div>

      <!-- Grade management card -->
      <div class="card">
        <h3 class="card-title">📊 Kelola Nilai</h3>
        <div id="gradeSection"></div>
      </div>
    `;

    /* --- Save student info --- */
    const errEl = container.querySelector('#editInfoError');

    container.querySelector('#saveStudentInfo').addEventListener('click', function () {
      errEl.style.display = 'none';

      const nis   = container.querySelector('#editStudentNis').value.trim();
      const name  = container.querySelector('#editStudentName').value.trim();
      const kelas = container.querySelector('#editStudentClass').value.trim();

      if (!nis)   { errEl.textContent = 'NIS tidak boleh kosong.'; errEl.style.display = ''; return; }
      if (!name)  { errEl.textContent = 'Nama tidak boleh kosong.'; errEl.style.display = ''; return; }
      if (!kelas) { errEl.textContent = 'Kelas tidak boleh kosong.'; errEl.style.display = ''; return; }

      // Class access check (prevent moving student to inaccessible class)
      if (!SSA.auth.canAccessClass(kelas)) {
        errEl.textContent = 'Anda tidak memiliki akses ke kelas ' + kelas + '.';
        errEl.style.display = '';
        return;
      }

      // Duplicate NIS check (exclude current student)
      if (isNisDuplicate(nis, s.id)) {
        errEl.textContent = 'NIS "' + nis + '" sudah digunakan oleh siswa lain.';
        errEl.style.display = '';
        container.querySelector('#editStudentNis').focus();
        return;
      }

      s.nis   = nis;
      updateStudentInfo(s.id, name, kelas);   // also calls saveStudentsData()

      // Update header
      const newOa = overallAverage(s);
      container.querySelector('#editHeaderName').textContent = name;
      container.querySelector('#editHeaderMeta').textContent =
        'NIS ' + nis + ' · Kelas ' + kelas + ' · Rata-rata ' + newOa + ' · ' + letterGrade(newOa);

      const flash = container.querySelector('#infoSaved');
      flash.classList.add('show');
      setTimeout(function () { flash.classList.remove('show'); }, 1800);
    });

    /* --- Grade management --- */
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
            <span class="badge ${subjectAverage(s, subj) >= 80 ? 'badge-green' : subjectAverage(s, subj) >= 70 ? 'badge-amber' : 'badge-red'}">
              Rata-rata: ${subjectAverage(s, subj)}
            </span>
          </div>
        </div>

        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Tanggal</th><th>Jenis</th><th>Semester</th>
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
                    <button class="action-btn delete" data-subj="${subj}" data-idx="${i}" title="Hapus penilaian">🗑️</button>
                  </td>
                </tr>`;
              }).join('') : '<tr><td colspan="5" class="text-center text-gray" style="padding:1.5rem">Belum ada penilaian.</td></tr>'}
            </tbody>
          </table>
        </div>

        <div class="mt-3">
          <h4 style="font-size:.95rem;font-weight:700;color:var(--gray-800);margin-bottom:.75rem">➕ Tambah Penilaian Baru</h4>
          <div class="inline-form">
            <div>
              <label class="label">Tanggal</label>
              <input type="date" class="input" id="newAsmDate" value="${new Date().toISOString().slice(0,10)}">
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

      // Subject selector
      const subjectSelect = gradeSection.querySelector('#subjectSelect');
      subjectSelect.addEventListener('change', function () {
        currentSubject = subjectSelect.value;
        renderGradeSection();
      });

      // Score inputs — save on change
      gradeSection.querySelectorAll('.grade-edit-input').forEach(function (input) {
        input.addEventListener('change', function () {
          const subj2    = input.dataset.subj;
          const idx      = parseInt(input.dataset.idx);
          const newScore = parseInt(input.value);
          if (isNaN(newScore)) { input.value = s.grades[subj2][idx].score; return; }
          updateGrade(s.id, subj2, idx, newScore);   // saves inside
          const avgNow   = subjectAverage(s, subj2);
          const avgBadge = gradeSection.querySelector('.toolbar .badge');
          if (avgBadge) {
            avgBadge.textContent = 'Rata-rata: ' + avgNow;
            avgBadge.className   = 'badge ' + (avgNow >= 80 ? 'badge-green' : avgNow >= 70 ? 'badge-amber' : 'badge-red');
          }
          const opt = subjectSelect.querySelector('option[value="' + subj2 + '"]');
          if (opt) opt.textContent = subj2 + ' (rata-rata ' + avgNow + ')';
          input.style.borderColor = 'var(--green)';
          setTimeout(function () { input.style.borderColor = ''; }, 800);
        });
      });

      // Delete assessment
      gradeSection.querySelectorAll('.action-btn.delete').forEach(function (btn) {
        btn.addEventListener('click', function () {
          const subj2 = btn.dataset.subj;
          const idx   = parseInt(btn.dataset.idx);
          if (confirm('Hapus penilaian "' + s.grades[subj2][idx].label + '"?')) {
            removeAssessment(s.id, subj2, idx);   // saves inside
            renderGradeSection();
          }
        });
      });

      // Add assessment
      gradeSection.querySelector('#addAsmBtn').addEventListener('click', function () {
        const date     = gradeSection.querySelector('#newAsmDate').value;
        const label    = gradeSection.querySelector('#newAsmLabel').value.trim();
        const type     = gradeSection.querySelector('#newAsmType').value;
        const semester = parseInt(gradeSection.querySelector('#newAsmSemester').value);
        const score    = parseInt(gradeSection.querySelector('#newAsmScore').value);

        if (!date)          { alert('Tanggal harus diisi.'); return; }
        if (!label)         { alert('Label harus diisi.'); return; }
        if (isNaN(score))   { alert('Nilai harus berupa angka.'); return; }

        addAssessment(s.id, currentSubject, date, type, label, semester, score);  // saves inside
        renderGradeSection();
      });
    }

    renderGradeSection();
  }
};
