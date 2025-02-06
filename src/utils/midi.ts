export const getMIDIFrequency = (midiNumber: number): number => {
    return 440 * Math.pow(2, (midiNumber - 69) / 12);
  };