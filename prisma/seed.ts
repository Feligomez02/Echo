import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed with focused venues: La Estación & La Fábrica...');

  // Clear existing data
  await prisma.reviewLike.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.review.deleteMany();
  await prisma.userFavorite.deleteMany();
  await prisma.friendship.deleteMany();
  await prisma.show.deleteMany();
  await prisma.venue.deleteMany();
  await prisma.user.deleteMany();

  // ========== CREATE WHITELISTED VENUES ==========
  console.log('\n🏛️ Creating whitelisted venues...');

  const laEstacion = await prisma.venue.create({
    data: {
      name: 'La Estación',
      city: 'Córdoba',
      address: 'Av. Hipólito Yrigoyen 348, Córdoba',
      website: 'https://www.laestacion.com.ar',
      source: 'estacion',
      active: true,
    },
  });

  const laFabrica = await prisma.venue.create({
    data: {
      name: 'La Fábrica',
      city: 'Córdoba',
      address: 'Bv. San Juan 4601, Córdoba',
      website: 'https://www.lafabrica.com.ar',
      source: 'fabrica',
      active: true,
    },
  });

  console.log('✅ Venues created:');
  console.log(`   - ${laEstacion.name} (${laEstacion.source})`);
  console.log(`   - ${laFabrica.name} (${laFabrica.source})`);

  // ========== CREATE USERS ==========
  console.log('\n👥 Creating test users...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  const user1 = await prisma.user.create({
    data: {
      email: 'juan@example.com',
      username: 'juan_cba',
      password: hashedPassword,
      name: 'Juan Pérez',
      bio: 'Fanático del rock argentino 🎸 Habitué de La Estación',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'maria@example.com',
      username: 'maria_music',
      password: hashedPassword,
      name: 'María González',
      bio: 'Indie y electrónica 🎧 Vivo en La Fábrica',
    },
  });

  const user3 = await prisma.user.create({
    data: {
      email: 'carlos@example.com',
      username: 'carlos_cba',
      password: hashedPassword,
      name: 'Carlos Rodríguez',
      bio: 'Metal y hardcore 🤘 Asiduo de ambos lugares',
    },
  });

  console.log('✅ Users created (3 test users)');

  // Note: Shows will be populated by running the scrapers:
  // npm run scrape:estacion
  // npm run scrape:fabrica
  // or
  // npm run scrape:both
  console.log('\n🎭 No test shows added (will be populated by scrapers)');
  console.log('   To add real events, run: npm run scrape:both');

  // ========== SKIP REVIEWS AND FAVORITES (no test shows) ==========
  // Reviews, favorites, and likes will be added after scrapers populate shows

  // Create friendships (mutual follows)
  console.log('\n👥 Creating friendships...');

  await prisma.friendship.create({
    data: {
      followerId: user1.id,
      followingId: user2.id,
      status: 'accepted',
    },
  });

  await prisma.friendship.create({
    data: {
      followerId: user2.id,
      followingId: user1.id,
      status: 'accepted',
    },
  });

  await prisma.friendship.create({
    data: {
      followerId: user1.id,
      followingId: user3.id,
      status: 'accepted',
    },
  });

  await prisma.friendship.create({
    data: {
      followerId: user3.id,
      followingId: user1.id,
      status: 'accepted',
    },
  });

  await prisma.friendship.create({
    data: {
      followerId: user2.id,
      followingId: user3.id,
      status: 'pending',
    },
  });

  console.log('✅ Friendships created');

  // Reviews, favorites, and likes will be added after scrapers populate shows
  console.log('\n📝 Reviews: None (will be created by users after shows are scraped)');
  console.log('❤️ Review likes: None (will be created by users)');
  console.log('💬 Comments: None (will be created by users)');
  console.log('⭐ User favorites: None (will be created by users)');

  // ========== SUMMARY ==========
  console.log('\n' + '='.repeat(60));
  console.log('🎉 SEED COMPLETED SUCCESSFULLY!');
  console.log('='.repeat(60));
  console.log('\n📊 Database Summary:');
  console.log(`   Venues:      2 (La Estación, La Fábrica) - WHITELISTED`);
  console.log(`   Users:       3 (test users)`);
  console.log(`   Shows:       0 (will be populated by scrapers)`);
  console.log(`   Reviews:     0 (will be created by users)`);
  console.log(`   Friendships: 5 (test data)`);
  console.log(`\n🚀 Next Steps:`);
  console.log(`   1. Run: npm run scrape:estacion`);
  console.log(`   2. Run: npm run scrape:fabrica`);
  console.log(`   Or run both at once: npm run scrape:both`);
  console.log(`\n🔐 Business Model:`);
  console.log(`   - Only events from La Estación and La Fábrica`);
  console.log(`   - Focus on Córdoba market first`);
  console.log(`   - Real events scraped from official sources`);
  console.log('='.repeat(60) + '\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
