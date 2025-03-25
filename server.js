const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const port = 3000;

// 配置CORS和JSON解析
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// 加载环境变量
require('dotenv').config();

// DeepSeek R1 API配置
const API_KEY = process.env.DEEPSEEK_API_KEY;
const API_URL = process.env.DEEPSEEK_API_URL;

// 系统提示词
const SYSTEM_PROMPT = `你是一位专业的Life Coach，拥有丰富的个人成长和发展咨询经验。
你的目标是通过对话帮助用户实现个人成长，提供有针对性的建议和指导。
在回答时，你应该：
1. 倾听用户的问题和困扰
2. 提供具体、可行的建议
3. 鼓励用户积极思考和行动
4. 保持专业、友善的态度`;

// 处理聊天请求
app.post('/chat', async (req, res) => {
    // 检查API密钥是否已配置
    if (API_KEY === 'your_api_key_here') {
        res.status(400).json({ error: '请先在.env文件中配置正确的API密钥' });
        return;
    }
    try {
        // 设置响应头，启用流式输出
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const userMessage = req.body.message;
        const chatHistory = req.body.history || [];

        // 构建API请求体
        const requestBody = {
            model: 'deepseek-r1-250120',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                ...chatHistory,
                { role: 'user', content: userMessage }
            ],
            stream: true,
            temperature: 0.6
        };

        // 发送API请求
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify(requestBody)
        });

        // 处理流式响应
        response.body.on('data', chunk => {
            const lines = chunk.toString().split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') {
                        res.write('data: [DONE]\n\n');
                        continue;
                    }

                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices[0].delta.content || '';
                        if (content) {
                            res.write(`data: ${JSON.stringify({ content })}\n\n`);
                        }
                    } catch (e) {
                        console.error('解析响应数据失败:', e);
                    }
                }
            }
        });

        response.body.on('end', () => {
            res.end();
        });

        response.body.on('error', error => {
            console.error('处理响应流时出错:', error);
            res.status(500).json({ error: '服务器内部错误' });
        });
    } catch (error) {
        console.error('处理请求失败:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
});

// 启动服务器
app.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}`);
});