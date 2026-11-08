/* ============================================================
   Personalized Learning module
   Recommendations based on academic analysis + interest profile
   ============================================================ */

SSA.routes.learning = {
  render: function (container) {
    container.innerHTML = `
      <div class="page-head">
        <h2>Personalized Learning</h2>
        <p>Rekomendasi metode belajar dan saran pengembangan yang disesuaikan untuk setiap siswa.</p>
      </div>

      <div class="toolbar">
        <div>
          <label class="label">Pilih Kelas</label>
          <select class="select" id="learningClassSelect">
            <option value="">Semua Kelas</option>
            ${getAccessibleClasses().map(function (c) {
              return `<option value="${c}">Kelas ${c}</option>`;
            }).join('')}
          </select>
        </div>
        <div style="flex:1;min-width:220px">
          <label class="label">Pilih Siswa</label>
          <select class="select" id="learningStudentSelect" style="width:100%"></select>
        </div>
      </div>

      <div id="learningContent"></div>
    `;

    const classSelect = container.querySelector('#learningClassSelect');
    const select = container.querySelector('#learningStudentSelect');
    const content = container.querySelector('#learningContent');

    const update = () => {
      const s = getStudentById(select.value);
      if (!s) return;
      this.renderPersonalized(content, s);
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
      if (!filtered.length) {
        content.innerHTML = SSA.ui.noStudentsMsg();
        return;
      }
      update();
    }

    classSelect.addEventListener('change', populateStudents);
    select.addEventListener('change', update);
    populateStudents();
  },

  renderPersonalized: function (container, student) {
    const oa = overallAverage(student);
    const strong = strongestSubject(student);
    const weak = weakestSubject(student);
    const ranked = SUBJECTS.map(function (subj) {
      return { subject: subj, value: subjectAverage(student, subj), trend: subjectTrend(student, subj) };
    }).sort(function (a, b) { return b.value - a.value; });
    const interests = topInterests(student);
    const topInterest = interests[0];

    // generate personalized learning methods based on academic profile
    const methods = this.getLearningMethods(student, oa, strong, weak, ranked);
    // development suggestions
    const suggestions = this.getDevelopmentSuggestions(student, oa, strong, weak, topInterest, ranked);
    // study tips per subject based on performance level
    const subjectTips = this.getSubjectTips(student, ranked);

    container.innerHTML = `
      <div class="card mb-3">
        <div class="detail-header">
          <div class="avatar xl">${SSA.ui.initials(student.name)}</div>
          <div class="info" style="flex:1">
            <h3>${SSA.ui.escape(student.name)}</h3>
            <p>Kelas ${student.kelas} · Rata-rata ${oa} · Minat dominan: ${CATEGORY_INFO[topInterest.category].icon} ${topInterest.category}</p>
          </div>
          <div style="text-align:center">
            <span class="badge ${oa>=80?'badge-green':oa>=70?'badge-amber':'badge-red'}" style="font-size:.85rem;padding:.4rem .9rem">Predikat ${letterGrade(oa)}</span>
          </div>
        </div>
      </div>

      <!-- Overall recommendation -->
      <div id="overviewArea" class="mb-3"></div>

      <!-- Learning methods -->
      <div class="card mb-3">
        <h3 class="card-title">📚 Rekomendasi Metode Belajar</h3>
        <p class="text-sm text-gray mb-2">Metode belajar yang direkomendasikan berdasarkan hasil analisis akademik ${SSA.ui.escape(student.name)}.</p>
        <div id="methodsArea"></div>
      </div>

      <!-- Development suggestions -->
      <div class="card mb-3">
        <h3 class="card-title">🌱 Saran Pengembangan Kemampuan</h3>
        <div id="suggestionsArea"></div>
      </div>

      <!-- Subject-specific tips -->
      <div class="card mb-3">
        <h3 class="card-title">✏️ Saran Belajar per Mata Pelajaran</h3>
        <div id="subjectTipsArea"></div>
      </div>

      <!-- Combining interests + academics -->
      <div class="card">
        <h3 class="card-title">🎯 Rekomendasi Pengembangan Berbasis Minat</h3>
        <p class="text-sm text-gray mb-2">Menghubungkan hasil akademik dengan bidang minat untuk pengembangan holistik.</p>
        <div id="interestRecoArea"></div>
      </div>
    `;

    this.renderOverview(container, student, oa, strong, weak, topInterest);
    this.renderMethods(container, methods);
    this.renderSuggestions(container, suggestions);
    this.renderSubjectTips(container, subjectTips);
    this.renderInterestReco(container, student, ranked, interests);
  },

  renderOverview: function (container, student, oa, strong, weak, topInterest) {
    const el = container.querySelector('#overviewArea');
    let html = '';

    if (oa >= 85) {
      html += `<div class="alert-box success"><div class="icon">🌟</div><div class="body"><strong>${SSA.ui.escape(student.name)}</strong> menunjukkan prestasi akademik yang sangat baik. Disarankan untuk diberikan tantangan yang lebih tinggi dan kesempatan memimpin sebaya dalam pembelajaran.</div></div>`;
    } else if (oa >= 75) {
      html += `<div class="alert-box info"><div class="icon">👍</div><div class="body"><strong>${SSA.ui.escape(student.name)}</strong> memiliki performa akademik yang baik. Dengan dukungan yang tepat, siswa dapat mencapai potensi maksimal.</div></div>`;
    } else if (oa >= 65) {
      html += `<div class="alert-box warn"><div class="icon">📋</div><div class="body"><strong>${SSA.ui.escape(student.name)}</strong> berada di tingkat cukup. Perlu pendampingan yang lebih intensif untuk meningkatkan pemahaman dan motivasi belajar.</div></div>`;
    } else {
      html += `<div class="alert-box danger"><div class="icon">🆘</div><div class="body"><strong>${SSA.ui.escape(student.name)}</strong> membutuhkan perhatian khusus. Disarankan program remedial intensif dan konsultasi rutin dengan guru.</div></div>`;
    }

    html += `<div class="grid grid-3 mt-2">
      <div class="stat-card" style="box-shadow:none;border-color:var(--gray-100)"><div class="stat-icon green">🏆</div><div class="stat-info"><div class="stat-value" style="font-size:1.1rem">${strong.subject}</div><div class="stat-label">Keunggulan (${strong.value})</div></div></div>
      <div class="stat-card" style="box-shadow:none;border-color:var(--gray-100)"><div class="stat-icon red">📌</div><div class="stat-info"><div class="stat-value" style="font-size:1.1rem">${weak.subject}</div><div class="stat-label">Perlu Fokus (${weak.value})</div></div></div>
      <div class="stat-card" style="box-shadow:none;border-color:var(--gray-100)"><div class="stat-icon blue">${CATEGORY_INFO[topInterest.category].icon}</div><div class="stat-info"><div class="stat-value" style="font-size:1.1rem">${topInterest.category.split(' &')[0]}</div><div class="stat-label">Minat Utama (${topInterest.value}%)</div></div></div>
    </div>`;

    el.innerHTML = html;
  },

  getLearningMethods: function (student, oa, strong, weak, ranked) {
    const methods = [];

    // Visual learners - based on Seni Budaya performance
    if (subjectAverage(student, 'Seni Budaya') >= 78) {
      methods.push({
        icon: '👁️', title: 'Metode Visual',
        desc: 'Gunakan diagram, mind map, dan video pembelajaran karena siswa menyerap informasi visual dengan baik.'
      });
    }

    // Hands-on / experiential - based on IPA/IPS
    if (subjectAverage(student, 'IPA') >= 78 || subjectAverage(student, 'IPS') >= 78) {
      methods.push({
        icon: '🧪', title: 'Metode Eksperimen',
        desc: 'Terapkan pembelajaran berbasis proyek dan eksperimen praktis untuk memperkuat pemahaman konsep.'
      });
    }

    // Discussion-based - based on social interest
    if (student.interests['Sosial & Komunikasi'] >= 65) {
      methods.push({
        icon: '💬', title: 'Metode Diskusi Kelompok',
        desc: 'Manfaatkan kecenderungan sosial siswa dengan diskusi kelompok, presentasi, dan belajar berpasangan.'
      });
    }

    // Structured/sequential - good at math
    if (subjectAverage(student, 'Matematika') >= 80) {
      methods.push({
        icon: '🔢', title: 'Metode Terstruktur Bertahap',
        desc: 'Siswa menikmati pendekatan logis bertahap. Gunakan langkah-langkah terstruktur untuk topik kompleks.'
      });
    }

    // Remedial for weak areas
    if (weak.value < 70) {
      methods.push({
        icon: '🔁', title: 'Metode Remedial Berulang',
        desc: 'Untuk ' + weak.subject + ', gunakan latihan berulang dengan materi yang dipecah menjadi bagian kecil dan disertai feedback langsung.'
      });
    }

    // Spaced repetition if declining trend in multiple subjects
    const decliningCount = ranked.filter(function (r) { return r.trend < -0.3; }).length;
    if (decliningCount >= 2) {
      methods.push({
        icon: '📅', title: 'Metode Repetisi Spasial',
        desc: 'Siswa menunjukkan tren penurunan di beberapa mapel. Gunakan jadwal pengulangan bertingkat untuk mempertahankan ingatan jangka panjang.'
      });
    }

    // Always include gamification suggestion for engagement
    methods.push({
      icon: '🎮', title: 'Metode Gamifikasi',
      desc: 'Tambahkan elemen permainan dan penghargaan kecil untuk meningkatkan motivasi dan keterlibatan belajar.'
    });

    return methods;
  },

  renderMethods: function (container, methods) {
    const el = container.querySelector('#methodsArea');
    el.innerHTML = methods.map(function (m) {
      return `
        <div class="alert-box info" style="margin-bottom:.75rem">
          <div class="icon" style="font-size:1.4rem">${m.icon}</div>
          <div class="body"><strong>${m.title}</strong> — ${m.desc}</div>
        </div>`;
    }).join('');
  },

  getDevelopmentSuggestions: function (student, oa, strong, weak, topInterest, ranked) {
    const sugs = [];

    // Develop strengths further
    sugs.push({
      icon: '🚀', title: 'Pengembangan Keunggulan: ' + strong.subject,
      desc: 'Meski sudah unggul di ' + strong.subject + ' (rata-rata ' + strong.value + '), berikan materi pengayaan dan tantangan lanjutan agar siswa terus berkembang.'
    });

    // Address weaknesses
    if (weak.value < 70) {
      sugs.push({
        icon: '💪', title: 'Perbaikan Mata Pelajaran: ' + weak.subject,
        desc: 'Nilai ' + weak.subject + ' masih ' + weak.value + '. Disarankan bimbingan khusus, tutor sebaya, dan latihan rutin dengan tingkat kesulitan bertahap.'
      });
    } else {
      sugs.push({
        icon: '📈', title: 'Peningkatan ' + weak.subject,
        desc: 'Nilai ' + weak.subject + ' (' + weak.value + ') cukup baik namun relatif paling rendah. Fokus pada latihan soal dan pemahaman konsep dasar.'
      });
    }

    // Interest-based development
    const info = CATEGORY_INFO[topInterest.category];
    sugs.push({
      icon: '🎯', title: 'Pengembangan Berbasis Minat: ' + topInterest.category,
      desc: 'Minat tertinggi siswa di ' + topInterest.category + ' (' + topInterest.value + '%). Saran: ' + info.recommendations[0] + '.'
    });

    // Declining subjects
    const declining = ranked.filter(function (r) { return r.trend < -0.3; });
    if (declining.length) {
      sugs.push({
        icon: '⚠️', title: 'Penanganan Penurunan Nilai',
        desc: 'Terdapat ' + declining.length + ' mata pelajaran dengan tren menurun: ' + declining.map(function (d) { return d.subject; }).join(', ') + '. Tinjau kembali metode belajar dan berikan motivasi ekstra.'
      });
    }

    // Time management if overall below average
    if (oa < 75) {
      sugs.push({
        icon: '⏰', title: 'Manajemen Waktu & Konsistensi',
        desc: 'Bantu siswa menyusun jadwal belajar harian yang konsisten. Fokus pada kebiasaan belajar 30-45 menit per sesi dengan jeda istirahat.'
      });
    } else {
      sugs.push({
        icon: '🌟', title: 'Pengembangan Kepemimpinan',
        desc: 'Siswa berprestasi baik dapat diberi peran sebagai mentor sebaya untuk memperkuat pemahaman dan membangun rasa percaya diri.'
      });
    }

    return sugs;
  },

  renderSuggestions: function (container, sugs) {
    const el = container.querySelector('#suggestionsArea');
    el.innerHTML = sugs.map(function (s) {
      return `
        <div class="reco-box">
          <h4>${s.icon} ${s.title}</h4>
          <p class="text-sm" style="color:var(--gray-600)">${s.desc}</p>
        </div>`;
    }).join('');
  },

  getSubjectTips: function (student, ranked) {
    return ranked.map(function (r) {
      let level, icon, tips;
      if (r.value >= 85) {
        level = 'Sangat Baik'; icon = '🏆';
        tips = ['Berikan materi pengayaan dan soal olimpiade', 'Dorong eksplorasi topik lanjutan mandiri'];
      } else if (r.value >= 75) {
        level = 'Baik'; icon = '✅';
        tips = ['Latihan soal variatif untuk konsistensi', 'Hubungkan konsep dengan aplikasi nyata'];
      } else if (r.value >= 65) {
        level = 'Cukup'; icon = '📋';
        tips = ['Perkuat pemahaman konsep dasar', 'Latihan rutin dengan soal bertingkat'];
      } else {
        level = 'Perlu Bimbingan'; icon = '⚠️';
        tips = ['Mulai dari konsep paling dasar', 'Gunakan tutor sebaya dan latihan terbimbing'];
      }
      return { subject: r.subject, value: r.value, trend: r.trend, level: level, icon: icon, tips: tips };
    });
  },

  renderSubjectTips: function (container, tips) {
    const el = container.querySelector('#subjectTipsArea');
    el.innerHTML = `<div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>Mata Pelajaran</th><th>Rata-rata</th><th>Tren</th><th>Level</th><th>Saran</th></tr></thead>
        <tbody>
          ${tips.map(function (t) {
            const tl = trendLabel(t.trend);
            return `<tr>
              <td><span style="display:inline-flex;align-items:center;gap:.4rem"><span style="width:10px;height:10px;border-radius:50%;background:${SUBJECT_COLORS[t.subject]}"></span>${t.subject}</span></td>
              <td><strong>${t.value}</strong></td>
              <td><span class="badge ${tl.cls==='trend-up'?'badge-green':tl.cls==='trend-down'?'badge-red':'badge-gray'}">${tl.text}</span></td>
              <td><span class="badge ${t.value>=80?'badge-green':t.value>=70?'badge-blue':t.value>=60?'badge-amber':'badge-red'}">${t.icon} ${t.level}</span></td>
              <td style="white-space:normal;min-width:260px"><ul style="padding-left:1.1rem;margin:0">${t.tips.map(function(tp){return '<li>'+tp+'</li>';}).join('')}</ul></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
  },

  renderInterestReco: function (container, student, ranked, interests) {
    const el = container.querySelector('#interestRecoArea');
    const topInterests = interests.filter(function (i) { return i.value >= 55; }).slice(0, 3);
    let html = '';

    if (!topInterests.length) {
      html += '<div class="empty-state"><p>Belum ada minat yang signifikan teridentifikasi. Disarankan siswa mengisi kuesioner minat.</p></div>';
      el.innerHTML = html;
      return;
    }

    topInterests.forEach(function (interest) {
      const info = CATEGORY_INFO[interest.category];
      // connect interest with related subjects
      let related;
      if (interest.category === 'Sains & Teknologi') related = ['IPA', 'Matematika'];
      else if (interest.category === 'Bahasa & Sastra') related = ['Bahasa Indonesia', 'Bahasa Inggris'];
      else if (interest.category === 'Seni & Kreatif') related = ['Seni Budaya', 'Bahasa Indonesia'];
      else if (interest.category === 'Sosial & Komunikasi') related = ['PPKn', 'IPS'];
      else if (interest.category === 'Bisnis & Manajemen') related = ['IPS', 'Matematika'];
      else related = ['Penjaskes'];

      const subjectScores = related.map(function (subj) {
        return subj + ' (' + subjectAverage(student, subj) + ')';
      }).join(', ');

      html += `
        <div class="reco-box" style="background:${info.color}10;border-color:${info.color}30">
          <h4 style="color:${info.color}">${info.icon} ${interest.category} <span class="badge badge-gray" style="font-size:.7rem">${interest.value}%</span></h4>
          <p class="text-sm text-gray mb-2">Mapel terkait: <strong>${subjectScores}</strong></p>
          <p class="text-sm" style="color:var(--gray-600)">${info.desc}</p>
          <ul class="reco-list mt-2">
            ${info.recommendations.map(function (rec) { return '<li>' + rec + '</li>'; }).join('')}
          </ul>
        </div>`;
    });

    el.innerHTML = html;
  }
};
