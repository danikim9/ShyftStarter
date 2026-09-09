# iOS / 안드로이드 네이티브 앱 빌드 가이드 (Capacitor)

34차에서 Capacitor를 설정해서, 이제 이 폴더 하나(`shyftstarter_employee/`)에서 웹 코드를 고치면
iOS와 안드로이드 앱 양쪽에 똑같이 반영할 수 있어요.

## 처음 한 번만: 패키지 설치

```bash
npm install
```

## 코드를 고칠 때마다: 빌드 + 동기화

웹 코드(`src/` 안의 파일들)를 수정한 뒤에는 이 명령어 하나로 iOS/안드로이드 양쪽에 반영하세요.

```bash
npm run cap:sync
```

이 한 줄이 하는 일: 웹 코드를 다시 빌드하고 → `android/app/src/main/assets/public/`와
`ios/App/App/public/`에 그 결과를 복사합니다. 이후 Xcode/Android Studio에서 다시 빌드(Run)하면
바뀐 내용이 반영돼요.

## iOS 앱 열기 (맥 + Xcode 필요)

```bash
npx cap open ios
```

Xcode가 열리면 지금까지 하시던 것처럼 기기 선택 → Run(▶) 하시면 돼요. 참고: 이건 지금까지 직접
만드신 Xcode 프로젝트와는 별개로 새로 생성된 프로젝트예요 — 기존에 설정해두신 앱 아이콘/서명 등이
있다면 이 새 프로젝트에는 없으니, 처음 한 번은 Xcode에서 다시 설정해주셔야 해요. (계속 쓰시던 기존
프로젝트가 이걸로 대체되거나 지워지는 건 아니에요 — 완전히 별도의 새 폴더예요.)

## 안드로이드 앱 열기 (Android Studio 필요)

1. [Android Studio](https://developer.android.com/studio) 설치 (맥/윈도우 모두 가능)
2. Android Studio 실행 → "Open" → 이 폴더 안의 `android/` 폴더 선택
3. 처음 열면 Gradle 동기화가 자동으로 진행돼요 (몇 분 걸릴 수 있어요)
4. 안드로이드 폰을 USB로 연결하거나(휴대폰에서 "USB 디버깅" 켜야 함) 에뮬레이터를 켜고
5. 상단의 Run(▶) 버튼 클릭

## 앱 이름 / 아이콘 / 패키지 ID 바꾸기

- 앱 이름·패키지 ID는 `capacitor.config.ts`에서 설정했어요 (`com.bellatrix.shyftstarter`,
  "ShyftStarter"). 나중에 정식 출시할 땐 여기 값을 회사에서 쓸 실제 패키지 ID로 바꿔야 해요.
- 앱 아이콘은 아직 기본 Capacitor 아이콘이에요. 실제 아이콘으로 바꾸려면
  `@capacitor/assets` 같은 도구를 쓰거나, Android Studio/Xcode에서 직접 아이콘 파일을
  교체하시면 돼요 — 필요하시면 다음에 도와드릴게요.

## 참고

- `android/`, `ios/` 폴더는 이번에 새로 생성된 네이티브 프로젝트 뼈대예요 — 각각 Android
  Studio, Xcode로 여는 완전한 프로젝트입니다.
- 웹 코드(`src/`)만 고치고 `npm run cap:sync`만 실행하면 되고, `android/`·`ios/` 폴더 안의
  파일을 직접 고칠 일은 거의 없어요(아이콘/앱 이름 등 네이티브 전용 설정을 바꿀 때만 예외).
