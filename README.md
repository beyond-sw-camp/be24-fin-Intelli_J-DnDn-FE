# be24-fin-Intelli_J-DnDn-FE

﻿<p align="center">
  <img src="https://github.com/user-attachments/assets/a20ebab8-eb53-4c7f-9ef3-36533e00f3d2" width="100%"/>
  <h3 align="center">24시간 운영되는 DnDn24</h3>
  <p align="center">관리자와 작업자들을 가장 효율적으로 연결하는 건설현장 플랫폼 DnDn을 소개합니다.</p>
</p>

---

## 👥 팀원

<div align="center">

| **김민규** | **이한별** | **전민주** | **전성훈** | **최승우** |
| :---: | :---: | :---: | :---: | :---: |
| <img src="https://avatars.githubusercontent.com/u/244694024?v=4" width="120" style="border-radius:50%"/> | <img src="https://github.com/user-attachments/assets/6ef50d1f-c6b5-4946-acb5-847bd5e552a0" width="120" style="border-radius:50%"/> | <img src="https://github.com/user-attachments/assets/f675522f-6f1f-4644-87fa-b9b0443b975f" width="120" style="border-radius:50%"/> | <img src="https://avatars.githubusercontent.com/u/153381713?s=64&v=4" width="120" style="border-radius:50%"/> | <img src="https://avatars.githubusercontent.com/u/140137784?s=64&v=4" width="120" style="border-radius:50%"/> |
| [@luel1018](https://github.com/luel1018) | [@sole0724](https://github.com/sole0714) | [@minju0077](https://github.com/minju0077) | [@1jshun](https://github.com/1jshun) | [@sw-oo](https://github.com/sw-oo) |

</div>



---

## 📌 목차 (Table of Contents)
### 1. [🔗 바로가기]
### 2. [🔨 기술 스택]
### 3. [⚙️ 시스템 아키텍처]
### 4. [📘 프로젝트 소개]
### 5. [💻 시나리오]

---

## 🔗 바로가기

| 구분             | 링크                                                                              |
|:---------------|:----------------------------------------------------------------------------------|
| **🌐 홈페이지**    | [www.dndn24.kro.kr](https://www.dndn24.kro.kr)                                |
| **📖 API 명세서** | [Swagger UI]                   |
| **📖 상세 설명**   | [DnDn WIKI] |
---

## 🔨️ 기술 스택

### 💻 Development
| Layer | Technologies |
| :--- | :--- |
| **Backend** | ![Java](https://img.shields.io/badge/Java-007396?style=flat-square&logo=java&logoColor=white) ![Spring](https://img.shields.io/badge/Spring-6DB33F?style=flat-square&logo=spring&logoColor=white) ![Spring Security](https://img.shields.io/badge/Spring_Security-6DB33F?style=flat-square&logo=spring-security&logoColor=white) ![JPA](https://img.shields.io/badge/JPA-6DB33F?style=flat-square&logo=hibernate&logoColor=white) |
| **Frontend** | ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black) ![Vue.js](https://img.shields.io/badge/Vue.js-4FC08D?style=flat-square&logo=vue.js&logoColor=white) |
| **Database** | ![MariaDB](https://img.shields.io/badge/MariaDB-003545?style=flat-square&logo=mariadb&logoColor=white) ![Longhorn](https://img.shields.io/badge/Longhorn-FFB000?style=flat-square&logo=linux-foundation&logoColor=white) |
| **External API** | ![AWS S3](https://img.shields.io/badge/AWS_S3-569A31?style=flat-square&logo=amazons3&logoColor=white) ![Portone](https://img.shields.io/badge/Portone-FF6000?style=flat-square&logo=webmoney&logoColor=white) ![OAuth2](https://img.shields.io/badge/OAuth2-EB5424?style=flat-square&logo=auth0&logoColor=white) |

### 🚀 Infrastructure & DevOps
| Category | Technologies |
| :--- | :--- |
| **Orchestration** | ![Kubernetes](https://img.shields.io/badge/Kubernetes-326CE5?style=flat-square&logo=kubernetes&logoColor=white) ![Helm](https://img.shields.io/badge/Helm-0F1628?style=flat-square&logo=helm&logoColor=white) |
| **CI/CD** | ![Jenkins](https://img.shields.io/badge/Jenkins-D24939?style=flat-square&logo=jenkins&logoColor=white) ![Docker](https://img.shields.io/badge/Docker_Registry-2496ED?style=flat-square&logo=docker&logoColor=white) |
| **Deployment** | ![Canary](https://img.shields.io/badge/Canary_Deployment-9cf?style=flat-square) ![BlueGreen](https://img.shields.io/badge/Blue--Green_Deployment-brightgreen?style=flat-square) |
| **Gateway** | ![Nginx Ingress](https://img.shields.io/badge/Nginx_Ingress-009639?style=flat-square&logo=nginx&logoColor=white) |
| **Monitoring** | ![Prometheus](https://img.shields.io/badge/Prometheus-E6522C?style=flat-square&logo=prometheus&logoColor=white) ![Grafana](https://img.shields.io/badge/Grafana-F46800?style=flat-square&logo=grafana&logoColor=white) ![Jaeger](https://img.shields.io/badge/Jaeger-60D0E4?style=flat-square&logo=jaegertracing&logoColor=white) |
| **Tools** | ![Git](https://img.shields.io/badge/Git-F05032?style=flat-square&logo=git&logoColor=white) ![Postman](https://img.shields.io/badge/Postman-FF6C37?style=flat-square&logo=postman&logoColor=white) ![Swagger](https://img.shields.io/badge/Swagger-85EA2D?style=flat-square&logo=swagger&logoColor=black) |

---

## ⚙️ 시스템 아키텍처

---<img width="1611" height="1181" alt="dndn 시스템 아키텍처 drawio" src="https://github.com/user-attachments/assets/faf39b0b-aacf-454a-8e34-906e92b36e78" />


## 📘 프로젝트 소개

DnDn은 작업자들의 상태 및 기타 사항을 반영하여 사고 없이 작업구역에 적절히 자동으로 배치하며, 수많은 사람들을 생성·관리하는 웹 서비스입니다.

사용자는 보다 더 자동화 된 웹 서비스로 편하게 인원들을 관리/조회 할 수 있으며 네~.

또한 기업은 본 서비스를 통해 구직자의 디지털 명함과 포트폴리오를 확인함으로써 지원자의 핵심 역량을 신속하게 파악하고, 이를 기반으로 채용 및 인재 컨택 과정에 활용할 수 있습니다.

---


## 🎥 시연

###  **🧑‍🦱 프론트엔드 시연 영상**

###  **🧑‍🦱 백엔드 API 명세서**

---




### 🛠 무중단 배포 전략 (Blue/Green)

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
