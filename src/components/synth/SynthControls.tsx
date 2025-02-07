// src/components/synth/SynthControls.tsx
import React, { useCallback, useMemo, memo } from 'react';
import { TerminalSelect } from '@/components/ui/TerminalSelect';
import type { SynthSettings } from '@/types/synth';
import { debounce } from 'lodash';

interface SynthControlsProps {
  settings: SynthSettings;
  onUpdateSettings: (settings: Partial<SynthSettings>) => void;
}

// A memoized slider for continuous parameters.
const ParameterSlider = memo(({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) => (
  <div className="space-y-1">
    <label className="text-xs text-terminal-green/70 capitalize">{label}</label>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="terminal-slider"
    />
    <div className="text-xs text-terminal-green/60">
      {value.toFixed(step >= 1 ? 0 : 2)}
    </div>
  </div>
));
ParameterSlider.displayName = 'ParameterSlider';

// A memoized toggle with a slider to control effect wetness.
const EffectToggle = memo(({
  label,
  enabled,
  wetValue,
  onToggle,
  onWetChange,
}: {
  label: string;
  enabled: boolean;
  wetValue: number;
  onToggle: () => void;
  onWetChange: (value: number) => void;
}) => (
  <div className="flex items-center gap-2">
    <button
      className={`terminal-button ${enabled ? 'bg-terminal-green-dark' : ''}`}
      onClick={onToggle}
    >
      {label}
    </button>
    {enabled && (
      <div className="flex-1 space-y-1">
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={wetValue}
          onChange={(e) => onWetChange(parseFloat(e.target.value))}
          className="terminal-slider w-full"
        />
        <div className="text-xs text-terminal-green/60 text-right">
          {(wetValue * 100).toFixed(0)}%
        </div>
      </div>
    )}
  </div>
));
EffectToggle.displayName = 'EffectToggle';

export function SynthControls({ settings, onUpdateSettings }: SynthControlsProps) {
  // Waveform selection options.
  const waveformOptions = useMemo(() => [
    { value: 'sine', label: 'Sine' },
    { value: 'square', label: 'Square' },
    { value: 'sawtooth', label: 'Sawtooth' },
    { value: 'triangle', label: 'Triangle' },
    { value: 'square8', label: 'Square 8' },
    { value: 'sawtooth8', label: 'Sawtooth 8' },
    { value: 'triangle8', label: 'Triangle 8' },
  ], []);

  // Filter type options.
  const filterTypes = useMemo(() => [
    { value: 'lowpass', label: 'Low Pass' },
    { value: 'highpass', label: 'High Pass' },
    { value: 'bandpass', label: 'Band Pass' },
  ], []);

  // LFO target options.
  const lfoTargets = useMemo(() => [
    { value: 'filter', label: 'Filter' },
    { value: 'pitch', label: 'Pitch' },
    { value: 'volume', label: 'Volume' },
  ], []);

  // New modulation options for oscillator synthesis.
  const modulationOptions = useMemo(() => [
    { value: 'none', label: 'None' },
    { value: 'FM', label: 'FM Synthesis' },
    { value: 'AM', label: 'AM Synthesis' },
  ], []);

  // Debounced update handlers for smooth parameter changes.
  const updateEnvelopeParameter = useCallback(
    debounce((param: string, value: number) => {
      onUpdateSettings({
        envelope: { ...settings.envelope, [param]: value },
      });
    }, 50),
    [settings.envelope, onUpdateSettings]
  );

  const updateFilterParameter = useCallback(
    debounce((param: string, value: number) => {
      onUpdateSettings({
        filter: { ...settings.filter, [param]: value },
      });
    }, 50),
    [settings.filter, onUpdateSettings]
  );

  const updateLfoParameter = useCallback(
    debounce((param: string, value: number) => {
      onUpdateSettings({
        lfo: { ...settings.lfo, [param]: value },
      });
    }, 50),
    [settings.lfo, onUpdateSettings]
  );

  // New debounced update for oscillator modulation parameters.
  const updateOscillatorModulationParameter = useCallback(
    debounce((param: string, value: number) => {
      const currentMod = settings.oscillator.modulation || { type: 'none', amount: 0 };
      onUpdateSettings({
        oscillator: { 
          ...settings.oscillator, 
          modulation: { ...currentMod, [param]: value } 
        },
      });
    }, 50),
    [settings.oscillator, onUpdateSettings]
  );

  // Effect update handler.
  const updateEffect = useCallback(
    (effectName: 'reverb' | 'delay' | 'distortion', changes: Partial<{ enabled: boolean; wet: number }>) => {
      onUpdateSettings({
        effects: {
          ...settings.effects,
          [effectName]: {
            ...settings.effects[effectName],
            ...changes,
          },
        },
      });
    },
    [settings.effects, onUpdateSettings]
  );

  // Get current oscillator modulation; default to 'none' if not set.
  const currentModulation = settings.oscillator.modulation || { type: 'none', amount: 0 };

  return (
    <div className="space-y-6">
      {/* Oscillator & Envelope Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <h3 className="text-terminal-green font-bold">Oscillator</h3>
          <TerminalSelect
            value={settings.oscillator.type}
            onValueChange={(value) =>
              onUpdateSettings({
                oscillator: { ...settings.oscillator, type: value as any },
              })
            }
            options={waveformOptions}
            placeholder="Waveform"
          />
          <ParameterSlider
            label="Detune"
            value={settings.oscillator.detune}
            min={-100}
            max={100}
            step={1}
            onChange={(value) =>
              onUpdateSettings({
                oscillator: { ...settings.oscillator, detune: value },
              })
            }
          />
          {/* New: Oscillator Modulation Controls */}
          <TerminalSelect
            value={currentModulation.type}
            onValueChange={(value: any) =>
              onUpdateSettings({
                oscillator: {
                  ...settings.oscillator,
                  modulation: { type: value, amount: currentModulation.amount },
                },
              })
            }
            options={modulationOptions}
            placeholder="Modulation Type"
          />
          {currentModulation.type !== 'none' && (
            <ParameterSlider
              label="Modulation Amount"
              value={currentModulation.amount}
              min={0}
              max={10}
              step={0.1}
              onChange={(value) =>
                updateOscillatorModulationParameter('amount', value)
              }
            />
          )}
        </div>
        <div className="space-y-2">
          <h3 className="text-terminal-green font-bold">Envelope</h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(settings.envelope).map(([param, value]) => {
              let max = 1;
              let step = 0.01;
              if (param === 'attack' || param === 'release') {
                max = 5;
                step = 0.05;
              } else if (param === 'decay') {
                max = 5;
                step = 0.05;
              }
              return (
                <ParameterSlider
                  key={param}
                  label={param}
                  value={value as number}
                  min={0}
                  max={max}
                  step={step}
                  onChange={(value) => updateEnvelopeParameter(param, value)}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="space-y-2">
        <h3 className="text-terminal-green font-bold">Filter</h3>
        <TerminalSelect
          value={settings.filter.type}
          onValueChange={(value) =>
            onUpdateSettings({
              filter: { ...settings.filter, type: value as any },
            })
          }
          options={filterTypes}
          placeholder="Filter Type"
        />
        <ParameterSlider
          label="Frequency"
          value={settings.filter.frequency}
          min={20}
          max={20000}
          step={1}
          onChange={(value) => updateFilterParameter('frequency', value)}
        />
        <ParameterSlider
          label="Resonance (Q)"
          value={settings.filter.Q}
          min={0}
          max={10}
          step={0.1}
          onChange={(value) => updateFilterParameter('Q', value)}
        />
      </div>

      {/* LFO Section */}
      <div className="space-y-2">
        <h3 className="text-terminal-green font-bold">LFO</h3>
        <TerminalSelect
          value={settings.lfo.target}
          onValueChange={(value: any) =>
            onUpdateSettings({ lfo: { ...settings.lfo, target: value } })
          }
          options={lfoTargets}
          placeholder="LFO Target"
        />
        <ParameterSlider
          label="LFO Rate"
          value={settings.lfo.frequency}
          min={0.1}
          max={20}
          step={0.1}
          onChange={(value) => updateLfoParameter('frequency', value)}
        />
        <ParameterSlider
          label="LFO Depth"
          value={settings.lfo.depth}
          min={0}
          max={1}
          step={0.01}
          onChange={(value) => updateLfoParameter('depth', value)}
        />
      </div>

      {/* Effects Section */}
      <div className="space-y-2">
        <h3 className="text-terminal-green font-bold">Effects</h3>
        <div className="space-y-2">
          <EffectToggle
            label="Reverb"
            enabled={settings.effects.reverb.enabled}
            wetValue={settings.effects.reverb.wet}
            onToggle={() => updateEffect('reverb', { enabled: !settings.effects.reverb.enabled })}
            onWetChange={(value) => updateEffect('reverb', { wet: value })}
          />
          <EffectToggle
            label="Delay"
            enabled={settings.effects.delay.enabled}
            wetValue={settings.effects.delay.wet}
            onToggle={() => updateEffect('delay', { enabled: !settings.effects.delay.enabled })}
            onWetChange={(value) => updateEffect('delay', { wet: value })}
          />
          <EffectToggle
            label="Distortion"
            enabled={settings.effects.distortion.enabled}
            wetValue={settings.effects.distortion.wet}
            onToggle={() => updateEffect('distortion', { enabled: !settings.effects.distortion.enabled })}
            onWetChange={(value) => updateEffect('distortion', { wet: value })}
          />
        </div>
      </div>
    </div>
  );
}

export default memo(SynthControls);
