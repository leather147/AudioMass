type ContextmenuRuntimeValue = ReturnType<typeof JSON.parse>;

(() => {
  const runtimeGlobal: ContextmenuRuntimeValue = globalThis;
  const window: ContextmenuRuntimeValue = runtimeGlobal.window;
  const document: ContextmenuRuntimeValue = runtimeGlobal.document;
  const PKAudioEditor: ContextmenuRuntimeValue = runtimeGlobal.PKAudioEditor;
  const PKSimpleModal: ContextmenuRuntimeValue =
    runtimeGlobal.window.AMLateRuntimeValue('PKSimpleModal');
  const PKAudioFXModal: ContextmenuRuntimeValue =
    runtimeGlobal.window.AMLateRuntimeValue('PKAudioFXModal');
  const OneUp: ContextmenuRuntimeValue = runtimeGlobal.OneUp;
  const WaveSurfer: ContextmenuRuntimeValue = runtimeGlobal.WaveSurfer;
  const dragNDrop: ContextmenuRuntimeValue = runtimeGlobal.window.AMLateRuntimeValue('dragNDrop');
  const ID3v2: ContextmenuRuntimeValue = runtimeGlobal.window.AMLateRuntimeValue('ID3v2');
  const ID4: ContextmenuRuntimeValue = runtimeGlobal.window.AMLateRuntimeValue('ID4');
  const wasm_denoise_stream_perf: ContextmenuRuntimeValue = runtimeGlobal.window.AMLateRuntimeValue(
    'wasm_denoise_stream_perf',
  );
  const app: ContextmenuRuntimeValue = PKAudioEditor;
  (function (
    this: ContextmenuRuntimeValue,
    win?: ContextmenuRuntimeValue,
    doc?: ContextmenuRuntimeValue,
    PKAE?: ContextmenuRuntimeValue,
  ) {
    'use strict';
    var activeMenu: ContextmenuRuntimeValue = [],
      namespace: ContextmenuRuntimeValue = win,
      contextStorage: ContextmenuRuntimeValue = {},
      _id: ContextmenuRuntimeValue = 0;
    var closeEvent: ContextmenuRuntimeValue = ['mousedown', 'touchup'];
    /**
     *	Goes through every single context instance and terminates
     *	it.
     **/
    var closeContext: ContextmenuRuntimeValue = function (
        this: ContextmenuRuntimeValue,
        e?: ContextmenuRuntimeValue,
        force?: ContextmenuRuntimeValue,
      ) {
        if (activeMenu.length === 0) return;
        var el: ContextmenuRuntimeValue = e && (e.target || e.srcElement);
        var cls: ContextmenuRuntimeValue = el && el.className;
        if (!el || (cls + '').indexOf('_action') === -1 || force) {
          var l: ContextmenuRuntimeValue = activeMenu.length;
          while (l--) terminate(activeMenu[l]);
          activeMenu = [];
        }
      },
      /**
       *	Go through every children element of the context el,
       *	and remove all listeners and added attributes, then remove it
       *	from the dom also
       **/
      terminate: ContextmenuRuntimeValue = function (
        this: ContextmenuRuntimeValue,
        e?: ContextmenuRuntimeValue,
      ) {
        if (!e || !e.currentMenu) return false;
        var children: ContextmenuRuntimeValue = e.currentMenu.getElementsByTagName('*'),
          len: ContextmenuRuntimeValue = children.length;
        while (len--) children[len].parentNode.removeChild(children[len]);
        e.currentMenu.removeEventListener(closeEvent[0], stopPropagation);
        doc.body.removeChild(e.currentMenu);
        e.currentMenu = null;
        return false;
      },
      /** stop propagation func, so that we don't have to use anonymous funcs **/
      stopPropagation: ContextmenuRuntimeValue = function (
        this: ContextmenuRuntimeValue,
        e?: ContextmenuRuntimeValue,
      ) {
        e.stopPropagation();
      },
      openContext: ContextmenuRuntimeValue = function (
        this: ContextmenuRuntimeValue,
        e?: ContextmenuRuntimeValue,
        x?: ContextmenuRuntimeValue,
        y?: ContextmenuRuntimeValue,
      ) {
        closeContext(null);
        activeMenu.push(e);
        //go through all the options and make the div
        var div: ContextmenuRuntimeValue = doc.createElement('div'),
          a: ContextmenuRuntimeValue,
          marginOffset: ContextmenuRuntimeValue = 4,
          opts: ContextmenuRuntimeValue = e.options,
          leftOffset: ContextmenuRuntimeValue = x - marginOffset,
          topOffset: ContextmenuRuntimeValue = y - marginOffset,
          width: ContextmenuRuntimeValue = 0,
          height: ContextmenuRuntimeValue = 0;
        div.className = 'pk_contextMenu ' + e.menuClass;
        div.id = e.token;
        for (
          var i: ContextmenuRuntimeValue = 0, len: ContextmenuRuntimeValue = opts.length;
          i < len;
          ++i
        ) {
          if (opts[i].isHTML) {
            a = doc.createElement('div');
            a.innerHTML = opts[i].isHTML;
            div.appendChild(a);
          } else {
            a = doc.createElement('a');
            a.className = 'pk_ctx_action';
            a.cnt = 1;
            a.innerHTML = opts[i].name;
            a.callback = opts[i].callback;
            a.addEventListener('click', a.callback, false);
            div.appendChild(a);
          }
        }
        e.currentMenu = div;
        div.addEventListener(closeEvent[0], stopPropagation, false);
        doc.body.appendChild(div);
        width = div.offsetWidth;
        height = div.offsetHeight;
        if (win.innerWidth < leftOffset + width && win.innerHeight < topOffset + height)
          div.style.cssText =
            'top:' + (topOffset - height) + 'px;left:' + (leftOffset - width) + 'px;';
        else if (win.innerWidth < leftOffset + width)
          div.style.cssText = 'top:' + topOffset + 'px;left:' + (leftOffset - width) + 'px;';
        else if (win.innerHeight < topOffset + height)
          div.style.cssText = 'top:' + (topOffset - height) + 'px;left:' + leftOffset + 'px;';
        else div.style.cssText = 'top:' + topOffset + 'px;left:' + leftOffset + 'px;';
        if (e.onOpen) {
          e.onOpen(e, div);
        }
        return false;
      },
      openMenu: ContextmenuRuntimeValue = function (
        this: ContextmenuRuntimeValue,
        e?: ContextmenuRuntimeValue,
      ) {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        } else {
          e = { pageX: 0, pageY: 0 };
        }
        // ----
        var instance: ContextmenuRuntimeValue = getInstance(this);
        var pageX: ContextmenuRuntimeValue = e.pageX || e.clientX + doc.documentElement.scrollLeft;
        var pageY: ContextmenuRuntimeValue = e.pageY || e.clientY + doc.documentElement.scrollTop;
        if (!instance) return false;
        instance.curr_target = e.target || e.srcElement;
        openContext(instance, pageX, pageY);
      },
      getInstance: ContextmenuRuntimeValue = function (
        this: ContextmenuRuntimeValue,
        elem?: ContextmenuRuntimeValue,
      ) {
        return contextStorage[elem.getAttribute('data-token')];
      };
    /**
     *	Context Menu Constructor
     **/
    var contextMenu: ContextmenuRuntimeValue = (namespace.contextMenu = function (
      this: ContextmenuRuntimeValue,
      elem?: ContextmenuRuntimeValue,
      options?: ContextmenuRuntimeValue,
    ) {
      if (!(this instanceof contextMenu)) return new contextMenu(elem, options);
      if (!options) options = {};
      var open_events: ContextmenuRuntimeValue = ['contextmenu', 'longpress'];
      this.elem = elem;
      this.options = [];
      this.menuClass = options.className || 'pk_open';
      this.curr_target = null;
      // modified context menu to open only when double click + no movement
      // if (elem) elem.addEventListener( 'contextmenu', openMenu, false );
      if (elem) elem.addEventListener('pk_ctxmn', openMenu, false);
      this.token = ++_id;
      if (elem) elem.setAttribute('data-token', this.token);
      contextStorage[this.token] = this;
    });
    /**
     *	Wrapper to the private openMenu function
     **/
    contextMenu.prototype.open = function (
      this: ContextmenuRuntimeValue,
      e?: ContextmenuRuntimeValue,
    ) {
      openMenu.call(this.elem, e);
    };
    contextMenu.prototype.close = function (
      this: ContextmenuRuntimeValue,
      e?: ContextmenuRuntimeValue,
    ) {
      closeContext();
    };
    contextMenu.prototype.openWithToken = function (
      this: ContextmenuRuntimeValue,
      token?: ContextmenuRuntimeValue,
      x?: ContextmenuRuntimeValue,
      y?: ContextmenuRuntimeValue,
    ) {
      openContext(contextStorage[token], x || 0, y || 0);
    };
    /**
     *	Closes context and removes it fully
     **/
    ((contextMenu.prototype.destroy = function (this: ContextmenuRuntimeValue) {
      // this.elem.removeEventListener( 'contextmenu', openMenu );
      this.elem.removeEventListener('pk_ctxmn', openMenu);
      closeContext();
      contextStorage[this.token] = null;
      return false;
    }),
      /**
       *	Adds option
       *	@param	string	name of the option
       *	@param	function to run when its chosen
       *	@param	if this is set, then append the HTML instead of its name in its position
       *	@param	initialization code to run when the object is appended to the dom
       **/
      (contextMenu.prototype.addOption = function (
        this: ContextmenuRuntimeValue,
        name?: ContextmenuRuntimeValue,
        callback?: ContextmenuRuntimeValue,
        isHTML?: ContextmenuRuntimeValue,
      ) {
        var q: ContextmenuRuntimeValue = this;
        this.options.push({
          name: name,
          callback: function (this: ContextmenuRuntimeValue, e?: ContextmenuRuntimeValue) {
            callback && callback(q, q._open);
            closeContext(q, true);
          },
          isHTML: isHTML,
        });
      }));
    // todo touch controls too? ####
    doc.addEventListener(closeEvent[0], closeContext, true);
    doc.addEventListener('killCTX', closeContext, false);
    PKAE._deps.ContextMenu = contextMenu;
  })(window, document, PKAudioEditor);
})();
