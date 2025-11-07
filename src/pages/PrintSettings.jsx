
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowRight,
  Palette,
  Type,
  FileText,
  CheckCircle2,
  Eye
} from "lucide-react";

const ADMIN_EMAIL = 'hershufo23@gmail.com';

const COLOR_PRESETS = [
  { name: 'سەوز', header: '#059669', footer: '#f9fafb' },
  { name: 'شین', header: '#2563eb', footer: '#eff6ff' },
  { name: 'سۆر', header: '#dc2626', footer: '#fef2f2' },
  { name: 'نارەنجی', header: '#ea580c', footer: '#fff7ed' },
  { name: 'مۆر', header: '#7c3aed', footer: '#faf5ff' },
  { name: 'ڕەش', header: '#1f2937', footer: '#f9fafb' },
];

export default function PrintSettings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [success, setSuccess] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [settings, setSettings] = useState({
    header_company_name: 'نەسرەدین رۆژبەیانی',
    header_tagline: 'کۆمپانیای کرێی ئامێرەکان',
    header_color: '#059669',
    header_text_size: '32',
    header_logo_url: '',
    header_logo_size: '60',
    header_logo_position: 'top',
    footer_text: 'ئەم وەسڵە بە سیستەمی ئۆتۆماتیک دەرچووە',
    footer_color: '#f9fafb',
    footer_show_date: true,
    footer_show_company: true,
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (err) {
        console.error('Failed to fetch user:', err);
      }
    };
    fetchUser();
  }, []);

  const { data: appSettings = [] } = useQuery({
    queryKey: ['appSettings'],
    queryFn: () => base44.entities.AppSetting.list(),
    initialData: [],
    onSuccess: (data) => {
      const settingsMap = {};
      data.forEach(s => {
        if (s.setting_key.startsWith('print_')) {
          const key = s.setting_key.replace('print_', '');
          // Handle boolean conversion for specific keys if needed, otherwise keep as string
          settingsMap[key] = s.setting_value === 'true' ? true : s.setting_value === 'false' ? false : s.setting_value;
        }
      });
      if (Object.keys(settingsMap).length > 0) {
        setSettings(prev => ({ ...prev, ...settingsMap }));
      }
    }
  });

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }) => {
      const existing = appSettings.find(s => s.setting_key === `print_${key}`);
      if (existing) {
        return base44.entities.AppSetting.update(existing.id, {
          setting_value: String(value),
          setting_key: `print_${key}`,
          setting_category: 'print_settings'
        });
      } else {
        return base44.entities.AppSetting.create({
          setting_key: `print_${key}`,
          setting_value: String(value),
          setting_category: 'print_settings',
          description: `Print setting: ${key}`
        });
      }
    },
  });

  const handleSave = async () => {
    try {
      for (const [key, value] of Object.entries(settings)) {
        await updateSettingMutation.mutateAsync({ key, value });
      }
      queryClient.invalidateQueries({ queryKey: ['appSettings'] });
      setSuccess('ڕێکخستنەکان بە سەرکەوتوویی پاشەکەوت کرا!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
    }
  };

  const applyColorPreset = (preset) => {
    setSettings(prev => ({
      ...prev,
      header_color: preset.header,
      footer_color: preset.footer
    }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setSettings({ ...settings, header_logo_url: file_url });
      setSuccess('لۆگۆ بە سەرکەوتوویی بارکرا!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error uploading logo:', err);
      setSuccess('هەڵەیەک ڕوویدا لە بارکردنی لۆگۆکە!');
      setTimeout(() => setSuccess(''), 3000);
    } finally {
      setUploading(false);
    }
  };

  const getLogoSizePixels = () => {
    return parseInt(settings.header_logo_size, 10);
  };

  const isAdmin = currentUser?.email === ADMIN_EMAIL || currentUser?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="p-8 text-center">
        <Alert variant="destructive">
          <AlertDescription>تەنها بەڕێوەبەر دەتوانێت دەستگەیشتن بەم لاپەڕەیە هەبێت</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8 flex-wrap">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl('Dashboard'))}
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">ڕێکخستنی چاپکردن</h1>
            <p className="text-gray-600 mt-1">دەستکاریکردنی سەرپەڕ و پێپەڕ بەبێ کۆد</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
            className="gap-2"
          >
            <Eye className="w-4 h-4" />
            {showPreview ? 'شاردنەوە' : 'پێشبینین'}
          </Button>
        </div>

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Header Settings */}
        <Card className="mb-6 border-none shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b">
            <CardTitle className="flex items-center gap-2">
              <Type className="w-5 h-5 text-blue-600" />
              سەرپەڕی چاپکردن
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label>لۆگۆی کۆمپانیا</Label>
              <div className="flex items-center gap-4">
                {settings.header_logo_url && (
                  <div className="flex-shrink-0">
                    <img
                      src={settings.header_logo_url}
                      alt="Logo"
                      className="border-2 rounded-lg p-2 bg-white"
                      style={{
                        height: `${getLogoSizePixels()}px`,
                        width: 'auto',
                        maxWidth: '200px',
                        objectFit: 'contain'
                      }}
                    />
                  </div>
                )}
                <div className="flex-1">
                  <Label htmlFor="logo-upload" className="cursor-pointer block">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-emerald-500 transition-colors text-center">
                      {uploading ? (
                        <p className="text-sm text-gray-600">بارکردن...</p>
                      ) : (
                        <>
                          <div className="text-4xl mb-2">📁</div>
                          <p className="text-sm text-gray-600">کلیک بکە بۆ بارکردنی لۆگۆ</p>
                          <p className="text-xs text-gray-400 mt-1">PNG, JPG یان SVG</p>
                        </>
                      )}
                    </div>
                  </Label>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </div>
              </div>
            </div>

            {settings.header_logo_url && (
              <>
                <div className="space-y-2">
                  <Label>قەبارەی لۆگۆ</Label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="40"
                      max="120"
                      value={settings.header_logo_size}
                      onChange={(e) => setSettings({ ...settings, header_logo_size: e.target.value })}
                      className="flex-1"
                    />
                    <span className="text-sm font-bold w-16 text-center">{settings.header_logo_size}px</span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant={settings.header_logo_size === '50' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSettings({ ...settings, header_logo_size: '50' })}
                    >
                      بچووک
                    </Button>
                    <Button
                      variant={settings.header_logo_size === '70' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSettings({ ...settings, header_logo_size: '70' })}
                    >
                      ناوەند
                    </Button>
                    <Button
                      variant={settings.header_logo_size === '100' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSettings({ ...settings, header_logo_size: '100' })}
                    >
                      گەورە
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>شوێنی لۆگۆ</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={settings.header_logo_position === 'top' ? 'default' : 'outline'}
                      onClick={() => setSettings({ ...settings, header_logo_position: 'top' })}
                      className="flex-1"
                    >
                      سەرەوە
                    </Button>
                    <Button
                      variant={settings.header_logo_position === 'right' ? 'default' : 'outline'}
                      onClick={() => setSettings({ ...settings, header_logo_position: 'right' })}
                      className="flex-1"
                    >
                      لای ڕاست
                    </Button>
                    <Button
                      variant={settings.header_logo_position === 'left' ? 'default' : 'outline'}
                      onClick={() => setSettings({ ...settings, header_logo_position: 'left' })}
                      className="flex-1"
                    >
                      لای چەپ
                    </Button>
                  </div>
                </div>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setSettings({ ...settings, header_logo_url: '' })}
                  className="w-full"
                >
                  سڕینەوەی لۆگۆ
                </Button>
              </>
            )}

            <div className="space-y-2">
              <Label>ناوی کۆمپانیا</Label>
              <Input
                value={settings.header_company_name}
                onChange={(e) => setSettings({ ...settings, header_company_name: e.target.value })}
                placeholder="نەسرەدین رۆژبەیانی"
                className="text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label>دەربڕینی کۆمپانیا</Label>
              <Input
                value={settings.header_tagline}
                onChange={(e) => setSettings({ ...settings, header_tagline: e.target.value })}
                placeholder="کۆمپانیای کرێی ئامێرەکان"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>قەبارەی فۆنت (px)</Label>
                <Input
                  type="number"
                  value={settings.header_text_size}
                  onChange={(e) => setSettings({ ...settings, header_text_size: e.target.value })}
                  min="20"
                  max="60"
                />
              </div>

              <div className="space-y-2">
                <Label>ڕەنگی سەرپەڕ</Label>
                <Input
                  type="color"
                  value={settings.header_color}
                  onChange={(e) => setSettings({ ...settings, header_color: e.target.value })}
                  className="h-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Color Presets */}
        <Card className="mb-6 border-none shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b">
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-purple-600" />
              ڕەنگە ئامادەکان
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => applyColorPreset(preset)}
                  className="p-4 border-2 rounded-lg hover:shadow-md transition-all"
                  style={{ borderColor: preset.header }}
                >
                  <div
                    className="h-12 rounded mb-2"
                    style={{ background: preset.header }}
                  />
                  <div
                    className="h-8 rounded mb-2"
                    style={{ background: preset.footer }}
                  />
                  <div className="text-sm font-bold text-center">{preset.name}</div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Footer Settings */}
        <Card className="mb-6 border-none shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-600" />
              پێپەڕی چاپکردن
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label>دەقی پێپەڕ</Label>
              <Textarea
                value={settings.footer_text}
                onChange={(e) => setSettings({ ...settings, footer_text: e.target.value })}
                rows={3}
                placeholder="ئەم وەسڵە بە سیستەمی ئۆتۆماتیک دەرچووە"
              />
            </div>

            <div className="space-y-2">
              <Label>ڕەنگی پێپەڕ</Label>
              <Input
                type="color"
                value={settings.footer_color}
                onChange={(e) => setSettings({ ...settings, footer_color: e.target.value })}
                className="h-10"
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.footer_show_date}
                  onChange={(e) => setSettings({ ...settings, footer_show_date: e.target.checked })}
                  className="w-4 h-4"
                />
                <span>پیشاندانی بەرواری چاپکردن</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.footer_show_company}
                  onChange={(e) => setSettings({ ...settings, footer_show_company: e.target.checked })}
                  className="w-4 h-4"
                />
                <span>پیشاندانی ناوی کۆمپانیا لە پێپەڕ</span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        {showPreview && (
          <Card className="mb-6 border-none shadow-lg">
            <CardHeader className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-b">
              <CardTitle>پێشبینین</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-8" style={{ background: '#f9fafb' }}>
                <div className="max-w-2xl mx-auto bg-white shadow-lg">
                  <div
                    className="p-8 text-white text-center"
                    style={{ background: settings.header_color }}
                  >
                    {settings.header_logo_url && settings.header_logo_position === 'top' && (
                      <div className="mb-4 flex justify-center">
                        <img
                          src={settings.header_logo_url}
                          alt="Company Logo"
                          style={{
                            height: `${getLogoSizePixels()}px`,
                            width: 'auto',
                            maxWidth: '200px',
                            objectFit: 'contain'
                          }}
                        />
                      </div>
                    )}

                    <div className={`flex items-center ${
                      settings.header_logo_url && settings.header_logo_position === 'right' ? 'justify-between' :
                      settings.header_logo_url && settings.header_logo_position === 'left' ? 'justify-between flex-row-reverse' :
                      'justify-center'
                    }`}>
                      {settings.header_logo_url && (settings.header_logo_position === 'right' || settings.header_logo_position === 'left') && (
                        <img
                          src={settings.header_logo_url}
                          alt="Company Logo"
                          style={{
                            height: `${getLogoSizePixels()}px`,
                            width: 'auto',
                            maxWidth: '150px', // Adjust max width for side logos
                            objectFit: 'contain'
                          }}
                        />
                      )}

                      <div className={settings.header_logo_url && settings.header_logo_position !== 'top' ? 'flex-1 mx-4' : ''}> {/* Add margin for spacing */}
                        <h1
                          className="font-bold mb-2"
                          style={{ fontSize: `${settings.header_text_size}px` }}
                        >
                          {settings.header_company_name}
                        </h1>
                        <p className="text-lg opacity-90">{settings.header_tagline}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-8">
                    <p className="text-gray-600 text-center">
                      [خشتەی داتا لێرە دەردەکەوێت]
                    </p>
                  </div>

                  <div
                    className="p-6 text-center border-t-2"
                    style={{ background: settings.footer_color }}
                  >
                    {settings.footer_show_date && (
                      <p className="text-sm text-gray-600 mb-2">
                        چاپکراوە لە 2025-11-01 • 16:00
                      </p>
                    )}
                    {settings.footer_text && (
                      <p className="text-sm text-gray-600 mb-2">{settings.footer_text}</p>
                    )}
                    {settings.footer_show_company && (
                      <p className="text-sm font-bold text-gray-700">
                        {settings.header_company_name} • {settings.header_tagline}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => navigate(createPageUrl('Dashboard'))}
          >
            پاشگەزبوونەوە
          </Button>
          <Button
            onClick={handleSave}
            className="bg-emerald-600 hover:bg-emerald-700 gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            پاشەکەوتکردن
          </Button>
        </div>
      </div>
    </div>
  );
}
