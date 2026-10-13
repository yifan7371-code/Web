function initTodo() {
    const input = document.querySelector('#todo-input');
    const button = document.querySelector('#add-btn');
    const list = document.querySelector('#todo-list');
    const message = document.querySelector('#todo-message');

    // 先检查依赖，再注册事件。
    if (!input || !button || !list || !message) {
        console.error('Todo 初始化失败：缺少必要的页面元素。');
        if (button) button.disabled = true;
        if (message) {
            message.textContent = '暂时无法添加待办。';
        }
        return;
    }

    button.addEventListener('click', function () {
        const text = input.value.trim();
        if (text === '') {
            message.textContent = '请先输入待办事项。';
            input.focus();
            return;
        }

        const li = document.createElement('li');
        // 待办内容按纯文本显示，不解析为 HTML。
        li.textContent = text;
        list.appendChild(li);

        input.value = '';
        message.textContent = '已添加。';
        input.focus();
    });
}

initTodo();
