import { JobScraperService } from "../services/job-scraper.service.js";

async function main() {
  const scraper = new JobScraperService();
  console.log("🚀 Lancement du navigateur persistant en mode visible...");
  
  // Toujours ouvrir en mode visible pour le login
  await scraper.initialize(false);
  
  // @ts-ignore - On accède à page pour la navigation
  const page = scraper.page;
  if (!page) {
    console.error("Erreur d'initialisation de la page.");
    process.exit(1);
  }

  console.log("\n========================================================");
  console.log("🔒 SESSION DE CONNEXION MANUELLE");
  console.log("========================================================");
  console.log("1. Le navigateur va ouvrir Indeed et Welcome to the Jungle.");
  console.log("2. Veuillez vous connecter à vos comptes et/ou résoudre les captchas Cloudflare.");
  console.log("3. Vous avez 5 minutes. Prenez votre temps.");
  console.log("4. Une fois terminé, vous pouvez fermer le navigateur ou attendre la fin du chrono.");
  console.log("========================================================\n");

  try {
    await page.goto("https://fr.indeed.com/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    
    // Ouvrir WTTJ dans un nouvel onglet
    // @ts-ignore
    const context = scraper.context;
    if (context) {
      const page2 = await context.newPage();
      await page2.goto("https://www.welcometothejungle.com/fr", { waitUntil: "domcontentloaded" });
    }

    console.log("⏳ En attente (5 minutes)...");
    await new Promise((resolve) => setTimeout(resolve, 300000));
    console.log("✅ Temps écoulé. Fermeture de la session de connexion.");
  } catch (err) {
    console.log("Navigateur fermé manuellement ou erreur:", err);
  } finally {
    await scraper.close();
    process.exit(0);
  }
}

main();
