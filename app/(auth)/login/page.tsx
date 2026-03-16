import { Button } from '@/components/ui/button';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md rounded-lg border border-border p-6">
        <h1 className="mb-2 text-2xl font-semibold">Giriş Yap</h1>
        <p className="mb-6 text-sm text-gray-500">Google hesabın ile giriş yap.</p>
        <Button className="w-full">Google ile devam et</Button>
      </div>
    </div>
  );
}
