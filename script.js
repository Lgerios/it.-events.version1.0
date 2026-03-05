const API_BASE_URL = 'http://localhost:3000';

let currentUser = null;

// Получение пользователя из localStorage при загрузке
function loadUserFromStorage() {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
        currentUser = JSON.parse(userData);
        updateUIForAuth();
    }
}

// Сохранение пользователя в localStorage
function saveUserToStorage(user) {
    currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));
    updateUIForAuth();
}

function updateUIForAuth() {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const userGreeting = document.getElementById('userGreeting');
    const logoutBtn = document.getElementById('logoutBtn');
    const adminBtn = document.getElementById('adminBtn');
    const registerSubmit = document.getElementById('register-submit');
    const currentUserNick = document.getElementById('current-user-nickname');

    if (currentUser) {
        loginBtn.style.display = 'none';
        registerBtn.style.display = 'none';
        userGreeting.style.display = 'inline';
        userGreeting.textContent = `Привет, ${currentUser.nickname}!`;
        logoutBtn.style.display = 'inline';
        registerSubmit.disabled = false;
        currentUserNick.textContent = currentUser.nickname;

        if (currentUser.isAdmin) {
            adminBtn.style.display = 'inline';
        } else {
            adminBtn.style.display = 'none';
        }
    } else {
        loginBtn.style.display = 'inline';
        registerBtn.style.display = 'inline';
        userGreeting.style.display = 'none';
        logoutBtn.style.display = 'none';
        adminBtn.style.display = 'none';
        registerSubmit.disabled = true;
        currentUserNick.textContent = 'Войдите, чтобы зарегистрироваться';
    }
}

// Загрузка турниров
async function loadTournaments() {
    const res = await fetch(`${API_BASE_URL}/tournaments`);
    const tournaments = await res.json();
    const container = document.getElementById('tournaments-list');
    const select = document.getElementById('tournament-select');
    container.innerHTML = '';
    select.innerHTML = '<option value="" disabled selected>— выберите —</option>';

    tournaments.forEach(t => {
        const date = new Date(t.date).toLocaleString('ru-RU', {
            day: 'numeric', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
        const free = t.max_participants - t.current_participants;
        const card = document.createElement('div');
        card.className = 'tournament-card';
        card.innerHTML = `
            <img src="${t.image || 'https://via.placeholder.com/300x150/2a2a2a/5682f8?text=Турнир'}" class="tournament-card__image">
            <div class="tournament-card__badge">${getStatus(t.status)}</div>
            <h3 class="tournament-card__title">${t.title}</h3>
            <p class="tournament-card__date">📅 ${date}</p>
            <p class="tournament-card__participants">👥 Участники: ${t.current_participants}/${t.max_participants} <span class="free-slots">(${free} мест)</span></p>
            <button class="button button--primary" onclick="selectTournament(${t.id})">Записаться</button>
        `;
        container.appendChild(card);

        const option = document.createElement('option');
        option.value = t.id;
        option.textContent = t.title;
        select.appendChild(option);
    });
}

function getStatus(status) {
    const map = { 'soon': 'Скоро', 'open': 'Открыт', 'recruiting': 'Идёт набор', 'finished': 'Завершён' };
    return map[status] || status;
}

window.selectTournament = function(id) {
    document.getElementById('tournament-select').value = id;
    document.getElementById('register').scrollIntoView({ behavior: 'smooth' });
};

// Загрузка лидеров
async function loadLeaderboard() {
    const res = await fetch(`${API_BASE_URL}/users`);
    const users = await res.json();
    const sorted = users.filter(u => !u.isAdmin).sort((a, b) => b.points - a.points || b.wins - a.wins);
    const tbody = document.getElementById('leaderboard-body');
    tbody.innerHTML = sorted.map((u, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${u.nickname}</td>
            <td>${u.points}</td>
            <td>${u.wins}</td>
        </tr>
    `).join('');
}

// Загрузка наград
async function loadRewards() {
    const res = await fetch(`${API_BASE_URL}/rewards`);
    const rewards = await res.json();
    const container = document.getElementById('rewards-list');
    container.innerHTML = rewards.map(r => `
        <div class="reward-card">
            <div class="reward-card__icon">${r.icon}</div>
            <h3 class="reward-card__title">${r.title}</h3>
            <p class="reward-card__desc">${r.description}</p>
        </div>
    `).join('');
}

// Регистрация на турнир
document.getElementById('registrationForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) {
        alert('Сначала войдите в систему');
        return;
    }
    const tournamentId = parseInt(document.getElementById('tournament-select').value);
    if (!tournamentId) {
        alert('Выберите турнир');
        return;
    }

    const participantsRes = await fetch(`${API_BASE_URL}/participants?tournamentId=${tournamentId}&userId=${currentUser.id}`);
    const existing = await participantsRes.json();
    if (existing.length > 0) {
        alert('Вы уже зарегистрированы на этот турнир');
        return;
    }

    const tourRes = await fetch(`${API_BASE_URL}/tournaments/${tournamentId}`);
    const tournament = await tourRes.json();
    if (tournament.current_participants >= tournament.max_participants) {
        alert('Нет свободных мест');
        return;
    }

    await fetch(`${API_BASE_URL}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            tournamentId,
            userId: currentUser.id,
            registeredAt: new Date().toISOString()
        })
    });

    await fetch(`${API_BASE_URL}/tournaments/${tournamentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            current_participants: tournament.current_participants + 1
        })
    });

    const newPoints = currentUser.points + 50;
    await fetch(`${API_BASE_URL}/users/${currentUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points: newPoints })
    });

    currentUser.points = newPoints;
    saveUserToStorage(currentUser);

    alert('Регистрация успешна!');
    loadTournaments();
    loadLeaderboard();
});

