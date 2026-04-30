import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../services/api';
import './MockInterview.css';

const MockInterview = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [stage, setStage] = useState(0);
  const chatEndRef = useRef(null);

  const { data: job } = useQuery(['job', jobId], async () => {
    const response = await api.get(`/jobs/${jobId}`);
    return response.data;
  });

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    if (job) {
      startInterview();
    }
  }, [job]);

  const startInterview = () => {
    addBotMessage(`Hello! I'm your AI Interviewer. I've reviewed the ${job.title} role at ${job.company_name}. Are you ready to start our mock interview?`);
  };

  const addBotMessage = (text) => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'bot', content: text }]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    
    processInterviewStage(userMessage);
  };

  const processInterviewStage = (userMessage) => {
    const nextStage = stage + 1;
    setStage(nextStage);

    const questions = [
      `Great. To start, can you tell me about your experience with ${job.required_skills?.[0] || 'your core skills'} and how you've applied them in your previous projects?`,
      `That's interesting. The role at ${job.company_name} requires strong problem-solving. Can you describe a difficult technical challenge you faced and how you overcame it?`,
      `Excellent. One last question: Why do you believe you're the best fit for this specific position?`,
      `Thank you for those answers! I've analyzed your responses. Your communication is clear, and you showed great depth in your technical explanation. I recommend emphasizing your work with ${job.required_skills?.[1] || 'advanced tools'} even more in the real interview. Good luck!`
    ];

    if (nextStage <= questions.length) {
      addBotMessage(questions[nextStage - 1]);
    } else {
      addBotMessage("We've completed the mock interview. You're now better prepared for the real thing! Would you like to go back to the job details?");
    }
  };

  return (
    <div className="interview-container">
      <div className="interview-header">
        <button onClick={() => navigate(-1)} className="back-btn">
          <svg style={{width: '20px'}} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Exit Interview
        </button>
        <div className="interview-job-info">
          <h3>AI Mock Interview</h3>
          <p>{job?.title} @ {job?.company_name}</p>
        </div>
        <div className="ai-status">
          <span className="pulse"></span>
          AI Active
        </div>
      </div>

      <div className="chat-window">
        {messages.map((m, i) => (
          <div key={i} className={`message-row ${m.role}`}>
            <div className="message-bubble">
              {m.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="message-row bot">
            <div className="message-bubble typing">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="input-area">
        <textarea
          placeholder="Type your response..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
        />
        <button onClick={handleSend} className="send-btn">
          <svg style={{width: '24px'}} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
        </button>
      </div>
    </div>
  );
};

export default MockInterview;
