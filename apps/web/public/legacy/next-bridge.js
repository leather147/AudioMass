(function (w) {
	'use strict';

	var CHANNEL = 'audiomass.editor.v1';
	var EVENT_NAMES = {
		DidLoadFile: 'editor.file-loaded',
		RequestPause: 'editor.pause',
		DidPlay: 'editor.play'
	};

	function send (eventName, payload) {
		if (w.parent === w) return;
		w.parent.postMessage({ channel: CHANNEL, event: eventName, payload: payload }, w.location.origin);
	}

	function validPreferences (value) {
		return value && typeof value === 'object' &&
			typeof value.locale === 'string' && typeof value.theme === 'string';
	}

	function preferences () {
		return {
			locale: w.AMI18n && w.AMI18n.getLocale ? w.AMI18n.getLocale() : 'ru',
			theme: w.AMTheme && w.AMTheme.get ? w.AMTheme.get().id : 'replicate'
		};
	}

	w.AMInstallNextBridge = function (editor) {
		if (!editor || typeof editor.fireEvent !== 'function') return;
		if (w.__amNextBridgeInstalled) return;
		w.__amNextBridgeInstalled = true;

		Object.keys(EVENT_NAMES).forEach(function (editorEvent) {
			editor.listenFor(editorEvent, function (payload) {
				send(EVENT_NAMES[editorEvent], payload);
			});
		});

		w.addEventListener('message', function (event) {
			if (event.source !== w.parent || event.origin !== w.location.origin) return;
			var message = event.data;
			if (!message || message.channel !== CHANNEL || typeof message.command !== 'string') return;

			if (message.command === 'playback.play') editor.fireEvent('RequestPlay');
			if (message.command === 'playback.pause') editor.fireEvent('RequestPause');
			if (message.command === 'preferences.apply' && validPreferences(message.payload)) {
				if (w.AMTheme && typeof w.AMTheme.set === 'function') w.AMTheme.set(message.payload.theme);
				if (w.AMI18n && typeof w.AMI18n.setLocale === 'function' &&
					w.AMI18n.getLocale() !== message.payload.locale) {
					w.AMI18n.setLocale(message.payload.locale);
				}
			}
		}, false);

		if (w.AMPreferences && typeof w.AMPreferences.onChange === 'function') {
			w.AMPreferences.onChange(function () {
				send('preferences.changed', preferences());
			});
		}

		setTimeout(function () { send('editor.ready'); }, 0);
	};
})(window);
