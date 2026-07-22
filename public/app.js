// Taskify Client Application Logic - Abdul Kader Workspace v2.0

// State management
let state = {
  todos: [],
  filter: 'all', // 'all', 'active', 'completed'
  search: '',
  sortBy: 'date-desc',
  view: 'list', // 'list' or 'kanban'
  loading: false
};

// Elements
const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const priorityRadios = document.getElementsByName('priority');
const categorySelect = document.getElementById('category-select');
const dueDateInput = document.getElementById('due-date');
const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');
const filterTabs = document.querySelectorAll('.filter-tab');
const todosList = document.getElementById('todos-list');
const kanbanBoard = document.getElementById('kanban-board');
const loadingSpinner = document.getElementById('loading-spinner');
const emptyState = document.getElementById('empty-state');
const themeToggle = document.getElementById('theme-toggle');

// View Switcher Buttons
const viewListBtn = document.getElementById('view-list-btn');
const viewKanbanBtn = document.getElementById('view-kanban-btn');

// AI Parser Elements
const aiParserPreview = document.getElementById('ai-parser-preview');
const aiTagDate = document.getElementById('ai-tag-date');
const aiTagPrio = document.getElementById('ai-tag-prio');
const aiTagCat = document.getElementById('ai-tag-cat');

// Dashboard Elements
const statsTotal = document.getElementById('stats-total');
const statsCompleted = document.getElementById('stats-completed');
const statsPending = document.getElementById('stats-pending');
const statsRatio = document.getElementById('stats-ratio');
const statsProgressFill = document.getElementById('stats-progress-fill');

// Init application
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  updateSoundToggleUI();
  updateStreakAndLevelDisplay();
  fetchTodos();
  setupEventListeners();
});

// Theme Logic
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
}

// AI Smart Quick-Parser
function parseSmartInput(text) {
  let detectedDate = null;
  let detectedPrio = null;
  let detectedCat = null;
  let cleanText = text;

  const lower = text.toLowerCase();

  // 1. Date Detection
  if (lower.includes('today')) {
    detectedDate = new Date().toISOString().split('T')[0];
  } else if (lower.includes('tomorrow')) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    detectedDate = tomorrow.toISOString().split('T')[0];
  } else if (lower.includes('next week')) {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    detectedDate = nextWeek.toISOString().split('T')[0];
  }

  // 2. Priority Detection
  if (lower.includes('high priority') || lower.includes('urgent') || lower.includes('prio:high') || lower.includes('🔥')) {
    detectedPrio = 'high';
  } else if (lower.includes('low priority') || lower.includes('prio:low') || lower.includes('🌱')) {
    detectedPrio = 'low';
  } else if (lower.includes('medium priority') || lower.includes('prio:medium')) {
    detectedPrio = 'medium';
  }

  // 3. Category Detection
  if (lower.includes('work') || lower.includes('meeting') || lower.includes('email') || lower.includes('client') || lower.includes('project')) {
    detectedCat = 'Work';
  } else if (lower.includes('buy') || lower.includes('shop') || lower.includes('groceries') || lower.includes('store') || lower.includes('milk')) {
    detectedCat = 'Shopping';
  } else if (lower.includes('pay') || lower.includes('bank') || lower.includes('money') || lower.includes('bill') || lower.includes('salary')) {
    detectedCat = 'Finance';
  } else if (lower.includes('gym') || lower.includes('workout') || lower.includes('health') || lower.includes('doctor') || lower.includes('meditation')) {
    detectedCat = 'Wellness';
  } else if (lower.includes('home') || lower.includes('clean') || lower.includes('family') || lower.includes('personal')) {
    detectedCat = 'Personal';
  }

  return { cleanText, detectedDate, detectedPrio, detectedCat };
}

