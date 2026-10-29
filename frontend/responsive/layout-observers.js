        thinkerLayoutDisposer?.();
        const tracked = new Set();
        const ownLayoutNode = node => node?.nodeType === 1 && Boolean(node.closest?.("#oi-wrapper,#thinker-chess-banner,.tc-engine-options,.myarrow,.myhigh,.thinker-eval-v2-overlay"));
        const refreshLayoutTargets = () => {
          const next = new Set([document.getElementById("oi-wrapper")]);
          const candidates = document.querySelectorAll("wc-chess-board, chess-board, #board-single, .board, .chess-board, [class*='board-component'], .play-controller-component, .board-layout-sidebar, .layout-board-sidebar, #board-layout-sidebar, [data-cy*='sidebar'], [data-test-element*='sidebar'], [class*='game-panel'], aside, [role='complementary']");
          for (const node of [...candidates, getThinkerBannerSidebar()]) {
            if (!node || ownLayoutNode(node) || isExcludedThinkerSidebarCandidate(node)) continue;
            for (let current = node; current && current !== document.body && current !== document.documentElement; current = current.parentElement) {
              if (!ownLayoutNode(current)) { next.add(current); }
            }
          }
          next.delete(null);
          if (next.size === tracked.size && [...next].every(node => tracked.has(node))) return;
          thinkerBannerResizeObserver?.disconnect();
          thinkerBannerLayoutObserver.disconnect();
          thinkerBannerLayoutObserver.observe(document.body, { childList: true, subtree: true });
          thinkerBannerLayoutObserver.observe(document.documentElement, {attributes:true,attributeFilter:["class","style"]});
          for (const node of next) if (!ownLayoutNode(node)) thinkerBannerLayoutObserver.observe(node, {attributes:true,attributeFilter:["class","style","hidden","aria-hidden"]});
          tracked.clear();
          for (const node of next) { tracked.add(node); thinkerBannerResizeObserver?.observe(node); }
        };
        thinkerBannerLayoutObserver = new MutationObserver(records => {
          if (!records.some(record => !ownLayoutNode(record.target))) return;
          thinkerResizeHandler();
        });
        if (typeof ResizeObserver === "function") thinkerBannerResizeObserver = new ResizeObserver(thinkerResizeHandler);
        thinkerBannerLayoutObserver.observe(document.body, { childList: true, subtree: true });
        thinkerBannerLayoutObserver.observe(document.documentElement, {attributes:true,attributeFilter:["class","style"]});
        refreshLayoutTargets();
        const onVisibleLayout = () => { if (!document.hidden) thinkerResizeHandler(); };
        document.addEventListener("visibilitychange", onVisibleLayout);
        window.addEventListener("scroll", thinkerResizeHandler, {capture:true,passive:true});
        const viewport = window.visualViewport;
        viewport?.addEventListener("resize", thinkerResizeHandler, {passive:true});
        viewport?.addEventListener("scroll", thinkerResizeHandler, {passive:true});
        let densityQuery;
        const onDensityChange = () => { watchDensity(); thinkerResizeHandler(); };
        const watchDensity = () => {
          densityQuery?.removeEventListener("change", onDensityChange);
          densityQuery = window.matchMedia?.(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
          densityQuery?.addEventListener("change", onDensityChange, {once:true});
        };
        watchDensity();
        const activeLayoutHandler = thinkerResizeHandler;
        thinkerLayoutDisposer = () => {
          window.removeEventListener("scroll", activeLayoutHandler, true);
          document.removeEventListener("visibilitychange", onVisibleLayout);
          viewport?.removeEventListener("resize", activeLayoutHandler);
          viewport?.removeEventListener("scroll", activeLayoutHandler);
          densityQuery?.removeEventListener("change", onDensityChange);
          tracked.clear();
        };
        scheduleThinkerBannerPosition();
        scheduleThinkerWorkspaceLayout();
