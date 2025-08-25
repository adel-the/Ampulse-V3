import { test, expect } from '@playwright/test';

test.describe('Application Ampulse - Tests fonctionnels', () => {
  test('Page de test simple accessible', async ({ page }) => {
    await page.goto('/test-simple');
    await expect(page.locator('h1')).toHaveText(/Test de fonctionnement/);
    await expect(page.locator('text=Next.js')).toBeVisible();
    await expect(page.locator('text=Supabase')).toBeVisible();
  });

  test('Navigation entre les onglets principaux', async ({ page }) => {
    await page.goto('/');
    
    // Vérifier que le tableau de bord est visible par défaut
    await expect(page.locator('h2:has-text("Tableau de bord")')).toBeVisible();
    
    // Navigation vers Réservations
    await page.getByRole('button', { name: 'Réservations' }).click();
    await expect(page.locator('h1:has-text("Gestion des réservations")')).toBeVisible();
    
    // Navigation vers Chambres
    await page.getByRole('button', { name: 'Chambres' }).click();
    await expect(page.locator('h1:has-text("Gestion des chambres")')).toBeVisible();
    
    // Navigation vers Gestion
    await page.getByRole('button', { name: 'Gestion' }).click();
    await expect(page.locator('h1:has-text("Gestion")')).toBeVisible();
    
    // Navigation vers Clients
    await page.getByRole('button', { name: 'Clients' }).click();
    await expect(page.locator('h1:has-text("Gestion des clients")')).toBeVisible();
    
    
    
    // Navigation vers Rapports
    await page.getByRole('button', { name: 'Rapports' }).click();
    await expect(page.locator('h1:has-text("Rapports")')).toBeVisible();
    
    // Navigation vers Paramètres
    await page.getByRole('button', { name: 'Paramètres' }).click();
    await expect(page.locator('h1:has-text("Paramètres")')).toBeVisible();
  });

  test('Test de la page des réservations', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Réservations' }).click();
    
    // Vérifier que la page des réservations est chargée
    await expect(page.locator('h1:has-text("Gestion des réservations")')).toBeVisible();
    
    // Vérifier que le tableau des réservations est présent
    await expect(page.locator('text=Réservations')).toBeVisible();
  });

  test('Test de la page des chambres', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Chambres' }).click();
    
    // Vérifier que la page des chambres est chargée
    await expect(page.locator('h1:has-text("Gestion des chambres")')).toBeVisible();
  });

  test('Test de la page des clients', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Clients' }).click();
    
    // Vérifier que la page des clients est chargée
    await expect(page.locator('h1:has-text("Gestion des clients")')).toBeVisible();
  });

  

  test('Test de la page des rapports', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Rapports' }).click();
    
    // Vérifier que la page des rapports est chargée
    await expect(page.locator('h1:has-text("Rapports")')).toBeVisible();
  });

  test('Test de la page des paramètres', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Paramètres' }).click();
    
    // Vérifier que la page des paramètres est chargée
    await expect(page.locator('h1:has-text("Paramètres")')).toBeVisible();
  });

  test('Test de la génération PDF', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Paramètres' }).click();
    
    // Vérifier que le composant de test PDF est visible

  });

  test('Test de la connexion Supabase', async ({ page }) => {
    await page.goto('/test-simple');
    await expect(page.locator('text=Supabase')).toBeVisible();
    await expect(page.locator('text=Base de données locale opérationnelle')).toBeVisible();
  });
}); 