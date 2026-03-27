// API 연결 테스트 유틸리티
// 브라우저 콘솔에서 window.testPayoutApi() 실행하여 테스트 가능

import { payoutApi } from '@/api/payouts';

export const testPayoutApi = async () => {
  console.log('🔍 Testing Payout API connection...');
  console.log('📍 API Base URL: http://localhost:3007/api');

  try {
    // Test 1: Get all payout data
    console.log('\n1️⃣ Testing GET /api/payouts');
    const response = await payoutApi.getAll();

    if (response.data) {
      console.log('✅ Success! Data received:');
      console.log('   Earnings:', response.data.earnings);
      console.log('   Transactions:', response.data.transactions.length, 'items');
      return {
        success: true,
        earnings: response.data.earnings,
        transactionCount: response.data.transactions.length,
      };
    } else {
      console.error('❌ Failed:', response.error);
      return { success: false, error: response.error };
    }
  } catch (error) {
    console.error('❌ Connection failed:', error);
    return { success: false, error: String(error) };
  }
};

// Make it available globally for testing
if (typeof window !== 'undefined') {
  (window as any).testPayoutApi = testPayoutApi;
}
