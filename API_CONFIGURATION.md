# Antigravity 代理 API 配置指南

本文档详细说明了如何配置 Antigravity 代理服务，以便在本项目中使用 Google Gemini API。

---

## 目录

1. [配置概述](#配置概述)
2. [前置要求](#前置要求)
3. [配置步骤](#配置步骤)
4. [环境变量详解](#环境变量详解)
5. [API 调用机制](#api-调用机制)
6. [模型降级策略](#模型降级策略)
7. [测试验证](#测试验证)
8. [常见问题](#常见问题)

---

## 配置概述

本项目使用 **Antigravity 代理服务** 来调用 Google Gemini API。配置完成后，项目将通过本地代理 (`http://127.0.0.1:8045`) 以 **Anthropic Messages API 格式** 访问 Gemini 模型。

### 核心配置组件

```
┌─────────────┐      ┌──────────────────┐      ┌─────────────┐
│  前端应用    │ ───▶ │ Antigravity 代理  │ ───▶ │ Gemini API  │
│ (React+TS)  │      │  (localhost:8045) │      │  (Google)   │
└─────────────┘      └──────────────────┘      └─────────────┘
```

---

## 前置要求

### 1. 确保 Antigravity 代理已启动

运行以下命令检查代理是否在运行：

```bash
lsof -i :8045
```

**预期输出示例：**
```
COMMAND    PID USER   FD   TYPE    DEVICE SIZE/OFF NODE NAME
antigravi  1440 user  15u  IPv4   ...      0t0  TCP localhost:8045 (LISTEN)
```

如果未运行，请先启动 Antigravity 代理服务。

### 2. 获取 API Key

您需要一个有效的 Antigravity API Key，格式通常为：
```
sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 配置步骤

### 第一步：创建环境变量文件

在项目根目录创建或编辑 `.env.local` 文件：

```bash
cd /Users/h/Downloads/ai-建工法律咨询geo营销系统
nano .env.local  # 或使用其他编辑器
```

### 第二步：填写配置信息

将以下内容复制到 `.env.local` 文件中：

```env
# Antigravity 代理配置
VITE_GEMINI_API_KEY=sk-0f1d2a47c3e74ec49bbed8d506973da5

# Antigravity 代理基础 URL
VITE_ANTIGRAVITY_BASE_URL=http://127.0.0.1:8045

# API 格式（固定为 anthropic）
VITE_API_FORMAT=anthropic

# 主要使用的模型
VITE_PRIMARY_MODEL=gemini-3-pro-high
```

### 第三步：保存并重启开发服务器

```bash
# 如果开发服务器正在运行，停止它（Ctrl+C）
# 然后重新启动
npm run dev
```

---

## 环境变量详解

| 变量名 | 说明 | 示例值 | 必填 |
|--------|------|--------|------|
| `VITE_GEMINI_API_KEY` | Antigravity 提供的 API 密钥 | `sk-xxxxx...` | ✅ 是 |
| `VITE_ANTIGRAVITY_BASE_URL` | 代理服务器地址 | `http://127.0.0.1:8045` | ✅ 是 |
| `VITE_API_FORMAT` | API 调用格式（固定值） | `anthropic` | ✅ 是 |
| `VITE_PRIMARY_MODEL` | 首选模型（当前未使用） | `gemini-3-pro-high` | ⚠️ 可选 |

### ⚠️ 重要提示

- **不要提交 `.env.local` 到版本控制**：该文件已在 `.gitignore` 中排除
- **API Key 为敏感信息**：切勿在公开场合分享
- **本地开发专用**：生产环境需使用不同的配置方式

---

## API 调用机制

### 请求格式（Anthropic Messages API）

项目中的 `services/geminiService.ts` 使用以下格式调用 API：

```typescript
const response = await fetch(`${baseUrl}/v1/messages`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01'
  },
  body: JSON.stringify({
    model: 'gemini-3-pro-high',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: '您的 Prompt 内容'
      }
    ]
  })
});
```

### 响应格式

成功的响应结构：

```json
{
  "content": [
    {
      "text": "AI 生成的内容",
      "type": "text"
    }
  ],
  "id": "msg_xxx",
  "model": "gemini-3-pro-high",
  "role": "assistant",
  "stop_reason": "end_turn"
}
```

项目会提取 `data.content[0].text` 作为最终结果。

---

## 模型降级策略

为了提高稳定性，系统配置了 **自动模型降级策略**。当某个模型不可用时，会自动尝试下一个模型。

### 模型优先级列表

```typescript
const AVAILABLE_MODELS = [
  'gemini-3-pro-high',   // ✅ 优先 - 最强大，能力最强
  'gemini-3-flash',      // ✅ 备选 - 最快，适合简单任务
  'gemini-2.5-flash',    // ✅ 备选 - 平衡性能与速度
  'gemini-3-pro-low'     // ✅ 最后 - 省资源，最后备用
];
```

### 降级流程

```
┌─────────────────┐
│ 尝试 Model 1     │
│ gemini-3-pro-high│
└────────┬─────────┘
         │ 失败 ❌
         ▼
┌─────────────────┐
│ 尝试 Model 2     │
│ gemini-3-flash   │
└────────┬─────────┘
         │ 失败 ❌
         ▼
┌─────────────────┐
│ 尝试 Model 3     │
│ gemini-2.5-flash │
└────────┬─────────┘
         │ 失败 ❌
         ▼
┌─────────────────┐
│ 尝试 Model 4     │
│ gemini-3-pro-low │
└────────┬─────────┘
         │ 全部失败 ❌
         ▼
  抛出错误并提示用户
```

### 日志输出示例

```
尝试使用模型: gemini-3-pro-high
✅ 模型 gemini-3-pro-high 成功
```

或者：

```
尝试使用模型: gemini-3-pro-high
❌ 模型 gemini-3-pro-high 失败: 模型不可用
尝试使用模型: gemini-3-flash
✅ 模型 gemini-3-flash 成功
```

---

## 测试验证

### 1. 测试代理连接

```bash
curl http://127.0.0.1:8045/health
```

**预期输出：** 返回代理服务的健康状态信息。

### 2. 测试 API 调用（命令行）

```bash
curl -X POST http://127.0.0.1:8045/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: sk-0f1d2a47c3e74ec49bbed8d506973da5" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "gemini-3-flash",
    "max_tokens": 100,
    "messages": [
      {
        "role": "user",
        "content": "你好，请回复一句话"
      }
    ]
  }'
```

### 3. 在应用中测试

1. 启动开发服务器：`npm run dev`
2. 访问应用：`http://localhost:5173`
3. 上传一个测试文件（.txt 或 .docx）
4. 查看浏览器控制台（F12）的日志输出
5. 确认看到 `✅ 模型 xxx 成功` 的日志

---

## 常见问题

### 问题 1: API Key 无效

**错误信息：**
```
API Key 缺失。请在 .env.local 中设置 VITE_GEMINI_API_KEY
```

**解决方法：**
- 检查 `.env.local` 文件是否存在
- 确认 `VITE_GEMINI_API_KEY` 已正确填写
- 重启开发服务器（`npm run dev`）

---

### 问题 2: 无法连接代理

**错误信息：**
```
Failed to fetch
ERR_CONNECTION_REFUSED
```

**解决方法：**
1. 确认 Antigravity 代理正在运行：
   ```bash
   lsof -i :8045
   ```
2. 如果未运行，启动代理服务
3. 检查 `.env.local` 中的 `VITE_ANTIGRAVITY_BASE_URL` 是否正确

---

### 问题 3: 所有模型都失败

**错误信息：**
```
所有模型都失败了:
gemini-3-pro-high: 模型不可用
gemini-3-flash: 模型不可用
...
```

**可能原因：**
- API Key 配额已耗尽
- 代理服务配置问题
- 网络连接问题

**解决方法：**
1. 检查 API Key 的剩余配额
2. 查看代理服务的日志输出
3. 联系 Antigravity 支持团队

---

### 问题 4: 响应格式错误

**错误信息：**
```
AI 返回的响应格式不正确
```

**解决方法：**
- 检查浏览器控制台中打印的"原始响应"
- 确认代理服务版本是否支持 Anthropic Messages API 格式
- 检查 Prompt 是否包含特殊字符导致解析失败

---

## 高级配置

### 自定义模型列表

如需调整模型优先级，请编辑 `services/geminiService.ts` 中的 `AVAILABLE_MODELS` 数组：

```typescript
const AVAILABLE_MODELS = [
  'gemini-3-flash',      // 改为优先使用最快的模型
  'gemini-3-pro-high',
  'gemini-2.5-flash',
];
```
 
