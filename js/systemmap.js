// ─────────────────────────────────────────
//  SYSTEM MAP DATA  —  DevOps Roadmap Plan C v3
//  Represents the production system being built,
//  not the skills being learned.
//  Each node maps back to skill node IDs in NODES.
// ─────────────────────────────────────────

const LAYER_META = {
  source:      { label: 'Source',      color: '#38BDF8', desc: 'Где рождается код' },
  delivery:    { label: 'Delivery',    color: '#34D399', desc: 'Как код становится артефактом' },
  platform:    { label: 'Platform',    color: '#A78BFA', desc: 'Где всё запускается' },
  runtime:     { label: 'Runtime',     color: '#F87171', desc: 'Как приложение живёт в production' },
  observability:{ label: 'Observability', color: '#FFC443', desc: 'Как система наблюдается' },
};

const SYSTEM_NODES = [

  // ── SOURCE ──────────────────────────────────────────
  {
    id: 'sys-workstation',
    layer: 'source',
    label: 'Dev Workstation',
    emoji: '💻',
    x: 520, y: 110,
    title: 'Developer Workstation',
    desc: 'Локальная среда разработки. Docker Desktop, kubectl, terraform CLI, aws CLI.',
    why: 'Инженер работает локально — тестирует, дебажит, запускает контейнеры до push в репозиторий.',
    skills: ['linux', 'terminal', 'docker', 'git'],
    example: 'docker compose up → локальный стек поднят, изменения видны мгновенно'
  },
  {
    id: 'sys-git-repo',
    layer: 'source',
    label: 'Git Repository',
    emoji: '📁',
    x: 700, y: 110,
    title: 'Git Repository',
    desc: 'Центральный источник правды. Branch protection, PR review, merge rules.',
    why: 'Любое изменение инфраструктуры или кода проходит через Git — это аудит-лог и точка интеграции.',
    skills: ['git'],
    example: 'main branch protected: require 1 review + CI green before merge'
  },

  // ── DELIVERY ────────────────────────────────────────
  {
    id: 'sys-ci-pipeline',
    layer: 'delivery',
    label: 'CI Pipeline',
    emoji: '⚙',
    x: 610, y: 270,
    title: 'CI Pipeline',
    desc: 'Автоматический pipeline: lint → test → build → push. Запускается на каждый push.',
    why: 'Без CI каждый деплой — ручная операция с человеческими ошибками. CI — минимальная планка зрелости.',
    skills: ['cicd', 'gh-actions'],
    example: 'GitHub Actions: on push → run pytest → docker build → docker push ECR'
  },
  {
    id: 'sys-docker-image',
    layer: 'delivery',
    label: 'Docker Image',
    emoji: '📦',
    x: 440, y: 270,
    title: 'Docker Image',
    desc: 'Immutable артефакт сборки. Содержит код + зависимости + конфигурацию окружения.',
    why: 'Image = воспроизводимая единица деплоя. Один и тот же image работает локально и в production.',
    skills: ['docker', 'dockerfile'],
    example: 'myapp:sha-a3f8c12 — тег содержит git SHA, деплой воспроизводим'
  },
  {
    id: 'sys-registry',
    layer: 'delivery',
    label: 'Container Registry',
    emoji: '🗃',
    x: 780, y: 270,
    title: 'Container Registry',
    desc: 'Хранилище Docker images. AWS ECR / DockerHub / GHCR. Versioned, access-controlled.',
    why: 'Registry — мост между CI (сборка) и K8s (запуск). Без него нет пути для image в кластер.',
    skills: ['docker', 'cicd', 'iam'],
    example: 'ECR repo: 123456.dkr.ecr.eu-west-1.amazonaws.com/myapp'
  },

  // ── PLATFORM ────────────────────────────────────────
  {
    id: 'sys-cloud-infra',
    layer: 'platform',
    label: 'Cloud Infrastructure',
    emoji: '☁',
    x: 520, y: 440,
    title: 'Cloud Infrastructure',
    desc: 'AWS account: VPC, IAM, EKS/ECS, RDS, S3. Описывается через Terraform.',
    why: 'Инфраструктура как код — любое изменение в Git, review, apply. Нет ручных кликов в консоли.',
    skills: ['terraform', 'tf-modules', 'tf-state', 'aws'],
    example: 'terraform apply → создаёт VPC + EKS cluster + ECR + IAM roles за 8 минут'
  },
  {
    id: 'sys-network',
    layer: 'platform',
    label: 'Network (VPC)',
    emoji: '🌐',
    x: 700, y: 440,
    title: 'Network — VPC & DNS',
    desc: 'VPC: subnets, route tables, NAT Gateway, security groups. CoreDNS внутри кластера.',
    why: 'Сеть определяет что может говорить с чем. Неправильная сеть = incident на production.',
    skills: ['networking', 'dns', 'vpc', 'loadbalancing'],
    example: 'Private subnets для pods, public для ingress. NAT Gateway для outbound из pods'
  },

  // ── RUNTIME ─────────────────────────────────────────
  {
    id: 'sys-k8s-cluster',
    layer: 'runtime',
    label: 'Kubernetes Cluster',
    emoji: '⎈',
    x: 430, y: 610,
    title: 'Kubernetes Cluster',
    desc: 'Control plane + node pool. Scheduler, API server, etcd. EKS в production.',
    why: 'Кластер — операционная система для контейнеров. Планирует, лечит, масштабирует.',
    skills: ['k8s', 'k8s-deploy'],
    example: 'EKS: 3 node group (t3.medium), cluster autoscaler, IRSA для pod IAM'
  },
  {
    id: 'sys-ingress',
    layer: 'runtime',
    label: 'Ingress / Load Balancer',
    emoji: '🚦',
    x: 610, y: 610,
    title: 'Ingress & Load Balancer',
    desc: 'Nginx Ingress Controller + AWS ALB. L7 routing: /api → backend, / → frontend.',
    why: 'Ingress — единая точка входа. Без него каждый сервис требует отдельный LoadBalancer = деньги.',
    skills: ['k8s-ingress', 'loadbalancing', 'aws'],
    example: 'Ingress: host=app.example.com → svc:80, TLS через cert-manager'
  },
  {
    id: 'sys-pods',
    layer: 'runtime',
    label: 'Pods & Services',
    emoji: '🟢',
    x: 790, y: 610,
    title: 'Pods & Services',
    desc: 'Pods = запущенные контейнеры. Services = стабильные DNS имена для групп pods.',
    why: 'Pod умирает — Service переключается на живой. Это self-healing в действии.',
    skills: ['k8s-deploy', 'k8s-storage', 'helm'],
    example: 'Deployment: 3 replicas, readinessProbe, HPA 2–10 pods по CPU'
  },

  // ── OBSERVABILITY ────────────────────────────────────
  {
    id: 'sys-metrics',
    layer: 'observability',
    label: 'Metrics (Prometheus)',
    emoji: '🔥',
    x: 430, y: 780,
    title: 'Metrics — Prometheus',
    desc: 'Time-series метрики. Scrapes endpoints каждые 15s. PromQL для запросов.',
    why: 'Метрики — первое что смотришь при инциденте. Без Prometheus нет SLO.',
    skills: ['prometheus', 'observability'],
    example: 'kube-prometheus-stack: node_exporter + kube-state-metrics + alertmanager'
  },
  {
    id: 'sys-dashboards',
    layer: 'observability',
    label: 'Dashboards (Grafana)',
    emoji: '📈',
    x: 610, y: 780,
    title: 'Dashboards — Grafana',
    desc: 'Визуализация метрик и логов. Дашборды для SRE, алерты для on-call.',
    why: 'Grafana = интерфейс наблюдения системы. Команда видит health системы в одном экране.',
    skills: ['grafana', 'alerting'],
    example: 'Дашборд: error rate, latency p99, pod restarts, node memory — 4 панели'
  },
  {
    id: 'sys-logs',
    layer: 'observability',
    label: 'Logs (Loki)',
    emoji: '📋',
    x: 790, y: 780,
    title: 'Log Aggregation — Loki',
    desc: 'Centralized logs от всех pods. Promtail DaemonSet собирает, LogQL для поиска.',
    why: 'Без централизованных логов — kubectl logs на каждый pod вручную. Loki = поиск за секунды.',
    skills: ['loki', 'observability'],
    example: '{namespace="prod"} |= "ERROR" — все ошибки за последний час'
  },
];

