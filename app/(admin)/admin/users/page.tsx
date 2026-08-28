import Badge from '@/components/ui/badge';
import EmptyValue from '@/components/ui/empty-value';
import Panel from '@/components/ui/panel';
import UserAccessForm from '@/components/admin/user-access-form';
import { requireAdmin, type AppUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

function formatDate(value: string | null) {
  if (!value) return <EmptyValue reasonCode="NO_LOGIN" />;
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

export default async function AdminUsersPage() {
  const admin = await requireAdmin('/admin/users');
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .schema('core')
    .from('app_user')
    .select('user_id,email,name,department,role,active,last_login_at,created_at,updated_at')
    .order('created_at', { ascending: true });

  if (error) {
    return <Panel title="사용자 목록을 불러오지 못했습니다."><p className="text-danger">{error.message}</p></Panel>;
  }

  const users = (data ?? []) as AppUser[];
  return (
    <section>
      <div className="page-header">
        <div><span className="eyebrow">ADMIN / USERS</span><h2>사용자 관리</h2><p>권한과 활성 상태는 서버와 DB RLS에서 다시 검증됩니다. 화면에서 메뉴를 숨기는 것만으로는 보호하지 않습니다.</p></div>
        <span className="local-badge">ADMIN ONLY</span>
      </div>
      <Panel title="등록 사용자" description={`${users.length}명 · role/active 변경은 audit_log에 자동 기록됩니다.`}>
        {users.length === 0 ? <p className="empty-state">등록된 사용자가 없습니다. Supabase Auth에서 첫 계정을 생성하세요.</p> : (
          <div className="data-table-wrap">
            <table className="data-table admin-users-table">
              <thead><tr><th>사용자</th><th>부서</th><th>권한</th><th>상태</th><th>최근 로그인</th><th>관리</th></tr></thead>
              <tbody>{users.map((user) => (
                <tr key={user.user_id}>
                  <td><strong>{user.name || '이름 없음'}</strong><span className="table-subtext">{user.email}</span></td>
                  <td>{user.department || <EmptyValue reasonCode="NO_DEPARTMENT" />}</td>
                  <td><span className="tag blue">{user.role}</span></td>
                  <td><Badge status={user.active ? 'SAFE' : 'WARNING'} label={user.active ? '활성' : '비활성'} /></td>
                  <td className="data-value">{formatDate(user.last_login_at)}</td>
                  <td><UserAccessForm userId={user.user_id} role={user.role} active={user.active} isSelf={user.user_id === admin.user.id} /></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </Panel>
    </section>
  );
}
