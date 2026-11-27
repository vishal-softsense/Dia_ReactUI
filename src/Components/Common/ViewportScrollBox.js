import React, { useRef } from "react";
import useViewportTableHeight from "../../helpers/useViewportTableHeight";

/**
 * Scrollable wrapper that sizes itself dynamically to the remaining viewport height
 * and keeps parent-page scrolling disabled on standalone list/report cards.
 */
const ViewportScrollBox = ({
  children,
  className = "table-responsive",
  style,
  footerRef = null,
  maxHeight = null,
  bottomGap = 2,
  compactOuterChrome = true,
  enabled = true,
  deps = [],
  ...rest
}) => {
  const scrollRef = useRef(null);
  const computedMaxHeight = useViewportTableHeight(scrollRef, {
    footerRef,
    maxHeight,
    bottomGap,
    compactOuterChrome,
    enabled,
    deps,
  });

  return (
    <div
      ref={scrollRef}
      className={`${className} viewport-table-scroll`.trim()}
      style={{
        ...style,
        maxHeight: maxHeight || computedMaxHeight,
      }}
      {...rest}
    >
      {children}
    </div>
  );
};

export default ViewportScrollBox;

