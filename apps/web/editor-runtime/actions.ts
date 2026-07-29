type ActionsRuntimeValue = ReturnType<typeof JSON.parse>;

(() => {
  const runtimeGlobal: ActionsRuntimeValue = globalThis;
  const window: ActionsRuntimeValue = runtimeGlobal.window;
  const document: ActionsRuntimeValue = runtimeGlobal.document;
  const PKAudioEditor: ActionsRuntimeValue = runtimeGlobal.PKAudioEditor;
  const PKSimpleModal: ActionsRuntimeValue =
    runtimeGlobal.window.AMLateRuntimeValue('PKSimpleModal');
  const PKAudioFXModal: ActionsRuntimeValue =
    runtimeGlobal.window.AMLateRuntimeValue('PKAudioFXModal');
  const OneUp: ActionsRuntimeValue = runtimeGlobal.OneUp;
  const WaveSurfer: ActionsRuntimeValue = runtimeGlobal.WaveSurfer;
  const dragNDrop: ActionsRuntimeValue = runtimeGlobal.window.AMLateRuntimeValue('dragNDrop');
  const ID3v2: ActionsRuntimeValue = runtimeGlobal.window.AMLateRuntimeValue('ID3v2');
  const ID4: ActionsRuntimeValue = runtimeGlobal.window.AMLateRuntimeValue('ID4');
  const wasm_denoise_stream_perf: ActionsRuntimeValue = runtimeGlobal.window.AMLateRuntimeValue(
    'wasm_denoise_stream_perf',
  );
  const app: ActionsRuntimeValue = PKAudioEditor;
  (function (this: ActionsRuntimeValue, PKAE?: ActionsRuntimeValue) {
    'use strict';
    function AudioUtils(
      this: ActionsRuntimeValue,
      master?: ActionsRuntimeValue,
      wavesurfer?: ActionsRuntimeValue,
    ) {
      // audio destination
      var audio_destination: ActionsRuntimeValue = wavesurfer.backend.analyser;
      var audio_ctx: ActionsRuntimeValue = wavesurfer.backend.ac;
      var audio_script_node: ActionsRuntimeValue = audio_ctx.createScriptProcessor(256);
      var fadeGain: ActionsRuntimeValue = master.fadeGain;
      function loadDecoded(this: ActionsRuntimeValue, new_buffer?: ActionsRuntimeValue) {
        wavesurfer.loadDecodedBuffer(new_buffer);
        master.fireEvent('DidUpdateLen', wavesurfer.getDuration());
      }
      var bufferOperations: ActionsRuntimeValue = window.AMAudioBufferOperations.create(
        wavesurfer,
        function (this: ActionsRuntimeValue, duration?: ActionsRuntimeValue) {
          master.fireEvent('DidUpdateLen', duration);
        },
      );
      var OverwriteBufferWithSegment: ActionsRuntimeValue = bufferOperations.overwriteSegment;
      var OverwriteBuffer: ActionsRuntimeValue = bufferOperations.replaceBuffer;
      var MakeSilenceBuffer: ActionsRuntimeValue = bufferOperations.makeSilence;
      var CopyBufferSegment: ActionsRuntimeValue = bufferOperations.copySegment;
      function AnalyzeLoudness(
        this: ActionsRuntimeValue,
        _offset?: ActionsRuntimeValue,
        _duration?: ActionsRuntimeValue,
      ) {
        if (!PKAE._deps.lufs) return null;
        return PKAE._deps.lufs.analyze(CopyBufferSegment(_offset, _duration));
      }
      var TrimBuffer: ActionsRuntimeValue = bufferOperations.trim;
      var InsertSegmentToBuffer: ActionsRuntimeValue = bufferOperations.insertSegment;
      var ReplaceFloatArrays: ActionsRuntimeValue = bufferOperations.replaceFloatArrays;
      var InsertFloatArrays: ActionsRuntimeValue = bufferOperations.insertFloatArrays;
      function getAudioContext(this: ActionsRuntimeValue) {
        if (!window.WaveSurferAudioContext) {
          window.WaveSurferAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return window.WaveSurferAudioContext;
      }
      function getOfflineAudioContext(
        this: ActionsRuntimeValue,
        channels?: ActionsRuntimeValue,
        sampleRate?: ActionsRuntimeValue,
        duration?: ActionsRuntimeValue,
      ) {
        return new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(
          channels,
          duration,
          sampleRate,
        );
      }
      function initPreview(this: ActionsRuntimeValue, val?: ActionsRuntimeValue) {
        this.previewVal = val;
      }
      function stopPreview(this: ActionsRuntimeValue, _fx?: ActionsRuntimeValue) {
        if (!this.previewing) return;
        var source: ActionsRuntimeValue = this.PreviewSource;
        if (_fx)
          try {
            _fx.destroy && _fx.destroy();
          } catch (e: ActionsRuntimeValue) {}
        try {
          this.PreviewTog && this.PreviewTog(false, source);
        } catch (e: ActionsRuntimeValue) {}
        if (this.PreviewFilter) {
          if (this.PreviewFilter.length > 0) {
            for (var ii: ActionsRuntimeValue = 0; ii < this.PreviewFilter.length; ++ii)
              try {
                this.PreviewFilter[ii].disconnect();
              } catch (e: ActionsRuntimeValue) {}
          } else
            try {
              this.PreviewFilter.disconnect();
            } catch (e: ActionsRuntimeValue) {}
        }
        var script_node: ActionsRuntimeValue = audio_script_node; // wavesurfer.backend.scriptNode
        try {
          script_node.disconnect();
        } catch (e: ActionsRuntimeValue) {}
        try {
          wavesurfer.backend.scriptNode.connect(audio_ctx.destination);
        } catch (e: ActionsRuntimeValue) {}
        // wavesurfer.backend.scriptNode.connect (audio_ctx.destination);
        // wavesurfer.backend.scriptNode.onaudioprocess = null;
        try {
          source && source.stop();
        } catch (e: ActionsRuntimeValue) {}
        try {
          source && source.disconnect();
        } catch (e: ActionsRuntimeValue) {}
        this.PreviewDestination =
          this.PreviewSource =
          this.PreviewFilter =
          this.PreviewUpdate =
          this.PreviewTog =
            null;
        this.previewing = 0;
      }
      function togglePreview(this: ActionsRuntimeValue) {
        if (!this.previewing) {
          this.previewVal = !this.previewVal;
          return this.previewVal;
        }
        if (this.previewing === 2) {
          //				if (this.PreviewFilter)
          //				{
          //					if (this.PreviewFilter.length > 0)
          //					{
          //						for (var ii = 0; ii < this.PreviewFilter.length; ++ii)
          //							this.PreviewFilter[ ii ].disconnect ();
          //					}
          //					else
          //						this.PreviewFilter.disconnect ();
          //				}
          if (this.PreviewTog) {
            this.PreviewTog(false, this.PreviewSource);
          }
          this.PreviewSource.disconnect();
          this.PreviewSource.connect(this.PreviewDestination);
          this.previewing = 1;
          this.previewVal = false;
          return false;
        } else {
          this.PreviewSource.disconnect();
          if (this.PreviewFilter) {
            if (this.PreviewFilter.length > 0) {
              !this.PreviewFilter[0]._pk_own &&
                !this.PreviewFilter[0].buffer &&
                this.PreviewSource.connect(this.PreviewFilter[0]);
              //						var ii = 0;
              //						for (; ii < this.PreviewFilter.length - 1; ++ii)
              //						{
              //							this.PreviewFilter[ ii ].disconnect ();
              //							this.PreviewFilter[ ii ].connect (this.PreviewFilter[ ii + 1 ]);
              //						}
              //						this.PreviewFilter[ ii ].connect (this.PreviewDestination);
            } else {
              !this.PreviewFilter.buffer && this.PreviewSource.connect(this.PreviewFilter);
              this.PreviewFilter.disconnect();
              this.PreviewFilter.connect(this.PreviewDestination);
            }
          }
          if (this.PreviewTog) {
            this.PreviewTog(true, this.PreviewSource);
          }
          this.previewing = 2;
          this.previewVal = true;
          return true;
        }
      }
      function previewEffect(
        this: ActionsRuntimeValue,
        _offset?: ActionsRuntimeValue,
        _duration?: ActionsRuntimeValue,
        _fx?: ActionsRuntimeValue,
        _seek?: ActionsRuntimeValue,
      ) {
        if (this.previewing) stopPreview.call(this, _fx);
        var orig_buffer: ActionsRuntimeValue = wavesurfer.backend.buffer;
        if (!_offset && !_duration) {
          _offset = 0;
          _duration = (orig_buffer.length / orig_buffer.sampleRate) >> 0;
        }
        var script_node: ActionsRuntimeValue = audio_script_node; //wavesurfer.backend.scriptNode;
        var fx_buffer: ActionsRuntimeValue = CopyBufferSegment(_offset, _duration);
        var audio_ctx: ActionsRuntimeValue = wavesurfer.backend.ac || getAudioContext();
        var source: ActionsRuntimeValue = audio_ctx.createBufferSource();
        var seek: ActionsRuntimeValue = _seek / 1 || 0;
        seek = Math.max(0, Math.min(seek, fx_buffer.duration - 1 / fx_buffer.sampleRate));
        source.buffer = fx_buffer;
        source.loop = true;
        source._pkSeek = seek;
        this.PreviewFilter = this.PreviewTog = null;
        if (!_fx) source.connect(audio_destination);
        else {
          this.PreviewTog = _fx.preview;
          this.PreviewUpdate = _fx.update;
          this.PreviewFilter = _fx.filter(
            audio_ctx,
            audio_destination,
            source,
            _duration / 1,
            true,
            seek,
          );
        }
        script_node.disconnect();
        wavesurfer.backend.scriptNode.disconnect();
        script_node.connect(audio_ctx.destination);
        var skipp: ActionsRuntimeValue = 1;
        var prev_fft: ActionsRuntimeValue = 0;
        var dataArray: ActionsRuntimeValue = null;
        script_node.onaudioprocess = (e?: ActionsRuntimeValue) => {
          var loudness: ActionsRuntimeValue = [0, 0];
          var temp: ActionsRuntimeValue = 0;
          // var flip = false;
          --skipp;
          if (skipp === 0) {
            if (audio_destination.getFloatTimeDomainData) {
              if (prev_fft !== audio_destination.fftSize) {
                dataArray = new Float32Array(audio_destination.fftSize); // Float32Array needs to be the same length as the fftSize
                prev_fft = audio_destination.fftSize;
              }
              audio_destination.getFloatTimeDomainData(dataArray); // fill the Float32Array with data returned from getFloatTimeDomainData()
              for (var j: ActionsRuntimeValue = 0; j < audio_destination.fftSize; j += 1) {
                var x: ActionsRuntimeValue = dataArray[j];
                if (Math.abs(x) >= temp) {
                  temp = Math.abs(x);
                }
              }
              loudness[0] = 20 * Math.log10(temp) + 0.001;
            } else {
              if (prev_fft !== audio_destination.fftSize) {
                dataArray = new Uint8Array(audio_destination.fftSize); // Float32Array needs to be the same length as the fftSize
                prev_fft = audio_destination.fftSize;
              }
              audio_destination.getByteTimeDomainData(dataArray); // fill the Float32Array with data returned from getFloatTimeDomainData()
              var total_float: ActionsRuntimeValue = 0;
              for (var j: ActionsRuntimeValue = 0; j < audio_destination.fftSize; j += 1) {
                var float: ActionsRuntimeValue = dataArray[j] / 0x80 - 1;
                total_float += float * float;
              }
              var rms: ActionsRuntimeValue = Math.sqrt(total_float / audio_destination.fftSize);
              loudness[0] = 20 * (Math.log(rms) / Math.log(10));
            }
            if (loudness[0] < -100) loudness[0] = -100;
            loudness[1] = loudness[0];
            // audio_destination.fftSize = 512;
            audio_destination.getByteFrequencyData(wavesurfer.backend.FreqArr);
            //wavesurfer.backend.peak_frequency = Math.max.apply( null, wavesurfer.backend.FreqArr );
            master.fireEvent(
              'DidAudioProcess',
              [-1, loudness, e.timeStamp],
              wavesurfer.backend.FreqArr,
            );
            // wavesurfer.backend.peak_frequency = [0, 0];
            skipp = 2;
          }
        };
        source._pkStart = audio_ctx.currentTime;
        source.start(0, seek);
        this.PreviewSource = source;
        this.PreviewDestination = audio_destination;
        this.previewing = 2;
        if (!this.previewVal) {
          togglePreview.call(this);
        }
        return source;
      }
      function previewBuffer(
        this: ActionsRuntimeValue,
        buffer?: ActionsRuntimeValue,
        _seek?: ActionsRuntimeValue,
      ) {
        if (this.previewing) stopPreview.call(this);
        var audio_ctx: ActionsRuntimeValue = wavesurfer.backend.ac || getAudioContext();
        var source: ActionsRuntimeValue = audio_ctx.createBufferSource();
        var seek: ActionsRuntimeValue = _seek / 1 || 0;
        seek = Math.max(0, Math.min(seek, buffer.duration - 1 / buffer.sampleRate));
        source.buffer = buffer;
        source.loop = true;
        source.connect(audio_destination);
        source.start(0, seek);
        this.PreviewFilter = this.PreviewTog = this.PreviewUpdate = null;
        this.PreviewSource = source;
        this.PreviewDestination = audio_destination;
        this.previewing = 2;
        return source;
      }
      function findZero(
        this: ActionsRuntimeValue,
        data?: ActionsRuntimeValue,
        i?: ActionsRuntimeValue,
        dir?: ActionsRuntimeValue,
        max?: ActionsRuntimeValue,
        slope?: ActionsRuntimeValue,
      ) {
        var any: ActionsRuntimeValue = -1;
        for (var n: ActionsRuntimeValue = 0; n < max; ++n, i += dir) {
          if (i < 1 || i >= data.length - 1) break;
          if ((data[i - 1] <= 0 && data[i] >= 0) || (data[i - 1] >= 0 && data[i] <= 0)) {
            if (any < 0) any = i;
            if (!slope || (data[i + 1] - data[i - 1]) * slope > 0) return i;
          }
        }
        return any;
      }
      function seamlessBuffer(
        this: ActionsRuntimeValue,
        buffer?: ActionsRuntimeValue,
        val?: ActionsRuntimeValue,
      ) {
        val = val || {};
        var data: ActionsRuntimeValue = buffer.getChannelData(0);
        var start: ActionsRuntimeValue = 0,
          end: ActionsRuntimeValue = buffer.length;
        if (val.trim) {
          var pad: ActionsRuntimeValue = (buffer.sampleRate / 1000) >> 0;
          while (start < end - 8 && Math.abs(data[start]) < 0.0007) ++start;
          while (end > start + 8 && Math.abs(data[end - 1]) < 0.0007) --end;
          if (end > start + 8) {
            start = Math.max(0, start - pad);
            end = Math.min(buffer.length, end + pad);
          } else {
            start = 0;
            end = buffer.length;
          }
        }
        var max: ActionsRuntimeValue = Math.min((buffer.sampleRate / 100) >> 0, (end - start) >> 3);
        if (val.snap && max > 2) {
          var z1: ActionsRuntimeValue = findZero(data, start + 1, 1, max, 0);
          var slope: ActionsRuntimeValue = z1 > 0 ? data[z1 + 1] - data[z1 - 1] : 0;
          var z2: ActionsRuntimeValue = findZero(data, end - 2, -1, max, slope);
          if (z1 > 0 && z2 > z1 + 8) {
            start = z1;
            end = z2 + 1;
          }
        }
        var len: ActionsRuntimeValue = end - start;
        var fade: ActionsRuntimeValue = Math.min(
          (((val.fade || 0) * buffer.sampleRate) / 1000) >> 0,
          len >> 2,
        );
        var out: ActionsRuntimeValue = audio_ctx.createBuffer(
          buffer.numberOfChannels,
          len - fade,
          buffer.sampleRate,
        );
        for (var ch: ActionsRuntimeValue = 0; ch < buffer.numberOfChannels; ++ch) {
          var src: ActionsRuntimeValue = buffer.getChannelData(ch);
          var dst: ActionsRuntimeValue = out.getChannelData(ch);
          var i: ActionsRuntimeValue = 0;
          for (; i < fade; ++i) {
            var p: ActionsRuntimeValue = i / (fade - 1 || 1);
            dst[i] =
              src[start + i] * Math.sin(p * 1.570796) +
              src[end - fade + i] * Math.cos(p * 1.570796);
          }
          for (; i < dst.length; ++i) dst[i] = src[start + i];
        }
        var repeat: ActionsRuntimeValue = Math.max(1, Math.min(64, (val.repeat || 1) >> 0));
        if (repeat < 2) return out;
        var ret: ActionsRuntimeValue = audio_ctx.createBuffer(
          out.numberOfChannels,
          out.length * repeat,
          out.sampleRate,
        );
        for (var ch: ActionsRuntimeValue = 0; ch < out.numberOfChannels; ++ch) {
          var src: ActionsRuntimeValue = out.getChannelData(ch);
          var dst: ActionsRuntimeValue = ret.getChannelData(ch);
          for (var n: ActionsRuntimeValue = 0; n < repeat; ++n) dst.set(src, n * src.length);
        }
        return ret;
      }
      function seamlessLoop(
        this: ActionsRuntimeValue,
        _offset?: ActionsRuntimeValue,
        _duration?: ActionsRuntimeValue,
        val?: ActionsRuntimeValue,
      ) {
        return seamlessBuffer(CopyBufferSegment(_offset, _duration), val);
      }
      function applyEffect(
        this: ActionsRuntimeValue,
        _offset?: ActionsRuntimeValue,
        _duration?: ActionsRuntimeValue,
        _fx?: ActionsRuntimeValue,
      ) {
        var orig_buffer: ActionsRuntimeValue = wavesurfer.backend.buffer;
        if (!_offset && !_duration) {
          _offset = 0;
          _duration = (orig_buffer.length / orig_buffer.sampleRate) >> 0;
        }
        if (_offset < 0) _offset = 0;
        if (wavesurfer.getDuration() < _duration) _duration = wavesurfer.getDuration();
        var fx_buffer: ActionsRuntimeValue = CopyBufferSegment(_offset, _duration);
        var new_offset: ActionsRuntimeValue = ((_offset / 1) * orig_buffer.sampleRate) >> 0;
        var audio_ctx: ActionsRuntimeValue = getOfflineAudioContext(
          wavesurfer.SelectedChannelsLen, // orig_buffer.numberOfChannels,
          orig_buffer.sampleRate,
          fx_buffer.length,
        );
        var source: ActionsRuntimeValue = audio_ctx.createBufferSource();
        source.buffer = fx_buffer;
        var filter: ActionsRuntimeValue = null;
        if (_fx) {
          filter = _fx.filter(audio_ctx, audio_ctx.destination, source, _duration / 1);
          filter.destroy && filter.destroy();
        }
        source.start();
        var offline_callback: ActionsRuntimeValue = function (
          this: ActionsRuntimeValue,
          rendered_buffer?: ActionsRuntimeValue,
        ) {
          var uber_buffer: ActionsRuntimeValue = wavesurfer.backend.ac.createBuffer(
            orig_buffer.numberOfChannels,
            orig_buffer.length,
            orig_buffer.sampleRate,
          );
          for (var i: ActionsRuntimeValue = 0; i < orig_buffer.numberOfChannels; ++i) {
            var uber_chan_data: ActionsRuntimeValue = uber_buffer.getChannelData(i);
            var chan_data: ActionsRuntimeValue = orig_buffer.getChannelData(i);
            // check if channel is active
            if (wavesurfer.ActiveChannels[i] === 0) {
              uber_chan_data.set(chan_data);
              continue;
            }
            var fx_chan_data: ActionsRuntimeValue = null;
            if (rendered_buffer.numberOfChannels === 1)
              fx_chan_data = rendered_buffer.getChannelData(0);
            else fx_chan_data = rendered_buffer.getChannelData(i);
            uber_chan_data.set(chan_data);
            uber_chan_data.set(fx_chan_data, new_offset, fx_chan_data.length - new_offset);
          }
          loadDecoded(uber_buffer);
          if (filter.length > 0) {
            for (var i: ActionsRuntimeValue = 0; i < filter.length; ++i) filter[i].disconnect();
          } else filter && filter.disconnect && filter.disconnect();
          // is this needed?
          rendered_buffer = fx_buffer = filter = null;
          source.disconnect();
          // audio_ctx.close ();
          // -
        };
        var offline_renderer: ActionsRuntimeValue = audio_ctx.startRendering();
        if (offline_renderer)
          offline_renderer.then(offline_callback).catch(function (
            this: ActionsRuntimeValue,
            err?: ActionsRuntimeValue,
          ) {
            console.log('Rendering failed: ' + err);
          });
        else
          audio_ctx.oncomplete = function (this: ActionsRuntimeValue, e?: ActionsRuntimeValue) {
            offline_callback(e.renderedBuffer);
          };
      }
      /*
                /////////////// -----------------------
                // ATTEMPTING BACKGROUND NOISE REMOVAL
                function findTopFrequencies (_offset, _duration, callback) {
                    var q = this;

                    var audio_ctx = getAudioContext ();
                    var buffer_source = audio_ctx.createBufferSource();
                    buffer_source.buffer = CopyBufferSegment (_offset, _duration);

                    var analyser = audio_ctx.createAnalyser ();
                    analyser.fftSize  = 2048;
                    analyser.minDecibelsis  = -40;
                    analyser.maxDecibelsis  = 0;
                    var scp = audio_ctx.createScriptProcessor (256, 0, 1);

                    buffer_source.connect (analyser);
                    scp.connect (audio_ctx.destination);
                    // buffer_source.loop = true;

                    var samples = 0;
                    var finger_print = new Uint16Array (analyser.frequencyBinCount);
                    var freq_data = new Uint8Array (analyser.frequencyBinCount);
                    scp.onaudioprocess = function () {
                        analyser.getByteFrequencyData (freq_data);

                        for (var i = 0; i < freq_data.length; ++i)
                        {
                            finger_print[ i ] += freq_data [ i ];
                        }
                        ++samples;
                    };
                    buffer_source.onended = function() {

                           var sampleRate = buffer_source.buffer.sampleRate;
                           buffer_source.stop ();
                           buffer_source.disconnect ();
                           scp.disconnect ();

                        for (var i = 0; i < finger_print.length; ++i)
                        {
                            finger_print[ i ] /= samples >> 0;
                            if (finger_print[ i ] < 10) {
                                finger_print[ i ] = 0;
                            }
                        }

                        callback && callback.apply (q, [finger_print] );
                    };
                    buffer_source.start (0);
                }
                function killdTopFrequencies (_offset, _duration, _noise_profile) {
                    var q = this;
                    var step = function ( _offset, _duration, callback ) {
                        findTopFrequencies (_offset, _duration, function( frequencies ) {
                            var similarity = [];
                            var similar_frequencies = 0;

                            for (var i = 0; i < _noise_profile.length; ++i)
                            {
                                var val = Math.abs ( frequencies[ i ] - _noise_profile[ i ] );
                                if (val < 10)
                                {
                                    similarity[ i ] = (val == 0 && _noise_profile[ i ] > 0) ? 5 : val;
                                    ++similar_frequencies;
                                }
                            }

                            if ( similar_frequencies > _noise_profile.length / 3)
                            {
                                cleanUpSpecificAudioRange.apply (q, [_offset, _duration, similarity]);
                            }

                            callback && callback ();
                        });
                    };
                    if (_duration <= 0.1) step ( _offset, _duration );
                    else
                    {
                        var new_offset = _offset;
                        var goal = _offset + _duration;

                        var test = function () {
                            if ( new_offset < goal ) {
                                var dur_step = 0.1;
                                if (new_offset + dur_step > goal) dur_step = goal - new_offset;

                                step ( new_offset, dur_step, test );
                                new_offset += dur_step;
                            }
                        }
                        test ();
                        // -

                    }
                }
                function cleanUpSpecificAudioRange (_offset, _duration, _frequencies) {
                    // var fx_buffer = CopyBufferSegment (_offset, _duration);
                    var val = [];
                    var all_ok = false;

                    for (var i = 0; i < _frequencies.length; ++i)
                    {
                        if (!_frequencies[i]) continue;
                        val.push({
                            'type' : 'notch',
                            'freq' : (i * wavesurfer.backend.ac.sampleRate/_frequencies.length)/2,
                            'val'  : -35,//(_frequencies[i]),
                            'q'	   : 10.0
                        });
                        all_ok = true;
                    }

                    if (all_ok)
                    {
                        var ff = this.FXBank.ParametricEQ( val );
                        this.FX( _offset, _duration, ff );
                    }

        */
      /*
                                var bands = [];
                                var len = val.length;

                                var makeEQ = function ( band ) {
                                    var eq = audio_ctx.createBiquadFilter ();
                                    eq.type = band.type;
                                    eq.gain.value = ~~band.val;
                                    eq.Q.value = 1;
                                    eq.frequency.value = band.freq;

                                    return (eq);
                                };

                                var eq = makeEQ ( val [0] );
                                bands.push ( eq );
                                source.connect (eq);

                                for (var i = 1; i < len - 1; ++i)
                                {
                                    eq = makeEQ ( val [ i ] );
                                    bands [ i - 1 ].connect ( eq );
                                    bands.push ( eq );
                                }
                                eq = makeEQ ( val [ len - 1 ] );
                                bands [ bands.length - 1 ].connect ( eq );
                                bands.push ( eq );
                                eq.connect (audio_ctx.destination);

                                return (bands);
        */
      //		}
      // ENDOF ATTEMPTING BACKGROUND NOISE REMOVAL
      /////////////// -----------------------
      var worker: ActionsRuntimeValue = null;
      function DownloadFileCancel(this: ActionsRuntimeValue) {
        if (worker) {
          worker.terminate();
          worker = null;
        }
      }
      function DownloadFile(
        this: ActionsRuntimeValue,
        with_name?: ActionsRuntimeValue,
        format?: ActionsRuntimeValue,
        kbps?: ActionsRuntimeValue,
        selection?: ActionsRuntimeValue,
        stereo?: ActionsRuntimeValue,
        bit_depth?: ActionsRuntimeValue,
        dither?: ActionsRuntimeValue,
        callback?: ActionsRuntimeValue,
        source_buffer?: ActionsRuntimeValue,
      ) {
        var originalBuffer: ActionsRuntimeValue =
          source_buffer || (wavesurfer && wavesurfer.backend && wavesurfer.backend.buffer);
        if (!originalBuffer) {
          return false;
        }
        if (format === 'mp3') {
          worker = new Worker('lame.js');
        } else if (format === 'flac') {
          worker = new Worker('flac.js');
        } else {
          worker = new Worker('wav.js?v=ts1');
        }
        var sample_rate: ActionsRuntimeValue = originalBuffer.sampleRate;
        var channels: ActionsRuntimeValue = originalBuffer.numberOfChannels;
        var data_left: ActionsRuntimeValue = originalBuffer.getChannelData(0);
        var data_right: ActionsRuntimeValue = null;
        var mono_right: ActionsRuntimeValue = null;
        if (channels === 2) data_right = originalBuffer.getChannelData(1);
        if (!source_buffer && !stereo && channels === 2) {
          if (!wavesurfer.ActiveChannels[0] && wavesurfer.ActiveChannels[1]) {
            data_left = originalBuffer.getChannelData(1);
            data_right = null;
            channels = 1;
          }
        }
        if (stereo && !data_right) {
          data_right = data_left;
          channels = 2;
        } else if (!stereo && data_right) {
          if (
            source_buffer ||
            !wavesurfer.ActiveChannels ||
            (wavesurfer.ActiveChannels[0] && wavesurfer.ActiveChannels[1])
          ) {
            mono_right = data_right;
          }
          data_right = null;
          channels = 1;
        }
        var len: ActionsRuntimeValue = data_left.length,
          i: ActionsRuntimeValue = 0;
        var offset: ActionsRuntimeValue = 0;
        if (selection) {
          offset = (selection[0] * sample_rate) >> 0;
          len = ((selection[1] * sample_rate) >> 0) - offset;
        }
        var wav_bits: ActionsRuntimeValue = format === 'wav' ? bit_depth / 1 || 16 : 16;
        if (wav_bits !== 16 && wav_bits !== 24 && wav_bits !== 32) wav_bits = 16;
        var wav_dither: ActionsRuntimeValue = format === 'wav' && wav_bits === 16 && !!dither;
        var ArrType: ActionsRuntimeValue =
          wav_bits === 32 ? Float32Array : wav_bits === 24 ? Int32Array : Int16Array;
        var dataArrLeft: ActionsRuntimeValue = new ArrType(len);
        var dataArrRight: ActionsRuntimeValue = data_right ? new ArrType(len) : null;
        var encode_base: ActionsRuntimeValue = 10;
        var last_progress: ActionsRuntimeValue = -1;
        function convert16(this: ActionsRuntimeValue, n?: ActionsRuntimeValue) {
          var v: ActionsRuntimeValue = n < 0 ? n * 32768 : n * 32767;
          return Math.max(-32768, Math.min(32767, v));
        }
        function convert16dith(this: ActionsRuntimeValue, n?: ActionsRuntimeValue) {
          var v: ActionsRuntimeValue =
            (n < 0 ? n * 32768 : n * 32767) + (Math.random() - Math.random());
          return Math.max(-32768, Math.min(32767, Math.round(v)));
        }
        function convert24(this: ActionsRuntimeValue, n?: ActionsRuntimeValue) {
          var v: ActionsRuntimeValue = n < 0 ? n * 8388608 : n * 8388607;
          return Math.max(-8388608, Math.min(8388607, Math.round(v)));
        }
        var convert: ActionsRuntimeValue =
          wav_bits === 32
            ? null
            : wav_bits === 24
              ? convert24
              : wav_dither
                ? convert16dith
                : convert16;
        function progress(this: ActionsRuntimeValue, val?: ActionsRuntimeValue) {
          val = Math.max(0, Math.min(99, val >> 0));
          if (val === last_progress) return;
          last_progress = val;
          callback && callback(val);
        }
        worker.onmessage = function (this: ActionsRuntimeValue, ev?: ActionsRuntimeValue) {
          if (ev.data.percentage) {
            progress(encode_base + (ev.data.percentage * (100 - encode_base)) / 100);
            return;
          }
          forceDownload(ev.data);
          worker.terminate();
          worker = null;
        };
        function fillChunk(this: ActionsRuntimeValue) {
          if (!worker) return;
          var end: ActionsRuntimeValue = Math.min(len, i + 262144);
          if (convert) {
            if (data_right) {
              while (i < end) {
                dataArrLeft[i] = convert(data_left[offset + i]);
                dataArrRight[i] = convert(data_right[offset + i]);
                ++i;
              }
            } else if (mono_right) {
              while (i < end) {
                dataArrLeft[i] = convert((data_left[offset + i] + mono_right[offset + i]) * 0.5);
                ++i;
              }
            } else {
              while (i < end) {
                dataArrLeft[i] = convert(data_left[offset + i]);
                ++i;
              }
            }
          } else {
            if (data_right) {
              while (i < end) {
                dataArrLeft[i] = data_left[offset + i];
                dataArrRight[i] = data_right[offset + i];
                ++i;
              }
            } else if (mono_right) {
              while (i < end) {
                dataArrLeft[i] = (data_left[offset + i] + mono_right[offset + i]) * 0.5;
                ++i;
              }
            } else {
              while (i < end) {
                dataArrLeft[i] = data_left[offset + i];
                ++i;
              }
            }
          }
          progress((i / len) * encode_base);
          if (i < len) {
            setTimeout(fillChunk, 0);
            return;
          }
          worker.postMessage({
            sample_rate: sample_rate,
            kbps: !kbps ? 128 : kbps,
            flac_compression: kbps,
            channels: channels,
            bit_depth: wav_bits,
            samples: len,
          });
          worker.postMessage(dataArrLeft.buffer, [dataArrLeft.buffer]);
          if (data_right) worker.postMessage(dataArrRight.buffer, [dataArrRight.buffer]);
          else worker.postMessage(null);
        }
        fillChunk();
        return;
        // function forceDownload ( mp3Data ) {
        // 	var blob = new Blob (mp3Data, {type:'audio/mp3'});
        function forceDownload(this: ActionsRuntimeValue, blob?: ActionsRuntimeValue) {
          var url: ActionsRuntimeValue = (window.URL || window.webkitURL).createObjectURL(blob);
          var a: ActionsRuntimeValue = document.createElement('a');
          a.href = url;
          a.download = with_name ? with_name : 'output.mp3';
          a.style.display = 'none';
          document.body.appendChild(a);
          a.click();
          callback && callback('done');
        }
      }
      function updatePreview(this: ActionsRuntimeValue, val?: ActionsRuntimeValue) {
        if (!this.previewing) return;
        this.PreviewUpdate &&
          this.PreviewUpdate(this.PreviewFilter, audio_ctx, val, this.PreviewSource);
      }
      var effectUtilities: ActionsRuntimeValue = window.AMAudioEffectUtilities;
      var fadeCurve: ActionsRuntimeValue = function (
        this: ActionsRuntimeValue,
        rev?: ActionsRuntimeValue,
      ) {
        return effectUtilities.fadeCurve(fadeGain, rev);
      };
      var gainFilter: ActionsRuntimeValue = effectUtilities.gainFilter;
      var setGainValue: ActionsRuntimeValue = effectUtilities.setGainValue;
      var channelGainFilter: ActionsRuntimeValue = effectUtilities.channelGainFilter;
      var setChannelGains: ActionsRuntimeValue = effectUtilities.setChannelGains;
      var applyBufferGains: ActionsRuntimeValue = effectUtilities.applyBufferGains;
      var peakNormalizeStats: ActionsRuntimeValue = effectUtilities.peakNormalizeStats;
      var peakNormalizeGains: ActionsRuntimeValue = effectUtilities.peakNormalizeGains;
      var rmsNormalizeStats: ActionsRuntimeValue = effectUtilities.rmsNormalizeStats;
      var rmsNormalizeGains: ActionsRuntimeValue = effectUtilities.rmsNormalizeGains;
      function lufsNormalizeGain(
        this: ActionsRuntimeValue,
        source?: ActionsRuntimeValue,
        val?: ActionsRuntimeValue,
      ) {
        var gain: ActionsRuntimeValue = val && val.gain;
        if (!(gain > 0) && PKAE._deps.lufs) {
          var report: ActionsRuntimeValue = PKAE._deps.lufs.analyze(source.buffer);
          gain = PKAE._deps.lufs.gainForTarget(report, val.target, val.ceiling).gain;
        }
        return gain > 0 ? gain : 1;
      }
      var clampRate: ActionsRuntimeValue = effectUtilities.clampRate;
      var ratePoints: ActionsRuntimeValue = effectUtilities.ratePoints;
      var rateDuration: ActionsRuntimeValue = effectUtilities.rateDuration;
      var rateAt: ActionsRuntimeValue = effectUtilities.rateAt;
      var setRate: ActionsRuntimeValue = effectUtilities.setRate;
      // EFFECTS LOGIC
      var FXBank: ActionsRuntimeValue = {
        Gain: function (this: ActionsRuntimeValue, val?: ActionsRuntimeValue) {
          return {
            filter: function (
              this: ActionsRuntimeValue,
              audio_ctx?: ActionsRuntimeValue,
              destination?: ActionsRuntimeValue,
              source?: ActionsRuntimeValue,
              duration?: ActionsRuntimeValue,
            ) {
              var gain: ActionsRuntimeValue = audio_ctx.createGain();
              for (var k: ActionsRuntimeValue = 0; k < val.length; ++k) {
                var curr: ActionsRuntimeValue = val[k];
                if (curr.length) {
                  for (var i: ActionsRuntimeValue = 0; i < curr.length; ++i) {
                    gain.gain.linearRampToValueAtTime(
                      curr[i].val,
                      audio_ctx.currentTime + curr[i].time,
                    );
                  }
                } else {
                  gain.gain.setValueAtTime(curr.val, audio_ctx.currentTime);
                }
              }
              gain.connect(destination);
              source.connect(gain);
              return gain;
            },
            update: function (
              this: ActionsRuntimeValue,
              gain?: ActionsRuntimeValue,
              audio_ctx?: ActionsRuntimeValue,
              val?: ActionsRuntimeValue,
            ) {
              for (var k: ActionsRuntimeValue = 0; k < val.length; ++k) {
                var curr: ActionsRuntimeValue = val[k];
                if (curr.length) {
                  for (var i: ActionsRuntimeValue = 0; i < curr.length; ++i) {
                    gain.gain.linearRampToValueAtTime(
                      curr[i].val,
                      audio_ctx.currentTime + curr[i].time,
                    );
                  }
                } else {
                  gain.gain.setValueAtTime(curr.val, audio_ctx.currentTime);
                }
              }
              // ----
            },
          };
        },
        FadeIn: function (this: ActionsRuntimeValue, val?: ActionsRuntimeValue) {
          return {
            filter: function (
              this: ActionsRuntimeValue,
              audio_ctx?: ActionsRuntimeValue,
              destination?: ActionsRuntimeValue,
              source?: ActionsRuntimeValue,
              duration?: ActionsRuntimeValue,
            ) {
              var gain: ActionsRuntimeValue = audio_ctx.createGain();
              gain.gain.setValueAtTime(0, audio_ctx.currentTime);
              gain.gain.setValueCurveAtTime(fadeCurve(), audio_ctx.currentTime, duration || 0.001);
              gain.connect(destination);
              source.connect(gain);
              return gain;
            },
          };
        },
        FadeOut: function (this: ActionsRuntimeValue, val?: ActionsRuntimeValue) {
          return {
            filter: function (
              this: ActionsRuntimeValue,
              audio_ctx?: ActionsRuntimeValue,
              destination?: ActionsRuntimeValue,
              source?: ActionsRuntimeValue,
              duration?: ActionsRuntimeValue,
            ) {
              var gain: ActionsRuntimeValue = audio_ctx.createGain();
              gain.gain.setValueAtTime(1, audio_ctx.currentTime);
              gain.gain.setValueCurveAtTime(fadeCurve(1), audio_ctx.currentTime, duration || 0.001);
              gain.connect(destination);
              source.connect(gain);
              return gain;
            },
          };
        },
        Compressor: (function (this: ActionsRuntimeValue) {
          var P: ActionsRuntimeValue = ['threshold', 'knee', 'ratio', 'attack', 'release'];
          function ap(
            this: ActionsRuntimeValue,
            n?: ActionsRuntimeValue,
            ac?: ActionsRuntimeValue,
            v?: ActionsRuntimeValue,
          ) {
            for (var i: ActionsRuntimeValue = 0; i < 5; ++i) {
              var k: ActionsRuntimeValue = P[i],
                x: ActionsRuntimeValue = v[k];
              if (!x) continue;
              if (x.length) {
                for (var j: ActionsRuntimeValue = 0; j < x.length; ++j) {
                  var c: ActionsRuntimeValue = x[j];
                  n[k].linearRampToValueAtTime(c.val, ac.currentTime + c.time);
                }
              } else n[k].setValueAtTime(x.val, ac.currentTime);
            }
          }
          function mkv(this: ActionsRuntimeValue, v?: ActionsRuntimeValue) {
            return v && v.val !== undefined ? v.val : 0;
          }
          function l(this: ActionsRuntimeValue, d?: ActionsRuntimeValue) {
            return Math.pow(10, d / 20);
          }
          return function (this: ActionsRuntimeValue, val?: ActionsRuntimeValue) {
            return {
              filter: function (
                this: ActionsRuntimeValue,
                ac?: ActionsRuntimeValue,
                dst?: ActionsRuntimeValue,
                src?: ActionsRuntimeValue,
              ) {
                var c: ActionsRuntimeValue = ac.createDynamicsCompressor(),
                  g: ActionsRuntimeValue = ac.createGain();
                ap(c, ac, val);
                g.gain.value = l(mkv(val.makeup));
                src.connect(c);
                c.connect(g);
                g.connect(dst);
                return [c, g];
              },
              update: function (
                this: ActionsRuntimeValue,
                ch?: ActionsRuntimeValue,
                ac?: ActionsRuntimeValue,
                v?: ActionsRuntimeValue,
              ) {
                ap(ch[0], ac, v);
                ch[1].gain.value = l(mkv(v.makeup));
              },
            };
          };
        })(),
        Reverse: function (this: ActionsRuntimeValue, val?: ActionsRuntimeValue) {
          return {
            filter: function (
              this: ActionsRuntimeValue,
              audio_ctx?: ActionsRuntimeValue,
              destination?: ActionsRuntimeValue,
              source?: ActionsRuntimeValue,
              duration?: ActionsRuntimeValue,
            ) {
              for (var i: ActionsRuntimeValue = 0; i < source.buffer.numberOfChannels; ++i) {
                Array.prototype.reverse.call(source.buffer.getChannelData(i));
              }
              source.connect(destination);
              return source;
            },
            update: function (this: ActionsRuntimeValue) {},
          };
        },
        Invert: function (this: ActionsRuntimeValue, val?: ActionsRuntimeValue) {
          return {
            filter: function (
              this: ActionsRuntimeValue,
              audio_ctx?: ActionsRuntimeValue,
              destination?: ActionsRuntimeValue,
              source?: ActionsRuntimeValue,
              duration?: ActionsRuntimeValue,
            ) {
              for (var i: ActionsRuntimeValue = 0; i < source.buffer.numberOfChannels; ++i) {
                var channel: ActionsRuntimeValue = source.buffer.getChannelData(i);
                for (var j: ActionsRuntimeValue = 0; j < channel.length; ++j) channel[j] *= -1;
              }
              source.connect(destination);
              return source;
            },
            update: function (this: ActionsRuntimeValue) {},
          };
        },
        Flip: function (
          this: ActionsRuntimeValue,
          val?: ActionsRuntimeValue,
          val2?: ActionsRuntimeValue,
        ) {
          return {
            filter: function (
              this: ActionsRuntimeValue,
              audio_ctx?: ActionsRuntimeValue,
              destination?: ActionsRuntimeValue,
              source?: ActionsRuntimeValue,
              duration?: ActionsRuntimeValue,
            ) {
              if (val === 'flip') {
                var chan0: ActionsRuntimeValue = source.buffer.getChannelData(0);
                var chan1: ActionsRuntimeValue = source.buffer.getChannelData(1);
                var tmp: ActionsRuntimeValue = 0;
                for (var j: ActionsRuntimeValue = 0; j < chan0.length; ++j) {
                  tmp = chan0[j];
                  chan0[j] = chan1[j];
                  chan1[j] = tmp;
                }
              }
              source.connect(destination);
              return source;
            },
            update: function (this: ActionsRuntimeValue) {},
          };
        },
        Normalize: function (this: ActionsRuntimeValue, val?: ActionsRuntimeValue) {
          var stats: ActionsRuntimeValue = null;
          function gains(
            this: ActionsRuntimeValue,
            buffer?: ActionsRuntimeValue,
            v?: ActionsRuntimeValue,
          ) {
            if (!stats || stats.buffer !== buffer) stats = peakNormalizeStats(buffer);
            return peakNormalizeGains(stats, v);
          }
          return {
            filter: function (
              this: ActionsRuntimeValue,
              audio_ctx?: ActionsRuntimeValue,
              destination?: ActionsRuntimeValue,
              source?: ActionsRuntimeValue,
              duration?: ActionsRuntimeValue,
              preview?: ActionsRuntimeValue,
            ) {
              var vals: ActionsRuntimeValue = gains(source.buffer, val);
              if (preview) return channelGainFilter(audio_ctx, destination, source, vals);
              applyBufferGains(source.buffer, vals);
              source.connect(destination);
              return source;
            },
            update: function (
              this: ActionsRuntimeValue,
              filter?: ActionsRuntimeValue,
              audio_ctx?: ActionsRuntimeValue,
              val?: ActionsRuntimeValue,
              source?: ActionsRuntimeValue,
            ) {
              setChannelGains(filter, audio_ctx, gains(source.buffer, val));
            },
          };
        },
        NormalizeRMS: function (this: ActionsRuntimeValue, val?: ActionsRuntimeValue) {
          var stats: ActionsRuntimeValue = null;
          function gains(
            this: ActionsRuntimeValue,
            buffer?: ActionsRuntimeValue,
            v?: ActionsRuntimeValue,
          ) {
            if (!stats || stats.buffer !== buffer) stats = rmsNormalizeStats(buffer);
            return rmsNormalizeGains(stats, v);
          }
          return {
            filter: function (
              this: ActionsRuntimeValue,
              audio_ctx?: ActionsRuntimeValue,
              destination?: ActionsRuntimeValue,
              source?: ActionsRuntimeValue,
              duration?: ActionsRuntimeValue,
              preview?: ActionsRuntimeValue,
            ) {
              var vals: ActionsRuntimeValue = gains(source.buffer, val);
              if (preview) return channelGainFilter(audio_ctx, destination, source, vals);
              applyBufferGains(source.buffer, vals);
              source.connect(destination);
              return source;
            },
            update: function (
              this: ActionsRuntimeValue,
              filter?: ActionsRuntimeValue,
              audio_ctx?: ActionsRuntimeValue,
              val?: ActionsRuntimeValue,
              source?: ActionsRuntimeValue,
            ) {
              setChannelGains(filter, audio_ctx, gains(source.buffer, val));
            },
          };
        },
        NormalizeLUFS: function (this: ActionsRuntimeValue, val?: ActionsRuntimeValue) {
          return {
            filter: function (
              this: ActionsRuntimeValue,
              audio_ctx?: ActionsRuntimeValue,
              destination?: ActionsRuntimeValue,
              source?: ActionsRuntimeValue,
              duration?: ActionsRuntimeValue,
              preview?: ActionsRuntimeValue,
            ) {
              var gain: ActionsRuntimeValue = lufsNormalizeGain(source, val);
              if (preview) return gainFilter(audio_ctx, destination, source, gain);
              for (var i: ActionsRuntimeValue = 0; i < source.buffer.numberOfChannels; ++i) {
                var chan_data: ActionsRuntimeValue = source.buffer.getChannelData(i);
                for (
                  var k: ActionsRuntimeValue = 0, len: ActionsRuntimeValue = chan_data.length;
                  k < len;
                  ++k
                ) {
                  chan_data[k] *= gain;
                }
              }
              source.connect(destination);
              return source;
            },
            update: function (
              this: ActionsRuntimeValue,
              filter?: ActionsRuntimeValue,
              audio_ctx?: ActionsRuntimeValue,
              val?: ActionsRuntimeValue,
              source?: ActionsRuntimeValue,
            ) {
              setChannelGains(filter, audio_ctx, [lufsNormalizeGain(source, val)]);
            },
          };
        },
        HardLimit: function (this: ActionsRuntimeValue, val?: ActionsRuntimeValue) {
          return {
            filter: function (
              this: ActionsRuntimeValue,
              audio_ctx?: ActionsRuntimeValue,
              destination?: ActionsRuntimeValue,
              source?: ActionsRuntimeValue,
              duration?: ActionsRuntimeValue,
            ) {
              var max_val: ActionsRuntimeValue = val[1] || 1.0;
              var ratio: ActionsRuntimeValue = val[2] || 0.0;
              var look_ahead: ActionsRuntimeValue = val[3] || 15; // ms
              var equally: ActionsRuntimeValue = false; //val[0];
              var max_peak: ActionsRuntimeValue = 0;
              var buffer: ActionsRuntimeValue = audio_ctx.createBuffer(
                source.buffer.numberOfChannels,
                source.buffer.length,
                source.buffer.sampleRate,
              );
              look_ahead = ((look_ahead * buffer.sampleRate) / 1000) >> 0;
              for (var i: ActionsRuntimeValue = 0; i < buffer.numberOfChannels; ++i) {
                var chan_data: ActionsRuntimeValue = buffer.getChannelData(i);
                chan_data.set(source.buffer.getChannelData(i));
                // iterating faster first time...
                for (
                  var b: ActionsRuntimeValue = 0, len: ActionsRuntimeValue = chan_data.length;
                  b < len;
                  ++b
                ) {
                  for (var k: ActionsRuntimeValue = 0; k < look_ahead; k = k + 10) {
                    var curr: ActionsRuntimeValue = Math.abs(chan_data[b + k]);
                    if (max_peak < curr) max_peak = curr;
                  }
                  var diff: ActionsRuntimeValue = max_val / max_peak;
                  if (!equally) {
                    for (var k: ActionsRuntimeValue = 0; k < look_ahead; ++k) {
                      var orig_val: ActionsRuntimeValue = chan_data[b + k];
                      var new_val: ActionsRuntimeValue = orig_val * diff;
                      var peak_diff: ActionsRuntimeValue = max_val - Math.abs(new_val);
                      peak_diff *= orig_val < 0 ? -ratio : ratio;
                      chan_data[b + k] = new_val + peak_diff;
                    }
                    b += look_ahead;
                    max_peak = 0;
                  }
                }
                // -----
              }
              // todo handle disconnected LEFT AND RIGHT
              var temp_source: ActionsRuntimeValue = audio_ctx.createBufferSource();
              temp_source.buffer = buffer;
              temp_source.loop = true;
              temp_source.start();
              temp_source.connect(destination);
              return temp_source;
            },
            update: function (
              this: ActionsRuntimeValue,
              filtered_source?: ActionsRuntimeValue,
              audio_ctx?: ActionsRuntimeValue,
              val?: ActionsRuntimeValue,
              source?: ActionsRuntimeValue,
              destination?: ActionsRuntimeValue,
            ) {
              // stop the existing onerror
              try {
                filtered_source.stop && filtered_source.stop();
              } catch (e: ActionsRuntimeValue) {}
              filtered_source.disconnect();
              filtered_source.buffer = null;
              filtered_source = null;
              var ff: ActionsRuntimeValue = this.FXBank.HardLimit(val);
              this.PreviewFilter = ff.filter(
                audio_ctx,
                destination || audio_destination,
                source,
                0,
              );
            },
          };
        },
        ParametricEQ: function (this: ActionsRuntimeValue, val?: ActionsRuntimeValue) {
          return {
            filter: function (
              this: ActionsRuntimeValue,
              audio_ctx?: ActionsRuntimeValue,
              destination?: ActionsRuntimeValue,
              source?: ActionsRuntimeValue,
              duration?: ActionsRuntimeValue,
            ) {
              var bands: ActionsRuntimeValue = [];
              var len: ActionsRuntimeValue = val.length;
              var makeEQ: ActionsRuntimeValue = function (
                this: ActionsRuntimeValue,
                band?: ActionsRuntimeValue,
              ) {
                var eq: ActionsRuntimeValue = audio_ctx.createBiquadFilter();
                if (band.length) {
                  for (var i: ActionsRuntimeValue = 0; i < band.length; ++i) {
                    eq.gain.linearRampToValueAtTime(
                      band[i].val,
                      audio_ctx.currentTime + band[i].time,
                    );
                  }
                  band = band[0];
                } else eq.gain.value = band.val;
                eq.type = band.type;
                eq.Q.value = band.q || 1.0;
                eq.frequency.value = band.freq;
                return eq;
              };
              if (!val[0]) {
                val[0] = {
                  type: 'peaking',
                  val: 0,
                  q: 1,
                  freq: 500,
                };
              }
              var eq: ActionsRuntimeValue = makeEQ(val[0]);
              bands.push(eq);
              source.connect(eq);
              if (val.length === 1) {
                eq.connect(destination);
                return bands;
              }
              for (var i: ActionsRuntimeValue = 1; i < len - 1; ++i) {
                eq = makeEQ(val[i]);
                bands[i - 1].connect(eq);
                bands.push(eq);
              }
              eq = makeEQ(val[len - 1]);
              bands[bands.length - 1].connect(eq);
              bands.push(eq);
              eq.connect(destination);
              return bands;
            },
            update: function (
              this: ActionsRuntimeValue,
              bands?: ActionsRuntimeValue,
              audio_ctx?: ActionsRuntimeValue,
              val?: ActionsRuntimeValue,
              source?: ActionsRuntimeValue,
            ) {
              if (bands.length !== val.length) {
                var makeEQ: ActionsRuntimeValue = function (
                  this: ActionsRuntimeValue,
                  band?: ActionsRuntimeValue,
                ) {
                  var eq: ActionsRuntimeValue = audio_ctx.createBiquadFilter();
                  return eq;
                };
                if (bands.length < val.length) {
                  var l: ActionsRuntimeValue = val.length - bands.length;
                  while (l-- > 0) {
                    var eq: ActionsRuntimeValue = makeEQ();
                    var connect_to: ActionsRuntimeValue = bands[0];
                    bands.unshift(eq);
                    eq.connect(connect_to);
                  }
                  source.disconnect();
                  source.connect(bands[0]);
                } else {
                  if (val.length > 0) {
                    var l: ActionsRuntimeValue = bands.length - val.length;
                    source.disconnect();
                    for (var i: ActionsRuntimeValue = 0; i < l; ++i) {
                      var eq: ActionsRuntimeValue = bands.shift();
                      eq.disconnect();
                    }
                    source.connect(bands[0]);
                  } else {
                    val[0] = {
                      type: 'peaking',
                      val: 0,
                      q: 1,
                      freq: 500,
                    };
                  }
                }
              }
              var len: ActionsRuntimeValue = val.length;
              for (var i: ActionsRuntimeValue = 0; i < len; ++i) {
                var eq: ActionsRuntimeValue = bands[i];
                eq.type = val[i].type;
                eq.gain.value = val[i].val;
                eq.Q.value = val[i].q || 1.0;
                eq.frequency.value = val[i].freq;
              }
              // -
            },
          };
        },
        Rate: function (this: ActionsRuntimeValue, val?: ActionsRuntimeValue) {
          var prev_val: ActionsRuntimeValue = val;
          var temp_source: ActionsRuntimeValue = [];
          var on: ActionsRuntimeValue = true;
          var ctx: ActionsRuntimeValue = null;
          var chain: ActionsRuntimeValue = null;
          var api: ActionsRuntimeValue = null;
          var off: ActionsRuntimeValue = 0;
          var stamp: ActionsRuntimeValue = 0;
          var tm: ActionsRuntimeValue = 0;
          function clr(this: ActionsRuntimeValue) {
            clearTimeout(tm);
            for (var i: ActionsRuntimeValue = 0; i < temp_source.length; ++i) {
              try {
                temp_source[i].stop();
              } catch (e: ActionsRuntimeValue) {}
              try {
                temp_source[i].disconnect();
              } catch (e: ActionsRuntimeValue) {}
            }
            temp_source = [];
          }
          function arm(
            this: ActionsRuntimeValue,
            audio_ctx?: ActionsRuntimeValue,
            source?: ActionsRuntimeValue,
            delay?: ActionsRuntimeValue,
          ) {
            clearTimeout(tm);
            tm = setTimeout(
              function (this: ActionsRuntimeValue) {
                on && api.update(chain, audio_ctx, 1 / prev_val, source);
              },
              Math.max(120, (delay - 0.08) * 1000),
            );
          }
          function cur(
            this: ActionsRuntimeValue,
            audio_ctx?: ActionsRuntimeValue,
            source?: ActionsRuntimeValue,
          ) {
            var now: ActionsRuntimeValue = audio_ctx.currentTime;
            var dur: ActionsRuntimeValue = source.buffer.duration || 1;
            if (stamp) off = (off + (now - stamp) / (prev_val || 1)) % dur;
            stamp = now;
            return off;
          }
          api = {
            filter: function (
              this: ActionsRuntimeValue,
              audio_ctx?: ActionsRuntimeValue,
              destination?: ActionsRuntimeValue,
              source?: ActionsRuntimeValue,
              duration?: ActionsRuntimeValue,
            ) {
              var fx_buffer: ActionsRuntimeValue = source.buffer;
              var stretch_ratio: ActionsRuntimeValue = val;
              let grainDuration: ActionsRuntimeValue = 0.05; // 50 ms grain
              const analysisHop: ActionsRuntimeValue = 0.025; // 25 ms step (50% overlap)
              const desiredOverlap: ActionsRuntimeValue = 0.5; // 50% overlap
              const synthesisHop: ActionsRuntimeValue = analysisHop * stretch_ratio; //  output hop
              if (stretch_ratio > 1) {
                grainDuration = synthesisHop / (1 - desiredOverlap); // 0.15 sec (150 ms
              }
              var offlineCtx: ActionsRuntimeValue = audio_ctx;
              const now: ActionsRuntimeValue = audio_ctx.currentTime;
              off = source._pkSeek || 0;
              stamp = now;
              // var filter = fx.filter ( offlineCtx, offlineCtx.destination, null, duration );
              var applyHannWindowFast: ActionsRuntimeValue = function (
                this: ActionsRuntimeValue,
                gainNode?: ActionsRuntimeValue,
                outputTime?: ActionsRuntimeValue,
                grainDuration?: ActionsRuntimeValue,
              ) {
                // The automation curve using a Hann window shape
                const numSteps: ActionsRuntimeValue = 50;
                for (let i: ActionsRuntimeValue = 0; i <= numSteps; i++) {
                  const t: ActionsRuntimeValue = (i / numSteps) * grainDuration;
                  const windowValue: ActionsRuntimeValue =
                    0.5 * (1 - Math.cos((2 * Math.PI * t) / grainDuration));
                  gainNode.gain.linearRampToValueAtTime(windowValue, outputTime + t);
                }
              };
              // Schedule grains
              var grainIndex: ActionsRuntimeValue = 0;
              var filter_chain: ActionsRuntimeValue = [];
              ctx = audio_ctx;
              chain = filter_chain;
              for (
                let t: ActionsRuntimeValue = off,
                  end: ActionsRuntimeValue = off + fx_buffer.duration;
                t < end;
                t += analysisHop
              ) {
                let offset: ActionsRuntimeValue = t % fx_buffer.duration;
                const outputTime: ActionsRuntimeValue = grainIndex * synthesisHop;
                if (offset + grainDuration > fx_buffer.duration) offset = 0;
                const grainSource: ActionsRuntimeValue = offlineCtx.createBufferSource();
                grainSource.buffer = fx_buffer;
                const grainGain: ActionsRuntimeValue = offlineCtx.createGain();
                grainSource.connect(grainGain);
                grainGain.connect(destination || offlineCtx.destination);
                applyHannWindowFast(grainGain, now + outputTime, grainDuration);
                grainSource.start(now + outputTime, offset, grainDuration);
                filter_chain.push(grainGain);
                temp_source[grainIndex] = grainSource;
                ++grainIndex;
              }
              if (filter_chain[0]) filter_chain[0]._pk_own = 1;
              arm(audio_ctx, source, grainIndex * synthesisHop);
              return filter_chain;
            },
            destroy: function (this: ActionsRuntimeValue) {
              clr();
            },
            preview: function (
              this: ActionsRuntimeValue,
              state?: ActionsRuntimeValue,
              source?: ActionsRuntimeValue,
            ) {
              on = !!state;
              if (!on) return clr();
              if (ctx && source.buffer) {
                off =
                  ((source._pkSeek || 0) + ctx.currentTime - (source._pkStart || ctx.currentTime)) %
                  (source.buffer.duration || 1);
                stamp = ctx.currentTime;
              }
              api.update(chain, ctx || source.context, 1 / prev_val, source);
            },
            update: function (
              this: ActionsRuntimeValue,
              filter_chain?: ActionsRuntimeValue,
              audio_ctx?: ActionsRuntimeValue,
              val?: ActionsRuntimeValue,
              source?: ActionsRuntimeValue,
            ) {
              clr();
              if (!on || !filter_chain) {
                prev_val = 1 / val;
                return;
              }
              var t: ActionsRuntimeValue = cur(audio_ctx, source);
              prev_val = 1 / val;
              var fx_buffer: ActionsRuntimeValue = source.buffer;
              let grainDuration: ActionsRuntimeValue = 0.05; // 50 ms grain
              const analysisHop: ActionsRuntimeValue = 0.025; // 25 ms step (50% overlap)
              const desiredOverlap: ActionsRuntimeValue = 0.5; // 50% overlap
              const synthesisHop: ActionsRuntimeValue = analysisHop * prev_val; //  output hop
              if (prev_val > 1) {
                grainDuration = synthesisHop / (1 - desiredOverlap); // 0.15 sec (150 ms
              }
              const now: ActionsRuntimeValue = audio_ctx.currentTime;
              // var filter = fx.filter ( offlineCtx, offlineCtx.destination, null, duration );
              var applyHannWindowFast: ActionsRuntimeValue = function (
                this: ActionsRuntimeValue,
                gainNode?: ActionsRuntimeValue,
                outputTime?: ActionsRuntimeValue,
                grainDuration?: ActionsRuntimeValue,
              ) {
                // The automation curve using a Hann window shape
                const numSteps: ActionsRuntimeValue = 50;
                for (let i: ActionsRuntimeValue = 0; i <= numSteps; i++) {
                  const t: ActionsRuntimeValue = (i / numSteps) * grainDuration;
                  const windowValue: ActionsRuntimeValue =
                    0.5 * (1 - Math.cos((2 * Math.PI * t) / grainDuration));
                  gainNode.gain.linearRampToValueAtTime(windowValue, outputTime + t);
                }
              };
              // Schedule grains
              var l: ActionsRuntimeValue = filter_chain.length;
              for (var i: ActionsRuntimeValue = 0; i < l; ++i) {
                if (t + grainDuration > fx_buffer.duration) t = 0;
                const offset: ActionsRuntimeValue = t;
                const outputTime: ActionsRuntimeValue = i * synthesisHop;
                //if (offset + grainDuration > fx_buffer.duration) break;
                const grainGain: ActionsRuntimeValue = filter_chain[i];
                let grainSource: ActionsRuntimeValue = audio_ctx.createBufferSource();
                grainGain.gain.setValueAtTime(grainGain.gain.value, now);
                grainGain.gain.cancelScheduledValues(now);
                grainSource.buffer = fx_buffer;
                grainSource.connect(grainGain);
                temp_source[i] = grainSource;
                applyHannWindowFast(grainGain, outputTime + now, grainDuration);
                grainSource.start(now + outputTime, offset, grainDuration);
                t += analysisHop;
              }
              arm(audio_ctx, source, l * synthesisHop);
              // --
            },
          };
          return api;
        },
        Speed: function (this: ActionsRuntimeValue, val?: ActionsRuntimeValue) {
          var ctx: ActionsRuntimeValue = null;
          var curr_val: ActionsRuntimeValue = val;
          var on: ActionsRuntimeValue = true;
          return {
            duration: function (this: ActionsRuntimeValue, duration?: ActionsRuntimeValue) {
              return rateDuration(curr_val, duration);
            },
            filter: function (
              this: ActionsRuntimeValue,
              audio_ctx?: ActionsRuntimeValue,
              destination?: ActionsRuntimeValue,
              source?: ActionsRuntimeValue,
              duration?: ActionsRuntimeValue,
              preview?: ActionsRuntimeValue,
              seek?: ActionsRuntimeValue,
            ) {
              ctx = audio_ctx;
              var inputNode: ActionsRuntimeValue = audio_ctx.createGain();
              setRate(source.playbackRate, audio_ctx, curr_val, duration, seek || source._pkSeek);
              source.connect(inputNode);
              // line in to dry mix
              inputNode.connect(destination);
              var filter_chain: ActionsRuntimeValue = [inputNode];
              return filter_chain;
            },
            preview: function (
              this: ActionsRuntimeValue,
              state?: ActionsRuntimeValue,
              source?: ActionsRuntimeValue,
            ) {
              on = !!state;
              setRate(
                source.playbackRate,
                ctx || source.context || audio_ctx,
                state ? curr_val : 1.0,
                source.buffer ? source.buffer.duration : 1,
                source._pkSeek,
              );
            },
            update: function (
              this: ActionsRuntimeValue,
              filter_chain?: ActionsRuntimeValue,
              audio_ctx?: ActionsRuntimeValue,
              val?: ActionsRuntimeValue,
              source?: ActionsRuntimeValue,
            ) {
              curr_val = val;
              setRate(
                source.playbackRate,
                audio_ctx,
                on ? curr_val : 1.0,
                source.buffer ? source.buffer.duration : 1,
                source._pkSeek,
              );
            },
          };
        },
        Delay: function (this: ActionsRuntimeValue, val?: ActionsRuntimeValue) {
          return {
            filter: function (
              this: ActionsRuntimeValue,
              audio_ctx?: ActionsRuntimeValue,
              destination?: ActionsRuntimeValue,
              source?: ActionsRuntimeValue,
              duration?: ActionsRuntimeValue,
            ) {
              var inputNode: ActionsRuntimeValue = audio_ctx.createGain();
              var outputNode: ActionsRuntimeValue = audio_ctx.createGain();
              var dryGainNode: ActionsRuntimeValue = audio_ctx.createGain();
              var wetGainNode: ActionsRuntimeValue = audio_ctx.createGain();
              var feedbackGainNode: ActionsRuntimeValue = audio_ctx.createGain();
              var delayNode: ActionsRuntimeValue = audio_ctx.createDelay();
              source.connect(inputNode);
              // line in to dry mix
              inputNode.connect(dryGainNode);
              // dry line out
              dryGainNode.connect(outputNode);
              // feedback loop
              delayNode.connect(feedbackGainNode);
              feedbackGainNode.connect(delayNode);
              // line in to wet mix
              inputNode.connect(delayNode);
              // wet out
              delayNode.connect(wetGainNode);
              // wet line out
              wetGainNode.connect(outputNode);
              outputNode.connect(destination);
              var filter_chain: ActionsRuntimeValue = [
                inputNode,
                outputNode,
                dryGainNode,
                wetGainNode,
                feedbackGainNode,
                delayNode,
              ];
              if (!val.delay.length) delayNode.delayTime.value = val.delay.val;
              else {
                for (var i: ActionsRuntimeValue = 0; i < val.delay.length; ++i) {
                  delayNode.delayTime.linearRampToValueAtTime(
                    val.delay[i].val,
                    val.delay[i].time + audio_ctx.currentTime,
                  );
                }
              }
              if (!val.feedback.length) feedbackGainNode.gain.value = val.feedback.val;
              else {
                for (var i: ActionsRuntimeValue = 0; i < val.feedback.length; ++i) {
                  feedbackGainNode.gain.linearRampToValueAtTime(
                    val.feedback[i].val,
                    val.feedback[i].time + audio_ctx.currentTime,
                  );
                }
              }
              if (!val.mix.length) {
                dryGainNode.gain.value = 1 - (val.mix.val - 0.5) * 2;
                wetGainNode.gain.value = 1 - (0.5 - val.mix.val) * 2;
              } else {
                for (var i: ActionsRuntimeValue = 0; i < val.mix.length; ++i) {
                  dryGainNode.gain.linearRampToValueAtTime(
                    1 - (val.mix[i].val - 0.5) * 2,
                    val.mix[i].time + audio_ctx.currentTime,
                  );
                  wetGainNode.gain.linearRampToValueAtTime(
                    1 - (0.5 - val.mix[i].val) * 2,
                    val.mix[i].time + audio_ctx.currentTime,
                  );
                }
              }
              return filter_chain;
            },
            update: function (
              this: ActionsRuntimeValue,
              filter_chain?: ActionsRuntimeValue,
              audio_ctx?: ActionsRuntimeValue,
              val?: ActionsRuntimeValue,
            ) {
              // update filter chain...
              var inputNode: ActionsRuntimeValue = filter_chain[0];
              var outputNode: ActionsRuntimeValue = filter_chain[1];
              var dryGainNode: ActionsRuntimeValue = filter_chain[2];
              var wetGainNode: ActionsRuntimeValue = filter_chain[3];
              var feedbackGainNode: ActionsRuntimeValue = filter_chain[4];
              var delayNode: ActionsRuntimeValue = filter_chain[5];
              if (!val.delay.length) delayNode.delayTime.value = val.delay.val;
              else {
                for (var i: ActionsRuntimeValue = 0; i < val.delay.length; ++i) {
                  delayNode.delayTime.linearRampToValueAtTime(
                    val.delay[i].val,
                    val.delay[i].time + audio_ctx.currentTime,
                  );
                }
              }
              if (!val.feedback.length) feedbackGainNode.gain.value = val.feedback.val;
              else {
                for (var i: ActionsRuntimeValue = 0; i < val.feedback.length; ++i) {
                  feedbackGainNode.gain.linearRampToValueAtTime(
                    val.feedback[i].val,
                    val.feedback[i].time + audio_ctx.currentTime,
                  );
                }
              }
              if (!val.mix.length) {
                dryGainNode.gain.value = 1 - (val.mix.val - 0.5) * 2;
                wetGainNode.gain.value = 1 - (0.5 - val.mix.val) * 2;
              } else {
                for (var i: ActionsRuntimeValue = 0; i < val.mix.length; ++i) {
                  dryGainNode.gain.linearRampToValueAtTime(
                    1 - (val.mix[i].val - 0.5) * 2,
                    val.mix[i].time + audio_ctx.currentTime,
                  );
                  wetGainNode.gain.linearRampToValueAtTime(
                    1 - (0.5 - val.mix[i].val) * 2,
                    val.mix[i].time + audio_ctx.currentTime,
                  );
                }
              }
              // ---
            },
          };
        },
        Distortion: function (this: ActionsRuntimeValue, val?: ActionsRuntimeValue) {
          return {
            filter: function (
              this: ActionsRuntimeValue,
              audio_ctx?: ActionsRuntimeValue,
              destination?: ActionsRuntimeValue,
              source?: ActionsRuntimeValue,
              duration?: ActionsRuntimeValue,
            ) {
              var wave_shaper: ActionsRuntimeValue = audio_ctx.createWaveShaper();
              // var gain = parseInt (0.5 * 100, 10);
              var compute_dist: ActionsRuntimeValue = function (
                this: ActionsRuntimeValue,
                val?: ActionsRuntimeValue,
              ) {
                var gain: ActionsRuntimeValue = parseInt(String((val / 1) * 100), 10);
                var n_samples: ActionsRuntimeValue = 44100;
                var curve: ActionsRuntimeValue = new Float32Array(n_samples);
                var deg: ActionsRuntimeValue = Math.PI / 180;
                var x: ActionsRuntimeValue;
                for (var i: ActionsRuntimeValue = 0; i < n_samples; ++i) {
                  x = (i * 2) / n_samples - 1;
                  curve[i] = ((3 + gain) * x * 20 * deg) / (Math.PI + gain * Math.abs(x));
                }
                return curve;
              };
              for (var k: ActionsRuntimeValue = 0; k < val.length; ++k) {
                var curr: ActionsRuntimeValue = val[k];
                if (curr.length) {
                  for (var i: ActionsRuntimeValue = 0; i < curr.length; ++i) {
                    wave_shaper.curve.linearRampToValueAtTime(
                      compute_dist(curr[i].val),
                      audio_ctx.currentTime + curr[i].time,
                    );
                  }
                } else {
                  wave_shaper.curve = compute_dist(curr.val);
                }
              }
              source.connect(wave_shaper);
              wave_shaper.connect(destination);
              return wave_shaper;
            },
            update: function (
              this: ActionsRuntimeValue,
              filter?: ActionsRuntimeValue,
              audio_ctx?: ActionsRuntimeValue,
              val?: ActionsRuntimeValue,
            ) {
              var compute_dist: ActionsRuntimeValue = function (
                this: ActionsRuntimeValue,
                val?: ActionsRuntimeValue,
              ) {
                var gain: ActionsRuntimeValue = parseInt(String((val / 1) * 100), 10);
                var n_samples: ActionsRuntimeValue = 44100;
                var curve: ActionsRuntimeValue = new Float32Array(n_samples);
                var deg: ActionsRuntimeValue = Math.PI / 180;
                var x: ActionsRuntimeValue;
                for (var i: ActionsRuntimeValue = 0; i < n_samples; ++i) {
                  x = (i * 2) / n_samples - 1;
                  curve[i] = ((3 + gain) * x * 20 * deg) / (Math.PI + gain * Math.abs(x));
                }
                return curve;
              };
              for (var k: ActionsRuntimeValue = 0; k < val.length; ++k) {
                var curr: ActionsRuntimeValue = val[k];
                if (curr.length) {
                  for (var i: ActionsRuntimeValue = 0; i < curr.length; ++i) {
                    filter.curve.linearRampToValueAtTime(
                      compute_dist(curr[i].val),
                      audio_ctx.currentTime + curr[i].time,
                    );
                  }
                } else {
                  filter.curve = compute_dist(curr.val);
                }
              }
              // ----
            },
          };
        },
        HumNotch: function (this: ActionsRuntimeValue, val?: ActionsRuntimeValue) {
          return {
            filter: function (
              this: ActionsRuntimeValue,
              audio_ctx?: ActionsRuntimeValue,
              destination?: ActionsRuntimeValue,
              source?: ActionsRuntimeValue,
              duration?: ActionsRuntimeValue,
            ) {
              var freq: ActionsRuntimeValue = val.freq;
              var harmonics: ActionsRuntimeValue = val.harmonics || 4;
              var q_val: ActionsRuntimeValue = val.q || 30;
              var prev: ActionsRuntimeValue = source;
              var last: ActionsRuntimeValue = null;
              var chain: ActionsRuntimeValue = [];
              for (var h: ActionsRuntimeValue = 1; h <= harmonics; ++h) {
                var f: ActionsRuntimeValue = freq * h;
                if (f >= audio_ctx.sampleRate * 0.5) break;
                var n: ActionsRuntimeValue = audio_ctx.createBiquadFilter();
                n.type = 'notch';
                n.frequency.value = f;
                n.Q.value = q_val;
                prev.connect(n);
                prev = n;
                last = n;
                chain.push(n);
              }
              if (last) last.connect(destination);
              else source.connect(destination);
              return chain;
            },
          };
        },
        Reverb: function (this: ActionsRuntimeValue, val?: ActionsRuntimeValue) {
          return {
            filter: function (
              this: ActionsRuntimeValue,
              audio_ctx?: ActionsRuntimeValue,
              destination?: ActionsRuntimeValue,
              source?: ActionsRuntimeValue,
              duration?: ActionsRuntimeValue,
            ) {
              // ----
              var inputNode: ActionsRuntimeValue = audio_ctx.createGain();
              var reverbNode: ActionsRuntimeValue = audio_ctx.createConvolver();
              var outputNode: ActionsRuntimeValue = audio_ctx.createGain();
              var wetGainNode: ActionsRuntimeValue = audio_ctx.createGain();
              var dryGainNode: ActionsRuntimeValue = audio_ctx.createGain();
              source.connect(inputNode);
              inputNode.connect(reverbNode);
              reverbNode.connect(wetGainNode);
              inputNode.connect(dryGainNode);
              dryGainNode.connect(outputNode);
              wetGainNode.connect(outputNode);
              outputNode.connect(destination);
              var filter_chain: ActionsRuntimeValue = [
                inputNode,
                outputNode,
                reverbNode,
                dryGainNode,
                wetGainNode,
              ];
              // set defaults
              dryGainNode.gain.value = 1 - (val.mix - 0.5) * 2;
              wetGainNode.gain.value = 1 - (0.5 - val.mix) * 2;
              var length: ActionsRuntimeValue = audio_ctx.sampleRate * val.time;
              var impulse: ActionsRuntimeValue = audio_ctx.createBuffer(
                2,
                length,
                audio_ctx.sampleRate,
              );
              var impulseL: ActionsRuntimeValue = impulse.getChannelData(0);
              var impulseR: ActionsRuntimeValue = impulse.getChannelData(1);
              var n: ActionsRuntimeValue, i: ActionsRuntimeValue;
              for (i = 0; i < length; i++) {
                n = val.reverse ? length - i : i;
                impulseL[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, val.decay);
                impulseR[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, val.decay);
              }
              reverbNode.buffer = impulse;
              return filter_chain;
            },
            update: function (
              this: ActionsRuntimeValue,
              filter_chain?: ActionsRuntimeValue,
              audio_ctx?: ActionsRuntimeValue,
              val?: ActionsRuntimeValue,
            ) {
              audio_ctx = wavesurfer.backend.ac;
              var reverbNode: ActionsRuntimeValue = filter_chain[2];
              var dryGainNode: ActionsRuntimeValue = filter_chain[3];
              var wetGainNode: ActionsRuntimeValue = filter_chain[4];
              dryGainNode.gain.value = 1 - (val.mix - 0.5) * 2;
              wetGainNode.gain.value = 1 - (0.5 - val.mix) * 2;
              var length: ActionsRuntimeValue = audio_ctx.sampleRate * val.time;
              var impulse: ActionsRuntimeValue = audio_ctx.createBuffer(
                2,
                length,
                audio_ctx.sampleRate,
              );
              var impulseL: ActionsRuntimeValue = impulse.getChannelData(0);
              var impulseR: ActionsRuntimeValue = impulse.getChannelData(1);
              var n: ActionsRuntimeValue, i: ActionsRuntimeValue;
              for (i = 0; i < length; i++) {
                n = val.reverse ? length - i : i;
                impulseL[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, val.decay);
                impulseR[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, val.decay);
              }
              reverbNode.buffer = impulse;
            },
          };
        },
      };
      this.FXPreviewUpdate = updatePreview;
      this.FXPreviewStop = stopPreview;
      this.FXPreviewToggle = togglePreview;
      this.FXPreviewInit = initPreview;
      this.FXPreviewBuffer = previewBuffer;
      this.FXPreview = previewEffect;
      this.FX = applyEffect;
      this.FXBank = FXBank;
      this.SeamlessLoop = seamlessLoop;
      this.Loudness = AnalyzeLoudness;
      this.Trim = TrimBuffer;
      this.Copy = CopyBufferSegment;
      this.Insert = InsertSegmentToBuffer;
      this.InsertFloatArrays = InsertFloatArrays;
      this.ReplaceFloatArrays = ReplaceFloatArrays;
      this.Replace = OverwriteBufferWithSegment;
      this.FullReplace = OverwriteBuffer;
      this.MakeSilence = MakeSilenceBuffer;
      this.DownloadFile = DownloadFile;
      this.DownloadFileCancel = DownloadFileCancel;
      // this.ComputeTopFrequencies = findTopFrequencies;
      // this.MatchTopFrequencies= killdTopFrequencies;
      // ---
    }
    PKAE._deps.audioutils = AudioUtils;
  })(PKAudioEditor);
})();
