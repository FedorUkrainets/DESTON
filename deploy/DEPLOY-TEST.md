# DESTON — тестовый деплой на Selectel (HTTP по IP, без домена и ЮKassa)

Быстрый сценарий, чтобы развернуть проект на пару дней / показать. Платежи в режиме заглушки (заказы создаются, письма уходят). Полный production-сценарий с доменом и SSL — см. `DEPLOY.md`.

---

## 1. Создай VPS на Selectel

[my.selectel.ru](https://my.selectel.ru) → Облачные серверы → Создать:

- ОС: **Ubuntu 22.04 LTS**
- Конфигурация: 1–2 vCPU / 2–4 GB RAM / 20 GB SSD (для теста хватит самого дешёвого)
- Сеть: Публичный IPv4
- SSH-ключ: добавь свой публичный ключ

Запиши **IP сервера** — он понадобится дальше.

---

## 2. Базовая настройка

С локальной машины:

```bash
ssh root@IP_СЕРВЕРА
```

На сервере:

```bash
# Обновление
apt update && apt upgrade -y

# Создать пользователя
adduser deploy
usermod -aG sudo deploy
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

# Файрвол
apt install -y ufw
ufw allow OpenSSH
ufw allow 80/tcp
ufw --force enable

# Docker
curl -fsSL https://get.docker.com | sh
usermod -aG docker deploy

# Nginx
apt install -y nginx git
systemctl enable --now nginx

# Swap для билда (если RAM < 4GB)
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

exit
```

Подключись как deploy:

```bash
ssh deploy@IP_СЕРВЕРА
```

---

## 3. Залить код

Если проект на GitHub — клонируй. Если ещё нигде — залей сначала туда (приватный репо ок).

```bash
sudo mkdir -p /opt/deston
sudo chown deploy:deploy /opt/deston
cd /opt/deston

git clone https://github.com/ТВОЙ_АККАУНТ/deston.git .

# Если репозиторий приватный — настрой deploy-key (см. DEPLOY.md, шаг 5)
```

**Альтернатива без GitHub** — закинуть архивом через scp:

```bash
# Локально (Windows PowerShell):
cd "C:\Users\Фёдор\OneDrive\Рабочий стол\DESTON"
tar -czf deston.tar.gz --exclude=node_modules --exclude=.next --exclude=.git .
scp deston.tar.gz deploy@IP_СЕРВЕРА:/tmp/

# На сервере:
cd /opt/deston
tar -xzf /tmp/deston.tar.gz
rm /tmp/deston.tar.gz
```

---

## 4. Создай `.env`

```bash
cd /opt/deston
cp .env.production.example .env
nano .env
```

Подставь (заменяя `IP_СЕРВЕРА` на реальный):

```dotenv
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=http://IP_СЕРВЕРА
NEXT_PUBLIC_SITE_NAME=DESTON

POSTGRES_USER=deston
POSTGRES_PASSWORD=6bpvXC5maoJvXdq7JHinK31lUh6D
POSTGRES_DB=deston
DATABASE_URL=postgresql://deston:6bpvXC5maoJvXdq7JHinK31lUh6D@db:5432/deston?schema=public
DIRECT_URL=postgresql://deston:6bpvXC5maoJvXdq7JHinK31lUh6D@db:5432/deston?schema=public

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_BUCKET=products

RESEND_API_KEY=re_EPAg6GGJ_Dm55QPGcAsk5cRPu2jg4Qo5D
RESEND_FROM_EMAIL=DESTON <onboarding@resend.dev>
RESEND_REPLY_TO=
ADMIN_NOTIFICATION_EMAIL=anaono542@gmail.com

# ЮKassa отключена — stub-режим. Не трогай эти поля.
YOOKASSA_SHOP_ID=
YOOKASSA_SECRET_KEY=
YOOKASSA_RETURN_URL=http://IP_СЕРВЕРА/checkout/success
YOOKASSA_WEBHOOK_SECRET=test

RATE_LIMIT_MAX=120
RATE_LIMIT_WINDOW_MS=60000
```

```bash
chmod 600 .env
```

---

## 5. Поставь тестовый nginx-конфиг

```bash
sudo cp /opt/deston/deploy/nginx/deston-test.conf /etc/nginx/sites-available/
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/deston-test.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 6. Запусти приложение

```bash
cd /opt/deston
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

Это:
1. Поднимет Postgres
2. Накатит миграции (контейнер `migrate`)
3. Запустит Next.js на `127.0.0.1:3000`

Подожди 1–2 минуты (сборка занимает время).

Логи:

```bash
docker compose -f docker-compose.prod.yml logs -f app
```

(выход — Ctrl+C, контейнер не остановится).

---

## 7. Засеять тестовый товар

```bash
docker compose -f docker-compose.prod.yml exec app npx tsx prisma/seed.ts
```

---

## 8. Открой в браузере

```
http://IP_СЕРВЕРА
```

Должна загрузиться главная. Проверь:

- `/catalog` — товар появляется
- `/catalog/hoodie-crop-fit` — можно выбрать размер/цвет
- «Корзина +» открывает drawer
- Добавь в корзину → «Оформить»
- Заполни форму → «Оплатить» → редирект на `/checkout/success`
- На `anaono542@gmail.com` (и на email, который указал в форме) должны прийти письма

---

## 9. Если что-то не так

```bash
# Статус контейнеров
docker compose -f docker-compose.prod.yml ps

# Логи приложения
docker compose -f docker-compose.prod.yml logs --tail=200 app

# Логи Postgres
docker compose -f docker-compose.prod.yml logs --tail=100 db

# Логи nginx
sudo tail -f /var/log/nginx/deston.error.log
sudo tail -f /var/log/nginx/deston.access.log

# Перезапуск
docker compose -f docker-compose.prod.yml --env-file .env up -d --force-recreate app
```

---

## 10. Когда соберёшься в полный прод

1. Купи домен, настрой DNS A-запись на IP сервера
2. Удали тестовый nginx-конфиг:
   ```bash
   sudo rm /etc/nginx/sites-enabled/deston-test.conf
   ```
3. Иди по полному `DEPLOY.md` начиная с шага 6 (получение SSL через certbot и установка боевого nginx-конфига)
4. В `.env` поменяй:
   - `NEXT_PUBLIC_SITE_URL=https://твой-домен`
   - `YOOKASSA_RETURN_URL=https://твой-домен/checkout/success`
   - заполни `YOOKASSA_SHOP_ID`, `YOOKASSA_SECRET_KEY`
   - сгенерь и поставь `YOOKASSA_WEBHOOK_SECRET=$(openssl rand -hex 32)`
5. Перезапусти: `docker compose -f docker-compose.prod.yml --env-file .env up -d --force-recreate app`
6. В кабинете ЮKassa подключи webhook на `https://твой-домен/api/payment/webhook`
7. Верифицируй домен в Resend (DNS-записи) и поменяй `RESEND_FROM_EMAIL` на адрес со своим доменом
