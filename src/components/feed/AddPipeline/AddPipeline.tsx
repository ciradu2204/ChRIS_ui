import React from "react";
import { useDispatch } from "react-redux";
import ReactJson from "react-json-view";
import { Button, Modal, ModalVariant } from "@patternfly/react-core";
import { MdOutlineAddCircle } from "react-icons/md";
import PipelineContainer from "../CreateFeed/PipelineContainer";
import { PipelineContext } from "../CreateFeed/context";
import ChrisAPIClient from "../../../api/chrisapiclient";
import { useTypedSelector } from "../../../store/hooks";
import {
  getSelectedPlugin,
  getPluginInstancesSuccess,
} from "../../../store/pluginInstance/actions";
import { getPluginInstanceStatusRequest } from "../../../store/resources/actions";
import { PipelineTypes } from "../CreateFeed/types/pipeline";
import { getNodeOperations } from "../../../store/plugin/actions";

const AddPipeline = () => {
  const reactDispatch = useDispatch();
  const feed = useTypedSelector((state) => state.feed.currentFeed.data);
  const { selectedPlugin } = useTypedSelector((state) => state.instance);
  const { childPipeline } = useTypedSelector(
    (state) => state.plugin.nodeOperations
  );
  const { state, dispatch: pipelineDispatch } =
    React.useContext(PipelineContext);
  const { pipelineData, selectedPipeline } = state;
  const [error, setError] = React.useState({});

  const handleToggle = () => {
    reactDispatch(getNodeOperations("childPipeline"));
  };

  const addPipeline = async () => {
    if (selectedPlugin && selectedPipeline && feed) {
      setError({});
      const {
        pluginPipings,
        pipelinePlugins,
        pluginParameters,
        computeEnvs,
        parameterList,
        title,
      } = pipelineData[selectedPipeline];

      if (pluginPipings && pluginParameters && pipelinePlugins) {
        const client = ChrisAPIClient.getClient();
        try {
          const nodes_info = client.computeWorkflowNodesInfo(
            //@ts-ignore
            pluginParameters.data
          );
          nodes_info.forEach((node) => {
            if (computeEnvs && computeEnvs[node["piping_id"]]) {
              const compute_node =
                computeEnvs[node["piping_id"]]["currentlySelected"];

              const titleChange = title && title[node["piping_id"]];
              if (titleChange) {
                node.title = titleChange;
              }
              if (compute_node) {
                node.compute_resource_name = compute_node;
              }
            }

            if (parameterList && parameterList[node["piping_id"]]) {
              const params = parameterList[node["piping_id"]];
              node["plugin_parameter_defaults"] = params;
            }
          });
          await client.createWorkflow(selectedPipeline, {
            previous_plugin_inst_id: selectedPlugin.data.id,
            nodes_info: JSON.stringify(nodes_info),
          });

          pipelineDispatch({
            type: PipelineTypes.ResetState,
          });

          const data = await feed.getPluginInstances({
            limit: 1000,
          });
          if (data.getItems()) {
            const instanceList = data.getItems();
            const firstInstance = instanceList && instanceList[0];
            reactDispatch(getSelectedPlugin(firstInstance));
            if (instanceList) {
              const pluginInstanceObj = {
                selected: firstInstance,
                pluginInstances: instanceList,
              };
              reactDispatch(getPluginInstancesSuccess(pluginInstanceObj));
              reactDispatch(getPluginInstanceStatusRequest(pluginInstanceObj));
            }
          }
        } catch (error: any) {
          setError(error.response.data);
        }
      }
      handleToggle();
    }
  };

  return (
    <React.Fragment>
      <Button
        icon={<MdOutlineAddCircle />}
        onClick={handleToggle}
        type="button"
      >
        Add a Pipeline{" "}
        <span style={{ padding: "2px", color: "#F5F5DC", fontSize: "11px" }}>
          ( P )
        </span>
      </Button>
      <Modal
        variant={ModalVariant.large}
        aria-label="My Pipeline Modal"
        isOpen={childPipeline}
        onClose={handleToggle}
        description="Add a Pipeline to the plugin instance"
        actions={[
          <Button
            isDisabled={!state.selectedPipeline}
            key="confirm"
            variant="primary"
            onClick={addPipeline}
          >
            Confirm
          </Button>,
          <Button key="cancel" variant="link" onClick={handleToggle}>
            Cancel
          </Button>,
        ]}
      >
        <PipelineContainer />
        {Object.keys(error).length > 0 && <ReactJson theme='grayscale' src={error} />}
      </Modal>
    </React.Fragment>
  );
};

export default AddPipeline;
