// 获取DOM元素
const chatHistory = document.getElementById('chat-history');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = themeToggle.querySelector('.theme-icon');
const historyList = document.getElementById('history-list');
const voiceInputBtn = document.getElementById('voice-input');
const memoryIndicator = document.getElementById('memory-indicator');
const modelItems = document.querySelectorAll('.model-item');
const modelSidebar = document.querySelector('.model-sidebar');

// 存储对话历史
let messageHistory = [];

// 存储对话会话
let chatSessions = JSON.parse(localStorage.getItem('chatSessions')) || [];
let currentSessionId = null;

// 当前选择的模型
let currentModel = 'deepseek-r1';

// 主题切换功能
let isDarkTheme = localStorage.getItem('darkTheme') === 'true';

// 初始化主题
if (isDarkTheme) {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeToggle.querySelector('i').classList.remove('fa-sun');
    themeToggle.querySelector('i').classList.add('fa-moon');
}

themeToggle.addEventListener('click', () => {
    isDarkTheme = !isDarkTheme;
    document.documentElement.setAttribute('data-theme', isDarkTheme ? 'dark' : 'light');
    
    const icon = themeToggle.querySelector('i');
    if (isDarkTheme) {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    } else {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    }
    
    localStorage.setItem('darkTheme', isDarkTheme);
});

// 模型选择功能
modelItems.forEach(item => {
    item.addEventListener('click', () => {
        // 移除所有active类
        modelItems.forEach(i => i.classList.remove('active'));
        // 添加active类到当前选中项
        item.classList.add('active');
        // 更新当前模型
        const modelName = item.querySelector('span').textContent.toLowerCase();
        if (modelName.includes('deepseek')) {
            currentModel = 'deepseek-r1';
        } else if (modelName.includes('gpt')) {
            currentModel = 'gpt-4';
        } else if (modelName.includes('claude')) {
            currentModel = 'claude-3';
        }
        
        // 在移动设备上自动关闭侧边栏
        if (window.innerWidth <= 768) {
            modelSidebar.classList.remove('open');
        }
    });
});

// 移动设备侧边栏切换
function toggleSidebar() {
    modelSidebar.classList.toggle('open');
}

// 添加汉堡菜单按钮（在移动设备上）
if (window.innerWidth <= 768) {
    const hamburgerBtn = document.createElement('button');
    hamburgerBtn.className = 'hamburger-btn';
    hamburgerBtn.innerHTML = '<i class="fas fa-bars"></i>';
    hamburgerBtn.addEventListener('click', toggleSidebar);
    
    document.querySelector('.nav-logo').prepend(hamburgerBtn);
    
    // 添加点击外部关闭侧边栏
    document.addEventListener('click', (e) => {
        if (!modelSidebar.contains(e.target) && 
            !e.target.classList.contains('hamburger-btn') && 
            modelSidebar.classList.contains('open')) {
            modelSidebar.classList.remove('open');
        }
    });
}

// 创建消息元素
function createMessageElement(content, isUser) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.textContent = content;
    
    messageDiv.appendChild(messageContent);
    return messageDiv;
}

// 添加消息到对话历史
function addMessage(content, isUser) {
    // 如果是第一条消息，清除欢迎信息
    if (messageHistory.length === 0) {
        const welcomeMessage = document.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.remove();
        }
    }
    
    const messageElement = createMessageElement(content, isUser);
    chatHistory.appendChild(messageElement);
    chatHistory.scrollTop = chatHistory.scrollHeight;
    
    // 更新消息历史
    messageHistory.push({
        role: isUser ? 'user' : 'assistant',
        content: content
    });
    
    // 更新记忆指示器
    updateMemoryIndicator();
}

// 更新记忆指示器
function updateMemoryIndicator() {
    // 假设10条消息为记忆上限
    const memoryLimit = 10;
    const currentMemoryUsage = messageHistory.length;
    const memoryPercentage = (currentMemoryUsage / memoryLimit) * 100;
    
    if (memoryPercentage >= 80) {
        memoryIndicator.style.display = 'flex';
    } else {
        memoryIndicator.style.display = 'none';
    }
}

