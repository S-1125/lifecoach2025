// 获取DOM元素
const chatHistory = document.getElementById('chat-history');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = themeToggle.querySelector('.theme-icon');

// 存储对话历史
let messageHistory = [];

// 主题切换功能
let isDarkTheme = false;

themeToggle.addEventListener('click', () => {
    isDarkTheme = !isDarkTheme;
    document.documentElement.setAttribute('data-theme', isDarkTheme ? 'dark' : 'light');
    themeIcon.textContent = isDarkTheme ? '🌛' : '🌞';
});

// 创建消息元素
function createMessageElement(content, isUser) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
    messageDiv.textContent = content;
    return messageDiv;
}

// 添加消息到对话历史
function addMessage(content, isUser) {
    const messageElement = createMessageElement(content, isUser);
    chatHistory.appendChild(messageElement);
    chatHistory.scrollTop = chatHistory.scrollHeight;
    
    // 更新消息历史
    messageHistory.push({
        role: isUser ? 'user' : 'assistant',
        content: content
    });
}

// 处理用户输入
async function handleUserInput() {
    const message = userInput.value.trim();
    if (!message) return;

    // 禁用输入和发送按钮
    userInput.disabled = true;
    sendButton.disabled = true;

    // 显示加载动画
    const loadingSpinner = document.getElementById('loading-spinner');
    loadingSpinner.classList.add('show');

    // 显示用户消息
    addMessage(message, true);
    userInput.value = '';

    try {
        // 发送请求到服务器
        const response = await fetch('http://localhost:3000/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                history: messageHistory.slice(0, -1) // 不包含最新的用户消息
            })
        });

        if (!response.ok) throw new Error('请求失败');

        // 创建AI回复的消息元素
        const aiMessage = createMessageElement('', false);
        chatHistory.appendChild(aiMessage);

        // 处理流式响应
        let aiResponse = '';
        const processChunk = (chunk) => {
            const lines = chunk.toString().split('\n');
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') continue;

                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.content;
                        if (content) {
                            aiResponse += content;
                            aiMessage.textContent = aiResponse;
                            chatHistory.scrollTop = chatHistory.scrollHeight;
                        }
                    } catch (e) {
                        console.error('解析响应数据失败:', e);
                    }
                }
            }
        };

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            processChunk(chunk);
        }

        // 更新消息历史
        messageHistory.push({
            role: 'assistant',
            content: aiResponse
        });

    } catch (error) {
        console.error('发送消息失败:', error);
        addMessage('抱歉，发生了错误，请稍后重试。', false);
    } finally {
        // 重新启用输入和发送按钮
        userInput.disabled = false;
        sendButton.disabled = false;
        userInput.focus();
        
        // 隐藏加载动画
        loadingSpinner.classList.remove('show');
    }
}

// 事件监听器
sendButton.addEventListener('click', handleUserInput);

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleUserInput();
    }
});

// 初始化页面
userInput.focus();