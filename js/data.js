/* ============================================================
   Smart Student Analytics — Data Layer (dummy data)
   All data is generated in-memory so the app works with no DB.
   ============================================================ */

/* ---------- Configurable settings (loaded from localStorage) ---------- */

var SSA_SETTINGS_KEY = 'ssa_settings_v1';

var DEFAULT_SETTINGS = {
  schoolYear: '2024/2025',
  nisYearPrefix: '2025',
  subjects: [
    'Matematika', 'Bahasa Indonesia', 'Bahasa Inggris',
    'IPA', 'IPS', 'PPKn', 'Seni Budaya', 'Penjaskes'
  ],
  subjectColors: {
    'Matematika': '#3b82f6', 'Bahasa Indonesia': '#ef4444',
    'Bahasa Inggris': '#8b5cf6', 'IPA': '#10b981', 'IPS': '#f59e0b',
    'PPKn': '#ec4899', 'Seni Budaya': '#6366f1', 'Penjaskes': '#14b8a6'
  },
  assessmentSchedule: [
    { date: '2024-09-15', label: 'Harian 1',   type: 'Harian', semester: 1 },
    { date: '2024-10-10', label: 'Harian 2',   type: 'Harian', semester: 1 },
    { date: '2024-11-20', label: 'UTS Ganjil', type: 'UTS',    semester: 1 },
    { date: '2024-12-12', label: 'Harian 3',   type: 'Harian', semester: 1 },
    { date: '2025-01-25', label: 'UAS Ganjil', type: 'UAS',    semester: 1 },
    { date: '2025-02-18', label: 'Harian 4',   type: 'Harian', semester: 2 },
    { date: '2025-03-22', label: 'Harian 5',   type: 'Harian', semester: 2 },
    { date: '2025-04-25', label: 'UTS Genap',  type: 'UTS',    semester: 2 },
    { date: '2025-05-28', label: 'Harian 6',   type: 'Harian', semester: 2 },
    { date: '2025-06-20', label: 'UAS Genap',  type: 'UAS',    semester: 2 }
  ]
};

function loadSettings() {
  try {
    var saved = JSON.parse(localStorage.getItem(SSA_SETTINGS_KEY) || 'null');
    if (saved && saved.subjects && saved.subjects.length && saved.assessmentSchedule && saved.assessmentSchedule.length) {
      return saved;
    }
  } catch (e) {}
  return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
}

function saveSettings(settings) {
  try { localStorage.setItem(SSA_SETTINGS_KEY, JSON.stringify(settings)); } catch (e) {}
}

var SSA_SETTINGS = loadSettings();

/* ---------- Constants (now configurable via settings) ---------- */

let SUBJECTS = SSA_SETTINGS.subjects;
let SUBJECT_COLORS = SSA_SETTINGS.subjectColors;
let ASSESSMENT_SCHEDULE = SSA_SETTINGS.assessmentSchedule;

const INTEREST_CATEGORIES = [
  "Sains & Teknologi",
  "Seni & Kreatif",
  "Sosial & Komunikasi",
  "Bisnis & Manajemen",
  "Olahraga",
  "Bahasa & Sastra"
];

const CATEGORY_INFO = {
  "Sains & Teknologi": {
    color: "#3b82f6",
    icon: "🔬",
    desc: "Berpikir logis, eksperimen, teknologi, dan pemecahan masalah.",
    recommendations: [
      "Mengikuti klub robotika atau eksperimen sains.",
      "Belajar pemrograman dasar (Python / Scratch).",
      "Mengikuti kompetisi Kombat Robot / KSM bidang sains."
    ]
  },
  "Seni & Kreatif": {
    color: "#8b5cf6",
    icon: "🎨",
    desc: "Ekspresi kreatif melalui seni rupa, musik, dan imajinasi.",
    recommendations: [
      "Mengikuti ekstrakurikuler seni rupa atau musik.",
      "Mengikuti lomba menggambar atau membuat video pendek.",
      "Belajar desain grafis atau fotografi dasar."
    ]
  },
  "Sosial & Komunikasi": {
    color: "#ec4899",
    icon: "💬",
    desc: "Interaksi sosial, kepemimpinan, dan empati terhadap sesama.",
    recommendations: [
      "Mengikuti OSIS atau organisasi siswa.",
      "Mengikuti pelatihan public speaking.",
      "Menjadi panitia acara sekolah atau MC."
    ]
  },
  "Bisnis & Manajemen": {
    color: "#f59e0b",
    icon: "💼",
    desc: "Kewirausahaan, perencanaan, dan pengelolaan sumber daya.",
    recommendations: [
      "Mengikuti ekstrakurikuler wirausaha / market day.",
      "Belajar manajemen keuangan pribadi sederhana.",
      "Mengikuti program pekan wirausaha sekolah."
    ]
  },
  "Olahraga": {
    color: "#14b8a6",
    icon: "⚽",
    desc: "Aktivitas fisik, ketangkasan, dan kesehatan tubuh.",
    recommendations: [
      "Mengikuti ekstrakurikuler olahraga (futsal, basket, voli).",
      "Mengikuti latihan rutin untuk kebugaran dan ketahanan.",
      "Mengikuti kompetisi antar kelas (porak / turnamen)."
    ]
  },
  "Bahasa & Sastra": {
    color: "#6366f1",
    icon: "📚",
    desc: "Pencinta bahasa, sastra, dan komunikasi tertulis.",
    recommendations: [
      "Mengikuti klub jurnalistik / majalah dinding.",
      "Mengikuti lomba pidato atau debat bahasa.",
      "Mengikuti ekstrakurikuler teater atau sastra."
    ]
  }
};