// Event Listeners
function setupEventListeners() {
  themeToggle.addEventListener('click', toggleTheme);
  
  if (soundToggle) {
    soundToggle.addEventListener('click', () => {
      state.soundEnabled = !state.soundEnabled;
      localStorage.setItem('sound_enabled', state.soundEnabled.toString());
      updateSoundToggleUI();
    });
  }

  todoForm.addEventListener('submit', handleAddTodo);

  // View Switcher
  viewListBtn.addEventListener('click', () => {
    state.view = 'list';
    viewListBtn.classList.add('active');
    viewKanbanBtn.classList.remove('active');
    renderTodos();
  });

  viewKanbanBtn.addEventListener('click', () => {
    state.view = 'kanban';
    viewKanbanBtn.classList.add('active');
    viewListBtn.classList.remove('active');
    renderTodos();
  });

  // AI Parser Input Listener
  todoInput.addEventListener('input', (e) => {
    const val = e.target.value;
    if (!val.trim()) {
      aiParserPreview.classList.add('hidden');
      return;
    }

    const { detectedDate, detectedPrio, detectedCat } = parseSmartInput(val);
    let hasDetections = false;

    if (detectedDate) {
      aiTagDate.querySelector('.val').textContent = detectedDate;
      aiTagDate.classList.remove('hidden');
      dueDateInput.value = detectedDate;
      hasDetections = true;
    } else {
      aiTagDate.classList.add('hidden');
    }

    if (detectedPrio) {
      aiTagPrio.querySelector('.val').textContent = detectedPrio.toUpperCase();
      aiTagPrio.classList.remove('hidden');
      const radio = document.getElementById(`prio-${detectedPrio}`);
      if (radio) radio.checked = true;
      hasDetections = true;
    } else {
      aiTagPrio.classList.add('hidden');
    }

    if (detectedCat) {
      aiTagCat.querySelector('.val').textContent = detectedCat;
      aiTagCat.classList.remove('hidden');
      categorySelect.value = detectedCat;
      hasDetections = true;
    } else {
      aiTagCat.classList.add('hidden');
    }

    if (hasDetections) {
      aiParserPreview.classList.remove('hidden');
      safeCreateIcons();
    } else {
      aiParserPreview.classList.add('hidden');
    }
  });

  // Filters
  filterTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      filterTabs.forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
      state.filter = e.target.dataset.filter;
      renderTodos();
    });
  });

  // Search
  searchInput.addEventListener('input', (e) => {
    state.search = e.target.value.toLowerCase();
    renderTodos();
  });

  // Sort
  sortSelect.addEventListener('change', (e) => {
    state.sortBy = e.target.value;
    renderTodos();
  });

  // Kanban Drag & Drop Column Setup
  setupKanbanDragAndDrop();
}

// LocalStorage Fallback Helpers
function getStoredTodos() {
  try { return JSON.parse(localStorage.getItem('taskify_todos') || '[]'); }
  catch (e) { return []; }
}
function setStoredTodos(todos) {
  try { localStorage.setItem('taskify_todos', JSON.stringify(todos)); }
  catch (e) {}
}

// Sound & Gamification State
state.soundEnabled = localStorage.getItem('sound_enabled') !== 'false';

// Sound Toggle Element
const soundToggle = document.getElementById('sound-toggle');
const soundOnIcon = document.querySelector('.sound-on-icon');
const soundOffIcon = document.querySelector('.sound-off-icon');

function updateSoundToggleUI() {
  if (!soundToggle || !soundOnIcon || !soundOffIcon) return;
  if (state.soundEnabled) {
    soundOnIcon.classList.remove('hidden');
    soundOffIcon.classList.add('hidden');
  } else {
    soundOnIcon.classList.add('hidden');
    soundOffIcon.classList.remove('hidden');
  }
}

// Sound & Confetti Celebrations
function triggerCompletionCelebration(cardElement) {
  // 1. Confetti Explosion
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.65 },
      colors: ['#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']
    });
  }

  // 2. Web Audio Synthesizer Triad Chord (C5 -> E5 -> G5)
  if (state.soundEnabled) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const now = ctx.currentTime;
        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          gain.gain.setValueAtTime(0.12, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.25);
        });
      }
    } catch (e) {}
  }

  // 3. Floating XP Popup Animation on card element
  if (cardElement) {
    const xp = document.createElement('div');
    xp.className = 'xp-popup';
    xp.textContent = '+50 XP ✨';
    cardElement.appendChild(xp);
    setTimeout(() => xp.remove(), 1200);
  }

  // Record completed task timestamp for streak
  recordCompletionForStreak();
}

