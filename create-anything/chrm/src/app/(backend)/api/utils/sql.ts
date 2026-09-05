import { supabase } from '../../lib/supabase/client';

export async function query(text: string, params?: any[]) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      query: text,
      params: params || []
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('SQL Error:', error);
    throw error;
  }
}

export default {
  query
};