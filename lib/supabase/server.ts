/**
 * Supabase 클라이언트 (서버용)
 * 서버 컴포넌트와 API Route에서 사용
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables');
}

/**
 * 서버 사이드 전용 클라이언트 (Service Role Key 사용)
 * RLS 우회 가능, 모든 데이터 접근 가능
 */
export const createServerClient = () => {
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};
