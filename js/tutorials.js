// Sprint Tutorials Data
// Format: { steps: [{title, body, code, tip}], checklist: [string] }
const TUTORIALS = {};

TUTORIALS[1] = {
  steps: [
    { title: "Установка окружения (WSL2 или VM)",
      body: "Установи WSL2 с Ubuntu 22.04 через PowerShell. Альтернатива — VirtualBox + Ubuntu Server 22.04 (2 CPU, 4 GB RAM). После установки обнови систему.",
      code: "# PowerShell (администратор):\nwsl --install -d Ubuntu-22.04\n# Проверить:\nwsl --list --verbose\n# Обновить Ubuntu:\nsudo apt update && sudo apt upgrade -y",
      tip: "Не тяни с этим шагом — без окружения дальше не двинуться. WSL2 недоступен → используй VirtualBox." },
    { title: "SSH-ключи для GitHub и GitLab",
      body: "Сгенерируй ED25519 ключ (современнее RSA). Публичную часть добавь в Settings → SSH Keys на обоих сервисах. Проверь через ssh -T.",
      code: "ssh-keygen -t ed25519 -C \"your@email.com\"\ncat ~/.ssh/id_ed25519.pub  # скопируй в GitHub\nssh -T git@github.com     # Hi username!\nssh -T git@gitlab.com     # Welcome, username!",
      tip: "ssh -T должен ответить приветствием без ошибок — это критерий успеха шага." },
    { title: "Репозиторий со структурой веток",
      body: "Создай публичный репо на GitHub. Настрой ветки main, dev, feature/*, release/*. Добавь .gitignore и .editorconfig.",
      code: "git init myproject && cd myproject\ngit remote add origin git@github.com:USER/myproject.git\ngit checkout -b dev\ngit push -u origin dev\n# .gitignore:\ncurl -o .gitignore 'https://www.toptal.com/developers/gitignore/api/linux,python,node'",
      tip: "Сразу push ветку dev на remote — иначе branch protection не настроить." },
    { title: "Branch Protection Rules",
      body: "GitHub: Settings → Branches → Add rule для main и dev. Включи: Require PR review (1 reviewer), Require status checks, No force push.",
      code: "# Проверить что force push заблокирован:\ngit push --force origin main\n# Ожидаемый результат:\n# ! [remote rejected] main -> main (protected branch)",
      tip: "Для status checks на старте можно оставить пустым — заполнится после добавления CI." },
    { title: "GitHub Actions CI workflow",
      body: "Создай .github/workflows/ci.yml — пока placeholder, он будет расти в следующих спринтах. Открой PR из feature-ветки в dev и убедись что workflow запускается.",
      code: "mkdir -p .github/workflows\ncat > .github/workflows/ci.yml << 'YML'\nname: CI\non:\n  push:\n    branches: [main, dev]\n  pull_request:\n    branches: [main, dev]\njobs:\n  lint:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: echo \"CI placeholder\"\nYML",
      tip: "После первого успешного run скопируй CI badge URL из Actions и добавь в README." },
    { title: "README с CI badge",
      body: "README — первое что видит рекрутер. Напиши: цель проекта, стек с badges (shields.io), как запустить локально, CI badge.",
      code: "# README.md:\n# [![CI](https://github.com/USER/REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/USER/REPO/actions)\n#\n# ## Stack\n# | Tool | Purpose |\n# |------|--------|\n# | GitHub Actions | CI/CD |\n# | Docker | Containers |",
      tip: "Трать время на README пропорционально важности проекта. Capstone README пиши последним." }
  ],
  checklist: [
    "`ssh -T git@github.com` возвращает приветствие без ошибок",
    "Репозиторий публичный, ветки main/dev существуют на remote",
    "PR из feature-ветки запускает CI workflow (зелёный check)",
    "`git push --force origin main` отклоняется — protected branch",
    "README содержит CI badge, описание проекта и стек",
    ".gitignore и .editorconfig закоммичены в репозиторий"
  ]
};

