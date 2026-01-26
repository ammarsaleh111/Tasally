'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';

const DOMINANT_THEMES = [
  {
    id: 'ramadan',
    name: 'Ramadan',
    emoji: '🌙',
    description: 'Islamic holy month of fasting and reflection',
    accentColor: 'hsl(270 60% 45%)',
  },
  {
    id: 'eid',
    name: 'Eid',
    emoji: '🌟',
    description: 'Celebration marking the end of Ramadan',
    accentColor: 'hsl(160 60% 40%)',
  },
];

export default function AdminThemesClient() {
  const router = useRouter();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    activeDominantTheme: null,
    useSchedule: true,
    ramadanStart: '',
    ramadanEnd: '',
    eidStart: '',
    eidEnd: '',
    bannerTitle: '',
    bannerSubtitle: '',
    bannerEnabled: true,
  });

  // Fetch current settings
  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/theme');
      if (!res.ok) {
        if (res.status === 401) {
          router.replace('/admin/login');
          return;
        }
        throw new Error('Failed to fetch settings');
      }
      const data = await res.json();
      setSettings(data);
      setFormData({
        activeDominantTheme: data.activeDominantTheme || null,
        useSchedule: data.useSchedule ?? true,
        ramadanStart: data.ramadanStart || '',
        ramadanEnd: data.ramadanEnd || '',
        eidStart: data.eidStart || '',
        eidEnd: data.eidEnd || '',
        bannerTitle: data.bannerTitle || '',
        bannerSubtitle: data.bannerSubtitle || '',
        bannerEnabled: data.bannerEnabled ?? true,
      });
    } catch (error) {
      console.error('Error fetching theme settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/theme', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save settings');
      }

      setSettings(data.settings);
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleQuickAction = async (action, theme = null) => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, theme }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Action failed');
      }

      setMessage({ type: 'success', text: data.message });
      await fetchSettings();
    } catch (error) {
      console.error('Error performing action:', error);
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="max-w-4xl mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      
      <main className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Theme Management</h1>
            <p className="text-muted-foreground mt-1">
              Control platform themes and seasonal events
            </p>
          </div>
          <Link
            href="/admin"
            className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg border ${
              message.type === 'success'
                ? 'bg-success/10 border-success text-success'
                : 'bg-destructive/10 border-destructive text-destructive'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Current Status Card */}
        <section className="mb-8 p-6 rounded-xl bg-card border border-border">
          <h2 className="text-lg font-semibold mb-4">Current Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-background border border-border">
              <div className="text-sm text-muted-foreground mb-1">Active Theme</div>
              <div className="text-xl font-bold">
                {formData.activeDominantTheme
                  ? DOMINANT_THEMES.find(t => t.id === formData.activeDominantTheme)?.name || formData.activeDominantTheme
                  : 'None (Default)'}
              </div>
            </div>
            <div className="p-4 rounded-lg bg-background border border-border">
              <div className="text-sm text-muted-foreground mb-1">Mode</div>
              <div className="text-xl font-bold">
                {formData.useSchedule ? '📅 Scheduled' : '✋ Manual'}
              </div>
            </div>
            <div className="p-4 rounded-lg bg-background border border-border">
              <div className="text-sm text-muted-foreground mb-1">Banner</div>
              <div className="text-xl font-bold">
                {formData.bannerEnabled ? '✅ Enabled' : '❌ Disabled'}
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mb-8 p-6 rounded-xl bg-card border border-border">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            {DOMINANT_THEMES.map(theme => (
              <button
                key={theme.id}
                onClick={() => handleQuickAction('activate', theme.id)}
                disabled={saving}
                className={`px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 ${
                  formData.activeDominantTheme === theme.id
                    ? 'bg-success text-success-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {theme.emoji} Activate {theme.name}
              </button>
            ))}
            <button
              onClick={() => handleQuickAction('deactivate')}
              disabled={saving || !formData.activeDominantTheme}
              className="px-4 py-2 rounded-lg font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all disabled:opacity-50"
            >
              🚫 Deactivate Theme
            </button>
            <button
              onClick={() => handleQuickAction('enable-schedule')}
              disabled={saving || formData.useSchedule}
              className="px-4 py-2 rounded-lg font-medium bg-info/10 text-info hover:bg-info/20 transition-all disabled:opacity-50"
            >
              📅 Enable Schedule Mode
            </button>
          </div>
        </section>

        {/* Theme Cards */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Dominant Themes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DOMINANT_THEMES.map(theme => (
              <div
                key={theme.id}
                className={`p-6 rounded-xl border-2 transition-all ${
                  formData.activeDominantTheme === theme.id
                    ? 'border-success bg-success/5'
                    : 'border-border bg-card hover:border-border/80'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{theme.emoji}</span>
                  <div>
                    <h3 className="text-lg font-semibold">{theme.name}</h3>
                    <p className="text-sm text-muted-foreground">{theme.description}</p>
                  </div>
                </div>
                
                {/* Date Range Inputs */}
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-muted-foreground w-16">Start:</label>
                    <input
                      type="date"
                      value={formData[`${theme.id}Start`]}
                      onChange={(e) => handleInputChange(`${theme.id}Start`, e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg bg-background border border-input text-foreground text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-muted-foreground w-16">End:</label>
                    <input
                      type="date"
                      value={formData[`${theme.id}End`]}
                      onChange={(e) => handleInputChange(`${theme.id}End`, e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg bg-background border border-input text-foreground text-sm"
                    />
                  </div>
                </div>
                
                {formData.activeDominantTheme === theme.id && (
                  <div className="mt-3 flex items-center gap-2 text-success text-sm">
                    <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                    Currently Active
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Settings Form */}
        <section className="mb-8 p-6 rounded-xl bg-card border border-border">
          <h2 className="text-lg font-semibold mb-4">Settings</h2>
          
          <div className="space-y-6">
            {/* Schedule Toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-background border border-border">
              <div>
                <div className="font-medium">Use Date Schedule</div>
                <div className="text-sm text-muted-foreground">
                  Automatically activate themes based on date ranges
                </div>
              </div>
              <button
                onClick={() => handleInputChange('useSchedule', !formData.useSchedule)}
                className={`w-14 h-7 rounded-full transition-colors ${
                  formData.useSchedule ? 'bg-success' : 'bg-muted'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full bg-white shadow transform transition-transform ${
                    formData.useSchedule ? 'translate-x-7' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Banner Toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-background border border-border">
              <div>
                <div className="font-medium">Show Theme Banner</div>
                <div className="text-sm text-muted-foreground">
                  Display announcement banner when a dominant theme is active
                </div>
              </div>
              <button
                onClick={() => handleInputChange('bannerEnabled', !formData.bannerEnabled)}
                className={`w-14 h-7 rounded-full transition-colors ${
                  formData.bannerEnabled ? 'bg-success' : 'bg-muted'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full bg-white shadow transform transition-transform ${
                    formData.bannerEnabled ? 'translate-x-7' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Custom Banner Text */}
            <div className="space-y-4">
              <h3 className="font-medium">Custom Banner Text (Optional)</h3>
              
              <div>
                <label className="block text-sm text-muted-foreground mb-2">
                  Banner Title
                </label>
                <input
                  type="text"
                  value={formData.bannerTitle}
                  onChange={(e) => handleInputChange('bannerTitle', e.target.value)}
                  placeholder="Leave empty to use default theme title"
                  className="w-full px-4 py-3 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground"
                  maxLength={200}
                />
              </div>
              
              <div>
                <label className="block text-sm text-muted-foreground mb-2">
                  Banner Subtitle
                </label>
                <textarea
                  value={formData.bannerSubtitle}
                  onChange={(e) => handleInputChange('bannerSubtitle', e.target.value)}
                  placeholder="Leave empty to use default theme subtitle"
                  className="w-full px-4 py-3 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground resize-none"
                  rows={2}
                  maxLength={500}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Save Button */}
        <div className="flex items-center justify-between p-6 rounded-xl bg-card border border-border">
          <div className="text-sm text-muted-foreground">
            {settings?.updatedAt && (
              <>Last updated: {new Date(settings.updatedAt).toLocaleString()}</>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 rounded-lg bg-success text-success-foreground font-medium hover:bg-success/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                Saving...
              </>
            ) : (
              <>💾 Save All Settings</>
            )}
          </button>
        </div>

        {/* Preview Link */}
        <div className="mt-8 text-center">
          <Link
            href="/themes"
            target="_blank"
            className="text-info hover:underline inline-flex items-center gap-2"
          >
            👁️ Preview Theme Page
            <span className="text-xs">↗</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
