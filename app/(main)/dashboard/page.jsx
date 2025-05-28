import { getIndustryInsights } from '@/actions/dashboard';
import { getUserOnboardingStatus } from '@/actions/user';
import { redirect } from 'next/navigation';
import React from 'react';
import DashboardView from './_components/dashboard-view';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, GraduationCap } from 'lucide-react';

const IndustryInsightsPage = async () => {
  //check if user is already onboarded
  const { isOnboarded } = await getUserOnboardingStatus();
  
  if (!isOnboarded) {
    redirect("/onboarding");
  }

  try {
    // Try to get industry insights
    const insights = await getIndustryInsights();
    
    return (
      <div className='container mx-auto'>
        <DashboardView insights={insights} />
      </div>
    );
  } catch (error) {
    // Handle the case where user hasn't selected an industry
    if (error.message?.includes("select an industry")) {
      return (
        <div className='container mx-auto py-8'>
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
              <CardDescription>
                You need to select an industry to view personalized insights
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-primary/10">
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Industry Selection Required</h3>
                  <p className="text-sm text-muted-foreground">
                    To provide you with personalized career insights, we need to know your industry.
                  </p>
                </div>
              </div>

              <div className="flex justify-center">
                <Button asChild>
                  <Link href="/onboarding" className="gap-2">
                    Complete Your Profile
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
    
    // For any other errors, rethrow
    throw error;
  }
};

export default IndustryInsightsPage;