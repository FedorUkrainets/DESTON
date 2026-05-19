# DESTON — деплой на Selectel

Production-ready инструкция для деплоя на **Selectel Cloud Server** (VPS). Стек на сервере: Ubuntu 22.04 LTS + Docker + nginx + Let's Encrypt.

---

## Содержание

1. Что закажешь у Selectel
2. Первая настройка сервера
3. DNS
4. Установка Docker и nginx
5. Деплой кода
6. SSL (Let's Encrypt)
7. Запуск приложения
8. Настройка ЮKassa
9. Email (Resend)
10. Бэкапы и обслуживание
11. Обновление и откат
12. Чек-лист перед запуском

---

## 1. Что закажешь у Selectel

В [Selectel Panel](https://my.selectel.ru/) → **Облачная платформа** → **Облачные серверы** → **Создать сервер**:

| Параметр | Минимум | Рекомендуется |
| --- | --- | --- |
| ОС | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |
| Конфигурация | Shared Line: 1 vCPU / 2 GB RAM / 20 GB SSD | Standard Line: 2 vCPU / 4 GB RAM / 40 GB SSD |
| Регион | Москва / СПб | Москва (ms-1) |
| Сеть | Публичный IPv4 | Публичный IPv4 + IPv6 |
| Бэкапы | — | Включить ежедневные снапшоты |

При создании добавь **SSH-ключ** (если нет — сгенерируй: `ssh-keygen -t ed25519`). Запиши публичный IP сервера, он понадобится для DNS.

---

## 2. Первая настройка сервера

С локальной машины:

```bash
ssh root@ВАШ_IP
```

На сервере:

```bash
# Обновление пакетов
apt update && apt upgrade -y

# Часовой пояс и локаль
timedatectl set-timezone Europe/Moscow
apt install -y locales
locale-gen ru_RU.UTF-8

# Создать non-root пользователя
adduser deploy
usermod -aG sudo deploy
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

# Запрет логина по паролю и под root
sed -i 's/#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart ssh

# Файрвол
apt install -y ufw
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Fail2ban
apt install -y fail2ban
systemctl enable --now fail2ban

# Полезное
apt install -y htop curl git unzip ca-certificates
```

Выйди и подключайся уже под deploy:

```bash
exit
ssh deploy@ВАШ_IP
```

---

## 3. DNS

В DNS-провайдере (Selectel DNS / Cloudflare / др.) создай A-записи:

| Тип | Имя | Значение |
| --- | --- | --- |
| A | `@` | ВАШ_IP |
| A | `www` | ВАШ_IP |

Подожди распространения DNS (5–60 минут). Проверь:

```bash
dig +short your-domain.ru
```

Должен вернуть твой IP.

---

## 4. Установка Docker и nginx

```bash
# Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker   # или relogin

# Проверка
docker --version
docker compose version

# Nginx и certbot
sudo apt install -y nginx certbot python3-certbot-nginx
sudo systemctl enable --now nginx
```

---

## 5. Деплой кода

```bash
# Куда положим проект
sudo mkdir -p /opt/deston
sudo chown deploy:deploy /opt/deston
cd /opt/deston

# Клонируем
git clone https://github.com/ТВОЙ_АККАУНТ/deston.git .
# Если репозиторий приватный — настрой deploy-ключ:
#   ssh-keygen -t ed25519 -C "deston-deploy" -f ~/.ssh/deston_deploy -N ""
#   cat ~/.ssh/deston_deploy.pub   # → добавь в GitHub → Deploy keys (Read access)
#   echo "Host github.com\n  IdentityFile ~/.ssh/deston_deploy" >> ~/.ssh/config
```

Если ещё не залит на GitHub — сначала залей:

```bash
# Локально
cd "C:\Users\Фёдор\OneDrive\Рабочий стол\DESTON"
git init
git add .
git commit -m "init"
gh repo create deston --private --source=. --push   # или вручную через github.com
```

Создай production env:

```bash
cd /opt/deston
cp .env.production.example .env
nano .env
```

Заполни:

- `NEXT_PUBLIC_SITE_URL=https://your-domain.ru`
- `POSTGRES_PASSWORD=` — длинный случайный (`openssl rand -base64 32`)
- `DATABASE_URL` и `DIRECT_URL` — впиши тот же пароль в обоих
- `RESEND_API_KEY=re_...`
- `RESEND_FROM_EMAIL=DESTON <no-reply@your-domain.ru>`
- `ADMIN_NOTIFICATION_EMAIL=anaono542@gmail.com`
- `YOOKASSA_SHOP_ID`, `YOOKASSA_SECRET_KEY`, `YOOKASSA_RETURN_URL=https://your-domain.ru/checkout/success`
- `YOOKASSA_WEBHOOK_SECRET=` — случайный hex (`openssl rand -hex 32`)

Защити файл:

```bash
chmod 600 .env
```

Сделай скрипты исполняемыми:

```bash
chmod +x deploy/scripts/*.sh
```

---

## 6. SSL (Let's Encrypt)

Сначала временный конфиг nginx без SSL, чтобы пройти HTTP-валидацию:

```bash
sudo nano /etc/nginx/sites-available/deston-bootstrap.conf
```

Вставь:

```nginx
server {
    listen 80;
    server_name your-domain.ru www.your-domain.ru;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 200 "ok"; }
}
```

Активируй:

```bash
sudo mkdir -p /var/www/certbot
sudo ln -sf /etc/nginx/sites-available/deston-bootstrap.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

Получи сертификат:

```bash
sudo certbot certonly --webroot -w /var/www/certbot \
  -d your-domain.ru -d www.your-domain.ru \
  --email anaono542@gmail.com --agree-tos --no-eff-email
```

Должно появиться `/etc/letsencrypt/live/your-domain.ru/fullchain.pem`.

Замени конфиг на боевой:

```bash
sudo rm /etc/nginx/sites-enabled/deston-bootstrap.conf
sudo cp /opt/deston/deploy/nginx/deston.conf /etc/nginx/sites-available/deston.conf
sudo sed -i "s/your-domain.ru/$(echo your-domain.ru)/g" /etc/nginx/sites-available/deston.conf
# или просто открой nano и замени your-domain.ru на свой
sudo ln -sf /etc/nginx/sites-available/deston.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Автообновление сертификата — certbot уже создаёт systemd-таймер. Проверь:

```bash
sudo systemctl list-timers | grep certbot
sudo certbot renew --dry-run
```

---

## 7. Запуск приложения

```bash
cd /opt/deston

# Первая сборка
docker compose -f docker-compose.prod.yml --env-file .env up -d --build

# Логи
docker compose -f docker-compose.prod.yml logs -f app
```

Контейнеры:
- `db` — Postgres 16 (volume `deston-db`)
- `migrate` — однократно накатывает миграции и выходит
- `app` — Next.js на `127.0.0.1:3000` (доступен только через nginx)

Засеять тестовый каталог (опционально):

```bash
./deploy/scripts/seed-prod.sh
```

Проверь:

```bash
curl -I https://your-domain.ru
curl https://your-domain.ru/api/health
```

Открой `https://your-domain.ru` в браузере — должна загрузиться главная.

---

## 8. Настройка ЮKassa

1. Зарегистрируйся / войди в [ЮKassa](https://yookassa.ru/).
2. Создай магазин или зайди в действующий → раздел **Настройки → API ключи**:
   - Скопируй **Идентификатор магазина** → `YOOKASSA_SHOP_ID` в `.env`
   - Сгенерируй **Секретный ключ** → `YOOKASSA_SECRET_KEY`
3. **Настройки → HTTP-уведомления → Добавить**:
   - URL: `https://your-domain.ru/api/payment/webhook`
   - Подпишись на события `payment.succeeded`, `payment.canceled`
4. Перезапусти приложение, чтобы env применилось:

```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --force-recreate app
```

5. Сделай тестовую покупку картой 5555 5555 5555 4444 (тестовая ЮKassa).

---

## 9. Email (Resend)

1. Зарегистрируйся на [resend.com](https://resend.com).
2. **Domains → Add Domain** → введи `your-domain.ru`.
3. Resend выдаст DNS-записи (TXT + MX + DKIM). Добавь их в DNS-провайдере.
4. Подожди валидации (15 мин – пара часов).
5. **API Keys → Create API Key** → скопируй ключ `re_...` в `.env` (`RESEND_API_KEY`).
6. В `.env` поставь `RESEND_FROM_EMAIL=DESTON <no-reply@your-domain.ru>` (с тем же доменом, что валидировал).
7. Перезапусти `app`:

```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --force-recreate app
```

8. Сделай тестовый заказ — должно прийти два письма:
   - на email покупателя — подтверждение оплаты с номером заказа
   - на `anaono542@gmail.com` — полная сводка по заказу (имя, фамилия, email, телефон, город, адрес, способ доставки, позиции с размерами/цветами/кол-вом, итог, номер, дата)

---

## 10. Бэкапы и обслуживание

### Ежедневный бэкап БД

```bash
chmod +x /opt/deston/deploy/scripts/backup-db.sh
crontab -e
```

Добавь строку:

```cron
0 3 * * * /opt/deston/deploy/scripts/backup-db.sh >> /var/log/deston-backup.log 2>&1
```

Бэкапы лежат в `/opt/deston/backups/`. Хранится последние 14 штук.

### Сохранение бэкапов вне сервера (рекомендуется)

В `crontab` добавь синк в Selectel Object Storage (S3):

```bash
sudo apt install -y awscli
aws configure   # endpoint: https://s3.ru-1.storage.selcloud.ru
```

```cron
30 3 * * * aws --endpoint-url https://s3.ru-1.storage.selcloud.ru s3 sync /opt/deston/backups s3://deston-backups/
```

### Логи

- Nginx: `/var/log/nginx/deston.access.log`, `/var/log/nginx/deston.error.log`
- Приложение: `docker compose -f docker-compose.prod.yml logs -f app`
- Postgres: `docker compose -f docker-compose.prod.yml logs db`

### Мониторинг

Простейший uptime-чек: [UptimeRobot](https://uptimerobot.com) на `https://your-domain.ru/api/health`. Возвращает `{ "ok": true }`.

---

## 11. Обновление и откат

### Обновление

После пуша новой версии в `main`:

```bash
ssh deploy@ВАШ_IP
cd /opt/deston
./deploy/scripts/deploy.sh
```

Скрипт: pull → build → up → prune старых образов → tail логов.

### Откат

```bash
cd /opt/deston
git log --oneline -10                 # найди sha предыдущей версии
git reset --hard <SHA>
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

### Восстановление из бэкапа

```bash
gunzip -c /opt/deston/backups/deston-YYYYMMDD-HHMMSS.sql.gz \
  | docker compose -f docker-compose.prod.yml exec -T db psql -U deston -d deston
```

---

## 12. Чек-лист перед запуском

- [ ] DNS A-записи `@` и `www` указывают на сервер
- [ ] Файрвол: открыты только 22, 80, 443
- [ ] root по SSH запрещён, парольный логин запрещён
- [ ] `.env` существует и имеет права `600`
- [ ] SSL-сертификат получен, `certbot renew --dry-run` проходит
- [ ] `https://your-domain.ru` отдаёт главную
- [ ] `https://your-domain.ru/api/health` отдаёт `{"ok":true}`
- [ ] Каталог `/catalog` показывает товары
- [ ] Кнопка «Корзина +» открывает drawer, товар добавляется
- [ ] `/checkout` — кнопка «Оплатить» неактивна до валидности формы
- [ ] Тестовый заказ создаётся, ЮKassa открывается, после оплаты возврат на `/checkout/success`
- [ ] Письмо приходит на email покупателя
- [ ] Письмо со всеми деталями приходит на `anaono542@gmail.com`
- [ ] Webhook YooKassa проставляет статус `PAID` в БД (`docker compose ... exec db psql ...`)
- [ ] Бэкап БД создан хотя бы один раз вручную (`./deploy/scripts/backup-db.sh`)
- [ ] UptimeRobot настроен

---

## Troubleshooting

**`502 Bad Gateway`** — приложение упало или не успело подняться:

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --tail=100 app
```

**`Authentication failed` в логах** — пароль в `DATABASE_URL` не совпадает с `POSTGRES_PASSWORD`. Поправь `.env`, потом:

```bash
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml --env-file .env up -d
```

**Сертификат не получается** — проверь, что DNS уже обновился (`dig your-domain.ru`) и порт 80 открыт.

**Webhook не приходит** — в Selectel firewall и в `ufw` должен быть разрешён 443. В nginx-логах ищи `POST /api/payment/webhook`. В ЮKassa-кабинете → HTTP-уведомления → история — там видно ответы.

**OOM (out of memory) при `docker build`** — на VPS с 2GB RAM Next.js билдится впритык. Включи swap:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## Архитектура production

```
              ┌──────────────────────────────────────────────────────────────┐
              │                       Selectel VPS                            │
   Internet → nginx :443 ─┬──────────────────────────────────────────────────│
                          │  (SSL termination, rate-limit, gzip, headers)    │
                          ▼                                                  │
                  Next.js :3000  ────────────────────────────────────────┐   │
                     (Docker)                                            │   │
                          │                                              │   │
                          ▼                                              │   │
                  Postgres :5432 (internal, no host port)                │   │
                     (Docker)                                            │   │
                                                                         │   │
              External services (HTTPS outbound):                        │   │
                ── api.yookassa.ru  ──────────────────────────────────── │   │
                ── api.resend.com   ──────────────────────────────────── │   │
              └──────────────────────────────────────────────────────────┴───┘
```
