
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { 
  FileText, 
  Plus, 
  Search, 
  Eye, 
  Ban, 
  Trash2,
  Copy,
  Filter,
  Calendar as CalendarIcon,
  User,
  Clock,
  CheckCircle,
  XCircle,
  Activity,
  BarChart3,
  TrendingUp,
  Hash,
  ArrowLeft
} from 'lucide-react';
import { format, addDays } from 'date-fns';

interface OneTimeCode {
  id: string;
  code: string;
  testTypeId: string;
  createdBy: string;
  usedBy?: string;
  usedAt?: string;
  isActive: boolean;
  createdAt: string;
  expiresAt?: string;
  testType: {
    id: string;
    name: string;
    displayName: string;
  };
  createdByUser?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  usedByUser?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  _count?: {
    tests: number;
  };
}

interface CodeStats {
  total: number;
  active: number;
  used: number;
  expired: number;
  totalUsage: number;
}

export function OneTimeCodesClient() {
  const { data: session } = useSession();
  const [codes, setCodes] = useState<OneTimeCode[]>([]);
  const [filteredCodes, setFilteredCodes] = useState<OneTimeCode[]>([]);
  const [stats, setStats] = useState<CodeStats>({
    total: 0,
    active: 0,
    used: 0,
    expired: 0,
    totalUsage: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [testTypeFilter, setTestTypeFilter] = useState<string>('all');
  const [selectedCode, setSelectedCode] = useState<OneTimeCode | null>(null);
  const [testTypes, setTestTypes] = useState<{ id: string; displayName: string }[]>([]);
  
  // Create code dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    testTypeId: '',
    expiresAt: undefined as Date | undefined,
    count: 1,
  });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchCodes();
    fetchTestTypes();
  }, []);

  useEffect(() => {
    filterCodes();
  }, [codes, searchTerm, statusFilter, testTypeFilter]);

  const fetchCodes = async () => {
    try {
      const response = await fetch('/api/admin/one-time-codes');
      if (response.ok) {
        const data = await response.json();
        setCodes(data.codes || []);
        setStats(data.stats || {});
      } else {
        toast.error('Failed to fetch one-time codes');
      }
    } catch (error) {
      toast.error('Error fetching codes');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTestTypes = async () => {
    try {
      const response = await fetch('/api/admin/test-types');
      if (response.ok) {
        const data = await response.json();
        setTestTypes(data.testTypes || []);
      }
    } catch (error) {
      console.error('Error fetching test types:', error);
    }
  };

  const filterCodes = () => {
    let filtered = codes;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(code => 
        code.code.toLowerCase().includes(term) ||
        code.testType?.displayName?.toLowerCase().includes(term) ||
        code.createdByUser?.firstName?.toLowerCase().includes(term) ||
        code.createdByUser?.lastName?.toLowerCase().includes(term) ||
        code.usedByUser?.firstName?.toLowerCase().includes(term) ||
        code.usedByUser?.lastName?.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'all') {
      const now = new Date();
      switch (statusFilter) {
        case 'active':
          filtered = filtered.filter(code => 
            code.isActive && !code.usedBy && (!code.expiresAt || new Date(code.expiresAt) > now)
          );
          break;
        case 'used':
          filtered = filtered.filter(code => code.usedBy);
          break;
        case 'expired':
          filtered = filtered.filter(code => 
            code.expiresAt && new Date(code.expiresAt) <= now && !code.usedBy
          );
          break;
        case 'inactive':
          filtered = filtered.filter(code => !code.isActive);
          break;
      }
    }

    if (testTypeFilter !== 'all') {
      filtered = filtered.filter(code => code.testTypeId === testTypeFilter);
    }

    setFilteredCodes(filtered);
  };

  const handleCreateCode = async () => {
    if (!createForm.testTypeId) {
      toast.error('Please select a test type');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/admin/one-time-codes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testTypeId: createForm.testTypeId,
          expiresAt: createForm.expiresAt?.toISOString(),
          count: createForm.count,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`${data.codes?.length || 1} code(s) created successfully`);
        setIsCreateDialogOpen(false);
        setCreateForm({ testTypeId: '', expiresAt: undefined, count: 1 });
        fetchCodes();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create code');
      }
    } catch (error) {
      toast.error('Error creating code');
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeactivateCode = async (codeId: string) => {
    try {
      const response = await fetch(`/api/admin/one-time-codes/${codeId}/deactivate`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Code deactivated successfully');
        fetchCodes();
      } else {
        toast.error('Failed to deactivate code');
      }
    } catch (error) {
      toast.error('Error deactivating code');
      console.error(error);
    }
  };

  const handleDeleteCode = async (codeId: string) => {
    try {
      const response = await fetch(`/api/admin/one-time-codes/${codeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Code deleted successfully');
        fetchCodes();
      } else {
        toast.error('Failed to delete code');
      }
    } catch (error) {
      toast.error('Error deleting code');
      console.error(error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Code copied to clipboard');
    }).catch(() => {
      toast.error('Failed to copy code');
    });
  };

  const getStatusInfo = (code: OneTimeCode) => {
    const now = new Date();
    
    if (code.usedBy) {
      return {
        status: 'used',
        label: 'Used',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: <CheckCircle className="h-4 w-4" />
      };
    }
    
    if (!code.isActive) {
      return {
        status: 'inactive',
        label: 'Inactive',
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: <Ban className="h-4 w-4" />
      };
    }
    
    if (code.expiresAt && new Date(code.expiresAt) <= now) {
      return {
        status: 'expired',
        label: 'Expired',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: <XCircle className="h-4 w-4" />
      };
    }
    
    return {
      status: 'active',
      label: 'Active',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: <Activity className="h-4 w-4" />
    };
  };

  if (loading) {
    return (
      <main className="container mx-auto px-4 max-w-7xl py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Activity className="h-8 w-8 animate-pulse mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading codes...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 max-w-7xl py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold">One-Time Codes</h1>
            </div>
            <p className="text-muted-foreground">
              Manage one-time access codes for tests
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Code
                </Button>
              </DialogTrigger>
              <DialogContent>
              <DialogHeader>
                <DialogTitle>Create One-Time Code</DialogTitle>
                <DialogDescription>
                  Generate new one-time access codes for specific test types
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="testType">Test Type *</Label>
                  <Select 
                    value={createForm.testTypeId} 
                    onValueChange={(value) => setCreateForm(prev => ({ ...prev, testTypeId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select test type" />
                    </SelectTrigger>
                    <SelectContent>
                      {testTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="count">Number of Codes</Label>
                  <Input
                    id="count"
                    type="number"
                    min="1"
                    max="50"
                    value={createForm.count}
                    onChange={(e) => setCreateForm(prev => ({ 
                      ...prev, 
                      count: Math.max(1, Math.min(50, parseInt(e.target.value) || 1))
                    }))}
                  />
                </div>
                <div>
                  <Label>Expiration Date (Optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {createForm.expiresAt ? format(createForm.expiresAt, 'PPP') : 'No expiration'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={createForm.expiresAt}
                        onSelect={(date) => setCreateForm(prev => ({ ...prev, expiresAt: date }))}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                      {createForm.expiresAt && (
                        <div className="p-3 border-t">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setCreateForm(prev => ({ ...prev, expiresAt: undefined }))}
                            className="w-full"
                          >
                            Clear expiration
                          </Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCode} disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create Code'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
            <Button variant="outline" onClick={() => window.location.href = '/admin'}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Hash className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Codes</p>
                <h3 className="text-2xl font-bold">{stats.total}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <h3 className="text-2xl font-bold">{stats.active}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Used</p>
                <h3 className="text-2xl font-bold">{stats.used}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Usage Rate</p>
                <h3 className="text-2xl font-bold">
                  {stats.total > 0 ? Math.round((stats.used / stats.total) * 100) : 0}%
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search codes, users, or test types..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="used">Used</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="testType">Test Type</Label>
              <Select value={testTypeFilter} onValueChange={setTestTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All test types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Test Types</SelectItem>
                  {testTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setTestTypeFilter('all');
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Codes Table */}
      <Card>
        <CardHeader>
          <CardTitle>One-Time Codes ({filteredCodes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Test Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Used By</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCodes.length > 0 ? (
                  filteredCodes.map((code) => {
                    const statusInfo = getStatusInfo(code);
                    return (
                      <TableRow key={code.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="font-mono bg-muted px-2 py-1 rounded text-sm">
                              {code.code}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(code.code)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{code.testType?.displayName}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${statusInfo.color} flex items-center gap-1 w-fit`}>
                            {statusInfo.icon}
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(code.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {code.createdByUser ? 
                              `${code.createdByUser.firstName} ${code.createdByUser.lastName}` : 
                              'Unknown'
                            }
                          </div>
                        </TableCell>
                        <TableCell>
                          {code.expiresAt ? (
                            <div className="text-sm">
                              {new Date(code.expiresAt).toLocaleDateString()}
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              Never
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {code.usedByUser ? (
                            <div>
                              <div className="font-medium text-sm">
                                {code.usedByUser.firstName} {code.usedByUser.lastName}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {code.usedAt ? new Date(code.usedAt).toLocaleDateString() : ''}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Not used</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => setSelectedCode(code)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Code Details</DialogTitle>
                                  <DialogDescription>
                                    Detailed information about this one-time code
                                  </DialogDescription>
                                </DialogHeader>
                                {selectedCode && (
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label className="text-sm font-medium">Code</Label>
                                        <div className="flex items-center gap-2 mt-1">
                                          <code className="font-mono bg-muted px-2 py-1 rounded text-sm">
                                            {selectedCode.code}
                                          </code>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => copyToClipboard(selectedCode.code)}
                                          >
                                            <Copy className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Test Type</Label>
                                        <p className="text-sm mt-1">{selectedCode.testType?.displayName}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Status</Label>
                                        <div className="mt-1">
                                          <Badge className={`${getStatusInfo(selectedCode).color} w-fit`}>
                                            {getStatusInfo(selectedCode).label}
                                          </Badge>
                                        </div>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Created</Label>
                                        <p className="text-sm mt-1">
                                          {new Date(selectedCode.createdAt).toLocaleString()}
                                        </p>
                                      </div>
                                      {selectedCode.expiresAt && (
                                        <div>
                                          <Label className="text-sm font-medium">Expires</Label>
                                          <p className="text-sm mt-1">
                                            {new Date(selectedCode.expiresAt).toLocaleString()}
                                          </p>
                                        </div>
                                      )}
                                      {selectedCode.usedByUser && (
                                        <div>
                                          <Label className="text-sm font-medium">Used By</Label>
                                          <p className="text-sm mt-1">
                                            {selectedCode.usedByUser.firstName} {selectedCode.usedByUser.lastName}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            {selectedCode.usedByUser.email}
                                          </p>
                                        </div>
                                      )}
                                      {selectedCode.usedAt && (
                                        <div>
                                          <Label className="text-sm font-medium">Used At</Label>
                                          <p className="text-sm mt-1">
                                            {new Date(selectedCode.usedAt).toLocaleString()}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                    {selectedCode._count && (
                                      <div>
                                        <Label className="text-sm font-medium">Tests Started</Label>
                                        <p className="text-sm mt-1">{selectedCode._count.tests}</p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                            
                            {code.isActive && !code.usedBy && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Ban className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Deactivate Code</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to deactivate this code? This will prevent it from being used.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleDeactivateCode(code.id)}
                                      className="bg-orange-600 hover:bg-orange-700"
                                    >
                                      Deactivate
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                            
                            {!code.usedBy && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Code</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this code? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleDeleteCode(code.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No codes found matching your criteria</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
