// ==================== СТАТИЧЕСКИЕ ДАННЫЕ ====================

// Турниры (с картинками из папки images)
const tournamentsData = [
  {
    id: 1,
    title: "Dota 2 Battle Cup",
    game: "Dota 2",
    date: "2026-03-15T18:00:00",
    max_participants: 16,
    current_participants: 12,
    status: "soon",
    image_url: "images/dota2.jpeg"
  },
  {
    id: 2,
    title: "CS2 Open Qualifier",
    game: "CS2",
    date: "2026-03-20T15:00:00",
    max_participants: 16,
    current_participants: 8,
    status: "open",
    image_url: "images/cs2.jpg"
  },
  {
    id: 3,
    title: "Valorant Collegiate",
    game: "Valorant",
    date: "2026-03-25T17:30:00",
    max_participants: 16,
    current_participants: 5,
    status: "recruiting",
    image_url: "images/valorant.jpg"
  }
];

// Таблица лидеров
const leaderboardData = [
  { nickname: "DragonSlayer", points: 2450, wins: 12 },
  { nickname: "AimBOT", points: 2320, wins: 10 },
  { nickname: "NoobNoMore", points: 2180, wins: 9 },
  { nickname: "W1nner", points: 2010, wins: 8 }
];

// Награды (БЕЗ КАРТИНОК, только иконки и текст)
const rewardsData = [
  {
    place: 1,
    title: "Чемпион",
    description: "50% призового фонда + эксклюзивный кубок и золотые медали для всей команды"
  },
  {
    place: 2,
    title: "Серебряный призёр",
    description: "30% призового фонда + серебряные медали и ценные призы от спонсоров"
  },
  {
    place: 3,
    title: "Бронзовый призёр",
    description: "20% призового фонда + бронзовые медали и памятные подарки"
  }
];

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

function getStatus(status) {
  const map = { 'soon': 'Скоро', 'open': 'Открыт', 'recruiting': 'Идёт набор', 'finished': 'Завершён' };
  return map[status] || status;
}

// Выбор турнира из карточки (прокрутка к форме)
window.selectTournament = function(id) {
  document.getElementById('tournament-select').value = id;
  document.getElementById('register').scrollIntoView({ behavior: 'smooth' });
};

// ==================== ЗАГРУЗКА ДАННЫХ НА СТРАНИЦУ ====================

function loadTournaments() {
  const container = document.getElementById('tournaments-list');
  const select = document.getElementById('tournament-select');
  container.innerHTML = '';
  select.innerHTML = '<option value="" disabled selected>— выберите —</option>';

  tournamentsData.forEach(t => {
    const date = new Date(t.date).toLocaleString('ru-RU', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
    const free = t.max_participants - t.current_participants;
    const card = document.createElement('div');
    card.className = 'tournament-card';
    card.innerHTML = `
      <img src="${t.image_url}" class="tournament-card__image" alt="${t.title}">
      <div class="tournament-card__badge">${getStatus(t.status)}</div>
      <h3 class="tournament-card__title">${t.title}</h3>
      <p class="tournament-card__date"> ${date}</p>
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

function loadLeaderboard() {
  const tbody = document.getElementById('leaderboard-body');
  tbody.innerHTML = leaderboardData.map((entry, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${entry.nickname}</td>
      <td>${entry.points}</td>
      <td>${entry.wins}</td>
    </tr>
  `).join('');
}

function loadRewards() {
  const container = document.getElementById('rewards-list');
  container.innerHTML = rewardsData.map(reward => {
    // Выбираем иконку в зависимости от места
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

// ==================== ОБРАБОТКА ФОРМЫ РЕГИСТРАЦИИ (ДЕМО) ====================

document.getElementById('registrationForm').addEventListener('submit', (e) => {
  e.preventDefault();
  alert('Регистрация принята (демонстрационный режим, данные не сохраняются).');
  e.target.reset();
});

// ==================== АНИМАЦИЯ ПОЯВЛЕНИЯ ПРИ СКРОЛЛЕ ====================

document.addEventListener('DOMContentLoaded', () => {
  loadTournaments();
  loadLeaderboard();
  loadRewards();

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
});