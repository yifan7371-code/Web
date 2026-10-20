# 第八周任务式实验

起点是 `07/第7周全部5轮代码/round05` 的原始文件，本目录的初始 Git 提交保存该基线。未采用此前第八周的实现、代码快照或截图。

根目录 index.html、style.css、app.js 与“任务3_编辑功能”一致，是最终版本。使用本地 HTTP 服务器打开 index.html，无框架与额外网页依赖。

- 任务1_事件委托：列表只在 ul 绑定一个 click，新增节点不重新绑监听器。
- 任务2_缺陷调试：修复前保留模板的删除后继续 toggle 缺陷；修复后用 return 分流。
- 任务3_编辑功能：删除、编辑、切换互斥；检查取消、空值和无变化输入，保留完成状态并按保存结果提示。

每个任务的“任务说明.md”记录输入目标、判断及验证结果。修复前目录只用于复现缺陷。

修订报告、5张截图和验证 JSON 见 `docs/week08/`。截图右侧是由 Chrome 实际 console 事件采集的日志面板，不是原生 DevTools 截图。任务3的19项浏览器检查和两个反例对照均有记录。

`tools/verify_tasks.cjs` 是浏览器复核脚本，网页本身仍无额外依赖。复核环境需提供 Playwright 和 Chrome，可用 PLAYWRIGHT_MODULE、CHROME_PATH 指定位置；运行 `node tools/verify_tasks.cjs task3` 验证最终任务3版本。测试会使用临时浏览器配置，不读取个人浏览器数据。

原仓库链接：https://github.com/yifan7371-code/Web

任务式实验保留 `feature/w8-task-based` 的分任务提交；本次任务3修订分支为 `feature/w8-task3-process`，最终版本使用 main。GitHub 原有第七周提交、round01～round05说明和截图均保留在历史及目录中。
