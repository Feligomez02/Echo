import { scrapePassline } from '../services/scraper-puppeteer';

async function testPasslineWithPuppeteer() {
  try {
    console.log('🔍 Testing Passline API with Puppeteer (bypassing Cloudflare)...\n');

    const shows = await scrapePassline();

    console.log('\n📊 Results:');
    console.log(`✅ Found ${shows.length} upcoming shows in Córdoba!\n`);

    if (shows.length > 0) {
      console.log('📋 First 5 shows:');
      shows.slice(0, 5).forEach((show, index) => {
        console.log(`\n${index + 1}. ${show.name}`);
        console.log(`   🎤 Artist: ${show.artist}`);
        console.log(`   📅 Date: ${show.date.toLocaleString('es-AR')}`);
        console.log(`   📍 Venue: ${show.venue}, ${show.city}`);
        if (show.imageUrl) console.log(`   🖼️  Image: ${show.imageUrl}`);
        if (show.ticketUrl) console.log(`   🎟️  Tickets: ${show.ticketUrl}`);
      });
    }

    console.log('\n✨ Test completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

testPasslineWithPuppeteer();
