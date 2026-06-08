<template>
  <el-config-provider namespace="el">
    <div class="app-shell">
      <aside class="sidebar">
        <section class="brand-block">
          <div class="brand-mark">
            <Cpu />
          </div>
          <div>
            <h1>坏例工坊</h1>
            <p>DeepSeek Agent Bad Case Ops</p>
          </div>
        </section>

        <el-menu class="nav-menu" :default-active="activeView" @select="setView">
          <el-menu-item index="inbox">
            <el-icon><Tickets /></el-icon>
            <span>坏例收件箱</span>
          </el-menu-item>
          <el-menu-item index="agent">
            <el-icon><Cpu /></el-icon>
            <span>Agent 巡检</span>
          </el-menu-item>
          <el-menu-item index="eval">
            <el-icon><DataAnalysis /></el-icon>
            <span>评测实验室</span>
          </el-menu-item>
          <el-menu-item index="stack">
            <el-icon><Connection /></el-icon>
            <span>中文技术栈</span>
          </el-menu-item>
        </el-menu>

        <section class="deepseek-card">
          <div class="card-title">
            <el-icon><MagicStick /></el-icon>
            <span>DeepSeek V4 Flash</span>
          </div>
          <el-segmented v-model="agentMode" :options="agentModes" />
          <p>{{ agentMode === "人工门禁" ? "Agent 自动生成诊断和 eval，上线动作保留人工审批。" : "低风险坏例自动入库、自动回归，P0/P1 仍走门禁。" }}</p>
          <el-button type="primary" size="large" @click="runAgent">
            <el-icon><VideoPlay /></el-icon>
            运行 Agent
          </el-button>
        </section>
      </aside>

      <main class="workspace">
        <header class="topbar">
          <div>
            <p class="eyebrow">中文 AI 产品经理作品集 / 面向国内研发团队</p>
            <h2>{{ viewTitle }}</h2>
          </div>
          <div class="topbar-actions">
            <el-tag type="success" size="large">Vue 3 + Element Plus</el-tag>
            <el-tag :type="backendHealth?.database_connected ? 'success' : 'info'" size="large">
              {{ backendLabel }}
            </el-tag>
            <el-button @click="activeView = 'eval'">
              <el-icon><SetUp /></el-icon>
              生成评测集
            </el-button>
          </div>
        </header>

        <section class="metric-strip">
          <MetricCard label="P0/P1 待处理" :value="String(stats.p0p1)" tone="danger" icon="WarningFilled" />
          <MetricCard label="影响用户" :value="String(stats.totalUsers)" tone="teal" icon="User" />
          <MetricCard label="修复前通过率" :value="`${stats.avgBefore}%`" tone="amber" icon="TrendCharts" />
          <MetricCard label="预计修复后" :value="`${stats.avgAfter}%`" tone="green" icon="CircleCheckFilled" />
        </section>

        <section v-if="activeView === 'inbox'" class="inbox-grid">
          <div class="case-column">
            <div class="toolbar">
              <el-input v-model="query" clearable placeholder="搜索坏例、根因、来源">
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
              <el-select v-model="activeFailure" class="failure-select" placeholder="失败类型">
                <el-option v-for="item in failureFilters" :key="item" :label="item" :value="item" />
              </el-select>
            </div>

            <div class="case-list">
              <button
                v-for="item in filteredCases"
                :key="item.id"
                class="case-row"
                :class="{ active: item.id === selectedId }"
                @click="selectedId = item.id"
              >
                <div class="case-row-top">
                  <span class="severity" :class="item.severity">{{ item.severity }}</span>
                  <span>{{ item.id }}</span>
                  <el-tag size="small">{{ item.status }}</el-tag>
                </div>
                <strong>{{ item.title }}</strong>
                <div class="case-row-meta">
                  <span>{{ item.failureMode }}</span>
                  <span>{{ item.affectedUsers }} users</span>
                  <span>{{ item.confidence }}% confidence</span>
                </div>
              </button>
            </div>
          </div>

          <section class="detail-panel">
            <div class="detail-header">
              <div>
                <div class="case-identity">
                  <span class="severity" :class="selectedCase.severity">{{ selectedCase.severity }}</span>
                  <span>{{ selectedCase.id }}</span>
                  <el-tag>{{ selectedCase.source }}</el-tag>
                </div>
                <h3>{{ selectedCase.title }}</h3>
              </div>
              <el-button type="primary" @click="runAgent">
                <el-icon><Cpu /></el-icon>
                Agent 诊断
              </el-button>
            </div>

            <div class="case-compare">
              <article>
                <span>用户意图</span>
                <p>{{ selectedCase.userIntent }}</p>
              </article>
              <article>
                <span>期望回答</span>
                <p>{{ selectedCase.expected }}</p>
              </article>
              <article class="actual">
                <span>实际坏例</span>
                <p>{{ selectedCase.actual }}</p>
              </article>
            </div>

            <div class="analysis-grid">
              <InfoBlock title="根因定位" :text="selectedCase.rootCause" icon="DataLine" />
              <InfoBlock title="产品风险" :text="selectedCase.risk" icon="Warning" />
              <InfoBlock title="修复模式" :text="selectedCase.fixPattern" icon="Operation" />
              <InfoBlock title="已生成评测" :text="`${selectedCase.evalCount} 条回归 case`" icon="DocumentChecked" />
            </div>

            <div class="evidence-block">
              <h4>Agent Evidence</h4>
              <div class="evidence-list">
                <el-tag v-for="item in selectedCase.evidence" :key="item" type="success">
                  {{ item }}
                </el-tag>
              </div>
            </div>

            <div class="recommendation">
              <div class="recommendation-icon">
                <MagicStick />
              </div>
              <div>
                <span>DeepSeek Agent 建议动作</span>
                <p>{{ selectedCase.agentRecommendation }}</p>
              </div>
            </div>
          </section>
        </section>

        <section v-if="activeView === 'agent'" class="agent-grid">
          <div class="runbook-panel">
            <div class="section-header">
              <div>
                <p class="eyebrow">Agent Orchestration</p>
                <h3>从坏例到可验证迭代</h3>
              </div>
              <el-button type="primary" @click="runAgent">
                <el-icon><VideoPause v-if="agentRunning" /><VideoPlay v-else /></el-icon>
                {{ agentRunning ? "运行中" : "重新运行" }}
              </el-button>
            </div>
            <el-progress :percentage="agentPercentage" :stroke-width="10" :show-text="false" />
            <div class="agent-steps">
              <article v-for="(step, index) in agentStepsView" :key="step.id" class="agent-step" :class="step.state">
                <div class="step-status">
                  <el-icon><CircleCheckFilled v-if="step.state === 'done'" /><Loading v-else-if="step.state === 'running'" /><Clock v-else /></el-icon>
                </div>
                <div>
                  <div class="step-header">
                    <strong>{{ step.name }}</strong>
                    <el-tag size="small">{{ step.tool }}</el-tag>
                  </div>
                  <p>{{ step.role }}</p>
                  <small v-if="index < agentProgress || step.state === 'running'">{{ step.output }}</small>
                </div>
              </article>
            </div>
          </div>

          <aside class="agent-side">
            <section class="side-panel">
              <div class="panel-title">
                <el-icon><Checked /></el-icon>
                <span>Human-in-the-loop 策略</span>
              </div>
              <div class="approval-rows">
                <ApprovalRow label="生成 eval case" value="自动允许" />
                <ApprovalRow label="创建需求卡" value="自动草拟" />
                <ApprovalRow label="修改 TiDB 规则库" :value="agentMode === '自动巡航' ? '低风险自动' : '需要审批'" />
                <ApprovalRow label="上线 prompt" value="P0/P1 门禁" />
              </div>
            </section>

            <section class="side-panel">
              <div class="panel-title">
                <el-icon><Memo /></el-icon>
                <span>Agent Memory</span>
              </div>
              <p>
                当前聚焦 {{ selectedCase.id }}，失败模式为 {{ selectedCase.failureMode }}。Agent 会把坏例扩展为同义问、边界问、反事实问和安全限制问。
              </p>
            </section>

            <section class="side-panel">
              <div class="panel-title">
                <el-icon><Promotion /></el-icon>
                <span>DeepSeek 调用策略</span>
              </div>
              <el-descriptions :column="1" size="small" border>
                <el-descriptions-item label="模型">deepseek-v4-flash</el-descriptions-item>
                <el-descriptions-item label="用途">分类、聚类、根因分析、eval 生成</el-descriptions-item>
                <el-descriptions-item label="兜底">高风险转 deepseek-v4-pro 或人工复核</el-descriptions-item>
              </el-descriptions>
            </section>

            <section v-if="liveAgentResult || agentError" class="side-panel">
              <div class="panel-title">
                <el-icon><DataAnalysis /></el-icon>
                <span>线上 Agent 结果</span>
              </div>
              <el-alert v-if="agentError" :title="agentError" type="error" :closable="false" />
              <el-descriptions v-else :column="1" size="small" border>
                <el-descriptions-item label="Case ID">{{ liveAgentResult?.case_id }}</el-descriptions-item>
                <el-descriptions-item label="模型">{{ liveAgentResult?.model }}</el-descriptions-item>
                <el-descriptions-item label="Fallback">{{ String(liveAgentResult?.fallback) }}</el-descriptions-item>
                <el-descriptions-item label="失败类型">{{ liveAgentResult?.result.failure_mode }}</el-descriptions-item>
              </el-descriptions>
            </section>
          </aside>
        </section>

        <section v-if="activeView === 'eval'" class="eval-grid">
          <div class="eval-main">
            <div class="section-header">
              <div>
                <p class="eyebrow">Eval Lab</p>
                <h3>由坏例自动生成的回归评测</h3>
              </div>
              <el-button type="primary">
                <el-icon><VideoPlay /></el-icon>
                Run Regression
              </el-button>
            </div>

            <el-table :data="evalCases" border class="eval-table">
              <el-table-column prop="id" label="Eval ID" width="96" />
              <el-table-column prop="caseId" label="来源坏例" width="110" />
              <el-table-column prop="prompt" label="用户问法" min-width="230" />
              <el-table-column prop="assertion" label="断言" min-width="280" />
              <el-table-column label="风险" width="86">
                <template #default="{ row }">
                  <span class="severity" :class="row.risk">{{ row.risk }}</span>
                </template>
              </el-table-column>
              <el-table-column label="结果" width="108">
                <template #default="{ row }">
                  <el-tag :type="resultType(row.result)">{{ resultText(row.result) }}</el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <aside class="experiment-panel">
            <div class="panel-title">
              <el-icon><DataAnalysis /></el-icon>
              <span>模型接入配置</span>
            </div>
            <el-form label-position="top" class="model-form">
              <el-form-item label="Base URL">
                <el-input model-value="https://api.deepseek.com" readonly />
              </el-form-item>
              <el-form-item label="Model ID">
                <el-input model-value="deepseek-v4-flash" readonly />
              </el-form-item>
              <el-form-item label="后端代理">
                <el-input model-value="/api/agent/deepseek/run" readonly />
              </el-form-item>
              <el-form-item label="结构化输出">
                <el-switch model-value active-text="JSON Schema" inactive-text="文本" />
              </el-form-item>
            </el-form>

            <div class="score-compare">
              <ScoreDial label="Before" :score="selectedCase.beforeScore" />
              <el-icon><Right /></el-icon>
              <ScoreDial label="After" :score="selectedCase.afterScore" />
            </div>
          </aside>
        </section>

        <section v-if="activeView === 'stack'" class="stack-grid">
          <section class="stack-main">
            <div class="section-header">
              <div>
                <p class="eyebrow">Chinese Developer Stack</p>
                <h3>给中文开发者展示的技术方案</h3>
              </div>
              <el-tag type="success" size="large">DeepSeek + Vue + TiDB</el-tag>
            </div>
            <div class="stack-cards">
              <article v-for="item in stackItems" :key="item.title" class="stack-card">
                <div class="stack-icon">
                  <component :is="item.icon" />
                </div>
                <div>
                  <h4>{{ item.title }}</h4>
                  <p>{{ item.description }}</p>
                  <el-tag v-for="tag in item.tags" :key="tag" size="small">{{ tag }}</el-tag>
                </div>
              </article>
            </div>
            <section class="quality-chart-panel">
              <div class="panel-title">
                <el-icon><TrendCharts /></el-icon>
                <span>ECharts 质量趋势</span>
              </div>
              <div ref="qualityChartEl" class="quality-chart" aria-label="bad case quality trend"></div>
            </section>
          </section>

          <aside class="code-panel">
            <div class="panel-title">
              <el-icon><Document /></el-icon>
              <span>后端代理示例</span>
            </div>
            <pre><code>{{ deepseekSnippet }}</code></pre>
          </aside>
        </section>
      </main>
    </div>
  </el-config-provider>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { BarChart } from "echarts/charts";
