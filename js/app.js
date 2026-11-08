/* ============================================================
   Smart Student Analytics — App core (router, nav, shared UI)
   ============================================================ */

window.SSA = { routes: {} };

/* ---------- Shared UI helpers ---------- */

SSA.ui = {
  // destroy all Chart instances to avoid canvas reuse errors
  destroyCharts: function () {
    if (window.Chart && Chart.instances) {
      Object.keys(Chart.instances).forEach(function (k) {
        try { Chart.instances[k].destroy(); } catch (e) {}
      });
    }
  },

  // store active charts for manual cleanup
  _charts: [],

  newChart: function (ctx, config) {
    const c = new Chart(ctx, config);
    SSA.ui._charts.push(c);
    return c;
  },

  clearCharts: function () {
    SSA.ui._charts.forEach(function (c) {
      try { c.destroy(); } catch (e) {}
    });
    SSA.ui._charts = [];
  },

  escape: function (str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  initials: function (name) {
    return name.split(/\s+/).slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase();
  },

  formatDate: function (d) {
    const date = new Date(d);
    const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
    return date.getDate() + " " + months[date.getMonth()] + " " + date.getFullYear();
  },

  // Reusable empty-state message when no students are accessible
  noStudentsMsg: function () {
    var isAdmin = SSA.auth && SSA.auth.isAdmin();
    var msg = isAdmin
      ? 'Belum ada siswa. Tambahkan siswa melalui menu Manajemen Siswa.'
      : 'Belum ada siswa di kelas Anda. Hubungi Admin untuk menambahkan siswa.';
    return '<div class="empty-state"><div class="icon">\uD83D\uDDED</div><p>' + msg + '</p></div>';
  }
};

/* ---------- Router ---------- */

SSA.router = {
  current: null,

  parse: function () {
    const hash = (location.hash || '#dashboard').slice(1);
    const parts = hash.split('/');
    return { name: parts[0] || 'dashboard', param: parts[1] || null, rest: parts };
  },

  navigate: function (path) {
    location.hash = path;
  },

  render: function () {
    // Auth gate — redirect to login if not authenticated
    if (typeof SSA.auth !== 'undefined' && !SSA.auth.isLoggedIn()) {
      SSA.auth.showLogin();
      return;
    }
    const route = SSA.router.parse();
    const name = route.name;
    const handler = SSA.routes[name];

    // page titles
    const titles = {
      dashboard: 'Dashboard',
      students: 'Data Siswa',
      analytics: 'Learning Analytics',
      interests: 'Minat & Bakat',
      learning: 'Personalized Learning',
      management: 'Manajemen Siswa',
      accounts: 'Kelola Akun Guru',
      settings: 'Pengaturan Sistem'
    };
    document.getElementById('pageTitle').textContent = titles[name] || 'Smart Student Analytics';

    // active nav
    document.querySelectorAll('.nav-item').forEach(function (el) {
      el.classList.toggle('active', el.dataset.route === name);
    });

    // Access control — restrict management/accounts to admin; block no-class teachers from data pages
    if (!SSA.auth.canAccess(name)) {
      document.getElementById('pageTitle').textContent = 'Akses Ditolak';
      SSA.ui.clearCharts();
      const content = document.getElementById('content');
      var ac = (SSA.auth.currentUser && SSA.auth.currentUser.allowedClasses) || [];
      var msg = (name === 'management' || name === 'accounts')
        ? 'Halaman ini hanya untuk Administrator.'
        : 'Anda belum memiliki akses kelas. Hubungi Admin untuk mendapatkan akses.';
      content.innerHTML = '<div class="empty-state"><div class="icon">&#128274;</div><h3>Akses Ditolak</h3><p>' + msg + '</p></div>';
      return;
    }

    // close mobile sidebar
    SSA.nav.close();

    // clear charts + content
    SSA.ui.clearCharts();
    const content = document.getElementById('content');
    content.innerHTML = '';

    if (handler && typeof handler.render === 'function') {
      handler.render(content, route.param, route.rest);
    } else {
      content.innerHTML = '<div class="empty-state"><div class="icon">🔍</div><p>Halaman tidak ditemukan.</p></div>';
    }
    SSA.router.current = name;
    // scroll to top on navigation
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
};

/* ---------- Navigation (sidebar) ---------- */

SSA.nav = {
  open: function () {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('overlay').classList.add('active');
  },
  close: function () {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('overlay').classList.remove('active');
  },
  toggle: function () {
    const sb = document.getElementById('sidebar');
    if (sb.classList.contains('open')) SSA.nav.close();
    else SSA.nav.open();
  }
};

/* ---------- Boot ---------- */

window.addEventListener('hashchange', SSA.router.render);

window.addEventListener('DOMContentLoaded', function () {
  // Initialize theme + auth
  SSA.theme.init();
  SSA.auth.init();
  // Restore persisted student data (additions, deletions, edits, grades)
  loadStudentsData();
  // Restore any saved questionnaire answers from previous sessions
  loadSavedQuestionnaires();

  // Update school year text in topbar from settings
  var syEl = document.getElementById('schoolYear');
  if (syEl) syEl.textContent = 'Tahun Ajaran ' + (SSA_SETTINGS.schoolYear || '2024/2025');

  // Theme toggle (topbar + login screen)
  document.getElementById('themeToggle').addEventListener('click', SSA.theme.toggle);
  document.getElementById('loginThemeToggle').addEventListener('click', SSA.theme.toggle);

  // User menu dropdown
  document.getElementById('userBtn').addEventListener('click', function (e) {
    e.stopPropagation();
    document.getElementById('userDropdown').classList.toggle('show');
  });
  document.addEventListener('click', function () {
    document.getElementById('userDropdown').classList.remove('show');
  });

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', SSA.auth.handleLogout);

  // Mobile sidebar
  document.getElementById('menuToggle').addEventListener('click', SSA.nav.toggle);
  document.getElementById('overlay').addEventListener('click', SSA.nav.close);

  // Login form
  document.getElementById('loginBtn').addEventListener('click', SSA.auth.handleLogin);
  document.getElementById('loginPassword').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') SSA.auth.handleLogin();
  });
  document.getElementById('loginUsername').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') SSA.auth.handleLogin();
  });

  // Register form
  document.getElementById('registerBtn').addEventListener('click', SSA.auth.handleRegister);
  document.getElementById('goRegisterBtn').addEventListener('click', SSA.auth.showRegister);
  document.getElementById('goLoginBtn').addEventListener('click', SSA.auth.showLogin);

  // Auth gate — show app or login
  if (SSA.auth.isLoggedIn()) {
    SSA.auth.updateUI();
    if (!location.hash || location.hash === '#') location.hash = '#dashboard';
    SSA.router.render();
  } else {
    SSA.auth.showLogin();
  }
});