// Логин
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    const res = await fetch(`${API_BASE_URL}/users?username=${username}&password=${password}`);
    const users = await res.json();
    if (users.length > 0) {
        saveUserToStorage(users[0]);
        document.getElementById('loginModal').style.display = 'none';
        loadLeaderboard();
    } else {
        alert('Неверное имя или пароль');
    }
});

// Регистрация нового пользователя
document.getElementById('registerUserForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('regUsername').value;
    const nickname = document.getElementById('regNickname').value;
    const password = document.getElementById('regPassword').value;

    const check = await fetch(`${API_BASE_URL}/users?username=${username}`);
    const existing = await check.json();
    if (existing.length > 0) {
        alert('Пользователь с таким именем уже существует');
        return;
    }

    const newUser = {
        username,
        nickname,
        password,
        isAdmin: false,
        points: 0,
        wins: 0
    };

    const res = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
    });

    if (res.ok) {
        const user = await res.json();
        saveUserToStorage(user);
        document.getElementById('registerModal').style.display = 'none';
        loadLeaderboard();
    } else {
        alert('Ошибка регистрации');
    }
});

// Выход
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('currentUser');
    currentUser = null;
    updateUIForAuth();
    loadLeaderboard();
});

// Переход в админку
document.getElementById('adminBtn').addEventListener('click', () => {
    window.location.href = 'admin.html';
});

// Модальные окна
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const closeButtons = document.querySelectorAll('.close');

loginBtn.onclick = () => loginModal.style.display = 'block';
registerBtn.onclick = () => registerModal.style.display = 'block';
closeButtons.forEach(btn => btn.onclick = function() {
    loginModal.style.display = 'none';
    registerModal.style.display = 'none';
});
window.onclick = (event) => {
    if (event.target == loginModal) loginModal.style.display = 'none';
    if (event.target == registerModal) registerModal.style.display = 'none';
};

// Анимация появления
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
        }
    });
}, { threshold: 0.1 });

document.addEventListener('DOMContentLoaded', () => {
    loadUserFromStorage();
    loadTournaments();
    loadLeaderboard();
    loadRewards();
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
});