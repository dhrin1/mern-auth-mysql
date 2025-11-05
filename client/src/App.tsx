// src/App.tsx
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import Register from "./pages/register";
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import Profile from "./pages/profile";
import ProtectedRoute from "./components/ProtectedROute";
import PublicRoute from "./components/PublicRoute";
import { api } from "./lib/api";
import { useEffect, useState } from "react";

export default function App() {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );

  useEffect(() => {
    const handleStorageChange = () => {
      console.log("Storage changed, updating token...");
      setToken(localStorage.getItem("token"));
    };

    window.addEventListener("storage", handleStorageChange);

    window.addEventListener("localStorageChange", handleStorageChange);

    // since we dont use a context, use the intercal listener
    const interval = setInterval(() => {
      const currentToken = localStorage.getItem("token");
      if (currentToken !== token) {
        console.log("Token changed via polling");
        setToken(currentToken);
      }
    }, 1000);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("localStorageChange", handleStorageChange);
      clearInterval(interval);
    };
  }, [token]);

  const handleLogout = async () => {
    try {
      await api("/auth/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      setToken(null);

      window.dispatchEvent(new Event("localStorageChange"));
    }
  };

  return (
    <BrowserRouter>
      <nav className="bg-gray-800 p-4 text-white">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <Link to="/" className="text-xl font-bold">
              MyApp
            </Link>
          </div>
          <div className="space-x-4">
            {token ? (
              <>
                <Link to="/dashboard" className="hover:text-gray-300">
                  Dashboard
                </Link>
                <Link to="/profile" className="hover:text-gray-300">
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/register" className="hover:text-gray-300">
                  Register
                </Link>
                <Link to="/login" className="hover:text-gray-300">
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="container mx-auto p-4">
        <Routes>
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/"
            element={
              token ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="bg-gray-800 text-white mt-10">
        <div className="container mx-auto px-4 py-8">
          <div className="  flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-300 text-sm mb-4 md:mb-0">
              © {new Date().getFullYear()} MyApp. All rights reserved.
            </div>

            <div className="flex items-center space-x-2 text-gray-300">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm">Built with React & Node.js</span>
            </div>

            <div className="text-gray-300 text-sm mt-4 md:mt-0">
              Developed by{" "}
              <span className="font-semibold text-white">Alhdrin Gungon</span>
            </div>
          </div>
        </div>
      </footer>
    </BrowserRouter>
  );
}
