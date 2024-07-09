import { JupyterFrontEnd, IRouter } from '@jupyterlab/application';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { NotebookModel } from '@jupyterlab/notebook';
import { UUID } from '@lumino/coreutils';
import { decompressSavedContent } from './urlUtils';

export function addTempNotebookRoute(
    app: JupyterFrontEnd,
    filebrowserFactory: IFileBrowserFactory,
    router: IRouter
  ): void {
    if (router) {
      app.commands.addCommand('notebook:start-nav', {
        label: 'Open Temp Notebook from URL',
        execute: async args => {
          const { request } = args as IRouter.ILocation;
          const url = new URL(`http://example.com${request}`);
          const params = url.searchParams;
          const isTempNotebook = params.get('tempNotebook');
          const openAsNotebook = params.get('openAsNotebook') === '1';
  
          const createFromURLRoute = async () => {
            router.routed.disconnect(createFromURLRoute);
            if (isTempNotebook && isTempNotebook === '1') {
                await app.commands.execute('notebook:open-temp', {openAsNotebook});
            }
          };
  
          router.routed.connect(createFromURLRoute);
        }
      });
  
      app.commands.addCommand('notebook:open-temp', {
        label: 'Open Temporary Notebook',
        execute: async args => {
          const createNew = async (
            cwd: string,
            kernelId: string,
            kernelName: string,
            openAsNotebook: boolean
          ) => {
            const model = await app.commands.execute('docmanager:new-untitled', {
              path: cwd,
              type: 'notebook'
            });
  
            if (model !== undefined) {
              const widget = await app.commands.execute('docmanager:open', {
                path: model.path,
                factory: 'Notebook',
                kernel: { id: kernelId, name: kernelName }
              });
  
              widget.isUntitled = true;
              const tempId = `temp-notebook-${UUID.uuid4()}`;
              await widget.context.rename(tempId + '.ipynb');
  
              const content = decompressSavedContent();
              if (content) {
                const notebookModel = widget.context.model as NotebookModel;
                notebookModel.fromJSON(content);
                await widget.context.save();
              }
  
              if (openAsNotebook) {
                redirectToNotebookView(widget.context.path);
              }
  
              return widget;
            }
          };
  
          //@ts-ignore
          const currentBrowser = filebrowserFactory?.tracker.currentWidget ?? filebrowserFactory.defaultBrowser;
          const cwd = (args['cwd'] as string) || (currentBrowser?.model.path ?? '');
          const kernelId = (args['kernelId'] as string) || '';
          const kernelName = (args['kernelName'] as string) || '';
          const openAsNotebook = args['openAsNotebook'] as boolean;
  
          await createNew(cwd, kernelId, kernelName, openAsNotebook);
        }
      });
    }
  }
  
  function redirectToNotebookView(notebookPath: string) {
    const currentUrl = new URL(window.location.href);
    let baseUrl = currentUrl.origin;
    
    if (currentUrl.pathname.includes('/jupyterlite/')) {
      baseUrl += '/jupyterlite';
    }
    
    const newUrl = `${baseUrl}/notebooks/index.html?path=${notebookPath}`;
    window.location.href = newUrl;
  }

  /*
export function addTempNotebookRoute(
  app: JupyterFrontEnd,
  filebrowserFactory: IFileBrowserFactory,
  router: IRouter
): void {
  if (router) {
    app.commands.addCommand('notebook:start-nav', {
      label: 'Open Temp Notebook from URL',
      execute: async args => {
        const { request } = args as IRouter.ILocation;
        const url = new URL(`http://example.com${request}`);
        const params = url.searchParams;
        const isTempNotebook = params.get('tempNotebook');
        const openAsNotebook = params.get('openAsNotebook') === '1';

        const createFromURLRoute = async () => {
          router.routed.disconnect(createFromURLRoute);
          if (isTempNotebook && isTempNotebook === '1') {
            const widget = await app.commands.execute('notebook:open-temp', {});
            if (openAsNotebook && widget) {
              redirectToNotebookView(widget.context.path);
            }
          }
        };

        router.routed.connect(createFromURLRoute);
      }
    });

    app.commands.addCommand('notebook:open-temp', {
      label: 'Open Temporary Notebook',
      execute: async args => {
        const createNew = async (
          cwd: string,
          kernelId: string,
          kernelName: string
        ) => {
          const model = await app.commands.execute('docmanager:new-untitled', {
            path: cwd,
            type: 'notebook'
          });

          if (model !== undefined) {
            const widget = await app.commands.execute('docmanager:open', {
              path: model.path,
              factory: 'Notebook',
              kernel: { id: kernelId, name: kernelName }
            });

            widget.isUntitled = true;
            const tempId = `temp-notebook-${UUID.uuid4()}`;
            await widget.context.rename(tempId + '.ipynb');

            const content = decompressSavedContent();
            if (content) {
              const notebookModel = widget.context.model as NotebookModel;
              notebookModel.fromJSON(content);
              await widget.context.save();
            }

            updateUrlWithNotebookPath(widget.context.path);
            return widget;
          }
        };

        //@ts-ignore
        const currentBrowser = filebrowserFactory?.tracker.currentWidget ?? filebrowserFactory.defaultBrowser;
        const cwd = (args['cwd'] as string) || (currentBrowser?.model.path ?? '');
        const kernelId = (args['kernelId'] as string) || '';
        const kernelName = (args['kernelName'] as string) || '';

        await createNew(cwd, kernelId, kernelName);
      }
    });
  }
}

function redirectToNotebookView(notebookPath: string) {
    const currentUrl = new URL(window.location.href);
    let baseUrl = currentUrl.origin;
    
    if (currentUrl.pathname.includes('/jupyterlite/')) {
      baseUrl += '/jupyterlite';
    }
    
    const newUrl = `${baseUrl}/notebooks/index.html?path=${notebookPath}`;
    window.location.href = newUrl;
  }

function updateUrlWithNotebookPath(notebookPath: string) {
  const currentUrl = new URL(window.location.href);
  
  // Extract the base URL
  let baseUrl = currentUrl.origin;
  
  // Check if the URL contains '/jupyterlite/'
  if (currentUrl.pathname.includes('/jupyterlite/')) {
    baseUrl += '/jupyterlite';
  }
  
  // Determine if we should open in notebook or lab view
  const openAsNotebook = currentUrl.searchParams.get('openAsNotebook') === '1';
  
  // Construct the new URL
  let newUrl = `${baseUrl}/${openAsNotebook ? 'notebooks' : 'lab'}/index.html`;
  
  // Add the path and other query parameters
  newUrl += `?path=${notebookPath}`;
  currentUrl.searchParams.forEach((value, key) => {
    if (key !== 'path' && key !== 'openAsNotebook') {
      newUrl += `&${key}=${value}`;
    }
  });
  
  // Add the hash (notebook content)
  newUrl += currentUrl.hash;
  
  // Redirect to the new URL
  window.location.href = newUrl;
}
  */