'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { updateUserAccessAction, type UserAccessState } from '@/app/(admin)/admin/users/actions';

function SaveButton() {
  const { pending } = useFormStatus();
  return <button className="ui-button ui-button--primary user-access-form__button" type="submit" disabled={pending}>{pending ? '저장 중...' : '저장'}</button>;
}

export default function UserAccessForm({ userId, role, active, isSelf }: { userId: string; role: 'ADMIN' | 'USER'; active: boolean; isSelf: boolean }) {
  const [state, formAction] = useActionState<UserAccessState, FormData>(updateUserAccessAction, {});

  return (
    <form action={formAction} className="user-access-form">
      <input type="hidden" name="user_id" value={userId} />
      <select name="role" defaultValue={role} aria-label="권한">
        <option value="ADMIN">ADMIN</option>
        <option value="USER">USER</option>
      </select>
      <label className="user-access-form__active"><input type="checkbox" name="active" value="true" defaultChecked={active} /> 활성</label>
      <SaveButton />
      {isSelf ? <span className="user-access-form__note">내 계정</span> : null}
      {state.error ? <span className="user-access-form__error" role="alert">{state.error}</span> : null}
      {state.success ? <span className="user-access-form__success" role="status">{state.success}</span> : null}
    </form>
  );
}
