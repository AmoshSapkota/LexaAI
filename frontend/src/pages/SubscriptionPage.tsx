function SubscriptionPage() {
  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2.5rem', color: '#2c3e50', marginBottom: '20px', textAlign: 'center' }}>
        Subscription Management
      </h1>
      
      {/* Current Plan */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '30px', 
        borderRadius: '10px', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        marginBottom: '30px',
        border: '2px solid #3498db'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ color: '#2c3e50', margin: '0' }}>Current Plan</h2>
          <span style={{ 
            backgroundColor: '#3498db', 
            color: 'white', 
            padding: '5px 15px', 
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            ACTIVE
          </span>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.8rem', color: '#2c3e50', marginBottom: '5px' }}>Pro Plan</h3>
          <p style={{ color: '#7f8c8d', fontSize: '1.1rem' }}>$29/month • Unlimited AI solutions</p>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div>
            <strong>Next Billing Date:</strong>
            <p style={{ margin: '5px 0', color: '#7f8c8d' }}>February 15, 2024</p>
          </div>
          <div>
            <strong>Billing Method:</strong>
            <p style={{ margin: '5px 0', color: '#7f8c8d' }}>•••• •••• •••• 4242</p>
          </div>
        </div>
        
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '15px', 
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h4 style={{ color: '#2c3e50', marginBottom: '10px' }}>What's Included:</h4>
          <ul style={{ margin: '0', paddingLeft: '20px', color: '#7f8c8d' }}>
            <li>Unlimited AI-powered coding solutions</li>
            <li>Desktop app for Windows, Mac, and Linux</li>
            <li>Priority customer support</li>
            <li>Progress tracking and analytics</li>
            <li>Export and save solutions</li>
          </ul>
        </div>
      </div>

      {/* Billing History */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '30px', 
        borderRadius: '10px', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        marginBottom: '30px'
      }}>
        <h3 style={{ color: '#2c3e50', marginBottom: '20px' }}>Billing History</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '15px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <div>
              <strong>January 15, 2024</strong>
              <p style={{ margin: '5px 0 0 0', color: '#7f8c8d' }}>Pro Plan - Monthly</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <strong>$29.00</strong>
              <p style={{ margin: '5px 0 0 0', color: '#27ae60', fontSize: '14px' }}>PAID</p>
            </div>
            <button style={{
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              padding: '8px 15px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '12px'
            }}>
              Download
            </button>
          </div>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '15px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <div>
              <strong>December 15, 2023</strong>
              <p style={{ margin: '5px 0 0 0', color: '#7f8c8d' }}>Pro Plan - Monthly</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <strong>$29.00</strong>
              <p style={{ margin: '5px 0 0 0', color: '#27ae60', fontSize: '14px' }}>PAID</p>
            </div>
            <button style={{
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              padding: '8px 15px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '12px'
            }}>
              Download
            </button>
          </div>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '15px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <div>
              <strong>November 15, 2023</strong>
              <p style={{ margin: '5px 0 0 0', color: '#7f8c8d' }}>Free Trial Started</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <strong>$0.00</strong>
              <p style={{ margin: '5px 0 0 0', color: '#7f8c8d', fontSize: '14px' }}>TRIAL</p>
            </div>
            <button style={{
              backgroundColor: '#95a5a6',
              color: 'white',
              border: 'none',
              padding: '8px 15px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '12px'
            }}>
              N/A
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '15px',
        marginBottom: '30px'
      }}>
        <button style={{
          backgroundColor: '#f39c12',
          color: 'white',
          border: 'none',
          padding: '15px 20px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '16px'
        }}>
          🔄 Change Plan
        </button>
        
        <button style={{
          backgroundColor: '#3498db',
          color: 'white',
          border: 'none',
          padding: '15px 20px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '16px'
        }}>
          💳 Update Payment
        </button>
        
        <button style={{
          backgroundColor: '#e74c3c',
          color: 'white',
          border: 'none',
          padding: '15px 20px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '16px'
        }}>
          ❌ Cancel Subscription
        </button>
      </div>

      {/* Cancel Subscription Warning */}
      <div style={{ 
        backgroundColor: '#fff3cd', 
        border: '1px solid #ffeaa7', 
        borderRadius: '8px', 
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h4 style={{ color: '#856404', marginBottom: '10px' }}>⚠️ Cancellation Policy</h4>
        <p style={{ color: '#856404', margin: '0', fontSize: '14px' }}>
          You can cancel your subscription at any time. Your access will continue until the end of your current billing period (February 15, 2024). 
          After cancellation, you'll lose access to the desktop app and all premium features.
        </p>
      </div>

      {/* Support */}
      <div style={{ 
        textAlign: 'center',
        backgroundColor: '#f8f9fa',
        padding: '20px',
        borderRadius: '8px'
      }}>
        <p style={{ color: '#7f8c8d', marginBottom: '10px' }}>
          Need help with your subscription?
        </p>
        <button style={{
          backgroundColor: '#17a2b8',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '6px',
          cursor: 'pointer'
        }}>
          Contact Support
        </button>
      </div>
    </div>
  );
}

export default SubscriptionPage;
