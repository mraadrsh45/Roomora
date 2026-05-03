'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useRef, useState, useCallback } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { Send, MessageCircle, UserCheck, CheckCheck, Check, Circle } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import clsx from 'clsx';

function formatTime(date: string) {
  const d = new Date(date);
  if (isToday(d)) return format(d, 'h:mm a');
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMM d');
}

function MessageStatus({ msg, userId }: { msg: any; userId: string }) {
  const isMe = msg.sender?._id === userId || msg.sender === userId;
  if (!isMe) return null;
  const seen = msg.readBy?.some((id: string) => id !== userId);
  return seen
    ? <CheckCheck size={12} className="text-cyan-400 inline ml-1 flex-shrink-0" />
    : <Check size={12} className="text-slate-500 inline ml-1 flex-shrink-0" />;
}

export default function ChatPage() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [conversations, setConversations] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [otherTyping, setOtherTyping] = useState(false);
  const [tab, setTab] = useState<'chats' | 'requests'>('chats');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const activeConvRef = useRef<any>(null);

  useEffect(() => { loadConversations(); loadRequests(); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { activeConvRef.current = activeConv; }, [activeConv]);

  useEffect(() => {
    if (!socket) return;

    socket.on('message:new', (msg: any) => {
      const conv = activeConvRef.current;
      if (conv && msg.conversation === conv._id) {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.find((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        // Emit seen immediately since we're in the chat
        socket.emit('message:read', { conversationId: conv._id });
        api.put(`/chat/${conv._id}/read`).catch(() => {});
      }
      // Refresh conversation list for unread badge
      loadConversations();
    });

    socket.on('message:seen', ({ conversationId, seenBy }: any) => {
      if (activeConvRef.current?._id === conversationId) {
        setMessages((prev) =>
          prev.map((m) => {
            const alreadySeen = m.readBy?.includes(seenBy);
            if (alreadySeen) return m;
            return { ...m, readBy: [...(m.readBy || []), seenBy] };
          })
        );
      }
    });

    socket.on('typing:start', ({ userId: tid }: any) => {
      const conv = activeConvRef.current;
      if (conv) setOtherTyping(true);
    });
    socket.on('typing:stop', () => setOtherTyping(false));

    socket.on('user:online', ({ userId }: any) => {
      setConversations((prev) =>
        prev.map((c) => ({
          ...c,
          participants: c.participants?.map((p: any) =>
            p._id === userId ? { ...p, isOnline: true } : p
          ),
        }))
      );
    });

    socket.on('user:offline', ({ userId }: any) => {
      setConversations((prev) =>
        prev.map((c) => ({
          ...c,
          participants: c.participants?.map((p: any) =>
            p._id === userId ? { ...p, isOnline: false } : p
          ),
        }))
      );
    });

    return () => {
      socket.off('message:new');
      socket.off('message:seen');
      socket.off('typing:start');
      socket.off('typing:stop');
      socket.off('user:online');
      socket.off('user:offline');
    };
  }, [socket]);

  const loadConversations = async () => {
    const { data } = await api.get('/chat/conversations').catch(() => ({ data: [] }));
    setConversations(data);
  };

  const loadRequests = async () => {
    const { data } = await api.get('/chat/requests').catch(() => ({ data: [] }));
    setRequests(data);
  };

  const openConversation = async (conv: any) => {
    setActiveConv(conv);
    const { data } = await api.get(`/chat/${conv._id}/messages`).catch(() => ({ data: [] }));
    setMessages(data);
    // Join socket room and mark as read
    if (socket) {
      socket.emit('join:conversation', conv._id);
      socket.emit('message:read', { conversationId: conv._id });
    }
    // Update unread count in list
    setConversations((prev) =>
      prev.map((c) => c._id === conv._id ? { ...c, unreadCount: 0 } : c)
    );
  };

  const acceptRequest = async (requestId: string) => {
    try {
      await api.put(`/chat/accept/${requestId}`);
      loadConversations(); loadRequests(); setTab('chats');
    } catch (e: any) { alert(e.response?.data?.message); }
  };

  const sendMessage = () => {
    if (!input.trim() || !activeConv || !socket) return;
    socket.emit('message:send', { conversationId: activeConv._id, content: input });
    setInput('');
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    socket.emit('typing:stop', { conversationId: activeConv._id });
  };

  const handleInputChange = (val: string) => {
    setInput(val);
    if (!socket || !activeConv) return;
    socket.emit('typing:start', { conversationId: activeConv._id });
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit('typing:stop', { conversationId: activeConv._id });
    }, 1500);
  };

  const getOther = (conv: any) => conv.participants?.find((p: any) => p._id !== user?.id);
  const totalUnread = conversations.reduce((s, c) => s + (c.unreadCount || 0), 0);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="glass rounded-2xl overflow-hidden" style={{ height: 'calc(100vh - 160px)' }}>
        <div className="flex h-full">
          {/* Left panel */}
          <div className="w-72 flex-shrink-0 border-r border-white/5 flex flex-col">
            <div className="p-4 border-b border-white/5">
              <h2 className="font-bold text-lg gradient-text">Messages</h2>
              <div className="flex mt-2 gap-1">
                {(['chats', 'requests'] as const).map((t) => (
                  <button key={t} onClick={() => setTab(t)}
                    className={clsx('flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all relative',
                      tab === t ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white')}>
                    {t}
                    {t === 'requests' && requests.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white text-[10px] rounded-full flex items-center justify-center">
                        {requests.length}
                      </span>
                    )}
                    {t === 'chats' && totalUnread > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 text-white text-[10px] rounded-full flex items-center justify-center">
                        {totalUnread}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {tab === 'chats' && conversations.map((conv) => {
                const other = getOther(conv);
                const unread = conv.unreadCount || 0;
                return (
                  <button key={conv._id} onClick={() => openConversation(conv)}
                    className={clsx('w-full p-3 flex items-center gap-3 hover:bg-white/5 transition-colors text-left',
                      activeConv?._id === conv._id && 'bg-purple-500/10')}>
                    <div className="relative flex-shrink-0">
                      <img src={other?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${other?.name}`}
                        className="w-10 h-10 rounded-xl object-cover" alt={other?.name} />
                      {other?.isOnline && <div className="online-dot absolute -bottom-0.5 -right-0.5 border-2 border-[#12121e]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={clsx('font-semibold text-sm truncate', unread > 0 && 'text-white')}>{other?.name}</p>
                        {conv.lastMessage?.createdAt && (
                          <span className="text-[10px] text-slate-600 flex-shrink-0 ml-1">
                            {formatTime(conv.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className={clsx('text-xs truncate', unread > 0 ? 'text-slate-300' : 'text-slate-500')}>
                          {conv.lastMessage?.content || 'No messages yet'}
                        </p>
                        {unread > 0 && (
                          <span className="ml-1 flex-shrink-0 min-w-[18px] h-[18px] bg-purple-500 text-white text-[10px] rounded-full flex items-center justify-center px-1">
                            {unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}

              {tab === 'requests' && requests.map((req) => (
                <div key={req._id} className="p-3 border-b border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <img src={req.from?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.from?.name}`}
                      className="w-8 h-8 rounded-lg object-cover" alt={req.from?.name} />
                    <div>
                      <p className="font-semibold text-sm">{req.from?.name}</p>
                      <p className="text-slate-500 text-xs">{req.from?.profile?.occupation}</p>
                    </div>
                  </div>
                  <button onClick={() => acceptRequest(req._id)}
                    className="w-full flex items-center justify-center gap-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs py-1.5 rounded-lg transition-colors">
                    <UserCheck size={13} /> Accept Request
                  </button>
                </div>
              ))}

              {tab === 'chats' && conversations.length === 0 && (
                <div className="p-6 text-center text-slate-500 text-sm">
                  <MessageCircle size={24} className="mx-auto mb-2 opacity-50" />
                  <p>No conversations yet.</p>
                  <p className="text-xs mt-1">Message someone from Find Roommate.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right panel */}
          <div className="flex-1 flex flex-col min-w-0">
            {activeConv ? (
              <>
                {/* Chat header */}
                <div className="p-4 border-b border-white/5 flex items-center gap-3">
                  {(() => {
                    const other = getOther(activeConv);
                    return (
                      <>
                        <div className="relative">
                          <img src={other?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${other?.name}`}
                            className="w-9 h-9 rounded-xl object-cover" alt={other?.name} />
                          {other?.isOnline && <div className="online-dot absolute -bottom-0.5 -right-0.5 border-2 border-[#12121e]" />}
                        </div>
                        <div>
                          <p className="font-semibold">{other?.name}</p>
                          <p className="text-xs text-slate-400">
                            {other?.isOnline ? '● Online' : other?.lastSeen
                              ? `Last seen ${format(new Date(other.lastSeen), 'h:mm a')}`
                              : 'Offline'}
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {messages.map((msg) => {
                    const isMe = msg.sender?._id === user?.id || msg.sender === user?.id;
                    return (
                      <div key={msg._id} className={clsx('flex items-end gap-2', isMe ? 'justify-end' : 'justify-start')}>
                        {!isMe && (
                          <img src={msg.sender?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.sender?.name}`}
                            className="w-6 h-6 rounded-full object-cover flex-shrink-0 mb-0.5" alt="" />
                        )}
                        <div className={clsx('max-w-xs lg:max-w-sm px-4 py-2.5 rounded-2xl text-sm',
                          isMe
                            ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-br-sm'
                            : 'bg-[#1a1a2e] text-slate-200 rounded-bl-sm')}>
                          <p>{msg.content}</p>
                          <div className={clsx('flex items-center justify-end gap-0.5 mt-0.5',
                            isMe ? 'text-purple-300' : 'text-slate-500')}>
                            <span className="text-[10px]">{msg.createdAt ? format(new Date(msg.createdAt), 'h:mm a') : ''}</span>
                            <MessageStatus msg={msg} userId={user?.id || ''} />
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {otherTyping && (
                    <div className="flex items-center gap-2">
                      <div className="bg-[#1a1a2e] rounded-2xl rounded-bl-sm px-4 py-2.5 flex gap-1 items-center">
                        {[0, 1, 2].map((i) => (
                          <div key={i} className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-white/5 flex gap-3">
                  <input value={input} onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Type a message…"
                    className="input-field flex-1 py-2.5 text-sm" />
                  <button onClick={sendMessage} disabled={!input.trim()}
                    className="btn-primary px-4 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed">
                    <Send size={16} />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center">
                <div>
                  <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                    <MessageCircle size={32} className="text-purple-400 opacity-60" />
                  </div>
                  <p className="text-slate-400 font-medium">Select a conversation</p>
                  <p className="text-slate-600 text-sm mt-1">Choose from the left to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
