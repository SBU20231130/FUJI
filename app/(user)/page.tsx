import Link from 'next/link';
import PageHeader from '@/components/shell/page-header';
import InsightBanner from '@/components/ui/insight-banner';
import KpiCard from '@/components/ui/kpi-card';
import Panel from '@/components/ui/panel';

export default function UserDashboardPage() {
  return (
    <section>
      <PageHeader
        eyebrow="PLANNING RUN / 2026.09"
        title="월간 발주계획 현황"
        description="수요 확정부터 리드타임·재고 분석까지, SCM 업무 진입점을 공통 디자인 시스템으로 제공합니다."
        actions={<Link href="/workflow" className="ui-button ui-button--ghost">레거시 워크플로우 열기</Link>}
      />
      <div className="grid grid-4">
        <KpiCard label="분석 화면" value="2" foot="Lead Time · Stockout Risk" status="SAFE" />
        <KpiCard label="데이터 소스" value="LIVE" foot="Supabase analytics" status="SAFE" />
        <KpiCard label="계산 불가 표현" value="—" foot="reason_code 함께 표시" status="CALCULATION_UNAVAILABLE" />
        <KpiCard label="다음 단계" value="SCM" foot="공통 패널과 테이블 확장" status="WARNING" />
      </div>
      <div className="section chart-grid">
        <Panel className="chart-grid__primary" title="분석 화면" description="공급망 데이터의 상태와 예외를 확인합니다.">
          <div className="grid grid-2">
            <Link href="/analysis/leadtime" className="flow-card">
              <div className="flow-icon">LT</div>
              <h3>Lead Time Gap</h3>
              <p>표준 리드타임과 실제 P80의 차이를 공급처별로 확인합니다.</p>
            </Link>
            <Link href="/analysis/stockout" className="flow-card">
              <div className="flow-icon">SR</div>
              <h3>Stockout Risk</h3>
              <p>가용재고와 사용량을 기준으로 안전·경고·위험 상태를 확인합니다.</p>
            </Link>
          </div>
        </Panel>
        <Panel className="chart-grid__side" title="운영 원칙">
          <InsightBanner title="계산 불가 값은 숨기지 않습니다.">값이 없으면 0 대신 — + reason_code 형식으로 표시합니다.</InsightBanner>
        </Panel>
      </div>
    </section>
  );
}
