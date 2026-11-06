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
      management: 'Manajemen Siswa'
    };
    document.getElementById('pageTitle').textContent = titles[name] || 'Smart Student Analytics';

    // active nav
    document.querySelectorAll('.nav-item').forEach(function (el) {
      el.classList.toggle('active', el.dataset.route === name);
    });

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
  document.getElementById('menuToggle').addEventListener('click', SSA.nav.toggle);
  document.getElementById('overlay').addEventListener('click', SSA.nav.close);

  if (!location.hash) location.hash = '#dashboard';
  SSA.router.render();
});
