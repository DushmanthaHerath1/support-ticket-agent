import React, { useState, useRef, useEffect } from "react";
import { Send, RotateCcw, Bot, User } from "lucide-react";

import { getConversation } from "../assets/api/client";
import { streamChat } from "../assets/api/stream";
import MessageBubble from "../components/MessageBubble";
import StatusIndicator from "../components/StatusIndecator";
import ApprovalBanner from "../components/ApprovalBanner";

// Quick starter prompt suggestions
const QUICK_PROMPTS = [
  "What is the status of my order?",
  "I would like to cancel and get a refund for order.",
  "Can you check the delivery status for?",
];

function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAwaitingApproval, setIsAwaitingApproval] = useState(false);
  const [activeTool, setActiveTool] = useState(null);

  // Demo customer: John Doe
  const customerId = useRef("11111111-1111-1111-1111-111111111111");

  function getOrCreateConversationId() {
    const existing = localStorage.getItem("conversationId");
    if (existing) return existing;
    const newId = crypto.randomUUID();
    localStorage.setItem("conversationId", newId);
    return newId;
  }
  const conversationId = useRef(getOrCreateConversationId());
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom as messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeTool, isAwaitingApproval]);

  // Load conversation history on initial mount / reload
  useEffect(() => {
    async function loadHistory() {
      try {
        const history = await getConversation(conversationId.current);
        if (history && history.length > 0) {
          setMessages(history);
        } else {
          setMessages([]);
        }
      } catch (err) {
        console.error("Failed to load conversation history:", err);
        setMessages([]);
      }
    }
    loadHistory();
  }, []);

  // Reset conversation to start fresh
  const handleNewConversation = () => {
    const newId = crypto.randomUUID();
    localStorage.setItem("conversationId", newId);
    conversationId.current = newId;
    setMessages([]);
    setIsAwaitingApproval(false);
    setActiveTool(null);
    setInput("");
  };

  // SSE Stream Handlers
  const handlers = {
    onToken: (data) => {
      // Clear tool indicator once agent starts emitting text
      setActiveTool(null);

      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage?.type === "ai") {
          return [
            ...prev.slice(0, -1),
            { ...lastMessage, content: lastMessage.content + data.content },
          ];
        } else {
          return [...prev, { type: "ai", content: data.content }];
        }
      });
    },
    onToolStart: (data) => {
      setActiveTool(data.tool);
    },
    onAwaitingApproval: () => {
      setActiveTool(null);
      setIsAwaitingApproval(true);
      setIsStreaming(false);
    },
    onEnd: () => {
      setActiveTool(null);
      setIsStreaming(false);
    },
    onError: (err) => {
      console.error("Chat streaming error:", err);
      setActiveTool(null);
      setIsStreaming(false);
      setMessages((prev) => [
        ...prev,
        {
          type: "ai",
          content:
            "Sorry, I encountered a temporary connection issue. Please try again.",
        },
      ]);
    },
  };

  // Dispatch message
  const handleSend = async (messageText = input) => {
    const textToSend = messageText.trim();
    if (!textToSend || isStreaming) return;

    // Append user message immediately
    setMessages((prev) => [...prev, { type: "human", content: textToSend }]);
    setInput("");
    setIsStreaming(true);
    setActiveTool(null);

    await streamChat(
      textToSend,
      conversationId.current,
      customerId.current,
      handlers,
    );
  };

  // Handle Enter to submit, Shift+Enter for newline
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Chat Top Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-900">
                Customer Support AI
              </h1>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Orders • Refunds • Support
            </p>
          </div>
        </div>

        {/* Reset Conversation Button */}
        <button
          type="button"
          onClick={handleNewConversation}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          title="Start fresh conversation"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>New Chat</span>
        </button>
      </header>

      {/* Main Messages Scroll Container */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-6 max-w-3xl w-full mx-auto">
        {messages.length === 0 ? (
          /* Welcome Card with Starter Chips */
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              How can we help you today?
            </h2>
            <p className="mt-1 text-xs text-slate-500 max-w-sm">
              I can check order status, track shipping, or assist with refunds
              and cancellations.
            </p>

            <div className="mt-6 flex flex-col gap-2 w-full max-w-md">
              {QUICK_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(prompt)}
                  className="px-4 py-2.5 text-left text-xs font-medium text-slate-700 bg-white hover:bg-indigo-50/60 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 rounded-xl shadow-2xs transition-all duration-150 cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Rendered Message List */
          <div className="space-y-1">
            {messages.map((msg, i) => (
              <MessageBubble
                key={i}
                message={msg}
                isStreaming={isStreaming}
                isLast={i === messages.length - 1}
              />
            ))}

            {/* Live Tool Progress Indicator */}
            {activeTool && <StatusIndicator toolName={activeTool} />}

            {/* Human-In-The-Loop Waiting Banner */}
            {isAwaitingApproval && <ApprovalBanner />}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Message Form */}
      <div className="p-4 bg-white/90 backdrop-blur-md border-t border-slate-200/80">
        <div className="max-w-3xl mx-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:bg-white transition-all shadow-xs"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your order, tracking, or request a refund..."
              rows={1}
              className="flex-1 px-3 py-2 bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none resize-none max-h-32 overflow-y-auto"
            />

            <button
              type="submit"
              disabled={isStreaming || !input.trim()}
              className="p-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0 shadow-2xs cursor-pointer"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <p className="mt-1.5 text-center text-[10px] text-slate-400">
            Press{" "}
            <kbd className="font-mono bg-slate-100 px-1 py-0.5 rounded border border-slate-200">
              Enter
            </kbd>{" "}
            to send,{" "}
            <kbd className="font-mono bg-slate-100 px-1 py-0.5 rounded border border-slate-200">
              Shift + Enter
            </kbd>{" "}
            for newline
          </p>
        </div>
      </div>
    </div>
  );
}

export default Chat;
