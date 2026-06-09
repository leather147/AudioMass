(function (w, d) {
	'use strict';

	var lang = 'ru';
	try {
		lang = (w.localStorage && w.localStorage.getItem('lang')) || 'ru';
	} catch (e) {}

	if (lang !== 'ru') return;

	d.documentElement.lang = 'ru';

	var desc = 'AudioMass — бесплатный полнофункциональный веб‑редактор аудио и звуковой волны.';
	var metaDescription = d.querySelector('meta[name="description"]');
	var ogDescription = d.querySelector('meta[property="og:description"]');
	var twDescription = d.querySelector('meta[name="twitter:description"]');
	if (metaDescription) metaDescription.setAttribute('content', desc);
	if (ogDescription) ogDescription.setAttribute('content', desc);
	if (twDescription) twDescription.setAttribute('content', desc);

	function clean (value) {
		return (value || '')
			.replace(/\u00a0/g, ' ')
			.replace(/\s+/g, ' ')
			.trim();
	}

	var text = {
		'AudioMass - Audio Editor':'AudioMass — аудиоредактор',
		'AudioMass - About':'AudioMass — о проекте',
		'File':'Файл',
		'Edit':'Правка',
		'View':'Вид',
		'Effects':'Эффекты',
		'Help':'Помощь',
		'Language':'Язык',
		'English':'English',
		'Русский':'Русский',
		'Export / Download':'Экспорт / загрузка',
		'Export':'Экспорт',
		'Download':'Скачать',
		'Open':'Открыть',
		'Open File':'Открыть файл',
		'Open Local Drafts':'Открыть локальные черновики',
		'Local Drafts':'Локальные черновики',
		'Open in Existing?':'Открыть в текущем окне?',
		'Open in new window, or in the current one?':'Открыть в новом окне или в текущем?',
		'OPEN':'ОТКРЫТЬ',
		'OPEN IN NEW':'ОТКРЫТЬ В НОВОМ',
		'Save':'Сохранить',
		'Save Project':'Сохранить проект',
		'Load Project':'Загрузить проект',
		'New Project':'Новый проект',
		'New Window':'Новое окно',
		'Undo':'Отмена',
		'Redo':'Повтор',
		'Copy':'Копировать',
		'Cut':'Вырезать',
		'Paste':'Вставить',
		'Trim':'Обрезать',
		'Silence':'Тишина',
		'Delete':'Удалить',
		'Duplicate':'Дублировать',
		'Rename':'Переименовать',
		'Select All':'Выделить всё',
		'Deselect All':'Снять выделение',
		'Select Visible View':'Выделить видимую область',
		'Set Volume/Gain':'Задать громкость/усиление',
		'Insert Silence':'Вставить тишину',
		'Center to Cursor':'Центрировать по курсору',
		'Reset Zoom':'Сбросить масштаб',
		'Zoom In Horiz (+)':'Увеличить по горизонтали (+)',
		'Zoom Out Horiz (-)':'Уменьшить по горизонтали (-)',
		'Reset Zoom (0)':'Сброс масштаба (0)',
		'Zoom In Vertically':'Увеличить по вертикали',
		'Zoom Out Vertically':'Уменьшить по вертикали',
		'Play':'Воспроизвести',
		'Play (Space)':'Воспроизвести (Пробел)',
		'Stop':'Стоп',
		'Stop Playback (Space)':'Остановить воспроизведение (Пробел)',
		'Pause':'Пауза',
		'Pause (Shift+Space)':'Пауза (Shift+Пробел)',
		'Toggle Loop (L)':'Включить/выключить цикл (L)',
		'Seek (left arrow)':'Перемотка назад (стрелка влево)',
		'Seek (right arrow)':'Перемотка вперёд (стрелка вправо)',
		'Seek Start (Shift + left arrow)':'К началу (Shift + стрелка влево)',
		'Seek End (Shift + right arrow)':'К концу (Shift + стрелка вправо)',
		'Record':'Запись',
		'Record (R)':'Запись (R)',
		'Follow Cursor':'Следовать за курсором',
		'Peak Separators':'Разделители пиков',
		'Timeline':'Шкала времени',
		'Frequency Analyser':'Анализатор частот',
		'Spectrum Analyser':'Спектральный анализатор',
		'Multitrack Mixer':'Мультитрековый микшер',
		'Tempo Tools':'Инструменты темпа',
		'ID3 Tags':'Теги ID3',
		'Channel Info/Flip':'Информация/инверсия каналов',
		'Seamless Loop':'Бесшовный цикл',
		'Seemless Loop':'Бесшовный цикл',
		'Seamless Loop...':'Бесшовный цикл...',
		'About':'О программе',
		'See Welcome Message':'Показать приветствие',
		'Oops! Something is not right':'Ошибка: что-то пошло не так',
		'CANCEL':'ОТМЕНА',
		'Cancel':'Отмена',
		'OK':'ОК',
		'Go':'Перейти',
		'Preview':'Предпрослушать',
		'ON':'ВКЛ',
		'OFF':'ВЫКЛ',
		'Toggle Bypass':'Включить/выключить обход эффекта',
		'Apply':'Применить',
		'Apply Gain':'Применить усиление',
		'Apply Gain to selected range':'Применить усиление к выделенному фрагменту',
		'Gain':'Усиление',
		'Gain percentage':'Процент усиления',
		'Change Speed':'Изменить скорость',
		'Playback Rate':'Скорость воспроизведения',
		'Apply Rate':'Применить скорость',
		'A lot slower':'Намного медленнее',
		'Slightly slower':'Чуть медленнее',
		'Slightly faster':'Чуть быстрее',
		'Blazing Fast':'Очень быстро',
		'Compressor':'Компрессор',
		'Distortion':'Дисторшн',
		'Reverb':'Реверберация',
		'Delay':'Задержка',
		'Normalize':'Нормализация',
		'Normalization':'Нормализация',
		'Fade In':'Плавное появление',
		'Fade Out':'Плавное затухание',
		'Pitch Shift':'Сдвиг высоты тона',
		'Pitch / Speed Profile':'Профиль высоты/скорости',
		'Graph-based pitch / speed profiles':'Графические профили высоты/скорости',
		'Audio Repair':'Восстановление аудио',
		'Click, hum and edit repair':'Удаление щелчков, гула и грубых склеек',
		'Load audio first':'Сначала загрузите аудио',
		'File Name':'Имя файла',
		'Format':'Формат',
		'Mono':'Моно',
		'Stereo':'Стерео',
		'Export whole file':'Экспортировать весь файл',
		'Export Selection Only':'Экспортировать только выделение',
		'session file (.amss)':'файл сессии (.amss)',
		'TPDF dither':'TPDF-дизеринг',
		'Flac: Compression Level':'FLAC: уровень сжатия',
		'No drafts found...':'Черновики не найдены...',
		'Copy to Clipboard':'Скопировать в буфер',
		'Add Marker Here':'Добавить маркер здесь',
		'Edit Marker':'Редактировать маркер',
		'Delete Marker':'Удалить маркер',
		'Add Channel':'Добавить канал',
		'Remove Channel':'Удалить канал',
		'Add Track':'Добавить трек',
		'Remove Track':'Удалить трек',
		'Mute':'Заглушить',
		'Solo':'Соло',
		'Arm':'Запись',
		'Volume':'Громкость',
		'Pan':'Панорама',
		'Mixdown':'Свести',
		'Bounce':'Свести',
		'Clip':'Клип',
		'Split':'Разделить',
		'Crossfade':'Кроссфейд',
		'Name':'Название',
		'Apply to Selection':'Применить к выделению',
		'Apply to Clip':'Применить к клипу',
		'Apply to File':'Применить к файлу',
		'Open in New Editor':'Открыть в новом редакторе',
		'Repeat':'Повторять',
		'Loop':'Цикл',
		'Snap':'Привязка',
		'Snap to Beat':'Привязка к биту',
		'BPM':'BPM',
		'Detect Tempo':'Определить темп',
		'Metronome':'Метроном',
		'Loading...':'Загрузка...',
		'Processing...':'Обработка...',
		'Rendering...':'Рендеринг...',
		'Please wait...':'Пожалуйста, подождите...',
		'Error':'Ошибка',
		'Warning':'Предупреждение',
		'Ready':'Готово',
		'Done':'Готово',
		'Close':'Закрыть',
		'Yes':'Да',
		'No':'Нет',
		'Back':'Назад',
		'Next':'Далее',
		'Remove':'Удалить',
		'Clear':'Очистить',
		'Reset':'Сбросить',
		'Default':'По умолчанию',
		'Custom':'Пользовательский',
		'Preset':'Пресет',
		'Presets':'Пресеты',
		'Save Preset':'Сохранить пресет',
		'Delete Preset':'Удалить пресет',
		'Settings':'Настройки',
		'Input':'Вход',
		'Output':'Выход',
		'Source':'Источник',
		'Destination':'Назначение',
		'Selection':'Выделение',
		'Current Selection':'Текущее выделение',
		'Whole File':'Весь файл',
		'Whole Clip':'Весь клип',
		'Start':'Начало',
		'End':'Конец',
		'Duration':'Длительность',
		'Channels':'Каналы',
		'Sample Rate':'Частота дискретизации',
		'Bit Depth':'Битность',
		'Welcome to AudioMass':'Добро пожаловать в AudioMass',
		'About AudioMass':'О программе AudioMass'
	};

	var attr = {
		'mp3 filename':'имя mp3-файла',
		'filename':'имя файла',
		'File Name':'Имя файла',
		'Name':'Название'
	};

	function translateValue (value) {
		var key = clean(value);
		return text[key] || attr[key] || value;
	}

	function translateTextNode (node) {
		var original = node.nodeValue;
		var key = clean(original);
		if (!key || !text[key]) return;
		node.nodeValue = original.replace(key, text[key]);
	}

	function shouldSkip (node) {
		var el = node.nodeType === 1 ? node : node.parentNode;
		while (el && el !== d.body) {
			if (/^(SCRIPT|STYLE|CODE|PRE|CANVAS|SVG)$/.test(el.tagName)) return true;
			if (el.classList && el.classList.contains('notranslate')) return true;
			el = el.parentNode;
		}
		return false;
	}

	function translateElement (el) {
		if (!el || el.nodeType !== 1 || shouldSkip(el)) return;

		['title', 'aria-label', 'placeholder', 'alt'].forEach(function (name) {
			var val = el.getAttribute && el.getAttribute(name);
			if (!val) return;
			var translated = translateValue(val);
			if (translated !== val) el.setAttribute(name, translated);
		});

		if ((el.tagName === 'INPUT' || el.tagName === 'BUTTON') && typeof el.value === 'string') {
			var translatedValue = translateValue(el.value);
			if (translatedValue !== el.value) el.value = translatedValue;
		}
	}

	function walk (root) {
		if (!root) return;
		if (root.nodeType === 3) {
			if (!shouldSkip(root)) translateTextNode(root);
			return;
		}
		if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
		if (root.nodeType === 1) translateElement(root);
		var walker = d.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, null, false);
		var node;
		while ((node = walker.nextNode())) {
			if (node.nodeType === 3) {
				if (!shouldSkip(node)) translateTextNode(node);
			} else {
				translateElement(node);
			}
		}
	}

	function setAboutRu () {
		if (!/about\.html(?:$|[?#])/.test(w.location.pathname + w.location.search)) return;
		d.title = 'AudioMass — о проекте';
		var wroot = d.getElementById('w');
		if (!wroot) return;
		wroot.innerHTML = '\
<div>\
<h1>AudioMass — открытый веб‑редактор аудио и звуковой волны.</h1>\
<img class="top" src="/about/audiomass_top.jpg" />\
<p>AudioMass позволяет записывать звук или использовать уже готовые аудиофайлы, редактировать их, обрезать, вырезать, вставлять фрагменты и применять эффекты: компрессию, параметрический эквалайзер, реверберацию, задержку, восстановление, изменение высоты и скорости, а также мультитрековое сведение. Редактор поддерживает горячие клавиши, автономную работу и адаптивный интерфейс, чтобы быстрые правки действительно оставались быстрыми.</p>\
<p>Проект написан на обычном JavaScript без серверной части и без фреймворков.</p>\
<img class="mid" src="/about/audiomass_support.jpg" />\
<p>Редактор хорошо работает в современных браузерах и на разных устройствах.</p>\
<h5>:: Возможности ::</h5>\
<ul>\
<li><a href="#getting-started">Загрузка аудио, навигация по волне, масштаб и панорамирование</a></li>\
<li><a href="#waveform-tools">Визуализация частот и уровней</a></li>\
<li><a href="#waveform-tools">Индикация пиков и перегруза</a></li>\
<li><a href="#waveform-tools">Вырезание, вставка и обрезка фрагментов</a></li>\
<li><a href="#waveform-tools">Инверсия и реверс аудио</a></li>\
<li><a href="#waveform-tools">Инструменты выделения по нулевому пересечению</a></li>\
<li><a href="#markers">Маркеры для cue-точек и быстрых переходов</a></li>\
<li><a href="#beat-tools">Автоопределение темпа, бит‑сетка и привязка к биту</a></li>\
<li><a href="#recording-audio">Запись аудио</a></li>\
<li><a href="#export-mp3">Экспорт в mp3</a></li>\
<li><a href="#effects">Громкость, fades, компрессор, реверберация, задержка и repair‑инструменты</a></li>\
<li><a href="#seamless-loops">Создание бесшовных лупов с предпрослушиванием кроссфейда</a></li>\
<li><a href="#undo-offline">История действий и работа офлайн</a></li>\
<li><a href="#multitrack">Мультитрековое редактирование и сведение</a></li>\
<li><a href="#changelog">Последние изменения</a></li>\
</ul>\
<p>И всё это остаётся очень лёгким для браузера.</p>\
</div>\
<div>\
<h3 id="getting-started">Начало работы</h3>\
<p>Чтобы начать, перетащите аудиофайл в окно редактора или откройте пример. После загрузки появится волна: её можно масштабировать, перемещать и выделять нужные участки.</p>\
<img class="mid" src="/about/audiomass_2.jpg" />\
<h3 id="waveform-tools">Инструменты волны</h3>\
<p>Основной редактор построен вокруг быстрого редактирования областей. Выделите часть волны, чтобы вырезать, скопировать, вставить, обрезать, заглушить, развернуть, инвертировать или обработать только этот фрагмент. Интерфейс также показывает частоты, пики, перегруз и нулевые пересечения, чтобы проще находить проблемные места и делать чистые склейки.</p>\
<h3 id="markers">Маркеры</h3>\
<p>Маркеры — это небольшие именованные точки на волне. Нажмите <i>[M]</i>, дважды кликните по верхней линейке или выберите <i>Добавить маркер здесь</i> в контекстном меню. Маркеры можно перемещать, переименовывать, удалять и использовать для быстрых переходов.</p>\
<h3 id="beat-tools">Инструменты темпа</h3>\
<p>AudioMass умеет примерно определять темп, рисовать метрономную сетку и привязывать правки к битам. Это удобно для лупов, повторов и небольших правок тайминга без превращения интерфейса в полноценную DAW.</p>\
<h3 id="effects">Эффекты и обработка</h3>\
<p>В редакторе есть быстрые инструменты обработки: усиление, плавное появление и затухание, компрессор, нормализация, реверберация, задержка, дисторшн и сдвиг высоты. Есть графический профиль высоты/скорости и repair‑инструменты для щелчков, гула и грубых монтажных склеек. Большинство эффектов можно предпрослушать перед применением.</p>\
<h3 id="seamless-loops">Бесшовные лупы</h3>\
<p>Выделите область и используйте <i>Правка &gt; Бесшовный цикл</i> или выберите этот пункт в контекстном меню. Можно настроить кроссфейд, подрезать тишину по краям, привязаться к нулевым пересечениям, проверить луп на повторе и применить результат обратно к файлу.</p>\
<h3 id="undo-offline">Отмена и офлайн‑режим</h3>\
<p>AudioMass хранит историю действий, поэтому можно экспериментировать и откатывать ошибки. Редактор работает локально в браузере без серверной части и может продолжать работать офлайн после загрузки.</p>\
<h3 id="recording-audio">Запись аудио</h3>\
<p>Для записи нажмите кнопку записи или клавишу <i>[R]</i>.</p>\
<img class="mid" src="/about/audiomass_3.jpg" />\
<h3 id="export-mp3">Экспорт в mp3</h3>\
<p>Чтобы экспортировать результат, откройте <i>Файл</i>, выберите <i>Экспорт / загрузка</i> и задайте нужный формат.</p>\
<img class="mid" src="/about/audiomass_4.jpg" />\
</div>\
<hr />\
<div>\
<h3>Как устроен интерфейс</h3>\
<p>Интерфейс AudioMass построен на событиях: кнопки, горячие клавиши и состояние редактора не завязаны жёстко друг на друга, а общаются через запросы и события. Такой подход помогает держать интерфейс быстрым и отзывчивым даже при большом количестве инструментов.</p>\
<p>Проект остаётся довольно старошкольным по коду, но это осознанный компромисс: приоритетом были скорость, малый размер и практичность.</p>\
</div>\
<hr />\
<div>\
<h3>Отстыковываемые окна</h3>\
<p>Некоторые панели можно открывать отдельно, как в музыкальных программах. Это удобно, если нужно вынести анализатор, эффект или вспомогательное окно на другой экран.</p>\
<video src="/about/dock_ui.mp4" autoplay muted playsinline controls loop></video>\
</div>\
<hr />\
<div>\
<h3 id="multitrack">Мультитрек <small>(вернулся в 2026!)</small></h3>\
<img class="top" src="/about/multitrack.png" />\
<p>AudioMass теперь поддерживает полноценный мультитрековый режим: можно раскладывать несколько дорожек, двигать клипы, делать кроссфейды, записывать на вооружённые треки и сводить всё в один файл.</p>\
<p>Перетащите аудиофайлы на дорожку или на рабочую область — каждый файл станет клипом. Клип можно перемещать, обрезать за края, копировать, разделять, переименовывать и удалять. При наложении двух клипов редактор автоматически рисует кроссфейд.</p>\
<p>У каждой дорожки есть громкость, панорама, mute, solo и arm для записи. Есть отдельный микшер, если удобнее работать вертикальными полосами с большими индикаторами.</p>\
<p>Сессию можно сохранить в файл <i>.amss</i>, а позже открыть и продолжить работу с того же места. Для финального результата используйте <i>Сведение</i>.</p>\
<h5>:: Горячие клавиши мультитрека ::</h5>\
<ul>\
<li><i>[Пробел]</i>: воспроизведение / стоп &nbsp;&nbsp;&nbsp; <i>[Shift + Пробел]</i>: пауза</li>\
<li><i>[R]</i>: включить/выключить запись на выбранном треке</li>\
<li><i>[←]</i> / <i>[→]</i>: перемотка</li>\
<li><i>[Shift + ←]</i> / <i>[Shift + →]</i>: переход к краям области / началу / концу</li>\
<li><i>[↑]</i> / <i>[↓]</i>: выбрать предыдущий / следующий канал</li>\
<li><i>[Tab]</i>: центрировать вид по плейхеду</li>\
<li><i>[Ctrl/Cmd + X]</i>: разделить выбранный клип по плейхеду</li>\
<li><i>[X]</i>: включить/выключить кроссфейд между клипами</li>\
<li><i>[Ctrl/Cmd + C]</i> / <i>[Ctrl/Cmd + V]</i>: копировать / вставить клип</li>\
<li><i>[Backspace]</i> / <i>[Delete]</i>: удалить выбранный клип</li>\
<li><i>[Ctrl/Cmd + Z]</i> / <i>[Ctrl/Cmd + Y]</i>: отмена / повтор</li>\
<li><i>[Ctrl/Cmd + A]</i>: выделить всю аранжировку как область</li>\
<li><i>[Ctrl/Cmd + S]</i>: открыть меню сохранения / экспорта</li>\
<li><i>[Esc]</i>: закрыть открытое контекстное меню</li>\
</ul>\
</div>\
<hr />\
<div>\
<h3 id="changelog">Последние изменения</h3>\
<ul>\
<li><b>Июль 2022</b>: мультитрековый режим с клипами, фейдами, микшером, записью и сведением.</li>\
<li><b>Январь 2026</b>: файлы сессий <i>.amss</i> для сохранения и повторного открытия проектов.</li>\
<li><b>Февраль 2026</b>: профиль высоты/скорости с графическим редактированием и live‑preview.</li>\
<li><b>Март 2026</b>: автоопределение темпа, метрономная сетка и snap‑to‑beat.</li>\
<li><b>Апрель 2026</b>: новые repair‑инструменты для щелчков, гула и грубых склеек.</li>\
<li><b>Май 2026</b>: бесшовный цикл с предпрослушиванием кроссфейда.</li>\
</ul>\
</div>\
<hr />\
<div>\
<h3>Планы и производительность</h3>\
<p>В проекте ещё много пространства для оптимизации: можно уменьшать размер сборки, ускорять отрисовку волны, переносить долгие операции в фоновые потоки и улучшать работу на мобильных устройствах.</p>\
<p>Главное ограничение сейчас — сама тяжесть аудиообработки в браузере: большие файлы и длинные цепочки эффектов требуют аккуратного обращения с памятью и временем обработки.</p>\
</div>\
<br /><br /><br />';
	}

	function apply () {
		if (/about\.html(?:$|[?#])/.test(w.location.pathname + w.location.search)) setAboutRu();
		if (d.title && text[d.title]) d.title = text[d.title];
		walk(d.body || d.documentElement);
	}

	if (d.readyState === 'loading') {
		d.addEventListener('DOMContentLoaded', apply, false);
	} else {
		apply();
	}

	var pending = false;
	function schedule () {
		if (pending) return;
		pending = true;
		w.requestAnimationFrame(function () {
			pending = false;
			walk(d.body);
		});
	}

	new MutationObserver(function (mutations) {
		for (var i = 0; i < mutations.length; ++i) {
			if (mutations[i].addedNodes && mutations[i].addedNodes.length) {
				schedule();
				return;
			}
			if (mutations[i].type === 'characterData') {
				schedule();
				return;
			}
		}
	}).observe(d.documentElement, {
		childList:true,
		subtree:true,
		characterData:true
	});
})(window, document);
