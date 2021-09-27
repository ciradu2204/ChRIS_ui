import { action } from "typesafe-actions";
import {
  WorkflowTypes,
  AnalysisStep,
  AnalysisPayload,
  SelectWorkflowState,
  TreeNode,
} from "./types";
import { LocalFile } from "../../components/feed/CreateFeed/types";
import { PipelinePipingDefaultParameterList } from "@fnndsc/chrisapi";

export const getPacsFilesRequest = (
  name?: string,
  limit?: number,
  offset?: number
) => action(WorkflowTypes.GET_PACS_FILES_REQUEST, { name, limit, offset });

export const setLocalFile = (files: LocalFile[]) =>
  action(WorkflowTypes.SET_LOCAL_FILE, files);

export const setOptionState = (optionState: SelectWorkflowState) =>
  action(WorkflowTypes.SET_OPTION_STATE, optionState);

export const submitAnalysis = (
  analysisPayload: AnalysisPayload & {
    pipelinePlugins?: any[];
    pluginParameters?: PipelinePipingDefaultParameterList;
    pluginPipings?: any[];
  }
) => action(WorkflowTypes.SUBMIT_ANALYSIS, analysisPayload);

export const setAnalysisStep = (step: AnalysisStep) =>
  action(WorkflowTypes.SET_ANALYSIS_STEP, step);

export const setInfantAge = (value: string) =>
  action(WorkflowTypes.SET_INFANT_AGE, value);

export const resetWorkflowState = () =>
  action(WorkflowTypes.RESET_WORKFLOW_STEP);

export const stopFetchingPluginResources = () =>
  action(WorkflowTypes.STOP_FETCHING_PLUGIN_RESOURCES);

export const setPluginFiles = (files: any[]) =>
  action(WorkflowTypes.SET_PLUGIN_FILES, files);

export const deleteLocalFile = (fileName: string) =>
  action(WorkflowTypes.DELETE_LOCAL_FILE, fileName);

export const setFeedDetails = (id: number) =>
  action(WorkflowTypes.SET_FEED_DETAILS, id);

export const stopAnalysis = () => action(WorkflowTypes.STOP_ANALYSIS);

export const setCurrentStep = (id: number) =>
  action(WorkflowTypes.SET_CURRENT_STEP, id);

export const clearFileSelection = () =>
  action(WorkflowTypes.CLEAR_FILE_SELECTION);

export const generatePipeline = (data: any) =>
  action(WorkflowTypes.GENERATE_PIPELINE, data);

export const setPluginPipingsSuccess = (pluginPipings: any) =>
  action(WorkflowTypes.SET_PLUGIN_PIPINGS_LIST, pluginPipings);

export const setComputeEnvs = (computeEnvs: { [key: string]: any[] }) =>
  action(WorkflowTypes.SET_COMPUTE_ENVS, computeEnvs);

export const setUploadedSpec = (pipeline: any) =>
  action(WorkflowTypes.SET_UPLOADED_SPEC, pipeline);

export const setUploadedSpecSuccess = (workflowType: string) =>
  action(WorkflowTypes.SET_UPLOADED_SPEC_SUCCESS, workflowType);

export const setPluginParametersSuccess = (
  parameters: PipelinePipingDefaultParameterList
) => action(WorkflowTypes.SET_PLUGIN_PARAMETERS, parameters);

export const setPipelinePluginsSuccess = (pipelineInstances: any[]) =>
  action(WorkflowTypes.SET_PIPELINE_PLUGINS, pipelineInstances);

export const setCurrentNode = (node: { data: TreeNode; pluginName: string }) =>
  action(WorkflowTypes.SET_CURRENT_NODE, node);
