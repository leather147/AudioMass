(function (w) {
	'use strict';

	var themes = [
		{id:'replicate', name:'Replicate', mode:'dark', background:'#050607', surface1:'#080a0d', surface2:'#0c0f12', surface3:'#12171d', surface4:'#1b222b', text:'#f6f7f8', textMuted:'#b2bcc8', textSubtle:'#7b8694', accent:'#43e4dc', accentAlt:'#8ef1ec', danger:'#ff4d5e', warning:'#facc15', success:'#34d399', solo:'#b993ff'},
		{id:'dracula', name:'Dracula', mode:'dark', background:'#191a21', surface1:'#21222c', surface2:'#282a36', surface3:'#343746', surface4:'#44475a', text:'#f8f8f2', textMuted:'#c6c8d1', textSubtle:'#85889a', accent:'#bd93f9', accentAlt:'#ff79c6', danger:'#ff5555', warning:'#f1fa8c', success:'#50fa7b', solo:'#8be9fd'},
		{id:'nord', name:'Nord', mode:'dark', background:'#242933', surface1:'#2e3440', surface2:'#3b4252', surface3:'#434c5e', surface4:'#4c566a', text:'#eceff4', textMuted:'#d8dee9', textSubtle:'#8793a5', accent:'#88c0d0', accentAlt:'#8fbcbb', danger:'#bf616a', warning:'#ebcb8b', success:'#a3be8c', solo:'#b48ead'},
		{id:'tokyo-night', name:'Tokyo Night', mode:'dark', background:'#16161e', surface1:'#1a1b26', surface2:'#202334', surface3:'#292e42', surface4:'#3b4261', text:'#c0caf5', textMuted:'#a9b1d6', textSubtle:'#737da1', accent:'#7aa2f7', accentAlt:'#2ac3de', danger:'#f7768e', warning:'#e0af68', success:'#9ece6a', solo:'#bb9af7'},
		{id:'catppuccin', name:'Catppuccin Mocha', mode:'dark', background:'#11111b', surface1:'#181825', surface2:'#1e1e2e', surface3:'#313244', surface4:'#45475a', text:'#cdd6f4', textMuted:'#bac2de', textSubtle:'#7f849c', accent:'#cba6f7', accentAlt:'#89b4fa', danger:'#f38ba8', warning:'#f9e2af', success:'#a6e3a1', solo:'#94e2d5'},
		{id:'one-dark', name:'One Dark', mode:'dark', background:'#17191f', surface1:'#1e2127', surface2:'#282c34', surface3:'#323842', surface4:'#3e4451', text:'#abb2bf', textMuted:'#9da5b4', textSubtle:'#6f7785', accent:'#61afef', accentAlt:'#56b6c2', danger:'#e06c75', warning:'#e5c07b', success:'#98c379', solo:'#c678dd'},
		{id:'gruvbox', name:'Gruvbox Dark', mode:'dark', background:'#1d2021', surface1:'#282828', surface2:'#32302f', surface3:'#3c3836', surface4:'#504945', text:'#ebdbb2', textMuted:'#d5c4a1', textSubtle:'#928374', accent:'#fabd2f', accentAlt:'#83a598', danger:'#fb4934', warning:'#fe8019', success:'#b8bb26', solo:'#d3869b'},
		{id:'solarized-dark', name:'Solarized Dark', mode:'dark', background:'#002b36', surface1:'#073642', surface2:'#0b3f4a', surface3:'#174b55', surface4:'#285a63', text:'#eee8d5', textMuted:'#93a1a1', textSubtle:'#657b83', accent:'#2aa198', accentAlt:'#268bd2', danger:'#dc322f', warning:'#b58900', success:'#859900', solo:'#6c71c4'},
		{id:'github-light', name:'GitHub Light', mode:'light', background:'#f6f8fa', surface1:'#ffffff', surface2:'#f3f4f6', surface3:'#eaeef2', surface4:'#d8dee4', text:'#1f2328', textMuted:'#57606a', textSubtle:'#6e7781', accent:'#0969da', accentAlt:'#0550ae', danger:'#cf222e', warning:'#9a6700', success:'#1a7f37', solo:'#8250df'},
		{id:'solarized-light', name:'Solarized Light', mode:'light', background:'#fdf6e3', surface1:'#eee8d5', surface2:'#e6dfc9', surface3:'#ddd6c0', surface4:'#c9c2ad', text:'#073642', textMuted:'#586e75', textSubtle:'#839496', accent:'#268bd2', accentAlt:'#2aa198', danger:'#dc322f', warning:'#b58900', success:'#859900', solo:'#6c71c4'}
	];

	function rgb (hex) {
		var value = hex.replace('#', '');
		if (value.length === 3) value = value.replace(/(.)/g, '$1$1');
		var number = parseInt(value, 16);
		return [(number >> 16) & 255, (number >> 8) & 255, number & 255];
	}

	function alpha (hex, opacity) {
		var value = rgb(hex);
		return 'rgba(' + value[0] + ',' + value[1] + ',' + value[2] + ',' + opacity + ')';
	}

	function tokens (theme) {
		var light = theme.mode === 'light';
		var contrast = light ? '#ffffff' : theme.background;
		return {
			'color-scheme':theme.mode,
			'background':theme.background, 'foreground':theme.text,
			'card':theme.surface1, 'card-foreground':theme.text,
			'popover':theme.surface1, 'popover-foreground':theme.text,
			'primary':theme.accent, 'primary-foreground':contrast,
			'secondary':theme.surface2, 'secondary-foreground':theme.textMuted,
			'muted':theme.surface2, 'muted-foreground':theme.textSubtle,
			'accent':theme.surface3, 'accent-foreground':theme.text,
			'destructive':theme.danger, 'destructive-foreground':light ? '#ffffff' : theme.background,
			'border':alpha(theme.text, light ? .16 : .11), 'input':alpha(theme.text, .14), 'ring':theme.accent,
			'bg-0':theme.background, 'bg-1':theme.surface1, 'bg-2':theme.surface2, 'bg-3':theme.surface3, 'bg-4':theme.surface4,
			'fg-0':theme.text, 'fg-1':theme.textMuted, 'fg-2':theme.textSubtle, 'fg-3':alpha(theme.text, .32),
			'ac':theme.accent, 'ac-2':theme.accentAlt, 'ac-soft':alpha(theme.accent, .12), 'ac-glow':alpha(theme.accent, .34), 'ac-ink':contrast,
			'rec':theme.danger, 'rec-glow':alpha(theme.danger, .32), 'solo':theme.solo, 'solo-glow':alpha(theme.solo, .28),
			'warn':theme.warning, 'ok':theme.success, 'pl':theme.warning,
			'bd':alpha(theme.text, light ? .14 : .09), 'bd-s':alpha(theme.text, light ? .08 : .055), 'bd-h':alpha(theme.accent, .46),
			'surface-translucent':alpha(theme.surface1, .94), 'surface-overlay':alpha(theme.background, .78),
			'surface-hover':theme.surface3, 'surface-strong':theme.surface4,
			'accent-contrast':contrast, 'accent-soft':alpha(theme.accent, .08), 'accent-muted':alpha(theme.accent, .18), 'accent-strong':alpha(theme.accent, .42),
			'danger-contrast':light ? '#ffffff' : theme.background, 'danger-soft':alpha(theme.danger, .20),
			'grid-color':alpha(theme.text, .055), 'grid-strong':alpha(theme.text, .18),
			'shadow-color':light ? 'rgba(31,35,40,.18)' : 'rgba(0,0,0,.48)',
			'wave-bg':theme.background, 'wave-color':theme.accentAlt, 'wave-progress':alpha(theme.danger, .24),
			'timeline-bg':theme.surface1, 'timeline-fg':theme.textMuted,
			'record-bg':theme.surface1, 'record-wave':theme.danger,
			'marker-1':theme.success, 'marker-2':theme.accent, 'marker-3':theme.solo, 'marker-4':theme.warning, 'marker-5':theme.danger, 'marker-6':theme.accentAlt
		};
	}

	function get (id) {
		for (var i = 0; i < themes.length; ++i) if (themes[i].id === id) return themes[i];
		return themes[0];
	}

	w.AMThemeRegistry = {
		defaultId:'replicate',
		list:function () { return themes.slice(); },
		get:get,
		tokens:function (id) { return tokens(get(id)); }
	};
})(window);
