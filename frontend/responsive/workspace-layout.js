        function updateWorkspaceLayout() {
          const wrapper = document.getElementById("oi-wrapper");
          if (!wrapper || !document.body) return;
          if (wrapper.parentNode !== document.body || wrapper.nextSibling) document.body.appendChild(wrapper);
          const board = document.querySelector(
            "wc-chess-board, chess-board, #board-single, .board, .chess-board, [class*='board-component']",
          );
          const sidebar = findThinkerSidebar();
          const boardRect = getThinkerRect(board);
          const gameplayDocumentBottom = Math.max(
            boardRect?.bottom || 0,
            getThinkerRect(sidebar)?.bottom || 0,
          ) + window.scrollY;
          const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
          const wrapperWidth = Math.min(1034, Math.max(0, Math.floor(viewportWidth)));
          if (wrapper.style.width !== wrapperWidth + "px") wrapper.style.setProperty("width", wrapperWidth + "px", "important");
          const measuredWrapperWidth = wrapper.clientWidth;
          const mode = measuredWrapperWidth >= 1034 ? "desktop" : "stacked";
          if (wrapper.dataset.layoutMode !== mode) wrapper.dataset.layoutMode = mode;
          const workspaceGap = wrapper.dataset.layoutMode === "desktop" ? 0 : THINKER_WORKSPACE_GAP_PX;
          const safeTop = Math.max(window.innerHeight, gameplayDocumentBottom) + workspaceGap;
          syncTimingModeGeometry(thinkerMenuNode);
          const safeLeft = Math.round(window.scrollX + Math.max(0, (viewportWidth - measuredWrapperWidth) / 2));
          const point = globalThis.ThinkerResponsive.localPoint(wrapper, safeLeft, Math.ceil(safeTop));
          if (wrapper.style.top !== point.top + "px") wrapper.style.setProperty("top", point.top + "px", "important");
          if (wrapper.style.left !== point.left + "px") wrapper.style.setProperty("left", point.left + "px", "important");
        }
        scheduleThinkerWorkspaceLayout = () => {
          if (thinkerWorkspaceFrame !== null) return;
          thinkerWorkspaceFrame = requestAnimationFrame(() => {
            thinkerWorkspaceFrame = null;
            refreshLayoutTargets();
            updateWorkspaceLayout();
          });
        };
        thinkerResizeHandler = () => {
          scheduleThinkerBannerPosition();
          scheduleThinkerWorkspaceLayout();
        };
        window.addEventListener("resize", thinkerResizeHandler, { passive: true });
