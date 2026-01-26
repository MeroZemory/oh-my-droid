# oh-my-droid Windows 설치 스크립트
# Factory AI Droid CLI용 멀티 에이전트 오케스트레이션 플러그인

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$FactoryDir = Join-Path $env:USERPROFILE ".factory"

Write-Host "🤖 oh-my-droid 설치 시작..." -ForegroundColor Cyan
Write-Host ""

# 디렉토리 생성
$dirs = @(
    (Join-Path $FactoryDir "droids"),
    (Join-Path $FactoryDir "commands"),
    (Join-Path $FactoryDir "plugins\oh-my-droid")
)

foreach ($dir in $dirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
}

# 드로이드 설치 (32개)
Write-Host "📦 드로이드 설치 중... (32개)" -ForegroundColor Yellow
$droidsSource = Join-Path $ScriptDir "templates\droids\*.md"
$droidsTarget = Join-Path $FactoryDir "droids"
Copy-Item -Path $droidsSource -Destination $droidsTarget -Force
Write-Host "   ✓ $droidsTarget 에 설치됨" -ForegroundColor Green

# 명령어 설치 (8개)
Write-Host "📦 명령어 설치 중... (8개)" -ForegroundColor Yellow
$commandsSource = Join-Path $ScriptDir "templates\commands\*.md"
$commandsTarget = Join-Path $FactoryDir "commands"
Copy-Item -Path $commandsSource -Destination $commandsTarget -Force
Write-Host "   ✓ $commandsTarget 에 설치됨" -ForegroundColor Green

# 플러그인 파일 복사
Write-Host "📦 플러그인 파일 복사 중..." -ForegroundColor Yellow
$pluginDir = Join-Path $FactoryDir "plugins\oh-my-droid"

Copy-Item -Path (Join-Path $ScriptDir "scripts") -Destination $pluginDir -Recurse -Force
Copy-Item -Path (Join-Path $ScriptDir "hooks") -Destination $pluginDir -Recurse -Force
Copy-Item -Path (Join-Path $ScriptDir "skills") -Destination $pluginDir -Recurse -Force
Copy-Item -Path (Join-Path $ScriptDir "package.json") -Destination $pluginDir -Force
Write-Host "   ✓ $pluginDir 에 설치됨" -ForegroundColor Green

# settings.json 확인
$settingsFile = Join-Path $FactoryDir "settings.json"
if (Test-Path $settingsFile) {
    $content = Get-Content $settingsFile -Raw
    if ($content -match '"hooks"') {
        Write-Host ""
        Write-Host "⚠️  $settingsFile 에 이미 hooks가 설정되어 있습니다." -ForegroundColor Yellow
        Write-Host "   수동으로 확인해주세요."
    }
}

Write-Host ""
Write-Host "💡 hooks 활성화를 위해 다음을 settings.json에 추가하세요:" -ForegroundColor Cyan
Write-Host ""
Write-Host @"
  "hooks": {
    "UserPromptSubmit": [{ "hooks": [{ "type": "command", "command": "node ~/.factory/plugins/oh-my-droid/scripts/keyword-detector.mjs", "timeout": 5 }] }],
    "SessionStart": [{ "hooks": [{ "type": "command", "command": "node ~/.factory/plugins/oh-my-droid/scripts/session-start.mjs", "timeout": 5 }] }],
    "Stop": [{ "hooks": [{ "type": "command", "command": "node ~/.factory/plugins/oh-my-droid/scripts/persistent-mode.mjs", "timeout": 5 }] }]
  }
"@ -ForegroundColor Gray

Write-Host ""
Write-Host "✅ oh-my-droid 설치 완료!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 설치된 항목:" -ForegroundColor Cyan
Write-Host "   - 32개 커스텀 드로이드 (~/.factory/droids/)"
Write-Host "   - 8개 슬래시 명령어 (~/.factory/commands/)"
Write-Host "   - Hook 스크립트 (~/.factory/plugins/oh-my-droid/)"
Write-Host ""
Write-Host "🚀 사용법:" -ForegroundColor Cyan
Write-Host "   droid                    # 새 세션 시작"
Write-Host "   ulw <작업>               # Ultrawork 모드"
Write-Host "   /analyze <대상>          # 분석 명령어"
Write-Host ""
