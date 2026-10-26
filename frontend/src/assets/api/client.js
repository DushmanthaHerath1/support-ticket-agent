const BASE_URL = import.meta.env.VITE_API_BASE_URL;

//reusable helper function for fetch
async function apiClient(endpoint, options = {}) {
  const config = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.message || `HTTP Error. Status: ${response.status}`,
    );
  }

  return response.json();
}

export const getConversation = async (id) => {
  const data = await apiClient(`/chat/${id}`);

  return data;
};

export const getPendingApprovals = () => apiClient(`/approvals/pending`);

export const actOnApproval = (id, body) =>
  apiClient(`/approvals/${id}/action`, {
    method: "POST",
    body: JSON.stringify(body),
  });

export const getTickets = () => apiClient(`/tickets`);
