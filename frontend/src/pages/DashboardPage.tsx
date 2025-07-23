function DashboardPage() {
  return (
    <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ marginBottom: "40px" }}>
        <h1
          style={{ fontSize: "2.5rem", color: "#2c3e50", marginBottom: "10px" }}
        >
          Welcome to Your Dashboard
        </h1>
        <p style={{ color: "#7f8c8d", fontSize: "1.1rem" }}>
          Manage your AI Interview Assistant subscription and download the
          desktop app
        </p>
      </div>

      {/* Account Status */}
      <div
        style={{
          backgroundColor: "#e8f5e8",
          border: "1px solid #4caf50",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "30px",
        }}
      >
        <h3 style={{ color: "#2e7d32", marginBottom: "10px" }}>
          ✅ Account Active
        </h3>
        <p style={{ color: "#2e7d32", margin: "0" }}>
          Pro Plan • Renews on February 15, 2024 • $29/month
        </p>
      </div>

      {/* Quick Actions */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "30px",
          marginBottom: "40px",
        }}
      >
        {/* Download App */}
        <div
          style={{
            backgroundColor: "white",
            padding: "30px",
            borderRadius: "10px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "20px" }}>💻</div>
          <h3 style={{ color: "#2c3e50", marginBottom: "15px" }}>
            Download Desktop App
          </h3>
          <p style={{ color: "#7f8c8d", marginBottom: "20px" }}>
            Get the full AI Interview Assistant experience on your computer
          </p>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <button
              style={{
                backgroundColor: "#3498db",
                color: "white",
                border: "none",
                padding: "12px 20px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              📥 Download for Windows
            </button>
            <button
              style={{
                backgroundColor: "#95a5a6",
                color: "white",
                border: "none",
                padding: "12px 20px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              📥 Download for macOS
            </button>
          </div>
        </div>

        {/* Usage Stats */}
        <div
          style={{
            backgroundColor: "white",
            padding: "30px",
            borderRadius: "10px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "20px" }}>📊</div>
          <h3 style={{ color: "#2c3e50", marginBottom: "15px" }}>
            This Month's Usage
          </h3>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "10px",
            }}
          >
            <span>AI Solutions Generated:</span>
            <strong>247</strong>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "10px",
            }}
          >
            <span>Study Sessions:</span>
            <strong>18</strong>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "20px",
            }}
          >
            <span>Success Rate:</span>
            <strong style={{ color: "#27ae60" }}>94%</strong>
          </div>
          <button
            style={{
              backgroundColor: "#e74c3c",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "6px",
              cursor: "pointer",
              width: "100%",
            }}
          >
            View Detailed Analytics
          </button>
        </div>
      </div>

      {/* Account Management */}
      <div
        style={{
          backgroundColor: "white",
          padding: "30px",
          borderRadius: "10px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          marginBottom: "30px",
        }}
      >
        <h3 style={{ color: "#2c3e50", marginBottom: "20px" }}>
          Account Management
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "15px",
          }}
        >
          <button
            style={{
              backgroundColor: "#3498db",
              color: "white",
              border: "none",
              padding: "12px 20px",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Update Payment Method
          </button>

          <button
            style={{
              backgroundColor: "#f39c12",
              color: "white",
              border: "none",
              padding: "12px 20px",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Change Plan
          </button>

          <button
            style={{
              backgroundColor: "#95a5a6",
              color: "white",
              border: "none",
              padding: "12px 20px",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Download Invoices
          </button>

          <button
            style={{
              backgroundColor: "#e74c3c",
              color: "white",
              border: "none",
              padding: "12px 20px",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Cancel Subscription
          </button>
        </div>
      </div>

      {/* Support */}
      <div
        style={{
          backgroundColor: "#f8f9fa",
          padding: "30px",
          borderRadius: "10px",
          textAlign: "center",
        }}
      >
        <h3 style={{ color: "#2c3e50", marginBottom: "15px" }}>Need Help?</h3>
        <p style={{ color: "#7f8c8d", marginBottom: "20px" }}>
          Our support team is here to help you get the most out of AI Interview
          Assistant
        </p>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "15px",
            flexWrap: "wrap",
          }}
        >
          <button
            style={{
              backgroundColor: "#17a2b8",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            📧 Email Support
          </button>
          <button
            style={{
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            💬 Live Chat
          </button>
          <button
            style={{
              backgroundColor: "#6f42c1",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            📖 User Guide
          </button>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
