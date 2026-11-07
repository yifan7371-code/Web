export interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

export type Filter = 'all' | 'active' | 'completed';
export const MAX_TEXT_LENGTH = 200;

export function isValidId(id: unknown): id is number {
  return typeof id === 'number' && Number.isSafeInteger(id) && id > 0;
}

export function parseTodoId(raw: string | undefined): number | null {
  if (raw === undefined || raw.trim() === '') return null;
  const id = Number(raw);
  return isValidId(id) ? id : null;
}

export function isFilter(value: unknown): value is Filter {
  return value === 'all' || value === 'active' || value === 'completed';
}

export function normalizeText(text: unknown): string | null {
  if (typeof text !== 'string') return null;
  const value = text.trim();
  if (value === '' || value.length > MAX_TEXT_LENGTH) return null;
  // 数据层拒绝 script 标签，页面仍用 textContent 输出。
  if (/<\s*script\b/i.test(value)) return null;
  return value;
}

// 重复文本允许添加，每条任务的 id 不同；返回是否修改成功。
export function addTodo(todos: Todo[], text: unknown): boolean {
  const value = normalizeText(text);
  if (value === null) return false;
  let maxId = 0;
  for (const todo of todos) maxId = Math.max(maxId, todo.id);
  const id = maxId + 1;
  if (!isValidId(id)) return false;
  todos.push({ id, text: value, completed: false });
  return true;
}

export function toggleTodo(todos: Todo[], id: unknown): boolean {
  if (!isValidId(id)) return false;
  const todo = todos.find((item) => item.id === id);
  if (todo === undefined) return false;
  todo.completed = !todo.completed;
  return true;
}

export function deleteTodo(todos: Todo[], id: unknown): boolean {
  if (!isValidId(id)) return false;
  const index = todos.findIndex((item) => item.id === id);
  if (index === -1) return false;
  todos.splice(index, 1);
  return true;
}

export function updateTodo(todos: Todo[], id: unknown, text: unknown): boolean {
  if (!isValidId(id)) return false;
  const value = normalizeText(text);
  const todo = todos.find((item) => item.id === id);
  if (value === null || todo === undefined) return false;
  todo.text = value;
  return true;
}

export function isTodo(value: unknown): value is Todo {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    isValidId(value.id) &&
    'text' in value &&
    normalizeText(value.text) !== null &&
    'completed' in value &&
    typeof value.completed === 'boolean'
  );
}

export function restoreTodos(data: unknown): Todo[] {
  if (!Array.isArray(data)) return [];
  const items: unknown[] = data;
  const todos: Todo[] = [];
  for (const item of items) {
    if (!isTodo(item) || todos.some((todo) => todo.id === item.id)) continue;
    todos.push({
      id: item.id,
      text: item.text.trim(),
      completed: item.completed,
    });
  }
  return todos;
}