TUTORIALS[2] = {
  steps: [
    { title: "Создание системного пользователя app_user",
      body: "Системный пользователь без shell — стандарт для сервисов. --system не создаёт home, /usr/sbin/nologin блокирует вход. Настрой sudo drop-in для конкретных команд.",
      code: "sudo useradd --system --no-create-home --shell /usr/sbin/nologin app_user\nid app_user\n# sudo drop-in:\necho 'app_user ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart myapp' \\\n  | sudo tee /etc/sudoers.d/app_user\nsudo visudo -c -f /etc/sudoers.d/app_user",
      tip: "Никогда не редактируй /etc/sudoers напрямую — только через visudo или drop-in файлы." },
    { title: "Написание healthcheck.py",
      body: "Скрипт принимает --url через argparse, делает GET запрос. При != 200 пишет WARNING в лог. Используй стандартный logging — timestamp добавляется автоматически.",
      code: "cat > /usr/local/bin/healthcheck.py << 'PY'\nimport argparse, logging, urllib.request\nlogging.basicConfig(filename='/var/log/healthcheck.log',\n    format='%(asctime)s %(levelname)s %(message)s', level=logging.INFO)\nparser = argparse.ArgumentParser()\nparser.add_argument('--url', required=True)\nargs = parser.parse_args()\ntry:\n    with urllib.request.urlopen(args.url, timeout=5) as r:\n        if r.status == 200: logging.info(f'OK {args.url}')\n        else: logging.warning(f'DEGRADED {args.url} status={r.status}')\nexcept Exception as e:\n    logging.warning(f'FAILED {args.url} error={e}')\nPY\nsudo touch /var/log/healthcheck.log\nsudo chown app_user /var/log/healthcheck.log",
      tip: "Создай лог-файл с правами app_user ДО добавления в systemd — иначе первый запуск упадёт." },
    { title: "Systemd service unit",
      body: "Type=oneshot — для скриптов которые запускаются, делают работу и выходят. Type=simple — для long-running процессов. Это частый вопрос на LFCS.",
      code: "sudo tee /etc/systemd/system/healthcheck.service << 'SVC'\n[Unit]\nDescription=HTTP Healthcheck\nAfter=network.target\n\n[Service]\nType=oneshot\nUser=app_user\nExecStart=/usr/bin/python3 /usr/local/bin/healthcheck.py --url http://localhost\n\n[Install]\nWantedBy=multi-user.target\nSVC\nsudo systemctl daemon-reload\nsudo systemctl start healthcheck.service\nsudo journalctl -u healthcheck.service -n 20",
      tip: "journalctl -u <service> — первое место куда смотреть при проблемах с systemd." },
    { title: "Systemd timer (каждые 5 минут)",
      body: "OnCalendar=*:0/5 — каждые 5 минут. Persistent=true — запустится при старте если был пропуск. Включай таймер, не сервис.",
      code: "sudo tee /etc/systemd/system/healthcheck.timer << 'TMR'\n[Unit]\nDescription=Healthcheck every 5 minutes\n\n[Timer]\nOnCalendar=*:0/5\nPersistent=true\n\n[Install]\nWantedBy=timers.target\nTMR\nsudo systemctl enable --now healthcheck.timer\nsystemctl list-timers healthcheck.timer",
      tip: "systemctl enable --now — включает и запускает одновременно. Запомни этот флаг." },
    { title: "Проверка и коммит",
      body: "Через 5 минут проверь что лог пишется. Зафикси в репозиторий: скрипт + оба unit-файла + README с объяснением каждой директивы.",
      code: "# Подождать 5 минут:\ntail -f /var/log/healthcheck.log\n# Структура репо:\n# scripts/healthcheck.py\n# systemd/healthcheck.service\n# systemd/healthcheck.timer\n# docs/systemd-README.md",
      tip: "В README объясни каждую директиву systemd своими словами — это показывает понимание, а не copy-paste." }
  ],
  checklist: [
    "`id app_user` показывает system account со shell /usr/sbin/nologin",
    "`sudo visudo -c -f /etc/sudoers.d/app_user` проходит без ошибок",
    "`python3 healthcheck.py --url http://google.com` пишет запись в лог",
    "`systemctl list-timers healthcheck.timer` показывает NEXT время",
    "Через 5 минут в /var/log/healthcheck.log появляется новая запись",
    "Скрипт + unit-файлы + README закоммичены в репозиторий"
  ]
};