import { GridComponent, LegendComponent, TooltipComponent } from "echarts/components";
import { init, use, type ECharts } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import {
  Checked,
  CircleCheckFilled,
  Clock,
  Connection,
  Cpu,
  DataAnalysis,
  DataLine,
  Document,
  DocumentChecked,
  Loading,
  MagicStick,
  Memo,
  Operation,
  Promotion,
  Right,
  Search,
  SetUp,
  Tickets,
  TrendCharts,
  User,
  VideoPause,
  VideoPlay,
  Warning,
  WarningFilled
} from "@element-plus/icons-vue";
import { agentSteps, badCases, evalCases } from "./data";
import type { FailureMode, Severity } from "./types";

type View = "inbox" | "agent" | "eval" | "stack";
interface BackendHealth {
  database_connected: boolean;
  current_user: string | null;
  deepseek_configured: boolean;
  case_count: number;
}

interface LiveAgentResult {
  case_id: string;
  model: string;
  fallback: boolean;
  result: {
    failure_mode: string;
    root_cause: string;
  };
}

const activeView = ref<View>("inbox");
const selectedId = ref(badCases[0].id);
const query = ref("");
const activeFailure = ref<FailureMode | "全部">("全部");
const agentMode = ref("人工门禁");
const agentModes = ["人工门禁", "自动巡航"];
const agentRunning = ref(false);
const agentProgress = ref(2);
const backendHealth = ref<BackendHealth | null>(null);
const liveAgentResult = ref<LiveAgentResult | null>(null);
const agentError = ref("");
const apiBase = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
let timer: number | undefined;
const qualityChartEl = ref<HTMLDivElement | null>(null);
let qualityChart: ECharts | undefined;

