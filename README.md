# Todo 第七周实验

原生 HTML、CSS、JavaScript 实现的待办清单。支持添加、删除、完成状态切换、全部/进行中/已完成筛选，以及 localStorage 保存与恢复。

## 运行

index.html、style.css、app.js 留在同一目录。建议用本地HTTP服务器打开；例如安装了Python时，在本目录运行 python -m http.server 8000，再访问 http://127.0.0.1:8000。

## 数据更新

todos 是完整任务数据，currentFilter 只负责筛选视图。添加使用展开，删除使用filter，切换使用map与对象展开；修改数据后尝试保存，再render。保存失败时仍更新页面并给出提示。

clearCompleted() 为AI协助给出的参考实现，可在控制台调用。它不作为已完成禁用AI独立练习的证明。

## 版本管理

第六周基线保留在历史中。第七周在 feature/todo-complete 分支迭代，经核对后合并回 main。round01.md 至 round05.md 为相应的Prompt与审查记录。

仓库：https://github.com/yifan7371-code/Web
