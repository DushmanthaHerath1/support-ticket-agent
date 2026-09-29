const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// export async function streamChatExample(payload, onChunk, signal) {
//   const response = await fetch(`${BASE_URL}/chat`, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify(payload),
//     signal,
//   });

//   if (!response.ok) {
//     const errorData = await response.json().catch(() => null);
//     throw new Error(
//       errorData?.message || `HTTP error! Status: ${response.status}`,
//     );
//   }

//   const reader = response.body.getReader();
//   const decoder = new TextDecoder("utf-8");

//   while (true) {
//     const { done, value } = await reader.read();
//     if (done) break;

//     const textChunk = decoder.decode(value, { stream: true });

//     onChunk(textChunk);
//   }
// }

function processSseBlock(block, handlers) {
  let eventType = "messages";
  let rawData = "";

  const lines = block.split(/\r?\n/);

  for (const line of lines) {
    if (line.startsWith("event:")) {
      eventType = line.replace("event:", "").trim();
    } else if (line.startsWith("data:")) {
      rawData = line.replace("data:", "").trim();
    }
  }

  if (!rawData) return;

  let parseData;

  try {
    parseData = JSON.parse(rawData);
  } catch {
    parseData = rawData;
  }

  switch (eventType) {
    case "token":
      handlers.onToken?.(parseData);
      break;
    case "tool_start":
      handlers.onToolStart?.(parseData);
      break;
    case "awaiting_approval":
      handlers.onAwaitingApproval?.(parseData);
      break;
    case "end":
      handlers.onEnd?.(parseData);
      break;
    default:
      break;
  }
}

export async function streamChat(
  message,
  conversationId,
  customerId,
  handlers = {},
) {
  const { onEnd, onError } = handlers;

  try {
    const response = await fetch(`${BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        conversation_id: conversationId,
        customer_id: customerId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.message || `HTTP error! Status: ${response.status}`,
      );
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const parts = buffer.split(/\r?\n\r?\n/);

      buffer = parts.pop();

      for (const block of parts) {
        if (!block.trim()) continue;
        processSseBlock(block, handlers);
      }
    }
    if (onEnd) onEnd();
  } catch (err) {
    if (onError) onError(err);
    else console.error("Stream error:", err);
  }
}