TUTORIALS[3] = {
  steps: [
    { title: "LVM: полный цикл pvcreate → mount",
      body: "Добавь виртуальный диск в VM (VirtualBox: Settings → Storage → Add disk 5GB). Пройди полный цикл: Physical Volume → Volume Group → Logical Volume → filesystem → mount.",
      code: "lsblk  # найти новый диск (обычно /dev/sdb)\nsudo pvcreate /dev/sdb\nsudo vgcreate datavg /dev/sdb\nsudo lvcreate -L 3G -n datalv datavg\nsudo mkfs.ext4 /dev/datavg/datalv\nsudo mkdir -p /data\nsudo mount /dev/datavg/datalv /data\ndf -h /data && sudo lvs",
      tip: "Порядок строгий: pvcreate → vgcreate → lvcreate. Аббревиатуры: pv/vg/lv + create/display/remove." },
    { title: "LVM снапшот и расширение на лету",
      body: "Снапшот — мгновенная копия LV. Расширение без размонтирования — главное преимущество LVM. resize2fs — для ext4, xfs_growfs — для xfs.",
      code: "sudo lvcreate -L 1G -s -n datalv-snap /dev/datavg/datalv\nsudo mkdir /snap && sudo mount /dev/datavg/datalv-snap /snap\n# Расширение:\nsudo lvextend -L +1G /dev/datavg/datalv\nsudo resize2fs /dev/datavg/datalv  # онлайн без umount\ndf -h /data  # размер увеличился",
      tip: "resize2fs без аргументов расширяет до полного размера LV — обычно это то что нужно." },
    { title: "Постоянное монтирование через /etc/fstab",
      body: "Используй UUID, не /dev/sdX — имена дисков меняются при перезагрузке. ВСЕГДА проверяй через mount -a до перезагрузки.",
      code: "sudo blkid /dev/datavg/datalv  # получить UUID\n# Добавить в /etc/fstab:\n# UUID=xxxx-xxxx  /data  ext4  defaults  0  2\nsudo umount /data\nsudo mount -a  # монтирует всё из fstab\ndf -h /data",
      tip: "mount -a перед перезагрузкой ОБЯЗАТЕЛЬНО. Ошибка в fstab = система не загрузится." },
    { title: "Скрипт disk_monitor.sh",
      body: "Проверяет заполненность через df. При > 80% пишет в syslog через logger и в файл с timestamp.",
      code: "sudo tee /usr/local/bin/disk_monitor.sh << 'SH'\n#!/bin/bash\nLOG=/var/log/disk_monitor.log\nTHRESHOLD=80\ndf -h --output=pcent,target | tail -n +2 | while read pct mount; do\n  num=${pct%%%}\n  if [ \"$num\" -gt \"$THRESHOLD\" ] 2>/dev/null; then\n    msg=\"DISK WARNING: $mount used ${pct}\"\n    logger -p daemon.warning \"$msg\"\n    echo \"$(date '+%Y-%m-%d %H:%M:%S') $msg\" >> \"$LOG\"\n  fi\ndone\nSH\nsudo chmod +x /usr/local/bin/disk_monitor.sh\n# Тест (снизь порог):\nsudo bash -c 'THRESHOLD=5 /usr/local/bin/disk_monitor.sh'\ncat /var/log/disk_monitor.log",
      tip: "Тестируй с THRESHOLD=5 чтобы сразу увидеть вывод. Не жди 80% заполненности диска." },
    { title: "Cron задание и конспект терминологии",
      body: "Используй /etc/cron.d/ для системных заданий (указывай пользователя). Параллельно составь конспект 20+ DevOps/SRE терминов из LFS162x.",
      code: "sudo tee /etc/cron.d/disk_monitor << 'CRON'\n*/15 * * * * root /usr/local/bin/disk_monitor.sh\nCRON\n# Ручной тест:\nsudo /usr/local/bin/disk_monitor.sh\n# Минимум терминов:\n# SLO, SLI, SLA, MTTR, MTBF, Error Budget\n# Toil, Golden Signals, USE/RED Method, Postmortem",
      tip: "Файлы в /etc/cron.d/ должны принадлежать root без write-прав для других — иначе cron игнорирует." }
  ],
  checklist: [
    "`sudo lvs` показывает datalv (3G) и datalv-snap (снапшот)",
    "`df -h /data` показывает примонтированный LV правильного размера",
    "UUID (не /dev/sdX) в /etc/fstab, `mount -a` проходит без ошибок",
    "`sudo /usr/local/bin/disk_monitor.sh` создаёт запись в /var/log/disk_monitor.log",
    "/etc/cron.d/disk_monitor существует с правилом */15",
    "Конспект с 20+ терминами закоммичен в репозиторий"
  ]
};

