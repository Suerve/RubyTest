
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Edit, 
  Trash2, 
  Key, 
  Shield, 
  Search, 
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  User,
  Mail,
  Phone,
  Calendar,
  ChevronDown,
  ChevronUp,
  MapPin,
  GraduationCap,
  Globe,
  UserCheck,
  UserX,
  AlertTriangle,
  Crown,
  Lock,
  UserPlus,
  MailCheck
} from 'lucide-react';
import Link from 'next/link';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  middleInitial?: string;
  namePrefix?: string;
  nameSuffix?: string;
  email: string;
  emailVerified?: string;
  phoneNumber?: string;
  dateOfBirth: string;
  zipCode: string;
  englishFirst?: boolean;
  educationLevel?: string;
  profileImage?: string;
  userType: 'USER' | 'ADMIN';
  isPrimaryAdmin?: boolean;
  isDeactivated?: boolean;
  requirePasswordChange?: boolean;
  createdAt: string;
  user_test_access?: Array<{
    id: string;
    accessType: 'NONE' | 'ONE_TIME' | 'UNLIMITED';
    test_types: {
      id: string;
      name: string;
      displayName: string;
    };
    grantedAt: string;
  }>;
  tests?: Array<{
    id: string;
    status: string;
    createdAt: string;
    test_types: {
      displayName: string;
    };
  }>;
  test_requests?: Array<{
    id: string;
    status: string;
  }>;
  _count?: {
    tests: number;
    test_requests: number;
  };
}

interface TestType {
  id: string;
  name: string;
  displayName: string;
}

interface UserChanges {
  profile: Partial<User>;
  testAccess: {
    [testTypeId: string]: 'NONE' | 'ONE_TIME' | 'UNLIMITED';
  };
}

// Helper function to determine if user account is active
function isUserActive(user: User): boolean {
  return !!user.emailVerified;
}

