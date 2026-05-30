// State
let currentUser = null;
let currentTasks = [];
let isLoginMode = true;

// DOM Elements
const elements = {
    // Nav
    navbar: document.getElementById('navbar'),
    userGreeting: document.getElementById('user-greeting'),
    adminBtn: document.getElementById('admin-btn'),
    logoutBtn: document.getElementById('logout-btn'),
    
    // Views
    authView: document.getElementById('auth-view'),
    tasksView: document.getElementById('tasks-view'),
    adminView: document.getElementById('admin-view'),
    
    // Auth
    authForm: document.getElementById('auth-form'),
    authSubtitle: document.getElementById('auth-subtitle'),
    registerFields: document.getElementById('register-fields'),
    authSubmitBtn: document.getElementById('auth-submit-btn'),
    toggleAuth: document.getElementById('toggle-auth'),
    authToggleText: document.getElementById('auth-toggle-text'),
    usernameInput: document.getElementById('username'),
    emailInput: document.getElementById('email'),
    passwordInput: document.getElementById('password'),
    
    // Tasks
    newTaskBtn: document.getElementById('new-task-btn'),
    listPending: document.getElementById('list-pending'),
    listInProgress: document.getElementById('list-in_progress'),
    listCompleted: document.getElementById('list-completed'),
    countPending: document.getElementById('count-pending'),
    countInProgress: document.getElementById('count-in-progress'),
    countCompleted: document.getElementById('count-completed'),
    
    // Modal
    taskModal: document.getElementById('task-modal'),
    taskForm: document.getElementById('task-form'),
    closeModal: document.getElementById('close-modal'),
    cancelTaskBtn: document.getElementById('cancel-task-btn'),
    modalTitle: document.getElementById('modal-title'),
    taskIdInput: document.getElementById('task-id'),
    taskTitleInput: document.getElementById('task-title'),
    taskDescInput: document.getElementById('task-desc'),
    taskStatusInput: document.getElementById('task-status'),
    statusGroup: document.getElementById('status-group'),
    
    // Admin
    backToTasksBtn: document.getElementById('back-to-tasks-btn'),
    statUsers: document.getElementById('stat-users'),
    statTasks: document.getElementById('stat-tasks'),
    auditLogsBody: document.getElementById('audit-logs-body')
};

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    attachEventListeners();
});

// Event Listeners
function attachEventListeners() {
    // Auth
    elements.toggleAuth.addEventListener('click', (e) => {
        e.preventDefault();
        toggleAuthMode();
    });
    
    elements.authForm.addEventListener('submit', handleAuthSubmit);
    elements.logoutBtn.addEventListener('click', handleLogout);
    
    // Navigation
    elements.adminBtn.addEventListener('click', () => switchView('admin'));
    elements.backToTasksBtn.addEventListener('click', () => switchView('tasks'));
    
    // Tasks Modal
    elements.newTaskBtn.addEventListener('click', () => openTaskModal());
    elements.closeModal.addEventListener('click', closeTaskModal);
    elements.cancelTaskBtn.addEventListener('click', closeTaskModal);
    elements.taskForm.addEventListener('submit', handleTaskSubmit);
    
    // Close modal on outside click
    window.addEventListener('click', (e) => {
        if (e.target === elements.taskModal) closeTaskModal();
    });
}

// Authentication
function checkAuth() {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
        currentUser = JSON.parse(userStr);
        api.setToken(token);
        handleSuccessfulLogin();
    } else {
        switchView('auth');
    }
}

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    
    if (isLoginMode) {
        elements.authSubtitle.textContent = 'Welcome back! Please login to your account.';
        elements.registerFields.classList.add('hidden');
        elements.authSubmitBtn.textContent = 'Sign In';
        elements.usernameInput.removeAttribute('required');
        elements.authToggleText.innerHTML = 'Don\'t have an account? <a href="#" id="toggle-auth">Sign up</a>';
    } else {
        elements.authSubtitle.textContent = 'Create an account to start managing tasks.';
        elements.registerFields.classList.remove('hidden');
        elements.authSubmitBtn.textContent = 'Sign Up';
        elements.usernameInput.setAttribute('required', 'true');
        elements.authToggleText.innerHTML = 'Already have an account? <a href="#" id="toggle-auth">Sign in</a>';
    }
    
    // Reattach listener
    document.getElementById('toggle-auth').addEventListener('click', (e) => {
        e.preventDefault();
        toggleAuthMode();
    });
}

