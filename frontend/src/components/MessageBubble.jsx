import React, { useState } from "react";
import { Bot, User, Copy, Check } from "lucide-react";

export default function MessageBubble({
  message,
  isStreaming = false,
  isLast = false,
}) {
  const [copied, setCopied] = useState(false);
  const isHuman = message.type === "human";
  const isAi = message.type === "ai";

  const handleCopy = () => {
    if (!message.content) return;
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  if (!isHuman && !isAi) return null;

  return (
    <div
      className={`group flex items-start gap-2.5 my-3 animate-in fade-in duration-200 ${
        isHuman ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-white shadow-2xs mt-0.5 ${
          isHuman ? "bg-slate-700" : "bg-indigo-600"
        }`}
      >
        {isHuman ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Bubble Container */}
      <div className="relative max-w-[85%] sm:max-w-[78%]">
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
            isHuman
              ? "bg-slate-900 text-white rounded-tr-xs shadow-xs"
              : "bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs shadow-2xs"
          }`}
        >
          {message.content}

          {/* Streaming blinking cursor on active AI generation */}
          {isAi && isStreaming && isLast && (
            <span className="inline-block w-1.5 h-3.5 bg-indigo-500 rounded-full animate-pulse ml-1 align-middle" />
          )}
        </div>

        {/* Copy button on AI messages */}
        {isAi && !isStreaming && message.content && (
          <button
            type="button"
            onClick={handleCopy}
            className="absolute -bottom-5 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-slate-400 hover:text-slate-600 flex items-center gap-1 cursor-pointer bg-white px-1.5 py-0.5 rounded-md border border-slate-200/60 shadow-2xs"
            title="Copy response"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span className="text-emerald-600 font-medium">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
