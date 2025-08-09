
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Logo } from '@/components/ui/logo';
import { Calendar, MapPin, User, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const educationLevels = [
  'Less than high school',
  'High school diploma or equivalent',
  'Some college, no degree',
  'Associate degree',
  'Bachelor\'s degree',
  'Master\'s degree',
  'Professional degree',
  'Doctorate degree'
];

const namePrefixes = [
  'Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Prof.', 'Rev.'
];

const nameSuffixes = [
  'Jr.', 'Sr.', 'II', 'III', 'IV', 'V'
];

export default function CompleteProfilePage() {
  const { data: session, status, update } = useSession();
  const [formData, setFormData] = useState({
    namePrefix: '',
    middleInitial: '',
    nameSuffix: '',
    dateOfBirth: '',
    zipCode: '',
    phoneNumber: '',
    englishFirst: '',
    educationLevel: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const isFormValid = () => {
    return (
      formData.dateOfBirth &&
      formData.zipCode &&
      formData.zipCode.length === 5
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      setError('Please fill in all required fields correctly');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'An error occurred');
      } else {
        await update();
        toast.success('Profile completed successfully!');
        router.push('/dashboard');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-4">
          <Logo type="horizontal" size="lg" className="mx-auto" />
          <div>
            <h1 className="text-2xl font-bold">Complete Your Profile</h1>
            <p className="text-muted-foreground">Help us personalize your experience</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Please provide the required information to complete your account setup.
              Required fields are marked with *
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Name Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Name Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="namePrefix">Prefix (Optional)</Label>
                    <Select value={formData.namePrefix} onValueChange={(value) => handleChange('namePrefix', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select prefix" />
                      </SelectTrigger>
                      <SelectContent>
                        {namePrefixes.map((prefix) => (
                          <SelectItem key={prefix} value={prefix}>
                            {prefix}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="middleInitial">Middle Initial (Optional)</Label>
                    <Input
                      id="middleInitial"
                      maxLength={1}
                      placeholder="M"
                      value={formData.middleInitial}
                      onChange={(e) => handleChange('middleInitial', e.target.value.toUpperCase())}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nameSuffix">Suffix (Optional)</Label>
                    <Select value={formData.nameSuffix} onValueChange={(value) => handleChange('nameSuffix', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select suffix" />
                      </SelectTrigger>
                      <SelectContent>
                        {nameSuffixes.map((suffix) => (
                          <SelectItem key={suffix} value={suffix}>
                            {suffix}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Required Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Required Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Date of Birth *
                    </Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      max={new Date(Date.now() - 13 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                      value={formData.dateOfBirth}
                      onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zipCode" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      ZIP Code *
                    </Label>
                    <Input
                      id="zipCode"
                      placeholder="12345"
                      pattern="[0-9]{5}"
                      maxLength={5}
                      value={formData.zipCode}
                      onChange={(e) => handleChange('zipCode', e.target.value.replace(/\D/g, ''))}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              {/* Optional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Optional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={formData.phoneNumber}
                      onChange={(e) => handleChange('phoneNumber', e.target.value)}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="englishFirst">Is English your first language?</Label>
                    <Select value={formData.englishFirst} onValueChange={(value) => handleChange('englishFirst', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="educationLevel">Highest Level of Education Completed</Label>
                  <Select value={formData.educationLevel} onValueChange={(value) => handleChange('educationLevel', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select education level" />
                    </SelectTrigger>
                    <SelectContent>
                      {educationLevels.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !isFormValid()}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Completing profile...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Complete Profile
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
