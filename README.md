# 🏗️ DnDn - 건설현장 통합 관리 플랫폼

<p align="center">
  <img src="https://github.com/user-attachments/assets/f0b5506c-1b21-4336-aca4-e05894d0de3c" width="30%"/>
</p>

<p align="center">
  <strong>공정계획부터 작업지시, 공사일보, 인력 배치, 장비 입출차, 기상 관제까지</strong><br/>
  건설현장 운영 데이터를 하나의 흐름으로 연결하는 통합 관리 플랫폼입니다.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-Vue.js_+_Vite-4FC08D?style=flat-square&logo=vue.js&logoColor=white"/>
  <img src="https://img.shields.io/badge/API-Spring_Boot-6DB33F?style=flat-square&logo=springboot&logoColor=white"/>
  <img src="https://img.shields.io/badge/Database-MariaDB-003545?style=flat-square&logo=mariadb&logoColor=white"/>
  <img src="https://img.shields.io/badge/Cache-Redis_Sentinel-DC382D?style=flat-square&logo=redis&logoColor=white"/>
  <img src="https://img.shields.io/badge/Deploy-Kubernetes_/_Jenkins-326CE5?style=flat-square&logo=kubernetes&logoColor=white"/>
</p>

<br/>

## 🧱 DnDn은 어떤 서비스인가요?

**DnDn**은 공정계획, 작업지시, 공사일보, 인력 배치, 출입·근태, 장비 입출차, 기상 관제, 문서 관리, 계정·권한 관리를 하나의 흐름으로 통합한 **건설현장 운영 관리 플랫폼**입니다.

현장마다 다른 공정 일정, 작업 구역, 투입 인력, 장비 운용, 기상 위험 요소를 현장 단위로 관리할 수 있으며, 작업지시와 공사일보를 중심으로 실제 현장 운영 데이터를 연결합니다.

공정계획에서 시작된 작업은 작업지시서로 전달되고, 실제 수행 결과는 공사일보로 기록됩니다. 이 데이터는 인력 배치, 장비 입출차, 기상 위험 판단, ESG 대시보드까지 연동되어 현장 관리자와 본사가 동일한 기준으로 작업 현황과 위험 요소를 확인할 수 있도록 설계했습니다.

<br/>

<p align="center">
  <sub>공정계획 → 작업지시 → 공사일보 → 인력·장비·기상·ESG 연동</sub>
</p>

---

## 👥 팀원 소개

<div align="center">

