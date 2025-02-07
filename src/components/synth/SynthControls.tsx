// src/components/synth/SynthControls.tsx
import React, { useCallback, useMemo, memo } from 'react';
import { TerminalSelect } from '@/components/ui/TerminalSelect';
import type { SynthSettings } from '@/types/synth';
import { debounce } from 'lodash';

interface SynthControlsProps {
  settings: SynthSettings;
  onUpdateSettings: (settings: Partial<SynthSettings>) => void;
}

// Memoized parameter control components for better performance
const ParameterSlider = memo(({ 
  label, 
  value, 
  min, 
  max, 
  step, 
  onChange 
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

// Memoized effect toggle component
const EffectToggle = memo(({ 
  label, 
  enabled, 
  wetValue, 
  onToggle, 
  onWetChange 
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
  // Memoize options arrays to prevent unnecessary re-renders
  const waveformOptions = useMemo(() => [
    { value: 'sine', label: 'Sine' },
    { value: 'square', label: 'Square' },
    { value: 'sawtooth', label: 'Sawtooth' },
    { value: 'triangle', label: 'Triangle' },
    { value: 'square8', label: 'Square 8' },
    { value: 'sawtooth8', label: 'Sawtooth 8' },
    { value: 'triangle8', label: 'Triangle 8' },
  ], []);

  const filterTypes = useMemo(() => [
    { value: 'lowpass', label: 'Low Pass' },
    { value: 'highpass', label: 'High Pass' },
    { value: 'bandpass', label: 'Band Pass' },
  ], []);

  const lfoTargets = useMemo(() => [
    { value: 'filter', label: 'Filter' },
    { value: 'pitch', label: 'Pitch' },
    { value: 'volume', label: 'Volume' },
  ], []);

  // Debounced update handlers for continuous parameters
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

  // Effect update handlers
  const updateEffect = useCallback((
    effectName: 'reverb' | 'delay' | 'distortion',
    changes: Partial<{ enabled: boolean; wet: number }>
  ) => {
    onUpdateSettings({
      effects: {
        ...settings.effects,
        [effectName]: {
          ...settings.effects[effectName],
          ...changes,
        },
      },
    });
  }, [settings.effects, onUpdateSettings]);

  return (
    <div className="space-y-6">
      {/* Oscillator & Envelope */}
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
        </div>
        <div className="space-y-2">
          <h3 className="text-terminal-green font-bold">Envelope</h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(settings.envelope).map(([param, value]) => (
              <ParameterSlider
                key={param}
                label={param}
                value={value as number}
                min={0}
                max={1}
                step={0.01}
                onChange={(value) => updateEnvelopeParameter(param, value)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Filter */}
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

      {/* LFO */}
      <div className="space-y-2">
        <h3 className="text-terminal-green font-bold">LFO</h3>
        <TerminalSelect
          value={settings.lfo.target}
          onValueChange={(value: any) =>
            onUpdateSettings({
              lfo: { ...settings.lfo, target: value },
            })
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

      {/* Effects */}
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

// Memoize the entire component for better performance
export default memo(SynthControls);