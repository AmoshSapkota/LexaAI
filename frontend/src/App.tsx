import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store";
import lexaaiLogo from "./assets/lexaai-logo.svg";
import HomePage from "./pages/HomePage";
import PricingPage from "./pages/PricingPage";
import DashboardPage from "./pages/DashboardPage";
import SubscriptionPage from "./pages/SubscriptionPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

function SimpleNavigation() {
  return (
    <nav
      style={{
        backgroundColor: "#2c3e50",
        padding: "15px 0",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        width: "100%",
        position: "sticky",
        top: 0,
        zIndex: 1000,
      }}
    >
      <div className="container">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
          }}
        >
          <Link
            to="/"
            style={{
              color: "#fff",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <img
              src={lexaaiLogo}
              alt="LexaAI"
              style={{ height: "32px", width: "auto" }}
            />
            <span
              style={{
                fontSize: "1.5rem",
                fontWeight: "bold",
              }}
            >
              LexaAI
            </span>
          </Link>

          <div style={{ display: "flex", gap: "30px", alignItems: "center" }}>
            <a
              href="/#pricing-plans"
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById("pricing-plans")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              style={{
                color: "#ecf0f1",
                textDecoration: "none",
                fontSize: "16px",
                transition: "color 0.3s",
                cursor: "pointer",
              }}
            >
              Pricing
            </a>

            <Link
              to="/dashboard"
              style={{
                color: "#ecf0f1",
                textDecoration: "none",
                fontSize: "16px",
                transition: "color 0.3s",
              }}
            >
              Dashboard
            </Link>

            <Link
              to="/subscription"
              style={{
                color: "#ecf0f1",
                textDecoration: "none",
                fontSize: "16px",
                transition: "color 0.3s",
              }}
            >
              Subscription
            </Link>

            <div style={{ display: "flex", gap: "10px" }}>
              <Link to="/login">
                <button
                  style={{
                    backgroundColor: "transparent",
                    color: "#ecf0f1",
                    border: "1px solid #ecf0f1",
                    padding: "8px 16px",
                    borderRadius: "5px",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  Sign In
                </button>
              </Link>

              <Link to="/register">
                <button
                  style={{
                    backgroundColor: "#3498db",
                    color: "white",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "5px",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  Start Free Trial
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div
          style={{
            width: "100%",
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#f8f9fa",
          }}
        >
          <SimpleNavigation />

          <main style={{ flex: 1, width: "100%" }}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/subscription" element={<SubscriptionPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </Provider>
  );
}

export default App;
