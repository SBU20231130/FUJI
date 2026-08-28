-- 인증된 앱이 core/analytics를 SSR Supabase client로 조회할 수 있도록
-- Data API의 노출 스키마를 명시합니다. raw는 노출하지 않습니다.
alter role authenticator set pgrst.db_schemas = 'public,graphql_public,core,analytics';
notify pgrst, 'reload config';
