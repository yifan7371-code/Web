import { test, expect } from 'vitest';
import {
  addTodo,
  toggleTodo,
  deleteTodo,
  updateTodo,
  parseTodoId,
  restoreTodos,
} from '../src/todo';
import type { Todo } from '../src/todo';

// 正常路径：内容和初始状态
test('去掉两端空格，保留中间空格', () => {
  const todos: Todo[] = [];
  expect(addTodo(todos, '  学习 TS  ')).toBe(true);
  expect(todos).toEqual([{ id: 1, text: '学习 TS', completed: false }]);
});

// 维度1：空值
test('null 和 undefined 不影响已有任务', () => {
  const todos: Todo[] = [{ id: 4, text: '原任务', completed: true }];
  expect(addTodo(todos, null)).toBe(false);
  expect(addTodo(todos, undefined)).toBe(false);
  expect(todos).toEqual([{ id: 4, text: '原任务', completed: true }]);
});

// 维度2：格式
test('制表符、换行和全角空格也算空白', () => {
  const todos: Todo[] = [];
  expect(addTodo(todos, '\t\n\u3000')).toBe(false);
  expect(todos).toEqual([]);
});

// 维度2：长度两侧
test('200 个字符能添加，201 个不能添加', () => {
  const todos: Todo[] = [];
  const text = 'a'.repeat(200);
  expect(addTodo(todos, text)).toBe(true);
  expect(addTodo(todos, text + 'a')).toBe(false);
  expect(todos).toEqual([{ id: 1, text, completed: false }]);
});

// 维度2：先 trim 再判断长度
test('两端空白不计入保存长度', () => {
  const todos: Todo[] = [];
  const text = '中'.repeat(200);
  expect(addTodo(todos, ' ' + text + '\n')).toBe(true);
  expect(todos[0].text).toBe(text);
});

// 维度3：错误类型，不用硬转绕过编译器
test('数字、布尔、对象、数组和 NaN 不是任务文本', () => {
  const todos: Todo[] = [{ id: 1, text: '原任务', completed: false }];
  const values: unknown[] = [123, false, {}, [], NaN];
  for (const value of values) expect(addTodo(todos, value)).toBe(false);
  expect(todos).toEqual([{ id: 1, text: '原任务', completed: false }]);
});

// 维度3：编号必须为正安全整数
test('无效编号不切换任务', () => {
  const todos: Todo[] = [{ id: 1, text: '原任务', completed: false }];
  const ids: unknown[] = [
    '1',
    NaN,
    Infinity,
    0,
    -1,
    1.5,
    Number.MAX_SAFE_INTEGER + 1,
  ];
  for (const id of ids) expect(toggleTodo(todos, id)).toBe(false);
  expect(todos).toEqual([{ id: 1, text: '原任务', completed: false }]);
});

// 维度3/4：dataset 的转换入口
test('dataset 先转换再检查，空白不能变成合法编号', () => {
  expect(parseTodoId(' 12 ')).toBe(12);
  for (const raw of [
    undefined,
    '',
    ' ',
    '123abc',
    '1.5',
    '0',
    '-1',
    'Infinity',
    '9007199254740992',
  ]) {
    expect(parseTodoId(raw)).toBe(null);
  }
});

// 维度4：空数组与不存在的编号
test('空数组和未知编号都安静返回', () => {
  const todos: Todo[] = [];
  expect(toggleTodo(todos, 99)).toBe(false);
  expect(deleteTodo(todos, 99)).toBe(false);
  expect(updateTodo(todos, 99, '新文本')).toBe(false);
  expect(todos).toEqual([]);
});

// 维度4：数字精度
test('最大安全整数之后不再分配编号', () => {
  const todos: Todo[] = [
    { id: Number.MAX_SAFE_INTEGER, text: '原任务', completed: false },
  ];
  expect(addTodo(todos, '新任务')).toBe(false);
  expect(todos).toEqual([
    { id: Number.MAX_SAFE_INTEGER, text: '原任务', completed: false },
  ]);
});

// 维度5：删除后的状态
test('删除后再操作旧编号，不影响剩余任务', () => {
  const todos: Todo[] = [
    { id: 1, text: '要删除', completed: false },
    { id: 2, text: '保留', completed: true },
  ];
  expect(deleteTodo(todos, 1)).toBe(true);
  expect(toggleTodo(todos, 1)).toBe(false);
  expect(deleteTodo(todos, 1)).toBe(false);
  expect(todos).toEqual([{ id: 2, text: '保留', completed: true }]);
});

// 维度5：编辑不能重置完成状态
test('编辑完成任务保留状态，非法内容保留原文', () => {
  const todos: Todo[] = [{ id: 1, text: '原任务', completed: true }];
  expect(updateTodo(todos, 1, ' 修改后 ')).toBe(true);
  expect(updateTodo(todos, 1, '   ')).toBe(false);
  expect(updateTodo(todos, 1, '<ScRiPt>alert(1)</ScRiPt>')).toBe(false);
  expect(todos).toEqual([{ id: 1, text: '修改后', completed: true }]);
});

// 维度6：重复文本允许，编号不能重复
test('连续添加相同文本得到两个不同编号', () => {
  const todos: Todo[] = [];
  addTodo(todos, '学习TS');
  addTodo(todos, '学习TS');
  expect(todos).toEqual([
    { id: 1, text: '学习TS', completed: false },
    { id: 2, text: '学习TS', completed: false },
  ]);
  expect(todos[0].id).not.toBe(todos[1].id);
});

// 维度6：切换不是幂等操作
test('连续切换两次回到原状态', () => {
  const todos: Todo[] = [{ id: 7, text: '学习TS', completed: false }];
  toggleTodo(todos, 7);
  expect(todos[0].completed).toBe(true);
  toggleTodo(todos, 7);
  expect(todos).toEqual([{ id: 7, text: '学习TS', completed: false }]);
});

// 维度8：只测外部数据结构的校验，不读写 localStorage
test('恢复时过滤脏数据和重复编号', () => {
  const data: unknown = [
    null,
    { id: '1', text: '错误类型', completed: false },
    { id: 1, text: ' 恢复任务 ', completed: true },
    { id: 1, text: '重复编号', completed: false },
    { id: 2, text: ' ', completed: false },
    { id: 3, text: '错误状态', completed: 'false' },
    { id: 4, text: '<script>x</script>', completed: false },
  ];
  expect(restoreTodos(data)).toEqual([
    { id: 1, text: '恢复任务', completed: true },
  ]);
  expect(restoreTodos({})).toEqual([]);
  expect(restoreTodos(null)).toEqual([]);
});

// 维度9：不只测小写标签，拒绝后原任务仍保留
test('拒绝小写和混合大小写 script 标签', () => {
  const todos: Todo[] = [{ id: 3, text: '原任务', completed: true }];
  expect(addTodo(todos, '<script>alert(1)</script>')).toBe(false);
  expect(addTodo(todos, '<ScRiPt src="x.js"></ScRiPt>')).toBe(false);
  expect(todos).toEqual([{ id: 3, text: '原任务', completed: true }]);
});

// 维度9：普通标签样式文字由渲染层作纯文本显示
test('普通 HTML 样式文字保留原文', () => {
  const todos: Todo[] = [];
  const text = '<b>复习TS</b>';
  expect(addTodo(todos, text)).toBe(true);
  expect(todos).toEqual([{ id: 1, text, completed: false }]);
});
