import {useState} from 'react';
import React from 'react';
function RegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
    //Handle form submission
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault(); //prevent page refresh
  console.log('Registration attempt:', { firstName, lastName, email, password });
  alert(`Creating account for: ${firstName} ${lastName} with email: ${email}`);
  //Later we'll connect this to api
  };
  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
      <h2>Get Started Free</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <input 
            type="text" 
            placeholder="First Name" 
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            style={{ width: '100%', padding: '10px', border: '1px solid #ccc' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <input 
            type="text" 
            placeholder="Last Name" 
            value={lastName}
            onChange={(e) => setLastName(e.target.value)} 
            style={{ width: '100%', padding: '10px', border: '1px solid #ccc' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <input 
            type="email" 
            placeholder="Email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: '10px', border: '1px solid #ccc' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <input 
            type="password" 
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}  
            style={{ width: '100%', padding: '10px', border: '1px solid #ccc' }}
          />
        </div>
        <button type="submit" style={{ 
          width: '100%', 
          padding: '10px', 
          backgroundColor: '#28a745', 
          color: 'white', 
          border: 'none' 
        }}>
          Create Account
        </button>
      </form>
    </div>
  );
}

export default RegisterPage;