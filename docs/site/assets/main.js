/* global $ */

// All interactivity on this page is written with Mepto itself — the docs
// dogfood the library. `$` is the global exposed by assets/meptos.umd.cjs.
// Flickity demos also use Mepto via window.mepto || window.jQuery fallback.

// Robust ready: Mepto's $ may be object if UMD failed; fall back to vanilla
const $ = (typeof window.$ === 'function' && window.$) || window.mepto || window.jQuery;
function onReady(fn) {
  if ($) {
    try { return $(fn); } catch (e) { console.warn('Mepto ready failed, using DOMContentLoaded', e); }
  }
  if (document.readyState !== 'loading') fn();
  else document.addEventListener('DOMContentLoaded', fn);
}
onReady(() => {
  const $window = $(window)
  const $sidebar = $('#sidebar')
  const $backToTop = $('#back-to-top')
  const $links = $sidebar.find('a[href^="#"]')

  // NOTE: read scroll from documentElement, not $(window).scrollTop()
  const scrollY = () => $(document.documentElement).scrollTop()

  const targetFor = link => document.getElementById(link.getAttribute('href').slice(1))

  const setActive = link => {
    $links.removeClass('active')
    $(link).addClass('active')
  }

  // --- mobile sidebar toggle (Mepto) ---
  $('#menu-toggle').on('click', () => {
    $sidebar.toggleClass('open')
  })

  // --- smooth-scroll sidebar anchor clicks (Mepto) ---
  $links.on('click', e => {
    e.preventDefault()
    const link = e.currentTarget
    const target = targetFor(link)
    if (!target) return
    window.scrollTo({ top: $(target).offset().top - 16, behavior: 'smooth' })
    history.replaceState(null, '', link.getAttribute('href'))
    $sidebar.removeClass('open')
    setActive(link)
  })

  // --- scroll-spy (rAF-throttled, Mepto) ---
  let positions = []
  const measure = () => {
    positions = []
    $links.each((_index, link) => {
      const target = targetFor(link)
      if (target) positions.push({ link, top: $(target).offset().top })
    })
    positions.sort((a, b) => a.top - b.top)
  }

  let ticking = false
  const onScroll = () => {
    if (ticking) return
    ticking = true
    requestAnimationFrame(() => {
      ticking = false
      const y = scrollY() + 80
      let current = null
      for (let i = 0; i < positions.length; i++) {
        if (positions[i].top <= y) current = positions[i]
        else break
      }
      if (current) setActive(current.link)
      $backToTop.toggleClass('visible', scrollY() > 400)
    })
  }

  // --- back to top (Mepto) ---
  $backToTop.on('click', e => {
    e.preventDefault()
    window.scrollTo({ top: 0, behavior: 'smooth' })
    history.replaceState(null, '', '#top')
  })

  // --- Flickity demos (Flickity-Mepto, Mepto for controls) ---
  // hero already via data-flickity htmlInit; init the demo carousels via Mepto + Flickity
  // Fallback to vanilla Flickity if Mepto bridget not ready (ensures demos never stay stacked vertically)
  function initDemo(selector, opts) {
    const el = document.querySelector(selector)
    if (!el) return null
    try {
      const $el = window.$ ? window.$(el) : null
      if ($el && $el.flickity) { $el.flickity(opts); return window.Flickity.data(el) }
    } catch (e) { console.warn('Mepto bridget failed for', selector, e) }
    // vanilla fallback (no Mepto)
    return new window.Flickity(el, opts)
  }
  const wrapInst = initDemo('#demo-wrap-carousel', { cellAlign: 'left', contain: true, wrapAround: true, pageDots: true, prevNextButtons: true })
  if (wrapInst) {
    $('[data-demo="wrap"]').on('click', e => {
      const action = e.currentTarget.getAttribute('data-action')
      if (action === 'next') wrapInst.next()
      else wrapInst.previous()
    })
  }
  initDemo('#demo-contain-carousel', { cellAlign: 'left', contain: true })
  initDemo('#demo-group-carousel', { groupCells: 2, cellAlign: 'left', contain: true })
  initDemo('#demo-lazy-carousel', { lazyLoad: 1, cellAlign: 'left', contain: true })

  // --- init ---
  measure()
  $window.on('scroll', onScroll)
  $window.on('resize', () => { measure(); onScroll() })
  onScroll()
})
