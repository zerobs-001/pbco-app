import AuthPage from '@/components/auth/AuthPage';

export default function Auth({
  searchParams,
}: {
  searchParams: { mode?: string };
}) {
  const mode = searchParams.mode === 'signup' ? 'signup' : 'signin';
  return <AuthPage mode={mode} />;
}