// Interest questionnaire — 3 questions per category
const QUESTIONNAIRE = [
  { id: 1,  text: "Saya menikmati bereksperimen dan memahami cara kerja sesuatu.", category: "Sains & Teknologi" },
  { id: 2,  text: "Saya tertarik mempelajari teknologi, komputer, dan pemrograman.", category: "Sains & Teknologi" },
  { id: 3,  text: "Saya suka memecahkan masalah yang berhubungan dengan logika dan angka.", category: "Sains & Teknologi" },
  { id: 4,  text: "Saya menikmati menggambar, melukis, atau membuat karya seni.", category: "Seni & Kreatif" },
  { id: 5,  text: "Saya suka bermain musik, menyanyi, atau menari.", category: "Seni & Kreatif" },
  { id: 6,  text: "Saya sering memiliki ide-ide kreatif dan imajinatif.", category: "Seni & Kreatif" },
  { id: 7,  text: "Saya senang bekerja sama dalam kelompok dan tim.", category: "Sosial & Komunikasi" },
  { id: 8,  text: "Saya merasa nyaman berbicara atau tampil di depan umum.", category: "Sosial & Komunikasi" },
  { id: 9,  text: "Saya suka membantu dan mendengarkan masalah orang lain.", category: "Sosial & Komunikasi" },
  { id: 10, text: "Saya tertarik dengan kegiatan jual beli dan kewirausahaan.", category: "Bisnis & Manajemen" },
  { id: 11, text: "Saya suka merencanakan dan mengorganisir suatu kegiatan.", category: "Bisnis & Manajemen" },
  { id: 12, text: "Saya tertarik mempelajari cara mengelola uang dan keuangan.", category: "Bisnis & Manajemen" },
  { id: 13, text: "Saya menikmati aktivitas fisik dan berolahraga.", category: "Olahraga" },
  { id: 14, text: "Saya suka kompetisi olahraga dan tantangan fisik.", category: "Olahraga" },
  { id: 15, text: "Saya peduli pada kesehatan dan kebugaran tubuh.", category: "Olahraga" },
  { id: 16, text: "Saya menikmati membaca buku, novel, atau puisi.", category: "Bahasa & Sastra" },
  { id: 17, text: "Saya suka menulis cerita, esai, atau jurnal pribadi.", category: "Bahasa & Sastra" },
  { id: 18, text: "Saya tertarik mempelajari bahasa asing dan budaya lain.", category: "Bahasa & Sastra" }
];

const RATING_LABELS = ["Sangat tidak setuju", "Tidak setuju", "Netral", "Setuju", "Sangat setuju"];

/* ---------- Helpers ---------- */

