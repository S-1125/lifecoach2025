# Life Coach AI 项目

这是一个基于DeepSeek R1 API的个人成长辅导网站，通过AI对话为用户提供个人成长建议。

## 项目架构

### 前端结构
- `index.html`: 主页面，包含对话界面
- `styles.css`: 页面样式文件
- `main.js`: 前端交互逻辑

### 后端结构
- `server.js`: Node.js服务器，处理API请求和CORS

## 功能特点

1. 对话界面
   - 用户输入区域
   - 对话历史显示区域
   - 流式输出显示
   - 主题切换功能

2. AI响应
   - 基于DeepSeek R1 API
   - 实时流式输出
   - 超时设置：60秒
   - 温度设置：0.6

## 页面布局

### 主页面结构
```
+------------------+
|     页面标题      |
+------------------+
|                  |
|   对话历史区域    |
|                  |
+------------------+
|   用户输入区域    |
+------------------+
|   主题切换按钮    |
+------------------+
```

### 样式说明
- 响应式设计，适配不同设备
- 简洁现代的界面风格
- 深色/浅色主题切换
- 流畅的动画效果

## 技术栈
- 前端：HTML5, CSS3, JavaScript
- 后端：Node.js
- API：DeepSeek R1

## 环境变量配置
项目使用环境变量来管理敏感信息（如API密钥）。在开发和部署时需要配置以下环境变量：

```env
DEEPSEEK_API_KEY=your_api_key_here
DEEPSEEK_API_URL=https://ark.cn-beijing.volces.com/api/v3/chat/completions
```

## 本地开发
1. 复制`.env.example`文件并重命名为`.env`
2. 在`.env`文件中填入实际的API密钥
3. 安装依赖：
```bash
npm install
```
4. 启动服务器：
```bash
node server.js
```
5. 访问网站
- 打开浏览器访问 `http://localhost:3000`
- 在输入框中输入问题
- 等待AI回应

## Vercel部署指南
1. Fork或克隆此仓库到你的GitHub账号
2. 在Vercel上导入项目
3. 在Vercel项目设置中配置环境变量：
   - `DEEPSEEK_API_KEY`
   - `DEEPSEEK_API_URL`
4. 部署完成后，Vercel会自动生成一个可访问的URL

## 注意事项
- 请勿在代码中直接硬编码API密钥
- 确保`.env`文件已被添加到`.gitignore`中
- 在Vercel上部署时，必须配置所有必需的环境变量