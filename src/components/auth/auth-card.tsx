'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { signIn, signUp } from '@/lib/auth-client';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Link from 'next/link';

interface AuthCardProps {
  pathname: string;
}

export function AuthCard({ pathname }: AuthCardProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [name, setName] = React.useState('');
  const [role, setRole] = React.useState<'patient' | 'doctor' | 'admin'>('patient');

  const isSignUp = pathname === 'sign-up';
  const isForgotPassword = pathname === 'forgot-password';

  const handleRoleRedirect = (userRole?: string) => {
    if (userRole === 'admin' || userRole === 'superadmin') {
      router.push('/admin');
    } else if (userRole === 'doctor') {
      router.push('/doctor');
    } else {
      router.push('/patient');
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const res = await signUp.email({
          email,
          password,
          name,
          // @ts-expect-error additional custom field
          role,
        });

        if (res.error) {
          toast.error(res.error.message || 'Failed to create account');
        } else {
          toast.success('Account created successfully!');
          handleRoleRedirect(role);
        }
      } else {
        const res = await signIn.email({
          email,
          password,
        });

        if (res.error) {
          toast.error(res.error.message || 'Invalid credentials');
        } else {
          toast.success('Signed in successfully!');
          const userRole = (res.data?.user as any)?.role || 'patient';
          handleRoleRedirect(userRole);
        }
      }
    } catch (err: any) {
      toast.error(err?.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signIn.social({
        provider: 'google',
        callbackURL: '/patient',
      });
    } catch (err: any) {
      toast.error(err?.message || 'Google sign-in error');
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-xl border-border/60">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">
          {isSignUp
            ? 'Create Your Account'
            : isForgotPassword
              ? 'Reset Password'
              : 'Sign In to Digital Clinic'}
        </CardTitle>
        <CardDescription>
          {isSignUp
            ? 'Enter your details below to register as a patient or clinician'
            : isForgotPassword
              ? 'Enter your email address to receive password reset instructions'
              : 'Access your clinical dashboard, records, and appointments'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isForgotPassword && (
          <Button
            type="button"
            variant="outline"
            className="w-full font-normal"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Continue with Google
          </Button>
        )}

        {!isForgotPassword && (
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or with email</span>
            </div>
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-3">
          {isSignUp && (
            <div className="space-y-1">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Sarah Jenkins"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="patient@clinic.test"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {!isForgotPassword && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {!isSignUp && (
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                )}
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          )}

          {isSignUp && (
            <div className="space-y-1">
              <Label htmlFor="role">Account Role</Label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                disabled={loading}
              >
                <option value="patient" className="bg-popover text-popover-foreground">
                  Patient
                </option>
                <option value="doctor" className="bg-popover text-popover-foreground">
                  Doctor / Provider
                </option>
                <option value="admin" className="bg-popover text-popover-foreground">
                  Clinic Administrator
                </option>
              </select>
            </div>
          )}

          <Button type="submit" className="w-full mt-2" disabled={loading}>
            {loading
              ? 'Please wait...'
              : isSignUp
                ? 'Create Account'
                : isForgotPassword
                  ? 'Send Reset Link'
                  : 'Sign In'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center border-t p-4 text-xs text-muted-foreground">
        {isSignUp ? (
          <p>
            Already have an account?{' '}
            <Link href="/auth/sign-in" className="text-primary font-medium hover:underline">
              Sign In
            </Link>
          </p>
        ) : (
          <p>
            Don't have an account yet?{' '}
            <Link href="/auth/sign-up" className="text-primary font-medium hover:underline">
              Sign Up
            </Link>
          </p>
        )}
      </CardFooter>
    </Card>
  );
}
