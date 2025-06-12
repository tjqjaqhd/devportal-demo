const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(helmet({
  contentSecurityPolicy: false // 개발 편의를 위해 비활성화
}));
app.use(cors());
app.use(express.json());

// 메모리 내 데이터 저장소 (실제 환경에서는 SQLite 사용)
const dataStore = {
  projects: [
    { id: 1, name: 'DevPortal', description: 'Modern web development platform', technology: 'React + Vite', status: 'active', created_at: new Date().toISOString() },
    { id: 2, name: 'E-Commerce Site', description: 'Full-stack online shopping platform', technology: 'Node.js + MongoDB', status: 'completed', created_at: new Date().toISOString() },
    { id: 3, name: 'Mobile App', description: 'Cross-platform mobile application', technology: 'React Native', status: 'in-progress', created_at: new Date().toISOString() },
    { id: 4, name: 'Data Dashboard', description: 'Analytics and reporting dashboard', technology: 'Python + Flask', status: 'active', created_at: new Date().toISOString() }
  ],
  chatMessages: [],
  feedback: [],
  users: []
};

// 간단한 AI 챗봇 클래스
class SimpleChatBot {
  constructor() {
    this.responses = {
      greetings: [
        "안녕하세요! DevPortal 도우미입니다. 무엇을 도와드릴까요?",
        "환영합니다! 웹 개발에 관해 궁금한 것이 있으시면 언제든 물어보세요.",
        "안녕하세요! 프로젝트 관련해서 도움이 필요하시면 말씀해 주세요."
      ],
      technology: [
        "React는 현대적인 UI 구축에 매우 효과적입니다. 컴포넌트 기반 아키텍처로 재사용성이 뛰어나죠.",
        "Vite는 빠른 개발 서버와 효율적인 번들링으로 개발 경험을 크게 향상시킵니다.",
        "Node.js는 JavaScript로 백엔드를 개발할 수 있게 해주는 런타임 환경입니다.",
        "SQLite는 가벼우면서도 강력한 관계형 데이터베이스로 프로토타입에 적합합니다."
      ],
      project: [
        "프로젝트 기획 시 목표를 명확히 하고, 기술 스택을 신중히 선택하는 것이 중요합니다.",
        "개발 프로세스에서 테스트와 문서화를 소홀히 하지 마세요.",
        "사용자 경험(UX)을 항상 우선으로 생각하며 개발해야 합니다."
      ],
      default: [
        "흥미로운 질문이네요! 좀 더 구체적으로 설명해 주시면 더 도움이 될 것 같습니다.",
        "죄송하지만 정확히 이해하지 못했습니다. 다시 말씀해 주시겠어요?",
        "그에 대해서는 확실하지 않지만, 관련된 다른 정보를 알려드릴 수 있습니다."
      ]
    };
    
    this.patterns = {
      greetings: /안녕|하이|헬로|hi|hello|안녕하세요/i,
      technology: /react|vite|node|javascript|html|css|database|sql|기술|개발/i,
      project: /프로젝트|계획|관리|개발|구현|설계/i
    };
  }
  
  generateResponse(message) {
    for (const [category, pattern] of Object.entries(this.patterns)) {
      if (pattern.test(message)) {
        const responses = this.responses[category] || this.responses.default;
        return responses[Math.floor(Math.random() * responses.length)];
      }
    }
    
    const responses = this.responses.default;
    return responses[Math.floor(Math.random() * responses.length)];
  }
}

const chatBot = new SimpleChatBot();

// 정적 파일 서빙
app.use(express.static(path.join(__dirname, 'dist')));

// API 라우트
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 프로젝트 관련 API
app.get('/api/projects', (req, res) => {
  res.json(dataStore.projects);
});

app.post('/api/projects', (req, res) => {
  const { name, description, technology } = req.body;
  const newProject = {
    id: dataStore.projects.length + 1,
    name,
    description,
    technology,
    status: 'active',
    created_at: new Date().toISOString()
  };
  
  dataStore.projects.push(newProject);
  res.json({ id: newProject.id, message: '프로젝트가 추가되었습니다.' });
});

// 채팅 기록 API
app.get('/api/chat/history', (req, res) => {
  res.json(dataStore.chatMessages.slice(-20));
});

// 피드백 API
app.post('/api/feedback', (req, res) => {
  const { name, email, message } = req.body;
  const feedback = {
    id: dataStore.feedback.length + 1,
    name,
    email,
    message,
    created_at: new Date().toISOString()
  };
  
  dataStore.feedback.push(feedback);
  res.json({ message: '피드백이 성공적으로 제출되었습니다.' });
});

// 챗봇 API
app.post('/api/chat', (req, res) => {
  const { message, username = 'Anonymous' } = req.body;
  
  // 사용자 메시지 저장
  const userMessage = {
    id: uuidv4(),
    username,
    message,
    is_bot: false,
    timestamp: new Date().toISOString()
  };
  dataStore.chatMessages.push(userMessage);
  
  // 챗봇 응답 생성
  const botResponse = chatBot.generateResponse(message);
  
  const botMessage = {
    id: uuidv4(),
    username: 'DevPortal Bot',
    message: botResponse,
    is_bot: true,
    timestamp: new Date().toISOString()
  };
  dataStore.chatMessages.push(botMessage);
  
  res.json({ 
    response: botResponse,
    timestamp: new Date().toISOString()
  });
});

// WebSocket 연결 처리
io.on('connection', (socket) => {
  console.log('사용자가 연결되었습니다:', socket.id);
  
  // 채팅 메시지 처리
  socket.on('chat message', (data) => {
    const { message, username = 'Anonymous' } = data;
    const messageId = uuidv4();
    
    // 사용자 메시지 저장 및 브로드캐스트
    const userMessage = {
      id: messageId,
      username,
      message,
      timestamp: new Date().toISOString(),
      isBot: false
    };
    
    dataStore.chatMessages.push(userMessage);
    io.emit('chat message', userMessage);
    
    // 챗봇 응답 생성 (약간의 지연 후)
    setTimeout(() => {
      const botResponse = chatBot.generateResponse(message);
      
      const botMessage = {
        id: uuidv4(),
        username: 'DevPortal Bot',
        message: botResponse,
        timestamp: new Date().toISOString(),
        isBot: true
      };
      
      dataStore.chatMessages.push(botMessage);
      io.emit('chat message', botMessage);
    }, 1000 + Math.random() * 2000); // 1-3초 랜덤 지연
  });
  
  socket.on('disconnect', () => {
    console.log('사용자가 연결을 해제했습니다:', socket.id);
  });
});

// 모든 라우트를 index.html로 리다이렉트 (SPA 지원)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 DevPortal Enhanced Server is running on port ${PORT}`);
  console.log(`📍 Local access: http://localhost:${PORT}`);
  console.log(`🌐 External access: http://0.0.0.0:${PORT}`);
  console.log(`💬 WebSocket enabled for real-time chat`);
  console.log(`🤖 AI Chatbot ready`);
  console.log(`🗄️ In-memory data store initialized`);
  console.log(`\n✨ New Features:`);
  console.log(`   • Project Management System`);
  console.log(`   • Real-time AI Chatbot`);
  console.log(`   • Feedback Collection`);
  console.log(`   • WebSocket Support`);
});