# S09 — Failure-First Lab: Broken CI/CD Pipeline

Получи этот GitHub Actions workflow.  
Pipeline зелёный — но деплой в staging не происходит.  
Три скрытые ошибки. Найди все три только по Actions логам.

```yaml
name: Deploy

on:
  push:
    branches: [main, dev]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run tests
        run: |
          pip install pytest
          pytest tests/

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build Docker image
        run: docker build -t myapp:${{ github.sha }} .

  deploy-staging:
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - name: Deploy to staging
        env:
          DATABASE_URL: ${{ secrets.DB_PASSWORD }}
        run: |
          echo "Deploying ${{ github.sha }} to staging"
          ./scripts/deploy.sh staging

  deploy-prod:
    runs-on: ubuntu-latest
    if: github.ref == 'main'
    steps:
      - name: Deploy to production
        run: ./scripts/deploy.sh production
```

---

Когда найдёшь все три — ответь в конспект:
1. Почему pipeline был зелёным несмотря на ошибки?
2. Какой баг наиболее опасен в production-контексте и почему?
3. Как бы добавил manual approval перед deploy-prod?
