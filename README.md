# 坏例工坊 Bad Case Agent Ops

- GitHub：https://github.com/1402605737-create/badcase-forge-260608
- Demo：https://badcase-forge-260608-web.vercel.app
- Health：https://badcase-forge-260608-api.vercel.app/health

面向中文 AI 产品经理与研发团队的 bad case 诊断、评测生成和迭代门禁工作台。
<img width="1270" height="1307" alt="image" src="https://github.com/user-attachments/assets/89cd2b3c-12df-43d0-8ab4-59670f50cdee" />

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
## 核心功能
内置多类中文 AI Bad Case，覆盖幻觉编造、检索漏召、意图识别错误、上下文遗漏、流程越权与语气不当等质量问题。
展示坏例从收集、分级、根因诊断、修复建议，到生成评测集和回归验证的完整迭代闭环。
DeepSeek Agent 自动扫描对话日志、聚类失败模式、定位根因，并生成可执行的修复方案与产品需求卡。
支持 Human-in-the-loop 门禁：低风险问题可自动处理，P0/P1 合规与高风险问题必须经过人工审批。
将真实 Bad Case 自动扩展为同义问、边界问和安全限制问，形成可持续复用的 Eval 回归评测集。
支持修复前后 Prompt、RAG 与模型策略对比，展示通过率、幻觉率、人工接管率等质量指标变化。
DeepSeek V4 Flash 调用记录可追踪，明确展示模型、Agent 执行轨迹、失败原因、Fallback 状态与最终业务结果。
使用独立 Supabase Schema、独立数据库角色与独立 Vercel 前后端项目，实现数据隔离、最小权限和线上安全审计。