// Streak & Level System
function recordCompletionForStreak() {
  const todayStr = new Date().toISOString().split('T')[0];
  const lastDateStr = localStorage.getItem('last_completion_date');
  let currentStreak = parseInt(localStorage.getItem('user_streak') || '1', 10);

  if (!lastDateStr) {
    currentStreak = 1;
  } else if (lastDateStr !== todayStr) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (lastDateStr === yesterdayStr) {
      currentStreak += 1;
    } else {
      currentStreak = 1; // Streak reset if missed a day
    }
  }

  localStorage.setItem('last_completion_date', todayStr);
  localStorage.setItem('user_streak', currentStreak.toString());
  updateStreakAndLevelDisplay();
}

function updateStreakAndLevelDisplay() {
  const streakEl = document.getElementById('stats-streak');
  const levelEl = document.getElementById('stats-level');
  if (!streakEl || !levelEl) return;

  const streak = parseInt(localStorage.getItem('user_streak') || '1', 10);
  const completedCount = state.todos.filter(t => t.completed).length;

  streakEl.textContent = streak;

  // Calculate Productivity Title Level
  let levelTitle = 'Novice Achiever';
  if (completedCount >= 30 || streak >= 14) levelTitle = '👑 Workforce Legend';
  else if (completedCount >= 15 || streak >= 7) levelTitle = '🔥 Task Master';
  else if (completedCount >= 5 || streak >= 3) levelTitle = '⚡ Productivity Pro';

  levelEl.textContent = levelTitle;
}

// API Communication
async function fetchTodos() {
  showLoading(true);
  try {
    const res = await fetch('/api/todos');
    if (!res.ok) throw new Error('API server unavailable');
    state.todos = await res.json();
    setStoredTodos(state.todos);
    renderTodos();
  } catch (error) {
    state.todos = getStoredTodos();
    renderTodos();
  } finally {
    showLoading(false);
  }
}

async function handleAddTodo(e) {
  e.preventDefault();
  const rawText = todoInput.value.trim();
  if (!rawText) return;

  const { cleanText, detectedDate, detectedPrio, detectedCat } = parseSmartInput(rawText);

  let priority = detectedPrio || 'medium';
  if (!detectedPrio) {
    for (const radio of priorityRadios) {
      if (radio.checked) {
        priority = radio.value;
        break;
      }
    }
  }

  const category = detectedCat || categorySelect.value;
  const dueDate = detectedDate || dueDateInput.value || null;

  const newTodo = {
    id: Date.now().toString(36) + Math.random().toString(36).substring(2, 7),
    text: cleanText,
    priority,
    category,
    dueDate,
    status: 'todo',
    subtasks: [],
    completed: false,
    createdAt: new Date().toISOString()
  };

  try {
    const res = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTodo)
    });
    if (res.ok) {
      const addedTodo = await res.json();
      state.todos.unshift(addedTodo);
    } else {
      state.todos.unshift(newTodo);
    }
  } catch (error) {
    state.todos.unshift(newTodo);
  }

  setStoredTodos(state.todos);
  todoInput.value = '';
  dueDateInput.value = '';
  aiParserPreview.classList.add('hidden');
  document.getElementById('prio-medium').checked = true;
  categorySelect.selectedIndex = 0;
  renderTodos();
}

async function toggleTodoComplete(id, completed, cardElement) {
  const todo = state.todos.find(t => t.id === id);
  if (!todo) return;

  todo.completed = completed;
  todo.status = completed ? 'completed' : 'todo';
  setStoredTodos(state.todos);

  if (completed) {
    triggerCompletionCelebration(cardElement);
  }

  renderTodos();

  try {
    await fetch(`/api/todos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...todo, completed, status: todo.status })
    });
  } catch (error) {}
}

async function updateTodoStatus(id, newStatus, cardElement) {
  const todo = state.todos.find(t => t.id === id);
  if (!todo) return;

  todo.status = newStatus;
  todo.completed = (newStatus === 'completed');
  setStoredTodos(state.todos);

  if (newStatus === 'completed') {
    triggerCompletionCelebration(cardElement);
  }

  renderTodos();

  try {
    await fetch(`/api/todos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...todo, status: newStatus, completed: todo.completed })
    });
  } catch (error) {}
}

