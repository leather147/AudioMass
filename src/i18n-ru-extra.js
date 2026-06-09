(function (w, d) {
	'use strict';

	var lang = 'ru';
	try {
		lang = (w.localStorage && w.localStorage.getItem('lang')) || 'ru';
	} catch (e) {}
	if (lang !== 'ru') return;

	var ru = {
		/* Marker context menus */
		'Rename Marker':'Переименовать маркер',
		'Delete Marker':'Удалить маркер',
		'Play From Here':'Воспроизвести отсюда',
		'Add Marker Here':'Добавить маркер здесь',
		'Marker Name':'Название маркера',
		'Name is too short...':'Слишком короткое название...',
		'Load Markers':'Загрузить маркеры',
		'Clear Markers':'Очистить маркеры',
		'Add Marker':'Добавить маркер',
		'Marker':'Маркер',

		/* Multitrack context / controls */
		'Pan L/R':'Панорама Л/П',
		'Delete Channel':'Удалить канал',
		'Mute Channel':'Заглушить канал',
		'Solo Channel':'Соло канала',
		'Arm Channel':'Подготовить канал к записи',
		'Rename Channel':'Переименовать канал',
		'Resize Channel':'Изменить высоту канала',
		'Reorder Channel':'Изменить порядок каналов',
		'Move Channel Up':'Переместить канал вверх',
		'Move Channel Down':'Переместить канал вниз',
		'Clear Mute':'Снять Mute со всех',
		'Clear Solo':'Снять Solo со всех',
		'Add Clip':'Добавить клип',
		'Rename Clip':'Переименовать клип',
		'Duplicate Clip':'Дублировать клип',
		'Move Clip':'Переместить клип',
		'Trim Clip':'Обрезать клип',
		'Fade Clip':'Фейд клипа',
		'Crossfade Clip':'Кроссфейд клипа',
		'Remove Crossfade':'Удалить кроссфейд',
		'Removed Crossfade':'Кроссфейд удалён',
		'No overlap on this channel':'На этом канале нет наложения',
		'Recording':'Запись',
		'Audio':'Аудио',
		'Channel':'Канал',
		'Channel 1':'Канал 1',
		'Channel 2':'Канал 2',
		'Channel 3':'Канал 3',
		'Channel 4':'Канал 4',
		'Channel 5':'Канал 5',
		'Channel 6':'Канал 6',
		'MultiTrack':'Мультитрек',
		'Multitrack':'Мультитрек',
		'Beta':'Бета',
		'Toggle Beat Markers':'Переключить бит‑маркеры',
		'Snap to Beat Markers':'Привязка к бит‑маркерам',
		'Time Signature':'Музыкальный размер',
		'BEAT':'БИТ',
		'SNAP':'СНАП',

		/* Export / local drafts / generic remaining UI */
		'Save changes':'Сохранить изменения',
		'Saved session':'Сессия сохранена',
		'Loaded session':'Сессия загружена',
		'Could not save session':'Не удалось сохранить сессию',
		'Could not load session':'Не удалось загрузить сессию',
		'Nothing to save':'Нечего сохранять',
		'Load audio first':'Сначала загрузите аудио',
		'Drop audio here':'Перетащите аудио сюда',
		'Drag and drop audio files here':'Перетащите аудиофайлы сюда',
		'Open sample':'Открыть пример',
		'Open Sample':'Открыть пример',
		'Open file':'Открыть файл',
		'Open File':'Открыть файл',
		'Open URL':'Открыть URL',
		'Load URL':'Загрузить URL',
		'Paste URL':'Вставьте URL',
		'Save / Export':'Сохранить / экспорт',
		'Export / Download':'Экспорт / скачать',
		'Download File':'Скачать файл',
		'Export File':'Экспортировать файл',
		'Current Time':'Текущее время',
		'Cursor':'Курсор',
		'Beginning':'Начало',
		'Ending':'Конец',
		'Length':'Длина',
		'Clear selection':'Очистить выделение',
		'Clear Selection':'Очистить выделение',
		'Clear selection':'Очистить выделение',
		'Selection Start':'Начало выделения',
		'Selection End':'Конец выделения',
		'Selection Duration':'Длительность выделения',
		'From':'От',
		'To':'До',
		'Apply Effect':'Применить эффект',
		'Apply Filter':'Применить фильтр',
		'Preview Effect':'Предпрослушать эффект',
		'Stop Preview':'Остановить предпрослушивание',
		'Bypass':'Обход',
		'Wet':'Обработка',
		'Dry':'Исходный',
		'Amount':'Интенсивность',
		'Threshold':'Порог',
		'Ratio':'Соотношение',
		'Attack':'Атака',
		'Release':'Релиз',
		'Knee':'Колено',
		'Frequency':'Частота',
		'Quality':'Добротность',
		'Lowpass':'НЧ‑фильтр',
		'Highpass':'ВЧ‑фильтр',
		'Bandpass':'Полосовой фильтр',
		'Lowshelf':'НЧ‑полка',
		'Highshelf':'ВЧ‑полка',
		'Peaking':'Пиковый',
		'Notch':'Вырез',
		'Allpass':'Всепропускающий',
		'Left':'Левый',
		'Right':'Правый',
		'Swap Channels':'Поменять каналы местами',
		'Flip Channels':'Инвертировать каналы',
		'Invert':'Инвертировать',
		'Reverse':'Реверс',
		'Amplify':'Усилить',
		'Hard Limit':'Жёсткий лимитер',
		'Noise Gate':'Шумовой гейт',
		'Repair':'Восстановить',
		'Remove DC Offset':'Убрать DC‑смещение',
		'Trim Silence':'Обрезать тишину',
		'Open in new editor':'Открыть в новом редакторе',
		'Open In New Editor':'Открыть в новом редакторе',
		'Create Loop':'Создать цикл',
		'Loop Preview':'Предпрослушивание цикла',
		'Crossfade Preview':'Предпрослушивание кроссфейда',
		'Zero Crossing':'Нулевое пересечение',
		'Zero-crossing snap':'Привязка к нулевому пересечению',
		'Update ready':'Доступно обновление',
		'Reload':'Перезагрузить',
		'Keyboard Shortcuts':'Горячие клавиши',
		'Click to edit':'Нажмите, чтобы изменить',
		'Double click to reset':'Двойной клик — сброс',
		'Right click for menu':'Правый клик — меню',
		'Go':'Перейти',
		'Save':'Сохранить',
		'Cancel':'Отмена',
		'Close':'Закрыть',
		'Delete':'Удалить',
		'Rename':'Переименовать',
		'Play':'Воспроизвести',
		'Stop':'Стоп',
		'Pause':'Пауза'
	};

	var phrase = [
		[/\bRename Marker\b/g, 'Переименовать маркер'],
		[/\bDelete Marker\b/g, 'Удалить маркер'],
		[/\bPlay From Here\b/g, 'Воспроизвести отсюда'],
		[/\bAdd Marker Here\b/g, 'Добавить маркер здесь'],
		[/\bMarker Name\b/g, 'Название маркера'],
		[/\bClear selection\b/gi, 'Очистить выделение'],
		[/\bOpen in New\b/g, 'Открыть в новом'],
		[/\bOpen in Existing\b/g, 'Открыть в текущем'],
		[/\bApply to Selection\b/g, 'Применить к выделению'],
		[/\bPlay From\b/g, 'Воспроизвести с'],
		[/\bChannel\s+(\d+)\b/g, 'Канал $1'],
		[/\bMarker\s+(\d+)\b/g, 'Маркер $1']
	];

	function clean (value) {
		return (value || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
	}

	function translateString (value) {
		var key = clean(value);
		var out = ru[key];
		if (!out) {
			out = value;
			for (var i = 0; i < phrase.length; ++i) out = out.replace(phrase[i][0], phrase[i][1]);
		}
		return out || value;
	}

	function skip (node) {
		var el = node.nodeType === 1 ? node : node.parentNode;
		while (el && el !== d.body) {
			if (/^(SCRIPT|STYLE|CODE|PRE|CANVAS|SVG)$/.test(el.tagName || '')) return true;
			if (el.classList && el.classList.contains('notranslate')) return true;
			el = el.parentNode;
		}
		return false;
	}

	function translateElement (el) {
		if (!el || el.nodeType !== 1 || skip(el)) return;

		['title', 'aria-label', 'placeholder', 'alt', 'data-title'].forEach(function (name) {
			var val = el.getAttribute && el.getAttribute(name);
			if (!val) return;
			var next = translateString(val);
			if (next !== val) el.setAttribute(name, next);
		});

		if ((el.tagName === 'INPUT' || el.tagName === 'BUTTON') && typeof el.value === 'string') {
			var v = translateString(el.value);
			if (v !== el.value) el.value = v;
		}
	}

	function translateText (node) {
		if (!node || node.nodeType !== 3 || skip(node)) return;
		var val = node.nodeValue;
		var next = translateString(val);
		if (next !== val) node.nodeValue = next;
	}

	function walk (root) {
		if (!root) return;
		if (root.nodeType === 3) return translateText(root);
		if (root.nodeType === 1) translateElement(root);
		var walker = d.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, null, false);
		var node;
		while ((node = walker.nextNode())) {
			if (node.nodeType === 3) translateText(node);
			else translateElement(node);
		}
	}

	var pending = 0;
	function schedule () {
		if (pending) return;
		pending = w.requestAnimationFrame(function () {
			pending = 0;
			walk(d.body || d.documentElement);
		});
	}

	function start () {
		walk(d.body || d.documentElement);
		new MutationObserver(schedule).observe(d.documentElement, {
			childList:true,
			subtree:true,
			characterData:true,
			attributes:true,
			attributeFilter:['title', 'aria-label', 'placeholder', 'alt', 'data-title']
		});
		['click', 'mousedown', 'mouseup', 'contextmenu', 'keyup', 'input'].forEach(function (ev) {
			d.addEventListener(ev, schedule, true);
		});
		[80, 240, 600, 1200, 2400].forEach(function (ms) { w.setTimeout(schedule, ms); });
	}

	if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', start, false);
	else start();
})(window, document);
