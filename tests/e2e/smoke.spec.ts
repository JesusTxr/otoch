import { expect, test } from "@playwright/test";

test.describe("Otoch v1.0.0 · Pruebas de humo E2E", () => {
  test("endpoint /api/health y manifiesto PWA responden correctamente", async ({
    request,
  }) => {
    const healthRes = await request.get("/api/health");
    expect(healthRes.status()).toBe(200);
    await expect(healthRes.json()).resolves.toEqual({
      status: "ok",
      app: "otoch",
    });

    const manifestRes = await request.get("/manifest.webmanifest");
    expect(manifestRes.status()).toBe(200);
    const manifestJson = await manifestRes.json();
    expect(manifestJson.short_name).toBe("Otoch");
    expect(manifestJson.display).toBe("standalone");
  });

  test("landing muestra propuesta de valor y enlaza a páginas legales LFPDPPP", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", {
        name: /Tu casa cerca de la escuela, con roomies que sí cuadran/i,
      })
    ).toBeVisible();

    const linkPrivacidad = page.getByRole("link", {
      name: /Aviso de Privacidad/i,
    });
    await expect(linkPrivacidad).toBeVisible();
    await linkPrivacidad.click();
    await expect(page).toHaveURL(/\/privacidad$/);
    await expect(
      page.getByRole("heading", { name: /Aviso de Privacidad Integral/i })
    ).toBeVisible();
  });

  test("rutas protegidas redirigen a /login cuando no hay sesión activa", async ({
    page,
  }) => {
    await page.goto("/explorar");
    await expect(page).toHaveURL(/\/login\?next=%2Fexplorar/);

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login\?next=%2Fadmin/);
  });
});
