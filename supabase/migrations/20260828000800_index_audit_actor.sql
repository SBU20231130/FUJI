-- 관리자 감사 로그의 actor FK 조회를 위한 보조 인덱스입니다.
create index if not exists audit_log_actor_idx on core.audit_log(actor);
