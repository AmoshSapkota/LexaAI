import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { createSubscription } from "../store/slices/paymentSlice";

function HomePage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { isLoading } = useAppSelector((state) => state.payment);
  const { user } = useAppSelector((state) => state.auth);

  const handleSubscribe = async (planId: string) => {
    setErrorMessage(null);

    if (!user) {
      navigate("/register");
      return;
    }

    if (planId === "free_trial") {
      try {
        const result = await dispatch(
          createSubscription({ planId, paymentMethodId: "none" })
        ).unwrap();
        console.log("Free trial activated successfully:", result);
        navigate("/dashboard");
      } catch (error) {
        console.error("Free trial activation failed:", error);
        setErrorMessage(
          "Failed to activate free trial. This may be because the backend server is not running. Please contact support."
        );
      }
      return;
    }

    try {
      setErrorMessage(
        `Payment processing is not yet implemented for ${planId}. The backend services need to be configured with payment processing. Please contact support to subscribe to paid plans.`
      );
    } catch (error) {
      console.error("Subscription failed:", error);
      setErrorMessage(
        "Failed to process subscription. Please try again or contact support."
      );
    }
  };

  const plans = [
    {
      id: "free_trial",
      name: "Free Trial",
      price: 0,
      period: "7 days",
      sessionLimit: "5 minutes per session",
      totalSessions: "1 session per day",
      popular: false,
      features: [
        "✅ 5-minute practice sessions",
        "✅ 1 session per day limit",
        "✅ Basic AI teleprompter guidance",
        "✅ Technical topic explanations",
        "✅ Speaking confidence tips",
        "✅ Desktop app access",
        "✅ Basic algorithm discussions",
        "❌ Live coding assistance",
        "❌ Extended session time",
        "❌ Advanced features",
        "❌ Mock interview practice",
      ],
      buttonText: "Start Free Trial",
      buttonStyle: { backgroundColor: "#6c757d", color: "white" },
    },
    {
      id: "monthly_pro",
      name: "Monthly Pro",
      price: 15,
      period: "month",
      sessionLimit: "90 minutes per session",
      totalSessions: "Unlimited sessions",
      popular: false,
      features: [
        "✅ 90-minute practice sessions",
        "✅ Advanced AI teleprompter",
        "✅ Live coding assistance & explanations",
        "✅ Algorithm explanation practice",
        "✅ System design discussion guidance",
        "✅ Mock interview confidence building",
        "✅ Technical presentation practice",
        "✅ Real-time speaking feedback",
        "✅ Code explanation techniques",
        "✅ Confidence building exercises",
        "✅ Multiple programming languages",
        "✅ Email support",
      ],
      buttonText: "Choose Monthly Pro",
      buttonStyle: { backgroundColor: "#3498db", color: "white" },
    },
    {
      id: "yearly_pro",
      name: "Yearly Pro",
      price: 100,
      period: "year",
      sessionLimit: "90 minutes per session",
      totalSessions: "Unlimited sessions",
      popular: true,
      savings: "Save $80/year",
      features: [
        "✅ 90-minute practice sessions",
        "✅ Advanced AI teleprompter",
        "✅ Live coding assistance & explanations",
        "✅ Algorithm explanation practice",
        "✅ System design discussion guidance",
        "✅ Mock interview confidence building",
        "✅ Technical presentation practice",
        "✅ Real-time speaking feedback",
        "✅ Code explanation techniques",
        "✅ Confidence building exercises",
        "✅ Multiple programming languages",
        "✅ Priority email support",
        "✅ Early access to new features",
      ],
      buttonText: "Choose Yearly Pro",
      buttonStyle: { backgroundColor: "#27ae60", color: "white" },
    },
  ];
  return (
    <div style={{ width: "100%", minHeight: "100vh" }}>
      {/* Hero Section */}
      <section
        style={{
          minHeight: "100vh",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          padding: "0 20px",
        }}
      >
        <div className="container" style={{ maxWidth: "1200px" }}>
          <h1
            style={{
              fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
              marginBottom: "20px",
              fontWeight: "bold",
              lineHeight: "1.2",
            }}
          >
            Build Speaking Confidence with AI
          </h1>
          <p
            style={{
              fontSize: "clamp(1.1rem, 3vw, 1.4rem)",
              marginBottom: "40px",
              color: "rgba(255,255,255,0.9)",
              maxWidth: "700px",
              margin: "0 auto 40px auto",
              lineHeight: "1.6",
            }}
          >
            Practice technical discussions with AI-powered teleprompter
            assistance. Build confidence for presentations, meetings, and
            important conversations.
          </p>

          <div
            style={{
              display: "flex",
              gap: "clamp(15px, 3vw, 25px)",
              justifyContent: "center",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <Link to="/register">
              <button
                style={{
                  backgroundColor: "#3498db",
                  color: "white",
                  border: "none",
                  padding: "clamp(12px, 2vw, 18px) clamp(24px, 4vw, 35px)",
                  fontSize: "clamp(1rem, 2.5vw, 1.2rem)",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  minWidth: "200px",
                }}
              >
                🎯 Start Building Confidence
              </button>
            </Link>

            <button
              onClick={() => {
                document
                  .getElementById("pricing-plans")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              style={{
                backgroundColor: "transparent",
                color: "white",
                border: "2px solid white",
                padding: "clamp(12px, 2vw, 18px) clamp(24px, 4vw, 35px)",
                fontSize: "clamp(1rem, 2.5vw, 1.2rem)",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "bold",
                minWidth: "200px",
              }}
            >
              View Pricing
            </button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section 
        className="section-padding" 
        style={{ 
          backgroundColor: "white",
          width: "100%"
        }}
      >
        <div className="container">
          <h2
            style={{
              textAlign: "center",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              marginBottom: "clamp(40px, 6vw, 70px)",
              color: "#2c3e50",
            }}
          >
            How LexaAI Builds Your Confidence
          </h2>

          <div className="responsive-grid grid-3" style={{ textAlign: "center" }}>
            <div>
              <div
                style={{
                  backgroundColor: "#3498db",
                  color: "white",
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  fontWeight: "bold",
                  margin: "0 auto 20px auto",
                }}
              >
                1
              </div>
              <h3 style={{ color: "#2c3e50", marginBottom: "15px" }}>
                Practice Topics
              </h3>
              <p style={{ color: "#7f8c8d" }}>
                Enter technical topics you want to discuss. Our AI creates
                comprehensive talking points and explanations.
              </p>
            </div>

            <div>
              <div
                style={{
                  backgroundColor: "#3498db",
                  color: "white",
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  fontWeight: "bold",
                  margin: "0 auto 20px auto",
                }}
              >
                2
              </div>
              <h3 style={{ color: "#2c3e50", marginBottom: "15px" }}>
                Get AI Guidance
              </h3>
              <p style={{ color: "#7f8c8d" }}>
                Receive intelligent prompts and structured explanations to help
                you articulate complex concepts clearly.
              </p>
            </div>

            <div>
              <div
                style={{
                  backgroundColor: "#3498db",
                  color: "white",
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  fontWeight: "bold",
                  margin: "0 auto 20px auto",
                }}
              >
                3
              </div>
              <h3 style={{ color: "#2c3e50", marginBottom: "15px" }}>
                Build Confidence
              </h3>
              <p style={{ color: "#7f8c8d" }}>
                Practice speaking with AI support until you feel confident
                discussing any technical topic naturally.
              </p>
            </div>

            <div>
              <div
                style={{
                  backgroundColor: "#3498db",
                  color: "white",
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  fontWeight: "bold",
                  margin: "0 auto 20px auto",
                }}
              >
                4
              </div>
              <h3 style={{ color: "#2c3e50", marginBottom: "15px" }}>
                Speak Confidently
              </h3>
              <p style={{ color: "#7f8c8d" }}>
                Apply your improved communication skills in meetings,
                presentations, and important conversations!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: "80px 20px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <h2
            style={{
              textAlign: "center",
              fontSize: "2.5rem",
              marginBottom: "60px",
              color: "#2c3e50",
            }}
          >
            Why Choose LexaAI for Confidence Building?
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
              gap: "40px",
            }}
          >
            <div
              style={{
                backgroundColor: "white",
                padding: "40px",
                borderRadius: "15px",
                boxShadow: "0 5px 20px rgba(0,0,0,0.1)",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "3rem", marginBottom: "20px" }}>🎤</div>
              <h3 style={{ color: "#2c3e50", marginBottom: "15px" }}>
                Smart Teleprompter
              </h3>
              <p style={{ color: "#7f8c8d", lineHeight: "1.6" }}>
                Get AI-powered talking points and explanations for technical
                topics. Practice with intelligent prompts that boost your
                speaking confidence.
              </p>
            </div>

            <div
              style={{
                backgroundColor: "white",
                padding: "40px",
                borderRadius: "15px",
                boxShadow: "0 5px 20px rgba(0,0,0,0.1)",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "3rem", marginBottom: "20px" }}>🧠</div>
              <h3 style={{ color: "#2c3e50", marginBottom: "15px" }}>
                Confidence Building
              </h3>
              <p style={{ color: "#7f8c8d", lineHeight: "1.6" }}>
                Practice speaking about complex topics with AI guidance. Build
                natural confidence through repetition and feedback.
              </p>
            </div>

            <div
              style={{
                backgroundColor: "white",
                padding: "40px",
                borderRadius: "15px",
                boxShadow: "0 5px 20px rgba(0,0,0,0.1)",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "3rem", marginBottom: "20px" }}>⚡</div>
              <h3 style={{ color: "#2c3e50", marginBottom: "15px" }}>
                Real-time Practice
              </h3>
              <p style={{ color: "#7f8c8d", lineHeight: "1.6" }}>
                Practice explaining technical concepts in real-time. Get instant
                AI feedback to improve your communication skills.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section style={{ padding: "80px 20px", backgroundColor: "#f8f9fa" }}>
        <div
          style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}
        >
          <h2
            style={{
              fontSize: "2.5rem",
              marginBottom: "40px",
              color: "#2c3e50",
            }}
          >
            Trusted by 1000+ Professionals
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "30px",
              marginBottom: "40px",
            }}
          >
            <div
              style={{
                backgroundColor: "white",
                padding: "30px",
                borderRadius: "10px",
                boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
              }}
            >
              <p
                style={{
                  color: "#7f8c8d",
                  marginBottom: "20px",
                  fontStyle: "italic",
                }}
              >
                "LexaAI helped me practice technical explanations. Now I speak
                confidently in team meetings and presentations!"
              </p>
              <div style={{ fontWeight: "bold", color: "#2c3e50" }}>
                - Sarah M., Software Engineer
              </div>
            </div>

            <div
              style={{
                backgroundColor: "white",
                padding: "30px",
                borderRadius: "10px",
                boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
              }}
            >
              <p
                style={{
                  color: "#7f8c8d",
                  marginBottom: "20px",
                  fontStyle: "italic",
                }}
              >
                "The AI guidance helped me articulate complex algorithms
                clearly. My communication skills improved dramatically."
              </p>
              <div style={{ fontWeight: "bold", color: "#2c3e50" }}>
                - Mike R., Full Stack Developer
              </div>
            </div>

            <div
              style={{
                backgroundColor: "white",
                padding: "30px",
                borderRadius: "10px",
                boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
              }}
            >
              <p
                style={{
                  color: "#7f8c8d",
                  marginBottom: "20px",
                  fontStyle: "italic",
                }}
              >
                "Perfect for practicing technical discussions. I feel much more
                confident explaining my work now!"
              </p>
              <div style={{ fontWeight: "bold", color: "#2c3e50" }}>
                - Alex K., Backend Developer
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "40px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ color: "#7f8c8d" }}>⭐⭐⭐⭐⭐ 4.9/5 Rating</div>
            <div style={{ color: "#7f8c8d" }}>🎯 1000+ Confidence Sessions</div>
            <div style={{ color: "#7f8c8d" }}>🏢 Used by 1000s of Techies</div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section
        id="pricing"
        className="section-padding"
        style={{ backgroundColor: "#f8f9fa", width: "100%" }}
      >
        <div className="container" style={{ textAlign: "center" }}>
          <h2
            style={{
              fontSize: "clamp(2.5rem, 5vw, 3.5rem)",
              marginBottom: "20px",
              color: "#2c3e50",
            }}
          >
            Build Your Speaking Confidence
          </h2>
          <p
            style={{
              fontSize: "clamp(1.1rem, 3vw, 1.4rem)",
              color: "#7f8c8d",
              marginBottom: "20px",
              maxWidth: "800px",
              margin: "0 auto 40px auto",
              lineHeight: "1.6",
            }}
          >
            Master technical communication with AI-powered teleprompter
            assistance. Practice explaining code, algorithms, and system designs
            with confidence.
          </p>

          {/* Error Message */}
          {errorMessage && (
            <div
              style={{
                backgroundColor: "#f8d7da",
                color: "#721c24",
                padding: "15px",
                borderRadius: "8px",
                marginBottom: "30px",
                textAlign: "center",
                border: "1px solid #f5c6cb",
              }}
            >
              {errorMessage}
            </div>
          )}

          {/* Value Proposition */}
          <div
            style={{
              backgroundColor: "white",
              padding: "40px",
              borderRadius: "15px",
              boxShadow: "0 5px 20px rgba(0,0,0,0.1)",
              marginBottom: "50px",
            }}
          >
            <h2
              style={{
                fontSize: "2.5rem",
                marginBottom: "20px",
                color: "#2c3e50",
              }}
            >
              🎯 Why Choose LexaAI?
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "30px",
                textAlign: "left",
              }}
            >
              <div>
                <h3 style={{ color: "#3498db", marginBottom: "10px" }}>
                  📈 Build Real Confidence
                </h3>
                <p style={{ color: "#7f8c8d", lineHeight: "1.6" }}>
                  Practice technical explanations until they become second
                  nature. Our AI helps you articulate complex concepts clearly
                  and confidently.
                </p>
              </div>
              <div>
                <h3 style={{ color: "#3498db", marginBottom: "10px" }}>
                  💡 Smart AI Guidance
                </h3>
                <p style={{ color: "#7f8c8d", lineHeight: "1.6" }}>
                  Get real-time prompts for explaining algorithms, debugging
                  approaches, and system design decisions during practice
                  sessions.
                </p>
              </div>
            </div>
          </div>

          {/* Pricing Plans */}
          <div
            id="pricing-plans"
            className="responsive-grid grid-3"
            style={{
              marginBottom: "clamp(30px, 6vw, 60px)",
            }}
          >
            {plans.map((plan) => (
              <div
                key={plan.id}
                style={{
                  backgroundColor: "white",
                  padding: "40px 30px",
                  borderRadius: "15px",
                  boxShadow: plan.popular
                    ? "0 15px 40px rgba(52, 152, 219, 0.2)"
                    : "0 10px 30px rgba(0,0,0,0.1)",
                  textAlign: "center",
                  position: "relative",
                  border: plan.popular
                    ? "3px solid #3498db"
                    : "1px solid #ecf0f1",
                  transform: plan.popular ? "scale(1.05)" : "scale(1)",
                }}
              >
                {plan.popular && (
                  <div
                    style={{
                      position: "absolute",
                      top: "-15px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      backgroundColor: "#3498db",
                      color: "white",
                      padding: "8px 20px",
                      borderRadius: "20px",
                      fontSize: "14px",
                      fontWeight: "bold",
                    }}
                  >
                    MOST POPULAR
                  </div>
                )}

                <div style={{ marginBottom: "30px" }}>
                  <h3
                    style={{
                      fontSize: "1.8rem",
                      marginBottom: "15px",
                      color: "#2c3e50",
                    }}
                  >
                    {plan.name}
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      justifyContent: "center",
                      marginBottom: "10px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "3rem",
                        fontWeight: "bold",
                        color: "#2c3e50",
                      }}
                    >
                      ${plan.price}
                    </span>
                    <span style={{ fontSize: "1rem", color: "#7f8c8d" }}>
                      /{plan.period}
                    </span>
                  </div>
                  {plan.savings && (
                    <div
                      style={{
                        backgroundColor: "#e8f5e8",
                        color: "#27ae60",
                        padding: "8px 16px",
                        borderRadius: "20px",
                        display: "inline-block",
                        fontSize: "14px",
                        fontWeight: "bold",
                        marginBottom: "15px",
                      }}
                    >
                      {plan.savings}
                    </div>
                  )}
                  <div style={{ color: "#7f8c8d", marginBottom: "10px" }}>
                    <strong>{plan.sessionLimit}</strong>
                  </div>
                  <div style={{ color: "#7f8c8d", marginBottom: "20px" }}>
                    {plan.totalSessions}
                  </div>
                </div>

                <ul
                  style={{
                    textAlign: "left",
                    padding: "0",
                    listStyle: "none",
                    marginBottom: "30px",
                  }}
                >
                  {plan.features.map((feature, featureIndex) => (
                    <li
                      key={featureIndex}
                      style={{
                        padding: "8px 0",
                        borderBottom: "1px solid #f0f0f0",
                        fontSize: "14px",
                        color: feature.startsWith("❌") ? "#e74c3c" : "#2c3e50",
                      }}
                    >
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isLoading}
                  style={{
                    width: "100%",
                    padding: "15px",
                    fontSize: "16px",
                    fontWeight: "bold",
                    border: "none",
                    borderRadius: "8px",
                    cursor: isLoading ? "not-allowed" : "pointer",
                    transition: "background-color 0.3s ease",
                    ...plan.buttonStyle,
                  }}
                >
                  {isLoading ? "Processing..." : plan.buttonText}
                </button>
              </div>
            ))}
          </div>

          {/* FAQ Section */}
          <div
            style={{
              backgroundColor: "white",
              padding: "50px",
              borderRadius: "15px",
              boxShadow: "0 5px 20px rgba(0,0,0,0.1)",
              textAlign: "left",
              marginBottom: "40px",
            }}
          >
            <h2
              style={{
                textAlign: "center",
                marginBottom: "40px",
                color: "#2c3e50",
              }}
            >
              Frequently Asked Questions
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
                gap: "30px",
              }}
            >
              <div>
                <h3 style={{ color: "#3498db", marginBottom: "10px" }}>
                  🎯 How does the AI teleprompter help with confidence?
                </h3>
                <p style={{ color: "#7f8c8d", lineHeight: "1.6" }}>
                  Our AI provides structured talking points, code explanations,
                  and speaking prompts to help you articulate complex technical
                  concepts clearly and confidently.
                </p>
              </div>
              <div>
                <h3 style={{ color: "#3498db", marginBottom: "10px" }}>
                  💻 What is "live coding assistance"?
                </h3>
                <p style={{ color: "#7f8c8d", lineHeight: "1.6" }}>
                  The AI helps you explain your coding process step-by-step,
                  providing talking points for algorithm explanations, debugging
                  approaches, and solution walkthroughs.
                </p>
              </div>
              <div>
                <h3 style={{ color: "#3498db", marginBottom: "10px" }}>
                  ⏱️ How does the "1 session per day" limit work?
                </h3>
                <p style={{ color: "#7f8c8d", lineHeight: "1.6" }}>
                  Free trial users can start one practice session per day. Each
                  session lasts up to 5 minutes. The limit resets at midnight in
                  your timezone.
                </p>
              </div>
              <div>
                <h3 style={{ color: "#3498db", marginBottom: "10px" }}>
                  🔄 Can I cancel my subscription anytime?
                </h3>
                <p style={{ color: "#7f8c8d", lineHeight: "1.6" }}>
                  Yes! You can cancel anytime from your dashboard. Your current
                  subscription remains active until the end of your billing
                  period.
                </p>
              </div>
            </div>
          </div>

          {/* Contact Support */}
          <div style={{ textAlign: "center", padding: "20px" }}>
            <p style={{ color: "#7f8c8d", marginBottom: "20px" }}>
              Need help choosing the right plan?
            </p>
            <Link
              to="/contact"
              style={{
                color: "#3498db",
                textDecoration: "none",
                fontSize: "16px",
                fontWeight: "bold",
              }}
            >
              Contact our team →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        style={{
          padding: "80px 20px",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "2.5rem", marginBottom: "20px" }}>
            Ready to Build Your Speaking Confidence?
          </h2>
          <p
            style={{
              fontSize: "1.2rem",
              marginBottom: "40px",
              color: "rgba(255,255,255,0.9)",
            }}
          >
            Join thousands of professionals who've improved their communication
            skills
          </p>

          <Link to="/register">
            <button
              style={{
                backgroundColor: "#3498db",
                color: "white",
                border: "none",
                padding: "20px 40px",
                fontSize: "20px",
                borderRadius: "10px",
                cursor: "pointer",
                fontWeight: "bold",
                boxShadow: "0 5px 15px rgba(0,0,0,0.2)",
              }}
            >
              Start Building Confidence Now
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
