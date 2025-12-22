'use client';

import React, { useState, useEffect, useRef, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Users,
  Clock,
  LogOut,
  Loader2,
  CheckCheck,
  AlertCircle,
  Copy,
  Check,
  Lock
} from 'lucide-react';
import { initSocket, disconnectSocket } from '@/lib/socket';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import type { Socket } from 'socket.io-client';

interface Message {
  id: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'audio';
  mediaUrl?: string;
  createdAt: Date;
  isMine?: boolean;
}

interface RoomPageProps {
  params: Promise<{
    roomId: string;
  }>;
}

export default function RoomPage({ params }: RoomPageProps) {
  const resolvedParams = use(params);
  const roomId = resolvedParams.roomId;
  const router = useRouter();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [participantsCount, setParticipantsCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [error, setError] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [copied, setCopied] = useState(false);

  // Verification states
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [roomName, setRoomName] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle room verification
  const handleVerifyRoom = async () => {
    if (!verificationCode.trim() || verificationCode.length !== 6) {
      setVerificationError('Please enter a valid 6-character code');
      return;
    }

    setIsVerifying(true);
    setVerificationError('');

    try {
      const response = await api.post(`/rooms/${roomId}/verify`, {
        code: verificationCode.toUpperCase(),
      });

      if (response.data.success) {
        setIsVerified(true);
        setRoomCode(response.data.room.code);
        setRoomName(response.data.room.name);
        // Proceed to connect socket
      }
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setVerificationError(error.response?.data?.message || 'Invalid room code. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Socket connection (only after verification)
  useEffect(() => {
    if (!isVerified || !roomCode) return;

    const socketInstance = initSocket();
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      setIsConnected(true);
      socketInstance.emit('room:join', { roomId, code: roomCode });
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      setIsJoined(false);
    });

    socketInstance.on('room:joined', ({ participantsCount: count, messages: existingMessages }) => {
      setIsJoined(true);
      setParticipantsCount(count);
      setError('');

      if (existingMessages && existingMessages.length > 0) {
        const formattedMessages = existingMessages.map((msg: any) => ({
          ...msg,
          createdAt: new Date(msg.createdAt),
          isMine: false,
        }));
        setMessages(formattedMessages);
      }
    });

    socketInstance.on('room:error', ({ message }) => {
      setError(message);
      setTimeout(() => {
        router.push('/');
      }, 3000);
    });

    socketInstance.on('room:new-message', (message) => {
      setMessages((prev) => [
        ...prev,
        {
          ...message,
          createdAt: new Date(message.createdAt),
          isMine: false,
        },
      ]);
    });

    socketInstance.on('room:participant-joined', ({ participantsCount: count }) => {
      setParticipantsCount(count);
    });

    socketInstance.on('room:participant-left', ({ participantsCount: count }) => {
      setParticipantsCount(count);
    });

    socketInstance.on('room:user-typing', ({ isTyping: typing }) => {
      setIsTyping(typing);
      if (typing) {
        setTimeout(() => setIsTyping(false), 3000);
      }
    });

    return () => {
      if (socketInstance) {
        socketInstance.emit('room:leave', { roomCode });
        disconnectSocket();
      }
    };
  }, [isVerified, roomCode, roomId, router]);

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !socket || !isJoined || isSending) return;

    setIsSending(true);
    const tempMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage.trim(),
      type: 'text',
      createdAt: new Date(),
      isMine: true,
    };

    setMessages((prev) => [...prev, tempMessage]);

    socket.emit('room:message', {
      roomCode,
      content: inputMessage.trim(),
      type: 'text',
    });

    setInputMessage('');
    setIsSending(false);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socket.emit('room:typing', { roomCode, isTyping: false });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);

    if (socket && isJoined) {
      socket.emit('room:typing', { roomCode, isTyping: true });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('room:typing', { roomCode, isTyping: false });
      }, 1000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCodeKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleVerifyRoom();
    }
  };

  const handleLeaveRoom = () => {
    if (socket) {
      socket.emit('room:leave', { roomCode });
      disconnectSocket();
    }
    router.push('/');
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Verification Screen
  if (!isVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 relative overflow-hidden flex items-center justify-center p-4">
        {/* Animated background elements */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
          animate={{
            opacity: 1,
            scale: 1,
            rotate: [0, 15, -10, 15, 0]
          }}
          transition={{
            duration: 0.8,
            rotate: {
              repeat: Infinity,
              duration: 2,
              ease: "easeInOut"
            }
          }}
          className="absolute left-10 top-10 text-7xl"
        >
          🔐
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: 1,
            scale: 1,
            rotate: [0, 360]
          }}
          transition={{
            duration: 1,
            rotate: {
              repeat: Infinity,
              duration: 10,
              ease: "linear"
            }
          }}
          className="absolute right-10 top-20 text-6xl"
        >
          🔑
        </motion.div>

        <div className="max-w-md w-full relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-white font-black text-5xl md:text-6xl mb-4">
              Enter Room Code
            </h1>
            <p className="text-white/80 text-lg">
              Please enter the 6-character code to access this room
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 md:p-12 shadow-2xl"
          >
            <div className="mb-6">
              <div className="flex items-center justify-center mb-6">
                <Lock className="w-16 h-16 text-white" />
              </div>

              <input
                ref={codeInputRef}
                type="text"
                value={verificationCode}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase().slice(0, 6);
                  setVerificationCode(value);
                  setVerificationError('');
                }}
                onKeyPress={handleCodeKeyPress}
                placeholder="ABC123"
                maxLength={6}
                className="w-full px-6 py-4 rounded-2xl text-2xl text-center font-black bg-white/20 backdrop-blur-sm text-white placeholder-white/40 border-2 border-white/30 focus:border-white focus:outline-none transition-all tracking-wider uppercase"
                autoFocus
              />
              <p className="text-white/70 text-sm mt-2 text-center">
                {verificationCode.length}/6 characters
              </p>
            </div>

            {verificationError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/20 backdrop-blur-sm rounded-xl p-4 mb-4 flex items-center gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-300" />
                <p className="text-red-300 text-sm">{verificationError}</p>
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleVerifyRoom}
              disabled={isVerifying || verificationCode.length !== 6}
              className="w-full bg-white text-blue-600 font-bold text-xl px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Lock className="w-6 h-6" />
                  Verify & Join
                </>
              )}
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Error Screen
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-500 via-red-600 to-pink-700 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 max-w-md w-full text-center"
        >
          <AlertCircle className="w-16 h-16 text-white mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Oops!</h2>
          <p className="text-white/90 mb-4">{error}</p>
          <p className="text-white/70 text-sm">Redirecting you back...</p>
        </motion.div>
      </div>
    );
  }

  // Loading/Connecting Screen
  if (!isConnected || !isJoined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 max-w-md w-full text-center"
        >
          <Loader2 className="w-16 h-16 text-white mx-auto mb-4 animate-spin" />
          <h2 className="text-2xl font-bold text-white mb-2">Connecting...</h2>
          <p className="text-white/90">Joining room {roomCode}</p>
        </motion.div>
      </div>
    );
  }

  // Chat Interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 flex flex-col">
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-white/10 backdrop-blur-lg border-b border-white/20 p-4 sticky top-0 z-10"
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/20 rounded-2xl px-4 py-2 flex items-center gap-2 cursor-pointer"
              onClick={copyRoomCode}
            >
              <span className="text-white font-bold text-lg">{roomCode}</span>
              {copied ? (
                <Check className="w-4 h-4 text-green-300" />
              ) : (
                <Copy className="w-4 h-4 text-white/70" />
              )}
            </motion.div>
            <div className="flex items-center gap-2 text-white/90">
              <Users className="w-5 h-5" />
              <span className="font-semibold">{participantsCount}</span>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLeaveRoom}
            className="bg-red-500/80 hover:bg-red-600/80 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Leave</span>
          </motion.button>
        </div>
      </motion.header>

      <div className="flex-1 overflow-y-auto p-4 pb-24">
        <div className="max-w-4xl mx-auto space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className={`flex ${message.isMine ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] sm:max-w-md rounded-2xl px-4 py-3 ${message.isMine
                      ? 'bg-white text-gray-800 rounded-br-sm'
                      : 'bg-white/20 backdrop-blur-lg text-white rounded-bl-sm'
                    }`}
                >
                  <p className="break-words">{message.content}</p>
                  <div className={`flex items-center gap-1 mt-1 text-xs ${message.isMine ? 'text-gray-500' : 'text-white/70'
                    }`}>
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(message.createdAt)}</span>
                    {message.isMine && (
                      <CheckCheck className="w-3 h-3 ml-1 text-blue-500" />
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex justify-start"
            >
              <div className="bg-white/20 backdrop-blur-lg text-white rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1">
                  <motion.span
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                    className="w-2 h-2 bg-white rounded-full"
                  />
                  <motion.span
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                    className="w-2 h-2 bg-white rounded-full"
                  />
                  <motion.span
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                    className="w-2 h-2 bg-white rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 bg-white/10 backdrop-blur-lg border-t border-white/20 p-4"
      >
        <div className="max-w-4xl mx-auto flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={!isJoined || isSending}
            className="flex-1 bg-white/20 backdrop-blur-lg text-white placeholder-white/50 rounded-2xl px-6 py-3 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all disabled:opacity-50"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || !isJoined || isSending}
            className="bg-white text-blue-600 p-3 rounded-2xl hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Send className="w-6 h-6" />
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
