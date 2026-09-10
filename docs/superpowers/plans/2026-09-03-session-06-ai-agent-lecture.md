# Session 06 AI Agent Lecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 현재 `superSCM`에서 시작해 8시간 동안 GPT Tool Calling 기반 SCM AI Agent를 구축하도록 가르치는 단일 HTML 강의자료를 만든다.

**Architecture:** 외부 의존성 없는 단일 HTML 안에 슬라이드 콘텐츠, 발표 UI CSS, 키보드/개요/노트 동작 JavaScript를 함께 둔다. 내용은 현재 저장소에서 가능한 4-Tool MVP와 `z-superSCM`의 10-Tool 확장형을 구분한다.

**Tech Stack:** HTML5, CSS, vanilla JavaScript, TypeScript/SQL 예시

**Spec:** `docs/superpowers/specs/2026-09-03-session-06-ai-agent-lecture-design.md`

## Global Constraints

- 한국어 강의자료로 작성한다.
- 오프라인 단일 파일로 동작한다.
- 09:00-18:00, 점심 1시간 제외 8시간 일정을 담는다.
- 비밀키·권한·숫자 환각 방지 원칙을 실습 완료 기준에 포함한다.

---

### Task 1: 강의 콘텐츠와 발표 UI

**Files:**
- Create: `docs/lecture/06-scm-ai-agent-tool-calling-8h.html`

**Interfaces:**
- Consumes: 현재 `lib/scm.ts` 조회 함수와 `z-superSCM/lib/agent/*` 설계
- Produces: 브라우저에서 직접 여는 독립형 강의자료

- [x] 8시간 타임라인, 작성 근거, LLM/Tool/Agent 기초, AS-IS/TO-BE 인프라, 4-Tool MVP, 코드 실습, 검증 체크리스트를 슬라이드로 작성한다.
- [x] 현재 `superSCM`을 순차 개발하는 8개 복사 가능 프롬프트를 포함한다.
- [x] 16:9 반응형 레이아웃과 인쇄용 페이지 나눔을 작성한다.
- [x] 방향키, Home/End, O, N, F 단축키와 버튼을 구현한다.
- [x] HTML 파싱 및 필수 콘텐츠 정적 검사를 실행한다.
- [x] 브라우저에서 첫/마지막 슬라이드, 개요, 노트, 인쇄 미디어를 검증한다.

### Task 2: 완전 초보자용 구조·사례 보강

**Files:**
- Modify: `docs/lecture/06-scm-ai-agent-tool-calling-8h.html`

- [x] 브라우저·서버·DB·API·함수·JSON을 비유와 실제 파일로 설명한다.
- [x] 현재 시스템의 6계층 AS-IS 구조와 업무 흐름을 구조도로 설명한다.
- [x] 반복 Tool Calling 기반 TO-BE 전체 구조도와 질문 1건의 흐름을 설명한다.
- [x] LLM, Orchestrator, Registry, Tool, Guardrail의 책임과 실패 범위를 구분한다.
- [x] 4개 Tool마다 입력·JSON 결과·지표 해석·최종 답변 예시를 제공한다.
- [x] 초보자 확인 문제와 정답을 포함한다.
- [x] 80개 슬라이드의 정적·시각·상호작용 검증을 다시 수행한다.
