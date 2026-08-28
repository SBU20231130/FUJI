import PageHeader from '@/components/shell/page-header';
import Panel from '@/components/ui/panel';

export default function AdminPage() {
  return <section><PageHeader eyebrow="ADMIN" title="관리자 영역" description="사용자 승인과 시스템 설정을 연결할 관리자 route입니다." /><Panel title="관리자 메뉴 준비 중"><p className="muted">ADMIN 메뉴 구조와 권한 화면은 다음 단계에서 연결합니다.</p></Panel></section>;
}
