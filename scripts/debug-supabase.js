const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://supabase.ankebut.com.tr';
const supabaseAnonKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3NDM0MjQ0MCwiZXhwIjo0OTMwMDE2MDQwLCJyb2xlIjoiYW5vbiJ9.YFTot6BpuurGA_xuIrpBYexAGloJwJttBgRBpZHPlRI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDatabase() {
  console.log(`Checking Supabase at ${supabaseUrl}...`);
  try {
    const { data, count, error } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Database Error:', error);
      return;
    }

    console.log(`\n✅ Supabase Status:`);
    console.log(`- Koleksiyon: contacts`);
    console.log(`- Toplam Kayıt: ${count}`);
    
    if (count > 0) {
      const { data: rows } = await supabase.from('contacts').select('*').limit(1);
      console.log(`- Örnek Kayıt:`, JSON.stringify(rows[0], null, 2));
    } else {
      console.log(`- ⚠️ UYARI: Tablo BOMBOŞ görünüyor.`);
    }

    const { count: groupCount } = await supabase
      .from('groups')
      .select('*', { count: 'exact', head: true });
    
    console.log(`- Toplam Gruplar: ${groupCount}`);

  } catch (err) {
    console.error('Unexpected Connection Error:', err.message);
  }
}

checkDatabase();
