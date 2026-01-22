import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActivityLogsTable } from './ActivityLogsTable';
import { ActivityLogStats } from './ActivityLogStats';
import { Skeleton } from '@/components/ui/skeleton';

export default function ActivityLogsPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto p-8 space-y-6">
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  ประวัติการใช้งานระบบ
                </h1>
                <p className="text-gray-600 mt-1">
                  ติดตามการเปลี่ยนแปลงและกิจกรรมทั้งหมดในระบบ (เก็บข้อมูล 90 วัน)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Suspense fallback={<StatsLoadingSkeleton />}>
          <ActivityLogStats />
        </Suspense>

        <Suspense fallback={<TableLoadingSkeleton />}>
          <ActivityLogsTable />
        </Suspense>
      </main>
    </div>
  );
}

function StatsLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-5 rounded" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-20 mb-2" />
            <Skeleton className="h-3 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TableLoadingSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
