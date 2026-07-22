// Taskify Client Application Logic

// State management
let state = {
  todos: [],
  filter: 'all', // 'all', 'active', 'completed'
  search: '',
  sortBy: 'date-desc', // 'date-desc', 'date-asc', 'priority-desc', 'due-date-asc'
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
const loadingSpinner = document.getElementById('loading-spinner');
const emptyState = document.getElementById('empty-state');
const themeToggle = document.getElementById('theme-toggle');

// Dashboard Elements
const statsTotal = document.getElementById('stats-total');
const statsCompleted = document.getElementById('stats-completed');
const statsPending = document.getElementById('stats-pending');
const statsRatio = document.getElementById('stats-ratio');
const statsProgressFill = document.getElementById('stats-progress-fill');

// Init application
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  fetchTodos();
  setupEventListeners();
});

// Theme Logic
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeToggleIcon();
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeToggleIcon();
}

function updateThemeToggleIcon() {
  // Lucide will render this automatically, we just handle events.
}

// Event Listeners
function setupEventListeners() {
  // Theme Toggle
  themeToggle.addEventListener('click', toggleTheme);

  // Form Submit (Add)
  todoForm.addEventListener('submit', handleAddTodo);

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
}

// API Communication
async function fetchTodos() {
  showLoading(true);
  try {
    const res = await fetch('/api/todos');
    if (!res.ok) throw new Error('Failed to fetch tasks');
    state.todos = await res.json();
    renderTodos();
  } catch (error) {
    console.error('API Error:', error);
    showErrorMessage();
  } finally {
    showLoading(false);
  }
}

async function handleAddTodo(e) {
  e.preventDefault();
  const text = todoInput.value.trim();
  if (!text) return;

  let priority = 'medium';
  for (const radio of priorityRadios) {
    if (radio.checked) {
      priority = radio.value;
      break;
    }
  }

  const category = categorySelect.value;
  const dueDate = dueDateInput.value || null;

  const newTodo = { text, priority, category, dueDate };

  try {
    const res = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTodo)
    });
    if (!res.ok) throw new Error('Failed to add task');
    
    const addedTodo = await res.json();
    state.todos.unshift(addedTodo); // Add to front of list
    
    // Reset Form
    todoInput.value = '';
    dueDateInput.value = '';
    document.getElementById('prio-medium').checked = true;
    categorySelect.selectedIndex = 0;
    
    renderTodos();
  } catch (error) {
    console.error('API Error:', error);
    alert('Could not save task. Please try again.');
  }
}

async function toggleTodoComplete(id, completed) {
  try {
    const todo = state.todos.find(t => t.id === id);
    if (!todo) return;

    const res = await fetch(`/api/todos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...todo, completed })
    });
    
    if (!res.ok) throw new Error('Failed to update task');
    
    // Update local state
    todo.completed = completed;
    renderTodos();
  } catch (error) {
    console.error('API Error:', error);
    alert('Failed to update task state.');
    fetchTodos(); // Sync back
  }
}

async function updateTodoText(id, text) {
  try {
    const todo = state.todos.find(t => t.id === id);
    if (!todo || todo.text === text) return;

    const res = await fetch(`/api/todos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...todo, text })
    });
    
    if (!res.ok) throw new Error('Failed to save task edit');
    
    todo.text = text;
    renderTodos();
  } catch (error) {
    console.error('API Error:', error);
    alert('Failed to save changes.');
    fetchTodos();
  }
}