function seededRandom(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function round1(v) {
  return Math.round(v * 10) / 10;
}

/* ---------- Grade generation ---------- */

function generateSubjectGrades(baseScore, trend, seed) {
  const rand = seededRandom(seed);
  return ASSESSMENT_SCHEDULE.map(function (a, i) {
    const progress = i * trend;
    const noise = (rand() - 0.5) * 7;
    let score = baseScore + progress + noise;
    // major assessments slightly harder
    if (a.type === "UAS") score -= 1.5;
    score = clamp(Math.round(score), 45, 100);
    return {
      date: a.date,
      label: a.label,
      type: a.type,
      semester: a.semester,
      score: score
    };
  });
}

/* ---------- Student profiles (base data) ---------- */
/* trend: positive = improving, negative = declining, ~0 = stable */

const PROFILES = [
  { id: 1,  name: "Ahmad Pratama",     kelas: "8A", subjects: {
    "Matematika": { base: 72, trend: 1.8 }, "Bahasa Indonesia": { base: 78, trend: 1.2 },
    "Bahasa Inggris": { base: 70, trend: 1.5 }, "IPA": { base: 80, trend: 1.0 },
    "IPS": { base: 76, trend: 0.8 }, "PPKn": { base: 82, trend: 0.5 },
    "Seni Budaya": { base: 85, trend: 0.6 }, "Penjaskes": { base: 88, trend: 0.3 } },
    interests: { "Sains & Teknologi": 88, "Seni & Kreatif": 62, "Sosial & Komunikasi": 45, "Bisnis & Manajemen": 30, "Olahraga": 70, "Bahasa & Sastra": 55 } },

  { id: 2,  name: "Siti Nurhaliza",    kelas: "8A", subjects: {
    "Matematika": { base: 88, trend: 0.8 }, "Bahasa Indonesia": { base: 92, trend: 0.5 },
    "Bahasa Inggris": { base: 90, trend: 0.7 }, "IPA": { base: 86, trend: 0.6 },
    "IPS": { base: 89, trend: 0.5 }, "PPKn": { base: 94, trend: 0.3 },
    "Seni Budaya": { base: 91, trend: 0.4 }, "Penjaskes": { base: 80, trend: 0.2 } },
    interests: { "Sains & Teknologi": 60, "Seni & Kreatif": 85, "Sosial & Komunikasi": 78, "Bisnis & Manajemen": 40, "Olahraga": 45, "Bahasa & Sastra": 90 } },

  { id: 3,  name: "Bayu Setiawan",      kelas: "8B", subjects: {
    "Matematika": { base: 78, trend: -0.5 }, "Bahasa Indonesia": { base: 70, trend: -1.0 },
    "Bahasa Inggris": { base: 65, trend: -0.8 }, "IPA": { base: 75, trend: 0.5 },
    "IPS": { base: 73, trend: 0.3 }, "PPKn": { base: 80, trend: 0.2 },
    "Seni Budaya": { base: 72, trend: 0.4 }, "Penjaskes": { base: 95, trend: 1.0 } },
    interests: { "Sains & Teknologi": 50, "Seni & Kreatif": 55, "Sosial & Komunikasi": 65, "Bisnis & Manajemen": 35, "Olahraga": 95, "Bahasa & Sastra": 40 } },

  { id: 4,  name: "Dewi Lestari",      kelas: "7A", subjects: {
    "Matematika": { base: 68, trend: 2.0 }, "Bahasa Indonesia": { base: 80, trend: 1.0 },
    "Bahasa Inggris": { base: 72, trend: 1.6 }, "IPA": { base: 74, trend: 1.4 },
    "IPS": { base: 78, trend: 0.9 }, "PPKn": { base: 83, trend: 0.5 },
    "Seni Budaya": { base: 88, trend: 0.6 }, "Penjaskes": { base: 82, trend: 0.4 } },
    interests: { "Sains & Teknologi": 72, "Seni & Kreatif": 80, "Sosial & Komunikasi": 70, "Bisnis & Manajemen": 45, "Olahraga": 60, "Bahasa & Sastra": 75 } },

  { id: 5,  name: "Eko Wijaya",        kelas: "7A", subjects: {
    "Matematika": { base: 85, trend: 1.2 }, "Bahasa Indonesia": { base: 74, trend: 0.3 },
    "Bahasa Inggris": { base: 78, trend: 0.6 }, "IPA": { base: 88, trend: 1.5 },
    "IPS": { base: 70, trend: -0.4 }, "PPKn": { base: 79, trend: 0.3 },
    "Seni Budaya": { base: 68, trend: 0.2 }, "Penjaskes": { base: 85, trend: 0.5 } },
    interests: { "Sains & Teknologi": 92, "Seni & Kreatif": 40, "Sosial & Komunikasi": 50, "Bisnis & Manajemen": 65, "Olahraga": 70, "Bahasa & Sastra": 48 } },

  { id: 6,  name: "Fitri Handayani",   kelas: "7B", subjects: {
    "Matematika": { base: 64, trend: 1.0 }, "Bahasa Indonesia": { base: 85, trend: 0.6 },
    "Bahasa Inggris": { base: 82, trend: 0.8 }, "IPA": { base: 70, trend: 0.5 },
    "IPS": { base: 80, trend: 0.4 }, "PPKn": { base: 88, trend: 0.3 },
    "Seni Budaya": { base: 90, trend: 0.5 }, "Penjaskes": { base: 76, trend: 0.2 } },
    interests: { "Sains & Teknologi": 55, "Seni & Kreatif": 88, "Sosial & Komunikasi": 82, "Bisnis & Manajemen": 50, "Olahraga": 40, "Bahasa & Sastra": 85 } },

  { id: 7,  name: "Gilang Ramadhan",   kelas: "8B", subjects: {
    "Matematika": { base: 60, trend: -1.2 }, "Bahasa Indonesia": { base: 66, trend: -0.8 },
    "Bahasa Inggris": { base: 62, trend: -0.5 }, "IPA": { base: 64, trend: -0.6 },
    "IPS": { base: 70, trend: 0.2 }, "PPKn": { base: 75, trend: 0.1 },
    "Seni Budaya": { base: 78, trend: 0.3 }, "Penjaskes": { base: 90, trend: 1.2 } },
    interests: { "Sains & Teknologi": 40, "Seni & Kreatif": 60, "Sosial & Komunikasi": 72, "Bisnis & Manajemen": 30, "Olahraga": 90, "Bahasa & Sastra": 50 } },

  { id: 8,  name: "Hana Pertiwi",      kelas: "9A", subjects: {
    "Matematika": { base: 84, trend: 1.0 }, "Bahasa Indonesia": { base: 88, trend: 0.8 },
    "Bahasa Inggris": { base: 86, trend: 1.2 }, "IPA": { base: 82, trend: 0.9 },
    "IPS": { base: 85, trend: 0.7 }, "PPKn": { base: 90, trend: 0.4 },
    "Seni Budaya": { base: 83, trend: 0.5 }, "Penjaskes": { base: 84, trend: 0.3 } },
    interests: { "Sains & Teknologi": 75, "Seni & Kreatif": 65, "Sosial & Komunikasi": 85, "Bisnis & Manajemen": 78, "Olahraga": 50, "Bahasa & Sastra": 72 } },

  { id: 9,  name: "Irfan Maulana",    kelas: "9A", subjects: {
    "Matematika": { base: 80, trend: 0.5 }, "Bahasa Indonesia": { base: 76, trend: 0.4 },
    "Bahasa Inggris": { base: 74, trend: 0.6 }, "IPA": { base: 83, trend: 0.8 },
    "IPS": { base: 72, trend: -0.3 }, "PPKn": { base: 81, trend: 0.2 },
    "Seni Budaya": { base: 70, trend: 0.3 }, "Penjaskes": { base: 87, trend: 0.6 } },
    interests: { "Sains & Teknologi": 80, "Seni & Kreatif": 45, "Sosial & Komunikasi": 55, "Bisnis & Manajemen": 72, "Olahraga": 68, "Bahasa & Sastra": 40 } },

  { id: 10, name: "Jihan Salsabila",   kelas: "9B", subjects: {
    "Matematika": { base: 66, trend: 1.6 }, "Bahasa Indonesia": { base: 83, trend: 0.9 },
    "Bahasa Inggris": { base: 88, trend: 1.1 }, "IPA": { base: 72, trend: 1.0 },
    "IPS": { base: 82, trend: 0.6 }, "PPKn": { base: 86, trend: 0.4 },
    "Seni Budaya": { base: 87, trend: 0.5 }, "Penjaskes": { base: 78, trend: 0.3 } },
    interests: { "Sains & Teknologi": 62, "Seni & Kreatif": 78, "Sosial & Komunikasi": 80, "Bisnis & Manajemen": 55, "Olahraga": 48, "Bahasa & Sastra": 92 } },

  { id: 11, name: "Kevin Pratama",    kelas: "7B", subjects: {
    "Matematika": { base: 74, trend: -0.8 }, "Bahasa Indonesia": { base: 68, trend: -0.5 },
    "Bahasa Inggris": { base: 60, trend: -1.0 }, "IPA": { base: 72, trend: 0.3 },
    "IPS": { base: 70, trend: 0.1 }, "PPKn": { base: 78, trend: 0.2 },
    "Seni Budaya": { base: 75, trend: 0.4 }, "Penjaskes": { base: 92, trend: 0.8 } },
    interests: { "Sains & Teknologi": 48, "Seni & Kreatif": 52, "Sosial & Komunikasi": 60, "Bisnis & Manajemen": 38, "Olahraga": 92, "Bahasa & Sastra": 45 } },

  { id: 12, name: "Lina Marlina",      kelas: "8A", subjects: {
    "Matematika": { base: 90, trend: 0.6 }, "Bahasa Indonesia": { base: 87, trend: 0.5 },
    "Bahasa Inggris": { base: 91, trend: 0.8 }, "IPA": { base: 89, trend: 0.7 },
    "IPS": { base: 84, trend: 0.6 }, "PPKn": { base: 92, trend: 0.3 },
    "Seni Budaya": { base: 80, trend: 0.4 }, "Penjaskes": { base: 85, trend: 0.5 } },
    interests: { "Sains & Teknologi": 90, "Seni & Kreatif": 58, "Sosial & Komunikasi": 65, "Bisnis & Manajemen": 82, "Olahraga": 55, "Bahasa & Sastra": 70 } }
];

/* ---------- Build full student dataset ---------- */

const STUDENTS = PROFILES.map(function (p) {
  const grades = {};
  SUBJECTS.forEach(function (subj, si) {
    const cfg = p.subjects[subj] || { base: 75, trend: 0 };
    grades[subj] = generateSubjectGrades(cfg.base, cfg.trend, p.id * 100 + si + 7);
  });

  // generate questionnaire answers from interest profile
  const rand = seededRandom(p.id * 1000 + 99);
  const answers = {};
  QUESTIONNAIRE.forEach(function (q) {
    const prof = p.interests[q.category];
    let base = (prof / 100) * 4 + 1; // 1..5
    let noise = (rand() - 0.5) * 1.4;
    answers[q.id] = clamp(Math.round(base + noise), 1, 5);
  });

  return {
    id: p.id,
    name: p.name,
    kelas: p.kelas,
    grades: grades,
    interests: p.interests,
    answers: answers,
    hasFilledQuestionnaire: true
  };
});

/* ---------- Derived data helpers ---------- */

function getStudentById(id) {
  return STUDENTS.find(function (s) { return String(s.id) === String(id); });
}

// average of an array of scores
function avg(arr) {
  if (!arr || !arr.length) return 0;
  return arr.reduce(function (a, b) { return a + b; }, 0) / arr.length;
}

// subject average for a student (all assessments)
function subjectAverage(student, subject) {
  return round1(avg(student.grades[subject].map(function (g) { return g.score; })));
}

// semester average for a student (by semester number)
function semesterAverage(student, semester) {
  const all = [];
  SUBJECTS.forEach(function (subj) {
    student.grades[subj].forEach(function (g) {
      if (g.semester === semester) all.push(g.score);
    });
  });
  return round1(avg(all));
}

// overall average for a student
function overallAverage(student) {
  const all = [];
  SUBJECTS.forEach(function (subj) {
    student.grades[subj].forEach(function (g) { all.push(g.score); });
  });
  return round1(avg(all));
}

// trend slope (simple linear regression on assessment index vs score) for a subject
function subjectTrend(student, subject) {
  const data = student.grades[subject];
  const n = data.length;
  if (n < 2) return 0;
  const xs = data.map(function (_, i) { return i; });
  const ys = data.map(function (g) { return g.score; });
  const mx = avg(xs), my = avg(ys);
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  return den === 0 ? 0 : round1(num / den);
}

// strongest subject (highest average)
function strongestSubject(student) {
  let best = SUBJECTS[0], bestVal = -1;
  SUBJECTS.forEach(function (s) {
    const v = subjectAverage(student, s);
    if (v > bestVal) { bestVal = v; best = s; }
  });
  return { subject: best, value: bestVal };
}

// weakest subject (lowest average)
function weakestSubject(student) {
  let worst = SUBJECTS[0], worstVal = 999;
  SUBJECTS.forEach(function (s) {
    const v = subjectAverage(student, s);
    if (v < worstVal) { worstVal = v; worst = s; }
  });
  return { subject: worst, value: worstVal };
}

// global stats
function getGlobalStats() {
  const total = STUDENTS.length;
  const allAverages = STUDENTS.map(function (s) { return overallAverage(s); });
  const overall = round1(avg(allAverages));
  const improving = STUDENTS.filter(function (s) {
    return avg(SUBJECTS.map(function (subj) { return subjectTrend(s, subj); })) > 0.3;
  }).length;
  const declining = STUDENTS.filter(function (s) {
    return avg(SUBJECTS.map(function (subj) { return subjectTrend(s, subj); })) < -0.3;
  }).length;

  // average per subject across all students
  const subjectAvgs = {};
  SUBJECTS.forEach(function (subj) {
    subjectAvgs[subj] = round1(avg(STUDENTS.map(function (s) { return subjectAverage(s, subj); })));
  });

  // average per assessment index across all students (for trend chart)
  const trendByAssessment = ASSESSMENT_SCHEDULE.map(function (_, i) {
    const vals = STUDENTS.map(function (s) {
      return avg(SUBJECTS.map(function (subj) {
        var g = s.grades[subj] ? s.grades[subj][i] : null;
        return g ? g.score : 0;
      }));
    });
    return round1(avg(vals));
  });

  // class list
  const classes = Array.from(new Set(STUDENTS.map(function (s) { return s.kelas; }))).sort();

  return {
    total: total,
    overall: overall,
    improving: improving,
    declining: declining,
    subjectAvgs: subjectAvgs,
    trendByAssessment: trendByAssessment,
    classes: classes
  };
}

// top interest categories for a student (sorted desc)
function topInterests(student) {
  return INTEREST_CATEGORIES.map(function (cat) {
    return { category: cat, value: student.interests[cat] };
  }).sort(function (a, b) { return b.value - a.value; });
}

// convert rating value to label
function ratingLabel(v) {
  return RATING_LABELS[clamp(v - 1, 0, 4)];
}

// letter grade from numeric
function letterGrade(score) {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "E";
}

// trend badge text
function trendLabel(trend) {
  if (trend > 0.3) return { text: "Meningkat", cls: "trend-up" };
  if (trend < -0.3) return { text: "Menurun", cls: "trend-down" };
  return { text: "Stabil", cls: "trend-stable" };
}

/* ---------- CRUD operations (in-memory) ---------- */

// Generate next available student ID
function nextStudentId() {
  if (!STUDENTS.length) return 1;
  return STUDENTS.reduce(function (max, s) { return Math.max(max, s.id); }, 0) + 1;
}

// Add a new student with base grades and default interest profile
function addStudent(name, kelas, baseGrades) {
  const id = nextStudentId();
  const grades = {};
  SUBJECTS.forEach(function (subj, si) {
    const base = (baseGrades && baseGrades[subj] !== undefined) ? baseGrades[subj] : 75;
    grades[subj] = generateSubjectGrades(base, 0, id * 100 + si + 7);
  });

  // default neutral interest profile
  const interests = {};
  INTEREST_CATEGORIES.forEach(function (cat) { interests[cat] = 50; });

  // default neutral questionnaire answers
  const answers = {};
  QUESTIONNAIRE.forEach(function (q) { answers[q.id] = 3; });

  const student = {
    id: id,
    nis: generateNis(id),
    name: name,
    kelas: kelas,
    grades: grades,
    interests: interests,
    answers: answers,
    hasFilledQuestionnaire: false,
    isCustom: true
  };

  STUDENTS.push(student);
  saveStudentsData();
  return student;
}

// Remove a student by id
function removeStudent(id) {
  const idx = STUDENTS.findIndex(function (s) { return String(s.id) === String(id); });
  if (idx !== -1) {
    STUDENTS.splice(idx, 1);
    saveStudentsData();
    return true;
  }
  return false;
}

// Update student basic info (name, class)
function updateStudentInfo(id, name, kelas) {
  const s = getStudentById(id);
  if (!s) return false;
  if (name)  s.name  = name;
  if (kelas) s.kelas = kelas;
  saveStudentsData();
  return true;
}

// Update a specific assessment score
function updateGrade(studentId, subject, assessmentIndex, newScore) {
  const s = getStudentById(studentId);
  if (s && s.grades[subject] && s.grades[subject][assessmentIndex]) {
    s.grades[subject][assessmentIndex].score = clamp(Math.round(newScore), 0, 100);
    saveStudentsData();
    return true;
  }
  return false;
}

// Add a new assessment entry to a subject
function addAssessment(studentId, subject, date, type, label, semester, score) {
  const s = getStudentById(studentId);
  if (!s || !s.grades[subject]) return false;
  s.grades[subject].push({
    date: date,
    label: label,
    type: type,
    semester: parseInt(semester),
    score: clamp(Math.round(score), 0, 100)
  });
  saveStudentsData();
  return true;
}

// Remove an assessment entry by index
function removeAssessment(studentId, subject, assessmentIndex) {
  const s = getStudentById(studentId);
  if (s && s.grades[subject] && s.grades[subject][assessmentIndex]) {
    s.grades[subject].splice(assessmentIndex, 1);
    saveStudentsData();
    return true;
  }
  return false;
}

/* ---------- localStorage persistence ---------- */

var SSA_STORAGE_KEY = 'ssa_questionnaire_v1';

// Save one student's answers + computed interests to localStorage
function saveStudentQuestionnaire(student) {
  try {
    var stored = JSON.parse(localStorage.getItem(SSA_STORAGE_KEY) || '{}');
    stored[String(student.id)] = {
      answers: student.answers,
      interests: student.interests,
      hasFilledQuestionnaire: student.hasFilledQuestionnaire
    };
    localStorage.setItem(SSA_STORAGE_KEY, JSON.stringify(stored));
  } catch (e) {}
}

// Load all saved questionnaire data back into the STUDENTS array
function loadSavedQuestionnaires() {
  try {
    var stored = JSON.parse(localStorage.getItem(SSA_STORAGE_KEY) || '{}');
    Object.keys(stored).forEach(function (id) {
      var s = getStudentById(id);
      if (!s) return;
      var data = stored[id];
      if (data.answers)  s.answers  = data.answers;
      if (data.interests) s.interests = data.interests;
      if (data.hasFilledQuestionnaire !== undefined) {
        s.hasFilledQuestionnaire = data.hasFilledQuestionnaire;
      }
    });
  } catch (e) {}
}

// Clear one student's saved questionnaire (used by Reset button)
function clearStudentQuestionnaire(studentId) {
  try {
    var stored = JSON.parse(localStorage.getItem(SSA_STORAGE_KEY) || '{}');
    delete stored[String(studentId)];
    localStorage.setItem(SSA_STORAGE_KEY, JSON.stringify(stored));
  } catch (e) {}
}

/* ---------- Student data persistence (localStorage) ---------- */

var SSA_STUDENTS_KEY = 'ssa_students_v1';

// Serialise the full STUDENTS array to localStorage
function saveStudentsData() {
  try {
    // Store only the mutable fields (not re-derivable constants)
    var payload = STUDENTS.map(function (s) {
      return {
        id:        s.id,
        nis:       s.nis,
        name:      s.name,
        kelas:     s.kelas,
        grades:    s.grades,
        interests: s.interests,
        answers:   s.answers,
        hasFilledQuestionnaire: s.hasFilledQuestionnaire,
        isCustom:  !!s.isCustom   // flag to distinguish added vs built-in students
      };
    });
    localStorage.setItem(SSA_STUDENTS_KEY, JSON.stringify(payload));
  } catch (e) {}
}

// Restore persisted student data on boot.
// Built-in students: update mutable fields from storage.
// Custom (added by teacher): re-insert if not already present.
function loadStudentsData() {
  try {
    var payload = JSON.parse(localStorage.getItem(SSA_STUDENTS_KEY) || 'null');
    if (!payload) return;

    payload.forEach(function (saved) {
      var existing = getStudentById(saved.id);
      if (existing) {
        // Update every mutable field for built-in students
        existing.nis       = saved.nis;
        existing.name      = saved.name;
        existing.kelas     = saved.kelas;
        existing.grades    = saved.grades;
        existing.interests = saved.interests;
        existing.answers   = saved.answers;
        existing.hasFilledQuestionnaire = saved.hasFilledQuestionnaire;
      } else if (saved.isCustom) {
        // Re-add teacher-created students that don't exist in PROFILES
        STUDENTS.push({
          id:        saved.id,
          nis:       saved.nis,
          name:      saved.name,
          kelas:     saved.kelas,
          grades:    saved.grades,
          interests: saved.interests,
          answers:   saved.answers,
          hasFilledQuestionnaire: saved.hasFilledQuestionnaire,
          isCustom:  true
        });
      }
    });

    // Remove students that were deleted (exist in STUDENTS but not in payload)
    var savedIds = payload.map(function (s) { return String(s.id); });
    for (var i = STUDENTS.length - 1; i >= 0; i--) {
      if (savedIds.indexOf(String(STUDENTS[i].id)) === -1) {
        STUDENTS.splice(i, 1);
      }
    }
  } catch (e) {}
}

// Check if a NIS is already used by another student
function isNisDuplicate(nis, excludeId) {
  return STUDENTS.some(function (s) {
    return s.nis === nis && String(s.id) !== String(excludeId);
  });
}

// Generate a default NIS string from an id  e.g. "2025001"
function generateNis(id) {
  return (SSA_SETTINGS.nisYearPrefix || '2025') + String(id).padStart(3, '0');
}

// Update student ID + NIS atomically (teacher can rename both)
function updateStudentId(oldId, newNis, newName) {
  var s = getStudentById(oldId);
  if (!s) return { ok: false, msg: 'Siswa tidak ditemukan.' };

  var trimNis = (newNis || '').trim();
  if (!trimNis) return { ok: false, msg: 'NIS tidak boleh kosong.' };

  if (isNisDuplicate(trimNis, oldId)) {
    return { ok: false, msg: 'NIS "' + trimNis + '" sudah digunakan oleh siswa lain.' };
  }

  s.nis  = trimNis;
  if (newName) s.name = newName.trim();
  saveStudentsData();
  return { ok: true };
}

/* ---------- Access-scoped helpers ---------- */

// Returns only students the current user is allowed to see.
// Admin: all students. Guru: only students in their allowedClasses.
function getAccessibleStudents() {
  if (!window.SSA || !SSA.auth || !SSA.auth.isLoggedIn()) return STUDENTS;
  if (SSA.auth.isAdmin()) return STUDENTS;
  var ac = (SSA.auth.currentUser && SSA.auth.currentUser.allowedClasses) || [];
  return STUDENTS.filter(function (s) { return ac.indexOf(s.kelas) !== -1; });
}

// Returns the list of classes the current user may see.
// Admin: all classes from STUDENTS. Guru: only their allowedClasses (sorted).
function getAccessibleClasses() {
  if (!window.SSA || !SSA.auth || !SSA.auth.isLoggedIn()) return getAllClasses();
  if (SSA.auth.isAdmin()) return getAllClasses();
  var ac = (SSA.auth.currentUser && SSA.auth.currentUser.allowedClasses) || [];
  return ac.slice().sort();
}

// Lightweight class list — never crashes even with empty grades
function getAllClasses() {
  return Array.from(new Set(STUDENTS.map(function (s) { return s.kelas; }))).sort();
}

// Check if a student has any grade data at all
function hasAnyGrades(student) {
  return SUBJECTS.some(function (subj) {
    return student.grades[subj] && student.grades[subj].length > 0;
  });
}

// Same as getGlobalStats() but scoped to accessible students only.
function getScopedStats() {
  var scoped = getAccessibleStudents();
  if (!scoped.length) {
    return { total:0, overall:0, improving:0, declining:0,
             subjectAvgs:{}, trendByAssessment:[], classes:[] };
  }
  var total    = scoped.length;
  var overall  = round1(avg(scoped.map(function (s) { return overallAverage(s); })));
  var improving = scoped.filter(function (s) {
    return avg(SUBJECTS.map(function (subj) { return subjectTrend(s, subj); })) > 0.3;
  }).length;
  var declining = scoped.filter(function (s) {
    return avg(SUBJECTS.map(function (subj) { return subjectTrend(s, subj); })) < -0.3;
  }).length;
  var subjectAvgs = {};
  SUBJECTS.forEach(function (subj) {
    subjectAvgs[subj] = round1(avg(scoped.map(function (s) { return subjectAverage(s, subj); })));
  });
  var trendByAssessment = ASSESSMENT_SCHEDULE.map(function (_, i) {
    var vals = scoped.map(function (s) {
      return avg(SUBJECTS.map(function (subj) {
        var g = s.grades[subj][i];
        return g ? g.score : 0;
      }));
    });
    return round1(avg(vals));
  });
  var classes = Array.from(new Set(scoped.map(function (s) { return s.kelas; }))).sort();
  return { total:total, overall:overall, improving:improving, declining:declining,
           subjectAvgs:subjectAvgs, trendByAssessment:trendByAssessment, classes:classes };
}

// Add a student with NO grade history — for new school year enrolment.
// Each subject gets an empty array so the app never crashes on missing grades.
function addStudentNoGrades(name, kelas) {
  const id = nextStudentId();
  const grades = {};
  SUBJECTS.forEach(function (subj) { grades[subj] = []; });

  const interests = {};
  INTEREST_CATEGORIES.forEach(function (cat) { interests[cat] = 50; });

  const answers = {};
  QUESTIONNAIRE.forEach(function (q) { answers[q.id] = 3; });

  const student = {
    id: id, nis: generateNis(id), name: name, kelas: kelas,
    grades: grades, interests: interests, answers: answers,
    hasFilledQuestionnaire: false, isCustom: true
  };
  STUDENTS.push(student);
  saveStudentsData();
  return student;
}

/* ---------- CSV import utility ---------- */

// Parse a single CSV line (handles quoted values with embedded delimiters)
function parseCSVLine(line, delimiter) {
  delimiter = delimiter || ',';
  var result = [];
  var current = '';
  var inQuotes = false;
  for (var i = 0; i < line.length; i++) {
    var ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === delimiter && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// Parse full CSV text into array of { nis, nama, kelas } objects
// Auto-detects delimiter: semicolon (Indonesian Excel) or comma
function parseCSV(text) {
  var lines = text.split(/\r?\n/).filter(function (l) { return l.trim(); });
  if (!lines.length) return [];
  // Auto-detect: if first line has semicolons, use semicolons; otherwise commas
  var delimiter = lines[0].indexOf(';') !== -1 && lines[0].indexOf(',') === -1 ? ';' : ',';
  var headers = parseCSVLine(lines[0], delimiter).map(function (h) {
    return h.toLowerCase().trim().replace(/\s+/g, '');
  });
  var rows = [];
  for (var i = 1; i < lines.length; i++) {
    var values = parseCSVLine(lines[i], delimiter);
    var row = {};
    headers.forEach(function (h, j) {
      row[h] = (values[j] || '').trim();
    });
    rows.push(row);
  }
  return rows;
}

// Batch-create students from validated rows.
// Each row: { nis, name, kelas }. All created without grade history.
function importStudents(rows) {
  var added = 0;
  rows.forEach(function (row) {
    var id = nextStudentId();
    var grades = {};
    SUBJECTS.forEach(function (subj) { grades[subj] = []; });

    var interests = {};
    INTEREST_CATEGORIES.forEach(function (cat) { interests[cat] = 50; });

    var answers = {};
    QUESTIONNAIRE.forEach(function (q) { answers[q.id] = 3; });

    STUDENTS.push({
      id: id, nis: row.nis, name: row.name, kelas: row.kelas,
      grades: grades, interests: interests, answers: answers,
      hasFilledQuestionnaire: false, isCustom: true
    });
    added++;
  });
  saveStudentsData();
  return { added: added };
}
