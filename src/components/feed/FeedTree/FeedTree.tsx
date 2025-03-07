import React, { useRef } from "react";
import { useDispatch } from "react-redux";
import { isEqual } from "lodash";
import { Switch, Alert, TextInput } from "@patternfly/react-core";
import useSize from "./useSize";
import { tree, hierarchy, HierarchyPointLink } from "d3-hierarchy";
import { select, event } from "d3-selection";
import { zoom as d3Zoom, zoomIdentity } from "d3-zoom";
import { PluginInstance } from "@fnndsc/chrisapi";
import { AiOutlineRotateLeft, AiOutlineRotateRight } from "react-icons/ai";
import Link from "./Link";
import NodeWrapper from "./Node";
import { TreeNodeDatum, Point, treeAlgorithm } from "./data";
import TransitionGroupWrapper from "./TransitionGroupWrapper";
import { TSID } from "./ParentComponent";
import { useTypedSelector } from "../../../store/hooks";
import {
  setFeedLayout,
  setSearchFilter,
  setTranslate,
} from "../../../store/feed/actions";
import { FeedTreeProp } from "../../../store/feed/types";
import { FeedTreeScaleType, NodeScaleDropdown } from "./Controls";
import { getNodeOperations } from "../../../store/plugin/actions";
import { switchTreeMode } from "../../../store/tsplugins/actions";

interface Separation {
  siblings: number;
  nonSiblings: number;
}

interface OwnProps {
  tsIds?: TSID;
  data: TreeNodeDatum[];
  onNodeClick: (node: any) => void;
  onNodeClickTs: (node: PluginInstance) => void;
  translate?: Point;
  scaleExtent: {
    min: number;
    max: number;
  };
  zoom: number;
  nodeSize: {
    x: number;
    y: number;
  };
  separation: Separation;
  orientation: "horizontal" | "vertical";
  changeOrientation: (orientation: string) => void;
}

type AllProps = OwnProps;

type FeedTreeState = {
  d3: {
    translate: Point;
    scale: number;
  };
  overlayScale: {
    // overlay of individual nodes based on time or size
    enabled: boolean;
    type: FeedTreeScaleType;
  };
  collapsible: boolean;
  toggleLabel: boolean;
  search: boolean;
};

function calculateD3Geometry(nextProps: AllProps, feedTreeProp: FeedTreeProp) {
  let scale;
  if (nextProps.zoom > nextProps.scaleExtent.max) {
    scale = nextProps.scaleExtent.max;
  } else if (nextProps.zoom < nextProps.scaleExtent.min) {
    scale = nextProps.scaleExtent.min;
  } else {
    scale = nextProps.zoom;
  }
  return {
    translate: feedTreeProp.translate,
    scale,
  };
}

function getInitialState(
  props: AllProps,
  feedTreeProp: FeedTreeProp
): FeedTreeState {
  return {
    d3: calculateD3Geometry(props, feedTreeProp),
    overlayScale: {
      enabled: false,
      type: "time",
    },
    collapsible: false,
    toggleLabel: false,
    search: false,
  };
}

const svgClassName = "feed-tree__svg";
const graphClassName = "feed-tree__graph";

