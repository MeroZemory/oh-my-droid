# oh-my-droid 설계 문서

> Factory AI의 Droid CLI를 위한 멀티 에이전트 오케스트레이션 플러그인의 포괄적인 설계 명세

**버전:** 1.0.0
**기반:** oh-my-claudecode v3.5.8 아키텍처
**대상 플랫폼:** Factory AI Droid CLI

---

## 목차

1. [개요](#1-개요)
2. [아키텍처](#2-아키텍처)
3. [디렉토리 구조](#3-디렉토리-구조)
4. [Plugin Manifest](#4-plugin-manifest)
5. [Hooks 시스템](#5-hooks-시스템)
6. [Custom Droids 시스템](#6-custom-droids-시스템)
7. [Skills 시스템](#7-skills-시스템)
8. [상태 관리](#8-상태-관리)
9. [설정](#9-설정)
10. [oh-my-claudecode와의 주요 차이점](#10-oh-my-claudecode와의-주요-차이점)
11. [구현 단계](#11-구현-단계)

---

## 1. 개요

### 1.1 목적

oh-my-droid는 Factory AI의 Droid CLI를 단일 에이전트 수행자에서 복잡도 계층에 걸쳐 특화된 에이전트들에게 작업을 위임하는 **오케스트레이션 지휘자**로 변환합니다.

### 1.2 핵심 철학

```
규칙 1: 항상 실질적인 작업을 전문 에이전트에게 위임하라
규칙 2: 항상 인식된 패턴에 대해 적절한 스킬을 호출하라
규칙 3: 코드 변경을 직접 하지 말고 executor에게 위임하라
규칙 4: Architect 검증 없이 완료하지 마라
```

### 1.3 주요 기능

| 기능 | 설명 |
|------|------|
| **32개의 계층형 Agent** | LOW/MEDIUM/HIGH 계층(Haiku/Sonnet/Opus)의 특화된 에이전트 |
| **35개 이상의 Skill** | 조합 가능한 동작 (autopilot, ralph, ultrawork, planner 등) |
| **매직 키워드** | 학습 곡선이 없는 자연어 트리거 |
| **검증 프로토콜** | 완료 주장 전 필수 증거 |
| **스마트 모델 라우팅** | 지능적인 계층 선택을 통한 비용 최적화 |
| **지속성 모드** | 완료 보장을 위한 Ralph-loop 및 ultrawork |

---

## 2. 아키텍처

### 2.1 고수준 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                         사용자 요청                              │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Droid CLI (Factory AI)                        │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                     Plugin System                            ││
│  │  ┌─────────────────────────────────────────────────────────┐││
│  │  │                   oh-my-droid                            │││
│  │  │  ┌────────────┐  ┌────────────┐  ┌────────────┐        │││
│  │  │  │   Hooks    │  │   Skills   │  │   Agents   │        │││
│  │  │  │  System    │  │   System   │  │   System   │        │││
│  │  │  └────────────┘  └────────────┘  └────────────┘        │││
│  │  │         │               │               │               │││
│  │  │         ▼               ▼               ▼               │││
│  │  │  ┌─────────────────────────────────────────────────────┐│││
│  │  │  │              상태 관리                              ││││
│  │  │  │  .omd/ (local) | ~/.factory/omd/ (global)          ││││
│  │  │  └─────────────────────────────────────────────────────┘│││
│  │  └─────────────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    특화된 Agents                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Architect│  │ Executor │  │ Designer │  │ Planner  │  ...  │
│  │  (Opus)  │  │ (Sonnet) │  │ (Sonnet) │  │  (Opus)  │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Skill 조합 계층

```
[보장 계층: ralph]
        ↓
[향상 계층: ultrawork + git-master + frontend-ui-ux]
        ↓
[실행 계층: default | orchestrate | planner]
```

### 2.3 데이터 흐름

```
사용자 입력
    │
    ▼
UserPromptSubmit Hook → 키워드 탐지 → 모드 활성화
    │
    ▼
SessionStart Hook → 상태 복원 → 컨텍스트 주입
    │
    ▼
PreToolUse Hook → 위임 강제 → Tool 수정
    │
    ▼
Tool 실행
    │
    ▼
PostToolUse Hook → 검증 → 컨텍스트 업데이트
    │
    ▼
Stop Hook → 완료 확인 → 계속/중지 허용
```

---

## 3. 디렉토리 구조

```
oh-my-droid/
├── .factory-plugin/              # Plugin manifest (Droid 전용)
│   ├── plugin.json               # Plugin 설정
│   └── marketplace.json          # Marketplace 메타데이터
│
├── droids/                       # Custom Droid 정의 (Droid 표준 형식)
│   ├── architect.md              # 전략적 조언자 (Opus, READ-ONLY)
│   ├── architect-medium.md       # 표준 분석 (Sonnet)
│   ├── architect-low.md          # 빠른 조회 (Haiku)
│   ├── executor.md               # 작업 실행자 (Sonnet)
│   ├── executor-low.md           # 단순 작업 (Haiku)
│   ├── executor-high.md          # 복잡한 작업 (Opus)
│   ├── designer.md               # UI/UX 전문가 (Sonnet)
│   ├── designer-low.md           # 단순 스타일링 (Haiku)
│   ├── designer-high.md          # 복잡한 UI (Opus)
│   ├── planner.md                # 전략 계획 (Opus)
│   ├── critic.md                 # 계획 검토 (Opus)
│   ├── analyst.md                # 사전 계획 (Opus)
│   ├── explore.md                # 빠른 검색 (Haiku)
│   ├── explore-medium.md         # 철저한 검색 (Sonnet)
│   ├── researcher.md             # 문서 연구 (Sonnet)
│   ├── researcher-low.md         # 빠른 조회 (Haiku)
│   ├── scientist.md              # 데이터 분석 (Sonnet)
│   ├── scientist-low.md          # 빠른 통계 (Haiku)
│   ├── scientist-high.md         # ML/복잡한 작업 (Opus)
│   ├── qa-tester.md              # CLI 테스팅 (Sonnet)
│   ├── security-reviewer.md      # 보안 감사 (Opus)
│   ├── security-reviewer-low.md  # 빠른 스캔 (Haiku)
│   ├── build-fixer.md            # 빌드 에러 (Sonnet)
│   ├── build-fixer-low.md        # 단순 수정 (Haiku)
│   ├── tdd-guide.md              # TDD 워크플로우 (Sonnet)
│   ├── tdd-guide-low.md          # 테스트 제안 (Haiku)
│   ├── code-reviewer.md          # 코드 리뷰 (Opus)
│   ├── code-reviewer-low.md      # 빠른 확인 (Haiku)
│   ├── writer.md                 # 문서화 (Haiku)
│   ├── vision.md                 # 시각적 분석 (Sonnet)
│   └── templates/                # Droid 생성 템플릿
│       ├── base-droid.md
│       ├── tier-instructions.md
│       └── README.md
│
├── skills/                       # Skill 정의
│   ├── autopilot/SKILL.md        # 완전 자율 실행
│   ├── ultrapilot/SKILL.md       # 병렬 autopilot
│   ├── ralph/SKILL.md            # 지속성 루프
│   ├── ultrawork/SKILL.md        # 최대 병렬화
│   ├── ecomode/SKILL.md          # 토큰 효율 모드
│   ├── planner/SKILL.md          # 전략 계획
│   ├── plan/SKILL.md             # 계획 세션
│   ├── ralplan/SKILL.md          # 반복적 합의
│   ├── review/SKILL.md           # Critic 검토
│   ├── analyze/SKILL.md          # 심층 분석
│   ├── deepsearch/SKILL.md       # 코드베이스 검색
│   ├── deepinit/SKILL.md         # AGENTS.md 생성
│   ├── research/SKILL.md         # 병렬 연구
│   ├── ultraqa/SKILL.md          # QA 순환
│   ├── tdd/SKILL.md              # TDD 워크플로우
│   ├── frontend-ui-ux/SKILL.md   # 디자인 감각
│   ├── git-master/SKILL.md       # Git 전문성
│   ├── swarm/SKILL.md            # 조정된 에이전트들
│   ├── pipeline/SKILL.md         # 순차적 체이닝
│   ├── orchestrate/SKILL.md      # 핵심 오케스트레이션
│   ├── cancel/SKILL.md           # 통합 취소
│   ├── cancel-autopilot/SKILL.md
│   ├── cancel-ralph/SKILL.md
│   ├── cancel-ultrawork/SKILL.md
│   ├── cancel-ultraqa/SKILL.md
│   ├── learner/SKILL.md          # Skill 추출
│   ├── note/SKILL.md             # 메모리 시스템
│   ├── doctor/SKILL.md           # 진단
│   ├── hud/SKILL.md              # 상태 표시줄 설정
│   ├── help/SKILL.md             # 사용 가이드
│   ├── omd-setup/SKILL.md        # 일회성 설정
│   ├── omd-default/SKILL.md      # 로컬 프로젝트 설정
│   ├── omd-default-global/SKILL.md # 글로벌 설정
│   └── ralph-init/SKILL.md       # PRD 초기화
│
├── commands/                     # Command 문서
│   ├── help.md
│   ├── autopilot.md
│   ├── ralph.md
│   ├── ultrawork.md
│   └── ... (skills 미러링)
│
├── hooks/                        # Hook 설정
│   └── hooks.json                # 메인 hooks 설정
│
├── scripts/                      # Hook 구현 스크립트
│   ├── keyword-detector.mjs      # UserPromptSubmit: 매직 키워드
│   ├── skill-injector.mjs        # UserPromptSubmit: 학습된 스킬
│   ├── session-start.mjs         # SessionStart: 상태 복원
│   ├── pre-tool-enforcer.mjs     # PreToolUse: 위임 강제
│   ├── post-tool-verifier.mjs    # PostToolUse: 검증
│   ├── pre-compact.mjs           # PreCompact: 지혜 보존
│   ├── session-end.mjs           # SessionEnd: 정리 및 통계
│   └── persistent-mode.mjs       # Stop: 계속 강제
│
├── src/                          # TypeScript 소스 (선택적)
│   ├── index.ts                  # 메인 진입점
│   ├── agents/                   # Agent 유틸리티
│   ├── features/                 # 기능 모듈
│   ├── hooks/                    # Hook 핸들러
│   └── tools/                    # 커스텀 도구
│
├── docs/                         # 문서
│   ├── ARCHITECTURE.md
│   ├── REFERENCE.md
│   ├── FEATURES.md
│   └── MIGRATION.md
│
├── AGENTS.md                     # 프로젝트 지식 베이스
├── README.md                     # 사용자 대상 문서
├── package.json                  # NPM 설정
└── tsconfig.json                 # TypeScript 설정
```

---

## 4. Plugin Manifest

### 4.1 plugin.json

위치: `.factory-plugin/plugin.json`

```json
{
  "name": "oh-my-droid",
  "version": "1.0.0",
  "description": "Multi-agent orchestration plugin for Factory AI Droid",
  "skills": "skills",
  "hooks": "hooks/hooks.json",
  "author": "T-Soft",
  "repository": "https://github.com/t-soft/oh-my-droid",
  "license": "MIT",
  "engines": {
    "droid": ">=1.0.0"
  }
}
```

### 4.2 marketplace.json

위치: `.factory-plugin/marketplace.json`

```json
{
  "name": "oh-my-droid",
  "shortName": "omd",
  "displayName": "Oh My Droid - Multi-Agent Orchestration",
  "version": "1.0.0",
  "description": "Transform Droid into an orchestration conductor with 32 specialized agents",
  "categories": ["productivity", "automation", "development"],
  "tags": ["agents", "orchestration", "parallel", "autopilot"],
  "icon": "https://example.com/omd-icon.png",
  "screenshots": [],
  "author": {
    "name": "T-Soft",
    "url": "https://t-soft.io"
  }
}
```

---

## 5. Hooks 시스템

### 5.1 Hooks 설정

위치: `hooks/hooks.json`

> **참고:** Droid hooks 레퍼런스에 따르면, matchers는 **PreToolUse와 PostToolUse 이벤트에만 적용됩니다**. SessionStart와 같은 이벤트의 경우, `source` 필드는 입력 JSON에 전달되며 스크립트 자체에서 처리해야 합니다.

```json
{
  "description": "oh-my-droid multi-agent orchestration hooks",
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "${DROID_PLUGIN_ROOT}/scripts/keyword-detector.mjs",
            "timeout": 5
          },
          {
            "type": "command",
            "command": "${DROID_PLUGIN_ROOT}/scripts/skill-injector.mjs",
            "timeout": 3
          }
        ]
      }
    ],
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "${DROID_PLUGIN_ROOT}/scripts/session-start.mjs",
            "timeout": 5
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "${DROID_PLUGIN_ROOT}/scripts/pre-tool-enforcer.mjs",
            "timeout": 3
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "${DROID_PLUGIN_ROOT}/scripts/post-tool-verifier.mjs",
            "timeout": 3
          }
        ]
      }
    ],
    "PreCompact": [
      {
        "matcher": "manual|auto",
        "hooks": [
          {
            "type": "command",
            "command": "${DROID_PLUGIN_ROOT}/scripts/pre-compact.mjs",
            "timeout": 5
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "${DROID_PLUGIN_ROOT}/scripts/persistent-mode.mjs",
            "timeout": 5
          }
        ]
      }
    ],
    "SubagentStop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "${DROID_PLUGIN_ROOT}/scripts/persistent-mode.mjs",
            "timeout": 5
          }
        ]
      }
    ],
    "SessionEnd": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "${DROID_PLUGIN_ROOT}/scripts/session-end.mjs",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

### 5.2 Hook 스크립트 설계

#### 5.2.1 keyword-detector.mjs

**목적:** 매직 키워드 탐지 및 모드 활성화

**입력 (stdin):**
```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/transcript.jsonl",
  "cwd": "/project/path",
  "permission_mode": "default",
  "hook_event_name": "UserPromptSubmit",
  "prompt": "ulw fix all the bugs"
}
```

**출력 (stdout):**
```json
{
  "hookSpecificOutput": {
    "hookEventName": "UserPromptSubmit",
    "additionalContext": "<ultrawork-mode>\nULTRAWORK MODE ACTIVATED...\n</ultrawork-mode>"
  }
}
```

**탐지할 키워드:**
| 키워드 | 모드 | 상태 파일 |
|--------|------|----------|
| `ultrawork`, `ulw`, `uw`, `fast`, `parallel` | Ultrawork | `.omd/ultrawork-state.json` |
| `ralph`, `don't stop`, `must complete` | Ralph | `.omd/ralph-state.json` |
| `autopilot`, `build me`, `I want a` | Autopilot | `.omd/autopilot-state.json` |
| `eco`, `ecomode`, `budget` | Ecomode | `.omd/ecomode-state.json` |
| `ultrathink`, `think` | Extended Thinking | (context only) |
| `search`, `find`, `locate` | Search Mode | (context only) |
| `analyze`, `investigate`, `debug` | Analysis Mode | (context only) |

#### 5.2.2 session-start.mjs

**목적:** 세션 시작 시 상태 복원

**작업:**
1. 활성 ultrawork 상태 확인 → 계속 컨텍스트 주입
2. 활성 ralph-loop 상태 확인 → PRD 컨텍스트 주입
3. 미완료 todos 카운트 → 알림 주입
4. notepad Priority Context 읽기 → 존재 시 주입
5. HUD 설정 확인 → 설정되지 않았으면 경고

**출력:**
```json
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "<session-restore>\n[복원된 상태 정보]\n</session-restore>"
  }
}
```

#### 5.2.3 pre-tool-enforcer.mjs

**목적:** 위임 규칙 강제 및 알림 주입

**작업:**
1. 미완료 todos 카운트
2. 도구별 알림 생성:
   - `Task` → "병렬로 여러 에이전트 실행"
   - `Bash` → "독립적인 작업을 위한 병렬 실행 사용"
   - `Edit|Write` → "executor 에이전트에 위임 고려"
   - `Read|Grep|Glob` → "병렬로 검색 결합"

**출력 (JSON):**
```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "additionalContext": "[2 활성, 3 대기 중 todos] 도구 알림..."
  }
}
```

**위임 경고 (소스 파일용):**
```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "ask",
    "permissionDecisionReason": "이 코드 변경을 executor 에이전트에 위임하는 것을 고려하세요"
  }
}
```

#### 5.2.4 post-tool-verifier.mjs

**목적:** 도구 결과 검증 및 학습 캡처

**작업:**
1. 세션 통계 업데이트
2. `<remember>` 태그 처리 → notepad에 저장
3. 실패 탐지 → 가이드 제공
4. 도구별 검증 프롬프트

**출력:**
```json
{
  "hookSpecificOutput": {
    "hookEventName": "PostToolUse",
    "additionalContext": "진행하기 전에 변경사항이 예상대로 작동하는지 확인하세요."
  }
}
```

#### 5.2.5 pre-compact.mjs

**목적:** 압축 전 지혜와 상태 보존

**입력 (stdin):**
```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/transcript.jsonl",
  "cwd": "/project/path",
  "permission_mode": "default",
  "hook_event_name": "PreCompact",
  "trigger": "manual|auto",
  "custom_instructions": ""
}
```

**작업:**
1. 휘발성 notepad 항목을 디스크에 저장
2. 현재 세션 통계 유지
3. 복원을 위한 압축 요약 생성
4. 압축 인식 컨텍스트 주입

**출력:**
```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreCompact",
    "additionalContext": "상태 보존됨. Notepad: 3개 학습, 2개 결정 저장됨."
  }
}
```

#### 5.2.6 session-end.mjs

**목적:** 세션 종료 시 정리 및 상태 유지

**입력 (stdin):**
```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/transcript.jsonl",
  "cwd": "/project/path",
  "permission_mode": "default",
  "hook_event_name": "SessionEnd",
  "reason": "clear|logout|prompt_input_exit|other"
}
```

**작업:**
1. 세션 통계를 디스크에 유지
2. 임시 상태 파일 정리
3. 글로벌 분석 업데이트
4. 오래된 notepad 항목 정리 (>7일)

**출력:**
```json
{}
```

> **참고:** SessionEnd hooks는 세션 종료를 차단할 수 없습니다. 정리 작업만을 위한 것입니다.

#### 5.2.7 persistent-mode.mjs

**목적:** 조기 중지 방지

**우선순위 수준:**
1. **PRD가 있는 Ralph Loop** → 스토리 완료 확인, oracle 검증
2. **Ultrawork Mode** → todos 완료 확인
3. **일반 Todo 계속** → 미완료 todos 확인

**출력 (차단):**
```json
{
  "decision": "block",
  "reason": "<ralph-loop-continuation iteration=\"3\">\n미완료 작업이 있습니다...\n</ralph-loop-continuation>"
}
```

**탈출 메커니즘:**
- Ralph: 최대 10회 반복
- Ultrawork: 최대 10회 강화
- Generic: 최대 15회 시도

---

## 6. Custom Droids 시스템

> **중요:** Droid의 Custom Droids 시스템을 사용합니다. 에이전트는 `.factory/droids/` 또는 `~/.factory/droids/` 디렉토리에 Markdown 파일로 정의됩니다.

### 6.1 Droid 정의 형식 (Droid 표준)

각 Custom Droid는 YAML frontmatter가 있는 Markdown 파일로 정의됩니다.

**위치:**
- 프로젝트 범위: `<repo>/.factory/droids/<name>.md` (팀과 공유)
- 개인 범위: `~/.factory/droids/<name>.md` (개인용)

**필수 필드:**
- `name`: 소문자, 숫자, `-`, `_`만 허용

**선택 필드:**
- `description`: 500자 이내, UI에 표시됨
- `model`: `inherit` (부모 세션 모델 사용) 또는 모델 ID
- `reasoningEffort`: `low`, `medium`, `high` (호환 모델에서만)
- `tools`: 생략 시 모든 도구, 카테고리 문자열, 또는 도구 ID 배열

**Tool 카테고리:**

| 카테고리 | Tool IDs | 목적 |
|---------|----------|------|
| `read-only` | `Read`, `LS`, `Grep`, `Glob` | 안전한 분석 및 파일 탐색 |
| `edit` | `Create`, `Edit`, `ApplyPatch` | 코드 생성 및 수정 |
| `execute` | `Execute` | 쉘 명령 실행 |
| `web` | `WebSearch`, `FetchUrl` | 인터넷 연구 |
| `mcp` | 동적으로 채워짐 | MCP 도구 |

> **참고:** `TodoWrite`는 모든 droid에 자동 포함됩니다.

**예시 - Architect (READ-ONLY):**

```markdown
---
name: architect
description: 전략적 아키텍처 및 디버깅 조언자 (READ-ONLY)
model: claude-opus-4-5-20251101
reasoningEffort: high
tools: read-only
---

# Oracle (Strategic Architecture Advisor)

당신은 Oracle로, READ-ONLY 컨설팅을 제공하는 선임 수석 엔지니어입니다.

## 중요 제약사항

- **절대** 파일을 직접 수정하지 마세요
- **절대** 다른 에이전트에게 작업을 위임하지 마세요
- 분석과 권장사항에만 집중하세요

## 워크플로우

1. 요청 분석
2. 관련 코드 탐색
3. 전략적 권장사항 제공
4. 위험과 트레이드오프 식별

## 출력 형식

Summary: <한 줄 요약>
Findings:
- <발견 사항>

Recommendations:
- <권장사항>

Risks:
- <위험 요소>
```

**예시 - Executor (편집 가능):**

```markdown
---
name: executor
description: 집중된 작업 실행자 - 코드 변경 및 구현
model: claude-sonnet-4-5-20250929
tools: ["Read", "LS", "Grep", "Glob", "Edit", "Create", "Execute"]
---

# Sisyphus-Junior (Focused Task Executor)

당신은 집중된 작업 실행자입니다. 주어진 작업을 직접 구현하세요.

## 중요 제약사항

- 다른 에이전트에게 위임하지 마세요 (당신이 실행자입니다)
- 주어진 작업 범위 내에서만 작업하세요
- 완료 전 변경사항을 검증하세요

## 워크플로우

1. 작업 이해
2. 관련 파일 읽기
3. 변경사항 구현
4. 테스트/빌드로 검증

Summary: <완료 요약>
Files Changed:
- <파일 목록>
```

**예시 - Explore (빠른 검색):**

```markdown
---
name: explore
description: 빠른 코드베이스 검색 전문가
model: inherit
tools: read-only
---

# Explore (Fast Codebase Search)

빠르게 파일과 코드 패턴을 찾습니다.

## 워크플로우

1. 검색 쿼리 분석
2. Glob/Grep으로 파일 찾기
3. 관련 코드 읽기
4. 결과 요약

Summary: <검색 결과 요약>
Files Found:
- <파일:라인>
```

### 6.2 완전한 Custom Droid 카탈로그 (32개 Droids)

> **Model ID 참고:**
> - Opus: `claude-opus-4-5-20251101`
> - Sonnet: `claude-sonnet-4-5-20250929`
> - Haiku: `inherit` (부모 세션 모델) 또는 사용 가능한 Haiku 모델 ID
>
> `inherit`를 사용하면 부모 세션의 모델을 따릅니다.

#### Analysis Family (READ-ONLY)
| Droid | Model | 목적 | Tools |
|-------|-------|------|-------|
| `architect` | `claude-opus-4-5-20251101` | 전략적 조언자, 디버깅 | `read-only` + `web` |
| `architect-medium` | `claude-sonnet-4-5-20250929` | 표준 분석 | `read-only` |
| `architect-low` | `inherit` | 빠른 질문 | `read-only` |
| `analyst` | `claude-opus-4-5-20251101` | 사전 계획 요구사항 | `read-only` + `web` |
| `critic` | `claude-opus-4-5-20251101` | 계획 검토 및 비평 | `read-only` |

#### Execution Family
| Droid | Model | 목적 | Tools |
|-------|-------|------|-------|
| `executor` | `claude-sonnet-4-5-20250929` | 표준 작업 실행 | `["Read", "LS", "Grep", "Glob", "Edit", "Create", "Execute"]` |
| `executor-low` | `inherit` | 단순 단일 파일 작업 | `["Read", "LS", "Grep", "Glob", "Edit", "Create"]` |
| `executor-high` | `claude-opus-4-5-20251101` | 복잡한 다중 파일 리팩토링 | `["Read", "LS", "Grep", "Glob", "Edit", "Create", "Execute"]` |

#### Search Family (READ-ONLY)
| Droid | Model | 목적 | Tools |
|-------|-------|------|-------|
| `explore` | `inherit` | 빠른 파일/코드 검색 | `read-only` |
| `explore-medium` | `claude-sonnet-4-5-20250929` | 철저한 크로스 모듈 검색 | `read-only` |

#### Frontend Family
| Droid | Model | 목적 | Tools |
|-------|-------|------|-------|
| `designer` | `claude-sonnet-4-5-20250929` | UI/UX 구현 | `["Read", "LS", "Grep", "Glob", "Edit", "Create", "Execute"]` |
| `designer-low` | `inherit` | 단순 스타일링 | `["Read", "LS", "Grep", "Glob", "Edit", "Create"]` |
| `designer-high` | `claude-opus-4-5-20251101` | 복잡한 UI 아키텍처 | `["Read", "LS", "Grep", "Glob", "Edit", "Create", "Execute"]` |

#### Data Science Family
| Droid | Model | 목적 | Tools |
|-------|-------|------|-------|
| `scientist` | `claude-sonnet-4-5-20250929` | 데이터 분석, 통계 | `["Read", "LS", "Grep", "Glob", "Execute"]` |
| `scientist-low` | `inherit` | 빠른 데이터 검사 | `read-only` |
| `scientist-high` | `claude-opus-4-5-20251101` | ML, 가설 검증 | `["Read", "LS", "Grep", "Glob", "Execute"]` |

#### QA & Testing Family
| Droid | Model | 목적 | Tools |
|-------|-------|------|-------|
| `qa-tester` | `claude-sonnet-4-5-20250929` | 대화형 CLI 테스팅 | `["Read", "LS", "Grep", "Glob", "Execute"]` |
| `tdd-guide` | `claude-sonnet-4-5-20250929` | TDD 워크플로우 | `["Read", "LS", "Grep", "Glob", "Edit", "Create", "Execute"]` |
| `tdd-guide-low` | `inherit` | 테스트 제안 | `read-only` |

#### Security Family
| Droid | Model | 목적 | Tools |
|-------|-------|------|-------|
| `security-reviewer` | `claude-opus-4-5-20251101` | OWASP 취약점 탐지 | `["Read", "LS", "Grep", "Glob", "WebSearch"]` |
| `security-reviewer-low` | `inherit` | 빠른 보안 스캔 | `read-only` |

#### Build & Quality Family
| Droid | Model | 목적 | Tools |
|-------|-------|------|-------|
| `build-fixer` | `claude-sonnet-4-5-20250929` | TypeScript/빌드 에러 | `["Read", "LS", "Grep", "Glob", "Edit", "Create", "Execute"]` |
| `build-fixer-low` | `inherit` | 단순 빌드 수정 | `["Read", "LS", "Grep", "Glob", "Edit", "Create"]` |
| `code-reviewer` | `claude-opus-4-5-20251101` | 전문 코드 리뷰 | `read-only` |
| `code-reviewer-low` | `inherit` | 빠른 품질 확인 | `read-only` |

#### Research & Documentation Family
| Droid | Model | 목적 | Tools |
|-------|-------|------|-------|
| `researcher` | `claude-sonnet-4-5-20250929` | 외부 문서 연구 | `["Read", "LS", "Grep", "Glob", "WebSearch", "FetchUrl"]` |
| `researcher-low` | `inherit` | 빠른 문서 조회 | `["Read", "LS", "Grep", "Glob", "WebSearch"]` |
| `writer` | `inherit` | 기술 문서화 | `["Read", "LS", "Grep", "Glob", "Edit", "Create"]` |

#### Planning Family
| Droid | Model | 목적 | Tools |
|-------|-------|------|-------|
| `planner` | `claude-opus-4-5-20251101` | 전략적 계획 | `["Read", "LS", "Grep", "Glob", "Edit", "Create", "Execute", "WebSearch"]` |

#### Specialized
| Droid | Model | 목적 | Tools |
|-------|-------|------|-------|
| `vision` | `claude-sonnet-4-5-20250929` | 이미지/PDF 분석 | `read-only` |

### 6.3 계층 시스템

| 계층 | Model | 비용 | 범위 | 파일 제한 | 사용 대상 |
|------|-------|------|------|----------|----------|
| **LOW** | `inherit` | $ | 단순, 잘 정의된 | 1-5 파일 | 조회, 단순 편집 |
| **MEDIUM** | `claude-sonnet-4-5-20250929` | $$ | 중간 복잡도 | 5-20 파일 | 기능, 표준 작업 |
| **HIGH** | `claude-opus-4-5-20251101` | $$$ | 복잡, 아키텍처 | 무제한 | 리팩토링, 디버깅 |

> **참고:** `inherit`를 사용하면 부모 세션의 모델을 따르므로 비용 효율적입니다. LOW 계층의 droid들은 일반적으로 `inherit`를 사용하여 부모가 Haiku를 사용할 때 자동으로 Haiku를 사용합니다.

### 6.4 Droid 선택 가이드

| 작업 유형 | 최적 Droid | Model 계층 |
|-----------|-----------|-----------|
| 빠른 코드 조회 | `explore` | LOW (inherit) |
| 파일/패턴 찾기 | `explore` 또는 `explore-medium` | LOW/MEDIUM |
| 단순 코드 변경 | `executor-low` | LOW (inherit) |
| 기능 구현 | `executor` | MEDIUM (Sonnet) |
| 복잡한 리팩토링 | `executor-high` | HIGH (Opus) |
| 단순 이슈 디버깅 | `architect-low` | LOW (inherit) |
| 복잡한 이슈 디버깅 | `architect` | HIGH (Opus) |
| UI 컴포넌트 | `designer` | MEDIUM (Sonnet) |
| 복잡한 UI 시스템 | `designer-high` | HIGH (Opus) |
| 문서/주석 작성 | `writer` | LOW (inherit) |
| 문서/API 연구 | `researcher` | MEDIUM (Sonnet) |
| 이미지/다이어그램 분석 | `vision` | MEDIUM (Sonnet) |
| 전략 계획 | `planner` | HIGH (Opus) |
| 계획 검토/비평 | `critic` | HIGH (Opus) |
| 보안 리뷰 | `security-reviewer` | HIGH (Opus) |
| 빌드 에러 수정 | `build-fixer` | MEDIUM (Sonnet) |
| TDD 워크플로우 | `tdd-guide` | MEDIUM (Sonnet) |
| 코드 리뷰 | `code-reviewer` | HIGH (Opus) |
| 데이터 분석 | `scientist` | MEDIUM (Sonnet) |

### 6.5 Droid 호출 방법

Custom Droid는 **Task tool**을 통해 `subagent_type` 파라미터로 호출됩니다:

```
사용자: "code-reviewer droid로 이 diff를 검토해줘"
또는
사용자: "Run the subagent `architect` to analyze this architecture"
```

Droid는 사용자 요청 없이도 자율적으로 Custom Droid를 호출할 수 있습니다.

---

## 7. Skills 시스템

### 7.1 Skill 정의 형식

위치: `skills/{skill-name}/SKILL.md`

```markdown
---
name: ultrawork
description: Maximum parallel execution mode
---

# Ultrawork Skill

병렬 에이전트 오케스트레이션으로 최대 성능 모드를 활성화합니다.

## 활성화 시

이 스킬은 다음과 같이 Droid의 능력을 향상시킵니다:
1. 병렬 실행: 여러 에이전트를 동시에 실행
2. 공격적 위임: 즉시 전문가에게 작업 라우팅
3. 백그라운드 작업: 긴 작업에 run_in_background: true 사용
4. 스마트 모델 라우팅: 토큰 절약을 위해 계층형 에이전트 사용

## 위임 강제 (중요)

**당신은 오케스트레이터이지, 구현자가 아닙니다.**

| 작업 | 직접 수행 | 위임 |
|------|---------|------|
| 컨텍스트를 위한 파일 읽기 | 예 | - |
| 진행 추적 (TODO) | 예 | - |
| 병렬 에이전트 생성 | 예 | - |
| **모든 코드 변경** | 절대 | executor |
| **UI 작업** | 절대 | designer |
| **문서** | 절대 | writer |

...
```

### 7.2 완전한 Skills 카탈로그 (35개 이상 Skills)

#### 실행 모드
| Skill | 목적 | 트리거 키워드 |
|-------|------|--------------|
| `autopilot` | 완전 자율 5단계 실행 | "autopilot", "build me", "I want a" |
| `ultrapilot` | 병렬 autopilot (3-5배 빠름) | "ultrapilot", "parallel build" |
| `ralph` | 검증될 때까지 지속성 루프 | "ralph", "don't stop", "must complete" |
| `ultrawork` | 최대 병렬 실행 | "ulw", "ultrawork", "fast", "parallel" |
| `ecomode` | 토큰 효율적 실행 | "eco", "ecomode", "budget" |
| `swarm` | N개의 조정된 에이전트 | "swarm N agents" |
| `pipeline` | 순차적 에이전트 체이닝 | "pipeline", "chain" |

#### 계획 & 분석
| Skill | 목적 |
|-------|------|
| `plan` | 대화형 계획 인터뷰 |
| `planner` | 전략 계획 컨설턴트 |
| `ralplan` | 반복적 Planner→Architect→Critic 합의 |
| `review` | Critic 기반 계획 검토 |
| `analyze` | 심층 분석 및 조사 |
| `deepsearch` | 다중 전략 코드베이스 검색 |
| `deepinit` | AGENTS.md 계층 생성 |
| `research` | 병렬 scientist 오케스트레이션 |

#### 개발 워크플로우
| Skill | 목적 |
|-------|------|
| `ultraqa` | QA 순환: test→fix→repeat |
| `tdd` | 테스트 우선 개발 강제 |
| `frontend-ui-ux` | 조용한 디자인 감각 (자동 활성화) |
| `git-master` | Git 전문성 (자동 활성화) |
| `ralph-init` | 스토리가 있는 PRD 초기화 |

#### 유틸리티
| Skill | 목적 |
|-------|------|
| `cancel` | 통합 취소 (자동 탐지) |
| `cancel-autopilot` | autopilot 취소 |
| `cancel-ralph` | ralph loop 취소 |
| `cancel-ultrawork` | ultrawork 취소 |
| `cancel-ultraqa` | ultraqa 취소 |
| `learner` | 재사용 가능한 스킬 추출 |
| `note` | 압축 저항 메모리 |
| `doctor` | 설치 진단 |
| `hud` | 상태 표시줄 설정 |
| `help` | 사용 가이드 |
| `omd-setup` | 일회성 설정 마법사 |
| `omd-default` | 로컬 프로젝트 설정 |
| `omd-default-global` | 글로벌 설정 |

### 7.3 Skill 호출

**명시적:**
```
/oh-my-droid:autopilot Build a REST API
/oh-my-droid:ralph Fix all bugs
```

**암시적 (매직 키워드):**
```
"autopilot build me a dashboard" → autopilot 활성화
"ulw fix all errors" → ultrawork 활성화
"don't stop until it works" → ralph 활성화
```

---

## 8. 상태 관리

### 8.1 상태 파일 위치

| 상태 | 로컬 경로 | 글로벌 경로 |
|------|---------|-----------|
| Ultrawork | `.omd/ultrawork-state.json` | `~/.factory/omd/ultrawork-state.json` |
| Ralph | `.omd/ralph-state.json` | - |
| Autopilot | `.omd/autopilot-state.json` | - |
| Ecomode | `.omd/ecomode-state.json` | - |
| UltraQA | `.omd/ultraqa-state.json` | - |
| Ralplan | `.omd/ralplan-state.json` | - |
| Swarm | `.omd/swarm-state.json` | - |
| Ultrapilot | `.omd/ultrapilot-state.json` | - |
| Pipeline | `.omd/pipeline-state.json` | - |
| PRD | `.omd/prd.json` | - |
| Verification | `.omd/ralph-verification.json` | - |
| Plans | `.omd/plans/*.md` | - |
| Notepads | `.omd/notepads/{plan}/` | - |
| Session Stats | - | `~/.factory/omd/.session-stats.json` |
| Learned Skills | `.omd/skills/*.md` | `~/.factory/omd/skills/*.md` |
| Todos | `.omd/todos.json` | `~/.factory/omd/todos/*.json` |

### 8.2 상태 파일 스키마

#### ultrawork-state.json
```json
{
  "active": true,
  "started_at": "2024-01-26T10:00:00Z",
  "original_prompt": "ulw fix all bugs",
  "reinforcement_count": 0,
  "escape_threshold": 10
}
```

#### ralph-state.json
```json
{
  "active": true,
  "started_at": "2024-01-26T10:00:00Z",
  "original_prompt": "ralph: refactor auth",
  "promise": "Refactor authentication module",
  "iteration": 1,
  "max_iterations": 10,
  "prd_path": ".omd/prd.json",
  "verification_pending": false
}
```

#### autopilot-state.json
```json
{
  "active": true,
  "phase": "execution",
  "started_at": "2024-01-26T10:00:00Z",
  "spec_path": ".omd/autopilot/spec.md",
  "plan_path": ".omd/plans/autopilot-impl.md",
  "metrics": {
    "tasks_completed": 5,
    "tasks_total": 10,
    "agents_spawned": 12
  }
}
```

### 8.3 Notepad Wisdom 시스템

위치: `.omd/notepads/{plan-name}/`

| 파일 | 목적 |
|------|------|
| `learnings.md` | 기술적 발견, 패턴 |
| `decisions.md` | 아키텍처 선택, 근거 |
| `issues.md` | 알려진 문제, 해결 방법 |
| `problems.md` | 차단 요소, 도전 과제 |

---

## 9. 설정

### 9.1 사용자 설정

위치: `~/.factory/omd.config.json`

```json
{
  "defaultExecutionMode": "ultrawork",
  "hudEnabled": true,
  "hudPreset": "focused",
  "modelRouting": {
    "defaultTier": "MEDIUM",
    "escalateOnFailure": true
  },
  "persistence": {
    "ralphMaxIterations": 10,
    "ultraworkEscapeThreshold": 10,
    "todoMaxAttempts": 15
  },
  "delegation": {
    "enforceForSourceFiles": true,
    "warnedExtensions": [".ts", ".tsx", ".js", ".jsx", ".py", ".go", ".rs"]
  }
}
```

### 9.2 프로젝트 설정

위치: `.factory/omd.config.json`

```json
{
  "projectType": "typescript",
  "testCommand": "npm test",
  "buildCommand": "npm run build",
  "lintCommand": "npm run lint",
  "customAgents": [],
  "disabledSkills": [],
  "rules": {
    "coding-style": true,
    "security": true,
    "testing": true
  }
}
```

---

## 10. oh-my-claudecode와의 주요 차이점

### 10.1 플랫폼 차이

| 측면 | oh-my-claudecode | oh-my-droid |
|------|------------------|-------------|
| **플랫폼** | Claude Code | Factory AI Droid |
| **Plugin Dir** | `.claude-plugin/` | `.factory-plugin/` |
| **Settings** | `~/.claude/settings.json` | `~/.factory/settings.json` |
| **Project Settings** | `.claude/settings.json` | `.factory/settings.json` |
| **State Dir** | `.omc/` | `.omd/` |
| **Global State** | `~/.claude/` | `~/.factory/omd/` |
| **Env Variable** | `CLAUDE_PROJECT_DIR` | `FACTORY_PROJECT_DIR` |
| **Plugin Root Env** | `${CLAUDE_PLUGIN_ROOT}` | `${DROID_PLUGIN_ROOT}` |
| **Transcript Path** | `~/.claude/projects/` | `~/.factory/projects/` |

### 10.2 네이밍 규칙

| oh-my-claudecode | oh-my-droid |
|------------------|-------------|
| `omc` | `omd` |
| `oh-my-claudecode:` | `oh-my-droid:` |
| `/oh-my-claudecode:help` | `/oh-my-droid:help` |
| `omc-setup` | `omd-setup` |
| `.omc/` | `.omd/` |
| `CLAUDE.md` | `DROID.md` 또는 프로젝트 지시 파일 |

### 10.3 Hook 입력 차이

| 필드 | Claude Code | Droid |
|------|-------------|-------|
| `session_id` | 동일 | 동일 |
| `transcript_path` | 동일 | 동일 |
| `cwd` | 동일 | 동일 |
| `permission_mode` | 동일 | 동일 |

### 10.4 Hook 출력 차이

hook 출력 형식은 플랫폼 간 동일합니다:
- 종료 코드 (0, 2, 기타)
- `decision`, `reason`, `hookSpecificOutput`가 포함된 JSON 출력
- PreToolUse를 위한 `permissionDecision`

---

## 10.5 MCP Tool 처리

MCP tools는 `mcp__<server>__<tool>` 패턴을 따릅니다. 플러그인은 다음과 같이 처리합니다:

### PreToolUse/PostToolUse 매칭

`*` matcher는 MCP tools를 포함한 모든 도구를 캡처합니다. 특정 MCP 처리를 위해:

```json
{
  "PreToolUse": [
    {
      "matcher": "mcp__.*",
      "hooks": [
        {
          "type": "command",
          "command": "${DROID_PLUGIN_ROOT}/scripts/mcp-handler.mjs"
        }
      ]
    }
  ]
}
```

### 기본 동작

기본적으로 oh-my-droid는 특별한 처리 없이 MCP tools를 통과시킵니다. delegation enforcer는 외부 통합이므로 MCP tools에 대해 경고하지 않습니다.

---

## 10.6 에러 처리 전략

### Hook 스크립트 에러

| 종료 코드 | 동작 | Droid 응답 |
|----------|------|-----------|
| 0 | 성공 | 정상 진행 |
| 2 | 차단 에러 | stderr를 피드백으로 처리 |
| 기타 | 비차단 에러 | 사용자에게 stderr 표시, 진행 |

### 스크립트 에러 처리 패턴

```javascript
#!/usr/bin/env node
import { readFileSync } from 'fs';

try {
  const input = JSON.parse(readFileSync(0, 'utf-8'));

  // 입력 처리...

  console.log(JSON.stringify({ /* output */ }));
  process.exit(0);

} catch (error) {
  // 디버깅을 위해 stderr에 로그
  console.error(`[omd] Error: ${error.message}`);

  // 비차단 에러 - Droid가 계속하도록 함
  process.exit(1);
}
```

### 상태 파일 에러

- **상태 파일 누락**: "모드 활성화 안됨"으로 처리
- **손상된 JSON**: 경고 로그, 기본 상태로 재설정
- **권한 에러**: 경고 로그, 상태 없이 계속

### 타임아웃 처리

- 각 hook은 설정된 타임아웃(3-5초)이 있습니다
- 타임아웃 시 Droid는 hook 출력 없이 계속합니다
- 스크립트는 중요한 작업을 먼저, 선택적 작업을 마지막에 완료해야 합니다

---

## 11. 구현 단계

### 1단계: 핵심 인프라 (1주차)

1. **Plugin Manifest**
   - `.factory-plugin/plugin.json` 생성
   - `.factory-plugin/marketplace.json` 생성

2. **기본 Hooks**
   - `hooks/hooks.json` 설정
   - `scripts/session-start.mjs` - 기본 컨텍스트 주입
   - `scripts/keyword-detector.mjs` - 매직 키워드 탐지

3. **핵심 Skills**
   - `skills/help/SKILL.md`
   - `skills/omd-setup/SKILL.md`
   - `skills/orchestrate/SKILL.md`

4. **필수 Custom Droids**
   - `droids/architect.md`
   - `droids/executor.md`
   - `droids/explore.md`

### 2단계: 실행 모드 (2주차)

1. **Ultrawork**
   - `skills/ultrawork/SKILL.md`
   - 상태 관리
   - 키워드 탐지 통합

2. **Ralph**
   - `skills/ralph/SKILL.md`
   - `scripts/persistent-mode.mjs`
   - PRD 지원

3. **지원 Skills**
   - `skills/cancel/SKILL.md`
   - `skills/cancel-ultrawork/SKILL.md`
   - `skills/cancel-ralph/SKILL.md`

### 3단계: 계획 시스템 (3주차)

1. **Planner**
   - `skills/planner/SKILL.md`
   - `agents/planner.md`
   - `agents/critic.md`
   - `agents/analyst.md`

2. **Planning Skills**
   - `skills/plan/SKILL.md`
   - `skills/ralplan/SKILL.md`
   - `skills/review/SKILL.md`

### 4단계: 전체 Custom Droids 카탈로그 (4주차)

1. **모든 계층형 Custom Droids**
   - 32개의 droid 정의 완료 (`droids/*.md`)
   - 템플릿 시스템

2. **고급 Skills**
   - `skills/autopilot/SKILL.md`
   - `skills/ultrapilot/SKILL.md`
   - `skills/swarm/SKILL.md`
   - `skills/pipeline/SKILL.md`

### 5단계: 품질 & 다듬기 (5주차)

1. **추가 Skills**
   - `skills/ultraqa/SKILL.md`
   - `skills/tdd/SKILL.md`
   - `skills/frontend-ui-ux/SKILL.md`
   - `skills/git-master/SKILL.md`

2. **유틸리티**
   - `skills/doctor/SKILL.md`
   - `skills/hud/SKILL.md`
   - `skills/note/SKILL.md`
   - `skills/learner/SKILL.md`

3. **문서**
   - README.md 완료
   - AGENTS.md
   - 모든 명령어 문서

### 6단계: 테스팅 & 릴리스 (6주차)

1. **테스팅**
   - Hook 스크립트 테스팅
   - Skill 통합 테스팅
   - Custom Droids 검증

2. **릴리스**
   - npm 패키지 준비
   - Marketplace 제출
   - 사용자 문서

---

## 부록 A: Hook 입력/출력 레퍼런스

### A.0 공통 JSON 출력 필드

모든 hook 타입은 다음 선택적 필드를 지원합니다:

```json
{
  "continue": true,          // Droid가 계속해야 하는지 (기본값: true)
                             // false인 경우, Droid는 hooks 실행 후 처리를 중단합니다

  "stopReason": "string",    // continue가 false일 때 사용자에게 표시되는 메시지
                             // Droid에게는 표시되지 않음

  "suppressOutput": true,    // transcript 모드에서 stdout 숨김 (기본값: false)

  "systemMessage": "string"  // 사용자에게 표시되는 경고 메시지
}
```

**중요:**
- `continue: false`는 `decision: block` 출력보다 우선합니다
- `PreToolUse`의 경우, 이것은 하나의 tool call만 차단하는 `permissionDecision: deny`와 다릅니다
- `Stop/SubagentStop`의 경우, 이것은 `decision: block`보다 우선합니다

### A.1 UserPromptSubmit

**입력:**
```json
{
  "session_id": "abc123",
  "transcript_path": "~/.factory/projects/.../transcript.jsonl",
  "cwd": "/project/path",
  "permission_mode": "default",
  "hook_event_name": "UserPromptSubmit",
  "prompt": "user's message"
}
```

**출력 (컨텍스트 주입):**
```json
{
  "hookSpecificOutput": {
    "hookEventName": "UserPromptSubmit",
    "additionalContext": "주입할 컨텍스트"
  }
}
```

**출력 (차단):**
```json
{
  "decision": "block",
  "reason": "사용자에게 표시되는 이유"
}
```

### A.2 SessionStart

**입력:**
```json
{
  "session_id": "abc123",
  "transcript_path": "~/.factory/projects/.../transcript.jsonl",
  "cwd": "/project/path",
  "permission_mode": "default",
  "hook_event_name": "SessionStart",
  "source": "startup|resume|clear|compact"
}
```

**출력:**
```json
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "복원된 세션 컨텍스트..."
  }
}
```

### A.3 PreToolUse

**입력:**
```json
{
  "session_id": "abc123",
  "transcript_path": "~/.factory/projects/.../transcript.jsonl",
  "cwd": "/project/path",
  "permission_mode": "default",
  "hook_event_name": "PreToolUse",
  "tool_name": "Edit",
  "tool_input": {
    "file_path": "/path/to/file.ts",
    "old_string": "...",
    "new_string": "..."
  }
}
```

**출력 (컨텍스트 주입):**
```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "additionalContext": "위임 고려..."
  }
}
```

**출력 (권한 제어):**
```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "allow|deny|ask",
    "permissionDecisionReason": "이유"
  }
}
```

**출력 (입력 수정):**
```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "allow",
    "updatedInput": {
      "field_to_modify": "new_value"
    }
  }
}
```

### A.4 PostToolUse

**입력:**
```json
{
  "session_id": "abc123",
  "transcript_path": "~/.factory/projects/.../transcript.jsonl",
  "cwd": "/project/path",
  "permission_mode": "default",
  "hook_event_name": "PostToolUse",
  "tool_name": "Edit",
  "tool_input": {...},
  "tool_response": {
    "success": true,
    "filePath": "/path/to/file.ts"
  }
}
```

**출력:**
```json
{
  "hookSpecificOutput": {
    "hookEventName": "PostToolUse",
    "additionalContext": "변경사항 검증..."
  }
}
```

### A.5 Stop / SubagentStop

**입력:**
```json
{
  "session_id": "abc123",
  "transcript_path": "~/.factory/projects/.../transcript.jsonl",
  "cwd": "/project/path",
  "permission_mode": "default",
  "hook_event_name": "Stop",
  "stop_hook_active": false
}
```

**출력 (중지 허용):**
```json
{}
```

**출력 (중지 차단):**
```json
{
  "decision": "block",
  "reason": "<ralph-loop-continuation>\n계속해야 합니다...\n</ralph-loop-continuation>"
}
```

### A.6 PreCompact

**입력:**
```json
{
  "session_id": "abc123",
  "transcript_path": "~/.factory/projects/.../transcript.jsonl",
  "cwd": "/project/path",
  "permission_mode": "default",
  "hook_event_name": "PreCompact",
  "trigger": "manual|auto",
  "custom_instructions": ""
}
```

**출력:**
```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreCompact",
    "additionalContext": "지혜 보존됨: 5개 학습, 3개 결정."
  }
}
```

> **참고:** PreCompact hooks는 압축을 차단할 수 없습니다. 컨텍스트가 압축되기 전 상태 보존을 위한 것입니다.

### A.7 SessionEnd

**입력:**
```json
{
  "session_id": "abc123",
  "transcript_path": "~/.factory/projects/.../transcript.jsonl",
  "cwd": "/project/path",
  "permission_mode": "default",
  "hook_event_name": "SessionEnd",
  "reason": "clear|logout|prompt_input_exit|other"
}
```

**출력:**
```json
{}
```

> **참고:** SessionEnd hooks는 세션 종료를 차단할 수 없습니다. 정리 작업만을 위한 것입니다. 출력은 디버그에만 로그됩니다.

---

## 부록 B: 환경 변수

| 변수 | 설명 |
|------|------|
| `FACTORY_PROJECT_DIR` | 프로젝트 루트의 절대 경로 |
| `DROID_PLUGIN_ROOT` | 플러그인 디렉토리의 절대 경로 |
| `OMD_DEBUG` | 디버그 로깅 활성화 |
| `OMD_CONFIG_PATH` | 커스텀 설정 파일 경로 |

---

## 부록 C: 매직 키워드 레퍼런스

| 키워드 | 모드 | 상태 파일 | 설명 |
|--------|------|----------|------|
| `autopilot`, `build me`, `I want a` | Autopilot | `.omd/autopilot-state.json` | 완전 자율 실행 |
| `ultrapilot`, `parallel build` | Ultrapilot | `.omd/ultrapilot-state.json` | 병렬 autopilot |
| `ralph`, `don't stop`, `must complete` | Ralph | `.omd/ralph-state.json` | 지속성 루프 |
| `ulw`, `ultrawork`, `fast`, `parallel` | Ultrawork | `.omd/ultrawork-state.json` | 최대 병렬화 |
| `eco`, `ecomode`, `budget`, `efficient` | Ecomode | `.omd/ecomode-state.json` | 토큰 효율 |
| `ultrathink`, `think` | Think Mode | (컨텍스트만) | 확장된 추론 |
| `search`, `find`, `locate`, `explore` | Search | (컨텍스트만) | 검색 가이드 |
| `analyze`, `investigate`, `debug` | Analysis | (컨텍스트만) | 분석 가이드 |
| `stop`, `cancel`, `abort` | Cancel | (활성 제거) | 활성 모드 취소 |

---

*설계 문서 끝*
