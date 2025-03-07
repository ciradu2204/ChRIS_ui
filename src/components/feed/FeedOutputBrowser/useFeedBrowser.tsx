import React from "react";
import { useTypedSelector } from "../../../store/hooks";
import { useDispatch } from "react-redux";
import { getPluginFilesRequest } from "../../../store/resources/actions";
import {
  handleClose,
  handleMaximize,
  handleMinimize,
} from "../../common/button";

const status = ["finishedSuccessfully", "finishedWithError", "cancelled"];

const getInitialDownloadState = () => {
  return {
    count: 0,
    status: false,
    plugin_name: "",
    error: "",
    fetchingFiles: false,
  };
};

export const useFeedBrowser = () => {
  const dispatch = useDispatch();
  const drawerState = useTypedSelector((state) => state.drawers);
  const [download, setDownload] = React.useState(getInitialDownloadState);

  const pluginInstances = useTypedSelector(
    (state) => state.instance.pluginInstances
  );
  const { pluginFiles, loading: filesLoading } = useTypedSelector(
    (state) => state.resource
  );
  const selected = useTypedSelector((state) => state.instance.selectedPlugin);
  const { data: plugins } = pluginInstances;

  const pluginFilesPayload = selected && pluginFiles[selected.data.id];

  const statusTitle = useTypedSelector((state) => {
    if (selected) {
      const id = selected.data.id;
      if (selected.data.id && state.resource.pluginInstanceStatus[id]) {
        return state.resource.pluginInstanceStatus[id].status;
      } else return;
    }
  });

  const finished = selected && status.includes(selected.data.status);

  React.useEffect(() => {
    if ((statusTitle && status.includes(statusTitle)) || finished) {
      if (download.error) {
        setDownload((state) => {
          return {
            ...state,
            error: "Files are ready for download now...",
          };
        });
      }

      if (selected && !pluginFilesPayload) {
        dispatch(
          getPluginFilesRequest({
            id: selected.data.id,
            path: selected.data.output_path,
          })
        );
      }

      if (download.error) {
        setTimeout(() => {
          setDownload(getInitialDownloadState);
        }, 3000);
      }
    }
  }, [
    selected,
    finished,
    dispatch,
    pluginFilesPayload,
    statusTitle,
    download.error,
  ]);

  const handleFileClick = (path: string) => {
    if (selected) {
      dispatch(
        getPluginFilesRequest({
          id: selected.data.id,
          path,
        })
      );
    }
  };

  const handleSidebarDrawer = (action: string) => {
    if (action === "close") {
      handleClose("directory", dispatch);
    } else if (action === "maximized") {
      handleMaximize("directory", dispatch);
    } else handleMinimize("directory", dispatch);
  };

  return {
    handleFileClick,
    filesLoading,
    plugins,
    statusTitle,
    download,
    selected,
    pluginFilesPayload,
    handleSidebarDrawer,
    sidebarStatus: drawerState.directory,
    filesStatus: drawerState.files,
    previewStatus: drawerState.preview,
  };
};
