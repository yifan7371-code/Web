import { test, expect } from 'vitest';
import { addTodo, toggleTodo } from '../src/todo';
import type { Todo } from '../src/todo';

test('正常添加，文本和初始状态正确', () => {
  const todos: Todo[] = [];
  addTodo(todos, '学习TS');
  expect(todos.length).toBe(1);
  expect(todos[0].text).toBe('学习TS');
  expect(todos[0].completed).toBe(false);
  expect(todos[0].id).toBe(1);
});

test('纯空格不添加，也不改变原任务', () => {
  const todos: Todo[] = [{ id: 1, text: '原任务', completed: true }];
  addTodo(todos, '   ');
  expect(todos).toEqual([{ id: 1, text: '原任务', completed: true }]);
});

test('空字符串不添加', () => {
  const todos: Todo[] = [];
  addTodo(todos, '');
  expect(todos.length).toBe(0);
});

test('只切换指定任务，能够从完成状态切回来', () => {
  const todos: Todo[] = [
    { id: 1, text: '学习TS', completed: false },
    { id: 2, text: '写测试', completed: false },
  ];
  toggleTodo(todos, 1);
  expect(todos[0].completed).toBe(true);
  expect(todos[1]).toEqual({ id: 2, text: '写测试', completed: false });
  toggleTodo(todos, 1);
  expect(todos[0].completed).toBe(false);
});

test('不存在的编号不报错，原数据不变', () => {
  const todos: Todo[] = [{ id: 1, text: '学习TS', completed: false }];
  expect(() => toggleTodo(todos, 999)).not.toThrow();
  expect(todos).toEqual([{ id: 1, text: '学习TS', completed: false }]);
});
