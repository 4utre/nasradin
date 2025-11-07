
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  ArrowRight,
  Settings as SettingsIcon,
  Building2,
  Palette,
  Shield,
  CheckCircle2,
  AlertCircle,
  Save,
  RotateCcw,
  Upload,
  Image as ImageIcon
} from "lucide-react";

const ADMIN_EMAIL = 'hershufo23@gmail.com';

const DEFAULT_SETTINGS = {
  // App Identity
  app_title: 'سیستەمی بەڕێوەبردنی خەرجی',
  app_description: 'کۆمپانیای کرێی ئامێرەکان',
  app_logo_url: '',
  app_favicon_url: '',
  
  // Company Info
  company_name: 'نەسرەدین رۆژبەیانی',
  company_tagline: 'کۆمپانیای کرێی ئامێرەکان',
  company_address: '',
  company_phone: '',
  company_email: '',
  
  // Defaults
  default_currency: 'IQD',
  items_per_page: '20',
  
  // System
  admin_email: ADMIN_EMAIL,
  delete_pin: ''
};

export default function Settings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

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

  const { data: allSettings = [], isLoading } = useQuery({
    queryKey: ['appSettings'],
    queryFn: () => base44.entities.AppSetting.list(),
    initialData: [],
  });

  useEffect(() => {
    if (allSettings.length > 0) {
      const loadedSettings = { ...DEFAULT_SETTINGS };
      allSettings.forEach(setting => {
        loadedSettings[setting.setting_key] = setting.setting_value;
      });
      setSettings(loadedSettings);

      // Apply settings immediately after loading (e.g., favicon, title)
      if (loadedSettings.app_favicon_url) {
        let favicon = document.querySelector("link[rel*='icon']") || document.querySelector("link[rel*='shortcut icon']");
        if (!favicon) {
          favicon = document.createElement('link');
          favicon.rel = 'icon';
          document.head.appendChild(favicon);
        }
        favicon.href = loadedSettings.app_favicon_url;
      }
      if (loadedSettings.app_title) {
        document.title = loadedSettings.app_title;
      }
    }
  }, [allSettings]);

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value, category }) => {
      const existing = allSettings.find(s => s.setting_key === key);
      if (existing) {
        return base44.entities.AppSetting.update(existing.id, {
          setting_value: value,
          setting_category: category
        });
      } else {
        return base44.entities.AppSetting.create({
          setting_key: key,
          setting_value: value,
          setting_category: category,
          description: key
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appSettings'] });
    },
  });

  const handleSave = async () => {
    setError('');
    setSuccess('');

    try {
      // App Identity
      await updateSettingMutation.mutateAsync({ key: 'app_title', value: settings.app_title, category: 'app_identity' });
      await updateSettingMutation.mutateAsync({ key: 'app_description', value: settings.app_description, category: 'app_identity' });
      await updateSettingMutation.mutateAsync({ key: 'app_logo_url', value: settings.app_logo_url, category: 'app_identity' });
      await updateSettingMutation.mutateAsync({ key: 'app_favicon_url', value: settings.app_favicon_url, category: 'app_identity' });
      
      // Update favicon in real-time
      if (settings.app_favicon_url) {
        let favicon = document.querySelector("link[rel*='icon']") || document.querySelector("link[rel*='shortcut icon']");
        if (!favicon) {
          favicon = document.createElement('link');
          favicon.rel = 'icon';
          document.head.appendChild(favicon);
        }
        favicon.href = settings.app_favicon_url;
      } else {
        // If favicon URL is cleared, remove the favicon link if it exists
        let favicon = document.querySelector("link[rel*='icon']") || document.querySelector("link[rel*='shortcut icon']");
        if (favicon) {
            favicon.remove();
        }
      }
      
      // Update page title
      if (settings.app_title) {
        document.title = settings.app_title;
      } else {
        document.title = 'Default App Title'; // Fallback if title is cleared
      }
      
      // Company Info
      await updateSettingMutation.mutateAsync({ key: 'company_name', value: settings.company_name, category: 'company_info' });
      await updateSettingMutation.mutateAsync({ key: 'company_tagline', value: settings.company_tagline, category: 'company_info' });
      await updateSettingMutation.mutateAsync({ key: 'company_address', value: settings.company_address, category: 'company_info' });
      await updateSettingMutation.mutateAsync({ key: 'company_phone', value: settings.company_phone, category: 'company_info' });
      await updateSettingMutation.mutateAsync({ key: 'company_email', value: settings.company_email, category: 'company_info' });
      
      // Defaults
      await updateSettingMutation.mutateAsync({ key: 'default_currency', value: settings.default_currency, category: 'defaults' });
      await updateSettingMutation.mutateAsync({ key: 'items_per_page', value: settings.items_per_page, category: 'defaults' });
      
      // System
      await updateSettingMutation.mutateAsync({ key: 'admin_email', value: settings.admin_email, category: 'system' });
      if (settings.delete_pin) {
        localStorage.setItem('deletePin', settings.delete_pin);
      }

      setSuccess('ڕێکخستنەکان بە سەرکەوتوویی پاشەکەوتکرا!');
      setHasChanges(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('هەڵە لە پاشەکەوتکردنی ڕێکخستنەکان: ' + (err.message || ''));
    }
  };

  const handleReset = () => {
    if (window.confirm('دڵنیایت لە گەڕاندنەوەی هەموو ڕێکخستنەکان بۆ بنەڕەت؟')) {
      setSettings(DEFAULT_SETTINGS);
      setHasChanges(true);
    }
  };

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      handleChange('app_logo_url', file_url);
      setSuccess('لۆگۆ بە سەرکەوتوویی بارکرا!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('هەڵە لە بارکردنی لۆگۆ');
    }
  };

  const handleFaviconUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      handleChange('app_favicon_url', file_url);
      
      // Update favicon immediately
      let favicon = document.querySelector("link[rel*='icon']") || document.querySelector("link[rel*='shortcut icon']");
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
      }
      favicon.href = file_url;
      
      setSuccess('فەیڤیکۆن بە سەرکەوتوویی بارکرا!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('هەڵە لە بارکردنی فەیڤیکۆن');
    }
  };

  const isAdmin = currentUser?.email === ADMIN_EMAIL || currentUser?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="p-8 text-center">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>تەنها بەڕێوەبەر دەتوانێت دەستگەیشتن بەم لاپەڕەیە هەبێت</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl('Dashboard'))}
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">ڕێکخستنەکان</h1>
            <p className="text-gray-600 mt-1">بەڕێوەبردنی ڕێکخستنەکانی سیستەم</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={!hasChanges}
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              گەڕاندنەوە
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || updateSettingMutation.isPending}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              <Save className="w-4 h-4" />
              پاشەکەوتکردن
            </Button>
          </div>
        </div>

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="identity" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="identity" className="gap-2">
              <SettingsIcon className="w-4 h-4" />
              ناسنامەی ئەپ
            </TabsTrigger>
            <TabsTrigger value="company" className="gap-2">
              <Building2 className="w-4 h-4" />
              زانیاری کۆمپانیا
            </TabsTrigger>
            <TabsTrigger value="defaults" className="gap-2">
              <Palette className="w-4 h-4" />
              بنەڕەتەکان
            </TabsTrigger>
            <TabsTrigger value="system" className="gap-2">
              <Shield className="w-4 h-4" />
              سیستەم
            </TabsTrigger>
          </TabsList>

          <TabsContent value="identity">
            <Card className="border-none shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b">
                <CardTitle>ناسنامەی ئەپلیکەیشن</CardTitle>
                <CardDescription>ڕێکخستنی ناو و لۆگۆی ئەپلیکەیشن</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="app_title">ناونیشانی ئەپ</Label>
                  <Input
                    id="app_title"
                    value={settings.app_title}
                    onChange={(e) => handleChange('app_title', e.target.value)}
                    placeholder="سیستەمی بەڕێوەبردنی خەرجی"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="app_description">وەسفی ئەپ</Label>
                  <Input
                    id="app_description"
                    value={settings.app_description}
                    onChange={(e) => handleChange('app_description', e.target.value)}
                    placeholder="کۆمپانیای کرێی ئامێرەکان"
                  />
                </div>

                <div className="space-y-2">
                  <Label>لۆگۆی کۆمپانیا</Label>
                  <div className="flex items-center gap-4">
                    {settings.app_logo_url && (
                      <img 
                        src={settings.app_logo_url} 
                        alt="Logo" 
                        className="w-20 h-20 object-contain border rounded-lg p-2"
                      />
                    )}
                    <div className="flex-1">
                      <Label htmlFor="logo-upload" className="cursor-pointer">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-emerald-500 transition-colors text-center">
                          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm text-gray-600">کلیک بکە بۆ بارکردنی لۆگۆ</p>
                          <p className="text-xs text-gray-400 mt-1">PNG, JPG یان SVG</p>
                        </div>
                      </Label>
                      <input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                  {settings.app_logo_url && (
                    <Input
                      value={settings.app_logo_url}
                      onChange={(e) => handleChange('app_logo_url', e.target.value)}
                      placeholder="URL ی لۆگۆ"
                      className="mt-2"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label>فەیڤیکۆن (Favicon)</Label>
                  <div className="flex items-center gap-4">
                    {settings.app_favicon_url && (
                      <img 
                        src={settings.app_favicon_url} 
                        alt="Favicon" 
                        className="w-8 h-8 object-contain border rounded p-1"
                      />
                    )}
                    <div className="flex-1">
                      <Label htmlFor="favicon-upload" className="cursor-pointer">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-emerald-500 transition-colors text-center">
                          <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm text-gray-600">کلیک بکە بۆ بارکردنی فەیڤیکۆن</p>
                          <p className="text-xs text-gray-400 mt-1">ICO, PNG (16x16 یان 32x32)</p>
                        </div>
                      </Label>
                      <input
                        id="favicon-upload"
                        type="file"
                        accept="image/x-icon,image/png"
                        onChange={handleFaviconUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                  {settings.app_favicon_url && (
                    <Input
                      value={settings.app_favicon_url}
                      onChange={(e) => handleChange('app_favicon_url', e.target.value)}
                      placeholder="URL ی فەیڤیکۆن"
                      className="mt-2"
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="company">
            <Card className="border-none shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b">
                <CardTitle>زانیاری کۆمپانیا</CardTitle>
                <CardDescription>زانیاری کۆمپانیا بۆ چاپکردن و ڕاپۆرتەکان</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="company_name">ناوی کۆمپانیا</Label>
                  <Input
                    id="company_name"
                    value={settings.company_name}
                    onChange={(e) => handleChange('company_name', e.target.value)}
                    placeholder="نەسرەدین رۆژبەیانی"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_tagline">وشەی یەکەم</Label>
                  <Input
                    id="company_tagline"
                    value={settings.company_tagline}
                    onChange={(e) => handleChange('company_tagline', e.target.value)}
                    placeholder="کۆمپانیای کرێی ئامێرەکان"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_address">ناونیشان</Label>
                  <Textarea
                    id="company_address"
                    value={settings.company_address}
                    onChange={(e) => handleChange('company_address', e.target.value)}
                    placeholder="ناونیشانی کۆمپانیا"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company_phone">ژمارەی تەلەفۆن</Label>
                    <Input
                      id="company_phone"
                      value={settings.company_phone}
                      onChange={(e) => handleChange('company_phone', e.target.value)}
                      placeholder="+964 750 123 4567"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company_email">ئیمەیڵ</Label>
                    <Input
                      id="company_email"
                      type="email"
                      value={settings.company_email}
                      onChange={(e) => handleChange('company_email', e.target.value)}
                      placeholder="info@company.com"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="defaults">
            <Card className="border-none shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b">
                <CardTitle>ڕێکخستنە بنەڕەتییەکان</CardTitle>
                <CardDescription>ڕێکخستنی بەهاکانی بنەڕەتی</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="default_currency">دراوی بنەڕەتی</Label>
                  <Select 
                    value={settings.default_currency} 
                    onValueChange={(value) => handleChange('default_currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IQD">دیناری عێراقی (IQD)</SelectItem>
                      <SelectItem value="USD">دۆلاری ئەمریکی (USD)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="items_per_page">ژمارەی تۆمار لە هەر لاپەڕەیەکدا</Label>
                  <Select 
                    value={settings.items_per_page} 
                    onValueChange={(value) => handleChange('items_per_page', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system">
            <Card className="border-none shadow-lg">
              <CardHeader className="bg-gradient-to-r from-red-50 to-red-100 border-b">
                <CardTitle>ڕێکخستنەکانی سیستەم</CardTitle>
                <CardDescription>ڕێکخستنە ئەمنییەتی و بەڕێوەبردنەکان</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="admin_email">ئیمەیڵی بەڕێوەبەر</Label>
                  <Input
                    id="admin_email"
                    type="email"
                    value={settings.admin_email}
                    onChange={(e) => handleChange('admin_email', e.target.value)}
                    placeholder="admin@company.com"
                  />
                  <p className="text-xs text-gray-500">
                    ئەم ئیمەیڵە وەک بەڕێوەبەری سەرەکی ناسراوە
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delete_pin">پینکۆدی سڕینەوەی هەمیشەیی</Label>
                  <Input
                    id="delete_pin"
                    type="password"
                    value={settings.delete_pin}
                    onChange={(e) => handleChange('delete_pin', e.target.value)}
                    placeholder="لانیکەم 4 ژمارە"
                  />
                  <p className="text-xs text-gray-500">
                    ئەم پینکۆدە بۆ سڕینەوەی هەمیشەیی تۆمارەکان پێویستە
                  </p>
                </div>

                <Alert className="bg-amber-50 border-amber-200">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    <strong>ئاگاداربە:</strong> گۆڕینی ئەم ڕێکخستنانە کاریگەری لەسەر سیستەم دەبێت. دڵنیابە لە ئەوەی کە دەزانیت چی دەکەیت.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
