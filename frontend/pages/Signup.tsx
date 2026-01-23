import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { request } from '../services/api';
import GenieCard from '../components/ui/GenieCard';
import GenieButton from '../components/ui/GenieButton';

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await request<{ token: string }>(`/api/auth/signup`, {
        method: 'POST',
        body: JSON.stringify({ name, email, password })
      });
      localStorage.setItem('auth_token', result.token);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="genie-terminal flex items-center justify-center p-6">
      <div className="relative z-10 w-full max-w-md">
        <GenieCard>
          <div className="genie-section-number">00.</div>
          <h1 className="text-2xl font-semibold">Initialize Operator</h1>
          <p className="genie-muted text-sm mt-2">Provision a new access node.</p>

          {error && <div className="text-sm text-red-500 mt-4">{error}</div>}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-[0.3em] text-green-400 mb-2">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-[0.3em] text-green-400 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
                required
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-[0.3em] text-green-400 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full"
                required
              />
            </div>
            <GenieButton type="submit" disabled={loading} variant="primary" className="w-full justify-center">
              {loading ? 'Creating…' : 'Sign up ->'}
            </GenieButton>
          </form>

          <p className="text-xs text-green-400/80 mt-6">
            {'>'} Already have an account?{' '}
            <Link to="/login" className="text-green-400 underline">
              Sign in
            </Link>
          </p>
        </GenieCard>
      </div>
    </div>
  );
};

export default Signup;
