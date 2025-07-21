import { Link } from 'react-router-dom';

function PricingPage() {
  return (
    <div style={{ padding: '60px 20px', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '20px', color: '#2c3e50' }}>
          Choose Your Plan
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#7f8c8d', marginBottom: '60px' }}>
          Start with our free trial and upgrade when you're ready
        </p>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
          gap: '30px',
          marginBottom: '60px'
        }}>
          {/* Free Trial */}
          <div style={{ 
            backgroundColor: 'white', 
            padding: '40px', 
            borderRadius: '15px', 
            boxShadow: '0 5px 20px rgba(0,0,0,0.1)',
            border: '2px solid #e9ecef'
          }}>
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ fontSize: '1.5rem', color: '#2c3e50', marginBottom: '10px' }}>Free Trial</h3>
              <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#2c3e50' }}>$0</div>
              <p style={{ color: '#7f8c8d' }}>7 days free</p>
            </div>
            
            <ul style={{ 
              textAlign: 'left', 
              padding: '0', 
              listStyle: 'none',
              marginBottom: '30px'
            }}>
              <li style={{ margin: '10px 0', color: '#2c3e50' }}>✅ 50 AI-powered solutions</li>
              <li style={{ margin: '10px 0', color: '#2c3e50' }}>✅ Basic desktop app access</li>
              <li style={{ margin: '10px 0', color: '#2c3e50' }}>✅ Email support</li>
              <li style={{ margin: '10px 0', color: '#7f8c8d' }}>❌ Unlimited questions</li>
              <li style={{ margin: '10px 0', color: '#7f8c8d' }}>❌ Premium features</li>
            </ul>
            
            <Link to="/register">
              <button style={{
                width: '100%',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                padding: '15px',
                fontSize: '16px',
                borderRadius: '8px',
                cursor: 'pointer'
              }}>
                Start Free Trial
              </button>
            </Link>
          </div>
          
          {/* Pro Plan - Most Popular */}
          <div style={{ 
            backgroundColor: 'white', 
            padding: '40px', 
            borderRadius: '15px', 
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
            border: '3px solid #3498db',
            position: 'relative',
            transform: 'scale(1.05)'
          }}>
            <div style={{
              position: 'absolute',
              top: '-15px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: '#3498db',
              color: 'white',
              padding: '8px 20px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              MOST POPULAR
            </div>
            
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ fontSize: '1.5rem', color: '#2c3e50', marginBottom: '10px' }}>Pro</h3>
              <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#2c3e50' }}>
                $29
                <span style={{ fontSize: '1rem', color: '#7f8c8d' }}>/month</span>
              </div>
              <p style={{ color: '#7f8c8d' }}>Billed monthly</p>
            </div>
            
            <ul style={{ 
              textAlign: 'left', 
              padding: '0', 
              listStyle: 'none',
              marginBottom: '30px'
            }}>
              <li style={{ margin: '10px 0', color: '#2c3e50' }}>✅ Unlimited AI solutions</li>
              <li style={{ margin: '10px 0', color: '#2c3e50' }}>✅ Full desktop app features</li>
              <li style={{ margin: '10px 0', color: '#2c3e50' }}>✅ Priority support</li>
              <li style={{ margin: '10px 0', color: '#2c3e50' }}>✅ Progress tracking</li>
              <li style={{ margin: '10px 0', color: '#2c3e50' }}>✅ Export solutions</li>
            </ul>
            
            <Link to="/register">
              <button style={{
                width: '100%',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                padding: '15px',
                fontSize: '16px',
                borderRadius: '8px',
                cursor: 'pointer'
              }}>
                Choose Pro
              </button>
            </Link>
          </div>
          
          {/* Enterprise */}
          <div style={{ 
            backgroundColor: 'white', 
            padding: '40px', 
            borderRadius: '15px', 
            boxShadow: '0 5px 20px rgba(0,0,0,0.1)',
            border: '2px solid #e9ecef'
          }}>
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ fontSize: '1.5rem', color: '#2c3e50', marginBottom: '10px' }}>Enterprise</h3>
              <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#2c3e50' }}>$99</div>
              <p style={{ color: '#7f8c8d' }}>per user/month</p>
            </div>
            
            <ul style={{ 
              textAlign: 'left', 
              padding: '0', 
              listStyle: 'none',
              marginBottom: '30px'
            }}>
              <li style={{ margin: '10px 0', color: '#2c3e50' }}>✅ Everything in Pro</li>
              <li style={{ margin: '10px 0', color: '#2c3e50' }}>✅ Team management</li>
              <li style={{ margin: '10px 0', color: '#2c3e50' }}>✅ Custom integrations</li>
              <li style={{ margin: '10px 0', color: '#2c3e50' }}>✅ Dedicated support</li>
              <li style={{ margin: '10px 0', color: '#2c3e50' }}>✅ SLA guarantee</li>
            </ul>
            
            <button style={{
              width: '100%',
              backgroundColor: '#2c3e50',
              color: 'white',
              border: 'none',
              padding: '15px',
              fontSize: '16px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}>
              Contact Sales
            </button>
          </div>
        </div>
        
        {/* FAQ Section */}
        <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '15px', marginBottom: '40px' }}>
          <h2 style={{ marginBottom: '30px', color: '#2c3e50' }}>Frequently Asked Questions</h2>
          
          <div style={{ textAlign: 'left', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#2c3e50' }}>What's included in the free trial?</h4>
              <p style={{ color: '#7f8c8d' }}>
                You get full access to our desktop app with 50 AI-powered coding solutions. No credit card required.
              </p>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#2c3e50' }}>How does the desktop app work?</h4>
              <p style={{ color: '#7f8c8d' }}>
                After subscribing, you'll receive a download link for our Electron-based desktop application that works on Windows, Mac, and Linux.
              </p>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#2c3e50' }}>Can I cancel anytime?</h4>
              <p style={{ color: '#7f8c8d' }}>
                Yes! You can cancel your subscription at any time. Your access will continue until the end of your current billing period.
              </p>
            </div>
          </div>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#7f8c8d' }}>
            All plans include our 30-day money-back guarantee
          </p>
        </div>
      </div>
    </div>
  );
}

export default PricingPage;
