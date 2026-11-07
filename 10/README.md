# 第10周 待办清单 V3.0

基于第9周 TypeScript 代码整理工程结构，保留添加、删除、编辑、完成状态切换、筛选和本地存储。

## 运行

建议使用 Node.js 20 LTS 或更高版本及 npm。进入本目录执行：

```sh
npm ci
npm run dev
```

访问终端给出的地址。构建产物应使用 HTTP 服务访问，不能直接双击 TypeScript 源页面。

## 验收

```sh
npx eslint src/
npm run lint:all
npm run format:check
npm run test
npm run build
npm run preview
```

build 固定为 `tsc --noEmit && vite build`，test 固定为 `vitest run`，TypeScript 开启 strict。ESLint 使用课堂要求的 `.eslintrc.cjs`，因此固定 ESLint 8.57.1，复杂度上限10、嵌套上限3、禁止显式 any。当前验收为0错误、0警告，22条业务单测通过。

## 文件

- `index.html`：Vite HTML入口。
- `src/main.ts`：DOM、事件委托、本地存储。列表点击按编辑、删除和状态切换拆分函数。
- `src/todo.ts`：第9周数据层，业务规则保持不变。
- `src/style.css`：沿用上周样式。
- `src/vite-env.d.ts`：Vite 环境变量类型。
- `tests/`：沿用第9周22条单测，仅调整导入路径。

## 业务约定

文本先 trim，允许1至200个UTF-16代码单元，拒绝纯空白和 script 起始标签。重复文本允许添加，编号为列表内唯一的正安全整数。完成状态允许反复切换，编辑保留完成状态。存储键仍为 `todos`，刷新恢复并过滤非法记录与重复编号，保存失败时显示提示。页面使用 textContent 显示文本。

## 环境与部署

可将 `.env.example` 复制为根目录 `.env.local`，通过 `VITE_APP_TITLE` 设置公开页面标题；修改后重启开发服务，生产环境重新构建。没有配置时沿用 HTML 的标题。VITE\_变量会进入前端产物，不能放密码、私钥或付费密钥。本地环境文件已忽略，仅提交无秘密的模板。

当前任务数据保存在 localStorage，没有后端 API，因此不添加无效代理。后续若接入接口，开发环境可用 Vite 的 server.proxy 转发同源 /api 请求，生产环境需另配反向代理或后端 CORS。changeOrigin 调整代理的 Host 行为，不能代替 CORS 授权。
