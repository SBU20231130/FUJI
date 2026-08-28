import PageHeader from '@/components/shell/page-header';
import Panel from '@/components/ui/panel';

export default function AdminSettingsPage() {
  return <section><PageHeader eyebrow="ADMIN SETTINGS" title="시스템 설정" description="SCM 공통 기준과 환경 설정을 관리합니다." /><Panel title="설정 화면 준비 중"><p className="muted">현재는 route와 디자인 기반만 제공합니다.</p></Panel></section>;
}
