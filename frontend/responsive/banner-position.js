  function positionThinkerBannerShell() {
    const banner = document.getElementById("thinker-chess-banner");
    if (!banner) return;
    if (!shouldShowThinkerBanner()) {
      banner.style.display = "none";
      return;
    }
    const sidebar = getThinkerBannerSidebar();
    if (!sidebar) {
      banner.style.display = "none";
      return;
    }
    if (thinkerBannerResizeObserver && thinkerObservedBannerSidebar !== sidebar) {
      if (thinkerObservedBannerSidebar) thinkerBannerResizeObserver.unobserve(thinkerObservedBannerSidebar);
      thinkerObservedBannerSidebar = sidebar;
      thinkerBannerResizeObserver.observe(sidebar);
    }
    const layout = calculateThinkerBannerLayout(
      sidebar.getBoundingClientRect(),
      document.documentElement.clientWidth,
      window.scrollX,
      window.scrollY,
      _ghostModeActive,
    );
    if (!layout) {
      banner.style.display = "none";
      return;
    }
    banner.style.display = "flex";
    const point = globalThis.ThinkerResponsive?.localPoint(banner, layout.left, layout.top) || layout;
    banner.style.left = point.left + "px";
    banner.style.right = "auto";
    banner.style.top = point.top + "px";
    banner.style.width = layout.width + "px";
    banner.style.height = layout.height + "px";
    const artwork = banner.querySelector("img");
    if (artwork?.naturalWidth) {
      artwork.style.maxWidth = Math.floor(
        artwork.naturalWidth,
      ) + "px";
    } else {
      if (artwork && artwork !== thinkerBannerLoadTarget) {
        if (thinkerBannerLoadTarget && thinkerBannerLoadHandler) thinkerBannerLoadTarget.removeEventListener("load", thinkerBannerLoadHandler);
        thinkerBannerLoadTarget = artwork;
        thinkerBannerLoadHandler = () => { thinkerBannerLoadTarget = null; thinkerBannerLoadHandler = null; scheduleThinkerBannerPosition(); };
        artwork.addEventListener("load", thinkerBannerLoadHandler, {once:true});
      }
    }
  }
