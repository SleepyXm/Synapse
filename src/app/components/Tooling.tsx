"use client";

import { ModelSettings } from "../hooks/interactive";

type ToolingProps = {
  settings: ModelSettings;
  setSettings: React.Dispatch<React.SetStateAction<ModelSettings>>;
};

export default function Tooling({ settings, setSettings }: ToolingProps) {
  const updateSetting = <K extends keyof ModelSettings>(
    key: K,
    value: ModelSettings[K]
  ) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div
      className="hidden md:flex flex-col bg-black/60 backdrop-blur p-4 shadow-2xl
      transition-all duration-300 h-[94vh] mt-20 w-[25vw]"
    >
      <h3 className="text-lg font-bold text-white text-center mb-4">
        Model Settings
      </h3>

      <div className="flex flex-col gap-5 text-white">
        <SettingSlider
          label="Temperature"
          value={settings.temperature}
          min={0}
          max={2}
          step={0.05}
          onChange={(value) => updateSetting("temperature", value)}
        />

        <SettingSlider
          label="Top P"
          value={settings.top_p}
          min={0}
          max={1}
          step={0.01}
          onChange={(value) => updateSetting("top_p", value)}
        />

        <SettingSlider
          label="Max Tokens"
          value={settings.max_tokens}
          min={64}
          max={50000}
          step={64}
          onChange={(value) => updateSetting("max_tokens", value)}
        />

        <SettingSlider
          label="Presence Penalty"
          value={settings.presence_penalty}
          min={-2}
          max={2}
          step={0.1}
          onChange={(value) => updateSetting("presence_penalty", value)}
        />

        <SettingSlider
          label="Frequency Penalty"
          value={settings.frequency_penalty}
          min={-2}
          max={2}
          step={0.1}
          onChange={(value) => updateSetting("frequency_penalty", value)}
        />
      </div>
    </div>
  );
}

function SettingSlider(props: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between text-sm">
        <span>{props.label}</span>
        <span className="text-teal-300">{props.value}</span>
      </div>

      <input
        type="range"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        onChange={(e) => props.onChange(Number(e.target.value))}
        className="w-full"
      />
    </div>
  );
}