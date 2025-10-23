/**
 * Script de prueba para la API de Passline
 * Ejecutar: npx tsx src/scripts/test-passline.ts
 */

async function testPasslineAPI() {
  console.log('🔍 Testing Passline API...\n');

  try {
    const response = await fetch('https://api.passline.com/v1/event/GetBillboardByFilters', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
        'Origin': 'https://home.passline.com',
        'Referer': 'https://home.passline.com/',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'sec-ch-ua': '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
      },
      body: JSON.stringify({
        country: 'argentina',
        region: '6', // Córdoba
        commune: '',
        communeNum: '',
        type: 0,
        start_date: '',
        end_date: '',
        text: '',
        tag_id: null,
        tag: null,
        limit: '0,50', // Primero probamos con 50
        offset: '1'
      })
    });

    console.log('📊 Status:', response.status);
    console.log('📊 Status Text:', response.statusText);
    console.log('📊 Headers:', Object.fromEntries(response.headers.entries()));
    console.log();

    if (!response.ok) {
      console.error('❌ Error response');
      const text = await response.text();
      console.log('Response body:', text.substring(0, 1000));
      return;
    }

    const data = await response.json();
    
    console.log('📦 Response structure:');
    console.log('- Type:', typeof data);
    console.log('- Is Array:', Array.isArray(data));
    
    if (Array.isArray(data)) {
      console.log('- Total events:', data.length);
      
      if (data.length > 0) {
        console.log('\n✅ Found events!');
        console.log('\n📋 First event structure:');
        console.log(JSON.stringify(data[0], null, 2));
        
        console.log('\n📋 Examples of shows:');
        data.slice(0, 5).forEach((event: any, index: number) => {
          console.log(`\n${index + 1}. ${event.nombre}`);
          console.log(`   Artista: ${event.artistas || '(no especificado)'}`);
          console.log(`   Lugar: ${event.lugar}`);
          console.log(`   Fecha: ${event.fecha_inicio} ${event.hora_inicio}`);
          console.log(`   URL: ${event.url}`);
        });
      } else {
        console.log('\n⚠️ No se encontraron eventos');
      }
    } else {
      console.log('- Keys:', Object.keys(data));
      console.log('\n⚠️ Unexpected structure:');
      console.log(JSON.stringify(data, null, 2).substring(0, 1000));
    }

  } catch (error) {
    console.error('\n❌ Error:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    }
  }
}

testPasslineAPI();
