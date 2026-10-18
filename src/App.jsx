import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Audit from "./pages/Audit";
import Instruments from "./pages/Instruments";
import Login from "./pages/Login";
import Overview from "./pages/Overview";
import Support from "./pages/Support";
import Transactions from "./pages/Transactions";
import UserDetail from "./pages/UserDetail";
import Users from "./pages/Users";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Overview />} />
        <Route path="users" element={<Users />} />
        <Route path="users/:id" element={<UserDetail />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="support" element={<Support />} />
        <Route path="support/:id" element={<Support />} />
        <Route path="instruments" element={<Instruments />} />
        <Route path="audit" element={<Audit />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
