// ==================== ДАННЫЕ ТУРНИРОВ ====================
let tournaments = [];

function loadTournamentsFromStorage() {
  const stored = localStorage.getItem('tournaments');
  if (stored) {
    try {
      tournaments = JSON.parse(stored);
      if (!Array.isArray(tournaments)) tournaments = [];
      else {
        tournaments = tournaments.map(t => ({
          id: t.id,
          title: t.title || 'Без названия',
          game: t.game || 'Не указана',
          date: t.date || new Date().toISOString().slice(0, 16),
          max_participants: t.max_participants || 16,
          status: t.status || 'soon',
          image_url: t.image_url || 'images/default.jpg'
        }));
      }
    } catch (e) {
      tournaments = [];
    }
  }
  if (tournaments.length === 0) {
    setDefaultTournaments();
  }
  saveTournaments();
}

function setDefaultTournaments() {
  tournaments = [
    {
      id: 1,
      title: "Dota 2 Battle Cup",
      game: "Dota 2",
      date: "2026-03-15T18:00",
      max_participants: 16,
      status: "soon",
      image_url: "images/dota2.jpeg"
    },
    {
      id: 2,
      title: "CS2 Open Qualifier",
      game: "CS2",
      date: "2026-03-20T15:00",
      max_participants: 16,
      status: "open",
      image_url: "images/cs2.jpg"
    },
    {
      id: 3,
      title: "Valorant Collegiate",
      game: "Valorant",
      date: "2026-03-25T17:30",
      max_participants: 16,
      status: "recruiting",
      image_url: "images/valorant.jpg"
    }
  ];
}

function saveTournaments() {
  localStorage.setItem('tournaments', JSON.stringify(tournaments));
}

// ==================== БАЗА ДАННЫХ УЧАСТНИКОВ ====================
let participants = [];

function loadParticipants() {
  const stored = localStorage.getItem('participants');
  if (stored) {
    try {
      participants = JSON.parse(stored);
      if (!Array.isArray(participants)) participants = [];
    } catch (e) {
      participants = [];
    }
  }
  
  // Если участников нет, создаём начальные данные
  if (participants.length === 0) {
    participants = [
      { id: 1, tournamentId: 1, nickname: "DragonSlayer", email: "dragon@example.com", team_name: "Dragons", role: "user" },
      { id: 2, tournamentId: 1, nickname: "Phoenix", email: "phoenix@example.com", team_name: "", role: "user" },
      { id: 3, tournamentId: null, nickname: "Admin", email: "polukarovana2@gmail.com", team_name: "", role: "admin", password: "admin123" }
    ];
    saveParticipants();
  } else {
    // Если участники есть, проверяем наличие администратора
    const adminExists = participants.some(p => p.role === 'admin');
    if (!adminExists) {
      const newId = participants.length > 0 ? Math.max(...participants.map(p => p.id)) + 1 : 1;
      participants.push({
        id: newId,
        tournamentId: null,
        nickname: "Admin",
        email: "polukarovana2@gmail.com",
        team_name: "",
        role: "admin",
        password: "admin123"
      });
      saveParticipants();
      console.log('Администратор добавлен в существующий список участников.');
    }
  }
}

function saveParticipants() {
  localStorage.setItem('participants', JSON.stringify(participants));
}

// ==================== АВТОРИЗАЦИЯ ====================
let currentUser = null;

function login(email, password) {
  const userRecord = participants.find(p => p.email === email);
  if (!userRecord) return false;

  // Если у пользователя есть пароль – проверяем его
  if (userRecord.password && userRecord.password !== password) {
    return false;
  }

  currentUser = {
    email: userRecord.email,
    nickname: userRecord.nickname,
    role: userRecord.role || 'user'
  };
  localStorage.setItem('currentUser', JSON.stringify(currentUser));
  updateAuthUI();
  toggleAdminPanel();
  return true;
}

function logout() {
  currentUser = null;
  localStorage.removeItem('currentUser');
  updateAuthUI();
  toggleAdminPanel();
}

function loadCurrentUser() {
  const stored = localStorage.getItem('currentUser');
  if (stored) {
    try {
      currentUser = JSON.parse(stored);
      if (!participants.some(p => p.email === currentUser.email)) {
        currentUser = null;
        localStorage.removeItem('currentUser');
      }
    } catch (e) {
      currentUser = null;
    }
  }
  updateAuthUI();
  toggleAdminPanel();
}

