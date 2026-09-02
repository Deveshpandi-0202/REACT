FROM python:3.14-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY requirements.txt .

RUN pip install --no-cache-dir --upgrade pip setuptools wheel && find /usr/local/lib/python3.14/site-packages -type d -name "msgpack-1.1.2.dist-info" -prune -exec rm -rf {} + && find /usr/local/lib/python3.14/site-packages -type d -name "setuptools-70.3.0.dist-info" -prune -exec rm -rf {} +
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p /app/data
RUN useradd --create-home appuser
RUN chown -R appuser:appuser /app

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 5000

ENV PORT=5000
ENV SQLALCHEMY_DATABASE_URI=sqlite:////app/data/blinkit.db

ENTRYPOINT ["/entrypoint.sh"]
