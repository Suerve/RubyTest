

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { History, ArrowLeft, Calendar, Clock, Award } from 'lucide-react';
import Link from 'next/link';

export default function TestHistoryPage() {
  return (
    <main className="container mx-auto px-4 max-w-6xl py-8">
      <div className="mb-6">
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-3 mb-8">
        <History className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Test History</h1>
          <p className="text-muted-foreground">View your completed tests and results</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Test Results</CardTitle>
          <CardDescription>
            A comprehensive view of all your completed assessments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <History className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No Test History</h3>
            <p className="text-muted-foreground mb-6">
              You haven't completed any tests yet. Start by taking your first assessment.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild>
                <Link href="/tests">
                  Browse Available Tests
                </Link>
              </Button>
              
              <Button asChild variant="outline">
                <Link href="/dashboard">
                  Go to Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Example of what the history might look like with data */}
      <div className="mt-8 space-y-4 opacity-50 pointer-events-none">
        <h3 className="text-lg font-medium text-muted-foreground">Preview: Future Test Results</h3>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Award className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium">Basic Math Test</h4>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Dec 15, 2024
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      15:30 min
                    </div>
                  </div>
                </div>
              </div>
              <Badge variant="secondary">85%</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
