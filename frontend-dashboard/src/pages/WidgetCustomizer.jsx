import React, { useState, useEffect } from 'react';
import {
  Palette,
  Sparkles,
  Bot,
  MessageSquare,
  Layout,
  Check,
  Save,
  Code2,
  RotateCcw,
  AlertCircle
} from 'lucide-react';
import { useWorkspace, DEFAULT_WIDGET_SETTINGS } from '../context/WorkspaceContext';
import { BRAND_COLOR_PRESETS } from '../constants';
import WidgetPreview from '../components/widget/WidgetPreview';
import EmbedSnippetModal from '../components/widget/EmbedSnippetModal';

export { BRAND_COLOR_PRESETS };

export function WidgetCustomizer({ onOpenEmbedModal }) {
  const { activeWorkspace, updateSettings } = useWorkspace();
  const [settings, setSettings] = useState(activeWorkspace?.widget_settings || DEFAULT_WIDGET_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [localEmbedOpen, setLocalEmbedOpen] = useState(false);

  // Sync if activeWorkspace changes
  useEffect(() => {
    if (activeWorkspace?.widget_settings) {
      setSettings(activeWorkspace.widget_settings);
    }
  }, [activeWorkspace]);

  const handleChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus(null);
    try {
      await updateSettings({ widget_settings: settings });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset widget settings to defaults?')) {
      setSettings(DEFAULT_WIDGET_SETTINGS);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <span>Widget Designer</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 font-semibold border border-brand-500/30">
              Live Customizer
            </span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Personalize theme colors, assistant branding, and launcher placement with real-time preview.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setLocalEmbedOpen(true)}
            className="px-4 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-all"
          >
            <Code2 className="w-4 h-4 text-brand-400" />
            <span>Get Embed Code</span>
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow-brand flex items-center gap-2 transition-all active:scale-95"
          >
            {isSaving ? <span className="animate-spin">⏳</span> : <Save className="w-4 h-4" />}
            <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </div>

      {saveStatus === 'saved' && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between animate-in fade-in">
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>Widget settings saved successfully and synced with control backend!</span>
          </span>
        </div>
      )}

      {/* Main Grid: Customizer Controls (Left) and Live Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Controls Column */}
        <div className="lg:col-span-5 space-y-6">
          {/* Brand Colors */}
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <Palette className="w-4 h-4 text-brand-400" />
                <h3 className="text-sm font-bold text-white">Brand & Colors</h3>
              </div>
              <button
                onClick={handleReset}
                title="Reset to default brand theme"
                className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Primary Theme Color
              </label>

              {/* Color Presets */}
              <div className="grid grid-cols-3 gap-2">
                {BRAND_COLOR_PRESETS.map((preset) => {
                  const isSelected = settings.primary_color?.toLowerCase() === preset.hex.toLowerCase();
                  return (
                    <button
                      key={preset.hex}
                      type="button"
                      onClick={() => handleChange('primary_color', preset.hex)}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-left text-xs transition-all ${
                        isSelected
                          ? 'border-brand-500 bg-surface-850 shadow-sm'
                          : 'border-slate-800 bg-surface-950/60 hover:border-slate-700'
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: preset.hex }}
                      />
                      <span className="text-[11px] text-slate-300 truncate">{preset.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Hex Input */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="color"
                  value={settings.primary_color || '#6366f1'}
                  onChange={(e) => handleChange('primary_color', e.target.value)}
                  className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0 p-0"
                />
                <input
                  type="text"
                  value={settings.primary_color || '#6366f1'}
                  onChange={(e) => handleChange('primary_color', e.target.value)}
                  placeholder="#6366f1"
                  className="flex-1 glass-input px-3.5 py-2.5 rounded-xl font-mono text-xs uppercase"
                />
              </div>
            </div>

            {/* Placement Switcher */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Launcher Placement
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleChange('position', 'bottom-right')}
                  className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                    settings.position === 'bottom-right'
                      ? 'bg-brand-600/20 text-brand-300 border-brand-500/50 shadow-sm'
                      : 'bg-surface-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Layout className="w-3.5 h-3.5" />
                  <span>Bottom Right</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleChange('position', 'bottom-left')}
                  className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                    settings.position === 'bottom-left'
                      ? 'bg-brand-600/20 text-brand-300 border-brand-500/50 shadow-sm'
                      : 'bg-surface-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Layout className="w-3.5 h-3.5 scale-x-[-1]" />
                  <span>Bottom Left</span>
                </button>
              </div>
            </div>
          </div>

          {/* Bot Identity */}
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-800/80 pb-3">
              <Bot className="w-4 h-4 text-brand-400" />
              <h3 className="text-sm font-bold text-white">Assistant Identity & Copy</h3>
            </div>

            {/* Bot Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Bot Name
              </label>
              <input
                type="text"
                value={settings.bot_name || ''}
                onChange={(e) => handleChange('bot_name', e.target.value)}
                placeholder="Acme Assistant"
                className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs"
              />
            </div>

            {/* Greeting Message */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Welcome Greeting Message
              </label>
              <textarea
                rows={3}
                value={settings.greeting_message || ''}
                onChange={(e) => handleChange('greeting_message', e.target.value)}
                placeholder="Hi there! Ask me anything about our product or docs."
                className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs resize-none"
              />
              <span className="text-[10px] text-slate-400 block">
                The initial message displayed when a visitor opens the chat dialog.
              </span>
            </div>

            {/* Input Placeholder */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Input Placeholder Text
              </label>
              <input
                type="text"
                value={settings.placeholder_text || ''}
                onChange={(e) => handleChange('placeholder_text', e.target.value)}
                placeholder="Type your question..."
                className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs"
              />
            </div>

            {/* Avatar URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Custom Avatar Image URL <span className="text-[10px] text-slate-400 lowercase">(optional)</span>
              </label>
              <input
                type="text"
                value={settings.avatar_url || ''}
                onChange={(e) => handleChange('avatar_url', e.target.value)}
                placeholder="https://your-site.com/avatar.png"
                className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs"
              />
            </div>
          </div>
        </div>

        {/* Live Preview Column */}
        <div className="lg:col-span-7 sticky top-24">
          <div className="space-y-2 mb-3 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span>Real-Time Visitor Experience Preview</span>
            </span>
            <span className="text-[11px] text-slate-400">Click launcher to toggle</span>
          </div>

          <WidgetPreview settings={settings} />
        </div>
      </div>

      {/* Embed Snippet Modal */}
      <EmbedSnippetModal
        isOpen={localEmbedOpen}
        onClose={() => setLocalEmbedOpen(false)}
      />
    </div>
  );
}

export default WidgetCustomizer;