// 自动调整文本区域高度
function autoResizeTextarea() {
    userInput.style.height = 'auto';
    userInput.style.height = (userInput.scrollHeight > 150 ? 150 : userInput.scrollHeight) + 'px';
}

// 语音输入功能
function startVoiceInput() {
    if (!('webkitSpeechRecognition' in window)) {
        alert('您的浏览器不支持语音识别功能');
        return;
    }
    
    const recognition = new webkitSpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.continuous = false;
    recognition.interimResults = false;
    
    // 语音识别开始时的UI反馈
    voiceInputBtn.classList.add('recording');
    voiceInputBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        userInput.value = transcript;
        autoResizeTextarea();
    };
    
    recognition.onend = () => {
        voiceInputBtn.classList.remove('recording');
        voiceInputBtn.innerHTML = '<i class="fas fa-microphone"></i>';
    };
    
    recognition.onerror = (event) => {
        console.error('语音识别错误:', event.error);
        voiceInputBtn.classList.remove('recording');
        voiceInputBtn.innerHTML = '<i class="fas fa-microphone"></i>';
    };
    
    recognition.start();
}

// 处理用户输入
async function handleUserInput() {
    const message = userInput.value.trim();
    if (!message) return;

    // 禁用输入和发送按钮
    userInput.disabled = true;
    sendButton.disabled = true;
    voiceInputBtn.disabled = true;

    // 显示加载动画
    const loadingSpinner = document.getElementById('loading-spinner');
    loadingSpinner.classList.add('show');

    // 显示用户消息
    addMessage(message, true);
    userInput.value = '';
    userInput.style.height = 'auto';

    try {
        // 发送请求到服务器
        const response = await fetch('http://localhost:3000/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                history: messageHistory.slice(0, -1), // 不包含最新的用户消息
                model: currentModel // 添加模型选择
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '请求失败');
        }

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

// 文本区域自动调整高度
userInput.addEventListener('input', autoResizeTextarea);

// 语音输入按钮
voiceInputBtn.addEventListener('click', startVoiceInput);

// 记忆清除功能
memoryIndicator.addEventListener('click', () => {
    if (confirm('是否要清除当前对话记忆？')) {
        messageHistory = [];
        chatHistory.innerHTML = '';
        
        // 添加欢迎信息
        const welcomeDiv = document.createElement('div');
        welcomeDiv.className = 'welcome-message';
        welcomeDiv.innerHTML = `
            <h2>Life Coach AI</h2>
            <p>你的个人成长助手</p>
            <p class="welcome-description">我可以帮助你解决个人成长问题，提供有针对性的建议和指导。</p>
        `;
        chatHistory.appendChild(welcomeDiv);
        
        // 更新记忆指示器
        updateMemoryIndicator();
    }
});

// 初始化页面
userInput.focus();

// 初始化记忆指示器
updateMemoryIndicator();

// 添加CSS变量
document.documentElement.style.setProperty('--primary-color-rgb', '74, 144, 226');

// 响应式设计 - 窗口大小变化时调整
window.addEventListener('resize', () => {
    if (window.innerWidth <= 768) {
        if (!document.querySelector('.hamburger-btn')) {
            const hamburgerBtn = document.createElement('button');
            hamburgerBtn.className = 'hamburger-btn';
            hamburgerBtn.innerHTML = '<i class="fas fa-bars"></i>';
            hamburgerBtn.addEventListener('click', toggleSidebar);
            document.querySelector('.nav-logo').prepend(hamburgerBtn);
        }
    } else {
        const hamburgerBtn = document.querySelector('.hamburger-btn');
        if (hamburgerBtn) {
            hamburgerBtn.remove();
        }
        modelSidebar.classList.remove('open');
    }
});