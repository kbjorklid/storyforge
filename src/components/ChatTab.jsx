import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import CheckboxFolderTree from './CheckboxFolderTree';
import { MessageSquare, Send, ArrowLeft, Bot, User } from 'lucide-react';
import { chatWithStories } from '../services/ai';
import ReactMarkdown from 'react-markdown';

const ChatTab = ({ projectId }) => {
    const { projects, stories, settings } = useStore();
    const project = projects.find(p => p.id === projectId);
    const [selectedStoryIds, setSelectedStoryIds] = useState([]);
    const [chatStarted, setChatStarted] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleToggleStory = (storyId) => {
        setSelectedStoryIds(prev => {
            if (prev.includes(storyId)) {
                return prev.filter(id => id !== storyId);
            } else {
                if (prev.length >= 10) {
                    alert("You can select up to 10 stories.");
                    return prev;
                }
                return [...prev, storyId];
            }
        });
    };

    const handleStartChat = () => {
        setChatStarted(true);
        // Initial system message is handled implicitly by the service when sending the first user message
        // but we can add a welcome message from the AI locally
        setMessages([
            {
                role: 'assistant',
                content: `I'm ready to chat about the ${selectedStoryIds.length} stories you selected. What would you like to know?`
            }
        ]);
    };

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const selectedStories = selectedStoryIds.map(id => stories[id]);
            const response = await chatWithStories(
                selectedStories,
                [...messages, userMessage], // Send full history including new message
                settings,
                project
            );

            setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error while processing your request." }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!project) return null;

    if (chatStarted) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{
                    padding: '1rem',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                }}>
                    <button
                        onClick={() => setChatStarted(false)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-text-secondary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <ArrowLeft size={16} /> Back to Selection
                    </button>
                    <h3 style={{ margin: 0, fontSize: '1rem' }}>Chatting about {selectedStoryIds.length} stories</h3>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {messages.map((msg, index) => (
                        <div key={index} style={{
                            display: 'flex',
                            gap: '0.75rem',
                            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                            maxWidth: '80%'
                        }}>
                            {msg.role === 'assistant' && (
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    backgroundColor: 'var(--color-accent)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    <Bot size={18} color="white" />
                                </div>
                            )}
                            <div className="markdown-content" style={{
                                padding: '0.75rem 1rem',
                                borderRadius: '8px',
                                backgroundColor: msg.role === 'user' ? 'var(--color-accent)' : 'var(--color-bg-secondary)',
                                color: msg.role === 'user' ? 'white' : 'var(--color-text-primary)',
                                border: msg.role === 'user' ? 'none' : '1px solid var(--color-border)',
                                fontSize: '0.95rem',
                                lineHeight: '1.5'
                            }}>
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                            {msg.role === 'user' && (
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    backgroundColor: 'var(--color-text-secondary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    <User size={18} color="white" />
                                </div>
                            )}
                        </div>
                    ))}
                    {isLoading && (
                        <div style={{ display: 'flex', gap: '0.75rem', alignSelf: 'flex-start' }}>
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--color-accent)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Bot size={18} color="white" />
                            </div>
                            <div style={{
                                padding: '0.75rem 1rem',
                                borderRadius: '8px',
                                backgroundColor: 'var(--color-bg-secondary)',
                                border: '1px solid var(--color-border)',
                                color: 'var(--color-text-secondary)'
                            }}>
                                Thinking...
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div style={{
                    padding: '1rem',
                    borderTop: '1px solid var(--color-border)',
                    display: 'flex',
                    gap: '0.5rem'
                }}>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                        placeholder="Type your message..."
                        style={{
                            flex: 1,
                            padding: '0.75rem',
                            borderRadius: '4px',
                            border: '1px solid var(--color-border)',
                            backgroundColor: 'var(--color-bg-primary)',
                            color: 'var(--color-text-primary)'
                        }}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!input.trim() || isLoading}
                        style={{
                            padding: '0 1rem',
                            borderRadius: '4px',
                            backgroundColor: 'var(--color-accent)',
                            color: 'white',
                            border: 'none',
                            cursor: (!input.trim() || isLoading) ? 'not-allowed' : 'pointer',
                            opacity: (!input.trim() || isLoading) ? 0.6 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '1rem' }}>
                <h3 style={{ marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>Select Stories to Chat About</h3>
                <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                    Select between 1 and 10 stories to include in the AI context.
                </p>
            </div>

            <div style={{
                flex: 1,
                overflowY: 'auto',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
                padding: '1rem',
                backgroundColor: 'var(--color-bg-secondary)',
                marginBottom: '1rem'
            }}>
                <CheckboxFolderTree
                    rootFolderId={project.rootFolderId}
                    selectedStoryIds={selectedStoryIds}
                    onToggleStory={handleToggleStory}
                />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '0.9rem', color: selectedStoryIds.length > 10 ? 'var(--color-danger)' : 'var(--color-text-secondary)' }}>
                    {selectedStoryIds.length} selected
                </span>
                <button
                    onClick={handleStartChat}
                    disabled={selectedStoryIds.length === 0 || selectedStoryIds.length > 10}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.5rem',
                        backgroundColor: 'var(--color-accent)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: (selectedStoryIds.length === 0 || selectedStoryIds.length > 10) ? 'not-allowed' : 'pointer',
                        opacity: (selectedStoryIds.length === 0 || selectedStoryIds.length > 10) ? 0.5 : 1,
                        fontWeight: 500
                    }}
                >
                    <MessageSquare size={18} /> Start Chat
                </button>
            </div>
        </div>
    );
};

export default ChatTab;