async function deleteTodo(id, itemElement) {
  // Apply a transition before deleting from state
  itemElement.style.transform = 'translateX(50px) scale(0.9)';
  itemElement.style.opacity = '0';
  
  setTimeout(async () => {
    try {
      const res = await fetch(`/api/todos/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete task');
      
      state.todos = state.todos.filter(t => t.id !== id);
      renderTodos();
    } catch (error) {
      console.error('API Error:', error);
      alert('Failed to delete task.');
      fetchTodos();
    }
  }, 250);
}

// UI Rendering Logic
function showLoading(isLoading) {
  state.loading = isLoading;
  if (isLoading) {
    loadingSpinner.classList.remove('hidden');
    todosList.classList.add('hidden');
    emptyState.classList.add('hidden');
  } else {
    loadingSpinner.classList.add('hidden');
    todosList.classList.remove('hidden');
  }
}

function showErrorMessage() {
  emptyState.innerHTML = `
    <div class="empty-icon-wrapper" style="color: var(--prio-high); background: rgba(239,68,68,0.1)">
      <i data-lucide="alert-triangle"></i>
    </div>
    <h3>Connection Error</h3>
    <p>Failed to sync tasks with backend service. Make sure server.js is running.</p>
  `;
  emptyState.classList.remove('hidden');
  todosList.classList.add('hidden');
  safeCreateIcons();
}

function updateDashboard() {
  const total = state.todos.length;
  const completed = state.todos.filter(t => t.completed).length;
  const pending = total - completed;
  const ratio = total > 0 ? Math.round((completed / total) * 100) : 0;

  statsTotal.textContent = total;
  statsCompleted.textContent = completed;
  statsPending.textContent = pending;
  statsRatio.textContent = `${ratio}%`;
  statsProgressFill.style.width = `${ratio}%`;
}

function renderTodos() {
  updateDashboard();

  // 1. Filter
  let filtered = state.todos.filter(todo => {
    // Search filter
    const matchesSearch = todo.text.toLowerCase().includes(state.search);
    
    // Status filter
    if (state.filter === 'active') return !todo.completed && matchesSearch;
    if (state.filter === 'completed') return todo.completed && matchesSearch;
    return matchesSearch;
  });

  // 2. Sort
  filtered.sort((a, b) => {
    if (state.sortBy === 'date-desc') {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
    if (state.sortBy === 'date-asc') {
      return new Date(a.createdAt) - new Date(b.createdAt);
    }
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

  // Clear list
  todosList.innerHTML = '';

  if (filtered.length === 0) {
    emptyState.classList.remove('hidden');
    emptyState.innerHTML = `
      <div class="empty-icon-wrapper">
        <i data-lucide="sparkles"></i>
      </div>
      <h3>Your board is clear</h3>
      <p>No tasks fit your criteria. Start adding something new!</p>
    `;
    safeCreateIcons();
    return;
  }

  emptyState.classList.add('hidden');

  filtered.forEach(todo => {
    const li = document.createElement('li');
    const prio = todo.priority || 'medium';
    const cat = todo.category || 'Work';
    li.className = `todo-item prio-${prio} cat-${cat.toLowerCase()}`;
    if (todo.completed) li.classList.add('completed');
    li.dataset.id = todo.id;

    // Check overdue
    let isOverdue = false;
    let formattedDate = '';
    if (todo.dueDate) {
      const today = new Date();
      today.setHours(0,0,0,0);
      const due = new Date(todo.dueDate);
      due.setHours(0,0,0,0);
      
      isOverdue = !todo.completed && (due < today);
      
      // format date nicely
      const opts = { month: 'short', day: 'numeric' };
      formattedDate = new Date(todo.dueDate).toLocaleDateString('en-US', opts);
    }

    const priorityLabels = { high: '🔥 High', medium: '⚡ Medium', low: '🌱 Low' };
    const categoryIcons = {
      Work: '💻',
      Personal: '🏠',
      Wellness: '🌱',
      Shopping: '🛒',
      Finance: '💰'
    };

    li.innerHTML = `
      <div class="todo-left">
        <label class="checkbox-container">
          <input type="checkbox" ${todo.completed ? 'checked' : ''}>
          <span class="checkmark">
            <i data-lucide="check"></i>
          </span>
        </label>
        
        <div class="todo-content">
          <span class="todo-text" contenteditable="false">${escapeHTML(todo.text)}</span>
          <div class="todo-meta">
            <span class="pill pill-category">${categoryIcons[todo.category] || '🏷️'} ${todo.category}</span>
            <span class="pill pill-priority prio-${todo.priority}">${priorityLabels[todo.priority]}</span>
            ${todo.dueDate ? `
              <span class="pill pill-date ${isOverdue ? 'overdue' : ''}">
                <i data-lucide="calendar"></i>
                ${isOverdue ? 'Overdue: ' : ''}${formattedDate}
              </span>
            ` : ''}
          </div>
        </div>
      </div>
      
      <div class="todo-actions">
        <button class="btn-action edit" aria-label="Edit task">
          <i data-lucide="edit-3"></i>
        </button>
        <button class="btn-action delete" aria-label="Delete task">
          <i data-lucide="trash-2"></i>
        </button>
      </div>
    `;

    // Event hooks on card elements
    const checkbox = li.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', (e) => {
      toggleTodoComplete(todo.id, e.target.checked);
    });

    const deleteBtn = li.querySelector('.btn-action.delete');
    deleteBtn.addEventListener('click', () => {
      deleteTodo(todo.id, li);
    });

    const editBtn = li.querySelector('.btn-action.edit');
    const textSpan = li.querySelector('.todo-text');

    // Inline editing trigger
    const triggerEdit = () => {
      const isEditing = textSpan.getAttribute('contenteditable') === 'true';
      if (!isEditing) {
        textSpan.setAttribute('contenteditable', 'true');
        textSpan.focus();
        // Select all text
        const range = document.createRange();
        range.selectNodeContents(textSpan);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        editBtn.innerHTML = '<i data-lucide="save"></i>';
        safeCreateIcons();
      } else {
        saveEdit();
      }
    };

    const saveEdit = () => {
      textSpan.setAttribute('contenteditable', 'false');
      const newText = textSpan.textContent.trim();
      if (newText && newText !== todo.text) {
        updateTodoText(todo.id, newText);
      } else {
        textSpan.textContent = todo.text; // reset if empty or same
      }
      editBtn.innerHTML = '<i data-lucide="edit-3"></i>';
      safeCreateIcons();
    };

    editBtn.addEventListener('click', triggerEdit);
    
    textSpan.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault(); // Stop newline
        saveEdit();
      }
      if (e.key === 'Escape') {
        textSpan.textContent = todo.text;
        textSpan.setAttribute('contenteditable', 'false');
        editBtn.innerHTML = '<i data-lucide="edit-3"></i>';
        safeCreateIcons();
      }
    });

    textSpan.addEventListener('blur', () => {
      // Small timeout to allow potential button clicks to go through first
      setTimeout(() => {
        if (textSpan.getAttribute('contenteditable') === 'true') {
          saveEdit();
        }
      }, 200);
    });

    todosList.appendChild(li);
  });

  // Re-generate Lucide Icons for added templates
  safeCreateIcons();
}

// Helpers
function safeCreateIcons() {
  if (typeof lucide !== 'undefined' && lucide && typeof lucide.createIcons === 'function') {
    try {
      lucide.createIcons();
    } catch (e) {
      console.warn('Lucide icon render error:', e);
    }
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