use([BarChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer]);

const severityRank: Record<Severity, number> = { P0: 4, P1: 3, P2: 2, P3: 1 };

const failureFilters: Array<FailureMode | "全部"> = [
  "全部",
  "幻觉编造",
  "检索漏召",
  "意图识别错误",
  "流程越权",
  "上下文遗漏",
  "语气不当"
];

const selectedCase = computed(() => badCases.find((item) => item.id === selectedId.value) ?? badCases[0]);

const filteredCases = computed(() => {
  const keyword = query.value.trim().toLowerCase();
  return badCases
    .filter((item) => activeFailure.value === "全部" || item.failureMode === activeFailure.value)
    .filter((item) => {
      if (!keyword) return true;
      return [item.id, item.title, item.failureMode, item.source, item.rootCause]
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    })
    .sort((a, b) => severityRank[b.severity] - severityRank[a.severity]);
});

const stats = computed(() => {
  const p0p1 = badCases.filter((item) => item.severity === "P0" || item.severity === "P1").length;
  const totalUsers = badCases.reduce((sum, item) => sum + item.affectedUsers, 0);
  const avgBefore = Math.round(badCases.reduce((sum, item) => sum + item.beforeScore, 0) / badCases.length);
  const avgAfter = Math.round(badCases.reduce((sum, item) => sum + item.afterScore, 0) / badCases.length);
  return { p0p1, totalUsers, avgBefore, avgAfter };
});

