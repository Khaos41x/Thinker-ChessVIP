  let thinkerLayoutDisposer = null;
  let thinkerBannerLoadTarget = null;
  let thinkerBannerLoadHandler = null;
  function cleanupThinkerUiLifecycle({ removeMenu = false } = {}) {
    if (thinkerBannerLoadTarget && thinkerBannerLoadHandler) thinkerBannerLoadTarget.removeEventListener("load", thinkerBannerLoadHandler);
    thinkerBannerLoadTarget = null; thinkerBannerLoadHandler = null;
    thinkerLayoutDisposer?.();
    thinkerLayoutDisposer = null;
    if (thinkerUiReconcileTimer !== null) clearInterval(thinkerUiReconcileTimer);
    thinkerUiReconcileTimer = null;
    setThinkerPageScrollbarHidden(false);
    if (thinkerBannerFrame !== null && typeof cancelAnimationFrame === "function") cancelAnimationFrame(thinkerBannerFrame);
    if (thinkerWorkspaceFrame !== null && typeof cancelAnimationFrame === "function") cancelAnimationFrame(thinkerWorkspaceFrame);
    thinkerBannerFrame = null;
    thinkerWorkspaceFrame = null;
    if (thinkerBannerResizeObserver) thinkerBannerResizeObserver.disconnect();
    if (thinkerBannerLayoutObserver) thinkerBannerLayoutObserver.disconnect();
    thinkerBannerResizeObserver = null;
    thinkerBannerLayoutObserver = null;
    thinkerObservedBannerSidebar = null;
    if (thinkerResizeHandler) window.removeEventListener("resize", thinkerResizeHandler);
    thinkerResizeHandler = null;
    if (thinkerKeyboardFocusHandler) document.removeEventListener("keydown", thinkerKeyboardFocusHandler, true);
    thinkerKeyboardFocusHandler = null;
    if (thinkerUrlMonitorTimer !== null) clearInterval(thinkerUrlMonitorTimer);
    thinkerUrlMonitorTimer = null;
    scheduleThinkerBannerPosition = () => {};
    scheduleThinkerWorkspaceLayout = () => {};
    thinkerUiBound = false;
    _menuReady = false;
    if (removeMenu) {
      const menu = document.getElementById("krypbot-container");
      thinkerWorkspaceCollapsed = Boolean(menu?.classList.contains("minimized"));
      if (menu && typeof menu.remove === "function") menu.remove();
      else if (menu && menu.parentNode) menu.parentNode.removeChild(menu);
      thinkerMenuNode = null;
    }
  }
