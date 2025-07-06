import React from 'react';
import { Button } from './ui/button';
import { useAuth } from '../hooks/useAuth';

const LandingPage = () => {
  const { session, signIn, signOut } = useAuth();

  const handleLogin = () => {
    const email = prompt('Enter your email for a magic link');
    if (email) {
      signIn(email);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600 text-white px-4 text-center">
      <h1 className="text-5xl font-bold mb-4">BundlePitch.ai</h1>
      <p className="mb-8 max-w-2xl">
        Generate compelling Etsy bundle copy with AI. Sign up with your email to try one free request.
      </p>
      {session ? (
        <>
          <Button className="mb-4" onClick={signOut}>Sign Out</Button>
          <a href="/app" className="underline">Go to App</a>
        </>
      ) : (
        <Button onClick={handleLogin}>Sign Up / Log In</Button>
      )}
    </div>
  );
};

export default LandingPage;
