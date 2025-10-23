import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Initializing database with venue data...');

  // Clear existing data
  await prisma.reviewLike.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.review.deleteMany();
  await prisma.userFavorite.deleteMany();
  await prisma.friendship.deleteMany();
  await prisma.show.deleteMany();
  await prisma.venue.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Cleared existing data');

  // ========== CREATE VENUES ==========
  console.log('\n🏛️ Setting up venues...');

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

  console.log('✅ Venues initialized:');
  console.log(`   • ${laEstacion.name}`);
  console.log(`   • ${laFabrica.name}`);

  // ========== SUMMARY ==========
  console.log('\n' + '='.repeat(50));
  console.log('✨ DATABASE INITIALIZED');
  console.log('='.repeat(50));
  console.log('\n� Current state:');
  console.log('   • Venues: 2 (La Estación, La Fábrica)');
  console.log('   • Users: 0');
  console.log('   • Shows: 0');
  console.log('   • Reviews: 0');
  console.log('\n🚀 Next step:');
  console.log('   npm run scrape:both');
  console.log('='.repeat(50) + '\n');
}


main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
