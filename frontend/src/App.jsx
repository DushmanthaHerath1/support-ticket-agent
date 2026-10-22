import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Chat from "./screens/Chat";
import Approvals from "./screens/Approvals";
import Tickets from "./screens/Tickets";
import AdminLayout from "./layouts/AdminLayout";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Chat />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to={"approvals"} />} />
          <Route path="approvals" element={<Approvals />} />
          <Route path="tickets" element={<Tickets />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
