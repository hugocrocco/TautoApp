import { HashRouter as Router, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Card from "./pages/Card";
import Register from "./pages/Register";
import Benefits from "./pages/Benefits";
import Admin from "./pages/Admin";
import Verify from "./pages/Verify";
import Login from "./pages/Login";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/card" element={<Card />} />
        <Route path="/register" element={<Register />} />
        <Route path="/benefits" element={<Benefits />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/verify/:code" element={<Verify />} />
      </Routes>
    </Router>
  );
}