import { test, expect } from '@playwright/test'
import { fileURLToPath } from 'url'
import path from 'path'

const htmlPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'flickity-api.html')
const fileUrl = 'file://' + htmlPath

test('Flickity-Mepto API compatibility (frozen v2.3.0)', async ({ page }) => {
  await page.goto(fileUrl, { waitUntil: 'load' })
  // wait for harness to finish
  await page.waitForFunction(() => window.__flickityApiResults !== undefined, null, {
    timeout: 5000,
  })
  const results = await page.evaluate(() => window.__flickityApiResults)
  const failed = await page.evaluate(() => window.__flickityApiFailed)
  const text = await page.locator('#results').textContent()

  console.log(text)

  // every line should be PASS
  for (const line of results) {
    expect(line.startsWith('PASS'), `Expected PASS but got: ${line}\nFull:\n${text}`).toBe(true)
  }
  expect(failed).toBe(false)

  // spot-check API surface via Playwright evaluate (independent of harness)
  const api = await page.evaluate(() => {
    return {
      hasFlickity: typeof window.Flickity === 'function',
      hasDefaults: !!window.Flickity.defaults,
      hasCell: !!window.Flickity.Cell,
      hasSlide: !!window.Flickity.Slide,
      hasSetJQuery: typeof window.Flickity.setJQuery === 'function',
      hasSetMepto: typeof window.Flickity.setMepto === 'function',
      hasBridget: !!(window.mepto && window.mepto.fn && window.mepto.fn.flickity),
    }
  })
  expect(api.hasFlickity).toBe(true)
  expect(api.hasDefaults).toBe(true)
  expect(api.hasCell).toBe(true)
  expect(api.hasSlide).toBe(true)
  expect(api.hasSetJQuery).toBe(true)
  expect(api.hasSetMepto).toBe(true)
  expect(api.hasBridget).toBe(true)
})
