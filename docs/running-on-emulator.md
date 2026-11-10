# WSL2에서 Android 에뮬레이터로 앱 실행하기

이 프로젝트는 **Expo(React Native, SDK 54)** 앱이며, WSL2 + Windows 에뮬레이터 조합에서 실행합니다.

## 빠른 실행

```bash
npm run emulator
```

`scripts/run-android-emulator.sh`가 다음을 자동으로 처리합니다:

1. Windows Android 에뮬레이터(`Pixel_7_API_36`) 부팅 (이미 켜져 있으면 건너뜀)
2. 빈 포트 자동 선택 (**8081=백엔드, 8083=사용 중**은 자동 회피)
3. Metro를 **tunnel 모드**로 실행
4. 에뮬레이터의 Expo Go로 앱 자동 실행

종료는 터미널에서 `Ctrl+C` (Metro tunnel 서버도 함께 종료).

## 왜 이렇게 복잡한가 (WSL2 특이사항)

| 문제 | 원인 | 해결 |
|------|------|------|
| 에뮬레이터가 Metro에 연결 안 됨 | WSL2 NAT — localhost 포워딩이 loopback에만 적용, `adb reverse`/`10.0.2.2` 모두 도달 실패 | **tunnel(ngrok) 모드**로 우회 |
| 포트 8081 충돌 | CodeIgniter API 백엔드가 8081 점유 | Metro는 다른 포트(8082 등) 사용 |
| Expo Go "requires newer version" 에러 | 에뮬레이터 Expo Go가 SDK 54 미지원 구버전 | Expo Go 54.x로 업그레이드 |

## 수동 실행 (스크립트 없이)

```bash
# 1. 에뮬레이터 부팅
/mnt/c/Users/<사용자명>/AppData/Local/Android/Sdk/emulator/emulator.exe -avd Pixel_7_API_36 &

# 2. Metro tunnel 실행 (8081/8083 외의 포트)
npx expo start --go --tunnel --port 8082
# → 터미널의 QR 또는 exp:// URL을 에뮬레이터 Expo Go에서 열기
```

## Expo Go(SDK 54) 재설치가 필요할 때

에뮬레이터를 초기화했거나 구버전 Expo Go가 깔린 경우:

```bash
ADB=/mnt/c/Users/<사용자명>/AppData/Local/Android/Sdk/platform-tools/adb.exe
URL=$(curl -s https://api.expo.dev/v2/versions/latest \
  | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).sdkVersions["54.0.0"].androidClientUrl))')
curl -sL -o /tmp/expo-go.apk "$URL"
"$ADB" install /tmp/expo-go.apk   # 저장공간 부족 시: "$ADB" uninstall host.exp.exponent 먼저
```

## 로그인이 안 될 때 (백엔드 연결)

에뮬레이터에서 `.env`의 `EXPO_PUBLIC_API_BASE_URL=http://localhost:3200`을 쓰려면:

1. **FastAPI 백엔드를 먼저 켠다** (`../kmcbeauty_fastapi`, `uvicorn --port 3200`).
2. **`adb reverse tcp:3200 tcp:3200`** — 에뮬레이터의 `localhost:3200`을 PC 백엔드로 연결.
   `npm run emulator` 스크립트가 자동으로 걸어준다 (`API_REVERSE_PORTS`).

> WSL2 NAT 때문에 에뮬레이터는 PC 서비스(`10.0.2.2`)에 직접 못 닿는다.
> `adb reverse`를 쓰면 `.env` 수정 없이 `localhost:3200` 그대로 동작한다.
> 검증: 에뮬레이터 브라우저에서 `http://localhost:3200` → `{"detail":"Not Found"}`(FastAPI 404)가 뜨면 연결 성공.

## console.log 로그가 안 보일 때

React Native(Hermes)의 `console.log/error`는 **Metro dev server를 통해서만** 출력된다.
Metro를 백그라운드로 돌리면 로그를 볼 수 없다.

- 로그를 보려면 **Metro를 포그라운드로 실행** → `npm run emulator` 마지막의 `tail -f`가 실시간 표시.
- 예시 출력: `LOG  📍 API 클라이언트 초기화: http://localhost:3200`

## 참고

- 패키지 버전 정합성 정리: `npx expo install --check`
- 실기기(폰)로 열 때도 동일하게 `npx expo start --tunnel` 후 Expo Go 앱으로 QR 스캔
