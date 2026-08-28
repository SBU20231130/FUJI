'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { signInAction, type LoginState } from '@/app/(auth)/login/actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button className="ui-button ui-button--primary auth-form__submit" type="submit" disabled={pending}>{pending ? '로그인 중...' : '로그인'}</button>;
}

export default function LoginForm({ nextPath, initialError }: { nextPath: string; initialError?: string }) {
  const initialState: LoginState = initialError ? { error: initialError } : {};
  const [state, formAction] = useActionState(signInAction, initialState);

  return (
    <form action={formAction} className="auth-form">
      <input type="hidden" name="next" value={nextPath} />
      <label htmlFor="email">이메일</label>
      <input id="email" name="email" type="email" autoComplete="email" required placeholder="name@example.com" />
      <label htmlFor="password">비밀번호</label>
      <input id="password" name="password" type="password" autoComplete="current-password" required />
      {state.error ? <p className="auth-form__error" role="alert">{state.error}</p> : null}
      <SubmitButton />
    </form>
  );
}
