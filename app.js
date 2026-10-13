const STORAGE_KEY = 'todos';
let todos = [];
let currentFilter = 'all';

const input = document.querySelector('#todo-input');
const button = document.querySelector('#add-btn');
const list = document.querySelector('#todo-list');
const message = document.querySelector('#todo-message');
const filters = document.querySelector('#todo-filters');
const count = document.querySelector('#todo-count');
const empty = document.querySelector('#todo-empty');

function save() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
        return true;
    } catch (error) {
        console.error('Todo 保存失败：', error);
        return false;
    }
}

function loadTodos() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const data = raw === null ? [] : JSON.parse(raw);
        if (!Array.isArray(data)) {
            throw new Error('保存内容不是数组');
        }
        const validTodos = data.filter(todo => todo !== null
            && typeof todo === 'object'
            && Number.isSafeInteger(todo.id) && todo.id > 0
            && typeof todo.text === 'string' && todo.text.trim() !== ''
            && typeof todo.completed === 'boolean');
        todos = validTodos.filter((todo, index) =>
            validTodos.findIndex(item => item.id === todo.id) === index);
        if (todos.length !== data.length) {
            message.textContent = '保存内容不完整，只恢复了可用任务。';
        }
    } catch (error) {
        todos = [];
        message.textContent = '未能恢复已保存的任务，请检查浏览器存储。';
        console.error('Todo 加载失败：', error);
    }
}

function addTodo(text) {
    const value = text.trim();
    if (value === '') {
        message.textContent = '请先输入待办事项。';
        input.focus();
        return;
    }
    const id = Math.max(0, ...todos.map(todo => todo.id)) + 1;
    const item = { id, text: value, completed: false };
    todos = [...todos, item];
    const saved = save();
    render();
    input.value = '';
    message.textContent = saved ? '已添加。' : '页面已更新，但未能保存，刷新可能丢失本次修改。';
    input.focus();
}

function removeTodo(id) {
    todos = todos.filter(todo => todo.id !== id);
    const saved = save();
    render();
    message.textContent = saved ? '已删除。' : '页面已更新，但未能保存，刷新可能丢失本次修改。';
    input.focus();
}

function toggleTodo(id) {
    todos = todos.map(todo => todo.id === id
        ? { ...todo, completed: !todo.completed }
        : todo);
    const saved = save();
    render();
    message.textContent = saved ? '已更新状态。' : '页面已更新，但未能保存，刷新可能丢失本次修改。';
    const checkbox = document.querySelector(`#todo-${id}`);
    if (checkbox) {
        checkbox.focus();
    } else {
        filters.querySelector(`[data-filter="${currentFilter}"]`).focus();
    }
}

function render() {
    const visibleTodos = todos.filter(todo => {
        if (currentFilter === 'active') return !todo.completed;
        if (currentFilter === 'completed') return todo.completed;
        return true;
    });
    list.textContent = '';
    for (const todo of visibleTodos) {
        const { id, text, completed } = todo;
        const li = document.createElement('li');
        li.classList.add('todo-item');
        if (completed) li.classList.add('is-completed');

        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `todo-${id}`;
        checkbox.checked = completed;
        label.htmlFor = checkbox.id;
        checkbox.addEventListener('change', () => toggleTodo(id));

        const content = document.createElement('span');
        const title = document.createElement('span');
        title.classList.add('todo-text');
        title.textContent = text;
        const state = document.createElement('span');
        state.classList.add('todo-state');
        state.textContent = completed ? '已完成' : '进行中';
        content.appendChild(title);
        content.appendChild(state);
        label.appendChild(checkbox);
        label.appendChild(content);

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.classList.add('delete-btn');
        deleteButton.textContent = '删除';
        deleteButton.setAttribute('aria-label', `删除任务：${text}`);
        deleteButton.addEventListener('click', () => removeTodo(id));
        li.appendChild(label);
        li.appendChild(deleteButton);
        list.appendChild(li);
    }
    const completedCount = todos.filter(todo => todo.completed).length;
    count.textContent = `共 ${todos.length} 项，已完成 ${completedCount} 项`;
    empty.hidden = visibleTodos.length !== 0;
    empty.textContent = todos.length === 0 ? '还没有待办事项。' : '当前筛选下没有待办事项。';
    for (const filterButton of filters.querySelectorAll('button')) {
        filterButton.setAttribute('aria-pressed', String(filterButton.dataset.filter === currentFilter));
    }
}

function initTodo() {
    if (!input || !button || !list || !message || !filters || !count || !empty) {
        console.error('Todo 初始化失败：缺少必要的页面元素。');
        if (button) button.disabled = true;
        if (message) message.textContent = '暂时无法使用待办清单。';
        return;
    }
    button.addEventListener('click', () => addTodo(input.value));
    for (const filterButton of filters.querySelectorAll('button')) {
        filterButton.addEventListener('click', () => {
            currentFilter = filterButton.dataset.filter;
            render();
        });
    }
    loadTodos();
    render();
}

initTodo();
