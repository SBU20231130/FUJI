import PageHeader from '@/components/shell/page-header';
import Panel from '@/components/ui/panel';
import LoginForm from '@/components/auth/login-form';
import { safeNextPath } from '@/lib/auth';

const errorMessages: Record<string, string> = {
  inactive: '비활성화된 계정입니다. 관리자에게 계정 상태를 문의하세요.',
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const params = await searchParams;
  const nextPath = safeNextPath(params.next ?? '/');
  return (
    <Panel className="auth-card">
      <PageHeader eyebrow="AUTHENTICATION" title="월간 발주계획 로그인" description="등록된 Supabase Auth 계정으로 로그인하세요." actions={<span className="tag blue">AUTH REQUIRED</span>} />
      <LoginForm nextPath={nextPath} initialError={params.error ? errorMessages[params.error] : undefined} />
    </Panel>
  );
}
