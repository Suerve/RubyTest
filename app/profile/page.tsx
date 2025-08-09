
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  GraduationCap,
  Edit,
  Shield,
  Key
} from 'lucide-react';
import Link from 'next/link';

export default async function ProfilePage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/auth/signin');
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 max-w-4xl py-8">
        <div className="space-y-8">
          {/* Profile Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user.profileImage || undefined} alt={`${user.firstName} ${user.lastName}`} />
                  <AvatarFallback className="text-xl">
                    {getInitials(user.firstName, user.lastName)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold">
                      {user.namePrefix && `${user.namePrefix} `}
                      {user.firstName}
                      {user.middleInitial && ` ${user.middleInitial}.`}
                      {` ${user.lastName}`}
                      {user.nameSuffix && ` ${user.nameSuffix}`}
                    </h1>
                    {user.userType === 'ADMIN' && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        <Shield className="h-3 w-3 mr-1" />
                        Admin
                        {user.isPrimaryAdmin && ' (Primary)'}
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {user.email}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Member since {formatDate(user.createdAt)}
                  </p>
                </div>
                
                <Button asChild>
                  <Link href="/profile/edit">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Personal Information */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">First Name</label>
                      <p className="mt-1">{user.firstName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Last Name</label>
                      <p className="mt-1">{user.lastName}</p>
                    </div>
                    
                    {user.middleInitial && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Middle Initial</label>
                        <p className="mt-1">{user.middleInitial}</p>
                      </div>
                    )}
                    
                    {user.namePrefix && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Prefix</label>
                        <p className="mt-1">{user.namePrefix}</p>
                      </div>
                    )}
                    
                    {user.nameSuffix && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Suffix</label>
                        <p className="mt-1">{user.nameSuffix}</p>
                      </div>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                        <p className="mt-1">{formatDate(user.dateOfBirth)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">ZIP Code</label>
                        <p className="mt-1">{user.zipCode}</p>
                      </div>
                    </div>
                  </div>

                  {user.phoneNumber && (
                    <div className="flex items-center gap-2 pt-4 border-t">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
                        <p className="mt-1">{user.phoneNumber}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Additional Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    Additional Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {user.englishFirst !== null && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">English as First Language</label>
                      <p className="mt-1">{user.englishFirst ? 'Yes' : 'No'}</p>
                    </div>
                  )}
                  
                  {user.educationLevel && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Education Level</label>
                      <p className="mt-1">{user.educationLevel}</p>
                    </div>
                  )}

                  {!user.englishFirst && !user.educationLevel && (
                    <p className="text-sm text-muted-foreground italic">
                      No additional information provided. 
                      <Link href="/profile/edit" className="text-primary hover:underline ml-1">
                        Add information
                      </Link>
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Account Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/profile/change-password">
                      <Key className="h-4 w-4 mr-2" />
                      Change Password
                    </Link>
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/profile/edit">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Account Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Account Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Email Verified</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      ✓ Verified
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Profile Complete</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      ✓ Complete
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Account Type</span>
                    <Badge variant="outline">
                      {user.userType}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="ghost" className="w-full justify-start" size="sm" asChild>
                    <Link href="/dashboard">View Dashboard</Link>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" size="sm" asChild>
                    <Link href="/tests">Browse Tests</Link>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" size="sm" asChild>
                    <Link href="/tests/history">Test History</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