async function handleAuthSubmit(e) {
    e.preventDefault();
    
    const email = elements.emailInput.value;
    const password = elements.passwordInput.value;
    
    const submitBtn = elements.authSubmitBtn;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Please wait...';
    submitBtn.disabled = true;
    
    try {
        if (isLoginMode) {
            const data = await api.login(email, password);
            api.setToken(data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            currentUser = data.user;
            showToast('Login successful!', 'success');
            handleSuccessfulLogin();
        } else {
            const username = elements.usernameInput.value;
            await api.register(username, email, password);
            showToast('Registration successful! Please sign in.', 'success');
            toggleAuthMode();
            elements.passwordInput.value = '';
        }
    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

function handleSuccessfulLogin() {
    elements.userGreeting.textContent = `Hello, ${currentUser.username}`;
    
    if (currentUser.role === 'admin') {
        elements.adminBtn.classList.remove('hidden');
    } else {
        elements.adminBtn.classList.add('hidden');
    }
    
    elements.navbar.classList.remove('hidden');
    switchView('tasks');
}

function handleLogout() {
    api.setToken(null);
    localStorage.removeItem('user');
    currentUser = null;
    elements.navbar.classList.add('hidden');
    elements.authForm.reset();
    switchView('auth');
    showToast('Logged out successfully', 'success');
}

// View Management
function switchView(viewName) {
    // Hide all
    elements.authView.classList.add('hidden');
    elements.tasksView.classList.add('hidden');
    elements.adminView.classList.add('hidden');
    
    // Show active
    switch(viewName) {
        case 'auth':
            elements.authView.classList.remove('hidden');
            break;
        case 'tasks':
            elements.tasksView.classList.remove('hidden');
            loadTasks();
            break;
        case 'admin':
            elements.adminView.classList.remove('hidden');
            loadAdminData();
            break;
    }
}

// Tasks Management
async function loadTasks() {
    try {
        const tasks = await api.getTasks();
        currentTasks = tasks;
        renderTasks();
    } catch (err) {
        showToast('Failed to load tasks', 'error');
    }
}

function renderTasks() {
    // Clear lists
    elements.listPending.innerHTML = '';
    elements.listInProgress.innerHTML = '';
    elements.listCompleted.innerHTML = '';
    
    let counts = { pending: 0, in_progress: 0, completed: 0 };
    
    currentTasks.forEach(task => {
        counts[task.status]++;
        const taskCard = createTaskCard(task);
        
        switch(task.status) {
            case 'pending': elements.listPending.appendChild(taskCard); break;
            case 'in_progress': elements.listInProgress.appendChild(taskCard); break;
            case 'completed': elements.listCompleted.appendChild(taskCard); break;
        }
    });
    
    // Update counts
    elements.countPending.textContent = counts.pending;
    elements.countInProgress.textContent = counts.in_progress;
    elements.countCompleted.textContent = counts.completed;
}

function createTaskCard(task) {
    const div = document.createElement('div');
    div.className = 'task-card';
    
    const desc = task.description ? `<p>${escapeHTML(task.description)}</p>` : '';
    
    // Determine status icons for quick action
    let nextStatusIcon = '';
    let nextStatus = '';
    if (task.status === 'pending') {
        nextStatus = 'in_progress';
        nextStatusIcon = '<i class="ph ph-play-circle" title="Start Progress"></i>';
    } else if (task.status === 'in_progress') {
        nextStatus = 'completed';
        nextStatusIcon = '<i class="ph ph-check-circle" title="Complete"></i>';
    } else {
        nextStatus = 'pending';
        nextStatusIcon = '<i class="ph ph-arrow-counter-clockwise" title="Reopen"></i>';
    }

    div.innerHTML = `
        <h4>${escapeHTML(task.title)}</h4>
        ${desc}
        <div class="task-actions">
            <button class="icon-btn edit-btn" title="Edit"><i class="ph ph-pencil-simple"></i></button>
            <button class="icon-btn status-btn" title="Update Status">${nextStatusIcon}</button>
            <button class="icon-btn delete-btn" title="Delete" style="color: var(--danger)"><i class="ph ph-trash"></i></button>
        </div>
    `;
    
    // Attach events
    div.querySelector('.edit-btn').addEventListener('click', () => openTaskModal(task));
    
    div.querySelector('.status-btn').addEventListener('click', async () => {
        try {
            await api.updateTask(task.id, { status: nextStatus });
            loadTasks();
        } catch (err) {
            showToast('Failed to update status', 'error');
        }
    });
    
    div.querySelector('.delete-btn').addEventListener('click', async () => {
        if (confirm('Are you sure you want to delete this task?')) {
            try {
                await api.deleteTask(task.id);
                showToast('Task deleted', 'success');
                loadTasks();
            } catch (err) {
                showToast('Failed to delete task', 'error');
            }
        }
    });
    
    return div;
}

// Modal Management
function openTaskModal(task = null) {
    if (task) {
        elements.modalTitle.textContent = 'Edit Task';
        elements.taskIdInput.value = task.id;
        elements.taskTitleInput.value = task.title;
        elements.taskDescInput.value = task.description || '';
        elements.taskStatusInput.value = task.status;
        elements.statusGroup.classList.remove('hidden');
    } else {
        elements.modalTitle.textContent = 'Create New Task';
        elements.taskForm.reset();
        elements.taskIdInput.value = '';
        elements.statusGroup.classList.add('hidden'); // New tasks are always pending
    }
    
    elements.taskModal.classList.remove('hidden');
}

function closeTaskModal() {
    elements.taskModal.classList.add('hidden');
    elements.taskForm.reset();
}

async function handleTaskSubmit(e) {
    e.preventDefault();
    
    const id = elements.taskIdInput.value;
    const taskData = {
        title: elements.taskTitleInput.value,
        description: elements.taskDescInput.value,
    };
    
    if (id) {
        taskData.status = elements.taskStatusInput.value;
    }
    
    try {
        if (id) {
            await api.updateTask(id, taskData);
            showToast('Task updated successfully', 'success');
        } else {
            await api.createTask(taskData);
            showToast('Task created successfully', 'success');
        }
        closeTaskModal();
        loadTasks();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// Admin Management
async function loadAdminData() {
    try {
        const [stats, logs] = await Promise.all([
            api.getStats(),
            api.getAuditLogs()
        ]);
        
        // Render Stats
        elements.statUsers.textContent = stats.totalUsers || 0;
        elements.statTasks.textContent = stats.totalTasks || 0;
        
        // Render Logs
        elements.auditLogsBody.innerHTML = '';
        logs.forEach(log => {
            const tr = document.createElement('tr');
            
            const date = new Date(log.created_at).toLocaleString();
            let actionClass = '';
            if (log.action.includes('LOGIN')) actionClass = 'action-login';
            else if (log.action.includes('UNAUTH')) actionClass = 'action-unauth';
            else if (log.action.includes('CREATE') || log.action.includes('REGISTER')) actionClass = 'action-create';
            else if (log.action.includes('DELETE')) actionClass = 'action-delete';
            
            tr.innerHTML = `
                <td>${date}</td>
                <td>${escapeHTML(log.username || 'System')}</td>
                <td><span class="tag ${actionClass}">${escapeHTML(log.action)}</span></td>
                <td>${escapeHTML(log.entity)}</td>
                <td>${escapeHTML(log.details || '-')}</td>
            `;
            elements.auditLogsBody.appendChild(tr);
        });
        
    } catch (err) {
        showToast('Failed to load admin dashboard', 'error');
    }
}

// Utilities
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'check-circle' : 
                 type === 'error' ? 'warning-circle' : 'info';
                 
    toast.innerHTML = `
        <i class="ph ph-${icon}" style="font-size: 1.25rem;"></i>
        <span>${escapeHTML(message)}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3300);
}

function escapeHTML(str) {
    if (!str) return '';
    return str.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
