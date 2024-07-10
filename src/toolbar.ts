import { JupyterFrontEnd } from '@jupyterlab/application';
import { INotebookTracker } from '@jupyterlab/notebook';
import { ToolbarButton, showDialog, Dialog } from '@jupyterlab/apputils';
import { settingsIcon } from '@jupyterlab/ui-components';
import { SettingsDialog } from './settingsDialog';
import { compressNotebookContent } from './urlUtils';

let settings = {
  copyOutput: false,
  openAsNotebook: true,
  urlPath: '/lab/index.html',
  customUrl: (null as string | null)
};

export function addSaveToUrlButton(
  app: JupyterFrontEnd,
  notebookTracker: INotebookTracker
) {
    const saveToUrlButton = new ToolbarButton({
        label: 'Save to URL',
        onClick: () => {
          const current = notebookTracker.currentWidget;
          console.log('in press', current, settings);
          if (current) {
            // Pass the button element to compressNotebookContent
            compressNotebookContent(current, settings, saveToUrlButton.node);
          }
        },
        tooltip: 'Save notebook content to URL and copy to clipboard'
      });
  

  const settingsButton = new ToolbarButton({
    icon: settingsIcon,
    onClick: () => {
      const dialog = new SettingsDialog(newSettings => {
        settings = newSettings;
      }, settings);

      showDialog({
        title: 'Save to URL Settings',
        body: dialog,
        buttons: [Dialog.okButton()]
      });
    },
    tooltip: 'Save to URL Settings'
  });
  
  notebookTracker.widgetAdded.connect((sender, panel) => {
    console.log('added', saveToUrlButton, settingsButton, panel.toolbar);
    panel.toolbar.insertItem(10, 'saveToUrl', saveToUrlButton);
    panel.toolbar.insertItem(11, 'settingsButton', settingsButton);
  });
}