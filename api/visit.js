import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');

  const today = new Date().toISOString().slice(0, 10);

  if (req.method === 'POST') {
    const { data: existing } = await supabase
      .from('visits').select('count').eq('date', today).single();

    if (existing) {
      await supabase.from('visits')
        .update({ count: existing.count + 1 }).eq('date', today);
      return res.json({ count: existing.count + 1 });
    } else {
      await supabase.from('visits')
        .insert({ date: today, count: 1 });
      return res.json({ count: 1 });
    }
  }

  const { data } = await supabase
    .from('visits').select('count').eq('date', today).single();
  return res.json({ count: data?.count || 0 });
}
