import {
  EDITOR_ASSET_BASE,
  EDITOR_BOOTSTRAP_SCRIPTS,
  EDITOR_RUNTIME_SCRIPTS,
  EDITOR_STYLESHEETS,
  editorAssetPath,
} from '@/lib/editor-runtime-manifest';

const EDITOR_FONT_URL =
  'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600;700&display=swap';

function scripts(entries: readonly string[]) {
  return entries.map((entry) => `<script src="${editorAssetPath(entry)}"></script>`).join('\n');
}

function stylesheets(entries: readonly string[]) {
  return entries
    .map((entry) => `<link rel="stylesheet" href="${editorAssetPath(entry)}">`)
    .join('\n');
}

export function renderEditorRuntimeDocument() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <title>AM - Audio Editor</title>
  <base href="${EDITOR_ASSET_BASE}">
  <link href="${editorAssetPath('ico.png')}" rel="shortcut icon">
  <meta charset="utf-8">
  <link rel="manifest" href="${editorAssetPath('manifest.json')}">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no">
  <meta name="description" content="AM is a browser-first audio and waveform editor">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-title" content="AM">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black">
${scripts(EDITOR_BOOTSTRAP_SCRIPTS)}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${EDITOR_FONT_URL.replaceAll('&', '&amp;')}" rel="stylesheet">
${stylesheets(EDITOR_STYLESHEETS)}
  <style>
    :root{
      --ff:"Geist Mono",ui-monospace,"SF Mono",SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace;
      --ff-mono:"Geist Mono",ui-monospace,"SF Mono",SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace;
      --ff-heading:"Geist",system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
    }
    h1,h2,h3,h4,h5,h6,.pk_modal_title,.pk_modal_title>span{font-family:var(--ff-heading)}
    small,.pk_sloop_meta,.pk_timing,.pk_total_dur,.pk_hover_dur,.pk_shrtct{
      font-family:var(--ff-mono)!important;font-variant-numeric:tabular-nums;font-feature-settings:"tnum" 1,"zero" 0;
    }
  </style>
  <script>
    (function () {
      var geistMono = '"Geist Mono",ui-monospace,"SF Mono",SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace';
      if (!window.CanvasRenderingContext2D || !CanvasRenderingContext2D.prototype) return;
      var descriptor = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, 'font');
      if (!descriptor || !descriptor.get || !descriptor.set) return;
      Object.defineProperty(CanvasRenderingContext2D.prototype, 'font', {
        get:descriptor.get,
        set:function (value) {
          if (typeof value === 'string') value = value.replace(/Arial\\s*,\\s*sans-serif|Arial|sans-serif|monospace/gi, geistMono);
          descriptor.set.call(this, value);
        }
      });
    })();
  </script>
</head>
<body>
  <div id="app"></div>
${scripts(EDITOR_RUNTIME_SCRIPTS)}
  <script>
    var editor = PKAudioEditor.init('app');
    if (window.AMInstallMtScrollRulerFinalFix) window.AMInstallMtScrollRulerFinalFix(editor);
    if (window.AMInstallMarkerCreateButton) window.AMInstallMarkerCreateButton(editor);
    if (window.AMInstallClipRenameButton) window.AMInstallClipRenameButton(editor);
    if (window.AMInstallTouchClipSelectFix) window.AMInstallTouchClipSelectFix(editor);
    if (window.AMInstallNextBridge) window.AMInstallNextBridge(editor);
  </script>
</body>
</html>`;
}
