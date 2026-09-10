# 6회차 SCM AI Agent 강의자료 설계

## 목표

5회차의 예측 검증 결과를 기반으로, 현재 `superSCM`에서 실제 조회 가능한 데이터만 Tool로 노출하고 GPT가 Tool을 선택·호출·설명하는 흐름을 8시간 동안 구현하도록 안내한다.

## 범위 결정

벤치마크한 목표 구현체는 재고 전개, 안전재고, 발주 추천, 승인, 알림까지 구축된 뒤 SCM Tool 10종을 제공한다. 현재 `superSCM`은 STEP 7(Backtest + Champion)까지 완료되어 있으므로 10종을 그대로 복사하면 6개 Tool이 존재하지 않는 데이터 계층에 의존한다. 6회차는 현재 함수로 구현 가능한 다음 4개 읽기 전용 Tool을 MVP로 삼는다.

- `getDemandProfile(itemId?)`
- `getForecastAccuracy(itemId?)`
- `getStockoutRisk(itemId?)`
- `getLeadtimeStats(supplierId?)`

안전재고, 발주량, Open PO, 알림, 시뮬레이션 Tool은 후속 데이터 계층을 만든 뒤 추가한다. LLM은 계산하지 않고 기존 `lib/scm.ts` 함수를 호출한 결과만 설명한다.

## 강의자료 구조

단일 오프라인 HTML 슬라이드로 만든다. 16:9 발표 화면, 키보드/버튼 이동, 전체 목차, 발표자 노트, 진행률, 인쇄 모드를 포함한다. LLM 경험이 없는 수강생을 기준으로 AI-LLM-Tool-Agent의 관계를 먼저 설명하고, 현재 인프라의 AS-IS와 Agent가 추가된 TO-BE를 비교한다. 오전에는 개념·저장소 차이·Tool 설계를, 오후에는 LLM 어댑터·오케스트레이터·Structured Output·Guardrail·UI 연결·검증을 다룬다. 09:00-18:00 일정에서 점심 1시간을 제외한 8시간이며 휴식과 실습을 명시한다.

## 작성 근거

- 사용자가 제공한 10회차 로드맵 이미지의 6회차 목표와 세부 항목
- 5회차 PDF 24쪽의 STEP 1-15 구조와 STEP 7 완료 상태
- 현재 `superSCM`의 커밋, 마이그레이션 1-7, `lib/scm.ts`, 인증/RBAC 구조
- 목표 구현 저장소에서 확인한 STEP 16의 모듈 분리, Tool Registry, Structured Output, Guardrail, 대화 UI, RLS 및 테스트 패턴

## 단계별 프롬프트

강의자료에 8개의 복사 가능한 개발 프롬프트를 포함한다. 각 프롬프트는 한 단계만 구현하고 테스트한 뒤 멈추며, 이전 단계의 인터페이스를 소비하도록 작성한다: 계약/스키마, 4-Tool Registry, LLM 어댑터, 오케스트레이터, Guardrail, UI, 대화 저장/RLS, 통합 검증.

## 품질 기준

- 5회차 24쪽의 STEP 1-15 흐름과 6회차 로드맵을 연결한다.
- 저장소에서 확인한 실제 파일명과 함수명을 사용한다.
- 복사 가능한 TypeScript, SQL, 환경변수, 테스트 명령을 제공한다.
- 비밀키를 클라이언트에 두지 않고, 역할별 Tool 허용 목록과 숫자 출처 검증을 설명한다.
- 4개 Tool MVP와 10개 Tool 완성형의 차이를 명확히 표시한다.
- 브라우저에서 슬라이드 이동, 개요, 노트, 전체화면, 인쇄가 동작한다.

## 초보자용 상세화 보강

수강생이 LLM과 웹 개발 용어를 모른다는 전제에서, 모든 핵심 개념을 `비유 → 구조도 → 실제 질문 → JSON → 코드 → 확인 문제` 순서로 설명한다. 브라우저·서버·DB·API·함수·JSON의 역할을 먼저 소개하고, 현재 `superSCM`을 사용자·화면·서버/보안·업무 함수·데이터·DB 보안 계층으로 나눈 상세 AS-IS 구조도를 제공한다.

TO-BE 구조도는 사용자 질문, LLM 의도 파악, Orchestrator, Registry, 반복 Tool 호출, 기존 `lib/scm.ts`, Supabase, Structured Output, Guardrail, 최종 답변의 전체 흐름을 한 화면에서 추적할 수 있어야 한다. 네 가지 Tool은 각각 사용자 질문, Tool Call, 예시 JSON, 지표의 쉬운 뜻, 최종 해석을 포함한다. 구조와 Tool 파트 끝에는 초보자 확인 문제와 정답을 함께 제공한다.