const FeedTree = (props: AllProps) => {
  const dispatch = useDispatch();

  const divRef = useRef<HTMLDivElement>(null);
  const { feedTreeProp, currentLayout, searchFilter } = useTypedSelector(
    (state) => state.feed
  );
  const { selectedD3Node } = useTypedSelector((state) => state.instance);
  const { treeMode } = useTypedSelector((state) => state.tsPlugins);
  const [feedTree, setFeedTree] = React.useState<{
    nodes?: any[];
    links?: HierarchyPointLink<TreeNodeDatum>[];
  }>({
    nodes: [],
    links: [],
  });
  const size = useSize(divRef);
  const { nodeSize, orientation, separation, tsIds } = props;

  const generateTree = React.useCallback(
    (data: TreeNodeDatum[]) => {
      const d3Tree = tree<TreeNodeDatum>()
        .nodeSize(
          orientation === "horizontal"
            ? [nodeSize.y, nodeSize.x]
            : [nodeSize.x, nodeSize.y]
        )
        .separation((a, b) => {
          return a.data.parentId === b.data.parentId
            ? separation.siblings
            : separation.nonSiblings;
        });

      let nodes;
      let links: HierarchyPointLink<TreeNodeDatum>[] | undefined = undefined;
      let newLinks: HierarchyPointLink<TreeNodeDatum>[] = [];

      if (data) {
        const rootNode = d3Tree(
          hierarchy(data[0], (d) => (d.__rd3t.collapsed ? null : d.children))
        );
        nodes = rootNode.descendants();
        links = rootNode.links();

        const newLinksToAdd: any[] = [];

        if (tsIds) {
          links.forEach((link) => {
            const targetId = link.target.data.id;
            const sourceId = link.target.data.id;

            if (targetId && sourceId && (tsIds[targetId] || tsIds[sourceId])) {
              // tsPlugin found
              let topologicalLink: any;

              if (tsIds[targetId]) {
                topologicalLink = link.target;
              } else {
                topologicalLink = link.source;
              }

              const parents = tsIds[topologicalLink.data.id];
              const dict: any = {};
              links &&
                links.forEach((link) => {
                  for (let i = 0; i < parents.length; i++) {
                    if (
                      link.source.data.id === parents[i] &&
                      !dict[link.source.data.id]
                    ) {
                      dict[link.source.data.id] = link.source;
                    } else if (
                      link.target.data.id === parents[i] &&
                      !dict[link.target.data.id]
                    ) {
                      dict[link.target.data.id] = link.target;
                    }
                  }

                  return dict;
                });

              for (const i in dict) {
                newLinksToAdd.push({
                  source: dict[i],
                  target: topologicalLink,
                });
              }
            }
          });
        }

        newLinks = [...links, ...newLinksToAdd];
      }

      return { nodes, newLinks: newLinks };
    },
    [
      nodeSize.x,
      nodeSize.y,
      orientation,
      separation.nonSiblings,
      separation.siblings,
      tsIds,
    ]
  );

  React.useEffect(() => {
    //@ts-ignore
    if (size && size.width) {
      //@ts-ignore
      dispatch(setTranslate({ x: size.width / 2, y: 90 }));
    }
  }, [size, dispatch]);

  const mode = useTypedSelector((state) => state.tsPlugins.treeMode);
  const [feedState, setFeedState] = React.useState<FeedTreeState>(
    getInitialState(props, feedTreeProp)
  );
  const { scale } = feedState.d3;
  const { changeOrientation, zoom, scaleExtent } = props;

  const bindZoomListener = React.useCallback(() => {
    const { translate } = feedTreeProp;
    const svg = select(`.${svgClassName}`);
    const g = select(`.${graphClassName}`);

    svg.call(
      //@ts-ignore
      d3Zoom().transform,
      zoomIdentity.translate(translate.x, translate.y).scale(zoom)
    );

    svg.call(
      //@ts-ignore
      d3Zoom()
        .scaleExtent([scaleExtent.min, scaleExtent.max])
        .on("zoom", () => {
          g.attr("transform", event.transform);
        })
    );
  }, [zoom, scaleExtent, feedTreeProp]);

  React.useEffect(() => {
    bindZoomListener();
  }, [bindZoomListener]);

  React.useEffect(() => {
    const svg = select(`.${svgClassName}`);
    svg.on("keydown", () => {
      if (links && feedTree.nodes) {
        treeAlgorithm(event, selectedD3Node, feedTree.nodes, props.onNodeClick);
      }

      if (event.code === "KeyT") {
        dispatch(getNodeOperations("terminal"));
      }

      if (event.code === "KeyC") {
        dispatch(getNodeOperations("childNode"));
      }

      if (event.code === "KeyG") {
        if (treeMode === true) {
          dispatch(switchTreeMode(false));
        } else {
          dispatch(switchTreeMode(true));
        }
        dispatch(getNodeOperations("childGraph"));
      }

      if (event.code === "KeyP") {
        dispatch(getNodeOperations("childPipeline"));
      }

      if (event.code === "KeyD") {
        dispatch(getNodeOperations("deleteNode"));
      }
    });
  });

  React.useEffect(() => {
    if (props.data) {
      const { nodes, newLinks: links } = generateTree(props.data);
      setFeedTree(() => {
        return {
          nodes,
          links,
        };
      });
    }
  }, [props.data, props.tsIds, generateTree]);

  const handleChange = (feature: string, data?: any) => {
    if (feature === "scale_enabled") {
      setFeedState({
        ...feedState,
        overlayScale: {
          ...feedState.overlayScale,
          enabled: !feedState.overlayScale.enabled,
        },
      });
    } else if (feature === "scale_type") {
      setFeedState({
        ...feedState,
        overlayScale: {
          ...feedState.overlayScale,
          type: data,
        },
      });
    } else {
      setFeedState({
        ...feedState,
        //@ts-ignore
        [feature]: !feedState[feature],
      });
    }
  };

  const handleNodeClick = (item: any) => {
    props.onNodeClick(item);
  };

  const handleNodeClickTs = (item: PluginInstance) => {
    props.onNodeClickTs(item);
  };

  const { nodes, links } = feedTree;

  return (
    <div
      className={`feed-tree setFlex grabbable mode_${
        mode === false ? "graph" : "tree"
      }`}
      ref={divRef}
    >
      <div className="feed-tree__container">
        <div className="feed-tree__container--labels">
          <div
            onClick={() => {
              changeOrientation(orientation);
            }}
            className="feed-tree__orientation"
          >
            {orientation === "vertical" ? (
              <AiOutlineRotateLeft className="feed-tree__orientation--icon" />
            ) : (
              <AiOutlineRotateRight className="feed-tree__orientation--icon" />
            )}
          </div>

          <div className="feed-tree__control">
            <Switch
              id="labels"
              label="Hide Labels"
              labelOff="Show Labels"
              isChecked={feedState.toggleLabel}
              onChange={() => {
                handleChange("toggleLabel");
              }}
            />
          </div>
          <div className="feed-tree__control">
            <Switch
              id="layout"
              label="Switch Layout"
              labelOff="3D"
              isChecked={currentLayout}
              onChange={() => {
                dispatch(setFeedLayout());
              }}
            />
          </div>

          <div className="feed-tree__control feed-tree__individual-scale">
            <Switch
              id="individual-scale"
              label="Scale Nodes On"
              labelOff="Scale Nodes Off "
              isChecked={feedState.overlayScale.enabled}
              onChange={() => {
                handleChange("scale_enabled");
              }}
            />

            {feedState.overlayScale.enabled && (
              <div className="dropdown-wrap">
                <NodeScaleDropdown
                  selected={feedState.overlayScale.type}
                  onChange={(type) => {
                    handleChange("scale_type", type);
                  }}
                />
              </div>
            )}
          </div>
          <div className="feed-tree__control">
            <Switch
              id="search"
              label="Search On"
              labelOff="Search Off "
              isChecked={feedState.search}
              onChange={() => {
                handleChange("search");
              }}
            />
          </div>

          <div className="feed-tree__control">
            {feedState.search && (
              <TextInput
                value={searchFilter.value}
                onChange={(value: string) => {
                  dispatch(setSearchFilter(value.trim()));
                }}
              />
            )}
          </div>

          {mode === false && (
            <div className="feed-tree__orientation">
              <Alert
                variant="info"
                title="You are now in a ts node selection mode"
              />
            </div>
          )}
        </div>
      </div>

      {feedTreeProp.translate.x > 0 && feedTreeProp.translate.y > 0 && (
        <svg
          focusable="true"
          className={`${svgClassName}`}
          width="100%"
          height="100%"
          tabIndex={0}
        >
          <TransitionGroupWrapper
            component="g"
            className={graphClassName}
            transform={`translate(${feedTreeProp.translate.x},${feedTreeProp.translate.y}) scale(${scale})`}
          >
            {links?.map((linkData, i) => {
              return (
                <Link
                  orientation={orientation}
                  key={"link" + i}
                  linkData={linkData}
                />
              );
            })}

            {nodes?.map(({ data, x, y, parent }, i) => {
              return (
                <NodeWrapper
                  key={`node + ${i}`}
                  data={data}
                  position={{ x, y }}
                  parent={parent}
                  onNodeClick={handleNodeClick}
                  onNodeClickTs={handleNodeClickTs}
                  orientation={orientation}
                  toggleLabel={feedState.toggleLabel}
                  overlayScale={
                    feedState.overlayScale.enabled
                      ? feedState.overlayScale.type
                      : undefined
                  }
                />
              );
            })}
          </TransitionGroupWrapper>
        </svg>
      )}
    </div>
  );
};

export default React.memo(
  FeedTree,
  (prevProps: AllProps, nextProps: AllProps) => {
    if (
      !isEqual(prevProps.data, nextProps.data) ||
      prevProps.zoom !== nextProps.zoom ||
      prevProps.tsIds !== nextProps.tsIds
    ) {
      return false;
    }
    return true;
  }
);

FeedTree.defaultProps = {
  orientation: "vertical",
  scaleExtent: { min: 0.1, max: 1 },
  zoom: 1,
  nodeSize: { x: 120, y: 80 },
};
