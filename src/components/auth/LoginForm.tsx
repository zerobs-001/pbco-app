"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import CompactInput from '@/components/ui/CompactInput';

interface LoginFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

const LoginForm: React.FC<LoginFormProps> = ({ 
  onSuccess, 
  redirectTo = '/dashboard' 
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { signIn, loading, error, clearError } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    clearError();

    // Basic validation
    if (!email || !password) {
      setFormError('Please fill in all fields');
      setIsSubmitting(false);
      return;
    }

    if (!email.includes('@')) {
      setFormError('Please enter a valid email address');
      setIsSubmitting(false);
      return;
    }

    try {
      console.log('🔥 LoginForm: Starting sign in for:', email);
      
      // Add a safety timeout to prevent indefinite hanging
      const signInPromise = signIn(email, password);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Login form timeout')), 20000)
      );
      
      const { error } = await Promise.race([signInPromise, timeoutPromise]).catch(err => {
        console.error('🔥 LoginForm: Timeout or error:', err);
        return { error: { message: 'Login is taking too long. Please try again.' } };
      }) as any;

      console.log('🔥 LoginForm: Sign in result:', error ? 'Error' : 'Success', error);

      if (!error) {
        // Success
        console.log('🔥 LoginForm: Sign in successful, redirecting to:', redirectTo);
        if (onSuccess) {
          onSuccess();
        } else {
          // Add a small delay to ensure auth state is updated
          setTimeout(() => {
            router.push(redirectTo);
          }, 100);
        }
      } else {
        console.error('🔥 LoginForm: Sign in error:', error);
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error('🔥 LoginForm: Unexpected error:', err);
      setFormError('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  const displayError = formError || error;
  const isLoading = loading || isSubmitting;

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white shadow-lg rounded-lg p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign In</h2>
          <p className="text-gray-600 text-sm">
            Welcome back to your property portfolio
          </p>
        </div>

        {displayError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{displayError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label 
              htmlFor="email" 
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email Address
            </label>
            <CompactInput
              id="email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="Enter your email"
              disabled={isLoading}
              className="focus:border-blue-500"
            />
          </div>

          <div>
            <label 
              htmlFor="password" 
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Password
            </label>
            <CompactInput
              id="password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="Enter your password"
              disabled={isLoading}
              className="focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <Link 
              href="/auth/reset-password"
              className="text-sm text-blue-600 hover:text-blue-500 transition-colors"
            >
              Forgot your password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`
              w-full py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200
              ${isLoading 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm hover:shadow-md'
              }
            `}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2" />
                Signing In...
              </div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link 
              href="/auth/register"
              className="text-blue-600 hover:text-blue-500 font-medium transition-colors"
            >
              Create one now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;