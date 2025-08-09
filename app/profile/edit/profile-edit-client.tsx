
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  ArrowLeft, 
  Save, 
  Shield,
  Info,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  namePrefix?: string | null;
  middleInitial?: string | null;
  nameSuffix?: string | null;
  dateOfBirth: Date;
  zipCode: string;
  phoneNumber?: string | null;
  englishFirst?: boolean | null;
  educationLevel?: string | null;
  userType: string;
}

interface ProfileEditClientProps {
  user: User;
}

export function ProfileEditClient({ user }: ProfileEditClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    namePrefix: user.namePrefix || '',
    middleInitial: user.middleInitial || '',
    nameSuffix: user.nameSuffix || '',
    dateOfBirth: user.dateOfBirth.toISOString().split('T')[0],
    zipCode: user.zipCode,
    phoneNumber: user.phoneNumber || '',
    englishFirst: user.englishFirst?.toString() || '',
    educationLevel: user.educationLevel || ''
  });

  const isAdmin = user.userType === 'ADMIN';

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('Profile updated successfully');
        router.push('/profile');
        router.refresh();
      } else {
        toast.error(data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="container mx-auto px-4 max-w-2xl py-8">
      <div className="mb-6">
        <Button asChild variant="outline" size="sm">
          <Link href="/profile" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Profile
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-3 mb-8">
        <User className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Edit Profile</h1>
          <p className="text-muted-foreground">Update your account information</p>
        </div>
      </div>

      {!isAdmin && (
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Some fields like date of birth and language preference are restricted and can only be modified by administrators.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Update your name and personal details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="namePrefix">Prefix</Label>
                  <Select value={formData.namePrefix} onValueChange={(value) => handleInputChange('namePrefix', value)} disabled={isLoading}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select prefix" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      <SelectItem value="Mr.">Mr.</SelectItem>
                      <SelectItem value="Mrs.">Mrs.</SelectItem>
                      <SelectItem value="Ms.">Ms.</SelectItem>
                      <SelectItem value="Dr.">Dr.</SelectItem>
                      <SelectItem value="Prof.">Prof.</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="middleInitial">Middle Initial</Label>
                  <Input
                    id="middleInitial"
                    value={formData.middleInitial}
                    onChange={(e) => handleInputChange('middleInitial', e.target.value.substring(0, 1).toUpperCase())}
                    maxLength={1}
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label htmlFor="nameSuffix">Suffix</Label>
                  <Select value={formData.nameSuffix} onValueChange={(value) => handleInputChange('nameSuffix', value)} disabled={isLoading}>
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
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>
                Update your location and contact details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="zipCode">ZIP Code *</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => handleInputChange('zipCode', e.target.value)}
                    pattern="\d{5}"
                    maxLength={5}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    placeholder="(555) 123-4567"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
              <CardDescription>
                Optional personal and educational details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="educationLevel">Education Level</Label>
                <Select value={formData.educationLevel} onValueChange={(value) => handleInputChange('educationLevel', value)} disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select education level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Prefer not to say</SelectItem>
                    <SelectItem value="Less than High School">Less than High School</SelectItem>
                    <SelectItem value="High School Diploma/GED">High School Diploma/GED</SelectItem>
                    <SelectItem value="Some College">Some College</SelectItem>
                    <SelectItem value="Associate Degree">Associate Degree</SelectItem>
                    <SelectItem value="Bachelor's Degree">Bachelor's Degree</SelectItem>
                    <SelectItem value="Master's Degree">Master's Degree</SelectItem>
                    <SelectItem value="Doctoral Degree">Doctoral Degree</SelectItem>
                    <SelectItem value="Professional Degree">Professional Degree</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Admin-Only Fields */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Administrative Fields
                {!isAdmin && (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                    <Shield className="h-3 w-3 mr-1" />
                    Admin Only
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {isAdmin ? 
                  "These fields require administrative privileges to modify" :
                  "Contact your administrator to update these fields"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    disabled={!isAdmin || isLoading}
                    className={!isAdmin ? "bg-muted" : ""}
                  />
                  {!isAdmin && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Contact administrator to change
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="englishFirst">English as First Language</Label>
                  <Select 
                    value={formData.englishFirst} 
                    onValueChange={(value) => handleInputChange('englishFirst', value)}
                    disabled={!isAdmin || isLoading}
                  >
                    <SelectTrigger className={!isAdmin ? "bg-muted" : ""}>
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Prefer not to say</SelectItem>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                  {!isAdmin && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Contact administrator to change
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
            
            <Button type="button" variant="outline" asChild className="flex-1">
              <Link href="/profile">Cancel</Link>
            </Button>
          </div>
        </div>
      </form>
    </main>
  );
}
