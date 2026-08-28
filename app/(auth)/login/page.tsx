import Link from 'next/link';
import PageHeader from '@/components/shell/page-header';
import Panel from '@/components/ui/panel';

export default function LoginPage() {
  return <Panel><PageHeader eyebrow="AUTHENTICATION" title="월간 발주계획 로그인" description="인증 연동 지점입니다. 실제 로그인 흐름은 다음 단계에서 연결합니다." actions={<Link href="/" className="ui-button ui-button--primary">서비스 둘러보기</Link>} /></Panel>;
}
