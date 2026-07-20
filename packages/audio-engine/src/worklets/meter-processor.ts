interface MeterReading {
  frame: number;
  peak: number;
  rms: number;
}

class AudioMassMeterProcessor extends AudioWorkletProcessor {
  private readonly reportIntervalFrames = Math.max(128, Math.round(sampleRate / 30));
  private nextReportFrame = 0;

  override process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    const input = inputs[0] ?? [];
    const output = outputs[0] ?? [];
    let peak = 0;
    let sumSquares = 0;
    let sampleCount = 0;

    for (let channelIndex = 0; channelIndex < input.length; channelIndex += 1) {
      const source = input[channelIndex];
      const target = output[channelIndex];
      if (!source) continue;
      if (target) target.set(source);
      for (const sample of source) {
        peak = Math.max(peak, Math.abs(sample));
        sumSquares += sample * sample;
        sampleCount += 1;
      }
    }

    if (currentFrame >= this.nextReportFrame) {
      const reading: MeterReading = {
        frame: currentFrame,
        peak,
        rms: sampleCount === 0 ? 0 : Math.sqrt(sumSquares / sampleCount),
      };
      this.port.postMessage(reading);
      this.nextReportFrame = currentFrame + this.reportIntervalFrames;
    }
    return true;
  }
}

registerProcessor('audiomass-meter', AudioMassMeterProcessor);

export {};