async function updateTodoText(id, text) {
  const todo = state.todos.find(t => t.id === id);
  if (!todo || todo.text === text) return;
  todo.text = text;
  setStoredTodos(state.todos);
  renderTodos();

  try {
    await fetch(`/api/todos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...todo, text })
    });
  } catch (error) {}
}

async function deleteTodo(id, itemElement) {
  if (itemElement) {
    itemElement.style.transform = 'translateX(50px) scale(0.9)';
    itemElement.style.opacity = '0';
  }
  
  setTimeout(async () => {
    state.todos = state.todos.filter(t => t.id !== id);
    setStoredTodos(state.todos);
    renderTodos();

    try {
      await fetch(`/api/todos/${id}`, { method: 'DELETE' });
    } catch (error) {}
  }, 250);
}

// Subtasks Methods
function addSubtask(todoId, text) {
  const todo = state.todos.find(t => t.id === todoId);
  if (!todo) return;
  if (!Array.isArray(todo.subtasks)) todo.subtasks = [];

  const subtask = {
    id: Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
    text: text.trim(),
    completed: false
  };

  todo.subtasks.push(subtask);
  setStoredTodos(state.todos);
  renderTodos();

  try {
    fetch(`/api/todos/${todoId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(todo)
    });
  } catch (e) {}
}

