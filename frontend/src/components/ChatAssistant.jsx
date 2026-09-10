import React, { useState, useRef, useEffect } from 'react';
import { askQuestion } from '../api/assistant';
import { useNavigate } from 'react-router-dom';
import './ChatAssistant.css';

export default function ChatAssistant({ videoId }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const endOfMessagesRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = { role: 'user', content: inputText };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const response = await askQuestion(userMsg.content, videoId);
      const assistantMsg = { 
        role: 'assistant', 
        content: response.answer || response.content,
        cited_incident_ids: response.cited_incident_ids || []
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleCitationClick = (id) => {
    navigate(`/incidents/${id}`);
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h3>AI Assistant</h3>
      </div>
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty">Ask about warehouse incidents...</div>
        )}
        {messages.map((m, idx) => (
          <div key={idx} className={`chat-bubble ${m.role}`}>
            <div className="chat-content">{m.content}</div>
            {m.cited_incident_ids && m.cited_incident_ids.length > 0 && (
              <div className="chat-citations">
                {m.cited_incident_ids.map(id => (
                  <span key={id} className="citation-badge" onClick={() => handleCitationClick(id)}>
                    Ref: {id}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && <div className="chat-bubble assistant loading">Typing...</div>}
        <div ref={endOfMessagesRef} />
      </div>
      <form className="chat-input-area" onSubmit={handleSubmit}>
        <input 
          type="text" 
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder="Ask a question..."
          disabled={loading}
        />
        <button type="submit" disabled={loading || !inputText.trim()}>Send</button>
      </form>
    </div>
  );
}
