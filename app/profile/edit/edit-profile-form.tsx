
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, ArrowLeft, Home, Save, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface EditProfileFormProps {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    middleInitial?: string | null;
    namePrefix?: string | null;
    nameSuffix?: string | null;
    dateOfBirth: Date;
    zipCode: string;
    phoneNumber?: string | null;
    englishFirst?: boolean | null;
    educationLevel?: string | null;
    email: string;
  };
}

export default function EditProfileForm({ user }: EditProfileFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    middleInitial: user.middleInitial || '',
    namePrefix: user.namePrefix || '',
    nameSuffix: user.nameSuffix || '',
    phoneNumber: user.phoneNumber || '',
    englishFirst: user.englishFirst === null ? '' : (user.englishFirst ?? false).toString(),
    educationLevel: user.educationLevel || '',
    zipCode: user.zipCode
  });

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const numbers = value.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 6) {
      return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    } else {
      return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
    }
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    handleInputChange('phoneNumber', formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setSuccess('Profile updated successfully!');
      toast.success('Profile updated successfully!');
      
      // Redirect to profile page after successful update
      setTimeout(() => {
        router.push('/profile');
      }, 1500);

    } catch (err: any) {
      setError(err.message || 'An error occurred while updating your profile');
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <main className="container mx-auto px-4 max-w-4xl py-8">
      {/* Navigation */}
      <div className="flex gap-2 mb-6">
        <Button asChild variant="outline" size="sm">
          <Link href="/profile" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Profile
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <User className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Edit Profile</h1>
          <p className="text-muted-foreground">Update your account information</p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Update your personal details. Fields marked with * are required.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Name Prefix */}
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="namePrefix">Prefix</Label>
                <Select value={formData.namePrefix} onValueChange={(value) => handleInputChange('namePrefix', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select prefix" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    <SelectItem value="Mr.">Mr.</SelectItem>
                    <SelectItem value="Ms.">Ms.</SelectItem>
                    <SelectItem value="Mrs.">Mrs.</SelectItem>
                    <SelectItem value="Dr.">Dr.</SelectItem>
                    <SelectItem value="Prof.">Prof.</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="middleInitial">Middle Initial</Label>
                <Input
                  id="middleInitial"
                  value={formData.middleInitial}
                  onChange={(e) => handleInputChange('middleInitial', e.target.value.slice(0, 1))}
                  maxLength={1}
                />
              </div>

              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Name Suffix */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nameSuffix">Suffix</Label>
                <Select value={formData.nameSuffix} onValueChange={(value) => handleInputChange('nameSuffix', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select suffix" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    <SelectItem value="Jr.">Jr.</SelectItem>
                    <SelectItem value="Sr.">Sr.</SelectItem>
                    <SelectItem value="II">II</SelectItem>
                    <SelectItem value="III">III</SelectItem>
                    <SelectItem value="IV">IV</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Date of Birth</Label>
                <Input 
                  value={formatDate(user.dateOfBirth)} 
                  disabled 
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Date of birth cannot be changed. Contact your administrator if this needs updating.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>
              Update your contact details and location information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="(555) 123-4567"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Optional. Format: (XXX) XXX-XXXX
                </p>
              </div>

              <div>
                <Label htmlFor="zipCode">ZIP Code *</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value.replace(/\D/g, '').slice(0, 5))}
                  placeholder="12345"
                  maxLength={5}
                  required
                />
              </div>
            </div>

            <div>
              <Label>Email Address</Label>
              <Input value={user.email} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground mt-1">
                Email address cannot be changed. Contact your administrator if this needs updating.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
            <CardDescription>
              Optional information that helps us provide better service.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* English as First Language */}
            <div>
              <Label className="text-base font-medium">Is English your first language?</Label>
              <RadioGroup 
                value={formData.englishFirst} 
                onValueChange={(value) => handleInputChange('englishFirst', value)}
                className="mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="english-yes" />
                  <Label htmlFor="english-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="english-no" />
                  <Label htmlFor="english-no">No</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="" id="english-prefer-not" />
                  <Label htmlFor="english-prefer-not">Prefer not to answer</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Education Level */}
            <div>
              <Label htmlFor="educationLevel">Highest Education Level</Label>
              <Select value={formData.educationLevel} onValueChange={(value) => handleInputChange('educationLevel', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select education level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Prefer not to answer</SelectItem>
                  <SelectItem value="Less than High School">Less than High School</SelectItem>
                  <SelectItem value="High School Diploma/GED">High School Diploma/GED</SelectItem>
                  <SelectItem value="Some College">Some College</SelectItem>
                  <SelectItem value="Associate's Degree">Associate's Degree</SelectItem>
                  <SelectItem value="Bachelor's Degree">Bachelor's Degree</SelectItem>
                  <SelectItem value="Master's Degree">Master's Degree</SelectItem>
                  <SelectItem value="Doctoral Degree">Doctoral Degree</SelectItem>
                  <SelectItem value="Professional Degree">Professional Degree</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
          
          <Button type="button" variant="outline" asChild>
            <Link href="/profile">Cancel</Link>
          </Button>
        </div>
      </form>
    </main>
  );
}
