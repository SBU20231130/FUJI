import PageHeader from '@/components/shell/page-header';
import Panel from '@/components/ui/panel';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';

export default async function AdminPage() {
  await requireAdmin('/admin');
  return <section><PageHeader eyebrow="ADMIN" title="관리자 영역" description="사용자 승인과 시스템 설정을 연결할 관리자 route입니다." /><Panel title="관리자 메뉴"><p className="muted">사용자 권한과 활성 상태는 사용자 관리 화면에서 변경할 수 있습니다.</p><Link href="/admin/users" className="ui-button ui-button--primary">사용자 관리 열기</Link></Panel></section>;
}
