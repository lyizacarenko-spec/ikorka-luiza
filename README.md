# ikorka-luiza — «Луіза АІ автоматизатор»

Особиста панель власниці: чекліст на день + задачі з таймтрекінгом
(«хто поставив» — вільний текст, напр. Євгенія) + тижнева аналітика +
реєстр проєктів. Vite + React, деплой на GitHub Pages. Дані — через
API `task-dashboard-backend` (Railway), таблиці `luiza_daily_tasks` /
`luiza_assigned_tasks` — окремо від таблиць `ikorka-sysadmin`.

## Доступ

Тільки PIN, що резолвиться на роль `owner` (`OWNER_PIN` на Railway).
Будь-який інший валідний PIN (sysadmin/manager) тут відхиляється навіть
якщо технічно проходить `/api/login` — перевірка ролі саме на цьому
фронті, а всі `/api/luiza/*` роути на бекенді додатково гейтяться
`requireRole('owner')`.

## Локальний запуск

```bash
npm install
npm run dev
```

## Деплой

Автоматично при пуші в `main` через `.github/workflows/deploy.yml` →
GitHub Pages. Settings → Pages → Source → GitHub Actions.

## Доступ (ролі)

- `OWNER_PIN` → повний доступ (все вкладки, редагування).
- `EVGENIYA_PIN` → лише перегляд (всі GET-роути `/api/luiza/*`
  відкриті, POST/PATCH/DELETE — ні; кнопки додавання/редагування на
  фронті сховані, коли роль не `owner`).

## Перехід на панель сисадміна

В шапці є кнопка «Панель сисадміна →» (тільки для `owner`) — веде на
`ikorka-sysadmin` без повторного логіну: обидва застосунки на одному
GitHub Pages origin, тож PIN власниці записується в sessionStorage під
ключами, які очікує sysadmin-панель, перед переходом.