| **김민규** | **이한별** | **전민주** | **👑 전성훈(팀장)** | **최승우** |
| :---: | :---: | :---: | :---: | :---: |
| <img src="https://avatars.githubusercontent.com/u/244694024?v=4" width="120" style="border-radius:50%"/> | <img src="https://github.com/user-attachments/assets/6ef50d1f-c6b5-4946-acb5-847bd5e552a0" width="120" style="border-radius:50%"/> | <img src="https://github.com/user-attachments/assets/f675522f-6f1f-4644-87fa-b9b0443b975f" width="120" style="border-radius:50%"/> | <img src="https://avatars.githubusercontent.com/u/153381713?s=64&v=4" width="120" style="border-radius:50%"/> | <img src="https://avatars.githubusercontent.com/u/140137784?s=64&v=4" width="120" style="border-radius:50%"/> |
| [@luel1018](https://github.com/luel1018) | [@sole0724](https://github.com/sole0714) | [@minju0077](https://github.com/minju0077) | [@1jshun](https://github.com/1jshun) | [@sw-oo](https://github.com/sw-oo) |

</div>

---

## 📌 목차

<table>
  <tr>
    <td>🧭 <a href="#01-서비스-개요">01. 서비스 개요</a></td>
    <td>📚 <a href="#08-기술-문서">08. 기술 문서</a></td>
  </tr>
  <tr>
    <td>✨ <a href="#02-주요-기능">02. 주요 기능</a></td>
    <td>🐞 <a href="#09-트러블슈팅">09. 트러블슈팅</a></td>
  </tr>
  <tr>
    <td>🛠️ <a href="#03-기술-스택">03. 기술 스택</a></td>
    <td>🎬 <a href="#10-시연-영상">10. 시연 영상</a></td>
  </tr>
  <tr>
    <td>🏗️ <a href="#04-시스템-아키텍처">04. 시스템 아키텍처</a></td>
    <td>🚀 <a href="#11-무중단-배포-전략-bluegreen">11. 무중단 배포 전략</a></td>
  </tr>
  <tr>
    <td>🗂️ <a href="#05-프로젝트-구조">05. 프로젝트 구조</a></td>
    <td>▶️ <a href="#12-실행-방법">12. 실행 방법</a></td>
  </tr>
  <tr>
    <td>🖥️ <a href="#06-상세-서비스-화면">06. 상세 서비스 화면</a></td>
    <td>📎 <a href="#13-그-외-산출물">13. 그 외 산출물</a></td>
  </tr>
  <tr>
    <td>🧩 <a href="#07-프론트엔드-구현-포인트">07. 프론트엔드 구현 포인트</a></td>
    <td>💬 <a href="#14-회고">14. 회고</a></td>
  </tr>
</table>

---
<a id="01-서비스-개요"></a>
<details open>
<summary><h2>01. 🧭 서비스 개요</h2></summary>

**DnDn Frontend**는 건설 현장의 공정 일정, 작업지시, 공사일보, 인력 배치, 장비 입출차, 기상 관제, ESG 대시보드를 웹 화면에서 통합 조회·관리할 수 있도록 구현한 프론트엔드 서비스입니다.

사용자는 로그인 후 조회할 공사현장을 선택하고, 선택한 현장을 기준으로 일정 관리, 투입 관리, 현장 정보, 문서 관리, 시스템 관리 화면에 접근할 수 있습니다.

DnDn 프론트엔드는 단순히 데이터를 표시하는 화면이 아니라, 공정계획에서 작업지시로 이어지고, 작업 결과가 공사일보와 ESG·기상·장비 화면에 연결되는 현장 운영 흐름을 직관적으로 확인할 수 있도록 구성했습니다.

```text
로그인 / 현장 선택
  ↓
공정계획 조회
  ↓
작업지시 등록 및 승인
  ↓
공사일보 작성 및 확인
  ↓
인력 배치 / 장비 입출차 / 기상 관제 / ESG 대시보드 연동
```

</details>

---

<a id="02-주요-기능"></a>
<details open>
<summary><h2>02. ✨ 주요 기능</h2></summary>

DnDn Frontend는 사이드바 메뉴를 기준으로 현장 운영에 필요한 화면을 기능별로 제공합니다.

<details open>
<summary><strong>📅 일정 관리</strong></summary>
<br/>

공사 현장의 공정 일정과 작업 흐름을 관리하는 화면입니다.

| 기능 | 설명 |
| :--- | :--- |
| ESG 대시보드 | 선택한 공사현장과 작업구역별 ESG 점수, 점수 분해, 주간 미션, 현장 ESG 순위를 조회합니다. |
| 전체 공정표 | 공사 현장의 전체 작업 일정과 공정 진행 현황을 한눈에 확인합니다. |
| 공정 계획 | 연간·월간·주간 단위의 공정계획을 조회하고, 세부 계획서 작성 및 계획서 업로드를 통해 공정 일정을 관리합니다. |
| 작업 지시 | 공종별 책임자는 작업지시서를 등록하고, 현장 총 책임자는 전체 작업지시 현황과 승인 상태를 확인합니다. |
| 공사 일보 | 기준 일자별 공사일보 제출 상태, 작업 진행 내용, 안전·특이사항, 다음 작업 계획을 확인합니다. |
| 공정 분석 | 공정 진행률, 지연 위험, 일정 편차, 변경 및 승인 이력을 확인하여 공정 지연 원인을 파악합니다. |

</details>

<details open>
<summary><strong>👷 투입 관리</strong></summary>
<br/>

현장 근무자와 작업구역별 인력 배치를 관리하는 화면입니다.

| 기능 | 설명 |
| :--- | :--- |
| 근무자 관리 | 현장 근무자의 기본 정보, 소속, 역할, 투입 현장, 상태 정보를 조회하고 관리합니다. |
| 인력 배치 | 작업구역별 근무자 배치 현황을 확인하고, 필요한 인력을 배치하거나 확정·초기화합니다. |

</details>

<details open>
<summary><strong>🌦️ 현장 정보</strong></summary>
<br/>

현장의 날씨, 장비, 게이트 정보를 기반으로 작업 위험과 장비 투입 현황을 관리하는 화면입니다.

| 기능 | 설명 |
| :--- | :--- |
| 기상 관제 | 온도, 강수확률, 풍속, 미세먼지 정보를 확인하고, 작업지시와 중장비 투입 현황을 기반으로 AI 위험 통제 추천과 현장 즉시 조치 체크리스트를 조회합니다. |
| 장비 입출차 | 공사현장 도면을 기준으로 게이트 위치와 중장비 투입 현황을 확인하고, 작업지시에 따라 투입 예정인 장비의 종류와 대수를 관리합니다. |

</details>

<details>
<summary><strong>📄 문서 관리</strong></summary>
<br/>

| 기능 | 설명 |
| :--- | :--- |
| 업로드 문서 | 공사 관련 문서와 파일을 업로드하고, 현장 운영 및 일정 관리에 필요한 자료를 관리합니다. |

</details>

<details>
<summary><strong>🔐 시스템 관리</strong></summary>
<br/>

| 기능 | 설명 |
| :--- | :--- |
| 계정 및 권한 관리 | 본사 및 현장 계정을 생성·수정하고, 사용자 권한과 소속 현장을 관리합니다. |
| 현장 관리 | 신규 공사현장을 등록하고, 시스템에서 관리할 현장 정보를 설정합니다. |

</details>

</details>

---

<a id="03-기술-스택"></a>
<details>
<summary><h2>03. 🛠️ 기술 스택</h2></summary>

DnDn Frontend는 Vue.js 기반 SPA로 구현되었으며, 백엔드 API와 연동하여 공정계획, 작업지시, 공사일보, 인력 배치, 장비 입출차, 기상 관제, ESG 대시보드 화면을 제공합니다.

### Frontend

| 분류 | 기술 |
| :--- | :--- |
| Core | ![Vue.js](https://img.shields.io/badge/Vue.js-4FC08D?style=flat-square&logo=vue.js&logoColor=white) ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black) |
| Build Tool | ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white) |
| API Client | ![Axios](https://img.shields.io/badge/Axios-5A29E4?style=flat-square&logo=axios&logoColor=white) |
| UI / Icons | ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white) ![Lucide](https://img.shields.io/badge/Lucide_Icons-111827?style=flat-square) |
| Visualization | ![Dashboard](https://img.shields.io/badge/Dashboard_UI-0F172A?style=flat-square) ![Chart](https://img.shields.io/badge/Chart_View-2563EB?style=flat-square) |

### Backend API 연동

| 분류 | 기술 |
| :--- | :--- |
| Backend | ![Java 17](https://img.shields.io/badge/Java_17-007396?style=flat-square&logo=openjdk&logoColor=white) ![Spring Boot](https://img.shields.io/badge/Spring_Boot-6DB33F?style=flat-square&logo=springboot&logoColor=white) |
| Security | ![Spring Security](https://img.shields.io/badge/Spring_Security-6DB33F?style=flat-square&logo=springsecurity&logoColor=white) |
| ORM | ![Spring Data JPA](https://img.shields.io/badge/Spring_Data_JPA-6DB33F?style=flat-square&logo=hibernate&logoColor=white) |
| API Docs | ![Swagger](https://img.shields.io/badge/Swagger-85EA2D?style=flat-square&logo=swagger&logoColor=black) |

### Data / External API

| 분류 | 기술 |
| :--- | :--- |
| Database | ![MariaDB](https://img.shields.io/badge/MariaDB-003545?style=flat-square&logo=mariadb&logoColor=white) |
| Cache / Lock | ![Redis Sentinel](https://img.shields.io/badge/Redis_Sentinel-DC382D?style=flat-square&logo=redis&logoColor=white) ![Redisson](https://img.shields.io/badge/Redisson-DC382D?style=flat-square&logo=redis&logoColor=white) |
| Storage | ![AWS S3](https://img.shields.io/badge/AWS_S3-569A31?style=flat-square&logo=amazons3&logoColor=white) |
| Weather API | ![KMA](https://img.shields.io/badge/KMA_Weather_API-2F80ED?style=flat-square) ![AirKorea](https://img.shields.io/badge/AirKorea_API-00A3E0?style=flat-square) |
| AI API | ![OpenAI](https://img.shields.io/badge/OpenAI_API-412991?style=flat-square&logo=openai&logoColor=white) |

### Infrastructure / DevOps

| 분류 | 기술 |
| :--- | :--- |
| Container | ![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white) |
| Orchestration | ![Kubernetes](https://img.shields.io/badge/Kubernetes-326CE5?style=flat-square&logo=kubernetes&logoColor=white) |
| CI/CD | ![Jenkins](https://img.shields.io/badge/Jenkins-D24939?style=flat-square&logo=jenkins&logoColor=white) |
| Gateway | ![Nginx Ingress](https://img.shields.io/badge/Nginx_Ingress-009639?style=flat-square&logo=nginx&logoColor=white) |
| Deployment | ![Blue Green](https://img.shields.io/badge/Blue--Green_Deployment-brightgreen?style=flat-square) |
| Monitoring | ![Prometheus](https://img.shields.io/badge/Prometheus-E6522C?style=flat-square&logo=prometheus&logoColor=white) ![Grafana](https://img.shields.io/badge/Grafana-F46800?style=flat-square&logo=grafana&logoColor=white) ![Kiali](https://img.shields.io/badge/Kiali-1F80E0?style=flat-square) |
| Storage Class | ![Longhorn](https://img.shields.io/badge/Longhorn-FFB000?style=flat-square&logo=linuxfoundation&logoColor=white) |

### Collaboration

| 분류 | 기술 |
| :--- | :--- |
| Version Control | ![Git](https://img.shields.io/badge/Git-F05032?style=flat-square&logo=git&logoColor=white) ![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white) |
| API Test | ![Postman](https://img.shields.io/badge/Postman-FF6C37?style=flat-square&logo=postman&logoColor=white) |
| Design / Docs | ![Figma](https://img.shields.io/badge/Figma-F24E1E?style=flat-square&logo=figma&logoColor=white) ![Notion](https://img.shields.io/badge/Notion-000000?style=flat-square&logo=notion&logoColor=white) |
| Communication | ![Discord](https://img.shields.io/badge/Discord-5865F2?style=flat-square&logo=discord&logoColor=white) |

</details>

---

<a id="04-시스템-아키텍처"></a>
<details>
<summary><h2>04. 🏗️ 시스템 아키텍처</h2></summary>

<img width="1611" height="1181" alt="dndn 시스템 아키텍처 drawio" src="https://github.com/user-attachments/assets/faf39b0b-aacf-454a-8e34-906e92b36e78" />

</details>

---

<a id="05-프로젝트-구조"></a>
<details>
<summary><h2>05. 🗂️ 프로젝트 구조</h2></summary>

DnDn Frontend는 사이드바 메뉴 구조에 맞춰 화면 단위를 분리했습니다.  
각 화면은 `views` 하위에서 업무 영역별로 관리하며, API 호출 로직은 `api`, 공통 변환·계산 로직은 `utils`, 화면 공통 컴포넌트는 `components`로 분리했습니다.

```text
src
├─ api
│  ├─ index.js
│  ├─ weather.js
│  ├─ workOrder.js
│  └─ ...
│
├─ components
│  ├─ esg
│  ├─ weather
│  ├─ gate
│  └─ ...
│
├─ utils
│  ├─ esg
│  ├─ weatherControlMapper.js
│  └─ ...
│
├─ views
│  ├─ schedule
│  │  ├─ EsgDashboardView.vue
│  │  ├─ ScheduleChartView.vue
│  │  ├─ WorkPlanView.vue
│  │  ├─ WorkInstructionView.vue
│  │  ├─ DailyWorkReportView.vue
│  │  └─ AnalysisView.vue
│  │
│  ├─ deployment
│  │  ├─ WorkerManagementView.vue
│  │  ├─ WorkerProfileDetailView.vue
│  │  └─ StaffingBoardView.vue
│  │
│  ├─ siteInfo
│  │  ├─ WeatherControlView.vue
│  │  └─ HeavyEquipmentGateView.vue
│  │
│  ├─ document
│  │  ├─ FirstDocumentUpload.vue
│  │  └─ DocumentUploadView.vue
│  │
│  └─ system
│     ├─ LoginView.vue
│     ├─ AccountPasswordView.vue
│     ├─ SiteRegisterView.vue
│     └─ AccountListView.vue
│
└─ router
   └─ index.js
```

### 폴더 구성 기준

| 구분 | 설명 |
| :--- | :--- |
| `views/schedule` | ESG 대시보드, 공정표, 공정계획, 작업지시, 공사일보, 공정 분석 등 일정 관리 화면 |
| `views/deployment` | 근무자 관리, 작업자 상세, 인력 배치 등 투입 관리 화면 |
| `views/siteInfo` | 기상 관제, 장비 입출차 등 현장 정보 관리 화면 |
| `views/document` | 문서 업로드 및 문서 관리 화면 |
| `views/system` | 로그인, 계정 관리, 현장 등록 등 시스템 관리 화면 |
| `components` | ESG, 기상, 장비 입출차 등 화면별 재사용 컴포넌트 |
| `api` | 백엔드 API 요청 함수 분리 |
| `utils` | 화면 표시용 데이터 변환, 점수 계산, 위험 문구 생성 등 공통 로직 분리 |

</details>

---

<a id="06-상세-서비스-화면"></a>
<details>
<summary><h2>06. 🖥️ 상세 서비스 화면</h2></summary>

주요 서비스 화면은 기능별로 접어서 확인할 수 있도록 구성했습니다.

<details>
<summary><strong>📅 일정 관리</strong></summary>
<br/>
<a href="#">일정 관리 서비스 화면 바로가기</a>

### ESG 대시보드

ESG 대시보드 화면에서는 선택한 공사현장과 작업구역별 ESG 점수 및 세부 성과를 확인할 수 있습니다.  
사용자는 ESG 순위, 점수 분해, 주간 미션, 환경 리스크와 개선 필요 항목을 한눈에 조회할 수 있으며, 운영 데이터 반영에 따른 현장 개선 상태를 파악할 수 있습니다.

### 전체 공정표

전체 공정표 화면에서는 공사 현장의 전체 작업 일정과 공정 진행 현황을 조회할 수 있습니다.  
사용자는 공정별 시작일과 종료일, 진행률, 주요 일정 변동 사항을 한눈에 확인할 수 있으며, 계획 대비 실제 공정 흐름을 비교해 일정 지연 여부를 파악할 수 있습니다.

### 공정 계획

공정계획 화면에서는 공사 현장의 연간·월간·주간 작업 일정을 조회할 수 있습니다.  
사용자는 공종별 계획 일정과 진행 구간을 확인하고, 세부 계획서 작성 및 계획서 업로드를 통해 현장 공정 계획을 관리할 수 있습니다.

### 작업 지시

작업 지시서 화면에서는 공종별 책임자와 현장 총 책임자가 작업지시 현황을 조회하고 관리할 수 있습니다.  
사용자는 작업 기간, 작업 구역, 공종, 투입 장비, 승인 상태를 확인하고, 필요한 경우 작업지시서를 등록하여 현장 작업을 요청할 수 있습니다.

### 공사 일보

공사일보 화면에서는 공사 현장의 일일 작업 보고 현황을 조회할 수 있습니다.  
사용자는 기준 일자별 공사일보 제출 상태, 작업 진행 내용, 안전·특이사항, 다음 작업 계획 등을 확인할 수 있으며, 필요한 경우 공사일보를 PDF로 다운로드할 수 있습니다.

### 공정 분석

공정 분석 화면에서는 공사 현장의 공정별 진행 상태와 지연 위험을 조회할 수 있습니다.  
사용자는 지연 예상 작업, 일정 편차, 진행률, 지연 사유, 변경 및 승인 이력을 확인하여 공정 지연 원인을 파악할 수 있습니다.

</details>

<details>
<summary><strong>👷 투입 관리</strong></summary>
<br/>

### 근무자 관리

근무자 관리 화면에서는 현장에 등록된 작업자 정보를 조회하고 관리할 수 있습니다.  
사용자는 작업자의 기본 정보, 소속, 직무, 투입 현장, 배치 상태 등을 확인하고, 현장 인력 운영에 필요한 작업자 정보를 관리할 수 있습니다.

### 인력 배치

인력 배치 화면에서는 작업구역별 근무자 배치 현황을 조회하고 관리할 수 있습니다.  
사용자는 배치된 인력의 이름, 역할, 근무 구역, 배치 상태를 확인할 수 있으며, 필요한 경우 배치 확정 및 초기화를 통해 작업구역별 인력 투입을 관리할 수 있습니다.

</details>

<details>
<summary><strong>🌦️ 현장 정보</strong></summary>
<br/>

### 기상 관제

기상 관제 화면에서는 기준 일자의 날씨와 현장 작업 위험 요소를 함께 조회할 수 있습니다.  
사용자는 온도, 강수확률, 풍속, 미세먼지 등 기상 정보를 확인하고, 작업지시와 중장비 투입 현황을 기반으로 도출된 AI 위험 통제 추천과 현장 즉시 조치 항목을 확인할 수 있습니다.

### 장비 입출차

장비 입출차 관리 화면에서는 공사현장의 중장비 투입 현황과 게이트별 입출차 상태를 조회할 수 있습니다.  
사용자는 현장 도면을 기준으로 게이트 위치와 장비 배정 정보를 확인하고, 작업지시에 따라 투입 예정인 중장비의 종류, 대수, 출입 상태를 관리할 수 있습니다.

</details>

<details>
<summary><strong>📄 문서 / 시스템 관리</strong></summary>
<br/>

### 문서 관리

문서 관리 화면에서는 공사 관련 문서와 파일을 업로드하고 관리할 수 있습니다.  
사용자는 현장 운영에 필요한 문서를 등록하고, 업로드된 문서를 일정 관리 및 현장 관리 업무에 활용할 수 있습니다.

### 계정 및 현장 관리

계정 및 현장 관리 화면에서는 본사 및 현장 사용자 계정과 공사현장 정보를 관리할 수 있습니다.  
관리자는 신규 계정을 생성하거나 기존 계정 정보를 수정할 수 있으며, 신규 공사현장을 등록하여 시스템에서 관리할 현장 정보를 설정할 수 있습니다.

</details>

</details>

---

<a id="07-프론트엔드-구현-포인트"></a>
<details>
<summary><h2>07. 🧩 프론트엔드 구현 포인트</h2></summary>

DnDn Frontend는 단순히 화면만 나누는 방식이 아니라, 실제 건설 현장 업무 흐름에 맞춰 `views`, `components`, `api`, `utils`를 역할별로 분리했습니다.

<details>
<summary><strong>1. 사이드바 메뉴 기준 화면 구조 분리</strong></summary>
<br/>

프론트엔드는 사이드바 메뉴 구조에 맞춰 주요 화면을 업무 영역별로 분리했습니다.

```text
src/views
├─ schedule      # 일정 관리
├─ deployment    # 투입 관리
├─ siteInfo      # 현장 정보
├─ document      # 문서 관리
└─ system        # 시스템 관리
```

이를 통해 일정 관리, 투입 관리, 현장 정보, 문서 관리, 시스템 관리 화면이 명확하게 분리되도록 구성했습니다.

</details>

<details>
<summary><strong>2. 화면별 컴포넌트 분리</strong></summary>
<br/>

ESG 대시보드, 기상 관제, 장비 입출차처럼 화면 안에서 반복적으로 사용되는 UI는 `components` 하위로 분리했습니다.

```text
src/components
├─ esg
├─ weather
├─ gate
└─ ...
```

각 화면은 필요한 컴포넌트를 조합하여 구성하고, 화면 자체는 데이터 흐름과 상태 관리에 집중하도록 설계했습니다.

</details>

<details>
<summary><strong>3. API 호출 로직 분리</strong></summary>
<br/>

백엔드 API 호출은 화면 안에 직접 작성하지 않고 `src/api` 하위 파일로 분리했습니다.

```text
src/api
├─ weather.js
├─ workOrder.js
├─ index.js
└─ ...
```

이를 통해 화면 컴포넌트에서는 API 호출 함수를 가져와 사용하고, 실제 요청 경로와 파라미터 처리는 API 파일에서 관리하도록 구성했습니다.

</details>

<details>
<summary><strong>4. 작업지시 기반 화면 연동</strong></summary>
<br/>

DnDn의 주요 화면은 작업지시 데이터를 중심으로 연결됩니다.

```text
작업지시
  ├─ 장비 입출차
  ├─ 기상 관제
  └─ ESG 대시보드
```

작업지시에 포함된 작업 위치, 작업 내용, 투입 장비 정보는 장비 입출차 화면에서 게이트별 장비 현황으로 표시되고, 기상 관제 화면에서는 날씨와 비교하여 위험 작업과 위험 장비를 판단하는 기준으로 사용됩니다.

또한 ESG 대시보드에서는 작업지시와 장비 투입 현황을 기반으로 작업구역별 ESG 점수 계산에 반영합니다.

</details>

<details>
<summary><strong>5. 화면 표시용 데이터 가공 로직 분리</strong></summary>
<br/>

화면에서 바로 사용하기 어려운 원본 데이터는 `utils`에서 화면 표시용 데이터로 변환합니다.

```text
src/utils
├─ weatherControlMapper.js
├─ esg
└─ ...
```

예를 들어 기상 관제 화면에서는 날씨 데이터, 작업지시, 장비 정보를 조합해 현장 즉시 조치 체크리스트와 AI 위험 통제 추천 항목을 구성합니다.

ESG 대시보드에서는 작업지시, 기상, 공사일보, 인력 배치, 민원 입력값을 조합해 작업구역별 점수와 카드 데이터를 생성합니다.

</details>

<details>
<summary><strong>6. 현장별 도면 및 게이트 표시</strong></summary>
<br/>

장비 입출차 화면은 공사현장별 도면을 기준으로 게이트 위치와 장비 투입 현황을 표시합니다.

도면은 공사현장 단위로 관리되며, 작업지시 기반 장비 데이터는 게이트별로 집계되어 화면에 표시됩니다.

이를 통해 사용자는 현장 도면 위에서 게이트 위치와 중장비 투입 상태를 직관적으로 확인할 수 있습니다.

</details>

<details>
<summary><strong>7. 반응형 화면 구성</strong></summary>
<br/>

기상 관제, ESG 대시보드, 장비 입출차 화면은 카드형 UI와 대시보드형 레이아웃을 사용합니다.

화면 크기에 따라 정보가 뭉개지지 않도록 카드 배치, 텍스트 줄바꿈, 패널 높이, 스크롤 영역을 조정하여 다양한 화면 크기에서도 주요 정보가 유지되도록 구성했습니다.

</details>

</details>

---

<a id="08-기술-문서"></a>
<details>
<summary><h2>08. 📚 기술 문서</h2></summary>

프론트엔드 화면 구현과 주요 기능 연동 흐름을 기준으로 기술 문서를 분리했습니다.  
각 항목은 기능별 설계 의도와 화면 연동 구조를 정리하기 위한 문서입니다.

<details>
<summary><strong>📅 공정 / 작업지시 / 공사일보</strong></summary>
<br/>

| 문서 | 핵심 내용 |
| :--- | :--- |
| 공정계획 화면 구조 | 연간·월간·주간 공정계획 화면 구성 및 일정 표시 방식 |
| 작업지시 화면 흐름 | 공종별 책임자 작업지시 등록, 현장 총 책임자 승인 상태 조회 흐름 |
| 공사일보 화면 구조 | 기준 일자별 공사일보 조회, 작업 내용, 특이사항, 다음 작업 계획 표시 |
| 공정 분석 화면 구조 | 지연 위험 작업, 일정 편차, 변경 및 승인 이력 표시 방식 |

</details>

<details>
<summary><strong>🌦️ 기상 관제</strong></summary>
<br/>

| 문서 | 핵심 내용 |
| :--- | :--- |
| 기상 관제 화면 구조 | 온도, 강수확률, 풍속, 미세먼지 카드 구성 |
| 현장 즉시 조치 체크리스트 | 작업지시가 없어도 당일 날씨 기준으로 위험 항목을 제안하는 구조 |
| AI 위험 통제 추천 | 실제 작업지시와 중장비 투입 현황을 날씨와 비교하여 위험 작업·장비를 표시하는 구조 |
| 기상 데이터 매핑 | 백엔드 기상 응답을 화면 표시용 데이터로 변환하는 방식 |

</details>

<details>
<summary><strong>🌱 ESG 대시보드</strong></summary>
<br/>

| 문서 | 핵심 내용 |
| :--- | :--- |
| ESG 대시보드 화면 구조 | 현장 ESG 점수, 작업구역별 점수 분해, 주간 미션, 순위 표시 |
| 작업구역별 점수 구성 | 세척장, 민원구역, 작업구역별 다른 평가 항목 적용 방식 |
| ESG 데이터 매핑 | 작업지시, 기상, 공사일보, 인력 배치, 민원 입력값을 화면 데이터로 변환 |
| ESG 0점 시작 기준 | 운영 데이터가 없는 구역은 점수가 자동으로 생성되지 않도록 처리한 기준 |

</details>

<details>
<summary><strong>🚧 장비 입출차</strong></summary>
<br/>

| 문서 | 핵심 내용 |
| :--- | :--- |
| 도면 기반 게이트 관리 | 공사현장별 도면 조회 및 게이트 위치 표시 |
| 작업지시 기반 장비 조회 | `/work-order/gate-equipments` 응답을 사용한 장비 투입 현황 표시 |
| 게이트별 장비 집계 | 동일 게이트 내 장비 종류와 대수를 합산해 표시하는 방식 |
| 도면 저장 구조 | 현장별 도면이 새로고침이나 데이터 초기화 후에도 유지되도록 관리하는 방식 |

</details>

<details>
<summary><strong>👷 인력 배치 / 근무자 관리</strong></summary>
<br/>

| 문서 | 핵심 내용 |
| :--- | :--- |
| 근무자 관리 화면 | 작업자 기본 정보, 소속, 역할, 상태 조회 화면 |
| 인력 배치 화면 | 작업구역별 인력 배치 현황 및 배치 대상 선택 구조 |
| 배치 확정 / 초기화 | 배치 확정 모달과 초기화 모달의 화면 흐름 |

</details>

<details>
<summary><strong>📄 문서 / 계정 / 현장 관리</strong></summary>
<br/>

| 문서 | 핵심 내용 |
| :--- | :--- |
| 문서 업로드 화면 | 공사 관련 문서 업로드 및 관리 화면 |
| 공사일보 PDF 다운로드 | 기준 일자별 공사일보 PDF 다운로드 흐름 |
| 계정 관리 화면 | 본사 및 현장 사용자 계정 생성·수정 화면 |
| 현장 등록 화면 | 신규 공사현장 등록 및 관리 화면 |

</details>

</details>

---

<a id="09-트러블슈팅"></a>
<details>
<summary><h2>09. 🐞 트러블슈팅</h2></summary>

프론트엔드 개발 중 발생한 주요 문제와 해결 과정을 정리했습니다.

<details>
<summary><strong>1. ESG 대시보드 새로고침 시 화면 오류</strong></summary>
<br/>

### 문제

ESG 대시보드 화면에서 새로고침 시 mapper 함수가 정의되지 않아 화면 렌더링이 중단되는 문제가 발생했습니다.

```text
ReferenceError: reportMatchesAny is not defined
```

### 원인

ESG 대시보드에서 공사일보 데이터를 기반으로 세척장·민원구역·작업구역 데이터를 판별하는 과정에서 `reportMatchesAny` 함수 호출은 있었지만 실제 함수 정의가 누락되어 있었습니다.

### 해결

`src/utils/esg/esgDashboardMapper.js`에 누락된 report matching 함수를 추가하여 공사일보 키워드 판별 로직이 정상 동작하도록 수정했습니다.

### 결과

- 새로고침 시 ESG 대시보드 렌더링 오류 해결
- 세척장, 민원구역, 작업구역별 점수 분해 카드 정상 표시
- 운영 데이터가 없는 구역은 0점 기준으로 시작하도록 보정

</details>

<details>
<summary><strong>2. 기상 관제 체크리스트와 AI 위험 추천 문구 중복</strong></summary>
<br/>

### 문제

기상 관제 화면에서 `현장 즉시 조치 체크리스트`와 `AI 위험 통제 추천`이 비슷한 위험 문구를 반복해서 보여주는 문제가 있었습니다.

### 원인

두 영역의 역할이 명확히 분리되지 않아, 실제 작업지시 기반 위험과 날씨 기준 공통 위험이 같은 영역에 섞여 표시되었습니다.

### 해결

```text
현장 즉시 조치 체크리스트
→ 작업지시가 없어도 당일 날씨 기준으로 확인해야 할 공통 위험 항목 표시

AI 위험 통제 추천
→ 실제 작업지시와 중장비 투입 현황을 날씨와 비교해 상세 위험 항목 표시
```

### 결과

- 체크리스트는 날씨 기준 공통 안전 확인 항목 중심으로 표시
- AI 위험 통제 추천은 실제 작업지시·장비·날씨 비교 결과 중심으로 표시
- 중복 문구를 줄이고 화면 가독성 개선

</details>

<details>
<summary><strong>3. 장비 입출차 도면 초기화 문제</strong></summary>
<br/>

### 문제

장비 입출차 화면에서 사이트 데이터를 초기화하거나 새로고침할 경우, 사용자가 업로드한 도면이 기본 도면으로 되돌아가는 문제가 있었습니다.

### 원인

도면이 브라우저 localStorage 중심으로 관리되면서, 공사현장별 도면 데이터가 안정적으로 유지되지 않았습니다.

### 해결

```text
공사현장 선택
  ↓
서버에서 해당 현장의 도면 조회
  ↓
도면 위에 게이트 위치 및 장비 투입 현황 표시
```

### 결과

- 공사현장별 도면 유지
- 새로고침 후에도 업로드한 도면 표시
- 장비 입출차 화면에서 도면 기반 게이트 관리 가능

</details>

<details>
<summary><strong>4. 게이트별 장비 수량 중복 표시 문제</strong></summary>
<br/>

### 문제

작업지시에 여러 대의 장비가 등록되었을 때, 동일 게이트가 장비 수량만큼 중복 표시될 가능성이 있었습니다.

### 원인

작업지시 장비 데이터를 화면에서 그대로 나열할 경우, 동일 게이트에 여러 장비가 들어오는 상황에서 UI가 중복되어 보일 수 있었습니다.

### 해결

`/work-order/gate-equipments` 응답을 기준으로 게이트별 장비를 집계하여 표시하도록 구성했습니다.

```text
게이트 1
  ├─ DUMP_TRUCK 2대
  ├─ EXCAVATOR 1대
  └─ CRANE 1대
```

### 결과

- 동일 게이트가 중복 생성되지 않음
- 게이트 안에서 장비 종류와 대수 합산
- 작업지시 기반 장비 투입 현황을 직관적으로 표시

</details>

<details>
<summary><strong>5. 대시보드 화면 반응형 깨짐 문제</strong></summary>
<br/>

### 문제

기상 관제, ESG 대시보드, 장비 입출차 화면에서 화면 크기나 배율에 따라 카드 높이와 텍스트 영역이 어색하게 벌어지는 문제가 있었습니다.

### 원인

대시보드형 화면에서 카드와 패널이 고정 높이 중심으로 배치되어, 브라우저 크기 변화에 따라 일부 영역의 여백이 과하게 생기거나 텍스트가 뭉개졌습니다.

### 해결

- 카드 내부 여백 조정
- 텍스트 줄바꿈 처리
- 패널 높이 및 스크롤 영역 조정
- 좌우 영역 높이 균형 조정
- 화면 크기에 따른 레이아웃 전환 보정

### 결과

- 다양한 화면 크기에서 주요 정보 유지
- 기상 카드, AI 추천 패널, ESG 카드의 가독성 개선
- 대시보드 화면의 시각적 안정성 향상

</details>

<details>
<summary><strong>6. 기상특보와 풍속 표시가 충돌하는 문제</strong></summary>
<br/>

### 문제

기상영향도 카드에서는 풍속이 낮게 표시되는데, 동시에 강풍주의보가 표시되어 사용자에게 모순처럼 보이는 문제가 있었습니다.

### 원인

풍속 수치와 기상특보 데이터가 서로 다른 기준으로 표시되었지만, UI에서 두 정보를 연결해 설명하지 못했습니다.

### 해결

상단 날씨 카드는 빠른 기상 확인 용도로 유지하고, 특보 정보는 짧은 라벨 형태로만 표시하도록 정리했습니다.

```text
풍속
→ 3.1m/s

특보
→ 강풍주의보
```

### 결과

- 긴 설명 문구 제거
- 날씨 카드 가독성 개선
- 기상특보 정보는 필요한 수준으로만 표시

</details>

</details>

---

<a id="10-시연-영상"></a>
<details>
<summary><h2>10. 🎬 시연 영상</h2></summary>

화면 기준으로 주요 사용 시나리오를 정리했습니다.  
각 항목은 기능별 시연 영상 또는 GIF를 추가할 수 있도록 구성했습니다.

<details>
<summary><strong>1. 로그인 및 현장 선택</strong></summary>
<br/>

| 화면 | 설명 | 영상 |
| :--- | :--- | :--- |
| 로그인 | 관리자 및 본사 계정으로 로그인 | 준비 중 |
| 현장 선택 | 조회할 공사현장을 선택한 후 해당 현장 관리 화면으로 진입 | 준비 중 |

</details>

<details>
<summary><strong>2. 일정 관리</strong></summary>
<br/>

| 화면 | 설명 | 영상 |
| :--- | :--- | :--- |
| 전체 공정표 | 전체 공사 일정과 공정 진행 현황 조회 | 준비 중 |
| 공정 계획 | 연간·월간·주간 공정계획 조회 및 세부 계획 관리 | 준비 중 |
| 작업 지시 | 공종별 작업지시 등록 및 승인 상태 조회 | 준비 중 |
| 공사 일보 | 일일 작업 보고 현황 조회 및 PDF 다운로드 | 준비 중 |
| 공정 분석 | 지연 위험 작업, 일정 편차, 변경 이력 조회 | 준비 중 |
| ESG 대시보드 | 현장 및 작업구역별 ESG 점수와 순위 조회 | 준비 중 |

</details>

<details>
<summary><strong>3. 투입 관리</strong></summary>
<br/>

| 화면 | 설명 | 영상 |
| :--- | :--- | :--- |
| 근무자 관리 | 현장 근무자 정보 및 배치 상태 조회 | 준비 중 |
| 인력 배치 | 작업구역별 인력 배치, 확정, 초기화 | 준비 중 |

</details>

<details>
<summary><strong>4. 현장 정보</strong></summary>
<br/>

| 화면 | 설명 | 영상 |
| :--- | :--- | :--- |
| 기상 관제 | 날씨와 작업지시를 비교한 AI 위험 통제 추천 확인 | 준비 중 |
| 장비 입출차 | 도면 기반 게이트별 중장비 투입 현황 관리 | 준비 중 |

</details>

<details>
<summary><strong>5. 문서 관리</strong></summary>
<br/>

| 화면 | 설명 | 영상 |
| :--- | :--- | :--- |
| 문서 업로드 | 공사 관련 문서 업로드 및 관리 | 준비 중 |
| 공사일보 PDF | 기준 일자별 공사일보 PDF 다운로드 | 준비 중 |

</details>

<details>
<summary><strong>6. 시스템 관리</strong></summary>
<br/>

| 화면 | 설명 | 영상 |
| :--- | :--- | :--- |
| 계정 관리 | 본사 및 현장 사용자 계정 생성·수정 | 준비 중 |
| 현장 등록 | 신규 공사현장 등록 및 관리 | 준비 중 |

</details>

</details>

---

<a id="11-무중단-배포-전략-bluegreen"></a>
<details>
<summary><h2>11. 🚀 무중단 배포 전략 (Blue/Green)</h2></summary>

건설 현장의 실시간 공정 관리 및 공사일보 작성을 지원하는 **dndn** 서비스의 고가용성을 위해 **Blue/Green 무중단 배포** 방식을 채택하였습니다.  
이를 통해 새로운 기능 배포 중에도 현장 업무의 연속성을 완벽하게 보장합니다.

<details>
<summary>🎬 Sequence.01.mp4</summary>
<br />

| 무중단 배포 전환 테스트 |
| :--- |
| <video src="https://github.com/user-attachments/assets/cce7ef7b-47be-46a5-b4a5-2defe1740e63" width="100%" controls></video> |

</details>

#### 1. 도입 배경

- **업무 연속성 보장:** 공사일보 작성 및 작업 지시서(Work Order) 전달 중 서비스가 중단되면 데이터 유실 및 현장 혼선이 발생할 수 있습니다.
- **Zero Downtime:** 다수의 현장 관계자가 실시간으로 접속하므로 배포를 위한 다운타임을 허용하지 않습니다.

#### 2. 동작 프로세스

1. **배포 준비:** 현재 운영 중인 슬롯(**Green**)은 실시간 트래픽을 처리합니다.
2. **신규 배포:** 새 버전의 애플리케이션을 비활성 슬롯(**Blue**)에 배포합니다.
3. **검증 및 전환:** **Blue** 슬롯의 헬스체크(Health Check)가 성공하면, Service(Load Balancer)가 트래픽을 **Blue**로 즉시 전환합니다.
4. **자원 최적화:** 전환이 완료된 후 이전 슬롯(**Green**)은 자동으로 스케일 다운(Scale down)되어 자원을 회수합니다.

#### 3. 검증 결과

- **Backend 무중단 전환 검증:** 배포 과정 중 서비스 중단 여부를 확인하기 위해 `curl` 명령어를 0.1초 간격으로 반복 호출하여 응답 상태를 모니터링했습니다.
- **결과:** 신규 버전 배포 및 전환 시점에도 유실 없이 정상 응답 확인

</details>

---

<a id="12-실행-방법"></a>
<details>
<summary><h2>12. ▶️ 실행 방법</h2></summary>

DnDn Frontend는 Vite 기반 Vue.js 프로젝트입니다.  
로컬 환경에서 실행하기 위해서는 Node.js와 npm이 필요합니다.

### 1. 프로젝트 클론

```bash
git clone https://github.com/beyond-sw-camp/be24-fin-Intelli_J-DnDn-FE.git
cd be24-fin-Intelli_J-DnDn-FE
```

### 2. 패키지 설치

```bash
npm install
```

### 3. 환경 변수 설정

프로젝트 루트 경로에 `.env` 파일을 생성하고 백엔드 API 주소를 설정합니다.

```env
VITE_API_BASE_URL=http://localhost:8080
```

배포 환경에서는 운영 API 주소에 맞게 설정합니다.

```env
VITE_API_BASE_URL=https://api.dndn24.kro.kr
```

### 4. 개발 서버 실행

```bash
npm run dev
```

실행 후 브라우저에서 아래 주소로 접속합니다.

```text
http://localhost:5173
```

### 5. 프로덕션 빌드

```bash
npm run build
```

### 6. 빌드 결과 미리보기

```bash
npm run preview
```

### 참고

- 프론트엔드는 백엔드 API 서버와 연동되어 동작합니다.
- 로그인, 작업지시, 공사일보, 기상 관제, 장비 입출차, ESG 대시보드 등 주요 화면은 백엔드 서버와 DB가 실행 중이어야 정상 조회됩니다.
- `.env` 파일은 민감 정보가 포함될 수 있으므로 Git에 커밋하지 않습니다.

</details>

---

<a id="13-그-외-산출물"></a>
<details>
<summary><h2>13. 📎 그 외 산출물</h2></summary>

프로젝트 진행 과정에서 작성한 기획, 설계, 화면, 테스트 관련 산출물입니다.  
각 문서는 프로젝트 이해와 유지보수를 돕기 위해 별도로 정리했습니다.

### 프로젝트 문서

| 문서             | 설명                          | 링크                                                                                                                                                        |
|:---------------|:----------------------------|:----------------------------------------------------------------------------------------------------------------------------------------------------------|
| 기획서            | 프로젝트 배경, 목표, 요구사항, 주요 기능 정의 | [기획서 바로 가기](https://docs.google.com/document/d/1sWc9Jkv1IJ1b2f6MWZsRkTO-FRbW_NpE/edit?usp=sharing&ouid=106232743371302790593&rtpof=true&sd=true)          |
| WBS            | 개발 일정, 담당 업무, 진행 계획 정리      | [WBS 바로 가기](https://docs.google.com/spreadsheets/d/1zKD-VeyADUBgm0aWjMegf7iwteayjSAPxC_qzSimDQM/edit?usp=sharing) |
| 요구사항 명세서       | 기능 요구사항 및 비기능 요구사항 정리       | [요구사항 명세서 바로 가기](https://docs.google.com/spreadsheets/d/1fuJQMvBLo1qCz4FHHyBuD-mh7SdobIo3/edit?usp=sharing&ouid=106232743371302790593&rtpof=true&sd=true) |
| 화면 설계서 (Figma) | 프론트엔드 화면 설계 및 UI 구성 설계       | [화면 설계서 (피그마) 바로 가기](https://www.figma.com/design/3qUOzFW9Z5LsfDC3M57mxj/Untitled?t=AWaj1tmgtFtOj7Ns-1)                                                   |

### 설계 산출물

| 문서 | 설명 | 링크            |
| :--- | :--- |:--------------|
| ERD | 주요 도메인 테이블 및 관계 구조 | [위키 주소 작성 예정] |
| 시스템 아키텍처 | 프론트엔드, 백엔드, DB, Redis, Kubernetes 구성도 | [위키 주소 작성 예정] |
| API 명세서 | 프론트엔드와 백엔드 간 API 요청/응답 구조 | [주소 작성 예정]    |
| Redis 설계 문서 | 분산락, 캐시 Key naming, TTL 정책 정리 | [여부 확인]       |

### 테스트 및 운영 산출물

| 문서 | 설명 | 링크 |
| :--- | :--- | :--- |
| 프로그램 사양서 | 주요 기능별 동작 방식 및 처리 흐름 정리 | 준비 중 |
| 단위 테스트 결과서 | 기능별 테스트 결과 및 검증 내용 정리 | 준비 중 |
| 배포 전략 문서 | Jenkins, Docker, Kubernetes 기반 배포 흐름 정리 | 준비 중 |
| 트러블슈팅 문서 | 개발 중 발생한 문제와 해결 과정 정리 | 준비 중 |

### 발표 자료

| 문서 | 설명 | 링크 |
| :--- | :--- | :--- |
| 발표 자료 PDF | 프로젝트 최종 발표 자료 | 준비 중 |
| 시연 영상 | 주요 기능별 화면 시연 영상 | 준비 중 |

</details>

---

<a id="14-회고"></a>
<details>
<summary><h2>14. 💬 회고</h2></summary>

DnDn 프로젝트를 진행하면서 건설 현장의 공정, 작업지시, 공사일보, 인력 배치, 장비 입출차, 기상 관제, ESG 관리가 서로 분리된 기능이 아니라 하나의 현장 운영 흐름으로 연결되어야 한다는 점을 경험했습니다.

각 팀원은 담당 기능을 구현하면서 B2B 서비스에서 중요한 업무 흐름, 데이터 연결성, 사용자 관점의 화면 구성, 운영 환경을 고려한 개발 경험을 쌓을 수 있었습니다.

<details>
<summary><strong>김민규</strong></summary>
<br/>

기상 관제, ESG 대시보드, 장비 입출차 기능을 구현하면서 단순히 데이터를 화면에 보여주는 것보다, 현장 관리자가 어떤 정보를 기준으로 판단해야 하는지 고민하는 과정이 중요하다는 것을 느꼈습니다.

작업지시 데이터를 중심으로 장비 투입 현황, 기상 정보, ESG 점수가 서로 연결되도록 구성하면서 B2B 서비스에서는 개별 기능보다 데이터 흐름과 업무 맥락이 중요하다는 점을 배웠습니다.

또한 Redis 분산락, 스케줄러, 외부 API 연동, 대시보드 반응형 UI를 함께 다루며 실제 운영 환경을 고려한 프론트엔드 개발 경험을 쌓을 수 있었습니다.

</details>

<details>
<summary><strong>이한별</strong></summary>
<br/>

작성 예정

</details>

<details>
<summary><strong>전민주</strong></summary>
<br/>

작성 예정

</details>

<details>
<summary><strong>전성훈</strong></summary>
<br/>

작성 예정

</details>

<details>
<summary><strong>최승우</strong></summary>
<br/>

작성 예정

</details>

</details>