function toggleSubtask(todoId, subtaskId, completed) {
  const todo = state.todos.find(t => t.id === todoId);
  if (!todo || !Array.isArray(todo.subtasks)) return;

  const sub = todo.subtasks.find(s => s.id === subtaskId);
  if (sub) {
    sub.completed = completed;
    setStoredTodos(state.todos);
    renderTodos();

    try {
      fetch(`/api/todos/${todoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(todo)
      });
    } catch (e) {}
  }
}

function deleteSubtask(todoId, subtaskId) {
  const todo = state.todos.find(t => t.id === todoId);
  if (!todo || !Array.isArray(todo.subtasks)) return;

  todo.subtasks = todo.subtasks.filter(s => s.id !== subtaskId);
  setStoredTodos(state.todos);
  renderTodos();

  try {
    fetch(`/api/todos/${todoId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(todo)
    });
  } catch (e) {}
}

// UI Rendering Logic
function showLoading(isLoading) {
  state.loading = isLoading;
  if (isLoading) {
    loadingSpinner.classList.remove('hidden');
    todosList.classList.add('hidden');
    kanbanBoard.classList.add('hidden');
    emptyState.classList.add('hidden');
  } else {
    loadingSpinner.classList.add('hidden');
  }
}

function updateDashboard() {
  const total = state.todos.length;
  const completed = state.todos.filter(t => t.completed).length;
  const pending = total - completed;
  const ratio = total > 0 ? Math.round((completed / total) * 100) : 0;

  if (statsTotal) statsTotal.textContent = total;
  if (statsCompleted) statsCompleted.textContent = completed;
  if (statsPending) statsPending.textContent = pending;
  if (statsRatio) statsRatio.textContent = `${ratio}%`;
  if (statsProgressFill) statsProgressFill.style.width = `${ratio}%`;

  updateStreakAndLevelDisplay();
}

function renderTodos() {
  updateDashboard();

  // 1. Filter
  let filtered = state.todos.filter(todo => {
    const matchesSearch = todo.text.toLowerCase().includes(state.search);
    if (state.filter === 'active') return !todo.completed && matchesSearch;
    if (state.filter === 'completed') return todo.completed && matchesSearch;
    return matchesSearch;
  });

  // 2. Sort
  filtered.sort((a, b) => {
    if (state.sortBy === 'date-desc') return new Date(b.createdAt) - new Date(a.createdAt);
    if (state.sortBy === 'date-asc') return new Date(a.createdAt) - new Date(b.createdAt);
    if (state.sortBy === 'priority-desc') {
      const priorityWeights = { high: 3, medium: 2, low: 1 };
      return priorityWeights[b.priority] - priorityWeights[a.priority];
    }
    if (state.sortBy === 'due-date-asc') {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    }
    return 0;
  });

  if (state.view === 'list') {
    kanbanBoard.classList.add('hidden');
    renderListView(filtered);
  } else {
    todosList.classList.add('hidden');
    renderKanbanView(filtered);
  }
}

function renderListView(filtered) {
  todosList.innerHTML = '';

  if (filtered.length === 0) {
    emptyState.classList.remove('hidden');
    todosList.classList.add('hidden');
    safeCreateIcons();
    return;
  }

  emptyState.classList.add('hidden');
  todosList.classList.remove('hidden');

  filtered.forEach(todo => {
    const li = createTodoCardElement(todo, 'list');
    todosList.appendChild(li);
  });

  safeCreateIcons();
}

function renderKanbanView(filtered) {
  emptyState.classList.add('hidden');
  kanbanBoard.classList.remove('hidden');

  const cardsTodo = document.getElementById('cards-todo');
  const cardsInProgress = document.getElementById('cards-in-progress');
  const cardsCompleted = document.getElementById('cards-completed');

  cardsTodo.innerHTML = '';
  cardsInProgress.innerHTML = '';
  cardsCompleted.innerHTML = '';

  const todoItems = filtered.filter(t => (t.status || 'todo') === 'todo' && !t.completed);
  const inProgressItems = filtered.filter(t => t.status === 'in-progress' && !t.completed);
  const completedItems = filtered.filter(t => t.completed || t.status === 'completed');

  document.getElementById('count-todo').textContent = todoItems.length;
  document.getElementById('count-in-progress').textContent = inProgressItems.length;
  document.getElementById('count-completed').textContent = completedItems.length;

  todoItems.forEach(todo => cardsTodo.appendChild(createTodoCardElement(todo, 'kanban')));
  inProgressItems.forEach(todo => cardsInProgress.appendChild(createTodoCardElement(todo, 'kanban')));
  completedItems.forEach(todo => cardsCompleted.appendChild(createTodoCardElement(todo, 'kanban')));

  safeCreateIcons();
}

function createTodoCardElement(todo, mode) {
  const li = document.createElement(mode === 'list' ? 'li' : 'div');
  const prio = todo.priority || 'medium';
  const cat = todo.category || 'Work';

  li.className = `todo-item ${mode === 'kanban' ? 'kanban-card' : ''} prio-${prio} cat-${cat.toLowerCase()}`;
  if (todo.completed) li.classList.add('completed');
  li.dataset.id = todo.id;
  li.draggable = true;

  // Due Date calculation
  let isOverdue = false;
  let formattedDate = '';
  if (todo.dueDate) {
    const today = new Date();
    today.setHours(0,0,0,0);
    const due = new Date(todo.dueDate);
    due.setHours(0,0,0,0);
    isOverdue = !todo.completed && (due < today);
    formattedDate = new Date(todo.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  const priorityLabels = { high: '🔥 High', medium: '⚡ Medium', low: '🌱 Low' };
  const categoryIcons = { Work: '💻', Personal: '🏠', Wellness: '🌱', Shopping: '🛒', Finance: '💰' };

  // Subtasks calculations
  const subtasks = Array.isArray(todo.subtasks) ? todo.subtasks : [];
  const subTotal = subtasks.length;
  const subDone = subtasks.filter(s => s.completed).length;
  const subPercent = subTotal > 0 ? Math.round((subDone / subTotal) * 100) : 0;

  li.innerHTML = `
    <div class="todo-left">
      <label class="checkbox-container">
        <input type="checkbox" ${todo.completed ? 'checked' : ''}>
        <span class="checkmark"><i data-lucide="check"></i></span>
      </label>
      
      <div class="todo-content">
        <span class="todo-text" contenteditable="false">${escapeHTML(todo.text)}</span>
        <div class="todo-meta">
          <span class="pill pill-category">${categoryIcons[todo.category] || '🏷️'} ${todo.category}</span>
          <span class="pill pill-priority prio-${todo.priority}">${priorityLabels[todo.priority]}</span>
          ${todo.dueDate ? `
            <span class="pill pill-date ${isOverdue ? 'overdue' : ''}">
              <i data-lucide="calendar"></i> ${isOverdue ? 'Overdue: ' : ''}${formattedDate}
            </span>
          ` : ''}
        </div>

        <!-- Subtasks Section -->
        <div class="subtasks-section">
          ${subTotal > 0 ? `
            <div class="subtasks-header">
              <span>Subtasks (${subDone}/${subTotal})</span>
              <span>${subPercent}%</span>
            </div>
            <div class="subtasks-progress-bar">
              <div class="subtasks-progress-fill" style="width: ${subPercent}%"></div>
            </div>
          ` : ''}

          <ul class="subtask-list">
            ${subtasks.map(s => `
              <li class="subtask-item ${s.completed ? 'done' : ''}">
                <input type="checkbox" data-subid="${s.id}" ${s.completed ? 'checked' : ''}>
                <span>${escapeHTML(s.text)}</span>
                <button class="btn-action delete-subtask" data-subid="${s.id}" style="width:20px;height:20px;margin-left:auto;">&times;</button>
              </li>
            `).join('')}
          </ul>

          <div class="add-subtask-wrapper">
            <input type="text" class="subtask-input" placeholder="+ Add subtask...">
            <button class="btn-add-subtask">Add</button>
          </div>
        </div>
      </div>
    </div>
    
    <div class="todo-actions">
      <button class="btn-action edit" aria-label="Edit task"><i data-lucide="edit-3"></i></button>
      <button class="btn-action delete" aria-label="Delete task"><i data-lucide="trash-2"></i></button>
    </div>
  `;

  // Attach Event Handlers
  const checkbox = li.querySelector('input[type="checkbox"]');
  checkbox.addEventListener('change', (e) => toggleTodoComplete(todo.id, e.target.checked, li));

  const deleteBtn = li.querySelector('.btn-action.delete');
  deleteBtn.addEventListener('click', () => deleteTodo(todo.id, li));

  const editBtn = li.querySelector('.btn-action.edit');
  const textSpan = li.querySelector('.todo-text');

  const saveEdit = () => {
    textSpan.setAttribute('contenteditable', 'false');
    const newText = textSpan.textContent.trim();
    if (newText && newText !== todo.text) updateTodoText(todo.id, newText);
    else textSpan.textContent = todo.text;
    editBtn.innerHTML = '<i data-lucide="edit-3"></i>';
    safeCreateIcons();
  };

  editBtn.addEventListener('click', () => {
    const isEditing = textSpan.getAttribute('contenteditable') === 'true';
    if (!isEditing) {
      textSpan.setAttribute('contenteditable', 'true');
      textSpan.focus();
      editBtn.innerHTML = '<i data-lucide="save"></i>';
      safeCreateIcons();
    } else {
      saveEdit();
    }
  });

  textSpan.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); saveEdit(); }
    if (e.key === 'Escape') { textSpan.textContent = todo.text; textSpan.setAttribute('contenteditable', 'false'); editBtn.innerHTML = '<i data-lucide="edit-3"></i>'; safeCreateIcons(); }
  });

  // Subtask Action Handlers
  const addSubBtn = li.querySelector('.btn-add-subtask');
  const subInput = li.querySelector('.subtask-input');

  const handleSubAdd = () => {
    const val = subInput.value.trim();
    if (val) addSubtask(todo.id, val);
  };

  addSubBtn.addEventListener('click', handleSubAdd);
  subInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); handleSubAdd(); } });

  li.querySelectorAll('.subtask-item input[type="checkbox"]').forEach(chk => {
    chk.addEventListener('change', (e) => toggleSubtask(todo.id, e.target.dataset.subid, e.target.checked));
  });

  li.querySelectorAll('.delete-subtask').forEach(btn => {
    btn.addEventListener('click', (e) => deleteSubtask(todo.id, e.target.dataset.subid));
  });

  // Drag & Drop Handlers for Kanban
  li.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', todo.id);
    li.classList.add('dragging');
  });

  li.addEventListener('dragend', () => {
    li.classList.remove('dragging');
  });

  return li;
}

// Kanban Drag & Drop Logic
function setupKanbanDragAndDrop() {
  const columns = document.querySelectorAll('.kanban-column');
  columns.forEach(col => {
    col.addEventListener('dragover', (e) => {
      e.preventDefault();
      col.classList.add('drag-over');
    });

    col.addEventListener('dragleave', () => {
      col.classList.remove('drag-over');
    });

    col.addEventListener('drop', (e) => {
      e.preventDefault();
      col.classList.remove('drag-over');
      const todoId = e.dataTransfer.getData('text/plain');
      const targetStatus = col.dataset.status;
      if (todoId && targetStatus) {
        updateTodoStatus(todoId, targetStatus);
      }
    });
  });
}

// Helpers
function safeCreateIcons() {
  if (typeof lucide !== 'undefined' && lucide && typeof lucide.createIcons === 'function') {
    try { lucide.createIcons(); }
    catch (e) {}
  }
}

function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
