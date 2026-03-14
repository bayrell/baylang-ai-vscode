# Инструкция по добавлению инструмента (Tool)

## Обзор

Инструменты (Tools) в проекте представляют собой классы, наследуемые от базового класса `Tool`. Они добавляют новую функциональность, которую AI-ассистент может выполнять по запросу пользователя. Этот документ описывает процесс создания и регистрации нового инструмента.

## Пример: GetCurrentDate.js

Приведенный ниже пример показывает, как создать простой инструмент `GetCurrentDate`, который возвращает текущую дату и время.

### Код инструмента (`app/Tools/GetCurrentDate.js`)

```javascript
import { Tool } from "../Ai/Tool.js";

export class GetCurrentDate extends Tool
{
	constructor()
	{
		super();
		this.setName("get_current_date");
		this.setDescription("Get the current date and time");
		this.setPrompt("To get the current date and time, use the `get_current_date` function.");
	}
	
	
	/**
	 * Execute function
	 */
	async execute(params)
	{
		const current_date = new Date();
		return current_date.toString();
	}
}
```

### Объяснение кода

1. **Импорт базового класса**: `import { Tool } from "../Ai/Tool.js";`
   - Класс `Tool` является базовым классом для всех инструментов.

2. **Конструктор**:
   - `super()`: Вызов конструктора базового класса.
   - `this.setName("get_current_date")`: Устанавливает имя инструмента. Это имя будет использоваться для вызова инструмента.
   - `this.setDescription("Get the current date and time")`: Устанавливает описание инструмента.
   - `this.setPrompt("To get the current date and time, use the `get_current_date` function.")`: Устанавливает подсказку для AI-ассистента, объясняя, как использовать этот инструмент.

3. **Метод `execute`**:
   - Это асинхронный метод, который выполняет основную логику инструмента.
   - Он принимает параметр `params` (в данном случае не используется).
   - Возвращает результат выполнения (в данном случае строку с текущей датой).

## Регистрация инструмента

После создания файла инструмента его необходимо зарегистрировать в системе. Регистрация выполняется в файле `app/Backend/CommandRegistry.js`.

### Шаги регистрации

1. **Добавить импорт**:
   - Добавьте строку импорта нового инструмента в начало файла `CommandRegistry.js`.

   ```javascript
   import { GetCurrentDate } from "../Tools/GetCurrentDate.js";
   ```

2. **Добавить создание экземпляра инструмента**:
   - В функции `registerTools` найдите комментарий `/* Create tools */`.
   - Добавьте строку создания экземпляра вашего инструмента.

   ```javascript
   tools.add(new GetCurrentDate());
   ```

### Полный пример изменения `CommandRegistry.js`

Ниже приведен фрагмент файла `CommandRegistry.js`, показывающий, как добавить импорт и регистрацию `GetCurrentDate`.

```javascript
// ... (предыдущие импорты)
import { GetCurrentDate } from "../Tools/GetCurrentDate.js";
// ... (другие импорты)

// ... (другие функции)

/**
 * Register tools
 */
export async function registerTools(settings)
{
	var tools = new Tools();
	
	/* Create tools */
	tools.add(new RandomTool());
	tools.add(new GetCurrentDate()); // <-- Новая строка
	tools.add(new WriteFile(settings));
	// ... (другие инструменты)
	
	return tools;
}
```

## Рекомендации

- **Именование**: Используйте `snake_case` для имен инструментов (например, `get_current_date`).
- **Комментарии**: Пишите комментарии на английском языке.
- **Параметры**: Если инструмент требует параметров, передайте их через объект `params` в методе `execute`.
- **Асинхронность**: Если операция занимает время, используйте асинхронные методы (`async/await`).
- **Обработка ошибок**: Рекомендуется добавить обработку ошибок в метод `execute`.

## Дополнительные ресурсы

- Базовый класс `Tool`: `app/Ai/Tool.js`
- Другие инструменты: папка `app/Tools/`
