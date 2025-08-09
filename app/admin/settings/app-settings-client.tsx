
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Settings, 
  Shield, 
  FileText, 
  Pause, 
  Download,
  Play,
  Eye,
  Save,
  Upload,
  X,
  Check,
  AlertTriangle,
  Info,
  Lock,
  TestTube,
  Signature,
  Image as ImageIcon,
  Activity,
  ArrowLeft
} from 'lucide-react';
import Image from 'next/image';

interface AppSettings {
  id: string;
  twoFactorEnabled: boolean;
  customSignatureEnabled: boolean;
  signatureName?: string;
  signatureTitle?: string;
  signatureImage?: string;
  testPausingEnabled: boolean;
  pdfDownloadEnabled: boolean;
  practiceTestEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export function AppSettingsClient() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    twoFactorEnabled: false,
    customSignatureEnabled: false,
    signatureName: '',
    signatureTitle: '',
    signatureImage: '',
    testPausingEnabled: true,
    pdfDownloadEnabled: true,
    practiceTestEnabled: true,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (settings) {
      const newFormData = {
        twoFactorEnabled: settings.twoFactorEnabled,
        customSignatureEnabled: settings.customSignatureEnabled,
        signatureName: settings.signatureName || '',
        signatureTitle: settings.signatureTitle || '',
        signatureImage: settings.signatureImage || '',
        testPausingEnabled: settings.testPausingEnabled,
        pdfDownloadEnabled: settings.pdfDownloadEnabled,
        practiceTestEnabled: settings.practiceTestEnabled,
      };
      setFormData(newFormData);
      setHasChanges(false); // Reset changes when settings are loaded
    }
  }, [settings]);

  // Separate useEffect to track changes between formData and settings
  useEffect(() => {
    if (settings) {
      const originalData = {
        twoFactorEnabled: settings.twoFactorEnabled,
        customSignatureEnabled: settings.customSignatureEnabled,
        signatureName: settings.signatureName || '',
        signatureTitle: settings.signatureTitle || '',
        signatureImage: settings.signatureImage || '',
        testPausingEnabled: settings.testPausingEnabled,
        pdfDownloadEnabled: settings.pdfDownloadEnabled,
        practiceTestEnabled: settings.practiceTestEnabled,
      };
      
      const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);
      setHasChanges(hasChanges);
    }
  }, [formData, settings]);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/app-settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      } else {
        toast.error('Failed to fetch app settings');
      }
    } catch (error) {
      toast.error('Error fetching settings');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/app-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
        setHasChanges(false);
        toast.success('Settings saved successfully');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to save settings');
      }
    } catch (error) {
      toast.error('Error saving settings');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('Image file too large. Please select a file under 5MB.');
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/admin/upload-signature', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({ ...prev, signatureImage: data.imageUrl }));
        setSignaturePreview(data.imageUrl);
        toast.success('Image uploaded successfully');
      } else {
        toast.error('Failed to upload image');
      }
    } catch (error) {
      toast.error('Error uploading image');
      console.error(error);
    } finally {
      setUploadingImage(false);
    }
  };

  const updateFormData = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <main className="container mx-auto px-4 max-w-4xl py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Activity className="h-8 w-8 animate-pulse mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 max-w-4xl py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Settings className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold">App Settings</h1>
            </div>
            <p className="text-muted-foreground">
              Configure global application settings and preferences
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-orange-50 text-orange-700">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Unsaved Changes
                </Badge>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button disabled={saving}>
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Settings'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Save Settings</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to save these changes? Some settings may affect all users immediately.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleSaveSettings}>
                        Save Changes
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
            <Button variant="outline" onClick={() => window.location.href = '/admin'}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Settings
            </CardTitle>
            <CardDescription>
              Configure authentication and security features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">
                  Require users to use 2FA for enhanced security
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.twoFactorEnabled}
                  onCheckedChange={(checked) => updateFormData('twoFactorEnabled', checked)}
                />
                <Badge variant={formData.twoFactorEnabled ? "default" : "secondary"}>
                  {formData.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            </div>
            
            {formData.twoFactorEnabled && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Two-Factor Authentication Enabled</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Users will be required to set up 2FA on their next login. Existing sessions will remain active until logout.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Management Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Test Management
            </CardTitle>
            <CardDescription>
              Configure test behavior and user capabilities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Test Pausing</Label>
                <p className="text-sm text-muted-foreground">
                  Allow users to pause and resume tests
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.testPausingEnabled}
                  onCheckedChange={(checked) => updateFormData('testPausingEnabled', checked)}
                />
                <Badge variant={formData.testPausingEnabled ? "default" : "secondary"}>
                  {formData.testPausingEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Practice Tests</Label>
                <p className="text-sm text-muted-foreground">
                  Enable practice mode for all test types
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.practiceTestEnabled}
                  onCheckedChange={(checked) => updateFormData('practiceTestEnabled', checked)}
                />
                <Badge variant={formData.practiceTestEnabled ? "default" : "secondary"}>
                  {formData.practiceTestEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">PDF Downloads</Label>
                <p className="text-sm text-muted-foreground">
                  Allow users to download test results as PDF
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.pdfDownloadEnabled}
                  onCheckedChange={(checked) => updateFormData('pdfDownloadEnabled', checked)}
                />
                <Badge variant={formData.pdfDownloadEnabled ? "default" : "secondary"}>
                  {formData.pdfDownloadEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Custom Signature Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Signature className="h-5 w-5" />
              Custom Signature
            </CardTitle>
            <CardDescription>
              Add a custom signature to test certificates and reports
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Custom Signature</Label>
                <p className="text-sm text-muted-foreground">
                  Enable custom signature on certificates and reports
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.customSignatureEnabled}
                  onCheckedChange={(checked) => updateFormData('customSignatureEnabled', checked)}
                />
                <Badge variant={formData.customSignatureEnabled ? "default" : "secondary"}>
                  {formData.customSignatureEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            </div>

            {formData.customSignatureEnabled && (
              <div className="space-y-4 pt-4 border-t">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="signatureName">Signature Name</Label>
                    <Input
                      id="signatureName"
                      value={formData.signatureName}
                      onChange={(e) => updateFormData('signatureName', e.target.value)}
                      placeholder="e.g., Dr. John Smith"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signatureTitle">Signature Title</Label>
                    <Input
                      id="signatureTitle"
                      value={formData.signatureTitle}
                      onChange={(e) => updateFormData('signatureTitle', e.target.value)}
                      placeholder="e.g., Program Director"
                    />
                  </div>
                </div>

                <div>
                  <Label>Signature Image</Label>
                  <div className="mt-2 space-y-4">
                    {formData.signatureImage ? (
                      <div className="flex items-center gap-4">
                        <div className="relative w-48 h-24 border rounded-lg overflow-hidden bg-muted">
                          <Image
                            src={formData.signatureImage}
                            alt="Signature"
                            fill
                            className="object-contain"
                          />
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">Current signature image</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateFormData('signatureImage', '')}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                        <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-sm text-muted-foreground mb-4">
                          Upload a signature image (PNG, JPG, or SVG)
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file);
                          }}
                          className="hidden"
                          id="signature-upload"
                        />
                        <Button
                          variant="outline"
                          disabled={uploadingImage}
                          onClick={() => document.getElementById('signature-upload')?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {uploadingImage ? 'Uploading...' : 'Upload Image'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Signature Preview */}
                {(formData.signatureName || formData.signatureTitle || formData.signatureImage) && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <Label className="text-base">Signature Preview</Label>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            Full Preview
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Signature Preview</DialogTitle>
                            <DialogDescription>
                              This is how the signature will appear on certificates and reports
                            </DialogDescription>
                          </DialogHeader>
                          <div className="border rounded-lg p-8 bg-white text-center">
                            <div className="space-y-4">
                              {formData.signatureImage && (
                                <div className="relative w-64 h-32 mx-auto border-b">
                                  <Image
                                    src={formData.signatureImage}
                                    alt="Signature"
                                    fill
                                    className="object-contain"
                                  />
                                </div>
                              )}
                              {formData.signatureName && (
                                <div className="font-medium text-lg">{formData.signatureName}</div>
                              )}
                              {formData.signatureTitle && (
                                <div className="text-muted-foreground">{formData.signatureTitle}</div>
                              )}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <div className="border rounded-lg p-4 bg-muted/30">
                      <div className="text-center space-y-2">
                        {formData.signatureImage && (
                          <div className="relative w-32 h-16 mx-auto">
                            <Image
                              src={formData.signatureImage}
                              alt="Signature"
                              fill
                              className="object-contain"
                            />
                          </div>
                        )}
                        {formData.signatureName && (
                          <div className="font-medium text-sm">{formData.signatureName}</div>
                        )}
                        {formData.signatureTitle && (
                          <div className="text-xs text-muted-foreground">{formData.signatureTitle}</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Settings Summary */}
        {settings && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Settings Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">LAST UPDATED</Label>
                  <p className="font-medium">{new Date(settings.updatedAt).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">CREATED</Label>
                  <p className="font-medium">{new Date(settings.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
