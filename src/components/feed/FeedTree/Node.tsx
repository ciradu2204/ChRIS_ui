import React, { Fragment, useRef } from "react";
import { select } from "d3-selection";
import { HierarchyPointNode } from "d3-hierarchy";
import { Datum, TreeNodeDatum, Point } from "./data";
import { PluginInstance } from "@fnndsc/chrisapi";
import { useTypedSelector } from "../../../store/hooks";
import { FeedTreeScaleType } from "./Controls";
import { useDispatch } from "react-redux";
import { getSelectedD3Node } from "../../../store/pluginInstance/actions";

type NodeWrapperProps = {
  tsNodes?: PluginInstance[];
  data: TreeNodeDatum;
  position: Point;
  parent: HierarchyPointNode<Datum> | null;
  onNodeClick: (node: any) => void;
  onNodeClickTs: (node: PluginInstance) => void;

  orientation: "horizontal" | "vertical";
  overlayScale?: FeedTreeScaleType;
  toggleLabel: boolean;
};

type NodeProps = NodeWrapperProps & {
  status?: string;
  overlaySize?: number;
  currentId: boolean;
};

const DEFAULT_NODE_CIRCLE_RADIUS = 12;

const setNodeTransform = (
  orientation: "horizontal" | "vertical",
  position: Point
) => {
  return orientation === "horizontal"
    ? `translate(${position.y},${position.x})`
    : `translate(${position.x}, ${position.y})`;
};

const Node = (props: NodeProps) => {
  const nodeRef = useRef<SVGGElement>(null);
  const textRef = useRef<SVGTextElement>(null);
  const {
    orientation,
    position,
    data,
    onNodeClick,
    onNodeClickTs,

    toggleLabel,
    status,
    currentId,
    overlaySize,
  } = props;

  const tsNodes = useTypedSelector((state) => state.tsPlugins.tsNodes);
  const mode = useTypedSelector((state) => state.tsPlugins.treeMode);
  const pluginInstances = useTypedSelector(
    (state) => state.instance.pluginInstances.data
  );

  const searchFilter = useTypedSelector((state) => state.feed.searchFilter);

  const { value } = searchFilter;

  const applyNodeTransform = (transform: string, opacity = 1) => {
    select(nodeRef.current)
      .attr("transform", transform)
      .style("opacity", opacity);
    select(textRef.current).attr("transform", `translate(-28, 28)`);
  };

  React.useEffect(() => {
    const nodeTransform = setNodeTransform(orientation, position);
    applyNodeTransform(nodeTransform);
  }, [orientation, position]);

  let statusClass = "";
  let tsClass = "";

  if (
    status &&
    (status === "started" ||
      status === "scheduled" ||
      status === "registeringFiles" ||
      status === "created")
  ) {
    statusClass = "active";
  }
  if (status === "waiting") {
    statusClass = "queued";
  }

  if (status === "finishedSuccessfully") {
    statusClass = "success";
  }

  if (status === "finishedWithError" || status === "cancelled") {
    statusClass = "error";
  }

  if (
    value.length > 0 &&
    (value === data.item?.data.plugin_name || value === data.item?.data.title)
  ) {
    statusClass = "search";
  }

  if (mode === false && tsNodes && tsNodes.length > 0) {
    if (data.item?.data.id) {
      const node = tsNodes.find((node) => node.data.id === data.item?.data.id);
      if (node) {
        tsClass = "graphSelected";
      }
    }
  }

  const previous_id = data.item?.data?.previous_id;
  if (previous_id) {
    const parentNode = pluginInstances?.find(
      (node) => node.data.id === previous_id
    );

    if (
      parentNode &&
      (parentNode.data.status === "cancelled" ||
        parentNode.data.status === "finishedWithError")
    ) {
      statusClass = "notExecuted";
    }
  }

  const textLabel = (
    <g id={`text_${data.id}`}>
      <text ref={textRef} className="label__title">
        {data.item?.data?.title || data.item?.data?.plugin_name}
      </text>
    </g>
  );

  return (
    <Fragment>
      <g
        id={`${data.id}`}
        ref={nodeRef}
        onClick={() => {
          if (data.item) {
            if (mode === false) {
              onNodeClickTs(data.item);
            } else {
              onNodeClick(data);
            }
          }
        }}
      >
        <circle
          id={`node_${data.id}`}
          className={`node ${statusClass} ${tsClass} 
              ${currentId && `selected`}
              `}
          r={DEFAULT_NODE_CIRCLE_RADIUS}
        ></circle>
        {overlaySize && (
          <circle
            id={`node_overlay_${data.id}`}
            className="node node-overlay"
            opacity={0.3}
            r={DEFAULT_NODE_CIRCLE_RADIUS * overlaySize}
          />
        )}
        {statusClass === "search" ? textLabel : toggleLabel ? textLabel : null}
      </g>
    </Fragment>
  );
};

const NodeMemoed = React.memo(Node);

const NodeWrapper = (props: NodeWrapperProps) => {
  const dispatch = useDispatch();
  const { data, overlayScale } = props;
  const status = useTypedSelector((state) => {
    if (data.id && state.resource.pluginInstanceStatus[data.id]) {
      return state.resource.pluginInstanceStatus[data.id].status;
    } else return;
  });

  const currentId = useTypedSelector((state) => {
    if (state.instance.selectedPlugin?.data.id === data.id) return true;
    else return false;
  });

  React.useEffect(() => {
    if (currentId) dispatch(getSelectedD3Node(data));
  }, [currentId, data, dispatch]);

  let scale; // undefined scale is treated as no indvidual scaling
  if (overlayScale === "time") {
    const instanceData = props.data.item?.data;
    if (instanceData) {
      const start = new Date(instanceData?.start_date);
      const end = new Date(instanceData?.end_date);
      scale = Math.log10(end.getTime() - start.getTime()) / 2;
    }
  } else if (overlayScale === "size") {
    // props.data.item?.
  }

  return (
    <NodeMemoed
      {...props}
      status={status || data.item?.data.status}
      overlaySize={scale}
      currentId={currentId}
    />
  );
};

export default React.memo(
  NodeWrapper,
  (prevProps: NodeWrapperProps, nextProps: NodeWrapperProps) => {
    if (
      prevProps.data !== nextProps.data ||
      prevProps.position !== nextProps.position ||
      prevProps.parent !== nextProps.parent ||
      prevProps.toggleLabel !== nextProps.toggleLabel ||
      prevProps.orientation !== nextProps.orientation
    ) {
      return false;
    }
    return true;
  }
);
