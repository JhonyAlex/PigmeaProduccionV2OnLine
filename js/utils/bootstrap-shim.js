/**
 * Implementación básica de componentes Bootstrap usando Tailwind.
 * Solo se cubre lo necesario para que el código existente funcione.
 */
class SimpleModal {
  constructor(element) {
    this.element = element;
    this.backdrop = null;
    element.__simpleModalInstance = this;
  }

  show() {
    this.element.classList.add('show');
    this.element.classList.remove('hidden');
    this.createBackdrop();
  }

  hide() {
    this.element.classList.remove('show');
    this.element.classList.add('hidden');
    this.removeBackdrop();
  }

  createBackdrop() {
    if (this.backdrop) return;
    this.backdrop = document.createElement('div');
    this.backdrop.className = 'modal-backdrop';
    document.body.appendChild(this.backdrop);
    this.backdrop.addEventListener('click', () => this.hide());
  }

  removeBackdrop() {
    if (this.backdrop) {
      this.backdrop.remove();
      this.backdrop = null;
    }
  }

  static getInstance(element) {
    return element.__simpleModalInstance || null;
  }

  static getOrCreateInstance(element) {
    return SimpleModal.getInstance(element) || new SimpleModal(element);
  }
}

class SimpleAlert {
  constructor(element) {
    this.element = element;
  }

  close() {
    this.element.remove();
  }
}

function initDismissButtons() {
  document.addEventListener('click', (e) => {
    const dismiss = e.target.closest('[data-bs-dismiss="modal"]');
    if (dismiss) {
      const modalEl = dismiss.closest('.modal');
      if (modalEl) {
        const modal = SimpleModal.getOrCreateInstance(modalEl);
        modal.hide();
      }
    }
  });
}

function initCollapse() {
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-bs-toggle="collapse"]');
    if (trigger) {
      const targetSelector = trigger.getAttribute('data-bs-target');
      if (targetSelector) {
        const target = document.querySelector(targetSelector);
        if (target) {
          target.classList.toggle('hidden');
        }
      }
    }
  });
}

initDismissButtons();
initCollapse();

window.bootstrap = { Modal: SimpleModal, Alert: SimpleAlert };