const agentPercentage = computed(() => Math.round((Math.min(agentProgress.value, agentSteps.length) / agentSteps.length) * 100));
const backendLabel = computed(() => {
  if (!apiBase) return "本地演示模式";
  if (!backendHealth.value) return "API 检查中";
  return backendHealth.value.database_connected
    ? `Postgres · ${backendHealth.value.case_count} cases`
    : "API 未连接数据库";
});

const agentStepsView = computed(() =>
  agentSteps.map((step, index) => ({
    ...step,
    state: index < agentProgress.value ? "done" : index === agentProgress.value && agentRunning.value ? "running" : "queued"
  }))
);

const viewTitle = computed(() => {
  const titles: Record<View, string> = {
    inbox: "坏例收件箱",
    agent: "Agent 巡检",
    eval: "评测实验室",
    stack: "中文技术栈"
  };
  return titles[activeView.value];
});

const stackItems = [
  {
    title: "前端",
    description: "Vue 3 + Element Plus 构建中文后台体验，ECharts 做质量趋势和 failure mode 分布。",
    tags: ["Vue", "Element Plus", "ECharts"],
    icon: DataAnalysis
  },
  {
    title: "后端",
    description: "MidwayJS 或 Egg.js 做 BFF 和 Agent 编排层，统一代理 DeepSeek 请求并做权限、审计、限流。",
    tags: ["MidwayJS", "Egg.js", "阿里云函数"],
    icon: Connection
  },
  {
    title: "数据库",
    description: "TiDB 存储坏例、eval、迭代记录；openGauss 可作为国产化替代方案；Milvus/Zilliz 存向量召回。",
    tags: ["TiDB", "openGauss", "Milvus"],
    icon: DataLine
  },
  {
    title: "模型",
    description: "DeepSeek V4 Flash 承担低成本高吞吐分析，P0/P1 可升级到 V4 Pro 或进入人工复核。",
    tags: ["DeepSeek", "JSON Schema", "Tool Calling"],
    icon: MagicStick
  }
];

