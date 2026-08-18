# ikorka-luiza — контекст для Claude Code

## Що це
«Луіза АІ автоматизатор» — особиста панель власниці (Луїзи): чекліст на день, задачі з
таймтрекінгом (хто поставив — вільний текст, не роль), тижнева
аналітика. Той самий бекенд і та сама Postgres-база, що й
task-dashboard і ikorka-sysadmin, але окремі таблиці:
`luiza_daily_tasks`, `luiza_assigned_tasks`.

## Доступ
`owner` (`OWNER_PIN`) — повний доступ. `evgeniya` (`EVGENIYA_PIN`) —
read-only: GET-роути `/api/luiza/*` відкриті для обох ролей,
POST/PATCH/DELETE — тільки `owner`. Жоден інший PIN (sysadmin/manager)
сюди не потрапить.

## Перехід на ikorka-sysadmin
Кнопка в шапці (тільки для `owner`) записує PIN у sessionStorage під
ключами `ikorka_sysadmin_pin`/`ikorka_sysadmin_role` (спільний origin
GitHub Pages) і веде на sysadmin-панель без повторного логіну.

## Стек
- Vite + React, `src/App.jsx`, `src/api.js` (PIN у заголовку `x-pin`).
- Деплой: GitHub Actions → GitHub Pages, автоматично при пуші в `main`.
- `vite.config.js`: `base: "/ikorka-luiza/"`.

## Backdating
І чекліст (`completed_at`), і задачі (`started_at`/`finished_at`)
редагуються напряму через `<input type="date">` в самому інтерфейсі —
не тільки при створенні, а й пізніше, для запису заднім числом.

## Важливо при змінах
- Не хардкодити PIN у код.
- Дані поки не заповнені навмисно — тільки структура й робочий
  інтерфейс, наповнення окремим кроком.
