# S06 — Failure-First Lab: Broken Dockerfile

Получи этот Dockerfile. `docker build` упадёт.  
Три скрытые ошибки. Найди все три только по build логам — без подсказок.

```dockerfile
FROM python:3.11-apline

WORKDIR /app

RUN apt-get update && apt-get install -y curl

COPY requirements.txt .

RUN pip install -r requirements.txt

COPY application.py .

EXPOSE 8000

CMD ["python", "app.py"]
```

**requirements.txt:**
```
flask==3.0.0
gunicorn==21.2.0
```

**application.py:**
```python
from flask import Flask
app = Flask(__name__)

@app.route("/health")
def health():
    return {"status": "ok"}, 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
```

---

Когда починишь — ответь в конспект:
1. Какую ошибку нашёл первой и по какому признаку в логах?
2. Какая ошибка была наименее очевидной?
3. Как изменил бы порядок слоёв для оптимального layer caching?
