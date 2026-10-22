import { useState, useRef, useEffect } from "react";
import { getConversation } from "../assets/api/client";
import { streamChat } from "../assets/api/stream";

function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAwaitingApproval, setIsAwaitingApproval] = useState(false);

  const customerId = useRef("11111111-1111-1111-1111-111111111111");

  function getOrCreateConversationId() {
    const existing = localStorage.getItem("conversationId");
    if (existing) return existing;
    const newId = crypto.randomUUID();
    localStorage.setItem("conversationId", newId);
    return newId;
  }
  const conversationId = useRef(getOrCreateConversationId());

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

  const handlers = {
    onToken: (data) => {
      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1];

        if (lastMessage?.type === "ai") {
          return [
            ...prev.slice(0, -1),
            {
              ...lastMessage,
              content: lastMessage.content + data.content,
            },
          ];
        } else {
          return [
            ...prev,
            {
              type: "ai",
              content: data.content,
            },
          ];
        }
      });
    },
    onToolStart: (data) => {
      console.log(data);
    },
    onAwaitingApproval: () => {
      setIsAwaitingApproval(true);
      setIsStreaming(false);
    },
    onEnd: () => {
      setIsStreaming(false);
    },
    onError: (err) => {
      console.error(err);
    },
  };

  const handleSend = async () => {
    if (input === "" || isStreaming === true) {
      return;
    }

    setMessages((prev) => {
      return [
        ...prev,
        {
          type: "human",
          content: input,
        },
      ];
    });

    setInput("");
    setIsStreaming(true);
    await streamChat(
      input,
      conversationId.current,
      customerId.current,
      handlers,
    );
  };

  return (
    <div className="flex flex-col h-screen mx-auto p-4 bg-gray-100 items-center">
      <div className="flex-1 w-full max-w-xl overflow-y-auto resize-none [field-sizing:content] space-y-2 p-2 rounded">
        {messages
          .filter((msg) => msg.type === "human" || msg.type === "ai")
          .map((msg, i) => (
            <div key={i}>
              <strong>{msg.type === "human" ? "You" : "agent"}:</strong>
              {msg.content}
            </div>
          ))}
        {isAwaitingApproval && (
          <p className="p-2 my-2 bg-yellow-100 text-yellow-800 rounded">
            Waiting for manager approval
          </p>
        )}
      </div>
      <div className="w-full max-w-xl py-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="mt-2 flex gap-2"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-8 py-4 rounded-full shadow-lg bg-white resize-none [field-sizing:content] max-h-48 overflow-y-auto focus:outline-none"
            rows={1}
          />
          <button
            type="submit"
            disabled={isStreaming}
            className="px-6 py-2 rounded-full text-white font-bold bg-gray-800 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default Chat;