export function UserManagementClient() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [testTypes, setTestTypes] = useState<TestType[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [includeAdmins, setIncludeAdmins] = useState(false);
  const [includeInactive, setIncludeInactive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [originalEditingUser, setOriginalEditingUser] = useState<User | null>(null);
  const [userChanges, setUserChanges] = useState<UserChanges>({ profile: {}, testAccess: {} });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showAdvancedProfile, setShowAdvancedProfile] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [createCodeUser, setCreateCodeUser] = useState<User | null>(null);
  const [selectedTestType, setSelectedTestType] = useState('');
  const [codeExpiration, setCodeExpiration] = useState('24');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [codeDialogOpen, setCodeDialogOpen] = useState(false);
  
  // New user creation state
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    dateOfBirth: '',
    zipCode: '',
    userType: 'USER' as 'USER' | 'ADMIN',
    tempPassword: '',
    requirePasswordChange: true
  });
  
  // Primary admin confirmation state
  const [primaryAdminConfirmDialogOpen, setPrimaryAdminConfirmDialogOpen] = useState(false);
  const [primaryAdminAction, setPrimaryAdminAction] = useState<{user: User, action: 'grant' | 'revoke'} | null>(null);

  useEffect(() => {
    fetchUsers();
    fetchTestTypes();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [includeAdmins]);

  useEffect(() => {
    // Filter users based on search term and active status
    let filtered = users || [];
    
    // Filter by active status if not including inactive users
    if (!includeInactive) {
      filtered = filtered.filter(user => isUserActive(user));
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user?.firstName?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
        user?.lastName?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
        user?.email?.toLowerCase()?.includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredUsers(filtered);
  }, [users, searchTerm, includeInactive]);

  const fetchUsers = async () => {
    try {
      const url = `/api/admin/users${includeAdmins ? '?includeAdmins=true' : ''}`;
      const response = await fetch(url);
      const data = await response.json();
      
      // Ensure all users have proper array defaults
      const usersWithDefaults = (data.users || []).map((user: any) => ({
        ...user,
        user_test_access: user.user_test_access || [],
        tests: user.tests || [],
        test_requests: user.test_requests || [],
        _count: user._count || { tests: 0, test_requests: 0 }
      }));
      
      setUsers(usersWithDefaults);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchTestTypes = async () => {
    try {
      const response = await fetch('/api/admin/test-types');
      const data = await response.json();
      setTestTypes(data.testTypes || []);
    } catch (error) {
      console.error('Error fetching test types:', error);
    }
  };

  // Helper functions for change tracking
  const resetChanges = () => {
    setUserChanges({ profile: {}, testAccess: {} });
    setHasUnsavedChanges(false);
    setEditingUser(originalEditingUser ? { ...originalEditingUser } : null);
  };

  const trackProfileChange = (field: keyof User, value: any) => {
    if (!editingUser || !originalEditingUser) return;
    
    const newProfile = { ...userChanges.profile, [field]: value };
    const newUserChanges = { ...userChanges, profile: newProfile };
    
    // Update the editing user state
    setEditingUser({ ...editingUser, [field]: value });
    
    // Track the change
    setUserChanges(newUserChanges);
    
    // Check if there are any changes
    const hasProfileChanges = Object.keys(newProfile).some(key => 
      newProfile[key as keyof User] !== originalEditingUser[key as keyof User]
    );
    const hasAccessChanges = Object.keys(userChanges.testAccess).length > 0;
    setHasUnsavedChanges(hasProfileChanges || hasAccessChanges);
  };

  const trackTestAccessChange = (testTypeId: string, accessType: 'NONE' | 'ONE_TIME' | 'UNLIMITED') => {
    if (!originalEditingUser) return;
    
    const originalAccessRecord = originalEditingUser.user_test_access?.find(
      access => access.test_types.id === testTypeId
    );
    const originalAccessType = originalAccessRecord?.accessType ?? 'NONE';
    
    const newTestAccess = { ...userChanges.testAccess };
    
    if (accessType !== originalAccessType) {
      newTestAccess[testTypeId] = accessType;
    } else {
      delete newTestAccess[testTypeId];
    }
    
    const newUserChanges = { ...userChanges, testAccess: newTestAccess };
    setUserChanges(newUserChanges);
    
    // Check if there are any changes
    const hasProfileChanges = Object.keys(userChanges.profile).length > 0;
    const hasAccessChanges = Object.keys(newTestAccess).length > 0;
    setHasUnsavedChanges(hasProfileChanges || hasAccessChanges);
  };

  const startEditingUser = (user: User) => {
    setEditingUser({ ...user });
    setOriginalEditingUser({ ...user });
    setUserChanges({ profile: {}, testAccess: {} });
    setHasUnsavedChanges(false);
    setShowAdvancedProfile(false);
    setEditDialogOpen(true);
  };

  const cancelEditingUser = () => {
    if (hasUnsavedChanges) {
      // Don't show confirmation dialog, just reset
      resetChanges();
    }
    setEditingUser(null);
    setOriginalEditingUser(null);
    setShowAdvancedProfile(false);
    setEditDialogOpen(false);
  };

  const handleUpdateUser = async () => {
    if (!editingUser || !originalEditingUser) return;

    try {
      // Apply profile changes
      if (Object.keys(userChanges.profile).length > 0) {
        const profileData = {
          firstName: editingUser.firstName,
          lastName: editingUser.lastName,
          middleInitial: editingUser.middleInitial,
          namePrefix: editingUser.namePrefix,
          nameSuffix: editingUser.nameSuffix,
          email: editingUser.email,
          phoneNumber: editingUser.phoneNumber,
          dateOfBirth: editingUser.dateOfBirth,
          zipCode: editingUser.zipCode,
          englishFirst: editingUser.englishFirst,
          educationLevel: editingUser.educationLevel,
          isPrimaryAdmin: editingUser.isPrimaryAdmin,
          isDeactivated: editingUser.isDeactivated,
          requirePasswordChange: editingUser.requirePasswordChange,
        };

        const response = await fetch(`/api/admin/users/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profileData)
        });

        if (!response.ok) {
          throw new Error('Failed to update user profile');
        }
      }

      // Apply test access changes
      for (const [testTypeId, accessType] of Object.entries(userChanges.testAccess)) {
        const response = await fetch(`/api/admin/users/${editingUser.id}/set-access`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ testTypeId, accessType })
        });

        if (!response.ok) {
          throw new Error('Failed to update test access');
        }
      }

      toast.success('User updated successfully');
      setEditingUser(null);
      setOriginalEditingUser(null);
      setEditDialogOpen(false);
      resetChanges();
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    }
  };

  const startResetPassword = (user: User) => {
    setResetPasswordUser(user);
    setNewPassword('');
    setResetDialogOpen(true);
  };

  const cancelResetPassword = () => {
    setResetPasswordUser(null);
    setNewPassword('');
    setResetDialogOpen(false);
  };

  const handleResetPassword = async () => {
    if (!resetPasswordUser || !newPassword) return;

    try {
      const response = await fetch(`/api/admin/users/${resetPasswordUser.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          newPassword,
          temporaryPassword: true
        })
      });

      if (response.ok) {
        toast.success('Password reset successfully');
        cancelResetPassword();
      } else {
        throw new Error('Failed to reset password');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('Failed to reset password');
    }
  };

  const startCreateCode = (user: User) => {
    setCreateCodeUser(user);
    setSelectedTestType('');
    setCodeExpiration('24');
    setCodeDialogOpen(true);
  };

  const cancelCreateCode = () => {
    setCreateCodeUser(null);
    setSelectedTestType('');
    setCodeExpiration('24');
    setCodeDialogOpen(false);
  };

  const handleCreateOneTimeCode = async () => {
    if (!createCodeUser || !selectedTestType) return;

    try {
      const response = await fetch('/api/admin/users/one-time-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testTypeId: selectedTestType,
          expiresIn: parseInt(codeExpiration)
        })
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(`One-time code created: ${data.oneTimeCode.code}`);
        cancelCreateCode();
      } else {
        throw new Error(data.error || 'Failed to create code');
      }
    } catch (error) {
      console.error('Error creating one-time code:', error);
      toast.error('Failed to create one-time code');
    }
  };

  const handleStartImpersonation = async (user: User) => {
    if (!session?.user || session.user.userType !== 'ADMIN') {
      toast.error('Admin access required');
      return;
    }

    // Prevent self-impersonation
    if (user.id === session.user.id) {
      toast.error('Cannot impersonate yourself');
      return;
    }

    // Only primary admin can impersonate other admins
    if (user.userType === 'ADMIN' && !session.user.isPrimaryAdmin) {
      toast.error('Only primary admin can impersonate other administrators');
      return;
    }

    if (!user.emailVerified) {
      toast.error('Cannot impersonate unverified users');
      return;
    }

    try {
      const response = await fetch('/api/admin/impersonate/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });

      const data = await response.json();
      if (response.ok) {
        // Store impersonation data temporarily and redirect
        sessionStorage.setItem('impersonationData', JSON.stringify(data.impersonationData));
        toast.success(`Acting as ${user.firstName} ${user.lastName}`);
        
        // Close the edit dialog
        setEditDialogOpen(false);
        setEditingUser(null);
        
        // Redirect to trigger session update
        window.location.href = '/dashboard?impersonate=start';
      } else {
        throw new Error(data.error || 'Failed to start impersonation');
      }
    } catch (error) {
      console.error('Error starting impersonation:', error);
      toast.error('Failed to start impersonation');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('User deleted successfully');
        fetchUsers();
      } else {
        throw new Error('Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  // Helper functions for access control
  const isPrimaryAdmin = (): boolean => {
    return session?.user?.isPrimaryAdmin === true;
  };

  const canManageUser = (targetUser: User): boolean => {
    if (!session?.user) return false;
    
    // Primary admin can manage anyone
    if (isPrimaryAdmin()) return true;
    
    // Regular admin can only manage regular users
    if (session.user.userType === 'ADMIN' && targetUser.userType === 'USER') return true;
    
    return false;
  };

  const canDeleteUser = (targetUser: User): boolean => {
    if (!session?.user) return false;
    
    // Only primary admin can delete admin accounts
    if (targetUser.userType === 'ADMIN' && !isPrimaryAdmin()) return false;
    
    return canManageUser(targetUser);
  };

  // Account deactivation handler
  const handleToggleDeactivation = async (user: User) => {
    if (!canManageUser(user)) {
      toast.error('Insufficient permissions to modify this user');
      return;
    }

    const newStatus = !user.isDeactivated;
    
    try {
      const response = await fetch(`/api/admin/users/${user.id}/toggle-deactivation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDeactivated: newStatus })
      });

      if (response.ok) {
        toast.success(newStatus ? 'User account deactivated' : 'User account activated');
        // Update the user in the edit dialog if it's the same user
        if (editingUser?.id === user.id) {
          trackProfileChange('isDeactivated', newStatus);
        }
        fetchUsers();
      } else {
        throw new Error('Failed to toggle user deactivation');
      }
    } catch (error) {
      console.error('Error toggling user deactivation:', error);
      toast.error('Failed to update user status');
    }
  };

  // Password change requirement handler
  const handleTogglePasswordChange = async (user: User) => {
    if (!canManageUser(user)) {
      toast.error('Insufficient permissions to modify this user');
      return;
    }

    const newStatus = !user.requirePasswordChange;
    
    try {
      const response = await fetch(`/api/admin/users/${user.id}/toggle-password-change`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requirePasswordChange: newStatus })
      });

      if (response.ok) {
        toast.success(newStatus ? 'User will be required to change password at next login' : 'Password change requirement removed');
        // Update the user in the edit dialog if it's the same user
        if (editingUser?.id === user.id) {
          trackProfileChange('requirePasswordChange', newStatus);
        }
        fetchUsers();
      } else {
        throw new Error('Failed to toggle password change requirement');
      }
    } catch (error) {
      console.error('Error toggling password change requirement:', error);
      toast.error('Failed to update password change requirement');
    }
  };

  // Primary admin management with confirmation
  const initiatePrimaryAdminToggle = (user: User) => {
    if (!isPrimaryAdmin()) {
      toast.error('Only primary admin can modify admin privileges');
      return;
    }

    const action = user.isPrimaryAdmin ? 'revoke' : 'grant';
    setPrimaryAdminAction({ user, action });
    setPrimaryAdminConfirmDialogOpen(true);
  };

  const handleConfirmPrimaryAdminToggle = async () => {
    if (!primaryAdminAction) return;

    const { user, action } = primaryAdminAction;
    const newStatus = action === 'grant';
    
    try {
      const response = await fetch(`/api/admin/users/${user.id}/toggle-primary-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPrimaryAdmin: newStatus })
      });

      if (response.ok) {
        toast.success(newStatus ? 'Primary admin privileges granted' : 'Primary admin privileges revoked');
        // Update the user in the edit dialog if it's the same user
        if (editingUser?.id === user.id) {
          trackProfileChange('isPrimaryAdmin', newStatus);
        }
        fetchUsers();
      } else {
        throw new Error('Failed to toggle primary admin status');
      }
    } catch (error) {
      console.error('Error toggling primary admin status:', error);
      toast.error('Failed to update admin privileges');
    } finally {
      setPrimaryAdminConfirmDialogOpen(false);
      setPrimaryAdminAction(null);
    }
  };

  // Add new user handler
  const handleAddNewUser = async () => {
    // Validate required fields
    if (!newUserData.firstName || !newUserData.lastName || !newUserData.email || 
        !newUserData.tempPassword) {
      toast.error('Please fill in all required fields');
      return;
    }

    // For non-admin users, require birthday and zip code
    if (newUserData.userType === 'USER' && (!newUserData.dateOfBirth || !newUserData.zipCode)) {
      toast.error('Date of birth and zip code are required for user accounts');
      return;
    }

    // Only primary admin can create admin accounts
    if (newUserData.userType === 'ADMIN' && !isPrimaryAdmin()) {
      toast.error('Only primary admin can create admin accounts');
      return;
    }

    try {
      const response = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUserData)
      });

      if (response.ok) {
        toast.success('User created successfully');
        setAddUserDialogOpen(false);
        resetNewUserData();
        fetchUsers();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user');
    }
  };

  const resetNewUserData = () => {
    setNewUserData({
      firstName: '',
      lastName: '',
      email: '',
      dateOfBirth: '',
      zipCode: '',
      userType: 'USER',
      tempPassword: '',
      requirePasswordChange: true
    });
  };

  if (loading) {
    return (
      <main className="container mx-auto px-4 max-w-7xl py-8">
        <div className="text-center">Loading users...</div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 max-w-7xl py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">User Management</h1>
        </div>
        <p className="text-muted-foreground">
          Manage user accounts, test access, and permissions.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="include-admins"
                checked={includeAdmins}
                onCheckedChange={setIncludeAdmins}
              />
              <Label 
                htmlFor="include-admins" 
                className="text-sm font-medium flex items-center gap-1 cursor-pointer"
              >
                <Shield className="h-4 w-4" />
                Include Admin Accounts
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="include-inactive"
                checked={includeInactive}
                onCheckedChange={setIncludeInactive}
              />
              <Label 
                htmlFor="include-inactive" 
                className="text-sm font-medium flex items-center gap-1 cursor-pointer"
              >
                <XCircle className="h-4 w-4" />
                Include Inactive Accounts
              </Label>
            </div>
            <Badge variant="outline">
              {filteredUsers?.length ?? 0} {(filteredUsers?.length ?? 0) === 1 ? 'user' : 'users'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setAddUserDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Add User
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin">
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>{includeAdmins ? 'All Users & Admins' : 'All Users'}</CardTitle>
          <CardDescription>
            Manage {includeAdmins ? 'user accounts, admin accounts,' : 'user accounts'} and their test access permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Test Access</TableHead>
                  <TableHead>Tests Taken</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers?.map((user) => (
                  <TableRow key={user.id} className={user.userType === 'ADMIN' ? 'bg-blue-50/50 border-l-4 border-l-blue-500' : ''}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          user.userType === 'ADMIN' 
                            ? 'bg-blue-100 text-blue-600' 
                            : 'bg-primary/10 text-primary'
                        }`}>
                          {user.userType === 'ADMIN' ? (
                            <Shield className="h-5 w-5" />
                          ) : (
                            <User className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {user.firstName} {user.lastName}
                            {user.userType === 'ADMIN' && (
                              <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                                <Shield className="h-3 w-3 mr-1" />
                                Admin
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ID: {user.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </div>
                        {user.phoneNumber && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {user.phoneNumber}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          {user.isDeactivated && (
                            <Badge variant="destructive" className="text-xs">
                              <UserX className="h-3 w-3 mr-1" />
                              Deactivated
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          {user.emailVerified ? (
                            <>
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              Verified
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 text-red-500" />
                              Unverified
                            </>
                          )}
                        </div>
                        {user.requirePasswordChange && (
                          <div className="flex items-center gap-1 text-xs text-orange-600">
                            <AlertTriangle className="h-3 w-3" />
                            Password change required
                          </div>
                        )}
                        {user.isPrimaryAdmin && (
                          <div className="flex items-center gap-1 text-xs text-purple-600">
                            <Crown className="h-3 w-3" />
                            Primary Admin
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {(user.user_test_access?.length ?? 0) > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {user.user_test_access?.map((access) => {
                              // Determine background color based on access type
                              let bgColor = '';
                              let textColor = '';
                              let borderColor = '';
                              
                              switch (access.accessType) {
                                case 'ONE_TIME':
                                  bgColor = 'bg-[#f8951d]/10';
                                  textColor = 'text-[#f8951d]';
                                  borderColor = 'border-[#f8951d]/30';
                                  break;
                                case 'UNLIMITED':
                                  bgColor = 'bg-[#c4d600]/10';
                                  textColor = 'text-[#c4d600]';
                                  borderColor = 'border-[#c4d600]/30';
                                  break;
                                default:
                                  bgColor = 'bg-[#8a8a8d]/10';
                                  textColor = 'text-[#8a8a8d]';
                                  borderColor = 'border-[#8a8a8d]/30';
                              }
                              
                              return (
                                <Badge 
                                  key={access.id} 
                                  variant="outline" 
                                  className={`text-xs ${bgColor} ${textColor} ${borderColor}`}
                                >
                                  {access.test_types.displayName}
                                  {access.accessType === 'ONE_TIME' && ' (One-time)'}
                                </Badge>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">No access</span>
                        )}
                        {(user.test_requests?.length ?? 0) > 0 && (
                          <div className="flex items-center gap-1 text-xs text-orange-600">
                            <Clock className="h-3 w-3" />
                            {user.test_requests?.length ?? 0} pending request(s)
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{user._count?.tests ?? 0}</div>
                        {(user.tests?.length ?? 0) > 0 && (
                          <div className="text-xs text-muted-foreground">
                            Latest: {user.tests?.[0]?.test_types?.displayName}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <TooltipProvider>
                        <div className="flex items-center justify-end gap-1">
                          {/* Act as User - moved from dialog header */}
                          {user.id !== session?.user?.id && // Prevent self-impersonation
                           user.emailVerified && !user.isDeactivated && canManageUser(user) && 
                           (user.userType !== 'ADMIN' || session?.user?.isPrimaryAdmin) && ( // Only primary admin can impersonate other admins
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleStartImpersonation(user)}
                                >
                                  <UserCheck className="h-4 w-4 text-blue-600" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Act as this user</p>
                              </TooltipContent>
                            </Tooltip>
                          )}

                          {/* Edit User */}
                          {canManageUser(user) && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => startEditingUser(user)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Edit user profile and permissions</p>
                              </TooltipContent>
                            </Tooltip>
                          )}

                          {/* Toggle Account Deactivation */}
                          {canManageUser(user) && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleToggleDeactivation(user)}
                                >
                                  <UserX className={`h-4 w-4 ${user.isDeactivated ? 'text-green-600' : 'text-orange-600'}`} />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{user.isDeactivated ? 'Activate account' : 'Deactivate account'}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}

                          {/* Toggle Password Change Requirement */}
                          {canManageUser(user) && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleTogglePasswordChange(user)}
                                >
                                  <Lock className={`h-4 w-4 ${user.requirePasswordChange ? 'text-orange-600' : 'text-gray-400'}`} />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{user.requirePasswordChange ? 'Remove password change requirement' : 'Require password change at next login'}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}

                          {/* Toggle Primary Admin */}
                          {user.userType === 'ADMIN' && isPrimaryAdmin() && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => initiatePrimaryAdminToggle(user)}
                                >
                                  <Crown className={`h-4 w-4 ${user.isPrimaryAdmin ? 'text-purple-600' : 'text-gray-400'}`} />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{user.isPrimaryAdmin ? 'Revoke primary admin privileges' : 'Grant primary admin privileges'}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}

                          {/* Reset Password */}
                          {canManageUser(user) && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => startResetPassword(user)}
                                >
                                  <Key className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Reset user password</p>
                              </TooltipContent>
                            </Tooltip>
                          )}

                          {/* Create One-Time Code */}
                          {user.userType !== 'ADMIN' && canManageUser(user) && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => startCreateCode(user)}
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Generate one-time access code</p>
                              </TooltipContent>
                            </Tooltip>
                          )}

                          {/* Delete User */}
                          {canDeleteUser(user) && (
                            <AlertDialog>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </AlertDialogTrigger>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Delete user account</p>
                                </TooltipContent>
                              </Tooltip>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete User</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete {user.firstName} {user.lastName}? 
                                    This action cannot be undone and will remove all associated test data.
                                    {user.userType === 'ADMIN' && " This will also remove their admin privileges."}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={() => handleDeleteUser(user.id)}
                                  >
                                    Delete User
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          )}
                        </div>
                      </TooltipProvider>
                    </TableCell>

                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {(filteredUsers?.length ?? 0) === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? 'No users found matching your search.' : 'No users found.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <div className="flex items-start justify-between pr-6">
              <div>
                <DialogTitle>Edit User</DialogTitle>
                <DialogDescription>
                  Update user information, profile details, and test access permissions
                </DialogDescription>
              </div>
              {editingUser && session?.user && (
                // Only show Act as User button if conditions are met
                (session.user.userType === 'ADMIN' && 
                 editingUser.id !== session.user.id &&
                 editingUser.emailVerified &&
                 (editingUser.userType !== 'ADMIN' || session.user.isPrimaryAdmin)) && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleStartImpersonation(editingUser)}
                    className="flex items-center gap-2 mt-1"
                  >
                    <UserCheck className="h-4 w-4" />
                    Act as User
                  </Button>
                )
              )}
            </div>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-6 overflow-y-auto max-h-[60vh] pr-2">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-foreground">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={editingUser.firstName}
                      onChange={(e) => trackProfileChange('firstName', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={editingUser.lastName}
                      onChange={(e) => trackProfileChange('lastName', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editingUser.email}
                    onChange={(e) => trackProfileChange('email', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="phoneNumber">Phone</Label>
                  <Input
                    id="phoneNumber"
                    value={editingUser.phoneNumber || ''}
                    onChange={(e) => trackProfileChange('phoneNumber', e.target.value)}
                  />
                </div>
              </div>

              {/* Administrative Controls */}
              {canManageUser(editingUser) && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Administrative Controls
                    </h3>
                    
                    {/* Account Status Toggle */}
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <UserX className="h-4 w-4" />
                          <span className="font-medium">Account Status</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {editingUser.isDeactivated ? 'Account is currently deactivated' : 'Account is currently active'}
                        </p>
                      </div>
                      <Switch
                        checked={!editingUser.isDeactivated}
                        onCheckedChange={(checked) => trackProfileChange('isDeactivated', !checked)}
                      />
                    </div>

                    {/* Password Change Requirement Toggle */}
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          <span className="font-medium">Password Change Required</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {editingUser.requirePasswordChange ? 'User must change password at next login' : 'No password change required'}
                        </p>
                      </div>
                      <Switch
                        checked={editingUser.requirePasswordChange ?? false}
                        onCheckedChange={(checked) => trackProfileChange('requirePasswordChange', checked)}
                      />
                    </div>

                    {/* Email Verification Status Toggle */}
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <MailCheck className="h-4 w-4" />
                          <span className="font-medium">Email Verification Status</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {editingUser.emailVerified ? 'Email address is verified' : 'Email address is not verified'}
                        </p>
                        {!editingUser.emailVerified && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                const response = await fetch(`/api/admin/users/${editingUser.id}/send-verification`, {
                                  method: 'POST'
                                });
                                if (response.ok) {
                                  const data = await response.json();
                                  toast.success(data.message);
                                } else {
                                  const errorData = await response.json();
                                  throw new Error(errorData.error || 'Failed to send verification email');
                                }
                              } catch (error) {
                                console.error('Error sending verification email:', error);
                                toast.error('Failed to send verification email');
                              }
                            }}
                            className="mt-2"
                          >
                            <Mail className="h-3 w-3 mr-1" />
                            Send Verification Email
                          </Button>
                        )}
                      </div>
                      <Switch
                        checked={!!editingUser.emailVerified}
                        onCheckedChange={async (checked) => {
                          try {
                            const response = await fetch(`/api/admin/users/${editingUser.id}/toggle-verification`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ isVerified: checked })
                            });
                            if (response.ok) {
                              const data = await response.json();
                              toast.success(data.message);
                              trackProfileChange('emailVerified', checked ? new Date().toISOString() : null);
                              fetchUsers();
                            } else {
                              const errorData = await response.json();
                              throw new Error(errorData.error || 'Failed to update verification status');
                            }
                          } catch (error) {
                            console.error('Error toggling verification status:', error);
                            toast.error('Failed to update verification status');
                          }
                        }}
                      />
                    </div>

                    {/* Primary Admin Toggle - Only for admins and only if current user is primary admin */}
                    {editingUser.userType === 'ADMIN' && isPrimaryAdmin() && (
                      <div className="flex items-center justify-between p-3 rounded-lg border border-purple-200 bg-purple-50/50">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Crown className="h-4 w-4 text-purple-600" />
                            <span className="font-medium text-purple-800">Primary Admin Privileges</span>
                          </div>
                          <p className="text-sm text-purple-600">
                            {editingUser.isPrimaryAdmin ? 'Has primary admin privileges' : 'Standard admin privileges'}
                          </p>
                        </div>
                        <Switch
                          checked={editingUser.isPrimaryAdmin ?? false}
                          onCheckedChange={(checked) => trackProfileChange('isPrimaryAdmin', checked)}
                        />
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Advanced Profile Information */}
              <Collapsible open={showAdvancedProfile} onOpenChange={setShowAdvancedProfile}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Advanced Profile Information
                    </span>
                    {showAdvancedProfile ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="namePrefix">Prefix</Label>
                      <Input
                        id="namePrefix"
                        placeholder="Mr., Ms., Dr."
                        value={editingUser.namePrefix || ''}
                        onChange={(e) => trackProfileChange('namePrefix', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="middleInitial">Middle Initial</Label>
                      <Input
                        id="middleInitial"
                        maxLength={1}
                        value={editingUser.middleInitial || ''}
                        onChange={(e) => trackProfileChange('middleInitial', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="nameSuffix">Suffix</Label>
                      <Input
                        id="nameSuffix"
                        placeholder="Jr., Sr., III"
                        value={editingUser.nameSuffix || ''}
                        onChange={(e) => trackProfileChange('nameSuffix', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dateOfBirth">
                        Date of Birth
                        {editingUser.userType === 'USER' && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={editingUser.dateOfBirth ? new Date(editingUser.dateOfBirth).toISOString().split('T')[0] : ''}
                        onChange={(e) => trackProfileChange('dateOfBirth', e.target.value)}
                        required={editingUser.userType === 'USER'}
                      />
                      {editingUser.userType === 'USER' && (
                        <p className="text-xs text-muted-foreground mt-1">Required for user accounts</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="zipCode">
                        Zip Code
                        {editingUser.userType === 'USER' && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      <Input
                        id="zipCode"
                        value={editingUser.zipCode}
                        onChange={(e) => trackProfileChange('zipCode', e.target.value)}
                        required={editingUser.userType === 'USER'}
                      />
                      {editingUser.userType === 'USER' && (
                        <p className="text-xs text-muted-foreground mt-1">Required for user accounts</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="educationLevel">Education Level</Label>
                      <Select 
                        value={editingUser.educationLevel || 'not_specified'} 
                        onValueChange={(value) => trackProfileChange('educationLevel', value === 'not_specified' ? '' : value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select education level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not_specified">Not specified</SelectItem>
                          <SelectItem value="Less than high school">Less than high school</SelectItem>
                          <SelectItem value="High school diploma or equivalent">High school diploma or equivalent</SelectItem>
                          <SelectItem value="Some college, no degree">Some college, no degree</SelectItem>
                          <SelectItem value="Associate degree">Associate degree</SelectItem>
                          <SelectItem value="Bachelor's degree">Bachelor's degree</SelectItem>
                          <SelectItem value="Master's degree">Master's degree</SelectItem>
                          <SelectItem value="Professional degree">Professional degree</SelectItem>
                          <SelectItem value="Doctorate degree">Doctorate degree</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2 pt-6">
                      <Switch
                        id="englishFirst"
                        checked={editingUser.englishFirst ?? true}
                        onCheckedChange={(checked) => trackProfileChange('englishFirst', checked)}
                      />
                      <Label htmlFor="englishFirst">English is first language</Label>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Separator />

              {/* Test Access */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Test Access Permissions</Label>
                {testTypes?.map((testType) => {
                  const originalAccessRecord = originalEditingUser?.user_test_access?.find(
                    access => access.test_types.id === testType.id
                  );
                  const originalAccessType = originalAccessRecord?.accessType ?? 'NONE';
                  
                  const pendingChange = userChanges.testAccess[testType.id];
                  const currentAccessType = pendingChange !== undefined ? pendingChange : originalAccessType;
                  
                  return (
                    <div key={testType.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{testType.displayName}</span>
                        {pendingChange !== undefined && (
                          <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                            Pending
                          </Badge>
                        )}
                      </div>
                      <Select
                        value={currentAccessType}
                        onValueChange={(value: 'NONE' | 'ONE_TIME' | 'UNLIMITED') => 
                          trackTestAccessChange(testType.id, value)
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem 
                            value="NONE"
                            className="text-[#8a8a8d] data-[highlighted]:text-white data-[highlighted]:bg-[#f8951d] focus:text-white focus:bg-[#f8951d]"
                          >
                            No Access
                          </SelectItem>
                          <SelectItem 
                            value="ONE_TIME"
                            className="text-[#8a8a8d] data-[highlighted]:text-white data-[highlighted]:bg-[#f8951d] focus:text-white focus:bg-[#f8951d]"
                          >
                            One-time
                          </SelectItem>
                          <SelectItem 
                            value="UNLIMITED"
                            className="text-[#8a8a8d] data-[highlighted]:text-white data-[highlighted]:bg-[#f8951d] focus:text-white focus:bg-[#f8951d]"
                          >
                            Unlimited
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  );
                }) ?? []}
              </div>
            </div>
          )}
          <DialogFooter className="flex justify-between">
            <div className="flex items-center text-sm text-muted-foreground">
              {hasUnsavedChanges && (
                <span className="text-orange-600">● Unsaved changes</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={cancelEditingUser}>
                Cancel
              </Button>
              <Button onClick={handleUpdateUser} disabled={!hasUnsavedChanges}>
                Save Changes
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for {resetPasswordUser?.firstName} {resetPasswordUser?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cancelResetPassword}>
              Cancel
            </Button>
            <Button onClick={handleResetPassword} disabled={!newPassword}>
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create One-Time Code Dialog */}
      <Dialog open={codeDialogOpen} onOpenChange={setCodeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create One-Time Code</DialogTitle>
            <DialogDescription>
              Generate a one-time access code for {createCodeUser?.firstName} {createCodeUser?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="testType">Test Type</Label>
              <Select value={selectedTestType} onValueChange={setSelectedTestType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select test type" />
                </SelectTrigger>
                <SelectContent>
                  {testTypes?.map((testType) => (
                    <SelectItem key={testType.id} value={testType.id}>
                      {testType.displayName}
                    </SelectItem>
                  )) ?? []}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="expiration">Expires In (hours)</Label>
              <Select value={codeExpiration} onValueChange={setCodeExpiration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 hour</SelectItem>
                  <SelectItem value="6">6 hours</SelectItem>
                  <SelectItem value="24">24 hours</SelectItem>
                  <SelectItem value="72">3 days</SelectItem>
                  <SelectItem value="168">1 week</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cancelCreateCode}>
              Cancel
            </Button>
            <Button onClick={handleCreateOneTimeCode} disabled={!selectedTestType}>
              Create Code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account with basic information and permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="newFirstName">First Name *</Label>
                <Input
                  id="newFirstName"
                  value={newUserData.firstName}
                  onChange={(e) => setNewUserData({...newUserData, firstName: e.target.value})}
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <Label htmlFor="newLastName">Last Name *</Label>
                <Input
                  id="newLastName"
                  value={newUserData.lastName}
                  onChange={(e) => setNewUserData({...newUserData, lastName: e.target.value})}
                  placeholder="Enter last name"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="newEmail">Email *</Label>
              <Input
                id="newEmail"
                type="email"
                value={newUserData.email}
                onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                placeholder="Enter email address"
              />
            </div>
            <div>
              <Label htmlFor="newTempPassword">Temporary Password *</Label>
              <Input
                id="newTempPassword"
                type="password"
                value={newUserData.tempPassword}
                onChange={(e) => setNewUserData({...newUserData, tempPassword: e.target.value})}
                placeholder="Enter temporary password"
              />
            </div>
            
            {/* User Type Selection */}
            <div>
              <Label htmlFor="newUserType">Account Type</Label>
              <Select 
                value={newUserData.userType} 
                onValueChange={(value: 'USER' | 'ADMIN') => setNewUserData({...newUserData, userType: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">User Account</SelectItem>
                  {isPrimaryAdmin() && (
                    <SelectItem value="ADMIN">Admin Account</SelectItem>
                  )}
                </SelectContent>
              </Select>
              {!isPrimaryAdmin() && (
                <p className="text-xs text-muted-foreground mt-1">
                  Only primary admin can create admin accounts
                </p>
              )}
            </div>

            {/* Required fields for USER accounts */}
            {newUserData.userType === 'USER' && (
              <>
                <div>
                  <Label htmlFor="newDateOfBirth">Date of Birth *</Label>
                  <Input
                    id="newDateOfBirth"
                    type="date"
                    value={newUserData.dateOfBirth}
                    onChange={(e) => setNewUserData({...newUserData, dateOfBirth: e.target.value})}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Required for user accounts</p>
                </div>
                <div>
                  <Label htmlFor="newZipCode">Zip Code *</Label>
                  <Input
                    id="newZipCode"
                    value={newUserData.zipCode}
                    onChange={(e) => setNewUserData({...newUserData, zipCode: e.target.value})}
                    placeholder="Enter zip code"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Required for user accounts</p>
                </div>
              </>
            )}

            <div className="flex items-center space-x-2">
              <Switch
                id="requirePasswordChange"
                checked={newUserData.requirePasswordChange}
                onCheckedChange={(checked) => setNewUserData({...newUserData, requirePasswordChange: checked})}
              />
              <Label htmlFor="requirePasswordChange">Require password change at first login</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAddUserDialogOpen(false);
              resetNewUserData();
            }}>
              Cancel
            </Button>
            <Button onClick={handleAddNewUser}>
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Primary Admin Confirmation Dialog */}
      <AlertDialog open={primaryAdminConfirmDialogOpen} onOpenChange={setPrimaryAdminConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-purple-600" />
              {primaryAdminAction?.action === 'grant' ? 'Grant' : 'Revoke'} Primary Admin Privileges
            </AlertDialogTitle>
            <AlertDialogDescription>
              {primaryAdminAction?.action === 'grant' ? (
                <>
                  Are you sure you want to grant primary admin privileges to{' '}
                  <strong>{primaryAdminAction.user?.firstName} {primaryAdminAction.user?.lastName}</strong>?
                  <br /><br />
                  Primary admins can:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Manage all user accounts including other admins</li>
                    <li>Grant and revoke admin privileges</li>
                    <li>Delete admin accounts</li>
                    <li>Create new admin accounts</li>
                  </ul>
                </>
              ) : (
                <>
                  Are you sure you want to revoke primary admin privileges from{' '}
                  <strong>{primaryAdminAction?.user?.firstName} {primaryAdminAction?.user?.lastName}</strong>?
                  <br /><br />
                  They will become a standard admin with limited permissions.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPrimaryAdminAction(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmPrimaryAdminToggle}
              className={primaryAdminAction?.action === 'grant' ? 
                'bg-purple-600 hover:bg-purple-700' : 
                'bg-destructive hover:bg-destructive/90'
              }
            >
              {primaryAdminAction?.action === 'grant' ? 'Grant Privileges' : 'Revoke Privileges'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