function updateAuthUI() {
  const loggedOutDiv = document.getElementById('loggedOut');
  const loggedInDiv = document.getElementById('loggedIn');
  const greetingSpan = document.getElementById('greeting');
  const adminLink = document.getElementById('adminLink');

  if (currentUser) {
    loggedOutDiv.style.display = 'none';
    loggedInDiv.style.display = 'flex';
    const roleSuffix = currentUser.role === 'admin' ? ' (админ)' : '';
    greetingSpan.textContent = `Привет, ${currentUser.nickname}${roleSuffix}!`;
    adminLink.style.display = currentUser.role === 'admin' ? 'inline-block' : 'none';
  } else {
    loggedOutDiv.style.display = 'flex';
    loggedInDiv.style.display = 'none';
    adminLink.style.display = 'none';
  }
}

function toggleAdminPanel() {
  const adminPanel = document.getElementById('admin-panel');
  if (adminPanel) {
    adminPanel.style.display = (currentUser && currentUser.role === 'admin') ? 'block' : 'none';
    if (currentUser && currentUser.role === 'admin') {
      renderAdminTournaments();
    }
  }
}

// ==================== ТУРНИРЫ ====================
function getCurrentParticipants(tournamentId) {
  return participants.filter(p => p.tournamentId === tournamentId).length;
}

function getTournamentsWithCounts() {
  return tournaments.map(t => ({
    ...t,
    current_participants: getCurrentParticipants(t.id)
  }));
}

function getStatus(status) {
  const map = { 'soon': 'Скоро', 'open': 'Открыт', 'recruiting': 'Идёт набор', 'finished': 'Завершён' };
  return map[status] || status;
}

window.selectTournament = function(id) {
  const select = document.getElementById('tournament-select');
  if (select) {
    select.value = id;
    document.getElementById('register').scrollIntoView({ behavior: 'smooth' });
  }
};