const SYSTEM_EDGES = [
  // Source → Delivery
  ['sys-workstation', 'sys-git-repo'],
  ['sys-git-repo',    'sys-ci-pipeline'],
  ['sys-ci-pipeline', 'sys-docker-image'],
  ['sys-docker-image','sys-registry'],
  // Delivery → Platform
  ['sys-registry',    'sys-cloud-infra'],
  ['sys-cloud-infra', 'sys-network'],
  // Platform → Runtime
  ['sys-cloud-infra', 'sys-k8s-cluster'],
  ['sys-network',     'sys-k8s-cluster'],
  ['sys-network',     'sys-ingress'],
  ['sys-k8s-cluster', 'sys-ingress'],
  ['sys-k8s-cluster', 'sys-pods'],
  ['sys-ingress',     'sys-pods'],
  // Runtime → Observability
  ['sys-pods',        'sys-metrics'],
  ['sys-pods',        'sys-logs'],
  ['sys-metrics',     'sys-dashboards'],
  ['sys-logs',        'sys-dashboards'],
];

// ── Reverse index: skill → system nodes ──────────────
const SKILL_TO_SYSTEM = {};
SYSTEM_NODES.forEach(sn => {
  (sn.skills || []).forEach(skillId => {
    if (!SKILL_TO_SYSTEM[skillId]) SKILL_TO_SYSTEM[skillId] = [];
    SKILL_TO_SYSTEM[skillId].push(sn.id);
  });
});
