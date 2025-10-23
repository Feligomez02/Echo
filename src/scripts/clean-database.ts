#!/usr/bin/env tsx

/**
 * Script para limpiar la base de datos de elementos erróneos
 */

import { prisma } from '@/lib/prisma';

console.log('═══════════════════════════════════════════════════');
console.log('🧹 LIMPIEZA DE BASE DE DATOS');
console.log('═══════════════════════════════════════════════════\n');

async function cleanDatabase() {
  try {
    // 1. Ver estadísticas actuales
    console.log('📊 Estado actual de la base de datos:\n');
    
    const totalShows = await prisma.show.count();
    const showsBySource = await prisma.show.groupBy({
      by: ['source'],
      _count: true,
    });
    
    console.log(`Total de shows: ${totalShows}\n`);
    console.log('Shows por fuente:');
    showsBySource.forEach((item: any) => {
      console.log(`   - ${item.source}: ${item._count}`);
    });
    
    // 2. Buscar shows problemáticos
    console.log('\n🔍 Buscando elementos problemáticos...\n');
    
    // Shows sin título o con nombres genéricos
    const showsSinTitulo = await prisma.show.findMany({
      where: {
        OR: [
          { name: { contains: 'Show sin título' } },
          { name: { contains: 'sin título' } },
          { artist: { contains: 'Show sin título' } },
        ],
      },
      select: {
        id: true,
        name: true,
        artist: true,
        venue: true,
        date: true,
        source: true,
      },
    });
    
    console.log(`❌ Shows "sin título": ${showsSinTitulo.length}`);
    if (showsSinTitulo.length > 0) {
      console.log('   Ejemplos:');
      showsSinTitulo.slice(0, 5).forEach((show: any) => {
        console.log(`   • ${show.name} - ${show.source} (${show.date.toLocaleDateString()})`);
      });
    }
    
    // Shows duplicados de La Estación con fechas placeholder
    const showsEstacionDuplicados = await prisma.show.findMany({
      where: {
        source: 'laestacion',
        date: {
          gte: new Date('2025-11-01'),
          lte: new Date('2025-11-03'),
        },
      },
      select: {
        id: true,
        name: true,
        artist: true,
        venue: true,
        date: true,
      },
    });
    
    console.log(`\n⚠️  Shows de La Estación con fecha placeholder (2 nov): ${showsEstacionDuplicados.length}`);
    if (showsEstacionDuplicados.length > 0) {
      console.log('   Lista:');
      showsEstacionDuplicados.forEach((show: any) => {
        console.log(`   • ${show.name} - ${show.venue} (${show.date.toLocaleDateString()})`);
      });
    }
    
    // Shows de prueba o mock
    const showsMock = await prisma.show.findMany({
      where: {
        source: 'mock',
      },
      select: {
        id: true,
        name: true,
        artist: true,
        venue: true,
        date: true,
      },
    });
    
    console.log(`\n🧪 Shows de prueba (mock): ${showsMock.length}`);
    if (showsMock.length > 0) {
      console.log('   Lista:');
      showsMock.slice(0, 5).forEach((show: any) => {
        console.log(`   • ${show.name} - ${show.venue} (${show.date.toLocaleDateString()})`);
      });
    }
    
    // Shows con nombres que no son artistas (NUESTRAS MARCAS, etc)
    const showsNoArtistas = await prisma.show.findMany({
      where: {
        OR: [
          { name: { contains: 'NUESTRAS MARCAS' } },
          { name: { contains: 'SEGUINOS' } },
          { name: { contains: 'CONTACTO' } },
          { artist: { contains: 'NUESTRAS MARCAS' } },
          { artist: { contains: 'SEGUINOS' } },
        ],
      },
      select: {
        id: true,
        name: true,
        artist: true,
        venue: true,
        date: true,
        source: true,
      },
    });
    
    console.log(`\n🚫 Shows con nombres no válidos: ${showsNoArtistas.length}`);
    if (showsNoArtistas.length > 0) {
      console.log('   Lista:');
      showsNoArtistas.forEach((show: any) => {
        console.log(`   • ${show.name} - ${show.source}`);
      });
    }
    
    // 3. Confirmar eliminación
    const totalProblematicos = 
      showsSinTitulo.length + 
      showsEstacionDuplicados.length + 
      showsMock.length + 
      showsNoArtistas.length;
    
    if (totalProblematicos === 0) {
      console.log('\n✅ No se encontraron elementos problemáticos. ¡La base de datos está limpia!\n');
      return;
    }
    
    console.log('\n═══════════════════════════════════════════════════');
    console.log(`📊 RESUMEN: ${totalProblematicos} elementos para eliminar`);
    console.log('═══════════════════════════════════════════════════\n');
    
    // Pedir confirmación
    console.log('⚠️  ADVERTENCIA: Esta acción eliminará permanentemente estos shows.\n');
    console.log('Escribe "CONFIRMAR" para proceder con la limpieza:');
    
    // Esperar confirmación del usuario
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    
    const confirmation = await new Promise<string>((resolve) => {
      rl.question('> ', (answer) => {
        rl.close();
        resolve(answer);
      });
    });
    
    if (confirmation.trim() !== 'CONFIRMAR') {
      console.log('\n❌ Limpieza cancelada. No se eliminó nada.\n');
      return;
    }
    
    // 4. Eliminar elementos problemáticos
    console.log('\n🧹 Limpiando base de datos...\n');
    
    let deletedCount = 0;
    
    // Eliminar shows sin título
    if (showsSinTitulo.length > 0) {
      const result = await prisma.show.deleteMany({
        where: {
          id: {
            in: showsSinTitulo.map((s: any) => s.id),
          },
        },
      });
      console.log(`   ✓ Eliminados ${result.count} shows "sin título"`);
      deletedCount += result.count;
    }
    
    // Eliminar duplicados de La Estación con placeholder
    if (showsEstacionDuplicados.length > 0) {
      const result = await prisma.show.deleteMany({
        where: {
          id: {
            in: showsEstacionDuplicados.map((s: any) => s.id),
          },
        },
      });
      console.log(`   ✓ Eliminados ${result.count} shows de La Estación con fecha placeholder`);
      deletedCount += result.count;
    }
    
    // Eliminar shows mock
    if (showsMock.length > 0) {
      const result = await prisma.show.deleteMany({
        where: {
          id: {
            in: showsMock.map((s: any) => s.id),
          },
        },
      });
      console.log(`   ✓ Eliminados ${result.count} shows de prueba (mock)`);
      deletedCount += result.count;
    }
    
    // Eliminar shows con nombres no válidos
    if (showsNoArtistas.length > 0) {
      const result = await prisma.show.deleteMany({
        where: {
          id: {
            in: showsNoArtistas.map((s: any) => s.id),
          },
        },
      });
      console.log(`   ✓ Eliminados ${result.count} shows con nombres no válidos`);
      deletedCount += result.count;
    }
    
    // 5. Estadísticas finales
    console.log('\n═══════════════════════════════════════════════════');
    console.log('✅ LIMPIEZA COMPLETADA');
    console.log('═══════════════════════════════════════════════════\n');
    
    const totalShowsAfter = await prisma.show.count();
    const showsBySourceAfter = await prisma.show.groupBy({
      by: ['source'],
      _count: true,
    });
    
    console.log(`Total eliminado: ${deletedCount} shows`);
    console.log(`Total restante: ${totalShowsAfter} shows\n`);
    
    console.log('Shows por fuente (después):');
    showsBySourceAfter.forEach((item: any) => {
      console.log(`   - ${item.source}: ${item._count}`);
    });
    
    console.log('\n✅ Base de datos limpia y lista para usar!\n');
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanDatabase();