const deepseekSnippet = `// MidwayJS / Egg 风格：前端不要直连，避免泄露 API Key
POST /api/agent/deepseek/run

await fetch("https://api.deepseek.com/chat/completions", {
  method: "POST",
  headers: {
    Authorization: \`Bearer \${process.env.DEEPSEEK_API_KEY}\`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    model: "deepseek-v4-flash",
    messages: [
      { role: "system", content: "你是 AI Bad Case 诊断 Agent，必须输出 JSON。" },
      { role: "user", content: badCasePayload }
    ],
    response_format: { type: "json_object" }
  })
});`;

function setView(index: string) {
  activeView.value = index as View;
}

async function runAgent() {
  activeView.value = "agent";
  agentRunning.value = true;
  agentProgress.value = 0;
  agentError.value = "";
  liveAgentResult.value = null;
  window.clearInterval(timer);
  timer = window.setInterval(() => {
    const limit = apiBase ? agentSteps.length - 1 : agentSteps.length;
    if (agentProgress.value >= limit) {
      if (apiBase) return;
      agentRunning.value = false;
      window.clearInterval(timer);
      return;
    }
    agentProgress.value += 1;
  }, 850);

  if (!apiBase) return;

  try {
    const response = await fetch(`${apiBase}/api/agent/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: selectedCase.value.title,
        source: selectedCase.value.source,
        user_intent: selectedCase.value.userIntent,
        expected_answer: selectedCase.value.expected,
        actual_answer: selectedCase.value.actual,
        evidence: selectedCase.value.evidence
      })
    });
    const data = (await response.json()) as LiveAgentResult & { error?: string };
    if (!response.ok) throw new Error(data.error ?? `API HTTP ${response.status}`);
    liveAgentResult.value = data;
    agentProgress.value = agentSteps.length;
    await loadHealth();
  } catch (error) {
    agentError.value = error instanceof Error ? error.message : "Agent 调用失败";
  } finally {
    agentRunning.value = false;
    window.clearInterval(timer);
  }
}

async function loadHealth() {
  if (!apiBase) return;
  try {
    const response = await fetch(`${apiBase}/health`);
    if (!response.ok) return;
    backendHealth.value = (await response.json()) as BackendHealth;
  } catch {
    backendHealth.value = null;
  }
}

function renderQualityChart() {
  if (!qualityChartEl.value) return;
  qualityChart = init(qualityChartEl.value);
  qualityChart.setOption({
    color: ["#c88a1e", "#0f9b8e"],
    grid: { left: 36, right: 18, top: 34, bottom: 30 },
    tooltip: { trigger: "axis" },
    legend: { top: 0, right: 0 },
    xAxis: {
      type: "category",
      data: badCases.map((item) => item.id),
      axisLine: { lineStyle: { color: "#c7d3d2" } },
      axisLabel: { color: "#65737b" }
    },
    yAxis: {
      type: "value",
      min: 0,
      max: 100,
      axisLabel: { color: "#65737b", formatter: "{value}%" },
      splitLine: { lineStyle: { color: "#e5eeee" } }
    },
    series: [
      {
        name: "修复前",
        type: "bar",
        data: badCases.map((item) => item.beforeScore),
        barMaxWidth: 24,
        borderRadius: [4, 4, 0, 0]
      },
      {
        name: "修复后",
        type: "bar",
        data: badCases.map((item) => item.afterScore),
        barMaxWidth: 24,
        borderRadius: [4, 4, 0, 0]
      }
    ]
  });
}

watch(activeView, async (view) => {
  if (view !== "stack") {
    qualityChart?.dispose();
    qualityChart = undefined;
    return;
  }

  await nextTick();
  renderQualityChart();
});

function resultText(result: "pass" | "fail" | "needs_review") {
  if (result === "pass") return "Pass";
  if (result === "fail") return "Fail";
  return "Review";
}

function resultType(result: "pass" | "fail" | "needs_review") {
  if (result === "pass") return "success";
  if (result === "fail") return "danger";
  return "warning";
}

onBeforeUnmount(() => {
  window.clearInterval(timer);
  qualityChart?.dispose();
});

onMounted(loadHealth);

const MetricCard = defineComponent({
  props: {
    label: { type: String, required: true },
    value: { type: String, required: true },
    tone: { type: String, required: true },
    icon: { type: String, required: true }
  },
  setup(props) {
    const iconMap = { WarningFilled, User, TrendCharts, CircleCheckFilled } as Record<string, unknown>;
    return () =>
      h("article", { class: ["metric-card", props.tone] }, [
        h("div", { class: "metric-icon" }, [h(iconMap[props.icon] as never)]),
        h("div", null, [h("p", null, props.label), h("strong", null, props.value)])
      ]);
  }
});

const InfoBlock = defineComponent({
  props: {
    title: { type: String, required: true },
    text: { type: String, required: true },
    icon: { type: String, required: true }
  },
  setup(props) {
    const iconMap = { DataLine, Warning, Operation, DocumentChecked } as Record<string, unknown>;
    return () =>
      h("article", { class: "info-block" }, [
        h("div", { class: "info-title" }, [h(iconMap[props.icon] as never), h("span", null, props.title)]),
        h("p", null, props.text)
      ]);
  }
});

const ApprovalRow = defineComponent({
  props: {
    label: { type: String, required: true },
    value: { type: String, required: true }
  },
  setup(props) {
    return () => h("div", { class: "approval-row" }, [h("span", null, props.label), h("strong", null, props.value)]);
  }
});

const ScoreDial = defineComponent({
  props: {
    label: { type: String, required: true },
    score: { type: Number, required: true }
  },
  setup(props) {
    return () =>
      h("div", { class: "score-dial", style: { "--score": `${props.score}%` } }, [
        h("strong", null, `${props.score}%`),
        h("span", null, props.label)
      ]);
  }
});
</script>
