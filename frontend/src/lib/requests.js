import { supabase } from './supabaseClient';

export const insertRequest = async ({ userId, prompt, result }) => {
  const { error } = await supabase.from('requests').insert({ user_id: userId, prompt, result });
  if (error) throw error;
};

export const fetchUserRequests = async (userId) => {
  const { data, error } = await supabase
    .from('requests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const countUserRequests = async (userId) => {
  const { count, error } = await supabase
    .from('requests')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (error) throw error;
  return count;
};
