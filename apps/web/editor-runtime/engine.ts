type EngineRuntimeValue = ReturnType<typeof JSON.parse>;

(() => {
  const runtimeGlobal: EngineRuntimeValue = globalThis;
  const window: EngineRuntimeValue = runtimeGlobal.window;
  const document: EngineRuntimeValue = runtimeGlobal.document;
  const PKAudioEditor: EngineRuntimeValue = runtimeGlobal.PKAudioEditor;
  const PKSimpleModal: EngineRuntimeValue =
    runtimeGlobal.window.AMLateRuntimeValue('PKSimpleModal');
  const PKAudioFXModal: EngineRuntimeValue =
    runtimeGlobal.window.AMLateRuntimeValue('PKAudioFXModal');
  const OneUp: EngineRuntimeValue = runtimeGlobal.OneUp;
  const WaveSurfer: EngineRuntimeValue = runtimeGlobal.WaveSurfer;
  const dragNDrop: EngineRuntimeValue = runtimeGlobal.window.AMLateRuntimeValue('dragNDrop');
  const ID3v2: EngineRuntimeValue = runtimeGlobal.window.AMLateRuntimeValue('ID3v2');
  const ID4: EngineRuntimeValue = runtimeGlobal.window.AMLateRuntimeValue('ID4');
  const wasm_denoise_stream_perf: EngineRuntimeValue = runtimeGlobal.window.AMLateRuntimeValue(
    'wasm_denoise_stream_perf',
  );
  const app: EngineRuntimeValue = PKAudioEditor;
  (function (
    this: EngineRuntimeValue,
    w?: EngineRuntimeValue,
    d?: EngineRuntimeValue,
    PKAE?: EngineRuntimeValue,
  ) {
    'use strict';
    function PKEng(this: EngineRuntimeValue, app?: EngineRuntimeValue) {
      var q: EngineRuntimeValue = this;
      function mainHeight(this: EngineRuntimeValue) {
        var h: EngineRuntimeValue = app.ui.MainHeight();
        var av: EngineRuntimeValue = app.el.getElementsByClassName('pk_av')[0];
        if (av) h -= av.offsetHeight - av.clientHeight;
        return Math.max(1, h);
      }
      var wavesurfer: EngineRuntimeValue = WaveSurfer.create({
        container: '#' + 'pk_av_' + app.id,
        scrollParent: false,
        hideScrollbar: true,
        partialRender: false,
        fillParent: false,
        pixelRatio: 1,
        progressColor: 'rgba(128,85,85,0.24)',
        splitChannels: true,
        autoCenter: true,
        height: mainHeight(),
        plugins: [
          WaveSurfer.regions.create({
            dragSelection: {
              slop: 5,
            },
          }),
        ],
      });
      this.wavesurfer = wavesurfer;
      var AudioUtils: EngineRuntimeValue = new app._deps.audioutils(app, wavesurfer);
      this.FXPreviewHost = AudioUtils;
      q.is_ready = false;
      var snap_sel: EngineRuntimeValue =
        !w.AMPreferences || w.AMPreferences.get('snapZeroCrossing', true);
      var loadableAudioExtensions: EngineRuntimeValue =
        /\.(aac|aif|aiff|flac|m4a|mp3|oga|ogg|opus|wav|wave|webm)$/i;
      function isLoadableAudioFile(this: EngineRuntimeValue, file?: EngineRuntimeValue) {
        var type: EngineRuntimeValue = (file.type || '').toLowerCase();
        if (type.indexOf('audio/') === 0) return true;
        return loadableAudioExtensions.test(file.name || '');
      }
      this.TrimTo = function (
        this: EngineRuntimeValue,
        val?: EngineRuntimeValue,
        num?: EngineRuntimeValue,
      ) {
        var nums: EngineRuntimeValue = {
          '0': 1,
          '1': 10,
          '2': 100,
          '3': 1000,
          '4': 10000,
          '5': 100000,
        };
        var dec: EngineRuntimeValue = nums[num];
        return ((val * dec) >> 0) / dec;
      };
      function snapTime(this: EngineRuntimeValue, t?: EngineRuntimeValue) {
        var b: EngineRuntimeValue = wavesurfer.backend && wavesurfer.backend.buffer;
        if (!b) return t;
        if (t <= 0 || t >= b.duration) return Math.max(0, Math.min(b.duration, t));
        var c: EngineRuntimeValue = 0;
        while (
          c < b.numberOfChannels - 1 &&
          wavesurfer.ActiveChannels &&
          !wavesurfer.ActiveChannels[c]
        )
          ++c;
        var r: EngineRuntimeValue = b.sampleRate;
        var d: EngineRuntimeValue = b.getChannelData(c);
        var i: EngineRuntimeValue = Math.max(1, Math.min(d.length - 1, (t * r) >> 0));
        var m: EngineRuntimeValue = Math.min((r / 125) >> 0, i, d.length - i - 1);
        for (var j: EngineRuntimeValue = 0; j <= m; ++j) {
          var k: EngineRuntimeValue = i - j;
          if (d[k] === 0 || (d[k - 1] < 0 && d[k] > 0) || (d[k - 1] > 0 && d[k] < 0)) return k / r;
          k = i + j;
          if (d[k] === 0 || (d[k - 1] < 0 && d[k] > 0) || (d[k - 1] > 0 && d[k] < 0)) return k / r;
        }
        return t;
      }
      wavesurfer.SnapTime = snap_sel ? snapTime : null;
      this.PreserveCurrentForUndo = function (
        this: EngineRuntimeValue,
        desc?: EngineRuntimeValue,
        cb?: EngineRuntimeValue,
      ) {
        var buffer: EngineRuntimeValue = wavesurfer.backend && wavesurfer.backend.buffer;
        if (!q.is_ready || !buffer) return false;
        var region: EngineRuntimeValue = wavesurfer.regions && wavesurfer.regions.list[0];
        var state: EngineRuntimeValue = {
          desc: desc || 'Open Audio',
          meta: region
            ? [q.TrimTo(region.start, 3), q.TrimTo(region.end - region.start, 3)]
            : [q.TrimTo(wavesurfer.getCurrentTime(), 3)],
          data: buffer,
        };
        if (cb) state.cb = cb;
        app.fireEvent('StateRequestClearAll');
        app.fireEvent('StateRequestPush', state);
        return true;
      };
      this.LoadArrayBuffer = function (this: EngineRuntimeValue, e?: EngineRuntimeValue) {
        var func: EngineRuntimeValue = function (this: EngineRuntimeValue) {
          app.listenFor('RequestCancelModal', function (this: EngineRuntimeValue) {
            wavesurfer.cancelBufferLoad();
            if (wavesurfer.arraybuffer) q.is_ready = true;
            app.fireEvent('RequestResize');
            setTimeout(function (this: EngineRuntimeValue) {
              app.fireEvent('DidDownloadFile');
            }, 12);
            app.stopListeningForName('RequestCancelModal');
            OneUp('Canceled Loading', 1350);
          });
          app.fireEvent('RequestZoomUI', 0);
          app.fireEvent('WillDownloadFile');
          q.is_ready = false;
          wavesurfer.loadBlob(e);
          app.fireEvent('DidUnloadFile');
          wavesurfer.regions && wavesurfer.regions.clear();
        };
        if (q.is_ready) {
          //  ----------------
          new PKSimpleModal({
            title: 'Open or append',
            clss: 'pk_modal_anim pk_fnt10',
            ondestroy: function (this: EngineRuntimeValue, q?: EngineRuntimeValue) {
              app.ui.InteractionHandler.on = false;
              app.ui.KeyHandler.removeCallback('modalTempErr');
            },
            buttons: [
              {
                title: 'OPEN NEW',
                callback: function (this: EngineRuntimeValue, q?: EngineRuntimeValue) {
                  wavesurfer.backend._add = 0;
                  func();
                  q.Destroy();
                },
              },
              {
                title: 'ADD IN EXISTING',
                callback: function (this: EngineRuntimeValue, q?: EngineRuntimeValue) {
                  wavesurfer.backend._add = 1;
                  func();
                  q.Destroy();
                },
              },
            ],
            body: '<p>Append file to existing track?</p>',
            setup: function (this: EngineRuntimeValue, q?: EngineRuntimeValue) {
              app.ui.InteractionHandler.checkAndSet('modal');
              app.ui.KeyHandler.addCallback(
                'modalTempErr',
                function (this: EngineRuntimeValue, e?: EngineRuntimeValue) {
                  q.Destroy();
                },
                [27],
              );
            },
          }).Show();
          return;
        }
        wavesurfer.backend._add = 0;
        func();
        // ---
      };
      this.LoadDB = function (this: EngineRuntimeValue, e?: EngineRuntimeValue) {
        var new_buffer: EngineRuntimeValue = wavesurfer.backend.ac.createBuffer(
          e.data.length,
          e.data[0].byteLength / 4,
          e.samplerate,
        );
        for (var i: EngineRuntimeValue = 0; i < e.data.length; ++i) {
          var arr: EngineRuntimeValue = new Float32Array(e.data[i]);
          if (new_buffer.copyToChannel) {
            new_buffer.copyToChannel(arr, i, 0);
          } else {
            var chan: EngineRuntimeValue = new_buffer.getChannelData(i);
            chan.set(arr);
          }
        }
        var append: EngineRuntimeValue = wavesurfer.backend._add;
        var old_durr: EngineRuntimeValue = wavesurfer.getDuration();
        PKAudioEditor.engine.wavesurfer.loadDecodedBuffer(new_buffer);
        _compute_channels();
        var new_durr: EngineRuntimeValue = wavesurfer.getDuration();
        app.fireEvent('DidUpdateLen', new_durr);
        if (app.mrk) {
          if (!append) app.mrk.loadEd(e.markers, false);
          else app.mrk.clearEd(false);
        }
        if (!append) app.fireEvent('RequestSeekTo', 0);
        else {
          wavesurfer.regions.clear();
          wavesurfer.regions.add({
            start: old_durr,
            end: new_durr,
            id: 't',
          });
        }
        // --------
      };
      this.LoadFile = function (this: EngineRuntimeValue, e?: EngineRuntimeValue) {
        var file: EngineRuntimeValue = e.files && e.files[0];
        if (!file) return;
        if (!isLoadableAudioFile(file)) {
          app.fireEvent('ShowError', 'Unsupported audio file type');
          return;
        }
        var func: EngineRuntimeValue = function (this: EngineRuntimeValue) {
          app.listenFor('RequestCancelModal', function (this: EngineRuntimeValue) {
            wavesurfer.cancelBufferLoad();
            AudioUtils.DownloadFileCancel();
            if (wavesurfer.arraybuffer) q.is_ready = true;
            app.fireEvent('RequestResize');
            setTimeout(function (this: EngineRuntimeValue) {
              app.fireEvent('DidDownloadFile');
            }, 12);
            app.stopListeningForName('RequestCancelModal');
            OneUp('Canceled Loading', 1350);
          });
          app.fireEvent('WillDownloadFile');
          q.is_ready = false;
          wavesurfer.loadBlob(file);
          app.fireEvent('DidUnloadFile');
          wavesurfer.regions && wavesurfer.regions.clear();
        };
        if (q.is_ready) {
          //  ----------------
          new PKSimpleModal({
            title: 'Open or append',
            clss: 'pk_modal_anim pk_fnt10',
            ondestroy: function (this: EngineRuntimeValue, q?: EngineRuntimeValue) {
              app.ui.InteractionHandler.on = false;
              app.ui.KeyHandler.removeCallback('modalTempErr');
            },
            buttons: [
              {
                title: 'OPEN NEW',
                callback: function (this: EngineRuntimeValue, q?: EngineRuntimeValue) {
                  wavesurfer.backend._add = 0;
                  func();
                  q.Destroy();
                },
              },
              {
                title: 'ADD IN EXISTING',
                callback: function (this: EngineRuntimeValue, q?: EngineRuntimeValue) {
                  wavesurfer.backend._add = 1;
                  func();
                  q.Destroy();
                },
              },
            ],
            body: '<p>Append file to existing track?</p>',
            setup: function (this: EngineRuntimeValue, q?: EngineRuntimeValue) {
              app.ui.InteractionHandler.checkAndSet('modal');
              app.ui.KeyHandler.addCallback(
                'modalTempErr',
                function (this: EngineRuntimeValue, e?: EngineRuntimeValue) {
                  q.Destroy();
                },
                [27],
              );
            },
          }).Show();
          return;
        }
        wavesurfer.backend._add = 0;
        func();
        // ----
      };
      this.DownloadFile = function (
        this: EngineRuntimeValue,
        name?: EngineRuntimeValue,
        format?: EngineRuntimeValue,
        kbps?: EngineRuntimeValue,
        selection?: EngineRuntimeValue,
        stereo?: EngineRuntimeValue,
        bit_depth?: EngineRuntimeValue,
        dither?: EngineRuntimeValue,
      ) {
        var canceled: EngineRuntimeValue = false;
        var mt: EngineRuntimeValue =
          app.multitrack && app.multitrack.IsOn && app.multitrack.IsOn() && app.multitrack.Mixdown
            ? app.multitrack
            : null;
        if (mt || q.is_ready) {
          app.fireEvent('WillDownloadFile');
        } else return;
        app.listenFor('RequestCancelModal', function (this: EngineRuntimeValue) {
          canceled = true;
          AudioUtils.DownloadFileCancel();
          if (wavesurfer.arraybuffer) q.is_ready = true;
          app.fireEvent('RequestResize');
          setTimeout(function (this: EngineRuntimeValue) {
            app.fireEvent('DidDownloadFile');
          }, 12);
          app.stopListeningForName('RequestCancelModal');
        });
        if (mt) {
          app.fireEvent('DidProgressModal', 0);
          setTimeout(function (this: EngineRuntimeValue) {
            var done: EngineRuntimeValue = function (
              this: EngineRuntimeValue,
              mt_buffer?: EngineRuntimeValue,
            ) {
              if (canceled) return;
              if (!mt_buffer) {
                OneUp('Nothing to export', 1200);
                app.fireEvent('DidDownloadFile');
                app.stopListeningForName('RequestCancelModal');
                return;
              }
              startDownload(mt_buffer);
            };
            if (mt.MixdownAsync) mt.MixdownAsync(selection, done);
            else done(mt.Mixdown(selection));
          }, 20);
          return;
        }
        setTimeout(function (this: EngineRuntimeValue) {
          startDownload();
        }, 220);
        function startDownload(this: EngineRuntimeValue, mt_buffer?: EngineRuntimeValue) {
          if (canceled) return;
          AudioUtils.DownloadFile(
            name,
            format,
            kbps,
            mt_buffer ? false : selection,
            stereo,
            bit_depth,
            dither,
            function (this: EngineRuntimeValue, val?: EngineRuntimeValue) {
              if (val === 'done') {
                setTimeout(function (this: EngineRuntimeValue) {
                  app.fireEvent('DidDownloadFile');
                }, 12);
                app.stopListeningForName('RequestCancelModal');
              } else app.fireEvent('DidProgressModal', val);
            },
            mt_buffer,
          );
        }
      };
      this.LoadSample = function (this: EngineRuntimeValue, file?: EngineRuntimeValue) {
        app.fireEvent('WillDownloadFile');
        setTimeout(function (this: EngineRuntimeValue) {
          app.listenFor('RequestCancelModal', function (this: EngineRuntimeValue) {
            if (wavesurfer.cancelAjax()) {
              if (wavesurfer.arraybuffer) q.is_ready = true;
              app.fireEvent('RequestResize');
              setTimeout(function (this: EngineRuntimeValue) {
                app.fireEvent('DidDownloadFile');
              }, 12);
              app.stopListeningForName('RequestCancelModal');
              OneUp('Canceled Loading', 1380);
            }
          });
          app.fireEvent('RequestZoomUI', 0);
          q.is_ready = false;
          wavesurfer.load(file || 'piano-sample.mp3');
        }, 180);
      };
      this.LoadURL = function (this: EngineRuntimeValue, url?: EngineRuntimeValue) {
        app.fireEvent('WillDownloadFile');
        /*
            var context =  new AudioContext (); // wavesurfer.backend.ac;
            var audio_el = d.createElement ('audio');
            audio_el.autoplay = true;
            audio_el.controls = true;
            audio_el.preload = true;
//			audio_el.playbackRate = 0.5;
            d.body.appendChild( audio_el );
            audio_el.src = url;

            setTimeout(function() {
                var source = context.createMediaElementSource (audio_el);
                // source.connect(context.destination);

                var time_duration = audio_el.duration / 1;
                var first = true;
                var audio_buffer = null;
                var sample_rate = 0;
                var chans = 0;

                var scriptNode = context.createScriptProcessor (4096, 1, 1);
                window.sss = scriptNode;
                window.eee = source;
                window.ccc = context;

                var prev_time = 0;

                scriptNode.onaudioprocess = function( ev ) {
                    if (audio_el.paused) return ;

                    var ctime = audio_el.currentTime / 1;

                    if ((ctime + 0.0001) >= time_duration)
                    {
                        //if (!first) {
                        //	console.log ("done");
                        //	first = 100;
                        //}
                        return ;
                    }

                    var inputBuffer = ev.inputBuffer;
                    // var outputBuffer = ev.outputBuffer;

                    if (first) {
                        first = false;

                        sample_rate = inputBuffer.sampleRate;
                        chans      = inputBuffer.numberOfChannels;
                        audio_buffer = context.createBuffer (
                            inputBuffer.numberOfChannels,
                            time_duration * inputBuffer.sampleRate,
                            inputBuffer.sampleRate
                        );

                        window.audio_buffer = audio_buffer;
                    }

                    var curr_time = (ctime * sample_rate) >> 0;

                     // console.log( curr_time, "   ", (curr_time - prev_time), "  ", ((curr_time - prev_time) > (4096*2))?true:false  );
                     // prev_time = curr_time;

                      for (var channel = 0; channel < inputBuffer.numberOfChannels; ++channel) {
                        var inputData = inputBuffer.getChannelData(channel);
                        // var outputData = outputBuffer.getChannelData(channel);
                        var final_data = audio_buffer.getChannelData(channel);

                        // console.log( inputData );

                        // Loop through the 4096 samples
                        for (var sample = 0; sample < inputBuffer.length; ++sample) {
                          // make output equal to the same as the input
                          // outputData[sample] = inputData[sample];

                          final_data[curr_time + sample] = inputData[sample];

                          // add noise to each output sample
                          // outputData[sample] += ((Math.random() * 2) - 1) * 0.2;
                        }
                      }
                };

                source.connect(scriptNode);
                scriptNode.connect(context.destination);
            },2000);
            */
        setTimeout(function (this: EngineRuntimeValue) {
          app.listenFor('RequestCancelModal', function (this: EngineRuntimeValue) {
            if (wavesurfer.cancelAjax()) {
              if (wavesurfer.arraybuffer) q.is_ready = true;
              app.fireEvent('RequestResize');
              setTimeout(function (this: EngineRuntimeValue) {
                app.fireEvent('DidDownloadFile');
              }, 12);
              app.stopListeningForName('RequestCancelModal');
              OneUp('Canceled Loading', 1350);
            }
          });
          wavesurfer.load(url);
          q.is_ready = false;
        }, 180);
      };
      app.listenFor('RequestResize', function (this: EngineRuntimeValue) {
        wavesurfer.fireEvent('resize');
        wavesurfer.setHeight(mainHeight());
        // app.fireEvent ('DidResize');
      });
      wavesurfer.on('ready', function (this: EngineRuntimeValue) {
        app.fireEvent('DidReadyFire');
        if (wavesurfer.backend._add) {
          wavesurfer.backend._add = 0;
        }
        if (q.is_ready) return;
        q.is_ready = true;
        // dirty hack for default message
        var dirtymsg: EngineRuntimeValue = document.getElementsByClassName('pk_ed_empty');
        if (dirtymsg.length > 0) {
          dirtymsg = dirtymsg[0];
          dirtymsg.parentNode.removeChild(dirtymsg);
        }
        copy_buffer = null;
        app.fireEvent('DidDownloadFile');
        app.fireEvent('StateRequestClearAll');
        app.fireEvent('DidLoadFile');
        app.fireEvent('DidUpdateLen', wavesurfer.getDuration());
        app.fireEvent('DidSetClipboard', 0);
        app.fireEvent('RequestSeekTo', 0);
        app.fireEvent('RequestResize');
        wavesurfer.getWaveEl().style.opacity = '1';
        // loaded successfully
        app.stopListeningForName('RequestCancelModal');
        setTimeout(function (this: EngineRuntimeValue) {
          OneUp('Loaded Successfully');
        }, 180);
        // check if the audio file is mono or stereo and rebuild both UI and audio engine accordingly...
        if (wavesurfer.backend.buffer.numberOfChannels === 1) {
          wavesurfer.backend.SetNumberOfChannels(1);
          wavesurfer.ActiveChannels = [1];
          wavesurfer.drawer.params.ActiveChannels = wavesurfer.ActiveChannels;
          wavesurfer.SelectedChannelsLen = 1;
          app.el.classList.add('pk_mono');
        } else if (wavesurfer.backend.buffer.numberOfChannels === 2) {
          wavesurfer.backend.SetNumberOfChannels(2);
          wavesurfer.ActiveChannels = [1, 1];
          wavesurfer.drawer.params.ActiveChannels = wavesurfer.ActiveChannels;
          wavesurfer.SelectedChannelsLen = 2;
          app.el.classList.remove('pk_mono');
        }
        // ---
      });
      wavesurfer.on('pause', function (this: EngineRuntimeValue) {
        app.fireEvent('DidStopPlay');
      });
      wavesurfer.on('play', function (this: EngineRuntimeValue) {
        app.fireEvent('DidPlay');
      });
      wavesurfer.on(
        'seek',
        function (
          this: EngineRuntimeValue,
          where?: EngineRuntimeValue,
          stamp?: EngineRuntimeValue,
        ) {
          var time: EngineRuntimeValue = wavesurfer.getCurrentTime();
          var loudness: EngineRuntimeValue = wavesurfer.getLoudness();
          app.fireEvent('DidAudioProcess', [time, loudness, stamp]);
        },
      );
      app.listenFor('RequestStop', function (this: EngineRuntimeValue, val?: EngineRuntimeValue) {
        if (app.rec.isActive()) {
          app.fireEvent('RequestActionRecordStop');
          return false;
        }
        var region: EngineRuntimeValue = wavesurfer.regions.list[0];
        if (region) wavesurfer.ActiveMarker = region.start / wavesurfer.getDuration();
        wavesurfer.stop(val);
      });
      var record_stop_done: EngineRuntimeValue = null;
      function playLoop(this: EngineRuntimeValue) {
        var region: EngineRuntimeValue = wavesurfer.regions.list[0];
        if (region && region.loop && wavesurfer.backend.playLoop) {
          var at: EngineRuntimeValue = wavesurfer.getCurrentTime();
          wavesurfer.backend.playLoop(
            region.start,
            region.end,
            at >= region.start && at < region.end ? at : region.start,
          );
          return;
        }
        wavesurfer.play();
      }
      function afterRecordStop(
        this: EngineRuntimeValue,
        ok?: EngineRuntimeValue,
        dims?: EngineRuntimeValue,
      ) {
        var done: EngineRuntimeValue = record_stop_done;
        record_stop_done = null;
        done && done(ok, dims);
      }
      function playAfterRecordStop(this: EngineRuntimeValue) {
        app.fireEvent(
          'RequestActionRecordStop',
          function (this: EngineRuntimeValue, ok?: EngineRuntimeValue) {
            if (ok && !wavesurfer.isPlaying()) playLoop();
          },
        );
      }
      app.listenFor('RequestPlay', function (this: EngineRuntimeValue, x?: EngineRuntimeValue) {
        if (q.in_fx) return;
        if (app.rec.isActive()) {
          playAfterRecordStop();
          return;
        }
        app.fireEvent('RequestActionRecordStop');
        if (!x && wavesurfer.isPlaying()) {
          wavesurfer.stop();
          playLoop();
        } else {
          if (!app.rec.isActive()) {
            playLoop();
          } else {
            setTimeout(function (this: EngineRuntimeValue) {
              if (!app.rec.isActive() && !x && !wavesurfer.isPlaying()) {
                playLoop();
              }
            }, 220);
          }
        }
      });
      app.listenFor('RequestPause', function (this: EngineRuntimeValue) {
        app.fireEvent('RequestActionRecordStop');
        wavesurfer.pause();
      });
      app.listenFor(
        'RequestTransportToggle',
        function (this: EngineRuntimeValue, mode?: EngineRuntimeValue) {
          if (mode === 'pause') {
            wavesurfer.isPlaying() ? wavesurfer.pause() : playLoop();
            return;
          }
          if (app.rec.isActive()) {
            playAfterRecordStop();
            return;
          }
          if (wavesurfer.isPlaying()) {
            app.fireEvent('RequestStop');
          } else {
            app.fireEvent('RequestPlay');
          }
        },
      );
      app.listenFor('RequestSetLoop', function (this: EngineRuntimeValue) {
        if (!q.is_ready) return;
        var skip_seek: EngineRuntimeValue = false;
        if (wavesurfer.regions.list[0]) {
          if (wavesurfer.regions.list[0].loop) wavesurfer.regions.list[0].loop = false;
          else wavesurfer.regions.list[0].loop = true;
        } else {
          skip_seek = true;
          wavesurfer.regions.add({
            start: 0,
            end: wavesurfer.getDuration(),
            id: 't',
          });
          wavesurfer.regions.list[0].loop = true;
        }
        var will_loop: EngineRuntimeValue = wavesurfer.regions.list[0].loop;
        app.fireEvent('DidSetLoop', will_loop);
        if (will_loop && !skip_seek /*&& wavesurfer.isPlaying ()*/) {
          app.fireEvent(
            'RequestSeekTo',
            wavesurfer.regions.list[0].start / wavesurfer.getDuration(),
          );
        }
      });
      wavesurfer.on('finish', function (this: EngineRuntimeValue) {
        var region: EngineRuntimeValue = wavesurfer.regions.list[0];
        if (region && region.loop && region.end >= wavesurfer.getDuration())
          setTimeout(function (this: EngineRuntimeValue) {
            region = wavesurfer.regions.list[0];
            region &&
              region.loop &&
              (wavesurfer.backend.playLoop
                ? wavesurfer.backend.playLoop(region.start, region.end)
                : wavesurfer.play(region.start));
          }, 0);
      });
      app.listenFor(
        'RequestSkipBack',
        function (this: EngineRuntimeValue, val?: EngineRuntimeValue) {
          wavesurfer.skipBackward(val);
        },
      );
      app.listenFor(
        'RequestSkipFront',
        function (this: EngineRuntimeValue, val?: EngineRuntimeValue) {
          wavesurfer.skipForward(val);
        },
      );
      app.listenFor('RequestSeekTo', function (this: EngineRuntimeValue, val?: EngineRuntimeValue) {
        val = val < 0 ? 0 : val > 1 ? 1 : val;
        wavesurfer.seekTo(val);
      });
      app.ui.KeyHandler.addCallback(
        'zkA',
        function (
          this: EngineRuntimeValue,
          key?: EngineRuntimeValue,
          m?: EngineRuntimeValue,
          e?: EngineRuntimeValue,
        ) {
          e.preventDefault();
        },
        [38],
      );
      app.ui.KeyHandler.addCallback(
        'zkD',
        function (
          this: EngineRuntimeValue,
          key?: EngineRuntimeValue,
          m?: EngineRuntimeValue,
          e?: EngineRuntimeValue,
        ) {
          e.preventDefault();
        },
        [40],
      );
      app.ui.KeyHandler.addSingleCallback(
        'KeyPlayPause',
        function (this: EngineRuntimeValue, e?: EngineRuntimeValue) {
          if (app.ui.InteractionHandler.on) return;
          e.preventDefault();
          //e.stopPropagation();
        },
        32,
      );
      app.ui.KeyHandler.addSingleCallback(
        'KeyTilda',
        function (this: EngineRuntimeValue, e?: EngineRuntimeValue) {
          var open_el: EngineRuntimeValue = app.ui.TopHeader.getOpenElement();
          if (open_el) {
            app.ui.TopHeader.closeMenu();
            e.preventDefault();
            return;
          }
          if (app.ui.InteractionHandler.on) return;
          e.preventDefault();
          app.ui.TopHeader.openMenu(-1);
        },
        96,
      );
      app.ui.KeyHandler.addSingleCallback(
        'KeyQ',
        function (this: EngineRuntimeValue, e?: EngineRuntimeValue) {
          if (app.ui.InteractionHandler.on) return;
          e.preventDefault();
          app.fireEvent('RequestDeselect');
        },
        113,
      );
      app.ui.KeyHandler.addCallback(
        'kF12',
        function (
          this: EngineRuntimeValue,
          k?: EngineRuntimeValue,
          i?: EngineRuntimeValue,
          e?: EngineRuntimeValue,
        ) {
          e.preventDefault();
          e.stopPropagation();
        },
        [123],
      );
      /*app.ui.KeyHandler.addCallback ('kF5', function ( k, i, e ) {
            e.preventDefault();
            e.stopPropagation();
        }, [116]);
        */
      function accelAct(this: EngineRuntimeValue, e?: EngineRuntimeValue, fn?: EngineRuntimeValue) {
        if (
          app.ui.InteractionHandler.on ||
          app.ui.KeyHandler.isEditTarget(e) ||
          !app.ui.KeyHandler.isAccel(e)
        )
          return;
        e.preventDefault();
        e.stopPropagation();
        fn();
      }
      function accelHeld(this: EngineRuntimeValue, e?: EngineRuntimeValue) {
        return e && (e.ctrlKey || e.metaKey);
      }
      function accelBind(
        this: EngineRuntimeValue,
        name?: EngineRuntimeValue,
        key?: EngineRuntimeValue,
        fn?: EngineRuntimeValue,
      ) {
        app.ui.KeyHandler.addCallback(
          name + app.id,
          function (
            this: EngineRuntimeValue,
            k?: EngineRuntimeValue,
            m?: EngineRuntimeValue,
            e?: EngineRuntimeValue,
          ) {
            accelAct(e, function (this: EngineRuntimeValue) {
              fn(e);
            });
          },
          [key],
        );
      }
      app.ui.KeyHandler.addCallback(
        'KeyShiftSpace' + app.id,
        function (
          this: EngineRuntimeValue,
          key?: EngineRuntimeValue,
          map?: EngineRuntimeValue,
          e?: EngineRuntimeValue,
        ) {
          if (app.ui.InteractionHandler.on || accelHeld(e)) return;
          app.fireEvent('RequestTransportToggle', 'pause');
        },
        [16, 32],
      );
      app.ui.KeyHandler.addCallback(
        'KeySpace' + app.id,
        function (
          this: EngineRuntimeValue,
          key?: EngineRuntimeValue,
          map?: EngineRuntimeValue,
          e?: EngineRuntimeValue,
        ) {
          if (app.ui.InteractionHandler.on) return;
          if (map[16] === 1 || accelHeld(e)) return;
          app.fireEvent('RequestTransportToggle', 'stop');
        },
        [32],
      );
      app.ui.KeyHandler.addCallback(
        'KeyShiftCopy' + app.id,
        function (
          this: EngineRuntimeValue,
          key?: EngineRuntimeValue,
          map?: EngineRuntimeValue,
          e?: EngineRuntimeValue,
        ) {
          if (app.ui.InteractionHandler.on || accelHeld(e)) return;
          app.fireEvent('RequestActionCopy');
        },
        [16, 67],
      );
      accelBind('KeyModCopy', 67, function (this: EngineRuntimeValue) {
        app.fireEvent('RequestActionCopy');
      });
      app.ui.KeyHandler.addCallback(
        'KeyShiftUndo' + app.id,
        function (
          this: EngineRuntimeValue,
          key?: EngineRuntimeValue,
          map?: EngineRuntimeValue,
          e?: EngineRuntimeValue,
        ) {
          if (app.ui.InteractionHandler.on || accelHeld(e)) return;
          app.fireEvent('StateRequestUndo');
        },
        [16, 90],
      );
      accelBind('KeyModUndo', 90, function (this: EngineRuntimeValue, e?: EngineRuntimeValue) {
        app.fireEvent(e.shiftKey ? 'StateRequestRedo' : 'StateRequestUndo');
      });
      app.ui.KeyHandler.addCallback(
        'KeyShiftRedo' + app.id,
        function (
          this: EngineRuntimeValue,
          key?: EngineRuntimeValue,
          map?: EngineRuntimeValue,
          e?: EngineRuntimeValue,
        ) {
          if (app.ui.InteractionHandler.on || accelHeld(e)) return;
          app.fireEvent('StateRequestRedo');
        },
        [16, 89],
      );
      accelBind('KeyModRedo', 89, function (this: EngineRuntimeValue) {
        app.fireEvent('StateRequestRedo');
      });
      app.ui.KeyHandler.addCallback(
        'KeyShiftPaste' + app.id,
        function (
          this: EngineRuntimeValue,
          key?: EngineRuntimeValue,
          map?: EngineRuntimeValue,
          e?: EngineRuntimeValue,
        ) {
          if (app.ui.InteractionHandler.on || accelHeld(e)) return;
          app.fireEvent('RequestActionPaste');
        },
        [16, 86],
      );
      accelBind('KeyModPaste', 86, function (this: EngineRuntimeValue) {
        app.fireEvent('RequestActionPaste');
      });
      app.ui.KeyHandler.addCallback(
        'KeyShiftCut' + app.id,
        function (
          this: EngineRuntimeValue,
          key?: EngineRuntimeValue,
          map?: EngineRuntimeValue,
          e?: EngineRuntimeValue,
        ) {
          if (app.ui.InteractionHandler.on || accelHeld(e)) return;
          app.fireEvent('RequestActionCut', 1);
        },
        [16, 88],
      );
      accelBind('KeyModCut', 88, function (this: EngineRuntimeValue) {
        app.fireEvent('RequestActionCut', 1);
      });
      app.ui.KeyHandler.addCallback(
        'KeyCrossfade' + app.id,
        function (
          this: EngineRuntimeValue,
          key?: EngineRuntimeValue,
          map?: EngineRuntimeValue,
          e?: EngineRuntimeValue,
        ) {
          var target: EngineRuntimeValue = e && e.target;
          if (
            app.ui.InteractionHandler.on ||
            map[16] === 1 ||
            accelHeld(e) ||
            (target && /INPUT|TEXTAREA|SELECT/.test(target.tagName))
          )
            return;
          app.fireEvent('RequestActionCrossfade');
        },
        [88],
      );
      app.ui.KeyHandler.addCallback(
        'KeyDel' + app.id,
        function (this: EngineRuntimeValue, key?: EngineRuntimeValue) {
          if (app.ui.InteractionHandler.on) return;
          app.fireEvent('RequestActionCut');
        },
        [8],
      );
      app.ui.KeyHandler.addCallback(
        'KeyDelete' + app.id,
        function (
          this: EngineRuntimeValue,
          key?: EngineRuntimeValue,
          map?: EngineRuntimeValue,
          e?: EngineRuntimeValue,
        ) {
          var target: EngineRuntimeValue = e && e.target;
          if (
            app.ui.InteractionHandler.on ||
            (target && /INPUT|TEXTAREA|SELECT/.test(target.tagName))
          )
            return;
          app.fireEvent('RequestActionCut');
        },
        [46],
      );
      app.ui.KeyHandler.addCallback(
        'KeyShiftSelectAll' + app.id,
        function (
          this: EngineRuntimeValue,
          key?: EngineRuntimeValue,
          map?: EngineRuntimeValue,
          e?: EngineRuntimeValue,
        ) {
          if (app.ui.InteractionHandler.on || accelHeld(e)) return;
          app.fireEvent('RequestSelect');
        },
        [16, 65],
      );
      accelBind('KeyModSelectAll', 65, function (this: EngineRuntimeValue) {
        app.fireEvent('RequestSelect');
      });
      app.ui.KeyHandler.addSingleCallback(
        'KeyLoopToggle',
        function (this: EngineRuntimeValue, e?: EngineRuntimeValue) {
          if (app.ui.InteractionHandler.on) return;
          e.preventDefault();
          e.stopPropagation();
          app.fireEvent('RequestSetLoop');
        },
        108,
      );
      function markerKey(
        this: EngineRuntimeValue,
        e?: EngineRuntimeValue,
        fn?: EngineRuntimeValue,
      ) {
        if (
          app.ui.InteractionHandler.on ||
          app.ui.KeyHandler.isEditTarget(e) ||
          accelHeld(e) ||
          e.altKey
        )
          return;
        e.preventDefault();
        e.stopPropagation();
        fn();
      }
      app.ui.KeyHandler.addCallback(
        'KeyMrkrAdd' + app.id,
        function (
          this: EngineRuntimeValue,
          key?: EngineRuntimeValue,
          map?: EngineRuntimeValue,
          e?: EngineRuntimeValue,
        ) {
          markerKey(e, function (this: EngineRuntimeValue) {
            app.fireEvent('MrkrAdd');
          });
        },
        [77],
      );
      app.ui.KeyHandler.addCallback(
        'KeyMrkrPrv' + app.id,
        function (
          this: EngineRuntimeValue,
          key?: EngineRuntimeValue,
          map?: EngineRuntimeValue,
          e?: EngineRuntimeValue,
        ) {
          markerKey(e, function (this: EngineRuntimeValue) {
            app.fireEvent('MrkrPrv', map[16] || (e && e.shiftKey) ? 1 : 0);
          });
        },
        [219],
      );
      app.ui.KeyHandler.addCallback(
        'KeyMrkrNxt' + app.id,
        function (
          this: EngineRuntimeValue,
          key?: EngineRuntimeValue,
          map?: EngineRuntimeValue,
          e?: EngineRuntimeValue,
        ) {
          markerKey(e, function (this: EngineRuntimeValue) {
            app.fireEvent('MrkrNxt', map[16] || (e && e.shiftKey) ? 1 : 0);
          });
        },
        [221],
      );
      app.ui.KeyHandler.addCallback(
        'KeyShiftSave' + app.id,
        function (
          this: EngineRuntimeValue,
          key?: EngineRuntimeValue,
          map?: EngineRuntimeValue,
          e?: EngineRuntimeValue,
        ) {
          if (app.ui.InteractionHandler.on || accelHeld(e)) return;
          // fire event to open the save menu
          document.querySelector('.pk_opt[data-id="dl"]').click();
        },
        [16, 83],
      );
      accelBind('KeyModSave', 83, function (this: EngineRuntimeValue) {
        document.querySelector('.pk_opt[data-id="dl"]').click();
      });
      wavesurfer.container.addEventListener(
        'mousedown',
        function (this: EngineRuntimeValue, e?: EngineRuntimeValue) {
          if (e.which === 3) {
            // wavesurfer.regions.clear();
            e.preventDefault();
          }
        },
        false,
      );
      // select all... ####
      app.listenFor(
        'RequestSelect',
        function (
          this: EngineRuntimeValue,
          ifnot?: EngineRuntimeValue,
          custom?: EngineRuntimeValue,
        ) {
          if (!q.is_ready) return;
          if (ifnot) {
            var region: EngineRuntimeValue = wavesurfer.regions.list[0];
            if (region) return false;
          }
          if (!custom) {
            wavesurfer.regions.add({
              start: 0.0,
              end: wavesurfer.getDuration() - 0.0,
              id: 't',
            });
            if (!wavesurfer.isPlaying())
              setTimeout(function (this: EngineRuntimeValue) {
                app.fireEvent('RequestSeekTo', 0.0);
              }, 0);
          } else {
            wavesurfer.regions.add({
              start: custom[0],
              end: custom[1],
              id: 't',
            });
            if (!wavesurfer.isPlaying())
              setTimeout(function (this: EngineRuntimeValue) {
                app.fireEvent('RequestSeekTo', custom[0] / wavesurfer.getDuration());
              }, 0);
          }
        },
      );
      app.listenFor('RequestDeselect', function (this: EngineRuntimeValue) {
        wavesurfer.regions.clear();
        app.fireEvent('RequestSeekTo', 0);
      });
      (function (this: EngineRuntimeValue) {
        var input: EngineRuntimeValue = null;
        app.listenFor('RequestLoadLocalFile', function (this: EngineRuntimeValue) {
          wavesurfer.pause();
          if (input) {
            input.parentNode.removeChild(input);
            input.onchange = null;
          }
          input = d.createElement('input');
          input.setAttribute('type', 'file');
          input.setAttribute('accept', 'audio/*,.amss');
          input.className = 'pk_inpfile';
          input.onchange = function (this: EngineRuntimeValue) {
            if (
              app.multitrack &&
              app.multitrack.LoadSessionFiles &&
              app.multitrack.LoadSessionFiles(input.files)
            ) {
            } else if (app.fireEvent('RequestLoadPickedFiles', input.files) !== true)
              q.LoadFile(input);
            input.parentNode.removeChild(input);
            input.onchange = null;
            input = null;
          };
          app.el.appendChild(input); // maybe not append?
          input.click();
        });
      })();
      wavesurfer.container.addEventListener(
        'dblclick',
        function (this: EngineRuntimeValue, e?: EngineRuntimeValue) {
          app.fireEvent('RequestSelect', false, [
            wavesurfer.LeftProgress,
            wavesurfer.LeftProgress + wavesurfer.VisibleDuration,
          ]);
        },
        false,
      );
      wavesurfer.container.addEventListener(
        'click',
        function (this: EngineRuntimeValue, e?: EngineRuntimeValue) {
          if (!q.is_ready) return;
          if (!app.ui.KeyHandler.keyMap[16]) wavesurfer.regions.clear();
        },
        false,
      );
      var dbncr: EngineRuntimeValue = null;
      w.addEventListener(
        'resize',
        function (this: EngineRuntimeValue) {
          if (!wavesurfer) return;
          if (dbncr) {
            clearTimeout(dbncr);
          }
          dbncr = setTimeout(function (this: EngineRuntimeValue) {
            //requestAnimationFrame(function (){
            app.fireEvent('RequestResize');
            if (app.isMobile) {
              window.scrollTo(0, 200);
            }
            //});
          }, 84);
        },
        false,
      );
      //		w.addEventListener ('orientationchange', function () {
      //  			app.fireEvent ('RequestResize');
      //		});
      w.addEventListener(
        'beforeunload',
        function (this: EngineRuntimeValue, e?: EngineRuntimeValue) {
          app.fireEvent('WillUnload');
          // e.preventDefault();
          // e.returnValue = '';
        },
      );
      wavesurfer.on('error', function (this: EngineRuntimeValue, error_msg?: EngineRuntimeValue) {
        // if loading - cancel loading
        setTimeout(function (this: EngineRuntimeValue) {
          app.fireEvent('DidDownloadFile'); // just hides the interface
          q.is_ready = false;
        }, 20);
        app.fireEvent('ShowError', error_msg);
      });
      wavesurfer.on(
        'audioprocess',
        function (this: EngineRuntimeValue, time?: EngineRuntimeValue, stamp?: EngineRuntimeValue) {
          // var time = wavesurfer.getCurrentTime();
          var loudness: EngineRuntimeValue = wavesurfer.getLoudness();
          app.fireEvent('DidAudioProcess', [time, loudness, stamp], wavesurfer.backend.FreqArr);
        },
      );
      wavesurfer.on('DidZoom', function (this: EngineRuntimeValue, e?: EngineRuntimeValue) {
        app.fireEvent(
          'DidZoom',
          [
            wavesurfer.ZoomFactor,
            (wavesurfer.LeftProgress / wavesurfer.getDuration()) * 100,
            wavesurfer.params.verticalZoom,
          ],
          e,
        );
      });
      wavesurfer.on('region-removed', function (this: EngineRuntimeValue) {
        app.fireEvent('DidSetLoop', 0);
        app.fireEvent('DidDestroyRegion');
      });
      app.listenFor('RequestRegionClear', function (this: EngineRuntimeValue) {
        wavesurfer.regions.clear();
      });
      app.listenFor(
        'RequestRegionSet',
        function (this: EngineRuntimeValue, start?: EngineRuntimeValue, end?: EngineRuntimeValue) {
          if (!q.is_ready) return;
          if (start === undefined) {
            start = wavesurfer.LeftProgress / 1;
          }
          if (end === undefined) {
            end = (wavesurfer.LeftProgress + wavesurfer.VisibleDuration) / 1;
          }
          var dur: EngineRuntimeValue = wavesurfer.getDuration();
          start = Math.max(0, Math.min(dur, +start || 0));
          end = Math.max(0, Math.min(dur, +end || 0));
          if (snap_sel && wavesurfer.SnapTime) {
            start = wavesurfer.SnapTime(start);
            end = wavesurfer.SnapTime(end);
          }
          if (end < start) {
            var tmp: EngineRuntimeValue = start;
            start = end;
            end = tmp;
          }
          // add a region where the paste happened
          wavesurfer.regions.clear();
          wavesurfer.regions.add({
            start: start,
            end: end,
            id: 't',
          });
        },
      );
      var copy_buffer: EngineRuntimeValue = null;
      this.GetCopyBuff = function (this: EngineRuntimeValue) {
        return copy_buffer;
      };
      this.SetCopyBuff = function (this: EngineRuntimeValue, buffer?: EngineRuntimeValue) {
        copy_buffer = buffer || null;
        app.fireEvent('DidSetClipboard', copy_buffer ? 1 : 0);
      };
      this.GetSel = function (this: EngineRuntimeValue) {
        var region: EngineRuntimeValue = wavesurfer.regions.list[0];
        if (!region) return false;
        var start: EngineRuntimeValue = q.TrimTo(region.start, 3);
        var end: EngineRuntimeValue = q.TrimTo(region.end - region.start, 3);
        var copybuffer: EngineRuntimeValue = AudioUtils.Copy(start, end);
        return copybuffer;
      };
      this.PlayBuff = function (
        this: EngineRuntimeValue,
        buff_arr?: EngineRuntimeValue,
        chans?: EngineRuntimeValue,
        sample_rate?: EngineRuntimeValue,
        aud_cont?: EngineRuntimeValue,
      ) {
        var audio_ctx: EngineRuntimeValue;
        if (aud_cont) audio_ctx = aud_cont;
        else audio_ctx = new (w.AudioContext || w.webkitAudioContext)();
        if (!audio_ctx) return;
        var bytes: EngineRuntimeValue = buff_arr[0].byteLength / 4;
        var buffer: EngineRuntimeValue = audio_ctx.createBuffer(chans, bytes, sample_rate);
        for (var i: EngineRuntimeValue = 0; i < chans; ++i) {
          buffer.getChannelData(i).set(new Float32Array(buff_arr[i]));
        }
        var source: EngineRuntimeValue = audio_ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(audio_ctx.destination);
        source.start(0);
        return source;
      };
      this.GetFX = function (
        this: EngineRuntimeValue,
        fx?: EngineRuntimeValue,
        val?: EngineRuntimeValue,
      ) {
        return AudioUtils.FXBank[fx](val);
      };
      this.GetWave = function (
        this: EngineRuntimeValue,
        buffer?: EngineRuntimeValue,
        ww?: EngineRuntimeValue,
        hh?: EngineRuntimeValue,
        offset?: EngineRuntimeValue,
        llen?: EngineRuntimeValue,
        cnv?: EngineRuntimeValue,
        cx?: EngineRuntimeValue,
      ) {
        var chan_data: EngineRuntimeValue = buffer.getChannelData(0);
        var sample_rate: EngineRuntimeValue = buffer.sampleRate;
        var peaks: EngineRuntimeValue = [];
        var curr_time: EngineRuntimeValue = 0;
        var width: EngineRuntimeValue = ww || 200;
        var height: EngineRuntimeValue = hh || 80;
        var half_height: EngineRuntimeValue = height / 2;
        var new_width: EngineRuntimeValue = width;
        var pixels: EngineRuntimeValue = 0;
        var raw_pixels: EngineRuntimeValue = 0;
        var start_offset: EngineRuntimeValue = offset || 0;
        var end_offset: EngineRuntimeValue = llen || (buffer.duration * sample_rate) >> 0;
        var length: EngineRuntimeValue = end_offset - start_offset;
        var mod: EngineRuntimeValue = Math.max(1, (length / width) >> 0);
        var max: EngineRuntimeValue = 0;
        var min: EngineRuntimeValue = 0;
        for (var i: EngineRuntimeValue = 0; i < new_width; ++i) {
          var new_offset: EngineRuntimeValue = start_offset + mod * i;
          max = 0;
          min = 0;
          if (new_offset >= 0) {
            for (var j: EngineRuntimeValue = 0; j < mod && new_offset + j < end_offset; j += 3) {
              if (chan_data[new_offset + j] > max) {
                max = chan_data[new_offset + j];
              } else if (chan_data[new_offset + j] < min) {
                min = chan_data[new_offset + j];
              }
            }
          }
          peaks[2 * i] = max;
          peaks[2 * i + 1] = min;
        }
        var canvas: EngineRuntimeValue = cnv;
        var ctx: EngineRuntimeValue = cx;
        if (!canvas) {
          canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          ctx = canvas.getContext('2d', { alpha: false, antialias: false });
        }
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#99c2c6';
        ctx.beginPath();
        ctx.moveTo(0, half_height);
        for (var i: EngineRuntimeValue = 0; i < width; ++i) {
          var peak: EngineRuntimeValue = peaks[i * 2];
          var _h: EngineRuntimeValue = Math.round(peak * half_height);
          ctx.lineTo(i, half_height - _h);
        }
        for (var i: EngineRuntimeValue = width - 1; i >= 0; --i) {
          var peak: EngineRuntimeValue = peaks[i * 2 + 1];
          var _h: EngineRuntimeValue = Math.round(peak * half_height);
          ctx.lineTo(i, half_height - _h);
        }
        ctx.closePath();
        ctx.fill();
        return cnv ? canvas : canvas.toDataURL('image/jpeg', 0.56);
        // ---
      };
      app.listenFor(
        'RequestActionCut',
        function (this: EngineRuntimeValue, use_clipboard?: EngineRuntimeValue) {
          if (!q.is_ready) return;
          var region: EngineRuntimeValue = wavesurfer.regions.list[0];
          if (!region) return false;
          app.fireEvent('RequestPause');
          var start: EngineRuntimeValue = q.TrimTo(region.start, 3);
          var end: EngineRuntimeValue = q.TrimTo(region.end - region.start, 3);
          app.fireEvent('StateRequestPush', {
            desc: use_clipboard ? 'Cut' : 'Delete',
            meta: [start, end],
            data: wavesurfer.backend.buffer,
          });
          var cutbuffer: EngineRuntimeValue = AudioUtils.Trim(start, end);
          wavesurfer.regions.clear();
          var tmp: EngineRuntimeValue = start - 0.03;
          if (tmp < 0) tmp = 0;
          app.fireEvent('RequestSeekTo', tmp / wavesurfer.getDuration());
          if (use_clipboard) {
            copy_buffer = cutbuffer;
            app.fireEvent('DidSetClipboard', 1);
            app.fireEvent('DidCut', cutbuffer);
            OneUp('Cut :: ' + q.TrimTo(start, 2) + ' to ' + q.TrimTo(start / 1 + end / 1, 2), 1100);
          } else {
            OneUp(
              'Delete :: ' + q.TrimTo(start, 2) + ' to ' + q.TrimTo(start / 1 + end / 1, 2),
              1100,
            );
          }
          /*
            var image = app.engine.GetWave (copy_buffer);
            var eel = document.getElementsByClassName('pk_tb')[0];
            var imm = new Image();
            imm.src = image;
            eel.appendChild( imm );
            */
        },
      );
      app.listenFor('RequestActionCopy', function (this: EngineRuntimeValue) {
        if (!q.is_ready) return;
        var region: EngineRuntimeValue = wavesurfer.regions.list[0];
        if (!region) return false;
        app.fireEvent('RequestPause');
        var start: EngineRuntimeValue = q.TrimTo(region.start, 3);
        var end: EngineRuntimeValue = q.TrimTo(region.end - region.start, 3);
        var copybuffer: EngineRuntimeValue = AudioUtils.Copy(start, end);
        copy_buffer = copybuffer;
        app.fireEvent('DidSetClipboard', 1);
        app.fireEvent('DidCopy', copybuffer);
        OneUp('Copied range');
      });
      app.listenFor(
        'RequestActionSilence',
        function (
          this: EngineRuntimeValue,
          offset?: EngineRuntimeValue,
          silence_duration?: EngineRuntimeValue,
        ) {
          if (!q.is_ready) return;
          app.fireEvent('RequestPause');
          var region: EngineRuntimeValue = wavesurfer.regions.list[0];
          var dims: EngineRuntimeValue = [0, 0];
          if (!silence_duration || silence_duration < 0) silence_duration = 1;
          function handleStateInline(
            this: EngineRuntimeValue,
            start?: EngineRuntimeValue,
            end?: EngineRuntimeValue,
          ) {
            app.fireEvent('StateRequestPush', {
              desc: 'Silence',
              meta: [start, end],
              data: wavesurfer.backend.buffer,
            });
          }
          var start: EngineRuntimeValue = offset;
          var end: EngineRuntimeValue = silence_duration;
          handleStateInline(start, end);
          dims = AudioUtils.Insert(offset, AudioUtils.MakeSilence(silence_duration));
          // add a region where the paste happened
          wavesurfer.regions.clear();
          wavesurfer.regions.add({
            start: dims[0],
            end: dims[1],
            id: 't',
          });
          app.fireEvent('RequestSeekTo', dims[0] / wavesurfer.getDuration());
          OneUp('Inserted Silence');
        },
      );
      app.listenFor('RequestActionPaste', function (this: EngineRuntimeValue) {
        if (!q.is_ready) return;
        if (!copy_buffer) return false;
        app.fireEvent('RequestPause');
        var region: EngineRuntimeValue = wavesurfer.regions.list[0];
        var dims: EngineRuntimeValue = [0, 0];
        function handleStateInline(
          this: EngineRuntimeValue,
          start?: EngineRuntimeValue,
          end?: EngineRuntimeValue,
        ) {
          app.fireEvent('StateRequestPush', {
            desc: 'Paste',
            meta: [start, end],
            data: wavesurfer.backend.buffer,
          });
        }
        if (!region) {
          var offset: EngineRuntimeValue = q.TrimTo(wavesurfer.getCurrentTime(), 3);
          handleStateInline(offset);
          dims = AudioUtils.Insert(offset, copy_buffer);
        } else {
          var start: EngineRuntimeValue = q.TrimTo(region.start, 3);
          var end: EngineRuntimeValue = q.TrimTo(region.end - region.start, 3);
          handleStateInline(start, end);
          dims = AudioUtils.Replace(start, end, copy_buffer);
        }
        // add a region where the paste happened
        wavesurfer.regions.clear();
        wavesurfer.regions.add({
          start: dims[0],
          end: dims[1],
          id: 't',
        });
        var new_seek: EngineRuntimeValue = 0;
        if (wavesurfer.getDuration() > 0.0001) {
          new_seek = dims[0] / wavesurfer.getDuration();
        }
        app.fireEvent('RequestSeekTo', new_seek);
        OneUp('Paste to ' + dims[0].toFixed(2), 982);
      });
      var _sk: EngineRuntimeValue = false;
      app.listenFor('RequestActionRecordToggle', function (this: EngineRuntimeValue) {
        if (!q.is_ready) {
          // if not ready then bring up the new recording toggle!
          app.fireEvent('RequestActionNewRec');
          return;
        }
        if (app.rec.isActive()) {
          app.fireEvent('RequestActionRecordStop');
        } else {
          // skipping the sounds of keyboard
          if (_sk) return;
          _sk = true;
          setTimeout(function (this: EngineRuntimeValue) {
            app.fireEvent('RequestActionRecordStart');
            setTimeout(function (this: EngineRuntimeValue) {
              _sk = false;
            }, 50);
          }, 26);
        }
      });
      app.listenFor(
        'RequestActionRecordStop',
        function (this: EngineRuntimeValue, done?: EngineRuntimeValue) {
          if (!q.is_ready) return;
          if (!app.rec.isActive()) {
            done && done(false);
            return false;
          }
          record_stop_done = done || null;
          app.rec.stop();
        },
      );
      app.listenFor('RequestActionRecordStart', function (this: EngineRuntimeValue) {
        if (!q.is_ready) return;
        app.fireEvent('RequestPause');
        if (app.rec.isActive()) return false;
        var pos: EngineRuntimeValue =
          wavesurfer.getCurrentTime() * wavesurfer.backend.buffer.sampleRate;
        app.rec.start(
          pos,
          function (
            this: EngineRuntimeValue,
            offset?: EngineRuntimeValue,
            buffers?: EngineRuntimeValue,
          ) {
            // app.fireEvent ('RequestPause');
            function handleStateInline(
              this: EngineRuntimeValue,
              start?: EngineRuntimeValue,
              end?: EngineRuntimeValue,
            ) {
              app.fireEvent('StateRequestPush', {
                desc: 'Record Audio',
                meta: [start, end],
                data: wavesurfer.backend.buffer,
              });
            }
            // fire did record event!
            app.fireEvent('DidActionRecordStop', !!buffers);
            if (!buffers) {
              afterRecordStop(false);
              return;
            }
            handleStateInline(offset);
            var dims: EngineRuntimeValue = AudioUtils.ReplaceFloatArrays(offset, buffers);
            // add a region where the paste happened
            wavesurfer.regions.clear();
            wavesurfer.regions.add({
              start: dims[0],
              end: dims[1],
              id: 't',
            });
            app.fireEvent('RequestSeekTo', dims[0] / wavesurfer.getDuration());
            OneUp('Recorded Audio ' + dims[0].toFixed(2), 982);
            afterRecordStop(true, dims);
          },
          function (this: EngineRuntimeValue) {
            // on start
            app.fireEvent('DidActionRecordStart');
          },
        );
        // --- ending offset is song full duration...
        // if we have a selected area - mark that one as the end
        var region: EngineRuntimeValue = wavesurfer.regions.list[0];
        if (region) app.rec.setEndingOffset(region.end * wavesurfer.backend.buffer.sampleRate);
        else
          app.rec.setEndingOffset(wavesurfer.getDuration() * wavesurfer.backend.buffer.sampleRate);
      });
      app.listenFor(
        'RequestActionFX_PREVIEW_HardLimit',
        function (this: EngineRuntimeValue, val?: EngineRuntimeValue) {
          if (!q.is_ready) return;
          if (AudioUtils.previewing) {
            AudioUtils.FXPreviewStop();
            app.fireEvent('DidStopPreview');
            return;
          }
          var region: EngineRuntimeValue = wavesurfer.regions.list[0];
          var dims: EngineRuntimeValue = [0, 0];
          if (!region) {
            wavesurfer.regions.add({
              start: 0.0,
              end: wavesurfer.getDuration() - 0.0,
              id: 't',
            });
            region = wavesurfer.regions.list[0];
          }
          var start: EngineRuntimeValue = q.TrimTo(region.start, 3);
          var end: EngineRuntimeValue = q.TrimTo(region.end - region.start, 3);
          AudioUtils.FXPreview(start, end, AudioUtils.FXBank.HardLimit(val));
          app.fireEvent('DidStartPreview');
        },
      );
      app.listenFor(
        'RequestActionFX_HardLimit',
        function (this: EngineRuntimeValue, val?: EngineRuntimeValue) {
          if (!q.is_ready) return;
          app.fireEvent('RequestPause');
          var region: EngineRuntimeValue = wavesurfer.regions.list[0];
          var dims: EngineRuntimeValue = [0, 0];
          function handleStateInline(
            this: EngineRuntimeValue,
            start?: EngineRuntimeValue,
            end?: EngineRuntimeValue,
          ) {
            app.fireEvent('StateRequestPush', {
              desc: 'Apply Hard Limit (fx)',
              meta: [start, end],
              data: wavesurfer.backend.buffer,
            });
          }
          if (!region) {
            wavesurfer.regions.add({
              start: 0.0,
              end: wavesurfer.getDuration() - 0.0,
              id: 't',
            });
            region = wavesurfer.regions.list[0];
          }
          var start: EngineRuntimeValue = q.TrimTo(region.start, 3);
          var end: EngineRuntimeValue = q.TrimTo(region.end - region.start, 3);
          handleStateInline(start, end);
          AudioUtils.FX(start, end, AudioUtils.FXBank.HardLimit(val));
          OneUp('Applied Hard Limit (fx)');
        },
      );
      app.listenFor(
        'RequestActionFX_PARAMEQ',
        function (this: EngineRuntimeValue, val?: EngineRuntimeValue) {
          if (!q.is_ready) return;
          app.fireEvent('RequestPause');
          var region: EngineRuntimeValue = wavesurfer.regions.list[0];
          var dims: EngineRuntimeValue = [0, 0];
          function handleStateInline(
            this: EngineRuntimeValue,
            start?: EngineRuntimeValue,
            end?: EngineRuntimeValue,
          ) {
            app.fireEvent('StateRequestPush', {
              desc: 'Apply Parametric EQ (fx)',
              meta: [start, end],
              data: wavesurfer.backend.buffer,
            });
          }
          if (!region) {
            wavesurfer.regions.add({
              start: 0.0,
              end: wavesurfer.getDuration() - 0.0,
              id: 't',
            });
            region = wavesurfer.regions.list[0];
          }
          var start: EngineRuntimeValue = q.TrimTo(region.start, 3);
          var end: EngineRuntimeValue = q.TrimTo(region.end - region.start, 3);
          handleStateInline(start, end);
          AudioUtils.FX(start, end, AudioUtils.FXBank.ParametricEQ(val));
          OneUp('Applied Parametric EQ (fx)');
        },
      );
      app.listenFor(
        'RequestActionFX_PREVIEW_PARAMEQ',
        function (this: EngineRuntimeValue, val?: EngineRuntimeValue) {
          if (!q.is_ready || !val) return;
          if (AudioUtils.previewing) {
            AudioUtils.FXPreviewStop();
            app.fireEvent('DidStopPreview');
            return;
          }
          var region: EngineRuntimeValue = wavesurfer.regions.list[0];
          var dims: EngineRuntimeValue = [0, 0];
          if (!region) {
            wavesurfer.regions.add({
              start: 0.0,
              end: wavesurfer.getDuration() - 0.0,
              id: 't',
            });
            region = wavesurfer.regions.list[0];
          }
          var start: EngineRuntimeValue = q.TrimTo(region.start, 3);
          var end: EngineRuntimeValue = q.TrimTo(region.end - region.start, 3);
          AudioUtils.FXPreview(start, end, AudioUtils.FXBank.ParametricEQ(val));
          app.fireEvent('DidStartPreview');
        },
      );
      app.listenFor(
        'RequestActionFX_PREVIEW_DISTORT',
        function (this: EngineRuntimeValue, val?: EngineRuntimeValue) {
          if (!q.is_ready) return;
          if (AudioUtils.previewing) {
            AudioUtils.FXPreviewStop();
            app.fireEvent('DidStopPreview');
            return;
          }
          var region: EngineRuntimeValue = wavesurfer.regions.list[0];
          var dims: EngineRuntimeValue = [0, 0];
          if (!region) {
            wavesurfer.regions.add({
              start: 0.0,
              end: wavesurfer.getDuration() - 0.0,
              id: 't',
            });
            region = wavesurfer.regions.list[0];
          }
          var start: EngineRuntimeValue = q.TrimTo(region.start, 3);
          var end: EngineRuntimeValue = q.TrimTo(region.end - region.start, 3);
          AudioUtils.FXPreview(start, end, AudioUtils.FXBank.Distortion(val));
          app.fireEvent('DidStartPreview');
        },
      );
      app.listenFor(
        'RequestActionFX_DISTORT',
        function (this: EngineRuntimeValue, val?: EngineRuntimeValue) {
          if (!q.is_ready) return;
          app.fireEvent('RequestPause');
          var region: EngineRuntimeValue = wavesurfer.regions.list[0];
          var dims: EngineRuntimeValue = [0, 0];
          function handleStateInline(
            this: EngineRuntimeValue,
            start?: EngineRuntimeValue,
            end?: EngineRuntimeValue,
          ) {
            app.fireEvent('StateRequestPush', {
              desc: 'Apply Distortion (fx)',
              meta: [start, end],
              data: wavesurfer.backend.buffer,
            });
          }
          if (!region) {
            wavesurfer.regions.add({
              start: 0.0,
              end: wavesurfer.getDuration() - 0.0,
              id: 't',
            });
            region = wavesurfer.regions.list[0];
          }
          var start: EngineRuntimeValue = q.TrimTo(region.start, 3);
          var end: EngineRuntimeValue = q.TrimTo(region.end - region.start, 3);
          handleStateInline(start, end);
          AudioUtils.FX(start, end, AudioUtils.FXBank.Distortion(val));
          OneUp('Applied Distortion (fx)');
        },
      );
      app.listenFor(
        'RequestActionFX_PREVIEW_DELAY',
        function (this: EngineRuntimeValue, val?: EngineRuntimeValue) {
          if (!q.is_ready) return;
          if (AudioUtils.previewing) {
            AudioUtils.FXPreviewStop();
            app.fireEvent('DidStopPreview');
            return;
          }
          var region: EngineRuntimeValue = wavesurfer.regions.list[0];
          var dims: EngineRuntimeValue = [0, 0];
          if (!region) {
            wavesurfer.regions.add({
              start: 0.0,
              end: wavesurfer.getDuration() - 0.0,
              id: 't',
            });
            region = wavesurfer.regions.list[0];
          }
          var start: EngineRuntimeValue = q.TrimTo(region.start, 3);
          var end: EngineRuntimeValue = q.TrimTo(region.end - region.start, 3);
          AudioUtils.FXPreview(start, end, AudioUtils.FXBank.Delay(val));
          app.fireEvent('DidStartPreview');
        },
      );
      app.listenFor(
        'RequestActionFX_DELAY',
        function (this: EngineRuntimeValue, val?: EngineRuntimeValue) {
          if (!q.is_ready) return;
          app.fireEvent('RequestPause');
          var region: EngineRuntimeValue = wavesurfer.regions.list[0];
          var dims: EngineRuntimeValue = [0, 0];
          function handleStateInline(
            this: EngineRuntimeValue,
            start?: EngineRuntimeValue,
            end?: EngineRuntimeValue,
          ) {
            app.fireEvent('StateRequestPush', {
              desc: 'Apply Delay (fx)',
              meta: [start, end],
              data: wavesurfer.backend.buffer,
            });
          }
          if (!region) {
            wavesurfer.regions.add({
              start: 0.0,
              end: wavesurfer.getDuration() - 0.0,
              id: 't',
            });
            region = wavesurfer.regions.list[0];
          }
          var start: EngineRuntimeValue = q.TrimTo(region.start, 3);
          var end: EngineRuntimeValue = q.TrimTo(region.end - region.start, 3);
          handleStateInline(start, end);
          AudioUtils.FX(start, end, AudioUtils.FXBank.Delay(val));
          OneUp('Applied Delay (fx)');
        },
      );
      app.listenFor(
        'RequestActionFX_PREVIEW_REVERB',
        function (this: EngineRuntimeValue, val?: EngineRuntimeValue) {
          if (!q.is_ready) return;
          if (AudioUtils.previewing) {
            AudioUtils.FXPreviewStop();
            app.fireEvent('DidStopPreview');
            return;
          }
          var region: EngineRuntimeValue = wavesurfer.regions.list[0];
          var dims: EngineRuntimeValue = [0, 0];
          if (!region) {
            wavesurfer.regions.add({
              start: 0.0,
              end: wavesurfer.getDuration() - 0.0,
              id: 't',
            });
            region = wavesurfer.regions.list[0];
          }
          var start: EngineRuntimeValue = q.TrimTo(region.start, 3);
          var end: EngineRuntimeValue = q.TrimTo(region.end - region.start, 3);
          AudioUtils.FXPreview(start, end, AudioUtils.FXBank.Reverb(val));
          app.fireEvent('DidStartPreview');
        },
      );
      app.listenFor(
        'RequestActionFX_REVERB',
        function (this: EngineRuntimeValue, val?: EngineRuntimeValue) {
          if (!q.is_ready) return;
          app.fireEvent('RequestPause');
          var region: EngineRuntimeValue = wavesurfer.regions.list[0];
          var dims: EngineRuntimeValue = [0, 0];
          function handleStateInline(
            this: EngineRuntimeValue,
            start?: EngineRuntimeValue,
            end?: EngineRuntimeValue,
          ) {
            app.fireEvent('StateRequestPush', {
              desc: 'Apply Reverb (fx)',
              meta: [start, end],
              data: wavesurfer.backend.buffer,
            });
          }
          if (!region) {
            wavesurfer.regions.add({
              start: 0.0,
              end: wavesurfer.getDuration() - 0.0,
              id: 't',
            });
            region = wavesurfer.regions.list[0];
          }
          var start: EngineRuntimeValue = q.TrimTo(region.start, 3);
          var end: EngineRuntimeValue = q.TrimTo(region.end - region.start, 3);
          handleStateInline(start, end);
          AudioUtils.FX(start, end, AudioUtils.FXBank.Reverb(val));
          OneUp('Applied Reverb (fx)');
        },
      );
      app.listenFor(
        'RequestActionFX_PREVIEW_COMPRESSOR',
        function (this: EngineRuntimeValue, val?: EngineRuntimeValue) {
          if (!q.is_ready) return;
          if (AudioUtils.previewing) {
            AudioUtils.FXPreviewStop();
            app.fireEvent('DidStopPreview');
            return;
          }
          var region: EngineRuntimeValue = wavesurfer.regions.list[0];
          var dims: EngineRuntimeValue = [0, 0];
          if (!region) {
            wavesurfer.regions.add({
              start: 0.0,
              end: wavesurfer.getDuration() - 0.0,
              id: 't',
            });
            region = wavesurfer.regions.list[0];
          }
          var start: EngineRuntimeValue = q.TrimTo(region.start, 3);
          var end: EngineRuntimeValue = q.TrimTo(region.end - region.start, 3);
          AudioUtils.FXPreview(start, end, AudioUtils.FXBank.Compressor(val));
          app.fireEvent('DidStartPreview');
        },
      );
      app.listenFor(
        'RequestActionFX_Compressor',
        function (this: EngineRuntimeValue, val?: EngineRuntimeValue) {
          if (!q.is_ready) return;
          app.fireEvent('RequestPause');
          var region: EngineRuntimeValue = wavesurfer.regions.list[0];
          var dims: EngineRuntimeValue = [0, 0];
          function handleStateInline(
            this: EngineRuntimeValue,
            start?: EngineRuntimeValue,
            end?: EngineRuntimeValue,
          ) {
            app.fireEvent('StateRequestPush', {
              desc: 'Apply Compressor (fx)',
              meta: [start, end],
              data: wavesurfer.backend.buffer,
            });
          }
          if (!region) {
            wavesurfer.regions.add({
              start: 0.0,
              end: wavesurfer.getDuration() - 0.0,
              id: 't',
            });
            region = wavesurfer.regions.list[0];
          }
          var start: EngineRuntimeValue = q.TrimTo(region.start, 3);
          var end: EngineRuntimeValue = q.TrimTo(region.end - region.start, 3);
          handleStateInline(start, end);
          AudioUtils.FX(start, end, AudioUtils.FXBank.Compressor(val));
          OneUp('Applied Compressor (fx)');
        },
      );
      function previewNormalize(
        this: EngineRuntimeValue,
        val?: EngineRuntimeValue,
        fx?: EngineRuntimeValue,
      ) {
        if (!q.is_ready || !val) return;
        if (AudioUtils.previewing) {
          AudioUtils.FXPreviewStop();
          app.fireEvent('DidStopPreview');
          return;
        }
        var region: EngineRuntimeValue = wavesurfer.regions.list[0];
        if (!region) {
          wavesurfer.regions.add({
            start: 0.0,
            end: wavesurfer.getDuration() - 0.0,
            id: 't',
          });
          region = wavesurfer.regions.list[0];
        }
        var start: EngineRuntimeValue = q.TrimTo(region.start, 3);
        var end: EngineRuntimeValue = q.TrimTo(region.end - region.start, 3);
        AudioUtils.FXPreview(start, end, fx(val));
        app.fireEvent('DidStartPreview');
      }
      app.listenFor(
        'RequestActionFX_PREVIEW_Normalize',
        function (this: EngineRuntimeValue, val?: EngineRuntimeValue) {
          previewNormalize(val, AudioUtils.FXBank.Normalize);
        },
      );
      app.listenFor(
        'RequestActionFX_PREVIEW_NormalizeRMS',
        function (this: EngineRuntimeValue, val?: EngineRuntimeValue) {
          previewNormalize(val, AudioUtils.FXBank.NormalizeRMS);
        },
      );
      app.listenFor(
        'RequestActionFX_PREVIEW_NormalizeLUFS',
        function (this: EngineRuntimeValue, val?: EngineRuntimeValue) {
          previewNormalize(val, AudioUtils.FXBank.NormalizeLUFS);
        },
      );
      app.listenFor(
        'RequestActionFX_Normalize',
        function (this: EngineRuntimeValue, val?: EngineRuntimeValue) {
          if (!q.is_ready) return;
          app.fireEvent('RequestPause');
          var region: EngineRuntimeValue = wavesurfer.regions.list[0];
          var dims: EngineRuntimeValue = [0, 0];
          function handleStateInline(
            this: EngineRuntimeValue,
            start?: EngineRuntimeValue,
            end?: EngineRuntimeValue,
          ) {
            app.fireEvent('StateRequestPush', {
              desc: 'Normalize ',
              meta: [start, end],
              data: wavesurfer.backend.buffer,
            });
          }
          if (!region) {
            wavesurfer.regions.add({
              start: 0.0,
              end: wavesurfer.getDuration() - 0.0,
              id: 't',
            });
            region = wavesurfer.regions.list[0];
          }
          var start: EngineRuntimeValue = q.TrimTo(region.start, 3);
          var end: EngineRuntimeValue = q.TrimTo(region.end - region.start, 3);
          handleStateInline(start, end);
          AudioUtils.FX(start, end, AudioUtils.FXBank.Normalize(val));
          OneUp('Applied Normalize');
        },
      );
      app.listenFor(
        'RequestActionFX_Loudness',
        function (this: EngineRuntimeValue, done?: EngineRuntimeValue) {
          if (!q.is_ready) {
            done && done(null);
            return;
          }
          var region: EngineRuntimeValue = wavesurfer.regions.list[0];
          if (!region) {
            wavesurfer.regions.add({
              start: 0.0,
              end: wavesurfer.getDuration() - 0.0,
              id: 't',
            });
            region = wavesurfer.regions.list[0];
          }
          var start: EngineRuntimeValue = q.TrimTo(region.start, 3);
          var end: EngineRuntimeValue = q.TrimTo(region.end - region.start, 3);
          done && done(AudioUtils.Loudness(start, end));
        },
      );
      app.listenFor(
        'RequestActionFX_NormalizeRMS',
        function (this: EngineRuntimeValue, val?: EngineRuntimeValue) {
          if (!q.is_ready) return;
          app.fireEvent('RequestPause');
          var region: EngineRuntimeValue = wavesurfer.regions.list[0];
          function handleStateInline(
            this: EngineRuntimeValue,
            start?: EngineRuntimeValue,
            end?: EngineRuntimeValue,
          ) {
            app.fireEvent('StateRequestPush', {
              desc: 'Normalize RMS ',
              meta: [start, end],
              data: wavesurfer.backend.buffer,
            });
          }
          if (!region) {
            wavesurfer.regions.add({
              start: 0.0,
              end: wavesurfer.getDuration() - 0.0,
              id: 't',
            });
            region = wavesurfer.regions.list[0];
          }
          var start: EngineRuntimeValue = q.TrimTo(region.start, 3);
          var end: EngineRuntimeValue = q.TrimTo(region.end - region.start, 3);
          handleStateInline(start, end);
          AudioUtils.FX(start, end, AudioUtils.FXBank.NormalizeRMS(val));
          OneUp('Applied RMS Normalize');
        },
      );
      app.listenFor(
        'RequestActionFX_NormalizeLUFS',
        function (this: EngineRuntimeValue, val?: EngineRuntimeValue) {
          if (!q.is_ready) return;
          app.fireEvent('RequestPause');
          var region: EngineRuntimeValue = wavesurfer.regions.list[0];
          function handleStateInline(
            this: EngineRuntimeValue,
            start?: EngineRuntimeValue,
            end?: EngineRuntimeValue,
          ) {
            app.fireEvent('StateRequestPush', {
              desc: 'Normalize LUFS ',
              meta: [start, end],
              data: wavesurfer.backend.buffer,
            });
          }
          if (!region) {
            wavesurfer.regions.add({
              start: 0.0,
              end: wavesurfer.getDuration() - 0.0,
              id: 't',
            });
            region = wavesurfer.regions.list[0];
          }
          var start: EngineRuntimeValue = q.TrimTo(region.start, 3);
          var end: EngineRuntimeValue = q.TrimTo(region.end - region.start, 3);
          handleStateInline(start, end);
          AudioUtils.FX(start, end, AudioUtils.FXBank.NormalizeLUFS(val));
          OneUp(
            val && val.limited
              ? 'Applied LUFS Normalize (ceiling limited)'
              : 'Applied LUFS Normalize',
          );
        },
      );
      app.listenFor(
        'RequestActionFX_Invert',
        function (this: EngineRuntimeValue, val?: EngineRuntimeValue) {
          if (!q.is_ready) return;
          app.fireEvent('RequestPause');
          var region: EngineRuntimeValue = wavesurfer.regions.list[0];
          var dims: EngineRuntimeValue = [0, 0];
          function handleStateInline(
            this: EngineRuntimeValue,
            start?: EngineRuntimeValue,
            end?: EngineRuntimeValue,
          ) {
            app.fireEvent('StateRequestPush', {
              desc: 'Invert ',
              meta: [start, end],
              data: wavesurfer.backend.buffer,
            });
          }
          if (!region) {
            wavesurfer.regions.add({
              start: 0.0,
              end: wavesurfer.getDuration() - 0.0,
              id: 't',
            });
            region = wavesurfer.regions.list[0];
          }
          var start: EngineRuntimeValue = q.TrimTo(region.start, 3);
          var end: EngineRuntimeValue = q.TrimTo(region.end - region.start, 3);
          handleStateInline(start, end);
          AudioUtils.FX(start, end, AudioUtils.FXBank.Invert());
          OneUp('Applied Invert');
        },
      );
      app.listenFor(
        'RequestActionFX_RemSil',
        function (this: EngineRuntimeValue, val?: EngineRuntimeValue) {
          if (!q.is_ready) return;
          app.fireEvent('RequestPause');
          var region: EngineRuntimeValue = wavesurfer.regions.list[0];
          function handleStateInline(
            this: EngineRuntimeValue,
            start?: EngineRuntimeValue,
            end?: EngineRuntimeValue,
          ) {
            app.fireEvent('StateRequestPush', {
              desc: 'Remove Silence ',
              meta: [start, end],
              data: wavesurfer.backend.buffer,
            });
          }
          if (!region) {
            wavesurfer.regions.add({
              start: 0.0,
              end: wavesurfer.getDuration() - 0.0,
              id: 't',
            });
            region = wavesurfer.regions.list[0];
          }
          var start: EngineRuntimeValue = q.TrimTo(region.start, 3);
          var end: EngineRuntimeValue = q.TrimTo(region.end - region.start, 3);
          handleStateInline(start, end);
          var originalBuffer: EngineRuntimeValue = wavesurfer.backend.buffer;
          var sil_arr: EngineRuntimeValue = [];
          var sil_offset: EngineRuntimeValue = 210;
          var vol_offset: EngineRuntimeValue = 56;
          var region_start: EngineRuntimeValue = Math.max(
            0,
            Math.min(originalBuffer.length, (region.start * originalBuffer.sampleRate) >> 0),
          );
          var region_end: EngineRuntimeValue = Math.max(
            region_start,
            Math.min(originalBuffer.length, (region.end * originalBuffer.sampleRate) >> 0),
          );
          var count: EngineRuntimeValue = 0;
          var inv_count: EngineRuntimeValue = 0;
          var sil_start: EngineRuntimeValue = 0;
          var sil_end: EngineRuntimeValue = 0;
          var found: EngineRuntimeValue = false;
          var jump: EngineRuntimeValue = 500;
          for (var i: EngineRuntimeValue = 0; i < 1; ++i) {
            var channel: EngineRuntimeValue = originalBuffer.getChannelData(i);
            for (var j: EngineRuntimeValue = region_start; j < region_end; ++j) {
              if (Math.abs(channel[j]) < 0.000368) {
                if (count === 0) {
                  sil_start = Math.max(region_start, j - jump);
                }
                if (++count > sil_offset) {
                  inv_count = 0;
                  sil_end = j;
                  found = true;
                }
              } else {
                if (found) {
                  if (++inv_count > vol_offset) {
                    sil_arr.push([sil_start, sil_end]);
                    j += jump;
                    count = 0;
                    sil_start = 0;
                    sil_end = 0;
                    found = false;
                    inv_count = 0;
                  } else {
                    sil_end = j;
                  }
                } else {
                  count = 0;
                  sil_start = 0;
                  sil_end = 0;
                  found = false;
                  inv_count = 0;
                }
              }
            }
            if (found) {
              sil_arr.push([sil_start, sil_end]);
            }
          }
          if (sil_arr.length > 0) {
            var reduce: EngineRuntimeValue = 0;
            for (var i: EngineRuntimeValue = 0; i < sil_arr.length; ++i) {
              reduce += sil_arr[i][1] - sil_arr[i][0];
            }
            var emptySegment: EngineRuntimeValue = wavesurfer.backend.ac.createBuffer(
              originalBuffer.numberOfChannels,
              Math.max(1, originalBuffer.length - reduce),
              originalBuffer.sampleRate,
            );
            for (var i: EngineRuntimeValue = 0; i < originalBuffer.numberOfChannels; ++i) {
              var channel: EngineRuntimeValue = originalBuffer.getChannelData(i);
              var new_channel: EngineRuntimeValue = emptySegment.getChannelData(i);
              var sil_offset: EngineRuntimeValue = 0;
              var o: EngineRuntimeValue = 0;
              var sil_curr: EngineRuntimeValue = sil_arr[o];
              var sil_curr_start: EngineRuntimeValue = sil_curr[0];
              var sil_curr_end: EngineRuntimeValue = sil_curr[1];
              var h: EngineRuntimeValue = 0;
              var use_old: EngineRuntimeValue = false;
              var old_h: EngineRuntimeValue = 0;
              for (var j: EngineRuntimeValue = 0; j < new_channel.length; ++j) {
                h = j + sil_offset;
                if (h > sil_curr_start && h < sil_curr_end) {
                  if (h < sil_curr_start + jump) {
                    var perc: EngineRuntimeValue = (jump - (h - sil_curr_start)) / jump;
                    new_channel[j] = (channel[h] || 0) * perc; // / (h - sil_curr_start));
                    new_channel[j] +=
                      (1 - perc) *
                      (channel[j + (sil_offset + (sil_curr_end - sil_curr_start))] || 0);
                    continue;
                  } else {
                    sil_offset = sil_offset + (sil_curr_end - sil_curr_start);
                    sil_curr = sil_arr[++o];
                    if (sil_curr) {
                      sil_curr_start = sil_curr[0];
                      sil_curr_end = sil_curr[1];
                    }
                    h = j + sil_offset;
                  }
                }
                new_channel[j] = channel[h] || 0;
              }
            }
            AudioUtils.FullReplace(emptySegment);
            var new_end: EngineRuntimeValue =
              start + Math.max(0, end - reduce / originalBuffer.sampleRate);
            wavesurfer.regions.clear();
            if (new_end > start) {
              wavesurfer.regions.add({
                start: start,
                end: Math.min(new_end, wavesurfer.getDuration()),
                id: 't',
              });
            }
          }
          setTimeout(function (this: EngineRuntimeValue) {
            wavesurfer.drawBuffer();
          }, 40);
          OneUp('Applied :: Remove Silence');
        },
      );
      var _compute_channels: EngineRuntimeValue = function (this: EngineRuntimeValue) {
        var buff: EngineRuntimeValue = wavesurfer.backend.buffer;
        var chans: EngineRuntimeValue = buff.numberOfChannels;
        if (chans === 1) {
          wavesurfer.ActiveChannels = [1];
          app.el.classList.add('pk_mono');
        } else {
          wavesurfer.ActiveChannels = [1, 1];
          app.el.classList.remove('pk_mono');
        }
        wavesurfer.drawer.params.ActiveChannels = wavesurfer.ActiveChannels;
        wavesurfer.SelectedChannelsLen = chans;
      };
      app.listenFor(
        'RequestActionFX_Flip',
        function (this: EngineRuntimeValue, val?: EngineRuntimeValue, val2?: EngineRuntimeValue) {
          if (!q.is_ready) return;
          app.fireEvent('RequestPause');
          var start: EngineRuntimeValue = 0;
          var end: EngineRuntimeValue = wavesurfer.getDuration();
          function handleStateInline(
            this: EngineRuntimeValue,
            start?: EngineRuntimeValue,
            end?: EngineRuntimeValue,
            title?: EngineRuntimeValue,
            cb?: EngineRuntimeValue,
          ) {
            app.fireEvent('StateRequestPush', {
              desc: title,
              meta: [start, end],
              data: wavesurfer.backend.buffer,
              cb: cb,
            });
          }
          if (val === 'flip') {
            handleStateInline(start, end, 'Flip Channels');
            AudioUtils.FX(start, end, AudioUtils.FXBank.Flip(val));
          } else if (val === 'stereo') {
            handleStateInline(start, end, 'Make Stereo', function (this: EngineRuntimeValue) {
              _compute_channels();
            });
            var originalBuffer: EngineRuntimeValue = wavesurfer.backend.buffer;
            var emptySegment: EngineRuntimeValue = wavesurfer.backend.ac.createBuffer(
              2,
              originalBuffer.length,
              originalBuffer.sampleRate,
            );
            emptySegment.getChannelData(0).set(originalBuffer.getChannelData(0));
            emptySegment.getChannelData(1).set(originalBuffer.getChannelData(0));
            AudioUtils.FullReplace(emptySegment);
            wavesurfer.regions.clear();
            wavesurfer.regions.add({
              start: start,
              end: end,
              id: 't',
            });
            _compute_channels();
            app.fireEvent('RequestSeekTo', 0.0);
          } else if (val === 'mono') {
            handleStateInline(start, end, 'Make Mono', function (this: EngineRuntimeValue) {
              _compute_channels();
            });
            var originalBuffer: EngineRuntimeValue = wavesurfer.backend.buffer;
            var emptySegment: EngineRuntimeValue = wavesurfer.backend.ac.createBuffer(
              1,
              originalBuffer.length,
              originalBuffer.sampleRate,
            );
            emptySegment.getChannelData(0).set(originalBuffer.getChannelData(val2));
            AudioUtils.FullReplace(emptySegment);
            wavesurfer.regions.clear();
            wavesurfer.regions.add({
              start: start,
              end: end,
              id: 't',
            });
            _compute_channels();
            app.fireEvent('RequestSeekTo', 0.0);
          }
          OneUp('Applied Channel Change: ' + val);
        },
      );
      function repairSpliceChannel(
        this: EngineRuntimeValue,
        x?: EngineRuntimeValue,
        sampleRate?: EngineRuntimeValue,
        sens?: EngineRuntimeValue,
      ) {
        var len: EngineRuntimeValue = x.length;
        if (len < 512) return 0;
        var k: EngineRuntimeValue = sens === 'low' ? 8 : sens === 'high' ? 4 : 6;
        var absFloor: EngineRuntimeValue = sens === 'low' ? 0.05 : sens === 'high' ? 0.015 : 0.025;
        var dcFloor: EngineRuntimeValue = sens === 'low' ? 0.04 : sens === 'high' ? 0.008 : 0.018;
        var dcW: EngineRuntimeValue = Math.max(256, (sampleRate * 0.02) >> 0);
        var fadeW: EngineRuntimeValue = Math.max(16, (sampleRate * 0.004) >> 0);
        var halfFade: EngineRuntimeValue = fadeW >> 1;
        var ema: EngineRuntimeValue = 0;
        var boot: EngineRuntimeValue = Math.min(2048, len);
        for (var i: EngineRuntimeValue = 1; i < boot; ++i) ema += Math.abs(x[i] - x[i - 1]);
        ema = ema / (boot - 1) || 1e-4;
        if (ema < 1e-4) ema = 1e-4;
        var alpha: EngineRuntimeValue = 1 / 2048;
        var count: EngineRuntimeValue = 0;
        i = dcW + halfFade + 4;
        while (i < len - dcW - halfFade - 4) {
          var d: EngineRuntimeValue = x[i] - x[i - 1];
          var absD: EngineRuntimeValue = d < 0 ? -d : d;
          if (absD > ema * k && absD > absFloor) {
            var isolated: EngineRuntimeValue = true;
            for (var ck: EngineRuntimeValue = 1; ck <= 20; ++ck) {
              if (i + ck >= len) break;
              var dd: EngineRuntimeValue = x[i + ck] - x[i + ck - 1];
              if ((dd < 0 ? -dd : dd) > absD * 0.5) {
                isolated = false;
                break;
              }
            }
            if (isolated) {
              var preMean: EngineRuntimeValue = 0,
                postMean: EngineRuntimeValue = 0,
                preE: EngineRuntimeValue = 0,
                postE: EngineRuntimeValue = 0;
              for (var j: EngineRuntimeValue = 1; j <= dcW; ++j) {
                var pv: EngineRuntimeValue = x[i - j],
                  pov: EngineRuntimeValue = x[i + j - 1];
                preMean += pv;
                postMean += pov;
                preE += pv * pv;
                postE += pov * pov;
              }
              preMean /= dcW;
              postMean /= dcW;
              var dcDiff: EngineRuntimeValue = postMean - preMean;
              var absDc: EngineRuntimeValue = dcDiff < 0 ? -dcDiff : dcDiff;
              var sameDir: EngineRuntimeValue = (d > 0 && dcDiff > 0) || (d < 0 && dcDiff < 0);
              var preVar: EngineRuntimeValue = preE / dcW - preMean * preMean;
              var postVar: EngineRuntimeValue = postE / dcW - postMean * postMean;
              var loV: EngineRuntimeValue = preVar < postVar ? preVar : postVar;
              var hiV: EngineRuntimeValue = preVar < postVar ? postVar : preVar;
              var balanced: EngineRuntimeValue = loV > 1e-6 && hiV < loV * 4;
              if (sameDir && balanced && absDc > dcFloor && absDc > absD * 0.5) {
                var s: EngineRuntimeValue = i - halfFade;
                var e: EngineRuntimeValue = i + halfFade;
                if (s < 2) s = 2;
                if (e > len - 2) e = len - 2;
                var x0: EngineRuntimeValue = x[s - 1],
                  x1: EngineRuntimeValue = x[e];
                var m0: EngineRuntimeValue = 0.5 * (x[s] - x[s - 2]);
                var m1: EngineRuntimeValue = 0.5 * (x[e + 1] - x[e - 1]);
                var span: EngineRuntimeValue = e - (s - 1);
                for (var jj: EngineRuntimeValue = s; jj < e; ++jj) {
                  var t: EngineRuntimeValue = (jj - (s - 1)) / span;
                  var t2: EngineRuntimeValue = t * t,
                    t3: EngineRuntimeValue = t2 * t;
                  var h00: EngineRuntimeValue = 2 * t3 - 3 * t2 + 1;
                  var h10: EngineRuntimeValue = t3 - 2 * t2 + t;
                  var h01: EngineRuntimeValue = -2 * t3 + 3 * t2;
                  var h11: EngineRuntimeValue = t3 - t2;
                  x[jj] = h00 * x0 + h10 * m0 * span + h01 * x1 + h11 * m1 * span;
                }
                ++count;
                i = e + dcW;
                continue;
              }
            }
          }
          ema = ema * (1 - alpha) + absD * alpha;
          if (ema < 1e-4) ema = 1e-4;
          ++i;
        }
        return count;
      }
      function deClickChannel(
        this: EngineRuntimeValue,
        x?: EngineRuntimeValue,
        sampleRate?: EngineRuntimeValue,
        sens?: EngineRuntimeValue,
      ) {
        var len: EngineRuntimeValue = x.length;
        if (len < 128) return 0;
        var k: EngineRuntimeValue = sens === 'low' ? 6 : sens === 'high' ? 3 : 4;
        var maxW: EngineRuntimeValue = Math.max(8, (sampleRate * 0.002) >> 0);
        var minW: EngineRuntimeValue = 2,
          margin: EngineRuntimeValue = 2;
        var absFloor: EngineRuntimeValue = sens === 'low' ? 0.03 : sens === 'high' ? 0.008 : 0.015;
        var i: EngineRuntimeValue,
          d: EngineRuntimeValue,
          sd: EngineRuntimeValue,
          ema: EngineRuntimeValue = 0;
        var boot: EngineRuntimeValue = Math.min(2048, len);
        for (i = 1; i < boot; ++i) ema += Math.abs(x[i] - x[i - 1]);
        ema = ema / (boot - 1) || 1e-9;
        if (ema < 1e-4) ema = 1e-4;
        var alpha: EngineRuntimeValue = 1 / 2048;
        var count: EngineRuntimeValue = 0;
        i = 4;
        while (i < len - maxW - 4) {
          sd = x[i] - x[i - 1];
          d = sd < 0 ? -sd : sd;
          if (d > ema * k && d > absFloor) {
            var thresh: EngineRuntimeValue = d * 0.4;
            var end: EngineRuntimeValue = i + 1;
            var maxEnd: EngineRuntimeValue = i + maxW;
            var posMax: EngineRuntimeValue = sd,
              negMax: EngineRuntimeValue = sd;
            while (end < maxEnd && Math.abs(x[end] - x[end - 1]) > thresh) {
              var dd: EngineRuntimeValue = x[end] - x[end - 1];
              if (dd > posMax) posMax = dd;
              if (dd < negMax) negMax = dd;
              ++end;
            }
            var w: EngineRuntimeValue = end - i;
            var hitMax: EngineRuntimeValue = end >= maxEnd;
            var bipolar: EngineRuntimeValue = posMax > thresh && -negMax > thresh;
            if (w >= minW && !hitMax && bipolar) {
              var s: EngineRuntimeValue = i - margin;
              var e: EngineRuntimeValue = end + margin;
              if (s < 2) s = 2;
              if (e > len - 2) e = len - 2;
              var x0: EngineRuntimeValue = x[s - 1],
                x1: EngineRuntimeValue = x[e];
              var m0: EngineRuntimeValue = 0.5 * (x[s] - x[s - 2]);
              var m1: EngineRuntimeValue = 0.5 * (x[e + 1] - x[e - 1]);
              var span: EngineRuntimeValue = e - (s - 1);
              for (var j: EngineRuntimeValue = s; j < e; ++j) {
                var t: EngineRuntimeValue = (j - (s - 1)) / span;
                var t2: EngineRuntimeValue = t * t;
                var t3: EngineRuntimeValue = t2 * t;
                var h00: EngineRuntimeValue = 2 * t3 - 3 * t2 + 1;
                var h10: EngineRuntimeValue = t3 - 2 * t2 + t;
                var h01: EngineRuntimeValue = -2 * t3 + 3 * t2;
                var h11: EngineRuntimeValue = t3 - t2;
                x[j] = h00 * x0 + h10 * m0 * span + h01 * x1 + h11 * m1 * span;
              }
              ++count;
              i = e + 4;
              continue;
            }
          }
          ema = ema * (1 - alpha) + d * alpha;
          if (ema < 1e-4) ema = 1e-4;
          ++i;
        }
        return count;
      }
      function goertzelMag(
        this: EngineRuntimeValue,
        x?: EngineRuntimeValue,
        freq?: EngineRuntimeValue,
        sampleRate?: EngineRuntimeValue,
        N?: EngineRuntimeValue,
      ) {
        if (N > x.length) N = x.length;
        var k: EngineRuntimeValue = (0.5 + (N * freq) / sampleRate) >> 0;
        var omega: EngineRuntimeValue = (2 * Math.PI * k) / N;
        var coeff: EngineRuntimeValue = 2 * Math.cos(omega);
        var s0: EngineRuntimeValue,
          s1: EngineRuntimeValue = 0,
          s2: EngineRuntimeValue = 0;
        for (var i: EngineRuntimeValue = 0; i < N; ++i) {
          s0 = x[i] + coeff * s1 - s2;
          s2 = s1;
          s1 = s0;
        }
        return s1 * s1 + s2 * s2 - coeff * s1 * s2;
      }
      function resolveHumFreq(
        this: EngineRuntimeValue,
        mode?: EngineRuntimeValue,
        start?: EngineRuntimeValue,
        end?: EngineRuntimeValue,
        sr?: EngineRuntimeValue,
      ) {
        if (mode === '50' || mode === 50) return 50;
        if (mode === '60' || mode === 60) return 60;
        var x: EngineRuntimeValue = wavesurfer.backend.buffer.getChannelData(0);
        var off: EngineRuntimeValue = (start * sr) >> 0;
        var N: EngineRuntimeValue = Math.min((end * sr) >> 0, (sr * 2) >> 0);
        if (N < 256) N = Math.min(x.length - off, 4096);
        var sub: EngineRuntimeValue = x.subarray(off, off + N);
        var m50: EngineRuntimeValue = goertzelMag(sub, 50, sr, N);
        var m60: EngineRuntimeValue = goertzelMag(sub, 60, sr, N);
        var center: EngineRuntimeValue = m60 > m50 ? 60 : 50;
        var best: EngineRuntimeValue = center,
          bestMag: EngineRuntimeValue = 0;
        for (var f: EngineRuntimeValue = center - 1; f <= center + 1; f += 0.1) {
          var m: EngineRuntimeValue = goertzelMag(sub, f, sr, N);
          if (m > bestMag) {
            bestMag = m;
            best = f;
          }
        }
        return best;
      }
      app.listenFor(
        'RequestActionFX_PREVIEW_HumNotch',
        function (this: EngineRuntimeValue, mode?: EngineRuntimeValue) {
          if (!q.is_ready) return;
          if (AudioUtils.previewing) {
            AudioUtils.FXPreviewStop();
            app.fireEvent('DidStopPreview');
            return;
          }
          var region: EngineRuntimeValue = wavesurfer.regions.list[0];
          if (!region) {
            wavesurfer.regions.add({ start: 0, end: wavesurfer.getDuration(), id: 't' });
            region = wavesurfer.regions.list[0];
          }
          var start: EngineRuntimeValue = q.TrimTo(region.start, 3);
          var end: EngineRuntimeValue = q.TrimTo(region.end - region.start, 3);
          var sr: EngineRuntimeValue = wavesurfer.backend.buffer.sampleRate;
          if (end * sr < 256) return OneUp('Selection too short', 1200);
          var freq: EngineRuntimeValue = resolveHumFreq(mode, start, end, sr);
          AudioUtils.FXPreview(
            start,
            end,
            AudioUtils.FXBank.HumNotch({ freq: freq, harmonics: 8, q: 12 }),
          );
          app.fireEvent('DidStartPreview');
        },
      );
      app.listenFor(
        'RequestActionFX_PREVIEW_DeClick',
        function (this: EngineRuntimeValue, sens?: EngineRuntimeValue) {
          if (!q.is_ready) return;
          if (AudioUtils.previewing) {
            AudioUtils.FXPreviewStop();
            app.fireEvent('DidStopPreview');
            return;
          }
          var region: EngineRuntimeValue = wavesurfer.regions.list[0];
          if (!region) {
            wavesurfer.regions.add({ start: 0, end: wavesurfer.getDuration(), id: 't' });
            region = wavesurfer.regions.list[0];
          }
          var start: EngineRuntimeValue = q.TrimTo(region.start, 3);
          var len: EngineRuntimeValue = q.TrimTo(region.end - region.start, 3);
          var sr: EngineRuntimeValue = wavesurfer.backend.buffer.sampleRate;
          if (len * sr < 256) return OneUp('Selection too short', 1200);
          var seg: EngineRuntimeValue = AudioUtils.Copy(start, len);
          for (var c: EngineRuntimeValue = 0; c < seg.numberOfChannels; ++c)
            deClickChannel(seg.getChannelData(c), sr, sens);
          AudioUtils.FXPreviewBuffer(seg);
          app.fireEvent('DidStartPreview');
        },
      );
      app.listenFor(
        'RequestActionFX_HumNotch',
        function (this: EngineRuntimeValue, mode?: EngineRuntimeValue) {
          if (!q.is_ready) return;
          app.fireEvent('RequestPause');
          var region: EngineRuntimeValue = wavesurfer.regions.list[0];
          if (!region) {
            wavesurfer.regions.add({ start: 0, end: wavesurfer.getDuration(), id: 't' });
            region = wavesurfer.regions.list[0];
          }
          var start: EngineRuntimeValue = q.TrimTo(region.start, 3);
          var end: EngineRuntimeValue = q.TrimTo(region.end - region.start, 3);
          var sr: EngineRuntimeValue = wavesurfer.backend.buffer.sampleRate;
          if (end * sr < 256) return OneUp('Selection too short', 1200);
          var freq: EngineRuntimeValue = resolveHumFreq(mode, start, end, sr);
          app.fireEvent('StateRequestPush', {
            desc: 'Hum Notch ' + freq + 'Hz',
            meta: [start, end],
            data: wavesurfer.backend.buffer,
          });
          AudioUtils.FX(
            start,
            end,
            AudioUtils.FXBank.HumNotch({ freq: freq, harmonics: 8, q: 12 }),
          );
          OneUp('Notched ' + freq.toFixed(1) + 'Hz hum', 1400);
        },
      );
      app.listenFor(
        'RequestActionFX_DeClick',
        function (this: EngineRuntimeValue, sens?: EngineRuntimeValue) {
          if (!q.is_ready) return;
          app.fireEvent('RequestPause');
          var region: EngineRuntimeValue = wavesurfer.regions.list[0];
          if (!region) {
            wavesurfer.regions.add({ start: 0, end: wavesurfer.getDuration(), id: 't' });
            region = wavesurfer.regions.list[0];
          }
          var start: EngineRuntimeValue = q.TrimTo(region.start, 3);
          var len: EngineRuntimeValue = q.TrimTo(region.end - region.start, 3);
          var sr: EngineRuntimeValue = wavesurfer.backend.buffer.sampleRate;
          if (len * sr < 256) return OneUp('Selection too short', 1200);
          app.fireEvent('StateRequestPush', {
            desc: 'De-Click',
            meta: [start, len],
            data: wavesurfer.backend.buffer,
          });
          var seg: EngineRuntimeValue = AudioUtils.Copy(start, len);
          var total: EngineRuntimeValue = 0;
          for (var c: EngineRuntimeValue = 0; c < seg.numberOfChannels; ++c)
            total += deClickChannel(seg.getChannelData(c), sr, sens);
          AudioUtils.Replace(start, len, seg);
          wavesurfer.regions.clear();
          wavesurfer.regions.add({ start: start, end: start + len, id: 't' });
          app.fireEvent('RequestSeekTo', start / wavesurfer.getDuration());
          OneUp(
            total
              ? 'De-Click: removed ' + total + ' click' + (total > 1 ? 's' : '')
              : 'De-Click: nothing detected',
            1400,
          );
        },
      );
      app.listenFor(
        'RequestActionFX_PREVIEW_RepairSplice',
        function (this: EngineRuntimeValue, sens?: EngineRuntimeValue) {
          if (!q.is_ready) return;
          if (AudioUtils.previewing) {
            AudioUtils.FXPreviewStop();
            app.fireEvent('DidStopPreview');
            return;
          }
          var region: EngineRuntimeValue = wavesurfer.regions.list[0];
          if (!region) {
            wavesurfer.regions.add({ start: 0, end: wavesurfer.getDuration(), id: 't' });
            region = wavesurfer.regions.list[0];
          }
          var start: EngineRuntimeValue = q.TrimTo(region.start, 3);
          var len: EngineRuntimeValue = q.TrimTo(region.end - region.start, 3);
          var sr: EngineRuntimeValue = wavesurfer.backend.buffer.sampleRate;
          if (len * sr < 512) return OneUp('Selection too short', 1200);
          var seg: EngineRuntimeValue = AudioUtils.Copy(start, len);
          for (var c: EngineRuntimeValue = 0; c < seg.numberOfChannels; ++c)
            repairSpliceChannel(seg.getChannelData(c), sr, sens);
          AudioUtils.FXPreviewBuffer(seg);
          app.fireEvent('DidStartPreview');
        },
      );
      app.listenFor(
        'RequestActionFX_RepairSplice',
        function (this: EngineRuntimeValue, sens?: EngineRuntimeValue) {
          if (!q.is_ready) return;
          app.fireEvent('RequestPause');
          var region: EngineRuntimeValue = wavesurfer.regions.list[0];
          if (!region) {
            wavesurfer.regions.add({ start: 0, end: wavesurfer.getDuration(), id: 't' });
            region = wavesurfer.regions.list[0];
          }
          var start: EngineRuntimeValue = q.TrimTo(region.start, 3);
          var len: EngineRuntimeValue = q.TrimTo(region.end - region.start, 3);
          var sr: EngineRuntimeValue = wavesurfer.backend.buffer.sampleRate;
          if (len * sr < 512) return OneUp('Selection too short', 1200);
          app.fireEvent('StateRequestPush', {
            desc: 'Edit Repair',
            meta: [start, len],
            data: wavesurfer.backend.buffer,
          });
          var seg: EngineRuntimeValue = AudioUtils.Copy(start, len);
          var total: EngineRuntimeValue = 0;
          for (var c: EngineRuntimeValue = 0; c < seg.numberOfChannels; ++c)
            total += repairSpliceChannel(seg.getChannelData(c), sr, sens);
          AudioUtils.Replace(start, len, seg);
          wavesurfer.regions.clear();
          wavesurfer.regions.add({ start: start, end: start + len, id: 't' });
          app.fireEvent('RequestSeekTo', start / wavesurfer.getDuration());
          OneUp(
            total
              ? 'Edit Repair: smoothed ' + total + ' splice' + (total > 1 ? 's' : '')
              : 'Edit Repair: nothing detected',
            1400,
          );
        },
      );
      app.listenFor(
        'RequestActionFX_Reverse',
        function (this: EngineRuntimeValue, val?: EngineRuntimeValue) {
          if (!q.is_ready) return;
          app.fireEvent('RequestPause');
          var region: EngineRuntimeValue = wavesurfer.regions.list[0];
          var dims: EngineRuntimeValue = [0, 0];
          function handleStateInline(
            this: EngineRuntimeValue,
            start?: EngineRuntimeValue,
            end?: EngineRuntimeValue,
          ) {
            app.fireEvent('StateRequestPush', {
              desc: 'Reverse ',
              meta: [start, end],
              data: wavesurfer.backend.buffer,
            });
          }
          if (!region) {
            wavesurfer.regions.add({
              start: 0.0,
              end: wavesurfer.getDuration() - 0.0,
              id: 't',
            });
            region = wavesurfer.regions.list[0];
          }
          var start: EngineRuntimeValue = q.TrimTo(region.start, 3);
          var end: EngineRuntimeValue = q.TrimTo(region.end - region.start, 3);
          handleStateInline(start, end);
          AudioUtils.FX(start, end, AudioUtils.FXBank.Reverse());
          OneUp('Applied Reverse');
        },
      );
      var noisernn_load: EngineRuntimeValue = !1;
      app.listenFor(
        'RequestActionFX_NoiseRNN',
        function (this: EngineRuntimeValue, a?: EngineRuntimeValue) {
          var h: EngineRuntimeValue = wavesurfer;
          if (q.is_ready) {
            // n -> q
            app.fireEvent('RequestPause');
            var b: EngineRuntimeValue = function (this: EngineRuntimeValue) {
              var f: EngineRuntimeValue = h.regions.list[0];
              f ||
                (h.regions.add({ start: 0, end: h.getDuration() - 0, id: 't' }),
                (f = h.regions.list[0]));
              var m: EngineRuntimeValue = q.TrimTo(f.start, 3),
                k: EngineRuntimeValue = q.TrimTo(f.end - f.start, 3);
              f = f.end - f.start;
              f = q.TrimTo(f, 3);
              app.fireEvent('StateRequestPush', {
                desc: 'Apply Noise RNN (fx)',
                meta: [m, k],
                data: h.backend.buffer,
              });
              for (
                var u: EngineRuntimeValue = AudioUtils.Copy(m, k), w: EngineRuntimeValue = 0;
                w < u.numberOfChannels;
                w++
              ) {
                var x: EngineRuntimeValue = u.getChannelData(w),
                  z: EngineRuntimeValue = wasm_denoise_stream_perf(x);
                x.set(z);
              }
              AudioUtils.Replace(m, k, u);
              app.fireEvent('RequestSeekTo', m / h.getDuration());
              wavesurfer.regions.clear();
              h.regions.add({ start: m, end: m + f, id: 't' });
              OneUp('Applied Noise RNN (fx)');
            };
            noisernn_load
              ? b()
              : ((a = document.createElement('script')),
                (a.src = 'rnn_denoise.js'),
                (a.onload = function (this: EngineRuntimeValue) {
                  noisernn_load = !0;
                  var f: EngineRuntimeValue = function (this: EngineRuntimeValue) {
                    window.Module && window.Module.asm && window.Module.asm.malloc
                      ? b()
                      : setTimeout(function (this: EngineRuntimeValue) {
                          f();
                        }, 350);
                  };
                  setTimeout(function (this: EngineRuntimeValue) {
                    f();
                  }, 100);
                }),
                (a.onerror = function (this: EngineRuntimeValue) {
                  alert('Could not download noise Reduction script');
                }),
                document.head.appendChild(a));
          }
        },
      );
      app.listenFor(
        'RequestActionFX_FadeIn',
        function (this: EngineRuntimeValue, val?: EngineRuntimeValue) {
          if (!q.is_ready) return;
          app.fireEvent('RequestPause');
          var region: EngineRuntimeValue = wavesurfer.regions.list[0];
          var dims: EngineRuntimeValue = [0, 0];
          function handleStateInline(
            this: EngineRuntimeValue,
            start?: EngineRuntimeValue,
            end?: EngineRuntimeValue,
          ) {
            app.fireEvent('StateRequestPush', {
              desc: 'Apply Fade In (fx)',
              meta: [start, end],
              data: wavesurfer.backend.buffer,
            });
          }
          if (!region) {
            wavesurfer.regions.add({
              start: 0.0,
              end: wavesurfer.getDuration() - 0.0,
              id: 't',
            });
            region = wavesurfer.regions.list[0];
          }
          var start: EngineRuntimeValue = q.TrimTo(region.start, 3);
          var end: EngineRuntimeValue = q.TrimTo(region.end - region.start, 3);
          handleStateInline(start, end);
          AudioUtils.FX(start, end, AudioUtils.FXBank.FadeIn());
          OneUp('Applied Fade In (fx)');
        },
      );
      app.listenFor(
        'RequestActionFX_FadeOut',
        function (this: EngineRuntimeValue, val?: EngineRuntimeValue) {
          if (!q.is_ready) return;
          app.fireEvent('RequestPause');
          var region: EngineRuntimeValue = wavesurfer.regions.list[0];
          var dims: EngineRuntimeValue = [0, 0];
          function handleStateInline(
            this: EngineRuntimeValue,
            start?: EngineRuntimeValue,
            end?: EngineRuntimeValue,
          ) {
            app.fireEvent('StateRequestPush', {
              desc: 'Apply Fade Out (fx)',
              meta: [start, end],
              data: wavesurfer.backend.buffer,
            });
          }
          if (!region) {
            wavesurfer.regions.add({
              start: 0.0,
              end: wavesurfer.getDuration() - 0.0,
              id: 't',
            });
            region = wavesurfer.regions.list[0];
          }
          var start: EngineRuntimeValue = q.TrimTo(region.start, 3);
          var end: EngineRuntimeValue = q.TrimTo(region.end - region.start, 3);
          handleStateInline(start, end);
          AudioUtils.FX(start, end, AudioUtils.FXBank.FadeOut());
          OneUp('Applied Fade Out (fx)');
        },
      );
      var fx_preview_debounce: EngineRuntimeValue = null;
      app.listenFor(
        'RequestActionFX_UPDATE_PREVIEW',
        function (this: EngineRuntimeValue, val?: EngineRuntimeValue) {
          if (!AudioUtils.previewing) return;
          clearTimeout(fx_preview_debounce);
          fx_preview_debounce = setTimeout(function (this: EngineRuntimeValue) {
            AudioUtils.FXPreviewUpdate(val);
          }, 44);
        },
      );
      app.listenFor(
        'RequestActionFX_TOGGLE',
        function (this: EngineRuntimeValue, val?: EngineRuntimeValue) {
          if (val) {
            AudioUtils.FXPreviewInit(true);
            return;
          }
          app.fireEvent('DidTogglePreview', AudioUtils.FXPreviewToggle());
        },
      );
      app.listenFor('RequestActionFX_PREVIEW_STOP', function (this: EngineRuntimeValue) {
        AudioUtils.FXPreviewStop();
        app.fireEvent('DidStopPreview');
      });
      function seamlessRegion(this: EngineRuntimeValue) {
        var region: EngineRuntimeValue = wavesurfer.regions.list[0];
        if (!region) {
          app.fireEvent('RequestSelect');
          region = wavesurfer.regions.list[0];
          if (!region) return;
        }
        var start: EngineRuntimeValue = q.TrimTo(region.start, 3);
        var end: EngineRuntimeValue = q.TrimTo(region.end - region.start, 3);
        if (end <= 0.002) {
          OneUp('Selection too short', 1200);
          return;
        }
        return [start, end];
      }
      app.listenFor(
        'RequestActionFX_PREVIEW_SeamlessLoop',
        function (this: EngineRuntimeValue, val?: EngineRuntimeValue) {
          var hasSeek: EngineRuntimeValue = val && val.seek !== undefined;
          var seek: EngineRuntimeValue = hasSeek ? val.seek / 1 : 0;
          if (!(seek > 0)) seek = 0;
          if (!q.is_ready) return;
          if (AudioUtils.previewing) {
            AudioUtils.FXPreviewStop();
            app.fireEvent('DidStopPreview');
            if (!hasSeek) return;
          }
          var r: EngineRuntimeValue = seamlessRegion();
          if (!r) return;
          AudioUtils.FXPreviewBuffer(AudioUtils.SeamlessLoop(r[0], r[1], val), seek);
          app.fireEvent('DidStartPreview', seek);
        },
      );
      app.listenFor(
        'RequestActionFX_SeamlessLoop',
        function (this: EngineRuntimeValue, val?: EngineRuntimeValue) {
          if (!q.is_ready) return;
          if (AudioUtils.previewing) {
            AudioUtils.FXPreviewStop();
            app.fireEvent('DidStopPreview');
          }
          var r: EngineRuntimeValue = seamlessRegion();
          if (!r) return;
          app.fireEvent('RequestPause');
          app.fireEvent('StateRequestPush', {
            desc: 'Seamless Loop',
            meta: r,
            data: wavesurfer.backend.buffer,
          });
          var dims: EngineRuntimeValue = AudioUtils.Replace(
            r[0],
            r[1],
            AudioUtils.SeamlessLoop(r[0], r[1], val),
          );
          wavesurfer.regions.clear();
          wavesurfer.regions.add({ start: dims[0], end: dims[1], id: 't' });
          app.fireEvent('RequestSeekTo', dims[0] / wavesurfer.getDuration());
          OneUp('Seamless Loop');
        },
      );
      app.listenFor(
        'RequestActionFX_OpenSeamlessLoop',
        function (this: EngineRuntimeValue, val?: EngineRuntimeValue) {
          if (!q.is_ready) return;
          if (AudioUtils.previewing) {
            AudioUtils.FXPreviewStop();
            app.fireEvent('DidStopPreview');
          }
          var r: EngineRuntimeValue = seamlessRegion();
          if (!r) return;
          var win: EngineRuntimeValue = val && val.win;
          var loop: EngineRuntimeValue = AudioUtils.SeamlessLoop(
            r[0],
            r[1],
            val && val.val ? val.val : val,
          );
          var open: EngineRuntimeValue = function (
            this: EngineRuntimeValue,
            fls?: EngineRuntimeValue,
          ) {
            var id: EngineRuntimeValue = 'loop_' + Math.random().toString(36).substring(7);
            fls.SaveSession(
              loop,
              id,
              'Seamless Loop',
              win &&
                function (this: EngineRuntimeValue) {
                  var url: EngineRuntimeValue =
                    window.location.href.split('?')[0].split('#')[0] + '?local=' + id;
                  win.location = url;
                  OneUp('Opened Seamless Loop', 1000);
                },
              !!win,
            );
            app.stopListeningFor('DidOpenDB', open);
          };
          if (!app.fls) {
            win && win.close && win.close();
            return;
          }
          app.listenFor('DidOpenDB', open);
          if (!app.fls.on)
            app.fls.Init(function (this: EngineRuntimeValue, err?: EngineRuntimeValue) {
              if (!err) return;
              win && win.close && win.close();
              app.stopListeningFor('DidOpenDB', open);
              OneUp('Could not open local storage', 1400);
            });
          else app.fireEvent('DidOpenDB', app.fls);
        },
      );
      app.listenFor(
        'RequestActionFX_PREVIEW_GAIN',
        function (this: EngineRuntimeValue, val?: EngineRuntimeValue) {
          if (!q.is_ready) return;
          if (AudioUtils.previewing) {
            AudioUtils.FXPreviewStop();
            app.fireEvent('DidStopPreview');
            return;
          }
          var region: EngineRuntimeValue = wavesurfer.regions.list[0];
          var dims: EngineRuntimeValue = [0, 0];
          if (!region) {
            wavesurfer.regions.add({
              start: 0.0,
              end: wavesurfer.getDuration() - 0.0,
              id: 't',
            });
            region = wavesurfer.regions.list[0];
          }
          var start: EngineRuntimeValue = q.TrimTo(region.start, 3);
          var end: EngineRuntimeValue = q.TrimTo(region.end - region.start, 3);
          AudioUtils.FXPreview(start, end, AudioUtils.FXBank.Gain(val));
          app.fireEvent('DidStartPreview');
        },
      );
      app.listenFor(
        'RequestActionFX_GAIN',
        function (this: EngineRuntimeValue, val?: EngineRuntimeValue) {
          if (!q.is_ready) return;
          app.fireEvent('RequestPause');
          var region: EngineRuntimeValue = wavesurfer.regions.list[0];
          var dims: EngineRuntimeValue = [0, 0];
          function handleStateInline(
            this: EngineRuntimeValue,
            start?: EngineRuntimeValue,
            end?: EngineRuntimeValue,
          ) {
            app.fireEvent('StateRequestPush', {
              desc: 'Apply Gain (fx)',
              meta: [start, end],
              data: wavesurfer.backend.buffer,
            });
          }
          if (!region) {
            wavesurfer.regions.add({
              start: 0.0,
              end: wavesurfer.getDuration() - 0.0,
              id: 't',
            });
            region = wavesurfer.regions.list[0];
          }
          var start: EngineRuntimeValue = q.TrimTo(region.start, 3);
          var end: EngineRuntimeValue = q.TrimTo(region.end - region.start, 3);
          handleStateInline(start, end);
          AudioUtils.FX(start, end, AudioUtils.FXBank.Gain(val));
          OneUp('Applied Gain (fx)');
        },
      );
      app.listenFor(
        'RequestActionFX_PREVIEW_SPEED',
        function (this: EngineRuntimeValue, val?: EngineRuntimeValue) {
          var hasSeek: EngineRuntimeValue = val && val.seek !== undefined;
          var seek: EngineRuntimeValue = hasSeek ? val.seek / 1 : 0;
          if (!(seek > 0)) seek = 0;
          var fxval: EngineRuntimeValue = val && val.val !== undefined ? val.val : val;
          if (!q.is_ready) return;
          if (AudioUtils.previewing) {
            AudioUtils.FXPreviewStop();
            app.fireEvent('DidStopPreview');
            if (!hasSeek) return;
          }
          var region: EngineRuntimeValue = wavesurfer.regions.list[0];
          var dims: EngineRuntimeValue = [0, 0];
          if (!region) {
            wavesurfer.regions.add({
              start: 0.0,
              end: wavesurfer.getDuration() - 0.0,
              id: 't',
            });
            region = wavesurfer.regions.list[0];
          }
          var start: EngineRuntimeValue = q.TrimTo(region.start, 3);
          var end: EngineRuntimeValue = q.TrimTo(region.end - region.start, 3);
          AudioUtils.FXPreview(start, end, AudioUtils.FXBank.Speed(fxval), seek);
          app.fireEvent('DidStartPreview', seek);
        },
      );
      app.listenFor(
        'RequestActionFX_RATE',
        function (this: EngineRuntimeValue, val?: EngineRuntimeValue) {
          if (!q.is_ready) return;
          app.fireEvent('RequestPause');
          var region: EngineRuntimeValue = wavesurfer.regions.list[0];
          var dims: EngineRuntimeValue = [0, 0];
          function handleStateInline(
            this: EngineRuntimeValue,
            start?: EngineRuntimeValue,
            end?: EngineRuntimeValue,
          ) {
            app.fireEvent('StateRequestPush', {
              desc: 'Apply Rate (fx)',
              meta: [start, end],
              data: wavesurfer.backend.buffer,
            });
          }
          if (!region) {
            wavesurfer.regions.add({
              start: 0.0,
              end: wavesurfer.getDuration() - 0.0,
              id: 't',
            });
            region = wavesurfer.regions.list[0];
          }
          var start: EngineRuntimeValue = q.TrimTo(region.start, 3);
          var end: EngineRuntimeValue = q.TrimTo(region.end - region.start, 3);
          var duration: EngineRuntimeValue = (region.end - region.start) / val;
          duration = q.TrimTo(duration, 3);
          handleStateInline(start, end);
          var fx_buffer: EngineRuntimeValue = AudioUtils.Copy(start, end);
          var originalBuffer: EngineRuntimeValue = wavesurfer.backend.buffer;
          var new_offset: EngineRuntimeValue = ((start / 1) * originalBuffer.sampleRate) >> 0;
          var new_len: EngineRuntimeValue = ((duration / 1) * originalBuffer.sampleRate) >> 0;
          var old_len: EngineRuntimeValue = ((end / 1) * originalBuffer.sampleRate) >> 0;
          var stretch_ratio: EngineRuntimeValue = new_len / old_len;
          var getOfflineAudioContext: EngineRuntimeValue = function (
            this: EngineRuntimeValue,
            channels?: EngineRuntimeValue,
            sampleRate?: EngineRuntimeValue,
            duration?: EngineRuntimeValue,
          ) {
            return new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(
              channels,
              duration,
              sampleRate,
            );
          };
          var audio_ctx: EngineRuntimeValue = getOfflineAudioContext(
            // offlineCtx
            wavesurfer.SelectedChannelsLen, // orig_buffer.numberOfChannels,
            fx_buffer.sampleRate,
            new_len,
          );
          /*
            var TimeStretcher = function(o){o=o||{};this.ws=o.windowSize||1024;this.or=o.overlapRatio||0.5;this.sw=o.seekWindowMs||30;}
            TimeStretcher.prototype.stretch=function(buf,ts){
              if(ts<=0) throw new Error("Stretch ratio must be positive");
              var ch=buf.numberOfChannels, sr=buf.sampleRate, il=buf.length, ol=Math.floor(il*ts),
                  out=new AudioBuffer({numberOfChannels:ch,length:ol,sampleRate:sr});
              for(var c=0;c<ch;c++){
                var inD=buf.getChannelData(c), outD=out.getChannelData(c), ws=this.ws,
                    ov=Math.floor(ws*this.or), hs=ws-ov, sw=Math.floor(this.sw*sr/1000),
                    win=this._hannWindow(ws), iIdx=0, oIdx=0;
                while(oIdx<ol-ws){
                  var nIdx=Math.min(Math.floor(oIdx/ts),il-ws-sw);
                  if(iIdx>0 && Math.abs(nIdx-iIdx)>hs){
                    var ssi=Math.max(0,nIdx-sw), sei=Math.min(il-ws,nIdx+sw);
                    iIdx=this._findBestMatch(inD,iIdx+hs,ssi,sei,ws);
                  } else { iIdx=nIdx; }
                  for(var i=0;i<ws;i++){
                    if(iIdx+i<il && oIdx+i<ol)
                      outD[oIdx+i]+= inD[iIdx+i]*win[i];
                  }
                  oIdx+=hs;
                }
                this._normalizeOutput(outD);
              }
              return out;
            };
            TimeStretcher.prototype._hannWindow=function(l){var w=new Float32Array(l);for(var i=0;i<l;i++)w[i]=0.5*(1-Math.cos(2*Math.PI*i/(l-1)));return w;};
            TimeStretcher.prototype._findBestMatch=function(d,ref,s,e,ws){
              var bp=s,be=Number.MAX_VALUE, refArr=new Float32Array(ws);
              for(var i=0;i<ws;i++) if(ref+i<d.length) refArr[i]=d[ref+i];
              for(var pos=s;pos<=e;pos++){
                var err=0;
                for(var i=0;i<ws;i+=4) {
                  if(pos+i<d.length){var diff=refArr[i]-d[pos+i];err+=diff*diff;}
                }
                if(err<be){be=err;bp=pos;}
              }
              return bp;
            };
            TimeStretcher.prototype._normalizeOutput=function(d){
              var m=0; for(var i=0;i<d.length;i++) m=Math.max(m,Math.abs(d[i]));
              if(m>1){var g=0.95/m; for(var i=0;i<d.length;i++) d[i]*=g;}
            };*/
          var stretchAudio: EngineRuntimeValue = function (
            this: EngineRuntimeValue,
            input_buffer?: EngineRuntimeValue,
            sampleRate?: EngineRuntimeValue,
            stretchRatio?: EngineRuntimeValue,
          ) {
            // Parameters (in seconds)
            let channels_len: EngineRuntimeValue = input_buffer.numberOfChannels;
            let samples: EngineRuntimeValue = [input_buffer.getChannelData(0)];
            for (let i: EngineRuntimeValue = 1; i < channels_len; ++i) {
              samples.push(input_buffer.getChannelData(i));
            }
            let grainDurationSec: EngineRuntimeValue = 0.05; // 50 ms
            const analysisHopSec: EngineRuntimeValue = 0.025; // 25 ms (50% overlap)
            const desiredOverlap: EngineRuntimeValue = 0.5;
            const synthesisHopSec: EngineRuntimeValue = analysisHopSec * stretchRatio; // output hop
            // Adjust grain duration for ratios > 1
            if (stretchRatio > 1) {
              grainDurationSec = synthesisHopSec / (1 - desiredOverlap);
            }
            // Convert durations to samples
            const grainSize: EngineRuntimeValue = Math.floor(grainDurationSec * sampleRate);
            const analysisHop: EngineRuntimeValue = Math.floor(analysisHopSec * sampleRate);
            const synthesisHop: EngineRuntimeValue = Math.floor(synthesisHopSec * sampleRate);
            // Precompute Hann window
            const window: EngineRuntimeValue = new Float32Array(grainSize);
            for (let i: EngineRuntimeValue = 0; i < grainSize; i++) {
              // Using (grainSize - 1) so that the window spans [0, grainDurationSec]
              window[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (grainSize - 1)));
            }
            // Estimate number of grains and output length
            const numGrains: EngineRuntimeValue = Math.floor(
              (samples[0].length - grainSize) / analysisHop,
            );
            const outputLength: EngineRuntimeValue = synthesisHop * numGrains + grainSize;
            let output: EngineRuntimeValue = [new Float32Array(outputLength)];
            for (let i: EngineRuntimeValue = 1; i < channels_len; ++i) {
              output.push(new Float32Array(outputLength));
            }
            // Process each grain: copy, window, and add to output
            let inputIndex: EngineRuntimeValue = 0;
            let outputIndex: EngineRuntimeValue = 0;
            for (let n: EngineRuntimeValue = 0; n < numGrains; ++n) {
              // For each sample in the grain, multiply by the window and add to the output
              for (let i: EngineRuntimeValue = 0; i < grainSize; ++i) {
                for (let j: EngineRuntimeValue = 0; j < channels_len; ++j) {
                  output[j][outputIndex + i] += samples[j][inputIndex + i] * window[i];
                }
              }
              inputIndex += analysisHop;
              outputIndex += synthesisHop;
            }
            /*
                let normalization = new Float32Array(outputLength);
                inputIndex = 0;
                outputIndex = 0;
                for (let n = 0; n < numGrains; ++n) {
                  for (let i = 0; i < grainSize; ++i) {
                    normalization[outputIndex + i] += window[i];
                  }
                  inputIndex += analysisHop;
                  outputIndex += synthesisHop;
                }

                // Normalize each channel's output:
                for (let j = 0; j < channels_len; ++j) {
                  for (let i = 0; i < outputLength; ++i) {
                    if (normalization[i] > 0) {
                      output[j][i] /= normalization[i];
                    }
                  }
                }
                */
            return output;
          };
          /// -----
          var filter: EngineRuntimeValue = [];
          //if (stretch_ratio < 1) {
          //	var fx = AudioUtils.FXBank.Rate( stretch_ratio );
          //	var source = {buffer:null, disconnect:function(){}};
          //	source.buffer = fx_buffer;
          //	filter = fx.filter ( audio_ctx, audio_ctx.destination, source, duration );
          //}
          //else
          //{
          // use timestretcher here...
          // var ts = new TimeStretcher({windowSize:2048,overlapRatio:0.75,seekWindowMs:20}).stretch(fx_buffer,stretch_ratio);
          const stretchedSamples: EngineRuntimeValue = stretchAudio(
            fx_buffer,
            fx_buffer.sampleRate,
            stretch_ratio,
          );
          // Optionally, if you need an AudioBuffer from the stretchedSamples:
          // const offlineCtx = new OfflineAudioContext(stretchedSamples.length, stretchedSamples[0].length, fx_buffer.sampleRate);
          const newBuffer: EngineRuntimeValue = audio_ctx.createBuffer(
            stretchedSamples.length,
            stretchedSamples[0].length,
            fx_buffer.sampleRate,
          );
          for (let i: EngineRuntimeValue = 0; i < stretchedSamples.length; ++i) {
            newBuffer.copyToChannel(stretchedSamples[i], i);
          }
          var source: EngineRuntimeValue = audio_ctx.createBufferSource();
          source.buffer = newBuffer;
          source.connect(audio_ctx.destination);
          source.start();
          //}
          q.in_fx = true;
          app.ui.InteractionHandler.on = true;
          // OneUp ('Please wait, applying FX', 2600);
          var offline_callback: EngineRuntimeValue = function (
            this: EngineRuntimeValue,
            rendered_buffer?: EngineRuntimeValue,
          ) {
            AudioUtils.Replace(start, end, rendered_buffer);
            wavesurfer.regions.clear();
            wavesurfer.regions.add({
              start: start,
              end: start + duration,
              id: 't',
            });
            app.fireEvent('RequestSeekTo', start / wavesurfer.getDuration());
            OneUp('Applied Rate (fx)');
            if (filter.length > 0) {
              for (var i: EngineRuntimeValue = 0; i < filter.length; ++i) filter[i].disconnect();
            } else filter && filter.disconnect && filter.disconnect();
            rendered_buffer = fx_buffer = filter = null;
            source.disconnect();
            q.in_fx = false;
            app.ui.InteractionHandler.on = false;
          };
          var offline_renderer: EngineRuntimeValue = audio_ctx.startRendering();
          if (offline_renderer)
            offline_renderer.then(offline_callback).catch(function (
              this: EngineRuntimeValue,
              err?: EngineRuntimeValue,
            ) {
              console.log('Rendering failed: ' + err);
            });
          else
            audio_ctx.oncomplete = function (this: EngineRuntimeValue, e?: EngineRuntimeValue) {
              offline_callback(e.renderedBuffer);
            };
        },
      );
      app.listenFor(
        'RequestActionFX_PREVIEW_RATE',
        function (this: EngineRuntimeValue, val?: EngineRuntimeValue) {
          if (!q.is_ready) return;
          if (AudioUtils.previewing) {
            AudioUtils.FXPreviewStop();
            app.fireEvent('DidStopPreview');
            return;
          }
          var region: EngineRuntimeValue = wavesurfer.regions.list[0];
          var dims: EngineRuntimeValue = [0, 0];
          if (!region) {
            wavesurfer.regions.add({
              start: 0.0,
              end: wavesurfer.getDuration() - 0.0,
              id: 't',
            });
            region = wavesurfer.regions.list[0];
          }
          var start: EngineRuntimeValue = q.TrimTo(region.start, 3);
          var end: EngineRuntimeValue = q.TrimTo(region.end - region.start, 3);
          if (end > 8) end = 8;
          var duration: EngineRuntimeValue = end / val;
          var originalBuffer: EngineRuntimeValue = wavesurfer.backend.buffer;
          var new_offset: EngineRuntimeValue = ((start / 1) * originalBuffer.sampleRate) >> 0;
          var new_len: EngineRuntimeValue = ((duration / 1) * originalBuffer.sampleRate) >> 0;
          var old_len: EngineRuntimeValue = ((end / 1) * originalBuffer.sampleRate) >> 0;
          // -----
          var stretch_ratio: EngineRuntimeValue = new_len / old_len;
          AudioUtils.FXPreview(start, end, AudioUtils.FXBank.Rate(stretch_ratio));
          app.fireEvent('DidStartPreview');
        },
      );
      app.listenFor(
        'RequestActionFX_SPEED',
        function (this: EngineRuntimeValue, val?: EngineRuntimeValue) {
          if (!q.is_ready) return;
          app.fireEvent('RequestPause');
          var region: EngineRuntimeValue = wavesurfer.regions.list[0];
          var dims: EngineRuntimeValue = [0, 0];
          function handleStateInline(
            this: EngineRuntimeValue,
            start?: EngineRuntimeValue,
            end?: EngineRuntimeValue,
          ) {
            app.fireEvent('StateRequestPush', {
              desc: 'Apply Speed (fx)',
              meta: [start, end],
              data: wavesurfer.backend.buffer,
            });
          }
          if (!region) {
            wavesurfer.regions.add({
              start: 0.0,
              end: wavesurfer.getDuration() - 0.0,
              id: 't',
            });
            region = wavesurfer.regions.list[0];
          }
          var start: EngineRuntimeValue = q.TrimTo(region.start, 3);
          var end: EngineRuntimeValue = q.TrimTo(region.end - region.start, 3);
          var selected_duration: EngineRuntimeValue = region.end - region.start;
          var fx: EngineRuntimeValue = AudioUtils.FXBank.Speed(val);
          var duration: EngineRuntimeValue = fx.duration
            ? fx.duration(selected_duration)
            : selected_duration / val;
          duration = q.TrimTo(duration, 3);
          handleStateInline(start, end);
          var fx_buffer: EngineRuntimeValue = AudioUtils.Copy(start, end);
          var originalBuffer: EngineRuntimeValue = wavesurfer.backend.buffer;
          var new_offset: EngineRuntimeValue = ((start / 1) * originalBuffer.sampleRate) >> 0;
          var new_len: EngineRuntimeValue = ((duration / 1) * originalBuffer.sampleRate) >> 0;
          var old_len: EngineRuntimeValue = ((end / 1) * originalBuffer.sampleRate) >> 0;
          /*
            var emptySegment = wavesurfer.backend.ac.createBuffer (
                wavesurfer.SelectedChannelsLen,
                new_len,
                originalBuffer.sampleRate
            );*/
          q.in_fx = true;
          app.ui.InteractionHandler.on = true;
          var getOfflineAudioContext: EngineRuntimeValue = function (
            this: EngineRuntimeValue,
            channels?: EngineRuntimeValue,
            sampleRate?: EngineRuntimeValue,
            duration?: EngineRuntimeValue,
          ) {
            return new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(
              channels,
              duration,
              sampleRate,
            );
          };
          var audio_ctx: EngineRuntimeValue = getOfflineAudioContext(
            wavesurfer.SelectedChannelsLen, // orig_buffer.numberOfChannels,
            originalBuffer.sampleRate,
            new_len,
          );
          var source: EngineRuntimeValue = audio_ctx.createBufferSource();
          source.buffer = fx_buffer;
          var filter: EngineRuntimeValue = fx.filter(
            audio_ctx,
            audio_ctx.destination,
            source,
            duration,
          );
          source.start();
          var offline_callback: EngineRuntimeValue = function (
            this: EngineRuntimeValue,
            rendered_buffer?: EngineRuntimeValue,
          ) {
            AudioUtils.Replace(start, end, rendered_buffer);
            wavesurfer.regions.clear();
            wavesurfer.regions.add({
              start: start,
              end: start + duration,
              id: 't',
            });
            app.fireEvent('RequestSeekTo', start / wavesurfer.getDuration());
            OneUp('Applied Speed (fx)');
            if (filter.length > 0) {
              for (var i: EngineRuntimeValue = 0; i < filter.length; ++i) filter[i].disconnect();
            } else filter && filter.disconnect && filter.disconnect();
            // is this needed?
            rendered_buffer = fx_buffer = filter = null;
            source.disconnect();
            // audio_ctx.close ();
            // -
            q.in_fx = false;
            app.ui.InteractionHandler.on = false;
          };
          var offline_renderer: EngineRuntimeValue = audio_ctx.startRendering();
          if (offline_renderer)
            offline_renderer.then(offline_callback).catch(function (
              this: EngineRuntimeValue,
              err?: EngineRuntimeValue,
            ) {
              console.log('Rendering failed: ' + err);
            });
          else
            audio_ctx.oncomplete = function (this: EngineRuntimeValue, e?: EngineRuntimeValue) {
              offline_callback(e.renderedBuffer);
            };
        },
      );
      app.listenFor(
        'StateDidPop',
        function (this: EngineRuntimeValue, state?: EngineRuntimeValue, undo?: EngineRuntimeValue) {
          if (state.type === 'mult') return;
          if (state.type === 'mrk') return;
          if (!q.is_ready) return;
          app.fireEvent('RequestPause');
          wavesurfer.regions.clear();
          wavesurfer.loadDecodedBuffer(state.data);
          if (state.cb) state.cb(undo);
          var new_durr: EngineRuntimeValue = wavesurfer.getDuration();
          app.fireEvent('DidUpdateLen', new_durr);
          if (state.meta && state.meta.length > 0) {
            var st: EngineRuntimeValue = Math.max(0, Math.min(new_durr, state.meta[0] / 1 || 0));
            if (state.meta[1]) {
              var en: EngineRuntimeValue = Math.max(0, Math.min(new_durr, st + state.meta[1] / 1));
              if (en > st) wavesurfer.regions.add({ start: st, end: en, id: 't' });
              else app.fireEvent('RequestSeekTo', new_durr ? st / new_durr : 0);
            } else {
              if (!new_durr) new_durr = 0.0001;
              app.fireEvent('RequestSeekTo', st / new_durr);
            }
          }
          if (undo) OneUp('Undo ' + state.desc);
          else OneUp('Redo ' + state.desc);
        },
      );
      // ---
      app.listenFor(
        'RequestChanToggle',
        function (
          this: EngineRuntimeValue,
          chan_index?: EngineRuntimeValue,
          force_val?: EngineRuntimeValue,
        ) {
          if (!q.is_ready) return false;
          if (wavesurfer.ActiveChannels.length <= chan_index) return false;
          var oldval: EngineRuntimeValue = wavesurfer.ActiveChannels[chan_index];
          var val: EngineRuntimeValue = -1;
          if (force_val) val = force_val;
          else {
            if (oldval === 1) val = 0;
            else val = 1;
          }
          if (oldval !== val) {
            wavesurfer.ActiveChannels[chan_index] = val;
            if (val === 0) {
              --wavesurfer.SelectedChannelsLen;
              // silece the channel itself
              if (chan_index === 0) {
                wavesurfer.backend.gainNode2.gain.value = 0.0;
              } else {
                wavesurfer.backend.gainNode1.gain.value = 0.0;
              }
            } else {
              ++wavesurfer.SelectedChannelsLen;
              if (chan_index === 0) {
                wavesurfer.backend.gainNode2.gain.value = 1.0;
              } else {
                wavesurfer.backend.gainNode1.gain.value = 1.0;
              }
            }
            wavesurfer.ForceDraw();
            app.fireEvent('DidChanToggle', chan_index, val);
          }
        },
      );
      // ----
      wavesurfer.on('region-updated', function (this: EngineRuntimeValue) {
        if (wavesurfer.regions.list[0]) {
          app.fireEvent('DidCreateRegion', wavesurfer.regions.list[0]);
        }
      });
      wavesurfer.on('region-update-end', function (this: EngineRuntimeValue) {
        app.fireEvent('DidCreateRegion', wavesurfer.regions.list[0]);
        var start: EngineRuntimeValue = wavesurfer.regions.list[0].start;
        if (!wavesurfer.isPlaying())
          app.fireEvent('RequestSeekTo', start / wavesurfer.getDuration());
      });
      wavesurfer.on('cursorcenter', function (this: EngineRuntimeValue, e?: EngineRuntimeValue) {
        app.fireEvent('DidCursorCenter', e, wavesurfer.ZoomFactor);
      });
      var wave: EngineRuntimeValue =
        wavesurfer.drawer.wrapper || wavesurfer.drawer.canvases[0].wave.parentNode;
      if (app.mrk) app.mrk.wave(wavesurfer, wave);
      var drag_x: EngineRuntimeValue = 0;
      var wheel_axis: EngineRuntimeValue = 0;
      var wheel_stamp: EngineRuntimeValue = 0;
      var wheel_idle: EngineRuntimeValue = 520;
      var wheel_x: EngineRuntimeValue = 0;
      var wheel_y: EngineRuntimeValue = 0;
      var viewport_draw_raf: EngineRuntimeValue = 0;
      function queueViewportDraw(this: EngineRuntimeValue) {
        if (viewport_draw_raf) return;
        viewport_draw_raf = w.requestAnimationFrame(function (this: EngineRuntimeValue) {
          viewport_draw_raf = 0;
          wavesurfer.ForceDraw();
          app.fireEvent('DidZoom', [
            wavesurfer.ZoomFactor,
            (wavesurfer.LeftProgress / wavesurfer.getDuration()) * 100,
            wavesurfer.params.verticalZoom,
          ]);
        });
      }
      function waveWhere(this: EngineRuntimeValue, e?: EngineRuntimeValue) {
        var rect: EngineRuntimeValue = wave.getBoundingClientRect();
        var x: EngineRuntimeValue =
          typeof e.clientX === 'number' ? e.clientX : rect.left + rect.width / 2;
        var where: EngineRuntimeValue = (x - rect.left) / Math.max(1, rect.width);
        return Math.max(0, Math.min(1, where));
      }
      function zoomAt(
        this: EngineRuntimeValue,
        factor?: EngineRuntimeValue,
        where?: EngineRuntimeValue,
      ) {
        if (!q.is_ready) return;
        var dur: EngineRuntimeValue = wavesurfer.getDuration();
        if (!dur) return;
        if (where === undefined) where = 0.5;
        var old_vis: EngineRuntimeValue = wavesurfer.VisibleDuration || dur / wavesurfer.ZoomFactor;
        var at: EngineRuntimeValue = wavesurfer.LeftProgress + old_vis * where;
        var next: EngineRuntimeValue = Math.max(1, wavesurfer.ZoomFactor * factor);
        var vis: EngineRuntimeValue = dur / next;
        if (vis <= 0.5) return;
        wavesurfer.ZoomFactor = next;
        wavesurfer.VisibleDuration = vis;
        wavesurfer.LeftProgress = at - vis * where;
        if (wavesurfer.LeftProgress + vis > dur) wavesurfer.LeftProgress = dur - vis;
        if (wavesurfer.LeftProgress < 0) wavesurfer.LeftProgress = 0;
        queueViewportDraw();
      }
      function waveWheel(this: EngineRuntimeValue, e?: EngineRuntimeValue) {
        if (!q.is_ready) return;
        var info: EngineRuntimeValue = app.wheelInfo(e);
        var now: EngineRuntimeValue = e.timeStamp || w.performance.now();
        e.preventDefault();
        e.stopImmediatePropagation ? e.stopImmediatePropagation() : e.stopPropagation();
        if (now - wheel_stamp > wheel_idle) {
          wheel_axis = 0;
          wheel_x = 0;
          wheel_y = 0;
        }
        wheel_stamp = now;
        if (info.pinch) {
          if (wheel_axis > 0) return;
          if (!info.y) return;
          zoomAt(app.wheelZoomFactor(info.y), waveWhere(e));
          return;
        }
        var pan: EngineRuntimeValue = info.x;
        if (!wheel_axis) {
          wheel_x += info.x;
          wheel_y += info.y;
          var ax: EngineRuntimeValue = Math.abs(wheel_x);
          var ay: EngineRuntimeValue = Math.abs(wheel_y);
          if (ax < 14 && ay < 14) return;
          if (ax > 14 && ax > ay * 1.05) {
            wheel_axis = 1;
            pan = wheel_x;
            wheel_x = 0;
            wheel_y = 0;
          } else if (ay > 22 && ay > ax * 1.45) {
            wheel_axis = -1;
            wheel_x = 0;
            wheel_y = 0;
          } else return;
        }
        if (wheel_axis > 0 && pan) {
          app.fireEvent('RequestPan', pan);
        } else if (wheel_axis < 0 && info.y) {
          zoomAt(app.wheelZoomFactor(info.y * 0.78), waveWhere(e));
        }
      }
      function gestureStart(this: EngineRuntimeValue, e?: EngineRuntimeValue) {
        e.preventDefault();
        if (wheel_axis > 0 && (e.timeStamp || w.performance.now()) - wheel_stamp < wheel_idle)
          return;
        wave._pk_scale = e.scale || 1;
      }
      function gestureChange(this: EngineRuntimeValue, e?: EngineRuntimeValue) {
        e.preventDefault();
        if (wheel_axis > 0 && (e.timeStamp || w.performance.now()) - wheel_stamp < wheel_idle)
          return;
        var scale: EngineRuntimeValue = e.scale || 1;
        zoomAt(scale / (wave._pk_scale || 1), waveWhere(e));
        wave._pk_scale = scale;
      }
      var drag_move: EngineRuntimeValue = function (
        this: EngineRuntimeValue,
        e?: EngineRuntimeValue,
      ) {
        var diff: EngineRuntimeValue = drag_x - e.clientX;
        // find diff percentage from full width...
        // drag the waveform now
        app.fireEvent('RequestPan', diff);
        drag_x = e.clientX;
      };
      wave.addEventListener('wheel', waveWheel, { capture: true, passive: false });
      wave.addEventListener('gesturestart', gestureStart, { passive: false });
      wave.addEventListener('gesturechange', gestureChange, { passive: false });
      app.listenFor(
        'RequestZoom',
        function (this: EngineRuntimeValue, diff?: EngineRuntimeValue, mode?: EngineRuntimeValue) {
          var wv: EngineRuntimeValue = wavesurfer;
          // compute new ZoomFactor...
          diff *= wv.ZoomFactor;
          // compute availabel left ZoomFactor
          if (mode === -1) {
            var width: EngineRuntimeValue = wv.drawer.width;
            var available_pixels: EngineRuntimeValue = width - width / wv.ZoomFactor;
            var target: EngineRuntimeValue = wv.ZoomFactor - 1;
            if (target <= 0) return;
            var old_zoomfactor: EngineRuntimeValue = wv.ZoomFactor;
            wv.ZoomFactor += (diff * target) / available_pixels;
            if (wv.ZoomFactor < 1) wv.ZoomFactor = 1;
            var new_vis_dur: EngineRuntimeValue = wv.getDuration() / wv.ZoomFactor;
            if (new_vis_dur <= 0.5) {
              wv.ZoomFactor = old_zoomfactor;
              return;
            }
            wv.VisibleDuration = new_vis_dur;
            var time_moved: EngineRuntimeValue = wv.VisibleDuration * (diff / wv.drawer.width);
            wv.LeftProgress += time_moved;
            if (wv.LeftProgress + wv.VisibleDuration >= wv.getDuration()) {
              wv.LeftProgress = wv.getDuration() - wv.VisibleDuration;
            } else if (wv.LeftProgress < 0) {
              wv.LeftProgress = 0;
            }
          } else if (mode === 1) {
            var width: EngineRuntimeValue = wv.drawer.width;
            var available_pixels: EngineRuntimeValue = width - width / wv.ZoomFactor;
            var target: EngineRuntimeValue = wv.ZoomFactor - 1;
            if (target <= 0) return;
            var old_factor: EngineRuntimeValue = wv.ZoomFactor;
            wv.ZoomFactor -= (diff * target) / available_pixels;
            if (wv.ZoomFactor < 1) wv.ZoomFactor = 1;
            var temp: EngineRuntimeValue = wv.getDuration() / wv.ZoomFactor;
            if (temp + wv.LeftProgress > wv.getDuration()) {
              wv.ZoomFactor = old_factor;
            } else {
              if (temp <= 0.5) {
                wv.ZoomFactor = old_factor;
                return;
              }
              wv.VisibleDuration = temp;
            }
            // -
          }
          // wv.ZoomFactor -= Math.abs (diff / (wv.drawer.width / 2));
          // console.log( diff + " BLAH " + wv.ZoomFactor + '   ' +  (diff / wv.drawer.width) );
          queueViewportDraw();
        },
      );
      app.listenFor(
        'RequestPan',
        function (this: EngineRuntimeValue, diff?: EngineRuntimeValue, mode?: EngineRuntimeValue) {
          var wv: EngineRuntimeValue = wavesurfer;
          if (mode === 1) diff *= wv.ZoomFactor;
          else if (mode === 2) {
            var time_moved: EngineRuntimeValue = wv.getDuration() * (diff / wv.drawer.width);
            wv.LeftProgress = time_moved;
            queueViewportDraw();
            return;
          }
          if (wv.ZoomFactor > 0) {
            // drag and draw by X pixels...
            var time_moved: EngineRuntimeValue = wv.VisibleDuration * (diff / wv.drawer.width);
            wv.LeftProgress += time_moved;
            if (wv.LeftProgress + wv.VisibleDuration >= wv.getDuration()) {
              wv.LeftProgress = wv.getDuration() - wv.VisibleDuration;
            } else if (wv.LeftProgress < 0) {
              wv.LeftProgress = 0;
            }
            queueViewportDraw();
          }
        },
      );
      wave.addEventListener(
        'mousedown',
        function (this: EngineRuntimeValue, e?: EngineRuntimeValue) {
          if (e.which === 3) {
            e.preventDefault();
            wavesurfer.Interacting |= 1 << 1;
            drag_x = e.clientX;
            wave.className = 'pk_grabbing';
            document.addEventListener('mousemove', drag_move, false);
            return false;
          } else {
            app.fireEvent('MouseDown');
            app.fireEvent('RequestChanToggle', 0, 1);
            app.fireEvent('RequestChanToggle', 1, 1);
          }
        },
        false,
      );
      wave.addEventListener(
        'mouseleave',
        function (this: EngineRuntimeValue, e?: EngineRuntimeValue) {
          document.removeEventListener('mousemove', drag_move);
          if (wave.className !== '') {
            wave.className = '';
            setTimeout(function (this: EngineRuntimeValue) {
              wavesurfer.Interacting &= ~(1 << 1);
            }, 20);
          }
        },
        false,
      );
      wave.addEventListener(
        'mouseup',
        function (this: EngineRuntimeValue, e?: EngineRuntimeValue) {
          if (e.which === 3) {
            if (wave.className !== '') {
              wave.className = '';
              setTimeout(function (this: EngineRuntimeValue) {
                wavesurfer.Interacting &= ~(1 << 1);
              }, 20);
            }
            document.removeEventListener('mousemove', drag_move);
          }
        },
        false,
      );
      app.fireEvent('RequestResize');
      app.listenFor('RequestViewFollowCursorToggle', function (this: EngineRuntimeValue) {
        var val: EngineRuntimeValue = !wavesurfer.FollowCursor;
        wavesurfer.FollowCursor = val;
        // jump to curr cursor position
        if (val && q.is_ready) {
          wavesurfer.CursorCenter();
        }
        app.fireEvent('DidViewFollowCursorToggle', val);
      });
      app.listenFor('RequestViewPeakSeparatorToggle', function (this: EngineRuntimeValue) {
        if (!q.is_ready) return;
        var val: EngineRuntimeValue = !wavesurfer.params.limits;
        wavesurfer.params.limits = val;
        wavesurfer.ForceDraw();
        app.fireEvent('DidViewPeakSeparatorToggle', val);
      });
      app.listenFor('RequestSnapSelDrag', function (this: EngineRuntimeValue) {
        snap_sel = !snap_sel;
        wavesurfer.SnapTime = snap_sel ? snapTime : null;
        if (w.AMPreferences) w.AMPreferences.set('snapZeroCrossing', snap_sel);
        OneUp('Zero Cross Selection ' + (snap_sel ? 'On' : 'Off'), 900);
        app.fireEvent('DidSnapSelDrag', snap_sel);
      });
      app.listenFor('RequestViewTimelineToggle', function (this: EngineRuntimeValue) {
        var val: EngineRuntimeValue = !wavesurfer.params.timeline;
        wavesurfer.params.timeline = val;
        if (q.is_ready) wavesurfer.ForceDraw();
        app.fireEvent('DidViewTimelineToggle', val);
      });
      app.listenFor('RequestViewCenterToCursor', function (this: EngineRuntimeValue) {
        if (!q.is_ready) return;
        wavesurfer.CursorCenter();
      });
      app.listenFor(
        'RequestZoomUI',
        function (this: EngineRuntimeValue, type?: EngineRuntimeValue, val?: EngineRuntimeValue) {
          if (!q.is_ready) return;
          if (type === 0) {
            wavesurfer.ResetZoom();
            return;
          }
          if (type === 'h') {
            wavesurfer.SetZoom(0.5, val);
          }
          if (type === 'v') {
            wavesurfer.SetZoomVertical(val);
          }
        },
      );
      // -
      this.ID3 = function (this: EngineRuntimeValue, arraybuffer?: EngineRuntimeValue) {
        var tags: EngineRuntimeValue = null;
        // var ttt = window.performance.now();
        var bytes: EngineRuntimeValue = new Uint8Array(arraybuffer);
        if (bytes.length < 64) {
          app.fireEvent('RequestActionID3', 1, tags);
          return tags;
        }
        if (bytes[0] === 73 && bytes[1] === 68 && bytes[2] === 51) {
          tags = ID3v2.ReadTags(arraybuffer);
          if (tags) {
            tags._type = 'mp3';
          }
          //console.log( window.performance.now() - ttt );
          // console.log( tags );
        } else if (
          bytes[4] === 102 &&
          bytes[5] === 116 &&
          bytes[6] === 121 &&
          bytes[7] === 112 &&
          bytes[8] === 77 &&
          bytes[9] === 52
        ) {
          tags = ID4.ReadTags(arraybuffer);
          if (tags) {
            tags._type = 'm4a';
          }
          // console.log( window.performance.now() - ttt );
          // console.log( tags );
        }
        bytes = null;
        app.fireEvent('RequestActionID3', 1, tags);
        return tags;
      };
      // ---
    }
    PKAE._deps.engine = PKEng;
  })(window, document, PKAudioEditor);
})();
