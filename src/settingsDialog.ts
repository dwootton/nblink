import { Widget } from '@lumino/widgets';
import { getBasePath } from './urlUtils';

export class SettingsDialog extends Widget {
    private settings: {
        copyOutput: boolean;
        urlPath: string;
        openAsNotebook: boolean;
        customUrl: string | null;
      };

  private container: HTMLDivElement;

  constructor(
    private onSettingsChange: (settings: {
      copyOutput: boolean;
      urlPath: string;
      openAsNotebook: boolean;
      customUrl: string | null;
    }) => void,
    initialSettings: {
      copyOutput: boolean;
      urlPath: string;
      openAsNotebook: boolean;
      customUrl: string | null;
    }
  ) {
    super();
    const savedSettings = this.loadSettingsFromStorage();
    this.settings = savedSettings || { ...initialSettings };
    this.container = document.createElement('div');
    this.node.appendChild(this.container);
    this.buildDialog();
  }

  

  private buildDialog() {
    this.container.innerHTML = '';
    this.container.style.padding = '20px';
    this.container.style.maxWidth = '400px';
    this.container.style.width = '100%';
    this.container.style.boxSizing = 'border-box';
    this.container.style.fontFamily = 'Arial, sans-serif';

    const copyOutputSwitch = this.createSwitchControl(
      'Copy notebook output',
      this.settings.copyOutput,
      (checked) => this.updateSettings({ copyOutput: checked })
    );
    this.container.appendChild(copyOutputSwitch);

    const urlPathLabel = document.createElement('label');
    urlPathLabel.style.display = 'block';
    urlPathLabel.style.marginTop = '20px';
    urlPathLabel.style.marginBottom = '8px';
    urlPathLabel.style.fontWeight = 'bold';
    urlPathLabel.textContent = 'URL path:';
    this.container.appendChild(urlPathLabel);

    const urlPathSelect = document.createElement('select');
    urlPathSelect.style.width = '100%';
    urlPathSelect.style.padding = '8px';
    urlPathSelect.style.marginBottom = '15px';
    urlPathSelect.style.borderRadius = '4px';
    urlPathSelect.style.border = '1px solid #ccc';

    const paths = [
      { label: 'JupyterLite', value: '/lab/index.html', openAsNotebook: false },
      { label: 'JupyterLite Notebook', value: '/lab/index.html', openAsNotebook: true },
      //{ label: 'JupyterLab', value: '/lab/index.html', openAsNotebook: false },
      { label: 'Custom', value: 'custom', openAsNotebook: false }
    ];

    paths.forEach(path => {
      const option = document.createElement('option');
      option.value = JSON.stringify(path);
      option.textContent = path.label;
      if (
        (path.value === this.settings.urlPath && path.openAsNotebook === this.settings.openAsNotebook) ||
        (path.value === 'custom' && this.settings.customUrl !== null)
      ) {
        option.selected = true;
      }
      urlPathSelect.appendChild(option);
    });
  

    this.container.appendChild(urlPathSelect);

    const urlDisplay = document.createElement('p');
    urlDisplay.style.fontSize = '0.9em';
    urlDisplay.style.color = '#666';
    urlDisplay.style.marginTop = '10px';
    urlDisplay.style.marginBottom = '15px';
    urlDisplay.style.wordBreak = 'break-all';
    this.container.appendChild(urlDisplay);

    const customUrlInput = document.createElement('input');
    customUrlInput.type = 'text';
    customUrlInput.placeholder = 'Enter custom URL';
    customUrlInput.style.width = '100%';
    customUrlInput.style.display = this.settings.customUrl !== null ? 'block' : 'none';
    customUrlInput.value = this.settings.customUrl || '';
    this.container.appendChild(customUrlInput);

    const customDisplay = document.createElement('p');
    customDisplay.style.fontSize = '0.9em';
    customDisplay.style.color = '#666';
    customDisplay.style.marginTop = '8px';
    customDisplay.style.marginBottom = '15px';
    customDisplay.style.wordBreak = 'break-all';
    customDisplay.style.display = this.settings.customUrl !== null ? 'block' : 'none';
    customDisplay.textContent = `Custom urls should link to the /lab/index.html path for your jupyterlab/lite instance.`;
    this.container.appendChild(customDisplay);

    urlPathSelect.addEventListener('change', () => {
      const selectedOption = JSON.parse(urlPathSelect.value);
      
      if (selectedOption.value === 'custom') {
        // Custom URL option selected
        customUrlInput.style.display = 'block';
        customDisplay.style.display = 'block';
        
        // If there's a previously saved custom URL, use it
        if (this.settings.customUrl) {
          customUrlInput.value = this.settings.customUrl;
        } else {
          customUrlInput.value = ''; // Clear the input if no custom URL was saved
        }
        
        this.updateSettings({ 
          urlPath: 'custom', 
          openAsNotebook: false,
          customUrl: customUrlInput.value || null
        });
      } else {
        // Standard option selected
        customUrlInput.style.display = 'none';
        customDisplay.style.display = 'none';
        
        this.updateSettings({ 
          urlPath: selectedOption.value, 
          openAsNotebook: selectedOption.openAsNotebook,
          customUrl: null
        });
      }
      
      this.updateUrlDisplay(urlDisplay);
    });
  
      customUrlInput.addEventListener('input', () => {
        this.updateSettings({ 
          urlPath: 'custom',
          openAsNotebook: false,
          customUrl: customUrlInput.value || null
        });
        this.updateUrlDisplay(urlDisplay);
      });
  
      this.updateUrlDisplay(urlDisplay);
  }

