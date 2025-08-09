
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
import { toast } from 'sonner';
import { 
  TestTube, 
  Search, 
  Eye, 
  Ban, 
  Trash2,
  Download,
  Filter,
  Calendar,
  User,
  Clock,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  BarChart3,
  Users,
  TrendingUp,
  Activity,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

interface TestResult {
  score: number;
  gradeLevelScore?: string;
  timeToComplete?: number;
  accuracy?: number;
  weightedSpeed?: number;
  completedAt: string;
}

interface Test {
  id: string;
  userId?: string;
  testTypeId: string;
  oneTimeCodeId?: string;
  status: 'STARTED' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  isPractice: boolean;
  startedAt: string;
  pausedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  timeLimit?: number;
  score?: number;
  gradeLevelScore?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  testType: {
    id: string;
    name: string;
    displayName: string;
    description?: string;
  };
  oneTimeCode?: {
    id: string;
    code: string;
  };
  testResults: TestResult[];
}

interface TestStats {
  total: number;
  completed: number;
  inProgress: number;
  cancelled: number;
  averageScore: number;
  averageTime: number;
}

export function AllTestsClient() {
  const [tests, setTests] = useState<Test[]>([]);
  const [filteredTests, setFilteredTests] = useState<Test[]>([]);
  const [stats, setStats] = useState<TestStats>({
    total: 0,
    completed: 0,
    inProgress: 0,
    cancelled: 0,
    averageScore: 0,
    averageTime: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [testTypeFilter, setTestTypeFilter] = useState<string>('all');
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [testTypes, setTestTypes] = useState<{ id: string; displayName: string }[]>([]);

  useEffect(() => {
    fetchTests();
    fetchTestTypes();
  }, []);

  useEffect(() => {
    filterTests();
  }, [tests, searchTerm, statusFilter, testTypeFilter]);

  const fetchTests = async () => {
    try {
      const response = await fetch('/api/admin/tests');
      if (response.ok) {
        const data = await response.json();
        setTests(data.tests || []);
        setStats(data.stats || {});
      } else {
        toast.error('Failed to fetch tests');
      }
    } catch (error) {
      toast.error('Error fetching tests');
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

  const filterTests = () => {
    let filtered = tests;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(test => 
        test.user?.firstName?.toLowerCase().includes(term) ||
        test.user?.lastName?.toLowerCase().includes(term) ||
        test.user?.email?.toLowerCase().includes(term) ||
        test.testType?.displayName?.toLowerCase().includes(term) ||
        test.oneTimeCode?.code?.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(test => test.status === statusFilter);
    }

    if (testTypeFilter !== 'all') {
      filtered = filtered.filter(test => test.testTypeId === testTypeFilter);
    }

    setFilteredTests(filtered);
  };

  const handleCancelTest = async (testId: string) => {
    try {
      const response = await fetch(`/api/admin/tests/${testId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Cancelled by admin' }),
      });

      if (response.ok) {
        toast.success('Test cancelled successfully');
        fetchTests();
      } else {
        toast.error('Failed to cancel test');
      }
    } catch (error) {
      toast.error('Error cancelling test');
      console.error(error);
    }
  };

  const handleDeleteTest = async (testId: string) => {
    try {
      const response = await fetch(`/api/admin/tests/${testId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Test deleted successfully');
        fetchTests();
      } else {
        toast.error('Failed to delete test');
      }
    } catch (error) {
      toast.error('Error deleting test');
      console.error(error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'STARTED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PAUSED':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4" />;
      case 'STARTED':
        return <Play className="h-4 w-4" />;
      case 'PAUSED':
        return <Pause className="h-4 w-4" />;
      case 'CANCELLED':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  };

  if (loading) {
    return (
      <main className="container mx-auto px-4 max-w-7xl py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Activity className="h-8 w-8 animate-pulse mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading tests...</p>
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
              <TestTube className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold">All Tests</h1>
            </div>
            <p className="text-muted-foreground">
              Monitor and manage all tests across the platform
            </p>
          </div>
          <Button variant="outline" onClick={() => window.location.href = '/admin'}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TestTube className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Tests</p>
                <h3 className="text-2xl font-bold">{stats.total}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <h3 className="text-2xl font-bold">{stats.completed}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Play className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <h3 className="text-2xl font-bold">{stats.inProgress}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Avg Score</p>
                <h3 className="text-2xl font-bold">{stats.averageScore?.toFixed(1) || 'N/A'}</h3>
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
                  placeholder="Search by user, test type, or code..."
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
                  <SelectItem value="STARTED">Started</SelectItem>
                  <SelectItem value="PAUSED">Paused</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
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

      {/* Tests Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Tests ({filteredTests.length})</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Test Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTests.length > 0 ? (
                  filteredTests.map((test) => (
                    <TableRow key={test.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {test.user ? `${test.user.firstName} ${test.user.lastName}` : 'Anonymous'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {test.user?.email || 'No email'}
                          </div>
                          {test.oneTimeCode && (
                            <Badge variant="outline" className="text-xs mt-1">
                              Code: {test.oneTimeCode.code}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{test.testType?.displayName}</div>
                          {test.isPractice && (
                            <Badge variant="outline" className="text-xs mt-1">
                              Practice
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(test.status)} flex items-center gap-1 w-fit`}>
                          {getStatusIcon(test.status)}
                          {test.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(test.startedAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(test.startedAt).toLocaleTimeString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        {test.completedAt ? (
                          formatDuration(
                            Math.floor(
                              (new Date(test.completedAt).getTime() - new Date(test.startedAt).getTime()) / 1000
                            )
                          )
                        ) : test.status === 'STARTED' || test.status === 'PAUSED' ? (
                          <Badge variant="outline" className="text-xs">
                            In Progress
                          </Badge>
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell>
                        {test.score !== null && test.score !== undefined ? (
                          <div>
                            <div className="font-medium">{test.score.toFixed(1)}%</div>
                            {test.gradeLevelScore && (
                              <div className="text-xs text-muted-foreground">
                                Grade: {test.gradeLevelScore}
                              </div>
                            )}
                          </div>
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setSelectedTest(test)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Test Details</DialogTitle>
                                <DialogDescription>
                                  Detailed information about this test
                                </DialogDescription>
                              </DialogHeader>
                              {selectedTest && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-sm font-medium">User</Label>
                                      <p className="text-sm">
                                        {selectedTest.user ? 
                                          `${selectedTest.user.firstName} ${selectedTest.user.lastName}` : 
                                          'Anonymous'
                                        }
                                      </p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Email</Label>
                                      <p className="text-sm">{selectedTest.user?.email || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Test Type</Label>
                                      <p className="text-sm">{selectedTest.testType?.displayName}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Status</Label>
                                      <Badge className={`${getStatusColor(selectedTest.status)} w-fit`}>
                                        {selectedTest.status}
                                      </Badge>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Started</Label>
                                      <p className="text-sm">
                                        {new Date(selectedTest.startedAt).toLocaleString()}
                                      </p>
                                    </div>
                                    {selectedTest.completedAt && (
                                      <div>
                                        <Label className="text-sm font-medium">Completed</Label>
                                        <p className="text-sm">
                                          {new Date(selectedTest.completedAt).toLocaleString()}
                                        </p>
                                      </div>
                                    )}
                                    {selectedTest.score !== null && selectedTest.score !== undefined && (
                                      <div>
                                        <Label className="text-sm font-medium">Score</Label>
                                        <p className="text-sm">{selectedTest.score.toFixed(1)}%</p>
                                      </div>
                                    )}
                                    {selectedTest.gradeLevelScore && (
                                      <div>
                                        <Label className="text-sm font-medium">Grade Level</Label>
                                        <p className="text-sm">{selectedTest.gradeLevelScore}</p>
                                      </div>
                                    )}
                                  </div>
                                  {selectedTest.cancelReason && (
                                    <div>
                                      <Label className="text-sm font-medium">Cancel Reason</Label>
                                      <p className="text-sm text-red-600">{selectedTest.cancelReason}</p>
                                    </div>
                                  )}
                                  {selectedTest.testResults?.length > 0 && (
                                    <div>
                                      <Label className="text-sm font-medium">Test Results</Label>
                                      <div className="mt-2 p-3 bg-muted rounded-md">
                                        {selectedTest.testResults.map((result, index) => (
                                          <div key={index} className="text-sm">
                                            <p>Score: {result.score}%</p>
                                            {result.timeToComplete && (
                                              <p>Time: {formatDuration(result.timeToComplete)}</p>
                                            )}
                                            {result.accuracy && (
                                              <p>Accuracy: {result.accuracy}%</p>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          
                          {test.status === 'STARTED' && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Ban className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Cancel Test</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to cancel this test? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>No, keep test</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleCancelTest(test.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Yes, cancel test
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Test</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this test? This will remove all test data and cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteTest(test.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete Test
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <TestTube className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No tests found matching your criteria</p>
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
