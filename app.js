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

function deleteTodo(id) {
    console.log('[delete]', id);
    todos = todos.filter(todo => todo.id !== id);
    const saved = save();
    render();
    message.textContent = saved ? '已删除。' : '页面已更新，但未能保存，刷新可能丢失本次修改。';
    input.focus();
}

function clearCompleted() {
    todos = todos.filter(todo => !todo.completed);
    const saved = save();
    render();
    message.textContent = saved ? '已清除已完成任务。' : '页面已更新，但未能保存，刷新可能丢失本次修改。';
}

function toggleTodo(id) {
    console.log('[toggle]', id);
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

function updateTodo(id, text) {
    const current = todos.find(todo => todo.id === id);
    if (!current) return;
    const value = text.trim();
    if (value === '') {
        message.textContent = '任务内容不能为空，已保留原内容。';
        return;
    }
    if (value === current.text) {
        message.textContent = '内容没有变化，已保留原任务。';
        return;
    }
    console.log('[edit]', id, value);
    todos = todos.map(todo => todo.id === id
        ? { ...todo, text: value }
        : todo);
    const saved = save();
    render();
    message.textContent = saved ? '已修改。' : '页面已更新，但未能保存，刷新可能丢失本次修改。';
    const edit = list.querySelector(`[data-id="${id}"] [data-action="edit"]`);
    if (edit) edit.focus();
}

function render() {
    const visibleTodos = todos.filter(todo => {
        if (currentFilter === 'active') return !todo.completed;
        if (currentFilter === 'completed') return todo.completed;
        return true;
    });
    list.textContent = '';
    for (const { id, text, completed } of visibleTodos) {
        const li = document.createElement('li');
        li.classList.add('todo-item');
        li.dataset.id = String(id);
        if (completed) li.classList.add('is-completed');

        // 父级 click 已处理文字点击，不再用 label 合成第二次点击。
        const content = document.createElement('div');
        content.classList.add('todo-content');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `todo-${id}`;
        checkbox.checked = completed;
        checkbox.setAttribute('aria-label', `切换任务：${text}`);
        const words = document.createElement('span');
        const title = document.createElement('span');
        title.classList.add('todo-text');
        title.textContent = text;
        const state = document.createElement('span');
        state.classList.add('todo-state');
        state.textContent = completed ? '已完成' : '进行中';
        words.append(title, state);
        content.append(checkbox, words);
        li.appendChild(content);
        const edit = document.createElement('button');
        edit.type = 'button';
        edit.classList.add('delete-btn');
        edit.dataset.action = 'edit';
        edit.setAttribute('aria-label', `编辑任务：${text}`);
        const editText = document.createElement('span');
        editText.textContent = '编辑';
        edit.appendChild(editText);
        li.appendChild(edit);
        const del = document.createElement('button');
        del.type = 'button';
        del.classList.add('delete-btn');
        del.dataset.action = 'delete';
        del.setAttribute('aria-label', `删除任务：${text}`);
        const delText = document.createElement('span');
        delText.textContent = '删除';
        del.appendChild(delText);
        li.appendChild(del);
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

function handleListClick(e) {
    if (!(e.target instanceof Element)) return;
    const item = e.target.closest('li');
    if (!item || !list.contains(item)) return;
    if (!item.dataset.id) return;
    // W7 的 id 是数字，dataset.id 是字符串。
    const id = Number(item.dataset.id);
    if (!Number.isSafeInteger(id) || !todos.some(todo => todo.id === id)) return;
    const actionButton = e.target.closest('button[data-action]');
    if (actionButton && !item.contains(actionButton)) return;
    const action = actionButton ? actionButton.dataset.action : null;
    if (action === 'delete') {
        deleteTodo(id);
    } else if (action === 'edit') {
        const todo = todos.find(todo => todo.id === id);
        const text = window.prompt('修改任务', todo.text);
        if (text === null) return;
        updateTodo(id, text);
    } else {
        // 未知操作按钮也不能落入“切换”分支。
        if (actionButton) return;
        if (e.target.matches('input[type="checkbox"]')) e.preventDefault();
        toggleTodo(id);
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
    list.addEventListener('click', handleListClick);
    loadTodos();
    render();
}

initTodo();
