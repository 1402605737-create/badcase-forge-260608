# 坏例工坊 Bad Case Agent Ops

- GitHub：https://github.com/1402605737-create/badcase-forge-260608
- Demo：https://badcase-forge-260608-web.vercel.app
- Health：https://badcase-forge-260608-api.vercel.app/health

面向中文 AI 产品经理与研发团队的 bad case 诊断、评测生成和迭代门禁工作台。

## 隔离架构

- APP_SLUG：`badcase-forge-260608`
- Supabase Schema：`badcase_forge_260608`
- PostgreSQL LOGIN Role：`badcase_forge_260608_app`
- 后端 Vercel 项目：`badcase-forge-260608-api`
- 前端 Vercel 项目：`badcase-forge-260608-web`

生产应用角色不是表所有者，不具备 DDL、BYPASSRLS、其他 Schema 或其他项目数据权限。生产运行时代码不会建表、迁移或设置 `search_path`，所有 SQL 显式使用 `badcase_forge_260608.table_name`。

## 技术栈

- 前端：Vue 3 + Element Plus + ECharts
- 后端：Vercel Node.js Serverless Functions
- 数据库：现有 Supabase Free PostgreSQL 项目中的独立 Schema 与独立 LOGIN Role
- 模型：DeepSeek V4 Flash

## 本地运行

```bash
npm install
npm --prefix backend install
npm run dev
```

## 安全部署

1. 管理员在 Supabase SQL Editor 一次性执行由 `db/supabase_init.template.sql` 生成的临时初始化 SQL。
2. 后端生产环境只配置应用角色的 Transaction Pooler 连接串，端口必须为 `6543`。
3. 前端只配置 `VITE_API_BASE_URL`。
4. 后端 CORS 只允许正式前端域名。

后端生产环境变量示例见 `backend/.env.example`。真实密码、连接串与 API Key 不得提交。
