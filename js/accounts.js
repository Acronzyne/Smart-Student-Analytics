/* ============================================================
   Kelola Akun Guru — admin panel
   ============================================================ */

SSA.routes.accounts = {
  render: function (container) {
    this.renderMain(container);
  },

  renderMain: function (container) {
    var all     = loadUsers();
    var teachers = all.filter(function (u) { return u.role !== 'admin'; });
    var pending  = teachers.filter(function (u) { return u.status === 'pending'; });
    var active   = teachers.filter(function (u) { return u.status === 'active'; });
    var suspended = teachers.filter(function (u) { return u.status === 'suspended'; });
    var allClasses = getAllClasses();

    container.innerHTML = `
      <div class="page-head">
        <h2>Kelola Akun Guru</h2>
        <p>Setujui pendaftaran guru baru, atur akses kelas, dan kelola seluruh akun guru.</p>
      </div>

      <!-- Stats -->
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-icon amber">⏳</div>
          <div class="stat-info">
            <div class="stat-value">${pending.length}</div>
            <div class="stat-label">Menunggu Persetujuan</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green">✅</div>
          <div class="stat-info">
            <div class="stat-value">${active.length}</div>
            <div class="stat-label">Akun Aktif</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon red">🚫</div>
          <div class="stat-info">
            <div class="stat-value">${suspended.length}</div>
            <div class="stat-label">Akun Disuspend</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon blue">👥</div>
          <div class="stat-info">
            <div class="stat-value">${teachers.length}</div>
            <div class="stat-label">Total Guru</div>
          </div>
        </div>
      </div>

      <!-- Pending approvals -->
      ${pending.length ? `
      <div class="card mb-3">
        <div class="card-header">
          <h3>⏳ Menunggu Persetujuan</h3>
          <span class="badge badge-amber">${pending.length} akun baru</span>
        </div>
        <div id="pendingList"></div>
      </div>` : ''}

      <!-- All teacher accounts -->
      <div class="card">
        <div class="card-header">
          <h3>👥 Semua Akun Guru</h3>
          <span class="badge badge-gray">${teachers.length} guru</span>
        </div>
        ${teachers.length ? `
        <div class="table-wrap">
          <table class="data-table" id="teacherTable">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Username</th>
                <th>Status</th>
                <th>Akses Kelas</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>` : `<div class="empty-state"><div class="icon">👤</div><p>Belum ada akun guru yang terdaftar.</p></div>`}
      </div>
    `;

    if (pending.length) {
      this.renderPendingList(container.querySelector('#pendingList'), pending, allClasses);
    }
    if (teachers.length) {
      this.renderTeacherTable(container.querySelector('#teacherTable tbody'), teachers, allClasses);
    }
  },

  /* ---- Pending approval cards ---- */
  renderPendingList: function (el, pending, allClasses) {
    el.innerHTML = pending.map(function (u) {
      return `
        <div class="account-card pending" id="pending-${u.username}">
          <div class="account-card-left">
            <div class="avatar" style="background:linear-gradient(135deg,#f59e0b,#d97706)">${u.name.charAt(0).toUpperCase()}</div>
            <div>
              <strong>${SSA.ui.escape(u.name)}</strong>
              <span class="text-sm text-gray">@${SSA.ui.escape(u.username)}</span>
            </div>
          </div>
          <div class="account-card-right">
            <div class="class-picker" style="margin-bottom:.5rem">
              <label class="label" style="margin-bottom:.3rem">Pilih Kelas yang Dapat Diakses:</label>
              <div class="class-chips" id="chips-${u.username}">
                ${allClasses.map(function (c) {
                  return `<button type="button" class="class-chip" data-class="${c}">${c}</button>`;
                }).join('')}
              </div>
            </div>
            <div class="flex gap-1" style="flex-wrap:wrap">
              <button class="btn btn-primary btn-sm" onclick="SSA.routes.accounts.approveUser('${u.username}')">✅ Setujui</button>
              <button class="btn btn-outline btn-sm" style="color:var(--red);border-color:var(--red)" onclick="SSA.routes.accounts.rejectUser('${u.username}')">✖ Tolak</button>
            </div>
          </div>
        </div>`;
    }).join('');

    // bind class chip toggles
    el.querySelectorAll('.class-chips').forEach(function (chips) {
      chips.querySelectorAll('.class-chip').forEach(function (chip) {
        chip.addEventListener('click', function () {
          chip.classList.toggle('active');
        });
      });
    });
  },

  /* ---- Teacher table rows ---- */
  renderTeacherTable: function (tbody, teachers, allClasses) {
    var self = this;
    tbody.innerHTML = teachers.map(function (u) {
      var statusBadge = u.status === 'active'
        ? '<span class="badge badge-green">Aktif</span>'
        : u.status === 'pending'
        ? '<span class="badge badge-amber">Menunggu</span>'
        : '<span class="badge badge-red">Disuspend</span>';

      var classesDisplay = (u.allowedClasses && u.allowedClasses.length)
        ? u.allowedClasses.map(function (c) { return '<span class="badge badge-blue" style="margin:.1rem">' + c + '</span>'; }).join(' ')
        : '<span class="text-gray text-sm">—</span>';

      return `<tr>
        <td>
          <div class="flex items-center gap-1">
            <div class="avatar" style="width:28px;height:28px;font-size:.72rem">${u.name.charAt(0).toUpperCase()}</div>
            ${SSA.ui.escape(u.name)}
          </div>
        </td>
        <td><code style="font-size:.82rem;color:var(--blue-600);background:var(--blue-50);padding:.1rem .35rem;border-radius:4px">@${SSA.ui.escape(u.username)}</code></td>
        <td>${statusBadge}</td>
        <td>${classesDisplay}</td>
        <td style="white-space:nowrap">
          <button class="action-btn edit" onclick="SSA.routes.accounts.openEditModal('${u.username}')" title="Edit akun">✏️</button>
          <button class="action-btn delete" onclick="SSA.routes.accounts.confirmDeleteUser('${u.username}')" title="Hapus akun">🗑️</button>
        </td>
      </tr>`;
    }).join('');
  },

  /* ---- Approve pending ---- */
  approveUser: function (username) {
    var card       = document.getElementById('pending-' + username);
    var activeChips = card ? card.querySelectorAll('.class-chip.active') : [];
    var classes    = Array.from(activeChips).map(function (c) { return c.dataset.class; });

    if (!classes.length) {
      if (!confirm('Setujui akun tanpa memberikan akses kelas? Guru tidak akan bisa melihat siswa manapun.')) return;
    }

    updateUserAccount(username, { status: 'active', allowedClasses: classes });
    SSA.auth.updateUI();
    this.renderMain(document.getElementById('content'));
  },

  /* ---- Reject/delete pending ---- */
  rejectUser: function (username) {
    if (confirm('Tolak dan hapus permintaan akun dari "' + username + '"?')) {
      deleteUserAccount(username);
      SSA.auth.updateUI();
      this.renderMain(document.getElementById('content'));
    }
  },

  /* ---- Edit modal ---- */
  openEditModal: function (username) {
    var all  = loadUsers();
    var user = all.find(function (u) { return u.username === username; });
    if (!user) return;
    var allClasses = getAllClasses();

    // remove any existing modal
    var existing = document.getElementById('accountModal');
    if (existing) existing.remove();

    var modal = document.createElement('div');
    modal.id        = 'accountModal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <h3>✏️ Edit Akun Guru</h3>
          <button class="modal-close" id="modalClose">✕</button>
        </div>

        <div class="modal-body">
          <div class="form-grid">
            <div>
              <label class="label">Nama Lengkap</label>
              <input type="text" class="input" id="modalName" value="${SSA.ui.escape(user.name)}">
            </div>
            <div>
              <label class="label">Username</label>
              <input type="text" class="input" value="@${SSA.ui.escape(user.username)}" disabled style="opacity:.6">
            </div>
            <div>
              <label class="label">Password Baru <span class="text-gray text-sm">(kosongkan jika tidak diubah)</span></label>
              <input type="password" class="input" id="modalPassword" placeholder="Password baru...">
            </div>
            <div>
              <label class="label">Status Akun</label>
              <select class="select" id="modalStatus">
                <option value="active"    ${user.status==='active'    ? 'selected':''}>Aktif</option>
                <option value="pending"   ${user.status==='pending'   ? 'selected':''}>Menunggu</option>
                <option value="suspended" ${user.status==='suspended' ? 'selected':''}>Suspend</option>
              </select>
            </div>
          </div>

          <div style="margin-top:1rem">
            <label class="label">Akses Kelas</label>
            <p class="text-sm text-gray" style="margin-bottom:.5rem">Klik kelas untuk mengaktifkan / menonaktifkan akses.</p>
            <div class="class-chips" id="modalChips">
              ${allClasses.map(function (c) {
                var active = user.allowedClasses && user.allowedClasses.indexOf(c) !== -1;
                return `<button type="button" class="class-chip ${active ? 'active' : ''}" data-class="${c}">${c}</button>`;
              }).join('')}
            </div>
          </div>

          <div id="modalError" class="login-error" style="display:none;margin-top:.75rem;text-align:left"></div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-outline" id="modalCancelBtn">Batal</button>
          <button class="btn btn-primary" id="modalSaveBtn">💾 Simpan</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // chip toggles
    modal.querySelectorAll('.class-chip').forEach(function (chip) {
      chip.addEventListener('click', function () { chip.classList.toggle('active'); });
    });

    // close handlers
    function closeModal() { modal.remove(); }
    modal.querySelector('#modalClose').addEventListener('click', closeModal);
    modal.querySelector('#modalCancelBtn').addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });

    // save
    modal.querySelector('#modalSaveBtn').addEventListener('click', function () {
      var errEl    = modal.querySelector('#modalError');
      errEl.style.display = 'none';

      var newName  = modal.querySelector('#modalName').value.trim();
      var newPwd   = modal.querySelector('#modalPassword').value;
      var newStatus = modal.querySelector('#modalStatus').value;
      var newClasses = Array.from(modal.querySelectorAll('.class-chip.active'))
                            .map(function (c) { return c.dataset.class; });

      if (!newName) { errEl.textContent = 'Nama tidak boleh kosong.'; errEl.style.display = ''; return; }
      if (newPwd && newPwd.length < 6) { errEl.textContent = 'Password minimal 6 karakter.'; errEl.style.display = ''; return; }

      var patch = { name: newName, status: newStatus, allowedClasses: newClasses };
      if (newPwd) patch.password = newPwd;

      updateUserAccount(username, patch);

      // If editing currently logged-in user's own profile, update session
      if (SSA.auth.currentUser && SSA.auth.currentUser.username === username) {
        SSA.auth.currentUser.name           = newName;
        SSA.auth.currentUser.allowedClasses = newClasses;
        sessionStorage.setItem('ssa_user', JSON.stringify(SSA.auth.currentUser));
        SSA.auth.updateUI();
      }

      closeModal();
      SSA.auth.updateUI();
      SSA.routes.accounts.renderMain(document.getElementById('content'));
    });
  },

  confirmDeleteUser: function (username) {
    var all  = loadUsers();
    var user = all.find(function (u) { return u.username === username; });
    if (!user) return;
    if (confirm('Hapus akun guru "' + user.name + '" (@' + username + ')?\n\nTindakan ini tidak dapat dibatalkan.')) {
      deleteUserAccount(username);
      SSA.auth.updateUI();
      this.renderMain(document.getElementById('content'));
    }
  }
};