  private updateUrlDisplay(element: HTMLElement) {
    if (this.settings.urlPath === 'custom' && this.settings.customUrl) {
      element.textContent = `Links to: ${this.settings.customUrl}`;
    } else {
      const currentUrl = window.location.href;
      const basePath = getBasePath(currentUrl);
      const labPath = this.settings.urlPath.replace('/notebooks/', '/lab/');
      element.textContent = `Links to: ${basePath}${labPath}`;
    }
  }

  private createSwitchControl(label: string, initialState: boolean, onChange: (checked: boolean) => void) {
    const container = document.createElement('label');
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.marginBottom = '15px';
    container.style.cursor = 'pointer';

    const switchElem = document.createElement('div');
    switchElem.style.width = '40px';
    switchElem.style.height = '20px';
    switchElem.style.backgroundColor = initialState ? '#4CAF50' : '#ccc';
    switchElem.style.borderRadius = '10px';
    switchElem.style.position = 'relative';
    switchElem.style.transition = 'background-color 0.3s';
    switchElem.style.marginRight = '10px';

    const switchHandle = document.createElement('div');
    switchHandle.style.width = '18px';
    switchHandle.style.height = '18px';
    switchHandle.style.backgroundColor = 'white';
    switchHandle.style.borderRadius = '50%';
    switchHandle.style.position = 'absolute';
    switchHandle.style.top = '1px';
    switchHandle.style.left = initialState ? '21px' : '1px';
    switchHandle.style.transition = 'left 0.3s';

    switchElem.appendChild(switchHandle);
    container.appendChild(switchElem);
    container.appendChild(document.createTextNode(label));

    container.addEventListener('click', () => {
      const newState = switchHandle.style.left === '1px';
      switchHandle.style.left = newState ? '21px' : '1px';
      switchElem.style.backgroundColor = newState ? '#4CAF50' : '#ccc';
      onChange(newState);
    });

    return container;
  }

  private updateSettings(partialSettings: Partial<{ copyOutput: boolean;
    urlPath: string;
    openAsNotebook: boolean;
    customUrl: string | null;}>) {
    this.settings = { ...this.settings, ...partialSettings };
    this.onSettingsChange(this.settings);
    this.saveSettingsToStorage();

  }

  private saveSettingsToStorage() {
    localStorage.setItem('urlifySettings', JSON.stringify(this.settings));
  }
  
  private loadSettingsFromStorage(): {
    copyOutput: boolean;
    urlPath: string;
    openAsNotebook: boolean;
    customUrl: string | null;
  } | null {
    const savedSettings = localStorage.getItem('urlifySettings');
    return savedSettings ? JSON.parse(savedSettings) : null;
  }

  
}
