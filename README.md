# ikorka-luiza

Особиста панель власниці: чекліст на день + задачі з таймтрекінгом
(«хто поставив» — вільний текст, напр. Євгенія, без окремого логіну) +
тижнева аналітика. Vite + React, деплой на GitHub Pages. Дані — через
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
