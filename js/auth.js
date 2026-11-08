/* ============================================================
   Auth & Theme — login, register, roles, class-access, dark mode
   ============================================================ */

/* ---------- User store (localStorage) ---------- */

var SSA_USERS_KEY = 'ssa_users_v1';

// Built-in admin — always present, never editable
var BUILTIN_USERS = [
  { username: 'admin', password: 'admin123', name: 'Administrator',
    role: 'admin', status: 'active', allowedClasses: [] }
];

function loadUsers() {
  var stored = [];
  try { stored = JSON.parse(localStorage.getItem(SSA_USERS_KEY) || '[]'); }
  catch (e) { stored = []; }
  return BUILTIN_USERS.concat(stored);
}

function saveUsers(userList) {
  var teachers = userList.filter(function (u) { return u.role !== 'admin'; });
  try { localStorage.setItem(SSA_USERS_KEY, JSON.stringify(teachers)); }
  catch (e) {}
}

function getStoredUsers() {
  try { return JSON.parse(localStorage.getItem(SSA_USERS_KEY) || '[]'); }
  catch (e) { return []; }
}

function registerUser(username, password, name) {
  var all = loadUsers();
  if (all.find(function (u) { return u.username === username; })) {
    return { ok: false, msg: 'Username "' + username + '" sudah digunakan.' };
  }
  var newUser = {
    username: username, password: password, name: name,
    role: 'guru', status: 'pending', allowedClasses: []
  };
  var stored = getStoredUsers();
  stored.push(newUser);
  saveUsers(stored);
  return { ok: true };
}

function updateUserAccount(username, patch) {
  var stored = getStoredUsers();
  var idx = stored.findIndex(function (u) { return u.username === username; });
  if (idx === -1) return false;
  Object.assign(stored[idx], patch);
  saveUsers(stored);
  return true;
}

function deleteUserAccount(username) {
  var stored = getStoredUsers();
  var next = stored.filter(function (u) { return u.username !== username; });
  if (next.length === stored.length) return false;
  saveUsers(next);
  return true;
}

function countPending() {
  return getStoredUsers().filter(function (u) { return u.status === 'pending'; }).length;
}

/* ============================================================
   Authentication
   ============================================================ */