function formatDate(dateString) {
  if (!dateString) return 'Дата не указана';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Дата не указана';
  return date.toLocaleString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function loadTournaments() {
  const container = document.getElementById('tournaments-list');
  const select = document.getElementById('tournament-select');
  if (!container || !select) return;

  container.innerHTML = '';
  select.innerHTML = '<option value="" disabled selected>— выберите —</option>';

  const tournamentsWithCounts = getTournamentsWithCounts();

  tournamentsWithCounts.forEach(t => {
    const dateStr = formatDate(t.date);
    const free = t.max_participants - t.current_participants;

    const card = document.createElement('div');
    card.className = 'tournament-card';
    card.innerHTML = `
      <img src="${t.image_url}" class="tournament-card__image" alt="${t.title}" onerror="this.src='images/default.jpg'">
      <div class="tournament-card__badge">${getStatus(t.status)}</div>
      <h3 class="tournament-card__title">${t.title}</h3>
      <p class="tournament-card__date"> ${dateStr}</p>
      <p class="tournament-card__participants"> Участники: ${t.current_participants}/${t.max_participants} <span class="free-slots">(${free} мест)</span></p>
      <button class="button button--primary" onclick="selectTournament(${t.id})">Записаться</button>
    `;
    container.appendChild(card);

    const option = document.createElement('option');
    option.value = t.id;
    option.textContent = t.title;
    select.appendChild(option);
  });
}

// ==================== ЛИДЕРЫ И НАГРАДЫ ====================
const leaderboardData = [
  { nickname: "DragonSlayer", points: 2450, wins: 12 },
  { nickname: "AimBOT", points: 2320, wins: 10 },
  { nickname: "NoobNoMore", points: 2180, wins: 9 },
  { nickname: "W1nner", points: 2010, wins: 8 }
];

function loadLeaderboard() {
  const tbody = document.getElementById('leaderboard-body');
  if (!tbody) return;
  tbody.innerHTML = leaderboardData.map((entry, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${entry.nickname}</td>
      <td>${entry.points}</td>
      <td>${entry.wins}</td>
    </tr>
  `).join('');
}

const rewardsData = [
  { place: 1, title: "Чемпион", description: "50% призового фонда + эксклюзивный кубок и золотые медали для всей команды" },
  { place: 2, title: "Серебряный призёр", description: "30% призового фонда + серебряные медали и ценные призы от спонсоров" },
  { place: 3, title: "Бронзовый призёр", description: "20% призового фонда + бронзовые медали и памятные подарки" }
];

function loadRewards() {
  const container = document.getElementById('rewards-list');
  if (!container) return;
  container.innerHTML = rewardsData.map(reward => {
    let icon, gradientClass;
    if (reward.place === 1) {
      icon = '🥇';
      gradientClass = 'reward-gold';
    } else if (reward.place === 2) {
      icon = '🥈';
      gradientClass = 'reward-silver';
    } else {
      icon = '🥉';
      gradientClass = 'reward-bronze';
    }
    return `
      <div class="reward-card ${gradientClass}">
        <div class="reward-card__icon">${icon}</div>
        <h3 class="reward-card__title">${reward.title}</h3>
        <p class="reward-card__desc">${reward.description}</p>
      </div>
    `;
  }).join('');
}

// ==================== РЕГИСТРАЦИЯ ====================
const registrationForm = document.getElementById('registrationForm');
if (registrationForm) {
  registrationForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const nickname = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const team = document.getElementById('team').value.trim();
    const tournamentId = parseInt(document.getElementById('tournament-select').value);

    if (!nickname || !email || !tournamentId) {
      alert('Пожалуйста, заполните все обязательные поля.');
      return;
    }

    const tournament = tournaments.find(t => t.id === tournamentId);
    if (!tournament) {
      alert('Выбранный турнир не существует.');
      return;
    }

    const existing = participants.find(p => p.email === email && p.tournamentId === tournamentId);
    if (existing) {
      alert('Вы уже зарегистрированы на этот турнир!');
      return;
    }

    const currentCount = getCurrentParticipants(tournamentId);
    if (currentCount >= tournament.max_participants) {
      alert('Извините, в этом турнире больше нет свободных мест.');
      return;
    }

    const newParticipant = {
      id: participants.length > 0 ? Math.max(...participants.map(p => p.id)) + 1 : 1,
      tournamentId: tournamentId,
      nickname: nickname,
      email: email,
      team_name: team || '',
      role: 'user'
    };

    participants.push(newParticipant);
    saveParticipants();

    if (!currentUser) {
      login(email, ''); // авто-вход без пароля для нового пользователя
    }

    loadTournaments();
    if (currentUser && currentUser.role === 'admin') renderAdminTournaments();

    alert(`Спасибо, ${nickname}! Вы успешно зарегистрированы на турнир "${tournament.title}".`);
    e.target.reset();
  });
}

// ==================== АДМИН-ПАНЕЛЬ ====================
function renderAdminTournaments() {
  const container = document.getElementById('admin-tournaments-list');
  if (!container) return;
  container.innerHTML = '';

  tournaments.forEach(t => {
    const card = document.createElement('div');
    card.className = 'tournament-card admin-card';
    card.style.marginBottom = '1rem';
    card.innerHTML = `
      <div style="padding: 1rem;">
        <h4>${t.title} (ID: ${t.id})</h4>
        <p>Игра: ${t.game}</p>
        <p>Дата: ${formatDate(t.date)}</p>
        <p>Участников: ${getCurrentParticipants(t.id)}/${t.max_participants}</p>
        <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
          <button class="button button--small" onclick="editTournament(${t.id})">Редактировать</button>
          <button class="button button--small" onclick="deleteTournament(${t.id})">Удалить</button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

// Добавление турнира
const addTournamentForm = document.getElementById('addTournamentForm');
if (addTournamentForm) {
  addTournamentForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = document.getElementById('addTitle').value.trim();
    const game = document.getElementById('addGame').value.trim();
    const date = document.getElementById('addDate').value;
    const max = parseInt(document.getElementById('addMax').value);
    const status = document.getElementById('addStatus').value;
    const image = document.getElementById('addImage').value.trim();

    if (!title || !game || !date || !max || !image) {
      alert('Заполните все поля');
      return;
    }

    const newId = tournaments.length > 0 ? Math.max(...tournaments.map(t => t.id)) + 1 : 1;
    const newTournament = {
      id: newId,
      title: title,
      game: game,
      date: date,
      max_participants: max,
      status: status,
      image_url: image
    };

    tournaments.push(newTournament);
    saveTournaments();
    loadTournaments();
    renderAdminTournaments();
    e.target.reset();
    alert('Турнир добавлен!');
  });
}

// Редактирование турнира
window.editTournament = function(id) {
  const tournament = tournaments.find(t => t.id === id);
  if (!tournament) return;

  document.getElementById('editId').value = tournament.id;
  document.getElementById('editTitle').value = tournament.title;
  document.getElementById('editGame').value = tournament.game;
  let dateStr = tournament.date;
  if (dateStr && dateStr.includes('T')) {
    dateStr = dateStr.slice(0, 16);
  } else {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      dateStr = `${year}-${month}-${day}T${hours}:${minutes}`;
    }
  }
  document.getElementById('editDate').value = dateStr || '';
  document.getElementById('editMax').value = tournament.max_participants;
  document.getElementById('editStatus').value = tournament.status;
  document.getElementById('editImage').value = tournament.image_url;

  openEditModal();
};

function openEditModal() {
  const modal = document.getElementById('editTournamentModal');
  if (modal) modal.classList.add('show');
}

function closeEditModal() {
  const modal = document.getElementById('editTournamentModal');
  if (modal) modal.classList.remove('show');
}

const editTournamentForm = document.getElementById('editTournamentForm');
if (editTournamentForm) {
  editTournamentForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const id = parseInt(document.getElementById('editId').value);
    const tournament = tournaments.find(t => t.id === id);
    if (!tournament) return;

    tournament.title = document.getElementById('editTitle').value.trim();
    tournament.game = document.getElementById('editGame').value.trim();
    tournament.date = document.getElementById('editDate').value;
    tournament.max_participants = parseInt(document.getElementById('editMax').value);
    tournament.status = document.getElementById('editStatus').value;
    tournament.image_url = document.getElementById('editImage').value.trim();

    saveTournaments();
    loadTournaments();
    renderAdminTournaments();
    closeEditModal();
    alert('Турнир обновлён!');
  });
}

