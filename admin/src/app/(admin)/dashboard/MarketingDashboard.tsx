'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/shared/stat-card';
import { 
  Megaphone, CalendarClock, Users, 
  PhoneCall, IndianRupee, Target, 
  Share2, Activity, Clock
} from 'lucide-react';

export function MarketingDashboard() {
  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
        <StatCard
          title="Active Campaigns"
          value="0"
          icon={<Megaphone className="h-5 w-5" />}
          iconColor="text-blue-600 dark:text-blue-400"
          loading={false}
        />
        <StatCard
          title="Scheduled Campaigns"
          value="0"
          icon={<CalendarClock className="h-5 w-5" />}
          iconColor="text-amber-600 dark:text-amber-400"
          loading={false}
        />
        <StatCard
          title="New Leads"
          value="0"
          icon={<Users className="h-5 w-5" />}
          iconColor="text-emerald-600 dark:text-emerald-400"
          loading={false}
        />
        <StatCard
          title="Follow-ups Due"
          value="0"
          icon={<PhoneCall className="h-5 w-5" />}
          iconColor="text-rose-600 dark:text-rose-400"
          loading={false}
        />
        <StatCard
          title="Campaign Spend"
          value="₹0"
          icon={<IndianRupee className="h-5 w-5" />}
          iconColor="text-violet-600 dark:text-violet-400"
          loading={false}
        />
        <StatCard
          title="Conversions"
          value="0"
          icon={<Target className="h-5 w-5" />}
          iconColor="text-cyan-600 dark:text-cyan-400"
          loading={false}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Campaign Overview */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Campaign Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Megaphone className="h-5 w-5 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">No active campaigns</p>
              <p className="text-xs text-muted-foreground">You don't have any marketing campaigns running right now.</p>
            </div>
          </CardContent>
        </Card>

        {/* Marketing Spend Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Marketing Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-border">
                <span className="text-sm text-muted-foreground">Total Budget</span>
                <span className="font-semibold">₹0</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-border">
                <span className="text-sm text-muted-foreground">Amount Spent</span>
                <span className="font-semibold text-rose-500">₹0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Remaining Budget</span>
                <span className="font-semibold text-emerald-500">₹0</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Leads Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Leads Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3">
                <Users className="h-4 w-4 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">No new leads</p>
              <p className="text-xs text-muted-foreground">Check back later when campaigns are active.</p>
            </div>
            <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Total Leads</p>
                <p className="text-lg font-semibold">0</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Converted</p>
                <p className="text-lg font-semibold">0</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Social Media Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Social Media</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['Instagram', 'Facebook', 'WhatsApp', 'YouTube'].map(platform => (
                <div key={platform} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{platform}</span>
                  <span className="text-xs text-muted-foreground">No data</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Marketing Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Performance</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Conversion Rate</span>
                <span className="font-semibold">0%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Cost Per Lead</span>
                <span className="font-semibold">₹0</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3">
                <Clock className="h-4 w-4 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">No upcoming activities</p>
              <p className="text-xs text-muted-foreground">Your schedule is clear.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Marketing Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Marketing Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Activity className="h-5 w-5 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">No recent activities</p>
            <p className="text-xs text-muted-foreground">Activities like campaign creation or lead generation will appear here.</p>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
