import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { 
  Subscription, 
  PaymentMethod, 
  Invoice, 
  SubscriptionPlan 
} from '../../types/payment.types';
import apiService from '../../services/apiService';

// Define the payment state interface
interface PaymentState {
  subscription: Subscription | null;
  paymentMethods: PaymentMethod[];
  invoices: Invoice[];
  plans: SubscriptionPlan[];
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: PaymentState = {
  subscription: null,
  paymentMethods: [],
  invoices: [],
  plans: [],
  isLoading: false,
  error: null,
};

// Async thunks for payment operations
export const fetchSubscription = createAsyncThunk(
  'payment/fetchSubscription',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.get<Subscription>('/payments/subscription');
      
      if (response.success) {
        return response.data || null;
      } else {
        return rejectWithValue(response.message || 'Failed to fetch subscription');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch subscription';
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchPaymentMethods = createAsyncThunk(
  'payment/fetchPaymentMethods',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.get<PaymentMethod[]>('/payments/methods');
      
      if (response.success) {
        return response.data || [];
      } else {
        return rejectWithValue(response.message || 'Failed to fetch payment methods');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch payment methods';
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchInvoices = createAsyncThunk(
  'payment/fetchInvoices',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.get<Invoice[]>('/payments/invoices');
      
      if (response.success) {
        return response.data || [];
      } else {
        return rejectWithValue(response.message || 'Failed to fetch invoices');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch invoices';
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchPlans = createAsyncThunk(
  'payment/fetchPlans',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.get<SubscriptionPlan[]>('/payments/plans');
      
      if (response.success) {
        return response.data || [];
      } else {
        return rejectWithValue(response.message || 'Failed to fetch plans');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch plans';
      return rejectWithValue(errorMessage);
    }
  }
);

export const createSubscription = createAsyncThunk(
  'payment/createSubscription',
  async (data: { planId: string; paymentMethodId: string }, { rejectWithValue }) => {
    try {
      const response = await apiService.post<Subscription>('/payments/subscribe', data);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to create subscription');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create subscription';
      return rejectWithValue(errorMessage);
    }
  }
);

export const cancelSubscription = createAsyncThunk(
  'payment/cancelSubscription',
  async (subscriptionId: string, { rejectWithValue }) => {
    try {
      const response = await apiService.post<Subscription>(`/payments/cancel/${subscriptionId}`);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to cancel subscription');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel subscription';
      return rejectWithValue(errorMessage);
    }
  }
);

export const updatePaymentMethod = createAsyncThunk(
  'payment/updatePaymentMethod',
  async (paymentMethodId: string, { rejectWithValue }) => {
    try {
      const response = await apiService.put<PaymentMethod[]>('/payments/update-method', {
        paymentMethodId
      });
      
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to update payment method');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update payment method';
      return rejectWithValue(errorMessage);
    }
  }
);

// Create the payment slice
const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch subscription cases
      .addCase(fetchSubscription.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSubscription.fulfilled, (state, action) => {
        state.isLoading = false;
        state.subscription = action.payload;
        state.error = null;
      })
      .addCase(fetchSubscription.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch payment methods cases
      .addCase(fetchPaymentMethods.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPaymentMethods.fulfilled, (state, action) => {
        state.isLoading = false;
        state.paymentMethods = action.payload;
        state.error = null;
      })
      .addCase(fetchPaymentMethods.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch invoices cases
      .addCase(fetchInvoices.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchInvoices.fulfilled, (state, action) => {
        state.isLoading = false;
        state.invoices = action.payload;
        state.error = null;
      })
      .addCase(fetchInvoices.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch plans cases
      .addCase(fetchPlans.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPlans.fulfilled, (state, action) => {
        state.isLoading = false;
        state.plans = action.payload;
        state.error = null;
      })
      .addCase(fetchPlans.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Create subscription cases
      .addCase(createSubscription.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createSubscription.fulfilled, (state, action) => {
        state.isLoading = false;
        state.subscription = action.payload;
        state.error = null;
      })
      .addCase(createSubscription.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Cancel subscription cases
      .addCase(cancelSubscription.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(cancelSubscription.fulfilled, (state, action) => {
        state.isLoading = false;
        state.subscription = action.payload;
        state.error = null;
      })
      .addCase(cancelSubscription.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Update payment method cases
      .addCase(updatePaymentMethod.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updatePaymentMethod.fulfilled, (state, action) => {
        state.isLoading = false;
        state.paymentMethods = action.payload;
        state.error = null;
      })
      .addCase(updatePaymentMethod.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

// Export actions
export const { clearError, setLoading } = paymentSlice.actions;

// Export reducer
export default paymentSlice.reducer;
