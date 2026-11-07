import './style.css';
import {
  addTodo,
  deleteTodo,
  toggleTodo,
  updateTodo,
  parseTodoId,
  restoreTodos,
  isFilter,
} from './todo';
import type { Todo, Filter } from './todo';

const STORAGE_KEY = 'todos';

function initTodo(): void {
  const inputNode = document.querySelector('#todo-input');
  const buttonNode = document.querySelector('#add-btn');
  const listNode = document.querySelector('#todo-list');
  const messageNode = document.querySelector('#todo-message');
  const filtersNode = document.querySelector('#todo-filters');
  const countNode = document.querySelector('#todo-count');
  const emptyNode = document.querySelector('#todo-empty');
  if (
    !(inputNode instanceof HTMLInputElement) ||
    !(buttonNode instanceof HTMLButtonElement) ||
    !(listNode instanceof HTMLUListElement) ||
    !(messageNode instanceof HTMLElement) ||
    !(filtersNode instanceof HTMLElement) ||
    !(countNode instanceof HTMLElement) ||
    !(emptyNode instanceof HTMLElement)
  ) {
    console.error('Todo 初始化失败：缺少必要的页面元素。');
    return;
  }
  // 保存收窄后的类型，供下面的函数使用。
  const input = inputNode;
  const button = buttonNode;
  const list = listNode;
  const message = messageNode;
  const filters = filtersNode;
  const count = countNode;
  const empty = emptyNode;

  let todos: Todo[] = [];
  let currentFilter: Filter = 'all';

  function save(): boolean {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
      return true;
    } catch (error) {
      console.error('Todo 保存失败：', error);
      return false;
    }
  }

  function loadTodos(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const data: unknown = raw === null ? [] : JSON.parse(raw);
      todos = restoreTodos(data);
      if (!Array.isArray(data) || todos.length !== data.length) {
        message.textContent = '保存内容不完整，只恢复了可用任务。';
      }
    } catch (error) {
      todos = [];
      message.textContent = '未能恢复已保存的任务，请检查浏览器存储。';
      console.error('Todo 加载失败：', error);
    }
  }

  function finish(text: string): void {
    const saved = save();
    render();
    message.textContent = saved
      ? text
      : '页面已更新，但未能保存，刷新可能丢失本次修改。';
  }

  function makeActionButton(
    action: 'edit' | 'delete',
    label: string,
    text: string,
  ): HTMLButtonElement {
    const actionButton = document.createElement('button');
    actionButton.type = 'button';
    actionButton.classList.add('action-btn');
    actionButton.dataset.action = action;
    actionButton.setAttribute('aria-label', `${label}任务：${text}`);
    const span = document.createElement('span');
    span.textContent = label;
    actionButton.appendChild(span);
    return actionButton;
  }

  function render(): void {
    const visibleTodos = todos.filter((todo) => {
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
      const content = document.createElement('div');
      content.classList.add('todo-content');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `todo-${id}`;
      checkbox.checked = completed;
      checkbox.setAttribute('aria-label', `切换任务完成状态：${text}`);
      const words = document.createElement('span');
      const title = document.createElement('span');
      title.classList.add('todo-text');
      title.textContent = text;
      const state = document.createElement('span');
      state.classList.add('todo-state');
      state.textContent = completed ? '已完成' : '进行中';
      words.append(title, state);
      content.append(checkbox, words);
      li.append(
        content,
        makeActionButton('edit', '编辑', text),
        makeActionButton('delete', '删除', text),
      );
      list.appendChild(li);
    }
    count.textContent = `共 ${todos.length} 项，已完成 ${todos.filter((todo) => todo.completed).length} 项`;
    empty.hidden = visibleTodos.length !== 0;
    empty.textContent =
      todos.length === 0 ? '还没有待办事项。' : '当前筛选下没有待办事项。';
    for (const filterButton of filters.querySelectorAll('button')) {
      filterButton.setAttribute(
        'aria-pressed',
        String(filterButton.dataset.filter === currentFilter),
      );
    }
  }

  function submitTodo(): void {
    if (addTodo(todos, input.value)) {
      finish('已添加。');
      input.value = '';
    } else {
      message.textContent =
        '请输入 1～200 个字符，不能包含 script 标签；编号已满时也无法添加。';
    }
    input.focus();
  }

  function editTask(todo: Todo): void {
    const text = window.prompt('修改任务', todo.text);
    if (text === null) return;
    if (!updateTodo(todos, todo.id, text)) {
      message.textContent = '内容不合法，已保留原内容。';
      return;
    }
    finish('已修改。');
    const editButton = list.querySelector(
      `[data-id="${todo.id}"] [data-action="edit"]`,
    );
    if (editButton instanceof HTMLElement) editButton.focus();
  }

  function handleAction(action: string | undefined, todo: Todo): void {
    if (action === 'delete') {
      if (deleteTodo(todos, todo.id)) finish('已删除。');
      input.focus();
      return;
    }
    if (action === 'edit') editTask(todo);
  }

  function toggleTask(event: Event, target: Element, id: number): void {
    if (target.matches('input[type="checkbox"]')) event.preventDefault();
    if (toggleTodo(todos, id)) finish('已更新状态。');
    const checkbox = document.querySelector(`#todo-${id}`);
    const filterButton = filters.querySelector(
      `[data-filter="${currentFilter}"]`,
    );
    if (checkbox instanceof HTMLElement) checkbox.focus();
    else if (filterButton instanceof HTMLElement) filterButton.focus();
  }

  // 委托入口只定位目标，编辑、删除和切换各自保留原判断。
  function handleListClick(event: Event): void {
    if (!(event.target instanceof Element)) return;
    const item = event.target.closest('li');
    if (!(item instanceof HTMLLIElement) || !list.contains(item)) return;
    const id = parseTodoId(item.dataset.id);
    if (id === null) return;
    const todo = todos.find((todo) => todo.id === id);
    if (todo === undefined) return;
    const actionButton = event.target.closest('[data-action]');
    if (actionButton instanceof HTMLElement && item.contains(actionButton)) {
      handleAction(actionButton.dataset.action, todo);
      return;
    }
    toggleTask(event, event.target, id);
  }

  button.addEventListener('click', submitTodo);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.isComposing) submitTodo();
  });
  for (const filterButton of filters.querySelectorAll('button')) {
    filterButton.addEventListener('click', () => {
      const filter = filterButton.dataset.filter;
      if (!isFilter(filter)) return;
      currentFilter = filter;
      render();
    });
  }
  // 保留第八周的事件委托：render 中不绑定监听器。
  list.addEventListener('click', handleListClick);
  loadTodos();
  render();
}

const appTitle = import.meta.env.VITE_APP_TITLE;
if (appTitle) document.title = appTitle;
initTodo();