// Удаление турнира
window.deleteTournament = function(id) {
  if (!confirm('Вы уверены, что хотите удалить этот турнир? Все связанные участники также будут удалены.')) return;

  participants = participants.filter(p => p.tournamentId !== id);
  saveParticipants();

  tournaments = tournaments.filter(t => t.id !== id);
  saveTournaments();

  loadTournaments();
  renderAdminTournaments();
};

const editModalClose = document.getElementById('editModalClose');
const editModalOverlay = document.getElementById('editModalOverlay');
if (editModalClose) editModalClose.addEventListener('click', closeEditModal);
if (editModalOverlay) editModalOverlay.addEventListener('click', closeEditModal);

// ==================== МОДАЛЬНОЕ ОКНО ВХОДА ====================
const modal = document.getElementById('loginModal');
const modalOverlay = document.getElementById('modalOverlay');
const modalClose = document.getElementById('modalClose');
const modalLoginForm = document.getElementById('modalLoginForm');
const modalRegisterLink = document.getElementById('modalRegisterLink');

function openModal() {
  if (modal) {
    modal.classList.add('show');
    document.getElementById('modalEmail').value = '';
    document.getElementById('modalPassword').value = '';
  }
}

function closeModal() {
  if (modal) modal.classList.remove('show');
}

const loginBtn = document.getElementById('loginBtn');
if (loginBtn) loginBtn.addEventListener('click', openModal);
if (modalClose) modalClose.addEventListener('click', closeModal);
if (modalOverlay) modalOverlay.addEventListener('click', closeModal);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modal && modal.classList.contains('show')) closeModal();
});

if (modalLoginForm) {
  modalLoginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('modalEmail').value.trim();
    const password = document.getElementById('modalPassword').value;
    if (!email) {
      alert('Введите email');
      return;
    }
    if (!password) {
      alert('Введите пароль');
      return;
    }
    if (login(email, password)) {
      closeModal();
    } else {
      alert('Неверный email или пароль.');
    }
  });
}

if (modalRegisterLink) {
  modalRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    closeModal();
    document.getElementById('register').scrollIntoView({ behavior: 'smooth' });
  });
}

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
document.addEventListener('DOMContentLoaded', () => {
  loadTournamentsFromStorage();
  loadParticipants();      // теперь всегда гарантирует наличие админа
  loadCurrentUser();
  loadTournaments();
  loadLeaderboard();
  loadRewards();

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', logout);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
});