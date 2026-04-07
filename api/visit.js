const { createClient } = require('@supabase/supabase-js');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  
  const today = new Date().toISOString().slice(0, 10);
  
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
  );

  if (req.method === 'POST') {
    const { data, error } = await supabase
      .from('visits')
      .upsert({ date: today, count: 1 }, { 
        onConflict: 'date',
        ignoreDuplicates: false 
      });
    
    const { data: row } = await supabase
      .from('visits')
      .select('count')
      .eq('date', today)
      .single();
      
    return res.json({ count: row?.count || 1 });
  }

  const { data: row } = await supabase
    .from('visits')
    .select('count')
    .eq('date', today)
    .single();
    
  return res.json({ count: row?.count || 0 });
}
