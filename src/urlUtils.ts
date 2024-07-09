import * as LZString from 'lz-string';
import { Dialog, showDialog } from '@jupyterlab/apputils';
import { Clipboard } from '@jupyterlab/apputils';

export let savedParams: URLSearchParams | null = null;

export function saveUrlParameters(): void {
  const urlParams = new URLSearchParams(window.location.hash.slice(1));
  savedParams = urlParams;
  console.log('Saved URL parameters:', savedParams.toString());
}

export function decompressSavedContent(): any | null {
  if (savedParams) {
    const compressedContent = savedParams.get('notebook');
    if (compressedContent) {
      const decompressedContent = LZString.decompressFromEncodedURIComponent(compressedContent);
      const content = JSON.parse(decompressedContent);
      console.log('decompressedContent', content);
      return content;
    }
  }
  return null;
}
export function showToast(message: string, anchorEl: HTMLElement, duration = 2000) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.position = 'absolute';
    toast.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    toast.style.color = 'white';
    toast.style.padding = '10px 20px';
    toast.style.borderRadius = '5px';
    toast.style.zIndex = '1000';
    toast.style.fontSize = '14px';
  
    // Position the toast
    const rect = anchorEl.getBoundingClientRect();
    toast.style.top = `${rect.bottom + 10}px`;
    toast.style.left = `${rect.left}px`;
  
    document.body.appendChild(toast);
  
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.5s ease';
      setTimeout(() => document.body.removeChild(toast), 500);
    }, duration);
  }

export async function compressNotebookContent(
  notebookPanel: any,
  settings: { copyOutput: boolean; urlPath: string; openAsNotebook: boolean,  customUrl: string | null; },
  anchorEl: HTMLElement

) {
  let notebookContent: any = notebookPanel.context.model.toJSON();

  if (!settings.copyOutput) {
    notebookContent.cells = notebookContent.cells.map((cell: any) => {
      if (cell.cell_type === 'code') {
        cell.outputs = [];
        cell.execution_count = null;
      }
      return cell;
    });
  }

  const stringContent = JSON.stringify(notebookContent);

  if (stringContent.length > 10000) {
    const result = await showDialog({
      title: 'Large Notebook',
      body: 'The notebook content exceeds 10,000 characters. Do you want to continue with the full content or copy only inputs?',
      buttons: [
        Dialog.cancelButton(),
        Dialog.okButton({ label: 'Full Content' }),
        Dialog.okButton({ label: 'Inputs Only' })
      ]
    });

    if (result.button.label === 'Inputs Only') {
      notebookContent.cells = notebookContent.cells.map((cell: any) => {
        if (cell.cell_type === 'code') {
          cell.outputs = [];
          cell.execution_count = null;
        }
        return cell;
      });
    } else if (result.button.accept === false) {
      return; // User cancelled
    }
  }

  const compressedContent = LZString.compressToEncodedURIComponent(JSON.stringify(notebookContent));

  let url: URL;

  if (settings.urlPath === 'custom' && settings.customUrl) {
    url = new URL(settings.customUrl);
  } else {
    const currentUrl = window.location.href;
    const basePath = getBasePath(currentUrl);
    
    // Ensure we're using 'lab' in the path, not 'notebooks'
    const labPath = settings.urlPath.replace('/notebooks/', '/lab/');
    
    url = new URL(`${basePath}${labPath}`);
  }

  // Add the hash and query parameters
  url.hash = `notebook=${compressedContent}`;
  url.searchParams.set('tempNotebook', '1');
  url.searchParams.set('path', 'temp.ipynb');
  
  if (settings.openAsNotebook) {
    url.searchParams.set('openAsNotebook', '1');
  }

  console.log('new url', url.toString());

  const newUrl = url.toString();

  Clipboard.copyToSystem(newUrl)
  showToast('Copied to clipboard', anchorEl);
  
  
}

// gets base path for jupyter lite: 
export function getBasePath(currentUrl: string): string {
  const url = new URL(currentUrl);
  const pathParts = url.pathname.split('/');
  const labIndex = pathParts.indexOf('lab');
  const notebooksIndex = pathParts.indexOf('notebooks');

  if (labIndex !== -1) {
    return url.origin + pathParts.slice(0, labIndex).join('/');
  } else if (notebooksIndex !== -1) {
    return url.origin + pathParts.slice(0, notebooksIndex).join('/');
  }

  // If neither 'lab' nor 'notebooks' is found, return the origin
  return url.origin;
}
