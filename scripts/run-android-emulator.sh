#!/usr/bin/env bash
#
# run-android-emulator.sh
# ─────────────────────────────────────────────────────────────────────────────
# WSL2에서 Windows Android 에뮬레이터로 이 Expo 앱(SDK 54)을 실행합니다.
#
# 왜 이런 스크립트가 필요한가 (WSL2 특이사항):
#   1) WSL2 NAT 네트워크 때문에 에뮬레이터가 WSL의 Metro에 localhost/adb reverse로
#      도달하지 못함 → tunnel(ngrok) 모드로 우회한다.
#   2) 포트 8081은 이 프로젝트의 CodeIgniter API 백엔드가 사용 → 자동으로 피한다.
#   3) 에뮬레이터의 Expo Go는 반드시 SDK 54 이상이어야 한다(구버전이면 에러 화면).
#
# 사용법:
#   bash scripts/run-android-emulator.sh
#   (또는 package.json에 등록했다면) npm run emulator
#
# 종료: 터미널에서 Ctrl+C (Metro tunnel 서버가 함께 종료됨)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── 설정: 피할 포트 (8081=백엔드, 8083=다른 용도로 사용 중) ──────────────────
AVOID_PORTS=(8081 8083)
AVD_NAME="Pixel_7_API_36"
# 에뮬레이터의 localhost:PORT 를 PC(WSL)의 같은 포트로 연결(adb reverse).
# FastAPI 백엔드(3200)를 에뮬레이터에서 localhost:3200 으로 접근하려면 필수.
# (WSL2 NAT 때문에 에뮬레이터가 PC 서비스에 직접 못 닿으므로 reverse 로 우회)
API_REVERSE_PORTS=(3200)

# ── Windows Android SDK 경로 자동 탐지 ───────────────────────────────────────
SDK_ADB="$(ls /mnt/c/Users/*/AppData/Local/Android/Sdk/platform-tools/adb.exe 2>/dev/null | head -1 || true)"
SDK_EMU="$(ls /mnt/c/Users/*/AppData/Local/Android/Sdk/emulator/emulator.exe 2>/dev/null | head -1 || true)"

if [[ -z "$SDK_ADB" || -z "$SDK_EMU" ]]; then
  echo "✗ Windows Android SDK를 찾지 못했습니다. Android Studio 설치 경로를 확인하세요." >&2
  exit 1
fi
ADB() { "$SDK_ADB" "$@"; }

echo "▸ adb: $SDK_ADB"

# ── 1. 에뮬레이터 부팅 (이미 켜져 있으면 건너뜀) ─────────────────────────────
if ADB devices | grep -q "emulator-.*device$"; then
  echo "✓ 에뮬레이터가 이미 실행 중입니다."
else
  echo "▸ 에뮬레이터 부팅: $AVD_NAME"
  "$SDK_EMU" -avd "$AVD_NAME" -no-snapshot-load >/dev/null 2>&1 &
  ADB wait-for-device
  echo -n "▸ 부팅 대기"
  for _ in $(seq 1 40); do
    [[ "$(ADB shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" == "1" ]] && break
    echo -n "."; sleep 3
  done
  echo " 완료!"
fi

# ── 1.5 백엔드 연결용 adb reverse 설정 ───────────────────────────────────────
for rp in "${API_REVERSE_PORTS[@]}"; do
  ADB reverse "tcp:$rp" "tcp:$rp" >/dev/null 2>&1 \
    && echo "✓ adb reverse tcp:$rp → 에뮬레이터 localhost:$rp = PC localhost:$rp"
done

# ── 2. Expo Go 버전 확인 (SDK 54 미지원이면 안내) ────────────────────────────
if ! ADB shell pm list packages 2>/dev/null | grep -q "host.exp.exponent"; then
  echo "⚠ Expo Go가 설치돼 있지 않습니다. 아래 명령으로 SDK 54용을 설치하세요:"
  echo "    URL=\$(curl -s https://api.expo.dev/v2/versions/latest | node -e 'let d=\"\";process.stdin.on(\"data\",c=>d+=c).on(\"end\",()=>console.log(JSON.parse(d).sdkVersions[\"54.0.0\"].androidClientUrl))')"
  echo "    curl -sL -o /tmp/expo-go.apk \"\$URL\" && \"$SDK_ADB\" install /tmp/expo-go.apk"
fi

# ── 3. 빈 포트 탐색 (8081/8083 등 회피) ──────────────────────────────────────
pick_port() {
  for p in 8082 8084 8085 8086 8087 8088; do
    [[ " ${AVOID_PORTS[*]} " == *" $p "* ]] && continue
    ss -ltn 2>/dev/null | grep -q ":$p " && continue
    echo "$p"; return 0
  done
  echo "8082"  # fallback
}
PORT="$(pick_port)"
echo "▸ Metro 포트: $PORT (tunnel 모드)"

# ── 4. Metro tunnel 실행 (백그라운드) → URL 파싱 → Expo Go 자동 실행 ─────────
LOGFILE="$(mktemp)"
cleanup() {
  echo; echo "▸ 종료 중..."
  kill "${METRO_PID:-}" 2>/dev/null || true
  pkill -P "${METRO_PID:-0}" 2>/dev/null || true
  rm -f "$LOGFILE"
}
trap cleanup EXIT INT TERM

EXPO_PACKAGER_HOSTNAME=localhost npx expo start --go --tunnel --port "$PORT" >"$LOGFILE" 2>&1 &
METRO_PID=$!

echo -n "▸ tunnel 연결 대기"
TUNNEL_URL=""
for _ in $(seq 1 40); do
  if grep -q "Tunnel ready" "$LOGFILE" 2>/dev/null; then
    TUNNEL_URL="$(curl -s http://localhost:4040/api/tunnels 2>/dev/null \
      | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{try{const t=JSON.parse(d).tunnels.find(x=>x.proto==="https")||JSON.parse(d).tunnels[0];console.log(t.public_url.replace(/^https?:\/\//,""))}catch(e){}})' 2>/dev/null)"
    [[ -n "$TUNNEL_URL" ]] && break
  fi
  echo -n "."; sleep 2
done
echo

if [[ -n "$TUNNEL_URL" ]]; then
  echo "✓ tunnel: $TUNNEL_URL"
  ADB shell am force-stop host.exp.exponent 2>/dev/null || true
  sleep 1
  ADB shell am start -a android.intent.action.VIEW -d "exp://$TUNNEL_URL" host.exp.exponent >/dev/null 2>&1
  echo "✓ 에뮬레이터에서 Expo Go로 앱을 여는 중... (최초 번들링 30~90초)"
else
  echo "⚠ tunnel URL 자동 감지 실패. 아래 Metro 로그의 QR/URL을 Expo Go에서 직접 여세요."
fi

echo "────────────────────────────────────────────────────────"
echo "  Metro 로그 (Ctrl+C 로 종료)"
echo "────────────────────────────────────────────────────────"
tail -f "$LOGFILE"
