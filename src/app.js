import './style.css';

class TextEditorApp extends HTMLElement {
  constructor() {
    super();
    this.templates = ['Template 1', 'Template 2', 'Template 3'];
    this.selectedTemplateIndex = -1;
    this.dropdownValues = {};
  }

  connectedCallback() {
    this.initEditor();
    this.renderTemplatesList();
    this.setupEventListeners();
  }

  initEditor() {
    if (typeof tinymce === 'undefined') {
      console.error('TinyMCE не загрузился.');
      return;
    }

    tinymce.init({
      selector: '#editor',
      plugins: 'lists link image table code help',
      toolbar:
        'undo redo | styles | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image',
      setup: (editor) => {
        window.editor = editor;
      },
    });
  }

  setupEventListeners() {
    this.querySelector('#insert-component').addEventListener('click', () =>
      this.insertDropdownComponent(),
    );
    this.querySelector('#add-template').addEventListener('click', () => this.addTemplate());
    this.querySelector('#remove-template').addEventListener('click', () => this.removeTemplate());

    const editInput = this.querySelector('#template-edit');
    editInput.addEventListener('blur', () => this.updateTemplate());
    editInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.updateTemplate();
    });
  }

  renderTemplatesList() {
    const templatesList = this.querySelector('#templates-list');
    templatesList.innerHTML = '';

    this.templates.forEach((template, index) => {
      const item = document.createElement('div');
      item.className = 'template-item';
      item.textContent = template;
      item.dataset.index = index;

      if (index === this.selectedTemplateIndex) {
        item.classList.add('selected');
      }

      item.addEventListener('click', () => {
        this.selectedTemplateIndex = index;
        this.querySelector('#template-edit').value = template;
        this.renderTemplatesList();
      });

      templatesList.appendChild(item);
    });
  }

  addTemplate() {
    const newTemplate = `Template ${this.templates.length + 1}`;
    this.templates.push(newTemplate);
    this.selectedTemplateIndex = this.templates.length - 1;
    this.querySelector('#template-edit').value = newTemplate;
    this.renderTemplatesList();
    this.updateAllDropdownComponents();
  }

  removeTemplate() {
    if (this.selectedTemplateIndex < 0 || this.templates.length === 0) return;

    const removedTemplate = this.templates[this.selectedTemplateIndex];
    this.templates.splice(this.selectedTemplateIndex, 1);

    if (this.templates.length === 0) {
      this.selectedTemplateIndex = -1;
      this.querySelector('#template-edit').value = '';
    } else {
      if (this.selectedTemplateIndex >= this.templates.length) {
        this.selectedTemplateIndex = this.templates.length - 1;
      }
      this.querySelector('#template-edit').value = this.templates[this.selectedTemplateIndex];
    }

    this.renderTemplatesList();
    this.updateAllDropdownComponents(removedTemplate);
  }
  updateTemplate() {
    const value = this.querySelector('#template-edit').value.trim();
    if (this.selectedTemplateIndex >= 0 && value) {
      const oldTemplate = this.templates[this.selectedTemplateIndex];
      this.templates[this.selectedTemplateIndex] = value;

      this.updateAllDropdownComponents(oldTemplate, value);
      this.renderTemplatesList();
    }
  }

  insertDropdownComponent() {
    const id = 'dropdown-' + Date.now();
    const optionsHtml = this.templates.map((t) => `<option value="${t}">${t}</option>`).join('');

    const html = `
    <select class="custom-dropdown" data-dropdown-id="${id}" style="min-width: 150px;">
      ${optionsHtml}
    </select>
  `;

    this.dropdownValues[id] = this.templates[0];

    window.editor.insertContent(html);

    this.attachDropdownChangeHandler();
  }

  attachDropdownChangeHandler() {
    const editorBody = window.editor.getBody();
    editorBody.querySelectorAll('.custom-dropdown').forEach((dropdown) => {
      dropdown.onchange = (e) => {
        const id = dropdown.dataset.dropdownId;
        this.dropdownValues[id] = dropdown.value;
      };
    });
  }

  updateAllDropdownComponents(removedTemplate) {
    const editor = window.editor;
    if (!editor) return;

    const content = editor.getContent();
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;

    const dropdowns = tempDiv.querySelectorAll('.custom-dropdown');

    dropdowns.forEach((dropdown) => {
      const id = dropdown.dataset.dropdownId;
      const currentValue = this.dropdownValues[id];

      const newSelect = document.createElement('select');
      newSelect.className = 'custom-dropdown';
      newSelect.dataset.dropdownId = id;

      if (currentValue && !this.templates.includes(currentValue)) {
        const errorOption = document.createElement('option');
        errorOption.value = 'ERROR';
        errorOption.textContent = 'ERROR';
        newSelect.appendChild(errorOption);
      } else {
        this.templates.forEach((template) => {
          const option = document.createElement('option');
          option.value = template;
          option.textContent = template;
          newSelect.appendChild(option);
        });
        if (currentValue) newSelect.value = currentValue;
      }

      dropdown.parentNode.replaceChild(newSelect, dropdown);
    });

    editor.setContent(tempDiv.innerHTML);
    this.attachDropdownChangeHandler();

    setTimeout(() => {
      editor.fire('change');
      editor.undoManager.add();
    }, 100);
  }
}

customElements.define('text-editor-app', TextEditorApp);
