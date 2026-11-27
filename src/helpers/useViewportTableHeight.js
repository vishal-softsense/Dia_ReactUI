import { useCallback, useLayoutEffect, useState } from "react";

/**
 * Checks whether an element sits inside the bottom-most visible card within `.page-content`,
 * ignoring Toastify containers and Reactstrap modal portals/wrappers.
 */
export const isStandaloneTableCard = (el) => {
  const pageContent = el?.closest?.(".page-content");
  if (!pageContent) return false;

  let outermostCard = null;
  let cursor = el;
  while (cursor && cursor !== pageContent) {
    if (cursor.classList?.contains("card")) {
      outermostCard = cursor;
    }
    cursor = cursor.parentElement;
  }

  if (!outermostCard) return false;

  let branch = outermostCard;
  while (branch && branch !== pageContent) {
    let next = branch.nextElementSibling;
    while (next) {
      if (
        !next.classList?.contains("Toastify") &&
        !next.classList?.contains("modal")
      ) {
        return false;
      }
      next = next.nextElementSibling;
    }
    branch = branch.parentElement;
  }

  return true;
};

/**
 * Dynamically fits a scrollable table/report container inside the remaining viewport height
 * so desktop/tablet viewports scroll only inside the table container (zero parent page scroll).
 */
export const useViewportTableHeight = (
  scrollContainerRef,
  {
    footerRef = null,
    maxHeight = null,
    bottomGap = 2,
    compactOuterChrome = true,
    fallbackHeight = "clamp(220px, 55vh, 460px)",
    initialHeight = "calc(100vh - 380px)",
    enabled = true,
    deps = [],
  } = {}
) => {
  const [computedMaxHeight, setComputedMaxHeight] = useState(
    maxHeight || initialHeight
  );
  const depsKey = Array.isArray(deps)
    ? deps.map((item) => String(item ?? "")).join("|")
    : "";

  const updateDynamicHeight = useCallback(() => {
    if (!enabled) return;
    if (maxHeight) {
      setComputedMaxHeight(maxHeight);
      return;
    }
    const el = scrollContainerRef?.current;
    if (!el || typeof window === "undefined") return;

    const rect = el.getBoundingClientRect();
    const docTop = rect.top + (window.scrollY || window.pageYOffset || 0);
    const viewportHeight =
      document.documentElement?.clientHeight || window.innerHeight;
    const footerHeight =
      footerRef && footerRef.current
        ? footerRef.current.getBoundingClientRect().height
        : 0;

    let followingSiblingsHeight = 0;
    if (!footerRef || !footerRef.current) {
      let sib = el.nextElementSibling;
      while (sib) {
        const scs = window.getComputedStyle(sib);
        if (scs.display !== "none" && scs.position !== "absolute" && scs.position !== "fixed") {
          followingSiblingsHeight +=
            sib.getBoundingClientRect().height +
            (parseFloat(scs.marginTop) || 0) +
            (parseFloat(scs.marginBottom) || 0);
        }
        sib = sib.nextElementSibling;
      }
    }

    let ancestorBelow = 0;
    let node = el.parentElement;
    while (node && node !== document.body) {
      const cs = window.getComputedStyle(node);
      ancestorBelow +=
        (parseFloat(cs.paddingBottom) || 0) +
        (parseFloat(cs.borderBottomWidth) || 0) +
        (parseFloat(cs.marginBottom) || 0);
      if (node.classList?.contains("page-content")) break;
      node = node.parentElement;
    }
    if (!node || !node.classList?.contains("page-content")) {
      ancestorBelow = window.innerWidth < 576 ? 88 : 108;
    }

    const layoutFooter = document.querySelector(".main-content > .footer");
    let layoutFooterHeight = 0;
    if (layoutFooter) {
      const lcs = window.getComputedStyle(layoutFooter);
      if (lcs.display !== "none" && lcs.position !== "absolute" && lcs.position !== "fixed") {
        layoutFooterHeight = layoutFooter.getBoundingClientRect().height;
      }
    }

    const available = Math.floor(
      viewportHeight -
        docTop -
        footerHeight -
        followingSiblingsHeight -
        ancestorBelow -
        layoutFooterHeight -
        bottomGap
    );
    const standalone = isStandaloneTableCard(el);
    const minViewportFit = standalone && window.innerWidth >= 768 ? 90 : 180;

    if (available >= minViewportFit) {
      setComputedMaxHeight(`${available}px`);
    } else {
      setComputedMaxHeight(fallbackHeight);
    }
  }, [
    enabled,
    maxHeight,
    scrollContainerRef,
    footerRef,
    bottomGap,
    fallbackHeight,
  ]);

  useLayoutEffect(() => {
    if (!enabled) return undefined;
    const el = scrollContainerRef?.current;
    if (!el) return undefined;

    const pageContent = el.closest?.(".page-content");
    let card = null;
    let cursor = el;
    while (cursor && cursor !== pageContent) {
      if (cursor.classList?.contains("card")) {
        card = cursor;
      }
      cursor = cursor.parentElement;
    }

    const shouldCompactOuterChrome =
      compactOuterChrome && !maxHeight && isStandaloneTableCard(el);
    const prevCardMarginBottom = shouldCompactOuterChrome
      ? card.style.marginBottom
      : null;
    const prevPagePaddingBottom = shouldCompactOuterChrome
      ? pageContent.style.paddingBottom
      : null;

    if (shouldCompactOuterChrome) {
      card.style.marginBottom = "0px";
      pageContent.style.paddingBottom = "8px";
      pageContent.classList.add("table-compact-page");
      document.documentElement.classList.add("table-compact-viewport");
      if (
        window.innerWidth >= 768 &&
        (window.scrollY || window.pageYOffset || 0) > 0
      ) {
        window.scrollTo(0, 0);
      }
    }

    updateDynamicHeight();
    const rafId =
      typeof requestAnimationFrame !== "undefined"
        ? requestAnimationFrame(updateDynamicHeight)
        : null;

    const handleResize = () => updateDynamicHeight();
    window.addEventListener("resize", handleResize);

    let resizeObserver = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => updateDynamicHeight());
      if (el.parentElement) resizeObserver.observe(el.parentElement);
      if (footerRef?.current) resizeObserver.observe(footerRef.current);
      if (pageContent) resizeObserver.observe(pageContent);
    }

    let attrObserver = null;
    if (typeof MutationObserver !== "undefined") {
      attrObserver = new MutationObserver(() => updateDynamicHeight());
      attrObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: [
          "class",
          "data-sidebar-size",
          "data-layout",
          "data-layout-style",
          "data-layout-width",
        ],
      });
    }

    return () => {
      if (shouldCompactOuterChrome) {
        card.style.marginBottom = prevCardMarginBottom ?? "";
        pageContent.style.paddingBottom = prevPagePaddingBottom ?? "";
        pageContent.classList.remove("table-compact-page");
        document.documentElement.classList.remove("table-compact-viewport");
      }
      if (rafId !== null && typeof cancelAnimationFrame !== "undefined") {
        cancelAnimationFrame(rafId);
      }
      window.removeEventListener("resize", handleResize);
      if (resizeObserver) resizeObserver.disconnect();
      if (attrObserver) attrObserver.disconnect();
    };
  }, [updateDynamicHeight, compactOuterChrome, maxHeight, enabled, footerRef, scrollContainerRef, depsKey]);

  return computedMaxHeight;
};

export default useViewportTableHeight;

