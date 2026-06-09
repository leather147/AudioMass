(function ( w, d, PKAE ) {
'use strict';

setTimeout(function () {
	if (/(^|[?&])skipintro=1(&|$)/.test (w.location.search)) return ;
	var scroll_hint = 0;
	var showScrollHint = function () {
		var tbc, el, r;
		if (!PKAE.isMobile || scroll_hint) return ;
		scroll_hint = 1;
		tbc = PKAE.ui.el.getElementsByClassName ('pk_tbc')[0];
		if (!tbc || tbc.scrollWidth <= tbc.clientWidth + 2) return ;
		el = d.createElement ('i');
		r = tbc.getBoundingClientRect ();
		el.className = 'pk_tbhint';
		el.innerHTML = '&#8250;';
		el.style.top = ((r.top + r.height / 2 - 12) >> 0) + 'px';
		PKAE.ui.el.appendChild ( el );
		setTimeout (function () {
			el.parentNode && el.parentNode.removeChild ( el );
		}, 3000);
	};

	PKAudioEditor._deps.Wlc = function () {
			var body_str = '';
			var body_str2 = '';
			var mobile_note = '';

            // Локализуем приветственный текст и подсказки на русский язык
            if (PKAE.isMobile) {
                // Сообщение для мобильных устройств: оптимизировано под десктоп
                mobile_note = '(Оптимизировано для десктопа — извините)<br/><br/>';
                // Подсказка для пользователей мобильных устройств: убедитесь, что выключатель беззвучного режима выключен
                body_str = 'Советы:<br/>Пожалуйста, убедитесь, что ваше устройство не находится в беззвучном режиме. Возможно, вам нужно физически переключить ползунок беззвучного режима. '+
                '<img src="phone-switch.jpg" style="max-width:224px;max-height:126px;width:40%;margin: 10px auto; display: block;"/>'+
                '<br/><br/>';
            }
            else {
                // Подсказка для настольных компьютеров: многие сочетания клавиш используют Shift
                body_str = 'Советы:<br/>Имейте в виду, что большинство сочетаний клавиш используют комбинацию <strong>Shift + <u>клавиша</u></strong>. (например, Shift+Z — отмена, Shift+C — копирование, Shift+X — вырезание... и т.д.)<br/><br/>';
                // Ссылка на исходный код на GitHub
                body_str2 = 'Посмотрите исходный код на <a href="https://github.com/pkalogiros/audiomass" target="_blank">GitHub</a><br/><br/>'; // ссылка на репозиторий
            }

            // Диалог приветствия
            var md = new PKSimpleModal({
                // Заголовок приветственного окна
                title: '<font style="font-size:15px">Добро пожаловать в AudioMass</font>',
				ondestroy: function( q ) {
					PKAE.ui.InteractionHandler.on = false;
					PKAE.ui.KeyHandler.removeCallback ('modalTemp');
					showScrollHint ();
			},
            body:'<div style="overflow:auto;-webkit-overflow-scrolling:touch;max-width:580px;width:calc(100vw - 40px);max-height:calc(100vh - 340px);min-height:110px;font-size:13px; color:#95c6c6;padding-top:7px;">'+
                mobile_note+
                // Основной текст о приложении
                'AudioMass — это бесплатный, открытый, веб‑редактор аудио и формы волны.<br />Он полностью работает в вашем браузере без сервера и без необходимости в плагинах!'+
                '<br/><br/>'+
                body_str+
                'Вы можете загружать любой тип аудио, который поддерживает ваш браузер, и выполнять операции, такие как плавное появление/затухание, вырезание, обрезка, изменение громкости, '+
                'и применять множество аудиоэффектов.<br/><br/>'+
                body_str2+
                'Надеюсь, вам понравятся маленькие музыкальные композиции. Я написал их давным‑давно :)'+
                '</div>',
			setup:function( q ) {
					PKAE.ui.InteractionHandler.checkAndSet ('modal');
					PKAE.ui.KeyHandler.addCallback ('modalTemp', function ( e ) {
						q.Destroy ();
					}, [27]);

					// ------
					var scroll = q.el_body.getElementsByTagName('div')[0];
					scroll.addEventListener ('touchstart', function(e){
						e.stopPropagation ();
					}, false);
					scroll.addEventListener ('touchmove', function(e){
						e.stopPropagation ();
					}, false);

					// ------
				}
			});
			md.Show ();
            // Заменяем текст кнопки OK на русское «ОК»
            document.getElementsByClassName('pk_modal_cancel')[0].innerHTML = '&nbsp; &nbsp; &nbsp; ОК &nbsp; &nbsp; &nbsp;';
	};

	var change = 99;
	var exists = w.localStorage && w.localStorage.getItem ('k');

	if (!exists) {
		change = 0;
		w.localStorage && w.localStorage.setItem ('k', 1);
	}

	if ( ((Math.random () * 100) >> 0) < change) return ;
	PKAudioEditor._deps.Wlc ();

}, 320);

})( window, document, PKAudioEditor );