TUTORIALS[4] = {
  steps: [
    { title: "Подготовка: 2 VM с host-only сетью",
      body: "VirtualBox: обеим VM добавь Adapter 2 → Host-only network. VM1 — сервер с nginx, VM2 — клиент для диагностики.",
      code: "# На VM1:\nsudo apt install nginx -y && sudo systemctl start nginx\n# На VM2:\nip addr show  # найди IP в сети 192.168.56.x\ncurl http://<VM1_IP>  # должен вернуть nginx",
      tip: "Запиши IP обеих VM — они понадобятся во всех 5 сценариях." },
    { title: "Сценарий 1 и 2: DNS и iptables",
      body: "Сломай DNS изменив resolv.conf. Затем заблокируй порт 80 через iptables. DROP = таймаут, REJECT = connection refused — знай разницу.",
      code: "# DNS сломать:\necho 'nameserver 1.2.3.4' | sudo tee /etc/resolv.conf\ndig google.com  # timeout\n# DNS починить:\necho 'nameserver 8.8.8.8' | sudo tee /etc/resolv.conf\n\n# iptables:\nsudo iptables -I INPUT -p tcp --dport 80 -j DROP\ncurl -v --connect-timeout 5 http://<VM1_IP>  # timeout\nnmap -p 80 <VM1_IP>  # filtered\nsudo iptables -D INPUT -p tcp --dport 80 -j DROP",
      tip: "DROP = пакет выбрасывается молча (таймаут). REJECT = ICMP ошибка (connection refused). Разница важна для диагностики." },
    { title: "Сценарий 3 и 4: маршрут и MTU",
      body: "Удали маршрут к VM1 — наблюдай Network unreachable. Установи MTU 500 — большие пакеты теряются. MTU issues часто в VPN.",
      code: "# Удалить маршрут:\nip route show\nsudo ip route del <SUBNET>/24\nping <VM1_IP>       # Network unreachable\ntraceroute <VM1_IP> # нет пути\nsudo ip route add <SUBNET>/24 via <GATEWAY>\n\n# MTU:\nsudo ip link set eth1 mtu 500\nping -s 1000 <VM1_IP>  # packet loss\nping -s 400 <VM1_IP>   # проходит\nsudo ip link set eth1 mtu 1500",
      tip: "MTU issue симптом: пинг работает, большие HTTP запросы зависают. Проверяй ping с разными -s." },
    { title: "Сценарий 5: /etc/hosts override",
      body: "Нестандартный сценарий: запись в /etc/hosts перенаправляет трафик не туда. Частая причина 'мистических' проблем в production.",
      code: "echo '127.0.0.1 myservice.local' | sudo tee -a /etc/hosts\ncurl http://myservice.local  # идёт на localhost!\n# Диагностика:\ncat /etc/hosts\ngetent hosts myservice.local  # откуда берётся\n# Починить:\nsudo sed -i '/myservice.local/d' /etc/hosts\ncurl http://myservice.local  # теперь правильный IP",
      tip: "В production /etc/hosts override — первое что проверяй при 'мистических' DNS проблемах." },
    { title: "Сетевой runbook: 5 сценариев",
      body: "Для каждого сценария: как воспроизвести → команды диагностики → реальный вывод → решение → проверка. Документ для 3 ночи.",
      code: "# Шаблон каждого сценария в runbook.md:\n## Сценарий N: <название>\n### Симуляция\n```bash\n<команды>\n```\n### Диагностика\n```\n<вывод инструментов>\n```\n### Решение и проверка\n```bash\n<fix команды>\n```",
      tip: "Хороший runbook = проблема решена за 5 минут без гугления. Вставляй реальный вывод, не придумывай." }
  ],
  checklist: [
    "VM1 и VM2 пингуют друг друга через host-only сеть",
    "DNS сломан и починен — команды диагностики задокументированы",
    "iptables блокирует порт 80 — разница DROP vs REJECT зафиксирована",
    "Маршрут удалён и восстановлен — traceroute показывает разницу",
    "MTU mismatch: ping -s 400 проходит, ping -s 1000 — нет",
    "runbook.md с 5 сценариями закоммичен в репозиторий"
  ]
};
