import { useState, useEffect } from 'react';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
  isActive: boolean;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  plan: SubscriptionPlan | null;
  subscriptionStatus: 'active' | 'canceled' | 'trial' | 'expired';
  trialEndsAt?: Date;
  nextBillingDate?: Date;
}

// Hook for managing SaaS user subscription
export const useSubscription = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock user data - in real app this would come from your backend
  useEffect(() => {
    const mockUser: User = {
      id: '1',
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      plan: {
        id: 'pro',
        name: 'Pro Plan',
        price: 29,
        features: [
          'Unlimited AI solutions',
          'Desktop app access',
          'Priority support',
          'Progress tracking',
          'Export solutions'
        ],
        isActive: true
      },
      subscriptionStatus: 'active',
      nextBillingDate: new Date('2024-02-15')
    };
    setUser(mockUser);
  }, []);

  const upgradePlan = async (planId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call to upgrade plan
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (user) {
        const updatedUser = { ...user };
        if (planId === 'pro') {
          updatedUser.plan = {
            id: 'pro',
            name: 'Pro Plan',
            price: 29,
            features: ['Unlimited AI solutions', 'Desktop app access', 'Priority support'],
            isActive: true
          };
        }
        setUser(updatedUser);
      }
    } catch (err) {
      setError('Failed to upgrade plan');
      console.error('Plan upgrade failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelSubscription = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call to cancel subscription
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (user) {
        const updatedUser = { 
          ...user, 
          subscriptionStatus: 'canceled' as const 
        };
        setUser(updatedUser);
      }
    } catch (err) {
      setError('Failed to cancel subscription');
      console.error('Subscription cancellation failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePaymentMethod = async (paymentMethodId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call to update payment method
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Payment method updated:', paymentMethodId);
    } catch (err) {
      setError('Failed to update payment method');
      console.error('Payment method update failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadInvoice = async (invoiceId: string) => {
    try {
      // Simulate invoice download
      console.log('Downloading invoice:', invoiceId);
      // In real app, this would trigger file download
    } catch (err) {
      setError('Failed to download invoice');
      console.error('Invoice download failed:', err);
    }
  };

  return {
    user,
    isLoading,
    error,
    upgradePlan,
    cancelSubscription,
    updatePaymentMethod,
    downloadInvoice,
    // Computed properties
    isSubscriptionActive: user?.subscriptionStatus === 'active',
    isOnTrial: user?.subscriptionStatus === 'trial',
    daysLeftInTrial: user?.trialEndsAt ? 
      Math.max(0, Math.ceil((user.trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0
  };
};
