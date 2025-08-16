import AuthPage from '@/components/auth/AuthPage';

export default async function Auth({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const params = await searchParams;
  const mode = params.mode === 'signup' ? 'signup' : 'signin';
  return <AuthPage mode={mode} />;
}
