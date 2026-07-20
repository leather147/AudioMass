(function (w, d) {
	'use strict';

	var messages = {
		'AudioMass - Audio Editor':'AudioMass — аудиоредактор',
		'File':'Файл', 'Edit':'Правка', 'View':'Вид', 'Effects':'Эффекты', 'Help':'Помощь',
		'Settings':'Настройки', 'Color themes':'Цветовые темы', 'Language':'Язык',
		'Personalize the editor without interrupting your work.':'Настройте редактор, не прерывая работу.',
		'Choose a palette. Changes are applied instantly and saved on this device.':'Выберите палитру. Изменения применяются сразу и сохраняются на этом устройстве.',
		'The editor reloads once when you change the interface language.':'При смене языка интерфейса редактор перезагрузится один раз.',
		'Dark theme':'Тёмная тема', 'Light theme':'Светлая тема', 'Close':'Закрыть',
		'English':'English', 'Russian':'Русский', 'Русский':'Русский',
		'Export / Download':'Экспорт / загрузка', 'Export':'Экспорт', 'Download':'Скачать',
		'Open':'Открыть', 'Open File':'Открыть файл', 'Open file':'Открыть файл', 'Open URL':'Открыть URL',
		'Open Local Drafts':'Открыть локальные черновики', 'Local Drafts':'Локальные черновики',
		'Open in Existing?':'Открыть в текущем окне?',
		'Open in new window, or in the current one?':'Открыть в новом окне или в текущем?',
		'Open in new window?':'Открыть в новом окне?', 'Successfully Stored':'Успешно сохранено',
		'OPEN':'ОТКРЫТЬ', 'OPEN IN NEW':'ОТКРЫТЬ В НОВОМ', 'OPEN IN NEW WINDOW':'ОТКРЫТЬ В НОВОМ ОКНЕ',
		'Save':'Сохранить', 'Save Project':'Сохранить проект', 'Load Project':'Загрузить проект',
		'New Project':'Новый проект', 'New Window':'Новое окно', 'Save / Export':'Сохранить / экспорт',
		'Undo':'Отмена', 'Redo':'Повтор', 'Copy':'Копировать', 'Cut':'Вырезать', 'Paste':'Вставить',
		'Trim':'Обрезать', 'Silence':'Тишина', 'Delete':'Удалить', 'Duplicate':'Дублировать',
		'Rename':'Переименовать', 'Select All':'Выделить всё', 'Deselect All':'Снять выделение',
		'Select Visible View':'Выделить видимую область', 'Clear Selection':'Очистить выделение',
		'Clear Selection (Q key)':'Очистить выделение (клавиша Q)',
		'Selection:':'Выделение:', 'Start:':'Начало:', 'End:':'Конец:', 'Duration:':'Длительность:',
		'Set Volume/Gain':'Задать громкость/усиление', 'Insert Silence':'Вставить тишину',
		'Center to Cursor':'Центрировать по курсору', 'Reset Zoom':'Сбросить масштаб',
		'Zoom In Horiz (+)':'Увеличить по горизонтали (+)', 'Zoom Out Horiz (-)':'Уменьшить по горизонтали (-)',
		'Zoom In Vertically':'Увеличить по вертикали', 'Zoom Out Vertically':'Уменьшить по вертикали',
		'Play':'Воспроизвести', 'Play (Space)':'Воспроизвести (Пробел)', 'Stop':'Стоп',
		'Stop Playback (Space)':'Остановить воспроизведение (Пробел)', 'Pause':'Пауза',
		'Pause (Shift+Space)':'Пауза (Shift+Пробел)', 'Toggle Loop (L)':'Включить/выключить цикл (L)',
		'Record':'Запись', 'Record (R)':'Запись (R)', 'Follow Cursor':'Следовать за курсором',
		'Peak Separators':'Разделители пиков', 'Timeline':'Шкала времени',
		'Frequency Analyser':'Анализатор частот', 'Spectrum Analyser':'Спектральный анализатор',
		'Multitrack Mixer':'Мультитрековый микшер', 'Tempo Tools':'Инструменты темпа',
		'ID3 Tags':'Теги ID3', 'Channel Info/Flip':'Информация/инверсия каналов',
		'Seamless Loop':'Бесшовный цикл', 'Seamless Loop...':'Бесшовный цикл...',
		'About':'О программе', 'See Welcome Message':'Показать приветствие',
		'Oops! Something is not right':'Ошибка: что-то пошло не так',
		'CANCEL':'ОТМЕНА', 'Cancel':'Отмена', 'cancel':'Отмена', 'OK':'ОК', 'Go':'Перейти',
		'Preview':'Предпрослушать', 'ON':'ВКЛ', 'OFF':'ВЫКЛ', 'Apply':'Применить',
		'Gain':'Усиление', 'Fade In':'Появление', 'Fade Out':'Затухание',
		'Compressor':'Компрессор', 'Normalize':'Нормализация', 'Graphic EQ':'Графический эквалайзер',
		'Parametric EQ':'Параметрический эквалайзер', 'Distortion':'Дисторшн',
		'Reverb':'Реверберация', 'Delay':'Задержка', 'Hard Limiter':'Жёсткий лимитер',
		'Channel Copier':'Копирование каналов', 'Noise Reduction':'Шумоподавление',
		'Pitch Shift':'Сдвиг высоты', 'Change Speed':'Изменить скорость',
		'Playback Rate':'Скорость воспроизведения', 'Audio Repair':'Восстановление аудио',
		'Remove Clicks':'Удалить щелчки', 'Remove Hum':'Удалить гул',
		'Please Wait...':'Пожалуйста, подождите...', 'Please Wait':'Пожалуйста, подождите',
		'Drag n drop an Audio File in this window, or click':'Перетащите аудиофайл в это окно или нажмите',
		'Drag and Drop Audio Files in this window, or click':'Перетащите аудиофайлы в это окно или нажмите',
		'here to use a sample':'здесь, чтобы использовать пример', 'Load audio first':'Сначала загрузите аудио',
		'Add Marker':'Добавить маркер', 'Rename Marker':'Переименовать маркер',
		'Delete Marker':'Удалить маркер', 'Play From Here':'Воспроизвести отсюда',
		'Add Marker Here':'Добавить маркер здесь', 'Marker Name':'Название маркера',
		'Add Channel':'Добавить канал', 'Add channel':'Добавить канал', 'Channels':'Каналы',
		'Rename Channel':'Переименовать канал', 'Remove Channel':'Удалить канал',
		'Delete Channel':'Удалить канал', 'Arm Channel':'Подготовить канал к записи',
		'Volume Channel':'Громкость канала', 'Pan Channel':'Панорама канала',
		'Resize Channel':'Изменить высоту канала', 'Reorder Channel':'Изменить порядок каналов',
		'Move Channel Up':'Переместить канал вверх', 'Move Channel Down':'Переместить канал вниз',
		'Clear Mute':'Снять Mute со всех', 'Clear Solo':'Снять Solo со всех',
		'Add Tracks':'Добавить дорожки', 'Add Clip':'Добавить клип', 'Rename Clip':'Переименовать клип',
		'Duplicate Clip':'Дублировать клип', 'Move Clip':'Переместить клип', 'Trim Clip':'Обрезать клип',
		'Fade Clip':'Фейд клипа', 'Crossfade Clip':'Кроссфейд клипа',
		'Remove Crossfade':'Удалить кроссфейд', 'Recording':'Запись', 'Audio':'Аудио',
		'Channel':'Канал', 'MultiTrack':'Мультитрек', 'Multitrack':'Мультитрек', 'Beta':'Бета',
		'Toggle Beat Markers':'Переключить бит-маркеры', 'Snap to Beat Markers':'Привязка к бит-маркерам',
		'Time Signature':'Музыкальный размер', 'BEAT':'БИТ', 'SNAP':'СНАП', 'BPM':'БПМ',
		'Mute':'Беззвучие', 'Solo':'Соло', 'Rec Trigger':'Триггер записи',
		'Current Time':'Текущее время', 'Cursor':'Курсор', 'Beginning':'Начало', 'Ending':'Конец',
		'Length':'Длина', 'Selection':'Выделение', 'Start':'Начало', 'End':'Конец',
		'Duration':'Длительность', 'Input':'Вход', 'Output':'Выход', 'Source':'Источник',
		'Destination':'Назначение', 'Sample Rate':'Частота дискретизации', 'Bit Depth':'Битность',
		'Welcome to AudioMass':'Добро пожаловать в AudioMass'
	};

	var phrases = [
		[/\bChannel\s+(\d+)\b/g, 'Канал $1'],
		[/\bMarker\s+(\d+)\b/g, 'Маркер $1'],
		[/\bPlay From\b/g, 'Воспроизвести с']
	];

	w.AMI18n.register('ru', messages, {
		phrases:phrases,
		onApply:function () {
			var description = 'AudioMass — бесплатный полнофункциональный веб-редактор аудио и звуковой волны.';
			var selectors = ['meta[name="description"]', 'meta[property="og:description"]', 'meta[name="twitter:description"]'];
			for (var i = 0; i < selectors.length; ++i) {
				var meta = d.querySelector(selectors[i]);
				if (meta) meta.setAttribute('content', description);
			}
			if (messages[d.title]) d.title = messages[d.title];
		}
	});
})(window, document);
