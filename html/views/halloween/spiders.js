/* SPDX-License-Identifier: Apache-2.0 OR GPL-3.0-or-later */
/* Adds dangling spiders to every web and animated artwork to the auxiliary headers. */
(function () {
  if (window.hauntedSpiders) return;
  window.hauntedSpiders = true;
  var link = document.createElement('link');
  link.rel = 'stylesheet'; link.href = '/views/halloween/spider.css';
  document.head.appendChild(link);

  var SPIDER = '<svg class="spider" viewBox="0 0 40 40" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">' +
    '<path d="M16 22L5 14L2 6M16 25L3 25L1 33M17 28L7 37M17 20L9 9M24 22L35 14L38 6M24 25L37 25L39 33M23 28L33 37M23 20L31 9"/></g>' +
    '<ellipse cx="20" cy="27" rx="7" ry="8.5" fill="currentColor"/><circle cx="20" cy="17" r="4.5" fill="currentColor"/>' +
    '<circle cx="18" cy="16" r="1.2" fill="#ff263f"/><circle cx="22" cy="16" r="1.2" fill="#ff263f"/></svg>';
  var count = 0;

  function spiderLayer() {
    var layer = document.createElement('span');
    layer.className = 'spider-layer';
    layer.setAttribute('aria-hidden', 'true');
    var unit = document.createElement('span');
    unit.className = 'spider-unit';
    var n = count++;
    unit.style.setProperty('--spider-delay', (-3.7 * n) + 's');
    unit.style.setProperty('--spider-duration', (17 + (n % 4) * 2.3) + 's');
    unit.innerHTML = '<span class="spider-thread"></span>' + SPIDER;
    layer.appendChild(unit);
    return layer;
  }

  function wrapWebs(root) {
    root.querySelectorAll('svg.web:not(.web-art)').forEach(function (svg) {
      if (svg.closest('.intermission') && svg.classList.contains('right')) return;
      var holder = document.createElement('div');
      holder.className = svg.getAttribute('class');
      svg.setAttribute('class', 'web-art');
      svg.parentNode.insertBefore(holder, svg);
      holder.appendChild(svg);
      holder.appendChild(spiderLayer());
    });
  }

  var HEADERS = '#RosterTab .sbHeader.Name, .PltInput > .Team .Teamname, #PenaltyList > .sbHeader';
  var ART = '<svg class="pumpkin" aria-hidden="true"><use href="#pumpkin"/></svg>' +
    '<svg class="ghost" aria-hidden="true"><use href="#ghost"/></svg>' +
    '<svg class="bat" aria-hidden="true"><use href="#bat"/></svg>';
  function decorateHeaders(root) {
    root.querySelectorAll(HEADERS).forEach(function (header) {
      if (header.querySelector(':scope > .haunted-hdr-art')) return;
      var art = document.createElement('span');
      art.className = 'haunted-hdr-art';
      art.setAttribute('aria-hidden', 'true');
      art.innerHTML = ART;
      var layer = spiderLayer();
      layer.classList.add('header-web');
      art.appendChild(layer);
      header.appendChild(art);
    });
  }

  var aux = document.documentElement.classList.contains('haunted-auxiliary');
  function scan() { wrapWebs(document); if (aux) decorateHeaders(document); }
  function start() {
    if (aux) {
      fetch('/views/halloween/artwork.svg').then(function (r) { return r.text(); }).then(function (text) {
        var sprite = document.createElement('div');
        sprite.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
        sprite.innerHTML = text.replace(/<!--[\s\S]*?-->/g, '');
        document.body.appendChild(sprite);
        scan();
      });
    } else scan();
    new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
}());
