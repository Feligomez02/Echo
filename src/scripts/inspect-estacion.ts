import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

async function inspectEstacion() {
  console.log('🔍 Inspeccionando estructura HTML de La Estación...\n');
  
  const browser = await puppeteer.launch({
    headless: false, // Mostrar el navegador
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage',
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36');

    console.log('📡 Navegando a laestacioncordoba.com...');
    await page.goto('https://laestacioncordoba.com/', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    console.log('✅ Página cargada\n');

    // Esperar un momento para que carguen los elementos dinámicos
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Extraer información sobre los elementos con la clase especificada
    const analysis = await page.evaluate(() => {
      const elements = document.querySelectorAll('.DF_utQ._682gpw._0xkaeQ');
      
      return {
        totalElements: elements.length,
        samples: Array.from(elements).slice(0, 5).map((el, i) => {
          const text = el.textContent?.trim() || '';
          const hasHeading = el.querySelector('h1, h2, h3, h4, h5, h6') !== null;
          const headingText = el.querySelector('h1, h2, h3, h4, h5, h6')?.textContent || '';
          const hasLinks = el.querySelectorAll('a').length;
          const hasImages = el.querySelectorAll('img').length;
          const classList = Array.from(el.classList);
          
          // Verificar si el elemento o sus padres tienen atributos que indiquen que es un show
          const parent = el.parentElement;
          const parentClasses = parent ? Array.from(parent.classList) : [];
          
          return {
            index: i,
            textPreview: text.substring(0, 100),
            textLength: text.length,
            hasHeading,
            headingText,
            linkCount: hasLinks,
            imageCount: hasImages,
            classList,
            parentClasses,
            htmlPreview: el.innerHTML.substring(0, 200)
          };
        })
      };
    });

    console.log('📊 Análisis de elementos:');
    console.log(`   Total de elementos con clase .DF_utQ._682gpw._0xkaeQ: ${analysis.totalElements}\n`);
    
    console.log('📋 Muestras de los primeros 5 elementos:\n');
    analysis.samples.forEach((sample: any) => {
      console.log(`━━━ Elemento ${sample.index + 1} ━━━`);
      console.log(`   Texto (${sample.textLength} chars): ${sample.textPreview}`);
      console.log(`   Tiene heading: ${sample.hasHeading}`);
      if (sample.hasHeading) {
        console.log(`   Texto del heading: ${sample.headingText}`);
      }
      console.log(`   Enlaces: ${sample.linkCount}`);
      console.log(`   Imágenes: ${sample.imageCount}`);
      console.log(`   Clases: ${sample.classList.join(', ')}`);
      console.log(`   Clases del padre: ${sample.parentClasses.join(', ')}`);
      console.log(`   HTML preview: ${sample.htmlPreview}`);
      console.log('');
    });

    // Buscar selectores alternativos más específicos
    const alternativeSelectors = await page.evaluate(() => {
      // Buscar elementos que parezcan eventos
      const possibleShowSelectors = [
        'article',
        '[class*="event"]',
        '[class*="show"]',
        '[class*="card"]',
        '[data-event]',
        '[data-show]'
      ];
      
      const results: any = {};
      
      possibleShowSelectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0 && elements.length < 100) {
            const firstEl = elements[0];
            const text = firstEl.textContent?.trim() || '';
            results[selector] = {
              count: elements.length,
              firstElementPreview: text.substring(0, 100),
              hasHeading: firstEl.querySelector('h1, h2, h3, h4, h5, h6') !== null
            };
          }
        } catch (e) {
          // Ignorar selectores inválidos
        }
      });
      
      return results;
    });

    console.log('🔍 Selectores alternativos encontrados:\n');
    Object.entries(alternativeSelectors).forEach(([selector, info]: any) => {
      console.log(`   Selector: ${selector}`);
      console.log(`      Elementos: ${info.count}`);
      console.log(`      Tiene heading: ${info.hasHeading}`);
      console.log(`      Preview: ${info.firstElementPreview}`);
      console.log('');
    });

    console.log('\n⏸️  El navegador permanecerá abierto. Inspecciona manualmente y presiona Enter para cerrar...');
    
    // Esperar input del usuario (en PowerShell)
    await new Promise((resolve) => {
      process.stdin.resume();
      process.stdin.once('data', resolve);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

inspectEstacion().catch(console.error);