SSA.auth = {
  currentUser: null,

  init: function () {
    var stored = sessionStorage.getItem('ssa_user');
    if (stored) {
      try { this.currentUser = JSON.parse(stored); }
      catch (e) { this.currentUser = null; }
    }
  },

  login: function (username, password) {
    var all = loadUsers();
    var user = all.find(function (u) {
      return u.username === username && u.password === password;
    });
    if (!user)                    return { ok: false, msg: 'Username atau password salah.' };
    if (user.status === 'pending')   return { ok: false, msg: 'Akun belum disetujui Admin. Mohon tunggu konfirmasi.' };
    if (user.status === 'suspended') return { ok: false, msg: 'Akun Anda disuspend. Hubungi Administrator.' };
    this.currentUser = {
      username: user.username, name: user.name, role: user.role,
      allowedClasses: user.allowedClasses || []
    };
    sessionStorage.setItem('ssa_user', JSON.stringify(this.currentUser));
    return { ok: true };
  },

  logout: function () {
    this.currentUser = null;
    sessionStorage.removeItem('ssa_user');
  },

  isLoggedIn:     function () { return this.currentUser !== null; },
  isAdmin:        function () { return this.currentUser && this.currentUser.role === 'admin'; },

  canAccessClass: function (kelas) {
    if (this.isAdmin()) return true;
    if (!this.currentUser) return false;
    var ac = this.currentUser.allowedClasses || [];
    return ac.indexOf(kelas) !== -1;
  },

  canAccess: function (route) {
    if (!this.currentUser) return false;
    // accounts and settings are admin-only
    if (['accounts', 'settings'].indexOf(route) !== -1 && !this.isAdmin()) return false;
    if (this.isAdmin()) return true;
    // teachers with no assigned classes can only reach dashboard
    var ac = this.currentUser.allowedClasses || [];
    if (ac.length === 0) {
      return route === 'dashboard';
    }
    return true;
  },

  /* ---- screen transitions ---- */

  showLogin: function () {
    document.getElementById('loginScreen').style.display     = '';
    document.getElementById('registerScreen').style.display  = 'none';
    document.getElementById('appView').style.display         = 'none';
    var el = document.getElementById('loginPassword');
    if (el) el.value = '';
    var er = document.getElementById('loginError');
    if (er) er.style.display = 'none';
    document.getElementById('userDropdown').classList.remove('show');
  },

  showRegister: function () {
    document.getElementById('loginScreen').style.display     = 'none';
    document.getElementById('registerScreen').style.display  = '';
    document.getElementById('appView').style.display         = 'none';
    ['regUsername','regPassword','regConfirm','regName'].forEach(function (id) {
      var el = document.getElementById(id); if (el) el.value = '';
    });
    var er = document.getElementById('registerError');   if (er) er.style.display = 'none';
    var su = document.getElementById('registerSuccess'); if (su) su.style.display = 'none';
  },

  showApp: function () {
    document.getElementById('loginScreen').style.display     = 'none';
    document.getElementById('registerScreen').style.display  = 'none';
    document.getElementById('appView').style.display         = '';
    this.updateUI();
    location.hash = 'dashboard';
    SSA.router.render();
  },

  updateUI: function () {
    var user    = this.currentUser;
    if (!user) return;
    var isAdmin = this.isAdmin();

    var mgmtNav     = document.querySelector('.nav-item[data-route="management"]');
    var accountsNav = document.querySelector('.nav-item[data-route="accounts"]');
    var settingsNav  = document.querySelector('.nav-item[data-route="settings"]');
    if (mgmtNav)     mgmtNav.style.display     = '';
    if (accountsNav) accountsNav.style.display = isAdmin ? '' : 'none';
    if (settingsNav)  settingsNav.style.display = isAdmin ? '' : 'none';

    // Pending count badge on Kelola Akun nav
    if (isAdmin && accountsNav) {
      var pending = countPending();
      var badge   = accountsNav.querySelector('.pending-badge');
      if (pending > 0) {
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'pending-badge';
          accountsNav.appendChild(badge);
        }
        badge.textContent = pending;
      } else if (badge) { badge.remove(); }
    }

    // Sidebar footer
    var sbAvatar = document.getElementById('sbAvatar');
    var sbName   = document.getElementById('sbName');
    var sbRole   = document.getElementById('sbRole');
    if (sbAvatar) sbAvatar.textContent = user.name.charAt(0).toUpperCase();
    if (sbName)   sbName.textContent   = user.name;
    if (sbRole) {
      if (isAdmin) { sbRole.textContent = 'Administrator'; }
      else {
        var ac = user.allowedClasses || [];
        sbRole.textContent = ac.length ? 'Guru \u00b7 Kelas ' + ac.join(', ') : 'Guru (belum ada kelas)';
      }
    }

    // Topbar
    var userName    = document.getElementById('userName');
    var userAvatar  = document.getElementById('userAvatar');
    var userNamePop = document.getElementById('userNamePop');
    var userRolePop = document.getElementById('userRolePop');
    if (userName)    userName.textContent    = user.name;
    if (userAvatar)  userAvatar.textContent  = user.name.charAt(0).toUpperCase();
    if (userNamePop) userNamePop.textContent = user.name;
    if (userRolePop) {
      userRolePop.textContent = isAdmin ? 'Administrator' : 'Guru';
      userRolePop.className   = 'badge ' + (isAdmin ? 'badge-purple' : 'badge-blue');
    }
  },

  /* ---- event handlers ---- */

  handleLogin: function () {
    var username = document.getElementById('loginUsername').value.trim();
    var password = document.getElementById('loginPassword').value;
    var err      = document.getElementById('loginError');
    var result   = SSA.auth.login(username, password);
    if (result.ok) { SSA.auth.showApp(); }
    else { err.style.display = ''; err.textContent = result.msg; }
  },

  handleRegister: function () {
    var username = document.getElementById('regUsername').value.trim();
    var password = document.getElementById('regPassword').value;
    var confirm  = document.getElementById('regConfirm').value;
    var name     = document.getElementById('regName').value.trim();
    var errEl    = document.getElementById('registerError');
    var sucEl    = document.getElementById('registerSuccess');
    errEl.style.display = 'none';
    sucEl.style.display = 'none';

    if (!username || !password || !confirm || !name) {
      errEl.textContent = 'Semua kolom harus diisi.'; errEl.style.display = ''; return;
    }
    if (username.length < 4) {
      errEl.textContent = 'Username minimal 4 karakter.'; errEl.style.display = ''; return;
    }
    if (password.length < 6) {
      errEl.textContent = 'Password minimal 6 karakter.'; errEl.style.display = ''; return;
    }
    if (password !== confirm) {
      errEl.textContent = 'Password dan konfirmasi tidak cocok.'; errEl.style.display = ''; return;
    }

    var result = registerUser(username, password, name);
    if (!result.ok) { errEl.textContent = result.msg; errEl.style.display = ''; return; }

    sucEl.textContent   = 'Pendaftaran berhasil! Akun Anda menunggu persetujuan Admin sebelum dapat masuk.';
    sucEl.style.display = '';
    ['regUsername','regPassword','regConfirm','regName'].forEach(function (id) {
      var el = document.getElementById(id); if (el) el.value = '';
    });
  },

  handleLogout: function () {
    SSA.auth.logout();
    SSA.auth.showLogin();
  }
};

/* ============================================================
   Theme
   ============================================================ */

SSA.theme = {
  current: 'light',

  init: function () {
    var saved = localStorage.getItem('ssa_theme') || 'light';
    this.setTheme(saved, false);
  },

  setTheme: function (theme, save) {
    this.current = theme;
    document.documentElement.setAttribute('data-theme', theme);
    if (save !== false) localStorage.setItem('ssa_theme', theme);
    var icons = document.querySelectorAll('.theme-icon');
    for (var i = 0; i < icons.length; i++) {
      icons[i].textContent = theme === 'dark' ? '\u2600' : '\u263E';
    }
  },

  toggle: function () {
    var t = SSA.theme.current === 'light' ? 'dark' : 'light';
    SSA.theme.setTheme(t);
    if (SSA.auth && SSA.auth.isLoggedIn()) SSA.router.render();
  }
};

SSA.chartGridColor = function () {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? '#1e293b' : '#f1f5f9';
};
SSA.chartTextColor = function () { return '#94a3b8'; };
