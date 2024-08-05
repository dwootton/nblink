import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  IRouter
} from '@jupyterlab/application';
import {
  IDefaultFileBrowser,
  IFileBrowserFactory
} from '@jupyterlab/filebrowser';
import { INotebookTracker } from '@jupyterlab/notebook';
import { addSaveToUrlButton } from './toolbar';
import { addTempNotebookRoute } from './notebookRoute';
import { saveUrlParameters } from './urlUtils';

console.log('nblink extension loading');

const extension: JupyterFrontEndPlugin<void> = {
  id: 'nblink',
  autoStart: true,
  requires: [
    IDefaultFileBrowser,
    IFileBrowserFactory,
    IRouter,
    INotebookTracker
  ],
  activate: async (
    app: JupyterFrontEnd,
    defaultFileBrowser: IDefaultFileBrowser,
    filebrowserFactory: IFileBrowserFactory,
    router: IRouter,
    notebookTracker: INotebookTracker
  ) => {
    try {
      console.log('Activating nblink extension: new');

      router.register({
        command: 'notebook:start-nav',
        pattern: /(tempNotebook=1)/,
        rank: 20
      });

      addSaveToUrlButton(app, notebookTracker);
      saveUrlParameters();
      addTempNotebookRoute(app, defaultFileBrowser, filebrowserFactory, router);

      console.log('nblink extension activated successfully');
    } catch (error) {
      console.error('Error activating nblink extension:', error);
    }
  }
};

export default extension;
