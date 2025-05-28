import React from 'react';
import { getUserOnboardingStatus } from '@/actions/user';
import { redirect } from 'next/navigation';
import ResumeReview from './_components/resume-review';

const ResumeReviewPage = async () => {
  // Check if user is already onboarded
  const { isOnboarded } = await getUserOnboardingStatus();
  
  if (!isOnboarded) {
    redirect("/onboarding");
  }

  return (
    <div className='container mx-auto'>
      <ResumeReview />
    </div>
  );
};

export default ResumeReviewPage; 